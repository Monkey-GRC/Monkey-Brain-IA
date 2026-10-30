# Deuda técnica — Transversal

Lo que no pertenece a un solo módulo (pruebas, CI, auditoría, traducciones, entorno) y la funcionalidad que el brain menciona sin contrato. Contexto: [`README.md`](README.md).

## Transversal

### DT-20 · Las pruebas automáticas están a medias en los repositorios

🟠 Importante

- **Qué está parchado:** *Hecho (2026-10-07, PR #17 del Backend):* CI en GitHub (`ci.yml`: lint, build, unitarias, migraciones desde cero, verificadores de catálogo/clonado/audit) y 18 pruebas de aislamiento entre empresas a nivel de base de datos (`Backend/test/aislamiento/`). *Hecho (en `develop`, PR #18 y #19):* 20 pruebas por **HTTP con supertest** que levantan la app real contra Postgres y comprueban que una empresa no lee, modifica ni enlaza nada de otra, y que `admin_monkey` y `admin_empresa` no se cruzan. *Hecho además (rama `feat/audit-in-same-transaction`):* auditoría atómica (19 pruebas) y autenticación (12), con mutaciones que prueban que fallan cuando el requisito se rompe. *Falta:* el recorrido por **navegador (Playwright en `Frontend-Platform`)** sigue fuera del repo y sin CI; y las demás rutas (evidencias, riesgos, usuarios) cuando existan
- **Por qué:** Velocidad del sprint
- **Qué lo cierra:** Llevar el recorrido de navegador a `Frontend-Platform` y correrlo en CI; ampliar el HTTP con cada módulo nuevo

### DT-46 · El CI no bloquea el merge ni el despliegue

🟠 Importante

- **Qué está parchado:** La protección de rama exige el plan GitHub Team (la organización es privada y no lo tiene): un PR en rojo se puede mergear, y `deploy-dev.yml` corre en paralelo al CI, no después
- **Por qué:** Coste de la suscripción
- **Qué lo cierra:** Plan Team + marcar `verificar` como check obligatorio; o, sin pagar, hacer que el deploy dependa del CI (`needs`). Acuerdo de equipo: no mergear con el check en rojo

### DT-48 · `check_results` no tiene política de retención ni de partición

🟠 Importante

- **Qué está parchado:** Es la tabla de mayor volumen (11.352 checks posibles × activos × corrida cada 6 h) y D41 fija 7 años solo para la auditoría. Sin decidir qué se conserva (¿toda corrida, o solo cambios de estado?), RLS y los índices se degradan y el almacenamiento crece sin tope
- **Por qué:** Se omitió al diseñar §8
- **Qué lo cierra:** Decidir retención (propuesta: cada corrida un periodo corto y, para el histórico largo, solo transiciones de estado + la última foto) y particionar por mes. Registrarlo como decisión `D-n`

### DT-49 · El módulo de operación continua no tiene contrato

🟠 Importante

- **Qué está parchado:** *2026-10-08: propuesta escrita en `contracts/modules/control-tecnico-operacion.md` (la conexión quedó en `onboarding-technical-control.md`); falta acordarla con frontend.*  `contracts/modules/` solo cubre el onboarding C3. No hay forma acordada de listar ejecuciones, resultados, reglas de programación ni el Centro de Control Técnico (§8)
- **Por qué:** Se construyó primero el alta de activos
- **Qué lo cierra:** Acordar `contracts/modules/control-tecnico-operacion.md` con frontend **antes** de construir endpoints

### DT-50 · El intérprete `check_results → evaluations` solo cubre el motor de nube

🟠 Importante

- **Qué está parchado:** *2026-10-09: construido el intérprete puro, el calculador de preparación por activo y la persistencia de una corrida (`executions`, `check_results`, `asset_resources`, en una transacción con su rastro; 8 pruebas contra Postgres). *2026-10-14 (MD-117): los activos aplicables de un test ya se determinan por la dimensión del activo (servidor, base de datos, nube, aplicación; `modelo-datos.md` §2).* *2026-10-22: **el motor de nube ya escribe `evaluations`** al cerrar una corrida (misma transacción que `check_results`): una fila por control del servicio, test de nube y activo, con `origin: automated` y el porcentaje de lo decidido que pasó. «Todo o nada»: un fallo ⇒ `non_compliant`; lo no decidido (`not_run`, `invalid`) ⇒ `pending`; sin filas en ningún check del test ⇒ `not_applicable`. Solo cuentan los checks ratificados por el comité (`READINESS_INCLUDE_PROPOSED=true` cuenta también los propuestos, solo desarrollo y demostración). **Sigue sin hacerse:** `invalid` se guarda como `pending` (`evaluation_result` no tiene `error`); los activos descubiertos dentro de la cuenta (servidores, bases de datos) no reciben evaluación propia, solo la cuenta; las filas de `findings` (necesitan los siete campos, `P14` E2); y la sonda de servidores, que no escribe aún.* Los umbrales del activo son los de D62 (DT-66).*  R-04 dice que «Monkey interpreta el criterio», pero no está escrito dónde vive el criterio (`tests.compliance_criterion` es texto libre), cómo se determinan los activos aplicables de un control (R-02), qué pasa con un resultado sin check conocido (hoy se descartaría en silencio) ni cómo se registran las exclusiones
- **Por qué:** §9 especifica el cálculo, no la interpretación
- **Qué lo cierra:** §9 ya fija cómo se lee la sonda (`passed` → cumple, `failed` → no cumple, `invalid` → error, `not_run` → pendiente) y el estado del test (D68). Falta que la sonda de servidores escriba `evaluations`, las filas de `findings` y los activos descubiertos, y fijar con el comité el `error` de un test automatizado (hoy `pending`)

### DT-54 · El Backend, el CI y el `Dockerfile` corren en Node 20

🟠 Importante

- **Qué está parchado:** , que según el calendario de Node dejó de recibir actualizaciones de seguridad en abril de 2026. El SDK de AWS ya avisa en el registro del trabajador (2026-10-09) de que exigirá Node ≥ 22 desde enero de 2027
- **Por qué:** Se heredó; subir de versión mezclado con otro cambio habría ensuciado el lock y el despliegue
- **Qué lo cierra:** Un PR aparte: Node 22 en `Dockerfile`, `ci.yml` y `.nvmrc`, regenerando el lock con esa versión. Probar las pruebas de aislamiento y el trabajador antes de mergear

### DT-47 · Los cierres automáticos de sesión no dejan rastro

🟡 Mejora

- **Qué está parchado:** Cuando el sistema cierra una sesión por inactividad (30 min), expiración (8 h) o usuario inactivo, no se escribe en `audit_logs`; solo se auditan el login y el logout que pide el usuario (D52). CC7.2 podría pedirlos
- **Por qué:** Son frecuentes y no son una acción del usuario; el comité no los ha pedido
- **Qué lo cierra:** Decidir con el comité si se registran (`SessionRepository.revoke` ya acepta una `AuditIntent`; hoy se pasa `null`)

### DT-21 · Traducciones al inglés hechas por desarrollo

🟠 Importante

- **Qué está parchado:** y sin revisar. *Hecho (MD-114):* Monkey Platform ya tiene i18n (es/en) en toda la app; el inglés de `Frontend-Platform/public/i18n/en/` también lo escribió desarrollo y está sin revisar. Los términos de Cumplimiento (`compliance.json`) siguen el glosario **propuesto** en MD-109, aún no aprobado por producto. Los nombres de los tipos de conexión (`ac_01`…`ac_06`) salen de la base solo en español: Platform los traduce por código (`TECHNICAL_CONTROL.CATEGORY.*`). La pantalla legacy `assets/asset-detail` (sin ruta, MD-116) no se tradujo
- **Por qué:** El Excel solo trae español
- **Qué lo cierra:** Revisión del comité de los dos idiomas y aprobar el glosario de MD-109; traducir `automated_capabilities.category` en el backend (o llevarlo a `catalogs.json`) para no depender del mapa del frontend; instalar i18n en Platform

### DT-22 · Base de datos dedicada → «no disponible»

🟠 Importante

- **Qué está parchado:** ; sin regenerar clave ni editar empresa
- **Por qué:** P2(b)(c)(d)
- **Qué lo cierra:** Respuestas del comité y el aprovisionamiento

### DT-29 · `auth.login_failed` se guarda con `tenant_id` nulo

🟡 Mejora

- **Qué está parchado:** (no se sabe de qué empresa es un intento fallido hasta autenticar) y los nombres de acción siguen `<recurso>.<verbo>` salvo este
- **Por qué:** El email inexistente no identifica empresa
- **Qué lo cierra:** Decidir con Héctor si se resuelve el tenant por email cuando existe

### DT-30 · Las pruebas de jest no corren en máquinas Windows sin el runtime de Visual C++

🟡 Mejora

- **Qué está parchado:** (jest 30 carga un resolvedor nativo; da «Module ts-jest … was not found»). Se validaron con un runner mínimo
- **Por qué:** Dependencia del entorno
- **Qué lo cierra:** Documentar el requisito (VC++ Redistributable) o fijar un resolvedor sin binario nativo

### DT-24 · Tailwind avisa de clases canónicas (`dark:bg-white/[0.03]` → `dark:bg-white/3`) en Platfor

🟡 Mejora

- **Qué está parchado:** Tailwind avisa de clases canónicas (`dark:bg-white/[0.03]` → `dark:bg-white/3`) en Platform
- **Por qué:** Solo estético
- **Qué lo cierra:** Una pasada de limpieza


### DT-71 · La lectura de controles fija valores que el modelo ya prevé

🟠 Importante

- **Qué está parchado:** `ControlPrismaRepository` marca todo test vinculado a un control como obligatorio y vigente, porque `client_control_tests` aún no guarda esos datos (D68). *(2026-10-22, D88: la parte documental —un test documental fijo en pendiente— ya no está parchada; sale de la revisión de las evidencias.)*
- **Por qué:** MD-117 se construyó antes que la desactivación controlada de tests. *(2026-10-14: MD-118 y MD-150 ya reemplazaron los valores fijos de `approval` y `has_pending_change`.)*
- **Qué lo cierra:** la migración de `client_control_tests` (obligatorio, vigente, fechas) con la desactivación controlada. Reemplaza su valor fijo en `control.prisma.repository.ts` y `control-readout.ts`

### DT-76 · Las plantillas de evidencia del catálogo no dicen a qué prueba sirve cada documento, y el estado documental por control se apartó de RN-13

🟠 Importante

- **Qué está parchado:** las 89 asignaciones control↔documento del Excel no dicen a qué prueba sirve cada documento, así que llegan con `test_id` nulo (D88): se muestran como **sugerencia** y **no cuentan para ninguna prueba**; la evidencia que sí cuenta es la que la persona sube bajo cada prueba. Además D88 calcula una prueba documental **por control** (revisión de lo entregado para ella), lo que se aparta de RN-13 y del punto 1 de D85, que el comité fijó por prueba y servicio.
- **Por qué:** el Excel no trae ese vínculo y un documento distinto en cada control no se puede validar una sola vez para todo el servicio; desarrollo lo decidió con autorización del responsable de producto (2026-10-22).
- **Qué lo cierra:** que el comité defina, para cada asignación, a qué prueba (diseño u operación) sirve el documento y se cargue `catalog.control_evidence_templates.test_id` (o se afine en Monkey Admin) —entonces el documento deja de ser sugerencia y pasa a ser el lugar de esa prueba—, y que ratifique el ajuste a RN-13 para lo documental.
### DT-77 · Evaluar los riesgos antes de declarar activos se exige solo en la pantalla

🟠 Importante

- **Qué está parchado:** D89 pide evaluar los riesgos de un servicio antes de declarar sus activos, pero solo lo imponen la pantalla (el asistente del alta, el botón «Nueva conexión» cerrado y un guard en las rutas de conexión de Platform). Además, **los textos de las escalas de 1 a 5 viven en las traducciones de Platform** (copiados del Excel; el inglés lo tradujo desarrollo, `DT-21`), no en una lista que sirva el Backend. El Backend no lo comprueba: quien llame a `POST /v1/assets` o a `PUT /v1/services/:id/connections/:connectionId/assets` puede declarar activos con riesgos sin evaluar.
- **Por qué:** se construyó primero en Frontend para verlo funcionar y ajustar la regla antes de fijarla en la API; el Backend exige tocar las e2e que crean un servicio y un activo de seguidas.
- **Qué lo cierra:** `409 RISKS_NOT_EVALUATED` al crear una conexión o asignar activos a un servicio con riesgos vigentes sin probabilidad o impacto. Debe aplicar solo a conexiones **nuevas** (los servicios que ya tienen activos no se tocan) y la regla de «cuántos faltan» (`riskProgress` en Platform) debe vivir en un solo sitio. Contrato: `onboarding-technical-control.md`.

### DT-78 · La guía de corrección de una prueba técnica es una traducción automática sin revisar, y el filtro del proveedor es una red de seguridad

🟠 Importante

- **Qué está parchado:** `catalog.checks.remediation_es` y `title_es` los escribió la IA a partir del texto original del motor (D90); nadie los ha revisado. La respuesta los marca `is_ai_generated` y la pantalla los etiqueta como traducción automática. Que ningún texto nombre al proveedor lo garantiza una expresión regular que **omite** el texto si lo encuentra (no lo reescribe) y la revisión al escribir las traducciones; no es una revisión humana. El mensaje por recurso del motor (`status_detail`) no se muestra (crudo, en inglés).
- **Por qué:** sin esto una prueba que falla no decía cómo arreglarla (B33/B34). Hacerlo bien exige la plantilla de siete campos (`P14` E2) y que el comité redacte cada hallazgo.
- **Qué lo cierra:** revisión humana de las 558 guías ligadas a una prueba (`translation_origin = reviewed`), la plantilla de siete campos y, si el comité la quiere, la redacción propia de Monkey por hallazgo. Mientras tanto, solo hay traducción para los checks ligados a una prueba; el resto sale en inglés.

### DT-72 · El vencimiento de una exclusión no deja evento de cumplimiento

🟡 Mejora

- **Qué está parchado:** una exclusión aprobada «vence» solo al leerse (`is_expired`, y el activo vuelve a contar), pero nada escribe el `compliance_events` de ese cambio. `compliance-audit.md` pide el evento al aprobar **o vencer**; hoy solo se escribe al aprobar.
- **Por qué:** no hay un proceso periódico en el Backend (el trabajador de nube solo ejecuta pruebas); MD-144 se construyó sin él.
- **Qué lo cierra:** un proceso diario que marque las exclusiones que acaban de vencer y escriba su evento (con idempotencia: una vez por exclusión) —y que, si el vencimiento mueve el estado de un control, deje también su evento `control.state` (D91, `DT-79`)—, o decidir que el vencimiento derivado basta y quitarlo del contrato. Se decide al tener el período del servicio (`P26`). Ticket: MD-171.

### DT-73 · `evaluations.result` no distingue `error` ni `excluded`

🟡 Mejora

- **Qué está parchado:** el enum `evaluation_result` de la base tiene `compliant`, `non_compliant`, `pending` y `not_applicable`, pero D68 dice que un resultado también puede ser `error` y `excluded`. `excluded` se resuelve **al leer**, superponiendo las exclusiones aprobadas y vigentes al último resultado de cada activo (`control.prisma.repository.ts`); un fallo de la sonda todavía no se guarda como `error`.
- **Por qué:** MD-144 necesitaba el efecto de una exclusión sin reescribir el histórico inmutable de evaluaciones.
- **Qué lo cierra:** ampliar el enum con `error` y `excluded` cuando se persista el resultado de la sonda con el reintento de D76; la superposición en lectura se queda para las exclusiones que cambian después de la evaluación. Ticket: MD-171.

### DT-74 · La exclusión de un check no tiene endpoint

🟡 Mejora

- **Qué está parchado:** la tabla `exclusions` admite excluir un check (`excluded_check_id`, con `asset_id` nulo), pero el contrato y la API solo exponen la exclusión de **un activo en un test**. MD-144 decía «activo, test o check».
- **Por qué:** el contrato (`compliance-audit.md`) solo define la del activo, y `excluded_check_id` es un texto libre sin catálogo contra el que validarlo.
- **Qué lo cierra:** decidir cómo se identifica un check dentro de un servicio, ampliar el contrato y construir el endpoint con las mismas reglas (MD-170). Excluir un test completo no es una exclusión: se hace desactivándolo (D68).

## Funcionalidad que el brain menciona y aún no tiene contrato

### DT-25 · Ver el catálogo maestro SOC 2 en Monkey Admin y poder crear un control, riesgo o causa nuevos

🟠 Importante

- **Qué:** El principio está en `modelo-datos.md` §3 y D9/D31, pero no hay contrato, pantallas ni épico
- **Nota:** Primero un contrato en `contracts/modules/` (qué campos, cómo se vincula un control nuevo, cuándo se publica la versión, A4)

### DT-79 · Solo algunas escrituras dejan el evento de cambio de estado de un control

🟠 Importante

- **Qué está parchado:** el evento `control.state` (D91) lo escriben el veredicto de un test manual, la entrega y la revisión de una evidencia, aprobar una exclusión y lo que mide la sonda. **No lo escriben** otras escrituras que también pueden mover el estado de un control: conectar, dar de baja o reactivar un activo (cambia el universo de sus pruebas), desactivar un test, dar de baja un control o decidir un cambio de control (MD-156, aún sin construir), y el **vencimiento** de una exclusión, que se deriva al leer (`DT-72`).
- **Por qué:** cada escritura tiene que tomar la foto de antes y llamar a `recordControlStateChanges`; se cableó en las que el ticket construía. Los activos viven en otra feature (`technical-control`) y el vencimiento no tiene un proceso que lo escriba.
- **Qué lo cierra:** llamar al mismo registrador desde cada una de esas escrituras (con su causa) y, para el vencimiento, el proceso diario de `DT-72`. Mientras tanto el historial de un control puede omitir un cambio causado por una de ellas; el estado que se muestra siempre es el correcto porque se deriva.

### DT-80 · El veredicto manual usa el tipo de la dimensión del control

🟡 Mejora

- **Qué está parchado:** `catalog.tests.type` es texto libre del comité («Manual», «Mixta», «Prueba de diseño…»), así que no sirve para saber si una prueba la resuelve una persona. El veredicto (MD-155) usa el tipo de la **dimensión del control** (`client_control_dimensions.type`): `manual` y `technical_manual` admiten veredicto; `automated` e `hybrid`, no (`409 TEST_NOT_MANUAL`). *(La otra mitad de esta deuda, exigir la razón cuando el control de origen tiene observaciones abiertas, la cerró MD-154: `422 closure_reason.required`.)*
- **Por qué:** es el único dato estructurado que distingue lo manual de lo medido.
- **Qué lo cierra:** que el comité clasifique cada prueba como manual o automática (o fijar el criterio y normalizar `tests.type`).

### DT-82 · La lista de servicios lee cada servicio por separado y solo aguanta porque se alargó el tiempo de la transacción

🟠 Importante

- **Qué está parchado:** `GET /v1/services` lee los servicios de uno en uno dentro de una sola transacción, y cada lectura son varias consultas seguidas (criterios, marcos, proveedores, conexiones y dos conteos). Contra la base remota (~100 ms por consulta) unos cuantos servicios pasaban de los 5 s de Prisma y la lista (y el detalle) respondían 500 con `P2028`. Se subió el límite de esas dos lecturas a 30 s.
- **Por qué:** es lo mínimo que lo arregla sin reescribir la lectura; el costo crece con el número de servicios y con la latencia a la base.
- **Qué lo cierra:** leer la página entera en pocas consultas (los conteos de requisitos y controles con un `groupBy` para todos los servicios de la página, y las relaciones con un solo `findMany`), de modo que el tiempo no dependa de cuántos servicios haya. Al cerrarla, bórrese esta entrada y `READ_TRANSACTION`.

### DT-83 · Falta el aviso a los `admin_monkey` de que una empresa está por borrarse

🟠 Importante

- **Qué está parchado:** archivar y borrar una empresa (D97) exige avisar a todos los `admin_monkey`, al menos 3 días antes, por correo y por notificación en la app. Ni el correo (MD-69) ni las notificaciones existen. El aviso es informativo y no condiciona el borrado: archivar, reactivar y la purga al vencer funcionan de punta a punta; mientras tanto Monkey Admin muestra en el listado de archivadas la fecha de borrado y los días que faltan.
- **Por qué:** el sistema de correos y de notificaciones es una funcionalidad aparte, que no bloquea el resto.
- **Qué lo cierra:** construir el correo y las notificaciones en la app, enviarlos a todos los `admin_monkey` al menos 3 días antes del vencimiento, sin tocar la purga.

### DT-84 · El respaldo con rotación a 35 días solo existe como script de staging, y nada comprueba que corra

🟠 Importante

- **Qué está parchado:** D97 y D72 prometen que los respaldos generales rotan y que los datos de una empresa borrada desaparecen de ellos en máximo 35 días. Hoy solo existe `scripts/deploy/backup-staging.sh` (`pg_dump` nocturno a MinIO, expira a 30 días, deja 7 copias en la VPS). Que se ejecute cada noche no se verifica desde el repo, ninguna prueba lo ejecuta y para producción no hay nada construido.
- **Por qué:** es lo mínimo para tener respaldo en staging mientras se construye producción; la promesa de D97 (y el texto de términos del servicio que la repite) depende de esto, por eso no es una mejora.
- **Qué lo cierra:** programar el respaldo de staging y avisar si una noche falla; construir en producción el respaldo con recuperación a un punto en el tiempo y rotación de 35 días como máximo; y dejar una comprobación que falle si el respaldo más reciente tiene más de un día o el más antiguo pasa de 35. Al cerrarla, SEG-35 pasa a ✅ y se borra esta entrada.

### DT-85 · La clave de acceso viaja en claro por un servicio de correo externo y el resultado del envío no se guarda

🟠 Importante

- **Qué está parchado:** D99 envía la clave al `admin_email` por correo. (1) El mensaje lleva la clave en claro y pasa por el servicio de correo y por el buzón del cliente: es el canal de entrega, pero la clave es de un solo uso y vence a los 7 días, no más fuerte que eso. (2) El envío es directo, sin cola ni reintentos: si el servicio falla, `admin_monkey` ve «no se pudo enviar» y reenvía a mano. (3) `delivery_status` solo viaja en la respuesta; el listado de empresas no muestra que el último envío falló.
- **Por qué:** es lo mínimo para cerrar MD-69 sin construir un sistema de notificaciones.
- **Qué lo cierra:** una cola de envíos con reintentos y su estado guardado, la clave entregada como enlace de un solo uso en vez de texto, y el estado del último envío en el listado. Entra junto con DT-83 (aviso de borrado) cuando exista el sistema de correo y notificaciones.

