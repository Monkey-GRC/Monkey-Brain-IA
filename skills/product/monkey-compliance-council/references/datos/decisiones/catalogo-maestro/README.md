# Decisiones — Catálogo maestro

Por qué Catálogo maestro es como es. **Se consulta para reabrir, no para construir**: lo vigente está en [`arquitectura/catalogo-maestro/`](../../../arquitectura/catalogo-maestro/README.md) y en `datos/modelo/`. Índice de todas las decisiones: [`README.md`](../README.md).

## Por componente

| # | Componente | Decisiones |
|---|---|---|
| 9.1 | [Marcos](marcos.md) | `D37` · `D50` |

## Del módulo entero

## D26 · Tipos enum en `snake_case`

**Decisión:** los 41 tipos enum de Postgres se renombran de `"UserRole"` a `user_role`
(`@@map` en Prisma + `ALTER TYPE … RENAME`). Sin comillas dobles en SQL a mano. El cliente
generado no cambia. Cierra lo que estaba abierto en la bitácora de la reconstrucción (§9).

**Por qué:** la convención de identificadores del modelo es `snake_case` sin excepción, y las tablas
estaban vacías: es el momento más barato, antes de que haya seeds y funciones escritas a mano.


---

## D28 · Riesgos y causas: plantilla en el catálogo, copia por cliente

**Decisión:** el catálogo (`risks`, `causes`) es solo plantilla. Al contratar un marco se copian a
`client_risks` y `client_causes` del servicio, junto con sus relaciones (`client_risk_causes`,
`client_cause_controls`). `mitigations`, `residual_risks` y `risk_treatments` apuntan a la copia
del cliente. `service_risks` desaparece (`client_risks` ya lleva el servicio).

**Por qué:** §3.5 y §7.2 dicen que el cliente crea, edita y elimina sus riesgos y causas, pero las
tablas apuntaban directo al catálogo global: editar habría cambiado el riesgo de todos los
clientes. Lo que un cliente cambia solo lo ve él.


---

## D32 · Las `N:M` de dominios de monitoreo, explícitas

**Decisión:** `monitoring_domains ↔ requirements` y `monitoring_domains ↔ automated_capabilities`
son tablas puente propias (`monitoring_domain_requirements`, `monitoring_domain_capabilities`).
`automated_capabilities` pierde su `monitoring_domain_id`.

**Por qué:** el modelo dibuja las dos como `N:M`; la migración había hecho la segunda `1:N` y la
primera con una tabla implícita de Prisma (`_MonitoringDomainToRequirement`, columnas `A`/`B`, sin
`id`) que rompe la convención de tablas puente.


---

## D34 · Los enums que estaban como texto, cerrados

**Decisión:** los 16 campos que el schema tenía como `String` con un `TODO` pasan a enum, con los
valores de `contracts/enums.md` («Catálogo, cumplimiento y control técnico»): `frameworks.type`,
`policies.approval_status`, `checks.mapping_confidence`, `service_frameworks.status`,
`assets.type/criticality/origin/status`, `asset_provisionings.connection_status`,
`action_plans.status`, `residual_risks.residual_level`, `evidence_submissions.validation_status`,
`evaluations.origin`, `findings.severity`, `vulnerabilities.severity` y `executions.status`.
Los estados nacen con su valor inicial por defecto (`pending`, `active`).

**Excepción:** `tests.type` se queda como texto libre, porque en la hoja *Pruebas* del comité mezcla
`Manual`, `Mixta`, `Técnica` y 17 descripciones largas distintas; no hay un enum honesto que
extraer sin inventar.

**Por qué:** ni el Excel ni el modelo daban las opciones. Se tomaron de donde había fuente
(`origin: declared|discovered` y `connection_status: pending→validated` del contrato de activos;
`confirmed|high|medium|low` de `monkey-cis-sync`; los niveles 5×5 del Excel; CVSS para la severidad)
y, donde no, del flujo de negocio del propio modelo (conectar → validar → activar → programar;
solo `admin_empresa` aprueba evidencia). Un enum cerrado impide que un estado mal escrito rompa un
filtro o el cálculo. Si el comité entrega otros valores, gana el comité y se cambian con una
migración sin pérdida de datos.

**Fuente:** decisión de Héctor, 2026-09-29.


---

## D35 · Siembra del catálogo de SOC 2 (MD-65): dominio del control, publicador opcional y estrategia

**Decisión:**
1. **El dominio pasa de `requirements` a `controls`** (`controls.domain`, 27 valores literales). Se
   elimina `requirements.domain`.
2. **`catalog_versions.published_by` es opcional.** La versión 1 la publica un script, sin usuario
   humano, y lo dice en `change_summary`. No se crean usuarios ni empresas falsas.
3. **Se siembran 119 controles**, incluido CPL-1 ("Descripción del Sistema"), que queda sin puntos de
   enfoque (en el producto lo cubre `system_descriptions`). Son **729 relaciones**, no 658.
4. **Estrategia:** el Excel se convierte a un JSON versionado (`prisma/seed/data/soc2-catalog.json` (v1; borrado en MD-491, hoy `catalog-v2.json`),
   con el sha256 del archivo de origen); el seed lee ese JSON. Valida antes de escribir, inserta en una
   sola transacción, **solo agrega lo que falta**, aborta con diff si una fila existente difiere y no
   borra nada. Un cambio al catálogo entra por una versión nueva (A4/D33), no por recarga.

**Por qué:** al perfilar el Excel, `Dominio` varía dentro del mismo requisito en 41 de 61 (es atributo del
control) y `requirements.domain`, obligatorio, no tenía fuente. La cifra de 658 relaciones del ticket
MD-65 sale de la hoja `Resumen`, que el propio modelo ya documenta como desactualizada: los datos crudos
traen 729. Y la FK obligatoria `published_by → users` habría exigido crear un usuario solo para poder
sembrar. Un JSON versionado permite reproducir la carga sin tener el Excel (que está en `.gitignore`) y
deja trazable de qué archivo salió.

**Fuente:** `assets/TSC INTERGRAL SOC 2 DETALLADO VF.xlsx`, hojas *Controles Monkey* y *Tabla controles
SOC 2*. Decisión de Héctor, 2026-09-30.


---

## D36 · Controles del cliente completos, clonado y plantillas de evidencia

> **Ajustada por D129 (2026-11-22).** Las plantillas de evidencia se reemplazan por los documentos y los requisitos del control del catálogo v2.

**Decisión** (precisa D3, D28 y D30):
1. **El cliente crea, edita y elimina controles**, así que todo lo que se mide cuelga de
   `client_controls`: `evaluations` y `evidence_requirements` apuntan a `client_control_id`, no al control
   del catálogo. `client_controls.control_id` es opcional (plantilla de origen; nulo en un control propio).
2. **Eliminar es dar de baja**: `is_active` en `client_controls` y `client_causes` (`client_risks` ya lo
   tenía). Las evaluaciones son inmutables y las FK son `RESTRICT`.
3. **Único `(service_id, control_id)`** en `client_controls`: el clonado es idempotente (MD-80).
4. **Se clonan** las dimensiones (`client_control_dimensions`) y el **vínculo** control ↔ test
   (`client_control_tests`). **No se clonan** los tests (se referencian) ni `control_measurements` (D2).
5. **Plantillas de evidencia** en el catálogo (`evidence_templates`, `control_evidence_templates`), de donde
   se clonan las `evidence_requirements` de cada control del cliente.

**Por qué:** con `control_id` obligatorio y las evaluaciones colgadas del catálogo, un control propio no se
podía evaluar ni pedirle evidencia, aunque la matriz de permisos deja a `admin_empresa` crearlos. Los tests
son 61 procedimientos que el cliente no edita: copiarlos solo los duplica por cliente, pero el vínculo sí es
suyo (A4 exige aceptación para cambiar los tests de un control, lo que presupone esa copia). D2 fija el peso
lineal sin configuración, así que una fila de `control_measurements` sería un dato muerto. Las plantillas de
evidencia salen del Excel: 89 vínculos entre 67 de los 119 controles y 50 documentos distintos (la
hoja *Tabla controles SOC 2*, "Documentos vinculados"); antes `evidence_requirements` se decía clonable pero no
existía de dónde. La dimensión de esas plantillas es `policy`: el Excel no la trae y son documentos.

Un control propio no tiene punto de enfoque, así que no cierra ningún requisito del marco; cuenta para el porcentaje de su categoría (D65).

**Fuente:** decisión de Héctor, 2026-09-30.


---

## D38 · El dato real manda: cómo se siembra y qué se encontró

**Regla:** las cifras de cualquier documento, ticket o resumen se comprueban contra los datos crudos de las
hojas; si difieren, **vale lo medido** y el documento se corrige. El seed fija esas cifras medidas (si el
Excel cambia, la extracción falla hasta que se actualicen de forma consciente) y deja constancia en
`catalog_versions.change_summary` de lo que el archivo dice y los datos no confirman. **No se adivina ni se
infiere nada**: lo que no tiene fuente no se siembra y pasa a pendiente.

**Lo medido contra lo que decían los documentos:**

| Dato | Decía | Hay |
|---|---|---|
| Relaciones punto de enfoque ↔ control | 658 (hoja *Resumen*) | **729** |
| Controles del catálogo | 118 | **119** (118 asignados + CPL-1, Descripción del Sistema) |
| Asignaciones control ↔ prueba | 228 | **284** en la hoja *Pruebas*; la matriz trae 248, de las que 27 citan pruebas inexistentes |
| Documentos vinculados a controles | 88 | **89** vínculos, **50** documentos distintos, en 67 controles |
| Políticas vinculadas | 16 | 16 vínculos a **10** políticas distintas (se siembran como plantillas en D39) |
| Controles a los que sirve `T-DOC-001` | "más de 30" | **103** |
| Pruebas con checks automáticos · checks · políticas SCA · plataformas · referencias de mapeo | 13 · 11.352 · 77 · 18 · 20 | confirmados: **13 · 11.352 · 77 · 18 · 20** |

**Correcciones al schema que salen de los datos** (migración `catalog_seed_and_client_controls`):
`tests.population_size` y `tests.suggested_sample_size` pasan de entero a **texto** (en el Excel son frases);
se agrega `tests.exceptions` (la hoja trae *Excepciones/Desviaciones* y *Tratamiento de excepciones*, el schema
solo guardaba una); el dominio pasa al control (D35).

**Decisiones de siembra:**
- **Asignaciones control ↔ prueba:** se usa la hoja *Pruebas* (284: cubre 61/61 pruebas y 118/118 controles y
  contiene las 221 resolubles de la matriz). Las 6 pruebas `T-APP-001…006` de la matriz **no se equiparan** con
  `T-SRV-011…014` y `T-BD-009/010`, aunque coinciden en 94-100% de sus controles: es una pregunta del comité (P9).
- **Causas:** se cargan las 56; 10 no pertenecen a ningún riesgo en la hoja y se cargan sin asociar (P9).
- **Plantillas de evidencia:** el código es `DOC-` + hash del texto normalizado, no un consecutivo, para que
  agregar un documento no renumere los demás (las evidencias del cliente guardan ese código en `source_ref`).
- **`control_measurements` no se siembra** (sin uso en el MVP, D2). `control_dimensions` y `policies` no se
  sembraron aquí por falta de fuente (P10); se resuelven en D39.
- **Pruebas en texto:** el paso a paso y los atributos se guardan como listas separadas por su numeración
  (`1.`/`1)`) o sus viñetas; si una prueba no trae numeración 1, 2, 3… la extracción falla en vez de adivinar.

**Fuente:** perfilado de `TSC INTERGRAL SOC 2 DETALLADO VF.xlsx` del 2026-09-30. Decisión de Héctor.


---

## D39 · Dimensiones por control y políticas del catálogo (cierra P10)

> **Reemplazada por D129 (2026-11-22).** Las nueve dimensiones vienen explícitas por control en la VF18, el tipo es del control y `policies` se reemplaza por los documentos.

**Decisión:**
1. **Una dimensión aplica a un control si el control tiene al menos una prueba de esa dimensión.** Se deriva de
   *Pruebas*; no hay una lista aparte. Salen **210 filas** de `control_dimensions`: 118 documentales, 43 de
   servidores, 18 de BD, 31 de nube y **0 de aplicación** (no hay pruebas T-APP: P9). CPL-1 no tiene.
2. **El tipo** sale del tipo de sus pruebas en esa dimensión: documentales → `manual` (§2: revisión documental);
   `Manual` → `manual`; `Mixta` o "automatizado + manual" → `hybrid`; `Técnica` → `technical_manual` (D4);
   "automatizado" a secas → `automated`. Si las pruebas de una misma dimensión no coinciden → `hybrid`. Un
   texto que no reconoce **falla la extracción** en vez de adivinar.
3. **Las banderas**: `requires_probe` = la dimensión no es documental y el tipo es `automated` o `hybrid`;
   `requires_ai` = solo la documental; `requires_compliance_confirmation` = todo menos `automated` (R-03: en lo
   manual valida el `admin_empresa`; la IA no certifica).
4. **`policies` es una plantilla del catálogo: solo `name`** (único). `approval_status`, `valid_until` y `version`
   se eliminan: aprobar una política, hasta cuándo vale y qué versión es son estado **del cliente** y viven en la
   evidencia que él entrega. Se siembran las 10 políticas y los 16 vínculos; `control_policies` gana
   `requires_employee_acceptance` porque el Excel distingue "aprobación de la política" de "… y la aceptación
   del empleado".
5. Se siembran dentro de la versión 1 del catálogo, sin versión nueva: ningún cliente había clonado nada.

**Por qué:** sin dimensiones no se puede clonar `client_control_dimensions` (MD-80) ni aplicar el gate de §2, y el
modelo exige que cada control declare dónde se evalúa. Derivarlas de las pruebas deja una sola fuente de verdad: si
el comité cambia las pruebas de un control, sus dimensiones cambian con ellas. Una política global no puede estar
"aprobada": la aprobó (o no) cada empresa.

**Qué queda por ratificar:** el punto 1 es la propuesta que ya figuraba en P10. **Los puntos 2 y 3 (tipo y
banderas) los derivó desarrollo** y no vienen del Excel: se aplican para no bloquear el clonado y se ratifican con
el comité (igual que D30). Si el comité define otra cosa, se corrige con una versión nueva del catálogo.

> **Ajustada por D68 (2026-10-10).** Qué dimensiones exige un control las define el comité en `Controles Monkey` (columnas L a P), no se derivan de las pruebas; una exigida que se quede sin test vigente deja el control `INCOMPLETO`. Las cifras de esta decisión (210) no coinciden con esa hoja (`DT-69`).

**Fuente:** decisión de Héctor, 2026-10-01. Implementación: migración `catalog_policies_as_templates`;
`Backend/prisma/seed/` (`deriveControlDimensions`, `testKind`, `parsePolicyLine`).


---

## D40 · Reglas del clonado del catálogo al elegir marco (MD-80)

**Decisión** — lo que `modelo-datos.md` §3.5 y §6.2 no fijaban y el clonado necesitó:
1. **Qué controles son aplicables:** los que llegan por los puntos de enfoque de los requisitos del marco cuyo
   criterio de confianza contrató el servicio. Un control en dos requisitos se clona una vez. CPL-1 (sin punto de
   enfoque) no se clona: lo cubre `system_descriptions`. Un servicio **sin criterios contratados falla** con un
   error claro, no clona vacío.
2. **`own_code` = el código del catálogo** (`CAP-1`); los controles propios del cliente llevan su propia
   numeración (`C01`). **`client_interpretation` arranca con la descripción del catálogo** y `source_ref` =
   `vanta:<código>`.
3. **`client_controls.type` = el tipo común de sus dimensiones**, o `hybrid` si no coinciden (la misma regla de D39).
4. **Evidencias:** una `evidence_requirement` por plantilla, en el orden del comité, con `validity_within_period` =
   el periodo de evaluación del marco (C1), `dimension` = `policy` y responsable vacío (D30).
5. **Riesgos y causas: el set base completo (10 y 56), no solo lo aplicable** (D28); las aristas riesgo↔causa se
   copian todas y las causa→control **solo hacia controles que se clonaron**.
6. **Es idempotente y respeta la personalización:** lo que el servicio ya tiene (clonado antes, editado, dado de
   baja o propio) no se vuelve a crear, y **los hijos solo se crean para padres nuevos** — si el cliente quitó una
   evidencia de un control clonado, no reaparece. Al contratar otro criterio después se suma solo lo nuevo y se
   enlaza con lo que ya había.
7. **Corre dentro de la misma transacción que crea `service_frameworks`**, con el contexto de tenant ya fijado:
   contratar y clonar son todo o nada. El catálogo se clona contra la versión que ya guarda
   `service_frameworks.catalog_version_id`.

**Por qué:** sin estas reglas el clonado quedaba a criterio de quien lo escribiera, y 6 y 7 son las que protegen al
cliente: lo que personalizó no se pisa y un fallo no deja un servicio a medias. Medido contra SOC 2 sembrado: Seguridad
sola da 79 controles, 139 dimensiones, 194 vínculos con pruebas, 56 evidencias, 10 riesgos, 56 causas y 158 aristas
causa→control; sumar Disponibilidad agrega 6 controles.

**Fuente:** decisión de Héctor, 2026-10-01. Implementación: `Backend/src/features/onboarding/` y
`npm run clone:verify`.


---

## D82 · Cada prueba lleva, junto a su nombre neutro, una descripción corta que ve el cliente (2026-10-16)

**Decisión.** `tests` gana `display_description`: la descripción corta que el cliente ve bajo el nombre de la prueba, en la vista técnica de un control. Extiende D70 con la misma regla que el nombre: es el **objetivo del comité** (hoja «Pruebas», columna OBJETIVO DEL TEST) tal cual, y solo se reescribe cuando ese objetivo nombra al proveedor de la sonda. Hoy son las mismas 4 pruebas (`T-SRV-001`, `002`, `003` y `005`); las otras 57 copian el objetivo. Es nullable y se carga como dato (`catalog:load`), no en la migración.

**Por qué.** El nombre solo no le dice al administrador de la empresa de qué va cada prueba ni qué se le pide. El objetivo del comité ya lo explica en una o dos frases; no hace falta inventar texto nuevo.

**Lo que no cambia.** El resto de textos del comité (herramienta, limitaciones, paso a paso, criterio…) siguen sin salir (D70). La descripción no es el «por qué importa» (no hay ese dato en el material del comité; queda para después) ni la remediación.

**Qué cambia.** Columna `tests.display_description` (migración `20261016120000_test_display_description`), el seed (`display-names.ts`, validador `[confidencialidad]`, `catalog:load` y `catalog:verify`), el campo `display_description` en `technical.tests` de `contracts/cumplimiento/controles.md`, y `03-catalogo-maestro.md`. **Pendiente de operar:** aplicar la migración y correr `catalog:load` en cada entorno.

**Fuente:** Carlos Castaño, 2026-10-16.


---

## D128 · La VF18 es la fuente maestra y el catálogo v2; donde lo construido difiere, se adapta al libro (2026-11-22)

**Decisión.**

1. **`assets/TSC INTERGRAL SOC 2 DETALLADO VF18_DEV.xlsx` reemplaza a la VF2** como fuente maestra (§0). Es la **versión 2 del catálogo** y no tiene equivalencia de códigos con la v1 (DEV-02): los controles se renombraron, se fusionaron y se crearon nuevos. Los códigos del libro son claves de negocio estables y no se regeneran (DEV-03).
2. **Gana el libro.** Donde lo construido o una decisión anterior difiere, se hace como dice el libro y la decisión anterior se marca reemplazada, sin reabrir la discusión. Lo que el libro no define se mantiene como está (DEV-16). Solo se pregunta lo que el libro no define o donde se contradice a sí mismo (`P48` a `P50`).
3. **El modelo de evaluación es la hoja `MAP CALOR`** (secciones 2 a 14). Reemplaza como regla a las hojas `MODELO EVALUACIÓN MONKEY` y `REQUISITOS EVALUACIÓN MONKEY` de la VF2 (D68): sus reglas `RN-xx` y `REQ-xxx` valen solo donde no chocan con `MAP CALOR` (tabla 5 de `01_DESARROLLO`). El detalle está en §9 (D130).
4. **Datos de la v1: reset total del entorno de desarrollo.** Es la respuesta de desarrollo a DEV-02 («el desarrollo propone al comité cómo tratarlos antes de migrar»): las empresas que existen son de prueba, así que se **recrea la base** (migraciones, catálogo v2 y `admin_monkey` con el script de bootstrap) y se limpian, fuera de la base, los archivos de evidencia y los agentes de la sonda de esas empresas. Se hace **cuando el cargador del catálogo v2 esté listo** (RC-01), no antes, para no dejar el sistema sin catálogo. Se recrea la base entera porque el registro de auditoría es inmutable (D41) y no se borra fila a fila. Si el comité pide otra cosa, se hace como diga.
5. **Las tablas del catálogo no se versionan fila a fila todavía.** Con el reset, la v2 reemplaza a la v1 y no conviven; `catalog_versions` sigue diciendo contra qué versión se mide cada servicio × marco y cada evaluación (A4). Versionar fila a fila hará falta cuando haya clientes reales y llegue una v3: entre v1 y v2 se repiten códigos con otro significado (`R001`–`R010`, `F001`–`F056`, `CHG-1`, `CPL-2`…).
6. **Marca blanca.** Los textos del libro que nombran a los proveedores se muestran al cliente con la tabla 9 de `01_DESARROLLO`: «la sonda», «el agente de la sonda», «evaluación de configuración de la sonda», «módulo» e «inventario de la sonda», «el motor de nube»; la fuente principal se dice «Sonda», «Motor de nube» o «Sonda y motor de nube», y los «Posible Checks …» de la columna L, «Verificaciones automáticas de la sonda / del motor de nube». **Nunca se muestran**: la columna Herramienta de `TEST_CHECKS`, las hojas de catálogo de checks ni el bloque de motor interno de `Activos del Servicio (SCOPE)`. El panel interno sí los nombra (D70 se mantiene).

**Por qué.** El comité tiene la última palabra (CLAUDE.md, «Precedencia») y el libro trae su propia guía de integración. Con datos solo de prueba, el reset es más simple y más seguro que mantener dos catálogos o mover datos sin equivalencias: cargar la v2 encima de la v1 dejaría evidencias y resultados apuntando a controles con otro significado.

**Qué cambia.** §0 y §9, `manifest.json`, `assets/README.md`, las decisiones D129 a D138 y los documentos que citan el catálogo v1. Los requerimientos `RC-01` a `RC-21` se construyen en tickets aparte, después de la documentación (MD-490).

**Fuente:** comité funcional, `assets/TSC INTERGRAL SOC 2 DETALLADO VF18_DEV.xlsx` (hojas `00_LEEME` y `01_DESARROLLO`), entregado el 2026-11-22; Héctor Ríos (Rod), 2026-11-22: el reset total del entorno de desarrollo y «se hace como lo quiera el comité».


---

## D129 · El catálogo v2: requisitos del control, la prueba pertenece a un control, nueve dimensiones explícitas, documentos y rol del check (2026-11-22; reemplaza D39)

**Decisión** (tablas 3, 7 y 8 de `01_DESARROLLO`; las tablas, en §3):

1. **Requisito del control** (`catalog.control_requirements`): cada punto de la columna L de `Controles Monkey` (576, hoja `REQUISITOS`), con tipo (documental, población, operativo o técnico), documentos, pruebas, periodicidad sugerida y obligatoriedad. Es **la unidad de cálculo** del cumplimiento del control (D130). Se llama así para no confundirlo con `catalog.requirements`, que es el criterio del marco (`CC6.1`).
2. **La prueba pertenece a un control** (430, `T-<control>-nn`) **o a un documento** (42, `T-DOC-…`), con los campos de la hoja `TEST`: tipo, dimensión, qué asegura, por qué importa, fuente principal, procedimiento estándar, paso a paso, cuándo es correcta, excepción u observación, evidencia a guardar, nivel, frecuencia o muestra, integración sugerida y automatización. `control_tests` deja de ser un N:M libre. Los 23 campos de la hoja `Pruebas` de la v1 se retiran.
3. **Nueve dimensiones**, explícitas por control (columnas «TEST …» de `Controles Monkey`): documental, aplicación, servidores, BD, nube y las nuevas **red, endpoint, físico y ambiental, y proceso**. Ya no se derivan de las pruebas. Endpoint y dispositivo de red siguen siendo además tipos de activo.
4. **Del control**: el tipo (manual, manual dependiente de TI o automático: dice cómo opera y no cambia el cálculo), la periodicidad sugerida (9 valores) y el rol responsable sugerido (cargos, en texto). La columna «EVALUACIÓN DE CONTROL» es un resultado por cliente y no se carga.
5. **Documentos** (`catalog.documents`, 42) reemplazan a `policies` (D39, punto 4) y a `evidence_templates` (D36): tipo, contenido mínimo exigido, periodicidad de revisión, roles sugeridos, origen, aceptación sugerida, su prueba documental y sus 228 vínculos con controles. Su flujo por empresa es D133.
6. **Entidades nuevas**: los procedimientos estándar de prueba (`PE-…`, 8), las categorías de integración (14) y el mapeo de cada control a requisitos de marco (`MAPEO_MARCOS`, hoy solo SOC 2).
7. **Rol del check** en `catalog.test_checks`: Directo, Complementario o Dependencia, con su objetivo común y su condición de aplicación. Los 4.684 vínculos entran con procedencia `committee_ratified` (DEV-12): ya no son propuestas de desarrollo (D56). Un check se identifica por plataforma y check ID en el motor de nube y por política y check ID en la sonda (DEV-11); `TEST_CHECKS` trae el **nombre** de la política y el cruce con `sca_policies` se hace por ese nombre. Las filas con check ID `N/A` son módulos de la sonda o puntajes globales, no checks (`P49`).
8. **Causas**: el origen (interno o externo) y el tipo (18 valores) reemplazan a `failure_category`; no hay nombre corto y se muestra la descripción. Los vínculos riesgo–causa (551) y causa–control (771) salen de la hoja `Causas` y no tienen código.
9. **Riesgos** con probabilidad e impacto inherentes. En el libro son texto («4 - Probable»): se carga el número inicial. Cómo se usan: D134.
10. **Catálogos de checks**: la sonda en 4.14.7 (11.352 checks, 77 políticas) y el motor de nube en 5.45.0 con **20 plataformas** (1.621 checks), no solo AWS y GCP. Antes de cargar se miden las diferencias con lo cargado (DEV-15). Los títulos y las remediaciones en español que trae el libro para la sonda reemplazan a las traducciones de desarrollo donde existan; el resto sigue la regla de D90.

**Por qué.** Es la estructura que define el libro. D39 derivó dimensiones y tipos porque el material anterior no los traía.

**Qué cambia.** §2, §3, §8, `contracts/catalogo-maestro.md` y `contracts/enums/catalogo-maestro.md`. **Cierra** `P15` (solo cuenta lo que está en `TEST_CHECKS`), `P44` (34 vínculos de GitHub) y los puntos 1 y 2 de `P9`; ratifica `P10` (el tipo viene del libro). Ajusta D33, D35, D36, D38, D40, D55 y D56. Las deudas DT-69, DT-76 y DT-80 se cierran cuando se cargue la v2 (RC-01).

**Fuente:** comité funcional, VF18 (hojas `01_DESARROLLO`, `Controles Monkey`, `REQUISITOS`, `TEST`, `TEST_CHECKS`, `Documentos`, `Causas`, `Riesgos`, `PROCEDIMIENTOS`, `INTEGRACIONES`, `MAPEO_MARCOS`, `Checks Wazuh` y `Checks prowler`), 2026-11-22.


---

## D139 · La carga del catálogo v2: aditiva con puentes, dominio por fila, nombre neutro derivado y vínculos «N/A» sin efecto (2026-11-23)

**Decisión.**

1. **Estrategia aditiva con puentes.** El schema v2 se agrega sin retirar las tablas y columnas de la v1, que quedan vacías o nulas tras el reset. La carga alimenta además lo que usa el código v1: `control_tests` (la columna «Test» de `Controles Monkey`), `control_dimensions.type` (del tipo del control) y, en el clonado, los requerimientos de evidencia desde los documentos. Mientras dure, la escritura del catálogo desde Monkey Admin responde `409 CATALOG_READ_ONLY`. La v1 se retira cuando las fases 2 y 3 reescriban el código que la usa (`DT-113`).
2. **El dominio es de la fila control + punto de enfoque** (`point_of_focus_controls.domain`), no del control: 61 controles tienen 2 a 4 dominios en el libro y `IN-08` no exige que coincidan. La API del Admin devuelve `domains[]` y `domain` como el primero.
3. **El nombre neutro de la prueba (D70) lo deriva la carga:** en una `T-DOC`, el nombre del documento; en una prueba de control, el texto de su requisito, o el objetivo si ese texto es «Posible Checks …». Se aplica la tabla 9, se valida SEG-39 y queda `display_name_reviewed = false` hasta que Monkey lo revise.
4. **Los 19 vínculos de `TEST_CHECKS` con check ID «N/A»** se cargan con `check_id` nulo y `module_ref`, sin efecto en el cálculo hasta que el comité resuelva `P49`.
5. **Las plataformas del motor de nube y las políticas de la sonda quedan íntegras en el catálogo** (las 20 y las 77); **ejecutarlas** (adaptador, conexión y credenciales) para las que hoy no se ejecutan va en un ticket aparte. Hoy se ejecutan AWS, GCP y la sonda en Linux y Windows.

**Por qué.** Retirar la v1 ahora obligaba a rehacer el clonado, el motor, la evidencia, los riesgos y el Admin (3 a 4 semanas) y a decidir antes de tiempo el diseño de RC-06 a RC-09. Los puentes mantienen el recorrido crear empresa → contratar SOC 2 → clonar → medir funcionando con la v2. Los otros tres puntos son lo que el libro dice o lo que no define.

**Qué cambia.** §3 (dominio, `control_requirement_tests`, `module_ref`), `contracts/catalogo-maestro.md` («Carga del catálogo v2» y «Transición»), `contracts/cumplimiento/veredictos.md`, `contracts/integraciones.md` y `contracts/enums/control-tecnico.md`.

**Fuente:** Héctor Ríos (Rod), 2026-11-23, en MD-491.
