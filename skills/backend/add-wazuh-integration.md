---
id: add-wazuh-integration
name: Integrar el backend con la sonda (Wazuh)
description: Cómo construir el adaptador real de la sonda en el backend NestJS (puerto ConnectionProbe de technical-control), respetando las reglas del modelo, la confidencialidad del proveedor y las decisiones aún abiertas (D48, P12). Consultar al wazuh-integration-expert para los hechos de API/infra.
type: skill
applies_to: backend
---

# Skill: Integrar el backend con la sonda (Wazuh)

> **Antes de escribir una línea, lee `D48` y `P12`** (`../product/monkey-compliance-council/references/datos/`) y
> `deuda-tecnica/control-tecnico.md` (**DT-31 a DT-36**). Quién instala los agentes, cómo se asigna cada empresa a su grupo y cómo
> lee Monkey los resultados **siguen sin decidirse**: si lo que vas a construir depende de una de esas respuestas, no la resuelvas
> por tu cuenta, pregunta. El paso 3 del onboarding (conectar un activo) es **provisional** porque se construyó antes de verificar la
> sonda real.

Esto **no** es una feature nueva con endpoints propios. La integración real es **un tercer adaptador del puerto `ConnectionProbe`**
(`src/features/technical-control/domain/ports/connection-probe.ts`): hoy existen `simulated` y `unavailable`, elegidos por
`PROBE_MODE` en `infrastructure/probes/connection-probe.factory.ts`. Los casos de uso **no se tocan** (DT-1). Sigue la receta de
`add-feature.md`, con lo que cambia al hablar con un sistema externo.

Consulta al agente `wazuh-integration-expert` (`../../agents/wazuh-integration-expert.md`) para el endpoint exacto de la API, la forma
de la respuesta y las restricciones de seguridad/rendimiento.

## Dónde va cada cosa

1. **Puerto y dominio** — ya existen en `technical-control/domain/`. Un resultado de la sonda se modela con los conceptos del
   negocio (`check`, activo, resultado), no con la forma cruda de la respuesta de Wazuh.
2. **Adaptador** — `technical-control/infrastructure/probes/<nombre>.probe.ts`, **solo lectura**. Auth contra la API de Wazuh
   (`POST /security/user/authenticate`); el JWT dura ~900 s: se cachea y se re-autentica ante un `401`. Usa el certificado
   (`root-ca.pem`), **nunca `verify=False`**. URL y credenciales por variables de entorno (hoy reservadas: `WAZUH_*` en
   `.env.example`), **nunca hardcodeadas**. Pide un usuario de API y de base **de solo lectura** (DT-36).
3. **Dónde se guardan los resultados** — en las tablas de `modelo-datos.md` §8: `executions` (qué corrió sobre qué activo; un fallo
   de ejecución es un problema de **conexión**, no un incumplimiento), `check_results` (el dato crudo) y `execution_logs`. La
   interpretación (`evaluations`) la hace el motor de cumplimiento, no el adaptador.
4. **Controller** — la feature `technical-control` ya expone los endpoints del contrato (`contracts/modules/onboarding-technical-control.md`).
   **Nunca** reexpongas la API de Wazuh 1:1 al frontend.

## Reglas del modelo que no se rompen (de `control-tecnico/wazuh.md`)

- **Clave compuesta de tres partes: `platform` + `policy_id` + `check_id`.** Nunca solo `check_id`: el mismo ID significa cosas
  distintas entre políticas y plataformas (D6).
- **Cinco estados, no dos:** `passed`, `failed`, `invalid`, `not_applicable` (llega como `result` vacío) y `not_run`. `invalid` es real y
  frecuente, y **no** se colapsa con «no aplica».
- **El mapeo a SOC 2 lo pone Monkey, no Wazuh.** Se hace con el catálogo propio (`checks`, `test_checks`, `check_mappings`, con
  procedencia y confianza), **no** con las etiquetas de cumplimiento que traiga la sonda. Un mapeo inferido nunca se presenta como dato
  de la sonda.
- **OpenSearch (9200) no sirve para el inventario puntual:** solo tiene el flujo de cambios. El estado actual completo sale de la API
  (55000). El histórico hay que construirlo en Monkey.
- **«Automatizado ≠ Operativo»:** solo una sonda real puede declarar un activo `operational`.

## Confidencialidad (no negociable)

El proveedor **nunca** aparece ante el cliente final: ni en pantallas, notificaciones, reportes, mensajes de error, logs que el cliente
vea ni texto generado por IA. En el producto se dice «sonda», «capacidad automática» o «evaluación automática». Los textos de las
pruebas del comité sí lo nombran (P11) y **no deben salir a la UI**.

## Multi-tenancy y seguridad

- **Hoy nada impide que un agente caiga en otra empresa** (DT-33): la clave de inscripción es global y el grupo lo declara el agente.
  Hasta que P12 lo resuelva, el adaptador **debe validar la pertenencia del agente a la empresa al sincronizar**, y nunca traer
  agentes de todas las empresas para filtrar después en el backend.
- No asumas la convención `cliente_<nombre>` para los grupos: no es una regla de Monkey.
- Toda lectura de datos de Monkey pasa por `prisma.withScope` (RLS). Credenciales de la API cifradas, nunca en el repo.
- Cambios de firewall o puertos en el servidor de la sonda son decisión crítica (`../../agents/tech-lead.md`).
- Cualquier requisito nuevo se registra en `../product/monkey-compliance-council/references/seguridad/requisitos.md`.

## Rendimiento

Los resultados SCA (~500 checks por agente) tardan segundos: se cachean en la base propia con la hora de la última sincronización y se
refrescan por trabajo programado (`schedule_rules`), no en cada petición del usuario.

## Después de terminar

- Confirmar con `wazuh-integration-expert` que la lectura de la API quedó correcta antes de pasar a QA.
- Retirar las etiquetas de «modo demostración» del frontend **solo** cuando la sonda real sea la que corre (DT-1).
- QA prueba con un agente real (o su simulación) el recorrido completo: sincronizar → resultado crudo → evaluación → pantalla.
- Cerrar o actualizar las filas de `deuda-tecnica/` que correspondan (DT-1, DT-31 a DT-36) y el pendiente P12.
