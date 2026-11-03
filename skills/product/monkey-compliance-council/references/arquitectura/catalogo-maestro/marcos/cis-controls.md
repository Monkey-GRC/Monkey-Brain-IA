# CIS Controls v8.1

`[VERIFICADO — búsqueda web 22 jul 2026]`

## Qué es
Conjunto de mejores prácticas de ciberseguridad priorizadas y accionables, mantenido por el Center for Internet Security. v8.1 (junio 2024) añadió alineación con NIST CSF 2.0 (incluida la función Govern) y 153 salvaguardas medibles pensadas para entornos cloud, híbridos y remotos.

## Estructura
18 controles, 153 salvaguardas, organizados en **3 Implementation Groups (IG)** autoevaluados según el perfil de riesgo y recursos de la organización:
- **IG1 — Higiene cibernética esencial**: 56 salvaguardas fundamentales que toda empresa debería aplicar contra los ataques más comunes; es "la rampa de entrada" — toda organización debería empezar aquí.
- **IG2**: 74 salvaguardas adicionales sobre IG1, para organizaciones con entornos de TI más complejos.
- **IG3**: 23 salvaguardas adicionales sobre IG2, para empresas con equipo de seguridad dedicado enfrentando adversarios sofisticados.

## Quién lo necesita típicamente
Empresas que quieren una hoja de ruta priorizada y accionable de "qué hacer primero" en seguridad, más que un framework de auditoría formal — muy compatible con la filosofía de Monkey de traducir compliance en acciones concretas. También es la base de referencia del módulo SCA de Wazuh (benchmarks tipo CIS).

## Mapeo a controles atómicos de Monkey
IG1 es candidato natural para ser la base del catálogo de controles atómicos "esenciales" que Monkey activa automáticamente para cualquier tenant nuevo, independientemente del framework que persiga — es la higiene mínima que subyace a SOC 2, ISO 27001 y PCI DSS por igual.

## Wazuh
El módulo SCA (Security Configuration Assessment) de Wazuh corre benchmarks tipo CIS directamente contra los endpoints — ver `../../control-tecnico/motores/wazuh.md`.

## Fuentes
- [CIS Critical Security Controls Implementation Groups — CIS](https://www.cisecurity.org/controls/implementation-groups)
- [CIS Critical Security Controls Implementation Group 1 — CIS](https://www.cisecurity.org/controls/implementation-groups/ig1)
- [CIS Controls: How to Implement v8.1 — Secureframe](https://secureframe.com/blog/cis-critical-security-controls)
