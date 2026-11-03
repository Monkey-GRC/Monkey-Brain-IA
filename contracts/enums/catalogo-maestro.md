# Enums — Catálogo maestro

Los valores de los enums de este módulo. Índice de todos: [`enums.md`](../enums.md). Por el cable viaja el **valor**; la etiqueta la resuelve i18n.

### `dimension` — las 5 dimensiones · `control_dimensions.dimension`

`policy` Política / Documental · `server` Servidor · `database` Base de datos · `app`
Aplicación · `cloud` Nube

### `framework_type` — `frameworks.type` (en el MVP solo se usa `attestation`)
`attestation` Informe de auditor (SOC 1, SOC 2) · `certification` Certificación (ISO 27001) ·
`standard` Estándar (PCI DSS, NIST CSF, CIS) · `regulation` Regulación (HIPAA y afines)

### `policy_approval_status` — `policies.approval_status`
`draft` Borrador · `pending_approval` Pendiente de aprobación · `approved` Aprobada

### `mapping_confidence` — `checks.mapping_confidence`
`confirmed` Confirmado · `high` Alta · `medium` Media · `low` Baja (queda para revisión).
Valores tomados de `monkey-cis-sync`.
