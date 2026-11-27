# Cumplimiento · Motor

> **VF18 (D128) · motor v2 construido con MD-498 (2026-11-23).** La cadena de cálculo del código es ahora: activo → check → **prueba** (`test_status`) → **requisito del control** (`requirement_status`) → control (**nivel 0 a 5**, `control_level`) → categoría → marco ([§9](../../../datos/modelo/09-calculo-cumplimiento.md), D130). Vive en `Backend/src/features/compliance/domain/engine/v2/` (`technical-test.ts`, `manual-test.ts`, `requirement.ts`, `control-level.ts`, `windows.ts`, `parameters.ts`, `types.ts`); `control-readout.ts` une la foto del servicio con ellos y `engine/rollup.ts` agrega categoría y marco. **Lo de abajo sobre pruebas automatizadas y documentales y sobre `control.ts` describe el motor v1:** sus funciones (`automated-test.ts`, `control.ts`) ya no las usa la lectura del control y se retiran con MD-509 (`DT-113`); `documentary-test.ts` sigue en la evidencia. **Construido con MD-500 (2026-11-23):** ventanas cerradas y nivel Sólido por período (`windows.ts`, `control-level.ts`, `control-readout.ts`), periodicidad por control (D147) y períodos con histórico (`service_framework_periods`, D145, D148); `DT-115` cerrada en MD-529; quedan `DT-116` (parte), `DT-117` y los avisos (MD-515). **Construido con MD-495 (2026-11-24):** los parámetros se cargan de `catalog.evaluation_parameters` (`infrastructure/shared/prisma-evaluation-parameters.ts`, una vez por caso de uso; `engine/v2/parameters-from-rows.ts`) y PR-07 admite ventanas móviles (`windows.ts`), D149. **Sin construir:** puntajes globales y módulos sin dato (MD-497); estados de gestión, plan de remediación de Parcial y «Cumplimiento aprobado» (MD-504, `DT-114`); fuentes que aún leen `client_control_tests` (MD-509, `DT-113`).

Responde: **¿qué pieza convierte los hechos en «cumple» o «no cumple»?** Es el corazón del producto y la parte más
fácil de probar: `Backend/src/features/compliance/domain/engine/` y `domain/controls/control-readout.ts`.

La definición funcional es del comité (`datos/modelo/09-calculo-cumplimiento.md` y `contracts/enums.md`); aquí se
explica cómo la implementa el código. Las reglas, nivel por nivel, en [`reglas.md`](reglas.md).

## La cadena de cálculo

```mermaid
flowchart LR
    A["<b>Activo × Prueba</b><br/>un resultado:<br/>cumple / no cumple / pendiente"]
    T["<b>Prueba</b><br/>automated-test.ts<br/>o documentary-test.ts"]
    C["<b>Control</b><br/>control.ts"]
    K["<b>Categoría</b><br/>rollup.ts"]
    M["<b>Marco</b><br/>rollup.ts"]

    A --> T --> C --> K --> M
```

Cada flecha es **una función pura**: recibe los estados del nivel de abajo y devuelve el estado del nivel de arriba.
No lee la base, no escribe nada, no tiene fecha ni usuario. Misma entrada, misma salida.

## Los cinco principios

Si entiendes esto, entiendes el motor.

1. **Lo que no se midió no es cumplimiento.** Pendiente, sin activos, sin evidencia, sin ejecución: nunca producen
   «cumple». Está en cada archivo del motor y es la regla más importante del producto.
2. **Todo o nada en cada nivel.** Una prueba cumple solo si **todos** sus activos cumplen. Un control es efectivo
   solo si **todas** sus pruebas cumplen. Una categoría y un marco cumplen solo si **todos** sus controles son
   efectivos. 45 de 50 servidores conformes con 5 sin evaluar **no** es «casi cumple»: es «en evaluación».
3. **Lo que falla prevalece sobre lo pendiente.** Si hay un activo que no cumple, la prueba no cumple aunque falten
   otros por evaluar. Es lo que permite avisar una falla sin esperar a medir todo.
4. **Se cuenta, no se promedia.** El porcentaje es «cuántos cumplen de cuántos hay», nunca un promedio de
   porcentajes. Y **el porcentaje informa, no decide**: el estado se calcula aparte.
5. **Un fallo técnico no es un incumplimiento.** Un error de la sonda es `error`, no `non_compliant`, y no baja el
   porcentaje (pero tampoco deja el control en «efectivo»).

## Las piezas por dentro

```mermaid
flowchart LR
    subgraph engine["domain/engine/  ·  reglas puras"]
        at["automated-test<br/>evalúa un test sobre sus activos"]
        dt["documentary-test<br/>evalúa un test sobre sus evidencias"]
        ctl["control<br/>evalúa un control sobre sus tests"]
        roll["rollup<br/>categoría y marco sobre sus controles"]
        ar["asset-readiness<br/>semáforo de un activo"]
    end

    readout["<b>control-readout</b><br/>readControl: une la foto del servicio<br/>con el motor y calcula el semáforo"]
    overview["<b>compliance-overview</b><br/>buildOverview: reparte controles<br/>en categorías y marcos"]

    at --> readout
    dt --> readout
    ctl --> readout
    readout --> overview
    roll --> overview
```

`readout` y `overview` **no leen la base**: reciben datos ya cargados y devuelven resultados. Eso es lo que permite
probar el cumplimiento sin levantar Postgres.

## Dos cosas que el motor no hace

- **No sabe de roles.** Qué ve cada rol (`responsable` y `delegado` solo lo suyo, vista técnica solo `auditor` y `admin_empresa`)
  lo decide la capa de aplicación (`application/shared/view-access.ts` y los casos de uso).
- **No sabe de tiempo.** La vigencia de una exclusión o el corte del período los resuelve quien carga los datos
  (`service-snapshot.loader`) o el [resumen](../resumen/README.md). El motor solo recibe estados ya resueltos.

## Cómo verificarlo

- Los tests del propio motor son la mejor documentación viva: `domain/engine/*.spec.ts`, en especial
  `engine.acceptance.spec.ts`. Si cambias una regla, un test debe fallar.
- Corre solo esos tests: `cd Backend && npx jest src/features/compliance/domain`.
