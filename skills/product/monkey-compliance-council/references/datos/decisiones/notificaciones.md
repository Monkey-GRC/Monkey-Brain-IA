# Decisiones — Notificaciones

Por qué Notificaciones es como es. **Se consulta para reabrir, no para construir**: lo vigente está en [`arquitectura/notificaciones/`](../../arquitectura/notificaciones/README.md). Índice de todas las decisiones: [`README.md`](README.md).

## D138 · Alertas por evento, tickets opcionales y el mensaje de brecha de un check (2026-11-22)

**Decisión** (`MAP CALOR`, secciones 6, 8, 13 y 14.4; G-08; RC-17 y RC-18):

1. **Alertas** (sección 14.4): ventana por vencer → delegado y responsable (aviso previo, PR-06); ventana vencida → delegado, responsable y administrador (el control pasa a Incumplimiento); check Directo en FAIL o cambio de parametrización → los tres; evidencia automática desactualizada → delegado y responsable (el test pasa a pendiente); control en «Cumple – por aprobar» → responsable; control aprobado por el responsable → administrador; control devuelto → delegado y responsable. En Documentos (sección 13): los aprobadores de cada paso al enviarse, recordatorios a quien falta por aceptar y el aviso de renovación al responsable del documento.
2. **Tickets opcionales** (G-08): cada alerta de incumplimiento puede crear un ticket en la herramienta conectada (categoría Ticketing de `INTEGRACIONES`, como Jira) con el control, el test, el activo, el check, la remediación, el responsable y la fecha compromiso. **Cerrar el ticket no cierra el incumplimiento**: lo cierra un nuevo PASS o la evidencia aprobada.
3. **Mensaje de brecha** (sección 8): cada FAIL de un check Directo se muestra con esta plantilla: encabezado («[control] · [test] – [activo] no cumple: [título del check]»), qué se evaluó, qué debe corregir, prioridad (severidad del check × criticidad del activo), cómo se cierra (un nuevo PASS del mismo check en el mismo activo, en una recolección posterior), responsable y fecha compromiso. Los textos del catálogo están en inglés: se muestran traducidos, se conserva el original y nunca se nombra al proveedor (D90, tabla 9 de `01_DESARROLLO`).

**Por qué.** El libro define qué avisa Monkey, a quién y con qué texto, que era lo que bloqueaba los recordatorios de vencimiento y la gestión de las fallas.

**Qué cambia.** El sistema de notificaciones (MD-515), `arquitectura/notificaciones/` y `contracts/integraciones.md`. Responde los eventos y los destinatarios de `P39` (siguen abiertos el canal, la frecuencia y el centro de notificaciones) y el punto 1 de `P46` (los tickets son para remediar; la categoría Ticketing además aporta evidencia). La prioridad de un check de la sonda, que no trae severidad, queda en `P49`.

**Fuente:** comité funcional, VF18 (`MAP CALOR`, secciones 6, 8, 13 y 14; hoja `INTEGRACIONES`), 2026-11-22.

---

## D143 · Canal, frecuencia y centro de notificaciones (2026-11-23; cierra P39)

**Decisión** (lo que D138 y D131 no definieron: puntos 1, 4 y 5 de `P39`):

1. **Canal:** cada aviso sale **en la app y por correo**, con el mismo proveedor de los correos transaccionales que ya salen.
2. **Frecuencia:** en la app, **al instante**; por correo, **un resumen diario**. Cada persona puede apagar el correo; los avisos de la app no se apagan.
3. **Centro de notificaciones:** una campana con **leído y no leído** y un **historial de 90 días**.
4. Los eventos y quién recibe cada uno son los de D138; los recordatorios de vencimiento, los de D131 (PR-06). El texto sigue la plantilla de 7 campos y nunca nombra al proveedor de la sonda ni de la nube.

**Por qué.** Eran las preguntas técnicas que quedaban de `P39`; el comité ya había definido qué se avisa y a quién.

**Qué cambia.** `arquitectura/notificaciones/` (historias y casos de uso dejan de estar bloqueados), el sistema de notificaciones (MD-515; D147 corrige la cita a MD-69) y los avisos de RC-08, RC-09 y RC-17 (MD-500, MD-506, MD-508). Necesita un planificador para el resumen diario y una tabla de notificaciones.

**Fuente:** Héctor Ríos (Rod), 2026-11-23, como decisión de desarrollo, para no bloquear la VF18. **No es una decisión del comité.**
