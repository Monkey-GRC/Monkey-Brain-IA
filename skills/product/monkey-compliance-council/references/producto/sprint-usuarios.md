---
id: sprint-usuarios
name: Sprint 3 — Gestión de usuarios (alcance y plan)
description: Alcance, tickets, orden de trabajo y criterios de aceptación del sprint 3 (2026-11-03 a 2026-11-16): la cadena admin_empresa → responsable → delegado, grupos, dueño y ejecutor por control, cupo de usuarios e invitación por correo.
type: reference
---

# Sprint 3 — Gestión de usuarios

**Tercer entregable del MVP.** Jira, proyecto `MD`, sprint **«MD Sprint 3»** (id 274, creado sin iniciar), épico **MD-184**. **Del 3 al 16 de noviembre de 2026 (10 días hábiles).** Héctor lleva Backend y API; Carlos, toda la interfaz
(Frontend-Platform y la parte de Monkey Admin). Las decisiones que construye: **D102** (la cadena de asignación) y **D103** (el cupo de usuarios); cierran `P38`, `P40` y `P3`.

**Reglas que el sprint construye:** `modelo-datos.md` §5.1, §5.2 y §5.5; §7.3 (revisión de la evidencia en dos niveles); §4.1 (`companies.max_users`). El contrato
está escrito: [`contracts/gestion-usuarios.md`](../../../../../contracts/gestion-usuarios.md), `contracts/empresas.md`, `contracts/cumplimiento/evidencia.md` y los enums.
**Cada ticket parte del contrato** (regla 6 de `CLAUDE.md`): si algo no está ahí, se acuerda primero.

## Qué cambia

| Antes (D96 y D98) | Ahora (D102 y D103) |
|---|---|
| Rol `funcional` con especialidades por dimensión | Roles `responsable` (dueño) y `delegado` (ejecutor); la especialidad desaparece |
| Responsable por servicio y dimensión, excepción por control | Un dueño y a lo sumo un ejecutor por control del cliente (`client_control_assignments`) |
| El `funcional` ve todo lo de su especialidad | Cada persona ve **solo sus controles** y el avance de lo suyo |
| Una sola revisión de la evidencia (`admin_empresa`) | Dos niveles: el `responsable` dueño y el `admin_empresa`; un rechazo gana |
| El código de activación se entrega a mano | Llega por correo; no viaja en la respuesta |
| Sin cupo de usuarios | `companies.max_users`, fijado por `admin_monkey` |

## Qué entra

### Backend y API (Héctor)

| # | Ticket nuevo | Pts | Contrato / requisito |
|---|---|--:|---|
| B0 · MD-185 | Ratificar el modelo y los contratos de D102 con Carlos (y Nelson si lo pide) | 1 | `contracts/gestion-usuarios.md` |
| B1 · MD-186 | **Migración:** eliminar `user_dimensions` y `service_dimension_owners`; `client_control_assignments` y `user_groups`; `users.group_id` e `is_internal`; enum `user_role` (`responsable`, `delegado`, sin `funcional`); `companies.max_users`; `evidence_reviews` con `reviewer_role` y clave única por rol; RLS | 8 | `modelo/05-usuarios.md` §5.2 |
| B2 · MD-187 | **Cupo de usuarios:** `max_users` en alta, listado y detalle de empresa, `PATCH …/max-users`, y `USER_LIMIT_REACHED` al crear o reactivar, con la empresa bloqueada | 5 | `contracts/empresas.md` · SEG-72 |
| B3 · MD-188 | **Equipo:** `POST`/`GET`/`PATCH /v1/users` con los roles nuevos, grupo, `is_internal`; el `responsable` crea delegados de su equipo; un responsable nuevo queda en «Responsables» y su equipo **no** se crea con él (D104) | 8 | `contracts/gestion-usuarios.md` |
| B4 · MD-189 | **Grupos:** `GET`/`POST`/`PATCH /v1/groups`; el responsable crea su equipo de delegados y el administrador el de un responsable (D104); mover un delegado | 5 | idem |
| B5 · MD-190 | **Invitación por correo:** plantilla en el `Mailer`, reenvío del código, la respuesta sin el código | 5 | SEG-75 · D99 |
| B6 · MD-191 | **Baja con aviso:** `confirm_unassign`, `USER_HAS_ASSIGNMENTS`, `RESPONSIBLE_HAS_DELEGATES`, sesiones cerradas y cupo liberado | 5 | SEG-74 · SEG-23 |
| B7 · MD-192 | **Asignación:** `GET /v1/assignments` con filtros, `PUT …/owner` y `PUT …/executor` masivos, auditoría por control | 8 | SEG-73 |
| B8 · MD-193 | **Visibilidad en Cumplimiento:** reemplazar `control-responsibles.ts` por el alcance dueño/ejecutor en controles, evidencia, riesgos, observaciones, hallazgos y resumen propio; `403` en la vista técnica para responsable y delegado | 8 | SEG-66 · SEG-76 |
| B9 · MD-194 | **Revisión en dos niveles:** `PUT …/review` por rol, estado combinado de la evidencia, veredicto manual no documental con el mismo flujo | 8 | `contracts/cumplimiento/evidencia.md` · SEG-67 |
| B10 · MD-195 | **`GET /v1/team/workload` y `GET /v1/me/work`** | 5 | `contracts/gestion-usuarios.md` |
| | **Total** | **64** | |

### Interfaz (Carlos)

| # | Ticket nuevo | Pts | Nota |
|---|---|--:|---|
| F1 · MD-196 | Roles nuevos en i18n, `roleGuard` y menú por rol; quitar `funcional` | 3 | Frontend-Platform |
| F2 · MD-197 | **Pantalla Equipo** rehecha: crear responsable, delegado (interno/externo), auditor y administrador; lista con filtros; desactivar con advertencia; reenviar invitación | 8 | reutiliza MD-134 |
| F3 · MD-198 | **Grupos:** crear y renombrar, ver cada equipo, mover un delegado | 3 | |
| F4 · MD-199 | **Asignación de controles (administrador):** lista con filtros (servicio, categoría como `CC`, requisito, estado, «Sin asignar»), selección masiva y asignar dueño | 8 | los filtros importan: 130 controles |
| F5 · MD-200 | **Asignar ejecutor (responsable):** el mismo componente, limitado a sus controles y a su equipo | 3 | |
| F6 · MD-201 | **«Mi trabajo»** (versión mínima) para responsable y delegado | 8 | `GET /v1/me/work` |
| F7 · MD-202 | **Visibilidad:** sin vista técnica ni avance de la empresa para responsable y delegado; la cadena (dueño y ejecutor) visible para el auditor y el administrador en el detalle del control | 5 | |
| F8 · MD-203 | **Revisión en dos niveles** en el panel de evidencia: quién revisó, estado combinado, aprobar o rechazar con motivo | 8 | |
| F9 · MD-204 | **Carga de trabajo** del administrador: controles y avance por persona | 3 | |
| F10 · MD-205 | **Monkey Admin:** cupo de usuarios al registrar una empresa, en su detalle y para cambiarlo | 3 | Frontend |
| F11 · MD-206 | Retirar el reparto por servicio y dimensión y el «responsable por control» del panel de detalle | 2 | |
| MD-143 | Retirar la gestión de usuarios heredada de Monkey Admin (ticket viejo) | 2 | D103 |
| | **Total** | **56** | |

**Los tickets viejos** (comentados en Jira el 2026-11-03):

| Ticket | Qué pasó |
|---|---|
| MD-131 · MD-132 · MD-134 | **Reemplazados** por MD-188 (+ MD-190), MD-191 y MD-197 (+ MD-198, MD-206). Etiquetas `sprint-3` y `reemplazado-d102`; **no están en el sprint** para no contar el trabajo dos veces; siguen «Por hacer» como histórico hasta que Rod decida cerrarlos |
| MD-143 | **Entra al sprint** con alcance decidido: retirar la gestión de usuarios heredada de Monkey Admin (D103). 2 pts. Cuelga del épico MD-184 |
| MD-158 | **Sin objeto por D102** (etiqueta `sin-objeto-d102`); se elimina en B1 y lo reemplaza B7 |
| MD-94 · MD-175 | Siguen en curso; alcance «todos los roles» (D102, punto 13) |
| MD-69 | Aclarado: la clave de acceso ya sale por correo (D99); la invitación de usuarios es MD-190. Revisar si se cierra |
| MD-146 | Se queda en el backlog (la vista de solo lectura de `admin_monkey` no está en D103) |
| MD-157, MD-159 a MD-161, MD-172 a MD-174 | Ya están en «Listo» y `sin-objeto-d96`; no se tocan |

## Cronograma

Diez días hábiles. Carlos arranca contra el contrato con datos simulados mientras Héctor construye.

| Días | Héctor (Backend) | Carlos (Interfaz) |
|---|---|---|
| 1 (3 nov) | B0 ratificar contratos; arranca B1 | Lee el contrato; F1 |
| 2–3 | **B1 migración** (bloquea a todo lo demás) | F1, F10, F11 |
| 4–5 | B2 cupo · B3 equipo | F2 contra el contrato |
| 6–7 (9–10 nov) | B4 grupos · B6 baja con aviso · B5 correo | F2 · F3 |
| 8–9 | B7 asignación | F4 · F5 |
| 9–10 | B8 visibilidad · B9 revisión | F6 · F7 · F8 |
| 10 (16 nov) | Cierre, pruebas, `monkey-closeout` | F9 si cabe; cierre |

**Si no alcanza, lo primero que se cae** (en este orden): B10 y F9 (la carga de trabajo del administrador), B5 y la parte de correo de F2 (el código se puede entregar a mano como hoy), el veredicto manual no documental de B9. **Lo que no se cae:**
B1 a B4, B6 a B8 y la revisión de evidencia; sin ellos no hay cadena.

La suma es 64 puntos de Backend y 56 de interfaz para dos personas en diez días: **está al límite**. No hay velocidad medida de los sprints anteriores en este documento; si la hay en Jira, se compara antes de empezar y se recorta por el orden de arriba.

## Convenciones

- **Épico nuevo «Sprint 3 · Gestión de usuarios (D102)»**; `MD-153` queda como histórico. Etiquetas: `sprint-3`, `usuarios`, y `backend` o `frontend`.
- **La clave del ticket (`MD-n`) va en la rama, en cada commit y en el título del PR.** Una historia por repo (Backend o Frontend), con el contrato primero.
- Rama: `feat/MD-n-descripcion`. Una regla de automatización mueve el ticket a «En revisión» al abrir el PR y a «Listo» al hacer merge.
- Estimación en puntos de historia (Fibonacci). **Claude no hace commits ni PRs.**

## Criterios de aceptación del sprint

1. Un `admin_empresa` crea un `responsable` y un `delegado` (interno y externo); ambos se activan con un código que llega por correo y entran con TOTP.
2. Con `max_users = N`, el usuario N+1 no se crea (`USER_LIMIT_REACHED`), aunque dos altas lleguen a la vez; desactivar a alguien libera el cupo.
3. El administrador asigna 130 controles con filtros y selección masiva; los que no tienen dueño muestran «Sin asignar».
4. El responsable asigna ejecutor solo entre sus delegados; un delegado de otro equipo responde `409`.
5. Un responsable y un delegado ven **solo** sus controles y el avance de lo suyo; la vista técnica responde `403`.
6. Una evidencia subida por un delegado la revisa su responsable; si el administrador también revisa, aprueban los dos y cualquier rechazo gana.
7. Desactivar a un responsable con delegados falla; desactivar a quien tiene controles pide confirmación y los deja «Sin asignar» (o sin ejecutor).
8. No queda ninguna referencia a `funcional`, `user_dimensions` ni `service_dimension_owners` en el código; las pruebas del módulo (`equipo.e2e-spec.ts` y las de Cumplimiento) están reescritas.
9. `monkey-closeout` limpio: contrato, enums, `D/P/DT/SEG` y documentos al día.

## Supuestos que el equipo debe confirmar

El comité no los dijo; salen de mi lectura y están escritos así en D102 y en los contratos:

- Un grupo de responsables sin nombre se crea solo («Responsables»); el administrador puede crear más.
- El `admin_empresa` sin delegados propios: él es dueño y ejecutor de lo que se asigna a sí mismo.
- El `admin_empresa` dueño que sube su propia evidencia se la revisa él mismo (`P34`, sigue abierto).
- No se puede fijar `max_users` por debajo de las cuentas que ya cuentan.
- La respuesta de crear un usuario ya no trae el código (como la clave de una empresa, D99).
