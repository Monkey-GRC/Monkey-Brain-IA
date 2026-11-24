# Pendientes del comité — Cumplimiento

Preguntas abiertas que afectan a [Cumplimiento](../../arquitectura/cumplimiento/README.md). **Si una sigue aquí, no se resuelve por cuenta propia: se pregunta.** Tablero y reglas: [`README.md`](README.md).



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
6. **¿La empresa debe enterarse de que tiene una observación nueva?** Hoy no hay aviso (no existe el sistema de correos y notificaciones, `MD-515`). *Recomendación: sí, por correo y en la app, cuando exista ese sistema.*

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
