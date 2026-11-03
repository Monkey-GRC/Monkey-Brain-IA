# Roles y permisos · Modelo

Responde: **¿dónde vive el rol en la base y quién lo lee?** No tiene tablas propias: el modelo es una columna y las
políticas que la consultan.

| Elemento | Dónde | Quién lo lee |
|---|---|---|
| `users.role` (enum `user_role`: `admin_monkey`, `admin_empresa`, `funcional`, `auditor`) | `platform.users` | `ValidateSessionUseCase` en cada petición |
| `app.user_role` | variable de transacción fijada por `withScope` | Políticas RLS que reservan lo global a `admin_monkey` (catálogo, empresas) |
| `user_dimensions` | `platform` (de [Gestión de usuarios](../gestion-usuarios/02-modelo.md)) | Alcance del `funcional` |

La matriz de qué puede hacer cada rol no se guarda en la base: vive en el código, en los `@Roles` de cada endpoint, y
su definición es [`datos/modelo/05-usuarios.md`](../../datos/modelo/05-usuarios.md) §5.5.

## Cómo verificarlo

`Backend/prisma/schema/platform/users.prisma` (enum `UserRole`).
