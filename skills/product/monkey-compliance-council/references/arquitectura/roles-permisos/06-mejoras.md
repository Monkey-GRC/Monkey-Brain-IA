# Roles y permisos · Mejoras

| # | Mejora | Prio | Esfuerzo |
|---|---|---|---|
| M1 | Cerrar `P3` (permisos por pantalla) antes de ampliar la matriz | A | — |
| M2 | Una prueba que recorra todos los endpoints contra la matriz | B | M |
| M3 | Ratificar MFA del `funcional` con el comité | B | — |

## M1 · La matriz está a medias
SEG-21 está en 🟠 por `P3`: se hizo para `admin_monkey` y `admin_empresa`. Construir permisos del `funcional` o del
auditor antes del Excel del comité obliga a rehacerlos.

## M2 · La matriz vive repartida en los `@Roles`
Cada endpoint declara sus roles y no hay un lugar que los compare contra §5.5. Una prueba que lea los metadatos de
todos los controladores y los contraste con una tabla evitaría que un endpoint nuevo quede abierto por olvido.

## M3 · MFA del `funcional`
El Excel la deja en «No» y el producto la exige (D66, D96): está por ratificar con el comité.
