# Decisiones — Gestión de usuarios

Por qué Gestión de usuarios es como es. **Se consulta para reabrir, no para construir**: lo vigente está en [`arquitectura/gestion-usuarios/`](../../arquitectura/gestion-usuarios/README.md) y en `datos/modelo/`. Índice de todas las decisiones: [`README.md`](README.md).

## D98 · El funcional atiende todo lo de sus especialidades; toda cuenta lleva nombre; un administrador puede crear a otro (2026-10-29)

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
