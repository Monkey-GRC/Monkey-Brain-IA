---
id: backend-context
name: Monkey Backend - convenciones y mapa de features
description: Convenciones, arquitectura por capas y mapa de features del repo Backend (NestJS). Lo estable; el estado fino se lee del código.
type: context
---

# Monkey Backend

> Describe el código tal como está, no el diseño objetivo. El plan vigente es
> `skills/product/monkey-compliance-council/references/datos/modelo-datos.md`.
> Aquí no van conteos, versiones menores, números de PR ni fechas: eso se lee del código y de git.

**Rutas.** Las rutas de código (`src/...`, `prisma/...`, `i18n/...`) son relativas a la raíz del repo
`Backend`, carpeta hermana de `Monkey-Brain-IA`.

## Dominio y aislamiento

Compliance continuo: mide el cumplimiento de un cliente frente a los marcos que contrató (MVP: solo
SOC 2) sobre sus servicios y activos. Modelo completo en `modelo-datos.md`; implementación (Prisma 7,
RLS, roles, migraciones, `.env`) en `schema-implementacion.md`.

**Multi-tenant (D25).** Una base con cuatro schemas de Postgres (`catalog`, `platform`, `tenant`,
`audit`); los clientes se aíslan por Row-Level Security sobre `tenant_id`/`company_id`. La app se
conecta como `monkey_app` (sin superusuario ni `BYPASSRLS`) y fija el tenant por transacción. La base
dedicada por cliente no está construida y el registro la rechaza (`DEDICATED_DATABASE_NOT_AVAILABLE`,
`contracts/modules/monkey-admin.md`).

## Stack

NestJS (Express), TypeScript, Prisma 7 (`prisma-client`, `moduleFormat = "cjs"`, `@prisma/adapter-pg`),
PostgreSQL, `class-validator`, `@nestjs/swagger` (`/v1/docs`), `nestjs-i18n` (`/i18n/{en,es}`), Jest +
supertest, ESLint 9 + Prettier. Versiones exactas: `package.json`.

- **Auth:** access token JWT HS256 de corta vida + refresh token opaco rotado, ambos en cookies
  httpOnly; contraseñas con bcrypt. Detalle y límites en `contracts/modules/auth.md`.
- **Pruebas:** unitarias (`*.spec.ts`), verificadores contra la base (`catalog:verify`,
  `clone:verify`, `audit:verify`) y aislamiento entre empresas en `test/` (`npm run test:e2e`).
  Estado y cobertura real en `seguridad/requisitos.md`.
- **CI/CD:** `ci.yml` (lint, build, pruebas y verificadores en cada PR) y `deploy-dev.yml` (migra solo
  antes de levantar, con respaldo previo, D42). Limitación vigente: DT-41.

## Arquitectura

Clean Architecture + feature-based. Cada feature en `src/features/<nombre>/`:

| Capa | Carpeta | Responsabilidad |
|------|---------|-----------------|
| Domain | `domain/` | Entidades, repositorios abstractos y puertos. Cero dependencias externas. |
| Application | `application/` | Casos de uso y DTOs. No sabe de HTTP ni de Prisma. Lanza `DomainError`. |
| Infrastructure | `infrastructure/` | Repositorios Prisma (siempre con `prisma.withScope`). |
| Presentation | `presentation/` | Controladores HTTP y mappers al JSON del contrato. |

Dependencias: `Presentation → Application → Domain` e `Infrastructure → Domain`.

Lo transversal vive fuera de las features: `src/common/` (sobre `ResponseDto`, `DomainError`, filtro
global de excepciones, paginación, decoradores `@Public`/`@Roles`/`@CurrentUser`, `RolesGuard`,
`TenantScope`, `Principal`, puertos como `TokenHasher` y `AuditLogWriter`) y `src/infrastructure/`
(`PrismaService`, writer de `audit_logs`, HMAC de tokens).

## Mapa de features

Una línea por feature: para qué sirve y dónde está su contrato. Si el código y esta lista difieren,
manda el código y se corrige esta lista.

| Feature | Qué hace | Contrato / decisión |
|---|---|---|
| `auth` | Login, refresh, logout, `me`, activación de cuenta en dos pasos. **Feature de referencia** (4 capas completas). | `contracts/modules/auth.md` · D43, D51 |
| `companies` | Registro de empresas por `admin_monkey`; marcos contratados; clave de acceso de un solo uso. | `contracts/modules/monkey-admin.md` · D47, D50 |
| `catalogs` | Opciones de los formularios con etiqueta según `Accept-Language`. Valores en `src/common/catalogs/onboarding-catalogs.ts`; solo regulaciones y marcos salen de la base. | `contracts/enums.md` |
| `onboarding` | Componente 1 (contexto organizacional) y derivación del avance para `me`. | `contracts/modules/onboarding-organizational-context.md` · D44 |
| `services` | Componente 2 (contexto del servicio). **Crear o ampliar un servicio clona el catálogo del marco en la misma transacción** (`CloneCatalogService`). | `contracts/modules/onboarding-service-context.md` · D40, D45, D51 |
| `technical-control` | Componente 3: escenario de despliegue, activos, comprobar → activar → programar. La **sonda** es un puerto (`ConnectionProbe`) con adaptadores `simulated` y `unavailable` (`PROBE_MODE`); el proveedor del motor nunca sale. El paso 3 es **provisional**. | `contracts/modules/onboarding-technical-control.md`, `control-tecnico-operacion.md` · D46, D48 · DT-31…DT-36 · P12 |

**Siembra** (no existe `prisma db seed`): `npm run bootstrap:admin` (empresa interna de Monkey y
primer `admin_monkey` desde `BOOTSTRAP_*`), `npm run reference:load` (regulaciones, marcos ofrecidos,
capacidades automatizadas; idempotente; `reference:verify` solo compara) y `catalog:load` (catálogo SOC 2).

## Convenciones clave

- Respuestas con `ResponseDto` (`{ statusCode, message, data }`), `message` traducido según
  `Accept-Language`. Errores con el mismo sobre más `error.code` (`contracts/conventions.md`), vía
  `src/common/filters/http-exception.filter.ts`.
- Todo endpoint exige sesión por defecto; `@Public()` lo abre y `@Roles(...)` restringe por rol. El
  usuario llega con `@CurrentUser()` (`Principal`), con el rol leído de la base, no del token.
- Acceso a datos por `PrismaService` con `APP_DATABASE_URL`. **Toda consulta a una tabla con RLS va
  dentro de `withScope(scope, tx => …)`**. Las búsquedas previas al tenant (login, canje, refresh)
  usan las funciones `SECURITY DEFINER` de `platform` con `$queryRaw`.
- Schema en `prisma/schema/<catalog|platform|tenant|audit>/*.prisma`, un solo `prisma.config.ts`.
  Migrar con `npx prisma migrate dev` (dev) o `migrate deploy` (staging/prod); ver
  `skills/backend/add-prisma-model.md`.
- **Auditoría atómica (D52, SEG-36):** todo método de repositorio que cambia datos recibe un
  `AuditIntent` que el caso de uso construye y el repositorio escribe con `insertAuditLog(tx, …)` en
  la misma transacción. Si el rastro falla, la acción se revierte. `AuditLogWriter.write` queda solo
  para intentos fallidos.
- Inversión de dependencias con clases abstractas: cada `*.module.ts` registra
  `provide: XRepository, useClass: XPrismaRepository`.
- Tipos en firmas decoradas con `import type` (`isolatedModules` + `emitDecoratorMetadata`).

## Qué NO hacer

- No importar Prisma ni decoradores de Nest dentro de `domain/`.
- No consultar tablas con RLS fuera de `withScope`, ni conectar la app como `postgres`.
- No importar el interior de una feature desde otra: lo compartido va a `common/` o `infrastructure/`.
- No crear un schema Prisma monolítico; usar el archivo del dominio correspondiente.
- No saltarse capas (p. ej. controller llamando directo al repositorio Prisma).
