# Enums — Onboarding · Conexión de activos

> Índice de todos los enums: [`enums.md`](../../enums.md). Por el cable viaja el **valor**; la etiqueta (es/en) la resuelve i18n. Formato: [`README.md`](../../README.md#formato-de-un-enum).

## `deployment_scenario`
**Columna:** `services.deployment_scenario` · 4 valores · **ya no se pregunta (D92)**

⚠️ **Retirado de la API y de la pantalla por D92 (2026-10-25):** el cliente elige la plataforma del catálogo y se le ofrecen las seis conexiones; `GET /v1/catalogs/deployment_scenario` ya no existe. El enum y la columna siguen en la base sin uso hasta `DT-81`. **Se aparta del bloque 2A del Excel del comité**, que define estos escenarios: queda por ratificar con el comité (ver D92). Valores, por si se reabre:

| Valor | Etiqueta (es) | Conexiones que aplican |
|---|---|---|
| `cloud_managed_only` | Solo nube (gestionada) | `ac_01` |
| `cloud_with_servers` | Nube con servidores / VPS | `ac_01`, `ac_02`, `ac_03` |
| `on_premise` | On-premise | `ac_04`, `ac_05`, `ac_06` |
| `hybrid` | Híbrido | las seis (el cliente usa las que le sirvan, D46) |

## `connection_category`
**Columna:** `assets.connection_category` y `automated_capabilities.catalog_code`

| Valor | Etiqueta (es) | Plataformas (catálogo en la base, más abajo) |
|---|---|---|
| `ac_01` | Servicios en nube (gestionados, sin servidor) | AWS, Azure, GCP, Microsoft 365, Google Workspace |
| `ac_02` | Servidores en nube / VPS | Linux, Windows, HP-UX, AIX, Solaris |
| `ac_03` | Bases de datos en nube | PostgreSQL, MySQL, SQL Server, Oracle, MongoDB |
| `ac_04` | Servidores on-premise | Linux, Windows, HP-UX, AIX, Solaris |
| `ac_05` | Bases de datos on-premise | PostgreSQL, MySQL/MariaDB, SQL Server, Oracle, MongoDB |
| `ac_06` | Endpoints / estaciones de trabajo | Windows, macOS, Linux |

`ac_01` corre cada 6-24 h; `ac_02` a `ac_06` son continuos (también datos: `capability_frequencies`, D67).

## `operational_status`
**Columna:** `assets.operational_status`

| Valor | Etiqueta (es) |
|---|---|
| `operational` | Operativo |
| `warning` | Con advertencias |
| `error` | Con error |
| `not_monitored` | Sin monitoreo |

## `asset_type`
**Columna:** `assets.type`

| Valor | Etiqueta (es) | Se deduce de la conexión (D46) |
|---|---|---|
| `server` | Servidor | `ac_02` y `ac_04` |
| `database` | Base de datos | `ac_03` y `ac_05` |
| `cloud_service` | Servicio en nube | `ac_01` |
| `application` | Aplicación | — |
| `endpoint` | Endpoint | `ac_06` |
| `network_device` | Dispositivo de red | Todavía no tiene conexión que lo produzca (DT-8) |
| `documentation` | Documentación | Todavía no tiene conexión que lo produzca (DT-8) |

> `endpoint` y `network_device` se monitorean pero no son dimensiones (D5). El tipo **se deduce de la conexión** al registrar el activo (D46).

## `asset_criticality`
**Columna:** `assets.criticality`

| Valor | Etiqueta (es) |
|---|---|
| `low` | Baja |
| `medium` | Media |
| `high` | Alta |
| `critical` | Crítica |

## `asset_origin`
**Columna:** `assets.origin`

| Valor | Etiqueta (es) |
|---|---|
| `declared` | Declarado por el cliente |
| `discovered` | Descubierto al conectar |

## `asset_status`
**Columna:** `assets.status`

| Valor | Etiqueta (es) |
|---|---|
| `active` | Activo |
| `inactive` | Inactivo |

## `provisioning_status`
**Columna:** `asset_provisionings.connection_status`

**Flujo:** conectar → validar → activar → programar. Una conexión que falla no es un incumplimiento.

| Valor | Etiqueta (es) |
|---|---|
| `pending` | Pendiente |
| `validated` | Validada |
| `active` | Activa |
| `scheduled` | Programada |
| `failed` | Falló la validación |

## `connection_method`
**Columna:** `asset_provisionings.connection_method` (D53)

Nulo hasta que se elige. Qué canales existen por categoría: `contracts/onboarding/conexion-activos/conectar.md`.

| Valor | Etiqueta (es) |
|---|---|
| `readonly_role` | Rol de solo lectura (recomendado en nube) |
| `access_keys` | Usuario con llaves (menos seguro) |
| `agent` | Agente instalado |
| `identity_federation` | Federación de identidad, sin claves (GCP, D112) |

## `resource_kind`
**Columna:** `asset_resources.kind` (D59)

| Valor | Etiqueta (es) | Nota |
|---|---|---|
| `server` | Servidor | |
| `database` | Base de datos | |
| `storage` | Almacenamiento | |
| `function` | Función | |
| `other` | Otro | Solo lo conoce la evaluación; **no** se muestra como activo |

## Plataformas de conexión — `catalog.capability_platforms` (D67)

**No es un `enum`: es un catálogo en la base**, cargado por `npm run reference:load` (idempotente) y servido en `GET /v1/catalogs/automated-capabilities`. Es lo que el cliente elige en el
marketplace del paso 3. Las plataformas son las de la hoja del comité (AC-01…AC-06): en nube, proveedores; en servidores y equipos, el **sistema operativo**; en bases de datos, el **motor**.
Los nombres son marcas y **no se traducen**. `logo_key` es el nombre del SVG oficial en `Frontend-Platform` (igual a `code`, salvo `mysql_mariadb` → `mysql`). Orden = el de la hoja.

| Capacidad | Plataformas (`code` → nombre) |
|---|---|
| `ac_01` | `aws` Amazon Web Services · `azure` Azure · `gcp` GCP · `microsoft_365` Microsoft 365 · `google_workspace` Google Workspace |
| `ac_02`, `ac_04` | `linux` Linux · `windows` Windows · `hp_ux` HP-UX · `aix` AIX · `solaris` Solaris |
| `ac_03` | `postgresql` PostgreSQL · `mysql` MySQL · `sql_server` SQL Server · `oracle` Oracle · `mongodb` MongoDB |
| `ac_05` | `postgresql` PostgreSQL · `mysql_mariadb` MySQL / MariaDB · `sql_server` SQL Server · `oracle` Oracle · `mongodb` MongoDB |
| `ac_06` | `windows` Windows · `macos` macOS · `linux` Linux |

- **`availability`** (el enum de los marcos, D50): `available` | `coming_soon`. **Solo `aws` (D58), `gcp` (D112, MD-214) y `linux` y `windows` en `ac_04`, servidores on-premise (D113), están `available`** (son los flujos construidos); todas las demás se muestran **bloqueadas**.
  Pasar una a `available` exige que su flujo exista; es un cambio de dato, no de contrato.
- **Canales** (`platform_connection_methods`, el primero es el recomendado): `aws` → `readonly_role`, `access_keys`; los sistemas operativos y los motores de bases de datos → `agent`
  (diseño, DT-57); `gcp` → `identity_federation` (D112; `available` desde MD-214); Azure, Microsoft 365 y Google Workspace → ninguno hasta que se defina su canal.
- **Frecuencias** (`capability_frequencies`): `ac_01` → `every_6h`, `every_24h`; `ac_02` a `ac_06` → `continuous`.
- **Tipo de activo** (`automated_capabilities.asset_type`): `ac_01` → `cloud_service` · `ac_02`, `ac_04` → `server` · `ac_03`, `ac_05` → `database` · `ac_06` → `endpoint`.
- **Regiones** (`platform_regions`): las de AWS se cargan de la lista actual del Backend (`GET /v1/catalogs/aws_region`); GCP **no lleva regiones** (se evalúa el proyecto completo, D112); las demás plataformas no tienen regiones hasta que tengan flujo.

### Opciones de conexión (D114, MD-214)

Cada plataforma de `ac_01` que se conecta por un asistente ofrece **opciones**. Las sirve el Backend; ningún cliente las escribe a mano. Todas comparten la forma:

| Campo | Qué es |
|---|---|
| `value` | Código estable |
| `label` | Nombre según `Accept-Language` |
| `description` | Explicación corta, según `Accept-Language` |
| `availability` | `available` · `coming_soon` (enum de los marcos, D50). Las `coming_soon` se muestran bloqueadas |
| `tags` | Etiquetas de la tarjeta, de `connection_option_tag`; puede ir vacío |

- **`gcp_connection_scope`**: `project` (un proyecto o unos pocos, `available`) · `organization` (todos los proyectos de una organización, `coming_soon`).
- **`gcp_setup_method`**: `cloud_shell` (`available`) · `terraform` (`coming_soon`). Hoy solo `project` + `cloud_shell` crea una conexión (canal `identity_federation`); el Backend rechaza el resto con `422`.
- **`connection_method`** (ya existente) suma `description`, `availability` y `tags`: `readonly_role` → `recommended`; `access_keys` → `less_secure`; `identity_federation` → `recommended`; `agent` → sin etiquetas.
- **`connection_option_tag`**: `recommended` · `fastest` · `advanced` · `less_secure`. `cloud_shell` lleva `recommended` y `fastest`; `terraform`, `advanced`.
