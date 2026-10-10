---
id: frontend-context
name: Monkey Frontend - convenciones y mapa de features
description: Las dos apps Angular (Frontend admin y Frontend-Platform cliente), sus diferencias, convenciones y mapa de features. Lo estable; el estado fino se lee del código.
type: context
---

# Monkey Frontend

> Describe el código tal como está, no el diseño objetivo. Aquí no van conteos, versiones menores,
> números de PR ni fechas: eso se lee del código y de git. Las rutas son relativas a la raíz del repo
> correspondiente, carpeta hermana de `Monkey-Brain-IA`.

## Las dos plataformas

Son **dos aplicaciones Angular distintas**, con públicos y propósitos separados. Consumen el mismo
backend y comparten la base del stack, pero **no son gemelas**. Una función del cliente final no va
en el admin, ni al revés.

| | `Frontend` (admin) | `Frontend-Platform` (plataforma) |
|---|---|---|
| Para quién | Equipo interno de Monkey | El cliente final |
| Para qué | Tenants, usuarios y catálogo maestro GRC | Que el cliente declare sus servicios y activos y vea su cumplimiento |
| Features hoy | `auth`, `common`, `companies`, `users` | `assets`, `auth`, `home`, `onboarding`, `services`, `technical-control` |
| Estructura de feature | `models/` + `services/` + `presentation/` | `domain/` + `presentation/` |
| `core/` y `shared/` | `core/{guards,interceptors,services}`, `shared/models` | `core/domain/*`, `shared/domain/*` |
| `ApiResponse<T>` | `@shared/models/api-response.model` | `@shared/domain/models/api-response.model` |
| i18n | ngx-translate + `public/i18n/{en,es}` | **no instalada** (texto en español hardcodeado) |
| Interceptores | `error-handler`, `auth` (en ese orden) | `credentials` (cookies + renovación de sesión); sin manejo global de errores |
| Syncfusion | sí | no |

El onboarding de `Frontend-Platform` es donde se hace el descubrimiento: el cliente declara empresa,
servicios, scope y activos, y elige los marcos por servicio. Alimenta todo el modelo; ver
`references/modulos/onboarding.md` y `contracts/modules/`.

## Stack

Angular, TypeScript estricto, **standalone components** (sin NgModules), TailAdmin con Tailwind v4 y
`material-symbols`. Syncfusion solo en `Frontend`. Sin librería de estado: servicios
`providedIn: 'root'` con estado local. Versiones exactas: `package.json`.

- **i18n:** solo en `Frontend` (`@ngx-translate/core`, JSON en `public/i18n/{en,es}/*.json`). Las
  reglas de traducción obligatoria no aplican en `Frontend-Platform` hasta que se instale.
- **Auth:** cookie httpOnly (`withCredentials: true`), sin manejo manual de tokens en JS;
  `Accept-Language` desde `localStorage('lang')`.
- **Puertos en local:** Platform `4200`, Admin `4201`. Comparten las cookies de `localhost`: dos
  sesiones en el mismo navegador se pisan.

## Arquitectura

`core/` + `shared/` + `features/<nombre>/` + `config/` (la tabla describe `Frontend`;
`Frontend-Platform` intercala `domain/` y `presentation/`).

| Carpeta | Responsabilidad |
|---------|-----------------|
| `core/` | Guards, interceptors, servicios de shell, layout. Nunca depende de `features/`. |
| `shared/` | Modelos y componentes reutilizables (`ApiResponse<T>`, dialog, loader). Nunca depende de `features/`. |
| `features/<nombre>/` | Una feature. No se importa una feature desde otra directamente. |
| `config/` | `environments/environment.ts` (`apiUrl`), `navigation.config.ts`; `syncfusion-locale.config.ts` solo en `Frontend`. |

## Mapa de features

Si el código y esta lista difieren, manda el código y se corrige esta lista.

| App · feature | Qué hace | Contrato / decisión |
|---|---|---|
| Admin · `companies` | **Referencia del admin.** Registro de empresas; la clave de acceso se muestra una sola vez. | `monkey-admin.md` |
| Admin · `auth` | Login por email; solo admite `admin_monkey`. | `auth.md` |
| Admin · `users` | **Del modelo viejo**, sin endpoint; se rehace con el módulo de Usuarios. | — |
| Platform · `auth` | Activación de cuenta en dos pasos e inicio de sesión; rechaza `admin_monkey`. Sesión en `core/domain/services/session.service.ts`. | `auth.md` · D51 |
| Platform · `onboarding` | **Referencia de la plataforma.** Componente 1 en `/onboarding`; edición posterior desde «Mi empresa». | `onboarding-organizational-context.md` |
| Platform · `services` | Componente 2 en `/services/new`; «Mis servicios» en `/services`. | `onboarding-service-context.md` |
| Platform · `technical-control` | Componente 3 en `/services/:id/technical-control`. El paso 3 es **provisional**; avisos honestos de «modo demostración» o «aún no disponible». | `onboarding-technical-control.md` · D48 · DT-31…DT-36 · D67 (marketplace de plataformas: aún no construido) |
| Platform · `home` | Bienvenida provisional según `onboarding.next_step`. `assets` es del modelo viejo y no tiene ruta. | — |

Tras entrar, Platform manda a `/onboarding` a quien aún no lo ha llenado. El dashboard se reconstruye
con el módulo de Cumplimiento (`producto/mvp-roadmap.md`; `philosophy.md`: readiness cualitativo
primero, el % nunca solo).

## Convenciones clave

- Componentes standalone con `loadComponent()` lazy en `app.routes.ts`.
- Path aliases: `@core/*`, `@features/*`, `@shared/*`, `@config/*`, `@environments/*`.
- Llamadas al backend: `HttpClient` + `environment.apiUrl` + `ApiResponse<T>`; ver
  `skills/frontend/call-backend-api.md`.
- Auth y errores ya se interceptan globalmente: un servicio de feature no los reimplementa.
- Opciones de formularios: del backend (`GET /v1/catalogs/{name}`), nunca hardcodeadas
  (`contracts/enums.md`).
- Traducciones (solo `Frontend`): toda cadena visible pasa por `translate`, agregada en `en` y `es`.

## Qué NO hacer

- No crear `NgModule` nuevos.
- No importar una feature desde otra feature directamente.
- No manejar tokens/cookies de auth manualmente en un servicio.
- No hardcodear texto visible sin pasar por i18n (en `Frontend`).
