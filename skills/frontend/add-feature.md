---
id: add-feature
name: Agregar una feature nueva (frontend)
description: Pasos para crear una feature completa en src/app/features/<nombre>, siguiendo el patrón de la feature companies (la referencia viva).
type: recipe
applies_to: frontend
---

# Skill: Agregar una feature nueva (frontend)

Referencia viva: `Frontend/src/app/features/companies` — la primera feature del modelo nuevo
(vista con lista, formulario en diálogo, i18n en `public/i18n/{es,en}/companies.json`, ruta con
`roleGuard(['admin_monkey'])`). Úsala como plantilla en vez de confiar solo en esta doc. `users`
tiene la misma estructura pero es del modelo viejo (`username`, `MONKEY_ADMIN`).

> La feature `grc-framework` (`risks`, `reasons`, `controls`, `templates`) **fue eliminada**
> en el commit `acbd907`, junto con `clients`, por pertenecer al modelo viejo. Si una doc o un
> agente te manda usarla de plantilla, esa doc está desactualizada.

> ⚠️ **Son dos apps Angular distintas y NO son gemelas.** Esta skill describe `Frontend`
> (Monkey Admin). `Frontend-Platform` (la plataforma del cliente) diverge en lo siguiente y
> hay que comprobarlo antes de aplicar cualquier patrón de aquí:
>
> | | `Frontend` | `Frontend-Platform` |
> |---|---|---|
> | Features hoy | `auth`, `common`, `companies`, `users` | `assets`, `auth`, `home` |
> | Estructura de feature | `models/` + `services/` + `presentation/` | `domain/` + `presentation/` |
> | `core/` y `shared/` | `core/{guards,interceptors,services}`, `shared/models` | `core/domain/*`, `shared/domain/*` |
> | `ApiResponse<T>` | `@shared/models/api-response.model` | `@shared/domain/models/api-response.model` |
> | i18n | ngx-translate + `public/i18n/{en,es}` | **no tiene i18n instalada** |
> | Interceptores | `auth.interceptor`, `error-handler.interceptor` | `credentials.interceptor` (cookies + renovación de sesión ante 401); **sin manejo global de errores** |
> | Syncfusion | sí | no |
>
> Lo común a las dos: Angular 20 standalone sin `NgModule`, TypeScript estricto, Tailwind v4,
> sin librería de estado, y los path aliases `@core/*`, `@features/*`, `@shared/*`, `@config/*`,
> `@environments/*`.


## Pasos

1. **Modelos** — `src/app/features/<nombre>/models/<entidad>.model.ts`.
   Tipos TypeScript puros (interfaces/types), sin lógica.

2. **Servicio** — `src/app/features/<nombre>/services/<entidad>.service.ts`.
   `@Injectable({ providedIn: 'root' })`. Llama al backend con `HttpClient` +
   `environment.apiUrl` (de `@environments/environment`), tipando la
   respuesta con `ApiResponse<T>` (`@shared/models/api-response.model`). Ver
   `../frontend/call-backend-api.md` para el patrón exacto.

3. **Vistas** — `src/app/features/<nombre>/presentation/views/<vista>/<vista>.ts`
   (+ `.html`). Componente standalone, se registra en `src/app/app.routes.ts`
   con `loadComponent()` (lazy loading), dentro del layout protegido por
   `authGuard` si requiere sesión.

4. **Componentes** — `src/app/features/<nombre>/presentation/components/<componente>/`.
   Piezas reutilizables solo dentro de esta feature (si se necesitan en más
   de una feature, van a `shared/` en su lugar, no se importan cruzado).

5. **Navegación** — si la feature necesita entrada en el sidebar, agregarla
   en `src/app/config/navigation.config.ts` (`NAV_ITEMS`).

6. **Traducciones** — agregar las claves nuevas en
   `public/i18n/en/<feature>.json` y `public/i18n/es/<feature>.json` (ver
   `../frontend/add-translation.md`).

## Restricciones

- Standalone components únicamente — no crear `NgModule` para la feature.
- Usar los path aliases (`@features/*`, `@shared/*`, `@core/*`, `@config/*`,
  `@environments/*`) en vez de rutas relativas largas.
- No importar nada de otra `features/<otro-nombre>/` directamente.
- Si el backend no expone aún el endpoint necesario, repórtalo al tech-lead
  en vez de mockear datos permanentes en el frontend.

## Después de terminar

- Correr `ng build` (o `npm run build`) para confirmar que compila.
- Verificar que la ruta nueva aparece protegida/pública según corresponda en
  `app.routes.ts`.
