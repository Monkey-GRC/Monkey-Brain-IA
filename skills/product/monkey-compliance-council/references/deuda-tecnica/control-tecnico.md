# Deuda técnica — Control técnico

Parches vigentes de [Control técnico](../arquitectura/control-tecnico/README.md). Tablero y reglas: [`README.md`](README.md).

## Componente 3 — Control Técnico (D46)

### DT-2 · «n/18» y `checks_available` son constantes

🟠 Importante

- **Qué está parchado:** (18/18 y 402). Nadie ha definido cuáles son las 18 capacidades técnicas. *2026-10-08: hay un seed de 662 checks de nube (D56), aún no cargado en la base compartida; los de la sonda siguen en 0*
- **Por qué:** El contrato las nombra sin listarlas
- **Qué lo cierra:** Que el comité entregue las 18 y se siembren los checks; la cobertura pasa a calcularse

## Paso 3 del control técnico: el modelo de conexión (D48)

### DT-43 · El motor de nube se probó en el mismo servidor que la sonda y con llaves estáticas del cliente guardadas allí

🔴 Crítica

- **Qué está parchado:** (perfil local). *2026-10-09: el trabajador ya asume el rol y el motor solo ve credenciales temporales (D57, SEG-46); queda que quien asume sea una identidad de Monkey sin llaves. Antes: un escaneo corrió con credenciales TEMPORALES de un rol de solo lectura (`MonkeyReadOnly`, con ExternalId; sin él AWS rechaza) en un contenedor efímero que se eliminó al terminar: el motor ya no ve llaves de larga vida. Falta que quien asume el rol sea una identidad de Monkey (hoy es un usuario con llaves) y el trabajador aislado por cliente (D57).* Con varios clientes mezclaría credenciales en una máquina compartida
- **Por qué:** Prueba de viabilidad
- **Qué lo cierra:** Ejecución aislada por cliente y por corrida, y rol entre cuentas sin llaves guardadas (P14 C1 y C3). No usar en producción mientras tanto

### DT-44 · `check_results` no guarda recurso ni región

🟠 Importante

- **Qué está parchado:** *2026-10-08: el schema ya lo guarda (D56: `asset_resources`, `region`, `status_detail`, `engine_severity`); la ingesta ya lo escribe (2026-10-09); falta quien ejecute el motor de nube.*  Un resultado de nube es por recurso (ARN) y el mismo check de cuenta se repite por región; hoy no hay dónde ponerlo, ni detalle ni severidad del motor
- **Por qué:** El modelo nació de la sonda de servidores
- **Qué lo cierra:** Columnas nuevas anulables (recurso, nombre, tipo, región, detalle, severidad) en una migración; la unidad de evaluación es P14 B

### DT-45 · El escaneo por todas las regiones infla resultados

🟠 Importante

- **Qué está parchado:** 17 regiones dieron 292 hallazgos y 64 de los 97 fallos estaban fuera de la región en uso
- **Por qué:** Prueba de viabilidad
- **Qué lo cierra:** Escanear solo las regiones declaradas, y decidir cómo cuenta un check de cuenta (P14 B3). Hasta entonces no calcular cobertura en nube sobre estos datos

## Ejecución del motor de nube (D57)

### DT-51 · El trabajador usa un proxy de Docker que filtra por ruta, no por contenido

🟠 Importante

- **Qué está parchado:** Un trabajador comprometido podría pedir un contenedor con montajes del servidor: es acceso amplio a Docker aunque no sea el socket directo
- **Por qué:** Se aceptó para desarrollo: código nuestro, sin puertos de entrada, aislado en su propia red
- **Qué lo cierra:** Ejecutar el motor como tarea en la nube (un adaptador `ScanEngine` nuevo, sin socket), o un Docker sin privilegios dedicado a los escaneos. Depende de `D72` y `P14` C

### DT-52 · El trabajador solo conoce AWS, una corrida a la vez por réplica, y el canal de llaves entrega llaves de larga vida

🟡 Mejora

- **Qué está parchado:** **El trabajador solo conoce AWS, procesa una corrida a la vez por réplica, y el canal de llaves entrega llaves de larga vida al motor**
- **Por qué:** Alcance de esta etapa (D53); Azure y GCP sin cuentas de prueba
- **Qué lo cierra:** Un perfil del motor por proveedor (`EngineProfile`) y la federación sin llaves; el canal de llaves se ofrece con el aviso de menor seguridad

### DT-53 · La imagen del motor pesa 3,3 GB:

🟡 Mejora

- **Qué está parchado:** la primera corrida en un servidor nuevo la descarga y puede tardar minutos (el límite de 25 min corre sobre la ejecución, no sobre la descarga). Un redespliegue a mitad de una corrida la pierde (el backend la cierra por tiempo a los 30 min)
- **Por qué:** Una sola VPS de desarrollo
- **Qué lo cierra:** Descargar la imagen en el despliegue; no redesplegar durante un escaneo, o drenar antes

## Flujo de conexión de la nube (D58)

### DT-59 · El sistema operativo de un servidor de la nube es una inferencia

🟠 Importante

- **Qué está parchado:** a partir de la imagen (AMI) con la que se lanzó: sin imagen legible o con una imagen propia, queda sin decir; la versión exacta no se conoce. Además, el inventario solo cubre EC2, RDS, S3 y Lambda, y se refresca **solo al volver a comprobar la conexión** (D59)
- **Por qué:** AWS no expone el SO de una máquina sin un agente
- **Qué lo cierra:** Un agente en el servidor de la nube (D113 solo lo construyó para servidores on-premise) o inventario de SSM; ampliar servicios (ECS, EKS, DynamoDB…) y refrescar con la programación

### DT-60 · Sin límite de uso ni cola justa en la comprobación y la evaluación

🟠 Importante

- **Qué está parchado:** Un solo carril de validación atiende a todas las empresas en orden: una empresa con muchos activos puede retrasar a las demás, y nada limita cuántas comprobaciones pide (cada una intenta asumir un rol en AWS)
- **Por qué:** Solo existe el límite del login; el índice único evita dos ejecuciones abiertas por activo, no el abuso entre activos
- **Qué lo cierra:** Límite por empresa y por usuario en `validate`/`executions`, cola con turnos por empresa y más de un trabajador

### DT-61 · Las llaves base de AWS (identidad `monkey-audit`) son de larga vida y viven en varios sitios:

🟠 Importante

- **Qué está parchado:** el secreto del trabajador en GitHub, la VPS y el disco de quien prueba en local (`~/.monkey-runner.env`). Además se pegaron en conversaciones
- **Por qué:** Es la identidad que asume el rol de cada cliente y no hay otra aún (`DT-43`)
- **Qué lo cierra:** Una identidad propia de Monkey sin llaves guardadas (rol de la VPS o de la tarea) y **rotar ya** las llaves, los secretos del backend y la contraseña de la VPS que se compartieron

### DT-62 · No se ha verificado que el identificador de un recurso descubierto coincida con el que trae la evaluación

🟡 Mejora

- **Qué está parchado:** Si difiere, un mismo servidor aparecería dos veces en `asset_resources` (uno con detalle y otro sin él); hoy solo se muestran los de clase conocida, pero el resultado de la evaluación apuntaría al segundo
- **Por qué:** El descubrimiento se probó contra AWS real, la evaluación posterior aún no
- **Qué lo cierra:** Correr «Evaluar ahora» sobre la cuenta real y comparar los `resource_uid`

### DT-64 · La preparación por servicio no tiene pantalla

🟡 Mejora

- **Qué está parchado:** El estado de preparación **por servicio** existe en la API (`?service_id=`) pero **no tiene pantalla**. Las etiquetas de S3 y Lambda no se leen (cada una exige una llamada más). Los activos de una región que el cliente quita de la conexión siguen activos aunque la pantalla no los muestre
- **Por qué:** Se priorizó la conexión
- **Qué lo cierra:** Pantalla de preparación por servicio; leer etiquetas de S3/Lambda; dar de baja los activos de regiones retiradas

### DT-106 · El retiro del agente de un servidor dado de baja caduca a los 2 minutos si no hay trabajador

🟡 Mejora

- **Qué está parchado:** Al dar de baja un servidor, Monkey suelta su vínculo al instante y deja en cola retirar su agente de la sonda (D113 punto 8). Esa ejecución comparte el carril corto de `enrollment`: si el trabajador no la reclama en 2 minutos (caído, o sin `SONDA_ENROLL_USER`), se cancela y **el agente queda en la sonda** sin dueño. No hay reintento ni barrido de agentes huérfanos
- **Por qué:** Se reutilizó el carril y el tipo de ejecución existentes en vez de crear un tipo nuevo con su propio plazo
- **Qué lo cierra:** Un barrido periódico del trabajador que compare los agentes de la sonda (nombre = id de activo) con los activos activos de Monkey y retire los que no tengan dueño; o un tipo de ejecución `removal` sin caducidad de cola

### DT-66 · El estado de preparación de un activo se calcula por severidad

🟠 Importante

- **Qué está parchado:** (`readiness.ts`: alta o crítica ⇒ Requiere trabajo), no por el porcentaje de tests con resultado con cortes en 100% y 80% que fijó D62 y que D68 conserva para el activo (el comité no lo define)
- **Por qué:** Se construyó antes de D62
- **Qué lo cierra:** Cablear `GET /v1/assets/{id}/readiness` a `evaluateAssetReadiness` (`features/compliance`, MD-139), que ya calcula el porcentaje con los cortes de D62, y retirar `readiness.ts`

### DT-102 · La conexión de GCP no descubre los recursos del proyecto al validar

🟡 Mejora

- **Qué está parchado:** Al validar un proyecto de GCP no se corre el inventario (D59); el cliente no ve qué recursos tiene hasta la primera evaluación
- **Por qué:** Alcance de MD-214: primero la conexión y la evaluación
- **Qué lo cierra:** Un `InventoryScanner` de GCP (Cloud Asset Inventory o las APIs de cada servicio) en el adaptador de GCP

### DT-103 · No se ha probado que la identidad de AWS de Monkey asuma el rol de una cuenta de AWS de otro dueño

🟡 Mejora

- **Qué está parchado:** Desde el 2026-11-13 `monkey-audit` tiene la política `monkey-assume-customer-roles` (`sts:AssumeRole` sobre `arn:aws:iam::*:role/MonkeyReadOnly`); antes no podía asumir el rol de una cuenta ajena y un cliente real de AWS habría fallado. Todas las pruebas de AWS se hicieron dentro de la cuenta de Monkey
- **Por qué:** No hay una segunda cuenta de AWS de pruebas
- **Qué lo cierra:** Conectar una cuenta de AWS distinta con la plantilla `MonkeyReadOnly` y validar y evaluar de punta a punta


### DT-130 · El certificado de una conexión de Microsoft 365 vence a los 2 años y no hay renovación

🟠 Importante

- **Qué está parchado:** Monkey genera un certificado autofirmado de 2 años por conexión (D154). Se muestra su vencimiento, pero no hay aviso previo ni forma de renovarlo: al vencer, la conexión falla con «la aplicación no acepta el certificado».
- **Por qué:** La primera etapa busca conectar y evaluar; el motor tampoco documenta un procedimiento de renovación.
- **Qué lo cierra:** Un endpoint para generar un certificado nuevo (con el comando para subirlo a la aplicación sin cortar la conexión), un aviso con antelación (correo y pantalla) y una prueba con un tenant real.

### DT-131 · Microsoft 365 se evalúa solo con Microsoft Graph, y lo construido no se ha probado contra un tenant real

🟠 Importante

- **Qué está parchado:** El script de alta y el adaptador piden solo permisos de Graph (D154): no corren los checks de Exchange y Teams (PowerShell), que además exigen el permiso `Exchange.ManageAsApp` y el rol «Global Reader» en la aplicación. Todo se probó con simulaciones (un `az` falso, tokens falsos) y con la imagen real del motor, pero **no contra un tenant de Microsoft 365**: los nombres de permisos, el consentimiento, el formato real de la salida y la cobertura de checks por prueba quedan por verificar. Además, el trabajador usa la imagen 5.44.0 (144 checks) y el catálogo de la VF18 es de la 5.45.0 (149): falta comprobar cuántos ejecuta la imagen (los 149 ya tienen título en español). Para la prueba real existe `Backend/scripts/dev/entra-smoke.ts`. **Visto el 2026-11-25 en la primera prueba real:** Azure Cloud Shell exige una suscripción de Azure, así que una organización que solo tiene Microsoft 365 no puede dar de alta la conexión como está diseñada; falta una vía sin Cloud Shell antes de pasar a `available`. La misma prueba mostró que el consentimiento podía quedar incompleto (el permiso de Exchange recién pedido) aunque el comando dijera «Listo», y que repetirlo duplicaba los permisos pedidos: corregido (ahora comprueba lo aprobado). Lo que se puede evaluar depende además de las licencias del cliente (sin Entra ID Premium ni Defender, parte de los checks no aplica).
- **Por qué:** No había un tenant de pruebas al construirlo.
- **Qué lo cierra:** Una corrida con un tenant de pruebas (alta, validación y evaluación), corregir lo que falle, y decidir si se activan Exchange y Teams (la imagen fijada ya trae PowerShell 7.5 y los módulos). Después, pasar la plataforma a `available`.

### DT-132 · La llave de la aplicación de Monkey para Microsoft 365 es un archivo y sirve para todos los clientes

🔴 Crítico (antes de ofrecer el botón a clientes)

- **Qué está parchado:** la llave privada de la aplicación multi-organización (D157) vive en un archivo montado en el trabajador. Quien la obtenga puede leer todas las organizaciones que la autorizaron. No hay almacén de llaves, rotación ni alertas de uso, y Monkey no está verificado como editor ante Microsoft.
- **Por qué:** se construye primero el recorrido para probarlo en local.
- **Qué lo cierra:** firmar con un almacén de llaves que no la exporte, procedimiento de rotación y revocación, vigilancia de los inicios de sesión de la aplicación, verificación de editor y revisión de seguridad.

### DT-136 · La pantalla no deja registrar el resultado manual ni distingue una prueba con parte manual

🟠 Importante

- **Qué está parchado:** el Backend ya admite el resultado del responsable en una prueba semiautomática (D160 punto 4) y en las manuales (MD-504), pero Platform no tiene dónde registrarlo ni un campo que diga qué pruebas lo admiten: esas pruebas no llegan a «Correcto» desde la pantalla. Además, `control-tests.ts` decide qué prueba es «automática» con una lista fija de dimensiones (sin Endpoint ni Red) en vez de un dato del API.
- **Por qué:** la pantalla de resultado manual es de la interfaz pendiente de MD-504; ante la UI se piden indicaciones a Rod.
- **Qué lo cierra:** un campo en `…tests[]` que diga si la prueba admite resultado manual, la pantalla para registrarlo y quitar la lista fija.

### DT-135 · Las pruebas de Endpoint y de Red no se evalúan con checks, y un recurso que deja de reportarse conserva su último resultado

🟠 Importante

- **Qué está parchado:** (a) El motor sigue con la regla de 5 dimensiones (D5): un activo `endpoint` o `network_device` no entra a ninguna prueba y ninguna evaluación escribe pruebas de esas dimensiones, aunque D129 ya las definió y `TEST_CHECKS` trae Directos para pruebas de Endpoint (3 del motor de nube, de Microsoft 365, y los de la sonda para Windows, macOS y Linux). (b) Un recurso elegido (D160) solo recibe fila cuando algo se midió en él: si un check deja de devolverlo, su último resultado sigue vigente hasta que venza por frescura o por ventana.
- **Por qué:** (a) la población de una prueba de Endpoint decidida por una política de la organización no está definida (`P14` B6) y las plataformas de endpoint aún no se pueden conectar. (b) evita escribir una fila por recurso y prueba en cada evaluación.
- **Qué lo cierra:** (a) la respuesta del comité a `P14` B6 y habilitar las plataformas de endpoint. (b) lo mismo que `DT-134`: que el trabajador informe qué no pudo medir.

### DT-134 · En AWS y GCP un check Directo que no vuelve se toma como «No aplica» aunque haya faltado acceso

🟠 Importante

- **Qué está parchado:** D56 trata como `not_applicable` todo check sin filas. Si faltó por permisos o por un error de recolección, la prueba puede salir cumplida con los demás Directos, contra `MAP CALOR` («Sin datos») y T-04. Microsoft 365 ya no (D159).
- **Por qué:** en AWS y GCP un check sin filas suele ser un recurso que no existe, y la corrida no dice cuál de los dos casos es.
- **Qué lo cierra:** que el trabajador informe qué checks no pudo ejecutar (permisos, servicio sin habilitar, error) para guardarlos como `not_run`.

### DT-133 · Monkey no comprueba si el cliente asignó el rol de Lector global para el correo

🟠 Importante

- **Qué está parchado:** el acceso al correo se sabe **después de evaluar**: el historial deriva `mail_reviewed` de lo que de verdad se midió y la conexión deja de pedir «Lector global» cuando fue `true`. Antes de la primera evaluación (el resultado del asistente) la guía se muestra sin saber si ya está puesto, y con `false` no se distingue un rol sin asignar (o aún sin aplicar) de un permiso que no quedó autorizado.
- **Por qué:** autorizar no concede el rol, y comprobarlo al validar exige que el trabajador consulte el servicio de correo.
- **Qué lo cierra:** que la validación haga una lectura real del correo y la conexión diga «correo: sin acceso» desde el principio, con el motivo.

## Transversal

### DT-126 · La última recolección completada de un activo se busca sin índice por `finished_at`

🟡 Mejora

- **Qué está parchado:** Los avisos de MD-508 (D153) buscan la recolección completada anterior de un activo (`direct-check-failures.loader.ts`) y, en la pasada diaria, la última de cada activo con un LATERAL (`automatic-readings.loader.ts`), ordenando `executions` por `finished_at DESC`. El único índice útil es `(asset_id, started_at)`, así que Postgres ordena todo el historial del activo
- **Por qué:** Es una hipótesis de `nestjs-reviewer` sin medir; la meta es medir antes de optimizar
- **Qué lo cierra:** `EXPLAIN (ANALYZE)` con historial realista y, si se confirma, una migración aditiva `CREATE INDEX … ON tenant.executions (asset_id, finished_at DESC) WHERE status = 'completed'`

### DT-48 · `check_results` no tiene política de retención ni de partición

🟠 Importante

- **Qué está parchado:** Es la tabla de mayor volumen (11.352 checks posibles × activos × corrida cada 6 h) y D41 fija 7 años solo para la auditoría. Sin decidir qué se conserva (¿toda corrida, o solo cambios de estado?), RLS y los índices se degradan y el almacenamiento crece sin tope
- **Por qué:** Se omitió al diseñar §8
- **Qué lo cierra:** Decidir retención (propuesta: cada corrida un periodo corto y, para el histórico largo, solo transiciones de estado + la última foto) y particionar por mes. Registrarlo como decisión `D-n`

### DT-49 · El módulo de operación continua no tiene contrato

🟠 Importante

- **Qué está parchado:** *2026-10-08: propuesta escrita en `contracts/control-tecnico.md` (la conexión quedó en `contracts/onboarding/conexion-activos/README.md`); falta acordarla con frontend.*  `contracts/` solo cubre el onboarding C3. No hay forma acordada de listar ejecuciones, resultados, reglas de programación ni el Centro de Control Técnico (§8)
- **Por qué:** Se construyó primero el alta de activos
- **Qué lo cierra:** Acordar `contracts/control-tecnico.md` con frontend **antes** de construir endpoints

### DT-50 · El intérprete `check_results → evaluations` solo cubre el motor de nube

🟠 Importante

- **Qué está parchado:** *2026-10-09: construido el intérprete puro, el calculador de preparación por activo y la persistencia de una corrida (`executions`, `check_results`, `asset_resources`, en una transacción con su rastro; 8 pruebas contra Postgres). *2026-10-14 (MD-117): los activos aplicables de un test ya se determinan por la dimensión del activo (servidor, base de datos, nube, aplicación; `modelo-datos.md` §2).* *2026-10-22: **el motor de nube ya escribe `evaluations`** al cerrar una corrida (misma transacción que `check_results`): una fila por control del servicio, test de nube y activo, con `origin: automated` y el porcentaje de lo decidido que pasó. «Todo o nada»: un fallo ⇒ `non_compliant`; lo no decidido (`not_run`, `invalid`) ⇒ `pending`; sin filas en ningún check del test ⇒ `not_applicable`. Solo cuentan los checks ratificados por el comité (`READINESS_INCLUDE_PROPOSED=true` cuenta también los propuestos, solo desarrollo y demostración). **Sigue sin hacerse:** `invalid` se guarda como `pending` (`evaluation_result` no tiene `error`); los activos descubiertos dentro de la cuenta (servidores, bases de datos) no reciben evaluación propia, solo la cuenta; las filas de `findings` (necesitan los siete campos, `P14` E2); y la sonda de servidores, que no escribe aún.* Los umbrales del activo son los de D62 (DT-66).*  R-04 dice que «Monkey interpreta el criterio», pero no está escrito dónde vive el criterio (`tests.compliance_criterion` es texto libre), cómo se determinan los activos aplicables de un control (R-02), qué pasa con un resultado sin check conocido (hoy se descartaría en silencio) ni cómo se registran las exclusiones
- **Por qué:** §9 especifica el cálculo, no la interpretación
- **Qué lo cierra:** §9 ya fija cómo se lee la sonda (`passed` → cumple, `failed` → no cumple, `invalid` → error, `not_run` → pendiente) y el estado del test (D68). La sonda de servidores ya escribe `evaluations` (D113, 2026-11-12). Falta fijar con el comité el `error` de un test automatizado (hoy `pending`)

### DT-78 · La guía de corrección de una prueba técnica es una traducción automática sin revisar, y el filtro del proveedor es una red de seguridad

🟠 Importante

- **Qué está parchado:** `catalog.checks.remediation_es` y `title_es` los escribió la IA a partir del texto original del motor (D90); nadie los ha revisado. La respuesta los marca `is_ai_generated` y la pantalla los etiqueta como traducción automática. Que ningún texto nombre al proveedor lo garantiza una expresión regular que **omite** el texto si lo encuentra (no lo reescribe) y la revisión al escribir las traducciones; no es una revisión humana. El mensaje por recurso del motor (`status_detail`) no se muestra (crudo, en inglés).
- **Por qué:** sin esto una prueba que falla no decía cómo arreglarla (B33/B34). Hacerlo bien exige la plantilla de siete campos (`P14` E2) y que el comité redacte cada hallazgo.
- **Qué lo cierra:** revisión humana de las 662 guías (`translation_origin = reviewed`), la plantilla de siete campos y, si el comité la quiere, la redacción propia de Monkey por hallazgo. Desde MD-211 los 662 checks tienen traducción automática (antes 558; `cloud:load` la carga y `cloud:verify` falla si falta alguna).
