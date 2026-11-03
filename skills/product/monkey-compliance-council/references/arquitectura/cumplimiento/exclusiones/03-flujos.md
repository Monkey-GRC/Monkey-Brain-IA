# Exclusiones · Flujos

Responde: **¿qué pasa al excluir un activo, y cuándo deja de valer?**

## 1 · Crear una exclusión

```mermaid
sequenceDiagram
    autonumber
    participant A as admin_empresa
    participant C as ExclusionsController
    participant R as Repositorio
    participant DB as PostgreSQL
    A->>C: POST /v1/services/:id/exclusions (prueba, activo, motivo, vigencia)
    C->>R: crea
    R->>DB: ¿la prueba y el activo son de este servicio y de esta empresa?
    R->>R: si la prueba es automática, exige justificación técnica
    R->>DB: inserta con status = approved (nace aprobada, D96)
    R->>DB: insertAuditLog
    R->>DB: si cambió el estado de algún control, un evento control.state
    R-->>A: 201
```

Es una **escritura que mueve el cumplimiento**, así que sigue el mismo patrón que las demás: foto antes, escritura,
rastro, foto después ([`../03-flujos.md`](../03-flujos.md)).

## 2 · Cómo entra en el cálculo

```mermaid
sequenceDiagram
    autonumber
    participant L as loadServiceSnapshot
    participant DB as PostgreSQL
    participant M as Motor
    L->>DB: últimos resultados por (control, prueba, activo)
    L->>DB: exclusiones approved con valid_from <= hoy <= valid_until
    L->>L: por cada exclusión, marca ese (control, prueba, activo) como excluded
    L->>M: la foto del servicio, ya con las exclusiones superpuestas
    M-->>L: el motor nunca ve la tabla exclusions
```

**El motor no sabe de exclusiones ni de fechas.** Recibe estados ya resueltos; quien resuelve la vigencia es quien
carga los datos. Por eso el motor sigue siendo una función pura.

## 3 · Qué pasa al vencer

Nada que haya que ejecutar: al día siguiente, la consulta de carga ya no la trae y el activo vuelve a contar. Si
estaba fallando, el control vuelve a fallar. **No hay un trabajo programado que «caduque» exclusiones**, y por eso
tampoco hay un evento de cambio de estado ese día: el cambio se ve en la siguiente lectura.

## Cómo verificarlo

`loadServiceSnapshot` (el bloque de `excluded`) y `test/cumplimiento/exclusiones.e2e-spec.ts`.
