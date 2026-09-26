# Alcance — Módulo de Onboarding (primer entregable del MVP)

**Para:** PO del proyecto
**De:** Héctor Ríos y Carlos
**Fecha:** 2026-09-21
**Duración:** 7 días hábiles (2026-09-28 → 2026-10-06). Fecha tope fijada por el negocio.
**Estado:** aprobado. Backlog abierto en Jira (proyecto `MD`, épicos MD-57 a MD-61).

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
| 2 — Contexto del Servicio   | Formulario de 16 campos por servicio (repetible), incluida la carga de la Descripción del Sistema                                                  | `services`, `service_trust_criteria`, `subservice_organizations`, `service_frameworks`, `system_descriptions` |
| 3 — Control Técnico        | Selección de escenario de despliegue + flujo de conexión de activos (conectar → validar → activar → programar) sobre el catálogo AC-01…AC-06 | `scopes`, `assets`, `automated_capabilities`                                                         |
| Clonado del catálogo        | Al elegir marco en el Componente 2, el catálogo del marco queda disponible en el escenario del cliente sin acción manual: los **controles se clonan** a `client_controls`, y los **requisitos y puntos de enfoque se referencian con FK** al catálogo maestro (son texto del estándar, no se particularizan — decisión D3)           | ver decisión D23                                                                                                |

## Fuera de alcance (explícitamente, para no desviar el sprint)

- **Módulo de Cumplimiento** (edición de riesgos, causas y controles ya clonados) — es
  un módulo aparte, no bloquea el onboarding, y se construye después. Decisión D23,
  **confirmada por el comité el 2026-09-26**: el onboarding se queda en 3 componentes.
- **Dashboard de 4 preguntas** y el cálculo de cumplimiento en sí — el onboarding
  entrega los datos que ese motor va a consumir, pero el motor no se construye en este
  sprint.
- **Conectores reales** (AWS, Azure, GitHub, etc.) — el Componente 3 entrega el flujo de
  conexión y su UI; la integración productiva con cada proveedor es trabajo de los
  épicos de Conectores e Integración Wazuh, no de este sprint.
- **RBAC completo / roles personalizados** — el onboarding asume que ya existe un
  usuario `admin_empresa` autenticado (fundación mínima de Auth), no reconstruye login
  ni gestión de usuarios.
- **MFA TOTP** (MD-94) — se separó de la auth mínima porque la configuración de TOTP no
  está contemplada todavía. MD-64 entrega login con JWT y refresh, sin segundo factor.
  **Es deuda conocida, no una decisión revertida:** el comité la exige como obligatoria
  para `admin_monkey`, `admin_empresa` y `auditor` (`modelo-datos.md` §5.3).
- **Envío de la clave por correo** (MD-69) — la integración de correo no está
  contemplada. En este sprint `admin_monkey` **copia la clave desde la UI de Monkey
  Admin** y la entrega por el canal que sea. El modelo no cambia: D24 sigue diciendo que
  el destino es el `admin_email`; lo que se aplaza es la automatización. Por eso MD-70
  tiene que mostrar la clave en claro al terminar el registro — es el único medio de
  obtenerla, y si no se ve ahí el cliente no puede entrar.

## Cronograma (7 días hábiles)

Un solo sprint, con el módulo de onboarding completo, hasta la fecha tope del 6 de octubre.

| Día | Fecha | Foco | Tickets |
|---|---|---|---|
| 1 | 2026-09-28 | Provisionar Postgres, contrato de API | MD-89, MD-66 |
| 2 | 2026-09-29 | Esquema + enums, retirar schema viejo, `companies`/`access_keys` | MD-62, MD-93, MD-67 |
| 3 | 2026-09-30 | RLS, auth mínima, seed del catálogo SOC 2, endpoint de registro | MD-63, MD-64, MD-65, MD-68 |
| 4 | 2026-10-01 | Monkey Admin (UI, con la clave a la vista), canje de clave, tablas del Componente 1 | MD-70…MD-73 |
| 5 | 2026-10-02 | Componente 1 completo, tablas y endpoints del servicio, índices | MD-74…MD-77, MD-90 |
| 6 | 2026-10-05 | Componente 2: formulario de 16 campos, clonado del catálogo, tablas del Componente 3 | MD-78…MD-83 |
| 7 | 2026-10-06 | Componente 3, confidencialidad, QA de punta a punta y demo | MD-84…MD-88, MD-91, MD-92 |

## Prioridad: el orden en que se cae lo que no entre

**El sprint son 117 story points en 30 historias entre dos personas.** Eso pide ~8 puntos
por persona y por día, cuando un ritmo sostenible son 2. (Dos historias salieron del
sprint —MD-69 y la MFA de MD-64, ahora MD-94— y viven en el backlog con etiqueta
`aplazado`.) Con la fecha fija, lo
único que se puede gobernar es **qué se protege y qué se suelta**, y para eso cada ticket
lleva prioridad en Jira:

| Prioridad | Qué es | Regla |
|---|---|---|
| **Highest** | La espina dorsal: base de datos, esquema, RLS, auth, seed del catálogo, registro del tenant, los formularios de los Componentes 1 y 2, el clonado | **No se suelta.** Sin esto no hay onboarding ni demo posible |
| **High** | Componente 3 completo, correo de la clave, UI de Monkey Admin, confidencialidad | Se recorta en alcance antes que en existencia (ej. un solo tipo de activo conectado) |
| **Medium** | Seeds de opciones, carga de la Descripción del Sistema, filtro por criterio, índices, append-only | Lo primero que se mueve al sprint siguiente |
| **Low** | Estrategia formal de migraciones | Se resuelve informalmente durante el sprint y se documenta después |

**Si el 6 de octubre hay que mostrar algo funcionando**, lo que tiene que estar en pie es
el recorrido de MD-88: registrar la empresa → canjear la clave → declarar la organización →
declarar un servicio con SOC 2 → ver el catálogo clonado. El Componente 3 puede llegar con
un solo activo conectado y sigue siendo una demo honesta.

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
   controles) queda disponible en el escenario del cliente sin acción manual: los controles
   clonados en `client_controls`, los requisitos y puntos de enfoque referenciados con FK.
4. Al menos una conexión del catálogo AC-01…AC-06 completa el flujo
   conectar → validar → activar → programar.
5. En ninguna pantalla, log o mensaje del Componente 3 aparece el nombre real del motor
   de monitoreo.

## Siguiente paso

Con esto aprobado por el PO, se abren las historias en Jira bajo un épico "Onboarding"
(las 3 tablas de arriba ya están casi 1:1 listas para convertirse en historias) y se
reparte entre Carlos y Héctor según el cronograma.
