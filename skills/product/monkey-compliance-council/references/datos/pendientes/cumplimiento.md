# Pendientes del comité — Cumplimiento

Preguntas abiertas que afectan a [Cumplimiento](../../arquitectura/cumplimiento/README.md). **Si una sigue aquí, no se resuelve por cuenta propia: se pregunta.** Tablero y reglas: [`README.md`](README.md).

## P26 · Quién define el período auditado y la fecha de corte de una evaluación

**Estado:** abierto desde 2026-10-14 (MD-108). El motor no ejecuta sin los cinco datos de la evaluación: servicio, marco, versión, **período auditado** y **fecha de corte** (REQ-004, §9). `service_frameworks` tiene `period_start`, `period_end` y `cutoff_date` (columnas desde MD-144), pero ningún formulario ni endpoint las llena: el onboarding solo pide un `evaluation_period` de texto.

1. **¿Quién declara el período auditado y cuándo?** *Recomendación: `admin_empresa`, al contratar el marco o crear el servicio; editable mientras no se haya congelado.*
2. **¿La fecha de corte es «hoy» mientras se monitorea y se congela al emitir una evaluación del servicio (hoy en pausa, D96)?** *Recomendación: sí; así cada evaluación dice sobre qué datos se hizo.*

**Respuesta provisional (D87, 2026-10-20):** se adoptaron las dos recomendaciones para poder construirlo (el criterio de desarrollo no sustituye al comité): `admin_empresa` declara el período; la fecha de corte es «hoy» mientras se monitorea y se congela al emitir una evaluación. Inicio y fin pueden coincidir (Tipo I). **Sigue abierto para el comité:** si se vende Tipo I, qué pasa al llegar el período siguiente (hoy una sola fila por servicio y marco) y el nombre (el Excel dice «fecha de evaluación»).

**Lo que respondió la VF18 (D131, 2026-11-22):** el período auditado se configura al inicio, por servicio y marco, y en SOC 2 dura **como mínimo 6 meses** (PR-16, configurable); solo cuentan las ventanas y las evidencias que caen dentro (G-11). La fecha de corte no la define el libro y sigue siendo «hoy» (D105). **Sigue abierto:** si se vende Tipo I (con el mínimo de 6 meses no cabría una fecha puntual) y qué pasa al llegar el período siguiente.

**Qué depende:** el resumen del servicio (MD-137), las evaluaciones del servicio (en pausa, D96) y la vigencia de las exclusiones (MD-144). Sin período la API responde `not_measured` y `409 EVALUATION_NOT_DEFINED`, también al proponer una exclusión (MD-144). **MD-168 está construido (2026-10-20, D87)**: `PUT …/evaluation-period`.


---

## P27 · Cómo se agrupan los controles en un marco sin categorías

**Estado:** abierto desde 2026-10-15 (D80). La lista de controles y el resumen se agrupan por **categoría**, y en SOC 2 la categoría es el criterio de confianza (Seguridad, Disponibilidad, Integridad del procesamiento, Confidencialidad, Privacidad). **Otros marcos no tienen ese nivel** (ISO 27001, NIST CSF y PCI DSS agrupan distinto), y el modelo hoy solo tiene 	rust_criteria, que es de SOC 2. En cambio **cada control ya trae un domain** (27 valores literales del comité: «Gestión de Activos», «Monitoreo Continuo»…), que es **del control y no del marco** (D35), así que existe sea cual sea el marco.

1. **¿Cuál es la agrupación principal?** *Recomendación: la categoría del marco cuando el marco la define (SOC 2); si no, el domain del control. El domain queda además siempre disponible como filtro.*
2. **¿Se muestra el código de la categoría o su nombre?** *Recomendación: el nombre del marco para la categoría (el que figura en el marco) y, al lado, el código de cada control y de cada requisito (CC6.1, IAC-12), que sí existen en todos los marcos.*
3. **¿Cómo se llama la agrupación en la pantalla?** *Recomendación: «Categoría» en SOC 2 y el nombre propio del marco en los demás (la API lo manda como etiqueta, no se escribe en el frontend).*

**Qué depende:** la lista de controles (MD-120) y el resumen (MD-140) para cualquier marco que no sea SOC 2. Para el MVP (solo SOC 2) no bloquea nada. Si se adopta la recomendación, el contrato de controles añade domain a cada ítem.


---

## P33 · Advertencias y confirmación al editar o dar de baja un control, un riesgo o una causa

**Estado:** abierto desde 2026-10-27 (D96). El `admin_empresa` los cambia directamente, con advertencia y confirmación. Falta definir **qué** advierte la pantalla y **cuándo**: darlo de baja cambia lo que se mide y, por tanto, el avance del servicio.

1. **¿Qué se le muestra antes de confirmar?** *Recomendación: lo que cambia de verdad —cuántas pruebas dejan de contar, qué riesgos y causas quedan sin ese control y cómo se mueve el avance y la cobertura del servicio—, no un «¿está seguro?» genérico.*
2. **¿Pide un motivo?** *Recomendación: sí en la baja y en quitar una dimensión; opcional en una edición de texto. Queda en la auditoría.*
3. **¿Un control con resultados ya emitidos se puede dar de baja?** *Recomendación: sí, como baja (nunca borrado); el historial y las evaluaciones inmutables se conservan.*

**Qué depende:** las pantallas de edición del administrador. No bloquea la API.


---

## P37 · Criterios de las observaciones del auditor que desarrollo fijó sin que el comité los pidiera

**Estado:** abierto desde 2026-10-29 (MD-154). El Excel y `modelo-datos.md` §7.6 definen las observaciones, pero no estos detalles; desarrollo los resolvió con el criterio más sencillo para poder construir y los dejó anotados aquí para que el PO los ratifique o los cambie. Es lo mismo que D85 hizo con las observaciones abiertas («criterio provisional de desarrollo»).

1. **¿Qué es una observación «abierta» para exigir la razón del veredicto?** Hoy: `status = open` y solo en el **control de origen** (D85). Una respondida (`answered`) ya no la exige. *Alternativa:* exigirla también mientras esté respondida y sin cerrar, o mirar los controles que comparten la prueba. *Recomendación: dejarlo como está; la empresa ya atendió la respondida.*
2. **¿Se abren observaciones sobre un control dado de baja?** Hoy: no (`409 CONTROL_RETIRED`); las que ya tenía se siguen leyendo. *Recomendación: dejarlo como está.*
3. **¿La evidencia que respalda una respuesta puede ser de cualquier control o solo del mismo servicio?** Hoy: de un control del mismo servicio. *Recomendación: dejarlo como está.*
4. **Si el auditor comenta solo una evidencia, ¿la observación queda en el control de esa evidencia?** Hoy: sí (una entrega pertenece a un único control), y así la ve el `funcional` responsable. *Recomendación: dejarlo como está.*
5. **Al devolver una observación a `open`, ¿se conserva la última respuesta?** Hoy: sí, hasta que la empresa dé otra; la anterior queda solo en el rastro de auditoría (no hay tabla de historial de respuestas). *Alternativa:* guardar cada respuesta en una tabla aparte. *Recomendación: dejarlo como está mientras nadie pida ver el historial de respuestas en pantalla.*
6. **¿La empresa debe enterarse de que tiene una observación nueva?** Hoy no hay aviso (no existe el sistema de correos y notificaciones, `MD-69`). *Recomendación: sí, por correo y en la app, cuando exista ese sistema.*

**Qué depende:** nada del código inmediato; el comportamiento actual está en `contracts/cumplimiento/veredictos.md` y `modelo/07-cumplimiento.md` §7.6. Si el PO cambia alguna respuesta, se ajusta el contrato y la prueba que la cubre (`test/cumplimiento/observaciones.e2e-spec.ts`, `veredictos.e2e-spec.ts`). Es `LATER`.


---

## P43 · Qué muestra «Lo que requiere atención» del Inicio

**Estado:** abierto desde 2026-11-10. Fuente: sesión de rediseño, desarrollo. Hoy solo muestra código, nombre del control y servicio, que es lo único que trae `DashboardAttention`.

1. **¿Qué más debe mostrar el cliente y de dónde sale?** Marco al que pertenece el control.
2. **Prioridad o severidad:** ¿enum nuevo? ¿quién la define?
3. **Estado de gestión:** pendiente, en curso, resuelto.
4. **Vencimiento y responsable.**
5. **Acciones «Resolver» y «Asignar».**
6. **¿Una ruta de detalle de control?**
7. **¿El texto «en qué falla / qué hacer»** de la plantilla de 7 campos?

**Qué depende:** ampliar el contrato del dashboard y esa tabla; no bloquea.


---

## P48 · El motor v2: lo que la VF18 no define o donde se contradice

**Estado:** abierto desde 2026-11-22 (D128). El resto del modelo de evaluación del libro está decidido (D130 a D135).

1. **Un activo en alcance sin resultado.** La regla T-04 dice que es excepción; la sección 3.2 dice «pendiente o en excepción de cobertura». ¿Cuándo es cada uno? (¿pendiente mientras la ventana está abierta y excepción al cerrarla?)
2. **Quién registra el resultado de una prueba manual** (operativa, de población o técnica manual: correcto, observación o excepción). ¿El delegado o el responsable al cargar su evidencia, o el responsable al aprobar el control?
3. **R5: ¿quién es «el evaluador»** que puede cambiar el nivel sugerido de un control, con justificación y aprobación del administrador?
4. **El plan de remediación** que pide el nivel Parcial (uno por cada excepción) y **el plan de tratamiento aprobado** de la zona naranja del riesgo: ¿qué datos lleva cada uno, quién lo registra y quién lo aprueba? Hoy existen `action_plans` y `risk_treatments`.
5. **Los parámetros PR-01 a PR-16**: ¿son valores de Monkey para todos, de cada empresa o de cada servicio, y quién los edita? El libro solo dice que el `admin_empresa` cambia la periodicidad de un control (G-10).
6. **La ventana anual**: ¿«año del período» o «12 meses desde la última ejecución»? El libro da las dos.
7. **Las reglas 2, 16 y 17** que citan `REQUISITOS`, `IN-07` e `IN-06` no vienen en la copia del libro (DEV-01). ¿Se entregan, o basta con lo que dicen `IN-06` e `IN-07`?

**Qué depende:** el motor v2 (RC-06, RC-08, RC-11 y RC-19).

---
