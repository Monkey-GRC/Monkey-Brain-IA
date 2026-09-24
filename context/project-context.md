---
id: project-context
name: Monkey - Contexto de Proyecto (backend + frontend)
description: Resumen de dominio, stack técnico, arquitectura y convenciones de los repos backend y frontend de Monkey.
type: context
---

# Monkey Backend

> **Convención de rutas**: este folder (`Monkey-Brain-IA`) vive como repo
> independiente, separado del código de producto. Todas las rutas de código
> mencionadas aquí y en `skills/backend/`/`skills/frontend/` (`src/...`,
> `prisma/...`, `i18n/...`, `package.json`, etc.) son relativas a la **raíz
> del repo correspondiente**, no a esta carpeta. Los repos del producto son
> `Monkey-GRC/Backend`, `Monkey-GRC/Frontend` (admin interno),
> `Monkey-GRC/Frontend-Platform` (plataforma del cliente final) y
> `monkey-cis-sync` (sincroniza el catálogo de checks desde Wazuh). Al usar
> este contexto, colócalos como carpetas hermanas de `Monkey-Brain-IA` dentro
> de un mismo directorio, o ajusta las rutas según dónde los hayas descargado.
>
> **Grafos de conocimiento**: no viven aquí. Cada repo tiene su propia
> carpeta `graphs-knowledge/` (`../Backend/graphs-knowledge/` y
> `../Frontend/graphs-knowledge/`) — ver
> `skills/shared/query-knowledge-graph.md` para cómo consultarlos sin gastar
> tokens de más.

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

**Multi-tenant con base de datos por cliente**: dos schemas Prisma separados,
`prisma/central/schema/` (catálogo maestro de Monkey, registro de clientes) y
`prisma/tenant/schema/` (el escenario particularizado de cada cliente).

Entidades principales:
- Central: `Client`, `TenantIdentifierDirectory`, `CisCheckTranslation`
- Catálogo (en ambos): `Template` (marco), `Risk` (con `RiskLevel`), `Reason`,
  `Control`, `ControlDimensionRequirement` (las 5 dimensiones), `ControlCheck`
  (evidencia automática vía Wazuh), `ManualCheckItem` + `ManualCheckEvidence`
  (evidencia manual), `Asset`, `User` (con `Role`)
- Solo tenant: `CompanyProfile`, y en `Template` los campos de trazabilidad
  con el catálogo base (`source_template_id`, `adopted_at`)

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
`dashboard`, `manual-check`, `onboarding`, `reason`, `risk`, `template`,
`translation`, `user`.

- `risk`: 4 capas completas — **feature de referencia**, úsala como plantilla.
- `auth`: 3 capas (application, infrastructure, presentation) — sin domain propio.
- `reason`: versión simplificada (application + presentation), deuda técnica pendiente.
- `checklist`: expone el catálogo de checks CIS; lee de la base que alimenta
  `monkey-cis-sync`, no de la API de Wazuh directamente.
- `dashboard`: calcula el cumplimiento (por control, por dimensión, por servidor).
  Toda la matemática vive en `application/compliance.calculator.ts`.
- `client` + `onboarding`: aprovisionamiento de tenants (crea la base del cliente,
  cifra sus credenciales y clona el catálogo maestro hacia su escenario).

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
  `prisma.config.tenant.ts` (base de cada cliente). Un cambio que aplique a ambos
  planos hay que hacerlo en los dos y migrar por separado.
- Inversión de dependencias vía tokens abstractos: cada `*.module.ts` registra
  `provide: XRepository, useClass: XPrismaRepository`.

## Qué NO hacer (backend)

- No importar Prisma ni decoradores de Nest dentro de `domain/`.
- No crear un schema Prisma monolítico; usar el archivo del dominio correspondiente
  en `prisma/central/schema/` o `prisma/tenant/schema/`, según el plano que aplique.
- No saltarse capas (p. ej. controller llamando directo al repositorio Prisma).

---

# Monkey Frontend

## Las dos plataformas

Son **dos aplicaciones Angular distintas**, con públicos y propósitos separados.
Ambas consumen el mismo backend y comparten stack y convenciones, pero nunca se
mezclan: una función del cliente final no va en el admin, ni al revés.

| | `Frontend` (admin) | `Frontend-Platform` (plataforma) |
|---|---|---|
| Para quién | Equipo interno de Monkey | El cliente final |
| Para qué | Administración de la plataforma: creación y gestión de tenants, usuarios, y el catálogo maestro GRC (marcos, riesgos, causas, controles) | Que el cliente descubra y declare sus servicios y activos, y vea su estado de cumplimiento |
| Features hoy | `auth`, `clients`, `users`, `common`, `grc-framework` (`risks`, `reasons`, `controls`, `templates`, `template-builder`) | `auth`, `onboarding` (`account-setup`, `characterization`, `company-profile`, `template-selection`), `templates`, `dashboard` |

**El onboarding de `Frontend-Platform` es donde se hace el descubrimiento.** Ahí
el cliente declara su empresa, sus servicios, su scope y los activos que entran
en la evaluación (servidores, bases de datos, aplicaciones, nube, documentación),
y elige los marcos que contrata. Es la puerta de entrada de los datos que alimentan
todo el modelo — ver `skills/product/monkey-compliance-council/references/modelo-datos.md`.

## Dominio

Consola web sobre el mismo dominio del backend: TailAdmin Angular (template
open-source de admin dashboard) reutilizado como UI de Monkey — consistente con
el backend y con `monkey-compliance-council`.

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
