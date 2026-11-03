# Cumplimiento · Controles

Responde: **¿cómo se lee el estado de los controles de un servicio?** Es la pantalla principal del módulo: la lista
de controles, su detalle y las pruebas de cada uno. También el alta y la baja de un control propio de la empresa.

## Qué posee

| Qué | Dónde |
|---|---|
| Endpoints y casos de uso | `compliance/presentation/controls/`, `application/controls/` |
| La foto del servicio | `infrastructure/shared/service-snapshot.loader.ts` |
| Tablas | `client_controls`, `client_control_tests`, `client_control_dimensions` ([`../02-modelo.md`](../02-modelo.md)) |

**No posee el cálculo**: lo hace el [`motor/`](../motor/README.md). Este componente carga los hechos, se los pasa y
formatea el resultado.

## Dos vistas de lo mismo

| Vista | Quién la ve | Qué muestra |
|---|---|---|
| Negocio | los tres roles | El semáforo, el avance, la cobertura y qué falta, con el vocabulario y los códigos del dominio |
| Técnica | `admin_empresa` y `auditor` (D81, D96) | Además: estados del motor, pruebas, puntos de enfoque y resultados por check |

Lo decide `viewModeOf` en la capa de aplicación, no el motor.

## Quién ve qué

El `funcional` recibe **solo lo de sus especialidades**; sin especialidad que coincida, la lista llega vacía (no
falla). El `auditor` ve todo en solo lectura. El `admin_empresa` ve todo y además crea, edita y da de baja
controles propios directamente (D96).

## Dónde está cada dato

Contrato: `contracts/cumplimiento/controles.md`. Decisiones: D68, D81, D96. Flujo: [`03-flujos.md`](03-flujos.md).
