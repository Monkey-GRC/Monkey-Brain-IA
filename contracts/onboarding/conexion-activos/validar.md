---
id: contracts-onboarding-c3-validar
name: Contrato — Onboarding, Conexión de activos, validar
description: Comprobar la conexión de verdad, descubrir los activos de la cuenta y elegir cuáles son de un servicio.
type: contract
---

# Conexión de activos — validar

| | |
|---|---|
| **Qué es** | Comprobar la conexión de verdad, descubrir los activos de la cuenta y elegir cuáles son de un servicio |
| **Rol** | `admin_empresa` |
| **Contexto común** | Confidencialidad, errores, estado de implementación y preguntas abiertas: [`README.md`](README.md) |

## Índice de endpoints

| Método | Ruta | Para qué |
|---|---|---|
| `POST` | [`/v1/assets/{id}/validate`](#post-v1assetsidvalidate--validar-la-conexión) | Validar la conexión |
| `GET` | [`/v1/assets/{id}/resources`](#get-v1assetsidresources--los-activos-de-la-conexión) | Los activos que la conexión reconoció |
| `PUT` | [`/v1/services/{id}/connections/{connectionId}/assets`](#put-v1servicesidconnectionsconnectionidassets--los-activos-que-son-de-este-servicio) | Fijar los activos que son de este servicio |

---

### POST /v1/assets/{id}/validate — Validar la conexión

| | |
|---|---|
| **Quién** | `admin_empresa` |
| **Éxito** | `200`. Es síncrono: espera hasta `VALIDATION_WAIT_SECONDS` |
| **Errores** | `403` · `404` · `409 ASSET_ALREADY_ACTIVE` · `422 CONNECTION_FAILED` · `503 CONNECTION_UNAVAILABLE` |

Comprobación real y de **solo lectura**, hecha por el trabajador aislado (D57, D58): en `readonly_role` asume el rol y confirma que la cuenta es la declarada; en `access_keys` confirma la identidad de las llaves.

#### Request
Sin cuerpo.

#### Response `200`
| Campo | Tipo | Qué es |
|---|---|---|
| `connection_status` | enum `provisioning_status` | `validated` |
| `last_validated_at` | datetime | |
| `technical_coverage` | string | `"n/18"`, no un porcentaje (DT-2) |
| `checks_available` | integer | Los checks del catálogo de nube (deja de ser la constante 402, `DT-2`) |
| `mode` | string | `real` · `demo` |
| `probe_mode` | string | `runner` (comprobación real), `simulated` o `unavailable` (honestidad: «Automatizado ≠ Operativo») |

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

#### Errores de validación
`422 CONNECTION_FAILED`, con `error.fields` (`code` = razón, `message` ya traducido):

| `field` | `code` | Qué pasó |
|---|---|---|
| `role_arn` | `connection.role_not_found` | El rol no existe o Monkey no puede asumirlo (revisa el `external_id`) |
| `role_arn` | `connection.account_mismatch` | El rol es de otra cuenta que la declarada |
| `credentials` | `connection.credentials_invalid` | Las llaves no son válidas o están desactivadas |
| `regions` | `connection.regions_missing` | No hay regiones declaradas |
| `platform` | `connection.provider_not_supported` | Plataforma bloqueada (`coming_soon`): también al crear, no solo al validar |

> Las razones que no son del cliente (trabajador caído, llaves base vencidas) dan `503 CONNECTION_UNAVAILABLE`.
>
> Una conexión **activa o programada también se puede volver a comprobar**: refresca los activos encontrados (`GET …/resources`) y la fecha de la última validación, pero **su estado no cambia**, ni con éxito ni con fallo. El mensaje habla de «evaluación automática», nunca del proveedor. Lo que ocurre **después** de validar (evaluar, estado de preparación, hallazgos) es otro módulo: [`../../control-tecnico.md`](../../control-tecnico.md).

### GET /v1/assets/{id}/resources — Los activos de la conexión

| | |
|---|---|
| **Quién** | `admin_empresa` |
| **Éxito** | `200`, paginado (`page_size` máx. 100) |
| **Errores** | `403` · `404` (la conexión no existe, es de otra empresa, está dada de baja o es ella misma un activo descubierto) |

Lo que la conexión reconoció dentro de la cuenta, en las regiones declaradas (D59). **Cada uno es un activo propio** (D61): con su código, su IP, su zona, sus etiquetas y su criticidad. Se llena al validar la conexión y se refresca al volver a comprobarla.

#### Parámetros (query)
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `kind` | enum `resource_kind` | no | Filtro |
| `service_id` | uuid | no | Marca cuáles son de ese servicio (`in_service`, `included_count`) |
| `page`, `page_size` | integer | no | `page_size` máx. 100 |

#### Response `200`
| Campo | Tipo | Qué es |
|---|---|---|
| `discovered_at` | datetime \| null | `null` mientras la cuenta no se haya descubierto: **no es un error**, la lista viene vacía |
| `regions` | string[] | |
| `incomplete_services` | string[] | Servicios que no se pudieron leer |
| `summary[]` | `{ kind, count }` | Cuenta por clase y **no depende del filtro** |
| `included_count` | integer | Solo con `service_id` |
| `items[]` | objeto | `id`, `code`, `kind`, `type`, `name`, `region`, `platform`, `ip_address`, `location`, `criticality`, `tags[]`, `attributes` y `in_service` (solo con `service_id`) |

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

> - `attributes` trae solo lo que se pudo leer. **`os` es una inferencia** a partir de la imagen (`os_source: "image"`); si no se pudo, es `null`.
> - Solo `server`, `database`, `storage` y `function`: los recursos que solo conoce la evaluación (`other`) no son activos y no salen.

### PUT /v1/services/{id}/connections/{connectionId}/assets — Los activos que son de este servicio

| | |
|---|---|
| **Quién** | `admin_empresa` |
| **Éxito** | `200`. Idempotente |
| **Errores** | `403` · `404` (el servicio o la conexión no existen para la empresa, o la conexión no sirve a ese servicio) · `422 VALIDATION_FAILED` (`asset_ids`, `invalid`: algún id no es un activo activo de **esa** conexión) |

Fija **exactamente** qué activos de la conexión pertenecen al servicio (D61): los que no vienen se desenlazan.

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `asset_ids` | uuid[] | sí | Activos activos de la conexión |

```json
{ "asset_ids": ["…", "…"] }
```

#### Response `200`
```json
{ "included": 3, "added": 1, "removed": 0 }
```

> **Auditoría:** `service.assets_set`.
