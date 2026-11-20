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
el **shell flotante**, no su color ni sus radios. No se copian marcas, textos, logos ni el verde; el azul `#046cc4` se queda. La fuente es **Geist** (D126; antes Outfit).

**Shell flotante**: lienzo gris claro (`canvas`); el sidebar, el header y el área de contenido son **paneles separados** con margen
entre sí y respecto al borde (el sidebar flota). El header es un panel propio (buscador, ayuda, usuario), no una barra pegada. El
contenido vive en un panel **blanco** igual que el sidebar y el header (`surface`); las cards se distinguen sobre él por su borde de 1 px y
`shadow-soft`, no por el color de fondo: un solo nivel de contenedor.
Los textos siguen `monkey-ui-copy`; este documento solo cubre la capa visual.

## 1. Principios

1. **El dato es lo primero que se ve**, no la decoración. Ante la duda de añadir un elemento decorativo, no se añade.
2. **Jerarquía por tipografía y espacio**, no por cajas. Máximo **un** nivel de contenedor.
3. **El color significa algo**: estado (cumple / no cumple / pendiente / sin medir), acción primaria y, en el `app-badge` (D115), el tipo de dato (código, atributo). Nada decorativo.
4. **Densidad respirable**: tablas y listas para datos repetitivos; filas limpias, columnas alineadas, acciones al extremo.
5. **El detalle va en un panel lateral**, no en una página nueva ni saturando la actual. Los formularios de crear o editar, y el detalle de una persona o un grupo, van en un **modal** centrado (`form-modal`), sin X: Cancelar en el pie.
6. Las dos apps se ven igual: lo que cambia entre ellas son rutas y alias, nunca estilos.

## 2. Qué se permite y qué no en una página

| Prohibido | En su lugar |
|---|---|
| Píldoras (`rounded-full`) o chips decorativos hechos a mano para un código, un atributo o un estado | `app-badge` (D115): **el único** elemento permitido para código, atributo y estado; rectángulo redondeado (`rounded-badge`, 4 px), tinte suave, borde de 1 px y texto fuerte. `app-tag` (código) y `app-status-indicator` (estado) son este mismo componente |
| Un chip de color arbitrario (servicio, norma, país, rol sin significado de dato) | Texto plano, o `app-badge kind="attribute"` si es un atributo con valor fijo (el color sale del valor, no se elige a mano) |
| `<select>` nativo, un `<input type="search">` con lupa a mano | `app-select` (disparador + panel propio, simple o `multiple`, formularios reactivos) y `app-search-field` (lupa **a la derecha**); `table-filter` y `table-toolbar` ya los usan; contrato en `components.md` |
| Tabla con markup propio (`<table>`, una card con filas, `divide-y`), también la lista corta de un panel lateral | `data-table` y sus celdas (`person-cell`, `status-indicator`, `tag`, `badge`) con `table-toolbar` y `table-filter`; contrato en `components.md`, «Tabla única» |
| Borde lateral o superior de color en una tarjeta; barra de color junto a un título | Línea fina neutra; el estado va en `status-indicator` (badge de estado). (El indicador lateral del ítem activo del menú sí se permite.) |
| Banner con degradado o círculos decorativos | `page-header` sin fondo. **Excepciones** (decisiones de Rod): (1) el banner `app-compliance-banner` del shell de Cumplimiento (ver abajo), y ninguna otra vista lo usa; (2) el **lavado del toast** (MD-485): el token de estado al 12 % sobre `surface` en el borde izquierdo del aviso, que se desvanece hacia `surface` en el 60 % del ancho (`mk-toast-*`, `--color-toast-*-wash`); es un estado, no decoración, y no se usa en ninguna otra superficie |
| Cabecera de tarjeta con fondo pastel | Título de `section` con línea inferior de 1 px |
| Tarjeta dentro de tarjeta | Una sola capa; lo interno se separa con líneas y espacio |
| Icono dentro de un cuadro o círculo de color | Icono lineal monocromo, sin fondo. **Excepciones**: (1) la tarjeta de métrica `app-metric-card` lleva su icono lineal dentro de un círculo del color de la métrica (`mk-metric-icon-<data-1..5|ok|warn|bad|neutral>`; decisión de Rod, MD-483: tarjetas tipo Vanta, todas iguales en la fila, sin card destacada); (2) (decisión de Rod, MD-217): el avatar `app-device-icon` de «Dispositivos recordados» (círculo oscuro con el dispositivo y el logo de su sistema), junto al texto que lo nombra |
| Sombras en contenedores (`shadow-xl`…) | Borde de 1 px, más `shadow-soft` (mínima) en cards. Sombra real solo en capas flotantes (menú, modal, drawer) |
| Azul como decoración | Azul `primary` solo en la acción primaria y los links |
| Más de una acción primaria por vista | Una primaria; el resto, secundarias o texto |

**Carga (D116).** Esqueleton (`app-skeleton`, o `loading` en `data-table`) para los datos que cargan, por región; `app-loading-spinner` solo para procesos largos; `appBusy` en el botón que lanza una acción (spinner dentro, bloquea y marca `aria-disabled`; no toca `disabled`; anchura estable) y `appBusyFields`/`busy` de `form-modal` para los campos en solo lectura. El estado ocupado dura hasta la respuesta. Detalle en `components.md`.

Se mantiene: avatar con iniciales del perfil, barras de progreso finas, donas de avance (`donut`), iconos lineales, el semáforo de estado.

**Excepción: el banner de Cumplimiento.** Solo el shell de Cumplimiento (`compliance-shell`, Platform) puede llevar un banner con fondo, y solo mediante `app-compliance-banner` y la utilidad `mk-banner`; no se abre a Inicio, Mi empresa, Equipo ni a ninguna otra vista. Reglas que cumple: degradado `brand-700` a `brand-500` (en oscuro `brand-900` a `brand-700`) y dos círculos con 8 % y 5 % de opacidad, todo por tokens; radio `rounded-panel`; texto blanco con contraste de 5,4:1 o más; sin iconos, logos ni flecha de volver; el marco va como texto con borde fino (no es una píldora rellena); una línea de contexto con datos que la sección ya cargó (sin llamadas nuevas); se apila en móvil. El banner no cambia el resto de reglas: dentro de las secciones siguen valiendo las de arriba.

## 3. Tokens

Se definen una vez en `@theme` de `styles.css` (Tailwind v4, sin `tailwind.config`). Los valores exactos de color
**se leen del `styles.css` actual** (la identidad: Geist, `brand-500 = #046cc4`, `canvas = #e9edf3` en claro y `#05080f` en oscuro); lo nuevo es la capa semántica y las escalas que hoy faltan.

**Color (semántico, sobre las rampas existentes)**

| Token | Uso | Sale de |
|---|---|---|
| `--color-surface` | fondo de card y de panel (sidebar, header) | blanco |
| `--color-canvas` | lienzo exterior del shell | `#e9edf3` |
| `--color-line` | bordes y divisores de 1 px | `gray-200` |
| `--color-ink` / `--color-ink-muted` / `--color-ink-faint` | texto principal / secundario / etiquetas | `gray-900` / `gray-600` / `#596579` (un paso más oscuro que `gray-500`: 5,0:1 sobre `canvas` y 4,65:1 sobre `tint-strong`; `#667085` no pasaba AA) |
| `--color-line-control` | borde de un campo (`mk-input`, `app-select`, casilla de la lista) y del botón secundario: ≥ 3:1 contra su fondo (WCAG 1.4.11). `line` queda para divisores y cards | `#7d8799` claro · `#5a79a8` oscuro |
| `--color-action` (+ `-hover`) | acción primaria y links | `brand-500` (en oscuro `#4a9be0`, valor propio) |
| `--color-on-action` | texto o icono **sobre** un relleno `action` (botón primario, paso del asistente, página actual, día elegido): `text-on-action`, nunca `text-white` ahí. El `action` oscuro es claro, y el blanco daba 2,98:1 | `#ffffff` claro · `#05080f` oscuro (6,7:1). Está aislado en este token: si Rod cambia el botón oscuro, se toca solo aquí |
| `--color-brand-panel` | panel de marca del shell de acceso, con texto blanco (≥ 12:1); en oscuro más claro que el formulario (`surface`) | `primary-500` · `#10264a` |
| `--color-tint` / `--color-tint-strong` / `--color-tint-ink` | tinte suave de marca: card de apoyo, hover, ítem activo del menú, pista de barras; texto sobre tinte | `brand-50` / `brand-100` / `brand-700` (en oscuro: `action` al 8 % / 16 % sobre `surface`, y `brand-300`) |
| `--color-data-1` … `--color-data-5` | categorías (el color de cada marco en su dona); no estado, y no se usa en las KPI | ver «Paleta de datos» |
| `--color-scrim` | fondo oscurecido tras un modal, un drawer o el menú móvil (`bg-scrim`); ninguna capa escribe `bg-black/50` | negro al 50 % |
| `--color-ok` · `--color-bad` · `--color-warn` · `--color-neutral` | únicamente estado | `success-600`, `error-600`, `warning-500`, `gray-400` |
| `--color-ok-ink` · `--color-warn-ink` · `--color-bad-ink` | una frase o una cifra en color de estado (error de un campo, aviso): `ok`/`warn`/`bad` son rellenos y puntos (hasta 3,7:1 sobre blanco) y no valen como texto | `success-700`, `warning-700`, `error-700` (en oscuro `success-300`, `warning-300`, `error-300`) |
| `--color-badge-<X>-bg\|-line\|-ink` | el **badge** (D115): tinte al 18 % sobre `surface` (antes 8 %: se veía apagado; decisión de Rod, MD-483), borde de 1 px (42 %, antes 28 %) y texto fuerte; `X` = `ok`, `warn`, `bad`, `neutral` (estado), `brand` (código e `info`), `data-1`…`data-5` (atributo) y `risk-low\|moderate\|high\|critical` (nivel de riesgo, reutiliza sus tokens). Reutilizan `ok`/`-ink`, `tint-ink`, `data-N` y `risk-X`: no duplican valores. Contraste ≥ 4,5:1 en claro y oscuro, calculado por `check-design-system.sh` | mezclas `color-mix` con `surface`; las tintas (`-ink`) se mezclan con `ink` (68-75 %) para quitarles saturación: sobrias, no neón, en claro y en oscuro |
| `--color-risk-low\|moderate\|high\|critical` y sus `-on`, `-bg`, `-ink` | la **escala de nivel de riesgo** (ver abajo); no es estado | valores propios, claro y oscuro |

Los colores de estado se piden por token; **ningún `.ts` ni template escribe `green-600` o `amber-500`**.
El modo oscuro redefine los mismos tokens bajo `.dark`; ninguna pantalla se escribe dos veces: una vista no lleva `dark:` con color (el chequeo lo rechaza; la única excepción es `app-device-icon`, MD-217), ni `bg-gray-800` o `border-gray-700` directos.

**Modo oscuro: negro azulado** (D126, decisión de Rod; antes grafito y luego un navy que le pareció demasiado azul y claro). Los valores viven solo en `.dark` de `styles.css`; el contraste lo mide `check-design-system.sh`. Jerarquía: `canvas` el más oscuro, los paneles y cards un paso arriba (`surface`), los tintes apenas más claros que el panel.

| Token | Oscuro | Contraste del par principal |
|---|---|---|
| `canvas` | `#05080f` | `ink` 17,0:1 |
| `surface` (= `gray-900`) | `#0a0f1a` | `ink` 16,3:1; `ink-muted` 6,8:1; `ink-faint` 5,9:1; `action` 6,4:1 |
| `line` (= `gray-800`) | `#182133` | divisor, no texto (1,19:1 con `surface`) |
| `line-strong` | `#34466a` | divisor del menú (2 px), 2,0:1 |
| `line-control` | `#556a90` | 3,5:1 sobre `surface`, 3,1:1 sobre `tint` |
| `ink` / `ink-muted` / `ink-faint` | `#e8edf5` / `#8e9bb3` / `#7f90ad` | ver arriba |
| `action` / `action-hover` / `on-action` | `#4a9be0` / `brand-300` / `#05080f` | `on-action` sobre `action` 6,7:1 |
| `tint` / `tint-strong` | `action` al 8 % / 16 % sobre `surface` (`#0f1a2a` / `#14253a`) | `ink-faint` sobre `tint` 5,4:1 y sobre `tint-strong` 4,8:1 |
| `brand-panel` | `#10264a` | blanco 15:1 |
| `gray-950 / 900 / 800 / 700 / dark` | `#03050a` / `#0a0f1a` / `#182133` / `#26334d` / `#070b13` | rampa de apoyo |

Reglas de uso medidas: `ink-faint` pasa AA sobre `surface`, `canvas`, `tint` y `tint-strong`. Los rellenos de estado `ok/bad/warn/neutral` son puntos y rellenos (≥ 3:1 sobre `surface` en oscuro); el texto de estado es `*-ink`. Una frase en color de estado usa `text-bad-ink`, `text-ok-ink` o `text-warn-ink`, nunca `text-bad`.

**Escala de riesgo** (decisión de la ola B): el nivel de un riesgo (bajo, moderado, alto, crítico; `enums.md` `risk_level`) y la severidad de un hallazgo (crítica, alta, media = moderada, baja) tienen sus propios tokens y **no se mezclan con `ok`/`warn`/`bad`**: estos dicen cómo va un control o una prueba (cumple, pendiente, no cumple); la escala dice **cuán grande** es un riesgo, así que un riesgo «bajo» no es «ok» ni uno «crítico» es «bad», y los dos pueden convivir en una misma card. Cada nivel tiene cuatro tokens, ninguno alias de un token de estado:

| Token | Para qué | Claro | Oscuro |
|---|---|---|---|
| `risk-X` | relleno intenso: casilla del mapa de calor con riesgos | `#15803d` · `#facc15` · `#c2410c` · `#b91c1c` | `#4ade80` · `#facc15` · `#fb923c` · `#f87171` |
| `risk-X-on` | texto sobre ese relleno | `#ffffff` (bajo, alto, crítico) · `#422006` (moderado) | `#052e16` · `#422006` · `#431407` · `#450a0a` |
| `risk-X-bg` | relleno suave: casilla vacía, etiqueta de nivel | `#dcfce7` · `#fef9c3` · `#ffedd5` · `#fee2e2` | `#14391f` · `#3b3210` · `#43230f` · `#4a1d1d` |
| `risk-X-ink` | texto sobre el relleno suave | `#14532d` · `#713f12` · `#7c2d12` · `#7f1d1d` | `#86efac` · `#fde047` · `#fdba74` · `#fca5a5` |

(`X` = `low`, `moderate`, `high`, `critical`, en ese orden.) Contraste WCAG calculado por `check-design-system.sh` (22 pares, todos ≥ 4,5:1; el mínimo es 5,0:1 y `ink` sobre `bg` pasa de 7,5:1). El nivel **siempre** lleva su palabra (la etiqueta, la leyenda, el número de la casilla) y la etiqueta **no lleva icono**; un riesgo sin evaluar no es «bajo»: se pinta neutro con borde punteado. En `.ts` las clases se escriben completas (`bg-risk-high-bg`), nunca armadas con una variable. Uso: `app-risk-level-badge`, el mapa de calor y la matriz inherente, y la severidad de `app-test-findings`.

**Badge** (D115, `app-badge`): un solo componente para código, atributo y estado, idéntico en las dos apps. Forma: rectángulo redondeado con `rounded-badge` (4 px, `--radius-badge`; nunca píldora), relleno compacto, texto pequeño de peso medio, sin partirse (`whitespace-nowrap`; un texto largo se corta con puntos suspensivos y muestra su texto completo como tooltip). Estilo: tinte suave del color, borde de 1 px del mismo tono y texto en el tono fuerte, todo por token `badge-*`. Tipos: **código** (`T-CLD-001`, `AST-1`, `CC6.1`): tinte de marca y cifras tabulares; **atributo** (tipo de recurso, capacidad, «funciona con», categoría): color **fijo por valor** de la paleta de datos (`data-1`…`data-5`, un hash estable del texto: el mismo texto es siempre del mismo color en toda la app); **estado** (disponible, preparado, requiere trabajo, sin medir): tono `ok`/`warn`/`bad`/`neutral`/`info` y un punto de color a la izquierda, porque el color no es la única señal; el nivel de riesgo (`risk-*`) conserva sus tokens. El color del estado sigue significando solo estado. **Única excepción:** el marco del banner de Cumplimiento (`app-compliance-banner`) es un texto con borde fino sobre el fondo de marca, porque un badge con tinte no se lee ahí; la regla `hand-made chip` de `check-design-system.sh` lo deja pasar a propósito (`border-white`). Contrato en `components.md`.

**Espaciado**: escala de 4 px (`1 = 4px`, `2 = 8`, `3 = 12`, `4 = 16`, `6 = 24`, `8 = 32`, `12 = 48`). Padding de página y ancho máximo **idénticos** en las dos apps.

**Radio** (moderados, menores que Donezo; siempre por token): `--radius-control = 8px` (inputs, botones, ítems de menú), `--radius-card = 10px`
(cards, `section`, tablas; `--radius-surface` es su alias), `--radius-panel = 12px` (sidebar, header, área de contenido).
`--radius-pill = 9999px` solo para el buscador del header (`rounded-pill`). Nada más; `rounded-full` solo para avatares, el punto del badge de estado y el indicador del menú. El badge usa `rounded-badge` (`--radius-badge` = 4 px), más cerrado que un control (8 px).

**Borde**: `1px solid var(--color-line)`.

**Entrada de pantalla**: utilidad `mk-enter` (fundido de opacidad de 150 ms; con `prefers-reduced-motion` se conserva, porque un fundido no es movimiento). Companies y Catalog de Admin la usan. Los modales entran con `mk-backdrop-in` (fundido del fondo) y `mk-modal-in` (fundido con escala de 0,96 a 1 en 180 ms; con `prefers-reduced-motion`, solo fundido).

**Sombra**: `--shadow-soft` (mínima, en cards) y `--shadow-float` (menús, modal, drawer, sidebar en móvil, avisos `toast`). Los avisos (`toast`) flotan arriba a la derecha, bajo el header del shell, por encima de todo (`--z-toast`); son `mk-toast` con el lavado de su estado, un icono lineal y la palabra del estado para lectores de pantalla; ver `components.md`. Las sombras antiguas de contenedor (`shadow-card`, `shadow-theme-*`) ya no existen en `styles.css`; el chequeo rechaza que vuelvan.

**Superficies** (utilidades): `mk-panel` (panel del shell), `mk-panel-content` (área de contenido, blanca como `mk-panel`), `mk-surface` (card), `mk-surface-tinted` (card de apoyo con tinte de marca) y `mk-surface-featured`
(card destacada: azul de marca `brand-500 → brand-600`, degradado sutil, texto blanco; ya **no se usa en las filas de métricas** (MD-483): quedan todas iguales con `app-metric-card`). y `mk-surface-state-ok|warn|bad|neutral` (card de estado, paso 5: tinte tenue del token de estado sobre `surface` y borde completo de 1 px del mismo tono, texto `ink`; solo para un veredicto o aviso que **es** un estado, nunca decoración; contraste de `ink` sobre el tinte ≥ 12:1 en claro y oscuro).

**Conteos de una card** (Resumen de Cumplimiento): cabecera con la cifra principal («31/118») y su etiqueta en `mk-stat`, una barra de 4 px con la proporción en `action` (no es estado), y debajo una rejilla de 3 columnas con la cifra grande (`text-3xl`, `tabular-nums`, `action`) sobre su `status-indicator` (badge de estado). La card toma la altura de sus vecinas.

**Shell de autenticación** (sin utilidades propias, solo clases de tokens): panel de marca `bg-brand-panel` (azul marino `#013362` en claro; `#10264a` en oscuro, más claro que el formulario), con las formas `grid-01.svg`, logo blanco y la frase en `text-white/90` en los dos modos (sin `dark:`). Abajo a la derecha, en una columna, el botón de idioma (código `ES`/`EN`) sobre el de tema: círculos de `size-14`, `bg-brand-500` (hover `brand-600`) con texto o icono blanco; sobre el marino se ven claros. Los formularios de auth usan `mk-input` sin icono ni fondo de color (solo el ojo de contraseña); las acciones secundarias del segundo factor son botones con icono en fila mitad y mitad (MD-217). Detalle en `components.md`.

**Estado deshabilitado** (todos los botones y campos, por token, sin `opacity-*`): `mk-btn`, `mk-btn-secondary` y `mk-btn-danger` pasan a fondo `line` (gris neutro, no azul), texto `ink-muted` (5:1 o más en claro), sin sombra, `cursor-not-allowed` y sin hover (`enabled:hover:`). Campos (`mk-input`, `code-input`): fondo `tint`, texto `ink-faint`. Botones de icono, de texto, paginación y celdas: `disabled:cursor-not-allowed disabled:text-ink-faint` (y `disabled:bg-tint` si tienen fondo), hover solo con `enabled:`. **Botón de peligro**: la utilidad `mk-btn-danger` (fondo `bad`, texto blanco, `enabled:hover:bg-bad/90`); deshabilitado no es rojo ni reacciona al hover (mismo estado que `mk-btn`). Nunca `bg-bad! hover:bg-bad/90!` a mano. Ningún control lleva `disabled:opacity-*` ni `opacity-NN`: el chequeo lo cuenta.

**Cifra + etiqueta** (utilidades): `mk-stat` (una línea, alineada a la base, gap pequeño), `mk-stat-value` (cifra en `action`, un solo color) y `mk-stat-label` (etiqueta al lado, no debajo). El estado va aparte, en `status-indicator`. Donde no cabe en línea (cuadros 2×2 estrechos, KPI con título y nota), se conserva la cifra sobre la etiqueta.

**Color con medida** (decisión de Rod tras ver Inicio «como un pantallazo blanco»): el panel y el sidebar siguen blancos y el lienzo no cambia.
El color extra entra solo por estos tres caminos, todos con tokens:
1. **Tinte de marca** (`tint*`) en superficies secundarias: `mk-surface-tinted` (card de apoyo; `app-card tinted`), hover de filas y listas, fondo del ítem activo del menú y pista de las barras de progreso. Nunca un tinte para algo que signifique estado.
2. **Cifras clave en `text-action`** (azul de marca) dentro de las cards de apoyo; en las filas de métricas ya no hay card destacada ni cifras en `text-action`: las tarjetas son `app-metric-card` (ver más abajo).
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

**Tarjeta de métrica** (`app-metric-card`, MD-483, decisión de Rod; referencia tipo Vanta). **Horizontal**, baja y compacta: card `surface` con borde 1 px `line`, radio `card`, sin sombra, padding 16 px y la altura marcada por el círculo. A la izquierda, centrado en vertical, el icono lineal (Material Symbols Rounded, 28 px) dentro de un círculo de 56 px (`mk-metric-icon`) del color de la métrica, **vivo como un badge**: relleno al 28 % del color sobre `surface`, borde de 1 px al 42 % (`--color-metric-X-bg|-line`) e icono en el tono fuerte (`badge-X-ink`); `check-design-system.sh` mide el icono sobre el círculo en claro y oscuro (el mínimo exigido a un objeto gráfico es 3:1). A su derecha, 16 px de separación, la información apilada: la etiqueta (`text-sm` medium, `ink-muted`) y debajo la cifra (`text-kpi`, semibold, `tabular-nums`, `text-ink`). Si la métrica tiene porcentaje, su `app-donut` va en el **lado derecho de la tarjeta, centrada en vertical y a 72 px** (el porcentaje dentro), sin cambiar; las tarjetas de una fila se estiran a la misma altura, así que las que no tienen dona mantienen su contenido centrado. **Sin línea descriptiva**: `description` es opcional, ninguna vista la pasa y sin ella no queda hueco. Un color fijo por métrica: `data-1..5` para un conteo, `ok|warn|bad|neutral` solo si la métrica ES ese estado (vencidas, no efectivas); con más de cinco métricas en una fila se repite un color, no se inventa uno. **Todas las tarjetas de una fila son iguales: la card destacada con degradado se retira de las filas de métricas.** Filas: `mk-metric-grid` (4 por fila en escritorio, 2 en tablet, 1 en móvil; Inicio de Admin y Resumen de Cumplimiento), `mk-metric-grid-6` (Inicio de Platform: 6 desde 1440 px, 3 en laptop y tablet, 2 en móvil; desde 1440 px un divisor propio de la rejilla (`mk-metric-divider`, un `span` `aria-hidden` entre la tercera y la cuarta tarjeta: 1 px `line-strong`, 65 % de la altura de la fila y centrado, con 32 px exactos a cada lado, el doble del gap entre tarjetas) separa dos grupos de tres con las seis tarjetas del mismo ancho: Servicios, Activos, Marcos | Controles, Riesgos, Causas; donde la fila se parte no hay divisor) y `mk-metric-grid-3`. Excepción a «icono dentro de un círculo de color» (tabla de la sección 2).

**Tipografía** (D126). Una sola familia: **Geist** (`font-sans`, variable 100-900) para todo el texto y **Geist Mono** (`font-mono`) solo para códigos: el `badge` de kind `code` (`CC6.1`, `AST-1`), hashes SHA-256, tokens de conexión y códigos de recuperación. Las dos vienen de npm (`@fontsource-variable/geist` y `/geist-mono`, importadas en `styles.css` con `wght.css`, sin cursiva), con el `woff2` en el mismo origen: nunca un CDN ni `@import url(...)`; el chequeo lo rechaza. `--font-*: initial` limpia las familias por defecto de Tailwind, y `--font-sans` y `--font-mono` son las únicas. **Sin cursivas.** Pesos: 400 texto · 500 etiquetas y menú · 600 títulos y botones · 700 solo la cifra principal de una card (hoy ninguno; no se usan 800 ni 900). Las pantallas de lectura siguen la regla de `context/frontend.md`.

**Cifras tabulares.** Geist trae la característica `tnum` (comprobada en el archivo de la fuente). Las cifras se alinean con `tabular-nums`: `table` lo aplica a todas sus celdas desde `styles.css`; además lo llevan `mk-stat-value`, el texto del `donut`, la paginación, el `badge` de código y cada KPI (`text-kpi`). Una cifra nueva en una card o un KPI lleva `tabular-nums`.

| Rol | Tamaño / peso |
|---|---|
| Título de página | 24 px / 600 |
| Título de sección | 16 px / 600 |
| Texto principal | 16 px / 400 |
| Descripción, celdas secundarias | 14 px / 400, `ink-muted` |
| Etiqueta de campo, encabezado de tabla | 12 px / 500, `ink-faint` (sin mayúsculas forzadas; nada de 10 u 11 px: es `text-xs`) |
| Cifra de KPI | 28 px / 600, `text-kpi` (`--text-kpi`, línea de 32 px) y `tabular-nums` |
| Código (`CC6.1`, hash) | Geist Mono, 12 px / 500 en el badge |

**Un solo paso de título (MD-485, decisión 6.1 A).** Todo `h1` es de 24 px / 600 (`text-2xl`), el de `page-header`: también el acceso, Ajustes, el banner de Cumplimiento, la pantalla final de un servicio y la 404. Nada de `text-3xl` ni `md:text-3xl` en un `h1`; `check-design-system.sh` lo hace fallar.

**Escala de iconos (MD-485, decisión 6.13 A).** Material Symbols Rounded en **16 px** (dentro de texto pequeño, badges, enlaces de tabla), **20 px** (botones, menús, filas; el más usado) y **24 px** (botones de icono de la cabecera, cerrar un panel). Excepciones escritas: **28 px** el icono de `app-metric-card` y el de `form-modal [icon]`, **32 px** el de `app-empty-state`, **44 px** el check de una pantalla final (alta de servicio, resultado de una conexión). Un tamaño fuera de la lista se lleva al más cercano; el chequeo lo hace fallar (`icon size off the scale`).

## 4. Archivos de este directorio

| Archivo | Qué responde |
|---|---|
| `components.md` | Contrato de cada componente base y del menú lateral con grupos |
| `sync.md` | Cómo se mantienen iguales las dos apps y qué comprueba el chequeo |

Agente responsable: `frontend-design` (`agents/frontend-design.md`).
