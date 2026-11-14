# Deuda técnica — Gestión de usuarios

Parches vigentes de [Gestión de usuarios](../arquitectura/gestion-usuarios/README.md). Tablero y reglas: [`README.md`](README.md).

## Sprint 3 · MD-186: el esquema de D102 ya está, la lógica nueva llega en los tickets que siguen

### DT-87 · Un `responsable` ve solo los controles de los que es dueño o ejecutor, y el `delegado` solo controles, evidencia y observaciones

🟠 Importante

- **Qué está parchado:** al desaparecer `funcional`, la visibilidad se resuelve con una regla transitoria y restrictiva: el `responsable` y el `delegado` ven lo que `client_control_assignments` les asigna como dueño o ejecutor, y nada más. El `delegado` queda fuera del resumen, los riesgos, los servicios y los hallazgos (403, cubierto por `test/equipo/equipo.e2e-spec.ts`). El resumen propio, el avance de lo suyo y los alcances por riesgo, observación y hallazgo no se han reescrito. Código: `control-responsibles.ts`, `service.prisma.repository.ts` (`assignedTo`) y `scan.prisma.repository.ts` (`responsibleUserIds`), todos con comentario `// DT-87`.
- **Por qué:** es lo más seguro mientras no existe la visibilidad por dueño/ejecutor: nadie ve de más.
- **Qué lo cierra:** MD-193 (reemplazar `control-responsibles.ts` por el alcance dueño/ejecutor en controles, evidencia, riesgos, observaciones, hallazgos y resumen propio; SEG-66 y SEG-76). Al cerrarla, reescribir también los comentarios de `get-control.use-case.ts` y `evidence.use-cases.ts` que aún hablan de dimensiones.

### DT-90 · El envío de la invitación es directo, sin cola ni reintentos, y su resultado no se guarda

🟡 Mejora

- **Qué está parchado:** `POST /v1/users` y `POST /v1/users/{id}/activation-code` envían el correo de invitación en el momento, después del commit, con un solo intento. El resultado (`invitation.delivery_status`: `sent` o `failed`) solo viaja en la respuesta: no se guarda, no sale en `GET /v1/users` y no queda en `audit_logs`. Si el proceso muere entre el commit y el envío, queda una cuenta `pending` sin correo y sin rastro de que falló; la lista no distingue «sin correo» de «correo enviado». Es la misma limitación que `DT-85` para la clave de acceso de la empresa. Código: `InvitationDelivery` (`team/application/invitation/`).
- **Por qué:** la invitación es una acción manual y el reenvío siempre está disponible mientras la cuenta esté `pending`; MD-190 entrega el canal, no la fiabilidad de la entrega.
- **Qué lo cierra:** una cola con reintentos y un estado de entrega guardado (y visible en la lista del equipo), junto con el de la clave de acceso (`DT-85`).


### DT-107 · La función que lista los administradores por purgar no comprueba el rol dentro de ella

🟡 Mejora

- **Qué está parchado:** `platform.list_admins_due_for_purge` (MD-215, D117) es `SECURITY DEFINER` y la purga programada la llama **fuera** de `withScope`, sin rol de sesión. Por eso la función no puede comprobar el rol por dentro, como sí hace `platform.company_users_count` (`SEG-77`): cualquier conexión con `EXECUTE` (solo `monkey_app`) obtiene el id y la empresa de los administradores cuya purga ya venció.
- **Por qué:** lo único que devuelve son dos uuid de cuentas que ya van a borrarse, nunca nombre ni correo, y ningún endpoint la expone; el costo de envolver la lectura de la purga en un `withScope` de sistema no valía el riesgo.
- **Qué lo cierra:** que la purga llame a la función dentro de `withScope({ role: 'admin_monkey' })` y que la función falle cerrada (`app.user_role = 'admin_monkey'`), con su prueba junto a `test/aislamiento/company-users-count.e2e-spec.ts`.

### DT-108 · El filtro de estado y el rol de la invitación de administradores se escriben en el frontend

🟡 Mejora

- **Qué está parchado:** la pantalla «Administradores» de Monkey Admin (MD-215) declara a mano `active · pending · inactive` (filtro de estado) y `admin_monkey` (rol invitable) en `Frontend/src/app/features/admin-users/models/admin-user.model.ts`, porque `user_status` y `user_role` no están entre las listas que sirve `GET /v1/catalogs/{name}`. Las etiquetas sí van por i18n.
- **Por qué:** es el mismo criterio de `companies` con sus estados, los valores coinciden con `contracts/enums/gestion-usuarios.md`, y servir el enum pedía ampliar el endpoint de catálogos y su contrato dentro de este ticket.
- **Qué lo cierra:** servir `user_status` y `user_role` por `/catalogs` (contrato en `contracts/enums.md`) y que `admin-users` y `companies` los pidan desde ahí.
