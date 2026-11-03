# Monkey-Brain-IA

Contexto portable de IA para el proyecto Monkey — cubre cuatro repos:

- **Backend** (`Monkey-GRC/Backend`) — la API.
- **Frontend** (`Monkey-GRC/Frontend`) — el **admin interno**: creación y gestión
  de tenants, usuarios y el catálogo maestro GRC.
- **Frontend-Platform** (`Monkey-GRC/Frontend-Platform`) — la **plataforma del
  cliente final**: el onboarding donde se descubren y declaran sus servicios y
  activos, y el estado de cumplimiento que ve.
- **monkey-cis-sync** — sincroniza el catálogo de checks de la sonda (Wazuh); el de nube (Prowler) se carga desde el Backend con `npm run cloud:extract|load|verify` (D56). ⚠️ Hoy es una carpeta
  de scripts Python, **no un repo git**: no tiene historial ni remoto.

Este folder es su **propio repo independiente**, separado del código de
producto, justamente para poder moverlo, clonarlo o descargarlo en cualquier
otro lugar sin arrastrarlo. Cuando se usa, se asume colocado como carpeta
hermana de esos repos (p. ej. `Monkey/Backend/` y `Monkey/Frontend/` junto a
`Monkey/Monkey-Brain-IA/`) — ver la nota de "Convención de rutas" en
`context/backend.md` y `context/frontend.md`.

Esta carpeta no depende de ninguna herramienta en particular (Claude Code, Cursor,
Copilot, Windsurf, un agente custom, etc.). Es un conjunto de archivos en Markdown
con front-matter YAML y un índice en JSON, pensado para que cualquier asistente de
IA pueda:

1. Entender rápido el dominio, el stack y las convenciones de los repos (`context/`).
2. Saber qué "agentes" (roles/personas especializadas) existen y cuándo usarlos (`agents/`).
3. Ejecutar tareas repetibles paso a paso ("skills") sin reinventar el proceso cada vez (`skills/`).
4. Conocer qué exige cada framework y qué está decidido del modelo de datos
   (`skills/product/monkey-compliance-council/`).
5. Saber la forma exacta de cada endpoint antes de construirlo (`contracts/`).

## Cómo debe usarla un agente de IA

1. Empezar por `CLAUDE.md`: reglas no negociables y la tabla "qué leer según la tarea".
   `manifest.json` es el índice máquina-legible de los recursos.
2. Antes de tocar código, leer solo el `context/` del repo en que se trabaja
   (`backend.md` o `frontend.md`).
3. **En Claude Code** las tareas de desarrollo entran por la skill `monkey-dev-flow` y los roles de `agents/` son subagentes
   reales (ver «Cómo se carga en Claude Code»). **En otra herramienta**, si la tarea calza con un agente de `agents/`,
   adoptar ese rol/checklist.
4. Si la tarea calza con una skill de `skills/` (proceso en `skills/process/`, técnica de backend en `skills/backend/`, de
   frontend en `skills/frontend/`, de producto/compliance en `skills/product/`), seguir sus pasos en orden.
5. Antes de crear o mover módulos, revisar el `architecture-guardian.md` del repo que
   corresponda (`skills/backend/` o `skills/frontend/`) para no violar la regla de capas.
6. Antes de construir un endpoint o un formulario, leer el módulo correspondiente de
   `contracts/`.
7. **Todo lo que deba escalarse (decisión crítica, pregunta, aprobación) va
   siempre hacia el usuario que está usando la herramienta en ese momento** —
   nunca a un nombre fijo ni a una persona específica del dominio de negocio.

## Estructura

```
Monkey-Brain-IA/
├── README.md                      # este archivo
├── CLAUDE.md                      # instrucciones obligatorias antes de tomar cualquier decisión
├── STANDARD.md                    # cómo se mantiene el cerebro: un dato un dueño, tamaños, IDs, cierre de tarea
├── manifest.json                  # índice máquina-legible de todos los recursos
├── context/
│   ├── backend.md                 # convenciones, capas y mapa de features del Backend
│   └── frontend.md                # las dos apps Angular: diferencias, convenciones y mapa de features
├── contracts/                     # forma exacta de cada endpoint: request, response y errores
│   ├── README.md
│   ├── conventions.md             # sobre de respuesta, errores, i18n, multi-select, paginación
│   ├── enums.md                   # valor snake_case ↔ etiqueta es/en, para todos los enums
│   └── modules/                   # un archivo por módulo (monkey-admin, auth, los 3 componentes)
├── assets/                        # la FUENTE MAESTRA del comité, sin transcribir
│   └── TSC INTERGRAL SOC 2 DETALLADO VF2.xlsx     # (gitignored: 5,2 MB binarios)
├── agents/
│   ├── product-owner.md           # rol: decide qué/por qué/prioridad
│   ├── tech-lead.md               # rol: supervisa backend-senior + frontend-senior + qa
│   ├── backend-senior.md          # rol: implementa backend, lo que asigna el tech-lead
│   ├── frontend-senior.md         # rol: implementa frontend (Angular), lo que asigna el tech-lead
│   ├── qa.md                      # rol: prueba punto a punto (backend y frontend) antes del reporte final
│   └── wazuh-integration-expert.md# rol: especialista consultado en API/infra de Wazuh, no ejecutor
└── skills/
    ├── backend/                   # skills técnicas de implementación (NestJS)
    │   ├── senior-backend-engineer/SKILL.md # punto de partida: criterio, mapa y definición de terminado
    │   ├── add-feature.md
    │   ├── add-prisma-model.md
    │   ├── add-i18n-error.md
    │   ├── add-wazuh-integration.md   # adaptador real de la sonda (puerto ConnectionProbe)
    │   ├── feature-builder.md
    │   └── architecture-guardian.md
    ├── frontend/                  # skills técnicas de implementación (Angular)
    │   ├── senior-frontend-engineer/SKILL.md # punto de partida: criterio, mapa y definición de terminado
    │   ├── add-feature.md
    │   ├── call-backend-api.md
    │   ├── add-translation.md
    │   └── architecture-guardian.md
    └── product/                   # skills de producto/estrategia/compliance
        └── monkey-compliance-council/  # "el Consejo": cerebro de producto/compliance (mapa en references/README.md)
```

## Cómo se carga en Claude Code

Claude Code se abre **siempre desde este repo**; los repos hermanos (`Backend`, `Frontend`, `Frontend-Platform`,
`monkey-cis-sync`) se alcanzan por `permissions.additionalDirectories`. El contenido real vive en `skills/` y `agents/`
(portable); `.claude/` solo lo expone a Claude Code:

| Pieza | Dónde vive | Cómo se registra |
|---|---|---|
| Reglas permanentes | `CLAUDE.md` | Se carga al arrancar |
| Permisos y hooks | `.claude/settings.json` + `.claude/hooks/` | Claude Code los lee y recarga solos |
| Skills | `skills/process/`, `skills/backend/`, `skills/frontend/`, `skills/product/` | Symlinks en `.claude/skills/` |
| Subagentes | `agents/*.md` (frontmatter con `name`, `description`, `tools`, `model`) | Symlinks en `.claude/agents/` |

Skills de proceso: `monkey-dev-flow` (el flujo), `monkey-preflight`, `monkey-ui-copy`, `monkey-security-review`,
`monkey-registry` y `monkey-closeout`. Las recetas planas de `skills/backend/` y `skills/frontend/` (`type: recipe`) no son skills:
las enruta cada `senior-*-engineer`.

## Equipo de agentes (jerarquía fija)

> **En Claude Code**, el rol del `tech-lead` lo ejecuta la sesión principal con la skill `monkey-dev-flow`, y los demás son
> subagentes (`backend-senior`, `frontend-senior`, `qa`, `architecture-reviewer`, `product-owner`, `wazuh-integration-expert`).
> El diagrama de abajo sigue siendo el modelo conceptual.

```
                          usuario (quien está usando la herramienta ahora)
        ↑ decisiones estratégicas          ↑ decisiones críticas de ingeniería
                    │                                    │
              product-owner                         tech-lead
        (qué / por qué / prioridad)      (supervisa, no implementa ni prueba)
                    │                                    │
                    └──── entrega backlog clasificado ───▶│
                                                           ├──asigna(backend)──▶ backend-senior  ──┐
                                                           ├──asigna(frontend)──▶ frontend-senior ──┤
                                                           │                                        │
                                                           └─────────────── pasa a QA ◀─────────────┘
                                                                    qa ──prueba punto a punto──▶ PASS/FAIL
```

- **product-owner**: decide QUÉ se construye y en qué orden, usando el marco
  del Consejo (`skills/product/monkey-compliance-council/`) — nunca alcance
  sin ese filtro. No toca código ni arquitectura técnica. Escala **al
  usuario que está usando la herramienta** toda decisión estratégica (cambio
  de fase de roadmap, algo cercano a la lista NO BUILD, tensión sin
  resolución clara). Entrega alcance ya clasificado (MUST/SHOULD/LATER/NO
  BUILD) al tech-lead.
- **tech-lead**: no implementa ni prueba. Supervisa a **ambos** seniors,
  revisa contra el `architecture-guardian.md` del repo que corresponda, y es el
  único que habla con el usuario para temas de ingeniería. Antes de
  cualquier decisión crítica (ver `agents/tech-lead.md`), pregunta al
  usuario; para el resto, reporta corto al final. También vigila que
  `context/backend.md` / `context/frontend.md` no queden desactualizados tras un cambio — cuando lo
  considera necesario, le pregunta al usuario si quiere actualizarlo.
- **backend-senior**: ejecuta la tarea que le asigna el tech-lead en el
  backend siguiendo las skills (`skills/backend/add-feature.md`, etc.). No
  decide alcance.
- **frontend-senior**: equivalente exacto de `backend-senior` para el
  frontend (Angular) — ejecuta lo que le asigna el tech-lead siguiendo
  `skills/frontend/`. No decide alcance.
- **qa**: prueba end-to-end (request/response real en backend, flujo de UI
  real en frontend) lo que entrega el senior correspondiente, antes de que
  el tech-lead lo dé por bueno frente al usuario.

### Especialista consultado (no está en la cadena de ejecución)

- **wazuh-integration-expert**: no recibe tareas del tech-lead ni entrega
  reportes de avance — es consultado puntualmente por `tech-lead` o
  `backend-senior` cuando el backend necesita comunicarse con la sonda
  (API REST, SCA, syscollector, vulnerabilidades, grupos por cliente).
  Responde con hechos de `references/arquitectura/control-tecnico/motores/`, nunca escribe código de producción — la
  implementación la sigue haciendo `backend-senior` con
  `skills/backend/add-wazuh-integration.md`. Cualquier cambio de
  firewall/puertos del VPS o de dónde se guardan las credenciales de la API
  de Wazuh es decisión crítica: pasa por `tech-lead` y este siempre
  pregunta al usuario.

Ningún agente escala a un nombre propio ni a un rol de negocio específico —
siempre a **quien está operando la herramienta en esa sesión**.

Modelos asignados: todos los subagentes usan `sonnet`; cambian el `effort` (`medium` para quienes implementan o
deciden, `low` para `qa` y `wazuh-integration-expert`). Todos con reportes cortos y formato fijo (ver cada archivo de
agente), y todos leen la parte del código que necesitan en vez de repos completos, para
minimizar tokens.

## Convenciones de formato

- Cada archivo de `agents/` y `skills/` tiene front-matter YAML (`id`, `name`,
  `description`, `type`) seguido de contenido en Markdown plano.
- `manifest.json` es la fuente de verdad para descubrimiento automático; los
  campos `path` son relativos a esta carpeta (`Monkey-Brain-IA/`).
- `skills/` está organizada en categorías claras a nivel de carpeta:
  `backend/` (implementación NestJS), `frontend/` (implementación Angular),
  `process/` (el flujo de trabajo: preflight, cierre, registros, seguridad, copy), `product/` (producto/estrategia/compliance), `integrations/` (conocimiento
  de sistemas externos que el backend consume, p. ej. Wazuh) y `shared/`
  (transversales, no atadas a un repo). Cualquier skill nueva va dentro de
  la categoría que corresponda, no suelta en la raíz de `skills/`.
- El contenido de `skills/`, `agents/`, `references/` y `contracts/` no depende de un vendor y puede copiarse o enlazarse
  desde la config de cualquier herramienta. **`.claude/` es específico de Claude Code**: ahí solo hay permisos, hooks y symlinks.
- **Excepción explícita**: `skills/product/monkey-compliance-council/` se
  importó íntegro y se dejó en su formato original de Claude Code Skill
  (`SKILL.md` con frontmatter `name`/`description` + `references/`), porque
  es contenido ya elaborado (el "Consejo" de producto/compliance de Monkey)
  y reescribirlo habría arriesgado perder matices. Cualquier herramienta
  puede leer igual el Markdown de sus `references/`; solo el `SKILL.md` en
  sí usa la convención de Claude Code.

## Las fuentes funcionales están en `assets/`

`assets/` no es una carpeta de adjuntos: son los documentos del **comité funcional**
(las personas a cargo de la parte funcional de Monkey) y son la **fuente de verdad**
del modelo. Los `.md` de `skills/product/monkey-compliance-council/references/` solo
transcriben y sistematizan lo que esos documentos deciden. **Ante una discrepancia,
gana el documento fuente** y el `.md` se corrige.

Parte de esas fuentes vive fuera de este repo, en la carpeta `Monkey/` que lo
contiene, porque incluyen datos operativos o credenciales. El inventario completo
—qué define cada una, quién la consume, y qué documentos citan que todavía no
tenemos— está en **`modelo-datos.md` §0**, y el índice máquina-legible en el bloque
`sources` de `manifest.json`.

Dos cosas que conviene saber antes de abrirlas:

- `conexion_api_wazuh_monkey.txt` **contiene credenciales en texto plano**. No se
  copia a ningún repo y esa password debería rotarse.
- **La dependencia de Wazuh y de Prowler es confidencial frente al cliente final.** En el
  producto se habla de "sonda" o "capacidad automática", nunca del proveedor por su
  nombre — ver `philosophy.md`.
