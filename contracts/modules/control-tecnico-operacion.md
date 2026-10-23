---
id: contracts-control-tecnico-operacion
name: Contrato — Control Técnico, operación continua
description: Ejecuciones, estado de preparación, hallazgos y API interna del trabajador sobre activos ya conectados en el Componente 3 del onboarding.
type: contract
---

# Control Técnico — operación continua

**Estado: PROPUESTA (2026-10-08), parcialmente construida; ver «Estado de implementación».** Ver `conventions.md` y `enums.md`.

**Dónde encaja.** Conectar un activo es el **Componente 3 del Onboarding** y vive en `onboarding-technical-control.md` (escenario, scope,
conexión, validación, activación, programación). Este contrato es **otro módulo del comité** (`modelo-datos.md` §8, «Control Técnico — la
operación continua»): empieza cuando un activo ya está conectado y validado. Lo que no está aquí: cómo se conecta un activo.

**Entidades:** `executions`, `check_results`, `evaluations`, `findings`, `asset_resources` (`modelo-datos.md` §7.4, §8, §9). **Rol:** `admin_empresa` (y `funcional` en lo suyo); la vista técnica la piden `auditor`, `consultor` y, desde D81, `admin_empresa`.
**App:** Monkey Platform.


> ⚠️ **Confidencialidad.** Ningún campo, valor, mensaje ni ejemplo nombra al proveedor de ningún motor. Se habla de «sonda», «evaluación
> automática» o «capacidad automática». Los textos que traen los motores (descripciones, remediaciones) **no salen tal cual**: pueden nombrar
> al proveedor (D70, `P14` D3).
>
> ⚠️ **Lenguaje de la superficie** (`philosophy.md`). Nada de lo que ve el cliente por defecto lleva códigos de control ni de requisito.
> Los códigos técnicos viajan solo en el objeto `technical` y solo si quien pide tiene el rol `admin_empresa` (D81), `auditor` o `consultor` y pide `view=technical`; para el `funcional` esa vista responde `403` (D63, D64, D81, SEG-54).

## Operación continua

### `POST /v1/assets/{id}/executions` — «evaluar ahora»

Requiere `connection_status` `validated` o `active`. Responde `202` sin esperar:

```json
{ "statusCode": 202, "message": "execution.queued", "data": { "id": "c41f…", "status": "queued", "origin": "manual", "started_at": null } }
```

`409 EXECUTION_IN_PROGRESS` si ya hay una en curso para ese activo. Una ejecución fallida es un problema de **conexión**, no un
incumplimiento (§8): `status = failed` con `failure_reason` (clave i18n), y **no mueve** el estado de preparación.

### `GET /v1/assets/{id}/executions` — historial

Paginado. Cada ítem: `id`, `status` (`queued` · `running` · `completed` · `failed`), `origin` (`scheduled` · `manual`), `started_at`,
`finished_at`, `progress` (0–100, **solo mientras corre**, nunca como métrica de cumplimiento) y `narration` (clave i18n de lo que está
haciendo: la IA narra, nunca un spinner mudo).

### `GET /v1/assets/{id}/readiness` — el estado de preparación

Con **`?service_id=`** mide solo lo que es de ese servicio (D61): se dejan fuera los resultados de activos de la conexión que **no** son suyos; lo que es de toda la cuenta
(usuarios, políticas, registro de actividad) cuenta para todos. `404` si el servicio no existe para la empresa.

Lo que ve el cliente por defecto. **Cualitativo primero; el número es secundario** (`philosophy.md`):

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

- `readiness`: `ready` · `almost_ready` · `needs_work` · `not_measured`. **`not_measured` no es un fallo**: es un hueco de cobertura (§9, D68: lo sin medir queda pendiente y **no cuenta como cumplido**; `pending` ≠
  `non_compliant`).
- `coverage` y `of_measured` son **dos números separados** (los dos son verdad): cuánto se midió y, de lo medido, cuánto cumple.
  **No existe un porcentaje consolidado de la empresa**; el de lo medido que cumple se muestra junto al estado y a la cobertura, nunca solo (D80).
- `areas`: agrupa las pruebas del comité en lenguaje de negocio (`identity_access`, `data_network`, `logging_backup`; las claves y
  etiquetas, en `enums.md`). El mapeo área ← prueba no es del contrato.
- `needs_manual_review`: lo que la sonda no puede decidir (`MANUAL` → `not_run`). Se cierra con evidencia que sube el cliente.
- `includes_proposed_mappings`: `true` si parte de lo medido se apoya en vínculos check→prueba que el comité **aún no ratificó** (desarrollo y demostración).
  En producción es `false` y solo cuenta lo ratificado; la pantalla debe decirlo cuando sea `true`. Antes de la primera corrida, `readiness` es
  `not_measured` con todo en cero (no un `404`).
- Un cálculo **no** se declara `ready` si hay algo `not_compliant` aplicable (§9, «todo o nada»: una falla aplicable ⇒ no cumple; D68). Para la categoría y el marco de un servicio, `ready` es 100%, `almost_ready` de 80% a menos de 100%, y `needs_work` menos de 80% (`modelo-datos.md` §9); y para el activo es el mismo (tests con resultado cumplidos / tests con resultado; D62, que D68 conserva porque el comité no define el activo).

### `GET /v1/assets/{id}/findings` — hallazgos, en la plantilla de 7 campos

Paginado; filtros `area`, `severity`, `status`. Cada ítem:

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

Los siete textos son **claves i18n** que el backend resuelve con `Accept-Language`. Si un hallazgo aún no tiene redacción propia, los campos
vienen `null` y `how_to_fix` cae a un texto neutro: **nunca se muestra el texto crudo del motor**. Cuando un texto lo redacta la IA,
`is_ai_generated: true` (y `ai_confidence`), siempre.

### `GET /v1/assets/{id}/results?view=technical` — vista técnica

Paginado, **para los roles `admin_empresa` (D81), `auditor` y `consultor`** (el `funcional` y `admin_monkey` reciben `403`). Ítems por check y recurso:

```json
{
  "check": "iam_root_mfa_enabled",
  "result": "passed",
  "resource": { "type": "AwsIamUser", "name": "root", "uid": "arn:aws:iam::123456789012:root", "region": "us-east-1" },
  "technical": { "test_code": "T-CLD-001", "requirement_codes": ["CC6.1"], "mapping_provenance": "monkey_proposed" },
  "evaluated_at": "2026-10-09T09:20:11Z"
}
```

`result`: `passed` · `failed` · `invalid` · `not_applicable` · `not_run`. `mapping_provenance` deja ver si el vínculo con el requisito lo
ratificó el comité o es una propuesta (`D56`). Nunca se presenta una propuesta como validada.


## Errores

| HTTP | `error.code` | Cuándo |
|---|---|---|
| 409 | `EXECUTION_IN_PROGRESS` | Ya hay una ejecución en curso para el activo |
| 409 | `ASSET_NOT_VALIDATED` | Evaluar un activo sin conexión validada |

Claves i18n: `execution.queued`, `readiness.read`, `finding.*`.

## Auditoría

`execution.queue`, en la misma transacción que el efecto (D52).

## Preguntas abiertas

| Qué | Estado |
|---|---|
| **Qué texto redacta cada hallazgo** (`finding.*`) y quién lo revisa antes de llegar al cliente | ❌ `P14` E2. Mientras tanto, los campos pueden venir `null` |
| **Las áreas** (`identity_access`, `data_network`, `logging_backup`) y su mapeo a las pruebas | ◐ Propuesta de desarrollo; falta ratificar con el comité |
| **Hallazgos para checks sin prueba asignada** | ✅ No cuentan hasta que el comité responda (`P15`) |


## API interna del trabajador (no es para el frontend)

La usa **solo** el trabajador que ejecuta el motor (D57). **No está publicada** fuera de la red interna y no usa la cookie del cliente: va con
`Authorization: Bearer <RUNNER_TOKEN>` (un secreto de servicio, comparado en tiempo constante; SEG-47). Misma forma de sobre y de error que el
resto (`conventions.md`). Nunca devuelve ni registra una credencial más allá de lo estrictamente necesario para esa corrida.

| Método y ruta | Qué hace |
|---|---|
| `POST /internal/runner/claim` | Reclama la próxima ejecución `queued` de **cualquier** empresa y la pasa a `running`. Cuerpo opcional `{ "kind": "validation" \| "assessment" }`: cada carril del trabajador pide solo el suyo (una validación no espera a una evaluación de minutos). `204` si no hay |
| `POST /internal/runner/executions/{id}/validated` | Cierra una **validación**: el rol se asumió y la cuenta es la declarada. Body `{ "tenant_id": "…" }` |
| `POST /internal/runner/executions/{id}/results` | Entrega el resultado crudo del motor; el backend lo interpreta y lo guarda; la ejecución pasa a `completed` |
| `POST /internal/runner/executions/{id}/fail` | Informa que la corrida no pudo conectar; pasa a `failed` con su razón |

`claim` → `200`:

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

En `access_keys`, `connection` lleva además las llaves descifradas **solo en esta respuesta** (red interna, nunca se registran). En `agent` no
hay corrida del trabajador: lee la sonda (otro adaptador).

`results` — body: `{ "tenant_id": "a1b2…", "engine_version": "5.44.0", "started_at": "…Z", "finished_at": "…Z", "findings": [ …salida del motor, sin tocar… ] }`.
`422 ENGINE_OUTPUT_INVALID` si una fila está mal formada (se indica cuál); no se guarda nada. `409 EXECUTION_NOT_RUNNING` si no está en curso
(o no es de esa empresa: no se distingue). Una conexión que no sirve al reclamar (sin regiones, sin rol, proveedor no soportado) **no se entrega**: se
cierra sola como `failed` con su razón y el reclamo sigue con la siguiente.

`validated` — body: `{ "tenant_id": "a1b2…", "inventory": { "resources": [ { "uid": "<arn>", "type": "AwsEc2Instance", "kind": "server", "name": "api", "region": "us-east-1", "attributes": { … } } ], "warnings": ["rds"] } }`.
`inventory` es **opcional** (una validación sin descubrimiento sigue siendo válida); máx. 500 recursos, `kind` del catálogo `resource_kind`. El backend lo guarda en la
misma transacción que cierra la validación (D59, SEG-51); `warnings` son servicios que no se pudieron leer.

`fail` — body: `{ "tenant_id": "a1b2…", "reason": "connection.role_not_found" }` (clave de la tabla de errores de `validate`).

`tenant_id` es el que el trabajador recibió al reclamar: con él el backend abre la transacción de esa empresa. **Si el trabajador lo falsea, RLS no
encuentra la ejecución y responde `409 EXECUTION_NOT_RUNNING`**: no puede escribir en otra empresa.

**Razones de fallo** (`reason` en `fail`, y `failure_reason` en el historial): `connection.role_not_found`, `connection.account_mismatch`,
`connection.credentials_invalid`, `connection.regions_missing`, `connection.not_configured`, `connection.provider_not_supported`,
`connection.method_not_supported_by_runner`, `execution.engine_failed`, `execution.engine_timeout`, `execution.output_invalid` y
`execution.timed_out`. Son claves i18n con texto en `es` y `en`; el cliente nunca ve el mensaje del motor.

**Una ejecución que se queda en `running` más de 30 minutos** (el trabajador murió) pasa a `failed` con `execution.timed_out`; lo hace el propio
`claim` al barrer. Tampoco mueve la preparación.


## Estado de implementación (2026-10-09)

| Endpoint | Estado |
|---|---|
| `POST /v1/assets/{id}/executions` (202), `GET …/executions` (paginado, con `failure_message`), `GET …/readiness` | ✅ |
| API interna del trabajador: `claim` (con `kind`), `results`, `validated`, `fail` | ✅ Probada contra el backend real, Docker real y AWS real (D57, D58) |
| `GET …/findings`, `GET …/results?view=technical` | ❌ Sin construir (necesitan la redacción de los siete campos, `P14` E2) |
| `GET /v1/controls/{control_id}/tests/{test_id}/findings` | ✅ **Qué falló y cómo corregirlo** de una prueba de nube de un control (D90, `compliance-audit.md`): título, recursos y guía de corrección traducida con IA. No es la plantilla de siete campos: esa sigue pendiente (`P14` E2) |

- El historial de evaluaciones **no incluye las validaciones** (las de conexión, ver `onboarding-technical-control.md`); cada ítem trae `failure_reason` y `failure_message`.
- Un claim del trabajador acepta `{ "kind": "validation" | "assessment" }` y devuelve `kind`; `POST /internal/runner/executions/{id}/validated` cierra una validación.

- **Al cerrar una corrida de nube** (`results` del trabajador o importación) se escriben también las `evaluations` de cada servicio que tiene el activo: una por control, test de nube y activo (`DT-50`). Es lo que alimenta los controles, el resumen y el marco. Necesita el catálogo de checks cargado (`npm run cloud:load -- --apply`): sin él, el motor descarta todos los resultados («Comprobaciones fuera del catálogo») y el cumplimiento sale «Sin medir».

**Configuración:** `RUNNER_TOKEN` (sin él, `/internal/runner` no existe) y `READINESS_INCLUDE_PROPOSED` (solo desarrollo y demostración: cuenta los vínculos check→prueba que el comité aún no ratificó, tanto en la preparación del activo como en las `evaluations`; **sin ella y sin vínculos ratificados no se escribe ninguna**).

