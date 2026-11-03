# Decisiones — Onboarding

Por qué Onboarding es como es, partido por componente porque el módulo es grande. **Se consulta para reabrir, no para construir**: lo vigente está en [`arquitectura/onboarding/`](../../../arquitectura/onboarding/README.md). Índice de todas las decisiones: [`../README.md`](../README.md).

## Por componente

| # | Componente | Decisiones |
|---|---|---|
| 1 | [Contexto organizacional](contexto-organizacional.md) | `D30` · `D44` · `D73` |
| 2 | [Contexto del servicio](contexto-servicio.md) | `D45` · `D51` · `D89` · `D93` |
| 3 | [Conexión de activos](conexion-activos.md) | `D46` · `D59` · `D60` · `D61` · `D67` · `D69` · `D92` |

## Del módulo entero

Decisiones que no son de un componente concreto.

## D23 (Cumplimiento) · No es un 4º componente del onboarding

> **Ajustada por D89 (2026-10-23):** Cumplimiento sigue siendo un módulo aparte y fuera del onboarding, pero evaluar los riesgos de un servicio es ahora el paso previo a **declarar sus activos** (no a usar el producto).

> ✅ **Confirmada por el comité el 2026-09-26.** Estuvo abierta como P1 en
> `datos/pendientes/README.md` desde el 2026-09-20 a la espera de ese visto bueno. El comité
> confirmó que el módulo de Cumplimiento queda fuera del onboarding, así que la decisión que
> sigue es firme y `modelo-datos.md` la afirma sin reserva.

**Pregunta:** el onboarding tiene 3 componentes (Contexto Organizacional, Contexto del
Servicio, Control Técnico). ¿Se agrega un 4º componente "Cumplimiento" donde el cliente
configura riesgos, causas y controles, y se exige antes de poder usar el resto del
producto?

**Decisión: no.** Cumplimiento es un módulo aparte, sin límite de tiempo y sin bloquear
nada. Razones:

- **El catálogo ya se clona solo.** Al elegir marco en el Componente 2, el set de
  riesgos/causas/controles de ese marco se clona automáticamente al escenario del
  cliente (`modelo-datos.md` §3.5). El cliente no necesita crear nada a mano para que el
  cumplimiento empiece a medirse.
- **Lo que sí requiere un módulo propio es la personalización** — reescribir la
  interpretación de un control, ajustar dimensiones, asignar responsables, excluir un
  check — y eso ya es trabajo de `admin_empresa` en cualquier momento, no un requisito de
  arranque (`modelo-datos.md` §5.1, los 5 roles; la matriz de permisos, en §5.5).
- **Los 3 componentes que especificó el comité en el TSC INTEGRAL no incluyen
  Cumplimiento.** El documento más detallado y más reciente ya refleja esta separación.
- Gatear funciones básicas (crear usuarios, conectar activos) detrás de una
  configuración de cumplimiento manual contradice `philosophy.md` (onboarding de
  friction mínima).

**Fuente:** decisión de producto, 2026-09-20, a partir de la tensión encontrada entre
`modelo-datos.md` §3.5 ("Riesgo y Causa: sí, se instancian… según su entendimiento") y el
alcance de 3 componentes ya documentado en `arquitectura/onboarding/README.md`. Se corrigió §3.5 para
distinguir clonado automático (onboarding) de personalización (módulo Cumplimiento,
aparte). **Confirmada por el comité el 2026-09-26** (vía Héctor), que era lo único que
quedaba abierto: el onboarding se queda en 3 componentes.

---
