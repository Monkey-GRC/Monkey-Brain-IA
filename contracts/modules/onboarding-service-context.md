---
id: contracts-onboarding-c2
name: Contrato — Onboarding Componente 2 (Contexto del Servicio)
description: Los 16 campos del Contexto del Servicio, repetible por servicio. Dispara el clonado del catálogo.
type: contract
---

# Componente 2 — Contexto del Servicio

Se llena **una vez por servicio**; un cliente puede declarar varios. Ver `conventions.md` y
`enums.md`.

`services.deployment_scenario` también es columna de `services`, pero se captura en el
Componente 3 — ver `onboarding-technical-control.md`.

**Entidades:** `services`, `service_trust_criteria`, `service_frameworks`,
`subservice_organizations`, `csocs`, `cuecs`, `system_descriptions`
(`modelo-datos.md` §6.2).
**Rol:** `admin_empresa`. **App:** Monkey Platform.

## Campos — 16 del Excel en 15 claves del request

13 obligatorios + 3 opcionales según el Excel. Viajan en **15 claves** porque
`subservicios_nube` y `subservicios_detalle` colapsan en el array
`subservice_organizations`, que es como el modelo lo declara (§6.2). Los 16 campos persisten;
ninguno se pierde.

| Campo | Tipo | Oblig. | Enum | Columna |
|---|---|---|---|---|
| `name` | string | sí | — | `services.name` |
| `description` | text | sí | — | `services.description` |
| `scope_statement` | text | sí | — | `services.scope_statement` |
| `type` | enum | sí | `service_type` (11) | `services.type` |
| `industries_served` | array&lt;enum&gt; | sí | `served_industry` (11) | `services.industries_served` (json) |
| `active_client_count` | enum | **no** | `active_client_count` | `services.active_client_count` |
| `countries` | array&lt;enum&gt; | sí | `service_country` (24) | `services.countries` (json) |
| `data_types` | array&lt;enum&gt; | sí | `data_type` (8) | `services.data_types` (json) |
| `trust_criteria` | array&lt;enum&gt; | sí | `trust_criterion` (5) | `N:M` vía `service_trust_criteria` |
| `subservice_organizations` | array&lt;objeto&gt; | sí | `subservice_type` (7) | `1:N` → `subservice_organizations` |
| `framework_codes` | array&lt;enum&gt; | sí | `framework` (1 en el MVP: `soc2`) | `N:M` vía `service_frameworks` |
| `regulation_codes` | array&lt;enum&gt; | sí | `regulation` | ⚠️ **sin tabla puente** — ver abajo |
| `previous_certification` | enum | **no** | `previous_certification` | `services.previous_certification` |
| `expected_availability` | enum | sí | `expected_availability` | `services.expected_availability` |
| `system_description` | objeto | sí | — | `1:1` → `system_descriptions` |

`subservice_organizations[]` desglosa en un array lo que el Excel pide como dos campos
(`subservicios_nube` multi-select + `subservicios_detalle` texto opcional), porque el modelo lo
declara como tabla con una fila por proveedor:

```json
{ "type": "aws", "provider": "Amazon Web Services", "service_provided": "Cómputo y almacenamiento", "responsibility": "Disponibilidad de infraestructura y parcheo del hipervisor" }
```

`provider`, `service_provided` y `responsibility` son opcionales (el "detalle" del Excel lo es);
`type` no.

**`trust_criteria` siempre incluye `security`.** El servidor lo añade si falta, no lo rechaza.
El atajo de UI *"Cobertura completa sugerida por Monkey"* marca los cinco pero **no viaja como
valor**: el request lleva los cinco explícitos.

## `POST /v1/services` — declarar un servicio

```json
{
  "name": "Mesa de servicio gestionada",
  "description": "Soporte de primer y segundo nivel para clientes corporativos, 24/7.",
  "scope_statement": "Se presta a clientes del sector financiero en Colombia y México. El foco de cumplimiento es la confidencialidad de los datos de sus usuarios finales.",
  "type": "service_desk",
  "industries_served": ["financial", "retail"],
  "active_client_count": "from_11_to_50",
  "countries": ["co", "mx"],
  "data_types": ["pii", "business", "logs"],
  "trust_criteria": ["security", "confidentiality", "availability"],
  "subservice_organizations": [
    { "type": "azure", "provider": "Microsoft Azure", "service_provided": "Hosting de la plataforma", "responsibility": "Disponibilidad de infraestructura" },
    { "type": "on_premise", "provider": null, "service_provided": "Centro de datos propio", "responsibility": null }
  ],
  "framework_codes": ["soc2"],
  "regulation_codes": ["ley_1581_co", "lfpdppp_mx"],
  "previous_certification": "none",
  "expected_availability": "24x7",
  "system_description": { "kind": "link", "url": "https://docs.ejemplo.com/system-description-v2.pdf" }
}
```

`201`:

```json
{
  "statusCode": 201,
  "message": "service.created",
  "data": {
    "id": "5c2e8a41-7b9d-4e03-a1f6-8d40c2b7e915",
    "organization_id": "3d9a7c11-42f8-4b6e-9c05-7ae1b2d34f60",
    "name": "Mesa de servicio gestionada",
    "type": "service_desk",
    "trust_criteria": ["security", "availability", "confidentiality"],
    "frameworks": [
      {
        "code": "soc2",
        "name": "SOC 2 — Trust Services Criteria",
        "contracted_at": "2026-10-05",
        "status": "active",
        "catalog_version": 1,
        "evaluation_period": "2026-Q4"
      }
    ],
    "subservice_organizations": [
      { "id": "a7f3...", "type": "azure", "provider": "Microsoft Azure", "service_provided": "Hosting de la plataforma", "responsibility": "Disponibilidad de infraestructura" },
      { "id": "b2e9...", "type": "on_premise", "provider": null, "service_provided": "Centro de datos propio", "responsibility": null }
    ],
    "system_description": { "id": "d4c1...", "kind": "link", "url": "https://docs.ejemplo.com/system-description-v2.pdf", "sections": [] },
    "catalog": {
      "status": "ready",
      "applicable_requirements": 33,
      "cloned_controls": 78,
      "message": "catalog.cloned"
    },
    "completion": { "required_total": 13, "required_filled": 13, "optional_total": 3, "optional_filled": 3 },
    "is_complete": true,
    "created_at": "2026-10-05T10:22:41Z",
    "updated_at": "2026-10-05T10:22:41Z"
  }
}
```

### El bloque `catalog`

Elegir marco **dispara el clonado sin acción manual** (criterio de aceptación del sprint). Lo que
ocurre, según la decisión D3:

- Los **controles se clonan** a `client_controls` — el cliente reescribe su interpretación — junto con
  sus dimensiones (`client_control_dimensions`), el vínculo a sus tests (`client_control_tests`) y sus
  evidencias requeridas (`evidence_requirements`, desde las plantillas del catálogo).
- Los **requisitos, puntos de enfoque y tests se referencian con FK** al catálogo maestro: son texto
  de un estándar o procedimientos que el cliente no edita, no se copian.
- `risks` y `causes` se clonan como set base (`client_risks`, `client_causes`).

`applicable_requirements` cuenta los requisitos filtrados por los `trust_criteria` contratados:
contratar solo `security` no trae los de privacidad. `catalog.status` es `ready` o `processing`
(entonces `202` y se consulta con `GET /v1/services/{id}`).

## `GET /v1/services` — listar

Paginado. Cada elemento trae `id`, `name`, `type`, `is_complete`, `frameworks[].code` y
`catalog.status`.

## `GET /v1/services/{id}` · `PATCH /v1/services/{id}` · `DELETE /v1/services/{id}`

`PATCH` con las claves presentes. Cambiar `trust_criteria` o `framework_codes` **recalcula los
requisitos aplicables**; quitar un marco ya contratado no borra `client_controls`: pasa
`service_frameworks.status` a inactivo y lo dice en el response.

`DELETE` devuelve `409 SERVICE_HAS_EVALUATIONS` si el servicio ya tiene evaluaciones: el
histórico es inmutable.

## `POST /v1/services/{id}/system-description` — cargar el documento

⚠️ **Forma pendiente** — el Excel pide "enlace o ruta" y `system_descriptions.file_path` es un
`string`, pero `modulos/onboarding.md` decía "adjunto". El contrato soporta las dos y lo marca
con `kind`:

```json
{ "kind": "link", "url": "https://..." }
```

Para archivo, `multipart/form-data` con `kind=file` y el binario en `file`. Máximo 25 MB,
`application/pdf` o `.docx`.

`system_descriptions.sections` es un json con las **10 secciones AICPA**; hay **una Descripción
del Sistema por servicio**. El response devuelve `sections` como array de las detectadas (vacío
si aún no se procesó el documento).

Las secciones 7 y 8 alimentan `csocs` y `cuecs`, tablas propias **marcadas como no medibles por
Monkey** (decisión D11): existen porque el auditor las pide.

### `PUT /v1/services/{id}/csocs` · `PUT /v1/services/{id}/cuecs`

Cada una recibe un array de `expected_control` (texto). `csocs` cuelga de un
`subservice_organization`, así que lleva su id; `cuecs` cuelga del servicio.

```json
{ "items": [ { "subservice_organization_id": "a7f3...", "expected_control": "El proveedor cifra los datos en reposo con AES-256." } ] }
```

No se puntúan ni entran al cálculo: se transcriben para el informe.

## Errores

| HTTP | `error.code` | Cuándo |
|---|---|---|
| 409 | `ORGANIZATION_NOT_DECLARED` | Se declara un servicio antes del Componente 1 |
| 409 | `SERVICE_NAME_TAKEN` | Ya existe un servicio con ese nombre en la organización |
| 409 | `FRAMEWORK_NOT_CONTRACTED` | Se eligió un marco que la empresa no tiene contratado |
| 409 | `SERVICE_HAS_EVALUATIONS` | `DELETE` sobre un servicio ya evaluado |
| 413 | `FILE_TOO_LARGE` | La Descripción del Sistema pasa de 25 MB |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Tipo de archivo no permitido |
| 422 | `VALIDATION_FAILED` | Enum inválido, multi-select obligatorio vacío, `subservice_organizations` sin `type` |
| 422 | `TRUST_CRITERION_REQUIRED` | Se intentó quitar `security` |

Claves i18n: `service.created`, `service.list`, `service.updated`, `service.deleted`,
`service.name_taken`, `service.has_evaluations`, `organization.not_declared`,
`framework.not_contracted`, `trust_criterion.security_required`, `catalog.cloned`,
`catalog.processing`, `system_description.uploaded`, `file.too_large`,
`file.unsupported_type`, `validation.failed`.

## Notas

- El Componente 2 es **repetible**: la lista de servicios pagina desde el principio.
- `service_frameworks` guarda `catalog_version_id` y `evaluation_period`: es lo que evita que un
  control nuevo mueva el número a mitad de periodo (decisión A4).
- El cumplimiento de un marco **se deriva** recorriendo requisitos → puntos de enfoque →
  controles. No se devuelve como atributo del marco.
- Nada de este contrato expone códigos técnicos (`CC6.1`) como prosa al cliente: viajan como
  dato, y la vista que los muestra es el "modo auditor" (`philosophy.md`).

## Preguntas abiertas

| Qué | Estado |
|---|---|
| **Regulación a nivel de servicio** | ✅ Resuelta por desarrollo (D41): tabla `service_regulations`. Pendiente de ratificar con el comité |
| **Descripción del Sistema: enlace o archivo** | ◐ Se construyó **solo el enlace** (D41). El archivo queda pendiente: no hay dónde guardar binarios todavía |
| **`business_model` y `services.type`** | El Excel gana sobre el modelo (11 tipos de servicio, no 5). Hay que corregir el enum en `modelo-datos.md` §6.2 |
| **Dimensiones de los controles clonados** | `control_dimensions` está vacío en el catálogo (P10): los controles se clonan sin dimensiones y como `manual` hasta que se siembren |

## Estado de implementación (2026-09-30)

Implementado en `Backend/src/features/services` (más `catalogs` y el progreso de `auth`) y en
`Frontend-Platform/src/app/features/services` (asistente y «Mis servicios»). Decisiones D41.

| Endpoint | Estado |
|---|---|
| `POST /v1/services` | ✅ Solo `admin_empresa`. Crea el servicio **y clona el catálogo en la misma transacción**; el `201` ya trae `catalog.status = ready` |
| `GET /v1/services` | ✅ Paginado: `id`, `name`, `type`, `is_complete`, `frameworks[]`, `catalog` y `created_at` |
| `GET /v1/services/{id}` | ✅ Todos los campos declarados (el response del `201` los trae igual, para que la pantalla de edición no pida dos veces) |
| `PATCH /v1/services/{id}` | ✅ Solo las claves presentes (`null` borra un opcional). Ampliar `trust_criteria` o `framework_codes` recalcula y clona lo que falte; no borra ni pisa nada |
| `DELETE /v1/services/{id}` | ✅ `409 SERVICE_HAS_EVALUATIONS` con evaluaciones, evidencias entregadas o planes de acción; si no, borra todo lo del servicio |
| `POST /v1/services/{id}/system-description` | ◐ Solo `kind = link` (`http`/`https`). `kind = file` → 422 |
| `PUT .../csocs` y `PUT .../cuecs` | ❌ No se construyeron (salen de las secciones 7 y 8 de la Descripción del Sistema, que aún no se procesa) |
| `GET /v1/catalogs/{name}` | ✅ Nuevos: `service_type`, `served_industry`, `active_client_count`, `service_country`, `data_type`, `trust_criterion`, `subservice_type`, `expected_availability`, `previous_certification` y `frameworks` (sale de `catalog.frameworks`: hoy solo `soc2`) |

- **Aislamiento:** RLS por `tenant_id` entre empresas; entre servicios de la misma empresa, el filtro por
  `service_id` (cada servicio tiene su propia copia: único `service_id + control_id`). Un servicio de otra
  empresa responde `404`, no `403`.
- **Qué se clona y cómo:** ver D41 (puntos 4 a 9). Con `security + availability + confidentiality`:
  38 requisitos y 86 controles; con los 5 criterios: 61 y 118. Más 10 riesgos, 56 causas y sus relaciones.
- **Validación** (todos los errores a la vez): valores fuera de catálogo (`enum.invalid`), listas vacías
  (`array.min`) o repetidas (`array.unique`), «Ninguna» con otras (`regulation.none_exclusive`), enlace
  inválido (`url.invalid`), marco que no existe (`framework_codes: enum.invalid`).
  `ORGANIZATION_NOT_DECLARED` si falta el Componente 1; `SERVICE_NAME_TAKEN` por nombre repetido en la
  empresa (sin importar mayúsculas). `FRAMEWORK_NOT_CONTRACTED` y `TRUST_CRITERION_REQUIRED` no se usan:
  no hay contratación de marcos a nivel de empresa y el servidor añade `security` en vez de rechazar.
- **Auditoría:** `service.create`, `service.update`, `service.system_description` y `service.delete` en
  `audit_logs`, con el estado antes y después (CC9.2).
- **Progreso:** `GET /v1/auth/me` añade `service_context` a `onboarding.completed_steps` cuando hay al
  menos un servicio con marco activo y Descripción del Sistema; entonces `next_step = technical_control`.
- **Pantalla (Platform):** 6 pantallas cortas y una de revisión; el avance se guarda en el navegador y,
  al terminar, se muestran los requisitos y controles preparados sin jerga. «Mis servicios» lista, edita
  y elimina (con confirmación).
