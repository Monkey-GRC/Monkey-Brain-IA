# Enums — Cumplimiento

> Índice de todos los enums: [`enums.md`](../enums.md). Por el cable viaja el **valor**; la etiqueta (es/en) la resuelve i18n. Formato: [`README.md`](../README.md#formato-de-un-enum).

**Contenido:** [Observaciones del auditor](#observaciones-del-auditor) · [Controles y exclusiones](#controles-y-exclusiones) · [Riesgos y causas](#riesgos-y-causas) · [Evaluación y veredictos](#evaluación-y-veredictos) · [Estados del motor (D68)](#estados-del-motor-d68)

---

## Observaciones del auditor

### `audit_observation_type`
**Columna:** `audit_observations.type`

| Valor | Etiqueta (es) |
|---|---|
| `observation` | Observación |
| `recommendation` | Recomendación |
| `information_request` | Solicitud de información |

### `audit_observation_status`
**Columna:** `audit_observations.status` · **Contrato:** `cumplimiento/observaciones.md` · Las dos listas (`audit_observation_type` y `audit_observation_status`) las sirve `GET /v1/catalogs/{nombre}`.

| Valor | Etiqueta (es) | Quién lo cambia |
|---|---|---|
| `open` | Abierta | Solo quien la escribió (el `auditor`) la devuelve a `open` |
| `answered` | Respondida | `admin_empresa`, el dueño o el ejecutor del control |
| `closed` | Cerrada | Solo quien la escribió (el `auditor`). **Una cerrada no se reabre** |

---

## Controles y exclusiones

### `control_type`
**Columna:** `client_controls.type`

| Valor | Etiqueta (es) |
|---|---|
| `manual` | Manual |
| `automated` | Automática |
| `hybrid` | Híbrida |
| `technical_manual` | Técnica manual |

### `control_approval`
**Dónde se usa:** si un control propio está aprobado. **Desde D96** un control propio nace `approved` (lo crea el `admin_empresa` directamente); `pending` y `rejected` quedan sin uso. Uno del catálogo es siempre `approved`.

| Valor | Etiqueta (es) |
|---|---|
| `approved` | Aprobado |
| `pending` | Pendiente de aprobación |
| `rejected` | Rechazado |

### `control_change_type`
**Columna:** `client_control_changes.change_type`

| Valor | Etiqueta (es) |
|---|---|
| `create` | Crear un control propio |
| `retire` | Dar de baja |
| `edit_dimensions` | Editar dimensiones |
| `edit_interpretation` | Editar interpretación |

### `control_change_status`
**Columna:** `client_control_changes.status` · **Contrato:** `cumplimiento/controles.md` · **Sin uso desde D96:** el `admin_empresa` edita y da de baja directamente, así que no hay propuestas que decidir.

| Valor | Etiqueta (es) |
|---|---|
| `pending` | Pendiente |
| `approved` | Aprobado |
| `rejected` | Rechazado |

### `exclusion_status`
**Columna:** `exclusions.status` · «Vencida» no es un estado: se deriva de `valid_until` (`is_expired`).

| Valor | Etiqueta (es) |
|---|---|
| `pending` | Pendiente |
| `approved` | Aprobada |
| `rejected` | Rechazada |

---

## Riesgos y causas

### `risk_criterion`
**Columnas:** `risks.trust_criterion` y `client_risks.trust_criterion` · **11 valores** · Sí del Excel (hoja *Riesgos*). **No son los 5 TSC.**

| Valor | Etiqueta (es) |
|---|---|
| `confidentiality` | Confidencialidad |
| `integrity` | Integridad |
| `availability` | Disponibilidad |
| `privacy` | Privacidad |
| `compliance` | Cumplimiento |
| `security` | Seguridad |
| `continuity` | Continuidad |
| `third_parties` | Terceros |
| `fraud` | Fraude |
| `reputation` | Reputación |
| `operations` | Operación |

### `risk_level`
**Columnas:** `client_risks.inherent_risk_level` y `residual_risks.residual_level` · Sí del Excel (matriz 5×5).

| Valor | Etiqueta (es) | Puntaje |
|---|---|---|
| `low` | Bajo | 1–4 |
| `moderate` | Moderado | 5–9 |
| `high` | Alto | 10–16 |
| `critical` | Crítico | 17–25 |

### `failure_category`
**Columna:** `causes.failure_category` · **6 valores** · Sí del Excel (hoja *Causas*).

| Valor | Etiqueta (es) |
|---|---|
| `human_resource` | Recurso humano |
| `processes` | Procesos |
| `information_technology` | Tecnología de información |
| `infrastructure` | Infraestructura |
| `external` | Externos |
| `governance` | Gobierno |

### `loss_type`
**Columna:** tipos de pérdida de `client_risks.potential_impact` · *Provisional (`P9`).* El Excel trae dos variantes de la última («…de la operación» y «…o cierre de la operación»); se tratan como un valor (decisión de desarrollo del 2026-10-17; el comité lo ratifica, `P9`).

| Valor | Etiqueta (es) |
|---|---|
| `reputational` | Reputacional |
| `financial_loss` | Pérdida financiera |
| `regulatory_sanction` | Sanción regulatoria |
| `litigation` | Litigios |
| `customer_trust_loss` | Pérdida de confianza de clientes |
| `operation_interruption` | Interrupción de la operación |

### `risk_treatment_decision`
**Definido en** `modelo-datos.md` §7 y §8.

| Valor |
|---|
| `mitigate` |
| `accept` |
| `transfer` |
| `avoid` |

### `cause_control_effect`
**Columnas:** `cause_controls.effect` y `client_cause_controls.effect` (D75). Un control sin efecto definido no participa del residual.

| Valor | Etiqueta (es) |
|---|---|
| `probability` | Probabilidad |
| `impact` | Impacto |

### `residual_acceptance`
**Dónde se usa:** el riesgo que queda frente al apetito (D75). El valor del apetito es un parámetro (inicial: 9 sobre 25); quién lo define está abierto (`P22`).

| Valor | Etiqueta (es) |
|---|---|
| `acceptable` | Aceptable |
| `not_acceptable` | No aceptable |

---

## Evaluación y veredictos

### `evaluation_origin`
**Columna:** `evaluations.origin`

| Valor | Etiqueta (es) | Qué significa |
|---|---|---|
| `automated` | Automática | La sonda |
| `manual` | Manual | Veredicto con evidencia |
| `ai_assisted` | Asistida por IA | Revisión documental |

### `action_plan_status`
**Columna:** `action_plans.status` · «Vencido» no es un estado: se deriva de `due_date`.

| Valor | Etiqueta (es) |
|---|---|
| `open` | Abierto |
| `in_progress` | En curso |
| `done` | Hecho |
| `cancelled` | Cancelado |

### `verdict_result`
**Dónde se usa:** el veredicto de un test (`cumplimiento/veredictos.md`). Es el subconjunto de `asset_result` que puede dar una persona.

| Valor | Etiqueta (es) |
|---|---|
| `compliant` | Cumple |
| `non_compliant` | No cumple |

### `verdict_state`
**Dónde se usa:** el estado combinado de un veredicto (`cumplimiento/veredictos.md`, D121). Se **deriva** de sus revisiones; no se guarda.

| Valor | Etiqueta (es) | Qué significa |
|---|---|---|
| `pending` | Pendiente de revisión | Nadie lo ha revisado; no cuenta |
| `approved` | Aprobado | Al menos una aprobación y ningún rechazo; cuenta su `result` |
| `rejected` | Rechazado | Algún rechazo; no cuenta y se registra uno nuevo |

### `verdict_review_decision`
**Columna:** `test_verdict_reviews.decision` (D121).

| Valor | Etiqueta (es) |
|---|---|
| `approve` | Aprobar |
| `reject` | Rechazar |

### `asset_result`
**Columna:** `evaluations.result` · El resultado de un activo en un test.

| Valor | Etiqueta (es) |
|---|---|
| `compliant` | Cumple |
| `non_compliant` | No cumple |
| `pending` | Pendiente |
| `error` | Error |
| `excluded` | Excluido |
| `not_applicable` | No aplica |

### Otros enums definidos en el modelo
Sus valores están en `modelo-datos.md` (§7 y §8); aquí solo se listan.

| Enum | Valores |
|---|---|
| `evaluation_result` | `compliant`, `non_compliant`, `pending`, `error`, `excluded`, `not_applicable` (el resultado de un activo en un test, ampliado por D68) |
| `finding_status` | `open`, `remediated`, `excluded` |
| `finding_origin` | `system`, `auditor` |
| `check_result_status` | `passed`, `failed`, `invalid`, `not_applicable`, `not_run` |

### `assessor_role` y `assessment_verdict`
**En pausa por D96 y `P35`: no se sirven ni se usan.** Evaluación del auditor (D77).

| Enum | Valor | Etiqueta (es) |
|---|---|---|
| `assessor_role` | `auditor` | Auditor |
| `assessment_verdict` | `certified` | Certifica |
| `assessment_verdict` | `not_certified` | No certifica |

---

## Estados del motor (D68)

Los **estados que el motor calcula** en cada nivel (`modelo-datos.md` §9). Se **derivan**, no son una columna que alguien edita. **La fuente (hoja `MODELO EVALUACIÓN MONKEY`) solo da las etiquetas en español**; los valores en `snake_case` en inglés son nuestra nomenclatura.
El cliente ve el estado cualitativo (Preparado, Casi listo, Requiere trabajo, Sin medir: `philosophy.md`) junto con su porcentaje de avance (D80); estos son los estados del motor, la **vista técnica** del auditor y del administrador de la empresa (D81, D96).

### `evidence_state`
**Dónde se usa:** estado calculado de una evidencia (se combina de las revisiones de cada rol, D102).

| Valor | Etiqueta (es) |
|---|---|
| `compliant` | Cumple |
| `non_compliant` | No cumple |
| `pending` | Pendiente |
| `in_review` | En revisión |
| `expired` | Evidencia vencida |
| `not_applicable` | No aplica |

### `evidence_review`
**Columna:** `evidence_reviews.review` (D84) · **Solo `human_validated` permite `compliant`; la IA nunca produce «cumple» (RN-03).**
Una persona lo guarda solo como `pending_review` o `human_validated`; **`ai_prevalidated` lo deriva el servidor** (la entrega tiene `ai_verdict` y ninguna revisión humana) y nunca se acepta de un cliente.

| Valor | Etiqueta (es) |
|---|---|
| `pending_review` | Pendiente de revisión |
| `ai_prevalidated` | Pre-validada por IA |
| `human_validated` | Validada por una persona |

### `reviewer_role`
**Columnas:** `evidence_reviews.reviewer_role` y `test_verdict_reviews.reviewer_role` (D102, que ajusta D96; D121) · **Una revisión por rol y entrega.** Si hay rechazo gana; con dos revisiones aprueban los dos. Sube el ejecutor, el dueño o el `admin_empresa`; el `auditor` la lee y no la revisa.

| Valor | Etiqueta (es) | Qué significa |
|---|---|---|
| `responsable` | Responsable | El dueño del control, cuando subió su delegado |
| `admin_empresa` | Administrador de la empresa | Puede revisar cualquier evidencia |

### `test_state`
**Dónde se usa:** estado de un test.

| Valor | Etiqueta (es) |
|---|---|
| `compliant` | Cumple |
| `non_compliant` | No cumple |
| `pending` | Pendiente |
| `evaluating` | En evaluación |
| `in_review` | En revisión |
| `expired` | Vencido |
| `error` | Error |
| `no_assets` | Sin activos |
| `not_applicable` | No aplica |
| `deactivated` | Desactivado |

### `control_state`
**Dónde se usa:** estado de un control del cliente.

| Valor | Etiqueta (es) |
|---|---|
| `effective` | Efectivo |
| `ineffective` | No efectivo |
| `expired` | Vencido |
| `error` | Error |
| `incomplete` | Incompleto |
| `evaluating` | En evaluación |
| `no_tests` | Sin tests |

### `rollup_state`
**Dónde se usa:** estado de una categoría y de un marco.

| Valor | Etiqueta (es) |
|---|---|
| `compliant` | Cumple |
| `non_compliant` | No cumple |
| `evaluating` | En evaluación |
| `no_controls` | Sin controles |
| `out_of_scope` | Fuera de alcance |

### `cause_state` y `risk_state`
**Dónde se usa:** mitigación (no es el riesgo que queda).

| Enum | Valor | Etiqueta (es) |
|---|---|---|
| `cause_state` | `mitigated` | Mitigada |
| `cause_state` | `not_mitigated` | No mitigada |
| `cause_state` | `evaluating` | En evaluación |
| `cause_state` | `no_controls` | Sin controles |
| `risk_state` | `mitigated` | Mitigado |
| `risk_state` | `not_mitigated` | No mitigado |
| `risk_state` | `evaluating` | En evaluación |
| `risk_state` | `no_causes` | Sin causas |

### Colores estándar (REQ-048)

| Color | Estados |
|---|---|
| Verde | cumple, efectivo, mitigado |
| Rojo | no cumple, no efectivo, no mitigado |
| Amarillo | pendiente, sin activos, sin tests |
| Naranja | en evaluación, en revisión, incompleto, vencido, error |
| Gris | no aplica, fuera de alcance, desactivado |
