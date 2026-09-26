# Onboarding — los 3 componentes que capturan el contexto del cliente

El onboarding es donde entran los datos que alimentan todo el modelo. Está compuesto por
**3 componentes** (no confundir con los componentes técnicos de `skills/backend/` o
`skills/frontend/`): cada uno es un bloque de preguntas al cliente, y cada respuesta se
mapea a una entidad concreta de `modelo-datos.md`.

Especificado por el comité en `assets/TSC INTERGRAL SOC 2 DETALLADO VF.xlsx`, hojas
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

Va a `services` y a las entidades que cuelgan de él. Dieciséis preguntas, una columna por
servicio (un cliente puede declarar varios):

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
| Framework que desea gestionar | Multi-select (solo lo contratado) | `N:M` → `frameworks`, vía `service_frameworks` |
| Regulaciones que debe cumplir el servicio | Multi-select | ⚠️ **sin tabla puente en el modelo** — ver nota |
| ¿Ya tiene alguna certificación? | Selección — opcional | `services.previous_certification` |
| Disponibilidad esperada | Selección | `services.expected_availability` |
| Descripción del Sistema | Enlace o archivo | `1:1` → `system_descriptions.file_path` |

> ⚠️ **Dos huecos de este componente, pendientes de cerrar antes de construirlo:**
> 1. La regulación **a nivel de servicio** no tiene tabla puente: el modelo solo define
>    `organization_regulations` (§6.1). Falta decidir si se añade `service_regulations` o si
>    la regulación se declara solo a nivel de empresa.
> 2. La Descripción del Sistema: el XLSX del comité pide "enlace o ruta" y
>    `system_descriptions.file_path` es un `string`, pero este documento decía "adjunto".
>    Define si el endpoint es `multipart/form-data` o JSON con URL.

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
la regla de confidencialidad de `wazuh.md`: **el cliente solo interactúa con Monkey y
nunca sabe que el motor de monitoreo es Wazuh.** No se repite el detalle aquí — ver esos
dos archivos para el catálogo de conexiones, los escenarios de despliegue y la matriz de
cobertura por dominio de monitoreo.

Lo que aporta este componente al onboarding, específicamente:

- El cliente elige su **escenario de despliegue** (solo nube / nube con servidores /
  on-premise / híbrido), que determina qué conexiones del catálogo AC-01…AC-06 se le
  ofrecen.
- Por cada conexión, el flujo es el de aprovisionamiento ya modelado: conectar → validar
  → activar → programar (`modelo-datos.md` §6.3 y §8).
- El resultado de este componente es lo que llena `scopes` (declarado) e `assets`
  (descubierto) del servicio que se está configurando.

## Cumplimiento no es un 4º componente

> ✅ Decisión D23, **confirmada por el comité el 2026-09-26**. El onboarding se queda en 3
> componentes.

Riesgos, causas y controles **no se configuran a mano durante el onboarding**. Al elegir
framework en el Componente 2, el catálogo correspondiente se clona automáticamente al
escenario del cliente (`modelo-datos.md` §3.5) — el cumplimiento ya empieza a medirse con
ese set por defecto. Editar esa interpretación, excluir un check o reasignar
responsables es un módulo aparte ("Cumplimiento"), disponible sin límite de tiempo y sin
bloquear el resto del producto (crear usuarios, conectar activos, etc.). Ver decisión
D23 en `modelo-datos-decisiones.md`.

## Relación con el código y con la filosofía de producto

**El feature `onboarding` de `Frontend-Platform`** tiene hoy los pasos `account-setup`,
`characterization`, `company-profile`, `template-selection` (`context/project-context.md`).
No hay todavía una correspondencia 1:1 documentada entre esos pasos y los 3 componentes
del comité — es trabajo pendiente de mapear antes de tocar esas pantallas.

**Los "10 pasos como configurar un iPhone" de `philosophy.md`** son la envoltura
conversacional con la que la IA presenta estas preguntas — no un componente distinto ni
una lista de campos alternativa. Los 3 componentes son *qué* se captura; los 10 pasos son
*cómo* se presenta.
