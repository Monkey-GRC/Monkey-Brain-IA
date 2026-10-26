---
id: contracts-onboarding-c2
name: Contrato — Onboarding Componente 2 (Contexto del Servicio)
description: Los 16 campos del Contexto del Servicio, repetible por servicio. Dispara el clonado del catálogo.
type: contract
---

# Componente 2 — Contexto del Servicio

Se llena **una vez por servicio**; un cliente puede declarar varios. Ver `conventions.md` y
`enums.md`.

`services.deployment_scenario` sigue siendo columna de `services`, pero **ya no se captura en ningún lado** (D92):
el cliente elige la plataforma al conectar — ver `onboarding-technical-control.md`.

**Entidades:** `services`, `service_trust_criteria`, `service_frameworks`,
`subservice_organizations`, `csocs`, `cuecs`, `system_descriptions`
(`modelo-datos.md` §6.2).
**Rol:** `admin_empresa`. **App:** Monkey Platform.

## Campos — 16 del Excel, 15 claves, 14 en el request (D51)

13 obligatorios + 3 opcionales según el Excel. Viajan en **15 claves** porque
`subservicios_nube` y `subservicios_detalle` colapsan en el array
`subservice_organizations`, que es como el modelo lo declara (§6.2).

> **Cambios de D50/D51 (2026-10-05), a petición del comité:**
> - **`regulation_codes` ya no existe en el servicio:** las leyes de protección de datos aplican a la empresa, no al
>   servicio, y se declaran una vez en el Componente 1. La tabla `service_regulations` se eliminó. Quedan 12 campos
>   obligatorios (`completion.required_total = 12`).
> - **`system_description` es opcional al crear** y admite **enlace, archivo o los dos** (al menos uno para que el servicio
>   esté completo). Ver «Descripción del Sistema» abajo.
> - **El nombre del proveedor ya no se pregunta** en la pantalla (el `type` ya lo identifica); `provider` sigue siendo un
>   campo opcional del contrato, simplemente no se captura hoy.
> - **`framework_codes`:** la pantalla muestra todos los marcos y solo deja elegir los contratados (D50).
> - **`previous_certification`** pasó de 4 a 8 valores.

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
| `framework_codes` | array&lt;enum&gt; | sí | `framework` (solo se elige uno contratado; hoy `soc2`) | `N:M` vía `service_frameworks` |
| `previous_certification` | enum | **no** | `previous_certification` (8) | `services.previous_certification` |
| `expected_availability` | enum | sí | `expected_availability` | `services.expected_availability` |
| `system_description` | objeto | sí (se puede completar después) | — | `1:1` → `system_descriptions` (`link_url` y/o `file_key`) |

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
    "system_description": { "id": "d4c1...", "url": "https://docs.ejemplo.com/system-description-v2.pdf", "file_name": "descripcion-del-sistema.pdf", "sections": [] },
    "catalog": {
      "status": "ready",
      "applicable_requirements": 33,
      "cloned_controls": 78,
      "message": "catalog.cloned"
    },
    "completion": { "required_total": 12, "required_filled": 12, "optional_total": 3, "optional_filled": 3 },
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

## Descripción del Sistema: enlace y/o archivo (D51)

El cliente la entrega con **un enlace, un archivo de su equipo, o los dos**; con uno basta para que el servicio esté
completo. `system_descriptions` guarda `link_url` y `file_key` (los dos opcionales, al menos uno obligatorio por un `CHECK`):
un enlace nuevo no borra el archivo ni al revés. El archivo vive en el almacenamiento S3 / minio
(`FileStorage`, `src/infrastructure/storage`; variables `S3_*`, y `S3_PUBLIC_ENDPOINT` para que el enlace firmado lleve la dirección que abre el navegador), con una llave
`<empresa>/services/<servicio>/system-description/<uuid>/<nombre>`: **la llave nunca sale en un response**.

Como el archivo necesita que el servicio exista, con archivo el flujo es: `POST /v1/services` **sin** `system_description`
(o con el enlace) y luego `POST /v1/services/{id}/system-description/file`.

### `POST /v1/services/{id}/system-description` — el enlace (JSON)

| Endpoint | Qué hace |
|---|---|
| `POST /v1/services/{id}/system-description` | Guarda el enlace: `{ "kind": "link", "url": "https://..." }` (`http`/`https`) |
| `POST /v1/services/{id}/system-description/file` | `multipart/form-data`, el binario en el campo `file`. **Máximo 25 MB, PDF o `.docx`**; se valida también la firma del archivo, no solo el tipo que declara el navegador |
| `GET /v1/services/{id}/system-description/file` | `{ url, file_name, expires_in }`: una URL temporal (5 min) para descargar; el bucket no es público. `404 SYSTEM_DESCRIPTION_NOT_A_FILE` si solo hay enlace |

### `POST /v1/services/{id}/system-description/file` — el archivo (multipart)

`multipart/form-data` con el binario en el campo `file`. Máximo **25 MB**, `application/pdf` o `.docx`: se valida la
extensión **y la firma del archivo** (un PDF empieza por `%PDF-`, un `.docx` es un zip), no el tipo que declara el navegador.
Reemplaza el archivo anterior (que se borra del almacenamiento). `200` con el servicio, como el enlace.
Errores: `422 FILE_REQUIRED`, `413 FILE_TOO_LARGE`, `415 UNSUPPORTED_MEDIA_TYPE`, `503 STORAGE_UNAVAILABLE` (sin `S3_*`).

### `GET /v1/services/{id}/system-description/file` — descargarlo

`200` con `{ "url": "<enlace temporal>", "file_name": "...", "expires_in": 300 }`. El bucket nunca es público: el enlace se
pide autenticado, es de un solo servicio y vence a los 5 minutos. `404 SYSTEM_DESCRIPTION_NOT_A_FILE` si solo hay enlace.

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
| 409 | `FRAMEWORK_NOT_CONTRACTED` | Se eligió un marco que Monkey Admin no contrató para la empresa (`platform.company_frameworks`, D47). La pantalla muestra todos los marcos y, ante este caso, invita a hablar con mercadeo (D50) |
| 409 | `SERVICE_HAS_EVALUATIONS` | `DELETE` sobre un servicio ya evaluado |
| 409 | `FRAMEWORK_NOT_AVAILABLE` | El marco existe en el catálogo pero aún no está construido (`coming_soon`, D50) |
| 413 | `FILE_TOO_LARGE` | La Descripción del Sistema pasa de 25 MB (un archivo de **exactamente** 25 MB es válido) |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Tipo de archivo no permitido (ni extensión ni firma de PDF o .docx) |
| 422 | `FILE_REQUIRED` | El multipart no trae el campo `file` o viene vacío |
| 503 | `STORAGE_UNAVAILABLE` | Esta instalación no tiene almacenamiento configurado (`S3_*`): el cliente usa el enlace |
| 422 | `VALIDATION_FAILED` | Enum inválido, multi-select obligatorio vacío, `subservice_organizations` sin `type` |
| 422 | `TRUST_CRITERION_REQUIRED` | Se intentó quitar `security` |

Claves i18n: `service.created`, `service.list`, `service.updated`, `service.deleted`,
`service.name_taken`, `service.has_evaluations`, `organization.not_declared`,
`framework.not_contracted`, `trust_criterion.security_required`, `catalog.cloned`,
`catalog.processing`, `service.system_description_saved`, `service.system_description_file`, `file.required`, `file.too_large`,
`file.unsupported_type`, `file.storage_unavailable`, `file.not_a_file`, `framework.not_available`, `validation.failed`.

## Notas

- El Componente 2 es **repetible**: la lista de servicios pagina desde el principio.
- `service_frameworks` guarda `catalog_version_id` y `evaluation_period`: es lo que evita que un
  control nuevo mueva el número a mitad de periodo (decisión A4).
- El cumplimiento de un marco **se deriva** recorriendo requisitos → puntos de enfoque →
  controles. No se devuelve como atributo del marco.
- Nada de este contrato expone códigos técnicos (`CC6.1`) como prosa al cliente: viajan como
  dato, y solo los muestra la vista técnica (`admin_empresa`, `consultor` y `auditor`; `philosophy.md`, D63, D81).

## Preguntas abiertas

| Qué | Estado |
|---|---|
| **Regulación a nivel de servicio** | ✅ Cerrada (D51, 2026-10-05, a petición del comité): **se retira**. Las leyes aplican a la empresa (Componente 1). Revierte D45 y elimina `service_regulations` |
| **Descripción del Sistema: enlace o archivo** | ✅ Cerrada (D51): enlace, archivo o los dos. El archivo se guarda en S3 / minio. Probado contra el minio real de la VPS (MD-110, 2026-10-17). Falta procesar las 10 secciones (DT-12) |
| **Categorías de cada marco** | ✅ Decidido (D50): cada marco usa sus **categorías nativas**, no las 5 de SOC 2. No se migra el schema hasta sembrar el primer marco que no sea SOC 2 (DT-38) |
| **`business_model` y `services.type`** | El Excel gana sobre el modelo (11 tipos de servicio, no 5). Hay que corregir el enum en `modelo-datos.md` §6.2 |
| **Dimensiones de los controles clonados** | Ya sembradas (D39, cerró P10): el clonado copia las dimensiones del control con su tipo y sus banderas. Cuáles exige cada control las define el comité en `Controles Monkey` L a P y hoy no coinciden con lo sembrado (`DT-69`) |

## Estado de implementación (actualizado 2026-10-07)

Implementado en `Backend/src/features/services` (más `catalogs` y el progreso de `auth`) y en
`Frontend-Platform/src/app/features/services` (asistente y «Mis servicios»). Decisiones D45, D50 y D51.

| Endpoint | Estado |
|---|---|
| `POST /v1/services` | ✅ Solo `admin_empresa`. Crea el servicio **y clona el catálogo en la misma transacción**; el `201` ya trae `catalog.status = ready` |
| `GET /v1/services` | ✅ Paginado: `id`, `name`, `type`, `is_complete`, `frameworks[]`, `catalog` y `created_at` |
| `GET /v1/services/{id}` | ✅ Todos los campos declarados (el response del `201` los trae igual, para que la pantalla de edición no pida dos veces) |
| `PATCH /v1/services/{id}` | ✅ Solo las claves presentes (`null` borra un opcional). Ampliar `trust_criteria` o `framework_codes` recalcula y clona lo que falte; no borra ni pisa nada |
| `DELETE /v1/services/{id}` | ✅ `409 SERVICE_HAS_EVALUATIONS` con evaluaciones, evidencias entregadas o planes de acción; si no, borra todo lo del servicio |
| `POST /v1/services/{id}/system-description` | ✅ El enlace (`http`/`https`); conserva el archivo si lo hay |
| `POST /v1/services/{id}/system-description/file` | ✅ Multipart, 25 MB, PDF o .docx (D51). Con el adaptador S3 / minio; sin `S3_*` responde 503. Probado de punta a punta contra un servidor S3 compatible (SeaweedFS) y con un archivo de exactamente 25 MB; `npm run storage:smoke` pasa 7/7 en el MinIO de la VPS (MD-110, 2026-10-17) |
| `GET /v1/services/{id}/system-description/file` | ✅ Enlace temporal de 5 min |
| `PUT .../csocs` y `PUT .../cuecs` | ❌ No se construyeron (salen de las secciones 7 y 8 de la Descripción del Sistema, que aún no se procesa) |
| `GET /v1/catalogs/{name}` | ✅ Nuevos: `service_type`, `served_industry`, `active_client_count`, `service_country`, `data_type`, `trust_criterion`, `subservice_type`, `expected_availability`, `previous_certification` y `frameworks` (sale de `catalog.frameworks`: hoy solo `soc2`) |

- **Aislamiento:** RLS por `tenant_id` entre empresas; entre servicios de la misma empresa, el filtro por
  `service_id` (cada servicio tiene su propia copia: único `service_id + control_id`). Un servicio de otra
  empresa responde `404`, no `403`.
- **Qué se clona y cómo:** ver D45 (puntos 4 a 9). Con `security + availability + confidentiality`:
  38 requisitos y 86 controles; con los 5 criterios: 61 y 118. Más 10 riesgos, 56 causas y sus relaciones.
- **Validación** (todos los errores a la vez): valores fuera de catálogo (`enum.invalid`), listas vacías
  (`array.min`) o repetidas (`array.unique`), enlace
  inválido (`url.invalid`), marco que no existe (`framework_codes: enum.invalid`).
  `ORGANIZATION_NOT_DECLARED` si falta el Componente 1; `SERVICE_NAME_TAKEN` por nombre repetido en la
  empresa (sin importar mayúsculas). `FRAMEWORK_NOT_CONTRACTED` **sí se usa desde D47**: el marco debe estar
  entre los que Monkey Admin contrató para la empresa (también en `PATCH`), y el cliente los lista con
  `GET /v1/catalogs/contracted-frameworks`. `TRUST_CRITERION_REQUIRED` no se usa: el servidor añade `security`
  en vez de rechazar.
- **Auditoría:** `service.create`, `service.update`, `service.system_description` y `service.delete` en
  `audit_logs`, con el estado antes y después (CC9.2).
- **Progreso:** `GET /v1/auth/me` añade `service_context` a `onboarding.completed_steps` cuando hay al
  menos un servicio con marco activo y Descripción del Sistema; entonces `next_step = technical_control`.
- **Pantalla (Platform):** 6 pantallas cortas y una de revisión; el avance se guarda en el navegador y,
  al terminar, se muestran los requisitos y controles preparados, con sus códigos y explicados. «Mis servicios» lista, edita
  y elimina (con confirmación).
