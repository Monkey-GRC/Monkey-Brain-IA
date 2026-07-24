---
id: add-wazuh-integration
name: Integrar el backend con Wazuh
description: Cómo agregar una feature en el backend NestJS que consuma la API de Wazuh (agentes, SCA, vulnerabilidades), siguiendo Clean Architecture. Consultar al wazuh-integration-expert para los hechos de API/infra.
type: skill
applies_to: backend
---

# Skill: Integrar el backend con Wazuh

Esto **no** reemplaza `add-feature.md` — es la misma receta de 8 pasos,
aplicada a una feature `integrations/wazuh` (o similar), con las
particularidades de hablar con un sistema externo (Wazuh) en vez de solo con
Prisma.

Antes de escribir código, consulta al agente `wazuh-integration-expert`
(`../../agents/wazuh-integration-expert.md`) para confirmar: endpoint exacto
de la API de Wazuh a usar, forma de la respuesta, y cualquier restricción de
seguridad/rendimiento. Este documento asume que ya tienes esa respuesta.

## Pasos (variante de `add-feature.md`)

1. **Dominio** — `src/features/integrations/wazuh/domain/entities/`. Modela
   los conceptos que el negocio necesita (p. ej. `AgentComplianceStatus`,
   `SecurityFinding`), no la forma cruda de la respuesta de Wazuh.

2. **Interfaz de repositorio/cliente** — `domain/repositories/wazuh-client.repository.ts`.
   Clase abstracta con los métodos que el dominio necesita (`getAgentsByGroup`,
   `getScaChecks`, `getVulnerabilities`), sin ningún detalle HTTP.

3. **DTOs** — `application/dtos/`. Tipar la respuesta que el backend expone
   a sus propios clientes (frontend), no la respuesta cruda de Wazuh.

4. **Use-cases** — `application/use-cases/`, uno por operación de negocio
   (p. ej. `sync-agent-compliance.use-case.ts`, `get-security-findings.use-case.ts`).

5. **Cliente HTTP de Wazuh** — `infrastructure/repositories/wazuh-http.client.ts`.
   Implementa la interfaz del paso 2:
   - Auth: obtiene JWT de `POST /security/user/authenticate` y lo cachea
     hasta expiración (no autentica en cada request).
   - Base URL y credenciales vía variables de entorno /
     configuración cifrada — **nunca hardcodeadas** (mismo patrón que
     `JWT_SECRET` en `.env`).
   - Timeout y manejo de error explícito — Wazuh puede tardar segundos en
     consultas SCA con ~500 checks.

6. **Mapeo de compliance** — al traducir resultados de Wazuh a `Control`/
   `Risk` del dominio propio, usar la tabla de claves de compliance de
   `../integrations/wazuh/references/compliance.md`
   (`tsc`==`soc_2`, `iso_27001-2013`, `cis`, `pci_dss_v4.0`, `cmmc_v2.0`,
   `hipaa`, `nist_800_53`, `gdpr`) y cruzarla con los frameworks ya
   documentados en `../product/monkey-compliance-council/references/frameworks/`.

7. **Controller** — `presentation/`. Expone endpoints propios del backend
   (p. ej. `GET /clients/:id/security-findings`), nunca reexpone la API de
   Wazuh 1:1 al frontend. Envuelve en `ResponseDto` como cualquier otra
   feature.

8. **Módulo + registro en `app.module.ts`** — igual que cualquier feature.

## Multi-tenancy (obligatorio)

Cada `Client` del backend corresponde a un grupo de agentes Wazuh
(`cliente_<nombre>`). Toda consulta a la API de Wazuh debe filtrar por ese
grupo — nunca traer agentes de todos los clientes y filtrar después en el
backend.

## Rendimiento

Los resultados de SCA (~500 checks por agente) pueden tardar segundos.
Cachear en la base de datos propia (tabla/columna con timestamp de última
sincronización) y refrescar por cron/job, no en cada request del usuario
final — mismo patrón que usa el SOC de referencia (ver
`../integrations/wazuh/references/api-integracion.md`).

## Seguridad (no negociable, ver también `wazuh-integration-expert.md`)

- Credenciales de la API de Wazuh cifradas, nunca en el repo.
- Ningún endpoint propio debe permitir que un cliente consulte agentes de
  otro cliente (validar `tenant`/`Client.id` contra el grupo Wazuh en cada
  request).
- Cambios de firewall/puertos en el VPS de Wazuh son decisión crítica — ver
  `../../agents/tech-lead.md`.

## Después de terminar

- Confirmar con `wazuh-integration-expert` que el mapeo de compliance quedó
  correcto antes de pasar a QA.
- QA prueba con un agente Wazuh real (o su mock) que el flujo completo
  (sync → mapeo → endpoint propio) responde con datos coherentes.
