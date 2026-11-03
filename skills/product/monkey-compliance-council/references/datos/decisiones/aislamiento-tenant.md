# Decisiones — Aislamiento multi-tenant

Por qué Aislamiento multi-tenant es como es. **Se consulta para reabrir, no para construir**: lo vigente está en [`arquitectura/aislamiento-tenant/`](../../arquitectura/aislamiento-tenant/README.md) y en `datos/modelo/`. Índice de todas las decisiones: [`README.md`](README.md).

## D25 (aprovisionamiento/simplificación MVP) · Una sola base de datos por defecto, no dos planos separados

**Pregunta:** el modelo hablaba de un "plano central" (catálogo) y un "plano del
tenant" (datos del cliente) como bases físicamente separadas — ¿se mantiene así para el
MVP?

**Decisión: no.** Para el MVP, el caso `shared` (por defecto) es **una sola base de
datos** con todas las tablas — catálogo maestro y datos de todos los tenants —, aislada
por RLS sobre `tenant_id`. Catálogo y escenario del cliente se relacionan con **FK
reales** (p. ej. `service_frameworks` → `frameworks` con una foreign key, no una copia ni una
llamada entre bases). Son más tablas en una sola base, pero es más fácil de entender,
de consultar y de mantener para el tamaño del MVP — dos bases separadas es una
complejidad que no se justifica todavía.

**Lo que no cambia:** la opción `dedicated` sigue existiendo (D14) y sigue siendo
excepcional, elegida por `admin_monkey` al crear la empresa en Monkey Admin (D24), no
por el cliente durante el onboarding. Cuando se elige, esa empresa obtiene una réplica
completa del esquema (catálogo + datos propios) en su propia base, sin cruzar con nadie.

**Qué cambia en el modelo:** se corrige `modelo-datos.md` §4.3 y §3.5 — ya no se habla de
"plano central" vs "plano del tenant" como bases distintas; es una distinción lógica
dentro del mismo esquema para el caso compartido.

**Fuente:** decisión de Héctor, 2026-09-21, como simplificación deliberada para el MVP.

---

---

## D29 · Búsquedas previas al tenant: funciones `SECURITY DEFINER`, email único global

**Decisión:** el login, el canje de la clave de acceso, el refresh y la autenticación por API key
buscan antes de conocer el tenant. Cada una tiene su función angosta (`find_login_candidates`,
`find_access_key`, `find_session_by_token`, `find_api_key`). El `email` de `users` es **único
global** y en minúsculas.

**Por qué:** RLS falla cerrado y esas cuatro búsquedas no tienen contexto. El login recibe solo el
email (contrato de auth) y un auditor es un único usuario que audita varias empresas, así que un
email único por empresa dejaba el login ambiguo.

---

## D31 · RLS también en `catalog` (escritura), `companies`, `access_keys` y `audit_logs`

**Decisión:** en `catalog` todos leen pero solo `admin_monkey` escribe (`app.user_role`). `companies`
y `access_keys` las ve su tenant o `admin_monkey`. `audit_logs` la lee su tenant o `admin_monkey`
(así las acciones de plataforma sin tenant no quedan ilegibles) y se escribe sin `RETURNING`.

**Por qué:** el rol de la app tenía `INSERT/UPDATE/DELETE` sobre todo el catálogo y `SELECT` sobre
todas las empresas: un fallo en un endpoint de cliente alcanzaba a todos los demás.
