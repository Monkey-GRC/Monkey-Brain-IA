# Decisiones — Autenticación

Por qué Autenticación es como es. **Se consulta para reabrir, no para construir**: lo vigente está en [`arquitectura/autenticacion/`](../../arquitectura/autenticacion/README.md) y en `datos/modelo/`. Índice de todas las decisiones: [`README.md`](README.md).

## D66 · MFA obligatoria para los 5 roles (2026-10-09)

> **Ajustada por D96 (2026-10-27).** Los roles activos son cuatro (`admin_monkey`, `admin_empresa`, `funcional`, `auditor`); la MFA sigue obligatoria para todos. D96 no la relaja para el `funcional`, aunque el Excel lo hace.

**Decisión.** La autenticación de dos factores (TOTP) es obligatoria para `admin_monkey`, `admin_empresa`, `funcional`, `consultor` y `auditor`, y el resto de políticas del TSC integral
(§5.3) aplican a todos. Es un requisito de seguridad sin excepciones; se construye en el sprint de acceso y usuarios, no en el de Cumplimiento.
**Por qué.** La hoja de roles del TSC la exigía solo a admin y auditor y dejaba al `funcional` sin ella; el responsable de producto la extendió a todos.
**Fuente:** responsable de producto, 2026-10-09.

---

## D94 · Segundo factor: TOTP con 10 códigos de recuperación, obligatorio para los 5 roles (2026-10-26; cierra DT-23, implementa D66 y SEG-16)

**Decisión.**
1. **Mecanismo.** TOTP estándar (RFC 6238: SHA-1, 6 dígitos, 30 s, tolerancia de ±1 paso), compatible con cualquier app de códigos. Implementado en el propio Backend con los vectores del RFC como prueba, sin librería de terceros. El secreto se guarda cifrado (AES-256-GCM, el mismo `CredentialCipher`); nunca se devuelve después de activar.
2. **Ingreso en dos pasos.** `POST /v1/auth/login` con contraseña correcta no abre sesión si el segundo factor es obligatorio: devuelve `next_step` (`mfa_verify` si ya lo tiene, `mfa_setup` si no) y deja un **desafío** de un solo uso y 5 minutos en la cookie `mnk_mfa`. La sesión se abre en `POST /v1/auth/mfa/verify` o `POST /v1/auth/mfa/setup/confirm`. El canje de la clave de acceso (`redeem`) también pasa por la configuración.
3. **Un código no se usa dos veces.** Se guarda el último paso aceptado (`users.mfa_last_used_step`) y se rechaza cualquiera igual o anterior, aunque siga en su ventana.
4. **Intentos.** Un código equivocado suma al **mismo** bloqueo de la contraseña (5 intentos, 15 min) y al del desafío (5 intentos, luego hay que volver a iniciar sesión).
5. **Configuración.** Tres pasos: instalar una app de códigos, escanear el QR (o copiar la clave) y escribir el primer código. El QR se dibuja **en el navegador** a partir de `otpauth_uri`: el secreto no pasa por ningún servicio externo. Al confirmar se activa y se muestran **10 códigos de recuperación** (`XXXXX-XXXXX`, sin caracteres ambiguos, guardados como hash), **una sola vez**, con copiar/descargar y la casilla «Ya los guardé» para continuar.
6. **Códigos de recuperación.** Sirven una vez en lugar del código de la app; al usarlos se avisa cuántos quedan. `POST /v1/auth/mfa/recovery-codes` genera 10 nuevos (anulan los anteriores) y exige un código vigente.
7. **Quien ya existe entra a configurarlo en su próximo ingreso, sin periodo de gracia.**
8. **Restablecer.** El `admin_empresa` restablece a su equipo (`DELETE /v1/users/{id}/mfa`: `funcional`, `consultor`, `auditor` de su empresa; no a sí mismo). Monkey restablece al `admin_empresa` con `npm run mfa:reset` (dry-run por defecto, `-- --apply`), tras verificar la identidad por otro canal; deja rastro `auth.mfa_reset`. Un endpoint de `admin_monkey` entre empresas queda para el módulo de usuarios (MD-131/132).
9. **Interruptor.** `MFA_REQUIRED` (por defecto `true`). Solo puede ser `false` fuera de producción: en producción el Backend no arranca así. Es para desarrollo y pruebas.
10. ~~**Sin «recordar este dispositivo».** Cada ingreso pide el código. Se reconsidera si el comité lo pide.~~ **Enmendado por D123 (2026-11-17):** la persona puede recordar un dispositivo por 30 días, salvo `admin_monkey`.
11. **Pantallas.** Un solo campo de 6 dígitos que se envía solo, con `autocomplete="one-time-code"`; enlace «Usar un código de recuperación»; después, la página «Seguridad de la cuenta» (regenerar códigos).

**Por qué.** D66 y SEG-16 exigen MFA en los 5 roles; TOTP es lo que acepta un auditor de SOC 2 sin depender de un proveedor de SMS, y los códigos de recuperación evitan que perder el celular deje a la empresa fuera.

**Qué cambia.** `users.is_mfa_enabled` (ya existía), `users.mfa_secret_encrypted`, `users.mfa_last_used_step`, tablas `mfa_challenges` y `user_recovery_codes` (RLS por tenant); `contracts/autenticacion.md`; `SEG-16`; se cierra `DT-23`.

**Fuente:** Carlos Castaño, 2026-10-26 (responsable de producto): aprobó la propuesta («me parece bien, vamos con esa funcionalidad»).

---

---

## D95 · El consultor se activa con un código de un solo uso y entra a sus empresas asignadas eligiendo de una lista, sin token por empresa (2026-10-27)

> **Reemplazada en parte por D96 (2026-10-27).** Sin consultor no hay empresa activa ni asignaciones. **Sobrevive el mecanismo de activación**: el estado `pending`, la tabla `user_activation_codes` y el código de un solo uso, que ahora emite el `admin_empresa` para invitar a `funcional` y `auditor`.

**Decisión.**

- `admin_monkey` crea al consultor solo con su correo (cuenta en la empresa interna de Monkey, D64). Recibe un **código de activación de un solo uso**, ligado a ese correo, que `admin_monkey` le entrega a mano (el correo sigue aplazado, MD-69). Con él pone su contraseña y configura el segundo factor (D94), igual que el `admin_empresa` con su clave de acceso (D43, D51).
- Al iniciar sesión (contraseña y segundo factor) el consultor ve **solo las empresas con asignación `active`** y elige una; con una sola, entra directo. **No hay un token de ingreso por empresa.**
- La sesión guarda la empresa activa (`sessions.active_company_id`). La asignación y el estado de la empresa se comprueban en **cada petición**; todo se abre con la empresa activa y lo que el consultor escribe lleva **su** id como autor, nunca el de la empresa. Elegir o cambiar de empresa queda en la auditoría.
- Cortar el acceso es cambiar el estado de la asignación: `admin_monkey` la retira o la empresa la suspende (D64), y aplica en la siguiente petición.
- La empresa interna de Monkey existe: la crea `bootstrap:admin` junto al primer `admin_monkey`, y es donde viven `admin_monkey` y `consultor`.

**Por qué.** Un token por empresa no agrega seguridad (la asignación y el segundo factor ya se comprueban en cada petición), obliga a entregar un secreto por cada par consultor–empresa sin servicio de correo, y revocarlo exige rastrear cuál sigue en circulación. La lista solo contiene las empresas asignadas, así que nunca expone la cartera de Monkey. Clasificación del Consejo: **MUST** asignación, elección de empresa, comprobación en cada petición y auditoría; **LATER** asignaciones con vencimiento; **NO BUILD** token de ingreso por empresa.

**Qué cierra.** `P29` (cómo activa su cuenta un consultor) y `P30` (dónde vive y cómo se aísla cuando trabaja en un cliente).

**También aprobado el 2026-10-27** (al revisar el contrato): el estado `pending` en `users` (la cuenta existe desde el alta, así se le puede asignar empresas antes de que active y se ve quién falta), la tabla `user_activation_codes` (la reutilizarán `funcional` y `auditor` en MD-131), desactivar y reactivar la cuenta de un consultor (`CC6.3`, fila «Desactivar / reactivar usuario» del Excel), reemitir un código perdido y la vigencia de 7 días del código (`ACTIVATION_CODE_TTL_HOURS`, el mismo supuesto de la clave de acceso, P2b).

**Qué cambia al construirlo.** `users.status` suma `pending`; tabla `user_activation_codes`; `sessions.active_company_id`; el rol se comprueba **antes** que la empresa elegida (un consultor que llama a una ruta que no es suya recibe 403, no 409); una empresa puede leer la cuenta de los consultores que tienen o tuvieron una asignación con ella (sin eso no se puede decir quién firmó un veredicto); y el trigger de asignaciones ya no deja que `admin_empresa` mueva una asignación que Monkey retiró (antes solo miraba `suspended → active`). El contrato de este corte (`users-consultant-access.md`) se retiró con D96; solo sobrevive lo del código de activación en `contracts/gestion-usuarios.md` y `SEG-64`.

**Fuente:** Carlos Castaño, 2026-10-27; `modelo-datos.md` §5.1 y §5.2 (D63, D64).

---

---

## D101 · La contraseña no vence por calendario; la persona la cambia cuando quiere y la recupera si la olvida (2026-10-31; enmienda §5.3 y SEG-14)

**Decisión.**
1. **Sin expiración.** Se retira la regla «la contraseña expira a los 90 días» de §5.3. Rotarla a la fuerza genera fatiga: la persona elige claves más débiles o parecidas a la anterior, y no protege si los datos ya se filtraron. Tampoco hay aviso previo ni flujo de «contraseña vencida».
2. **Cambio voluntario.** Cualquier rol cambia su contraseña cuando quiera, con sesión abierta, su contraseña actual y un código vigente de su segundo factor. Distinta de la actual y de las últimas 5; máximo 3 cambios en 24 h. Cierra las demás sesiones y avisa por correo.
3. **«Olvidé mi contraseña».** Enlace por correo de un solo uso (30 min) más el segundo factor; respuesta idéntica exista o no la cuenta; cierra todas las sesiones. Si perdió también el segundo factor, lo restablece el `admin_empresa` (o Monkey, al administrador).
4. **Qué no cambia.** Política de contraseña (SEG-13), bloqueo a los 5 intentos (SEG-15), segundo factor (SEG-16) y la rotación de 90 días de las API keys, que es otra cosa.

**Por qué.** Fatiga de contraseñas y fricción sin beneficio real; coincide con NIST SP 800-63B, que desaconseja la rotación periódica sin indicio de compromiso.

**Qué cambia.** `modelo/05-usuarios.md` (§5.2 y §5.3), `SEG-14`, `contracts/autenticacion.md`. `users.password_changed_at` se conserva como dato de cuándo cambió, sin efecto en el acceso.

**Ratificada por el comité:** ya no hay 90 días en su modelo; D101 y §5.3 coinciden con él.

**Fuente:** Hector Rios, tras acordarlo con el PM; el comité lo ratificó.

---

## D123 · «Recordar este dispositivo» por 30 días: la contraseña se pide siempre, el código del segundo factor no; excepto `admin_monkey` (2026-11-17; enmienda D94 punto 10)

**Contexto.** El comité pidió un ingreso más fácil y propuso el inicio de sesión con Google. El análisis del Consejo
mostró que lo que pesa no es la contraseña, sino **escribir el código TOTP en cada ingreso**. Google no lo quita, a menos
que se renuncie a la MFA de Monkey, y no podemos comprobar que Google pidió un segundo factor (su token no lo garantiza).
Recordar el dispositivo resuelve esa fricción sin bajar la seguridad y con mucho menos costo.

**Decisión.**
1. **Casilla opcional, desmarcada por defecto**, «Recordar este dispositivo por 30 días», al verificar el segundo factor:
   con el código de la app, con un código de recuperación o al terminar de configurarlo.
2. **Qué se salta:** solo el código. La **contraseña se pide siempre**, y la sesión sigue igual (30 min de inactividad,
   8 h máximo; SEG-12).
3. **Vigencia:** 30 días desde que se marca, sin renovarse con el uso.
4. **Ligado a la persona y al navegador:** cookie `httpOnly` (`Secure` en producción); en la base solo su HMAC con
   *pepper* (como el refresh, SEG-17). Otra cuenta en el mismo navegador ve su propio código.
5. **Deja de valer** al vencer; al cambiar o recuperar la contraseña; al restablecer o reconfigurar la MFA; al regenerar
   los códigos de recuperación; al desactivar o suspender la cuenta; o cuando la persona lo revoca. La revocación va en la
   misma transacción que el cambio que la provoca.
6. **La persona ve y revoca sus dispositivos** en Ajustes → Seguridad (uno o todos).
7. **`admin_monkey` no puede recordar un dispositivo:** entra a todas las empresas y para él el código en cada ingreso
   está justificado. La API lo rechaza; la app Admin (que solo admite `admin_monkey`) no muestra la casilla.
8. **Auditoría:** `auth.device_trusted`, `auth.device_revoked` y el ingreso marcado como «sin código, dispositivo recordado».

**Por qué.** Un ingreso con contraseña y dispositivo previamente verificado sigue siendo de dos factores (algo que sabe
+ algo que tiene, ya comprobado), con vigencia corta y revocable: es una práctica aceptada ante un auditor de SOC 2
(CC6.1). Quitar el segundo factor a quien entra con un proveedor externo no lo sería.

**Qué no se construye ahora.** El **inicio de sesión con Google** queda en **LATER**: entra si hay demanda comprobada
de clientes, diseñado para varios proveedores (Google y Microsoft), como primer factor y **sin quitar la MFA de Monkey**.
**NO BUILD:** registro abierto con un proveedor externo, vincular cuentas solo porque coincide el correo, o saltar la MFA
de Monkey porque el proveedor dice tener la suya. También quedan en LATER las passkeys como segundo factor.

**Qué cambia.** Tabla `trusted_devices` (RLS por tenant), `LoginUseCase`, `mfa/verify` y `mfa/setup/confirm`
(`remember_device`), rutas `/v1/auth/devices`, `contracts/autenticacion.md`, `modelo/05-usuarios.md` §5.3, SEG-84.
Se construye en **MD-217**.

**Fuente:** comité, 2026-11-17, a propuesta del Consejo; lo trajo Hector Rios. La exclusión de `admin_monkey`, Hector
Rios, 2026-11-17.

---

## D124 · Límite de peticiones compartido en Redis; la sesión se valida con una consulta y sin caché; bcrypt acotado por instancia (2026-11-17)

**Contexto.** Las mejoras M1, M2 y M3 de [`arquitectura/autenticacion/06-mejoras.md`](../../arquitectura/autenticacion/06-mejoras.md)
se aprobaron junto con D123. El límite de peticiones (SEG-19) y el freno de la clave de acceso viven en la memoria de
cada instancia (DT-37), y las rutas públicas no tienen tope por dirección.

**Decisión.**
1. **M2 · Redis** guarda los contadores del límite de peticiones, compartidos entre instancias. Se descartó un contador
   en Postgres: se elige Redis pensando en la escalabilidad (varias réplicas, sin cargar la base). Redis guarda **solo
   contadores**; lo que deba ser durable o auditable (sesiones, dispositivos recordados) sigue en Postgres.
2. **Tope por dirección en las rutas públicas** de autenticación, con `trust proxy` configurado para el proxy real.
3. **M1 · Una sola consulta** para validar la sesión (sesión, usuario, rol y estado), **sin caché**: una caché
   retrasaría la revocación.
4. **M3 ·** subir `UV_THREADPOOL_SIZE` y limitar las comparaciones bcrypt simultáneas por instancia; el costo 12 no cambia.
5. **Pendiente de confirmar al implementar M2:** qué pasa si Redis no responde. La propuesta es rechazar en las rutas
   públicas (*fail-closed*) y dejar pasar con alerta en el límite general (*fail-open*).

**Por qué.** El Backend no tiene estado salvo estos contadores: compartirlos es lo único que falta para correr varias
instancias (`plataforma/07-estudio.md`). Las dos transacciones por petición son el costo fijo más alto de la API.

**Qué cambia.** Redis en la VPS, en `docker-compose.dev.yml` y en el CI; `REDIS_URL`; `RateLimitGuard` y el freno de la
clave de acceso; `ValidateSessionUseCase`; `PasswordHasher`. Cierra DT-37, DT-110 y DT-111 y lleva SEG-19 a ✅. Se
construye en **MD-218** (M2 y M3) y **MD-219** (M1).

**Fuente:** Hector Rios, 2026-11-17 (Redis en lugar de Postgres y la aprobación de M1 a M3).
