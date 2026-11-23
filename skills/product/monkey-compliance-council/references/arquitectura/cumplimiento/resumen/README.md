# Cumplimiento · Resumen

> **VF18 (D128): esto describe el código construido con el catálogo v1.** Con la VF18 un control cuenta como cumplido solo con «Cumplimiento aprobado» y el período auditado dura 6 meses como mínimo (D130 a D132).

Responde: **¿cómo se obtiene el estado de un marco completo y de sus categorías?** Es la pantalla de entrada a
Cumplimiento: un bloque por marco contratado, con sus categorías, su avance y lo que falla.

## Qué posee

| Qué | Dónde |
|---|---|
| Endpoint y caso de uso | `compliance/presentation/overview/`, `application/overview/` |
| La agregación | `domain/overview/compliance-overview.ts` → `buildOverview` |
| El período auditado | `compliance/presentation/periods/evaluation-period.controller.ts` |

## La regla que define este componente

**Sin período auditado no hay medición.** Antes de calcular un marco, `buildOverview` comprueba si el servicio
definió su período. Si no, el marco queda en `not_measured` y **no se inventa ningún resultado** (REQ-004, D87).
Es una regla del resumen, no del [motor](../motor/README.md).

## Cómo se ubica un control en su marco

La «ubicación» de un control (en qué marco y categoría cae) se deduce de los requisitos que sirve, recorriendo
puntos de enfoque → requisitos → marco. Un **control propio** de la empresa no llega a ningún requisito: cae en la
categoría que la empresa eligió.

## La unidad es servicio × marco

Nunca «la empresa entera». Un porcentaje de toda la empresa no significa nada: cada servicio se certifica aparte.

## Dónde está cada dato

Contrato: `contracts/cumplimiento/resumen.md`. Decisiones: D80 (estado y porcentaje juntos), D87.
Flujo: [`03-flujos.md`](03-flujos.md).
