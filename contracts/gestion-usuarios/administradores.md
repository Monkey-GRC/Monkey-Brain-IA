---
id: contracts-users-admins
name: Contrato — Administradores de Monkey: invitar, desactivar y reactivar
description: Cómo un admin_monkey invita a otro por correo, lo desactiva (7 días de gracia y luego se borra), lo reactiva, y cómo la auditoría conserva el sello de quien ya no existe.
type: contract
---

# Administradores de Monkey — invitar, desactivar y reactivar

| | |
|---|---|
| **Estado** | **CONSTRUIDO** (MD-215, 2026-11-13, D117; ver [Estado de implementación](#estado-de-implementación)) |
| **App** | Monkey Admin. Monkey Platform no ve nada de esto |
| **Reglas del modelo** | `datos/modelo/04-monkey-admin.md` §4.2c · convenciones: [`conventions.md`](../conventions.md) · enums: [`enums.md`](../enums.md) |

**Qué es.** Hasta hoy los `admin_monkey` solo se crean por consola. Aquí un `admin_monkey` activo **invita** a otro por correo, lo **desactiva** y lo **reactiva**. Desactivar da **7 días de gracia** y luego la cuenta **se borra por completo** (D117). Cualquier administrador puede hacerlo sobre cualquier otro, con dos candados: **nadie se desactiva a sí mismo y el último administrador activo no se puede desactivar**. La cuenta de una empresa cliente **no** se gestiona aquí: eso sigue en [`../gestion-usuarios.md`](../gestion-usuarios.md).

## Índice de endpoints

| Método | Ruta | Quién | Para qué |
|---|---|---|---|
| `GET` | [`/v1/admins`](#get-v1admins--listar-los-administradores) | `admin_monkey` | Listar a los administradores |
| `POST` | [`/v1/admins`](#post-v1admins--invitar-a-un-administrador) | `admin_monkey` | Invitar a otro por correo |
| `POST` | [`/v1/admins/{id}/activation-code`](#post-v1adminsidactivation-code--reenviar-la-invitación) | `admin_monkey` | Reenviar la invitación con un código nuevo |
| `POST` | [`/v1/admins/{id}/deactivation`](#post-v1adminsiddeactivation--desactivar) | `admin_monkey` | Desactivar (gracia de 7 días) |
| `POST` | [`/v1/admins/{id}/reactivation`](#post-v1adminsidreactivation--reactivar) | `admin_monkey` | Reactivar dentro de la gracia |

La **activación de la cuenta** invitada reutiliza `POST /v1/auth/activate/lookup` y `POST /v1/auth/activate` ([`autenticacion.md`](../autenticacion.md)): la persona pone su contraseña y configura su segundo factor; el enlace del correo apunta a **Monkey Admin**. No hay endpoint de purga: la hace un proceso programado.

## Quién puede qué

| Acción | `admin_monkey` | Cualquier otro rol |
|---|---|---|
| Listar, invitar, reenviar, desactivar, reactivar | ✓ (activo) | `403 FORBIDDEN` |
| Sobre uno mismo | Solo listar y ver. Desactivarse es `409 CANNOT_DEACTIVATE_SELF` | — |
| Sobre el único activo | Desactivarlo es `409 LAST_ADMIN` | — |

Invitar y desactivar piden el **código del segundo factor** de quien actúa (`totp_code`), como archivar una empresa (D97). **Reactivar no lo pide** (D117, punto 6). Un administrador de **otra empresa** o un usuario que no es `admin_monkey` es siempre `404`: aquí solo existen los administradores de Monkey.

---

## Administradores

### GET /v1/admins — Listar los administradores

| | |
|---|---|
| **Quién** | `admin_monkey` |
| **Éxito** | `200`, paginada |
| **Errores** | `403 FORBIDDEN` |

#### Parámetros (query)
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `page`, `page_size` | integer | no | Ver `conventions.md` |
| `sort` | string | no | `created_at`, `email` o `purge_at`, con `+`/`-` |
| `status` | enum `user_status` | no | Filtro: `active`, `pending` o `inactive` |

#### Response `200`
| Campo (de cada ítem) | Tipo | Qué es |
|---|---|---|
| `id` | uuid | |
| `email`, `name`, `last_name` | string | |
| `role` | enum `user_role` | Hoy siempre `admin_monkey` |
| `status` | enum `user_status` | `pending` (invitado, sin activar), `active` o `inactive` (en gracia) |
| `is_mfa_enabled` | boolean | |
| `last_login_at`, `created_at` | datetime \| null | |
| `invited_by` | `{ id, name, last_name }` \| null | Quién emitió el primer código de activación de esa cuenta. Si esa persona ya se purgó, sale su [sello](#el-sello-de-auditoría) (con `purged: true`); `null` si la creó la consola |
| `purge_at` | datetime \| null | Solo con `status: "inactive"`: cuándo se borra. La pantalla muestra la cuenta atrás |

Nunca devuelve el código de activación ni su hash.

```json
{
  "statusCode": 200,
  "message": "admin.list",
  "data": {
    "items": [
      {
        "id": "5b0e…", "email": "ana@monkey.example", "name": "Ana", "last_name": "Ruiz",
        "role": "admin_monkey", "status": "inactive", "is_mfa_enabled": true,
        "last_login_at": "2026-11-10T14:00:00Z", "created_at": "2026-10-01T09:00:00Z",
        "invited_by": { "id": "1f3c…", "name": "Rod", "last_name": "Ríos" },
        "purge_at": "2026-11-20T15:04:02Z"
      }
    ],
    "page": 1,
    "page_size": 25,
    "total": 4,
    "total_pages": 1
  }
}
```

### POST /v1/admins — Invitar a un administrador

| | |
|---|---|
| **Quién** | `admin_monkey` |
| **Éxito** | `201` con la cuenta e `invitation` |
| **Errores** | `403` · `401 MFA_CODE_INVALID` · `403 ACCOUNT_LOCKED` · `409 MFA_NOT_ENABLED` · `409 EMAIL_TAKEN` · `422 VALIDATION_FAILED` |

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `email` | string | sí | Único en toda la plataforma; se guarda en minúsculas |
| `name`, `last_name` | string | sí | 1 a 100 caracteres (D98) |
| `role` | enum `user_role` | sí | **Solo `admin_monkey`** (D117). Cualquier otro valor es `422 role.not_allowed` |
| `totp_code` | string | sí | El del propio administrador que invita |

```json
{ "email": "ana@monkey.example", "name": "Ana", "last_name": "Ruiz", "role": "admin_monkey", "totp_code": "123456" }
```

#### Response `201`
El objeto de [listar](#get-v1admins--listar-los-administradores) con `status: "pending"`, `invited_by` y `purge_at: null`, más:

| Campo | Tipo | Qué es |
|---|---|---|
| `invitation` | `{ delivery_status, expires_at }` | `sent` o `failed` (la cuenta existe y se reenvía con `…/activation-code`). **Nunca trae el código**, que va solo por correo (`SEG-75`, `SEG-80`) |

La cuenta nace `pending`, con una contraseña imposible de adivinar, y no inicia sesión hasta activarse. **El correo no nombra al proveedor de la sonda ni de la nube.** La empresa interna de Monkey **no tiene límite de usuarios** (D117, punto 7): el alta y la reactivación no responden `USER_LIMIT_REACHED`.

### POST /v1/admins/{id}/activation-code — Reenviar la invitación

| | |
|---|---|
| **Quién** | `admin_monkey` |
| **Éxito** | `200` con `invitation` |
| **Errores** | `403` · `404` · `409 USER_ALREADY_ACTIVE` |

Sin cuerpo. Se revoca el código vigente y se envía uno nuevo, solo mientras la cuenta esté `pending`. La respuesta trae solo `invitation`, igual que [`gestion-usuarios.md`](../gestion-usuarios.md#post-v1usersidactivation-code--reenviar-la-invitación). Mismos límites conocidos que `DT-90`.

### POST /v1/admins/{id}/deactivation — Desactivar

| | |
|---|---|
| **Quién** | `admin_monkey` |
| **Éxito** | `200` con la cuenta (`status: "inactive"`, `purge_at`) |
| **Errores** | `403` · `404` · `401 MFA_CODE_INVALID` · `403 ACCOUNT_LOCKED` · `409 MFA_NOT_ENABLED` · `409 CANNOT_DEACTIVATE_SELF` · `409 LAST_ADMIN` · `409 ADMIN_ALREADY_INACTIVE` · `409 USER_NOT_ACTIVATED` · `422 VALIDATION_FAILED` |

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `totp_code` | string | sí | El del propio administrador que desactiva |

#### Efectos
En **una transacción**: la cuenta pasa a `inactive` con `purge_at = ahora + 7 días`; se cierran sus sesiones y los desafíos de segundo factor abiertos (entra en `401` al instante, `SEG-23`); se escribe la auditoría. Las filas de los administradores se bloquean en un orden fijo y **cuentan solo los `active`**: dos desactivaciones simultáneas nunca dejan a Monkey sin administrador (`SEG-79`). Una cuenta `pending` (invitada y sin activar) no se desactiva: `409 USER_NOT_ACTIVATED`; se le reenvía o se deja vencer su código.

La pantalla avisa **antes** de confirmar: *«En 7 días se borrará esta cuenta de forma definitiva. Hasta entonces puedes reactivarla. Lo que hizo seguirá apareciendo en la auditoría con su nombre.»*

### POST /v1/admins/{id}/reactivation — Reactivar

| | |
|---|---|
| **Quién** | `admin_monkey` |
| **Éxito** | `200` con la cuenta (`status: "active"`, `purge_at: null`) |
| **Errores** | `403` · `404` · `409 ADMIN_NOT_INACTIVE` |

Sin cuerpo. Solo mientras la cuenta esté `inactive` y no se haya purgado. **Pasados los 7 días la cuenta ya no existe y la respuesta es `404`**: hay que invitar de nuevo (el correo queda libre). **No pide el segundo factor** (D117, punto 6): devolver acceso a quien ya lo tuvo no abre una puerta nueva. Debe iniciar sesión de nuevo: las sesiones anteriores siguen cerradas.

---

## El sello de auditoría

Al purgar, **en la misma transacción y antes de borrar la fila**, se guarda en `audit.admin_tombstones` el `id`, el nombre completo y el rol del administrador. Nunca el correo ni nada de acceso (D117, punto 4). Donde un registro atribuye algo a una persona que ya no existe (`audit_logs.user_id`, `invited_by`, quien publicó una versión del catálogo…) la lectura devuelve el sello:

| Campo | Tipo | Qué es |
|---|---|---|
| `id` | uuid | El mismo que tuvo en `users` |
| `name`, `last_name` | string | Como estaban al purgarse |
| `role` | enum `user_role` | |
| `purged` | boolean | `true`: la cuenta ya no existe. La pantalla lo muestra como «Administrador eliminado» junto a su nombre |

## Purga programada

No es un endpoint. Un proceso programado (modelo: `company-purge.scheduler`) corre cada `ADMIN_PURGE_INTERVAL_MINUTES` (por defecto 1440, un día; la primera pasada, 60 s después de arrancar) y, por cada administrador `inactive` con `purge_at` vencido: inserta el sello, borra sus credenciales y su fila, y deja `admin.purge` con un **actor del sistema** (sin `user_id`). Es idempotente: dos corridas seguidas no fallan ni duplican el sello. Si falla a medias, no queda la persona sin cuenta **y** sin sello.

---

## Auditoría

| `action` | Cuándo | Quién | `tenant_id` |
|---|---|---|---|
| `admin.invite` | Se invita a un administrador | `admin_monkey` | La empresa interna |
| `admin.activation_code_regenerate` | Se reenvía la invitación | `admin_monkey` | La empresa interna |
| `admin.deactivate` | Se desactiva (`before_state`/`after_state` con `status` y `purge_at`; `sessions_closed`) | `admin_monkey` | La empresa interna |
| `admin.reactivate` | Se reactiva | `admin_monkey` | La empresa interna |
| `admin.purge` | La purga borra la cuenta | El sistema | La empresa interna |

Un intento rechazado por `CANNOT_DEACTIVATE_SELF`, `LAST_ADMIN` o un `totp_code` inválido también deja registro, con `result: error` y solo el motivo del rechazo. Se escribe **en la misma transacción** que la acción; nunca se guarda el código de activación ni el `totp_code`. `audit_logs` no se reescribe: el sello es lo que da el nombre cuando la cuenta ya no está.

## Errores del módulo

| HTTP | `error.code` | Cuándo |
|---|---|---|
| 403 | `FORBIDDEN` | El rol no es `admin_monkey` |
| 403 | `ACCOUNT_INACTIVE` | Quien hace la petición fue desactivado mientras ella se procesaba: no se escribe nada |
| 404 | `NOT_FOUND` | El administrador no existe, ya se purgó, o el id es de un usuario que no es `admin_monkey` |
| 409 | `EMAIL_TAKEN` | Ese correo ya tiene cuenta |
| 409 | `CANNOT_DEACTIVATE_SELF` | Uno se desactiva a sí mismo (D117) |
| 409 | `LAST_ADMIN` | Se desactiva al único `admin_monkey` activo. Es una red de seguridad: quien actúa debe estar `active` y no puede ser el objetivo, así que por HTTP siempre queda otro activo; si se diera, se rechaza y se audita |
| 409 | `ADMIN_ALREADY_INACTIVE` | Se desactiva a quien ya está en gracia |
| 409 | `ADMIN_NOT_INACTIVE` | Se reactiva a quien no está en gracia |
| 409 | `USER_NOT_ACTIVATED` | Se desactiva una cuenta `pending` |
| 409 | `USER_ALREADY_ACTIVE` | Se reenvía la invitación de quien ya activó |
| 401 · 403 · 409 | `MFA_CODE_INVALID` · `ACCOUNT_LOCKED` · `MFA_NOT_ENABLED` | El `totp_code` de quien actúa no pasa; ver [`autenticacion.md`](../autenticacion.md) |
| 422 | `VALIDATION_FAILED` | `required`, `email.invalid`, `enum.invalid`, `role.not_allowed`. Un `{id}` mal formado es `404`, como en el resto del Backend |

**Claves i18n:** `admin.list`, `admin.invited`, `admin.activation_code_regenerated`, `admin.deactivated`, `admin.reactivated`, `admin.purged_label` («Administrador eliminado»).

---

## Preguntas abiertas

Las mejoras futuras (ver el equipo de una empresa, soporte, exportar, más roles administrativos) están en [`P47`](../../skills/product/monkey-compliance-council/references/datos/pendientes/gestion-usuarios.md#p47--qué-más-hace-admin_monkey-con-las-cuentas-y-las-empresas-mejoras-futuras-de-monkey-admin). **Ninguna se resuelve aquí.**

## Estado de implementación

**Construido (MD-215, 2026-11-13).** Backend: `Backend/src/features/admin-users` (endpoints, purga programada, sello) y las migraciones `20261113000500_admin_accounts` y `20261113000600_rls_admin_accounts`; prueba `test/administradores/administradores.e2e-spec.ts`. Frontend (Monkey Admin): `Frontend/src/app/features/admin-users` (ruta `/admins`, entrada «Administradores» en Parametrización) y la pantalla `auth/activate` (el correo trae el código y la raíz de Monkey Admin; la persona escribe código, correo y contraseña, y sigue la configuración del segundo factor). Todos los textos en i18n (es y en), con los componentes y tokens del sistema de diseño (`skills/frontend/design-system/`) para tema claro y oscuro.
