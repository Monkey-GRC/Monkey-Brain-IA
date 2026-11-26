---
id: contracts-compliance-approval
name: Gestión y aprobación del control
description: Estado de gestión del control, aprobación del responsable y final del admin_empresa, devolución con motivo y resultado de una prueba manual (D132, D140).
type: contract
---

# Gestión y aprobación del control

| | |
|---|---|
| **Estado** | **ACORDADO** (MD-504, 2026-11-25). Lo dejado fuera (R5, plan de remediación por excepción, declaración trimestral, «No aplica» aprobado) es de MD-529 |
| **App** | Monkey Platform |
| **Decisiones** | D132 (estados y doble aprobación), D140 puntos 1 y 2 (resultado manual), D130 puntos 4 y 5 (solo `approved` cuenta como cumplido) |
| **Entidades** | `control_approvals`, `manual_test_results` (`modelo-datos.md` §7) |
| **Tickets** | MD-504 · pantallas: MD-505 |

## El estado de gestión (`management_state`)

Enum `control_management_state` ([`enums/cumplimiento.md`](../enums/cumplimiento.md#control_management_state)). Lo calcula
el servidor al leer, con el nivel del motor v2 y los actos de las personas; el cliente no lo escribe.

| Estado | Cuándo |
|---|---|
| `non_compliant` | El motor no da el 100 % de los requisitos y en la ventana vigente no hay evidencia, resultado ni devolución. Es el estado inicial, y también el de una ventana vencida o un check automático Directo en FAIL |
| `in_progress` | El motor no da el 100 % y en la ventana vigente ya hay evidencia o un resultado manual registrado |
| `returned` | La última decisión de la ventana vigente es una devolución y desde entonces no se cargó evidencia ni resultado nuevo. Con una carga nueva pasa a `in_progress`, o a `pending_approval` si el motor ya da el 100 % |
| `pending_approval` | El motor da el 100 % y no hay una aprobación vigente |
| `owner_approved` | El motor da el 100 % y el responsable aprobó; falta la aprobación final |
| `approved` | **Cumplimiento aprobado**: el motor da el 100 % y el `admin_empresa` dio la aprobación final. Es el único estado que cuenta como cumplido en la categoría y el marco |

**Una aprobación deja de valer** si el control deja de cumplir, por un FAIL, una evidencia vencida o devuelta, o un
cambio de parámetro, o si empieza una ventana nueva del control. Así lo decidió Rod el 2026-11-25. Si el control
vuelve a cumplir, hay que aprobar de nuevo. Una evidencia nueva que no cambia el resultado no la quita.

**Quién aprueba (G-05):**
- El responsable del control da la primera aprobación.
- El `admin_empresa` da la final, solo sobre un control `owner_approved`.
- Si el `admin_empresa` es el responsable del control, o el control no tiene responsable, su aprobación es la única y
  deja el control `approved`.

Aparece en `GET /v1/services/{id}/controls` y en `GET /v1/controls/{id}` (`controles.md`) como `management_state`, junto a
`management`:

| Campo | Tipo | Qué es |
|---|---|---|
| `management_state` | enum `control_management_state` | El estado de gestión |
| `management.owner_approved_by` | `{ id, name, last_name }` \| null | Quién dio la primera aprobación vigente |
| `management.owner_approved_at` | datetime \| null | |
| `management.approved_by` | `{ id, name, last_name }` \| null | Quién dio la aprobación final vigente |
| `management.approved_at` | datetime \| null | |
| `management.returned_reason` | string \| null | El motivo de la última devolución, si el estado es `returned` |
| `management.returned_by`, `management.returned_at` | | |

No reemplaza a `approval` (`control_approval`), que es la aprobación del alta de un control propio y sigue igual.

## POST /v1/controls/{control_id}/approval — Aprobar o devolver

| | |
|---|---|
| **Quién** | La primera aprobación es del responsable (`controls.approve_first`, celda S, que exige ser el dueño). La final es del `admin_empresa` (`controls.approve_final`). El delegado, el auditor, el colaborador y `admin_monkey` reciben `403` |
| **Éxito** | `200` con el control (`GET /v1/controls/{id}`) |
| **Errores** | `403` · `404` · `409 CONTROL_NOT_COMPLIANT` · `409 OWNER_APPROVAL_REQUIRED` · `409 ALREADY_APPROVED` · `409 NOTHING_TO_RETURN` · `422 reason.required` |

El servidor decide el paso según quién llama:
- El responsable aprueba sobre `pending_approval` y el control queda `owner_approved`.
- El `admin_empresa` aprueba sobre `owner_approved` y el control queda `approved`. Si es el responsable o el control no
  tiene responsable, aprueba directamente sobre `pending_approval`.
- Si el `admin_empresa` intenta aprobar sobre `pending_approval` un control que sí tiene otro responsable, recibe
  `409 OWNER_APPROVAL_REQUIRED`.

**Aprobar** exige que el motor dé el 100 % (`409 CONTROL_NOT_COMPLIANT`). Una segunda aprobación del mismo paso responde
`409 ALREADY_APPROVED`.

**Devolver** se puede desde `pending_approval` u `owner_approved`. Siempre lleva un motivo (`422 reason.required`).
- El control pasa a `returned` y pierde las aprobaciones vigentes.
- Las entregas de evidencia que indique `returned_submission_ids` quedan devueltas y dejan de contar.
- Se avisa al delegado y al responsable (`control_returned`).
- Desde otro estado responde `409 NOTHING_TO_RETURN`.

### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `decision` | `approve` \| `return` | sí | |
| `reason` | string | si `decision = return` | El motivo, en blanco no vale |
| `returned_submission_ids` | uuid[] | no | Entregas del control (evidencia manual) que causan la devolución. Una que no es del control: `422 returned_submission_ids.invalid` |

```json
{ "decision": "return", "reason": "El acta del comité no está firmada.", "returned_submission_ids": ["7d1c…"] }
```

### Avisos y rastro
- Cuando el control llega a `pending_approval`, se avisa al responsable (`control_pending_approval`); si no tiene
  responsable o el responsable es el `admin_empresa`, el aviso va al `admin_empresa`.
- La primera aprobación avisa al `admin_empresa` (`control_owner_approved`).
- La devolución avisa al delegado y al responsable (`control_returned`).
- Cada aprobación y cada devolución quedan en el registro de auditoría, en la misma transacción (G-09). Acciones: `control_approval.approve`, `control_approval.return` y, al registrar un resultado, `manual_test_result.register` (con `control.state` si cambia el estado).

## POST /v1/controls/{control_id}/tests/{test_id}/result — Registrar el resultado de una prueba manual

| | |
|---|---|
| **Quién** | El responsable del control. Si el control no tiene responsable o su responsable es el `admin_empresa`, lo registra el `admin_empresa` (`verdicts.register`, que pasa a [N, A, S, N, N, N]). El delegado carga la evidencia, pero no registra el resultado (D140 punto 2) |
| **Éxito** | `201` |
| **Errores** | `403` · `404` · `409 TEST_NOT_MANUAL` · `422 result.invalid` · `422 note.required` |

Aplica a las pruebas manuales (operativa, de población o técnica manual) del control. Una prueba automática la resuelve
el motor (`409 TEST_NOT_MANUAL`).

**El resultado es de la prueba en ese control**, no de todos los controles del servicio (D129, D132). Esto reemplaza a
D85 en lo manual. Cada registro es una fila nueva e inmutable que vale en la ventana vigente.

### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `result` | `correct` \| `observation` \| `exception` | sí | Subconjunto de `test_status` |
| `note` | string | si `result` es `observation` o `exception` | Lo que se vio |

### Response `201`
| Campo | Tipo | Qué es |
|---|---|---|
| `id` | uuid | |
| `control_id`, `test_id` | uuid | |
| `result` | enum | |
| `note` | string \| null | |
| `registered_by` | `{ id, name, last_name }` | |
| `registered_at` | datetime | |
| `management_state` | enum | El estado de gestión del control después del registro |

## Lo que se retira (D132 punto 3, D136)

La aprobación es del control, no de cada evidencia, y la evidencia documental va por la biblioteca de Documentos
(MD-506 y MD-507). Por eso se retiran estas rutas, que ninguna pantalla consume:
- `PUT /v1/evidence-submissions/{id}/review` (`evidencia.md`)
- `POST /v1/controls/{c}/tests/{t}/verdicts` y `PUT /v1/verdicts/{id}/review` (`veredictos.md`)

Una evidencia manual cuenta si la cargó el delegado o el responsable, está vigente y no fue devuelta.

## Cómo cuenta en el resumen

La categoría y el marco (`resumen.md`) cuentan como cumplido solo un control `approved`. Ya no basta con Adecuado o
Sólido (D130 puntos 4 y 5; cierra esa parte de DT-114).
