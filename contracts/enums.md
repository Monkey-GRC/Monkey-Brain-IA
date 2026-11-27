---
id: contracts-enums
name: Enums de la API
description: Tabla única valor snake_case a etiqueta es/en para todos los enums del onboarding. Las opciones salen literalmente del Excel del comité.
type: contract
---

# Enums

Por el cable viaja el **valor**; la etiqueta la resuelve i18n. Las listas de opciones son las
literales del Excel del comité (hojas `Contexto Empresa`, `Contexto del servicio ` y
`Activos  del Servicio (SCOPE)`), que es la fuente de verdad.

**Donde el Excel tiene más valores que `modelo-datos.md`, gana el Excel** y el modelo se corrige.
Está marcado en cada caso.

## Dónde está cada enum

Un enum vive **una sola vez**, en el archivo del módulo o componente que lo posee (los mismos nombres que `references/arquitectura/`, `STANDARD.md` §2b). El formato de cada enum está en [`README.md`](README.md#formato-de-un-enum).

| Módulo | Archivo | Enums |
|---|---|---|
| Onboarding · Contexto organizacional | [`enums/onboarding/contexto-organizacional.md`](enums/onboarding/contexto-organizacional.md) | `size` · `industry` · `business_model` · `years_in_operation` · `country` · `compliance_maturity` · `regulation` · `responsible_type` |
| Onboarding · Contexto del servicio | [`enums/onboarding/contexto-servicio.md`](enums/onboarding/contexto-servicio.md) | `service_type` · `served_industry` · `active_client_count` · `service_country` · `data_type` · `trust_criterion` · `subservice_type` · `framework` · `previous_certification` · `expected_availability` · `service_framework_status` |
| Onboarding · Conexión de activos | [`enums/onboarding/conexion-activos.md`](enums/onboarding/conexion-activos.md) | `deployment_scenario` · `connection_category` · `operational_status` · `asset_type` · `asset_criticality` · `asset_origin` · `asset_status` · `provisioning_status` · `connection_method` · `resource_kind` · plataformas de conexión |
| Empresas | [`enums/empresas.md`](enums/empresas.md) | `isolation_strategy` · `company_status` · `company_deactivation_reason` · `access_key_status` · `access_key_delivery_status` |
| Roles y permisos | [`enums/roles-permisos.md`](enums/roles-permisos.md) | `user_role` |
| Documentos | [`enums/documentos.md`](enums/documentos.md) | `document_version_status` · `my_document_status` |
| Notificaciones | [`enums/notificaciones.md`](enums/notificaciones.md) | `notification_type` · `notification_audience` · `notification_read_filter` · `notification_target_kind` · `notification_digest_status` |
| Gestión de usuarios | [`enums/gestion-usuarios.md`](enums/gestion-usuarios.md) | `user_status` · `group_kind` · `assignment` · `role_in_control` · `work_bucket` |
| Catálogo maestro | [`enums/catalogo-maestro.md`](enums/catalogo-maestro.md) | `dimension` · `control_type` · `periodicity` · `requirement_type` · `test_type` · `test_primary_source` · `test_level` · `test_automation` · `check_role` · `cause_origin` · `cause_type` · `document_type` · `document_origin` · `document_acceptance` · `evaluation_parameter_unit` · `window_mode` · `framework_type` · `mapping_confidence` |
| Control técnico | [`enums/control-tecnico.md`](enums/control-tecnico.md) | `readiness` · `readiness_area` · `schedule_frequency` · `execution_status` · `severity` |
| Integraciones | [`enums/integraciones.md`](enums/integraciones.md) | `integration_purpose` · `integration_status` · `integration_security_topic` · `integration_permission_access` |
| Cumplimiento | [`enums/cumplimiento.md`](enums/cumplimiento.md) | **v2:** `manual_evidence_state` · `automatic_evidence_state` · `check_result` · `test_status` · `requirement_status` · `control_level` · `control_management_state` · `control_approval_step` · `control_approval_decision` · `manual_test_result_value` · *(MD-529)* `change_request_status` · `requirement_applicability` · `management_action` · `management_history_type` · `work_decision_kind` · `document_version_status` · `risk_zone` · *(MD-502)* `gap_priority` · **v1:** `control_type` · `control_approval` · `control_change_type` · `control_change_status` · `exclusion_status` · `audit_observation_type` · `audit_observation_status` · `loss_type` · `risk_criterion` · `risk_level` · `failure_category` · `evaluation_origin` · `risk_treatment_decision` · `evidence_state` · `asset_result` · `test_state` · `control_state` · `rollup_state` · `cause_state` · `risk_state` · `residual_acceptance` · `assessor_role` · `cause_control_effect` |

## Reglas que valen para varios grupos

### De dónde salen los enums que no vienen del Excel
Estos enums **no salen del Excel** (no trae opciones para ellos): son decisión de desarrollo del 2026-09-29, D34 en `datos/decisiones/catalogo-maestro/README.md`. Donde había una fuente (los contratos, el conector de CIS) se respetó. Si el comité entrega otros valores, gana el comité.

### Qué listas sirve `GET /v1/catalogs/{name}`
Actualizado el 2026-11-12 (MD-211: `integration_purpose` e `integration_status`; antes, D96 retiró `assessor_role` y `assessment_verdict`). Además de las del onboarding, sirve las de cumplimiento, las del catálogo maestro y las de integraciones (`integration_purpose` · `integration_status`):

`risk_criterion` · `failure_category` · `risk_level` · `risk_treatment_decision` · `responsible_type` · `cause_control_effect` · `exclusion_status` · `audit_observation_type` · `audit_observation_status` · `dimension` · `control_type` · `catalog_origin` · `loss_type` · `risk_scale` (valores `1`–`5`, de la matriz 5×5) · `gcp_connection_scope` · `gcp_setup_method` (con `description`, `availability` y `tags`, D114). `connection_method` también devuelve esos tres campos

La respuesta es la de siempre (`value` + `label` según `Accept-Language`), en el orden del enum. **Ningún cliente escribe estas listas a mano**: la fuente es el enum de la base y la etiqueta, `i18n/<idioma>/catalogs.json` del backend.

Los valores que usan los contratos de `contracts/cumplimiento/` están en [`enums/cumplimiento.md`](enums/cumplimiento.md); los de las tablas ya existentes (`dimension`, `trust_criterion`, `risk_criterion`, `risk_level`, `failure_category`, `risk_treatment_decision`, `audit_observation_*`, `control_change_*`) no se repiten.
