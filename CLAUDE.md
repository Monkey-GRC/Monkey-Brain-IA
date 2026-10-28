# Monkey — instrucciones obligatorias para Claude

Este repo (`Monkey-Brain-IA`) es el cerebro de producto de Monkey. Aplica a este repo y a los
hermanos (`Backend`, `Frontend`, `Frontend-Platform`, `monkey-cis-sync`). No decidas de memoria ni
repitas un resumen de una conversación anterior: los archivos pueden haber cambiado. **Lee solo lo
que la tarea necesita** (tabla de abajo); no cargues el cerebro entero.

## Regla no negociable

Antes de construir o rediseñar una pantalla, endpoint o flujo, o de tomar una decisión de
arquitectura, UX, modelo de datos o priorización: invoca la skill `monkey-compliance-council`
(`skills/product/monkey-compliance-council/SKILL.md`, sección "Cómo operar") y sigue su ruteo al
archivo correcto. Mapa por carpetas: `skills/product/monkey-compliance-council/references/README.md`.

**Cómo se activa.** Es el comando `/monkey-compliance-council` (`.claude/commands/monkey-compliance-council.md`
enlaza a `SKILL.md`): ejecútalo con la herramienta `Skill` **antes** de diseñar o construir, en el repo que sea
(`Backend`, `Frontend`, `Frontend-Platform`…), no solo cuando el usuario lo pida. Si el comando no está disponible
en la sesión, lee `skills/product/monkey-compliance-council/SKILL.md` y sigue su "Cómo operar"; nunca decidas de
memoria.

## Qué leer según la tarea

Rutas relativas a `skills/product/monkey-compliance-council/references/`.

| Si vas a…                                                      | Lee                                                                                                                                                  |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tocar el schema o una entidad                                  | `datos/modelo-datos.md` (índice) y solo el módulo que toques en `datos/modelo/`                                                                      |
| Tocar un cálculo o pantalla de cumplimiento (%)                | `datos/modelo/09-calculo-cumplimiento.md` (§9)                                                                                                       |
| Tocar una migración, RLS, roles o `.env`                       | `datos/schema-implementacion.md`                                                                                                                     |
| Diseñar texto o pantalla que verá un usuario final             | `producto/philosophy.md`                                                                                                                             |
| Decidir qué se construye ahora vs. después                     | `producto/mvp-roadmap.md`                                                                                                                            |
| Tocar el onboarding (Contexto Org., Servicio, Control Técnico) | `modulos/onboarding.md`                                                                                                                              |
| Entender el recorrido de un cliente de punta a punta           | `producto/flujo-end-to-end.md`                                                                                                                       |
| Saber qué exige un marco (SOC 2, ISO 27001…)                   | `cumplimiento/frameworks/<marco>.md` — no inventes citas ni cifras                                                                                   |
| Integrar la sonda o el motor de nube                           | `control-tecnico/README.md`                                                                                                                          |
| Revisar seguridad de un endpoint, tabla o flujo                | `seguridad/requisitos.md` (`SEG-n`; añade fila si hay requisito nuevo)                                                                               |
| Construir algo que dependa de una pregunta abierta             | `datos/modelo-datos-pendientes.md` (`P-n`): si sigue ahí, **pregunta, no resuelvas**                                                                 |
| Usar un atajo o parche                                         | regístralo en `deuda-tecnica/README.md` (`DT-n`); si cierras uno, bórralo                                                                            |
| Reabrir algo ya cerrado                                        | `datos/modelo-datos-decisiones.md` (índice de `D-n`; abre solo el archivo de `decisiones/` que indica) — se consulta para reabrir, no para construir |
| Resolver un desacuerdo de diseño                               | `producto/council.md`                                                                                                                                |
| Arquitectura, motores, stack                                   | `arquitectura/architecture.md`                                                                                                                       |

Fuera de `references/`:

- **Endpoint o formulario → `contracts/` primero**, antes de construir, no después. `contracts/conventions.md`
  (sobre de respuesta, errores, i18n, multi-select, fechas, paginación), `contracts/enums.md`
  (`valor` snake_case ↔ etiqueta; el frontend nunca hardcodea listas de opciones) y
  `contracts/modules/*.md`. Si no está ahí, el contrato se acuerda primero. Si el Excel del comité y
  `modelo-datos.md` discrepan en las **opciones** de un enum, gana el Excel; en el **nombre** de un campo, gana el modelo.
- **Trabajo de un repo concreto** → `skills/backend/*.md`, `skills/frontend/*.md` (capas, i18n
  obligatorio, standalone, path aliases: `skills/frontend/architecture-guardian.md`) y la sección
  del repo en `context/backend.md` o `context/frontend.md` (el código tal como está, no el diseño objetivo).

## Reglas estructurales (no se violan)

- **El Control es atómico e independiente del marco.** Se vincula a Requisitos; los Requisitos
  pertenecen a un marco. Nunca cuelgues un control (ni sus tests, evidencias o medición) de un framework.
- **El cumplimiento de un marco se deriva** recorriendo requisitos → controles. Nunca se almacena
  como atributo del marco. Se **cuenta**, no se promedia: activo → test → control → categoría → marco,
  «todo o nada» en cada nivel, y **lo pendiente no cuenta como cumplido** (`modelo-datos.md` §9, D68).
  El porcentaje es el **avance**: informa, nunca decide el cumplimiento.

## Reglas de producto (de `philosophy.md`; D80 reemplazó las de jerga y porcentaje)

- **Lenguaje de GRC.** Monkey es una herramienta seria de gobierno, riesgo y cumplimiento y habla como tal: la
  superficie usa el vocabulario del dominio (**controles, riesgos, causas, evidencias, requisitos, marcos,
  tratamiento, riesgo residual**) y **muestra siempre los códigos** (`CC6.1`, `IAC-12`). Nunca eufemismos que
  oculten el término correcto («acción de protección», «lo que podría salir mal»). Lo que sí se exige es explicar:
  junto al código va **en qué falla, qué impacto tiene y qué hacer** (plantilla de 7 campos de `philosophy.md`).
- **Estado y porcentaje, juntos.** El estado cualitativo (Preparado = 100%, Casi listo = 80% o más, Requiere
  trabajo = menos, Sin medir) y el **porcentaje de avance** se muestran **a la vez**, en el resumen y en cada
  control, con la **cobertura al lado** (el avance «de lo medido» y cuánto se midió). Nunca un porcentaje solo,
  nunca uno de «toda la empresa» (la unidad es servicio × marco) y el porcentaje **informa, no decide**.
- **La vista técnica es de los roles `auditor` y `admin_empresa` (D81, D96; mientras no se definan los permisos por pantalla, P3)**, no un modo ni un botón: añade lo que necesitan para ver todo lo que
  pide cada control (estados del motor, pruebas, puntos de enfoque, matrices). El `funcional` ve la vista de negocio,
  que ya usa el vocabulario y los códigos del dominio. El `admin_empresa` es el experto en compliance de su empresa y quien valida; el `funcional` ejecuta lo de su dimensión; el `auditor` revisa y no califica por ahora (D96).
- **La IA nunca certifica cumplimiento**, nunca presenta inferencia como hecho verificado sin
  mostrar evidencia, y siempre etiqueta lo que ella generó.
- Para explicarle un hallazgo a un usuario final: plantilla de 7 campos de `philosophy.md`.

## Confidencialidad y secretos

- **Wazuh y Prowler son confidenciales frente al cliente final.** En el producto se dice "sonda",
  "capacidad automática" o "evaluación automática" — nunca el proveedor por su nombre, en ninguna
  pantalla, notificación, reporte o texto generado por IA.
- `conexion_api_wazuh_monkey.txt` contiene credenciales en texto plano. No se copia a este ni a
  ningún otro repo.

## El comité manda sobre lo implementado

- `assets/` (blueprint del Centro de Control, matriz de controles, desglose SOC 2, notas del
  conector) es **la fuente de verdad**, por encima de todo. Los `.md` de `references/` solo lo
  transcriben: si se contradicen, **gana el documento** y el `.md` se corrige. Inventario en
  `datos/modelo-datos.md` §0.
- El proyecto está en **reconstrucción**. `modelo-datos.md` es el plan vigente; el schema actual de
  `Backend` es el punto de partida que se rehace, no la referencia.
  1. Si Monkey hoy hace algo de una forma y el comité propuso otra, **se hace caso al comité**. Que
     una tabla, enum o cálculo ya exista no es argumento para conservarlo.
  2. Que algo no exista aún en el schema no es un pendiente: si está en `modelo-datos.md`, está
     decidido y listo para construirse. Solo queda abierto lo que está en `modelo-datos-pendientes.md`.

## Cierre de una tarea

Un cambio no está terminado hasta que cierra o actualiza todo lo relacionado: `P-n`, `DT-n`, `D-n`,
`SEG-n`, contrato, `enums.md` y los docs afectados, **en el mismo PR**. Cada dato vive en un solo
archivo; los demás lo enlazan. Reglas de mantenimiento del cerebro: `STANDARD.md`.

## Cuándo NO aplica

Trabajo puramente mecánico sin impacto de producto (typo, migración de Prisma, bug ya
diagnosticado) no requiere releer las skills. Todo lo que un usuario final vaya a ver, y toda
decisión de qué construir, sí.

## Por qué existe

El 24 de agosto de 2026 se construyó la pantalla "Cumplimiento" copiando a Vanta sin pasar por
`philosophy.md`: salieron porcentajes desnudos y códigos técnicos (`CC1.1-CC1.5`) en la vista por
defecto. De ahí quedó la regla de que nada se muestra sin explicarlo; el 15 de octubre de 2026 (D80) se
precisó: los códigos y el porcentaje **sí se muestran**, siempre acompañados del estado, la cobertura y la
explicación. La skill se consulta ANTES de diseñar, no después de que el usuario lo señale.
