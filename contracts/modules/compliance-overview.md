---
id: contracts-compliance-overview
name: Contrato — Cumplimiento, resumen del servicio y evaluaciones
description: El cumplimiento de un servicio por marco, categoría y control que falla, y la evaluación que emiten el consultor y el auditor.
type: contract
---

# Cumplimiento — resumen del servicio y evaluaciones

**Estado: ACORDADO (2026-10-17; D80 el 2026-10-15), salvo lo que espera `P3` (qué ve el cliente de las evaluaciones). El período y la fecha de corte (`P26`) se definen de forma provisional con D87 (2026-10-20).** Ver `conventions.md` (sección «Cumplimiento») y `enums.md`. Tickets: MD-137, MD-138, MD-139, MD-155, MD-168.

**Qué es.** El cumplimiento se mide por **servicio × marco**; nunca existe un número de toda la empresa. Los estados salen del motor del comité (`modelo-datos.md` §9, D68) y **se derivan, no se guardan como atributo del marco**.
**Entidades:** `service_frameworks` (la evaluación del servicio), `framework_assessments` (§7.5). **App:** Monkey Platform.

## Quién puede qué

| Acción | `admin_empresa` | `funcional` | `consultor` | `auditor` |
|---|---|---|---|---|
| Ver el resumen (vista de negocio) | ✓ | **solo lo de sus controles** | ✓ | ✓ |
| Pedir `view=technical` | ✓ (D81) | `403` | ✓ | ✓ |
| Emitir una evaluación | `403` | `403` | ✓ **solo la suya** | ✓ **solo la suya** |
| Ver las evaluaciones emitidas | `P3` | `P3` | ✓ | ✓ |
| Declarar el período y la fecha de corte (D87) | ✓ | `403` | `403` (provisional: podrá corregirlo cuando trabaje sobre la empresa del cliente) | `403` |

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
          "cutoff_date": "2026-10-14",
          "cutoff_frozen": false
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
- `evaluation` es la evaluación del servicio: versión del catálogo, período auditado y fecha de corte. **Mientras no esté definido el período** (D87: se declara con `PUT …/evaluation-period`), `evaluation` viene con sus cinco campos en `null` y el marco con `readiness: "not_measured"`: el motor no ejecuta sin los cinco datos.
- **`cutoff_date` y `cutoff_frozen` (D87).** Con el período definido, `cutoff_date` siempre viene con una fecha. Si la empresa no fijó ninguna, es **hoy** (sin salirse del período: nunca antes del inicio ni después del fin) y `cutoff_frozen` es `false`; si se fijó una (o la congeló una evaluación emitida, MD-155), es esa fecha y `cutoff_frozen` es `true`. La fecha de corte **no reinicia nada**: no borra evidencia ni veredictos ni vuelve a medir.
- Un servicio recién clonado, sin resultados, responde `not_measured` y la pantalla **no inventa ningún porcentaje** (sin total no hay porcentaje).
- Un `funcional` ve el marco y las categorías completos, pero `failing_controls` solo con los controles que tiene asignados.

### `?view=technical`

`auditor`, `consultor` y, desde D81, `admin_empresa`; el `funcional`, `403`. Agrega `technical` a cada nivel, con los estados de evaluación de `enums.md`:

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

## `PUT /v1/services/{service_id}/frameworks/{framework_code}/evaluation-period` (D87, MD-168)

Declara o cambia el **período auditado** de un marco del servicio y, si se quiere, **congela la fecha de corte**. Solo `admin_empresa`. Reemplaza lo anterior (es `PUT`: lo que no viene queda sin valor) y se puede repetir sin efecto extra.

```json
{ "period_start": "2026-01-01", "period_end": "2026-12-31", "cutoff_date": null }
```

- `period_start` y `period_end` (`AAAA-MM-DD`) son obligatorios. **Pueden ser el mismo día** (SOC 2 Tipo I, una fecha puntual).
- `cutoff_date` es opcional. **Ausente o `null` = «hoy»** (y borra una fecha congelada anterior); con valor, queda **congelada** en esa fecha.

```json
{
  "statusCode": 200,
  "message": "evaluation_period.updated",
  "data": {
    "framework_code": "soc2",
    "catalog_version": "3",
    "period_start": "2026-01-01",
    "period_end": "2026-12-31",
    "cutoff_date": "2026-10-20",
    "cutoff_frozen": false
  }
}
```

La respuesta es el mismo bloque `evaluation` del resumen (con `framework_code`). Reglas:

- `period_start` ≤ `period_end`; si no, `422` con `period.invalid_range` en `period_end`.
- Una `cutoff_date` explícita debe caer **dentro del período** (`cutoff.out_of_period`) y **no estar en el futuro** (`cutoff.in_future`): no hay datos de un día que no ha llegado.
- El marco debe estar contratado y activo en el servicio; si no, `404 NOT_FOUND` (igual que si el servicio no es de la empresa).
- Con el período definido deja de responder `409 EVALUATION_NOT_DEFINED` proponer una exclusión (vence en el `period_end`) y el resumen deja de responder `not_measured` por esta causa.
- **Con una evaluación del consultor o del auditor emitida (MD-155)**, cambiar el período o la fecha de corte responde `409 EVALUATION_ALREADY_ISSUED` y no toca nada; repetir exactamente lo mismo se acepta.

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

Emitir el valor del otro rol es `403`; un valor que no existe, `422 enum.invalid`. `rationale` es **obligatoria**.

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
| 403 | `FORBIDDEN` | El rol no puede; `view=technical` sin ser `admin_empresa`, `auditor` o `consultor`; emitir la evaluación del otro rol |
| 404 | `NOT_FOUND` | El servicio no existe para esta empresa, o el marco no está contratado por él |
| 409 | `EVALUATION_NOT_DEFINED` | Faltan el período o la fecha de corte de la evaluación del servicio |
| 409 | `EVALUATION_ALREADY_ISSUED` | Cambiar el período o la fecha de corte de una evaluación del servicio sobre la que el consultor o el auditor ya emitió |
| 422 | `VALIDATION_FAILED` | `required` (`rationale`), `enum.invalid` (`verdict`, solo si el valor no existe); en el período: `required`, `date.invalid`, `period.invalid_range`, `cutoff.out_of_period`, `cutoff.in_future` |

Claves i18n: `compliance.overview`, `assessment.issued`, `assessment.list`, `evaluation_period.updated`, `evaluation_period.already_issued`.

## Ejemplos de error

Todos con el mismo sobre (`conventions.md`); `message` es la clave i18n del error.

**`403` — el auditor emite un valor que es del consultor**

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

**`422` — un valor que no existe**

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
| `evaluation_period.set` | se declara o cambia el período o la fecha de corte de un marco (valor anterior y nuevo, dentro de la misma transacción) |

## Estado de implementación

**Construido: `GET /v1/services/{service_id}/compliance-overview` (MD-137, 2026-10-17)**, con la vista de negocio y `?view=technical`. Lo calcula con el motor del comité (`domain/engine/`) sobre los mismos datos que la lista de controles.

- **Qué cae en cada categoría.** Un control del catálogo, por los requisitos a los que sirve (marco y categoría del requisito); uno propio, en la categoría que eligió la empresa y en todos los marcos del servicio. Una categoría está en alcance si es obligatoria (Seguridad en SOC 2) o si el servicio la contrató; solo salen las que tienen controles, salvo la obligatoria.
- **Semáforo del marco y de la categoría.** `not_measured` si nada se pudo decidir; `ready` si todos los controles son efectivos; `almost_ready` si nada falla (solo falta decidir) o el avance llega al 80 %; `needs_work` si no. Son los cortes de un control (D62). **El estado técnico manda sobre el semáforo**: con un solo control que no cumple, `technical.state` es `non_compliant` aunque el semáforo diga «Casi listo».
- **`progress` y `coverage`** son conteos de controles (el del marco, únicos). `coverage.measured` cuenta los controles ya decididos (efectivos, no efectivos y vencidos).
- **`evaluation` sin definir (D87).** Si falta el período (inicio o fin), `evaluation` va con sus cinco campos en `null`, el marco y sus categorías en `not_measured`, `progress.done` y `coverage.measured` en 0 y `failing_controls` vacío: el motor no ejecuta. **Un servicio nuevo nace sin período**: hasta que `admin_empresa` lo declare con `PUT …/evaluation-period`, responde «Sin medir».
- **Período y fecha de corte (MD-168, construido 2026-10-20).** `PUT /v1/services/{service_id}/frameworks/{framework_code}/evaluation-period`, solo `admin_empresa` (los demás roles y `admin_monkey`, `403`). Se guarda en `service_frameworks` (`period_start`, `period_end`, `cutoff_date`); lo del servicio de otra empresa o un marco no contratado o inactivo responde `404`. **«Definido» es inicio y fin**: la fecha de corte guardada ya no hace falta. `cutoff_date` guardada = congelada; vacía = **hoy** (UTC), sin salirse del período: si el período ya terminó, es el fin; si aún no empieza, el inicio. `cutoff_frozen` lo dice. Hoy la fecha de corte **no filtra ningún cálculo** (el motor no la usa): es la etiqueta de la evaluación. Cada cambio deja `evaluation_period.set` en el rastro con el valor anterior y el nuevo, en la misma transacción. Las pruebas: `test/cumplimiento/periodo.e2e-spec.ts` y la lógica pura en `domain/evaluation-period.ts`.
- **Sin construir de esto:** que el consultor lo corrija (B6); y pedir el período al contratar el marco o crear el servicio (hoy el onboarding solo pide `evaluation_period`, un texto, DT-16).
- **`catalog_version`** viaja como texto del número de versión del catálogo (`"3"`), no como `"2026.10"` del ejemplo.
- **Códigos (D80).** `failing_controls[].code` es siempre visible (el del catálogo o el propio) y `requirement_codes` también; `own_code` solo en un control propio. El nombre de un test sale neutro, nunca con el texto del comité; en la vista técnica sí viaja `test_code`.
- **Vista técnica.** `auditor`, `consultor` y `admin_empresa` (D81); el `funcional` y `admin_monkey` reciben `403`. `assessments` va `{ consultant: null, auditor: null }`: la tabla ya existe (MD-155), pero qué ve el cliente de ellas lo decide `P3` y esta vista también la pide `admin_empresa` (D81). Las leen `consultor` y `auditor` en `GET …/assessments`. `blocking_tests` son los tests del control que no cumplen ni están fuera de alcance.
- **`funcional`.** Ve el marco y las categorías completos; en `failing_controls` solo los que tiene asignados.
- **Evaluaciones del consultor y del auditor (MD-155, construido 2026-10-23).** `POST` y `GET …/assessments` (D77, `SEG-56`). El rol sale de la sesión y emitir el valor del otro rol es `403` (un valor inexistente, `422 enum.invalid`); `rationale` se recorta y no puede quedar vacía (también la base lo impone). Sin período, `409 EVALUATION_NOT_DEFINED`. **Emitir congela la fecha de corte** del marco si no lo estaba (`cutoff_date` y `cutoff_frozen: true` en el resumen) y la respuesta lleva esa fecha. `catalog_version` viaja como texto del número. `is_current` es la última de **ese rol** sobre la evaluación del servicio; `GET` filtra por `assessor_role` y `current=true`. No cambia el estado calculado: el resumen es idéntico antes y después. Rastro: `framework_assessment.issue`.
- **Pendiente:** lo que resta de `DT-50` (la sonda de servidores aún no escribe `evaluations`). **El motor de nube ya los escribe (2026-10-22):** tras una corrida de la cuenta, el resumen sale con el avance, la cobertura y los controles que fallan; sin corrida, «Sin medir».
## Preguntas abiertas

- **`P26`**: respondida **provisionalmente** (D87). Falta que el comité ratifique: si se vende SOC 2 **Tipo I**, qué pasa cuando **llega el período siguiente** (hoy una sola fila por servicio y marco) y el nombre («fecha de corte» aquí, «fecha de evaluación» en el Excel).
- **`P3`**: qué ve el cliente de las evaluaciones.
- **Mitigación y riesgo residual**: no están aquí; entran con `P22` y MD-151 como campos opcionales.
