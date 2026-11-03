---
id: contracts-onboarding-c3-gestionar
name: Contrato — Onboarding, Conexión de activos, gestionar
description: Editar, quitar, activar, programar y listar los activos.
type: contract
---

# Conexión de activos — gestionar, activar y programar

Contexto común del componente (confidencialidad, errores, estado de implementación y preguntas abiertas): [`README.md`](README.md).

### `PATCH /v1/assets/{id}` — editar un sistema

Todo opcional: `name`, `criticality`, `tags` y, **solo en una cuenta de nube**, `external_account_id`, `regions`, `role_arn` (canal de rol) y
`credentials` (canal de llaves, reemplaza las guardadas y **nunca se devuelve**). `200` con el mismo cuerpo que el detalle.

- Nombre, criticidad y etiquetas **no tocan la conexión**.
- Cambiar cuenta, regiones, rol o llaves **invalida lo comprobado**: `connection_status` vuelve a `pending`, se pierde la activación y la
  programación, y el activo pasa a `not_monitored`. El historial de evaluaciones **se conserva**.
- Cambiar de cuenta además **renueva el `external_id`** (el anterior se entregó para otra cuenta) y descarta el `role_arn`, salvo que llegue uno nuevo.
- Un `role_arn` de otra cuenta que la declarada es `422` (`connection.account_mismatch`); regiones fuera del catálogo, `422`.
- Cambios de conexión en un activo que no es de nube con rol o llaves: `422` (`field.not_allowed`). `409 EXECUTION_IN_PROGRESS` si hay una comprobación o evaluación en curso. Auditoría: `asset.update`.

### `DELETE /v1/assets/{id}` — quitar un sistema

Es una **baja, no un borrado**: `assets.status = inactive`, la conexión se desactiva y el activo deja de listarse (`GET` responde `404`) y de evaluarse.
Ejecuciones, resultados y hallazgos **se conservan** (son evidencia). **Los activos que la conexión descubrió se dan de baja con ella** y se desenlazan de los servicios. `200` con `data: null`. `409 EXECUTION_IN_PROGRESS` si hay algo en curso;
un segundo `DELETE` es `404`. Auditoría: `asset.retire`.

### `POST /v1/assets/{id}/activate` — activar

Requiere `connection_status: "validated"`. Pone `is_active: true` y
`operational_status: "operational"`. Con la conexión sin validar, `409 NOT_VALIDATED`.

### `PUT /v1/assets/{id}/schedule` — programar

```json
{ "frequency": "continuous" }
```

Las frecuencias que admite cada conexión salen de `capability_frequencies` (hoy: `ac_01` → `every_6h` o `every_24h`; `ac_02` a `ac_06` → `continuous`). Una frecuencia que
la capacidad no soporta devuelve `422 FREQUENCY_NOT_SUPPORTED`.

### `GET /v1/assets` — listar

Paginado, con filtros `service_id`, `connection_category`, `operational_status`. **Solo conexiones** (y lo registrado a mano): los activos descubiertos viven dentro de su conexión (D61). Cada elemento
trae `code`, `name`, `connection_category`, `operational_status`, `technical_coverage` y
`provisioning.connection_status`.
