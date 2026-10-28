---
id: contracts-compliance-controls
name: Contrato — Cumplimiento, controles
description: Listar y ver los controles de un servicio, crear un control propio y editarlo o darlo de baja directamente (D96).
type: contract
---

# Cumplimiento — controles

**Estado: ACORDADO, reescrito por D96 (2026-10-27): no hay propuestas ni consultor que las apruebe.** Listar, ver y crear un control propio están construidos; la edición y la baja directas **no** (hoy el Backend tiene el circuito de propuestas de D65: ver «Estado de implementación»). Ver `conventions.md` (sección «Cumplimiento: roles, vistas y decisiones») y `enums.md`. Tickets: MD-117, MD-118, MD-150, MD-156 (queda sin objeto).

**Qué es.** Un *control* del servicio es un **control del cliente** (`client_controls`, `modelo-datos.md` §7.1): el control del catálogo que el servicio heredó al contratar
un marco, o uno propio. Todo lo que se mide cuelga de él. **Entidades:** `client_controls`, `client_control_dimensions`, `service_dimension_owners` y `user_control_assignments` (el responsable por dimensión, `users-team.md`).
**App:** Monkey Platform. En el cable se llama `controls` y las pantallas también le dicen «control» (D80: el vocabulario del dominio; el nombre «acción de protección» se retira).

**El `admin_empresa` es quien edita (D96).** Crea un control propio, cambia su interpretación o sus dimensiones y lo da de baja **directamente**, con advertencia y confirmación en pantalla (`P33`). Cambiar lo que se mide cambia el avance del servicio: la API lo hace al instante y deja el rastro y el evento de cumplimiento. «Eliminar» es **dar de baja, no borrar** (`conventions.md`).

## Quién puede qué

| Acción | `admin_empresa` | `funcional` | `auditor` |
|---|---|---|---|
| Listar y ver | todas | **solo aquellas de las que es responsable** (alguna de sus dimensiones) | todas |
| Pedir `view=technical` | ✓ (D81) | `403` | ✓ |
| Crear un control propio | ✓ | `403` | `403` |
| Editar la interpretación o las dimensiones | ✓ | `403` | `403` |
| Dar de baja | ✓ | `403` | `403` |

Vigente hasta que el comité entregue los permisos por pantalla (`P3`): si ese documento cambia un renglón, se ajusta aquí. El Excel marca «editar control» como ⊗ para el `funcional`; mientras `P3` siga abierta, **no edita**.
## `GET /v1/services/{service_id}/controls`

Lista paginada. Se omiten los dados de baja. Un servicio recién clonado trae unas 80 acciones y la lista responde sin consultas repetidas.

| Parámetro | Valores |
|---|---|
| `trust_criterion` | una de las 5 categorías (`enums.md` `trust_criterion`) |
| `type` | `manual` · `automated` · `hybrid` · `technical_manual` (`control_type`) |
| `readiness` | `ready` · `almost_ready` · `needs_work` · `not_measured` |
| `responsible` | `uuid` de un `funcional`: solo los controles de los que es responsable efectivo en alguna dimensión (`users-team.md`) |
| `origin` | `catalog` · `own` |
| `page`, `page_size`, `sort` | convenciones; `sort` acepta `code` (por defecto: el código interno por prefijo y número, `IAC-2` antes que `IAC-10`, `C2` antes que `C10`), `-code`, `name` y `-name` |

```json
{
  "statusCode": 200,
  "message": "control.list",
  "data": {
    "items": [
      {
        "id": "3f1c…",
        "code": "IAC-12",
        "requirement_codes": ["CC6.1", "CC6.2"],
        "own_code": null,
        "name": "Gestión de accesos de usuarios",
        "origin": "catalog",
        "type": "hybrid",
        "trust_criteria": ["security"],
        "approval": "approved",
        "readiness": "needs_work",
        "progress": { "done": 3, "total": 5 },
        "coverage": { "measured": 4, "applicable": 5 },
      },
      {
        "id": "9d44…",
        "code": "C01",
        "requirement_codes": [],
        "own_code": "C01",
        "name": "Revisión trimestral de proveedores",
        "origin": "own",
        "type": "manual",
        "trust_criteria": ["security"],
        "approval": "approved",
        "readiness": "not_measured",
        "progress": { "done": 0, "total": 1 },
        "coverage": { "measured": 0, "applicable": 1 },
      }
    ],
    "page": 1, "page_size": 25, "total": 2, "total_pages": 1
  }
}
```

- `code` es **el código que identifica al control y se muestra siempre** (D80): el del catálogo (`IAC-12`) en uno del catálogo y el `own_code` (`C01`) en uno propio. `requirement_codes` son los requisitos del marco que cubre (`CC6.1`); un control propio no cubre ninguno (D65), así que viene vacío. Antes (D63) estos códigos solo viajaban en `technical`.
- `own_code` es la numeración **por servicio de los controles propios** (`C01`, `C02`…) y es `null` en uno del catálogo.
- `name` de un control del catálogo sale del catálogo (hoy solo en español); el de uno propio lo escribe la empresa.
- `approval` de un control del catálogo es siempre `approved`. Un control propio **cuenta en el avance desde que se crea, aunque esté `pending`**; si se rechaza, se da de baja y deja de contar (D65).
- `trust_criteria` es un array: un control del catálogo puede servir a varias categorías y **cuenta una sola vez** en el marco.
- Con **`?view=technical`** cada ítem agrega `technical`:

```json
"technical": {
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
    "code": "IAC-12",
    "requirement_codes": ["CC6.1", "CC6.2"],
    "own_code": null,
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
        "latest_submission": { "id": "b310…", "version": 2, "evidence_state": "pending" }
      }
    ],
    "causes": [ { "id": "7c2e…", "name": "Cuentas sin dueño tras una salida de personal" } ],
    "readiness": "needs_work",
    "progress": { "done": 3, "total": 5 },
    "coverage": { "measured": 4, "applicable": 5 },
    "failing": [
      { "dimension": "cloud", "affected": [ { "kind": "asset", "id": "8f10…", "name": "cuenta-aws-produccion" } ] }
    ]
  }
}
```

- `dimensions` lista **todas las que el control exige**; una que no aplica **se declara con su motivo**, nunca se omite.
- `interpretation.is_customized` es `true` si la empresa la reescribió; si no, es el texto del catálogo.
- `failing` dice **en qué falla**, por dimensión, con el activo o la prueba afectados (`kind`: `asset` · `test`, y un `display_name` en vez de `name` cuando es una prueba). Nunca el texto de la prueba.
- Con `?view=technical` agrega `technical` (los mismos campos técnicos de la lista —puntos de enfoque, estado del control, número de pruebas— y, además, `tests`: `[ { "test_id": "21ab…", "test_code": "T-CLD-001", "display_name": "Prueba de nube", "display_description": "Verificar que…", "dimension": "cloud", "state": "compliant" } ]`, con `state` = `test_state` y `display_description` la descripción corta de la prueba o `null` si aún no se cargó, D82). El detalle completo de los tests está en `compliance-audit.md`.

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

`dimensions` es opcional; si viene, solo puede ser `["policy"]`. Responde `201` con el mismo objeto del detalle, `approval: "pending"` y el `own_code` que el servidor asigna (el siguiente libre del servicio):

```json
{
  "statusCode": 201,
  "message": "control.created",
  "data": {
    "id": "9d44…",
    "service_id": "55aa…",
    "code": "C01",
    "requirement_codes": [],
    "own_code": "C01",
    "name": "Revisión trimestral de proveedores",
    "origin": "own",
    "type": "manual",
    "trust_criteria": ["security"],
    "approval": "approved",
    "interpretation": { "text": "Cada trimestre TI revisa que los proveedores críticos sigan cumpliendo el contrato.", "is_customized": true },
    "dimensions": [ { "dimension": "policy", "applies": true, "type": "manual", "reason_not_applicable": null } ],
    "evidence": [],
    "causes": [],
    "readiness": "not_measured",
    "progress": { "done": 0, "total": 1 },
    "coverage": { "measured": 0, "applicable": 1 },
    "failing": []
  }
}
```

Nace `approved` y **cuenta desde el primer momento** (D65, D96). `trust_criterion` debe ser una categoría **contratada por el servicio**
(`security` siempre lo está).

## `PATCH /v1/controls/{id}` — editar

Solo `admin_empresa`. Cambia la interpretación o las dimensiones **al instante**; las dos cosas pueden ir juntas. Responde `200` con el control ya cambiado (el objeto de arriba).

| Campo | Valor |
|---|---|
| `interpretation` | `{ "text": "texto nuevo" }`. Queda marcada como personalizada (`is_customized`) y se conserva el texto original del catálogo |
| `dimensions` | `[ { "dimension": "database", "applies": false, "reason_not_applicable": "…" }, … ]`. Una dimensión con `applies: false` **exige** `reason_not_applicable` |

```json
{
  "dimensions": [
    { "dimension": "policy", "applies": true },
    { "dimension": "database", "applies": false, "reason_not_applicable": "No operamos bases de datos propias." }
  ]
}
```

- Un control **propio** solo admite la dimensión `policy` (`dimension.policy_only`).
- Quitar una dimensión deja de medir sus pruebas: el avance del servicio puede cambiar. Si esa dimensión tiene un **responsable** (`users-team.md`), la excepción del control en ella se elimina; el responsable del servicio no se toca.
- Editar un control dado de baja es `409 CONTROL_RETIRED`.
- Si el cambio altera lo que se mide, deja además un `compliance_events` en la misma transacción.

## `DELETE /v1/controls/{id}` — dar de baja

Solo `admin_empresa`. Sin cuerpo; responde `204`. **Es una baja, no un borrado** (`conventions.md`): `is_active = false`, el control **deja de contar** y de verse en las listas (salvo `?include_inactive=true`), y el histórico —evaluaciones inmutables, evidencias, auditoría— se conserva. Darlo de baja dos veces es `409 CONTROL_RETIRED`.
Qué advierte la pantalla antes de confirmar (pruebas que dejan de contar, riesgos y causas que quedan sin ese control, cómo se mueve el avance) es `P33`; la API no pide confirmación: el `DELETE` es el acto confirmado.
## Errores

| HTTP | `error.code` | Cuándo |
|---|---|---|
| 403 | `FORBIDDEN` | El rol no puede; el `funcional` no es responsable de ese control; `view=technical` sin ser `admin_empresa` o `auditor` |
| 404 | `NOT_FOUND` | El control o el servicio no existen para esta empresa |
| 409 | `CONTROL_RETIRED` | El control ya está dado de baja |
| 422 | `VALIDATION_FAILED` | Campos: `required`, `enum.invalid`, `string.max`, y los propios de abajo |

Códigos de campo propios: `category.not_in_scope` (`trust_criterion` no es una categoría contratada), `dimension.policy_only` (`dimensions[i]` en un control propio),
`reason.required` (`dimensions[i].reason_not_applicable` cuando `applies` es `false`).

Claves i18n: `control.list`, `control.read`, `control.created`, `control.updated`, `control.retired`.

## Ejemplos de error

Todos con el mismo sobre (`conventions.md`); `message` es la clave i18n del error.

**`403` — un `funcional` pide `?view=technical`**

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
        "field": "dimensions[1].reason_not_applicable",
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
| `client_control.update` | se edita la interpretación o las dimensiones (con `before_state`/`after_state`) | `admin_empresa` |
| `client_control.retire` | se da de baja (con `before_state`) | `admin_empresa` |

Crear, editar dimensiones o dar de baja altera lo que se mide y deja además un `compliance_events` en la misma transacción.

## Estado de implementación

**Pendiente por D80 (2026-10-15):** `code` y `requirement_codes` en la **vista de negocio** (lista, detalle y creación). El backend aún los devuelve solo dentro de `technical` (`control_code`, `requirement_codes`) y `403` para el resto de roles; hay que moverlos a la base y dejar en `technical` solo lo demás (**MD-166**). Hasta entonces, el frontend muestra el código cuando llega y no lo inventa.

**Construido con el modelo anterior (2026-10-14):** MD-117 (listar y ver), MD-150 (crear un control propio) y MD-118 (proponer cambios y listarlos, `POST`/`GET /v1/controls/{id}/changes`). Para dejarlo como dice este contrato, el Backend debe:

- **Retirar el circuito de propuestas:** `POST` y `GET /v1/controls/{id}/changes`, el campo `has_pending_change`, el filtro `approval` y el campo `assigned_to` (que lo reemplaza `users-team.md`). La tabla `client_control_changes` y sus enums quedan **sin uso**, sin borrarse.
- **Crear `PATCH` y `DELETE /v1/controls/{id}`** como arriba, con su auditoría y su evento de cumplimiento, y que un control propio nazca `approved`.
- **Filtrar por responsable:** para el `funcional`, la lista y el detalle devuelven solo los controles con un par (control, dimensión) del que es responsable efectivo.
- `display_name` de una prueba es el nombre neutro que escribe Monkey (D70); mientras una prueba no lo tenga, sale un texto genérico de su dimensión («Prueba de nube», «Revisión documental»…). **Nunca** el nombre del comité. `display_description` sigue la misma regla (D82): el objetivo del comité o su reescritura neutra, nunca el texto que nombra al proveedor.
- **Sin resultados guardados todo sale «Sin medir».** El motor de nube lo escribe desde 2026-10-22 al cerrar cada corrida (`DT-50`); la sonda de servidores, todavía no. Un control sube de «Sin medir» en cuanto existan evaluaciones de su test sobre los activos del servicio, y solo cuentan los checks que el comité ratificó (con `READINESS_INCLUDE_PROPOSED=true`, también los propuestos).
- Un test de la dimensión documental sale de la revisión de lo que se entregó **para esa prueba en este control** (D88): sin evidencias o sin revisar, `pending`; nunca cumple por sí solo.

## Preguntas abiertas

- **`P3`**: el detalle por pantalla de cada rol puede ajustar la tabla de «Quién puede qué».
- **`P33`**: qué advierte la pantalla al editar o dar de baja un control.