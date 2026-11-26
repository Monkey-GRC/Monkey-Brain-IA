# Cumplimiento · Veredictos

> **MD-504 (2026-11-25): el veredicto se retiró.** `POST …/verdicts`, `PUT /v1/verdicts/{id}/review`, `GET …/verdicts`, `test_verdicts` y `test_verdict_reviews` ya no existen (migración destructiva). El resultado de una prueba manual lo registra el responsable por control (`manual_test_results`) y la aprobación es del control (`control_approvals`): ver `contracts/cumplimiento/aprobacion.md` y `datos/modelo/07-cumplimiento.md` §7.3b. Lo de abajo es el diseño anterior y se conserva como historia hasta que se reescriba este componente (sin componente de gestión propio todavía).

**
> **VF18 (D128): esto describe el código construido con el catálogo v1.** Con la VF18 la revisión en dos niveles pasa al control (D132) y la prueba documental se resuelve en el módulo Documentos (D133).

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
solo veredicto cuenta en ambos: vale en todos los controles que llevan la prueba, sobre los activos de su dimensión, una vez aprobado (D121).

## Quién puede

Registran el `admin_empresa`, el dueño (`responsable`) y el ejecutor (`delegado`); revisan el dueño (si no lo registró él) y el `admin_empresa` (D96, D121, SEG-67). Si el control tiene observaciones abiertas del auditor, el veredicto se
permite pero **exige explicar por qué** (MD-154).

## Dónde está cada dato

Contrato: `contracts/cumplimiento/veredictos.md`. Decisiones: D85, D91, D96. Flujo: [`03-flujos.md`](03-flujos.md).
