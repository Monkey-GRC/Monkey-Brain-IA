# Datos — el modelo relacional

Todo lo que dice **qué tablas hay, cómo se relacionan, por qué son así y cómo se implementan en el Backend**. Es la referencia
obligada antes de tocar el schema o cualquier cálculo de cumplimiento (regla de `CLAUDE.md`).

| Archivo | Qué responde | Cuándo se lee |
|---|---|---|
| [`modelo-datos.md`](modelo-datos.md) (índice) + [`modelo/`](modelo/) | **El qué:** entidades, PK/FK, cardinalidades, dimensiones, tests, evidencias, exclusiones y cómo se calcula el cumplimiento, **ordenado por módulos** | Antes de construir cualquier pantalla, endpoint o cálculo: abre el índice y **solo el módulo que tocas** |
| [`schema-implementacion.md`](schema-implementacion.md) | **El cómo:** Prisma 7, RLS, roles, variables de entorno, migraciones y despliegue | Antes de tocar el schema, una migración o el `.env` |
| [`decisiones/`](decisiones/README.md) | **El porqué** de cada decisión ya cerrada (`D-n`), con su fuente. Índice en su `README.md`, fichas en un archivo por módulo | Si alguien quiere reabrir algo; no para construir |
| [`pendientes/`](pendientes/README.md) | Lo que **todavía no está decidido** y solo el comité puede responder (`P-n`). Tablero en su `README.md`, fichas por módulo | Antes de construir algo que dependa de una; si sigue ahí, se pregunta, no se resuelve solo |

Por encima de todo están los documentos del comité en `assets/`: si un `.md` y el documento fuente se contradicen, gana el documento
(ver §0 de `modelo-datos.md`). Dos reglas estructurales que no se violan: el **control es atómico e independiente del marco**, y el
**cumplimiento de un marco se deriva**, nunca se almacena.

Lo parchado por desarrollo no vive aquí sino en [`../deuda-tecnica/`](../deuda-tecnica/README.md); los requisitos de seguridad, en
[`../seguridad/`](../seguridad/README.md). **Los diagramas de entidad son de aquí**: `../arquitectura/<módulo>/02-modelo.md` no los
redibuja, los enlaza y añade lo que falte. Cómo funciona cada módulo por dentro (piezas, flujos de información) es
[`../arquitectura/`](../arquitectura/README.md).

## Cómo citar y dónde buscar

- **«§N.x» de `modelo-datos.md`** vive en el archivo del módulo N, dentro de `modelo/` (la tabla de `modelo-datos.md` los relaciona). Los números de sección no se cambian.
- **«D-n»** se busca en el índice de [`decisiones/README.md`](decisiones/README.md), cuya columna *Archivo* dice en qué archivo de módulo está. Los IDs no se reutilizan ni se renumeran.
- Los índices viven **solo** en esos dos archivos; aquí no se copian, porque una copia se desactualiza (esta ya había perdido D59–D61).
