---
id: contracts-auth
name: Contrato — Auth
description: Canje de la clave de acceso, login, refresh y logout. Auth mínima del sprint de onboarding.
type: contract
---
# Auth — canje de la clave, login y sesión

Es la **auth mínima** del sprint: login con JWT y refresh, sin segundo factor. Ver
`conventions.md` para el sobre y los errores.

**Entidades:** `access_keys`, `users` (`modelo-datos.md` §4.2, §5.2, §5.3).

`users.name` y `users.last_name` se añadieron al modelo el 2026-09-26: no estaban, pero
el modelo de usuarios del comité los exige (`modelo-datos.md` §5.2).
**App:** Monkey Platform (`Frontend-Platform`) y Monkey Admin (`Frontend`) comparten estos
endpoints.

> **MFA TOTP está aplazada a MD-94.** El comité la exige como obligatoria para `admin_monkey`,
> `admin_empresa` y `auditor` (`modelo-datos.md` §5.3): es deuda conocida, no una decisión
> revertida. Cuando entre, el login devolverá un paso intermedio y este contrato cambia.

## `POST /v1/auth/redeem` — canjear la clave y crear `admin_empresa`

Primer acceso del cliente. Crea su cuenta con la clave que le entregó `admin_monkey`.

⚠️ **La forma de este request depende de la pregunta abierta (a):** si la clave es un código
que el cliente escribe, o un link con token en la URL. Abajo va la forma de **código**, que es
la que asume el sprint (la clave se copia de la UI de Monkey Admin, no llega por correo).

```json
{
  "code": "MNK-7F3A-92KD-5QXB",
  "email": "ana.perez@ejemplo.com",
  "password": "UnaClaveLarga123!",
  "name": "Ana",
  "last_name": "Pérez"
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
      "name": "Ana",
      "last_name": "Pérez",
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
bloqueado**. `onboarding.next_step` dice al frontend dónde continuar sin que lo adivine.

La contraseña debe cumplir la política de `modelo-datos.md` §5.3: **12+ caracteres con
complejidad**. Se valida en el servidor, y el error va por campo.

## `POST /v1/auth/login`

```json
{ "email": "ana.perez@ejemplo.com", "password": "UnaClaveLarga123!" }
```

`200` con el mismo objeto `user` + `company` del canje. La sesión va en cookie `httpOnly`.

Política de sesión (§5.3): **30 min de inactividad, 8 h máximo**. Bloqueo a los **5 intentos
fallidos, por 15 min**.

⚠️ El código actual del Backend setea la cookie a 3 h en login y 15 min en refresh, lo que no
cuadra con la política ni consigo mismo. El contrato fija: access token **15 min**, refresh
hasta el máximo de 8 h de sesión.

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
| 422  | `ACCESS_KEY_EMAIL_MISMATCH` | El correo del canje no es el `admin_email` registrado para la empresa (D39). La clave sigue pendiente |
| 429  | `RATE_LIMITED`            | Límite por IP en los endpoints de auth                                                |

Claves i18n: `auth.account_created`, `auth.logged_in`, `auth.logged_out`,
`auth.invalid_credentials`, `auth.session_expired`, `auth.account_locked`,
`auth.account_inactive`, `access_key.invalid`, `access_key.already_used`,
`access_key.expired`, `user.email_taken`, `validation.failed`.

## Notas

- **Toda autorización se verifica en cada request** (§5.3), con caché de 5 min. No se confía en
  el frontend.
- El canje es de **un solo uso**: al consumirla, `access_keys.status` pasa a `used` y se sella
  `used_at`.
- Las tres acciones de este módulo (canje, creación de usuario) se registran en `audit_logs`
  con usuario, IP y user agent (MD-92).
- El RBAC completo queda fuera del sprint: el onboarding asume un `admin_empresa` autenticado.

## Preguntas abiertas

De `modelo-datos-pendientes.md` P2, **las más urgentes son (a) y (c)**.

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
| `POST /v1/auth/redeem` | ✅ Forma de **código** (supuesto de P2a). Devuelve `user`, `company` y `onboarding` (`next_step: organizational_context`) y abre sesión |
| `POST /v1/auth/login` | ✅ Por email; bloqueo a los 5 intentos por 15 min con `retry_after_seconds` |
| `POST /v1/auth/refresh` | ✅ Rota el refresh token en cada uso (el anterior deja de servir) |
| `POST /v1/auth/logout` | ✅ `204`, idempotente |
| `GET /v1/auth/me` | ✅ `user` + `company` + `onboarding` (solo para `admin_empresa`; `login` y `redeem` lo traen igual). `next_step` es el primer paso sin hacer y `null` si ya terminó los tres; `completed_steps` lista los hechos. **Hoy solo se deriva el Componente 1** (existe su fila en `organizations`): al completarlo, `next_step` pasa a `service_context`. Los pasos `service_context` y `technical_control` se suman a `completed_steps` cuando esos componentes existan (MD-78, MD-85) |

Decisiones de implementación, dentro de lo que el contrato ya decía:

- **Sesión (§5.3):** access token JWT HS256 de 15 min en la cookie `mnk_access`; refresh token opaco
  en `mnk_refresh`, que solo viaja a los endpoints de auth. La sesión se cierra a los **30 min sin
  actividad** (`sessions.last_activity_at`, que el guard actualiza como máximo una vez por minuto) y a
  las **8 h** de creada (`sessions.expires_at`). Tiempos en el `.env`.
- **Autorización en cada request:** un guard global verifica contra la base, en cada petición, que
  la sesión siga viva y el usuario siga `active`; el rol sale de la base, no del token. Sin la caché
  de 5 min de §5.3 por ahora: la base se consulta siempre.
- **Refresh tokens y claves de acceso** se guardan como HMAC-SHA256 con `TOKEN_HASH_PEPPER`.
- **Canje (D39):** solo con el `admin_email` de la empresa; la clave se acepta tal como el cliente la
  escriba (sin guiones, en minúsculas); marcarla como usada y crear el usuario es una sola transacción
  condicional. Vencida → `409 ACCESS_KEY_EXPIRED`; revocada, inexistente o de empresa suspendida →
  `404 ACCESS_KEY_INVALID`.
- **Qué app acepta a quién:** Monkey Admin solo admite `admin_monkey`; Monkey Platform rechaza a
  `admin_monkey`. Es un control de las apps (D24), no del endpoint: el login es el mismo.
- **Pendiente:** `429 RATE_LIMITED` (no hay rate limiting todavía) y MFA (MD-94).
- **En local**, las dos apps comparten las cookies de `localhost` (los puertos no las separan): una
  sesión en Admin (puerto 4201) y otra en Platform (4200) en el mismo navegador se pisan. En dominios
  propios no pasa.
