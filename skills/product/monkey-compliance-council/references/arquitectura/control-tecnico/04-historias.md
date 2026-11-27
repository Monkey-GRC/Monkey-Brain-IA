# Control técnico · historias de usuario

Responde: **¿qué necesita el cliente para que Monkey mida sus activos conectados día tras día, entienda qué falló y por
qué, y confíe en que la medición no toca sus sistemas ni mezcla sus datos con los de otra empresa; y cómo se comprueba
que lo tiene?** Cada historia dice quién, qué y para qué; sus criterios de aceptación son verificables y citan la regla
que los fija. El detalle técnico (cuerpos, errores) está en el
[contrato](../../../../../../contracts/control-tecnico.md); la secuencia, en [`03-flujos.md`](03-flujos.md); los pasos
de cada caso, en [`05-casos-de-uso.md`](05-casos-de-uso.md). Conectar un activo por primera vez no es de este módulo:
es el componente [Conexión de activos](../onboarding/conexion-activos/README.md) del onboarding.

**Roles** (D96): `admin_empresa` opera la medición (evaluar, programar, instalar la sonda); `auditor` y `admin_empresa`
piden la vista técnica (D81); `responsable` y `delegado` solo ven lo que falló en los controles que tienen a su cargo
(D102, SEG-66). El trabajador, la tarea programada, la sonda y el motor de nube son piezas del sistema: aparecen como
actores en los [casos de uso](05-casos-de-uso.md), no como historias. Ante el cliente, los motores son siempre «sonda»,
«motor de nube» o «evaluación automática» (D70, D100). **Estado** de cada historia: ✅ construida · 🟡 parcial · ⚪ por
construir.

## Resumen

| ID | Historia | Rol | Estado | Reglas |
|---|---|---|---|---|
| HU-CT-01 | Evaluar ahora una cuenta de nube | `admin_empresa` | ✅ | D57, D58, `EXECUTION_IN_PROGRESS`, `ASSET_NOT_VALIDATED` |
| HU-CT-02 | Seguir una evaluación y consultar el historial | `admin_empresa` | 🟡 | D57, D58 |
| HU-CT-03 | Distinguir «falló la conexión» de «el control falla» | `admin_empresa` | ✅ | D57, §8 |
| HU-CT-04 | Que la nube se evalúe sola con la frecuencia elegida | `admin_empresa` | ✅ | D57, D158 |
| HU-CT-05 | Ver la preparación de un activo | `admin_empresa` | 🟡 | D61, D62, D68, D80, DT-64, DT-66 |
| HU-CT-06 | Ver qué falló y cómo corregirlo en una prueba automática | `admin_empresa` · `auditor` · `responsable` · `delegado` | ✅ | D90, D113 punto 14, D70, SEG-66, DT-78 |
| HU-CT-07 | Leer cada hallazgo en la plantilla de siete campos | `admin_empresa` | ⚪ | P14 E2 |
| HU-CT-08 | Consultar la vista técnica por comprobación y recurso | `admin_empresa` · `auditor` | ⚪ | D81, D56, P14 E2 |
| HU-CT-09 | Instalar la sonda en un servidor con un comando de un solo uso | `admin_empresa` | 🟡 | D113 punto 4, D54, `AGENT_INSTALL_NOT_READY` |
| HU-CT-10 | Generar de nuevo el comando si se perdió | `admin_empresa` | ✅ | D113 punto 4 |
| HU-CT-11 | Que el servidor pase solo a «Conectado» y se relea | `admin_empresa` | ✅ | D113 punto 13 |
| HU-CT-12 | Comprobar ahora un servidor | `admin_empresa` | ✅ | D113 punto 13, `ASSET_NOT_VALIDATED` |
| HU-CT-13 | Que los resultados de un servidor solo lleguen a su empresa | `admin_empresa` | ✅ | D113 punto 3, D54, SEG-45 |
| HU-CT-14 | Que la medición mueva el estado de mis controles | `admin_empresa` | 🟡 | D56, D68, D113 punto 2, DT-50, D129 |
| HU-CT-15 | Que Monkey lea mi nube sin escribir en ella ni guardar secretos de más | `admin_empresa` | 🟡 | D57, D58, D112, SEG-26, SEG-46, SEG-47, SEG-48, SEG-78 |
| HU-CT-16 | No ver nunca el nombre del proveedor de un motor | Persona de la empresa | 🟡 | D70, D100, SEG-39 |
| HU-CT-17 | Que solo se ofrezca medir lo que tiene prueba | `admin_empresa` | ✅ | D71 punto 3, D113 punto 7 |
| HU-CT-18 | Que al dar de baja un servidor su agente se retire de la sonda | `admin_empresa` | 🟡 | D113 punto 8, DT-106 |
| HU-CT-19 | Conservar el historial de mediciones el periodo auditado | `auditor` | ⚪ | D53 punto 5, D113 punto 5, DT-48 |

---

### HU-CT-01 · Evaluar ahora una cuenta de nube

**Como** `admin_empresa`, **quiero** lanzar una evaluación de una cuenta de nube conectada cuando lo necesite **para**
ver su estado de hoy sin esperar a la siguiente medición.

- Dado un activo con la conexión `validated` o `active`, cuando elijo «Evaluar ahora», entonces la evaluación queda en
  cola y la respuesta llega de inmediato (`202`, `status: queued`, `origin: manual`); nunca espera al motor (D57).
- Sin conexión validada → `ASSET_NOT_VALIDATED`.
- Si el activo ya tiene una evaluación en cola o en curso → `EXECUTION_IN_PROGRESS`; lo impone un índice único parcial
  en la base, no una comprobación previa (D57 punto 5).
- La corrida la hace el trabajador aislado, no el backend: reclama la ejecución, obtiene credenciales temporales y lanza
  el motor en un contenedor efímero (D57, SEG-46).
- Lanzarla deja `execution.queue` en la auditoría, en la misma transacción que el efecto (D52, D57 punto 5).
- Solo `admin_empresa` puede lanzarla (D96).

### HU-CT-02 · Seguir una evaluación y consultar el historial

> 🟡 **Parcial:** el historial existe en la API (paginado, con el motivo traducido si falló), pero la pantalla solo
> muestra la última evaluación, y la API no entrega el `progress` ni la `narration` que pide el contrato: la pantalla
> estima el avance por el tiempo transcurrido y lo dice.

**Como** `admin_empresa`, **quiero** ver cómo va una evaluación y las anteriores **para** saber que avanza y cuándo se
midió por última vez.

- El historial lista las evaluaciones del activo, de la más reciente a la más antigua, con `status` (`queued`,
  `running`, `completed`, `failed`), `origin` (`scheduled`, `manual`), inicio y fin.
- No incluye las validaciones de conexión ni las creaciones de agente (D58).
- ⚪ Mientras corre, trae `progress` (0–100, nunca como métrica de cumplimiento) y `narration` (qué está haciendo, sin
  un spinner mudo); hoy no los trae.
- Una evaluación que queda `running` más de 30 minutos pasa sola a `failed` con `execution.timed_out` (D57).

### HU-CT-03 · Distinguir «falló la conexión» de «el control falla»

**Como** `admin_empresa`, **quiero** que una evaluación que no pudo conectar se vea como un problema de conexión **para**
no confundirlo con un incumplimiento.

- Una ejecución fallida queda `failed` con `failure_reason` (clave i18n) y su texto traducido en `failure_message`;
  **no mueve** el estado de preparación ni el cumplimiento (§8, D57).
- Las razones son las del contrato (`connection.role_not_found`, `connection.account_mismatch`,
  `connection.credentials_invalid`, `connection.regions_missing`, `connection.federation_rejected`,
  `execution.engine_failed`, `execution.engine_timeout`, `execution.output_invalid`, `execution.timed_out`, …), con
  texto en `es` y `en` (D57).
- El cliente nunca ve el mensaje del motor; ninguna razón nombra a un proveedor (D57, D70).

### HU-CT-04 · Que la nube se evalúe sola con la frecuencia elegida

> ✅ *(D158)* La frecuencia se elige al activar la conexión y la tarea de evaluación programada crea las ejecuciones.

**Como** `admin_empresa`, **quiero** que mi cuenta de nube se evalúe sola con la frecuencia que elegí **para** que su
estado no envejezca sin que yo lo pida.

- ✅ Al vencer la frecuencia del activo, se crea una evaluación con `origin: scheduled` que corre el mismo trabajador
  que «Evaluar ahora» (D57).
- La frecuencia vencida avisa sin mover el porcentaje: vencido ≠ incumplido (`02-modelo.md`).

### HU-CT-05 · Ver la preparación de un activo

> 🟡 **Parcial:** la API existe, pero el estado se calcula por severidad y no por el porcentaje con cortes de 100 % y
> 80 % (DT-66), y la preparación por activo o por servicio no tiene pantalla (DT-64; la plataforma no llama a
> `GET …/readiness`).

**Como** `admin_empresa`, **quiero** ver en lenguaje de negocio qué tan preparado está un activo **para** saber dónde
trabajar primero.

- Por defecto veo un estado cualitativo (`ready`, `almost_ready`, `needs_work`, `not_measured`) y, aparte, la
  cobertura (`measured` de `expected`) y de lo medido cuánto cumple; nunca un porcentaje consolidado de la empresa
  (D80).
- Antes de la primera evaluación el estado es `not_measured` con todo en cero, no un `404`; `not_measured` es un hueco
  de cobertura, no un fallo, y no cuenta como cumplido (D68).
- No se declara `ready` si hay algo `not_compliant` aplicable («todo o nada», D68).
- ⚪ `ready` es 100 %, `almost_ready` de 80 % a menos de 100 % y `needs_work` menos de 80 % (D62, que D68 conserva
  para el activo); hoy decide la severidad (DT-66).
- El detalle se agrupa por área (`identity_access`, `data_network`, `logging_backup`) con sus hallazgos abiertos y lo
  sin medir; `needs_manual_review` cuenta lo que la sonda no puede decidir (`MANUAL` → `not_run`).
- Con `service_id` mide solo lo de ese servicio más lo que es de toda la cuenta (D61); un servicio ajeno → `404`.
- Si parte de lo medido se apoya en vínculos que el comité aún no ratificó, `includes_proposed_mappings` es `true` y la
  pantalla lo dice (D56).

### HU-CT-06 · Ver qué falló y cómo corregirlo en una prueba automática

**Como** persona que revisa un control, **quiero** ver qué comprobaciones fallaron, en qué recursos y cómo corregirlas
**para** arreglarlo sin adivinar.

- Sale de la última evaluación completada de las conexiones del servicio, solo de lo `failed`, con los checks que
  alimentan la prueba según la misma regla que las evaluaciones (ratificados por el comité; los propuestos solo en
  desarrollo) (D90, D56).
- Sirve para pruebas de nube y de servidores (D113 punto 14); un hallazgo de servidor no lleva severidad (la sonda no
  la da y no se inventa) y su recurso es el propio servidor.
- La guía de corrección es la del catálogo traducida con IA: `is_ai_generated: true` y la pantalla lo etiqueta como
  traducción automática sin revisar (D90, DT-78). Los comandos de la guía no se traducen (D113 punto 14).
- No sale el código del check, ni el tipo de recurso del motor, ni el mensaje crudo por recurso; un texto que nombre al
  proveedor se omite (D70, D90 punto 4).
- `admin_empresa` y `auditor` lo ven en toda la empresa; un `responsable` o `delegado` solo en los controles que tiene
  a su cargo, y en otro recibe `403` (D102, SEG-66). Un control o prueba de otra empresa → `404`.
- No es la plantilla de siete campos (HU-CT-07): no dice por qué importa, quién, cuánto tarda ni el impacto (D90
  punto 5).

### HU-CT-07 · Leer cada hallazgo en la plantilla de siete campos

> ⚪ **Depende de `P14` E2, abierta** (qué texto redacta cada hallazgo y quién lo revisa). `GET …/findings` no está
> construido.

**Como** `admin_empresa`, **quiero** cada hallazgo con qué pasó, por qué importa, cómo corregirlo, quién, cuánto tarda,
qué evidencia se necesita y su impacto **para** priorizar y repartir el trabajo.

- Se filtra por área, severidad y estado; cada ítem trae su recurso y los siete textos resueltos con
  `Accept-Language`.
- Si un texto lo redacta la IA, `is_ai_generated` es `true` con su `ai_confidence`, siempre.
- Un hallazgo sin redacción propia trae los campos `null` y una corrección neutra: nunca el texto crudo del motor.
- Solo cuentan los checks vinculados en `TEST_CHECKS` de la VF18, con su rol (D129); los demás no generan hallazgos.

### HU-CT-08 · Consultar la vista técnica por comprobación y recurso

> ⚪ **Por construir** (`GET /v1/assets/{id}/results?view=technical`); el contrato la liga a la redacción de `P14` E2.

**Como** `auditor` o `admin_empresa`, **quiero** ver el resultado de cada comprobación por recurso con su prueba y sus
requisitos **para** revisar la medición con detalle técnico.

- Cada ítem trae el resultado (`passed`, `failed`, `invalid`, `not_applicable`, `not_run`), el recurso y el objeto
  `technical` con la prueba, los requisitos y `mapping_provenance` (D56, D81).
- Una asignación propuesta nunca se presenta como validada por el comité (D56).
- `responsable`, `delegado` y `admin_monkey` → `403` (D81, D96, SEG-54).

### HU-CT-09 · Instalar la sonda en un servidor con un comando de un solo uso

> 🟡 **Parcial:** construido en Backend, trabajador y pantalla; Linux probado de punta a punta, Windows con la sintaxis
> validada pero **sin probar en un Windows real**, y `macos`, `solaris` y `hp_ux` aún sin instalador (`409`). El nombre del servicio que el cliente verá instalado en su
> servidor y los servidores sin salida a internet siguen sin decidir (contrato, «Preguntas abiertas de esta sección»).

**Como** `admin_empresa`, **quiero** recibir un comando para instalar la sonda en mi servidor **para** conectarlo sin
compartir credenciales.

- El sistema y el comando salen de la versión que declaré al crear el activo (`os_version`); no se me pregunta otra
  vez (D113 punto 4).
- «Empezar» deja en cola la creación del agente (`202`); repetirlo es inofensivo. Monkey pre-registra el agente en el
  grupo de mi empresa con su nombre igual al id del activo (D54, D113 punto 3).
- Antes de instalar veo qué destino y puerto debe permitir mi firewall **de salida**, con un dominio neutro de Monkey
  (D113, regla 1).
- «Mostrar el comando» lo entrega **una sola vez**: tres peticiones a la vez, una lo obtiene y las otras reciben
  `AGENT_INSTALL_NOT_READY`; ya mostrado o caducado (15 min por defecto) también es `AGENT_INSTALL_NOT_READY` (D113
  punto 4).
- Linux recibe un comando; Windows, un comando de PowerShell y un archivo descargable.
- La clave va cifrada y solo unos minutos; nunca llega a la bitácora ni a la auditoría, que sí guarda quién, cuándo y
  sobre qué servidor (`agent.install.prepare`, `agent.enroll`, `agent.install.reveal`) (D113 punto 4).
- Un activo que no usa agente → `ASSET_NOT_AGENT`; ya se está creando → `EXECUTION_IN_PROGRESS`; la instalación de
  Monkey no está configurada → `AGENT_INSTALL_UNAVAILABLE`, sin dejar nada en cola.
- El instalador comprueba la clave contra el nombre de este servidor y exige administrador antes de instalar nada.

### HU-CT-10 · Generar de nuevo el comando si se perdió

**Como** `admin_empresa`, **quiero** generar un comando nuevo **para** instalar la sonda si no alcancé a copiarlo o se
perdió.

- «Generar de nuevo» retira el agente anterior y crea otro; el comando viejo deja de servir (D113 punto 4).
- Una clave sin leer que caduca pasa a `delivered` y se genera una nueva.
- Deja `agent.install.regenerate` en la auditoría, sin la clave.

### HU-CT-11 · Que el servidor pase solo a «Conectado» y se relea

**Como** `admin_empresa`, **quiero** que la pantalla pase sola de «Esperando» a «Conectado» al instalar la sonda y que
el servidor se vuelva a leer **para** no tener que pedirlo y que su cumplimiento no envejezca.

- Una tarea programada deja en cola las lecturas que tocan; nunca lee la sonda ni espera al trabajador (D113 punto 13).
- Sin conectar: cada 3 minutos hasta 24 horas desde que se creó el agente; conectado: cuando su última lectura tiene
  más de 24 horas; desconectado o tras una lectura fallida: cada hora (D113 punto 13, configurable por entorno).
- Una lectura automática «todavía no lista» (`connection.agent_no_scan_yet`, `connection.agent_disconnected`) queda
  `cancelled`, sin auditoría y fuera del historial; la primera lectura buena borra esas esperas.
- Si un servidor conectado deja de estarlo pasa a `disconnected` y eso sí se audita (`agent.disconnected`).
- Pasadas las 24 horas sin conectarse, la pantalla me dice qué revisar (que el comando corrió sin errores y que el
  servidor puede salir al destino indicado) y me ofrece «Comprobar ahora» o un comando nuevo.
- Veo la última revisión del servidor (`last_sync_at`).

### HU-CT-12 · Comprobar ahora un servidor

**Como** `admin_empresa`, **quiero** pedir una lectura de mi servidor en el momento **para** confirmar que ya está
conectado sin esperar a la siguiente lectura automática.

- Es un atajo de lo que Monkey hace solo, nunca un paso obligatorio (D113 punto 13).
- Se acepta en cuanto el agente existe en la sonda; antes → `ASSET_NOT_VALIDATED`; con otra lectura abierta →
  `EXECUTION_IN_PROGRESS`.
- Una lectura pedida por una persona que falla se cierra `failed` con su motivo a la vista (no `cancelled`); si el
  agente desapareció, `connection.agent_not_found`.

### HU-CT-13 · Que los resultados de un servidor solo lleguen a su empresa

**Como** `admin_empresa`, **quiero** tener la garantía de que lo que reporta un servidor solo se guarda en mi empresa
**para** que ningún agente ajeno contamine mi cumplimiento ni el mío llegue a otra.

- El vínculo agente ↔ activo vive en Monkey (`asset_agents`, con RLS) y manda sobre lo que el agente declare (D113
  punto 3).
- El grupo del agente debe contener el `tenant_id` de la empresa y ningún otro grupo con forma de empresa; el nombre
  del agente debe ser el id del activo. Si no → `AGENT_GROUP_MISMATCH`; agente no enlazado a ese activo →
  `AGENT_NOT_LINKED` (SEG-45).
- En los dos casos no se guarda nada y la ejecución se cierra `failed` (`connection.agent_group_mismatch` o
  `execution.output_invalid`), con rastro en la auditoría (SEG-45).
- La comprobación se hace en el trabajador y otra vez en el backend (D113 punto 3).
- Un trabajador que entrega con un `tenant_id` falso recibe `EXECUTION_NOT_RUNNING`: no puede escribir en otra empresa.

### HU-CT-14 · Que la medición mueva el estado de mis controles

> 🟡 **Parcial:** la nube y la sonda ya escriben `evaluations` al cerrar una corrida, pero en producción solo cuentan
> los vínculos ratificados por el comité, y las asignaciones de nube y de servidores siguen propuestas hasta cargar la VF18, que las trae ratificadas (D129, D113
> punto 12); `invalid` se guarda como `pending` (DT-50).

**Como** `admin_empresa`, **quiero** que el resultado de cada medición actualice el estado de mis controles **para** que
el cumplimiento refleje lo que de verdad se midió.

- Al cerrar una corrida, en la misma transacción se guardan los resultados crudos y una evaluación por control, prueba
  automática y activo de cada servicio que tiene el activo; el cambio de estado queda sin usuario (lo causó el sistema)
  (D56, D113 punto 2, `03-flujos.md`).
- «Todo o nada»: un fallo aplicable ⇒ `non_compliant`; lo no decidido ⇒ `pending`; una prueba sin filas en ningún check
  ⇒ `not_applicable` (D68, DT-50).
- Solo cuentan los checks ratificados por el comité; una prueba sin ningún check ratificado no escribe nada y queda
  pendiente (D56).
- Un check que el motor no devuelve es `not_applicable`, no «no ejecutado» (D56 punto 2). **Salvo en Microsoft 365** (D159): sus checks revisan la organización, así que un Directo que no vuelve es `not_run` y la prueba queda pendiente.
- ⚪ Los checks sin prueba y las pruebas sin checks no cuentan: solo cuentan los vínculos de `TEST_CHECKS` de la VF18 (D129); cómo cuenta un
  check que falla en varios recursos y si un servidor de la nube es también un activo servidor siguen abiertos
  (`P14` B2, B4).
- ⚪ Un resultado que la sonda no pudo decidir se distingue de «no medido» (DT-50).

### HU-CT-15 · Que Monkey lea mi nube sin escribir en ella ni guardar secretos de más

> 🟡 **Parcial:** la identidad con la que Monkey asume el rol del cliente todavía usa llaves de larga vida (SEG-26 🔴,
> DT-43, DT-61); el canal de llaves pasa llaves de larga vida al motor (SEG-46, excepción); no se ha probado con una
> cuenta de AWS de otro dueño (DT-103).

**Como** `admin_empresa`, **quiero** que Monkey lea mi nube solo con permisos de lectura y credenciales temporales
**para** no exponer mi cuenta.

- Monkey nunca escribe en los sistemas del cliente: entra con un rol de solo lectura (D57, D58).
- El motor solo recibe credenciales temporales de 1 hora y su contenedor se elimina siempre, en éxito, fallo o tiempo
  agotado (SEG-46).
- El motor corre sin capacidades, sin escalada de privilegios, sin montajes del servidor y sin la red del backend
  (SEG-48).
- Solo se evalúan las regiones que declaré (D53 punto 3); un proyecto de GCP se evalúa completo (D112).
- Otro cliente no puede hacer que Monkey lea mi cuenta declarándola como suya: `ExternalId` por activo en AWS y sesión
  exacta en GCP (D58, D112, SEG-78).
- La API interna del trabajador solo acepta su token, no está bajo `/v1` y nunca devuelve ni registra secretos
  (SEG-47).

### HU-CT-16 · No ver nunca el nombre del proveedor de un motor

> 🟡 **Parcial:** lo garantizan la revisión, las pruebas de las razones de fallo y una expresión regular que omite el
> texto; no hay una prueba automática general (SEG-39 🟠, DT-78).

**Como** persona de la empresa, **quiero** ver la medición en lenguaje de Monkey **para** entender el resultado sin
depender de herramientas de terceros.

- Ninguna pantalla, correo, notificación, reporte ni texto de IA nombra al proveedor de la sonda ni al del motor de
  nube: se dice «sonda», «motor de nube» o «evaluación automática» (D70, D100, SEG-39).
- De una prueba veo su resultado y un nombre neutro (`display_name`); los textos del comité y del motor son internos
  (D70).
- El destino de salida que veo al instalar la sonda es un dominio neutro de Monkey (D113).

### HU-CT-17 · Que solo se ofrezca medir lo que tiene prueba

**Como** `admin_empresa`, **quiero** que Monkey solo me ofrezca medir lo que de verdad sabe evaluar **para** no creer
cubierto algo que no lo está.

- Un sistema, motor de base de datos o plataforma sin prueba no se ofrece como conectable: se muestra bloqueado (D71
  punto 3, D67).
- Lo que el catálogo no conoce (una política o un check) no se guarda: queda como aviso en la bitácora y como
  cobertura no alcanzada (D56, D113 punto 7).
- La sonda solo lee versiones que sabe leer; con otra se niega (`execution.probe_version_unsupported`) en vez de
  adivinar (D113 punto 9).

### HU-CT-18 · Que al dar de baja un servidor su agente se retire de la sonda

> 🟡 **Parcial:** construido para dar de baja un servidor; si ningún trabajador lo reclama en 2 minutos, el agente queda
> en la sonda sin dueño (DT-106), y al archivar una empresa sus agentes aún no se retiran (D113 punto 8).

**Como** `admin_empresa`, **quiero** que el agente de un servidor que doy de baja deje de existir en la sonda **para**
que no siga enviando datos sin dueño.

- Al dar de baja el servidor, el vínculo y la clave se sueltan al instante y queda en cola retirar su agente por su
  nombre (D113 punto 8).
- Si el agente ya no estaba, el retiro también termina bien.
- ⚪ Al archivar una empresa, sus agentes se retiran (D113 punto 8).

### HU-CT-19 · Conservar el historial de mediciones el periodo auditado

> ⚪ **Por decidir:** el tope de frecuencia y la retención del detalle están por definir y se preguntan al comité (D53
> punto 5, D113 punto 5); sin política de retención ni partición (DT-48).

**Como** `auditor`, **quiero** que el historial de mediciones se conserve el periodo que se audita **para** comprobar el
estado de un control en una fecha pasada.

- Propuesta: corridas completas por un periodo corto (90 días por defecto) y, para el histórico largo (7 años), solo
  las transiciones de estado más un resumen diario; se pregunta al comité si un auditor exigiría más (D53 punto 5).
- La sonda no guarda historial de configuración: lo construye Monkey (D113 punto 6).
