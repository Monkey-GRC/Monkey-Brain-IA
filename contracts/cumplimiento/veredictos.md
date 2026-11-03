---
id: contracts-compliance-verdicts
name: Contrato — Cumplimiento, pruebas y veredictos
description: Los tests de un control, qué falló y cómo corregirlo, y el veredicto del administrador sobre una prueba manual.
type: contract
---

# Cumplimiento — pruebas y veredictos

**Contexto común** (quién puede qué, estado general y la tabla de permisos de los tres contratos de validación y auditoría): [`README.md`](README.md).

## Tests y veredictos

### `GET /v1/controls/{id}/tests`

La vista técnica de un control: los tests que lo verifican, **todos con su estado**, también los que aún no tienen activos conectados («Sin activos»). La piden `admin_empresa` (D81, mientras los permisos por pantalla sigan abiertos: `P3`) y `auditor`; el `funcional`, `403`. Ver no es hacer: el veredicto es del `admin_empresa`. Paginada.

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

`state` es `test_state`. `shared_with` son los **otros** controles del servicio que llevan el test: su veredicto vale en todos (D85). **En un test documental (`dimension: "policy"`) va siempre vacío:** su estado es de este control y sale de las
evidencias de este control que le aplican (D88); `state` ya no es fijo `pending`. `display_name` es el nombre neutro (D70); el texto del comité no sale. `ai_suggestion` es `null` o una sugerencia **marcada como de la IA**: nunca decide.

### `GET /v1/controls/{control_id}/tests/{test_id}/findings` — qué falló y cómo corregirlo (D90)

De una **prueba automática de nube** de un control: las comprobaciones que fallaron, en qué recursos y cómo corregirlas. La leen `admin_empresa`, `auditor` y **el `funcional` responsable de esa prueba** (D96: es quien la repara; ve qué falló y cómo corregirlo, no la vista técnica completa); otro `funcional` y `admin_monkey`, `403`. Paginada (`page`, `page_size`), de la más grave a la menos.
Lo que lee: la **última corrida completada** de cada conexión de nube del servicio, solo los resultados `failed`, de los checks que alimentan esa prueba **con la misma regla que las evaluaciones** (los ratificados por el comité; con `READINESS_INCLUDE_PROPOSED=true`, también los propuestos). Un recurso descubierto que no es del servicio no se cuenta.

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

- `title` es la comprobación en positivo («lo que debería cumplirse»). `remediation` es **la guía de corrección** de esa comprobación, igual para todos los recursos; `null` si no hay una que se pueda mostrar.
- **Idioma y procedencia.** Sale en el idioma de la sesión. El catálogo trae el texto original en inglés; Monkey lo **traduce con IA** (`is_ai_generated: true`, la pantalla lo etiqueta como traducción automática hasta que alguien la revise). Si un check aún no tiene traducción, sale el original con `language: "en"`.
- **Nada nombra al motor (D70).** Ningún identificador del motor sale (ni el código del check ni el tipo de recurso del motor). Un título o una guía que nombre al proveedor se omite (`null`, y el título cae a un texto neutro): es una red de seguridad, no una revisión. El mensaje por recurso que escribe el motor (`status_detail`) **no sale**: es texto crudo y en inglés (ver «Estado de implementación»).
- `resources` trae hasta 50 recursos por comprobación; `resources_total` dice cuántos son. `404` si el control no lleva la prueba o si la prueba no es de nube; sin corrida, `items: []` y `measured_at: null`.

### `POST /v1/controls/{control_id}/tests/{test_id}/verdicts` — el veredicto

Solo `admin_empresa`; cualquier otro rol, `403`. Aplica a las pruebas **manuales que no son documentales** (p. ej. la validación manual complementaria de una prueba técnica); una automática la resuelve la sonda (`409 TEST_NOT_MANUAL`) y una **documental se resuelve revisando
su evidencia** (`PUT /v1/evidence-submissions/{id}/review`): sobre ella responde `409 TEST_DECIDED_BY_EVIDENCE` (D88).
**El veredicto es del test en el servicio, no del control** (D85, RN-13): `control_id` es el control desde el que se da (el de origen) y el veredicto cuenta en **todos los controles del servicio que llevan ese test**. La evidencia que lo sustenta es la de `GET /v1/controls/{control_id}/tests/{test_id}/evidence` (`contracts/cumplimiento/evidencia.md`).

```json
{ "result": "compliant", "note": "Las tres revisiones del período están firmadas por la dirección." }
```

Si el **control de origen** tiene **observaciones abiertas** (criterio provisional, D85: cuentan solo las de ese control y solo las que están `open`; una respondida, una cerrada, una de otro control o de un servicio completo no piden nada), el veredicto exige además la razón por la que se da igual. Sin ella, `422 closure_reason.required` y no se escribe ninguna evaluación. La razón en blanco no vale:

```json
{ "result": "compliant", "closure_observation_reason": "La observación abierta es de forma y no afecta al control.", "note": "…" }
```

`result`: `compliant` · `non_compliant`. Responde `201`: queda **una evaluación nueva e inmutable** (la anterior se conserva) con quién la confirmó.

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

Un test sin veredicto está `pending` y **no cuenta como cumplido**. `GET /v1/controls/{control_id}/tests/{test_id}/verdicts` lista el historial (paginado; `admin_empresa` y `auditor`).

## Errores

Los errores comunes (`FORBIDDEN`, `NOT_FOUND`, `VALIDATION_FAILED`) están en [`README.md`](README.md#errores-comunes); aquí solo los propios.

| HTTP | `error.code` | Cuándo |
|---|---|---|
| 409 | `TEST_NOT_MANUAL` | Dar un veredicto sobre un test automático |
| 409 | `TEST_DECIDED_BY_EVIDENCE` | Dar un veredicto sobre un test documental: se resuelve revisando su evidencia (D88) |
| 409 | `TEST_HAS_NO_ASSETS` | El servicio no tiene activos de la dimensión del test: no hay sobre qué dar el veredicto |

Claves i18n: `control_test.list`, `verdict.issued`, `verdict.list`.

## Ejemplos de error

Todos con el mismo sobre (`conventions.md`); `message` es la clave i18n del error.

**`409` — veredicto sobre un test automático**

```json
{
  "statusCode": 409,
  "message": "verdict.test_not_manual",
  "data": null,
  "error": {
    "code": "TEST_NOT_MANUAL"
  }
}
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
      {
        "field": "closure_observation_reason",
        "code": "closure_reason.required",
        "message": "Hay observaciones abiertas: indica por qué das el veredicto igual."
      }
    ]
  }
}
```

## Auditoría

| `action` | Cuándo | Quién |
|---|---|---|
| `test_verdict.issue` | veredicto de un test (también deja el evento `control.state` de cada control que cambie de estado, D91) | `admin_empresa` |

## Estado de implementación

**Construido (2026-10-28, B66):**

- **Veredicto.** `POST` solo `admin_empresa`, `GET` del historial `admin_empresa` y `auditor`.
- **Pruebas documentales por control (D88).** El estado sale de la revisión del `admin_empresa`.

**Construido (MD-177, 2026-10-29): `GET /v1/controls/{id}/tests`.** Todas las pruebas del control ordenadas por código y paginadas (`page`, `page_size`, máx. 100), con `state` (el del motor), `type` (cómo se resuelve su dimensión en este control: `manual`, `automated`, `hybrid` o `technical_manual`), `is_mandatory`, `is_active` y `display_name` neutro. `shared_with` son los otros controles **vigentes** del servicio que llevan la prueba (D85, ordenados por código), siempre vacío en una documental (D88). `last_verdict` es `{ result, evaluated_at, confirmed_by }` del último veredicto del `admin_empresa` o `null`; `ai_suggestion` es siempre `null` porque la IA no escribe aquí. Solo `admin_empresa` y `auditor`; el `funcional` y `admin_monkey` reciben `403`. Pruebas: `test/cumplimiento/evidencia-por-test.e2e-spec.ts`. La evidencia de cada test está en `contracts/cumplimiento/evidencia.md`.

## Preguntas abiertas

- Las generales del grupo están en [`README.md`](README.md).
