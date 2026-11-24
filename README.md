# Monkey-Brain-IA

El cerebro de Monkey: el producto, los contratos, la arquitectura y las reglas con las que se trabajan sus repos con IA.
Es Markdown (más un índice en `manifest.json`) y está preparado para **Claude Code**, que se abre **siempre desde aquí**.
Vive como carpeta hermana de los repos de código:

| Repo | Qué es |
|---|---|
| `Backend` | La API (NestJS, Clean Architecture por features, Prisma, Postgres con RLS) |
| `Frontend` | **Monkey Admin**, el panel interno: empresas, cuentas y catálogo maestro |
| `Frontend-Platform` | **Monkey Platform**, la aplicación del cliente: onboarding, equipo y cumplimiento |
| `monkey-cis-sync` | Scripts que sincronizan el catálogo de checks de la sonda (no es un repo git) |

## Por dónde empezar

| Si quieres… | Lee |
|---|---|
| Trabajar con IA en el proyecto (las reglas que no se rompen y qué leer según la tarea) | [`CLAUDE.md`](CLAUDE.md) |
| Saber qué existe de un módulo o dónde está un dato del producto | [`references/README.md`](skills/product/monkey-compliance-council/references/README.md) y el [índice de arquitectura](skills/product/monkey-compliance-council/references/arquitectura/README.md) |
| Conocer un endpoint (cuerpo, errores, roles) | [`contracts/`](contracts/README.md) |
| Ver la infraestructura (VPS, contenedores, despliegue) | [`plataforma/infraestructura/`](skills/product/monkey-compliance-council/references/arquitectura/plataforma/infraestructura/README.md) |
| Mantener el cerebro (un dato un dueño, tamaños, IDs, formato, automatización) | [`STANDARD.md`](STANDARD.md) |

## Qué hay en cada carpeta

| Carpeta | Qué hay |
|---|---|
| `skills/product/monkey-compliance-council/references/` | El conocimiento del producto: `arquitectura/` (un módulo por carpeta), `datos/` (modelo, decisiones, pendientes), `seguridad/`, `deuda-tecnica/`, `producto/` |
| `contracts/` | La forma de cada endpoint y de cada enum; se escribe **antes** que el código |
| `context/` | El código **tal como está** (`backend.md`, `frontend.md`) |
| `assets/` | Los documentos del **comité funcional**: mandan sobre todo lo demás ([precedencia](CLAUDE.md#precedencia-si-dos-fuentes-se-contradicen)) |
| `skills/process/` | El flujo de trabajo: `monkey-dev-flow`, `-preflight`, `-closeout`, `-registry`, `-security-review`, `-ui-copy`, `-docs` |
| `skills/backend/`, `skills/frontend/` | Recetas técnicas y el sistema de diseño (`frontend/design-system/`) |
| `agents/` | Los subagentes (ver abajo) |
| `.claude/` | Solo Claude Code: permisos, hooks y enlaces a `skills/` y `agents/` |

## Tareas habituales

| Quiero… | Cómo |
|---|---|
| Hacer un ticket (feature, fix, endpoint, pantalla) | `/monkey-dev` en Claude Code: [`monkey-dev-flow`](skills/process/monkey-dev-flow/SKILL.md) clasifica, delega, verifica y cierra |
| Saber qué está decidido de un módulo antes de tocarlo | Skill `monkey-preflight <módulo>` |
| Registrar una decisión, un pendiente, una deuda o un requisito de seguridad | Skill `monkey-registry` |
| Documentar las historias y los casos de uso de un módulo | Skill [`monkey-docs`](skills/process/monkey-docs/SKILL.md) (sección siguiente) |
| Comprobar que el cerebro no tiene nada roto | `python3 skills/process/monkey-closeout/scripts/check-brain.py` y `check-doc-drift.py`; o el subagente `docs-guardian` |

> Claude **no hace commits, pushes ni PRs**: deja los cambios sin commitear y dice en qué repos.

## Historias de usuario, casos de uso y su PDF

Cada módulo de `arquitectura/` tiene `04-historias.md` y `05-casos-de-uso.md`; el diagrama UML de casos de uso está al lado,
en PlantUML (`05-casos-de-uso.puml`) con su imagen (`05-casos-de-uso.svg`). El formato y las reglas (de dónde sale el
contenido, nada se inventa) están en la skill [`monkey-docs`](skills/process/monkey-docs/SKILL.md); el ejemplo de referencia
es [Autenticación](skills/product/monkey-compliance-council/references/arquitectura/autenticacion/04-historias.md).

```bash
# 1. Regenerar los diagramas UML (después de editar un .puml). Necesita Java 17+; baja PlantUML la primera vez.
skills/process/monkey-docs/scripts/render-uml.sh

# 2. Exportar a PDF las historias y los casos de uso de un módulo (portada, historias, diagrama y casos)
skills/process/monkey-docs/scripts/export-pdf.sh autenticacion
#    → exports/autenticacion-historias-y-casos-de-uso-<fecha>.pdf

# 3. O todos los módulos que ya los tienen
skills/process/monkey-docs/scripts/export-pdf.sh --all
```

El PDF necesita Node y Google Chrome. `exports/` y `tools/` no se versionan: el PDF es la entrega para el comité o un
auditor; la fuente es siempre el cerebro. En Jira, cada módulo tiene una épica «Historias · <Módulo>» con una historia por
`HU-…` (Autenticación: [MD-247](https://rod2408.atlassian.net/browse/MD-247)).

## Agentes

La sesión principal coordina (skill `monkey-dev-flow`); los subagentes trabajan y no se coordinan entre sí.

| Agente | Hace | No hace |
|---|---|---|
| `backend-senior` · `frontend-senior` | Implementan lo asignado, con las recetas del repo | Decidir alcance o prioridad |
| `frontend-design` | Sistema de diseño y que las dos apps se vean idénticas | Lógica, rutas, contratos |
| `qa` | Verifica el cambio contra su contrato; PASS o FAIL con el caso mínimo | Escribir código |
| `architecture-reviewer` | Revisa capas, imports, `withScope` y contrato; violaciones con `archivo:línea` | Reescribir código |
| `nestjs-reviewer` | Audita el diff del Backend con `nestjs-code-audit` (fronteras, seguridad, Prisma, rendimiento, pruebas), en paralelo con `qa` | Editar código |
| `docs-guardian` | Mantiene la documentación al día: enlaces, rutas, registros, índices, contratos frente al código | Tocar código o decidir |
| `product-owner` | Qué se construye y en qué orden (MUST / SHOULD / LATER / NO BUILD) | Tocar código |
| `wazuh-integration-expert` | Explica la sonda y su integración (solo lectura) | Actuar por su cuenta |

El formato de skills y agentes, cómo los carga Claude Code y las convenciones de diagramas están en
[`STANDARD.md`](STANDARD.md#10-formato-y-carga-en-claude-code).

> **Confidencial:** la sonda y el motor de nube no se nombran ante el cliente final (regla 1 de `CLAUDE.md`), y ningún
> archivo de credenciales se lee ni se copia (regla 2).
