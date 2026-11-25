# Enums — Documentos

> Índice de todos los enums: [`enums.md`](../enums.md). Por el cable viaja el **valor**; la etiqueta (es/en) la resuelve i18n. Formato: [`README.md`](../README.md#formato-de-un-enum). Contrato: [`documentos.md`](../documentos.md). Los enums del documento del catálogo (`document_type`, `document_origin`, `document_acceptance`) están en [`catalogo-maestro.md`](catalogo-maestro.md).

## `document_version_status`
**Columna:** `document_versions.status` (§11). Se crea completo para no migrar el enum después; el corte mínimo (D152) solo usa `current` y `archived`.

| Valor | Etiqueta (es) | Etiqueta (en) |
|---|---|---|
| `draft` | Borrador | Draft |
| `in_approval` | En aprobación | In approval |
| `rejected` | Rechazada | Rejected |
| `approved` | Aprobada | Approved |
| `current` | Vigente | Current |
| `renewal_due` | Por renovar | Renewal due |
| `expired` | Vencida | Expired |
| `archived` | Archivada | Archived |

## `my_document_status`
**No es columna:** se deriva en `GET /v1/me/documents` y en `assignees[].status`. Es `null` cuando el documento no requiere aceptación (`acceptance = not_required`): esa asignación no cuenta como pendiente ni vencida. Lo sirve `GET /v1/catalogs/my_document_status`.

| Valor | Etiqueta (es) | Etiqueta (en) | Qué significa |
|---|---|---|---|
| `pending` | Por aceptar | Pending | Asignado y sin aceptar la versión vigente, dentro del plazo |
| `accepted` | Aceptado | Accepted | Aceptó la versión vigente |
| `overdue` | Vencido | Overdue | Sin aceptar y pasó `due_at` |
