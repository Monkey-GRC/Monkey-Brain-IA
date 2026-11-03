# Decisiones — Cumplimiento · Motor

Por qué este componente es como es. Lo vigente está en [`arquitectura/cumplimiento/motor/`](../../../arquitectura/cumplimiento/motor/README.md). Índice del módulo: [`README.md`](README.md).

## D62 · El cumplimiento se cuenta: dimensión → control → categoría → marco (2026-10-09)

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
