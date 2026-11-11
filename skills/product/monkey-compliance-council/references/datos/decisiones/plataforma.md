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

*Decisión:* Los grupos del menú (Mi empresa, Cumplimiento, Equipo) solo despliegan y no navegan. Cumplimiento es un grupo con seis secciones (Resumen, Riesgos, Causas, Controles, Evidencias, Exclusiones) en rutas `/cumplimiento/<sección>` sin id de servicio; el servicio activo se elige en el selector del encabezado y se recuerda entre secciones por usuario (las rutas viejas `/services/:id/cumplimiento/...` redirigen). Equipo tiene dos subítems, `/equipo/personas` y `/equipo/grupos`; «Cargos responsables» cuelga de Equipo para `admin_empresa`.

*Por qué:* Un menú que no cambie según el servicio y que agrupe por tarea, no por pantalla.

*Qué cambia:* Rutas y menú de los frontends. No cambia guards, roles ni contratos.

Desarrollo las aplicó; **no son decisiones del comité de producto**.

**Fuente:** Rod, sesión de rediseño de los frontends, 2026-11-10 (las fases 1 y 2 las aprobó el 2026-11-08).

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
