# Enums — Notificaciones

> Índice de todos los enums: [`enums.md`](../enums.md). Por el cable viaja el **valor**; la etiqueta (es/en) la resuelve i18n. Formato: [`README.md`](../README.md#formato-de-un-enum). Contrato: [`notificaciones.md`](../notificaciones.md).

## `notification_type`
**Columna:** `notifications.type` · **Quién lo fija:** el sistema, al emitir · **Lo sirve:** `GET /v1/catalogs/notification_type` · **Destinatarios:** D138, D151

### Cadena del control

| Valor | Etiqueta (es) | Etiqueta (en) | Recibe | Qué significa |
|---|---|---|---|---|
| `window_due_soon` | Ventana por vencer | Window closing soon | `executor` · `owner` | Llegó el aviso previo (PR-06, `alert_at`) y alguna prueba no tiene evidencia válida |
| `window_expired` | Ventana vencida | Window expired | `executor` · `owner` · `company_admin` | La ventana cerró sin evidencia: el requisito pasa a Vencido (G-06) |
| `control_assigned` | Control asignado | Control assigned | `assignee` | Te asignaron como dueño o ejecutor de un control |
| `evidence_approved` | Evidencia validada | Evidence approved | `uploader` · `owner` | Se validó una evidencia que subiste o de tu control |
| `evidence_rejected` | Evidencia rechazada | Evidence rejected | `uploader` · `owner` | Se rechazó una evidencia que subiste o de tu control |
| `observation_created` | Observación del auditor | Auditor observation | `owner` · `executor` | Reservado |
| `direct_check_failed` | Verificación automática en falla | Automated check failing | `executor` · `owner` · `company_admin` | Un check Directo pasó a falla en un activo (D153) |
| `check_parameters_changed` | Cambio de parametrización | Parameters changed | `company_admin` | Monkey cambió un parámetro de evaluación PR-n; solo a los administradores (D153) |
| `automatic_evidence_stale` | Evidencia automática desactualizada | Automated evidence out of date | `executor` · `owner` | La última recolección de un activo superó PR-05 (D153) |
| `control_pending_approval` | Control por aprobar | Control awaiting approval | `owner` | Reservado (MD-504) |
| `control_owner_approved` | Control aprobado por el responsable | Control approved by owner | `company_admin` | Reservado (MD-504) |
| `control_returned` | Control devuelto | Control returned | `executor` · `owner` | Reservado (MD-504) |

### Documentos (reservados, MD-506)

| Valor | Etiqueta (es) | Etiqueta (en) | Recibe |
|---|---|---|---|
| `document_assigned` | Documento asignado | Document assigned | `assignee` |
| `document_acceptance_reminder` | Documento por aceptar | Document awaiting acceptance | `document_pending_acceptor` |
| `document_approval_requested` | Documento por aprobar | Document awaiting approval | `document_approver` |
| `document_renewal_due` | Documento por renovar | Document due for renewal | `document_owner` |

### Plataforma (reservado, DT-83)

| Valor | Etiqueta (es) | Etiqueta (en) | Recibe |
|---|---|---|---|
| `company_purge_upcoming` | Empresa por borrarse | Company about to be deleted | `monkey_admins` |

## `notification_audience`
**No es columna:** la regla con que el emisor resuelve las personas.

| Valor | Etiqueta (es) | Etiqueta (en) | Quién es |
|---|---|---|---|
| `executor` | Ejecutor | Executor | `executor_id` del control; si es nulo, el dueño |
| `owner` | Dueño | Owner | `owner_id` del control; si el control está «Sin asignar», los administradores |
| `company_admin` | Administrador de la empresa | Company administrator | Todo `admin_empresa` `active` |
| `assignee` | Persona asignada | Assignee | Quien recibe la asignación |
| `uploader` | Quien subió | Uploader | Autor de la entrega de evidencia |
| `document_approver` · `document_pending_acceptor` · `document_owner` | — | — | Reservados (MD-506) |
| `monkey_admins` | Administradores de Monkey | Monkey administrators | Todo `admin_monkey` `active` |

> Solo cuentas `active`. Una persona con dos papeles recibe un aviso. Quien causó el hecho no se avisa a sí mismo.

## `notification_read_filter`
**No es columna:** el parámetro `status` de `GET /v1/me/notifications`.

| Valor | Etiqueta (es) | Etiqueta (en) |
|---|---|---|
| `all` | Todos | All |
| `unread` | No leídos | Unread |
| `read` | Leídos | Read |

## `notification_target_kind`
**Columna:** `notifications.target_kind` · `service` es el aviso agrupado de controles «Sin asignar» de un servicio (`control = null`, `due_at = null`)

| Valor | Etiqueta (es) | Etiqueta (en) |
|---|---|---|
| `control` | Control | Control |
| `service` | Servicio | Service |
| `document` | Documento | Document |
| `company` | Empresa | Company |

## `notification_digest_status`
**Columna:** `notification_digests.status` · **No viaja por la API.**

| Valor | Qué significa |
|---|---|
| `sending` | Una réplica lo tomó y lo está enviando |
| `sent` | El servicio de correo lo aceptó |
| `failed` | No salió; se reintenta el mismo día (máximo 3) |
| `skipped` | No había nada que enviar |
