# Onboarding · Contexto del servicio

Responde: **¿qué servicio ofrece la empresa, bajo qué marco se evalúa y cómo queda listo para medirse?** Es repetible:
una vez por servicio. Cubre el alta del servicio (16 campos, con la descripción del sistema), el clonado automático del
catálogo del marco y el asistente que evalúa los riesgos del servicio antes de declarar activos (D89).

## Qué posee

Tablas (`datos/modelo/06-onboarding.md` §6.2): `services`, `service_trust_criteria`, `service_frameworks`,
`subservice_organizations`, `csocs`, `cuecs`, `system_descriptions`.
Código: `Backend/src/features/services` (incluye `CloneCatalogService`).

## Límites con otros módulos

- Al fijar el marco se **clonan** controles, riesgos y causas del catálogo: lo clonado pasa a ser de los módulos de
  Cumplimiento (por documentar), no de este componente.
- La **evaluación de riesgos** se ejecuta en esta pantalla, pero la posee el módulo de riesgos.

## Dónde está cada dato

| Dato | Dueño |
|---|---|
| Campos y reglas | `contracts/onboarding/contexto-servicio.md` · `datos/modelo/06-onboarding.md` §6.2 |
| Valores de los enums | [`contracts/enums/onboarding/contexto-servicio.md`](../../../../../../../contracts/enums/onboarding/contexto-servicio.md) |
| Clonado del catálogo | `datos/modelo/03-catalogo-maestro.md` §3.5 · D23, D25, D28, D36 |
| Cadena crear → evaluar → conectar | D89, D93 |

## Contenido

[`02-modelo.md`](02-modelo.md) · [`03-flujos.md`](03-flujos.md). El C4 es del módulo: [`../01-c4.md`](../01-c4.md).
