# Motores de medición — la capa que mide

Referencia técnica de los motores que usan el componente [Conexión de activos](../../onboarding/conexion-activos/README.md) del onboarding y el módulo [Control técnico](../README.md) (`modelo-datos.md` §8). Cómo Monkey mide la configuración de los activos de un cliente. **Una carpeta, un solo lugar por tema**: aquí no se repite lo que ya está
en `datos/` (el modelo y las decisiones) ni en `deuda-tecnica/` (lo parchado).

| Pregunta | Archivo |
|---|---|
| ¿Qué reglas del motor de servidores (Wazuh) no se rompen y por qué se eligió? | [`wazuh.md`](wazuh.md) |
| ¿Cómo se opera el manager, los agentes y los grupos por cliente? | [`wazuh-operacion.md`](wazuh-operacion.md) |
| ¿Qué endpoints tiene la API de la sonda y qué límites? | [`wazuh-api.md`](wazuh-api.md) |
| ¿Qué marcos trae etiquetados la sonda y cuáles hay que construir? | [`wazuh-compliance.md`](wazuh-compliance.md) |
| (Componente 3 del onboarding) ¿Cómo conecta un cliente su nube y quién hace qué? (diagramas) | [`flujo-conexion-nube.md`](../../onboarding/conexion-activos/flujo-conexion-nube.md) |
| ¿Qué reglas del motor de nube (Prowler) no se rompen y qué está verificado? | [`prowler.md`](prowler.md) |
| ¿Qué dio el escaneo de la nube y cómo cubre las pruebas `T-CLD`? | [`cruce-nube-aws.md`](cruce-nube-aws.md) (AWS) · [`cruce-nube-gcp.md`](cruce-nube-gcp.md) (GCP) |
| ¿Cómo se ejecuta el motor de nube, quién lo lanza y con qué aislamiento? | `D57` (`datos/decisiones/control-tecnico.md`) y `Backend/src/runner/` |

## Dos motores, un mismo modelo

| | Sonda — Wazuh (servidores, BD, endpoints) | Motor de nube — Prowler (AWS, Azure, GCP) |
|---|---|---|
| Qué evalúa | La configuración (SCA), las amenazas en tiempo real y los incidentes de cada equipo, con un agente | Configuración de una cuenta, suscripción o proyecto |
| Activo | El servidor, la BD, el equipo | La **cuenta**; sus recursos cuelgan de ella (`asset_resources`, D56) |
| Conexión | Agente pre-registrado por Monkey en el grupo del cliente (D54) | Rol de solo lectura entre cuentas (D53, P14 C) |
| Resultado | `check_results` (5 estados) | `check_results` (mismo formato, con recurso y región) |
| Estado | Verificado contra la API; sin agentes reales | Escaneo completo de AWS; GCP escaneado a mano en un proyecto de pruebas (`cruce-nube-gcp.md`); Azure, por probar |

El catálogo, los checks y el mapeo a controles son **de Monkey**; los motores son adaptadores que entregan resultados crudos en un formato
único. Ambos son internos: el cliente solo ve «sonda» o «evaluación automática». El rol de cada motor lo cerró **D100**; lo que sigue abierto de **P14** es la unidad de evaluación, la conexión y el catálogo. Qué se decidió y por qué: `D53` a `D56`.
