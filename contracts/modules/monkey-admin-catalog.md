---
id: contracts-monkey-admin-catalog
name: Contrato — Monkey Admin, catálogo maestro
description: Ver y gestionar el catálogo maestro (marcos, controles, riesgos, causas, pruebas y evidencias) desde Monkey Admin.
type: contract
---

# Monkey Admin — catálogo maestro

**Estado: PROPUESTA (2026-10-17). Nada de esto está construido.** Ver `conventions.md` y `enums.md`. Entidades: todo el schema `catalog` (`modelo-datos.md` §3). **App:** Monkey Admin. **Quién:** solo `admin_monkey`; cualquier otro rol recibe `403`.

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
| `GET /v1/catalog/frameworks` | Marcos: `id`, `code`, `name`, `version`, `type`, `availability` y **conteos** (requisitos, controles, pruebas) |
| `GET /v1/catalog/frameworks/{id}` | El marco con sus criterios de confianza y requisitos (`code`, `criterion`, `controls_count`) |
| `GET /v1/catalog/frameworks/{id}/controls` | Controles del marco. Filtros: `search`, `domain`, `requirement_code`, `has_evidence_template`, `is_active`. Cada uno: `code`, `name`, `domain`, `dimensions`, `tests_count`, `evidence_templates_count` |
| `GET /v1/catalog/controls/{id}` | Detalle: descripción, `source_ref`, puntos de enfoque (requisito + número), dimensiones, pruebas, plantillas de evidencia (con su `sequence`), políticas y causas que lo mitigan |
| `GET /v1/catalog/risks` · `GET /v1/catalog/risks/{id}` | Riesgos globales; el detalle trae sus causas |
| `GET /v1/catalog/causes` · `GET /v1/catalog/causes/{id}` | Causas globales; el detalle trae sus riesgos y controles |
| `GET /v1/catalog/tests` · `GET /v1/catalog/tests/{id}` | Pruebas; el detalle trae los campos del comité, `display_name`, `display_description` y los controles que la usan |
| `GET /v1/catalog/evidence-templates` | Plantillas de evidencia (`code`, `description`, `dimension`) y a cuántos controles sirven |

`has_evidence_template=false` es la consulta que lista los controles sin evidencia requerida.

## Escritura

Solo `admin_monkey`. Cada llamada deja su fila de auditoría, en la misma transacción.

| Endpoint | Cuerpo | Notas |
|---|---|---|
| `POST /v1/catalog/frameworks/{id}/controls` | `code`, `name`, `description`, `domain`, `point_of_focus_ids[]` | `201`; `origin: "monkey_admin"` |
| `PATCH /v1/catalog/controls/{id}` | claves presentes: `name`, `description`, `domain` | |
| `DELETE /v1/catalog/controls/{id}` | — | **Baja lógica** (`is_active=false`) → `204` |
| `POST` · `PATCH` · `DELETE` sobre `/v1/catalog/risks`, `/causes`, `/evidence-templates`, `/tests` | los campos de cada una | Mismas reglas. Una **prueba nueva** exige además `display_name` y `display_description` |
| `POST` / `DELETE /v1/catalog/controls/{id}/evidence-templates` | `evidence_template_id`, `sequence` | La secuencia queda contigua desde 1 |
| `POST` / `DELETE /v1/catalog/controls/{id}/tests` | `test_id` | |
| `POST` / `DELETE /v1/catalog/causes/{id}/controls` · `/risks/{id}/causes` | `control_id` · `cause_id` | |
| `POST` / `DELETE /v1/catalog/controls/{id}/dimensions` | `dimension`, `type`, `requires_probe`… | |

**Reglas que el servidor impone** (las mismas que hoy valida `catalog:load` con `validateCatalog`):
- `code` único dentro de su tipo → `409 CODE_ALREADY_EXISTS`.
- Ningún nombre ni descripción visible para el cliente nombra al proveedor de la sonda (`[confidencialidad]`, SEG-39) → `422`.
- Una prueba pertenece a **una sola dimensión**. Las secuencias de evidencia son contiguas.
- Dar de baja algo que otro elemento activo del catálogo necesita (p. ej. la única prueba de un control) → `409 CATALOG_ITEM_IN_USE`.
- Nada de esto cambia las copias que ya tienen las empresas (D28).

## Qué hay que construir que hoy no existe

1. **Columnas** `origin` (`committee`/`monkey_admin`) en `controls`, `risks`, `causes`, `tests`, `evidence_templates`; `is_active` en las que no lo tienen (hoy solo `risks`).
2. **Endpoints** de las dos tablas de arriba.
3. **Seed:** `catalog:load` hoy aborta si una fila difiere. Debe distinguir lo editado desde Admin (no lo trata como conflicto con el Excel, lo reporta aparte) y no tocar filas `monkey_admin`.
4. **Auditoría** `catalog.*` (`control.create`, `control.update`, `control.deactivate`, …).
5. **Monkey Admin:** la sección completa (hoy solo tiene Empresas y Usuarios).

## Errores

| HTTP | `error.code` | Cuándo |
|---|---|---|
| 403 | `FORBIDDEN` | El rol no es `admin_monkey` |
| 404 | `NOT_FOUND` | El elemento no existe |
| 409 | `CODE_ALREADY_EXISTS` | `code` repetido |
| 409 | `CATALOG_ITEM_IN_USE` | Dar de baja o desenlazar lo que otro elemento activo necesita |
| 422 | `VALIDATION_FAILED` | `required`, `enum.invalid`, `uuid.invalid`, y el que nombra al proveedor |

## Preguntas abiertas

- **Editar una fila del comité desde Admin.** ¿Se marca como modificada (para que el seed la reporte), o se pierde su procedencia? Propuesta: conservar `origin: committee` y registrar la edición en la auditoría; el seed la muestra en un diff aparte.
- **Cuánto se reutiliza en el siguiente marco:** los riesgos y las causas son compartidos (decidido); falta saber cuántos controles de SOC 2 cubren los requisitos del próximo marco. El Excel de SOC 2 es específico de SOC 2 (códigos y dominios): el comité entregará el mapeo del siguiente.
- **Versionado y propagación (A4):** fuera de esta entrega. Hasta que exista, lo que se agrega en Admin no llega a empresas que ya contrataron.
- **Quién edita:** hoy cualquier `admin_monkey`. Si el comité quiere un rol propio de editor de catálogo, es parte de `P3`.
- **Pruebas automáticas nuevas:** necesitan comprobaciones (`checks`) asociadas; este contrato no cubre cargarlas.
