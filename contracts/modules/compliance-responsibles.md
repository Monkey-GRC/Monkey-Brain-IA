---
id: contracts-compliance-responsibles
name: Contrato — Cumplimiento, cargos responsables
description: Los cargos de la organización que responden ante el auditor y la persona que hoy los ocupa.
type: contract
---

# Cumplimiento — cargos responsables

**Estado: PROPUESTA (2026-10-14).** Ver `conventions.md` y `enums.md`. Ticket: MD-133.

**Qué es.** Cada evidencia, riesgo y activo debe tener un responsable. Un **cargo** (COO, TI, Cumplimiento…) y la **persona** que lo ocupa son cosas distintas: si la persona cambia, lo que apunta al cargo no se toca
(A1, D30). El cargo **no es el rol** en el sistema: el cargo responde ante el auditor; el rol dice qué puede hacer la persona en Monkey. Un cargo **no exige** que la persona tenga cuenta.
**Entidad:** `organization_responsibles` (`modelo-datos.md` §5.4). **App:** Monkey Platform.

## Quién puede qué

| Acción | `admin_empresa` | `funcional` | `consultor` | `auditor` |
|---|---|---|---|---|
| Ver | ✓ | ✓ | ✓ | ✓ |
| Crear, cambiar la persona, quitar | ✓ | `403` | `403` | `403` |

## `responsible_type`

`coo` COO · `it` TI · `compliance` Cumplimiento · `process` Proceso · `ciso` CISO · `asset_owner` Propietario del activo (`enums.md`).

## `GET /v1/responsibles`

Paginada. Filtro `type`.

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

`is_in_use` es `true` si algo (un requerimiento de evidencia, un tratamiento de riesgo, un activo) apunta al cargo.

## `POST /v1/responsibles`

```json
{ "type": "ciso", "person_name": "Andrés Pardo" }
```

`201` con el cargo (el nombre se guarda recortado). Repetir el mismo `type` con la misma `person_name` es `409 RESPONSIBLE_ALREADY_EXISTS`. Puede haber varios `asset_owner`, con nombres distintos.

## `PATCH /v1/responsibles/{id}`

```json
{ "person_name": "Luisa Mejía" }
```

Solo cambia la persona (`type` no cambia). `200` con el cargo; **todo lo que apuntaba a él sigue apuntándole**.

## `DELETE /v1/responsibles/{id}`

`204`. Si el cargo está en uso, `409 RESPONSIBLE_IN_USE`: primero se reasigna lo que apunta a él. Cuentan los activos, las evidencias requeridas y los tratamientos de un riesgo (MD-123).

## Errores

| HTTP | `error.code` | Cuándo |
|---|---|---|
| 403 | `FORBIDDEN` | El rol no es `admin_empresa` |
| 404 | `NOT_FOUND` | El cargo no existe para esta empresa |
| 409 | `RESPONSIBLE_ALREADY_EXISTS` | Ya existe ese cargo con esa persona (al crear o al cambiar la persona) |
| 409 | `RESPONSIBLE_IN_USE` | Se quita un cargo del que algo depende |
| 422 | `VALIDATION_FAILED` | `required`, `enum.invalid` (`type`), `string.max` (`person_name`) |

Claves i18n: `responsible.list`, `responsible.created`, `responsible.updated`.

## Ejemplos de error

Todos con el mismo sobre (`conventions.md`); `message` es la clave i18n del error.

**`409` — quitar un cargo del que algo depende**

```json
{
  "statusCode": 409,
  "message": "responsible.in_use",
  "data": null,
  "error": {
    "code": "RESPONSIBLE_IN_USE"
  }
}
```

**`403` — un `funcional` intenta crear un cargo**

```json
{
  "statusCode": 403,
  "message": "common.forbidden",
  "data": null,
  "error": {
    "code": "FORBIDDEN"
  }
}
```

## Auditoría

`responsible.create` · `responsible.update` · `responsible.delete`.

## Estado de implementación

**Construido: MD-133** (2026-10-14). Si la organización aún no está declarada, crear un cargo responde `409 ORGANIZATION_NOT_DECLARED`. Cada alta, cambio y baja deja su rastro de auditoría en la misma transacción.

## Preguntas abiertas

- **Asignar controles a una persona con cuenta** no es esto: es MD-158 (gestión de usuarios, otro sprint).
