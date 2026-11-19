---
id: contracts-users-team
name: Contrato — Equipo: invitar, activar, agrupar y asignar controles
description: Cómo el admin_empresa y los responsables crean al equipo (responsable, delegado, auditor), cómo activan su cuenta, cómo se agrupan y cómo se asigna el dueño y el ejecutor de cada control.
type: contract
---

# Equipo — invitar, activar, agrupar y asignar controles

| | |
|---|---|
| **Estado** | **ACORDADO** (2026-11-03, D102 y D103; reemplaza el reparto por dimensión de D96 y D98). **En construcción en el sprint 3** (ver [Estado de implementación](#estado-de-implementación)) |
| **App** | Monkey Platform (equipo, grupos, asignación y «Mi trabajo») y Monkey Admin (el cupo de usuarios, `contracts/empresas.md`) |
| **Reglas del modelo** | `modelo-datos.md` §5.1, §5.2 y §5.5 · convenciones: [`conventions.md`](conventions.md) · enums: [`enums.md`](enums.md) |

**Qué es.** El `admin_empresa` es el líder de compliance. Crea a todo el equipo, lo organiza en **grupos** y asigna a cada control un **dueño** (un `responsable`, o él mismo). El `responsable` lidera un equipo de `delegado` y les asigna, de sus controles, los que deben **ejecutar**. Cada persona ve solo lo suyo; el `admin_empresa` ve todo; el `auditor` ve todo en solo lectura, incluida la cadena. `admin_monkey` no crea ni desactiva cuentas de una empresa (sí las de otros `admin_monkey`: [`gestion-usuarios/administradores.md`](gestion-usuarios/administradores.md), D117).

## Índice de endpoints

| Método | Ruta | Quién | Para qué |
|---|---|---|---|
| `POST` | [`/v1/users`](#post-v1users--crear-una-persona-del-equipo) | `admin_empresa` · `responsable` (solo `delegado`) | Crear una persona e invitarla por correo |
| `GET` | [`/v1/users`](#get-v1users--listar-el-equipo) | `admin_empresa` · `responsable` (su equipo) | Listar el equipo |
| `PATCH` | [`/v1/users/{id}`](#patch-v1usersid--editar-mover-desactivar-o-reactivar) | `admin_empresa` | Editar, mover, desactivar o reactivar |
| `POST` | [`/v1/users/{id}/activation-code`](#post-v1usersidactivation-code--reenviar-la-invitación) | `admin_empresa` | Reenviar la invitación con un código nuevo |
| `DELETE` | `/v1/users/{id}/mfa` | `admin_empresa` | Restablecer el segundo factor (D94, ver `autenticacion.md`) |
| `GET` | [`/v1/groups`](#get-v1groups--listar-grupos) | `admin_empresa` · `responsable` (el suyo) | Listar grupos |
| `POST` | [`/v1/groups`](#post-v1groups--crear-un-grupo) | `admin_empresa` · `responsable` (el suyo) | Crear un grupo de responsables, o el equipo de delegados de un responsable |
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
| Crear el **equipo de delegados** de un responsable | ✓ (de cualquier responsable) | ✓ solo el suyo, y uno | `403` | `403` | `403` |
| Crear un grupo de responsables, renombrar grupos y mover un delegado | ✓ | `403` | `403` | `403` | `403` |
| Listar grupos | ✓ todos | ✓ el suyo | `403` | `403` | `403` |
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
| `group_id` | uuid | solo `delegado` (y opcional en `responsable`) | `delegado`: el equipo de un responsable, que **ya debe existir** (si lo crea un responsable, es el suyo y se omite; si no lo tiene, `409 RESPONSIBLE_HAS_NO_TEAM`). `responsable`: un grupo de responsables del administrador; por omisión, el grupo «Responsables», que se crea al hacer falta. `422 group_id.not_allowed` para `admin_empresa` y `auditor` |
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
| `invitation` | `{ delivery_status, expires_at }` | `delivery_status`: `sent` (el servicio de correo aceptó el mensaje) o `failed` (la cuenta existe y se reenvía con `POST /v1/users/{id}/activation-code`); `pending` queda reservado y el servidor ya no lo produce. **Nunca trae el código** |

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
| 409 | `RESPONSIBLE_HAS_NO_TEAM` | Se crea un `delegado` en el equipo de un responsable que aún no lo ha creado (D104) |
| 409 | `RESPONSIBLES_GROUP_INVALID` | El grupo «Responsables» de la empresa no lo lidera un `admin_empresa` (D104): el alta no lo reutiliza; se elige otro `group_id` de responsables |
| 409 | `TEAM_ALREADY_EXISTS` | Ese `responsable` ya lidera un equipo de delegados (D104) |
| 409 | `GROUP_NAME_TAKEN` | Ya hay un grupo con ese nombre en la empresa, o se pide el nombre reservado «Responsables» |
| 409 | `GROUP_RESERVED` | Se intenta renombrar el grupo por omisión «Responsables» |

> **Crear un `responsable` solo lo deja en el grupo «Responsables»** (D104). Su equipo de delegados **no nace con él**: lo crea él mismo, o el administrador por él, con `POST /v1/groups`. Un `responsable` que crea un `delegado` lo pone en su equipo; si aún no tiene, `409 RESPONSIBLE_HAS_NO_TEAM`.

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
| **Errores** | `403` · `404` · `409 LAST_ADMIN` · `409 USER_NOT_ACTIVATED` · `409 USER_HAS_ASSIGNMENTS` · `409 RESPONSIBLE_HAS_DELEGATES` · `409 TEAM_LEADER_INACTIVE` · `409 USER_LIMIT_REACHED` · `422` |

#### Request
Se pueden combinar. No cambia el rol.

| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `status` | enum `user_status` | no | `inactive` (baja) o `active` (reactivar). La baja **cierra todas sus sesiones al instante** (CC6.3) y **libera el cupo**; reactivar vuelve a comprobar el cupo |
| `name`, `last_name` | string | no | Corrige el nombre (máx. 100) |
| `group_id` | uuid | no | **Mover** a un delegado a otro equipo |
| `is_internal` | boolean | no | Solo `delegado`: corrige si es de la compañía o externo. `422 is_internal.not_allowed` para los demás roles |
| `confirm_unassign` | boolean | no | `true` confirma que quedarán sin dueño o sin ejecutor los controles de la persona |

```json
{ "status": "inactive", "confirm_unassign": true }
```

#### Reglas
| Situación | Resultado |
|---|---|
| Uno mismo | Solo puede corregir su nombre; desactivarse es `409 LAST_ADMIN`. A otro `admin_empresa` sí se le puede desactivar y reactivar (D98): la empresa nunca se queda sin administrador |
| Cuenta `pending` | `409 USER_NOT_ACTIVATED` (no se desactiva ni se reactiva) |
| Tiene controles asignados (dueño o ejecutor) y se le **desactiva o mueve** sin `confirm_unassign` | `409 USER_HAS_ASSIGNMENTS` con `error.controls_count` (controles distintos en los que figura como dueño o como ejecutor) |
| **Delegado** con confirmación | Sus controles quedan con su dueño, **sin ejecutor** |
| **Responsable sin delegados** con confirmación | Sus controles quedan **«Sin asignar»** (se borra la asignación vigente) |
| **`admin_empresa`** con controles propios, con confirmación | Sus controles quedan **«Sin asignar»** |
| **Responsable con delegados** `active` o `pending` | **No se desactiva**: `409 RESPONSIBLE_HAS_DELEGATES` con `error.delegates_count`, hasta que se muevan o se desactiven. La confirmación no lo salta |
| **Mover** a un delegado (`group_id`) | El destino debe ser el equipo (`kind = team`) de un `responsable` `active` o `pending` de la empresa (`404` si no; el mismo equipo no cambia nada). Mover a quien no es `delegado` es `422 group_id.not_allowed`. Si ejecuta controles y no hay `confirm_unassign`, `409 USER_HAS_ASSIGNMENTS`; con confirmación, sus controles dejan de tener ejecutor y siguen con su dueño. Audita `user.update` con el `group_id` antes y después y `controls_unassigned` |
| **Reactivar** a un `delegado` cuyo responsable no está `active` ni `pending` | `409 TEAM_LEADER_INACTIVE`: no se reactiva a nadie en un equipo sin líder vigente; hay que **moverlo** antes a otro equipo |
| **Reactivar** a cualquiera | Vuelve a comprobar el cupo. **No devuelve sus asignaciones**: los controles que dejó siguen «Sin asignar» |
| Equipo de un `responsable` dado de baja | No se borra: queda con el líder inactivo y, si el responsable se reactiva, vuelve a liderarlo |
| Sobre `admin_monkey` o alguien de otra empresa | `404` |

> **Nada se borra:** el historial donde participó la persona se conserva; el estado anterior queda en la auditoría (`before_state`). Al desactivar o mover, además de `user.update` queda **una entrada `control_assignment.set` por cada control** cuyo dueño o ejecutor cambia, con su antes y después: el historial de asignaciones se lee de ahí.

---

### POST /v1/users/{id}/activation-code — Reenviar la invitación

| | |
|---|---|
| **Quién** | `admin_empresa` |
| **Éxito** | `200` con `invitation` |
| **Errores** | `403` · `403 ACCOUNT_INACTIVE` · `404` · `409 USER_ALREADY_ACTIVE` |

#### Request
Sin cuerpo.

#### Response `200`
| Campo | Tipo | Qué es |
|---|---|---|
| `invitation` | `{ delivery_status, expires_at }` | Se revoca el código vigente y **se envía uno nuevo por correo**. Solo mientras la cuenta esté `pending`. La respuesta trae **solo** `invitation`, sin datos de la persona ni el código |

```json
{ "statusCode": 200, "message": "user.activation_code_regenerated", "data": { "invitation": { "delivery_status": "sent", "expires_at": "2026-11-12T15:04:02Z" } } }
```

> **Límites conocidos (`DT-90`):** el envío es directo, con un solo intento y sin cola. El estado `failed` solo viaja en la respuesta (no se guarda ni sale en el listado), y si el proceso muere entre crear la cuenta y enviar el correo queda una cuenta `pending` sin correo: el reenvío está siempre disponible.

---

## Grupos

Un grupo tiene un nombre y un líder; cada persona (salvo `admin_empresa` y `auditor`) pertenece a **uno** (D102). Hay dos clases: el **grupo de responsables** (lo lidera el `admin_empresa`; ahí queda todo `responsable`) y el **equipo de delegados** (lo lidera un `responsable`, que **lo crea cuando quiere**; D104).

### GET /v1/groups — Listar grupos

| | |
|---|---|
| **Quién** | `admin_empresa` (todos) · `responsable` (el suyo; lista vacía si aún no lo crea) |
| **Éxito** | `200`, paginada |
| **Errores** | `403` (`delegado`, `auditor`, `admin_monkey`) |

#### Parámetros (query)
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `page`, `page_size` | integer | no | Ver `conventions.md` |
| `sort` | string | no | `name` o `-name`; por omisión `name` |

#### Response `200`
| Campo | Tipo | Qué es |
|---|---|---|
| `id` | uuid | |
| `name` | string | Se guarda sin espacios sobrantes (los internos se colapsan). Dos nombres que solo difieren en mayúsculas son distintos, salvo el reservado «Responsables», que se compara sin distinguirlas |
| `kind` | enum `group_kind` | `responsables` (lo lidera el administrador) o `team` (el equipo de delegados de un responsable) |
| `leader` | `{ id, name, last_name, role }` | El líder del grupo |
| `members_count` | integer | Cuentas del grupo, de **cualquier estado** (las mismas que lista `GET /v1/users?group_id=`); el líder del equipo no cuenta |

```json
{ "id": "9a1b…", "name": "Equipo de María", "kind": "team", "leader": { "id": "7d2e…", "name": "María", "last_name": "Gómez", "role": "responsable" }, "members_count": 3 }
```

### POST /v1/groups — Crear un grupo

| | |
|---|---|
| **Quién** | `admin_empresa` (un grupo de responsables, o el equipo de un responsable) · `responsable` (solo el suyo) |
| **Éxito** | `201` con el grupo (misma forma que un ítem de `GET /v1/groups`) |
| **Errores** | `403` · `404` · `409 TEAM_ALREADY_EXISTS` · `409 GROUP_NAME_TAKEN` · `422 VALIDATION_FAILED` |

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `name` | string | sí | Máx. 100; único en la empresa (`409 GROUP_NAME_TAKEN`) |
| `leader_id` | uuid | no | Solo `admin_empresa`: el `responsable` (activo o pendiente) cuyo **equipo de delegados** se crea. Sin él, crea un **grupo de responsables** que lidera el propio administrador. El `responsable` que lo manda con otro id recibe `403`; con el suyo, vale |

```json
{ "name": "Equipo de María", "leader_id": "7d2e…" }
```

| Quién lo pide | Qué crea |
|---|---|
| `admin_empresa` sin `leader_id` | Un grupo de **responsables** que lidera él (p. ej. «Responsables - Servicio IA») |
| `admin_empresa` con `leader_id` | El **equipo de delegados** de ese responsable. `404` si no es un responsable de la empresa |
| `responsable` | **Su** equipo de delegados, con él de líder |

> El grupo queda con `kind = responsables` (sin `leader_id`) o `kind = team` (con `leader_id`, o creado por un responsable). El nombre «Responsables» no se puede usar (`409 GROUP_NAME_TAKEN`).

> **Un responsable lidera un solo equipo (D102, D104):** pedir otro es `409 TEAM_ALREADY_EXISTS`. Mientras no lo cree, trabaja solo. No hay creación automática: el equipo no nace con el responsable.

### PATCH /v1/groups/{id} — Renombrar un grupo

| | |
|---|---|
| **Quién** | `admin_empresa` |
| **Éxito** | `200` |
| **Errores** | `403` · `404` · `409 GROUP_NAME_TAKEN` · `409 GROUP_RESERVED` |

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `name` | string | sí | Máx. 100; único en la empresa (`409 GROUP_NAME_TAKEN`) |

> **El grupo «Responsables» está reservado** (D104): es el grupo por omisión de los responsables. Nadie puede ponerle ese nombre a otro grupo, ni al crearlo ni al renombrarlo (`409 GROUP_NAME_TAKEN`), y ese grupo no se renombra (`409 GROUP_RESERVED`).

---

## Asignación de controles

> **La unidad es el control del cliente** (`client_controls`, que cuelga de un servicio). El mismo control en dos servicios se asigna por separado, y un control nuevo llega **«Sin asignar»**.

### GET /v1/assignments — Listar controles con su asignación

| | |
|---|---|
| **Quién** | `admin_empresa` y `auditor` (todos) · `responsable` (los que tiene a su cargo) · `delegado` (los que ejecuta) |
| **Éxito** | `200`, paginada. Solo controles vigentes (los dados de baja se omiten). Orden: servicio por nombre y, dentro, el código del control (`IAC-2` antes que `IAC-10`, como el listado de controles) |
| **Errores** | `403` (`admin_monkey`) · `422` (filtro con valor fuera de su enum o uuid mal formado) |

#### Parámetros (query)
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `page`, `page_size` | integer | no | Ver `conventions.md` |
| `service_id` | uuid | no | Filtro |
| `framework_id` | uuid | no | Filtro |
| `category` | string | no | **Prefijo del código de requisito** (MD-192, 2026-11-11): `CC`, `A`, `C`, `PI`, `P` en SOC 2. Entra el control que cubra **algún** requisito cuyo código empiece por ese prefijo seguido de un número (`CC` toma `CC6.1`, no `C1.1`). Un control propio no cubre requisitos (D65): no entra |
| `requirement_code` | string | no | Código exacto del requisito (`CC6.1`): entra el control que lo cubre |
| `status` | enum `control_state` | no | Estado del control. **Se deriva, no se guarda** (regla 4): se calcula por servicio como en `cumplimiento/controles.md`, y se filtra y pagina después de calcular |
| `assignment` | enum `assignment` | no | `unassigned` o `assigned` |
| `owner_id`, `executor_id` | uuid | no | Filtro |
| `q` | string | no | Busca, sin distinguir mayúsculas ni acentos, en el código del control, sus códigos de requisito y su nombre |

#### Response `200`
| Campo | Tipo | Qué es |
|---|---|---|
| `client_control_id` | uuid | |
| `code` | string | **El código del control** (D80): el del catálogo (`IAC-12`) o el `own_code` en uno propio (`C01`) |
| `requirement_codes` | string[] | Requisitos del marco que cubre (`CC6.1`); vacío en un control propio |
| `name` | string | El nombre del control (el modelo lo llama `name`; antes aquí decía `title`) |
| `service` | `{ id, name }` | |
| `categories` | string[] | Prefijos de sus requisitos (`["CC"]`); vacío en un control propio. Un control puede cubrir requisitos de varias categorías |
| `assignment` | enum `assignment` | `unassigned` lleva `owner: null` |
| `owner` | `{ id, name, last_name, role }` \| null | |
| `executor` | `{ id, name, last_name, role }` \| null | Nulo = ejecuta el dueño |
| `state` | enum `control_state` | |

```json
{
  "client_control_id": "e1…",
  "code": "IAC-12",
  "requirement_codes": ["CC6.1", "CC6.2"],
  "name": "Aprovisionamiento de accesos",
  "service": { "id": "…", "name": "Servicio IA" },
  "categories": ["CC"],
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
| **Errores** | `403` · `404` (un control o el dueño no existe o es de otra empresa) · `409 OWNER_NOT_ELIGIBLE` · `409 CONTROL_RETIRED` · `422` (`array.min`, `array.max`, `array.unique`) |

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
>
> `updated` cuenta solo los controles **que cambiaron**; uno que ya tenía ese dueño no cuenta ni deja rastro. Cada control que cambia deja un `control_assignment.set` en la misma transacción. Concurrencia: se bloquean las filas del actor y del dueño por id (orden global de `row-locks.ts`) y se **relee** que el dueño siga activo o pendiente; luego las asignaciones, en orden por id.

### PUT /v1/assignments/executor — Asignar el ejecutor

| | |
|---|---|
| **Quién** | `responsable`, solo sobre controles **suyos** |
| **Éxito** | `200` |
| **Errores** | `403` (control ajeno, administrador, otros roles) · `404` (un control o el ejecutor no existe o es de otra empresa) · `409 EXECUTOR_NOT_IN_TEAM` · `409 CONTROL_RETIRED` · `422` (`array.min`, `array.max`, `array.unique`) |

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `client_control_ids` | uuid[] | sí | Controles de los que es dueño. Hasta 200 |
| `executor_id` | uuid \| null | sí | Un `delegado` activo o pendiente **de su equipo**. `null` quita el ejecutor (ejecuta él) |

```json
{ "client_control_ids": ["e1…"], "executor_id": "c4a1…" }
```

#### Response `200`
```json
{ "updated": 1 }
```

> Un `responsable` no asigna a otro `responsable`, y el `admin_empresa` no asigna directo a un `delegado`. Un `responsable` sin equipo (D104) solo puede enviar `executor_id: null`.
>
> `updated` y la auditoría, como en el dueño. Concurrencia: se bloquea la fila del delegado y se **relee** su estado y su `group_id` (que siga en el equipo del actor), para no colarse con un movimiento (MD-189) o una baja (MD-191).

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
| `items[].progress` | `{ readiness, progress: { done, total }, coverage: { measured, applicable } }` | El avance de **sus** controles (los que posee y los que ejecuta), con el mismo objeto y las mismas reglas que el marco en `cumplimiento/resumen.md` (D122): semáforo, controles hechos sobre el total y cobertura, juntos. El porcentaje no viaja: lo deriva la pantalla |
| `unassigned_count` | integer | Controles «Sin asignar» de toda la empresa |

```json
{ "items": [ { "user": { "id": "7d2e…", "name": "María", "last_name": "Gómez", "role": "responsable" }, "owned_count": 50, "executed_count": 12, "progress": { "readiness": "needs_work", "progress": { "done": 20, "total": 50 }, "coverage": { "measured": 46, "applicable": 50 } } } ], "unassigned_count": 8 }
```

> **Sin tope** de controles por persona. **Quién sale:** cada `responsable` y `delegado` activo de la empresa (con cero si no tiene controles) y cada `admin_empresa` que sea dueño de algún control. Orden: por rol (`responsable`, `delegado`, `admin_empresa`) y por nombre. Sin paginación.

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
| `progress` | `{ readiness, progress: { done, total }, coverage: { measured, applicable } }` | Avance de **sus** controles, como en el resumen (D122). Con `service_id`, solo los de ese servicio |

```json
{ "items": [ { "client_control_id": "e1…", "code": "CC6.1", "title": "…", "service": { "id": "…", "name": "Servicio IA" }, "role_in_control": "executor", "bucket": "to_upload", "pending_items": 2, "state": "incomplete" } ],
  "progress": { "readiness": "needs_work", "progress": { "done": 12, "total": 30 }, "coverage": { "measured": 26, "applicable": 30 } } }
```

#### En qué bucket cae cada control (D122)

Un control cae en **un solo** `bucket`, el primero que le aplique visto desde quien pregunta:

1. **`rejected`**: alguna evidencia o veredicto del control que subió o registró la persona (o su delegado, si es el dueño) tiene su última versión rechazada y hay que rehacerla.
2. **`to_review`** (solo el `responsable` dueño): algo que subió o registró otra persona espera **su** revisión.
3. **`to_upload`**: a una prueba documental le falta evidencia, o a una prueba manual no documental le falta el veredicto.
4. **`in_review`**: todo está entregado y espera la revisión de otra persona.
5. **`done`**: nada pendiente de su parte.

`pending_items` suma lo que falta subir, lo rechazado, lo que tiene que revisar y las **observaciones abiertas del auditor** sobre el control. Las fallas de las pruebas automáticas no son un bucket: se ven en `state` (el estado del control).

Precisiones de la construcción (MD-195):
- **Qué se cuenta:** cada evidencia requerida de cada prueba documental, también la de una prueba que aún no tiene ninguna entrega, y cada prueba manual no documental con el último veredicto del servicio (D121).
- **Evidencia vencida** (`expired`) cuenta como `rejected` para quien la subió: hay que rehacerla.
- **Lo de su delegado** cuenta como propio solo para el dueño, a efectos de `rejected`. Un veredicto registrado desde otro control no genera `to_review` en este: lo revisa el dueño del control de origen.
- **`bucket=to_review` pedido por un `delegado`** devuelve la lista vacía, no `422`.
- **Orden de la lista:** por bucket (en el orden de arriba), luego servicio y código.
- **`progress` de una persona** junta controles de varios servicios y marcos, así que no aplica la regla «marco sin período → `not_measured`» del resumen. Usa los mismos cortes de semáforo, hechos y cobertura sobre los estados que ya calculó el motor.
- **`unassigned_count`** cuenta los controles vigentes sin dueño activo.
- **Consultas:** `me/work` y `team/workload` hacen un número fijo (≤ 4), sin importar cuántas personas o controles haya.

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
| `user.update` | Se edita, mueve, desactiva o reactiva (`before_state`/`after_state`; `sessions_closed` al desactivar y `controls_unassigned` al desactivar o mover) | `admin_empresa` | La empresa |
| `user.activation_code_regenerate` | Se emite un código nuevo | Quien lo pide | La empresa |
| `user.activate` | La persona activa su cuenta (también si falla: `result = error`) | La persona, o `attempted_email` | La empresa |
| `group.create` · `group.update` | Se crea o renombra un grupo | `admin_empresa` | La empresa |
| `control_assignment.set` | Se pone, cambia o quita el dueño o el ejecutor de un control, **también al desactivar o mover a una persona** (una entrada por control; `before_state`/`after_state` con dueño y ejecutor) | `admin_empresa` o `responsable` (o quien desactiva o mueve) | La empresa |

Cada `control_assignment.set` lleva `resource = 'control_assignment'` y, dentro de `before_state` y `after_state`, el `client_control_id` junto con el `owner_id` y el `executor_id` del control. Nunca se guarda el código ni su hash (`conventions.md`). Se escribe en la misma transacción que la acción (D52, SEG-36). El historial de asignaciones sale de esta auditoría.

## Errores del módulo

| HTTP | `error.code` | Cuándo |
|---|---|---|
| 403 | `FORBIDDEN` | El rol no puede hacer esto, o el control no es suyo |
| 403 | `ACCOUNT_INACTIVE` | Quien hace la petición fue desactivado mientras ella se procesaba (otra baja simultánea): no se escribe nada. Así dos administradores que se desactivan a la vez nunca dejan la empresa sin administrador |
| 404 | `NOT_FOUND` | Usuario, grupo o control inexistentes **para esta empresa** |
| 404 / 409 / 422 / 429 | `ACTIVATION_CODE_INVALID` · `ACTIVATION_CODE_ALREADY_USED` · `ACTIVATION_CODE_EXPIRED` · `ACTIVATION_CODE_EMAIL_MISMATCH` · `ACTIVATION_CODE_RATE_LIMITED` | La activación; ver [`autenticacion.md`](autenticacion.md) |
| 409 | `EMAIL_TAKEN` | Ese correo ya tiene cuenta |
| 409 | `USER_LIMIT_REACHED` | La empresa llegó a `max_users` (al crear o al reactivar) |
| 409 | `LAST_ADMIN` | Se intenta desactivar al único `admin_empresa` activo, o a uno mismo |
| 409 | `USER_NOT_ACTIVATED` | Se intenta desactivar o reactivar una cuenta `pending` |
| 409 | `USER_ALREADY_ACTIVE` | Se pide otro código para una cuenta que ya activó |
| 409 | `USER_HAS_ASSIGNMENTS` | Se desactiva o mueve a quien tiene controles, sin `confirm_unassign` (`error.controls_count`) |
| 409 | `TEAM_LEADER_INACTIVE` | Se reactiva a un `delegado` cuyo responsable no está `active` ni `pending` |
| 409 | `RESPONSIBLE_HAS_DELEGATES` | Se desactiva a un `responsable` con delegados activos o pendientes (`error.delegates_count`) |
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
| Baja con aviso (MD-191) | `PATCH /v1/users/{id}`: `RESPONSIBLE_HAS_DELEGATES` (la confirmación no lo salta), `USER_HAS_ASSIGNMENTS` con `confirm_unassign` también al desactivar (el delegado queda sin ejecutor; el responsable sin delegados y el administrador dejan sus controles «Sin asignar»), `TEAM_LEADER_INACTIVE` al reactivar a un delegado sin líder vigente, `is_internal`, y una entrada `control_assignment.set` por control al desactivar o mover (también en el movimiento de MD-189). Crear, mover y reactivar a un delegado bloquean la fila de su responsable (`FOR SHARE`), y la baja del responsable la suya (`FOR UPDATE`): nunca queda un delegado vigente bajo un responsable inactivo. SEG-74 cumplido |
| Asignación de dueño y ejecutor (MD-192, 2026-11-12) | `GET /v1/assignments` (en `compliance`: reutiliza el cálculo de estado por servicio y `canSeeControl`; número fijo de consultas por servicio) y `PUT /v1/assignments/owner` y `/executor` (en `team`). «Sin asignar» es **no tener fila** en `client_control_assignments`: `owner_id: null` la borra. Las escrituras van en lote (como mucho 4 sentencias). Orden de errores: persona `404`, control `404`, (ejecutor) control ajeno `403`, `CONTROL_RETIRED`, `OWNER_NOT_ELIGIBLE` o `EXECUTOR_NOT_IN_TEAM`; un `admin_monkey` como dueño es `404` (RLS lo oculta). Bloqueos: actor y dueño o ejecutor en `KEY SHARE` por id (paso 1), relectura de estado, grupo y líder, luego las filas de los controles `FOR NO KEY UPDATE` por id (paso 4b: dos asignaciones al mismo control se turnan y la baja de un control no se cuela) y las asignaciones por id. El clonado no crea asignaciones. Pruebas: `test/equipo/asignacion.e2e-spec.ts` |
| Visibilidad por dueño y ejecutor (MD-193, 2026-11-17) | El `responsable` y el `delegado` ven y tocan solo sus controles (dueño o ejecutor activo) en controles, pruebas, evidencia, riesgos y causas, observaciones, hallazgos y servicios, y reciben el resumen de lo suyo (D118). Sin controles, listas vacías; lo ajeno de la empresa es `403`, lo de otra empresa `404`; `view=technical` es `403`. El `delegado` entra en lectura al resumen, los riesgos, los servicios y los hallazgos. La regla vive en `compliance/domain/controls/control-access.ts` (`services` y `technical-control` la repiten en su repositorio). la deuda del acotamiento provisional quedó cerrada; SEG-22, SEG-66, SEG-70 y SEG-76 cumplidos. Pruebas: la matriz rol × recurso de `test/equipo/equipo.e2e-spec.ts` y los e2e de cada recurso |
| Revisión en dos niveles (MD-194, 2026-11-17) | Evidencia: la revisan el `responsable` dueño (lo que no subió él) y el `admin_empresa`, una revisión por rol, y el estado combina las dos (un rechazo gana). Veredicto manual no documental (D121): se registra (ejecutor, dueño o admin; el del admin nace aprobado) y se revisa igual (`PUT /v1/verdicts/{id}/review`), en `test_verdicts` y `test_verdict_reviews`, inmutables (SEG-83). SEG-67 cumplido. Pruebas: `test/cumplimiento/revision-evidencia.e2e-spec.ts` y `veredictos.e2e-spec.ts` |
| «Mi trabajo» y carga de trabajo (MD-195, 2026-11-17) | `GET /v1/me/work` (responsable y delegado) y `GET /v1/team/workload` (admin_empresa), en `compliance/*/work/`; reutilizan el estado por servicio de `GET /v1/assignments`, el módulo de alcance y el avance del resumen (D122, `summarizeControls`). Pruebas: `test/equipo/trabajo.e2e-spec.ts` |
| Grupos (MD-189) | `GET`/`POST`/`PATCH /v1/groups`: el responsable crea su equipo y el administrador el de un responsable o un grupo de responsables; `user_groups.kind` (`group_kind`) con un índice único parcial por líder (un equipo por responsable); «Responsables» reservado (`GROUP_RESERVED`, `GROUP_NAME_TAKEN`); mover un delegado con `PATCH /v1/users/{id}` (`group_id`, `confirm_unassign`, `USER_HAS_ASSIGNMENTS`) |
| Invitación por correo (MD-190) | El alta y el reenvío envían el código por correo (después del commit); ninguna respuesta lo trae; el reenvío responde `200` con `invitation`; el correo no nombra al proveedor de la sonda ni de la nube. SEG-75 cumplido; ver `DT-90` |
| Alta y lista del equipo (MD-188) | `POST`/`GET /v1/users` con `group_id`, `is_internal`, `group` y `responsible`; el responsable queda en «Responsables» y crea delegados de su equipo (`RESPONSIBLE_HAS_NO_TEAM` si no lo tiene); el alta no devuelve el código (`invitation`); migración que mete a los responsables existentes en «Responsables»; `group` y `responsible` en `/auth/me` |
| Cupo de usuarios (MD-187) | `USER_LIMIT_REACHED` (`409`, con `error.max_users` y `error.users_count`) en el alta, en la reactivación `inactive`→`active` y en el canje de la clave; desactivar libera el cupo. Ver `empresas.md` y SEG-72 |

**La API del sprint 3 está completa** (MD-186 a MD-195). Lo que sigue son las pantallas (MD-197 y MD-199 a MD-204, ver `context/frontend.md`).

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
