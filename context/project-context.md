---
id: project-context
name: Monkey - Contexto de Proyecto (backend + frontend)
description: Resumen de dominio, stack técnico, arquitectura y convenciones de los repos backend y frontend de Monkey.
type: context
---

# Monkey Backend

> **Convención de rutas**: este folder (`monkey-brain-ai`) vive como repo
> independiente, separado del código de producto. Todas las rutas de código
> mencionadas aquí y en `skills/backend/`/`skills/frontend/` (`src/...`,
> `prisma/...`, `i18n/...`, `package.json`, etc.) son relativas a la **raíz
> del repo correspondiente** (`monkey-360/backend` o `monkey-360/frontend`),
> no a esta carpeta. Al usar este contexto, clona/coloca `backend` y
> `frontend` junto a `monkey-brain-ai` (carpetas hermanas dentro de un mismo
> directorio `monkey/`) o ajusta las rutas según dónde lo hayas descargado.
>
> **Grafos de conocimiento**: no viven aquí. Cada repo tiene su propia
> carpeta `graphs-knowledge/` (`../backend/graphs-knowledge/` y
> `../frontend/graphs-knowledge/`) — ver
> `skills/shared/query-knowledge-graph.md` para cómo consultarlos sin gastar
> tokens de más.

## Dominio

API interna de tipo **GRC (Governance, Risk & Compliance)**: gestiona riesgos
organizacionales, controles asociados, razones/justificaciones, clientes y
usuarios con autenticación basada en roles.

Entidades principales (ver `prisma/schema/*.prisma`):
- `Client`
- `Risk` (con `RiskLevel`)
- `Control`
- `Reason`
- `Template`
- `User` (con `Role`)

## Stack técnico

- **Framework:** NestJS 11 (Express platform), TypeScript 5.7
- **ORM/DB:** Prisma 7 (`@prisma/adapter-pg`, `@prisma/adapter-planetscale`), PostgreSQL
- **Auth:** `@nestjs/jwt` + `@nestjs/passport` (`passport-jwt`), JWT vía cookies (`cookie-parser`), hashing con `bcrypt`
- **Validación/Docs:** `class-validator`, `class-transformer`, `@nestjs/swagger`
- **i18n:** `nestjs-i18n`, locales en `/i18n/en` y `/i18n/es`
- **Tests:** Jest + ts-jest + supertest
- **Lint/Format:** ESLint 9 (flat config) + Prettier (`singleQuote`, `trailingComma: all`)
- **CI:** `bitbucket-pipelines.yml` (actualmente placeholder, pasos aún no implementados)

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

- `auth`: 3 capas (application, infrastructure, presentation) — sin domain propio.
- `risk`: 4 capas completas — **feature de referencia**, úsala como plantilla.
- `reason`: solo application + presentation (versión simplificada, deuda técnica pendiente).
- `control`: existe el modelo Prisma (`control.prisma`) pero **no existe aún**
  `src/features/control` — es el ejemplo usado en el README para documentar
  cómo crear una feature nueva. Si se pide implementarlo, seguir
  `skills/backend/add-feature.md`.

## Convenciones clave

- Respuestas HTTP estandarizadas con `ResponseDto` (`{ statusCode, message, data }`),
  en `src/common/dtos/response.dto.ts`.
- Errores manejados globalmente por `src/common/filters/http-exception.filter.ts`,
  con mensajes traducidos vía i18n (`/i18n/en`, `/i18n/es`).
- Guard de auth: `@UseGuards(AuthGuard('jwt'))` + `@ApiCookieAuth()` en controladores;
  el id de usuario se lee de `req.user.id`.
- Prisma usa **schema multi-archivo** (`prisma/schema/*.prisma`, uno por dominio) +
  `prisma.config.ts` en la raíz (estilo Prisma 7). Editar el archivo del dominio
  correcto, no un schema monolítico.
- Inversión de dependencias vía tokens abstractos: cada `*.module.ts` registra
  `provide: XRepository, useClass: XPrismaRepository`.

## Qué NO hacer (backend)

- No importar Prisma ni decoradores de Nest dentro de `domain/`.
- No crear un schema Prisma monolítico; usar el archivo del dominio correspondiente
  en `prisma/schema/`.
- No saltarse capas (p. ej. controller llamando directo al repositorio Prisma).

---

# Monkey Frontend

## Dominio

Consola web para el mismo dominio GRC del backend: TailAdmin Angular (template
open-source de admin dashboard) reutilizado como UI de Monkey. Feature
`grc-framework` con dominio `risk` (formulario, listado, KPIs, matriz,
controles, razones) — consistente con el backend y con
`monkey-compliance-council`.

## Stack técnico

- **Framework:** Angular 20+, TypeScript 5.8 estricto, **standalone
  components** (sin NgModules).
- **UI:** TailAdmin (Tailwind CSS v4 vía `@tailwindcss/postcss`) +
  Syncfusion Angular (`@syncfusion/ej2-angular-*`: grids, calendarios,
  dropdowns, inputs, listas, notificaciones, popups) + `material-symbols`.
- **i18n:** `@ngx-translate/core` + `ngx-translate-multi-http-loader`, JSON
  en `public/i18n/{en,es}/*.json` cargado vía `HttpBackend` (sin pasar por
  interceptors).
- **Estado:** sin librería (no NgRx/Akita/signals store) — servicios
  `providedIn: 'root'` con estado local.
- **Auth:** cookie httpOnly (`withCredentials: true`), sin manejo manual de
  tokens en JS; `Accept-Language` inyectado desde `localStorage('lang')`.

## Arquitectura

`core/` + `shared/` + `features/<nombre>/` + `config/` (ver
`../frontend/graphs-knowledge/architecture.md` para el grafo normativo
completo):

| Carpeta | Responsabilidad |
|---------|-----------------|
| `core/` | Guards, interceptors, servicios de shell (modal, sidebar, theme), layout/shell components. Nunca depende de `features/`. |
| `shared/` | Modelos y componentes reutilizables entre features (`ApiResponse<T>`, dialog, loader). Nunca depende de `features/`. |
| `features/<nombre>/` | `models/` + `services/` + `presentation/{views,components}`. No se importa una feature desde otra directamente. |
| `config/` | `environments/environment.ts` (`apiUrl`), `navigation.config.ts`, `syncfusion-locale.config.ts`. |

### Estado actual de features

- `auth`: login view/form, `auth.service.ts` — completa.
- `grc-framework` / `risk`: **feature de referencia**, completa (form, list,
  kpis, matriz).
- `grc-framework` / `controls`, `grc-framework` / `reasons`: solo stubs
  (`"controls works!"` / `"reasons works!"`) — pendientes de implementar.
- `common`: solo `home` (landing).

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
