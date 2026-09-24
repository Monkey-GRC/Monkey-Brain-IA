# Alcance — Módulo de Onboarding (primer entregable del MVP)

**Para:** PO del proyecto
**De:** Héctor Ríos y Carlos
**Fecha:** 2026-09-21
**Duración planeada:** 2 semanas (2026-09-22 → 2026-10-03)
**Estado:** propuesta, pendiente de aprobación antes de abrir las historias en Jira

## Objetivo del sprint

Construir el módulo de Onboarding completo: los 3 componentes que capturan el contexto
del cliente antes de que exista ningún cálculo de cumplimiento. Al final de las 2
semanas, un cliente nuevo tiene que poder registrar su empresa, declarar al menos un
servicio y conectar al menos un activo, y ver su catálogo de cumplimiento ya clonado y
listo para empezar a medirse.

**Fuente de cada componente:** `skills/product/monkey-compliance-council/references/modulos/onboarding.md`,
que a su vez transcribe `assets/TSC INTERGRAL SOC 2 DETALLADO VF.xlsx` (hojas *Contexto
Empresa*, *Contexto del servicio*, *Activos del Servicio (SCOPE)*). Si algo de este
documento contradice esas fuentes, ganan ellas.

## Dentro de alcance

| Componente                   | Qué se construye                                                                                                                                   | Entidad(es)                                                                                                      |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 1 — Contexto Organizacional | Formulario de 10 campos, una vez por empresa                                                                                                        | `organizations`                                                                                                |
| 2 — Contexto del Servicio   | Formulario de 16 campos por servicio (repetible), incluida la carga de la Descripción del Sistema                                                  | `services`, `trust_criteria`, `subservice_organizations`, `service_frameworks`, `system_descriptions` |
| 3 — Control Técnico        | Selección de escenario de despliegue + flujo de conexión de activos (conectar → validar → activar → programar) sobre el catálogo AC-01…AC-06 | `scopes`, `assets`, `automated_capabilities`                                                         |
| Clonado del catálogo        | Al elegir marco en el Componente 2, se dispara la clonación automática de Requisitos/Puntos de Enfoque/Control al escenario del cliente           | ver decisión D23                                                                                                |

## Fuera de alcance (explícitamente, para no desviar el sprint)

- **Módulo de Cumplimiento** (edición de riesgos, causas y controles ya clonados) — es
  un módulo aparte, no bloquea el onboarding, y se construye después (ver decisión D23,
  pendiente de confirmación final del comité).
- **Dashboard de 4 preguntas** y el cálculo de cumplimiento en sí — el onboarding
  entrega los datos que ese motor va a consumir, pero el motor no se construye en este
  sprint.
- **Conectores reales** (AWS, Azure, GitHub, etc.) — el Componente 3 entrega el flujo de
  conexión y su UI; la integración productiva con cada proveedor es trabajo de los
  épicos de Conectores e Integración Wazuh, no de este sprint.
- **RBAC completo / roles personalizados** — el onboarding asume que ya existe un
  usuario `admin_empresa` autenticado (fundación mínima de Auth), no reconstruye login
  ni gestión de usuarios.

## Cronograma (10 días hábiles)

| Días | Fecha                    | Foco               | Entregable                                                                                                                                                |
| ----- | ------------------------ | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1-2   | 2026-09-22 → 2026-09-23 | Modelo y contratos | Migraciones de`organizations` y `services` (+ entidades colgantes), endpoints CRUD, contrato de API acordado con frontend                             |
| 3-4   | 2026-09-24 → 2026-09-25 | Componente 1       | Formulario Contexto Organizacional (10 campos) funcionando extremo a extremo, con validaciones                                                            |
| 5-7   | 2026-09-28 → 2026-09-30 | Componente 2       | Formulario Contexto del Servicio (16 campos, repetible por servicio), carga de Descripción del Sistema, disparo del clonado de catálogo al elegir marco |
| 8-9   | 2026-10-01 → 2026-10-02 | Componente 3       | Selección de escenario de despliegue + flujo de conexión de al menos 1 tipo de activo del catálogo AC-01…AC-06                                        |
| 10    | 2026-10-03               | Cierre             | QA de punta a punta (empresa → servicio → activo conectado → catálogo clonado visible), demo al PO, buffer para lo que se corra                       |

El día 10 es colchón deliberado: si algo de los días 1-9 se atrasa, absorbe ahí antes de
tocar la fecha de cierre del 2026-10-03.

## Dependencias y riesgos

- **Bloquea si no está listo antes del día 1:** el flujo de aprovisionamiento
  (Monkey Admin crea la empresa, fija `isolation_strategy`, genera la clave de acceso) y
  la pantalla donde el cliente usa esa clave para crear su cuenta `admin_empresa`. Sin
  esto no hay quién llene el onboarding — ver decisión D24.
- **Riesgo real, ya documentado:** el Componente 3 le habla al cliente de "sonda" /
  "capacidad automática", nunca del motor real (Wazuh) — cualquier copy o log que se
  filtre con el nombre real es un defecto de confidencialidad, no un detalle menor.
- **La pregunta 11 del Componente 1 no se construye.** El comité vetó "framework a
  nivel de empresa" — el framework se elige en el Componente 2, por servicio. No es un
  olvido si no aparece.

## Criterios de aceptación del sprint

1. Un `admin_empresa` nuevo completa los 3 componentes sin salir del flujo guiado.
2. Los 10 + 16 campos quedan persistidos exactamente como están tipados en
   `modulos/onboarding.md` (mismos tipos, mismas opciones de selección).
3. Al elegir marco en el Componente 2, el catálogo (requisitos, puntos de enfoque,
   controles) aparece clonado en el escenario del cliente sin acción manual.
4. Al menos una conexión del catálogo AC-01…AC-06 completa el flujo
   conectar → validar → activar → programar.
5. En ninguna pantalla, log o mensaje del Componente 3 aparece el nombre real del motor
   de monitoreo.

## Siguiente paso

Con esto aprobado por el PO, se abren las historias en Jira bajo un épico "Onboarding"
(las 3 tablas de arriba ya están casi 1:1 listas para convertirse en historias) y se
reparte entre Carlos y Héctor según el cronograma.
