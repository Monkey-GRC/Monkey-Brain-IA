# Deuda técnica — Cumplimiento

Parches vigentes de [Cumplimiento](../arquitectura/cumplimiento/README.md). Tablero y reglas: [`README.md`](README.md).

## Transversal

### DT-114 · Las pruebas manuales y la aprobación del control usan la evidencia v1 mientras no existan la gestión ni Documentos

🟠 Importante

- **Qué está parchado:** el motor v2 (MD-498) decide las pruebas manuales (documental, población, operativa y técnica manual) con la evidencia que se sube hoy para esa prueba (`evidence_requirements` y la combinación de sus revisiones): validada → Correcto, rechazada → Excepción, sin entrega o sin revisar → Pendiente, fuera de su ventana → Vencido. En las pruebas manuales no documentales también decide un veredicto aprobado (D85, D121), para no romper el endpoint de veredictos. Y en el marco y la categoría un control cuenta como cumplido con nivel Adecuado o Sólido, sin el estado «Cumplimiento aprobado» que exige §9
- **Por qué:** el resultado de una prueba manual lo registra el responsable (D140) dentro de la gestión del control (RC-07), y la prueba documental se decide con el módulo Documentos (RC-09, T-01); ninguno existe todavía. Sin el puente, todas las pruebas manuales quedarían Pendientes y ningún control avanzaría (decidido con Rod el 2026-11-23)
- **Qué lo cierra:** MD-504 (gestión y aprobación del control: el rollup cuenta solo «Cumplimiento aprobado») y MD-506 (Documentos: T-01 con el documento vigente, aprobado y aceptado)

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

- **Qué está parchado:** `catalog.tests.type` es texto libre del comité («Manual», «Mixta», «Prueba de diseño…»), así que no sirve para saber si una prueba la resuelve una persona. El veredicto (MD-155) usa el tipo de la **dimensión del control** (`client_control_dimensions.type`): `manual` y `technical_manual` admiten veredicto; `automated` e `hybrid`, no (`409 TEST_NOT_MANUAL`). *(La otra mitad de esta deuda, exigir la razón cuando el control de origen tiene observaciones abiertas, la cerró MD-154: `422 closure_reason.required`.)*
- **Por qué:** es el único dato estructurado que distingue lo manual de lo medido.
- **Qué lo cierra:** la carga del catálogo v2 (RC-01): cada prueba de la VF18 trae su tipo (documental, población, operativo o técnico) y su automatización (D129).
