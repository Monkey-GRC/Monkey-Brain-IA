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
| i18n | ngx-translate + `public/i18n/{en,es}` | ngx-translate + `public/i18n/{es,en}` (un JSON por área, ver `I18N_FILES` en `app.config.ts`) |
| Interceptores | `error-handler`, `auth` (en ese orden) | `credentials` (cookies + renovación de sesión); sin manejo global de errores |
| Syncfusion | sí | no |

El onboarding de `Frontend-Platform` es donde se hace el descubrimiento: el cliente declara empresa,
servicios, scope y activos, y elige los marcos por servicio. Alimenta todo el modelo; ver
`references/modulos/onboarding.md` y `contracts/modules/`.

## Stack

Angular, TypeScript estricto, **standalone components** (sin NgModules), TailAdmin con Tailwind v4 y
`material-symbols`. Syncfusion solo en `Frontend`. Sin librería de estado: servicios
`providedIn: 'root'` con estado local. Versiones exactas: `package.json`.

- **i18n:** en las dos apps (`@ngx-translate/core`, JSON en `public/i18n/{en,es}/*.json`). Platform guarda el idioma en
  `localStorage('lang')` (`core/domain/services/language.service.ts`) y lo manda como `Accept-Language`. Al cambiarlo la
  pantalla **no se recrea** (no se pierde lo escrito): los textos fijos cambian solos con `translate` y lo que traduce el
  backend (catálogos) se vuelve a pedir con un `effect` sobre `LanguageService.current()`. Toda cadena visible pasa por
  `translate`, en `es` y en `en` a la vez.
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
| Admin · `companies` | **Referencia del admin.** Registro de empresas; la clave de acceso solo se envía por correo (nunca se muestra, D99) y se reenvía con una nueva. | `monkey-admin.md` |
| Admin · `auth` | Login por email; solo admite `admin_monkey`. «¿Olvidaste tu contraseña?» → `/auth/forgot-password` → enlace del correo → `/auth/reset-password` (contraseña nueva + segundo factor). | `auth.md` · D101 |
| Admin · `users` | **Del modelo viejo**, sin endpoint; se rehace con el módulo de Usuarios. | — |
| Platform · `auth` | Activación de cuenta en dos pasos e inicio de sesión; rechaza `admin_monkey`. Sesión en `core/domain/services/session.service.ts`. «¿Olvidaste tu contraseña?» → `/forgot-password` → enlace del correo → `/reset-password` (contraseña nueva + segundo factor). | `auth.md` · D51 · D101 |
| Platform · `onboarding` | **Referencia de la plataforma.** Componente 1 en `/onboarding`; edición posterior desde «Mi empresa». | `onboarding-organizational-context.md` |
| Platform · `services` | Alta de servicio en `/services/new`: tras guardar, **la misma pantalla sigue con el asistente de riesgos** (`app-risk-wizard`, D89) y de ahí a declarar activos; «Mis servicios» en `/services`. En el detalle, «Nueva conexión» se cierra mientras falten riesgos y su aviso reabre el mismo asistente. | `onboarding-service-context.md` · D89 |
| Platform · `technical-control` | Componente 3. `/services/:id/connections/new` es el **marketplace de plataformas** (D67): un grupo por tipo, tarjetas con el logo oficial desde `public/providers/`, las que no tienen flujo bloqueadas; la plataforma elegida lleva a su paso a paso en `…/new/:catalog/:platform`. Hoy solo AWS tiene flujo. Un guard (`risksEvaluatedGuard`) manda al detalle del servicio (que abre el asistente de riesgos) si faltan riesgos por evaluar antes de entrar a estas rutas (D89). | `onboarding-technical-control.md` · D48, D67 · DT-32…DT-36 · DT-68 |
| Admin y Platform · `settings` | **Ajustes**: una **pantalla completa** en `/ajustes`, **fuera del layout de la app** (sin su menú ni su encabezado) y en la misma pestaña, a la que se llega desde el menú de perfil. Arriba, «Volver a la aplicación» (vuelve a la última pantalla que vio la persona; `NavigationHistoryService`, que arranca `AppLayoutComponent`); a la izquierda, las secciones **agrupadas por función** (`SETTINGS_GROUPS` en `settings-section.ts`); a la derecha, la sección elegida, una ruta hija con su URL (`/ajustes/seguridad`). **Patrón de cada sección:** un *resumen* con categorías (`app-settings-group`: título + tarjeta) cuyas filas (`app-settings-row`: título, descripción y «>») abren una *pantalla de detalle* con «← Atrás» en la esquina superior izquierda del panel, título y subtítulo (`app-settings-detail-header`). Hoy, el grupo «Cuenta» con **Seguridad** (`/ajustes/seguridad`): «Cómo inicias sesión» → Contraseña (`/contrasena`: la actual en su propia fila, la nueva con su **guía** que se marca sola —requisitos, distinta de la actual y que coincidan— y, al enviar, un **modal** pide el código del segundo factor; sin vencimiento por calendario) y «Verificación en dos pasos» → aplicación de autenticación (obligatoria, informativa) y Códigos de recuperación (`/codigos-de-recuperacion`). Usa los componentes compartidos `new-password-fields` (con la guía), `second-factor-field` y `second-factor-dialog` (el modal del código, que se envía solo al llegar a 6 dígitos). | `auth.md` · D101 · SEG-14, SEG-16 |
| Admin y Platform · `core` · `profile-menu` | **Menú de perfil** del encabezado: el círculo con las iniciales (nombre y apellido; sin nombre, las del correo) abre un panel con nombre y correo, **Ajustes**, **idioma** (ES/EN), **modo oscuro** y **cerrar sesión**. Reemplaza los botones sueltos de tema, idioma, ajustes y salir; las pantallas de acceso conservan sus propios selectores de tema e idioma. A su izquierda, tras un separador, el **«?»** (`help-menu`): atajos de teclado (⌘/Ctrl+K, Esc) y «Contactar a soporte», que solo aparece si `environment.supportUrl` trae una URL o un `mailto:`. | D101 |
| Platform · `home` | Bienvenida provisional: pide el contexto de la empresa mientras falte (`onboarding.next_step === organizational_context`) y, hecho, da la bienvenida al resumen; sin servicios invita a crear el primero (D89). `assets` es del modelo viejo y no tiene ruta. | D89 |
| Platform · `team` | **Equipo** en `/equipo` (solo `admin_empresa`, `roleGuard`): invitar a un `funcional` (con especialidades) o a un `auditor`, ver el código de activación **una sola vez**, reemitirlo, cambiar especialidades, desactivar/reactivar y restablecer el segundo factor; y la pestaña «Reparto del trabajo» (responsable de cada dimensión por servicio). El responsable por **control** se cambia en el panel de detalle de un control (`compliance`), no aquí. El menú se filtra por rol (`roles` en `navigation.config.ts`). | `users-team.md` · D96 · MD-134 |

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
- Traducciones (las dos apps): toda cadena visible pasa por `translate`, agregada en `en` y `es`.
- **Pantallas de acceso (login, activar, recuperar, restablecer, código).** Van dentro de `app-auth-page-layout` (la pantalla dividida: el formulario a un lado y el panel de la marca al otro) y su contenido va en un contenedor `flex flex-col flex-1` que ocupa su mitad, igual que el login; sin él la pantalla se descuadra. Desde Ajustes, «¿No la recuerdas?» **no** lleva a esas pantallas: la persona ya está en sesión, así que se envía el enlace a su correo y un aviso (`app-notice-dialog`) se lo dice.
- **Navegar no debe sentirse «muerto».** `authGuard` deja pasar de inmediato si la sesión ya está cargada (no pregunta al servidor en cada cambio de pantalla; el backend valida en cada petición y el interceptor renueva o manda al login), las pantallas se precargan (`withPreloading(PreloadAllModules)`) y `app-navigation-progress`, en la raíz de la app, muestra una barra fina mientras una ruta abre (también fuera del layout, p. ej. Ajustes).
- **Componentes genéricos de contraseña y segundo factor (`shared/presentation/components/`, idénticos en las dos apps; no hablan de ninguna pantalla).** `app-password-field` (campo + su propio «ojito», centrado en el recuadro; uno por campo, nunca compartido); `app-password-guide` (los requisitos que se marcan solos; recibe contraseña, confirmación y, **solo si la pantalla tiene contraseña actual**, esa actual: sin ella no aparece «distinta de la actual»); `app-new-password-fields` (nueva + confirmación + guía; úsalo donde se elige una contraseña: cambiarla en Ajustes, recuperarla con el enlace, y el primer ingreso/activación de cualquier cuenta nueva); `app-second-factor-dialog` (el modal que pide el código TOTP —o uno de recuperación, si `allowRecovery`— antes de **cualquier** acción sensible: cambiar la contraseña, generar códigos de recuperación, archivar o reactivar una empresa en Admin. El padre lo abre con `open`, hace la llamada y devuelve el motivo del rechazo en `errorMessage`; el modal se vacía y devuelve el cursor al campo porque un código es de un solo uso; `danger` pinta de rojo una acción grave). **Toda pantalla nueva que pida el segundo factor usa este modal; no se hacen formularios de código propios.** Ese modal y los avisos se apoyan en `app-modal` (la base de todo modal: fondo, panel, foco que entra y vuelve, Tab que no se escapa, Esc y clic fuera, scroll bloqueado; **el contenido se crea solo mientras está abierto** con `@if (open())` para que sus campos no roben el foco) y `app-notice-dialog` (un aviso con icono, título, un mensaje **corto**, un dato destacado en su propio recuadro —`highlight`: un correo, un código— y un botón; sirve para cualquier «te enviamos…», «listo…». Lo importante va en el recuadro, no dentro de una frase larga). Un modal nuevo se construye sobre `app-modal`, no desde cero. En pantallas de acceso se usan con `[compact]="true"` y `leadingIcon="lock"`.
- **Estilos sincronizados entre las dos apps.** Misma base de letra (`html { font-size: 16px }` en las dos `styles.css`; todo está en `rem`, así que cambiarla escala todo) y mismos tokens de `styles.css`. Lo que se construye en una (p. ej. `settings`, `profile-menu`, `help-menu`) se porta a la otra con el mismo marcado y las mismas clases; solo cambian las rutas y los alias. En pantallas de lectura, el texto principal va en `text-base` (16 px), las descripciones en `text-sm` (14 px) y `text-xs` (12 px) se reserva para etiquetas mínimas.

## Qué NO hacer

- No crear `NgModule` nuevos.
- No importar una feature desde otra feature directamente.
- No manejar tokens/cookies de auth manualmente en un servicio.
- No hardcodear texto visible sin pasar por i18n.
