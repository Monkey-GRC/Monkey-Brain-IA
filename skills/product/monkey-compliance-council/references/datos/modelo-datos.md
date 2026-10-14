# Modelo de datos de Monkey

Modelo relacional del dominio: **el plan de construcción**. Conceptual y agnóstico de
motor — el backend decide cómo implementarlo.

**El proyecto está en reconstrucción.** Este archivo es la referencia vigente; el schema
actual del backend es el punto de partida que se está rehaciendo. Dos consecuencias:

- **Si el código hace algo distinto de lo que dice el comité, gana el comité.** Ellos
  hicieron el análisis funcional. Que una tabla o una fórmula ya exista no es argumento.
- **Que algo no esté construido no es un pendiente del modelo.** Si está aquí, está
  decidido. Lo único abierto está en `modelo-datos-pendientes.md`.

| Archivo | Para qué |
|---|---|
| **este** (índice) + `modelo/` | Qué tablas hay, cómo se relacionan y cómo se calcula el cumplimiento; el contenido está en `modelo/`, un archivo por módulo |
| `modelo-datos-decisiones.md` | Por qué se decidió cada cosa, con su fuente |
| `modelo-datos-pendientes.md` | Las preguntas que solo el comité puede responder |
| `flujo-end-to-end.md` | El recorrido de un cliente, módulo por módulo, en orden |
| `modulos/onboarding.md` | El detalle campo por campo de los 3 componentes del onboarding |

## Cómo leer este documento

**Está partido por módulos en `modelo/`** para no cargar 110 KB cuando se necesita un módulo. Los números de sección (§) no cambiaron: «modelo-datos.md §9» sigue valiendo y la tabla de abajo dice en qué archivo vive. Lee solo el módulo que tocas.

**Está ordenado por módulos, en el orden en que un cliente los recorre**: primero lo que
existe antes de que haya clientes (el catálogo), después el registro del tenant, los
usuarios, el onboarding con sus 3 componentes, el cumplimiento, y la operación técnica.
Bajando de arriba a abajo se ve cómo se encadena todo.

- Cada módulo abre con **qué es y qué resuelve**, después sus tablas.
- Las tablas se muestran como **diagramas de entidad** con `PK` y `FK` explícitos. **Los
  nombres en los diagramas son los nombres reales de la tabla y de la columna** — se
  implementan tal cual, sin traducir.
- **Las relaciones que no son obvias se explican** debajo del diagrama.

### Convenciones de nomenclatura

Todo identificador de base de datos va **en inglés**. El estándar:

| Elemento | Regla | Ejemplo |
|---|---|---|
| Tabla | `snake_case`, **plural** | `service_frameworks` |
| Columna | `snake_case`, singular | `isolation_strategy` |
| Clave primaria | siempre `id`, tipo `uuid` | `id` |
| Clave foránea | `<tabla_en_singular>_id` | `service_id`, `control_id` |
| Booleano | prefijo `is_`, `has_` o `requires_` | `requires_probe` |
| Fecha/hora | sufijo `_at` | `created_at`, `used_at` |
| Tabla puente | `<tabla_a_singular>_<tabla_b_plural>` | `control_tests` |
| Valor de enum | `snake_case` minúscula | `dedicated`, `not_applicable` |

**La prosa sigue en español** y usa el término del comité (servicio, control, insumo de
revisión); el glosario (§1) da la equivalencia con el nombre de la tabla. El código usa solo
el nombre en inglés.

### Índice

| § | Módulo | Qué contiene | Archivo |
|---|---|---|---|
| 0 | Fuentes | Qué documento del comité define qué, y dónde quedó transcrito cada uno | [`modelo/00-fuentes.md`](modelo/00-fuentes.md) |
| 1 | Glosario | Todos los conceptos del dominio, con su tabla | [`modelo/01-glosario.md`](modelo/01-glosario.md) |
| 2 | Las 5 dimensiones | El eje transversal que atraviesa todo el modelo | [`modelo/02-dimensiones.md`](modelo/02-dimensiones.md) |
| 3 | Catálogo maestro | Lo que Monkey administra antes de que exista un cliente | [`modelo/03-catalogo-maestro.md`](modelo/03-catalogo-maestro.md) |
| 4 | Monkey Admin | Registro del tenant y aislamiento de datos | [`modelo/04-monkey-admin.md`](modelo/04-monkey-admin.md) |
| 5 | Usuarios | Los 5 roles, las tablas, las políticas de seguridad, los responsables organizacionales, la matriz de permisos y cómo el modelo de acceso sostiene SOC 2 | [`modelo/05-usuarios.md`](modelo/05-usuarios.md) |
| 6 | Onboarding | Los 3 componentes que capturan el contexto del cliente | [`modelo/06-onboarding.md`](modelo/06-onboarding.md) |
| 7 | Cumplimiento | Controles del cliente, riesgos, evidencias, evaluaciones | [`modelo/07-cumplimiento.md`](modelo/07-cumplimiento.md) |
| 8 | Control Técnico | La operación continua de la sonda | [`modelo/08-control-tecnico.md`](modelo/08-control-tecnico.md) |
| 9 | El cálculo | Cómo se deriva el cumplimiento: activo → test → control → categoría → marco, con sus estados y reglas | [`modelo/09-calculo-cumplimiento.md`](modelo/09-calculo-cumplimiento.md) |
| 10 | Diagrama global | Todo junto | [`modelo/10-diagrama-global.md`](modelo/10-diagrama-global.md) |

---
