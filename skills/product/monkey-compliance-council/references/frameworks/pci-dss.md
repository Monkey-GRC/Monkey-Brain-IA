# PCI DSS v4.0.1

`[VERIFICADO — búsqueda web 22 jul 2026]`

## Qué es
Estándar de seguridad de la industria de tarjetas de pago, desarrollado por el PCI Security Standards Council, para proteger los datos de titulares de tarjetas. v4.0.1 (junio 2024) fue una actualización de mantenimiento sobre v4.0 que clarificó requisitos y corrigió errores menores. **Desde el 31 de marzo de 2025, todos los requisitos "future-dated" de v4.0.1 son obligatorios.**

## Estructura
12 requisitos núcleo que cubren: controles de seguridad de red (firewalls, segmentación), **MFA obligatorio para todo acceso administrativo al entorno de datos de tarjetas (CDE)**, cifrado reforzado en tránsito y en reposo, y prácticas de desarrollo seguro (threat modeling, revisión de código).

## Cambio relevante en v4.0.1: el "customised approach"
Permite cumplir los objetivos de PCI DSS mediante controles alternativos en vez de seguir los requisitos prescriptivos al pie de la letra — más flexibilidad que versiones anteriores, pero requiere documentar y justificar la equivalencia.

## Quién lo necesita típicamente
Cualquier organización que almacene, procese o transmita datos de tarjetas de pago — procesadores de pagos, e-commerce, fintechs. El nivel de validación exigido (autoevaluación vs. auditoría por QSA) depende del volumen de transacciones anuales.

## Mapeo a controles atómicos de Monkey
El requisito 8.4 (MFA para acceso administrativo al CDE) es el ejemplo de control atómico compartido con SOC 2 CC6.1 e ISO 27001 8.5 — ya documentado como caso canónico en `../architecture.md`.

## Wazuh
Ruleset pre-etiquetado para PCI DSS de fábrica — ver `../wazuh.md`.

## Fuentes
- [Guide to the PCI-DSS v4.0.1 regulations — Specops Software](https://specopssoft.com/blog/pci-dss-v4-0/)
- [PCI DSS 4.0.1 — Scrut](https://www.scrut.io/hub/pci-dss/pci-dss-4-0-1-guide)
- [PCI DSS v4.0.1 (texto oficial, PDF)](https://www.middlebury.edu/sites/default/files/2025-01/PCI-DSS-v4_0_1.pdf?fv=AKHVQBp6)
