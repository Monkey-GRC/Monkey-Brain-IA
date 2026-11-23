# Modelo de datos — lo que falta decidir

Las decisiones **del modelo relacional** están todas cerradas, con su fuente y su
razonamiento, en **`datos/decisiones/README.md`**. Lo que queda abierto es esto:
preguntas de producto que **solo el comité o Nelson pueden responder**. Antes de construir
algo que dependa de una, consúltala — si sigue aquí, no la resuelvas por tu cuenta.

**Los números son estables: una pregunta cerrada no se reutiliza ni renumera el resto**, para
que las referencias desde `contracts/`, Jira o un comentario viejo sigan valiendo.

## Tablero

Lo que sigue abierto, con lo más urgente arriba. 🚧 bloquea trabajo · ⚠️ condiciona una decisión o pantalla · sin icono, no bloquea. Cada P lleva a su ficha, en el archivo de su módulo más abajo.

| P | Pregunta | ¿Qué espera por ella? | Abierta desde |
|---|---|---|---|
| [P39](notificaciones.md#p39--notificaciones-a-toda-la-cadena-de-un-control) | Notificaciones a toda la cadena de un control | 🚧 El canal, la frecuencia y el centro de notificaciones (los eventos y destinatarios los dio D138); depende de MD-69, que no existe | 2026-11-01 |
| [P48](cumplimiento.md#p48--el-motor-v2-lo-que-la-vf18-no-define-o-donde-se-contradice) | El motor v2: lo que la VF18 no define o donde se contradice (activo sin resultado, quién registra una prueba manual, el evaluador, los planes, el alcance de los parámetros) | 🚧 El motor v2 (RC-06, RC-08, RC-11, RC-19) | 2026-11-22 |
| [P49](control-tecnico.md#p49--los-vínculos-de-la-vf18-que-no-son-checks-y-la-prioridad-de-una-brecha-sin-severidad) | Los vínculos de la VF18 que no son checks (módulos de la sonda y puntajes), y la prioridad de una brecha sin severidad | ⚠️ Doce pruebas cuyo Directo es un módulo o un puntaje; el mensaje de brecha (RC-18) | 2026-11-22 |
| [P50](catalogo-maestro.md#p50--quién-traduce-al-inglés-el-contenido-del-catálogo-v2) | Quién traduce al inglés el contenido del catálogo v2 | ⚠️ Mostrar el catálogo v2 en inglés (RC-21, DT-100) | 2026-11-22 |
| [P14](control-tecnico.md#p14--motores-de-evaluación-rol-de-cada-uno-y-cómo-se-relacionan-con-el-modelo) | Motores de evaluación: unidad de evaluación, conexión y legal (el rol de cada motor se cerró en D100; el SaaS y la carga del catálogo, en D129) | 🚧 El cálculo de cobertura en nube; no Cumplimiento | 2026-10-07 |
| [P2](empresas.md#p2--el-flujo-de-la-clave-de-acceso--5-detalles-sin-definir) | El flujo de la clave de acceso: 5 detalles sin definir (urgentes: a y c) | ⚠️ Condiciona la pantalla de canje (hoy hecha como código a mano, D51) | — |
| [P9](catalogo-maestro.md#p9--tipos-de-pérdida-de-un-riesgo-escritos-de-dos-formas-en-el-libro) | Tipos de pérdida de un riesgo escritos de dos formas en el libro | Los valores de `loss_type`; hoy se tratan como uno (decisión de desarrollo) | — |
| [P21](catalogo-maestro.md#p21--el-uso-de-los-logos-de-marcas-de-terceros) | El uso de los logos de marcas de terceros en el marketplace | ⚠️ Publicar el marketplace con logos a clientes reales; no bloquea construirlo | 2026-10-10 |
| [P26](cumplimiento.md#p26--quién-define-el-período-auditado-y-la-fecha-de-corte-de-una-evaluación) | Quién define el período auditado y la fecha de corte de una evaluación | 🚧 Respondida **provisionalmente** (D87, 2026-10-20): falta que el comité la ratifique (Tipo I, período siguiente, nombre) | 2026-10-14 |
| [P27](cumplimiento.md#p27--cómo-se-agrupan-los-controles-en-un-marco-sin-categorías) | Cómo se agrupan los controles en un marco sin categorías | 🚧 La agrupación de la lista de controles y del resumen para marcos distintos de SOC 2 | 2026-10-15 |
| [P33](cumplimiento.md#p33--advertencias-y-confirmación-al-editar-o-dar-de-baja-un-control-un-riesgo-o-una-causa) | Advertencias y confirmación al editar o dar de baja un control, un riesgo o una causa | ⚠️ Las pantallas de edición del administrador (D96); la API no espera | 2026-10-27 |
| [P35](roles-permisos.md#p35--la-calificación-del-auditor) | La calificación del auditor | No bloquea: LATER, según el Excel | 2026-10-27 |
| [P36](roles-permisos.md#p36--la-independencia-del-auditor-qué-ve-de-la-evidencia-y-cómo-se-crea-su-cuenta) | La independencia del auditor: qué ve de la evidencia y cómo se crea su cuenta | No bloquea: LATER (MD-183) | 2026-10-28 |
| [P37](cumplimiento.md#p37--criterios-de-las-observaciones-del-auditor-que-desarrollo-fijó-sin-que-el-comité-los-pidiera) | Criterios de las observaciones del auditor que desarrollo fijó sin que el comité los pidiera | No bloquea: está construido (MD-154) y funciona; se ajusta si el PO decide otra cosa | 2026-10-29 |
| [P13](empresas.md#p13--ratificar-lo-que-desarrollo-decidió-en-las-correcciones-del-2026-10-05-d50-d51) | Ratificar lo que desarrollo decidió el 2026-10-05 (D50, D51) | No bloquea: está construido y funcionando | 2026-10-06 |
| [P41](gestion-usuarios.md#p41--criterio-de-sin-ingreso-reciente-en-acceso-y-seguridad-de-cuentas-del-inicio) | Criterio de «sin ingreso reciente» en «Acceso y seguridad de cuentas» del Inicio | No bloquea: está construido de forma provisional (30 días) | 2026-11-10 |
| [P42](gestion-usuarios.md#p42--buscar-personas-y-ver-el-detalle-de-una-persona) | Buscar personas y ver el detalle de una persona | No bloquea: el buscador y una futura página de perfil; hoy hay filtros y un panel | 2026-11-10 |
| [P43](cumplimiento.md#p43--qué-muestra-lo-que-requiere-atención-del-inicio) | Qué muestra «Lo que requiere atención» del Inicio | No bloquea: ampliar el contrato del dashboard y esa tabla | 2026-11-10 |
| [P45](integraciones.md#p45--en-qué-categoría-de-activo-entra-github) | En qué categoría de activo entra GitHub | No bloquea: el flujo de conexión de GitHub | 2026-11-12 |
| [P46](integraciones.md#p46--qué-hace-la-integración-con-jira) | Qué hace la integración con Jira | No bloquea: Jira sigue `coming_soon` hasta responder (D110) | 2026-11-12 |
| [P47](gestion-usuarios.md#p47--qué-más-hace-admin_monkey-con-las-cuentas-y-las-empresas-mejoras-futuras-de-monkey-admin) | Qué más hace `admin_monkey` con las cuentas y las empresas (mejoras futuras de Monkey Admin) | No bloquea: ver el equipo de una empresa, soporte, exportar, más roles administrativos | 2026-11-13 |

---

---

## Dónde está cada ficha

**Un módulo, un archivo**, con los mismos nombres que [`arquitectura/`](../../arquitectura/README.md) (`STANDARD.md` §2b). Una pregunta que afecta a varios módulos vive en el que **posee la capacidad** por la que se pregunta.

| Archivo | Pendientes | Módulo |
|---|--:|---|
| [`empresas.md`](empresas.md) | 2 | [Empresas](../../arquitectura/empresas/README.md) |
| [`roles-permisos.md`](roles-permisos.md) | 2 | [Roles y permisos](../../arquitectura/roles-permisos/README.md) |
| [`catalogo-maestro.md`](catalogo-maestro.md) | 3 | [Catálogo maestro](../../arquitectura/catalogo-maestro/README.md) |
| [`control-tecnico.md`](control-tecnico.md) | 2 | [Control técnico](../../arquitectura/control-tecnico/README.md) |
| [`cumplimiento.md`](cumplimiento.md) | 6 | [Cumplimiento](../../arquitectura/cumplimiento/README.md) |
| [`notificaciones.md`](notificaciones.md) | 1 | [Notificaciones](../../arquitectura/notificaciones/README.md) |
| [`gestion-usuarios.md`](gestion-usuarios.md) | 3 | [Gestión de usuarios](../../arquitectura/gestion-usuarios/README.md) |
| [`integraciones.md`](integraciones.md) | 2 | [Integraciones](../../arquitectura/integraciones/README.md) |

---

## Cómo se cierra un pendiente

1. El comité responde.
2. La decisión se escribe en `datos/decisiones/README.md`, con la fuente y el porqué, y si
   cambia una tabla o el cálculo, se ajusta `modelo-datos.md`.
3. Se borra su ficha del archivo de su módulo y su fila del tablero.
4. Se cierra el ticket de Jira correspondiente en el proyecto `MD`, con la decisión y su
   fuente en un comentario.

## Cerradas hasta hoy

Se quedan aquí como referencia; el detalle de cada una está en la decisión que la cerró.

| | Pregunta | Cerrada |
|---|---|---|
| **P1** | Cumplimiento fuera del onboarding | 2026-09-26 — el comité confirmó D23: el onboarding se queda en 3 componentes |
| **P4** | `responsible_id` sin catálogo de cargos | 2026-09-29 — cerrada por desarrollo en D30: el cargo es `organization_responsibles`. **Falta ratificarla con el comité**; no bloquea nada |
| **P5** | Dos cifras de la documentación de la sonda | 2026-10-08 — las cifras («869 checks, 646 nativos, 223 inferidos») no tenían universo y se quitaron de `wazuh.md`; la versión de referencia es la del manager que corre en desarrollo, 4.14.6 (D55) |
| **P6** | La lista completa de `business_model` | 2026-10-10 — D73: son las 19 del Excel más `other`; si el comité entrega más, se agregan con una migración |
| **P7** | Dónde se aloja el Postgres de producción | 2026-10-10 — D72: servidor o servicio administrado separado de la app, con respaldos a un punto en el tiempo y rotación de 35 días (D97) |
| **P8** | ¿Un control que crea el cliente cuenta para el marco? | 2026-10-09 — D65: sí cuenta para el porcentaje; es solo documental, va en la categoría que elige el cliente y lo crea directo el `admin_empresa` (D96) |
| **P10** | Origen de `control_dimensions` y qué es `policies` | 2026-10-01 — cerrada por desarrollo en D39: la dimensión aplica si el control tiene una prueba de ella; `policies` es una plantilla. **Falta ratificar con el comité el tipo y las banderas derivados**; no bloquea nada |
| **P11** | El nombre del proveedor en los textos de las pruebas | 2026-10-10 — D70: el cliente ve el resultado y un nombre neutro que escribe Monkey; los textos del comité son internos |
| **P12** | Cómo se conecta Monkey a la sonda (paso 3 del control técnico) | 2026-10-10 — D71: lectura por la API con un usuario de solo lectura por grupo; solo se promete lo que tiene prueba; la IP de desarrollo es una acción de infraestructura |
| **P16** | Cuándo un activo está «Preparado», «Casi listo» o «Requiere trabajo» | 2026-10-09 — D62: se lee con el porcentaje de tests con resultado, con los cortes de 100% y 80% *(el semáforo se conserva en D68)* |
| **P17** | ¿El paso 3 del onboarding exige al menos una conexión comprobada? | 2026-10-10 — D69: no; se completa al definir dónde vive el servicio e «Inicio» invita a conectar |
| **P18** | Una categoría sin nada medido, y la cobertura | 2026-10-09 — D62: no está lograda y cuenta en el denominador; la cobertura es siempre un número aparte *(D68: una categoría sin nada medido queda «en evaluación» y no cumple; la cobertura sigue aparte)* |
| **P19** | Una persona que atiende a varias empresas, con el correo único | 2026-10-27 — D96: obsoleta; las cuentas pertenecen a una sola empresa |
| **P20** | Quién reactiva a quien la empresa suspendió | 2026-10-27 — D96: el `admin_empresa` desactiva y reactiva a su equipo (`contracts/gestion-usuarios.md`) |
| **P23** | Cómo se guarda y se muestra la evaluación del auditor | 2026-10-13 — D77: va aparte y no cambia el estado, ligada a la evaluación del servicio. En pausa por D96 (`P35`) |
| **P24** | Quién aprueba una exclusión | 2026-10-27 — D96: el `admin_empresa` la propone y la decide en un solo acto; no hay espera |
| **P25** | Si validar las evidencias de un test documental es lo mismo que dar su veredicto | 2026-10-22 — D88: una prueba documental se valida en su control con la evidencia que se sube para esa prueba; no hay un segundo paso de veredicto. Desde D96 la validación es del `admin_empresa` |
| **P28** | A quién contacta la empresa cuando una exclusión espera decisión | 2026-10-27 — D96: obsoleta; la exclusión no espera |
| **P31** | El Excel y el cerebro no coinciden en los roles | 2026-10-27 — D96: gana el Excel (cuatro roles; el `admin_empresa` valida la evidencia); la MFA sigue en los cuatro roles (D66) |
| **P29** | Cómo activa su cuenta quien la empresa invita | 2026-10-27 — D95, D96: un código de activación de un solo uso, ligado a su correo, que le entrega el `admin_empresa`; con él pone su contraseña y configura el segundo factor |
| **P30** | Dónde vive una cuenta y cómo se aísla entre empresas | 2026-10-27 — D96: cada cuenta pertenece a una sola empresa y el aislamiento es el de siempre (RLS por `tenant_id`); no hay cuentas que entren a varias empresas |
| **P38** | La cadena de asignación de controles | 2026-11-03 — D102: `admin_empresa` → `responsable` → `delegado`; el dueño es una persona y la unidad es el control completo |
| **P40** | Cuentas de Monkey Admin y seguridad de la gestión de usuarios | 2026-11-03 — D103: solo `admin_monkey`, con cupo de usuarios por empresa |
| **P3** | Qué ve y qué hace cada rol en cada pantalla de Cumplimiento | 2026-11-03 — D102: el comité no entregará el Excel por pantalla; manda la matriz de `modelo/05-usuarios.md` §5.5 |
| **P15** | Cómo se mapean los checks de nube que quedan fuera | 2026-11-22 — D129: solo cuentan los vínculos de `TEST_CHECKS` de la VF18, ratificados por el comité; lo que no está ahí no cuenta |
| **P22** | Motor de evaluación: lo que falta para calcular el riesgo | 2026-11-22 — D134 y D131: el efecto por relación ya no se usa (residual por cobertura), el apetito va por zonas de color y la periodicidad es una columna por control, configurable |
| **P34** | Quien sube la evidencia y quien la valida son la misma persona | 2026-11-22 — D132: si el `admin_empresa` es el responsable del control, su aprobación es la final (G-05) |
| **P44** | Qué checks de GitHub cuentan y a qué pruebas y controles van | 2026-11-22 — D129: los 34 vínculos de GitHub de `TEST_CHECKS` |
