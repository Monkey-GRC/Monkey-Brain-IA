# Propuesta de Jira — MVP de Monkey

**Para:** PO del proyecto
**De:** Héctor Ríos
**Fecha:** 2026-09-21
**Estado:** propuesta, pendiente de aprobación antes de crear los épicos en Jira

## Contexto

El proyecto Jira **MD (Monkey-Dev)** ya tiene cerradas las 56 tareas del **modelo de
datos** (épico "Modelo de datos — alcance nuevo de Monkey" y sus historias/subtareas
MD-1 a MD-56, todas en estado *Listo*). Ese trabajo fue de **decisión**, no de
**construcción**: dice qué entidades hay y cómo se relacionan, pero no hay todavía
ningún épico de desarrollo abierto.

Esta propuesta traduce lo ya decidido — el modelo relacional, el roadmap de MVP y los
tres módulos de onboarding ya documentados — en los épicos con los que se puede
empezar a construir.

**Fuente de cada épico:** `mvp-roadmap.md` (columna MUST), `modelo-datos.md`,
`modulos/onboarding.md`, `philosophy.md` y `wazuh.md`, todos en
`skills/product/monkey-compliance-council/references/`. Si algo de esta propuesta
contradice esos archivos, ganan ellos — este documento es un ordenamiento del trabajo,
no una fuente nueva de decisiones.

## Épicos — Fase 0 (MVP, horizonte 0-4 meses)

Listados en orden de dependencia: cada uno necesita el anterior construido primero.

### 1. Fundación RBAC & Auth
`companies`, `users`, roles (`admin_monkey`, `admin_empresa`, `funcional`, `auditor` +
roles personalizados), sesiones, MFA obligatoria para roles no-`funcional`, aislamiento
por tenant (dedicado o RLS, elegido por el cliente).
**Fuente:** `modelo-datos.md` §5 y `RESUMEN-MODELO-USUARIOS-MONKEY.md`. (`Usuarios.md` y
`Auth.md` de la bóveda no están en este repo.)

### 2. Onboarding — Contexto Organizacional
Componente 1 del onboarding: 10 campos que capturan identidad, perfil y jurisdicción de
la empresa → entidad `organizations`.
**Fuente:** `modulos/onboarding.md`, Componente 1.

### 3. Onboarding — Contexto del Servicio
Componente 2: 16 campos por servicio (un cliente puede declarar varios), incluida la
Descripción del Sistema (documento AICPA de 10 secciones) → entidad `services` y las
que cuelgan de ella (`trust_criteria`, `subservice_organizations`, `service_frameworks`,
`system_descriptions`).
**Fuente:** `modulos/onboarding.md`, Componente 2.

### 4. Onboarding — Control Técnico
Componente 3: el cliente conecta su infraestructura real. Escenario de despliegue,
catálogo de conexiones AC-01…AC-06, flujo de aprovisionamiento (conectar → validar →
activar → programar). El cliente nunca ve el nombre del motor de monitoreo detrás.
**Fuente:** `modulos/onboarding.md`, Componente 3; `wazuh.md`.

### 5. Catálogo maestro y clonado a escenario del cliente
Marcos, Requisitos, Puntos de Enfoque y Control atómico (independiente del marco, se
vincula a Requisitos vía Puntos de Enfoque). Al elegir marco en el Componente 2, el
catálogo correspondiente se clona automáticamente al escenario del cliente — sin pasos
manuales.
**Fuente:** `modelo-datos.md` §3; decisión D23 (`modelo-datos-decisiones.md`).

### 6. Motor de cumplimiento (cálculo)
Las reglas ya cerradas con el comité: cumplimiento derivado por par Servicio × Marco
(nunca un % de empresa completa), recorrido requisitos → controles, nunca almacenado
como atributo del marco.
**Fuente:** `modelo-datos.md` §9 (las 12 reglas), MD-56 (reescritura de
`compliance.calculator.ts` pendiente).

### 7. Motor de evidencias
Cadena de custodia completa: origen, fecha, responsable, versión, integridad.
**Fuente:** `modelo-datos.md` §7.3.

### 8. Motor de riesgos básico ("Cumplimiento")
Registro de riesgo y causa, scoring cualitativo, tratamiento con dueño. Módulo aparte,
**no bloquea** el resto del producto — el cliente puede crear usuarios y conectar
activos sin haber tocado este módulo.
**Fuente:** decisión D23. **Pendiente de confirmación del comité** antes de construir
(ver nota abajo).

### 9. Dashboard de 4 preguntas + modo guiado + vista auditor
Vista por defecto: cualitativa, sin jerga técnica, sin % desnudo como métrica
principal. Vista técnica/matriz ("modo auditor") existe pero es secundaria.
**Fuente:** `philosophy.md`.

### 10. Integración Wazuh (sonda)
Evaluación de Wazuh como base del agente on-prem/híbrido. Confidencialidad total frente
al cliente: nunca se nombra el proveedor, en ninguna pantalla, notificación o texto
generado por IA.
**Fuente:** `wazuh.md`.

### 11. Conectores cloud/SaaS/IdP (12-15)
AWS o Azure, GitHub, Google Workspace o M365, Okta o Entra ID, Slack.
**Fuente:** `mvp-roadmap.md`, columna MUST.

### 12. Auditoría
Rol `auditor`, `auditor_assignments` (qué empresas puede auditar cada auditor externo),
registro de hallazgos.
**Fuente:** `RESUMEN-MODELO-USUARIOS-MONKEY.md` (`Usuarios.md` de la bóveda no está en este repo).

## Nota sobre el épico 8

El módulo de riesgos/Cumplimiento está redactado según la dirección que Héctor propuso
el 2026-09-20 (separarlo del onboarding, sin gating) — **todavía en debate con el
comité** al momento de este documento. Si el comité pide otra cosa, este épico se ajusta
antes de abrir sus historias; los épicos 1-7 y 9-12 no dependen de esa respuesta y se
pueden empezar a desglosar ya.

## Siguiente paso

Con esta lista aprobada por el PO, se crean los 12 épicos en el proyecto Jira **MD**
(o en un proyecto de desarrollo aparte, si se prefiere separar decisiones de
construcción) y se desglosan en historias — los épicos 2, 3, 4 y 8 ya tienen el detalle
de campos necesario para convertirse en historias casi uno a uno.
