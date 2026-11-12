# Deuda técnica — Control técnico

Parches vigentes de [Control técnico](../arquitectura/control-tecnico/README.md). Tablero y reglas: [`README.md`](README.md).

## Componente 3 — Control Técnico (D46)

### DT-1 · La sonda es simulada o no está disponible

🔴 Crítica

- **Qué está parchado:** No existen conectores productivos: `PROBE_MODE=simulated` da por buena una conexión con credenciales completas (y nunca la marca `operational`: queda `warning`); sin él, `validate` responde `503 CONNECTION_UNAVAILABLE`
- **Por qué:** El sprint entrega el flujo y la UI, no la integración (`contracts/onboarding/conexion-activos/README.md`)
- **Qué lo cierra:** Un adaptador real de `ConnectionProbe` (sin tocar los casos de uso) y retirar las etiquetas de «modo demostración». Mientras tanto el backend **se niega a arrancar** con `simulated` en producción

### DT-2 · «n/18» y `checks_available` son constantes

🟠 Importante

- **Qué está parchado:** (18/18 y 402). Nadie ha definido cuáles son las 18 capacidades técnicas. *2026-10-08: hay un seed de 662 checks de nube (D56), aún no cargado en la base compartida; los de la sonda siguen en 0*
- **Por qué:** El contrato las nombra sin listarlas
- **Qué lo cierra:** Que el comité entregue las 18 y se siembren los checks; la cobertura pasa a calcularse

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

### DT-57 · El canal de agente solo existe como diseño:

🟠 Importante

- **Qué está parchado:** la pantalla no ofrece servidores ni bases de datos con agente, y el backend responde «no disponible» al validarlos. Tampoco se genera el comando de instalación ni se pre-registra el agente (D54)
- **Por qué:** Alcance de la etapa: solo AWS
- **Qué lo cierra:** Adaptador de la sonda de servidores en el backend y el instalador de Monkey (D71). Hasta entonces sus plataformas están `coming_soon` (D67)

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

### DT-64 · La preparación por servicio no tiene pantalla

🟡 Mejora

- **Qué está parchado:** El estado de preparación **por servicio** existe en la API (`?service_id=`) pero **no tiene pantalla**. Las etiquetas de S3 y Lambda no se leen (cada una exige una llamada más). Los activos de una región que el cliente quita de la conexión siguen activos aunque la pantalla no los muestre
- **Por qué:** Se priorizó la conexión
- **Qué lo cierra:** Pantalla de preparación por servicio; leer etiquetas de S3/Lambda; dar de baja los activos de regiones retiradas

### DT-66 · El estado de preparación de un activo se calcula por severidad

🟠 Importante

- **Qué está parchado:** (`readiness.ts`: alta o crítica ⇒ Requiere trabajo), no por el porcentaje de tests con resultado con cortes en 100% y 80% que fijó D62 y que D68 conserva para el activo (el comité no lo define)
- **Por qué:** Se construyó antes de D62
- **Qué lo cierra:** Cablear `GET /v1/assets/{id}/readiness` a `evaluateAssetReadiness` (`features/compliance`, MD-139), que ya calcula el porcentaje con los cortes de D62, y retirar `readiness.ts`

## Transversal

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
- **Qué lo cierra:** §9 ya fija cómo se lee la sonda (`passed` → cumple, `failed` → no cumple, `invalid` → error, `not_run` → pendiente) y el estado del test (D68). Falta que la sonda de servidores escriba `evaluations`, las filas de `findings` y los activos descubiertos, y fijar con el comité el `error` de un test automatizado (hoy `pending`)

### DT-78 · La guía de corrección de una prueba técnica es una traducción automática sin revisar, y el filtro del proveedor es una red de seguridad

🟠 Importante

- **Qué está parchado:** `catalog.checks.remediation_es` y `title_es` los escribió la IA a partir del texto original del motor (D90); nadie los ha revisado. La respuesta los marca `is_ai_generated` y la pantalla los etiqueta como traducción automática. Que ningún texto nombre al proveedor lo garantiza una expresión regular que **omite** el texto si lo encuentra (no lo reescribe) y la revisión al escribir las traducciones; no es una revisión humana. El mensaje por recurso del motor (`status_detail`) no se muestra (crudo, en inglés).
- **Por qué:** sin esto una prueba que falla no decía cómo arreglarla (B33/B34). Hacerlo bien exige la plantilla de siete campos (`P14` E2) y que el comité redacte cada hallazgo.
- **Qué lo cierra:** revisión humana de las 662 guías (`translation_origin = reviewed`), la plantilla de siete campos y, si el comité la quiere, la redacción propia de Monkey por hallazgo. Desde MD-211 los 662 checks tienen traducción automática (antes 558; `cloud:load` la carga y `cloud:verify` falla si falta alguna).
