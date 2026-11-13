---
id: design-system-sync
name: Sincronía de estilos entre Frontend y Frontend-Platform
description: Cómo se mantienen idénticos los tokens y los componentes base de las dos apps, y qué falla si divergen.
type: skill
status: PROPUESTA de la Fase 2 (mecanismo por confirmar).
---

# Sincronía entre las dos apps

Hoy no hay ningún mecanismo: todo se copia a mano y ya hay deriva (padding de página, scrollbars, `z-index` del toast,
`status-badge`, tema de Syncfusion; los tres se cerraron). El objetivo es que **diverger sea imposible de pasar por alto**.

## Qué se sincroniza (idéntico, byte a byte)

1. `src/styles.css` salvo el bloque `app-specific` (entre `/* app-specific:start */` y `/* app-specific:end */`), que es **propio de cada app** y el script y el chequeo ignoran. Hoy: `--z-app-header` en `:root` (cada app tiene su valor: 99999 en Platform, 1000 en Admin, por debajo de los modales).
2. Los componentes base de `components.md`, sus plantillas y estilos.
3. El `layout` (sidebar, header, ancho y padding de página) y sus utilidades.

Lo que **no** se sincroniza: rutas, alias de import, features, `navigation.config.ts` (cada app tiene su menú), los modelos y los `.ts` que difieren por un alias (`app-sidebar`, `app-header`, `app-layout`: ver «Por app» en `components.md`).

## Mecanismo (propuesto)

| Pieza | Qué hace |
|---|---|
| `skills/frontend/design-system/src/` (en el Brain) | La copia canónica: `styles.css` y los componentes base |
| `scripts/sync-design-system.sh` | Copia `src/` a las dos apps. Uso: `sync-design-system.sh --apply` |
| `scripts/check-design-system.sh` | Sin escribir nada, compara las dos apps con `src/` y falla si difieren; además busca los anti-patrones |

El único banner con fondo es el de Cumplimiento y sale de la utilidad canónica `mk-banner` (no de `bg-linear-to-` en una plantilla: eso sigue marcado). Anti-patrones que el chequeo rechaza fuera de `status-indicator`: `mk-hero`, `mk-card`, `border-l-`/`border-t-` de color en contenedores,
`tag-badge`, `rounded-full px-`, el chip hecho a mano (un `span` o `li` con `rounded-control`, `border`, `px-` y `py-0.5|py-1` a la vez: remite a `app-badge`; los botones, las tarjetas seleccionables, los `option-chips` y los `kbd` no son `span`/`li` con ese patrón y no cuentan), `bg-linear-to-` en banners, `shadow-card`, `shadow-xl`, nombres de color de estado literales (`green-`, `amber-`, `red-`), tonos decorativos (`sky-`, `violet-`, `indigo-`, `emerald-`, `blue-`, `orange-`… como `bg-`, `text-`, `border-`, `ring-`, `from-`), las rampas antiguas de estado (`error-`, `success-`, `warning-` como utilidad) y `bg-gradient-to-` en `.ts` y `.html`, y el `<select` nativo (se usa `app-select`).

Flujo para cambiar algo visual: se edita `src/` en el Brain → `sync --apply` → `ng build` en las dos apps → `check` en verde. Nunca se edita un componente base solo en una app.

## Alternativas descartadas por ahora

- **Paquete npm compartido o monorepo**: más robusto, pero cambia CI, despliegue y flujo de PR de los dos repos. Se reabre si la copia con chequeo no basta.
- **Submódulo git**: añade fricción de ramas a un equipo que ya trabaja una rama por ticket.

## Deuda que se registra al aprobar (monkey-registry)

- Los tres puntos de deriva actuales. (El tema de Syncfusion de Platform, dos CSS de 2,8 MB sin ningún uso, se retiró en la ola B junto con `angular.json`; Platform ya no lleva nada de Syncfusion. Admin se despidió del suyo con el `toast` canónico, DT-95: el `z-index` del toast pasó a `--z-toast` en el `styles.css` canónico.)

## Cómo se usa (implementado)

- `src/` espeja `src/` de cada app, archivo por archivo (`src/styles.css`, `src/app/shared/presentation/components/page-header/…`, `src/app/core/presentation/{components,pages}/…`). Hoy: `styles.css`, `page-header`, `data-table` con sus celdas y barra (`person-cell`, `table-toolbar`, `table-filter`), el `html` del layout, del encabezado y del menú lateral, y `sidebar-groups.ts` (lógica pura de los grupos, con su spec; incluye `canReachPath`, la misma fuente de permisos del menú para que una vista pregunte si un rol ve una página). También `directives/` (`busy`, `busy-fields`) y `utils/event-target.ts` (`targetValue` y `targetChecked`: lecturas tipadas de `$event.target` para plantillas; el chequeo de deriva y los specs lo cubren), `modal`, `confirm-dialog`, `overlay-stack`, `side-drawer`, `card`, `donut` `toast-container` (`ToastService` y `app-toast-container`; cada app lo monta una vez en su `AppComponent`, que no es canónico) y el resto de `shared/presentation/components` de `src/`.
- `styles.css`: todo es canónico salvo lo que está entre `/* app-specific:start */` y `/* app-specific:end */`; ese bloque es de cada app y el script lo conserva (`merge_css` lo reinyecta) y `check-design-system.sh` compara solo lo de fuera (`outside_block`). Un archivo sin esos marcadores no se sincroniza (error). Lo que viva dentro del bloque no es deriva; lo que una app añada fuera, sí.
- Lo que **no** se copia porque difiere por los alias de import (`@core/services/…` frente a `@core/domain/services/…`): los `.ts` de `app-sidebar`, `app-header` y `app-layout`. Sus plantillas sí son idénticas; el `.ts` de cada app expone los mismos miembros (`showLabels`, `labelOf`, `sectionLabelKey`…).
- `scripts/sync-design-system.sh [--apply] [--force] [--diff] [--only admin|platform]`: sin `--apply` es un ensayo y no escribe nada.
  - `--apply` se niega (exit 1, lista los archivos bloqueados) a sobrescribir un archivo con cambios sin commitear en el repo de la app (`git status --porcelain`), salvo que ya sea idéntico a lo que escribiría el sync o se pase `--force`. Confirma antes de forzar que esos cambios son los que quieres reemplazar.
  - Cada marcador `app-specific` debe aparecer exactamente una vez en el `styles.css` canónico y en el de la app; si no, error.
  - Antes de sobrescribir (también en ensayo) avisa de las líneas del archivo de la app, fuera del bloque `app-specific`, que desaparecerían.
  - Los archivos se leen y escriben en UTF-8 explícito.
  - Autoprueba: `scripts/selftest.sh` (carpeta temporal; cubre bloqueo por cambios sin commitear, marcador duplicado y líneas perdidas). Corre `python3 -I`.
- Claves i18n del shell nuevas: Admin las guarda en `sidebar.json` y Platform en `shell.json`, con los mismos nombres de clave (`SHELL.NAV.*`, `SHELL.HEADER.*`).
- `scripts/check-design-system.sh [--strict] [--verbose]`: falla (exit 1) si la parte compartida o un componente base difieren del canónico, o si algún par de la escala de riesgo, de los tokens de texto de estado o de los tokens `badge-*` (texto sobre su tinte, D115; se evalúan los `color-mix`) baja de 4,5:1 (se calcula del `styles.css` canónico, claro y oscuro). Los anti-patrones se cuentan por app y son avisos mientras dure la migración; `--strict` los vuelve fallo.
- El chequeo cuenta además `disabled:opacity-*`, `opacity-NN` (en `.ts` y `.html`) y el botón de peligro hecho a mano (`bg-bad!`, `hover:bg-bad`); `--strict` los vigila. Y una sección **i18n** (informativa; con `--strict` falla): toda clave literal `MAYUS.PUNTO` entre comillas en plantillas y `.ts` debe existir en `es` y en `en`, y los dos idiomas deben tener las mismas claves; se ignoran comentarios, claves dinámicas (`${}`, concatenadas) y prefijos de claves existentes. `selftest.sh` cubre estas reglas.
- También cuenta todo `<input>` o `<textarea>` sin color de texto (sin `mk-input`, `mk-checkbox` ni una clase `text-` de color; quedan fuera checkbox, radio, file, hidden, range y color): sin él, el navegador pinta el texto en negro y en modo oscuro no se ve (MD-211, el código TOTP).
- El chequeo imprime además una sección **informativa** (D116; nunca falla, ni con `--strict`): usos de `<app-loading-spinner>` y de `animate-spin` escrito a mano fuera de `shared/presentation/`, que remiten a `app-skeleton` y a `appBusy`.
- El `ds.py` de esa carpeta es el motor de los dos scripts (solo biblioteca estándar de Python).
