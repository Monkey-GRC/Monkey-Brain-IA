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
PostgreSQL, `class-validator`, `@nestjs/swagger` (`/v1/docs`, **solo local** con `API_DOCS_ENABLED=true`; SEG-62), `nestjs-i18n` (`/i18n/{en,es}`), Jest +
supertest, ESLint 9 + Prettier. Versiones exactas: `package.json`.

- **Roles:** cuatro activos (`admin_monkey`, `admin_empresa`, `funcional`, `auditor`; D96); el enum de la base conserva `consultor` **sin uso** y no hay roles personalizados. El `admin_empresa` es el experto en compliance y valida; el `funcional` ejecuta lo de su dimensión (responsable por dimensión, `users-team.md`); el auditor pertenece a su empresa y revisa sin calificar (D63, D96).
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
| Infrastructure | `infrastructure/` | Repositorios Prisma (siempre con `prisma.withScope`) y adaptadores como el almacenamiento S3 / minio (`infrastructure/storage`, variables `S3_*`; ver `schema-implementacion.md` §8). |
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
| `auth` | Login, refresh, logout, `me`, activación de cuenta en dos pasos, segundo factor (D94), activación de las cuentas que crea el administrador con un código de un solo uso (D95, D96). **Feature de referencia** (4 capas completas). | `contracts/modules/auth.md` · `users-team.md` · D43, D51, D94, D95, D96 |
| `companies` | Registro de empresas por `admin_monkey`; marcos contratados; clave de acceso de un solo uso. | `contracts/modules/monkey-admin.md` · D47, D50 |
| `users` | *(D96, sin construir)* El equipo de la empresa: el `admin_empresa` invita a `funcional` y `auditor`, edita y desactiva sus cuentas, y reparte el trabajo por dimensión (`service_dimension_owners`, `user_control_assignments`). | `contracts/modules/users-team.md` · D96 · MD-131, MD-132, MD-134, MD-158 |
| `catalogs` | Opciones de los formularios con etiqueta según `Accept-Language`. Valores en `src/common/catalogs/onboarding-catalogs.ts`; solo regulaciones y marcos salen de la base. | `contracts/enums.md` |
| `onboarding` | Componente 1 (contexto organizacional) y derivación del avance para `me`. | `contracts/modules/onboarding-organizational-context.md` · D44 |
| `services` | Componente 2 (contexto del servicio). **Crear o ampliar un servicio clona el catálogo del marco en la misma transacción** (`CloneCatalogService`). | `contracts/modules/onboarding-service-context.md` · D40, D45, D51 |
| `compliance` | **Motor de evaluación** (`domain/engine/`, funciones puras, sin base de datos): estado de un test, un control, una categoría y un marco, y el semáforo de un activo (§9, D68). Con él, los controles: `GET /v1/services/:id/controls` y `GET /v1/controls/:id` (vista de negocio y técnica), `POST /v1/services/:id/controls` (control propio) y `PATCH`/`DELETE /v1/controls/:id` (editar y dar de baja, directo); `/v1/responsibles` (cargos responsables); y riesgos y causas con sus vínculos (`/v1/services/:id/risks`, `/v1/risks/:id`, `/v1/services/:id/causes`, `/v1/causes/:id`), con la evaluación 5×5 y el tratamiento de un riesgo (`POST /v1/risks/:id/evaluation`, `GET …/evaluation-history`, `POST`/`GET …/treatments`). y las exclusiones de un activo en un test (`GET`/`POST /v1/services/:id/exclusions`, MD-144; nacen aprobadas, D96); y las evidencias de un control: `GET /v1/controls/:id/evidence`, `POST`/`GET /v1/evidence-requirements/:id/submissions` (archivo con su huella SHA-256 y versión, que nunca pisa la anterior) y `GET /v1/evidence-submissions/:id/download` (enlace firmado de 5 minutos, MD-126). La **revisión de la evidencia** (`PUT /v1/evidence-submissions/:id/review`, MD-127) la hace solo el `admin_empresa`, en una sola revisión por entrega (`evidence_reviews`, D96); el `funcional` y el auditor la leen; y `POST /v1/controls/:id/tests/:testId/evidence` sube la evidencia de **una prueba documental en un solo paso** (crea el lugar de esa prueba en la primera entrega, D88). **El estado de una prueba documental sale, por control, de lo entregado para esa prueba** (`control-readout.ts`). **El veredicto de una prueba manual que no es documental** (`POST`/`GET /v1/controls/:id/tests/:testId/verdicts`, solo el `admin_empresa` da; MD-155) deja una evaluación inmutable por control del servicio que lleva la prueba y por activo de su dimensión. **Las evaluaciones del consultor y del auditor** (`/assessments`, `framework_assessments`, MD-155) se retiraron con D96; la tabla queda sin uso. **Todo cambio de estado de un control deja un evento** `control.state` en `compliance_events`, escrito en la misma transacción por el veredicto, la entrega y la revisión de evidencia, aprobar una exclusión y la sonda (`control-state-events.ts`, D91). Las **evaluaciones** son inmutables para todos los roles de la base (triggers, `SEG-38`). El resto de Cumplimiento (observaciones, exclusión de un check…) no está construido. | `contracts/modules/compliance-controls.md` · `modelo-datos.md` §9 · MD-117, MD-123, MD-126, MD-127, MD-138, MD-139, MD-144, MD-145, MD-155 · `compliance-evidence.md` · `compliance-audit.md` · `compliance-overview.md` · D88, D91 · DT-50, DT-71, DT-76, DT-79, DT-80 |
| `technical-control` | Componente 3: catálogo de conexiones, activos, comprobar → activar → programar. La **sonda** es un puerto (`ConnectionProbe`) con adaptadores `simulated` y `unavailable` (`PROBE_MODE`); el proveedor del motor nunca sale. El paso 3 es **provisional** para servidores y bases. Qué conexiones, plataformas, canales, regiones, frecuencias y tipo de activo ofrece cada escenario sale de la **base** (`catalog.*`, D67), no del código. | `contracts/modules/onboarding-technical-control.md`, `control-tecnico-operacion.md` · D46, D48, D67 · DT-32…DT-36 · D71 |

> **D96 (2026-10-28).** `compliance` ya no tiene consultor: el `admin_empresa` revisa la evidencia, da el veredicto, crea las exclusiones (nacen aprobadas) y edita o da de baja los controles directo (`PATCH`/`DELETE /v1/controls/{id}`). Se retiraron las evaluaciones del servicio (`/assessments`) y las propuestas de cambio (`/controls/{id}/changes`); sus tablas quedan sin uso. Falta filtrar por responsable de dimensión (B67, `users-team.md`): hoy el `funcional` ve lo asignado por control.

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
