---
name: monkey-design-audit
description: >-
  Auditoría y organización visual de los dos frontends de Monkey (Frontend admin y Frontend-Platform). Primero
  diagnostica lo que se ve genérico, descuidado o hecho por IA: tipografía, color y modo oscuro, espaciado, estados,
  movimiento, textos y código de estilos. Después reporta a Rod y corrige por prioridad, sin romper funcionalidad.
  Úsala cuando haya que pulir, auditar o rediseñar una pantalla existente, o cuando algo «se ve feo, genérico o
  barato». No usar para decidir qué se construye ni para pantallas nuevas sin diseño previo.
---

# Auditoría visual de Monkey

Esta skill es un **diagnóstico**: encuentra lo que está mal en una interfaz que ya existe y lo corrige en su sitio. La
ejecuta el subagente `frontend-design`. Rod veta y aprueba **pantalla por pantalla**, en su app y sin capturas
(`../visual-verification.md`).

Monkey es una app B2B de cumplimiento (GRC), densa en datos: tablas, estados, porcentajes y códigos. No es una landing.
Lo que en un sitio de marketing sería «premium» (heroes, CTAs, testimonios, layouts asimétricos) aquí no aplica. Lo que
sí aplica es la **claridad**: jerarquía, alineación, cifras legibles, estados completos y textos específicos.

## Valores de diseño: no se inventan

Todos los valores concretos (fuente, colores claros y oscuros, espaciado, radios, sombras, movimiento, iconos) viven en
[`../design-system/README.md`](../design-system/README.md) y en el `styles.css` canónico de
`../design-system/src/`. Esa es la **fuente única**. Esta skill dice **qué buscar**; el design system dice **con qué
reemplazarlo**.

- Si un caso no está en el design system, **se pregunta a Rod**: no se elige un hex, un tamaño ni una curva por gusto.
- Un cambio de identidad (fuente, paleta, curva de movimiento, cifras tabulares) se registra como `D-n` con
  `monkey-registry`, en el mismo cambio.
- Todo cambio compartido se aplica en las dos apps y se sincroniza con `../design-system/scripts/sync-design-system.sh`.

## Cómo se trabaja

1. **Escanear.** Lee la pantalla o el componente, su `.html`, su `.ts` y sus estilos. Ubica qué componentes base usa
   (`data-table`, `app-card`, `app-badge`, `detail-modal`…) y qué hace a mano.
2. **Diagnosticar.** Recorre la auditoría de abajo. Anota cada hallazgo con `archivo:línea`, en qué app está y a qué
   categoría pertenece.
3. **Reportar antes de corregir.** Entrega a Rod la lista agrupada por pantalla y prioridad. Él veta lo que no quiere.
4. **Corregir en orden de prioridad**, dentro del stack actual (Angular standalone, Tailwind v4, tokens del design
   system). Se mejora lo que hay; no se reescribe desde cero.
5. **Verificar.** `ng build`, specs afectados, `check-design-system.sh` y la lista de pantallas para que Rod las apruebe.

---

# Auditoría

## Tipografía

- **Una sola familia de fuente** en las dos apps, la del design system. La mono solo va en los códigos (`CC6.1`, `AST-1`).
- **Sin itálicas.** El énfasis se da con peso, tamaño o color.
- **Sin pesos 800 ni 900.** La jerarquía se hace con 400 (texto), 500 (etiquetas, menú), 600 (títulos, botones) y, como
  mucho, 700 en la cifra principal de una card.
- **Solo 400 y 700 en una vista.** Falta jerarquía: usa 500 y 600.
- **Tamaños sueltos** (`text-[13px]`, `font-size: 15px`, `1.4rem`). Se ajustan a la escala de tipo, al escalón inferior
  más cercano y con su interlineado. No se mezcla con interlineados propios.
- **Cifras proporcionales en datos.** Porcentajes, conteos, fechas y columnas numéricas llevan `tabular-nums`, para que
  se alineen en tablas y cards.
- **Línea de lectura demasiado ancha.** Párrafos de explicación (en qué falla, qué impacto, qué hacer) con un máximo de
  ~65 caracteres (`max-w-prose`).
- **Palabras huérfanas.** `text-wrap: balance` en títulos y `text-wrap: pretty` en párrafos.
- **Subtítulos en MAYÚSCULAS por todos lados.** Se pasan a mayúscula solo al inicio. Las etiquetas pequeñas en
  mayúsculas, si se mantienen, llevan tracking positivo.
- **Botones con texto fuera de escala.** Botón principal `text-sm` semibold; el del header, igual.

## Color, superficies y modo oscuro

- **Colores fuera de los tokens** (hex sueltos, `bg-gray-800`, `text-blue-600` directos en la vista). Pasan al token
  semántico (`surface`, `canvas`, `line`, `ink`, `ink-muted`, `tint`, `action`, estados).
- **Modo oscuro escrito dos veces.** Una pantalla no lleva `dark:` con colores propios: los tokens se redefinen bajo
  `.dark`. Un `dark:bg-…` en una vista es un hallazgo.
- **Superficies oscuras que no son las del design system** (`#111`, `#0a0a0a`, `bg-black`, grises neutros). Pasan a los
  tokens del modo oscuro.
- **Un bloque oscuro dentro de una página clara**, o al revés. Se comprometen a un solo tono.
- **Degradados de fondo.** Fuera, salvo las excepciones escritas en el design system (card destacada, banner de
  Cumplimiento). Nada del degradado morado y azul típico de lo hecho con IA.
- **Más de un acento.** El acento es el azul de marca. La paleta de datos (`data-1…5`) es solo para gráficas y
  categorías; los colores de estado (`ok`, `warn`, `bad`) son solo para estados.
- **Color como única señal.** Un estado siempre lleva su palabra o su badge, no solo el color.
- **Mezcla de grises cálidos y fríos.** Una sola familia.
- **Sombras genéricas** (`shadow-lg`, negro puro). Solo `shadow-soft` en cards y `shadow-float` en capas flotantes.
- **Contraste.** Todo par texto sobre fondo pasa AA (4,5:1; 3:1 en texto grande), en claro **y** en oscuro.
  `check-design-system.sh` lo mide para los tokens; en una pantalla se comprueba el par real.

## Layout y espaciado

- **Espaciados inventados** (`mt-[18px]`, `gap-7` suelto). Cada margen, padding y gap sale de la escala del design system.
- **Radios a ojo.** Solo los tokens de radio (`control`, `card`, `panel`, `badge`). Una forma dentro de otra con
  separación menor de 32 px: radio interior = exterior − separación, si da más de 2.
- **Cards forzadas a la misma altura con contenido distinto.** Que crezcan con su contenido. En una fila de cards con
  acción, el botón va fijo abajo, para que se alinee.
- **Ritmo vertical desalineado entre columnas** (títulos, cifras y acciones a distinta altura). Se alinean.
- **Padding vertical simétrico que se ve mal.** Se ajusta ópticamente: abajo suele necesitar un poco más.
- **Alineación matemática que se ve torcida.** Iconos junto a texto o dentro de botones: corrección óptica de 1 o 2 px.
- **Matemática con porcentajes en flexbox.** Se pasa a CSS Grid.
- **`h-screen` / `100vh`** en contenedores de pantalla completa. Se pasa a `min-h-dvh`.
- **Tarjeta dentro de tarjeta.** Una sola capa; lo interno se separa con líneas y espacio.
- **Borde en un solo lado de una card.** Nunca: el borde va completo o no va.

## Interacción y estados

- **Sin hover** en botones, filas clicables e ítems de menú. Se añade un cambio de fondo o de tinte.
- **Sin estado presionado.** `active:scale-[0.98]` o `translate-y-px`.
- **Sin anillo de foco visible.** Es un requisito de accesibilidad, no estético.
- **Carga:** esqueleton con la forma del contenido (D116), no un spinner en bloque.
- **Vacío:** una vista compuesta que diga qué falta y qué hacer, no un panel en blanco ni «No hay datos».
- **Error:** inline, específico y con el siguiente paso. Nunca `alert()`.
- **Sin permiso:** se explica por qué no se ve, sin parecer un error de red.
- **Página actual sin marcar** en el menú lateral y en las pestañas.
- **Botones que no llevan a nada** (`href="#"`, `(click)` vacío). Se conectan o se deshabilitan visiblemente.
- **Movimiento:**
  - Una sola curva y duraciones fijas, las del design system. Nada de `ease-in-out`, `linear` ni duraciones menores de
    150 ms en transiciones de color.
  - Se anima solo `transform` y `opacity`, nunca `top`, `left`, `width` ni `height`.
  - Con `prefers-reduced-motion`, el movimiento pasa a un fundido.
- **Modales hechos a mano o detalles en página.** El detalle de un elemento va en `detail-modal`: el panel lateral ancho pegado a la derecha y a todo el alto (`drawer`; `drawer-narrow` para una columna), o el modal compacto para un detalle corto; tamaño fijo, X arriba y «Cerrar» en el pie (MD-499); los formularios, en `form-modal`. Nada de paneles laterales ni modales propios.
- **Texto azul usado como botón.** Una acción es un botón del sistema (`mk-btn*`, pequeño dentro de una tarjeta); la navegación y el «ver más» son un enlace subrayado (README §2).
  ya decidió que es modal (MD-210). La edición simple puede ir inline.

## Textos

La regla completa está en `monkey-ui-copy`; aquí se listan los síntomas que la auditoría busca.

- **Textos genéricos:** «Gestiona tus datos», «Bienvenido», «Información», «Detalles», «Algo salió mal», «No hay datos».
  Se reescriben diciendo qué es y qué hacer: «Aún no hay controles asignados a ti. Pídele a tu administrador que te
  asigne alguno.»
- **Palabras de relleno:** «fácilmente», «potente», «optimiza», «revoluciona», «gestiona de forma eficiente». Fuera.
- **Mensajes del sistema ruidosos o vagos.** Las confirmaciones son tranquilas y concretas («Evidencia enviada a
  revisión»). Los errores nombran qué falló y qué hacer («No se pudo subir: el archivo pasa de 20 MB»). Sin signos de
  exclamación.
- **Voz pasiva o sin sujeto.** «No pudimos guardar el borrador» en vez de «El borrador no pudo ser guardado».
- **Botones con «Enviar», «Aceptar», «Ver más».** Verbo y objeto: «Enviar a revisión», «Asignar responsable».
- **Mayúscula Inicial En Cada Palabra.** Solo la primera.
- **Un código sin su explicación**, o un porcentaje solo, sin estado ni cobertura (regla de producto).
- **El nombre de la sonda o del motor de nube** en algo que ve el cliente. Bloqueante.
- **Texto en el template.** Todo texto visible va con clave i18n en `es` y `en`.

## Componentes

- **Card genérica** (borde + sombra + blanco) donde no hace falta elevación. Bastan el fondo o el espacio.
- **Píldoras o chips hechos a mano** para un código, un atributo o un estado: se usa `app-badge` (D115).
- **Siempre un botón relleno y uno fantasma juntos.** Para lo terciario, enlace de texto.
- **Tabla propia** con `<table>`: se usa `data-table`.
- **Icono dentro de un círculo de color** (salvo las excepciones escritas): icono lineal monocromo.
- **Iconos con trazos distintos.** Un solo grosor y una sola familia, la del design system.

## Código de estilos

- **Estilos inline** (`style="…"`) mezclados con clases. Al sistema de estilos.
- **`z-index` arbitrario** (`z-[9999]`). Se usa la escala del tema.
- **Anchos fijos en px** para contenedores. `%`, `rem` y `max-w-*`.
- **HTML sin semántica.** Se usan `<nav>`, `<main>`, `<section>`, `<header>`, botones como `<button>` y enlaces como `<a>`.
- **Imágenes sin `alt`** útil.
- **Código comentado o restos de depuración.** Fuera.
- **Un estilo copiado en las dos apps a mano** en vez de vivir en el canónico del design system.

## Omisiones que suelen olvidarse

- Sin manera de volver atrás desde un detalle.
- Sin 404 propia con salida.
- Formularios sin validación del lado del cliente (requeridos, formato de correo) ni errores por campo.
- Sin enlace «saltar al contenido» para teclado.

---

# Prioridad de corrección

Máximo impacto visual con el menor riesgo, en este orden:

1. **Fuente y escala de tipo**: el cambio más visible y el de menor riesgo.
2. **Color y modo oscuro**: tokens, superficies, contraste y degradados fuera.
3. **Estados de interacción**: hover, presionado y foco.
4. **Layout y espaciado**: escala, radios, alineación y ritmo.
5. **Movimiento**: curva, duraciones y reducción de movimiento.
6. **Componentes genéricos**: pasarlos a los base del design system.
7. **Carga, vacío, error y sin permiso**: que cada vista se sienta terminada.
8. **Textos**: genéricos fuera, específicos dentro, con `monkey-ui-copy`.
9. **Pulido final** de tipo y cifras tabulares.

---

# Reglas

- Se trabaja con el stack actual. No se migran frameworks ni librerías de estilos.
- No se rompe funcionalidad: `ng build` y los specs afectados después de cada bloque de cambios.
- El diagnóstico se reporta **antes** de corregir, y Rod puede vetar cualquier punto.
- Antes de importar una librería (una fuente, un set de iconos), se revisa `package.json` y se pregunta.
- Las dos apps se ven idénticas en lo compartido: el cambio va al canónico y se sincroniza.
- Cambios pequeños y revisables, por pantalla o por bloque de prioridad. Nada de reescrituras grandes de una vez.
- Nunca se inventa un valor de diseño: si no está en el design system, se pregunta.
- Lo que se pueda comprobar por máquina va a `check-design-system.sh`, no a la memoria de nadie.

---

## Créditos

Adaptada de la skill «redesign-existing-projects», que a su vez adaptó partes de
[taste-skill](https://github.com/Leonxlnx/taste-skill) de Leon Lin (licencia MIT). Se conservaron su enfoque de
diagnóstico, sus categorías de auditoría y su orden de prioridad. Se quitaron las partes de marketing y los valores
propios, que en Monkey viven en el design system. Copyright (c) 2026 Leonxlnx, licencia MIT: se permite usar, copiar,
modificar y distribuir con este aviso, sin garantía de ningún tipo.
