# Onboarding — los 3 componentes que capturan el contexto del cliente

> **Desde D89 (2026-10-23) el onboarding es solo el Componente 1** (contexto de la empresa). Los Componentes 2 y 3 siguen siendo lo que son —qué se captura de un servicio y cómo se conectan sus activos—, pero **ya no son pasos del onboarding**: el cliente declara servicios cuando quiera (desde «Mis servicios» o desde Cumplimiento) y, **antes de declarar los activos de un servicio, evalúa sus riesgos** (probabilidad e impacto cambian de un servicio a otro). Orden por servicio: declarar el servicio (se clona el catálogo) → evaluar sus riesgos → declarar sus activos.

El onboarding es donde entran los datos que alimentan todo el modelo. Está compuesto por
**3 componentes** (no confundir con los componentes técnicos de `skills/backend/` o
`skills/frontend/`): cada uno es un bloque de preguntas al cliente, y cada respuesta se
mapea a una entidad concreta de `modelo-datos.md`.

Especificado por el comité en `assets/TSC INTERGRAL SOC 2 DETALLADO VF2.xlsx`, hojas
*Contexto Empresa*, *Contexto del servicio* y *Activos del Servicio (SCOPE)*. Esas hojas
son la fuente exacta de cada pregunta, su tipo (texto / selección / multi-select) y sus
opciones — este archivo resume el mapeo a entidades, no repite el detalle campo por campo.

## Componente 1 — Contexto Organizacional

Va a `organizations` (`modelo-datos.md` §6.1). Diez preguntas, todas obligatorias salvo
"años en operación":

Los nombres de columna son los reales del modelo, en inglés (`modelo-datos.md` §6.1). La
forma exacta del request y del response está en `contracts/modules/onboarding-organizational-context.md`.

| Campo | Tipo | Atributo en `organizations` |
|---|---|---|
| Nombre / razón social | Texto — **precargado y bloqueado**, ya se fijó al registrar el tenant en Monkey Admin | `name` |
| Descripción breve del negocio | Texto | `description` |
| Tamaño (número de empleados) | Selección | `size` |
| Sector / industria | Selección | `industry` |
| Modelo de negocio | Selección | `business_model` |
| Años en operación | Selección — opcional | `years_in_operation` |
| País(es) de constitución | Multi-select | `incorporation_countries` (json) |
| País(es) donde tiene clientes | Multi-select | `client_countries` (json) |
| Madurez de compliance | Selección | `compliance_maturity` |
| Regulaciones aplicables a la empresa | Multi-select | `N:M` → `regulations`, vía `organization_regulations` |

> **Una pregunta se vetó a propósito: "framework que desea gestionar" a nivel de
> empresa.** El formulario original de este componente la incluía; el comité la retiró
> porque **los marcos se contratan por servicio, no por organización** — es la misma
> regla ya cerrada en el modelo (`service_frameworks`, `service_trust_criteria`), y este veto es la
> confirmación funcional de esa regla, no una decisión nueva. La selección de framework
> vive en el Componente 2.

## Componente 2 — Contexto del Servicio

Va a `services` y a las entidades que cuelgan de él. Quince preguntas (dieciséis en el Excel, menos la de regulaciones
por servicio, que el comité retiró, D51), una columna por servicio (un cliente puede declarar varios). El nombre del
proveedor de subservicios ya no se pregunta: el tipo (AWS, Azure…) lo dice:

Nombres reales del modelo, en inglés (`modelo-datos.md` §6.2). La forma exacta del request y
del response está en `contracts/modules/onboarding-service-context.md`; las listas de opciones
literales, en `contracts/enums.md`.

| Campo | Tipo | Entidad / atributo |
|---|---|---|
| Nombre del servicio | Texto | `services.name` |
| Descripción breve | Texto | `services.description` |
| Declaración de alcance del servicio | Texto | `services.scope_statement` |
| Tipo de servicio | Selección | `services.type` |
| Industrias / sectores que atiende | Multi-select | `services.industries_served` (json) |
| Cantidad de clientes activos | Selección — opcional | `services.active_client_count` |
| Países/regiones donde están los clientes | Multi-select | `services.countries` (json) |
| Tipos de datos que maneja de sus clientes | Multi-select | `services.data_types` (json) |
| Criterios de confianza SOC aplicables | Multi-select — Seguridad siempre incluida | `N:M` → `trust_criteria`, vía `service_trust_criteria` |
| Organizaciones de subservicios (nube/infra) | Multi-select | `1:N` → `subservice_organizations` |
| Detalle de subservicios (proveedor, servicio, responsabilidad) | Texto — opcional | `subservice_organizations.responsibility` |
| Framework que desea gestionar | Multi-select — se muestran todos los que Monkey ofrece, solo se eligen los contratados (D50) | `N:M` → `frameworks`, vía `service_frameworks` |
| ¿Ya tiene alguna certificación o evaluación? | Selección — opcional | `services.previous_certification` |
| Disponibilidad esperada | Selección | `services.expected_availability` |
| Descripción del Sistema | Enlace, archivo o los dos (al menos uno) | `1:1` → `system_descriptions.link_url` / `file_key` |

> ✅ **Cerrado por el comité el 2026-10-05 (D51):** (1) la regulación **no se declara por servicio**: aplica a la empresa y
> vive en el Componente 1 (la fila «Regulaciones que debe cumplir el servicio» del Excel se retiró; no existe
> `service_regulations`); (2) la Descripción del Sistema se entrega con un enlace, un archivo o los dos, y el
> endpoint del archivo es `multipart/form-data` (`contracts/modules/onboarding-service-context.md`).

**La Descripción del Sistema es un entregable, no un campo de texto.** El cliente sube un
documento con las 10 secciones de los *Description Criteria* de AICPA (tipos de servicio,
componentes del sistema, límites del alcance, compromisos, criterios de confianza
aplicables, controles relevantes, subservicios y CSOCs, CUECs, cambios significativos,
incidentes del periodo). Es la misma entidad `system_descriptions` de `modelo-datos.md`
§6.2, y sus secciones 7 y 8 son de donde salen `csocs` y `cuecs`.

## Componente 3 — Control Técnico

Aquí el cliente conecta sus activos. Es la capa técnica completa de `modelo-datos.md`
§6.3 y §8 (`automated_capabilities`, `asset_provisionings`, el catálogo de conexiones
AC-01…AC-06) y
la regla de confidencialidad de `wazuh.md` y `prowler.md`: **el cliente solo interactúa con Monkey y
nunca sabe qué motores miden (Wazuh en servidores, Prowler en la nube).** No se repite el detalle aquí — ver esos
dos archivos para el catálogo de conexiones, los escenarios de despliegue y la matriz de
cobertura por dominio de monitoreo.

Lo que aporta este componente al onboarding, específicamente:

- **El cliente no declara dónde vive su servicio** (D92): no hay escenario de despliegue. Se le ofrecen las seis conexiones del catálogo AC-01…AC-06 y la
  plataforma que elige ya lo dice. *(El bloque 2A del Excel del comité sí define los escenarios: D92 se aparta de él y queda por ratificar.)*
- **El cliente elige una plataforma** (AWS, un sistema operativo, un motor de base de datos…), no una categoría técnica; cada una lleva a su paso a paso y las que aún no tienen flujo se
  muestran bloqueadas (D67). El catálogo de plataformas y las reglas de las conexiones viven en la base de datos.
- Por cada conexión, el flujo es el de aprovisionamiento ya modelado: conectar → validar
  → activar → programar (`modelo-datos.md` §6.3 y §8).
- El resultado de este componente es lo que llena `assets` (lo que Monkey encontró al conectar) del servicio que se está
  configurando. **No hay «cuántos tienes» declarado** (D60).
- **La conexión de la nube (AWS) es parte de este componente**, no un módulo aparte (D58): el cliente elige canal (rol de solo
  lectura o llaves), Monkey le entrega lo que debe hacer y valida la conexión. Diagramas: `control-tecnico/flujo-conexion-nube.md`;
  contrato: `contracts/modules/onboarding-technical-control.md`. Lo que ocurre *después* de conectar (ejecuciones, estado de preparación,
  hallazgos) es el módulo de operación continua (`modelo-datos.md` §8; contrato `control-tecnico-operacion.md`).

## Cumplimiento no es un 4º componente

> ✅ Decisión D23, **confirmada por el comité el 2026-09-26**. El onboarding se queda en 3
> componentes.

Riesgos, causas y controles **no se configuran a mano durante el onboarding**. Al elegir
framework en el Componente 2, el catálogo correspondiente se clona automáticamente al
escenario del cliente (`modelo-datos.md` §3.5; los riesgos y causas se copian a `client_risks` y `client_causes`) — el cumplimiento ya empieza a medirse con
ese set por defecto. Editar esa interpretación, excluir un check o reasignar
responsables es un módulo aparte ("Cumplimiento"), disponible sin límite de tiempo y sin
bloquear el resto del producto (crear usuarios, conectar activos, etc.). Ver decisión
D23 en `modelo-datos-decisiones.md`.

## Relación con el código y con la filosofía de producto

**En `Frontend-Platform`** los tres componentes ya existen como features: `onboarding` (Componente 1),
`services` (Componente 2) y `technical-control` (Componente 3), cada uno con su contrato en
`contracts/modules/`. El paso 3 del Componente 3 es provisional (D48; ver `deuda-tecnica/`). Mapa en `context/frontend.md`.

**Los "10 pasos como configurar un iPhone" de `philosophy.md`** son la envoltura
conversacional con la que la IA presenta estas preguntas — no un componente distinto ni
una lista de campos alternativa. Los 3 componentes son *qué* se captura; los 10 pasos son
*cómo* se presenta.
