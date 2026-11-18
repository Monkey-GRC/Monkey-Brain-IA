---
id: contracts-compliance-verdicts
name: Contrato — Cumplimiento, pruebas y veredictos
description: Los tests de un control, qué falló y cómo corregirlo, y el veredicto del administrador sobre una prueba manual.
type: contract
---

# Cumplimiento — pruebas y veredictos

| | |
|---|---|
| **Estado** | **ACORDADO** (D96), construido (2026-10-28, B66 y MD-177). **D102 y D121 cambian quién da y quién revisa el veredicto** (ver [Veredicto en dos niveles](#veredicto-en-dos-niveles-d102-d121)), construido en MD-194 (2026-11-17) |
| **App** | Monkey Platform |
| **Contexto común** | Quién puede qué, estado general y errores comunes: [`README.md`](README.md) |
| **Entidades** | `evaluations`, `client_control_tests` (`modelo-datos.md` §7.4, §7.5, §9) · enums: [`enums.md`](../enums.md) (`test_state`, `verdict_result`) |

## Índice de endpoints

| Método | Ruta | Quién | Para qué |
|---|---|---|---|
| `GET` | [`/v1/controls/{id}/tests`](#get-v1controlsidtests--los-tests-de-un-control) | `admin_empresa` · `auditor` | Los tests de un control, con su estado |
| `GET` | [`/v1/controls/{control_id}/tests/{test_id}/findings`](#get-v1controlscontrol_idteststest_idfindings--qué-falló-y-cómo-corregirlo) | `admin_empresa` · `auditor` · dueño y ejecutor | Qué falló y cómo corregirlo (D90) |
| `POST` | [`/v1/controls/{control_id}/tests/{test_id}/verdicts`](#post-v1controlscontrol_idteststest_idverdicts--dar-el-veredicto) | `admin_empresa` · dueño · ejecutor | Registrar el veredicto de una prueba manual (D121) |
| `PUT` | [`/v1/verdicts/{id}/review`](#put-v1verdictsidreview--revisar-un-veredicto) | `admin_empresa` · dueño (si no lo registró él) | Aprobar o rechazar un veredicto (D121) |
| `GET` | `/v1/controls/{control_id}/tests/{test_id}/verdicts` | `admin_empresa` · `auditor` · dueño y ejecutor | Historial de veredictos con su estado y sus revisiones (paginado) |

---

### GET /v1/controls/{id}/tests — Los tests de un control

| | |
|---|---|
| **Quién** | `admin_empresa` (D81) · `auditor` |
| **Éxito** | `200`, paginada (`page`, `page_size`, máx. 100), ordenada por código |
| **Errores** | `403` (`responsable`, `delegado`, `admin_monkey`) · `404` |

La vista técnica de un control: los tests que lo verifican, **todos con su estado**, también los que aún no tienen activos conectados («Sin activos»).

#### Response `200`
| Campo del ítem | Tipo | Qué es |
|---|---|---|
| `test_id`, `test_code` | uuid, string | El código (`T-DOC-001`) solo va en la vista técnica |
| `display_name` | string | El nombre neutro (D70); el texto del comité no sale |
| `dimension` | enum `dimension` | |
| `type` | enum `control_type` | Cómo se resuelve su dimensión en este control: `manual`, `automated`, `hybrid` o `technical_manual` |
| `is_mandatory`, `is_active` | boolean | |
| `shared_with[]` | `{ id, code }` | Los **otros** controles vigentes del servicio que llevan el test (D85); su veredicto vale en todos. **Siempre vacío en un test documental** (D88) |
| `state` | enum `test_state` | Un test documental sale de las evidencias de este control (D88), no es fijo `pending` |
| `last_verdict` | `{ result, evaluated_at, confirmed_by }` \| null | El último veredicto **aprobado** del test en el servicio (D121): `evaluated_at` es cuándo se registró y `confirmed_by` quien lo aprobó (el `admin_empresa` si aprobaron los dos). Uno `pending` o `rejected` no sale aquí |
| `ai_suggestion` | objeto \| null | Siempre marcada como de la IA y **nunca decide** (hoy es siempre `null`) |

```json
{
  "statusCode": 200,
  "message": "control_test.list",
  "data": {
    "items": [
      {
        "test_id": "21ab…",
        "test_code": "T-DOC-001",
        "display_name": "Revisión periódica de accesos",
        "dimension": "policy",
        "type": "manual",
        "is_mandatory": true,
        "is_active": true,
        "shared_with": [ { "id": "77a2…", "code": "IAC-4" } ],
        "state": "in_review",
        "last_verdict": { "result": "compliant", "evaluated_at": "2026-10-14T18:30:00Z", "confirmed_by": { "id": "d5e6…", "name": "Camilo", "last_name": "Ortiz" } },
        "ai_suggestion": { "is_ai_generated": true, "ai_confidence": 0.74, "verdict": "compliant", "rationale": "Las tres revisiones del período están firmadas." }
      }
    ],
    "page": 1, "page_size": 25, "total": 1, "total_pages": 1
  }
}
```

> Ver no es hacer: el veredicto se da con `POST …/verdicts` (abajo).

### GET /v1/controls/{control_id}/tests/{test_id}/findings — Qué falló y cómo corregirlo

| | |
|---|---|
| **Quién** | `admin_empresa` · `auditor` · **el dueño y el ejecutor del control** (D102: son quienes la reparan; ven qué falló y cómo corregirlo, no la vista técnica completa) |
| **Éxito** | `200`, paginada (`page`, `page_size`), de la más grave a la menos |
| **Errores** | `403` (otro `responsable` o `delegado`, `admin_monkey`) · `404` (el control no lleva la prueba, o la prueba no es automática: una documental no tiene nada técnico que explicar) |

De una **prueba automática** de un control (de **nube** o de **servidores**, D113; dimensión `cloud`, `server`, `database` o `app`): las comprobaciones que fallaron, en qué recursos y cómo corregirlas (D90). Lo que lee: la **última corrida completada** de cada conexión del servicio (una cuenta de nube o un servidor con agente), solo los resultados `failed`, de los checks que alimentan esa prueba **con la misma regla que las evaluaciones** (los ratificados por el comité; con `READINESS_INCLUDE_PROPOSED=true`, también los propuestos). Un recurso descubierto que no es del servicio no se cuenta.

**Servidores (D113).** El recurso afectado es **el propio servidor**, con el nombre que el cliente le dio (`resources: [{ name, uid: null, region: null }]`); si varios servidores fallan la misma comprobación, salen todos en ese hallazgo. **La sonda no califica sus checks**, así que `severity` es **`null`**: no se inventa un nivel; el hallazgo se ordena después de los calificados y la pantalla no pinta nivel. El título sale en español del catálogo del comité. La guía sale en español (`language: "es"`, `is_ai_generated: true` hasta que una persona la revise) donde Monkey la tradujo —hoy ≈4.000 guías: Ubuntu 22.04 completo, Windows casi completo y Linux donde el texto es idéntico a uno ya traducido— y, donde no, el original en inglés dicho como inglés (`language: "en"`).

**Formato de `remediation.text`:** párrafos separados por salto de línea, viñetas con `- `, y los **comandos en un bloque entre tres comillas invertidas**, que la pantalla muestra aparte para leerlo y copiarlo; se conserva tal cual, sin interpretarlo (D113). El proceso que la produce valida que todo comando o ruta del bloque aparezca igual en el original.

#### Response `200`
| Campo | Tipo | Qué es |
|---|---|---|
| `test_id` | uuid | |
| `measured_at` | datetime \| null | Nulo si no hay corrida (y entonces `items: []`) |
| `items[].id` | uuid | |
| `items[].title` | string | La comprobación en positivo («lo que debería cumplirse») |
| `items[].severity` | enum `severity` \| null | Nulo cuando quien midió no califica sus checks (servidores, D113) |
| `items[].resources[]` | `{ name, uid, region }` | Hasta 50 recursos por comprobación |
| `items[].resources_total` | integer | Cuántos recursos son en total |
| `items[].remediation` | `{ text, language, is_ai_generated }` \| null | La guía de corrección de esa comprobación, igual para todos los recursos; `null` si no hay una que se pueda mostrar |

```json
{
  "statusCode": 200,
  "message": "finding.list",
  "data": {
    "test_id": "21ab…",
    "measured_at": "2026-10-22T23:40:00Z",
    "items": [
      {
        "id": "5c1e…",
        "title": "IAM Access Analyzer está habilitado",
        "severity": "high",
        "resources": [ { "name": "analizador-principal", "uid": "arn:aws:accessanalyzer:us-east-1:123456789012:analyzer/…", "region": "us-east-1" } ],
        "resources_total": 1,
        "remediation": { "text": "Habilita IAM Access Analyzer en todas las cuentas y regiones activas…", "language": "es", "is_ai_generated": true }
      }
    ],
    "page": 1, "page_size": 25, "total": 1, "total_pages": 1
  }
}
```

#### Reglas
- **Idioma y procedencia.** Sale en el idioma de la sesión. El catálogo trae el texto original en inglés; Monkey lo **traduce con IA** (`is_ai_generated: true`, la pantalla lo etiqueta como traducción automática hasta que alguien la revise). Si un check aún no tiene traducción, sale el original con `language: "en"`.
- **Nada nombra al motor (D70).** Ningún identificador del motor sale (ni el código del check ni el tipo de recurso del motor). Un título o una guía que nombre al proveedor se omite (`null`, y el título cae a un texto neutro): es una red de seguridad, no una revisión. El mensaje por recurso que escribe el motor (`status_detail`) **no sale**: es texto crudo y en inglés.

### POST /v1/controls/{control_id}/tests/{test_id}/verdicts — Dar el veredicto

| | |
|---|---|
| **Quién** | `admin_empresa`, el dueño (`responsable`) o el ejecutor (`delegado`) del control (D102, D121); `auditor`, `admin_monkey` y quien no es dueño ni ejecutor, `403` |
| **Éxito** | `201` (queda **una evaluación nueva e inmutable**; la anterior se conserva) |
| **Errores** | `403` · `404` · `409 TEST_NOT_MANUAL` · `409 TEST_DECIDED_BY_EVIDENCE` · `409 TEST_HAS_NO_ASSETS` · `422 closure_reason.required` |

Aplica a las pruebas **manuales que no son documentales** (p. ej. la validación manual complementaria de una prueba técnica). Una automática la resuelve la sonda (`409 TEST_NOT_MANUAL`) y una **documental se resuelve revisando su evidencia** (`PUT /v1/evidence-submissions/{id}/review`): sobre ella responde `409 TEST_DECIDED_BY_EVIDENCE` (D88).

**El veredicto es del test en el servicio, no del control** (D85, RN-13): `control_id` es el control desde el que se da (el de origen) y el veredicto cuenta en **todos los controles del servicio que llevan ese test**. La evidencia que lo sustenta es la de `GET /v1/controls/{control_id}/tests/{test_id}/evidence` (`evidencia.md`).

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `result` | enum `verdict_result` | sí | `compliant` · `non_compliant` |
| `note` | string | no | Lo que sustenta el veredicto |
| `closure_observation_reason` | string | si el control de origen tiene observaciones `open` | Sin ella, `422 closure_reason.required` y no se escribe ninguna evaluación. En blanco no vale |

```json
{ "result": "compliant", "note": "Las tres revisiones del período están firmadas por la dirección." }
```

Con observaciones abiertas (criterio provisional, D85: cuentan solo las de **ese control** y solo las `open`; una respondida, una cerrada, una de otro control o de un servicio completo no piden nada):

```json
{ "result": "compliant", "closure_observation_reason": "La observación abierta es de forma y no afecta al control.", "note": "…" }
```

#### Response `201`
| Campo | Tipo | Qué es |
|---|---|---|
| `id` | uuid | El veredicto registrado (`test_verdicts`, D121) |
| `control_id`, `test_id`, `dimension` | | |
| `origin` | enum `evaluation_origin` | `manual` |
| `result` | enum `verdict_result` | |
| `note`, `closure_observation_reason` | string \| null | |
| `confirmed_by` | `{ id, name, last_name }` | Quién lo registró (igual que `registered_by`; se conserva por compatibilidad) |
| `evaluated_at` | datetime | Cuándo se registró |
| `state`, `registered_by`, `reviews[]` | | Ver «Veredicto en dos niveles» abajo |
| `test_state` | enum `test_state` | |
| `applies_to_controls[]` | `{ id, code }` | Los controles donde cuenta |

```json
{
  "statusCode": 201,
  "message": "verdict.issued",
  "data": {
    "id": "f2c8…",
    "control_id": "3f1c…",
    "test_id": "21ab…",
    "dimension": "policy",
    "origin": "manual",
    "result": "compliant",
    "note": "Las tres revisiones del período están firmadas por la dirección.",
    "closure_observation_reason": null,
    "confirmed_by": { "id": "d5e6…", "name": "Camilo", "last_name": "Ortiz" },
    "evaluated_at": "2026-10-14T18:30:00Z",
    "test_state": "compliant",
    "applies_to_controls": [ { "id": "3f1c…", "code": "IAC-12" }, { "id": "77a2…", "code": "IAC-4" } ]
  }
}
```

> Un test sin veredicto está `pending` y **no cuenta como cumplido**. `GET /v1/controls/{control_id}/tests/{test_id}/verdicts` lista el historial (paginado; `admin_empresa`, `auditor` y el dueño y el ejecutor del control), cada uno con su estado y sus revisiones.

## Veredicto en dos niveles (D102, D121)

El veredicto de una prueba manual **no documental** sigue el mismo flujo que la evidencia: alguien lo **registra** y otra persona lo **revisa**.

| | |
|---|---|
| **Registrar** | `POST …/verdicts` (arriba). Lo registra el ejecutor, el dueño o el `admin_empresa`. Nace `pending` y **todavía no cuenta**. Si lo registra el `admin_empresa`, nace con su aprobación y cuenta al instante (P34 sigue abierta: queda en el rastro quién registró y quién aprobó, y el auditor es el contrapeso) |
| **Revisar** | `PUT /v1/verdicts/{id}/review` (abajo). Lo revisa el dueño, si no lo registró él, y el `admin_empresa` siempre. Una revisión por rol y veredicto: un segundo `PUT` del mismo rol reemplaza la suya |
| **Estado** (`verdict_state`) | **Algún rechazo → `rejected`**; sin rechazos y con al menos una aprobación → `approved`; sin revisión → `pending`. Un rechazo posterior a una aprobación la anula |
| **Qué cuenta** | El estado del test sale del **último veredicto registrado** del test en el servicio: si está `approved`, cuenta su `result`; si está `pending` o `rejected`, el test queda `pending` (no cuenta como cumplido, §9). Rechazado ⇒ se registra uno nuevo; el anterior se conserva |
| **Inmutable** | Un veredicto no se edita ni se borra; sus revisiones solo se reemplazan por la del mismo rol, y cada cambio queda en el rastro |

### PUT /v1/verdicts/{id}/review — Revisar un veredicto

| | |
|---|---|
| **Quién** | El dueño del control de origen (si no registró el veredicto él mismo) y el `admin_empresa` (siempre, también lo que registró él). `delegado`, `auditor`, `admin_monkey` y un `responsable` que no es el dueño, `403`; el que lo registró sin ser `admin_empresa`, `403` |
| **Éxito** | `200` con el veredicto y su estado combinado |
| **Errores** | `403` · `404` (no existe para esta empresa) · `409 VERDICT_SUPERSEDED` (ya hay un veredicto más nuevo del mismo test en el servicio) · `422 note.required` (rechazar sin nota) |

El `reviewer_role` lo pone el servidor desde quien llama (`responsable` · `admin_empresa`).

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `decision` | enum `verdict_review_decision` | sí | `approve` · `reject` |
| `note` | string | al rechazar | Por qué se rechaza; en blanco no vale |

```json
{ "decision": "reject", "note": "La evidencia de la restauración es de otro período." }
```

#### Response `200`
| Campo | Tipo | Qué es |
|---|---|---|
| `id` | uuid | El veredicto |
| `result` | enum `verdict_result` | Lo que se registró |
| `state` | enum `verdict_state` | `pending` · `approved` · `rejected` |
| `registered_by` | `{ id, name, last_name, role }` | Quién lo registró |
| `reviews[]` | objeto | Una por rol: `reviewer_role`, `decision`, `note`, `reviewed_by`, `reviewed_at` |

Las mismas columnas `state`, `registered_by` y `reviews[]` salen en `POST …/verdicts` (`201`) y en cada ítem de `GET …/verdicts`.

## Errores del módulo

Los errores comunes (`FORBIDDEN`, `NOT_FOUND`, `VALIDATION_FAILED`) están en [`README.md`](README.md#errores-comunes); aquí solo los propios.

| HTTP | `error.code` | Cuándo |
|---|---|---|
| 409 | `TEST_NOT_MANUAL` | Dar un veredicto sobre un test automático |
| 409 | `TEST_DECIDED_BY_EVIDENCE` | Dar un veredicto sobre un test documental: se resuelve revisando su evidencia (D88) |
| 409 | `TEST_HAS_NO_ASSETS` | El servicio no tiene activos de la dimensión del test: no hay sobre qué dar el veredicto |
| 422 | `VALIDATION_FAILED` (`closure_reason.required`) | Veredicto con observaciones abiertas y sin razón |
| 409 | `VERDICT_SUPERSEDED` | Revisar un veredicto que ya no es el último del test en el servicio |
| 422 | `VALIDATION_FAILED` (`note.required`) | Rechazar un veredicto sin nota |

**Claves i18n:** `control_test.list`, `verdict.issued`, `verdict.list`, `verdict.reviewed`, `verdict.superseded`.

### Ejemplos de error

Todos con el mismo sobre (`conventions.md`); `message` es la clave i18n del error.

**`409` — veredicto sobre un test automático**
```json
{ "statusCode": 409, "message": "verdict.test_not_manual", "data": null, "error": { "code": "TEST_NOT_MANUAL" } }
```

**`422` — veredicto con observaciones abiertas y sin razón**
```json
{
  "statusCode": 422,
  "message": "validation.failed",
  "data": null,
  "error": {
    "code": "VALIDATION_FAILED",
    "fields": [
      { "field": "closure_observation_reason", "code": "closure_reason.required", "message": "Hay observaciones abiertas: indica por qué das el veredicto igual." }
    ]
  }
}
```

## Auditoría

| `action` | Cuándo | Quién |
|---|---|---|
| `test_verdict.issue` | Se registra un veredicto. Si nace aprobado (lo registra el `admin_empresa`), deja también el evento `control.state` de cada control que cambie de estado (D91) | `admin_empresa`, dueño o ejecutor |
| `test_verdict.review` | Se aprueba o rechaza un veredicto (crear o reemplazar la revisión de ese rol), con quién lo registró y quién lo revisa. Deja `control.state` (causa `test_verdict_review`) si el estado del test cambia | dueño o `admin_empresa` |

Recursos del rastro: `test_verdict` (el veredicto) y `test_verdict_review` (la revisión de un rol). La nota de la revisión no se copia al rastro: vive en la revisión.

## Preguntas abiertas

- Las generales del grupo están en [`README.md`](README.md).

---

## Estado de implementación

**Control dado de baja (D119).** Ya no admite veredictos nuevos, pero los que tenía se siguen leyendo, con la misma regla de alcance.

**Construido (2026-10-28, B66):**
- **Veredicto.** `POST` solo `admin_empresa`, `GET` del historial `admin_empresa` y `auditor`.
- **Pruebas documentales por control (D88).** El estado sale de la revisión del `admin_empresa` (D102 lo cambia por la combinación de revisiones, MD-194).

**Construido (MD-177, 2026-10-29): `GET /v1/controls/{id}/tests`.** Todas las pruebas del control ordenadas por código y paginadas (`page`, `page_size`, máx. 100), con `state` (el del motor), `type`, `is_mandatory`, `is_active` y `display_name` neutro. `shared_with` son los otros controles **vigentes** del servicio que llevan la prueba (D85, ordenados por código), siempre vacío en una documental (D88). `last_verdict` es `{ result, evaluated_at, confirmed_by }` del último veredicto del `admin_empresa` o `null`; `ai_suggestion` es siempre `null` porque la IA no escribe aquí. Solo `admin_empresa` y `auditor`; el `funcional` (hoy) y `admin_monkey` reciben `403`. Pruebas: `test/cumplimiento/evidencia-por-test.e2e-spec.ts`. La evidencia de cada test está en `evidencia.md`.
