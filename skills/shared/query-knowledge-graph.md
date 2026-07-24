---
id: query-knowledge-graph
name: Consultar los grafos de conocimiento sin gastar tokens de más
description: Cómo cualquier agente de monkey-brain-ai debe consultar backend/graphs-knowledge/ y frontend/graphs-knowledge/ — el brain nunca almacena su propia copia de los grafos, solo los lee de ahí, y siempre de la forma más barata posible.
type: skill
applies_to: [backend, frontend, product]
---

# Consultar los grafos de conocimiento sin gastar tokens de más

## Dónde viven los grafos (no en monkey-brain-ai)

`monkey-brain-ai` **no genera ni almacena grafos**. Cada repo de código tiene
los suyos, en una carpeta con la misma estructura:

```
<repo>/graphs-knowledge/
├── architecture.json          # grafo curado a mano: capas/módulos, normativo
├── architecture.md            # mismo grafo en Mermaid + explicación
└── graphify-out/               # grafo de conocimiento completo, generado con graphify
    ├── graph.html               # visualización interactiva
    ├── graph.json                # datos crudos (GraphRAG)
    ├── GRAPH_REPORT.md           # reporte en lenguaje llano
    ├── manifest.json             # manifest interno de graphify (--update)
    ├── cost.json                 # tracker de tokens de graphify
    └── .graphify_*                # archivos internos de graphify
```

Hoy existen dos: `../../backend/graphs-knowledge/` y
`../../frontend/graphs-knowledge/` (rutas relativas desde cualquier archivo
en `monkey-brain-ai/`, asumiendo la carpeta hermana estándar — ver
`context/project-context.md`).

## Regla de oro: el brain optimiza, no duplica

El propósito de que `monkey-brain-ai` lea estos grafos es **mejorar la
precisión de las respuestas y reducir el consumo de tokens** — nunca copiar
su contenido hacia acá. Si un agente necesita el grafo, lo consulta en su
ubicación real, cada vez. No se mantienen copias, resúmenes cacheados ni
snapshots dentro de `monkey-brain-ai`.

## Cómo consultar (de más barato a más caro)

1. **Pregunta puntual sobre el código** ("¿qué depende de X?", "¿qué
   compone la vista Y?", "¿esto viola la regla de capas?") →
   `graphify query "<pregunta>"` ejecutado con cwd en
   `<repo>/graphs-knowledge/` (usa el `graph.json` ya construido ahí, no
   reconstruye nada). Es la opción más barata: no carga el grafo completo,
   solo la porción relevante.
2. **Pregunta sobre qué es normativo/prohibido en la arquitectura** → lee
   directamente `architecture.md` (pequeño, curado a mano) — nunca
   `graphify-out/graph.json` para esto, es innecesariamente grande para una
   pregunta de reglas de capas.
3. **Pregunta exploratoria amplia** ("¿qué tan acoplado está esto?", "dame
   una vista general") → lee **solo las secciones relevantes** de
   `graphify-out/GRAPH_REPORT.md` (God Nodes, Surprising Connections,
   Suggested Questions, o la comunidad específica) — nunca el archivo
   completo de punta a punta si la pregunta es específica.
4. **Necesito ver la estructura visualmente** → abre
   `graphify-out/graph.html` en el navegador (no tiene costo de tokens,
   es para el usuario, no para que el agente "lea" el HTML).
5. **`graphify-out/graph.json` completo** → último recurso. Solo si de
   verdad hace falta procesar el grafo entero programáticamente (p. ej.
   para regenerar labels o correr análisis custom). Nunca para responder
   una pregunta conversacional.

## Cuándo regenerar (y quién lo hace)

Ningún agente regenera un grafo por su cuenta. El `tech-lead` es quien
detecta que un grafo quedó desactualizado y le pregunta al usuario (ver
`../../agents/tech-lead.md`, sección "Mantener el contexto y los grafos al
día"). Si el usuario confirma, se corre desde el propio repo:
```
cd <repo>/graphs-knowledge && graphify <ruta absoluta al repo> --update
```

## Resumen para cualquier agente nuevo

- Nunca leas `graph.json` completo para una pregunta que `graphify query`
  puede responder con una fracción de los tokens.
- Nunca copies contenido de un grafo hacia un archivo de `monkey-brain-ai` —
  el grafo vive y se consulta en su repo.
- Prefiere `architecture.md`/`.json` (pequeño, normativo) sobre
  `graphify-out/` (grande, exploratorio) cuando la pregunta es sobre reglas
  de capas, no sobre exploración abierta.
