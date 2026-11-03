---
id: contracts-onboarding-c3-validar
name: Contrato — Onboarding, Conexión de activos, validar
description: Comprobar la conexión de verdad, descubrir los activos de la cuenta y elegir cuáles son de un servicio.
type: contract
---

# Conexión de activos — validar

Contexto común del componente (confidencialidad, errores, estado de implementación y preguntas abiertas): [`README.md`](README.md).

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
`contracts/control-tecnico.md`.

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
