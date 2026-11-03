# Aislamiento multi-tenant · Mejoras

Propuestas; lo aprobado pasa a `DT-n` o a una `D-n`.

| # | Mejora | Prio | Esfuerzo |
|---|---|---|---|
| M1 | Índices compuestos que empiecen por `tenant_id` | B | S |
| M2 | Una prueba que recorra todas las tablas con RLS | B | M |
| M3 | La base dedicada no existe | B | L |

## M1 · Los índices no acompañan a las políticas
Cada política filtra por `tenant_id`, y casi todo `@@index([tenantId])` está solo. Las consultas reales filtran por
`tenant_id` **y** `service_id` o `client_control_id`: un índice compuesto que empiece por `tenant_id` evita filtrar
después de leer. Revisar con `EXPLAIN` las consultas más lentas antes de añadir, porque cada índice encarece las
escrituras.

## M2 · La cobertura de las pruebas de aislamiento no es exhaustiva
Hay pruebas e2e de aislamiento, pero no una que recorra **todas** las tablas con RLS y compruebe que cada una
devuelve vacío sin `app.tenant_id`. Una tabla nueva sin política pasaría desapercibida. Sería un verificador más,
al estilo de `audit:verify`.

## M3 · La base dedicada
`isolation_strategy = dedicated` está en el modelo (D25) y en el formulario de registro, pero el aprovisionamiento
no está construido y el registro lo rechaza. Depende de `P2(d)`. Ver
[`empresas/06-mejoras.md`](../empresas/06-mejoras.md) (M2).
