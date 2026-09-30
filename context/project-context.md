---
id: project-context
name: Monkey - Contexto de Proyecto (Backend, Frontend y Frontend-Platform)
description: Resumen de dominio, stack tecnico, arquitectura y convenciones de los repos de codigo de Monkey. Describe el estado ACTUAL del codigo, no el modelo objetivo.
type: context
---

# Monkey Backend

> ⚠️ **Este archivo describe el código tal como está hoy, no el diseño objetivo.** El plan
> vigente es `skills/product/monkey-compliance-council/references/modelo-datos.md` (ver `CLAUDE.md`).
> Actualizado el 2026-09-30.

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
Leerlo antes de tocar el schema. Cómo está implementado (Prisma 7, RLS, roles, migraciones, `.env`)
está en `schema-implementacion.md`.

**Multi-tenant (D25).** Una sola base (`monkey`) con **cuatro schemas de Postgres** —`catalog`,
`platform`, `tenant`, `audit`— y los clientes aislados por **Row-Level Security** sobre
`tenant_id`/`company_id`. La app se conecta como `monkey_app` (sin superusuario ni `BYPASSRLS`) y
fija el tenant por transacción. La base dedicada (`isolation_strategy = dedicated`) sigue siendo
una opción del modelo, pero su aprovisionamiento **no está construido**: hoy el registro la rechaza
con `DEDICATED_DATABASE_NOT_AVAILABLE` hasta que se cierre P2(d).

El schema ya implementa el modelo relacional completo (71 tablas, 21 migraciones aplicadas en dev).
El modelo viejo (`Client`, `Template → Risk → Reason → Control`, una base por cliente,
`prisma/central/` + `prisma/tenant/`) **ya no existe**.

## Stack técnico

- **Framework:** NestJS 11 (Express platform), TypeScript 5.7
- **ORM/DB:** Prisma 7 (`prisma-client` con `moduleFormat = "cjs"`, `@prisma/adapter-pg`), PostgreSQL 17
- **Auth:** `@nestjs/jwt` (access token HS256 de 15 min) + refresh token opaco rotado, ambos en
  cookies httpOnly (`mnk_access`, `mnk_refresh`); contraseñas con `bcrypt` (costo 12)
- **Validación/Docs:** `class-validator`, `class-transformer`, `@nestjs/swagger` (`/v1/docs`)
- **i18n:** `nestjs-i18n`, locales en `/i18n/en` y `/i18n/es`
- **Tests:** Jest + ts-jest + supertest instalados, pero **sin `*.spec.ts`** todavía
- **Lint/Format:** ESLint 9 (flat config) + Prettier (`singleQuote`, `trailingComma: all`)
- **CI/CD:** GitHub Actions — build de imagen Docker y despliegue al VPS de dev (sin paso de migración)

## Arquitectura

Clean Architecture + Feature-Based. Cada feature vive en `src/features/<nombre>/`
con 4 capas:

| Capa | Carpeta | Responsabilidad |
|------|---------|-----------------|
| Domain | `domain/` | Entidades, repositorios abstractos y puertos. Cero dependencias externas. |
| Application | `application/` | Casos de uso y DTOs. No sabe de HTTP ni de Prisma. Lanza `DomainError`. |
| Infrastructure | `infrastructure/` | Repositorios Prisma (siempre con `prisma.withScope`). |
| Presentation | `presentation/` | Controladores HTTP y mappers al JSON del contrato. |

**Regla de dependencias (no violar):**
```
Presentation → Application → Domain
Infrastructure → Domain
```

Lo transversal vive fuera de las features: `src/common/` (sobre `ResponseDto`, `DomainError` y su
catálogo, filtro global de excepciones, `ValidationException`, paginación, decoradores `@Public`,
`@Roles`, `@CurrentUser`, `RolesGuard`, `TenantScope`, `Principal`, puertos `TokenHasher` y
`AuditLogWriter`, política de contraseña, formato de la clave de acceso) y `src/infrastructure/`
(`PrismaService`, writer de `audit_logs`, HMAC de tokens — módulos globales).

### Estado actual de features

- `auth`: **feature de referencia**, 4 capas completas. Login, refresh (rotado), logout y `me`
  (`contracts/modules/auth.md`); bloqueo a 5 intentos por 15 min; sesión con cierre a los 30 min sin
  actividad y a las 8 h; `SessionAuthGuard` global que verifica sesión y usuario contra la base en
  cada request. Incluye el canje de la clave (`POST /v1/auth/redeem`, D39: una sola vez y solo con
  el `admin_email`), que crea el `admin_empresa` y abre sesión; login y canje comparten
  `SessionIssuer`. Falta el bloque `onboarding` de `me` (llega con MD-74).
- `companies`: registro de empresas de Monkey Admin (`contracts/modules/monkey-admin.md`),
  solo `admin_monkey`. `POST /v1/companies` (empresa + clave `MNK-XXXX-XXXX-XXXX` de un solo uso,
  guardada como HMAC), `GET /v1/companies` (paginado, sin la empresa interna de Monkey) y
  `GET /v1/companies/{id}`. `PATCH` y la regeneración de clave esperan a P2(b)/(c).
- `catalogs`: `GET /v1/catalogs/{name}` sirve las opciones de los formularios (con la etiqueta según
  `Accept-Language`). Los valores están en `src/common/catalogs/onboarding-catalogs.ts` (fuente:
  `contracts/enums.md`) y las etiquetas en `i18n/{es,en}/catalogs.json`; solo las regulaciones salen
  de la base (`catalog.regulations`).
- `onboarding`: Componente 1 (contexto organizacional): `GET` y `PUT
  /v1/onboarding/organizational-context`, solo `admin_empresa`, con auditoría antes/después. El
  avance de cada paso lo deriva `auth` (`GetOnboardingProgressUseCase`) para el bloque `onboarding`
  de `me`. Los Componentes 2 y 3 son los siguientes (MD-78, MD-85). Decisiones en D40.
- Seed de arranque: `prisma/seed/seed.ts` (`npx prisma db seed`) crea la empresa interna de Monkey
  y el primer `admin_monkey` desde las variables `SEED_*` del `.env`, y siembra las 14 regulaciones
  del catálogo (idempotente).

## Convenciones clave

- Respuestas HTTP con `ResponseDto` (`{ statusCode, message, data }`); `message` traducido según
  `Accept-Language`. Errores con el mismo sobre más `error.code` (`contracts/conventions.md`), vía
  `src/common/filters/http-exception.filter.ts`.
- Todo endpoint exige sesión por defecto; `@Public()` lo abre y `@Roles(...)` restringe por rol. El
  usuario autenticado llega con `@CurrentUser()` (`Principal`: `userId`, `companyId`, `role`,
  `sessionId`), con el rol leído de la base, no del token.
- Acceso a datos: `PrismaService` (`src/infrastructure/database/prisma.service.ts`), conectado con
  `APP_DATABASE_URL`. **Toda consulta a una tabla con RLS va dentro de `withScope(scope, tx => …)`**.
  Las búsquedas previas al tenant (login, canje, refresh) usan las funciones `SECURITY DEFINER` de
  `platform` con `$queryRaw`.
- Schema en `prisma/schema/<catalog|platform|tenant|audit>/*.prisma`, un solo `prisma.config.ts`;
  migrar con `npx prisma migrate dev` (dev) o `migrate deploy` (staging/prod) — ver
  `skills/backend/add-prisma-model.md`.
- Inversión de dependencias vía clases abstractas: cada `*.module.ts` registra
  `provide: XRepository, useClass: XPrismaRepository`.
- Tipos en firmas decoradas se importan con `import type` (`isolatedModules` + `emitDecoratorMetadata`).

## Qué NO hacer (backend)

- No importar Prisma ni decoradores de Nest dentro de `domain/`.
- No consultar tablas con RLS fuera de `withScope`, ni conectar la app como `postgres`.
- No importar el interior de una feature desde otra: lo compartido va a `common/` o `infrastructure/`.
- No crear un schema Prisma monolítico; usar el archivo del dominio correspondiente.
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
| Features hoy | `auth`, `common`, `companies`, `users` | `assets`, `auth`, `home`, `onboarding` |
| Estructura de feature | `models/` + `services/` + `presentation/` | `domain/` + `presentation/` |
| `core/` y `shared/` | `core/{guards,interceptors,services}`, `shared/models` | `core/domain/*`, `shared/domain/*` |
| `ApiResponse<T>` | `@shared/models/api-response.model` | `@shared/domain/models/api-response.model` |
| i18n | ngx-translate + `public/i18n/{en,es}` | **no instalada** |
| Interceptores | `error-handler`, `auth` (en ese orden) | `credentials` (cookies + renovación de sesión); sin manejo global de errores |
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

- `Frontend` · `companies`: **feature de referencia del admin** (vista + lista + formulario +
  diálogo). Registro de empresas con la clave de acceso a la vista una sola vez.
- `Frontend` · `auth`: login por email contra `/v1/auth`; solo admite `admin_monkey`. El
  `authInterceptor` renueva la sesión ante un 401 y reintenta (va **después** de
  `errorHandlerInterceptor` en `app.config.ts` para recibir el `HttpErrorResponse` crudo).
- `Frontend` · `users`: **del modelo viejo** (`username`, `MONKEY_ADMIN`, `client_id`) y sin
  endpoint en el backend; se rehace con el módulo de Usuarios.
- `Frontend-Platform` · `auth`: "Activa tu cuenta" (`/register`, canje de la clave con el correo
  administrativo, nombre, apellido y contraseña) e inicio de sesión (`/signin`, por email). Rechaza
  `admin_monkey`. El `credentialsInterceptor` renueva la sesión ante un 401 y reintenta; el usuario y
  la empresa en sesión viven en `core/domain/services/session.service.ts`. Se retiraron los headers
  `mnk-client-*` y sus servicios (modelo viejo).
- `Frontend-Platform` · `onboarding`: **feature de referencia de la plataforma** (`domain/` +
  `presentation/`). Asistente del Componente 1 en `/onboarding`: 5 pantallas cortas más una de
  revisión, opciones como píldoras tocables, avance guardado en el navegador (`localStorage` por
  usuario) y edición posterior desde «Mi empresa». Todo el texto está en español hardcodeado (la
  plataforma no tiene i18n). Las opciones salen del backend vía `shared/domain/services/catalog.service.ts`.
- `Frontend-Platform` · `home`: bienvenida provisional; invita al primer paso si `onboarding.next_step`
  es `organizational_context`. `assets` sigue siendo del modelo viejo y no tiene ruta.
- Tras entrar (login o canje), Platform manda a `/onboarding` a quien aún no lo ha llenado. Los
  Componentes 2 y 3 y el `dashboard` se reconstruyen en los épicos MD-59 a MD-61 (`philosophy.md`:
  readiness cualitativo primero, el % nunca solo).
- **Puertos en local:** Monkey Platform `4200`, Monkey Admin `4201` (fijado en su `angular.json`).
  Comparten las cookies de `localhost`: dos sesiones en el mismo navegador se pisan.

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
