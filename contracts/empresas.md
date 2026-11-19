---
id: contracts-monkey-admin
name: Contrato — Monkey Admin
description: Registro del tenant y clave de acceso. Endpoints de la app de administración interna.
type: contract
---

# Monkey Admin — registro del tenant y clave de acceso

| | |
|---|---|
| **Qué es** | `admin_monkey` registra la empresa antes de que el cliente entre |
| **Rol requerido** | `admin_monkey` en **todos** los endpoints |
| **App** | `Frontend` (Monkey Admin), dominio propio, separada de Monkey Platform |
| **Entidades** | `companies`, `access_keys` (`modelo-datos.md` §4.1, §4.2) |
| **Convenciones** | Sobre, errores y paginación: [`conventions.md`](conventions.md) · enums: [`enums.md`](enums.md) |

## Índice de endpoints

| Método | Ruta | Para qué |
|---|---|---|
| `POST` | [`/v1/companies`](#post-v1companies--registrar-una-empresa) | Registrar una empresa |
| `POST` | [`/v1/companies/{id}/access-key/regenerate`](#post-v1companiesidaccess-keyregenerate--reenviar-con-una-clave-nueva) | Reenviar con una clave nueva (D99) |
| `GET` | [`/v1/companies`](#get-v1companies--listar-empresas) | Listar empresas |
| `GET` | [`/v1/companies/{id}`](#get-v1companiesid--detalle-de-una-empresa) | Detalle de una empresa |
| `PATCH` | [`/v1/companies/{id}`](#patch-v1companiesid--corregir-antes-del-canje) | Corregir nombre o correo antes del canje |
| `PATCH` | [`/v1/companies/{id}/max-users`](#patch-v1companiesidmax-users--cambiar-el-cupo-de-usuarios) | Cambiar el cupo de usuarios (D103) |
| `POST` | [`/v1/companies/{id}/deactivation`](#post-v1companiesiddeactivation--archivar-una-empresa) | Archivar una empresa (D97) |
| `POST` | [`/v1/companies/{id}/reactivation`](#post-v1companiesidreactivation--reactivar-una-empresa) | Reactivar una empresa archivada (D97) |
| `GET` | [`/v1/companies/pending-purge`](#borrado-definitivo-y-aviso) | Empresas por borrarse (D97) |

## Campos del registro

El comité fija **3 campos** (`modelo-datos.md` §4.2); **D47** añade el marco que se contrata y **D103** el cupo de usuarios.

| Campo | Tipo | Obligatorio | Enum | Destino |
|---|---|---|---|---|
| `name` | string | sí | — | `companies.name`: razón social. Se fija aquí y llega bloqueada al Componente 1 |
| `requires_dedicated_database` | boolean | sí | — | Deriva `companies.isolation_strategy` |
| `admin_email` | string (email) | sí | — | `companies.admin_email` |
| `max_users` | integer (≥ 1) | sí | — | `companies.max_users`: el cupo de usuarios contratado (D103). Cuentan las cuentas `active`, `pending` y `suspended` de cualquier rol; las `inactive` no |
| `framework_codes` | array\<string\> | no (por defecto `["soc2"]`) | `framework` (7 ofrecidos; solo `soc2` contratable: D37, D50) | `platform.company_frameworks`: los marcos que se contratan (D47) |

- Monkey Admin muestra **todos los marcos que Monkey ofrece** (D50) y solo deja contratar los `available` (hoy solo `soc2`, D37); el resto aparece como «próximamente».
- Un código que no esté en `catalog.frameworks` → `422`; uno que esté pero sea `coming_soon` → `409 FRAMEWORK_NOT_AVAILABLE` con `error.framework_codes`.
- Al declarar un servicio, el cliente solo elige entre los marcos que su empresa tiene contratados (`409 FRAMEWORK_NOT_CONTRACTED`, ver `contracts/onboarding/contexto-servicio.md`).
- `requires_dedicated_database: true` → `isolation_strategy: "dedicated"`; `false` → `"shared"`. El booleano es lo que ve `admin_monkey`; el enum es lo que se guarda.

---

## Registro y clave de acceso

### POST /v1/companies — Registrar una empresa

| | |
|---|---|
| **Quién** | `admin_monkey` |
| **Éxito** | `201` |
| **Errores** | `403` · `409 COMPANY_NAME_TAKEN` · `409 ADMIN_EMAIL_TAKEN` · `409 FRAMEWORK_NOT_AVAILABLE` · `422 VALIDATION_FAILED` · `422 DEDICATED_DATABASE_NOT_AVAILABLE` · `503 PROVISIONING_FAILED` |

#### Request
Los campos de la tabla «Campos del registro».

```json
{
  "name": "Next Audit & Consulting S.A.S.",
  "requires_dedicated_database": false,
  "admin_email": "contacto@ejemplo.com",
  "max_users": 10,
  "framework_codes": ["soc2"]
}
```

#### Response `201`
| Campo | Tipo | Qué es |
|---|---|---|
| `id`, `name`, `admin_email` | | |
| `isolation_strategy` | enum `isolation_strategy` | |
| `status` | enum `company_status` | |
| `max_users` | integer | El cupo contratado |
| `users_count` | integer | Cuentas que cuentan para el cupo |
| `frameworks[]` | `{ code, name, contracted_at }` | Marcos contratados |
| `created_at`, `updated_at` | datetime | |
| `access_key` | `{ id, status, expires_at, delivery_status }` | **Nunca trae la clave** (D99). `delivery_status`: enum `access_key_delivery_status` |

```json
{
  "statusCode": 201,
  "message": "company.created",
  "data": {
    "id": "8f14e45f-ceea-467a-9b3c-2a1d7f0e4b12",
    "name": "Next Audit & Consulting S.A.S.",
    "admin_email": "contacto@ejemplo.com",
    "isolation_strategy": "shared",
    "status": "active",
    "max_users": 10,
    "users_count": 0,
    "frameworks": [{ "code": "soc2", "name": "SOC 2", "contracted_at": "2026-09-28" }],
    "created_at": "2026-09-28T15:04:02Z",
    "updated_at": "2026-09-28T15:04:02Z",
    "access_key": {
      "id": "b1d9c3a2-5e77-4f10-8a61-c9d2e3f40a55",
      "status": "pending",
      "expires_at": "2026-10-05T15:04:02Z",
      "delivery_status": "sent"
    }
  }
}
```

> **La clave solo se entrega por correo (D99, cierra MD-69 para la clave de acceso).** Ya no viaja en la respuesta ni se muestra en ninguna pantalla. El destino es el `admin_email` (D24); en `access_keys` solo queda su hash.
> `delivery_status`: `sent` (el proveedor aceptó el mensaje) o `failed` (no salió). **Un fallo del correo no revierte el registro**: la empresa y su clave quedan creadas y Monkey Admin ofrece reenviar. `sent` no garantiza que llegue a la bandeja del cliente, solo que salió.

> ⚠️ **Con `requires_dedicated_database: true`, la forma de la respuesta depende de P2(d)**, que sigue abierta. Si aprovisionar la base dedicada toma tiempo, el registro devolvería `202 Accepted` y la clave llegaría después, y eso **exigiría una columna de estado de aprovisionamiento en `companies`, que hoy el modelo no tiene**. Hasta que P2(d) se cierre, el contrato define solo el caso `shared`, síncrono, con `201`; `dedicated` se rechaza con `422 DEDICATED_DATABASE_NOT_AVAILABLE`.

---

### POST /v1/companies/{id}/access-key/regenerate — Reenviar con una clave nueva

| | |
|---|---|
| **Quién** | `admin_monkey` |
| **Éxito** | `200` (también con `delivery_status: "failed"`: la clave nueva existe y se puede volver a reenviar) |
| **Errores** | `404` · `409 ACCESS_KEY_NOT_PENDING` · `409 COMPANY_ALREADY_DEACTIVATED` |

#### Request
Sin cuerpo. **Anula la clave pendiente** (`revoked`), emite una nueva con vigencia completa (`ACCESS_KEY_TTL_HOURS`) y la envía al `admin_email`. La anterior deja de servir aunque no hubiera vencido. Nunca se muestra en pantalla. Deja `access_key.regenerate` en la misma transacción (D99, cierra P2b).

#### Response `200`
```json
{
  "statusCode": 200,
  "message": "access_key.regenerated",
  "data": {
    "id": "b1d9c3a2-5e77-4f10-8a61-c9d2e3f40a56",
    "status": "pending",
    "expires_at": "2026-10-07T15:04:02Z",
    "delivery_status": "sent"
  }
}
```

#### Errores propios
| HTTP | Código | Cuándo |
|---|---|---|
| 404 | `NOT_FOUND` | Empresa inexistente (o la interna de Monkey) |
| 409 | `ACCESS_KEY_NOT_PENDING` | La clave ya se canjeó (la empresa ya tiene su `admin_empresa`: no hay nada que reenviar) |
| 409 | `COMPANY_ALREADY_DEACTIVATED` | La empresa está archivada |

---

## Consulta y corrección

### GET /v1/companies — Listar empresas

| | |
|---|---|
| **Quién** | `admin_monkey` |
| **Éxito** | `200`, paginada |
| **Errores** | `403` |

#### Parámetros (query)
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `page`, `page_size` | integer | no | Ver `conventions.md` |
| `sort` | string | no | `created_at` o `name`, con `+`/`-` |
| `status` | enum `company_status` | no | Las archivadas se ocultan por defecto; `status=deactivated` las muestra |

```
GET /v1/companies?page=1&page_size=25&sort=-created_at&status=active
```

#### Response `200`
| Campo del ítem | Tipo | Qué es |
|---|---|---|
| `id`, `name`, `admin_email` | | |
| `isolation_strategy`, `status` | enums | |
| `max_users`, `users_count` | integer | Cupo y uso (D103) |
| `frameworks[]` | `{ code, name, contracted_at }` | |
| `access_key_status` | enum `access_key_status` | **Derivado** de la fila vigente de `access_keys` |
| `access_key_expires_at` | datetime | **Derivado** |
| `onboarding_completed` | boolean | **Derivado**: ¿existe ya `organizations` para esta empresa? |
| `created_at` | datetime | |

```json
{
  "statusCode": 200,
  "message": "company.list",
  "data": {
    "items": [
      {
        "id": "8f14e45f-ceea-467a-9b3c-2a1d7f0e4b12",
        "name": "Next Audit & Consulting S.A.S.",
        "admin_email": "contacto@ejemplo.com",
        "isolation_strategy": "shared",
        "status": "active",
        "max_users": 10,
        "users_count": 3,
        "frameworks": [{ "code": "soc2", "name": "SOC 2", "contracted_at": "2026-09-28" }],
        "access_key_status": "pending",
        "access_key_expires_at": "2026-10-05T15:04:02Z",
        "onboarding_completed": false,
        "created_at": "2026-09-28T15:04:02Z"
      }
    ],
    "page": 1, "page_size": 25, "total": 1, "total_pages": 1
  }
}
```

> Los campos derivados no son columnas de ninguna tabla: los calcula el backend. Nunca se devuelve `code` ni `code_hash` en un listado. `access_keys.used_at` y `companies.updated_at` existen en el modelo y se exponen en el detalle, no en el listado.

### GET /v1/companies/{id} — Detalle de una empresa

| | |
|---|---|
| **Quién** | `admin_monkey` |
| **Éxito** | `200` |
| **Errores** | `403` · `404` (también la empresa interna de Monkey) |

Mismo objeto del listado, más el historial de claves (sin códigos).

### PATCH /v1/companies/{id} — Corregir antes del canje

> ⚠️ **Existencia y alcance pendientes** (pregunta abierta c). `name` queda bloqueado en el Componente 1, así que un error de tipeo hay que poder corregirlo antes de que el cliente entre.

| | |
|---|---|
| **Quién** | `admin_monkey` |
| **Éxito** | `200` |
| **Errores** | `409 COMPANY_ALREADY_ONBOARDED` (`CONFLICT`, `company.already_onboarded`) |

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `name` | string | no | Razón social |
| `admin_email` | string (email) | no | |

```json
{ "name": "Next Audit & Consulting S.A.S.", "admin_email": "otro@ejemplo.com" }
```

Solo mientras la clave esté `pending`. Con la clave `used`: el nombre ya está reflejado en `organizations`.

### PATCH /v1/companies/{id}/max-users — Cambiar el cupo de usuarios

| | |
|---|---|
| **Quién** | `admin_monkey`, en cualquier momento (también tras el canje de la clave) |
| **Éxito** | `200` con el objeto de la empresa |
| **Errores** | `403` · `404` · `409 MAX_USERS_BELOW_CURRENT` · `422 VALIDATION_FAILED` |

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `max_users` | integer | sí | ≥ 1 y no menor que `users_count` |

```json
{ "max_users": 25 }
```

El listado y el detalle traen `max_users` y `users_count`. Deja `company.max_users_update` en la auditoría (`before_state` / `after_state`).

---

## Archivar, reactivar y borrar (D97)

### POST /v1/companies/{id}/deactivation — Archivar una empresa

| | |
|---|---|
| **Quién** | `admin_monkey` |
| **Éxito** | `200` con el detalle (`status: "deactivated"`, `deactivated_at`, `archive_until`) |
| **Errores** | `403` · `404` (empresa interna) · `422 CONFIRMATION_MISMATCH` · `422 VALIDATION_FAILED` · `401 MFA_CODE_INVALID` · `403 ACCOUNT_LOCKED` · `409 MFA_NOT_ENABLED` · `409 COMPANY_ALREADY_DEACTIVATED` |

**Archiva** la empresa; el borrado definitivo ocurre solo al vencer `archive_until`.

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `confirm_name` | string | sí | Debe coincidir con la razón social (`CONFIRMATION_MISMATCH`) |
| `reason_code` | enum `company_deactivation_reason` | sí | `non_payment` · `client_request` · `other` |
| `reason` | string | sí | 5 a 500 caracteres |
| `retention_days` | integer | no | Por defecto 180 (6 meses); mínimo 7 |
| `totp_code` | string | sí | El del propio `admin_monkey` |

```json
{ "confirm_name": "Next Audit & Consulting S.A.S.", "reason_code": "non_payment", "reason": "Dos facturas vencidas.", "retention_days": 180, "totp_code": "123456" }
```

#### Efectos
- Se toma una **copia cifrada** de la empresa (si no se puede guardar, **no se archiva**).
- En una transacción: la empresa pasa a `deactivated`, se cierran todas sus sesiones y los desafíos de segundo factor abiertos, y se cancelan las evaluaciones en cola o en curso.
- El ingreso, la renovación de sesión, el canje de clave y el trabajador comprueban el estado de la empresa.
- Las claves y credenciales no se reescriben; usuarios y datos se conservan.
- La pantalla muestra el aviso de consecuencias **antes** de confirmar.

> **Auditoría:** deja `company.deactivate`. Un intento rechazado por `CONFIRMATION_MISMATCH` o `COMPANY_ALREADY_DEACTIVATED` también la deja, con `result: error` y solo la empresa y el motivo del rechazo (nunca lo que se escribió). Si dos peticiones archivan la misma empresa a la vez, una gana y la otra recibe `409 COMPANY_ALREADY_DEACTIVATED`.

### POST /v1/companies/{id}/reactivation — Reactivar una empresa archivada

| | |
|---|---|
| **Quién** | `admin_monkey`, y solo antes de `archive_until` |
| **Éxito** | `200` |
| **Errores** | `403` · `404` (ya borrada) · `409 COMPANY_NOT_DEACTIVATED` · `409 COMPANY_ARCHIVE_EXPIRED` · errores del código TOTP: los de archivar |

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `reason` | string | sí | |
| `totp_code` | string | sí | El del propio `admin_monkey` |

```json
{ "reason": "El cliente regularizó su pago.", "totp_code": "123456" }
```

Devuelve la empresa a `active`, **borra el plazo** y deja `company.reactivate`. Las sesiones se reinician; las claves y credenciales vuelven a servir si no vencieron. La copia se borra.

> El estado y el plazo se vuelven a comprobar al cambiar la fila: si dos reactivaciones llegan a la vez, o el plazo vence entre la verificación y el cambio, solo una prospera y las demás reciben ese mismo `409`.

### Borrado definitivo y aviso

No es un endpoint de borrado: lo ejecuta una tarea programada al vencer `archive_until`, con un rol propio, y elimina **todo** lo de la empresa (datos, archivos, credenciales, auditoría y su copia de respaldo). Deja en `company_purge_log` solo nombre, fecha y hora y quién (`company.purge`).

- **3 días antes** (como mínimo) se avisa a todos los `admin_monkey` por correo y por notificación en la app (DT-83: aún no existen; el aviso es informativo y no condiciona la purga).
- `GET /v1/companies/pending-purge` (`admin_monkey`) lista las empresas por vencer, con `archive_until` y días restantes, para la notificación.
- Tras restaurar un respaldo se vuelve a purgar con `company_purge_log`.
- Con varias réplicas del backend, cada empresa se borra una sola vez: la tarea toma un candado por empresa en la base antes de borrar sus archivos y su base, y quien no lo consigue, o la encuentra ya borrada, la salta.
- Si algo falla a medias (por ejemplo, el bucket), la empresa sigue archivada, el candado se libera con la transacción y la pasada siguiente la reintenta.

---

## Errores del módulo

| HTTP | `error.code` | Cuándo |
|---|---|---|
| 422 | `CONFIRMATION_MISMATCH` | La razón social escrita para archivar no coincide con la de la empresa (D97) |
| 409 | `COMPANY_ALREADY_DEACTIVATED` | La empresa ya está archivada (D97) |
| 409 | `COMPANY_NOT_DEACTIVATED` | Se reactiva una empresa que no está archivada (D97) |
| 409 | `COMPANY_ARCHIVE_EXPIRED` | Se reactiva una empresa cuyo plazo ya venció (D97) |
| 409 | `COMPANY_NAME_TAKEN` | Ya existe una empresa activa con esa razón social |
| 409 | `ADMIN_EMAIL_TAKEN` | Ese `admin_email` ya es administrativo de otra empresa, o ya es el correo de un usuario de la plataforma (el correo es único global: la clave no se podría canjear) |
| 409 | `COMPANY_ALREADY_ONBOARDED` | Se intenta editar tras el canje de la clave |
| 409 | `ACCESS_KEY_NOT_PENDING` | Se intenta reenviar la clave de una empresa que ya la canjeó (D99) |
| 409 | `MAX_USERS_BELOW_CURRENT` | Se fija un cupo menor que las cuentas que ya cuentan (D103) |
| 409 | `FRAMEWORK_NOT_AVAILABLE` | Se eligió un marco que aún no está construido (`coming_soon`, D50) |
| 422 | `VALIDATION_FAILED` | `name` vacío o >255, `admin_email` inválido, `max_users` ausente o menor que 1 |
| 422 | `DEDICATED_DATABASE_NOT_AVAILABLE` | **Temporal:** `requires_dedicated_database: true` mientras el aprovisionamiento dedicado no exista (P2d). Clave i18n `company.dedicated_not_available` |
| 503 | `PROVISIONING_FAILED` | Falló el aprovisionamiento de la base dedicada |

**Claves i18n:** `company.created`, `company.list`, `company.updated`, `company.max_users_updated`, `company.name_taken`, `company.admin_email_taken`, `company.already_onboarded`, `access_key.regenerated`, `access_key.not_pending`, `validation.failed`.

El texto del correo no está definido aquí: vive en el Backend (`access-key-email.ts`) y sale en español o inglés, según el `Accept-Language` de quien registra o reenvía (D111).

## Notas

- Esta UI es **interna del equipo Monkey**: aquí sí se puede usar lenguaje técnico. En Monkey Platform también se usa el vocabulario del dominio (D80), pero explicado al cliente (`philosophy.md`).
- El check de base dedicada debe advertir que **la decisión no se revierte sin migrar datos**.
- La clave **no se muestra nunca** en Monkey Admin (D99): la UI dice a qué correo salió, si salió, y ofrece reenviar.

## Preguntas abiertas

De `datos/pendientes/empresas.md` P2. **Ninguna se resuelve aquí.**

| | Pregunta | Qué define en este contrato |
|---|---|---|
| b | ~~¿Cuánto dura la clave y se puede regenerar o reenviar?~~ | **Cerrada por D99:** se reenvía con una clave nueva; la vigencia sigue siendo `ACCESS_KEY_TTL_HOURS` (7 días) |
| c | ¿Se puede corregir nombre o correo antes del canje? | Si existe `PATCH /v1/companies/{id}` y qué campos admite |
| d | ¿Aprovisionar una base dedicada es instantáneo? | Si el registro es `201` síncrono o `202` con `provisioning_status` |
| e | ¿Puede haber más de un correo administrativo? | Si `admin_email` es string o array |

El ejemplo asume: caducidad de 7 días, `PATCH` permitido mientras la clave esté `pending`, `202` para dedicada y un solo `admin_email`. **Son supuestos, no decisiones.**

---

## Estado de implementación (2026-09-30)

Implementado en `Backend/src/features/companies` y `Frontend/src/app/features/companies`:

| Endpoint | Estado |
|---|---|
| `POST /v1/companies` | ✅ Solo el caso `shared`. Empresa, clave **y marcos contratados** en la misma transacción (D47); la clave se envía al `admin_email` (D99; antes se mostraba una vez en un diálogo). El formulario lista los 7 marcos del catálogo (D50): SOC 2 elegible y los otros 6 deshabilitados («próximamente»). `max_users` obligatorio (entero ≥ 1, D103, MD-187) y devuelto con `users_count` |
| `GET /v1/companies` | ✅ Paginado, `sort` = `created_at`/`name` (±), filtro `status`. **Excluye la empresa interna de Monkey** (la del `admin_monkey`), que no es un cliente |
| `GET /v1/companies/{id}` | ✅ Con historial de claves. La empresa interna responde `404` |
| `PATCH /v1/companies/{id}` | ❌ Espera a P2(c) |
| `POST /v1/companies/{id}/deactivation` · `/reactivation` · `GET /v1/companies/pending-purge` · borrado definitivo | ✅ D97. `GET /v1/companies` oculta las archivadas por defecto (`status=deactivated` las muestra). La tarea del borrado corre cada `COMPANY_PURGE_INTERVAL_MINUTES` (60 por defecto; `0` la apaga) |
| `POST /v1/companies/{id}/access-key/regenerate` | ✅ D99. Anula la pendiente, emite otra y la envía por correo |
| `PATCH /v1/companies/{id}/max-users` | ✅ D103, MD-187. Solo `admin_monkey`; `409 MAX_USERS_BELOW_CURRENT` si baja del uso; `company.max_users_update` con antes y después (con `company_id`) en la misma transacción. El listado y el detalle traen `max_users` (`null` = empresa anterior al cupo, sin tope) y `users_count`. **Monkey Admin (MD-205):** el registro lo pide, la lista lo muestra junto al uso y «Cambiar cupo» lo edita; el `409` se muestra con el número de cuentas que cuentan |

Decisiones de implementación, dentro de lo que el contrato ya asumía:

- **Clave:** `MNK-XXXX-XXXX-XXXX` con 31 símbolos sin ambigüedad (sin `0/O`, `1/I/L`). Vigencia en `ACCESS_KEY_TTL_HOURS` del `.env` (hoy 168 = 7 días, el supuesto de P2b). En `access_keys.code_hash` va el **HMAC-SHA256 con `TOKEN_HASH_PEPPER`** del código normalizado (sin prefijo, guiones ni mayúsculas), para que el canje acepte la clave como el cliente la escriba y `find_access_key` la encuentre por igualdad.
- **`access_key_status` derivado:** una clave `pending` con `expires_at` vencido se informa como `expired` (nadie actualiza la fila al vencer). La «vigente» es la de `expires_at` más reciente, porque `access_keys` no tiene `created_at`.
- **`COMPANY_NAME_TAKEN`** compara sin mayúsculas ni espacios repetidos, solo contra empresas `active`. **`ADMIN_EMAIL_TAKEN`** compara contra todas y, además, contra los usuarios de cualquier empresa (por `find_login_candidates`, porque `users` tiene RLS por empresa). Las dos son validaciones de aplicación: la base no tiene índice único para ellas.
- **Auditoría:** `company.create` en `audit_logs` con `tenant_id` nulo (acción de plataforma); la clave nunca entra, ni en claro ni en hash.
