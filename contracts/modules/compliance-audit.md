---
id: contracts-compliance-audit
name: Contrato — Cumplimiento, consultoría y auditoría
description: Los tests de un control, el veredicto del consultor, la validación de una evidencia, las observaciones del auditor y del consultor, y las exclusiones.
type: contract
---

# Cumplimiento — consultoría y auditoría

**Estado: ACORDADO (2026-10-17; D84 y D85), salvo lo que espera `P26`; construidas las exclusiones (MD-144).** Ver `conventions.md` (sección «Cumplimiento») y `enums.md`. Tickets: MD-144, MD-154, MD-155, MD-127.

**Qué es.** El **consultor prepara** a la empresa y el **auditor certifica** (D63, D64). Aquí viven lo que hacen: el consultor da el veredicto de los tests documentales y manuales y decide las exclusiones; el consultor y el
auditor escriben observaciones que la empresa debe atender. **Entidades:** `evaluations`, `evidence_submissions`, `evidence_reviews`, `audit_observations`, `exclusions` (`modelo-datos.md` §7.3 a §7.6). **App:** Monkey Platform.
Los cambios de controles que decide el consultor están en `compliance-controls.md`, y la evaluación general del servicio en `compliance-overview.md`.

## Quién puede qué

| Acción | `admin_empresa` | `funcional` | `consultor` | `auditor` |
|---|---|---|---|---|
| Ver los tests de un control (vista técnica, D81) | ✓ | `403` | ✓ | ✓ |
| Dar el veredicto de un test | `403` | `403` | ✓ | `403` |
| Revisar una evidencia (atributos y revisión) | `403` | `403` | ✓ **la suya** | ✓ **la suya** |
| Escribir, editar y cerrar una observación | `403` | `403` | ✓ las suyas | ✓ las suyas |
| Ver las observaciones | todas | **las de sus acciones asignadas** | todas | todas |
| Responder una observación | ✓ | ✓ solo de su acción | `403` | `403` |
| Proponer una exclusión | ✓ | `403` | `403` | `403` |
| Decidir una exclusión | `403` | `403` | ✓ | `403` |
| Ver las exclusiones | ✓ | `403` | ✓ | ✓ |

## Tests y veredictos

### `GET /v1/controls/{id}/tests`

La vista técnica de un control: los tests que lo verifican, **todos con su estado**, también los que aún no tienen activos conectados («Sin activos»). La piden `admin_empresa` (D81, mientras los permisos por pantalla sigan abiertos: `P3`), `consultor` y `auditor`; el `funcional`, `403`. Ver no es hacer: el veredicto sigue siendo del consultor. Paginada.

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

`state` es `test_state`. `shared_with` son los **otros** controles del servicio que llevan el test: su veredicto vale en todos (D85). `display_name` es el nombre neutro (D70); el texto del comité no sale. `ai_suggestion` es `null` o una sugerencia **marcada como de la IA**: nunca decide.

### `POST /v1/controls/{control_id}/tests/{test_id}/verdicts` — el veredicto

Solo `consultor`; cualquier otro rol, `403`. Aplica a tests **documentales y manuales**; uno automático lo resuelve la sonda (`409 TEST_NOT_MANUAL`).
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

Un test sin veredicto está `pending` y **no cuenta como cumplido**. `GET /v1/controls/{control_id}/tests/{test_id}/verdicts` lista el historial (paginado; `consultor` y `auditor`).

### `PUT /v1/evidence-submissions/{id}/review` — revisar una evidencia (D84)

Los seis atributos de una evidencia y la validación por una persona (RN-01 a RN-03). La hacen el **`consultor` y el `auditor`, cada uno la suya**: son dos momentos distintos (consultoría prepara, auditoría certifica) y ninguna depende de la otra;
una evidencia no necesita las dos para cumplir. El rol lo pone el servidor desde la base (`reviewer_role`); el cuerpo no lo lleva. Cada entrega tiene a lo sumo una revisión por rol y `PUT` la crea o la reemplaza (queda en el rastro). `admin_empresa` y `funcional`, `403`.

```json
{ "type_ok": true, "period_ok": true, "valid_ok": true, "approved_ok": true, "signed_ok": true, "content_ok": true, "review": "human_validated", "note": "El acta está firmada por la dirección." }
```

Cada atributo es `true`, `false` o `null` (sin valorar); `note` es opcional. `review` solo acepta `human_validated` o `pending_review`: **`ai_prevalidated` lo deriva el sistema, nunca una persona** (`422 enum.invalid`).
Responde `200` con **solo la revisión de quien la hizo** y el `evidence_state` calculado a partir de ella.

- **El auditor nunca recibe la revisión del consultor ni rastro de que existe, y el consultor no recibe la del auditor** (SEG-61). Ninguna respuesta de este contrato ni de `compliance-evidence.md` mezcla las dos.
- El estado que consume el motor sale de la revisión del consultor; la del auditor no lo mueve (D77, D84).
- Qué ve la empresa: en la vista técnica (D81), la del consultor; la del auditor no, hasta `P3`.

## Observaciones

Una observación **no es un hallazgo**: el hallazgo lo detecta el sistema y la observación la redacta una persona. **No mueve el porcentaje**: el cumplimiento solo cambia por el camino normal (la respuesta entra como evidencia, se aprueba y el consultor da el veredicto).

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
  "created_by": { "id": "d5e6…", "name": "Camilo", "last_name": "Ortiz", "role": "consultor" },
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
| `POST /v1/services/{service_id}/observations` | `consultor`, `auditor` | `{ "type", "body", "client_control_id"?, "evidence_submission_id"? }` | `201` la observación, `open` |
| `GET /v1/services/{service_id}/observations` | ver tabla | filtros `status`, `type`, `client_control_id` | `200` paginada |
| `GET /v1/observations/{id}` | ver tabla | — | `200` |
| `PATCH /v1/observations/{id}` | **solo su autor** | `{ "body": "…" }` mientras no esté cerrada | `200` |
| `POST /v1/observations/{id}/answer` | `admin_empresa`; `funcional` dueño de la acción | `{ "answer_note": "…", "answer_evidence_id"?: "…" }` | `200`, pasa a `answered` |
| `PATCH /v1/observations/{id}` | **solo su autor** | `{ "status": "closed" }` o `{ "status": "open" }` | `200` |

- Una observación puede referirse a un servicio completo (sin `client_control_id`), a una acción o a una evidencia; si trae ambos, la evidencia debe ser de esa acción.
- **Solo quien la escribió la cierra** o la devuelve a `open` (no queda conforme). Solo se cierra una `answered`. **Una cerrada no se reabre**: si hace falta algo más, se crea otra. Nunca se borra.
- Responder exige `answer_note`; `answer_evidence_id` es una entrega de evidencia de la misma empresa.
- Un `funcional` ve las observaciones de sus acciones asignadas; las de un servicio completo, no.

## Exclusiones

Excluir un **activo de un test** cambia lo que se mide (D74, D78). **La propone la empresa, que conoce su infraestructura, y la aprueba el consultor** como control independiente. Vence al final del período de evaluación; al renovar se revalida.
**Una exclusión que no está aprobada no cambia nada**: el activo sigue contando hasta que el consultor la apruebe. El veredicto de la sonda nunca se sobrescribe.

```json
{
  "id": "93d7…",
  "service_id": "55aa…",
  "test": { "id": "21ab…", "display_name": "Cuentas privilegiadas con doble factor" },
  "asset": { "id": "8f10…", "name": "servidor-contabilidad-legado" },
  "justification": "El servidor se apagará en noviembre y no almacena datos de clientes.",
  "technical_justification": "Aislado de la red de producción desde el 2026-09-01.",
  "status": "pending",
  "is_expired": false,
  "awaiting_consultant": false,
  "valid_from": "2026-10-14",
  "valid_until": "2026-12-31",
  "proposed_by": { "id": "a1b2…", "name": "Laura", "last_name": "Gómez" },
  "requested_at": "2026-10-14T19:00:00Z",
  "decided_by": null,
  "decision_note": null,
  "decided_at": null
}
```

### `POST /v1/services/{service_id}/exclusions`

```json
{
  "test_id": "21ab…",
  "asset_id": "8f10…",
  "justification": "El servidor se apagará en noviembre y no almacena datos de clientes.",
  "technical_justification": "Aislado de la red de producción desde el 2026-09-01."
}
```

- `justification` es obligatoria. `technical_justification` es **obligatoria si el test es automático**: la sonda no se sobrescribe sin sustento técnico.
- La vigencia **no la manda el cliente**: empieza hoy y termina en el `period_end` de la evaluación del servicio. Si esa evaluación no tiene período, `409 EVALUATION_NOT_DEFINED` (`P26`).
- El activo debe pertenecer al servicio y el test aplicarle; si no, `404`. Repetir una exclusión pendiente o aprobada de lo mismo es `409 EXCLUSION_ALREADY_EXISTS`.
- Responde `201`, `status: "pending"`: **el activo se sigue midiendo**.
- **Sin consultor, la exclusión espera (P24, D83).** `awaiting_consultant` es `true` en una exclusión `pending` mientras la empresa no tenga ningún consultor **activo** (sin asignar, suspendido o retirado); en las ya decididas siempre es `false`. La pantalla lo usa para avisar que hace falta asignar un consultor que la apruebe y ofrecer contactar al equipo que gestiona ese trámite; la API no decide nada por su cuenta y el activo sigue contando.

### `GET /v1/services/{service_id}/exclusions`

Paginada, de la más reciente a la más antigua. Filtros `status` (`pending` · `approved` · `rejected`), `test_id`, `asset_id`, `expired` (`true`/`false`). Una aprobada cuya `valid_until` ya pasó trae `is_expired: true` y **el activo vuelve a contar**; para renovarla se propone una nueva (se revalida, no se hereda). La leen `admin_empresa`, `consultor` y `auditor`.

### `PATCH /v1/exclusions/{id}`

Solo `consultor`. Patrón de decisiones de `conventions.md`: `{ "status": "approved" }` o `{ "status": "rejected", "decision_note": "…" }`. Aprobar hace que el activo salga del universo aplicable del test
(su resultado pasa a `excluded`); rechazar lo deja midiéndose y conserva el motivo. `admin_empresa` y `auditor` reciben `403`. Rechazar sin `decision_note` es `422` (`note.required`).

## Errores

| HTTP | `error.code` | Cuándo |
|---|---|---|
| 403 | `FORBIDDEN` | El rol no puede; cerrar una observación que no escribió; el `funcional` no tiene asignada la acción |
| 404 | `NOT_FOUND` | El control, el test, el activo, la observación o la exclusión no existen para esta empresa |
| 409 | `TEST_NOT_MANUAL` | Dar un veredicto sobre un test automático |
| 409 | `ALREADY_DECIDED` | La exclusión ya fue aprobada o rechazada |
| 409 | `EXCLUSION_ALREADY_EXISTS` | Ya hay una pendiente o aprobada del mismo activo en el mismo test |
| 409 | `EVALUATION_NOT_DEFINED` | La evaluación del servicio no tiene período o fecha de corte |
| 409 | `OBSERVATION_CLOSED` | Editar, responder o cambiar una observación cerrada |
| 409 | `OBSERVATION_NOT_OPEN` | Responder una que no está `open` |
| 409 | `INVALID_TRANSITION` | Cerrar una que no está `answered`, o devolver a `open` una que no lo está |
| 422 | `VALIDATION_FAILED` | Campos: `required`, `enum.invalid`, `closure_reason.required` (veredicto con observaciones abiertas), `note.required` (`decision_note` al rechazar) |

Claves i18n: `control_test.list`, `verdict.issued`, `observation.*`, `exclusion.list`, `exclusion.requested`, `exclusion.decided`.

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
| `test_verdict.issue` | veredicto de un test (también deja `compliance_events`) | `consultor` |
| `evidence_review.update` | se revisa una evidencia (crear o reemplazar la propia; sin los atributos en el detalle) | `consultor` · `auditor` |
| `observation.create` · `.update` · `.answer` · `.close` · `.return` | ciclo de una observación | autor o empresa |
| `exclusion.request` · `exclusion.decide` | propuesta y decisión (con `compliance_events` al aprobar o vencer) | `admin_empresa` · `consultor` |

## Estado de implementación

**Construido: MD-144** (exclusiones; 2026-10-16). Lo de abajo es lo que el contrato no dice y el código hace:

- **Solo el activo de un test.** El contrato expone la exclusión de un activo; la de un check (`excluded_check_id`) existe en la tabla pero no tiene endpoint (**MD-170**, `DT-74`), y excluir un test completo se hace desactivándolo, no con una exclusión (D68).
- **Cómo cambia lo que se mide.** Una exclusión `approved` y vigente (`valid_from` ≤ hoy ≤ `valid_until`) hace que el resultado del activo en ese test sea `excluded` **al leer**: se superpone al último resultado sin tocar el veredicto de la sonda, en todas las acciones del servicio que llevan ese test. La pendiente, la rechazada y la vencida no cambian nada. Aprobar deja un evento de cumplimiento (`exclusion.approve`).
- **Vigencia.** Hoy hasta el `period_end` del servicio (el mayor de sus marcos activos). El período lo declara `admin_empresa` con `PUT /v1/services/{id}/frameworks/{code}/evaluation-period` (D87, MD-168, `compliance-overview.md`): mientras no haya período, o ya haya terminado, proponer responde `409 EVALUATION_NOT_DEFINED`. Las pruebas de exclusiones aún lo fijan por SQL.
- **Un vencimiento no deja evento.** «Vencida» se deriva al leer (`is_expired`); no hay un proceso que escriba el `compliance_events` de un vencimiento (`DT-72`, **MD-171**).
- **Una pendiente por activo y test**, impuesto por un índice único parcial; la base también impone la forma de la decisión (quién y cuándo; el rechazo, con motivo) y la vigencia ordenada.
- **El consultor todavía no puede decidir en la empresa de un cliente.** Su cuenta vive en la empresa interna de Monkey y elegir la empresa de trabajo es `MD-160` (SEG-55), sin asignar: hasta entonces `PATCH /v1/exclusions/{id}` solo se puede ejercer con una cuenta de consultor ubicada en la empresa, que es como lo prueban las e2e. Es el mismo límite de cualquier otro endpoint del consultor.
- **No hay pantalla.** Falta la de proponer y ver exclusiones, con el aviso de que falta un consultor y la casilla para contactar a quien lleva el trámite (**MD-169**; a quién se contacta es `P28`).

## Preguntas abiertas

- **`P25`** (solo su segunda pregunta): si validar las evidencias de un test documental es lo mismo que dar su veredicto. Quién revisa la evidencia ya está decidido (D84).
- **`P26`**: período y fecha de corte de la evaluación del servicio. Mientras no se definan, proponer una exclusión responde `409 EVALUATION_NOT_DEFINED`.
- **`P3`**: el detalle por pantalla puede ajustar la tabla de «Quién puede qué».
- **Reportes en PDF y Excel** del auditor y del consultor: el contenido está por definir, no tienen contrato todavía.
