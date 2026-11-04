---
id: contracts-control-tecnico-operacion
name: Contrato — Control Técnico, operación continua
description: Ejecuciones, estado de preparación, hallazgos y API interna del trabajador sobre activos ya conectados en el Componente 3 del onboarding.
type: contract
---

# Control Técnico — operación continua

| | |
|---|---|
| **Estado** | **PROPUESTA** (2026-10-08), parcialmente construida → ver [Estado de implementación](#estado-de-implementación) |
| **App** | Monkey Platform |
| **Rol** | `admin_empresa` (y el `responsable` y el `delegado` en lo suyo); la vista técnica la piden `auditor` y `admin_empresa` (D81, D96) |
| **Entidades** | `executions`, `check_results`, `evaluations`, `findings`, `asset_resources` (`modelo-datos.md` §7.4, §8, §9) |
| **Convenciones** | [`conventions.md`](conventions.md) · enums: [`enums.md`](enums.md) |

**Dónde encaja.** Conectar un activo es el **Componente 3 del Onboarding** y vive en [`onboarding/conexion-activos/README.md`](onboarding/conexion-activos/README.md) (escenario, scope, conexión, validación, activación, programación). Este contrato es **otro módulo del comité** (`modelo-datos.md` §8, «Control Técnico — la operación continua»): empieza cuando un activo ya está conectado y validado. Lo que no está aquí: cómo se conecta un activo.

> ⚠️ **Confidencialidad.** Ningún campo, valor, mensaje ni ejemplo nombra al proveedor de ningún motor. Se habla de «sonda», «evaluación automática» o «capacidad automática». Los textos que traen los motores (descripciones, remediaciones) **no salen tal cual**: pueden nombrar al proveedor (D70, `P14` D3).
>
> ⚠️ **Lenguaje de la superficie** (`philosophy.md`). Nada de lo que ve el cliente por defecto lleva códigos de control ni de requisito. Los códigos técnicos viajan solo en el objeto `technical` y solo si quien pide tiene el rol `admin_empresa` (D81) o `auditor` y pide `view=technical`; para el `responsable` y el `delegado` esa vista responde `403` (D63, D81, D96, SEG-54).

## Índice de endpoints

| Método | Ruta | Quién | Para qué |
|---|---|---|---|
| `POST` | [`/v1/assets/{id}/executions`](#post-v1assetsidexecutions--evaluar-ahora) | `admin_empresa` | «Evaluar ahora» |
| `GET` | [`/v1/assets/{id}/executions`](#get-v1assetsidexecutions--historial) | `admin_empresa` | Historial de ejecuciones |
| `GET` | [`/v1/assets/{id}/readiness`](#get-v1assetsidreadiness--el-estado-de-preparación) | `admin_empresa` | El estado de preparación de un activo |
| `GET` | [`/v1/assets/{id}/findings`](#get-v1assetsidfindings--hallazgos) | `admin_empresa` | Hallazgos en la plantilla de 7 campos *(sin construir)* |
| `GET` | [`/v1/assets/{id}/results?view=technical`](#get-v1assetsidresultsviewtechnical--vista-técnica) | `admin_empresa` · `auditor` | Resultados por check y recurso *(sin construir)* |
| `POST` | [`/internal/runner/claim`](#api-interna-del-trabajador-no-es-para-el-frontend) | Trabajador | Reclamar la próxima ejecución |
| `POST` | `/internal/runner/executions/{id}/validated` | Trabajador | Cerrar una validación |
| `POST` | `/internal/runner/executions/{id}/results` | Trabajador | Entregar el resultado del motor |
| `POST` | `/internal/runner/executions/{id}/fail` | Trabajador | Informar que la corrida no pudo conectar |

---

## Operación continua

### POST /v1/assets/{id}/executions — «Evaluar ahora»

| | |
|---|---|
| **Quién** | `admin_empresa` |
| **Éxito** | `202` (sin esperar) |
| **Errores** | `409 EXECUTION_IN_PROGRESS` · `409 ASSET_NOT_VALIDATED` |

Requiere `connection_status` `validated` o `active`.

#### Request
Sin cuerpo.

#### Response `202`
| Campo | Tipo | Qué es |
|---|---|---|
| `id` | uuid | La ejecución |
| `status` | enum `execution_status` | `queued` al crearse |
| `origin` | string | `manual` |
| `started_at` | datetime \| null | |

```json
{ "statusCode": 202, "message": "execution.queued", "data": { "id": "c41f…", "status": "queued", "origin": "manual", "started_at": null } }
```

> Una ejecución fallida es un problema de **conexión**, no un incumplimiento (§8): `status = failed` con `failure_reason` (clave i18n), y **no mueve** el estado de preparación.

### GET /v1/assets/{id}/executions — Historial

| | |
|---|---|
| **Quién** | `admin_empresa` |
| **Éxito** | `200`, paginado |

#### Response `200`
| Campo del ítem | Tipo | Qué es |
|---|---|---|
| `id` | uuid | |
| `status` | enum `execution_status` | `queued` · `running` · `completed` · `failed` |
| `origin` | string | `scheduled` · `manual` |
| `started_at`, `finished_at` | datetime | |
| `progress` | integer 0–100 | **Solo mientras corre**; nunca como métrica de cumplimiento |
| `narration` | clave i18n | Lo que está haciendo (la IA narra, nunca un spinner mudo) |
| `failure_reason`, `failure_message` | clave i18n / texto | Solo si falló |

> El historial **no incluye las validaciones** (las de conexión, ver `onboarding/conexion-activos/validar.md`).

### GET /v1/assets/{id}/readiness — El estado de preparación

| | |
|---|---|
| **Quién** | `admin_empresa` |
| **Éxito** | `200` |
| **Errores** | `404` (el servicio no existe para la empresa) |

Lo que ve el cliente por defecto. **Cualitativo primero; el número es secundario** (`philosophy.md`).

#### Parámetros (query)
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `service_id` | uuid | no | Mide solo lo que es de ese servicio (D61): se dejan fuera los resultados de activos de la conexión que **no** son suyos; lo que es de toda la cuenta (usuarios, políticas, registro de actividad) cuenta para todos |

#### Response `200`
| Campo | Tipo | Qué es |
|---|---|---|
| `asset_id` | uuid | |
| `readiness` | enum `readiness` | `ready` · `almost_ready` · `needs_work` · `not_measured` |
| `measured_at` | datetime | |
| `coverage` | `{ measured, expected }` | Cuánto se midió |
| `of_measured` | `{ compliant, not_compliant }` | De lo medido, cuánto cumple |
| `areas[]` | `{ area, readiness, open_findings, not_measured }` | `area`: enum `readiness_area` |
| `needs_manual_review` | integer | Lo que la sonda no puede decidir (`MANUAL` → `not_run`); se cierra con evidencia que sube el cliente |
| `includes_proposed_mappings` | boolean | `true` si parte de lo medido se apoya en vínculos check→prueba que el comité **aún no ratificó** (desarrollo y demostración). En producción es `false`; la pantalla debe decirlo cuando sea `true` |

```json
{
  "statusCode": 200,
  "message": "readiness.read",
  "data": {
    "asset_id": "7e5b…",
    "readiness": "needs_work",
    "measured_at": "2026-10-09T09:20:11Z",
    "coverage": { "measured": 38, "expected": 55 },
    "of_measured": { "compliant": 31, "not_compliant": 7 },
    "areas": [
      { "area": "identity_access", "readiness": "needs_work", "open_findings": 2, "not_measured": 4 },
      { "area": "data_network", "readiness": "almost_ready", "open_findings": 1, "not_measured": 0 },
      { "area": "logging_backup", "readiness": "needs_work", "open_findings": 4, "not_measured": 3 }
    ],
    "needs_manual_review": 6,
    "includes_proposed_mappings": true
  }
}
```

#### Reglas
- **`not_measured` no es un fallo:** es un hueco de cobertura (§9, D68: lo sin medir queda pendiente y **no cuenta como cumplido**; `pending` ≠ `non_compliant`).
- **`coverage` y `of_measured` son dos números separados** (los dos son verdad). **No existe un porcentaje consolidado de la empresa**; el de lo medido que cumple se muestra junto al estado y a la cobertura, nunca solo (D80).
- **`areas`** agrupa las pruebas del comité en lenguaje de negocio (`identity_access`, `data_network`, `logging_backup`; claves y etiquetas en `enums.md`). El mapeo área ← prueba no es del contrato.
- **Antes de la primera corrida,** `readiness` es `not_measured` con todo en cero (no un `404`).
- Un cálculo **no** se declara `ready` si hay algo `not_compliant` aplicable (§9, «todo o nada»: una falla aplicable ⇒ no cumple; D68).
- Para la categoría y el marco de un servicio: `ready` es 100 %, `almost_ready` de 80 % a menos de 100 %, y `needs_work` menos de 80 % (`modelo-datos.md` §9). Para el activo es lo mismo (tests con resultado cumplidos / tests con resultado; D62, que D68 conserva porque el comité no define el activo).

### GET /v1/assets/{id}/findings — Hallazgos

| | |
|---|---|
| **Quién** | `admin_empresa` |
| **Éxito** | `200`, paginado |
| **Estado** | ❌ Sin construir: necesita la redacción de los siete campos (`P14` E2) |

#### Parámetros (query)
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `area` | enum `readiness_area` | no | Filtro |
| `severity` | enum `severity` | no | Filtro |
| `status` | string | no | Filtro |

#### Response `200`
Cada ítem sigue la **plantilla de 7 campos** (`philosophy.md`).

| Campo | Tipo | Qué es |
|---|---|---|
| `id` | uuid | |
| `area`, `severity`, `status` | | |
| `resource` | `{ type, name, region }` | |
| `what_happened` · `why_it_matters` · `how_to_fix` · `who` · `time_estimate` · `evidence_needed` · `impact` | clave i18n \| null | Los siete textos, que el backend resuelve con `Accept-Language` |
| `is_ai_generated` | boolean | `true` (y `ai_confidence`) cuando un texto lo redacta la IA, siempre |
| `detected_at` | date | |

```json
{
  "id": "9b0e…",
  "area": "identity_access",
  "severity": "high",
  "status": "open",
  "resource": { "type": "access_policy", "name": "AdministratorAccess", "region": null },
  "what_happened": "finding.mfa_missing.what",
  "why_it_matters": "finding.mfa_missing.why",
  "how_to_fix": "finding.mfa_missing.how",
  "who": "finding.mfa_missing.who",
  "time_estimate": "finding.mfa_missing.time",
  "evidence_needed": "finding.mfa_missing.evidence",
  "impact": "finding.mfa_missing.impact",
  "is_ai_generated": false,
  "detected_at": "2026-10-09"
}
```

> Si un hallazgo aún no tiene redacción propia, los campos vienen `null` y `how_to_fix` cae a un texto neutro: **nunca se muestra el texto crudo del motor**.

### GET /v1/assets/{id}/results?view=technical — Vista técnica

| | |
|---|---|
| **Quién** | `admin_empresa` (D81) · `auditor` |
| **Éxito** | `200`, paginado |
| **Errores** | `403` (`responsable`, `delegado` y `admin_monkey`) |
| **Estado** | ❌ Sin construir |

#### Response `200`
| Campo del ítem | Tipo | Qué es |
|---|---|---|
| `check` | string | El check |
| `result` | enum | `passed` · `failed` · `invalid` · `not_applicable` · `not_run` |
| `resource` | `{ type, name, uid, region }` | |
| `technical` | `{ test_code, requirement_codes, mapping_provenance }` | `mapping_provenance` deja ver si el vínculo con el requisito lo ratificó el comité o es una propuesta (`D56`). Nunca se presenta una propuesta como validada |
| `evaluated_at` | datetime | |

```json
{
  "check": "iam_root_mfa_enabled",
  "result": "passed",
  "resource": { "type": "AwsIamUser", "name": "root", "uid": "arn:aws:iam::123456789012:root", "region": "us-east-1" },
  "technical": { "test_code": "T-CLD-001", "requirement_codes": ["CC6.1"], "mapping_provenance": "monkey_proposed" },
  "evaluated_at": "2026-10-09T09:20:11Z"
}
```

> **Qué falló y cómo corregirlo** de una prueba de nube de un control está en `GET /v1/controls/{control_id}/tests/{test_id}/findings` (D90, `cumplimiento/veredictos.md`); no es la plantilla de siete campos.

---

## API interna del trabajador (no es para el frontend)

La usa **solo** el trabajador que ejecuta el motor (D57). **No está publicada** fuera de la red interna y no usa la cookie del cliente: va con `Authorization: Bearer <RUNNER_TOKEN>` (un secreto de servicio, comparado en tiempo constante; SEG-47). Misma forma de sobre y de error que el resto (`conventions.md`). Nunca devuelve ni registra una credencial más allá de lo estrictamente necesario para esa corrida.

| Método y ruta | Qué hace |
|---|---|
| `POST /internal/runner/claim` | Reclama la próxima ejecución `queued` de **cualquier** empresa y la pasa a `running`. `204` si no hay |
| `POST /internal/runner/executions/{id}/validated` | Cierra una **validación**: el rol se asumió y la cuenta es la declarada |
| `POST /internal/runner/executions/{id}/results` | Entrega el resultado crudo del motor; el backend lo interpreta y lo guarda; la ejecución pasa a `completed` |
| `POST /internal/runner/executions/{id}/fail` | Informa que la corrida no pudo conectar; pasa a `failed` con su razón |

### POST /internal/runner/claim

| | |
|---|---|
| **Quién** | El trabajador (`Authorization: Bearer <RUNNER_TOKEN>`) |
| **Éxito** | `200` con la ejecución reclamada · `204` si no hay ninguna |

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `kind` | string | no | `validation` o `assessment`: cada carril del trabajador pide solo el suyo (una validación no espera a una evaluación de minutos) |

#### Response `200`
| Campo | Tipo | Qué es |
|---|---|---|
| `execution_id`, `kind`, `tenant_id`, `asset_id`, `origin` | | |
| `platform`, `external_account_id`, `regions[]` | | |
| `connection` | objeto | `method`, y según el método `role_arn` + `external_id` (rol) o las llaves descifradas (`access_keys`, **solo en esta respuesta**: red interna, nunca se registran). En `agent` no hay corrida del trabajador: lee la sonda (otro adaptador) |

```json
{
  "statusCode": 200,
  "message": "runner.claimed",
  "data": {
    "execution_id": "c41f…",
    "kind": "assessment",
    "tenant_id": "a1b2…",
    "asset_id": "7e5b…",
    "origin": "manual",
    "platform": "aws",
    "external_account_id": "123456789012",
    "regions": ["us-east-1", "us-east-2"],
    "connection": { "method": "readonly_role", "role_arn": "arn:aws:iam::123456789012:role/MonkeyReadOnly", "external_id": "mk-3f9a1c7e2b" }
  }
}
```

> Una conexión que no sirve al reclamar (sin regiones, sin rol, proveedor no soportado) **no se entrega**: se cierra sola como `failed` con su razón y el reclamo sigue con la siguiente.

### POST /internal/runner/executions/{id}/results

| | |
|---|---|
| **Quién** | El trabajador (`RUNNER_TOKEN`) |
| **Éxito** | `200`; la ejecución pasa a `completed` |
| **Errores** | `409 EXECUTION_NOT_RUNNING` · `422 ENGINE_OUTPUT_INVALID` |

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `tenant_id` | uuid | sí | El que el trabajador recibió al reclamar; con él el backend abre la transacción de esa empresa |
| `engine_version` | string | sí | |
| `started_at`, `finished_at` | datetime | sí | |
| `findings[]` | array | sí | Salida del motor, sin tocar |

```json
{ "tenant_id": "a1b2…", "engine_version": "5.44.0", "started_at": "…Z", "finished_at": "…Z", "findings": [ ] }
```

> `422 ENGINE_OUTPUT_INVALID` si una fila está mal formada (se indica cuál); no se guarda nada. `409 EXECUTION_NOT_RUNNING` si no está en curso (o no es de esa empresa: no se distingue).

### POST /internal/runner/executions/{id}/validated

| | |
|---|---|
| **Quién** | El trabajador (`RUNNER_TOKEN`) |
| **Éxito** | `200`; cierra la validación |
| **Errores** | `409 EXECUTION_NOT_RUNNING` |

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `tenant_id` | uuid | sí | |
| `inventory.resources[]` | array | no | Máx. 500 recursos: `{ uid, type, kind, name, region, attributes }`; `kind` del catálogo `resource_kind`. Una validación sin descubrimiento sigue siendo válida |
| `inventory.warnings[]` | string[] | no | Servicios que no se pudieron leer |

```json
{ "tenant_id": "a1b2…", "inventory": { "resources": [ { "uid": "<arn>", "type": "AwsEc2Instance", "kind": "server", "name": "api", "region": "us-east-1", "attributes": { } } ], "warnings": ["rds"] } }
```

> El backend guarda el inventario en la misma transacción que cierra la validación (D59, SEG-51).

### POST /internal/runner/executions/{id}/fail

| | |
|---|---|
| **Quién** | El trabajador (`RUNNER_TOKEN`) |
| **Éxito** | `200`; la ejecución pasa a `failed` con su razón |
| **Errores** | `409 EXECUTION_NOT_RUNNING` |

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `tenant_id` | uuid | sí | |
| `reason` | string | sí | Clave de la tabla de errores de `validate` |

```json
{ "tenant_id": "a1b2…", "reason": "connection.role_not_found" }
```

### Reglas del trabajador
- **`tenant_id`:** es el que el trabajador recibió al reclamar. **Si lo falsea, RLS no encuentra la ejecución y responde `409 EXECUTION_NOT_RUNNING`:** no puede escribir en otra empresa.
- **Razones de fallo** (`reason` en `fail` y `failure_reason` en el historial): `connection.role_not_found`, `connection.account_mismatch`, `connection.credentials_invalid`, `connection.regions_missing`, `connection.not_configured`, `connection.provider_not_supported`, `connection.method_not_supported_by_runner`, `execution.engine_failed`, `execution.engine_timeout`, `execution.output_invalid`, `execution.timed_out`. Son claves i18n con texto en `es` y `en`; el cliente nunca ve el mensaje del motor.
- **Una ejecución que se queda en `running` más de 30 minutos** (el trabajador murió) pasa a `failed` con `execution.timed_out`; lo hace el propio `claim` al barrer. Tampoco mueve la preparación.

---

## Errores del módulo

| HTTP | `error.code` | Cuándo |
|---|---|---|
| 409 | `EXECUTION_IN_PROGRESS` | Ya hay una ejecución en curso para el activo |
| 409 | `ASSET_NOT_VALIDATED` | Evaluar un activo sin conexión validada |
| 409 | `EXECUTION_NOT_RUNNING` | (API interna) La ejecución no está en curso o no es de esa empresa |
| 422 | `ENGINE_OUTPUT_INVALID` | (API interna) Una fila del motor está mal formada |

**Claves i18n:** `execution.queued`, `readiness.read`, `finding.*`.

## Auditoría

`execution.queue`, en la misma transacción que el efecto (D52).

## Preguntas abiertas

| Qué | Estado |
|---|---|
| **Qué texto redacta cada hallazgo** (`finding.*`) y quién lo revisa antes de llegar al cliente | ❌ `P14` E2. Mientras tanto, los campos pueden venir `null` |
| **Las áreas** (`identity_access`, `data_network`, `logging_backup`) y su mapeo a las pruebas | ◐ Propuesta de desarrollo; falta ratificar con el comité |
| **Hallazgos para checks sin prueba asignada** | ✅ No cuentan hasta que el comité responda (`P15`) |

---

## Estado de implementación (2026-10-09)

| Endpoint | Estado |
|---|---|
| `POST /v1/assets/{id}/executions` (202), `GET …/executions` (paginado, con `failure_message`), `GET …/readiness` | ✅ |
| API interna del trabajador: `claim` (con `kind`), `results`, `validated`, `fail` | ✅ Probada contra el backend real, Docker real y AWS real (D57, D58) |
| `GET …/findings`, `GET …/results?view=technical` | ❌ Sin construir (necesitan la redacción de los siete campos, `P14` E2) |
| `GET /v1/controls/{control_id}/tests/{test_id}/findings` | ✅ **Qué falló y cómo corregirlo** de una prueba de nube de un control (D90, `cumplimiento/veredictos.md`): título, recursos y guía de corrección traducida con IA. No es la plantilla de siete campos: esa sigue pendiente (`P14` E2) |

- Un claim del trabajador acepta `{ "kind": "validation" | "assessment" }` y devuelve `kind`; `POST /internal/runner/executions/{id}/validated` cierra una validación.
- **Al cerrar una corrida de nube** (`results` del trabajador o importación) se escriben también las `evaluations` de cada servicio que tiene el activo: una por control, test de nube y activo (`DT-50`). Es lo que alimenta los controles, el resumen y el marco. Necesita el catálogo de checks cargado (`npm run cloud:load -- --apply`): sin él, el motor descarta todos los resultados («Comprobaciones fuera del catálogo») y el cumplimiento sale «Sin medir».

**Configuración:** `RUNNER_TOKEN` (sin él, `/internal/runner` no existe) y `READINESS_INCLUDE_PROPOSED` (solo desarrollo y demostración: cuenta los vínculos check→prueba que el comité aún no ratificó, tanto en la preparación del activo como en las `evaluations`; **sin ella y sin vínculos ratificados no se escribe ninguna**).
