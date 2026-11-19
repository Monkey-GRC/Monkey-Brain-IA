# Onboarding · Conexión de activos

Responde: **¿cómo declara la empresa los activos de un servicio y cómo se conectan a Monkey?** El cliente elige la
plataforma del catálogo y, por cada conexión, recorre conectar → validar → activar → programar. Solo se habilita
cuando el servicio ya tiene sus riesgos evaluados (D89). Un componente **interno**: en pantalla se dice «sonda» o
«evaluación automática», nunca el nombre del motor.

## Qué posee

Tablas (`datos/modelo/06-onboarding.md` §6.3): `assets`, `service_assets`, `asset_provisionings`.
Código: `Backend/src/features/technical-control` (parte de conexión y activos).

## Límites con otros módulos

Aquí termina la preparación. Lo que pasa **después** (ejecuciones, resultados, calendario) es el módulo
[`control-tecnico/`](../../control-tecnico/README.md); los motores que miden, su referencia técnica
[`control-tecnico/motores/`](../../control-tecnico/motores/README.md).

## Contenido

[`02-modelo.md`](02-modelo.md) · [`03-flujos.md`](03-flujos.md) · [`04-historias.md`](04-historias.md) (`HU-ONB-15` a `HU-ONB-29`). El C4 es del módulo: [`../01-c4.md`](../01-c4.md).

| Archivo | Qué es |
|---|---|
| [`flujo-conexion-nube.md`](flujo-conexion-nube.md) | Cómo conecta un cliente su nube y quién hace qué (diagramas para el comité). Interno. |

## Dónde está cada dato

| Dato | Dueño |
|---|---|
| Rutas | `contracts/onboarding/conexion-activos/README.md` |
| Valores de los enums | [`contracts/enums/onboarding/conexion-activos.md`](../../../../../../../contracts/enums/onboarding/conexion-activos.md) |
| Campos y entidades | `datos/modelo/06-onboarding.md` §6.3 |
| Decisiones | D46, D48, D53, D54, D57, D58, D67, D71, D92, D112, D113, D114 |
| Deuda vigente | [`deuda-tecnica/onboarding.md`](../../../deuda-tecnica/onboarding.md) (lo de conectar) y [`control-tecnico.md`](../../../deuda-tecnica/control-tecnico.md) (lo de medir) |
