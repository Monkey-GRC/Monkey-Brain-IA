# Empresas · Mejoras

Propuestas; lo aprobado pasa a `DT-n` o a una `D-n`.

| # | Mejora | Prio | Esfuerzo |
|---|---|---|---|
| M1 | Nadie dispara la purga de empresas vencidas | B | M |
| M2 | La base dedicada se ofrece y no existe | B | L |
| M3 | Recuperar una empresa sin administrador activo | B | M |

## M1 · La purga no se ejecuta sola
`PurgeExpiredCompanies` existe como caso de uso y `GET /companies/pending-purge` las lista, pero nada dentro de
`Backend/src/` lo invoca de forma periódica. Es el mismo hueco de planificación que
[`control-tecnico/06-mejoras.md`](../control-tecnico/06-mejoras.md) (M1): conviene resolver los dos juntos, con un
solo mecanismo y con bloqueo entre instancias.

## M2 · La base dedicada
El formulario tiene el check y el registro lo rechaza (`DEDICATED_DATABASE_NOT_AVAILABLE`). Está bien no fingirlo,
pero es una promesa comercial que no se puede cumplir. Depende de `P2(d)`; mientras siga abierta, no se construye.

## M3 · Empresa sin administrador activo
Si la única cuenta `admin_empresa` queda inactiva, nadie puede entrar y `admin_monkey` no crea cuentas de un
cliente (D43, D96). Hoy se resuelve por script. Es la pregunta 5 de `P40`.
