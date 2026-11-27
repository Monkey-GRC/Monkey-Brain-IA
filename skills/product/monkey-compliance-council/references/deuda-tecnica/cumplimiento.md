# Deuda técnica — Cumplimiento

Parches vigentes de [Cumplimiento](../arquitectura/cumplimiento/README.md). Tablero y reglas: [`README.md`](README.md).

## Transversal

### DT-114 · La prueba documental y el documento base usan la evidencia subida mientras no exista Documentos

🟠 Importante

- **Qué está parchado:** el motor v2 decide la prueba documental con la evidencia que se sube hoy para ella (cuenta si no fue devuelta, D132) y toma las pruebas documentales del control como el «documento base» de R2
- **Por qué:** la prueba documental se decide con el módulo Documentos (RC-09, T-01); sin él esa regla no se puede cumplir como la pide el libro
- **Qué lo cierra:** MD-506 (Documentos: T-01 y R2 con el documento vigente, aprobado y aceptado). *(MD-504 cerró el resultado de la prueba manual y el rollup; MD-529 cerró el plan de remediación por excepción, Parcial y R5.)*

### DT-71 · La lectura de controles fija valores que el modelo ya prevé

🟠 Importante

- **Qué está parchado:** `ControlPrismaRepository` marca todo test vinculado a un control como obligatorio y vigente, porque `client_control_tests` aún no guarda esos datos (D68). *(2026-10-22, D88: la parte documental —un test documental fijo en pendiente— ya no está parchada; sale de la revisión de las evidencias.)*
- **Por qué:** MD-117 se construyó antes que la desactivación controlada de tests. *(2026-10-14: MD-118 y MD-150 ya reemplazaron los valores fijos de `approval` y `has_pending_change`.)*
- **Qué lo cierra:** la migración de `client_control_tests` (obligatorio, vigente, fechas) con la desactivación controlada. Reemplaza su valor fijo en `control.prisma.repository.ts` y `control-readout.ts`

### DT-72 · El vencimiento de una exclusión no deja evento de cumplimiento

🟡 Mejora

- **Qué está parchado:** una exclusión aprobada «vence» solo al leerse (`is_expired`, y el activo vuelve a contar), pero nada escribe el `compliance_events` de ese cambio. `contracts/cumplimiento/exclusiones.md` pide el evento al aprobar **o vencer**; hoy solo se escribe al aprobar.
- **Por qué:** no hay un proceso periódico en el Backend (el trabajador de nube solo ejecuta pruebas); MD-144 se construyó sin él.
- **Qué lo cierra:** un proceso diario que marque las exclusiones que acaban de vencer y escriba su evento (con idempotencia: una vez por exclusión) —y que, si el vencimiento mueve el estado de un control, deje también su evento `control.state` (D91, `DT-79`)—, o decidir que el vencimiento derivado basta y quitarlo del contrato. Se decide al tener el período del servicio (D145). Ticket: MD-171.

### DT-73 · `evaluations.result` no distingue `error` ni `excluded`

🟡 Mejora

- **Qué está parchado:** el enum `evaluation_result` de la base tiene `compliant`, `non_compliant`, `pending` y `not_applicable`, pero D68 dice que un resultado también puede ser `error` y `excluded`. `excluded` se resuelve **al leer**, superponiendo las exclusiones aprobadas y vigentes al último resultado de cada activo (`control.prisma.repository.ts`); un fallo de la sonda todavía no se guarda como `error`.
- **Por qué:** MD-144 necesitaba el efecto de una exclusión sin reescribir el histórico inmutable de evaluaciones.
- **Qué lo cierra:** ampliar el enum con `error` y `excluded` cuando se persista el resultado de la sonda con el reintento de D76; la superposición en lectura se queda para las exclusiones que cambian después de la evaluación. Ticket: MD-171.

### DT-74 · La exclusión de un check no tiene endpoint

🟡 Mejora

- **Qué está parchado:** la tabla `exclusions` admite excluir un check (`excluded_check_id`, con `asset_id` nulo), pero el contrato y la API solo exponen la exclusión de **un activo en un test**. MD-144 decía «activo, test o check».
- **Por qué:** el contrato (`contracts/cumplimiento/README.md`) solo define la del activo, y `excluded_check_id` es un texto libre sin catálogo contra el que validarlo.
- **Qué lo cierra:** decidir cómo se identifica un check dentro de un servicio, ampliar el contrato y construir el endpoint con las mismas reglas (MD-170). Excluir un test completo no es una exclusión: se hace desactivándolo (D68).

### DT-76 · Las plantillas de evidencia del catálogo no dicen a qué prueba sirve cada documento, y el estado documental por control se apartó de RN-13

🟠 Importante

- **Qué está parchado:** las 89 asignaciones control↔documento del Excel no dicen a qué prueba sirve cada documento, así que llegan con `test_id` nulo (D88): se muestran como **sugerencia** y **no cuentan para ninguna prueba**; la evidencia que sí cuenta es la que la persona sube bajo cada prueba. Además D88 calcula una prueba documental **por control** (revisión de lo entregado para ella), lo que se aparta de RN-13 y del punto 1 de D85, que el comité fijó por prueba y servicio.
- **Por qué:** el Excel no trae ese vínculo y un documento distinto en cada control no se puede validar una sola vez para todo el servicio; desarrollo lo decidió con autorización del responsable de producto (2026-10-22).
- **Qué lo cierra:** la carga del catálogo v2 (RC-01) y el módulo Documentos (RC-09): la VF18 trae una prueba documental por documento y el documento se resuelve con su flujo, así que las plantillas de evidencia desaparecen (D129, D133).

## Funcionalidad que el brain menciona y aún no tiene contrato

### DT-80 · El veredicto manual usa el tipo de la dimensión del control

🟡 Mejora

- **Qué está parchado:** `catalog.tests.type` es texto libre del comité («Manual», «Mixta», «Prueba de diseño…»), así que no sirve para saber si una prueba la resuelve una persona. El veredicto (MD-155; retirado en MD-504, hoy solo «Mi trabajo» lo usa en `workPieceOf`) usaba el tipo de la **dimensión del control** (`client_control_dimensions.type`): `manual` y `technical_manual` admiten veredicto; `automated` e `hybrid`, no (`409 TEST_NOT_MANUAL`). *(La otra mitad de esta deuda, exigir la razón cuando el control de origen tiene observaciones abiertas, la cerró MD-154: `422 closure_reason.required`.)*
- **Por qué:** es el único dato estructurado que distingue lo manual de lo medido.
- **Qué lo cierra:** la carga del catálogo v2 (RC-01): cada prueba de la VF18 trae su tipo (documental, población, operativo o técnico) y su automatización (D129).


### DT-116 · La vista del período da por cubiertos los vínculos de módulo, las dependencias y la anual

🟠 Importante

- **Qué está parchado:** la vista del período (R6, `technical.period`, MD-500) da por cubiertas en las ventanas pasadas dos piezas que no tienen historial: los vínculos de módulo o puntaje (D141, D146) y las dependencias (T-06). Y la periodicidad anual no se enumera, porque su ventana depende de la última evidencia. *(MD-529 cerró la parte manual: ahora lee cada resultado de `manual_test_results` por ventana.)*
- **Por qué:** el estado de los módulos y el de las dependencias solo existe como dato actual
- **Qué lo cierra:** MD-497 (historial de módulos y puntajes por integración); la anual, cuando se enumere desde la primera evidencia del período

### DT-117 · Un servicio con varios marcos se evalúa con un solo período

🟡 Mejora

- **Qué está parchado:** el motor toma, para todo el servicio, el período abierto que termina más tarde, aunque cada marco contratado tenga el suyo
- **Por qué:** hoy solo se vende SOC 2 (D145) y un control del cliente no pertenece a un solo marco
- **Qué lo cierra:** cuando un servicio contrate un segundo marco, evaluar la vista del período por marco, cada uno con su período (`service_framework_periods`)

### DT-118 · El detalle no da el resultado por activos de cada check Directo

🟡 Mejora

- **Qué está parchado:** el detalle técnico del control (`check_links[]`, MD-499) muestra el rol y el título de cada check, pero el resultado por activos solo a nivel de la prueba (`checks`, `asset_coverage`); un Complementario trae `failing_assets`
- **Por qué:** el motor guarda un resultado por prueba y activo para todos los Directos juntos; Rod pidió «solo lo exacto» (2026-11-24) antes que repetir el mismo conteo en cada check
- **Qué lo cierra:** guardar el resultado de cada check por activo y exponerlo en `check_links[]`


### DT-122 · La subida de respaldo de las pruebas de integración usa un puerto sin implementar

🟡 Mejora

- **Qué está parchado:** `IntegrationConnections` está enlazado a `NoIntegrationConnections`, que no da ninguna categoría conectada; por eso toda prueba de fuente `integration` acepta subida de respaldo (`evidence_fallback: true`)
- **Por qué:** las integraciones (MD-497) no están construidas; el respaldo se calcula y no guarda nada, así que no hay que migrar al conectarlas
- **Qué lo cierra:** MD-497: implementar el puerto leyendo las conexiones activas por categoría, fuera de la transacción de la bandeja

### DT-125 · La prueba documental T-DOC sigue resolviéndose con la evidencia subida

🟡 Mejora

- **Qué está parchado:** con el corte mínimo de Documentos (D152) un documento ya se publica y se acepta, pero el motor sigue resolviendo la `T-DOC` del control con la evidencia subida por el puente de D139, no con la versión vigente y la aceptación del personal (T-01, PR-15)
- **Por qué:** el flujo de aprobación y la regla de aceptación completos son de MD-506; el corte mínimo es para mostrar al colaborador
- **Qué lo cierra:** MD-506: `T-DOC` en el motor con la versión vigente aprobada y la aceptación dentro de PR-14/PR-15

### DT-127 · `common/catalogs` importa del dominio de la feature de cumplimiento

🟡 Mejora

- **Qué está parchado:** `Backend/src/common/catalogs/compliance-catalogs.ts:32` importa de `features/compliance/domain/…`: `common` depende de una feature, al revés de la dirección permitida por capas
- **Por qué:** Preexistente; lo vio `architecture-reviewer` en MD-508, que no toca ese archivo
- **Qué lo cierra:** Mover a `common` los valores que el catálogo necesita (o servir el catálogo desde la feature) y que `common` no importe de ninguna feature

### DT-129 · Aprobar o registrar un resultado lee el servicio completo dos veces

🟡 Mejora

- **Qué está parchado:** `POST /v1/controls/{id}/approval` y `POST …/tests/{t}/result` leen la foto completa del servicio bajo el candado (antes) y otra vez después, para el diff de estado y los avisos. Una aprobación tarda ~420 ms y un rechazo con `409` ~200 ms, medidos en e2e (MD-504). Antes del ajuste el `409` salía en ~43 ms.
- **Por qué:** el diff de estado (D91) y la invalidación de aprobaciones necesitan el estado del control antes y después en la misma transacción; optimizarlo no era del núcleo de MD-504.
- **Qué lo cierra:** leer solo el control afectado en los rechazos y en la foto «después» (o derivar el «después» de la foto «antes» y la escritura), medido antes y después, dentro de la meta de rendimiento de la API.

### DT-130 · La bandeja «Por aprobar» del admin_empresa carga todos los servicios y pagina en memoria

🟡 Mejora

- **Qué está parchado:** `GET /v1/me/work` para el `admin_empresa` (MD-529, `listAdminApprovals`) lee la foto completa de TODOS los servicios de la empresa (`AssignmentRepository.load`), calcula el motor de cada control, filtra los que tienen algo por decidir y pagina el resultado en memoria. Medido en una empresa de prueba con 1 servicio y 95 controles: 47 viajes a la base por petición y 21 tras agrupar las relaciones con `relationJoins` y validar la sesión en un solo viaje (con 85 ms por viaje, de unos 4 s a 1,8 s). El número ya no crece con los controles de un servicio, pero sí con los servicios (cada uno se calcula completo) y la página se pagina en memoria
- **Por qué:** lo que le toca decidir al administrador (nivel, plan, «No aplica», aprobación) sale del motor y de las solicitudes pendientes; no hay una consulta que lo dé sin calcular el servicio. MD-529 priorizó la pantalla sobre el costo
- **Qué lo cierra:** una consulta previa que liste los controles con una solicitud pendiente o una aprobación esperando (`control_level_overrides`, `remediation_plans`, `requirement_applicability_requests`, `control_approvals`) y calcular el motor solo de esos controles; medido antes y después. Ticket sugerido: MD-222 (rendimiento de la API)

### DT-131 · Registrar una ocurrencia no es idempotente

🟡 Mejora

- **Qué está parchado:** `POST /v1/controls/{id}/requirements/{rid}/occurrences` (MD-529) crea una fila por cada petición: un reintento de la red o un doble clic registra la misma ocurrencia dos veces, y cada una pide su evidencia. No hay clave natural ni cabecera de idempotencia en el contrato
- **Por qué:** una ocurrencia no tiene un identificador del mundo real (dos altas de proveedor el mismo día son dos); la convención de idempotencia de `conventions.md` no cubre este alta y no se inventó una cabecera sin contrato
- **Qué lo cierra:** acordar en `conventions.md` una cabecera de idempotencia para las altas (o una clave natural opcional `external_ref` única por requisito) y aplicarla aquí

