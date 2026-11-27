#!/usr/bin/env node
// Capturas reproducibles de una pantalla de Monkey (Platform o Admin) sin backend: levanta el servidor de desarrollo de la app
// (o reutiliza uno con --url), abre el Chrome del sistema con playwright-core, responde la API con fixtures JSON, deja la sesión
// iniciada y saca capturas a 1440×900 y 1920×1080 en claro y oscuro. Uso y formato de fixtures: README.md de esta carpeta.
import { spawn } from 'node:child_process';
import { closeSync, existsSync, mkdirSync, openSync, readFileSync } from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { RULES, auditPage } from './audit.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MONKEY_ROOT = path.resolve(HERE, '../../../../..'); // …/Monkey (carpeta que contiene los repos hermanos)
const APPS = {
  platform: { dir: path.join(MONKEY_ROOT, 'Frontend-Platform'), fixtures: path.join(HERE, 'fixtures/platform/_session') },
  admin: { dir: path.join(MONKEY_ROOT, 'Frontend'), fixtures: path.join(HERE, 'fixtures/admin/_session') },
};
// Puertos del usuario (backend, Platform, Admin): nunca se usan ni se reutilizan para levantar un servidor propio.
const RESERVED_PORTS = new Set([3000, 4200, 4201]);
const DEFAULT_VIEWPORTS = ['1440x900', '1920x1080'];
const DEFAULT_THEMES = ['light', 'dark'];

// ---------- argumentos ----------
function usage(msg) {
  if (msg) console.error(`error: ${msg}\n`);
  console.error(`uso: node render.mjs --app platform|admin --route /ruta --fixtures <dir> [opciones]

  --app platform|admin     app a levantar (obligatorio salvo con --url)
  --url <http://…>         reutiliza un servidor ya levantado (no arranca ni mata nada)
  --route </ruta?query>    ruta a abrir (por defecto /)
  --fixtures <dir>         carpeta de fixtures (repetible; la última gana). La sesión de la app se añade sola
  --no-session             no añadir los fixtures de sesión por defecto (para capturar el login)
  --click <selector>       paso: clic (repetible; los pasos corren en el orden escrito)
  --wait <selector>        paso: esperar a que el selector sea visible
  --sleep <ms>             paso: esperar un tiempo fijo
  --hover <selector>       paso: pasar el puntero (tooltips, menús)
  --scroll-to <selector>   paso: desplazar hasta que el elemento quede arriba (también dentro de un panel o modal con scroll propio)
  --scroll <sel>@<px|top|bottom>  paso: desplazar un contenedor con scroll a una posición (p. ej. '[role=dialog] .overflow-y-auto@bottom')
  --shot <etiqueta>        paso: captura intermedia (<nombre>-<etiqueta>-<tamaño>-<tema>.png); la captura final se saca igual
  --slow-api <ms>          retrasa cada respuesta de la API (capturar estados de carga)
  --slow-match <texto>     con --slow-api, solo retrasa las rutas que contienen el texto (repetible)
  --out <dir>              carpeta de salida (por defecto: $CLAUDE_SCRATCHPAD o el tmp del sistema, /monkey-render)
  --name <prefijo>         prefijo de los archivos (por defecto, derivado de la ruta)
  --viewports 1440x900,…   tamaños (por defecto ${DEFAULT_VIEWPORTS.join(',')})
  --themes light,dark      temas (por defecto light,dark)
  --lang es|en             idioma de la interfaz (por defecto es)
  --full-page              captura la página entera además de la ventana visible
  --audit fail|warn|off    comprobaciones de diseño medidas en cada captura (por defecto fail: con hallazgos sale con código 2)
  --api-base <url>         base de la API que la app llama (por defecto http://localhost:3000/v1)
  --port <n>               puerto para el servidor propio (por defecto, el primero libre ≥ 4300)
  --keep-server            deja el servidor levantado al terminar (imprime la URL y el PID para matarlo)
  --timeout <ms>           espera máxima por paso (por defecto 20000)`);
  process.exit(2);
}

function parseArgs(argv) {
  const o = { fixtures: [], steps: [], slowMatch: [], session: true, viewports: DEFAULT_VIEWPORTS, themes: DEFAULT_THEMES, lang: 'es', audit: 'fail', route: '/', apiBase: 'http://localhost:3000/v1', timeout: 20000 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const val = () => {
      const v = argv[++i];
      if (v === undefined) usage(`${a} necesita un valor`);
      return v;
    };
    switch (a) {
      case '--app': o.app = val(); break;
      case '--url': o.url = val().replace(/\/$/, ''); break;
      case '--route': o.route = val(); break;
      case '--fixtures': o.fixtures.push(path.resolve(val())); break;
      case '--no-session': o.session = false; break;
      case '--click': o.steps.push({ kind: 'click', arg: val() }); break;
      case '--wait': o.steps.push({ kind: 'wait', arg: val() }); break;
      case '--sleep': o.steps.push({ kind: 'sleep', arg: Number(val()) }); break;
      case '--hover': o.steps.push({ kind: 'hover', arg: val() }); break;
      case '--scroll-to': o.steps.push({ kind: 'scrollTo', arg: val() }); break;
      case '--scroll': o.steps.push({ kind: 'scroll', arg: val() }); break;
      case '--shot': o.steps.push({ kind: 'shot', arg: val() }); break;
      case '--slow-api': o.slowApi = Number(val()); break;
      case '--slow-match': o.slowMatch.push(val()); break;
      case '--out': o.out = path.resolve(val()); break;
      case '--name': o.name = val(); break;
      case '--viewports': o.viewports = val().split(','); break;
      case '--themes': o.themes = val().split(','); break;
      case '--lang': o.lang = val(); break;
      case '--full-page': o.fullPage = true; break;
      case '--audit': o.audit = val(); break;
      case '--api-base': o.apiBase = val().replace(/\/$/, ''); break;
      case '--port': o.port = Number(val()); break;
      case '--keep-server': o.keepServer = true; break;
      case '--timeout': o.timeout = Number(val()); break;
      case '-h': case '--help': usage(); break;
      default: usage(`opción desconocida: ${a}`);
    }
  }
  if (!['fail', 'warn', 'off'].includes(o.audit)) usage('--audit fail|warn|off');
  if (!o.url && !APPS[o.app]) usage('--app platform|admin (o --url)');
  if (o.app && !APPS[o.app]) usage(`--app desconocida: ${o.app}`);
  if (o.port && RESERVED_PORTS.has(o.port)) usage(`el puerto ${o.port} es del usuario; usa uno ≥ 4300`);
  if (o.url) {
    const p = Number(new URL(o.url).port);
    if (RESERVED_PORTS.has(p)) console.warn(`aviso: ${o.url} es un servidor del usuario; solo se lee, no se toca.`);
  }
  for (const v of o.viewports) if (!/^\d+x\d+$/.test(v)) usage(`viewport inválido: ${v}`);
  for (const t of o.themes) if (!['light', 'dark'].includes(t)) usage(`tema inválido: ${t}`);
  if (!o.fixtures.length && o.session && !o.app) usage('con --url sin --app no hay sesión por defecto: pasa --fixtures');
  if (o.session && o.app) o.fixtures.unshift(APPS[o.app].fixtures);
  o.out ??= path.join(process.env.CLAUDE_SCRATCHPAD || os.tmpdir(), 'monkey-render');
  o.name ??= (o.route.split('?')[0].replace(/^\/+|\/+$/g, '').replace(/[^a-zA-Z0-9]+/g, '-') || 'home') + (o.route.includes('?') ? '-q' : '');
  return o;
}

// ---------- fixtures ----------
// Cada carpeta tiene un `routes.json`: [{ "method": "GET", "path": "/compliance/services/:id/controls", "query": {"tab":"x"}?,
// "file": "controls.json" | "body": {...}, "status": 200?, "delay": ms? }]. `path` es relativo a --api-base; `:x` y `*` valen un
// segmento, `**` cualquier resto. Si varias reglas coinciden gana la de la carpeta pasada después y, dentro de una carpeta, la primera.
function loadFixtures(dirs) {
  const rules = [];
  dirs.forEach((dir, layer) => {
    const manifest = path.join(dir, 'routes.json');
    if (!existsSync(manifest)) throw new Error(`falta ${manifest}`);
    const list = JSON.parse(readFileSync(manifest, 'utf8'));
    list.forEach((r, idx) => {
      if (!r.path || (!r.file && r.body === undefined && r.text === undefined && !r.status)) throw new Error(`${manifest}[${idx}]: necesita path y file|body|status`);
      const method = (r.method || 'GET').toUpperCase();
      const re = new RegExp(
        '^' +
          r.path
            .replace(/\/+$/, '')
            .split('/')
            .map((seg) => (seg === '**' ? '.*' : seg === '*' ? '[^/]+' : seg.startsWith(':') ? `(?<${seg.slice(1)}>[^/]+)` : seg.replace(/[.+?^${}()|[\]\\]/g, '\\$&')))
            .join('/') +
          '/?$',
      );
      rules.push({ ...r, method, re, layer, idx, dir });
    });
  });
  // la última carpeta gana; dentro de una, el orden del archivo
  rules.sort((a, b) => b.layer - a.layer || a.idx - b.idx);
  return rules;
}

// `file` admite los parámetros de la ruta: { "path": "/catalogs/:name", "file": "catalogs/{name}.json" }. Si el archivo resultante no existe, la regla no
// coincide (la ruta sale en la lista de faltantes).
function matchRule(rules, method, apiPath, searchParams) {
  for (const r of rules) {
    if (r.method !== method && r.method !== '*') continue;
    const m = r.re.exec(apiPath);
    if (!m) continue;
    if (r.query && Object.entries(r.query).some(([k, v]) => searchParams.get(k) !== String(v))) continue;
    const file = r.file ? r.file.replace(/\{(\w+)\}/g, (_, k) => m.groups?.[k] ?? '') : undefined;
    if (file && !existsSync(path.join(r.dir, file))) continue;
    return { ...r, file };
  }
  return undefined;
}

function ruleBody(r) {
  if (r.text !== undefined) return r.text;
  if (r.body !== undefined) return JSON.stringify(r.body);
  if (r.file) return readFileSync(path.join(r.dir, r.file), 'utf8');
  return '';
}

// ---------- servidor ----------
function portFree(port) {
  return new Promise((resolve) => {
    const s = net.createServer().once('error', () => resolve(false)).once('listening', () => s.close(() => resolve(true)));
    s.listen(port, '127.0.0.1');
  });
}

async function freePort(start) {
  for (let p = start; p < start + 200; p++) if (!RESERVED_PORTS.has(p) && (await portFree(p))) return p;
  throw new Error('no hay puerto libre ≥ 4300');
}

async function waitHttp(url, child, timeoutMs) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    if (child && child.exitCode !== null) throw new Error('el servidor de desarrollo terminó antes de estar listo');
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* aún no */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`el servidor no respondió en ${timeoutMs / 1000}s: ${url}`);
}

async function startServer(app, wanted, logDir) {
  const port = wanted ?? (await freePort(4300));
  if (!(await portFree(port))) throw new Error(`el puerto ${port} está ocupado`);
  const dir = APPS[app].dir;
  const ngBin = path.join(dir, 'node_modules/.bin/ng');
  if (!existsSync(ngBin)) throw new Error(`no encuentro ${ngBin}: ¿npm install en la app?`);
  // La salida va a un archivo (no a un pipe): así el servidor sigue vivo con --keep-server cuando este proceso termina.
  mkdirSync(logDir, { recursive: true });
  const logFile = path.join(logDir, `ng-serve-${app}-${port}.log`);
  const fd = openSync(logFile, 'w');
  const child = spawn(ngBin, ['serve', '--port', String(port), '--host', '127.0.0.1', '--configuration', 'development', '--no-open', '--no-hmr'], {
    cwd: dir,
    detached: true, // grupo de procesos propio: al terminar se mata el grupo entero (ng + esbuild)
    stdio: ['ignore', fd, fd],
    env: { ...process.env, NG_CLI_ANALYTICS: 'false', FORCE_COLOR: '0' },
  });
  closeSync(fd);
  const url = `http://127.0.0.1:${port}`;
  console.log(`· levantando ${app} en ${url} (pid ${child.pid}, log ${logFile})…`);
  try {
    await waitHttp(url, child, 240000);
  } catch (e) {
    killServer(child);
    throw new Error(`${e.message}\n--- salida del servidor (${logFile}) ---\n${readFileSync(logFile, 'utf8').slice(-4000)}`);
  }
  return { url, child, logFile };
}

function killServer(child) {
  if (!child || child.exitCode !== null) return;
  try {
    process.kill(-child.pid, 'SIGTERM');
  } catch {
    /* ya no está */
  }
}

// ---------- navegador ----------
const CHROME = ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => existsSync(p));

async function capture(browser, opts, rules, baseUrl, theme, viewport, report) {
  const [width, height] = viewport.split('x').map(Number);
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, locale: opts.lang === 'en' ? 'en-US' : 'es-ES', reducedMotion: 'reduce' });
  // Sesión y preferencias antes de que arranque la app: marca de sesión (sin ella la app ni pregunta a /auth/me), tema e idioma.
  await context.addInitScript(({ theme, lang, session }) => {
    try {
      if (session) localStorage.setItem('mk_session', '1');
      localStorage.setItem('theme', theme);
      localStorage.setItem('lang', lang);
    } catch {
      /* sin almacenamiento */
    }
  }, { theme, lang: opts.lang, session: opts.session });

  const api = new URL(opts.apiBase);
  const apiPrefix = api.origin + api.pathname.replace(/\/$/, '');
  let pending = 0;

  await context.route((u) => u.href.startsWith(apiPrefix + '/') || u.href === apiPrefix, async (route) => {
    const req = route.request();
    const u = new URL(req.url());
    const apiPath = u.pathname.slice(api.pathname.replace(/\/$/, '').length) || '/';
    const origin = (await req.headerValue('origin')) || baseUrl;
    const cors = {
      'access-control-allow-origin': origin,
      'access-control-allow-credentials': 'true',
      'access-control-allow-headers': (await req.headerValue('access-control-request-headers')) || '*',
      'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      vary: 'Origin',
    };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    pending++;
    try {
      const rule = matchRule(rules, req.method(), apiPath, u.searchParams);
      const key = `${req.method()} ${apiPath}${u.search}`;
      let delay = rule?.delay ?? 0;
      if (opts.slowApi && (!opts.slowMatch.length || opts.slowMatch.some((m) => apiPath.includes(m)))) delay = Math.max(delay, opts.slowApi);
      if (delay) await new Promise((r) => setTimeout(r, delay));
      if (!rule) {
        report.missing.add(key);
        return await route.fulfill({
          status: 404,
          headers: { ...cors, 'content-type': 'application/json' },
          body: JSON.stringify({ statusCode: 404, message: 'common.not_found', data: null, error: { code: 'NOT_FOUND' } }),
        });
      }
      report.served.add(`${key} → ${rule.file ?? (rule.body !== undefined ? '(body)' : rule.status)}`);
      const status = rule.status ?? 200;
      await route.fulfill({ status, headers: { ...cors, 'content-type': rule.contentType || 'application/json' }, body: status === 204 ? '' : ruleBody(rule) });
    } catch (e) {
      if (!String(e).includes('Target') && !String(e).includes('closed')) report.errors.add(`fixture ${apiPath}: ${e.message}`);
    } finally {
      pending--;
    }
  });

  const page = await context.newPage();
  page.on('pageerror', (e) => report.errors.add(`pageerror: ${e.message.split('\n')[0]}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/Failed to load resource|status of 404/.test(m.text())) report.errors.add(`console: ${m.text().split('\n')[0].slice(0, 300)}`);
  });

  const quiet = async (ms = 400) => {
    // red de la API en calma durante `ms` (o se rinde al timeout)
    // …y la URL quieta (los guards y la app reescriben la ruta tras cargar: `?servicio=` se quita, etc.)
    const t0 = Date.now();
    let since = Date.now();
    let url = page.url();
    while (Date.now() - t0 < opts.timeout) {
      if (pending > 0 || page.url() !== url) {
        since = Date.now();
        url = page.url();
      } else if (Date.now() - since >= ms) return;
      await page.waitForTimeout(50);
    }
  };

  // Fuentes: Geist e iconos (Material Symbols Rounded/Outlined). Sin la de iconos se ven palabras («check_circle») en lugar de iconos.
  const settleFonts = async () => {
    const iconsLoaded = await page.evaluate(async () => {
      const fams = ['Material Symbols Rounded', 'Material Symbols Outlined', 'Geist Variable'];
      const loaded = () => [...document.fonts].some((ff) => ff.family.replace(/"/g, '').startsWith('Material Symbols') && ff.status === 'loaded');
      for (let i = 0; i < 50 && !loaded(); i++) {
        await Promise.all(fams.map((f) => document.fonts.load(`24px "${f}"`, 'check').catch(() => null)));
        await document.fonts.ready;
        if (!loaded()) await new Promise((r) => setTimeout(r, 100));
      }
      return loaded();
    });
    if (!iconsLoaded) report.errors.add(`la fuente de iconos no cargó (${theme} ${viewport})`);
    if (!opts.slowApi) await quiet(200);
    await page.waitForTimeout(250); // un frame para animaciones de entrada (reducedMotion las acorta)
  };

  const shoot = async (label) => {
    await settleFonts();
    mkdirSync(opts.out, { recursive: true });
    const base = path.join(opts.out, `${opts.name}${label ? `-${label}` : ''}-${viewport}-${theme}`);
    await page.screenshot({ path: `${base}.png`, animations: 'disabled' });
    report.files.push(`${base}.png`);
    if (opts.fullPage) {
      await page.screenshot({ path: `${base}-full.png`, fullPage: true, animations: 'disabled' });
      report.files.push(`${base}-full.png`);
    }
    // Scroll horizontal de la página: casi siempre es un error de layout.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (overflow > 0) report.errors.add(`scroll horizontal de ${overflow}px en ${viewport}${label ? ` (${label})` : ''}`);
    // MD-533 · Lo que se puede medir no se deja al ojo: cada hallazgo sale con su regla, el elemento y en qué tamaños aparece.
    if (opts.audit !== 'off') {
      for (const f of await page.evaluate(auditPage)) {
        const key = `${f.rule}|${f.where}|${f.text}`;
        const entry = report.layout.get(key) ?? { ...f, at: new Set() };
        entry.at.add(`${viewport}${label ? ` ${label}` : ''}`);
        report.layout.set(key, entry);
      }
    }
  };

  await page.goto(baseUrl + opts.route, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForLoadState('load').catch(() => {});
  if (!opts.slowApi) await quiet();
  else await page.waitForTimeout(300);

  for (const s of opts.steps) {
    if (s.kind === 'click') {
      await page.locator(s.arg).first().click({ timeout: opts.timeout });
      if (!opts.slowApi) await quiet();
      else await page.waitForTimeout(150);
    } else if (s.kind === 'wait') await page.locator(s.arg).first().waitFor({ state: 'visible', timeout: opts.timeout });
    else if (s.kind === 'sleep') await page.waitForTimeout(s.arg);
    else if (s.kind === 'hover') await page.locator(s.arg).first().hover({ timeout: opts.timeout });
    else if (s.kind === 'scrollTo') {
      await page.locator(s.arg).first().evaluate((el) => el.scrollIntoView({ block: 'start', behavior: 'instant' }), null, { timeout: opts.timeout });
      await page.waitForTimeout(150);
    } else if (s.kind === 'scroll') {
      const at = s.arg.lastIndexOf('@');
      if (at < 1) throw new Error(`--scroll espera <selector>@<px|top|bottom>: ${s.arg}`);
      const [sel, pos] = [s.arg.slice(0, at), s.arg.slice(at + 1)];
      await page.locator(sel).first().evaluate((el, pos) => el.scrollTo({ top: pos === 'bottom' ? el.scrollHeight : pos === 'top' ? 0 : Number(pos), behavior: 'instant' }), pos, { timeout: opts.timeout });
      await page.waitForTimeout(150);
    } else if (s.kind === 'shot') await shoot(s.arg);
  }

  const finalPath = new URL(page.url()).pathname;
  report.finalUrls.add(`${theme} ${viewport}: ${page.url().replace(baseUrl, '')}`);
  if (/\/(signin|auth\/login)/.test(finalPath) && opts.session) report.errors.add(`terminó en el login (${finalPath}): falta /auth/me o la sesión no se aceptó`);

  await shoot(null);
  await context.close();
}

// ---------- main ----------
async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!CHROME) throw new Error('no encuentro Chrome del sistema (/usr/bin/google-chrome)');
  const rules = loadFixtures(opts.fixtures);
  let server = null;
  let baseUrl = opts.url;
  const cleanup = () => {
    if (server && !opts.keepServer) killServer(server.child);
  };
  process.on('SIGINT', () => {
    cleanup();
    process.exit(130);
  });
  process.on('SIGTERM', () => {
    cleanup();
    process.exit(143);
  });

  const report = { files: [], missing: new Set(), served: new Set(), errors: new Set(), finalUrls: new Set(), layout: new Map() };
  let browser;
  try {
    if (!baseUrl) {
      server = await startServer(opts.app, opts.port, opts.out);
      baseUrl = server.url;
    }
    browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--font-render-hinting=none', '--disable-gpu'] });
    for (const theme of opts.themes)
      for (const vp of opts.viewports) {
        // Un servidor recién levantado recarga la página la primera vez (optimiza dependencias): se reintenta.
        for (let attempt = 1; ; attempt++) {
          const before = report.files.length;
          try {
            await capture(browser, opts, rules, baseUrl, theme, vp, report);
            break;
          } catch (e) {
            report.files.length = before;
            if (attempt >= 3 || !/context was destroyed|navigation|Target page|closed/i.test(e.message)) throw e;
            console.log(`· reintento ${theme} ${vp}: ${e.message.split('\n')[0]}`);
          }
        }
      }
  } finally {
    await browser?.close().catch(() => {});
    cleanup();
  }

  console.log('\nCapturas:');
  report.files.forEach((f) => console.log(`  ${f}`));
  console.log('\nURL final:');
  report.finalUrls.forEach((f) => console.log(`  ${f}`));
  if (report.missing.size) {
    console.log('\nRutas de la API SIN fixture (respondieron 404 con el sobre de error):');
    [...report.missing].sort().forEach((m) => console.log(`  ${m}`));
  }
  if (report.errors.size) {
    console.log('\nErrores de la página:');
    report.errors.forEach((e) => console.log(`  ${e}`));
  }
  if (report.layout.size) {
    console.log(`\nFallos de diseño medidos (${report.layout.size}); corrígelos o márcalos con data-audit-ok="motivo" y decláralo en el reporte:`);
    for (const rule of Object.keys(RULES)) {
      const found = [...report.layout.values()].filter((f) => f.rule === rule);
      if (!found.length) continue;
      console.log(`\n  ${RULES[rule]} · ${found.length}`);
      for (const f of found) console.log(`    - ${f.where} · «${f.text}» · ${f.detail} · en ${[...f.at].join(', ')}`);
    }
    if (opts.audit === 'fail') process.exitCode = 2;
  } else if (opts.audit !== 'off') console.log('\nFallos de diseño medidos: ninguno.');
  if (process.env.RENDER_VERBOSE) {
    console.log('\nServidas:');
    [...report.served].sort().forEach((m) => console.log(`  ${m}`));
  }
  if (server && opts.keepServer) console.log(`\nServidor levantado: ${baseUrl} (pid de grupo ${server.child.pid}; mátalo con: kill -- -${server.child.pid}). Reúsalo con --url ${baseUrl}`);
  if (server && opts.keepServer) server.child.unref();
}

main().catch((e) => {
  console.error(`\nerror: ${e.message}`);
  process.exit(1);
});
