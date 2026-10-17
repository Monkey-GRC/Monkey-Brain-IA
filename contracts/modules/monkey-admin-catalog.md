---
id: contracts-monkey-admin-catalog
name: Contrato — Monkey Admin, catálogo maestro
description: Ver y gestionar el catálogo maestro (marcos, controles, riesgos, causas, pruebas y evidencias) desde Monkey Admin.
type: contract
---

# Monkey Admin — catálogo maestro

**Estado: PROPUESTA (2026-10-17). Construidas la lectura y la escritura del backend (2026-10-17); faltan los formularios de Monkey Admin.** Ver «Estado de implementación». Ver `conventions.md` y `enums.md`. Entidades: todo el schema `catalog` (`modelo-datos.md` §3). **App:** Monkey Admin. **Quién:** solo `admin_monkey`; cualquier otro rol recibe `403`.

## Para qué sirve este documento (léelo primero)

Este archivo es el **contexto de la funcionalidad**, para no perderlo entre sesiones. Resume lo que se acordó con Carlos el 2026-10-17 y el plan.

**Qué se quiere.** En Monkey Admin, una sección «Catálogo maestro» para (1) **ver** qué marcos hay (hoy solo SOC 2, mañana más) y, dentro de cada uno, sus requisitos, controles, riesgos, causas, pruebas y evidencias requeridas; y (2) **agregar, editar y dar de baja** esas piezas.

**Qué se acordó.**
- La **fuente de verdad sigue siendo el Excel del comité**. La versión nueva del marco se cargará por seed (`catalog:load`) desde el nuevo Excel; lo que se rompa entonces se arregla con ayuda de este historial.
- Aun así se deja **lista desde ya** la gestión desde Admin: agregar, editar y borrar.
- **Borrar es dar de baja** (`is_active = false`), nunca eliminar la fila: las copias de cada empresa (D28), las evaluaciones y el histórico apuntan al catálogo.
- **Cada fila dice de dónde viene** (`origin`: `committee` o `monkey_admin`) y **cada cambio queda en la auditoría**. Así reconciliar el Excel nuevo es un diff claro.
- El **versionado de A4** (publicar una versión y propagarla a las empresas) **queda fuera de esta entrega**. Mientras tanto, lo que se cambie en Admin no llega a las empresas que ya contrataron (sus copias son propias, D28).

**Orden de trabajo.** 1) este contrato · 2) Backend, lectura · 3) Admin, lectura · 4) Backend, escritura · 5) Admin, escritura. La lectura sola ya es útil: muestra huecos reales (p. ej. los 52 controles sin evidencia requerida, B7 de `DEUDAS-TECNICAS.md`).

**Lo que hay hoy.** Solo `GET /v1/catalogs/frameworks` (lo lee `admin_empresa`: código, nombre, descripción, disponibilidad). El catálogo se carga únicamente con `catalog:load`, que solo inserta y aborta si una fila difiere (A4/D33). En la base, `catalog` lo lee todo el mundo y solo `admin_monkey` escribe (D31).

## Cómo está armado el catálogo (importante)

Con SOC 2: 5 criterios de confianza · 61 requisitos · 302 puntos de enfoque · **119 controles** · 10 riesgos · 56 causas · **61 pruebas** · 50 plantillas de evidencia · 10 políticas.

- **Solo los controles pertenecen a un marco**: marco → requisito → punto de enfoque → control (muchos a muchos).
- **Los riesgos y las causas no cuelgan de un marco, y así se quedan.** Son un **pool global** que comparten todos los marcos (decidido con Carlos, 2026-10-17) y se enlazan así: riesgo ↔ causa ↔ control. «Los riesgos de un marco» es una **vista derivada** (los riesgos que llegan a algún control del marco), no un dato propio.
  - **Por qué:** un riesgo es de la organización, no del marco; los controles se mapean a varios marcos (se cumple una vez y cuenta para varios); y como cada servicio tiene su propia copia (D28) y puede contratar varios marcos, riesgos propios por marco harían evaluar dos veces el mismo riesgo en la matriz 5×5 y mostrar dos números del mismo problema.
  - **Un marco nuevo** trae sus requisitos y los enlaza a controles: reutiliza los existentes cuando ya cubren lo mismo y crea controles nuevos solo si son realmente distintos.
- Un control tiene **dimensiones** (documental, servidor, base de datos, aplicación, nube), cada una con su tipo (manual, automática…); **pruebas** (`control_tests`); **plantillas de evidencia** (`control_evidence_templates`, en orden); y **políticas**.
- Una prueba tiene ~20 campos del comité, un **nombre neutro** (`display_name`) y una **descripción** (`display_description`) que ve el cliente (D70, D82). `admin_monkey` ve los textos del comité; el cliente nunca.

## Lectura

Todas paginadas (`conventions.md`), solo `admin_monkey`. Cada ítem trae `origin` e `is_active`.

| Endpoint | Qué devuelve |
|---|---|
| `GET /v1/catalog/frameworks` | Marcos: `id`, `code`, `name`, `version`, `type`, `availability` y **conteos** (requisitos, controles, pruebas). Los controles son los vinculados a algún requisito: en SOC 2, **118** de los 119 del catálogo |
| `GET /v1/catalog/frameworks/{id}` | El marco con sus criterios de confianza y requisitos (`code`, `criterion`, `controls_count`) |
| `GET /v1/catalog/frameworks/{id}/controls` | Controles del marco. Filtros: `search`, `domain`, `requirement_code`, `has_evidence_template`, `is_active`. Cada uno: `code`, `name`, `domain`, `dimensions`, `tests_count`, `evidence_templates_count` |
| `GET /v1/catalog/controls` | Controles de todo el catálogo, con los mismos filtros, más `framework_id` y `unlinked=true` (los que no cuelgan de ningún requisito: **CPL-1**, o uno recién creado sin vincular). Sin esto un control nuevo desaparecería de la lista del marco |
| `GET /v1/catalog/controls/{id}` | Detalle: descripción, `source_ref`, puntos de enfoque (`id`, requisito y número; el `id` es el que se usa para desvincularlo), dimensiones, pruebas, plantillas de evidencia (con su `sequence`), políticas y causas que lo mitigan |
| `GET /v1/catalog/risks` · `GET /v1/catalog/risks/{id}` | Riesgos globales; el detalle trae sus causas |
| `GET /v1/catalog/causes` · `GET /v1/catalog/causes/{id}` | Causas globales; el detalle trae sus riesgos y controles |
| `GET /v1/catalog/tests` · `GET /v1/catalog/tests/{id}` | Pruebas; el detalle trae los campos del comité, `display_name`, `display_description` y los controles que la usan |
| `GET /v1/catalog/evidence-templates` | Plantillas de evidencia (`code`, `description`, `dimension`) y a cuántos controles sirven |

`has_evidence_template=false` es la consulta que lista los controles sin evidencia requerida.

## Escritura

Solo `admin_monkey`. Cada llamada deja su fila de auditoría `catalog.*` en la misma transacción (SEG-36). **Dar de baja no borra**: `DELETE` y `PATCH { "is_active": false }` hacen lo mismo (baja lógica, idempotente) y `PATCH { "is_active": true }` reactiva. Todo lo que se crea nace con `origin: "monkey_admin"` y activo. Un `PATCH` sin ningún campo es `422`. Las respuestas de `POST`/`PATCH` traen el elemento ya actualizado.

### Elementos

| Endpoint | Cuerpo | Notas |
|---|---|---|
| `POST /v1/catalog/controls` | `code`, `name`, `description`, `domain`, `source_ref?` | `201`. Nace **sin requisito** (no cuelga de ningún marco) hasta que se vincula a un punto de enfoque |
| `PATCH` · `DELETE /v1/catalog/controls/{id}` | `name`, `description`, `domain`, `source_ref`, `is_active` | |
| `POST /v1/catalog/risks` | `name`, `description`, `trust_criterion`, `potential_impact[]`, `code?` | Sin `code`, el servidor asigna el siguiente `R0NN` |
| `PATCH` · `DELETE /v1/catalog/risks/{id}` | las mismas, más `is_active` | |
| `POST /v1/catalog/causes` | `name`, `description`, `failure_category`, `code?` | Sin `code`, el siguiente `F0NN` |
| `PATCH` · `DELETE /v1/catalog/causes/{id}` | las mismas, más `is_active` | |
| `POST /v1/catalog/evidence-templates` | `code`, `description`, `dimension?` (por defecto `policy`) | |
| `PATCH` · `DELETE /v1/catalog/evidence-templates/{id}` | `description`, `is_active` | `GET /v1/catalog/evidence-templates/{id}` devuelve una |
| `POST /v1/catalog/tests` | `code`, `dimension`, `name`, `display_name`, `display_description`, `objective`, `type` y, opcionales, los demás textos del comité | El prefijo del código dice la dimensión: `T-DOC`, `T-SRV`, `T-BD`, `T-APP`, `T-CLD` |
| `PATCH` · `DELETE /v1/catalog/tests/{id}` | los mismos menos `code` y `dimension`, más `is_active` | |

### Vínculos

`POST` responde `201` con el elemento padre ya actualizado; `DELETE` responde `204` y borra solo la relación, nunca los elementos.

| Endpoint | Cuerpo |
|---|---|
| `POST` · `DELETE /v1/catalog/controls/{id}/points-of-focus[/{pof_id}]` | `point_of_focus_id` (así un control entra a un marco) |
| `POST` · `DELETE /v1/catalog/controls/{id}/tests[/{test_id}]` | `test_id` |
| `POST` · `DELETE /v1/catalog/controls/{id}/evidence-templates[/{template_id}]` | `evidence_template_id`, `sequence?` (1…N+1; sin ella, al final) |
| `POST` · `DELETE /v1/catalog/controls/{id}/dimensions[/{dimension}]` | `dimension`, `type`, `requires_probe?`, `requires_ai?`, `requires_compliance_confirmation?` |
| `POST` · `DELETE /v1/catalog/causes/{id}/controls[/{control_id}]` | `control_id` |
| `POST` · `DELETE /v1/catalog/risks/{id}/causes[/{cause_id}]` | `cause_id` |

Apoyo para elegir a qué se vincula un control: `GET /v1/catalog/frameworks/{id}/points-of-focus?requirement_code=` → `{ items: [{ id, framework_code, requirement_code, number, description, controls_count }] }`.

### Reglas que el servidor impone

- `code` único dentro de su tipo → `409 CODE_ALREADY_EXISTS`; un vínculo repetido → `409 LINK_ALREADY_EXISTS`.
- Lo que ve el cliente de una prueba (`display_name`, `display_description`) **nunca nombra al proveedor de la sonda** (SEG-39, D70) → `422` con `text.names_provider`. Es la misma regla que valida `catalog:load`.
- El prefijo del código de una prueba corresponde a su dimensión → `422` `code.dimension_mismatch`.
- Una prueba solo se vincula a un control que tenga su dimensión → `422` `dimension.not_in_control`.
- Las secuencias de evidencia de un control son únicas y **contiguas desde 1**: al insertar en medio se corren las siguientes; al quitar una se cierra el hueco. Una posición fuera de rango → `422` `sequence.range`.
- `409 CATALOG_ITEM_IN_USE` cuando el cambio dejaría a un control activo sin nada que medir: desvincular o dar de baja **la única prueba** de un control activo, o quitar una dimensión de la que el control todavía usa pruebas.
- **Lo dado de baja deja de ofrecerse a los servicios nuevos** (el clonado salta controles, pruebas, plantillas, riesgos y causas inactivos), pero **no cambia las copias que las empresas ya clonaron** (D28). La propagación a las existentes (A4) sigue fuera de esta entrega.

## Listas de opciones del Admin

Los selects del formulario (`dimension`, `control_type`, `risk_criterion`, `failure_category`) y los filtros (`dimension`, `catalog_origin`) se llenan con `GET /v1/catalogs/{name}`, igual que en Platform (`enums.md`); el Admin no tiene listas propias. El `Accept-Language` lo manda el interceptor de autenticación.

## Seed y auditoría

- `catalog:load` y `catalog:verify` **solo miran lo del comité** (`origin = committee`). Lo agregado desde Admin y sus vínculos se ignoran; el cargador lo cuenta aparte («Ignoradas…»).
- Una fila del **comité que se editó desde Admin** aparece como conflicto (el seed nunca sobrescribe), marcada **«[editado desde Monkey Admin]»** gracias al rastro `catalog.*.update|deactivate|reactivate` de `audit.audit_logs`. Qué versión queda es una decisión con el comité al cargar el Excel nuevo.

## Errores

| HTTP | `error.code` | Cuándo |
|---|---|---|
| 403 | `FORBIDDEN` | El rol no es `admin_monkey` |
| 404 | `NOT_FOUND` | El elemento no existe |
| 409 | `CODE_ALREADY_EXISTS` | `code` repetido |
| 409 | `LINK_ALREADY_EXISTS` | El vínculo ya existe |
| 409 | `CATALOG_ITEM_IN_USE` | Dar de baja o desenlazar lo que otro elemento activo necesita |
| 422 | `VALIDATION_FAILED` | `required`, `enum.invalid`, `uuid.invalid`, `text.names_provider`, `code.dimension_mismatch`, `dimension.not_in_control`, `sequence.range` |

## Preguntas abiertas

- ~~Editar una fila del comité desde Admin~~ **Decidido (2026-10-17):** conserva su `origin: committee`, queda en la auditoría y el seed la marca como editada al cargar el Excel nuevo (ver «Seed y auditoría»).
- **Cuánto se reutiliza en el siguiente marco:** los riesgos y las causas son compartidos (decidido); falta saber cuántos controles de SOC 2 cubren los requisitos del próximo marco. El Excel de SOC 2 es específico de SOC 2 (códigos y dominios): el comité entregará el mapeo del siguiente.
- **Versionado y propagación (A4):** fuera de esta entrega. Hasta que exista, lo que se agrega en Admin no llega a empresas que ya contrataron.
- **Quién edita:** hoy cualquier `admin_monkey`. Si el comité quiere un rol propio de editor de catálogo, es parte de `P3`.
- **Pruebas automáticas nuevas:** necesitan comprobaciones (`checks`) asociadas; este contrato no cubre cargarlas.

## Estado de implementación

**Lectura construida (2026-10-17)**, rama `feat/admin-catalog-read` del Backend: módulo `catalog-admin` (`GET /v1/catalog/…` de arriba) y la migración `20261017100000_catalog_origin_and_active`, que agrega `origin` (`committee`/`monkey_admin`) a controles, riesgos, causas, pruebas y plantillas de evidencia, e `is_active` a todas menos riesgos (ya lo tenían). Lo existente queda como `committee` y activo. Probado contra la base real (solo lectura) y con 15 pruebas e2e, cuyas cifras salen del JSON del catálogo.

- **CPL-1** («SOC 2 - Descripción del Sistema») no cuelga de ningún requisito: es intencional del comité (`EXPECTED_UNASSIGNED_CONTROLS`). Por eso el marco cuenta 118 controles y el catálogo 119; ``unlinked=true`` lo encuentra.
- ``GET /v1/catalog/controls`` no estaba en la propuesta original: se agregó al ver CPL-1.
- Los listados filtran por ``is_active`` y ``origin``, pero hoy ninguna fila está dada de baja ni viene de Monkey Admin.

**Monkey Admin, solo lectura (2026-10-17)**, rama `feat/admin-catalog-ui` del Frontend (Admin): entrada «Catálogo maestro» en el menú (ruta `/catalog`, solo `admin_monkey`). Los marcos como tarjetas con sus conteos; cinco pestañas (controles, riesgos, causas, pruebas, evidencias requeridas) con búsqueda y filtros de origen y estado; en controles, el ámbito (del marco · todo el catálogo · sin requisito) y «sin evidencia requerida»; en pruebas, la dimensión. Un panel lateral muestra el detalle de un control, riesgo, causa o prueba; el de la prueba separa lo que ve el cliente de los textos internos del comité. Las plantillas de evidencia no tienen detalle propio.

**Escritura construida (2026-10-17)**, rama `feat/admin-catalog-write` del Backend: los `POST`/`PATCH`/`DELETE` y los vínculos de arriba, la auditoría `catalog.*`, la regla de baja en el clonado (`clone-catalog.service.ts`), `GET /v1/catalog/evidence-templates/{id}` y `GET /v1/catalog/frameworks/{id}/points-of-focus`, y el ajuste de `catalog:load` / `catalog:verify`. Probada con 22 pruebas e2e nuevas (y las 15 de lectura, ahora restringidas a `origin=committee` porque las de escritura agregan filas a la misma base); la suite completa pasa dos veces seguidas.

**Monkey Admin, escritura (2026-10-17)**, rama `feat/admin-catalog-forms` del Frontend (Admin): botón «Nuevo» en cada pestaña (control, riesgo, causa, evidencia requerida, prueba) con un formulario común; los errores por campo del backend salen junto a cada campo, y los textos del comité de una prueba van en una sección aparte y opcional. Desde el panel de detalle: **Editar** (solo se manda lo que cambió), **Dar de baja** (con confirmación; no borra) y **Reactivar**, y agregar o quitar vínculos con un selector que busca entre lo activo y deja fuera lo ya vinculado (puntos de enfoque por marco y requisito; pruebas solo de las dimensiones del control; evidencias con posición opcional; dimensiones; causas y riesgos desde cualquiera de los dos lados). Un elemento recién creado se abre para vincularlo. La plantilla de evidencia tiene ahora un detalle corto. El detalle de un control devuelve el `id` de cada punto de enfoque para poder desvincularlo (Backend `feat/catalog-pof-id`).

**Por construir:** la propagación a las copias de las empresas (A4) y la versión de catálogo que se publica.
