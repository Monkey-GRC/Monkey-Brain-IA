# Requisitos de seguridad — el registro

Aquí vive **una sola lista** de lo que Monkey debe cumplir en seguridad, con **de dónde sale** cada requisito,
**cómo se hace cumplir** y **cómo se comprueba**. Existe porque estos requisitos estaban repartidos (`modelo-datos.md`
§4.3 y §5.3, D41, `schema-implementacion.md` §5 y §9, `deuda-tecnica/README.md`) y nadie podía responder, de un vistazo,
*«¿esto está protegido y cómo lo sabemos?»*.

**Cómo se distingue de los otros documentos**

| Documento | Qué guarda |
|---|---|
| **este archivo** | El **requisito** (qué debe ser verdad), su fuente, su estado real y su verificación |
| `modelo-datos.md` §5.3 | La política de seguridad **del comité** (valores: 30 min, 12 caracteres…). Aquí se enlaza, no se copia |
| `deuda-tecnica/README.md` | **Parches** de desarrollo (DT-n). Un requisito incumplido apunta a su DT; no al revés |
| `modelo-datos-decisiones.md` | Por qué se decidió algo (D-n) |
| `modelo-datos-pendientes.md` | Preguntas que solo el comité puede responder |

**Reglas de uso**

1. **ID estable (`SEG-n`).** No se reutilizan ni se renumeran: Jira, un PR o un comentario pueden citarlos.
2. **Todo endpoint, tabla o flujo nuevo se revisa contra esta lista** antes de darse por terminado. Si introduce un
   requisito nuevo, se añade una fila en el mismo PR.
3. **El estado no se declara, se demuestra.** ✅ solo se escribe si hay una **prueba automática** que corre en CI y la
   columna *Verificación* dice cuál. Implementado pero sin prueba es 🟡, aunque «funcione».
4. **Un requisito incumplido no se borra:** se marca 🔴 y apunta a la deuda (`DT-n`) o a la pregunta (`P-n`) que lo cierra.
5. **Fecha de la última revisión de cada estado: 2026-10-07.** Lo marcado 🟡 *no lo comprobé al escribir esto*: lo vi en el
   código o en un documento, pero ninguna prueba lo ejecuta.

**Estados:** ✅ cumplido y verificado por prueba automática · 🟡 implementado, sin prueba automática ·
🟠 parcial · 🔴 no implementado · ⚪ no verificable desde el repo / decisión pendiente

Pruebas citadas: `Backend/test/aislamiento/` (RLS en base de datos: `rls-cobertura`, `rls-comportamiento`; API real:
`http`), `npm run audit:verify`, `catalog:verify`, `clone:verify`. El flujo de CI es `Backend/.github/workflows/ci.yml`.
Las de HTTP de aislamiento ya están en `develop` (PR #18 y #19). **Las de `test/auditoria/` y `test/autenticacion/` están en la rama `feat/audit-in-same-transaction` del Backend: su ✅ es provisional hasta que se mergee.**

---

## A. Aislamiento entre empresas (el riesgo #1 del producto)

| ID | Requisito | Fuente | Cómo se hace cumplir | Verificación | Estado |
|---|---|---|---|---|---|
| **SEG-01** | Una empresa nunca lee, modifica ni borra datos de otra | `modelo-datos.md` §4.3, D25; `architecture.md` («aislamiento fuerte») | RLS de Postgres sobre `tenant_id`/`company_id` en todas las tablas de cliente. **Nunca** un `WHERE` que dependa de que cada consulta lo incluya | `rls-comportamiento` (BD) y `http` (API: leer, modificar, borrar, validar, enlazar entre empresas) | ✅ |
| **SEG-02** | Sin tenant fijado no se ve ninguna fila («falla cerrado»), y un tenant mal formado falla en vez de abrir el acceso | `schema-implementacion.md` §5 | Política `NULLIF(current_setting('app.tenant_id', true), '')::uuid` | `rls-comportamiento` | ✅ |
| **SEG-03** | Las variables de sesión (`app.tenant_id`, `app.user_id`, `app.user_role`) viven por transacción, nunca por conexión | `modelo-datos.md` §4.4 | `set_config(..., true)` | `rls-comportamiento` (no se filtra a la transacción siguiente del pool) | ✅ |
| **SEG-04** | La app nunca se conecta como superusuario ni con `BYPASSRLS` | `schema-implementacion.md` §4 | Rol `monkey_app` `NOSUPERUSER NOBYPASSRLS`; el dueño solo migra | `rls-cobertura` | ✅ |
| **SEG-05** | Toda tabla nueva de datos de cliente nace con RLS activa y forzada, política de aislamiento y discriminante (`tenant_id` o `company_id`) | `schema-implementacion.md` §5 | Convención de migración | `rls-cobertura` falla si una tabla queda sin RLS, sin `FORCE`, sin política, con política incondicional o sin discriminante. **El índice sobre `tenant_id` no se verifica** | ✅ (índice 🟡) |
| **SEG-06** | El catálogo maestro se lee libre pero solo `admin_monkey` lo escribe | `modelo-datos.md` §4.3, D31 | 4 políticas por tabla de `catalog` | `rls-cobertura`, `rls-comportamiento`, `catalog:verify` | ✅ |
| **SEG-07** | Una FK no valida que el padre sea del mismo tenant: antes de escribir con FK a otra tabla de tenant se lee el padre **bajo RLS** | `modelo-datos.md` §4.4 | Regla de aplicación | `http`: no se puede enlazar un activo al servicio de otra empresa. **Solo ese caso**; las demás FK no tienen prueba | 🟠 |
| **SEG-08** | Las búsquedas previas al tenant (login, canje, refresh, API key) usan funciones `SECURITY DEFINER` angostas, con `search_path` fijo | `modelo-datos.md` §4.4, D29 | 4 funciones SQL | Ninguna prueba dedicada (se ejercitan indirectamente en el login de `http`) | 🟡 |
| **SEG-09** | Un cliente que exige separación total tiene base dedicada | `modelo-datos.md` §4.3, D24 | Réplica física en otra base | No existe: el aprovisionamiento no se reconstruyó | 🔴 `DT-22`, `P2` |
| **SEG-45** | Un agente de la sonda no puede reportar datos a una empresa que no es la suya | `wazuh.md`, D48, D54 | Diseño decidido (D54): Monkey pre-registra el agente en el grupo del cliente y solo acepta resultados cuyo grupo corresponde al `tenant_id`. **Aún no se construye**: hoy nada lo impone | — | 🔴 `DT-33` |

> **Hallazgo (2026-10-07):** en los endpoints de servicios y activos **RLS es la única barrera**. Al romper a propósito la
> política de `services` y `assets`, la API devolvió datos de otra empresa: no hay un filtro por empresa en la aplicación.
> Es seguro mientras SEG-05 se cumpla, y por eso esa prueba es crítica. Los *listados* sí filtran en la aplicación.

## B. Autenticación y sesión

| ID | Requisito | Fuente | Cómo se hace cumplir | Verificación | Estado |
|---|---|---|---|---|---|
| **SEG-10** | Sin sesión válida no hay datos: sin cookie o con una cookie manipulada → 401 | `contracts/modules/auth.md` | Guard de sesión global | `http` | ✅ |
| **SEG-11** | Cerrar sesión invalida el refresh | `auth.md` | Revocación de la sesión | `http` | ✅ |
| **SEG-12** | Sesión: 30 min de inactividad, 8 h máximo | `modelo-datos.md` §5.3 | `SESSION_IDLE_TIMEOUT`, `SESSION_MAX_DURATION` | `test/autenticacion/autenticacion.e2e-spec.ts`: 29 min sigue viva; 31 min se cierra y el refresh tampoco sirve; pasadas las 8 h se cierra; el token de una sesión cerrada no sirve | ✅ |
| **SEG-13** | Contraseña de 12+ caracteres con mayúscula, minúscula, número y símbolo | §5.3 (NIST SP 800-63) | `PASSWORD_POLICY` en `common/security/password-policy.ts`, **única definición**, aplicada con `IsStrongPassword` al canjear la clave (antes había una segunda función sin uso que podía divergir; se eliminó) | `test/autenticacion/autenticacion.e2e-spec.ts`: 5 contraseñas débiles dan 422 por campo sin gastar la clave; la guardada es bcrypt. Una mutación de la regla hace fallar la prueba | ✅ |
| **SEG-14** | La contraseña expira a los 90 días | §5.3 (SOC 2) | — | No hay nada en el código | 🔴 |
| **SEG-15** | Bloqueo a los 5 intentos fallidos, por 15 min | §5.3, `auth.md` (`ACCOUNT_LOCKED`) | Lógica en el login | `test/autenticacion/autenticacion.e2e-spec.ts`: al 5.º fallo `403 ACCOUNT_LOCKED`; bloqueada, ni la contraseña correcta entra; el bloqueo dura ≤ 15 min; al vencer entra y el contador vuelve a 0; el error no distingue usuario inexistente de contraseña mala | ✅ |
| **SEG-16** | MFA TOTP obligatoria para `admin_monkey`, `admin_empresa` y `auditor` | §5.3 | — (el campo `is_mfa_enabled` existe, el flujo no) | — | 🔴 `DT-23`, MD-94 |
| **SEG-17** | Refresh tokens, claves de acceso y API keys se guardan como HMAC con *pepper*, nunca en claro | `schema-implementacion.md` §4 | `TOKEN_HASH_PEPPER` | `test/autenticacion/autenticacion.e2e-spec.ts`: el hash guardado ≠ el token; la clave de acceso no aparece ni en claro ni en el rastro de auditoría. **Las API keys no tienen endpoint todavía** | ✅ (API keys ⚪) |
| **SEG-18** | Los tokens viajan en cookie `httpOnly`; el frontend nunca los toca | `contracts/conventions.md` | `auth-cookies.ts` (`secure` solo en producción) | `test/autenticacion/autenticacion.e2e-spec.ts`: `HttpOnly` y `SameSite=Lax` en las dos cookies, el refresh solo en `/v1/auth`, y ningún token en el cuerpo. **La bandera `Secure` (solo en producción) no se prueba** | 🟠 |
| **SEG-19** | Límite de peticiones: 100/min por usuario, 1000/min por empresa | §5.3 | Solo existe el freno de intentos de la **clave de acceso** (10 fallos cada 15 min por dirección, en memoria de la instancia: DT-37). El general no existe | Ninguna | 🟠 |

## C. Autorización

| ID | Requisito | Fuente | Cómo se hace cumplir | Verificación | Estado |
|---|---|---|---|---|---|
| **SEG-20** | La autorización se verifica en cada petición; no se confía en el frontend | §5.3 | `@Roles()` + guard | `http`: una empresa no accede a rutas de `admin_monkey` y `admin_monkey` no actúa como `admin_empresa` | ✅ (2 de 4 roles) |
| **SEG-21** | Matriz de permisos por rol (13 acciones) | §5.5 | Por módulo | Solo `admin_monkey` y `admin_empresa`. `funcional` y `auditor` no tienen endpoints todavía | 🟠 `P3` |
| **SEG-22** | `funcional` siempre acotado a lo que tiene asignado | §5.5 | `user_control_assignments` | No existe aún el módulo | 🔴 |
| **SEG-23** | Un usuario desactivado pierde el acceso y se cierran sus sesiones (CC6.3) | §5.6 | El guard comprueba el estado del usuario en cada petición | `test/autenticacion/autenticacion.e2e-spec.ts`: con el usuario `inactive` su sesión abierta deja de servir y no puede volver a entrar. **Falta el endpoint para desactivarlo (MD-132)** | 🟠 |

## D. Datos y secretos

| ID | Requisito | Fuente | Cómo se hace cumplir | Verificación | Estado |
|---|---|---|---|---|---|
| **SEG-24** | Las credenciales de los sistemas del cliente se guardan cifradas (AES-256-GCM) y nunca se devuelven | D46, `modelo-datos.md` §6.3 | `aes-credential.cipher.ts` | `test/autenticacion/autenticacion.e2e-spec.ts`: ni la respuesta del alta, ni el detalle, ni el listado las devuelven; en la base están cifradas (`v1.…`) y no contienen el secreto. La gestión de la llave es **SEG-25** | ✅ |
| **SEG-25** | La llave de cifrado se gestiona y se rota con un procedimiento | DT-5 | Hoy: variable de entorno, sin rotación | — | 🔴 `DT-5` |
| **SEG-26** | Las credenciales de la nube del cliente no se guardan como llaves estáticas en un servidor compartido: rol entre cuentas, sin secretos, ejecución aislada por cliente | `P14` C1/C3, DT-35, DT-43 | — (la prueba de viabilidad usó llaves estáticas) | — | 🔴 `DT-43`, `P14` |
| **SEG-27** | Cifrado en tránsito: TLS 1.3 y HSTS | §5.3 (PCI DSS) | Lo da el proxy, no la app (la app no fija HSTS) | No verificable desde el repo | ⚪ |
| **SEG-28** | Conexión a la base con `sslmode=require` y firewall del 5432 restringido | `schema-implementacion.md` §9 | — | — | 🔴 |
| **SEG-29** | Los datos crudos de escaneos de clientes (cuentas, recursos, fallos) no se versionan | 2026-10-07 | `.gitignore` (`assets/soc2/`, `assets/*.html`) | Revisión manual | 🟡 |
| **SEG-30** | Ninguna credencial en texto plano en ningún repo (`conexion_api_wazuh_monkey.txt` incluida) | `CLAUDE.md` | Regla del equipo | Sin escáner de secretos. Una búsqueda puntual no encontró las cadenas conocidas | 🟡 |
| **SEG-31** | Rotar antes de producción: contraseña de `postgres`, `JWT_SECRET`, la de la API de la sonda y la contraseña del usuario de API de la sonda usado en las pruebas (se pegó en un chat el 2026-10-07), **las llaves del usuario IAM `monkey-audit` de la cuenta de AWS de pruebas y la contraseña SSH de la VPS de desarrollo (se pegaron en el chat el 2026-10-08)** | `schema-implementacion.md` §9 | — | — | 🔴 |
| **SEG-32** | Los prompts a la IA nunca llevan credenciales ni secretos; el plano de datos del cliente está separado del de inferencia | `architecture.md` | — | Aún no hay IA | ⚪ |
| **SEG-43** | Un archivo subido por el cliente solo se acepta si es PDF o `.docx`, pesa ≤ 25 MB y su **contenido** coincide con lo que declara (firma, no solo extensión); el nombre no puede salirse de la ruta | D51, `contracts/modules/onboarding-service-context.md` | `system-description-file.ts` | `system-description-file.spec.ts` (unitaria, corre en el CI) | ✅ |
| **SEG-44** | Los archivos del cliente viven en un bucket **no público**, con la llave prefijada por empresa y descarga por URL temporal (5 min) | D51 | `FileStorage` (S3/minio), `<empresa>/services/<servicio>/…` | La llave y la unicidad, sí (`system-description-file.spec.ts`). **Que el bucket sea privado y la política por tenant no se verifican desde el repo** | ⚪ |

## E. Auditoría y trazabilidad

| ID | Requisito | Fuente | Cómo se hace cumplir | Verificación | Estado |
|---|---|---|---|---|---|
| **SEG-33** | `audit_logs` y `compliance_events` son append-only para **todos** los roles | D41, §4.3 | `REVOKE` + triggers `audit.reject_mutation()` | `audit:verify` (en CI) | ✅ |
| **SEG-34** | El audit trail de una empresa no se lee ni se escribe desde otra | §4.3 | RLS en `audit` | `rls-comportamiento` | ✅ |
| **SEG-35** | Retención de 7 años | D41, §5.3 (SOC 2 Tipo II) | Depende de los respaldos | Inmutabilidad ✅; la retención depende de dónde viva el Postgres | 🟠 `P7` |
| **SEG-36** | La auditoría se escribe **en la misma transacción** que la acción | D41, D52 | Cada método del repositorio que cambia datos **exige** un `AuditIntent` (el compilador lo impone) y lo escribe con `insertAuditLog(tx, …)` dentro de su transacción. Excepción documentada: los intentos fallidos y los cierres automáticos de sesión (DT-47) | `test/auditoria/audit-atomica.e2e-spec.ts`: cada acción deja exactamente 1 rastro con su empresa; forzando que el rastro falle **después** de insertarse, la acción se revierte (servicio, escenario, alcance, activo, descripción, contexto, login, logout, empresa, canje) y la fila de auditoría también. Una mutación (rastro tras el commit) hace fallar la prueba | ✅ |
| **SEG-37** | Los intentos de acceso denegados se registran (CC7.2/CC7.3) | §5.6 | `auth.login_failed` y el canje fallido (`access_key.redeem` con `result = error`), de mejor esfuerzo y sin tenant | `test/autenticacion/autenticacion.e2e-spec.ts`: cada fallo de login deja su rastro (con `user_id`, o con el correo tecleado si no existe). **Un 403 por rol no se registra** | 🟠 |
| **SEG-38** | `evaluations` es inmutable salvo el cierre humano | §7.4 | `REVOKE` + `GRANT UPDATE` por columna | Ninguna prueba | 🟡 MD-145 |

## F. Confidencialidad del proveedor del motor

| ID | Requisito | Fuente | Cómo se hace cumplir | Verificación | Estado |
|---|---|---|---|---|---|
| **SEG-39** | Ninguna pantalla, notificación, reporte ni texto de IA nombra al proveedor del motor (ni la sonda ni el motor de nube) | `CLAUDE.md`, `philosophy.md`, `wazuh.md` | Revisión | Ninguna prueba automática | 🟠 MD-87, `P11` |

> El prototipo de postura de AWS (`assets/monkey-postura-aws.html`) **lo violaba** (nombraba el motor y la versión al pie).
> No es un caso aislado: sin una prueba que busque esos nombres en lo que sale al cliente, depende de la atención de quien revisa.

## G. Desarrollo y entrega

| ID | Requisito | Fuente | Cómo se hace cumplir | Verificación | Estado |
|---|---|---|---|---|---|
| **SEG-40** | Lint, build, pruebas unitarias, migraciones desde cero, verificadores y pruebas de aislamiento corren en cada PR | DT-20 | `.github/workflows/ci.yml` | El propio CI | ✅ |
| **SEG-41** | Un PR en rojo no se puede mergear, y un despliegue no sale si el CI falla | DT-46 | Exige el plan GitHub Team (protección de rama) o que el deploy dependa del CI | — | 🔴 `DT-46` |
| **SEG-42** | Las migraciones desplegadas se respaldan antes y no se editan una vez aplicadas | `schema-implementacion.md` §7 y §13 | `scripts/deploy/migrate.sh` | Probado a mano, no en GitHub Actions | 🟡 |

---

## Cómo añadir o cambiar un requisito

1. Fila nueva al final de su sección, con el siguiente `SEG-n` libre.
2. Fuente obligatoria: un documento del comité, una decisión (D-n) o una deuda. Sin fuente es una opinión, y se marca como tal.
3. Estado según la regla 3. Si se cierra un requisito, se actualiza la fila y se cita la prueba o el PR.
4. Si el requisito es incumplido y no tiene `DT-n`, se crea la deuda.

## Lo que este registro **no** es

No es una auditoría de seguridad ni un pentest: dice qué está comprobado y qué no, no que lo comprobado sea suficiente.
Tampoco certifica nada ante un auditor externo.
