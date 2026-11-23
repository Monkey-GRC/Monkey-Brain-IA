---
id: contracts-compliance-overview
name: Contrato — Cumplimiento, resumen del servicio y evaluaciones
description: El cumplimiento de un servicio por marco, categoría y control que falla, y el período y la fecha de corte de su evaluación.
type: contract
---

# Cumplimiento — resumen del servicio

> **VF18 (D128): este contrato describe la API construida con el catálogo v1.** Con la VF18 un control cuenta como cumplido solo en «Cumplimiento aprobado» (D130, D132) y el período auditado dura 6 meses como mínimo (D131). Se ajusta antes de construir RC-06 y RC-08.

| | |
|---|---|
| **Estado** | **ACORDADO** (2026-10-17; D80 el 2026-10-15). El período y la fecha de corte se definen con D87 (2026-10-20), definitiva desde D145. Reescrito por D96 (2026-10-27): la evaluación del auditor está en pausa. D102 (2026-11-03) limita el resumen de un `responsable` o `delegado` a **sus controles** |
| **App** | Monkey Platform |
| **Entidades** | `service_frameworks` (la evaluación del servicio; `framework_assessments`, §7.5, queda sin uso por D96) |
| **Tickets** | MD-137, MD-138, MD-139, MD-168 (MD-155, las evaluaciones, en pausa) · sprint 3: MD-193 |
| **Contexto común** | [`README.md`](README.md) · convenciones (sección «Cumplimiento»): [`conventions.md`](../conventions.md) · enums: [`enums.md`](../enums.md) |

**Qué es.** El cumplimiento se mide por **servicio × marco**; nunca existe un número de toda la empresa. Los estados salen del motor del comité (`modelo-datos.md` §9, D68) y **se derivan, no se guardan como atributo del marco**.

## Índice de endpoints

| Método | Ruta | Quién | Para qué |
|---|---|---|---|
| `GET` | [`/v1/services/{service_id}/compliance-overview`](#get-v1servicesservice_idcompliance-overview--el-resumen-del-servicio) | `admin_empresa` · `auditor` (todo) · `responsable`, `delegado` (solo lo suyo) | El cumplimiento del servicio por marco y categoría |
| `PUT` | [`/v1/services/{service_id}/frameworks/{framework_code}/evaluation-period`](#put-v1servicesservice_idframeworksframework_codeevaluation-period--declarar-el-período-y-la-fecha-de-corte) | `admin_empresa` | Declarar el período y la fecha de corte (D87) |

## Quién puede qué

| Acción | `admin_empresa` | `responsable` y `delegado` | `auditor` |
|---|---|---|---|
| Ver el resumen (vista de negocio) | ✓ | **solo lo de sus controles** | ✓ |
| Pedir `view=technical` | ✓ (D81) | `403` | ✓ |
| Declarar el período y la fecha de corte (D87) | ✓ | `403` | `403` |

> La **evaluación del auditor** (D77) está **en pausa** (D96): no se emiten ni se leen, y `GET …/assessments` y `POST …/assessments` no existen. Volverá según el Excel (`P35`). La tabla `framework_assessments`, `enums.md` (`assessor_role`, `assessment_verdict`) y el campo `assessments` de la vista técnica **no se usan**.

---

### GET /v1/services/{service_id}/compliance-overview — El resumen del servicio

| | |
|---|---|
| **Quién** | `admin_empresa` y `auditor` (todo) · `responsable` y `delegado` (solo **sus controles**, D102) |
| **Éxito** | `200` |
| **Errores** | `403` (`view=technical` sin ser `admin_empresa` o `auditor`) · `404` (el servicio no existe para esta empresa, o el marco no está contratado por él) |

Un bloque por **marco contratado**. Dentro, solo las categorías **en alcance** (Seguridad siempre lo está en SOC 2). Cada nivel trae el semáforo, el avance y la cobertura **por separado**.

#### Parámetros (query)
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `view` | string | no | `technical` agrega el objeto `technical` (solo `auditor` y `admin_empresa`) |

#### Response `200`
| Campo | Tipo | Qué es |
|---|---|---|
| `service_id` | uuid | |
| `frameworks[].framework_code`, `name` | string | |
| `frameworks[].readiness` | enum `readiness` | `ready` · `almost_ready` · `needs_work` · `not_measured` |
| `frameworks[].progress` | `{ done, total }` | Conteo de **controles únicos** (un control compartido entre categorías cuenta una vez). **El porcentaje no viaja:** la pantalla lo deriva |
| `frameworks[].coverage` | `{ measured, applicable }` | |
| `frameworks[].evaluation` | objeto | Versión del catálogo, período auditado y fecha de corte (ver abajo) |
| `frameworks[].categories[]` | objeto | `trust_criterion`, `readiness`, `progress`, `coverage` y `failing_controls[]` |
| `…failing_controls[]` | objeto | `control_id`, `code`, `requirement_codes`, `own_code`, `name`, `readiness` y `failing[]` (en qué falla: `dimension` y los afectados, un activo o un test) |

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

> `catalog_version` viaja como texto del número de versión del catálogo (`"3"`), no como `"2026.10"` del ejemplo.

#### Reglas
- **`readiness` y cobertura.** Un marco con todo lo medido cumpliendo pero cobertura baja **no** es `ready`. El semáforo se muestra junto al porcentaje y a la cobertura (`conventions.md`, D80).
- **`progress` del marco** cuenta controles únicos; el de la categoría, los controles de esa categoría.
- **`failing_controls`** trae **solo lo que no cumple**, con su `code` y los `requirement_codes` que cubre (D80), en qué falla y el activo o la prueba afectados. Un test aparece con `display_name`, nunca con el texto del comité ni con su código (en la vista técnica sí viaja `test_code`). `own_code` solo en un control propio.
- **`evaluation` sin definir (D87).** Mientras no esté definido el período (se declara con `PUT …/evaluation-period`), `evaluation` viene con sus cinco campos en `null`, el marco y sus categorías en `not_measured`, `progress.done` y `coverage.measured` en 0 y `failing_controls` vacío: el motor no ejecuta sin los cinco datos. **Un servicio nuevo nace sin período.**
- **`cutoff_date` y `cutoff_frozen` (D87).** Con el período definido, `cutoff_date` siempre trae una fecha. Si la empresa no fijó ninguna, es **hoy** (sin salirse del período: nunca antes del inicio ni después del fin; si el período ya terminó, es el fin; si aún no empieza, el inicio) y `cutoff_frozen` es `false`; si se fijó una (o la congeló una evaluación emitida, MD-155), es esa fecha y `cutoff_frozen` es `true`. La fecha de corte **no reinicia nada** (no borra evidencia ni veredictos ni vuelve a medir) y hoy **no filtra ningún cálculo**: es la etiqueta de la evaluación.
- **Un servicio recién clonado, sin resultados,** responde `not_measured` y la pantalla **no inventa ningún porcentaje** (sin total no hay porcentaje).
- **`responsable` y `delegado` (D102, D118).** El resumen que reciben es el de **sus controles**: los vigentes de los que son dueño o ejecutor activo (`client_control_assignments`). Nunca reciben el avance de la empresa; el resumen completo es del `admin_empresa` y del `auditor`. Se calcula con el mismo motor, pero solo sobre esos controles:
  - **Marcos:** solo los que tienen al menos un control suyo. Si no tienen ninguno en el servicio, `frameworks` llega vacío (`200`, no falla).
  - **Categorías:** solo las que tienen al menos un control suyo. **La categoría obligatoria no se fuerza:** si no tienen controles en Seguridad, Seguridad no sale.
  - **`readiness`, `progress` y `coverage`** del marco y de cada categoría cuentan solo sus controles, con las mismas reglas de esta sección. `failing_controls` trae solo los suyos.
  - **`evaluation`** (versión, período y fecha de corte) es la del servicio, igual que para el `admin_empresa`.
- **Qué cae en cada categoría.** Un control del catálogo, por los requisitos a los que sirve (marco y categoría del requisito); uno propio, en la categoría que eligió la empresa y en todos los marcos del servicio. Una categoría está en alcance si es obligatoria (Seguridad en SOC 2) o si el servicio la contrató; solo salen las que tienen controles, salvo la obligatoria.
- **Semáforo del marco y de la categoría.** `not_measured` si nada se pudo decidir; `ready` si todos los controles son efectivos; `almost_ready` si nada falla (solo falta decidir) o el avance llega al 80 %; `needs_work` si no (cortes de un control, D62). **El estado técnico manda sobre el semáforo:** con un solo control que no cumple, `technical.state` es `non_compliant` aunque el semáforo diga «Casi listo». `coverage.measured` cuenta los controles ya decididos (efectivos, no efectivos y vencidos).

#### Vista técnica (`?view=technical`)
`auditor` y `admin_empresa` (D81, D96); el `responsable` y el `delegado`, `403`. Agrega `technical` a cada nivel, con los estados de evaluación de `enums.md`.

| Campo | Tipo | Qué es |
|---|---|---|
| `technical.state` (marco y categoría) | enum `rollup_state` | |
| `technical.unique_controls` | integer | Solo en el marco |
| `technical.failing`, `technical.pending` | string[] | Códigos de los controles del marco que no cumplen y los que aún no se pueden decidir |
| `categories[].technical.controls[]` | objeto | `control_id`, `control_code`, `state` (enum `control_state`), `progress` y `blocking_tests[]` |
| `blocking_tests[]` | `{ test_code, display_name, state }` | Tests que impiden que el control sea efectivo (REQ-026); `state` es `test_state` |

```json
{
  "framework_code": "soc2",
  "technical": {
    "state": "non_compliant",
    "unique_controls": 80,
    "failing": ["IAC-12", "MON-3"],
    "pending": ["IAC-4", "SEC-9"]
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

---

### PUT /v1/services/{service_id}/frameworks/{framework_code}/evaluation-period — Declarar el período y la fecha de corte

| | |
|---|---|
| **Quién** | `admin_empresa` (los demás roles y `admin_monkey`, `403`) |
| **Éxito** | `200` |
| **Errores** | `403` · `404` · `422 VALIDATION_FAILED` |

Declara o cambia el **período auditado** de un marco del servicio y, si se quiere, **congela la fecha de corte** (D87, MD-168). Reemplaza lo anterior (es `PUT`: lo que no viene queda sin valor) y se puede repetir sin efecto extra.

> **Cliente de Platform (D105, 2026-11-07).** La pantalla ya no ofrece congelar la fecha de corte: manda siempre `cutoff_date: null` (siempre «hoy», y eso descongela cualquier corte previo) y no la muestra. Lo que sí se muestra es la fecha y hora de la última revisión automática. El campo sigue en el contrato hasta que Backend decida retirarlo.

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `period_start` | date `AAAA-MM-DD` | sí | ≤ `period_end`; **pueden ser el mismo día** (SOC 2 Tipo I, una fecha puntual) |
| `period_end` | date | sí | |
| `cutoff_date` | date \| null | no | **Ausente o `null` = «hoy»** (y borra una fecha congelada anterior); con valor, queda **congelada** en esa fecha. Debe caer dentro del período y no estar en el futuro |

```json
{ "period_start": "2026-01-01", "period_end": "2026-12-31", "cutoff_date": null }
```

#### Response `200`
El mismo bloque `evaluation` del resumen, con `framework_code`.

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

#### Errores propios
| HTTP | Código | Cuándo |
|---|---|---|
| 422 | `period.invalid_range` | `period_start` > `period_end` (en `period_end`) |
| 422 | `cutoff.out_of_period` | La `cutoff_date` explícita cae fuera del período |
| 422 | `cutoff.in_future` | La `cutoff_date` está en el futuro: no hay datos de un día que no ha llegado |
| 404 | `NOT_FOUND` | El marco no está contratado y activo en el servicio (igual que si el servicio no es de la empresa) |

> Con el período definido deja de responder `409 EVALUATION_NOT_DEFINED` proponer una exclusión (vence en el `period_end`) y el resumen deja de responder `not_measured` por esta causa.

---

## Errores del módulo

| HTTP | `error.code` | Cuándo |
|---|---|---|
| 403 | `FORBIDDEN` | El rol no puede; `view=technical` sin ser `admin_empresa` o `auditor` |
| 404 | `NOT_FOUND` | El servicio no existe para esta empresa, o el marco no está contratado por él |
| 409 | `EVALUATION_NOT_DEFINED` | Faltan el período o la fecha de corte de la evaluación del servicio |
| 422 | `VALIDATION_FAILED` | En el período: `required`, `date.invalid`, `period.invalid_range`, `cutoff.out_of_period`, `cutoff.in_future` |

**Claves i18n:** `compliance.overview`, `evaluation_period.updated`.

### Ejemplos de error

Todos con el mismo sobre (`conventions.md`); `message` es la clave i18n del error.

**`409` — la evaluación del servicio no tiene período o fecha de corte**
```json
{ "statusCode": 409, "message": "evaluation.not_defined", "data": null, "error": { "code": "EVALUATION_NOT_DEFINED" } }
```

**`403` — un `responsable` o `delegado` pide la vista técnica**
```json
{ "statusCode": 403, "message": "common.forbidden", "data": null, "error": { "code": "FORBIDDEN" } }
```

## Auditoría

| `action` | Cuándo |
|---|---|
| `evaluation_period.set` | Se declara o cambia el período o la fecha de corte de un marco (valor anterior y nuevo, dentro de la misma transacción) |

## Preguntas abiertas

- ~~`P26`~~ cerrada por D145: solo Tipo II; al terminar un período se abre el siguiente y el anterior queda como histórico (hoy hay una sola fila por servicio y marco: cambia con MD-500).
- **`P35`:** la calificación del auditor (en pausa).
- **Mitigación y riesgo residual:** no están aquí; entran con D134 (RC-11) como campos opcionales.

---

## Estado de implementación

**Construido: `GET /v1/services/{service_id}/compliance-overview` (MD-137, 2026-10-17)**, con la vista de negocio y `?view=technical`. Lo calcula con el motor del comité (`domain/engine/`) sobre los mismos datos que la lista de controles.

- **Período y fecha de corte (MD-168, construido 2026-10-20).** `PUT …/evaluation-period`, solo `admin_empresa`. Se guarda en `service_frameworks` (`period_start`, `period_end`, `cutoff_date`); lo del servicio de otra empresa o un marco no contratado o inactivo responde `404`. **«Definido» es inicio y fin:** la fecha de corte guardada ya no hace falta. Cada cambio deja `evaluation_period.set` en el rastro con el valor anterior y el nuevo, en la misma transacción. Pruebas: `test/cumplimiento/periodo.e2e-spec.ts` y la lógica pura en `domain/periods/evaluation-period.ts`.
- **Sin construir de esto:** pedir el período al contratar el marco o crear el servicio (hoy el onboarding solo pide `evaluation_period`, un texto, DT-16).
- **Vista técnica.** La piden `auditor` y `admin_empresa` (D81, D96); el `responsable`, el `delegado` y `admin_monkey` reciben `403`.
- **`responsable` y `delegado` (D102, D118): construido en MD-193 (2026-11-17).** El resumen se calcula solo con sus controles, con los marcos y las categorías donde tienen alguno. Pruebas: `test/cumplimiento/resumen.e2e-spec.ts`.
- **Evaluación del auditor (MD-155): retirada del Backend el 2026-10-28 (D96).** Ya no existen `POST` ni `GET …/assessments`, ni el campo `assessments` de la vista técnica, ni el `409 EVALUATION_ALREADY_ISSUED`: la fecha de corte y el período se pueden cambiar siempre. Las tablas `framework_assessments` y sus enums quedan sin uso y sin borrarse; `SEG-56` está retirado.
- **Pendiente:** lo que resta de `DT-50` (el `error` de un test automatizado sigue guardándose como `pending`). La sonda de servidores ya escribe `evaluations` al guardar una lectura (D113). **El motor de nube ya los escribe (2026-10-22):** tras una corrida de la cuenta, el resumen sale con el avance, la cobertura y los controles que fallan; sin corrida, «Sin medir».
