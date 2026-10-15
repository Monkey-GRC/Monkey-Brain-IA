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

## Resumen

Estado de un vistazo (contado el 2026-10-10 a partir de la columna Estado; los estados se revisaron por última vez el 2026-10-07). **Lo que no está en ✅ es lo que falta por probar o construir**; en cada tabla el estado va justo después del ID.

| Sección | ✅ | 🟡 | 🟠 | 🔴 | ⚪ | Total |
|---|--:|--:|--:|--:|--:|--:|
| A. Aislamiento entre empresas (el riesgo #1 del producto) | 6 | 1 | 1 | 2 | · | 10 |
| B. Autenticación y sesión | 6 | · | 2 | 2 | · | 10 |
| C. Autorización | 2 | · | 4 | 2 | · | 8 |
| D. Datos y secretos | 7 | 3 | 2 | 5 | 3 | 20 |
| E. Auditoría y trazabilidad | 3 | 1 | 2 | · | · | 6 |
| F. Confidencialidad del proveedor del motor | · | · | 1 | · | · | 1 |
| G. Desarrollo y entrega | 1 | 1 | · | 1 | · | 3 |
| **Total** | **25** | **6** | **12** | **12** | **3** | **58** |

---

## A. Aislamiento entre empresas (el riesgo #1 del producto)

| ID | Estado | Requisito | Cómo se hace cumplir | Verificación | Fuente |
|---|---|---|---|---|---|
| **SEG-01** | ✅ | Una empresa nunca lee, modifica ni borra datos de otra | RLS de Postgres sobre `tenant_id`/`company_id` en todas las tablas de cliente. **Nunca** un `WHERE` que dependa de que cada consulta lo incluya | `rls-comportamiento` (BD) y `http` (API: leer, modificar, borrar, validar, enlazar entre empresas) | `modelo-datos.md` §4.3, D25; `architecture.md` («aislamiento fuerte») |
| **SEG-02** | ✅ | Sin tenant fijado no se ve ninguna fila («falla cerrado»), y un tenant mal formado falla en vez de abrir el acceso | Política `NULLIF(current_setting('app.tenant_id', true), '')::uuid` | `rls-comportamiento` | `schema-implementacion.md` §5 |
| **SEG-03** | ✅ | Las variables de sesión (`app.tenant_id`, `app.user_id`, `app.user_role`) viven por transacción, nunca por conexión | `set_config(..., true)` | `rls-comportamiento` (no se filtra a la transacción siguiente del pool) | `modelo-datos.md` §4.4 |
| **SEG-04** | ✅ | La app nunca se conecta como superusuario ni con `BYPASSRLS` | Rol `monkey_app` `NOSUPERUSER NOBYPASSRLS`; el dueño solo migra | `rls-cobertura` | `schema-implementacion.md` §4 |
| **SEG-05** | ✅ (índice 🟡) | Toda tabla nueva de datos de cliente nace con RLS activa y forzada, política de aislamiento y discriminante (`tenant_id` o `company_id`) | Convención de migración | `rls-cobertura` falla si una tabla queda sin RLS, sin `FORCE`, sin política, con política incondicional o sin discriminante. **El índice sobre `tenant_id` no se verifica** | `schema-implementacion.md` §5 |
| **SEG-06** | ✅ | El catálogo maestro se lee libre pero solo `admin_monkey` lo escribe | 4 políticas por tabla de `catalog` | `rls-cobertura`, `rls-comportamiento`, `catalog:verify` | `modelo-datos.md` §4.3, D31 |
| **SEG-07** | 🟠 | Una FK no valida que el padre sea del mismo tenant: antes de escribir con FK a otra tabla de tenant se lee el padre **bajo RLS** | Regla de aplicación | `http`: no se puede enlazar un activo al servicio de otra empresa. **Solo ese caso**; las demás FK no tienen prueba | `modelo-datos.md` §4.4 |
| **SEG-08** | 🟡 | Las búsquedas previas al tenant (login, canje, refresh, API key) usan funciones `SECURITY DEFINER` angostas, con `search_path` fijo | 4 funciones SQL | Ninguna prueba dedicada (se ejercitan indirectamente en el login de `http`) | `modelo-datos.md` §4.4, D29 |
| **SEG-09** | 🔴 `DT-22`, `P2` | Un cliente que exige separación total tiene base dedicada | Réplica física en otra base | No existe: el aprovisionamiento no se reconstruyó | `modelo-datos.md` §4.3, D24 |
| **SEG-45** | 🔴 `DT-33` | Un agente de la sonda no puede reportar datos a una empresa que no es la suya | Diseño decidido (D54): Monkey pre-registra el agente en el grupo del cliente y solo acepta resultados cuyo grupo corresponde al `tenant_id`. **Aún no se construye**: hoy nada lo impone | — | `wazuh.md`, D48, D54 |

> **Hallazgo (2026-10-07):** en los endpoints de servicios y activos **RLS es la única barrera**. Al romper a propósito la
> política de `services` y `assets`, la API devolvió datos de otra empresa: no hay un filtro por empresa en la aplicación.
> Es seguro mientras SEG-05 se cumpla, y por eso esa prueba es crítica. Los *listados* sí filtran en la aplicación.

## B. Autenticación y sesión

| ID | Estado | Requisito | Cómo se hace cumplir | Verificación | Fuente |
|---|---|---|---|---|---|
| **SEG-10** | ✅ | Sin sesión válida no hay datos: sin cookie o con una cookie manipulada → 401 | Guard de sesión global | `http` | `contracts/modules/auth.md` |
| **SEG-11** | ✅ | Cerrar sesión invalida el refresh | Revocación de la sesión | `http` | `auth.md` |
| **SEG-12** | ✅ | Sesión: 30 min de inactividad, 8 h máximo | `SESSION_IDLE_TIMEOUT`, `SESSION_MAX_DURATION` | `test/autenticacion/autenticacion.e2e-spec.ts`: 29 min sigue viva; 31 min se cierra y el refresh tampoco sirve; pasadas las 8 h se cierra; el token de una sesión cerrada no sirve | `modelo-datos.md` §5.3 |
| **SEG-13** | ✅ | Contraseña de 12+ caracteres con mayúscula, minúscula, número y símbolo | `PASSWORD_POLICY` en `common/security/password-policy.ts`, **única definición**, aplicada con `IsStrongPassword` al canjear la clave (antes había una segunda función sin uso que podía divergir; se eliminó) | `test/autenticacion/autenticacion.e2e-spec.ts`: 5 contraseñas débiles dan 422 por campo sin gastar la clave; la guardada es bcrypt. Una mutación de la regla hace fallar la prueba | §5.3 (NIST SP 800-63) |
| **SEG-14** | 🔴 | La contraseña expira a los 90 días | — | No hay nada en el código | §5.3 (SOC 2) |
| **SEG-15** | ✅ | Bloqueo a los 5 intentos fallidos, por 15 min | Lógica en el login | `test/autenticacion/autenticacion.e2e-spec.ts`: al 5.º fallo `403 ACCOUNT_LOCKED`; bloqueada, ni la contraseña correcta entra; el bloqueo dura ≤ 15 min; al vencer entra y el contador vuelve a 0; el error no distingue usuario inexistente de contraseña mala | §5.3, `auth.md` (`ACCOUNT_LOCKED`) |
| **SEG-16** | 🔴 `DT-23`, MD-94 | MFA TOTP obligatoria para los 5 roles (`admin_monkey`, `admin_empresa`, `funcional`, `consultor`, `auditor`) | — (el campo `is_mfa_enabled` existe, el flujo no) | — | §5.3, D66 |
| **SEG-17** | ✅ (API keys ⚪) | Refresh tokens, claves de acceso y API keys se guardan como HMAC con *pepper*, nunca en claro | `TOKEN_HASH_PEPPER` | `test/autenticacion/autenticacion.e2e-spec.ts`: el hash guardado ≠ el token; la clave de acceso no aparece ni en claro ni en el rastro de auditoría. **Las API keys no tienen endpoint todavía** | `schema-implementacion.md` §4 |
| **SEG-18** | 🟠 | Los tokens viajan en cookie `httpOnly`; el frontend nunca los toca | `auth-cookies.ts` (`secure` solo en producción) | `test/autenticacion/autenticacion.e2e-spec.ts`: `HttpOnly` y `SameSite=Lax` en las dos cookies, el refresh solo en `/v1/auth`, y ningún token en el cuerpo. **La bandera `Secure` (solo en producción) no se prueba** | `contracts/conventions.md` |
| **SEG-19** | 🟠 | Límite de peticiones: 100/min por usuario, 1000/min por empresa | Solo existe el freno de intentos de la **clave de acceso** (10 fallos cada 15 min por dirección, en memoria de la instancia: DT-37). El general no existe | Ninguna | §5.3 |

## C. Autorización

| ID | Estado | Requisito | Cómo se hace cumplir | Verificación | Fuente |
|---|---|---|---|---|---|
| **SEG-20** | ✅ (2 de 5 roles) | La autorización se verifica en cada petición; no se confía en el frontend | `@Roles()` + guard | `http`: una empresa no accede a rutas de `admin_monkey` y `admin_monkey` no actúa como `admin_empresa` | §5.3 |
| **SEG-21** | 🟠 `P3` | Matriz de permisos por rol (13 acciones) | Por módulo | Solo `admin_monkey` y `admin_empresa`. `funcional`, `consultor` y `auditor` no tienen endpoints todavía. El `consultor` y el `auditor` ven toda su empresa sin asignación (D63, D64) | §5.5 |
| **SEG-54** | 🟠 `MD-137` | La vista técnica (puntos de enfoque, estados del motor, pruebas y resultados por check) la reciben **solo los roles `auditor` y `consultor`**; `admin_empresa` y `funcional` reciben la vista de negocio (que lleva los códigos de control y de requisito, D80) y un `403` si piden la técnica | `view=technical` restringido: hecho en los controles (`viewModeOf`, MD-117); falta el resumen del servicio (MD-137) | La lista y el detalle de controles: `test/cumplimiento/controles.e2e-spec.ts`. El resumen, ninguna todavía | D63 |
| **SEG-56** | 🔴 D77 | Solo el `consultor` emite la evaluación del consultor y solo el `auditor` la del auditor; una emitida no se edita ni se borra | Permiso por rol en el caso de uso, `CHECK` de que `assessor_role` coincida con el rol de quien emite y `REVOKE` de `UPDATE`/`DELETE` | Ninguna prueba: aún no se construye | §7.5, D77 |
| **SEG-57** | ✅ | Una suspensión de la empresa solo la reactiva la empresa; solo `admin_monkey` asigna y retira a un consultor; ningún otro rol toca una asignación, y nadie la borra | Políticas RLS de `consultant_assignments` + el trigger `consultant_assignment_guard` (valida quién cambia el estado y sella quién y cuándo) | `test/aislamiento/consultor-asignaciones.e2e-spec.ts` (19 pruebas contra la base, con el rol real de la app) | D64, §5.2 |
| **SEG-58** | 🔴 MD-108 | Nadie decide lo que él mismo propuso: aprobar o rechazar un cambio de control, una exclusión o una entrega de evidencia lo hace otra persona, con otro rol cuando el modelo lo exige | El caso de uso compara `decided_by` con quien propuso y responde `403` | Ninguna todavía | `contracts/conventions.md` (decisiones), D65, D78 |
| **SEG-22** | 🔴 | `funcional` siempre acotado a lo que tiene asignado | `user_control_assignments` | No existe aún el módulo | §5.5 |
| **SEG-23** | 🟠 | Un usuario desactivado pierde el acceso y se cierran sus sesiones (CC6.3) | El guard comprueba el estado del usuario en cada petición | `test/autenticacion/autenticacion.e2e-spec.ts`: con el usuario `inactive` su sesión abierta deja de servir y no puede volver a entrar. **Falta el endpoint para desactivarlo (MD-132)** | §5.6 |

## D. Datos y secretos

| ID | Estado | Requisito | Cómo se hace cumplir | Verificación | Fuente |
|---|---|---|---|---|---|
| **SEG-24** | ✅ | Las credenciales de los sistemas del cliente se guardan cifradas (AES-256-GCM) y nunca se devuelven | `aes-credential.cipher.ts` | `test/autenticacion/autenticacion.e2e-spec.ts`: ni la respuesta del alta, ni el detalle, ni el listado las devuelven; en la base están cifradas (`v1.…`) y no contienen el secreto. La gestión de la llave es **SEG-25** | D46, `modelo-datos.md` §6.3 |
| **SEG-25** | 🔴 `DT-5` | La llave de cifrado se gestiona y se rota con un procedimiento | Hoy: variable de entorno, sin rotación | — | DT-5 |
| **SEG-26** | 🔴 `DT-43`, `P14` | Las credenciales de la nube del cliente no se guardan como llaves estáticas en un servidor compartido: rol entre cuentas, sin secretos, ejecución aislada por cliente | — (la prueba de viabilidad usó llaves estáticas) | — | `P14` C1/C3, DT-35, DT-43 |
| **SEG-27** | ⚪ | Cifrado en tránsito: TLS 1.3 y HSTS | Lo da el proxy, no la app (la app no fija HSTS) | No verificable desde el repo | §5.3 (PCI DSS) |
| **SEG-28** | 🔴 | Conexión a la base con `sslmode=require` y firewall del 5432 restringido | — | — | `schema-implementacion.md` §9 |
| **SEG-29** | 🟡 | Los datos crudos de escaneos de clientes (cuentas, recursos, fallos) no se versionan | `.gitignore` (`assets/soc2/`, `assets/*.html`) | Revisión manual | 2026-10-07 |
| **SEG-30** | 🟡 | Ninguna credencial en texto plano en ningún repo (`conexion_api_wazuh_monkey.txt` incluida) | Regla del equipo | Sin escáner de secretos. Una búsqueda puntual no encontró las cadenas conocidas | `CLAUDE.md` |
| **SEG-31** | 🔴 | Rotar antes de producción: contraseña de `postgres`, `JWT_SECRET`, la de la API de la sonda y la contraseña del usuario de API de la sonda usado en las pruebas (se pegó en un chat el 2026-10-07), **las llaves del usuario IAM `monkey-audit` de la cuenta de AWS de pruebas y la contraseña SSH de la VPS de desarrollo (se pegaron en el chat el 2026-10-08)** | — | — | `schema-implementacion.md` §9 |
| **SEG-32** | ⚪ | Los prompts a la IA nunca llevan credenciales ni secretos; el plano de datos del cliente está separado del de inferencia | — | Aún no hay IA | `architecture.md` |
| **SEG-43** | ✅ | Un archivo subido por el cliente solo se acepta si es PDF o `.docx`, pesa ≤ 25 MB y su **contenido** coincide con lo que declara (firma, no solo extensión); el nombre no puede salirse de la ruta | `system-description-file.ts` | `system-description-file.spec.ts` (unitaria, corre en el CI) | D51, `contracts/modules/onboarding-service-context.md` |
| **SEG-44** | ⚪ | Los archivos del cliente viven en un bucket **no público**, con la llave prefijada por empresa y descarga por URL temporal (5 min) | `FileStorage` (S3/minio), `<empresa>/services/<servicio>/…` | La llave y la unicidad, sí (`system-description-file.spec.ts`). **Que el bucket sea privado y la política por tenant no se verifican desde el repo** | D51 |
| **SEG-46** | 🟠 `DT-43`, `DT-52` | El motor de nube nunca recibe llaves de larga vida: solo credenciales **temporales** de un rol asumido (1 h), y el contenedor se elimina al terminar | El trabajador asume el rol (STS, con `ExternalId`) y pasa las credenciales temporales por el entorno del contenedor efímero, que se elimina siempre | `sts-credential-broker.spec.ts` (credenciales con token de sesión; cuenta distinta rechazada), `docker-engine.e2e-spec.ts` (se elimina en éxito, fallo y timeout) y una corrida real el 2026-10-09. **Excepción:** el canal de llaves pasa llaves de larga vida al motor (menos seguro, D53) | `P14` C1/C3, DT-43, D57 |
| **SEG-47** | 🟠 D57 | La API interna del trabajador solo acepta su token, no está publicada fuera de la red interna y nunca devuelve ni registra secretos | `RunnerTokenGuard`: sin `RUNNER_TOKEN` no existe (404), token en tiempo constante, y lo que llega por el proxy (`X-Forwarded-For`/`X-Real-IP`) se trata como inexistente; ruta fuera de `/v1` | `test/control-tecnico/api.e2e-spec.ts` (401 sin token, con cookie, 404 por el proxy y bajo `/v1`, tenant ajeno 409). **Falta:** que el proxy no publique `/internal` (infraestructura) | D57, `contracts/modules/control-tecnico-operacion.md` |
| **SEG-48** | ✅ (`DT-51`: el acceso a Docker sigue siendo amplio) | El motor corre aislado: sin capacidades, sin escalada de privilegios, sin montajes del servidor, sin la red del backend, con memoria/CPU/procesos acotados | `DockerScanEngine` (`CapDrop ALL`, `no-new-privileges`, red `bridge`, sin `Binds`, límites) | `test/control-tecnico/docker-engine.e2e-spec.ts` contra Docker real: capacidades en cero, red `bridge`, sin montajes, límites | D57 |
| **SEG-49** | 🟡 | El trabajador solo recibe su propio entorno: nunca el JWT, la clave de cifrado ni la base de datos | `runner.env` aparte (en el servidor) y `env_file` propio en el compose; `check-env.sh` rechaza un `runner.env` con secretos del backend | `runner.env.example` y la prueba de que la configuración del trabajador carga sin esos secretos; el aislamiento real del compose no se comprueba automáticamente | D57 |
| **SEG-50** | ✅ (`DT-52`: el trabajador sí las recibe en memoria) | Las llaves de acceso que el cliente entrega (canal de llaves) se guardan cifradas y **nunca** salen: ni en una respuesta, ni en el rastro de auditoría, ni en la pantalla. El backend no descifra nada cuando valida el trabajador | `AES-256-GCM`; la sonda `runner` no descifra; las respuestas y el rastro no incluyen credenciales | `test/control-tecnico/conexion.e2e-spec.ts` (alta, detalle, validación y rastro sin la llave; en la base está cifrada) y una prueba real con navegador | D58, D46 |
| **SEG-51** | ✅ D59 | El descubrimiento de activos solo **lee**, solo en las regiones declaradas, y no filtra el error del proveedor ni atributos arbitrarios: lo que entrega el trabajador se limpia antes de guardarse y el error de AWS nunca se registra ni se devuelve | `AwsInventoryScanner` (solo `Describe*`/`List*`, `warnings` sin detalle); `toInventory` limpia atributos; inventario con RLS (`asset_resources`) | `src/runner/infrastructure/inventory/aws-inventory-scanner.spec.ts`, `test/control-tecnico/conexion.e2e-spec.ts` (descubrimiento: empresa ajena 404, clase inventada rechazada) | D59 |
| **SEG-52** | ✅ D60 | Un activo dado de baja no existe para nadie: no se valida, activa, programa, edita ni evalúa (`404`), y sus llaves guardadas se borran; los activos que descubrió se dan de baja con ella | `readAsset`/`findProbeTarget`/`queueExecution` solo ven activos `active`; `retireAsset` anula `encrypted_credentials` | `test/control-tecnico/conexion.e2e-spec.ts` («un activo dado de baja no se puede operar…») | D59, D60 |
| **SEG-53** | ✅ D61 | El servicio solo puede enlazar activos que sean **de esa conexión y de su empresa**; un id ajeno, inventado o de otra conexión se rechaza (`422`), y otra empresa ve `404`. Un activo descubierto no se opera por su cuenta | `setServiceAssets` valida contra los hijos activos de la conexión dentro de `withScope` (RLS); `readAsset`/`findProbeTarget`/`queueExecution` solo ven conexiones | `test/control-tecnico/conexion.e2e-spec.ts` («solo se pueden enlazar activos de ESA conexión…», «los activos descubiertos no son conexiones…») | D61 |
| **SEG-55** | 🟠 `MD-160` | Un consultor solo entra a una empresa con una asignación **activa**; la comprobación ocurre en cada petición, la empresa puede suspenderla y cada elección o cambio de empresa queda en la auditoría | Política RLS de `consultant_assignments` (hecha, MD-157) + guard de empresa activa (falta, MD-160) | La política, sí: `test/aislamiento/consultor-asignaciones.e2e-spec.ts`. El guard, ninguna todavía | D64 |

## E. Auditoría y trazabilidad

| ID | Estado | Requisito | Cómo se hace cumplir | Verificación | Fuente |
|---|---|---|---|---|---|
| **SEG-33** | ✅ | `audit_logs` y `compliance_events` son append-only para **todos** los roles | `REVOKE` + triggers `audit.reject_mutation()` | `audit:verify` (en CI) | D41, §4.3 |
| **SEG-34** | ✅ | El audit trail de una empresa no se lee ni se escribe desde otra | RLS en `audit` | `rls-comportamiento` | §4.3 |
| **SEG-35** | 🟠 `D72` | Retención de 7 años | Depende de los respaldos | Inmutabilidad ✅; la retención depende de dónde viva el Postgres | D41, §5.3 (SOC 2 Tipo II) |
| **SEG-36** | ✅ | La auditoría se escribe **en la misma transacción** que la acción | Cada método del repositorio que cambia datos **exige** un `AuditIntent` (el compilador lo impone) y lo escribe con `insertAuditLog(tx, …)` dentro de su transacción. Excepción documentada: los intentos fallidos y los cierres automáticos de sesión (DT-47) | `test/auditoria/audit-atomica.e2e-spec.ts`: cada acción deja exactamente 1 rastro con su empresa; forzando que el rastro falle **después** de insertarse, la acción se revierte (servicio, escenario, alcance, activo, descripción, contexto, login, logout, empresa, canje) y la fila de auditoría también. Una mutación (rastro tras el commit) hace fallar la prueba | D41, D52 |
| **SEG-37** | 🟠 | Los intentos de acceso denegados se registran (CC7.2/CC7.3) | `auth.login_failed` y el canje fallido (`access_key.redeem` con `result = error`), de mejor esfuerzo y sin tenant | `test/autenticacion/autenticacion.e2e-spec.ts`: cada fallo de login deja su rastro (con `user_id`, o con el correo tecleado si no existe). **Un 403 por rol no se registra** | §5.6 |
| **SEG-38** | 🟡 MD-145 | `evaluations` es inmutable salvo el cierre humano | `REVOKE` + `GRANT UPDATE` por columna | Ninguna prueba | §7.4 |

## F. Confidencialidad del proveedor del motor

| ID | Estado | Requisito | Cómo se hace cumplir | Verificación | Fuente |
|---|---|---|---|---|---|
| **SEG-39** | 🟠 MD-87, `D70` | Ninguna pantalla, notificación, reporte ni texto de IA nombra al proveedor del motor (ni la sonda ni el motor de nube) | Revisión | Ninguna prueba automática | `CLAUDE.md`, `philosophy.md`, `wazuh.md` |

> El prototipo de postura de AWS (`assets/monkey-postura-aws.html`) **lo violaba** (nombraba el motor y la versión al pie).
> No es un caso aislado: sin una prueba que busque esos nombres en lo que sale al cliente, depende de la atención de quien revisa.

## G. Desarrollo y entrega

| ID | Estado | Requisito | Cómo se hace cumplir | Verificación | Fuente |
|---|---|---|---|---|---|
| **SEG-40** | ✅ | Lint, build, pruebas unitarias, migraciones desde cero, verificadores y pruebas de aislamiento corren en cada PR | `.github/workflows/ci.yml` | El propio CI | DT-20 |
| **SEG-41** | 🔴 `DT-46` | Un PR en rojo no se puede mergear, y un despliegue no sale si el CI falla | Exige el plan GitHub Team (protección de rama) o que el deploy dependa del CI | — | DT-46 |
| **SEG-42** | 🟡 | Las migraciones desplegadas se respaldan antes y no se editan una vez aplicadas | `scripts/deploy/migrate.sh` | Probado a mano, no en GitHub Actions | `schema-implementacion.md` §7 y §13 |

---

## Cómo añadir o cambiar un requisito

1. Fila nueva al final de su sección, con el siguiente `SEG-n` libre.
2. Fuente obligatoria: un documento del comité, una decisión (D-n) o una deuda. Sin fuente es una opinión, y se marca como tal.
3. Estado según la regla 3. Si se cierra un requisito, se actualiza la fila y se cita la prueba o el PR. Al cambiar un estado, se actualiza también la tabla **Resumen** de arriba.
4. Si el requisito es incumplido y no tiene `DT-n`, se crea la deuda.

## Lo que este registro **no** es

No es una auditoría de seguridad ni un pentest: dice qué está comprobado y qué no, no que lo comprobado sea suficiente.
Tampoco certifica nada ante un auditor externo.
