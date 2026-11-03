# Decisiones — Cumplimiento · Resumen

Por qué este componente es como es. Lo vigente está en [`arquitectura/cumplimiento/resumen/`](../../../arquitectura/cumplimiento/resumen/README.md). Índice del módulo: [`README.md`](README.md).

## D87 · El período auditado lo declara la empresa y la fecha de corte es «hoy» hasta que se congela (2026-10-20; responde P26, de forma provisional)

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
