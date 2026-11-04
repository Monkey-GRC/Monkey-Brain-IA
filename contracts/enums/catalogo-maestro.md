# Enums — Catálogo maestro

> Índice de todos los enums: [`enums.md`](../enums.md). Por el cable viaja el **valor**; la etiqueta (es/en) la resuelve i18n. Formato: [`README.md`](../README.md#formato-de-un-enum).

## `dimension`
**Columna:** `control_dimensions.dimension` · **Qué es:** las 5 dimensiones en que se evalúa un control.

| Valor | Etiqueta (es) | Qué significa |
|---|---|---|
| `policy` | Política / Documental | Se resuelve con un documento |
| `server` | Servidor | Servidores, físicos o en nube |
| `database` | Base de datos | Bases de datos |
| `app` | Aplicación | La aplicación del cliente |
| `cloud` | Nube | Servicios gestionados en nube |

## `framework_type`
**Columna:** `frameworks.type` · **En el MVP** solo se usa `attestation`.

| Valor | Etiqueta (es) | Ejemplos |
|---|---|---|
| `attestation` | Informe de auditor | SOC 1, SOC 2 |
| `certification` | Certificación | ISO 27001 |
| `standard` | Estándar | PCI DSS, NIST CSF, CIS |
| `regulation` | Regulación | HIPAA y afines |

## `policy_approval_status`
**Columna:** `policies.approval_status`

| Valor | Etiqueta (es) |
|---|---|
| `draft` | Borrador |
| `pending_approval` | Pendiente de aprobación |
| `approved` | Aprobada |

## `mapping_confidence`
**Columna:** `checks.mapping_confidence` · **Fuente:** valores tomados de `monkey-cis-sync`.

| Valor | Etiqueta (es) | Qué significa |
|---|---|---|
| `confirmed` | Confirmado | |
| `high` | Alta | |
| `medium` | Media | |
| `low` | Baja | Queda para revisión |
