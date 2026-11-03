# Onboarding · Contexto organizacional

Responde: **¿qué le pregunta Monkey a la empresa sobre sí misma?** Se llena **una vez por empresa**: identidad,
perfil y jurisdicción (cuántos clientes tiene, descripción, países y demás). El nombre llega precargado y bloqueado
desde el alta de la empresa. Lo llena el `admin_empresa`.

## Qué posee

Tablas (`datos/modelo/06-onboarding.md` §6.1): `organizations`, `regulations`, `organization_regulations`,
`organization_responsibles` (cargos ante el auditor, no cuentas).
Código: `Backend/src/features/onboarding` (el avance del onboarding lo deriva `auth` para `GET /me`).

## Dónde está cada dato

| Dato | Dueño |
|---|---|
| Campos, enums y reglas | `contracts/onboarding/contexto-organizacional.md` · `datos/modelo/06-onboarding.md` §6.1 |
| Valores de los enums | [`contracts/enums/onboarding/contexto-organizacional.md`](../../../../../../../contracts/enums/onboarding/contexto-organizacional.md) |
| Decisiones | D44 (qué cuenta como completo), D47 (el marco lo contrata Monkey Admin) |
| Requisitos de seguridad | [`seguridad/onboarding.md`](../../../seguridad/onboarding.md) |

## Contenido

[`02-modelo.md`](02-modelo.md) · [`03-flujos.md`](03-flujos.md). El C4 es del módulo: [`../01-c4.md`](../01-c4.md).
