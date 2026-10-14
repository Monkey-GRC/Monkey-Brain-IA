---
id: contracts-compliance-controls
name: Contrato — Cumplimiento, acciones de protección
description: Listar y ver los controles de un servicio, crear un control propio y proponer o decidir cambios de controles.
type: contract
---

# Cumplimiento — acciones de protección

**Estado: PROPUESTA (2026-10-14).** Ver `conventions.md` (sección «Cumplimiento: roles, vistas y decisiones») y `enums.md`. Tickets: MD-117, MD-118, MD-150, MD-156.

**Qué es.** Una *acción de protección* es un **control del cliente** (`client_controls`, `modelo-datos.md` §7.1): el control del catálogo que el servicio heredó al contratar
un marco, o uno propio. Todo lo que se mide cuelga de él. **Entidades:** `client_controls`, `client_control_dimensions`, `client_control_changes`, `user_control_assignments`.
**App:** Monkey Platform. En el cable se llama `controls` (así lo pide el modelo); las pantallas le dicen «acción de protección» (glosario, MD-109).

## Quién puede qué

| Acción | `admin_empresa` | `funcional` | `consultor` | `auditor` |
|---|---|---|---|---|
| Listar y ver | todas | **solo las asignadas** | todas | todas |
| Pedir `view=technical` | `403` | `403` | ✓ | ✓ |
| Crear un control propio | ✓ | `403` | `403` | `403` |
| Proponer editar o dar de baja | ✓ cualquiera | solo uno suyo | `403` | `403` |
| Aprobar o rechazar una propuesta | `403` | `403` | ✓ | `403` |

Vigente hasta que el comité entregue los permisos por pantalla (`P3`): si ese documento cambia un renglón, se ajusta aquí.

## `GET /v1/services/{service_id}/controls`

Lista paginada. Se omiten los dados de baja. Un servicio recién clonado trae unas 80 acciones y la lista responde sin consultas repetidas.

| Parámetro | Valores |
|---|---|
| `trust_criterion` | una de las 5 categorías (`enums.md` `trust_criterion`) |
| `type` | `manual` · `automated` · `hybrid` · `technical_manual` (`control_type`) |
| `readiness` | `ready` · `almost_ready` · `needs_work` · `not_measured` |
| `approval` | `approved` · `pending` · `rejected` (solo tiene sentido en un control propio) |
| `assigned_to` | `uuid` de un usuario con cuenta |
| `origin` | `catalog` · `own` |
| `page`, `page_size`, `sort` | convenciones; `sort` acepta `own_code` (por defecto, ordenado por su número: `C2` antes que `C10`), `-own_code`, `name` y `-name` |

```json
{
  "statusCode": 200,
  "message": "control.list",
  "data": {
    "items": [
      {
        "id": "3f1c…",
        "own_code": "C07",
        "name": "Gestión de accesos de usuarios",
        "origin": "catalog",
        "type": "hybrid",
        "trust_criteria": ["security"],
        "approval": "approved",
        "readiness": "needs_work",
        "progress": { "done": 3, "total": 5 },
        "coverage": { "measured": 4, "applicable": 5 },
        "assigned_to": { "user_id": "a1b2…", "name": "Laura", "last_name": "Gómez" },
        "has_pending_change": false
      },
      {
        "id": "9d44…",
        "own_code": "C81",
        "name": "Revisión trimestral de proveedores",
        "origin": "own",
        "type": "manual",
        "trust_criteria": ["security"],
        "approval": "pending",
        "readiness": "not_measured",
        "progress": { "done": 0, "total": 1 },
        "coverage": { "measured": 0, "applicable": 1 },
        "assigned_to": null,
        "has_pending_change": true
      }
    ],
    "page": 1, "page_size": 25, "total": 2, "total_pages": 1
  }
}
```

- `own_code` es la numeración **por servicio** (`C01`, `C02`…): la tiene todo control, del catálogo o propio. **No es el código técnico** del catálogo.
- `name` de un control del catálogo sale del catálogo (hoy solo en español); el de uno propio lo escribe la empresa.
- `approval` de un control del catálogo es siempre `approved`. Un control propio **cuenta en el avance desde que se crea, aunque esté `pending`**; si se rechaza, se da de baja y deja de contar (D65).
- `trust_criteria` es un array: un control del catálogo puede servir a varias categorías y **cuenta una sola vez** en el marco.
- Con **`?view=technical`** cada ítem agrega `technical`:

```json
"technical": {
  "control_code": "IAC-12",
  "requirement_codes": ["CC6.1", "CC6.2"],
  "points_of_focus": ["CC6.1-POF1"],
  "control_state": "ineffective",
  "tests_count": 5
}
```

`control_state` es el de `enums.md` (`effective`, `ineffective`…). El detalle de los tests de un control está en `compliance-audit.md`.

## `GET /v1/controls/{id}`

El detalle de una acción. Mismas reglas de acceso que la lista.

```json
{
  "statusCode": 200,
  "message": "control.read",
  "data": {
    "id": "3f1c…",
    "service_id": "55aa…",
    "own_code": "C07",
    "name": "Gestión de accesos de usuarios",
    "origin": "catalog",
    "type": "hybrid",
    "trust_criteria": ["security"],
    "approval": "approved",
    "interpretation": { "text": "Los accesos se otorgan y retiran con el formulario de TI.", "is_customized": true },
    "dimensions": [
      { "dimension": "policy", "applies": true, "type": "manual", "reason_not_applicable": null },
      { "dimension": "cloud", "applies": true, "type": "automated", "reason_not_applicable": null },
      { "dimension": "database", "applies": false, "type": null, "reason_not_applicable": "No operamos bases de datos propias." }
    ],
    "evidence": [
      {
        "requirement_id": "e07a…",
        "description": "Política de control de accesos aprobada",
        "responsible": { "id": "c9d0…", "type": "compliance", "person_name": "Marta Ruiz" },
        "latest_submission": { "id": "b310…", "version": 2, "validation_status": "pending" }
      }
    ],
    "causes": [ { "id": "7c2e…", "name": "Cuentas sin dueño tras una salida de personal" } ],
    "readiness": "needs_work",
    "progress": { "done": 3, "total": 5 },
    "coverage": { "measured": 4, "applicable": 5 },
    "assigned_to": { "user_id": "a1b2…", "name": "Laura", "last_name": "Gómez" },
    "has_pending_change": false,
    "failing": [
      { "dimension": "cloud", "affected": [ { "kind": "asset", "id": "8f10…", "name": "cuenta-aws-produccion" } ] }
    ]
  }
}
```

- `dimensions` lista **todas las que el control exige**; una que no aplica **se declara con su motivo**, nunca se omite.
- `interpretation.is_customized` es `true` si la empresa la reescribió; si no, es el texto del catálogo.
- `failing` dice **en qué falla**, por dimensión, con el activo o la prueba afectados (`kind`: `asset` · `test`, y un `display_name` en vez de `name` cuando es una prueba). Nunca el texto de la prueba.
- Con `?view=technical` agrega `technical` (los mismos campos de la lista y, además, `tests`: `[ { "test_code": "T-CLD-001", "display_name": "Prueba de nube", "dimension": "cloud", "state": "compliant" } ]`, con `state` = `test_state`). El detalle completo de los tests está en `compliance-audit.md`.

## `POST /v1/services/{service_id}/controls` — crear un control propio

Solo `admin_empresa`. Un control propio es **solo documental** (su única dimensión es `policy`, su tipo `manual`) y no se vincula a ningún requisito (D65).

```json
{
  "name": "Revisión trimestral de proveedores",
  "interpretation": "Cada trimestre TI revisa que los proveedores críticos sigan cumpliendo el contrato.",
  "trust_criterion": "security",
  "dimensions": ["policy"]
}
```

`dimensions` es opcional; si viene, solo puede ser `["policy"]`. Responde `201` con el mismo objeto del detalle, `approval: "pending"` y el `own_code` que el servidor asigna:

```json
{
  "statusCode": 201,
  "message": "control.created",
  "data": {
    "id": "9d44…",
    "service_id": "55aa…",
    "own_code": "C81",
    "name": "Revisión trimestral de proveedores",
    "origin": "own",
    "type": "manual",
    "trust_criteria": ["security"],
    "approval": "pending",
    "interpretation": { "text": "Cada trimestre TI revisa que los proveedores críticos sigan cumpliendo el contrato.", "is_customized": true },
    "dimensions": [ { "dimension": "policy", "applies": true, "type": "manual", "reason_not_applicable": null } ],
    "evidence": [],
    "causes": [],
    "readiness": "not_measured",
    "progress": { "done": 0, "total": 1 },
    "coverage": { "measured": 0, "applicable": 1 },
    "assigned_to": null,
    "has_pending_change": true,
    "failing": []
  }
}
```

Queda una propuesta `create` pendiente (`GET /v1/controls/{id}/changes`) para que el consultor la decida. `trust_criterion` debe ser una categoría **contratada por el servicio**
(`security` siempre lo está).

## `POST /v1/controls/{id}/changes` — proponer un cambio

`admin_empresa` sobre cualquier acción; `funcional` solo sobre una asignada. **Hasta que el consultor aprueba, la acción sigue como estaba y sigue contando.**

| `change_type` | `proposed_values` |
|---|---|
| `edit_interpretation` | `{ "interpretation": "texto nuevo" }` |
| `edit_dimensions` | `{ "dimensions": [ { "dimension": "database", "applies": false, "reason_not_applicable": "…" }, … ] }` |
| `retire` | `{}` (o se omite) |

`create` **no** se acepta aquí: nace con `POST …/controls`. Una dimensión con `applies: false` **exige** `reason_not_applicable`.

```json
{
  "change_type": "edit_dimensions",
  "proposed_values": {
    "dimensions": [
      { "dimension": "policy", "applies": true },
      { "dimension": "database", "applies": false, "reason_not_applicable": "No operamos bases de datos propias." }
    ]
  }
}
```

```json
{
  "statusCode": 201,
  "message": "control_change.requested",
  "data": {
    "id": "5e90…",
    "control_id": "3f1c…",
    "change_type": "edit_dimensions",
    "status": "pending",
    "proposed_values": { "dimensions": [ { "dimension": "policy", "applies": true }, { "dimension": "database", "applies": false, "reason_not_applicable": "No operamos bases de datos propias." } ] },
    "requested_by": { "id": "a1b2…", "name": "Laura", "last_name": "Gómez" },
    "requested_at": "2026-10-14T15:02:44Z",
    "decided_by": null,
    "decision_note": null,
    "decided_at": null
  }
}
```

## `GET /v1/controls/{id}/changes`

Paginada, de la más reciente a la más antigua; filtro `status`. La leen `admin_empresa`, el `funcional` dueño, `consultor` y `auditor`. Cada ítem es el objeto de arriba.

## `GET /v1/control-changes` — la bandeja del consultor

Las propuestas de **la empresa donde trabaja** el consultor, de todos sus servicios. Solo `consultor` y `auditor` (lectura); `403` para los demás. Filtros: `status` (por defecto `pending`),
`service_id`, `change_type`. Cada ítem trae además `control: { id, own_code, name }` y `service: { id, name }`.

## `PATCH /v1/control-changes/{id}` — decidir

Solo el `consultor`. Cualquier otro rol, incluido el `admin_empresa` que la propuso, recibe `403`.

```json
{ "status": "approved" }
```

```json
{ "status": "rejected", "decision_note": "La interpretación no cubre el acceso remoto." }
```

Responde `200` con la propuesta ya decidida (`decided_by`, `decided_at`). **Qué pasa al decidir** (D65):

| `change_type` | Aprobar | Rechazar |
|---|---|---|
| `create` | el control queda definitivo (`approval: approved`) | se da de baja y **deja de contar** |
| `retire` | se da de baja y deja de contar; el histórico se conserva | sigue como estaba |
| `edit_dimensions` · `edit_interpretation` | se aplica el cambio | sigue como estaba |

## Errores

| HTTP | `error.code` | Cuándo |
|---|---|---|
| 403 | `FORBIDDEN` | El rol no puede; el `funcional` no tiene asignada la acción; `view=technical` sin ser `auditor`/`consultor`; el proponente intenta decidir |
| 404 | `NOT_FOUND` | La acción, el servicio o la propuesta no existen para esta empresa |
| 409 | `CHANGE_ALREADY_PENDING` | Ya hay una propuesta pendiente del mismo `change_type` sobre esa acción |
| 409 | `CONTROL_RETIRED` | La acción ya está dada de baja |
| 409 | `ALREADY_DECIDED` | La propuesta ya fue aprobada o rechazada |
| 422 | `VALIDATION_FAILED` | Campos: `required`, `enum.invalid`, `string.max`, y los propios de abajo |

Códigos de campo propios: `category.not_in_scope` (`trust_criterion` no es una categoría contratada), `dimension.policy_only` (`dimensions[i]` en un control propio),
`reason.required` (`proposed_values.dimensions[i].reason_not_applicable` cuando `applies` es `false`), `note.required` (`decision_note` al rechazar).

Claves i18n: `control.list`, `control.read`, `control.created`, `control_change.requested`, `control_change.decided`.

## Ejemplos de error

Todos con el mismo sobre (`conventions.md`); `message` es la clave i18n del error.

**`403` — un `admin_empresa` pide `?view=technical`**

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

**`409` — ya hay una propuesta pendiente del mismo tipo**

```json
{
  "statusCode": 409,
  "message": "control_change.already_pending",
  "data": null,
  "error": {
    "code": "CHANGE_ALREADY_PENDING"
  }
}
```

**`422` — una dimensión que no aplica sin motivo, y una categoría que el servicio no contrató**

```json
{
  "statusCode": 422,
  "message": "validation.failed",
  "data": null,
  "error": {
    "code": "VALIDATION_FAILED",
    "fields": [
      {
        "field": "proposed_values.dimensions[1].reason_not_applicable",
        "code": "reason.required",
        "message": "Indica por qué esta dimensión no aplica."
      },
      {
        "field": "trust_criterion",
        "code": "category.not_in_scope",
        "message": "Tu servicio no tiene contratada esa categoría."
      }
    ]
  }
}
```

## Auditoría

| `action` | Cuándo | Quién |
|---|---|---|
| `client_control.create` | se crea un control propio | `admin_empresa` |
| `client_control_change.request` | se propone un cambio | `admin_empresa`, `funcional` |
| `client_control_change.decide` | el consultor aprueba o rechaza (con `before_state`/`after_state` del control cuando se aplica) | `consultor` |

Aprobar un cambio que altera lo que se mide deja además un `compliance_events` en la misma transacción.

## Estado de implementación

**Construido: MD-117** (listar y ver; 2026-10-14). Crear un control propio (MD-150), proponer y decidir cambios (MD-118, MD-156) **no**.

- Lo que sale **hoy** con valores fijos, porque las tablas que los calculan aún no existen (`DT-71`): `approval` es siempre `approved`, `has_pending_change` es `false`, `origin` es siempre `catalog`.
- `display_name` de una prueba es el nombre neutro que escribe Monkey (D70); mientras una prueba no lo tenga, sale un texto genérico de su dimensión («Prueba de nube», «Revisión documental»…). **Nunca** el nombre del comité.
- **Sin resultados guardados todo sale «Sin medir».** El paso de lo que mide la sonda a `evaluations` no está construido (`DT-50`): una acción sube de «Sin medir» en cuanto existan evaluaciones de su test sobre los activos del servicio.
- Un test de la dimensión documental cuenta siempre como pendiente hasta que se guarde su veredicto o la validación de sus evidencias (`P25`).
- El `consultor` solo puede leer la empresa donde trabaja cuando exista la elección de empresa al iniciar sesión (MD-160); hasta entonces, los datos de un cliente los lee el `auditor`.

## Preguntas abiertas

- **`P3`**: el detalle por pantalla de cada rol puede ajustar la tabla de «Quién puede qué».
- **Filtro `assigned_to` y campo `assigned_to`**: la asignación de acciones a personas con cuenta es MD-158 (fuera de este sprint). Hasta entonces el campo viene `null` y el filtro devuelve vacío.
