# Qué marcos evalúa la sonda de forma nativa, SCA, severidades y MITRE ATT&CK

Qué exige cada marco está en [`../../catalogo-maestro/marcos/`](../../catalogo-maestro/marcos/README.md); aquí solo **qué trae la sonda de fábrica** y qué hay que construir.

## Regla de oro: tsc == soc_2

En los checks de Wazuh, la clave `tsc` (Trust Services Criteria) y `soc_2` son **el mismo marco**. Origen de un problema conocido en datos históricos:

- Checks de **Windows** llegan con clave `soc_2`
- Checks de **Ubuntu** llegan con clave `tsc`
- El script `normalizar_soc2.py` copió `tsc` → `soc_2` pero **no eliminó** `tsc`, dejando duplicados en filtros ("SOC 2" y "SOC 2 (TSC)" aparecen como dos entradas)

Al construir filtros o reportes: unificar ambas claves como un solo marco SOC 2.

## Normativas que Wazuh evalúa de forma NATIVA (out-of-the-box)

El ruleset y los dashboards por defecto de Wazuh traen mapeo ya construido
para estos marcos — no requieren mapeo adicional para empezar a usarse:

| Clave en reglas/checks | Marco | Ejemplo de código | Módulo/dashboard nativo |
|---|---|---|---|
| `pci_dss_v3.2.1` / `pci_dss_v4.0` | PCI DSS | "8.2.5" / "8.3.6" | Sí — dashboard dedicado |
| `hipaa` | HIPAA (ePHI, Security Rule) | "164.308.a.5.II.D" | Sí — dashboard dedicado |
| `nist_800_53` | NIST 800-53 | "IA-5(1)" | Sí — dashboard dedicado |
| `tsc` / `soc_2` | SOC 2 (Trust Services Criteria) | "CC6.1, CC7.2" | Sí — dashboard dedicado |
| `gdpr` | GDPR | "II_5.1.f" (p. ej. `gdpr_IV_30`, `gdpr_V_32`) | Sí — dashboard dedicado |
| `gpg13` | GPG 13 (UK Good Practice Guide) | "7.1" | Sí — pre-mapeado en el ruleset |
| `iso_27001-2013` | ISO/IEC 27001:2013 | "A.9.4.3" | Sí — pre-mapeado en el ruleset |
| `cis` (vía SCA) | CIS Benchmarks (hardening por SO) | "1.1.1" | Sí — módulo SCA nativo |
| `cis_csc_v7` / `cis_csc_v8` | CIS Controls (v7/v8) | "16.1" / "5.2" | Sí — tags en el ruleset |

Un solo check técnico (ej. Print Spooler deshabilitado) genera evidencia
simultánea para varios de estos marcos a la vez (SOC 2 CC6.3/CC6.6, ISO
27001 A.13.1.3, PCI DSS, CIS) — esa es la base de "un hallazgo, múltiples
frameworks" que usa Monkey.

## Normativas SIN mapeo nativo (requieren tags/checks personalizados)

Wazuh **no** trae dashboard ni ruleset dedicado para estas — puede servir
como fuente de evidencia técnica (logs, FIM, SCA, vulnerabilidades) pero el
mapeo a la normativa hay que construirlo con tags custom en `<group>` o
políticas SCA propias:

| Clave (si se define custom) | Marco | Estado en Wazuh |
|---|---|---|
| `cmmc_v2.0` (custom) | CMMC 2.0 | Sin ruleset/dashboard oficial; Wazuh publica guía de cómo mapearlo, pero es trabajo de integración adicional — no viene "incluido" |
| — | NIS2 | Sin soporte nativo — evidencia vía logs/FIM/vulnerabilidades, mapeo manual |
| — | DORA | Sin soporte nativo — igual que NIS2 |
| — | LGPD | Sin soporte nativo — similar a GDPR, se puede adaptar el mapeo de `gdpr` como base, pero no es automático |
| — | CCPA/CPRA | Sin soporte nativo |
| — | FedRAMP | Sin soporte nativo — NIST 800-53 nativo puede reutilizarse como base parcial (FedRAMP se apoya en NIST 800-53), pero no es un mapeo 1:1 automático |
| — | SOC 1 | Sin soporte nativo (SOC 1 es financiero/ICFR, fuera del foco técnico de Wazuh) |

**Regla al responder**: nunca decir "Wazuh cubre X" para algo de esta
segunda tabla sin aclarar que requiere mapeo/tagging propio — es la
diferencia entre "ya viene" y "se puede construir con lo que Wazuh entrega".

## Niveles de severidad de reglas (0–15)

| Nivel | Tipo | Descripción |
|---|---|---|
| 0 | Ignored | No genera alerta |
| 1–3 | Low | Informativo |
| 4–6 | Medium | Notable, revisar |
| 7–10 | High | Investigar |
| 11–12 | Severe | Probable ataque |
| 13–14 | Critical | Ataque confirmado |
| 15 | Maximum | Compromiso del sistema |

## MITRE ATT&CK

Módulo nativo (no es una normativa de cumplimiento, es un framework de
amenazas) bajo **Threat Detection and Response → MITRE ATT&CK** en el
dashboard. Muchas reglas del ruleset traen un bloque `<mitre>` con el/los
`<id>` de técnica correspondiente (ej. regla mapeada a `T1078` Valid
Accounts, `T1110` Brute Force, `T1543.003` para persistencia/escalamiento).
Al dispararse la regla, la alerta ya queda etiquetada con su técnica ATT&CK
— útil para threat hunting y para enriquecer reportes de incidentes más
allá del compliance normativo puro.

## SCA (Security Configuration Assessment)

- Módulo: **Endpoint Security → Configuration Assessment** por agente.
- Cada agente recibe el CIS Benchmark de su SO (políticas YAML, ej.
  `cis_ubuntu22-04.yml`) y arroja score de checks passed/failed.
- Cada check SCA puede traer metadata `compliance` con múltiples claves a
  la vez (`pci_dss`, `tsc`, `cis_csc`, `cis`, etc.) — un check = evidencia
  para varios marcos simultáneamente.
- Exportar con **Export formatted** (CSV/PDF) desde el dashboard.
- Consultas SCA con ~500 checks vía API pueden tardar segundos → cachear
  siempre en la base de datos propia del backend, nunca consultarlas
  síncronamente en cada request (patrón usado por MONKEY).

## Fuentes (verificado en documentation.wazuh.com, julio 2026)

- PCI DSS, HIPAA, NIST 800-53, TSC y GDPR: mapeo nativo con dashboards
  dedicados — documentation.wazuh.com/current/compliance/
- GPG13 e ISO 27001: pre-mapeados en el ruleset por defecto
- CIS: vía módulo SCA (políticas YAML basadas en CIS Benchmarks)
- MITRE ATT&CK: documentation.wazuh.com/current/user-manual/ruleset/mitre.html
- CMMC 2.0: sin mapeo oficial nativo — Wazuh publica una guía de cómo
  construirlo (blog "Wazuh for CMMC compliance"), pero no es out-of-the-box
