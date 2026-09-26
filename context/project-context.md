---
id: project-context
name: Monkey - Contexto de Proyecto (Backend, Frontend y Frontend-Platform)
description: Resumen de dominio, stack tecnico, arquitectura y convenciones de los repos de codigo de Monkey. Describe el estado ACTUAL del codigo, no el modelo objetivo.
type: context
---

# Monkey Backend

> ⚠️ **Este archivo describe el código tal como está hoy, no el diseño objetivo.** El plan
> vigente es `skills/product/monkey-compliance-council/references/modelo-datos.md`: el schema
> actual se está rehaciendo y varias entidades de aquí quedan derogadas por él (ver `CLAUDE.md`).

> **Convención de rutas**: este folder (`Monkey-Brain-IA`) vive como repo
> independiente, separado del código de producto. Todas las rutas de código
> mencionadas aquí y en `skills/backend/`/`skills/frontend/` (`src/...`,
> `prisma/...`, `i18n/...`, `package.json`, etc.) son relativas a la **raíz
> del repo correspondiente**, no a esta carpeta. Los repos del producto son
> `Monkey-GRC/Backend`, `Monkey-GRC/Frontend` (admin interno),
> `Monkey-GRC/Frontend-Platform` (plataforma del cliente final) y
> `monkey-cis-sync` (scripts Python que sincronizan el catálogo de checks desde Wazuh; hoy
> no está versionado como repo git). Al usar
> este contexto, colócalos como carpetas hermanas de `Monkey-Brain-IA` dentro
> de un mismo directorio, o ajusta las rutas según dónde los hayas descargado.

## Dominio

Plataforma de **compliance continuo**: mide qué porcentaje de cumplimiento
tiene un cliente frente a los marcos que contrató (SOC 2, ISO 27001…), sobre
los servicios que quiere certificar y los activos de su infraestructura
(servidores, bases de datos, aplicaciones, nube) más su documentación.
Wazuh es el motor de monitoreo/evidencia técnica.

El modelo de dominio completo (entidades, relaciones, cardinalidades,
dimensiones, tests, evidencias, exclusiones y cálculo del cumplimiento) está
en `skills/product/monkey-compliance-council/references/modelo-datos.md`.
Leerlo antes de tocar el schema.

**Multi-tenant.** Hoy el código implementa **una base de datos física por cliente**, con dos
proyectos Prisma separados: `prisma/central/schema/` (catálogo maestro, registro de clientes) y
`prisma/tenant/schema/` (el escenario de cada cliente).

> ⚠️ **La decisión D25 deroga ese diseño para el MVP**: una sola base con el catálogo y los
> datos de todos los tenants, aislados por Row-Level Security sobre `tenant_id`, y la base
> dedicada como excepción que elige `admin_monkey` al crear la empresa. Lo de arriba es el
> punto de partida que se está rehaciendo, no la meta. Ver `modelo-datos-decisiones.md` D25 y
> `modelo-datos.md` §4.3.

Entidades que existen hoy en el schema (⚠️ varias las deroga `modelo-datos.md`):
- Central: `Client`, `TenantIdentifierDirectory`, `CisCheckTranslation`
- En ambos: `Risk` (con `RiskLevel`), `Reason`, `RiskReason`, `ReasonControl`, `Control`,
  `ControlDimensionRequirement` (las 5 dimensiones), `ControlCheck`, `ManualCheckItem` +
  `ManualCheckEvidence`, `Asset`, `User` (con `Role`)
- Solo tenant: `CompanyProfile`

`template.prisma` y `model Template` **ya no existen**: se eliminaron en `f7ed77f` con el
modelo viejo. El encadenamiento `Template → Risk → Reason → Control` desaparece del modelo
nuevo (`modelo-datos.md` §3.2): el control es atómico y se vincula a puntos de enfoque.

## Stack técnico

- **Framework:** NestJS 11 (Express platform), TypeScript 5.7
- **ORM/DB:** Prisma 7 (`@prisma/adapter-pg`, `@prisma/adapter-planetscale`), PostgreSQL
- **Auth:** `@nestjs/jwt` + `@nestjs/passport` (`passport-jwt`), JWT vía cookies (`cookie-parser`), hashing con `bcrypt`
- **Validación/Docs:** `class-validator`, `class-transformer`, `@nestjs/swagger`
- **i18n:** `nestjs-i18n`, locales en `/i18n/en` y `/i18n/es`
- **Tests:** Jest + ts-jest + supertest
- **Lint/Format:** ESLint 9 (flat config) + Prettier (`singleQuote`, `trailingComma: all`)
- **CI/CD:** GitHub Actions — build de imagen Docker y despliegue al VPS de dev

## Arquitectura

Clean Architecture + Feature-Based. Cada feature vive en `src/features/<nombre>/`
con hasta 4 capas:

| Capa | Carpeta | Responsabilidad |
|------|---------|-----------------|
| Domain | `domain/` | Entidades y interfaces de repositorio. Cero dependencias externas. |
| Application | `application/` | Casos de uso y DTOs. No sabe de HTTP ni Prisma. |
| Infrastructure | `infrastructure/` | Implementaciones concretas (repos Prisma, estrategias auth). |
| Presentation | `presentation/` | Controladores HTTP. Delega a los casos de uso. |

**Regla de dependencias (no violar):**
```
Presentation → Application → Domain
Infrastructure → Domain
```

### Estado actual de features

Features en `src/features/`: `asset`, `auth`, `checklist`, `client`, `control`,
`manual-check`, `reason`, `risk`, `translation`, `user`.

`dashboard`, `onboarding` y `template` **fueron eliminadas** en `f7ed77f` junto con el modelo
viejo, con su `compliance.calculator.ts`. El onboarding se reconstruye desde cero (épicos
MD-57 a MD-61).

- `risk`: 4 capas completas — **feature de referencia**, úsala como plantilla.
- `auth`: 3 capas (application, infrastructure, presentation) — sin domain propio.
- `reason`: tiene las 4 capas, pero conserva un `application/reason.service.ts` heredado y su
  carpeta es `application/use-case/` (singular) en vez de `use-cases/`. Deuda menor.
- `checklist`: expone el catálogo de checks CIS; lee de la base que alimenta
  `monkey-cis-sync`, no de la API de Wazuh directamente.
- `client`: registro de tenants. El aprovisionamiento en sí **no es una feature**: vive en
  `src/infrastructure/tenancy/` (`tenant-provisioning.service.ts`,
  `tenant-connection-manager.service.ts`, `tenant-prisma-client.factory.ts`), y usa
  `POSTGRES_ADMIN_URL` para `CREATE ROLE`/`CREATE DATABASE`.
- Evidencias: `src/infrastructure/storage/` (S3/MinIO, `@aws-sdk/client-s3`), que consume
  `manual-check`.

## Convenciones clave

- Respuestas HTTP estandarizadas con `ResponseDto` (`{ statusCode, message, data }`),
  en `src/common/dtos/response.dto.ts`.
- Errores manejados globalmente por `src/common/filters/http-exception.filter.ts`,
  con mensajes traducidos vía i18n (`/i18n/en`, `/i18n/es`).
- Guard de auth: `@UseGuards(AuthGuard('jwt'))` + `@ApiCookieAuth()` en controladores;
  el id de usuario se lee de `req.user.id`.
- Prisma usa **dos proyectos separados**, cada uno con schema multi-archivo (uno
  por dominio) y su propio config en la raíz (estilo Prisma 7):
  `prisma/central/schema/*.prisma` + `prisma.config.central.ts` (catálogo maestro
  y registro de clientes) y `prisma/tenant/schema/*.prisma` +
  `prisma.config.tenant.ts` (base de cada cliente). Un cambio que aplique a los dos hay que
  hacerlo en ambos y migrar por separado, con `npm run prisma:migrate:central` /
  `prisma:migrate:tenant` — `npx prisma migrate dev` a secas no resuelve ningún schema.
- Acceso a datos: `CentralPrismaService` (`src/infrastructure/database/central-prisma.service.ts`)
  para la base central; `TenantConnectionManagerService` para la de cada cliente. **No existe
  una clase `PrismaService`.** Excepción: `checklist` usa `pg` directo contra `prueba_wazuh`.
- Guards y decoradores adicionales en `src/common/`: `roles.guard.ts`,
  `client-credentials.guard.ts`, `roles.decorator.ts`, `user-context.interceptor.ts`.
- **No hay tests**: no existe ni un `*.spec.ts` en `src/`, ni `test/jest-e2e.json`.
- Inversión de dependencias vía tokens abstractos: cada `*.module.ts` registra
  `provide: XRepository, useClass: XPrismaRepository`.

## Qué NO hacer (backend)

- No importar Prisma ni decoradores de Nest dentro de `domain/`.
- No crear un schema Prisma monolítico; usar el archivo del dominio correspondiente
  en `prisma/central/schema/` o `prisma/tenant/schema/`, según a cuál aplique.
- No saltarse capas (p. ej. controller llamando directo al repositorio Prisma).

---

# Monkey Frontend

## Las dos plataformas

Son **dos aplicaciones Angular distintas**, con públicos y propósitos separados.
Ambas consumen el mismo backend y comparten la base del stack, pero **no son gemelas**: su
estructura interna diverge (ver la tabla). Una función del cliente final no va en el admin, ni
al revés.

| | `Frontend` (admin) | `Frontend-Platform` (plataforma) |
|---|---|---|
| Para quién | Equipo interno de Monkey | El cliente final |
| Para qué | Administración de la plataforma: creación y gestión de tenants, usuarios, y el catálogo maestro GRC (marcos, riesgos, causas, controles) | Que el cliente descubra y declare sus servicios y activos, y vea su estado de cumplimiento |
| Features hoy | `auth`, `common`, `users` | `assets`, `auth` |
| Estructura de feature | `models/` + `services/` + `presentation/` | `domain/` + `presentation/` |
| `core/` y `shared/` | `core/{guards,interceptors,services}`, `shared/models` | `core/domain/*`, `shared/domain/*` |
| `ApiResponse<T>` | `@shared/models/api-response.model` | `@shared/domain/models/api-response.model` |
| i18n | ngx-translate + `public/i18n/{en,es}` | **no instalada** |
| Interceptores | `auth`, `error-handler` | `credentials`, `tenant-credentials`; sin manejo global de errores |
| Syncfusion | sí | no |

`grc-framework` y `clients` se eliminaron del admin en `acbd907`; `onboarding`, `templates` y
`dashboard` se eliminaron de la plataforma en `f70a556`/`b6bb7ca`. Todas pertenecían al modelo
viejo.

**El onboarding de `Frontend-Platform` es donde se hace el descubrimiento**: el cliente declara
su empresa, sus servicios, su scope y los activos que entran en la evaluación, y elige los
marcos que contrata por servicio. Es la puerta de entrada de los datos que alimentan todo el
modelo — ver `references/modulos/onboarding.md` y `contracts/modules/`.

⚠️ **Esa feature no existe hoy**: se eliminó con el modelo viejo y se reconstruye en los
épicos MD-59 a MD-61.

## Dominio

Consola web sobre el mismo dominio del backend: TailAdmin Angular (template
open-source de admin dashboard) reutilizado como UI de Monkey — consistente con
el backend y con `monkey-compliance-council`.

## Stack técnico

- **Framework:** Angular 20+, TypeScript 5.8 estricto, **standalone
  components** (sin NgModules).
- **UI:** TailAdmin (Tailwind CSS v4 vía `@tailwindcss/postcss`) + `material-symbols` en las
  dos. **Syncfusion (`@syncfusion/ej2-angular-*`) solo en `Frontend`**, no en la plataforma.
- **i18n:** solo en `Frontend`: `@ngx-translate/core` + `ngx-translate-multi-http-loader`, JSON
  en `public/i18n/{en,es}/*.json` cargado vía `HttpBackend` (sin pasar por interceptors).
  **`Frontend-Platform` no tiene i18n instalada**, así que las reglas de traducción obligatoria
  no aplican ahí hasta que se instale.
- **Estado:** sin librería (no NgRx/Akita/signals store) — servicios
  `providedIn: 'root'` con estado local.
- **Auth:** cookie httpOnly (`withCredentials: true`), sin manejo manual de
  tokens en JS; `Accept-Language` inyectado desde `localStorage('lang')`.

## Arquitectura

`core/` + `shared/` + `features/<nombre>/` + `config/`. La tabla describe `Frontend`;
`Frontend-Platform` intercala un nivel `domain/`/`presentation/` (ver la tabla comparativa
arriba):

| Carpeta | Responsabilidad |
|---------|-----------------|
| `core/` | Guards, interceptors, servicios de shell (modal, sidebar, theme), layout/shell components. Nunca depende de `features/`. |
| `shared/` | Modelos y componentes reutilizables entre features (`ApiResponse<T>`, dialog, loader). Nunca depende de `features/`. |
| `features/<nombre>/` | `models/` + `services/` + `presentation/{views,components}`. No se importa una feature desde otra directamente. |
| `config/` | `environments/environment.ts` (`apiUrl`, hoy `http://localhost:3000/v1`), `navigation.config.ts`, y `syncfusion-locale.config.ts` solo en `Frontend`. |

### Estado actual de features

Ver la tabla de "Las dos plataformas" arriba para qué feature vive en cuál repo.

- `Frontend` · `grc-framework` / `risks`: **feature de referencia** (form, list,
  kpis, matriz). Úsala como plantilla para las demás.
- `Frontend` · `clients`, `users`: gestión de tenants y de usuarios internos.
- `Frontend-Platform` · `onboarding`: el flujo de descubrimiento, en pasos
  (`account-setup`, `characterization`, `company-profile`, `template-selection`).
  Es donde entran los datos que alimentan el modelo — cualquier campo nuevo del
  scope o de los activos se capta aquí.
- `Frontend-Platform` · `dashboard`: el estado de cumplimiento que ve el cliente.
  Aplica `philosophy.md`: readiness cualitativo primero, el % nunca solo.

## Convenciones clave

- Componentes standalone + `loadComponent()` lazy-loading en `app.routes.ts`.
- Path aliases: `@core/*`, `@features/*`, `@shared/*`, `@config/*`,
  `@environments/*` — no rutas relativas largas.
- Llamadas al backend: `HttpClient` + `environment.apiUrl` + `ApiResponse<T>`
  (`shared/models/api-response.model.ts`) — ver
  `skills/frontend/call-backend-api.md`.
- Auth/errores ya interceptados globalmente
  (`core/interceptors/auth.interceptor.ts`,
  `core/interceptors/error-handler.interceptor.ts`) — un servicio de feature
  no los reimplementa.
- Traducciones: toda cadena visible al usuario pasa por `translate`
  pipe/`TranslateService`, agregada en `en` y `es` a la vez.

## Qué NO hacer (frontend)

- No crear `NgModule` nuevos — el repo es 100% standalone.
- No importar una feature desde otra feature directamente.
- No manejar tokens/cookies de auth manualmente en un servicio.
- No hardcodear texto visible al usuario sin pasar por i18n.
