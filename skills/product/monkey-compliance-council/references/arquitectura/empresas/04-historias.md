# Empresas · historias de usuario

Responde: **¿qué necesita el equipo de Monkey para dar de alta a una empresa cliente, mantener su contrato y darla de
baja sin perder ni guardar de más, y cómo se comprueba que lo tiene?** Cada historia dice quién, qué y para qué; sus
criterios de aceptación son verificables y citan la regla que los fija. El detalle técnico (cuerpos, errores) está en el
[contrato](../../../../../../contracts/empresas.md); la secuencia, en [`03-flujos.md`](03-flujos.md); los pasos de cada
caso, en [`05-casos-de-uso.md`](05-casos-de-uso.md).

**Roles** (D96, D103): el único actor es `admin_monkey` (Monkey Admin). El cliente solo aparece al final: su primer
`admin_empresa` recibe la clave por correo y la canjea en [Autenticación](../autenticacion/04-historias.md)
(HU-AUTH-01). `admin_monkey` **no entra** al cumplimiento de nadie ni crea cuentas de su equipo (D43, D96). **Estado**
de cada historia: ✅ construida · 🟡 parcial · ⚪ por construir.

## Resumen

| ID | Historia | Rol | Estado | Reglas |
|---|---|---|---|---|
| HU-EMP-01 | Registrar una empresa cliente | `admin_monkey` | ✅ | D24, D99, D103, SEG-71 |
| HU-EMP-02 | Contratar los marcos de la empresa al registrarla | `admin_monkey` | ✅ | D47, D50 |
| HU-EMP-03 | Reenviar la clave de acceso si no llegó | `admin_monkey` | ✅ | D99, SEG-71 |
| HU-EMP-04 | Consultar las empresas y su estado | `admin_monkey` | ✅ | D99, D103 |
| HU-EMP-05 | Fijar y cambiar el cupo de usuarios | `admin_monkey` | ✅ | D103 |
| HU-EMP-06 | Corregir el nombre o el correo antes del canje | `admin_monkey` | ⚪ | P2(c) |
| HU-EMP-07 | Registrar una empresa con base de datos dedicada | `admin_monkey` | ⚪ | D24, P2(d) |
| HU-EMP-08 | Archivar una empresa | `admin_monkey` | ✅ | D97, SEG-68 |
| HU-EMP-09 | Reactivar una empresa archivada | `admin_monkey` | ✅ | D97, SEG-68 |
| HU-EMP-10 | Saber qué empresas están por borrarse | `admin_monkey` | 🟡 | D97 punto 5, DT-83 |
| HU-EMP-11 | Que una empresa archivada se borre del todo al vencer su plazo | `admin_monkey` | ✅ | D97, SEG-68 |

---

### HU-EMP-01 · Registrar una empresa cliente

**Como** `admin_monkey`, **quiero** registrar una empresa recién contratada con su razón social, su correo
administrativo y su cupo **para** que su administrador reciba la clave y pueda entrar a Monkey Platform.

- El formulario pide la razón social, si requiere base de datos dedicada, el correo administrativo (D24) y el cupo de
  usuarios, entero ≥ 1 (D103); un campo vacío, una razón social de más de 255 caracteres, un correo inválido o un cupo
  menor que 1 → `VALIDATION_FAILED`.
- Una razón social igual a la de otra empresa `active` (sin distinguir mayúsculas ni espacios repetidos) →
  `COMPANY_NAME_TAKEN`.
- Un correo que ya es administrativo de otra empresa o ya es de un usuario de la plataforma → `ADMIN_EMAIL_TAKEN` (el
  correo es único global: la clave no se podría canjear).
- Empresa, marcos contratados y clave de acceso se crean en la misma transacción, con `company.create` en la auditoría
  (D47); la clave nunca entra a la auditoría, ni en claro ni en hash (SEG-71).
- La clave sale **solo por correo** al correo administrativo: la respuesta trae su estado, su vencimiento (7 días,
  `ACCESS_KEY_TTL_HOURS`) y `delivery_status`, nunca la clave, y ninguna pantalla la muestra (D99, SEG-71).
- Si el correo no sale (`delivery_status: "failed"`), la empresa queda creada igual y Monkey Admin ofrece reenviar
  (D99 punto 2, HU-EMP-03).
- El correo lleva lo mínimo: nombre de la empresa, clave, vencimiento y a dónde ir, sin nombrar al proveedor del motor
  (D99 punto 4).
- La razón social se fija aquí y llega precargada y bloqueada al Componente 1 del onboarding (D24).

### HU-EMP-02 · Contratar los marcos de la empresa al registrarla

**Como** `admin_monkey`, **quiero** fijar qué marcos contrató la empresa al registrarla **para** que el cliente solo
pueda declarar servicios con lo que Monkey le vendió.

- El formulario muestra los 7 marcos que Monkey ofrece y solo deja contratar los `available` (hoy SOC 2); el resto
  aparece como «próximamente» (D50).
- Sin marcos en la petición, se contrata SOC 2 por defecto (D47).
- Un código que no está en el catálogo → `422`; uno `coming_soon` → `FRAMEWORK_NOT_AVAILABLE` con los códigos
  rechazados (D50).
- Al declarar un servicio, el cliente solo elige entre los marcos contratados de su empresa
  (`FRAMEWORK_NOT_CONTRACTED`, D47).
- Solo `admin_monkey` escribe el contrato de marcos; la empresa solo lo lee (D47, RLS).

### HU-EMP-03 · Reenviar la clave de acceso si no llegó

**Como** `admin_monkey`, **quiero** reenviar la clave de acceso de una empresa **para** que su administrador pueda
entrar aunque el primer correo se perdiera o no saliera.

- Reenviar **anula** la clave pendiente (aunque no hubiera vencido), emite otra con vigencia completa y la envía al
  correo administrativo; la anterior no se puede recuperar porque solo se guarda su huella (D99 punto 3).
- Responde `200` también si el envío falló: la clave nueva existe y se puede reenviar otra vez (D99).
- Deja `access_key.regenerate` en la misma transacción y la clave nunca aparece en pantalla ni en la respuesta
  (SEG-71).
- Si la empresa ya canjeó su clave → `ACCESS_KEY_NOT_PENDING`; si está archivada → `COMPANY_ALREADY_DEACTIVATED`; si
  no existe o es la empresa interna de Monkey → `404`.

### HU-EMP-04 · Consultar las empresas y su estado

**Como** `admin_monkey`, **quiero** ver la lista de empresas cliente y el detalle de cada una **para** saber en qué
punto está cada alta y cuánto de su cupo usa.

- La lista es paginada, se ordena por fecha de alta o por nombre y se filtra por estado; las archivadas se ocultan
  salvo con `status=deactivated` (D97).
- Cada empresa trae su cupo y su uso (`max_users`, `users_count`; `null` = empresa anterior al cupo, sin tope, D103),
  sus marcos, el estado y vencimiento de la clave vigente y si ya completó el onboarding.
- Una clave `pending` cuyo vencimiento pasó se informa como `expired`.
- Nunca se devuelve la clave ni su hash; el detalle trae el historial de claves sin códigos (D99).
- La empresa interna de Monkey no aparece en la lista y su detalle responde `404`.

### HU-EMP-05 · Fijar y cambiar el cupo de usuarios

**Como** `admin_monkey`, **quiero** fijar y cambiar cuántos usuarios puede tener una empresa **para** cobrar por el
número de usuarios contratados.

- Cuentan las cuentas `active`, `pending` y `suspended` de cualquier rol; las `inactive` no (D103 punto 2).
- Se puede cambiar en cualquier momento, también después del canje de la clave.
- Un cupo menor que las cuentas que ya cuentan → `MAX_USERS_BELOW_CURRENT`, y la pantalla muestra cuántas cuentan;
  menor que 1 → `VALIDATION_FAILED`.
- Cada cambio deja `company.max_users_update` con el valor anterior y el nuevo, en la misma transacción.
- Al llegar al tope, la empresa no puede crear otro usuario (`USER_LIMIT_REACHED`, D103; se comprueba en Gestión de
  usuarios).

### HU-EMP-06 · Corregir el nombre o el correo antes del canje

> ⚪ **Depende de `P2(c)`, abierta.** El contrato define el endpoint como supuesto, no como decisión, y no está
> construido.

**Como** `admin_monkey`, **quiero** corregir un error de tipeo en la razón social o el correo administrativo antes de
que el cliente entre **para** que el nombre bloqueado en el Componente 1 sea el correcto.

- Supuesto del contrato: solo mientras la clave esté `pending`; tras el canje → `COMPANY_ALREADY_ONBOARDED` (P2(c)).

### HU-EMP-07 · Registrar una empresa con base de datos dedicada

> ⚪ **Depende de `P2(d)`, abierta.** El aprovisionamiento dedicado no existe.

**Como** `admin_monkey`, **quiero** registrar una empresa que exige base de datos dedicada **para** cumplir con un
cliente que no acepta compartirla.

- Hoy marcar «requiere base de datos dedicada» se rechaza con `DEDICATED_DATABASE_NOT_AVAILABLE` (temporal, P2(d)).
- El check advierte que la decisión no se revierte sin migrar datos.
- Si el registro es síncrono (`201`) o diferido (`202`, con estado de aprovisionamiento que el modelo hoy no tiene)
  lo decide `P2(d)`; un fallo del aprovisionamiento sería `PROVISIONING_FAILED`.

### HU-EMP-08 · Archivar una empresa

**Como** `admin_monkey`, **quiero** archivar una empresa que dejó de pagar o ya no quiere el servicio **para** cortar
todo su acceso sin destruir sus datos por si fue un error.

- Antes de confirmar veo el aviso de consecuencias (D97 punto 2).
- Escribo la razón social exacta (`CONFIRMATION_MISMATCH` si no coincide), un motivo (`non_payment`, `client_request`
  u `other`) con un texto de 5 a 500 caracteres, el plazo hasta el borrado (180 días por defecto, mínimo 7) y **mi**
  código TOTP (`MFA_CODE_INVALID`, `ACCOUNT_LOCKED`, `MFA_NOT_ENABLED`) (D97, SEG-68).
- Se toma una copia cifrada de la empresa; si no se puede guardar, no se archiva.
- En una transacción la empresa pasa a `deactivated`: se cierran todas sus sesiones, se borran los desafíos de segundo
  factor abiertos y se cancelan las evaluaciones en cola o en curso; el trabajador deja de reclamarla (D97 punto 3).
- Sus usuarios no pueden entrar (`ACCOUNT_INACTIVE`, sin revelar la causa); el canje de clave y la renovación de sesión
  también comprueban el estado. Claves, credenciales, usuarios y datos se conservan sin reescribirse (D97 punto 3).
- Deja `company.deactivate`; un intento rechazado por razón social distinta o por empresa ya archivada también lo deja,
  con `result: error` y sin lo que se escribió (D97 punto 12, SEG-68).
- Si dos peticiones archivan la misma empresa a la vez, una gana y la otra recibe `COMPANY_ALREADY_DEACTIVATED`
  (SEG-68).

### HU-EMP-09 · Reactivar una empresa archivada

**Como** `admin_monkey`, **quiero** reactivar una empresa archivada dentro de su plazo **para** devolverle el servicio
si regularizó su pago o el archivado fue un error.

- Pido un motivo y **mi** código TOTP; los errores del código son los de archivar (D97 punto 4).
- Solo dentro del plazo: vencido → `COMPANY_ARCHIVE_EXPIRED`; no archivada → `COMPANY_NOT_DEACTIVATED`; ya borrada →
  `404`.
- La empresa vuelve a `active` cambiando el estado (no se restaura desde la copia); los datos de la baja se vacían, el
  plazo deja de existir y la copia se borra (D97 punto 4).
- Las sesiones cerradas no reviven: la gente inicia sesión de nuevo; claves y credenciales vuelven a servir si no
  vencieron.
- Deja `company.reactivate`; si dos reactivaciones llegan a la vez, o el plazo vence entre la verificación y el cambio,
  solo una prospera (SEG-68).

### HU-EMP-10 · Saber qué empresas están por borrarse

> 🟡 **Parcial:** la lista existe; el aviso por correo y en la app no (DT-83).

**Como** `admin_monkey`, **quiero** saber qué empresas archivadas están por borrarse **para** reactivar a tiempo la que
no debía perderse.

- Monkey Admin lista las empresas por vencer, con su fecha de borrado y los días que faltan
  (`GET /v1/companies/pending-purge`).
- ⚪ Al menos 3 días antes del vencimiento, todos los `admin_monkey` reciben un aviso por correo y por notificación en
  la app (D97 punto 5; no existe: DT-83).
- El aviso es solo informativo: el borrado corre al vencer el plazo, haya o no aviso (D97 punto 5).

### HU-EMP-11 · Que una empresa archivada se borre del todo al vencer su plazo

**Como** `admin_monkey`, **quiero** que una empresa archivada se borre definitivamente al vencer su plazo **para** no
guardar para siempre los datos de un cliente que se fue.

- Lo hace una tarea programada (cada `COMPANY_PURGE_INTERVAL_MINUTES`, 60 por defecto) con un rol propio, solo sobre
  empresas `deactivated` con el plazo vencido; no hay endpoint de borrado (D97 punto 6, SEG-68).
- Elimina todo lo de esa empresa —datos, archivos de evidencias, credenciales, usuarios, auditoría y su copia— y nada
  de otra (SEG-68).
- Queda solo el rastro mínimo en `company_purge_log`: nombre, fecha y hora, y quién (`company.purge`).
- Con varias réplicas, cada empresa se borra una sola vez (candado por empresa); si algo falla a medias, la empresa
  sigue archivada y la pasada siguiente la reintenta.
- Si se restaura un respaldo, la restauración termina volviendo a purgar lo que lista `company_purge_log` (D97 punto 8).
- Los respaldos generales rotan a 35 días: los datos de una empresa borrada desaparecen de todos lados como máximo 35
  días después (D97 punto 7).
