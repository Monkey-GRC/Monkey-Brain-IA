# Modelo de datos — §2 Las 5 dimensiones

> Parte de [`modelo-datos.md`](../modelo-datos.md) (índice). **Qué responde:** El eje transversal que atraviesa todo el modelo. **Léelo:** Antes de tocar controles, tests o evidencias.
> Los números de sección (§) se conservan: cualquier cita a «§2» apunta aquí.

## 2. Las 5 dimensiones: el eje transversal

Este es el concepto que atraviesa todo el modelo. **Hay dos ejes distintos y confundirlos
rompe el cálculo.**

| Eje | Valores | Para qué sirve |
|---|---|---|
| **Dimensión** (técnica) | Documental/Política, Servidores, Bases de datos, Aplicación, Nube | Define **sobre qué activos** se evalúa un control. Un control se mide en cada dimensión que le aplica |
| **Categoría** (criterio de confianza) | Seguridad, Disponibilidad, Integridad del procesamiento, Confidencialidad, Privacidad | Define **bajo qué grupo** se suma el control para medir el marco |

Las categorías **son los criterios de confianza del marco** (`trust_criteria`, §3.1), y el servicio
contrata las que quiera. **Seguridad es la única obligatoria** en todo informe SOC 2 (sus criterios son los
Common Criteria, `CC`). El vocabulario es fijo: *dimensión* es solo el eje técnico y *categoría* es solo
el criterio de confianza.
Ejemplo: `C-01` aplica a las dimensiones **Servidores + Nube** (5 activos) y pertenece a la categoría **Disponibilidad**.

### Las 5 de scope

| Dimensión | Valor del enum | Nota |
|---|---|---|
| Documental / Política (Gobierno) | `policy` | Sin automatización posible: es revisión documental con IA |
| Servidores | `server` | La única con cobertura automática real hoy |
| Bases de datos | `database` | |
| Aplicación | `app` | **0 pruebas definidas todavía** (P9) |
| Nube | `cloud` | **0 checks todavía** (§9) |

**Qué activos entran al universo de cada dimensión** (MD-117): un test de una dimensión corre sobre los activos **vigentes del servicio** de ese tipo: `server` → servidores, `database` → bases de datos, `cloud` → servicios en nube y `app` → aplicaciones. La dimensión documental (`policy`) no tiene activos: se resuelve por evidencias. `endpoint`, `network_device` y `documentation` no son dimensión, así que no entran al universo de ningún test. Un test sin ningún activo de su dimensión queda `SIN ACTIVOS`: no cumple.

Se mantienen exactamente estas 5 (decisión D5). Endpoints y dispositivos de red **se
monitorean pero no son dimensiones**.

### Dónde vive la dimensión: en el control, no en el test

| Tabla | Cuántas dimensiones tiene |
|---|---|
| `controls` | Hasta 5 — una fila de `control_dimensions` por cada dimensión que le aplica (en el escenario del cliente, `client_control_dimensions`, §7.1) |
| `tests` | **Una sola.** El prefijo del código la encodea: `T-DOC-001` es documental, `T-SRV-007` es de servidores |
| `evaluations` | Una: la del test o check que se aplicó, sobre un activo concreto |

Es decir: **el control es el que se evalúa en las 5 dimensiones**; para cada dimensión que le
aplica se usan los tests de esa dimensión. Un control que aplica a Servidores + Nube usa
tests `T-SRV-*` y `T-CLD-*`, y produce evaluaciones en las dos dimensiones.

Lo confirma el reparto del catálogo: de los 61 TEST, **26 son documentales** y **11 son de
nube** — están segmentados por dimensión, no replicados en todas.

**Qué dimensiones exige cada control lo define el comité** en la hoja `Controles Monkey` (columnas L a P: con test = la exige; «NO APLICA» = no la exige, con su razón). Una dimensión exigida que se quede sin ningún test vigente deja el control `INCOMPLETO` (§9, D68). Sus cifras no coinciden con las 210 sembradas (`DT-69`).

Por cada dimensión de un control se define:

- **El tipo**: `manual` · `automated` · `hybrid` · **`technical_manual`** (decisión D4).
- **Si no aplica, la razón** (`reason_not_applicable`). Una dimensión que no aplica se
  declara con su justificación, no se omite.
- **Tres banderas**: `requires_probe`, `requires_ai` y
  **`requires_compliance_confirmation`** — el gate human-in-the-loop. La tercera decide si
  un porcentaje puede cerrar un control por sí solo.

**De dónde salen (D39):** el catálogo solo trae las dimensiones que **aplican** (las que tienen al menos una
prueba del control; 210 filas, ninguna de `app`), con el tipo y las banderas derivados de sus pruebas. **Esa cifra no coincide con las que define el comité** en `Controles Monkey` L a P (191): `DT-69`. Una
dimensión que no aplica se declara en el escenario del cliente (`client_control_dimensions`) con su
`reason_not_applicable`.

---
