# Registro de decisiones — D53–D61

> Parte de [`modelo-datos-decisiones.md`](../modelo-datos-decisiones.md) (índice). Conexión con la nube, sonda de servidores, trabajador del motor de nube y descubrimiento de activos.
> Los identificadores (`D-n`, `A1`…) no cambian: se citan por su ID, no por la posición.

## D53 · Conexión con la nube: alcance, activo, regiones, canales y retención (2026-10-07)

**Decisión** (Héctor, desarrollo, 2026-10-07; **pendiente de ratificar con el comité**). No cierra `P14` A1 (el rol de cada motor sigue
abierto) ni D13; fija lo que desarrollo puede construir y probar sin esperar esa respuesta.

1. **Alcance de esta etapa: AWS, GCP y Azure.** Las integraciones con GitHub, Okta, M365 y demás SaaS quedan fuera hasta nuevo aviso.
2. **El activo en la nube es la cuenta** (AWS), la suscripción (Azure) o el proyecto (GCP). Los recursos hallados (instancias, volúmenes,
   grupos de seguridad, trails…) son **hijos** del activo y llevan su identificador del proveedor. Responde `P14` B1.
3. **Solo se evalúan las regiones que el cliente declare.** Un check de cuenta repetido por región cuenta como **una** evaluación;
   un check por recurso, una por recurso. Responde `P14` B3 y cierra la parte de DT-45 sobre regiones.
4. **El cliente elige el canal de conexión por activo** entre los que existen para esa categoría (rol de solo lectura, agente,
   claves), y Monkey lo guía; no se impone solo el más seguro. Se guarda como dato (`connection_method`). Un canal donde el cliente
   *empuja* datos de sistemas propios no existe en el catálogo del comité (`ac_01` a `ac_06`): queda **LATER** y se pregunta al comité.
5. **Retención de `check_results` en dos niveles** (propuesta que cierra la decisión de DT-48): corridas completas por un periodo corto
   (90 días por defecto) y, para el histórico largo (7 años), solo las **transiciones de estado** más un resumen diario.
   **Se pregunta al comité** si un auditor exigiría corridas completas más allá del periodo corto.

**Fuente:** conversación de desarrollo del 2026-10-07; `P12`, `P14`, DT-44, DT-45, DT-48.

## D54 · La sonda de servidores: un manager, un grupo por cliente, agente pre-registrado por Monkey (responde P12.2; 2026-10-07)

**Decisión** (Héctor, 2026-10-07; **pendiente de ratificar con el comité**; no cambia el modelo). El aislamiento entre clientes
(`DT-33`, `SEG-45`) se logra con **un solo manager y un grupo por cliente**, no con un manager por cliente (costoso en recursos).
Monkey **pre-registra** cada agente por la API del manager, le asigna el grupo del cliente y entrega la clave en el comando de
instalación; el agente no se inscribe por su cuenta ni declara su grupo. Al sincronizar, Monkey solo acepta resultados de agentes cuyo
grupo corresponda al `tenant_id`. **A verificar contra la documentación de la versión vigente** que la API soporta ese flujo.

**En desarrollo,** el motor de nube y el manager corren en contenedores en la VPS de desarrollo (7,6 GB de RAM; un manager sin
indexador ni dashboard cabe). `MANUAL → not_run` ya lo maneja el modelo y no requiere cambios.

## D55 · Entorno de desarrollo del control técnico: motor de nube y manager en la VPS (2026-10-08)

**Decisión** (Héctor, 2026-10-08; desarrollo; **pendiente de ratificar**; no cambia el modelo de datos). Lo verificado:

1. **Motor de nube:** contenedor efímero (`toniblyx/prowler:5.44.0`) en la VPS de desarrollo, con 2 GB de memoria y 2 CPU. Un escaneo
   completo de AWS (655 checks, 2 regiones) tardó unos 2 minutos. Las llaves se pasan por la entrada estándar (`--env-file /dev/stdin`),
   no se escriben en disco ni en el repo, y el contenedor se elimina al terminar (el `docker inspect` las conserva).
2. **Manager de la sonda:** `wazuh/wazuh-manager:4.14.6` (la versión de la sonda de pruebas), **sin indexador ni dashboard**, con ~0,5 GB
   de memoria en reposo y límite de 2 GB. La API (55000) escucha solo en `127.0.0.1`; solo el puerto de agentes (1514) está publicado.
   La contraseña de la API se generó en el servidor (`~/wazuh-manager/.env`, modo 600).
3. **D54 verificado:** la API pre-registra un agente (`POST /agents/insert` devuelve `id` y `key`) y se le asigna un grupo
   (`PUT /agents/{id}/group/{grupo}`). El enrolamiento abierto (1515) **no se publica**: no hace falta si Monkey entrega la clave.
4. **Lo que NO está resuelto:** el firewall de la VPS está inactivo y el SSH acepta contraseña; MinIO está publicado a todo internet.

**Fuente:** conversación de desarrollo del 2026-10-08; D53, D54, P12, P14, DT-33, DT-43.

## D56 · El control técnico de la nube en el modelo: recurso hijo, procedencia del mapeo y checks sin filas (2026-10-08)

**Decisión** (Héctor, 2026-10-08; desarrollo; **pendiente de ratificar con el comité**). Concreta D53 en el schema y fija cómo entra
el motor de nube al modelo sin romper el control atómico (el control no cuelga de un motor ni de un marco).

1. **`asset_resources`** (nueva, `tenant`, con RLS): el recurso hallado dentro de un activo de nube, único por `(asset_id, resource_uid)`.
   `check_results` lo referencia (`asset_resource_id`) y gana `region`, `status_detail` y `engine_severity`. Es la variante **normalizada** de
   lo que DT-44 proponía (columnas de recurso en `check_results`): el recurso no se repite en cada resultado.
2. **`executions`** gana `engine_version`, `regions` y `checks_executed`. **Un check que el motor no devuelve es `not_applicable`** (la cuenta
   no tiene esos recursos), no «no ejecutado»: el conjunto ejecutado es el catálogo de esa versión. Una corrida de AWS ejecutó 655 checks y
   solo 139 devolvieron filas.
3. **Procedencia del mapeo** (`mapping_provenance`: `engine_native` · `monkey_proposed` · `committee_ratified`) en `check_mappings` y `test_checks`.
   `test_checks` gana también `confidence` y `rationale`. **Gana siempre el comité**; el seed no pisa una asignación ratificada.
4. **El mapeo a SOC 2 va por la prueba**, no check → requisito: check → prueba → control → punto de enfoque → requisito. Se cargan 662 checks,
   3.413 mapeos del motor a los 6 marcos ofrecidos (D50) y 569 asignaciones propuestas a las pruebas `T-CLD`. De los 171 checks que el
   marco SOC 2 del motor lista, 165 reciben una prueba; 133 de las 569 asignaciones están corroboradas por ese mapeo. **104 checks no
   encajan en ninguna prueba de nube y quedan como cobertura no alcanzada**; no se fuerzan.
5. **`checks`**: `engine_native` es un origen nuevo; `title_es` y `verification_rule` pasan a anulables (el motor solo trae inglés y no tiene
   regla propia: no se inventa). `assets.external_account_id` guarda la cuenta de AWS, suscripción de Azure o proyecto de GCP.
6. **Los textos del motor son internos** (P11, P14 D3): nombran al proveedor en algunos casos y no salen al cliente.

**Fuente:** D53, D13, P14, DT-44, DT-50; escaneo del 2026-10-08 (`control-tecnico/cruce-nube-aws.md`). **Migraciones:**
`20261008120000_cloud_technical_control_model` y `20261008120100_rls_asset_resources`. **Seed:** `npm run cloud:extract|load|verify`.

## D57 · Quién ejecuta el motor de nube: un trabajador aislado (2026-10-09)

**Decisión** (Héctor, 2026-10-09; desarrollo; **pendiente de ratificar con el comité**; no cambia el modelo de datos). «Evaluar ahora» y las
corridas programadas las ejecuta un **trabajador separado del backend** (opción A de las tres consideradas):

1. El backend **no toca Docker**. Descartado montar el socket de Docker en el backend (le daría control del servidor).
2. «Evaluar ahora» crea una ejecución `queued`. El trabajador la **reclama**, asume el rol del cliente, lanza el motor en un contenedor
   efímero por cliente y por corrida con **credenciales temporales** (SEG-46), y entrega el resultado al backend por una API **interna**
   (SEG-47). El backend lo interpreta y lo guarda (la persistencia de D56). Una corrida que no conecta queda `failed`: es un problema de
   conexión, no un incumplimiento.
3. **Reclamar sin tenant** necesita buscar entre empresas, y RLS lo impide por diseño: se hace con una función `SECURITY DEFINER`
   angosta y con `search_path` fijo, el mismo patrón de las búsquedas previas al tenant (SEG-08).
4. **Dev:** el trabajador corre en la VPS de desarrollo y asume el rol con las llaves de una cuenta de pruebas, que hace de «Monkey».
   **Producción:** una identidad propia de Monkey, sin llaves guardadas (DT-43).

5. **Un activo no puede tener dos ejecuciones abiertas**, impuesto por un índice único parcial en la base. El reclamo y el barrido por
   timeout **no dejan rastro** (los hace la función SQL; son frecuentes y no son una acción de usuario, igual que DT-47); sí lo dejan «evaluar
   ahora», el cierre completado y el cierre fallido, en la misma transacción que su efecto (SEG-36).

**Alternativas descartadas:** el backend lanzando el contenedor (B) y solo importar un escaneo ya hecho (C), que sirve para una demo pero
no es «evaluar ahora».

**Fuente:** `P14` C, D53, D56, DT-43, SEG-46, SEG-47.

**Cómo quedó construido (2026-10-09, `Backend/src/runner/`):**

1. **Un entrypoint más de la misma base de código y de la misma imagen del backend** (`node dist/src/runner/main.js`): sin segundo lenguaje, sin
   `Dockerfile` ni pipeline nuevos. Capas propias: dominio (tipos y puertos `RunnerApi`, `CredentialBroker`, `ScanEngine`), un caso de uso
   (reclamar → credenciales → motor → entregar) y adaptadores (HTTP hacia `/internal/runner`, STS de AWS, Docker). No importa nada de
   `src/features`: habla con el backend solo por HTTP, y **no tiene acceso a la base de datos**. Escalar es subir réplicas (el reclamo usa
   `FOR UPDATE SKIP LOCKED`); correr el motor en la nube es escribir otro `ScanEngine`.
2. **El motor es una caja negra** en una imagen fijada por versión o digest (el trabajador se niega a arrancar con `latest`). Cada corrida: un
   contenedor efímero, sin capacidades, sin escalada de privilegios, sin montajes del servidor, memoria/CPU/procesos acotados, en la red por
   defecto de Docker (no la del backend: sin acceso a la API ni a la base) y **siempre eliminado**. El resultado se lee del propio contenedor.
3. **Credenciales:** el trabajador asume el rol del cliente con su `ExternalId` y entrega al motor credenciales **temporales** (1 hora). Rechaza un
   rol de otra cuenta que la declarada. Las regiones se validan con una expresión estricta antes de llegar a la línea de comandos del motor.
4. **Infraestructura** (`Backend/deploy/`): `docker-compose.dev.yml` versionado, con dos servicios nuevos (`docker-proxy` y `runner`), solo en la red
   `default` y sin puertos publicados. El trabajador recibe un entorno **aparte** (`runner.env`, en el servidor; antes, secreto `RUNNER_ENV_FILE`) con solo lo suyo. El
   workflow solo lo levanta si el compose de la VPS ya lo define.
5. **Verificado:** pruebas automáticas contra Docker real, contra el backend real y contra AWS real (una corrida completa con el motor real el
   2026-10-09: credenciales `ASIA…`, 429 filas, sin contenedores sobrantes, mismo resultado que el escaneo con llaves).

**Razones de fallo** (claves i18n que guarda `executions.failure_reason` y verá el cliente): `connection.role_not_found`, `connection.account_mismatch`,
`connection.credentials_invalid`, `connection.regions_missing`, `connection.not_configured`, `connection.provider_not_supported`,
`connection.method_not_supported_by_runner`, `execution.engine_failed`, `execution.engine_timeout`, `execution.output_invalid`, `execution.timed_out`.
Una prueba exige su texto en español e inglés y que ninguno nombre a un proveedor.

## D58 · El flujo de conexión de una cuenta de nube: validación real a través del trabajador (2026-10-09)

**Decisión** (Héctor, 2026-10-09; desarrollo; **pendiente de ratificar con el comité**). Concreta D53 y D57 para lo que el cliente hace en pantalla:
registrar su cuenta de AWS, darle a Monkey acceso de solo lectura y comprobar que funciona.

1. **El backend nunca toca la cuenta del cliente ni guarda llaves de AWS.** «Comprobar conexión» encola una **validación** y el trabajador (el único
   componente con identidad en AWS) asume el rol y comprueba que la cuenta es la declarada. El backend espera el resultado unos segundos, así que la
   pantalla recibe una respuesta síncrona (`PROBE_MODE=runner`). Si nadie atiende: `503` «no disponible», la validación se cancela y el activo no queda
   bloqueado; no es culpa del cliente y la conexión no cambia de estado.
2. **Dos tipos de ejecución, dos carriles** (`executions.kind`: `validation` y `assessment`). Una validación (segundos, con un cliente esperando) no
   puede quedar detrás de una evaluación de minutos: el trabajador corre un bucle por tipo. Una validación abierta más de 2 minutos se da por perdida;
   una evaluación, a los 30.
3. **Dos canales de conexión reales para AWS:** *rol de solo lectura* (recomendado: el cliente no comparte secretos, crea en su cuenta un rol con una
   plantilla y entrega su ARN) y *llaves de acceso* (menos seguro, con aviso, cifradas y nunca devueltas). El tercero, el *agente*, solo existe como
   diseño: no se afirma que verifique nada.
4. **ExternalId generado por Monkey, por activo** (`mk-…`), guardado en `asset_provisionings.external_id`. No es un secreto del cliente: evita que otro
   cliente de Monkey use el rol de este. El cliente lo pega como parámetro de la plantilla junto con la identidad de Monkey
   (`MONKEY_AWS_PRINCIPAL_ARN`, configuración).
5. **La plantilla se descarga** (`GET /v1/connection-templates/aws-readonly-role`, el código es su única fuente) y se crea en CloudFormation a mano. El
   enlace de «un clic» exige alojarla en S3 y queda para después (`DT-55`).
6. **Nada se hardcodea en la pantalla:** las regiones (`aws_region`) y los canales (`connection_method`) salen de los catálogos del backend; el alta solo
   acepta las regiones ofrecidas; los pasos de instrucciones y los motivos de fallo llegan ya traducidos (la plataforma no tiene i18n propio, `DT-21`).
7. **El formulario provisional del paso 3 sigue aceptándose** en la API (sin `connection_method`) hasta retirarlo (`DT-31`, `DT-56`); la pantalla ya no lo usa
   para la nube.

**Verificado** (2026-10-09): pruebas automáticas (31 de conexión, por HTTP) y una corrida real de punta a punta con **navegador, backend, trabajador y
AWS reales**: alta → instrucciones → plantilla descargada → fallo con identificador equivocado (mensaje claro) → validación correcta → activación →
evaluación (429 filas, ~3 min) → «Evaluación completada»; y el canal de llaves, validado sin que la llave aparezca en la página ni en ninguna respuesta.

**Fuente:** D53, D56, D57, `contracts/modules/control-tecnico-operacion.md`, SEG-46, SEG-47, SEG-50.

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
   (`DT-59`). La versión exacta llega con el canal de agente (`DT-57`).
5. **Seguridad.** Solo lectura; el error del proveedor nunca se registra ni se devuelve (puede traer datos de la cuenta); los atributos que entrega el
   trabajador se limpian (valores simples y cortos) antes de guardarse; máx. 500 recursos.

**Migración:** `20261010120000_resource_inventory`. **Contrato:** `GET /v1/assets/{id}/resources` en `contracts/modules/onboarding-technical-control.md`.
**Fuente:** D53, D56, D58, SEG-51.

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

**Migración:** `20261010140000_discovered_assets`. **Contrato:** `onboarding-technical-control.md` (`GET …/resources`, `PUT /v1/services/{id}/connections/{id}/assets`).
**Fuente:** D53, D56, D59, `modelo-datos.md` §6.3 (`assets`, `service_assets`), SEG-53.

---
