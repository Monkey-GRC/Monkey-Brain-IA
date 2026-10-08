---
id: contracts-control-tecnico
name: Contrato — Control Técnico (conexión de nube y resultados)
description: Cómo el cliente conecta una cuenta de nube (rol de solo lectura, llaves o agente), cómo se valida y cómo lee el estado de preparación y los hallazgos.
type: contract
---

# Control Técnico — conexión y resultados

**Estado: PROPUESTA (2026-10-08), acordada en lo general; ver «Estado de implementación» al final para lo construido.** Ver `conventions.md` y `enums.md`.

**Qué reemplaza.** El paso 3 de `onboarding-technical-control.md` pedía credenciales por conexión (rol, usuario de base, llave SSH) que el
modelo real no usa (D48, DT-31). Esta propuesta sustituye `credentials` en `POST /v1/assets` y añade la lectura de resultados (DT-49). El
resto de ese contrato (escenario, scope, `activate`, `schedule`, listado) **no cambia**.

**Entidades:** `assets`, `asset_provisionings`, `asset_resources`, `executions`, `check_results`, `evaluations`, `findings`
(`modelo-datos.md` §6.3, §7.4, §8, §9). **Rol:** `admin_empresa`. **App:** Monkey Platform.

> ⚠️ **Confidencialidad.** Ningún campo, valor, mensaje ni ejemplo nombra al proveedor de ningún motor. Se habla de «sonda», «evaluación
> automática» o «capacidad automática». Los textos que traen los motores (descripciones, remediaciones) **no salen tal cual**: pueden nombrar
> al proveedor (`P11`, `P14` D3).
>
> ⚠️ **Lenguaje de la superficie** (`philosophy.md`). Nada de lo que ve el cliente por defecto lleva códigos de control ni de requisito.
> Los códigos técnicos viajan solo en el objeto `technical` y solo si se pide `view=technical` («modo auditor»).

## Cómo se conecta cada cosa

| Qué se conecta | `connection_category` | Canales (`connection_method`) |
|---|---|---|
| Cuenta de nube (AWS, Azure, GCP) | `ac_01` | `readonly_role` (recomendado) · `access_keys` |
| Servidor en nube, servidor on-premise o equipo | `ac_02`, `ac_04`, `ac_06` | `agent` |
| Base de datos | `ac_03`, `ac_05` | `agent` |

El cliente **elige** el canal entre los que existen para su categoría y Monkey lo guía (D53). `GET /v1/catalogs/automated-capabilities`
añade a cada capacidad el campo `connection_methods` (array, el primero es el recomendado).

## Paso 3 (nuevo) — registrar y conectar

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

`201`: el activo nace `pending` y **Monkey le entrega lo que el cliente debe hacer**, sin pedirle ningún secreto:

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
      "monkey_account_id": "210987654321",
      "launch_url": "https://console.aws.amazon.com/cloudformation/home#/stacks/quickcreate?templateURL=…&param_ExternalId=mk-3f9a1c7e2b",
      "permissions": ["Solo lectura de la configuración de la cuenta"],
      "steps": ["connection.aws_role.step_1", "connection.aws_role.step_2", "connection.aws_role.step_3"]
    }
  }
}
```

- `external_id` lo genera Monkey, es único por activo y evita que otro cliente use el rol del tuyo; **no es un secreto del cliente**.
- `launch_url` abre la plantilla ya rellenada (un clic). `steps` son claves i18n para que la pantalla narre el proceso.
- `external_account_id` es obligatorio en `readonly_role` y `access_keys`. `regions` es obligatorio (≥ 1) y son **las únicas que se evalúan** (D53).

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

`credentials` **nunca se devuelve**: se cifra (`SEG-24`). La respuesta lleva `connection_setup.method = "access_keys"` con un aviso
(`"warning": "connection.access_keys.less_secure"`) y los pasos para crear un usuario de solo lectura. **Es menos seguro** (llaves de larga
vida): la pantalla debe decirlo y ofrecer el rol primero.

### `POST /v1/assets` — servidor, base de datos o equipo con agente

```json
{
  "name": "srv-app-prod-01",
  "connection_category": "ac_02",
  "connection_method": "agent",
  "platform": "ubuntu_22_04",
  "criticality": "high",
  "tags": [],
  "service_ids": ["5c2e8a41-7b9d-4e03-a1f6-8d40c2b7e915"]
}
```

`201` igual, con:

```json
"connection_setup": {
  "method": "agent",
  "install_command": "curl -fsSL https://install.monkey.example/agent.sh | sudo MONKEY_TOKEN=<token> bash",
  "expires_at": "2026-10-15T00:00:00Z",
  "steps": ["connection.agent.step_1", "connection.agent.step_2"]
}
```

El comando lo genera Monkey: pre-registra al agente en el grupo de esa empresa y entrega su clave dentro del comando (D54). El cliente no
elige el grupo ni se inscribe por su cuenta. **`install_command` apunta a un instalador de Monkey**: no expone el nombre del proveedor
(el hospedaje y la firma de ese instalador están sin construir, ver «Preguntas abiertas»). `<token>` es secreto de un solo uso: el
`GET` posterior **no lo vuelve a devolver**.

### `POST /v1/assets/{id}/validate` — validar la conexión

Hace una comprobación real y de **solo lectura**: en `readonly_role` asume el rol y confirma que la cuenta es la declarada; en `access_keys`
confirma la identidad de las llaves; en `agent` comprueba que el agente se conectó y pertenece al grupo de la empresa. `200`:

```json
{
  "statusCode": 200,
  "message": "asset.validated",
  "data": {
    "connection_status": "validated",
    "last_validated_at": "2026-10-09T09:14:33Z",
    "evaluable": { "regions": ["us-east-1", "us-east-2"], "checks_available": 655 },
    "probe_mode": "real"
  }
}
```

`checks_available` es lo que la sonda puede evaluar de verdad en ese activo (deja de ser la constante 402, `DT-2`). `probe_mode` es `real`,
`simulated` o `unavailable` (honestidad: «Automatizado ≠ Operativo»).

Errores de validación (`422 CONNECTION_FAILED`, con `error.fields`):

| `field` | `code` | Qué pasó |
|---|---|---|
| `role_arn` | `connection.role_not_found` | El rol no existe o Monkey no puede asumirlo (revisa el `external_id`) |
| `role_arn` | `connection.account_mismatch` | El rol es de otra cuenta que la declarada |
| `permissions` | `connection.insufficient_permissions` | Faltan permisos de lectura; el mensaje dice cuáles |
| `credentials` | `connection.credentials_invalid` | Las llaves no son válidas o están desactivadas |
| `agent` | `connection.agent_not_connected` | El agente aún no se ha conectado (**reintentable**) |
| `agent` | `connection.agent_group_mismatch` | El agente cayó en un grupo que no es de esta empresa (se rechaza, `SEG-45`) |

El mensaje habla de «evaluación automática», nunca del proveedor.

## Operación continua (nuevo)

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

- `readiness`: `ready` · `almost_ready` · `needs_work` · `not_measured`. **`not_measured` no es un fallo**: es un hueco de cobertura (R-06, `pending` ≠
  `non_compliant`).
- `coverage` y `of_measured` son **dos números separados** (los dos son verdad): cuánto se midió y, de lo medido, cuánto cumple.
  **No existe un porcentaje consolidado**; si la pantalla lo calcula para mostrarlo, va **debajo** y nunca como métrica principal.
- `areas`: agrupa las pruebas del comité en lenguaje de negocio (`identity_access`, `data_network`, `logging_backup`; las claves y
  etiquetas, en `enums.md`). El mapeo área ← prueba no es del contrato.
- `needs_manual_review`: lo que la sonda no puede decidir (`MANUAL` → `not_run`). Se cierra con evidencia que sube el cliente.
- `includes_proposed_mappings`: `true` si parte de lo medido se apoya en vínculos check→prueba que el comité **aún no ratificó** (desarrollo y demostración).
  En producción es `false` y solo cuenta lo ratificado; la pantalla debe decirlo cuando sea `true`. Antes de la primera corrida, `readiness` es
  `not_measured` con todo en cero (no un `404`).
- Un cálculo **no** se declara `ready` si hay algo `not_compliant` aplicable (R-05: una falla aplicable ⇒ no cumple).

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

### `GET /v1/assets/{id}/results?view=technical` — modo auditor

Secundario, paginado, para el auditor o el usuario avanzado. Ítems por check y recurso:

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

## Errores nuevos

| HTTP | `error.code` | Cuándo |
|---|---|---|
| 409 | `CONNECTION_METHOD_NOT_APPLICABLE` | El canal no existe para esa categoría (p. ej. `agent` en `ac_01`) |
| 409 | `EXECUTION_IN_PROGRESS` | Ya hay una ejecución en curso para el activo |
| 409 | `ASSET_NOT_VALIDATED` | Evaluar un activo sin conexión validada |
| 422 | `CONNECTION_FAILED` | La validación no pudo conectar (tabla de arriba) |
| 422 | `VALIDATION_FAILED` | `regions` vacío o fuera del catálogo, `external_account_id` mal formado |

Claves i18n nuevas: `connection.aws_role.step_*`, `connection.agent.step_*`, `connection.access_keys.less_secure`, `connection.*` de la tabla,
`execution.queued`, `readiness.read`, `finding.*`.

## Auditoría

Acciones nuevas (`<recurso>.<verbo>`): `asset.connection_set` (rol o llaves entregados; sin secretos en `after_state`), `asset.validate`,
`execution.queue`. Cada una, en la misma transacción que el efecto (D52).

## Preguntas abiertas

| Qué | Estado |
|---|---|
| **Cuenta de AWS de Monkey que asume el rol** (`monkey_account_id`) y la plantilla del rol | ❌ Falta crear la cuenta y publicar la plantilla (infraestructura) |
| **Instalador de Monkey para el agente** (hospedaje, firma, qué ve el cliente en el comando) | ❌ Sin construir. El comando de ejemplo es ilustrativo |
| **Permisos exactos del rol de solo lectura** | ❌ A verificar contra la documentación vigente del motor; el contrato no los fija |
| **Qué texto redacta cada hallazgo** (`finding.*`) y quién lo revisa antes de llegar al cliente | ❌ `P14` E2. Mientras tanto, los campos pueden venir `null` |
| **Las áreas** (`identity_access`, `data_network`, `logging_backup`) y su mapeo a las pruebas | ◐ Propuesta de desarrollo; falta ratificar con el comité |
| **Azure y GCP** (`platform`, otro formato de `external_account_id`, otro modelo de rol) | ❌ Fuera de esta propuesta; sin cuentas de prueba |
| **Hallazgos para checks sin prueba asignada** | ✅ No cuentan hasta que el comité responda (`P15`) |

## API interna del trabajador (no es para el frontend)

La usa **solo** el trabajador que ejecuta el motor (D57). **No está publicada** fuera de la red interna y no usa la cookie del cliente: va con
`Authorization: Bearer <RUNNER_TOKEN>` (un secreto de servicio, comparado en tiempo constante; SEG-47). Misma forma de sobre y de error que el
resto (`conventions.md`). Nunca devuelve ni registra una credencial más allá de lo estrictamente necesario para esa corrida.

| Método y ruta | Qué hace |
|---|---|
| `POST /internal/runner/claim` | Reclama la próxima ejecución `queued` de **cualquier** empresa y la pasa a `running`. `204` si no hay |
| `POST /internal/runner/executions/{id}/results` | Entrega el resultado crudo del motor; el backend lo interpreta y lo guarda; la ejecución pasa a `completed` |
| `POST /internal/runner/executions/{id}/fail` | Informa que la corrida no pudo conectar; pasa a `failed` con su razón |

`claim` → `200`:

```json
{
  "statusCode": 200,
  "message": "runner.claimed",
  "data": {
    "execution_id": "c41f…",
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

`fail` — body: `{ "tenant_id": "a1b2…", "reason": "connection.role_not_found" }` (clave de la tabla de errores de `validate`).

`tenant_id` es el que el trabajador recibió al reclamar: con él el backend abre la transacción de esa empresa. **Si el trabajador lo falsea, RLS no
encuentra la ejecución y responde `409 EXECUTION_NOT_RUNNING`**: no puede escribir en otra empresa.

**Una ejecución que se queda en `running` más de 30 minutos** (el trabajador murió) pasa a `failed` con `execution.timed_out`; lo hace el propio
`claim` al barrer. Tampoco mueve la preparación.

## Estado de implementación (2026-10-09)

| Endpoint | Estado |
|---|---|
| `POST /v1/assets/{id}/executions` (202), `GET …/executions` (paginado), `GET …/readiness` | ✅ Construidos y probados por HTTP (cookie, rol, 404 entre empresas, 409) |
| `POST /internal/runner/claim` · `…/executions/{id}/results` · `…/fail` | ✅ Construidos y probados: token de servicio, fuera del prefijo `/v1`, rechazo de lo que llega por el proxy, cuerpo de hasta 25 MB solo en `results` |
| `GET …/findings`, `GET …/results?view=technical` | ❌ Sin construir (necesitan la redacción de los siete campos, `P14` E2) |
| `POST /v1/assets` con `connection_method`, `PATCH …/connection`, `validate` real, `connection_setup` | ❌ Sin construir: hoy sigue el formulario provisional del paso 3 (`credentials`), que el trabajador sabe leer (INTERINO) |

**Configuración:** `RUNNER_TOKEN` (sin él, `/internal/runner` no existe) y `READINESS_INCLUDE_PROPOSED` (`true` solo en desarrollo y demostración).
