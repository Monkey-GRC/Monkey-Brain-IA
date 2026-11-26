---
id: contracts-monkey-admin-catalog
name: Contrato — Monkey Admin, catálogo maestro
description: Ver y gestionar el catálogo maestro (marcos, controles, riesgos, causas, pruebas y evidencias) desde Monkey Admin.
type: contract
---

# Monkey Admin — catálogo maestro

> **VF18 (D128): la API de abajo es la del catálogo v1.** La **carga del catálogo v2** (RC-01, MD-491) está en
> [Carga del catálogo v2](#carga-del-catálogo-v2-rc-01) y fija las tablas y columnas nuevas. Mientras no se reescriba la
> administración del catálogo v2, **la escritura desde Monkey Admin queda bloqueada** (ver
> [Transición](#transición-admin-en-solo-lectura)); la lectura sigue con la forma v1.

| | |
|---|---|
| **Estado** | **PROPUESTA** (2026-10-17). Construidas la lectura y la escritura del backend (2026-10-17); faltan los formularios de Monkey Admin. **Carga del catálogo v2 (RC-01) construida** (MD-491, 2026-11-23, ramas sin integrar); Admin en solo lectura hasta reescribirla → ver [Estado de implementación](#estado-de-implementación) |
| **App** | Monkey Admin |
| **Quién** | Solo `admin_monkey`; cualquier otro rol recibe `403` |
| **Entidades** | Todo el schema `catalog` (`modelo-datos.md` §3) |
| **Convenciones** | [`conventions.md`](conventions.md) · enums: [`enums.md`](enums.md) |

## Para qué sirve este documento (léelo primero)

Es el **contexto de la funcionalidad**, para no perderlo entre sesiones. Resume lo acordado con Carlos el 2026-10-17 y el plan.

**Qué se quiere.** En Monkey Admin, una sección «Catálogo maestro» para (1) **ver** qué marcos hay (hoy solo SOC 2, mañana más) y, dentro de cada uno, sus requisitos, controles, riesgos, causas, pruebas y evidencias requeridas; y (2) **agregar, editar y dar de baja** esas piezas.

**Qué se acordó.**
- La **fuente de verdad sigue siendo el Excel del comité**. La versión nueva del marco se cargará por seed (`catalog:load`) desde el nuevo Excel; lo que se rompa entonces se arregla con ayuda de este historial.
- Aun así se deja **lista desde ya** la gestión desde Admin: agregar, editar y borrar.
- **Borrar es dar de baja** (`is_active = false`), nunca eliminar la fila: las copias de cada empresa (D28), las evaluaciones y el histórico apuntan al catálogo.
- **Cada fila dice de dónde viene** (`origin`: `committee` o `monkey_admin`) y **cada cambio queda en la auditoría**. Así reconciliar el Excel nuevo es un diff claro.
- El **versionado de A4** (publicar una versión y propagarla a las empresas) **queda fuera de esta entrega**. Mientras tanto, lo que se cambie en Admin no llega a las empresas que ya contrataron (sus copias son propias, D28).

**Orden de trabajo.** 1) este contrato · 2) Backend, lectura · 3) Admin, lectura · 4) Backend, escritura · 5) Admin, escritura. La lectura sola ya es útil: muestra huecos reales (p. ej. los 52 controles sin evidencia requerida; ver `deuda-tecnica/`).

**Lo que había antes.** Solo `GET /v1/catalogs/frameworks` (lo lee `admin_empresa`: código, nombre, descripción, disponibilidad). El catálogo se carga únicamente con `catalog:load`, que solo inserta y aborta si una fila difiere (A4/D33). En la base, `catalog` lo lee todo el mundo y solo `admin_monkey` escribe (D31).

## Cómo está armado el catálogo

Con SOC 2: 5 criterios de confianza · 61 requisitos · 302 puntos de enfoque · **119 controles** · 10 riesgos · 56 causas · **61 pruebas** · 50 plantillas de evidencia · 10 políticas.

- **Solo los controles pertenecen a un marco:** marco → requisito → punto de enfoque → control (muchos a muchos).
- **Los riesgos y las causas no cuelgan de un marco, y así se quedan.** Son un **pool global** que comparten todos los marcos (decidido con Carlos, 2026-10-17) y se enlazan así: riesgo ↔ causa ↔ control. «Los riesgos de un marco» es una **vista derivada** (los riesgos que llegan a algún control del marco), no un dato propio.
  - **Por qué:** un riesgo es de la organización, no del marco; los controles se mapean a varios marcos (se cumple una vez y cuenta para varios); y como cada servicio tiene su propia copia (D28) y puede contratar varios marcos, riesgos propios por marco harían evaluar dos veces el mismo riesgo en la matriz 5×5 y mostrar dos números del mismo problema.
  - **Un marco nuevo** trae sus requisitos y los enlaza a controles: reutiliza los existentes cuando ya cubren lo mismo y crea controles nuevos solo si son realmente distintos.
- Un control tiene **dimensiones** (documental, servidor, base de datos, aplicación, nube), cada una con su tipo (manual, automática…); **pruebas** (`control_tests`); **plantillas de evidencia** (`control_evidence_templates`, en orden); y **políticas**.
- Una prueba tiene ~20 campos del comité, un **nombre neutro** (`display_name`) y una **descripción** (`display_description`) que ve el cliente (D70, D82). `admin_monkey` ve los textos del comité; el cliente nunca.

## Índice de endpoints

| Grupo | Endpoints | Para qué |
|---|---|---|
| [Lectura](#lectura) | `GET /v1/catalog/frameworks[/{id}[/controls\|/points-of-focus]]` · `GET /v1/catalog/controls[/{id}]` · `GET /v1/catalog/risks[/{id}]` · `GET /v1/catalog/causes[/{id}]` · `GET /v1/catalog/tests[/{id}]` · `GET /v1/catalog/evidence-templates[/{id}]` | Ver el catálogo |
| [Escritura de elementos](#escritura-de-elementos) | `POST` · `PATCH` · `DELETE` sobre `controls`, `risks`, `causes`, `evidence-templates`, `tests` | Crear, editar y dar de baja |
| [Vínculos](#vínculos) | `POST` · `DELETE` sobre `controls/{id}/points-of-focus`, `/tests`, `/evidence-templates`, `/dimensions`; `causes/{id}/controls`; `risks/{id}/causes` | Relacionar elementos |
| [Parámetros de evaluación](#parámetros-de-evaluación-rc-19) | `GET /v1/catalog/evaluation-parameters` · `PATCH /v1/catalog/evaluation-parameters/{key}` | Ver y cambiar los parámetros PR-01 a PR-16 del motor (MD-495) |

---

## Carga del catálogo v2 (RC-01)

**Fuente:** `assets/TSC INTERGRAL SOC 2 DETALLADO VF18_DEV.xlsx` (§0). **Comandos:** `catalog:extract` (libro → JSON con
su `sha256`), `catalog:load` (dry-run; `--apply` escribe) y `catalog:verify`. La carga es **una transacción**, en el
orden de la tabla 10 de `01_DESARROLLO`, solo inserta, y publica `catalog_versions.number = 2`. Estrategia **aditiva**
(Rod, 2026-11-23): las tablas y columnas de la v1 se conservan y quedan vacías o nulas tras el reset; se retiran cuando
las fases 2 y 3 reescriban el código que las usa (DT abierta en el cierre).

### Tablas y columnas (schema `catalog`)

| Tabla | Hoja | Columnas v2 | Notas |
|---|---|---|---|
| `controls` | `Controles Monkey` | `type` (enum de base `catalog.control_type`, con 3 valores; se sirve en `/catalogs/catalog_control_type` porque `control_type` es el catálogo v1 de 4 valores del control del cliente, que se renombra en la fase 2), `periodicity` (`periodicity`), `suggested_owner_role` (texto) | `domain` queda nulo en la v2 |
| `point_of_focus_controls` | `Controles Monkey` | `domain` (texto literal, uno de 25) | **El dominio es de la fila**, no del control: 61 controles tienen 2 a 4 dominios según el punto de enfoque (Rod, 2026-11-23). 472 filas |
| `control_dimensions` | `Controles Monkey`, columnas «TEST …» = «Definido» | `dimension` (`dimension`, 9 valores) | Las banderas y el `type` de la v1 quedan como puente (abajo) |
| `control_requirements` | `REQUISITOS` | `code` (`ID_Requisito`), `control_id`, `point_number` (Punto L), `text`, `type` (`requirement_type`), `periodicity`, `is_mandatory`, `assembly_note` (Observación de armado, interno) | 576 |
| `control_requirement_tests` | `REQUISITOS.ID_Test` | `control_requirement_id`, `test_id` | 862 (629 de pruebas de control + 233 T-DOC). **Reemplaza a `tests.requirement_point`**: 161 pruebas cubren varios puntos |
| `control_requirement_documents` | `REQUISITOS.ID_Documento` | `control_requirement_id`, `document_id` | |
| `tests` | `TEST` | `control_id` (nulo en las T-DOC), `type` (`test_type`), `dimension`, `objective`, `why_it_matters`, `primary_source` (`test_primary_source`), `standard_procedure_id`, `step_by_step` (texto), `correct_if`, `exception_if`, `observation_if`, `evidence_to_retain`, `level` (`test_level`), `frequency_sample` (texto), `integration_category_id`, `automation` (`test_automation`), `display_name`, `display_name_reviewed` (bool), `display_description` | 472. Los 16 textos de la v1 pasan a aceptar nulo. `Estado` no se carga |
| `integration_category_procedures` | `INTEGRACIONES` | `integration_category_id`, `standard_procedure_id` | N:M: una categoría cita uno o varios procedimientos («PE-INT-01; PE-ACC-01»); reemplaza a un `procedure_code` en la categoría |
| `standard_procedures` | `PROCEDIMIENTOS` | `code`, `name`, `when_used`, `generic_steps`, `typical_evidence` | 8 |
| `integration_categories` · `integration_category_controls` | `INTEGRACIONES` | `name`, `example_tools`, `evidence_provided` · `integration_category_id`, `control_id` | 14 categorías, 64 vínculos. **No son** `catalog.integrations` (D110) |
| `documents` · `control_documents` | `Documentos` | Los de §11.1 (`code`, `type`, `name`, `description`, `minimum_content`, `review_periodicity`, `suggested_approver_role`, `suggested_owner_role`, `origin`, `suggested_acceptance`, `test_id`) · `control_id`, `document_id` | 42 documentos, 228 vínculos. Las tablas de la empresa (§11.2) son de RC-09 |
| `control_framework_mappings` | `MAPEO_MARCOS` | `control_id`, `framework_code`, `requirement_ref`, `relation_type` (`direct`), `justification` | 472 |
| `test_checks` | `TEST_CHECKS` | `role` (`check_role`), `common_objective`, `owner_control_id`, `applies_when`, `module_ref`; `provenance = committee_ratified` | 4.684. `check_id` acepta nulo **solo** en los 19 vínculos «N/A» (módulo o puntaje global), que guardan `module_ref`; el motor evalúa los 16 de módulo (pasan sin hallazgos críticos ni altos abiertos) y los 3 puntajes, que pasan con 80 % o más (D141, D146); un CHECK exige uno de los dos. `confidence` y `rationale` quedan nulos |
| `causes` | `Causas` | `cause_origin` (`cause_origin`), `cause_type` (`cause_type`) — la columna no es `origin` porque `causes.origin` ya es el `catalog_origin` (comité o Admin) | 100. `name` y `failure_category` quedan nulos |
| `risk_causes` · `cause_controls` | `Causas` | — | 551 y 771. `risk_causes.code` queda nulo |
| `risks` | `Riesgos` | `likelihood`, `impact` (el número de «4 - Probable»), `inherent_risk_value`, `inherent_risk_level` (el nivel del libro) | 10 |
| `checks` | Las dos hojas de catálogo de checks (sonda y motor de nube, §0) | sin cambios de estructura | Sonda 4.14.7 (11.352, idéntica en contenido a la cargada) y motor de nube 5.45.0 (1.621 en 20 plataformas). Clave: plataforma + check ID (nube) y política + check ID (sonda); en `TEST_CHECKS` la política llega por **nombre** y se cruza con `sca_policies` |

En `tenant.client_causes`: `origin` y `cause_type`, y `name`/`failure_category` aceptan nulo.

### El nombre que ve el cliente (D70, D82)

La hoja `TEST` no trae nombre neutro. La carga lo **deriva** (Rod, 2026-11-23): en una `T-DOC`, el nombre del documento;
en una prueba de control, el texto de su requisito o, si ese texto es «Posible Checks …», el objetivo. El nombre y la
descripción se guardan como salen del libro (el libro **no se reescribe en la base**, Rod, 2026-11-25); la tabla 9 de
`01_DESARROLLO` (D128) vive en `Backend/src/common/text/provider-names.ts` (`whiteLabel`) y se aplica **al enviar el texto
al cliente** con `clientText`. El nombre queda `display_name_reviewed = false` hasta que Monkey lo revise.
`display_description` es el objetivo.

**Campos visibles al cliente** (`CLIENT_VISIBLE_TEXT_FIELDS`, `Backend/prisma/seed/catalog/display-names.ts`); todos pasan
por `clientText` al salir, y `validate.ts` y `verify-catalog.ts` §6 fallan si alguno nombra al proveedor tras aplicarla (SEG-39):

| Colección | Campos |
|---|---|
| `tests` | `displayName`, `displayDescription`, `objective`, `whyItMatters`, `stepByStep`, `correctIf`, `exceptionIf`, `observationIf`, `evidenceToRetain` |
| `controlRequirements` | `text`, `assemblyNote` |
| `standardProcedures` | `whenUsed`, `genericSteps`, `typicalEvidence` |
| `integrationCategories` | `exampleTools` |
| `testChecks` | `commonObjective` |
`display_name_en` queda nulo hasta la traducción con IA revisada por el comité (D142).

### Puentes con el código v1

Para que crear empresa → contratar SOC 2 → clonar → medir siga funcionando hasta las fases 2 y 3:

| Lo que usa el código v1 | Cómo lo alimenta la carga v2 |
|---|---|
| `control_tests` | La columna «Test» de `Controles Monkey` (658 pares = 430 por `tests.control_id` + 228 T-DOC por `control_documents`); el verificador comprueba que coincidan |
| `control_dimensions.type` | Del tipo del control: `manual` → `manual`, `automated` → `automated`, `it_dependent_manual` → `hybrid`; banderas en `false` |
| `evidence_requirements` del cliente | El clonado los crea desde `control_documents` + `documents.test_id` (uno por documento y control, dimensión documental), en lugar de las plantillas de evidencia |
| Decisión del escaneo | Solo los vínculos `role = direct` deciden una prueba (RC-04) |

### Validación (`catalog:verify` y el extractor)

- **Totales de la tabla 10** (§0), exactos.
- **Reglas `IN-01` a `IN-10`**. Avisos conocidos que no fallan: `IN-07` en VUL-1/VUL-2 («Detección de vulnerabilidades») y
  el tipo de pérdida de R003/R004 (`P9`, se carga literal).
- Cada vínculo de `TEST_CHECKS` cruza con su check, salvo los 19 «N/A».
- Marca blanca: ningún campo visible al cliente (`CLIENT_VISIBLE_TEXT_FIELDS`) nombra al proveedor una vez aplicada la tabla 9 (`clientText`); el libro queda intacto en la base.
- Base frente a JSON, fila por fila, y los puentes.

## Transición: Admin en solo lectura

Desde MD-491 y hasta que se reescriba la administración del catálogo v2, **toda la escritura** de este contrato
(`POST`, `PATCH`, `DELETE` de elementos y vínculos) responde **`409 CATALOG_READ_ONLY`**: el catálogo v2 solo lo cambia
la carga. La lectura sigue con la forma v1; las listas de plantillas de evidencia quedan vacías y los campos v1 que la
v2 no trae llegan en `null`.

## Lectura

| | |
|---|---|
| **Quién** | `admin_monkey` |
| **Éxito** | `200`, todas **paginadas** (`conventions.md`) |
| **Errores** | `403 FORBIDDEN` · `404 NOT_FOUND` |

Cada ítem trae `origin` (enum `catalog_origin`) e `is_active`.

| Endpoint | Qué devuelve |
|---|---|
| `GET /v1/catalog/frameworks` | Marcos: `id`, `code`, `name`, `version`, `type`, `availability` y **conteos** (requisitos, controles, pruebas). Los controles son los vinculados a algún requisito: en SOC 2, **118** de los 119 del catálogo |
| `GET /v1/catalog/frameworks/{id}` | El marco con sus criterios de confianza y requisitos (`code`, `criterion`, `controls_count`) |
| `GET /v1/catalog/frameworks/{id}/controls` | Controles del marco. Filtros: `search`, `domain` (coincide con cualquiera de sus dominios), `requirement_code`, `has_evidence_template`, `is_active`. Cada uno: `code`, `name`, `domains[]` (distintos, en el orden de sus puntos de enfoque; MD-491), `domain` (el primero de `domains`, o `null`), `dimensions`, `tests_count`, `evidence_templates_count` |
| `GET /v1/catalog/frameworks/{id}/points-of-focus?requirement_code=` | Apoyo para elegir a qué se vincula un control: `{ items: [{ id, framework_code, requirement_code, number, description, controls_count }] }` |
| `GET /v1/catalog/controls` | Controles de todo el catálogo, con los mismos filtros, más `framework_id` y `unlinked=true` (los que no cuelgan de ningún requisito: **CPL-1**, o uno recién creado sin vincular). Sin esto un control nuevo desaparecería de la lista del marco |
| `GET /v1/catalog/controls/{id}` | Detalle: descripción, `source_ref`, puntos de enfoque (`id`, requisito y número; el `id` es el que se usa para desvincularlo), dimensiones, pruebas, plantillas de evidencia (con su `sequence`), políticas y causas que lo mitigan |
| `GET /v1/catalog/risks` · `/risks/{id}` | Riesgos globales; el detalle trae sus causas |
| `GET /v1/catalog/causes` · `/causes/{id}` | Causas globales; el detalle trae sus riesgos y controles. La causa v2 no tiene nombre corto: `name` llega con la descripción (MD-491) |
| `GET /v1/catalog/tests` · `/tests/{id}` | Pruebas; el detalle trae los campos del comité, `display_name`, `display_description` y los controles que la usan |
| `GET /v1/catalog/evidence-templates` · `/evidence-templates/{id}` | Plantillas de evidencia (`code`, `description`, `dimension`) y a cuántos controles sirven |

> `has_evidence_template=false` es la consulta que lista los controles sin evidencia requerida.

---

## Escritura de elementos

| | |
|---|---|
| **Quién** | `admin_monkey` |
| **Éxito** | `201` (`POST`) o `200` (`PATCH`/`DELETE`) con el elemento ya actualizado |
| **Errores** | `403` · `404` · `409 CODE_ALREADY_EXISTS` · `409 CATALOG_ITEM_IN_USE` · `422 VALIDATION_FAILED` |

Cada llamada deja su fila de auditoría `catalog.*` en la misma transacción (SEG-36). **Dar de baja no borra:** `DELETE` y `PATCH { "is_active": false }` hacen lo mismo (baja lógica, idempotente) y `PATCH { "is_active": true }` reactiva. Todo lo que se crea nace con `origin: "monkey_admin"` y activo. Un `PATCH` sin ningún campo es `422`.

| Endpoint | Request | Notas |
|---|---|---|
| `POST /v1/catalog/controls` | `code`, `name`, `description`, `domain`, `source_ref?` | Nace **sin requisito** (no cuelga de ningún marco) hasta que se vincula a un punto de enfoque |
| `PATCH` · `DELETE /v1/catalog/controls/{id}` | `name`, `description`, `domain`, `source_ref`, `is_active` | |
| `POST /v1/catalog/risks` | `name`, `description`, `trust_criterion`, `potential_impact[]`, `code?` | Sin `code`, el servidor asigna el siguiente `R0NN` |
| `PATCH` · `DELETE /v1/catalog/risks/{id}` | Las mismas, más `is_active` | |
| `POST /v1/catalog/causes` | `name`, `description`, `failure_category`, `code?` | Sin `code`, el siguiente `F0NN` |
| `PATCH` · `DELETE /v1/catalog/causes/{id}` | Las mismas, más `is_active` | |
| `POST /v1/catalog/evidence-templates` | `code`, `description`, `dimension?` | `dimension` por defecto `policy` |
| `PATCH` · `DELETE /v1/catalog/evidence-templates/{id}` | `description`, `is_active` | |
| `POST /v1/catalog/tests` | `code`, `dimension`, `name`, `display_name`, `display_description`, `objective`, `type` y, opcionales, los demás textos del comité | El prefijo del código dice la dimensión: `T-DOC`, `T-SRV`, `T-BD`, `T-APP`, `T-CLD` |
| `PATCH` · `DELETE /v1/catalog/tests/{id}` | Los mismos menos `code` y `dimension`, más `is_active` | |

## Vínculos

| | |
|---|---|
| **Quién** | `admin_monkey` |
| **Éxito** | `POST` → `201` con el elemento padre ya actualizado · `DELETE` → `204` (borra solo la relación, nunca los elementos) |
| **Errores** | `403` · `404` · `409 LINK_ALREADY_EXISTS` · `409 CATALOG_ITEM_IN_USE` · `422 VALIDATION_FAILED` |

| Endpoint | Request |
|---|---|
| `POST` · `DELETE /v1/catalog/controls/{id}/points-of-focus[/{pof_id}]` | `point_of_focus_id` (así un control entra a un marco) |
| `POST` · `DELETE /v1/catalog/controls/{id}/tests[/{test_id}]` | `test_id` |
| `POST` · `DELETE /v1/catalog/controls/{id}/evidence-templates[/{template_id}]` | `evidence_template_id`, `sequence?` (1…N+1; sin ella, al final) |
| `POST` · `DELETE /v1/catalog/controls/{id}/dimensions[/{dimension}]` | `dimension`, `type`, `requires_probe?`, `requires_ai?`, `requires_compliance_confirmation?` |
| `POST` · `DELETE /v1/catalog/causes/{id}/controls[/{control_id}]` | `control_id` |
| `POST` · `DELETE /v1/catalog/risks/{id}/causes[/{cause_id}]` | `cause_id` |

## Reglas que el servidor impone

| Regla | Respuesta |
|---|---|
| `code` único dentro de su tipo | `409 CODE_ALREADY_EXISTS` |
| Un vínculo repetido | `409 LINK_ALREADY_EXISTS` |
| Lo que ve el cliente de una prueba (`display_name`, `display_description`) **nunca nombra al proveedor de la sonda** (SEG-39, D70; misma regla que valida `catalog:load`) | `422 text.names_provider` |
| El prefijo del código de una prueba corresponde a su dimensión | `422 code.dimension_mismatch` |
| Una prueba solo se vincula a un control que tenga su dimensión | `422 dimension.not_in_control` |
| Las secuencias de evidencia de un control son únicas y **contiguas desde 1**: al insertar en medio se corren las siguientes; al quitar una se cierra el hueco | Una posición fuera de rango: `422 sequence.range` |
| El cambio dejaría a un control activo sin nada que medir: desvincular o dar de baja **la única prueba** de un control activo, o quitar una dimensión de la que el control todavía usa pruebas | `409 CATALOG_ITEM_IN_USE` |

> **Lo dado de baja deja de ofrecerse a los servicios nuevos** (el clonado salta controles, pruebas, plantillas, riesgos y causas inactivos), pero **no cambia las copias que las empresas ya clonaron** (D28). La propagación a las existentes (A4) sigue fuera de esta entrega.

## Parámetros de evaluación (RC-19)

Los parámetros del modelo de evaluación (§11 del libro, `PR-01` a `PR-16`) más dos que el libro no numera: el umbral de
los puntajes globales (D146) y la cobertura de activos de un control Sólido (R5/R6). **Nunca se escriben en el código**
(RC-19): viven en `catalog.evaluation_parameters`, una fila por parámetro, con el valor del libro en la semilla. Tienen
**un solo valor de Monkey, igual para todos los clientes** (D140 punto 5); la empresa solo cambia la periodicidad de sus
controles (G-10, `PUT /v1/controls/{id}/periodicity`). El motor los carga **una vez por caso de uso**, sin caché.

| | |
|---|---|
| **Quién** | `admin_monkey` |
| **Éxito** | `GET` → `200` · `PATCH` → `200` con el parámetro ya actualizado |
| **Errores** | `403` · `404 NOT_FOUND` (la `key` no existe) · `422 VALIDATION_FAILED` |

**No los bloquea la transición** (`CATALOG_READ_ONLY`): no son parte de la carga del catálogo v2.

### `GET /v1/catalog/evaluation-parameters`

Lista fija (19 filas: PR-06 son dos, en el orden de la tabla de abajo), **sin paginar**: `{ items: [...] }`. Cada ítem:

| Campo | Qué es |
|---|---|
| `key` | Identificador estable en `snake_case`; es el que va en la ruta del `PATCH` |
| `code` | El código del libro (`PR-01`…`PR-16`), o `null` en los dos que el libro no numera |
| `name` · `description` | Ya traducidos según `Accept-Language` |
| `unit` | Enum `evaluation_parameter_unit`: dice la forma de `value` |
| `value` · `default_value` | El valor vigente y el del libro (la semilla) |
| `updated_at` · `updated_by` | Último cambio: fecha y `{ id, name }` de quien lo hizo; `null` y `null` si sigue el valor de la semilla |

| `key` | `code` | `unit` | Por defecto | Qué acepta el `PATCH` |
|---|---|---|---|---|
| `partial_threshold` | PR-01 | `percent` | 75 | Entero 1–100, mayor que `weak_threshold` |
| `weak_threshold` | PR-02 | `percent` | 40 | Entero 1–100, menor que `partial_threshold` |
| `asset_coverage` | PR-03 | `percent` | 100 | Entero 1–100, no mayor que `solid_asset_coverage` |
| `check_exception_max_days` | PR-04 | `days` | 90 | Entero 1–365 |
| `freshness_hours` | PR-05 | `hours` | 24 | Entero 1–720 |
| `alert_days_before` | PR-06 | `days_by_periodicity` | `{ "daily": 0, "weekly": 2, "monthly": 5, "bimonthly": 10, "quarterly": 15, "semiannual": 20, "annual": 30 }` | Un objeto con **exactamente** esas 7 periodicidades (`permanent` no tiene ventana); cada una, un entero desde 0 y menor que la duración de su ventana en días (diaria 1, semanal 7, mensual 28, bimestral 59, trimestral 90, semestral 181, anual 365) |
| `on_demand_alert_days` | PR-06 | `days` | 15 | Entero 0–89 (días antes del cierre del trimestre) |
| `validity_windows` | PR-07 | `window_mode` | `calendar` | `calendar` o `rolling` ([abajo](#pr-07-ventanas-de-calendario-o-móviles)) |
| `risk_partial_mitigation_coverage` | PR-08 | `percent` | 60 | Entero 1–100, menor que `risk_demonstrated_mitigation_coverage` |
| `risk_demonstrated_mitigation_coverage` | PR-09 | `percent` | 85 | Entero 1–100, mayor que `risk_partial_mitigation_coverage` |
| `impact_reduction_enabled` | PR-10 | `boolean` | `false` | `true` o `false` |
| `approval_max_steps` | PR-11 | `count` | 5 | Entero 1–10 |
| `approval_max_approvers_per_step` | PR-12 | `count` | 3 | Entero 1–10 |
| `submitter_sole_approver_allowed` | PR-13 | `boolean` | `false` | `true` o `false` |
| `document_acceptance_days` | PR-14 | `days` | 30 | Entero 1–365 |
| `document_acceptance_required` | PR-15 | `percent` | 100 | Entero 1–100 |
| `audited_period_min_months` | PR-16 | `months` | 6 | Entero 1–24 |
| `score_threshold` | `null` (D146) | `percent` | 80 | Entero 1–100 |
| `solid_asset_coverage` | `null` (R5/R6) | `percent` | 100 | Entero 1–100, no menor que `asset_coverage` |

**Todos son editables** (decisión del equipo de desarrollo, Rod, 2026-11-24). PR-08 a PR-15 se guardan y se editan
aunque todavía no los lee nadie: el riesgo residual (MD-511) **debe** aplicar PR-08, PR-09 y PR-10 con cualquiera de sus
valores, y el módulo Documentos, PR-11 a PR-15 (PR-13 en `true` deja que quien envía sea el único aprobador; queda en la
auditoría). PR-07 sí lo aplica ya el motor:

#### PR-07: ventanas de calendario o móviles

- **`calendar`** (por defecto, el libro): la ventana es el período de calendario de la periodicidad (el mes, el
  trimestre, el año) y basta una evidencia válida dentro de ella (§9).
- **`rolling`**: cada evidencia válida cubre **una periodicidad desde su fecha**; la siguiente vence esa misma fecha un
  período después (mensual: evidencia del 20 de marzo → vence el 20 de abril). Sin evidencia previa, la primera vence
  una periodicidad después del inicio del período auditado. Al vencer sin evidencia nueva, el requisito pasa como al
  cerrar una ventana de calendario (Vencido; un activo sin resultado, Excepción, D140), y el aviso previo de PR-06 sale
  esos días antes del vencimiento (`alert_at`). Solo cuentan los vencimientos dentro del período auditado (G-11).
  `permanent` y «cuando sea requerido» no cambian.
  - Una evidencia que llega **antes** del vencimiento renueva **desde su fecha**, no desde el vencimiento.
  - `window_end` es el último día válido, como en calendario (evidencia del 20 de marzo → `window_end` 19 de abril).
  - En una prueba técnica cuenta como evidencia de un día que al menos PR-03 % de los activos en alcance tenga resultado.
  - Una prueba que nunca tuvo evidencia sigue en Pendiente, como en calendario; el vencimiento perdido se ve en la vista
    del período (`period.missing`) y le quita el Sólido al control.

### `PATCH /v1/catalog/evaluation-parameters/{key}`

Request: `{ "value": … }`, con la forma que dice su `unit`. Un `PATCH` sin `value` es `422 required`.

- Las **reglas entre parámetros** (PR-01 > PR-02, PR-08 < PR-09, Sólido ≥ PR-03; por eso PR-03 tampoco supera al de Sólido) se comprueban contra el valor vigente
  del otro: para invertir un par se cambia primero el que deja el par válido.
- **Auditoría:** `catalog.evaluation_parameter.update`, con `before_state` y `after_state` (`{ key, value }`),
  `tenant_id` nulo y en la misma transacción (SEG-36). Mandar el mismo valor responde `200` sin cambio y sin fila.
- **Historial (MD-508, D153):** en esa misma transacción se inserta una fila en `catalog.evaluation_parameter_changes` (`key`, `code`, valor anterior y nuevo, quién y cuándo). Es interno: ningún endpoint lo expone; lo lee la pasada por empresa para avisar `check_parameters_changed` (`contracts/notificaciones.md`). Mandar el mismo valor tampoco deja fila.
- **Efecto:** el cumplimiento se calcula al leer (§9), así que el valor nuevo vale desde la siguiente lectura o
  evaluación de todos los clientes. **No es retroactivo:** los eventos de cambio de estado ya registrados no se recalculan.

Códigos de `error.fields[].code`: `required`, `value.type` (no tiene la forma de su `unit`), `value.range` (fuera de
rango), `value.order` (rompe una regla entre parámetros; `field` es `value`), `value.periodicities` (en PR-06 falta o
sobra una periodicidad).

## Listas de opciones del Admin

Los selects del formulario (`dimension`, `control_type`, `risk_criterion`, `failure_category`) y los filtros (`dimension`, `catalog_origin`) se llenan con `GET /v1/catalogs/{name}`, igual que en Platform (`enums.md`); el Admin no tiene listas propias. El `Accept-Language` lo manda el interceptor de autenticación.

## Seed y auditoría

- `catalog:load` y `catalog:verify` **solo miran lo del comité** (`origin = committee`). Lo agregado desde Admin y sus vínculos se ignoran; el cargador lo cuenta aparte («Ignoradas…»).
- Una fila del **comité que se editó desde Admin** aparece como conflicto (el seed nunca sobrescribe), marcada **«[editado desde Monkey Admin]»** gracias al rastro `catalog.*.update|deactivate|reactivate` de `audit.audit_logs`. Qué versión queda es una decisión con el comité al cargar el Excel nuevo.

## Errores del módulo

| HTTP | `error.code` | Cuándo |
|---|---|---|
| 403 | `FORBIDDEN` | El rol no es `admin_monkey` |
| 404 | `NOT_FOUND` | El elemento no existe |
| 409 | `CODE_ALREADY_EXISTS` | `code` repetido |
| 409 | `LINK_ALREADY_EXISTS` | El vínculo ya existe |
| 409 | `CATALOG_ITEM_IN_USE` | Dar de baja o desenlazar lo que otro elemento activo necesita |
| 409 | `CATALOG_READ_ONLY` | Cualquier escritura mientras dure la transición al catálogo v2 (MD-491); no aplica a los parámetros de evaluación |
| 422 | `VALIDATION_FAILED` | `required`, `enum.invalid`, `uuid.invalid`, `text.names_provider`, `code.dimension_mismatch`, `dimension.not_in_control`, `sequence.range`; en los parámetros, `value.type`, `value.range`, `value.order`, `value.periodicities` |

## Preguntas abiertas

- ~~Editar una fila del comité desde Admin~~ **Decidido (2026-10-17):** conserva su `origin: committee`, queda en la auditoría y el seed la marca como editada al cargar el Excel nuevo (ver «Seed y auditoría»).
- **Cuánto se reutiliza en el siguiente marco:** los riesgos y las causas son compartidos (decidido); falta saber cuántos controles de SOC 2 cubren los requisitos del próximo marco. El Excel de SOC 2 es específico de SOC 2 (códigos y dominios): el comité entregará el mapeo del siguiente.
- **Versionado y propagación (A4):** fuera de esta entrega. Hasta que exista, lo que se agrega en Admin no llega a empresas que ya contrataron.
- **Quién edita:** hoy cualquier `admin_monkey`. Si el comité quiere un rol propio de editor de catálogo, es una decisión nueva (D102 cerró los permisos por pantalla con la matriz de §5.5).
- **Pruebas automáticas nuevas:** necesitan comprobaciones (`checks`) asociadas; este contrato no cubre cargarlas.

---

## Estado de implementación

**Lectura construida (2026-10-17)**, rama `feat/admin-catalog-read` del Backend: módulo `catalog-admin` (`GET /v1/catalog/…`) y la migración `20261017100000_catalog_origin_and_active`, que agrega `origin` (`committee`/`monkey_admin`) a controles, riesgos, causas, pruebas y plantillas de evidencia, e `is_active` a todas menos riesgos (ya lo tenían). Lo existente queda como `committee` y activo. Probado contra la base real (solo lectura) y con 15 pruebas e2e, cuyas cifras salen del JSON del catálogo.

- **CPL-1** («SOC 2 - Descripción del Sistema») no cuelga de ningún requisito: es intencional del comité (`EXPECTED_UNASSIGNED_CONTROLS`). Por eso el marco cuenta 118 controles y el catálogo 119; `unlinked=true` lo encuentra.
- `GET /v1/catalog/controls` no estaba en la propuesta original: se agregó al ver CPL-1.
- Los listados filtran por `is_active` y `origin`, pero hoy ninguna fila está dada de baja ni viene de Monkey Admin.

**Monkey Admin, solo lectura (2026-10-17)**, rama `feat/admin-catalog-ui` del Frontend (Admin): entrada «Catálogo maestro» en el menú (ruta `/catalog`, solo `admin_monkey`). Los marcos como tarjetas con sus conteos; cinco pestañas (controles, riesgos, causas, pruebas, evidencias requeridas) con búsqueda y filtros de origen y estado; en controles, el ámbito (del marco · todo el catálogo · sin requisito) y «sin evidencia requerida»; en pruebas, la dimensión. Un panel lateral muestra el detalle de un control, riesgo, causa o prueba; el de la prueba separa lo que ve el cliente de los textos internos del comité. Las plantillas de evidencia no tienen detalle propio.

**Escritura construida (2026-10-17)**, rama `feat/admin-catalog-write` del Backend: los `POST`/`PATCH`/`DELETE` y los vínculos de arriba, la auditoría `catalog.*`, la regla de baja en el clonado (`clone-catalog.service.ts`), `GET /v1/catalog/evidence-templates/{id}` y `GET /v1/catalog/frameworks/{id}/points-of-focus`, y el ajuste de `catalog:load` / `catalog:verify`. Probada con 22 pruebas e2e nuevas (y las 15 de lectura, ahora restringidas a `origin=committee` porque las de escritura agregan filas a la misma base); la suite completa pasa dos veces seguidas.

**Monkey Admin, escritura (2026-10-17)**, rama `feat/admin-catalog-forms` del Frontend (Admin): botón «Nuevo» en cada pestaña (control, riesgo, causa, evidencia requerida, prueba) con un formulario común; los errores por campo del backend salen junto a cada campo, y los textos del comité de una prueba van en una sección aparte y opcional. Desde el panel de detalle: **Editar** (solo se manda lo que cambió), **Dar de baja** (con confirmación; no borra) y **Reactivar**, y agregar o quitar vínculos con un selector que busca entre lo activo y deja fuera lo ya vinculado (puntos de enfoque por marco y requisito; pruebas solo de las dimensiones del control; evidencias con posición opcional; dimensiones; causas y riesgos desde cualquiera de los dos lados). Un elemento recién creado se abre para vincularlo. La plantilla de evidencia tiene ahora un detalle corto. El detalle de un control devuelve el `id` de cada punto de enfoque para poder desvincularlo (Backend `feat/catalog-pof-id`).

**Por construir:** la propagación a las copias de las empresas (A4) y la versión de catálogo que se publica.
