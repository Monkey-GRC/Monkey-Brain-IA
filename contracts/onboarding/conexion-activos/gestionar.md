---
id: contracts-onboarding-c3-gestionar
name: Contrato — Onboarding, Conexión de activos, gestionar
description: Editar, quitar, activar, programar y listar los activos.
type: contract
---

# Conexión de activos — gestionar, activar y programar

| | |
|---|---|
| **Qué es** | Editar, quitar, activar, programar y listar los activos |
| **Rol** | `admin_empresa` |
| **Contexto común** | Confidencialidad, errores, estado de implementación y preguntas abiertas: [`README.md`](README.md) |

## Índice de endpoints

| Método | Ruta | Para qué |
|---|---|---|
| `PATCH` | [`/v1/assets/{id}`](#patch-v1assetsid--editar-un-sistema) | Editar un sistema |
| `DELETE` | [`/v1/assets/{id}`](#delete-v1assetsid--quitar-un-sistema) | Quitar un sistema (baja) |
| `POST` | [`/v1/assets/{id}/activate`](#post-v1assetsidactivate--activar) | Activar |
| `PUT` | [`/v1/assets/{id}/schedule`](#put-v1assetsidschedule--programar) | Programar la frecuencia |
| `GET` | [`/v1/assets`](#get-v1assets--listar) | Listar |

---

### PATCH /v1/assets/{id} — Editar un sistema

| | |
|---|---|
| **Quién** | `admin_empresa` |
| **Éxito** | `200` con el mismo cuerpo que el detalle |
| **Errores** | `403` · `404` · `409 EXECUTION_IN_PROGRESS` · `422` (`connection.account_mismatch`, `field.not_allowed`, regiones fuera del catálogo) |

#### Request
Todo opcional.

| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `name`, `criticality`, `tags` | | no | **No tocan la conexión** |
| `external_account_id`, `regions` | | no | **Solo en una cuenta de nube** |
| `role_arn` | string | no | Canal de rol. De otra cuenta que la declarada: `422 connection.account_mismatch` |
| `credentials` | objeto | no | Canal de llaves: reemplaza las guardadas y **nunca se devuelve** |

#### Reglas
- Cambiar cuenta, regiones, rol o llaves **invalida lo comprobado:** `connection_status` vuelve a `pending`, se pierde la activación y la programación, y el activo pasa a `not_monitored`. El historial de evaluaciones **se conserva**.
- Cambiar de cuenta además **renueva el `external_id`** (el anterior se entregó para otra cuenta) y descarta el `role_arn`, salvo que llegue uno nuevo.
- Cambios de conexión en un activo que no es de nube con rol o llaves: `422 field.not_allowed`.
- `409 EXECUTION_IN_PROGRESS` si hay una comprobación o evaluación en curso.
- **Auditoría:** `asset.update`.

### DELETE /v1/assets/{id} — Quitar un sistema

| | |
|---|---|
| **Quién** | `admin_empresa` |
| **Éxito** | `200` con `data: null` |
| **Errores** | `403` · `404` (un segundo `DELETE`) · `409 EXECUTION_IN_PROGRESS` |

Es una **baja, no un borrado:** `assets.status = inactive`, la conexión se desactiva y el activo deja de listarse (`GET` responde `404`) y de evaluarse. Ejecuciones, resultados y hallazgos **se conservan** (son evidencia). **Los activos que la conexión descubrió se dan de baja con ella** y se desenlazan de los servicios.

> **Auditoría:** `asset.retire`.

### POST /v1/assets/{id}/activate — Activar

| | |
|---|---|
| **Quién** | `admin_empresa` |
| **Éxito** | `200`: `is_active: true` y `operational_status: "operational"` |
| **Errores** | `403` · `404` · `409 ASSET_NOT_VALIDATED` · `409 ASSET_ALREADY_ACTIVE` |

Requiere `connection_status: "validated"`. Con la conexión sin validar, `409 ASSET_NOT_VALIDATED`. (Con la sonda simulada deja `operational_status = warning`, no `operational`: «Automatizado ≠ Operativo».)

### PUT /v1/assets/{id}/schedule — Programar

| | |
|---|---|
| **Quién** | `admin_empresa` |
| **Éxito** | `200` |
| **Errores** | `403` · `404` · `409 ASSET_NOT_ACTIVE` · `422 FREQUENCY_NOT_SUPPORTED` |

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `frequency` | enum `schedule_frequency` | sí | Las frecuencias que admite cada conexión salen de `capability_frequencies`: `ac_01` → `every_6h` o `every_24h`; `ac_02` a `ac_06` → `continuous`. Una que la capacidad no soporta: `422 FREQUENCY_NOT_SUPPORTED` |

```json
{ "frequency": "continuous" }
```

### GET /v1/assets — Listar

| | |
|---|---|
| **Quién** | `admin_empresa` |
| **Éxito** | `200`, paginado |

**Solo conexiones** (y lo registrado a mano): los activos descubiertos viven dentro de su conexión (D61).

#### Parámetros (query)
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `service_id` | uuid | no | Filtro |
| `connection_category` | enum `connection_category` | no | Filtro |
| `operational_status` | enum `operational_status` | no | Filtro |
| `page`, `page_size` | integer | no | Ver `conventions.md` |

#### Response `200`
Cada elemento trae `code`, `name`, `connection_category`, `operational_status`, `technical_coverage` y `provisioning.connection_status`.
