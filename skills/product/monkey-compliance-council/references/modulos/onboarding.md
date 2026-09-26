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

| Campo | Tipo | Atributo en `organizations` |
|---|---|---|
| Nombre / razón social | Texto — **precargado y bloqueado**, ya se fijó al registrar el tenant en Monkey Admin | `nombre` |
| Descripción breve del negocio | Texto | `descripción` |
| Tamaño (número de empleados) | Selección | `tamaño` |
| Sector / industria | Selección | `industria` |
| Modelo de negocio | Selección (40+ opciones) | `modelo_negocio` |
| Años en operación | Selección — opcional | `años` |
| País(es) de constitución | Multi-select | `países_constitución` |
| País(es) donde tiene clientes | Multi-select | `países_clientes` |
| Madurez de compliance | Selección | `madurez_compliance` |
| Regulaciones aplicables a la empresa | Multi-select | `N:M` → `regulations` |

> **Una pregunta se vetó a propósito: "framework que desea gestionar" a nivel de
> empresa.** El formulario original de este componente la incluía; el comité la retiró
> porque **los marcos se contratan por servicio, no por organización** — es la misma
> regla ya cerrada en el modelo (`service_frameworks`, `trust_criteria`), y este veto es la
> confirmación funcional de esa regla, no una decisión nueva. La selección de framework
> vive en el Componente 2.

## Componente 2 — Contexto del Servicio

Va a `services` y a las entidades que cuelgan de él. Dieciséis preguntas, una columna por
servicio (un cliente puede declarar varios):

| Campo | Tipo | Entidad / atributo |
|---|---|---|
| Nombre del servicio | Texto | `services.nombre` |
| Descripción breve | Texto | `Servicio.descripción` |
| Declaración de alcance del servicio | Texto | `Servicio.declaración_de_alcance` |
| Tipo de servicio | Selección | `services.tipo` |
| Industrias / sectores que atiende | Multi-select | `services.industrias_que_atiende` |
| Cantidad de clientes activos | Selección — opcional | `services.clientes_activos` |
| Países/regiones donde están los clientes | Multi-select | `Servicio.países` |
| Tipos de datos que maneja de sus clientes | Multi-select (PII, pago, PHI…) | `services.tipos_de_datos` |
| Criterios de confianza SOC aplicables | Multi-select — Seguridad siempre incluida | `N:1` → `trust_criteria` |
| Organizaciones de subservicios (nube/infra) | Multi-select (AWS, Azure, GCP, on-premise, híbrida) | `N:1` → `subservice_organizations` |
| Detalle de subservicios (proveedor, servicio, responsabilidad) | Texto — opcional | `subservice_organizations.responsabilidad` |
| Framework que desea gestionar | Multi-select (solo lo contratado) | `N:1` → `service_frameworks` |
| Regulaciones que debe cumplir el servicio | Multi-select | `N:M` → `regulations` |
| ¿Ya tiene alguna certificación? | Selección — opcional | Contexto, no persiste en una entidad propia |
| Disponibilidad esperada | Selección (24/7, horario de negocio, por demanda) | `services.disponibilidad_esperada` |
| Descripción del Sistema (archivo) | Adjunto | `1:1` → `system_descriptions` |

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
