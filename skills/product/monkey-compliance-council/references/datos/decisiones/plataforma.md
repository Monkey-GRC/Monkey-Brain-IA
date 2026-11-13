# Decisiones — Plataforma

Por qué Plataforma es como es. **Se consulta para reabrir, no para construir**: lo vigente está en [`arquitectura/plataforma/`](../../arquitectura/plataforma/README.md) y en `datos/modelo/`. Índice de todas las decisiones: [`README.md`](README.md).

## D49 · Las peticiones esperan hasta 10 s por una conexión del pool

`PrismaService.withScope` fija `maxWait` en 10 s (antes 2 s por defecto). Con la base remota a ~200 ms por consulta, una ráfaga
de peticiones paralelas agotaba la espera y el cliente recibía `500 INTERNAL_ERROR` («Unable to start a transaction in the
given time») aunque la base estuviera sana; ocurría hasta en los endpoints públicos de catálogos. Ahora se encolan. No cambia el
límite de duración de la transacción (`timeoutMs`).

**Fuente:** hallazgo de las pruebas de navegador, 2026-10-02.

---

## D106 · Un solo sistema de diseño para Frontend y Frontend-Platform (2026-11-10)

*Decisión:* Las dos apps comparten un único sistema de diseño: estilo sobrio tipo Vanta combinado con la estructura de Donezo (lienzo gris, sidebar y encabezado como paneles flotantes blancos, cards de un solo nivel con borde sutil y una card destacada en azul de marca). Azul `#046cc4` y fuente Outfit (no verde, no Poppins). Radios moderados por token (8/10/12 px; píldora solo para el buscador del encabezado). Los porcentajes van en dona, con estado y cobertura juntos. El color sale de tokens: tintes de marca, paleta de datos solo para donas y colores de estado solo para estado. Sin iconos ni logos decorativos; las cifras llevan la etiqueta al lado.

*Por qué:* Que Frontend y Frontend-Platform se vean idénticos y que un cambio visual se haga una sola vez.

*Qué cambia:* La fuente de verdad es `skills/frontend/design-system/` en el Brain, sincronizada por copia con script entre las dos apps. Su agente dueño es `frontend-design`; todo cambio visual pasa por él.

Desarrollo las aplicó; **no son decisiones del comité de producto**.

**Fuente:** Rod, sesión de rediseño de los frontends, 2026-11-10 (las fases 1 y 2 las aprobó el 2026-11-08).

---

## D107 · Navegación por grupos del menú lateral (2026-11-10)

*Decisión:* Los grupos del menú (Mi empresa, Cumplimiento, Equipo) solo despliegan y no navegan. Cumplimiento es un grupo con seis secciones (Resumen, Riesgos, Causas, Controles, Evidencias, Exclusiones) en rutas `/cumplimiento/<sección>` sin id de servicio; el servicio activo se elige en el selector del encabezado y se recuerda entre secciones por usuario (las rutas viejas `/services/:id/cumplimiento/...` redirigen). Equipo tiene tres subítems, `/equipo/personas`, `/equipo/grupos` y `/equipo/organigrama`: Grupos (la página del rediseño) gestiona los grupos como entidades y el Organigrama (MD-197, llegó por `develop`) muestra quién depende de quién y desde ahí se crea o renombra el equipo de un responsable y se mueven delegados; «Cargos responsables» cuelga de Equipo para `admin_empresa`.

*Por qué:* Un menú que no cambie según el servicio y que agrupe por tarea, no por pantalla.

*Qué cambia:* Rutas y menú de los frontends. No cambia guards, roles ni contratos.

Desarrollo las aplicó; **no son decisiones del comité de producto**.

**Fuente:** Rod, sesión de rediseño de los frontends, 2026-11-10 (las fases 1 y 2 las aprobó el 2026-11-08); los tres subítems de Equipo, Rod, 2026-11-11, al integrar `develop` (que traía el organigrama) en el rediseño.

---

## D108 · El banner con degradado solo se permite en el encabezado del shell de Cumplimiento (2026-11-10)

*Decisión:* Excepción a la regla «sin banner con fondo»: el encabezado del shell de Cumplimiento puede llevar un banner de color con degradado, sin flecha de volver ni iconos, con el título de la sección, el servicio, el marco, el período y una línea de contexto con datos ya cargados.

*Por qué:* Dar a Cumplimiento un encabezado que diga de un vistazo qué servicio, marco y período se está viendo, sin extender el banner al resto del producto.

*Qué cambia:* Solo ese encabezado; en cualquier otra pantalla sigue vigente «sin banner con fondo» (D106).

Desarrollo las aplicó; **no son decisiones del comité de producto**.

**Fuente:** Rod, sesión de rediseño de los frontends, 2026-11-10 (las fases 1 y 2 las aprobó el 2026-11-08).

---

## D109 · Una sola tabla para todo el producto (2026-11-10)

*Decisión:* Toda tabla usa `data-table` del design system, con celda de persona, barra de herramientas, filtros, paginación canónica y fila clicable con flecha. El detalle de una persona es un panel lateral de solo lectura con los datos de la lista y las acciones que ya existen (no hay endpoint de detalle). La lista de personas no tiene buscador porque el Backend no busca por texto (ver P42).

*Por qué:* Una tabla se aprende una vez; y no se promete en pantalla lo que la API no ofrece.

*Qué cambia:* Las tablas de los frontends migran a `data-table`. Si el comité decide un buscador o un detalle propio, se reabre con P42.

Desarrollo las aplicó; **no son decisiones del comité de producto**.

**Fuente:** Rod, sesión de rediseño de los frontends, 2026-11-10 (las fases 1 y 2 las aprobó el 2026-11-08).

## D111 · Cada persona guarda su idioma y los correos salen en él; cambiar de idioma recarga la app (2026-11-12)

*Decisión:*

1. **La cuenta guarda su idioma** (`users.preferred_language`: `es` · `en`, por defecto `es`). Lo fija el frontend con `PATCH /v1/auth/me/language` al cambiar de idioma y al iniciar sesión si no coincide con el que la persona ve.
2. **Los correos salen en el idioma de quien los recibe cuando se sabe:** recuperar la contraseña y el aviso de contraseña cambiada, en el idioma guardado. La invitación y la clave de acceso de una empresa nueva, en el idioma de quien las envía (quien las recibe aún no tiene cuenta); la cuenta invitada nace con ese idioma.
3. **Cambiar de idioma recarga la aplicación** con un estado de carga, en las dos apps: todo lo que traduce el backend (catálogos, descripciones, nombres) se vuelve a pedir en el idioma nuevo sin depender de que cada pantalla lo haga.
4. Lo que el backend sirve desde la base en un solo idioma y no es catálogo del comité (categorías de conexión, descripciones de marcos, «Ninguna»/«Otra», el grupo «Responsables») se traduce al responder, por código. El catálogo del comité queda en DT-100 (MD-212).

*Por qué:* Una auditoría de MD-211 encontró correos siempre en español, vistas que no cambiaban de idioma hasta recargar y datos de la base en un solo idioma. Recargar es la forma más simple de no dejar ninguna pantalla a medias.

*Qué cambia:* Columna `users.preferred_language`; `PATCH /v1/auth/me/language` y `user.preferred_language` en las respuestas de sesión (`contracts/autenticacion.md`); plantillas de correo por idioma; `LanguageService` de las dos apps recarga al cambiar.

La propuso desarrollo y la aprobó el responsable de producto; **no es una decisión del comité**.

**Fuente:** Rod, sesión de MD-211, 2026-11-12.

## D115 · Un solo badge de rectángulo redondeado para códigos, atributos y estados, en las dos apps (2026-11-13)

**Decisión.** El design system tiene **un** componente de badge (`app-badge`): rectángulo redondeado con el radio de control de Monkey (no píldora), tinte suave del color al 12-15 % con borde de 1 px del mismo tono y texto en el tono fuerte (contraste ≥ 4,5:1 en claro y oscuro). Tiene tres tipos, cada uno con su color: **código** (`T-CLD-001`, `AST-1`, códigos de requisito): tinte de marca; **atributo** (tipo de recurso, capacidad, «funciona con», categoría): color **fijo por valor** de la paleta de datos (`data-1`…`data-5`), de modo que el mismo valor es del mismo color en toda la app; **estado** (disponible, preparado, requiere trabajo, sin medir): colores semánticos de estado (`ok`, `warn`, `bad`, `neutral`) con un punto de color dentro, de modo que el color no es la única señal. Es el mismo componente en Frontend y Frontend-Platform.

**Por qué.** Varias pantallas se veían planas y monocromas: los códigos, los atributos y los estados se leían igual que el texto que los rodea. Un badge con color propio por tipo hace visible de un vistazo qué es cada dato.

**Qué cambia.** Reemplaza dos reglas del README del design system: «sin píldoras ni chips decorativos» (ahora el badge es el elemento permitido para código, atributo y estado) y «estado = punto de color + texto sin pastilla» (el estado lleva badge). `tag` y `status-indicator` pasan a ser este mismo componente. Se mantiene: el color del estado sigue significando solo estado, y la escala de riesgo conserva sus tokens propios.

**Fuente:** Rod, 2026-11-13 (tres capturas de referencia, con los códigos, los atributos y los estados marcados; estilo de tinte suave con borde fino, color fijo por valor y punto en el estado).

## D116 · Esqueleton para el contenido que carga; spinner solo para procesos y botones ocupados (2026-11-13)

**Decisión.** En las dos apps, todo contenido que carga datos (tablas, campos, tarjetas, métricas, paneles de detalle) muestra un **esqueleton** con la forma del contenido real (`app-skeleton`; en tablas, filas esqueleton con las mismas columnas), por región y no como un bloque único. El **spinner** (`app-loading-spinner`) queda solo para **procesos largos** (conectar un proveedor, ejecutar una evaluación). Los botones que lanzan un proceso se marcan con la directiva `appBusy`: spinner dentro del botón, botón deshabilitado y con `aria-busy`, anchura estable, y los campos del formulario en solo lectura mientras dura. **El estado ocupado se mantiene hasta que llega la respuesta** (y, si la acción navega, hasta que la ruta cambia); si falla, se quita y se muestra el error. Sin retardos artificiales.

**Por qué.** Casi todas las pantallas cargaban con un spinner en bloque, que oculta la estructura y hace saltar el diseño; los botones escribían su spinner a mano de formas distintas, y el spinner a veces desaparecía antes de que terminara la acción. El esqueleton es más legible y estable, y `aria-busy`/`role=status` mejora la accesibilidad. Con `prefers-reduced-motion` no hay animación.

**Qué cambia.** El design system suma `app-skeleton` y `appBusy` y la tabla acepta `loading`; las pantallas que usan `app-loading-spinner` para cargar datos pasan a esqueleton; los botones con spinner propio pasan a `appBusy`. Es elemento compartido, idéntico en Frontend y Frontend-Platform.

**Fuente:** Rod, 2026-11-13 (esqueleton para campos, tablas y casillas; spinner solo en procesos y botones; el spinner permanece hasta recibir la respuesta; botón y campos bloqueados; esqueleton por región).
