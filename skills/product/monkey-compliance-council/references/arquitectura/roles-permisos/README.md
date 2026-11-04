# Roles y permisos

Responde: **¿qué puede hacer cada rol y en qué punto del sistema se aplica esa restricción?** Cubre los 4 roles fijos,
la matriz de permisos y las tres capas donde se hace cumplir. **No cubre** cómo se crea o se da de baja una cuenta
([`gestion-usuarios/`](../gestion-usuarios/README.md)) ni cómo inicia sesión ([`autenticacion/`](../autenticacion/README.md)).

Se separa de Gestión de usuarios porque es otra pieza de la arquitectura: no tiene pantallas ni casos de uso propios,
es una **regla transversal** (guardas, contexto de tenant y políticas RLS) que aplican todos los módulos.

## Actores

Los roles: `admin_monkey`, `admin_empresa`, `responsable`, `delegado`, `auditor`. No hay roles personalizados (D96, D102).

## Qué posee

Una columna, `users.role` (enum `user_role`), y la regla transversal: `@Roles`, `RolesGuard`, `TenantScope`
y las políticas RLS que leen `app.user_role`. Sin tablas propias.

## Dónde está cada dato

| Dato | Dueño |
|---|---|
| Valores de los enums | [`contracts/enums/roles-permisos.md`](../../../../../../contracts/enums/roles-permisos.md) |
| Los 4 roles, su alcance y la matriz de permisos | `datos/modelo/05-usuarios.md` §5.1 y §5.5 |
| Permisos por pantalla | `P3` (espera el Excel del comité) |
| Decisiones (`D-n`) | [`datos/decisiones/roles-permisos.md`](../../datos/decisiones/roles-permisos.md): `D63` · `D64` · `D77` · `D81` · `D84` · `D96` |
| Pendientes del comité (`P-n`) | [`datos/pendientes/roles-permisos.md`](../../datos/pendientes/roles-permisos.md): `P3` · `P34` · `P35` · `P36` — **si sigue abierto, se pregunta** |
| Requisitos de seguridad | [`seguridad/roles-permisos.md`](../../seguridad/roles-permisos.md): `SEG-20` · `SEG-21` · `SEG-22` · `SEG-54` · `SEG-55` · `SEG-56` · `SEG-58` · `SEG-61` · `SEG-66` · `SEG-67` · `SEG-70` |
| Código | `Backend/src/common/guards`, `common/decorators`, `common/tenancy` |
| Deuda vigente | ninguna: `deuda-tecnica/` no tiene archivo de este módulo |

## Contenido

[`01-c4.md`](01-c4.md) · [`02-modelo.md`](02-modelo.md) · [`03-flujos.md`](03-flujos.md) · [`06-mejoras.md`](06-mejoras.md)
