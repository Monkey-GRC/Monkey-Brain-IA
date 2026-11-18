# Verificación visual: capturas reales, no lectura de código

`qa`, `frontend-senior` y `frontend-design` **no ven el navegador**. Un PASS por specs, build y greps no prueba que una pantalla
se vea como se pidió (2026-11-10: el login de Platform se veía distinto al del Admin con todo en PASS, porque el `ng serve` de
Rod servía un bundle viejo). Todo cambio visual se cierra con capturas reales.

## 1. Capturas con Chrome sin interfaz

Contra un `ng serve` propio en **otro puerto** (los 4200 y 4201 son de Rod; el hook `pre-bash-guard.sh` los bloquea):

```bash
npx ng serve --port 4300     # Platform; el Admin, en 4301
/usr/bin/google-chrome --headless=new --no-sandbox --window-size=1920,950 --virtual-time-budget=9000 \
  --screenshot=/ruta/captura.png http://localhost:4300/signin
```

Rutas de login: Platform `/signin`, Admin `/auth/login`. Lee la imagen después de sacarla. La extensión de Chrome suele no
estar conectada; no dependas de ella.

## 2. Pantallas con sesión sin credenciales

Un script Node con `ws` (está en `node_modules` de Platform) lanza Chrome headless con `--remote-debugging-port` y
`--disable-web-security`, intercepta `http://localhost:3000/*` con `Fetch.enable` y responde con datos que **siguen el
contrato** (`/auth/me` con el rol deseado; `mk_session=1` en `localStorage`). Para el segundo factor se simula `/auth/login`
con `next_step: mfa_verify`. **Di siempre que los datos son simulados.**

## 3. Que el servidor de Rod sirva el build nuevo

Antes de decirle «ya está», `curl` al `main.js` de `:4200` (Platform) y `:4201` (Admin) y busca una clase o un texto nuevo.
Si no aparece, su `ng serve` está sirviendo un bundle viejo: díselo.

## 4. Qué se le entrega a Rod

- Capturas de **las dos apps** si el cambio toca el design system, en **claro y oscuro**, **es y en**.
- La pregunta explícita «¿apruebas el estilo?». Los comandos de commit van **en el mensaje siguiente a su aprobación**,
  nunca antes (`monkey-dev-flow`, paso 9).
- No digas «idéntico» o «unificado» solo por el diff de archivos.
- A los agentes, criterios de aceptación visibles, y que listen qué verificaron en pantalla y qué no.
