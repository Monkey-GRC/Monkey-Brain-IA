# Decisiones — Trazabilidad

Por qué Trazabilidad es como es. **Se consulta para reabrir, no para construir**: lo vigente está en [`arquitectura/trazabilidad/`](../../arquitectura/trazabilidad/README.md) y en `datos/modelo/`. Índice de todas las decisiones: [`README.md`](README.md).

## D27 · Qué dice una evaluación, y por qué es inmutable de verdad

**Decisión:** `evaluations` gana `test_id` (obligatorio) y `check_id` (opcional, cuando la midió
la sonda), y `evaluated_at` pasa de fecha a **instante**. La inmutabilidad se impone en la base:
el rol de la app no puede `DELETE`, y solo puede `UPDATE` `confirmed_by` y
`closure_observation_reason` (el cierre humano de §7.5).

**Por qué:** sin `test_id`/`check_id` una evaluación no dice qué se evaluó, y §9 exige señalar
"el activo y el check exactos"; las exclusiones (§7.3) son por test + check. Con fecha, dos
corridas de la sonda el mismo día (cada 6 h) no se pueden ordenar.

---

## D41 · El audit trail es inmutable en la base de datos y se retiene 7 años (MD-92)

> **Enmendada por D97 (2026-10-28):** la retención de 7 años no aplica a una empresa que se archiva y se borra definitivamente; se purga con ella (queda un rastro mínimo). Sigue vigente para las demás.

> La exigencia de escribir el rastro **en la misma transacción** que la acción se cumplió recién con **D52**.

**Decisión:**
1. **Inmutable para todos los roles, no solo para la app.** `audit.audit_logs` y `audit.compliance_events`
   rechazan `UPDATE`, `DELETE` y `TRUNCATE` con triggers (migración `audit_append_only_triggers`), además del
   `REVOKE` que ya tenía `monkey_app`. Antes, el dueño de las tablas podía editar y borrar el histórico.
2. **Una corrección es una fila nueva**, nunca una edición.
3. **Retención de 7 años = no borrar nada durante 7 años en la base viva.** La sostiene la inmutabilidad de arriba, **no los respaldos** (D97). No hay purga salvo la de una empresa dada de baja (D97); cualquier otra eliminación sería un procedimiento aparte, aprobado por el comité y con su propia migración.
4. **Qué se registra** (acciones del onboarding, campos, secretos prohibidos): `contracts/conventions.md` → *Auditoría*.

**Lo que garantiza y lo que no:** un rol con permisos puede desactivar un trigger (`ALTER TABLE … DISABLE TRIGGER`) o
ser superusuario. El control que lo cubre es **organizativo**: solo el dueño de la base tiene esa capacidad, sus
credenciales no están en el runtime de la app y un cambio de este tipo deja rastro en las migraciones. No se
agrega un event trigger: sería complejidad sin un riesgo que lo justifique en el MVP.

**Respaldos (solo para recuperar tras un desastre, D97):** copia de toda la base con todas las empresas juntas, que **rota a 35 días**. No sostienen los 7 años: no se puede quitar de una copia los datos de una sola empresa, y una empresa borrada debe desaparecer también de ahí.
- **Staging:** volcado nocturno (`pg_dump`) a MinIO, con rotación de 35 días. Se construye con MD-91.
- **Producción:** servicio con recuperación a un punto en el tiempo y esa misma rotación (D72).

**Por qué ahora y no después:** si el audit trail arranca sin ser inmutable, el histórico de los primeros clientes no
sirve como evidencia y no se puede reconstruir. **Alcance:** `tenant.evaluations` también es inmutable y solo está
protegida por `REVOKE`; queda como siguiente candidato a la misma garantía.

**Fuente:** `modelo-datos.md` §5.3 y §7.4 (SOC 2 Type II). Decisión de Héctor, 2026-10-01. Implementación:
`Backend/prisma/migrations/20261001190000_audit_append_only_triggers` y `npm run audit:verify`.

---

---

## D52 · La auditoría se escribe en la misma transacción que la acción (cierra DT-28, SEG-36)

**Decisión** (desarrollo, 2026-10-07; **pendiente de ratificar con el comité**; no cambia el modelo de datos). D41 y
`contracts/conventions.md` ya exigían que el rastro se escribiera en la misma transacción que la acción. No se cumplía: los
casos de uso llamaban al repositorio y **después** al escritor de auditoría, en otra transacción y con el error tragado. Si
fallaba entre las dos, la acción quedaba sin rastro.

**Cómo quedó:**

1. **`AuditIntent<T>`** (`common/audit/audit-log.writer.ts`): una función `(resultado) => AuditEntry | AuditEntry[]` que el caso de
   uso construye con lo que ya sabe (usuario, IP, estado anterior) y **entrega al repositorio**. El repositorio, dentro de la
   transacción que ya abre con `withScope`, escribe el efecto, arma el resultado y llama a `insertAuditLog(tx, audit(resultado))`.
2. **El parámetro es obligatorio** en todo método que cambia datos: servicios (crear, modificar, descripción, eliminar),
   contexto organizacional, empresa, escenario y alcance, activos (registrar, validar, activar, programar), sesión (login y
   logout) y canje de la clave. Un método nuevo sin él no compila.
3. **Falla cerrado:** si el insert del rastro falla, **toda la acción se revierte** y la respuesta es un `500`. Es la lectura
   correcta de SOC 2 (CC7.2, CC9.2): una acción sin rastro es peor que una acción rechazada.
4. **Dónde NO aplica**, a propósito: (a) los **intentos fallidos** (`auth.login_failed`, canje fallido): no hay efecto con el que ser
   atómico y no deben romper la respuesta, así que siguen con `AuditLogWriter.write`, de mejor esfuerzo; (b) los **cierres
   automáticos de sesión** (inactividad, expiración, usuario inactivo): se pasa `null` explícito y hoy no se registran (**DT-47**).
5. **Una validación fallida de un activo sí es un cambio** (pasa la conexión a `failed`): su rastro `result = error` se escribe en
   la misma transacción.

**Alternativas descartadas:**

- **Transacción ambiental** (`AsyncLocalStorage` + `withScope` que se une a la abierta): menos cambios en los casos de uso, pero
  oculta cuándo hay transacción, y el repositorio del canje atrapa un error de la base (`P2002`) para devolver `email_taken`; unido
  a una transacción externa, el error la dejaría abortada. Se prefirió el parámetro explícito.
- **Dejar el escritor aparte con reintento:** no da atomicidad, solo disminuye la ventana.

**Qué cuesta:** una caída de `audit_logs` ahora **detiene** las acciones que cambian datos (disponibilidad a cambio de
integridad del rastro). `audit_logs` es la misma base que los datos, así que no hay un punto de fallo nuevo en la práctica.

**Cómo se comprueba:** `Backend/test/auditoria/audit-atomica.e2e-spec.ts` (19 pruebas). Fuerza que el rastro se inserte y luego
falle, y comprueba que no queda ni el efecto ni la fila. Una mutación que escribe el rastro después de confirmar el cambio hace
fallar la prueba correspondiente.

**Fuente:** D41, `contracts/conventions.md` («Se escribe en la misma transacción que la acción»), DT-28 y MD-113.

---

---

## D91 · Todo cambio de estado de un control deja un evento inmutable (2026-10-23; cumple REQ-043 y REQ-044)

**Decisión.**
1. **Cada vez que algo que se escribe mueve el estado o el semáforo de un control, queda un evento** en `audit.compliance_events` con el estado anterior y el nuevo (`changed_field = 'control.state'`), escrito **en la misma transacción** que la escritura que lo movió: si el evento falla, la escritura se revierte (SEG-36). Un cambio solo del porcentaje que no mueve el estado ni el semáforo no es un cambio de estado.
2. **El estado sigue derivándose.** No se guarda como columna del control ni del marco (§9, D68). El evento no es el estado: es el rastro de cuándo y por qué cambió. Lo escribe quien hace la escritura: toma una foto de los controles del servicio antes, escribe y compara con la de después.
3. **Qué escrituras lo disparan:** el veredicto de un test manual (D85), la entrega de una evidencia (devuelve la prueba a revisión), la revisión del consultor (la del auditor no mueve el estado, D84), aprobar una exclusión y lo que mide la sonda al guardar sus resultados. Cada evento trae su causa (`test_verdict`, `evidence_submission`, `evidence_review`, `exclusion_approved`, `probe_result`).
4. **El actor puede ser el sistema.** Lo que mide la sonda no tiene una persona detrás: `user_id`, `ip_address` y `user_agent` de `compliance_events` pasan a ser nulos en ese caso (nulo = lo cambió el sistema). La FK a `users` sigue siendo `RESTRICT`.
5. **Evaluación emitida del consultor y del auditor** (`framework_assessments`, D77): al emitirla se **congela la fecha de corte** del marco si no lo estaba, y desde entonces el período no se puede cambiar (`409 EVALUATION_ALREADY_ISSUED`); repetir exactamente lo mismo se acepta.

**Por qué.** SOC 2 Tipo II exige demostrar cómo estaba cada control durante un período: las evaluaciones inmutables dicen qué se midió, pero no dicen cuándo un control pasó de un estado a otro ni qué lo provocó. Lo pidió el responsable del ticket al cerrar MD-145: «todo cambio de estado de un control debe generar un evento».

**Lo que no cambia.** El cumplimiento se deriva y no se almacena (§9); el porcentaje informa y no decide (D68); la evaluación del auditor va aparte y no cambia el estado calculado (D77).

**Qué cambia.** `modelo/07-cumplimiento.md` (§7.4, `compliance_events`) y `modelo/09-calculo-cumplimiento.md` («Cómo se guarda»), `contracts/cumplimiento/veredictos.md`, `contracts/cumplimiento/resumen.md`, `schema-implementacion.md`, `SEG-56`, `SEG-63`, `DT-79` y `DT-80`. Migraciones: `framework_assessments` (con su RLS, el `CHECK` rol-veredicto y los triggers de inmutabilidad) y el actor opcional de `compliance_events`.

**Fuente:** Héctor Rodríguez, 2026-10-23 (desarrollo, al cerrar MD-145); D63, D68, D77, D84.

---
