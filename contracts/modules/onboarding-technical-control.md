---
id: contracts-onboarding-c3
name: Contrato — Onboarding Componente 3 (Control Técnico)
description: Escenario de despliegue y flujo de conexión de activos (conexiones) sobre el catálogo ac_01 a ac_06.
type: contract
---

# Componente 3 — Control Técnico

El cliente conecta su infraestructura real. Ver `conventions.md` y `enums.md`.

**Entidades:** `assets`, `service_assets`, `automated_capabilities`, `asset_provisionings` y, desde D67, el catálogo de plataformas:
`capability_platforms`, `platform_connection_methods`, `platform_regions`, `capability_frequencies`, `deployment_scenario_capabilities` (`modelo-datos.md` §6.3, §8).
**Rol:** `admin_empresa`. **App:** Monkey Platform.

> ⚠️ **Confidencialidad, no negociable.** Ningún campo, valor de enum, mensaje de error ni
> ejemplo de este contrato nombra al proveedor del motor de monitoreo. Se habla de
> `automated_capability`, "sonda" o "evaluación automática".
> `automated_capabilities.provider` existe en el modelo, es **interno**, y **nunca sale en un
> response**. Es criterio de aceptación del sprint: en ninguna pantalla, log o mensaje del
> Componente 3 aparece.

## Paso 1 — Escenario de despliegue

`services.deployment_scenario` determina qué conexiones se le ofrecen al cliente.

| Valor | Conexiones |
|---|---|
| `cloud_managed_only` | `ac_01` |
| `cloud_with_servers` | `ac_01`, `ac_02`, `ac_03` |
| `on_premise` | `ac_04`, `ac_05`, `ac_06` |
| `hybrid` | las seis (`ac_01` a `ac_06`): el cliente usa las que le sirvan (D46) |

### `PUT /v1/services/{id}/deployment-scenario`

```json
{ "deployment_scenario": "cloud_with_servers" }
```

```json
{
  "statusCode": 200,
  "message": "deployment_scenario.saved",
  "data": {
    "deployment_scenario": "cloud_with_servers",
    "applicable_capabilities": [
      { "catalog_code": "ac_01", "category": "Servicios en nube (gestionados, sin servidor)", "method": "Autorización API / rol de solo lectura u OAuth", "required_permissions": ["Rol de solo lectura", "Consentimiento OAuth"], "base_frequency": "cada 6-24 h", "platforms": [{ "code": "aws", "name": "AWS", "logo_key": "aws", "availability": "available", "connection_methods": ["readonly_role", "access_keys"] }, { "code": "azure", "name": "Azure", "logo_key": "azure", "availability": "coming_soon", "connection_methods": [] }, "…"], "generated_evidence": "Postura de configuración y registros de actividad de la nube" },
      { "catalog_code": "ac_02", "category": "Servidores en nube / VPS", "method": "Instalar agente ligero de Monkey (o agentless SSH/WinRM)", "required_permissions": ["sudo o administrador para la instalación"], "base_frequency": "continuo", "platforms": [{ "code": "linux", "name": "Linux", "logo_key": "linux", "availability": "coming_soon", "connection_methods": ["agent"] }, "…"] },
      { "catalog_code": "ac_03", "category": "Bases de datos en nube", "method": "Agente en host + usuario de solo lectura", "required_permissions": ["Usuario de solo lectura de auditoría"], "base_frequency": "continuo", "platforms": [{ "code": "postgresql", "name": "PostgreSQL", "logo_key": "postgresql", "availability": "coming_soon", "connection_methods": ["agent"] }, "…"] }
    ]
  }
}
```

`GET /v1/catalogs/automated-capabilities` devuelve las 6 sin filtrar, con los mismos campos
(`catalog_code`, `category`, `platforms`, `method`, `required_permissions`,
`base_frequency`, `generated_evidence`). `platforms` reemplaza al antiguo `supported_platforms` (nombres sueltos): cada plataforma trae `code`, `name` (la marca, no se traduce), `logo_key`, `availability` (`available` | `coming_soon`) y sus `connection_methods` (el primero es el recomendado; vacío si aún no tiene canal), en el orden de la hoja del comité (D67). **`provider` no aparece en ninguna de las dos
respuestas**: es la única columna de `automated_capabilities` que nunca sale.

## Paso 2 — El flujo de conexión de un activo

Cuatro pasos: **conectar → validar → activar → programar**. El cliente **no entrega secretos** salvo en el canal alternativo de llaves; el
resto lo entrega Monkey (D53, D58). Al menos uno completo de punta a punta es criterio de aceptación.

### Elegir la plataforma — el marketplace (D67)

El cliente no elige una categoría técnica: **elige una plataforma**, y eso lo lleva a su propio paso a paso. Nunca se asume una (antes, «Servicios en nube» daba por hecho AWS).
Las plataformas y sus atributos salen de la base (`platforms` en `GET /v1/catalogs/automated-capabilities` y en `applicable_capabilities`); la pantalla no hardcodea ninguna lista.

| Qué se conecta | Categoría | Plataforma que elige | Canales (`connection_method`) |
|---|---|---|---|
| Cuenta de nube o servicio gestionado | `ac_01` | AWS · Azure · GCP · Microsoft 365 · Google Workspace | AWS: `readonly_role` (recomendado) · `access_keys`. Las demás: aún sin canal |
| Servidor en nube, on-premise o equipo | `ac_02`, `ac_04`, `ac_06` | el **sistema operativo** | `agent` (solo diseño, `DT-57`) |
| Base de datos | `ac_03`, `ac_05` | el **motor** | `agent` (solo diseño, `DT-57`) |

**Disponibilidad.** `availability = available` solo si el flujo existe: **hoy solo AWS**. Las `coming_soon` **se muestran bloqueadas**. Dónde vive un servidor o una base (EC2, RDS, un VPS…)
no se pregunta aquí: lo dice el escenario (paso 1).

**Pantalla** (`/services/{id}/connections/new`; las plataformas disponibles llevan a `/services/{id}/connections/new/{catalog_code}/{platform}`):

- **Un grupo por tipo** que aplica al escenario del servicio, con el nombre de la categoría en lenguaje de negocio (nunca `ac_01`) y, debajo, una **tarjeta por plataforma** en el orden del catálogo.
  Título «Nueva conexión»; «Elige a qué quieres conectarte. Al terminar, Monkey te muestra los activos que encontró.»
- **Tarjeta:** logo, nombre de la plataforma y, si está bloqueada, un candado y el texto «Próximamente». Una tarjeta disponible navega a su paso a paso; una bloqueada **no navega**.
- **Logos:** SVG oficial, **sin recolorear ni redibujar**, desde `Frontend-Platform` (`logo_key`); se muestra con `<img>`, nunca se inyecta SVG como HTML. Uso de marcas de terceros: `P21`.
- **Accesibilidad (WCAG 2.2 AA):** el nombre va siempre como **texto visible** y el logo es decorativo (`alt=""`); cada grupo es una sección con su encabezado y una lista; la tarjeta es un enlace o
  botón con foco visible y área táctil de al menos 44 px; la tarjeta bloqueada se anuncia como «no disponible, próximamente» (`aria-disabled="true"`) y **no se distingue solo por opacidad**;
  contraste de 4,5:1 para el texto y 3:1 para el logo, el icono y el borde, en tema claro y oscuro (si un logo no contrasta, va sobre una baldosa neutra).
- Sin escenario elegido: `409 DEPLOYMENT_SCENARIO_NOT_SET` y la pantalla lleva a «dónde vive».

El cliente **elige** el canal entre los de **su plataforma**. `GET /v1/catalogs/connection_method` y `GET /v1/catalogs/aws_region` dan las opciones (desde D67 se leen de
`platform_connection_methods` y `platform_regions`; una plataforma nueva con regiones suma su propio `<code>_region`); `GET /v1/catalogs/automated-capabilities` añade `connection_methods` a cada
plataforma (el primero es el recomendado). Un activo de nube es **una cuenta** (D53) y sus `regions` (≥ 1) son **las únicas que se evalúan**.

### `POST /v1/assets` — cuenta de nube con rol de solo lectura

**`platform` (el `code` del catálogo) es obligatorio** en toda conexión (D67). `422 VALIDATION_FAILED` con `error.fields`: `platform` / `connection.provider_not_supported` si la plataforma está `coming_soon`; `platform` / `platform.not_in_category` si no pertenece a la `connection_category`; `connection_method` debe ser uno de los canales **de esa plataforma** (`409 CONNECTION_METHOD_NOT_APPLICABLE`). Las `regions` deben ser de `platform_regions` de la plataforma.

```json
{
  "name": "AWS producción",
  "connection_category": "ac_01",
  "connection_method": "readonly_role",
  "platform": "aws",
  "external_account_id": "123456789012",
  "regions": ["us-east-1", "us-east-2"],
  "criticality": "high",
  "tags": ["produccion"],
  "service_ids": ["5c2e8a41-7b9d-4e03-a1f6-8d40c2b7e915"]
}
```

`201`: el activo nace `pending` y **Monkey le entrega lo que el cliente debe hacer**:

```json
{
  "statusCode": 201,
  "message": "asset.created",
  "data": {
    "id": "7e5b2c90-3a14-4f8d-b062-1c9e7a3f5d28",
    "code": "AST-0042",
    "name": "AWS producción",
    "connection_category": "ac_01",
    "type": "cloud_service",
    "platform": "aws",
    "external_account_id": "123456789012",
    "regions": ["us-east-1", "us-east-2"],
    "operational_status": "not_monitored",
    "provisioning": { "connection_method": "readonly_role", "connection_status": "pending", "is_active": false, "last_validated_at": null },
    "connection_setup": {
      "method": "readonly_role",
      "external_id": "mk-3f9a1c7e2b",
      "monkey_principal_arn": "arn:aws:iam::210987654321:root",
      "role_name": "MonkeyReadOnly",
      "role_arn": null,
      "template_path": "/v1/connection-templates/aws-readonly-role",
      "steps": ["…texto ya traducido…", "…", "…"]
    }
  }
}
```

- `external_id` lo genera Monkey, es único por activo y evita que otro cliente use el rol del tuyo; **no es un secreto del cliente**.
- El cliente descarga la plantilla (`template_path`, `GET /v1/connection-templates/aws-readonly-role`), crea el rol en su cuenta y devuelve su ARN.
  El «un clic» con enlace directo está pendiente (`DT-55`).
- `steps` son **textos ya traducidos**, no claves (la plataforma no tiene i18n propio, `DT-21`).
- `external_account_id` es obligatorio en `readonly_role` y `access_keys`.

### `PATCH /v1/assets/{id}/connection` — el cliente entrega el rol creado

```json
{ "role_arn": "arn:aws:iam::123456789012:role/MonkeyReadOnly" }
```

`200` con el mismo `provisioning` (sigue `pending`). **Un `role_arn` no es un secreto.** `422 VALIDATION_FAILED` si no tiene forma de ARN o la
cuenta del ARN no coincide con `external_account_id`.

### `POST /v1/assets` — cuenta de nube con llaves (canal alternativo)

Igual que arriba, con `"connection_method": "access_keys"` y:

```json
{ "credentials": { "access_key_id": "AKIA…", "secret_access_key": "…" } }
```

`credentials` **nunca se devuelve**: se cifra (`SEG-24`). La respuesta lleva `connection_setup.method = "access_keys"` con un `warning`
(menos seguro: llaves de larga vida) y los pasos para crear un usuario de solo lectura. La pantalla debe decirlo y ofrecer el rol primero.

### `POST /v1/assets` — servidor, base de datos o equipo con agente *(solo diseño)*

Mismo cuerpo sin `external_account_id` ni `regions`, con `"connection_method": "agent"`. El comando de instalación lo generará Monkey
(pre-registra al agente en el grupo de la empresa, D54) y su `<token>` es de un solo uso. **No está construido**: `validate` responde `503`
(`DT-57`; instalador y hospedaje, `P12`).

### `POST /v1/assets/{id}/validate` — validar la conexión

Comprobación real y de **solo lectura**, hecha por el trabajador aislado (D57, D58): en `readonly_role` asume el rol y confirma que la cuenta es
la declarada; en `access_keys` confirma la identidad de las llaves. Es síncrono: espera hasta `VALIDATION_WAIT_SECONDS`. `200`:

```json
{
  "statusCode": 200,
  "message": "asset.validated",
  "data": {
    "connection_status": "validated",
    "last_validated_at": "2026-10-09T09:14:33Z",
    "technical_coverage": "…",
    "checks_available": 662,
    "mode": "real",
    "probe_mode": "runner"
  }
}
```

`checks_available` son los checks del catálogo de nube (deja de ser la constante 402, `DT-2`). `probe_mode`: `runner` (comprobación real),
`simulated` o `unavailable` (honestidad: «Automatizado ≠ Operativo»).

Errores de validación (`422 CONNECTION_FAILED`, con `error.fields`; `code` = razón, `message` ya traducido):

| `field` | `code` | Qué pasó |
|---|---|---|
| `role_arn` | `connection.role_not_found` | El rol no existe o Monkey no puede asumirlo (revisa el `external_id`) |
| `role_arn` | `connection.account_mismatch` | El rol es de otra cuenta que la declarada |
| `credentials` | `connection.credentials_invalid` | Las llaves no son válidas o están desactivadas |
| `regions` | `connection.regions_missing` | No hay regiones declaradas |
| `platform` | `connection.provider_not_supported` | Plataforma bloqueada (`coming_soon`): también al crear, no solo al validar |

Las razones que no son del cliente (trabajador caído, llaves base vencidas) dan `503 CONNECTION_UNAVAILABLE`.

Una conexión **activa o programada también se puede volver a comprobar**: refresca los activos encontrados (`GET …/resources`) y la fecha de la última validación, pero **su estado no cambia**, ni con éxito ni con fallo. El mensaje habla de
«evaluación automática», nunca del proveedor. Lo que ocurre **después** de validar (evaluar, estado de preparación, hallazgos) es otro módulo:
`control-tecnico-operacion.md`.

### `GET /v1/assets/{id}/resources` — los activos de la conexión

Lo que la conexión reconoció dentro de la cuenta, en las regiones declaradas (D59). **Cada uno es un activo propio** (D61): con su código, su IP, su zona, sus etiquetas y su
criticidad. Se llena al validar la conexión y se refresca al volver a comprobarla. Paginado (`page_size` máx. 100); filtro `kind`; **`service_id`** marca cuáles son de ese servicio.
`404` si la conexión no existe, es de otra empresa, está dada de baja o es ella misma un activo descubierto.

```json
{
  "statusCode": 200,
  "message": "Estos son los activos que encontramos en tu cuenta.",
  "data": {
    "discovered_at": "2026-10-10T14:02:11Z",
    "regions": ["us-east-2"],
    "incomplete_services": [],
    "summary": [{ "kind": "server", "count": 5 }, { "kind": "storage", "count": 1 }],
    "included_count": 3,
    "items": [
      { "id": "…", "code": "AST-0007", "kind": "server", "type": "AwsEc2Instance", "name": "Server-Proxy", "region": "us-east-2",
        "platform": "Ubuntu 24.04", "ip_address": "69.0.1.235", "location": "us-east-2b", "criticality": "medium",
        "tags": ["ambiente=prod"],
        "attributes": { "instance_id": "i-0a5198f79ae9545cf", "os": "Ubuntu 24.04", "os_source": "image", "state": "stopped", "instance_type": "t3.micro", "private_ip": "69.0.1.235", "vpc_id": "vpc-…", "subnet_id": "subnet-…" },
        "in_service": true }
    ],
    "page": 1, "page_size": 100, "total": 6, "total_pages": 1
  }
}
```

- `discovered_at` es `null` mientras la cuenta no se haya descubierto: **no es un error**, la lista viene vacía.
- `summary` cuenta por clase (`resource_kind`) y **no depende del filtro**. `included_count` y `in_service` solo vienen con `service_id`.
- `attributes` trae solo lo que se pudo leer. **`os` es una inferencia** a partir de la imagen (`os_source: "image"`); si no se pudo, es `null`.
- Solo `server`, `database`, `storage` y `function`: los recursos que solo conoce la evaluación (`other`) no son activos y no salen.

### `PUT /v1/services/{id}/connections/{connectionId}/assets` — los activos que son de este servicio

```json
{ "asset_ids": ["…", "…"] }
```

Fija **exactamente** qué activos de la conexión pertenecen al servicio (D61): los que no vienen se desenlazan. Idempotente. `200`:
`{ "included": 3, "added": 1, "removed": 0 }`. `404` si el servicio o la conexión no existen para la empresa, o la conexión no sirve a ese servicio; `422 VALIDATION_FAILED`
(`asset_ids`, `invalid`) si algún id no es un activo activo de **esa** conexión. Auditoría: `service.assets_set`.

### `PATCH /v1/assets/{id}` — editar un sistema

Todo opcional: `name`, `criticality`, `tags` y, **solo en una cuenta de nube**, `external_account_id`, `regions`, `role_arn` (canal de rol) y
`credentials` (canal de llaves, reemplaza las guardadas y **nunca se devuelve**). `200` con el mismo cuerpo que el detalle.

- Nombre, criticidad y etiquetas **no tocan la conexión**.
- Cambiar cuenta, regiones, rol o llaves **invalida lo comprobado**: `connection_status` vuelve a `pending`, se pierde la activación y la
  programación, y el activo pasa a `not_monitored`. El historial de evaluaciones **se conserva**.
- Cambiar de cuenta además **renueva el `external_id`** (el anterior se entregó para otra cuenta) y descarta el `role_arn`, salvo que llegue uno nuevo.
- Un `role_arn` de otra cuenta que la declarada es `422` (`connection.account_mismatch`); regiones fuera del catálogo, `422`.
- Cambios de conexión en un activo que no es de nube con rol o llaves: `422` (`field.not_allowed`). `409 EXECUTION_IN_PROGRESS` si hay una comprobación o evaluación en curso. Auditoría: `asset.update`.

### `DELETE /v1/assets/{id}` — quitar un sistema

Es una **baja, no un borrado**: `assets.status = inactive`, la conexión se desactiva y el activo deja de listarse (`GET` responde `404`) y de evaluarse.
Ejecuciones, resultados y hallazgos **se conservan** (son evidencia). **Los activos que la conexión descubrió se dan de baja con ella** y se desenlazan de los servicios. `200` con `data: null`. `409 EXECUTION_IN_PROGRESS` si hay algo en curso;
un segundo `DELETE` es `404`. Auditoría: `asset.retire`.

### `POST /v1/assets/{id}/activate` — activar

Requiere `connection_status: "validated"`. Pone `is_active: true` y
`operational_status: "operational"`. Con la conexión sin validar, `409 NOT_VALIDATED`.

### `PUT /v1/assets/{id}/schedule` — programar

```json
{ "frequency": "continuous" }
```

Las frecuencias que admite cada conexión salen de `capability_frequencies` (hoy: `ac_01` → `every_6h` o `every_24h`; `ac_02` a `ac_06` → `continuous`). Una frecuencia que
la capacidad no soporta devuelve `422 FREQUENCY_NOT_SUPPORTED`.

### `GET /v1/assets` — listar

Paginado, con filtros `service_id`, `connection_category`, `operational_status`. **Solo conexiones** (y lo registrado a mano): los activos descubiertos viven dentro de su conexión (D61). Cada elemento
trae `code`, `name`, `connection_category`, `operational_status`, `technical_coverage` y
`provisioning.connection_status`.


## Errores

| HTTP | `error.code` | Cuándo |
|---|---|---|
| 409 | `DEPLOYMENT_SCENARIO_NOT_SET` | Se registra un activo antes de elegir escenario |
| 409 | `CAPABILITY_NOT_APPLICABLE` | La `connection_category` no aplica al escenario del servicio |
| 409 | `ASSET_NOT_VALIDATED` | Se activa sin validar |
| 409 | `ASSET_ALREADY_ACTIVE` | Se activa o se valida un activo ya activo |
| 409 | `ASSET_NOT_ACTIVE` | Se programa un activo que aún no está activo *(añadido, D46)* |
| 503 | `CONNECTION_UNAVAILABLE` | Esta instalación aún no puede comprobar conexiones (sin sonda); el activo sigue `pending` *(añadido, D46)* |
| 409 | `CONNECTION_METHOD_NOT_APPLICABLE` | El canal no existe para esa plataforma (p. ej. `agent` en AWS) |
| 422 | `CONNECTION_FAILED` | La validación no pudo conectar (tabla del paso 3) |
| 422 | `FREQUENCY_NOT_SUPPORTED` | Frecuencia que la capacidad no admite |
| 422 | `VALIDATION_FAILED` | Enum inválido, `regions` vacío o fuera del catálogo, `external_account_id` o `role_arn` mal formados, sin `service_ids` |

Claves i18n: `deployment_scenario.saved`, `asset.created`, `asset.list`,
`asset.validated`, `asset.activated`, `asset.scheduled`, `asset.connection_failed`,
`asset.not_validated`, `asset.already_active`, `capability.not_applicable`,
`connection.permission_denied`, `frequency.not_supported`, `validation.failed`.

**Ningún texto de esta lista, ni su traducción en `i18n/es` e `i18n/en`, nombra al proveedor.**

## Notas

- `technical_coverage` es un string `"n/18"`, no un porcentaje: son las 18 capacidades técnicas
  cubiertas por la sonda en ese activo.
- Los conectores productivos reales quedan **fuera del alcance** del sprint: se entrega el flujo
  de conexión y su UI, no la integración en producción.
- `origin` distingue `declared` (lo que el cliente dijo) de `discovered` (lo que apareció al
  conectar).

## Preguntas abiertas

Todas las que había quedaron **cubiertas por desarrollo en D46**; lo que sigue siendo un parche está en
`deuda-tecnica/README.md`. Ninguna bloquea el componente.

| Qué | Estado |
|---|---|
| **`assets.responsible_id`** | ◐ Opcional y aceptado por la API; **no hay forma de crear cargos todavía** (DT-9) y la pantalla lo oculta |
| **Valores de `assets.type`, `criticality`, `origin` y `status`** | ✅ Cerrados en `enums.md` (D34). El tipo ahora se **deduce de la conexión** (D46) |
| **¿Qué es «híbrido»?** | ✅ Las seis conexiones (D46, DT-7) |
| **Dónde guardar la frecuencia de `schedule`** | ✅ `asset_provisionings.schedule_frequency` (D46) |
| **Qué pide cada conexión** | ✅ Nube: rol de solo lectura o llaves (D53, D58). ❌ Servidores y bases: canal de agente, solo diseño (`P12`, `DT-57`) |
| **Azure y GCP** | ❌ Sin cuentas de prueba; el comité debe entregarlas. Se muestran **bloqueadas** (D67) |
| **Logos de las plataformas** | ❌ Falta confirmar el uso de marcas de terceros y quién entrega los SVG oficiales (`P21`) |
| **Las 18 capacidades de `technical_coverage`** | ❌ Sin definir (DT-2): hoy es una constante |

## Pendiente de construir — D67 (marketplace y catálogo en la base)

Definido aquí y en `modelo-datos.md` §6.3; **aún no existe en el código** (el Backend y `Frontend-Platform` siguen con las constantes y las tarjetas por categoría).

| Pieza | Estado |
|---|---|
| Tablas `capability_platforms`, `platform_connection_methods`, `platform_regions`, `capability_frequencies`, `deployment_scenario_capabilities`; `automated_capabilities.asset_type`; `assets.platform_id` | ⏳ Migración y carga (`reference:load`) |
| Constantes de `technical-catalogs.ts` y `onboarding-catalogs.ts` (escenario → conexiones, frecuencias, tipo, canales, regiones) | ⏳ Se retiran; pasan a leerse de la base |
| `platforms` en `GET /v1/catalogs/automated-capabilities` y en `applicable_capabilities` | ⏳ Reemplaza a `supported_platforms` |
| `platform` obligatorio en `POST /v1/assets`, con `connection.provider_not_supported` y `platform.not_in_category` | ⏳ |
| Pantalla del marketplace y los pasos a paso por plataforma; los SVG | ⏳ `Frontend-Platform` |
| Retirar el formulario provisional de servidores y bases (DT-31, DT-56) | ⏳ Se cierran con esto |

## Estado de implementación (2026-10-09)

Implementado en `Backend/src/features/technical-control` (más `catalogs` y el progreso de `auth`) y en
`Frontend-Platform/src/app/features/technical-control`. Decisiones D46.

| Endpoint | Estado |
|---|---|
| `PUT /v1/services/{id}/deployment-scenario` | ✅ Devuelve las conexiones que aplican. `409 CAPABILITY_NOT_APPLICABLE` si dejaría fuera un activo ya registrado |
| `GET /v1/services/{id}/technical-control` | ➕ **No está en el contrato original.** Escenario, conexiones aplicables, `is_complete` y `probe_mode` en una sola lectura |
| `GET /v1/catalogs/automated-capabilities` | ✅ Las 6, sin `provider` |
| `POST /v1/assets` | ✅ Tipo deducido de la conexión; código `AST-0001` por empresa; credenciales validadas por conexión y **cifradas** |
| `GET /v1/assets` · `GET /v1/assets/{id}` | ✅ Paginado con filtros `service_id`, `connection_category`, `operational_status`. El detalle es **adición** (DT-11) |
| `GET /v1/assets/{id}/resources` (activos de la conexión, con `service_id`) y `PUT /v1/services/{id}/connections/{id}/assets` | ✅ Construidos y probados contra AWS real (D59, D61) |
| `PATCH /v1/assets/{id}` (editar) y `DELETE /v1/assets/{id}` (baja) | ✅ Construidos y probados (2026-10-09) |
| `PATCH /v1/assets/{id}/connection`, `GET /v1/connection-templates/aws-readonly-role`, `GET /v1/catalogs/connection_method`, `GET /v1/catalogs/aws_region` | ✅ Nube (D58) |
| `POST /v1/assets/{id}/validate` | ✅ Nube: **real** vía trabajador (`PROBE_MODE=runner`), verificada contra AWS real. Otros modos: `simulated` → `200` con `mode: demo`; `unavailable` (por defecto) → `503`. Canal `agent`: `503` (`DT-57`) |
| `POST /v1/assets/{id}/activate` | ✅ Con la sonda simulada deja `operational_status = warning`, **no** `operational` («Automatizado ≠ Operativo») |
| `PUT /v1/assets/{id}/schedule` | ✅ Valida la frecuencia por conexión; `409 ASSET_NOT_ACTIVE` si no está activo |

- **Credenciales:** en nube solo el canal `access_keys` las pide (`access_key_id` + `secret_access_key`, cifradas). El canal de rol no entrega secretos. Los formularios de contraseña por conexión de servidores/bases (SSH, DB) son el modelo anterior (`DT-56`).
- **Seguridad:** las credenciales no vuelven en ningún response, no se escriben en logs ni en `audit_logs`.
  La comprobación corre fuera de la transacción de base de datos.
- **Auditoría:** `service.deployment_scenario`, `asset.create`, `asset.validate`
  (también el fallo, con `result = error`), `asset.activate` y `asset.schedule`, con el estado antes y después.
- **Progreso:** `GET /v1/auth/me` añade `technical_control` a `onboarding.completed_steps` cuando algún servicio
  tiene escenario (D60: el scope declarado se retiró); entonces `next_step` es `null`. El servicio trae `technical_control`
  (`deployment_scenario`, `is_complete`, `connection_count`).
- **Confidencialidad:** el tipo `Capability` del backend no tiene `provider`; el catálogo y las respuestas lo
  omiten, y una prueba revisa respuestas, i18n, `src/`, logs y el bundle de la aplicación en cada recorrido.
- **Variables de entorno:** `CREDENTIALS_ENCRYPTION_KEY` (obligatoria), `PROBE_MODE` (`runner` | `simulated` | `unavailable`; `simulated` no arranca en producción), `MONKEY_AWS_PRINCIPAL_ARN` y `VALIDATION_WAIT_SECONDS`.
- **Pantallas (Platform, D60):** `/services/{id}` es el servicio (su información, «dónde vive» y la lista de conexiones); `/services/{id}/connections/new` propone los métodos
  de conexión (hoy por categoría; pasa a ser el marketplace de plataformas, D67); `/services/{id}/connections/{id}` muestra la conexión y los **activos que encontró** (D59). «Mis servicios» lista los servicios con su número de conexiones.
