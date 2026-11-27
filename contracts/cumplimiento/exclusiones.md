---
id: contracts-compliance-exclusions
name: Contrato — Cumplimiento, excepciones de checks
description: Aceptar el FAIL de un check en un activo por un tiempo acotado (PR-04): el administrador la propone y la decide en un acto.
type: contract
---

# Cumplimiento — excepciones de checks

| | |
|---|---|
| **Estado** | **CONSTRUIDO** (2026-11-27, MD-501; D135, RC-20; reescrito sobre el de MD-144) |
| **App** | Monkey Platform |
| **Contexto común** | Quién puede qué, estado general y errores comunes: [`README.md`](README.md) |
| **Entidades** | `exclusions` (`modelo-datos.md` §7.2; la tabla y la ruta conservan el nombre de la v1) · enums: [`enums.md`](../enums.md) (`exclusion_status`) |

Una **excepción** acepta el FAIL de un check Directo de una prueba **en un activo** por un tiempo acotado (D135). Mientras está vigente, ese resultado es `fail_with_exception`: **cuenta como PASS y se muestra marcado**; el activo sigue en el alcance y en la cobertura. **El `admin_empresa` la propone y la decide en un solo acto** (D96): nace aprobada, con su justificación, su fecha de fin y quién la aprobó. **Dura como máximo PR-04** (`check_exception_max_days`, 90 días por defecto, `contracts/catalogo-maestro.md`). Al vencer, el resultado vuelve a ser FAIL y queda su evento. El resultado que midió la sonda nunca se sobrescribe.

**Alcance (D161):** la excepción es de **una prueba en un activo**: cubre los checks Directos de esa prueba en ese activo. No hay excepción de un check en todos los activos (lo que pedía MD-170 lo reemplaza D135). Solo se acepta si **hoy** hay un FAIL que exceptuar. «No aplica» no es una excepción: es la solicitud de no aplicabilidad (`aprobacion.md`).

## Índice de endpoints

| Método | Ruta | Quién | Para qué |
|---|---|---|---|
| `POST` | [`/v1/services/{service_id}/exclusions`](#post-v1servicesservice_idexclusions--aprobar-una-excepción) | `admin_empresa` | Aprobar una excepción |
| `GET` | [`/v1/services/{service_id}/exclusions`](#get-v1servicesservice_idexclusions--listar-excepciones) | `admin_empresa` · `auditor` | Listar excepciones |

## El objeto excepción

| Campo | Tipo | Qué es |
|---|---|---|
| `id` | uuid | |
| `service_id` | uuid | La excepción es de un activo en una prueba **de un servicio** (D83) |
| `test` | `{ id, display_name }` | |
| `asset` | `{ id, name }` | |
| `justification` | string | Por qué se acepta el riesgo. Obligatoria |
| `technical_justification` | string | El sustento técnico (control compensatorio, aislamiento…). Obligatoria |
| `status` | enum `exclusion_status` | Siempre `approved` (D96) |
| `valid_from` | date | El día en que se aprobó |
| `valid_until` | date | La fecha de fin que pidió el administrador. Con las de antes de MD-501, la que se guardó (el fin del período) |
| `effective_until` | date | Hasta cuándo cuenta de verdad: la menor entre `valid_until` y `valid_from` + PR-04 vigente. Si PR-04 baja, las excepciones ya aprobadas se acortan |
| `is_expired` | boolean | `effective_until` ya pasó |
| `expired_at` | datetime \| null | Cuándo la tarea diaria registró el vencimiento; `null` si sigue vigente o aún no pasó la tarea |
| `proposed_by`, `decided_by` | `{ id, name, last_name }` | **Son la misma persona** (se conservan para no cambiar la tabla) |
| `requested_at`, `decided_at` | datetime | **El mismo instante** |
| `decision_note` | string \| null | |

```json
{
  "id": "93d7…",
  "service_id": "55aa…",
  "test": { "id": "21ab…", "display_name": "Cuentas privilegiadas con doble factor" },
  "asset": { "id": "8f10…", "name": "servidor-contabilidad-legado" },
  "justification": "El servidor se apaga en enero y no almacena datos de clientes.",
  "technical_justification": "Aislado de la red de producción desde el 2026-09-01; acceso solo por bastión con doble factor.",
  "status": "approved",
  "valid_from": "2026-11-27",
  "valid_until": "2027-01-31",
  "effective_until": "2027-01-31",
  "is_expired": false,
  "expired_at": null,
  "proposed_by": { "id": "a1b2…", "name": "Laura", "last_name": "Gómez" },
  "requested_at": "2026-11-27T14:00:00Z",
  "decided_by": { "id": "a1b2…", "name": "Laura", "last_name": "Gómez" },
  "decision_note": null,
  "decided_at": "2026-11-27T14:00:00Z"
}
```

---

### POST /v1/services/{service_id}/exclusions — Aprobar una excepción

| | |
|---|---|
| **Quién** | `admin_empresa` |
| **Éxito** | `201`, `status: "approved"` |
| **Errores** | `403` · `404` · `409 EXCLUSION_ALREADY_EXISTS` · `409 CHECK_NOT_FAILING` · `422 VALIDATION_FAILED` |

#### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `test_id` | uuid | sí | Una prueba de un control del servicio; si no, `404` |
| `asset_id` | uuid | sí | Debe pertenecer al servicio; si no, `404` |
| `justification` | string | sí | Sin vacíos (`required`) |
| `technical_justification` | string | sí | Sin vacíos (`required`): la sonda no se acepta en falla sin sustento técnico |
| `valid_until` | date (`YYYY-MM-DD`) | sí | Posterior a hoy (`date.min`) y como mucho hoy + PR-04 (`exception.max_days`, el mensaje dice el máximo en días) |

```json
{
  "test_id": "21ab…",
  "asset_id": "8f10…",
  "justification": "El servidor se apaga en enero y no almacena datos de clientes.",
  "technical_justification": "Aislado de la red de producción desde el 2026-09-01; acceso solo por bastión con doble factor.",
  "valid_until": "2027-01-31"
}
```

Una fecha más larga que PR-04:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "fields": [{ "field": "valid_until", "code": "exception.max_days", "message": "La excepción dura como máximo 90 días." }]
  }
}
```

#### Response `201`
El objeto excepción de arriba.

> - **Solo se exceptúa un FAIL que existe hoy:** el último resultado vigente de un check Directo de esa prueba en ese activo, en algún control del servicio, es FAIL. Si no (pasa, sin datos o no aplica), `409 CHECK_NOT_FAILING`. Una prueba que no es técnica no aplica al activo: `404`.
> - Repetir una excepción vigente de la misma prueba en el mismo activo es `409 EXCLUSION_ALREADY_EXISTS`. Dos creaciones a la vez se serializan.
> - Ya no depende del período del servicio: la vigencia es la fecha de fin (D135 ajusta el punto 7 de D96).
> - Queda el evento `exclusion.approve` y, si mueve el estado de un control, su evento de estado (`cause: exclusion_approved`).

### GET /v1/services/{service_id}/exclusions — Listar excepciones

| | |
|---|---|
| **Quién** | `admin_empresa` · `auditor` |
| **Éxito** | `200`, paginada, de la más reciente a la más antigua |
| **Errores** | `403` · `404` |

#### Parámetros (query)
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `page`, `page_size` | integer | no | Ver `conventions.md` |
| `test_id`, `asset_id` | uuid | no | Filtro |
| `expired` | boolean | no | `true`/`false`, sobre `is_expired` |

> Para renovar una vencida se crea una nueva (se revalida, no se hereda). **No hay `PATCH`:** dejar sin efecto una vigente antes de que venza es `LATER`.

---

## Vencimiento (tarea diaria)

La tarea diaria del Backend (la misma pasada de los períodos auditados, `EVALUATION_PERIOD_INTERVAL_MINUTES`) busca las excepciones aprobadas cuyo `effective_until` ya pasó y que aún no tienen `expired_at`. Por cada una, en una transacción:

1. Marca `expired_at`. **Una sola vez por excepción**: una segunda pasada no repite nada.
2. Deja el evento de cumplimiento `exclusion.expire`.
3. Si el vencimiento mueve el estado de un control, deja su evento de estado con `cause: exclusion_expired` (D91). El aviso al delegado lo da el evento de estado, como cualquier otro cambio.

El estado que se muestra no espera a la tarea: se deriva al leer, así que el check vuelve a contar el mismo día en que vence.

## Errores del módulo

Los errores comunes (`FORBIDDEN`, `NOT_FOUND`, `VALIDATION_FAILED`) están en [`README.md`](README.md#errores-comunes); aquí solo los propios.

| HTTP | `error.code` | Cuándo |
|---|---|---|
| 409 | `EXCLUSION_ALREADY_EXISTS` | Ya hay una vigente de la misma prueba en el mismo activo |
| 409 | `CHECK_NOT_FAILING` | Hoy no hay un FAIL de un check Directo de esa prueba en ese activo |

`409 EVALUATION_NOT_DEFINED` ya no aplica a esta ruta (la vigencia no es el período).

**Claves i18n:** `exclusion.list`, `exclusion.created`, `exclusion.already_exists`, `exclusion.check_not_failing`; de validación, `validation.date_min` y `validation.exception_max_days`.

## Auditoría

| `action` | Cuándo | Quién |
|---|---|---|
| `exclusion.create` | Se aprueba una excepción | `admin_empresa` |

El evento de cumplimiento de la aprobación es `exclusion.approve`.

El vencimiento lo registra el sistema como evento de cumplimiento (`exclusion.expire`), no como acción de una persona.

---

## Estado de implementación

**Construido (2026-10-28, B66, MD-144):** `POST` y `GET`, nace `approved`, evento `exclusion.approve`, auditoría `exclusion.create`, candado contra creaciones simultáneas. El motor v2 ya aplica la excepción al leer con el tope de PR-04 (`fail_with_exception`).

**Construido (2026-11-27, MD-501):** `valid_until` del cliente con el tope de PR-04 (`422 date.min` y `exception.max_days`), `technical_justification` siempre obligatoria, `409 CHECK_NOT_FAILING`, `effective_until` y `expired_at` en la respuesta (columna `exclusions.expired_at`, migración aditiva) y la tarea diaria del vencimiento dentro de la pasada de `EvaluationPeriodScheduler`, aislada de la de los períodos y con una transacción por excepción (evento `exclusion.expire` y, si mueve el estado, `cause: exclusion_expired`). Cierra la deuda del vencimiento sin evento (cerrada en MD-501). Cierra también la de `excluded` (el motor v2 no guarda `excluded`: la excepción se deriva al leer; un fallo de la sonda es `no_data`) y la de la exclusión de un check suelto (D135 reemplaza la exclusión de un check suelto; decidido por Rod, 2026-11-27).

La pantalla de excepciones (Monkey Platform) hoy solo lista (`exclusion.service.ts` solo hace `GET`); aprobar una excepción desde la pantalla es otro ticket.
