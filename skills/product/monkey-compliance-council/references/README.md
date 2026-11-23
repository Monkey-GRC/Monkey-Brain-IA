# Referencias del Brain — mapa

Si buscas algo, empieza por la **carpeta** que corresponde a la parte de la aplicación. El enrutador es `../SKILL.md`; este mapa
es la versión por carpetas.

| Carpeta | Qué hay | Pregunta que responde |
|---|---|---|
| [`producto/`](producto/) | `philosophy` · `mvp-roadmap` · `council` · `flujo-end-to-end` · `sprint-onboarding` · `sprint-cumplimiento` | ¿Cómo le habla Monkey al usuario? ¿Qué se construye primero? ¿Cómo se recorre un cliente de punta a punta? |
| [`arquitectura/`](arquitectura/README.md) | `architecture` · el C4 del sistema (`c4-contexto`, `c4-contenedores`, `c4-componentes`) · **un directorio por módulo**, con sus componentes dentro: acceso, empresas, catálogo maestro (con [`marcos/`](arquitectura/catalogo-maestro/marcos/README.md), qué exige cada marco), onboarding, control técnico (con [`motores/`](arquitectura/control-tecnico/motores/README.md)), cumplimiento, [`documentos`](arquitectura/documentos/README.md) (módulo 18, D133), y lo transversal | ¿Cuáles son los 4 motores y el stack? ¿Qué piezas tiene Monkey y cómo se hablan? ¿Cómo funciona cada módulo por dentro? ¿Qué exige SOC 2 o ISO 27001? |
| [`datos/`](datos/README.md) | `modelo-datos` + [`modelo/`](datos/modelo/) (§ intactos, hasta [`11-documentos.md`](datos/modelo/11-documentos.md)) · `schema-implementacion` · [`decisiones/`](datos/decisiones/README.md) y [`pendientes/`](datos/pendientes/README.md), **un archivo por módulo** | ¿Qué tablas hay, cómo se implementan, por qué se decidió así y qué falta decidir? |
| [`seguridad/`](seguridad/README.md) | tablero + **un archivo por módulo** (`SEG-n`) | ¿Qué debe cumplir el producto en seguridad y qué está realmente comprobado? |
| [`deuda-tecnica/`](deuda-tecnica/README.md) | tablero + **un archivo por módulo** (los mismos nombres que `arquitectura/`) | ¿Qué está parchado o a medias (`DT-n`)? |

El **índice navegable de toda la arquitectura**, numerado y en orden de lectura, está en
[`arquitectura/README.md`](arquitectura/README.md). Esa misma lista de módulos es el eje de todo el cerebro
(`STANDARD.md` §2b): el nombre del módulo es el nombre del archivo en cada registro.

Fuera de esta carpeta: `../../../../contracts/` (la forma exacta de cada endpoint, **también por módulo**). **Por encima de todo** están los documentos del comité en `assets/`.

**Los cuatro identificadores estables** (nunca se reutilizan ni se renumeran): `D-n` decisiones · `P-n` pendientes del comité ·
`DT-n` deuda técnica · `SEG-n` requisitos de seguridad.
