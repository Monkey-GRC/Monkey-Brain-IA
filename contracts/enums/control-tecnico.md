# Enums — Control técnico

Los valores de los enums de este módulo. Índice de todos: [`enums.md`](../enums.md). Por el cable viaja el **valor**; la etiqueta la resuelve i18n.

### `readiness` — nivel de preparación (`control-tecnico.md`)
`ready` Preparado (100%) · `almost_ready` Casi listo (de 80% a menos de 100%) · `needs_work` Requiere trabajo (menos de 80%) · `not_measured` Sin medir. **Cualitativo primero**
(`philosophy.md`); `not_measured` es un hueco de cobertura, no un fallo.

### `readiness_area` — agrupación en lenguaje de negocio de las pruebas de nube *(propuesta de desarrollo)*
`identity_access` Acceso e identidades · `data_network` Protección de datos y red · `logging_backup` Registros y respaldos.

### `schedule_frequency` — `asset_provisionings.schedule_frequency` (D46)
`continuous` Continua · `every_6h` Cada 6 horas · `every_24h` Cada 24 horas. Nulo hasta el paso
«programar». `ac_01` admite `every_6h` y `every_24h`; `ac_02` a `ac_06`, solo `continuous`.

### `execution_status` — `executions.status`
`queued` En cola · `running` En curso · `completed` Completada · `failed` Falló · `cancelled`
Cancelada

### `severity` — `findings.severity` y `vulnerabilities.severity`
`low` Baja · `medium` Media · `high` Alta · `critical` Crítica
