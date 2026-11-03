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
