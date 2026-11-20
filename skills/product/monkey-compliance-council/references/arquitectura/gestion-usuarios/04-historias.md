# Gestión de usuarios · historias de usuario

Responde: **¿qué necesita cada persona para armar el equipo de una empresa, organizarlo en grupos, darlo de baja y repartir
los controles, y cómo se comprueba que lo tiene?** Cada historia dice quién, qué y para qué; sus criterios de aceptación son
verificables y citan la regla que los fija. El detalle técnico (cuerpos, errores) está en el
[contrato](../../../../../../contracts/gestion-usuarios.md) y en el de
[administradores](../../../../../../contracts/gestion-usuarios/administradores.md); la secuencia, en
[`03-flujos.md`](03-flujos.md); los pasos de cada caso, en [`05-casos-de-uso.md`](05-casos-de-uso.md).

**Roles** (D96, D102): `admin_empresa`, `responsable`, `delegado`, `auditor` (Monkey Platform) y `admin_monkey` (Monkey
Admin). «Persona de empresa» = cualquiera de los cuatro primeros. **Estado** de cada historia: ✅ construida · 🟡 parcial ·
⚪ por construir. El estado sale del «Estado de implementación» del contrato (la API del sprint 3 está completa, MD-186 a
MD-195) y de lo que falta de las pantallas (MD-199 a MD-204).

## Resumen

| ID | Historia | Rol | Estado | Reglas |
|---|---|---|---|---|
| HU-USR-01 | Invitar a una persona a mi empresa | `admin_empresa` | ✅ | D98, D102, D104, SEG-75 |
| HU-USR-02 | Invitar a un delegado a mi equipo | `responsable` | ✅ | D102, D104 |
| HU-USR-03 | Reenviar una invitación que no llegó | `admin_empresa` | ✅ | SEG-75, DT-90 |
| HU-USR-04 | Ver y filtrar el equipo | `admin_empresa` · `responsable` | ✅ | D102 |
| HU-USR-05 | Corregir el nombre de una persona | `admin_empresa` | ✅ | D98 |
| HU-USR-06 | Corregir si un delegado es interno o externo | `admin_empresa` | 🟡 | D102 |
| HU-USR-07 | Dar de baja a una persona sin dejar controles huérfanos | `admin_empresa` | 🟡 | D98, D102, SEG-23, SEG-74 |
| HU-USR-08 | Reactivar a una persona | `admin_empresa` | 🟡 | D102, D103, SEG-72 |
| HU-USR-09 | No pasar del cupo de usuarios de mi empresa | `admin_empresa` · `responsable` | ✅ | D103, SEG-72 |
| HU-USR-10 | Fijar el cupo de usuarios de una empresa | `admin_monkey` | ✅ | D103, SEG-72, SEG-77 |
| HU-USR-11 | Organizar a los responsables en grupos | `admin_empresa` | ✅ | D102, D104 |
| HU-USR-12 | Crear el equipo de delegados de un responsable | `responsable` · `admin_empresa` | ✅ | D102, D104 |
| HU-USR-13 | Mover a un delegado a otro equipo | `admin_empresa` | ✅ | D102, SEG-73 |
| HU-USR-14 | Saber a qué responsable pertenezco | `delegado` | ✅ | D104 |
| HU-USR-15 | Asignar el dueño de cada control | `admin_empresa` | 🟡 | D102, SEG-73 |
| HU-USR-16 | Asignar el ejecutor de mis controles | `responsable` | 🟡 | D102, D104, SEG-73 |
| HU-USR-17 | Ver quién es dueño y ejecutor de cada control | Persona de empresa | 🟡 | D80, D102 |
| HU-USR-18 | Ver solo mis controles y el avance de lo mío | `responsable` · `delegado` | ✅ | D102, D118, SEG-76 |
| HU-USR-19 | Ver «Mi trabajo» al entrar | `responsable` · `delegado` | 🟡 | D102, D122 |
| HU-USR-20 | Ver la carga de trabajo de cada persona | `admin_empresa` | 🟡 | D102, D122 |
| HU-USR-21 | Invitar a otro administrador de Monkey | `admin_monkey` | ✅ | D117, SEG-80 |
| HU-USR-22 | Desactivar a un administrador con 7 días de gracia | `admin_monkey` | ✅ | D117, SEG-79, SEG-81 |
| HU-USR-23 | Reactivar a un administrador dentro de la gracia | `admin_monkey` | ✅ | D117, SEG-81 |
| HU-USR-24 | Saber quién hizo algo aunque su cuenta se haya borrado | `admin_monkey` | ✅ | D117, SEG-82 |
| HU-USR-25 | Buscar personas y ver el detalle de una persona | `admin_empresa` · `responsable` | ⚪ | P42 |
| HU-USR-26 | Ver el equipo de una empresa y darle soporte desde Monkey Admin | `admin_monkey` | ⚪ | P47, D103 |
| HU-USR-27 | Ver las cuentas sin ingreso reciente | `admin_empresa` | ⚪ | P41 |

---

### HU-USR-01 · Invitar a una persona a mi empresa

**Como** administrador de la empresa, **quiero** crear a cada persona del equipo e invitarla por correo **para** armar el
esquema completo (responsables, delegados, auditores y otros administradores).

- Puedo crear `admin_empresa`, `responsable`, `delegado` o `auditor`, nunca `admin_monkey` (D102 punto 2, D98 punto 4).
- Nombre y apellido son obligatorios (máx. 100) y el correo es único en toda la plataforma; si ya tiene cuenta, en
  cualquier empresa, el mensaje no revela de quién (`EMAIL_TAKEN`, D98 punto 5).
- Un `responsable` queda en el grupo «Responsables» (se crea si falta) o en el grupo de responsables que elija; su equipo
  de delegados **no** nace con él (D104). Si «Responsables» no lo lidera un `admin_empresa`, el alta no lo reutiliza
  (`RESPONSIBLES_GROUP_INVALID`).
- Un `delegado` va al equipo de un responsable que ya debe existir (`RESPONSIBLE_HAS_NO_TEAM`) y se marca si es interno o
  externo; `admin_empresa` y `auditor` no llevan grupo ni esa marca (`VALIDATION_FAILED`: `group_id.not_allowed`,
  `is_internal.not_allowed`; D102 puntos 3 y 11).
- La cuenta nace `pending` y el código de activación llega **solo por correo**: ni la respuesta, ni los logs, ni la
  auditoría lo traen; veo si el correo salió (`invitation.delivery_status`: `sent` o `failed`) (SEG-75).
- El correo no nombra al proveedor de la sonda ni de la nube (SEG-75).
- Queda el rastro `user.create` en la misma transacción.

### HU-USR-02 · Invitar a un delegado a mi equipo

**Como** responsable, **quiero** invitar a los delegados de mi equipo **para** repartirles la ejecución de mis controles.

- Solo puedo crear `delegado`; cualquier otro rol es `403` (D102 punto 2).
- El delegado entra en **mi** equipo, sin elegir grupo; si aún no lo he creado, `RESPONSIBLE_HAS_NO_TEAM` (D104 punto 3).
- Marco si es interno o externo; es solo una etiqueta, no cambia permisos (D102 punto 11).
- El código llega por correo como en HU-USR-01 (SEG-75).

### HU-USR-03 · Reenviar una invitación que no llegó

**Como** administrador de la empresa, **quiero** reenviar la invitación de una persona **para** que pueda activar su
cuenta si el correo no salió o el código venció.

- Solo mientras la cuenta esté `pending`; si ya activó, `USER_ALREADY_ACTIVE`.
- El código vigente se revoca y sale uno nuevo por correo; la respuesta trae solo `invitation`, nunca el código (SEG-75).
- Queda el rastro `user.activation_code_regenerate`.
- Límite conocido: el envío es directo, de un intento y sin cola, y el estado `failed` no se guarda (`DT-90`).

### HU-USR-04 · Ver y filtrar el equipo

**Como** administrador de la empresa o responsable, **quiero** ver la lista de personas **para** saber quién está, en qué
grupo y en qué estado.

- El `admin_empresa` ve a todo el equipo (a sí mismo en solo lectura); el `responsable`, solo a su equipo. `delegado`,
  `auditor` y `admin_monkey` reciben `403` (D102 punto 9).
- La lista es paginada y se filtra por rol, estado, grupo e interno o externo; se ordena por fecha de alta o correo.
- Cada persona muestra su grupo y, si es `delegado`, su responsable (el líder del grupo, D102 punto 3).
- Nunca trae el código de activación ni su hash.

### HU-USR-05 · Corregir el nombre de una persona

**Como** administrador de la empresa, **quiero** corregir el nombre y el apellido de cualquier persona del equipo, incluido
yo **para** que la auditoría y las asignaciones muestren a quien corresponde.

- Nombre y apellido, máx. 100 (D98 punto 3); el rol no se cambia.
- Sobre mí mismo solo puedo corregir mi nombre.
- Queda `user.update` con el antes y el después.

### HU-USR-06 · Corregir si un delegado es interno o externo

**Como** administrador de la empresa, **quiero** corregir si un delegado es de la compañía o externo **para** que la
etiqueta refleje la realidad.

- Solo en un `delegado`; en otro rol, `VALIDATION_FAILED` (`is_internal.not_allowed`) (D102 punto 11).
- La etiqueta no cambia permisos.
- 🟡 La API está construida (MD-191); la pantalla aún no lo ofrece.

### HU-USR-07 · Dar de baja a una persona sin dejar controles huérfanos

**Como** administrador de la empresa, **quiero** desactivar a quien deja el equipo, sabiendo qué pasa con sus controles,
**para** cortar su acceso sin perder el historial ni dejar trabajo sin dueño.

- Dar de baja es desactivar: nada se borra y su historial se conserva (D102 punto 10, SEG-74).
- Al desactivar se cierran **todas** sus sesiones al instante y la siguiente petición ya no entra (SEG-23, CC6.3), y se
  libera su cupo.
- Si tiene controles como dueño o ejecutor, el servidor avisa con cuántos (`USER_HAS_ASSIGNMENTS`, `controls_count`) y
  pide confirmación (`confirm_unassign`).
- Con confirmación: un `delegado` deja sus controles con su dueño, sin ejecutor; un `responsable` sin delegados o un
  `admin_empresa` dejan los suyos «Sin asignar» (D102 punto 10).
- Un `responsable` con delegados activos o pendientes no se desactiva, ni con confirmación (`RESPONSIBLE_HAS_DELEGATES`,
  `delegates_count`).
- No puedo desactivarme ni dejar la empresa sin administrador (`LAST_ADMIN`, D98 punto 4); a otro `admin_empresa`, sí.
- Una cuenta `pending` no se desactiva (`USER_NOT_ACTIVATED`).
- Queda `user.update` (con `sessions_closed` y `controls_unassigned`) y un `control_assignment.set` por cada control que
  cambia, en la misma transacción.
- 🟡 La API está construida (MD-191, SEG-74 cumplido); la pantalla aún no muestra el aviso de controles ni el bloqueo por
  delegados.

### HU-USR-08 · Reactivar a una persona

**Como** administrador de la empresa, **quiero** reactivar a alguien que di de baja **para** devolverle el acceso si
vuelve.

- Reactivar vuelve a comprobar el cupo (`USER_LIMIT_REACHED`, D103, SEG-72).
- No le devuelve sus asignaciones: los controles que dejó siguen «Sin asignar».
- Un `delegado` cuyo responsable no está `active` ni `pending` no se reactiva hasta moverlo a otro equipo
  (`TEAM_LEADER_INACTIVE`).
- Si se reactiva un `responsable`, vuelve a liderar el equipo que tenía.
- Una cuenta `pending` no se reactiva (`USER_NOT_ACTIVATED`).
- 🟡 La API está construida (MD-187, MD-191); la pantalla no trata todavía los avisos de MD-191.

### HU-USR-09 · No pasar del cupo de usuarios de mi empresa

**Como** administrador de la empresa o responsable, **quiero** que el sistema me diga cuándo llegué al cupo contratado
**para** saber por qué no puedo invitar a más.

- Cuentan las cuentas `active`, `pending` y `suspended` de cualquier rol; una invitada que aún no activó **cuenta** (D103
  punto 2).
- Al llegar al tope, invitar o reactivar responde `USER_LIMIT_REACHED` con `max_users` y `users_count`.
- Desactivar a alguien libera su lugar.
- Dos altas simultáneas con un solo lugar libre: entra una sola (SEG-72).

### HU-USR-10 · Fijar el cupo de usuarios de una empresa

**Como** administrador de Monkey, **quiero** fijar y subir el número de usuarios de cada empresa **para** cobrar según lo
contratado.

- Solo `admin_monkey` lo cambia (D103 punto 1); no puede bajar del uso actual (`MAX_USERS_BELOW_CURRENT`, en
  [`contracts/empresas.md`](../../../../../../contracts/empresas.md)).
- Ve el cupo junto al uso de cada empresa; el conteo entre empresas devuelve solo números, nunca datos de personas
  (SEG-77).
- `admin_monkey` no crea ni desactiva cuentas de una empresa (D103).

### HU-USR-11 · Organizar a los responsables en grupos

**Como** administrador de la empresa, **quiero** crear grupos de responsables con nombre y renombrarlos **para** ordenar a
mi equipo (p. ej. «Responsables - Servicio IA»).

- Un grupo creado sin líder es de responsables y lo lidero yo (`kind = responsables`) (D102 punto 3).
- El nombre es único en la empresa (`GROUP_NAME_TAKEN`); «Responsables» está reservado: nadie lo usa y ese grupo no se
  renombra (`GROUP_RESERVED`, D104).
- Veo todos los grupos con su clase, su líder y cuántas personas tiene.
- Queda `group.create` o `group.update`.

### HU-USR-12 · Crear el equipo de delegados de un responsable

**Como** responsable (o el administrador por él), **quiero** crear mi equipo de delegados cuando lo necesite **para**
empezar a repartir la ejecución de mis controles.

- El equipo no nace con el responsable: mientras no lo crea, trabaja solo (D104 punto 2).
- Un responsable lidera un solo equipo; pedir otro es `TEAM_ALREADY_EXISTS` (D102 punto 3, D104 punto 3).
- El `admin_empresa` lo crea indicando el responsable (activo o pendiente); si no es un responsable de la empresa, `404`.
  Un responsable que indica a otro recibe `403`.
- El responsable solo ve su grupo; sin equipo, la lista llega vacía.

### HU-USR-13 · Mover a un delegado a otro equipo

**Como** administrador de la empresa, **quiero** mover a un delegado al equipo de otro responsable **para** reorganizar el
trabajo.

- Solo el `admin_empresa` mueve, y solo a un `delegado`; mover a otro rol es `VALIDATION_FAILED` (`group_id.not_allowed`)
  (D102 punto 3).
- El destino es el equipo de un responsable `active` o `pending` de la empresa (`404` si no).
- Si ejecuta controles, se me avisa (`USER_HAS_ASSIGNMENTS`) y, al confirmar, esos controles se quedan con su dueño y sin
  ejecutor.
- Queda `user.update` con el grupo antes y después y un `control_assignment.set` por control (SEG-73).

### HU-USR-14 · Saber a qué responsable pertenezco

**Como** delegado, **quiero** ver quién es mi responsable **para** saber a quién acudir.

- Mi responsable es el líder de mi grupo, no se guarda aparte, y llega en mi perfil (`GET /v1/auth/me`) (D104 punto 4).

### HU-USR-15 · Asignar el dueño de cada control

**Como** administrador de la empresa, **quiero** asignar a cada control un dueño, uno a uno o en bloque, **para** que cada
control tenga quien responda por él.

- El dueño es un `responsable` activo o pendiente de la empresa, o yo mismo; otro es `OWNER_NOT_ELIGIBLE` (D102 punto 5).
- La unidad es el control del cliente: el mismo control en dos servicios se asigna dos veces y uno nuevo llega «Sin
  asignar» (D102 punto 4).
- Hasta 200 controles por operación, todo o nada: un control dado de baja cancela toda la operación (`CONTROL_RETIRED`).
- Quitar el dueño deja el control «Sin asignar»; cambiarlo limpia el ejecutor (D102 punto 6).
- Puedo elegir todos los de una categoría (`CC`) o un requisito (`CC6.1`) con los filtros.
- Cada control que cambia deja un `control_assignment.set`; nadie asigna fuera de su empresa (SEG-73).
- 🟡 La API está construida (MD-192); la pantalla «Asignación» es provisional (MD-199, MD-200).

### HU-USR-16 · Asignar el ejecutor de mis controles

**Como** responsable, **quiero** elegir qué delegado de mi equipo ejecuta cada uno de mis controles **para** repartir el
trabajo.

- Solo sobre controles de los que soy dueño; uno ajeno es `403` (D102 punto 6).
- El ejecutor es un `delegado` activo o pendiente de mi equipo; otro es `EXECUTOR_NOT_IN_TEAM`. No asigno a otro
  responsable.
- Quitar el ejecutor significa que ejecuto yo; sin equipo, solo puedo dejarlo vacío (D104).
- Hasta 200 controles por operación, todo o nada (`CONTROL_RETIRED`); cada cambio deja `control_assignment.set` (SEG-73).
- 🟡 La API está construida (MD-192); la pantalla «Asignar ejecutor» es provisional.

### HU-USR-17 · Ver quién es dueño y ejecutor de cada control

**Como** persona de empresa, **quiero** ver los controles con su dueño y su ejecutor **para** saber quién responde por cada
uno.

- El `admin_empresa` y el `auditor` ven todos (el auditor en solo lectura, con la cadena completa); el `responsable`, los
  suyos; el `delegado`, los que ejecuta. `admin_monkey` recibe `403` (D102 punto 9).
- Cada control lleva su código (`IAC-12`, D80), los requisitos que cubre (`CC6.1`), su servicio, su estado y si está «Sin
  asignar».
- Se filtra por servicio, marco, categoría, requisito, estado, asignación, dueño, ejecutor y texto.
- 🟡 La API está construida (MD-192); la pantalla es provisional.

### HU-USR-18 · Ver solo mis controles y el avance de lo mío

**Como** responsable o delegado, **quiero** ver en Cumplimiento solo mis controles y su avance **para** concentrarme en lo
que me toca.

- El `responsable` ve los controles de los que es dueño (incluidos los que ejecutan sus delegados); el `delegado`, los que
  ejecuta (D102 punto 9).
- El resumen cuenta solo lo mío, nunca el avance de la empresa (D118); sin controles, las listas llegan vacías, sin error.
- Lo ajeno de mi empresa es `403`; lo de otra empresa, `404`; la vista técnica es `403` para mí (SEG-76).

### HU-USR-19 · Ver «Mi trabajo» al entrar

**Como** responsable o delegado, **quiero** entrar a una lista con lo que tengo pendiente **para** saber qué hacer primero.

- Es mi vista de entrada: mis controles con lo que debo subir, lo rechazado y, si soy responsable, lo que debo revisar
  (D102 punto 12).
- Cada control cae en un solo grupo, en este orden: rechazado → por revisar (solo el responsable dueño) → por subir → en
  revisión → listo (D122).
- Cada control muestra cuántas cosas le faltan, incluidas las observaciones abiertas del auditor.
- Veo el avance de lo mío con estado, controles hechos sobre el total y cobertura juntos; el porcentaje lo deriva la
  pantalla (D122).
- El `admin_empresa` no tiene «Mi trabajo» (`403`): ve todo en Cumplimiento.
- 🟡 La API está construida (MD-195); la pantalla es provisional (MD-201).

### HU-USR-20 · Ver la carga de trabajo de cada persona

**Como** administrador de la empresa, **quiero** ver cuántos controles tiene cada persona y cómo avanza **para** repartir
mejor.

- Sale cada `responsable` y `delegado` activo (con cero si no tiene) y cada `admin_empresa` dueño de algún control, sin
  tope ni paginación (D122 punto 3).
- De cada uno: controles de los que es dueño, los que ejecuta y su avance (estado, hechos sobre total y cobertura) (D122).
- Veo también cuántos controles de la empresa están «Sin asignar».
- Solo el `admin_empresa`; los demás roles, `403` (D102 punto 9).
- 🟡 La API está construida (MD-195); la pantalla aún no existe (MD-204).

### HU-USR-21 · Invitar a otro administrador de Monkey

**Como** administrador de Monkey, **quiero** invitar a otro administrador por correo **para** no depender de la consola.

- Pido mi código del segundo factor (`MFA_CODE_INVALID`, `ACCOUNT_LOCKED`) (D117 punto 6, SEG-80).
- El rol solo puede ser `admin_monkey`; otro es `VALIDATION_FAILED` (`role.not_allowed`) (D117 punto 1).
- El correo es único (`EMAIL_TAKEN`); la cuenta nace `pending` y no inicia sesión hasta activarse en Monkey Admin.
- El código va solo por correo, que no nombra al proveedor de la sonda ni de la nube (SEG-80); puedo reenviarlo mientras
  esté `pending` (`USER_ALREADY_ACTIVE` si ya activó).
- La empresa interna de Monkey no tiene cupo: nunca `USER_LIMIT_REACHED` (D117 punto 7).
- Queda `admin.invite` (o `admin.activation_code_regenerate`).

### HU-USR-22 · Desactivar a un administrador con 7 días de gracia

**Como** administrador de Monkey, **quiero** desactivar a otro administrador **para** quitarle el acceso cuando deja el
equipo.

- Pido mi código del segundo factor (D117 punto 6).
- No puedo desactivarme (`CANNOT_DEACTIVATE_SELF`) ni dejar a Monkey sin administrador activo, ni con dos bajas
  simultáneas (`LAST_ADMIN`, SEG-79).
- La cuenta pasa a `inactive`, sus sesiones se cierran al instante y se fija su borrado a 7 días (`purge_at`) (SEG-81).
- Antes de confirmar se me avisa que en 7 días se borra y que hasta entonces puedo reactivarla.
- Ya inactiva es `ADMIN_ALREADY_INACTIVE`; una `pending` es `USER_NOT_ACTIVATED`.
- Al vencer la gracia, un proceso programado borra la cuenta y todo lo que permite entrar (D117 punto 3, SEG-81).

### HU-USR-23 · Reactivar a un administrador dentro de la gracia

**Como** administrador de Monkey, **quiero** reactivar a un administrador desactivado **para** corregir una baja hecha por
error.

- Solo dentro de los 7 días; pasado el plazo la cuenta ya no existe (`404`) y hay que invitarla de nuevo (D117 punto 3).
- No pide mi segundo factor (D117 punto 6).
- La persona debe iniciar sesión otra vez: sus sesiones anteriores siguen cerradas.
- Si no está en gracia, `ADMIN_NOT_INACTIVE`. Queda `admin.reactivate`.

### HU-USR-24 · Saber quién hizo algo aunque su cuenta se haya borrado

**Como** administrador de Monkey, **quiero** que la auditoría siga mostrando el nombre de un administrador purgado **para**
no perder la atribución de lo que hizo.

- Al purgar se guarda un sello con id, nombre completo y rol, nunca el correo ni nada de acceso (D117 punto 4).
- Donde un registro atribuye algo a esa persona, se muestra su sello como «Administrador eliminado» (SEG-82).
- La auditoría sigue siendo solo de añadir; la purga deja `admin.purge` con un actor del sistema y es idempotente.
- El correo queda libre para volver a invitarla (D117 punto 5).

### HU-USR-25 · Buscar personas y ver el detalle de una persona

**Como** administrador de la empresa o responsable, **quiero** buscar a una persona por nombre o correo y ver su detalle
**para** encontrarla rápido en un equipo grande.

- ⚪ Depende de `P42` (abierta): si se agrega un buscador a la lista, si hace falta un detalle con historial y controles
  asignados, y qué ve el responsable de su equipo. Hoy hay filtros y un panel de solo lectura.

### HU-USR-26 · Ver el equipo de una empresa y darle soporte desde Monkey Admin

**Como** administrador de Monkey, **quiero** ver el equipo de una empresa y ayudar a sus personas **para** dar soporte sin
pedir acceso al cliente.

- ⚪ Depende de `P47` (abierta): ver el equipo en solo lectura, reenviar invitaciones o restablecer el segundo factor de
  una persona de una empresa, y quién lo haría (D103 dejó el rol de soporte sin definir). Hoy `admin_monkey` recibe `403`
  en `/v1/users`.

### HU-USR-27 · Ver las cuentas sin ingreso reciente

**Como** administrador de la empresa, **quiero** ver qué cuentas activas no han entrado hace tiempo **para** revisar
accesos que sobran.

- ⚪ Depende de `P41` (abierta): el plazo, si una cuenta recién creada que no ha entrado cuenta, y qué otras señales se
  muestran. Desarrollo lo dejó provisional en 30 días en el Inicio; el comité no lo ha validado.
