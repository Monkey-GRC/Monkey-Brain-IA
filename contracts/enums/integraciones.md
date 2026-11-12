# Enums — Integraciones

> Índice de todos los enums: [`enums.md`](../enums.md). Por el cable viaja el **valor**; la etiqueta (es/en) la resuelve i18n. Formato: [`README.md`](../README.md#formato-de-un-enum). Contrato: [`integraciones.md`](../integraciones.md).

## `integration_purpose`
**Columna:** `catalog.integrations.purpose` · **Quién lo fija:** Monkey, en el catálogo (D110)

| Valor | Etiqueta (es) | Etiqueta (en) | Qué significa |
|---|---|---|---|
| `measurement` | Medición y cumplimiento | Measurement and compliance | Evalúa la configuración de la plataforma y alimenta las pruebas |
| `workflow` | Gestión y flujo de trabajo | Management and workflow | No mide: ayuda a gestionar el trabajo de cumplimiento (tickets, avisos) |

## `integration_status`
**No es columna:** se **deriva** de las conexiones en `GET /v1/integrations` (D110). La regla está en el contrato.

| Valor | Etiqueta (es) | Etiqueta (en) | Qué significa |
|---|---|---|---|
| `active` | Activa | Active | Al menos una conexión está activa o programada |
| `pending` | Pendiente de activar | Pending activation | Conectada, pero ninguna conexión está activa todavía |
| `needs_attention` | Necesita atención | Needs attention | Alguna conexión falló al validarse o está en error. Es un **problema de conexión, no un incumplimiento** (D57) |

## `integration_security_topic`
**No es columna:** lo devuelve `GET /v1/integrations/{code}` en `security[].topic`; la pantalla elige el icono y el título por valor.

| Valor | Etiqueta (es) | Etiqueta (en) |
|---|---|---|
| `read_only` | Solo lectura | Read-only |
| `temporary_credentials` | Credenciales temporales | Temporary credentials |
| `external_id` | Identificador externo | External ID |
| `isolated_execution` | Ejecución aislada | Isolated execution |
| `tenant_isolation` | Aislamiento entre empresas | Tenant isolation |
| `encrypted_keys` | Llaves cifradas | Encrypted keys |

## `integration_permission_access`
**No es columna:** `permissions[].access` en el detalle.

| Valor | Etiqueta (es) | Etiqueta (en) |
|---|---|---|
| `read` | Lectura | Read |
| `write` | Escritura | Write |

> La disponibilidad (`available` · `coming_soon`) reutiliza `framework_availability` (D50, D67).
