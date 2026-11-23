---
id: contracts-compliance-observations
name: Contrato — Cumplimiento, observaciones del auditor
description: Lo que el auditor escribe sobre un control o una evidencia, cómo lo responde la empresa y cómo se cierra.
type: contract
---

# Cumplimiento — observaciones del auditor

| | |
|---|---|
| **Estado** | **ACORDADO** (D96), construido (MD-154, 2026-10-29); el alcance por dueño o ejecutor, en MD-193 (D102, 2026-11-17) |
| **App** | Monkey Platform |
| **Contexto común** | Quién puede qué, estado general y errores comunes: [`README.md`](README.md) |
| **Entidades** | `audit_observations` (`modelo-datos.md` §7.6) · enums: [`enums.md`](../enums.md) (`audit_observation_type`, `audit_observation_status`) |

Una observación **no es un hallazgo**: el hallazgo lo detecta el sistema y la observación la redacta una persona. **No mueve el porcentaje:** el cumplimiento solo cambia por el camino normal (la respuesta entra como evidencia, el administrador la valida o da el veredicto).

## Índice de endpoints

| Método | Ruta | Quién | Para qué |
|---|---|---|---|
| `POST` | [`/v1/services/{service_id}/observations`](#post-v1servicesservice_idobservations--registrar-una-observación) | `auditor` | Registrar una observación |
| `GET` | [`/v1/services/{service_id}/observations`](#get-v1servicesservice_idobservations--listar-observaciones) | `admin_empresa` · `auditor` · `responsable` · `delegado` | Listar (cada uno ve lo suyo) |
| `GET` | [`/v1/observations/{id}`](#get-v1observationsid--ver-una-observación) | los mismos | Ver una observación |
| `PATCH` | [`/v1/observations/{id}`](#patch-v1observationsid--editar-cerrar-o-devolver) | Solo su autor (`auditor`) | Editar el texto, cerrar o devolver a `open` |
| `POST` | [`/v1/observations/{id}/answer`](#post-v1observationsidanswer--responder) | `admin_empresa` · dueño · ejecutor | Responder |

## El objeto observación

| Campo | Tipo | Qué es |
|---|---|---|
| `id` | uuid | |
| `service_id` | uuid | |
| `client_control_id` | uuid \| null | El control sobre el que habla; nulo si es de un servicio completo |
| `evidence_submission_id` | uuid \| null | La evidencia sobre la que habla |
| `type` | enum `audit_observation_type` | `observation` · `recommendation` · `information_request` |
| `body` | string | Máx. 5000 |
| `status` | enum `audit_observation_status` | `open` → `answered` → `closed` |
| `created_by` | `{ id, name, last_name, role }` | |
| `created_at` | datetime | |
| `answer_note`, `answer_evidence_id`, `answered_by`, `answered_at` | | La respuesta de la empresa |
| `closed_by`, `closed_at` | | |

```json
{
  "id": "6a41…",
  "service_id": "55aa…",
  "client_control_id": "3f1c…",
  "evidence_submission_id": null,
  "type": "recommendation",
  "body": "Documentar el procedimiento de baja de cuentas de contratistas.",
  "status": "open",
  "created_by": { "id": "d5e6…", "name": "Camilo", "last_name": "Ortiz", "role": "auditor" },
  "created_at": "2026-10-14T18:45:00Z",
  "answer_note": null,
  "answer_evidence_id": null,
  "answered_by": null,
  "answered_at": null,
  "closed_by": null,
  "closed_at": null
}
```

---

### POST /v1/services/{service_id}/observations — Registrar una observación

| | |
|---|---|
| **Quién** | `auditor` |
| **Éxito** | `201` con la observación, `open` |
| **Errores** | `403` · `404` · `409 CONTROL_RETIRED` · `422 VALIDATION_FAILED` |

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `type` | enum `audit_observation_type` | sí | |
| `body` | string | sí | Máx. 5000 |
| `client_control_id` | uuid | no | Si no existe, o es de otro servicio u otra empresa: `404`. Un control dado de baja: `409 CONTROL_RETIRED` |
| `evidence_submission_id` | uuid | no | Si no existe o es de otro servicio: `404` |

**Sobre qué habla:** un servicio completo (sin `client_control_id`), un control o una evidencia.
- **Solo evidencia:** la observación queda también en el control de esa entrega (`client_control_id` se completa solo), porque una entrega pertenece a un único control; así la ven su dueño y su ejecutor.
- **Control y evidencia a la vez:** la evidencia debe ser de ese control; si no, `422` con `evidence_submission_id: control.mismatch`.
- **Control dado de baja:** no se le abren observaciones nuevas; las que ya tenía se siguen leyendo.

### GET /v1/services/{service_id}/observations — Listar observaciones

| | |
|---|---|
| **Quién** | `admin_empresa` y `auditor`: todas · `responsable`: las de los controles que tiene a su cargo · `delegado`: las de los que ejecuta |
| **Éxito** | `200`, paginada, de la más reciente a la más antigua |
| **Errores** | `403` (`admin_monkey`) · `404` |

#### Parámetros (query)
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `status` | enum `audit_observation_status` | no | Filtro |
| `type` | enum `audit_observation_type` | no | Filtro |
| `client_control_id` | uuid | no | Filtro |
| `page`, `page_size` | integer | no | `page_size` máx. 100 |

> **Quién la ve (D102, SEG-66).** Las de un servicio completo, solo `admin_empresa` y `auditor`. El `responsable` y el `delegado` reciben las de sus controles, **y también llegan a «Mi trabajo» del dueño y del ejecutor**. La lista le llega filtrada (vacía si no tiene ningún control); el detalle de una ajena de su empresa es `403`, de otra empresa `404`.

### GET /v1/observations/{id} — Ver una observación

| | |
|---|---|
| **Quién** | Los mismos del listado |
| **Éxito** | `200` |
| **Errores** | `403` (un `responsable` o `delegado` de un control que no es suyo, o de un servicio completo) · `404` |

### PATCH /v1/observations/{id} — Editar, cerrar o devolver

| | |
|---|---|
| **Quién** | **Solo su autor** (`auditor`) |
| **Éxito** | `200` |
| **Errores** | `403` · `404` · `409 OBSERVATION_CLOSED` · `409 INVALID_TRANSITION` · `422 body_or_status.required` · `422 body_or_status.exclusive` |

#### Request
**Una sola cosa por petición.**

| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `body` | string | una de las dos | Edita el texto (máx. 5000) mientras no esté cerrada |
| `status` | enum | una de las dos | Solo `open` (devolver: no queda conforme) o `closed` (cerrar) |

```json
{ "status": "closed" }
```

#### Reglas
- **Solo quien la escribió** la edita, la cierra o la devuelve a `open`. Otro auditor de la misma empresa, el `admin_empresa`, el `responsable`, el `delegado` y `admin_monkey` reciben `403`; ese `403` va **antes** que cualquier error de estado.
- Ni vacío (`422 body_or_status.required`) ni texto y estado juntos (`422 body_or_status.exclusive`).
- Solo se cierra, o se devuelve, una `answered`. **Una cerrada no se reabre ni se toca:** si hace falta algo más, se crea otra. **Nunca se borra** (SEG-69: lo impone la base, no solo la API).
- **Devolver a `open` conserva la última respuesta** (`answer_note`, `answer_evidence_id`, `answered_by`, `answered_at`) hasta que la empresa dé otra. La respuesta anterior queda en el rastro de auditoría (`before_state` de `observation.answer`), que es lo único que la conserva.

### POST /v1/observations/{id}/answer — Responder

| | |
|---|---|
| **Quién** | `admin_empresa` · el dueño (`responsable`) o el ejecutor (`delegado`) del control. Las de un servicio completo las atiende solo el `admin_empresa` |
| **Éxito** | `200`, pasa a `answered` |
| **Errores** | `403` · `404` · `409 OBSERVATION_CLOSED` · `409 OBSERVATION_NOT_OPEN` · `422 required` |

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `answer_note` | string | sí | Máx. 2000; en blanco, `422 required` |
| `answer_evidence_id` | uuid | no | Una entrega de un control **del mismo servicio**; si no, `404` |

```json
{ "answer_note": "Se documentó el procedimiento y se adjunta la versión firmada.", "answer_evidence_id": "5c2d…" }
```

---

## Precedencia de errores de estado

`OBSERVATION_CLOSED` manda sobre los demás: una cerrada no admite nada (editar, responder, cerrar o devolver). Después, `OBSERVATION_NOT_OPEN` al responder una ya respondida e `INVALID_TRANSITION` al cerrar o devolver una abierta. Dos peticiones a la vez sobre la misma observación se atienden una tras otra (la fila se bloquea): la segunda ve el estado ya cambiado y recibe el `409` que le toca.

Las opciones de `type` y `status` las sirve `GET /v1/catalogs/audit_observation_type` y `/audit_observation_status` (`enums.md`).

## Errores del módulo

Los errores comunes (`FORBIDDEN`, `NOT_FOUND`, `VALIDATION_FAILED`) están en [`README.md`](README.md#errores-comunes); aquí solo los propios.

| HTTP | `error.code` | Cuándo |
|---|---|---|
| 409 | `CONTROL_RETIRED` | Abrir una observación sobre un control dado de baja |
| 409 | `OBSERVATION_CLOSED` | Editar, responder, cerrar o devolver una observación cerrada (manda sobre los otros dos) |
| 409 | `OBSERVATION_NOT_OPEN` | Responder una que ya está `answered` |
| 409 | `INVALID_TRANSITION` | Cerrar una que no está `answered`, o devolver a `open` una que no lo está |

**Claves i18n:** `observation.*`.

### Ejemplos de error

Todos con el mismo sobre (`conventions.md`); `message` es la clave i18n del error.

**`409` — cerrar una observación que no está respondida**
```json
{ "statusCode": 409, "message": "observation.invalid_transition", "data": null, "error": { "code": "INVALID_TRANSITION" } }
```

**`403` — cerrar una observación que escribió otra persona**
```json
{ "statusCode": 403, "message": "common.forbidden", "data": null, "error": { "code": "FORBIDDEN" } }
```

## Auditoría

| `action` | Cuándo | Quién |
|---|---|---|
| `observation.create` · `.update` · `.close` · `.return` | Registrar, editar el texto, cerrar y devolver a `open` una observación | `auditor` (su autor) |
| `observation.answer` | La empresa responde | `admin_empresa`, `responsable` o `delegado` |

La auditoría lleva el texto (`body`, `answer_note`) antes y después: es lo que conserva una respuesta que el auditor devuelve y la empresa reemplaza. Nunca el contenido de una evidencia.

## Preguntas abiertas

- **`P37`:** criterios de las observaciones que desarrollo fijó sin que el comité los pidiera (qué es «abierta» para el veredicto, controles dados de baja, la evidencia de una respuesta, conservar la última respuesta, aviso a la empresa).
- **Reportes en PDF y Excel** del auditor: el contenido está por definir, no tienen contrato todavía.

---

## Estado de implementación

**Construido (MD-154, 2026-10-29): las observaciones del auditor.** Tabla `tenant.audit_observations` (RLS por empresa, restricciones de coherencia y un trigger que impone en la base que nunca se borran y que una cerrada no se toca, SEG-69; solo desaparecen con la purga de una empresa archivada, D97). Cinco endpoints (arriba), permisos SEG-70, rastro en la misma transacción (`observation.*`). **No mueven el porcentaje:** no escriben evaluaciones ni eventos de cumplimiento (lo comprueba una prueba).

Dos reglas que salían de otros documentos y quedan cerradas: el veredicto exige la razón cuando el control de origen tiene observaciones `open` (D85, antes la mitad de `DT-80`), y un servicio con observaciones no se borra (`SERVICE_HAS_EVALUATIONS`: son historia, igual que las evaluaciones). Los tipos y estados se sirven en `GET /v1/catalogs/{nombre}`.

Pruebas: `test/cumplimiento/observaciones.e2e-spec.ts`, el bloque final de `veredictos.e2e-spec.ts` y `src/features/compliance/domain/observations/observation-lifecycle.spec.ts`.

**Fuera de alcance, a propósito:** las pantallas (los permisos por pantalla ya no se esperan: D102) y el aviso a la empresa de que tiene una observación nueva (el sistema de correos y notificaciones no existe todavía; se decidió en D143 y lo construye MD-69; mientras tanto la empresa la ve al entrar al servicio y en «Mi trabajo»).
