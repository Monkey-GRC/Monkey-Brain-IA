# Cumplimiento · Veredictos

Responde: **¿cómo se resuelve una prueba manual que no se respalda con un documento?** Con el veredicto de una
persona: el `admin_empresa` declara si la prueba cumple o no, y esa declaración se guarda como un hecho inmutable.

## Qué posee

| Qué | Dónde |
|---|---|
| Endpoints y repositorio | `compliance/presentation/verdicts/`, `TestVerdictPrismaRepository` |
| Tablas | `evaluations` con `origin = manual` y `confirmed_by` |

No tiene tabla propia: un veredicto **es** una evaluación, igual que el resultado de la sonda. Eso es lo que permite
que el motor no distinga de dónde vino el hecho.

## Las tres clases de prueba

| Clase | Cómo se resuelve |
|---|---|
| Automática | La [sonda o el motor de nube](../../control-tecnico/README.md) |
| Documental | Con [evidencia](../evidencia/README.md) revisada |
| **Manual no documental** | **Con un veredicto** |

Pedir un veredicto sobre una prueba documental o automática se rechaza con `409`: cada clase tiene su camino.

## La regla que define este componente

**Un veredicto es del test en el servicio, no del control** (D85). Si dos controles comparten la misma prueba, un
solo veredicto cuenta en ambos: se escribe una evaluación por cada control × activo de esa dimensión, todas con la
misma hora.

## Quién puede

Solo el `admin_empresa` (D96, SEG-67). Si el control tiene observaciones abiertas del auditor, el veredicto se
permite pero **exige explicar por qué** (MD-154).

## Dónde está cada dato

Contrato: `contracts/cumplimiento/veredictos.md`. Decisiones: D85, D91, D96. Flujo: [`03-flujos.md`](03-flujos.md).
