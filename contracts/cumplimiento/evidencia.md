---
id: contracts-compliance-evidence
name: Contrato — Cumplimiento, evidencias
description: Qué evidencia exige cada control, subir un archivo con su huella y versión, verlo o descargarlo con enlace firmado, y la evidencia de un test manual.
type: contract
---

# Cumplimiento — evidencias

> **VF18 (D128): este contrato describe la API construida con el catálogo v1.** Con la VF18 la evidencia se exige **por requisito del control** y por **ventana de vigencia** (D129, D131), y ya no se revisa una por una: **se aprueba el control** (D132). Los documentos pasan a su propio módulo (D133). Se reescribe antes de construir RC-02, RC-07 y RC-08.

| | |
|---|---|
| **Estado** | **ACORDADO**, reescrito por D96 (2026-10-27) y ajustado por D102 (2026-11-03: quién sube, quién revisa y cómo se combinan las revisiones; construido en MD-194). Construido: listar, subir, versiones y descargar (MD-126), la revisión del `admin_empresa` (MD-127, 2026-10-28), la combinación de revisiones del dueño y del `admin_empresa` (MD-194, ver «Estado de implementación») y agregar una evidencia propia (D88) |
| **App** | Monkey Platform |
| **Entidades** | `evidence_requirements`, `evidence_submissions`, `evidence_reviews` (`modelo-datos.md` §7.3) |
| **Tickets** | MD-126, MD-127 · sprint 3: MD-194 (revisión en dos niveles) · MD-208 (la evidencia de un servicio en una petición) |
| **Contexto común** | [`README.md`](README.md) · [`conventions.md`](../conventions.md) (sección «Cumplimiento») · [`enums.md`](../enums.md) |

**Qué es.** Cada control exige evidencias (`evidence_requirements`, que nacen de las plantillas del catálogo al clonar). Quien responde sube un archivo (`evidence_submissions`): lo hace el **ejecutor** del control (un `delegado`), su **dueño** (un `responsable`) o el `admin_empresa` (D102), y lo **revisan** el `responsable` dueño —si no fue quien subió— y el `admin_empresa`.

**En las pantallas (D80):** lo que el control exige es la **evidencia requerida** y lo que se sube para cumplirlo es la **evidencia entregada** (una versión por subida). «Prueba» no se usa para esto: en el cerebro una prueba es el test que ejecuta el motor. La evidencia se aporta **desde el propio control** (su panel de detalle) y también desde la pestaña Evidencias, que reúne lo que le toca a cada persona; ambas usan los mismos endpoints.

## Cómo se revisa (D96, D102)

| Regla | Detalle |
|---|---|
| Quién sube | El ejecutor, el dueño o el `admin_empresa`, siempre sobre un control suyo |
| Quién revisa | **El `responsable` dueño** (cuando subió su delegado) **y el `admin_empresa` puede revisar cualquiera**, aprobándola o rechazándola con motivo |
| Una revisión por rol | **Cada entrega admite a lo sumo una revisión por rol** |
| Cómo se combinan | **Si revisaron los dos, deben haber aprobado los dos; cualquier rechazo gana. Si revisó solo uno y aprobó, está aprobada.** Sin revisión, pendiente |
| Revisar lo propio | Nadie revisa lo que subió él mismo, **salvo el `admin_empresa` cuando es dueño del control y también quien sube** (D132: su aprobación es la final) |
| `auditor` | La lee y no la revisa |
| IA | Puede sugerir; **nunca aprueba ni cierra nada** |

La revisión (los seis atributos y `review`) está en [`PUT …/review`](#put-v1evidence-submissionsidreview--revisar-una-evidencia); su resultado se muestra aquí como `evidence_state`.

## Quién puede qué

| Acción | `admin_empresa` | `responsable` | `delegado` | `auditor` |
|---|---|---|---|---|
| Ver requerimientos y entregas | todos | **solo los de sus controles** | solo los de los controles que ejecuta | todos |
| Subir un archivo | ✓ | ✓ de sus controles | ✓ de los que ejecuta | `403` |
| Ver o descargar el archivo | ✓ | solo de lo suyo | solo de lo suyo | ✓ |
| Revisar una entrega (`PUT …/review`) | ✓ cualquiera | ✓ las de sus controles que no subió él | `403` | `403` |
| Cambiar el responsable, agregar o quitar un requerimiento propio | ✓ | `403` | `403` | `403` |

## Índice de endpoints

| Método | Ruta | Para qué |
|---|---|---|
| `GET` | [`/v1/controls/{id}/evidence`](#get-v1controlsidevidence--la-evidencia-de-un-control) | Los requerimientos de un control con sus entregas |
| `GET` | [`/v1/services/{service_id}/evidence`](#get-v1servicesservice_idevidence--la-evidencia-de-un-servicio) | Los requerimientos de **todos** los controles visibles del servicio, en una petición (MD-208) |
| `POST` | [`/v1/evidence-requirements/{id}/submissions`](#post-v1evidence-requirementsidsubmissions--subir-un-archivo) | Subir un archivo a un requerimiento |
| `GET` | `/v1/evidence-requirements/{id}/submissions` | Todas las versiones (paginada, la más reciente primero) |
| `GET` | [`/v1/evidence-submissions/{id}/download`](#get-v1evidence-submissionsiddownload--ver-o-descargar-un-archivo) | Enlace temporal para ver o descargar |
| `GET` | [`/v1/controls/{control_id}/tests/{test_id}/evidence`](#get-v1controlscontrol_idteststest_idevidence--la-evidencia-de-una-prueba) | La evidencia de una prueba manual |
| `POST` | [`/v1/controls/{control_id}/tests/{test_id}/evidence`](#post-v1controlscontrol_idteststest_idevidence--subir-la-evidencia-de-una-prueba) | Subir la evidencia bajo una prueba (D88) |
| `POST` · `PATCH` · `DELETE` | [`/v1/controls/{id}/evidence-requirements`, `/v1/evidence-requirements/{id}`](#requerimientos) | Gestionar requerimientos propios |
| `PUT` | [`/v1/evidence-submissions/{id}/review`](#put-v1evidence-submissionsidreview--revisar-una-evidencia) | Revisar (validar o rechazar) una entrega |

---

### GET /v1/controls/{id}/evidence — La evidencia de un control

| | |
|---|---|
| **Quién** | Mismas reglas de acceso que el control |
| **Éxito** | `200` |
| **Errores** | `403` · `404` |

Los requerimientos de un control, cada uno con sus entregas (la más reciente primero).

#### Parámetros (query)
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `view` | string | no | `technical` agrega el bloque `technical` de cada entrega (solo `admin_empresa` y `auditor`) |

#### Response `200`
| Campo del requerimiento | Tipo | Qué es |
|---|---|---|
| `id`, `code`, `sequence`, `description`, `dimension` | | `code` es `EV-<código del control>-NN` |
| `test` | `{ id, code, display_name }` \| null | D88: si la evidencia es de **esa** prueba del control; `null` si es un documento que el catálogo **sugiere** sin decir a qué prueba sirve (no cuenta para ninguna). `display_name` es el nombre neutro (D70) |
| `validity_within_period` | string | La vigencia del requerimiento. Si es «dentro del período de evaluación», se guarda el marcador `within_evaluation_period` y llega **traducido** según `Accept-Language` (MD-211); un período concreto (`2026-Q4`, del clonado) llega tal cual |
| `origin` | string | `catalog` si nació de una plantilla, `own` si la agregó la empresa |
| `responsible` | `{ id, type, person_name }` \| null | Un **cargo de la organización** (`organization_responsibles`), no una persona con cuenta; `null` hasta que el administrador lo asigna |
| `submissions[]` | objeto | Las entregas, la más reciente primero |

| Campo de la entrega | Tipo | Qué es |
|---|---|---|
| `id`, `version` | | `version` es un entero que crece por requerimiento (el modelo lo guarda como texto). **Una versión nueva nunca pisa la anterior** |
| `file_name`, `file_type`, `file_size`, `integrity_hash` | | La huella SHA-256 |
| `submitted_by` | `{ id, name, last_name }` | |
| `submitted_at` | datetime | |
| `evidence_state` | enum `evidence_state` | **Lo deriva el servidor**; nadie lo escribe (ver abajo) |
| `review_note` | string \| null | El motivo del rechazo; lo ve quien sube |
| `ai` | `{ is_ai_generated, ai_confidence, verdict }` \| null | Una sugerencia, siempre marcada |

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

#### Reglas
- **Control dado de baja (D119).** Ya no admite entregas nuevas (`409 CONTROL_RETIRED`), pero lo entregado se sigue listando y descargando, con la misma regla de alcance.
- **`evidence_state`** sale de **combinar las revisiones del `responsable` y del `admin_empresa`** (D102; la que consume el motor): algún rechazo → rechazada; sin rechazos y con al menos una aprobación → validada; para todos los roles es la misma. Sin ninguna revisión humana es `pending`, o `in_review` si la IA ya la sugirió.
- **`?view=technical`** agrega a cada entrega `technical: { "review": "ai_prevalidated", "attributes": { "type_ok": true, "period_ok": true, "valid_ok": null, "approved_ok": true, "signed_ok": null, "content_ok": true }, "note": null, "reviewed_by": null, "reviewed_at": null }`. Además trae `technical.reviews[]`: una entrada por rol con `reviewer_role`, `review`, `attributes`, `note`, `reviewed_by` y `reviewed_at`. Los campos planos de `technical` resumen una sola: la que rechaza si hay alguna; si no, la del `admin_empresa`; si no, la del `responsable` (MD-194). Lo ven `admin_empresa` y `auditor` (el `responsable` y el `delegado` ven el estado y la nota de rechazo, no los atributos). Ya no se esconde la revisión de un rol al otro: SEG-61 se retira (D96).

---

### GET /v1/services/{service_id}/evidence — La evidencia de un servicio

| | |
|---|---|
| **Quién** | Mismas reglas de acceso que `GET /v1/services/{service_id}/controls`: `admin_empresa` y `auditor` ven todos los controles; `responsable` y `delegado`, solo los suyos (D102) |
| **Éxito** | `200`, **sin paginar**: un servicio trae unas 80 acciones y cada una pocas evidencias requeridas. Responde con un número fijo de consultas, no una por control |
| **Errores** | `403` (`view=technical` sin ser `admin_empresa` o `auditor`) · `404` (el servicio no existe para esta empresa) |

**Para qué (MD-208).** La pestaña Evidencias reúne la evidencia de todo el servicio. Pedirla control a control hacía unas 80 peticiones y agotaba el límite de 100 por minuto por usuario (SEG-19). Este endpoint la devuelve en una. El panel de un control sigue usando `GET /v1/controls/{id}/evidence`.

#### Parámetros (query)
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `view` | string | no | Igual que en `GET /v1/controls/{id}/evidence` |

#### Response `200`
Cada ítem es **el mismo requerimiento** de `GET /v1/controls/{id}/evidence` (mismos campos, mismas entregas, el mismo bloque `technical` con `?view=technical`), con un campo más:

| Campo | Tipo | Qué es |
|---|---|---|
| `control_id` | uuid | El control al que pertenece el requerimiento |

**Siempre devuelve, para cada control, exactamente lo mismo que `GET /v1/controls/{id}/evidence`.** Los dos aplican la misma regla de alcance (D102, SEG-66): un `responsable` o `delegado` recibe solo sus controles y, de cada uno, todos sus requerimientos. Solo entran los controles vigentes (los dados de baja se omiten, como en el listado de controles). Orden: por control, en el orden por defecto del listado de controles (`sort=code`), y dentro de cada control por `sequence`. Un control sin requerimientos no aparece.

```json
{
  "statusCode": 200,
  "message": "evidence.service_list",
  "data": {
    "items": [
      {
        "control_id": "3f1c…",
        "id": "e07a…",
        "code": "EV-IAC12-01",
        "sequence": 1,
        "description": "Política de control de accesos aprobada",
        "dimension": "policy",
        "test": null,
        "validity_within_period": "Dentro del período de evaluación",
        "origin": "catalog",
        "responsible": null,
        "submissions": []
      }
    ]
  }
}
```

---

### POST /v1/evidence-requirements/{id}/submissions — Subir un archivo

| | |
|---|---|
| **Quién** | El ejecutor, el dueño o el `admin_empresa`, sobre un control suyo |
| **Éxito** | `201` con la entrega |
| **Errores** | `403` · `404` · `409 CONTROL_RETIRED` · `413 FILE_TOO_LARGE` · `415 UNSUPPORTED_MEDIA_TYPE` · `422 FILE_REQUIRED` · `503 STORAGE_UNAVAILABLE` |

#### Request
`multipart/form-data`, el binario en el campo `file`.

| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `file` | binario | sí | **PDF, DOCX, XLSX, PNG y JPG, hasta 25 MB** (SEG-60). Se valida el **contenido** del archivo (su firma), no solo el tipo que declara el navegador ni la extensión |

```
POST /v1/evidence-requirements/e07a…/submissions
Content-Type: multipart/form-data; boundary=…

--…
Content-Disposition: form-data; name="file"; filename="politica-accesos-v2.pdf"
Content-Type: application/pdf
…
```

Se calcula su huella **SHA-256** sobre el archivo recibido y se guarda con el origen, la fecha, el responsable y la versión; nace sin revisión (`evidence_state: "pending"`).

#### Response `201`
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

### GET /v1/evidence-submissions/{id}/download — Ver o descargar un archivo

| | |
|---|---|
| **Quién** | Quien puede ver la entrega |
| **Éxito** | `200` con un enlace temporal de 5 minutos |
| **Errores** | `403` · `404` · `422 disposition.not_supported` · `503 STORAGE_UNAVAILABLE` |

El archivo **nunca es público**.

#### Parámetros (query)
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `disposition` | string | no | `attachment` (por defecto: el navegador lo descarga) o `inline` (la pantalla lo **muestra** sin descargarlo). `inline` solo para **PDF, PNG y JPG**; con DOCX o XLSX responde `422 disposition.not_supported` y la pantalla ofrece la descarga |

`GET /v1/evidence-submissions/b310…/download?disposition=inline`

#### Response `200`
```json
{ "statusCode": 200, "message": "evidence.download", "data": { "url": "https://storage.…/…?X-Signature=…", "file_name": "politica-accesos-v2.pdf", "file_type": "application/pdf", "disposition": "inline", "expires_in": 300 } }
```

> El enlace sale con `Content-Disposition` y `Content-Type` ya fijados al firmarlo, y se firma por entrega: el cliente no puede cambiarlos. Pasados los 5 minutos el enlace deja de funcionar; se pide otro. **Cada enlace generado se registra**, también los `inline`.

### GET /v1/controls/{control_id}/tests/{test_id}/evidence — La evidencia de una prueba

| | |
|---|---|
| **Quién** | Quien puede ver el control |
| **Éxito** | `200` |
| **Errores** | `403` · `404` (el control no lleva la prueba, o la prueba no acepta subida y el control no tiene entregas de ella; MD-499) |

Lo que se subió para una prueba **que acepta evidencia** (regla única por `primary_source`, MD-499; D85), para mostrarlo en la prueba del control. Si el control ya tiene entregas de la prueba, se muestran como histórico aunque hoy no acepte subida (p. ej. integración conectada).
- **Test documental (`dimension: "policy"`, D88):** solo el requerimiento **de esa prueba en este control** (`test.id` igual al test). Su estado es el de este control; `shared_with` va vacío.
- **Otro test manual (D85, RN-13):** un test puede estar en varios controles y su veredicto vale en todos; por eso salen los requerimientos de **todos los controles del servicio que llevan el test**, con la dimensión del test, y cada uno dice de qué control es.

#### Response `200`
Cada ítem es el mismo objeto de requerimiento de `GET /v1/controls/{id}/evidence` (con `sequence`, `test`, `validity_within_period`, `origin`) más su `control`; cada `submissions[i]` trae los campos de la lista de evidencias. `?view=technical` agrega el bloque `technical`, y solo lo piden `admin_empresa` y `auditor`.

| Campo | Tipo | Qué es |
|---|---|---|
| `test_id` | uuid | |
| `shared_with[]` | `{ id, code }` | Los **otros** controles del servicio que llevan el test (vacío si es solo de este), para que la pantalla avise «este test también aplica a…» (D85) |
| `items[]` | objeto | Requerimientos (con `control: { id, code }`) |

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

> Un `responsable` o `delegado` ve solo los requerimientos de **sus controles** (D102, SEG-66); los demás se omiten, no fallan. En `shared_with` solo ve los otros controles que también son suyos.

### POST /v1/controls/{control_id}/tests/{test_id}/evidence — Subir la evidencia de una prueba

| | |
|---|---|
| **Quién** | El ejecutor, el dueño o el `admin_empresa`, sobre un control suyo |
| **Éxito** | `201` con la entrega (`requirement_id` del lugar de esa prueba) |
| **Errores** | `403` · `404` (el control no lleva esa prueba) · `409 CONTROL_RETIRED` · `413` · `415` · `422 test.not_manual` · `422 FILE_REQUIRED` |

La persona lee lo que pide la prueba y sube su documento **bajo ella**, en un solo paso (D88). La revisan después el dueño y el `admin_empresa` (D96, D102).

#### Request
`multipart/form-data`, campo `file`; mismos tipos y tope que la subida de un requerimiento (PDF, DOCX, XLSX, PNG y JPG, 25 MB, SEG-60).

#### Reglas
- **La primera entrega crea el lugar de esa prueba** en el control (un requerimiento propio, `origin: "own"`, con `test_id` = la prueba, `description` = el nombre neutro de la prueba y código `EV-<control>-NN`); las siguientes son **versiones nuevas** del mismo lugar. Con el control bloqueado, dos primeras entregas a la vez crean un solo lugar.
- El archivo se comprueba **antes** de crear el lugar: uno rechazado no deja un requerimiento vacío.
- La prueba debe ser **de fuente manual** y del control: si el control no la lleva, `404`; si su evidencia la toma una fuente automática, `422 test.not_manual`. **Fuente manual (MD-499, Rod 2026-11-24):** se decide por la **fuente principal de la prueba** (`primary_source`, enum `test_primary_source`), no por su dimensión: `document` o `manual` aceptan subida; `probe`, `cloud_engine` y `probe_and_cloud_engine` no (las mide la evaluación automática); `integration` acepta subida **de respaldo** solo mientras el servicio no tenga conectada una integración de la categoría de esa prueba (`integration_category`; hoy ninguna, MD-497) y, al conectarla, deja de aceptarla. **Además, la dimensión de la prueba debe aplicar en el control:** si el control la marcó «no aplica», la subida responde `422 dimension.not_in_control` (en `test_id`) y la prueba sale con `accepts_evidence: false`. En `POST …/evidence-requirements` con `test_id`, la `dimension` debe ser la de la prueba (si no, `422 dimension.not_of_test` en `dimension`). `dimension` admite las 9 dimensiones del enum. **Al conectar la integración no se borra nada:** el respaldo se calcula, no se guarda; las evidencias subidas quedan como histórico (inmutables, D119) y siguen contando para las ventanas ya cerradas del período, y desde la conexión la prueba la decide la integración. Si se desconecta, vuelve a aceptar subida. Así las pruebas de proceso, red, endpoint y físico (actas, muestras, inspecciones) se cumplen como las documentales: el cliente sube lo que pide «evidencia a conservar» y la revisan el dueño y el `admin_empresa`.
- **Subir no cumple la prueba:** queda en revisión hasta que la revisen.

### Requerimientos

| Endpoint | Quién | Request | Response |
|---|---|---|---|
| `PATCH /v1/evidence-requirements/{id}` | `admin_empresa` | `{ "responsible_id": "c9d0…" }` (un cargo; `null` lo deja sin responsable). En uno **propio** también `description` | `200` el requerimiento |
| `POST /v1/controls/{id}/evidence-requirements` | `admin_empresa` | `{ "description": "Acta de la revisión", "dimension": "policy", "test_id": "21ab…" }` (`test_id` opcional) | `201` el requerimiento, `origin: "own"` |
| `DELETE /v1/evidence-requirements/{id}` | `admin_empresa` | — | `204` |

- Solo se quitan requerimientos **propios** y **sin entregas**: uno del catálogo o uno con histórico no se borra (`409 REQUIREMENT_NOT_REMOVABLE`).
- **`dimension`** admite las **9 dimensiones** del enum (lista única `src/common/catalogs/dimensions.ts`); con `test_id`, debe ser la de la prueba (`422 dimension.not_of_test`).
- **`test_id` (D88)** hace que la evidencia sea de **una prueba concreta** de ese control. Debe ser una prueba **de fuente manual** (la misma regla del `POST …/tests/{test_id}/evidence`) que el control lleve; si no, `422` (`test.not_manual`, `test.not_in_control`). Sin `test_id`, el requerimiento no cuenta para ninguna prueba. `code` y `sequence` los pone el servidor.
- La pantalla **no usa** `POST …/evidence-requirements`: sube la evidencia de cada prueba con `POST …/tests/{test_id}/evidence`, que crea el lugar solo. Existe para quien quiera nombrar un documento propio.

---

### PUT /v1/evidence-submissions/{id}/review — Revisar una evidencia

| | |
|---|---|
| **Quién** | El `responsable` dueño del control (lo que no subió él) · el `admin_empresa` (cualquiera). `delegado`, `auditor` y `admin_monkey`, `403`; un `responsable` sobre una entrega de un control que no es suyo, `403` |
| **Éxito** | `200` con la revisión y el `evidence_state` calculado |
| **Errores** | `403 FORBIDDEN` (rol que no revisa, control que no es suyo, o revisar lo que subió uno mismo; el `admin_empresa` sí puede revisar lo suyo, D132) · `404` (la entrega no existe para esta empresa) · `422 note.required` · `422 enum.invalid` |

Los seis atributos de una evidencia y la revisión por una persona (RN-01 a RN-03). **De estas revisiones sale el estado de las pruebas documentales a las que sirve la evidencia, en su control (D88): no hay un segundo paso de veredicto.** El rol de la revisión lo pone el servidor desde quien llama (`reviewer_role = responsable` o `admin_empresa`); el cuerpo no lo lleva. Cada entrega tiene a lo sumo **una revisión por rol** y `PUT` la crea o la reemplaza (queda en el rastro).

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `type_ok`, `period_ok`, `valid_ok`, `approved_ok`, `signed_ok`, `content_ok` | boolean \| null | no | `null` = sin valorar. `valid_ok` en `false` es EVIDENCIA VENCIDA (RN-02) |
| `review` | enum `evidence_review` | sí | Solo `human_validated` o `pending_review`: **`ai_prevalidated` lo deriva el sistema, nunca una persona** (`422 enum.invalid`) |
| `note` | string | al rechazar | **Obligatoria al rechazar** (`422 note.required`) y opcional al validar; es lo que lee quien subió para saber qué corregir |

```json
{ "type_ok": true, "period_ok": true, "valid_ok": true, "approved_ok": true, "signed_ok": true, "content_ok": true, "review": "human_validated", "note": "El acta está firmada por la dirección." }
```

#### Reglas
- **Validar** es `human_validated` con los atributos en `true`.
- **Rechazar** es dejar algún atributo en `false`: la prueba no cumple y quien subió rehace con una versión nueva.
- **Cómo se combinan:** algún rechazo (de cualquiera de los dos roles) → rechazada; sin rechazos y al menos una validación → validada; si revisan los dos, deben validar los dos.
- **Nadie revisa lo que subió él mismo**, salvo el `admin_empresa` dueño del control (D132).
- Quien subió y quien revisó quedan en el rastro, con su nombre.

---

## Errores del módulo

| HTTP | `error.code` | Cuándo |
|---|---|---|
| 403 | `FORBIDDEN` | El rol no puede; el control no es suyo; se revisa lo que se subió uno mismo (salvo el `admin_empresa` dueño) |
| 404 | `NOT_FOUND` | El requerimiento, la entrega o el cargo no existen para esta empresa; (en `POST …/tests/{test_id}/evidence`) el control no lleva esa prueba |
| 409 | `REQUIREMENT_NOT_REMOVABLE` | Es del catálogo o ya tiene entregas |
| 409 | `CONTROL_RETIRED` | Subir evidencia a un control dado de baja |
| 409 | `EVIDENCE_VERSION_CONFLICT` | Dos subidas a la vez pidieron la misma versión; se reintenta (no debería verse: el servidor las ordena) |
| 413 | `FILE_TOO_LARGE` | El archivo pasa del máximo |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Tipo no permitido o contenido que no coincide con el declarado |
| 422 | `FILE_REQUIRED` | El multipart no trae `file` o viene vacío |
| 422 | `VALIDATION_FAILED` | Campos: `enum.invalid`, `note.required`, `dimension.not_in_control`, `dimension.not_of_test`, `test.not_manual`, `test.not_in_control`, `disposition.not_supported` (`inline` con un tipo que no se muestra en pantalla) |
| 503 | `STORAGE_UNAVAILABLE` | El almacenamiento privado no está configurado |

**Claves i18n:** `evidence.list`, `evidence.service_list`, `evidence.test_list`, `evidence.submission_list`, `evidence.submitted`, `evidence.download`, `evidence.version_conflict`, `evidence_requirement.updated`, `file.required`, `file.too_large`, `file.unsupported_type`, `file.storage_unavailable`.

### Ejemplos de error

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
      { "field": "disposition", "code": "disposition.not_supported", "message": "Este tipo de archivo no se puede ver en pantalla; descárgalo." }
    ]
  }
}
```

**`415` — un tipo de archivo no permitido**
```json
{ "statusCode": 415, "message": "file.unsupported_type", "data": null, "error": { "code": "UNSUPPORTED_MEDIA_TYPE" } }
```

## Auditoría

| `action` | Cuándo |
|---|---|
| `evidence.submit` | Se sube una entrega (con la huella, nunca el contenido) |
| `evidence.download` | Se genera un enlace de descarga o de vista (`disposition` en el detalle; nunca la URL firmada) |
| `evidence_requirement.update` · `.create` · `.delete` | Cambia un requerimiento |
| `evidence_review.update` | Se valida o se rechaza una evidencia (crear o reemplazar la propia de ese rol; sin los atributos en el detalle) (`responsable` o `admin_empresa`) |

## Preguntas abiertas

- ~~`P34`~~ cerrada por D132: si el `admin_empresa` es el responsable del control, su aprobación es la final.
- Las 89 plantillas del catálogo llegan **como sugerencia** (`test: null`, no cuentan para ninguna prueba) porque el Excel no dice a qué prueba sirve cada documento; asignarlas es contenido de catálogo (D88, `DT-76`).
- Los tipos permitidos y el tope de 25 MB están **confirmados** (2026-10-17, SEG-60).

---

## Estado de implementación

**Construido (MD-499, 2026-11-24): la subida se decide por `primary_source`** (`test.not_manual`, que reemplaza a `test.not_documentary`; `domain/evidence/test-evidence-source.ts`, `evidence.use-cases.ts`).

**Construido: MD-208** (2026-11-11): `GET /v1/services/{service_id}/evidence`. Número fijo de consultas (medido: las mismas con 3 que con 86 controles). Reutiliza la regla de qué controles ve cada rol (`canSeeControl`, compartida con el listado de controles). **MD-193 (2026-11-17)** retiró el filtro por dimensión: quien ve un control ve todos sus requerimientos. Pruebas: `test/cumplimiento/evidencia-servicio.e2e-spec.ts`.

**Construido (2026-10-28, B66):**
- **Revisión de la evidencia en dos niveles: construida en MD-194 (2026-11-17)** (el `responsable` dueño y el `admin_empresa`, el estado combina las dos y el motor usa la combinación; pruebas: `test/cumplimiento/revision-evidencia.e2e-spec.ts`). Antes, **hasta D96:** Solo `admin_empresa` (`PUT /v1/evidence-submissions/{id}/review`); `evidence_reviews.reviewer_role` tiene el valor `admin_empresa` (migraciones `20261028202705_evidence_reviewer_admin_empresa` y `20261030000100_remove_consultant`: el enum queda solo con `admin_empresa`); una sola revisión por entrega; rechazar sin `note` es `422 note.required`. Todos los roles ven la misma revisión (SEG-61 retirado); quien sube recibe `review_note` en cada entrega. **D102:** `reviewer_role` pasa a `responsable` o `admin_empresa` y la clave única a `(evidence_submission_id, reviewer_role)`.

**Construido: MD-126** (2026-10-18): `GET /v1/controls/{id}/evidence`, `POST` y `GET /v1/evidence-requirements/{id}/submissions` y `GET /v1/evidence-submissions/{id}/download`. Lo que el contrato no dice y el código hace:
- **Versión.** Se calcula dentro de la transacción, bloqueando la fila del requerimiento (`select … for update`); un índice único `(requerimiento, versión)` es la red de seguridad. En la tabla es texto (`"1"`, `"2"`…) y se ordena como número. Tres subidas a la vez reciben tres versiones distintas.
- **Una entrega es histórico.** La app (`monkey_app`) no tiene `UPDATE` ni `DELETE` sobre `evidence_submissions` (`REVOKE` en la migración `20261018100000_evidence_submissions_provide_only`): solo inserta y lee, como el rastro de auditoría.
- **Orden al subir.** Primero se comprueba el requerimiento y a quién le toca (`404`/`403`/`409`), luego el contenido del archivo (SEG-60), luego se guarda en el bucket y por último se inserta la fila con su rastro en la misma transacción. Si la base o el rastro fallan, el objeto se borra del bucket.
- **La llave del objeto no sale.** Es `<empresa>/services/<servicio>/evidence/<requerimiento>/<uuid>/<nombre>`; `file_name` es su último tramo (el nombre ya limpio: sin acentos ni espacios). `storage_location` guarda `s3`.
- **`evidence_state`** (MD-127, 2026-10-22). Sale hoy de la única revisión de la entrega (`evidence_reviews`), la del `admin_empresa` (D96); D102 la cambia por la combinación de las revisiones de cada rol. Sin revisión es `pending` (o `in_review` si la IA ya sugirió). En `?view=technical` el bloque trae `review`, `attributes`, `note`, `reviewed_by` y `reviewed_at` de esa revisión; sin ninguna, todo `pending_review` y `null`.
- **Subir por prueba (D88, 2026-10-22).** `POST /v1/controls/{id}/tests/{test_id}/evidence` busca el requerimiento de esa prueba en el control (lo crea en la primera entrega, con el control bloqueado) y sube el archivo como su versión siguiente. Rastro: `evidence_requirement.create` solo si lo creó, y `evidence.submit`.
- **Requerimientos propios (D88, 2026-10-22).** `POST /v1/controls/{id}/evidence-requirements` (solo `admin_empresa`) crea un requerimiento `origin: "own"` con código `EV-<código del control>-NN` y la posición siguiente, calculados con el control bloqueado (dos altas a la vez no chocan). Valida `dimension.not_in_control`, `dimension.not_of_test` (la `dimension` debe ser la de la prueba), `test.not_in_control` y `test.not_manual` (antes `test.not_documentary`, MD-499), y copia la vigencia que ya usa el servicio. Cómo la revisión de una evidencia mueve el estado del control está en [`README.md`](README.md) y en `modelo/09-calculo-cumplimiento.md`.
- **`ai`.** `ai_confidence` va `null`: la confianza no se guarda todavía.
- **Descarga.** Genera el enlace (5 minutos) y lo registra en el rastro **de mejor esfuerzo**, sin la URL firmada; no hay un cambio de datos con el que ser atómico. Si no hay almacenamiento responde `503` y no registra una descarga que no ocurrió.
- **Tipos y tamaño.** PDF, DOCX, XLSX, PNG y JPG, hasta 25 MB. Un DOCX o un XLSX se reconoce mirando el directorio central del zip (`[Content_Types].xml` y `word/` o `xl/`); un zip cualquiera renombrado se rechaza con `415`.
- **Ver sin descargar y listar por test (MD-177, 2026-10-30).** `GET /v1/controls/{id}/tests/{test_id}/evidence` y `disposition=inline` en la descarga están construidos. El enlace sale con la disposición y el tipo de contenido **fijados al firmar** (`ResponseContentDisposition` y `ResponseContentType` del S3); `inline` solo para PDF, PNG y JPG y con otro tipo es `422 disposition.not_supported`, sin generar enlace ni rastro. La respuesta de la descarga lleva `disposition` y el rastro `evidence.download` la guarda. **MD-499:** la lectura la decide la regla única de la subida (`primary_source`, ver `POST …/tests/{test_id}/evidence`) y además se muestra el **histórico**: si el control ya tiene entregas de esa prueba, se devuelven aunque hoy no acepte subida (p. ej. una integración conectada después). `404` solo si la prueba no acepta subida **y** el control no tiene entregas de ella (o no la lleva). Un test documental solo devuelve el requerimiento de esa prueba **en este control**; otro test manual devuelve los requerimientos de los controles vigentes del servicio que lo llevan y sirven al test (`test_id` igual, o compartidos de su dimensión). Pruebas: `test/cumplimiento/evidencia-por-test.e2e-spec.ts` y la del firmado en `s3-file.storage.spec.ts`.
- **Pruebas.** Unitaria del validador y e2e `test/cumplimiento/evidencias.e2e-spec.ts` (almacenamiento en memoria); y `test/almacenamiento/evidencia.e2e-spec.ts` contra un S3 real, opcional como la de la Descripción del Sistema.
- **Sin construir (anotación anterior a MD-177, parte ya resuelta arriba):** de la gestión de requerimientos, cambiar el responsable (`PATCH`) y quitar uno propio (`DELETE`).
