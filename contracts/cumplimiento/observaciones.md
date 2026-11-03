---
id: contracts-compliance-observations
name: Contrato — Cumplimiento, observaciones del auditor
description: Lo que el auditor escribe sobre un control o una evidencia, cómo lo responde la empresa y cómo se cierra.
type: contract
---

# Cumplimiento — observaciones del auditor

**Contexto común** (quién puede qué, estado general y la tabla de permisos de los tres contratos de validación y auditoría): [`README.md`](README.md).

## Observaciones

Una observación **no es un hallazgo**: el hallazgo lo detecta el sistema y la observación la redacta una persona. **No mueve el porcentaje**: el cumplimiento solo cambia por el camino normal (la respuesta entra como evidencia, el administrador la valida o da el veredicto).

`type` (`audit_observation_type`): `observation` · `recommendation` · `information_request`. `status` (`audit_observation_status`): `open` → `answered` → `closed`.

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

| Endpoint | Quién | Cuerpo | Respuesta |
|---|---|---|---|
| `POST /v1/services/{service_id}/observations` | `auditor` | `{ "type", "body" (máx. 5000), "client_control_id"?, "evidence_submission_id"? }` | `201` la observación, `open` |
| `GET /v1/services/{service_id}/observations` | `admin_empresa` y `auditor`: todas · `funcional`: las de sus controles | filtros `status`, `type`, `client_control_id`; `page`, `page_size` (máx. 100) | `200` paginada, de la más reciente a la más antigua |
| `GET /v1/observations/{id}` | los mismos | — | `200`; el `funcional` de un control que no es suyo, o de un servicio completo: `403` |
| `PATCH /v1/observations/{id}` | **solo su autor** (`auditor`) | **una sola cosa:** `{ "body": "…" }` (máx. 5000) mientras no esté cerrada, o `{ "status": "closed" }`, o `{ "status": "open" }` | `200` |
| `POST /v1/observations/{id}/answer` | `admin_empresa`; `funcional` responsable del control | `{ "answer_note": "…" (máx. 2000), "answer_evidence_id"?: "…" }` | `200`, pasa a `answered` |

**Sobre qué habla.** Un servicio completo (sin `client_control_id`), un control o una evidencia.
- **Solo evidencia:** la observación queda también en el control de esa entrega (`client_control_id` se completa solo), porque una entrega pertenece a un único control; así la ve su responsable.
- **Control y evidencia a la vez:** la evidencia debe ser de ese control; si no, `422` con `evidence_submission_id: control.mismatch`.
- **No existe, o es de otro servicio u otra empresa** (control o evidencia): `404`.
- **Control dado de baja:** no se le abren observaciones nuevas (`409 CONTROL_RETIRED`); las que ya tenía se siguen leyendo.

**Quién y cuándo.**
- **Solo quien la escribió** la edita, la cierra o la devuelve a `open` (no queda conforme). Otro auditor de la misma empresa, el `admin_empresa`, el `funcional` y `admin_monkey` reciben `403`; ese `403` va **antes** que cualquier error de estado.
- **Un PATCH hace una sola cosa.** Ni vacío (`422 body_or_status.required`) ni texto y estado juntos (`422 body_or_status.exclusive`). El estado admite solo `open` y `closed`.
- Solo se cierra, o se devuelve, una `answered`. **Una cerrada no se reabre ni se toca**: si hace falta algo más, se crea otra. **Nunca se borra** (SEG-69: lo impone la base, no solo la API).
- Responder exige `answer_note` (en blanco, `422 required`); `answer_evidence_id` es una entrega de un control **del mismo servicio** (si no, `404`). Responde el `admin_empresa`, o el `funcional` si el control es suyo; las de un servicio completo las atiende solo el `admin_empresa`.
- **Devolver a `open` conserva la última respuesta** (`answer_note`, `answer_evidence_id`, `answered_by`, `answered_at`) hasta que la empresa dé otra. La respuesta anterior queda en el rastro de auditoría (`before_state` de `observation.answer`), que es lo único que la conserva.

**Quién la ve.** `admin_empresa` y `auditor`: todas. El `funcional`: las de los controles de los que es responsable, en cualquier dimensión (SEG-66); las de un servicio completo, no. La lista le llega filtrada (vacía si no tiene ningún control); el detalle de una ajena de su empresa es `403`, de otra empresa `404`. `admin_monkey`: `403`.

**Precedencia de errores de estado.** `OBSERVATION_CLOSED` manda sobre los demás: una cerrada no admite nada (editar, responder, cerrar o devolver). Después, `OBSERVATION_NOT_OPEN` al responder una ya respondida e `INVALID_TRANSITION` al cerrar o devolver una abierta. Dos peticiones a la vez sobre la misma observación se atienden una tras otra (la fila se bloquea): la segunda ve el estado ya cambiado y recibe el `409` que le toca.

**Las opciones** de `type` y `status` las sirve `GET /v1/catalogs/audit_observation_type` y `/audit_observation_status` (`enums.md`).

## Errores

Los errores comunes (`FORBIDDEN`, `NOT_FOUND`, `VALIDATION_FAILED`) están en [`README.md`](README.md#errores-comunes); aquí solo los propios.

| HTTP | `error.code` | Cuándo |
|---|---|---|
| 409 | `CONTROL_RETIRED` | Abrir una observación sobre un control dado de baja |
| 409 | `OBSERVATION_CLOSED` | Editar, responder, cerrar o devolver una observación cerrada (manda sobre los otros dos) |
| 409 | `OBSERVATION_NOT_OPEN` | Responder una que ya está `answered` |
| 409 | `INVALID_TRANSITION` | Cerrar una que no está `answered`, o devolver a `open` una que no lo está |

Claves i18n: `observation.*`.

## Ejemplos de error

Todos con el mismo sobre (`conventions.md`); `message` es la clave i18n del error.

**`409` — cerrar una observación que no está respondida**

```json
{
  "statusCode": 409,
  "message": "observation.invalid_transition",
  "data": null,
  "error": {
    "code": "INVALID_TRANSITION"
  }
}
```

**`403` — cerrar una observación que escribió otra persona**

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

| `action` | Cuándo | Quién |
|---|---|---|
| `observation.create` · `.update` · `.close` · `.return` | registrar, editar el texto, cerrar y devolver a `open` una observación | `auditor` (su autor) |
| `observation.answer` | la empresa responde | `admin_empresa` o `funcional` |

La auditoría de una observación lleva el texto (`body`, `answer_note`) antes y después: es lo que conserva una respuesta que el auditor devuelve y la empresa reemplaza. Nunca el contenido de una evidencia.

## Estado de implementación

**Construido (MD-154, 2026-10-29): las observaciones del auditor.** Tabla `tenant.audit_observations` (RLS por empresa, restricciones de coherencia y un trigger que impone en la base que nunca se borran y que una cerrada no se toca, SEG-69; solo desaparecen con la purga de una empresa archivada, D97). Cinco endpoints (arriba), permisos SEG-70, rastro en la misma transacción (`observation.*`). **No mueven el porcentaje**: no escriben evaluaciones ni eventos de cumplimiento (lo comprueba una prueba). Dos reglas que salían de otros documentos y quedan cerradas: el veredicto exige la razón cuando el control de origen tiene observaciones `open` (D85, antes la mitad de `DT-80`), y un servicio con observaciones no se borra (`SERVICE_HAS_EVALUATIONS`: son historia, igual que las evaluaciones). Los tipos y estados se sirven en `GET /v1/catalogs/{nombre}`. Pruebas: `test/cumplimiento/observaciones.e2e-spec.ts`, el bloque final de `veredictos.e2e-spec.ts` y `src/features/compliance/domain/observations/observation-lifecycle.spec.ts`. **Fuera de alcance, a propósito:** las pantallas (esperan los permisos por pantalla del comité, `P3`) y el aviso a la empresa de que tiene una observación nueva (el sistema de correos y notificaciones no existe todavía, `MD-69`; mientras tanto la empresa la ve al entrar al servicio).

## Preguntas abiertas

- **`P37`**: criterios de las observaciones que desarrollo fijó sin que el comité los pidiera (qué es «abierta» para el veredicto, controles dados de baja, la evidencia de una respuesta, conservar la última respuesta, aviso a la empresa).
- **Reportes en PDF y Excel** del auditor: el contenido está por definir, no tienen contrato todavía.
