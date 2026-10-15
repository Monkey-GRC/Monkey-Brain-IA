---
id: contracts-compliance-overview
name: Contrato — Cumplimiento, resumen del servicio y evaluaciones
description: El cumplimiento de un servicio por marco, categoría y control que falla, y la evaluación que emiten el consultor y el auditor.
type: contract
---

# Cumplimiento — resumen del servicio y evaluaciones

**Estado: PROPUESTA (2026-10-14; D80 el 2026-10-15).** Ver `conventions.md` (sección «Cumplimiento») y `enums.md`. Tickets: MD-137, MD-138, MD-139, MD-155.

**Qué es.** El cumplimiento se mide por **servicio × marco**; nunca existe un número de toda la empresa. Los estados salen del motor del comité (`modelo-datos.md` §9, D68) y **se derivan, no se guardan como atributo del marco**.
**Entidades:** `service_frameworks` (la evaluación del servicio), `framework_assessments` (§7.5). **App:** Monkey Platform.

## Quién puede qué

| Acción | `admin_empresa` | `funcional` | `consultor` | `auditor` |
|---|---|---|---|---|
| Ver el resumen (vista de negocio) | ✓ | **solo lo de sus controles** | ✓ | ✓ |
| Pedir `view=technical` | `403` | `403` | ✓ | ✓ |
| Emitir una evaluación | `403` | `403` | ✓ **solo la suya** | ✓ **solo la suya** |
| Ver las evaluaciones emitidas | `P3` | `P3` | ✓ | ✓ |

Qué ve el cliente de las evaluaciones del consultor y del auditor **no está decidido** (D77, `P3`): hasta entonces la vista de negocio **no las incluye** y `GET …/assessments` le responde `403`.

## `GET /v1/services/{service_id}/compliance-overview`

Un bloque por **marco contratado**. Dentro, solo las categorías **en alcance** (Seguridad siempre lo está en SOC 2). Cada nivel trae el semáforo, el avance y la cobertura **por separado**.

```json
{
  "statusCode": 200,
  "message": "compliance.overview",
  "data": {
    "service_id": "55aa…",
    "frameworks": [
      {
        "framework_code": "soc2",
        "name": "SOC 2",
        "readiness": "needs_work",
        "progress": { "done": 62, "total": 80 },
        "coverage": { "measured": 70, "applicable": 80 },
        "evaluation": {
          "catalog_version": "2026.10",
          "period_start": "2026-01-01",
          "period_end": "2026-12-31",
          "cutoff_date": "2026-10-14"
        },
        "categories": [
          {
            "trust_criterion": "security",
            "readiness": "needs_work",
            "progress": { "done": 40, "total": 52 },
            "coverage": { "measured": 46, "applicable": 52 },
            "failing_controls": [
              {
                "control_id": "3f1c…",
                "code": "IAC-12",
                "requirement_codes": ["CC6.1", "CC6.2"],
                "own_code": null,
                "name": "Gestión de accesos de usuarios",
                "readiness": "needs_work",
                "failing": [
                  { "dimension": "cloud", "affected": [ { "kind": "asset", "id": "8f10…", "name": "cuenta-aws-produccion" } ] },
                  { "dimension": "policy", "affected": [ { "kind": "test", "id": "21ab…", "display_name": "Revisión periódica de accesos" } ] }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}
```

- `readiness`: `ready` · `almost_ready` · `needs_work` · `not_measured` (`enums.md`). `progress` y `coverage` son conteos; **el porcentaje no viaja**: la pantalla lo deriva y lo muestra junto al estado y a la cobertura (`conventions.md`, D80). Un marco con todo lo medido cumpliendo pero cobertura baja **no** es `ready`.
- `progress` del marco cuenta **controles únicos** (un control compartido entre categorías cuenta una vez); el de la categoría, los controles de esa categoría.
- `failing_controls` trae **solo lo que no cumple**, con su `code` y los `requirement_codes` que cubre (D80), en qué falla, y el activo o la prueba afectados. Un test aparece con `display_name`, nunca con el texto del comité ni con su código.
- `evaluation` es la evaluación del servicio: versión del catálogo, período auditado y fecha de corte. **Mientras no estén definidos** (`P26`), `evaluation` viene con esos campos en `null` y el marco con `readiness: "not_measured"`: el motor no ejecuta sin los cinco datos.
- Un servicio recién clonado, sin resultados, responde `not_measured` y la pantalla **no inventa ningún porcentaje** (sin total no hay porcentaje).
- Un `funcional` ve el marco y las categorías completos, pero `failing_controls` solo con los controles que tiene asignados.

### `?view=technical`

Solo `auditor` y `consultor`. Agrega `technical` a cada nivel, con los estados de evaluación de `enums.md`:

```json
{
  "framework_code": "soc2",
  "technical": {
    "state": "non_compliant",
    "unique_controls": 80,
    "failing": ["IAC-12", "MON-3"],
    "pending": ["IAC-4", "SEC-9"],
    "assessments": {
      "consultant": { "verdict": "not_ready", "issued_at": "2026-10-10T14:00:00Z" },
      "auditor": null
    }
  },
  "categories": [
    {
      "trust_criterion": "security",
      "technical": {
        "state": "non_compliant",
        "controls": [
          {
            "control_id": "3f1c…",
            "control_code": "IAC-12",
            "state": "ineffective",
            "progress": { "done": 3, "total": 5 },
            "blocking_tests": [ { "test_code": "T-SRV-001", "display_name": "Cuentas privilegiadas con doble factor", "state": "non_compliant" } ]
          }
        ]
      }
    }
  ]
}
```

- `state` del marco y de la categoría es `rollup_state`; el del control, `control_state`; el de un test, `test_state`. `failing` y `pending` son los códigos de los controles del marco que no cumplen y los que aún no se pueden decidir.
- `blocking_tests` son los tests que impiden que el control sea efectivo (REQ-026).

## Evaluaciones del consultor y del auditor (D77)

El **consultor prepara** a la empresa y el **auditor certifica**: cada uno emite su propia evaluación sobre los mismos datos. La del auditor **va aparte y no cambia el estado calculado**. Cada una queda ligada a la
**evaluación del servicio** (servicio + marco + versión + período + fecha de corte) para que diga sobre qué datos se hizo.

### `POST /v1/services/{service_id}/frameworks/{framework_code}/assessments`

El rol de quien emite lo pone el servidor (`assessor_role`); el cuerpo no lo lleva.

```json
{ "verdict": "ready", "rationale": "Las evidencias del período están completas y los accesos remediados." }
```

| Quien emite | `verdict` permitido |
|---|---|
| `consultor` | `ready` Lista para la auditoría · `not_ready` No lista |
| `auditor` | `certified` Certifica · `not_certified` No certifica |

Un valor del otro rol es `422 enum.invalid`. `rationale` es **obligatoria**.

```json
{
  "statusCode": 201,
  "message": "assessment.issued",
  "data": {
    "id": "4d20…",
    "service_id": "55aa…",
    "framework_code": "soc2",
    "assessor_role": "consultor",
    "verdict": "ready",
    "rationale": "Las evidencias del período están completas y los accesos remediados.",
    "evaluation": { "catalog_version": "2026.10", "period_start": "2026-01-01", "period_end": "2026-12-31", "cutoff_date": "2026-10-14" },
    "issued_by": { "id": "d5e6…", "name": "Camilo", "last_name": "Ortiz" },
    "issued_at": "2026-10-14T18:10:00Z",
    "is_current": true
  }
}
```

- **Una vez emitida no se edita ni se borra.** Para cambiar de opinión se emite otra; la vigente es la última de **ese rol** sobre esa evaluación (`is_current`). Cada rol emite solo la suya (SEG-56).
- Si la evaluación del servicio no tiene período o fecha de corte, `409 EVALUATION_NOT_DEFINED` (`P26`).

### `GET /v1/services/{service_id}/frameworks/{framework_code}/assessments`

`consultor` y `auditor` (los demás, `403`, hasta `P3`). Paginada, la más reciente primero; filtros `assessor_role`, `current` (`true`). Cada ítem es el objeto de arriba.

## Errores

| HTTP | `error.code` | Cuándo |
|---|---|---|
| 403 | `FORBIDDEN` | El rol no puede; `view=technical` sin ser `auditor`/`consultor`; emitir la evaluación del otro rol |
| 404 | `NOT_FOUND` | El servicio no existe para esta empresa, o el marco no está contratado por él |
| 409 | `EVALUATION_NOT_DEFINED` | Faltan el período o la fecha de corte de la evaluación del servicio |
| 422 | `VALIDATION_FAILED` | `required` (`rationale`), `enum.invalid` (`verdict`) |

Claves i18n: `compliance.overview`, `assessment.issued`, `assessment.list`.

## Ejemplos de error

Todos con el mismo sobre (`conventions.md`); `message` es la clave i18n del error.

**`422` — el auditor emite un valor que es del consultor**

```json
{
  "statusCode": 422,
  "message": "validation.failed",
  "data": null,
  "error": {
    "code": "VALIDATION_FAILED",
    "fields": [
      {
        "field": "verdict",
        "code": "enum.invalid",
        "message": "El valor no está entre las opciones permitidas."
      }
    ]
  }
}
```

**`409` — la evaluación del servicio no tiene período o fecha de corte**

```json
{
  "statusCode": 409,
  "message": "evaluation.not_defined",
  "data": null,
  "error": {
    "code": "EVALUATION_NOT_DEFINED"
  }
}
```

**`403` — un `admin_empresa` pide la vista técnica**

```json
{
  "statusCode": 403,
  "message": "common.forbidden",
  "data": null,
  "error": {
    "code": "FORBIDDEN"
  }
}
```

## Auditoría

| `action` | Cuándo |
|---|---|
| `framework_assessment.issue` | se emite una evaluación (con el veredicto y la evaluación del servicio) |

## Preguntas abiertas

- **`P26`**: quién define el período auditado y la fecha de corte, y cuándo. Mientras tanto el resumen responde `not_measured` y emitir una evaluación responde `409`.
- **`P3`**: qué ve el cliente de las evaluaciones.
- **Mitigación y riesgo residual**: no están aquí; entran con `P22` y MD-151 como campos opcionales.
