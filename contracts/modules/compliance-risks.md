---
id: contracts-compliance-risks
name: Contrato — Cumplimiento, riesgos y causas
description: Gestionar los riesgos y las causas de un servicio, vincularlos con los controles, evaluar un riesgo en la matriz 5×5 y registrar su tratamiento.
type: contract
---

# Cumplimiento — riesgos y causas

**Estado: ACORDADO (2026-10-17); construida: riesgos, causas, vínculos, evaluación 5×5 y tratamiento (MD-122 y MD-123).** Ver `conventions.md` (sección «Cumplimiento») y `enums.md`. Tickets: MD-122, MD-123.

**Qué es.** Al contratar un marco, cada servicio recibe **su propia copia** de los riesgos y causas del catálogo (D28): editarla no cambia el catálogo ni a otra empresa. Un *riesgo* es la
probabilidad y el impacto de que algo ocurra o se pierda si una persona lo materializa; una *causa* es el riesgo materializado; un *control* es el paso a paso que lo evita o lo mitiga (vocabulario del comité,
D76). **Entidades:** `client_risks`, `client_causes`, `client_risk_causes`, `client_cause_controls`, `risk_treatments`, `organization_responsibles` (`modelo-datos.md` §7.2).
**App:** Monkey Platform. En las pantallas se llaman «Riesgos» y «Causas» (D80: vocabulario del dominio; se retiran «lo que podría salir mal» y «por qué podría pasar»).

**Fuera de este contrato.** La **mitigación** (estados de causa y riesgo) y el **riesgo residual** con sus dos matrices son vista del consultor y del auditor y esperan los datos y la fórmula del comité
(`P22`, MD-151): cuando existan, se agregan como campos opcionales de la respuesta, sin romper nada de lo de aquí.

## Quién puede qué

| Acción | `admin_empresa` | `funcional` | `consultor` | `auditor` |
|---|---|---|---|---|
| Listar y ver | todos | **solo los que llegan a una acción asignada** | todos | todos |
| Crear, editar, dar de baja, vincular | ✓ | `403` | `403` | `403` |
| Evaluar (5×5) y tratar | ✓ | `403` | `403` | `403` |

Sigue la matriz §5.5 (`P3`). **Discrepancia a confirmar:** el ticket MD-122 deja al `funcional` editar «lo suyo», pero la matriz solo le da lectura; este contrato sigue la matriz.

## Riesgos

### `GET /v1/services/{service_id}/risks`

Paginada. Filtros: `trust_criterion` (`risk_criterion`, 11 valores), `inherent_risk_level` (`risk_level`), `evaluated` (`true`/`false`), `origin` (`catalog`/`own`), `include_inactive`.

```json
{
  "statusCode": 200,
  "message": "risk.list",
  "data": {
    "items": [
      {
        "id": "c1a7…",
        "code": "R001",
        "name": "Acceso no autorizado a información sensible",
        "trust_criterion": "confidentiality",
        "origin": "catalog",
        "is_active": true,
        "likelihood": 3,
        "impact": 4,
        "inherent_risk_value": 12,
        "inherent_risk_level": "high",
        "treatment": { "decision": "mitigate", "due_date": "2026-12-15", "responsible": { "id": "c9d0…", "type": "ciso", "person_name": "Marta Ruiz" } },
        "causes_count": 4
      }
    ],
    "page": 1, "page_size": 25, "total": 1, "total_pages": 1
  }
}
```

Un riesgo **sin evaluar** trae `likelihood`, `impact`, `inherent_risk_value` e `inherent_risk_level` en `null` (no `0`): el catálogo no los trae, los define cada empresa.

### `GET /v1/risks/{id}` — el árbol riesgo → causas → acciones

```json
{
  "statusCode": 200,
  "message": "risk.read",
  "data": {
    "id": "c1a7…",
    "service_id": "55aa…",
    "code": "R001",
    "name": "Acceso no autorizado a información sensible",
    "description": "Personas internas o externas acceden a información sin autorización.",
    "trust_criterion": "confidentiality",
    "potential_impact": ["reputational", "regulatory_sanction", "customer_trust_loss"],
    "origin": "catalog",
    "is_active": true,
    "likelihood": 3, "impact": 4, "inherent_risk_value": 12, "inherent_risk_level": "high",
    "treatment": null,
    "causes": [
      {
        "id": "7c2e…",
        "code": "F007",
        "name": "Cuentas sin dueño tras una salida de personal",
        "failure_category": "human_resource",
        "controls": [
          { "control_id": "3f1c…", "code": "IAC-12", "own_code": null, "name": "Gestión de accesos de usuarios", "is_mandatory": true, "effect": null }
        ]
      }
    ]
  }
}
```

- `potential_impact` es una lista de `loss_type` (`enums.md`).
- `controls[].code` es **el código que identifica al control y se muestra siempre** (D80): el del catálogo (`IAC-12`) o el propio (`C01`). Igual que en `compliance-controls.md`.
- `controls[].is_mandatory` y `effect` (`cause_control_effect`) vienen del catálogo; **hoy solo 9 relaciones los traen**, el resto viaja con `effect: null` (`P22`) y todavía no participa de ningún cálculo.
- Con `?view=technical` cada riesgo, causa y control agrega `technical` con sus códigos del catálogo (`catalog_code`).

### `POST /v1/services/{service_id}/risks`

```json
{
  "name": "Pérdida de un portátil con datos de clientes",
  "description": "Un equipo se extravía o es robado fuera de la oficina.",
  "trust_criterion": "confidentiality",
  "potential_impact": ["reputational", "financial_loss"]
}
```

`code` es opcional: si no viene, el servidor asigna el siguiente libre del servicio; si viene y ya existe, `409 CODE_ALREADY_EXISTS`. Responde `201` con el objeto del detalle (`origin: "own"`, sin evaluar, `causes: []`).

### `PATCH /v1/risks/{id}`

Solo las claves presentes: `name`, `description`, `trust_criterion`, `potential_impact`. **No** acepta `likelihood`, `impact` ni `inherent_*` (eso es la evaluación). Responde `200` con el objeto completo.

### `DELETE /v1/risks/{id}`

Baja lógica: `204`. El riesgo deja de aparecer en las listas, pero su historial y sus evaluaciones se conservan.

### `GET /v1/risk-matrix`

La matriz 5×5 completa, con el valor y el nivel de **cada casilla**. La leen los cuatro roles de la empresa; no depende de ningún servicio.

```json
{ "min": 1, "max": 5, "cells": [ { "likelihood": 1, "impact": 1, "value": 1, "level": "low" }, …, { "likelihood": 5, "impact": 5, "value": 25, "level": "critical" } ] }
```

`value` es probabilidad × impacto y `level` sale de la **misma función** que la evaluación de un riesgo (Bajo 1–4 · Moderado 5–9 · Alto 10–16 · Crítico 17–25): una casilla vacía tiene exactamente el nivel que tendría un riesgo evaluado ahí. Sirve para pintar el mapa de calor (verde, amarillo, naranja, rojo) sin escribir los cortes en el frontend (`contracts/enums.md`). Las 25 casillas vienen siempre, en orden de probabilidad e impacto crecientes; ordenar y colocar los ejes es cosa de la pantalla.

## Causas

Misma forma que los riesgos, con `failure_category` (6 valores) en lugar de `trust_criterion` y sin evaluación.

Una causa tiene esta forma (los endpoints de la tabla devuelven este mismo objeto):

```json
{
  "id": "7c2e…",
  "service_id": "55aa…",
  "code": "F007",
  "name": "Cuentas sin dueño tras una salida de personal",
  "description": "Las cuentas de quien se va siguen activas porque nadie avisa a TI.",
  "failure_category": "human_resource",
  "origin": "catalog",
  "is_active": true,
  "risks": [ { "id": "c1a7…", "code": "R001", "name": "Acceso no autorizado a información sensible" } ],
  "controls": [ { "control_id": "3f1c…", "code": "IAC-12", "own_code": null, "name": "Gestión de accesos de usuarios", "is_mandatory": true, "effect": null } ]
}
```

| Endpoint | Qué hace |
|---|---|
| `GET /v1/services/{service_id}/causes` | Lista paginada. Filtros: `failure_category`, `origin`, `include_inactive`, `risk_id` |
| `POST /v1/services/{service_id}/causes` | Crea una causa propia: `{ "name", "description", "failure_category" }` → `201` |
| `GET /v1/causes/{id}` | Detalle con los riesgos que origina y las acciones que la mitigan |
| `PATCH /v1/causes/{id}` | Edita `name`, `description`, `failure_category` |
| `DELETE /v1/causes/{id}` | Baja lógica → `204` |

## Vínculos

Se comprueba que **ambos lados son de la misma empresa y del mismo servicio**; si no, `404` (nunca se revela el de otra).

| Endpoint | Cuerpo | Respuesta |
|---|---|---|
| `POST /v1/risks/{id}/causes` | `{ "cause_id": "7c2e…" }` | `201` `{ "risk_id", "cause_id" }` |
| `DELETE /v1/risks/{id}/causes/{cause_id}` | — | `204` |
| `POST /v1/causes/{id}/controls` | `{ "control_id": "3f1c…" }` y opcionales `is_mandatory` (por defecto `true`) y `effect` | `201` `{ "cause_id", "control_id", "is_mandatory", "effect" }` |
| `DELETE /v1/causes/{id}/controls/{control_id}` | — | `204` |

Repetir un vínculo existente es `409 LINK_ALREADY_EXISTS`. Quitar un vínculo borra solo la relación, no el riesgo, la causa ni el control.

## Evaluar un riesgo (matriz 5×5)

### `POST /v1/risks/{id}/evaluation`

Solo `admin_empresa`. Cada llamada **agrega** una evaluación; la anterior no se pisa.

```json
{ "likelihood": 3, "impact": 4 }
```

`likelihood` e `impact` son enteros de **1 a 5**. El **servidor calcula** el valor (el producto) y el nivel; si el cliente manda `inherent_risk_value` o `inherent_risk_level`, se ignoran.

```json
{
  "statusCode": 201,
  "message": "risk.evaluated",
  "data": {
    "risk_id": "c1a7…",
    "likelihood": 3,
    "impact": 4,
    "inherent_risk_value": 12,
    "inherent_risk_level": "high",
    "previous": { "likelihood": 2, "impact": 4, "inherent_risk_value": 8, "inherent_risk_level": "moderate" },
    "evaluated_by": { "id": "a1b2…", "name": "Laura", "last_name": "Gómez" },
    "evaluated_at": "2026-10-14T16:20:05Z"
  }
}
```

Niveles: Bajo 1–4 · Moderado 5–9 · Alto 10–16 · Crítico 17–25 (`risk_level`). Ejemplos que debe cumplir: 2×2 = 4 `low`; 3×3 = 9 `moderate`; 2×5 = 10 `high`; 4×4 = 16 `high`; 5×4 = 20 `critical`.
`previous` es `null` en la primera evaluación.

### `GET /v1/risks/{id}/evaluation-history`

Paginada, de la más reciente a la más antigua. Cada ítem es el objeto de arriba. Se lee de la auditoría (`before_state` / `after_state`). La leen `admin_empresa`, `consultor` y `auditor`; el `funcional` y `admin_monkey`, `403`.

## Tratamiento

### `POST /v1/risks/{id}/treatments`

Solo `admin_empresa`. Agrega una decisión; la vigente es la última.

```json
{ "decision": "mitigate", "responsible_id": "c9d0…", "due_date": "2026-12-15" }
```

`decision`: `mitigate` · `accept` · `transfer` · `avoid` (`risk_treatment_decision`). `responsible_id` es un **cargo** de la organización (`GET /v1/responsibles`), no una persona con cuenta. `due_date` no puede ser pasada.

```json
{
  "statusCode": 201,
  "message": "risk_treatment.created",
  "data": {
    "id": "0b6e…",
    "risk_id": "c1a7…",
    "decision": "mitigate",
    "responsible": { "id": "c9d0…", "type": "ciso", "person_name": "Marta Ruiz" },
    "due_date": "2026-12-15",
    "created_at": "2026-10-14T16:31:40Z"
  }
}
```

`GET /v1/risks/{id}/treatments` lista el historial (paginado, más reciente primero), con la forma de arriba. Lo leen `admin_empresa`, `consultor` y `auditor`; el `funcional`, solo si el riesgo llega a una acción que tiene asignada (si no, `403`). El riesgo, en su lista y su detalle, trae el vigente en `treatment` con `decision`, `due_date` y `responsible`.

## Errores

| HTTP | `error.code` | Cuándo |
|---|---|---|
| 403 | `FORBIDDEN` | El rol no puede (incluido el `funcional` en el historial de evaluaciones); `view=technical` sin ser `admin_empresa`, `auditor` o `consultor` |
| 404 | `NOT_FOUND` | El riesgo, la causa, la acción o el cargo no existen para esta empresa (incluye vincular algo de otra, o tratar con un cargo de otra) |
| 409 | `CODE_ALREADY_EXISTS` | `code` ya usado en el servicio |
| 409 | `LINK_ALREADY_EXISTS` | El vínculo ya existe |
| 409 | `RISK_INACTIVE` | Editar, vincular, evaluar o tratar un riesgo dado de baja |
| 409 | `CAUSE_INACTIVE` | Editar o vincular una causa dada de baja |
| 422 | `VALIDATION_FAILED` | Campos: `required`, `enum.invalid`, `number.invalid`, `number.range` (`likelihood`, `impact`, de 1 a 5), `date.invalid` y `date.past` (`due_date`: `AAAA-MM-DD`, hoy o después), `uuid.invalid`, `array.min` |

Claves i18n: `risk.list`, `risk.read`, `risk.created`, `risk.updated`, `risk.evaluated`, `risk.evaluation_history`, `risk_treatment.created`, `risk_treatment.list`, `cause.*`.

## Ejemplos de error

Todos con el mismo sobre (`conventions.md`); `message` es la clave i18n del error.

**`422` — probabilidad fuera del rango 1 a 5**

```json
{
  "statusCode": 422,
  "message": "validation.failed",
  "data": null,
  "error": {
    "code": "VALIDATION_FAILED",
    "fields": [
      {
        "field": "likelihood",
        "code": "number.range",
        "message": "Debe estar entre 1 y 5."
      }
    ]
  }
}
```

**`404` — vincular una causa de otra empresa**

```json
{
  "statusCode": 404,
  "message": "common.not_found",
  "data": null,
  "error": {
    "code": "NOT_FOUND"
  }
}
```

**`409` — el vínculo ya existe**

```json
{
  "statusCode": 409,
  "message": "risk.link_already_exists",
  "data": null,
  "error": {
    "code": "LINK_ALREADY_EXISTS"
  }
}
```

## Auditoría

| `action` | Cuándo |
|---|---|
| `client_risk.create` · `client_risk.update` · `client_risk.deactivate` | riesgos |
| `client_cause.create` · `client_cause.update` · `client_cause.deactivate` | causas |
| `client_risk_cause.link` · `client_risk_cause.unlink` | vínculo riesgo–causa |
| `client_cause_control.link` · `client_cause_control.unlink` | vínculo causa–acción |
| `client_risk.evaluate` | con el valor anterior y el nuevo |
| `risk_treatment.create` | tratamiento |

## Estado de implementación

**Pendiente por D80 (2026-10-15):** `code` en cada vínculo causa–control (`controls[]`), en el riesgo y en la causa. El backend aún devuelve el código del catálogo solo dentro de `technical` y deja `own_code` en `null` para los del catálogo (**MD-166**).

**Resuelto (2026-10-17): las listas de las pantallas de alta y edición (MD-124).** `GET /v1/catalogs/{name}` sirve ahora `risk_criterion`, `failure_category`, `risk_level`, `risk_treatment_decision`, `responsible_type`, `cause_control_effect`, `exclusion_status`, `dimension`, `control_type`, `catalog_origin`, `loss_type` y `risk_scale` (la escala 1–5 de la matriz), todas con etiqueta es/en. Salen de los enums de la base, en su orden, así que añadir un valor no obliga a tocar el frontend; una prueba del backend (`compliance-catalogs.spec.ts`) compara las listas con el esquema de Prisma. Platform y Monkey Admin las piden y ya no escriben ninguna a mano; solo el texto de algunos enums sigue duplicado en el i18n del frontend (se unifica pantalla a pantalla).

**Construido: MD-122** (riesgos, causas y vínculos; 2026-10-14) y **MD-123** (evaluación 5×5, historial y tratamiento; 2026-10-16).

- El impacto potencial se guarda como el **texto del comité** (`["Reputacional", …]`) y la API lo convierte a `loss_type` en los dos sentidos; un texto que no se reconoce se omite en la respuesta, no se pierde.
- Quitar un vínculo que no existe responde `404`. Dar de baja dos veces es idempotente (`204`).
- `is_mandatory` y `effect` del vínculo causa–acción viven en `client_cause_controls`; hoy `effect` es `null` en todas las que vienen del catálogo (`P22`).
- **La evaluación** vive en `client_risks` (`likelihood`, `impact`, `inherent_risk_value`, `inherent_risk_level`) y cada llamada deja una fila de auditoría `client_risk.evaluate` con lo anterior y lo nuevo: de ahí sale el historial. La base impone la forma (`client_risks_evaluation_shape`): o los cuatro campos son nulos, o probabilidad e impacto van de 1 a 5 con el valor y el nivel que les corresponden. Si el cliente manda `inherent_risk_value` o `inherent_risk_level`, se ignoran.
- **El tratamiento** vive en `risk_treatments`, una fila por decisión (`created_by`, `created_at`); la vigente es la última. `responsible_id` apunta a `organization_responsibles` (el cargo, D30) y es `RESTRICT`: un cargo que responde de un tratamiento no se puede quitar (`409 RESPONSIBLE_IN_USE`). La migración `20261016120000_risk_evaluation_and_treatment` repunta la clave desde `users` y se detiene si hay filas.
- `due_date` se compara con el día UTC de hoy: hoy vale, ayer no.

## Preguntas abiertas

- **Funcional y edición**: ver «Quién puede qué» (`P3`).
- **`effect` e `is_mandatory`** de las 209 relaciones causa–control: `P22`.
- **Tipos de pérdida** (`potential_impact`): el Excel trae «Interrupción de la operación» e «Interrupción o cierre de la operación»; el contrato las trata como un solo valor (decisión de desarrollo del 2026-10-17; el comité lo ratifica, `P9`).
