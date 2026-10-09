---
id: contracts-onboarding-c3
name: Contrato — Onboarding Componente 3 (Control Técnico)
description: Escenario de despliegue y flujo de conexión de activos (conexiones) sobre el catálogo ac_01 a ac_06.
type: contract
---

# Componente 3 — Control Técnico

El cliente conecta su infraestructura real. Ver `conventions.md` y `enums.md`.

**Entidades:** `assets`, `service_assets`, `automated_capabilities`,
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

## Paso 2 — El flujo de conexión de un activo

Cuatro pasos: **conectar → validar → activar → programar**. El cliente **no entrega secretos** salvo en el canal alternativo de llaves; el
resto lo entrega Monkey (D53, D58). Al menos uno completo de punta a punta es criterio de aceptación.

### Cómo se conecta cada cosa

| Qué se conecta | `connection_category` | Canales (`connection_method`) |
|---|---|---|
| Cuenta de nube (AWS; Azure y GCP, pendientes) | `ac_01` | `readonly_role` (recomendado) · `access_keys` |
| Servidor en nube, servidor on-premise o equipo | `ac_02`, `ac_04`, `ac_06` | `agent` (solo diseño, `DT-57`) |
| Base de datos | `ac_03`, `ac_05` | `agent` (solo diseño, `DT-57`) |

El cliente **elige** el canal entre los de su categoría. `GET /v1/catalogs/connection_method` y `GET /v1/catalogs/aws_region` dan las opciones;
`GET /v1/catalogs/automated-capabilities` añade `connection_methods` (el primero es el recomendado). Un activo de nube es **una cuenta**
(D53) y sus `regions` (≥ 1) son **las únicas que se evalúan**.

### `POST /v1/assets` — cuenta de nube con rol de solo lectura

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
| `platform` | `connection.provider_not_supported` | Proveedor aún no soportado |

Las razones que no son del cliente (trabajador caído, llaves base vencidas) dan `503 CONNECTION_UNAVAILABLE`.

Una conexión **activa o programada también se puede volver a comprobar**: refresca los activos encontrados (`GET …/resources`) y la fecha de la última validación, pero **su estado no cambia**, ni con éxito ni con fallo. El mensaje habla de
«evaluación automática», nunca del proveedor. Lo que ocurre **después** de validar (evaluar, estado de preparación, hallazgos) es otro módulo:
`control-tecnico-operacion.md`.

### `GET /v1/assets/{id}/resources` — los activos que la conexión reconoció

Lo que el cliente necesita ver tras conectar: **qué encontró Monkey en su cuenta**, en las regiones que declaró (D59). Se llena al validar la
conexión y se refresca al volver a comprobarla. Paginado; filtro `kind`. `404` si el activo no existe, es de otra empresa o está dado de baja.

```json
{
  "statusCode": 200,
  "message": "Estos son los activos que encontramos en tu cuenta.",
  "data": {
    "discovered_at": "2026-10-10T14:02:11Z",
    "regions": ["us-east-1", "us-east-2"],
    "incomplete_services": [],
    "summary": [{ "kind": "server", "count": 2 }, { "kind": "database", "count": 1 }],
    "items": [
      { "id": "…", "kind": "server", "type": "AwsEc2Instance", "name": "api-prod", "region": "us-east-1",
        "attributes": { "os": "Ubuntu 22.04", "os_source": "image", "state": "running", "instance_type": "t3.micro", "platform": "Linux/UNIX" } },
      { "id": "…", "kind": "database", "type": "AwsRdsDbInstance", "name": "main", "region": "us-east-1",
        "attributes": { "engine": "postgres", "engine_version": "16.3", "status": "available" } }
    ],
    "page": 1, "page_size": 50, "total": 3, "total_pages": 1
  }
}
```

- `discovered_at` es `null` mientras la cuenta no se haya descubierto (conexión sin comprobar): **no es un error**, la lista viene vacía.
- `summary` cuenta por clase (`resource_kind`, `enums.md`) y **no depende del filtro**.
- `attributes` trae solo lo que se pudo leer. **`os` es una inferencia** a partir de la imagen (`os_source: "image"`); si no se pudo, es `null`. La pantalla
  debe decir «según su imagen» y nunca presentarlo como verificado.
- Solo `server`, `database`, `storage` y `function`: los recursos que solo conoce la evaluación (`other`) no son activos del cliente y no salen.

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
Ejecuciones, resultados y hallazgos **se conservan** (son evidencia). `200` con `data: null`. `409 EXECUTION_IN_PROGRESS` si hay algo en curso;
un segundo `DELETE` es `404`. Auditoría: `asset.retire`.

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
| 409 | `CONNECTION_METHOD_NOT_APPLICABLE` | El canal no existe para esa categoría (p. ej. `agent` en `ac_01`) |
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
| **Azure y GCP** | ❌ Sin cuentas de prueba; el comité debe entregarlas |
| **Las 18 capacidades de `technical_coverage`** | ❌ Sin definir (DT-2): hoy es una constante |

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
| `GET /v1/assets/{id}/resources` (activos descubiertos al validar) | ✅ Construido y probado (D59) |
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
  de conexión; `/services/{id}/connections/{id}` muestra la conexión y los **activos que encontró** (D59). «Mis servicios» lista los servicios con su número de conexiones.
