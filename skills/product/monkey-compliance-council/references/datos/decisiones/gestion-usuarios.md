# Decisiones — Gestión de usuarios

Por qué Gestión de usuarios es como es. **Se consulta para reabrir, no para construir**: lo vigente está en [`arquitectura/gestion-usuarios/`](../../arquitectura/gestion-usuarios/README.md) y en `datos/modelo/`. Índice de todas las decisiones: [`README.md`](README.md).

## D98 · El funcional atiende todo lo de sus especialidades; toda cuenta lleva nombre; un administrador puede crear a otro (2026-10-29)

> **Reemplazada en parte por D102 (2026-11-03):** los puntos 1, 2 y 6 (especialidades, responsable por dimensión, `funcional`) ya no rigen. Siguen vigentes los puntos 3, 4 y 5 (nombre obligatorio, un administrador crea a otro, correo único).

**Contexto.** Carlos Castaño (2026-10-29), al probar el flujo: confundía el «responsable» con el `funcional` y no quería que el trabajo dependiera de que alguien se lo asignara. **Ajusta D96** (puntos 5 y 6) y no toca lo demás.

**Decisión.**

1. **Un `funcional` atiende todo lo de sus especialidades, sin asignación.** Si lo crean como «servidores», al entrar ve de una vez los controles, las evidencias que debe subir, los fallos que debe corregir y los hallazgos de esa dimensión, en **todos** los servicios de su empresa. Si dos personas comparten una especialidad, **las dos** ven y atienden lo mismo (ninguna le quita nada a la otra). El administrador sigue validando.
2. **El reparto a personas concretas queda aparte.** El responsable principal de un servicio por dimensión y la excepción por control (D96, punto 5) **se conservan en la base y en la API**, pero **no cambian lo que nadie ve** y la interfaz los tiene apagados. Volverán cuando se decida cómo usarlos (ver «Pendiente»).
3. **Toda cuenta lleva nombre y apellido** al crearla (obligatorios, máx. 100); el correo sigue siendo lo que la identifica. El administrador puede **corregirlos** después, en cualquier persona del equipo y en sí mismo.
4. **El `admin_empresa` puede crear a otro `admin_empresa`** (con nombre, sin especialidades; se activa con su código, como los demás). Puede **desactivar y reactivar a otro administrador**, nunca a sí mismo; así la empresa no se queda sin administrador.
5. **Un correo no se registra dos veces.** Es único en toda la plataforma. Si ya está en el equipo de la empresa, la pantalla lo dice antes de enviar y ofrece corregir su nombre; si es de otra empresa, el servidor responde `409 EMAIL_TAKEN` (no se revela de quién).
6. **Un servicio lo lee el `funcional` que tiene alguna especialidad que ese servicio lleva, y el `auditor`** (D96 ya lo daba); crearlo, editarlo y borrarlo siguen siendo solo del administrador.

**No cambia.** Los cargos responsables (`organization_responsibles`, D30) siguen separados del equipo; su relación con las personas con cuenta se decide aparte.

**Pendiente (Carlos, luego).** Cómo asignar trabajo a personas concretas dentro de una especialidad, y si el cargo responsable puede enlazarse a una cuenta del equipo. **Retomado el 2026-11-01 en `P38`** (reparto por control en una cadena `admin_empresa` → `funcional` → responsable).

**Qué cambia.** `contracts/gestion-usuarios.md`, `modelo/05-usuarios.md`, `contracts/cumplimiento/controles.md` y `contracts/cumplimiento/README.md` (quién ve qué), [`seguridad/roles-permisos.md`](../../seguridad/roles-permisos.md) (SEG-66).

**Fuente:** Carlos Castaño, 2026-10-29; hoja «Modelo de Gestión usuarios» del TSC integral (el `funcional` es el «Control Owner»: ejecuta y sube evidencia de lo suyo).

---

## D102 · Cadena de asignación: `admin_empresa` → `responsable` → `delegado`; el dueño de cada control es una persona (2026-11-03)

> **Punto 8 reemplazado por D132; punto 2 ajustado y ampliada por D136 (2026-11-22).** La revisión ya no es por evidencia: el control lo aprueba primero el responsable y al final el `admin_empresa`. Solo `admin_monkey` y `admin_empresa` crean usuarios (el `responsable` ya no crea a sus delegados). Se agrega el rol `colaborador`.

**Contexto.** Héctor Ríos trajo al equipo, el 2026-11-03, las respuestas del comité a `P38`. **Reemplaza a D98** (puntos 1, 2 y 6) y **ajusta D96** (puntos 5 y 6 del reparto por dimensión, y la validación en una sola revisión). Los términos cambian: el antiguo `funcional` es **`responsable`** y los miembros de su equipo son **`delegado`**. Los identificadores van en inglés.

**Decisión.**

1. **Cuatro roles de empresa:** `admin_empresa`, `responsable`, `delegado`, `auditor` (más `admin_monkey`, sin cambios). `funcional` desaparece. No hay roles personalizados. Los cargos ante el auditor (`organization_responsibles`, D30) pasan a llamarse **«cargos de la organización»** en pantalla y en los documentos, para que no choquen con el rol.
2. **Quién crea a quién.** El `admin_empresa` crea **todo** el esquema: responsables y delegados. Un `responsable` también puede crear delegados, solo para su equipo. La cadena es siempre de tres niveles; el `delegado` no crea a nadie.
3. **Grupos.** Un grupo es un equipo con **nombre** y un **líder**. El `admin_empresa` lidera uno o varios grupos de responsables (p. ej. «Responsables - Servicio IA»); cada `responsable` lidera **un** equipo de delegados. **Cada persona pertenece a un solo grupo.** Un delegado no existe sin equipo: sin equipo, la persona es un `responsable` que trabaja solo. El responsable de un delegado es el líder de su grupo (no se guarda aparte). Solo el `admin_empresa` mueve a un delegado de equipo.
4. **La unidad de asignación es el control completo del cliente** (`client_controls`, que cuelga de un servicio). Ya no hay dimensión, ni especialidad, ni responsable por servicio: quien responde por el control responde por **todas** sus pruebas. Las personas son de la empresa, no de un servicio; el mismo control en el servicio A y en el B se asigna cada uno por separado, y un control nuevo (otro servicio, otro marco) llega **«Sin asignar»**, sin heredar.
5. **Dueño y ejecutor.** El **dueño** es un `responsable`, o el propio `admin_empresa` si se lo asigna a sí mismo. El **ejecutor** es un `delegado` del equipo del dueño; **si no hay ejecutor, el dueño ejecuta**. Un control tiene un dueño y a lo sumo un ejecutor; un delegado puede tener varios controles.
6. **Quién asigna.** Solo el `admin_empresa` asigna dueño (a un responsable o a sí mismo) y puede reasignarlo. Solo el `responsable` asigna ejecutor, entre sus delegados. Un responsable no asigna a otro responsable y el administrador no asigna directo a un delegado. Al cambiar el dueño, el **ejecutor se limpia** hasta que el nuevo dueño decida. Un control sin dueño muestra **«Sin asignar»**: lo ve el `admin_empresa`, que se lo asigna a sí mismo o a un responsable.
7. **La asignación es seguimiento, no un candado.** Dueño, ejecutor y `admin_empresa` pueden subir evidencia y registrar resultados; nadie revisa lo que subió él mismo, salvo el `admin_empresa` cuando es dueño del control y también quien sube (`P34`, sigue abierto).
8. **Quién revisa y cómo se combina (cambia el «una sola revisión» de D96).** Se revisa **por evidencia o prueba**. Revisa el `responsable` dueño cuando subió otra persona (su delegado), y el `admin_empresa` siempre puede revisar. Cada entrega admite a lo sumo una revisión por rol. **Si revisaron los dos, deben haber aprobado los dos; cualquier rechazo gana. Si revisó solo uno y aprobó, está aprobado; sin revisión, está pendiente.** Un control cumple cuando **todas** sus pruebas están en orden. El veredicto de una prueba manual **no documental** sigue el mismo flujo: lo registra el ejecutor (o el dueño) y lo revisan el dueño y el `admin_empresa`.
9. **Visibilidad.** Cada `responsable` y `delegado` ve **solo sus controles** (el responsable, los suyos y los que ejecutan sus delegados) y el **avance de lo suyo**, nunca el de la empresa ni un porcentaje global. Solo el `admin_empresa` ve todo, incluido **cuántos controles tiene cada persona y su avance** (sin tope). El `auditor` ve toda la cadena (dueño y ejecutor de cada control) y sus observaciones llegan al dueño y al ejecutor. Ni responsable ni delegado ven la vista técnica (D81). Cambia SEG-66.
10. **Bajas.** Dar de baja es **desactivar** (nunca borrar: historial y `CC6.3`). Al desactivar a alguien con controles asignados el servidor avisa y pide confirmación. Un **delegado** desactivado deja sus controles con su responsable, sin ejecutor. Un **responsable** con delegados activos o pendientes **no se puede desactivar** hasta que se reasignen o se desactiven; sin delegados, sus controles quedan **«Sin asignar»**. El historial donde participó se conserva.
11. **Interno o externo.** Al crear un `delegado` se marca si es de la compañía o externo (`is_internal`). Es solo una etiqueta, no cambia permisos, y por ahora solo aplica a delegados.
12. **Pantalla «Mi trabajo».** Es la vista de entrada del `responsable` y del `delegado`: sus controles, lo que deben subir, lo rechazado y, para el responsable, lo que tiene por revisar. Versión mínima en el sprint 3.
13. **MFA.** TOTP obligatorio para todos los roles hasta que se agreguen otras formas de ingreso (D66, D94 se mantienen).
14. **Invitaciones.** Entra en el sprint 3 que la invitación llegue **por correo**. Las notificaciones (`P39`) no.
15. **Fuera del sprint 3:** ausencias o delegación temporal (el administrador reasigna a mano), reparto equitativo automático y notificaciones.
16. **Los permisos por pantalla (`P3`) no esperan al Excel:** se planean con la matriz de §5.5 reescrita con estos roles.

**Qué cambia.** `modelo/05-usuarios.md` (§5.1, §5.2, §5.5), `modelo/07-cumplimiento.md` (`evidence_reviews`), `contracts/gestion-usuarios.md`, `contracts/enums/gestion-usuarios.md` y `contracts/enums/cumplimiento.md`, los contratos de `contracts/cumplimiento/` y `contracts/conventions.md` (quién ve qué), SEG-66 y los SEG nuevos de [`seguridad/gestion-usuarios.md`](../../seguridad/gestion-usuarios.md). Se **eliminan** `user_dimensions` y `service_dimension_owners`; `user_control_assignments` se reemplaza por `client_control_assignments`. No hay empresas reales: se migra sin compatibilidad. Cierra `P38`.

**Fuente:** Héctor Ríos, 2026-11-03, con las respuestas del comité a `P38`.

---

## D103 · Monkey solo tiene `admin_monkey` y fija el cupo de usuarios de cada empresa (2026-11-03)

> **Ajustada por D136 (2026-11-22).** Con la Tabla 2 de la VF18, `admin_monkey` también gestiona los usuarios de una empresa y ve su cumplimiento.

**Contexto.** Héctor Ríos, 2026-11-03, con las respuestas del comité a `P40`. El modelo de negocio cobra por número de usuarios creados.

**Decisión.**

1. **Un solo rol interno de Monkey: `admin_monkey`**, el que ya existe. Crea y archiva empresas, administra el catálogo (controles, riesgos y causas) y fija el cupo de usuarios de cada empresa. No crea otros roles de Monkey. Un rol de **soporte** es una mejora futura sin definir.
2. **Cupo de usuarios.** `companies.max_users` lo fija y lo sube `admin_monkey`. Cuentan los usuarios de la empresa en estado `active`, `pending` o `suspended`, de cualquier rol (incluidos `admin_empresa` y `auditor`, internos y externos). Una cuenta creada que aún no se activó **cuenta**. Desactivar a alguien **libera** su cupo. Al llegar al tope, crear otro usuario responde `409 USER_LIMIT_REACHED`; reactivar a alguien también lo respeta.
3. **El restablecimiento del segundo factor del `admin_empresa`** sigue como en D94. Cada asignación, reasignación y baja deja rastro en `audit_logs`.

**Qué cambia.** `modelo/04-monkey-admin.md` (`companies.max_users`), `contracts/empresas.md`, `contracts/gestion-usuarios.md`. Cierra `P40`; las demás preguntas de `P40` (perfil, límites por plan, reporte de accesos) quedan como decisiones del equipo con el valor por defecto de arriba.

**Fuente:** Héctor Ríos, 2026-11-03, con las respuestas del comité a `P40`.

---

## D104 · El responsable vive en «Responsables» y su equipo de delegados lo crea él, no nace con su cuenta (2026-11-05)

> **Ajustada por D136 (2026-11-22).** Con la Tabla 2 de la VF18 solo `admin_monkey` y `admin_empresa` crean usuarios: el `responsable` ya no crea a sus delegados; sigue delegando sus controles en ellos.

**Contexto.** Héctor Ríos, 2026-11-05. El plan del sprint 3 (MD-188) decía que crear un `responsable` creaba también su equipo de delegados. No es lo que el comité pidió: se desvió al planificar el sprint. **Ajusta D102** (punto 3, grupos); no la reemplaza.

**Decisión.**

1. **Un `responsable` pertenece solo a un grupo de responsables**, el que lidera el `admin_empresa`. Al crearlo, queda en el grupo «Responsables» de la empresa (se crea si falta). Por eso el administrador puede listar a sus responsables y verlos en detalle.
2. **El equipo de delegados no nace con el responsable.** Lo crea el propio `responsable` cuando quiere (un botón «Crear grupo»); mientras no lo cree, trabaja solo, como ya decía D102. El `admin_empresa` puede crearlo por él: puede hacer todo el flujo solo (crear al responsable y crear el equipo de ese responsable).
3. **Un responsable lidera un solo equipo** (D102): pedir un segundo es `409`. Un delegado no existe sin equipo: no se crea un delegado hasta que su responsable tenga equipo.
4. **El delegado ve a qué responsable pertenece**: es el líder de su grupo (no se guarda aparte) y llega en su perfil (`GET /v1/auth/me`).
5. **Los responsables que ya existían** (cuentas `funcional` migradas en MD-186, sin grupo) se meten en «Responsables» con una migración.

**Qué cambia.** `contracts/gestion-usuarios.md` (alta, «Quién puede qué», «Grupos»), `contracts/autenticacion.md` (`/auth/me`), `modelo/05-usuarios.md`, `producto/sprint-usuarios.md` y el contenido de MD-188, MD-189 y las pantallas MD-197, MD-198 y MD-200.

**Fuente:** Héctor Ríos, 2026-11-05: «así es como lo quería el comité; hubo una desviación en la planificación del sprint».

---

## D117 · Un `admin_monkey` invita y desactiva a otros administradores; la baja dura 7 días y luego se borra, y la auditoría conserva un sello (2026-11-13)

**Contexto.** Héctor Ríos (Rod), 2026-11-13, al planificar MD-215. Hoy los `admin_monkey` solo se crean por consola (`npm run bootstrap:admin`) y no hay pantalla ni endpoint. Hay cuatro (dos de desarrollo y dos del comité). **Amplía D103** (que fija un solo rol interno): no la reemplaza ni cambia sus puntos.

**Decisión.**

1. **El alta es por invitación de correo**, con el mismo mecanismo de D95 y D96: la cuenta nace `pending`, no inicia sesión, y se activa con un código de un solo uso que pone la contraseña y obliga a configurar el segundo factor (D94, D102). Se invita desde Monkey Admin y el enlace del correo apunta a Monkey Admin. **El rol viaja como campo** (hoy solo `admin_monkey`): Monkey prevé más roles administrativos, y cada uno pedirá su propia decisión; hasta entonces cualquier otro valor es `422`.
2. **Cualquier `admin_monkey` activo puede desactivar y reactivar a otro**, sin jerarquía. Dos candados: **nadie se desactiva a sí mismo** y **el último `admin_monkey` activo no se puede desactivar**, ni siquiera con dos peticiones simultáneas.
3. **Desactivar es una gracia de 7 días y luego un borrado total.** La cuenta pasa a `inactive` con una fecha de purga (`purge_at`, a 7 días), se cierran sus sesiones al instante y no puede entrar. **Dentro de esos 7 días se puede reactivar.** Al vencer, un proceso programado **borra su registro por completo** (cuenta, credenciales, segundo factor, sesiones y códigos). Es el mismo patrón de archivar y purgar empresas (D97). La razón de que sea borrado y no solo baja: un administrador de Monkey no recolecta datos a su nombre, así que no hay nada que conservar de él.
4. **La auditoría conserva un sello mínimo.** Al purgar, en la misma transacción, se guarda en `audit.admin_tombstones` el **id, el nombre completo y el rol** del administrador (nunca el correo ni nada de acceso). Un registro de `audit_logs` (o de otra tabla que atribuya algo a una persona) cuyo autor ya no existe sigue mostrando quién fue, con su sello. `audit_logs` sigue siendo solo de añadir: no se reescribe ningún registro.
5. **El correo queda libre** al purgar (D98 punto 5: el correo es único en toda la plataforma): se puede volver a invitar a esa persona.
6. **Invitar y desactivar piden el código del segundo factor de quien actúa**, igual que archivar una empresa (D97). **Reactivar no lo pide.**
7. **La empresa interna de Monkey no tiene límite de usuarios:** su `max_users` queda sin fijar (sin tope, D103) y ningún alta ni reactivación de un administrador pasa por `USER_LIMIT_REACHED`.

**Qué hay que resolver al construir (el sello necesita quitar bloqueos).** Hoy varias claves foráneas hacia `users` son `Restrict` o no tienen acción, y un administrador puede estar referenciado por ellas: `audit_logs.user_id` (`Restrict`, a propósito, para no perder la atribución), `compliance_events.user_id`, `catalog_versions.published_by`, `access_keys.created_by` y `user_activation_codes.created_by` (quien invitó a otro). Para que el borrado sea posible, esas columnas de **atribución** dejan de tener clave foránea (siguen siendo un uuid) y la lectura resuelve el nombre con la cuenta o, si no existe, con su sello. Las columnas de credenciales del propio administrador se borran con él. La revisión tabla por tabla va en el ticket de backend (MD-215).

**Qué cambia.** `contracts/gestion-usuarios/administradores.md` (nuevo) y su enlace en `contracts/gestion-usuarios.md` y `contracts/README.md`, `contracts/enums/gestion-usuarios.md` (`user_status` con `purge_at`), `datos/modelo/04-monkey-admin.md` (`admin_tombstones`, `users.purge_at`), `arquitectura/gestion-usuarios/README.md`, `seguridad/gestion-usuarios.md` (`SEG-79` a `SEG-82`). Las mejoras futuras del módulo van en `P47`.

**Fuente:** Héctor Ríos (Rod), 2026-11-13: «la creación de un admin va a ser mediante invitación de correo»; «todos van a poder borrar a otro admin»; «no se puede desactivar a sí mismo y el último admin en pie tampoco»; «el desactivar admin lo ponemos a 7 días, luego de eso se borra por completo su registro»; «si en un log de auditoría aparece el nombre, id de un admin que ya no está, que siga saliendo»; «claro que se puede reactivar»; «pon esa info en la auditoría (id, nombre completo y rol)»; «la empresa interna de Monkey no tiene límite de usuarios»; «al reactivar un usuario no hace falta poner TOTP».

---

---

## D122 · «Mi trabajo» y la carga de trabajo usan el avance del resumen, y cada control cae en un solo bucket con un orden fijo (2026-11-17; Héctor Ríos)

**Decisión.**
1. **Avance:** `GET /v1/me/work` y `GET /v1/team/workload` devuelven el mismo objeto que el marco en el resumen de Cumplimiento: `{ readiness, progress: { done, total }, coverage: { measured, applicable } }`, calculado con el motor sobre los controles de la persona. El porcentaje no viaja: lo deriva la pantalla. Esto reemplaza el `{ state, percent, coverage }` que decía el contrato, que contradecía al del resumen.
2. **Bucket:** un control cae en el primero que le aplique, en este orden: `rejected` (hay que rehacer) → `to_review` (solo el responsable dueño, algo de otro espera su revisión) → `to_upload` (falta evidencia o veredicto) → `in_review` (entregado, espera a otro) → `done`. `pending_items` suma lo que falta subir, lo rechazado, lo que tiene que revisar y las observaciones abiertas del auditor. Las fallas automáticas se ven en el estado del control.
3. **Carga de trabajo:** sale cada `responsable` y `delegado` activo (con cero si no tiene controles) y cada `admin_empresa` dueño de algún control, sin tope ni paginación.

**Por qué.** Un solo objeto de avance en todo Cumplimiento (regla de producto: estado, avance y cobertura juntos). El orden de los buckets pone primero lo que bloquea y es de la persona.

**Qué cambia.** `contracts/gestion-usuarios.md` (`GET /v1/me/work` y `GET /v1/team/workload`), `contracts/enums/gestion-usuarios.md` (`work_bucket`) y el Backend en MD-195.

**Fuente:** Héctor Ríos (Rod), 2026-11-17, al planificar MD-195. Eligió «el del resumen» y «ese orden».
