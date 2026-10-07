# Monkey-Brain-IA

Contexto portable de IA para el proyecto Monkey — cubre cuatro repos:

- **Backend** (`Monkey-GRC/Backend`) — la API.
- **Frontend** (`Monkey-GRC/Frontend`) — el **admin interno**: creación y gestión
  de tenants, usuarios y el catálogo maestro GRC.
- **Frontend-Platform** (`Monkey-GRC/Frontend-Platform`) — la **plataforma del
  cliente final**: el onboarding donde se descubren y declaran sus servicios y
  activos, y el estado de cumplimiento que ve.
- **monkey-cis-sync** — sincroniza el catálogo de checks desde Wazuh. ⚠️ Hoy es una carpeta
  de scripts Python, **no un repo git**: no tiene historial ni remoto.

Este folder es su **propio repo independiente**, separado del código de
producto, justamente para poder moverlo, clonarlo o descargarlo en cualquier
otro lugar sin arrastrarlo. Cuando se usa, se asume colocado como carpeta
hermana de esos repos (p. ej. `Monkey/Backend/` y `Monkey/Frontend/` junto a
`Monkey/Monkey-Brain-IA/`) — ver la nota de "Convención de rutas" en
`context/project-context.md`.

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

1. Leer `manifest.json` para saber qué recursos existen y sus rutas.
2. Leer `context/project-context.md` **siempre** antes de tocar código en
   cualquiera de los repos.
3. Si la tarea calza con un agente definido en `agents/`, adoptar ese rol/checklist.
4. Si la tarea calza con una skill definida en `skills/` (técnica de backend
   en `skills/backend/`, técnica de frontend en `skills/frontend/`, de
   producto/compliance en `skills/product/`, transversal en `skills/shared/`),
   seguir sus pasos en orden.
5. Antes de crear o mover módulos, revisar el `architecture-guardian.md` del repo que
   corresponda (`skills/backend/` o `skills/frontend/`) para no violar la regla de capas.
6. Antes de construir un endpoint o un formulario, leer el módulo correspondiente de
   `contracts/modules/`.
7. **Todo lo que deba escalarse (decisión crítica, pregunta, aprobación) va
   siempre hacia el usuario que está usando la herramienta en ese momento** —
   nunca a un nombre fijo ni a una persona específica del dominio de negocio.

## Estructura

```
Monkey-Brain-IA/
├── README.md                      # este archivo
├── CLAUDE.md                      # instrucciones obligatorias antes de tomar cualquier decisión
├── manifest.json                  # índice máquina-legible de todos los recursos
├── context/
│   └── project-context.md         # estado ACTUAL del código de los tres repos
├── contracts/                     # forma exacta de cada endpoint: request, response y errores
│   ├── README.md
│   ├── conventions.md             # sobre de respuesta, errores, i18n, multi-select, paginación
│   ├── enums.md                   # valor snake_case ↔ etiqueta es/en, para todos los enums
│   └── modules/                   # un archivo por módulo (monkey-admin, auth, los 3 componentes)
├── assets/                        # la FUENTE MAESTRA del comité, sin transcribir
│   └── TSC INTERGRAL SOC 2 DETALLADO VF.xlsx      # (gitignored: 2,5 MB binarios)
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
    │   ├── add-wazuh-integration.md   # adaptador real de la sonda (puerto ConnectionProbe)
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
    │       └── references/        # README = mapa; una carpeta por parte de la aplicación:
    │           ├── producto/            #   philosophy, mvp-roadmap, council, flujo-end-to-end, sprint-onboarding
    │           ├── arquitectura/        #   architecture
    │           ├── datos/               #   modelo-datos, schema-implementacion, decisiones (D-n), pendientes (P-n)
    │           ├── seguridad/           #   requisitos (SEG-n)
    │           ├── cumplimiento/        #   frameworks/* (14 marcos)
    │           ├── control-tecnico/     #   wazuh (la sonda)
    │           ├── modulos/             #   onboarding.md
    │           └── deuda-tecnica/       #   índice + por área (DT-n)
    └── integrations/               # skills de integraciones externas
        └── wazuh/                    # Wazuh completo: producto (API, infra, TODAS las normativas que evalúa) + caso aplicado del SOC de Bryan
            ├── SKILL.md
            └── references/        # infraestructura, agentes, compliance (normativas nativas vs. custom), api-integracion, soc-gestionado
```

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
  revisa contra el `architecture-guardian.md` del repo que corresponda, y es el
  único que habla con el usuario para temas de ingeniería. Antes de
  cualquier decisión crítica (ver `agents/tech-lead.md`), pregunta al
  usuario; para el resto, reporta corto al final. También vigila que
  `context/project-context.md` no quede desactualizado tras un cambio — cuando lo
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
agente), y todos leen la parte del código que necesitan en vez de repos completos, para
minimizar tokens.

## Convenciones de formato

- Cada archivo de `agents/` y `skills/` tiene front-matter YAML (`id`, `name`,
  `description`, `type`) seguido de contenido en Markdown plano.
- `manifest.json` es la fuente de verdad para descubrimiento automático; los
  campos `path` son relativos a esta carpeta (`Monkey-Brain-IA/`).
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
- **La dependencia de Wazuh es confidencial frente al cliente final.** En el
  producto se habla de "sonda" o "capacidad automática", nunca del proveedor por su
  nombre — ver `philosophy.md`.
