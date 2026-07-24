# monkey-brain-ai

Contexto portable de IA para el proyecto Monkey — cubre los repos
**backend** (`monkey-360/backend`) y **frontend** (`monkey-360/frontend`).

Este folder es su **propio repo independiente**, separado de `backend` y de
`frontend`, justamente para poder moverlo, clonarlo o descargarlo en
cualquier otro lugar sin arrastrar el código del producto. Cuando se usa, se
asume colocado como carpeta hermana de esos repos (p. ej. `monkey/backend/`
y `monkey/frontend/` junto a `monkey/monkey-brain-ai/`) — ver la nota de
"Convención de rutas" en `context/project-context.md`.

**El brain no genera ni almacena grafos.** Los grafos de conocimiento viven
dentro de cada repo de código (`backend/graphs-knowledge/` y
`frontend/graphs-knowledge/`, generados con la skill graphify). Este folder
solo los **consulta** para responder con más precisión y gastando menos
tokens — nunca duplica su contenido. Ver "Los grafos viven en cada repo" más
abajo.

Esta carpeta no depende de ninguna herramienta en particular (Claude Code, Cursor,
Copilot, Windsurf, un agente custom, etc.). Es un conjunto de archivos en Markdown
con front-matter YAML y un índice en JSON, pensado para que cualquier asistente de
IA pueda:

1. Entender rápido el dominio, el stack y las convenciones de ambos repos (`context/`).
2. Saber qué "agentes" (roles/personas especializadas) existen y cuándo usarlos (`agents/`).
3. Ejecutar tareas repetibles paso a paso ("skills") sin reinventar el proceso cada vez (`skills/`).
4. Consultar los grafos de arquitectura y de conocimiento de cada repo **sin
   copiarlos aquí** — solo leerlos desde su ubicación real, de la forma más
   barata posible (`skills/shared/query-knowledge-graph.md`).

## Cómo debe usarla un agente de IA

1. Leer `manifest.json` para saber qué recursos existen y sus rutas (incluye
   punteros a los `graphs-knowledge/` de cada repo, bajo `graphsKnowledge`).
2. Leer `context/project-context.md` **siempre** antes de tocar código en
   cualquiera de los dos repos.
3. Si la tarea calza con un agente definido en `agents/`, adoptar ese rol/checklist.
4. Si la tarea calza con una skill definida en `skills/` (técnica de backend
   en `skills/backend/`, técnica de frontend en `skills/frontend/`, de
   producto/compliance en `skills/product/`, transversal en `skills/shared/`),
   seguir sus pasos en orden.
5. Antes de crear o mover módulos, revisar el `architecture.md`/`.json` del
   repo que corresponda (`backend/graphs-knowledge/` o
   `frontend/graphs-knowledge/`) para no violar la regla de capas.
6. Para preguntas más amplias sobre cómo se conecta el código de un repo,
   seguir **siempre** `skills/shared/query-knowledge-graph.md`: preferir
   `graphify query "<pregunta>"` o una sección puntual del
   `GRAPH_REPORT.md` correspondiente, en vez de cargar el `graph.json`
   completo — así se evita consumo de tokens excesivo.
7. **Todo lo que deba escalarse (decisión crítica, pregunta, aprobación) va
   siempre hacia el usuario que está usando la herramienta en ese momento** —
   nunca a un nombre fijo ni a una persona específica del dominio de negocio.

## Estructura

```
monkey-brain-ai/
├── README.md                      # este archivo
├── manifest.json                  # índice máquina-legible + punteros a graphs-knowledge/ de cada repo
├── context/
│   └── project-context.md         # dominio, stack y convenciones — backend Y frontend
├── agents/
│   ├── product-owner.md           # rol: decide qué/por qué/prioridad
│   ├── tech-lead.md               # rol: supervisa backend-senior + frontend-senior + qa
│   ├── backend-senior.md          # rol: implementa backend, lo que asigna el tech-lead
│   ├── frontend-senior.md         # rol: implementa frontend (Angular), lo que asigna el tech-lead
│   ├── qa.md                      # rol: prueba punto a punto (backend y frontend) antes del reporte final
│   └── wazuh-integration-expert.md# rol: especialista consultado en API/infra de Wazuh, no ejecutor
└── skills/
    ├── backend/                   # skills técnicas de implementación (NestJS)
    │   ├── add-feature.md
    │   ├── add-prisma-model.md
    │   ├── add-i18n-error.md
    │   ├── add-wazuh-integration.md   # feature NestJS que consume la API de Wazuh
    │   ├── feature-builder.md
    │   └── architecture-guardian.md
    ├── frontend/                  # skills técnicas de implementación (Angular)
    │   ├── add-feature.md
    │   ├── call-backend-api.md
    │   ├── add-translation.md
    │   └── architecture-guardian.md
    ├── product/                   # skills de producto/estrategia/compliance
    │   └── monkey-compliance-council/  # "el Consejo": cerebro de producto/compliance de Monkey
    │       ├── SKILL.md
    │       └── references/        # architecture, wazuh, mvp-roadmap, philosophy, council, frameworks/*
    ├── integrations/               # skills de integraciones externas
    │   └── wazuh/                    # Wazuh completo: producto (API, infra, TODAS las normativas que evalúa) + caso aplicado del SOC de Bryan
    │       ├── SKILL.md
    │       └── references/        # infraestructura, agentes, compliance (normativas nativas vs. custom), api-integracion, soc-gestionado
    └── shared/                    # skills transversales (no específicas de un repo)
        └── query-knowledge-graph.md  # cómo consultar los grafos sin gastar tokens de más
```

## Los grafos viven en cada repo, no aquí

Cada repo de código tiene su propia carpeta, con **la misma estructura** en
ambos:

```
<repo>/graphs-knowledge/
├── architecture.json          # grafo curado a mano: capas/módulos, normativo
├── architecture.md            # mismo grafo en Mermaid + explicación
└── graphify-out/               # grafo de conocimiento completo, generado con graphify
    ├── graph.html               # visualización interactiva — abrir en el navegador
    ├── graph.json                # datos crudos (GraphRAG/consumo programático)
    ├── GRAPH_REPORT.md           # reporte en lenguaje llano (god nodes, conexiones
    │                             # sorprendientes, hyperedges, preguntas sugeridas)
    ├── manifest.json             # manifest interno de graphify (para --update incremental)
    ├── cost.json                 # tracker de tokens gastados en cada corrida de graphify
    └── .graphify_*                # archivos internos de graphify (no editar a mano)
```

- **`backend/graphs-knowledge/`** — 444 nodos, 589 aristas, 54 comunidades
  (código `src/`, `prisma/schema/`, y el propio `monkey-brain-ai`).
- **`frontend/graphs-knowledge/`** — 441 nodos, 623 edges, 45 comunidades
  (código `src/app/`, templates HTML; las 18 imágenes decorativas del
  template TailAdmin se excluyeron a propósito de la extracción semántica
  para no gastar tokens en assets sin valor de producto — ver la nota en su
  `GRAPH_REPORT.md`).

**Por qué no viven en `monkey-brain-ai`**: el brain existe para optimizar
cómo se usan — no para poseerlos. Mantener una sola copia (la del repo real)
evita que el brain quede desincronizado del código y evita cargar contenido
duplicado en contexto. Ver `skills/shared/query-knowledge-graph.md` para el
protocolo exacto de consulta (siempre desde ahí, nunca copiado aquí, y
siempre empezando por la forma más barata: `graphify query` > sección de
`GRAPH_REPORT.md` > `architecture.md` > `graph.json` completo como último
recurso).

Regenerar tras cambios:
```
cd backend/graphs-knowledge && graphify <ruta absoluta al repo backend> --update
cd frontend/graphs-knowledge && graphify <ruta absoluta al repo frontend> --update
```
(el `tech-lead` es quien decide cuándo hace falta y se lo pregunta al
usuario — ver `agents/tech-lead.md`, sección "Mantener el contexto y los
grafos al día").

## Equipo de agentes (jerarquía fija)

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
  revisa contra el `architecture.md` del repo que corresponda, y es el
  único que habla con el usuario para temas de ingeniería. Antes de
  cualquier decisión crítica (ver `agents/tech-lead.md`), pregunta al
  usuario; para el resto, reporta corto al final. También vigila que
  `context/project-context.md` y el `graphs-knowledge/` de **cada repo** no
  queden desactualizados tras un cambio — cuando lo considera necesario, le
  pregunta al usuario si quiere actualizarlos (nunca los regenera por su
  cuenta sin confirmación).
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
  `backend-senior` cuando el backend necesita comunicarse con el SOC
  gestionado sobre Wazuh (API REST, SCA, syscollector, vulnerabilidades,
  multi-tenancy). Responde con hechos de
  `skills/integrations/wazuh/`, nunca escribe código de producción — la
  implementación la sigue haciendo `backend-senior` con
  `skills/backend/add-wazuh-integration.md`. Cualquier cambio de
  firewall/puertos del VPS o de dónde se guardan las credenciales de la API
  de Wazuh es decisión crítica: pasa por `tech-lead` y este siempre
  pregunta al usuario.

Ningún agente escala a un nombre propio ni a un rol de negocio específico —
siempre a **quien está operando la herramienta en esa sesión**.

Modelos asignados (pensado para bajo consumo de tokens): `product-owner`,
`tech-lead` y `wazuh-integration-expert` = sonnet (requieren juicio, no
solo ejecución mecánica), `backend-senior`, `frontend-senior` y `qa` =
haiku. Todos con reportes cortos y formato fijo (ver cada archivo de
agente), y todos usan `skills/shared/query-knowledge-graph.md` en vez de
releer código fuente completo o cargar grafos enteros — para minimizar
tokens.

## Convenciones de formato

- Cada archivo de `agents/` y `skills/` tiene front-matter YAML (`id`, `name`,
  `description`, `type`) seguido de contenido en Markdown plano.
- `manifest.json` es la fuente de verdad para descubrimiento automático; los
  campos `path` son relativos a esta carpeta (`monkey-brain-ai/`), salvo
  `graphsKnowledge`, que apunta a las carpetas hermanas `../backend/` y
  `../frontend/`.
- `skills/` está organizada en categorías claras a nivel de carpeta:
  `backend/` (implementación NestJS), `frontend/` (implementación Angular),
  `product/` (producto/estrategia/compliance), `integrations/` (conocimiento
  de sistemas externos que el backend consume, p. ej. Wazuh) y `shared/`
  (transversales, no atadas a un repo). Cualquier skill nueva va dentro de
  la categoría que corresponda, no suelta en la raíz de `skills/`.
- Nada del contenido propio de esta carpeta es específico de un vendor: no
  hay sintaxis de herramienta, así que puede copiarse o enlazarse desde la
  config propia de cualquier herramienta.
- **Excepción explícita**: `skills/product/monkey-compliance-council/` se
  importó íntegro y se dejó en su formato original de Claude Code Skill
  (`SKILL.md` con frontmatter `name`/`description` + `references/`), porque
  es contenido ya elaborado (el "Consejo" de producto/compliance de Monkey)
  y reescribirlo habría arriesgado perder matices. Cualquier herramienta
  puede leer igual el Markdown de sus `references/`; solo el `SKILL.md` en
  sí usa la convención de Claude Code.
- **Excepción explícita**: `skills/integrations/wazuh/` se importó
  íntegro con el mismo criterio (formato Claude Code Skill original). Nota
  de sensibilidad: contiene datos operativos reales (IP y puerto SSH de un
  VPS de producción, nombre de la persona/empresa que opera el SOC, precios)
  — es contexto de negocio legítimo del proyecto, pero cualquier agente que
  lo use debe tratarlo como información operativa real, no como ejemplo
  genérico, y nunca debe filtrarse hacia documentos o superficies públicas
  del producto Monkey.
- **Excepción explícita**: `graphs-knowledge/graphify-out/` (en cada repo,
  no aquí) es la salida cruda de la skill graphify (incluye archivos
  internos con prefijo `.graphify_*`) — no se edita a mano, se regenera con
  `graphify ... --update`.
