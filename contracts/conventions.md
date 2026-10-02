---
id: contracts-conventions
name: Convenciones transversales de la API
description: Sobre de respuesta, forma del error de validación, i18n, multi-select, fechas, paginación e idempotencia. Aplica a todos los módulos.
type: contract
---

# Convenciones transversales

Aplica a todos los endpoints. Los módulos de `modules/` no repiten nada de aquí.

## Base

| | |
|---|---|
| Base URL | `{apiUrl}/v1` — hoy `http://localhost:3000/v1` en desarrollo |
| Nombres | Campos en `snake_case` inglés, los mismos de `modelo-datos.md`. Nunca en español, nunca `camelCase` |
| Auth | Cookie `httpOnly`, `withCredentials: true`. El cliente no manipula tokens |
| Idioma | Header `Accept-Language: es \| en`. Determina el idioma de `message` y de las etiquetas |
| Content-Type | `application/json`, salvo la carga de archivos |

## Sobre de respuesta

Todo response, de éxito o de error, usa la misma envoltura:

```json
{
  "statusCode": 200,
  "message": "organization.updated",
  "data": { }
}
```

- `statusCode` — repite el código HTTP.
- `message` — **clave i18n**, no texto. El backend la resuelve con `Accept-Language` antes de
  responder; el frontend nunca la usa para decidir lógica.
- `data` — el payload. `null` en un error, `null` en un `204`.

## Error

Mismo sobre, más `error`:

```json
{
  "statusCode": 422,
  "message": "validation.failed",
  "data": null,
  "error": {
    "code": "VALIDATION_FAILED",
    "fields": [
      { "field": "size", "code": "enum.invalid", "message": "El valor no está entre las opciones permitidas." },
      { "field": "incorporation_countries", "code": "array.min", "message": "Selecciona al menos un país." }
    ]
  }
}
```

Reglas:

- `error.code` es un identificador estable en `SCREAMING_SNAKE_CASE`; el frontend puede
  ramificar sobre él. `error.fields` solo aparece en errores de validación.
- `field` usa **el nombre del campo del request**, con notación de punto para lo anidado y de
  corchete para arrays: `services[0].data_types`.
- `message` de cada campo ya viene traducido. `code` de cada campo es la clave i18n corta
  (`enum.invalid`, `array.min`, `string.max`, `required`, `email.invalid`).
- **Se devuelven todos los errores de validación a la vez**, no el primero.

Códigos que se usan en todos los módulos:

| HTTP | `error.code` | Cuándo |
|---|---|---|
| 400 | `BAD_REQUEST` | Petición mal formada (JSON inválido, tipo imposible) |
| 401 | `UNAUTHENTICATED` | Sin cookie válida o expirada |
| 403 | `FORBIDDEN` | Autenticado pero el rol no alcanza |
| 404 | `NOT_FOUND` | El recurso no existe, o no existe **para este tenant** |
| 409 | `CONFLICT` | Choca con el estado actual (duplicado, ya usado) |
| 422 | `VALIDATION_FAILED` | El cuerpo es válido como JSON pero los valores no pasan |
| 429 | `RATE_LIMITED` | 100/min por usuario, 1000/min por empresa |
| 500 | `INTERNAL_ERROR` | Nunca expone stack ni detalle interno |

Un recurso de otro tenant responde **404, no 403**: que exista no es información que se dé.

## Enums y multi-select

- Por el cable viaja siempre el **valor** en `snake_case` (`saas`, `from_10_to_50`), nunca la
  etiqueta (`SaaS`, `10-50`).
- La etiqueta la resuelve el cliente por i18n, o la pide con `GET /v1/catalogs/{enum}`. El
  frontend **no hardcodea** listas de opciones.
- Un multi-select es un **array de valores**, nunca un string con separador:
  `"data_types": ["pii", "payment"]`. Vacío es `[]`, no `null`.
- La tabla completa de valores y etiquetas está en `enums.md`.

## Tipos

| Concepto | Forma |
|---|---|
| Identificador | `uuid` v4 en string |
| Fecha y hora | ISO 8601 en UTC con `Z`: `"2026-09-26T14:03:11Z"`. Sufijo `_at` |
| Fecha sin hora | `"2026-09-26"`. Sufijo `_at` también, según el modelo |
| Booleano | `true`/`false`, nunca `0`/`1`. Prefijo `is_`, `has_` o `requires_` |
| Opcional sin valor | `null` explícito, no ausencia de la clave |
| Dinero y porcentaje | No hay en el onboarding |

## Paginación

Toda colección que pueda crecer (activos, servicios, empresas) pagina, incluso si hoy devuelve
pocos elementos:

```
GET /v1/assets?page=1&page_size=25&sort=-created_at
```

```json
{
  "statusCode": 200,
  "message": "asset.list",
  "data": {
    "items": [],
    "page": 1,
    "page_size": 25,
    "total": 0,
    "total_pages": 0
  }
}
```

`page` arranca en 1. `page_size` por defecto 25, máximo 100. `sort` acepta un campo con `-`
para descendente.

## Escritura

- `POST` crea y devuelve `201` con el recurso completo en `data`.
- `PATCH` actualiza parcialmente: solo las claves presentes. Ausente ≠ `null`; `null` borra.
- `PUT` no se usa.
- `DELETE` devuelve `204` con `data: null`.
- Un `POST` que dispara trabajo lento (aprovisionar una base dedicada) devuelve `202` con el
  recurso y su estado, no espera.

## Auditoría

Toda acción que cambia el estado de la plataforma o de la seguridad deja una fila en `audit_logs` (MD-92). Es una
convención de **todos** los módulos, no de uno. La tabla es append-only: se agrega, nunca se edita ni se borra.

- **Qué lleva:** `action`, `resource`, `result` (`success` | `error`), `user_id` (o `attempted_email` si no hay
  usuario), `tenant_id` (nulo en una acción de plataforma), `ip_address`, `user_agent` y, si cambia un dato,
  `before_state` y `after_state`.
- **`action` es `<recurso>.<verbo>` en `snake_case`.** Las del onboarding:

| `action` | Cuándo | Quién | `tenant_id` |
|---|---|---|---|
| `company.register` | `admin_monkey` registra la empresa | `admin_monkey` | nulo |
| `access_key.regenerate` | `admin_monkey` regenera o reenvía la clave | `admin_monkey` | la empresa |
| `access_key.redeem` | el cliente canjea la clave (también si falla: `result = error`) | nuevo `admin_empresa`, o `attempted_email` | la empresa |
| `user.create` | se crea una cuenta, incluida la de `admin_empresa` al canjear | quien la crea | la empresa |
| `auth.login` | inicio de sesión correcto | el usuario | su empresa |
| `auth.login_failed` | intento fallido (CC7.2); el email puede no existir | `attempted_email` | nulo |

- **Los fallos también se registran**, con `result = error`: un intento rechazado es justo lo que un auditor pide ver.
- **Nunca se guarda un secreto** en `before_state` ni `after_state`: ni la clave de acceso, ni la contraseña, ni un
  hash, ni un token. Se guarda el `id` del recurso, no su credencial.
- **Se escribe sin `RETURNING`** (`createMany` o SQL directo): una acción de plataforma sin tenant no pasa la
  política de lectura (`modelo-datos.md` §5.3).
- **Se escribe en la misma transacción** que la acción: si la acción se revierte, su fila también.

## Progreso del onboarding

Los formularios del comité calculan completitud. La API la expone en vez de que el frontend la
recalcule:

```json
{ "completion": { "required_total": 9, "required_filled": 7, "optional_total": 1, "optional_filled": 0 } }
```

El **porcentaje no se devuelve como métrica principal** en nada que vea el cliente: eso lo fija
`philosophy.md`. Aquí es un contador de campos de un formulario, no un readiness de cumplimiento.

## Textos

- La API nunca devuelve jerga técnica de compliance en un `message` destinado al cliente final
  (`philosophy.md`). Los códigos técnicos (`CC6.1`) viajan como dato en `data`, no como prosa.
- Lo generado por IA viaja siempre con su marca: `"is_ai_generated": true` y `"ai_confidence"`.
  Nunca se presenta inferencia como hecho verificado.
- Ningún campo ni mensaje nombra al proveedor del motor de monitoreo.
