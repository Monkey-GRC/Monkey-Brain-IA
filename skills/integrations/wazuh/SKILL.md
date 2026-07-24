---
name: wazuh
description: >-
  Conocimiento completo de Wazuh como plataforma SIEM/XDR open-source:
  arquitectura, API REST, agentes, Security Configuration Assessment (SCA),
  detección de vulnerabilidades, File Integrity Monitoring, MITRE ATT&CK, y
  el mapeo de cumplimiento normativo que Wazuh evalúa de forma nativa (PCI
  DSS, HIPAA, NIST 800-53, TSC/SOC 2, GDPR, GPG13, ISO 27001, CIS) o vía
  tags/checks personalizados (CMMC 2.0 y otros). Incluye además, como caso
  aplicado, el SOC gestionado construido sobre esta base por Bryan Tejeda
  (BR Soporte / NexT Audit & Consulting) en un VPS Contabo. Usa esta skill
  siempre que la conversación mencione Wazuh, SIEM, XDR, SCA, agentes de
  monitoreo, FIM, detección de vulnerabilidades, MITRE ATT&CK, qué normativa
  cubre Wazuh, compliance con Wazuh, la plataforma MONKEY, o cualquier
  integración del backend con Wazuh — aunque el usuario no diga "Wazuh"
  explícitamente (p. ej. "conectar el servidor del cliente al monitoreo" o
  "qué evidencia nos da el SIEM para SOC 2").
---

# Wazuh — plataforma SIEM/XDR y su mapeo de cumplimiento

Skill con el conocimiento de Wazuh como producto (arquitectura, API,
capacidades, cumplimiento normativo que evalúa) y, como caso aplicado
concreto, el SOC gestionado que Bryan opera sobre esta base.

## Qué es Wazuh (para orientar cualquier respuesta)

Plataforma SIEM/XDR open-source y gratuita (self-hosted), compuesta por
**Indexer** (OpenSearch, almacena y busca eventos), **Manager** (recibe
datos de los agentes, aplica reglas/decoders, ejecuta detección) y
**Dashboard** (Kibana-like, visualización). Capacidades principales:

- **Log/event analysis** — ingesta y correlación de logs vía reglas.
- **File Integrity Monitoring (FIM)** — detecta cambios en archivos/registro.
- **Security Configuration Assessment (SCA)** — audita configuración contra
  CIS Benchmarks y políticas custom.
- **Vulnerability detection** — CVEs por software instalado (syscollector).
- **Malware/rootcheck** — detección básica de malware y rootkits.
- **Incident response** — respuesta activa (bloqueo de IP, etc.).
- **Cloud security** — auditoría de AWS/Azure/GCP/Office365/GitHub.
- **Regulatory compliance** — mapeo automático de alertas/checks a
  requisitos de normativas (ver `references/compliance.md`).
- **MITRE ATT&CK** — mapeo de alertas a técnicas/tácticas del framework.

## Cómo usar esta skill

Lee el archivo de referencia según la tarea:

| Tarea | Archivo |
|---|---|
| Arquitectura general de Wazuh, instalar/reparar un manager, hardening, firewall, puertos | `references/infraestructura.md` |
| Instalar agentes (Windows/Linux/macOS/cloud), grupos, multi-tenancy, onboarding | `references/agentes.md` |
| **Qué normativas evalúa Wazuh** (nativas vs. vía tags custom), SCA, niveles de severidad, MITRE ATT&CK, reportes de cumplimiento | `references/compliance.md` |
| API de Wazuh, OpenSearch, syscollector, vulnerabilidades, patrones de integración | `references/api-integracion.md` |
| **Caso aplicado**: el SOC gestionado específico de Bryan (VPS Contabo, precios, alertas Telegram/WhatsApp, modelo comercial) — solo si la pregunta es de ese negocio puntual, no de Wazuh en general | `references/soc-gestionado.md` |

## Reglas de trabajo

1. **Distinguir siempre "Wazuh en general" de "el SOC gestionado de Bryan".**
   Las cuatro primeras referencias (`infraestructura.md`, `agentes.md`,
   `compliance.md`, `api-integracion.md`) describen Wazuh como producto —
   aplican a cualquier despliegue. `soc-gestionado.md` es un caso de negocio
   específico (VPS Contabo `161.97.157.83`, precios en COP, marca BR
   Soporte/NexT) — no generalizar sus datos operativos (IP, puertos, precios)
   como si fueran genéricos de Wazuh.
2. **Distinguir cobertura nativa de cobertura custom.** Wazuh trae de fábrica
   mapeo a PCI DSS, HIPAA, NIST 800-53, TSC/SOC 2, GDPR, GPG13, ISO 27001 y
   CIS (vía SCA). Otras normativas (CMMC 2.0, NIS2, DORA, LGPD, CCPA/CPRA,
   FedRAMP, SOC 1) **no** tienen dashboard/ruleset nativo — Wazuh puede
   servir como fuente de evidencia técnica para ellas mediante checks SCA y
   tags de `<group>` personalizados, pero eso es trabajo de mapeo adicional,
   no algo que "ya viene incluido". Nunca afirmar que Wazuh cubre una
   normativa nativamente sin verificarlo contra `references/compliance.md`.
3. **La clave `tsc` y `soc_2` son el mismo marco** (Trust Services Criteria =
   SOC 2) — normalizar hacia `soc_2` al construir filtros o reportes (bug
   conocido documentado en `references/compliance.md`).
4. Comandos exactos, paso a paso, cuando la tarea es operar producción: dar
   un comando por vez en pasos delicados, pedir la salida antes de seguir.
5. **En documentos del SOC gestionado de Bryan**, usar la marca
   correspondiente (BR Soporte para soporte gestionado, NexT Audit para
   auditoría) y firmar como **Bryan Tejeda**. Esto no aplica a preguntas
   genéricas sobre Wazuh o sobre la integración del backend de Monkey.
6. **Nunca sugerir Wazuh Cloud (SaaS de pago)** cuando se pregunte por el
   despliegue del SOC de Bryan: la instalación self-hosted ya incluye todas
   las capacidades gratis. Para preguntas genéricas sobre Wazuh, mencionar
   que existe Wazuh Cloud como opción, sin recomendarla por defecto.
