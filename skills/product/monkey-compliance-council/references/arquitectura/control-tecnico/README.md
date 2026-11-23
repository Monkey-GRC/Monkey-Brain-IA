# Control técnico

Responde: **¿cómo mide Monkey, día tras día, los activos que el cliente conectó?** Es la operación continua de la
medición automática: programar, ejecutar, guardar el resultado de cada comprobación y diferenciar «el control falla»
de «la conexión falla». Conectar los activos por primera vez es otra cosa: es el componente
[`onboarding/conexion-activos/`](../onboarding/conexion-activos/README.md).

## Qué posee

Tablas (`datos/modelo/08-control-tecnico.md` §8): `schedule_rules`, `executions`, `check_results`, `asset_resources`,
`execution_logs`. Código: `Backend/src/features/technical-control` (ejecuciones, programación y API interna del
trabajador) y `Backend/src/runner/` (el trabajador del motor de nube, que no es una feature).
Entrega sus resultados a Cumplimiento como `evaluations` (inmutables); no los interpreta.

## Dónde está cada dato

| Dato | Dueño |
|---|---|
| Rutas | `contracts/control-tecnico.md` |
| Valores de los enums | [`contracts/enums/control-tecnico.md`](../../../../../../contracts/enums/control-tecnico.md) |
| Entidades | `datos/modelo/08-control-tecnico.md` §8 |
| Decisiones (`D-n`) | [`datos/decisiones/control-tecnico.md`](../../datos/decisiones/control-tecnico.md): `D48` · `D53` · `D54` · `D56` · `D57` · `D58` · `D70` · `D71` · `D90` · `D100` |
| Pendientes del comité (`P-n`) | [`datos/pendientes/control-tecnico.md`](../../datos/pendientes/control-tecnico.md): `P14` — **si sigue abierto, se pregunta** |
| Deuda vigente (20 `DT-n`) | [`deuda-tecnica/control-tecnico.md`](../../deuda-tecnica/control-tecnico.md) |
| Requisitos de seguridad | [`seguridad/control-tecnico.md`](../../seguridad/control-tecnico.md): `SEG-26` · `SEG-29` · `SEG-39` · `SEG-45` · `SEG-46` · `SEG-47` · `SEG-48` · `SEG-49` · `SEG-50` · `SEG-51` |

## Índice del módulo

| # | Lee | Qué aprendes |
|---|---|---|
| **1** | Este archivo | Para qué existe y qué posee |
| **2** | [`01-c4.md`](01-c4.md) | Las piezas: el Backend, el Runner y el motor efímero |
| **3** | [`02-modelo.md`](02-modelo.md) | Las tablas de una corrida y por qué `executions` ≠ `evaluations` |
| **4** | [`03-flujos.md`](03-flujos.md) | La corrida completa, de la cola al cumplimiento |
| **4.1** | ↳ [**Motores**](motores/README.md) | La sonda y el motor de nube. **Confidencial frente al cliente** |
| **5** | [`04-historias.md`](04-historias.md) | Las historias de usuario y sus criterios de aceptación |
| **6** | [`05-casos-de-uso.md`](05-casos-de-uso.md) | Los casos de uso, sus flujos y el diagrama UML |
| **7** | [`06-mejoras.md`](06-mejoras.md) | Lo que conviene revisar del módulo |
