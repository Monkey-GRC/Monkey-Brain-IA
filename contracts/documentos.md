---
id: contracts-documents
name: Contrato — Documentos (corte mínimo)
description: Corte mínimo de Documentos para el colaborador (MD-503, de MD-506/507) — listar los documentos de la empresa, publicar una versión con aprobación importada, asignarla a personas, «Mis documentos», ver el archivo y aceptarlo.
type: contract
---

# Documentos — corte mínimo

| | |
|---|---|
| **Estado** | **Construido (MD-503, 2026-11-25)** (D133, D136 y D152; corte mínimo de MD-506/MD-507). El resto del módulo sigue en MD-506/MD-507 |
| **App / entidades** | Monkey Platform · `company_documents`, `document_versions`, `document_assignments`, `document_acceptances` (`modelo-datos.md` §11) · enums: [`enums/documentos.md`](enums/documentos.md) y `document_type`, `document_origin`, `document_acceptance` ([`enums/catalogo-maestro.md`](enums/catalogo-maestro.md)) |
| **Convenciones** | [`conventions.md`](conventions.md) |

**Qué es.** Cada empresa tiene los documentos del catálogo vinculados a los controles de sus marcos contratados, **uno por documento y por empresa**. El `admin_empresa` publica la versión vigente como **aprobación importada** (D133 punto 5): sube el archivo y declara quién lo aprobó y cuándo. Luego la **asigna a personas**, que la ven en **«Mis documentos»** y la **aceptan**. La aceptación es un registro **inmutable** con la fecha, la versión y la huella del archivo (SEG-88).

## Índice de endpoints

| Método | Ruta | Quién | Para qué |
|---|---|---|---|
| `GET` | [`/v1/documents`](#get-v1documents--listar-los-documentos-de-la-empresa) | `admin_empresa` · `auditor` (solo lectura) | Listar los documentos de la empresa |
| `GET` | [`/v1/documents/{id}`](#get-v1documentsid--detalle) | `admin_empresa` · `auditor` | Detalle: versiones y a quién se asignó |
| `POST` | [`/v1/documents/{id}/versions`](#post-v1documentsidversions--publicar-una-versión-importada) | `admin_empresa` | Publicar la versión vigente (aprobación importada) |
| `GET` | [`/v1/documents/{id}/versions/{version_id}/file`](#get-v1documentsidversionsversion_idfile--ver-o-descargar) | `admin_empresa` · `auditor` · asignados | Enlace firmado para ver o descargar |
| `POST` | [`/v1/documents/{id}/assignments`](#post-v1documentsidassignments--asignar-a-personas) | `admin_empresa` | Asignar a personas (en lote) |
| `DELETE` | `/v1/documents/{id}/assignments/{user_id}` | `admin_empresa` | Quitar una asignación (`204` sin cuerpo; `404` si el documento o la asignación vigente no existen; marca `revoked_at`, conserva las aceptaciones; se puede volver a asignar con plazo nuevo) |
| `GET` | [`/v1/me/documents`](#get-v1medocuments--mis-documentos) | `admin_empresa` · `responsable` · `delegado` · `colaborador` | Lo que me asignaron |
| `POST` | [`/v1/documents/{id}/acceptance`](#post-v1documentsidacceptance--aceptar) | Los mismos cuatro, si está asignado | Aceptar la versión vigente |

## Quién puede qué

| Acción | `admin_empresa` | `responsable` | `delegado` | `colaborador` | `auditor` | `admin_monkey` |
|---|---|---|---|---|---|---|
| Listar y ver el detalle | ✓ | `403` (los de sus controles: MD-506) | `403` | `403` | ✓ solo lectura | `403` (MD-146) |
| Publicar una versión importada | ✓ | `403` | `403` | `403` | `403` | `403` |
| Asignar o quitar | ✓ | `403` | `403` | `403` | `403` | `403` |
| Mis documentos | ✓ | ✓ | ✓ | ✓ | `403` (no acepta, D133) | `403` |
| Ver el archivo de la versión vigente | ✓ | ✓ si asignado | ✓ si asignado | ✓ si asignado | ✓ | `403` |
| Aceptar | ✓ si asignado | ✓ si asignado | ✓ si asignado | ✓ si asignado | `403` | `403` |

> Un documento de otra empresa es `404`; uno de la propia empresa que no está asignado a quien lo pide es `403` (`conventions.md`).

### GET /v1/documents — Listar los documentos de la empresa

| | |
|---|---|
| **Quién** | `admin_empresa` · `auditor` |
| **Éxito** | `200`, paginada (mensaje `document.list`) |
| **Errores** | `403` · `422` |

**Parámetros:** `page`, `page_size`, `sort` (`code` por omisión, `name`, `-updated_at`), `type` (`document_type`), `has_current_version` (boolean), `q` (código o nombre, sin mayúsculas ni acentos).

**Cada ítem:** `id`, `code` (`POL-001`, siempre visible), `name`, `type`, `origin`, `acceptance` (`document_acceptance`), `current_version` (`{ id, number, approved_at, is_imported_approval, file_name, file_type }` \| null) y `assignments` (`{ total, accepted, pending, overdue }`). Los porcentajes no viajan.

### GET /v1/documents/{id} — Detalle

| | |
|---|---|
| **Quién** | `admin_empresa` · `auditor` |
| **Éxito** | `200` (mensaje `document.detail`) |
| **Errores** | `403` · `404` |

Lo del ítem más `description` y `minimum_content` (del catálogo); `versions[]` (`{ id, number, status, approved_at, is_imported_approval, imported_approval: { approvers: [{ name, role_label }], approved_at, note }, file_name, file_type, file_size, integrity_hash, created_by, created_at }`) y `assignees[]` (`{ user: { id, name, last_name, role }, assigned_at, due_at, status, accepted_version_number, accepted_at }`). Mensaje `document.detail`.

> `created_by` es `{ id, name, last_name }`, con `name` y `last_name` nulos si la cuenta no los tiene. `approved_at` es una **fecha sin hora** (`2026-11-10`); `assigned_at`, `due_at`, `accepted_at` y `created_at` llevan hora (ISO 8601 UTC). `assignees[].status` es `null` cuando el documento no requiere aceptación (`acceptance = not_required`): esa asignación **no cuenta** en `pending` ni en `overdue`.

### POST /v1/documents/{id}/versions — Publicar una versión importada

| | |
|---|---|
| **Quién** | `admin_empresa` |
| **Éxito** | `201` con la versión (`status: current`, `number` = anterior + 1, `is_imported_approval: true`); mensaje `document.version_imported` |
| **Errores** | `403` · `404` · `413 FILE_TOO_LARGE` · `415 UNSUPPORTED_MEDIA_TYPE` · `422 FILE_REQUIRED` · `422 VALIDATION_FAILED` (`approved_at:approved_at.future`, `approvers:array.min`, `approvers:array.max`, `approvers:array.invalid`, `approvers[0].name:required` · `string.max` · `string.invalid`, `approvers[0].<campo>:field.not_allowed`, `note:string.max`) · `409 DOCUMENT_EXTERNAL` |

#### Request (`multipart/form-data`)
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `file` | archivo | sí | PDF, DOCX, PNG o JPG, hasta 25 MB; se valida el **contenido** (SEG-60) y se guarda su huella SHA-256 |
| `approved_at` | date | sí | No puede ser futura |
| `approvers` | texto JSON `[{ "name", "role_label" }]` | sí, 1 a 3 | Quién lo aprobó fuera de Monkey; `name` y `role_label` hasta 100 caracteres. **Texto**: puede no tener cuenta (D152). Un multipart no trae objetos: va como **campo de texto con JSON**; si no es JSON válido, `approvers:array.invalid` |
| `note` | string | no | Máx. 500. Referencia del acta |

> La versión anterior queda `archived` y nunca se borra. **Una versión nueva pide aceptar otra vez** a todos los asignados (D152).

### GET /v1/documents/{id}/versions/{version_id}/file — Ver o descargar

| | |
|---|---|
| **Quién** | `admin_empresa` · `auditor` · asignados |
| **Éxito** | `200` (mensaje `document.download`) |
| **Errores** | `403` · `404` · `422` · `503 STORAGE_UNAVAILABLE` |

`?disposition=inline|attachment`. `200` `{ url, file_name, file_type, disposition, expires_in }`, igual que la descarga de evidencia (enlace firmado de 5 min, SEG-59). Errores: `403` (no asignado, o una versión que no es la vigente ni una que aceptó) · `404` · `422 VALIDATION_FAILED` con `disposition:disposition.not_inline` (DOCX solo se descarga). Deja `document_version.download` **en la misma transacción** que la lectura: sin rastro no hay enlace. Un `403` deja la fila con `result = error` (de mejor esfuerzo).

### POST /v1/documents/{id}/assignments — Asignar a personas

| | |
|---|---|
| **Quién** | `admin_empresa` |
| **Éxito** | `200` `{ "added": n }` (solo las nuevas; repetir no cambia nada); mensaje `document.assigned` |
| **Errores** | `403` · `404` (documento o persona de otra empresa) · `409 DOCUMENT_NOT_PUBLISHED` · `409 ASSIGNEE_NOT_ELIGIBLE` (trae `error.user_ids`, las personas que no pueden recibirlo) · `422` (`array.min`, `array.max`, `array.unique`) |

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `user_ids` | uuid[] | sí | 1 a 200, sin repetir. Cuentas `active` o `pending` con rol `admin_empresa`, `responsable`, `delegado` o `colaborador`. Todo o nada |

> Cada asignación nueva lleva `due_at = assigned_at + PR-14` (días para aceptar, `catalog.evaluation_parameters`), fijado al asignar (D152). Con `acceptance = not_required`, la persona lo ve pero no tiene nada que aceptar.

### GET /v1/me/documents — Mis documentos

| | |
|---|---|
| **Quién** | `admin_empresa` · `responsable` · `delegado` · `colaborador` |
| **Éxito** | `200`, paginada (mensaje `document.mine`); sin asignaciones, lista vacía |
| **Errores** | `403` · `422` |

**Parámetros:** `page`, `page_size`, `status` (`my_document_status`).

**Cada ítem:** `document` (`{ id, code, name, type }`), `version` (`{ id, number, approved_at }`, la vigente), `requires_acceptance`, `status` (`pending` · `accepted` · `overdue`, o `null` si el documento no requiere aceptación; **derivado**: `accepted` si hay aceptación de la versión vigente; si no, `overdue` cuando pasó `due_at`; si no, `pending`), `assigned_at`, `due_at`, `accepted_at`. Orden: `overdue`, `pending`, `accepted`; luego por código.

### POST /v1/documents/{id}/acceptance — Aceptar

| | |
|---|---|
| **Quién** | Quien lo tiene asignado (`admin_empresa`, `responsable`, `delegado` o `colaborador`) |
| **Éxito** | `201` `{ id, document_id, version: { id, number }, accepted_at, integrity_hash }`; mensaje `document.accepted` |
| **Errores** | `403` (no asignado o rol que no acepta) · `404` · `409 DOCUMENT_VERSION_NOT_CURRENT` · `409 DOCUMENT_ALREADY_ACCEPTED` · `409 DOCUMENT_ACCEPTANCE_NOT_REQUIRED` |

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `version_id` | uuid | sí | La versión que la persona vio, para no aceptar una que cambió mientras leía |

> No hace falta haber abierto el archivo (D152). Se acepta también fuera de plazo (queda `was_overdue`). Una sola aceptación por persona y versión (índice único, bloqueo de la asignación).

## Reglas de negocio

- **Una sola versión vigente** por documento; las demás `archived`. El archivo de una versión no cambia.
- **Una aceptación no se edita ni se borra** (SEG-88); solo la purga de una empresa archivada la borra (D97).
- **Al clonar** el marco de un servicio nacen los documentos vinculados a sus controles, uno por empresa y sin duplicar, sin versión y con `acceptance` tomado de `suggested_acceptance`.
- El control sigue dependiendo de la evidencia subida por el puente de D139 (`T-DOC` en el motor: DT-125).

## Errores del módulo

| HTTP | Código | Cuándo |
|---|---|---|
| 409 | `DOCUMENT_NOT_PUBLISHED` | Se asigna un documento sin versión vigente |
| 409 | `ASSIGNEE_NOT_ELIGIBLE` | Se asigna a un `auditor`, una cuenta inactiva o un `admin_monkey` |
| 409 | `DOCUMENT_VERSION_NOT_CURRENT` | Se acepta una versión que ya no es la vigente |
| 409 | `DOCUMENT_ALREADY_ACCEPTED` | Ya aceptó esa versión |
| 409 | `DOCUMENT_ACCEPTANCE_NOT_REQUIRED` | El documento no requiere aceptación |
| 409 | `DOCUMENT_EXTERNAL` | Documento externo (fuera del corte) |

Se reutilizan `FILE_REQUIRED`, `FILE_TOO_LARGE`, `UNSUPPORTED_MEDIA_TYPE` y `STORAGE_UNAVAILABLE` (503), con el mismo sentido que en evidencia. **Claves:** `document.list`, `document.detail`, `document.version_imported`, `document.assigned`, `document.unassigned`, `document.mine`, `document.download`, `document.accepted`.

## Auditoría

| `action` | Cuándo | Qué guarda |
|---|---|---|
| `document_version.import` | Se publica una versión | Versión, número, huella, aprobadores y la archivada |
| `document_assignment.add` | Se asigna | Una por persona: usuario y `due_at` |
| `document_assignment.remove` | Se quita una asignación | — |
| `document.accept` | Se acepta | `version_id`, número, huella, `accepted_at`, si fue fuera de plazo |
| `document_version.download` | Se pide el archivo | — (nunca la URL) |

Todas en la misma transacción (D52); los `403`/`409` se registran con `result = error`, de mejor esfuerzo.

## Fuera de este corte (MD-506/MD-507)

Flujo de aprobación y borradores, documentos propios, responsable del documento y lo del `responsable` sobre sus documentos, asignación por grupos, renovación y vencimiento, cambio menor sin nueva aceptación, archivar, documentos externos, `T-DOC` en el motor, avisos de Documentos (reservados en [`notificaciones.md`](notificaciones.md)) y `admin_monkey`.

---

## Estado de implementación

**Construido (MD-503, 2026-11-25).** Backend: `src/features/documents/` (`documents.controller.ts` y `my-documents.controller.ts`); migraciones `20261125090100_documents` y `20261125090200_rls_documents`; i18n en `i18n/{es,en}/document.json`; permisos en `src/common/authorization/permission-matrix.ts` (`documents.history`, `documents.write`, `documents.assign`, `documents.accept`, `documents.view_current`, `documents.mine`). Platform: pantallas de Documentos y «Mis documentos».

- **Pruebas:** `test/documentos/` (`recorrido`, `archivo`, `inmutabilidad` — SEG-88).
- **Hoy `responsable` y `delegado` responden `403` en listar, detalle, publicar y asignar:** en la matriz son «pendiente» hasta MD-506; solo ven y aceptan lo que se les asignó.
