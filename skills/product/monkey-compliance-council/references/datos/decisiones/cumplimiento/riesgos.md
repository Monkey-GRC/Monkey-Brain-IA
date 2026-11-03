# Decisiones — Cumplimiento · Riesgos

Por qué este componente es como es. Lo vigente está en [`arquitectura/cumplimiento/riesgos/`](../../../arquitectura/cumplimiento/riesgos/README.md). Índice del módulo: [`README.md`](README.md).

## D33 · Riesgos: categoría de 11 valores y evaluación 5×5 que hace el cliente

**Decisión:** en `catalog.risks` y `tenant.client_risks`, `trust_criterion` es un enum propio
(`risk_criterion`, 11 valores) y no el de los TSC; `likelihood`, `impact`, `inherent_risk_value` e
`inherent_risk_level` son **opcionales** (`inherent_risk_level`: `low|moderate|high|critical`).
`failure_category` pasa de 2 a 6 valores.

**Por qué:** se contrastó el modelo con el Excel maestro (que gana, según CLAUDE.md). La hoja
*Riesgos* usa categorías que no son TSC (Cumplimiento, Continuidad, Fraude, Terceros, Reputación,
Operación) y trae probabilidad, impacto y nivel **vacíos** en los 10 riesgos: son un dato del
cliente, no del catálogo. Con las columnas obligatorias el catálogo no se podía ni cargar. La hoja
*Causas* trae las 6 categorías de falla, con lo que se cierra ese TODO. Corrige un error de esta
misma revisión, que había convertido `trust_criterion` en el enum de los TSC.

**Fuente:** `assets/TSC INTERGRAL SOC 2 DETALLADO VF.xlsx`, hojas *Riesgos* y *Causas*.

---

---

## D75 · Se adopta la fórmula del riesgo residual del comité, y se cierran tres decisiones del Excel por su recomendación o por lo ya decidido (2026-10-13)

Las diez decisiones de la hoja `MODELO EVALUACIÓN MONKEY` (`P22`) se revisaron una por una. **Si el comité lo recomienda, así se hace.** Esto cierra las decisiones 1, 6 y 10 del Excel y adopta el valor de la 2; las 3 y 7 ya las cerró D74.

**Decisión.**
1. **Riesgo residual (decisión 1): se adopta la fórmula del comité** (RN-23). Para un riesgo, *Cp* son los controles únicos con efecto «probabilidad» vinculados a sus causas aplicables, y *Ci* los de efecto «impacto». La reducción de la probabilidad es
   `redondear hacia abajo(controles efectivos de Cp ÷ |Cp| × máximo de probabilidad)` (cero si no hay controles) y la del impacto es igual con *Ci*. El residual es `probabilidad inherente − reducción` y `impacto inherente − reducción`, **nunca menos de 1**, y su valor es
   probabilidad × impacto, siempre **menor o igual que el inherente**. Solo los controles `EFECTIVO` reducen; los pendientes reducen 0; una relación sin efecto no participa. **No se pondera por la solidez del control** (la fórmula del comité no lo hace).
   Los parámetros son configurables, **nunca escritos en el código** (REQ-039): **máximo 2 puntos en probabilidad y 1 en impacto**. El residual es **aceptable si su valor es menor o igual que el apetito**.
2. **Apetito (decisión 2): el valor inicial es 9 sobre 25**, el que propone el comité. **Quién lo define y quién lo aprueba sigue abierto** (`P22`). *(D76 precisa para qué sirve: es lectura, no el criterio de mitigación.)*
3. **La IA con los documentos (decisión 6):** el comité la clasifica **LATER** (REQ-047): no se construye ahora. Cuando se construya, siempre confirma una persona y la IA nunca produce «cumple». El umbral de confianza se define entonces.
4. **Versionado (decisión 10):** ya está respondido. Las correcciones de redacción de un control se propagan solas; un cambio que altera cómo se mide (peso, dimensiones, tests, un control que se elimina, la confianza de un mapeo) **espera la aceptación del consultor**; un control nuevo **aplica desde el siguiente período**
   (A4, aceptado por el comité). Un resultado solo se reutiliza si coinciden **alcance, período y versión** (RN-13, REQ-045).
5. **Datos del modelo:** la relación causa–control lleva si el control es **obligatorio** y su **efecto** (probabilidad o impacto); hay una entidad de **parámetros del residual** (`modelo-datos.md` §7.2). *(La relación en sí ya existe completa en el Excel: 209 filas, D76.)*

**Qué sigue esperando.** El residual y el mapa de calor (MD-151, fuera del sprint) esperan dos datos que el Excel aún no trae: el **efecto (probabilidad o impacto) y la obligatoriedad** de las 209 relaciones causa–control, y la probabilidad y el impacto de cada riesgo, que pone el cliente (`P22`, D76). Son vista del consultor y del auditor, no del cliente.

**Fuente:** comité funcional, VF2 (RN-23, RN-13, REQ-039 a REQ-042, REQ-045, REQ-047); A4; responsable de producto, 2026-10-13 («lo que recomienda el comité se aplica»).

---

---

## D76 · Respuestas del comité sobre el motor, y qué significa el mapa de calor (2026-10-13)

**Qué pasó.** Al revisar la VF2 a fondo se encontró que varias preguntas que se le habían dejado al comité **ya estaban respondidas en el archivo**: la metodología 5×5 con sus escalas descritas (hoja `Riesgos`), la relación
causa→control completa (`Causas` columna G: las 56 causas, **209 relaciones**), las 92 relaciones riesgo↔causa y el período de prueba de cada test (`Pruebas` columna I). También se habían pasado por alto **dos imágenes** de la hoja
`GRAFICO` (la infografía del motor y el mockup de la pantalla de Cumplimiento) y los **comentarios de celda**. El comité aclaró lo que faltaba en reunión.

**Decisión (comité, salvo lo indicado).**
1. **El mapa de calor no decide si un riesgo está mitigado.** Quien lo dice son los **controles y sus tests** (RN-20, RN-21). La **matriz inherente** y la **matriz residual** son la **lectura de la evolución**: le muestran al cliente
   cómo se mueve cada riesgo a medida que sus controles pasan a efectivos. El **apetito** sirve para leer ese movimiento, no para declarar mitigación. Esto no cambia el cálculo de §9; fija qué significa cada cosa en pantalla y con qué palabras se nombra:
   **matriz inherente** y **matriz residual** son los términos del comité y son los que se usan.
2. **Reintentos de una comprobación automática (decisión 4 del Excel): al menos tres intentos.** Si después del tercero sigue fallando, el test queda en **`ERROR`** y se **avisa para revisión** (no pasa a `NO CUMPLE` ni a `CUMPLE`). Cierra la decisión 4.
3. **Periodicidad (decisión 5): manda la periodicidad del control.** Si un control se revisa cada 3 meses, **todos sus checks se evalúan con esa periodicidad**. Las comprobaciones automáticas corren con la frecuencia de su conexión (`AC-01` cada 6-24 h; `AC-02` a `AC-06`, continuas).
   **Dato que falta:** la periodicidad **no es un campo** del catálogo. Está escrita en prosa en la descripción de **18 de los 119 controles** («al menos una vez al año», «al menos trimestralmente») y, por test, en `Pruebas` columna I («Período bajo auditoría», «al menos una prueba anual»). Hace falta como columna para poder programarla (`P22`).
   **Objeción de desarrollo, pendiente de resolver con el comité:** reevaluar a diario todo lo automático genera una carga de peticiones alta sobre la infraestructura del cliente y sobre la sonda; la frecuencia debería poder bajarse por control o por conexión.
4. **Probabilidad e impacto de los riesgos (decisión 8): los pone el cliente**, como ya decía D33, porque un mismo riesgo no pesa igual en cada empresa. El comité **entregará criterios** para guiarlo; las escalas descritas (1 a 5, con su significado) **ya están** en la hoja `Riesgos`. Cierra la decisión 8 en cuanto a quién.
5. **Relación causa→control (decisión 9): ya está completa en el Excel** (209 relaciones). Lo único que falta es, **para cada una**, si el control es **obligatorio** y si reduce **probabilidad** o **impacto**: hoy solo lo tienen las **9** del ejemplo del prototipo. Es lo que necesita la fórmula del residual (D75).
6. **Vocabulario del comité, que es el que se usa:** *riesgo* es la probabilidad y el impacto de que algo ocurra o se pierda si alguien lo materializa; *causa* es aquello por lo que el riesgo se materializa; *control* es el paso a paso que lo evita o lo mitiga.

**Viene en camino.** El comité entregará **entre el 14 y el 15 de octubre de 2026** un Excel con el detalle completo de la fórmula de cumplimiento. **No se construye el motor de riesgos hasta recibirlo**; lo de §9 (cumplimiento) no cambia salvo que ese archivo lo contradiga, y entonces manda el archivo.

**Fuente:** comité funcional, reunión del 2026-10-13, transmitida por el responsable de producto; VF2 (hojas `Riesgos`, `Causas`, `Pruebas`, `GRAFICO`); D33, D75.

---
