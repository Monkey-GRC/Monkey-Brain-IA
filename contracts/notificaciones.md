---
id: contracts-notifications
name: Contrato — Notificaciones
description: La campana de cada persona (avisos de los últimos 90 días, leídos y no leídos, en tiempo real), su preferencia de correo y el catálogo de tipos de aviso. El resumen diario por correo lo arma una tarea programada.
type: contract
---
# Notificaciones

|                        |                                                                                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Estado**       | **Construido (MD-515, 2026-11-25)** (D138, D143, D131, D147 y D151)                                                                                                 |
| **App**          | Monkey Platform (campana, historial y preferencias). Monkey Admin no tiene campana todavía (DT-83)                                                                       |
| **Entidades**    | `notifications`, `notification_digests`, `users.is_email_digest_enabled` (`modelo-datos.md` §12) · enums: [`enums/notificaciones.md`](enums/notificaciones.md) |
| **Convenciones** | Sobre, errores, paginación, fechas e i18n: [`conventions.md`](conventions.md)                                                                                           |

**Qué es.** Cada aviso es de **una persona**: solo lo ve su destinatario, ni siquiera el `admin_empresa` ve los de otro (RLS por persona, SEG-87). Un aviso nace **en la misma transacción** que el hecho que lo causa (o en la pasada diaria de las ventanas) y llega a la campana **al instante** por un canal de eventos del servidor. Una vez al día, cada persona recibe por correo un **resumen** de lo que tiene sin leer, salvo que lo haya apagado. **Los avisos de la app no se apagan** (D143). El historial dura **90 días**.

## Índice de endpoints

| Método   | Ruta                                                                                                   | Quién                      | Para qué                                                                            |
| --------- | ------------------------------------------------------------------------------------------------------ | --------------------------- | ------------------------------------------------------------------------------------ |
| `GET`   | [`/v1/me/notifications`](#get-v1menotifications--listar-mis-avisos)                                   | Con sesión, cualquier rol  | Listar mis avisos de los últimos 90 días                                           |
| `GET`   | [`/v1/me/notifications/unread-count`](#get-v1menotificationsunread-count--contador-de-la-campana)     | Con sesión                 | El número de la campana (respaldo del canal en vivo)                                |
| `GET`   | [`/v1/me/notifications/stream`](#get-v1menotificationsstream--canal-en-vivo-sse)                      | Con sesión                 | Canal en vivo (Server-Sent Events): avisos nuevos y contador                         |
| `PATCH` | [`/v1/me/notifications/{id}`](#patch-v1menotificationsid--marcar-un-aviso)                            | Con sesión, solo los suyos | Marcar un aviso como leído o no leído                                              |
| `POST`  | [`/v1/me/notifications/read-all`](#post-v1menotificationsread-all--marcar-todos-como-leídos)         | Con sesión                 | Marcar todos como leídos                                                            |
| `GET`   | [`/v1/me/notification-preferences`](#get-v1menotification-preferences--mis-preferencias)              | Con sesión                 | Ver si el resumen por correo está encendido                                         |
| `PATCH` | [`/v1/me/notification-preferences`](#patch-v1menotification-preferences--encender-o-apagar-el-correo) | Con sesión                 | Encender o apagar el resumen diario por correo                                       |
| `GET`   | `/v1/catalogs/notification_type`                                                                     | Con sesión                 | Catálogo de tipos de aviso con su etiqueta (endpoint existente; se agrega la lista) |

## Quién puede qué

| Acción                                             |  `admin_empresa` | `responsable` | `delegado` | `auditor`                | `colaborador`                                   | `admin_monkey`                                         |
| --------------------------------------------------- | ------------------ | --------------- | ------------ | -------------------------- | ------------------------------------------------- | -------------------------------------------------------- |
| Ver, contar, escuchar y marcar **sus** avisos | ✓                 | ✓              | ✓           | ✓ (hoy no recibe ninguno) | ✓ (solo recibirá los de Documentos, reservados) | sin campana (DT-83); si llama, lista vacía y contador 0 |
| Ver o marcar el aviso de **otra persona**     | `404`            | `404`         | `404`      | `404`                    | `404`                                           | `404`                                                  |
| Encender o apagar **su** resumen por correo   | ✓                 | ✓              | ✓           | ✓                         | ✓                                                | —                                                       |
| Apagar los avisos de la app                         | no existe (D143)   |                 |              |                            |                                                   |                                                          |

> El aviso de otra persona responde **`404`, no `403`**: la RLS no lo deja ver, y que exista no es información que se dé (`conventions.md`).

## Cómo llega un aviso

1. **Ocurre el hecho** (catálogo abajo). Quien lo escribe resuelve los destinatarios con [`notification_audience`](enums/notificaciones.md#notification_audience) y guarda un aviso por persona **en la misma transacción**: si la escritura se revierte, el aviso también.
2. **Los avisos de vencimiento** (PR-06 y G-06) los genera la pasada diaria de las ventanas, la misma tarea que abre los períodos (D148). Son idempotentes: uno por persona, control y cierre de ventana.
3. **En vivo:** tras confirmar la transacción, el servidor publica el aviso en el canal `stream` de cada destinatario conectado. Si la conexión se cae, la campana se reconecta sola y, mientras tanto, consulta `unread-count`.
4. **El resumen diario** sale una vez al día desde las **12:00 UTC**. Lleva los avisos sin leer que no entraron en un resumen anterior (máximo 20, con «y N más») y **no sale si no hay ninguno**.
5. **Retención:** la API nunca devuelve avisos de más de 90 días y una pasada diaria los borra.

## El objeto aviso

| Campo          | Tipo                                              | Qué es                                                                                                                                                                                                            |
| -------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`         | uuid                                              |                                                                                                                                                                                                                    |
| `type`       | enum `notification_type`                        |                                                                                                                                                                                                                    |
| `is_read`    | boolean                                           |                                                                                                                                                                                                                    |
| `read_at`    | datetime \| null                                  |                                                                                                                                                                                                                    |
| `created_at` | datetime                                          |                                                                                                                                                                                                                    |
| `due_at`     | date \| null                                      | El cierre de la ventana; `null` si no aplica                                                                                                                                                                     |
| `title`      | string                                            | Ya traducido según `Accept-Language`. Lleva el código del control                                                                                                                                              |
| `detail`     | objeto                                            | La **plantilla de 7 campos**, traducida: `what_happened`, `why_it_matters`, `how_to_fix`, `who`, `time_needed`, `evidence`, `impact` (cada uno string \| null; la pantalla omite los `null`) |
| `service`    | `{ id, name }` \| null                          |                                                                                                                                                                                                                    |
| `control`    | `{ id, code, name, requirement_codes }` \| null | `code` del control y `requirement_codes` del marco (D80). **Nunca** códigos de prueba                                                                                                                   |
| `controls`   | `[{ id, code }]`                                | Solo en el aviso agrupado de controles «Sin asignar» (`target.kind = service`): hasta 5 controles con su id y código, para enlazarlos; `[]` en los demás. El total va en el título (MD-515)               |
| `target`     | `{ kind, id, service_id }`                      | `kind`: enum `notification_target_kind` (`control`, `service`, `document`, `company`). La pantalla arma el enlace; la API no conoce rutas del frontend                                                 |

```json
{
  "id": "7c1e…",
  "type": "window_due_soon",
  "is_read": false,
  "read_at": null,
  "created_at": "2026-12-16T12:00:05Z",
  "due_at": "2026-12-31",
  "title": "IAC-12 · La ventana trimestral cierra el 31/12/2026 y falta evidencia",
  "detail": {
    "what_happened": "La prueba «Revisión de accesos privilegiados» del control IAC-12 (CC6.1, CC6.2) no tiene evidencia válida en la ventana que cierra el 31/12/2026.",
    "why_it_matters": "Si la ventana cierra sin evidencia, el requisito pasa a Vencido y el control vuelve a Incumplimiento.",
    "how_to_fix": "Sube la evidencia desde el detalle del control y pide su revisión.",
    "who": "Ejecuta: Juan Pérez (delegado) · Dueño: Laura Gómez (responsable)",
    "time_needed": "Quedan 15 días para el cierre.",
    "evidence": "La que pide la prueba «Revisión de accesos privilegiados», del trimestre en curso.",
    "impact": "Con la evidencia a tiempo, el control conserva su nivel en el período auditado."
  },
  "service": { "id": "55aa…", "name": "Plataforma de pagos" },
  "control": { "id": "c0de…", "code": "IAC-12", "name": "Revisión de accesos privilegiados", "requirement_codes": ["CC6.1", "CC6.2"] },
  "target": { "kind": "control", "id": "c0de…", "service_id": "55aa…" }
}
```

> **Aviso agrupado de controles «Sin asignar»** (`target.kind = service`): en vez de uno por control, cada administrador recibe **uno por servicio, tipo y día**. Trae `control = null`, `due_at = null` y `target = { kind: "service", id: <servicio>, service_id }`; los datos del texto (`params`) llevan `control_count` y `control_codes` (hasta 5, en orden alfabético; el resto va como «y N más»). Entran los controles cuyo `alert_at` es hoy y los que cerraron ayer.

> **El texto se arma al leer**, no al guardar: la base guarda el tipo y los datos (`params`) y la API los traduce con `Accept-Language`. `time_needed` es el tiempo que queda hasta el cierre (D151).

---

### GET /v1/me/notifications — Listar mis avisos

|                   |                                                                         |
| ----------------- | ----------------------------------------------------------------------- |
| **Quién**  | Con sesión, cualquier rol. Solo los suyos                              |
| **Éxito**  | `200`, paginada, del más reciente al más antiguo                    |
| **Errores** | `401` · `422 VALIDATION_FAILED` (`enum.invalid`, `number.max`) |

#### Parámetros (query)

| Campo                   | Tipo                              | Obligatorio | Regla                                            |
| ----------------------- | --------------------------------- | ----------- | ------------------------------------------------ |
| `page`, `page_size` | integer                           | no          | `conventions.md` (25 por defecto, máximo 100) |
| `status`              | enum `notification_read_filter` | no          | `all` por defecto · `unread` · `read`    |
| `type`                | enum `notification_type`        | no          | Filtra por un tipo                               |

#### Response `200`

```json
{ "statusCode": 200, "message": "notification.list",
  "data": { "items": [ { "id": "7c1e…", "type": "window_due_soon", "is_read": false } ], "page": 1, "page_size": 25, "total": 1, "total_pages": 1 } }
```

> Solo los últimos **90 días**, aunque la pasada de borrado no haya corrido. Orden fijo (`-created_at`, `id`); no acepta `sort`.

### GET /v1/me/notifications/unread-count — Contador de la campana

|                   |                                                                           |
| ----------------- | ------------------------------------------------------------------------- |
| **Quién**  | Con sesión                                                               |
| **Éxito**  | `200` `{ "unread_count": 3 }` (mensaje `notification.unread_count`) |
| **Errores** | `401`                                                                   |

> Es el respaldo del canal en vivo: la campana lo pide al cargar y mientras el canal está caído.

### GET /v1/me/notifications/stream — Canal en vivo (SSE)

|                   |                                                                                               |
| ----------------- | --------------------------------------------------------------------------------------------- |
| **Quién**  | Con sesión (cookie de acceso, igual que el resto de la API; `X-Monkey-Client` de Platform) |
| **Éxito**  | `200` con `Content-Type: text/event-stream`; la conexión queda abierta                   |
| **Errores** | `401` (sin sesión o sesión vencida: el cliente renueva la sesión y se reconecta)         |

**Eventos** (`event:` y `data:` en JSON):

| `event`        | `data`                                                           | Cuándo                                                                                                                                                                                            |
| ---------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ready`        | `{ "unread_count": 3 }`                                          | Al abrir la conexión                                                                                                                                                                              |
| `notification` | `{ "unread_count": 4, "notification": { …el objeto aviso… } }` | Llega un aviso nuevo de la persona                                                                                                                                                                 |
| `unread_count` | `{ "unread_count": 2 }`                                          | Cambió el contador por otra pestaña (marcar leído o todos) y **cuando el servidor recupera su conexión con la base** (lo que se confirmó mientras estuvo caída no llegó por el canal) |
| `ping`         | `{}`                                                             | Cada 25 s, para que proxies no corten la conexión                                                                                                                                                 |

> - Solo publica avisos **ya confirmados** (después del commit). Un aviso que no alcanzó a publicarse no se pierde: está en la lista y en el contador.
> - Una conexión por pestaña, **hasta 5 por persona** en cada instancia: al abrir una más, el servidor cierra la más antigua (el cliente se reconecta solo). Al cerrar sesión, el servidor cierra el canal. El texto del aviso viaja en el idioma de la persona (`users.preferred_language`).
> - No deja `audit_logs`.

### PATCH /v1/me/notifications/ — Marcar un aviso

|                   |                                                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Quién**  | Con sesión; solo el destinatario                                                                                          |
| **Éxito**  | `200` con el aviso (mensaje `notification.updated`)                                                                    |
| **Errores** | `401` · `404` (no existe, es de otra persona o tiene más de 90 días) · `422` (`required`, `boolean.invalid`) |

#### Request

| Campo       | Tipo    | Obligatorio | Regla                                                  |
| ----------- | ------- | ----------- | ------------------------------------------------------ |
| `is_read` | boolean | sí         | `true` marca leído; `false` lo vuelve a no leído |

> Idempotente: marcar leído uno ya leído no cambia su `read_at`. **No deja `audit_logs`** (estado de la interfaz, D151). Un aviso suelto no se borra.

### POST /v1/me/notifications/read-all — Marcar todos como leídos

|                   |                                                                        |
| ----------------- | ---------------------------------------------------------------------- |
| **Quién**  | Con sesión                                                            |
| **Éxito**  | `200` `{ "updated_count": 3 }` (mensaje `notification.read_all`) |
| **Errores** | `401` · `422` (`date.invalid`)                                  |

#### Request

| Campo     | Tipo     | Obligatorio | Regla                                                                                                                      |
| --------- | -------- | ----------- | -------------------------------------------------------------------------------------------------------------------------- |
| `up_to` | datetime | no          | Solo marca los creados hasta ese instante (el más nuevo que vio la persona), para no marcar uno que llegó mientras leía |

### GET /v1/me/notification-preferences — Mis preferencias

|                   |                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Quién**  | Con sesión                                                                                                              |
| **Éxito**  | `200` `{ "is_email_digest_enabled": true, "email_digest_time_utc": "12:00" }` (mensaje `notification.preferences`) |
| **Errores** | `401`                                                                                                                  |

### PATCH /v1/me/notification-preferences — Encender o apagar el correo

|                   |                                                                               |
| ----------------- | ----------------------------------------------------------------------------- |
| **Quién**  | Con sesión                                                                   |
| **Éxito**  | `200` con las preferencias (mensaje `notification.preferences_updated`)   |
| **Errores** | `401` · `422` (`required`, `boolean.invalid`, `field_not_allowed`) |

#### Request

| Campo                       | Tipo    | Obligatorio | Regla                                                         |
| --------------------------- | ------- | ----------- | ------------------------------------------------------------- |
| `is_email_digest_enabled` | boolean | sí         | `false` apaga el resumen por correo; la campana sigue igual |

> Deja `user.notification_preferences_changed` en `audit_logs` (antes y después) en la misma transacción (D52). Un resumen ya enviado ese día no se retira.

---

## Catálogo de tipos de aviso

Valores, etiquetas y destinatarios: [`enums/notificaciones.md`](enums/notificaciones.md#notification_type).

| `type`                                                                                                                 | Cuándo                                                                                                                                              | Recibe                                                                                       | `target.kind`            | Lo emite                           | Estado     |
| ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------- | ---------------------------------- | ---------- |
| `window_due_soon`                                                                                                      | Llega `alert_at` (cierre − PR-06) y alguna prueba del control sigue sin evidencia válida. **No en periodicidad diaria**                    | ejecutor · dueño; un control «Sin asignar», los administradores en un aviso por servicio | `control` · `service` | MD-515 (pasada diaria)             | construido |
| `window_expired`                                                                                                       | La ventana cerró sin evidencia en el período auditado abierto (G-06)                                                                               | ejecutor · dueño · administrador                                                          | `control` · `service` | MD-515 (pasada diaria)             | construido |
| `control_assigned`                                                                                                     | Te asignaron como dueño o como ejecutor de un control (o te lo reasignaron)                                                                         | la persona asignada                                                                          | `control`                | MD-515 (`PUT /v1/assignments/*`) | construido |
| `evidence_approved`                                                                                                    | Se validó una evidencia (sin emisor desde MD-504)                                                                                                   | quien la subió · dueño                                                                    | `control`                | MD-515 (revisión de evidencia)    | construido |
| `evidence_rejected`                                                                                                    | Se rechazó una evidencia (sin emisor desde MD-504)                                                                                                  | quien la subió · dueño                                                                    | `control`                | MD-515 (revisión de evidencia)    | construido |
| `observation_created`                                                                                                  | El auditor dejó una observación                                                                                                                    | dueño · ejecutor                                                                           | `control`                | pendiente                          | reservado  |
| `direct_check_failed`                                                                                                  | Un check Directo **pasa** a FAIL en un activo (antes PASS o sin dato), sin excepción vigente. No en la primera recolección del activo (D153) | ejecutor · dueño · administrador                                                          | `control`                | MD-508 (cierre de la recolección) | construido |
| `check_parameters_changed`                                                                                             | Un `admin_monkey` cambió un parámetro PR-01 a PR-16 (D149)                                                                                       | todo `admin_empresa` activo de cada empresa no archivada (D153)                            | `company`                | MD-508 (pasada por empresa)        | construido |
| `automatic_evidence_stale`                                                                                             | La última recolección de un activo del control supera PR-05 (D153)                                                                                 | ejecutor · dueño                                                                           | `control`                | MD-508 (pasada diaria)             | construido |
| `control_pending_approval` · `control_owner_approved` · `control_returned`                                       | Gestión del control (D132)                                                                                                                          | ver enum                                                                                     | `control`                | MD-504 (RC-07)                     | construido |
| `level_override_proposed` · `level_override_decided` · `remediation_plan_proposed` · `remediation_plan_decided` · `not_applicable_requested` · `not_applicable_decided` | Corrección de nivel, plan de remediación y «No aplica» (D140, D135) | ver enum | `control` | MD-529 | construido |
| `document_assigned` · `document_acceptance_reminder` · `document_approval_requested` · `document_renewal_due` | Documentos (D133)                                                                                                                                    | ver enum                                                                                     | `document`               | MD-506 (RC-09)                     | reservado  |
| `company_purge_upcoming`                                                                                               | Faltan 3 días o menos para borrar una empresa archivada (D97)                                                                                       | `admin_monkey`                                                                             | `company`                | DT-83                              | reservado  |

> «Reservado»: el valor ya existe en el enum y en i18n, pero nadie lo emite todavía. Cada ticket que lo emita cambia su estado aquí.

## Qué dice cada aviso y a dónde llega

Una fila por tipo de aviso y por correo transaccional (evento, canal, título y texto): [`notificaciones/textos.md`](notificaciones/textos.md). Al crear o cambiar un aviso o un correo, su fila se actualiza en el mismo cambio.

## Avisos de la evaluación automática (MD-508, D153)

Avisan el **cambio**, no el estado: un control que sigue en falla o desactualizado no vuelve a avisar cada día.

| `type`                     | Nace                                                                                                                                                                                                                                                                                                                                                                                                       | Agrupa                              | `dedupe_key` (uno por persona)                                                                                                                                                                                                                      | Qué lleva el aviso                                                                                                                                                                                           |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `direct_check_failed`      | En la transacción que cierra la recolección (sonda o nube), comparando cada check Directo con la recolección **anterior del mismo activo**. Si el activo no tiene recolección anterior, no avisa                                                                                                                                                                                                 | Un aviso por control y recolección | `direct_check_failed:<control_id>:<execution_id>` Pares activo · verificación que pasaron a FAIL (hasta 5, con «y N más»; una recolección es de un solo activo), ordenados por prioridad de brecha (D162: la severidad del check y la criticidad del activo propio del recurso si existe, D61, si no la del activo) y, a igual prioridad, por título, con el mensaje de brecha de D138 punto 3 traducido; nunca el proveedor (D70) |                                                                                                                                                                                                               |
| `check_parameters_changed` | En la pasada por empresa (la de las ventanas), con el permiso de esa empresa: lee los cambios de parámetros de `catalog-admin` (D149) de los **últimos 3 días** y la clave evita repetir los ya avisados. No es instantáneo (D153); un cambio que ninguna pasada procese en 3 días ya no se avisa. Un cambio anterior a la creación de la empresa no se avisa; `admin_monkey` no lo recibe | Un aviso por persona y cambio       | `check_parameters_changed:<id del cambio>` (fila de `catalog.evaluation_parameter_changes`, que el `PATCH` escribe en su misma transacción)                                                                                                    | Parámetro (`PR-n` y su nombre), valor anterior, valor nuevo y qué efecto tiene en la evaluación. `control` y `service` van `null`; `target = { kind: company, id: <empresa>, service_id: null }` |
| `automatic_evidence_stale` | Pasada diaria (la de las ventanas): activos con prueba automática cuya última recolección completada es más vieja que PR-05                                                                                                                                                                                                                                                                            | Un aviso por control                | `automatic_evidence_stale:<control_id>:<id de la última recolección de cada activo>`                                                                                                                                                              | Activos desactualizados (hasta 5) y desde cuándo; cómo se resuelve: una recolección nueva del activo                                                                                                       |

- **No se repite:** la clave de `automatic_evidence_stale` incluye la última recolección, así que solo vuelve a avisar después de una recolección fresca que también envejezca.
- **Una excepción vigente** (PR-04) no avisa: el FAIL con excepción es `fail_with_exception`.
- **Activos sin servicio** o pruebas no Directas (Complementarias, S-04) no avisan.
- La falla de una **ejecución** (conexión, tiempo agotado) no es una falla de check y no avisa por aquí.

## El resumen diario por correo

|                      |                                                                                                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **A quién**   | Cada persona `active` de una empresa no archivada, con `is_email_digest_enabled = true` y al menos un aviso sin leer que no haya entrado en un resumen                                             |
| **Cuándo**    | Una vez al día desde las 12:00 UTC (`NOTIFICATION_DIGEST_HOUR_UTC`)                                                                                                                                 |
| **Idioma**     | `users.preferred_language` (D111)                                                                                                                                                                    |
| **Qué lleva** | Asunto «Monkey · Tienes N avisos nuevos (dd/mm/aaaa)», una línea por aviso con su `title` (código del control) y servicio, máximo 20 con «y N más», un botón a la campana y cómo apagarlo |
| **Si falla**   | Queda `failed` y se reintenta en la siguiente pasada del mismo día (máximo 3); sus avisos no se marcan como enviados. Deja `notification.digest_email` con `result = error`, sin el cuerpo     |

## Reglas de negocio

- **Destinatarios** (`notification_audience`, D151): el ejecutor es `executor_id` y, si es nulo, ejecuta el dueño; el dueño es `owner_id`; un control **«Sin asignar»** avisa a los administradores; el administrador es **todo** `admin_empresa` `active`. Una persona con dos papeles recibe **un** aviso. Solo cuentas `active`.
- **Quien causa el hecho no se avisa a sí mismo.**
- **Un aviso por control y cierre de ventana** (agrupa sus pruebas) y **un solo recordatorio**, en `alert_at`. Un servicio sin período auditado abierto recibe el aviso previo, no el de vencida.
- **Idempotencia:** `(user_id, dedupe_key)` es único; repetir la pasada o tener dos réplicas no duplica.
- **Un aviso no cambia el cumplimiento:** leerlo no cierra nada.
- **Textos:** cada tipo tiene en `i18n/{es,en}/notification.json` su `title` y los 7 campos. Siempre el código del control y los `requirement_codes`; **nunca** códigos de prueba ni el proveedor de la sonda o del motor de nube (D70, SEG-39). Un texto del catálogo pasa por el filtro de proveedor.

## Errores del módulo

Sin errores propios: los comunes (`401`, `404`, `422 VALIDATION_FAILED` con `enum.invalid`, `boolean.invalid`, `date.invalid`, `number.max`, `required`, `field_not_allowed`).

**Claves i18n:** `notification.list`, `notification.unread_count`, `notification.updated`, `notification.read_all`, `notification.preferences`, `notification.preferences_updated`; textos por tipo en `notification.types.<type>.{title,what_happened,…}`; correo en `notification.digest.*`; etiquetas en `catalogs.notification_type.*`.

## Auditoría

| `action`                                | Cuándo                                                                                                                                     | Quién                     | `tenant_id`               |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | --------------------------- |
| `user.notification_preferences_changed` | Cambia `is_email_digest_enabled`                                                                                                          | la persona                 | su empresa                  |
| `notification.digest_email`             | El resumen salió o falló (`result = success`/`error`); `after_state`: `user_id`, `digest_date`, `item_count`; nunca el cuerpo | sistema (`user_id` nulo) | la empresa del destinatario |

> Crear un aviso no deja `audit_logs`: el hecho que lo causa ya dejó el suyo. Marcar leído tampoco. El rastro de que se avisó (CC2.2/CC2.3) es `notification.digest_email`, que no se borra a los 90 días.

---

## Estado de implementación

**Construido (MD-515, 2026-11-25).** Backend: `src/features/notifications/` (lista, contador, marcar, canal SSE, preferencias, resumen diario y retención), emisores en `src/infrastructure/notifications/` y `src/features/compliance/domain/notifications/`; migraciones `20261125100000..100300` y `20261125110000_notification_guards`; i18n en `i18n/{es,en}/notification.json`. Platform: la campana del header (`HEADER_WIDGETS`).

- **Emiten hoy:** `window_due_soon`, `window_expired` (pasada diaria de las ventanas), y `control_assigned`. **Desde MD-504 (2026-11-25, D132):** `control_pending_approval`, `control_owner_approved` y `control_returned` (`compliance/infrastructure/management/`); `evidence_approved` y `evidence_rejected` **dejaron de emitirse** (la aprobación es del control) y quedan en el enum sin emisor. **Desde MD-508 (2026-11-25, D153):** `direct_check_failed` (al cerrar la recolección de nube o sonda, `technical-control/infrastructure/notifications/direct-check-failures.loader.ts`), `automatic_evidence_stale` y `check_parameters_changed` (pasada por empresa, `compliance/infrastructure/periods/evaluation-period.prisma.repository.ts`); historial `catalog.evaluation_parameter_changes` (migraciones `20261125120000..120200`). La publicación en vivo la hace el disparador `platform.publish_notification` (migración `20261125130000`): solo publica las filas realmente insertadas. El resto sigue reservado.
- **Canal en vivo:** usa `LISTEN`/`NOTIFY` de Postgres, así que `APP_DATABASE_URL` debe ser una conexión **directa** (no un pooler en modo transacción). Variables: `NOTIFICATION_DIGEST_INTERVAL_MINUTES` (60; 0 apaga la tarea) y `NOTIFICATION_DIGEST_HOUR_UTC` (12); la misma tarea borra los avisos de más de 90 días.
- **`admin_monkey`:** no recibe avisos hoy; el listado y el contador responden vacío y 0.
- **Pruebas:** `test/notificaciones/aislamiento-avisos.e2e-spec.ts` (SEG-87).
- **Pantalla (Platform, MD-508):** la campana abre un panel de tarjetas y el detalle del aviso se abre encima; «Ver todas» lleva a `/notificaciones`, una página completa fuera del shell con «Volver a la aplicación». `/avisos` y `/notificaciones/ventana` redirigen a ella. El objeto aviso no tiene `summary`: la tarjeta usa `title` y `detail.what_happened`.
