# Cumplimiento · Riesgos

Responde: **¿cómo sabe una empresa qué puede salir mal y cuánto baja ese riesgo con sus controles?** Es la otra
mitad del módulo: el cumplimiento mide **controles**; los riesgos miden **exposición**.

## La cadena

```mermaid
flowchart LR
    r["<b>Riesgo</b><br/>«acceso no autorizado<br/>a datos de clientes»"] --> c["<b>Causa</b><br/>«contraseñas débiles»"]
    c --> ctl["<b>Control</b><br/>lo que ataca la causa"]
    ctl --> res["<b>Riesgo residual</b><br/>lo que queda cuando<br/>el control funciona"]
```

Un riesgo nace de causas; las causas se atacan con controles; cuando los controles funcionan, el riesgo baja pero
casi nunca desaparece. Lo que queda es el **riesgo residual**.

## Lo que lo diferencia del resto del módulo

**Los riesgos son de cada servicio, no de la empresa.** La misma causa puede ser muy probable en un servicio y casi
imposible en otro, así que `client_risks` y `client_causes` se clonan por servicio (D28) y el cliente los evalúa uno
por uno.

**El cliente pone la probabilidad y el impacto** (D33, D76), en escalas de 1 a 5. El valor inherente es el producto:
de 1 a 25.

## Evaluar los riesgos es un paso del onboarding

Se hace en la pantalla del servicio, justo después de crearlo, y **bloquea declarar activos** hasta terminarlo
(D89). El recorrido está en [`onboarding/contexto-servicio/03-flujos.md`](../../onboarding/contexto-servicio/03-flujos.md);
el componente que lo implementa es este.

Al evaluar se puede **retirar** un riesgo que no aplica (con motivo), volver a incluirlo y **agregar uno propio**
con sus causas. Retirar un riesgo no retira sus causas ni sus controles (D93).

## Lo que todavía no se puede calcular

El **riesgo residual** y las dos matrices (inherente y residual) esperan un dato que el comité no ha entregado: de
cada relación causa–control, si el control es **obligatorio** y si reduce la **probabilidad** o el **impacto**. Es
`P22` punto 1, y mientras siga abierto **no se resuelve por cuenta propia**.

El apetito de riesgo (hasta qué valor se puede convivir) usa 9 sobre 25 como valor inicial propuesto por el comité
(D75); quién lo fija y lo aprueba sigue abierto en `P22` punto 3.

## Qué posee

Tablas `client_risks`, `client_causes`, `client_risk_causes`, `client_cause_controls`, `risk_treatments`,
`residual_risks`, `action_plans`, `mitigations`.
Código: `compliance/presentation/risks/` (`risks.controller.ts` y `risk-assessment.controller.ts`).

## Dónde está cada dato

| Dato | Dueño |
|---|---|
| Rutas y errores | `contracts/cumplimiento/riesgos.md` |
| Las tablas y sus columnas | `datos/modelo/07-cumplimiento.md` §7.2 |
| El catálogo base de riesgos y causas | `datos/modelo/03-catalogo-maestro.md` §3.4 · [`../../catalogo-maestro/`](../../catalogo-maestro/README.md) |
| Decisiones | D28, D33, D74, D75, D76, D89, D93 |
| Pendiente | `P22` (lo que falta para calcular el riesgo) |

## Contenido

[`03-flujos.md`](03-flujos.md). Sin `02-modelo.md`: las tablas están dibujadas en §7.2.
