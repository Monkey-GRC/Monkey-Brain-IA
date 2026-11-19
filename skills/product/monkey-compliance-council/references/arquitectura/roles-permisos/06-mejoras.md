# Roles y permisos · Mejoras

| # | Mejora | Prio | Esfuerzo |
|---|---|---|---|
| M1 | ~~Cerrar `P3` (permisos por pantalla) antes de ampliar la matriz~~ Cerrada por D102 (2026-11-03): manda la matriz de §5.5 | — | — |
| M2 | `RolesGuard` cerrado por defecto y una prueba que recorra todos los endpoints contra la matriz | M | S |
| M3 | ~~MFA de `responsable` y `delegado`~~ Resuelta por D102, punto 13: TOTP para todos los roles | — | — |

## M1 · La matriz está a medias
`P3` se cerró con D102 (2026-11-03): el comité no entregará el Excel por pantalla y manda la matriz de §5.5. SEG-21
sigue en 🟠 solo por las pantallas pendientes (MD-197 a MD-204), no por esperar al comité.

## M2 · La matriz vive repartida en los `@Roles` y el guard es abierto por defecto
Cada endpoint declara sus roles y no hay un lugar que los compare contra §5.5. Además, `RolesGuard` deja pasar a
cualquier rol con sesión cuando la ruta no declara `@Roles` (`if (!roles?.length) return true`). Hoy no hay una ruta
expuesta: de 182, solo cinco tienen sesión y no tienen `@Roles`, y las cinco son de cualquier rol a propósito
(`GET /auth/me`, `PATCH /auth/me/language`, `POST /auth/password/change`, `POST /auth/mfa/recovery-codes` y
`GET /catalogs/:name`). El riesgo es a futuro: un endpoint nuevo sin `@Roles` quedaría abierto en silencio a todos los
roles de la empresa (la capa 2, RLS, sigue impidiendo ver otra empresa).

La mejora tiene dos partes:
1. **Cerrado por defecto:** sin `@Roles` ni `@Public`, `RolesGuard` responde 403. Las rutas de cualquier rol con
   sesión lo declaran con un decorador explícito (por ejemplo `@AnyRole()`).
2. **Prueba de la matriz:** lee los metadatos de todos los controladores y exige que cada ruta sea `@Public`,
   `@AnyRole` o tenga `@Roles` iguales a los de §5.5. Atrapa también un rol mal puesto, que el punto 1 no ve.

Es una mejora de diseño, no una brecha: Rod decidió (2026-11-18) dejarla aquí, sin ticket.

## M3 · MFA de `responsable` y `delegado`
El Excel la deja en «No» y el producto la exige (D66, D96). D102, punto 13, la fija para todos los roles (TOTP hasta que haya otras formas de ingreso): no queda nada por ratificar.
