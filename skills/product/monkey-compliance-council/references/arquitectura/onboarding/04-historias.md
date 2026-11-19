# Onboarding · historias de usuario

Responde: **¿qué necesita una empresa para contarle a Monkey quién es, qué servicios ofrece y qué activos tiene, de modo
que su cumplimiento se pueda medir, y cómo se comprueba que lo tiene?** Cada historia dice quién, qué y para qué; sus
criterios de aceptación son verificables y citan la regla que los fija. El detalle técnico (cuerpos, errores) está en
los contratos de [`contracts/onboarding/`](../../../../../../contracts/onboarding/contexto-organizacional.md)
([contexto organizacional](../../../../../../contracts/onboarding/contexto-organizacional.md),
[cargos](../../../../../../contracts/onboarding/cargos-responsables.md),
[contexto del servicio](../../../../../../contracts/onboarding/contexto-servicio.md) y
[conexión de activos](../../../../../../contracts/onboarding/conexion-activos/README.md)); la secuencia, en
[`03-flujos.md`](03-flujos.md) y en el `03-flujos.md` de cada componente; los pasos de cada caso, en
[`05-casos-de-uso.md`](05-casos-de-uso.md).

**Jira:** épica [MD-317](https://rod2408.atlassian.net/browse/MD-317), una historia por fila. El cerebro manda: si una historia cambia, se actualiza aquí y después su issue.

**Alcance** (D89): en sentido estricto el onboarding es solo el contexto de la empresa (Componente 1); declarar
servicios y conectar activos se hace cuando el cliente quiera. Este módulo cubre los tres componentes porque comparten
propósito, actor y orden ([`README.md`](README.md)). La evaluación de riesgos ocurre en la pantalla del servicio pero
su dueño es el módulo de riesgos de Cumplimiento: aquí solo están las historias que la encadenan al alta del servicio.

**Roles** (D96): `admin_empresa` declara todo; `responsable`, `delegado` y `auditor` solo leen lo que se indica. «Persona
de Platform» = cualquiera de los cuatro. **Estado** de cada historia: ✅ construida · 🟡 parcial · ⚪ por construir.

## Resumen

### Componente 1 · Contexto organizacional

| ID | Historia | Rol | Estado | Reglas | Jira |
|---|---|---|---|---|---|
| HU-ONB-01 | Declarar el contexto de mi empresa | `admin_empresa` | ✅ | D44, D47, D73 | MD-341 |
| HU-ONB-02 | Llenar el contexto por partes sin perder lo escrito | `admin_empresa` | ✅ | D44, DT-18 | MD-342 |
| HU-ONB-03 | Corregir el contexto de mi empresa | `admin_empresa` | ✅ | D44 | MD-343 |
| HU-ONB-04 | Terminar el onboarding con solo el contexto de la empresa | `admin_empresa` | ✅ | D89 | MD-344 |
| HU-ONB-05 | Registrar los cargos que responden ante el auditor | `admin_empresa` (Persona de Platform lee) | ✅ | D30, D102 | MD-345 |

### Componente 2 · Contexto del servicio

| ID | Historia | Rol | Estado | Reglas | Jira |
|---|---|---|---|---|---|
| HU-ONB-06 | Declarar un servicio con un marco contratado | `admin_empresa` | ✅ | D45, D47, D50, D51 | MD-346 |
| HU-ONB-07 | Que el catálogo del marco quede preparado al crear el servicio | `admin_empresa` | ✅ | D23, D36, D40, D45, DT-14 | MD-347 |
| HU-ONB-08 | Entregar la descripción del sistema con un enlace o un archivo | `admin_empresa` | ✅ | D51, SEG-43, SEG-59 | MD-348 |
| HU-ONB-09 | Que la descripción del sistema se lea y llene CSOC y CUEC | `admin_empresa` | ⚪ | D11, DT-12 | MD-349 |
| HU-ONB-10 | Editar o ampliar un servicio | `admin_empresa` | ✅ | D45 | MD-350 |
| HU-ONB-11 | Eliminar un servicio sin borrar lo ya evaluado | `admin_empresa` | ✅ | D45 | MD-351 |
| HU-ONB-12 | Ver solo los servicios que me tocan | Persona de Platform | ✅ | D96, D102 | MD-352 |

### Riesgos del servicio (dueño: módulo de riesgos)

| ID | Historia | Rol | Estado | Reglas | Jira |
|---|---|---|---|---|---|
| HU-ONB-13 | Evaluar los riesgos del servicio en la misma alta | `admin_empresa` | ✅ | D89, D93 | MD-353 |
| HU-ONB-14 | No declarar activos mientras falten riesgos por evaluar | `admin_empresa` | 🟡 | D89, DT-77 | MD-354 |

### Componente 3 · Conexión de activos

| ID | Historia | Rol | Estado | Reglas | Jira |
|---|---|---|---|---|---|
| HU-ONB-15 | Elegir en un catálogo la plataforma que quiero conectar | `admin_empresa` | 🟡 | D67, D92, P21, DT-68 | MD-355 |
| HU-ONB-16 | Conectar una cuenta de AWS con un rol de solo lectura | `admin_empresa` | 🟡 | D53, D58, SEG-78, DT-103 | MD-356 |
| HU-ONB-17 | Conectar AWS con llaves si no puedo crear el rol | `admin_empresa` | ✅ | D58, SEG-24, SEG-50 | MD-357 |
| HU-ONB-18 | Conectar un proyecto de GCP sin entregar claves | `admin_empresa` | ✅ | D112, D114, SEG-78 | MD-358 |
| HU-ONB-19 | Declarar un servidor para que lo lea la sonda | `admin_empresa` | ✅ | D113 | MD-359 |
| HU-ONB-20 | Conectar bases de datos, equipos y las demás nubes | `admin_empresa` | ⚪ | D67, D113 | MD-360 |
| HU-ONB-21 | Comprobar que la conexión funciona de verdad | `admin_empresa` | ✅ | D46, D57, D58 | MD-361 |
| HU-ONB-22 | Ver los activos que encontró la conexión | `admin_empresa` | ✅ | D59, D61, SEG-51 | MD-362 |
| HU-ONB-23 | Elegir qué activos son de cada servicio | `admin_empresa` | ✅ | D61, SEG-53 | MD-363 |
| HU-ONB-24 | Activar la conexión y fijar cada cuánto se mide | `admin_empresa` | 🟡 | D46, D57 | MD-364 |
| HU-ONB-25 | Ver las conexiones de un servicio | `admin_empresa` | ✅ | D60, D61 | MD-365 |
| HU-ONB-26 | Cambiar los datos de una conexión | `admin_empresa` | ✅ | D112, SEG-78 | MD-366 |
| HU-ONB-27 | Dar de baja una conexión | `admin_empresa` | ✅ | D61, SEG-52, DT-11 | MD-367 |
| HU-ONB-28 | Ajustar la criticidad y el responsable de un activo descubierto | `admin_empresa` | ⚪ | D61, DT-63 | MD-368 |
| HU-ONB-29 | No ver nunca el nombre del motor ni de la sonda | Persona de Platform | ✅ | D46, D70 | MD-369 |

---

## Componente 1 · Contexto organizacional

### HU-ONB-01 · Declarar el contexto de mi empresa

**Como** `admin_empresa`, **quiero** contarle a Monkey quién es mi empresa (descripción, tamaño, industria, modelo de
negocio, países y regulaciones) **para** que el cumplimiento se evalúe con el contexto correcto.

- El formulario pide 9 campos obligatorios y uno opcional (`years_in_operation`); la razón social llega precargada y
  bloqueada desde el alta de la empresa, y enviarla da `422 VALIDATION_FAILED` con `field.not_editable` (D44).
- Las opciones salen de `GET /v1/catalogs/{name}` con la etiqueta en el idioma de la petición; la pantalla no tiene
  listas propias. `business_model` trae las 19 opciones del comité más `other` (D73).
- Un valor fuera del catálogo, una lista obligatoria vacía o con repetidos, una descripción de más de 2000 caracteres o
  `eu` como país de constitución → `422 VALIDATION_FAILED`, con todos los errores a la vez y el código del campo.
- «Ninguna» regulación es excluyente (`regulation.none_exclusive`) y queda guardada como respuesta; «Otra» queda solo
  marcada, sin texto (D44).
- No se elige marco aquí: Monkey Admin lo contrata al registrar la empresa (D47).
- Solo `admin_empresa` lee y guarda (`403 FORBIDDEN` para otro rol); cada guardado deja
  `organizational_context.save` con el estado antes y después.

### HU-ONB-02 · Llenar el contexto por partes sin perder lo escrito

**Como** `admin_empresa`, **quiero** avanzar por pantallas cortas y retomar donde lo dejé **para** no tener que llenar
todo de una sentada.

- El asistente tiene 5 pantallas cortas más una de revisión; el progreso dice «Paso 2 de 5», nunca un porcentaje de
  cumplimiento (D44).
- El avance vive en el navegador, por usuario, y se borra al guardar en el servidor; no hay borradores en el servidor
  (`PATCH` parcial no existe, DT-18).
- El contador `completion` cuenta campos del formulario y no se presenta como métrica de preparación.

### HU-ONB-03 · Corregir el contexto de mi empresa

**Como** `admin_empresa`, **quiero** volver al contexto ya guardado y cambiarlo **para** que siga reflejando la
empresa.

- Si ya guardé, entro directo a la revisión con lo guardado y puedo editar.
- Un solo `PUT` crea la primera vez y actualiza las siguientes; no existe `ORGANIZATION_ALREADY_EXISTS` (D44).
- La razón social no cambia aunque se edite lo demás.

### HU-ONB-04 · Terminar el onboarding con solo el contexto de la empresa

**Como** `admin_empresa`, **quiero** que el onboarding termine al declarar el contexto de mi empresa **para** usar
Monkey sin que me exijan servicios ni conexiones que aún no puedo hacer.

- Al entrar sin el contexto declarado, Platform me lleva al asistente; con él declarado, «Inicio» da la empresa por
  onboardeada (D89 punto 1).
- `GET /v1/auth/me` deriva el avance de lo guardado (nadie escribe «onboarding completo») y lista
  `organizational_context`, `service_context` y `technical_control`; Platform solo mira el primero (D89 punto 6).
- Cumplimiento sin servicios dice «No hay servicios creados…» con un enlace a `/services/new`; «Inicio» invita igual
  (D89 punto 2).

### HU-ONB-05 · Registrar los cargos que responden ante el auditor

**Como** `admin_empresa`, **quiero** registrar los cargos de la organización (COO, TI, Cumplimiento, Proceso, CISO,
Propietario del activo) y quién los ocupa hoy **para** que cada evidencia, riesgo y activo tenga un responsable ante el
auditor.

- Un cargo no es una cuenta: guarda el tipo y el nombre de la persona; cambiar la persona no mueve lo que apunta al
  cargo (D30). En pantalla se llama «cargos de la organización», no «responsable» (D102).
- Sin organización declarada → `409 ORGANIZATION_NOT_DECLARED`; mismo tipo con la misma persona →
  `409 RESPONSIBLE_ALREADY_EXISTS`; tipo fuera del enum o nombre demasiado largo → `422 VALIDATION_FAILED`.
- Quitar un cargo del que dependen activos, evidencias requeridas o tratamientos de riesgo → `409 RESPONSIBLE_IN_USE`.
- `responsable`, `delegado` y `auditor` ven la lista; crear, cambiar o quitar les da `403 FORBIDDEN`.
- Cada alta, cambio y baja deja `responsible.create`, `responsible.update` o `responsible.delete` en la misma
  transacción.

## Componente 2 · Contexto del servicio

### HU-ONB-06 · Declarar un servicio con un marco contratado

**Como** `admin_empresa`, **quiero** declarar un servicio de mi empresa y el marco con que se evalúa **para** que
Monkey mida su cumplimiento como unidad servicio × marco.

- Pide los 14 campos del request (12 obligatorios); la regulación no se pregunta aquí porque es de la empresa (D51).
- Sin el contexto organizacional → `409 ORGANIZATION_NOT_DECLARED`; nombre repetido en la empresa, sin distinguir
  mayúsculas → `409 SERVICE_NAME_TAKEN` (D45 punto 11).
- La pantalla muestra todos los marcos y solo deja elegir los contratados: uno no contratado →
  `409 FRAMEWORK_NOT_CONTRACTED`, con invitación a hablar con mercadeo; uno «próximamente» →
  `409 FRAMEWORK_NOT_AVAILABLE` (D47, D50).
- `trust_criteria` siempre incluye `security`: el servidor lo añade si falta, no lo rechaza (DT-17).
- Valores fuera de catálogo, listas vacías o repetidas, enlace inválido o un proveedor sin `type` →
  `422 VALIDATION_FAILED`, todos a la vez.
- El asistente tiene 6 pantallas y una de revisión; el avance se guarda en el navegador (D45 punto 16).
- Deja `service.create` con el estado después.

### HU-ONB-07 · Que el catálogo del marco quede preparado al crear el servicio

**Como** `admin_empresa`, **quiero** que al elegir el marco aparezcan los controles, riesgos y causas del servicio sin
hacer nada más **para** empezar a trabajar el cumplimiento de inmediato.

- Elegir el marco dispara el clonado en la misma transacción que crea el servicio: todo o nada (D45 punto 9).
- Se clonan los controles ligados a requisitos de los criterios contratados, con sus dimensiones, pruebas vinculadas y
  evidencias requeridas; los requisitos, puntos de enfoque y pruebas se referencian, no se copian (D36, D40).
- Se clonan todos los riesgos activos y sus causas, propios de este servicio (D23, D45 punto 6).
- Los controles llegan «Sin asignar» (D102) y la evidencia requerida, sin cargo responsable (D30).
- El `201` trae `catalog.status = ready` con los requisitos aplicables y los controles clonados; el `202` con
  `processing` del contrato no existe (DT-14).
- Al terminar, la pantalla muestra los requisitos y controles preparados con sus códigos, explicados.

### HU-ONB-08 · Entregar la descripción del sistema con un enlace o un archivo

**Como** `admin_empresa`, **quiero** entregar la descripción del sistema como enlace, archivo o los dos **para** que el
auditor tenga el documento del servicio.

- Es opcional al crear; con al menos uno de los dos el servicio queda completo (D51).
- El enlace solo acepta `http` o `https` (`422 url.invalid`) y no borra el archivo.
- El archivo es PDF o `.docx` de hasta 25 MB exactos, validado por extensión y por firma: vacío → `422 FILE_REQUIRED`,
  más grande → `413 FILE_TOO_LARGE`, otro tipo → `415 UNSUPPORTED_MEDIA_TYPE` (SEG-43). Reemplaza al anterior.
- Sin almacenamiento configurado → `503 STORAGE_UNAVAILABLE` y la pantalla ofrece el enlace.
- La descarga es un enlace firmado de 5 minutos; la llave del objeto nunca sale en una respuesta (SEG-59). Si solo hay
  enlace → `404 SYSTEM_DESCRIPTION_NOT_A_FILE`.
- Deja `service.system_description`.

### HU-ONB-09 · Que la descripción del sistema se lea y llene CSOC y CUEC

> ⚪ **Por construir** (DT-12): el documento se guarda pero no se procesa.

**Como** `admin_empresa`, **quiero** que Monkey lea las 10 secciones de la descripción del sistema **para** no
transcribir a mano los controles complementarios que pide el auditor.

- Las secciones 7 y 8 alimentan `csocs` (por proveedor subcontratado) y `cuecs` (por servicio), que no se puntúan ni
  entran al cálculo (D11).
- Hoy `sections` queda vacío y `PUT …/csocs` y `PUT …/cuecs` no existen.

### HU-ONB-10 · Editar o ampliar un servicio

**Como** `admin_empresa`, **quiero** cambiar los datos de un servicio o ampliar sus criterios y marcos **para** que
siga describiendo lo que la empresa ofrece.

- Solo cambian las claves enviadas; `null` borra un opcional.
- Ampliar `trust_criteria` o `framework_codes` recalcula los requisitos aplicables y clona solo lo que falte, sin pisar
  nada (D45 punto 8); un marco no contratado → `409 FRAMEWORK_NOT_CONTRACTED`.
- Quitar un criterio o un marco no borra controles: el marco pasa a inactivo y la respuesta lo dice.
- Deja `service.update` con el antes y el después.

### HU-ONB-11 · Eliminar un servicio sin borrar lo ya evaluado

**Como** `admin_empresa`, **quiero** eliminar un servicio que declaré por error **para** no medir algo que la empresa
no ofrece.

- Pide confirmación en «Mis servicios».
- Con evaluaciones, evidencias entregadas, observaciones o planes de acción → `409 SERVICE_HAS_EVALUATIONS`: el
  histórico es inmutable (D45 punto 12).
- Si no, borra todo lo del servicio, también su archivo en el almacenamiento (D51), y deja `service.delete`.
- Borrar un servicio no borra los activos que lo soportan (D46 punto 8).

### HU-ONB-12 · Ver solo los servicios que me tocan

**Como** persona de Platform, **quiero** ver los servicios de mi empresa que me corresponden **para** trabajar sobre
ellos sin ver lo que no es mío.

- `admin_empresa` y `auditor` ven todos; el `auditor`, en solo lectura (D96).
- `responsable` y `delegado` ven solo los servicios donde son dueño o ejecutor de algún control; el detalle de otro da
  `403` (D102).
- Un servicio de otra empresa responde `404`, no `403` (RLS por empresa).
- La lista pagina desde el principio y trae nombre, tipo, si está completo, marcos y estado del catálogo.

## Riesgos del servicio

### HU-ONB-13 · Evaluar los riesgos del servicio en la misma alta

**Como** `admin_empresa`, **quiero** calificar los riesgos del servicio justo después de crearlo, sin ir a
Cumplimiento, **para** que el servicio tenga lo básico antes de medirlo.

- Al guardar el servicio, la misma pantalla sigue con un asistente que presenta los riesgos uno a uno, con dos
  preguntas de 1 a 5 (probabilidad e impacto) en las escalas del comité; el servidor calcula el valor y el nivel
  (D89 punto 3).
- Si lo interrumpo, lo retomo desde el detalle del servicio con el mismo asistente, en el primer riesgo sin evaluar.
- «Este riesgo no aplica a mi servicio» pide un motivo de al menos tres letras y lo retira; retirar un riesgo no retira
  causas ni controles, y el motivo queda en la auditoría (D93 puntos 1, 2 y 4).
- Un riesgo retirado se puede volver a incluir conservando su evaluación (D93 punto 5).
- Puedo agregar un riesgo propio con sus causas, que entra a la cola de pendientes (D93 punto 6).
- Evaluar o tratar un riesgo dado de baja → `409 RISK_INACTIVE`.

### HU-ONB-14 · No declarar activos mientras falten riesgos por evaluar

> 🟡 **Parcial:** la pantalla lo exige; el Backend no (DT-77).

**Como** `admin_empresa`, **quiero** que Monkey no me deje conectar activos a un servicio con riesgos sin evaluar
**para** no medir un servicio al que le falta lo básico.

- Mientras falte algún riesgo vigente, «Nueva conexión» queda cerrada con el motivo, el avance («faltan 4 de 10») y un
  botón al asistente; las rutas de conexión llevan al detalle del servicio (D89 punto 4).
- Un riesgo retirado no cuenta como pendiente; un servicio sin riesgos vigentes no se bloquea; lo ya conectado no
  cambia (D89 punto 4, D93 punto 1).
- ⚪ La API rechaza crear una conexión o asignar activos con riesgos pendientes (`409 RISKS_NOT_EVALUATED`); hoy no lo
  comprueba (DT-77).

## Componente 3 · Conexión de activos

Las historias `HU-ONB-15` a `HU-ONB-29` (catálogo de plataformas, AWS, GCP, servidores, comprobar, descubrir, activar,
editar y dar de baja) están en [`conexion-activos/04-historias.md`](conexion-activos/04-historias.md): se partieron por
componente para no pasar de 25 KB (`STANDARD.md` §3). Sus IDs y estados son los de la tabla de arriba.
