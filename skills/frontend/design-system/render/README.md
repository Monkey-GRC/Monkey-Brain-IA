---
id: design-system-render
name: Capturas de pantalla sin backend (render)
description: Cómo un agente renderiza una pantalla de Platform o Admin con la sesión iniciada y la API simulada por fixtures, a 1440×900 y 1920×1080, en claro y oscuro, para mirarla antes de reportar.
type: skill
---

# Capturas sin backend

`render.mjs` levanta la app con `ng serve` en un puerto libre **≥ 4300** (nunca 3000, 4200 ni 4201), abre el Chrome del sistema
(`playwright-core`, sin descargar navegadores), responde **toda** la API con fixtures JSON, deja la sesión iniciada y saca las capturas.
Al terminar mata el servidor que levantó. No lee `.env` ni usa credenciales.

```bash
cd skills/frontend/design-system/render && npm install   # una vez; solo playwright-core
node render.mjs --app platform \
  --route '/cumplimiento/controles?servicio=55aa0000-0000-4000-8000-000000000001&abrir=3f1c0000-0000-4000-8000-000000000001&tab=approval' \
  --fixtures fixtures/platform/controls-approval --name control-aprobacion --out "$SCRATCHPAD/render" \
  --shot arriba --scroll-to app-control-exceptions-section --shot excepciones --scroll-to app-control-history
```

Salida: `<out>/<nombre>[-<etiqueta>]-<ancho>x<alto>-<tema>.png` (4 por paso `--shot` y 4 finales), la URL final, **las rutas de la API
sin fixture** y los errores de la página (consola, fuente de iconos sin cargar, scroll horizontal). Abre las capturas con `Read`.

## Opciones

| Opción | Para qué |
|---|---|
| `--app platform\|admin` · `--url <url>` | La app a levantar, o un servidor ya levantado (no lo arranca ni lo mata). Con `--keep-server` el servidor propio queda vivo para reusarlo con `--url` (el comando para matarlo sale al final) |
| `--route` | Ruta a abrir, con su query (el detalle de un control es `?abrir=<id>&tab=<pestaña>`) |
| `--fixtures <dir>` | Carpeta de fixtures; repetible, la última gana. La sesión (`fixtures/<app>/_session`) se añade sola; `--no-session` la quita (para el login) |
| `--click` · `--wait` · `--hover` · `--sleep` | Pasos, en el orden escrito. Un selector de Playwright (`[data-approve]`, `text=Devolver`) |
| `--scroll-to <sel>` · `--scroll <sel>@<px\|top\|bottom>` | Desplazar dentro del panel de detalle o de un contenedor con scroll propio |
| `--shot <etiqueta>` | Captura intermedia (p. ej. antes y después de abrir un diálogo) |
| `--slow-api <ms>` · `--slow-match <texto>` | Retrasa la API (o solo las rutas que contienen el texto) para capturar skeletons y estados de carga |
| `--viewports` · `--themes` · `--lang` · `--full-page` | Por defecto `1440x900,1920x1080`, `light,dark` y `es` |
| `--audit fail\|warn\|off` | Las comprobaciones medidas de abajo. Por defecto `fail`: con hallazgos el comando sale con código 2 |

## Comprobaciones medidas (MD-533)

En cada captura, `audit.mjs` mide la página y lista lo que falla, con el elemento, el texto y en qué tamaños aparece. **Con hallazgos
la pantalla no está lista** (código de salida 2): se corrigen, no se discuten.

| Regla | Qué mide |
|---|---|
| `truncado` | Texto con puntos suspensivos o recortado por líneas, sin `title` ni `app-expandable-text` |
| `scroll-x` | Un contenedor con scroll horizontal (solo se admite dentro de `pre`/`code`) |
| `padding` | Texto a menos de 16 px del borde de su tarjeta, o a menos de 8 px del borde de su celda |
| `alturas` | Tarjetas hermanas de una misma fila con alturas distintas |
| `boton-partido` | Un botón (`mk-btn*`) con el texto en más de una línea |
| `hueco` | Una tarjeta de 240 px o más con el 30 % final vacío |
| `desborde` | Texto que se sale de su tarjeta |

- Una excepción real se marca en la plantilla con `data-audit-ok="motivo"` (cubre al elemento y a sus hijos) y **se declara en el reporte**.
- No mide los esqueletos de carga, los iconos ni lo que solo es para lectores de pantalla (`sr-only`).
- `node audit.selftest.mjs` prueba las reglas contra una página con cada defecto y otra limpia: córrelo si cambias `audit.mjs`.
- Lo que no se puede medir (jerarquía, textos repetidos, dos elementos resaltados) sigue en la lista de control del agente.

## Cómo funciona la sesión

Las dos apps autentican con cookie `httpOnly` y, al arrancar, llaman `GET /v1/auth/me` solo si `localStorage.mk_session === '1'`.
El script pone esa marca, el tema (`localStorage.theme`: la app añade la clase `dark` a `<html>`) y el idioma (`localStorage.lang`) antes
de cargar, y `_session/` responde `/auth/me` con un `admin_empresa` (Platform) o un `admin_monkey` (Admin). Para otro rol, copia
`auth-me.json` en tu carpeta de fixtures con el `role` que necesites y una regla `GET /auth/me`: la tuya gana.

## Fixtures

Cada carpeta tiene un `routes.json`, con rutas relativas a `/v1`:

```json
[
  { "method": "GET", "path": "/services/:id/controls", "file": "controls-list.json" },
  { "method": "GET", "path": "/catalogs/:name", "file": "catalogs/{name}.json" },
  { "method": "GET", "path": "/controls/:id", "query": { "view": "technical" }, "file": "detail-tecnico.json" },
  { "method": "POST", "path": "/controls/:id/approval", "status": 422, "file": "error-validacion.json", "delay": 800 },
  { "method": "GET", "path": "/me/notifications/stream", "contentType": "text/event-stream", "text": "retry: 3600000\n\n" }
]
```

- `:x` y `*` valen un segmento; `**`, el resto. `{x}` en `file` toma el parámetro; si el archivo no existe, la ruta sale como faltante.
- El archivo es **la respuesta entera**, con el sobre de `contracts/conventions.md` (`statusCode`, `message`, `data`; paginación con `items`, `page`, `page_size`, `total`, `total_pages`).
- Una ruta sin regla responde `404` con el sobre de error (`error.code: NOT_FOUND`) y se lista al final: así se sabe qué falta.
- Los catálogos (`/catalogs/<enum>`) salen de `contracts/enums/`: valor y etiqueta, nunca inventados.
- Pon datos que estresen el layout: textos de 500 caracteres, nombres largos, muchos y pocos elementos, cada estado.

Ejemplo completo: `fixtures/platform/controls-approval/` (lista de controles con todos los estados de gestión y el detalle de `IAC-12`
devuelto, con corrección de nivel, plan y «No aplica» por aprobar, pruebas manuales e historial; motivos de 500 caracteres).

## Límites

- Solo lo que la app pide por HTTP a `--api-base` (por defecto `http://localhost:3000/v1`); el canal en vivo de avisos se responde una vez y no se reconecta.
- Las escrituras (aprobar, devolver) responden lo que diga el fixture: la pantalla no cambia de estado sola. Para capturar el resultado, pon el fixture del estado siguiente.
- Fechas y horas en la zona horaria del sistema.
