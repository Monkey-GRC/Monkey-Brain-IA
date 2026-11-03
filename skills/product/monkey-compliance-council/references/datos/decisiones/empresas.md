# Decisiones — Empresas

Por qué Empresas es como es. **Se consulta para reabrir, no para construir**: lo vigente está en [`arquitectura/empresas/`](../../arquitectura/empresas/README.md) y en `datos/modelo/`. Índice de todas las decisiones: [`README.md`](README.md).

## D24 (aprovisionamiento) · Monkey Admin y Monkey Platform son dos aplicaciones distintas; el registro del tenant define nombre y aislamiento

**Pregunta:** ¿el registro de una empresa (tenant) y el primer acceso del cliente pasan
por la misma app que usa el cliente, o por algo distinto?

**Decisión:**
- **Monkey Admin es una aplicación web completa y separada**, con dominio propio,
  exclusiva del equipo Monkey — no una vista sin UI, sino otro producto.
- El formulario de registro del tenant tiene **3 campos**: nombre o razón social,
  check de "¿requiere base de datos dedicada?", y correo administrativo de la empresa.
- Al enviarlo se crea `companies` (con ese nombre y con `isolation_strategy` derivado del
  check) y se genera una **clave de acceso** de un solo uso, con expiración, que se envía
  **al correo administrativo capturado en el formulario**.
- El cliente usa esa clave para crear su cuenta `admin_empresa` en **Monkey Platform** y
  recién ahí arranca el onboarding — con el nombre de la empresa ya precargado y
  bloqueado en el Componente 1, porque se fijó en el registro del tenant.

**Qué cambia en el modelo:** se corrige `modelo-datos.md` §4.3 — `isolation_strategy` es
atributo de `companies`, no de `organizations` (la empresa como tenant existe antes de que
el cliente declare nada de negocio). Se agrega la tabla `access_keys` (§4.1). El campo
`name` de `organizations` en el onboarding no es editable: es de solo lectura, reflejo
del `name` ya capturado en `companies`.

**Por qué importa ahora:** condiciona el día 1-2 del sprint de Onboarding (fundación de
Auth) — sin esto no hay forma de que el primer `admin_empresa` entre al sistema.

**Fuente:** confirmación de Héctor, 2026-09-21 y 2026-09-22.

---

---

## D43 · La clave de acceso se canjea una sola vez, y solo con el correo administrativo

> ⚠️ **Ampliada por D51 (2026-10-05):** la activación es de dos pasos (`POST /v1/auth/redeem/lookup` + `redeem`), el canje ya
> no recibe nombre ni apellido, y ambos endpoints tienen un freno de intentos.

**Decisión:** el canje (`POST /v1/auth/redeem`) crea la cuenta `admin_empresa` **únicamente si el
correo que escribe el cliente es el `admin_email` que Monkey registró para su empresa** (se compara
en minúsculas). Si no coincide: `422 ACCESS_KEY_EMAIL_MISMATCH` y la clave sigue pendiente. La clave
sirve **una vez**: al canjearla pasa a `used` y, desde ahí, ese administrador entra siempre con correo
y contraseña (`POST /v1/auth/login`).

**Por qué:** D24 ya dice que la clave se emite **para** el `admin_email` capturado en el registro; atar
el canje a ese correo es lo que hace que una clave interceptada o reenviada por error no sirva para
crear una cuenta con otro correo. Y como `users.email` es único global (D29), el administrador de la
empresa queda identificado sin ambigüedad desde el primer acceso.

**Cómo quedó implementado** (detalle en `contracts/autenticacion.md`, "Estado de implementación"):

- La clave se marca como usada con una actualización **condicional** (solo si sigue `pending` y
  vigente) en la misma transacción que crea el usuario: dos canjes simultáneos no pueden crear dos
  cuentas.
- Clave vencida → `409 ACCESS_KEY_EXPIRED`; ya usada → `409 ACCESS_KEY_ALREADY_USED`; inexistente,
  revocada, o de una empresa suspendida → `404 ACCESS_KEY_INVALID` (a quien solo tiene la clave no se
  le revela el estado de la empresa).
- Se registran en `audit_logs` el canje (`auth.redeem`, también los intentos fallidos con el correo
  tecleado) y la creación del usuario (`user.create`).

**No cierra P2(e)** (¿más de un correo administrativo por empresa?): hoy hay uno, y el resto de
usuarios de la empresa se invitará desde el módulo de Usuarios.

**Fuente:** confirmación de Carlos, 2026-09-30.

---

---

## D47 · El marco se contrata al registrar la empresa (revierte el veto de §6.1)

> **Ampliada por D50:** el catálogo muestra 7 marcos y solo los `available` (hoy SOC 2) se pueden contratar.

**Decisión** (Carlos, 2026-10-01; **pendiente de ratificar con el comité**). **Monkey Admin contrata el marco
para la empresa al registrarla** —hoy solo SOC 2 (D37), fijo y bloqueado en el formulario— y, al declarar un
servicio, el cliente solo puede elegir entre los marcos que su empresa tiene contratados (también fijo: SOC 2).

**Qué cambia respecto a lo anterior:** `modelo-datos.md` §6.1 decía *«se vetó a propósito el framework a nivel de
empresa; los marcos se contratan por servicio»*. Ese veto era sobre que **el cliente** lo eligiera en su Componente
1, y sigue en pie. Lo que se añade es una capa **comercial** anterior: quién vende el marco es Monkey Admin, y el
servicio solo **elige** entre lo vendido. El contrato del Componente 2 ya traía un error `FRAMEWORK_NOT_CONTRACTED`
que apuntaba a esto y que D45 había dejado sin uso.

**Cómo quedó:**

1. **`platform.company_frameworks`** (migración 26): `company_id`, `framework_id` (la versión vigente), `contracted_by`
   (el `admin_monkey` que lo contrató), `contracted_at`; único `(company_id, framework_id)`.
2. **RLS:** la empresa **lee** lo suyo y `admin_monkey` lee todo; **solo `admin_monkey` escribe**. Un cliente no puede
   contratarse un marco ni con acceso directo a la base (probado como `monkey_app`).
3. **`POST /v1/companies`** acepta `framework_codes` (opcional, por defecto `["soc2"]`); empresa, clave y contrato
   se crean en **la misma transacción**. Un código fuera del catálogo → `422`. Las respuestas del registro, del listado
   y del detalle traen `frameworks`.
4. **`POST` / `PATCH /v1/services`**: un marco no contratado → `409 FRAMEWORK_NOT_CONTRACTED`. Editar otros campos de un
   servicio no se bloquea.
5. **`GET /v1/catalogs/contracted-frameworks`** (solo `admin_empresa`): lo que el cliente puede elegir. Una empresa sin
   contrato recibe una lista vacía y la pantalla se lo explica.
6. **Pantallas:** Monkey Admin muestra «Marco contratado: SOC 2 (fijo por ahora)» en el registro y el marco de cada
   empresa en el listado; Monkey Platform muestra SOC 2 como tarjeta fija «incluido en tu contrato».
7. **`service_frameworks` no cambia:** sigue guardando qué marco persigue cada servicio, con su versión de catálogo y su
   periodo de evaluación (A4).

**Deja abierto** (en `deuda-tecnica/README.md`): no hay forma de contratar o cancelar un marco después del registro (DT-26) y el
contrato no guarda condiciones comerciales (DT-27). Las empresas que existían antes de la migración no tienen contrato; en
desarrollo no había ninguna.

**Por qué:** con un solo marco hoy el cambio es pequeño, pero fija el orden correcto para cuando haya más (ISO 27001,
PCI DSS, HIPAA en la Fase 1): lo que un cliente puede declarar lo decide lo que Monkey le vendió, no un campo libre.

**Fuente:** confirmación de Carlos, 2026-10-01.

---

---

## D97 · Archivar una empresa y borrarla definitivamente después de un plazo (2026-10-28; enmienda D41 y D72)

**Decisión.**
1. **Dos pasos.** *Archivar* corta todo y es reversible; el *borrado definitivo* ocurre solo al vencer el plazo y no se deshace. `companies.status` gana `deactivated`. Sirve para falta de pago, el cliente ya no quiere el servicio, etc.
2. **Quién y qué pide.** Solo `admin_monkey` archiva y reactiva. Al archivar escribe la **razón social exacta**, un **motivo** (falta de pago, el cliente ya no desea el servicio u otro, más texto libre de 5 a 500), el **plazo hasta el borrado** (**6 meses por defecto**, mínimo 7 días, editable solo en ese momento) y su **código TOTP** (el suyo, no el de la empresa). Antes de confirmar ve el aviso de consecuencias.
3. **Al archivar** (una transacción): se cierran las sesiones y se bloquean los ingresos de todos los usuarios (`403 ACCOUNT_INACTIVE`, sin revelar la causa); se cancela lo que estaba en cola o en curso y el trabajador deja de reclamar a la empresa (no se recibe más datos de la sonda ni de la nube); se borran los desafíos de segundo factor abiertos. Las claves de acceso, credenciales y agentes **no se reescriben**: dejan de servir mientras la empresa está archivada (el canje, el ingreso y las evaluaciones comprueban su estado) y vuelven a servir al reactivarla, si no vencieron. **Usuarios, asignaciones y datos se conservan**, inaccesibles. Se toma una **copia de esa empresa** justo antes de archivar, como red de seguridad.
4. **Reactivar:** solo `admin_monkey`, con motivo y TOTP, y solo dentro del plazo. Vuelve a `active` cambiando el estado (no restaura desde la copia) y **el plazo deja de existir**: si se archiva otra vez, se elige uno nuevo y se cumple completo. Las sesiones cerradas no reviven: la gente inicia sesión de nuevo. La copia se borra. Pasado el borrado no hay vuelta.
5. **Aviso.** Al menos **3 días antes** de vencer, Monkey avisa a **todos** los `admin_monkey` por **correo y por notificación en la app**. El aviso es **solo informativo**: el borrado corre al vencer el plazo, haya o no aviso. Esos dos canales aún no existen (**DT-83**); mientras tanto Monkey Admin lista las empresas por vencer. Añadirlos no cambia el resto.
6. **Borrado definitivo** (tarea programada, al vencer): elimina **todo** lo de la empresa —datos, archivos de evidencias, credenciales, usuarios, auditoría y su copia del paso 3—. Solo queda el **rastro mínimo**: nombre, fecha y hora, y quién (el sistema por vencimiento, más quien archivó), en una tabla propia sin datos del cliente.
7. **La auditoría y los respaldos (enmienda a D41 y D72).** Los 7 años de una empresa activa los sostiene la **base viva** (inmutable), no los respaldos. Los **respaldos generales** (toda la base, todas las empresas) solo sirven para recuperarse de un desastre y **rotan a 35 días**. Así, los datos de una empresa borrada desaparecen de todos lados como máximo **35 días** después. El borrado corre con un rol propio, solo sobre una empresa archivada con plazo vencido, y no debilita los triggers de inmutabilidad del resto.
8. **Si se restaura un respaldo, se vuelve a purgar.** Restaurar trae de vuelta lo borrado desde esa fecha; el rastro mínimo es la lista de lo que hay que borrar de nuevo, y **toda restauración termina con esa pasada** antes de abrir el servicio.
9. **Riesgo aceptado.** Con rotación de 35 días, un daño descubierto pasado ese tiempo no tiene respaldo anterior al cual volver.
10. **Términos del servicio.** Debe decir: «Al borrar definitivamente una empresa se eliminan todos sus datos; las copias de seguridad generales los eliminan en un máximo de 35 días».
11. **Fuera de alcance, a propósito.** Exportar los datos al cliente que se va no se ofrece (no está pedido). Si se pide, será otra decisión.
12. **Auditoría.** `company.deactivate` y `company.reactivate` se registran en la misma transacción (D52), también los intentos fallidos; `company.purge` deja solo el rastro mínimo.

**Por qué.** Hay que poder cortar a un cliente que no paga o se va, sin destruir datos de golpe por si fue un error y sin guardarlos para siempre. Una copia de toda la base no permite quitar una sola empresa, así que los respaldos no pueden sostener los 7 años: los sostiene la base viva y los respaldos rotan corto.

**Qué cambia.** `company_status` y `company_deactivation_reason` (`enums.md`); `04-monkey-admin.md`; `contracts/empresas.md`; SEG-68 y SEG-35; D41, D72 y P7 (texto). Migración: valor `deactivated`, `deactivated_at`, `archive_until`, tabla `company_purge_log` y registro de avisos, rol de purga y tarea programada; rotación de 35 días en staging (MD-91) y producción. Pendiente: DT-83.

**Fuente:** responsable de producto (PO), consultado por Hector Rios el 2026-10-28, que confirmó TOTP, canales y datos en su sitio al archivar.

---

---

## D99 · La clave de acceso solo se entrega por correo; si no llega, se reenvía una nueva (2026-10-30; enmienda D24 y D51, cierra P2b, cierra MD-69 para la clave de acceso)

**Decisión.**
1. **Solo por correo.** La clave de acceso de una empresa nueva se envía al `admin_email` capturado al registrarla (D24). **Deja de mostrarse en pantalla y de viajar en la respuesta** de `POST /v1/companies`: mostrarla era el atajo temporal de MD-69 y obligaba a `admin_monkey` a copiarla y entregarla por otro canal.
2. **Si el correo falla, la empresa se crea igual.** La respuesta dice `delivery_status: "failed"` y Monkey Admin ofrece reenviar. Un fallo del proveedor de correo no bloquea el alta.
3. **Reenviar es emitir otra clave.** `POST /v1/companies/{id}/access-key/regenerate` anula la pendiente, genera una con vigencia completa y la envía; no hay forma de recuperar la anterior porque solo se guarda su huella. Solo mientras la empresa no haya canjeado la clave.
4. **El correo lleva lo mínimo:** el nombre de la empresa, la clave, cuándo vence y a dónde ir. No nombra al proveedor del motor (SEG-39).
5. **Sin servicio de correo no hay forma de entrar.** Por eso el Backend se niega a arrancar en producción sin un servicio de correo real configurado, y el modo que solo escribe el mensaje en el log existe únicamente fuera de producción.
6. **Alcance.** Solo la clave de acceso. La invitación de cuentas (código de activación, D95), el aviso de borrado (DT-83) y las notificaciones siguen pendientes (MD-69 las cubre).

**Por qué.** Una clave en pantalla se copia, se pega en chats y queda en capturas; el correo al `admin_email` es además el canal que D43 ya exige para canjearla. Sin reenvío, un correo perdido dejaría a la empresa sin forma de entrar.

**Qué cambia.** `contracts/empresas.md` (respuesta de `POST /v1/companies`, endpoint de reenvío, `ACCESS_KEY_NOT_PENDING`), `04-monkey-admin.md` §4.2, `flujo-end-to-end.md`, `sprint-onboarding.md`, `SEG-71`, `DT-85`, `.env` (`MAIL_PROVIDER`, `MAIL_FROM`, `PLATFORM_APP_URL`, y la credencial del servicio de correo). P2(b) queda cerrada.

**Fuente:** responsable de producto, consultado por Hector Rios el 2026-10-30.
