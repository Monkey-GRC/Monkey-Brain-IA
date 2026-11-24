# Decisiones — Cumplimiento

Por qué Cumplimiento es como es, partido por componente porque el módulo es grande. **Se consulta para reabrir, no para construir**: lo vigente está en [`arquitectura/cumplimiento/`](../../../arquitectura/cumplimiento/README.md). Índice de todas las decisiones: [`../README.md`](../README.md).

## Por componente

| # | Componente | Decisiones |
|---|---|---|
| 1 | [Motor](motor.md) | `D62` · `D68` · `D79` · `D130` · `D131` · `D140` · `D147` · `D148` |
| 2 | [Controles](controles.md) | `D65` · `D119` · `D132` |
| 3 | [Resumen](resumen.md) | `D87` · `D105` · `D118` |
| 4 | [Veredictos](veredictos.md) | `D85` · `D88` · `D121` |
| 5 | [Exclusiones](exclusiones.md) | `D74` · `D78` · `D83` · `D135` |
| 6 | [Riesgos](riesgos.md) | `D33` · `D75` · `D76` · `D134` |

## Del módulo entero

Decisiones que no son de un componente concreto.

## D80 · La superficie habla el lenguaje del dominio GRC, los códigos se muestran siempre y el porcentaje de avance es visible (2026-10-15)

**Decisión.**

- **Vocabulario.** Monkey es una herramienta seria de gobierno, riesgo y cumplimiento y la superficie usa sus términos: **controles, riesgos, causas, evidencias, requisitos, marcos, tratamiento y riesgo residual**. Se retiran los eufemismos («acción de protección», «lo que podría salir mal», «por qué podría pasar», «lo que tienes que aportar»). Con esto queda cerrado el glosario de MD-109.
- **Evidencia requerida y evidencia entregada.** Lo que un control exige que se aporte es la **evidencia requerida** (`evidence_requirements`); lo que se sube para cumplirlo es la **evidencia entregada** (`evidence_submissions`). «Prueba» se reserva para el test del motor (`T-DOC-001`). La evidencia se aporta desde el control y desde la pestaña Evidencias.
- **Códigos siempre.** El cliente ve el código de cada control (`IAC-12`, o `C01` en uno propio) y de cada requisito (`CC6.1`). En la API, `code` y `requirement_codes` pasan de `technical` a la vista de negocio; `technical` conserva los puntos de enfoque, los estados del motor y las pruebas.
- **Estado y porcentaje, juntos.** En el resumen y en cada control se muestran a la vez el estado cualitativo (Preparado, Casi listo, Requiere trabajo, Sin medir), el **porcentaje de avance** y la **cobertura**. La API sigue mandando conteos; el porcentaje lo deriva la pantalla (`done / total`), **truncado** a entero (99,6 % no es 100 %) y sin total no hay porcentaje.
- **Lo que no cambia.** La vista técnica sigue siendo de `auditor` y `consultor` (D63, D64; D81 suma a `admin_empresa`); el semáforo y los cortes (D62, D68); «Sin medir» no es un fallo; nunca un porcentaje solo ni uno de toda la empresa (la unidad es servicio × marco); la sonda no se nombra; la IA no certifica.

**Por qué.** Quien trabaja en compliance —consultores, auditores, responsables de cumplimiento— usa estos términos y los eufemismos le restaban credibilidad al producto; las pantallas, además, ocultaban los códigos que ese público necesita para trazar. El porcentaje ya era, desde D62, «el diagnóstico que se le muestra al cliente»: lo único que se prohíbe es presentarlo solo o sin cobertura.

**Qué cambia.** `CLAUDE.md` y `philosophy.md` (reemplazan las reglas «nunca jerga técnica» y «nunca un % desnudo»), `conventions.md`, los contratos `compliance-*` (nombre «control», `code` y `requirement_codes`), `enums.md`, `sprint-cumplimiento.md`, `mvp-roadmap.md`, `architecture.md`, SEG-54 y `add-translation.md`. **Abre** `P27` (cómo agrupar los controles en un marco sin categorías). **Pendiente de construir:** el backend mueve `code` y `requirement_codes` a la vista de negocio (`contracts/cumplimiento/controles.md`, «Estado de implementación»).

**Fuente:** Carlos Castaño, con Héctor Ríos, 2026-10-15.

---
