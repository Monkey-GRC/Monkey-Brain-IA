# Trazabilidad

Responde: **¿cómo se demuestra quién hizo qué, y cuándo cambió el cumplimiento?** Son los dos registros
inmutables del schema `audit`: el **rastro de auditoría** de cada acción y los **eventos de cambio de estado** de
un control. Es lo que un auditor va a pedir y la razón de que nada se pueda borrar.

## Dos registros, dos preguntas

| Registro | Responde | Quién escribe |
|---|---|---|
| `audit_logs` | «¿Quién tocó esto, cuándo, y cómo estaba antes?» | `insertAuditLog`, en la misma transacción que el cambio |
| `compliance_events` | «¿Cuándo pasó este control de efectivo a no efectivo, y por qué?» | `recordControlStateChanges` (D91) |

El primero es de **todo el producto**; el segundo solo de [Cumplimiento](../cumplimiento/README.md) y de
[Control técnico](../control-tecnico/README.md), que son los que mueven estados.

## Las dos reglas que no se negocian

1. **Append-only para todos los roles de la base**, incluido el dueño de la tabla: `REVOKE UPDATE, DELETE` más
   triggers `audit.reject_mutation()` (D41, SEG-33). Ni la aplicación puede corregir una fila.
2. **Se escribe en la misma transacción que la acción** (D52, SEG-36). Si el rastro falla, la acción se revierte:
   no existe un cambio sin constancia.

## Qué posee

El schema `audit`: `audit_logs` y `compliance_events`. Código: `src/infrastructure/audit/` (`insertAuditLog`,
`AuditLogWriter`) y `compliance/infrastructure/shared/control-state-events.ts`.

## Dónde está cada dato

| Dato | Dueño |
|---|---|
| Las dos tablas y sus columnas | `datos/modelo/05-usuarios.md` §5.2 (`audit_logs`) · `datos/modelo/07-cumplimiento.md` §7.4 |
| Cómo se implementa el append-only | `datos/schema-implementacion.md` §5 |
| Requisitos de seguridad | [`seguridad/trazabilidad.md`](../../seguridad/trazabilidad.md): `SEG-33` · `SEG-34` · `SEG-35` · `SEG-36` · `SEG-37` · `SEG-38` · `SEG-63` · `SEG-69` |
| Decisiones (`D-n`) | [`datos/decisiones/trazabilidad.md`](../../datos/decisiones/trazabilidad.md): `D27` · `D41` · `D52` · `D91` |
| Pendientes del comité (`P-n`) | ninguno propio |
| Convención de nombres de `action` | `contracts/conventions.md` |
| Deuda vigente (3 `DT-n`) | [`deuda-tecnica/trazabilidad.md`](../../deuda-tecnica/trazabilidad.md) |

## Contenido

[`01-c4.md`](01-c4.md) · [`02-modelo.md`](02-modelo.md) · [`03-flujos.md`](03-flujos.md) · [`06-mejoras.md`](06-mejoras.md)
