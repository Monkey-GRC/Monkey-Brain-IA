# Deuda técnica — Gestión de usuarios

Parches vigentes de [Gestión de usuarios](../arquitectura/gestion-usuarios/README.md). Tablero y reglas: [`README.md`](README.md).

## Sprint 3 · MD-186: el esquema de D102 ya está, la lógica nueva llega en los tickets que siguen

### DT-86 · El alta de un `delegado` guarda `is_internal = true` y no asigna grupo

🟡 Mejora

- **Qué está parchado:** `POST /v1/users` crea un `delegado` siempre como interno (`is_internal = true`) para cumplir el CHECK de la base, y no le pone grupo; crear un `responsable` tampoco crea su equipo. El contrato (`contracts/gestion-usuarios.md`) pide que quien invita diga si el delegado es interno o externo, que el `responsable` cree delegados de su propio equipo y que un responsable nuevo nazca con su grupo. Código: `team-user.prisma.repository.ts` (comentario `// DT-86`) y `test/equipo/equipo.e2e-spec.ts`.
- **Por qué:** MD-186 es la migración al modelo D102 y deja el repositorio compilando con pruebas en verde; el alta completa es MD-188.
- **Qué lo cierra:** MD-188 (`is_internal` obligatorio en el alta de un delegado, grupo y creación del equipo del responsable) y, para mover personas entre grupos, MD-189.

### DT-87 · Un `responsable` ve solo los controles de los que es dueño o ejecutor, y el `delegado` solo controles, evidencia y observaciones

🟠 Importante

- **Qué está parchado:** al desaparecer `funcional`, la visibilidad se resuelve con una regla transitoria y restrictiva: el `responsable` y el `delegado` ven lo que `client_control_assignments` les asigna como dueño o ejecutor, y nada más. El `delegado` queda fuera del resumen, los riesgos, los servicios y los hallazgos (403, cubierto por `test/equipo/equipo.e2e-spec.ts`). El resumen propio, el avance de lo suyo y los alcances por riesgo, observación y hallazgo no se han reescrito. Código: `control-responsibles.ts`, `service.prisma.repository.ts` (`assignedTo`) y `scan.prisma.repository.ts` (`responsibleUserIds`), todos con comentario `// DT-87`.
- **Por qué:** es lo más seguro mientras no existe la visibilidad por dueño/ejecutor: nadie ve de más.
- **Qué lo cierra:** MD-193 (reemplazar `control-responsibles.ts` por el alcance dueño/ejecutor en controles, evidencia, riesgos, observaciones, hallazgos y resumen propio; SEG-66 y SEG-76). Al cerrarla, reescribir también los comentarios de `get-control.use-case.ts` y `evidence.use-cases.ts` que aún hablan de dimensiones.
