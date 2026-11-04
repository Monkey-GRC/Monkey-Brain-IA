# Enums — Control técnico

> Índice de todos los enums: [`enums.md`](../enums.md). Por el cable viaja el **valor**; la etiqueta (es/en) la resuelve i18n. Formato: [`README.md`](../README.md#formato-de-un-enum).

## `readiness`
**Dónde se usa:** nivel de preparación (`contracts/control-tecnico.md`). **Cualitativo primero** (`philosophy.md`): `not_measured` es un hueco de cobertura, no un fallo.

| Valor | Etiqueta (es) | Qué significa |
|---|---|---|
| `ready` | Preparado | 100 % |
| `almost_ready` | Casi listo | De 80 % a menos de 100 % |
| `needs_work` | Requiere trabajo | Menos de 80 % |
| `not_measured` | Sin medir | Aún no hay medición |

## `readiness_area`
**Dónde se usa:** agrupación en lenguaje de negocio de las pruebas de nube. *Propuesta de desarrollo.*

| Valor | Etiqueta (es) |
|---|---|
| `identity_access` | Acceso e identidades |
| `data_network` | Protección de datos y red |
| `logging_backup` | Registros y respaldos |

## `schedule_frequency`
**Columna:** `asset_provisionings.schedule_frequency` (D46) · **Nulo** hasta el paso «programar».

| Valor | Etiqueta (es) | Aplica a |
|---|---|---|
| `continuous` | Continua | `ac_02` a `ac_06` (solo esta) |
| `every_6h` | Cada 6 horas | `ac_01` |
| `every_24h` | Cada 24 horas | `ac_01` |

## `execution_status`
**Columna:** `executions.status`

| Valor | Etiqueta (es) |
|---|---|
| `queued` | En cola |
| `running` | En curso |
| `completed` | Completada |
| `failed` | Falló |
| `cancelled` | Cancelada |

## `severity`
**Columnas:** `findings.severity` y `vulnerabilities.severity`

| Valor | Etiqueta (es) |
|---|---|
| `low` | Baja |
| `medium` | Media |
| `high` | Alta |
| `critical` | Crítica |
