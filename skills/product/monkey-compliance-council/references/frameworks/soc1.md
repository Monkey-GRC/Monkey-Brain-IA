# SOC 1 — Internal Control over Financial Reporting (ICFR)

`[VERIFICADO — búsqueda web 22 jul 2026]`

## Qué es
Reporte de la AICPA (bajo SSAE 18 AT-C 320) sobre controles en una organización de servicios que son relevantes para el **control interno sobre reportes financieros (ICFR)** de sus clientes — es decir, no trata seguridad de la información en general, sino si los controles del proveedor podrían afectar de forma material la exactitud de los estados financieros bajo GAAP de quien lo contrata.

## Diferencia clave con SOC 2
SOC 1 se pide cuando un vendor procesa transacciones que afectan los estados financieros del cliente (p. ej. una plataforma de nómina, un procesador de pagos que alimenta la contabilidad). SOC 2 se pide cuando el proveedor gestiona, almacena o transmite datos del cliente en general. En un SOC 1 se prueban controles que cumplen los objetivos de control identificados; en un SOC 2 se identifican y prueban controles contra los Trust Services Criteria.

## Relevancia para Monkey / ICP
Baja para el ICP primario (SaaS B2B típico). Relevante si Monkey expande a clientes fintech, procesadores de pagos, o plataformas de nómina/contabilidad — casos donde el propio cliente de Monkey necesita emitir un SOC 1 a sus clientes. Tratar como framework de nicho, no como prioridad de roadmap salvo demanda validada.

## Fuentes
- [SOC 1 vs. SOC 2 — Secureframe](https://secureframe.com/blog/soc-1-vs-soc-2)
- [SOC 1 Vs SOC 2: Compliance Framework Differences Explained — SentinelOne](https://www.sentinelone.com/cybersecurity-101/cybersecurity/soc-1-vs-soc-2/)
