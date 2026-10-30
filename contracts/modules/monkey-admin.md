---
id: contracts-monkey-admin
name: Contrato — Monkey Admin
description: Registro del tenant y clave de acceso. Endpoints de la app de administración interna.
type: contract
---

# Monkey Admin — registro del tenant y clave de acceso

`admin_monkey` registra la empresa antes de que el cliente entre. Ver `conventions.md` para el
sobre, los errores y la paginación.

**Entidades:** `companies`, `access_keys` (`modelo-datos.md` §4.1, §4.2).
**Rol requerido:** `admin_monkey` en todos los endpoints.
**App:** `Frontend` (Monkey Admin), dominio propio, separada de Monkey Platform.

## Campos del registro

El comité fija **3 campos** (`modelo-datos.md` §4.2) y **D47 añade el marco que se contrata**.

| Campo | Tipo | Oblig. | Enum | Destino |
|---|---|---|---|---|
| `name` | string | sí | — | `companies.name` — razón social. Se fija aquí y llega bloqueada al Componente 1 |
| `requires_dedicated_database` | boolean | sí | — | deriva `companies.isolation_strategy` |
| `admin_email` | string (email) | sí | — | `companies.admin_email` |
| `framework_codes` | array&lt;string&gt; | **no** (por defecto `["soc2"]`) | `framework` (7 ofrecidos; solo `soc2` contratable: D37, D50) | `platform.company_frameworks` — los marcos que se contratan para la empresa (D47) |

Monkey Admin muestra **todos los marcos que Monkey ofrece** (D50) y solo deja contratar los `available` (hoy solo
`soc2`, D37); el resto aparece como «próximamente». Un código que no esté en `catalog.frameworks` → `422`; uno que
esté pero sea `coming_soon` → `409 FRAMEWORK_NOT_AVAILABLE` con `error.framework_codes`. Al declarar un servicio, el cliente solo puede elegir entre los marcos que su
empresa tiene contratados (`409 FRAMEWORK_NOT_CONTRACTED`, ver `onboarding-service-context.md`).

`requires_dedicated_database: true` → `isolation_strategy: "dedicated"`; `false` → `"shared"`.
El booleano es lo que ve `admin_monkey`; el enum es lo que se guarda.

## `POST /v1/companies` — registrar empresa

```json
{
  "name": "Next Audit & Consulting S.A.S.",
  "requires_dedicated_database": false,
  "admin_email": "contacto@ejemplo.com",
  "framework_codes": ["soc2"]
}
```

`201` — **la clave en claro solo aparece aquí, una sola vez.** En `access_keys` solo queda su
hash.

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
    "frameworks": [{ "code": "soc2", "name": "SOC 2", "contracted_at": "2026-09-28" }],
    "created_at": "2026-09-28T15:04:02Z",
    "updated_at": "2026-09-28T15:04:02Z",
    "access_key": {
      "id": "b1d9c3a2-5e77-4f10-8a61-c9d2e3f40a55",
      "code": "MNK-7F3A-92KD-5QXB",
      "status": "pending",
      "expires_at": "2026-10-05T15:04:02Z"
    }
  }
}
```

⚠️ **Con `requires_dedicated_database: true`, la forma de la respuesta depende de P2(d)**, que
sigue abierta. Si aprovisionar la base dedicada toma tiempo, el registro devolvería `202
Accepted` y la clave llegaría después — y eso **exigiría una columna de estado de
aprovisionamiento en `companies`, que hoy el modelo no tiene**. No se inventa aquí: hasta que
P2(d) se cierre, el contrato define solo el caso `shared`, síncrono, con `201`.

> **La clave se entrega copiándola de esta pantalla.** El envío automático por correo está
> aplazado (MD-69), así que este response es el único medio de obtenerla. El destino previsto
> sigue siendo el `admin_email` (decisión D24).

## `GET /v1/companies` — listar empresas

```
GET /v1/companies?page=1&page_size=25&sort=-created_at&status=active
```

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

**Campos derivados del listado**, que no son columnas de ninguna tabla y los calcula el
backend: `access_key_status` y `access_key_expires_at` (de la fila vigente de `access_keys`) y
`onboarding_completed` (¿existe ya `organizations` para esta empresa?). Nunca se devuelve `code`
ni `code_hash` en un listado.

`access_keys.used_at` y `companies.updated_at` existen en el modelo y se exponen en el detalle
(`GET /v1/companies/{id}`), no en el listado.

## `GET /v1/companies/{id}` — detalle

Mismo objeto del listado, más el historial de claves (sin códigos).

## `PATCH /v1/companies/{id}` — corregir antes del canje

⚠️ **Existencia y alcance pendientes** — pregunta abierta (c). `name` queda bloqueado en el
Componente 1, así que un error de tipeo hay que poder corregirlo antes de que el cliente entre.

```json
{ "name": "Next Audit & Consulting S.A.S.", "admin_email": "otro@ejemplo.com" }
```

Solo mientras la clave esté `pending`. Con la clave `used`, `409 CONFLICT`
(`company.already_onboarded`): el nombre ya está reflejado en `organizations`.

## `POST /v1/companies/{id}/access-key/regenerate` — regenerar clave

⚠️ **Existencia pendiente** — pregunta abierta (b). Revoca la clave vigente y emite una nueva.

`201` con el mismo bloque `access_key` del registro, código en claro incluido. La anterior pasa
a `revoked`.

## `POST /v1/companies/{id}/deactivation` — archivar (D97)

Solo `admin_monkey`. **Archiva** la empresa; el borrado definitivo ocurre solo al vencer `archive_until`.

```json
{ "confirm_name": "Next Audit & Consulting S.A.S.", "reason_code": "non_payment", "reason": "Dos facturas vencidas.", "retention_days": 180, "totp_code": "123456" }
```

`reason_code` = `non_payment` · `client_request` · `other` (`enums.md`); `reason` 5 a 500; `retention_days` por defecto 180 (6 meses), mínimo 7; `totp_code` es el del propio `admin_monkey`. `200` con el detalle (`status: "deactivated"`, `deactivated_at`, `archive_until`). Efectos: se toma una copia cifrada de la empresa (si no se puede guardar, no se archiva) y, en una transacción, la empresa pasa a `deactivated`, se cierran todas sus sesiones y los desafíos de segundo factor abiertos, y se cancelan las evaluaciones en cola o en curso. El ingreso, la renovación de sesión, el canje de clave y el trabajador comprueban el estado de la empresa. Las claves y credenciales no se reescriben; usuarios y datos se conservan. La pantalla muestra el aviso de consecuencias **antes** de confirmar. Deja `company.deactivate`. Un intento rechazado por `CONFIRMATION_MISMATCH` o `COMPANY_ALREADY_DEACTIVATED` también la deja, con `result: error` y solo la empresa y el motivo del rechazo (nunca lo que se escribió). Si dos peticiones archivan la misma empresa a la vez, una gana y la otra recibe `409 COMPANY_ALREADY_DEACTIVATED`. Empresa interna: `404`.

Errores: `422 CONFIRMATION_MISMATCH`, `422 VALIDATION_FAILED` (motivo o plazo fuera de rango), `401 MFA_CODE_INVALID`, `403 ACCOUNT_LOCKED` (demasiados códigos TOTP equivocados), `409 MFA_NOT_ENABLED` (quien archiva no tiene segundo factor), `403` para otro rol, `409 COMPANY_ALREADY_DEACTIVATED`.

## `POST /v1/companies/{id}/reactivation` — reactivar (D97)

Solo `admin_monkey` y solo antes de `archive_until`. Cuerpo `{ "reason", "totp_code" }`. Devuelve la empresa a `active`, **borra el plazo** y deja `company.reactivate`. Las sesiones se reinician; las claves y credenciales vuelven a servir si no vencieron. La copia se borra. Fuera de plazo, `409 COMPANY_ARCHIVE_EXPIRED`; no archivada, `409 COMPANY_NOT_DEACTIVATED`; ya borrada, `404`. El estado y el plazo se vuelven a comprobar al cambiar la fila: si dos reactivaciones llegan a la vez, o el plazo vence entre la verificación y el cambio, solo una prospera y las demás reciben ese mismo `409`. Errores del código TOTP: los de archivar.

## Borrado definitivo y aviso (D97)

No es un endpoint: lo ejecuta una tarea programada al vencer `archive_until`, con un rol propio, y elimina **todo** lo de la empresa (datos, archivos, credenciales, auditoría y su copia de respaldo). Deja en `company_purge_log` solo nombre, fecha y hora y quién (`company.purge`). **3 días antes** (como mínimo) se avisa a todos los `admin_monkey` por correo y por notificación en la app, (DT-83: aún no existen; el aviso es informativo y no condiciona la purga). `GET /v1/companies/pending-purge` lista las empresas por vencer, con `archive_until` y días restantes, para la notificación. Tras restaurar un respaldo se vuelve a purgar con `company_purge_log`. Con varias réplicas del backend, cada empresa se borra una sola vez: la tarea toma un candado por empresa en la base antes de borrar sus archivos y su base, y quien no lo consigue, o la encuentra ya borrada, la salta. Si algo falla a medias (por ejemplo, el bucket), la empresa sigue archivada, el candado se libera con la transacción y la pasada siguiente la reintenta.

## Errores

| HTTP | `error.code` | Cuándo |
|---|---|---|
| 422 | `CONFIRMATION_MISMATCH` | La razón social escrita para archivar no coincide con la de la empresa (D97) |
| 409 | `COMPANY_ALREADY_DEACTIVATED` | La empresa ya está archivada (D97) |
| 409 | `COMPANY_NOT_DEACTIVATED` | Se reactiva una empresa que no está archivada (D97) |
| 409 | `COMPANY_ARCHIVE_EXPIRED` | Se reactiva una empresa cuyo plazo ya venció (D97) |
| 409 | `COMPANY_NAME_TAKEN` | Ya existe una empresa activa con esa razón social |
| 409 | `ADMIN_EMAIL_TAKEN` | Ese `admin_email` ya es administrativo de otra empresa |
| 409 | `COMPANY_ALREADY_ONBOARDED` | Se intenta editar tras el canje de la clave |
| 409 | `ACCESS_KEY_NOT_PENDING` | Se intenta regenerar una clave ya usada |
| 409 | `FRAMEWORK_NOT_AVAILABLE` | Se eligió un marco que aún no está construido (`coming_soon`, D50) |
| 422 | `VALIDATION_FAILED` | `name` vacío o >255, `admin_email` inválido |
| 422 | `DEDICATED_DATABASE_NOT_AVAILABLE` | **Temporal**: `requires_dedicated_database: true` mientras el aprovisionamiento dedicado no exista (P2d). Clave i18n `company.dedicated_not_available` |
| 503 | `PROVISIONING_FAILED` | Falló el aprovisionamiento de la base dedicada |

Claves i18n: `company.created`, `company.list`, `company.updated`,
`company.name_taken`, `company.admin_email_taken`, `company.already_onboarded`,
`access_key.regenerated`, `access_key.not_pending`, `validation.failed`.

## Notas

- Esta UI es **interna del equipo Monkey**: aquí sí se puede usar lenguaje técnico. En Monkey Platform
  también se usa el vocabulario del dominio (D80), pero explicado al cliente (`philosophy.md`).
- El check de base dedicada debe advertir que **la decisión no se revierte sin migrar datos**.
- La clave se muestra **una sola vez**; la UI debe decirlo explícitamente.

## Preguntas abiertas

De `modelo-datos-pendientes.md` P2. **Ninguna se resuelve aquí.**

| | Pregunta | Qué define en este contrato |
|---|---|---|
| b | ¿Cuánto dura la clave y se puede regenerar o reenviar? | El valor de `expires_at` y si existe `/access-key/regenerate` |
| c | ¿Se puede corregir nombre o correo antes del canje? | Si existe `PATCH /v1/companies/{id}` y qué campos admite |
| d | ¿Aprovisionar una base dedicada es instantáneo? | Si el registro es `201` síncrono o `202` con `provisioning_status` |
| e | ¿Puede haber más de un correo administrativo? | Si `admin_email` es string o array |

El ejemplo de arriba asume: caducidad de 7 días, `PATCH` permitido mientras la clave esté
`pending`, `202` para dedicada, y un solo `admin_email`. **Son supuestos, no decisiones.**

## Estado de implementación (2026-09-30)

Implementado en `Backend/src/features/companies` y `Frontend/src/app/features/companies`:

| Endpoint | Estado |
|---|---|
| `POST /v1/companies` | ✅ Solo el caso `shared`. Empresa, clave **y marcos contratados** en la misma transacción (D47); la clave se muestra una vez en un diálogo de Monkey Admin. El formulario lista los 7 marcos del catálogo (D50): SOC 2 elegible y los otros 6 deshabilitados («próximamente») |
| `GET /v1/companies` | ✅ Paginado, `sort` = `created_at`/`name` (± ), filtro `status`. **Excluye la empresa interna de Monkey** (la del `admin_monkey`), que no es un cliente |
| `GET /v1/companies/{id}` | ✅ Con historial de claves. La empresa interna responde `404` |
| `PATCH /v1/companies/{id}` | ❌ Espera a P2(c) |
| `POST /v1/companies/{id}/deactivation` · `/reactivation` · `GET /v1/companies/pending-purge` · borrado definitivo | ✅ D97. `GET /v1/companies` oculta las archivadas por defecto (`status=deactivated` las muestra). La tarea del borrado corre cada `COMPANY_PURGE_INTERVAL_MINUTES` (60 por defecto; `0` la apaga) |
| `POST /v1/companies/{id}/access-key/regenerate` | ❌ Espera a P2(b) |

Decisiones de implementación, dentro de lo que el contrato ya asumía:

- **Clave:** `MNK-XXXX-XXXX-XXXX` con 31 símbolos sin ambigüedad (sin `0/O`, `1/I/L`). Vigencia en
  `ACCESS_KEY_TTL_HOURS` del `.env` (hoy 168 = 7 días, el supuesto de P2b). En `access_keys.code_hash`
  va el **HMAC-SHA256 con `TOKEN_HASH_PEPPER`** del código normalizado (sin prefijo, guiones ni
  mayúsculas), para que el canje acepte la clave como el cliente la escriba y
  `find_access_key` la encuentre por igualdad.
- **`access_key_status` derivado:** una clave `pending` con `expires_at` vencido se informa como
  `expired` (nadie actualiza la fila al vencer). La "vigente" es la de `expires_at` más reciente,
  porque `access_keys` no tiene `created_at`.
- **`COMPANY_NAME_TAKEN`** compara sin mayúsculas ni espacios repetidos, solo contra empresas
  `active`. **`ADMIN_EMAIL_TAKEN`** compara contra todas. Las dos son validaciones de aplicación: la
  base no tiene índice único para ellas.
- **Audit trail:** `company.create` en `audit_logs` con `tenant_id` nulo (acción de plataforma); la
  clave nunca entra, ni en claro ni en hash.
