# Enums — Cumplimiento

> Índice de todos los enums: [`enums.md`](../enums.md). Por el cable viaja el **valor**; la etiqueta (es/en) la resuelve i18n. Formato: [`README.md`](../README.md#formato-de-un-enum).

**Contenido:** [Modelo de evaluación v2](#modelo-de-evaluación-v2-vf18-d130-a-d135--nuevas) · [Observaciones del auditor](#observaciones-del-auditor) · [Controles y exclusiones](#controles-y-exclusiones) · [Riesgos y causas](#riesgos-y-causas) · [Evaluación](#evaluación-y-veredictos) · [Estados del motor (D68)](#estados-del-motor-d68)

---

## Modelo de evaluación v2 (VF18, D130 a D135) — nuevas

Las opciones son las de la tabla 8 de `01_DESARROLLO` y de `MAP CALOR`; los **valores** son propuesta de desarrollo y se
fijan al construir el motor v2 (RC-06 a RC-09). **Construidos con MD-498 (2026-11-23), con estos mismos valores:** `check_result`, `test_status`, `requirement_status` y `control_level` (`Backend/src/features/compliance/domain/engine/v2/types.ts`; `control_level` y `requirement_status` salen en la vista técnica de la lista, el detalle y el resumen). **Construido con MD-504 (2026-11-25):** `control_management_state` (`Backend/src/features/compliance/domain/controls/management-state.ts`), `control_approval_step`, `control_approval_decision` y `manual_test_result_value`. **Aún no existen en el Backend:** `manual_evidence_state`, `automatic_evidence_state` (MD-506) y `document_version_status` (MD-506). Reemplazan a las del modelo
de la VF2 marcadas abajo como reemplazadas.

### `manual_evidence_state` · `automatic_evidence_state`
**Dónde se usa:** el estado de una evidencia (§9). El de la manual se deriva de su ventana y de si fue devuelta; el de la automática, de su recolección.

| `manual_evidence_state` | Etiqueta (es) |
|---|---|
| `loaded` | Cargada |
| `current` | Vigente |
| `expired` | Vencida |
| `returned` | Devuelta |

| `automatic_evidence_state` | Etiqueta (es) |
|---|---|
| `received` | Recibida |
| `normalized` | Normalizada |
| `linked` | Vinculada |
| `incomplete` | Incompleta |
| `stale` | Desactualizada |

### `check_result`
**Dónde se usa:** el resultado de un check en un activo (§9). Se deriva de `check_result_status` del motor y de las excepciones.

| Valor | Etiqueta (es) | Desde el motor |
|---|---|---|
| `pass` | Cumple (PASS) | `passed` |
| `fail` | No cumple (FAIL) | `failed` |
| `fail_with_exception` | Falla con excepción aprobada | `failed` + excepción vigente (D135) |
| `not_applicable` | No aplica | `not_applicable` |
| `no_data` | Sin datos | `not_run`, o `invalid` tras los reintentos |

### `test_status`
**Dónde se usa:** el estado de una prueba (§9). Reemplaza a `test_state`.

| Valor | Etiqueta (es) |
|---|---|
| `pending` | Pendiente |
| `correct` | Correcto |
| `observation` | Observación |
| `exception` | Excepción |
| `not_applicable` | No aplica |
| `expired` | Vencido |

### `requirement_status`
**Dónde se usa:** el estado de un requisito del control (§9).

| Valor | Etiqueta (es) |
|---|---|
| `compliant` | Cumple |
| `non_compliant` | No cumple |
| `pending` | Pendiente |
| `expired` | Vencido |
| `not_applicable` | No aplica |

### `control_level`
**Dónde se usa:** el nivel calculado de un control (§9). Reemplaza a `control_state`. **Cumple solo en `adequate` y `solid`.**

| Valor | Etiqueta (es) | Valor de la escala |
|---|---|---|
| `not_evaluated` | No evaluado | 0 |
| `ineffective` | Ineficaz | 1 |
| `weak` | Débil | 2 |
| `partial` | Parcial | 3 |
| `adequate` | Adecuado | 4 |
| `solid` | Sólido | 5 |

### `control_management_state`
**Dónde se usa:** la gestión del control (D132; `cumplimiento/aprobacion.md`), calculada al leer; sale como `management_state`. **Solo `approved` cuenta como cumplido.**

| Valor | Etiqueta (es) |
|---|---|
| `non_compliant` | Incumplimiento |
| `in_progress` | En gestión |
| `pending_approval` | Cumple – por aprobar |
| `owner_approved` | Aprobado por el responsable |
| `approved` | Cumplimiento aprobado |
| `returned` | Devuelto |

### `control_approval_step` · `control_approval_decision` · `manual_test_result_value`
**Columnas:** `control_approvals.step`, `control_approvals.decision` y `manual_test_results.result` (D132, D140; `cumplimiento/aprobacion.md`). `manual_test_result_value` es el subconjunto de `test_status` que una persona puede registrar.

| Enum | Valor | Etiqueta (es) |
|---|---|---|
| `control_approval_step` | `owner` | Primera aprobación (responsable) |
| `control_approval_step` | `final` | Aprobación final (administrador de la empresa) |
| `control_approval_decision` | `approved` | Aprobado |
| `control_approval_decision` | `returned` | Devuelto |
| `manual_test_result_value` | `correct` | Correcto |
| `manual_test_result_value` | `observation` | Observación |
| `manual_test_result_value` | `exception` | Excepción |

### Gestión del control, MD-529
**Dónde se usa:** los enums de la corrección del nivel, el plan de remediación, «No aplica», las acciones permitidas y el historial (`cumplimiento/aprobacion.md`, «Lo nuevo de MD-529»). **Construidos con MD-529 (2026-11-26).**

#### `change_request_status`
**Columnas:** `control_level_overrides.status`, `remediation_plans.status` y `requirement_applicability_requests.status`.

| Valor | Etiqueta (es) |
|---|---|
| `pending` | Por aprobar |
| `approved` | Aprobada |
| `rejected` | Rechazada |

#### `requirement_applicability`
**Dónde se usa:** `management.requirements[].applicability` (no es columna: se deriva de `is_applicable` y la solicitud pendiente).

| Valor | Etiqueta (es) |
|---|---|
| `applicable` | Aplica |
| `not_applicable_pending` | No aplica, por aprobar |
| `not_applicable` | No aplica |

#### `management_action`
**Dónde se usa:** `management.allowed_actions[]` y la `allowed_actions[]` de cada ítem del detalle del control. Las acciones que el que llama puede hacer ahora.

| Valor | Etiqueta (es) |
|---|---|
| `approve` | Aprobar el cumplimiento |
| `return` | Devolver el control |
| `register_result` | Registrar el resultado |
| `propose_level` | Corregir el nivel |
| `decide_level` | Decidir la corrección del nivel |
| `register_plan` | Registrar el plan de remediación |
| `decide_plan` | Decidir el plan de remediación |
| `request_not_applicable` | Pedir «No aplica» |
| `decide_not_applicable` | Decidir «No aplica» |
| `revert_not_applicable` | Volver a aplicar el requisito |
| `declare_no_occurrences` | Declarar «sin casos» |
| `register_occurrence` | Registrar un caso |

#### `management_history_type`
**Dónde se usa:** `type` de cada ítem de `GET /v1/controls/{id}/management-history` y su filtro.

| Valor | Etiqueta (es) |
|---|---|
| `approval` | Aprobación |
| `return` | Devolución |
| `approval_invalidated` | Aprobación sin efecto |
| `manual_result` | Resultado de una prueba |
| `level_proposed` | Corrección de nivel propuesta |
| `level_decided` | Corrección de nivel decidida |
| `plan_registered` | Plan de remediación registrado |
| `plan_decided` | Plan de remediación decidido |
| `not_applicable_requested` | «No aplica» pedido |
| `not_applicable_decided` | «No aplica» decidido |
| `not_applicable_reverted` | «No aplica» revertido |
| `occurrence_registered` | Caso registrado |
| `no_occurrences_declared` | «Sin casos» declarado |

#### `work_decision_kind`
**Dónde se usa:** `pending_decisions[]` de cada ítem de `GET /v1/me/work` (bucket `to_review`).

| Valor | Etiqueta (es) | Para quién |
|---|---|---|
| `control_approval` | Aprobar el control | `responsable` (primera) y `admin_empresa` (final) |
| `manual_result` | Registrar el resultado de una prueba | `responsable` |
| `level_override` | Decidir una corrección de nivel | `admin_empresa` |
| `remediation_plan` | Decidir un plan de remediación | `admin_empresa` |
| `not_applicable` | Decidir un «No aplica» | `admin_empresa` |

### `document_version_status`
**Dónde se usa:** el estado de una versión de un documento de la empresa (§11, D133).

| Valor | Etiqueta (es) |
|---|---|
| `draft` | Borrador |
| `in_approval` | En aprobación |
| `rejected` | Rechazado |
| `approved` | Aprobado |
| `current` | Vigente |
| `renewal_due` | Por renovar |
| `expired` | Vencido |
| `archived` | Archivado |

### `risk_zone`
**Dónde se usa:** el apetito del riesgo (D134), leído por la zona de color de su celda. Reemplaza a `residual_acceptance`.

| Valor | Etiqueta (es) | Qué significa |
|---|---|---|
| `acceptable` | Aceptable | Zonas verde y amarilla |
| `tolerable` | Tolerable con tratamiento | Zona naranja: solo con un plan de tratamiento aprobado |
| `unacceptable` | Inaceptable | Zona roja: exige tratamiento |

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

> **Con la VF18 (D129)** sus valores pasan a ser los de `control_type` del catálogo ([`catalogo-maestro.md`](catalogo-maestro.md)): `manual`, `it_dependent_manual` y `automated`. `hybrid` y `technical_manual` los había derivado desarrollo (D4, D39) y se retiran con la carga de la v2.

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

### `gap_priority`
**No es columna:** se deriva al leer (severidad del check × criticidad del activo, `cumplimiento/brechas.md`; MD-502) · Catálogo: `/catalogs/gap_priority`.

| Valor | Etiqueta (es) |
|---|---|
| `critical` | Crítica |
| `high` | Alta |
| `medium` | Media |
| `low` | Baja |

### `exclusion_status`
**Columna:** `exclusions.status` · «Vencida» no es un estado: se deriva de `effective_until` (`is_expired`).

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
> **Con la VF18 (D134, MD-496)** el nivel sale de la **posición de la celda** (probabilidad, impacto) en la matriz, no de rangos del valor. La tabla de celdas está en D134 y la sirve `GET /risk-matrix`; el frontend no la escribe.
**Columnas:** `client_risks.inherent_risk_level` y `residual_risks.residual_level` · Sí del Excel (matriz 5×5).

| Valor | Etiqueta (es) |
|---|---|
| `low` | Bajo |
| `moderate` | Moderado |
| `high` | Alto |
| `critical` | Crítico |

### `failure_category`
> **Se retira con la VF18 (D129):** la reemplazan `cause_origin` y `cause_type` ([`catalogo-maestro.md`](catalogo-maestro.md)).
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
> **Se retira con la VF18 (D134):** el residual se calcula por cobertura y no usa el efecto de cada relación.
**Columnas:** `cause_controls.effect` y `client_cause_controls.effect` (D75). Un control sin efecto definido no participa del residual.

| Valor | Etiqueta (es) |
|---|---|
| `probability` | Probabilidad |
| `impact` | Impacto |

### `residual_acceptance`
> **Reemplazado por `risk_zone` (D134).**
**Dónde se usa:** el riesgo que queda frente al apetito (D75). El valor del apetito era un parámetro (9 sobre 25, D75).

| Valor | Etiqueta (es) |
|---|---|
| `acceptable` | Aceptable |
| `not_acceptable` | No aceptable |

---

## Período auditado y periodicidad (MD-500, D145, D147, D148) — nuevas

### `evaluation_period_status`
**Columna:** `service_framework_periods.status` · Como mucho un `open` por servicio × marco.

| Valor | Etiqueta (es) |
|---|---|
| `open` | Abierto |
| `closed` | Cerrado |

### `evaluation_period_origin`
**Columna:** `service_framework_periods.opened_by` · En la API, `opened_by`.

| Valor | Etiqueta (es) | Qué significa |
|---|---|---|
| `user` | Declarado | Lo declaró el `admin_empresa` |
| `system` | Automático | Lo abrió la tarea diaria al cerrar el anterior (D145) |

### `periodicity_source`
**Dónde se usa:** `technical.requirements[].periodicity_source` del detalle de un control (no es columna: se deriva).

| Valor | Etiqueta (es) | Qué significa |
|---|---|---|
| `catalog` | Sugerida | La del catálogo |
| `client` | Configurada | La cambió el `admin_empresa` con justificación (G-10, D147) |

## Evaluación y veredictos

### `evaluation_origin`
**Columna:** `evaluations.origin`

| Valor | Etiqueta (es) | Qué significa |
|---|---|---|
| `automated` | Automática | La sonda |
| `manual` | Manual | Veredicto con evidencia |
| `ai_assisted` | Asistida por IA | Revisión documental |

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
> **Reemplazado con la VF18 (D130, D132)** por `manual_evidence_state` y `automatic_evidence_state`.
**Dónde se usa:** estado calculado de una entrega de evidencia. Desde MD-504 (D132) se deriva solo de si la entrega fue devuelta: `compliant` (cuenta) o `non_compliant` (devuelta); `pending` sin entregas y `expired` por la ventana. `in_review` ya no se produce.

| Valor | Etiqueta (es) |
|---|---|
| `compliant` | Cumple |
| `non_compliant` | No cumple |
| `pending` | Pendiente |
| `in_review` | En revisión |
| `expired` | Evidencia vencida |
| `not_applicable` | No aplica |

### `test_state`
> **Reemplazado por `test_status` (D130).**
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
> **Reemplazado por `control_level` y `control_management_state` (D130, D132).**
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
> **Se retiran con la VF18 (D134):** la mitigación se mide por cobertura verificada, no por un estado de todo o nada.
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
