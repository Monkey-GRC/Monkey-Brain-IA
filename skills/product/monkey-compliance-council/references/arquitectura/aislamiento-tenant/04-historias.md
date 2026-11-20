# Aislamiento multi-tenant · historias de usuario

Responde: **¿qué garantiza Monkey para que una empresa nunca vea ni toque los datos de otra, y cómo se comprueba?** Es una
regla transversal sin pantallas propias, así que la mayoría de las historias tienen como actor **el sistema** (la base de
datos y la aplicación) o a quien lo verifica (un auditor, el CI). Sus criterios son verificables y citan la regla que los
fija. No hay contrato propio: el patrón está en [`datos/schema-implementacion.md`](../../datos/schema-implementacion.md) §5,
las variables y reglas en [`datos/modelo/04-monkey-admin.md`](../../datos/modelo/04-monkey-admin.md) §4.3–§4.4, los
requisitos en [`seguridad/aislamiento-tenant.md`](../../seguridad/aislamiento-tenant.md); la secuencia, en
[`03-flujos.md`](03-flujos.md); los pasos de cada caso, en [`05-casos-de-uso.md`](05-casos-de-uso.md).

**Roles** (D96): `admin_empresa`, `responsable`, `delegado`, `auditor` (Monkey Platform) y `admin_monkey` (Monkey Admin).
«Persona» = cualquier rol de Platform. «Sistema» = la aplicación y PostgreSQL. **Estado**: ✅ construida · 🟡 parcial ·
⚪ por construir. El estado sale de la columna de estado de cada `SEG-n` y se comprobó en `Backend/` (migraciones,
`PrismaService.withScope` y las suites de `test/aislamiento/`).

## Resumen

| ID | Historia | Rol | Estado | Reglas |
|---|---|---|---|---|
| HU-TEN-01 | Que mi empresa nunca vea, cambie ni borre datos de otra | Persona | ✅ | SEG-01, D25 |
| HU-TEN-02 | Un recurso de otra empresa no existe para mí (404, no 403) | Persona | ✅ | `conventions.md` (`NOT_FOUND`) |
| HU-TEN-03 | Sin empresa declarada no se ve nada (falla cerrado) | Sistema | ✅ | SEG-02 |
| HU-TEN-04 | La empresa declarada no pasa a la petición siguiente | Sistema | ✅ | SEG-03 |
| HU-TEN-05 | La aplicación no puede saltarse el aislamiento | Sistema · `auditor` | ✅ | SEG-04 |
| HU-TEN-06 | Toda tabla nueva de datos de cliente nace aislada | Sistema (CI) | 🟡 | SEG-05 |
| HU-TEN-07 | El catálogo maestro se lee libre y solo lo escribe Monkey | `admin_monkey` · Persona | ✅ | SEG-06, D31 |
| HU-TEN-08 | Monkey Admin ve todas las empresas; una empresa, solo la suya | `admin_monkey` · Persona | ✅ | D31 |
| HU-TEN-09 | El rastro de mi empresa no se lee ni se escribe desde otra | Persona · `auditor` | ✅ | SEG-34, D31 |
| HU-TEN-10 | No poder enlazar mis datos a un registro de otra empresa | Persona | 🟡 | SEG-07 |
| HU-TEN-11 | Identificar a la persona antes de saber su empresa, sin abrir la base | Sistema | 🟡 | SEG-08, D29 |
| HU-TEN-12 | Dar a un cliente que lo exige una base de datos propia | `admin_monkey` | ⚪ | SEG-09, D25, DT-22, P2(d) |

---

### HU-TEN-01 · Que mi empresa nunca vea, cambie ni borre datos de otra

**Como** persona de una empresa cliente, **quiero** que los datos de mi empresa estén separados de los de cualquier otra
**para** confiar a Monkey información sensible de mi cumplimiento.

- Dado dos empresas A y B, cuando A lista servicios o activos, entonces solo recibe los suyos (SEG-01).
- Cuando A pide, modifica o borra por id un servicio, un activo o el control técnico de B, entonces la operación no ocurre
  y B conserva lo suyo intacto (SEG-01).
- La base rechaza insertar una fila con el `tenant_id` de otra empresa y cambiar el `tenant_id` de una fila propia para
  «regalarla» (política `WITH CHECK`, `schema-implementacion.md` §5).
- El aislamiento lo pone una política RLS sobre `tenant_id` (o `company_id`), nunca un `WHERE` escrito en cada consulta
  (SEG-01, D25).

### HU-TEN-02 · Un recurso de otra empresa no existe para mí

**Como** persona de una empresa, **quiero** que pedir algo de otra empresa responda igual que pedir algo que no existe
**para** que nadie pueda averiguar qué tienen otros clientes.

- Un recurso de **otra empresa** responde `404` `NOT_FOUND`, nunca `403` (`contracts/conventions.md`).
- Un recurso **de mi empresa** que mi rol no alcanza sí responde `403` `FORBIDDEN` (lo aplica
  [Roles y permisos](../roles-permisos/README.md)).

### HU-TEN-03 · Sin empresa declarada no se ve nada

**Como** sistema, **quiero** que una consulta sin empresa declarada no devuelva ninguna fila **para** que olvidar el
filtro nunca filtre datos.

- Dado una conexión como `monkey_app` sin `app.tenant_id`, cuando consulta una tabla de tenant, entonces obtiene 0 filas
  (SEG-02).
- Un `app.tenant_id` que no es un uuid hace fallar la consulta en vez de abrir el acceso (`NULLIF(…)::uuid`, SEG-02).

### HU-TEN-04 · La empresa declarada no pasa a la petición siguiente

**Como** sistema, **quiero** que la empresa, el usuario y el rol vivan solo en la transacción que los declara **para**
que una conexión reutilizada del pool no herede la empresa de otra petición.

- `withScope` fija `app.tenant_id`, `app.user_id` y `app.user_role` con `set_config(…, true)` dentro de una transacción
  (SEG-03, `modelo/04-monkey-admin.md` §4.4).
- Dado una transacción con la empresa A en una conexión, la transacción siguiente en esa misma conexión, sin declarar
  empresa, no ve filas de A (SEG-03).
- La empresa sale del `Principal`, que se lee de la base al validar la sesión, no del token.

### HU-TEN-05 · La aplicación no puede saltarse el aislamiento

**Como** auditor de seguridad, **quiero** comprobar que el rol con el que corre la aplicación no puede ignorar las
políticas **para** que un error de código no se convierta en una fuga entre empresas.

- La app se conecta como `monkey_app`: `NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE` (SEG-04).
- El superusuario solo migra (`DATABASE_URL`); la app usa `APP_DATABASE_URL` (`schema-implementacion.md` §4).
- La suite `rls-cobertura` falla si el rol de la app es superusuario o se salta RLS (SEG-04).

### HU-TEN-06 · Toda tabla nueva de datos de cliente nace aislada

**Como** sistema (CI), **quiero** que una tabla nueva sin aislamiento haga fallar las pruebas **para** que no llegue a
producción una tabla visible para todas las empresas.

- `rls-cobertura` falla si una tabla de datos de cliente queda sin RLS activa, sin `FORCE`, sin política, con una política
  incondicional (`true` o de lectura pública) o sin discriminante `tenant_id`/`company_id` (SEG-05).
- Las políticas `tenant_isolation` comparan el discriminante con `app.tenant_id` en `USING` y en `WITH CHECK` (SEG-05).
- 🟡 Pendiente: el índice sobre `tenant_id` (o `company_id`) que exige el modelo (§4.4) **no se verifica** (SEG-05).

### HU-TEN-07 · El catálogo maestro se lee libre y solo lo escribe Monkey

**Como** `admin_monkey`, **quiero** ser el único que modifica el catálogo maestro **para** que un fallo en un endpoint de
cliente no altere los marcos y controles de todas las empresas.

- Cualquier persona lee las tablas de `catalog`; `INSERT`, `UPDATE` y `DELETE` solo pasan con `app.user_role =
  'admin_monkey'` (SEG-06, D31).
- Toda tabla de `catalog` tiene RLS y las cuatro políticas; `rls-cobertura`, `rls-comportamiento` y `catalog:verify` lo
  comprueban (SEG-06).

### HU-TEN-08 · Monkey Admin ve todas las empresas; una empresa, solo la suya

**Como** `admin_monkey`, **quiero** ver todas las empresas y sus claves de acceso **para** administrarlas, sin que una
empresa cliente pueda hacer lo mismo.

- `companies` y `access_keys` las ve su propio tenant o `app.user_role = 'admin_monkey'` (D31).
- Un usuario de empresa no lista ni ve empresas, ni registra otra, aunque declare el tenant de otra empresa
  (`rls-comportamiento`, `http`).
- `admin_monkey` no actúa como `admin_empresa`: no declara servicios de un cliente (`http`).

### HU-TEN-09 · El rastro de mi empresa no se lee ni se escribe desde otra

**Como** persona de una empresa (o su auditor), **quiero** que el rastro de auditoría de mi empresa esté aislado como el
resto de mis datos **para** que lo que hicimos no lo vea otro cliente.

- `audit_logs` y `compliance_events` tienen RLS: el rastro de una empresa no se lee ni se escribe desde otra (SEG-34).
- `audit_logs` lo lee su tenant o `admin_monkey`, y admite filas con `tenant_id` nulo para las acciones de plataforma (D31).
- El rastro se escribe sin `RETURNING` y dentro de la transacción de la acción (D52, `schema-implementacion.md` §5).

### HU-TEN-10 · No poder enlazar mis datos a un registro de otra empresa

**Como** persona de una empresa, **quiero** que no se pueda colgar un registro mío de un padre ajeno **para** que una
llave foránea no abra un puente entre empresas.

- Antes de escribir una fila con FK a otra tabla de tenant, la aplicación lee el padre bajo RLS; si no lo ve, no es suyo
  y no escribe (SEG-07, `modelo/04-monkey-admin.md` §4.4).
- Registrar un activo propio enlazado al servicio de otra empresa no se permite: `422` `VALIDATION_FAILED` sobre
  `service_ids`, y el activo no aparece en la otra empresa (`http`).
- 🟡 Pendiente: solo ese caso tiene prueba; las demás FK entre tablas de tenant no (SEG-07 🟠).

### HU-TEN-11 · Identificar a la persona antes de saber su empresa, sin abrir la base

**Como** sistema, **quiero** resolver el login, el canje de una clave o código, el refresh y el segundo factor sin
desactivar el aislamiento **para** que lo que ocurre antes de conocer la empresa no sea una puerta trasera.

- Cada búsqueda previa al tenant usa una función `SECURITY DEFINER` angosta, con `search_path` fijo, `REVOKE … FROM
  PUBLIC` y `GRANT EXECUTE` solo a `monkey_app`, que devuelve solo las columnas necesarias (SEG-08, D29):
  `find_login_candidates`, `find_access_key`, `find_session_by_token`, `find_mfa_challenge`, `find_activation_code`,
  `find_trusted_device` y `find_password_reset_token`. `find_api_key` existe en la base, pero ningún endpoint autentica
  todavía con API key.
- Con el `company_id` que devuelve, la aplicación declara `app.tenant_id` y sigue con RLS normal (D29).
- El `email` es único global y en minúsculas, así que el login devuelve a lo sumo un usuario (D29).
- 🟡 Pendiente: ninguna prueba dedicada comprueba esas funciones; se ejercitan indirectamente en el login (SEG-08).

### HU-TEN-12 · Dar a un cliente que lo exige una base de datos propia

**Como** `admin_monkey`, **quiero** registrar con base de datos dedicada a un cliente cuya política exige separación
total **para** ofrecerle una réplica completa del esquema sin cruzar con nadie.

- La estrategia (`shared` o `dedicated`) la elige `admin_monkey` al crear la empresa y queda en `companies` (D25,
  `modelo/04-monkey-admin.md` §4.3).
- ⚪ Hoy registrar una empresa con base dedicada responde `DEDICATED_DATABASE_NOT_AVAILABLE` (DT-22): el aprovisionamiento
  no está construido (SEG-09). Si toma tiempo y cuándo se manda la clave depende de **P2(d)**, abierta en el comité.
