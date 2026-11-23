# Modelo de datos — §2 Las 9 dimensiones

> Parte de [`modelo-datos.md`](../modelo-datos.md) (índice). **Qué responde:** El eje transversal que atraviesa todo el modelo. **Léelo:** Antes de tocar controles, pruebas o evidencias.
> Los números de sección (§) se conservan: cualquier cita a «§2» apunta aquí.

## 2. Las 9 dimensiones: el eje transversal

Este es el concepto que atraviesa todo el modelo. **Hay dos ejes distintos y confundirlos rompe el cálculo.**

| Eje | Valores | Para qué sirve |
|---|---|---|
| **Dimensión** (técnica) | Documental, Aplicación, Servidores, BD, Nube, Red, Endpoint, Físico y ambiental, Proceso | Dice **sobre qué** se prueba un control: qué activos, qué documentos o qué proceso |
| **Categoría** (criterio de confianza) | Seguridad, Disponibilidad, Integridad del procesamiento, Confidencialidad, Privacidad | Define **bajo qué grupo** se suma el control para medir el marco |

Las categorías **son los criterios de confianza del marco** (`trust_criteria`, §3.1), y el servicio contrata las que
quiera. **Seguridad es la única obligatoria** en todo informe SOC 2 (sus criterios son los Common Criteria, `CC`). El
vocabulario es fijo: *dimensión* es solo el eje técnico y *categoría* es solo el criterio de confianza.

### Las nueve

La VF18 pasa de 5 a 9 dimensiones (D129, RC-05) y las da **explícitas por control**.

| Dimensión | Valor del enum | Controles que la aplican | Pruebas | Nota |
|---|---|--:|--:|---|
| Documental | `policy` | 114 | 43 | Las 42 `T-DOC` y `T-OPS-1-01`; se resuelven con el módulo Documentos (§11) |
| Aplicación | `app` | 23 | 23 | |
| Servidores | `server` | 28 | 28 | La sonda |
| BD | `database` | 29 | 29 | La sonda |
| Nube | `cloud` | 36 | 36 | El motor de nube |
| Red | `network` | 22 | 22 | **Nueva** |
| Endpoint | `endpoint` | 12 | 12 | **Nueva** |
| Físico y ambiental | `physical` | 3 | 4 | **Nueva** |
| Proceso | `process` | — | 275 | **Nueva**. Es la dimensión de las pruebas de población y operativas (muestras, revisiones, actas); no tiene columna en `Controles Monkey` |

Los valores del enum de las cuatro nuevas son propuesta de desarrollo; se fijan en `contracts/enums/catalogo-maestro.md`.

**Endpoint y dispositivo de red** son además **tipos de activo** (`asset_type`), y lo siguen siendo: un test de esas
dimensiones corre sobre los activos vigentes del servicio de ese tipo, igual que servidores, BD y nube. Documental,
proceso y físico y ambiental no tienen activos: se resuelven con documentos, poblaciones, muestras e inspecciones.

### Dónde vive la dimensión

| Tabla | Cuántas dimensiones tiene |
|---|---|
| `controls` | Las que aplica: una fila de `control_dimensions` por cada una (en el escenario del cliente, `client_control_dimensions`, §7.1) |
| `tests` | **Una sola**, en su columna `dimension` (ya no se deduce del prefijo del código) |
| Resultados de checks | La del test que los usa, sobre un activo concreto |

**Qué dimensiones aplica cada control lo dice el comité** en las columnas «TEST …» de `Controles Monkey` («Definido» o
«N/A»), y ya no se derivan de las pruebas (D129, que reemplaza D39). Por eso `control_dimensions` guarda solo la
dimensión: el tipo es del control (manual, manual dependiente de TI o automático, §3.2) y no cambia el cálculo, y las
banderas que D39 había derivado (`requires_probe`, `requires_ai`, `requires_compliance_confirmation`) se retiran. El
cálculo ya no mide «dimensiones exigidas»: mide los **requisitos del control** y sus pruebas (§9); la suficiencia de
la prueba técnica por dimensión es S-01 a S-05.

---
