---
id: contracts-integraciones
name: Contrato — Integraciones
description: La sección Integraciones de la empresa: el catálogo para agregar una y la lista de las que el cliente ya tiene, con su estado derivado.
type: contract
---

# Integraciones

> **VF18 (D128): este contrato describe la API construida con el catálogo v1.** Con la VF18 hay 14 categorías de integración (D129), los checks de GitHub que cuentan están en `TEST_CHECKS` (D129) y cada alerta de incumplimiento puede abrir un ticket en la herramienta conectada (D138).

| | |
|---|---|
| **Qué es** | La sección **Integraciones** de toda la empresa (D110, MD-211): el catálogo de lo que se puede conectar y la lista de lo que el cliente ya conectó |
| **Rol** | `admin_empresa` (todo) · `auditor` (solo la lista, en lectura) |
| **Arquitectura** | [`arquitectura/integraciones/README.md`](../skills/product/monkey-compliance-council/references/arquitectura/integraciones/README.md) |
| **Enums** | [`enums/integraciones.md`](enums/integraciones.md) |
| **Tickets** | MD-211 |

Una integración es una plataforma de un tercero con la que Monkey trabaja. Tiene un **propósito**:

- `measurement` (medición y cumplimiento): evalúa la configuración de la plataforma y alimenta las pruebas. Hoy son las
  plataformas de nube y SaaS del catálogo de conexiones (`ac_01`, D67) y GitHub.
- `workflow` (gestión y flujo de trabajo): no mide; ayuda a gestionar el trabajo de cumplimiento. Hoy, Jira.

**Lo que no es una integración:** los servidores, bases de datos y equipos que se conectan con la sonda (`ac_02` a `ac_06`).
Siguen en las conexiones de cada servicio.

**Esta sección no conecta nada por sí misma.** Una integración de medición disponible se conecta con el flujo que ya existe
por servicio ([`onboarding/conexion-activos/conectar.md`](onboarding/conexion-activos/conectar.md)); el frontend lleva a él.
Las `coming_soon` se muestran y no se pueden conectar.

**Confidencialidad (regla 1 del brain):** ningún campo ni texto de estas respuestas nombra al motor que evalúa.

## Índice de endpoints

| Método | Ruta | Para qué |
|---|---|---|
| `GET` | [`/v1/integrations/catalog`](#get-v1integrationscatalog--el-catálogo-para-agregar) | El catálogo para agregar una integración |
| `GET` | [`/v1/integrations`](#get-v1integrations--las-integraciones-de-la-empresa) | Las integraciones que la empresa ya tiene, con su estado |
| `GET` | [`/v1/integrations/{code}`](#get-v1integrationscode--el-detalle-de-una-integración) | El detalle de una integración: qué hace, qué permisos pide, qué evalúa, cómo se protege y sus conexiones |

---

### GET /v1/integrations/catalog — El catálogo para agregar

| | |
|---|---|
| **Quién** | `admin_empresa` |
| **Éxito** | `200`, **sin paginar**: el catálogo tiene decenas de filas |
| **Errores** | `401` · `403` (cualquier otro rol) |

Sale de `catalog.integrations` (más su plataforma de conexión cuando la tiene). El frontend no tiene la lista en el código.

#### Response `200`

| Campo | Tipo | Qué es |
|---|---|---|
| `code` | string | Identificador estable (`aws`, `github`, `jira`) |
| `name` | string | La marca tal cual: no se traduce |
| `logo_key` | string | Nombre del SVG en Frontend-Platform (`public/providers/<logo_key>.svg` y `-dark.svg`) |
| `purpose` | enum `integration_purpose` | `measurement` · `workflow` |
| `availability` | enum `framework_availability` | `available` · `coming_soon`. Si la integración tiene plataforma de conexión, es **la de la plataforma** (un dato, un dueño) |
| `description` | string | Para qué le sirve al cliente, ya traducida según `Accept-Language` (`integration.description.<code>`) |
| `connection` | objeto \| null | Dónde se conecta: `{ "category": "ac_01", "platform": "aws" }`. `null` si todavía no tiene flujo de conexión |
| `connected` | boolean | `true` si la empresa ya tiene al menos una conexión activa (`assets.status = active`) de esta integración |

Orden: `measurement` antes que `workflow`; dentro, `sort_order`.

```json
{
  "statusCode": 200,
  "message": "integration.catalog",
  "data": {
    "items": [
      {
        "code": "aws",
        "name": "Amazon Web Services",
        "logo_key": "aws",
        "purpose": "measurement",
        "availability": "available",
        "description": "Evalúa de forma continua la configuración de tu cuenta: identidades y accesos, cifrado, registros y red.",
        "connection": { "category": "ac_01", "platform": "aws" },
        "connected": true
      },
      {
        "code": "jira",
        "name": "Jira",
        "logo_key": "jira",
        "purpose": "workflow",
        "availability": "coming_soon",
        "description": "Convertirá cada hallazgo en un ticket asignado y seguirá su avance hasta cerrarlo.",
        "connection": null,
        "connected": false
      }
    ]
  }
}
```

---

### GET /v1/integrations — Las integraciones de la empresa

| | |
|---|---|
| **Quién** | `admin_empresa` · `auditor` (lectura; la respuesta es la misma) |
| **Éxito** | `200`, **sin paginar**: una empresa tiene pocas integraciones |
| **Errores** | `401` · `403` (`responsable`, `delegado`, `admin_monkey`) |

Una fila por integración con **al menos una conexión vigente** de la empresa (`assets.status = active`, sin activo padre:
la conexión, no lo que descubrió, D61). Todo se **deriva** de las conexiones; no se guarda nada nuevo. Una integración sin
conexiones no aparece aquí: está en el catálogo.

#### Response `200`

| Campo | Tipo | Qué es |
|---|---|---|
| `code`, `name`, `logo_key`, `purpose` | | Como en el catálogo |
| `status` | enum `integration_status` | Derivado, ver la regla abajo |
| `connection_count` | integer | Conexiones vigentes de esta integración |
| `resource_count` | integer | Recursos que esas conexiones reconocieron en su último descubrimiento (la misma regla de `GET /v1/assets/{id}/resources`: lo que no se vio en el último inventario no cuenta) |
| `last_validated_at` | datetime \| null | La validación más reciente entre sus conexiones (`asset_provisionings.last_validated_at`) |
| `connections` | array | Cada conexión: `asset_id`, `code` (`AST-0001`), `name`, `connection_status` (enum `provisioning_status`), `operational_status` (enum `operational_status`), `needs_attention` (boolean) y `services` (`[{ "id", "name" }]`, los servicios a los que pertenece) |

**Regla del estado** (de la más grave a la menos):

1. `needs_attention` si **alguna** conexión tiene la validación fallida (`connection_status = failed`) o `operational_status = error`.
2. `active` si alguna conexión está activa o programada (`connection_status` en `active`, `scheduled`).
3. `pending` en otro caso (conectada pero sin activar).

`needs_attention` es un **problema de conexión, no un incumplimiento** (D57): el texto al cliente no habla de controles
fallidos.

Orden: `needs_attention` primero, luego `active`, luego `pending`; dentro, por `name`.

```json
{
  "statusCode": 200,
  "message": "integration.list",
  "data": {
    "items": [
      {
        "code": "aws",
        "name": "Amazon Web Services",
        "logo_key": "aws",
        "purpose": "measurement",
        "status": "active",
        "connection_count": 1,
        "resource_count": 42,
        "last_validated_at": "2026-11-10T14:03:00Z",
        "connections": [
          {
            "asset_id": "9b2e…",
            "code": "AST-0001",
            "name": "Cuenta de producción",
            "connection_status": "scheduled",
            "operational_status": "warning",
            "needs_attention": false,
            "services": [{ "id": "51c0…", "name": "Plataforma de pagos" }]
          }
        ]
      }
    ]
  }
}
```

---

### GET /v1/integrations/{code} — El detalle de una integración

| | |
|---|---|
| **Quién** | `admin_empresa` (cualquier integración del catálogo) · `auditor` (solo las que la empresa tiene conectadas; las demás, `404`) |
| **Éxito** | `200` |
| **Errores** | `401` · `403` (`responsable`, `delegado`, `admin_monkey`) · `404 INTEGRATION_NOT_FOUND` (el código no existe o, para el auditor, la empresa no la tiene) |

Es la página de detalle (MD-211, `/integraciones/:code` en Frontend-Platform): se abre desde una tarjeta del catálogo o desde una fila de la lista. Con `?service=<uuid>` en la URL de la pantalla (no en la API) llega desde «Nueva conexión» de un servicio (`/services/:id/connections/new`, que reutiliza este mismo catálogo): «Conectar» no vuelve a preguntar el servicio y «Volver» regresa a ese servicio. Vale igual para una
integración disponible, conectada o `coming_soon`; lo que no aplica llega vacío y la pantalla lo explica.

#### Response `200`

Todos los campos del ítem del catálogo (`code`, `name`, `logo_key`, `purpose`, `availability`, `description`, `connection`,
`connected`) y además:

| Campo | Tipo | Qué es |
|---|---|---|
| `status` | enum `integration_status` \| null | El de `GET /v1/integrations` si la empresa la tiene; `null` si no |
| `connection_count`, `resource_count`, `last_validated_at` | | Como en la lista; `0`, `0` y `null` si no la tiene |
| `connections` | array | Como en la lista; vacío si no la tiene |
| `overview` | string | Qué hace, en dos o tres frases, en lenguaje de cumplimiento |
| `features` | string[] | Lo que el cliente puede hacer con ella |
| `prerequisites` | string[] | Lo que necesita antes de conectar. Vacío en `coming_soon` |
| `permissions` | array | Lo que Monkey pide en la plataforma: `name`, `detail`, `scope` (el identificador técnico del permiso tal como lo ve el cliente en su plataforma, o `null`) y `access` (`read` · `write`). Vacío en `coming_soon` |
| `resource_types` | enum `resource_kind`[] | Los tipos de recurso que descubre (sin `other`). Vacío si no descubre recursos |
| `coverage` | objeto \| null | Lo que alimenta en el cumplimiento, **derivado del catálogo** (ver abajo). `null` si todavía no tiene checks cargados o si la integración es `coming_soon` (MD-491) |
| `security` | array | Cómo protege Monkey la conexión: `topic` (enum `integration_security_topic`) y `text`. **Solo lo verificado** (un `SEG-n` en ✅ o una decisión construida); nada de lo planificado. Vacío en `coming_soon` |
| `capabilities` | string[] | Qué aporta, en pocas palabras (p. ej. «Evaluación continua de la configuración») |
| `works_with` | string[] | En qué partes de Monkey se usa (p. ej. «Cumplimiento») |

Los textos (`overview`, `features`, `prerequisites`, `permissions[].name/detail`, `security[].text`, `capabilities`,
`works_with`) llegan traducidos según `Accept-Language` y **ninguno nombra al motor que evalúa** (regla 1).

**`coverage`** (solo integraciones de medición con plataforma de conexión cuyos checks están en el catálogo; hoy, AWS):

| Campo | Tipo | Qué es |
|---|---|---|
| `tests` | array | Las pruebas automáticas que la integración alimenta: `code` (`T-CLD-001`) y `name`. Una prueba entra si tiene **al menos un check** de esta plataforma asignado, con cualquier procedencia (D56) |
| `controls_count` | integer | Controles del catálogo vinculados a esas pruebas (`control_tests`), sin repetir |
| `frameworks` | array | Por marco: `code`, `name` y `controls_count` (los de esos controles que cubren un requisito del marco) |

**Cómo se lee:** la integración **alimenta** esas pruebas; no las aprueba. Que un control cumpla lo decide el cálculo (§9) con
todas sus pruebas y evidencias, nunca esta cifra (regla 4).

**Contenido de AWS** (el resto, `coming_soon`, lleva solo `overview`, `features`, `capabilities` y `works_with` en tiempo futuro):

| Campo | es |
|---|---|
| `overview` | Monkey evalúa de forma continua la configuración de seguridad de tu cuenta de AWS mediante un rol de solo lectura. Descubre sus servidores, bases de datos, almacenamiento y funciones, te deja elegir cuáles pertenecen a cada servicio y convierte cada resultado en insumo de las pruebas automáticas de tus controles. |
| `features` | Descubrir los recursos de la cuenta en las regiones que declares · Elegir qué recursos pertenecen a cada servicio · Evaluar identidades y accesos privilegiados, cifrado y exposición de red, registros, alertas y respaldos · Repetir la evaluación cada 6 o 24 horas · Ver cada hallazgo con su código de control, su impacto y cómo corregirlo |
| `prerequisites` | Permiso en tu cuenta de AWS para crear un rol de IAM o desplegar una plantilla de CloudFormation · El número de tu cuenta de AWS y las regiones donde opera el servicio · Los riesgos del servicio ya evaluados |
| `permissions` | `SecurityAudit` (`arn:aws:iam::aws:policy/SecurityAudit`, `read`): leer la configuración de seguridad de los servicios de la cuenta · `ViewOnlyAccess` (`arn:aws:iam::aws:policy/job-function/ViewOnlyAccess`, `read`): listar y ver los recursos sin leer el contenido de tus datos · Asumir el rol (`sts:AssumeRole`, `read`): solo Monkey, con el identificador externo de tu empresa, y por sesiones de una hora como máximo |
| `resource_types` | `server`, `database`, `storage`, `function` |
| `security` (fuente: D58, SEG-48, SEG-01 y SEG-50; las referencias no salen al cliente) | `read_only`: el rol no puede crear, cambiar ni borrar nada en tu cuenta · `temporary_credentials`: cada evaluación usa credenciales temporales de una hora; con el rol recomendado Monkey no guarda llaves de tu cuenta · `external_id`: solo Monkey, con el identificador que genera para tu empresa, puede asumir el rol · `isolated_execution`: cada evaluación corre en un entorno aislado que se elimina al terminar · `tenant_isolation`: los resultados de tu cuenta solo los ve tu empresa · `encrypted_keys`: si eliges el canal de llaves de acceso, se guardan cifradas y nunca se muestran |
| `capabilities` | Evaluación continua de la configuración · Inventario de recursos |
| `works_with` | Cumplimiento · Conexiones de tus servicios |

## Claves i18n

`integration.catalog`, `integration.list`, `integration.detail`, `integration.description.<code>` (una por fila del catálogo,
es y en) y el contenido del detalle por código (`integration.content.<code>.*`). Error: `INTEGRATION_NOT_FOUND`.

## Las filas del catálogo (semilla de MD-211)

| `code` | Propósito | Plataforma de conexión | Disponibilidad | Descripción (es) |
|---|---|---|---|---|
| `aws` | `measurement` | `ac_01` / `aws` | de la plataforma (`available`) | Evalúa de forma continua la configuración de tu cuenta: identidades y accesos, cifrado, registros y red. |
| `azure` | `measurement` | `ac_01` / `azure` | de la plataforma (`coming_soon`) | Evaluará de forma continua la configuración de tu suscripción: identidades y accesos, cifrado, registros y red. |
| `gcp` | `measurement` | `ac_01` / `gcp` | de la plataforma (`coming_soon`) | Evaluará de forma continua la configuración de tu proyecto: identidades y accesos, cifrado, registros y red. |
| `microsoft_365` | `measurement` | `ac_01` / `microsoft_365` | de la plataforma (`coming_soon`) | Evaluará la configuración de tu organización: inicio de sesión con segundo factor, acceso condicional, correo y colaboración. |
| `google_workspace` | `measurement` | `ac_01` / `google_workspace` | de la plataforma (`coming_soon`) | Evaluará la configuración de tu dominio: inicio de sesión, segundo factor y uso compartido. |
| `github` | `measurement` | — | `coming_soon` | Mostrará cómo se revisan y aprueban los cambios en tu código, y las vulnerabilidades de sus dependencias. |
| `jira` | `workflow` | — | `coming_soon` | Convertirá cada hallazgo en un ticket asignado y seguirá su avance hasta cerrarlo. |

GitHub no tiene plataforma de conexión porque su categoría de activo y su mapeo a controles los decide el comité (P45; los checks que cuentan, D129,
P45); el alcance de Jira, también (P46).

## Estado de implementación

| Endpoint | Estado |
|---|---|
| `GET /v1/integrations/catalog` | ✅ MD-211 (`Backend/src/features/integrations`; e2e `test/integraciones/`) |
| `GET /v1/integrations/{code}` | ✅ MD-211. Un check pertenece a la plataforma por `catalog.checks.platform` (= código de la plataforma de conexión). `coverage.tests[].name` es el nombre neutro de la prueba en el idioma pedido (`display_name_en` en `en`, `display_name` en `es`, D70; si falta, el `code`). Sin checks cargados de esa plataforma, `coverage` es `null` |
| `GET /v1/integrations` | ✅ MD-211. `connections` va ordenado por `code`. La regla de «conexión vigente» y la de recursos reconocidos viven una sola vez en `src/infrastructure/database/asset-visibility.ts`, compartida con `GET /v1/assets` y `GET /v1/assets/{id}/resources` |
