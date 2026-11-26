# Notificaciones · historias de usuario

Responde: **¿cómo se entera cada persona de que tiene algo que hacer o de que algo cambió en su cuenta, y cómo se
comprueba?** Salen **correos transaccionales** por el puerto `Mailer` (D99): la clave de acceso, las invitaciones y
los dos avisos de la contraseña; y, desde MD-515 (2026-11-25), la **campana** de avisos en la app con su **resumen diario
por correo** y sus preferencias (D138 los eventos y destinatarios, D143 el canal, la frecuencia y el centro, D151 el funcionamiento).
Siguen ⚪ los avisos cuyo evento aún no existe (el control que deja de cumplir, la observación del auditor, el borrado de una empresa). Los pasos
de cada caso están en [`05-casos-de-uso.md`](05-casos-de-uso.md); los cuerpos y errores, en los contratos de cada módulo
que envía ([`empresas`](../../../../../../contracts/empresas.md), [`gestion-usuarios`](../../../../../../contracts/gestion-usuarios.md),
[`administradores`](../../../../../../contracts/gestion-usuarios/administradores.md),
[`autenticacion`](../../../../../../contracts/autenticacion.md)); la campana y el resumen tienen el suyo:
[`notificaciones`](../../../../../../contracts/notificaciones.md).

**Roles** (D96, D102, D136): `admin_empresa`, `responsable`, `delegado`, `auditor`, `colaborador` (Monkey Platform) y `admin_monkey` (Monkey Admin).
«Persona» = cualquiera de ellos. **Estado** de cada historia: ✅ construida · 🟡 parcial · ⚪ por construir.

## Resumen

| ID | Historia | Rol | Estado | Reglas |
|---|---|---|---|---|
| HU-NOT-01 | Recibir por correo la clave de acceso de mi empresa | `admin_empresa` (aún sin cuenta) | ✅ | D99, SEG-71 |
| HU-NOT-02 | Recibir por correo mi invitación con el código de activación | Persona invitada | ✅ | D102 punto 14, D117, SEG-75 |
| HU-NOT-03 | Saber si el correo salió y reenviarlo si no llegó | `admin_monkey` · `admin_empresa` · `responsable` | ✅ | D99, DT-90 |
| HU-NOT-04 | Recibir el enlace para recuperar mi contraseña | Persona | ✅ | D101, SEG-14 |
| HU-NOT-05 | Enterarme por correo de que cambió mi contraseña | Persona | ✅ | D101 |
| HU-NOT-06 | Recibir correos en mi idioma, sin secretos a la vista ni nombres de proveedores | Persona | ✅ | D111, D70, SEG-39, SEG-75 |
| HU-NOT-07 | Enterarme de que me asignaron o reasignaron un control | `responsable` · `delegado` | ✅ | D138, D143, D102 |
| HU-NOT-08 | Enterarme de que mi evidencia fue validada o rechazada | `responsable` · `delegado` · `admin_empresa` | ✅ | D138, D143 |
| HU-NOT-09 | Enterarme de que un control dejó de cumplir o la evaluación automática falló | `admin_empresa` · `responsable` · `delegado` | ⚪ | D138, D143, D70 |
| HU-NOT-10 | Enterarme de una observación nueva del auditor | `responsable` · `delegado` | ⚪ | D138, D143, D102 punto 9 |
| HU-NOT-11 | Recibir recordatorios antes de que algo venza | `admin_empresa` · `responsable` · `delegado` | ✅ | D131, D138, D143, D151 |
| HU-NOT-12 | Ver mis avisos en un centro de notificaciones dentro de la app | Persona de Platform | ✅ | D143, D151, SEG-87 |
| HU-NOT-13 | Elegir cómo y cada cuánto recibo los avisos | Persona de Platform | 🟡 | D143 |
| HU-NOT-14 | Enterarme a tiempo de que una empresa archivada está por borrarse | `admin_monkey` | ⚪ | D97, DT-83 |

---

### HU-NOT-01 · Recibir por correo la clave de acceso de mi empresa

**Como** administrador de una empresa recién contratada, **quiero** recibir la clave de acceso en el correo administrativo
que registró Monkey **para** activar la cuenta sin que la clave pase por otras manos.

- Dado que `admin_monkey` registra la empresa, entonces la clave sale **solo** por correo al `admin_email`: no viaja en la
  respuesta de `POST /v1/companies` ni se muestra en ninguna pantalla (D99 punto 1, SEG-71).
- El correo lleva lo mínimo: nombre de la empresa, la clave, cuándo vence y a dónde ir (D99 punto 4).
- Si el correo no sale, la empresa queda creada igual (`delivery_status: "failed"`) y se reenvía (HU-NOT-03) (D99 punto 2).
- Cada envío, exitoso o fallido, deja `access_key.email` en la auditoría, sin la clave (`contracts/conventions.md`).
- En producción el servidor no arranca sin un servicio de correo real (D99 punto 5, SEG-71).

### HU-NOT-02 · Recibir por correo mi invitación con el código de activación

**Como** persona a la que invitaron a una empresa (o a Monkey Admin), **quiero** recibir el código de activación por
correo **para** activar mi cuenta sin que nadie me lo tenga que pasar a mano.

- Dado que el `admin_empresa` o el `responsable` me dan de alta (`POST /v1/users`), o un `admin_monkey` me invita
  (`POST /v1/admins`), entonces el código me llega por correo después de guardarse la cuenta (D102 punto 14, D117).
- El código nunca viaja en la respuesta de la API, en los logs ni en la auditoría (SEG-75); la respuesta solo trae
  `invitation: { delivery_status, expires_at }`.
- El correo dice quién me invitó y a qué empresa, y cuándo vence el código (7 días por defecto, D95).
- La activación con ese código es [HU-AUTH-02](../autenticacion/04-historias.md).

### HU-NOT-03 · Saber si el correo salió y reenviarlo si no llegó

**Como** quien envía una clave o una invitación, **quiero** ver si el correo salió y poder reenviarlo **para** que la
persona no se quede sin forma de entrar.

- La respuesta del alta dice `sent` (el servicio aceptó el mensaje) o `failed` (no salió); `sent` no garantiza que llegue
  a la bandeja (`contracts/empresas.md`).
- Reenviar **emite otra clave u otro código** y anula el anterior: `POST /v1/companies/{id}/access-key/regenerate`
  (`admin_monkey`), `POST /v1/users/{id}/activation-code` (`admin_empresa`), `POST /v1/admins/{id}/activation-code`
  (`admin_monkey`) (D99 punto 3).
- Si la clave ya se canjeó → `409 ACCESS_KEY_NOT_PENDING`; si la cuenta ya está activa → `409 USER_ALREADY_ACTIVE`.
- Límite conocido: un solo intento, sin cola, y `failed` no se guarda ni sale en el listado (DT-90).

### HU-NOT-04 · Recibir el enlace para recuperar mi contraseña

**Como** persona que olvidó su contraseña, **quiero** recibir un enlace por correo **para** crear una nueva.

- `POST /v1/auth/password/forgot` responde siempre `202` con el mismo cuerpo, exista o no la cuenta; solo envía a una
  cuenta `active` (D101 punto 3).
- El enlace es de un solo uso, dura 30 minutos y lleva a la app de quien lo pidió (Monkey Admin o Monkey Platform).
- Más de 5 enlaces por cuenta en una hora: sigue respondiendo `202` y no envía otro.
- Sin dirección de la app configurada no se envía un enlace roto: queda un aviso en el log.
- El flujo completo es [HU-AUTH-11](../autenticacion/04-historias.md).

### HU-NOT-05 · Enterarme por correo de que cambió mi contraseña

**Como** persona con cuenta, **quiero** un aviso por correo cada vez que cambia mi contraseña **para** darme cuenta si no
fui yo.

- Dado un cambio voluntario o una recuperación, entonces llega el aviso de contraseña cambiada (D101 puntos 2 y 3).
- El aviso no lleva la contraseña.
- Un fallo del correo no revierte el cambio: queda solo en el log, sin el cuerpo del mensaje.

### HU-NOT-06 · Recibir correos en mi idioma, sin secretos a la vista ni nombres de proveedores

**Como** persona que recibe un correo de Monkey, **quiero** que me hable en mi idioma y sin exponer nada interno **para**
entenderlo y confiar en él.

- Recuperar la contraseña y el aviso de cambio salen en mi idioma guardado; la invitación y la clave, en el idioma de quien
  las envía, y la cuenta invitada nace con ese idioma (D111 punto 2). Las fechas siguen ese idioma.
- Ningún correo nombra al proveedor de la sonda ni de la evaluación automática (D70, SEG-39).
- Un correo que lleva un secreto de un solo uso se marca confidencial: ningún registro escribe su cuerpo (SEG-75).
- Cada correo va en texto y en HTML con el logo incrustado (se ve aunque el cliente bloquee imágenes remotas).

### HU-NOT-07 · Enterarme de que me asignaron o reasignaron un control

**Como** `responsable` o `delegado`, **quiero** enterarme cuando me asignan un control o me lo quitan **para** saber qué
tengo que atender sin entrar a revisar.

- **Construido (MD-515):** `control_assigned` llega a la campana de la persona asignada, en la misma transacción de la asignación (`PUT /v1/assignments/*`); quien asigna no se avisa a sí mismo.
- Quién es dueño y ejecutor está decidido (D102 puntos 5 y 6); **canal y frecuencia: en la app al instante y por correo en resumen diario** (D143).
- El texto sigue la plantilla de 7 campos de `producto/philosophy.md`.

### HU-NOT-08 · Enterarme de que mi evidencia fue validada o rechazada

**Como** quien subió una evidencia, **quiero** saber cuándo la revisan y con qué resultado **para** corregirla a tiempo si la
rechazan.

- **Construido (MD-515):** `evidence_approved` y `evidence_rejected` llegan a quien subió la evidencia y al dueño del control, al revisarla.
- Qué evento notifica y a quién: D138; canal y frecuencia: D143.

### HU-NOT-09 · Enterarme de que un control dejó de cumplir o la evaluación automática falló

**Como** persona a cargo de un control, **quiero** saber cuándo pasa a «no cumple» o cuándo la evaluación automática no
pudo correr **para** actuar antes de una auditoría.

- El único disparador fiable hoy es `compliance_events` ([Trazabilidad](../trazabilidad/README.md)).
- El texto dice «sonda» o «evaluación automática», nunca el proveedor (D70, SEG-39).
- Eventos y destinatarios: D138; canal y frecuencia: D143.

### HU-NOT-10 · Enterarme de una observación nueva del auditor

**Como** dueño o ejecutor de un control, **quiero** enterarme cuando el auditor deja una observación **para** responderla.

- Las observaciones ya llegan al dueño y al ejecutor en «Mi trabajo» (D102 punto 9); el aviso a la empresa está fuera del
  contrato de observaciones (`contracts/cumplimiento/observaciones.md`).
- A quién se avisa: D138; canal: D143 (en la app y por correo).

### HU-NOT-11 · Recibir recordatorios antes de que algo venza

**Como** persona a cargo de un control, **quiero** un recordatorio antes de que venza **para** no perder el plazo.

- **Construido (MD-515):** `window_due_soon` (en `alert_at`, un solo recordatorio por control y cierre) y `window_expired` los genera la pasada diaria de las ventanas, que es idempotente. Un control «Sin asignar» avisa a los administradores en un solo aviso por servicio, tipo y día.
- La periodicidad y los días de aviso ya están definidos (D131, PR-06); el canal, en la app y por correo (D143).

### HU-NOT-12 · Ver mis avisos en un centro de notificaciones dentro de la app

**Como** persona de Platform, **quiero** una campana con mis avisos **para** ver lo pendiente en un solo lugar.

- **Construido (MD-515):** campana con leído y no leído, en vivo, e historial de 90 días (D143); Centro de avisos en `/notificaciones` (página fuera del shell; `/avisos` redirige). Un aviso de otra persona responde `404`.

### HU-NOT-13 · Elegir cómo y cada cuánto recibo los avisos

**Como** persona de Platform, **quiero** elegir canal y frecuencia (inmediato o resumen) **para** no saturarme.

- **Parcial:** cada persona puede apagar el resumen diario por correo (`PATCH /v1/me/notification-preferences`); los avisos de la app no se apagan (D143). La frecuencia no se elige: el resumen es diario.

### HU-NOT-14 · Enterarme a tiempo de que una empresa archivada está por borrarse

**Como** `admin_monkey`, **quiero** un aviso al menos 3 días antes de que se borre una empresa archivada **para** reactivarla
si fue un error.

- El aviso va a **todos** los `admin_monkey`, por correo y por notificación en la app, al menos 3 días antes (D97, `contracts/empresas.md`).
- Es informativo: no condiciona la purga (DT-83).
- `GET /v1/companies/pending-purge` ya lista las empresas por vencer con los días restantes; falta el envío.
