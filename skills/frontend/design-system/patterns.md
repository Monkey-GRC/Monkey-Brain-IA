---
id: design-system-patterns
name: Patrones de composición de pantallas (Admin y Platform)
description: Catálogo obligatorio de las 19 composiciones de pantalla (encabezado, tabla, panel de detalle, tarjeta, metadatos, historial, indicadores, formulario, avisos…), con anatomía, estados, archivo canónico del que se copia y errores ya marcados. Leer antes de escribir o rediseñar una pantalla.
type: skill
status: APROBADO por Rod el 2026-11-27 (MD-533). Obligatorio.
---

# Patrones de composición

**Obligatorio** (aprobado por Rod el 2026-11-27, MD-533). Los valores (tokens, tamaños, radios) viven en [README.md](README.md) y el
contrato de cada componente en [components.md](components.md); este archivo dice **cómo se componen** en una pantalla.

**Regla.** Antes de escribir una pantalla, el agente declara en su plan y en su reporte, por cada bloque: «Patrón N · copio de
`ruta:línea`». Una composición que no está aquí **se pregunta a Rod, no se inventa**. Las composiciones únicas (mapa de calor,
organigrama, asistentes) no son patrón: no se copian a otra pantalla sin preguntar.

**Rutas.** `P:` = `Frontend-Platform/src/app/` y `A:` = `Frontend/src/app/` (repos hermanos de este). «Por corregir» = la
referencia es la buena en estructura, pero esas líneas incumplen una receta (§0): se copia la estructura con la receta aplicada,
nunca esas líneas.

## 0. Las 8 recetas (Rod, 2026-11-27)

| # | Qué | Receta | Se copia de |
|---|---|---|---|
| R1 | Etiqueta de un dato (`dt`, o su equivalente sin `dl`) | `text-xs font-medium text-ink-muted`. Nunca `ink-faint` ni `font-semibold` | `P:features/compliance/presentation/components/test-findings/test-findings.html:107` |
| R2 | Aviso o caja de estado (`mk-surface-state-*`) | `p-4` (16 px) y texto `text-sm text-ink` | `P:features/compliance/presentation/components/control-period/control-period.ts:45` |
| R3 | Tarjeta dentro de un detalle | Siempre `app-card`; dentro de un panel (`detail-modal`, `form-modal`), su variante sin sombra (§0.2, **pendiente de construir**; mientras, `app-card` tal cual). Nunca `rounded-card border border-line bg-surface` a mano | `P:features/compliance/presentation/components/control-approval/control-approval.html:10` |
| R4 | Guardar / Cancelar | `div.flex items-center justify-end gap-3` → `button.mk-btn-secondary` «Cancelar» → `button[type=submit].mk-btn` con `[appBusy]`. Tamaño normal (nunca `-sm`), como el pie de un modal | `P:features/team/presentation/views/team-people/team-people.html:284-287` |
| R5 | «Cargar más», «ver más», «ver los N» | Enlace: `button.mk-link mt-4 text-sm underline` al pie de una lista (con `[appBusy]` si pide al servidor); `button.mk-link mt-1.5 text-xs underline` bajo una lista corta. Nunca `mk-btn*` | `P:features/compliance/presentation/components/test-findings/test-findings.html:121` y `:170` |
| R6 | Título de un bloque | Tres niveles fijos: **(a)** sección con línea = `<app-detail-section titleKey [count]>`; **(b)** título de tarjeta = `h3.text-base font-semibold text-ink` (`h2` si la tarjeta cuelga directo de la página); **(c)** subtítulo dentro de una tarjeta = `h4.text-xs font-semibold text-ink-muted`, cuerpo a `mt-1`. Ningún otro tamaño ni línea `border-b` a mano | (a) `detail-section.ts` canónico · (b) `control-approval.html:13` · (c) `test-findings.html:92` |
| R7 | Campo de texto largo | `<app-field labelKey forId hintKey [errorKey]>` + `textarea.mk-textarea` (`rows` 3 o 4). Nunca un `textarea` con clases a mano ni `mk-input !h-auto` | `P:features/compliance/presentation/components/control-level-form/control-level-form.html:12-15` |
| R8 | Código + nombre | `<app-tag class="mr-2 align-middle" [text]="code" />` y el nombre en el mismo `p`, sin «·». Nunca texto plano «CÓDIGO · nombre». En una tabla, columna de código (`app-tag`) y columna de nombre también vale | `P:features/compliance/presentation/components/control-tests/control-tests.ts:68` |

### 0.1 Errores que Rod ya marcó

De `agents/frontend-design.md` («Errores que Rod ya marcó», MD-505) y MD-483. Cada patrón cita los suyos.

| # | Error | # | Error |
|---|---|---|---|
| E1 | Texto pegado al borde: padding mínimo 16–20 px en tarjeta, celda y fila | E7 | Registro como líneas sueltas: si tiene fecha, persona, acción y detalle, es tabla |
| E2 | Texto a media anchura sin motivo; dos ayudas que dicen lo mismo | E8 | Bloque suelto fuera de la rejilla |
| E3 | Alturas distintas en una fila; panel de detalle más alto o bajo que su lista | E9 | Carga sin barra; acto sin respuesta inmediata (spinner en el botón, barra en la zona); botón gris sin explicación |
| E4 | Dos elementos resaltados a la vez; hover en lo que no se pulsa | E10 | Bloque sin acciones que no dice por qué |
| E5 | Botón partido en dos líneas; fecha o persona partidas | E11 | Dona en la esquina; minitarjetas sin centrar; divisor asimétrico |
| E6 | Texto largo que rompe el layout: `line-clamp` + forma de verlo entero (probar con 500 caracteres) | E12 | Correo partido, rol truncado, hueco enorme en una tarjeta |

### 0.2 Pendiente de construir: `app-card` sin sombra (`flat`) y atenuada (`muted`)

`Card` (canónico en `src/app/shared/presentation/components/card/card.ts`) no tiene variante sin sombra. Input que haría falta:
`flat = input(false, { transform: booleanAttribute })`, que añade `shadow-none` a la superficie que toque (`mk-surface`,
`mk-surface-tinted` o `mk-surface-state-*`) sin cambiar borde, radio ni padding (`p-5`). Uso: `<app-card flat>` dentro de un panel. Y `muted` (D4): fondo `bg-canvas` para un bloque secundario (una observación), mismo borde, radio y padding.
Lo construye `frontend-design` con su ticket; hasta entonces nadie lo imita con clases a mano.

### 0.3 Decididas por Rod (2026-11-27)

| # | Caso | Regla |
|---|---|---|
| D1 | Buscador de una lista dentro de un detalle | **Antes del título**, a todo el ancho (MD-499). `control-detail-panel.html:201-205` es referencia por corregir |
| D2 | Título encima de una tarjeta en una página | No hay título suelto encima: pasa a ser el **título de la tarjeta** (nivel b de R6) |
| D3 | Pie con dos acciones que no son Guardar/Cancelar (Aprobar / Devolver) | Como R4: a la derecha, **la secundaria primero y la principal al final** |
| D4 | Tarjeta atenuada (fondo `bg-canvas`, p. ej. la observación de `test-findings`) | Variante **`muted`** de `app-card` (pendiente de construir, §0.2); mientras no exista, se pregunta |
| D5 | `app-card tone` (aviso de página) con `p-5` | **Válido**: R2 fija el mínimo de 16 px y 20 px lo cumple |
| D6 | Barra de selección en lote (patrón 17) | **Fuera del catálogo** hasta que se diseñe y Rod la apruebe: no se construye una nueva sin preguntar |

## Índice

| # | Patrón | Referencia principal |
|---|---|---|
| 1 | Encabezado de página | `page-header.ts:20-38` |
| 2 | Lista o tabla con buscador y filtros | `team-people.html:40-92` |
| 3 | Panel lateral de detalle | `detail-modal.ts:42-90` + `control-detail-panel.html` |
| 4 | Tarjeta con título, estado y acciones | `control-approval.html:9-35` |
| 5 | Metadatos (etiqueta + valor) | `test-findings.html:105-115` |
| 6 | Historial o registro | `control-history.html:1-76` |
| 7 | Bloque de indicadores | `control-score.html:11-55` (por corregir) |
| 8 | Formulario en modal | `publish-version-form.html:1-49` (por corregir) |
| 9 | Desplegable dentro de una fila | `test-findings.html:1-46` |
| 10 | «Ver más» y «cargar más» | `expandable-text.ts:24`, `test-findings.html:120-122` |
| 11 | Bloque de código | `test-findings.html:128-157` |
| 12 | Estados: carga, vacío, error | `team-people.html:32-92` |
| 13 | Barra de acciones y pies | `detail-modal.ts:77-86`, `form-modal.ts:58-61` |
| 14 | Avisos | `control-period.ts:45` |
| 15 | Fila código + nombre + estado | `control-tests.ts:60-112` |
| 16 | Lista de filas de acción o de ajuste | `team-people.html:212-275` |
| 17 | Barra de selección en lote | **fuera del catálogo (D6): preguntar** |
| 18 | Visor de archivo | `document-reader.html:39-76` |
| 19 | Modal auxiliar sobre un panel de detalle | `test-findings.html` |

## 1. Encabezado de página

- **Cuándo:** arriba de toda vista de primer nivel. **No:** dentro de un panel o modal (tienen su cabecera propia).
- **Anatomía:**
  1. Raíz de la vista: `section.w-full pb-10`.
  2. `<app-page-header [title] [description] [backLink]? [backLabel]?>`: título `h1.truncate text-2xl font-semibold text-ink`, descripción `p.mt-1 text-sm text-ink-muted`, volver con `arrow_back` a `text-[20px]`.
  3. Acción primaria: `<button actions class="mk-btn">` (o `<a actions class="mk-btn">` si navega). Una sola primaria.
  4. Pestañas de la página en la ranura `[tabs]`, nunca sueltas debajo.
- **Estados:** con y sin volver; con y sin acción (según rol); con pestañas.
- **Referencia:** `P:shared/presentation/components/page-header/page-header.ts:20-38` y `P:features/team/presentation/views/team-people/team-people.html:1-6`.
- **Errores:** E2, E5. Todo `h1` es de 24 px (README §3); no se rehace el encabezado a mano.

## 2. Lista o tabla con buscador y filtros

- **Cuándo:** toda colección de registros, en una página o en una sección de un detalle. **No:** `<table>` propio ni `divide-y` a mano (README §2).
- **Anatomía en página:**
  1. `<app-table-toolbar ariaLabelKey searchPlaceholderKey? [query]>`; filtros `<app-table-filter filters labelKey [options] [value]>`; «Quitar filtros», solo si hay alguno: `<button filters class="mk-btn-secondary">`.
  2. `<app-data-table captionKey [columns] [rows] [rowKey] [page] [loading] [clickable]="true" emptyIcon="" emptyTitleKey emptyDescriptionKey>`.
  3. Celdas: `app-person-cell`, `app-badge kind="attribute"`, `app-status-indicator`; línea secundaria `p.text-xs text-ink-muted`; fecha `span.text-sm text-ink-muted`; dato ausente `span.text-ink-faint` «—».
  4. Vacío por filtros: `<app-empty-state tableEmpty icon="" …>` con `<button action class="mk-btn-secondary-sm">`.
- **Anatomía en un detalle:** `<app-detail-section titleKey [count]>` → `<app-search-field class="mb-4 block w-full" inputId placeholderKey>` (posición: §0.3) → `<app-data-table [compact]="true" [page] [pageSizes]="[10, 25]" [clickable]="true" emptyIcon="" emptyTitleKey>` (una sola columna: `[hideHeader]="true"`); sin elementos, `p.text-sm text-ink-muted`.
- **Estados:** carga (`[loading]` sobre la misma tabla, no una segunda tabla), vacía, vacía por filtros, error (patrón 12), paginada, sin permiso (sin las acciones de gestión).
- **Referencia:** `P:features/team/presentation/views/team-people/team-people.html:40-92` y `P:features/compliance/presentation/components/control-detail-panel/control-detail-panel.html:201-213`.
- **Errores:** E1, E4 (hover solo con `clickable`), E5, E6, E9, E12.

## 3. Panel lateral de detalle

- **Cuándo:** el detalle de un elemento que se abre sobre su lista (control, riesgo, causa, documento, aviso, catálogo). **No:** formularios ni el detalle de una persona o grupo (patrón 8, `form-modal`).
- **Anatomía:**
  1. `<app-detail-modal titleKey [heading] [tabs] [activeTab] tabsLabelKey [loading] [loadingTabs] [guarded] testId>`; `variant` según README §1.
  2. `[meta]`: `div.flex flex-wrap items-center gap-2` con `app-tag` del código, `app-tag` de cada requisito, `app-badge kind="attribute"`, `app-status-indicator`.
  3. `[summary]`: el bloque de indicadores (patrón 7) o su esqueleto.
  4. Cada pestaña: `div[hidden]` (no `@if`) con `data-tab` y `flex flex-col gap-10` (Resumen) o `gap-8` (resto).
  5. Lo corto en dos columnas alineadas arriba: `grid items-start gap-x-10 gap-y-8 lg:grid-cols-2`; cada bloque, `app-detail-section` (R6a) con su acción `<button actions class="mk-btn-secondary-sm">` e icono a 16 px. Las listas, a todo el ancho debajo (patrón 2).
  6. Texto de lectura: `p.max-w-prose whitespace-pre-line text-pretty text-sm leading-relaxed text-ink-muted`.
  7. Tarjetas dentro: R3. Error de una acción arriba del cuerpo: patrón 14 con `mb-5`.
  8. Pie: «Cerrar» (lo pone el componente); `[footerStart]` `mk-btn-danger-outline` con icono a 20 px; `[actions]`; la primaria al final.
  9. Confirmación destructiva fuera del panel: `<app-confirm-dialog tone="danger">`.
- **Estados:** cargando (cabecera y cuerpo con esqueleto de su forma), error de carga (patrón 12), editando (`guarded`), sin permiso (sin acciones), cada pestaña vacía.
- **Referencia:** `P:shared/presentation/components/detail-modal/detail-modal.ts:42-90` y `P:features/compliance/presentation/components/control-detail-panel/control-detail-panel.html:3-91`, `:102-116`, `:200-213`, `:330-339`. Por corregir: `:97` (R2), `:118-128` y `:161-175` (R7, R4), `:255-264` (R1).
- **Errores:** E2, E3, E8 (ningún bloque suelto fuera de la rejilla), E9, E10.

## 4. Tarjeta con título, estado y acciones

- **Cuándo:** un bloque autónomo con título, un estado y una o dos acciones. **No:** tarjeta dentro de tarjeta; para separar dentro de una tarjeta, líneas y espacio.
- **Anatomía:**
  1. Rejilla: `grid gap-4 md:grid-cols-2`; una sola tarjeta, `md:col-span-2`.
  2. `<app-card class="h-full">` (R3; en un panel, `flat` cuando exista) → `div.flex h-full flex-col gap-3`.
  3. Cabecera: `div.flex flex-wrap items-center justify-between gap-x-3 gap-y-2` → título R6b y, con una sola acción, el botón a la derecha (`mk-btn-sm` o `mk-btn-secondary-sm`).
  4. Cuerpo: `div.flex flex-col items-start gap-2` → `app-status-indicator` → `<app-expandable-text class="min-w-0 max-w-prose" textClass="text-pretty text-sm text-ink-muted">`.
  5. Subbloques: R6c (`h4.text-xs font-semibold text-ink-muted` + cuerpo `mt-1 text-sm leading-relaxed text-ink`).
  6. Con dos acciones, al pie: `div.mt-auto flex flex-wrap items-center gap-2 pt-1` (§0.3).
  7. Pie con enlace: `div.mt-auto border-t border-line pt-3` + `a.mk-link underline text-sm`.
- **Tarjeta de un ítem en una lista:** `ul.flex flex-col gap-4` → `li` → `<app-card>` (R3) con cabecera `flex items-start justify-between gap-3`: `p.min-w-0 flex-1 break-words text-pretty text-sm font-semibold leading-snug text-ink` + `app-status-indicator class="shrink-0"`; secciones `mt-5 flex flex-col gap-5` (R6c); pie de metadatos (patrón 5, en línea base).
- **Estados:** con una, dos o ninguna acción (sin acciones, una línea que diga por qué, E10); estado de cada tono; texto largo (E6).
- **Referencia:** `P:features/compliance/presentation/components/control-approval/control-approval.html:9-35`. Por corregir: la tarjeta de ítem de `P:features/compliance/presentation/components/test-findings/test-findings.html:46-119` (`li` a mano, R3) y las fichas de `P:features/team/presentation/views/team-people/team-people.html:113-206` (cajas y cabecera con línea a mano, R3 y R6).
- **Errores:** E1, E3, E4, E8, E10, E12.

## 5. Metadatos (etiqueta + valor)

- **Cuándo:** datos cortos de un registro (periodicidad, responsable, fecha, versión). **No:** listas largas o repetidas (patrón 2).
- **Anatomía, varios en línea:** `dl.flex flex-wrap gap-x-10 gap-y-3` → `div.flex flex-col gap-1` (uno largo: `flex min-w-0 flex-1 flex-col gap-1`) → `dt` R1 → `dd.text-sm font-medium text-ink` (principal) o `dd.text-sm text-ink`; apoyo `span.block text-xs text-ink-muted`.
- **Anatomía, seguimiento en una línea base:** `dl.mt-5 flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t border-line pt-4 text-sm` → `div.flex items-baseline gap-1.5 whitespace-nowrap` → `dt` R1 → `dd` `font-medium text-ink` con dato o `text-ink-muted` sin él; fechas `tabular-nums`.
- **Anatomía, tabla etiqueta | valor:** `dl.divide-y divide-line px-5 text-sm` → `div.grid grid-cols-[minmax(5.5rem,7rem)_1fr] items-center gap-x-3 py-2` → `dt` R1 → `dd.text-ink` (con icono: `flex items-center gap-2`, icono a `text-[20px] leading-none`).
- **Estados:** dato ausente («—» en `text-ink-faint` o la frase de lo que falta); valor largo (correo: `break-all`, nunca truncado, E12).
- **Referencia:** `P:features/compliance/presentation/components/test-findings/test-findings.html:105-115`; `P:features/team/presentation/views/team-people/team-people.html:165-205` (el `dl`; su contenedor, por corregir R3). En línea: `P:features/compliance/presentation/components/control-detail-panel/control-detail-panel.html:253-269`, por corregir (R1).
- **Errores:** E1, E5, E12.

## 6. Historial o registro

- **Cuándo:** lo que pasó con un registro, acto por acto. **No:** líneas o píldoras sueltas (E7).
- **Anatomía:**
  1. `<app-detail-section titleKey>` (R6a).
  2. `<app-data-table [alignTop]="true" emptyIcon="" emptyTitleKey>`, sin clic.
  3. Fecha: `span.block whitespace-nowrap pt-2 text-sm tabular-nums text-ink`.
  4. Persona: avatar `flex size-9 shrink-0 items-center justify-center rounded-full bg-tint-strong text-xs font-semibold text-tint-ink` + nombre `min-w-0 text-pretty break-words pt-2 text-sm font-medium`; con enlace, el `a` envolvente y el nombre en `text-action underline underline-offset-2`. Sistema: `span.flex min-h-9 items-center text-sm text-ink-muted`.
  5. Acción: `p.flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5 pt-2 text-sm text-ink` con la frase, `app-status-indicator` y código + nombre (R8).
  6. Detalle: `<app-expandable-text class="max-w-prose pt-2" textClass="text-pretty text-sm text-ink">`; sin motivo, `span.block pt-2 text-sm text-ink-faint` «—».
  7. Más páginas: R5 (`mk-link mt-4 text-sm underline` con `[appBusy]`).
- **Estados:** carga (la misma tabla con `[loading]="true" [loadingRows]="3"` en `app-skeleton-region`), vacío, error con reintento (`div.flex items-center gap-3 text-sm text-ink-muted` + `mk-btn-secondary-sm whitespace-nowrap`), cargando más, acto del sistema, motivo de 500 caracteres.
- **Referencia:** `P:features/compliance/presentation/components/control-history/control-history.html:1-76`. Por corregir: `:78` (R5).
- **Errores:** E5, E6, E7, E9.

## 7. Bloque de indicadores

- **Cuándo:** el estado de cumplimiento de algo: estado, porcentaje y cobertura juntos, nunca un porcentaje solo. **No:** filas de KPI de una página (son `app-metric-card`, components.md).
- **Anatomía, franja del detalle:** `div.@container` → `div.-mx-5 grid grid-cols-2` (+ `@2xl:grid-cols-3`) → celda `flex min-w-0 flex-col gap-1 px-5 py-1` con divisores → etiqueta R1 → estado: `flex items-center gap-3` con `app-donut [size]="64" [tone]` y la columna `flex min-w-0 flex-col items-start gap-1` (`app-status-indicator`, «N de M» `p.text-xs tabular-nums text-ink-muted`); nivel y cobertura: `p.text-sm font-semibold tabular-nums text-ink` + `p.text-xs tabular-nums text-ink-muted`.
- **Anatomía, resumen en celdas centradas:** contenedor R3 con `grid sm:grid-cols-3 sm:divide-x max-sm:divide-y divide-line` → celda `flex min-w-0 flex-col items-center justify-center gap-1.5 px-3 py-4 text-center` → etiqueta R1 (con icono a 20 px) → cifra `p.text-2xl font-semibold leading-8 tabular-nums text-ink` → `app-badge size="sm" kind="status"` → cobertura `p.whitespace-nowrap text-xs tabular-nums text-ink-muted`.
- **Estados:** sin medir (`null`: anillo vacío, «—» en `text-ink-faint`), sin requisitos, vista técnica (3 celdas) y de negocio (2), panel estrecho (2 columnas).
- **Referencia:** `P:features/compliance/presentation/components/control-score/control-score.html:11-55`, por corregir (`:21`, `:36`, `:50`, R1); `P:features/team/presentation/views/team-people/team-people.html:131-159`, por corregir (contenedor a mano, R3).
- **Errores:** E3, E11, E12.

## 8. Formulario en modal

- **Cuándo:** crear, editar o confirmar con datos; también el detalle de una persona o grupo. **No:** el detalle de un elemento (patrón 3).
- **Anatomía:**
  1. `<app-form-modal titleKey descriptionKey size [busy] [guarded] testId (closed)>`; sin X.
  2. `<form id="…-form" class="flex flex-col gap-5" novalidate>`.
  3. Error del servidor, lo primero: `div[role=alert].flex items-start gap-2 p-4 text-sm text-ink mk-surface-state-bad` (R2).
  4. Campos: `app-field` + `input.mk-input`, `textarea.mk-textarea` (R7), `app-select`, `app-date-picker` o `app-file-upload`. Error bajo un campo: `[errorKey]` o `p.mt-1.5 text-xs text-bad-ink role=alert`.
  5. Grupo: `fieldset.flex flex-col gap-3` + `legend.mb-1.5 text-sm font-medium text-ink` + ayuda `p.text-xs text-ink-muted`.
  6. Contador bajo un texto largo: `div.mt-1.5 flex items-start justify-between gap-3 text-xs text-ink-muted` con la ayuda y `span.shrink-0 tabular-nums`.
  7. Aviso al final: patrón 14.
  8. Acción en el pie: `<button actions type="submit" form="…-form" [disabled] [appBusy] class="mk-btn">`; Cancelar lo pone el componente (R4).
- **Estados:** vacío, con error por campo, error del servidor, enviando (`busy`), con cambios (`guarded`), sin opciones que elegir.
- **Referencia:** `P:features/documents/presentation/components/publish-version-form/publish-version-form.html:1-49` (con el modal en `P:features/documents/presentation/components/document-detail-panel/document-detail-panel.html:213-220`) y `P:features/compliance/presentation/components/control-level-form/control-level-form.html:1-19`. Por corregir las dos en la caja de error (`:4` `p-3`, `:5` `p-3.5`; R2).
- **Errores:** E2 (una sola ayuda), E5, E9.

## 9. Desplegable dentro de una fila

- **Cuándo:** una fila con un detalle largo que solo interesa a veces (las brechas de una prueba). **No:** `<details>` nativo ni cabecera con chevron.
- **Anatomía:** `div.flex w-full flex-col items-center` → disparador `button.mk-link inline-flex items-center gap-1 text-sm underline` con `[attr.aria-expanded]` e icono a `text-[16px]` → contenido `mt-4` a todo el ancho y a la izquierda (`w-full text-left`), con `data-findings-expanded`; la fila pasa a una columna (`lg:grid-cols-2 lg:has-[[data-findings-expanded]]:grid-cols-1`).
- **Estados:** cerrado; cargando (esqueleto con la forma de la tarjeta); error (`div[role=alert].mt-4 flex flex-col items-center gap-3` + `mk-btn-secondary-sm` con `refresh` a 16 px); vacío (`p.mt-3 text-pretty text-sm text-ink-muted`); abierto con muchos.
- **Referencia:** `P:features/compliance/presentation/components/test-findings/test-findings.html:1-46` y `P:features/compliance/presentation/components/control-tests/control-tests.ts:64-91`.
- **Errores:** E3, E6, E9.

## 10. «Ver más» y «cargar más»

- **Cuándo:** un texto largo se recorta, una lista muestra los primeros N o el servidor entrega por páginas. **No:** «hay más» sin forma de verlo.
- **Anatomía:**
  - Texto: `<app-expandable-text class="max-w-prose" [text] [lines] textClass="text-pretty text-sm leading-relaxed text-ink-muted">`; el enlace solo sale si se corta.
  - Primeros N: `ul.mt-1 text-sm text-ink 2xl:columns-2 2xl:gap-x-8`, `li.break-inside-avoid break-words py-0.5`; «ver los N» R5; si aún faltan, `p.mt-1.5 text-xs text-ink-muted`.
  - Página siguiente: R5 con `[appBusy]`.
- **Estados:** cabe (sin enlace), cortado, abierto, cargando más, error al cargar más.
- **Referencia:** `P:shared/presentation/components/expandable-text/expandable-text.ts:24`; `P:features/compliance/presentation/components/test-findings/test-findings.html:120-122` y `:160-176`.
- **Errores:** E6, E9.

## 11. Bloque de código

- **Cuándo:** un comando, plantilla o identificador que se copia tal cual. **No:** códigos de control (son `app-tag`).
- **Anatomía:** `pre.my-1 overflow-x-auto whitespace-pre rounded-control border border-line px-3 py-2.5 font-mono text-xs leading-relaxed text-ink`, `bg-canvas` (`bg-surface` si el fondo ya es gris), `tabindex="0"`. No parte la línea: desplaza.
- **Estados:** línea larga, varias líneas, sobre fondo gris.
- **Referencia:** `P:features/compliance/presentation/components/test-findings/test-findings.html:128-157`.
- **Errores:** E6.

## 12. Estados: carga, vacío y error

- **Cuándo:** toda región que pide datos. **No:** spinner en bloque (D116), «No hay datos», `alert()`.
- **Anatomía:**
  - Página. Error: `<app-empty-state icon="" titleKey descriptionKey="COMMON.CHECK_CONNECTION">` + `<button action class="mk-btn">`. Carga: `[loading]` de la tabla. Vacío: el de la tabla; por filtros, `app-empty-state tableEmpty` + `mk-btn-secondary-sm`.
  - Panel. Carga: `detail-modal [loading] [loadingTabs]` + `app-skeleton-region` con la forma del cuerpo. Error: `div.py-10 text-center` + `p.mt-3 text-base font-semibold text-ink` + `p.mt-1 text-sm text-ink-muted` + `button.mt-4 mk-btn` con `refresh` a 20 px.
  - Fila o región interna. Carga: `app-skeleton-region` con la forma; error: `div[role=alert].mt-4 flex flex-col items-center gap-3` + `p.text-pretty text-sm text-ink-muted` + `mk-btn-secondary-sm`; vacío: `p.mt-3 text-pretty text-sm text-ink-muted`.
  - Sección sin elementos: `p.text-sm text-ink-muted`.
  - Botón que lanza algo: `[appBusy]`, nunca un spinner a mano.
- **Estados:** los cuatro (carga, vacío, error, sin permiso) en cada región.
- **Referencia:** `P:features/team/presentation/views/team-people/team-people.html:32-92`, `P:features/compliance/presentation/components/control-detail-panel/control-detail-panel.html:31-91` y `P:features/compliance/presentation/components/test-findings/test-findings.html:8-33`.
- **Errores:** E9, E10.

## 13. Barra de acciones y pies

- **Cuándo:** donde se decide. **No:** una acción escrita como texto azul (README §2), un botón achicado a mano.
- **Anatomía:**
  - Pie del panel: el de `detail-modal` (patrón 3, punto 8).
  - Pie del modal: el de `form-modal` (Cancelar `mk-btn-secondary` y una sola `mk-btn`).
  - Guardar / Cancelar de un formulario en línea: R4.
  - Pie de tarjeta: `div.mt-auto flex flex-wrap items-center gap-2 pt-1` con `mk-btn-sm` y `mk-btn-secondary-sm` (§0.3).
  - Acciones de una fila de tabla: `div.flex flex-nowrap items-center justify-end gap-2` con botones `-sm` y `whitespace-nowrap`.
  - Confirmación: `app-confirm-dialog`, nunca una caja en línea.
- **Estados:** enviando (`[appBusy]` en el botón pulsado), deshabilitado con su motivo visible, sin permiso (no se pinta).
- **Referencia:** `P:shared/presentation/components/detail-modal/detail-modal.ts:77-86`, `P:shared/presentation/components/form-modal/form-modal.ts:58-61`, `P:features/team/presentation/views/team-people/team-people.html:284-287`, `P:features/compliance/presentation/components/control-approval/control-approval.html:27-33` y `P:features/compliance/presentation/components/control-exceptions-section/control-exceptions-section.html:46-53`.
- **Errores:** E5, E9, E10.

## 14. Avisos

- **Cuándo:** el error de una acción que se queda en pantalla, una advertencia antes de guardar, un resultado que no cabe en un toast. **No:** el éxito de una acción (toast) ni texto rojo sin caja.
- **Anatomía:**
  - Error: `div[role=alert].flex items-start gap-2 p-4 text-sm text-ink mk-surface-state-bad` → `span` + reintento opcional `button.mk-btn-secondary-sm ml-auto whitespace-nowrap`. En un panel, `mb-5`; en un formulario, sin margen (lo separa el `gap-5`).
  - Advertencia o resultado: `p.mk-surface-state-warn p-4 text-sm text-ink` (u `-ok`).
  - Aviso de página con acción: `<app-card tone="warn" role="note">` → `div.flex flex-wrap items-center justify-between gap-3` → `p.min-w-0 flex-1 text-sm text-ink` con `strong.font-semibold` + `button.mk-btn`.
- **Estados:** con y sin reintento, texto largo, sin permiso para la acción (el texto dice a quién pedirlo).
- **Referencia:** `P:features/compliance/presentation/components/control-period/control-period.ts:45`; estructura del error en `P:features/compliance/presentation/components/control-detail-panel/control-detail-panel.html:96-100`, por corregir (`p-3.5`, R2); `P:features/compliance/presentation/views/overview/overview.html:39-47`.
- **Errores:** E1, E2, E6.

## 15. Fila código + nombre + estado

- **Cuándo:** una prueba, requisito, causa o control listado dentro de un detalle.
- **Anatomía:** fila `div.grid items-stretch gap-x-8 gap-y-4 px-2 py-2.5 lg:grid-cols-2` → izquierda `div.flex min-w-0 flex-col gap-2 self-start` → cabecera `flex flex-wrap items-start justify-between gap-x-3 gap-y-2` → nombre `p.text-sm font-semibold leading-snug text-ink` con R8 → atributos `p.mt-1 text-xs font-medium text-ink-faint` (es un valor, no una etiqueta: R1 no aplica) → `app-status-indicator` a la derecha → descripción `app-expandable-text class="max-w-prose"` → derecha, «cómo se cumple»: R3, contenido `flex flex-1 flex-col items-center justify-center gap-2 text-center`, título `p.text-sm font-semibold text-ink` + `app-status-indicator`, texto `p.max-w-prose text-pretty text-sm text-ink-muted`.
- **Estados:** cumple, no cumple (con desplegable, patrón 9), sin activos, descripción larga.
- **Referencia:** `P:features/compliance/presentation/components/control-tests/control-tests.ts:60-112`. Por corregir: las cajas de `:84` y `:104` (R3).
- **Errores:** E3, E6, E11.

## 16. Lista de filas de acción o de ajuste

- **Cuándo:** las acciones de un registro o los ajustes de una sección: icono, título, una línea y chevron. **No:** acciones de una sola tarjeta (patrón 13).
- **Anatomía:** contenedor R3 con título R6b → `ul.divide-y divide-line` → `button.flex w-full items-center gap-4 px-5 py-3 text-left transition-colors enabled:hover:bg-tint focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-action/40 disabled:cursor-not-allowed` → icono `text-[24px] leading-none text-ink-muted` → `span.min-w-0 flex-1` (título `block text-sm font-semibold text-ink`, línea `block text-xs text-ink-muted`) → chevron `text-[20px] leading-none text-ink-faint`. Destructiva: icono y título `text-bad-ink`.
- **Estados:** cada acción según rol y estado (la propia cuenta, activa, pendiente, inactiva), en curso (`[appBusy]`), ninguna acción (se dice por qué, E10).
- **Referencia:** `P:features/team/presentation/views/team-people/team-people.html:212-275` (las filas; el contenedor de `:210-211`, por corregir R3 y R6).
- **Errores:** E1, E4, E10.

## 17. Barra de selección en lote

Sin versión aprobada: hoy hay tres recetas distintas (`services-list.html:35-43`, `assignment.html:49-78`, `assign-people-form.html:35-40`). **No se copia ninguna ni se compone una nueva: se pregunta a Rod.**

## 18. Visor de archivo

- **Cuándo:** ver un PDF o una imagen sin salir de la pantalla.
- **Anatomía:** `<app-card [padded]="false" class="min-w-0 overflow-hidden">` → lienzo `div.flex h-[70vh] items-center justify-center bg-canvas` → `iframe.h-full w-full border-0` o `img.max-h-full max-w-full object-contain` → pie `div.flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3 text-xs text-ink-muted` con `mk-btn-secondary-sm`.
- **Estados:** cargando (`app-skeleton shape="block" height="70vh"`), PDF, imagen, solo descarga, error (`div[role=alert].flex flex-col items-center gap-3 p-6 text-center text-sm text-ink-muted` + `mk-btn-secondary-sm`), enlace vencido.
- **Referencia:** `P:features/documents/presentation/views/document-reader/document-reader.html:39-76`. Dentro de un modal: `P:features/compliance/presentation/components/control-evidence/control-evidence.html:279-304`.
- **Errores:** E3, E9.

## 19. Modal auxiliar sobre un panel de detalle

Aprobado por Rod el 2026-11-27 (MD-502).

- **Cuándo:** una fila del panel tiene una lista con detalle propio que, desplegada dentro, anidaría tres cajas (las brechas de una prueba). **No:** un detalle corto (patrón 9) ni un formulario (patrón 8).
- **Anatomía:** en la fila, enlace `button.mk-link inline-flex items-center gap-1 text-sm underline` con `aria-haspopup="dialog"` y, ya cargados, los contadores (`app-status-indicator`) al lado. El modal es `<app-detail-modal class="text-left" variant="wide" titleKey>`: centrado, `max-w-6xl` y alto fijo, X arriba y «Cerrar» solo a la derecha del pie. `[meta]` lleva el código y el nombre (R8) y, debajo, los contadores. El cuerpo es `<app-data-table [compact] [alignTop] [clickable] [expandedKey] (rowClick)>`, con una fila por ítem y `<ng-template appRowDetail>` como acordeón (una fila abierta a la vez; el detalle va sobre `bg-canvas`, en `grid lg:grid-cols-2` con subtítulos R6c). Al final, «Cargar más» (R5).
- **Estados:** cargando (`[loading]` de la tabla), vacío (`app-empty-state tableEmpty`), error (patrón 12, panel) y error al cargar más. Al cerrar el modal se cancela lo que esté en curso.
- **Referencia:** `P:features/compliance/presentation/components/test-findings/test-findings.html` y `P:shared/presentation/components/data-table/data-table.html` (`appRowDetail`).

Las pantallas que hoy no cumplen estas recetas, por receta y con `ruta:línea`, están en [`patterns-pendientes.md`](patterns-pendientes.md).
