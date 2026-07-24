# Operación y modelo comercial del SOC gestionado (caso aplicado de Bryan)

> Este archivo describe **un negocio específico** construido sobre Wazuh
> (BR Soporte / NexT Audit & Consulting, operado por Bryan Tejeda), no una
> capacidad genérica de Wazuh. Para conocimiento de Wazuh como producto —
> arquitectura, API, normativas que evalúa — ver los demás archivos en
> `references/` (`infraestructura.md`, `agentes.md`, `compliance.md`,
> `api-integracion.md`).

## Modelo de servicio

- Mercado: PyMEs colombianas, B2B. Precios en COP con modelo por niveles (tiers).
- Multi-tenant por defecto; **nunca describir el plan como "compartido"** en documentos cliente.
- VPS dedicado solo por exigencia contractual de aislamiento, cliente sector público (SECOP) con requisitos estrictos de privacidad, o >20 agentes de un solo cliente.

## Alertas y notificaciones

Prioridad de implementación:

1. **Telegram Bot** — el más rentable: se implementa en ~2 horas, costo $0, sin límites. Bot vía BotFather + webhook desde Wazuh, canal privado por cliente. Diferenciador percibido como muy valioso.
2. **WhatsApp Business API** (Twilio o Meta) — ~USD $0.005/mensaje, solo para alertas críticas/altas.
3. **Email** — nativo en Wazuh con Postfix/SendGrid.
4. **Slack / Teams** — clientes corporativos.

## Entregables mensuales por cliente

- Reporte ejecutivo PDF: resumen de alertas, incidentes y vulnerabilidades
- Informe de cumplimiento frente a políticas aplicables
- Recomendaciones priorizadas de remediación
- Métricas de disponibilidad del agente y uptime del monitoreo

## Servicios adicionales (add-ons)

- OSINT mensual del dominio del cliente con **CyberRisk Scorer** (USD $50–100/mes)
- Simulación de phishing trimestral con GoPhish
- Hardening de endpoints bajo demanda (aplicar recomendaciones SCA)
- Gestión de vulnerabilidades: priorización y seguimiento de CVEs con plan de remediación
- Monitoreo de cambios en archivos de configuración críticos (FIM)

## Reglas de redacción de documentos

- Firmar siempre como **Bryan Tejeda**.
- Marca según servicio: BR Soporte – Soluciones Tecnológicas (soporte gestionado) / NexT Audit & Consulting (auditoría y assessments).
- En cotizaciones/facturas: IVA 19% + retenciones colombianas (ReteIVA 15% del IVA, ReteRenta ~11% servicios, ReteICA Cali ≈ 9.66‰), mostrando valor bruto, deducciones y neto a recibir — **salvo que el cliente pida explícitamente omitir impuestos**, caso que ya ha ocurrido en propuestas comerciales del SOC.

## Plan operativo (compromisos declarados a clientes)

- Hasta 40 agentes simultáneos sin degradación
- 90 días de logs con rotación automática
- Dashboard 24/7 con TLS
- Alertas en tiempo real vía Telegram/WhatsApp integradas a Wazuh
- Escalamiento: al superar 40 agentes o 70% de disco → VPS 16 GB o nodo indexer adicional
