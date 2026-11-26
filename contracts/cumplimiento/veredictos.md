---
id: contracts-compliance-verdicts
name: Contrato — Cumplimiento, pruebas del control y qué falló
description: Los tests de un control y qué falló y cómo corregirlo. El veredicto y su revisión se retiraron en MD-504; el resultado manual está en aprobacion.md.
type: contract
---

# Cumplimiento — pruebas del control y qué falló

> **MD-504 (2026-11-25): el veredicto se retiró.** `POST …/verdicts`, `PUT /v1/verdicts/{id}/review`, `GET …/verdicts` y el campo `last_verdict` ya no existen. El resultado de una prueba manual lo registra el responsable por control (D140) y la aprobación es del control (D132): ver [`aprobacion.md`](aprobacion.md). Aquí queda lo que sigue vivo: los tests del control y qué falló.

| | |
|---|---|
| **Estado** | **ACORDADO** (D96), construido (2026-10-28, B66 y MD-177). El veredicto y su revisión en dos niveles (D102, D121) se retiraron en MD-504 |
| **App** | Monkey Platform |
| **Contexto común** | Quién puede qué, estado general y errores comunes: [`README.md`](README.md) |
| **Entidades** | `evaluations`, `client_control_tests` (`modelo-datos.md` §7.4, §7.5, §9) · enums: [`enums.md`](../enums.md) (`test_state`) |

## Índice de endpoints

| Método | Ruta | Quién | Para qué |
|---|---|---|---|
| `GET` | [`/v1/controls/{id}/tests`](#get-v1controlsidtests--los-tests-de-un-control) | `admin_empresa` · `auditor` | Los tests de un control, con su estado |
| `GET` | [`/v1/controls/{control_id}/tests/{test_id}/findings`](#get-v1controlscontrol_idteststest_idfindings--qué-falló-y-cómo-corregirlo) | `admin_empresa` · `auditor` · dueño y ejecutor | Qué falló y cómo corregirlo (D90) |

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
| `type` | enum `test_type` \| null | El tipo de la prueba en el catálogo v2: `documentary`, `population`, `operational` o `technical` (MD-491; antes era el `control_type` de su dimensión) |
| `is_mandatory`, `is_active` | boolean | |
| `shared_with[]` | `{ id, code }` | Los **otros** controles vigentes del servicio que llevan el test (D85); su estado es de cada control (D129). **Siempre vacío en un test documental** (D88) |
| `state` | enum `test_state` | Un test documental sale de las evidencias de este control (D88), no es fijo `pending` |
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
        "ai_suggestion": { "is_ai_generated": true, "ai_confidence": 0.74, "verdict": "compliant", "rationale": "Las tres revisiones del período están firmadas." }
      }
    ],
    "page": 1, "page_size": 25, "total": 1, "total_pages": 1
  }
}
```

> Ver no es hacer: el resultado de una prueba manual se registra con `POST …/result` ([`aprobacion.md`](aprobacion.md#post-v1controlscontrol_idteststest_idresult--registrar-el-resultado-de-una-prueba-manual)).

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

## Errores del módulo

Los errores comunes (`FORBIDDEN`, `NOT_FOUND`, `VALIDATION_FAILED`) están en [`README.md`](README.md#errores-comunes). Los de registrar un resultado manual (`TEST_NOT_MANUAL`, `result.invalid`, `note.required`) están en [`aprobacion.md`](aprobacion.md).

## Preguntas abiertas

- Las generales del grupo están en [`README.md`](README.md).

---

## Estado de implementación

**Retirado en MD-504 (2026-11-25):** `POST /v1/controls/{c}/tests/{t}/verdicts`, `PUT /v1/verdicts/{id}/review`, `GET …/verdicts`, el campo `last_verdict` de `GET /v1/controls/{id}/tests`, y las tablas `test_verdicts` y `test_verdict_reviews`. El resultado manual y la aprobación viven en [`aprobacion.md`](aprobacion.md).

**Construido (MD-177, 2026-10-29): `GET /v1/controls/{id}/tests`.** Todas las pruebas del control ordenadas por código y paginadas (`page`, `page_size`, máx. 100), con `state` (el del motor), `type`, `is_mandatory`, `is_active` y `display_name` neutro. `shared_with` son los otros controles **vigentes** del servicio que llevan la prueba (D85, ordenados por código), siempre vacío en una documental (D88). `ai_suggestion` es siempre `null` porque la IA no escribe aquí. Solo `admin_empresa` y `auditor`; `responsable`, `delegado` y `admin_monkey` reciben `403`. Pruebas: `test/cumplimiento/evidencia-por-test.e2e-spec.ts`. La evidencia de cada test está en `evidencia.md`.

**Control dado de baja (D119).** Sigue leyéndose con la misma regla de alcance.
