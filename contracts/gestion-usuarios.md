---
id: contracts-users-team
name: Contrato — Equipo: invitar, activar, agrupar y asignar controles
description: Cómo el admin_empresa y los responsables crean al equipo (responsable, delegado, auditor), cómo activan su cuenta, cómo se agrupan y cómo se asigna el dueño y el ejecutor de cada control.
type: contract
---

# Equipo — invitar, activar, agrupar y asignar controles

| | |
|---|---|
| **Estado** | **ACORDADO** (2026-11-03, D102 y D103; reemplaza el reparto por dimensión de D96 y D98). **Por construir en el sprint 3** (ver [Estado de implementación](#estado-de-implementación)) |
| **App** | Monkey Platform (equipo, grupos, asignación y «Mi trabajo») y Monkey Admin (el cupo de usuarios, `contracts/empresas.md`) |
| **Reglas del modelo** | `modelo-datos.md` §5.1, §5.2 y §5.5 · convenciones: [`conventions.md`](conventions.md) · enums: [`enums.md`](enums.md) |

**Qué es.** El `admin_empresa` es el líder de compliance. Crea a todo el equipo, lo organiza en **grupos** y asigna a cada control un **dueño** (un `responsable`, o él mismo). El `responsable` lidera un equipo de `delegado` y les asigna, de sus controles, los que deben **ejecutar**. Cada persona ve solo lo suyo; el `admin_empresa` ve todo; el `auditor` ve todo en solo lectura, incluida la cadena. `admin_monkey` no crea ni desactiva cuentas de una empresa.

## Índice de endpoints

| Método | Ruta | Quién | Para qué |
|---|---|---|---|
| `POST` | [`/v1/users`](#post-v1users--crear-una-persona-del-equipo) | `admin_empresa` · `responsable` (solo `delegado`) | Crear una persona e invitarla por correo |
| `GET` | [`/v1/users`](#get-v1users--listar-el-equipo) | `admin_empresa` · `responsable` (su equipo) | Listar el equipo |
| `PATCH` | [`/v1/users/{id}`](#patch-v1usersid--editar-mover-desactivar-o-reactivar) | `admin_empresa` | Editar, mover, desactivar o reactivar |
| `POST` | [`/v1/users/{id}/activation-code`](#post-v1usersidactivation-code--reenviar-la-invitación) | `admin_empresa` | Reenviar la invitación con un código nuevo |
| `DELETE` | `/v1/users/{id}/mfa` | `admin_empresa` | Restablecer el segundo factor (D94, ver `autenticacion.md`) |
| `GET` | [`/v1/groups`](#get-v1groups--listar-grupos) | `admin_empresa` · `responsable` (el suyo) | Listar grupos |
| `POST` | [`/v1/groups`](#post-v1groups--crear-un-grupo-de-responsables) | `admin_empresa` | Crear un grupo de responsables |
| `PATCH` | [`/v1/groups/{id}`](#patch-v1groupsid--renombrar-un-grupo) | `admin_empresa` | Renombrar un grupo |
| `GET` | [`/v1/assignments`](#get-v1assignments--listar-controles-con-su-asignación) | todos los roles de empresa (cada uno ve lo suyo) | Listar controles con dueño y ejecutor |
| `PUT` | [`/v1/assignments/owner`](#put-v1assignmentsowner--asignar-el-dueño) | `admin_empresa` | Asignar o reasignar el dueño (masivo) |
| `PUT` | [`/v1/assignments/executor`](#put-v1assignmentsexecutor--asignar-el-ejecutor) | `responsable` | Asignar o quitar el ejecutor (masivo) |
| `GET` | [`/v1/team/workload`](#get-v1teamworkload--carga-de-trabajo-por-persona) | `admin_empresa` | Controles y avance de cada persona |
| `GET` | [`/v1/me/work`](#get-v1mework--mi-trabajo) | `responsable` · `delegado` | La lista de trabajo de quien entra |

## Quién puede qué

| Acción | `admin_empresa` | `responsable` | `delegado` | `auditor` | `admin_monkey` |
|---|---|---|---|---|---|
| Crear `responsable`, `auditor` o `admin_empresa` | ✓ | `403` | `403` | `403` | `403` |
| Crear `delegado` | ✓ (en el equipo que elija) | ✓ solo en su equipo | `403` | `403` | `403` |
| Editar, desactivar y reactivar a una persona; reemitir su código | ✓ | `403` | `403` | `403` | `403` |
| Ver la lista del equipo | ✓ | ✓ solo su equipo | `403` | `403` | `403` |
| Crear, renombrar y listar grupos; mover un delegado | ✓ | `403` (lista el suyo) | `403` | `403` | `403` |
| Asignar o reasignar el **dueño** | ✓ | `403` | `403` | `403` | `403` |
| Asignar o quitar el **ejecutor** | `403` | ✓ solo de sus controles | `403` | `403` | `403` |
| Ver la asignación (dueño y ejecutor) | ✓ todos | ✓ los suyos | ✓ los suyos | ✓ todos (solo lectura) | `403` |
| Ver la carga de trabajo de cada persona | ✓ | `403` | `403` | `403` | `403` |
| Restablecer el segundo factor de alguien de su equipo | ✓ | `403` | `403` | `403` | `403` |

## Cómo entra alguien del equipo

1. **Alta.** Quien crea registra al usuario con `POST /v1/users`. La cuenta nace `pending` y **el código de activación sale por correo** a la persona (`MNK-XXXX-XXXX-XXXX`, vigente `ACTIVATION_CODE_TTL_HOURS`, 168 por defecto). Como la clave de acceso de una empresa (D99), **el código ya no viaja en la respuesta**: solo `invitation.delivery_status`. Si el correo no sale, se reenvía con `POST /v1/users/{id}/activation-code`.
2. **Activación.** En dos pasos: `POST /v1/auth/activate/lookup` y `POST /v1/auth/activate` (ver [`autenticacion.md`](autenticacion.md)). Con el segundo factor obligatorio (D94, D102), la activación termina en la configuración del TOTP.
3. **Ingreso.** Correo, contraseña y segundo factor. No hay elección de empresa.

Una cuenta `pending` que intenta iniciar sesión recibe `401 INVALID_CREDENTIALS`. **Una cuenta `pending` ya cuenta para el cupo de usuarios** (D103).

---

## Equipo

### POST /v1/users — Crear una persona del equipo

| | |
|---|---|
| **Quién** | `admin_empresa` (cualquier rol) · `responsable` (solo `delegado` de su equipo) |
| **Éxito** | `201` |
| **Errores** | `403 FORBIDDEN` · `409 EMAIL_TAKEN` · `409 USER_LIMIT_REACHED` · `422 VALIDATION_FAILED` |

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `email` | string | sí | Único en toda la plataforma; se guarda en minúsculas |
| `name` | string | sí | Máx. 100 (D98) |
| `last_name` | string | sí | Máx. 100 (D98) |
| `role` | enum `user_role` | sí | `admin_empresa`, `responsable`, `delegado` o `auditor`; nunca `admin_monkey` |
| `group_id` | uuid | solo `delegado` (y opcional en `responsable`) | `delegado`: el equipo de un responsable (si lo crea un responsable, es el suyo y se omite). `responsable`: un grupo de responsables del administrador; por omisión, el grupo «Responsables», que se crea al hacer falta. `422 group_id.not_allowed` para `admin_empresa` y `auditor` |
| `is_internal` | boolean | solo `delegado` | Si es de la compañía o externo. `422 is_internal.not_allowed` para los demás roles |

```json
{ "email": "juan@acme.co", "name": "Juan", "last_name": "Pérez", "role": "delegado", "group_id": "9a1b…", "is_internal": false }
```

#### Response `201`
| Campo | Tipo | Qué es |
|---|---|---|
| `id` | uuid | |
| `email`, `name`, `last_name` | string | |
| `role` | enum `user_role` | |
| `status` | enum `user_status` | `pending` al crearse |
| `is_mfa_enabled` | boolean | |
| `is_internal` | boolean \| null | Solo `delegado` |
| `group` | `{ id, name }` | El grupo al que pertenece |
| `responsible` | `{ id, name, last_name }` | **Solo `delegado`**: el líder de su grupo (no se guarda aparte) |
| `last_login_at`, `created_at` | datetime | |
| `invitation` | `{ delivery_status, expires_at }` | `delivery_status`: `sent` · `failed` · `pending`. **Nunca trae el código** |

```json
{
  "statusCode": 201,
  "message": "user.created",
  "data": {
    "id": "c4a1f2e8-9b30-4d5a-b7e1-6f8c0d2a3b44",
    "email": "juan@acme.co",
    "name": "Juan",
    "last_name": "Pérez",
    "role": "delegado",
    "status": "pending",
    "is_mfa_enabled": false,
    "is_internal": false,
    "group": { "id": "9a1b…", "name": "Equipo de María" },
    "responsible": { "id": "7d2e…", "name": "María", "last_name": "Gómez" },
    "last_login_at": null,
    "created_at": "2026-11-05T15:04:02Z",
    "invitation": { "delivery_status": "sent", "expires_at": "2026-11-12T15:04:02Z" }
  }
}
```

#### Errores propios
| HTTP | Código | Cuándo |
|---|---|---|
| 409 | `EMAIL_TAKEN` | Ese correo ya tiene cuenta (en cualquier empresa; no se revela de quién) |
| 409 | `USER_LIMIT_REACHED` | La empresa llegó a `max_users`. Trae `error.max_users` y `error.users_count` |

> **Crear un `responsable` crea también su equipo** (`user_groups`, líder = él, nombre por omisión «Equipo de {nombre}»). Un `responsable` que crea un `delegado` lo pone en su equipo.

---

### GET /v1/users — Listar el equipo

| | |
|---|---|
| **Quién** | `admin_empresa` (todo el equipo, incluido él en solo lectura) · `responsable` (solo su equipo) |
| **Éxito** | `200`, paginada |
| **Errores** | `403 FORBIDDEN` (`delegado`, `auditor`, `admin_monkey`) |

#### Parámetros (query)
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `page`, `page_size` | integer | no | Ver `conventions.md` |
| `sort` | string | no | `created_at` o `email`, con `+`/`-` |
| `role` | enum `user_role` | no | Filtro |
| `status` | enum `user_status` | no | Filtro |
| `group_id` | uuid | no | Filtro |
| `is_internal` | boolean | no | Filtro |

#### Response `200`
Cada ítem es el objeto de [crear una persona](#post-v1users--crear-una-persona-del-equipo), **sin `invitation`**. Nunca devuelve el código ni su hash.

---

### PATCH /v1/users/{id} — Editar, mover, desactivar o reactivar

| | |
|---|---|
| **Quién** | `admin_empresa` |
| **Éxito** | `200` con el usuario actualizado |
| **Errores** | `403` · `404` · `409 LAST_ADMIN` · `409 USER_NOT_ACTIVATED` · `409 USER_HAS_ASSIGNMENTS` · `409 RESPONSIBLE_HAS_DELEGATES` · `409 USER_LIMIT_REACHED` · `422` |

#### Request
Se pueden combinar. No cambia el rol.

| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `status` | enum `user_status` | no | `inactive` (baja) o `active` (reactivar). La baja **cierra todas sus sesiones al instante** (CC6.3) y **libera el cupo**; reactivar vuelve a comprobar el cupo |
| `name`, `last_name` | string | no | Corrige el nombre (máx. 100) |
| `group_id` | uuid | no | **Mover** a un delegado a otro equipo |
| `is_internal` | boolean | no | Solo `delegado` |
| `confirm_unassign` | boolean | no | `true` confirma que quedarán sin dueño o sin ejecutor los controles de la persona |

```json
{ "status": "inactive", "confirm_unassign": true }
```

#### Reglas
| Situación | Resultado |
|---|---|
| Uno mismo | Solo puede corregir su nombre; desactivarse es `409 LAST_ADMIN`. A otro `admin_empresa` sí se le puede desactivar y reactivar (D98): la empresa nunca se queda sin administrador |
| Cuenta `pending` | `409 USER_NOT_ACTIVATED` (no se desactiva ni se reactiva) |
| Tiene controles asignados (dueño o ejecutor) y no hay `confirm_unassign` | `409 USER_HAS_ASSIGNMENTS` con `error.controls_count` |
| **Delegado** con confirmación | Sus controles quedan con su dueño, **sin ejecutor** |
| **Responsable sin delegados** con confirmación | Sus controles quedan **«Sin asignar»** |
| **Responsable con delegados** `active` o `pending` | **No se desactiva**: `409 RESPONSIBLE_HAS_DELEGATES` con `error.delegates_count`, hasta que se muevan o se desactiven. La confirmación no lo salta |
| **Mover** a un delegado | Sus controles dejan de tener ejecutor y siguen con su dueño |
| Sobre `admin_monkey` o alguien de otra empresa | `404` |

> **Nada se borra:** el historial donde participó la persona se conserva; el estado anterior queda en la auditoría (`before_state`).

---

### POST /v1/users/{id}/activation-code — Reenviar la invitación

| | |
|---|---|
| **Quién** | `admin_empresa` |
| **Éxito** | `200` con `invitation` |
| **Errores** | `403` · `404` · `409 USER_ALREADY_ACTIVE` |

#### Request
Sin cuerpo.

#### Response `200`
| Campo | Tipo | Qué es |
|---|---|---|
| `invitation` | `{ delivery_status, expires_at }` | Se revoca el código vigente y **se envía uno nuevo por correo**. Solo mientras la cuenta esté `pending` |

---

## Grupos

Un grupo tiene un nombre y un líder; cada persona (salvo `admin_empresa` y `auditor`) pertenece a **uno** (D102).

### GET /v1/groups — Listar grupos

| | |
|---|---|
| **Quién** | `admin_empresa` (todos) · `responsable` (el suyo) |
| **Éxito** | `200` |
| **Errores** | `403` (`delegado`, `auditor`, `admin_monkey`) |

#### Response `200`
| Campo | Tipo | Qué es |
|---|---|---|
| `id` | uuid | |
| `name` | string | |
| `leader` | `{ id, name, last_name, role }` | El líder del grupo |
| `members_count` | integer | |

```json
{ "id": "9a1b…", "name": "Equipo de María", "leader": { "id": "7d2e…", "name": "María", "last_name": "Gómez", "role": "responsable" }, "members_count": 3 }
```

### POST /v1/groups — Crear un grupo de responsables

| | |
|---|---|
| **Quién** | `admin_empresa` |
| **Éxito** | `201` |
| **Errores** | `403` · `422 VALIDATION_FAILED` |

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `name` | string | sí | Máx. 100 |

```json
{ "name": "Responsables - Servicio IA" }
```

Crea un grupo de **responsables** que lidera el administrador. Los equipos de delegados nacen al crear al responsable.

### PATCH /v1/groups/{id} — Renombrar un grupo

| | |
|---|---|
| **Quién** | `admin_empresa` |
| **Éxito** | `200` |
| **Errores** | `403` · `404` · `409 GROUP_NOT_EMPTY` (solo si se expone el borrado) |

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `name` | string | sí | Máx. 100 |

---

## Asignación de controles

> **La unidad es el control del cliente** (`client_controls`, que cuelga de un servicio). El mismo control en dos servicios se asigna por separado, y un control nuevo llega **«Sin asignar»**.

### GET /v1/assignments — Listar controles con su asignación

| | |
|---|---|
| **Quién** | `admin_empresa` y `auditor` (todos) · `responsable` (los que tiene a su cargo) · `delegado` (los que ejecuta) |
| **Éxito** | `200`, paginada |
| **Errores** | `403` (`admin_monkey`) |

#### Parámetros (query)
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `page`, `page_size` | integer | no | Ver `conventions.md` |
| `service_id` | uuid | no | Filtro |
| `framework_id` | uuid | no | Filtro |
| `category` | string | no | Por ejemplo `CC`: agrupa todos los de esa categoría |
| `requirement_code` | string | no | Filtro |
| `status` | enum `control_state` | no | Estado del control |
| `assignment` | enum `assignment` | no | `unassigned` o `assigned` |
| `owner_id`, `executor_id` | uuid | no | Filtro |
| `q` | string | no | Busca por código o título |

#### Response `200`
| Campo | Tipo | Qué es |
|---|---|---|
| `client_control_id` | uuid | |
| `code`, `title` | string | |
| `service` | `{ id, name }` | |
| `category` | string | |
| `assignment` | enum `assignment` | `unassigned` lleva `owner: null` |
| `owner` | `{ id, name, last_name, role }` \| null | |
| `executor` | `{ id, name, last_name, role }` \| null | Nulo = ejecuta el dueño |
| `state` | enum `control_state` | |

```json
{
  "client_control_id": "e1…",
  "code": "CC6.1",
  "title": "Aprovisionamiento de accesos",
  "service": { "id": "…", "name": "Servicio IA" },
  "category": "CC",
  "assignment": "assigned",
  "owner": { "id": "7d2e…", "name": "María", "last_name": "Gómez", "role": "responsable" },
  "executor": { "id": "c4a1…", "name": "Juan", "last_name": "Pérez", "role": "delegado" },
  "state": "pending"
}
```

> Elegir «todos los de `CC`» es el filtro `category`; elegir algunos de cada categoría es seleccionar ítems de la lista.

### PUT /v1/assignments/owner — Asignar el dueño

| | |
|---|---|
| **Quién** | `admin_empresa` |
| **Éxito** | `200` |
| **Errores** | `403` · `404` · `409 OWNER_NOT_ELIGIBLE` · `409 CONTROL_RETIRED` · `422` (`array.max`) |

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `client_control_ids` | uuid[] | sí | Hasta 200 (asignación masiva) |
| `owner_id` | uuid \| null | sí | Un `responsable` activo o pendiente de la empresa, o el propio `admin_empresa`. `null` deja los controles **«Sin asignar»** |

```json
{ "client_control_ids": ["e1…", "e2…"], "owner_id": "7d2e…" }
```

#### Response `200`
```json
{ "updated": 2 }
```

> **Al cambiar el dueño, el ejecutor se limpia.** Todo o nada: un control dado de baja (`CONTROL_RETIRED`) cancela toda la operación.

### PUT /v1/assignments/executor — Asignar el ejecutor

| | |
|---|---|
| **Quién** | `responsable`, solo sobre controles **suyos** |
| **Éxito** | `200` |
| **Errores** | `403` (control ajeno, administrador, otros roles) · `409 EXECUTOR_NOT_IN_TEAM` · `409 CONTROL_RETIRED` |

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `client_control_ids` | uuid[] | sí | Controles de los que es dueño |
| `executor_id` | uuid \| null | sí | Un `delegado` activo o pendiente **de su equipo**. `null` quita el ejecutor (ejecuta él) |

```json
{ "client_control_ids": ["e1…"], "executor_id": "c4a1…" }
```

#### Response `200`
```json
{ "updated": 1 }
```

> Un `responsable` no asigna a otro `responsable`, y el `admin_empresa` no asigna directo a un `delegado`.

### GET /v1/team/workload — Carga de trabajo por persona

| | |
|---|---|
| **Quién** | `admin_empresa` |
| **Éxito** | `200` |
| **Errores** | `403` (otros roles) |

#### Response `200`
| Campo | Tipo | Qué es |
|---|---|---|
| `items[].user` | `{ id, name, last_name, role }` | |
| `items[].owned_count` | integer | Controles de los que es dueño |
| `items[].executed_count` | integer | Controles que ejecuta |
| `items[].progress` | `{ state, percent, coverage }` | Mismo objeto de avance de Cumplimiento (`cumplimiento/resumen.md`): estado, porcentaje y cobertura juntos |
| `unassigned_count` | integer | Controles «Sin asignar» de toda la empresa |

```json
{ "items": [ { "user": { "id": "7d2e…", "name": "María", "last_name": "Gómez", "role": "responsable" }, "owned_count": 50, "executed_count": 12, "progress": { "state": "pending", "percent": 40, "coverage": 92 } } ], "unassigned_count": 8 }
```

> **Sin tope** de controles por persona.

### GET /v1/me/work — «Mi trabajo»

| | |
|---|---|
| **Quién** | `responsable` · `delegado` |
| **Éxito** | `200`, paginada |
| **Errores** | `403` (`admin_empresa`: ve todo en Cumplimiento) |

#### Parámetros (query)
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `page`, `page_size` | integer | no | Ver `conventions.md` |
| `bucket` | enum `work_bucket` | no | Filtro; `to_review` solo lo recibe el `responsable` |
| `service_id` | uuid | no | Filtro |
| `q` | string | no | Código o título |

#### Response `200`
| Campo | Tipo | Qué es |
|---|---|---|
| `items[].client_control_id`, `code`, `title` | uuid, string | |
| `items[].service` | `{ id, name }` | |
| `items[].role_in_control` | enum `role_in_control` | `owner` o `executor` |
| `items[].bucket` | enum `work_bucket` | |
| `items[].pending_items` | integer | Lo que falta; incluye las observaciones abiertas del auditor |
| `items[].state` | enum `control_state` | |
| `progress` | `{ state, percent, coverage }` | Avance de **sus** controles |

```json
{ "items": [ { "client_control_id": "e1…", "code": "CC6.1", "title": "…", "service": { "id": "…", "name": "Servicio IA" }, "role_in_control": "executor", "bucket": "to_upload", "pending_items": 2, "state": "pending" } ],
  "progress": { "state": "pending", "percent": 40, "coverage": 92 } }
```

---

## Lo que ve cada rol

> **D102 (2026-11-03): cada persona ve solo lo suyo.** Sustituye a «el `funcional` atiende todo lo de sus especialidades» (D98).

| Rol | Qué ve |
|---|---|
| `admin_empresa` | Todo; los controles sin dueño se señalan **«Sin asignar»** |
| `responsable` | Solo los controles de los que es dueño (incluidos los que ejecutan sus delegados), con **el avance de lo suyo**, nunca el de la empresa. Sin vista técnica (`403`) |
| `delegado` | Solo los controles que ejecuta, con el avance de lo suyo. Sin vista técnica (`403`) |
| `auditor` | Todo, en solo lectura, con la vista técnica y la cadena de asignación. Sus observaciones llegan al dueño y al ejecutor del control (en «Mi trabajo»; las notificaciones son `P39`) |

En las listas de Cumplimiento (`controls`, `evidence`, pruebas de un control, riesgos, observaciones) un `responsable` o `delegado` recibe **solo** lo de sus controles; sin ninguno, la lista llega vacía, no falla. Un recurso que existe pero no es suyo responde `403`; de otra empresa, `404` (`conventions.md`).

## Auditoría

| `action` | Cuándo | Quién | `tenant_id` |
|---|---|---|---|
| `user.create` | Se crea a una persona | `admin_empresa` o `responsable` | La empresa |
| `user.update` | Se edita, mueve, desactiva o reactiva (`before_state`/`after_state`; `sessions_closed` y `controls_unassigned` al desactivar) | `admin_empresa` | La empresa |
| `user.activation_code_regenerate` | Se emite un código nuevo | Quien lo pide | La empresa |
| `user.activate` | La persona activa su cuenta (también si falla: `result = error`) | La persona, o `attempted_email` | La empresa |
| `group.create` · `group.update` | Se crea o renombra un grupo | `admin_empresa` | La empresa |
| `control_assignment.set` | Se pone, cambia o quita el dueño o el ejecutor de un control (una entrada por control; `before_state`/`after_state` con dueño y ejecutor) | `admin_empresa` o `responsable` | La empresa |

Nunca se guarda el código ni su hash (`conventions.md`). Se escribe en la misma transacción que la acción (D52, SEG-36). El historial de asignaciones sale de esta auditoría.

## Errores del módulo

| HTTP | `error.code` | Cuándo |
|---|---|---|
| 403 | `FORBIDDEN` | El rol no puede hacer esto, o el control no es suyo |
| 404 | `NOT_FOUND` | Usuario, grupo o control inexistentes **para esta empresa** |
| 404 / 409 / 422 / 429 | `ACTIVATION_CODE_INVALID` · `ACTIVATION_CODE_ALREADY_USED` · `ACTIVATION_CODE_EXPIRED` · `ACTIVATION_CODE_EMAIL_MISMATCH` · `ACTIVATION_CODE_RATE_LIMITED` | La activación; ver [`autenticacion.md`](autenticacion.md) |
| 409 | `EMAIL_TAKEN` | Ese correo ya tiene cuenta |
| 409 | `USER_LIMIT_REACHED` | La empresa llegó a `max_users` (al crear o al reactivar) |
| 409 | `LAST_ADMIN` | Se intenta desactivar al único `admin_empresa` activo, o a uno mismo |
| 409 | `USER_NOT_ACTIVATED` | Se intenta desactivar o reactivar una cuenta `pending` |
| 409 | `USER_ALREADY_ACTIVE` | Se pide otro código para una cuenta que ya activó |
| 409 | `USER_HAS_ASSIGNMENTS` | Se desactiva o mueve a quien tiene controles, sin `confirm_unassign` (`error.controls_count`) |
| 409 | `RESPONSIBLE_HAS_DELEGATES` | Se desactiva a un `responsable` con delegados activos o pendientes (`error.delegates_count`) |
| 409 | `GROUP_NOT_EMPTY` | Se intenta borrar un grupo con miembros |
| 409 | `EXECUTOR_NOT_IN_TEAM` | El ejecutor no es un delegado del equipo del dueño |
| 409 | `OWNER_NOT_ELIGIBLE` | El dueño no es un `responsable` (ni el propio `admin_empresa`) activo o pendiente de la empresa |
| 409 | `CONTROL_RETIRED` | Se asigna un control dado de baja |
| 422 | `VALIDATION_FAILED` | `required`, `email.invalid`, `enum.invalid`, `uuid.invalid`, `group_id.not_allowed`, `is_internal.not_allowed`, `array.max`, contraseña que no cumple la política |

**Claves i18n:** `user.created`, `user.list`, `user.updated`, `user.activation_code_regenerated`, `group.list`, `group.created`, `group.updated`, `assignment.list`, `assignment.owner_updated`, `assignment.executor_updated`, `team.workload`, `work.list`.

---

## Estado de implementación

**En construcción (sprint 3, 2026-11-03 a 2026-11-16).** MD-186 (2026-11-04) dejó hecho el esquema y retiró el modelo anterior (D96 y D98); la lógica nueva llega en los tickets que siguen.

| Hecho en MD-186 | Detalle |
|---|---|
| Tablas | Se eliminaron `user_dimensions`, `service_dimension_owners` y `user_control_assignments`; existen `user_groups` y `client_control_assignments` (con RLS), `users.group_id`, `users.is_internal` y `companies.max_users` |
| Rol | `funcional` ya no existe: `user_role` es `admin_monkey · admin_empresa · responsable · delegado · auditor` (una cuenta `funcional` pasa a `responsable`) |
| Reglas en la base | CHECK: `is_internal` solo en el `delegado`, grupo solo para `responsable` y `delegado`, ejecutor distinto del dueño |
| Endpoints retirados | `GET`/`PATCH /v1/services/{id}/dimension-owners[/{dimension}]` y `GET`/`PATCH /v1/controls/{id}/responsibles[/{dimension}]` |
| Errores y campo retirados | `USER_LACKS_DIMENSION`, `DIMENSION_IN_USE` y `dimensions` del alta |
| Revisión de evidencia | `evidence_reviewer_role` admite `responsable`; la lógica de dos niveles es MD-194 |
| Cupo de usuarios (MD-187) | `USER_LIMIT_REACHED` (`409`, con `error.max_users` y `error.users_count`) en el alta, en la reactivación `inactive`→`active` y en el canje de la clave; desactivar libera el cupo. Ver `empresas.md` y SEG-72 |

| Sigue por construir | Ticket |
|---|---|
| Alta con grupo e `is_internal`, equipo del responsable | MD-188 (`DT-86`) |
| Grupos y mover un delegado | MD-189 |
| Invitación por correo, sin código en la respuesta | MD-190 (SEG-75) |
| Baja con aviso | MD-191 (SEG-74) |
| Asignación de dueño y ejecutor | MD-192 (SEG-73) |
| Visibilidad por dueño y ejecutor (hoy transitoria, `DT-87`) | MD-193 (SEG-76) |
| Revisión en dos niveles | MD-194 |
| Carga de trabajo y «Mi trabajo» | MD-195 |

Lo que **sigue vigente**:

| Qué | Detalle |
|---|---|
| Activación | `POST /v1/auth/activate[/lookup]`, el código de un solo uso (`user_activation_codes`) |
| Baja | `PATCH` que desactiva cerrando sesiones |
| Cuentas | El nombre obligatorio, un administrador que crea a otro, el correo único |
| Servicios | Los servicios en lectura (ahora para el dueño y el ejecutor del control) |

- **No hay empresas reales:** se migra sin compatibilidad (D102). Las migraciones borran las asignaciones por dimensión.
- La pantalla **Equipo** (`/equipo`) y el reparto por servicio de Monkey Platform se rehacen (ver `context/frontend.md`).
- Plan y tickets: `references/producto/sprint-usuarios.md` (épico MD-184).

## Fuera de este corte

Notificaciones (`P39`), ausencias y delegación temporal, reparto equitativo automático, un rol de soporte de Monkey (D103), el reporte exportable de accesos para el auditor y la contraseña que vence a los 90 días (ver D101).

## Preguntas abiertas

`P34` (quien sube y quien revisa son la misma persona; solo queda el caso del `admin_empresa` dueño) y `P35` (calificación del auditor) no bloquean este corte. `P39` (notificaciones) tampoco: el correo de invitación sí entra.
