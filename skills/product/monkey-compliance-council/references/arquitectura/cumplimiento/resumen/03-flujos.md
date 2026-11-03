# Resumen · Flujos

Responde: **¿qué pasa al pedir el resumen de cumplimiento de un servicio?**

`GET /v1/services/:serviceId/compliance-overview`. Es igual que [leer los controles](../controles/03-flujos.md)
hasta cargar la foto del servicio, con tres diferencias: carga también los marcos y categorías en alcance, agrega
por categoría y marco, y comprueba el período.

```mermaid
sequenceDiagram
    autonumber
    participant UC as GetOverviewUseCase
    participant R as ControlPrismaRepository
    participant M as Motor (readControl)
    participant O as buildOverview

    UC->>R: loadOverview(scope, serviceId)
    R-->>UC: foto del servicio + marcos contratados + categorías en alcance + ubicación de cada control
    loop por cada control
        UC->>M: readControl
        M-->>UC: ControlReadout
    end
    UC->>O: buildOverview(controles, marcos, categorías, ubicaciones)
    O->>O: por marco: ¿hay período definido? si no, queda Sin medir
    O->>O: por categoría en alcance: estado, avance, cobertura, controles que fallan
    O->>O: el marco cuenta controles únicos
    O-->>UC: un bloque por marco con sus categorías
```

## Qué mirar

- **El período se comprueba primero.** Un marco sin período auditado sale `not_measured`, no «0 %»: son cosas
  distintas y el producto no las confunde.
- **Los controles únicos.** Un control que sirve a tres requisitos cuenta **una vez** en el marco; si se contara
  tres veces, el porcentaje mentiría.
- **El resumen no es un promedio de porcentajes.** Cuenta controles: efectivos sobre únicos.

## Cómo verificarlo

`GetOverviewUseCase` y `domain/overview/compliance-overview.ts`.
