---
id: contracts-compliance-responsibles
name: Contrato — Cumplimiento, cargos responsables
description: Los cargos de la organización que responden ante el auditor y la persona que hoy los ocupa.
type: contract
---

# Cargos de la organización

| | |
|---|---|
| **Estado** | **ACORDADO** (2026-10-17); construido (MD-133) |
| **App** | Monkey Platform |
| **Entidad** | `organization_responsibles` (`modelo-datos.md` §5.4) |
| **Convenciones** | [`conventions.md`](../conventions.md) · enums: [`enums.md`](../enums.md) (`responsible_type`) |

**Qué es.** Cada evidencia, riesgo y activo debe tener un responsable ante el auditor. Un **cargo** (COO, TI, Cumplimiento…) y la **persona** que lo ocupa son cosas distintas: si la persona cambia, lo que apunta al cargo no se toca (A1, D30). **Un cargo no exige que la persona tenga cuenta.**

> **No es el rol `responsable` (D102).** El cargo responde ante el auditor; el rol `responsable` es una persona con cuenta, dueña de controles (`gestion-usuarios.md`). Por eso en pantalla y en los documentos se llama **«cargos de la organización»**.

## Quién puede qué

| Acción | `admin_empresa` | `responsable` y `delegado` | `auditor` |
|---|---|---|---|
| Ver | ✓ | ✓ | ✓ |
| Crear, cambiar la persona, quitar | ✓ | `403` | `403` |

## Índice de endpoints

| Método | Ruta | Para qué |
|---|---|---|
| `GET` | [`/v1/responsibles`](#get-v1responsibles--listar-los-cargos) | Listar los cargos |
| `POST` | [`/v1/responsibles`](#post-v1responsibles--crear-un-cargo) | Crear un cargo |
| `PATCH` | [`/v1/responsibles/{id}`](#patch-v1responsiblesid--cambiar-la-persona) | Cambiar la persona que lo ocupa |
| `DELETE` | [`/v1/responsibles/{id}`](#delete-v1responsiblesid--quitar-un-cargo) | Quitar un cargo |

## El enum `responsible_type`

Ver [`enums/onboarding/contexto-organizacional.md`](../enums/onboarding/contexto-organizacional.md#responsible_type).

| Valor | Etiqueta (es) |
|---|---|
| `coo` | COO |
| `it` | TI |
| `compliance` | Cumplimiento |
| `process` | Proceso |
| `ciso` | CISO |
| `asset_owner` | Propietario del activo |

---

### GET /v1/responsibles — Listar los cargos

| | |
|---|---|
| **Quién** | `admin_empresa` · `responsable` · `delegado` · `auditor` |
| **Éxito** | `200`, paginada |

#### Parámetros (query)
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `type` | enum `responsible_type` | no | Filtro |
| `page`, `page_size` | integer | no | Ver `conventions.md` |

#### Response `200`
| Campo del ítem | Tipo | Qué es |
|---|---|---|
| `id` | uuid | |
| `type` | enum `responsible_type` | |
| `person_name` | string | Quien ocupa el cargo hoy |
| `is_in_use` | boolean | `true` si algo (un requerimiento de evidencia, un tratamiento de riesgo, un activo) apunta al cargo |

```json
{
  "statusCode": 200,
  "message": "responsible.list",
  "data": {
    "items": [ { "id": "c9d0…", "type": "compliance", "person_name": "Marta Ruiz", "is_in_use": true } ],
    "page": 1, "page_size": 25, "total": 1, "total_pages": 1
  }
}
```

### POST /v1/responsibles — Crear un cargo

| | |
|---|---|
| **Quién** | `admin_empresa` |
| **Éxito** | `201` con el cargo (el nombre se guarda recortado) |
| **Errores** | `403` · `409 RESPONSIBLE_ALREADY_EXISTS` · `409 ORGANIZATION_NOT_DECLARED` · `422 VALIDATION_FAILED` |

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `type` | enum `responsible_type` | sí | |
| `person_name` | string | sí | Repetir el mismo `type` con la misma `person_name` es `409 RESPONSIBLE_ALREADY_EXISTS`. Puede haber varios `asset_owner`, con nombres distintos |

```json
{ "type": "ciso", "person_name": "Andrés Pardo" }
```

> Si la organización aún no está declarada, crear un cargo responde `409 ORGANIZATION_NOT_DECLARED`.

### PATCH /v1/responsibles/{id} — Cambiar la persona

| | |
|---|---|
| **Quién** | `admin_empresa` |
| **Éxito** | `200` con el cargo; **todo lo que apuntaba a él sigue apuntándole** |
| **Errores** | `403` · `404` · `409 RESPONSIBLE_ALREADY_EXISTS` · `422` |

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `person_name` | string | sí | Solo cambia la persona (`type` no cambia) |

```json
{ "person_name": "Luisa Mejía" }
```

### DELETE /v1/responsibles/{id} — Quitar un cargo

| | |
|---|---|
| **Quién** | `admin_empresa` |
| **Éxito** | `204` |
| **Errores** | `403` · `404` · `409 RESPONSIBLE_IN_USE` |

Si el cargo está en uso, `409 RESPONSIBLE_IN_USE`: primero se reasigna lo que apunta a él. Cuentan los activos, las evidencias requeridas y los tratamientos de un riesgo (MD-123).

---

## Errores del módulo

| HTTP | `error.code` | Cuándo |
|---|---|---|
| 403 | `FORBIDDEN` | El rol no es `admin_empresa` |
| 404 | `NOT_FOUND` | El cargo no existe para esta empresa |
| 409 | `RESPONSIBLE_ALREADY_EXISTS` | Ya existe ese cargo con esa persona (al crear o al cambiar la persona) |
| 409 | `RESPONSIBLE_IN_USE` | Se quita un cargo del que algo depende |
| 409 | `ORGANIZATION_NOT_DECLARED` | Se crea un cargo sin que la organización esté declarada |
| 422 | `VALIDATION_FAILED` | `required`, `enum.invalid` (`type`), `string.max` (`person_name`) |

**Claves i18n:** `responsible.list`, `responsible.created`, `responsible.updated`.

### Ejemplos de error

Todos con el mismo sobre (`conventions.md`); `message` es la clave i18n del error.

**`409` — quitar un cargo del que algo depende**
```json
{ "statusCode": 409, "message": "responsible.in_use", "data": null, "error": { "code": "RESPONSIBLE_IN_USE" } }
```

**`403` — un `responsable` o `delegado` intenta crear un cargo**
```json
{ "statusCode": 403, "message": "common.forbidden", "data": null, "error": { "code": "FORBIDDEN" } }
```

## Auditoría

`responsible.create` · `responsible.update` · `responsible.delete`. Cada alta, cambio y baja deja su rastro en la misma transacción.

## Preguntas abiertas

- **Asignar controles a una persona con cuenta** no es esto: es la asignación de dueño y ejecutor de [`gestion-usuarios.md`](../gestion-usuarios.md) (D102, MD-192).

---

## Estado de implementación

**Construido: MD-133** (2026-10-14).
