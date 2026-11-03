# Trazabilidad · Modelo

Responde: **qué guarda exactamente cada registro.** `audit_logs` está dibujada en
[`datos/modelo/05-usuarios.md`](../../datos/modelo/05-usuarios.md) §5.2; aquí se añade `compliance_events`, que no
tiene diagrama propio, y lo que ambas comparten.

## Dónde está dibujada cada una

**Ninguna se redibuja aquí**: `audit_logs` está en
[`datos/modelo/05-usuarios.md`](../../datos/modelo/05-usuarios.md) §5.2 y `compliance_events` en
[`datos/modelo/07-cumplimiento.md`](../../datos/modelo/07-cumplimiento.md) §7.4. Lo que sigue es lo que ningún
diagrama explica: por qué están hechas así.

## La columna que más se malinterpreta

`compliance_events.user_id` es **nullable**, y el nulo no es un dato faltante: significa que **lo cambió el
sistema**, no una persona — la sonda al escribir un resultado (D91). Un auditor necesita esa diferencia, así que no
se rellena con un usuario técnico.

Lo mismo con `audit_logs.tenant_id`: una acción de plataforma (registrar una empresa) ocurre **antes** de que
exista el tenant al que atribuirla. Y con `audit_logs.attempted_email`, que guarda el correo tecleado cuando el
login falló porque ese usuario no existe (CC7.2).

## Lo que comparten las dos tablas

| Rasgo | Por qué |
|---|---|
| Viven en el schema `audit` | Para saber dónde está el rastro sin adivinar |
| **Sin llaves foráneas a las tablas de negocio** (solo `tenant_id` y `user_id`) | Si se da de baja un control, su historial no puede desaparecer en cascada |
| `onDelete: Restrict` sobre el usuario | El rastro nunca pierde la atribución |
| `@@index([tenant_id, created_at])` | La consulta real siempre es «lo de esta empresa, en este rango» |
| RLS activo | El rastro de una empresa no se lee desde otra (SEG-34) |
| `REVOKE UPDATE, DELETE` + triggers | Append-only para todos los roles (SEG-33) |

## Por qué el rastro se escribe sin `RETURNING`

Un `INSERT … RETURNING` exigiría que la fila nueva pasara también la política de lectura, y una acción de
plataforma sin tenant no la pasa. Por eso se usa `createMany` o SQL directo (§4.4).

## Retención

7 años para una empresa activa (SOC 2). Los respaldos generales rotan a 35 días y **no sostienen** ese requisito:
es `SEG-35`, hoy en 🟠 con `DT-84` y `D72`. Una empresa dada de baja es la única excepción (D97).

## Cómo verificarlo

`Backend/prisma/schema/audit/audit.prisma` y la migración de los triggers (`audit_append_only_triggers`).
