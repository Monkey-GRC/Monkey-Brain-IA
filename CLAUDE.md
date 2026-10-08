# Monkey — instrucciones obligatorias para Claude

Este repo (`Monkey-Brain-IA`) es el cerebro de producto de Monkey. Antes de tomar
CUALQUIER decisión de arquitectura, UX, modelo de datos o priorización — en este
repo o en cualquiera de los repos hermanos (`Backend`, `Frontend`,
`Frontend-Platform`, `monkey-cis-sync`) — hay que consultar lo que ya está
decidido aquí. No repetir de memoria un resumen de conversación anterior: los
archivos pueden haber cambiado.

## Regla no negociable

**Antes de construir o rediseñar cualquier pantalla, endpoint o flujo, invoca la
skill `monkey-compliance-council` (o lee directamente los archivos de
`skills/product/monkey-compliance-council/references/`) y sigue su método de
enrutar la pregunta al archivo correcto** (ver `SKILL.md` de esa skill, sección
"Cómo operar"). En particular:

- `modelo-datos.md` — el modelo relacional del dominio, **ordenado por módulos**
  (catálogo maestro, Monkey Admin, Usuarios, Onboarding ×3, Cumplimiento, Control
  Técnico): entidades con sus PK/FK, relaciones y
  cardinalidades, las 5 dimensiones, tests, evidencias, exclusiones y cómo se
  calcula el cumplimiento. Es la referencia obligada antes de tocar el schema o
  cualquier cálculo de cumplimiento. Dos reglas estructurales que no se violan:
  - El **Control es atómico e independiente del marco**: se vincula a Requisitos,
    y son los Requisitos los que pertenecen a un marco. Nunca colgar un control
    (ni sus tests, evidencias o medición) de un framework concreto.
  - El cumplimiento de un marco **se deriva** recorriendo requisitos → controles.
    Nunca se almacena como atributo del marco.
- `philosophy.md` — cómo debe hablarle Monkey a un usuario final. Contiene reglas
  ya violadas una vez en este proyecto por apurar una UI sin leerlas primero:
  - **Nunca un % desnudo como métrica principal** — el readiness es cualitativo
    (Preparado / Casi listo / Requiere trabajo), el % es secundario.
  - **Nunca jerga técnica en la superficie** ("controles", "CC6.1", "matrices",
    "riesgo residual") — la vista técnica/detallada existe, pero es secundaria
    ("modo auditor"), nunca la vista por defecto.
  - La IA nunca certifica cumplimiento, nunca presenta inferencia como hecho
    verificado sin mostrar evidencia, siempre etiqueta lo que ella generó.
  - Plantilla de 7 campos para explicarle un hallazgo a un usuario final.
- `architecture.md` — los 4 motores, la estructura del modelo y el stack de
  referencia.
- `mvp-roadmap.md` — qué es MUST/SHOULD/LATER/NO BUILD ya decidido.
- `cumplimiento/frameworks/*.md` — qué exige cada framework (SOC 2, ISO 27001, PCI DSS, etc.),
  con fuente y fecha verificada. No inventar citas ni cifras de un framework.
- `references/README.md` (en `skills/product/monkey-compliance-council/`) — el **mapa por carpetas**: `producto/`,
  `arquitectura/`, `datos/`, `seguridad/`, `cumplimiento/`, `control-tecnico/`, `modulos/` y `deuda-tecnica/`. Los
  nombres de archivo de abajo viven dentro de esas carpetas.
- `council.md` — cómo se resuelven desacuerdos de diseño entre los roles del panel.
- `modelo-datos-pendientes.md` — las preguntas que **todavía no están cerradas** y que
  solo el comité puede responder (la lista vive en ese archivo). Antes de construir algo que dependa de una,
  consúltala: si sigue ahí, no la resuelvas por tu cuenta — pregunta.
- `deuda-tecnica/README.md` — lo que está **parchado o construido a medias** por desarrollo (la sonda simulada, la
  Descripción del Sistema sin procesar, el recorrido de navegador fuera del repo…), con su riesgo y qué lo cierra. No son
  preguntas del comité (esas van en `modelo-datos-pendientes.md`) ni decisiones cerradas (esas, en
  `modelo-datos-decisiones.md`). Si construyes algo con un atajo, **regístralo ahí**; si cierras uno, bórralo.
- `seguridad/requisitos.md` — los **requisitos de seguridad** (`SEG-n`) con su fuente, su estado real y la
  prueba automática que los verifica. Todo endpoint, tabla o flujo nuevo se revisa contra esa lista
  antes de darse por terminado; si introduce un requisito nuevo, se añade una fila en el mismo PR.
- `schema-implementacion.md` — el **cómo** en el Backend: Prisma 7, RLS, roles, variables de
  entorno, migraciones y despliegue. Léelo antes de tocar el schema, una migración o el `.env`.
- `modelo-datos-decisiones.md` — el **por qué** de cada decisión ya cerrada, con su
  fuente. Se consulta si alguien quiere reabrir algo, no para construir.
- `modulos/onboarding.md` — los 3 componentes que capturan el contexto del cliente
  (Contexto Organizacional, Contexto del Servicio, Control Técnico) y a qué entidad de
  `modelo-datos.md` va cada campo. Antes de tocar el feature `onboarding` de
  `Frontend-Platform`, léelo.
- `flujo-end-to-end.md` — el recorrido completo de un cliente, del registro del tenant en
  Monkey Admin hasta la medición del cumplimiento. Es el mapa de cómo se encadenan los
  módulos entre sí.

## Por encima de todo eso están los `assets/`

`assets/` contiene los documentos del **comité funcional** (blueprint del Centro de
Control Técnico, matriz de controles, desglose SOC 2, notas del conector). **No son
material de apoyo: son la fuente de verdad.** Los `.md` de `references/` solo los
transcriben. Si un `.md` y un documento fuente se contradicen, **gana el documento**
y el `.md` se corrige. Inventario completo, incluidas las fuentes que viven fuera de
este repo, en `skills/product/monkey-compliance-council/references/datos/modelo-datos.md` §0.

### El comité manda sobre lo implementado

**El proyecto está en etapa de reconstrucción.** El modelo relacional
(`modelo-datos.md`) es **el plan vigente**: dice qué entidades hay y cómo se van a
implementar. El schema actual de `Backend` **no es la referencia** — es el punto de
partida que se está rehaciendo.

De ahí dos consecuencias que no se discuten caso por caso:

1. **Si Monkey hoy hace algo de una forma y el comité propuso otra, se hace caso al
   comité.** Ellos hicieron el análisis funcional. Que una tabla, un enum o un cálculo ya
   exista en el código no es argumento para conservarlo.
2. **Que algo no exista todavía en el schema no es un pendiente del modelo.** Si está
   definido en `modelo-datos.md`, está decidido y listo para construirse. Lo único que
   queda abierto son las preguntas que **solo el comité puede responder**, y están en
   `modelo-datos-pendientes.md`.

Dos reglas más que salen de los assets y aplican siempre:

- **La dependencia de Wazuh es confidencial frente al cliente final.** En el producto
  se habla de "sonda", "capacidad automática" o "evaluación automática" — nunca del
  proveedor por su nombre (ni Wazuh ni Prowler), en ninguna pantalla, notificación,
  reporte o texto generado por IA.
- `conexion_api_wazuh_monkey.txt` **contiene credenciales en texto plano**. No se
  copia a este ni a ningún otro repo.

## Y antes de tocar un endpoint o un formulario: `contracts/`

`contracts/` tiene la forma exacta de cada endpoint — request, response y errores — acordada
entre backend y frontend. **Se lee antes de construir, no después.** Si lo que vas a construir
no está ahí, el contrato se acuerda primero.

- `contracts/conventions.md` — el sobre de respuesta, la forma del error de validación, i18n,
  multi-select, fechas y paginación. Aplica a todos los endpoints.
- `contracts/enums.md` — la tabla `valor` ↔ etiqueta. Por el cable viaja el valor en
  `snake_case`; la etiqueta la resuelve i18n. **El frontend nunca hardcodea listas de opciones.**
- `contracts/modules/*.md` — un archivo por módulo: `monkey-admin`, `auth`, y los 3 componentes
  del onboarding.

Si el Excel del comité y `modelo-datos.md` discrepan en las **opciones** de un enum, gana el
Excel y se corrige el modelo. Si discrepan en el **nombre** de un campo, gana el modelo.

Para trabajo específico de cada repo, también existen:

- `skills/backend/*.md` (arquitectura, cómo agregar features/modelos/integraciones)
- `skills/frontend/*.md` (arquitectura de capas core/shared/features, i18n
  obligatorio, standalone components, path aliases — ver
  `skills/frontend/architecture-guardian.md`)
- `skills/product/monkey-compliance-council/references/control-tecnico/` (la sonda y el motor de nube: cómo se integran, qué trae cada uno de fábrica)

## Por qué existe este archivo

El 24 de agosto de 2026 se construyó una pantalla de "Cumplimiento" copiando el
estilo de Vanta sin pasar primero por `philosophy.md` — resultado: porcentajes
desnudos como métrica principal y códigos técnicos (`CC1.1-CC1.5`) expuestos en
la vista por defecto, exactamente lo que esa skill ya prohibía por escrito. Este
archivo existe para que esto no se repita: la skill se consulta ANTES de diseñar,
no después de que el usuario lo señale.

## Cuándo NO aplica

Trabajo puramente mecánico sin impacto de producto (fix de un typo, migración de
Prisma, corrección de un bug ya diagnosticado) no requiere releer las skills cada
vez — pero cualquier cosa que un usuario final vaya a ver o cualquier decisión de
qué construir sí.
