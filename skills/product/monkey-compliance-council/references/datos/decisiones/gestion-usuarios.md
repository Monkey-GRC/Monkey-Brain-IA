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

**Contexto.** Héctor Ríos, 2026-11-03, con las respuestas del comité a `P40`. El modelo de negocio cobra por número de usuarios creados.

**Decisión.**

1. **Un solo rol interno de Monkey: `admin_monkey`**, el que ya existe. Crea y archiva empresas, administra el catálogo (controles, riesgos y causas) y fija el cupo de usuarios de cada empresa. No crea otros roles de Monkey. Un rol de **soporte** es una mejora futura sin definir.
2. **Cupo de usuarios.** `companies.max_users` lo fija y lo sube `admin_monkey`. Cuentan los usuarios de la empresa en estado `active`, `pending` o `suspended`, de cualquier rol (incluidos `admin_empresa` y `auditor`, internos y externos). Una cuenta creada que aún no se activó **cuenta**. Desactivar a alguien **libera** su cupo. Al llegar al tope, crear otro usuario responde `409 USER_LIMIT_REACHED`; reactivar a alguien también lo respeta.
3. **El restablecimiento del segundo factor del `admin_empresa`** sigue como en D94. Cada asignación, reasignación y baja deja rastro en `audit_logs`.

**Qué cambia.** `modelo/04-monkey-admin.md` (`companies.max_users`), `contracts/empresas.md`, `contracts/gestion-usuarios.md`. Cierra `P40`; las demás preguntas de `P40` (perfil, límites por plan, reporte de accesos) quedan como decisiones del equipo con el valor por defecto de arriba.

**Fuente:** Héctor Ríos, 2026-11-03, con las respuestas del comité a `P40`.

---
