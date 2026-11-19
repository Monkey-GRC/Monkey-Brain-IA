# Decisiones — Onboarding · Conexión de activos

Por qué este componente es como es. Lo vigente está en [`arquitectura/onboarding/conexion-activos/`](../../../arquitectura/onboarding/conexion-activos/README.md). Índice del módulo: [`README.md`](README.md).

## D46 · Componente 3 del onboarding: huecos cerrados por desarrollo

**Decisiones** (Carlos, 2026-10-01; **pendientes de ratificar con el comité**; ninguna toca cómo se
calcula el cumplimiento). Es el registro de cada hueco que `contracts/onboarding/conexion-activos/README.md` dejaba abierto
y cómo se cubrió. Lo que sigue siendo un parche está en **`deuda-tecnica/README.md`** (DT-2 en adelante).

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
   Cuando exista un conector real se agrega un tercer adaptador sin tocar los casos de uso (el de la nube, `runner`, es D58).
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

---

## D59 · La conexión descubre los activos de la cuenta y los muestra al cliente (2026-10-10)

**Decisión.** El comité aprobó que, al conectar, el cliente **vea los activos que la conexión reconoció** (no solo «la conexión funciona»). Se
evalúa cumplimiento sobre activos, no sobre conexiones.

1. **Cuándo.** Dentro de la **validación** (D58): el trabajador, ya con el rol asumido, lee el inventario de la cuenta y lo entrega junto con el cierre
   de la validación. Son lecturas de segundos, no el motor de minutos. Volver a comprobar la conexión **refresca** el inventario.
2. **Qué lee.** Servidores (EC2), bases de datos (RDS), almacenamiento (S3) y funciones (Lambda), **solo en las regiones declaradas** (D53). No necesita
   permisos nuevos: `SecurityAudit` y `ViewOnlyAccess` ya los cubren. Un servicio que no se puede leer **no tumba la validación**: se anota como
   «inventario incompleto» (no «vacío»).
3. **Dónde vive.** El activo sigue siendo la **cuenta** (D53); lo encontrado cuelga de él en `asset_resources`, que gana `kind` (`server`, `database`,
   `storage`, `function`, `other`; catálogo `resource_kind`) y `attributes` (JSON con lo que se pudo leer). `asset_provisionings.inventory_at` marca el
   último descubrimiento: **solo se muestra lo visto en él**, y solo de las regiones declaradas. Lo que ya no aparece no se borra (sus resultados
   siguen siendo evidencia). `kind = other` son recursos que solo conoce la evaluación (usuarios, políticas…) y **no** se muestran como activos.
4. **El sistema operativo es una inferencia.** AWS no dice el sistema operativo de una máquina; dice la **imagen** con la que se lanzó. Se infiere
   (`Ubuntu 22.04`, `Amazon Linux 2023`…) y se guarda con `os_source = image`; si la imagen no se puede leer o no se reconoce, queda **sin decir**
   (`DT-59`). La versión exacta llega con el canal de agente (D113, hoy solo en servidores on-premise).
5. **Seguridad.** Solo lectura; el error del proveedor nunca se registra ni se devuelve (puede traer datos de la cuenta); los atributos que entrega el
   trabajador se limpian (valores simples y cortos) antes de guardarse; máx. 500 recursos.

**Migración:** `20261010120000_resource_inventory`. **Contrato:** `GET /v1/assets/{id}/resources` en `contracts/onboarding/conexion-activos/README.md`.
**Fuente:** D53, D56, D58, SEG-51.

---

## D60 · Se retira el scope declarado («cuántos tienes») y el servicio muestra sus conexiones (2026-10-10)

**Decisión (producto).** Se elimina por completo el paso «¿Cuánto tienes?» del Componente 3: **no aportaba nada**. El cliente ya no declara cuántos
servidores, nubes, aplicaciones, bases de datos o equipos tiene; lo que tiene lo **ve al conectar** (D59). Por eso se retira del modelo y de la pantalla:

1. **Modelo:** se elimina la tabla `scopes` (migración `20261010130000_drop_declared_scope`) y sus relaciones con `services` y `companies`. Se retiran
   `PUT /v1/services/{id}/scope`, la acción de auditoría `service.scope` y el cálculo «declaraste X, conectaste Y». **DT-6 queda cerrada** (ya no hay
   contadores que reconciliar con las dimensiones).
2. **El paso 3 del onboarding** se da por hecho con el **escenario de despliegue** del servicio (antes: escenario *y* scope). `GET /v1/services` pasa de
   `technical_control.has_scope` a `technical_control.connection_count` (cuántas conexiones activas tiene el servicio).
3. **Pantallas.** Se retira el asistente de tres pasos. El **servicio** tiene su detalle (`/services/{id}`): su información ordenada, «dónde vive» y la
   **lista de conexiones**; las conexiones se crean en `/services/{id}/connections/new` (donde se proponen los métodos) y cada conexión tiene su detalle
   (`/services/{id}/connections/{id}`) con los **activos que encontró**. La edición del servicio pasa a `/services/{id}/edit`.

**Nota.** `scopes` figuraba en el modelo del comité (§6.3, C3). Se retiró por **decisión de producto del equipo (2026-10-10)**; conviene que el comité
la conozca, pero **no bloquea** nada. **Migración destructiva:** borra los contadores ya capturados; en dev se aplica con el deploy (el backend anterior
todavía lee la tabla).
**Fuente:** D46, D59.

---

## D61 · Cada recurso descubierto es un activo del cliente, y el servicio elige cuáles son suyos (2026-10-10)

**Problema.** D53 dejó la **cuenta** como único activo, y D59 mostraba todo lo que había dentro. Pero una cuenta puede tener recursos que no son del servicio que el cliente
quiere evaluar, o ser de varios servicios, y al cliente no le servía una lista de «Ubuntu 24.04» repetidos para distinguirlos.

**Decisión (producto, la opción más fiel al modelo del comité).**
1. **La conexión sigue siendo la cuenta** (`ac_01`): lleva el rol o las llaves, las regiones y el ExternalId.
2. **Cada recurso que descubre es un `asset` propio** (`origin = discovered`): servidor `ac_02`, base de datos `ac_03`, almacenamiento y funciones `ac_01`. Lleva su
   código `AST-####`, su IP (`ip_address`), su zona (`location`), sus etiquetas (`tags`), su `platform` (sistema operativo o motor) y su criticidad. Se enlaza a su
   conexión con `assets.parent_asset_id`, y a su recurso técnico con `assets.resource_id` (1:1). `asset_resources` **se queda** como el registro técnico que
   referencian los resultados de la evaluación (D56): no se toca.
3. **El servicio elige sus activos:** `service_assets` (el puente que el comité ya definió) enlaza cada activo descubierto a los servicios a los que da soporte, sin
   duplicarlo. **Por defecto no hay ninguno enlazado**: el cliente decide. Lo que no se enlaza queda visible como «no incluido».
4. **Lo que desaparece de AWS** pasa a `inactive` y **se desenlaza** de los servicios; no se borra (sus resultados son evidencia). Si un servicio de AWS no se pudo leer en ese
   descubrimiento, sus activos **no** se dan por desaparecidos. Volver a descubrir **no pisa** la criticidad ni el responsable que fijó el cliente.
5. **La evaluación sigue corriendo por cuenta** (así trabaja el motor), pero **el estado de preparación de un servicio mide solo sus activos**
   (`GET /v1/assets/{id}/readiness?service_id=`): se dejan fuera los resultados de activos de la conexión que **no** son del servicio. Lo que no tiene activo propio
   (usuarios, políticas, el registro de actividad: lo de toda la cuenta) **cuenta para todos los servicios que usan esa cuenta**.
6. **Dar de baja una conexión da de baja a sus activos** (`inactive`) y los desenlaza de los servicios; su historial se conserva.
7. **Los activos descubiertos no son conexiones:** no salen en `GET /v1/assets` (solo conexiones), no cuentan en `connection_count`, y no se validan, activan, programan
   ni editan por su cuenta (404).

**Migración:** `20261010140000_discovered_assets`. **Contrato:** `contracts/onboarding/conexion-activos/README.md` (`GET …/resources`, `PUT /v1/services/{id}/connections/{id}/assets`).
**Fuente:** D53, D56, D59, `modelo-datos.md` §6.3 (`assets`, `service_assets`), SEG-53.

---

---

## D67 · El paso 3 es un marketplace de plataformas y el catálogo de conexiones vive en la base de datos (2026-10-10)

**Problema.** «Nueva conexión» ofrecía las categorías técnicas (`ac_01`…`ac_06`) como tarjetas: «Servicios en nube», «Servidores en nube / VPS», «Bases de datos en nube».
Es una clasificación interna: el cliente no sabe a qué corresponde y, al tocar «Servicios en nube», **se asumía AWS** (era el único flujo construido) sin que él lo
eligiera. Además, qué conexiones se ofrecen por escenario, con qué frecuencia corre cada una, qué tipo de activo produce, qué canales admite y qué regiones acepta
estaban en constantes del código (`technical-catalogs.ts`, `onboarding-catalogs.ts`), no en la base.

**Decisión (producto; la lista de plataformas es la del comité).**
1. **El cliente elige una plataforma, no una categoría.** La pantalla es un marketplace agrupado por tipo; cada plataforma es una tarjeta con su logo. Al elegirla entra a
   **su propio paso a paso** (para AWS, el de D58). Nunca se asume una plataforma.
2. **Las plataformas son las de la hoja «Activos del Servicio (SCOPE)» del comité (AC-01…AC-06):** `ac_01` AWS, Azure, GCP, Microsoft 365, Google Workspace · `ac_02` y `ac_04`
   Linux, Windows, HP-UX, AIX, Solaris · `ac_03` PostgreSQL, MySQL, SQL Server, Oracle, MongoDB · `ac_05` PostgreSQL, MySQL/MariaDB, SQL Server, Oracle, MongoDB · `ac_06`
   Windows, macOS, Linux. En servidores y equipos la plataforma es el **sistema operativo**; en bases de datos, el **motor**. No es el hosting (EC2, Azure VM, RDS, Atlas…), que
   el comité cita solo como ejemplo de dónde vive: la medición depende del sistema operativo o del motor, y dónde vive ya lo dice el escenario (paso 1).
3. **Se muestran todas; solo se elige la que tiene un flujo real.** Cada plataforma tiene `availability` (`available` | `coming_soon`, el mismo enum que los marcos, D50) y la
   que no está disponible se muestra **bloqueada**. Hoy están `available` AWS y, en servidores on-premise (`ac_04`), Linux y Windows (D113). Marcar `available` sin flujo construido es un error; la API rechaza una plataforma bloqueada con
   `422 connection.provider_not_supported`.
4. **Todo lo que la pantalla ofrece y valida sale de la base** (esquema `catalog`, lo escribe solo `admin_monkey`, SEG-06): las plataformas, los canales de cada una, las
   frecuencias de cada conexión, qué conexiones ofrece cada escenario, el tipo de activo que produce cada conexión y las regiones de cada plataforma. Dejan de ser constantes.
5. **Lo demás no cambia:** las listas cerradas y pequeñas del onboarding (tamaño, industria, escenario…) siguen como `enum` (D26, D34). Las seis categorías, el escenario del
   servicio y el flujo conectar → validar → activar → programar siguen igual.
6. **Logos.** Cada plataforma lleva su **logo en SVG**, un icono cuadrado a todo color y sin fondo, del mismo tamaño para todas y con su variante para tema oscuro (`<logo_key>.svg` y `<logo_key>-dark.svg`), guardado en la plataforma (`Frontend-Platform`); la base solo guarda `logo_key`. Se muestra con `<img>`: nunca se
   inyecta SVG como HTML. Accesibilidad: el **nombre de la plataforma va siempre como texto visible** y el logo es decorativo (`alt` vacío); el estado bloqueado se dice con texto y
   `aria-disabled`, no solo con opacidad; el contraste se cumple en tema claro y oscuro con la variante oscura del logo (sin baldosa de fondo ni filtros); el logo no se redibuja.
7. **Consecuencia que conviene tener presente:** servidores, bases de datos y equipos quedan **bloqueados** hasta que exista su canal de agente (D113 abrió Linux y Windows en servidores on-premise; el resto sigue bloqueado). El formulario provisional de
   esas conexiones (DT-31, DT-56) deja de ofrecerse y la API lo rechaza: en desarrollo ya no se podrá dar de alta un servidor ni siquiera en modo simulado.

**Qué cambia en el modelo** (`modelo/06-onboarding.md` §6.3): tablas nuevas `capability_platforms`, `platform_connection_methods`, `platform_regions`, `capability_frequencies` y
`deployment_scenario_capabilities`; `automated_capabilities` pierde `supported_platforms` y gana `asset_type`; `assets` gana `platform_id` (obligatorio en una conexión, nulo en un
activo descubierto; `assets.platform` sigue siendo la etiqueta descriptiva, D61). La carga inicial es de `reference:load` (idempotente); los valores están en `contracts/enums.md`.

**Por qué tabla y no `enum`.** Un `enum` pide una migración por cada plataforma nueva y no lleva atributos (disponibilidad, logo, canales, regiones). En un marketplace que crece,
agregar una plataforma bloqueada es **un dato**; lo que sí exige código es habilitarla, porque necesita su flujo (adaptador y pasos).

**Implementado (2026-10-10).** Migraciones `20261010150000_connection_platform_catalog` (con la siembra) y `20261010150100_rls_connection_platform_catalog`; el código lee el catálogo con `ConnectionCatalogRepository`; se retiró el formulario provisional (DT-31, DT-56). Verificado: unitarias, e2e (incluida una prueba de que las reglas son datos), verificadores y la pantalla contra la API real en tema claro y oscuro. Los logos salen de colecciones de iconos, no de los kits (`DT-68`).

**Contrato:** `contracts/onboarding/conexion-activos/README.md` (plataformas en el catálogo, `platform` obligatorio, pantalla). **Pendiente:** el uso de los logos de marcas de terceros (`P21`).
**Fuente:** responsable de producto, 2026-10-10; hoja «Activos del Servicio (SCOPE)» del TSC integral (AC-01…AC-06); D46, D50, D58, D60, D61.

---

---

## D69 · El paso 3 se completa al definir dónde vive el servicio, e «Inicio» invita a conectar (cierra P17)

> **Reemplazada por D89 (2026-10-23):** el control técnico ya no es un paso del onboarding; se declara por servicio, cuando el cliente quiera y después de evaluar los riesgos del servicio.

**Decisión.** El Componente 3 sigue completándose al elegir el escenario de despliegue (D60). **No se exige** una conexión comprobada, ni siquiera para terminar el onboarding. Mientras el servicio no tenga ninguna
conexión comprobada, «Inicio» le sugiere conectar su primer sistema, pero no bloquea nada. Un cliente que solo tiene políticas (sin activos técnicos) puede darlo por hecho. `onboarding.completed_steps` y `next_step` de `GET /v1/auth/me` no cambian:
el aviso lo calcula «Inicio» con las conexiones del servicio.

**Por qué.** Exigirla habría bloqueado a quien aún no puede conectar (sin accesos o sin la plataforma disponible: hoy solo AWS, D67) y habría vuelto a poner un paso obligatorio que D60 retiró. El producto no tendría qué medir sin conexiones, y por eso el aviso insiste.

**Fuente:** responsable de producto, 2026-10-10; D60, D67.

---

---

## D92 · El cliente no declara dónde vive su servicio: elige la plataforma del catálogo y se le ofrecen las seis conexiones (2026-10-25; ajusta D46 y D60, reemplaza el paso 1 de D67)

**Decisión.**
1. **Se retira el escenario de despliegue** (`cloud_managed_only`, `cloud_with_servers`, `on_premise`, `hybrid`) como pregunta. El cliente abre «Nueva conexión» y ve el catálogo de plataformas (AWS, Azure, un sistema operativo, un motor de base de datos…): elegir una plataforma ya dice dónde vive lo que conecta.
2. **Se ofrecen siempre las seis conexiones** (`ac_01` a `ac_06`). `deployment_scenario_capabilities` deja de decidir qué se ofrece.
3. **Se retiran** `PUT /v1/services/{id}/deployment-scenario`, el catálogo `deployment_scenario`, la acción de auditoría `service.deployment_scenario` y los errores `DEPLOYMENT_SCENARIO_NOT_SET` y `CAPABILITY_NOT_APPLICABLE`. `GET /v1/services/{id}/technical-control` ya no trae `deployment_scenario` ni `is_complete`.
4. **«Control técnico hecho» pasa a significar «el servicio tiene al menos una conexión»** (`technical_control.is_complete` del servicio y el progreso de `GET /v1/auth/me`). Antes bastaba el escenario (D60); D69 ya había sido reemplazada por D89, que sacó el control técnico del onboarding.
5. **La columna y las tablas no se borran todavía.** `services.deployment_scenario`, `deployment_scenario_capabilities` y el enum quedan en la base sin uso; retirarlos es una migración destructiva sobre la base compartida y va aparte (`DT-81`).

**Por qué.** El escenario se preguntaba antes de mostrar un catálogo donde el cliente iba a escoger AWS, Azure o un sistema operativo de todos modos: era la misma respuesta dada dos veces, y la primera sin que el cliente supiera para qué servía. Además bloqueaba: sin escenario no se podía conectar nada, y cambiarlo fallaba si ya había conexiones que quedarían fuera. Una pregunta que solo existe para filtrar una lista que el cliente ya va a filtrar con el clic no aporta (`philosophy.md`: nada se pregunta sin que sirva).

**Lo que se aparta del comité.** El **bloque 2A del Excel** («Escenarios de despliegue del cliente, definen qué conexiones aplican») define estos cuatro escenarios, y `enums.md` los derivó de ahí. Esta decisión **se aparta del Excel**: queda **por ratificar con el comité**. Si el comité lo rechaza, se restituye con `git revert` de esta decisión y de su rama; el enum y las tablas siguen en la base por eso.

**Lo que no cambia.** El catálogo de plataformas y su disponibilidad (D67), los canales, las regiones, la regla de que el activo cuelga de la organización (A2) y la confidencialidad del proveedor del motor.

**Qué cambia.** `contracts/onboarding/conexion-activos/README.md`, `contracts/onboarding/contexto-servicio.md`, `contracts/enums.md`, `arquitectura/onboarding/README.md`, `modelo/06-onboarding.md`, `producto/flujo-end-to-end.md`, `DT-81`. Sin migración en esta decisión.

**Fuente:** Carlos Castaño, 2026-10-25 (responsable de producto): «seleccionar dónde están alojados sus servicios no aporta nada si al final va a escoger del catálogo donde aparecen AWS, Azure y demás».

---
