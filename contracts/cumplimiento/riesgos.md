---
id: contracts-compliance-risks
name: Contrato — Cumplimiento, riesgos y causas
description: Gestionar los riesgos y las causas de un servicio, vincularlos con los controles, evaluar un riesgo en la matriz 5×5 y registrar su tratamiento.
type: contract
---

# Cumplimiento — riesgos y causas

> **VF18 (D128): este contrato describe la API construida con el catálogo v1.** Con la VF18 el nivel inherente sale de la **posición en la matriz**, la valoración del catálogo llega prellenada, el residual se calcula por **cobertura verificada** y el efecto y la obligatoriedad de cada relación causa–control se retiran (D134). Se reescribe antes de construir RC-10 y RC-11.

| | |
|---|---|
| **Estado** | **ACORDADO** (2026-10-17); construida: riesgos, causas, vínculos, evaluación 5×5 y tratamiento (MD-122 y MD-123) |
| **App** | Monkey Platform. En las pantallas se llaman «Riesgos» y «Causas» (D80: vocabulario del dominio; se retiran «lo que podría salir mal» y «por qué podría pasar») |
| **Entidades** | `client_risks`, `client_causes`, `client_risk_causes`, `client_cause_controls`, `risk_treatments`, `organization_responsibles` (`modelo-datos.md` §7.2) |
| **Contexto común** | [`README.md`](README.md) · [`conventions.md`](../conventions.md) (sección «Cumplimiento») · [`enums.md`](../enums.md) |

**Qué es.** Al contratar un marco, cada servicio recibe **su propia copia** de los riesgos y causas del catálogo (D28): editarla no cambia el catálogo ni a otra empresa. Un *riesgo* es la probabilidad y el impacto de que algo ocurra o se pierda si una persona lo materializa; una *causa* es el riesgo materializado; un *control* es el paso a paso que lo evita o lo mitiga (vocabulario del comité, D76).

**Fuera de este contrato.** La **mitigación** (estados de causa y riesgo) y el **riesgo residual** con sus dos matrices son vista del `admin_empresa` y del `auditor` y tienen ya su regla (D134, RC-11) y no están construidos: cuando existan, se agregan como campos opcionales de la respuesta, sin romper nada de lo de aquí.

## Quién puede qué

| Acción | `admin_empresa` | `responsable` y `delegado` | `auditor` |
|---|---|---|---|
| Listar y ver | todos | **solo los que llegan a un control suyo** (D102) | todos |
| Crear, editar, dar de baja, vincular | ✓ (directo, con confirmación: D96, `P33`) | `403` | `403` |
| Evaluar (5×5) y tratar | ✓ | `403` | `403` |

> Sigue la matriz §5.5 (D102: el comité no entregará el Excel por pantalla). **Discrepancia a confirmar:** el ticket MD-122 dejaba al `funcional` editar «lo suyo», pero la matriz solo da lectura al `responsable` y al `delegado`; este contrato sigue la matriz.

## Índice de endpoints

| Grupo | Endpoints |
|---|---|
| [Riesgos](#riesgos) | `GET`/`POST /v1/services/{service_id}/risks` · `GET`/`PATCH`/`DELETE /v1/risks/{id}` · `POST /v1/risks/{id}/reactivation` · `GET /v1/risk-matrix` |
| [Causas](#causas) | `GET`/`POST /v1/services/{service_id}/causes` · `GET`/`PATCH`/`DELETE /v1/causes/{id}` |
| [Vínculos](#vínculos) | `POST`/`DELETE /v1/risks/{id}/causes[/{cause_id}]` · `POST`/`DELETE /v1/causes/{id}/controls[/{control_id}]` |
| [Evaluar un riesgo](#evaluar-un-riesgo-matriz-55) | `POST /v1/risks/{id}/evaluation` · `GET /v1/risks/{id}/evaluation-history` |
| [Tratamiento](#tratamiento) | `POST`/`GET /v1/risks/{id}/treatments` |

---

## Riesgos

### GET /v1/services/{service_id}/risks — Listar los riesgos de un servicio

| | |
|---|---|
| **Quién** | `admin_empresa` y `auditor` (todos) · `responsable` y `delegado` (los de sus controles) |
| **Éxito** | `200`, paginada |
| **Errores** | `403` · `404` |

#### Parámetros (query)
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `trust_criterion` | enum `risk_criterion` | no | 11 valores |
| `inherent_risk_level` | enum `risk_level` | no | |
| `evaluated` | boolean | no | |
| `origin` | string | no | `catalog` · `own` |
| `include_inactive` | boolean | no | |
| `page`, `page_size` | integer | no | Ver `conventions.md` |

#### Response `200`
| Campo del ítem | Tipo | Qué es |
|---|---|---|
| `id`, `code`, `name` | | |
| `trust_criterion` | enum `risk_criterion` | |
| `origin`, `is_active` | | |
| `likelihood`, `impact` | integer 1–5 \| null | **Un riesgo sin evaluar trae `null` (no `0`)**: el catálogo no los trae, los define cada empresa |
| `inherent_risk_value` | integer \| null | Probabilidad × impacto |
| `inherent_risk_level` | enum `risk_level` \| null | |
| `treatment` | `{ decision, due_date, responsible }` \| null | El tratamiento vigente |
| `causes_count` | integer | |

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

### GET /v1/risks/{id} — El árbol riesgo → causas → controles

| | |
|---|---|
| **Quién** | Mismas reglas de acceso que la lista |
| **Éxito** | `200` |
| **Errores** | `403` · `404` |

#### Response `200`
| Campo | Tipo | Qué es |
|---|---|---|
| `id`, `service_id`, `code`, `name`, `description` | | |
| `trust_criterion` | enum `risk_criterion` | |
| `potential_impact[]` | enum `loss_type` | Lista de tipos de pérdida |
| `origin`, `is_active`, `likelihood`, `impact`, `inherent_risk_value`, `inherent_risk_level`, `treatment` | | Como en la lista |
| `causes[]` | objeto | `id`, `code`, `name`, `failure_category` (enum `failure_category`) y `controls[]` |
| `causes[].controls[]` | objeto | `control_id`, `code`, `own_code`, `name`, `is_mandatory`, `effect` (enum `cause_control_effect`) |

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

> - `controls[].code` es **el código que identifica al control y se muestra siempre** (D80): el del catálogo (`IAC-12`) o el propio (`C01`). Igual que en [`controles.md`](controles.md).
> - `controls[].is_mandatory` y `effect` vienen del catálogo; **hoy solo 9 relaciones los traen**, el resto viaja con `effect: null`; con la VF18 el efecto y la obligatoriedad se retiran (D134).
> - Con `?view=technical` cada riesgo, causa y control agrega `technical` con sus códigos del catálogo (`catalog_code`).

### POST /v1/services/{service_id}/risks — Crear un riesgo propio

| | |
|---|---|
| **Quién** | `admin_empresa` |
| **Éxito** | `201` con el objeto del detalle (`origin: "own"`, sin evaluar, `causes: []`) |
| **Errores** | `403` · `404` · `409 CODE_ALREADY_EXISTS` · `422 VALIDATION_FAILED` |

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `name` | string | sí | |
| `description` | string | sí | |
| `trust_criterion` | enum `risk_criterion` | sí | |
| `potential_impact` | enum `loss_type`[] | sí | |
| `code` | string | no | Si no viene, el servidor asigna el siguiente libre del servicio; si viene y ya existe, `409 CODE_ALREADY_EXISTS` |

```json
{
  "name": "Pérdida de un portátil con datos de clientes",
  "description": "Un equipo se extravía o es robado fuera de la oficina.",
  "trust_criterion": "confidentiality",
  "potential_impact": ["reputational", "financial_loss"]
}
```

### PATCH /v1/risks/{id} — Editar un riesgo

| | |
|---|---|
| **Quién** | `admin_empresa` |
| **Éxito** | `200` con el objeto completo |
| **Errores** | `403` · `404` · `409 RISK_INACTIVE` · `422` |

Solo las claves presentes: `name`, `description`, `trust_criterion`, `potential_impact`. **No** acepta `likelihood`, `impact` ni `inherent_*` (eso es la evaluación).

### DELETE /v1/risks/{id} — Dar de baja un riesgo

| | |
|---|---|
| **Quién** | `admin_empresa` |
| **Éxito** | `204` |
| **Errores** | `403` · `404` · `422 VALIDATION_FAILED` (`reason` de más de 500 caracteres) |

Baja lógica. El riesgo deja de aparecer en las listas, pero su historial y sus evaluaciones se conservan. **Sus causas y los controles de esas causas no se tocan:** quitar un riesgo no retira nada más (las causas se comparten entre riesgos, y un control lo exige un requisito del marco aunque su riesgo ya no esté, D93).

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `reason` | string | no | Máx. 500: por qué el riesgo no aplica al servicio. No tiene columna propia: queda en el rastro de auditoría (`client_risk.deactivate`, `after_state.retirement_reason`). El asistente de alta del servicio lo pide siempre; la API lo deja opcional para no romper a quien ya la usa |

```json
{ "reason": "No usamos portátiles; todo es remoto." }
```

### POST /v1/risks/{id}/reactivation — Reactivar un riesgo

| | |
|---|---|
| **Quién** | `admin_empresa` |
| **Éxito** | `200` con el objeto del detalle, que conserva su evaluación anterior (D93) |
| **Errores** | `403` · `404` |

Devuelve al servicio un riesgo que se había dado de baja. Si ya estaba vigente no hace nada (`200`, sin rastro). Deja `client_risk.reactivate` en la auditoría. Lo usa el asistente de alta del servicio para «Volver a incluir».

### GET /v1/risk-matrix — La matriz 5×5

| | |
|---|---|
| **Quién** | `admin_empresa` · `responsable` · `delegado` · `auditor` |
| **Éxito** | `200`; no depende de ningún servicio |

La matriz completa, con el valor y el nivel de **cada casilla**.

```json
{ "min": 1, "max": 5, "cells": [ { "likelihood": 1, "impact": 1, "value": 1, "level": "low" }, …, { "likelihood": 5, "impact": 5, "value": 25, "level": "critical" } ] }
```

> `value` es probabilidad × impacto y `level` sale de la **misma función** que la evaluación de un riesgo (Bajo 1–4 · Moderado 5–9 · Alto 10–16 · Crítico 17–25): una casilla vacía tiene exactamente el nivel que tendría un riesgo evaluado ahí. Sirve para pintar el mapa de calor (verde, amarillo, naranja, rojo) sin escribir los cortes en el frontend. Las 25 casillas vienen siempre, en orden de probabilidad e impacto crecientes; ordenar y colocar los ejes es cosa de la pantalla.

---

## Causas

Misma forma que los riesgos, con `failure_category` (6 valores) en lugar de `trust_criterion` y sin evaluación.

| Endpoint | Request | Qué hace |
|---|---|---|
| `GET /v1/services/{service_id}/causes` | Filtros: `failure_category`, `origin`, `include_inactive`, `risk_id` | Lista paginada |
| `POST /v1/services/{service_id}/causes` | `{ "name", "description", "failure_category" }` y opcionales `cause_origin`, `cause_type` (MD-499) | Crea una causa propia → `201` |
| `GET /v1/causes/{id}` | — | Detalle con los riesgos que origina y las acciones que la mitigan |
| `PATCH /v1/causes/{id}` | `name`, `description`, `failure_category`, `cause_origin`, `cause_type` (MD-499; `null` los borra) | Edita. La clasificación solo se edita en una causa **propia**; en una del catálogo responde `422` con `cause.catalog_classification` |
| `DELETE /v1/causes/{id}` | — | Baja lógica → `204` |

Los endpoints devuelven este objeto:

| Campo | Tipo | Qué es |
|---|---|---|
| `id`, `service_id`, `code`, `name`, `description` | | |
| `failure_category` | enum `failure_category` | |
| `origin`, `is_active` | | |
| `cause_origin` (MD-499) | enum `cause_origin` \| null | Clasificación v2 (D129): `internal` · `external`. `null` en una causa sin clasificar (las v1 y las propias sin dato) |
| `cause_type` (MD-499) | enum `cause_type` \| null | Clasificación v2 (D129): `human` · `processes` · `information` · `measurement` · … (valores en `enums/catalogo-maestro.md`). `null` si no la tiene |
| `risks[]` | `{ id, code, name }` | Los riesgos que origina |
| `controls[]` | `{ control_id, code, own_code, name, is_mandatory, effect }` | Los controles que la mitigan |

```json
{
  "id": "7c2e…",
  "service_id": "55aa…",
  "code": "F007",
  "name": "Cuentas sin dueño tras una salida de personal",
  "description": "Las cuentas de quien se va siguen activas porque nadie avisa a TI.",
  "failure_category": "human_resource",
  "origin": "catalog",
  "cause_origin": "internal",
  "cause_type": "human",
  "is_active": true,
  "risks": [ { "id": "c1a7…", "code": "R001", "name": "Acceso no autorizado a información sensible" } ],
  "controls": [ { "control_id": "3f1c…", "code": "IAC-12", "own_code": null, "name": "Gestión de accesos de usuarios", "is_mandatory": true, "effect": null } ]
}
```

## Vínculos

| | |
|---|---|
| **Quién** | `admin_empresa` |
| **Errores** | `403` · `404` (**ambos lados deben ser de la misma empresa y del mismo servicio**; nunca se revela el de otra) · `409 LINK_ALREADY_EXISTS` · `409 RISK_INACTIVE` · `409 CAUSE_INACTIVE` |

| Endpoint | Request | Response |
|---|---|---|
| `POST /v1/risks/{id}/causes` | `{ "cause_id": "7c2e…" }` | `201` `{ "risk_id", "cause_id" }` |
| `DELETE /v1/risks/{id}/causes/{cause_id}` | — | `204` |
| `POST /v1/causes/{id}/controls` | `{ "control_id": "3f1c…" }` y opcionales `is_mandatory` (por defecto `true`) y `effect` | `201` `{ "cause_id", "control_id", "is_mandatory", "effect" }` |
| `DELETE /v1/causes/{id}/controls/{control_id}` | — | `204` |

> Repetir un vínculo existente es `409 LINK_ALREADY_EXISTS`. Quitar un vínculo borra solo la relación, no el riesgo, la causa ni el control. Quitar un vínculo que no existe responde `404`.

---

## Evaluar un riesgo (matriz 5×5)

**Cuándo y dónde se evalúa por primera vez (D89).** Al declarar un servicio, en la misma pantalla de crear el servicio, con un asistente que pregunta por cada riesgo (uno a uno) **qué tan probable es que ocurra en el servicio** y **qué tan grave sería si ocurriera**, ambas de 1 a 5. Hasta que todos los riesgos vigentes del servicio estén evaluados no se declaran sus activos (`DT-77`: hoy lo exige solo la pantalla). La pestaña Riesgos de Cumplimiento sirve para verlos y corregirlos después.

**Las escalas que ve el cliente** son las del comité (Excel `TSC INTEGRAL SOC 2 DETALLADO VF2`, hoja `Riesgos`, bloques «Escala de probabilidad» y «Escala de impacto»). Hoy viven en las traducciones de Platform (`COMPLIANCE.RISK_WIZARD.LIKELIHOOD/IMPACT`), no en una lista que sirva el Backend:

| Nivel | Probabilidad | Impacto |
|---|---|---|
| 1 | **Raro** — puede ocurrir solo en circunstancias excepcionales | **Insignificante** — efecto mínimo, sin consecuencias relevantes |
| 2 | **Improbable** — podría ocurrir en algún momento | **Menor** — impacto leve, manejable con recursos normales |
| 3 | **Posible** — podría ocurrir ocasionalmente | **Moderado** — impacto notable, requiere gestión específica |
| 4 | **Probable** — ocurre en la mayoría de las circunstancias | **Mayor** — impacto significativo en la operación o el cumplimiento |
| 5 | **Casi seguro** — se espera que ocurra en la mayoría de los casos | **Crítico** — impacto severo, amenaza la continuidad o genera sanciones graves |

### POST /v1/risks/{id}/evaluation — Evaluar un riesgo

| | |
|---|---|
| **Quién** | `admin_empresa` |
| **Éxito** | `201`. Cada llamada **agrega** una evaluación; la anterior no se pisa |
| **Errores** | `403` · `404` · `409 RISK_INACTIVE` · `422 number.range` |

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `likelihood` | integer | sí | De **1 a 5** |
| `impact` | integer | sí | De **1 a 5** |

```json
{ "likelihood": 3, "impact": 4 }
```

> El **servidor calcula** el valor (el producto) y el nivel; si el cliente manda `inherent_risk_value` o `inherent_risk_level`, se ignoran.

#### Response `201`
| Campo | Tipo | Qué es |
|---|---|---|
| `risk_id`, `likelihood`, `impact` | | |
| `inherent_risk_value` | integer | |
| `inherent_risk_level` | enum `risk_level` | Bajo 1–4 · Moderado 5–9 · Alto 10–16 · Crítico 17–25 |
| `previous` | `{ likelihood, impact, inherent_risk_value, inherent_risk_level }` \| null | `null` en la primera evaluación |
| `evaluated_by` | `{ id, name, last_name }` | |
| `evaluated_at` | datetime | |

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

> Ejemplos que debe cumplir: 2×2 = 4 `low`; 3×3 = 9 `moderate`; 2×5 = 10 `high`; 4×4 = 16 `high`; 5×4 = 20 `critical`.

### GET /v1/risks/{id}/evaluation-history — Historial de evaluaciones

| | |
|---|---|
| **Quién** | `admin_empresa` · `auditor` |
| **Éxito** | `200`, paginada, de la más reciente a la más antigua |
| **Errores** | `403` (`responsable`, `delegado` y `admin_monkey`) · `404` |

Cada ítem es el objeto de la evaluación de arriba. Se lee de la auditoría (`before_state` / `after_state`).

---

## Tratamiento

### POST /v1/risks/{id}/treatments — Agregar una decisión de tratamiento

| | |
|---|---|
| **Quién** | `admin_empresa` |
| **Éxito** | `201`. Agrega una decisión; la vigente es la última |
| **Errores** | `403` · `404` (también un cargo de otra empresa) · `409 RISK_INACTIVE` · `422 date.past` |

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `decision` | enum `risk_treatment_decision` | sí | `mitigate` · `accept` · `transfer` · `avoid` |
| `responsible_id` | uuid | sí | Un **cargo de la organización** (`GET /v1/responsibles`), no una persona con cuenta |
| `due_date` | date `AAAA-MM-DD` | sí | No puede ser pasada: hoy o después (se compara con el día UTC de hoy) |

```json
{ "decision": "mitigate", "responsible_id": "c9d0…", "due_date": "2026-12-15" }
```

#### Response `201`
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

### GET /v1/risks/{id}/treatments — Historial de tratamientos

| | |
|---|---|
| **Quién** | `admin_empresa` y `auditor` · `responsable` y `delegado` solo si el riesgo llega a un control suyo |
| **Éxito** | `200`, paginado, más reciente primero, con la forma de arriba |
| **Errores** | `403` · `404` |

> El riesgo, en su lista y su detalle, trae el vigente en `treatment` con `decision`, `due_date` y `responsible`.

---

## Errores del módulo

| HTTP | `error.code` | Cuándo |
|---|---|---|
| 403 | `FORBIDDEN` | El rol no puede (incluidos el `responsable` y el `delegado` en el historial de evaluaciones); `view=technical` sin ser `admin_empresa` o `auditor` |
| 404 | `NOT_FOUND` | El riesgo, la causa, la acción o el cargo no existen para esta empresa (incluye vincular algo de otra, o tratar con un cargo de otra) |
| 409 | `CODE_ALREADY_EXISTS` | `code` ya usado en el servicio |
| 409 | `LINK_ALREADY_EXISTS` | El vínculo ya existe |
| 409 | `RISK_INACTIVE` | Editar, vincular, evaluar o tratar un riesgo dado de baja |
| 409 | `CAUSE_INACTIVE` | Editar o vincular una causa dada de baja |
| 409 | `RESPONSIBLE_IN_USE` | Quitar un cargo que responde de un tratamiento |
| 422 | `VALIDATION_FAILED` | Campos: `required`, `enum.invalid`, `number.invalid`, `number.range` (`likelihood`, `impact`, de 1 a 5), `date.invalid` y `date.past` (`due_date`: `AAAA-MM-DD`, hoy o después), `uuid.invalid`, `array.min` |

**Claves i18n:** `risk.list`, `risk.read`, `risk.created`, `risk.updated`, `risk.evaluated`, `risk.evaluation_history`, `risk_treatment.created`, `risk_treatment.list`, `cause.*`.

### Ejemplos de error

Todos con el mismo sobre (`conventions.md`); `message` es la clave i18n del error.

**`422` — probabilidad fuera del rango 1 a 5**
```json
{
  "statusCode": 422,
  "message": "validation.failed",
  "data": null,
  "error": {
    "code": "VALIDATION_FAILED",
    "fields": [ { "field": "likelihood", "code": "number.range", "message": "Debe estar entre 1 y 5." } ]
  }
}
```

**`404` — vincular una causa de otra empresa**
```json
{ "statusCode": 404, "message": "common.not_found", "data": null, "error": { "code": "NOT_FOUND" } }
```

**`409` — el vínculo ya existe**
```json
{ "statusCode": 409, "message": "risk.link_already_exists", "data": null, "error": { "code": "LINK_ALREADY_EXISTS" } }
```

## Auditoría

| `action` | Cuándo |
|---|---|
| `client_risk.create` · `client_risk.update` · `client_risk.deactivate` | Riesgos |
| `client_cause.create` · `client_cause.update` · `client_cause.deactivate` | Causas |
| `client_risk_cause.link` · `client_risk_cause.unlink` | Vínculo riesgo–causa |
| `client_cause_control.link` · `client_cause_control.unlink` | Vínculo causa–control |
| `client_risk.evaluate` | Con el valor anterior y el nuevo |
| `risk_treatment.create` | Tratamiento |

## Preguntas abiertas

- **`effect` e `is_mandatory`** de las relaciones causa–control: se retiran con la VF18 (D134).
- **Tipos de pérdida** (`potential_impact`): el Excel trae «Interrupción de la operación» e «Interrupción o cierre de la operación»; el contrato las trata como un solo valor (decisión de desarrollo del 2026-10-17; el comité lo ratifica, `P9`).
- **Edición por `responsable` y `delegado`:** resuelta por D102 (la matriz de §5.5 manda; solo lectura). `P3` cerrada.

---

## Estado de implementación

**Construido (MD-499, 2026-11-24): clasificación v2 de la causa.** `cause_origin` y `cause_type` al crear y editar una causa propia y en las respuestas; la causa del catálogo responde `422 cause.catalog_classification` (`application/risks/cause-classification.use-cases.spec.ts`).

**Construido (MD-166, 2026-10-30): el código en cada vínculo causa–control (`controls[]`) en la vista de negocio (D80).** Es el del catálogo (`IAC-12`) o el propio (`C01`); el riesgo y la causa ya lo traían. `own_code` sigue siendo solo la numeración de los propios y `technical.catalog_code` se mantiene en la vista técnica. Pruebas: `riesgos.e2e-spec.ts`.

**Resuelto (2026-10-17): las listas de las pantallas de alta y edición (MD-124).** `GET /v1/catalogs/{name}` sirve ahora `risk_criterion`, `failure_category`, `risk_level`, `risk_treatment_decision`, `responsible_type`, `cause_control_effect`, `exclusion_status`, `dimension`, `control_type`, `catalog_origin`, `loss_type` y `risk_scale` (la escala 1–5 de la matriz), todas con etiqueta es/en. Salen de los enums de la base, en su orden, así que añadir un valor no obliga a tocar el frontend; una prueba del backend (`compliance-catalogs.spec.ts`) compara las listas con el esquema de Prisma. Platform y Monkey Admin las piden y ya no escriben ninguna a mano; solo el texto de algunos enums sigue duplicado en el i18n del frontend (se unifica pantalla a pantalla).

**Construido: MD-122** (riesgos, causas y vínculos; 2026-10-14) y **MD-123** (evaluación 5×5, historial y tratamiento; 2026-10-16).
- El impacto potencial se guarda como el **texto del comité** (`["Reputacional", …]`) y la API lo convierte a `loss_type` en los dos sentidos; un texto que no se reconoce se omite en la respuesta, no se pierde.
- Dar de baja dos veces es idempotente (`204`).
- `is_mandatory` y `effect` del vínculo causa–acción viven en `client_cause_controls`; hoy `effect` es `null` en todas las que vienen del catálogo; se retiran con la VF18 (D134).
- **La evaluación** vive en `client_risks` (`likelihood`, `impact`, `inherent_risk_value`, `inherent_risk_level`) y cada llamada deja una fila de auditoría `client_risk.evaluate` con lo anterior y lo nuevo: de ahí sale el historial. La base impone la forma (`client_risks_evaluation_shape`): o los cuatro campos son nulos, o probabilidad e impacto van de 1 a 5 con el valor y el nivel que les corresponden. Si el cliente manda `inherent_risk_value` o `inherent_risk_level`, se ignoran.
- **El tratamiento** vive en `risk_treatments`, una fila por decisión (`created_by`, `created_at`); la vigente es la última. `responsible_id` apunta a `organization_responsibles` (el cargo, D30) y es `RESTRICT`: un cargo que responde de un tratamiento no se puede quitar (`409 RESPONSIBLE_IN_USE`). La migración `20261016120000_risk_evaluation_and_treatment` repunta la clave desde `users` y se detiene si hay filas.
- `due_date` se compara con el día UTC de hoy: hoy vale, ayer no.
