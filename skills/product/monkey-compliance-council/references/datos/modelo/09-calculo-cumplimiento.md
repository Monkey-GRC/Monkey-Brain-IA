# Modelo de datos — §9 El cálculo

> Parte de [`modelo-datos.md`](../modelo-datos.md) (índice). **Qué responde:** Cómo se deriva el cumplimiento: activo → check → evidencia → test → requisito del control → control → categoría → marco, y cómo se evalúa el riesgo. **Léelo:** Antes de tocar cualquier cálculo, estado o pantalla de porcentaje.
> Los números de sección (§) se conservan: cualquier cita a «§9» apunta aquí.

## 9. Cómo se calcula el cumplimiento

Regla del **comité**: la hoja `MAP CALOR` de la VF18 (secciones 2 a 14), D128 y D130. Ante una duda de cálculo, manda esta sección; ante una diferencia con el libro, manda el libro. Las reglas se citan por su código del libro para poder volver a él: estados por nivel (§3.x del libro), reglas de prueba `T-01` a `T-07`, nivel del control `R1` a `R6`, suficiencia `S-01` a `S-05`, parámetros `PR-01` a `PR-16`, gestión `G-01` a `G-11` y documentos `D-01` a `D-15`. Las reglas `RN-xx` y `REQ-xxx` de la VF2 valen **solo donde no contradicen** a `MAP CALOR` (tabla 5 de `01_DESARROLLO`); lo que se conserva de ellas está dicho abajo. Lo que el libro no definía o donde se contradecía lo cerró D140.

### Los principios (`00_LEEME`, P1 a P7)

1. **Dos evaluaciones con la misma información**: el cumplimiento de cada control (¿cumple al 100%?) y la mitigación de los riesgos del servicio (inherente frente a residual). **La evaluación de cumplimiento termina en el control**; la categoría y el marco se agregan encima (DEV-16).
2. **La unidad de cumplimiento es el control**, y es transversal: responde a varios puntos de enfoque y criterios de SOC 2 y, en el futuro, a requisitos de otros marcos (`MAPEO_MARCOS`). Una evidencia se carga una vez y sirve en todos los marcos donde el control aplica.
3. **Lo mínimo que se prueba de un control son sus requisitos** (los puntos de la columna L de `Controles Monkey`). Cada requisito está probado por al menos un test.
4. **Nada se da por cumplido sin evidencia vigente.** La ausencia de datos, una recolección fallida o una evidencia vencida nunca equivalen a PASS ni a «Correcto» (RN-25 se conserva).
5. **En lo técnico solo deciden los checks Directos** aplicables a la infraestructura del cliente. Los Complementarios generan observaciones; los de Dependencia toman la conclusión del control dueño y no se vuelven a ejecutar.
6. **El objetivo es el 100%** por control: todos los requisitos aplicables cumplidos, en todos los activos en alcance, con evidencia vigente en cada ventana del período.
7. **La escala es interna de Monkey** (preparación, *readiness*) y no reemplaza la opinión del auditor SOC 2.

Y dos que ya regían y siguen: **el porcentaje informa, el estado decide** (un control al 80% no cumple), y **la unidad de medida es el par servicio × marco**: no existe un porcentaje de la empresa.

### La cadena

| Evaluación | Cadena |
|---|---|
| Cumplimiento | Activo → check (por activo), caso de muestra o documento → evidencia → test → **requisito del control** → control (fin de la cadena) → categoría → marco |
| Riesgo | Control (su nivel) → causa → riesgo → posición inherente y residual en la matriz |

El **requisito del control** (`control_requirements`, D129) es cada punto de la columna L: no confundir con el requisito del marco (`requirements`, `CC6.1`), que sirve para trazar y reportar.

### Los estados por nivel (§3 del libro)

Los valores y sus etiquetas viven en `contracts/enums/cumplimiento.md`.

**Evidencia.**

| Tipo | Estados | Cuenta para el test cuando… |
|---|---|---|
| Manual (la carga el delegado o el responsable) | Cargada → Vigente → Vencida; Devuelta (con motivo) si el responsable o el administrador rechaza el cumplimiento por ella | La cargó el delegado o el responsable del control, está dentro de su ventana de vigencia y no está devuelta. El cumplimiento del control exige además las aprobaciones de D132 |
| Automática (integración, sonda, motor de nube) | Recibida → Normalizada → Vinculada, Incompleta o Desactualizada | Está vinculada, completa y su fecha está dentro de la frescura (PR-05, 24 h) |

**Check técnico, por activo.**

| Estado | Significado | Efecto |
|---|---|---|
| PASS | El activo cumple la condición del check | Suma al test |
| FAIL | No cumple y no tiene excepción aprobada | Si el check es Directo, excepción del test; si es Complementario, observación |
| FAIL con excepción aprobada | Hay una excepción formal vigente (D135) | Cuenta como PASS mientras esté vigente; se muestra marcado |
| No aplica | La plataforma o la política del check no existe en el alcance del cliente | No entra en el cálculo |
| Sin datos | Debería aplicar y no hay resultado (activo sin agente o sin conexión, recolección fallida, permisos) | Nunca es PASS: el test queda pendiente mientras la ventana está abierta y en excepción de cobertura al cerrarla (D140) |

De la lectura de los motores: `passed` → PASS · `failed` → FAIL (o FAIL con excepción, si la hay) · `not_applicable` → No aplica · `not_run` → Sin datos. **El error técnico se conserva** (DEV-16): un resultado `invalid` se reintenta al menos tres veces y, si sigue fallando, se avisa para revisión (D76); mientras tanto el check está **Sin datos**. Una corrida que no llegó a la cuenta del cliente (D57) no guarda resultados.

**Test.**

| Estado | Regla |
|---|---|
| Pendiente | No tiene evidencia suficiente en la ventana actual |
| Correcto | Se cumple su criterio «Correcto si» (hoja `TEST`) con evidencia vigente |
| Observación | Se cumple el objetivo, pero se da su criterio «Observación si» o falla un check Complementario |
| Excepción | Se da su criterio «Excepción si», falla un check Directo sin excepción aprobada o hay una brecha de cobertura de activos |
| No aplica | No corresponde al alcance del cliente; exige justificación escrita aprobada por el `admin_empresa` (D135) |
| Vencido | Tenía evidencia y terminó su ventana sin una nueva válida |

**Requisito del control.**

| Estado | Regla |
|---|---|
| Cumple | Todos sus tests están en Correcto u Observación, y vigentes |
| No cumple | Al menos un test está en Excepción |
| Pendiente | Al menos un test está Pendiente y ninguno en Excepción |
| Vencido | Al menos un test está Vencido |
| No aplica | Todos sus tests están en No aplica, con la justificación aprobada |

### Las reglas por tipo de test (§4 del libro)

| Regla | Tipo | Qué se exige |
|---|---|---|
| T-01 | Documental (`T-DOC`, `PE-DOC-01`) | El documento está Vigente en Monkey (o Aprobado con la aceptación en plazo), aprobado por todos los aprobadores de su flujo, dentro de su periodicidad de revisión, con todo su contenido mínimo, aceptado por los usuarios asignados y coherente con lo que muestran los demás tests (D133). Falta de aprobación, vencimiento o un elemento del contenido mínimo: Excepción. Aceptación incompleta fuera de plazo: Observación |
| T-02 | Población (`PE-POB-01`) | La población del período (inventario de activos de ACT-3, usuarios, cambios…) está completa y conciliada con la fuente. **Una población incompleta invalida los tests de muestra y técnicos que dependen de ella** |
| T-03 | Operativo (`PE-MUE-01`) | Se revisa la muestra de «Frecuencia / muestra». Cualquier caso que no cumpla es excepción. **Monkey no aplica tolerancias**: si se amplía la muestra, todos los casos adicionales deben cumplir |
| T-04 | Técnico (`PE-TEC-01`) | (a) Solo los checks **Directos** que aplican a las plataformas y políticas del cliente. (b) Cobertura de activos = activos en alcance con resultado ÷ activos en alcance; debe ser 100% (PR-03). (c) Correcto = 100% de cobertura y 100% de Directos en PASS (o FAIL con excepción). (d) Excepción = un Directo en FAIL sin excepción, o un activo en alcance sin resultado. (e) Observación = solo fallan Complementarios |
| T-05 | Técnico sin check aplicable | Si un requisito técnico no tiene ningún Directo aplicable a la infraestructura del cliente, **no pasa a No aplica**: se prueba con `PE-TEC-02` (técnico manual: exportación de configuración o consulta, con su evidencia) |
| T-06 | Dependencia | El test toma la conclusión del test dueño (el control del «Objetivo común», p. ej. «dueño CIF-3»), con su fecha, sin reejecutarse. Si el dueño está en Excepción, el dependiente también. Si dos pruebas dependen una de la otra, comparten estado: el peor entre los checks propios de las dos (D163, `P51`) |
| T-07 | Integración (`PE-INT-01`) | La evidencia de una integración (identidad, RR. HH., ticketing, MDM…) cuenta solo si está completa para el período y vinculada al test. Si la integración falla, el test queda Pendiente, nunca Correcto |

**Cómo se aplican T-04 y T-05 (D160, decisión de desarrollo por ratificar, `P14`).** (a) «Las plataformas del cliente» son sus conexiones: una evaluación de nube decide toda prueba de Nube, Aplicación, BD o Servidores que tenga Directos de **esa** plataforma, sea cual sea su dimensión. (b) Los «activos en alcance» de una prueba son los de su tipo con conexión propia y cualquier otro activo del servicio en el que una evaluación automática midió esa prueba; cada recurso que el servicio eligió (D61) es un activo con su propio resultado. (c) Una prueba **Semiautomática** (columna «Automatización») no es Correcta solo con sus checks: necesita además el resultado que registra el responsable; un Directo en FAIL sigue siendo Excepción. Endpoint y Red no se evalúan con checks todavía (`DT-135`).

### El control: porcentaje y nivel (§5 del libro)

**C% del control** = requisitos en Cumple ÷ requisitos aplicables × 100. Los requisitos en No aplica, con su justificación aprobada, salen del denominador. Primero se comprueba **No evaluado** (ningún requisito tiene evidencia todavía); si no, se asigna el primer nivel cuya regla se cumpla, en este orden: Sólido, Adecuado, Parcial, Débil, Ineficaz.

| Nivel | Valor | Regla | ¿Cumple? |
|---|---|---|---|
| No evaluado | 0 | Ningún requisito tiene evidencia todavía (estado inicial) | No |
| Ineficaz | 1 | C% < 40% (PR-02), o no hay ninguna ejecución válida del control en el período | No |
| Débil | 2 | 40% ≤ C% < 75% (PR-01), o el documento base del control falta, está vencido o no está aprobado (tope R2) | No |
| Parcial | 3 | 75% ≤ C% < 100%, el documento base aprobado y vigente, y **un plan de remediación aprobado y vigente por cada excepción** (MD-529): una prueba en Excepción de un requisito aplicable sin su plan deja el nivel en Débil | No |
| Adecuado | 4 | C% = 100%: todos los requisitos cumplen y están vigentes; puede tener observaciones | **Sí** |
| Sólido | 5 | Adecuado, sin observaciones, con 100% de cobertura de activos y evidencia en todas las ventanas del período (o evidencia automática continua) | **Sí** |

- **R1.** Un check Directo en FAIL es excepción; uno Complementario en FAIL, observación.
- **R2.** El test documental no sube el nivel por sí solo, pero si el documento base falta, está vencido o no está aprobado, **el nivel máximo es Débil**.
- **R3.** La escala es interna de Monkey; no reemplaza la opinión del auditor.
- **R4.** **Un control cumple solo en Adecuado o Sólido.** Cualquier requisito Pendiente, Vencido o No cumple impide el 100%. El cumplimiento es definitivo solo con la aprobación final (D132).
- **R5.** El evaluador puede cambiar el nivel sugerido solo con justificación escrita y aprobación del `admin_empresa`; Monkey guarda los dos, el sugerido y el final (el evaluador es el responsable del control, D140). **Construido (MD-529):** el nivel final **reemplaza** al sugerido en `complies`, el estado de gestión, el rollup de categoría y marco y la cobertura del riesgo. Se puede bajar libremente y moverse dentro del mismo lado (1–3 «no cumple», 4–5 «cumple»), pero nunca cruzar de no cumple a cumple sin el 100 % del motor (R4); bajar de cumple a no cumple le quita las aprobaciones al control. La corrección deja de valer si cambia el nivel sugerido o empieza una ventana nueva del control. Un plan de remediación es de una excepción (una prueba en Excepción) y lo registra quien lleva el control y aprueba el `admin_empresa`.
- **R6.** Dos vistas del mismo control: **a la fecha** (la última ventana) y **del período** (todas las ventanas del período auditado). El período cumple solo si cada ventana tuvo evidencia válida. **En la vista del período, la corrección aprobada (R5) solo puede bajar el nivel de su ventana; nunca lo sube** (el nivel del período es el peor entre el calculado y el corregido; MD-529).

**El avance de un control es su C%**, y se muestra junto al nivel y a la lista de requisitos que impiden el 100% (REQ-026 se conserva).

### La suficiencia de la prueba técnica (§9 del libro)

Los checks prueban **solo los requisitos técnicos** («Verificaciones automáticas…»); nunca reemplazan un requisito documental u operativo.

| Regla | Cuándo | Qué hace Monkey |
|---|---|---|
| S-01 Técnico suficiente | El control solo tiene requisitos técnicos y sus Directos aplicables cubren todo el objetivo en todas sus dimensiones | Los Directos deciden el control; no pide carga manual |
| S-02 Técnico + manual | Tiene requisitos técnicos y otros documentales u operativos | Los checks deciden solo el requisito técnico; los demás exigen su evidencia |
| S-03 Técnico parcial | Los Directos cubren solo parte de los activos o de las dimensiones | El requisito técnico queda Pendiente hasta completarlo con `PE-TEC-02` |
| S-04 Complementarios | El control tiene checks Complementarios | No dan OK solos ni reemplazan un Directo; si fallan, observación; si pasan, evidencia de apoyo |
| S-05 Solo manual | No tiene requisitos técnicos | Se evalúa con documentos, poblaciones y muestras |

En el catálogo v2: de 114 controles, **47 tienen requisitos técnicos y todos llevan además requisitos documentales u operativos (S-02)**; los otros 67 son solo manuales (S-05). Ninguno es S-01. 117 de las 154 pruebas técnicas tienen checks vinculados; el resto se prueba a mano (T-05).

### Vigencia y vencimiento (§6 del libro, D131)

Cada control se evalúa por **ventanas de calendario** según su periodicidad (la sugerida en la columna X o la que configure el `admin_empresa` con justificación, G-10). Al cerrar una ventana sin evidencia: test → Vencido, requisito → Vencido, el control baja de nivel y vuelve a **Incumplimiento**, con alerta al delegado, al responsable y al administrador.

| Periodicidad | Ventana | Alerta previa (PR-06) | Al cerrar sin evidencia |
|---|---|---|---|
| Diario · Semanal · Mensual · Bimensual | Día · semana · mes · bimestre calendario | El mismo día · 2 · 5 · 10 días antes | Vencido |
| Trimestral · Semestral | Trimestre (ene–mar…) · semestre calendario | 15 · 20 días antes | Vencido |
| Anual | 12 meses desde la última ejecución (D140) | 30 días antes | Vencido |
| Permanente | Continua: resultados automáticos con frescura ≤ PR-05; lo manual del control, con la periodicidad de su documento | Cuando la última recolección supera PR-05 | Evidencia → Desactualizada; test → Pendiente |
| Cuando sea requerido | Por evento: evidencia de cada evento (ocurrencia) del período, o una declaración trimestral de «sin ocurrencias» del responsable. **Se mide por trimestre de calendario** (MD-529; solo las pruebas que no son documentales: la documental se decide con su documento): abierto y sin nada o con una ocurrencia sin evidencia, Pendiente; cerrado con una ocurrencia sin evidencia, Excepción, y sin ocurrencias ni declaración, Vencido; con la declaración y ninguna ocurrencia, Correcto | 15 días antes del cierre del trimestre | Evento sin evidencia → Excepción; sin declaración → Vencido |

**«No aplica»** (D135, MD-529): un requisito que el responsable pide y el `admin_empresa` aprueba sale del denominador del C% y de lo que impide el 100 %; es revertible por quien lleva el control, y no se puede dejar sin ningún requisito aplicable. En la vista del período (R6) cada ventana cerrada lee el historial de resultados manuales (`manual_test_results`) y, en un requisito «cuando sea requerido», sus trimestres con sus ocurrencias y declaraciones.

**El período auditado** (G-11) se configura por servicio y marco y en SOC 2 dura **como mínimo 6 meses** (PR-16): solo cuentan las ventanas que caen dentro, y una evidencia fechada fuera no cuenta. La fecha de corte sigue siendo «hoy» (D105). Cada período es una fila con su histórico; al terminar, una tarea diaria abre el siguiente con la misma duración (D145, D148). La periodicidad la cambia el `admin_empresa` por control, para todos sus requisitos (D147); los avisos previos de PR-06 salen como fecha (`alert_at`) y los envía el sistema de notificaciones (MD-515).

### La gestión del control (§14 del libro, D132)

Sobre el nivel calculado corre la **gestión**: Incumplimiento → En gestión → Cumple – por aprobar → Aprobado por el responsable → **Cumplimiento aprobado**; Devuelto vuelve a En gestión. **Solo «Cumplimiento aprobado» cuenta como cumplido.** Monkey nunca aprueba: lo hacen el responsable y, al final, el `admin_empresa` (o solo él, si es el responsable). Si un check Directo pasa a FAIL o la evidencia automática se desactualiza, el control vuelve a Incumplimiento (G-07).

### Categoría y marco (se conservan, DEV-16)

La agregación de la VF2 se conserva (RN-17 a RN-19), con el control del modelo nuevo como entrada (D130):

- **Categoría**: `FUERA DE ALCANCE` si no está elegida; `SIN CONTROLES` si no tiene; `CUMPLE` si todos sus controles aplicables están en **Cumplimiento aprobado**; `NO CUMPLE` si alguno tiene un requisito en No cumple o Vencido; si no, `EN EVALUACIÓN`. En SOC 2, **Seguridad (Criterios Comunes) siempre está en alcance**.
- **Marco**: se evalúa sobre los **controles únicos** de las categorías en alcance (un control compartido cuenta una vez), con el mismo criterio. Informa por separado el avance (controles aprobados ÷ controles únicos), la cobertura, el estado y las listas de incumplidos y pendientes.
- **La evaluación** se define por servicio + marco + versión del catálogo + período auditado + fecha de corte (REQ-004, REQ-005); solo se evalúan los marcos contratados (D47). Un resultado se reutiliza entre los marcos del mismo servicio cuando coinciden alcance, período y versión.

### El riesgo (§10 del libro, D134)

| Elemento | Regla |
|---|---|
| Inherente | Probabilidad × impacto del riesgo. No cambia con los controles. Viene del catálogo y el cliente lo confirma o lo ajusta en el asistente del servicio |
| Nivel | **Por la posición de la celda en la matriz**, no por rangos del valor (la matriz está en D134): verde Bajo, amarillo Moderado, naranja Alto, rojo Crítico |
| Cobertura verificada | Relaciones causa–control del riesgo cuyo control cumple (Adecuado o Sólido) ÷ total de relaciones × 100. Un control con excepciones abiertas no cuenta |
| Avance de implementación | Relaciones cuyo control tiene tests ejecutados ÷ total. **Nunca reduce el riesgo** |
| Eficacia de controles | Controles vinculados que cumplen ÷ controles vinculados |
| Residual | Cobertura ≥ PR-09 (85%): la probabilidad baja 2 niveles · entre PR-08 (60%) y PR-09: baja 1 · menos: no se mueve. Mínimo 1. **El impacto no se reduce** (PR-10) |
| Apetito | Verde y amarillo: aceptable · naranja: tolerable solo con plan de tratamiento aprobado · rojo: inaceptable, exige tratamiento |
| Explicación | Si el riesgo se mueve: «Cambió porque se corrigieron y verificaron las condiciones de seguridad asociadas a sus causas», y los controles que lo explican. Si no: la cobertura actual, el umbral que falta y los controles pendientes con más relaciones |

La **matriz inherente** y la **residual** muestran la posición de cada riesgo antes y después de los controles. Son vista del `admin_empresa` y del `auditor` (D96). Las causas y los riesgos ya no tienen un estado de mitigación de todo o nada (RN-20 y RN-21 reemplazadas).

### Los parámetros (§11 del libro)

**Configurables y nunca escritos en el código** (RC-19). Tienen un valor de Monkey igual para todos los clientes; la empresa solo cambia la periodicidad de sus controles (G-10) (D140). Viven en `catalog.evaluation_parameters` y los edita `admin_monkey`, **todos**; cada cambio deja una fila en `catalog.evaluation_parameter_changes` (valor anterior y nuevo; MD-508, D153; [§12](12-notificaciones.md)) (MD-495, [contrato](../../../../../../contracts/catalogo-maestro.md#parámetros-de-evaluación-rc-19)). PR-07 tiene dos modos: `calendar` (el del libro, por defecto) y `rolling`, en el que cada evidencia vale una periodicidad desde su fecha y la siguiente vence un período después. PR-10 y PR-13 se pueden activar; los aplicarán el riesgo residual (MD-511) y el módulo Documentos. La tabla tiene una fila por parámetro (19): `key` (PK), `code` (PR-n o nulo), `unit` (`evaluation_parameter_unit`), `value` y `default_value` (JSONB), `sort_order`, `updated_at` y `updated_by`; la semilla trae los valores del libro.

| ID | Parámetro | Por defecto |
|---|---|---|
| PR-01 | Umbral de C% para Parcial | 75% |
| PR-02 | Umbral de C% para Débil | 40% |
| PR-03 | Cobertura de activos exigida en los tests técnicos | 100% |
| PR-04 | Duración máxima de la excepción de un check | 90 días |
| PR-05 | Frescura máxima de la evidencia automática | 24 horas |
| PR-06 | Alerta previa por periodicidad (días) | Mensual 5 · Trimestral 15 · Semestral 20 · Anual 30 · Diario 0 · Semanal 2 · Bimensual 10 |
| PR-07 | Ventanas de vigencia | Calendario |
| PR-08 | Cobertura de riesgo para mitigación parcial (−1 en probabilidad) | 60% |
| PR-09 | Cobertura de riesgo para mitigación demostrada (−2 en probabilidad) | 85% |
| PR-10 | Reducción de impacto | Desactivada |
| PR-11 | Pasos máximos de aprobación por documento | 5 |
| PR-12 | Aprobadores máximos por paso | 3 |
| PR-13 | Aprobación por quien envía el documento | No permitida como único aprobador |
| PR-14 | Plazo para aceptar un documento asignado | 30 días desde la asignación |
| PR-15 | Aceptación exigida para que el test documental sea Correcto | 100% de los usuarios asignados dentro del plazo |
| PR-16 | Duración mínima del período auditado (SOC 2) | 6 meses |

### El ejemplo resuelto

Un test técnico con 50 servidores en alcance y sus checks Directos (T-04):

| Caso | Situación | Estado del test |
|---|---|---|
| C1 | 45 en PASS y 5 en FAIL | Excepción |
| C2 | 45 en PASS y 5 sin resultado | Pendiente mientras la ventana está abierta; excepción por cobertura (T-04 d) al cerrarla (D140) |
| C3 | 50 de 50 en PASS | Correcto |
| C4 | 48 en PASS y 2 con error técnico (sin datos tras los reintentos) | Igual que C2 |
| C5 | 47 en PASS y 3 en FAIL con excepción aprobada vigente | Correcto (los 3 se muestran marcados) |
| C6 | Ningún check Directo aplica a su infraestructura | No es No aplica: se prueba a mano con `PE-TEC-02` (T-05) |
| C7 | Ningún resultado todavía | Pendiente |
| C8 | 45 en PASS, 3 en FAIL y 2 sin resultado | Excepción (prevalece la falla) |
| C9 | 50 en PASS y falla un check Complementario | Observación |

Hacia arriba: un control con 4 de 5 requisitos cumplidos está al **80% y en Parcial** (o en Débil si su documento base no está aprobado): **no cumple**. Con los 5 cumplidos está en Adecuado, pero solo cuenta como cumplido cuando lo aprueban el responsable y el administrador. Una categoría con 19 de 20 controles aprobados está al 95% y no cumple.

### Qué ve cada rol, y el semáforo (se conservan)

Los niveles, los requisitos y las listas de controles son **la vista técnica**: la de `auditor` y `admin_empresa` (D81, D96). El `responsable` y el `delegado` ven lo suyo, en qué falla y su avance (D118, `philosophy.md`). El semáforo cualitativo sigue igual (D62, DEV-16):

| Semáforo | Cuándo (sobre el avance del nivel) |
|---|---|
| **Preparado** | Cumple y **no hay nada pendiente** |
| **Casi listo** | Avance de 80% a menos de 100%, o todo lo medido cumple pero algo sigue pendiente |
| **Requiere trabajo** | Avance menor de 80% |
| **Sin medir** | No hay nada con resultado todavía: es un hueco de cobertura, no un fallo |

Un activo se lee con la misma regla sobre sus tests con resultado (`DT-66`). **La cobertura va siempre al lado del avance**, como un número aparte.

### Cómo se guarda

El cumplimiento de un marco **se deriva** y **nunca se almacena como atributo del marco**. Cada cambio de estado de un control deja un evento inmutable con el estado anterior y el nuevo (REQ-043, REQ-044, D91); cada aprobación, devolución y cambio de periodicidad queda en el registro de auditoría (G-09, G-10). Lo que el motor materialice es un registro de **esa evaluación en esa fecha**, reconstruible.

### La trazabilidad de una falla

Cada falla lleva a quien debe atenderla y a cómo se cierra:

| Nivel | Responsable | Tratamiento |
|---|---|---|
| Check Directo en FAIL de un activo | Delegado o responsable del control | Mensaje de brecha con la remediación; se cierra con un nuevo PASS del mismo check en el mismo activo (D138) |
| Requisito o test en excepción | Responsable del control | Evidencia nueva, o plan de remediación por excepción (nivel Parcial) |
| Control | Responsable y `admin_empresa` | Aprobación del cumplimiento (D132) |
| Riesgo | `admin_empresa` | Tratamiento si queda en zona naranja o roja (D134) |

> El cumplimiento del marco se **deriva** recorriendo requisitos → controles; nunca se almacena como columna del marco.

---
