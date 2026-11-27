#!/usr/bin/env node
// Autoprueba de audit.mjs (MD-533): una página con cada defecto a propósito y otra limpia. Cada regla debe saltar en su caso
// y ninguna en la limpia. Sin servidor ni app: `node audit.selftest.mjs`.
import { existsSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { RULES, auditPage } from './audit.mjs';

const CHROME = ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(existsSync);
const BASE = `<style>
  body { font: 14px/20px sans-serif; margin: 24px; width: 1200px; }
  .card { border: 1px solid #ccc; border-radius: 8px; padding: 20px; width: 320px; min-height: 64px; box-sizing: border-box; }
  .row { display: flex; gap: 16px; align-items: flex-start; margin-bottom: 24px; }
  .mk-btn { display: inline-block; padding: 8px 12px; border: 1px solid #333; border-radius: 6px; }
</style>`;
const CASES = {
  truncado: `<div class="card"><p style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">correo-muy-largo-de-una-persona@una-empresa-con-nombre-largo.example</p></div>`,
  'scroll-x': `<div class="card" style="overflow-x:auto;padding:20px"><div style="width:900px">Tabla más ancha que su contenedor</div></div>`,
  padding: `<div class="card" style="padding:4px"><p>Texto pegado al borde de la tarjeta</p></div>`,
  alturas: `<div class="row"><div class="card" style="height:120px"><p>Una</p></div><div class="card" style="height:180px"><p>Otra más alta</p></div></div>`,
  'boton-partido': `<div style="width:90px"><span class="mk-btn">Evaluar de nuevo ahora</span></div>`,
  hueco: `<div class="card" style="height:400px"><p>Solo una línea arriba</p></div>`,
  desborde: `<div class="card" style="width:200px"><p style="white-space:nowrap">Texto que no cabe y se sale de la tarjeta por la derecha</p></div>`,
};
const CLEAN = `<div class="row" style="align-items:stretch"><div class="card"><p title="correo@empresa.example">Un texto corto</p><span class="mk-btn">Editar</span></div><div class="card"><p>Otra tarjeta</p></div></div>
  <div class="card" style="width:600px"><pre style="overflow-x:auto;padding:12px">un comando muy largo que desplaza dentro de su bloque de código y no cuenta como error de la página ni de la tarjeta</pre></div>`;

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
let failed = 0;
const run = async (html) => {
  await page.setContent(BASE + html);
  return page.evaluate(auditPage);
};
for (const rule of Object.keys(RULES)) {
  const found = await run(CASES[rule]);
  const ok = found.some((f) => f.rule === rule);
  if (!ok) failed++;
  console.log(`${ok ? 'OK   ' : 'FALLA'} ${rule}: ${found.map((f) => `${f.rule} (${f.detail})`).join('; ') || 'sin hallazgos'}`);
}
const clean = await run(CLEAN);
if (clean.length) failed++;
console.log(`${clean.length ? 'FALLA' : 'OK   '} página limpia: ${clean.map((f) => `${f.rule} «${f.text}» (${f.detail})`).join('; ') || 'sin hallazgos'}`);
await browser.close();
process.exit(failed ? 1 : 0);
