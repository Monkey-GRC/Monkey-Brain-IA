# Observaciones · Flujos

Responde: **¿cómo viaja una observación del auditor a quien tiene que arreglarlo?**

## El ciclo completo

```mermaid
sequenceDiagram
    autonumber
    participant AU as auditor
    participant API as Backend
    participant DB as PostgreSQL
    participant E as admin_empresa, responsable o delegado del control
    AU->>API: escribe una observación sobre un control o una evidencia
    API->>DB: inserta open + insertAuditLog (misma transacción)
    Note over E: hoy se entera entrando a mirar: no hay aviso (D143, por construir)
    E->>API: responde con una nota y, si hace falta, una evidencia del mismo servicio
    API->>DB: pasa a answered, guarda quién y cuándo
    AU->>API: la cierra, o la devuelve a open si no queda conforme
    API->>DB: closed (quien cierra es siempre quien la escribió)
```

**Qué mirar**

- **Si el auditor solo señala una evidencia**, el control se deduce de esa entrega: una entrega pertenece a un
  único control, así que la observación le llega a su responsable.
- **Sobre un control dado de baja no se abren observaciones nuevas**; las que ya tenía se conservan.
- **La respuesta no cambia el cumplimiento.** Si el documento que se adjunta debe contar, entra por el camino de la
  [evidencia](../evidencia/03-flujos.md) y lo valida el `admin_empresa`.
- **Nadie se entera solo.** No hay notificaciones ([`../../notificaciones/README.md`](../../notificaciones/README.md)).

## Dónde choca con el veredicto

```mermaid
flowchart LR
    v["admin_empresa da un veredicto<br/>sobre una prueba del control"] --> q{"¿el control tiene<br/>observaciones abiertas?"}
    q -- "no" --> ok["Se registra"]
    q -- "sí" --> m["Exige closure_observation_reason<br/>(criterio provisional, P37)"]
```

Está detallado en [`../veredictos/03-flujos.md`](../veredictos/03-flujos.md).

## Cómo verificarlo

`test/cumplimiento/observaciones.e2e-spec.ts` y `compliance/presentation/observations/`.
