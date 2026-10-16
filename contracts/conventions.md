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

- **Los fallos también se registran**, con `result = error`: un intento rechazado es justo lo que un auditor pide ver. Como no hay
  efecto con el que ser atómico, se escriben aparte (de mejor esfuerzo); un fallo de ese registro no tumba la respuesta.
- **Nunca se guarda un secreto** en `before_state` ni `after_state`: ni la clave de acceso, ni la contraseña, ni un
  hash, ni un token. Se guarda el `id` del recurso, no su credencial.
- **Se escribe sin `RETURNING`** (`createMany` o SQL directo): una acción de plataforma sin tenant no pasa la
  política de lectura (`modelo-datos.md` §5.3).
- **Se escribe en la misma transacción** que la acción: si la acción se revierte, su fila también, **y si el rastro falla, la acción
  se revierte** (`500`). Es la regla de D52 (SEG-36). Excepción: los cierres automáticos de sesión no se registran (DT-47).

## Progreso del onboarding

Los formularios del comité calculan completitud. La API la expone en vez de que el frontend la
recalcule:

```json
{ "completion": { "required_total": 9, "required_filled": 7, "optional_total": 1, "optional_filled": 0 } }
```

Esto es un contador de campos de un formulario, **no un readiness ni un porcentaje de cumplimiento**
(`philosophy.md`, D80): el cumplimiento se muestra con estado, porcentaje de avance y cobertura juntos.

## Textos

- Un `message` destinado al cliente final es una frase clara (`philosophy.md`). Los códigos (`CC6.1`, `IAC-12`)
  viajan como dato en `data` y las pantallas los **muestran siempre** (D80).
- Lo generado por IA viaja siempre con su marca: `"is_ai_generated": true` y `"ai_confidence"`.
  Nunca se presenta inferencia como hecho verificado.
- Ningún campo ni mensaje nombra al proveedor del motor de monitoreo.

## Cumplimiento: roles, vistas y decisiones

Lo que comparten todos los módulos de Cumplimiento (`modules/compliance-*.md`). Los contratos no lo repiten.

**Quién es quién.** Los 5 roles son `admin_monkey`, `admin_empresa`, `funcional`, `consultor` y `auditor` (`modelo-datos.md` §5.1, §5.5). Todo se resuelve
**en el servidor, con el rol leído de la base**, nunca con lo que mande el frontend. El `consultor` trabaja en **una empresa a la vez** (la que eligió al
iniciar sesión, MD-160); el resto de roles, en la suya. El acceso de `admin_monkey` al cumplimiento de una empresa (solo lectura, MD-146) tiene sus propios endpoints en Monkey Admin y
**no está definido aquí**: hasta entonces estos endpoints le responden `403`.

**403 o 404.**

| Situación | Respuesta |
|---|---|
| El recurso es de **otra empresa** | `404` (que exista no se informa) |
| El `funcional` pide o escribe algo de su empresa que **no tiene asignado** | `403` |
| El rol no puede hacer esa acción (p. ej. el auditor intenta proponer) | `403` |
| Una lista que el `funcional` no puede ver completa | no falla: **devuelve solo lo suyo** (vacía si no tiene nada) |

**Vista de negocio y vista técnica.** Por defecto, todo `GET` de Cumplimiento devuelve la **vista de negocio**: en qué falla, con el estado cualitativo y **con los códigos**
(`code` del control y `requirement_codes`, D80). Con **`?view=technical`** se agrega el objeto `technical` (puntos de enfoque, estados de evaluación de
`enums.md`, pruebas). **Pueden pedirla los roles `auditor`, `consultor` y, desde D81, `admin_empresa`; para el `funcional` responde `403`**
(D63, D64, D81, SEG-54). La vista técnica **agrega**, nunca quita: es la de negocio más `technical`.

**Cómo se mide en la vista de negocio.** El estado cualitativo (`readiness`: `ready` · `almost_ready` · `needs_work` · `not_measured`) **y** el porcentaje de avance se muestran
**juntos**, con la cobertura al lado (D80). La API manda conteos; **el porcentaje no viaja**, la pantalla lo deriva: avance = `done / total`, cobertura = `measured / applicable`.
Reglas del cálculo en pantalla: se **trunca** a entero (nunca se redondea hacia arriba: 99,6 % no es 100 %, porque 100 % es lo único que cumple); si el total es 0 no hay porcentaje
(se muestra solo el estado); y nunca hay uno de toda la empresa. El porcentaje **informa, no decide** (`philosophy.md`).

```json
{ "readiness": "almost_ready", "progress": { "done": 4, "total": 5 }, "coverage": { "measured": 5, "applicable": 5 } }
```

- `progress`: lo que **cumple** sobre el total del nivel (controles efectivos / controles únicos, tests que cumplen / tests…).
- `coverage`: lo que **ya tiene resultado** sobre lo aplicable. `100% de lo medido` con cobertura baja **nunca** es `ready`.
- `not_measured` no es un fallo: es un hueco de cobertura. Lo pendiente **no cuenta como cumplido** (§9).
- No existe un número de «cumplimiento de la empresa»: la unidad es el par servicio × marco.

**Textos de pruebas.** Una respuesta al cliente nunca trae el texto de una prueba del comité ni nombra al proveedor del motor. Una prueba viaja como
`display_name` (el nombre neutro que escribe Monkey, D70). Los códigos de prueba (`T-DOC-001`) solo van en `technical`.

**Lo generado por IA** viaja marcado: `"is_ai_generated": true` y `"ai_confidence"`. Una sugerencia de la IA **nunca** decide nada.

**Decisiones sobre una propuesta.** Aprobar o rechazar algo que otro propuso (un cambio de control, una exclusión, una evidencia) es un `PATCH` sobre ese recurso:

```json
{ "status": "rejected", "decision_note": "La interpretación no cubre el acceso remoto." }
```

`decision_note` es **obligatoria al rechazar** y opcional al aprobar. Quien decide queda en `decided_by` y `decided_at`. Una propuesta ya decidida no se vuelve a
decidir: `409 ALREADY_DECIDED`. Nadie decide lo que él mismo propuso (`403`).

**Baja, no borrado.** `DELETE` sobre un riesgo, causa o control **desactiva** (`is_active = false`) y devuelve `204`: el histórico se conserva y la fila sigue existiendo
(las evaluaciones son inmutables). Una colección omite lo inactivo salvo `?include_inactive=true`.

**Auditoría.** Cada escritura deja su `audit_logs` en la misma transacción (D52) y, si cambia el estado de cumplimiento, un `compliance_events`. Las `action`
de cada módulo están en su tabla «Auditoría».

