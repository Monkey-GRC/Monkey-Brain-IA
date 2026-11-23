# Motor · Las reglas, nivel por nivel

> **VF18 (D128): esto describe el código construido con el catálogo v1.** Las reglas del motor v2 están en [§9](../../../datos/modelo/09-calculo-cumplimiento.md) (D130): estos archivos se reescriben con RC-06; la agregación por categoría y marco y el semáforo se conservan.

Responde: **¿qué decide exactamente cada estado?** Lee antes [`README.md`](README.md) (la cadena y los cinco
principios). Cada tabla se lee de arriba abajo: **gana la primera fila que aplique**.

## Nivel 1a · Una prueba automatizada (`automated-test.ts`)

Entrada: el resultado de cada activo del universo de la prueba. Salida: el estado de la prueba.

| Lo que pasa con los activos | Estado de la prueba |
|---|---|
| No quedan activos aplicables | `no_assets` |
| Hay alguno que no cumple | `non_compliant` (prevalece sobre todo) |
| No hay ninguno que no cumpla, pero hay errores técnicos | `error` |
| Nadie se ha evaluado todavía | `pending` |
| Unos se evaluaron y otros faltan | `evaluating` |
| Todos los aplicables evaluados y conformes | `compliant` |

Además calcula dos números que van **siempre aparte del estado**: **cobertura** = evaluados / aplicables («cuánto se
midió») y **conformidad** = conformes / evaluados («de lo medido, cuánto cumple»).

Los activos `excluded` (una exclusión aprobada y vigente) y `not_applicable` salen del universo: no suman ni restan.

## Nivel 1b · Una prueba documental (`documentary-test.ts`)

Aquí no hay activos sino **evidencias**. Primero se evalúa cada evidencia y luego se agrupan.

**Una evidencia** (`evaluateEvidence`) mira seis atributos que pone la persona que revisa: tipo, período, aprobación,
firma, contenido y vigencia. Cada uno es sí / no / sin valorar.

| Si… | Estado de la evidencia |
|---|---|
| Algún atributo de tipo, período, aprobación, firma o contenido es «no» | `non_compliant` |
| La vigencia es «no» | `expired` (vencida no es lo mismo que incorrecta) |
| Falta valorar algún atributo | `pending` |
| Todo «sí» y la **revisó una persona** | `compliant` |
| Todo «sí» pero solo la pre-validó la IA | `in_review` |
| Todo «sí» y no la ha revisado nadie | `pending` |

Esa última fila es la regla de producto «la IA nunca certifica»: **solo una persona puede dejar una evidencia en
`compliant`**.

**Una prueba documental** toma el estado de sus evidencias con esta prioridad: `non_compliant` > `expired` >
`in_review` > `pending` > `compliant`. Sin evidencias: `pending`.

## Nivel 2 · Un control (`control.ts`)

Entrada: el estado de cada una de sus pruebas, más cuántas dimensiones exige el control y se quedan sin ninguna
prueba (`missingDimensions`). Cuentan solo las pruebas obligatorias y vigentes que no sean `not_applicable` ni
`deactivated`.

| # | Condición | Estado del control |
|---|---|---|
| 1 | Nada que medir | `no_tests` |
| 2 | Alguna prueba no cumple | `ineffective` |
| 3 | Alguna prueba vencida | `expired` |
| 4 | Alguna prueba con error | `error` |
| 5 | Falta una dimensión sin prueba | `incomplete` |
| 6 | Alguna prueba no cumple *todavía* (pendiente, evaluando, en revisión…) | `evaluating` |
| 7 | Todas las pruebas que cuentan cumplen | `effective` |

También devuelve el **avance** (pruebas que cumplen / pruebas que cuentan + dimensiones faltantes) y la lista de
**pruebas que lo bloquean** (`blockingTests`), que es lo que la pantalla usa para decir «qué falta».

## El semáforo de un control (`control-readout.ts` → `readinessOf`)

El estado anterior (`effective`, `ineffective`…) es para la vista técnica. Para el usuario de negocio hay un
semáforo de cuatro valores que se calcula **sobre el estado y el avance**:

| Semáforo | Cuándo |
|---|---|
| **Sin medir** | No hay pruebas, o ninguna tiene resultado todavía. Es un hueco de cobertura, no un fallo. |
| **Preparado** | El control es efectivo. |
| **Casi listo** | Nada falla pero algo está pendiente; o algo falla pero el avance ya es del 80 % o más. |
| **Requiere trabajo** | Hay pruebas que fallan y el avance es menor del 80 %. |

Por eso el producto muestra **estado y porcentaje juntos**: un control puede estar al 50 % y ser «Casi listo» (lo
poco que se midió cumple y el resto está pendiente), o al 50 % y «Requiere trabajo» (la mitad falla). El número solo
no lo distingue.

## Niveles 3 y 4 · Categoría y marco (`rollup.ts`)

La regla es la misma para los dos: miran el estado de los controles que contienen.

| Si… | Estado |
|---|---|
| No hay controles | `no_controls` |
| Algún control no efectivo o vencido | `non_compliant` |
| Ninguno falla, pero alguno todavía no es efectivo (pendiente, en evaluación, con error…) | `evaluating` |
| Todos efectivos | `compliant` |

Dos detalles que importan:

- **Un control compartido cuenta una vez.** Un mismo control puede servir a varias categorías o requisitos. El marco
  se evalúa sobre los controles **únicos**. Si el mismo control llegara con dos estados distintos en la misma
  evaluación, el motor lanza un error: es un bug de quien llama, no un dato.
- **Una categoría fuera del alcance no cuenta.** En SOC 2, Seguridad es obligatoria y las demás solo si el servicio
  las eligió (dato del catálogo, no del código).

Para el marco calcula además `progress` (efectivos / únicos) y `coverage` ((efectivos + no efectivos + vencidos) /
únicos, es decir, cuánto ya **se pudo decidir**), y dos listas: los controles que **fallan** y los que **faltan por decidir**.

## Ejemplo con números

Un servicio inventado, «Portal de pagos», con SOC 2. Un control con **dos pruebas**: una automática sobre 3
servidores y una documental (una política).

| Momento | Servidores | Documento | Prueba automática | Prueba documental | **Control** | Avance | Semáforo |
|---|---|---|---|---|---|---|---|
| 1 | S1 ✓, S2 ✓, S3 sin ejecutar | validado por una persona | `evaluating` (cobertura 67 %) | `compliant` | `evaluating` | 1 de 2 = 50 % | **Casi listo** |
| 2 | S1 ✓, S2 ✓, S3 ✗ | igual | `non_compliant` | `compliant` | `ineffective` | 1 de 2 = 50 % | **Requiere trabajo** |
| 3 | S1 ✓, S2 ✓, S3 corregido ✓ | igual | `compliant` | `compliant` | `effective` | 2 de 2 = 100 % | **Preparado** |
| 4 | igual al 3 | **nueva versión** sin revisar | `compliant` | `pending` | `evaluating` | 1 de 2 = 50 % | **Casi listo** |

Mira los **momentos 1 y 2**: el avance es el mismo (50 %) pero el semáforo cambia, porque en uno nada falla y en el
otro algo falla. Y mira el **momento 4**: subir un documento nuevo **devuelve el control a revisión** aunque el
anterior estuviera validado, porque el estado de una evidencia es el de su entrega **más reciente**.

Ahora la categoría Seguridad con tres controles: uno `effective`, uno `evaluating` y uno `ineffective`:

- Categoría: `non_compliant` (hay uno no efectivo). Avance 1 de 3.
- Marco (suponiendo que son todos): `non_compliant`; `coverage` = (1 efectivo + 1 no efectivo) / 3 = 2 de 3 decidido;
  `failing` = el no efectivo; `pending` = el que está evaluando.

## Una puerta que no es del motor

Antes de calcular un marco, `buildOverview` revisa si el servicio **definió el período auditado**. Si no, el marco
queda en `not_measured` y no se inventa ningún resultado (REQ-004, D87). Es una regla del resumen, no del motor:
[`../resumen/README.md`](../resumen/README.md).

## Cómo verificarlo

`domain/engine/*.spec.ts`, en especial `engine.acceptance.spec.ts`.
