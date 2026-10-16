# Modelo de datos — §9 El cálculo

> Parte de [`modelo-datos.md`](../modelo-datos.md) (índice). **Qué responde:** Cómo se deriva el cumplimiento: activo → test → control → categoría → marco, sus estados y sus reglas. **Léelo:** Antes de tocar cualquier cálculo, estado o pantalla de porcentaje.
> Los números de sección (§) se conservan: cualquier cita a «§9» apunta aquí.

## 9. Cómo se calcula el cumplimiento

Regla del **comité** (hoja `MODELO EVALUACIÓN MONKEY` y `REQUISITOS EVALUACIÓN MONKEY` de la VF2, D68). Ante una duda de cálculo, manda esta sección. **Reemplaza la
agregación de D62**: lo que se conserva y lo que cambia está en D68. Las reglas del comité se citan por su número (`RN-xx`, `REQ-xxx`) para poder volver al Excel.

### Los principios

1. **La ausencia de evidencia, de ejecución o de activos nunca es cumplimiento** (REQ-001, RN-25). Lo que no tiene datos queda `PENDIENTE`, `SIN ACTIVOS` o `SIN TESTS`.
2. **Todo o nada** (REQ-002): un solo incumplimiento confirmado impide el cumplimiento del nivel de arriba.
3. **El porcentaje informa, no decide** (REQ-003): el **avance** muestra el progreso y el **estado** dice si cumple. Un control con 4 de 5 tests cumplidos está al 80% y es `NO EFECTIVO`.
4. **Cobertura y conformidad son dos números** (RN-06): cuánto de lo aplicable ya se evaluó y cuánto de lo evaluado cumple. Nunca se muestran como uno.

### Los niveles

```
1. ACTIVO      un resultado por test: CUMPLE · NO CUMPLE · PENDIENTE · ERROR · EXCLUIDO                          (RN-05)
2. TEST        un estado por test, calculado de sus activos (automatizado) o de sus evidencias (documental)      (RN-06 a RN-11, RN-01 a RN-04)
3. CONTROL     EFECTIVO solo si todos sus tests obligatorios, vigentes y aplicables CUMPLEN y no le falta una dimensión   (RN-12 a RN-16)
4. CATEGORÍA   CUMPLE solo si todos sus controles aplicables son EFECTIVOS                                       (RN-17, RN-18)
5. MARCO       CUMPLE solo si todos los controles únicos de las categorías en alcance son EFECTIVOS            (RN-19)
```

Lateral, con las mismas reglas de «todo o nada»: **CAUSA** (`MITIGADA` solo si todos sus controles mitigantes obligatorios son efectivos, RN-20) y **RIESGO** (`MITIGADO` solo si todas
sus causas aplicables están mitigadas, RN-21). **La mitigación es distinta del nivel de riesgo que queda** (residual, más abajo).

**La dimensión** (documental, servidores, bases de datos, aplicación, nube) **ya no es un nivel con estado propio**: es el eje que dice sobre qué activos corre cada test (§2). Pero **sigue
siendo obligatoria**: una dimensión que el control exige y que se queda sin ningún test vigente deja al control `INCOMPLETO` (RN-14), nunca cumplido. Qué dimensiones exige un
control sale de la hoja `Controles Monkey` del comité (columnas L a P: con test = la exige, «NO APLICA» = no la exige, con su razón).

### Las reglas R-01 a R-12 de la fórmula anterior

Otros documentos citan estas reglas (las del Excel del 9 de octubre y de D62). Esto es lo que pasó con cada una:

| Regla anterior | Hoy |
|---|---|
| R-01 cumplimiento solo sobre el scope del servicio | **Se conserva** |
| R-02 cada control define sus dimensiones y activos | **Se conserva** (las dimensiones, de `Controles Monkey`) |
| R-03 manual: la evidencia sustenta, el consultor evalúa | **Se conserva**, junto a la evaluación del auditor (D77) |
| R-04 automático: la sonda entrega, Monkey interpreta | **Se conserva** (lectura de la sonda, más abajo) |
| R-05, R-06, R-08, R-09, R-10 (dimensión que cumple, solo se mide lo que tiene resultado, % del control, de la categoría y del marco) | **Reemplazadas** por las reglas de abajo (D68) |
| R-07 `not_applicable` se excluye | **Se conserva**: un test `NO APLICA` no cuenta para el control |
| R-11 mitigación, indicador separado | **Se conserva**, con sus estados (RN-20, RN-21) |
| R-12 riesgo residual, cálculo separado | **Se conserva** como principio; el cálculo es el de arriba (D75) |

### Los estados por nivel

Los valores y sus etiquetas están en `contracts/enums.md` («Estados de evaluación»). En lenguaje del comité:

| Nivel | Estados |
|---|---|
| Evidencia | CUMPLE · NO CUMPLE · PENDIENTE · EN REVISIÓN · EVIDENCIA VENCIDA · NO APLICA |
| Activo | CUMPLE · NO CUMPLE · PENDIENTE · ERROR · EXCLUIDO |
| Test | CUMPLE · NO CUMPLE · PENDIENTE · EN EVALUACIÓN · EN REVISIÓN · VENCIDO · ERROR · SIN ACTIVOS · NO APLICA · DESACTIVADO |
| Control | EFECTIVO · NO EFECTIVO · VENCIDO · ERROR · INCOMPLETO · EN EVALUACIÓN · SIN TESTS |
| Categoría y marco | CUMPLE · NO CUMPLE · EN EVALUACIÓN · SIN CONTROLES · FUERA DE ALCANCE |
| Causa | MITIGADA · NO MITIGADA · EN EVALUACIÓN · SIN CONTROLES |
| Riesgo | MITIGADO · NO MITIGADO · EN EVALUACIÓN · SIN CAUSAS |

Colores estándar (REQ-048): verde cumple · rojo no cumple · amarillo pendiente · naranja incompleto, error o vencido · gris no aplica o fuera de alcance.

### Las reglas

**Test automatizado** (RN-05 a RN-11): *aplicables* = totales − excluidos; *evaluados* = conformes + no conformes; *pendientes* = aplicables − conformes − no conformes − con error;
*cobertura* = evaluados / aplicables; *conformidad* = conformes / evaluados. El estado, **en este orden**:

| Si… | Estado |
|---|---|
| aplicables ≤ 0 | `SIN ACTIVOS` |
| hay algún no conforme (prevalece sobre error y pendientes) | `NO CUMPLE` |
| hay algún error técnico | `ERROR` |
| ninguno evaluado | `PENDIENTE` |
| faltan activos por evaluar | `EN EVALUACIÓN` |
| si no | `CUMPLE` — **solo con el 100% de los activos aplicables evaluados y conformes** |

Cuarenta y cinco de cincuenta conformes y cinco sin evaluar **no es CUMPLE**: es `EN EVALUACIÓN` (RN-10). Un activo excluido sale del universo aplicable (RN-05).

**Test documental** (RN-01 a RN-04, REQ-014 a REQ-018): admite varias evidencias; cada una se valida por **atributo** (tipo de documento, fecha dentro del período, vigencia, aprobación,
firma o autorización, contenido obligatorio). Algún atributo en «No» ⇒ `NO CUMPLE`; vigencia en «No» ⇒ `EVIDENCIA VENCIDA`; algún atributo vacío ⇒ `PENDIENTE`. **Solo una evidencia
validada por una persona puede ser `CUMPLE`**: la pre-validada por IA queda `EN REVISIÓN` (RN-03). El test documental agrega sus evidencias con la prioridad
`NO CUMPLE` > `VENCIDA` > `EN REVISIÓN` > `PENDIENTE` > `CUMPLE`; sin evidencias es `PENDIENTE`. Cada evidencia conserva origen, fecha, responsable, versión y hash, y una versión nueva
**no sobrescribe** la anterior.

**Relación control–test** (RN-12, REQ-019 a REQ-021): es N:M y lleva *obligatorio*, *vigente*, fecha de alta y de baja, y justificación. Un test no obligatorio, no vigente o `NO APLICA`
**no cuenta** para el control; desactivarlo exige justificación y deja rastro. **Agregar un test obligatorio nuevo** lo hace entrar `PENDIENTE` y puede volver no efectivo a un control que era efectivo.

**Control** (RN-14 a RN-16): *T* = sus tests obligatorios, vigentes y aplicables; *D* = las dimensiones que exige sin ningún test vigente. El estado, en este orden:
`SIN TESTS` (|T| + |D| = 0) · `NO EFECTIVO` (algún test no cumple) · `VENCIDO` · `ERROR` · `INCOMPLETO` (|D| > 0) · `EN EVALUACIÓN` (algo pendiente, en evaluación o en revisión) · `EFECTIVO`.
**Avance** = tests que cumplen / (|T| + |D|). Se informa junto con la lista de **los tests que impiden la efectividad** (REQ-026).

**Categoría** (RN-17, RN-18): `FUERA DE ALCANCE` si no está elegida (no afecta); `SIN CONTROLES` si no tiene; `NO CUMPLE` si algún control es `NO EFECTIVO` o `VENCIDO`; `EN EVALUACIÓN` si alguno
no es efectivo; `CUMPLE` si todos son efectivos. En SOC 2, **Seguridad (Criterios Comunes) siempre está en alcance**, aunque no se seleccione.

**Marco** (RN-19, REQ-030 a REQ-033): se evalúa sobre los **controles únicos** de las categorías en alcance: un control compartido entre categorías **cuenta una sola vez**. Mismo criterio que la categoría.
Reporta **cinco indicadores separados**: *avance* = efectivos / controles únicos, *cobertura* = (efectivos + no efectivos + vencidos) / controles únicos, el *estado*, la lista de controles incumplidos y la de
pendientes. El estado de un control se **reutiliza** entre marcos del mismo servicio cuando coinciden alcance, período y versión.

**La evaluación** (REQ-004, REQ-005): se define por **servicio + marco + versión + período auditado + fecha de corte**; sin esos cinco datos no se ejecuta ni se reutiliza un resultado. Solo se evalúan los
marcos **contratados** (D47) y las categorías en alcance. Un resultado se calcula **una vez** por test × servicio × período × versión y lo consumen todos los controles que usan ese test (RN-13).

**Exclusiones de activos** (REQ-008): excluir un activo exige **justificación, aprobador y vigencia**; sin los tres no se puede, y queda en el rastro. La propone la empresa y la aprueba el
consultor (D78). Cambia el denominador del test solo así: *un check que sale por omisión es un agujero*.

**Riesgo inherente** (RN-22): probabilidad × impacto (1 a 25): Bajo 1–4 · Moderado 5–9 · Alto 10–16 · Crítico 17–25.
**Riesgo residual** (RN-23, D75): para un riesgo, *Cp* son los controles únicos con efecto «probabilidad» vinculados a sus causas aplicables y *Ci* los de efecto «impacto». La reducción de la probabilidad es
`redondear hacia abajo(efectivos de Cp ÷ |Cp| × máximo de probabilidad)` (cero si no hay controles) y la del impacto es igual con *Ci*. El residual es `inherente − reducción`, **nunca menos de 1**, y su valor es probabilidad × impacto,
siempre menor o igual que el inherente. **Solo los controles efectivos reducen** (los pendientes reducen 0) y no se pondera por la solidez del control. Los parámetros son **configurables, nunca escritos en el código**:
máximo 2 puntos en probabilidad y 1 en impacto. El residual es **aceptable** si su valor es menor o igual que el **apetito**, cuyo valor inicial es 9 sobre 25 (RN-24). Los controles efectivos no implican un residual aceptable.
Por riesgo se muestra qué controles lo mitigan, cuáles reducen probabilidad y cuáles impacto, la reducción aplicada y si la lectura es *confirmada*, *provisional* o *con controles fallidos* (REQ-041). La **matriz inherente** (antes de aplicar controles) y la **matriz residual** (después) son el mapa de calor 5×5 con la posición de cada riesgo (REQ-042). **Son la lectura de la evolución, no el criterio de mitigación**: si un riesgo está mitigado lo dicen sus controles y sus tests (RN-20, RN-21, D76).
**Es vista del consultor y del auditor, no del cliente.** **No se construyen todavía** (MD-151, fuera del sprint): la relación causa→control ya está completa en el Excel (209 relaciones), pero falta el **efecto (probabilidad o impacto) y la obligatoriedad** de cada una, el comité entregará el detalle de la fórmula y la probabilidad y el impacto de cada riesgo los pone el cliente (`P22`, D76).

### El ejemplo resuelto

Los 8 casos del comité son la prueba del motor (REQ-051). Con 50 servidores aplicables:

| Caso | Situación | Estado del test |
|---|---|---|
| C1 | 45 conformes, 5 no conformes | `NO CUMPLE` (conformidad 90%) |
| C2 | 45 conformes y 5 sin evaluar | `EN EVALUACIÓN` (cobertura 90%) |
| C3 | 50 de 50 conformes | `CUMPLE` |
| C4 | 48 conformes y 2 con error técnico | `ERROR` |
| C5 | 3 excluidos autorizados y 47 conformes | `CUMPLE` |
| C6 | sin activos aplicables | `SIN ACTIVOS` |
| C7 | ninguno evaluado | `PENDIENTE` |
| C8 | 45 conformes, 3 no conformes, 2 con error | `NO CUMPLE` (prevalece el incumplimiento) |

Hacia arriba: un control con 4 de 5 tests cumplidos está al **80% y es `NO EFECTIVO`**; una categoría con 19 de 20 controles efectivos, al **95% y `NO CUMPLE`**; un marco con una categoría que no cumple, `NO CUMPLE`.
Una causa con 1 de 3 controles no efectivo es `NO MITIGADA` y un riesgo con 1 de 3 causas no mitigadas es `NO MITIGADO`. Corregir todos los activos recupera el cumplimiento; **un único activo** que vuelva a fallar,
o quede pendiente o en error, vuelve a romperlo. Las simulaciones 1 a 6 y las validaciones V01 a V15 de la hoja son también casos de aceptación.

### Lo que estas reglas zanjan

- **El cumplimiento es binario en cada nivel** y el avance es el diagnóstico. Una categoría al 95% está fallando; la certificación existe solo cuando todo cumple.
- **Lo pendiente bloquea.** Lo sin medir no se ignora ni se da por cumplido: mantiene al nivel en `EN EVALUACIÓN`. La cobertura se muestra al lado, siempre.
- **Los controles propios del cliente cuentan** (§7.1).
- **Peso igual** en todos los niveles: un control vale lo mismo que otro y no se pondera por riesgo ni por número de activos (B1, D2).
- **No hay porcentaje de la empresa.** La unidad es el par **(servicio × marco)**; con 3 servicios con SOC 2 hay 3 resultados y ninguno se promedia con otro. **La interfaz nunca muestra un
  número único de «cumplimiento de la empresa»: no existe.**
- **El requisito es binario** (B2): se cumple cuando todos sus controles cumplen. Sirve para la trazabilidad y el reporte del auditor; **no participa del avance**.
- **El error técnico no es un incumplimiento.** Un activo con `ERROR` deja al test en `ERROR` hasta una reejecución exitosa; no se convierte en cumplido (RN-09). **Se reintenta al menos tres veces**; si al tercero sigue fallando, queda en `ERROR` y **se avisa para revisión** (D76). Una corrida que **no llegó** a la cuenta
  del cliente (D57) no guarda resultados: ese cumplimiento sigue `PENDIENTE`. En la lectura de la sonda: `passed` → `CUMPLE`, `failed` → `NO CUMPLE`, `invalid` → `ERROR`, `not_run` → `PENDIENTE`.

### Qué ve cada rol, y el semáforo

Los estados de arriba (efectivo, incompleto, vencido…) y las listas de controles son **la vista técnica**: es la pantalla de los roles `auditor` y `consultor` y, desde D81, también la pide `admin_empresa` (mientras `P3` siga abierta). **El cliente** (`admin_empresa`, `funcional`)
ve por defecto la vista de negocio (REQ-049): el semáforo cualitativo primero, y en qué falla y su avance (`philosophy.md`).

| Semáforo | Cuándo (sobre el avance del nivel) |
|---|---|
| **Preparado** | el estado es `CUMPLE`/`EFECTIVO` y **no hay nada pendiente** |
| **Casi listo** | avance de 80% a menos de 100%, o todo lo medido cumple pero algo sigue pendiente |
| **Requiere trabajo** | avance menor de 80% |
| **Sin medir** | no hay nada con resultado todavía: es un hueco de cobertura, no un fallo |

Un activo se lee con la misma regla sobre sus tests con resultado cumplidos / sus tests con resultado (el comité no lo define; sigue la lectura de D62, `DT-66`).
**La cobertura va siempre al lado del avance**, como número aparte: «100% de lo medido · cobertura 40%» nunca se presenta como Preparado.

### La evaluación del consultor y la del auditor

El cálculo de Monkey no es el único veredicto. **El consultor y el auditor hacen cada uno una evaluación del cumplimiento sobre los mismos datos, con distinto enfoque:** el **consultor prepara** a la empresa
(le dice qué le falta) y el **auditor certifica**, de forma independiente. El Excel del comité no las contempla: donde dice «validada por auditor» (RN-03) se entiende **«validada por una persona»**.
Hoy el consultor da el veredicto de los tests documentales y manuales (§7.5, R-03) y el auditor escribe observaciones (§7.6). **Cada uno emite la suya en `framework_assessments` (§7.5, D77), ligada a la evaluación del servicio, y se muestra al lado del estado calculado sin cambiarlo.** El consultor da además un veredicto general («lista» o «no lista para la auditoría»); el del auditor es su opinión y certifica.
Qué ve el cliente de ellas queda en `P3`.

### Cómo se guarda

El cumplimiento de un marco **se deriva** recorriendo requisitos → controles y **nunca se almacena como atributo del marco**. El comité pide recálculo incremental por eventos y un rastro de cada cambio
de estado (REQ-043, REQ-044): se cumple con el historial inmutable de evaluaciones y de eventos (§7.4); lo que el motor materialice es un registro de **esa evaluación en esa fecha**, reconstruible, no una columna del marco.

### La trazabilidad de una falla

Modelo de navegación del producto, con **responsable y tratamiento en cada nivel**. Es lo que se le muestra a `admin_empresa` y `funcional` (en qué falla y su avance); los códigos técnicos solo los ve el auditor (D63):

| Nivel | Lleva a | Responsable | Tratamiento |
|---|---|---|---|
| Test → Activo | el control | Responsable del activo | Tratamiento |
| **Control** | la categoría | Responsable parametrizado | **Plan de acción** |
| Categoría → Marco del servicio | — | Responsable de cumplimiento | Seguimiento |
| **Causa → Riesgo** | el servicio | Responsable de riesgo | **Mitigación / riesgo residual** |

### Cuánto se puede automatizar hoy

De los 61 TEST: **13 tienen checks automáticos**. Los **26 documentales** no los tendrán nunca (son revisión con IA) y los **11 de nube no tienen ninguno** todavía (decisión D13).
`T-SRV-001` concentra 10.909 de los 11.352 checks. **El avance se lee siempre junto a la cobertura** (qué parte ya tiene resultado). El comité señala además que **no existe un test de redes**
(2.181 checks de red están asignados a `T-SRV-001`, y no hay plataformas de dispositivos de red).

> El cumplimiento del marco se **deriva** recorriendo requisitos → controles; nunca se almacena como columna del marco.

---
