# Empresas

Responde: **¿cómo nace una empresa cliente en Monkey y qué pasa cuando deja de serlo?** Es lo único que hace
`admin_monkey` sobre un cliente: registrarlo, reenviarle su clave, archivarlo y purgarlo. **No entra** al
cumplimiento de nadie ni crea cuentas de su equipo (D43, D96).

## Actores

`admin_monkey`, desde el panel `Frontend`. El cliente solo aparece al final: recibe la clave por correo y la canjea
en [Autenticación](../autenticacion/README.md).

## Qué posee

Tablas del schema `platform`: `companies`, `company_frameworks`, `access_keys`, `company_purge_log`.
Código: `Backend/src/features/companies`.
**No posee** `organizations` (eso es el [contexto organizacional](../onboarding/contexto-organizacional/README.md)):
`companies` es la empresa como cliente de Monkey; `organizations` es lo que ella declara de sí misma.

## Dónde está cada dato

| Dato | Dueño |
|---|---|
| Rutas, cuerpos y errores | `contracts/empresas.md` |
| Valores de los enums | [`contracts/enums/empresas.md`](../../../../../../contracts/enums/empresas.md) |
| Tablas y el flujo de registro | `datos/modelo/04-monkey-admin.md` §4.1, §4.2 y §4.2b |
| Marcos contratables y su disponibilidad | `contracts/enums.md` · D47, D50 |
| Decisiones (`D-n`) | [`datos/decisiones/empresas.md`](../../datos/decisiones/empresas.md): `D24` · `D43` · `D47` · `D97` · `D99` |
| Pendientes del comité (`P-n`) | [`datos/pendientes/empresas.md`](../../datos/pendientes/empresas.md): `P2` · `P13` — **si sigue abierto, se pregunta** |
| Requisitos de seguridad | [`seguridad/empresas.md`](../../seguridad/empresas.md): `SEG-57` · `SEG-68` · `SEG-71` |
| Código | `Backend/src/features/companies` |
| Deuda vigente (5 `DT-n`) | [`deuda-tecnica/empresas.md`](../../deuda-tecnica/empresas.md) |

## Contenido

[`01-c4.md`](01-c4.md) · [`02-modelo.md`](02-modelo.md) · [`03-flujos.md`](03-flujos.md) · [`04-historias.md`](04-historias.md) ·
[`05-casos-de-uso.md`](05-casos-de-uso.md) · [`06-mejoras.md`](06-mejoras.md)
