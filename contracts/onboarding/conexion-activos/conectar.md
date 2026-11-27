---
id: contracts-onboarding-c3-conectar
name: Contrato — Onboarding, Conexión de activos, conectar
description: Las conexiones que se ofrecen, el marketplace de plataformas y cómo se declara un activo (rol, llaves o agente).
type: contract
---

# Conexión de activos — conectar

| | |
|---|---|
| **Qué es** | Las conexiones que se ofrecen, el marketplace de plataformas y cómo se declara un activo (rol, llaves o agente) |
| **Rol** | `admin_empresa` |
| **Contexto común** | Confidencialidad, errores, estado de implementación y preguntas abiertas: [`README.md`](README.md) |

## Índice de endpoints

| Método | Ruta | Para qué |
|---|---|---|
| `GET` | [`/v1/services/{id}/technical-control`](#get-v1servicesidtechnical-control--las-conexiones-que-se-ofrecen) | Las conexiones que se ofrecen y el modo de la sonda |
| `GET` | `/v1/catalogs/automated-capabilities` | Las mismas 6 conexiones, con sus plataformas |
| `POST` | [`/v1/assets`](#post-v1assets--declarar-un-activo) | Declarar un activo: nube con rol, nube con llaves, o agente |
| `PATCH` | [`/v1/assets/{id}/connection`](#patch-v1assetsidconnection--entregar-el-rol-creado) | El cliente entrega el rol creado |
| `GET` | `/v1/connection-templates/aws-readonly-role` | La plantilla del rol de solo lectura |
| `GET` | `/v1/catalogs/gcp_connection_scope` · `/v1/catalogs/gcp_setup_method` | Las opciones del primer paso de GCP, con `description`, `availability` y `tags` (D114; ver `enums/onboarding/conexion-activos.md`) |
| `GET` | `/v1/connection-templates/gcp-identity-federation` | El script de alta de GCP (D112) |
| `GET` | `/v1/connection-templates/microsoft-365-app` | El script de alta de Microsoft 365 (D154) |
| `GET` | `/v1/catalogs/connection_method` · `/v1/catalogs/aws_region` · `/v1/catalogs/<sistema>_version` | Los canales, las regiones y las versiones de un sistema operativo que se pueden declarar para un servidor (`linux_version`, `windows_version`…; D113). Cada opción trae `value` (código de Monkey, p. ej. `ubuntu_22_04_lts`), `label` («Ubuntu 22.04 LTS»), `group` (la distribución) y `group_label`. Solo salen las versiones que la sonda entrega; un sistema sin ninguna responde `404` |

## Paso 1 — Las conexiones que se ofrecen (D92)

**El cliente no declara dónde vive su servicio.** Antes (D46, D60) tenía que elegir un *escenario de despliegue* (`cloud_managed_only`, `cloud_with_servers`, `on_premise`, `hybrid`) y de él dependía qué conexiones se le ofrecían. D92 lo retira: el cliente **elige la plataforma** en el catálogo (AWS, Azure, un sistema operativo, un motor de base de datos…) y eso ya dice dónde vive lo que conecta. Preguntar lo mismo antes era una pregunta sin nada que la usara.

Se ofrecen **siempre las seis conexiones** (`ac_01` a `ac_06`), sin filtrar por ningún escenario. Ya no existen `PUT /v1/services/{id}/deployment-scenario`, el catálogo `deployment_scenario`, la acción de auditoría `service.deployment_scenario` ni los errores `DEPLOYMENT_SCENARIO_NOT_SET` y `CAPABILITY_NOT_APPLICABLE`.

### GET /v1/services/{id}/technical-control — Las conexiones que se ofrecen

| | |
|---|---|
| **Quién** | `admin_empresa` |
| **Éxito** | `200` |
| **Errores** | `403` · `404` |

#### Response `200`
| Campo | Tipo | Qué es |
|---|---|---|
| `applicable_capabilities[]` | objeto | **Todas** las conexiones (el nombre se conserva por compatibilidad). Cada una: `catalog_code`, `category`, `method`, `required_permissions[]`, `base_frequency`, `platforms[]` y `generated_evidence` |
| `applicable_capabilities[].platforms[]` | objeto | `code`, `name` (la marca, **no se traduce**), `logo_key`, `availability` (`available` · `coming_soon`) y `connection_methods[]` (el primero es el recomendado; vacío si aún no tiene canal), en el orden de la hoja del comité (D67) |
| `probe_mode` | string | `runner` · `simulated` · `unavailable` |

```json
{
  "statusCode": 200,
  "message": "technical_control.state",
  "data": {
    "applicable_capabilities": [
      { "catalog_code": "ac_01", "category": "Servicios en nube (gestionados, sin servidor)", "method": "Autorización API / rol de solo lectura u OAuth", "required_permissions": ["Rol de solo lectura", "Consentimiento OAuth"], "base_frequency": "cada 6-24 h", "platforms": [{ "code": "aws", "name": "Amazon Web Services", "logo_key": "aws", "availability": "available", "connection_methods": ["readonly_role", "access_keys"] }, { "code": "azure", "name": "Azure", "logo_key": "azure", "availability": "coming_soon", "connection_methods": [] }, "…"], "generated_evidence": "Postura de configuración y registros de actividad de la nube" },
      { "catalog_code": "ac_02", "category": "Servidores en nube / VPS", "method": "Instalar agente ligero de Monkey (o agentless SSH/WinRM)", "required_permissions": ["sudo o administrador para la instalación"], "base_frequency": "continuo", "platforms": [{ "code": "linux", "name": "Linux", "logo_key": "linux", "availability": "coming_soon", "connection_methods": ["agent"] }, "…"] },
      "… ac_03 a ac_06"
    ],
    "probe_mode": "runner"
  }
}
```

> Dejan de venir `deployment_scenario` e `is_complete`. En el servicio (`technical_control` de `GET /v1/services` y `/{id}`), `deployment_scenario` desaparece y `is_complete` pasa a significar «tiene al menos una conexión» (el paso 3 ya no es del onboarding, D89).
>
> `GET /v1/catalogs/automated-capabilities` devuelve las mismas 6, con los mismos campos. `platforms` reemplaza al antiguo `supported_platforms` (nombres sueltos). **`provider` no aparece en ninguna de las dos respuestas:** es la única columna de `automated_capabilities` que nunca sale.

## Paso 2 — El flujo de conexión de un activo

Cuatro pasos: **conectar → validar → activar → programar**. El cliente **no entrega secretos** salvo en el canal alternativo de llaves; el resto lo entrega Monkey (D53, D58). Al menos uno completo de punta a punta es criterio de aceptación.

### Elegir la plataforma — el marketplace (D67)

El cliente no elige una categoría técnica: **elige una plataforma**, y eso lo lleva a su propio paso a paso. Nunca se asume una (antes, «Servicios en nube» daba por hecho AWS). Las plataformas y sus atributos salen de la base (`platforms` en `GET /v1/catalogs/automated-capabilities` y en `applicable_capabilities`); la pantalla no hardcodea ninguna lista.

| Qué se conecta | Categoría | Plataforma que elige | Canales (`connection_method`) |
|---|---|---|---|
| Cuenta de nube o servicio gestionado | `ac_01` | Amazon Web Services · Azure · GCP · Microsoft 365 · Google Workspace | AWS: `readonly_role` (recomendado) · `access_keys`. GCP: `identity_federation` (D112). Microsoft 365: `app_certificate` (D154; `coming_soon` hasta probarlo con un tenant real). Las demás: aún sin canal |
| Servidor en nube, on-premise o equipo | `ac_02`, `ac_04`, `ac_06` | El **sistema operativo** | `agent` (construido solo para Linux y Windows on-premise, D113; el resto, solo diseño) |
| Base de datos | `ac_03`, `ac_05` | El **motor** | `agent` (solo diseño: bloqueado) |

**Disponibilidad.** `availability = available` solo si el flujo existe: **hoy AWS, GCP (D112), y Linux y Windows en servidores on-premise (`ac_04`, D113)**. Las `coming_soon` **se muestran bloqueadas**. Dónde vive un servidor o una base (EC2, RDS, un VPS…) no se pregunta: lo dice la plataforma que el cliente elige (D92).

#### Pantalla
`/services/{id}/connections/new`; las plataformas disponibles llevan a `/services/{id}/connections/new/{catalog_code}/{platform}`.

| Elemento | Regla |
|---|---|
| Grupos | **Un grupo por tipo de conexión** del catálogo, con el nombre de la categoría en lenguaje de negocio (nunca `ac_01`) y, debajo, una **tarjeta por plataforma** en el orden del catálogo. Título «Nueva conexión»; «Elige a qué quieres conectarte. Al terminar, Monkey te muestra los activos que encontró.» |
| Tarjeta | Logo, nombre de la plataforma y, si está bloqueada, un candado y el texto «Próximamente». Una tarjeta disponible navega a su paso a paso; una bloqueada **no navega** |
| Logos | Un **icono cuadrado a todo color y sin fondo**, del mismo tamaño para todas (así ninguna se ve más grande), desde `Frontend-Platform/public/providers/`. Cada `logo_key` tiene dos archivos: `<logo_key>.svg` (tema claro) y `<logo_key>-dark.svg` (oscuro, donde se aclaran solo los colores muy oscuros). Se muestra con `<img>`, nunca se inyecta SVG como HTML. No son de los kits de marca (`DT-68`); uso de marcas de terceros: `P21` |
| Accesibilidad (WCAG 2.2 AA) | El nombre va siempre como **texto visible** y el logo es decorativo (`alt=""`); cada grupo es una sección con su encabezado y una lista; la tarjeta es un enlace o botón con foco visible y área táctil de al menos 44 px; la bloqueada se anuncia como «no disponible, próximamente» (`aria-disabled="true"`) y **no se distingue solo por opacidad**; contraste de 4,5:1 para el texto y 3:1 para el logo, el icono y el borde, en tema claro y oscuro (por eso el logo tiene su variante oscura, no una baldosa de fondo) |

El cliente **elige** el canal entre los de **su plataforma**. `GET /v1/catalogs/connection_method` y `GET /v1/catalogs/aws_region` dan las opciones (desde D67 se leen de `platform_connection_methods` y `platform_regions`; una plataforma nueva con regiones suma su propio `<code>_region`); `GET /v1/catalogs/automated-capabilities` añade `connection_methods` a cada plataforma (el primero es el recomendado). Un activo de nube es **una cuenta** (D53) y sus `regions` (≥ 1) son **las únicas que se evalúan**.

---

### POST /v1/assets — Declarar un activo

| | |
|---|---|
| **Quién** | `admin_empresa` |
| **Éxito** | `201`: el activo nace `pending` y **Monkey le entrega lo que el cliente debe hacer** (`connection_setup`) |
| **Errores** | `403` · `409 CONNECTION_METHOD_NOT_APPLICABLE` · `422 VALIDATION_FAILED` (`platform`, `connection.provider_not_supported`, `platform.not_in_category`) |

Hay cuatro variantes según el canal: **A.** nube con rol de solo lectura (recomendado), **B.** nube con llaves (alternativo), **C.** servidor, base de datos o equipo con agente (solo diseño), **D.** proyecto de GCP con federación de identidad (D112).

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `name` | string | sí | |
| `connection_category` | enum `connection_category` | sí | `ac_01` a `ac_06` |
| `connection_method` | enum `connection_method` | sí | Debe ser uno de los canales **de esa plataforma** (`409 CONNECTION_METHOD_NOT_APPLICABLE`) |
| `platform` | string | **sí, siempre (D67)** | El `code` del catálogo. `422 connection.provider_not_supported` si la plataforma está `coming_soon`; `422 platform.not_in_category` si no pertenece a la `connection_category` |
| `external_account_id` | string | sí en `readonly_role`, `access_keys`, `identity_federation` y `app_certificate` | En GCP es el **ID del proyecto** (`^[a-z][a-z0-9-]{4,28}[a-z0-9]---
id: contracts-onboarding-c3-conectar
name: Contrato — Onboarding, Conexión de activos, conectar
description: Las conexiones que se ofrecen, el marketplace de plataformas y cómo se declara un activo (rol, llaves o agente).
type: contract
---

# Conexión de activos — conectar

| | |
|---|---|
| **Qué es** | Las conexiones que se ofrecen, el marketplace de plataformas y cómo se declara un activo (rol, llaves o agente) |
| **Rol** | `admin_empresa` |
| **Contexto común** | Confidencialidad, errores, estado de implementación y preguntas abiertas: [`README.md`](README.md) |

## Índice de endpoints

| Método | Ruta | Para qué |
|---|---|---|
| `GET` | [`/v1/services/{id}/technical-control`](#get-v1servicesidtechnical-control--las-conexiones-que-se-ofrecen) | Las conexiones que se ofrecen y el modo de la sonda |
| `GET` | `/v1/catalogs/automated-capabilities` | Las mismas 6 conexiones, con sus plataformas |
| `POST` | [`/v1/assets`](#post-v1assets--declarar-un-activo) | Declarar un activo: nube con rol, nube con llaves, o agente |
| `PATCH` | [`/v1/assets/{id}/connection`](#patch-v1assetsidconnection--entregar-el-rol-creado) | El cliente entrega el rol creado |
| `GET` | `/v1/connection-templates/aws-readonly-role` | La plantilla del rol de solo lectura |
| `GET` | `/v1/catalogs/gcp_connection_scope` · `/v1/catalogs/gcp_setup_method` | Las opciones del primer paso de GCP, con `description`, `availability` y `tags` (D114; ver `enums/onboarding/conexion-activos.md`) |
| `GET` | `/v1/connection-templates/gcp-identity-federation` | El script de alta de GCP (D112) |
| `GET` | `/v1/connection-templates/microsoft-365-app` | El script de alta de Microsoft 365 (D154) |
| `GET` | `/v1/catalogs/connection_method` · `/v1/catalogs/aws_region` · `/v1/catalogs/<sistema>_version` | Los canales, las regiones y las versiones de un sistema operativo que se pueden declarar para un servidor (`linux_version`, `windows_version`…; D113). Cada opción trae `value` (código de Monkey, p. ej. `ubuntu_22_04_lts`), `label` («Ubuntu 22.04 LTS»), `group` (la distribución) y `group_label`. Solo salen las versiones que la sonda entrega; un sistema sin ninguna responde `404` |

## Paso 1 — Las conexiones que se ofrecen (D92)

**El cliente no declara dónde vive su servicio.** Antes (D46, D60) tenía que elegir un *escenario de despliegue* (`cloud_managed_only`, `cloud_with_servers`, `on_premise`, `hybrid`) y de él dependía qué conexiones se le ofrecían. D92 lo retira: el cliente **elige la plataforma** en el catálogo (AWS, Azure, un sistema operativo, un motor de base de datos…) y eso ya dice dónde vive lo que conecta. Preguntar lo mismo antes era una pregunta sin nada que la usara.

Se ofrecen **siempre las seis conexiones** (`ac_01` a `ac_06`), sin filtrar por ningún escenario. Ya no existen `PUT /v1/services/{id}/deployment-scenario`, el catálogo `deployment_scenario`, la acción de auditoría `service.deployment_scenario` ni los errores `DEPLOYMENT_SCENARIO_NOT_SET` y `CAPABILITY_NOT_APPLICABLE`.

### GET /v1/services/{id}/technical-control — Las conexiones que se ofrecen

| | |
|---|---|
| **Quién** | `admin_empresa` |
| **Éxito** | `200` |
| **Errores** | `403` · `404` |

#### Response `200`
| Campo | Tipo | Qué es |
|---|---|---|
| `applicable_capabilities[]` | objeto | **Todas** las conexiones (el nombre se conserva por compatibilidad). Cada una: `catalog_code`, `category`, `method`, `required_permissions[]`, `base_frequency`, `platforms[]` y `generated_evidence` |
| `applicable_capabilities[].platforms[]` | objeto | `code`, `name` (la marca, **no se traduce**), `logo_key`, `availability` (`available` · `coming_soon`) y `connection_methods[]` (el primero es el recomendado; vacío si aún no tiene canal), en el orden de la hoja del comité (D67) |
| `probe_mode` | string | `runner` · `simulated` · `unavailable` |

```json
{
  "statusCode": 200,
  "message": "technical_control.state",
  "data": {
    "applicable_capabilities": [
      { "catalog_code": "ac_01", "category": "Servicios en nube (gestionados, sin servidor)", "method": "Autorización API / rol de solo lectura u OAuth", "required_permissions": ["Rol de solo lectura", "Consentimiento OAuth"], "base_frequency": "cada 6-24 h", "platforms": [{ "code": "aws", "name": "Amazon Web Services", "logo_key": "aws", "availability": "available", "connection_methods": ["readonly_role", "access_keys"] }, { "code": "azure", "name": "Azure", "logo_key": "azure", "availability": "coming_soon", "connection_methods": [] }, "…"], "generated_evidence": "Postura de configuración y registros de actividad de la nube" },
      { "catalog_code": "ac_02", "category": "Servidores en nube / VPS", "method": "Instalar agente ligero de Monkey (o agentless SSH/WinRM)", "required_permissions": ["sudo o administrador para la instalación"], "base_frequency": "continuo", "platforms": [{ "code": "linux", "name": "Linux", "logo_key": "linux", "availability": "coming_soon", "connection_methods": ["agent"] }, "…"] },
      "… ac_03 a ac_06"
    ],
    "probe_mode": "runner"
  }
}
```

> Dejan de venir `deployment_scenario` e `is_complete`. En el servicio (`technical_control` de `GET /v1/services` y `/{id}`), `deployment_scenario` desaparece y `is_complete` pasa a significar «tiene al menos una conexión» (el paso 3 ya no es del onboarding, D89).
>
> `GET /v1/catalogs/automated-capabilities` devuelve las mismas 6, con los mismos campos. `platforms` reemplaza al antiguo `supported_platforms` (nombres sueltos). **`provider` no aparece en ninguna de las dos respuestas:** es la única columna de `automated_capabilities` que nunca sale.

## Paso 2 — El flujo de conexión de un activo

Cuatro pasos: **conectar → validar → activar → programar**. El cliente **no entrega secretos** salvo en el canal alternativo de llaves; el resto lo entrega Monkey (D53, D58). Al menos uno completo de punta a punta es criterio de aceptación.

### Elegir la plataforma — el marketplace (D67)

El cliente no elige una categoría técnica: **elige una plataforma**, y eso lo lleva a su propio paso a paso. Nunca se asume una (antes, «Servicios en nube» daba por hecho AWS). Las plataformas y sus atributos salen de la base (`platforms` en `GET /v1/catalogs/automated-capabilities` y en `applicable_capabilities`); la pantalla no hardcodea ninguna lista.

| Qué se conecta | Categoría | Plataforma que elige | Canales (`connection_method`) |
|---|---|---|---|
| Cuenta de nube o servicio gestionado | `ac_01` | Amazon Web Services · Azure · GCP · Microsoft 365 · Google Workspace | AWS: `readonly_role` (recomendado) · `access_keys`. GCP: `identity_federation` (D112). Microsoft 365: `app_certificate` (D154; `coming_soon` hasta probarlo con un tenant real). Las demás: aún sin canal |
| Servidor en nube, on-premise o equipo | `ac_02`, `ac_04`, `ac_06` | El **sistema operativo** | `agent` (construido solo para Linux y Windows on-premise, D113; el resto, solo diseño) |
| Base de datos | `ac_03`, `ac_05` | El **motor** | `agent` (solo diseño: bloqueado) |

**Disponibilidad.** `availability = available` solo si el flujo existe: **hoy AWS, GCP (D112), y Linux y Windows en servidores on-premise (`ac_04`, D113)**. Las `coming_soon` **se muestran bloqueadas**. Dónde vive un servidor o una base (EC2, RDS, un VPS…) no se pregunta: lo dice la plataforma que el cliente elige (D92).

#### Pantalla
`/services/{id}/connections/new`; las plataformas disponibles llevan a `/services/{id}/connections/new/{catalog_code}/{platform}`.

| Elemento | Regla |
|---|---|
| Grupos | **Un grupo por tipo de conexión** del catálogo, con el nombre de la categoría en lenguaje de negocio (nunca `ac_01`) y, debajo, una **tarjeta por plataforma** en el orden del catálogo. Título «Nueva conexión»; «Elige a qué quieres conectarte. Al terminar, Monkey te muestra los activos que encontró.» |
| Tarjeta | Logo, nombre de la plataforma y, si está bloqueada, un candado y el texto «Próximamente». Una tarjeta disponible navega a su paso a paso; una bloqueada **no navega** |
| Logos | Un **icono cuadrado a todo color y sin fondo**, del mismo tamaño para todas (así ninguna se ve más grande), desde `Frontend-Platform/public/providers/`. Cada `logo_key` tiene dos archivos: `<logo_key>.svg` (tema claro) y `<logo_key>-dark.svg` (oscuro, donde se aclaran solo los colores muy oscuros). Se muestra con `<img>`, nunca se inyecta SVG como HTML. No son de los kits de marca (`DT-68`); uso de marcas de terceros: `P21` |
| Accesibilidad (WCAG 2.2 AA) | El nombre va siempre como **texto visible** y el logo es decorativo (`alt=""`); cada grupo es una sección con su encabezado y una lista; la tarjeta es un enlace o botón con foco visible y área táctil de al menos 44 px; la bloqueada se anuncia como «no disponible, próximamente» (`aria-disabled="true"`) y **no se distingue solo por opacidad**; contraste de 4,5:1 para el texto y 3:1 para el logo, el icono y el borde, en tema claro y oscuro (por eso el logo tiene su variante oscura, no una baldosa de fondo) |

El cliente **elige** el canal entre los de **su plataforma**. `GET /v1/catalogs/connection_method` y `GET /v1/catalogs/aws_region` dan las opciones (desde D67 se leen de `platform_connection_methods` y `platform_regions`; una plataforma nueva con regiones suma su propio `<code>_region`); `GET /v1/catalogs/automated-capabilities` añade `connection_methods` a cada plataforma (el primero es el recomendado). Un activo de nube es **una cuenta** (D53) y sus `regions` (≥ 1) son **las únicas que se evalúan**.

---

### POST /v1/assets — Declarar un activo

| | |
|---|---|
| **Quién** | `admin_empresa` |
| **Éxito** | `201`: el activo nace `pending` y **Monkey le entrega lo que el cliente debe hacer** (`connection_setup`) |
| **Errores** | `403` · `409 CONNECTION_METHOD_NOT_APPLICABLE` · `422 VALIDATION_FAILED` (`platform`, `connection.provider_not_supported`, `platform.not_in_category`) |

Hay cuatro variantes según el canal: **A.** nube con rol de solo lectura (recomendado), **B.** nube con llaves (alternativo), **C.** servidor, base de datos o equipo con agente (solo diseño), **D.** proyecto de GCP con federación de identidad (D112).

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `name` | string | sí | |
| `connection_category` | enum `connection_category` | sí | `ac_01` a `ac_06` |
| `connection_method` | enum `connection_method` | sí | Debe ser uno de los canales **de esa plataforma** (`409 CONNECTION_METHOD_NOT_APPLICABLE`) |
| `platform` | string | **sí, siempre (D67)** | El `code` del catálogo. `422 connection.provider_not_supported` si la plataforma está `coming_soon`; `422 platform.not_in_category` si no pertenece a la `connection_category` |
| `external_account_id` | string | sí en `readonly_role`, `access_keys` e `identity_federation` | ); en Microsoft 365, el **ID del tenant** (un GUID). No va en `agent` |
| `regions` | string[] | sí en nube con región (≥ 1) | Deben ser de `platform_regions` de la plataforma. Son **las únicas que se evalúan**. No va en `agent`, `identity_federation` ni `app_certificate` (GCP se evalúa completo) |
| `criticality` | enum `asset_criticality` | no | |
| `tags` | string[] | no | |
| `service_ids` | uuid[] | sí | |
| `credentials` | `{ access_key_id, secret_access_key }` | solo `access_keys` | **Nunca se devuelve**: se cifra (`SEG-24`) |

#### A. Cuenta de nube con rol de solo lectura
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

#### Response `201`
| Campo | Tipo | Qué es |
|---|---|---|
| `id`, `code`, `name` | | `code` es `AST-0001` por empresa |
| `connection_category`, `type` | | El tipo **se deduce de la conexión** (D46) |
| `platform`, `external_account_id`, `regions` | | |
| `operational_status` | enum `operational_status` | `not_monitored` al nacer |
| `provisioning` | `{ connection_method, connection_status, is_active, last_validated_at }` | `connection_status`: enum `provisioning_status` |
| `connection_setup` | objeto | Lo que el cliente debe hacer: `method`, `external_id`, `monkey_principal_arn`, `role_name`, `role_arn`, `template_path` y `steps[]` |

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

> - `external_id` lo genera Monkey, es único por activo y evita que otro cliente use el rol del tuyo; **no es un secreto del cliente**.
> - El cliente descarga la plantilla (`template_path`, `GET /v1/connection-templates/aws-readonly-role`), crea el rol en su cuenta y devuelve su ARN. El «un clic» con enlace directo está pendiente (`DT-55`).
> - `steps` son **textos ya traducidos**, no claves (la plataforma no tiene i18n propio, `DT-21`).

#### B. Cuenta de nube con llaves (canal alternativo)
Igual que arriba, con `"connection_method": "access_keys"` y:

```json
{ "credentials": { "access_key_id": "AKIA…", "secret_access_key": "…" } }
```

`credentials` **nunca se devuelve**: se cifra (`SEG-24`). La respuesta lleva `connection_setup.method = "access_keys"` con un `warning` (menos seguro: llaves de larga vida) y los pasos para crear un usuario de solo lectura. La pantalla debe decirlo y ofrecer el rol primero.

#### C. Servidor, base de datos o equipo con agente *(construido solo para Linux y Windows on-premise, D113)*
Mismo cuerpo sin `external_account_id` ni `regions`, con `"connection_method": "agent"` y **`"os_version"`: la versión que el cliente declara** («Ubuntu 22.04 LTS»), un `value` de `GET /v1/catalogs/<sistema>_version` (D113). Es obligatoria: de ella salen el sistema (y con él el comando correcto) y qué evaluación se espera. Un valor que no es de ese catálogo, o de otro sistema que el de la plataforma elegida (p. ej. una versión de Windows para Linux), responde `422 VALIDATION_FAILED` en `os_version`. La respuesta (`201`) trae `agent: { status, os, os_version: { value, label } }` (el mismo texto que el catálogo) y `connection_setup` con **cuatro pasos** de instrucciones ya traducidos (entrar como administrador, copiar y ejecutar el comando, permitir la conexión de salida, esperar el estado «Conectado»); en las demás conexiones `agent` es `null`. Un alta rechazada no deja nada a medias: ni activo ni fila de agente. El activo se crea y su fila de agente nace `pending`, **sin agente todavía**: el comando de instalación lo entrega `GET /v1/assets/{id}/agent-install` ([`control-tecnico.md`](../../control-tecnico.md)), que es quien crea el agente en la sonda en el grupo de la empresa (D54). `validate` responde `503` a propósito: un servidor no se «valida», la lectura de la sonda es la prueba (D113).

#### D. Proyecto de GCP con federación de identidad (D112)
```json
{
  "name": "GCP producción",
  "connection_category": "ac_01",
  "connection_method": "identity_federation",
  "platform": "gcp",
  "external_account_id": "acme-prod-421905",
  "service_ids": ["5c2e8a41-7b9d-4e03-a1f6-8d40c2b7e915"]
}
```

Sin `regions` ni `credentials` (`422 field.not_allowed` si llegan). `gcp` está `available` desde MD-214; una plataforma `coming_soon` sigue dando `422 connection.provider_not_supported`.
La respuesta `201` es la de A con este `connection_setup`:

| Campo | Qué es |
|---|---|
| `method` | `identity_federation` |
| `external_id` | `mk-…`, por activo; GCP solo acepta la sesión de Monkey con este nombre. No es un secreto |
| `project_id` | El ID del proyecto declarado |
| `project_number` | `null` hasta que el cliente lo entregue |
| `setup_command` | El comando listo para pegar en Cloud Shell, **con el script completo dentro** y los parámetros puestos (no se publica en ninguna URL). `null` si el servidor no tiene configurada la identidad de Monkey (`MONKEY_GCP_FEDERATION_ROLE_ARN`); entonces la plantilla responde `503 CONNECTION_UNAVAILABLE` |
| `template_path` | `/v1/connection-templates/gcp-identity-federation` (el mismo script, para leerlo o descargarlo) |
| `steps` | Textos ya traducidos (`DT-21`) |

```json
"connection_setup": {
  "method": "identity_federation",
  "external_id": "mk-3f9a1c7e2b",
  "project_id": "acme-prod-421905",
  "project_number": null,
  "setup_command": "bash <<'MONKEY_SETUP' … MONKEY_SETUP",
  "template_path": "/v1/connection-templates/gcp-identity-federation",
  "steps": ["…texto ya traducido…", "…", "…"]
}
```

> - El script crea **en el proyecto declarado** el pool `monkey-access`, el proveedor `monkey-aws` (solo acepta la sesión `…:assumed-role/monkey-gcp-federation/<external_id>`), la cuenta de servicio de solo lectura `monkey-reader` y activa las APIs necesarias. Es idempotente: correrlo dos veces no duplica nada.
> - Al terminar imprime el **número de proyecto**, que el cliente entrega con `PATCH /v1/assets/{id}/connection`.
> - El script y los textos nunca nombran al motor de evaluación (D70).

#### E. Tenant de Microsoft 365 con aplicación y certificado (D154)
```json
{
  "name": "Microsoft 365 de Acme",
  "connection_category": "ac_01",
  "connection_method": "app_certificate",
  "platform": "microsoft_365",
  "external_account_id": "3f2a91c4-7b6d-4e0a-9c11-5d8e2f7a0b13",
  "service_ids": ["5c2e8a41-7b9d-4e03-a1f6-8d40c2b7e915"]
}
```

`external_account_id` es el **ID del tenant** (un GUID); sin `regions` ni `credentials` (`422 field.not_allowed` si llegan). Una plataforma `coming_soon` da `422 connection.provider_not_supported`: `microsoft_365` lo está hasta que se pruebe con un tenant real (D154).
Al declararlo, Monkey **genera el certificado de la conexión** (RSA 2048 autofirmado, 2 años): la clave privada se guarda cifrada y **no se devuelve nunca**; el cliente solo recibe el certificado público, dentro del comando. La respuesta `201` es la de A con este `connection_setup`:

| Campo | Qué es |
|---|---|
| `method` | `app_certificate` |
| `tenant_id` | El ID del tenant declarado |
| `client_id` | `null` hasta que el cliente entregue el ID de la aplicación que imprime el script |
| `certificate` | `{ thumbprint, expires_at }`: la huella (SHA-1, en mayúsculas, como la muestra Entra) y el vencimiento del certificado. No son secretos |
| `setup_command` | El comando listo para pegar en **Azure Cloud Shell** (Bash), con el script completo y el certificado público dentro. No se publica en ninguna URL |
| `template_path` | `/v1/connection-templates/microsoft-365-app` (el mismo script, para leerlo o descargarlo) |
| `steps` | Textos ya traducidos (`DT-21`) |

```json
"connection_setup": {
  "method": "app_certificate",
  "tenant_id": "3f2a91c4-7b6d-4e0a-9c11-5d8e2f7a0b13",
  "client_id": null,
  "certificate": { "thumbprint": "9C0F…E41A", "expires_at": "2028-11-22T00:00:00Z" },
  "setup_command": "bash <<'MONKEY_SETUP' … MONKEY_SETUP",
  "template_path": "/v1/connection-templates/microsoft-365-app",
  "steps": ["…texto ya traducido…", "…", "…"]
}
```

> - El script lo ejecuta un **administrador global** del tenant. Comprueba que la sesión sea la del tenant declarado y crea la aplicación «Monkey (solo lectura)» en **su** Entra, le sube el certificado público, le concede **solo permisos de aplicación de lectura** de Microsoft Graph, da el consentimiento del administrador e imprime el **ID de la aplicación**. Es idempotente: correrlo dos veces reutiliza la aplicación y no duplica nada.
> - Un permiso que el tenant no ofrezca se omite y se avisa; no detiene el alta. Exchange y Teams (PowerShell) no se piden en esta etapa (`DT-131`).
> - El cliente entrega el ID de la aplicación con `PATCH /v1/assets/{id}/connection` y valida como en cualquier conexión de nube. Al validar, el trabajador obtiene un token de la aplicación con el certificado, comprueba el tenant y los permisos; lo que el cliente corrige se señala en `client_id`.
> - El certificado vence a los 2 años y no hay renovación todavía (`DT-130`).
> - El script y los textos nunca nombran al motor de evaluación (D70).

### PATCH /v1/assets/{id}/connection — Entregar el rol creado

| | |
|---|---|
| **Quién** | `admin_empresa` |
| **Éxito** | `200` con el mismo `provisioning` (sigue `pending`) |
| **Errores** | `403` · `404` · `422 VALIDATION_FAILED` (no tiene forma de ARN, la cuenta del ARN no coincide con `external_account_id`, o el número de proyecto no son dígitos) |

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `role_arn` | string | sí en `readonly_role` | **Un `role_arn` no es un secreto** |
| `project_number` | string | sí en `identity_federation` | 6 a 19 dígitos; lo imprime el script de alta. No es un secreto |
| `client_id` | string (GUID) | sí en `app_certificate` | El ID de la aplicación que imprime el script de alta. No es un secreto |

```json
{ "role_arn": "arn:aws:iam::123456789012:role/MonkeyReadOnly" }
```

```json
{ "project_number": "983014806332" }
```

> Un campo del otro canal da `422 field.not_allowed`.

#### F. Microsoft 365 con el botón (`admin_consent`, D157)

**Alta** (`POST /v1/assets`): como en las demás, con `platform: "microsoft_365"` y `connection_method: "admin_consent"`. **No lleva** `external_account_id`, `regions` ni `credentials` (`422 field.not_allowed`). `connection_setup`: `{ "method": "admin_consent", "tenant_id": null, "steps": [3 textos] }`. No admite `PATCH …/connection` (`409`) ni editar `external_account_id` (`422`).

| Método | Ruta | Quién | Qué hace |
|---|---|---|---|
| `POST` | `/v1/assets/{id}/connection/microsoft/start` | `admin_empresa` | `200 { "authorize_url": "https://login.microsoftonline.com/…" }`; la pantalla manda el navegador ahí. `409 CONNECTION_METHOD_NOT_APPLICABLE` / `ASSET_ALREADY_ACTIVE` · `503 CONNECTION_UNAVAILABLE` sin la aplicación de Monkey configurada |
| `POST` | `/v1/assets/{id}/connection/microsoft/complete` | `admin_empresa` | Cuerpo `{ "handle" }`. `200` con el activo (`tenant_id` ya puesto, conexión `pending`); después la pantalla llama a **validar**. `422` en `handle` (`connection.consent_invalid`) si venció, no es de esta sesión o de este activo |

**La vuelta a la pantalla:** `{PLATFORM_APP_URL}/integraciones/microsoft?m365=<recibo>&asset=<id>` si autorizó, o `?m365_error=<motivo>&asset=<id>` (sin `asset` si el recibo venció). Motivos: `cancelled` · `expired` · `not_admin` · `personal_account` · `identity_rejected` · `unavailable`.

**Direcciones a las que vuelve Microsoft** (públicas, del navegador; fuera de la documentación de la API; responden `303`): `POST /v1/integrations/microsoft/signin` y `GET /v1/integrations/microsoft/consent`.

**Comprobar (`POST /v1/assets/{id}/validate`) con el botón:** si Microsoft aún no aplicó la autorización o falta aprobarla, `422 CONNECTION_FAILED` con el campo `consent` (`connection.consent_required`). La pantalla reintenta sola unas veces antes de mostrarlo. Despliegue: `Backend/deploy/microsoft-365.md`.

