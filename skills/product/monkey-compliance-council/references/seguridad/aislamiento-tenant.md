# Requisitos de seguridad — Aislamiento multi-tenant

Es **el riesgo #1 del producto**: que una empresa vea los datos de otra.

Tablero, estados y reglas de uso: [`README.md`](README.md). Cómo funciona el módulo: [`arquitectura/aislamiento-tenant/`](../arquitectura/aislamiento-tenant/README.md).

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

*Vienen de las secciones A. del registro anterior.*
