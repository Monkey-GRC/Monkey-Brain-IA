# Enums — Cumplimiento

Los valores de los enums de este módulo. Índice de todos: [`enums.md`](../enums.md). Por el cable viaja el **valor**; la etiqueta la resuelve i18n.

### `audit_observation_type` — `audit_observations.type`
`observation` Observación · `recommendation` Recomendación · `information_request` Solicitud de información

### `audit_observation_status` — `audit_observations.status`
`open` Abierta · `answered` Respondida · `closed` Cerrada. `admin_empresa` o el `funcional` dueño del control la pasan a `answered`; solo quien la escribió (el `auditor`) la cierra o la devuelve a `open`. Una cerrada no se reabre. Las dos listas (`audit_observation_type` y `audit_observation_status`) las sirve `GET /v1/catalogs/{nombre}`.
*(Contrato: `cumplimiento/README.md`.)*

### `control_change_type` — `client_control_changes.change_type`
`create` Crear un control propio · `retire` Dar de baja · `edit_dimensions` Editar dimensiones · `edit_interpretation` Editar interpretación

### `control_change_status` — `client_control_changes.status`
`pending` Pendiente · `approved` Aprobado · `rejected` Rechazado. **Sin uso desde D96**: el `admin_empresa` edita y da de baja directamente, así que no hay propuestas que decidir.
*(Contrato: `cumplimiento/controles.md`.)*

### `risk_criterion` — `risks.trust_criterion` y `client_risks.trust_criterion` · 11 valores
Sí del Excel (hoja *Riesgos*). **No son los 5 TSC.**

`confidentiality` Confidencialidad · `integrity` Integridad · `availability` Disponibilidad ·
`privacy` Privacidad · `compliance` Cumplimiento · `security` Seguridad · `continuity`
Continuidad · `third_parties` Terceros · `fraud` Fraude · `reputation` Reputación ·
`operations` Operación

### `risk_level` — `client_risks.inherent_risk_level` y `residual_risks.residual_level`
Sí del Excel (matriz 5×5): `low` Bajo (1-4) · `moderate` Moderado (5-9) · `high` Alto (10-16) ·
`critical` Crítico (17-25)

### `failure_category` — `causes.failure_category` · 6 valores
Sí del Excel (hoja *Causas*): `human_resource` Recurso humano · `processes` Procesos ·
`information_technology` Tecnología de información · `infrastructure` Infraestructura ·
`external` Externos · `governance` Gobierno

### `evaluation_origin` — `evaluations.origin`
`automated` Automática (sonda) · `manual` Manual (veredicto del administrador con evidencia) · `ai_assisted`
Asistida por IA (revisión documental)

### `action_plan_status` — `action_plans.status`
`open` Abierto · `in_progress` En curso · `done` Hecho · `cancelled` Cancelado. "Vencido" no es un
estado: se deriva de `due_date`.

### `risk_treatment_decision` · `evaluation_result` · `finding_status` · `finding_origin` · `check_result_status`
Ya definidos en `modelo-datos.md` (§7 y §8): `mitigate|accept|transfer|avoid`,
`compliant|non_compliant|pending|error|excluded|not_applicable` (el resultado de un activo en un test, ampliado por D68), `open|remediated|excluded`, `system|auditor`,
`passed|failed|invalid|not_applicable|not_run`.

### `control_type` — `client_controls.type`
`manual` Manual · `automated` Automática · `hybrid` Híbrida · `technical_manual` Técnica manual

### `control_approval` — si un control propio está aprobado
`approved` Aprobado · `pending` Pendiente de aprobación · `rejected` Rechazado. **Desde D96 un control propio nace `approved`** (lo crea el `admin_empresa` directamente); `pending` y `rejected` quedan sin uso. Uno del catálogo es siempre `approved`.

### `exclusion_status` — `exclusions.status`
`pending` Pendiente · `approved` Aprobada · `rejected` Rechazada. «Vencida» no es un estado: se deriva de `valid_until` (`is_expired`).

### `loss_type` — tipos de pérdida de `client_risks.potential_impact` *(provisional, `P9`)*
`reputational` Reputacional · `financial_loss` Pérdida financiera · `regulatory_sanction` Sanción regulatoria · `litigation` Litigios · `customer_trust_loss` Pérdida de confianza de clientes ·
`operation_interruption` Interrupción de la operación. El Excel trae dos variantes de la última («…de la operación» y «…o cierre de la operación»); se tratan como un valor (decisión de desarrollo del 2026-10-17; el comité lo ratifica, `P9`).

### `verdict_result` — el veredicto de un test (`cumplimiento/veredictos.md`)
`compliant` Cumple · `non_compliant` No cumple. Es el subconjunto de `asset_result` que puede dar una persona.

## Estados de evaluación (D68)

Los **estados que el motor calcula** en cada nivel (`modelo-datos.md` §9). Se **derivan**, no son una columna que alguien edita. **La fuente (hoja `MODELO EVALUACIÓN MONKEY`) solo da las etiquetas en español**; los valores en
`snake_case` en inglés son nuestra nomenclatura. El cliente ve el estado cualitativo (Preparado, Casi listo, Requiere trabajo, Sin medir: `philosophy.md`) junto con su porcentaje de avance (D80); estos son los estados del motor, la **vista técnica** del auditor y del administrador de la empresa (D81, D96).

### `evidence_state` — estado calculado de una evidencia
`compliant` Cumple · `non_compliant` No cumple · `pending` Pendiente · `in_review` En revisión · `expired` Evidencia vencida · `not_applicable` No aplica.

### `evidence_review` — `evidence_reviews.review` (D84)
`pending_review` Pendiente de revisión · `ai_prevalidated` Pre-validada por IA · `human_validated` Validada por una persona. Solo `human_validated` permite `compliant`; la IA nunca produce «cumple» (RN-03).
**Lo guarda una persona solo como `pending_review` o `human_validated`; `ai_prevalidated` lo deriva el servidor** (la entrega tiene `ai_verdict` y ninguna revisión humana) y nunca se acepta de un cliente.
`reviewer_role` (`evidence_reviews.reviewer_role`): desde D96 solo `admin_empresa`, que valida o rechaza la evidencia en **una sola revisión** (el `funcional` la sube; el `auditor` la lee y no la revisa). 

### `asset_result` — el resultado de un activo en un test (`evaluations.result`)
`compliant` Cumple · `non_compliant` No cumple · `pending` Pendiente · `error` Error · `excluded` Excluido (más `not_applicable`).

### `test_state` — estado de un test
`compliant` Cumple · `non_compliant` No cumple · `pending` Pendiente · `evaluating` En evaluación · `in_review` En revisión · `expired` Vencido · `error` Error · `no_assets` Sin activos ·
`not_applicable` No aplica · `deactivated` Desactivado.

### `control_state` — estado de un control del cliente
`effective` Efectivo · `ineffective` No efectivo · `expired` Vencido · `error` Error · `incomplete` Incompleto · `evaluating` En evaluación · `no_tests` Sin tests.

### `rollup_state` — estado de una categoría y de un marco
`compliant` Cumple · `non_compliant` No cumple · `evaluating` En evaluación · `no_controls` Sin controles · `out_of_scope` Fuera de alcance.

### `cause_state` · `risk_state` — mitigación (no es el riesgo que queda)
Causa: `mitigated` Mitigada · `not_mitigated` No mitigada · `evaluating` En evaluación · `no_controls` Sin controles.
Riesgo: `mitigated` Mitigado · `not_mitigated` No mitigado · `evaluating` En evaluación · `no_causes` Sin causas.

### `residual_acceptance` — el riesgo que queda frente al apetito (D75)
`acceptable` Aceptable · `not_acceptable` No aceptable. El valor del apetito es un parámetro (inicial: 9 sobre 25); quién lo define está abierto (`P22`).

### `assessor_role` · `assessment_verdict` — evaluación del auditor (D77, **en pausa por D96 y `P35`**: no se sirven ni se usan)
Rol: `auditor` Auditor. Veredicto: `certified` Certifica · `not_certified` No certifica.

### `cause_control_effect` — `cause_controls.effect` y `client_cause_controls.effect` (D75)
`probability` Probabilidad · `impact` Impacto. Un control sin efecto definido no participa del residual.

Colores estándar (REQ-048): verde cumple, efectivo, mitigado · rojo no cumple, no efectivo, no mitigado · amarillo pendiente, sin activos, sin tests · naranja en evaluación, en revisión, incompleto, vencido, error · gris no aplica, fuera de alcance, desactivado.
