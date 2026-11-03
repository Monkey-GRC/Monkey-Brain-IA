---
id: contracts-onboarding-c3
name: Contrato — Onboarding Componente 3 (Control Técnico)
description: Catálogo de plataformas y flujo de conexión de activos (conexiones) sobre el catálogo ac_01 a ac_06.
type: contract
---

# Componente 3 — Control Técnico

El cliente conecta su infraestructura real. Ver `conventions.md` y `enums.md`.

**Entidades:** `assets`, `service_assets`, `automated_capabilities`, `asset_provisionings` y, desde D67, el catálogo de plataformas:
`capability_platforms`, `platform_connection_methods`, `platform_regions`, `capability_frequencies` (`modelo-datos.md` §6.3, §8). `deployment_scenario_capabilities` y `services.deployment_scenario` siguen en la base sin uso hasta que `DT-81` las retire.
**Rol:** `admin_empresa`. **App:** Monkey Platform.

> ⚠️ **Confidencialidad, no negociable.** Ningún campo, valor de enum, mensaje de error ni
> ejemplo de este contrato nombra al proveedor del motor de monitoreo. Se habla de
> `automated_capability`, "sonda" o "evaluación automática".
> `automated_capabilities.provider` existe en el modelo, es **interno**, y **nunca sale en un
> response**. Es criterio de aceptación del sprint: en ninguna pantalla, log o mensaje del
> Componente 3 aparece.

## Los contratos de este componente

| Contrato | Qué cubre |
|---|---|
| [`conectar.md`](conectar.md) | Las conexiones que se ofrecen, el marketplace de plataformas y cómo se declara un activo |
| [`validar.md`](validar.md) | Comprobar la conexión, descubrir los activos de la cuenta y elegir los del servicio |
| [`gestionar.md`](gestionar.md) | Editar, quitar, activar, programar y listar |

## Errores

| HTTP | `error.code` | Cuándo |
|---|---|---|
| 409 | `ASSET_NOT_VALIDATED` | Se activa sin validar |
| 409 | `ASSET_ALREADY_ACTIVE` | Se activa o se valida un activo ya activo |
| 409 | `ASSET_NOT_ACTIVE` | Se programa un activo que aún no está activo *(añadido, D46)* |
| 503 | `CONNECTION_UNAVAILABLE` | Esta instalación aún no puede comprobar conexiones (sin sonda); el activo sigue `pending` *(añadido, D46)* |
| 409 | `CONNECTION_METHOD_NOT_APPLICABLE` | El canal no existe para esa plataforma (p. ej. `agent` en AWS) |
| 422 | `CONNECTION_FAILED` | La validación no pudo conectar (tabla del paso 3) |
| 422 | `FREQUENCY_NOT_SUPPORTED` | Frecuencia que la capacidad no admite |
| 422 | `VALIDATION_FAILED` | Enum inválido, `regions` vacío o fuera del catálogo, `external_account_id` o `role_arn` mal formados, sin `service_ids` |

Claves i18n: `asset.created`, `asset.list`,
`asset.validated`, `asset.activated`, `asset.scheduled`, `asset.connection_failed`,
`asset.not_validated`, `asset.already_active`,
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
| **Qué pide cada conexión** | ✅ Nube: rol de solo lectura o llaves (D53, D58). ❌ Servidores y bases: canal de agente, solo diseño (D71, `DT-57`) |
| **Azure y GCP** | ❌ Sin cuentas de prueba; el comité debe entregarlas. Se muestran **bloqueadas** (D67) |
| **Logos de las plataformas** | ❌ Falta confirmar el uso de marcas de terceros y quién entrega los SVG oficiales (`P21`) |
| **Las 18 capacidades de `technical_coverage`** | ❌ Sin definir (DT-2): hoy es una constante |

## Construido — D67 (2026-10-10)

El marketplace y el catálogo de conexiones en la base están implementados en `Backend` y `Frontend-Platform`.

| Pieza | Estado |
|---|---|
| Tablas `capability_platforms`, `platform_connection_methods`, `platform_regions`, `capability_frequencies`, `deployment_scenario_capabilities`; `automated_capabilities.asset_type`; `assets.platform_id` | ✅ Migraciones `20261010150000` y `…150100` (RLS del catálogo). Siembra en la propia migración y en `reference:load` (verificados idénticos) |
| Constantes de `technical-catalogs.ts` y `onboarding-catalogs.ts` (frecuencias, tipo, canales, regiones) | ✅ Retiradas; se leen de la base. Una prueba lo demuestra: agregar una región en la base cambia lo que la API ofrece y acepta. Qué conexiones ofrecía cada escenario dejó de ser una regla (D92) |
| `platforms` en `GET /v1/catalogs/automated-capabilities` y en `applicable_capabilities` | ✅ Reemplaza a `supported_platforms` |
| `platform` obligatorio en `POST /v1/assets`, con `connection.provider_not_supported` y `platform.not_in_category` | ✅ Servidores, bases y equipos quedan bloqueados: no se pueden registrar |
| `GET /v1/catalogs/aws_region` | ✅ Sale de `platform_regions`; la etiqueta, de i18n si existe |
| Marketplace (`/services/{id}/connections/new`) y paso a paso por plataforma (`…/new/{catalog}/{platform}`) | ✅ Verificado contra la API real, en tema claro y oscuro |
| Logos | ✅ 16 iconos con su variante oscura en `Frontend-Platform/public/providers/`, mostrados con `<img>`. **No son de los kits de marca**: `DT-68`, `P21` |
| Retirar el formulario provisional de servidores y bases | ✅ Cerrados `DT-31` y `DT-56` |

## Estado de implementación (2026-10-09)

Implementado en `Backend/src/features/technical-control` (más `catalogs` y el progreso de `auth`) y en
`Frontend-Platform/src/app/features/technical-control`. Decisiones D46.

| Endpoint | Estado |
|---|---|
| `PUT /v1/services/{id}/deployment-scenario` | ❌ **Retirado por D92.** Se ofrecen las seis conexiones sin declarar nada |
| `GET /v1/services/{id}/technical-control` | ➕ **No está en el contrato original.** Las conexiones disponibles y `probe_mode` en una sola lectura (D92: ya no trae escenario ni `is_complete`) |
| `GET /v1/catalogs/automated-capabilities` | ✅ Las 6, sin `provider` |
| `POST /v1/assets` | ✅ Tipo deducido de la conexión; código `AST-0001` por empresa; credenciales validadas por conexión y **cifradas** |
| `GET /v1/assets` · `GET /v1/assets/{id}` | ✅ Paginado con filtros `service_id`, `connection_category`, `operational_status`. El detalle es **adición** (DT-11) |
| `GET /v1/assets/{id}/resources` (activos de la conexión, con `service_id`) y `PUT /v1/services/{id}/connections/{id}/assets` | ✅ Construidos y probados contra AWS real (D59, D61) |
| `PATCH /v1/assets/{id}` (editar) y `DELETE /v1/assets/{id}` (baja) | ✅ Construidos y probados (2026-10-09) |
| `PATCH /v1/assets/{id}/connection`, `GET /v1/connection-templates/aws-readonly-role`, `GET /v1/catalogs/connection_method`, `GET /v1/catalogs/aws_region` | ✅ Nube (D58) |
| `POST /v1/assets/{id}/validate` | ✅ Nube: **real** vía trabajador (`PROBE_MODE=runner`), verificada contra AWS real. Otros modos: `simulated` → `200` con `mode: demo`; `unavailable` (por defecto) → `503`. Canal `agent`: `503` (`DT-57`) |
| `POST /v1/assets/{id}/activate` | ✅ Con la sonda simulada deja `operational_status = warning`, **no** `operational` («Automatizado ≠ Operativo») |
| `PUT /v1/assets/{id}/schedule` | ✅ Valida la frecuencia por conexión; `409 ASSET_NOT_ACTIVE` si no está activo |

- **Credenciales:** en nube solo el canal `access_keys` las pide (`access_key_id` + `secret_access_key`, cifradas). El canal de rol no entrega secretos. Los formularios de contraseña por conexión de servidores/bases (SSH, DB) se retiraron (D67).
- **Seguridad:** las credenciales no vuelven en ningún response, no se escriben en logs ni en `audit_logs`.
  La comprobación corre fuera de la transacción de base de datos.
- **Auditoría:** `asset.create`, `asset.validate`
  (también el fallo, con `result = error`), `asset.activate` y `asset.schedule`, con el estado antes y después.
- **Progreso:** `GET /v1/auth/me` añade `technical_control` a `onboarding.completed_steps` cuando algún servicio
  tiene al menos una conexión (D92; antes bastaba el escenario, D60); entonces `next_step` es `null`. El servicio trae `technical_control`
  (`is_complete`, `connection_count`).
- **Confidencialidad:** el tipo `Capability` del backend no tiene `provider`; el catálogo y las respuestas lo
  omiten, y una prueba revisa respuestas, i18n, `src/`, logs y el bundle de la aplicación en cada recorrido.
- **Variables de entorno:** `CREDENTIALS_ENCRYPTION_KEY` (obligatoria), `PROBE_MODE` (`runner` | `simulated` | `unavailable`; `simulated` no arranca en producción), `MONKEY_AWS_PRINCIPAL_ARN` y `VALIDATION_WAIT_SECONDS`.
- **Pantallas (Platform, D60):** `/services/{id}` es el servicio (su información y la lista de conexiones); `/services/{id}/connections/new` propone los métodos
  de conexión (el marketplace de plataformas, D67); `/services/{id}/connections/{id}` muestra la conexión y los **activos que encontró** (D59). «Mis servicios» lista los servicios con su número de conexiones.
