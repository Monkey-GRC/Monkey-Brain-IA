---
id: contracts-compliance-controls
name: Contrato — Cumplimiento, controles
description: Listar y ver los controles de un servicio, crear un control propio y editarlo o darlo de baja directamente (D96).
type: contract
---

# Cumplimiento — controles

> **VF18 (D128).** Con la VF18 el control se mide por **requisitos del control**, con un **nivel de 0 a 5** y **estados de gestión** con dos aprobaciones (D130, D132), y sus pruebas le pertenecen (D129). **El motor v2 (MD-498) ya calcula todo lo de esta API** y agrega sus campos sin quitar los viejos: ver [Motor v2](#motor-v2-md-498-campos-nuevos-y-compatibilidad). Los estados de gestión llegan con RC-07 (MD-504).

## Motor v2 (MD-498): campos nuevos y compatibilidad

Desde MD-498 el cálculo sale del motor v2 (§9, D130). **Los campos de abajo se agregan; ninguno de los existentes se quita** hasta que las pantallas v2 (MD-499) dejen de leerlos. Los viejos se derivan del motor nuevo, así que dicen lo mismo con otra forma.

**Qué cambia de significado en los campos que ya existen** (lista, detalle y `failing_controls` del resumen):

| Campo | Desde MD-498 |
|---|---|
| `progress` | `{ done, total }` = requisitos del control en Cumple ÷ requisitos aplicables (los No aplica salen). Es el **C%** (R4) |
| `coverage` | `{ measured, applicable }` = requisitos ya decididos (Cumple, No cumple o Vencido) ÷ aplicables |
| `readiness` | El semáforo sobre ese avance (§9): `ready` solo si el control cumple (Adecuado o Sólido) y no hay nada pendiente |
| `technical.control_state` | Derivado del nivel: `effective` si Adecuado o Sólido · `ineffective` si algún requisito No cumple · `expired` si alguno está Vencido · `no_tests` si no tiene requisitos aplicables · si no, `evaluating` |
| `technical.tests[].state` | `test_state` derivado de `test_status`: `correct` y `observation` → `compliant` · `exception` → `non_compliant` · `expired` → `expired` · `not_applicable` → `not_applicable` · `pending` → `pending` |
| `failing[]` | Los activos de los checks Directos en FAIL y las pruebas en Excepción o Vencidas |

**Campos nuevos, solo en la vista técnica** (`?view=technical`, `auditor` y `admin_empresa`; §9: los niveles y los requisitos son vista técnica):

| Campo | Tipo | Qué es |
|---|---|---|
| `technical.level` | enum `control_level` | Nivel sugerido por el motor (R1 a R6) |
| `technical.level_value` | integer 0–5 | El valor de la escala |
| `technical.complies` | boolean | `true` solo en `adequate` y `solid` (R4) |
| `technical.c_percent` | number \| null | C% con dos decimales; `null` si no hay requisitos aplicables |
| `technical.requirements[]` (solo en el detalle) | objeto | `id`, `code` (`IDA-11-L3`), `text`, `type`, `periodicity`, `status` (enum `requirement_status`) y `tests[]` |
| `…requirements[]` (MD-500) | | Además: `suggested_periodicity` (la del catálogo) y `periodicity_source` (`catalog` · `client`, si la cambió el `admin_empresa`) |
| `technical.periodicity_change` (MD-500) | objeto \| null | El último cambio de periodicidad del control (D147): `{ periodicity, justification, changed_at }`; `null` si usa la sugerida |
| `technical.period` (MD-500, R6) | objeto \| null | La vista **del período** auditado abierto: `level`, `complies`, `windows: { total, with_evidence }` (las ventanas **ya cerradas** del período; la vigente no cuenta) y `missing[]` (`{ requirement_code, window_start, window_end }`, las ventanas ya cerradas del período sin evidencia válida). `null` si el período no está definido. Los campos de arriba son la vista **a la fecha** |
| `…requirements[].tests[]` | objeto | `test_id`, `test_code`, `display_name`, `status` (enum `test_status`), `window_end` (fecha de cierre de la ventana actual o `null`), `alert_at` (MD-500: el día del aviso previo, `window_end` − PR-06; `null` sin ventana) y, en las técnicas, `checks: { direct_pass, direct_fail, direct_exception, no_data, complementary_fail }` y `asset_coverage: { with_result, in_scope }` |

```json
"technical": {
  "control_state": "ineffective",
  "level": "partial",
  "level_value": 3,
  "complies": false,
  "c_percent": 80.0,
  "requirements": [
    {
      "id": "a41e…", "code": "IAC-12-L2", "text": "Los accesos privilegiados se revisan cada trimestre.",
      "type": "operational", "periodicity": "quarterly", "status": "non_compliant",
      "tests": [ { "test_id": "21ab…", "test_code": "T-IAC-12-02", "display_name": "Revisión de accesos privilegiados", "status": "exception", "window_end": "2026-12-31", "checks": null, "asset_coverage": null } ]
    }
  ]
}
```

**Reglas del motor v2 que se ven en la API:**
- **Requisitos del control del cliente** (`client_control_requirements`): se copian del catálogo al clonar el servicio, uno por requisito del control, con su periodicidad. Un control propio no tiene requisitos del catálogo: se mide con su evidencia como un requisito documental único.
- **Pruebas técnicas** (T-04): solo deciden los checks **Directos** que aplican; un Complementario en FAIL da Observación; una Dependencia toma el estado de la prueba del control dueño. Un activo en alcance sin resultado deja la prueba **Pendiente** mientras su ventana está abierta y en **Excepción** al cerrarla (D140). Los vínculos «N/A» de módulos y puntajes se evalúan con D141 y D146.
- **Pruebas manuales — puente hasta MD-504 y MD-506** (`DT-114`): la prueba toma el estado de la evidencia que se sube hoy para ella: validada → Correcto · rechazada → Excepción · sin entrega o sin revisar → Pendiente · fuera de su ventana → Vencido.
- **Ventanas** (D131, D140): calendario según la periodicidad del requisito (o, si no tiene, la de su control); la anual son 12 meses desde la última evidencia válida. La periodicidad la puede cambiar el `admin_empresa` por control (D147, `PUT /v1/controls/{id}/periodicity`).
- **Ventanas cerradas y período** (MD-500, R6, G-11): solo cuentan las ventanas que caen dentro del período auditado abierto, y una evidencia fechada fuera de él no cuenta. Una ventana cerrada sin evidencia válida deja el requisito **Vencido**; un activo en alcance sin resultado al cerrar la ventana deja la prueba técnica en **Excepción** (D140). **Sólido** exige además evidencia en todas las ventanas cerradas del período y 100 % de cobertura de activos (o evidencia automática continua).
- **Lo permanente** (PR-05): un resultado automático de más de 24 h deja la evidencia desactualizada y la prueba **Pendiente**. Lo «cuando sea requerido» se mide por trimestre (D131 punto 3).
- **Parámetros** PR-01 a PR-05 y el umbral de D146: los lee el motor de la configuración, con los valores por defecto del libro (§9); nunca están escritos en el código.

| | |
|---|---|
| **Estado** | **ACORDADO**, reescrito por D96 (2026-10-27): no hay propuestas que aprobar, el `admin_empresa` cambia directo. Listar, ver, crear, editar y dar de baja están construidos (2026-10-28). **D102** cambia el alcance por dimensión por **dueño y ejecutor** (por construir en el sprint 3, MD-193) |
| **App** | Monkey Platform |
| **Entidades** | `client_controls`, `client_control_dimensions`, `client_control_assignments` (`modelo-datos.md` §7.1, §5.2) |
| **Tickets** | MD-117, MD-118, MD-150, MD-156 (sin objeto) · sprint 3: MD-193 |
| **Contexto común** | [`README.md`](README.md) · [`conventions.md`](../conventions.md) (sección «Cumplimiento: roles, vistas y decisiones») · [`enums.md`](../enums.md) |

**Qué es.** Un *control* del servicio es un **control del cliente** (`client_controls`): el control del catálogo que el servicio heredó al contratar un marco, o uno propio. Todo lo que se mide cuelga de él. En el cable se llama `controls` y las pantallas también le dicen «control» (D80: el vocabulario del dominio; el nombre «acción de protección» se retira). Quién es dueño y quién ejecuta cada control está en [`gestion-usuarios.md`](../gestion-usuarios.md).

**El `admin_empresa` es quien edita (D96).** Crea un control propio, cambia su interpretación o sus dimensiones y lo da de baja **directamente**, con advertencia y confirmación en pantalla (`P33`). Cambiar lo que se mide cambia el avance del servicio: la API lo hace al instante y deja el rastro y el evento de cumplimiento. «Eliminar» es **dar de baja, no borrar** (`conventions.md`).

## Índice de endpoints

| Método | Ruta | Quién | Para qué |
|---|---|---|---|
| `GET` | [`/v1/services/{service_id}/controls`](#get-v1servicesservice_idcontrols--listar-los-controles-de-un-servicio) | Todos los roles de empresa (cada uno ve lo suyo) | Listar los controles |
| `GET` | [`/v1/controls/{id}`](#get-v1controlsid--el-detalle-de-un-control) | Los mismos | El detalle de un control |
| `POST` | [`/v1/services/{service_id}/controls`](#post-v1servicesservice_idcontrols--crear-un-control-propio) | `admin_empresa` | Crear un control propio |
| `PATCH` | [`/v1/controls/{id}`](#patch-v1controlsid--editar-un-control) | `admin_empresa` | Editar interpretación o dimensiones |
| `DELETE` | [`/v1/controls/{id}`](#delete-v1controlsid--dar-de-baja-un-control) | `admin_empresa` | Dar de baja |
| `PUT` | [`/v1/controls/{id}/periodicity`](#put-v1controlsidperiodicity--cambiar-la-periodicidad-de-un-control) | `admin_empresa` | Cambiar la periodicidad con justificación (G-10, D147) |

## Quién puede qué

| Acción | `admin_empresa` | `responsable` y `delegado` | `auditor` |
|---|---|---|---|
| Listar y ver | todos | **solo sus controles** (el responsable, los que tiene a su cargo; el delegado, los que ejecuta; D102) | todos |
| Pedir `view=technical` | ✓ (D81) | `403` | ✓ |
| Crear un control propio | ✓ | `403` | `403` |
| Editar la interpretación o las dimensiones | ✓ | `403` | `403` |
| Dar de baja | ✓ | `403` | `403` |
| Cambiar la periodicidad (D147) | ✓ | `403` | `403` |

> Vigente con la matriz de `modelo/05-usuarios.md` §5.5 (D102: el comité no entregará el Excel por pantalla). El Excel marcaba «editar control» como ⊗ para el `funcional` (rol que D96 y D102 reemplazaron); el `responsable` y el `delegado` **no editan**.

---

### GET /v1/services/{service_id}/controls — Listar los controles de un servicio

| | |
|---|---|
| **Quién** | `admin_empresa` y `auditor` (todos) · `responsable` y `delegado` (solo los suyos) |
| **Éxito** | `200`, paginada. Se omiten los dados de baja. Un servicio recién clonado trae unas 80 acciones y la lista responde sin consultas repetidas |
| **Errores** | `403` (`view=technical` sin ser `admin_empresa` o `auditor`) · `404` |

#### Parámetros (query)
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `trust_criterion` | enum `trust_criterion` | no | Una de las 5 categorías |
| `type` | enum `control_type` | no | `manual` · `automated` · `hybrid` · `technical_manual` |
| `readiness` | enum `readiness` | no | `ready` · `almost_ready` · `needs_work` · `not_measured` |
| `responsible` | uuid | no | Solo los controles de los que esa persona (un `responsable` o `delegado`) es dueño o ejecutor (`gestion-usuarios.md`, D102) |
| `assignment` | enum `assignment` | no | `unassigned` lista los **«Sin asignar»** y `assigned` los que tienen dueño. Solo `admin_empresa`: otro rol que lo envíe recibe `403` |
| `origin` | string | no | `catalog` · `own` |
| `page`, `page_size` | integer | no | Ver `conventions.md` |
| `sort` | string | no | `code` (por defecto: el código interno por prefijo y número, `IAC-2` antes que `IAC-10`, `C2` antes que `C10`), `-code`, `name`, `-name` |
| `view` | string | no | `technical` agrega el objeto `technical` |

#### Response `200`
| Campo del ítem | Tipo | Qué es |
|---|---|---|
| `id` | uuid | |
| `code` | string | **El código que identifica al control y se muestra siempre** (D80): el del catálogo (`IAC-12`) o el `own_code` (`C01`) en uno propio |
| `requirement_codes` | string[] | Requisitos del marco que cubre (`CC6.1`); un control propio no cubre ninguno (D65), viene vacío |
| `own_code` | string \| null | Numeración **por servicio** de los controles propios (`C01`, `C02`…); `null` en uno del catálogo |
| `name` | string | El del catálogo (hoy solo en español) o el que escribe la empresa |
| `origin` | string | `catalog` · `own` |
| `type` | enum `control_type` | |
| `trust_criteria` | enum[] | Un control del catálogo puede servir a varias categorías y **cuenta una sola vez** en el marco |
| `approval` | enum `control_approval` | Siempre `approved` (D96) |
| `readiness` | enum `readiness` | |
| `progress` | `{ done, total }` | |
| `coverage` | `{ measured, applicable }` | |
| `owner`, `executor` | `{ id, name, last_name, role }` \| null | Dueño y ejecutor (D102); `null` si no hay |

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
        "coverage": { "measured": 4, "applicable": 5 }
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
        "coverage": { "measured": 0, "applicable": 1 }
      }
    ],
    "page": 1, "page_size": 25, "total": 2, "total_pages": 1
  }
}
```

#### Vista técnica (`?view=technical`)
Cada ítem agrega:
```json
"technical": { "points_of_focus": ["CC6.1-POF1"], "control_state": "ineffective", "tests_count": 5 }
```
`control_state` es el de `enums.md` (`effective`, `ineffective`…). El detalle de los tests de un control está en [`veredictos.md`](veredictos.md).

> Un control propio **cuenta en el avance desde que se crea**.

---

### GET /v1/controls/{id} — El detalle de un control

| | |
|---|---|
| **Quién** | Mismas reglas de acceso que la lista |
| **Éxito** | `200` |
| **Errores** | `403` (control ajeno de su empresa; `view=technical` sin ser `admin_empresa` o `auditor`) · `404` |

#### Response `200`
| Campo | Tipo | Qué es |
|---|---|---|
| `id`, `service_id`, `code`, `requirement_codes`, `own_code`, `name`, `origin`, `type`, `trust_criteria`, `approval` | | Como en la lista |
| `interpretation` | `{ text, is_customized }` | `is_customized` es `true` si la empresa la reescribió; si no, es el texto del catálogo |
| `dimensions[]` | `{ dimension, applies, type, reason_not_applicable }` | **Todas las que el control exige**; una que no aplica **se declara con su motivo**, nunca se omite |
| `evidence[]` | `{ requirement_id, description, responsible, latest_submission }` | `responsible` es el **cargo de la organización** (`organization_responsibles`); `latest_submission` trae `id`, `version` y `evidence_state` |
| `causes[]` | `{ id, code, name }` | |
| `readiness`, `progress`, `coverage` | | Como en la lista |
| `failing[]` | `{ dimension, affected[] }` | **En qué falla**, por dimensión, con el activo o la prueba afectados (`kind`: `asset` · `test`, y un `display_name` en vez de `name` cuando es una prueba). Nunca el texto de la prueba |
| `owner`, `executor` | `{ id, name, last_name, role }` \| null | **Dueño y ejecutor (D102)**: los ven `admin_empresa` y `auditor`, y el `responsable` y el `delegado` solo en sus controles |

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
    "causes": [ { "id": "7c2e…", "code": "F012", "name": "Cuentas sin dueño tras una salida de personal" } ],
    "readiness": "needs_work",
    "progress": { "done": 3, "total": 5 },
    "coverage": { "measured": 4, "applicable": 5 },
    "failing": [
      { "dimension": "cloud", "affected": [ { "kind": "asset", "id": "8f10…", "name": "cuenta-aws-produccion" } ] }
    ],
    "owner": { "id": "7d2e…", "name": "María", "last_name": "Gómez", "role": "responsable" },
    "executor": { "id": "c4a1…", "name": "Juan", "last_name": "Pérez", "role": "delegado" }
  }
}
```

> Con `?view=technical` agrega `technical`: los mismos campos técnicos de la lista (puntos de enfoque, estado del control, número de pruebas) y, además, `tests`: `[ { "test_id": "21ab…", "test_code": "T-CLD-001", "display_name": "Prueba de nube", "display_description": "Verificar que…", "dimension": "cloud", "state": "compliant" } ]`, con `state` = `test_state` y `display_description` la descripción corta de la prueba o `null` si aún no se cargó (D82). El detalle completo de los tests está en [`veredictos.md`](veredictos.md).

---

### POST /v1/services/{service_id}/controls — Crear un control propio

| | |
|---|---|
| **Quién** | `admin_empresa` |
| **Éxito** | `201` con el objeto del detalle; nace `approved` y **cuenta desde el primer momento** (D65, D96) |
| **Errores** | `403` · `404` · `422 VALIDATION_FAILED` (`category.not_in_scope`, `dimension.policy_only`) |

Un control propio es **solo documental** (su única dimensión es `policy`, su tipo `manual`) y no se vincula a ningún requisito (D65). Nace **«Sin asignar»** (D102).

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `name` | string | sí | |
| `interpretation` | string | sí | |
| `trust_criterion` | enum `trust_criterion` | sí | Debe ser una categoría **contratada por el servicio** (`security` siempre lo está); si no, `category.not_in_scope` |
| `dimensions` | string[] | no | Si viene, solo puede ser `["policy"]` (`dimension.policy_only`) |

```json
{
  "name": "Revisión trimestral de proveedores",
  "interpretation": "Cada trimestre TI revisa que los proveedores críticos sigan cumpliendo el contrato.",
  "trust_criterion": "security",
  "dimensions": ["policy"]
}
```

#### Response `201`
El objeto del detalle, con el `own_code` que el servidor asigna (el siguiente libre del servicio).

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
    "failing": [],
    "owner": null,
    "executor": null
  }
}
```

### PATCH /v1/controls/{id} — Editar un control

| | |
|---|---|
| **Quién** | `admin_empresa` |
| **Éxito** | `200` con el control ya cambiado |
| **Errores** | `403` · `404` · `409 CONTROL_RETIRED` · `422 VALIDATION_FAILED` (`dimension.policy_only`, `reason.required`) |

Cambia la interpretación o las dimensiones **al instante**; las dos cosas pueden ir juntas.

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `interpretation` | `{ text }` | no | Queda marcada como personalizada (`is_customized`) y se conserva el texto original del catálogo |
| `dimensions` | `[ { dimension, applies, reason_not_applicable } ]` | no | Una dimensión con `applies: false` **exige** `reason_not_applicable` (`reason.required`) |

```json
{
  "dimensions": [
    { "dimension": "policy", "applies": true },
    { "dimension": "database", "applies": false, "reason_not_applicable": "No operamos bases de datos propias." }
  ]
}
```

#### Reglas
- Un control **propio** solo admite la dimensión `policy` (`dimension.policy_only`).
- Quitar una dimensión deja de medir sus pruebas: el avance del servicio puede cambiar.
- Editar un control dado de baja es `409 CONTROL_RETIRED`.
- Si el cambio altera lo que se mide, deja además un `compliance_events` en la misma transacción.

### DELETE /v1/controls/{id} — Dar de baja un control

| | |
|---|---|
| **Quién** | `admin_empresa` |
| **Éxito** | `204` (sin cuerpo) |
| **Errores** | `403` · `404` · `409 CONTROL_RETIRED` (darlo de baja dos veces) |

**Es una baja, no un borrado** (`conventions.md`): `is_active = false`, el control **deja de contar** y de verse en las listas y en el detalle (`404`; no existe `?include_inactive` para controles), y el histórico —evaluaciones inmutables, evidencias, auditoría— se conserva. Si tenía dueño y ejecutor, su asignación se retira.

> Qué advierte la pantalla antes de confirmar (pruebas que dejan de contar, riesgos y causas que quedan sin ese control, cómo se mueve el avance) es `P33`; la API no pide confirmación: el `DELETE` es el acto confirmado.

---

### PUT /v1/controls/{id}/periodicity — Cambiar la periodicidad de un control

| | |
|---|---|
| **Quién** | `admin_empresa` |
| **Éxito** | `200` con el detalle del control ya recalculado (como `GET /v1/controls/{id}`) |
| **Errores** | `403` · `404` · `409 CONTROL_RETIRED` · `422 VALIDATION_FAILED` (`enum.invalid`, `required`, `string.max`, `periodicity.own_control`) |

Cambia la periodicidad del control **al instante** (G-10, D147): se aplica a **todos sus requisitos**, Monkey recalcula las ventanas y el nivel. `periodicity: null` vuelve a la sugerida por el catálogo.

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `periodicity` | enum `periodicity` \| null | sí | `null` = volver a la sugerida |
| `justification` | string | sí | 1 a 1000 caracteres, sin contar espacios de los extremos. Queda en el rastro |

```json
{ "periodicity": "monthly", "justification": "Rotamos accesos cada mes por exigencia del contrato con el banco." }
```

#### Reglas
- Un control **propio** no tiene requisitos del catálogo: responde `422` con `periodicity.own_control` (en `periodicity`).
- Repetir la misma periodicidad no cambia nada ni deja rastro nuevo.
- Deja `client_control.periodicity_set` en el rastro, con el valor anterior, el nuevo y la justificación, y, si cambia el estado del control, un `compliance_events`, todo en la misma transacción.

## Errores del módulo

| HTTP | `error.code` | Cuándo |
|---|---|---|
| 403 | `FORBIDDEN` | El rol no puede; el control no es del `responsable` o `delegado` que lo pide; `view=technical` sin ser `admin_empresa` o `auditor` |
| 404 | `NOT_FOUND` | El control o el servicio no existen para esta empresa |
| 409 | `CONTROL_RETIRED` | El control ya está dado de baja |
| 422 | `VALIDATION_FAILED` | Campos: `required`, `enum.invalid`, `string.max`, y los propios: `category.not_in_scope` (`trust_criterion` no es una categoría contratada), `dimension.policy_only` (`dimensions[i]` en un control propio), `periodicity.own_control` (`periodicity` en un control propio), `reason.required` (`dimensions[i].reason_not_applicable` cuando `applies` es `false`) |

**Claves i18n:** `control.list`, `control.read`, `control.created`, `control.updated`, `control.retired`.

### Ejemplos de error

Todos con el mismo sobre (`conventions.md`); `message` es la clave i18n del error.

**`403` — un `responsable` o `delegado` pide `?view=technical`**
```json
{ "statusCode": 403, "message": "common.forbidden", "data": null, "error": { "code": "FORBIDDEN" } }
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
      { "field": "dimensions[1].reason_not_applicable", "code": "reason.required", "message": "Indica por qué esta dimensión no aplica." },
      { "field": "trust_criterion", "code": "category.not_in_scope", "message": "Tu servicio no tiene contratada esa categoría." }
    ]
  }
}
```

## Auditoría

| `action` | Cuándo | Quién |
|---|---|---|
| `client_control.create` | Se crea un control propio | `admin_empresa` |
| `client_control.update` | Se edita la interpretación o las dimensiones (con `before_state`/`after_state`) | `admin_empresa` |
| `client_control.retire` | Se da de baja (con `before_state`) | `admin_empresa` |
| `client_control.periodicity_set` | Se cambia la periodicidad (con `before_state`/`after_state` y la `justification`) | `admin_empresa` |

Crear, editar dimensiones o dar de baja altera lo que se mide y deja además un `compliance_events` en la misma transacción.

## Preguntas abiertas

- **`P33`:** qué advierte la pantalla al editar o dar de baja un control.
- **`P3` está cerrada (D102):** manda la matriz de `modelo/05-usuarios.md` §5.5.

---

## Estado de implementación

**Construido (MD-498, 2026-11-23): el motor v2.** Lista, detalle y creación calculan con requisitos del control, pruebas con `test_status` y nivel 0–5 ([Motor v2](#motor-v2-md-498-campos-nuevos-y-compatibilidad); `domain/engine/v2/`, `domain/controls/control-readout.ts`). Pruebas: las `*.spec.ts` de `engine/v2/` (en especial `engine.acceptance.spec.ts`) y `control-readout.spec.ts`. **Construido (MD-495, 2026-11-24):** los parámetros PR-01 a PR-05, D146 y los demás salen de `catalog.evaluation_parameters` ([contrato](../catalogo-maestro.md#parámetros-de-evaluación-rc-19)), con el modo de ventanas de PR-07. **Sin construir de esto:** los estados de gestión y «Cumplimiento aprobado» (MD-504, `DT-114`); el resultado de una prueba manual y la prueba documental con el módulo Documentos (MD-504 y MD-506, `DT-114`); y el retiro de `client_control_tests`, que otras lecturas aún usan (MD-509, `DT-113`).

**Construido (MD-500, 2026-11-23): periodicidad por control y ventanas cerradas por período.** `PUT /v1/controls/{id}/periodicity` (solo `admin_empresa`, `client_control.periodicity_set`, mensaje `control.periodicity_set`, responde el detalle con la vista técnica); el detalle suma `suggested_periodicity`, `periodicity_source`, `technical.periodicity_change` y `technical.period` (vista del período abierto: solo cuentan las ventanas cerradas dentro de él, nivel Sólido por período). Código: `domain/engine/v2/windows.ts`, `control-level.ts`, `domain/controls/control-readout.ts`, `application/controls/edit-control.use-cases.ts` y `control-edit.validation.ts`. Pruebas: `test/cumplimiento/periodicidad.e2e-spec.ts`, `test/cumplimiento/controles.e2e-spec.ts`, `src/features/compliance/domain/controls/control-readout.period.spec.ts` y `engine/v2/windows.spec.ts` · `control-level.spec.ts`. **Construido (MD-495, 2026-11-24):** los parámetros PR-01 a PR-05, D146 y los demás salen de `catalog.evaluation_parameters` ([contrato](../catalogo-maestro.md#parámetros-de-evaluación-rc-19)), con el modo de ventanas de PR-07. **Sin construir de esto:** los requisitos «cuando sea requerido» no se miden por trimestre (`DT-115`); la vista del período aproxima las ventanas pasadas sin historial (`DT-116`); un servicio con varios marcos usa un solo período (`DT-117`); el aviso al responsable por ventana por cerrar o vencida va con las notificaciones (MD-515).

**Construido (MD-166, 2026-10-30): los códigos en la vista de negocio (D80).** `code` (el del catálogo `IAC-12` o el propio `C01`) y `requirement_codes` salen en la lista, el detalle y la creación de un control, para todos los roles que los leen (`admin_empresa`, `responsable`, `delegado` y `auditor`); `own_code` sigue siendo solo la numeración de los propios. `technical` conserva únicamente `points_of_focus`, `control_state`, `tests_count` y, en el detalle, `tests`: **`control_code` y `requirement_codes` ya no viajan allí.** Cada causa de `causes` en el detalle lleva también su `code`. Pruebas: `controles.e2e-spec.ts`, `cambios.e2e-spec.ts` y `riesgos.e2e-spec.ts`.

**Construido (2026-10-28, B66): listar, ver, crear, editar y dar de baja.**
- `POST /v1/services/{id}/controls` (MD-150): el control propio nace `approved` y cuenta desde ya. `approval` sigue en la respuesta, siempre `approved`.
- `PATCH /v1/controls/{id}` y `DELETE /v1/controls/{id}` (D96), solo `admin_empresa`, con `client_control.update` / `client_control.retire`, su evento de cumplimiento y, si editar dimensiones mueve algún control, el evento de estado (`cause: control_updated`). La baja es `is_active = false` (204); lo de baja deja de verse en lista y detalle (`404`) y editarlo o darlo de baja otra vez es `409 CONTROL_RETIRED`. **Su historial se sigue leyendo** (D119): evidencias entregadas, veredictos y observaciones. **No está el `?include_inactive=true`.**
- **Retirado:** `POST` y `GET /v1/controls/{id}/changes`, `has_pending_change` y el filtro `approval`. También el filtro `assigned_to`. La tabla `client_control_changes` y sus enums quedan sin uso.
- Pruebas: `Backend/test/cumplimiento/cambios.e2e-spec.ts` (crear, editar, baja) y `controles.e2e-spec.ts`.
- `display_name` de una prueba es el nombre neutro que escribe Monkey (D70); mientras una prueba no lo tenga, sale un texto genérico de su dimensión («Prueba de nube», «Revisión documental»…). **Nunca** el nombre del comité. `display_description` sigue la misma regla (D82): el objetivo del comité o su reescritura neutra, nunca el texto que nombra al proveedor.
- **Sin resultados guardados todo sale «Sin medir».** El motor de nube lo escribe desde 2026-10-22 al cerrar cada corrida (`DT-50`); la sonda de servidores desde D113 (lectura con agente, `evaluations` con origen `sca`). Un control sube de «Sin medir» en cuanto existan evaluaciones de su test sobre los activos del servicio, y solo cuentan los checks que el comité ratificó (con `READINESS_INCLUDE_PROPOSED=true`, también los propuestos).
- Un test de la dimensión documental sale de la revisión de lo que se entregó **para esa prueba en este control** (D88): sin evidencias o sin revisar, `pending`; nunca cumple por sí solo.

**Construido (MD-193, 2026-11-17): cada persona ve solo lo suyo (D102).** La lista y el detalle devuelven al `responsable` y al `delegado` solo los controles de los que son dueño o ejecutor activo; un control ajeno de su empresa es `403`. `owner` y `executor` sustituyen a `assigned_to`, que se retiró. El filtro `responsible` está construido. Pruebas: `test/cumplimiento/controles.e2e-spec.ts` y la matriz de `test/equipo/equipo.e2e-spec.ts`.
