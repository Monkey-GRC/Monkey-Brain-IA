# SOC 2 — Trust Services Criteria

`[VERIFICADO — búsqueda web 22 jul 2026]`

## Qué es
Marco de la AICPA (Trust Services Criteria, TSP Section 100) evaluado en una auditoría SOC 2. No es una ley ni una certificación técnica formal — es un framework de control que ayuda a una organización a evaluar y reportar sobre el diseño y la efectividad operativa de sus controles de seguridad, disponibilidad, integridad de procesamiento, confidencialidad y privacidad.

## Estructura
5 Trust Services Criteria: **Security** (obligatorio siempre), **Availability**, **Processing Integrity**, **Confidentiality**, **Privacy** (los otros 4 son opcionales, se eligen según los servicios y expectativas del cliente). Los Common Criteria (CC1-CC9), obligatorios en todo engagement, derivan de los 17 principios del framework COSO Internal Control - Integrated Framework (2013), con criterios suplementarios para áreas específicas de tecnología (acceso lógico, operaciones de sistema, gestión de cambios). El core se estableció en 2017; en 2022 la AICPA revisó los "points of focus" para reflejar tecnologías y amenazas actuales.

## Tipo I vs Tipo II
Tipo I evalúa el diseño de los controles en un punto en el tiempo. Tipo II evalúa la efectividad operativa de los controles durante un período (típicamente 3-12 meses) — es el que suelen pedir los clientes enterprise y el que más valor le da a la evidencia continua.

## Quién lo necesita típicamente
Empresas SaaS B2B que venden a otras empresas; casi siempre el primer framework que persigue una startup porque un cliente enterprise lo exige contractualmente antes de firmar.

## Mapeo a controles atómicos de Monkey
Los Common Criteria (CC1-CC9) son el núcleo de solapamiento más grande con ISO 27001 Annex A, PCI DSS y NIST CSF — la mayoría de controles atómicos del catálogo de Monkey deben nacer pensando primero en cubrir CC6 (acceso lógico y físico) y CC7 (operaciones de sistema), porque son los que más frameworks comparten.

## Wazuh
Wazuh incluye una guía dedicada "Using Wazuh for TSC 2017 requirements" y ruleset pre-etiquetado para TSC — ver `../wazuh.md`.

## Fuentes
- [2025 Trust Services Criteria for SOC 2 — Secureframe](https://secureframe.com/hub/soc-2/trust-services-criteria)
- [Trust Services Criteria for SOC 2 — Drata](https://drata.com/learn/soc-2/trust-services-criteria)
- [Using Wazuh for TSC compliance — Wazuh documentation](https://documentation.wazuh.com/current/compliance/tsc/index.html)

## Material fuente del proyecto

El comité produjo un desglose real de controles SOC 2 para un cliente
(`SOC2_TSC_Controles_Detallados_Monkey2.xlsx`, ver `../../../../assets/README.md`).
De ahí sale la anatomía que el modelo usa: **código TSC + criterio + punto de
enfoque** por requisito, más el **control del cliente** (código propio y su
interpretación con herramientas y cargos reales), el **plan de testeo** con
población y muestreo (10%, mínimo 5, máximo 25 casos), y las tres banderas por
dimensión (requiere sonda / requiere IA / confirmación de cumplimiento).

Ese archivo es un desglose de ejemplo con dos requisitos (CC6.1 y CC6.3), no el
catálogo completo: la carga del catálogo de requisitos TSC sigue pendiente. Ver
`../modelo-datos.md` §3.1 y §3.2.
