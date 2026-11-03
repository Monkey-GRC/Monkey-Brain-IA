# Autenticación

Responde: **¿cómo se sabe quién es una persona y que sigue siendo ella en cada petición?** Cubre entrar, salir,
mantener la sesión, el segundo factor, activar una cuenta y recuperar la contraseña. **No cubre** qué puede hacer
cada rol: eso es [`roles-permisos/`](../roles-permisos/README.md); ni quién forma parte de la empresa: eso es [`gestion-usuarios/`](../gestion-usuarios/README.md).

## Actores

Cualquier persona con cuenta (los 4 roles) y una persona sin cuenta que canjea una clave o un código de activación.

## Tablas que posee (schema `platform`)

`users` (credenciales y estado) · `sessions` · `mfa_challenges` · `user_recovery_codes` · `password_history` ·
`password_reset_tokens` · `user_activation_codes`. Detalle y diagrama: [`02-modelo.md`](02-modelo.md). `access_keys` la posee [Empresas](../empresas/README.md): aquí solo se canjea.
`users` es compartida con Gestión de usuarios y Roles y permisos; la frontera está en [`02-modelo.md`](02-modelo.md).

## Dónde está cada dato

| Dato | Dueño |
|---|---|
| Endpoints, cuerpos y errores | [`contracts/autenticacion.md`](../../../../../../contracts/autenticacion.md) |
| Políticas de sesión, contraseña y MFA (valores y porqué) | `datos/modelo/05-usuarios.md` §5.3 |
| Requisitos de seguridad | [`seguridad/autenticacion.md`](../../seguridad/autenticacion.md): `SEG-10` · `SEG-11` · `SEG-12` · `SEG-13` · `SEG-14` · `SEG-15` · `SEG-16` · `SEG-17` · `SEG-18` · `SEG-64` |
| Decisiones (`D-n`) | [`datos/decisiones/autenticacion.md`](../../datos/decisiones/autenticacion.md): `D66` · `D94` · `D95` · `D101` |
| Pendientes del comité (`P-n`) | ninguno propio |
| Código | `Backend/src/features/auth`; convenciones en `context/backend.md` |
| Deuda vigente (1 `DT-n`) | [`deuda-tecnica/autenticacion.md`](../../deuda-tecnica/autenticacion.md) |

## Contenido

[`01-c4.md`](01-c4.md) · [`02-modelo.md`](02-modelo.md) · [`03-flujos.md`](03-flujos.md) · [`06-mejoras.md`](06-mejoras.md)
