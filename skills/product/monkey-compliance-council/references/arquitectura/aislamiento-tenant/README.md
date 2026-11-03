# Aislamiento multi-tenant

Responde: **¿qué impide que una empresa vea los datos de otra?** La respuesta corta: **la base de datos, no el
código**. Row-Level Security de PostgreSQL filtra cada fila contra la empresa activa, y la aplicación solo se
encarga de declarar cuál es.

Es una regla transversal, como [Roles y permisos](../roles-permisos/README.md): no tiene pantallas ni tablas
propias, pero la cumplen todos los módulos.

## La idea en una frase

> Si un desarrollador olvida el filtro, **no se filtran datos: no se ve nada**. La política falla cerrado.

Un `WHERE tenant_id = ?` escrito a mano depende de que nadie lo olvide nunca. Una política RLS depende de que la
transacción haya declarado su empresa, y eso lo hace una sola función (`withScope`) por la que pasa todo.

## Qué posee

No tiene tablas. Posee la **regla y sus piezas**: `TenantScope`, `PrismaService.withScope`, las tres variables de
sesión (`app.tenant_id`, `app.user_id`, `app.user_role`), las políticas RLS de las migraciones y las funciones
`SECURITY DEFINER` del schema `platform` para lo que ocurre antes de conocer el tenant.

## Dónde está cada dato

| Dato | Dueño |
|---|---|
| Las dos estrategias (`shared` y `dedicated`) y los 4 schemas | `datos/modelo/04-monkey-admin.md` §4.3 |
| Las tres variables de sesión y las reglas que RLS no impone | `datos/modelo/04-monkey-admin.md` §4.4 |
| Cómo se escriben las políticas, tabla por tabla | `datos/schema-implementacion.md` §5 |
| Requisitos de seguridad | [`seguridad/aislamiento-tenant.md`](../../seguridad/aislamiento-tenant.md): `SEG-01` · `SEG-02` · `SEG-03` · `SEG-04` · `SEG-05` · `SEG-06` · `SEG-07` · `SEG-08` · `SEG-09` |
| Decisiones (`D-n`) | [`datos/decisiones/aislamiento-tenant.md`](../../datos/decisiones/aislamiento-tenant.md): `D25` · `D29` · `D31` |
| Pendientes del comité (`P-n`) | ninguno propio |
| Código | `Backend/src/common/tenancy/`, `Backend/src/infrastructure/database/prisma.service.ts` |
| Deuda vigente | ninguna: `deuda-tecnica/` no tiene archivo de este módulo |

## Contenido

[`01-c4.md`](01-c4.md) · [`03-flujos.md`](03-flujos.md) · [`06-mejoras.md`](06-mejoras.md). No tiene `02-modelo.md`:
sus tablas son las de los demás módulos.
