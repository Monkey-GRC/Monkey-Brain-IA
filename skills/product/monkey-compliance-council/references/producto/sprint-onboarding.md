---
id: sprint-onboarding
name: Sprint de Onboarding — alcance aprobado
description: Alcance aprobado del primer entregable del MVP: qué entra, qué queda fuera, cronograma, prioridades y criterios de aceptación.
type: reference
---

# Sprint de Onboarding — alcance aprobado

**Primer entregable del MVP.** Aprobado por el PO el 2026-09-21. Duración: **7 días hábiles**,
del 2026-09-28 al 2026-10-06; la fecha tope la fija el negocio. Backlog abierto en Jira,
proyecto `MD`, épicos MD-57 a MD-61.

**Objetivo:** un cliente nuevo tiene que poder registrar su empresa, declarar al menos un
servicio y conectar al menos un activo, y ver su catálogo de cumplimiento listo para empezar a
medirse.

**Fuente de cada componente:** `modulos/onboarding.md`, que transcribe
`assets/TSC INTERGRAL SOC 2 DETALLADO VF2.xlsx` (hojas *Contexto Empresa*, *Contexto del
servicio*, *Activos del Servicio (SCOPE)*). Si algo de aquí contradice esas fuentes, ganan
ellas. La forma exacta de cada endpoint está en `contracts/modules/`.

## Dentro de alcance

| Componente | Qué se construye | Entidades |
|---|---|---|
| 1 — Contexto Organizacional | Formulario de 10 campos, una vez por empresa | `organizations` |
| 2 — Contexto del Servicio | Formulario de 16 campos por servicio (repetible), incluida la carga de la Descripción del Sistema | `services`, `service_trust_criteria`, `subservice_organizations`, `service_frameworks`, `system_descriptions` |
| 3 — Control Técnico | Flujo de conexión de activos (conectar → validar → activar → programar) sobre el catálogo `ac_01`…`ac_06` | `assets`, `automated_capabilities`, `asset_provisionings` |
| Clonado del catálogo | Al elegir marco en el Componente 2 el catálogo queda disponible sin acción manual: los **controles se clonan** a `client_controls` (con sus dimensiones, el vínculo a sus tests y las evidencias requeridas), y los **requisitos, puntos de enfoque y tests se referencian con FK** (son texto del estándar, decisión D3) | — |

## Fuera de alcance, explícitamente

- **Módulo de Cumplimiento** (editar riesgos, causas y controles ya clonados) — módulo aparte,
  no bloquea el onboarding. Decisión D23, confirmada por el comité el 2026-09-26.
- **Dashboard de 4 preguntas** y el cálculo de cumplimiento — el onboarding entrega los datos
  que ese motor consumirá, pero el motor no se construye aquí.
- **RBAC completo** — el onboarding asume que ya existe un
  `admin_empresa` autenticado.
- **MFA TOTP** (MD-94) — MD-64 entrega login con JWT y refresh, sin segundo factor. **Es deuda
  conocida, no una decisión revertida**: la exige para los 5 roles
  (`modelo-datos.md` §5.3, D66).
- **Envío de la clave de acceso por correo** (MD-69) — `admin_monkey` **copia la clave desde la
  UI de Monkey Admin**. El modelo no cambia: D24 sigue diciendo que el destino es el
  `admin_email`; lo que se aplaza es la automatización. Por eso el registro debe **mostrar la
  clave en claro una sola vez** — si no se ve ahí, el cliente no puede entrar.
- **Conectores productivos reales** — se entrega el flujo de conexión y su UI, no la
  integración en producción.

## Cronograma

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

**El sprint son 117 story points en 30 historias entre dos personas.** Eso pide ~8 puntos por
persona y por día, cuando un ritmo sostenible son 2. Con la fecha fija, lo único gobernable es
qué se protege y qué se suelta:

| Prioridad | Qué es | Regla |
|---|---|---|
| **Highest** | La espina dorsal: base de datos, esquema, RLS, auth, seed del catálogo, registro del tenant, los formularios de los Componentes 1 y 2, el clonado | **No se suelta.** Sin esto no hay onboarding ni demo |
| **High** | Componente 3 completo, UI de Monkey Admin, confidencialidad | Se recorta en alcance antes que en existencia (p. ej. un solo tipo de activo conectado) |
| **Medium** | Seeds de opciones, carga de la Descripción del Sistema, filtro por criterio, índices, append-only | Lo primero que se mueve al sprint siguiente |
| **Low** | Estrategia formal de migraciones | Se resuelve informalmente y se documenta después |

**Si el 6 de octubre hay que mostrar algo funcionando**, lo que tiene que estar en pie es el
recorrido de MD-88: registrar la empresa → canjear la clave → declarar la organización →
declarar un servicio con SOC 2 → ver el catálogo clonado. El Componente 3 puede llegar con un
solo activo conectado y sigue siendo una demo honesta.

## Dependencias y riesgos

- **Bloquea si no está listo antes del día 1:** el flujo de aprovisionamiento (Monkey Admin
  crea la empresa, fija `isolation_strategy`, genera la clave) y la pantalla donde el cliente
  usa esa clave para crear su cuenta `admin_empresa`. Sin eso no hay quién llene el onboarding
  — decisión D24.
- **Riesgo de confidencialidad:** el Componente 3 le habla al cliente de "sonda" o "capacidad
  automática", nunca del motor real. Cualquier copy o log que se filtre con el nombre del
  proveedor es un defecto, no un detalle.
- **La pregunta 11 del Componente 1 no se construye.** El comité vetó "framework a nivel de
  empresa": se elige en el Componente 2, por servicio. No es un olvido si no aparece.
- **Cinco preguntas del flujo de la clave siguen abiertas** (P2 en
  `modelo-datos-pendientes.md`), y dos de ellas condicionan la pantalla del día 1-2.

## Criterios de aceptación

1. Un `admin_empresa` nuevo completa los 3 componentes sin salir del flujo guiado.
2. Los 10 + 16 campos quedan persistidos exactamente con los tipos y opciones de
   `modulos/onboarding.md` y `contracts/enums.md`.
3. Al elegir marco en el Componente 2, el catálogo queda disponible en el escenario del cliente
   sin acción manual: controles clonados en `client_controls`, requisitos, puntos de enfoque y tests
   referenciados con FK.
4. Al menos una conexión de `ac_01`…`ac_06` completa el flujo conectar → validar → activar →
   programar.
5. **En ninguna pantalla, log o mensaje del Componente 3 aparece el nombre del proveedor del
   motor de monitoreo.**
