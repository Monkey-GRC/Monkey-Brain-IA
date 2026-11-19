# Conexión de activos · historias de usuario

Responde: **¿qué necesita una empresa para conectar su infraestructura real a Monkey y comprobar que la conexión mide de
verdad?** Es el Componente 3 del [onboarding](../README.md): aquí viven sus historias `HU-ONB-15` a `HU-ONB-29`; las de los
Componentes 1 y 2 y el resumen de las 29 están en [`../04-historias.md`](../04-historias.md). Cada historia dice quién,
qué y para qué; sus criterios citan la regla que los fija. El detalle técnico (cuerpos, errores) está en
[`contracts/onboarding/conexion-activos/`](../../../../../../../contracts/onboarding/conexion-activos/README.md); la
secuencia, en [`03-flujos.md`](03-flujos.md); los pasos de cada caso, en [`../05-casos-de-uso.md`](../05-casos-de-uso.md).

**Roles** (D96): `admin_empresa` declara todo; los demás roles no gestionan conexiones. **Estado** de cada historia:
✅ construida · 🟡 parcial · ⚪ por construir. La instalación y la lectura de un servidor con agente son del
[Control técnico](../../control-tecnico/04-historias.md).

## Historias


### HU-ONB-15 · Elegir en un catálogo la plataforma que quiero conectar

> 🟡 **Parcial:** el catálogo está construido; mostrar los logos de terceros a clientes reales depende de `P21`.

**Como** `admin_empresa`, **quiero** elegir la plataforma (una nube, un sistema operativo, un motor de base de datos)
en un catálogo **para** conectar lo que tengo sin clasificarme en categorías técnicas.

- No se pregunta dónde vive el servicio: se ofrecen siempre las seis conexiones y la plataforma elegida lo dice (D92).
- Un grupo por tipo de conexión, con nombre de negocio (nunca `ac_01`), y una tarjeta por plataforma en el orden del
  catálogo; todo sale de la base, la pantalla no tiene listas (D67).
- Solo se elige una plataforma `available`; las `coming_soon` se muestran bloqueadas con «Próximamente», no navegan y
  se anuncian como no disponibles, no solo con opacidad (D67 punto 6). La API rechaza una bloqueada con
  `422 connection.provider_not_supported`.
- El nombre de la plataforma va siempre como texto visible; el logo es decorativo y tiene variante para tema oscuro.
- ⚪ Usar los logos de marcas de terceros ante clientes reales espera `P21`; hoy salen de colecciones de iconos, no de
  los kits de cada marca (DT-68).

### HU-ONB-16 · Conectar una cuenta de AWS con un rol de solo lectura

> 🟡 **Parcial:** construido y verificado contra AWS real, pero solo dentro de la cuenta de Monkey; falta probarlo con
> una cuenta de otro dueño (DT-103, SEG-78 parcial).

**Como** `admin_empresa`, **quiero** conectar mi cuenta de AWS creando un rol de solo lectura **para** que Monkey la
evalúe sin que yo entregue secretos.

- Declaro un nombre, la cuenta, al menos una región del catálogo y los servicios que soporta; el activo nace `pending`
  y `not_monitored`, con código `AST-0001` por empresa y tipo deducido de la conexión (D46 punto 4).
- Monkey me entrega un `external_id` único por activo, su identidad, el nombre del rol, la plantilla para descargar y
  los pasos ya traducidos (D58); el enlace de «un clic» no existe (DT-55).
- Devuelvo el ARN del rol: sin forma de ARN o de otra cuenta que la declarada → `422 VALIDATION_FAILED`.
- Solo se evalúan las regiones declaradas (D53).
- Un canal que no es de la plataforma → `409 CONNECTION_METHOD_NOT_APPLICABLE`.
- Otro cliente no puede hacer que Monkey lea mi cuenta: el rol solo se asume con mi `external_id` (SEG-78).

### HU-ONB-17 · Conectar AWS con llaves si no puedo crear el rol

**Como** `admin_empresa`, **quiero** conectar AWS con llaves de acceso de solo lectura **para** no quedarme sin
evaluación si no puedo crear un rol.

- La pantalla ofrece primero el rol y advierte que las llaves son de larga vida y menos seguras (D58).
- Las llaves se cifran (AES-256-GCM) y nunca vuelven en una respuesta, un log, la auditoría ni la pantalla (SEG-24,
  SEG-50).
- Si las llaves no son válidas o están desactivadas, la comprobación lo señala en `credentials`
  (`connection.credentials_invalid`).

### HU-ONB-18 · Conectar un proyecto de GCP sin entregar claves

**Como** `admin_empresa`, **quiero** conectar un proyecto de GCP pegando un comando en Cloud Shell **para** que Monkey
lo evalúe sin claves de larga vida.

- Declaro el ID del proyecto (sin regiones ni credenciales: `422 field.not_allowed` si llegan); GCP se evalúa completo
  (D112 punto 1).
- Recibo el comando listo para pegar, con el script dentro, y los pasos; el script crea el acceso de solo lectura en mi
  proyecto, es idempotente e imprime el número de proyecto (D112 punto 2).
- Entrego el número de proyecto (6 a 19 dígitos; si no → `422 VALIDATION_FAILED`).
- El alcance y el método del asistente salen del Backend con su disponibilidad y etiquetas (D114).
- Si el servidor no tiene la identidad de Monkey configurada, la plantilla responde `503 CONNECTION_UNAVAILABLE`.
- Otro cliente no puede usar mi proyecto: solo se acepta la sesión con el `external_id` de mi activo (SEG-78).

### HU-ONB-19 · Declarar un servidor para que lo lea la sonda

> ✅ **Construida** para Linux y Windows en servidores on-premise (`available`, D113, aprobada el 2026-11-18). Instalar la
> sonda y leerla es del Control técnico; «Comprobar conexión» no aplica a un servidor y responde `503` a propósito.

**Como** `admin_empresa`, **quiero** declarar un servidor con su sistema operativo **para** instalarle la sonda y que
Monkey lo evalúe.

- Declaro el servidor con la versión del sistema (`os_version`, de `GET /v1/catalogs/<sistema>_version`); un valor fuera
  de ese catálogo o de otro sistema → `422 VALIDATION_FAILED` (D113).
- La respuesta trae el agente en `pending` y cuatro pasos ya traducidos; un alta rechazada no deja nada a medias.
- El comando de instalación lo entrega Control técnico (`GET /v1/assets/{id}/agent-install`), no este componente.
- `POST /validate` sobre un servidor responde `503 CONNECTION_UNAVAILABLE`: un servidor no se «valida», la lectura es la prueba.

### HU-ONB-20 · Conectar bases de datos, equipos y las demás nubes

> ⚪ **Por construir:** se muestran bloqueadas en el catálogo (D67).

**Como** `admin_empresa`, **quiero** conectar bases de datos, equipos de usuario, servidores en nube y nubes como Azure,
Microsoft 365 o Google Workspace **para** medir todo lo que soporta mi servicio.

- Hoy son `coming_soon`: crearlas → `422 connection.provider_not_supported` (D67 punto 3).
- Bases, equipos y servidores en nube no tienen canal de agente todavía (D113 solo abrió Linux y Windows on-premise); Azure espera cuentas de prueba del comité.

### HU-ONB-21 · Comprobar que la conexión funciona de verdad

**Como** `admin_empresa`, **quiero** que Monkey compruebe el acceso real a mi cuenta **para** saber que la conexión
sirve antes de activarla.

- La comprobación es de solo lectura, la hace el trabajador aislado y la pantalla espera unos segundos (D57, D58); el
  Backend nunca toca la cuenta.
- Si funciona: `connection_status = validated`, con la fecha, las comprobaciones disponibles y la cobertura como
  `"n/18"`, no un porcentaje.
- Si falla por algo mío → `422 CONNECTION_FAILED` señalando el campo a corregir: rol inexistente o no asumible, cuenta
  o proyecto distinto del declarado, llaves inválidas, sin regiones, federación rechazada.
- Si falla por algo de Monkey (trabajador caído, sin sonda) → `503 CONNECTION_UNAVAILABLE` y la conexión queda como
  estaba: no se me achaca (D46 punto 9).
- Nunca se finge: en modo simulado la respuesta dice `mode: demo` («Automatizado ≠ Operativo», D46).
- Una conexión activa o programada se puede volver a comprobar: refresca los activos y la fecha, sin cambiar su estado.
- Éxito y fallo dejan `asset.validate` (el fallo con `result = error`).

### HU-ONB-22 · Ver los activos que encontró la conexión

**Como** `admin_empresa`, **quiero** ver los servidores, bases, almacenamiento y funciones que la conexión reconoció
**para** saber qué hay en mi cuenta.

- El descubrimiento ocurre al comprobar la conexión, solo lee y solo en las regiones declaradas (D59, SEG-51).
- Cada recurso es un activo propio con código, IP, zona, etiquetas, plataforma y criticidad (D61); el sistema operativo
  es una inferencia por la imagen y se dice así, o queda vacío (DT-59).
- Sin descubrimiento aún, la lista viene vacía, no es un error; un servicio de la nube que no se pudo leer se informa
  como inventario incompleto.
- Los recursos que solo conoce la evaluación (usuarios, políticas) no salen como activos.
- El error del proveedor nunca se registra ni se devuelve (SEG-51).

### HU-ONB-23 · Elegir qué activos son de cada servicio

**Como** `admin_empresa`, **quiero** marcar qué activos de una conexión pertenecen a un servicio **para** que su
cumplimiento mida solo lo suyo.

- Por defecto no hay ninguno enlazado; lo no enlazado queda visible como «no incluido» (D61 punto 3).
- El envío fija exactamente el conjunto (los que no vienen se desenlazan) y es idempotente; responde cuántos quedan,
  cuántos entraron y cuántos salieron.
- Un id que no es activo activo de esa conexión y de mi empresa → `422 VALIDATION_FAILED` en `asset_ids`; otra empresa
  ve `404` (SEG-53).
- Un activo puede servir a varios servicios sin duplicarse. Deja `service.assets_set`.

### HU-ONB-24 · Activar la conexión y fijar cada cuánto se mide

> 🟡 **Parcial:** se activa y se guarda la frecuencia, pero en el Backend no hay quien convierta la frecuencia de una
> conexión de nube en ejecuciones (control técnico, HU-CT-04).

**Como** `admin_empresa`, **quiero** activar una conexión comprobada y elegir su frecuencia **para** que Monkey la mida
sola.

- Activar exige la conexión comprobada: si no → `409 ASSET_NOT_VALIDATED`; ya activa → `409 ASSET_ALREADY_ACTIVE`.
- Con la sonda real queda `operational`; con la simulada, `warning`, nunca `operational` (D46).
- Programar exige la conexión activa (`409 ASSET_NOT_ACTIVE`) y una frecuencia que su conexión admite (nube
  `every_6h` o `every_24h`; las demás `continuous`); si no → `422 FREQUENCY_NOT_SUPPORTED` (D46 punto 1).
- Deja `asset.activate` y `asset.schedule`.

### HU-ONB-25 · Ver las conexiones de un servicio

**Como** `admin_empresa`, **quiero** ver las conexiones de cada servicio con su estado **para** saber qué se está
midiendo.

- El detalle del servicio lista sus conexiones; «Mis servicios» muestra cuántas tiene cada uno (D60).
- `GET /v1/assets` lista solo conexiones, paginadas y filtrables por servicio, tipo y estado operativo; los activos
  descubiertos viven dentro de su conexión (D61 punto 7).
- Cada una trae código, nombre, tipo, estado operativo, cobertura técnica y estado de la conexión.
- El servicio da por hecho su control técnico con al menos una conexión (D92 punto 4).

### HU-ONB-26 · Cambiar los datos de una conexión

**Como** `admin_empresa`, **quiero** editar el nombre, la cuenta, las regiones, el rol o las llaves de una conexión
**para** mantenerla al día.

- Nombre, criticidad y etiquetas no tocan la conexión.
- Cambiar cuenta, regiones, rol o llaves la devuelve a `pending`: pierde la activación y la programación y pasa a
  `not_monitored`; el historial se conserva.
- Cambiar de cuenta o de proyecto renueva el `external_id`; en GCP borra el número de proyecto y hay que volver a correr
  el comando (D112, SEG-78).
- Un campo de otro canal → `422 field.not_allowed`; un rol de otra cuenta → `422 connection.account_mismatch`; con una
  comprobación o evaluación en curso → `409 EXECUTION_IN_PROGRESS`.
- Deja `asset.update`.

### HU-ONB-27 · Dar de baja una conexión

**Como** `admin_empresa`, **quiero** quitar una conexión que ya no uso **para** dejar de evaluarla sin perder su
historial.

- Es una baja, no un borrado: deja de listarse, validarse, activarse, programarse, editarse y evaluarse (`404`), y sus
  llaves guardadas se borran (SEG-52).
- Los activos que descubrió se dan de baja con ella y se desenlazan de los servicios (D61 punto 6).
- Ejecuciones, resultados y hallazgos se conservan como evidencia; con una ejecución en curso →
  `409 EXECUTION_IN_PROGRESS`.
- Deja `asset.retire`. Una conexión dada de baja no se puede ver ni restaurar (DT-11).

### HU-ONB-28 · Ajustar la criticidad y el responsable de un activo descubierto

> ⚪ **Por construir** (DT-63).

**Como** `admin_empresa`, **quiero** fijar la criticidad y el cargo responsable de un activo que encontró la conexión
**para** priorizarlo y que tenga quien responda por él.

- Hoy un activo descubierto nace en «Media», sin responsable, y no se edita por su cuenta (`404`, D61 punto 7).
- Volver a descubrir no pisa la criticidad ni el responsable que fije el cliente (D61 punto 4).

### HU-ONB-29 · No ver nunca el nombre del motor ni de la sonda

**Como** persona de Platform, **quiero** que Monkey hable de «sonda» o «evaluación automática» **para** usar el
producto sin depender de nombres internos de terceros.

- Ninguna respuesta, mensaje, log, texto de i18n, plantilla, script ni pantalla del componente nombra al proveedor del
  motor; `provider` del catálogo nunca sale (D46, D70).
- Una prueba lo revisa en respuestas, i18n, `src/`, logs y el bundle de la aplicación.
