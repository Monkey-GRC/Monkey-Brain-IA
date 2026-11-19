# Trazabilidad · historias de usuario

Responde: **¿qué necesita un auditor (y la empresa que lo recibe) para demostrar quién hizo qué, cuándo cambió el
cumplimiento de un control y que nadie lo alteró después?** Cada historia dice quién, qué y para qué; sus criterios de
aceptación son verificables y citan la regla que los fija. Trazabilidad **no tiene contrato propio**: la forma del rastro
está en [`contracts/conventions.md`](../../../../../../contracts/conventions.md) (sección «Auditoría») y las `action` de
cada módulo, en la tabla «Auditoría» de su contrato. La secuencia está en [`03-flujos.md`](03-flujos.md); los pasos de
cada caso, en [`05-casos-de-uso.md`](05-casos-de-uso.md).

**Roles** (D96, matriz de `datos/modelo/05-usuarios.md` §5.5): `admin_empresa`, `responsable`, `delegado`, `auditor`
(Monkey Platform) y `admin_monkey` (Monkey Admin). «Persona» = cualquiera de ellos. **Estado** de cada historia:
✅ construida · 🟡 parcial · ⚪ por construir.

**Jira:** épica [MD-320](https://rod2408.atlassian.net/browse/MD-320), una historia por fila. El cerebro manda: si una historia cambia, se actualiza aquí y después su issue.

## Resumen

| ID | Historia | Rol | Estado | Reglas | Jira |
|---|---|---|---|---|---|
| HU-TRZ-01 | Que cada acción deje constancia de quién, cuándo y cómo estaba antes | `auditor` | ✅ | D41, D52, SEG-36 | MD-421 |
| HU-TRZ-02 | Que nadie pueda editar ni borrar el rastro | `auditor` | ✅ | D41, SEG-33 | MD-422 |
| HU-TRZ-03 | Que los intentos rechazados también queden registrados | `auditor` | 🟡 | SEG-37, DT-29 | MD-423 |
| HU-TRZ-04 | Saber cuándo y por qué cambió el estado de un control | `auditor` | 🟡 | D91, SEG-63, DT-79 | MD-424 |
| HU-TRZ-05 | Distinguir lo que cambió la sonda de lo que cambió una persona | `auditor` | ✅ | D91 | MD-425 |
| HU-TRZ-06 | Que el rastro de mi empresa no lo vea ni lo escriba otra | `admin_empresa` | ✅ | SEG-34 | MD-426 |
| HU-TRZ-07 | Que el rastro de una empresa activa se conserve 7 años | `auditor` | 🟡 | D41, D97, SEG-35, DT-84 | MD-427 |
| HU-TRZ-08 | Consultar el rastro de auditoría de mi empresa | `auditor` · `admin_empresa` · `admin_monkey` | ⚪ | §5.5 | MD-428 |
| HU-TRZ-09 | Ver el historial de estados de un control | `auditor` · `admin_empresa` | ⚪ | D91, §5.5 | MD-429 |

---

### HU-TRZ-01 · Que cada acción deje constancia de quién, cuándo y cómo estaba antes

**Como** auditor, **quiero** que toda acción que cambia la plataforma o la seguridad deje una fila en el rastro **para**
poder reconstruir quién hizo qué y cómo estaba el dato antes y después.

- Cada fila lleva `action`, `resource`, `result` (`success` | `error`), `user_id`, `tenant_id`, `ip_address`,
  `user_agent` y, si cambió un dato, `before_state` y `after_state` (`conventions.md` → Auditoría).
- `action` sigue `<recurso>.<verbo>` en `snake_case` (`service.create`, `evidence.review`); una acción nueva se añade a
  la tabla «Auditoría» de su contrato antes de escribir el código.
- La fila se escribe **en la misma transacción** que la acción: si la acción se revierte, la fila también; si la fila
  falla, la acción se revierte y la respuesta es `500` `INTERNAL_ERROR` (D52, SEG-36).
- Todo método de repositorio que cambia datos exige el `AuditIntent`: uno nuevo sin él no compila (D52).
- Una acción de plataforma (registrar una empresa) se guarda con `tenant_id` nulo (`conventions.md`).
- Nunca se guarda un secreto en `before_state` ni `after_state`: ni clave de acceso, ni contraseña, ni hash, ni token.
- Excepción vigente: los cierres automáticos de sesión (inactividad, expiración, usuario inactivo) no dejan fila (DT-47).

### HU-TRZ-02 · Que nadie pueda editar ni borrar el rastro

**Como** auditor, **quiero** que el rastro sea de solo anexar para todos los roles de la base **para** poder usarlo como
evidencia sin dudar de que alguien lo corrigió.

- `UPDATE`, `DELETE` y `TRUNCATE` sobre `audit_logs` y `compliance_events` se rechazan para el rol de la aplicación y
  para el dueño de la tabla (`REVOKE` + triggers `audit.reject_mutation()`, D41, SEG-33).
- Una corrección es una fila nueva, nunca una edición (D41).
- `npm run audit:verify` comprueba el append-only contra la base y corre en el CI.
- Ningún rol de la matriz (§5.5) tiene la acción «borrar auditoría»: no existe.

### HU-TRZ-03 · Que los intentos rechazados también queden registrados

**Como** auditor, **quiero** ver los intentos de acceso rechazados **para** detectar actividad no autorizada (CC7.2,
CC7.3).

- Un inicio de sesión fallido deja `auth.login_failed` con `result = error`: con el `user_id` si la cuenta existe, o con
  el correo tecleado (`attempted_email`) si no (SEG-37).
- Un canje fallido de la clave deja `access_key.redeem` con `result = error` (`conventions.md`).
- Estos intentos se escriben aparte, de mejor esfuerzo: un fallo del registro no tumba la respuesta (D52, punto 4).
- `auth.login_failed` se guarda con `tenant_id` nulo: no se sabe de qué empresa es hasta autenticar (DT-29).
- **Falta:** un acceso denegado por rol (`403` sobre un recurso ajeno) no deja fila (SEG-37 🟠).

### HU-TRZ-04 · Saber cuándo y por qué cambió el estado de un control

**Como** auditor, **quiero** que cada cambio de estado o de semáforo de un control deje un evento con el valor anterior,
el nuevo y su causa **para** demostrar cómo estuvo cada control durante el período auditado (SOC 2 Tipo II).

- Dado que una escritura mueve el estado o el semáforo de uno o más controles del servicio, entonces queda un evento por
  control en `compliance_events` (`changed_field = control.state`, `previous_value`, `new_value`), en la misma
  transacción que la escritura (D91, SEG-63).
- Un cambio solo del porcentaje que no mueve el estado ni el semáforo no deja evento (D91, punto 1).
- Cada evento trae su causa; hoy la escriben el veredicto de una prueba manual y su revisión, la entrega y la revisión de
  una evidencia, aprobar una exclusión, editar las dimensiones de un control y lo que mide la sonda.
- La revisión del auditor no mueve el estado y no deja evento (D91, punto 3; `eventos-estado.e2e-spec.ts`).
- El estado se sigue derivando: el evento es la constancia, no el estado (D91, punto 2; §9).
- **Falta:** no dejan evento conectar, dar de baja o reactivar un activo, desactivar una prueba, dar de baja un control
  ni el vencimiento de una exclusión (DT-79).

### HU-TRZ-05 · Distinguir lo que cambió la sonda de lo que cambió una persona

**Como** auditor, **quiero** saber si un cambio de estado lo provocó una persona o el sistema **para** no atribuirle a
nadie lo que midió la evaluación automática.

- Un evento causado por la sonda (`probe_result`) se guarda con `user_id`, `ip_address` y `user_agent` nulos: el nulo
  significa «lo cambió el sistema», no un dato faltante (D91, punto 4).
- No se usa un usuario técnico de relleno (`02-modelo.md`).
- Un evento causado por una persona lleva su usuario, su IP y su agente.

### HU-TRZ-06 · Que el rastro de mi empresa no lo vea ni lo escriba otra

**Como** administrador de una empresa, **quiero** que mi rastro esté aislado del de las demás empresas **para** que nadie
fuera de mi empresa conozca lo que hacemos.

- RLS activo en el schema `audit`: una sesión de una empresa no lee ni escribe filas de otra (SEG-34,
  `rls-comportamiento.e2e-spec.ts`).
- El rastro se escribe sin `RETURNING`, así una acción de plataforma sin tenant no choca con la política de lectura
  (`02-modelo.md`).

### HU-TRZ-07 · Que el rastro de una empresa activa se conserve 7 años

**Como** auditor, **quiero** que el rastro de una empresa activa se conserve 7 años **para** cubrir los períodos que
pide SOC 2.

- Los 7 años los sostiene la base viva, inmutable (HU-TRZ-02): no hay purga del rastro de una empresa activa (D41,
  punto 3; D97).
- Las tablas no tienen llaves foráneas a las de negocio: dar de baja un control no borra su historial en cascada
  (`02-modelo.md`).
- Una empresa archivada y con el plazo vencido se borra entera, rastro incluido; queda solo el rastro mínimo (nombre,
  fecha y quién), sin datos del cliente (D97).
- **Falta:** los respaldos generales rotan a 35 días y no sostienen los 7 años; en staging el respaldo nocturno existe
  pero no se verifica que corra, y producción está sin construir (SEG-35 🟠, DT-84, D72).

### HU-TRZ-08 · Consultar el rastro de auditoría de mi empresa

**Como** auditor o administrador de mi empresa, **quiero** consultar el rastro en la plataforma **para** responder qué
pasó y cuándo sin pedir una consulta a la base de datos.

- Según la matriz de §5.5, ven el rastro `auditor` y `admin_empresa` (de su empresa), `admin_monkey` (el de
  plataforma), y `responsable` y `delegado` de forma «limitada»; nadie lo edita.
- Hoy no hay endpoint ni pantalla: el rastro solo se consulta por SQL. Necesita su contrato antes
  del código (regla 6 de `CLAUDE.md`); qué significa «limitado» no está definido en ninguna fuente.

### HU-TRZ-09 · Ver el historial de estados de un control

**Como** auditor o administrador de mi empresa, **quiero** ver cuándo pasó un control de un estado a otro y qué lo
provocó **para** demostrar su efectividad durante el período auditado.

- Los eventos ya se escriben (HU-TRZ-04) con su causa y su actor (HU-TRZ-05); falta leerlos.
- Hoy ningún endpoint lee `compliance_events`: no hay contrato ni pantalla (regla 6 de `CLAUDE.md`).
