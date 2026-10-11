# Estándar del cerebro

Cómo se mantiene este repo para que siga siendo útil y no se vuelva un cuello de botella. Son reglas
para quien escribe aquí, persona o IA. El cerebro es solo Markdown (y `manifest.json`): sin scripts,
hooks ni workflows.

## 1. Un dato, un dueño

Cada dato vive en un solo archivo; los demás lo enlazan, no lo copian.

| Qué | Dueño |
|---|---|
| Reglas no negociables y qué leer según la tarea | `CLAUDE.md` |
| Mapa de carpetas del conocimiento | `skills/product/monkey-compliance-council/references/README.md` |
| Ruteo de preguntas del Consejo | `.../monkey-compliance-council/SKILL.md` |
| Entidades, relaciones y cálculo | `references/datos/modelo/` (índice: `modelo-datos.md`) |
| Decisiones cerradas (`D-n`) | `references/datos/decisiones/` (índice: `modelo-datos-decisiones.md`) |
| Preguntas abiertas del comité (`P-n`) | `references/datos/modelo-datos-pendientes.md` |
| Deuda técnica (`DT-n`) · seguridad (`SEG-n`) | `references/deuda-tecnica/` · `references/seguridad/requisitos.md` |
| Forma de cada endpoint y enum | `contracts/` |
| Convenciones y mapa de features del código | `context/backend.md` · `context/frontend.md` |

Si vas a escribir un dato que ya tiene dueño, enlázalo. Si no tiene dueño, decide uno antes de escribir.

## 2. Lo que se lee del código no se guarda

Conteos (tablas, migraciones), versiones menores, números de PR, fechas de estado, nombres de
interceptores o componentes: se leen del código o de git. El cerebro guarda lo que el código no dice:
el porqué, las reglas, los contratos y lo que está provisional.

## 3. Tamaño

- Un archivo de referencia no pasa de ~25 KB. Si crece, se parte **por módulo o por época** y queda un
  índice corto en el archivo original.
- Excepción conocida: `schema-implementacion.md`, que se lee entero como consulta.
- **Las listas vivas** (pendientes, deuda técnica, seguridad) llevan arriba un tablero ordenado por prioridad y, debajo, una ficha por ítem. Tablero y ficha se editan en el mismo cambio.
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
