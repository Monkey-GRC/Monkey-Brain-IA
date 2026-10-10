# Modelo de datos — §9 El cálculo

> Parte de [`modelo-datos.md`](../modelo-datos.md) (índice). **Qué responde:** Cómo se deriva el cumplimiento: dimensión → control → categoría → marco. **Léelo:** Antes de tocar cualquier cálculo o pantalla de porcentaje.
> Los números de sección (§) se conservan: cualquier cita a «§9» apunta aquí.

## 9. Cómo se calcula el cumplimiento

Regla del responsable de producto (D62), basada en cómo se mide SOC 2. Ante una duda de cálculo, manda esta sección.

### Los niveles

SOC 2 se compone de **5 categorías**; cada categoría, de **controles**; y cada control se evalúa con **tests** en hasta **5 dimensiones**.

```
1. TEST        se aplica a UN activo → compliant · non_compliant · pending · not_applicable
2. DIMENSIÓN   del control: CUMPLE solo si todos sus tests con resultado, sobre todos sus activos, cumplen
3. CONTROL     % = dimensiones que cumplen / dimensiones que le aplican        ESTADO: cumple solo al 100%
4. CATEGORÍA   % = controles que cumplen / controles aplicables                LOGRADA: solo al 100%
5. MARCO       % = categorías logradas / categorías contratadas                (por servicio)
```

Cada nivel **cuenta lo cumplido contra el total**: nunca promedia los porcentajes del nivel de abajo.
Las 5 dimensiones son documental/política, servidores, bases de datos, aplicación y nube; las 5 categorías, seguridad,
disponibilidad, integridad del procesamiento, confidencialidad y privacidad (§2).

### El ejemplo resuelto

Un control «Acceso MFA» se evalúa en las 5 dimensiones. Si falla **una**, el control está al **80%**
(4 de 5) y **no cumple**. Una categoría con 10 controles de los que fallan 5 está al **50%**. El servicio contrata las 5
categorías y solo 1 está al 100%: el marco está al **20%** (1 de 5). Otro caso: una categoría con 156 controles de los que
fallan 45 está al **71,15%** ((156 − 45) / 156).

### Las reglas

| # | Regla |
|---|---|
| R-01 | Cumplimiento únicamente sobre el **scope del servicio** |
| R-02 | Cada control define las **dimensiones y los activos que le aplican** |
| R-03 | Manual: la evidencia sustenta, **el consultor evalúa** |
| R-04 | Automático: la sonda entrega el resultado, **Monkey interpreta el criterio** |
| R-05 | **Una dimensión cumple solo si todos sus tests con resultado, sobre todos sus activos aplicables, cumplen.** Una falla ⇒ esa dimensión no cumple, y el control con ella |
| R-06 | **Solo se mide lo que tiene resultado.** Un test `pending` no es un fallo ni un cumplido: no afecta ningún cálculo hasta que tenga resultado. Una dimensión sin ningún resultado queda «sin medir» y no entra al control; un control sin dimensiones medidas, tampoco entra a la categoría |
| R-07 | **`not_applicable`** se excluye igual: una dimensión que no aplica a un control no entra al denominador de ese control |
| R-08 | **% control = dimensiones que cumplen / dimensiones aplicables.** El control **cumple solo al 100%** |
| R-09 | **% categoría = controles que cumplen / controles aplicables.** La categoría **se logra solo al 100%**. Una categoría con controles aplicables pero ninguno medido **no está lograda** y cuenta en el denominador del marco; una sin ningún control aplicable queda **anulada** y no entra |
| R-10 | **% del marco = categorías logradas / categorías contratadas.** Es el número final del servicio sobre cada marco que se evalúa |
| R-11 | **Mitigación: indicador separado** |
| R-12 | **Riesgo residual: cálculo separado.** *"No sustituir por % cumplimiento"* |

### Lo que estas reglas zanjan

**El cumplimiento es binario en cada nivel, y el porcentaje es el diagnóstico.** Un control al 80%, una categoría al 99% y un
marco al 80% **están fallando**: la certificación existe solo cuando todo está al 100%. Al cliente se le muestra el porcentaje
real de cada nivel (una categoría al 99% se ve como 99%) **dejando claro que falla y qué le falta**; el 1% que falta es lo que la
convierte en lograda. Nunca se redondea hacia arriba ni se «perdona» una falla.

**Los controles propios del cliente cuentan.** Un control propio, aunque esté pendiente de aprobación, entra a su categoría (§7.1).

**Peso igual en todos los niveles.** Un control vale lo mismo que cualquier otro de su categoría, y una categoría vale lo mismo
que cualquier otra del marco. No se pondera por nivel de riesgo ni por número de activos (B1, D2).

**El denominador del marco son las categorías que el servicio contrató.** Si contrata solo Seguridad y Disponibilidad y falla
una, el marco está al 50%. Seguridad es la única categoría obligatoria en SOC 2.

**No hay porcentaje de la empresa.** La unidad de medida es el par **(servicio × marco)**: con 3 servicios con SOC 2 hay 3
porcentajes y ninguno se promedia con otro. El mismo control puede cumplir en un servicio y fallar en otro, porque se evalúa
sobre insumos distintos. **La interfaz nunca muestra un número único de «cumplimiento de la empresa»: no existe.**

**Las exclusiones cambian el denominador solo si están justificadas y aprobadas** (`exclusions`). Un check que sale por
omisión es un agujero.

**El requisito es binario** (B2): se cumple cuando todos sus controles cumplen. Sirve para la trazabilidad y para el reporte del
auditor (*«¿qué evidencia tengo para CC6.1?»*); **no participa del porcentaje**, que va control → categoría → marco.

### El semáforo cualitativo

Es lo que el usuario ve primero (`philosophy.md`); el porcentaje queda como dato secundario. Se aplica al % de una categoría, al % del marco de un servicio
y al de un **activo** (tests con resultado cumplidos / tests con resultado):

| Estado | Cuándo |
|---|---|
| **Preparado** | 100% y **nada pendiente** |
| **Casi listo** | de 80% a menos de 100%; o 100% de lo medido pero con algo aún pendiente |
| **Requiere trabajo** | menos de 80% |
| **Sin medir** | no hay nada con resultado todavía: es un hueco de cobertura, no un fallo |

**La cobertura va siempre al lado del porcentaje, como número aparte:** es qué parte de lo que debería medirse ya tiene resultado. Un 100% con cobertura de 40% se
muestra como «100% de lo medido · cobertura 40%», nunca como Preparado.

### La trazabilidad de una falla

Modelo de navegación del producto, con **responsable y tratamiento en cada nivel**. Es lo que se le muestra a `admin_empresa`
y `funcional` (en qué falla y su porcentaje); los códigos técnicos solo los ve el auditor (D63):

| Nivel | Lleva a | Responsable | Tratamiento |
|---|---|---|---|
| Test → Activo | la dimensión del control | Responsable del activo | Tratamiento |
| **Control** | la categoría | Responsable parametrizado | **Plan de acción** |
| Categoría → Marco del servicio | — | Responsable de cumplimiento | Seguimiento |
| **Causa → Riesgo** | el servicio | Responsable de riesgo | **Mitigación / riesgo residual** |

### Cuánto se puede automatizar hoy

De los 61 TEST: **13 tienen checks automáticos**. Los **26 documentales** no los tendrán nunca
(son revisión con IA) y los **11 de nube no tienen ninguno** todavía (decisión D13).
`T-SRV-001` concentra 10.909 de los 11.352 checks. **El porcentaje se lee siempre junto a la
cobertura** (qué parte ya tiene resultado).

> El cumplimiento del marco se **deriva** recorriendo requisitos → controles; nunca se
> almacena como columna del marco.

---
