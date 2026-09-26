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

⚠️ `modelo-datos.md` dice "40+ opciones" y el Excel lista 19. **Faltan las demás**: hasta que el
comité entregue la lista completa, valen estas 19 y `other`.

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

### `regulation` — catálogo `regulations` (tabla propia, no enum de columna) · 14 valores

`ley_1581_co` Ley 1581 (CO) · `lfpdppp_mx` LFPDPPP (MX) · `ley_29733_pe` Ley 29733 (PE) ·
`ley_19628_cl` Ley 19628 (CL) · `ley_25326_ar` Ley 25326 (AR) · `lgpd_br` LGPD (BR) ·
`gdpr_eu` GDPR (UE) · `lopdgdd_es` LOPDGDD (ES) · `hipaa_us` HIPAA (US) · `ccpa_cpra_us`
CCPA/CPRA (US) · `glba_us` GLBA (US) · `pci_dss` PCI DSS · `none` Ninguna · `other` Otra

`regulations` no se puntúa (decisión D10): determina qué aplica, no entra al cálculo.

> **No existe el campo "framework que desea gestionar" a nivel de empresa.** El Excel lo trae
> (`framework_a_gestionar`) pero el comité lo **vetó**: los marcos se contratan por servicio.
> No se construye.

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

### `framework` — catálogo `frameworks` · 6 valores en el Componente 2

`soc2` SOC 2 · `soc1` SOC 1 · `iso27001` ISO 27001 · `pci_dss` PCI DSS · `hipaa` HIPAA ·
`nist_csf` NIST CSF

Solo se ofrecen los **contratados** por esa empresa. El Componente 1 del Excel listaba además
`CIS Controls`, pero ese campo está vetado.

### `previous_certification` — `services.previous_certification` · opcional

`soc2` SOC 2 · `soc1` SOC 1 · `iso27001` ISO 27001 · `none` Ninguna

⚠️ `modulos/onboarding.md` decía que este campo "no persiste en una entidad propia", pero
`modelo-datos.md` §6.2 sí lo declara como columna. Persiste.

### `expected_availability` — `services.expected_availability`

`24x7` 24/7 · `business_hours` Horario de negocio · `on_demand` Por demanda · `not_applicable` N/A

El Excel añade *"(o escriba otra opción manual)"*: no se implementa como texto libre; si hace
falta, se añade un valor al enum.

## Componente 3 — scope y activos

### `deployment_scenario` — `services.deployment_scenario` · 4 valores

⚠️ `modelo-datos.md` no declara valores. Se derivan del bloque 2A del Excel.

| Valor | es | Conexiones que aplican |
|---|---|---|
| `cloud_managed_only` | Solo nube (gestionada) | `ac_01` |
| `cloud_with_servers` | Nube con servidores / VPS | `ac_01`, `ac_02`, `ac_03` |
| `on_premise` | On-premise | `ac_04`, `ac_05`, `ac_06` |
| `hybrid` | Híbrido | combinación de los anteriores |

### `connection_category` — `assets.connection_category` y `automated_capabilities.catalog_code`

| Valor | es | Plataformas |
|---|---|---|
| `ac_01` | Servicios en nube (gestionados, sin servidor) | AWS, Azure, GCP, Microsoft 365, Google Workspace |
| `ac_02` | Servidores en nube / VPS | Linux, Windows, HP-UX, AIX, Solaris |
| `ac_03` | Bases de datos en nube | PostgreSQL, MySQL, SQL Server, Oracle, MongoDB |
| `ac_04` | Servidores on-premise | Linux, Windows, HP-UX, AIX, Solaris |
| `ac_05` | Bases de datos on-premise | PostgreSQL, MySQL/MariaDB, SQL Server, Oracle, MongoDB |
| `ac_06` | Endpoints / estaciones de trabajo | Windows, macOS, Linux |

`ac_01` corre cada 6-24 h; `ac_02` a `ac_06` son continuos.

### `operational_status` — `assets.operational_status`

`operational` Operativo · `warning` Con advertencias · `error` Con error ·
`not_monitored` Sin monitoreo

### `dimension` — las 5 dimensiones · `control_dimensions.dimension`

`policy` Política / Documental · `server` Servidor · `database` Base de datos · `app`
Aplicación · `cloud` Nube

⚠️ `scopes` tiene cinco contadores (`server_count`, `cloud_count`, `app_count`,
`database_count`, `endpoint_count`) que **no corresponden a estas cinco dimensiones**:
`endpoint` no es dimensión y `policy` no se cuenta. Pendiente de reconciliar.

## Plataforma

### `isolation_strategy` — `companies.isolation_strategy`
`shared` Compartida (RLS) · `dedicated` Dedicada

Lo marca `admin_monkey` al registrar la empresa. No se revierte sin migrar datos.

### `company_status` — `companies.status`
`active` Activa · `suspended` Suspendida

### `access_key_status` — `access_keys.status`
`pending` Pendiente · `used` Usada · `expired` Expirada · `revoked` Revocada

### `user_role` — `users.role`
`admin_monkey` · `admin_empresa` · `funcional` · `auditor`

⚠️ El schema actual del Backend usa `MONKEY_ADMIN`, `CLIENT_ADMIN`, `USER`, `VIEWER`. El modelo
nuevo manda estos cuatro en minúscula; la API expone los del modelo.

### `user_status` — `users.status`
`active` Activo · `inactive` Inactivo · `suspended` Suspendido
