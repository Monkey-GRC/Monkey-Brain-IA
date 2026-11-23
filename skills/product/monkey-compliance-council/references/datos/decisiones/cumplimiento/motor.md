# Decisiones — Cumplimiento · Motor

Por qué este componente es como es. Lo vigente está en [`arquitectura/cumplimiento/motor/`](../../../arquitectura/cumplimiento/motor/README.md). Índice del módulo: [`README.md`](README.md).

## D62 · El cumplimiento se cuenta: dimensión → control → categoría → marco (2026-10-09)

> **Reemplazada por D130 (2026-11-22)**, salvo el semáforo, que se conserva (DEV-16).

**Decisión.** El responsable de producto fijó la fórmula, basada en cómo se mide SOC 2 (5 categorías, compuestas por controles, que se
evalúan con tests en 5 dimensiones). Cada nivel cuenta lo cumplido contra el total del nivel y **se cumple solo al 100%**:

- **Dimensión de un control:** cumple solo si todos sus tests con resultado, sobre todos sus activos aplicables, cumplen.
- **Control:** % = dimensiones que cumplen / dimensiones aplicables. Con una falla de cinco, 80% y no cumple.
- **Categoría:** % = controles que cumplen / controles aplicables (5 de 10 fallan → 50%; 45 de 156 fallan → 71,15%). Se logra solo al 100%.
- **Marco del servicio:** % = categorías logradas / categorías **contratadas** (1 de 5 → 20%; 1 de 2 → 50%). Una categoría sin controles aplicables se anula y no entra.
- **Solo se mide lo que ya tiene resultado.** Un test `pending` o `not_applicable` no afecta ningún cálculo hasta que tenga un resultado.
- **Una categoría con controles aplicables pero ninguno medido no está lograda** y cuenta en el denominador del marco; sin ningún control aplicable, se anula.
- **Cobertura:** siempre un número aparte al lado del porcentaje. Un 100% con algo pendiente se muestra como «100% de lo medido» y nunca como Preparado.
- **El activo** se lee con la misma regla: tests con resultado cumplidos / tests con resultado, con los cortes de 100% y 80%.
- **Pesos iguales** en todos los niveles. No hay porcentaje de la empresa.
- **Semáforo:** Preparado = 100% · Casi listo = de 80% a menos de 100% · Requiere trabajo = menos de 80%.
- **Vocabulario:** *dimensión* es solo el eje técnico (documental, servidores, bases de datos, aplicación, nube); *categoría* es solo el criterio de confianza.

**Por qué.** Una certificación solo se emite con todo en regla, así que el estado es binario en cada nivel; el porcentaje es el
diagnóstico que se le muestra al cliente. Una categoría al 99% se ve como 99%, se le dice que falla y qué le falta, y se logra cuando llega a 100%.

**Qué cierra.** P16 y P18.
**Fuente:** responsable de producto, 2026-10-09; `modelo-datos.md` §9.

> **Reemplazada en parte por D68 (2026-10-10).** La agregación (dimensión como nivel, % del control por dimensiones, % del marco por categorías, «solo se mide lo que tiene resultado») la sustituye el motor del comité. Se conservan los pesos iguales, el par servicio × marco, el semáforo y la cobertura aparte.

---

---

## D68 · El motor de evaluación del comité es la regla del cálculo (2026-10-10)

> **Reemplazada por D128 y D130 (2026-11-22).** La regla del cálculo es la hoja `MAP CALOR` de la VF18; las reglas `RN-xx` y `REQ-xxx` de la VF2 valen solo donde no chocan con ella. Se conservan la agregación por categoría y marco (RN-17 a RN-19), el semáforo y el tratamiento del error técnico (DEV-16).

> **Ajustada por D96 (2026-10-27).** Cambian dos puntos: el 8 (la exclusión por activo la decide el `admin_empresa`, no el consultor) y el 11 (las evaluaciones del consultor y del auditor quedan en pausa).

**Problema.** El comité entregó la VF2 del TSC integral con tres hojas nuevas que especifican el **motor de evaluación** (`MODELO EVALUACIÓN MONKEY`, `REQUISITOS EVALUACIÓN MONKEY` y un prompt de
desarrollo): estados por nivel, reglas RN-01 a RN-25, 51 requisitos y 8 casos de prueba. D62 había fijado la agregación con otro criterio (la fijó el responsable de producto porque el Excel de la
fórmula no la reflejaba, §0). Las dos no coinciden en varios puntos.

**Decisión (el comité manda; se aplica tal cual, salvo lo que se dice al final).**
1. **La regla del cálculo es la del comité** (`modelo-datos.md` §9): activo → test → control → categoría → marco, con «todo o nada» en cada nivel y el porcentaje como **avance**, no como criterio de cumplimiento.
2. **Lo pendiente bloquea el cumplimiento.** Lo sin medir queda `PENDIENTE` o `EN EVALUACIÓN`, nunca cumplido ni ignorado. 45 de 50 servidores conformes y 5 sin evaluar **no es CUMPLE**. Reemplaza a D62 («solo se mide lo que tiene resultado»).
3. **Estados nuevos por nivel**: vencido, error, incompleto, sin tests, sin activos, desactivado, fuera de alcance y en revisión, además de los que ya había (`contracts/enums.md`).
4. **La dimensión deja de ser un nivel con estado propio** y sigue siendo obligatoria: una dimensión requerida sin test vigente deja el control `INCOMPLETO`. Las dimensiones requeridas salen de la hoja `Controles Monkey` del comité
   (columnas L a P). **Ajusta D39** (que las derivó de las pruebas): en los datos del comité coinciden en la forma, pero las cifras no (`DT-69`).
5. **El control** es `EFECTIVO` solo con todos sus tests obligatorios, vigentes y aplicables cumplidos y ninguna dimensión sin test; su **avance** son los tests cumplidos sobre (tests + dimensiones sin test). **El marco** se evalúa sobre los
   **controles únicos** de las categorías en alcance (uno compartido cuenta una vez) y su avance es efectivos / controles únicos. Reemplaza al «% del marco = categorías logradas / contratadas» de D62.
6. **La evaluación** es servicio + marco + versión + período + fecha de corte, y un resultado se calcula **una vez** y lo reutilizan todos los controles que usan el test.
7. **Relación control–test con atributos** (obligatorio, vigente, fechas, justificación) y **desactivación controlada** con rastro. **Evidencias** validadas por atributo, y solo una validada por una persona puede ser `CUMPLE`.
8. **Excluir un activo** exige justificación, aprobador y vigencia: es la exclusión que ya existía (A3; la propone la empresa y la aprueba el consultor, D78), ahora también por activo.
9. **El error técnico** de un activo deja el test en `ERROR`; no es un incumplimiento ni un cumplido. Una corrida que no llegó a la cuenta del cliente (D57) sigue sin guardar resultados.
10. **Causas y riesgos**: se adoptan los estados de mitigación (RN-20, RN-21) y el riesgo inherente = probabilidad × impacto (RN-22). **El riesgo residual, el apetito y el mapa de calor no se adoptan todavía**: el comité mismo los marca como
    propuesta con parámetros sin aprobar. *(D75, 2026-10-13: se adopta la fórmula y el valor inicial del apetito; faltan datos y el aprobador, `P22`; ticket MD-151, fuera del sprint.)* El residual y el mapa son vista del consultor y del auditor, no del cliente (`philosophy.md`).
11. **El consultor y el auditor hacen cada uno una evaluación del cumplimiento, con distinto enfoque** (el consultor prepara, el auditor certifica). **Lo agregó el responsable de producto**: el Excel no la contempla, y su «validada por
    auditor» (RN-03) se entiende como «validada por una persona». Su diseño lo cerró D77.

**Lo que no se adopta.** El **prompt de desarrollo** del Excel se lee como referencia: pide una API `/api/v1` y «TypeScript/Node o Go», y aquí rigen `contracts/` (`/v1`) y la pila ya elegida. Las **diez decisiones pendientes** que trae la hoja
(para «el equipo Monkey») **se registran, no se resuelven**: `P22`. *(Revisadas después: cinco se cerraron en D74 y D75; quedan cinco para el comité en `P22`.)*

**Se conserva de D62:** pesos iguales en todos los niveles, la unidad (servicio × marco) sin número de empresa, el semáforo cualitativo y la cobertura siempre aparte.

**Por qué.** El comité hizo el análisis funcional, y CLAUDE.md dice que ante un conflicto manda el documento fuente. D62 había llenado un hueco que el Excel de la fórmula no cubría; ahora el comité lo cubrió y su regla es más estricta y más
trazable (cada estado se explica con una regla numerada y casos de prueba). La evaluación del consultor y del auditor es un hecho del producto que el Excel omitió.

**Qué cambia.** `modelo-datos.md` §9 (reescrita), §2, §7.1, §7.4, §7.5 y el glosario; `contracts/enums.md` (estados de evaluación); `sprint-cumplimiento.md` y `mvp-roadmap.md`; `DT-66` (la
preparación por severidad se escribe contra esta regla; `DT-65`, el calculador que promediaba, se retiró porque ese código ya no existe) y `DT-69` (dimensiones); pendiente `P22` (`P23` lo cerró D77).

**Fuente:** comité funcional, `assets/TSC INTERGRAL SOC 2 DETALLADO VF2.xlsx` (hojas `MODELO EVALUACIÓN MONKEY` y `REQUISITOS EVALUACIÓN MONKEY`), 2026-10-10; evaluación del consultor y del auditor: responsable de producto, 2026-10-10.

---

---

## D79 · Columnas que faltaban para los contratos de Cumplimiento (2026-10-14, MD-108)

**Decisión.** Al escribir los contratos de `contracts/cumplimiento/` aparecieron datos que los tickets piden y el modelo no guardaba. Se agregan a `modelo-datos.md` §7:

- `client_controls.name`: un control propio lleva nombre (MD-150); el del catálogo lo toma de `controls.name`.
- `evidence_submissions.submitted_at`, `approved_at` y `decision_note`: «aprobada con su autor y fecha» y «rechazar exige un motivo» (MD-126, MD-127).
- `exclusions.status` (`pending|approved|rejected`), `requested_at`, `decided_at`, `decision_note` y `technical_justification`; y `approved_by` pasa a llamarse `decided_by`, porque decide también quien rechaza (D78, MD-144).

**Por qué.** Sin ellas los contratos no podían ser verdad: una exclusión sin estado no distingue lo propuesto de lo aprobado, y «el activo sigue contando hasta que se aprueba» no se puede cumplir.

**No cambia** ninguna regla de producto: son columnas que ya implicaban D65, D74 y D78.

**Fuente:** MD-108; tickets MD-126, MD-127, MD-144, MD-150.

---

## D130 · El cumplimiento del control se calcula por requisitos, con un nivel de 0 a 5 (2026-11-22; reemplaza los estados del test y del control de D68)

**Decisión** (`MAP CALOR`, secciones 2 a 5, 9 y 11; el detalle en §9):

1. **Cadena**: activo → check (por activo), caso de muestra o documento → evidencia → test → requisito del control → control. La evaluación de cumplimiento **termina en el control** (P1 del libro); la categoría y el marco se agregan como antes (punto 5).
2. **Estados por nivel**, los del libro: evidencia manual (cargada, vigente, vencida, devuelta) y automática (recibida, normalizada, vinculada, incompleta, desactualizada); check por activo (PASS, FAIL, FAIL con excepción aprobada, no aplica, sin datos); test (pendiente, correcto, observación, excepción, no aplica, vencido); requisito (cumple, no cumple, pendiente, vencido, no aplica).
3. **Reglas por tipo de test** T-01 a T-07. En lo técnico **solo deciden los checks Directos** aplicables a la infraestructura del cliente, con el 100% de los activos en alcance con resultado (PR-03); un Complementario en falla es observación; una Dependencia toma la conclusión del control dueño sin reejecutarse. Los checks prueban solo los requisitos técnicos y nunca reemplazan uno documental u operativo (S-01 a S-05).
4. **Control**: C% = requisitos que cumplen ÷ requisitos aplicables (los «no aplica» aprobados salen del denominador). **Nivel**: 0 No evaluado · 1 Ineficaz · 2 Débil · 3 Parcial · 4 Adecuado · 5 Sólido, con las reglas R1 a R6. **Cumple solo en Adecuado o Sólido** (el todo o nada se conserva), y el cumplimiento es definitivo con la aprobación final (D132). La escala es interna de Monkey (preparación) y no reemplaza la opinión del auditor (P7 del libro).
5. **Lo que se conserva** (DEV-16): la agregación por categoría y marco (RN-17 a RN-19). En ella un control cuenta como cumplido solo en «Cumplimiento aprobado» (D132); pone su categoría en `NO CUMPLE` si tiene algún requisito que no cumple o vencido, y si no, en `EN EVALUACIÓN` mientras no esté aprobado. También se conservan el semáforo, la fecha de corte (D105) y el **error técnico** de un check: se reintenta tres veces y avisa (D76), y mientras tanto el check está «sin datos», que nunca es PASS.
6. **Parámetros** PR-01 a PR-16, con los valores por defecto del libro, configurables y nunca escritos en el código (RC-19). Su alcance y quién los edita: `P48`.

**Por qué.** Es el modelo del libro. El requisito del control hace explícito lo que antes se mezclaba entre «tests obligatorios» y «dimensiones exigidas».

**Qué cambia.** §9 entero, `contracts/enums/cumplimiento.md` (estados nuevos), `contracts/cumplimiento/controles.md` y `resumen.md`. **Reemplaza** de D68 los estados y reglas del test y del control (`EFECTIVO`, `INCOMPLETO`, `SIN TESTS`…) y el avance por tests; de D62 solo queda el semáforo. Lo que el libro no define está en `P48`.

**Fuente:** comité funcional, VF18 (`00_LEEME`, principios; `MAP CALOR`, secciones 2 a 5, 9 y 11; tabla 5 de `01_DESARROLLO`), 2026-11-22. Cómo entra el nivel en la agregación que se conserva (punto 5) lo derivó desarrollo de R4 y de la sección 14.2 del libro.

---

## D131 · Vigencia por periodicidad: ventanas de evidencia, alertas previas y un período auditado mínimo (2026-11-22; ajusta D87)

**Decisión** (`MAP CALOR`, sección 6; PR-05 a PR-07 y PR-16; G-06, G-10 y G-11):

1. **Ventanas.** Cada control se evalúa por ventanas de calendario según su periodicidad (diaria, semanal, mensual, bimestral, trimestral, semestral, anual, permanente o cuando sea requerido) (PR-07), y cada ventana exige su evidencia. Si una ventana cierra sin evidencia, el test y el requisito pasan a vencidos, el control baja de nivel y vuelve a «Incumplimiento» (G-06).
2. **Alerta previa** al delegado y al responsable antes del cierre: 5 días en la mensual, 15 en la trimestral, 20 en la semestral, 30 en la anual, el mismo día en la diaria, 2 en la semanal y 10 en la bimestral (PR-06).
3. **Lo permanente** se cumple con resultados automáticos de frescura de 24 h como máximo (PR-05): si la última recolección es más vieja, la evidencia queda desactualizada y el test, pendiente. **Lo que ocurre por evento** exige evidencia de cada evento del período o, si no hubo ninguno, una declaración trimestral de «sin ocurrencias» del responsable.
4. **La periodicidad sugerida la puede cambiar el `admin_empresa`** por control, con una justificación escrita que queda en el rastro; Monkey recalcula las ventanas y ajusta la muestra de los tests operativos (G-10).
5. **Período auditado.** Se configura al inicio, por servicio y marco; en SOC 2 dura **como mínimo 6 meses** (PR-16, configurable). Solo cuentan las ventanas que caen dentro, y una evidencia fechada fuera del período no cuenta (G-11). Monkey muestra dos vistas de cada control: el estado a la fecha (última ventana) y el del período (todas sus ventanas) (R6).

**Por qué.** Responde la periodicidad que faltaba (`P22`, punto 2): ya es una columna por control y por requisito, configurable por el cliente; y lo automático se refresca a diario.

**Qué cambia.** §9 y §7 (las ventanas son del control del cliente), `contracts/cumplimiento/resumen.md` (el mínimo del período). **Ajusta D87** (el período lo sigue declarando el `admin_empresa`, ahora con un mínimo) y el **punto 2 de D74** (lo vencido se mide por ventana). La fecha de corte no cambia (D105, DEV-16). En `P26` siguen abiertos el Tipo I y el período siguiente.

**Fuente:** comité funcional, VF18 (`MAP CALOR`, secciones 5, 6 y 14.3), 2026-11-22.

---
