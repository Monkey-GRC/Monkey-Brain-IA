# Empresas · Mejoras

Propuestas; lo aprobado pasa a `DT-n` o a una `D-n`.

| # | Mejora | Prio | Esfuerzo |
|---|---|---|---|
| M1 | ~~Nadie dispara la purga de empresas vencidas~~ · **Resuelta** | — | — |
| M2 | La base dedicada se ofrece y no existe | B | L |
| M3 | Recuperar una empresa sin administrador activo | B | M |

## M1 · Resuelta: la purga corre sola y con varias instancias
`CompanyPurgeScheduler` la corre cada `COMPANY_PURGE_INTERVAL_MINUTES` (60 por defecto) y `PurgeExpiredCompaniesUseCase`
borra cada empresa con su propio candado: si otra réplica ya la tomó, la salta (`skipped`), y si algo falla la empresa
queda archivada y se reintenta en la siguiente pasada (una sola transacción). Comprobado en el código el 2026-11-18.

## M2 · La base dedicada
El formulario tiene el check y el registro lo rechaza (`DEDICATED_DATABASE_NOT_AVAILABLE`). Está bien no fingirlo,
pero es una promesa comercial que no se puede cumplir. Depende de `P2(d)`; mientras siga abierta, no se construye.

## M3 · Empresa sin administrador activo
Si la única cuenta `admin_empresa` queda inactiva, nadie puede entrar y `admin_monkey` no crea cuentas de un
cliente (D43, D96). Hoy se resuelve por script. Es la pregunta 5 de `P40`.
