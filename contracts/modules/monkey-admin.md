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

El comité fija **3 campos**, no más (`modelo-datos.md` §4.2).

| Campo | Tipo | Oblig. | Enum | Destino |
|---|---|---|---|---|
| `name` | string | sí | — | `companies.name` — razón social. Se fija aquí y llega bloqueada al Componente 1 |
| `requires_dedicated_database` | boolean | sí | — | deriva `companies.isolation_strategy` |
| `admin_email` | string (email) | sí | — | `companies.admin_email` |

`requires_dedicated_database: true` → `isolation_strategy: "dedicated"`; `false` → `"shared"`.
El booleano es lo que ve `admin_monkey`; el enum es lo que se guarda.

## `POST /v1/companies` — registrar empresa

```json
{
  "name": "Next Audit & Consulting S.A.S.",
  "requires_dedicated_database": false,
  "admin_email": "contacto@ejemplo.com"
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

## Errores

| HTTP | `error.code` | Cuándo |
|---|---|---|
| 409 | `COMPANY_NAME_TAKEN` | Ya existe una empresa activa con esa razón social |
| 409 | `ADMIN_EMAIL_TAKEN` | Ese `admin_email` ya es administrativo de otra empresa |
| 409 | `COMPANY_ALREADY_ONBOARDED` | Se intenta editar tras el canje de la clave |
| 409 | `ACCESS_KEY_NOT_PENDING` | Se intenta regenerar una clave ya usada |
| 422 | `VALIDATION_FAILED` | `name` vacío o >255, `admin_email` inválido |
| 503 | `PROVISIONING_FAILED` | Falló el aprovisionamiento de la base dedicada |

Claves i18n: `company.created`, `company.list`, `company.updated`,
`company.name_taken`, `company.admin_email_taken`, `company.already_onboarded`,
`access_key.regenerated`, `access_key.not_pending`, `validation.failed`.

## Notas

- Esta UI es **interna del equipo Monkey**: aquí sí se puede usar lenguaje técnico. La regla de
  "sin jerga" de `philosophy.md` aplica a Monkey Platform.
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
