# Decisiones — Cumplimiento · Resumen

Por qué este componente es como es. Lo vigente está en [`arquitectura/cumplimiento/resumen/`](../../../arquitectura/cumplimiento/resumen/README.md). Índice del módulo: [`README.md`](README.md).

## D87 · El período auditado lo declara la empresa y la fecha de corte es «hoy» hasta que se congela (2026-10-20; responde P26, de forma provisional)

> **Ajustada por D131 (2026-11-22).** El período auditado se sigue declarando por servicio y marco, y en SOC 2 dura como mínimo 6 meses (PR-16, G-11).

**Decisión.**
1. El **período auditado** (inicio y fin) de cada marco de un servicio lo declara `admin_empresa`, con `PUT /v1/services/{service_id}/frameworks/{framework_code}/evaluation-period`, y se puede editar. El consultor podrá corregirlo cuando trabaje sobre la empresa del cliente (hoy no puede: B6). Mientras no exista una evaluación emitida (MD-155) no hay nada que lo bloquee.
2. **El inicio y el fin pueden ser el mismo día**: así cabe una evaluación de **SOC 2 Tipo I** (una fecha puntual) además de la de **Tipo II** (un período de 6 a 12 meses). La hoja `Pruebas` del Excel del comité ya reconoce los dos («Tipo II: normalmente 6-12 meses; Tipo I: fecha puntual»).
3. La **fecha de corte** es «hasta qué día llegan los datos» de la evaluación. **Sin valor guardado es «hoy»** (la efectiva es hoy, sin salirse del período), así que no queda vieja de un día para otro; **con valor guardado está congelada** en esa fecha. Emitir una evaluación (MD-155) la congelará. La respuesta trae `cutoff_frozen` para distinguirlas.
4. **«Definida» ya no exige una fecha de corte guardada**: con inicio y fin, el motor ejecuta (REQ-004).
5. **La fecha de corte no reinicia nada.** No borra evidencia ni veredictos ni vuelve a medir: es la etiqueta de «hasta qué día se miró». Lo que sí hace que algo manual deje de contar es la **vigencia de la evidencia** (REQ-046) y el **cambio de período**.
6. Cada cambio queda en el rastro de auditoría, con el valor anterior y el nuevo, dentro de la misma transacción.

**Por qué.** Sin período y fecha de corte el motor no ejecuta (REQ-004): el resumen responde «Sin medir», proponer una exclusión responde `409 EVALUATION_NOT_DEFINED` y no se puede emitir una evaluación. Una fecha de corte guardada se desactualiza sola cada día mientras se monitorea; dejarla en «hoy» y congelarla al emitir es lo que recomendaba P26.

**Lo que no cambia.** La vigencia de una exclusión sigue siendo hasta el `period_end`; el motor no se toca (la fecha de corte hoy no filtra ningún cálculo); la evidencia sigue siendo válida si cae dentro del período (C1).

**Es provisional.** MD-168 dice que no se construye antes de la respuesta del comité. Esto es el **criterio de desarrollo** para poder verlo funcionando (como el punto 4 de D85); se ajusta si el comité contesta otra cosa. **Preguntas que quedan para el comité:** (a) si Monkey vende **Tipo I**; (b) qué pasa cuando **llega el período siguiente** (hoy hay una sola fila por servicio y marco: renovar sobrescribiría; habría que decidir si se abre un ciclo nuevo); (c) el **nombre**: el prototipo del Excel lo llama «Fecha de evaluación» y la escribe a mano (fija, 10/10/2026), el cerebro «fecha de corte» (REQ-004).

**Qué cambia.** `contracts/cumplimiento/resumen.md` (endpoint nuevo y `cutoff_frozen`), `datos/pendientes/cumplimiento.md` (P26) y `schema-implementacion.md` si aplica.

**Fuente:** Carlos Castaño, 2026-10-20 (recomendaciones de P26), con la hoja `Pruebas` y el prototipo del Excel del comité.

---

## D105 · La fecha de corte deja de ser una opción: siempre es hoy, y se muestra la última revisión automática (2026-11-07; Carlos Castaño; *ajusta D87*)

**Decisión.**
1. **Ya no se elige ni se congela la fecha de corte.** Para el cliente la evaluación se mide siempre con lo último que revisó la evaluación automática; la pantalla no ofrece «Congelar la fecha de corte» ni una fecha de corte. Esto sigue lo que ya decía D87 para el caso sin congelar («hoy»), y quita la otra mitad.
2. **Lo que el cliente sí ve** es *cuándo fue la última revisión automática* (fecha y hora), en la conexión de la nube. Nunca nombra al proveedor del motor: se dice «evaluación automática» o «sonda» (regla 1).
3. **Por qué:** se prevé que la sonda revise cada día (más adelante, cada hora), de modo que «la última revisión» ya es la fecha que importa y congelarla confunde más de lo que ayuda.
4. **Las fechas del período** (inicio y fin, D87) se eligen en un **calendario**, no se escriben a mano.
5. **Qué no cambia:** el Backend y el contrato siguen aceptando y devolviendo `cutoff_date` / `cutoff_frozen`; la pantalla nunca los envía distinto de `null`, así que guardar el período también **descongela** cualquier corte que hubiera quedado de antes. Emitir una evaluación (MD-155) seguirá congelando el corte en ese momento; eso es del motor, no de esta pantalla.

**Pendiente de Héctor (backend):** si se quiere dejar el contrato sin el campo, hay que retirar `cutoff_date`/`cutoff_frozen` de `PUT …/evaluation-period` y del resumen; mientras tanto no estorba.

**Fuente:** Carlos Castaño, 2026-11-07 («sigamos asumiendo que la fecha es siempre hoy, porque la idea es que se edite para que siempre haya una revisión diaria de la sonda»). Aún sin ratificar por el comité; si la ratificación cambia la decisión, se reabre aquí.

---

## D118 · El resumen del `responsable` y del `delegado` solo trae los marcos y las categorías donde tienen controles (2026-11-17; Héctor Ríos; *concreta D102*)

**Decisión.**
1. **Sus controles:** los vigentes de los que la persona es dueña o ejecutora activa (`client_control_assignments`). El resumen se calcula con el mismo motor, pero solo sobre ellos.
2. **Solo salen los marcos y las categorías con al menos un control suyo.** La categoría obligatoria (Seguridad en SOC 2) **no se fuerza**: si no tienen controles en ella, no sale. Sin ningún control en el servicio, `frameworks` llega vacío (`200`, no falla).
3. **`readiness`, `progress` y `coverage`** del marco y de cada categoría cuentan solo sus controles, con las reglas de siempre. `failing_controls` trae solo los suyos.
4. **`evaluation`** (versión del catálogo, período y fecha de corte) es la del servicio.

**Por qué.** D102 dice que cada persona ve el avance de lo suyo y nunca el de la empresa. Mostrar una categoría sin controles suyos solo agrega ruido, y un «Sin medir» vacío podría leerse como algo que le toca atender.

**Qué cambia.** `contracts/cumplimiento/resumen.md` (Reglas) y el Backend en MD-193.

**Fuente:** Héctor Ríos (Rod), 2026-11-17, al planificar MD-193; eligió la opción A: «solo las categorías donde tiene controles».

---

## D145 · Solo SOC 2 Tipo II y el período siguiente se abre solo (2026-11-23; cierra P26 y deja D87 como definitiva)

**Decisión** (lo que seguía abierto de `P26`):

1. **Por ahora no se vende SOC 2 Tipo I**: con el mínimo de 6 meses del período auditado (D131, PR-16) no encaja una fecha puntual. Solo Tipo II.
2. **Al terminar un período se abre solo el siguiente**, con la misma duración; el anterior queda cerrado como histórico, sin cambios.
3. D87 (el `admin_empresa` declara el período; la fecha de corte es «hoy» hasta que se congela) deja de ser provisional.

**Por qué.** Era lo que faltaba para construir el período auditado de RC-08.

**Qué cambia.** `service_frameworks` pasa a guardar un período por fila con su histórico (hoy una sola fila por servicio y marco), `contracts/cumplimiento/resumen.md` y `exclusiones.md`, y MD-500.

**Fuente:** Héctor Ríos (Rod), 2026-11-23, como decisión de desarrollo, para no bloquear la VF18. **No es una decisión del comité.**
