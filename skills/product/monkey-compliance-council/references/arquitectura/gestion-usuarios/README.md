# Gestión de usuarios

Responde: **¿cómo entra una persona al equipo de una empresa, cómo se organiza en grupos, cómo se edita o se da de baja,
y cómo se le asignan los controles?** Cubre invitar, editar, desactivar, el cupo de usuarios, los grupos
(`admin_empresa` → `responsable` → `delegado`) y el dueño y el ejecutor de cada control. **No cubre** cómo inicia sesión
([`autenticacion/`](../autenticacion/README.md)) ni qué puede hacer cada rol ([`roles-permisos/`](../roles-permisos/README.md)).

> **Rediseñado por D102 (2026-11-03).** La asignación ya no es por dimensión: es por control, con un dueño y un
> ejecutor. El código construido hasta hoy (`user_dimensions`, `service_dimension_owners`, `dimension` en las
> asignaciones) se **elimina** en el sprint 3; ver [`06-mejoras.md`](06-mejoras.md).

## Actores

`admin_empresa` (crea a todo el equipo, asigna el dueño de cada control, ve todo), `responsable` (dueño de sus
controles, lidera un equipo de delegados, asigna ejecutor y revisa), `delegado` (ejecuta lo que su responsable le
asigna), `auditor` (se le invita; lee la cadena). El primer `admin_empresa` no entra por aquí: lo crea el alta de la
empresa. `admin_monkey` fija el cupo de usuarios (`companies.max_users`, D103) y no crea cuentas de una empresa.

## Tablas que posee

`user_groups` · `client_control_assignments`, y de `users` las columnas `name`, `last_name`, `company_id`, `group_id` e
`is_internal`. Frontera de `users` en [`../autenticacion/02-modelo.md`](../autenticacion/02-modelo.md). No son suyas:
`organization_responsibles` (**cargos de la organización** ante el auditor) ni `api_keys`. `companies.max_users` es de
[Empresas](../empresas/README.md).

## Dónde está cada dato

| Dato | Dueño |
|---|---|
| Rutas del equipo, de los grupos y de la asignación; errores | [`contracts/gestion-usuarios.md`](../../../../../../contracts/gestion-usuarios.md) |
| Valores de los enums | [`contracts/enums/gestion-usuarios.md`](../../../../../../contracts/enums/gestion-usuarios.md) |
| Roles, grupos y asignación | `datos/modelo/05-usuarios.md` §5.1 y §5.2 |
| Decisiones (`D-n`) | [`datos/decisiones/gestion-usuarios.md`](../../datos/decisiones/gestion-usuarios.md): `D98` (parcial), `D102`, `D103`, `D104` |
| Pendientes del comité (`P-n`) | ninguno abierto en este módulo (`P38` y `P40` cerrados); las notificaciones son `P39` |
| Requisitos de seguridad | [`seguridad/gestion-usuarios.md`](../../seguridad/gestion-usuarios.md): `SEG-23`, `SEG-72` a `SEG-77` |
| Plan del sprint 3 | [`producto/sprint-usuarios.md`](../../producto/sprint-usuarios.md) |
| Código | `Backend/src/features/team` |
| Deuda vigente | [`deuda-tecnica/gestion-usuarios.md`](../../deuda-tecnica/gestion-usuarios.md): `DT-87`, `DT-88`, `DT-90` |

## Contenido

[`01-c4.md`](01-c4.md) · [`02-modelo.md`](02-modelo.md) · [`03-flujos.md`](03-flujos.md) · [`06-mejoras.md`](06-mejoras.md)
