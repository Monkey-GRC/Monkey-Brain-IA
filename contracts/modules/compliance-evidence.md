---
id: contracts-compliance-evidence
name: Contrato — Cumplimiento, evidencias
description: Qué evidencia exige cada control, subir un archivo con su huella y versión, verlo o descargarlo con enlace firmado, y la evidencia de un test manual.
type: contract
---

# Cumplimiento — evidencias

**Estado: ACORDADO (2026-10-17; D84 y D85; ajustado por D88 el 2026-10-22); construido: listar, subir, versiones y descargar (MD-126), la revisión (MD-127) y agregar una evidencia propia (D88).** Ver `conventions.md` (sección «Cumplimiento») y `enums.md`. Tickets: MD-126 y MD-127 (la revisión por consultor y auditor, que está en `compliance-audit.md`).

**Qué es.** Cada control exige evidencias (`evidence_requirements`, que nacen de las plantillas del catálogo al clonar). Quien responde sube un archivo (`evidence_submissions`); **la empresa solo aporta** (D84): lo revisan el consultor y el auditor, cada uno por su lado.
**Entidades:** `evidence_requirements`, `evidence_submissions`, `evidence_reviews` (`modelo-datos.md` §7.3). **App:** Monkey Platform. En las pantallas (D80): lo que el control exige es la **evidencia requerida** y lo que se sube para cumplirlo es la **evidencia entregada** (una versión por subida). «Prueba» no se usa para esto: en el cerebro una prueba es el test que ejecuta el motor. La evidencia se aporta **desde el propio control** (su panel de detalle) y también desde la pestaña Evidencias, que reúne lo que le toca a cada persona; ambas usan los mismos endpoints.

**La empresa no aprueba ni rechaza (D84).** Quien sube una evidencia no la valida: la **revisan el consultor y el auditor**, cada uno la suya y en su momento (consultoría prepara, auditoría certifica). La revisión
(los seis atributos y `review`) está en `compliance-audit.md`; este contrato solo muestra su resultado como `evidence_state`. La IA puede sugerir; **nunca aprueba ni cierra nada**.

## Quién puede qué

| Acción | `admin_empresa` | `funcional` | `consultor` | `auditor` |
|---|---|---|---|---|
| Ver requerimientos y entregas | todos | **solo los de sus acciones asignadas** | todos | todos |
| Subir un archivo | ✓ | solo de lo asignado | `403` | `403` |
| Ver o descargar el archivo | ✓ | solo de lo asignado | ✓ | ✓ |
| Revisar una entrega (`compliance-audit.md`) | `403` | `403` | ✓ la suya | ✓ la suya |
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
        "test": null,
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
            "submitted_by": { "id": "a1b2…", "name": "Laura", "last_name": "Gómez" },
            "submitted_at": "2026-10-14T17:05:12Z",
            "evidence_state": "pending",
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
- `test` (D88): `{ "id", "code", "display_name" }` si la evidencia es de **esa** prueba del control (la que la persona sube bajo la prueba); `null` si es un documento que el catálogo **sugiere** para el control sin decir a qué prueba sirve (no cuenta para ninguna). `display_name` es el nombre neutro (D70).
- `version` es un entero que crece por requerimiento; el modelo lo guarda como texto. **Una versión nueva nunca pisa la anterior.**
- `ai` es `null` o `{ "is_ai_generated": true, "ai_confidence": 0.82, "verdict": "…" }`: una sugerencia, siempre marcada.
- `evidence_state` (`enums.md`) lo **deriva el servidor** de la revisión; nadie lo escribe. Para la empresa, el consultor y `admin_empresa` sale de la **revisión del consultor** (la que consume el motor, D84); para el auditor, de la **suya**. Sin ninguna revisión humana
  es `pending`, o `in_review` si la IA ya la sugirió.
- Con `?view=technical` cada entrega agrega `technical: { "review": "ai_prevalidated", "attributes": { "type_ok": true, "period_ok": true, "valid_ok": null, "approved_ok": true, "signed_ok": null, "content_ok": true }, "note": null, "reviewed_by": null, "reviewed_at": null }`.
  Es **la revisión de quien pregunta**: la del consultor para `admin_empresa` y consultor, la del auditor para el auditor. **El auditor nunca recibe la del consultor ni rastro de que exista, y el consultor no recibe la del auditor** (D84, SEG-61).

## `POST /v1/evidence-requirements/{id}/submissions` — subir

`multipart/form-data`, el binario en el campo `file`. **Tipos permitidos: PDF, DOCX, XLSX, PNG y JPG, hasta 25 MB** (SEG-60). Se valida el **contenido** del archivo (su firma), no solo el tipo que declara el navegador ni la extensión.
Se calcula su huella **SHA-256** sobre el archivo recibido y se guarda con el origen, la fecha, el responsable y la versión; nace sin revisión (`evidence_state: "pending"`).

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
    "submitted_by": { "id": "a1b2…", "name": "Laura", "last_name": "Gómez" },
    "submitted_at": "2026-10-14T17:05:12Z",
    "evidence_state": "pending",
    "ai": null
  }
}
```

`GET /v1/evidence-requirements/{id}/submissions` lista todas las versiones (paginada, la más reciente primero).

## `GET /v1/evidence-submissions/{id}/download`

El archivo **nunca es público**. Devuelve un enlace temporal de 5 minutos. Parámetro `disposition`: `attachment` (por defecto, el navegador lo descarga) o `inline` (la pantalla lo **muestra** sin descargarlo, por ejemplo en un visor).

`GET /v1/evidence-submissions/b310…/download?disposition=inline`

```json
{ "statusCode": 200, "message": "evidence.download", "data": { "url": "https://storage.…/…?X-Signature=…", "file_name": "politica-accesos-v2.pdf", "file_type": "application/pdf", "disposition": "inline", "expires_in": 300 } }
```

- `inline` solo para **PDF, PNG y JPG**; con DOCX o XLSX responde `422` (`disposition.not_supported`) y la pantalla ofrece la descarga.
- El enlace sale con `Content-Disposition` y `Content-Type` ya fijados al firmarlo, y se firma por entrega: el cliente no puede cambiarlos.
- Pasados los 5 minutos el enlace deja de funcionar; se pide otro. **Cada enlace generado se registra**, también los `inline`.

## `GET /v1/controls/{control_id}/tests/{test_id}/evidence` — la evidencia de un test manual (D85)

Lo que se subió para un test **manual o documental**, para mostrarlo en el test del control.

- **Test documental (`dimension: "policy"`, D88):** solo el requerimiento **de esa prueba en este control** (`test.id` igual al test). Su estado es el de este control; `shared_with` va vacío. Se sube con `POST /v1/controls/{control_id}/tests/{test_id}/evidence` (abajo) y vale para esta prueba en este control.
- **Otro test manual (D85, RN-13):** un test puede estar en varios controles y su veredicto vale en todos; por eso salen los requerimientos de **todos los controles del servicio que llevan el test**, con la dimensión del test, y cada uno dice de qué control es. Vale para el test en todos esos controles.

```json
{
  "statusCode": 200,
  "message": "evidence.test_list",
  "data": {
    "test_id": "21ab…",
    "shared_with": [ { "id": "3f1c…", "code": "IAC-12" }, { "id": "77a2…", "code": "IAC-4" } ],
    "items": [
      {
        "id": "e07a…",
        "code": "EV-IAC12-01",
        "control": { "id": "3f1c…", "code": "IAC-12" },
        "description": "Política de control de accesos aprobada",
        "dimension": "policy",
        "responsible": { "id": "c9d0…", "type": "compliance", "person_name": "Marta Ruiz" },
        "submissions": [ { "id": "b310…", "version": 2, "file_name": "politica-accesos-v2.pdf", "file_type": "application/pdf", "evidence_state": "pending" } ]
      }
    ]
  }
}
```

- Cada `submissions[i]` trae los campos de la lista de evidencias (archivo, versión, huella, `evidence_state`, `ai`).
- `shared_with` son los **otros** controles del servicio que llevan el test (vacío si es solo de este), para que la pantalla avise «este test también aplica a…» (D85).
- Un `funcional` ve solo los requerimientos de controles que tiene asignados (los demás se omiten, no fallan).
- Si el test no es manual ni documental, o el control no lo lleva, `404`.

## `POST /v1/controls/{control_id}/tests/{test_id}/evidence` — subir la evidencia de una prueba (D88)

La persona lee lo que pide la prueba y sube su documento **bajo ella**, en un solo paso; el consultor lo revisa después (D84). `multipart/form-data`, campo `file`; mismos tipos y tope que la subida de un requerimiento (PDF, DOCX, XLSX, PNG y JPG, 25 MB, SEG-60). Suben `admin_empresa` y el `funcional` dueño del control.

- **La primera entrega crea el lugar de esa prueba** en el control (un requerimiento propio, `origin: "own"`, con `test_id` = la prueba, `description` = el nombre neutro de la prueba y código `EV-<control>-NN`); las siguientes son **versiones nuevas** del mismo lugar. Con el control bloqueado, dos primeras entregas a la vez crean un solo lugar.
- El archivo se comprueba **antes** de crear el lugar: uno rechazado no deja un requerimiento vacío.
- La prueba debe ser documental (`dimension: "policy"`) y del control: si el control no la lleva, `404`; si no es documental, `422` (`test.not_documentary`). Un control dado de baja, `409 CONTROL_RETIRED`.
- Responde `201` con la entrega (`requirement_id` del lugar de esa prueba). **Subir no cumple la prueba**: queda en revisión hasta que el consultor valide la evidencia.

## Requerimientos

| Endpoint | Cuerpo | Respuesta |
|---|---|---|
| `PATCH /v1/evidence-requirements/{id}` | `{ "responsible_id": "c9d0…" }` (un cargo; `null` lo deja sin responsable). En uno **propio** también `description` | `200` el requerimiento |
| `POST /v1/controls/{id}/evidence-requirements` | `{ "description": "Acta de la revisión", "dimension": "policy", "test_id": "21ab…" }` (`test_id` opcional) | `201` el requerimiento, `origin: "own"` |
| `DELETE /v1/evidence-requirements/{id}` | — | `204` |

Solo se quitan requerimientos **propios** y **sin entregas**: uno del catálogo o uno con histórico no se borra.

**`test_id` (D88)** hace que la evidencia sea de **una prueba concreta** de ese control. Debe ser una prueba **documental** (`dimension: "policy"`) que el control lleve; si no, `422` (`test.not_documentary`, `test.not_in_control`). Sin `test_id`, el requerimiento no cuenta para ninguna prueba. `code` y `sequence` los pone el servidor (`EV-<código del control>-NN`).
La pantalla **no usa** este endpoint: sube la evidencia de cada prueba con `POST /v1/controls/{control_id}/tests/{test_id}/evidence`, que crea el lugar solo. Existe para quien quiera nombrar un documento propio.

## Errores

| HTTP | `error.code` | Cuándo |
|---|---|---|
| 403 | `FORBIDDEN` | El rol no puede; el `funcional` no tiene asignada la acción |
| 404 | `NOT_FOUND` | El requerimiento, la entrega o el cargo no existen para esta empresa |
| 409 | `REQUIREMENT_NOT_REMOVABLE` | Es del catálogo o ya tiene entregas |
| 409 | `CONTROL_RETIRED` | Subir evidencia a un control dado de baja |
| 409 | `EVIDENCE_VERSION_CONFLICT` | Dos subidas a la vez pidieron la misma versión; se reintenta (no debería verse: el servidor las ordena) |
| 413 | `FILE_TOO_LARGE` | El archivo pasa del máximo |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Tipo no permitido o contenido que no coincide con el declarado |
| 422 | `FILE_REQUIRED` | El multipart no trae `file` o viene vacío |
| 404 | `NOT_FOUND` | (en `POST …/tests/{test_id}/evidence`) el control no lleva esa prueba |
| 422 | `VALIDATION_FAILED` | Campos: `enum.invalid`, `dimension.not_in_control`, `test.not_documentary`, `test.not_in_control`, `disposition.not_supported` (`inline` con un tipo que no se muestra en pantalla) |
| 503 | `STORAGE_UNAVAILABLE` | El almacenamiento privado no está configurado |

Claves i18n: `evidence.list`, `evidence.test_list`, `evidence.submission_list`, `evidence.submitted`, `evidence.download`, `evidence.version_conflict`, `evidence_requirement.updated`, `file.required`, `file.too_large`, `file.unsupported_type`, `file.storage_unavailable`.

## Ejemplos de error

Todos con el mismo sobre (`conventions.md`); `message` es la clave i18n del error.

**`422` — ver en pantalla un archivo que no se puede mostrar**

```json
{
  "statusCode": 422,
  "message": "validation.failed",
  "data": null,
  "error": {
    "code": "VALIDATION_FAILED",
    "fields": [
      {
        "field": "disposition",
        "code": "disposition.not_supported",
        "message": "Este tipo de archivo no se puede ver en pantalla; descárgalo."
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

## Auditoría

| `action` | Cuándo |
|---|---|
| `evidence.submit` | se sube una entrega (con la huella, nunca el contenido) |
| `evidence.download` | se genera un enlace de descarga o de vista (`disposition` en el detalle; nunca la URL firmada) |
| `evidence_requirement.update` · `.create` · `.delete` | cambia un requerimiento |

## Estado de implementación

**Construido: MD-126** (2026-10-18): `GET /v1/controls/{id}/evidence`, `POST` y `GET /v1/evidence-requirements/{id}/submissions` y `GET /v1/evidence-submissions/{id}/download`. Lo que el contrato no dice y el código hace:

- **Versión.** Se calcula dentro de la transacción, bloqueando la fila del requerimiento (`select … for update`); un índice único `(requerimiento, versión)` es la red de seguridad. En la tabla es texto (`"1"`, `"2"`…) y se ordena como número. Tres subidas a la vez reciben tres versiones distintas.
- **Una entrega es histórico.** La app (`monkey_app`) no tiene `UPDATE` ni `DELETE` sobre `evidence_submissions` (`REVOKE` en la migración `20261018100000_evidence_submissions_provide_only`): solo inserta y lee, como el rastro de auditoría.
- **Orden al subir.** Primero se comprueba el requerimiento y a quién le toca (`404`/`403`/`409`), luego el contenido del archivo (SEG-60), luego se guarda en el bucket y por último se inserta la fila con su rastro en la misma transacción. Si la base o el rastro fallan, el objeto se borra del bucket.
- **La llave del objeto no sale.** Es `<empresa>/services/<servicio>/evidence/<requerimiento>/<uuid>/<nombre>`; `file_name` es su último tramo (el nombre ya limpio: sin acentos ni espacios). `storage_location` guarda `s3`.
- **`evidence_state`** (MD-127, 2026-10-22). Sale de la revisión de quien pregunta (`evidence_reviews`): la del consultor para la empresa y el consultor, la del auditor para el auditor; **la base solo devuelve la del rol que pregunta** (SEG-61). Sin revisión es `pending` (o `in_review` si la IA ya sugirió). En `?view=technical` el bloque trae `review`, `attributes`, `note`, `reviewed_by` y `reviewed_at` de esa revisión; sin ninguna, todo `pending_review` y `null`.
- **Subir por prueba (D88, 2026-10-22).** `POST /v1/controls/{id}/tests/{test_id}/evidence` busca el requerimiento de esa prueba en el control (lo crea en la primera entrega, con el control bloqueado) y sube el archivo como su versión siguiente. Rastro: `evidence_requirement.create` solo si lo creó, y `evidence.submit`.
- **Requerimientos propios (D88, 2026-10-22).** `POST /v1/controls/{id}/evidence-requirements` (solo `admin_empresa`) crea un requerimiento `origin: "own"` con código `EV-<código del control>-NN` y la posición siguiente, calculados con el control bloqueado (dos altas a la vez no chocan). Valida `dimension.not_in_control`, `test.not_in_control` y `test.not_documentary`, y copia la vigencia que ya usa el servicio. Cómo la revisión de una evidencia mueve el estado del control está en `compliance-audit.md` y en `modelo/09-calculo-cumplimiento.md`.
- **`ai`.** `ai_confidence` va `null`: la confianza no se guarda todavía.
- **Descarga.** Genera el enlace (5 minutos) y lo registra en el rastro **de mejor esfuerzo**, sin la URL firmada; no hay un cambio de datos con el que ser atómico. Si no hay almacenamiento responde `503` y no registra una descarga que no ocurrió.
- **Tipos y tamaño.** PDF, DOCX, XLSX, PNG y JPG, hasta 25 MB. Un DOCX o un XLSX se reconoce mirando el directorio central del zip (`[Content_Types].xml` y `word/` o `xl/`); un zip cualquiera renombrado se rechaza con `415`.
- **Pruebas.** Unitaria del validador y e2e `test/cumplimiento/evidencias.e2e-spec.ts` (almacenamiento en memoria); y `test/almacenamiento/evidencia.e2e-spec.ts` contra un S3 real, opcional como la de la Descripción del Sistema.
- **Sin construir:** el modo `?disposition=inline`, la lista por test (MD-177; la pantalla ya agrupa por prueba con `GET /v1/controls/{id}/evidence` y el `test` de cada requerimiento) y, de la gestión de requerimientos, cambiar el responsable (`PATCH`) y quitar uno propio (`DELETE`).

## Preguntas abiertas

- Las 89 plantillas del catálogo llegan **como sugerencia** (`test: null`, no cuentan para ninguna prueba) porque el Excel no dice a qué prueba sirve cada documento; asignarlas es contenido de catálogo (D88, `DT-76`).
- Los tipos permitidos y el tope de 25 MB están **confirmados** (2026-10-17, SEG-60).
