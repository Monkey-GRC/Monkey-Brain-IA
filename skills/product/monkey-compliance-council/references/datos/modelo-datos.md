# Modelo de datos de Monkey

Modelo relacional del dominio: **el plan de construcción**. Conceptual y agnóstico de
motor — el backend decide cómo implementarlo.

**El proyecto está en reconstrucción.** Este archivo es la referencia vigente; el schema
actual del backend es el punto de partida que se está rehaciendo. Dos consecuencias:

- **Si el código hace algo distinto de lo que dice el comité, gana el comité.** Ellos
  hicieron el análisis funcional. Que una tabla o una fórmula ya exista no es argumento.
- **Que algo no esté construido no es un pendiente del modelo.** Si está aquí, está
  decidido. Lo único abierto está en `datos/pendientes/README.md`.

| Archivo | Para qué |
|---|---|
| **este** (índice) + `modelo/` | Qué tablas hay, cómo se relacionan y cómo se calcula el cumplimiento; el contenido está en `modelo/`, un archivo por módulo |
| `datos/decisiones/README.md` | Por qué se decidió cada cosa, con su fuente |
| `datos/pendientes/README.md` | Las preguntas que solo el comité puede responder |
| `flujo-end-to-end.md` | El recorrido de un cliente, módulo por módulo, en orden |
| `arquitectura/onboarding/README.md` | El detalle campo por campo de los 3 componentes del onboarding |

## Cómo leer este documento

**Está partido por módulos en `modelo/`** para no cargar 170 KB cuando se necesita un módulo. Los números de sección (§) no cambiaron: «modelo-datos.md §9» sigue valiendo y la tabla de abajo dice en qué archivo vive. Lee solo el módulo que tocas.

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
| 2 | Las 9 dimensiones | El eje transversal que atraviesa todo el modelo | [`modelo/02-dimensiones.md`](modelo/02-dimensiones.md) |
| 3 | Catálogo maestro | Lo que Monkey administra antes de que exista un cliente: el catálogo v2 de la VF18 (D129) | [`modelo/03-catalogo-maestro.md`](modelo/03-catalogo-maestro.md) |
| 4 | Monkey Admin | Registro del tenant y aislamiento de datos | [`modelo/04-monkey-admin.md`](modelo/04-monkey-admin.md) |
| 5 | Usuarios | Los roles, las tablas, las políticas de seguridad, los responsables organizacionales, la matriz de permisos y cómo el modelo de acceso sostiene SOC 2 | [`modelo/05-usuarios.md`](modelo/05-usuarios.md) |
| 6 | Onboarding | Los 3 componentes que capturan el contexto del cliente | [`modelo/06-onboarding.md`](modelo/06-onboarding.md) |
| 7 | Cumplimiento | Controles del cliente, riesgos, evidencias, evaluaciones | [`modelo/07-cumplimiento.md`](modelo/07-cumplimiento.md) |
| 8 | Control Técnico | La operación continua de la sonda | [`modelo/08-control-tecnico.md`](modelo/08-control-tecnico.md) |
| 9 | El cálculo | Cómo se deriva el cumplimiento (activo → check → test → requisito del control → control → categoría → marco) y el riesgo, con sus estados, reglas y parámetros (`MAP CALOR`, D130) | [`modelo/09-calculo-cumplimiento.md`](modelo/09-calculo-cumplimiento.md) |
| 10 | Diagrama global | Todo junto | [`modelo/10-diagrama-global.md`](modelo/10-diagrama-global.md) |
| 11 | Documentos | El documento del catálogo y el de la empresa: versiones, aprobación y aceptación (D133) | [`modelo/11-documentos.md`](modelo/11-documentos.md) |
| 12 | Notificaciones | Los avisos de cada persona (campana, 90 días), su preferencia de correo y el resumen diario (D143, D151) | [`modelo/12-notificaciones.md`](modelo/12-notificaciones.md) |

### Equivalencia § ↔ módulo de arquitectura

Los § **no se renumeran** (todo el cerebro los cita), pero el resto del cerebro se organiza por módulo
(`STANDARD.md` §2b). Esta tabla es el puente: dado un §, qué módulos de
[`arquitectura/`](../arquitectura/README.md) lo documentan por dentro.

| § | Módulo de arquitectura |
|---|---|
| 0, 1, 2, 10 | Transversales al modelo; sin módulo propio. §2 (dimensiones) lo usan [Cumplimiento](../arquitectura/cumplimiento/README.md) y [Catálogo maestro](../arquitectura/catalogo-maestro/README.md) |
| 3 | [Catálogo maestro](../arquitectura/catalogo-maestro/README.md) |
| 4.1 a 4.2b | [Empresas](../arquitectura/empresas/README.md) |
| 4.3 y 4.4 | [Aislamiento multi-tenant](../arquitectura/aislamiento-tenant/README.md) |
| 5.1, 5.5 | [Roles y permisos](../arquitectura/roles-permisos/README.md) |
| 5.2 (usuarios, reparto) | [Gestión de usuarios](../arquitectura/gestion-usuarios/README.md) |
| 5.2 (sesiones, códigos) y 5.3 | [Autenticación](../arquitectura/autenticacion/README.md) |
| 5.2 (`audit_logs`) | [Trazabilidad](../arquitectura/trazabilidad/README.md) |
| 5.4 | [Contexto organizacional](../arquitectura/onboarding/contexto-organizacional/README.md) (los cargos) |
| 6.1 · 6.2 · 6.3 | [Contexto organizacional](../arquitectura/onboarding/contexto-organizacional/README.md) · [Contexto del servicio](../arquitectura/onboarding/contexto-servicio/README.md) · [Conexión de activos](../arquitectura/onboarding/conexion-activos/README.md) |
| 6.3 (`integrations`) | [Integraciones](../arquitectura/integraciones/README.md) |
| 7.1 a 7.3, 7.6 | [Cumplimiento](../arquitectura/cumplimiento/README.md) y sus componentes |
| 7.2 | [Cumplimiento · Riesgos](../arquitectura/cumplimiento/riesgos/README.md) |
| 7.4 | [Trazabilidad](../arquitectura/trazabilidad/README.md) (eventos) y [Cumplimiento](../arquitectura/cumplimiento/README.md) (evaluaciones) |
| 8 | [Control técnico](../arquitectura/control-tecnico/README.md) |
| 9 | [Cumplimiento · Motor](../arquitectura/cumplimiento/motor/README.md) |
| 11 | [Documentos](../arquitectura/documentos/README.md) |

---
