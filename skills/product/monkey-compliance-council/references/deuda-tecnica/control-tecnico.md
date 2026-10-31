# Deuda técnica — Control Técnico

Parches del Componente 3 del onboarding (conexión de activos, la sonda) y del paso 3. Contexto: [`README.md`](README.md).

## Componente 3 — Control Técnico (D46)

### DT-1 · La sonda es simulada o no está disponible

🔴 Crítica

- **Qué está parchado:** No existen conectores productivos: `PROBE_MODE=simulated` da por buena una conexión con credenciales completas (y nunca la marca `operational`: queda `warning`); sin él, `validate` responde `503 CONNECTION_UNAVAILABLE`
- **Por qué:** El sprint entrega el flujo y la UI, no la integración (`onboarding-technical-control.md`)
- **Qué lo cierra:** Un adaptador real de `ConnectionProbe` (sin tocar los casos de uso) y retirar las etiquetas de «modo demostración». Mientras tanto el backend **se niega a arrancar** con `simulated` en producción

### DT-2 · «n/18» y `checks_available` son constantes

🟠 Importante

- **Qué está parchado:** (18/18 y 402). Nadie ha definido cuáles son las 18 capacidades técnicas. *2026-10-08: hay un seed de 662 checks de nube (D56), aún no cargado en la base compartida; los de la sonda siguen en 0*
- **Por qué:** El contrato las nombra sin listarlas
- **Qué lo cierra:** Que el comité entregue las 18 y se siembren los checks; la cobertura pasa a calcularse

### DT-3 · `ac_04` a `ac_06` se completaron por analogía

🟠 Importante

- **Qué está parchado:** con sus equivalentes en nube (método, permisos, evidencia generada); la evidencia de `ac_02`/`ac_03` también la redactó desarrollo
- **Por qué:** El brain solo da la ficha completa de `ac_01` a `ac_03`
- **Qué lo cierra:** Revisión del comité; ajustar el seed (`prisma/seed/reference/data.ts`; los datos de Héctor coinciden con los míos, así que el contenido es el mismo y sigue pendiente de revisión)

### DT-4 · Credenciales por conexión definidas por desarrollo

🟠 Importante

- **Qué está parchado:** (`account_id` + `read_only_role`; `db_user` + `db_password`; SSH o agente). No hay instalador del agente: «instalar el agente de Monkey» es una promesa sin entrega, y el cliente no recibe instrucciones
- **Por qué:** El contrato muestra un solo ejemplo (SSH)
- **Qué lo cierra:** Definir con el equipo de la sonda qué pide cada conexión y cómo se entrega el agente (token de enrolamiento, instrucciones, expiración)

### DT-5 · Llave de cifrado en el `.env`

🟠 Importante

- **Qué está parchado:** `CREDENTIALS_ENCRYPTION_KEY` (AES-256-GCM) no tiene rotación ni gestor de secretos; el formato `v1.` deja espacio para versionar la llave, pero no hay procedimiento
- **Por qué:** Alcance del sprint
- **Qué lo cierra:** Gestor de secretos / KMS en producción y un procedimiento de rotación (re-cifrar con `v2`)

### DT-7 · «Híbrido» ofrece las 6 conexiones

🟡 Mejora

- **Qué está parchado:** y el cliente usa las que le sirvan
- **Por qué:** El contrato dice «combinación de los anteriores»
- **Qué lo cierra:** Ratificar con el comité

### DT-8 · El tipo del activo se deduce de la conexión

🟡 Mejora

- **Qué está parchado:** `network_device` y `documentation` no tienen forma de darse de alta (ninguna conexión los produce)
- **Por qué:** Evita preguntar dos veces
- **Qué lo cierra:** Decidir cómo se inventarían esos tipos

### DT-9 · `responsible_id` se acepta en la API pero no hay forma de crear cargos

🟠 Importante

- **Qué está parchado:** (`organization_responsibles`): ni endpoint ni pantalla. La UI lo oculta
- **Por qué:** El Módulo de Usuarios no existe
- **Qué lo cierra:** Módulo de Usuarios / Cumplimiento

### DT-10 · La UI promete «te avisaremos» cuando la evaluación automática esté disponible, y no existe ningún aviso

🟠 Importante

- **Qué está parchado:** (ni correo ni notificación)
- **Por qué:** Mensaje honesto para el modo `unavailable`
- **Qué lo cierra:** Construir las notificaciones **o** reescribir el mensaje. No dejar la promesa sin mecanismo

### DT-11 · Un activo dado de baja no se puede ver ni restaurar

🟡 Mejora

- **Qué está parchado:** *2026-10-09: editar (`PATCH`) y dar de baja (`DELETE`) ya existen para los activos; `GET /v1/assets/{id}` se añadió fuera del contrato.* **La baja no borra** (conserva el historial) y **no hay forma de restaurar** un sistema dado de baja ni de verlos
- **Por qué:** Hasta ahora nadie lo pedía
- **Qué lo cierra:** Pantalla de sistemas dados de baja, cuando el comité diga si se restauran

## Paso 3 del control técnico: el modelo de conexión (D48)

### DT-32 · No hay vínculo activo ↔ agente

🔴 Crítica

- **Qué está parchado:** `assets` no sabe qué agente de la sonda es, así que no hay forma real de «validar» una conexión ni de leer resultados
- **Por qué:** Depende del diseño del canal de agente (D71)
- **Qué lo cierra:** Campo o tabla de enlace y un adaptador real de `ConnectionProbe` que lea la sonda en **solo lectura**

### DT-33 · Aislamiento entre empresas sin imponer

🔴 Crítica

- **Qué está parchado:** Clave de inscripción global y grupo autodeclarado por el agente: sin una regla de Monkey, un agente podría caer en otra empresa
- **Por qué:** Es una propiedad de la sonda, no de Monkey
- **Qué lo cierra:** **Decidido en D54** (un manager, un grupo por cliente, agente pre-registrado por Monkey; flujo verificado contra la API, D55). Falta construir el pre-registro y validar la pertenencia al sincronizar

### DT-34 · Cobertura honesta de plataformas

🟠 Importante

- **Qué está parchado:** Hoy hay pruebas para Ubuntu 22.04, Ubuntu 14.04 y Windows 11; la pantalla ofrece más tipos de sistema
- **Por qué:** La UI nació del contrato, no de la cobertura
- **Qué lo cierra:** Mostrar qué sistemas tienen evaluación real y marcar el resto «próximamente»

### DT-35 · Conexión a la nube diferida

🟠 Importante

- **Qué está parchado:** El modelo de rol entre cuentas / federación de identidad sin contraseñas (como en AWS, GCP, Azure) no está decidido y las integraciones de la sonda son solo de registros. **2026-10-07:** una prueba con el motor de nube (Prowler, D100) y un usuario con llaves estáticas funcionó, pero no es el modelo definitivo (ver DT-43 a DT-45 y P14 C)
- **Por qué:** Decisión de arquitectura
- **Qué lo cierra:** Decidir el modelo de credenciales (P14 C; el rol de cada motor ya lo cerró D100); mientras tanto `ac_01` queda «próximamente»

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

### DT-36 · El `.env` de pruebas usa el superusuario de la base de la sonda y un usuario de API con permisos amplios

🟠 Importante

- **Por qué:** Se puso para investigar
- **Qué lo cierra:** Pedir un usuario de base **solo lectura** y un rol de API de solo lectura por grupo; autorizar la IP de desarrollo en la API si se quiere probar

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

### DT-55 · La plantilla del rol se descarga y se crea a mano

🟡 Mejora

- **Qué está parchado:** El enlace de «un clic» de CloudFormation exige que la plantilla esté en un bucket de S3
- **Por qué:** Hace falta una cuenta y un bucket públicos de solo lectura; no vale la pena para la demo
- **Qué lo cierra:** Publicar la plantilla en S3 y devolver `launch_url` en `connection_setup`

### DT-57 · El canal de agente solo existe como diseño:

🟠 Importante

- **Qué está parchado:** la pantalla no ofrece servidores ni bases de datos con agente, y el backend responde «no disponible» al validarlos. Tampoco se genera el comando de instalación ni se pre-registra el agente (D54)
- **Por qué:** Alcance de la etapa: solo AWS
- **Qué lo cierra:** Adaptador de la sonda de servidores en el backend y el instalador de Monkey (D71). Hasta entonces sus plataformas están `coming_soon` (D67)

### DT-58 · `Frontend-Platform` no tiene pruebas automáticas

🟡 Mejora

- **Qué está parchado:** (0 archivos de prueba) y la verificación de la pantalla de conexión fue una corrida manual con un navegador (2026-10-09)
- **Por qué:** El repo nunca tuvo pruebas
- **Qué lo cierra:** Pruebas de componente del panel de conexión y del formulario, y un recorrido de navegador en el CI (`DT-20`)

### DT-59 · El sistema operativo de un servidor de la nube es una inferencia

🟠 Importante

- **Qué está parchado:** a partir de la imagen (AMI) con la que se lanzó: sin imagen legible o con una imagen propia, queda sin decir; la versión exacta no se conoce. Además, el inventario solo cubre EC2, RDS, S3 y Lambda, y se refresca **solo al volver a comprobar la conexión** (D59)
- **Por qué:** AWS no expone el SO de una máquina sin un agente
- **Qué lo cierra:** El canal de agente (`DT-57`) o inventario de SSM; ampliar servicios (ECS, EKS, DynamoDB…) y refrescar con la programación

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

### DT-63 · Un activo descubierto no se puede editar

🟠 Importante

- **Qué está parchado:** (criticidad, responsable, nombre): `PATCH /v1/assets/{id}` solo atiende conexiones y nace en «Media» sin responsable
- **Por qué:** D61 llegó sin la edición del activo hijo
- **Qué lo cierra:** Endpoint para editar el activo descubierto (criticidad y responsable, sin tocar lo que lee la nube) y su pantalla

### DT-66 · El estado de preparación de un activo se calcula por severidad

🟠 Importante

- **Qué está parchado:** (`readiness.ts`: alta o crítica ⇒ Requiere trabajo), no por el porcentaje de tests con resultado con cortes en 100% y 80% que fijó D62 y que D68 conserva para el activo (el comité no lo define)
- **Por qué:** Se construyó antes de D62
- **Qué lo cierra:** Cablear `GET /v1/assets/{id}/readiness` a `evaluateAssetReadiness` (`features/compliance`, MD-139), que ya calcula el porcentaje con los cortes de D62, y retirar `readiness.ts`

### DT-64 · La preparación por servicio no tiene pantalla

🟡 Mejora

- **Qué está parchado:** El estado de preparación **por servicio** existe en la API (`?service_id=`) pero **no tiene pantalla**. Las etiquetas de S3 y Lambda no se leen (cada una exige una llamada más). Los activos de una región que el cliente quita de la conexión siguen activos aunque la pantalla no los muestre
- **Por qué:** Se priorizó la conexión
- **Qué lo cierra:** Pantalla de preparación por servicio; leer etiquetas de S3/Lambda; dar de baja los activos de regiones retiradas

## Marketplace de plataformas (D67)

### DT-68 · Los logos no vienen del kit de cada marca

🟡 Mejora

- **Qué está parchado:** Los 16 iconos de `Frontend-Platform/public/providers/` (cada uno con su variante `-dark.svg`) salen de colecciones de iconos de marca (Simple Icons, Devicon y Logos), no de los kits de cada proveedor. Varios son una **sustitución**: Microsoft 365 usa el logo de Microsoft, Google Workspace la «G» de Google, HP-UX el logo de HP, macOS el de Apple y Solaris un icono genérico de Unix. Oracle, AIX y SQL Server no se ven tan nítidos como los demás
- **Por qué:** Cada kit es un portal distinto y los kits traen logos de distinta forma y peso; una fuente de iconos cuadrados permitió que todos se vean del mismo tamaño en los dos temas
- **Qué lo cierra:** Resolver el uso de marcas (`P21`), reemplazar cada icono por el del kit oficial de su plataforma (con su versión para tema oscuro) y revisar que sigan viéndose del mismo tamaño

### DT-69 · Las dimensiones de cada control no coinciden con las que define el comité

🟠 Importante

- **Qué está parchado:** D39 derivó las dimensiones de cada control de las pruebas y sembró **210** filas en `control_dimensions` (118 documentales, 43 de servidores, 18 de bases de datos, 31 de nube, ninguna de aplicación). El comité las define en la hoja `Controles Monkey`, columnas L a P (D68): **191** (118, 25, 17 y 31; aplicación «NO APLICA» en los 118 controles). La hoja `Análisis TEST x Control` da otra cifra y las dos hojas no coinciden en 6 celdas (IAC-1, IAC-7, IAC-8, IAC-9, IAC-12 en servidores y MON-3 en bases de datos)
- **Por qué:** Se derivaron de las pruebas antes de que el comité entregara el motor de evaluación (D68). Una dimensión de más o de menos cambia qué controles quedan `INCOMPLETO`
- **Qué lo cierra:** Cargar `control_dimensions` desde `Controles Monkey` L a P, reconciliar las 6 celdas con el comité y actualizar `catalog:verify`

### DT-81 · El escenario de despliegue ya no se pregunta, pero su columna y sus tablas siguen en la base

🟡 Mejora

- **Qué está parchado:** D92 retiró la pregunta «dónde vive tu servicio» y todo el código que la usaba, pero `services.deployment_scenario`, la tabla `catalog.deployment_scenario_capabilities`, su siembra en `reference:load` y el enum `tenant.deployment_scenario` siguen en la base y en el schema de Prisma, sin ningún uso.
- **Por qué:** quitarlos es una migración destructiva (`DROP COLUMN`, `DROP TABLE`, `DROP TYPE`) sobre la base compartida y pierde los valores que algunos servicios ya declararon. Se hace aparte, cuando el comité haya ratificado D92: si lo rechazara, el escenario se restituye sin recargar nada.
- **Qué lo cierra:** una migración que borre la columna, la tabla y el enum; quitar `deployment_scenario_capabilities` de `seed-reference.ts` y de `reference/data.ts`, y borrar `DEPLOYMENT_SCENARIO` de los modelos de Prisma. Al cerrarla, bórrese esta entrada.
