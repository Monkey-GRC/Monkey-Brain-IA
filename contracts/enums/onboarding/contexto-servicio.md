# Enums — Onboarding · Contexto del servicio

Los valores de los enums de este módulo. Índice de todos: [`enums.md`](../../enums.md). Por el cable viaja el **valor**; la etiqueta la resuelve i18n.

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

⚠️ `arquitectura/onboarding/README.md` decía que este campo "no persiste en una entidad propia", pero
`modelo-datos.md` §6.2 sí lo declara como columna. Persiste.

### `expected_availability` — `services.expected_availability`

`24x7` 24/7 · `business_hours` Horario de negocio · `on_demand` Por demanda · `not_applicable` N/A

El Excel añade *"(o escriba otra opción manual)"*: no se implementa como texto libre; si hace
falta, se añade un valor al enum.

### `service_framework_status` — `service_frameworks.status`
`active` Activo · `paused` En pausa · `finished` Finalizado
