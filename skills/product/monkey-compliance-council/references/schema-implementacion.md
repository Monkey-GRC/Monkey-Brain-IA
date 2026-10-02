# Cómo está implementado el schema

Complementa a `modelo-datos.md` (el **qué**: tablas y relaciones) y a `modelo-datos-decisiones.md`
(el **por qué**). Este archivo es el **cómo** en el Backend: Prisma, Postgres, RLS, roles,
migraciones y despliegue. Si algo choca con `modelo-datos.md`, gana el modelo. Absorbe la bitácora
"decisiones de la reconstrucción del schema" (septiembre de 2026), que se retiró de `assets/`.

**Estado al 2026-09-29:** 22 migraciones, 57 enums, 75 tablas, todas con RLS, ninguna FK sin índice
(salvo las de "quién lo hizo") y ningún `ON DELETE CASCADE`. Probado desde cero en Postgres 17.

---

## 1. Arquitectura

- **Una sola base de datos (`monkey`)** con **4 schemas de Postgres**: `catalog`, `platform`,
  `tenant`, `audit` (D25). Se eliminó el modelo viejo de `prisma/central/` + `prisma/tenant/`
  (dos bases, dos configs, dos clientes).
- **RLS sobre `tenant_id`** aísla a los clientes, no bases separadas. El caso `dedicated`
  (D14/D24) sigue siendo una réplica física en otra base, pero su aprovisionamiento **no se ha
  reconstruido** (se borró con `tenant-connection-manager` y `tenant-provisioning.service`).

| Schema | Contenido | RLS |
|---|---|---|
| `catalog` | Catálogo maestro (§3 del modelo) | Lectura libre; escritura solo `admin_monkey` |
| `platform` | Monkey Admin y usuarios | Sí, todas |
| `tenant` | Onboarding, cumplimiento, control técnico | Sí, todas |
| `audit` | `audit_logs`, `compliance_events` | Sí, y `REVOKE UPDATE, DELETE` (append-only) |

## 2. Estructura de Prisma

```
Backend/
├── prisma.config.ts
└── prisma/
    ├── schema/
    │   ├── schema.prisma        # solo datasource + generator
    │   ├── catalog/  frameworks · controls · tests · risks · versions · technical-catalog
    │   ├── platform/ companies · users
    │   ├── tenant/   onboarding · compliance · technical-control
    │   └── audit/    audit
    └── migrations/<timestamp>_<nombre>/
```

Prisma con `multiSchema` carga **recursivamente** todo lo que esté dentro de la carpeta que apunta
`schema` en `prisma.config.ts`: cada carpeta nueva **tiene que vivir dentro de `prisma/schema/`**
(una `audit/` creada al lado hizo que Prisma no viera esos modelos).

Dos reubicaciones respecto al ER, de **dónde vive el archivo**, no de la estructura:
`organization_responsibles` está en `tenant/onboarding.prisma` (su FK es `organization_id`, y
ponerla en `platform` crearía una dependencia circular al migrar), y `schedule_rules` es de
`tenant` (ver §6).

## 3. Prisma 7: lo que no es como en las versiones anteriores

`prisma@7.2.0` y `@prisma/client@7.2.0` con `@prisma/adapter-pg`.

- `multiSchema` es GA: no va en `previewFeatures`.
- **La `url` vive en `prisma.config.ts`**, no en `schema.prisma`; ahí el `datasource` solo lleva
  `provider` y `schemas`.
- **No hay campo `adapter` en `prisma.config.ts`.** El CLI se conecta directo con `datasource.url`.
  El adapter (`PrismaPg`) se usa **solo en runtime**, dentro de `PrismaService`.
- **UUID:** `@default(uuid())` (lo genera Prisma) en vez de `gen_random_uuid()`: evita depender de
  `pgcrypto`. Un `INSERT` por SQL directo debe traer su `id`; el catálogo se carga con un script
  TypeScript, así que no es problema.
- **`shadowDatabaseUrl` se lee con `process.env`, no con `env()`**: `env()` lanza error si falta la
  variable, y en staging y producción nunca existe (ahí solo `migrate deploy`).
- **Generador:** `provider = "prisma-client"`. Si el build CommonJS de Nest rompe por ESM, se añade
  `moduleFormat = "cjs"`.
- **Enums:** todos con `@@map("snake_case")`; en SQL a mano se referencian sin comillas
  (`platform.user_role`). Un valor no puede empezar por dígito: `"24x7"` es `h24x7 @map("24x7")`.

```ts
// prisma.config.ts
export default defineConfig({
  schema: path.join('prisma', 'schema'),
  migrations: { path: path.join('prisma', 'migrations') },
  datasource: { url: env('DATABASE_URL'), shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL },
});
```

## 4. Bases, roles y variables de entorno

- `monkey` — la base real (dev en `135.148.138.36`; staging en el contenedor `postgres-staging` de
  la VPS: dos bases físicas con el mismo nombre).
- `monkey_shadow` — solo dev, la usa `prisma migrate dev` para comprobar que las migraciones
  reproducen el schema. Nunca en staging ni producción.

| Rol | Privilegios | Para qué | Variable |
|---|---|---|---|
| `postgres` | Superusuario, ignora RLS | Migrar | `DATABASE_URL` |
| `monkey_app` | `NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE` | Runtime | `APP_DATABASE_URL` |

**La app nunca se conecta como `postgres`**: el superusuario se salta RLS. La contraseña de
`monkey_app` se asigna aparte, fuera de git. El rol que migra debe ser el mismo siempre (los
`ALTER DEFAULT PRIVILEGES` solo aplican a objetos que él crea) y **superusuario o `BYPASSRLS`**
(las funciones `SECURITY DEFINER` de §5 dependen de eso bajo `FORCE ROW LEVEL SECURITY`).

```dotenv
DATABASE_URL="postgresql://postgres:...@host:5432/monkey"          # solo CLI/deploy
SHADOW_DATABASE_URL="postgresql://postgres:...@host:5432/monkey_shadow"  # solo dev
APP_DATABASE_URL="postgresql://monkey_app:...@host:5432/monkey"    # runtime
CORS_ORIGINS="http://localhost:4200,http://localhost:4201"
```

Retiradas (modelo viejo): `CENTRAL_DATABASE_URL`, `CENTRAL_SHADOW_DATABASE_URL`,
`TENANT_MIGRATION_DATABASE_URL`, `TENANT_MIGRATION_SHADOW_DATABASE_URL`, `POSTGRES_ADMIN_URL`,
`TENANT_DB_HOST`, `TENANT_DB_PORT`, `TENANT_DB_SSL`, `TENANT_DB_ENCRYPTION_KEY` (las cinco últimas
vuelven si se reconstruye el aprovisionamiento `dedicated`).

## 5. RLS

**Patrón** ("falla cerrado": sin tenant fijado no se ve ninguna fila):

```sql
ALTER TABLE <s>.<t> ENABLE ROW LEVEL SECURITY;
ALTER TABLE <s>.<t> FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON <s>.<t>
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
```

**Variables de sesión**, por transacción con `set_config(..., true)` (nunca por conexión: se
filtrarían a otra petición del pool): `app.tenant_id`, `app.user_id`, `app.user_role`. Detalle en
`modelo-datos.md` §4.4.

**Excepciones al patrón:**

1. `organizations` no tiene `tenant_id`: su discriminante es `company_id`.
2. `auditor_assignments`: la política lee `company_id = app.tenant_id OR auditor_user_id =
   app.user_id`, porque un auditor ve sus asignaciones sin importar el tenant activo.
3. `companies` y `access_keys`: el propio tenant **o** `app.user_role = 'admin_monkey'`.
4. `catalog`: `SELECT` libre; `INSERT/UPDATE/DELETE` solo `admin_monkey`. Sin `FORCE`, para que el
   rol dueño (seeds, migraciones) siga pasando. **Toda tabla nueva de `catalog` debe repetir las
   cuatro políticas.**
5. `audit_logs`: lectura del propio tenant o `admin_monkey`; inserción con `tenant_id` nulo o el
   propio. **Se escribe sin `RETURNING`**: un `INSERT … RETURNING` exige que la fila nueva pase
   también la política de lectura, y una acción de plataforma sin tenant no la pasa.
6. `evaluations`: `REVOKE UPDATE, DELETE, TRUNCATE` y `GRANT UPDATE (confirmed_by,
   closure_observation_reason)`: inmutable salvo el cierre humano.

**Búsquedas previas al tenant** (login, canje de clave, refresh, API key): cuatro funciones
`SECURITY DEFINER`, angostas, con `search_path` fijo y `REVOKE … FROM PUBLIC; GRANT EXECUTE … TO
monkey_app`: `platform.find_login_candidates(email)`, `find_access_key(code_hash)`,
`find_session_by_token(refresh_token_hash)` y `find_api_key(key_hash)`. Se llaman con `$queryRaw`
(Prisma no tipa funciones SQL); con el `company_id` que devuelven, la app fija `app.tenant_id` y
sigue con RLS normal. El email es único global (D29), así que el login devuelve a lo sumo un
usuario.

**Columnas denormalizadas por RLS:** `sessions` y `user_control_assignments` llevan `company_id`
propio (el ER solo llegaba a la empresa vía `user_id`), para que la política sea una comparación
simple y no una subconsulta.

**El rol de la app:**

```sql
CREATE ROLE monkey_app LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
GRANT USAGE ON SCHEMA catalog, platform, tenant, audit TO monkey_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA catalog, platform, tenant TO monkey_app;
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA audit TO monkey_app;   -- append-only
REVOKE UPDATE, DELETE, TRUNCATE ON audit.audit_logs, audit.compliance_events FROM monkey_app;
```

## 6. Ubicaciones ambiguas del ER, resueltas

- **`regulations`** → `catalog`: las mismas leyes para todos, sin columna de tenant. El puente
  `organization_regulations` sí es de `tenant` (D10: no se puntúa).
- **`automated_capabilities`, `monitoring_domains`** → `catalog`: catálogos fijos (`ac_01`…`ac_06`).
- **`schedule_rules`** → `tenant`: sus campos (`affected_asset_count`, `next_run_at`) son estado
  vivo por cliente y `admin_empresa` la edita; en catálogo, editarla cambiaría la de todos.
- **`evidence_requirements`** → `tenant`, FK a `catalog.controls` y a `organization_responsibles`
  (el cargo, no la persona; D30).
- **`action_plans`, `risk_treatments`, `residual_risks`** → su responsable apunta a `User`
  (persona), no a `organization_responsibles`, como dibuja el ER.
- **`csocs`, `cuecs`** → no medibles (D11): sin relación hacia `evaluations`, con el comentario
  en el schema.

## 7. Convenciones de migración

- **Una migración por módulo**, en el orden catalog → platform → tenant → audit.
- **Nunca mezclar** un cambio de schema (Prisma) con SQL a mano (RLS, funciones, CHECK) en la misma
  migración: la validación contra la shadow falla porque Prisma aplica el SQL manual antes de
  generar el cambio. Primero `prisma migrate dev` para los `.prisma`; el SQL manual va en otra
  migración, aparte.
- **Una relación hacia un modelo que aún no existe** se agrega cuando se llega a su archivo; nunca
  se deja apuntando a un modelo inexistente (Prisma no compila).
- **Las migraciones ya aplicadas no se editan**: se corrige con una nueva.
- **`contracts/enums.md`** manda sobre `modelo-datos.md` en los valores de enum.
- **Enums:** el estado y su cierre están en `contracts/enums.md` y en D34. Lo único abierto es la
  lista completa de `business_model` (P6).
- **Sin datos:** las migraciones de septiembre asumen tablas vacías (agregan columnas NOT NULL). Si
  un ambiente tiene filas, fallan sin dejar nada a medias: vaciar o escribir un backfill.

## 8. Infraestructura y despliegue

- **Dev:** Postgres 17.10 en un servidor aparte (`135.148.138.36`), no en la VPS.
- **VPS** (`vps-0431ba5c`, usuario `ubuntu`): stacks Docker `minio`, `monkey-dev`, `n8n`,
  `nginx_proxy_manager`, en la red `proxy_net`.
- **Staging:** stack `~/postgres-staging/` (imagen `postgres:17.10`) en `proxy_net`, **sin exponer
  puertos**: solo lo alcanzan otros contenedores por `postgres-staging`. La carpeta `monkey-dev` de la
  VPS cumple hoy el rol de staging: es el destino del deploy automático. No se montó en otro servidor
  ni en un servicio administrado, por simplicidad y costo.
- **CI/CD** (`deploy-dev.yml`, push a `develop`): `scp-action` copia el código y `ssh-action`
  (con `script_stop: true`) escribe el `.env` y corre `docker compose build backend && up -d`. El
  `.env` viaja como secret `ENV_FILE` **en base64, en una sola línea** (`base64 -w0`): con
  `script_stop`, `drone-ssh` inyecta un chequeo de salida entre las líneas de un heredoc y lo
  corrompería.
- **El `.env` de runtime** solo lleva `APP_DATABASE_URL` (no `DATABASE_URL`), más JWT, Wazuh, S3 y
  CORS cuando `auth` y los conectores lo usen.
- **`Dockerfile`:** `prisma.config.ts` exige `DATABASE_URL` al cargarse (con cualquier comando), así
  que el build define un placeholder antes de `prisma generate`. `SHADOW_DATABASE_URL` no hace falta.
- **Staging aplica con `prisma migrate deploy`**, nunca `migrate dev`.

## 9. Lo que sigue pendiente (operativo, no del modelo)

- **Paso de migración en el deploy:** el workflow no corre `migrate deploy`; hoy es manual. El
  runtime instala con `--omit=dev`, no lleva el CLI de Prisma ni `DATABASE_URL`.
- **Seed de arranque:** `npm run bootstrap:admin` crea la `companies` interna de Monkey y el primer
  `admin_monkey` (§11). En dev ya existen; el script es para staging y producción.
- **Resto del catálogo:** sembrado lo que tiene fuente (§11), incluidas `control_dimensions` y `policies` (D39,
  cierra P10), las regulaciones y `automated_capabilities`. Faltan los checks (11.352), las políticas SCA y los
  mapeos, que no necesita el clonado (MD-80).
- **`sslmode=require`** en las tres URLs contra el servidor remoto, y restringir el firewall del 5432.
- **Rotar credenciales** antes de producción: la contraseña de `postgres`, `JWT_SECRET` y
  `WAZUH_API_PASSWORD` se pegaron en texto plano en chats de depuración.
- **Producción:** no alojar el Postgres en el mismo servidor que la app (P7).

## 10. Migraciones, en orden

1 `catalog_frameworks_and_requirements` · 2 `catalog_controls` · 3 `catalog_tests_and_checks` ·
4 `catalog_risks_and_causes` · 5 `catalog_versions` ·
6 `catalog_technical_reference_and_monitoring_domains` · 7 `platform_companies_and_access_keys` ·
8 `platform_users_and_roles` · 9 `tenant_onboarding` · 10 `update_onboarding_enums` ·
11 `tenant_compliance` · 12 `tenant_technical_control` · 13 `audit_logs_and_compliance_events` ·
14 `rls_policies_tenant_and_audit` · 15 `set_database_timezone_utc` ·
16 `platform_add_company_id_to_sessions_and_assignments` · 17 `platform_rls_and_login_lookup` ·
18 `rename_enum_types_to_snake_case` (D26) · 19 `schema_alignment_review` (D27, D28, D32, D33, D34) ·
20 `rls_and_lookup_hardening` (D29, D31) · 21 `catalog_seed_and_client_controls` (D35, D36, D38) · 22 `rls_catalog_seed_and_client_controls` (D36) · 23 `catalog_policies_as_templates` (D39).


La 17 quedó reemplazada en parte por la 20 (`find_login_candidates` se recrea con más columnas).

## 11. Siembra del catálogo maestro de SOC 2

Código, comandos y garantías: `Backend/prisma/seed/README.md`. Por qué se hizo así: D35, D38 y D39.

Excel → JSON versionado (con el sha256 del Excel) → una transacción que **solo inserta lo que falta**,
aborta con diff si una fila existente difiere y no borra nada → `verify` (solo lectura). Cifras (medidas, D38): 1 marco · 5 criterios ·
61 requisitos · 302 puntos de enfoque · 119 controles (118 asignados) · 729 relaciones · 10 riesgos · 56 causas · 92
relaciones riesgo↔causa · 209 aristas causa→control · 61 pruebas · 284 asignaciones control↔prueba · 50
plantillas de evidencia · 89 vínculos · 1 versión = **2.069 filas**. `requirement_relations` queda vacía (las hojas
no traen fuente).

**Dimensiones y políticas (D39, cierra P10):** al mismo pipeline se suman 210 dimensiones por control (derivadas de
las pruebas: aplica si hay una prueba de esa dimensión; el tipo y las banderas salen del tipo de la prueba), 10
políticas (plantillas, solo el nombre) y 16 vínculos = **+236 filas, 2.305 en total**. `policies` pierde
`approval_status`, `valid_until` y `version`: son del cliente.

**Catálogos de referencia** (`npm run reference:load` / `reference:verify`, datos en `prisma/seed/reference/data.ts`):
las 14 regulaciones (MD-75) y las 6 capacidades `ac_01…ac_06` (MD-83), con `provider` interno y confidencial. Las
listas de opciones del Componente 1 (tamaño, industria, modelo de negocio…) **no se siembran: son enums de
Postgres**, no tablas.

**Primer `admin_monkey`** (`npm run bootstrap:admin`): el correo, el nombre y la contraseña llegan por variables de
entorno (`BOOTSTRAP_ADMIN_*`), nunca por argumento; la contraseña cumple §5.3 y se guarda con bcrypt. Idempotente: si
ya hay un `admin_monkey` no hace nada.

Contra un servidor real: `pg_dump` antes, rol dueño (nunca `monkey_app`), dry-run primero y leer el destino
que imprime (el `.env` local apunta a dev), `--apply`, `verify`. Cambiar el catálogo no es recargar: es una
versión nueva (A4/D33).

## 12. El clonado del catálogo (MD-80)

Código: `Backend/src/features/onboarding/` — la regla pura en `domain/clone-plan.ts` (con sus pruebas) y
`application/clone-catalog.service.ts`, que lee, pide el plan y escribe. Reglas y por qué: D40.

`CloneCatalogService.cloneForServiceFramework(tx, serviceFrameworkId)` **recibe el cliente transaccional** y debe
llamarse en la misma transacción que crea la fila de `service_frameworks`, con `app.tenant_id` ya fijado (RLS). El
endpoint del Componente 2 (MD-77) lo llama; hoy no hay controlador.

`npm run clone:verify` lo comprueba contra la base real con el catálogo sembrado, **dentro de una transacción que se
revierte** (incluye una corrida con `SET LOCAL ROLE monkey_app` bajo RLS). No es una prueba de jest: el cliente de
Prisma 7 es ESM y el jest del repo es CommonJS.

> ⚠️ Prisma 7 con `@map`: el enum `ExpectedAvailability` tiene el miembro `h24x7` con valor `24x7`; el tipo generado
> pide `"24x7"` pero el cliente en runtime espera el nombre del miembro (`h24x7`). Tenerlo presente al construir MD-77.
