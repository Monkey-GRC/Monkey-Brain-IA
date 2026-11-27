---
id: contracts-compliance-management
name: Gestión del control — R5, plan, «No aplica», ocurrencias e historial
description: Corrección del nivel (R5), plan de remediación por excepción, «No aplica» de un requisito, requisitos por evento con declaración trimestral, historial de gestión y acciones permitidas (MD-529; D135, D140, D131).
type: contract
---

# Gestión del control (MD-529)

> Continuación de [`aprobacion.md`](aprobacion.md), partido por tamaño (STANDARD §3). Allí: el estado de gestión, la aprobación, la devolución y el resultado de una prueba manual. Aquí: lo que se añadió con MD-529. Entidades, decisiones y tickets: ver la tabla de `aprobacion.md`.

# Lo nuevo de MD-529 — ACORDADO

> **Estado: ACORDADO y construido (MD-529, 2026-11-26).** Decisiones de Rod: R5 (D140 punto 3), plan de remediación por excepción (D140 punto 4), «No aplica» de un requisito (D135), la declaración trimestral y la evidencia por evento, el historial por ventana del período (DT-116). Las dudas 1 a 3 las resolvió Rod el 2026-11-26 (al final); el resto queda como está escrito. Cierra dos deudas técnicas (evidencia por evento y pieza de resultado), la parte manual de `DT-116` y la parte del plan de remediación de `DT-114`.

## Quién lleva el control (la regla de siempre, con nombre)

Los actos nuevos repiten la regla de la aprobación (G-05). **Quien lleva el control** es el `responsable` dueño; si el control no tiene responsable o su responsable es el `admin_empresa`, lo lleva el `admin_empresa`. El que lleva el control **propone o registra**; el `admin_empresa` **decide**. Cuando el `admin_empresa` lleva el control, lo que propone vale directo (nace `approved` con `decided_by` él mismo, como la aprobación única). Un `admin_empresa` que **no** lleva el control (hay otro responsable) no propone: `403`; solo decide.

| Acto | Lo propone / registra | Lo decide | Clave de la matriz (celdas `[admin_monkey, admin_empresa, responsable, delegado, auditor, colaborador]`) |
|---|---|---|---|
| Corregir el nivel (R5) | quien lleva el control | `admin_empresa` | `controls.propose_level` `[N, A, S, N, N, N]` · `controls.decide_level` `[N, A, N, N, N, N]` |
| Plan de remediación | quien lleva el control | `admin_empresa` | `controls.plan_register` `[N, A, S, N, N, N]` · `controls.plan_decide` `[N, A, N, N, N, N]` |
| «No aplica» de un requisito | quien lleva el control | `admin_empresa` | `controls.na_request` `[N, A, S, N, N, N]` · `controls.na_decide` `[N, A, N, N, N, N]` |
| Revertir un «No aplica» aprobado | quien lleva el control (directo, sin aprobación) | | `controls.na_request` |
| Declarar «sin casos» | quien lleva el control | | `controls.declare_no_occurrences` `[N, A, S, N, N, N]` |
| Registrar un caso y subir su evidencia | ejecutor, dueño o `admin_empresa` (como `evidence.upload`) | | `evidence.upload` `[N, A, S, S, N, N]` |

`S` = acotado a sus controles. `colaborador` y `admin_monkey`: `403` siempre. El `auditor` no escribe nada de esto.

**Solicitudes de decisión: forma común.** Las tres (nivel, plan, «No aplica») comparten el enum `change_request_status` (`pending` · `approved` · `rejected`, [`enums/cumplimiento.md`](../enums/cumplimiento.md#change_request_status)) y el mismo cuerpo de decisión:

| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `decision` | `approve` \| `reject` | sí | |
| `reason` | string | si `decision = reject` | En blanco no vale (`422 reason.required`); opcional al aprobar |

Errores comunes de decidir: `403` · `404` · `409 ALREADY_DECIDED` (ya no está `pending`) · `409 REQUEST_NO_LONGER_VALID` (dejó de valer, ver cada una; no se puede aprobar). Una solicitud tiene `is_valid`: `false` si dejó de valer (cambió el nivel sugerido, empezó otra ventana del control o, en el plan, la prueba ya no está en excepción). El servidor escribe `invalidated_at` cuando lo detecta (al escribir en el control y en la pasada diaria); al leer, `is_valid` se calcula siempre.

## R5 — Corregir el nivel (D140 punto 3)

El nivel **sugerido** lo calcula el motor (R1 a R6). El responsable puede proponer un nivel **final** distinto, con una justificación escrita; el `admin_empresa` la aprueba o rechaza. Se guardan **los dos** (sugerido y final) y la API expone ambos.

**Una vez aprobada, el nivel final reemplaza al sugerido en todas partes:** `technical.level` y `level_value`, `complies`, el estado de gestión, el rollup de categoría y marco (`resumen.md`) y la cobertura verificada del riesgo (`riesgos.md`). El `c_percent`, `progress` y `coverage` **no cambian**: son del motor.

**En la vista del período, la corrección aprobada solo puede bajar el nivel de su ventana; nunca lo sube.** (MD-529, Rod, 2026-11-26.) En `technical.period.level` y `period.complies`, para la ventana en que la corrección está vigente el nivel del período es el peor entre el calculado y el corregido; si la corrección sube el nivel, el período la ignora. Como la corrección cae sola al empezar una ventana nueva, no afecta a las demás ventanas del período.

**Qué niveles se pueden proponer** (Rod, 2026-11-26). Con `s` el nivel sugerido de la escala `control_level` (`enums/cumplimiento.md`):

| Sugerido | Se puede proponer | No se puede |
|---|---|---|
| `not_evaluated` (0) | nada (`409 LEVEL_NOT_EVALUATED`): no hay nada que evaluar | todo |
| `ineffective`, `weak`, `partial` (1–3, «no cumple») | otro de 1–3, o volver al sugerido para quitar una corrección | `adequate` o `solid` (4–5): cruzar a «cumple» si el motor no da el 100 % (R4) → `409 LEVEL_CHANGE_NOT_ALLOWED` |
| `adequate`, `solid` (4–5, «cumple») | cualquiera de 1–5 salvo el actual: dentro del lado (4↔5) o bajar a 1–3 | `not_evaluated` (0) |

Bajar de 4–5 a 1–3 **sí** se permite: el control deja de cumplir, **pierde las aprobaciones vigentes** (se invalidan en la misma transacción de la decisión) y vuelve a `in_progress` o `non_compliant`. Subir o bajar dentro del mismo lado no mueve las aprobaciones. El servidor devuelve `management.level.allowed_levels` con la lista ya calculada para el que llama.

**Cuándo deja de valer** (misma regla que la aprobación, arriba): una corrección aprobada o pendiente deja de valer si **cambia el nivel sugerido** o si **empieza una ventana nueva** del control (`window_start`, como `control_approvals`). Al dejar de valer, el control vuelve al nivel sugerido; si eso lo hace cumplir o no cumplir, se recalcula el estado de gestión y, si dejó de cumplir, las aprobaciones se invalidan (regla de arriba). **Se invalida al instante:** cada acto de gestión (resultado manual, plan, corrección, «No aplica», ocurrencia) revisa, en su misma transacción y sobre la lectura de después que ya tomó (sin consultas extra por control), lo que dejó de valer en *ese* control y le pone `invalidated_at` con la auditoría `control_level_override.invalidate` (con el usuario real del acto); la pasada diaria cubre el paso del tiempo. Una corrección invalidada **no resucita** si el sugerido vuelve a su valor.

### POST /v1/controls/{control_id}/level-overrides — Proponer un nivel final

| | |
|---|---|
| **Quién** | Quien lleva el control (`controls.propose_level`) |
| **Éxito** | `201` con la propuesta. `status: pending`; o `approved` directo si quien la hace es el `admin_empresa` que lleva el control |
| **Errores** | `403` · `404` · `409 LEVEL_NOT_EVALUATED` · `409 LEVEL_CHANGE_NOT_ALLOWED` · `409 LEVEL_OVERRIDE_ALREADY_PENDING` · `422 proposed_level.invalid` (el mismo nivel que ya rige, o `not_evaluated`) · `422 justification.required` |

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `proposed_level` | enum `control_level` | sí | Ver la tabla de arriba |
| `justification` | string | sí | Por qué el nivel del motor no refleja la realidad; en blanco no vale |

#### Response `201`
| Campo | Tipo | Qué es |
|---|---|---|
| `id` | uuid | |
| `control_id` | uuid | |
| `suggested_level` | enum `control_level` | El del motor **cuando se propuso** |
| `proposed_level` | enum `control_level` | |
| `justification` | string | |
| `status` | enum `change_request_status` | |
| `is_valid` | boolean | |
| `proposed_by`, `decided_by` | `{ id, name, last_name }` \| null | |
| `proposed_at`, `decided_at` | datetime \| null | |
| `decision_reason` | string \| null | |
| `management_state` | enum | El estado de gestión del control después del acto |

```json
{ "proposed_level": "weak", "justification": "Dos de los cinco accesos revisados siguen sin dueño; el motor no lo ve." }
```

Solo hay **una propuesta `pending` por control**. Con una corrección aprobada y vigente, una propuesta nueva la reemplaza al aprobarse (la anterior queda con `invalidated_at`).

### POST /v1/level-overrides/{id}/decision — Aprobar o rechazar la propuesta

| | |
|---|---|
| **Quién** | `admin_empresa` (`controls.decide_level`) |
| **Éxito** | `200` con la propuesta (misma forma) |
| **Errores** | Los comunes de decidir. Si al aprobar el nivel sugerido ya cambió, la propuesta dejó de valer: `409 REQUEST_NO_LONGER_VALID` |

Aprobar aplica el nivel final, **invalida las aprobaciones del control si deja de cumplir** y recalcula el estado, todo en la misma transacción.

## Plan de remediación por excepción (D140 punto 4)

Un plan por cada **excepción** del control: una prueba (`test_id`) en `exception` en un requisito aplicable. Lleva **qué se hará, quién y para cuándo**. Lo registra quien lleva el control y lo aprueba el `admin_empresa`. Reemplaza a `action_plans` de la v1 (retirada en MD-504) y cierra la parte de plan de remediación de `DT-114`.

**Un plan `pending` también deja de valer** (invalidado con la auditoría `remediation_plan.invalidate`, en el mismo acto que cambió la prueba) si su prueba ya no está en Excepción o su requisito pasó a «No aplica»: sale de lo que decide el administrador (`pending_decisions` y «esperando al administrador» usan el mismo criterio) y decidirlo da `404` (ya invalidado) o `409 REQUEST_NO_LONGER_VALID` (si aún no lo estaba).

**Regla de Parcial** (§9, nivel 3): `Parcial` exige 75 % ≤ C% < 100 %, el documento base aprobado y vigente **y un plan aprobado y vigente por cada excepción**. Si a alguna excepción le falta su plan aprobado, el nivel sugerido queda **Débil**. Un plan está **vigente** si está `approved`, es de la ventana actual del control y la prueba sigue en excepción; si la excepción se corrige, el plan sale de la cuenta (y deja de pedirse). Aprobar o dejar de valer un plan puede cambiar el nivel sugerido (y, con él, una corrección R5 pendiente o aprobada).

### POST /v1/controls/{control_id}/remediation-plans — Registrar el plan de una excepción

| | |
|---|---|
| **Quién** | Quien lleva el control (`controls.plan_register`) |
| **Éxito** | `201` con el plan. `pending`, o `approved` directo si lo registra el `admin_empresa` que lleva el control |
| **Errores** | `403` · `404` · `409 TEST_NOT_IN_EXCEPTION` · `409 PLAN_ALREADY_EXISTS` (ya hay uno `pending` o `approved` y vigente para esa prueba) · `422 what.required` · `422 owner_id.invalid` · `422 due_date.past` |

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `test_id` | uuid | sí | Una prueba del control que hoy está en excepción |
| `what` | string | sí | Qué se hará; en blanco no vale |
| `owner_id` | uuid | sí | Persona **activa de la empresa** (`admin_empresa`, `responsable` o `delegado`) que hará lo que dice el plan; se elige de [`GET /v1/users/directory`](#get-v1usersdirectory--las-personas-para-elegir-quién-hace-un-plan) |
| `due_date` | date | sí | Hoy o después, **con un día de tolerancia**: el modelo no guarda la zona horaria de la empresa, así que «hoy» es el día UTC y vale desde ayer (UTC); antes de eso, `422 due_date.past` |

#### Response `201`
| Campo | Tipo | Qué es |
|---|---|---|
| `id`, `control_id` | uuid | |
| `test` | `{ id, code, display_name }` | El nombre neutro de la prueba; nunca su texto del comité |
| `requirement` | `{ id, code }` | El requisito del control al que pertenece |
| `what` | string | |
| `owner` | `{ id, name, last_name }` | Quién lo hará |
| `due_date` | date | |
| `is_overdue` | boolean | `due_date` pasó y la excepción sigue abierta |
| `status`, `is_valid` | enum, boolean | Como la propuesta de nivel |
| `proposed_by`, `proposed_at`, `decided_by`, `decided_at`, `decision_reason` | | Como la propuesta de nivel |
| `management_state` | enum | |

### POST /v1/remediation-plans/{id}/decision — Aprobar o rechazar el plan

| | |
|---|---|
| **Quién** | `admin_empresa` (`controls.plan_decide`) |
| **Éxito** | `200` con el plan |
| **Errores** | Los comunes de decidir |

Un plan `rejected` se vuelve a registrar con un `POST` nuevo. No hay edición: un plan `approved` solo sale de la cuenta cuando deja de valer.

## «No aplica» de un requisito (D135, §7)

Un requisito del control puede declararse **No aplica** con justificación: lo pide quien lleva el control y lo aprueba el `admin_empresa`. Aprobado, el requisito **sale del denominador del C%** y de los requisitos que impiden el 100 % (`client_control_requirements.is_applicable = false`, `not_applicable_reason`). Vale hasta que se revierta (no depende de la ventana). No se puede pedir sobre el último requisito aplicable del control (`409 LAST_APPLICABLE_REQUIREMENT`). Un control propio no tiene requisitos del catálogo: no aplica.

### POST /v1/controls/{control_id}/requirements/{requirement_id}/not-applicable-requests — Pedir «No aplica»

| | |
|---|---|
| **Quién** | Quien lleva el control (`controls.na_request`) |
| **Éxito** | `201` con la solicitud. `pending`, o `approved` directo si la pide el `admin_empresa` que lleva el control |
| **Errores** | `403` · `404` · `409 ALREADY_NOT_APPLICABLE` · `409 REQUEST_ALREADY_PENDING` · `409 LAST_APPLICABLE_REQUIREMENT` · `422 reason.required` |

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `reason` | string | sí | La justificación; en blanco no vale |

#### Response `201`
| Campo | Tipo | Qué es |
|---|---|---|
| `id`, `control_id` | uuid | |
| `requirement` | `{ id, code, text }` | |
| `reason` | string | |
| `status` | enum `change_request_status` | |
| `requested_by`, `requested_at`, `decided_by`, `decided_at`, `decision_reason` | | |
| `management_state` | enum | |

### POST /v1/not-applicable-requests/{id}/decision — Aprobar o rechazar

| | |
|---|---|
| **Quién** | `admin_empresa` (`controls.na_decide`) |
| **Éxito** | `200` con la solicitud |
| **Errores** | Los comunes de decidir, más `409 LAST_APPLICABLE_REQUIREMENT` |

Aprobar recalcula el C%, el nivel y el estado de gestión del control (puede pasar a `pending_approval`) en la misma transacción.

### POST /v1/controls/{control_id}/requirements/{requirement_id}/not-applicable/revert — Volver a aplicar

| | |
|---|---|
| **Quién** | Quien lleva el control (`controls.na_request`); **directo, sin aprobación**: volver a medir lo vuelve más exigente |
| **Éxito** | `200` con la solicitud (con `reverted_by`, `reverted_at`) |
| **Errores** | `403` · `404` · `409 NOT_NOT_APPLICABLE` (el requisito sí aplica) · `422 reason.required` |

Body `{ "reason": "…" }`. El requisito vuelve al denominador; si el control cumplía, puede dejar de hacerlo y **pierde las aprobaciones** (regla de arriba).

## Requisitos «cuando sea requerido»: ocurrencias y declaración trimestral (D131 punto 3)

Un requisito con periodicidad `on_demand` y alguna prueba **que no es documental** se mide **por trimestre de calendario** (la ventana de D131); una prueba documental se decide con su documento (T-01) aunque su requisito sea «cuando sea requerido»: no pide ocurrencias ni declaración (`409 REQUIREMENT_NOT_ON_DEMAND`, y `occurrence_id` no se admite en su evidencia). En cada trimestre hay dos caminos:
1. **Hubo ocurrencias** (un alta de proveedor, un incidente, un cambio de emergencia…): cada una se registra como **ocurrencia** y exige su evidencia.
2. **No hubo ninguna:** quien lleva el control firma una **declaración de «sin ocurrencias»** del trimestre.

**Lo que el motor hace con esto** (§9, última fila de la tabla de vigencia), por requisito y trimestre:

| Situación del trimestre | Estado de la prueba |
|---|---|
| Trimestre abierto, sin ocurrencias ni declaración | `pending` (con el aviso `window_due_soon` 15 días antes del cierre, PR-06) |
| Trimestre abierto, hay una ocurrencia sin evidencia | `pending` |
| Trimestre cerrado, hay una ocurrencia sin evidencia | **`exception`** |
| Trimestre cerrado, sin ocurrencias ni declaración | **`expired`** (Vencido) |
| Todas las ocurrencias con evidencia vigente | cuenta como evidencia válida de la ventana: en una prueba manual no documental decide, como siempre, el resultado que registra el responsable (sin resultado, `pending`); en la documental, la evidencia |
| Hay declaración y ninguna ocurrencia | `correct`, sin resultado que registrar (no hay nada que revisar) |

Una ocurrencia **tiene evidencia** si alguna entrega vinculada a ella está vigente y no fue devuelta (`evidence_submissions.requirement_occurrence_id`). La evidencia subida después del cierre del trimestre cuenta (la ocurrencia ya existía); una ocurrencia registrada después del cierre queda `exception` hasta tener evidencia. La declaración solo se firma en el **trimestre abierto**; uno cerrado no se declara.

### POST /v1/controls/{control_id}/requirements/{requirement_id}/occurrences — Registrar un caso

| | |
|---|---|
| **Quién** | Ejecutor, dueño o `admin_empresa` (`evidence.upload`) |
| **Éxito** | `201` |
| **Errores** | `403` · `404` · `409 REQUIREMENT_NOT_ON_DEMAND` · `422 occurred_on.future` (con un día de tolerancia: «hoy» es el día UTC y vale hasta mañana UTC) · `422 description.required` |

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `occurred_on` | date | sí | Hoy o antes; fija en qué trimestre cae |
| `description` | string | sí | Qué pasó, en una línea |

#### Response `201`
`id`, `requirement` (`{ id, code }`), `occurred_on`, `description`, `has_evidence` (boolean), `registered_by` (`{ id, name, last_name }`), `registered_at`. Si el trimestre tenía una declaración vigente, **queda sin efecto** (`invalidated_at`, rastro `no_occurrence_declaration.invalidate`).

### GET /v1/controls/{control_id}/requirements/{requirement_id}/occurrences — Listar las ocurrencias

| | |
|---|---|
| **Quién** | Mismas reglas de lectura que `GET /v1/controls/{id}` |
| **Éxito** | `200`, paginada (`sort=-occurred_on` por defecto). Filtro `quarter_start` (date) opcional |
| **Errores** | `403` · `404` |

Cada ítem como la respuesta del `POST`, con `evidence_count` (entregas vigentes y no devueltas).

### Subir la evidencia de una ocurrencia

Se extiende `POST /v1/controls/{control_id}/tests/{test_id}/evidence` (`evidencia.md`) con un campo de formulario:

| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `occurrence_id` | uuid | **sí** si la prueba es de un requisito `on_demand`; no se admite en otro | Una ocurrencia del requisito al que sirve la prueba: si es de otro, `422 occurrence_id.invalid`; si falta, `422 occurrence_id.required` |

La entrega queda vinculada a la ocurrencia. Cada ocurrencia lleva su propio «lugar» de versiones.

### POST /v1/controls/{control_id}/requirements/{requirement_id}/no-occurrence-declarations — Declarar «sin casos»

| | |
|---|---|
| **Quién** | Quien lleva el control (`controls.declare_no_occurrences`) |
| **Éxito** | `201` |
| **Errores** | `403` · `404` · `409 REQUIREMENT_NOT_ON_DEMAND` · `409 OCCURRENCES_EXIST` (el trimestre ya tiene una) · `409 ALREADY_DECLARED` |

Sin cuerpo obligatorio (opcional `note`, string). Vale para el trimestre **abierto**. Respuesta: `id`, `requirement`, `window_start`, `window_end`, `note`, `declared_by`, `declared_at`.

## GET /v1/users/directory — Las personas para elegir quién hace un plan

| | |
|---|---|
| **Quién** | Quien puede registrar un plan: `admin_empresa` y `responsable` (`users.directory`); el resto, `403` |
| **Éxito** | `200`, sin paginación (orden por nombre) |
| **Errores** | `403` |

`data.items[]`: `{ id, name, last_name, role }` de las personas **activas** de la empresa con rol `admin_empresa`, `responsable` o `delegado`. Sin correo ni otros datos. Con `withScope` (RLS): nunca personas de otra empresa. Está también en [`gestion-usuarios.md`](../gestion-usuarios.md). **Sin paginar, ordenado por nombre, con un tope de 500 personas** (el cupo de usuarios de la empresa es el techo real, así que el tope no recorta a nadie).

## DT-116: la vista del período lee el historial manual

`technical.period` (R6, `controles.md`) ya no usa solo el último resultado de cada prueba manual: para cada ventana **ya cerrada** del período lee el historial de `manual_test_results` (cada fila con su `registered_at`, D140) y una ventana cuenta como cubierta si hay un resultado **registrado dentro de ella** (o, en la documental, evidencia válida de esa ventana). En un requisito `on_demand` una ventana está cubierta si todas sus ocurrencias tienen evidencia o hay declaración. Sin cambio de forma en la API; los vínculos de módulo y las dependencias (T-06) y la anual siguen como en `DT-116` (MD-497).

## El detalle del control: lo que la pantalla necesita

`GET /v1/controls/{id}` agrega, **dentro de `management`**, para todos los que lo leen (con las salvedades de la duda 2):

| Campo | Tipo | Qué es |
|---|---|---|
| `management.allowed_actions` | enum `management_action`[] | Lo que el que llama puede hacer **ahora** sobre el control; la pantalla pinta los botones con esto y no duplica la matriz. Vacío si nada. Lo calcula el servidor con el rol leído de la base, el estado y los actos pendientes |
| `management.level` | objeto \| null | `{ suggested, final, is_corrected, allowed_levels[] }` (enum `control_level`). `null` si el que llama no ve niveles. `final` = el que rige; `is_corrected` = hay una corrección aprobada y vigente; `allowed_levels[]` = lo que **él** puede proponer (vacío si no puede) |
| `management.level_override` | objeto \| null | La propuesta más reciente de la ventana vigente (`pending`, o `approved` vigente, o la última `rejected`), con la forma del `POST …/level-overrides`: una rechazada trae `decided_by`, `decided_at` y `decision_reason`, igual que el plan y el «No aplica» rechazados, para mostrar «Rechazado por…» |
| `management.exceptions[]` | objeto | Una por prueba en excepción de un requisito aplicable: `{ test: { id, code, display_name }, requirement: { id, code }, plan: <plan> \| null, allowed_actions[] }`. `plan` es el vigente (`pending` o `approved`) o el último `rejected`; `allowed_actions` incluye `register_plan` si no hay uno vigente, o `decide_plan` si está `pending` |
| `management.requirements[]` | objeto | Los requisitos del control, para pedir su «No aplica» y registrar ocurrencias sin la vista técnica: `{ id, code, text, periodicity, applicability, not_applicable, on_demand, allowed_actions[] }` |
| `…requirements[].applicability` | enum `requirement_applicability` | `applicable` · `not_applicable_pending` · `not_applicable` |
| `…requirements[].not_applicable` | objeto \| null | La solicitud más reciente (forma del `POST …/not-applicable-requests`, con `id`) |
| `…requirements[].on_demand` | objeto \| null | Solo en `periodicity: on_demand`: `{ window_start, window_end, occurrences_count, occurrences_without_evidence, has_declaration }` del trimestre actual: `occurrences_count` es el total de casos del trimestre vigente |
| `management.manual_tests[]` | objeto | Las pruebas manuales no documentales del control: `{ test: { id, code, display_name }, requirement_id, status (test_status), accepts_evidence, latest_result: { result, note, registered_by, registered_at } \| null, allowed_actions[] }` (`register_result` si puede). `requirement_id` es el requisito del control al que sirve la prueba (el «cuando sea requerido» si tiene alguno; `null` en un control propio): de ahí la pantalla sabe si debe pedir la ocurrencia |

**`allowed_actions`**: el enum `management_action` ([`enums/cumplimiento.md`](../enums/cumplimiento.md#management_action)) lleva `approve`, `return`, `register_result`, `propose_level`, `decide_level`, `register_plan`, `decide_plan`, `request_not_applicable`, `decide_not_applicable`, `revert_not_applicable`, `declare_no_occurrences` y `register_occurrence`. A nivel de control es la **unión** de las de los ítems; cada ítem (`exceptions[]`, `requirements[]`, `manual_tests[]`) trae la suya para el elemento concreto. Reglas: `approve` y `return` son las de `POST …/approval` (paso del que llama y estado); `register_result` las de `canRegisterManualResult`; `propose_level` solo si quien llama lleva el control, el nivel sugerido no es `not_evaluated` y no hay propuesta `pending`; `decide_level`, `decide_plan` y `decide_not_applicable` solo para el `admin_empresa` y si hay algo `pending` y vigente. Nunca incluye una acción que acabaría en `403`. **`allowed_actions` es ayuda para pintar; el servidor vuelve a comprobar cada escritura.**

La **vista técnica** (`?view=technical`) cambia así: `technical.level` y `level_value` son los **finales**; se agrega `technical.suggested_level`. `technical.requirements[]` agrega `applicability`.

## GET /v1/controls/{control_id}/management-history — El historial de gestión

| | |
|---|---|
| **Quién** | Las mismas reglas de lectura que `GET /v1/controls/{id}` (`admin_empresa` y `auditor` todos; `responsable` y `delegado` solo sus controles, `403` en otro). Un control dado de baja se sigue leyendo (D119) |
| **Éxito** | `200`, paginada (`sort=-at` por defecto; la más reciente primero) |
| **Errores** | `403` · `404` |

#### Parámetros (query)
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `type` | enum `management_history_type`, repetible | no | Filtra por tipo |
| `from`, `to` | date (`YYYY-MM-DD`) | no | Rango de `at`; solo `YYYY-MM-DD` (otro formato, `422`) y `from` no puede ser posterior a `to` (`422 to.before_from`) |
| `page`, `page_size`, `sort` | | no | Ver `conventions.md`; `sort` admite `at` y `-at` |

#### Response `200`
Cada ítem es **una fila por acto**, con quién y cuándo:

| Campo | Tipo | Qué es |
|---|---|---|
| `id` | uuid | Del registro de origen (aprobación, resultado, propuesta, plan…) |
| `type` | enum `management_history_type` | Ver abajo |
| `at` | datetime | Cuándo ocurrió el acto |
| `actor` | `{ id, name, last_name }` \| null | Quién; `null` en lo que hace el sistema (`approval_invalidated`) |
| `test` | `{ id, code, display_name }` \| null | Si el acto es de una prueba |
| `requirement` | `{ id, code }` \| null | Si es de un requisito |
| `detail` | objeto | Depende del `type` |

| `type` | `detail` |
|---|---|
| `approval` | `{ step: owner \| final }` |
| `return` | `{ reason, returned_submissions: [{ id, version, description }] }` |
| `approval_invalidated` | `{ step, cause }`; `cause` es `control_stopped_complying` (el control dejó de cumplir o empezó una ventana nueva: hoy no se distinguen) |
| `manual_result` | `{ result, note }` |
| `level_proposed` | `{ suggested_level, proposed_level, justification, status, decided_directly }` |
| `level_decided` | `{ suggested_level, proposed_level, decision: approved \| rejected, reason }` (el actor es quien decidió) |
| `plan_registered` | `{ what, owner: { id, name, last_name }, due_date, status, decided_directly }` |
| `plan_decided` | `{ decision, reason }` |
| `not_applicable_requested` | `{ reason, status, decided_directly }` |
| `not_applicable_decided` | `{ decision, reason }` |
| `not_applicable_reverted` | `{ reason }` |
| `occurrence_registered` | `{ occurred_on, description }` |
| `no_occurrences_declared` | `{ window_start, window_end, note }` |

Los niveles (`suggested_level`, `proposed_level`) solo salen para quien ve `management.level`; para el `delegado` van en `null`. Una decisión (`level_decided`, `plan_decided`, `not_applicable_decided`) es una fila **aparte** de su solicitud, con el actor y la fecha de quien decidió; una solicitud aprobada directamente (`decided_directly: true`) genera solo la fila de solicitud.

#### Rendimiento
Se arma con una consulta `UNION ALL` paginada en la base (no se trae todo para paginar en memoria) y una sola consulta de personas; el número de consultas es fijo.

## Avisos y rastro (MD-529)

**Avisos** (`notificaciones.md`; tipos nuevos, [`enums/notificaciones.md`](../enums/notificaciones.md)). Todos en la misma transacción que el acto, como los de MD-504:

| Tipo | Cuándo | Recibe |
|---|---|---|
| `level_override_proposed` | Se propone una corrección de nivel que espera decisión | `company_admin` |
| `level_override_decided` | El `admin_empresa` aprueba o rechaza | `owner` (quien propuso) |
| `remediation_plan_proposed` | Se registra un plan que espera decisión | `company_admin` |
| `remediation_plan_decided` | Se aprueba o rechaza el plan | `owner` (quien lo registró); si se aprueba, también `assignee` (la persona del plan) |
| `not_applicable_requested` | Se pide un «No aplica» que espera decisión | `company_admin` |
| `not_applicable_decided` | Se aprueba o rechaza | `owner` |

Lo que lleva el control a `pending_approval` o `returned` por estos actos usa los avisos de MD-504 (`control_pending_approval`, `control_returned`). `window_due_soon` y `window_expired` cubren también los trimestres de los requisitos `on_demand` (sin ocurrencia con evidencia ni declaración). Si quien actúa es el propio destinatario, no se le avisa.

**Rastro** (`audit_logs`, misma transacción, G-09; con `control.state` y `control.level` en `after_state` si cambian). Acciones nuevas:
`control_level_override.propose` · `.approve` · `.reject` · `.invalidate` · `remediation_plan.register` · `.approve` · `.reject` · `.invalidate` · `requirement_not_applicable.request` · `.approve` · `.reject` · `.revert` · `requirement_occurrence.register` · `no_occurrence_declaration.declare` · `no_occurrence_declaration.invalidate`. Las aprobaciones que se invalidan por una decisión (nivel que baja, «No aplica» que se revierte) dejan además `control_approval.invalidate`. `control_level_override.invalidate` y `remediation_plan.invalidate` los escribe la pasada diaria (y `control_approval.invalidate`, cada acto o pasada que le quita las aprobaciones a un control) cuando algo deja de valer (otra ventana o otro nivel sugerido); llevan el `invalidated_at`. Cada acto que cambia el estado de cumplimiento del control deja un `compliance_events` (D91).

## Errores nuevos (resumen)

| HTTP | `error.code` | Cuándo |
|---|---|---|
| 409 | `LEVEL_OVERRIDE_PENDING` | Aprobar un control con una propuesta de nivel `pending` |
| 409 | `LEVEL_OVERRIDE_ALREADY_PENDING` | Proponer con otra `pending` |
| 409 | `LEVEL_NOT_EVALUATED` | El nivel sugerido es `not_evaluated` |
| 409 | `LEVEL_CHANGE_NOT_ALLOWED` | El nivel pedido cruza de «no cumple» a «cumple» sin el 100 % del motor |
| 409 | `TEST_NOT_IN_EXCEPTION` | Plan sobre una prueba que no está en excepción |
| 409 | `PLAN_ALREADY_EXISTS` | Ya hay un plan vigente para esa prueba |
| 409 | `ALREADY_NOT_APPLICABLE` · `NOT_NOT_APPLICABLE` · `LAST_APPLICABLE_REQUIREMENT` · `REQUEST_ALREADY_PENDING` | «No aplica» |
| 409 | `REQUIREMENT_NOT_ON_DEMAND` · `OCCURRENCES_EXIST` · `ALREADY_DECLARED` | Ocurrencias y declaración |
| 409 | `ALREADY_DECIDED` · `REQUEST_NO_LONGER_VALID` | Decidir una solicitud que ya no se puede decidir |
| 422 | `proposed_level.invalid` · `justification.required` · `what.required` · `owner_id.invalid` · `due_date.past` · `reason.required` · `occurred_on.future` · `description.required` · `occurrence_id.required` · `occurrence_id.invalid` | Validación (`error.fields`) |

## Dudas de MD-529 y cómo quedaron

Ninguna dependía de una `P-n` abierta del comité. **Rod resolvió el 2026-11-26** las tres primeras (todas la opción A, la recomendada); el resto queda como está escrito arriba.

1. **Un plan vencido** (`due_date` pasada con la excepción aún abierta): **sigue contando**; solo se muestra `is_overdue`. Si el comité decide que no cuente, es un cambio de una línea en la regla de Parcial.
2. **Niveles y requisitos para el responsable:** `management.level` y `management.requirements[]` los ven el `auditor`, el `admin_empresa` y el responsable **dueño** de ese control (los requisitos, también su ejecutor); el resto de la vista técnica (pruebas, checks, vínculos) sigue cerrada.
3. **Revertir un «No aplica»:** directo por quien lleva el control, con motivo y rastro (volver a medir solo endurece el control).
4. El último requisito aplicable no se puede dejar en «No aplica» (`409 LAST_APPLICABLE_REQUIREMENT`).
5. Nunca se propone `not_evaluated`, ni se corrige si el motor da `not_evaluated`.
6. 4 ↔ 5 se permite como lo dijo Rod, sin consultar al comité.
7. El «No aplica» de una **prueba** (no de un requisito) queda fuera: otro ticket.
8. La declaración «sin ocurrencias» es una por requisito `on_demand` y trimestre.
9. «Mi trabajo»: el bucket `to_review` del responsable incluye la evidencia del delegado que espera su resultado; **cerró la deuda de la pieza de resultado** (una prueba manual no documental que acepta subida cuenta dos piezas).
10. El nivel «final» se llama `management.level.final` en la API y «Nivel final» en pantalla (el texto exacto lo decide `monkey-ui-copy` en MD-505).

## Lo que se ajustó al construir

- Un control **dado de baja** responde `404` en los actos nuevos (como `POST …/approval`); su historial y sus ocurrencias sí se leen (D119).
- El campo del plan que dice quién lo hace se llama `owner_id` (request) y `owner` (response), con `422 owner_id.invalid`; la columna sigue siendo `assignee_id` en la base.
- `approval_invalidated.cause` solo trae `control_stopped_complying`: la base no distingue la ventana nueva.
- `evidence_tests[].control_requirement_id` (nuevo, siempre) es el requisito del control al que sirve la prueba. **`evidence_tests[].requirement_id` conserva su significado** (el lugar de la primera entrega; `null` si aún no hay): cambiarlo rompería a quien ya lo lee.
- El aviso de cada acto no sale si lo propone el `admin_empresa` que lleva el control (ya nace aprobado).
