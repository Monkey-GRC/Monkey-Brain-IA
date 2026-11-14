# Enums — Gestión de usuarios

> Índice de todos los enums: [`enums.md`](../enums.md). Por el cable viaja el **valor**; la etiqueta (es/en) la resuelve i18n. Formato: [`README.md`](../README.md#formato-de-un-enum).

## `user_status`
**Columna:** `users.status` · **Cupo (D103):** `active`, `pending` y `suspended` cuentan para `companies.max_users`; `inactive` no.

| Valor | Etiqueta (es) | Qué significa |
|---|---|---|
| `active` | Activo | |
| `inactive` | Inactivo | Dado de baja; sin acceso (CC6.3); libera el cupo. En un `admin_monkey` es la gracia de 7 días: lleva `purge_at` y al vencer la cuenta se borra (D117) |
| `suspended` | Suspendido | |
| `pending` | Pendiente de activar | La cuenta existe pero aún no usó su código; no puede iniciar sesión (D95) |

## `group_kind`
**Columna:** `user_groups.kind` · **Dónde se usa:** campo `kind` de `GET /v1/groups`. Un `responsable` lidera como mucho **un** grupo `team` (D104).

| Valor | Etiqueta (es) | Qué significa |
|---|---|---|
| `responsables` | Grupo de responsables | Lo lidera el `admin_empresa`; ahí queda todo `responsable`. El primero es «Responsables», reservado |
| `team` | Equipo de delegados | Lo lidera un `responsable`; ahí están sus `delegado` |

## `assignment`
**Dónde se usa:** filtro `assignment` de `GET /v1/assignments`.

| Valor | Etiqueta (es) | Qué significa |
|---|---|---|
| `unassigned` | Sin asignar | El control no tiene dueño |
| `assigned` | Asignado | |

## `role_in_control`
**Dónde se usa:** campo de cada ítem de `GET /v1/me/work`.

| Valor | Etiqueta (es) | Qué significa |
|---|---|---|
| `owner` | Dueño | Es el `responsable` (o el `admin_empresa`) del control |
| `executor` | Ejecutor | Es el `delegado` que lo ejecuta |

## `work_bucket`
**Dónde se usa:** filtro `bucket` de `GET /v1/me/work`.

| Valor | Etiqueta (es) | Qué significa |
|---|---|---|
| `to_upload` | Por subir | Falta subir evidencia |
| `rejected` | Rechazado, por rehacer | Una revisión lo rechazó |
| `to_review` | Por revisar | **Solo `responsable`**: evidencia de su equipo por revisar |
| `in_review` | En revisión | Subida, sin revisión completa |
| `done` | Listo | |
