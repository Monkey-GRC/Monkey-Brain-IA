---
id: contracts-compliance-audit
name: Contrato — Cumplimiento, validación y auditoría
description: Los tests de un control, el veredicto del administrador, la validación de una evidencia, las observaciones del auditor y las exclusiones.
type: contract
---

# Cumplimiento — validación y auditoría

**Estado: ACORDADO, reescrito por D96 (2026-10-27): no hay consultor.** Construido con el modelo anterior (exclusiones MD-144, revisión de la evidencia MD-127, veredicto MD-155); el Backend ya quedó ajustado a este texto salvo lo que lista «Estado de implementación». Ver `conventions.md` (sección «Cumplimiento») y `enums.md`. Tickets: MD-144, MD-154, MD-155, MD-127.

**Qué es.** El **`admin_empresa` es el experto en compliance** (D96): valida la evidencia, da el veredicto de las pruebas manuales y decide las exclusiones. El **`funcional`** sube la evidencia y repara lo suyo, y el **`auditor`** revisa y escribe observaciones que la empresa debe atender; no califica por ahora. **Entidades:** `evaluations`, `evidence_submissions`, `evidence_reviews`, `audit_observations`, `exclusions` (`modelo-datos.md` §7.3 a §7.6). **App:** Monkey Platform.
Los cambios de controles, riesgos y causas están en `compliance-controls.md` y `compliance-risks.md`; el resumen del servicio, en `compliance-overview.md`; y quién es responsable de qué, en `users-team.md`.

## Quién puede qué

| Acción | `admin_empresa` | `funcional` | `auditor` |
|---|---|---|---|
| Ver los tests de un control (vista técnica, D81) | ✓ | `403` | ✓ |
| Ver qué falló y cómo corregirlo en una prueba de nube (hallazgos) | ✓ | ✓ solo la suya | ✓ |
| Dar el veredicto de un test manual | ✓ | `403` | `403` |
| Validar o rechazar una evidencia (atributos y revisión) | ✓ | `403` | `403` |
| Escribir, editar y cerrar una observación | `403` | `403` | ✓ las suyas |
| Ver las observaciones | todas | **las de los controles de los que es responsable** | todas |
| Responder una observación | ✓ | ✓ solo de un control suyo | `403` |
| Decidir una exclusión (la propone y la aprueba en un acto) | ✓ | `403` | `403` |
| Ver las exclusiones | ✓ | `403` | ✓ |
## Tests y veredictos

### `GET /v1/controls/{id}/tests`

La vista técnica de un control: los tests que lo verifican, **todos con su estado**, también los que aún no tienen activos conectados («Sin activos»). La piden `admin_empresa` (D81, mientras los permisos por pantalla sigan abiertos: `P3`) y `auditor`; el `funcional`, `403`. Ver no es hacer: el veredicto es del `admin_empresa`. Paginada.

```json
{
  "statusCode": 200,
  "message": "control_test.list",
  "data": {
    "items": [
      {
        "test_id": "21ab…",
        "test_code": "T-DOC-001",
        "display_name": "Revisión periódica de accesos",
        "dimension": "policy",
        "type": "manual",
        "is_mandatory": true,
        "is_active": true,
        "shared_with": [ { "id": "77a2…", "code": "IAC-4" } ],
        "state": "in_review",
        "last_verdict": null,
        "ai_suggestion": { "is_ai_generated": true, "ai_confidence": 0.74, "verdict": "compliant", "rationale": "Las tres revisiones del período están firmadas." }
      }
    ],
    "page": 1, "page_size": 25, "total": 1, "total_pages": 1
  }
}
```

`state` es `test_state`. `shared_with` son los **otros** controles del servicio que llevan el test: su veredicto vale en todos (D85). **En un test documental (`dimension: "policy"`) va siempre vacío:** su estado es de este control y sale de las
evidencias de este control que le aplican (D88); `state` ya no es fijo `pending`. `display_name` es el nombre neutro (D70); el texto del comité no sale. `ai_suggestion` es `null` o una sugerencia **marcada como de la IA**: nunca decide.

### `GET /v1/controls/{control_id}/tests/{test_id}/findings` — qué falló y cómo corregirlo (D90)

De una **prueba automática de nube** de un control: las comprobaciones que fallaron, en qué recursos y cómo corregirlas. La leen `admin_empresa`, `auditor` y **el `funcional` responsable de esa prueba** (D96: es quien la repara; ve qué falló y cómo corregirlo, no la vista técnica completa); otro `funcional` y `admin_monkey`, `403`. Paginada (`page`, `page_size`), de la más grave a la menos.
Lo que lee: la **última corrida completada** de cada conexión de nube del servicio, solo los resultados `failed`, de los checks que alimentan esa prueba **con la misma regla que las evaluaciones** (los ratificados por el comité; con `READINESS_INCLUDE_PROPOSED=true`, también los propuestos). Un recurso descubierto que no es del servicio no se cuenta.

```json
{
  "statusCode": 200,
  "message": "finding.list",
  "data": {
    "test_id": "21ab…",
    "measured_at": "2026-10-22T23:40:00Z",
    "items": [
      {
        "id": "5c1e…",
        "title": "IAM Access Analyzer está habilitado",
        "severity": "high",
        "resources": [ { "name": "analizador-principal", "uid": "arn:aws:accessanalyzer:us-east-1:123456789012:analyzer/…", "region": "us-east-1" } ],
        "resources_total": 1,
        "remediation": { "text": "Habilita IAM Access Analyzer en todas las cuentas y regiones activas…", "language": "es", "is_ai_generated": true }
      }
    ],
    "page": 1, "page_size": 25, "total": 1, "total_pages": 1
  }
}
```

- `title` es la comprobación en positivo («lo que debería cumplirse»). `remediation` es **la guía de corrección** de esa comprobación, igual para todos los recursos; `null` si no hay una que se pueda mostrar.
- **Idioma y procedencia.** Sale en el idioma de la sesión. El catálogo trae el texto original en inglés; Monkey lo **traduce con IA** (`is_ai_generated: true`, la pantalla lo etiqueta como traducción automática hasta que alguien la revise). Si un check aún no tiene traducción, sale el original con `language: "en"`.
- **Nada nombra al motor (D70).** Ningún identificador del motor sale (ni el código del check ni el tipo de recurso del motor). Un título o una guía que nombre al proveedor se omite (`null`, y el título cae a un texto neutro): es una red de seguridad, no una revisión. El mensaje por recurso que escribe el motor (`status_detail`) **no sale**: es texto crudo y en inglés (ver «Estado de implementación»).
- `resources` trae hasta 50 recursos por comprobación; `resources_total` dice cuántos son. `404` si el control no lleva la prueba o si la prueba no es de nube; sin corrida, `items: []` y `measured_at: null`.

### `POST /v1/controls/{control_id}/tests/{test_id}/verdicts` — el veredicto

Solo `admin_empresa`; cualquier otro rol, `403`. Aplica a las pruebas **manuales que no son documentales** (p. ej. la validación manual complementaria de una prueba técnica); una automática la resuelve la sonda (`409 TEST_NOT_MANUAL`) y una **documental se resuelve revisando
su evidencia** (`PUT /v1/evidence-submissions/{id}/review`): sobre ella responde `409 TEST_DECIDED_BY_EVIDENCE` (D88).
**El veredicto es del test en el servicio, no del control** (D85, RN-13): `control_id` es el control desde el que se da (el de origen) y el veredicto cuenta en **todos los controles del servicio que llevan ese test**. La evidencia que lo sustenta es la de `GET /v1/controls/{control_id}/tests/{test_id}/evidence` (`compliance-evidence.md`).

```json
{ "result": "compliant", "note": "Las tres revisiones del período están firmadas por la dirección." }
```

Si el **control de origen** tiene **observaciones abiertas** (criterio provisional, D85), el veredicto exige además la razón por la que se da igual:

```json
{ "result": "compliant", "closure_observation_reason": "La observación abierta es de forma y no afecta al control.", "note": "…" }
```

`result`: `compliant` · `non_compliant`. Responde `201`: queda **una evaluación nueva e inmutable** (la anterior se conserva) con quién la confirmó.

```json
{
  "statusCode": 201,
  "message": "verdict.issued",
  "data": {
    "id": "f2c8…",
    "control_id": "3f1c…",
    "test_id": "21ab…",
    "dimension": "policy",
    "origin": "manual",
    "result": "compliant",
    "note": "Las tres revisiones del período están firmadas por la dirección.",
    "closure_observation_reason": null,
    "confirmed_by": { "id": "d5e6…", "name": "Camilo", "last_name": "Ortiz" },
    "evaluated_at": "2026-10-14T18:30:00Z",
    "test_state": "compliant",
    "applies_to_controls": [ { "id": "3f1c…", "code": "IAC-12" }, { "id": "77a2…", "code": "IAC-4" } ]
  }
}
```

Un test sin veredicto está `pending` y **no cuenta como cumplido**. `GET /v1/controls/{control_id}/tests/{test_id}/verdicts` lista el historial (paginado; `admin_empresa` y `auditor`).

### `PUT /v1/evidence-submissions/{id}/review` — validar o rechazar una evidencia (D96)

Los seis atributos de una evidencia y la validación por una persona (RN-01 a RN-03). **La hace solo el `admin_empresa`, en una sola revisión.** El `funcional` sube la evidencia y la ve «en revisión»; el `auditor` la lee, pero no la revisa. **De esta revisión sale el estado de las pruebas documentales a las que sirve la evidencia, en su control (D88): no hay un segundo paso de veredicto.** El rol lo pone el servidor desde la base (`reviewer_role = admin_empresa`); el cuerpo no lo lleva. Cada entrega tiene a lo sumo una revisión y `PUT` la crea o la reemplaza (queda en el rastro). `funcional`, `auditor` y `admin_monkey`, `403`.

```json
{ "type_ok": true, "period_ok": true, "valid_ok": true, "approved_ok": true, "signed_ok": true, "content_ok": true, "review": "human_validated", "note": "El acta está firmada por la dirección." }
```

Cada atributo es `true`, `false` o `null` (sin valorar). `review` solo acepta `human_validated` o `pending_review`: **`ai_prevalidated` lo deriva el sistema, nunca una persona** (`422 enum.invalid`).

- **Validar** es `human_validated` con los atributos en `true`: la prueba cumple.
- **Rechazar** es dejar algún atributo en `false`: la prueba no cumple y el `funcional` rehace con una versión nueva. **`note` es obligatoria al rechazar** (`422 note.required`) y opcional al validar; es lo que el `funcional` lee para saber qué corregir.
- Responde `200` con la revisión y el `evidence_state` calculado a partir de ella.
- Quien subió y quien validó quedan en el rastro, con su nombre (`P34`).
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
| `POST /v1/services/{service_id}/observations` | `auditor` | `{ "type", "body", "client_control_id"?, "evidence_submission_id"? }` | `201` la observación, `open` |
| `GET /v1/services/{service_id}/observations` | ver tabla | filtros `status`, `type`, `client_control_id` | `200` paginada |
| `GET /v1/observations/{id}` | ver tabla | — | `200` |
| `PATCH /v1/observations/{id}` | **solo su autor** | `{ "body": "…" }` mientras no esté cerrada | `200` |
| `POST /v1/observations/{id}/answer` | `admin_empresa`; `funcional` responsable del control | `{ "answer_note": "…", "answer_evidence_id"?: "…" }` | `200`, pasa a `answered` |
| `PATCH /v1/observations/{id}` | **solo su autor** | `{ "status": "closed" }` o `{ "status": "open" }` | `200` |

- Una observación puede referirse a un servicio completo (sin `client_control_id`), a un control o a una evidencia; si trae ambos, la evidencia debe ser de ese control.
- **Solo quien la escribió la cierra** o la devuelve a `open` (no queda conforme). Solo se cierra una `answered`. **Una cerrada no se reabre**: si hace falta algo más, se crea otra. Nunca se borra.
- Responder exige `answer_note`; `answer_evidence_id` es una entrega de evidencia de la misma empresa.
- Un `funcional` ve las observaciones de los controles de los que es responsable (en cualquier dimensión); las de un servicio completo, no.

## Exclusiones

Excluir un **activo de un test** cambia lo que se mide (D74). **El `admin_empresa` la propone y la decide en un solo acto** (D96): la exclusión nace **aprobada**, con su justificación, su vigencia y quién la aprobó (REQ-008 del Excel). Vence al final del período de evaluación; al renovar se revalida. El veredicto de la sonda nunca se sobrescribe. Los estados `pending` y `rejected` quedan sin uso.

```json
{
  "id": "93d7…",
  "service_id": "55aa…",
  "test": { "id": "21ab…", "display_name": "Cuentas privilegiadas con doble factor" },
  "asset": { "id": "8f10…", "name": "servidor-contabilidad-legado" },
  "justification": "El servidor se apagará en noviembre y no almacena datos de clientes.",
  "technical_justification": "Aislado de la red de producción desde el 2026-09-01.",
  "status": "approved",
  "is_expired": false,
  "valid_from": "2026-10-14",
  "valid_until": "2026-12-31",
  "proposed_by": { "id": "a1b2…", "name": "Laura", "last_name": "Gómez" },
  "requested_at": "2026-10-14T19:00:00Z",
  "decided_by": { "id": "a1b2…", "name": "Laura", "last_name": "Gómez" },
  "decision_note": null,
  "decided_at": "2026-10-14T19:00:00Z"
}
```

`proposed_by` y `decided_by` son la misma persona, y `requested_at` y `decided_at` el mismo instante: se conservan para no cambiar la tabla.

### `POST /v1/services/{service_id}/exclusions`

```json
{
  "test_id": "21ab…",
  "asset_id": "8f10…",
  "justification": "El servidor se apagará en noviembre y no almacena datos de clientes.",
  "technical_justification": "Aislado de la red de producción desde el 2026-09-01."
}
```

- Solo `admin_empresa`. `justification` es obligatoria. `technical_justification` es **obligatoria si el test es automático**: la sonda no se sobrescribe sin sustento técnico.
- La vigencia **no la manda el cliente**: empieza hoy y termina en el `period_end` de la evaluación del servicio. Si esa evaluación no tiene período, `409 EVALUATION_NOT_DEFINED` (`P26`).
- El activo debe pertenecer al servicio y el test aplicarle; si no, `404`. Repetir una exclusión aprobada y vigente de lo mismo es `409 EXCLUSION_ALREADY_EXISTS`.
- Responde `201`, `status: "approved"`: **el activo sale del universo aplicable del test** (su resultado pasa a `excluded`) y queda el evento `exclusion.approve`.

### `GET /v1/services/{service_id}/exclusions`

Paginada, de la más reciente a la más antigua. Filtros `test_id`, `asset_id`, `expired` (`true`/`false`). Una cuya `valid_until` ya pasó trae `is_expired: true` y **el activo vuelve a contar**; para renovarla se crea una nueva (se revalida, no se hereda). La leen `admin_empresa` y `auditor`.

**No hay `PATCH`:** ya nadie decide sobre lo propuesto por otro (`conventions.md`). Dejar sin efecto una exclusión vigente antes de que venza es `LATER`.
## Errores

| HTTP | `error.code` | Cuándo |
|---|---|---|
| 403 | `FORBIDDEN` | El rol no puede; cerrar una observación que no escribió; el `funcional` no es responsable de ese control |
| 404 | `NOT_FOUND` | El control, el test, el activo, la observación o la exclusión no existen para esta empresa |
| 409 | `TEST_NOT_MANUAL` | Dar un veredicto sobre un test automático |
| 409 | `TEST_DECIDED_BY_EVIDENCE` | Dar un veredicto sobre un test documental: se resuelve revisando su evidencia (D88) |
| 409 | `TEST_HAS_NO_ASSETS` | El servicio no tiene activos de la dimensión del test: no hay sobre qué dar el veredicto |
| 409 | `EXCLUSION_ALREADY_EXISTS` | Ya hay una aprobada y vigente del mismo activo en el mismo test |
| 409 | `EVALUATION_NOT_DEFINED` | La evaluación del servicio no tiene período o fecha de corte |
| 409 | `OBSERVATION_CLOSED` | Editar, responder o cambiar una observación cerrada |
| 409 | `OBSERVATION_NOT_OPEN` | Responder una que no está `open` |
| 409 | `INVALID_TRANSITION` | Cerrar una que no está `answered`, o devolver a `open` una que no lo está |
| 422 | `VALIDATION_FAILED` | Campos: `required`, `enum.invalid`, `closure_reason.required` (veredicto con observaciones abiertas), `note.required` (rechazar una evidencia sin `note`) |

Claves i18n: `control_test.list`, `verdict.issued`, `verdict.list`, `observation.*`, `exclusion.list`, `exclusion.created`.

## Ejemplos de error

Todos con el mismo sobre (`conventions.md`); `message` es la clave i18n del error.

**`409` — veredicto sobre un test automático**

```json
{
  "statusCode": 409,
  "message": "verdict.test_not_manual",
  "data": null,
  "error": {
    "code": "TEST_NOT_MANUAL"
  }
}
```

**`422` — veredicto con observaciones abiertas y sin razón**

```json
{
  "statusCode": 422,
  "message": "validation.failed",
  "data": null,
  "error": {
    "code": "VALIDATION_FAILED",
    "fields": [
      {
        "field": "closure_observation_reason",
        "code": "closure_reason.required",
        "message": "Hay observaciones abiertas: indica por qué das el veredicto igual."
      }
    ]
  }
}
```

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
| `test_verdict.issue` | veredicto de un test (también deja el evento `control.state` de cada control que cambie de estado, D91) | `admin_empresa` |
| `evidence_review.update` | se valida o se rechaza una evidencia (crear o reemplazar la propia; sin los atributos en el detalle) | `admin_empresa` |
| `observation.create` · `.update` · `.answer` · `.close` · `.return` | ciclo de una observación | autor (`auditor`) o empresa |
| `exclusion.create` | se decide una exclusión (con `compliance_events` al aprobar o vencer) | `admin_empresa` |

## Estado de implementación

**Construido (2026-10-28, B66): el paso de lo que hacía el consultor al `admin_empresa`.** El Backend ya hace lo que dice este contrato en:

- **Revisión de la evidencia.** Solo `admin_empresa` (`PUT /v1/evidence-submissions/{id}/review`); `evidence_reviews.reviewer_role` tiene el valor `admin_empresa` (migración `20261028202705_evidence_reviewer_admin_empresa`; `consultor` y `auditor` quedan en el enum sin uso); una sola revisión por entrega; rechazar sin `note` es `422 note.required`. Todos los roles ven la misma revisión (SEG-61 retirado); el `funcional` recibe `review_note` en cada entrega.
- **Veredicto.** `POST` solo `admin_empresa`, `GET` del historial `admin_empresa` y `auditor`.
- **Pruebas documentales por control (D88).** El estado sale de la revisión del `admin_empresa`.
- **Exclusiones.** `POST` solo `admin_empresa`: nace `approved` con `decided_by`/`decided_at`, deja el evento `exclusion.approve` y, si mueve un control, su evento de estado (`cause: exclusion_approved`). Auditoría `exclusion.create`. Se retiró el `PATCH /v1/exclusions/{id}`, el campo `awaiting_consultant` y `ALREADY_DECIDED`. Dos creaciones a la vez de lo mismo se serializan (candado de la transacción) y la segunda es `409 EXCLUSION_ALREADY_EXISTS`; el índice único parcial «una pendiente» queda como red de seguridad de datos viejos. `pending` y `rejected` quedan en el enum sin uso.
- **Pruebas:** `revision-evidencia`, `veredictos`, `eventos-estado`, `exclusiones` y `evidencias` en `Backend/test/cumplimiento/`.

Falta por construir: **el `funcional` ve solo lo suyo** (`users-team.md`, B67: las listas de pruebas y de evidencia se filtran por el responsable efectivo de cada dimensión; hoy se filtra por las asignaciones por control) y las **observaciones (MD-154)**, que solo escribe el `auditor`.

Lo que no cambia y el código ya hace: la vigencia llega al `period_end` del servicio (D87); «vencida» se deriva al leer (`is_expired`, `DT-72`, `MD-171`); solo se excluye el activo de un test (la de un check, `excluded_check_id`, es `MD-170`, `DT-74`); y `ai_suggestion` no se guarda ni se devuelve: la IA no escribe aquí.

**No hay pantalla de exclusiones con el aviso del consultor ni la casilla de contacto** (MD-169, `P28`): se retiran. La pantalla de exclusiones solo crea y lista: la decisión es el mismo acto.

## Preguntas abiertas

- **`P26`**: período y fecha de corte de la evaluación del servicio. Mientras no se definan, crear una exclusión responde `409 EVALUATION_NOT_DEFINED`.
- **`P3`**: el detalle por pantalla puede ajustar la tabla de «Quién puede qué».
- **`P34`**: quien sube la evidencia y quien la valida son la misma persona.
- **Reportes en PDF y Excel** del auditor: el contenido está por definir, no tienen contrato todavía.