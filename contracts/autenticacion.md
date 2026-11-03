---
id: contracts-auth
name: Contrato — Auth
description: Canje de la clave de acceso, login, refresh y logout. Auth mínima del sprint de onboarding.
type: contract
---
# Auth — canje de la clave, login y sesión

Login con JWT y refresh, y **segundo factor TOTP obligatorio** (D94). Ver
`conventions.md` para el sobre y los errores.

**Entidades:** `access_keys`, `users` (`modelo-datos.md` §4.2, §5.2, §5.3).

`users.name` y `users.last_name` se añadieron al modelo el 2026-09-26 (`modelo-datos.md` §5.2) y **desde D51
(2026-10-05) son opcionales**: el administrador de la empresa se identifica por su correo y la activación solo le pide la
contraseña. En los responses `name` y `last_name` pueden venir `null`; la UI muestra el correo cuando no hay nombre.
**App:** Monkey Platform (`Frontend-Platform`) y Monkey Admin (`Frontend`) comparten estos
endpoints.

> **Segundo factor (D94, SEG-16).** Con MFA_REQUIRED activo (por defecto), ni login ni 
edeem abren la sesión: devuelven un **paso intermedio** y la sesión se abre en mfa/verify o mfa/setup/confirm. Ver «Segundo factor» más abajo.

## Activación de la cuenta: dos pasos (D51)

La pantalla de activación de Monkey Platform es de **dos pasos**:

1. **Solo el código.** `POST /v1/auth/redeem/lookup` comprueba la clave **sin gastarla** y devuelve lo que Monkey Admin
   ya fijó para la empresa.
2. **Datos fijos + contraseña.** Se muestran la razón social y el correo administrativo **bloqueados** (no se editan) y
   solo se pide la contraseña y su confirmación. Con eso se llama a `POST /v1/auth/redeem`.

### `POST /v1/auth/redeem/lookup` — paso 1

Público. Request: `{ "code": "MNK-7F3A-92KD-5QXB" }`. `200`:

```json
{
  "statusCode": 200,
  "message": "auth.access_key_found",
  "data": {
    "company": { "name": "Next Audit & Consulting S.A.S." },
    "admin_email": "ana.perez@ejemplo.com",
    "expires_at": "2026-10-12T09:12:44Z"
  }
}
```

Errores (los mismos del canje, para no revelar más de la cuenta): `404 ACCESS_KEY_INVALID` (no existe, o la empresa no
está activa), `409 ACCESS_KEY_ALREADY_USED`, `409 ACCESS_KEY_EXPIRED` y `429 ACCESS_KEY_RATE_LIMITED`. Cada intento fallido se
audita (`access_key.lookup`) y cuenta para el límite: **10 fallos por dirección cada 15 minutos**, compartido con el canje
(DT-37). No devuelve nada si la clave no es canjeable.

**Seguridad:** este endpoint revela la razón social y el correo administrativo a quien tenga el código. Es aceptable porque
el código es de 12 caracteres aleatorios, se entrega solo al cliente y el límite impide adivinarlo; el correo ya es la
condición para canjearlo (D43).

## `POST /v1/auth/redeem` — canjear la clave y crear `admin_empresa` (paso 2)

Primer acceso del cliente. Crea su cuenta con la clave que le entregó `admin_monkey`. **Solo se pide la contraseña**: el
correo es el administrativo que registró Monkey y no se pide ni se edita nombre ni apellido (D51).

Es un **código que el cliente escribe** (formato `MNK-XXXX-XXXX-XXXX`, con o sin guiones). La pregunta abierta P2(a) sigue sin
respuesta explícita del comité: el flujo implementado asume el código.

```json
{
  "code": "MNK-7F3A-92KD-5QXB",
  "email": "ana.perez@ejemplo.com",
  "password": "UnaClaveLarga123!"
}
```

`201` — la cookie de sesión viaja en `Set-Cookie`, no en el cuerpo.

```json
{
  "statusCode": 201,
  "message": "auth.account_created",
  "data": {
    "user": {
      "id": "c4a1f2e8-9b30-4d5a-b7e1-6f8c0d2a3b44",
      "email": "ana.perez@ejemplo.com",
      "name": null,
      "last_name": null,
      "role": "admin_empresa",
      "status": "active",
      "is_mfa_enabled": false,
      "last_login_at": null,
      "created_at": "2026-10-01T09:12:44Z"
    },
    "company": {
      "id": "8f14e45f-ceea-467a-9b3c-2a1d7f0e4b12",
      "name": "Next Audit & Consulting S.A.S."
    },
    "onboarding": { "next_step": "organizational_context", "completed_steps": [] }
  }
}
```

`company.name` viene de `companies` y es lo que el Componente 1 mostrará **precargado y
bloqueado**. `onboarding.next_step` dice al frontend dónde continuar sin que lo adivine. `user.name` y `user.last_name` son `null`
hasta que se completen en el perfil.

La contraseña debe cumplir la política de `modelo-datos.md` §5.3: **12+ caracteres con
complejidad**. Se valida en el servidor, y el error va por campo.

## `POST /v1/auth/login`

```json
{ "email": "ana.perez@ejemplo.com", "password": "UnaClaveLarga123!" }
```

`200` con el mismo objeto `user` + `company` del canje. La sesión va en cookie `httpOnly`. **Con el segundo factor obligatorio, `200` con `data: { next_step, expires_at }` y sin sesión** (ver «Segundo factor»). El cliente distingue por la presencia de `next_step`.

Política de sesión (§5.3): **30 min de inactividad, 8 h máximo**. Bloqueo a los **5 intentos
fallidos, por 15 min**.

⚠️ El código actual del Backend setea la cookie a 3 h en login y 15 min en refresh, lo que no
cuadra con la política ni consigo mismo. El contrato fija: access token **15 min**, refresh
hasta el máximo de 8 h de sesión.

## Segundo factor (D94)

**Desafío.** Contraseña correcta (o canje de la clave) → `data: { next_step, expires_at }` y la cookie `httpOnly` `mnk_mfa` (5 minutos, un solo uso, ruta `/v1/auth/mfa`). `next_step` es `mfa_verify` (ya tiene el factor) o `mfa_setup` (debe configurarlo; también lo devuelve `redeem`, con `201`). Sin cookie `mnk_mfa` válida, los endpoints `mfa/*` de abajo responden `401 MFA_CHALLENGE_INVALID` y el cliente vuelve a la pantalla de ingreso.

| Endpoint | Cuerpo | Respuesta |
| --- | --- | --- |
| `POST /v1/auth/mfa/verify` | `{ "code": "123456" }` **o** `{ "recovery_code": "K7QWM-3PZ9T" }` | `200` con `user` + `company` + `onboarding` (como el login) y las cookies de sesión; con un código de recuperación, además `recovery_codes_left` |
| `POST /v1/auth/mfa/setup` | — | `200` `{ secret, otpauth_uri, issuer, account }`. Idempotente: devuelve el mismo secreto mientras el desafío viva. **El QR se dibuja en el navegador** con `otpauth_uri`; el secreto no se manda a ningún servicio externo |
| `POST /v1/auth/mfa/setup/confirm` | `{ "code": "123456" }` | `200` como el login **más `recovery_codes`** (10, `XXXXX-XXXXX`, **se muestran una sola vez**); abre la sesión |
| `POST /v1/auth/mfa/recovery-codes` | `{ "code": "123456" }` (con sesión) | `200` `{ recovery_codes }`; los anteriores dejan de servir |
| `DELETE /v1/users/{id}/mfa` | — | `204`. Solo `admin_empresa`, sobre `funcional` o `auditor` de su empresa y nunca sobre sí mismo. Borra el secreto y los códigos y cierra las sesiones de esa persona |

- **Reglas:** TOTP RFC 6238 (SHA-1, 6 dígitos, 30 s, ±1 paso); un código ya usado no sirve otra vez; un código equivocado suma al bloqueo de la cuenta (5 intentos, 15 min) y al del desafío (5, luego hay que reingresar).
- **Restablecer al `admin_empresa`:** no hay endpoint; Monkey lo hace con `npm run mfa:reset` (D94, punto 8).
- **`MFA_REQUIRED`** (variable de entorno, por defecto `true`): en `false` el login abre la sesión directo. En producción el Backend no arranca con `false`.
- **`is_mfa_enabled`** del `user` indica si la persona ya configuró su factor.
## Activación de una cuenta que crea el administrador (D95, D96)

Una cuenta que crea el `admin_empresa` —`funcional` o `auditor`— nace `pending` y la persona la activa con un código de un solo uso, en dos pasos como el canje de la clave. **El alta, el detalle y los errores están en `contracts/gestion-usuarios.md`** (un dato, un dueño). Los códigos de activación comparten el freno de intentos de las claves de acceso.

| Endpoint | Qué hace |
| --- | --- |
| `POST /v1/auth/activate/lookup` | `{ code }` → `{ email, expires_at }`. No gasta el código |
| `POST /v1/auth/activate` | `{ code, email, password }` → como el canje: `201` con `next_step: mfa_setup` y la cookie `mnk_mfa` (sin sesión) |
## Contraseña: cambio y recuperación (SEG-14, D101)

**La contraseña no vence por calendario** (D101): rotarla a la fuerza cansa a la persona, la lleva a elegir claves más débiles o parecidas a la anterior, y no protege si los datos ya se filtraron. Lo que sí hay es el control en manos de la persona: cambiarla cuando quiera y recuperarla si la olvidó. Cambiarla además es la respuesta ante una sospecha. `users.password_changed_at` se conserva (cuándo se cambió por última vez) pero ya no gobierna ningún acceso.

Reglas comunes de toda contraseña nueva: la política de SEG-13, **distinta de la actual y de las 5 anteriores** (`422 PASSWORD_REUSED`). Al guardarla se cierran las demás sesiones de la persona, se audita (`auth.password_changed` o `auth.password_reset`, sin la contraseña) y se le avisa por correo. Guardarla no limpia el bloqueo de la cuenta.

### Cambio voluntario — `POST /v1/auth/password/change` (con sesión)

```json
{ "current_password": "…", "new_password": "…", "code": "123456" }
```

`code` es el TOTP vigente de la propia persona (*step-up*, el mismo de D97) **o** se envía `recovery_code`. `204`; la sesión actual sigue y las demás se cierran.

- Contraseña actual equivocada → `403 CURRENT_PASSWORD_INVALID`; suma al bloqueo de la cuenta (5 intentos, 15 min).
- Código equivocado → `401 MFA_CODE_INVALID`; suma igual.
- Más de **3 cambios en 24 h** → `429 PASSWORD_CHANGE_LIMIT` (evita rotar hasta volver a la anterior).

### Olvidé mi contraseña

1. `POST /v1/auth/password/forgot` `{ "email" }` → **siempre `202`** y el mismo cuerpo, exista o no la cuenta (no revela cuentas). Solo envía el correo a una cuenta `active`. El enlace es de **un solo uso, dura 30 min**, se guarda solo como HMAC y uno nuevo invalida los anteriores. Límite: 5 enlaces por cuenta cada hora; pasado ese tope sigue respondiendo `202` y no envía otro (así el límite tampoco delata la cuenta). No hay tope por dirección en las rutas públicas todavía: necesita saber la IP real detrás del proxy (DT-37).
2. `POST /v1/auth/password/reset` `{ "token", "new_password", "code" | "recovery_code" }` → `204`. Exige también el segundo factor. Enlace que no sirve (no existe, venció, ya se usó): `401 PASSWORD_RESET_INVALID`. Cierra **todas** las sesiones de la persona; entra de nuevo con la contraseña nueva.
3. ¿Perdió también el segundo factor? El `admin_empresa` lo restablece (`DELETE /v1/users/{id}/mfa`, D94) y Monkey al administrador por script; luego repite el paso 1.

Una cuenta `pending` no tiene contraseña que recuperar: se activa con su código (D95).

## `POST /v1/auth/refresh`

Sin cuerpo; usa la cookie de refresh. `200` con `data: null` y cookies renovadas. Pasado el
máximo de 8 h devuelve `401 SESSION_EXPIRED` y obliga a login.

## `POST /v1/auth/logout`

Sin cuerpo. `204`, cookies invalidadas.

## `GET /v1/auth/me`

`200` con `user`, `company` y `onboarding` — el mismo objeto del login. Es lo que el frontend
llama al arrancar para saber si hay sesión y dónde continuar.

## Errores

| HTTP | `error.code`              | Cuándo                                                                                |
| ---- | --------------------------- | -------------------------------------------------------------------------------------- |
| 401  | `INVALID_CREDENTIALS`     | Email o contraseña incorrectos.**Nunca distingue cuál de los dos**             |
| 401  | `SESSION_EXPIRED`         | Refresh pasado el máximo de 8 h                                                       |
| 403  | `ACCOUNT_LOCKED`          | 5 intentos fallidos; incluye`retry_after_seconds`                                    |
| 403  | `ACCOUNT_INACTIVE`        | El usuario está`inactive` o `suspended`                                           |
| 404  | `ACCESS_KEY_INVALID`      | La clave no existe.**Misma respuesta que si expiró**, para no revelar si existe |
| 409  | `ACCESS_KEY_ALREADY_USED` | La clave ya se canjeó                                                                 |
| 409  | `ACCESS_KEY_EXPIRED`      | Pasó`expires_at`                                                                    |
| 409  | `EMAIL_TAKEN`             | Ese email ya existe (`users.email` es único global y se guarda en minúsculas, D29)             |
| 422  | `VALIDATION_FAILED`       | Contraseña que no cumple la política, email inválido                                |
| 422  | `ACCESS_KEY_EMAIL_MISMATCH` | El correo del canje no es el `admin_email` registrado para la empresa (D43). La clave sigue pendiente |
| 401  | `MFA_CHALLENGE_INVALID` | No hay desafío, expiró, ya se usó o se agotaron sus 5 intentos. El cliente vuelve al ingreso |
| 401  | `MFA_CODE_INVALID`      | El código (o el de recuperación) es incorrecto o ya se usó. Cuenta como intento fallido |
| 409  | `MFA_SETUP_NOT_STARTED` | Se confirmó la configuración sin haber pedido el QR (`mfa/setup`) |
| 409  | `MFA_NOT_ENABLED`       | Se pidió regenerar códigos o restablecer a alguien que no tiene el segundo factor |
| 403  | `CURRENT_PASSWORD_INVALID` | La contraseña actual del cambio voluntario es incorrecta. Suma al bloqueo de la cuenta |
| 422  | `PASSWORD_REUSED`         | La contraseña nueva es la actual o una de las 5 anteriores |
| 429  | `PASSWORD_CHANGE_LIMIT`   | Más de 3 cambios en 24 h |
| 401  | `PASSWORD_RESET_INVALID`  | El enlace de recuperación no existe, venció o ya se usó (no se dice cuál) |
| 429  | `RATE_LIMITED`            | Más de 100 peticiones por minuto por usuario o de 1000 por empresa (SEG-19); incluye `retry_after_seconds` y la cabecera `Retry-After`. Solo en rutas con sesión |
| 429  | `ACCESS_KEY_RATE_LIMITED` | 10 intentos fallidos con la clave en 15 min desde una misma dirección (`redeem` y `redeem/lookup`; D51, DT-37) |

Claves i18n: `auth.account_created`, `auth.logged_in`, `auth.logged_out`,
`auth.invalid_credentials`, `auth.session_expired`, `auth.account_locked`,
`auth.account_inactive`, `auth.mfa_required`, `auth.mfa_setup_required`, `auth.mfa_setup_started`, `auth.mfa_enabled`, `auth.mfa_recovery_regenerated`, `auth.password_changed`, `auth.password_reset_requested`, `auth.current_password_invalid`, `auth.password_reused`, `auth.password_change_limit`, `auth.password_reset_invalid`, `access_key.invalid`, `access_key.already_used`,
`access_key.expired`, `auth.access_key_found`, `auth.access_key_rate_limited`, `user.email_taken`, `validation.failed`.

## Notas

- **Toda autorización se verifica en cada request** (§5.3), con caché de 5 min. No se confía en
  el frontend.
- El canje es de **un solo uso**: al consumirla, `access_keys.status` pasa a `used` y se sella
  `used_at`.
- Las tres acciones de este módulo (canje, creación de usuario) se registran en `audit_logs`
  con usuario, IP y user agent (MD-92).
- El RBAC completo queda fuera del sprint: el onboarding asume un `admin_empresa` autenticado.

## Preguntas abiertas

De `datos/pendientes/empresas.md` P2, **las más urgentes son (a) y (c)**.

|   | Pregunta                                             | Qué define aquí                                                     |
| - | ---------------------------------------------------- | --------------------------------------------------------------------- |
| a | ¿Código escrito a mano o link con token en la URL? | Si el request lleva`code` o `token`, y qué pantalla se construye |
| b | ¿Caducidad y reenvío?                              | El valor de`expires_at` y si el cliente puede pedir otra            |
| e | ¿Más de un correo administrativo por empresa?      | Si el canje crea uno o varios`admin_empresa`                        |

## Estado de implementación (2026-09-30)

Implementado en `Backend/src/features/auth` (feature de referencia del backend), consumido por
`Frontend` (Monkey Admin) y `Frontend-Platform`.

| Endpoint | Estado |
|---|---|
| `POST /v1/auth/redeem/lookup` | ✅ Paso 1 de la activación (D51): código → razón social y correo fijados por Monkey Admin. Sin gastar la clave; límite de 10 fallos / 15 min por dirección (DT-37) |
| `POST /v1/auth/redeem` | ✅ Solo `code`, `email` y `password` (D51: sin nombre ni apellido). Forma de **código** (supuesto de P2a). Devuelve `user`, `company` y `onboarding` (`next_step: organizational_context`) y abre sesión |
| `POST /v1/auth/login` | ✅ Por email; bloqueo a los 5 intentos por 15 min con `retry_after_seconds` |
| `POST /v1/auth/refresh` | ✅ Rota el refresh token en cada uso (el anterior deja de servir) |
| `POST /v1/auth/logout` | ✅ `204`, idempotente |
| `POST /v1/auth/activate/lookup` · `POST /v1/auth/activate` | ✅ (D95, D96) Código de activación de un solo uso para las cuentas que crea el administrador de la empresa; mismo freno de intentos que las claves de acceso. **Falta el módulo que crea la cuenta y emite el código** (`contracts/gestion-usuarios.md`) |
| `GET /v1/auth/me` | ✅ `user` + `company` + `onboarding` (solo para `admin_empresa`; `login` y `redeem` lo traen igual). (Desde D89 Platform solo mira si `organizational_context` está completo: declarar servicios y conectar activos ya no son pasos del onboarding, aunque la API los siga listando.) `next_step` es el primer paso sin hacer y `null` si ya terminó los tres; `completed_steps` lista los hechos. **Hoy solo se deriva el Componente 1** (existe su fila en `organizations`): al completarlo, `next_step` pasa a `service_context`. Los pasos `service_context` y `technical_control` se suman a `completed_steps` cuando esos componentes existan (MD-78, MD-85) |

Decisiones de implementación, dentro de lo que el contrato ya decía:

- **Sesión (§5.3):** access token JWT HS256 de 15 min en la cookie `mnk_access`; refresh token opaco
  en `mnk_refresh`, que solo viaja a los endpoints de auth. La sesión se cierra a los **30 min sin
  actividad** (`sessions.last_activity_at`, que el guard actualiza como máximo una vez por minuto) y a
  las **8 h** de creada (`sessions.expires_at`). Tiempos en el `.env`.
- **Autorización en cada request:** un guard global verifica contra la base, en cada petición, que
  la sesión siga viva y el usuario siga `active`; el rol sale de la base, no del token. Sin la caché
  de 5 min de §5.3 por ahora: la base se consulta siempre.
- **Refresh tokens y claves de acceso** se guardan como HMAC-SHA256 con `TOKEN_HASH_PEPPER`.
- **Canje (D43):** solo con el `admin_email` de la empresa; la clave se acepta tal como el cliente la
  escriba (sin guiones, en minúsculas); marcarla como usada y crear el usuario es una sola transacción
  condicional. Vencida → `409 ACCESS_KEY_EXPIRED`; revocada, inexistente o de empresa suspendida →
  `404 ACCESS_KEY_INVALID`.
- **Qué app acepta a quién:** Monkey Admin solo admite `admin_monkey`; Monkey Platform rechaza a
  `admin_monkey`. Es un control de las apps (D24), no del endpoint: el login es el mismo.
- **Pendiente:** el `429 RATE_LIMITED` general (solo existe el freno de intentos de la clave de acceso, `ACCESS_KEY_RATE_LIMITED`) y MFA (MD-94).
- **En local**, las dos apps comparten las cookies de `localhost` (los puertos no las separan): una
  sesión en Admin (puerto 4201) y otra en Platform (4200) en el mismo navegador se pisan. En dominios
  propios no pasa.
