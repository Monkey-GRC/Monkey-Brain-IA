---
id: contracts
name: Contratos de API
description: Forma exacta de cada endpoint (request, response y errores), acordada entre backend y frontend antes de construir.
type: contract
---

# Contratos de API

**Qué es:** la forma exacta de cada endpoint —request, response y errores— acordada antes de
escribir código, para que backend y frontend no se esperen mutuamente ni rehagan formularios
por un cambio de payload.

**Obligatorio:** antes de construir un endpoint o un formulario, lee el archivo del módulo que
te toca. Si lo que vas a construir no está aquí, el contrato se acuerda primero.

## Estructura

| Archivo | Qué trae |
|---|---|
| `conventions.md` | Lo transversal: sobre de respuesta, forma del error, i18n, multi-select, fechas, paginación |
| `enums.md` | Tabla única `valor` ↔ etiqueta es ↔ etiqueta en, para todos los enums del onboarding |
| `modules/monkey-admin.md` | Registro del tenant y clave de acceso (`companies`, `access_keys`) |
| `modules/auth.md` | Canje de la clave, login, refresh |
| `modules/onboarding-organizational-context.md` | Componente 1 — 10 campos |
| `modules/onboarding-service-context.md` | Componente 2 — 16 campos, repetible por servicio |
| `modules/onboarding-technical-control.md` | Componente 3 del onboarding — escenario, scope, conexión de activos (rol, llaves, agente), validación, activación |
| `modules/compliance-controls.md` | Cumplimiento: acciones de protección (listar, ver, crear un control propio, proponer cambios y que el consultor decida) |
| `modules/compliance-risks.md` | Cumplimiento: riesgos y causas, vínculos, evaluación 5×5 y tratamiento |
| `modules/compliance-evidence.md` | Cumplimiento: evidencias (subir con huella y versión, descargar con enlace firmado, aprobar o rechazar) |
| `modules/compliance-responsibles.md` | Cumplimiento: los cargos responsables de la organización |
| `modules/compliance-overview.md` | Cumplimiento: el resumen del servicio por marco y categoría, y las evaluaciones del consultor y del auditor |
| `modules/compliance-audit.md` | Cumplimiento: tests y veredictos, observaciones del auditor y del consultor, y exclusiones |
| `modules/control-tecnico-operacion.md` | Módulo de operación continua (§8): ejecuciones, estado de preparación, hallazgos, vista técnica del auditor y API interna del trabajador. Empieza donde acaba el Componente 3 |

## Formato de cada módulo

Propósito en una línea → entidades de `modelo-datos.md` que toca → tabla de campos → **JSON
real** de request y response por endpoint → tabla de errores → preguntas abiertas.

El contrato dice **qué**, no **por qué**. El porqué de una decisión vive en
`skills/product/monkey-compliance-council/references/datos/modelo-datos-decisiones.md`.

## Quién manda si hay conflicto

1. `assets/TSC INTERGRAL SOC 2 DETALLADO VF2.xlsx` — la fuente del comité. Trae `clave_json`,
   `tipo`, `opciones (pipe)` y un `fragmento_json` por campo. De ahí salen las **listas de
   opciones** y la semántica de cada campo.
2. `references/datos/modelo-datos.md` §4-§9 — de ahí salen los **nombres de campo y de entidad**, en
   inglés. Las `clave_json` del Excel están en español y no viajan por el cable.
3. Este directorio — la forma HTTP concreta.

Si el Excel y el modelo discrepan en las **opciones** de un enum, gana el Excel y se corrige el
modelo. Si discrepan en el **nombre** de un campo, gana el modelo.

## Versionado

Un cambio que rompe un contrato ya publicado se anuncia en el módulo afectado con la fecha y
qué cambió, y el tech-lead avisa al otro lado antes de mergear. Añadir un campo opcional no
rompe; quitar un campo, renombrarlo, cambiar su tipo o quitar un valor de enum, sí.

## Confidencialidad

Ningún campo, valor de enum, mensaje de error o ejemplo de este directorio nombra al proveedor
del motor de monitoreo. En la API se habla de `automated_capability`, "sonda" o "evaluación
automática". `automated_capabilities.provider` existe en el modelo pero **nunca sale en un
response al cliente**.
