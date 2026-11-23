# Cómo está implementado el schema

Complementa a `modelo-datos.md` (el **qué**: tablas y relaciones) y a `datos/decisiones/README.md`
(el **por qué**). Este archivo es el **cómo** en el Backend: Prisma, Postgres, RLS, roles,
migraciones y despliegue. Si algo choca con `modelo-datos.md`, gana el modelo. Absorbe la bitácora
"decisiones de la reconstrucción del schema" (septiembre de 2026), que se retiró de `assets/`.

**Estado al 2026-10-07:** 29 migraciones, 58 enums, 76 tablas (medido en `develop`), todas con RLS, ninguna FK sin índice
(salvo las de "quién lo hizo") y ningún `ON DELETE CASCADE`. Probado desde cero en Postgres 17.
(La 24, `service_context_optional_fields_and_regulations`, es la del Componente 2: D45. La 25,
`asset_provisioning_schedule_frequency`, la del Componente 3: D46. La 28, `company_frameworks`, el contrato
de marcos por empresa: D47. Las 26 y 27 son de Héctor: D39 y D41. La 29, `correcciones_onboarding_d50_d51`, las
correcciones del comité: D50 y D51; elimina `service_regulations`: de ahí 76 tablas en lugar de 77.)
**Al 2026-10-02 las 28 primeras estaban aplicadas en la base de dev** (`135.148.138.36`), sembrada con la empresa interna, el
primer `admin_monkey`, las regulaciones, las 6 capacidades y el catálogo de SOC 2 (§9 y §11). **No verifiqué** que la 29 esté
aplicada en dev: la base compartida solo se migra desde `develop` (§7).

---

## 1. Arquitectura

- **Una sola base de datos (`monkey`)** con **4 schemas de Postgres**: `catalog`, `platform`,
  `tenant`, `audit` (D25). Se eliminó el modelo viejo de las carpetas prisma/central + prisma/tenant
  (dos bases, dos configs, dos clientes).
- **RLS sobre `tenant_id`** aísla a los clientes, no bases separadas. El caso `dedicated`
  (D14/D24) sigue siendo una réplica física en otra base, pero su aprovisionamiento **no se ha
  reconstruido** (se borró con `tenant-connection-manager` y `tenant-provisioning.service`).

| Schema | Contenido | RLS |
|---|---|---|
| `catalog` | Catálogo maestro (§3 del modelo) | Lectura libre; escritura solo `admin_monkey` |
| `platform` | Monkey Admin y usuarios | Sí, todas |
| `tenant` | Onboarding, cumplimiento, control técnico | Sí, todas |
| `audit` | `audit_logs`, `compliance_events` | Sí, y `REVOKE UPDATE, DELETE` (append-only); `compliance_events` admite un actor nulo (el sistema, D91) |

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
- **El generador debe llevar `moduleFormat = "cjs"`.** `provider = "prisma-client"` emite por defecto un cliente ESM
  (`import.meta`) y Nest compila a CommonJS: sin esa opción el backend desplegado termina al arrancar
  (`Cannot use 'import.meta' outside a module`) y queda en `Restarting`. Se encontró en staging el 2026-10-01.
- **La `url` vive en `prisma.config.ts`**, no en `schema.prisma`; ahí el `datasource` solo lleva
  `provider` y `schemas`.
- **No hay campo `adapter` en `prisma.config.ts`.** El CLI se conecta directo con `datasource.url`.
  El adapter (`PrismaPg`) se usa **solo en runtime**, dentro de `PrismaService`.
- **UUID:** `@default(uuid())` (lo genera Prisma) en vez de `gen_random_uuid()`: evita depender de
  `pgcrypto`. Un `INSERT` por SQL directo debe traer su `id`; el catálogo se carga con un script
  TypeScript, así que no es problema.
- **`shadowDatabaseUrl` se lee con `process.env`, no con `env()`**: `env()` lanza error si falta la
  variable, y en staging y producción nunca existe (ahí solo `migrate deploy`).
- **Generador:** `provider = "prisma-client"` con **`moduleFormat = "cjs"`** (añadido el 2026-09-30):
  sin él el cliente generado usa `import.meta.url`, compila con `nest build` pero no carga en runtime,
  porque el build de Nest es CommonJS.
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

# Auth (§5.3 del modelo). Tiempos en segundos.
JWT_SECRET="..."                  # 64 bytes aleatorios, distinto por ambiente
JWT_ACCESS_EXPIRES_IN=900         # access token: 15 min
SESSION_IDLE_TIMEOUT=1800         # cierre a los 30 min sin actividad
SESSION_MAX_DURATION=28800        # tope absoluto: 8 h
TOKEN_HASH_PEPPER="..."           # HMAC de refresh tokens, claves de acceso y dispositivos recordados; cambiarlo cierra todas las sesiones y olvida los dispositivos

# Ubicación de los dispositivos recordados (D123). Base GeoLite2-City local: la IP no sale a ningún tercero. La cuenta y la clave de
# MaxMind solo sirven para descargarla y actualizarla (`npm run geoip:update`, cron semanal en la VPS); el archivo no se versiona y en
# la VPS vive en un volumen montado. Sin el archivo, país y ciudad salen null y el login funciona igual.
MAXMIND_ACCOUNT_ID=""
MAXMIND_LICENSE_KEY=""            # secreto; nunca en el repo
GEOIP_DB_PATH="geoip/GeoLite2-City.mmdb"
ACTIVATION_CODE_TTL_HOURS=168       # horas que sirve un código de activación de cuenta (D95, D96). Opcional: 168 (7 días). Aún no la lee nadie: la usará el módulo de equipo al emitir el código

# Correo (D99, D101). Lo usan la clave de acceso y los correos de la contraseña (enlace de recuperación y aviso de cambio). Todos comparten la plantilla de marca
# (`common/mail/brand-email.ts`); el logo (`assets/email-logo.png`, que el Dockerfile copia) viaja INCRUSTADO en el correo (`cid:`), no como una URL: se ve aunque la dirección
# de la app no sea pública (local) y aunque el cliente bloquee imágenes remotas.
MAIL_PROVIDER="log"               # `log` (solo escribe el mensaje en el log; el servidor NO arranca así en producción) o el servicio real
MAIL_API_KEY=""                   # credencial del servicio de correo; obligatoria si MAIL_PROVIDER no es `log`. Nunca en el repo
MAIL_FROM=""                      # remitente, p. ej. «Monkey <no-reply@tu-dominio>»; el dominio debe estar verificado en el servicio
PLATFORM_APP_URL="http://localhost:4200"  # dónde canjea la clave el cliente (Monkey Platform); sin barra final
ADMIN_APP_URL="http://localhost:4201" # dónde abre el enlace de recuperar la contraseña el admin_monkey (Monkey Admin); sin valor usa PLATFORM_APP_URL (D101)

# Componente 3 (D46)
CREDENTIALS_ENCRYPTION_KEY="..."  # 32 bytes en base64 (AES-256-GCM): cifra las credenciales de los sistemas que
                                  # el cliente conecta. OBLIGATORIA (sin ella la app no arranca). Si se pierde o se
                                  # cambia, lo ya cifrado deja de poder leerse. Genérala con
                                  # node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
PROBE_MODE=simulated              # simulated (solo dev/demostración) | unavailable (por defecto). simulated NO arranca en producción

# Almacenamiento de archivos del cliente (Descripción del Sistema, D51). S3 o compatible (minio).
# Sin S3_BUCKET + S3_ACCESS_KEY_ID + S3_SECRET_ACCESS_KEY la app arranca igual y subir un archivo responde 503.
S3_ENDPOINT=...                   # solo con minio (https://<host>); vacío = AWS S3
S3_REGION=us-east-1
S3_BUCKET=...
S3_ACCESS_KEY_ID=... S3_SECRET_ACCESS_KEY=...   # un usuario con permisos SOLO sobre ese bucket
S3_FORCE_PATH_STYLE=true          # true con minio

# Primer administrador (npm run bootstrap:admin), solo donde se siembra
BOOTSTRAP_COMPANY_NAME=... BOOTSTRAP_ADMIN_EMAIL=... BOOTSTRAP_ADMIN_NAME=...
BOOTSTRAP_ADMIN_LAST_NAME=... BOOTSTRAP_ADMIN_PASSWORD=...
```

**Cómo se guardan los secretos que se buscan por igualdad** (`sessions.refresh_token_hash`, y
`access_keys.code_hash`, sobre el código normalizado: sin prefijo `MNK`, guiones ni mayúsculas): **HMAC-SHA256 con `TOKEN_HASH_PEPPER`**, no
bcrypt. La búsqueda previa al tenant (`find_session_by_token`, `find_access_key`) es por igualdad y
bcrypt da una huella distinta cada vez; el pepper impide recalcular las huellas a quien solo lea la
tabla. Las contraseñas sí van con bcrypt (costo 12).

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

**Excepciones al patrón** *(el auditor no es una: su cuenta pertenece a la empresa, D63)*:

1. `organizations` no tiene `tenant_id`: su discriminante es `company_id`.
2. `companies` y `access_keys`: el propio tenant **o** `app.user_role = 'admin_monkey'`.
3. `catalog`: `SELECT` libre; `INSERT/UPDATE/DELETE` solo `admin_monkey`. Sin `FORCE`, para que el
   rol dueño (seeds, migraciones) siga pasando. **Toda tabla nueva de `catalog` debe repetir las
   cuatro políticas.**
4. `audit_logs`: lectura del propio tenant o `admin_monkey`; inserción con `tenant_id` nulo o el
   propio. **Se escribe sin `RETURNING`**: un `INSERT … RETURNING` exige que la fila nueva pase
   también la política de lectura, y una acción de plataforma sin tenant no la pasa. **Se escribe dentro de la transacción de la
   acción** (`insertAuditLog(tx, …)`, D52): el repositorio recibe un `AuditIntent` y, si el rastro falla, la acción se revierte.
5. `evaluations`: `REVOKE UPDATE, DELETE, TRUNCATE` y `GRANT UPDATE (confirmed_by,
   closure_observation_reason)` para la app, y los triggers `evaluations_immutable` (por fila) y
   `evaluations_no_truncate` (por sentencia) para **todos los roles**, también el dueño de la tabla:
   inmutable salvo el cierre humano. El `UPDATE` se compara sin esas dos columnas, así que una
   columna nueva de `evaluations` queda protegida sin tocar el trigger.
6. *(Sin uso desde D96: la evaluación del auditor está en pausa.)* `framework_assessments` (D77, MD-155): `REVOKE UPDATE, DELETE, TRUNCATE` a la app y los triggers
   `framework_assessments_immutable` y `framework_assessments_no_truncate` para todos los roles; un
   `CHECK` impone que quien emite sea el `auditor` con veredicto `certified`/`not_certified` y otro que la justificación no esté vacía. Que el rol sea el de
   quien emite lo comprueba la aplicación (la base no mira otra tabla en un `CHECK`).

7. `user_activation_codes` (D95, D96): patrón normal por `company_id` (el de la cuenta a activar). `code_hash` es HMAC con `TOKEN_HASH_PEPPER`, como `access_keys`.
8. `trusted_devices` (D123): patrón normal por `company_id`, RLS forzada. `token_hash` es HMAC con `TOKEN_HASH_PEPPER`.

**Búsquedas previas al tenant** (login, canje de clave, refresh; `find_api_key` existe pero ningún endpoint autentica aún con API key): cuatro funciones
`SECURITY DEFINER`, angostas, con `search_path` fijo y `REVOKE … FROM PUBLIC; GRANT EXECUTE … TO
monkey_app`: `platform.find_login_candidates(email)`, `find_access_key(code_hash)`,
`find_session_by_token(refresh_token_hash)` y `find_api_key(key_hash)`. Se llaman con `$queryRaw`
(Prisma no tipa funciones SQL); con el `company_id` que devuelven, la app fija `app.tenant_id` y
sigue con RLS normal. El email es único global (D29), así que el login devuelve a lo sumo un
usuario.

**Otras funciones `SECURITY DEFINER` (mismo patrón: angostas, `search_path` fijo, `REVOKE … FROM PUBLIC; GRANT EXECUTE … TO monkey_app`):** `platform.find_mfa_challenge(token_hash)` (D94), `platform.find_activation_code(code_hash)` (D95, D96; antes de conocer el tenant) `platform.find_password_reset_token(token_hash)` (D101; devuelve `id`, `company_id` y `user_id`) y `platform.find_trusted_device(token_hash)` (D123: cerrar sesión sin sesión vigente olvida igual el dispositivo; devuelve solo `id`, `company_id` y `user_id` de uno vigente).

**Columnas denormalizadas por RLS:** `sessions`, `user_groups` y `client_control_assignments` llevan `company_id`
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

**Y para todos los roles, los triggers** `audit.reject_mutation()` (migración 24, D41): `UPDATE`, `DELETE` y `TRUNCATE` sobre
las dos tablas de `audit` fallan también para el dueño. `npm run audit:verify` lo comprueba contra la base real, en una
transacción que se revierte, con el rol dueño y con `monkey_app`.

## 6. Ubicaciones ambiguas del ER, resueltas

- **`regulations`** → `catalog`: las mismas leyes para todos, sin columna de tenant. El puente
  `organization_regulations` sí es de `tenant` (D10: no se puntúa).
- **`automated_capabilities`, `monitoring_domains`** → `catalog`: catálogos fijos (`ac_01`…`ac_06`).
- **`schedule_rules`** → `tenant`: sus campos (`affected_asset_count`, `next_run_at`) son estado
  vivo por cliente y `admin_empresa` la edita; en catálogo, editarla cambiaría la de todos.
- **`evidence_requirements`** → `tenant`, FK a `catalog.controls` y a `organization_responsibles`
  (el cargo, no la persona; D30).
- **`risk_treatments`** → su responsable es un cargo: FK a `organization_responsibles`, no a `User` (D30, MD-123); `created_by` sí apunta a `User`, con `RESTRICT`.
- **`action_plans`, `residual_risks`** → su responsable apunta a `User` (persona), no a `organization_responsibles`, como dibuja el ER (fuera del sprint: MD-151).
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
- **Una migración que mueve datos de una tabla con `FORCE ROW LEVEL SECURITY`** corre como dueña y no vería filas sin tenant: apaga `FORCE` solo dentro de su transacción y lo vuelve a encender al final (la RLS sigue habilitada), y una prueba comprueba el estado final (ejemplos: `20261105000300_responsables_group` y `20261105000400_group_kind`, D104; esta última aborta entera si encuentra equipos duplicados en una empresa sin `admin_empresa` y se puede ejecutar dos veces).
- **Crear una fila con nombre único dentro de una transacción** (p. ej. el grupo «Responsables» del alta): `INSERT … ON CONFLICT (…) DO NOTHING` y releer la fila ganadora. Capturar el `P2002` no sirve dentro de la misma transacción, porque un error de Postgres la deja abortada y no se puede volver a leer.
- **`contracts/enums.md`** manda sobre `modelo-datos.md` en los valores de enum.
- **Enums:** el estado y su cierre están en `contracts/enums.md` y en D34. Lo único abierto es la
  lista completa de `business_model` (D73: son 19 más `other`).
- **Una migración nueva tiene fecha posterior a la última de `develop`.** Antes de abrir el PR, `git pull` de
  `develop`: si trae migraciones más nuevas que la tuya, renombra la carpeta de la tuya a una fecha posterior (solo
  si nadie la aplicó todavía fuera de tu máquina).
- **Dos personas migrando el mismo día no chocan por el nombre** (llevan la hora), sino por el contenido: si las dos
  tocan la misma tabla, quien mergea segundo **rehace su migración** sobre el schema ya actualizado (borra su
  carpeta, `prisma migrate dev` otra vez) en lugar de editar la del otro.
- **La base compartida de dev solo se migra desde `develop`** (después del merge), no desde una rama. Una rama se
  prueba con un Postgres local. Si una rama aplica su migración en la base compartida y luego cambia, la base queda
  con migraciones que el repo no tiene y `migrate dev` de los demás empieza a fallar.
- **Sin datos:** las migraciones de septiembre asumen tablas vacías (agregan columnas NOT NULL). Si
  un ambiente tiene filas, fallan sin dejar nada a medias: vaciar o escribir un backfill.

### Reversa de una migración que salió mal

Prisma **no tiene "deshacer"**: se corrige hacia adelante. Qué hacer según el caso (probado contra un Postgres
desechable, ver §13):

- **Falló al aplicarse en staging.** La migración corre atómica: no deja tablas a medias, queda marcada como fallida en
  `_prisma_migrations` y **bloquea los deploys siguientes** (`P3009`). El deploy se aborta solo y el backend anterior
  sigue corriendo. Se corrige: (1) arreglar el SQL en una migración **nueva**, o quitar la fallida del repo si no hace
  falta; (2) en staging, `prisma migrate resolve --rolled-back <nombre_de_la_fallida>`; (3) volver a desplegar.
- **Se aplicó bien pero hace daño** (borró o cambió algo que no debía). Primero **corregir hacia adelante** con una
  migración nueva que lo repare. Si hubo pérdida de datos, **restaurar el respaldo previo** (el script lo guarda en
  `~/backups/monkey/` antes de cada migración, últimas 14): `pg_restore` a una base nueva, comprobar y reemplazar.
- **Se renombró una migración que staging ya había aplicado** (2026-10-16: `20261016130000_test_display_description` pasó a llamarse `20261016120000_…` después de un deploy). Prisma identifica una
  migración por su **nombre**: ve una nueva, intenta aplicarla otra vez, falla (`P3018`, «la columna ya existe») y deja una fila fallida que **bloquea los deploys siguientes** (`P3009`). Como el
  SQL ya está aplicado, se marca como aplicada sin correrla, en el servidor y con el rol dueño: `docker run --rm --network proxy_net -e DATABASE_URL monkey-backend-tools npx prisma migrate resolve
  --applied <nombre_nuevo>`. La fila con el nombre viejo queda en la base sin carpeta; es inofensiva. **No renombrar una migración después de que `develop` se desplegó**: si dos migraciones comparten el
  prefijo de fecha no pasa nada (se ordenan por nombre completo), así que no hace falta renombrar.
  **Estado al 2026-10-17:** el renombre quedó con el nombre nuevo (`20261016120000_test_display_description`, PR #40) y su carpeta **existe**, así que la fila fallida sigue bloqueando todos los deploys
  (siete seguidos sin que nada llegara a la VPS) hasta que se resuelva **una vez a mano** en el servidor, como arriba: primero comprobar si la columna `catalog.tests.display_description` ya existe; si existe,
  `--applied`; si no, `--rolled-back` (el siguiente deploy la aplica). El paso 2b de `migrate.sh` (`resolve-orphan-migrations.sh`, MD-181) no sustituye eso: solo marca como revertida una fallida cuya
  carpeta **ya no existe** (se borró o se renombró de nuevo); una fallida **con** carpeta no se toca, porque no se puede saber desde el script si su SQL ya está aplicado.
- **Nunca** editar una migración ya aplicada ni borrar filas de `_prisma_migrations` a mano.

## 8. Infraestructura y despliegue

- **Dev:** Postgres 17.10 en un servidor aparte (`135.148.138.36`), no en la VPS.
- **VPS** (`vps-0431ba5c`, usuario `ubuntu`): stacks Docker `minio`, `monkey-dev`, `n8n`,
  `nginx_proxy_manager`, en la red `proxy_net`.
- **Staging:** stack `~/postgres-staging/` (imagen `postgres:17.10`) en `proxy_net`, **sin exponer
  puertos**: solo lo alcanzan otros contenedores por `postgres-staging`. La carpeta `monkey-dev` de la
  VPS cumple hoy el rol de staging: es el destino del deploy automático y el **único** entorno desplegado. No se montó en otro servidor
  ni en un servicio administrado, por simplicidad y costo. **No existe un backend de staging propio** (D86): hay un solo entorno desplegado, y lo que solo tendría sentido con un staging (bucket, cuenta de servicio y `.env` aparte, repetir las pruebas) está congelado hasta que se necesite.
- **CI** (`ci.yml`, PR #17 del Backend): en cada PR a `develop`/`main` levanta un Postgres vacío y corre lint, build, pruebas
  unitarias, migraciones desde cero, carga de catálogos, los verificadores (`catalog`, `reference`, `clone`, `audit`) y las pruebas
  de aislamiento (`npm run test:e2e`, ver [`seguridad/`](../seguridad/README.md)). **No bloquea el merge ni el despliegue** mientras la
  organización no tenga el plan GitHub Team (DT-41).
- **CD** (`deploy-dev.yml`, push a `develop`): `scp-action` copia el código y `ssh-action`
  (con `script_stop: true`) comprueba el entorno, migra y corre `docker compose build backend && up -d`. **Los archivos de entorno (`.env` del backend y
  `runner.env` del trabajador) viven en el servidor** (`~/monkey-dev/`): el despliegue **no los escribe**, así que no hay secretos en base64 que reconvertir al
  añadir una variable (antes, `ENV_FILE`/`RUNNER_ENV_FILE`; los secretos de GitHub ya no se usan). Se editan desde tu máquina con **`npm run env:vps -- backend|runner CLAVE=valor`**
  (`scripts/deploy/vps-env.sh`: cambia la clave por SSH con `set-env.sh`, sin tocar lo demás, y reinicia el servicio) y `Backend/scripts/deploy/check-env.sh` (primer paso del despliegue) detiene el despliegue, **antes de tocar nada**,
  si falta algo: dice qué archivo y qué clave. Con `PROBE_MODE=runner` exige además `RUNNER_TOKEN` igual en los dos archivos, `MONKEY_AWS_PRINCIPAL_ARN` y las llaves del
  trabajador, y rechaza un `runner.env` que traiga secretos del backend (SEG-49).
- **El `.env` de runtime** solo lleva `APP_DATABASE_URL` (no `DATABASE_URL`), más JWT, Wazuh, S3 y
  CORS cuando `auth` y los conectores lo usen. Para la Descripción del Sistema como archivo (D51): `S3_ENDPOINT`, `S3_REGION`,
  `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_FORCE_PATH_STYLE` (con minio, `true`) y `S3_PUBLIC_ENDPOINT` (la dirección que abre el navegador); sin
  bucket la app arranca y subir un archivo responde `503`.
- **El deploy migra solo** (MD-91, D42): antes de levantar el backend nuevo, `backend/scripts/deploy/migrate.sh`
  construye la etapa `build` del Dockerfile (trae el CLI de Prisma y tsx; la imagen de runtime no), **respalda** la
  base con `pg_dump` y corre `prisma migrate deploy` en un contenedor desechable con el rol dueño. Ese rol llega por el
  secret `MIGRATE_DATABASE_URL` y **solo existe en ese paso**: el `.env` del backend sigue llevando únicamente
  `APP_DATABASE_URL`. Si algo falla, el deploy se aborta y el backend anterior sigue corriendo. Después de migrar carga lo que
  falte de los catálogos de checks de nube (`cloud:load`) y de referencia (`reference:load` + `reference:verify`: conexiones,
  integraciones…, MD-211); los dos son idempotentes y, si fallan, avisan sin abortar porque la migración ya quedó aplicada.
- **`Dockerfile`:** `prisma.config.ts` exige `DATABASE_URL` al cargarse (con cualquier comando), así
  que el build define un placeholder antes de `prisma generate`. `SHADOW_DATABASE_URL` no hace falta.
- **Staging aplica con `prisma migrate deploy`**, nunca `migrate dev`.
- **El trabajador del motor de nube** (D57, `Backend/src/runner/`): dos servicios más en el compose, `docker-proxy` (el único que toca el socket de
  Docker, de solo lectura y filtrado por ruta) y `runner` (la misma imagen del backend con otro comando), ambos solo en la red `default` y sin
  puertos publicados. El compose vive versionado en `Backend/deploy/docker-compose.dev.yml` y se copia a `~/monkey-dev/docker-compose.yml`. El
  trabajador recibe un entorno **aparte** (`runner.env`, en el servidor; ejemplo en `Backend/deploy/runner.env.example`), nunca el
  `.env` del backend. El workflow solo lo levanta si el compose ya lo define. Los contenedores del motor corren en la red por defecto de Docker, no
  en la de `monkey-dev`.

- **Almacenamiento privado de archivos** (MD-110: Descripción del Sistema hoy, evidencias con MD-126). Un bucket **privado** por entorno en el `minio` de la VPS; el
  backend sube por la red interna (`S3_ENDPOINT=http://minio:9000`) y entrega el archivo solo con un **enlace firmado de 5 minutos**. Como la firma incluye el host y el
  navegador no resuelve `minio`, los enlaces se firman con `S3_PUBLIC_ENDPOINT` (una dirección pública de MinIO detrás de `nginx_proxy_manager`, que debe pasar el
  encabezado `Host` sin cambiarlo). Para dejarlo listo en un entorno:
  1. En MinIO, crear una **cuenta de servicio limitada al bucket** (no la clave raíz).
  2. `S3_ENDPOINT=… S3_ACCESS_KEY_ID=… S3_SECRET_ACCESS_KEY=… bash backend/scripts/deploy/setup-storage.sh`: crea el bucket, quita cualquier política pública, activa el
     versionado y comprueba que un acceso sin firma responde 401/403. Imprime la línea de `set-env.sh` con las variables.
  3. En `nginx_proxy_manager`: el host público de MinIO (el de `S3_PUBLIC_ENDPOINT`) y, en el host de la API, `client_max_body_size` de al menos 30 MB para que pase una
     subida de 25 MB.
  4. Poner las `S3_*` en `~/monkey-dev/.env` con `set-env.sh`, reiniciar el backend y correr `SMOKE_API_URL=https://<api>/v1 npm run storage:smoke`: sube y baja un archivo
     de 25 MB, comprueba el 401/403 sin firma, que un enlace de 2 segundos vence y que el proxy no responde 413.
  `check-env.sh` **avisa** (no detiene el despliegue) si falta alguna `S3_*`. Hay además una prueba e2e opcional contra un S3 real
  (`test/almacenamiento`, con `S3_TEST_*`) que CI no corre. **Estado (2026-10-17):** los pasos 1 a 4 están hechos en la VPS y `npm run storage:smoke` pasa 7/7 contra el MinIO real. La limpieza de seguridad
  de la VPS (secretos rotados, puertos de MinIO solo en `127.0.0.1`, red de MinIO en su compose, credenciales fuera de los compose y consola restringida) se cerró el 2026-10-17 (MD-179).
  MD-110 queda cerrado; la vista previa incrustada se prueba con la pantalla (MD-178). Los archivos se guardan en el disco de la VPS (75 GB), que comparte con el backend, las bases locales y
  Docker, y **no hay cuota ni alerta**: se vigila a mano con `df -h /` y limpiando imágenes y contenedores de Docker sin uso (la deuda del espacio, DT-76, se cerró el 2026-10-17 tras esa limpieza).

## 9. Lo que sigue pendiente (operativo, no del modelo)

- **Paso de migración en el deploy:** resuelto en MD-91 (§8, §13). El runtime sigue sin llevar el CLI de Prisma ni
  `DATABASE_URL`: la migración corre en un contenedor aparte.
- **Seed de arranque:** `npm run bootstrap:admin` crea la `companies` interna de Monkey y el primer
  `admin_monkey` (§11). En dev ya existen; el script es para staging y producción.
- **Resto del catálogo:** sembrado lo que tiene fuente (§11), incluidas `control_dimensions` y `policies` (D39,
  cierra P10), las regulaciones y `automated_capabilities`. Faltan los checks (11.352), las políticas SCA y los
  mapeos, que no necesita el clonado (MD-80).
  La empresa interna **no es un cliente**: existe porque `users.company_id` es obligatorio; los
  listados de empresas de Monkey Admin deben excluirla.
- **`sslmode=require`** en las tres URLs contra el servidor remoto, y restringir el firewall del 5432.
- **Rotar credenciales** antes de producción: la contraseña de `postgres`, `JWT_SECRET` y
  `WAZUH_API_PASSWORD` se pegaron en texto plano en chats de depuración.
- **Producción:** no alojar el Postgres en el mismo servidor que la app (D72).

## 10. Migraciones, en orden

1 `catalog_frameworks_and_requirements` · 2 `catalog_controls` · 3 `catalog_tests_and_checks` ·
4 `catalog_risks_and_causes` · 5 `catalog_versions` ·
6 `catalog_technical_reference_and_monitoring_domains` · 7 `platform_companies_and_access_keys` ·
8 `platform_users_and_roles` · 9 `tenant_onboarding` · 10 `update_onboarding_enums` ·
11 `tenant_compliance` · 12 `tenant_technical_control` · 13 `audit_logs_and_compliance_events` ·
14 `rls_policies_tenant_and_audit` · 15 `set_database_timezone_utc` ·
16 `platform_add_company_id_to_sessions_and_assignments` · 17 `platform_rls_and_login_lookup` ·
18 `rename_enum_types_to_snake_case` (D26) · 19 `schema_alignment_review` (D27, D28, D32, D33, D34) ·
20 `rls_and_lookup_hardening` (D29, D31) · 21 `platform_sessions_activity_tracking` (`created_at` y
`last_activity_at` en `sessions`, para la política de 30 min / 8 h) · 22 `catalog_seed_and_client_controls`
(D35, D36, D38) · 23 `rls_catalog_seed_and_client_controls` (D36) ·
24 `service_context_optional_fields_and_regulations` (D45) · 25 `asset_provisioning_schedule_frequency` (D46) ·
26 `catalog_policies_as_templates` (D39) · 27 `audit_append_only_triggers` (D41) · 28 `company_frameworks` (D47) · 29 `correcciones_onboarding_d50_d51` (D50, D51) · 30 `cloud_technical_control_model` (D53, D56) · 31 `rls_asset_resources` (D56) · 32 `execution_queue_lifecycle` y 33 `claim_next_execution` (D57) · 34 `cloud_connection_flow` y 35 `claim_execution_by_kind` (D58) · 36 `resource_inventory` y 37 `resource_inventory_warnings` (D59) · 38 `drop_declared_scope` (D60) · 39 `discovered_assets` (D61).

> **Orden por fecha, no por número:** la 25 (`20261001120000`) quedó **antes** de la 26 y la 27 (`20261001180000` y
> `20261001190000`) aunque se escribió en paralelo; ninguna depende de la otra. Prisma las aplica por nombre. Se
> comprobó que la cadena completa se aplica limpia sobre una base vacía (D42, regla 6).


La 17 quedó reemplazada en parte por la 20 (`find_login_candidates` se recrea con más columnas).

## 11. Siembra del catálogo maestro de SOC 2

Código, comandos y garantías: `Backend/prisma/seed/README.md`. Por qué se hizo así: D35, D38 y D39.

> VF18 (D128): estas cifras son las del catálogo v1 construido; el v2 las reemplaza (D129).

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
las 18 normas de protección de datos (MD-75, D51), los 6 marcos ofrecidos sin catálogo (D50) y las 6 capacidades `ac_01…ac_06` (MD-83), con `provider` interno y confidencial. Las
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
revierte** (incluye una corrida con `SET LOCAL ROLE monkey_app` bajo RLS). No es una prueba de jest. (Las pruebas de
`Backend/test/` sí cargan el cliente de Prisma 7 con jest: el cliente generado carga su motor con `import()` dinámico y por eso
`npm run test:e2e` corre con `node --experimental-vm-modules`.)

> ⚠️ Prisma 7 con `@map`: el enum `ExpectedAvailability` tiene el miembro `h24x7` con valor `24x7`; el tipo generado
> pide `"24x7"` pero el cliente en runtime espera el nombre del miembro (`h24x7`). Tenerlo presente al construir MD-77.

## 13. Primer arranque de staging y migración automática (MD-91)

`postgres-staging` (imagen `postgres:17.10`, red `proxy_net`, sin puertos expuestos) se creó con la base `monkey` **vacía**
y solo el rol `postgres`: sin schemas, sin tablas y sin el rol `monkey_app`. Hasta que se prepare, el backend desplegado
no puede arrancar (queda en bucle de reinicios).

**Qué se probó** (contra un Postgres 17 desechable, con la misma imagen de herramientas, y luego se borró todo): desde una
base vacía las migraciones se aplican completas; con una migración mala el script **falla, deja el respaldo y avisa**, y
una migración fallida bloquea los deploys hasta resolverla; el respaldo se restaura y trae los datos; el arranque
completo (rol, catálogo, referencia, `admin_monkey`) deja las comprobaciones `catalog:verify`, `reference:verify`,
`clone:verify` y `audit:verify` en verde con el rol `monkey_app`. **No se probó en la VPS ni en GitHub Actions.**

**Una sola vez, para dejar staging listo** (en la VPS, desde `~/monkey-dev/backend`; las claves se piden por variable, no
se escriben en el historial):

1. **Secret de GitHub `MIGRATE_DATABASE_URL`** = `postgresql://postgres:<clave>@postgres-staging:5432/monkey` (la clave sin
   caracteres especiales, o codificada como URL; sin `?sslmode=require`: es la red interna de Docker). Con `gh`:
   `gh secret set MIGRATE_DATABASE_URL -R Monkey-GRC/Backend`.
2. **El primer deploy a `develop` con el paso de migración.** Crea los schemas y el rol `monkey_app`, que nace **sin
   contraseña**. El backend sigue reiniciando hasta el paso siguiente.
3. **`bash scripts/deploy/bootstrap-staging.sh`** en la VPS (desde `~/monkey-dev/backend`), **una sola vez**. Pide las
   claves sin mostrarlas y hace: contraseña de `monkey_app`, catálogo de SOC 2 y de referencia, primer `admin_monkey` y
   verificación con `monkey_app`. Las claves solo pueden llevar letras, números y `. _ ~ -`. Es repetible. Probado contra
   un Postgres desechable. Al final imprime la línea `APP_DATABASE_URL` que debe ir en el `.env` del servidor.
4. **Poner esa `APP_DATABASE_URL`** con `set-env.sh` y **redesplegar el backend**.

Desde ahí, cada push a `develop` migra solo. Los respaldos previos quedan en `~/backups/monkey/` (últimos 14).
