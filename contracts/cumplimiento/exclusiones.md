---
id: contracts-compliance-exclusions
name: Contrato — Cumplimiento, exclusiones
description: Sacar un activo de un test con vigencia y justificación: el administrador la propone y la decide en un acto.
type: contract
---

# Cumplimiento — exclusiones

**Contexto común** (quién puede qué, estado general y la tabla de permisos de los tres contratos de validación y auditoría): [`README.md`](README.md).

## Exclusiones

Excluir un **activo de un test** cambia lo que se mide (D74). **El `admin_empresa` la propone y la decide en un solo acto** (D96): la exclusión nace **aprobada**, con su justificación, su vigencia y quién la aprobó (REQ-008 del Excel). Vence al final del período de evaluación; al renovar se revalida. El veredicto de la sonda nunca se sobrescribe. Los estados `pending` y `rejected` quedan sin uso.

```json
{
  "id": "93d7…",
  "service_id": "55aa…",
  "test": { "id": "21ab…", "display_name": "Cuentas privilegiadas con doble factor" },
  "asset": { "id": "8f10…", "name": "servidor-contabilidad-legado" },
  "justification": "El servidor se apagará en noviembre y no almacena datos de clientes.",
  "technical_justification": "Aislado de la red de producción desde el 2026-09-01.",
  "status": "approved",
  "is_expired": false,
  "valid_from": "2026-10-14",
  "valid_until": "2026-12-31",
  "proposed_by": { "id": "a1b2…", "name": "Laura", "last_name": "Gómez" },
  "requested_at": "2026-10-14T19:00:00Z",
  "decided_by": { "id": "a1b2…", "name": "Laura", "last_name": "Gómez" },
  "decision_note": null,
  "decided_at": "2026-10-14T19:00:00Z"
}
```

`proposed_by` y `decided_by` son la misma persona, y `requested_at` y `decided_at` el mismo instante: se conservan para no cambiar la tabla.

### `POST /v1/services/{service_id}/exclusions`

```json
{
  "test_id": "21ab…",
  "asset_id": "8f10…",
  "justification": "El servidor se apagará en noviembre y no almacena datos de clientes.",
  "technical_justification": "Aislado de la red de producción desde el 2026-09-01."
}
```

- Solo `admin_empresa`. `justification` es obligatoria. `technical_justification` es **obligatoria si el test es automático**: la sonda no se sobrescribe sin sustento técnico.
- La vigencia **no la manda el cliente**: empieza hoy y termina en el `period_end` de la evaluación del servicio. Si esa evaluación no tiene período, `409 EVALUATION_NOT_DEFINED` (`P26`).
- El activo debe pertenecer al servicio y el test aplicarle; si no, `404`. Repetir una exclusión aprobada y vigente de lo mismo es `409 EXCLUSION_ALREADY_EXISTS`.
- Responde `201`, `status: "approved"`: **el activo sale del universo aplicable del test** (su resultado pasa a `excluded`) y queda el evento `exclusion.approve`.

### `GET /v1/services/{service_id}/exclusions`

Paginada, de la más reciente a la más antigua. Filtros `test_id`, `asset_id`, `expired` (`true`/`false`). Una cuya `valid_until` ya pasó trae `is_expired: true` y **el activo vuelve a contar**; para renovarla se crea una nueva (se revalida, no se hereda). La leen `admin_empresa` y `auditor`.

**No hay `PATCH`:** ya nadie decide sobre lo propuesto por otro (`conventions.md`). Dejar sin efecto una exclusión vigente antes de que venza es `LATER`.
## Errores

Los errores comunes (`FORBIDDEN`, `NOT_FOUND`, `VALIDATION_FAILED`) están en [`README.md`](README.md#errores-comunes); aquí solo los propios.

| HTTP | `error.code` | Cuándo |
|---|---|---|
| 409 | `EXCLUSION_ALREADY_EXISTS` | Ya hay una aprobada y vigente del mismo activo en el mismo test |
| 409 | `EVALUATION_NOT_DEFINED` | La evaluación del servicio no tiene período o fecha de corte |

Claves i18n: `exclusion.list`, `exclusion.created`.

## Auditoría

| `action` | Cuándo | Quién |
|---|---|---|
| `exclusion.create` | se decide una exclusión (con `compliance_events` al aprobar o vencer) | `admin_empresa` |

## Estado de implementación

**Construido (2026-10-28, B66):**

- **Exclusiones.** `POST` solo `admin_empresa`: nace `approved` con `decided_by`/`decided_at`, deja el evento `exclusion.approve` y, si mueve un control, su evento de estado (`cause: exclusion_approved`). Auditoría `exclusion.create`. Se retiró el `PATCH /v1/exclusions/{id}`, el campo de espera de decisión y `ALREADY_DECIDED`. Dos creaciones a la vez de lo mismo se serializan (candado de la transacción) y la segunda es `409 EXCLUSION_ALREADY_EXISTS`; el índice único parcial «una pendiente» queda como red de seguridad de datos viejos. `pending` y `rejected` quedan en el enum sin uso.

Lo que no cambia y el código ya hace: la vigencia llega al `period_end` del servicio (D87); «vencida» se deriva al leer (`is_expired`, `DT-72`, `MD-171`); solo se excluye el activo de un test (la de un check, `excluded_check_id`, es `MD-170`, `DT-74`); y `ai_suggestion` no se guarda ni se devuelve: la IA no escribe aquí.

La pantalla de exclusiones solo crea y lista: la decisión es el mismo acto (sin aviso de espera ni casilla de contacto: MD-169, `P28`).

## Preguntas abiertas

- **`P26`**: período y fecha de corte de la evaluación del servicio. Mientras no se definan, crear una exclusión responde `409 EVALUATION_NOT_DEFINED`.
