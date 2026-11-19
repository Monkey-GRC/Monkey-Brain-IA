# Autenticación · historias de usuario

Responde: **¿qué necesita cada persona para entrar, mantenerse dentro y recuperar el acceso, y cómo se comprueba que lo
tiene?** Cada historia dice quién, qué y para qué; sus criterios de aceptación son verificables y citan la regla que los
fija. El detalle técnico (cuerpos, errores) está en el [contrato](../../../../../../contracts/autenticacion.md); la
secuencia, en [`03-flujos.md`](03-flujos.md); los pasos de cada caso, en [`05-casos-de-uso.md`](05-casos-de-uso.md).

**Jira:** épica [MD-247](https://rod2408.atlassian.net/browse/MD-247), una historia por fila. El cerebro manda: si una
historia cambia, se actualiza aquí y después su issue.

**Roles** (D96): `admin_empresa`, `responsable`, `delegado`, `auditor` (Monkey Platform) y `admin_monkey` (Monkey Admin).
«Persona» = cualquiera de ellos. **Estado** de cada historia: ✅ construida · 🟡 parcial · ⚪ por construir.

## Resumen

| ID | Historia | Rol | Estado | Reglas | Jira |
|---|---|---|---|---|---|
| HU-AUTH-01 | Activar la cuenta de mi empresa con la clave de acceso | `admin_empresa` | ✅ | D43, D51 | MD-248 |
| HU-AUTH-02 | Activar mi cuenta con el código que me dio mi administrador | `responsable` · `delegado` · `auditor` | ✅ | D95, D96, SEG-64 | MD-249 |
| HU-AUTH-03 | Configurar el segundo factor la primera vez | Persona | ✅ | D66, D94, SEG-16 | MD-250 |
| HU-AUTH-04 | Iniciar sesión con contraseña y código | Persona | ✅ | D94, SEG-10, SEG-11 | MD-251 |
| HU-AUTH-05 | Entrar con un código de recuperación si no tengo el celular | Persona | ✅ | D94 | MD-252 |
| HU-AUTH-06 | Recordar este dispositivo 30 días | Persona salvo `admin_monkey` | ✅ | D123, SEG-84 | MD-253 |
| HU-AUTH-07 | Ver y olvidar mis dispositivos recordados | Persona salvo `admin_monkey` | ✅ | D123, SEG-84 | MD-254 |
| HU-AUTH-08 | Seguir dentro mientras trabajo y salir sola si me voy | Persona | ✅ | §5.3, SEG-12 | MD-255 |
| HU-AUTH-09 | Cerrar sesión sin dejar rastro en el navegador | Persona | ✅ | D123 | MD-256 |
| HU-AUTH-10 | Cambiar mi contraseña cuando quiera | Persona | ✅ | D101, SEG-14 | MD-257 |
| HU-AUTH-11 | Recuperar mi contraseña si la olvidé | Persona | ✅ | D101, SEG-14 | MD-258 |
| HU-AUTH-12 | Regenerar mis códigos de recuperación | Persona | ✅ | D94 | MD-259 |
| HU-AUTH-13 | Restablecer el segundo factor de alguien de mi equipo | `admin_empresa` | ✅ | D94 punto 8 | MD-260 |
| HU-AUTH-14 | Recibir mis correos en mi idioma | Persona | ✅ | D111 | MD-261 |

---

### HU-AUTH-01 · Activar la cuenta de mi empresa con la clave de acceso

**Como** administrador de una empresa recién contratada, **quiero** activar la cuenta con la clave que me envió Monkey
**para** empezar a configurar mi empresa.

- Dado una clave vigente, cuando la escribo (con o sin guiones, en mayúsculas o minúsculas), entonces veo la razón social
  y el correo que fijó Monkey, sin gastar la clave (D51).
- Dado ese paso, cuando pongo una contraseña que cumple la política (SEG-13), entonces se crea mi cuenta `admin_empresa`
  con ese correo y la clave queda gastada (un solo uso).
- Dado que el segundo factor es obligatorio, entonces no entro todavía: sigo a configurarlo (HU-AUTH-03).
- Si la clave venció, ya se usó o no existe, el mensaje no revela cuál de las dos últimas es (`ACCESS_KEY_INVALID`).
- Diez intentos fallidos desde la misma dirección en 15 min frenan el canje (`ACCESS_KEY_RATE_LIMITED`).

### HU-AUTH-02 · Activar mi cuenta con el código que me dio mi administrador

**Como** persona invitada a una empresa, **quiero** activar mi cuenta con el código de un solo uso **para** entrar con mi
propia contraseña.

- El código solo sirve con el correo con el que se creó la cuenta y caduca a los 7 días (D95).
- Al activar, la cuenta pasa de `pending` a `active` en una sola operación; después configuro el segundo factor.
- Una cuenta `pending` no puede iniciar sesión ni recuperar contraseña: solo activarse.
- El código nunca aparece en la auditoría (SEG-64).

### HU-AUTH-03 · Configurar el segundo factor la primera vez

**Como** persona que entra por primera vez, **quiero** vincular mi app de autenticación **para** proteger mi cuenta.

- Veo un QR (dibujado en el navegador; el secreto no sale a ningún servicio) y la clave para escribirla a mano.
- Confirmo con el primer código de la app; recibo **10 códigos de recuperación que solo veo una vez**.
- Puedo marcar «Recordar este dispositivo por 30 días» al confirmar (HU-AUTH-06).
- El desafío dura 5 minutos; si vence, vuelvo a iniciar sesión.

### HU-AUTH-04 · Iniciar sesión con contraseña y código

**Como** persona con cuenta, **quiero** entrar con mi correo, mi contraseña y el código de mi app **para** usar Monkey
con la seguridad de dos factores.

- Si el correo o la contraseña fallan, el mensaje no dice cuál de los dos (`INVALID_CREDENTIALS`).
- A los 5 intentos fallidos la cuenta se bloquea 15 minutos y se me dice cuánto falta (`ACCOUNT_LOCKED`).
- Con la contraseña correcta paso a escribir el código; el código se envía solo al completar los 6 dígitos.
- Un código ya usado no sirve otra vez; un código equivocado suma al bloqueo.
- Monkey Admin solo admite `admin_monkey`; Monkey Platform no lo admite (D24).

### HU-AUTH-05 · Entrar con un código de recuperación

**Como** persona que perdió el celular, **quiero** entrar con uno de mis códigos de recuperación **para** no quedarme
fuera de mi cuenta.

- Cada código sirve una sola vez; al entrar se me dice cuántos me quedan.
- Si se me acaban o pierdo también los códigos, mi administrador restablece mi segundo factor (HU-AUTH-13).

### HU-AUTH-06 · Recordar este dispositivo 30 días

**Como** persona que entra a diario desde el mismo computador, **quiero** que no me pida el código en cada ingreso **para**
entrar más rápido sin perder seguridad.

- La casilla está desmarcada por defecto; aparece al verificar el código, al usar un código de recuperación y al
  configurar el segundo factor (D123).
- En ese navegador, el próximo ingreso pide **solo la contraseña**; la sesión sigue venciendo igual (HU-AUTH-08).
- Vale 30 días desde que lo marco, sin renovarse con el uso, y solo para mí: otra persona en el mismo navegador ve su
  código.
- Deja de valer al cerrar sesión, al cambiar o recuperar la contraseña, al restablecer el segundo factor, al regenerar los
  códigos, al darme de baja o al archivar mi empresa.
- `admin_monkey` no ve la casilla; si la enviara, la API lo rechaza sin gastar el código (`REMEMBER_DEVICE_NOT_ALLOWED`).

### HU-AUTH-07 · Ver y olvidar mis dispositivos recordados

**Como** persona, **quiero** ver desde qué navegadores entro sin código y olvidar los que no reconozca **para** controlar
el acceso a mi cuenta.

- En Ajustes → Seguridad → Control de acceso → Dispositivos recordados los veo agrupados por tipo y sistema
  («Computador · Linux»), con navegador, ubicación aproximada, IP y fechas; el actual lleva «Este dispositivo».
- Puedo olvidar uno o todos; siempre se me pide confirmación.
- No puedo olvidar el dispositivo de otra persona (`DEVICE_NOT_FOUND`).

### HU-AUTH-08 · Seguir dentro mientras trabajo y salir sola si me voy

**Como** persona, **quiero** que mi sesión se mantenga mientras uso Monkey y se cierre sola si la dejo abierta **para** no
re-entrar a cada rato ni dejar una sesión expuesta.

- La sesión se cierra a los **30 minutos sin actividad** y a las **8 horas** de abierta, aunque siga activa (§5.3).
- Mientras trabajo, la renovación es invisible; si otra pestaña renovó a la vez, no me saca.
- Si desactivan mi cuenta, la siguiente petición ya no entra (el rol y el estado se leen de la base en cada petición).

### HU-AUTH-09 · Cerrar sesión sin dejar rastro en el navegador

**Como** persona que usa un equipo compartido, **quiero** que «Cerrar sesión» no deje nada que permita volver a entrar
como yo **para** proteger mi cuenta.

- Se cierra la sesión y se olvida el dispositivo recordado de ese navegador, aunque la sesión ya hubiera vencido (D123).
- El siguiente ingreso vuelve a pedir el código y a ofrecer la casilla.

### HU-AUTH-10 · Cambiar mi contraseña cuando quiera

**Como** persona, **quiero** cambiar mi contraseña cuando lo decida **para** reaccionar si sospecho que alguien la conoce.

- Pido la contraseña actual y un código de mi app; la contraseña no vence por calendario (D101).
- La nueva cumple la política y no repite la actual ni las 5 anteriores (`PASSWORD_REUSED`); veo los requisitos en un
  globo junto al campo que se marca a medida que los cumplo.
- Mi sesión actual sigue; las demás se cierran y mis dispositivos recordados se olvidan; recibo un aviso por correo.
- Máximo 3 cambios en 24 horas (`PASSWORD_CHANGE_LIMIT`).

### HU-AUTH-11 · Recuperar mi contraseña si la olvidé

**Como** persona que olvidó su contraseña, **quiero** recibir un enlace por correo **para** poner una nueva sin ayuda.

- Al pedirlo, la respuesta es la misma exista o no la cuenta (no revela cuentas); solo se envía a una cuenta `active`.
- El enlace dura 30 minutos, sirve una vez y uno nuevo invalida los anteriores; máximo 5 por hora.
- Además del enlace, se pide el código de mi app o uno de recuperación.
- Al guardarla se cierran **todas** mis sesiones y se olvidan mis dispositivos recordados.

### HU-AUTH-12 · Regenerar mis códigos de recuperación

**Como** persona, **quiero** generar códigos de recuperación nuevos **para** reemplazar los que usé o perdí.

- Pido un código de mi app; recibo 10 códigos nuevos que solo veo una vez y los anteriores dejan de servir.
- Mis dispositivos recordados se olvidan (D123).

### HU-AUTH-13 · Restablecer el segundo factor de alguien de mi equipo

**Como** administrador de la empresa, **quiero** restablecer el segundo factor de una persona de mi equipo **para** que
recupere el acceso si perdió el celular y los códigos.

- Solo sobre `responsable`, `delegado` o `auditor` de mi empresa, y nunca sobre mí mismo.
- Se borran su secreto y sus códigos, se cierran sus sesiones y se olvidan sus dispositivos; en su próximo ingreso lo
  configura de nuevo.
- A un `admin_empresa` lo restablece Monkey por script, tras verificar su identidad por otro canal (D94 punto 8).

### HU-AUTH-14 · Recibir mis correos en mi idioma

**Como** persona, **quiero** que los correos de mi cuenta lleguen en el idioma en que uso Monkey **para** entenderlos.

- Al cambiar de idioma se guarda en mi cuenta; los correos de recuperar y de contraseña cambiada salen en ese idioma
  (D111).
