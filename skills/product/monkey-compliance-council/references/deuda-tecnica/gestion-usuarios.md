# Deuda técnica — Gestión de usuarios

Parches vigentes de [Gestión de usuarios](../arquitectura/gestion-usuarios/README.md). Tablero y reglas: [`README.md`](README.md).

## Sprint 3 · MD-186: el esquema de D102 ya está, la lógica nueva llega en los tickets que siguen

### DT-87 · Un `responsable` ve solo los controles de los que es dueño o ejecutor, y el `delegado` solo controles, evidencia y observaciones

🟠 Importante

- **Qué está parchado:** al desaparecer `funcional`, la visibilidad se resuelve con una regla transitoria y restrictiva: el `responsable` y el `delegado` ven lo que `client_control_assignments` les asigna como dueño o ejecutor, y nada más. El `delegado` queda fuera del resumen, los riesgos, los servicios y los hallazgos (403, cubierto por `test/equipo/equipo.e2e-spec.ts`). El resumen propio, el avance de lo suyo y los alcances por riesgo, observación y hallazgo no se han reescrito. Código: `control-responsibles.ts`, `service.prisma.repository.ts` (`assignedTo`) y `scan.prisma.repository.ts` (`responsibleUserIds`), todos con comentario `// DT-87`.
- **Por qué:** es lo más seguro mientras no existe la visibilidad por dueño/ejecutor: nadie ve de más.
- **Qué lo cierra:** MD-193 (reemplazar `control-responsibles.ts` por el alcance dueño/ejecutor en controles, evidencia, riesgos, observaciones, hallazgos y resumen propio; SEG-66 y SEG-76). Al cerrarla, reescribir también los comentarios de `get-control.use-case.ts` y `evidence.use-cases.ts` que aún hablan de dimensiones.

### DT-88 · El `PATCH /v1/users/{id}` no impide desactivar a un responsable con delegados y no avisa de los controles asignados

🟠 Importante

- **Qué está parchado:** desde MD-188 existen delegados con responsable, pero el `PATCH` conserva la lógica anterior: desactiva a cualquiera sin comprobar si un `responsable` tiene delegados activos o pendientes (`RESPONSIBLE_HAS_DELEGATES`) ni si la persona tiene controles asignados (`USER_HAS_ASSIGNMENTS`, `confirm_unassign`), y no mueve a un delegado de equipo (`group_id`). Solo devuelve la forma nueva del usuario (`group`, `responsible`, `is_internal`). Código: `UpdateTeamMemberUseCase` y `team-user.prisma.repository.ts` (`update`).
- **Por qué:** la lógica de baja con aviso es MD-191 (SEG-74) y mover delegados es MD-189; MD-188 solo crea y lista.
- **Qué lo cierra:** MD-191 (`RESPONSIBLE_HAS_DELEGATES`, `USER_HAS_ASSIGNMENTS`, `confirm_unassign`, `controls_unassigned` en la auditoría) y MD-189 (mover un delegado). Mientras tanto, el administrador no debe desactivar a un responsable que tenga delegados.

### DT-89 · El reenvío de la invitación devuelve el código de activación en la respuesta

🟠 Importante

- **Qué está parchado:** `POST /v1/users/{id}/activation-code` emite un código nuevo y lo devuelve en claro, y el alta no lo entrega por ningún canal (su `invitation.delivery_status` es siempre `pending`): hasta que exista el correo, una cuenta recién creada solo puede activarse reemitiendo el código desde ese endpoint. Código: `ReissueActivationCodeUseCase`, `toMemberWithCode` y `TeamMemberCreatedResponse`.
- **Por qué:** el correo de invitación es MD-190; el contrato ya pide que el código no viaje en ninguna respuesta (SEG-75).
- **Qué lo cierra:** MD-190 (plantilla en el `Mailer`, envío en el alta y en el reenvío, respuesta solo con `invitation`, y prueba de que ni la respuesta ni `audit_logs` contienen el código).

