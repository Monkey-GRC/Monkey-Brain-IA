---
name: senior-frontend-engineer
description: >-
  Úsala SIEMPRE antes de escribir, modificar o revisar código de los frontends de Monkey
  (Frontend admin y Frontend-Platform del cliente: Angular standalone, Tailwind, ngx-translate):
  nuevas features, vistas, componentes, servicios, rutas, guards, formularios, textos o refactors.
  Fija cómo pensar como ingeniero senior (código limpio, escalable, por capas), qué leer primero,
  cómo se organizan las carpetas de cada app y cuándo se considera terminado, y enruta a las
  recetas de skills/frontend/.
---

# Ingeniero frontend senior — punto de partida

Fija **cómo se decide y se construye** en `Frontend` (admin interno) y `Frontend-Platform` (el cliente final). Las recetas viven en los otros
archivos de `skills/frontend/` (un nivel arriba de esta carpeta); aquí se enlazan, no se repiten. El código manda: si difiere, se corrige este archivo.

## 1. Antes de escribir una línea

1. **Identifica la app.** Son dos apps distintas, no gemelas (`context/frontend.md`): una función del cliente no va en el admin ni al revés.
2. **Producto primero.** Todo lo que un usuario final vea pasa por `/monkey-compliance-council` y `philosophy.md`: vocabulario de GRC y códigos
   siempre visibles, **cada uno con su explicación** (en qué falla, qué impacto tiene, qué hacer); estado y porcentaje de avance juntos, con la
   cobertura al lado; nunca el nombre de Wazuh ni de Prowler ("sonda", "evaluación automática").
3. **Contrato primero.** `contracts/conventions.md`, `contracts/enums.md`, `contracts/<módulo>.md`. El frontend **nunca hardcodea listas de opciones**:
   las pide al backend (catálogos) y traduce el `valor` snake_case con su etiqueta. Si el endpoint no está, no se mockea de forma permanente: se acuerda.
4. **Lee la feature vecina** como plantilla: `Frontend/.../features/companies`; en Platform, `compliance`, `team` o `services`.

## 2. El mapa de cada app

```
src/app/
├── core/       shell de la app: guards, interceptors, servicios globales, layout y páginas del marco. Nunca importa de features/.
├── shared/     modelos, servicios y componentes reutilizables (ApiResponse<T>, toast, dialog…). Nunca importa de features/.
├── config/     environments, navegación (navigation.config.ts)
├── features/<nombre>/   una carpeta por área de negocio
└── app.routes.ts · app.config.ts
```

| | `Frontend` (admin) | `Frontend-Platform` (cliente) |
|---|---|---|
| Dentro de una feature | `models/` · `services/` · `presentation/` | `domain/{models,services,guards,utils}` · `presentation/{views,components}` |
| `core/` y `shared/` | `core/{guards,interceptors,services}`, `shared/models` | `core/domain/*`, `shared/domain/*` |
| Extras | Syncfusion | sin Syncfusion; sin manejo global de errores |

Las pruebas viven junto al archivo (`*.spec.ts`). Alias obligatorios: `@core/*`, `@features/*`, `@shared/*`, `@config/*`, `@environments/*`.

## 3. Cómo se piensa (reglas de criterio)

| Principio | Lo que significa aquí |
|---|---|
| **Dependencias en un solo sentido** | `features → shared → core`, nunca al revés. Dos features que necesitan lo mismo lo suben a `shared/`; **una feature no importa el interior de otra**. |
| **Vista tonta, lógica en servicios** | El componente muestra y delega. Reglas, transformaciones y llamadas HTTP van en servicios (`providedIn: 'root'`) o utilidades puras (`domain/utils`), que se prueban sin DOM. |
| **Standalone, sin NgModules** | Rutas con `loadComponent()` (carga perezosa) y título por clave i18n (`PAGE_TITLE.*`). Rutas fijas (`new`) antes que las dinámicas (`:id`). Guards (`authGuard`, `roleGuard`) en la ruta. |
| **Estado simple y explícito** | Sin librería de estado: signals (`signal`, `computed`, `effect`) para el estado local; el estado de servidor lo pide el servicio. `ChangeDetectionStrategy.OnPush` en los componentes. |
| **Angular moderno** | `inject()` en vez de constructores largos, control flow `@if/@for` (no `*ngIf`), `input()/output()` cuando aplique. Sigue el estilo del archivo vecino. |
| **HTTP en un solo lugar** | `HttpClient` + `environment.apiUrl` + `ApiResponse<T>`, con `withCredentials`; autenticación, renovación y errores por los interceptors globales, no por servicio (`../call-backend-api.md`). |
| **i18n siempre** | Ningún texto visible hardcodeado: clave en `public/i18n/{es,en}/<área>.json` a la vez. Lo que traduce el backend se vuelve a pedir al cambiar el idioma. |
| **Tipos estrictos** | Interfaces para cada respuesta del contrato; sin `any`. Los nombres de campo son los del contrato (snake_case) en los modelos de transporte. |
| **Accesible y responsivo** | Etiquetas, foco, contraste y teclado; el layout funciona en móvil. Estados de carga, vacío y error en toda vista que pida datos. |
| **Roles visibles, no confiados** | Ocultar un botón por rol es UX; la autorización real es del backend. La vista técnica es de `auditor` y `admin_empresa`. |

## 4. Flujo de trabajo

1. Contrato y producto → 2. modelos (interfaces) → 3. servicio con su `*.spec.ts` (`HttpTestingController`) → 4. utilidades puras si hay lógica →
5. vista y componentes (`presentation/`) → 6. ruta, guard y navegación → 7. claves i18n en `es` y `en` → 8. `ng build` y prueba en el navegador
(camino feliz, error, vacío, sin permiso, móvil) → 9. cierra la documentación afectada.

Recetas: feature nueva → `../add-feature.md` · llamar al backend → `../call-backend-api.md` · textos → `../add-translation.md` · revisión de capas → `../architecture-guardian.md`.

## 5. Anti-patrones que se rechazan

- `core/` o `shared/` importando de `features/`; una feature importando de otra; `NgModule` nuevo.
- Lógica de negocio o cálculos de cumplimiento en el template o el componente. Un porcentaje se muestra tal como lo entrega el backend, con su estado y cobertura.
- Listas de opciones, etiquetas o textos hardcodeados; rutas relativas largas (`../../../`) en vez de alias.
- Suscripciones sin cerrar, `subscribe` anidados, `any`, `!` para callar al compilador.
- Componentes gigantes: si una vista pasa de ~300 líneas o mezcla varias responsabilidades, se parte en componentes de `presentation/components/`.
- Mostrar un código o una cifra sin su explicación, o un porcentaje solo.

## 6. Definición de terminado

- [ ] `ng build` sin errores y `ng test` de lo que tocaste en verde.
- [ ] Textos en `es` y `en`; ninguna lista de opciones hardcodeada; alias en los imports.
- [ ] Revisado con `../architecture-guardian.md`; la ruta, su guard y su título correctos.
- [ ] Estados de carga, vacío y error; sin permiso; móvil.
- [ ] Nada de lo que ve el cliente nombra a Wazuh ni a Prowler.
- [ ] Contrato, `enums.md` y docs afectados al día en el mismo cambio.
