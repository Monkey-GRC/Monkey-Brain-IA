# Enums — Catálogo maestro

> Índice de todos los enums: [`enums.md`](../enums.md). Por el cable viaja el **valor**; la etiqueta (es/en) la resuelve i18n. Formato: [`README.md`](../README.md#formato-de-un-enum).

**Catálogo v2 (VF18, D129).** Las opciones salen de la tabla 8 de la hoja `01_DESARROLLO` y de las listas de validación
del libro; los **valores** en inglés son propuesta de desarrollo (D26) y están fijados en la carga (RC-01, MD-491). Las
listas marcadas **«nueva»** son las que trajo la VF18; ya existen en el Backend (`prisma/schema/catalog/`).

## `dimension`
**Columna:** `control_dimensions.dimension`, `tests.dimension` · **Qué es:** las 9 dimensiones en que se prueba un control (§2). Cuatro son nuevas (RC-05).

| Valor | Etiqueta (es) | Qué significa |
|---|---|---|
| `policy` | Documental | Se resuelve con un documento |
| `app` | Aplicación | La aplicación del cliente |
| `server` | Servidores | Servidores, físicos o en nube |
| `database` | BD | Bases de datos |
| `cloud` | Nube | Servicios gestionados en nube |
| `network` | Red | Nueva. Dispositivos y configuración de red |
| `endpoint` | Endpoint | Nueva. Equipos de usuario |
| `physical` | Físico y ambiental | Nueva. Instalaciones e inspecciones |
| `process` | Proceso | Nueva. Poblaciones, muestras, revisiones y actas |

## `control_type` (nueva)
**Columna:** `controls.type` · **Qué es:** cómo opera el control. **No cambia el cálculo** (comentario de la columna W de `Controles Monkey`).

| Valor | Etiqueta (es) | Qué significa |
|---|---|---|
| `manual` | Manual | Lo ejecuta una persona sin depender de información de un sistema |
| `it_dependent_manual` | Manual dependiente de TI | Lo ejecuta una persona con información que produce un sistema (reporte, alerta o escaneo) |
| `automated` | Automático | Lo ejecuta el sistema sin intervención (restricción, validación o configuración) |

## `periodicity` (nueva)
**Columnas:** `controls.periodicity`, `control_requirements.periodicity`, la periodicidad configurada del cliente y la de revisión de un documento · **Qué es:** cada cuánto se ejecuta y se evidencia (ventanas de §9, D131). La sugiere Monkey; el `admin_empresa` la cambia con justificación (G-10).

| Valor | Etiqueta (es) |
|---|---|
| `permanent` | Permanente |
| `daily` | Diario |
| `weekly` | Semanal |
| `monthly` | Mensual |
| `bimonthly` | Bimensual |
| `quarterly` | Trimestral |
| `semiannual` | Semestral |
| `annual` | Anual |
| `on_demand` | Cuando sea requerido |

## `requirement_type` (nueva) · `test_type` (nueva)
**Columnas:** `control_requirements.type`, `tests.type` · Las mismas cuatro opciones.

| Valor | Etiqueta (es) |
|---|---|
| `documentary` | Documental |
| `population` | Población |
| `operational` | Operativo |
| `technical` | Técnico |

## `test_primary_source` (nueva)
**Columna:** `tests.primary_source` · **El cliente nunca ve el proveedor**: las etiquetas son las de la tabla 9 de `01_DESARROLLO` (D128).

| Valor | Etiqueta (es) |
|---|---|
| `document` | Documento |
| `manual` | Manual |
| `probe` | Sonda |
| `cloud_engine` | Motor de nube |
| `probe_and_cloud_engine` | Sonda y motor de nube |
| `integration` | Integración |

## `test_level` (nueva) · `test_automation` (nueva)
**Columnas:** `tests.level`, `tests.automation`.

| `test_level` | Etiqueta (es) |
|---|---|
| `design` | Diseño |
| `implementation` | Implementación |
| `effectiveness` | Eficacia |
| `implementation_and_effectiveness` | Implementación y eficacia |

| `test_automation` | Etiqueta (es) |
|---|---|
| `manual` | Manual |
| `semi_automated` | Semiautomático |
| `automated` | Automático |

## `check_role` (nueva)
**Columna:** `test_checks.role` · **Qué es:** qué hace el check en su prueba (D129, §9).

| Valor | Etiqueta (es) | Qué significa |
|---|---|---|
| `direct` | Directo | Decide el cumplimiento de la prueba |
| `complementary` | Complementario | Si falla, observación; si pasa, evidencia de apoyo |
| `dependency` | Dependencia | Toma la conclusión del control dueño, sin reejecutarse |

**Interno (nunca al cliente):** la columna «Herramienta» de `TEST_CHECKS` no es un enum de la API: se deduce de la plataforma del check (D128).

## `cause_origin` (nueva) · `cause_type` (nueva)
**Columnas:** `causes.cause_origin`, `causes.cause_type` · Reemplazan a `failure_category` (D129).

| `cause_origin` | Etiqueta (es) |
|---|---|
| `internal` | Interno |
| `external` | Externo |

| `cause_type` | Etiqueta (es) |
|---|---|
| `human` | Humano (personas) |
| `processes` | Procesos y métodos |
| `information` | Información y datos |
| `measurement` | Medición y monitoreo |
| `technology` | Tecnológico (sistemas) |
| `physical_infrastructure` | Infraestructura física y activos |
| `criminal_security` | Delictivo y de seguridad |
| `third_parties` | Terceros y cadena de suministro |
| `legal_regulatory` | Legal y regulatorio |
| `environmental` | Ambiental / natural |
| `organizational_governance` | Organizacional y gobierno |
| `internal_financial` | Financiero interno |
| `strategic` | Estratégico |
| `external_technology` | Tecnológico externo |
| `climate` | Climático (físico y de transición) |
| `biological` | Biológico / salud pública |
| `political` | Político y geopolítico |
| `economic` | Económico y de mercado |

## `document_type` (nueva) · `document_origin` (nueva) · `document_acceptance` (nueva)
**Columnas:** `documents.type`, `documents.origin`, `documents.suggested_acceptance` (§11, D133).

| `document_type` | Etiqueta (es) |
|---|---|
| `policy` | Política |
| `procedure` | Procedimiento |
| `matrix` | Matriz |
| `manual` | Manual |
| `document` | Documento |

| `document_origin` | Etiqueta (es) |
|---|---|
| `internal` | Interno |
| `external` | Externo |

| `document_acceptance` | Etiqueta (es) |
|---|---|
| `users_who_apply` | Usuarios que lo aplican |
| `all_users` | Todos los usuarios |
| `not_required` | No requiere |

## `framework_type`
**Columna:** `frameworks.type` · **En el MVP** solo se usa `attestation`.

| Valor | Etiqueta (es) | Ejemplos |
|---|---|---|
| `attestation` | Informe de auditor | SOC 1, SOC 2 |
| `certification` | Certificación | ISO 27001 |
| `standard` | Estándar | PCI DSS, NIST CSF, CIS |
| `regulation` | Regulación | HIPAA y afines |

## `mapping_confidence`
**Columna:** `checks.mapping_confidence` · **Fuente:** valores tomados de `monkey-cis-sync`. Con la v2 los vínculos prueba–check vienen ratificados por el comité (`committee_ratified`) y la confianza ya no se calcula (D129); se conserva para los mapeos check → requisito de marco.

| Valor | Etiqueta (es) | Qué significa |
|---|---|---|
| `confirmed` | Confirmado | |
| `high` | Alta | |
| `medium` | Media | |
| `low` | Baja | Queda para revisión |

## Se retiran con la v2

- `policy_approval_status` (`policies.approval_status`): `policies` se reemplaza por los documentos (D129, D133); el estado de un documento es `document_version_status` ([`enums/cumplimiento.md`](cumplimiento.md)).
- `failure_category` (`causes.failure_category`): la reemplazan `cause_origin` y `cause_type`.
