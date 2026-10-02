---
id: contracts-onboarding-c3
name: Contrato — Onboarding Componente 3 (Control Técnico)
description: Escenario de despliegue, scope declarado y flujo de conexión de activos sobre el catálogo ac_01 a ac_06.
type: contract
---

# Componente 3 — Control Técnico

El cliente conecta su infraestructura real. Ver `conventions.md` y `enums.md`.

**Entidades:** `scopes`, `assets`, `service_assets`, `automated_capabilities`,
`asset_provisionings` (`modelo-datos.md` §6.3, §8).
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
      { "catalog_code": "ac_01", "category": "Servicios en nube (gestionados, sin servidor)", "method": "Autorización API / rol de solo lectura u OAuth", "required_permissions": ["Rol de solo lectura", "Consentimiento OAuth"], "base_frequency": "cada 6-24 h", "supported_platforms": ["AWS", "Azure", "GCP", "Microsoft 365", "Google Workspace"], "generated_evidence": "Postura de configuración y registros de actividad de la nube" },
      { "catalog_code": "ac_02", "category": "Servidores en nube / VPS", "method": "Instalar agente ligero de Monkey (o agentless SSH/WinRM)", "required_permissions": ["sudo o administrador para la instalación"], "base_frequency": "continuo", "supported_platforms": ["Linux", "Windows", "HP-UX", "AIX", "Solaris"] },
      { "catalog_code": "ac_03", "category": "Bases de datos en nube", "method": "Agente en host + usuario de solo lectura", "required_permissions": ["Usuario de solo lectura de auditoría"], "base_frequency": "continuo", "supported_platforms": ["PostgreSQL", "MySQL", "SQL Server", "Oracle", "MongoDB"] }
    ]
  }
}
```

`GET /v1/catalogs/automated-capabilities` devuelve las 6 sin filtrar, con los mismos campos
(`catalog_code`, `category`, `supported_platforms`, `method`, `required_permissions`,
`base_frequency`, `generated_evidence`). **`provider` no aparece en ninguna de las dos
respuestas**: es la única columna de `automated_capabilities` que nunca sale.

## Paso 2 — Scope declarado

Lo que el cliente **dice** que tiene, antes de conectar nada. Sirve para comparar declarado vs
descubierto.

### `PUT /v1/services/{id}/scope`

```json
{ "server_count": 12, "cloud_count": 2, "app_count": 3, "database_count": 4, "endpoint_count": 45 }
```

```json
{
  "statusCode": 200,
  "message": "scope.saved",
  "data": {
    "id": "e1b4...",
    "server_count": 12, "cloud_count": 2, "app_count": 3, "database_count": 4, "endpoint_count": 45,
    "declared_total": 66,
    "connected_total": 0
  }
}
```

⚠️ Estos cinco contadores **no corresponden a las cinco dimensiones** del modelo
(`policy|server|database|app|cloud`): `endpoint` no es dimensión y `policy` no se cuenta.
Pendiente de reconciliar.

## Paso 3 — El flujo de conexión de un activo

> **⚠ Provisional (D48).** Lo que sigue describe lo que está construido, hecho antes de verificar cómo funciona la sonda real.
> El modelo real no entrega credenciales a Monkey (agente instalado por el cliente; Monkey lee la base/API del manager), de modo
> que la forma de `credentials` y de `validate` va a cambiar. Ver D48, DT-31 a DT-36 y P12.

Cuatro pasos: **conectar → validar → activar → programar**. Al menos uno completo de punta a
punta es criterio de aceptación del sprint.

### `POST /v1/assets` — registrar y conectar

```json
{
  "name": "srv-app-prod-01",
  "connection_category": "ac_02",
  "type": "server",
  "platform": "Ubuntu 22.04",
  "ip_address": "10.20.3.14",
  "location": "Azure East US",
  "criticality": "high",
  "tags": ["produccion", "core"],
  "service_ids": ["5c2e8a41-7b9d-4e03-a1f6-8d40c2b7e915"],
  "responsible_id": "9a1c...",
  "credentials": { "ssh_user": "monkeyagent", "ssh_private_key": "-----BEGIN OPENSSH PRIVATE KEY-----..." }
}
```

`201`:

```json
{
  "statusCode": 201,
  "message": "asset.created",
  "data": {
    "id": "7e5b2c90-3a14-4f8d-b062-1c9e7a3f5d28",
    "code": "AST-0042",
    "name": "srv-app-prod-01",
    "connection_category": "ac_02",
    "type": "server",
    "platform": "Ubuntu 22.04",
    "ip_address": "10.20.3.14",
    "criticality": "high",
    "origin": "declared",
    "status": "active",
    "operational_status": "not_monitored",
    "technical_coverage": "0/18",
    "services": [{ "id": "5c2e8a41-7b9d-4e03-a1f6-8d40c2b7e915", "name": "Mesa de servicio gestionada" }],
    "provisioning": {
      "id": "f3a8...",
      "automated_capability_code": "ac_02",
      "connection_status": "pending",
      "last_validated_at": null,
      "is_active": false
    }
  }
}
```

`credentials` **nunca se devuelve**: se cifra en `asset_provisionings.encrypted_credentials`.
El activo cuelga de la **organización**, no del servicio (decisión A2); `service_ids` crea las
filas de `service_assets`.

### `POST /v1/assets/{id}/validate` — validar la conexión

`200` si conecta:

```json
{
  "statusCode": 200,
  "message": "asset.validated",
  "data": {
    "connection_status": "validated",
    "last_validated_at": "2026-10-06T09:14:33Z",
    "technical_coverage": "18/18",
    "checks_available": 402
  }
}
```

`422 CONNECTION_FAILED` si no, con `error.fields` apuntando a lo que falta:

```json
{
  "statusCode": 422,
  "message": "asset.connection_failed",
  "data": null,
  "error": {
    "code": "CONNECTION_FAILED",
    "fields": [
      { "field": "credentials.ssh_user", "code": "connection.permission_denied", "message": "El usuario no tiene permisos suficientes para la evaluación automática." }
    ]
  }
}
```

El mensaje habla de "evaluación automática", nunca del proveedor.

### `POST /v1/assets/{id}/activate` — activar

Requiere `connection_status: "validated"`. Pone `is_active: true` y
`operational_status: "operational"`. Con la conexión sin validar, `409 NOT_VALIDATED`.

### `PUT /v1/assets/{id}/schedule` — programar

```json
{ "frequency": "continuous" }
```

`ac_01` admite `every_6h` o `every_24h`; `ac_02` a `ac_06` son `continuous`. Una frecuencia que
la capacidad no soporta devuelve `422 FREQUENCY_NOT_SUPPORTED`.

### `GET /v1/assets` — listar

Paginado, con filtros `service_id`, `connection_category`, `operational_status`. Cada elemento
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
| 422 | `CONNECTION_FAILED` | La validación no pudo conectar |
| 422 | `FREQUENCY_NOT_SUPPORTED` | Frecuencia que la capacidad no admite |
| 422 | `VALIDATION_FAILED` | Enum inválido, `ip_address` mal formada, sin `service_ids` |

Claves i18n: `deployment_scenario.saved`, `scope.saved`, `asset.created`, `asset.list`,
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
  conectar). La diferencia entre scope declarado y activos conectados es un hallazgo, no un error.

## Preguntas abiertas

Todas las que había quedaron **cubiertas por desarrollo en D46**; lo que sigue siendo un parche está en
`deuda-tecnica.md`. Ninguna bloquea el componente.

| Qué | Estado |
|---|---|
| **Los cinco contadores de `scopes` vs las cinco dimensiones** | ✅ Son **dos ejes distintos** (D46, DT-6): el scope es lo que el cliente *dice* que tiene y se compara con lo conectado por tipo de activo |
| **`assets.responsible_id`** | ◐ Opcional y aceptado por la API; **no hay forma de crear cargos todavía** (DT-9) y la pantalla lo oculta |
| **Valores de `assets.type`, `criticality`, `origin` y `status`** | ✅ Cerrados en `enums.md` (D34). El tipo ahora se **deduce de la conexión** (D46) |
| **¿Qué es «híbrido»?** | ✅ Las seis conexiones (D46, DT-7) |
| **Dónde guardar la frecuencia de `schedule`** | ✅ `asset_provisionings.schedule_frequency` (D46) |
| **Qué credenciales pide cada conexión** | ❌ **Provisional y probablemente incorrecto** (D48, DT-31): en la sonda real Monkey no recibe credenciales del cliente, sino que lee lo que el agente ya reportó. Se rediseña cuando el comité responda **P12** (quién instala los agentes, cómo se asigna cada empresa a su grupo, cómo se conecta la nube) |
| **Vínculo del activo con su agente, aislamiento entre empresas, cobertura de plataformas, nube** | ❌ Sin definir (DT-32 a DT-35, P12): hoy el activo no sabe qué agente es y solo hay pruebas para Ubuntu 22.04, Ubuntu 14.04 y Windows 11 |
| **Las 18 capacidades de `technical_coverage`** | ❌ Sin definir (DT-2): hoy es una constante |

## Estado de implementación (2026-10-01)

Implementado en `Backend/src/features/technical-control` (más `catalogs` y el progreso de `auth`) y en
`Frontend-Platform/src/app/features/technical-control`. Decisiones D46.

| Endpoint | Estado |
|---|---|
| `PUT /v1/services/{id}/deployment-scenario` | ✅ Devuelve las conexiones que aplican. `409 CAPABILITY_NOT_APPLICABLE` si dejaría fuera un activo ya registrado |
| `PUT /v1/services/{id}/scope` | ✅ Cinco contadores `>= 0`; devuelve `declared_total`, `connected_total` y `connected` por tipo |
| `GET /v1/services/{id}/technical-control` | ➕ **No está en el contrato original.** Escenario, conexiones aplicables, scope, `is_complete` y `probe_mode` en una sola lectura |
| `GET /v1/catalogs/automated-capabilities` | ✅ Las 6, sin `provider` |
| `POST /v1/assets` | ✅ Tipo deducido de la conexión; código `AST-0001` por empresa; credenciales validadas por conexión y **cifradas** |
| `GET /v1/assets` · `GET /v1/assets/{id}` | ✅ Paginado con filtros `service_id`, `connection_category`, `operational_status`. El detalle es **adición** (DT-11) |
| `POST /v1/assets/{id}/validate` | ◐ Según `PROBE_MODE`: `simulated` → `200` con `mode: demo`; `unavailable` (por defecto) → `503 CONNECTION_UNAVAILABLE`. Credenciales con el marcador `permission-denied` simulan `422 CONNECTION_FAILED` |
| `POST /v1/assets/{id}/activate` | ✅ Con la sonda simulada deja `operational_status = warning`, **no** `operational` («Automatizado ≠ Operativo») |
| `PUT /v1/assets/{id}/schedule` | ✅ Valida la frecuencia por conexión; `409 ASSET_NOT_ACTIVE` si no está activo |

- **Credenciales por conexión:** `ac_01` → `account_id` + `read_only_role` (opcional `external_id`);
  `ac_03`/`ac_05` → `db_user` + `db_password` (opcional `db_port`); `ac_02`/`ac_04` →
  `connection_method` = `agent` (por defecto, sin credenciales) o `ssh` (`ssh_user` + `ssh_private_key`);
  `ac_06` → solo agente. Error por campo con la notación `credentials.<campo>`.
- **Seguridad:** las credenciales no vuelven en ningún response, no se escriben en logs ni en `audit_logs`.
  La comprobación corre fuera de la transacción de base de datos.
- **Auditoría:** `service.deployment_scenario`, `service.scope`, `asset.create`, `asset.validate`
  (también el fallo, con `result = error`), `asset.activate` y `asset.schedule`, con el estado antes y después.
- **Progreso:** `GET /v1/auth/me` añade `technical_control` a `onboarding.completed_steps` cuando algún servicio
  tiene escenario **y** scope; entonces `next_step` es `null`. El servicio trae `technical_control`
  (`deployment_scenario`, `has_scope`, `is_complete`).
- **Confidencialidad:** el tipo `Capability` del backend no tiene `provider`; el catálogo y las respuestas lo
  omiten, y una prueba revisa respuestas, i18n, `src/`, logs y el bundle de la aplicación en cada recorrido.
- **Variables de entorno nuevas:** `CREDENTIALS_ENCRYPTION_KEY` (obligatoria) y `PROBE_MODE`
  (`simulated` | `unavailable`; `simulated` no arranca en producción).
- **Pantalla (Platform):** `/services/{id}/technical-control`, tres pasos cortos (dónde vive · cuánto tienes ·
  conectar). Los dos primeros dan el paso por hecho. Avisos honestos: «modo demostración» o «aún no está
  disponible». «Mis servicios» marca lo que falta.
