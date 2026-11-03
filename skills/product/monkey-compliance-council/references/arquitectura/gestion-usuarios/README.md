# Gestión de usuarios

Responde: **¿cómo entra una persona al equipo de una empresa, cómo se edita o se da de baja, y cómo se le reparte
el trabajo?** Cubre invitar, editar, desactivar, la especialidad del `funcional` y el reparto por dimensión. **No cubre**
cómo inicia sesión ([`autenticacion/`](../autenticacion/README.md)) ni qué puede hacer cada rol
([`roles-permisos/`](../roles-permisos/README.md)).

> **En revisión.** P38 puede cambiar el reparto de «por dimensión» a «por control» y añadir un tercer nivel de
> responsables. Esta carpeta describe lo construido hoy; al cerrarse P38 (nace D102) se actualiza.

## Actores

`admin_empresa` (invita, edita, desactiva y reparte), `funcional` (recibe la invitación y ejecuta lo suyo), `auditor`
(se le invita; lee el reparto). El primer `admin_empresa` no entra por aquí: lo crea el alta de la empresa.

## Tablas que posee

`user_dimensions` · `service_dimension_owners` · `user_control_assignments`, y de `users` las columnas `name`,
`last_name` y `company_id`. Frontera de `users` en [`../autenticacion/02-modelo.md`](../autenticacion/02-modelo.md).
No son suyas: `organization_responsibles` (cargos ante el auditor, contexto organizacional) ni `api_keys`.

## Dónde está cada dato

| Dato | Dueño |
|---|---|
| Rutas del equipo y del reparto, errores | [`contracts/gestion-usuarios.md`](../../../../../../contracts/gestion-usuarios.md) |
| Valores de los enums | [`contracts/enums/gestion-usuarios.md`](../../../../../../contracts/enums/gestion-usuarios.md) |
| Especialidad y responsable por dimensión | `datos/modelo/05-usuarios.md` §5.1 y §5.2 |
| Decisiones (`D-n`) | [`datos/decisiones/gestion-usuarios.md`](../../datos/decisiones/gestion-usuarios.md): `D98` |
| Pendientes del comité (`P-n`) | [`datos/pendientes/gestion-usuarios.md`](../../datos/pendientes/gestion-usuarios.md): `P38` · `P40` — **si sigue abierto, se pregunta** |
| Preguntas abiertas | `P38`, `P39`, `P40` |
| Requisitos de seguridad | [`seguridad/gestion-usuarios.md`](../../seguridad/gestion-usuarios.md): `SEG-23` |
| Código | `Backend/src/features/team` |
| Deuda vigente | ninguna: `deuda-tecnica/` no tiene archivo de este módulo |

## Contenido

[`01-c4.md`](01-c4.md) · [`02-modelo.md`](02-modelo.md) · [`03-flujos.md`](03-flujos.md) · [`06-mejoras.md`](06-mejoras.md)
