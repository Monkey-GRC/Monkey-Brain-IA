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
| `GET` | [`/v1/controls/{control_id}/tests/{test_id}/findings`](brechas.md) | `admin_empresa` · `auditor` · dueño y ejecutor | Las brechas de una prueba (D138; contrato en `brechas.md`) |

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

### Las brechas de una prueba se movieron

Desde MD-502 es el **mensaje de brecha** (D138, RC-18): ver [`brechas.md`](brechas.md).

## Errores del módulo

Los errores comunes (`FORBIDDEN`, `NOT_FOUND`, `VALIDATION_FAILED`) están en [`README.md`](README.md#errores-comunes). Los de registrar un resultado manual (`TEST_NOT_MANUAL`, `result.invalid`, `note.required`) están en [`aprobacion.md`](aprobacion.md).

## Preguntas abiertas

- Las generales del grupo están en [`README.md`](README.md).

---

## Estado de implementación

**Retirado en MD-504 (2026-11-25):** `POST /v1/controls/{c}/tests/{t}/verdicts`, `PUT /v1/verdicts/{id}/review`, `GET …/verdicts`, el campo `last_verdict` de `GET /v1/controls/{id}/tests`, y las tablas `test_verdicts` y `test_verdict_reviews`. El resultado manual y la aprobación viven en [`aprobacion.md`](aprobacion.md).

**Construido (MD-177, 2026-10-29): `GET /v1/controls/{id}/tests`.** Todas las pruebas del control ordenadas por código y paginadas (`page`, `page_size`, máx. 100), con `state` (el del motor), `type`, `is_mandatory`, `is_active` y `display_name` neutro. `shared_with` son los otros controles **vigentes** del servicio que llevan la prueba (D85, ordenados por código), siempre vacío en una documental (D88). `ai_suggestion` es siempre `null` porque la IA no escribe aquí. Solo `admin_empresa` y `auditor`; `responsable`, `delegado` y `admin_monkey` reciben `403`. Pruebas: `test/cumplimiento/evidencia-por-test.e2e-spec.ts`. La evidencia de cada test está en `evidencia.md`.

**Control dado de baja (D119).** Sigue leyéndose con la misma regla de alcance.
