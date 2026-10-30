---
id: contracts-users-team
name: Contrato — Equipo: invitar, activar y repartir el trabajo por dimensión
description: Cómo el administrador de la empresa invita a su equipo (funcional y auditor), cómo activan su cuenta y cómo se reparte el trabajo por dimensión.
type: contract
---

# Equipo — invitar, activar y repartir el trabajo por dimensión

**Estado: ACORDADO (2026-10-27, D96; ajustado por D98, 2026-10-29); construido en el Backend y en Platform (ver «Estado de implementación»).** Ver `conventions.md` y `enums.md`. Tickets: MD-131, MD-132, MD-134 (pantalla Equipo), MD-158 (asignar el trabajo). **App:** Monkey Platform. Reglas: `modelo-datos.md` §5.1 y §5.2 (D63, D96).

**Qué es.** El `admin_empresa` es el experto en compliance de su empresa: invita a su gente, les da una especialidad y reparte el trabajo por **dimensión**. Un `funcional` ve y hace solo lo suyo; el `auditor` ve todo en solo lectura. `admin_monkey` no entra aquí: no crea ni desactiva cuentas de una empresa.

## Quién puede qué

| Acción | `admin_empresa` | `funcional` | `auditor` | `admin_monkey` |
|---|---|---|---|---|
| Invitar, editar, desactivar y reactivar a `funcional` y `auditor`, y reemitir su código | ✓ | `403` | `403` | `403` |
| Ver la lista del equipo | ✓ | `403` | `403` | `403` |
| Asignar el responsable de una dimensión en un servicio, o de un control | ✓ | `403` | `403` | `403` |
| Ver quién es responsable de qué | ✓ | `403` | ✓ (solo lectura) | `403` |
| Restablecer el segundo factor de alguien de su equipo | ✓ (`DELETE /v1/users/{id}/mfa`, D94) | `403` | `403` | `403` |

## Cómo entra alguien del equipo

1. **Alta.** El `admin_empresa` crea la cuenta con el correo, el rol y, si es `funcional`, sus especialidades (`POST /v1/users`). La cuenta nace `pending` y la respuesta trae su **código de activación, una sola vez** (`MNK-XXXX-XXXX-XXXX`, vigente `ACTIVATION_CODE_TTL_HOURS`, 168 por defecto). El administrador se lo entrega a mano: el correo está aplazado (MD-69).
2. **Activación.** En dos pasos, como el canje de la clave (D51): `POST /v1/auth/activate/lookup` y `POST /v1/auth/activate` (ver `auth.md`). Con el segundo factor obligatorio (D94), la activación termina en la configuración del TOTP.
3. **Ingreso.** Correo, contraseña y segundo factor, como cualquier cuenta. No hay elección de empresa: la de su cuenta.

Una cuenta `pending` que intenta iniciar sesión recibe `401 INVALID_CREDENTIALS`, igual que con una contraseña mala.

## Equipo (`admin_empresa`)

### `POST /v1/users`
```json
{ "email": "juan@acme.co", "name": "Juan", "last_name": "Pérez", "role": "funcional", "dimensions": ["server", "database"] }
```
`name` y `last_name` son **obligatorios** (máx. 100; D98). `role` es `admin_empresa` (otro administrador de la empresa), `funcional` o `auditor` (nunca `admin_monkey`). `dimensions` es **obligatorio y no vacío** para `funcional` y **no se envía** para los otros dos (`422 dimensions.not_allowed`). `201`:
```json
{
  "statusCode": 201,
  "message": "user.created",
  "data": {
    "id": "c4a1f2e8-9b30-4d5a-b7e1-6f8c0d2a3b44",
    "email": "juan@acme.co",
    "name": null,
    "last_name": null,
    "role": "funcional",
    "status": "pending",
    "is_mfa_enabled": false,
    "last_login_at": null,
    "dimensions": ["server", "database"],
    "created_at": "2026-10-27T15:04:02Z",
    "activation_code": { "code": "MNK-7F3A-92KD-5QXB", "status": "pending", "expires_at": "2026-11-03T15:04:02Z" }
  }
}
```
Correo repetido en cualquier cuenta: `409 EMAIL_TAKEN`.

### `GET /v1/users`
Paginada (`page`, `page_size`, `sort` = `created_at`/`email` con ±, filtros `role` y `status`). Es **la lista del equipo de la empresa**, incluido el propio administrador (solo lectura). Mismos campos de arriba, sin el código. Nunca devuelve el código ni su hash.

### `PATCH /v1/users/{id}`
```json
{ "status": "inactive" }
```
o `{ "dimensions": ["server"] }` o `{ "name": "Juan", "last_name": "Pérez" }` (corrige el nombre); se pueden combinar. No cambia el rol. **Desactivar cierra todas sus sesiones al instante** (`CC6.3`). Reglas:
- Uno mismo solo puede corregir su nombre: desactivarse o cambiarse las especialidades es `409 LAST_ADMIN`. A otro `admin_empresa` sí se le puede corregir el nombre, desactivar y reactivar (D98); la empresa nunca se queda sin administrador.
- No aplica a una cuenta `pending` (`409 USER_NOT_ACTIVATED`).
- Quitarle una especialidad a un `funcional` que sigue siendo responsable de esa dimensión (en un servicio o en un control) responde `409 DIMENSION_IN_USE` con `error.responsibilities_count`: primero se reasigna.
- Sobre `admin_monkey` o alguien de otra empresa: `404`.

### `POST /v1/users/{id}/activation-code`
Sin cuerpo. Revoca el código vigente y emite uno nuevo (misma respuesta del alta, `201`). Solo mientras la cuenta esté `pending`; si no, `409 USER_ALREADY_ACTIVE`.

## Responsable por dimensión (`admin_empresa`; el `auditor` lee)

El **responsable efectivo** de un par (control, dimensión) es la excepción del control si existe; si no, el responsable del servicio para esa dimensión; si tampoco, ninguno (`modelo-datos.md` §5.1).

### `GET /v1/services/{service_id}/dimension-owners`
Siempre las cinco dimensiones, en el orden de `enums.md`:
```json
{
  "items": [
    {
      "dimension": "server",
      "owner": { "id": "c4a1…", "email": "juan@acme.co", "name": null, "last_name": null },
      "controls_total": 41,
      "controls_with_exception": 2,
      "controls_without_owner": 0
    },
    { "dimension": "cloud", "owner": null, "controls_total": 33, "controls_with_exception": 0, "controls_without_owner": 33 }
  ]
}
```
`controls_total` cuenta los controles del servicio que tienen pruebas de esa dimensión.

### `PATCH /v1/services/{service_id}/dimension-owners/{dimension}`
```json
{ "user_id": "c4a1f2e8-…" }
```
`200` con la fila de arriba. `user_id: null` deja la dimensión sin responsable del servicio (los controles con excepción conservan la suya). Debe ser un `funcional` **activo o pendiente** de la empresa **con esa especialidad**: si no la tiene, `409 USER_LACKS_DIMENSION`; si no es un `funcional` de la empresa, `404`.

### `GET /v1/controls/{id}/responsibles`
Una fila por cada dimensión en la que el control tiene pruebas:
```json
{ "items": [ { "dimension": "server", "tests_count": 3, "owner": { "id": "c4a1…", "email": "juan@acme.co", "name": null, "last_name": null }, "source": "service" } ] }
```
`source` es `control` (excepción), `service` (el principal del servicio) o `null` si no hay responsable.

### `PATCH /v1/controls/{id}/responsibles/{dimension}`
```json
{ "user_id": "c4a1f2e8-…" }
```
Pone la excepción de ese control en esa dimensión. `user_id: null` **quita la excepción** y el control vuelve al responsable del servicio. Mismas validaciones que arriba; una dimensión en la que el control no tiene pruebas responde `404`.

## Lo que ve cada rol

> **D98 (2026-10-29): por ahora el `funcional` atiende todo lo de sus especialidades, sin que nadie se lo asigne.** Lo que sigue sobre «responsable efectivo» (servicio y excepción por control) **se conserva en la API y en la base pero no cambia lo que nadie ve**, y la interfaz lo tiene apagado, hasta que se decida cómo repartir a personas concretas.

- **`funcional`:** en las listas de Cumplimiento (`controls`, `evidence`, y las pruebas de un control) recibe **solo** lo de sus especialidades, en todos los servicios de su empresa; sin especialidad que coincida, la lista llega vacía, no falla. Un recurso que existe pero no es suyo responde `403`; de otra empresa, `404` (`conventions.md`).
- **`auditor`:** todo, en solo lectura, con la vista técnica.
- **`admin_empresa`:** todo; las pruebas sin responsable se señalan como «sin responsable».

## Auditoría

| `action` | Cuándo | Quién | `tenant_id` |
|---|---|---|---|
| `user.create` | se invita a una persona | `admin_empresa` | la empresa |
| `user.update` | se edita, desactiva o reactiva (`before_state`/`after_state`; `sessions_closed` al desactivar) | `admin_empresa` | la empresa |
| `user.activation_code_regenerate` | se emite un código nuevo | `admin_empresa` | la empresa |
| `user.activate` | la persona activa su cuenta (también si falla: `result = error`) | la persona, o `attempted_email` | la empresa |
| `dimension_owner.set` | se cambia el responsable de una dimensión en un servicio | `admin_empresa` | la empresa |
| `control_responsible.set` | se pone o se quita la excepción de un control | `admin_empresa` | la empresa |

Nunca se guarda el código ni su hash (`conventions.md`). Se escribe en la misma transacción que la acción (D52, SEG-36).

## Errores

| HTTP | `error.code` | Cuándo |
|---|---|---|
| 403 | `FORBIDDEN` | El rol no puede hacer esto |
| 404 | `NOT_FOUND` | Usuario, servicio, control o dimensión inexistentes **para esta empresa** |
| 404 | `ACTIVATION_CODE_INVALID` · 409 `ACTIVATION_CODE_ALREADY_USED` · 409 `ACTIVATION_CODE_EXPIRED` · 422 `ACTIVATION_CODE_EMAIL_MISMATCH` · 429 `ACTIVATION_CODE_RATE_LIMITED` | La activación; ver `auth.md` |
| 409 | `EMAIL_TAKEN` | Ese correo ya tiene cuenta |
| 409 | `LAST_ADMIN` | Se intenta desactivar al único `admin_empresa` activo, o a uno mismo |
| 409 | `USER_NOT_ACTIVATED` | Se intenta desactivar o reactivar una cuenta `pending` |
| 409 | `USER_ALREADY_ACTIVE` | Se pide otro código para una cuenta que ya activó |
| 409 | `USER_LACKS_DIMENSION` | Se asigna a un `funcional` una dimensión que no es de su especialidad |
| 409 | `DIMENSION_IN_USE` | Se le quita una especialidad a quien aún es responsable de ella |
| 422 | `VALIDATION_FAILED` | `required`, `email.invalid`, `enum.invalid`, `array.min`, `uuid.invalid`, `dimensions` en un `auditor`, contraseña que no cumple la política |

Claves i18n: `user.created`, `user.list`, `user.updated`, `user.activation_code_regenerated`, `dimension_owner.list`, `dimension_owner.updated`, `control_responsible.list`, `control_responsible.updated`.

## Estado de implementación

**Construido (2026-10-29, B67): todo el contrato.**

- **Activación** (2026-10-28): `POST /v1/auth/activate/lookup` y `POST /v1/auth/activate` (feature `auth`), con `ACTIVATION_CODE_*`, el mismo freno de intentos de las claves de acceso y el segundo factor al terminar (D94). Pruebas: `test/autenticacion/activacion.e2e-spec.ts`.
- **Equipo** (feature `team`): `POST/GET/PATCH /v1/users` y `POST /v1/users/{id}/activation-code`. El código sale con `ACTIVATION_CODE_TTL_HOURS` (168 por defecto) y en la base solo queda su huella. `PATCH` desactiva cerrando las sesiones en la misma transacción. Quitar una especialidad en uso responde `409 DIMENSION_IN_USE` con `responsibilities_count`.
- **Responsable por dimensión:** `GET`/`PATCH /v1/services/{id}/dimension-owners[/{dimension}]` y `GET`/`PATCH /v1/controls/{id}/responsibles[/{dimension}]`. Una dimensión que no existe responde `404`. Un control dado de baja es `409 CONTROL_RETIRED`.
- **En la base:** `user_dimensions`, `service_dimension_owners` y `dimension` en `user_control_assignments` (única por control y dimensión), con RLS. Migraciones `20261029000100_team_dimensions` (las asignaciones viejas «del control entero» pasan a una fila por cada dimensión que el control lleva) y `20261029000200_rls_team_dimensions`.
- **Lo que ve el `funcional` (SEG-66):** el responsable efectivo se calcula al leer (`infrastructure/shared/control-responsibles.ts`): la excepción del control o, si no hay, el responsable del servicio, solo en las dimensiones en que el control tiene pruebas. Con eso, la **lista y el detalle de controles** traen solo los controles de los que es responsable en alguna dimensión (`failing` del detalle, solo lo de sus dimensiones); la **evidencia** (lista, entregas, subida y descarga) solo la de su dimensión; los **riesgos y causas**, los que tocan sus controles; el **resumen** del servicio, sus controles que fallan; y los **hallazgos** de una prueba de nube, solo si es el responsable de la nube en ese control (`403` si no).
- Pruebas: `test/equipo/equipo.e2e-spec.ts` (invitar, activar, desactivar, reemitir, responsables, SEG-66) y `test/control-tecnico/hallazgos.e2e-spec.ts`.

Matices que el contrato no decía:

- `PATCH /v1/users/{id}` sobre uno mismo es `409 LAST_ADMIN`; sobre otro administrador, `admin_monkey` o alguien de otra empresa, `404`. Un cuerpo vacío es `422 status.required`; `dimensions` a un auditor, `422 dimensions.not_allowed`.
- El `funcional` sigue viendo `assigned_to` (la primera persona responsable de las suyas) en la lista de controles; `responsible` por dimensión como campo de la respuesta está **sin construir** (se pide con `GET /controls/{id}/responsibles`).
- Mientras alguien con la especialidad quitada siga siendo responsable no se deja; desactivar a un responsable **no** lo reasigna: sus controles quedan «sin responsable efectivo activo» hasta que el administrador los reparta (pendiente de decisión, no de código).

- **Servicios en lectura (2026-10-29):** `GET /v1/services` y `GET /v1/services/{id}` los leen también el `auditor` (todos) y el `funcional` (solo los servicios en los que es responsable de alguna dimensión; el detalle de otro es `403`). Sin esto no llegaban a Cumplimiento. Crear, editar y borrar un servicio siguen siendo solo del `admin_empresa`. El archivo de la descripción del sistema sigue siendo solo del administrador.

**Interfaz construida en Monkey Platform (2026-10-29):** la pantalla **Equipo** (`/equipo`), la **activación** con el mismo formulario que la clave de una empresa (acepta cualquiera de los dos códigos), el **reparto por servicio** y el **responsable por control** en el panel de detalle del control. Ver `context/frontend.md`.

**Sin construir:** invitar por correo (MD-69), el campo `responsible` por dimensión en la lista de controles, una vista «Mi trabajo» para el `funcional` (hoy ve su Cumplimiento filtrado) y la pantalla donde el administrador valida la evidencia (`compliance-audit.md`).

## Fuera de este corte

Asignar controles en bloque a varias personas (se resuelve con el responsable del servicio), la pantalla de «bandeja del funcional» como endpoint propio (se compone con las listas de Cumplimiento), invitar por correo (MD-69), restablecer el segundo factor del `admin_empresa` desde Monkey Admin (D94, punto 8) y la contraseña que vence a los 90 días.

## Preguntas abiertas

`P34` (quien sube y quien valida son la misma persona) y `P35` (calificación del auditor) no bloquean este corte.
