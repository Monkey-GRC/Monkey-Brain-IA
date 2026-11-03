# Enums — Onboarding · Contexto organizacional

Los valores de los enums de este módulo. Índice de todos: [`enums.md`](../../enums.md). Por el cable viaja el **valor**; la etiqueta la resuelve i18n.

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

### `responsible_type` — `organization_responsibles.type`
`coo` COO · `it` TI · `compliance` Cumplimiento · `process` Proceso · `ciso` CISO · `asset_owner` Propietario del activo
