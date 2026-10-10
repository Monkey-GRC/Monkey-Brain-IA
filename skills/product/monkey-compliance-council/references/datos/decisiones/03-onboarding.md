# Registro de decisiones — D43–D47

> Parte de [`modelo-datos-decisiones.md`](../modelo-datos-decisiones.md) (índice). Clave de acceso y los 3 componentes del onboarding; el marco se contrata al registrar.
> Los identificadores (`D-n`, `A1`…) no cambian: se citan por su ID, no por la posición.

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

**Cómo quedó implementado** (detalle en `contracts/modules/auth.md`, "Estado de implementación"):

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

## D44 · Componente 1 del onboarding: huecos del contrato resueltos por desarrollo

**Decisiones** (Carlos, 2026-09-30; **pendientes de ratificar con el comité**, ninguna toca cómo se
calcula el cumplimiento). Son los huecos que el contrato de `onboarding-organizational-context.md`
dejaba abiertos:

1. **Sin guardado parcial.** El contrato hablaba de un `PATCH` "mientras el cliente escribe", pero las
   columnas obligatorias de `organizations` son `NOT NULL` y no se podía guardar a medias. Se eligió no
   tocar el schema: el avance vive en el navegador del cliente (por usuario, sobrevive a la expiración
   de la sesión) y se envía completo con `PUT` al final. Si el comité quiere borradores en el servidor,
   se vuelven opcionales esas columnas y se mueve la validación de completitud a la aplicación.
2. **Un solo `PUT`** crea o actualiza. Se retira `ORGANIZATION_ALREADY_EXISTS`, que citaba un `POST`
   que el contrato nunca definió.
3. **«Ninguna» es excluyente; «Otra» queda solo marcada.** «Otra» no tiene campo de texto porque el
   modelo no tiene dónde guardar cuál es; se añade si el comité lo pide.
4. **`none` y `other` son filas de `catalog.regulations`** (jurisdicción `n/a`): la tabla puente
   referencia por FK, y guardar «Ninguna» deja constancia de que el cliente contestó que no le aplica
   ninguna, que no es lo mismo que no haber contestado.
5. **Etiquetas en inglés traducidas por desarrollo** (el Excel solo trae español, salvo `size`),
   pendientes de revisión. Platform todavía no tiene i18n: hoy se ve todo en español.
6. **Dos catálogos de países** (`incorporation_country` y `client_country`) en lugar del único
   `country` del contrato: son listas distintas (12 y 13) y el schema ya tiene dos enums.
7. **Pasos del onboarding en `/auth/me`:** `organizational_context`, `service_context`,
   `technical_control`; `next_step` es `null` cuando el cliente terminó los tres. Hoy solo se deriva el
   primero (existe la organización).
8. **Presentación:** asistente guiado de 5 pantallas cortas más una de revisión, en vez de 10
   pantallas de una pregunta. Es una lectura de `philosophy.md` ("una pregunta o acción clara por
   paso") que agrupa campos afines para no cansar; si el comité prefiere una pregunta por pantalla,
   es un cambio solo de frontend.

**Por qué:** el brain define los 10 campos, sus opciones y la forma de la API, pero no estas
decisiones de detalle; en vez de dejar el sprint detenido se tomó el camino que no cambia el modelo y
se deja aquí para revisión.

**Fuente:** confirmación de Carlos, 2026-09-30.

---

## D45 · Componente 2 del onboarding: ajustes del schema y huecos resueltos por desarrollo

> ⚠️ **Parcialmente revertida por D51 (2026-10-05):** `service_regulations` (la regulación por servicio) se eliminó, y la
> Descripción del Sistema ya no es solo un enlace. Lo demás sigue vigente.

**Decisiones** (Carlos, 2026-09-30; **pendientes de ratificar con el comité**; ninguna toca cómo se
calcula el cumplimiento). Son los huecos que `onboarding-service-context.md` dejaba abiertos o que el
schema contradecía:

**Cambios de schema** (migración 24, `service_context_optional_fields_and_regulations`):

1. **`services.deployment_scenario` pasa a nullable.** El contrato dice que se captura en el
   Componente 3, pero la columna era `NOT NULL`: era imposible declarar el servicio antes de conectar la
   infraestructura.
2. **`subservice_organizations.provider`, `service_provided` y `responsibility` pasan a nullable.** El
   "detalle" del Excel es opcional y solo el `type` es obligatorio (el contrato ya lo decía).
3. ~~**Nueva tabla `service_regulations`**~~ **Revertida por D51** (la tabla se eliminó: la regulación se declara solo a nivel de empresa). Antes: servicio ↔ regulación, con RLS por `tenant_id`. Cerraba la
   pregunta abierta "regulación a nivel de servicio": el request del contrato ya traía
   `regulation_codes` y no tenía dónde persistir. No se puntúa (D10).

**Reglas del clonado** (lo que MD-80 / D36 dejaban sin precisar). **Superadas por D40** (Héctor, el
motor `CloneCatalogService`, que es el que corre): al fusionar `develop` se adoptó su versión. Lo que
cambia frente a lo escrito aquí: `source_ref` es `vanta:<código>`; las dimensiones y los vínculos con
pruebas **sí se clonan** (D39 sembró `control_dimensions`, ya no hay controles todos `manual`); con
solo `security` salen 79 controles. Se conservan de esta decisión la idempotencia, el no pisar y la
transacción única (puntos 8 y 9):

4. **Qué controles se clonan:** los ligados, por punto de enfoque, a requisitos del marco **cuyo criterio
   de confianza contrató el servicio** (contratar solo `security` no trae los de privacidad). Es lo que
   cuenta `applicable_requirements`. Con los 3 criterios `security + availability + confidentiality`
   salen 38 requisitos y 86 controles; con los 5, 61 y 118.
5. **Qué se clona del control:** `own_code` = código del catálogo (`CAP-1`); `client_interpretation`
   parte como la descripción del catálogo (el cliente la reescribe); `source_ref` = código de
   origen; `type` se deriva de sus dimensiones (una sola clase → esa; mezcla → `hybrid`; sin
   dimensiones → `manual`).
6. **Riesgos y causas:** se clonan **todos** los riesgos activos y todas las causas del catálogo (no se
   filtran por criterio: el criterio de un riesgo es de otra lista, §3.3), con sus relaciones; la
   relación causa ↔ control solo entre controles que el servicio sí clonó.
7. **Evidencia:** `validity_within_period` = el `evaluation_period` del marco (`AAAA-Tn`, trimestre de la
   contratación); `responsible_id` vacío (D30).
8. **El clonado es idempotente y nunca pisa:** repetirlo (al ampliar criterios con `PATCH`) solo añade lo
   que falta. Quitar criterios o un marco **no borra** nada: el marco pasa a `paused`.
9. **Es síncrono:** corre en la misma transacción que crea el servicio y el `201` ya trae
   `catalog.status = ready`. Tarda unos segundos contra la base remota (por eso `withScope` acepta un
   timeout mayor); el `processing` / `202` del contrato queda para cuando el volumen lo pida.

**Resto de huecos:**

10. **Descripción del Sistema: solo enlace** — **superado por D51** (ahora enlace y/o archivo). Antes: `kind = link`, `http`/`https`. El archivo
    (`multipart`, 25 MB) no se construyó: no hay dónde guardar binarios todavía. `kind = file` responde 422.
11. **Nombre único por empresa** sin importar mayúsculas ni espacios (`SERVICE_NAME_TAKEN`); la base no lo
    impone, la aplicación sí.
12. **`DELETE` con historia:** además de evaluaciones, bloquean la eliminación las **evidencias entregadas
    y los planes de acción** (todo trabajo del cliente). `409 SERVICE_HAS_EVALUATIONS`.
13. **(Superado por D47: `FRAMEWORK_NOT_CONTRACTED` ya se usa.)** **`FRAMEWORK_NOT_CONTRACTED` no se usa:** no existe una contratación de marcos a nivel de empresa en el
    modelo (los marcos se contratan por servicio, §6.1). Un código que no esté en `catalog.frameworks`
    responde 422 (`enum.invalid`); hoy solo existe `soc2` (D37).
14. **`PUT csocs` / `PUT cuecs` no se construyeron:** salen de las secciones 7 y 8 de la Descripción del
    Sistema, que aún no se procesa.
15. **Progreso (`/auth/me`):** `service_context` entra en `completed_steps` cuando existe al menos un
    servicio con un marco activo y su Descripción del Sistema; entonces `next_step` es `technical_control`.
16. **Presentación:** asistente de 6 pantallas más una de revisión (Tu servicio · Tus clientes · Datos y
    alcance · Marco · Proveedores · Cumplimiento), como el Componente 1. Una ficha de proveedor por tipo.

**Deja abierto:** `control_dimensions` está vacío en el catálogo (P10), así que hoy **todos los controles
clonados quedan `manual`** y sin dimensiones; el clonado ya las copia cuando se siembren.

**Por qué:** el brain define los 16 campos y la forma de la API, pero no estas decisiones de detalle; en
vez de dejar el sprint detenido se tomó el camino que no cambia el modelo de medición y se deja aquí para
revisión.

**Fuente:** confirmación de Carlos, 2026-09-30.

---

## D46 · Componente 3 del onboarding: huecos cerrados por desarrollo

**Decisiones** (Carlos, 2026-10-01; **pendientes de ratificar con el comité**; ninguna toca cómo se
calcula el cumplimiento). Es el registro de cada hueco que `onboarding-technical-control.md` dejaba abierto
y cómo se cubrió. Lo que sigue siendo un parche está en **`deuda-tecnica/README.md`** (DT-1 a DT-36).

**Cambios de schema** (migración 25, `asset_provisioning_schedule_frequency`, más el seed de las 6 capacidades):

1. **`asset_provisionings.schedule_frequency`** (nullable, enum `continuous|every_6h|every_24h`): el paso
   «programar» no tenía dónde guardar la frecuencia. `ac_01` admite `every_6h` y `every_24h`; `ac_02` a
   `ac_06`, solo `continuous`.
2. **`catalog.automated_capabilities` se siembra** con `ac_01` a `ac_06` (estaba vacía). `ac_01` a `ac_03`
   salen del contrato; `ac_04` a `ac_06` se completaron por analogía (DT-3). El campo interno de proveedor
   existe solo en el seed.

**Reglas del producto:**

3. **«Híbrido» ofrece las seis conexiones**: el cliente usa las que le sirvan, sin tener que clasificarse (DT-7).
4. **El tipo del activo se deduce de la conexión** (`ac_01` servicio en nube · `ac_02`/`ac_04` servidor ·
   `ac_03`/`ac_05` base de datos · `ac_06` endpoint): el cliente elige «qué quiere conectar» y no lo clasifica
   dos veces. Criticidad por defecto `medium`. Código del activo `AST-0001`, consecutivo **por empresa**.
5. **El scope declarado es un eje distinto de las dimensiones** («lo que dices que tienes»). Se compara con lo
   conectado por tipo: servidor, base de datos, nube, aplicación y endpoint cuentan; `network_device` y
   `documentation` no. «Conectado» = la conexión ya se comprobó (`validated`, `active` o `scheduled`). Los
   contadores admiten `0` y se piden como «más o menos» (DT-6).
6. **El paso 3 está hecho con el escenario y el scope**; conectar sistemas se recomienda pero se puede dejar para
   después («Lo haré más tarde»). Así no se bloquea a quien aún no tiene sus accesos a la mano.
7. **Cambiar de escenario no puede dejar huérfana una conexión ya registrada** (`409 CAPABILITY_NOT_APPLICABLE`
   con los códigos de los activos afectados).
8. **Un activo puede dar soporte a varios servicios** (A2): se enlaza al crearlo y borrar un servicio no borra el
   activo.

**Honestidad con el cliente («Automatizado ≠ Operativo»):**

9. **La sonda es un puerto (`ConnectionProbe`) con dos adaptadores**, elegidos por `PROBE_MODE`:
   - `unavailable` (por defecto): `validate` responde `503 CONNECTION_UNAVAILABLE`; el activo sigue
     `pending` (no `failed`: no es culpa del cliente) y la pantalla lo explica con calma.
   - `simulated` (solo desarrollo y demostración): da por buena la conexión si las credenciales están completas
     y **nunca confirma que el activo opere**: al activar queda `warning` y la pantalla lo etiqueta «modo
     demostración». El backend **se niega a arrancar** con `simulated` en producción.
   Cuando exista un conector real se agrega un tercer adaptador sin tocar los casos de uso (DT-1).
10. **`GET /v1/services/{id}/technical-control`** devuelve en una lectura el escenario, las conexiones que
    aplican, el scope (declarado y conectado), `is_complete` y `probe_mode`. `POST /validate` añade `mode`
    (`demo` | `live`). Se añaden `GET /v1/assets/{id}` y el error `409 ASSET_NOT_ACTIVE` (programar sin activar).

**Seguridad de las credenciales:**

11. **Se cifran con AES-256-GCM** (`CREDENTIALS_ENCRYPTION_KEY`, 32 bytes en base64; sin ella la app no arranca).
    Formato `v1.<iv>.<etiqueta>.<cifrado>`. Solo viajan al crear el activo; **nunca se devuelven, se registran en
    logs ni entran al audit trail**. Se descifran en memoria solo durante la comprobación, y la sonda corre
    **fuera** de la transacción de base de datos.
12. **Credenciales por conexión** (validadas, error por campo `credentials.<campo>`): `ac_01` cuenta + rol de
    solo lectura; `ac_03`/`ac_05` usuario y contraseña de solo lectura; `ac_02`/`ac_04` agente (sin
    credenciales, por defecto) o SSH (usuario + llave privada); `ac_06` solo agente. Los agentes no guardan
    credenciales (§6.3). Qué pide cada una en realidad y cómo se entrega el agente: DT-4.

**Confidencialidad (criterio de aceptación):** el proveedor del motor no aparece en ninguna respuesta, mensaje,
log, texto de i18n, archivo de `src/` ni bundle de la aplicación. El tipo `Capability` del backend **no tiene**
`provider`, así que ningún mapper puede filtrarlo por descuido, y una prueba lo comprueba en cada recorrido.

**Por qué:** el brain define el flujo y los endpoints pero no estas decisiones de detalle, y la aplicación va
a clientes reales: en vez de dejar el sprint detenido —o de fingir conexiones que no existen— se tomó el camino
más honesto y seguro, y se deja aquí para revisión.

**Fuente:** confirmación de Carlos, 2026-10-01.

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
