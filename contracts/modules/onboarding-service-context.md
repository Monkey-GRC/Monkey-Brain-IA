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
| `framework_codes` | array&lt;enum&gt; | sí | `framework` (6) | `N:M` vía `service_frameworks` |
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

- Los **controles se clonan** a `client_controls` — el cliente reescribe su interpretación.
- Los **requisitos y puntos de enfoque se referencian con FK** al catálogo maestro: son texto de
  un estándar, no se copian.
- `risks` y `causes` se clonan como set base.

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
| **Regulación a nivel de servicio** | El modelo solo define `organization_regulations` (§6.1). Falta decidir si se añade `service_regulations` o si la regulación se declara solo a nivel de empresa. Mientras tanto, `regulation_codes` se acepta en el request pero **no tiene dónde persistir** |
| **Descripción del Sistema: enlace o archivo** | El Excel dice enlace, `onboarding.md` decía adjunto. El contrato soporta ambas con `kind`; hay que cerrar cuál se construye |
| **`business_model` y `services.type`** | El Excel gana sobre el modelo (11 tipos de servicio, no 5). Hay que corregir el enum en `modelo-datos.md` §6.2 |
