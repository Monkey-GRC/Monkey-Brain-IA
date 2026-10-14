---
id: contracts-compliance-evidence
name: Contrato — Cumplimiento, evidencias
description: Qué evidencia exige cada acción de protección, subir un archivo con su huella y versión, descargarlo con enlace firmado, y aprobarlo o rechazarlo.
type: contract
---

# Cumplimiento — evidencias

**Estado: PROPUESTA (2026-10-14).** Ver `conventions.md` (sección «Cumplimiento») y `enums.md`. Tickets: MD-126, MD-127.

**Qué es.** Cada acción de protección exige evidencias (`evidence_requirements`, que nacen de las plantillas del catálogo al clonar). Quien responde sube un archivo (`evidence_submissions`); el administrador de la empresa lo
aprueba o lo rechaza. **Entidades:** `evidence_requirements`, `evidence_submissions` (`modelo-datos.md` §7.3). **App:** Monkey Platform. En las pantallas: «lo que me toca aportar».

**Dos cosas distintas, no se mezclan.** La **aprobación de la empresa** (`validation_status`: `pending` · `approved` · `rejected`) la da solo `admin_empresa` y es de este contrato. La **validación de la evidencia**
frente al test (los seis atributos y `review`) es otra cosa, de la vista técnica, y está en `compliance-audit.md`. La IA puede sugerir; **nunca aprueba ni cierra nada**.

## Quién puede qué

| Acción | `admin_empresa` | `funcional` | `consultor` | `auditor` |
|---|---|---|---|---|
| Ver requerimientos y entregas | todos | **solo los de sus acciones asignadas** | todos | todos |
| Subir un archivo | ✓ | solo de lo asignado | `403` | `403` |
| Descargar | ✓ | solo de lo asignado | ✓ | ✓ |
| Aprobar o rechazar una entrega | ✓ **solo él** | `403` | `403` | `403` |
| Cambiar el responsable, agregar o quitar un requerimiento propio | ✓ | `403` | `403` | `403` |

## `GET /v1/controls/{id}/evidence`

Los requerimientos de una acción, cada uno con sus entregas (la más reciente primero). Mismas reglas de acceso que el control.

```json
{
  "statusCode": 200,
  "message": "evidence.list",
  "data": {
    "items": [
      {
        "id": "e07a…",
        "code": "EV-IAC12-01",
        "sequence": 1,
        "description": "Política de control de accesos aprobada",
        "dimension": "policy",
        "validity_within_period": "Dentro del período de evaluación",
        "origin": "catalog",
        "responsible": { "id": "c9d0…", "type": "compliance", "person_name": "Marta Ruiz" },
        "submissions": [
          {
            "id": "b310…",
            "version": 2,
            "file_name": "politica-accesos-v2.pdf",
            "file_type": "application/pdf",
            "file_size": 482113,
            "integrity_hash": "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
            "validation_status": "pending",
            "submitted_by": { "id": "a1b2…", "name": "Laura", "last_name": "Gómez" },
            "submitted_at": "2026-10-14T17:05:12Z",
            "approved_by": null,
            "approved_at": null,
            "decision_note": null,
            "ai": null
          }
        ]
      }
    ]
  }
}
```

- `responsible` es un **cargo** (`organization_responsibles`), no una persona con cuenta; viene `null` hasta que el administrador lo asigna (se clona sin responsable).
- `origin`: `catalog` si nació de una plantilla, `own` si la agregó la empresa.
- `version` es un entero que crece por requerimiento; el modelo lo guarda como texto. **Una versión nueva nunca pisa la anterior.**
- `ai` es `null` o `{ "is_ai_generated": true, "ai_confidence": 0.82, "verdict": "…" }`: una sugerencia, siempre marcada.
- Con `?view=technical` cada entrega agrega `technical: { "evidence_state": "in_review", "review": "ai_prevalidated", "attributes": { "type_ok": true, "period_ok": true, "valid_ok": null, "approved_ok": true, "signed_ok": null, "content_ok": true } }`.

## `POST /v1/evidence-requirements/{id}/submissions` — subir

`multipart/form-data`, el binario en el campo `file`. Mismos límites que la Descripción del Sistema (SEG-43): se valida el **contenido** del archivo, no solo el tipo que declara el navegador. Cada entrega nace
`validation_status: "pending"`; se calcula su huella **SHA-256** sobre el archivo recibido y se guarda con el origen, la fecha, el responsable y la versión.

```
POST /v1/evidence-requirements/e07a…/submissions
Content-Type: multipart/form-data; boundary=…

--…
Content-Disposition: form-data; name="file"; filename="politica-accesos-v2.pdf"
Content-Type: application/pdf
…
```

```json
{
  "statusCode": 201,
  "message": "evidence.submitted",
  "data": {
    "id": "b310…",
    "requirement_id": "e07a…",
    "version": 2,
    "file_name": "politica-accesos-v2.pdf",
    "file_type": "application/pdf",
    "file_size": 482113,
    "integrity_hash": "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
    "validation_status": "pending",
    "submitted_by": { "id": "a1b2…", "name": "Laura", "last_name": "Gómez" },
    "submitted_at": "2026-10-14T17:05:12Z",
    "approved_by": null,
    "approved_at": null,
    "decision_note": null,
    "ai": null
  }
}
```

`GET /v1/evidence-requirements/{id}/submissions` lista todas las versiones (paginada, la más reciente primero).

## `GET /v1/evidence-submissions/{id}/download`

El archivo **nunca es público**. Devuelve un enlace temporal de 5 minutos:

```json
{ "statusCode": 200, "message": "evidence.download", "data": { "url": "https://storage.…/…?X-Signature=…", "file_name": "politica-accesos-v2.pdf", "expires_in": 300 } }
```

Pasados los 5 minutos el enlace deja de funcionar; se pide otro. Cada descarga se registra.

## `PATCH /v1/evidence-submissions/{id}` — aprobar o rechazar

Solo `admin_empresa`. Cualquier otro rol, `403`. Sigue el patrón de decisiones de `conventions.md`.

```json
{ "validation_status": "approved" }
```

```json
{ "validation_status": "rejected", "decision_note": "El documento no está firmado por la dirección." }
```

Responde `200` con la entrega (`approved_by`, `approved_at`, `decision_note`). Rechazar **exige** `decision_note`. Una evidencia es válida si cae **dentro del período de evaluación del marco**; no tiene fecha de caducidad propia (C1).

## Requerimientos

| Endpoint | Cuerpo | Respuesta |
|---|---|---|
| `PATCH /v1/evidence-requirements/{id}` | `{ "responsible_id": "c9d0…" }` (un cargo; `null` lo deja sin responsable). En uno **propio** también `description` | `200` el requerimiento |
| `POST /v1/controls/{id}/evidence-requirements` | `{ "description": "Acta de la revisión", "dimension": "policy" }` | `201` el requerimiento, `origin: "own"` |
| `DELETE /v1/evidence-requirements/{id}` | — | `204` |

Solo se quitan requerimientos **propios** y **sin entregas**: uno del catálogo o uno con histórico no se borra.

## Errores

| HTTP | `error.code` | Cuándo |
|---|---|---|
| 403 | `FORBIDDEN` | El rol no puede; el `funcional` no tiene asignada la acción |
| 404 | `NOT_FOUND` | El requerimiento, la entrega o el cargo no existen para esta empresa |
| 409 | `ALREADY_DECIDED` | La entrega ya fue aprobada o rechazada |
| 409 | `REQUIREMENT_NOT_REMOVABLE` | Es del catálogo o ya tiene entregas |
| 413 | `FILE_TOO_LARGE` | El archivo pasa del máximo |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Tipo no permitido o contenido que no coincide con el declarado |
| 422 | `FILE_REQUIRED` | El multipart no trae `file` o viene vacío |
| 422 | `VALIDATION_FAILED` | Campos: `required` (`decision_note` al rechazar), `enum.invalid`, `dimension.not_in_control` |
| 503 | `STORAGE_UNAVAILABLE` | El almacenamiento privado no está configurado |

Claves i18n: `evidence.list`, `evidence.submitted`, `evidence.download`, `evidence.decided`, `evidence_requirement.updated`, `file.required`, `file.too_large`, `file.unsupported_type`, `file.storage_unavailable`.

## Ejemplos de error

Todos con el mismo sobre (`conventions.md`); `message` es la clave i18n del error.

**`422` — rechazar sin motivo**

```json
{
  "statusCode": 422,
  "message": "validation.failed",
  "data": null,
  "error": {
    "code": "VALIDATION_FAILED",
    "fields": [
      {
        "field": "decision_note",
        "code": "required",
        "message": "Indica el motivo del rechazo."
      }
    ]
  }
}
```

**`415` — un tipo de archivo no permitido**

```json
{
  "statusCode": 415,
  "message": "file.unsupported_type",
  "data": null,
  "error": {
    "code": "UNSUPPORTED_MEDIA_TYPE"
  }
}
```

**`409` — la entrega ya fue decidida**

```json
{
  "statusCode": 409,
  "message": "common.already_decided",
  "data": null,
  "error": {
    "code": "ALREADY_DECIDED"
  }
}
```

## Auditoría

| `action` | Cuándo |
|---|---|
| `evidence.submit` | se sube una entrega (con la huella, nunca el contenido) |
| `evidence.download` | se genera un enlace de descarga |
| `evidence.approve` · `evidence.reject` | decide `admin_empresa`; deja además un `compliance_events` |
| `evidence_requirement.update` · `.create` · `.delete` | cambia un requerimiento |

## Preguntas abiertas

- **Tipos permitidos y tamaño máximo**: se propone PDF, DOCX, XLSX, PNG y JPG hasta 25 MB (el tope de SEG-43). El ticket MD-126 dice solo «una lista permitida»; confirmar con el comité.
- **Quién marca los seis atributos y la validación humana** de una evidencia: `P25` (ver `compliance-audit.md`).
