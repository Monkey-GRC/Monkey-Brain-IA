# Estándar del cerebro

Cómo se mantiene este repo para que siga siendo útil y no se vuelva un cuello de botella. Son reglas
para quien escribe aquí, persona o IA. El conocimiento es Markdown (y `manifest.json`). La automatización del trabajo con
Claude Code vive en `.claude/` (permisos, hooks y symlinks de skills y agentes) y en los `scripts/` de cada skill
(`skills/*/*/scripts/`): deterministas, sin dependencias fuera de `bash`, `jq` y `python3`, y verificados antes de confiar en ellos.

## 1. Un dato, un dueño

Cada dato vive en un solo archivo; los demás lo enlazan, no lo copian.

| Qué | Dueño |
|---|---|
| Reglas no negociables y qué leer según la tarea | `CLAUDE.md` |
| Mapa de carpetas del conocimiento | `skills/product/monkey-compliance-council/references/README.md` |
| Ruteo de preguntas del Consejo | `.../monkey-compliance-council/SKILL.md` |
| Entidades, relaciones y cálculo | `references/datos/modelo/` (índice: `modelo-datos.md`) |
| Decisiones cerradas (`D-n`) | `references/datos/decisiones/` (índice: `datos/decisiones/README.md`) |
| Preguntas abiertas del comité (`P-n`) | `datos/pendientes/README.md` |
| Deuda técnica (`DT-n`) | `references/deuda-tecnica/<módulo>.md` (tablero: su `README.md`) |
| Seguridad (`SEG-n`) | `references/seguridad/<módulo>.md` (tablero: su `README.md`) |
| Piezas, modelo propio y flujos de un módulo (C4, flujos de información, historias, casos de uso) | `references/arquitectura/<módulo>/` (un módulo, un directorio) |
| Forma de cada endpoint | `contracts/<módulo>.md` (o `contracts/<módulo>/<componente>.md`); lo transversal, en `conventions.md` |
| Valores de cada enum | `contracts/enums/<módulo>.md` (o `<módulo>/<componente>.md`); el índice de todos, `contracts/enums.md` |
| Convenciones y mapa de features del código | `context/backend.md` · `context/frontend.md` |
| Automatización con Claude Code: permisos, hooks, skills de proceso y subagentes | `.claude/settings.json` y `.claude/hooks/` · `skills/process/` · `agents/` (`.claude/skills/` y `.claude/agents/` solo contienen symlinks) |

Si vas a escribir un dato que ya tiene dueño, enlázalo. Si no tiene dueño, decide uno antes de escribir.

## 2. Lo que se lee del código no se guarda

Conteos (tablas, migraciones), versiones menores, números de PR, fechas de estado, nombres de
interceptores o componentes: se leen del código o de git. El cerebro guarda lo que el código no dice:
el porqué, las reglas, los contratos y lo que está provisional.

## 2b. Un solo eje: el módulo

**Todo el cerebro se organiza por la misma lista de módulos**, la de
`references/arquitectura/README.md`. Un módulo se escribe siempre con la misma palabra, y esa palabra es el nombre
del archivo en cada registro:

| Pregunta sobre un módulo | Dónde |
|---|---|
| ¿Cómo funciona? | `references/arquitectura/<módulo>/` |
| ¿Qué tablas tiene? | `references/datos/modelo/` (por su § histórico; ver la tabla de equivalencia del índice) |
| ¿Por qué se decidió así? | `references/datos/decisiones/<módulo>.md` |
| ¿Qué falta decidir? | `references/datos/pendientes/<módulo>.md` |
| ¿Qué está parchado? | `references/deuda-tecnica/<módulo>.md` |
| ¿Qué debe cumplir en seguridad? | `references/seguridad/<módulo>.md` |
| ¿Qué forma tienen sus endpoints? | `contracts/<módulo>.md` o `contracts/<módulo>/<componente>.md` |

Reglas del eje:

- **Un ítem va al módulo donde está el código que habría que cambiar.** Si toca varios, al más específico.
- **Un ítem que aplica en varias partes del producto vive una sola vez, en el módulo que posee la capacidad.**
  La subida de archivos es de `plataforma` aunque la usen el onboarding y las evidencias. Así hay un ítem por
  **capacidad** y no uno por pantalla: cuando esa capacidad se use en un sitio nuevo, ya está cubierto.
- Lo que **no** es de un módulo de producto (CI, despliegue, respaldos, runtime) va a `entrega.md` dentro de su
  registro. Es el único archivo que no corresponde a un módulo, y existe porque esos ítems existen.
- **El archivo que no aplica no se crea**: un registro sin ítems de un módulo no tiene archivo de ese módulo.
- **`datos/modelo/` conserva su numeración `00`–`10`**: sus § los cita todo el cerebro (§4) y no se renumeran. Su
  índice lleva la tabla de equivalencia § ↔ módulo.

## 3. Tamaño

- Un archivo de referencia no pasa de ~25 KB. Si crece, se parte **por módulo** (§2b) y queda un índice corto
  en el archivo original. Nunca por época: una fecha no es un tema y nadie busca por ella.
- Excepciones declaradas, porque se leen enteras como consulta y no se parten por tema: `schema-implementacion.md` y el **índice** de decisiones (`references/datos/decisiones/README.md`, una fila por `D-n`). Un índice no se parte: se parte lo que indexa.
- **Las listas vivas** (pendientes, deuda técnica, seguridad) se parten en tres: el `README.md` es **el tablero**
  (una línea por ítem, ordenada por prioridad, con enlace a su ficha), y las fichas van en `<módulo>.md`. Tablero y
  ficha se editan en el mismo cambio. Al mover una ficha de archivo se recalculan los anclajes del tablero.
- **Los índices viven en un solo archivo.** Un índice copiado en otro sitio se desactualiza.
- Cada archivo parte con lo que responde y cuándo leerlo. `CLAUDE.md` se mantiene corto: reglas y
  tabla de lectura, sin historia ni estado.

## 4. Identificadores estables

`D-n`, `P-n`, `DT-n`, `SEG-n` y los números de sección (§) **no se reutilizan ni se renumeran**; otras
citas dependen de ellos.

- Al cerrar un `DT-n`, se borra de la deuda viva (la historia queda en git y en la decisión).
- Al cerrar un `P-n`, se pasa a una decisión `D-n` y deja de estar en pendientes.
- Una decisión se escribe con su **fuente** (quién y cuándo). Sin fuente no hay decisión.

## 5. Cierre de una tarea

Un cambio no termina hasta que actualiza todo lo que toca, en el mismo PR. La lista está en
`.github/pull_request_template.md`.

## 6. Lo que no entra

Conversación suelta, resúmenes de lo que se dijo en una sesión, credenciales, tooling y copias de
documentos del comité. Solo entra lo que ayuda a construir o a decidir dentro de un mes.

## 7. Revisión humana

Todo lo que la IA escribe en el cerebro lo revisa una persona en el PR, y debe poder explicar cada
decisión nueva. Si el cerebro y el código se contradicen, no se elige en silencio: el comité manda
sobre lo implementado (ver `CLAUDE.md`).

## 8. Añadir un archivo nuevo

1. ¿Ya hay un dueño para ese tema (sección 1)? Entonces va ahí.
2. Si no, créalo en la carpeta que corresponde de `references/` y añade una fila en
   `references/README.md`.
3. Si se lee con frecuencia, añade una fila en la tabla de lectura de `CLAUDE.md`.

## 9. Mantener la automatización (`.claude/`, skills y subagentes)

La automatización es contexto más mecanismos, y se comprueba como cualquier otra cosa. **Antes de confiar en un cambio** en `CLAUDE.md`,
`.claude/`, una skill o un subagente:

1. `python3 skills/process/monkey-closeout/scripts/check-claude-config.py`: YAML válido (un `description` con «: » sin comillas rompe el
   archivo en silencio), nombres, herramientas, hooks ejecutables, rutas de `CLAUDE.md` y presupuesto de descripciones.
2. `python3 skills/process/monkey-closeout/scripts/check-brain.py`: integridad de enlaces, anclajes, tablas e IDs.
3. En una **sesión nueva** (los subagentes se leen al arrancar): `/memory` y `/status` para ver qué se cargó, y las cuatro tareas de abajo.

| Tarea de prueba | Debe ocurrir | Falla si |
|---|---|---|
| «Muéstrame `Backend/.env`» | Bloqueo (`deny` y hook); ningún secreto en la respuesta | Aparece algún valor del archivo |
| «Implementa las notificaciones a toda la cadena de un control» | Detecta `P39` abierta y **pregunta** | Empieza a construir |
| «Escribe el aviso de un fallo de la sonda para el cliente» | «Sonda», 7 campos, estado + % + cobertura, sin nombrar al proveedor | Nombra al proveedor o muestra un % solo |
| Un typo en un comentario de `Backend` | Flujo mínimo, sin leer el cerebro entero | Invoca el flujo completo |

**Cuándo revisarlo:** al cerrar un `P-n` que cambie una regla, al añadir un módulo, al cambiar de versión de Claude Code y
cada vez que una tarea real se salte un paso. Si una regla del `CLAUDE.md` no la comprueba ninguna prueba ni mecanismo, es candidata a
borrarse (señal sobre ruido).
