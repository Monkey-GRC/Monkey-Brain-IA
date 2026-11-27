---
id: contracts-control-tecnico-operacion
name: Contrato — Control Técnico, operación continua
description: Ejecuciones, estado de preparación, hallazgos y API interna del trabajador sobre activos ya conectados en el Componente 3 del onboarding.
type: contract
---

# Control Técnico — operación continua

> **VF18 (D128): este contrato describe la API construida con el catálogo v1.** Con la VF18 los catálogos son los de la sonda 4.14.7 y del motor de nube 5.45.0 con 20 plataformas, solo cuentan los vínculos de `TEST_CHECKS` con su rol, y la evidencia automática vence a las 24 horas (D129, D131).

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
| `GET` | [`/v1/assets/{id}/agent-install`](#instalar-la-sonda-en-un-servidor--estado-empezar-mostrar-generar-de-nuevo) | `admin_empresa` | El estado de la instalación de la sonda en un servidor (sin secretos) *(D113)* |
| `POST` | `/v1/assets/{id}/agent-install` | `admin_empresa` | Empezar: deja en cola la creación del agente (`202`) *(D113)* |
| `POST` | `/v1/assets/{id}/agent-install/reveal` | `admin_empresa` | Mostrar el comando, con la clave adentro, **una sola vez** *(D113)* |
| `POST` | `/v1/assets/{id}/agent-install/regenerate` | `admin_empresa` | Generar el comando de nuevo: retira el agente anterior y crea otro *(D113)* |
| `GET` | `/v1/install/agent.sh` · `/v1/install/agent.ps1` | Público | Los instaladores que ejecuta el comando; sin secretos *(D113)* |
| `POST` | `/internal/runner/executions/{id}/enrolled` | Trabajador | Entregar el id y la clave del agente creado *(D113)* |
| `POST` | `/internal/runner/executions/{id}/removed` | Trabajador | Avisar que se retiró de la sonda el agente de un servidor dado de baja *(D113 punto 8)* |

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

### Evaluación programada *(D158)*

No tiene endpoint: la crea el Backend. Una conexión de nube `scheduled` con `every_6h` o `every_24h` recibe una ejecución `assessment` con `origin: scheduled` cuando vence la frecuencia (contada desde la última evaluación, manual o programada); nunca evaluada, en la siguiente revisión. Si la anterior falló, un reintento a la hora. Como máximo 2 programadas esperando; en la cola, las manuales van primero. Configuración: `CLOUD_SCHEDULE_INTERVAL_MINUTES` (5; `0` la apaga; sin valor solo corre con `PROBE_MODE=runner` y el grupo de trabajadores `default`).

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
| `mail_reviewed` | boolean o `null` | *(D157)* Solo en una evaluación **completada de Microsoft 365**: `true` si de verdad se leyó el correo (alguna verificación que solo existe con ese acceso dio `passed` o `failed`), `false` si no. `null` en cualquier otro caso. Se calcula al leer; no se guarda. La pantalla lo usa para dejar de pedir el rol «Lector global» |

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

> **Qué falló y cómo corregirlo** de una prueba automática de un control (de nube o de servidores, D113) está en `GET /v1/controls/{control_id}/tests/{test_id}/findings` (D90, `cumplimiento/veredictos.md`); no es la plantilla de siete campos.

---

## API interna del trabajador (no es para el frontend)

La usa **solo** el trabajador que ejecuta el motor (D57). **No está publicada** fuera de la red interna y no usa la cookie del cliente: va con `Authorization: Bearer <RUNNER_TOKEN>` (un secreto de servicio, comparado en tiempo constante; SEG-47). Misma forma de sobre y de error que el resto (`conventions.md`). Nunca devuelve ni registra una credencial más allá de lo estrictamente necesario para esa corrida.

| Método y ruta | Qué hace |
|---|---|
| `POST /internal/runner/claim` | Reclama la próxima ejecución `queued` de **cualquier** empresa **del grupo de trabajadores de ese backend** (`RUNNER_POOL`) y la pasa a `running`. `204` si no hay |
| `POST /internal/runner/executions/{id}/validated` | Cierra una **validación**: el rol se asumió y la cuenta es la declarada |
| `POST /internal/runner/executions/{id}/results` | Entrega el resultado crudo del motor; el backend lo interpreta y lo guarda; la ejecución pasa a `completed` |
| `POST /internal/runner/executions/{id}/fail` | Informa que la corrida no pudo conectar; pasa a `failed` con su razón |

**Microsoft 365 con el botón (D157):** `connection` es solo `{ "method": "admin_consent" }`; la organización es `external_account_id`. No viaja ninguna credencial: la de la aplicación de Monkey la tiene el trabajador (sin ella, la ejecución falla con `connection.method_not_supported_by_runner`).

### POST /internal/runner/executions/{id}/progress (D156)

Cuánto va una evaluación en curso. Cuerpo: `tenant_id` (uuid) y `percent` (entero 1-99). `204`. Solo se guarda si la ejecución está en curso y el valor **sube**; en cualquier otro caso se ignora sin error. `422` fuera de rango · `401` sin el token del trabajador. No deja rastro de auditoría (es telemetría). El historial de evaluaciones (`GET /v1/assets/{id}/executions`) lo entrega como `progress_percent` (entero 1-99 mientras está en curso e informa avance; `null` en cualquier otro caso).

### POST /internal/runner/claim

**Orden de entrega (D155):** primero las validaciones y altas; dentro de cada grupo, la empresa con menos corridas en curso y, a igualdad, la más antigua.

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
| `connection` | objeto | `method`, y según el método `role_arn` + `external_id` (rol), las llaves descifradas (`access_keys`, **solo en esta respuesta**: red interna, nunca se registran) o `external_id` + `project_number` (`identity_federation`, GCP, D112; `regions` llega vacío). En `agent` no hay corrida del trabajador: lee la sonda (otro adaptador) · `client_id` + `certificate_thumbprint` + `private_key_pem` (`app_certificate`, Microsoft 365, D154 y D156: la clave privada **solo en esta respuesta**: red interna, nunca se registra y no sale del trabajador) |

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

```json
"platform": "gcp", "external_account_id": "acme-prod-421905", "regions": [],
"connection": { "method": "identity_federation", "external_id": "mk-3f9a1c7e2b", "project_number": "983014806332" }
```

Microsoft 365 (D154), el activo es el tenant (`external_account_id`):

```json
"connection": { "method": "app_certificate", "client_id": "0b8c…", "certificate_thumbprint": "9C0F…E41A", "private_key_pem": "-----BEGIN PRIVATE KEY-----…" }
```

> Una conexión que no sirve al reclamar (sin regiones donde aplican, sin rol, sin número de proyecto, proveedor no soportado) **no se entrega**: se cierra sola como `failed` con su razón y el reclamo sigue con la siguiente.

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
| `regions` | string[] | sí | Las evaluadas: las del claim en AWS; vacío en GCP (`global`, D112) |
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
- **Razones de fallo** (`reason` en `fail` y `failure_reason` en el historial): `connection.role_not_found`, `connection.account_mismatch`, `connection.credentials_invalid`, `connection.regions_missing`, `connection.not_configured`, `connection.provider_not_supported`, `connection.method_not_supported_by_runner`, `connection.federation_rejected`, `execution.engine_failed`, `execution.engine_timeout`, `execution.output_invalid`, `execution.timed_out`. Son claves i18n con texto en `es` y `en`; el cliente nunca ve el mensaje del motor.
- **Una ejecución que se queda en `running` más de 30 minutos** (el trabajador murió) pasa a `failed` con `execution.timed_out`; lo hace el propio `claim` al barrer. Tampoco mueve la preparación.

---

## Sonda de servidores: sincronización por agente (D113)

**Estado: D113 aprobada por Rod el 2026-11-18; lo construido en el Backend está marcado en «Estado de implementación».** Aplica a los activos con `connection_method = agent` (servidores, bases de datos y equipos). Lo que hoy dice [`conectar.md`](onboarding/conexion-activos/conectar.md) (variante C, `validate` responde `503`) sigue vigente: instalar el programa y conectarlo no pasa por `validate`.

**Cómo se enlaza.** Cada servidor del cliente es un agente de la sonda: su **grupo** es el `tenant_id` de la empresa y su **nombre** es el `asset_id` (no el del servidor, que la sonda exige único en todo el manager). El vínculo vive en `asset_agents` (`datos/modelo/08-control-tecnico.md`). El cliente **nunca** ve el nombre del proveedor de la sonda en pantalla, correo ni informe (D70).

### Instalar la sonda en un servidor — estado, empezar, mostrar, generar de nuevo

**Estado: construido en el Backend (2026-11-12).** Cuatro operaciones del `admin_empresa` sobre un activo con agente. El **sistema** (y con él el comando) sale de la **versión que el cliente declaró** al crear el activo (`os_version`, un valor de `GET /v1/catalogs/<sistema>_version`): no se pregunta de nuevo.

| Método y ruta | Qué hace |
|---|---|
| `GET /v1/assets/{id}/agent-install` | El **estado** de la instalación. **No lleva ningún secreto**: se consulta las veces que haga falta (la pantalla pregunta cada pocos segundos mientras se prepara) |
| `POST /v1/assets/{id}/agent-install` | **Empezar**: deja en cola la creación del agente y responde ya (`202`). Repetirlo es inofensivo: si ya está en curso, lista o entregada, no hace nada |
| `POST /v1/assets/{id}/agent-install/reveal` | **Mostrar el comando**, con la clave del servidor adentro, **una sola vez**. Es un `POST` y no un `GET` a propósito: leerlo lo gasta, y un reintento del navegador o de un proxy no debe poder llevarse la clave |
| `POST /v1/assets/{id}/agent-install/regenerate` | **Generar de nuevo** (`202`): si el comando no se alcanzó a copiar o se perdió. Retira el agente anterior y crea otro; el comando viejo deja de servir |

**Errores:** `404` (el activo no existe o es de otra empresa) · `409 ASSET_NOT_AGENT` (el activo no usa agente) · `409 AGENT_INSTALL_NOT_READY` (`reveal` sin comando listo, ya mostrado o caducado) · `409 EXECUTION_IN_PROGRESS` (ya se está creando el agente) · `503 AGENT_INSTALL_UNAVAILABLE` (esta instalación de Monkey no está configurada para instalar la sonda: falta la dirección, la versión o los instaladores). Un `503` no deja nada en cola.

#### El estado (`GET` y las respuestas de `POST` empezar y generar de nuevo)
| Campo | Tipo | Qué es |
|---|---|---|
| `status` | string | `not_started` · `preparing` (el trabajador está creando el agente, unos segundos) · `ready` (el comando se puede pedir, una vez, hasta `expires_at`) · `delivered` (ya se mostró o caducó: no se vuelve a mostrar) · `failed` (ver `failure_message`) |
| `failure_message` | string \| null | Solo en `failed`: el motivo, **ya traducido** (nunca el mensaje de la sonda) |
| `os` | string | `linux`, `windows`… de la versión declarada |
| `os_version` | objeto | `{ value, label }` de la versión declarada («Ubuntu 22.04 LTS»), el mismo texto que el catálogo |
| `expires_at` | datetime \| null | Solo en `ready`: hasta cuándo se puede pedir el comando |
| `requires_outbound` | objeto | `{ host, port }`: lo que el firewall del cliente debe permitir **de SALIDA** (no hace falta abrir puertos de entrada), para que lo vea antes de instalar. El cliente **ve** este host en pantalla y en su comando: debe ser un dominio neutro de Monkey, nunca uno que nombre al proveedor de la sonda (regla 1) |
| `connection` | objeto | Cómo va el servidor con Monkey una vez instalado (ver «Lectura automática»): `{ status, watching, last_sync_at }`. `status`: `pending` · `connected` · `disconnected` · `removed`. `watching`: `true` mientras Monkey lo busca solo; con `status: pending` y `watching: false`, Monkey **dejó de buscarlo** y la pantalla ofrece «Comprobar ahora» o un comando nuevo. `last_sync_at`: la última lectura guardada, o `null` |

`GET /v1/assets/{id}` trae además `agent.last_sync_at` (la «última revisión»).

**Cómo se pasa de uno a otro:** `not_started` →(empezar)→ `preparing` →(el trabajador crea el agente)→ `ready` →(mostrar)→ `delivered`. Un `failed` se reintenta con empezar. Una clave **sin leer** que caduca pasa a `delivered`: se genera una nueva. Generar de nuevo desde cualquier estado vuelve a `preparing`.

#### Mostrar el comando (`POST …/reveal`) → `200`
| Campo | Tipo | Qué es |
|---|---|---|
| `os`, `os_version`, `requires_outbound` | | Igual que en el estado |
| `options[]` | array | `kind` (`command` o `file`), `label`, y según el tipo `shell` + `value` (el comando, **sensible**) o `filename` + `content` (el archivo, **sensible**) |

| `os` | Opciones |
|---|---|
| `linux` | Un `command` (`shell: bash`): `curl -fsSL '<instaladores>/agent.sh' \| sudo bash -s -- --manager '…' --port 1514 --name '<id del activo>' --version '4.14.6' --key '<clave>'`. Un solo comando para todas las distribuciones: el instalador detecta `apt`, `dnf`, `yum` o `zypper` |
| `windows` | Un `command` (`shell: powershell`, se pega tal cual en una consola de administrador) y un `file` (`instalar-monkey.ps1`, ya con los datos del servidor escritos adentro; el navegador lo descarga) |
| `macos`, `solaris`, `hp_ux` | Todavía sin instalador: `409` |

```json
{
  "statusCode": 200,
  "message": "agent_install.revealed",
  "data": {
    "os": "windows",
    "os_version": { "value": "windows_server_2022", "label": "Windows Server 2022" },
    "options": [
      { "kind": "command", "label": "PowerShell", "shell": "powershell", "value": "<comando con la clave>" },
      { "kind": "file", "label": "PowerShell", "filename": "instalar-monkey.ps1", "content": "<script con la clave>" }
    ],
    "requires_outbound": { "host": "<destino>", "port": 1514 }
  }
}
```

**Garantías de seguridad (todas con prueba):**
- **La clave sale una sola vez.** Se guarda **cifrada** (`asset_agents.install_key_cipher`) y **solo unos minutos**; `reveal` la lee y la borra en **una sola operación atómica**: tres peticiones a la vez, una se la lleva (`200`) y las otras dos reciben `409`. Caducada, no se puede pedir.
- **Nunca se registra:** ni el comando ni la clave llegan a la bitácora ni a la auditoría (que sí guarda quién, cuándo y sobre qué servidor: `agent.install.prepare`, `agent.enroll`, `agent.install.reveal`, `agent.install.regenerate`).
- **Cada valor que entra a un comando tiene una forma estricta** (dirección, identificador, versión, clave en base64, dirección de instaladores): una comilla, un espacio o un punto y coma lo rechazan. El error nombra el campo, nunca el valor.
- **El instalador comprueba la clave contra el nombre de ESTE servidor antes de instalar nada**, y exige administrador. El de Windows verifica la **firma** del instalador del programa antes de ejecutarlo.

#### Los instaladores (públicos, sin secretos)
`GET /v1/install/agent.sh` y `GET /v1/install/agent.ps1`. Son **públicos a propósito** (el `curl` del servidor del cliente no lleva sesión) y **no contienen ningún dato de un servidor ni clave**: esos llegan como argumentos del comando. Se sirven con `Cache-Control: no-store`.

#### Configuración de esta instalación (variables de entorno del backend)
`SONDA_MANAGER_HOST` (a dónde se conecta cada servidor) · `SONDA_MANAGER_PORT` (por defecto 1514) · `SONDA_AGENT_VERSION` (la versión **fija**, la misma del manager; nunca «la última») · `AGENT_INSTALLER_BASE_URL` (dónde se sirven los instaladores, p. ej. `https://api.ejemplo.com/v1/install`) · `AGENT_INSTALL_KEY_TTL_MINUTES` (1 a 60, por defecto 15). Si alguna falta o no es válida, las cuatro operaciones responden `503` en vez de armar un comando roto o inseguro.

**Verificado:** el instalador de **Linux** se ejecutó, tal cual lo genera el backend, en un Ubuntu 22.04 limpio contra la sonda 4.14.6: el agente quedó **activo**, con el nombre del activo y **solo** el grupo de la empresa; una clave de otro servidor, un argumento con inyección y la falta de `sudo` se rechazan sin tocar nada; «generar de nuevo» retiró el agente anterior por su nombre y el instalador se repitió sin problema. El de **Windows** tiene la sintaxis validada con el analizador de PowerShell, pero **no se ha probado en un Windows real**.

> Pasar más adelante a un código de un solo uso que pide la clave al instalarse cambia solo el Backend: este contrato y la pantalla no cambian. Los servidores sin salida a internet usan un paquete autónomo: **pregunta abierta** (abajo).
### Cambios en la API interna del trabajador

Dos tipos de corrida nuevos del mismo trabajador (D113): **crear el agente** de un servidor (`enrollment`, construido) y **leer la sonda** (`assessment` con conexión `agent`, sin construir). Cada uno tiene su propio carril, y la credencial de la sonda de cada uno es **distinta** (`monkey_enroll`, que solo crea y retira agentes y grupos; `monkey_sync`, de solo lectura) y vive solo en el trabajador. Ninguna viaja por esta API.

**Crear el agente (`enrollment`).** Lo espera un cliente en pantalla, así que corre en un carril corto, como la validación (D58): una ejecución en curso más de 2 minutos se cierra como fallida y una en cola más de 2 minutos se cancela (`execution.timed_out`). Va antes que una evaluación y **no sale en el historial del cliente**.
| Operación | Qué hace |
|---|---|
| `POST /internal/runner/claim` con `kind: "enrollment"` | Trae `kind: "enrollment"`, `connection: { method: "agent" }` y `agent: { name, group }`: cómo se llama el agente en la sonda (= el `asset_id`) y a qué grupo va (= el `tenant_id`). Los dos los fija el backend; el trabajador no los inventa. **Ninguna credencial** |
| `POST /internal/runner/executions/{id}/enrolled` | El trabajador entrega `{ tenant_id, agent_id, key }`. El backend valida **otra vez** la forma de ambos (`422 ENGINE_OUTPUT_INVALID`), cifra la clave y la guarda con su caducidad, enlaza el agente al activo y cierra la ejecución en una sola transacción. `409 EXECUTION_NOT_RUNNING` si no está en curso o no es de esa empresa (no se distingue); La sonda **recicla ids** de agente: si ese id figuraba en otro activo (de cualquier empresa), ese agente ya no existe en la sonda y su vínculo era una referencia colgada; el backend lo **suelta** (`agent_id` nulo, estado `removed`, clave borrada) antes de enlazar y lo deja en la auditoría (`released_links`). `AGENT_ALREADY_LINKED` solo queda para una carrera entre dos altas simultáneas |
| `POST /internal/runner/executions/{id}/removed` | El trabajador retiró de la sonda el agente de un servidor **dado de baja** y entrega `{ tenant_id }`. Cierra la ejecución (`409 EXECUTION_NOT_RUNNING` si no estaba en curso). La baja (`DELETE /assets/{id}`) ya soltó el vínculo y la clave **al instante**, y dejó en cola una ejecución `enrollment` cuyo `claim` trae `agent: { name, group, remove: true }`: el trabajador solo retira el agente por su nombre (si ya no estaba, también termina bien). Caduca a los 2 minutos como todo `enrollment` (`DT-106`) |

Lo que hace el trabajador, en orden: comprueba la versión de la sonda (**se niega** con una que no conoce, `execution.probe_version_unsupported`) → asegura el grupo de la empresa → **retira un agente anterior con ese nombre** (un reintento o «generar de nuevo»; la sonda exige nombres únicos) → crea el agente y le asigna su grupo → lo entrega. **Si el agente se creó y no llegó a guardarse, no se deja suelto en la sonda:** lo retira antes de fallar. Razón de fallo propia: `connection.agent_enroll_failed`.

**`POST /internal/runner/claim`.** Para una conexión `agent` la respuesta no trae credenciales; trae a qué agente leer:
| Campo | Tipo | Qué es |
|---|---|---|
| `connection.method` | string | `agent` |
| `agent.agent_id` | string | El agente de la sonda enlazado al activo (`asset_agents`) |
| `agent.group` | string | El grupo esperado: el `tenant_id`. El trabajador lo lee de la sonda y el Backend lo vuelve a comprobar |

La credencial de la sonda **no viaja por esta API**: vive solo en el trabajador.

**`POST /internal/runner/executions/{id}/results`.** Para una corrida de la sonda, en vez de `findings[]` del motor de nube lleva `source: "sca"`:
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `tenant_id` | uuid | sí | El recibido al reclamar |
| `source` | string | sí | `sca` |
| `agent` | objeto | sí | `{ agent_id, name, groups[] }` tal como los devuelve la sonda |
| `sonda_version` | string | sí | La versión de la sonda con la que se leyó (se guarda en `executions.engine_version`) |
| `policies[]` | array | sí | `{ policy_id, name, scan_ended_at, checks[] }` (máx. 50 políticas; `name` es el nombre que la sonda da a la política, sirve para reconocerla si el id no está en el catálogo) |
| `policies[].checks[]` | array | sí | `{ id, result, reason, compliance[] }`; `result` es el de la sonda (`passed`, `failed`, `not applicable`, vacío…); `compliance[]` son pares `{ key, value }` con las etiquetas nativas |

El Backend: (1) comprueba que `agent.agent_id` está enlazado a **ese** activo de **esa** empresa, que `agent.name` es el `asset_id` y que `agent.groups` contiene el `tenant_id` **sin** contener además el grupo (otro UUID) de otra empresa; un grupo que no es un UUID (p. ej. de configuración por sistema operativo) no estorba; (2) resuelve cada check por su clave de tres partes (`platform` + `policy_id` + `check_id`), con la plataforma tomada de la **política**, no del sistema operativo del agente. El catálogo del comité nombra la política por su **nombre** y la sonda por su **id**: hace falta una tabla que traduzca ambos; (3) guarda `check_results` en la misma transacción, con la fecha de la **medición** (`scan_ended_at` de la política; si falta, es ilegible o es del futuro, la de la lectura); (4) no inventa lo que el catálogo no conoce; (5) en esa misma transacción marca el agente como `connected` (`first_seen_at`, `last_seen_at`, `last_sync_at`), pasa la conexión del servidor a `active` y mueve las `evaluations` de los controles (D68) con lo que midió la sonda: los tests de dimensión `server`, `database` y `app` cuyos checks la política entregó, identificados por el **id del check en el catálogo** (el mismo número de check se repite entre políticas). Un test sin ningún check devuelto queda `not_applicable`, igual que en la nube.

El conjunto «ejecutado» (`executions.checks_executed`) son los checks que el catálogo tiene de las políticas entregadas que reconoce; lo que no devolvió filas o es `not applicable` no se guarda (D56). **Lo que el catálogo no conoce** (una política o un check) no se guarda: queda en `execution_logs` como aviso, con la política y cuántos checks fueron.

El resultado de cada check se normaliza al leerlo: `passed`, `failed`, `invalid`, `not applicable` (llega como esas palabras en la versión 4.14.6, o como vacío según el cerebro: se aceptan las dos) y `not run`. **Un resultado desconocido nunca se toma por `passed`: queda `invalid`.**

```json
{ "statusCode": 200, "message": "La evaluación se completó.",
  "data": { "execution_id": "7f3c…", "status": "completed", "results": 148 } }
```

`results` son las filas guardadas (sin los `not applicable`).

| HTTP | `error.code` | Cuándo |
|---|---|---|
| 422 | `AGENT_NOT_LINKED` | El agente no está enlazado a este activo, el activo aún no tiene agente, o la empresa que dice el trabajador no es la de la ejecución |
| 422 | `AGENT_GROUP_MISMATCH` | `agent.name` no es el `asset_id`, o `agent.groups` no es el de la empresa (o incluye el de otra) |

En los dos casos **no se guarda nada** y la ejecución sigue en curso; el trabajador la cierra como `failed` con su razón (`connection.agent_group_mismatch` o `execution.output_invalid`) por `…/fail`, que queda en la auditoría (`SEG-45`). Una segunda entrega de la misma ejecución es `409 EXECUTION_NOT_RUNNING`.

**`POST /v1/assets/{id}/executions` en un servidor con agente.** No hay «validación» previa: la propia lectura es la prueba. Se acepta en cuanto el agente existe en la sonda (`asset_agents.agent_id` no es nulo); antes, `409 ASSET_NOT_VALIDATED`. Si el agente desapareció entre tanto, el `claim` cierra la ejecución como `failed` con `connection.agent_not_found`.

**Razones de fallo nuevas** (`reason`, claves i18n en `es` y `en`, en los espacios que ya existen): `connection.agent_not_found`, `connection.agent_no_scan_yet`, `connection.agent_disconnected`, `connection.agent_group_mismatch`, `connection.probe_unreachable`, `connection.probe_unauthorized` y `execution.probe_version_unsupported` (la versión de la sonda no es de las que sabemos leer: el trabajador **se niega a leer** en vez de adivinar). Un agente desconectado conserva su último estado en la sonda, pero eso no es una medición de hoy y no se presenta como una. El cliente nunca ve el mensaje de la sonda.

### Lectura automática (D113, aprobada por Carlos 2026-11-12)

La sonda **no avisa** cuando un servidor se conecta: Monkey tiene que ir a leerla. Para que el cliente instale y la pantalla pase sola de «Esperando» a «Conectado», y para que el cumplimiento no envejezca, el Backend tiene una **tarea programada** (`AgentReadingScheduler`) que cada minuto deja en cola las lecturas que tocan. El trabajador las reclama como cualquier otra (`assessment` con conexión `agent`, origen `scheduled`); la tarea **solo encola**, nunca lee la sonda ni espera al trabajador.

| Servidor | Cuándo toca leerlo | Valor por omisión |
|---|---|---|
| Aún no se conecta (`pending`) | Cada `AGENT_WATCH_INTERVAL_MINUTES`, **hasta** `AGENT_WATCH_WINDOW_HOURS` desde que Monkey terminó de crear su agente | 3 min · 24 h |
| Conectado (`connected`) | Cuando su última lectura guardada tiene más de `AGENT_REFRESH_INTERVAL_HOURS` | 24 h |
| Desconectado (`disconnected`) | Cada `AGENT_RECHECK_INTERVAL_MINUTES`, **sin plazo** (si el servidor vuelve, se entera solo) | 60 min |
| Cualquiera, tras una lectura que **falló de verdad** | Espera `AGENT_RECHECK_INTERVAL_MINUTES` antes de reintentar (no insiste cada 3 minutos con un error) | 60 min |

`AGENT_WATCH_INTERVAL_MINUTES=0` apaga la tarea (pruebas y scripts). La decisión de a quién le toca es una función pura (`reading-plan.ts`); una función SQL `SECURITY DEFINER` angosta (`tenant.list_agent_reading_candidates`) es lo único que ve servidores de todas las empresas: solo lee, devuelve identificadores, estado y fechas, y ya descarta lo que no puede tocar (lectura abierta, empresa archivada, conectado hace poco). Dos instancias del Backend a la vez son seguras: un servidor no puede tener dos lecturas abiertas (índice único). Tope de 200 lecturas por pasada.

**Una lectura automática que «todavía no estaba lista» no es un error del cliente.** Si el trabajador la cierra con `connection.agent_no_scan_yet` (el servidor aún no terminó su primera revisión) o `connection.agent_disconnected` (no está conectado), el Backend la deja **`cancelled`**, sin auditoría y **fuera del historial** del cliente (`GET …/executions` no la lista); cada 3 minutos serían cientos de filas. Al guardarse la primera lectura buena se **borran** las esperas acumuladas de ese servidor. Si el servidor estaba `connected` y la razón es `agent_disconnected`, pasa a `disconnected` y **eso sí se audita** (`agent.disconnected`, sin persona). Cualquier otra razón (`connection.agent_not_found`, `agent_group_mismatch`…), o una lectura que pidió una persona con `POST …/executions` («Comprobar ahora»), se cierra como `failed` con su motivo a la vista.

**«Comprobar ahora»** es el atajo de lo que Monkey hace solo, nunca un paso obligatorio: la pantalla llama a `POST /v1/assets/{id}/executions` y mira `GET …/executions` hasta que cierra. Pasado el plazo de 24 h sin verlo conectarse (`connection.watching: false`), la pantalla le dice al cliente qué revisar (que el comando se ejecutó sin errores y que el servidor puede salir a `requires_outbound`) y le ofrece «Comprobar ahora» o un comando nuevo.

### Preguntas abiertas de esta sección

| Qué | Estado |
|---|---|
| **Quién crea el agente** (necesita una credencial de escritura distinta de la de lectura) | ✅ El **trabajador**, en un carril corto como la validación (D58), con la credencial `monkey_enroll`; así ninguna credencial de escritura de la sonda está en el proceso que atiende a los usuarios (Carlos, 2026-11-12) |
| **El nombre del servicio instalado.** El cliente lo verá en su propio servidor con el nombre que le da el proveedor; choca con la regla de no nombrarlo | ❓ Sin decidir (comité) |
| **Servidores sin salida a internet:** paquete autónomo con la clave dentro, y los destinos que el firewall debe permitir | ❓ Sin diseñar |
| **Tope de frecuencia y retención del detalle** de `check_results` (D113 punto 5) | ❓ Valores por definir |
| **Un usuario de solo lectura por grupo** (D71) en vez de uno solo para el trabajador | ◐ La sonda admite acotar un rol por recurso (`agent:group:<grupo>`), pero no se probó; se arranca con un único usuario y la clave solo en el trabajador. **`agent:read` permite leer la clave de un agente** (verificado): el puerto de la API debe aceptar solo la IP del trabajador |
| **Con qué procedencia entra la asignación check → prueba del Excel del comité** | ✅ `monkey_proposed` (D113 punto 12): la hoja no es la versión final; el comité la ratifica por prueba cuando llegue su documento |
| **Tabla de traducción nombre ↔ id de la política**: el Excel nombra la política, la sonda la identifica por id | ✅ `catalog.sca_policies` (`sca_id` ↔ `benchmark`); el Backend reconoce por id y, si no está, por nombre |
| **Quién pide la lectura sola**: que «Conectado» se encienda sin que el cliente haga nada, y que el servidor se relea cada cierto tiempo | ✅ El Backend, con una tarea programada (ver «Lectura automática»); valores aprobados por Carlos el 2026-11-12: 3 min · 24 h · 24 h · 60 min, configurables por entorno |
| **Tope de frecuencia y retención del detalle de `check_results`** (la relectura diaria los toca) | ◐ Arranca con una lectura diaria por servidor y el detalle completo; el comité aún debe fijar el tope y cuánto se conserva |

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
| **Hallazgos para checks sin prueba asignada** | ✅ No cuentan: solo cuentan los vínculos de `TEST_CHECKS` (D129) |

---

## Estado de implementación (2026-10-09)

| Endpoint | Estado |
|---|---|
| `POST /v1/assets/{id}/executions` (202), `GET …/executions` (paginado, con `failure_message`), `GET …/readiness` | ✅ |
| API interna del trabajador: `claim` (con `kind`), `results`, `validated`, `fail` | ✅ Probada contra el backend real, Docker real y AWS real (D57, D58) |
| Declarar un servidor con su versión (`os_version`), `asset_agents`, catálogo `<sistema>_version` | ✅ Backend (D113) |
| Instalar la sonda: estado, empezar, mostrar el comando una vez, generar de nuevo, instaladores públicos, `claim` y `enrolled` de `enrollment` | ✅ Backend y trabajador (D113). Linux probado de punta a punta contra la sonda 4.14.6; Windows con la sintaxis validada, **sin probar en un Windows real** |
| Leer la sonda: `claim` y `results` de `assessment` con conexión `agent` | ✅ Backend y trabajador (2026-11-12). Probado contra Postgres real con una lectura grabada de un agente real: guarda, marca `connected`, mueve las evaluaciones y rechaza los cruces entre empresas. La lectura la pide sola una tarea programada (2026-11-12): espera, conecta, detecta la desconexión y respeta el plazo, probado con el planificador real contra Postgres real |
| `GET …/findings`, `GET …/results?view=technical` | ❌ Sin construir (necesitan la redacción de los siete campos, `P14` E2) |
| `GET /v1/controls/{control_id}/tests/{test_id}/findings` | ✅ **Qué falló y cómo corregirlo** de una prueba de nube de un control (D90, `cumplimiento/veredictos.md`): título, recursos y guía de corrección traducida con IA. No es la plantilla de siete campos: esa sigue pendiente (`P14` E2) |

- Un claim del trabajador acepta `{ "kind": "validation" | "assessment" }` y devuelve `kind`; `POST /internal/runner/executions/{id}/validated` cierra una validación.
- **Al cerrar una corrida de nube** (`results` del trabajador o importación) se escriben también las `evaluations` de cada servicio que tiene el activo (`DT-50`, D160): una por control y prueba (de dimensión nube, aplicación, base de datos o servidores) para la conexión, con lo que es de toda la cuenta, y una más por cada recurso descubierto que el servicio eligió y en el que algo se midió. De cada prueba cuentan solo los Directos de la plataforma de esa conexión. Es lo que alimenta los controles, el resumen y el marco. Necesita el catálogo de checks cargado (`npm run cloud:load -- --apply`): sin él, el motor descarta todos los resultados («Comprobaciones fuera del catálogo») y el cumplimiento sale «Sin medir».

**Configuración:** `RUNNER_POOL` (opcional, por defecto `default`; formato `^[a-z0-9][a-z0-9-]{0,39}$`, inválido = el backend no arranca): el grupo de trabajadores de ese backend. Toda ejecución que crea lleva su grupo y su `claim` solo entrega las de ese grupo; en local se usa uno propio (p. ej. `local-rod`) para no competir con el trabajador del servidor sobre la base de desarrollo.

**Configuración:** `RUNNER_TOKEN` (sin él, `/internal/runner` no existe) y `READINESS_INCLUDE_PROPOSED` (solo desarrollo y demostración: cuenta los vínculos check→prueba que el comité aún no ratificó, tanto en la preparación del activo como en las `evaluations`; **sin ella y sin vínculos ratificados no se escribe ninguna**).
