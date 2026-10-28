---
id: contracts-enums
name: Enums de la API
description: Tabla única valor snake_case a etiqueta es/en para todos los enums del onboarding. Las opciones salen literalmente del Excel del comité.
type: contract
---

# Enums

Por el cable viaja el **valor**; la etiqueta la resuelve i18n. Las listas de opciones son las
literales del Excel del comité (hojas `Contexto Empresa`, `Contexto del servicio ` y
`Activos  del Servicio (SCOPE)`), que es la fuente de verdad.

**Donde el Excel tiene más valores que `modelo-datos.md`, gana el Excel** y el modelo se corrige.
Está marcado en cada caso.

## Componente 1 — `organizations`

### `size` — `organizations.size`
⚠️ Un valor de enum no puede empezar por dígito, por eso el prefijo `from_`.

| Valor | es | en |
|---|---|---|
| `from_10_to_50` | 10-50 | 10-50 |
| `from_51_to_200` | 51-200 | 51-200 |
| `from_201_to_500` | 201-500 | 201-500 |
| `from_501_to_1000` | 501-1000 | 501-1000 |
| `from_1001_to_2000` | 1001-2000 | 1001-2000 |
| `from_2001_to_5000` | 2001-5000 | 2001-5000 |
| `more_than_5000` | Más de 5000 | More than 5000 |

### `industry` — `organizations.industry` · 14 valores

| Valor | es |
|---|---|
| `financial_banking` | Financiero/Banca |
| `fintech` | Fintech |
| `healthcare` | Salud |
| `technology_saas` | Tecnología/SaaS |
| `bpo_outsourcing` | BPO/Tercerización |
| `telecommunications` | Telecomunicaciones |
| `retail_ecommerce` | Retail/E-commerce |
| `manufacturing` | Manufactura |
| `government` | Gobierno |
| `education` | Educación |
| `insurance` | Seguros |
| `logistics` | Logística |
| `energy_utilities` | Energía/Utilities |
| `other` | Otro |

### `business_model` — `organizations.business_model` · 19 valores

**La lista es esta: 19 más `other`** (D73). El texto «40+ opciones» del Excel no tiene respaldo en su hoja; si el comité entrega más, se agregan con una migración y aquí.

`bpo_kpo_ito` (BPO/KPO/ITO) · `call_contact_center` (Call/Contact Center) · `data_center`
(Data Center) · `ai_ml` (IA/ML) · `service_desk` (Mesa de servicio) · `saas_paas_iaas`
(SaaS/PaaS/IaaS) · `fintech_payments` (Fintech/Pagos) · `banking` (Banca) · `insurance`
(Seguros) · `marketplace_ecommerce` (Marketplace/E-commerce) · `software_factory` (Fábrica de
software) · `consulting` (Consultoría) · `telecommunications` (Telecomunicaciones) · `logistics`
(Logística) · `healthcare` (Salud) · `edtech` (EdTech) · `manufacturing` (Manufactura) ·
`government` (Gobierno) · `other` (Otro)

### `years_in_operation` — `organizations.years_in_operation` · opcional

| Valor | es |
|---|---|
| `less_than_1` | Menos de 1 |
| `from_1_to_3` | 1-3 |
| `from_3_to_5` | 3-5 |
| `from_5_to_10` | 5-10 |
| `more_than_10` | Más de 10 |

### `country` — usado por `incorporation_countries` y `client_countries`

Constitución (12): `co` Colombia · `mx` México · `pe` Perú · `cl` Chile · `ar` Argentina ·
`br` Brasil · `ec` Ecuador · `pa` Panamá · `cr` Costa Rica · `us` USA · `es` España · `other` Otro

Clientes (13): los anteriores más `eu` (UE).

⚠️ `eu` no es un país: es una región y el Excel la mezcla en la misma lista. Se conserva porque
la fuente manda, pero el frontend la agrupa aparte.

### `compliance_maturity` — `organizations.compliance_maturity`

| Valor | es |
|---|---|
| `none` | Ninguna |
| `initial_ad_hoc` | Inicial/Ad-hoc |
| `implementing` | En implementación |
| `defined` | Definida |
| `managed_certified` | Gestionada/Certificada |

### `regulation` — catálogo `regulations` (tabla propia, no enum de columna) · 18 valores

Solo **normas de protección de datos personales** (D51; el comité pidió depurar la lista el 2026-10-05).

`ley_1581_co` Ley 1581 (CO) · `lfpdppp_mx` LFPDPPP (MX) · `ley_29733_pe` Ley 29733 (PE) ·
`ley_19628_cl` Ley 19628 (CL) · `ley_21719_cl` Ley 21719 (CL) · `ley_25326_ar` Ley 25326 (AR) ·
`ley_18331_uy` Ley 18331 (UY) · `lopdp_ec` LOPDP (EC) · `ley_81_pa` Ley 81 (PA) · `ley_8968_cr` Ley 8968 (CR) ·
`lgpd_br` LGPD (BR) · `gdpr_eu` GDPR (UE) · `lopdgdd_es` LOPDGDD (ES) · `hipaa_us` HIPAA (US) ·
`ccpa_cpra_us` CCPA/CPRA (US) · `glba_us` GLBA (US) · `none` Ninguna · `other` Otra

**Qué cambió respecto a los 14 anteriores:** salió `pci_dss` (es un estándar de la industria de tarjetas, no una norma de
protección de datos, y ya es un marco); entraron la Ley 21.719 de Chile (publicada el 13-dic-2024, **vigente desde el
1-dic-2026**, reemplaza a la 19.628, que se conserva hasta entonces) y las leyes de Uruguay, Ecuador, Panamá y Costa Rica.
`hipaa_us` y `glba_us` se quedan: son leyes sectoriales de EE. UU. que protegen datos de salud y financieros. **Falta que el
comité ratifique la lista** (DT-40); sirven de fuente las leyes citadas, no el Excel, que traía las 14 originales.

`regulations` no se puntúa (decisión D10): determina qué aplica, no entra al cálculo.

`none` y `other` son filas del catálogo como las demás (jurisdicción `n/a`); `none` es excluyente
(D44). Las etiquetas en inglés de todas las listas de esta página las tradujo desarrollo y están
pendientes de revisión del comité: el Excel solo las trae en español (salvo `size`). Se sirven desde
`GET /v1/catalogs/{name}` (`size`, `industry`, `business_model`, `years_in_operation`,
`incorporation_country`, `client_country`, `compliance_maturity`, `regulations`).

> **No existe el campo "framework que desea gestionar" a nivel de empresa.** El Excel lo trae
> (`framework_a_gestionar`) pero el comité lo **vetó**: el cliente no elige el marco en el Componente 1. Lo contrata
> Monkey Admin al registrar la empresa (D47) y el servicio elige entre lo contratado.

## Componente 2 — `services`

### `service_type` — `services.type` · 11 valores

⚠️ `modelo-datos.md` declara 5 (`saas|bpo|call_center|data_center|ai`). **El Excel tiene 11 y
gana**; el modelo se corrige.

| Valor | es |
|---|---|
| `saas` | SaaS |
| `bpo` | BPO |
| `call_center` | Call center |
| `data_center` | Data center |
| `ai_services` | Servicios de IA |
| `specialized_with_data_intervention` | Servicios especializados con intervención en la información |
| `service_desk` | Mesa de servicios |
| `managed_services` | Managed services |
| `consulting` | Consultoría |
| `development` | Desarrollo |
| `other` | Otro |

### `served_industry` — `services.industries_served` · 11 valores

`financial` Financiero · `healthcare` Salud · `retail` Retail · `technology` Tecnología ·
`government` Gobierno · `education` Educación · `manufacturing` Manufactura ·
`telecommunications` Telecomunicaciones · `energy` Energía · `logistics` Logística · `other` Otro

⚠️ Es una lista **distinta** de `industry` del Componente 1 (11 vs 14 valores). No se reutiliza:
una es el sector de la empresa, la otra el de sus clientes.

### `active_client_count` — `services.active_client_count` · opcional

| Valor | es |
|---|---|
| `from_1_to_10` | 1-10 |
| `from_11_to_50` | 11-50 |
| `from_51_to_200` | 51-200 |
| `from_201_to_1000` | 201-1000 |
| `more_than_1000` | Más de 1000 |

### `service_country` — `services.countries` · 24 valores

⚠️ Lista **distinta** de la del Componente 1: añade países y tres agrupaciones.

`co` `mx` `pe` `cl` `ar` `br` `ec` `uy` Uruguay · `py` Paraguay · `bo` Bolivia · `ve` Venezuela ·
`cr` `pa` `gt` Guatemala · `us` `ca` Canadá · `es` `pt` Portugal · `gb` Reino Unido · `de`
Alemania · `fr` Francia · `eu` UE · `latam` LATAM · `global` Global

### `data_type` — `services.data_types` · 8 valores

⚠️ `modelo-datos.md` comenta solo 3 (`pii|payment|phi`). **El Excel tiene 8 y gana.**

| Valor | es |
|---|---|
| `pii` | PII |
| `payment` | Datos de pago |
| `phi` | Datos médicos (PHI) |
| `business` | Datos de negocio |
| `files` | Archivos |
| `logs` | Logs |
| `credentials` | Credenciales |
| `biometric` | Biométricos |

### `trust_criterion` — catálogo `trust_criteria` · 5 valores

| Valor | es | Obligatorio |
|---|---|---|
| `security` | Seguridad (Criterios Comunes) | **sí, siempre** |
| `availability` | Disponibilidad | no |
| `confidentiality` | Confidencialidad | no |
| `integrity` | Integridad de procesamiento | no |
| `privacy` | Privacidad | no |

El Excel ofrece además *"Cobertura completa sugerida por Monkey"*: **no es un valor de enum**, es
un atajo de UI que marca los cinco. El request siempre lleva los valores explícitos, y `security`
va incluido siempre.

### `subservice_type` — `subservice_organizations.type` · 7 valores

⚠️ `modelo-datos.md` declara 5. **El Excel tiene 7 y gana.**

`aws` AWS · `azure` Azure · `gcp` GCP · `on_premise` On-premise · `hybrid` Híbrida ·
`mobile` Mobile · `other` Otro

### `framework` — catálogo `frameworks` · 7 ofrecidos, 1 disponible (D37, D50)

`soc2` SOC 2 · `iso27001` ISO 27001 · `hipaa` HIPAA · `gdpr` GDPR · `pci_dss` PCI DSS · `nist_csf` NIST CSF · `soc1` SOC 1

**Solo SOC 2 está construido (D37).** Los otros seis se **ofrecen** como gancho comercial (D50): se siembran en
`catalog.frameworks` con `availability = coming_soon` y sin requisitos (`npm run reference:load`), y `GET /v1/catalogs/frameworks`
trae todos con su `availability` (`available` | `coming_soon`) en el orden de arriba, que es el de demanda (Drata: ISO 27001
es la expansión más común sobre SOC 2, 32 %; HIPAA 20 %; GDPR 19 %; ACC 2025). Monkey Admin solo deja contratar los
`available` (`409 FRAMEWORK_NOT_AVAILABLE`) y el cliente solo elige los contratados. `CIS Controls` sigue vetado. La lista
nunca es fija en el frontend: sale de la tabla.

### `previous_certification` — `services.previous_certification` · opcional

`soc2` SOC 2 · `soc1` SOC 1 · `iso27001` ISO 27001 · `pci_dss` PCI DSS · `hipaa` HIPAA · `nist_csf` NIST CSF · `gdpr` GDPR ·
`none` Ninguna

La pantalla pregunta por una «certificación o evaluación» previa: HIPAA, NIST CSF y GDPR no se certifican como tal, pero sí
se evalúan (D51).

⚠️ `modulos/onboarding.md` decía que este campo "no persiste en una entidad propia", pero
`modelo-datos.md` §6.2 sí lo declara como columna. Persiste.

### `expected_availability` — `services.expected_availability`

`24x7` 24/7 · `business_hours` Horario de negocio · `on_demand` Por demanda · `not_applicable` N/A

El Excel añade *"(o escriba otra opción manual)"*: no se implementa como texto libre; si hace
falta, se añade un valor al enum.

## Componente 3 — scope y activos

### `deployment_scenario` — `services.deployment_scenario` · 4 valores · **ya no se pregunta (D92)**

⚠️ **Retirado de la API y de la pantalla por D92 (2026-10-25):** el cliente elige la plataforma del catálogo y se le ofrecen las seis conexiones; `GET /v1/catalogs/deployment_scenario` ya no existe. El enum y la columna siguen en la base sin uso hasta `DT-81`. **Se aparta del bloque 2A del Excel del comité**, que define estos escenarios: queda por ratificar con el comité (ver D92). Valores, por si se reabre:

| Valor | es | Conexiones que aplican |
|---|---|---|
| `cloud_managed_only` | Solo nube (gestionada) | `ac_01` |
| `cloud_with_servers` | Nube con servidores / VPS | `ac_01`, `ac_02`, `ac_03` |
| `on_premise` | On-premise | `ac_04`, `ac_05`, `ac_06` |
| `hybrid` | Híbrido | las seis (el cliente usa las que le sirvan, D46) |

### `connection_category` — `assets.connection_category` y `automated_capabilities.catalog_code`

| Valor | es | Plataformas (catálogo en la base, más abajo) |
|---|---|---|
| `ac_01` | Servicios en nube (gestionados, sin servidor) | AWS, Azure, GCP, Microsoft 365, Google Workspace |
| `ac_02` | Servidores en nube / VPS | Linux, Windows, HP-UX, AIX, Solaris |
| `ac_03` | Bases de datos en nube | PostgreSQL, MySQL, SQL Server, Oracle, MongoDB |
| `ac_04` | Servidores on-premise | Linux, Windows, HP-UX, AIX, Solaris |
| `ac_05` | Bases de datos on-premise | PostgreSQL, MySQL/MariaDB, SQL Server, Oracle, MongoDB |
| `ac_06` | Endpoints / estaciones de trabajo | Windows, macOS, Linux |

`ac_01` corre cada 6-24 h; `ac_02` a `ac_06` son continuos (también datos: `capability_frequencies`, D67).

### `operational_status` — `assets.operational_status`

`operational` Operativo · `warning` Con advertencias · `error` Con error ·
`not_monitored` Sin monitoreo

### `dimension` — las 5 dimensiones · `control_dimensions.dimension`

`policy` Política / Documental · `server` Servidor · `database` Base de datos · `app`
Aplicación · `cloud` Nube


## Plataforma

### `isolation_strategy` — `companies.isolation_strategy`
`shared` Compartida (RLS) · `dedicated` Dedicada

Lo marca `admin_monkey` al registrar la empresa. No se revierte sin migrar datos.

### `company_status` — `companies.status`
`active` Activa · `suspended` Suspendida · `deactivated` Archivada *(D95: sin acceso hasta el borrado definitivo; solo `admin_monkey`)*

### `company_deactivation_reason` — motivo al archivar una empresa (D95)
`non_payment` Falta de pago · `client_request` El cliente ya no desea el servicio · `other` Otro

### `access_key_status` — `access_keys.status`
`pending` Pendiente · `used` Usada · `expired` Expirada · `revoked` Revocada

### `user_role` — `users.role`
`admin_monkey` · `admin_empresa` · `funcional` · `consultor` · `auditor`

⚠️ El schema actual del Backend usa `MONKEY_ADMIN`, `CLIENT_ADMIN`, `USER`, `VIEWER`. El modelo
nuevo manda estos cuatro en minúscula; la API expone los del modelo.

### `audit_observation_type` — `audit_observations.type`
`observation` Observación · `recommendation` Recomendación · `information_request` Solicitud de información

### `audit_observation_status` — `audit_observations.status`
`open` Abierta · `answered` Respondida · `closed` Cerrada. `admin_empresa` o el `funcional` dueño del control la pasan a `answered`; solo quien la escribió (`auditor` o `consultor`) la cierra o la devuelve a `open`.
*(Contrato: `modules/compliance-audit.md`.)*

### `control_change_type` — `client_control_changes.change_type`
`create` Crear un control propio · `retire` Dar de baja · `edit_dimensions` Editar dimensiones · `edit_interpretation` Editar interpretación

### `control_change_status` — `client_control_changes.status`
`pending` Pendiente · `approved` Aprobado · `rejected` Rechazado. Solo el `consultor` decide.
*(Contrato: `modules/compliance-controls.md`.)*

### `consultant_assignment_status` — `consultant_assignments.status`
`active` Activa · `suspended` Suspendida por la empresa · `revoked` Retirada por Monkey. *(La tabla está construida (MD-157); sus endpoints no tienen contrato todavía: MD-159 y MD-161.)*

### `user_status` — `users.status`
`active` Activo · `inactive` Inactivo · `suspended` Suspendido

## Catálogo, cumplimiento y control técnico

Estos enums **no salen del Excel** (no trae opciones para ellos): son decisión de desarrollo del
2026-09-29, D34 en `modelo-datos-decisiones.md`. Donde había una fuente (los contratos, el conector
de CIS) se respetó. Si el comité entrega otros valores, gana el comité.

### `framework_type` — `frameworks.type` (en el MVP solo se usa `attestation`)
`attestation` Informe de auditor (SOC 1, SOC 2) · `certification` Certificación (ISO 27001) ·
`standard` Estándar (PCI DSS, NIST CSF, CIS) · `regulation` Regulación (HIPAA y afines)

### `policy_approval_status` — `policies.approval_status`
`draft` Borrador · `pending_approval` Pendiente de aprobación · `approved` Aprobada

### `mapping_confidence` — `checks.mapping_confidence`
`confirmed` Confirmado · `high` Alta · `medium` Media · `low` Baja (queda para revisión).
Valores tomados de `monkey-cis-sync`.

### `risk_criterion` — `risks.trust_criterion` y `client_risks.trust_criterion` · 11 valores
Sí del Excel (hoja *Riesgos*). **No son los 5 TSC.**

`confidentiality` Confidencialidad · `integrity` Integridad · `availability` Disponibilidad ·
`privacy` Privacidad · `compliance` Cumplimiento · `security` Seguridad · `continuity`
Continuidad · `third_parties` Terceros · `fraud` Fraude · `reputation` Reputación ·
`operations` Operación

### `risk_level` — `client_risks.inherent_risk_level` y `residual_risks.residual_level`
Sí del Excel (matriz 5×5): `low` Bajo (1-4) · `moderate` Moderado (5-9) · `high` Alto (10-16) ·
`critical` Crítico (17-25)

### `failure_category` — `causes.failure_category` · 6 valores
Sí del Excel (hoja *Causas*): `human_resource` Recurso humano · `processes` Procesos ·
`information_technology` Tecnología de información · `infrastructure` Infraestructura ·
`external` Externos · `governance` Gobierno

### `service_framework_status` — `service_frameworks.status`
`active` Activo · `paused` En pausa · `finished` Finalizado

### `asset_type` — `assets.type`
`server` Servidor · `database` Base de datos · `cloud_service` Servicio en nube · `application`
Aplicación · `endpoint` Endpoint · `network_device` Dispositivo de red · `documentation`
Documentación

`endpoint` y `network_device` se monitorean pero no son dimensiones (D5).

El tipo **se deduce de la conexión** al registrar el activo (D46): `ac_01` → `cloud_service` · `ac_02` y
`ac_04` → `server` · `ac_03` y `ac_05` → `database` · `ac_06` → `endpoint`. `network_device` y
`documentation` todavía no tienen conexión que los produzca (DT-8).

### `asset_criticality` — `assets.criticality`
`low` Baja · `medium` Media · `high` Alta · `critical` Crítica

### `asset_origin` — `assets.origin`
`declared` Declarado por el cliente · `discovered` Descubierto al conectar

### `asset_status` — `assets.status`
`active` Activo · `inactive` Inactivo

### `provisioning_status` — `asset_provisionings.connection_status`
`pending` Pendiente · `validated` Validada · `active` Activa · `scheduled` Programada ·
`failed` Falló la validación

Flujo: conectar → validar → activar → programar. Una conexión que falla no es un incumplimiento.

### `connection_method` — `asset_provisionings.connection_method` (D53)
`readonly_role` Rol de solo lectura (recomendado en nube) · `access_keys` Usuario con llaves (menos seguro) · `agent` Agente instalado.
Qué canales existen por categoría: `modules/onboarding-technical-control.md`. Nulo hasta que se elige.

### `resource_kind` — `asset_resources.kind` (D59)
`server` Servidor · `database` Base de datos · `storage` Almacenamiento · `function` Función · `other` Otro (solo lo conoce la evaluación; **no** se muestra como activo).

### Plataformas de conexión — `catalog.capability_platforms` (D67)

**No es un `enum`: es un catálogo en la base**, cargado por `npm run reference:load` (idempotente) y servido en `GET /v1/catalogs/automated-capabilities`. Es lo que el cliente elige en el
marketplace del paso 3. Las plataformas son las de la hoja del comité (AC-01…AC-06): en nube, proveedores; en servidores y equipos, el **sistema operativo**; en bases de datos, el **motor**.
Los nombres son marcas y **no se traducen**. `logo_key` es el nombre del SVG oficial en `Frontend-Platform` (igual a `code`, salvo `mysql_mariadb` → `mysql`). Orden = el de la hoja.

| Capacidad | Plataformas (`code` → nombre) |
|---|---|
| `ac_01` | `aws` Amazon Web Services · `azure` Azure · `gcp` GCP · `microsoft_365` Microsoft 365 · `google_workspace` Google Workspace |
| `ac_02`, `ac_04` | `linux` Linux · `windows` Windows · `hp_ux` HP-UX · `aix` AIX · `solaris` Solaris |
| `ac_03` | `postgresql` PostgreSQL · `mysql` MySQL · `sql_server` SQL Server · `oracle` Oracle · `mongodb` MongoDB |
| `ac_05` | `postgresql` PostgreSQL · `mysql_mariadb` MySQL / MariaDB · `sql_server` SQL Server · `oracle` Oracle · `mongodb` MongoDB |
| `ac_06` | `windows` Windows · `macos` macOS · `linux` Linux |

- **`availability`** (el enum de los marcos, D50): `available` | `coming_soon`. **Solo `aws` está `available`** (es el único flujo construido, D58); todas las demás se muestran **bloqueadas**.
  Pasar una a `available` exige que su flujo exista; es un cambio de dato, no de contrato.
- **Canales** (`platform_connection_methods`, el primero es el recomendado): `aws` → `readonly_role`, `access_keys`; los sistemas operativos y los motores de bases de datos → `agent`
  (diseño, DT-57); Azure, GCP, Microsoft 365 y Google Workspace → ninguno hasta que se defina su canal.
- **Frecuencias** (`capability_frequencies`): `ac_01` → `every_6h`, `every_24h`; `ac_02` a `ac_06` → `continuous`.
- **Tipo de activo** (`automated_capabilities.asset_type`): `ac_01` → `cloud_service` · `ac_02`, `ac_04` → `server` · `ac_03`, `ac_05` → `database` · `ac_06` → `endpoint`.
- **Regiones** (`platform_regions`): las de AWS se cargan de la lista actual del Backend (`GET /v1/catalogs/aws_region`); las demás plataformas no tienen regiones hasta que tengan flujo.

### `readiness` — nivel de preparación (`modules/control-tecnico-operacion.md`)
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

### `evaluation_origin` — `evaluations.origin`
`automated` Automática (sonda) · `manual` Manual (consultor con evidencia) · `ai_assisted`
Asistida por IA (revisión documental)

### `severity` — `findings.severity` y `vulnerabilities.severity`
`low` Baja · `medium` Media · `high` Alta · `critical` Crítica

### `action_plan_status` — `action_plans.status`
`open` Abierto · `in_progress` En curso · `done` Hecho · `cancelled` Cancelado. "Vencido" no es un
estado: se deriva de `due_date`.

### `risk_treatment_decision` · `evaluation_result` · `finding_status` · `finding_origin` · `check_result_status`
Ya definidos en `modelo-datos.md` (§7 y §8): `mitigate|accept|transfer|avoid`,
`compliant|non_compliant|pending|error|excluded|not_applicable` (el resultado de un activo en un test, ampliado por D68), `open|remediated|excluded`, `system|auditor`,
`passed|failed|invalid|not_applicable|not_run`.

## Cumplimiento — contratos de endpoints (MD-108)

**Qué listas sirve `GET /v1/catalogs/{name}` (2026-10-17).** Además de las del onboarding, sirve las de cumplimiento y las del catálogo maestro: `risk_criterion`, `failure_category`, `risk_level`, `risk_treatment_decision`, `responsible_type`, `cause_control_effect`, `exclusion_status`, `assessor_role`, `assessment_verdict`, `dimension`, `control_type`, `catalog_origin`, `loss_type` y `risk_scale` (valores `1`–`5`, de la matriz 5×5). La respuesta es la de siempre (`value` + `label` según `Accept-Language`), en el orden del enum. **Ningún cliente escribe estas listas a mano**; la fuente es el enum de la base y la etiqueta, `i18n/<idioma>/catalogs.json` del backend.

Valores que usan `modules/compliance-*.md`. Los de las tablas ya existentes (`dimension`, `trust_criterion`, `risk_criterion`, `risk_level`, `failure_category`, `risk_treatment_decision`, `evidence_review`,
`audit_observation_*`, `control_change_*`) no se repiten.

### `control_type` — `client_controls.type`
`manual` Manual · `automated` Automática · `hybrid` Híbrida · `technical_manual` Técnica manual

### `control_approval` — si un control propio ya lo aprobó el consultor
`approved` Aprobado · `pending` Pendiente de aprobación · `rejected` Rechazado. Un control del catálogo es siempre `approved`; uno propio cuenta desde que se crea, aunque esté `pending` (D65).

### `exclusion_status` — `exclusions.status`
`pending` Pendiente · `approved` Aprobada · `rejected` Rechazada. «Vencida» no es un estado: se deriva de `valid_until` (`is_expired`).

### `responsible_type` — `organization_responsibles.type`
`coo` COO · `it` TI · `compliance` Cumplimiento · `process` Proceso · `ciso` CISO · `asset_owner` Propietario del activo

### `loss_type` — tipos de pérdida de `client_risks.potential_impact` *(provisional, `P9`)*
`reputational` Reputacional · `financial_loss` Pérdida financiera · `regulatory_sanction` Sanción regulatoria · `litigation` Litigios · `customer_trust_loss` Pérdida de confianza de clientes ·
`operation_interruption` Interrupción de la operación. El Excel trae dos variantes de la última («…de la operación» y «…o cierre de la operación»); se tratan como un valor (decisión de desarrollo del 2026-10-17; el comité lo ratifica, `P9`).

### `verdict_result` — el veredicto de un test (`modules/compliance-audit.md`)
`compliant` Cumple · `non_compliant` No cumple. Es el subconjunto de `asset_result` que puede dar una persona.

## Estados de evaluación (D68)

Los **estados que el motor calcula** en cada nivel (`modelo-datos.md` §9). Se **derivan**, no son una columna que alguien edita. **La fuente (hoja `MODELO EVALUACIÓN MONKEY`) solo da las etiquetas en español**; los valores en
`snake_case` en inglés son nuestra nomenclatura. El cliente ve el estado cualitativo (Preparado, Casi listo, Requiere trabajo, Sin medir: `philosophy.md`) junto con su porcentaje de avance (D80); estos son los estados del motor, la **vista técnica** del consultor, el auditor y, desde D81, el administrador de la empresa.

### `evidence_state` — estado calculado de una evidencia
`compliant` Cumple · `non_compliant` No cumple · `pending` Pendiente · `in_review` En revisión · `expired` Evidencia vencida · `not_applicable` No aplica.

### `evidence_review` — `evidence_reviews.review` (D84)
`pending_review` Pendiente de revisión · `ai_prevalidated` Pre-validada por IA · `human_validated` Validada por una persona. Solo `human_validated` permite `compliant`; la IA nunca produce «cumple» (RN-03).
**Lo guarda una persona solo como `pending_review` o `human_validated`; `ai_prevalidated` lo deriva el servidor** (la entrega tiene `ai_verdict` y ninguna revisión humana) y nunca se acepta de un cliente.
`reviewer_role` (`evidence_reviews.reviewer_role`): `consultor` · `auditor`. La empresa no aprueba ni rechaza la evidencia (D84).

### `asset_result` — el resultado de un activo en un test (`evaluations.result`)
`compliant` Cumple · `non_compliant` No cumple · `pending` Pendiente · `error` Error · `excluded` Excluido (más `not_applicable`).

### `test_state` — estado de un test
`compliant` Cumple · `non_compliant` No cumple · `pending` Pendiente · `evaluating` En evaluación · `in_review` En revisión · `expired` Vencido · `error` Error · `no_assets` Sin activos ·
`not_applicable` No aplica · `deactivated` Desactivado.

### `control_state` — estado de un control del cliente
`effective` Efectivo · `ineffective` No efectivo · `expired` Vencido · `error` Error · `incomplete` Incompleto · `evaluating` En evaluación · `no_tests` Sin tests.

### `rollup_state` — estado de una categoría y de un marco
`compliant` Cumple · `non_compliant` No cumple · `evaluating` En evaluación · `no_controls` Sin controles · `out_of_scope` Fuera de alcance.

### `cause_state` · `risk_state` — mitigación (no es el riesgo que queda)
Causa: `mitigated` Mitigada · `not_mitigated` No mitigada · `evaluating` En evaluación · `no_controls` Sin controles.
Riesgo: `mitigated` Mitigado · `not_mitigated` No mitigado · `evaluating` En evaluación · `no_causes` Sin causas.
### `residual_acceptance` — el riesgo que queda frente al apetito (D75)
`acceptable` Aceptable · `not_acceptable` No aceptable. El valor del apetito es un parámetro (inicial: 9 sobre 25); quién lo define está abierto (`P22`).

### `assessor_role` · `assessment_verdict` — evaluación del consultor y del auditor (D77)
Rol: `consultor` Consultor · `auditor` Auditor. Veredicto del consultor: `ready` Lista para la auditoría · `not_ready` No lista. Veredicto del auditor: `certified` Certifica · `not_certified` No certifica.

### `cause_control_effect` — `cause_controls.effect` y `client_cause_controls.effect` (D75)
`probability` Probabilidad · `impact` Impacto. Un control sin efecto definido no participa del residual.

Colores estándar (REQ-048): verde cumple, efectivo, mitigado · rojo no cumple, no efectivo, no mitigado · amarillo pendiente, sin activos, sin tests · naranja en evaluación, en revisión, incompleto, vencido, error · gris no aplica, fuera de alcance, desactivado.

