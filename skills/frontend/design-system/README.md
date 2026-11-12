---
id: design-system
name: Sistema de diseño de Monkey (Admin y Platform)
description: Fuente única de verdad visual de los dos frontends: principios, qué se permite y qué no, tokens y cómo se mantienen sincronizados. Leer antes de tocar cualquier estilo o componente de UI.
type: skill
status: PROPUESTA de la Fase 2. No está aprobada; nada de esto se ha aplicado a los repos.
---

# Sistema de diseño de Monkey

Un solo diseño para `Frontend` (admin) y `Frontend-Platform` (cliente). **Este directorio es el dueño**;
los repos reciben una copia (ver `sync.md`). Si el código y este documento difieren, uno de los dos está mal y se corrige en el mismo cambio.

Referencia de calidad: Vanta (orden, densidad, jerarquía) **combinada con Donezo** (decisión de Rod, rediseño paso 1): de Donezo se toma
el **shell flotante**, no su color ni sus radios. No se copian marcas, textos, logos ni el verde; el azul `#046cc4` y Outfit se quedan.

**Shell flotante**: lienzo gris claro (`canvas`); el sidebar, el header y el área de contenido son **paneles separados** con margen
entre sí y respecto al borde (el sidebar flota). El header es un panel propio (buscador, ayuda, usuario), no una barra pegada. El
contenido vive en un panel **blanco** igual que el sidebar y el header (`surface`); las cards se distinguen sobre él por su borde de 1 px y
`shadow-soft`, no por el color de fondo: un solo nivel de contenedor.
Los textos siguen `monkey-ui-copy`; este documento solo cubre la capa visual.

## 1. Principios

1. **El dato es lo primero que se ve**, no la decoración. Ante la duda de añadir un elemento decorativo, no se añade.
2. **Jerarquía por tipografía y espacio**, no por cajas. Máximo **un** nivel de contenedor.
3. **El color significa algo**: estado (cumple / no cumple / pendiente / sin medir) y acción primaria. Nada más.
4. **Densidad respirable**: tablas y listas para datos repetitivos; filas limpias, columnas alineadas, acciones al extremo.
5. **El detalle va en un panel lateral**, no en una página nueva ni saturando la actual. Los formularios de crear o editar, y el detalle de una persona o un grupo, van en un **modal** centrado (`form-modal`), sin X: Cancelar en el pie.
6. Las dos apps se ven igual: lo que cambia entre ellas son rutas y alias, nunca estilos.

## 2. Qué se permite y qué no en una página

| Prohibido | En su lugar |
|---|---|
| Píldoras o chips decorativos (servicio, norma, país, rol) | Texto plano; o `tag` neutro (gris, sin icono) solo si es un código que se filtra |
| Estado como pastilla rellena | `status-indicator`: punto de color + texto |
| Tabla con markup propio (`<table>`, una card con filas, `divide-y`), también la lista corta de un panel lateral | `data-table` y sus celdas (`person-cell`, `status-indicator`, `tag`) con `table-toolbar` y `table-filter`; contrato en `components.md`, «Tabla única» |
| Borde lateral o superior de color en una tarjeta; barra de color junto a un título | Línea fina neutra; el estado va en `status-indicator`. (El indicador lateral del ítem activo del menú sí se permite.) |
| Banner con degradado o círculos decorativos | `page-header` sin fondo. **Única excepción** (decisión de Rod): el banner `app-compliance-banner` del shell de Cumplimiento (ver abajo); ninguna otra vista lo usa |
| Cabecera de tarjeta con fondo pastel | Título de `section` con línea inferior de 1 px |
| Tarjeta dentro de tarjeta | Una sola capa; lo interno se separa con líneas y espacio |
| Icono dentro de un cuadro o círculo de color | Icono lineal monocromo, sin fondo |
| Sombras en contenedores (`shadow-xl`…) | Borde de 1 px, más `shadow-soft` (mínima) en cards. Sombra real solo en capas flotantes (menú, modal, drawer) |
| Azul como decoración | Azul `primary` solo en la acción primaria y los links |
| Más de una acción primaria por vista | Una primaria; el resto, secundarias o texto |

Se mantiene: avatar con iniciales del perfil, barras de progreso finas, donas de avance (`donut`), iconos lineales, el semáforo de estado.

**Excepción: el banner de Cumplimiento.** Solo el shell de Cumplimiento (`compliance-shell`, Platform) puede llevar un banner con fondo, y solo mediante `app-compliance-banner` y la utilidad `mk-banner`; no se abre a Inicio, Mi empresa, Equipo ni a ninguna otra vista. Reglas que cumple: degradado `brand-700` a `brand-500` (en oscuro `brand-900` a `brand-700`) y dos círculos con 8 % y 5 % de opacidad, todo por tokens; radio `rounded-panel`; texto blanco con contraste de 5,4:1 o más; sin iconos, logos ni flecha de volver; el marco va como texto con borde fino (no es una píldora rellena); una línea de contexto con datos que la sección ya cargó (sin llamadas nuevas); se apila en móvil. El banner no cambia el resto de reglas: dentro de las secciones siguen valiendo las de arriba.

## 3. Tokens

Se definen una vez en `@theme` de `styles.css` (Tailwind v4, sin `tailwind.config`). Los valores exactos de color
**se leen del `styles.css` actual** (la identidad no cambia: Outfit, `brand-500 = #046cc4`, `canvas = #f1f5fa`); lo nuevo es la capa semántica y las escalas que hoy faltan.

**Color (semántico, sobre las rampas existentes)**

| Token | Uso | Sale de |
|---|---|---|
| `--color-surface` | fondo de card y de panel (sidebar, header) | blanco |
| `--color-canvas` | lienzo exterior del shell | `#e9edf3` |
| `--color-line` | bordes y divisores de 1 px | `gray-200` |
| `--color-ink` / `--color-ink-muted` / `--color-ink-faint` | texto principal / secundario / etiquetas | `gray-900` / `600` / `500` |
| `--color-action` (+ `-hover`) | acción primaria y links | `brand-500` |
| `--color-tint` / `--color-tint-strong` / `--color-tint-ink` | tinte suave de marca: card de apoyo, hover, ítem activo del menú, pista de barras; texto sobre tinte | `brand-50` / `brand-100` / `brand-700` (en oscuro: `brand-400` al 12 % / 22 % sobre `surface`, y `brand-300`) |
| `--color-data-1` … `--color-data-5` | categorías (el color de cada marco en su dona); no estado, y no se usa en las KPI | ver «Paleta de datos» |
| `--color-scrim` | fondo oscurecido tras un modal, un drawer o el menú móvil (`bg-scrim`); ninguna capa escribe `bg-black/50` | negro al 50 % |
| `--color-ok` · `--color-bad` · `--color-warn` · `--color-neutral` | únicamente estado | `success-600`, `error-600`, `warning-500`, `gray-400` |
| `--color-ok-ink` · `--color-warn-ink` · `--color-bad-ink` | una frase o una cifra en color de estado (error de un campo, aviso): `ok`/`warn`/`bad` son rellenos y puntos (hasta 3,7:1 sobre blanco) y no valen como texto | `success-700`, `warning-700`, `error-700` (en oscuro `success-300`, `warning-300`, `error-300`) |
| `--color-risk-low\|moderate\|high\|critical` y sus `-on`, `-bg`, `-ink` | la **escala de nivel de riesgo** (ver abajo); no es estado | valores propios, claro y oscuro |

Los colores de estado se piden por token; **ningún `.ts` ni template escribe `green-600` o `amber-500`**.
El modo oscuro redefine los mismos tokens bajo `.dark`; ninguna pantalla se escribe dos veces.

**Escala de riesgo** (decisión de la ola B): el nivel de un riesgo (bajo, moderado, alto, crítico; `enums.md` `risk_level`) y la severidad de un hallazgo (crítica, alta, media = moderada, baja) tienen sus propios tokens y **no se mezclan con `ok`/`warn`/`bad`**: estos dicen cómo va un control o una prueba (cumple, pendiente, no cumple); la escala dice **cuán grande** es un riesgo, así que un riesgo «bajo» no es «ok» ni uno «crítico» es «bad», y los dos pueden convivir en una misma card. Cada nivel tiene cuatro tokens, ninguno alias de un token de estado:

| Token | Para qué | Claro | Oscuro |
|---|---|---|---|
| `risk-X` | relleno intenso: casilla del mapa de calor con riesgos | `#15803d` · `#facc15` · `#c2410c` · `#b91c1c` | `#4ade80` · `#facc15` · `#fb923c` · `#f87171` |
| `risk-X-on` | texto sobre ese relleno | `#ffffff` (bajo, alto, crítico) · `#422006` (moderado) | `#052e16` · `#422006` · `#431407` · `#450a0a` |
| `risk-X-bg` | relleno suave: casilla vacía, etiqueta de nivel | `#dcfce7` · `#fef9c3` · `#ffedd5` · `#fee2e2` | `#14391f` · `#3b3210` · `#43230f` · `#4a1d1d` |
| `risk-X-ink` | texto sobre el relleno suave | `#14532d` · `#713f12` · `#7c2d12` · `#7f1d1d` | `#86efac` · `#fde047` · `#fdba74` · `#fca5a5` |

(`X` = `low`, `moderate`, `high`, `critical`, en ese orden.) Contraste WCAG calculado por `check-design-system.sh` (22 pares, todos ≥ 4,5:1; el mínimo es 5,0:1 y `ink` sobre `bg` pasa de 7,5:1). El nivel **siempre** lleva su palabra (la etiqueta, la leyenda, el número de la casilla) y la etiqueta **no lleva icono**; un riesgo sin evaluar no es «bajo»: se pinta neutro con borde punteado. En `.ts` las clases se escriben completas (`bg-risk-high-bg`), nunca armadas con una variable. Uso: `app-risk-level-badge`, el mapa de calor y la matriz inherente, y la severidad de `app-test-findings`.

**Espaciado**: escala de 4 px (`1 = 4px`, `2 = 8`, `3 = 12`, `4 = 16`, `6 = 24`, `8 = 32`, `12 = 48`). Padding de página y ancho máximo **idénticos** en las dos apps.

**Radio** (moderados, menores que Donezo; siempre por token): `--radius-control = 8px` (inputs, botones, ítems de menú), `--radius-card = 10px`
(cards, `section`, tablas; `--radius-surface` es su alias), `--radius-panel = 12px` (sidebar, header, área de contenido).
`--radius-pill = 9999px` solo para el buscador del header (`rounded-pill`). Nada más; `rounded-full` solo para avatares, el punto de estado y el indicador del menú.

**Borde**: `1px solid var(--color-line)`.

**Entrada de pantalla**: utilidad `mk-enter` (fundido de opacidad de 150 ms; con `prefers-reduced-motion` se conserva, porque un fundido no es movimiento). Companies y Catalog de Admin la usan. Los modales entran con `mk-backdrop-in` (fundido del fondo) y `mk-modal-in` (fundido con escala de 0,96 a 1 en 180 ms; con `prefers-reduced-motion`, solo fundido).

**Sombra**: `--shadow-soft` (mínima, en cards) y `--shadow-float` (menús, modal, drawer, sidebar en móvil, avisos `toast`). Los avisos (`toast`) flotan en la esquina superior derecha por encima de todo (`--z-toast`, 100004: drawer 100001, confirm-dialog 100002) y llevan `mk-surface-state-*` con punto y palabra; ver `components.md`. Las sombras antiguas de contenedor (`shadow-card`, `shadow-theme-*`) ya no existen en `styles.css`; el chequeo rechaza que vuelvan.

**Superficies** (utilidades): `mk-panel` (panel del shell), `mk-panel-content` (área de contenido, blanca como `mk-panel`), `mk-surface` (card), `mk-surface-tinted` (card de apoyo con tinte de marca) y `mk-surface-featured`
(card destacada: azul de marca `brand-500 → brand-600`, degradado sutil, texto blanco; como mucho una por vista, para la cifra principal). y `mk-surface-state-ok|warn|bad|neutral` (card de estado, paso 5: tinte tenue del token de estado sobre `surface` y borde completo de 1 px del mismo tono, texto `ink`; solo para un veredicto o aviso que **es** un estado, nunca decoración; contraste de `ink` sobre el tinte ≥ 13:1 en claro y oscuro).

**Conteos de una card** (Resumen de Cumplimiento): cabecera con la cifra principal («31/118») y su etiqueta en `mk-stat`, una barra de 4 px con la proporción en `action` (no es estado), y debajo una rejilla de 3 columnas con la cifra grande (`text-3xl`, `tabular-nums`, `action`) sobre su `status-indicator` (punto + palabra). La card toma la altura de sus vecinas.

**Shell de autenticación** (sin utilidades propias, solo clases de tokens): panel de marca `bg-primary-500` (azul marino `#013362`) en claro y `dark:bg-white/5` en oscuro (casi negro sobre `surface`), con las formas `grid-01.svg`, logo blanco y frase en `text-white/90` (claro) o `dark:text-white/75` (oscuro). Abajo a la derecha, en una columna, el botón de idioma (código `ES`/`EN`) sobre el de tema: círculos de `size-14`, `bg-brand-500` (hover `brand-600`) con texto o icono blanco; sobre el marino se ven claros. Los formularios de auth usan `mk-input` sin icono ni fondo de color (solo el ojo de contraseña) y no llevan iconos decorativos. Detalle en `components.md`.

**Estado deshabilitado** (todos los botones y campos, por token, sin `opacity-*`): `mk-btn`, `mk-btn-secondary` y `mk-btn-danger` pasan a fondo `line` (gris neutro, no azul), texto `ink-muted` (5:1 o más en claro), sin sombra, `cursor-not-allowed` y sin hover (`enabled:hover:`). Campos (`mk-input`, `code-input`): fondo `tint`, texto `ink-faint`. Botones de icono, de texto, paginación y celdas: `disabled:cursor-not-allowed disabled:text-ink-faint` (y `disabled:bg-tint` si tienen fondo), hover solo con `enabled:`. **Botón de peligro**: la utilidad `mk-btn-danger` (fondo `bad`, texto blanco, `enabled:hover:bg-bad/90`); deshabilitado no es rojo ni reacciona al hover (mismo estado que `mk-btn`). Nunca `bg-bad! hover:bg-bad/90!` a mano. Ningún control lleva `disabled:opacity-*` ni `opacity-NN`: el chequeo lo cuenta.

**Cifra + etiqueta** (utilidades): `mk-stat` (una línea, alineada a la base, gap pequeño), `mk-stat-value` (cifra en `action`, un solo color) y `mk-stat-label` (etiqueta al lado, no debajo). El estado va aparte, en `status-indicator`. Donde no cabe en línea (cuadros 2×2 estrechos, KPI con título y nota), se conserva la cifra sobre la etiqueta.

**Color con medida** (decisión de Rod tras ver Inicio «como un pantallazo blanco»): el panel y el sidebar siguen blancos y el lienzo no cambia.
El color extra entra solo por estos tres caminos, todos con tokens:
1. **Tinte de marca** (`tint*`) en superficies secundarias: `mk-surface-tinted` (card de apoyo; `app-card tinted`), hover de filas y listas, fondo del ítem activo del menú y pista de las barras de progreso. Nunca un tinte para algo que signifique estado.
2. **Cifras clave en `text-action`** (azul de marca) dentro de las cards de apoyo; la card destacada azul sigue siendo una por vista.
3. **Estado** solo con `ok`/`warn`/`bad` donde significa algo (barra de avance, `status-indicator`); nunca decorativo.
Contraste: `action` sobre `tint` y `tint-ink` sobre `tint` pasan AA en claro (≥ 5:1) y en oscuro (≥ 5:1). No se usan chips de icono ni cabeceras de card tintadas (siguen prohibidos).

**Paleta de datos** (decisión de Rod tras ver Inicio «monocromático»): cinco tokens de categoría, `--color-data-1..5`, para **diferenciar** cosas (hoy solo el marco de una dona), nunca para decir estado. Las cifras de las KPI **no** llevan acento de categoría: todas van en `text-action` (azul de marca) sobre `tint`, y la primera, la destacada, en blanco sobre azul (decisión de Rod tras verlas en navegador). El azul de marca es la base y los otros cuatro son sobrios y no se acercan al verde, ámbar ni rojo de estado.

| Token | Claro | Oscuro | Se ve como |
|---|---|---|---|
| `data-1` | `brand-500` `#046cc4` | `brand-300` | azul de marca |
| `data-2` | `#0b7a75` | `#3fc1b8` | verde azulado |
| `data-3` | `#6a4bc0` | `#a78bfa` | violeta |
| `data-4` | `#a1337f` | `#e07cc0` | ciruela |
| `data-5` | `#8a5a0b` | `#d9a441` | bronce |

Contraste medido (WCAG): en claro, cada uno sobre `tint` ≥ 4,6:1 y sobre blanco ≥ 5,1:1; en oscuro, ≥ 5,6:1 sobre `surface` y sobre `tint` (`data-1` en oscuro usa `brand-300` justo por eso). Las utilidades de Tailwind salen solas (`text-data-2`, `bg-data-3`); en `.ts` se escriben completas, nunca armadas con una variable.
Reglas: los tintes de marca siguen siendo el fondo de las cards de apoyo (el color de datos va en la cifra o en la gráfica, no en el fondo); sin franjas de color en el borde de una card; el mismo marco lleva el mismo color en todas las cards; `ok`/`warn`/`bad` siguen reservados al estado. Excepción (Cumplimiento): la dona puede llevar `tone` (`ok`/`warn`/`bad`/`neutral`) cuando el anillo es el estado de lo que mide; el estado y la cobertura siguen escritos al lado. Sin logos, iconos genéricos, emojis ni pictogramas decorativos: tipografía, color, cifras y gráficas.

**Tipografía** (Outfit; las pantallas de lectura siguen la regla de `context/frontend.md`)

| Rol | Tamaño / peso |
|---|---|
| Título de página | 24 px / 600 |
| Título de sección | 16 px / 600 |
| Texto principal | 16 px / 400 |
| Descripción, celdas secundarias | 14 px / 400, `ink-muted` |
| Etiqueta de campo, encabezado de tabla | 12 px / 500, `ink-faint` (sin mayúsculas forzadas) |
| Cifra de KPI | 28 px / 600 |

## 4. Archivos de este directorio

| Archivo | Qué responde |
|---|---|
| `components.md` | Contrato de cada componente base y del menú lateral con grupos |
| `sync.md` | Cómo se mantienen iguales las dos apps y qué comprueba el chequeo |

Agente responsable: `frontend-design` (`agents/frontend-design.md`).
