# Decisiones — Control técnico

Por qué Control técnico es como es. **Se consulta para reabrir, no para construir**: lo vigente está en [`arquitectura/control-tecnico/`](../../arquitectura/control-tecnico/README.md) y en `datos/modelo/`. Índice de todas las decisiones: [`README.md`](README.md).

## D48 · Paso 3 del control técnico: lo verificado contra la sonda real y por qué el flujo actual es provisional

**Qué se verificó** (Carlos y desarrollo, 2026-10-02, con el `.env` de pruebas y la documentación pública de la sonda):

1. **Monkey no instala ni se conecta a los equipos del cliente.** El agente corre en el equipo del cliente, habla **hacia
   afuera** con el manager (1514/1515) y las pruebas de configuración (SCA) corren **en el agente**. Lo que Monkey lee es lo que
   el manager ya tiene: su base y su API. La base de referencia del repo (`prueba_wazuh`: `cis_checks`, `cis_check_results`,
   `wazuh_agents`) es el destino de esa sincronización; no tiene columna de empresa y guarda solo la última foto.
2. **Las integraciones de AWS y Azure de la sonda son ingestión de registros**, no evaluación de la configuración de la cuenta.
   No equivalen al modelo de Vanta (rol entre cuentas en AWS, federación de identidad en GCP, registro de aplicación en Azure,
   sin contraseñas).
3. **El aislamiento entre clientes no lo da la sonda.** La clave de inscripción es global y el agente puede declarar su propio
   grupo: Monkey debe imponer que un agente solo se asocie a la empresa que lo inscribió. La API permite roles de solo lectura
   por grupo.
4. **Cobertura real de plataformas hoy:** 3 políticas (Ubuntu 22.04, Ubuntu 14.04, Windows 11). Cualquier otro sistema no tiene
   pruebas de configuración.
5. Desde la máquina de desarrollo la API de la sonda no respondió (todos los puertos): probable lista de IP permitidas. No se
   envió ninguna credencial.

**Consecuencia:** el formulario actual del paso 3 (credenciales por conexión: rol de lectura, usuario de base, llave SSH) lo
definió desarrollo (D46, DT-4) **antes** de esta verificación y **no coincide** con el modelo real. Se deja como está y se
declara provisional; no se promete a ningún cliente. Qué cambia y en qué orden queda como pendiente del comité (**P12**) y como
deuda (**DT-31 a DT-36**).

**Por qué no se cambió ya:** rediseñarlo sin saber quién instala los agentes, cómo se asigna cada cliente a su grupo y quién
configura la nube sería inventar; el brain manda y ante un vacío se pregunta.

---

---

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

---

## D54 · La sonda de servidores: un manager, un grupo por cliente, agente pre-registrado por Monkey (responde P12.2; 2026-10-07)

**Decisión** (Héctor, 2026-10-07; **pendiente de ratificar con el comité**; no cambia el modelo). El aislamiento entre clientes
(`DT-33`, `SEG-45`) se logra con **un solo manager y un grupo por cliente**, no con un manager por cliente (costoso en recursos).
Monkey **pre-registra** cada agente por la API del manager, le asigna el grupo del cliente y entrega la clave en el comando de
instalación; el agente no se inscribe por su cuenta ni declara su grupo. Al sincronizar, Monkey solo acepta resultados de agentes cuyo
grupo corresponda al `tenant_id`. **A verificar contra la documentación de la versión vigente** que la API soporta ese flujo.

**En desarrollo,** el motor de nube y el manager corren en contenedores en la VPS de desarrollo (7,6 GB de RAM; un manager sin
indexador ni dashboard cabe). `MANUAL → not_run` ya lo maneja el modelo y no requiere cambios.

---

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

**Fuente:** D53, D13, P14, DT-44, DT-50; escaneo del 2026-10-08 (`arquitectura/control-tecnico/motores/cruce-nube-aws.md`). **Migraciones:**
`20261008120000_cloud_technical_control_model` y `20261008120100_rls_asset_resources`. **Seed:** `npm run cloud:extract|load|verify`.

---

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

---

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

**Fuente:** D53, D56, D57, `contracts/control-tecnico.md`, SEG-46, SEG-47, SEG-50.

---

## D70 · El cliente ve el resultado de una prueba con un nombre neutro; los textos del comité son internos (cierra P11)

**Decisión.**
1. Los textos de las 61 pruebas del comité (herramienta, limitaciones, prerrequisitos…) **se guardan tal cual** —son la fuente— y **nunca salen** a una pantalla, un reporte, una notificación ni un texto de IA.
2. De una prueba, el cliente ve **solo su resultado y un nombre neutro** que escribe Monkey.
3. `tests` gana `display_name`: el nombre neutro. Es igual al del comité cuando este no nombra al proveedor y se reescribe cuando sí lo nombra. Hoy son 4 pruebas: `T-SRV-001` («Evaluación de configuración/hardening de servidores»), `T-SRV-002`
   («Monitoreo de integridad de archivos críticos»), `T-SRV-003` («Detección de vulnerabilidades en servidores») y `T-SRV-005` («Validación de gestión y monitoreo de logs de servidores»): sus nombres del comité terminan en «mediante Wazuh …».
   El campo con el proveedor (`tests.tool`) sigue siendo interno.

**Por qué.** La confidencialidad del proveedor frente al cliente es regla del comité y no se negocia (`philosophy.md`). El cliente no necesita el texto de la prueba para entender su resultado, y reescribir cuatro nombres es barato.

**Cierra** `P11`. Lo verifica `SEG-39` (MD-87) cuando se construya.

**Fuente:** responsable de producto, 2026-10-10; `philosophy.md`, `modelo-datos.md` §3.3.

---

---

## D71 · Cómo lee Monkey a la sonda y qué se promete (cierra P12)

**Decisión.** Lo que quedaba de `P12`, ya con lo decidido en D53, D54 y D58:
1. **Cómo lee los resultados:** por la **API de la sonda**, con un usuario de **solo lectura por grupo** (un grupo por cliente, D54). No se lee la base del indexador: no hay indexador. **A verificar contra la documentación de la versión vigente** que la API permite limitar un rol a un grupo; si no, se acota en el adaptador.
2. **Quién configura la nube:** ya está respondido: el cliente crea el rol de solo lectura y Monkey lo valida (D58). Qué motor la evalúa en producción es `P14`.
3. **Qué se promete:** **solo lo que tiene prueba**. Hoy hay pruebas para Ubuntu 22.04, Ubuntu 14.04 y Windows 11; cualquier otro sistema operativo, motor de base de datos o plataforma sin prueba no se ofrece como conectable (se muestra bloqueado, D67) hasta tener la suya.
4. **La IP de desarrollo en la API de la sonda:** se autoriza cuando se vaya a probar un adaptador real. Es una **acción de infraestructura** (cambia el firewall o las credenciales de la API): la ejecuta quien administre el VPS y, como todo cambio de firewall, pasa por el usuario antes.

**Qué sigue siendo trabajo, no pregunta:** el instalador de Monkey y el comando de instalación del agente (`DT-57`), el vínculo activo ↔ agente (`DT-32`) y el aislamiento por grupo (`DT-33`).

**Cierra** `P12`.

**Fuente:** responsable de producto, 2026-10-10; D53, D54, D58, D67.

---

---

## D90 · De una prueba técnica el cliente ve qué falló y cómo corregirlo, con la guía del catálogo traducida (2026-10-23)

**Decisión.**
1. En la vista técnica (`admin_empresa`, `consultor`, `auditor`; D81), cada **prueba automática de nube** de un control muestra, si falla, **qué comprobaciones fallaron, en qué recursos y cómo corregirlas**: `GET /v1/controls/{control_id}/tests/{test_id}/findings` (`contracts/cumplimiento/veredictos.md`).
2. Sale de la última corrida completada de cada conexión de nube del servicio, solo los `failed`, de los checks que alimentan la prueba con la misma regla que las evaluaciones (ratificados por el comité; los propuestos solo con `READINESS_INCLUDE_PROPOSED`).
3. **La guía de corrección es la del catálogo, traducida por Monkey con IA.** El catálogo guarda el texto original (inglés); `catalog.checks.title_es` y `remediation_es` guardan la traducción y `translation_origin` dice que es automática (`machine`) hasta que alguien la revise (`reviewed`). La respuesta marca `is_ai_generated: true` y la pantalla lo etiqueta. Sin traducción, sale el original con `language: "en"`.
4. **Nada nombra al motor (D70).** No sale el código del check, ni el tipo de recurso del motor, ni el mensaje por recurso que escribe el motor (`status_detail`: texto crudo, en inglés y dinámico). Un título o una guía que nombre al proveedor se omite: es una red de seguridad (una expresión regular), **no una revisión**. Las traducciones se escriben sin nombrar al proveedor.
5. Mientras tanto **no es la plantilla de siete campos** (`P14` E2): no dice por qué importa, quién, cuánto tarda ni qué impacto tiene. Es el subconjunto «qué falló y cómo se corrige».

**Por qué.** Un control que falla sin decir cómo arreglarlo no le sirve al cliente (la maqueta del comité y `philosophy.md` piden que el hallazgo diga qué hacer). El texto ya existía en el catálogo (662 checks de nube); faltaba entregarlo, en español y sin el nombre del proveedor.

**Lo que se aparta del contrato.** `contracts/control-tecnico.md` dice «nunca se muestra el texto crudo del motor». Aquí se muestra la guía del motor **traducida y marcada como de IA**, no cruda; el mensaje por recurso (lo verdaderamente crudo) se queda fuera. Se registra como `DT-78`.

**Lo que no cambia.** D70 (los textos del comité y el nombre del proveedor son internos), D81, la regla de las evaluaciones (D56) y que la IA nunca certifica.

**Qué cambia.** `contracts/cumplimiento/README.md`, `contracts/control-tecnico.md`, `DT-78`. Migración aditiva: `remediation_es` y `translation_origin` en `catalog.checks`.

**Fuente:** Carlos Castaño, 2026-10-23 (responsable de producto): «hazlo, cuidando de no mencionar nada del proveedor».

---

---

## D100 · Dos motores con roles distintos: Prowler para la nube, Wazuh para servidores, BD y endpoints (2026-10-31; cierra P14 A1 y A2, acota la frase «validador único» de D13)

**Decisión.**
1. **Prowler maneja todo lo de la nube** (cuentas de AWS, suscripciones de Azure y proyectos de GCP): evalúa su configuración y entrega los resultados a las pruebas `T-CLD`. Ratifica D53–D58, que desarrollo había construido «pendiente de ratificar».
2. **Wazuh sigue como la sonda de servidores, BD y endpoints:** mide su configuración (SCA), monitorea amenazas en tiempo real y responde a incidentes. Deja de describirse como «validador único» solo porque ya no cubre la nube.
3. **Ninguno de los dos se nombra al cliente** (D70): ante él son «sonda», «capacidad automática» o «evaluación automática». Cierra `P14` A2.
4. **Qué no cambia.** Lo ya construido de la sonda (agentes pre-registrados por grupo, D54; lectura de la API, D48, D71) sigue como está; esta decisión no retira ninguna prueba ni check de servidores: las pruebas de configuración siguen con la sonda.

**Qué cambia.** `arquitectura/control-tecnico/motores/` (README, `wazuh.md`, `prowler.md`), `modelo/08-control-tecnico.md`, `architecture.md`, `mvp-roadmap.md`, `SKILL.md`. La frase «Wazuh SCA/Cloud Security como validador único» del comité queda acotada: Wazuh valida servidores, BD y endpoints; la nube, Prowler. `P14` queda abierta solo en B, C, D y E; D13 sigue vigente en lo suyo (la nube sin checks se reporta como cobertura pendiente).

**Fuente:** Rod, en la limpieza del cerebro del 2026-10-31.

## D112 · GCP se conecta por federación de identidad desde el rol de AWS de Monkey, sin claves (2026-11-12)

**Decisión** (Rod, 2026-11-12, MD-214; desarrollo; **pendiente de ratificar con el comité**). Concreta D53 y D58 para GCP:

1. **Canal `identity_federation`** (`connection_method`), el único de `gcp`. El activo es el **proyecto** (`external_account_id` = ID del
   proyecto) y **no lleva regiones**: el motor evalúa el proyecto completo y sus hallazgos son `global` (`cruce-nube-gcp.md`).
2. **El cliente no entrega ningún secreto.** Pega en Cloud Shell un comando que Monkey arma con el script completo dentro (no se publica en
   ninguna URL; también se descarga tras la sesión). El script crea **en el proyecto evaluado**: el pool `monkey-access`, el proveedor de AWS
   `monkey-aws` que **solo acepta la sesión `arn:aws:sts::<cuenta de Monkey>:assumed-role/monkey-gcp-federation/<external_id>`**, la cuenta de
   servicio `monkey-reader` con solo lectura (`roles/viewer`, `roles/iam.securityReviewer`, `roles/stackdriver.accounts.viewer`) y el permiso
   para que esa sesión la use; activa las APIs que hacen falta e imprime el **número de proyecto**, que el cliente devuelve
   (`PATCH /v1/assets/{id}/connection`).
3. **La identidad de origen es un rol de AWS de Monkey, `monkey-gcp-federation`, sin permisos.** El trabajador lo asume con el
   `external_id` del activo como nombre de sesión. Es lo que aísla a los clientes (el equivalente del `ExternalId`, D58): el proyecto de un
   cliente rechaza la sesión de cualquier otro, así que declarar el proyecto ajeno no sirve.
4. **El motor solo recibe un token de acceso de 1 h** de esa cuenta de servicio (`CLOUDSDK_AUTH_ACCESS_TOKEN`). El intercambio (STS de Google
   y `generateAccessToken`) lo hace el trabajador; el motor no ve credenciales de AWS ni de Google (SEG-46).
5. **Validar** = obtener el token y comprobar que el proyecto es el declarado. Un fallo es de conexión, no un incumplimiento (D57).
6. **El trabajador se organiza por adaptadores de nube** (credencial, motor, inventario) detrás de los puertos que ya tiene: AWS y GCP sin
   tocar el caso de uso (D110, «frontera del conector»).
7. **GCP sigue «Próximamente» en el catálogo** hasta que existan sus pantallas; en desarrollo, `PREVIEW_PLATFORMS=gcp` deja declararlo por la
   API (nunca en producción, `DT-104`).

**Por qué.** Una clave JSON de una cuenta de servicio de Monkey sería un secreto de larga vida con acceso a todos los clientes (SEG-26). Una
cuenta de servicio por cliente en el proyecto de Monkey choca con el tope de 100 por proyecto. Un proyecto dedicado en el cliente (como Vanta)
exige permiso para crear proyectos y facturación propia para los checks de monitoreo; queda para conectar organizaciones completas.

**Qué cambia.** `contracts/onboarding/conexion-activos/conectar.md`, `contracts/enums/onboarding/conexion-activos.md`, `contracts/control-tecnico.md`
(API interna del trabajador), `cruce-nube-gcp.md`, `Backend/src/runner`, `DT-102` a `DT-104`. **DT-105 cerrada el 2026-11-13:** cada backend marca sus ejecuciones con su grupo (`RUNNER_POOL`, por defecto `default`) y solo entrega a su trabajador las de ese grupo, así que quien prueba en local con la base de desarrollo ya no compite con el trabajador del servidor. **DT-101 cerrada el 2026-11-13:** la política de confianza de `monkey-gcp-federation` solo acepta a `monkey-audit` (ya no a toda la cuenta de Monkey).

**Fuente:** Rod, en la sesión de MD-214 del 2026-11-12 (eligió el rol de AWS de Monkey y la identidad en el proyecto evaluado).
---

## D113 · La sonda de servidores en el Backend: la lee el trabajador, cada servidor es un agente de su empresa y el volumen se conserva (BORRADOR, 2026-11-11; ajusta D54 y D71)

**Estado: borrador para aprobar por Carlos; después, pendiente de ratificar con el comité.** Hasta entonces nada se construye sobre él salvo lo ya autorizado en la rama `feat/sonda-sca-sync` del Backend.

**Por qué ahora.** Se verificó el 2026-11-11 que el Backend **no lee la sonda de servidores todavía**: `WAZUH_API_URL` y `WAZUH_DATABASE_URL` del `.env` no las usa ningún código (son de un prototipo) y `Asset` no tiene vínculo con el agente (`DT-32`). Solo existe el camino de la nube (D57). Una prueba real ya funcionó con un servidor sin interfaz: el agente envió eventos del sistema, aunque no se confirmó su evaluación de configuración.

**Decisión.**
1. **Quién la lee: el trabajador aislado (D57)**, no un adaptador dentro del Backend. *Ajusta D71 y la nota de `contracts/control-tecnico.md` («en `agent` no hay corrida del trabajador»).* La credencial de la sonda vive **solo** en el trabajador, y es un usuario de la API de **solo lectura**. *Porqué:* esa clave alcanza a todos los clientes; no debe vivir en el proceso que atiende a los usuarios.
2. **Una ejecución por servidor.** Es la misma tabla `executions` (`kind = assessment`, conexión `agent`). El trabajador lee las pruebas de configuración (SCA) del agente por la API y las entrega al Backend; el Backend las interpreta con el mismo camino que la nube (`check_results` → `evaluations`).
3. **Aislamiento entre empresas, en tres capas.** (a) En la sonda: **un grupo por empresa**, con su `tenant_id` (UUID), nunca su nombre. (b) En la sonda: el **nombre del agente es el ID del activo**, no el del servidor (la sonda exige nombres únicos en todo el manager; dos empresas con `srv-01` chocarían). (c) En Monkey: la tabla `asset_agents` (`tenant_id`, RLS), con el agente único. **Manda la capa de Monkey:** se identifica por `agent_id`, no por el grupo que el agente declare, y además se comprueba que el grupo real coincida con el `tenant_id` del activo (`SEG-45`). Si no coincide, no se guarda nada, la ejecución queda `failed` (`connection.agent_group_mismatch`) y se audita. «Coincide» significa: su grupo contiene el `tenant_id` **y ningún otro grupo con forma de empresa** (otro UUID); un grupo que no es un UUID (p. ej. uno de configuración por sistema operativo) no estorba. La comprobación se hace en el trabajador y **otra vez en el Backend**: el trabajador es un proceso aparte y no se le cree a ciegas. Un agente sin activo (los de prueba) se ignora y nunca aparece a ninguna empresa.
4. **Alta del agente.** Al declarar el servidor, el cliente elige su sistema operativo y recibe **comando** (Linux, macOS) o **comando y archivo descargable** (Windows). **La clave va dentro del comando** (Carlos, 2026-11-11: el administrador copia un comando de todos modos, y es lo habitual en el mercado; la alternativa de un código de un solo uso que pide la clave al instalarse queda como mejora pendiente y **no cambia la pantalla ni el contrato**). Condiciones: una clave **por servidor**, nunca una compartida; se muestra **una vez** y se marca como sensible; si el administrador no la copió, «Generar de nuevo» borra el agente y crea otro; nunca va a la bitácora ni a la auditoría; el Backend la guarda **cifrada solo unos minutos** para entregarla al navegador y la borra al leerla. Monkey crea el agente (D54) con una credencial de **escritura** distinta de la de lectura. **Quién lo ejecuta: el trabajador, en un carril corto propio** (tipo de ejecución `enrollment`, como la validación de la nube, D58), con la credencial `monkey_enroll` (Carlos, 2026-11-12). Así ninguna credencial de escritura de la sonda está en el proceso que atiende a los usuarios, y la de lectura (`monkey_sync`) nunca puede escribir: el trabajador **se niega a arrancar** con el mismo usuario para las dos, y la sesión de lectura rechaza cualquier cosa que no sea un `GET`. El trabajador retira un agente anterior **por su nombre** (el id del activo) antes de crear el nuevo, y si el agente se creó y no llegó a guardarse, no lo deja suelto en la sonda. El comando se muestra con un `POST` (no un `GET`): leerlo lo gasta, la entrega es atómica y un reintento no puede llevarse la clave. Los instaladores (Linux y Windows) los sirve el backend, **públicos y sin secretos**. Lo que el cliente declara **antes** es la **versión** de su sistema («Ubuntu 22.04 LTS»), de un catálogo servido por el Backend (`<sistema>_version`): de ella salen el comando correcto y qué evaluación se espera.
5. **Volumen: se mantiene el modelo actual.** `check_results` guarda una fila por check y por corrida, como la nube; el volumen se controla con un **tope de frecuencia** y una **retención por periodo auditado**. Los valores están por definir. *Se descarta por ahora* guardar solo el estado actual más los cambios: obligaría a tocar cómo lee Cumplimiento (§9). Se reabre con cifras reales (hoy hay 0 clientes).
6. **La sonda no guarda historial de configuración** (solo el estado actual de cada check, verificado en el esquema público v4.14.1): el historial lo construye Monkey, ya lo decían `wazuh-api.md` y `wazuh.md`.
7. **Lo que el catálogo no conoce no se inventa.** Una política que no esté en el catálogo (p. ej. un benchmark nuevo) no se guarda: se informa como cobertura no alcanzada, igual que la nube (D56).
8. **Limpieza.** Al quitar un activo o archivar una empresa, su agente se elimina del manager. Un agente sin dueño no debe seguir enviando. *Construido para dar de baja un servidor* (2026-11-12): se suelta el vínculo y la clave al instante y el trabajador retira el agente por su nombre (`DT-106`: sin trabajador en 2 minutos, queda sin retirar). *Falta:* archivar una empresa. *Ids reciclados:* la sonda reutiliza el id de un agente borrado; al crear uno nuevo, un vínculo viejo con ese id (de cualquier empresa) se suelta en vez de bloquear el alta, porque la sonda acaba de crear ese agente y el dueño anterior ya no existe en ella.

9. **Versiones fijas y soportadas.** El manager y el agente van a la **misma versión exacta**. El instalador, que sirve Monkey, fija la versión del agente en su configuración y verifica la huella del paquete; nada se actualiza solo (el repositorio oficial ya ofrece agentes 4.14.7 a 4.14.10: sin fijarla se instalaría una distinta a la del manager). El trabajador lee la versión de la sonda y **solo lee las de su lista de soportadas** (`SONDA_SUPPORTED_VERSIONS`, por prefijo, p. ej. `4.14`): fuera de ella se niega a leer (`execution.probe_version_unsupported`) y avisa, en vez de adivinar y guardar datos que no entiende.
10. **Cómo se actualiza.** El manager **antes** que los agentes (un agente no puede ser más nuevo que su manager). Los parches se aplican **a mano**, tras pasar por un manager de pruebas y por las pruebas del adaptador, que corren contra respuestas reales capturadas de la sonda. Ninguno se aplica solo. *Para el MVP* el manager de pruebas es un contenedor en el equipo de desarrollo con la misma versión; **antes del primer cliente de pago se monta uno de verdad en una VM** (fecha por definir; sin ella, esta condición no cuenta).
11. **Dos usuarios de la API, ninguno administrador.** Lectura (`monkey_sync`): agentes, grupos, SCA, inventario y la versión (las políticas de fábrica 4, 5, 25, 28 y 31). Alta (`monkey_enroll`): crear agentes y grupos, asignar grupo y borrar, con un rol propio (el `agents_admin` de fábrica trae de más: reiniciar, actualizar y desinstalar). **Verificado: `agent:read` permite leer la clave de un agente**, así que el usuario de solo lectura podría hacerse pasar por un servidor y entregar datos falsos. Por eso su clave vive solo en el trabajador y el puerto de la API debe aceptar solo la IP del trabajador, no todo internet.
12. **El catálogo de checks.** Los 11.352 checks y su prueba asignada (columna `TEST` de la hoja `Checks` del Excel del comité, **multivalor**: un check puede pertenecer a varias pruebas a la vez, p. ej. `T-SRV-001` más `T-SRV-010`) **no están cargados en el Backend** (el seed los deja fuera). Con la sonda local se comprobó que los 207 checks de Ubuntu 22.04 que entrega la sonda existen en esa hoja por *nombre de la política + id del check*, con el mismo título y las mismas etiquetas de SOC 2. **Procedencia: `monkey_proposed`** (Carlos, 2026-11-11): la hoja `Checks` **no es la versión final** (el comité espera un documento con más información), así que la asignación entra como propuesta de Monkey y el comité la ratifica por prueba cuando llegue ese documento, como se hizo con las 569 de la nube (D56). Gana siempre lo `committee_ratified`: ningún proceso automático lo pisa.
13. **La lectura la pide Monkey solo** (Carlos, 2026-11-12). La sonda no avisa cuando un servidor se conecta, así que una tarea programada del Backend deja en cola las lecturas que tocan; el trabajador las reclama como cualquier otra. *Porqué:* que el cliente instale y la pantalla pase sola de «Esperando» a «Conectado», sin un paso manual, y que un servidor conectado se relea para que el cumplimiento no envejezca. Valores aprobados: **cada 3 minutos** mientras no se conecta, **hasta 24 horas** desde que se creó su agente; **una vez al día** un servidor conectado; **cada hora** uno desconectado o con una lectura fallida. Son configurables por entorno (`AGENT_*`). Una lectura automática que «todavía no estaba lista» **no es un error del cliente**: no sale en su historial ni se audita (serían cientos de filas); el paso de conectado a desconectado sí se audita. Pasado el plazo sin conectarse, el cliente decide: «Comprobar ahora» o un comando nuevo. *Esto concreta el tope de frecuencia del punto 5 (una lectura diaria por servidor); la retención del detalle sigue por definir.*
14. **«Qué falló y cómo corregirlo» también para servidores** (Carlos, 2026-11-12). Es lo que hace útil la lectura: ver «No cumple» sin saber por qué no sirve. La guía de corrección del comité venía en español solo para 218 de ~10.850 checks, así que Monkey la **traduce con IA, etiquetada como tal** («Traducción automática hecha por IA, sin revisar»; `translation_origin = machine`, igual que la nube, D90), por tandas y por política, empezando por las que se ofrecen primero (Ubuntu 22.04, Windows Server). Reglas: (a) **los comandos no se tocan**: todo lo que la traducción deja como código tiene que aparecer igual en el original, y un proceso lo valida antes de cargar; (b) lo que el comité ya trae en español no se pisa, ni lo que una persona ya revisó; (c) las guías de Windows, que comparten formato, se generan con una regla determinista (la ruta de la directiva va exacta) y la de Linux se reutiliza cuando el original es idéntico; (d) la sonda **no califica** sus checks, así que el hallazgo de un servidor **no lleva severidad** (no se inventa una) y el recurso afectado es el propio servidor. *Falta:* que una persona revise las traducciones (pasan a `reviewed`), y traducir el resto de políticas con el mismo proceso.

**Qué NO se decide aquí.** El mapeo de checks a pruebas y la partición de `T-SRV-001` (concentra 10.909 de 11.352 checks, §9): es del comité y va en su propia decisión. Tampoco cuál es el manager de producción (hoy 15.204.248.111, mientras el `.env` de desarrollo apunta a otro servidor), ni la retención del indexador ni el cierre de puertos (1515, 55000, 22 abiertos a internet): son de infraestructura.

**Qué cambia.** `contracts/control-tecnico.md` (sección de la sonda), `datos/modelo/08-control-tecnico.md` (`asset_agents`), `deuda-tecnica/control-tecnico.md` (`DT-32`, `DT-33` y `DT-57` se cierran al construirse), `seguridad/control-tecnico.md` (`SEG-45` pasa a construido), `motores/wazuh-operacion.md` (el manager de hoy no corre en contenedor y trae indexador y panel).

**Fuente:** Carlos Castaño, 2026-11-11 (trabajador, volumen y aislamiento por empresa), con la autorización de Héctor para tocar el Backend. Hechos verificados el 2026-11-11 contra el manager vigente, el esquema público de la sonda (v4.14.1) y el código del Backend.
