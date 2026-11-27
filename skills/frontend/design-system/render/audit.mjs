// Comprobaciones de diseño MEDIDAS sobre la página renderizada (MD-533). `auditPage` corre dentro del navegador (page.evaluate):
// no puede usar nada de fuera. Mide los errores que Rod ya marcó y que el agente de diseño no veía en sus capturas:
// texto truncado, scroll horizontal, texto pegado al borde, tarjetas de una fila con alturas distintas, botones partidos,
// huecos vacíos y texto que se sale de su caja. Un elemento (o un ancestro) con `data-audit-ok="motivo"` queda fuera: cada
// uso se declara en el reporte del agente.

export const RULES = {
  truncado: 'Texto truncado sin forma de leerlo completo (ponle `title`, quita el recorte o usa `app-expandable-text`)',
  'scroll-x': 'Scroll horizontal dentro de un contenedor (solo se admite en bloques de código)',
  padding: 'Texto pegado al borde de su tarjeta o celda (mínimo 16 px en tarjetas, 8 px en celdas)',
  alturas: 'Tarjetas de una misma fila con alturas distintas',
  'boton-partido': 'Botón con el texto en más de una línea',
  hueco: 'Tarjeta con un hueco vacío grande al final',
  desborde: 'Texto que se sale de su tarjeta',
};

export function auditPage() {
  const CARD_MIN_H = 56;
  const CARD_MIN_W = 160;
  const out = [];
  const css = (el) => getComputedStyle(el);
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    const s = css(el);
    return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) > 0.05;
  };
  // Fuera: lo marcado a propósito, los esqueletos de carga, los iconos y lo que solo existe para lectores de pantalla.
  const skipped = (el) => !!el.closest('[data-audit-ok], app-skeleton, app-skeleton-region, [aria-hidden="true"], svg, [class*="material-symbols"], .sr-only');
  const where = (el) => {
    const host = el.closest('[data-test], [data-testid]') ?? [...(function* () { for (let p = el; p; p = p.parentElement) if (p.tagName.includes('-')) yield p; })()][0];
    const cls = (typeof el.className === 'string' ? el.className : '').split(/\s+/).filter(Boolean).slice(0, 4).join('.');
    return `${host ? host.tagName.toLowerCase() + ' ' : ''}${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}`;
  };
  const snippet = (el) => (el.innerText ?? el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 60);
  const add = (rule, el, detail) => out.push({ rule, where: where(el), text: snippet(el), detail });
  const px = (v) => parseFloat(v) || 0;
  const transparent = (c) => !c || c === 'transparent' || /rgba?\([^)]*,\s*0\)$/.test(c) || /\/\s*0\)$/.test(c);
  const ownText = (el) => [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
  const textRect = (node) => {
    const range = document.createRange();
    range.selectNodeContents(node);
    const rects = [...range.getClientRects()].filter((r) => r.width > 0.5 && r.height > 0.5);
    if (!rects.length) return null;
    return { left: Math.min(...rects.map((r) => r.left)), right: Math.max(...rects.map((r) => r.right)), top: Math.min(...rects.map((r) => r.top)), bottom: Math.max(...rects.map((r) => r.bottom)), lines: new Set(rects.map((r) => Math.round(r.top))).size };
  };
  const INTERACTIVE = 'button, a, input, select, textarea, label, summary, [role="button"], [role="tab"], [role="switch"], [role="checkbox"], [role="option"], [role="menuitem"]';
  const isCell = (el) => el.tagName === 'TD' || el.tagName === 'TH';
  // Una «tarjeta»: caja con borde en 3 lados o más, o con fondo propio y esquinas redondeadas, y tamaño de tarjeta (no un chip ni un botón).
  const isCard = (el) => {
    if (el.matches(INTERACTIVE) || el.matches('pre, code, html, body, tr, thead, tbody, table')) return false;
    const r = el.getBoundingClientRect();
    if (r.height < CARD_MIN_H || r.width < CARD_MIN_W) return false;
    const s = css(el);
    const sides = ['Top', 'Right', 'Bottom', 'Left'].filter((k) => px(s[`border${k}Width`]) > 0 && s[`border${k}Style`] !== 'none' && !transparent(s[`border${k}Color`])).length;
    return sides >= 3 || (!transparent(s.backgroundColor) && px(s.borderTopLeftRadius) >= 4);
  };
  const boxOf = (el) => {
    for (let p = el; p && p !== document.body; p = p.parentElement) {
      if (isCell(p) || isCard(p)) return p;
      // Un panel o modal superpuesto (posición fija) no se mide contra la página que tiene detrás.
      if (p.matches(INTERACTIVE) || p.matches('pre, code') || css(p).position === 'fixed') return null;
    }
    return null;
  };

  const all = [...document.body.querySelectorAll('*')].filter((el) => visible(el) && !skipped(el));

  for (const el of all) {
    const s = css(el);
    const texts = ownText(el);

    // 1 · Truncado: con puntos suspensivos o recortado por líneas, y sin `title` ni «ver más».
    if (texts.length) {
      const ellipsis = s.textOverflow === 'ellipsis' || ((s.overflowX === 'hidden' || s.overflowX === 'clip') && s.whiteSpace === 'nowrap');
      const clamped = s.webkitLineClamp && s.webkitLineClamp !== 'none' && el.scrollHeight > el.clientHeight + 1;
      const hasFull = !!el.closest('[title], app-expandable-text');
      if (!hasFull && ((ellipsis && el.scrollWidth > el.clientWidth + 1) || clamped)) add('truncado', el, clamped ? 'recortado por líneas' : `faltan ${el.scrollWidth - el.clientWidth} px`);
    }

    // 2 · Scroll horizontal propio (fuera de un bloque de código).
    if ((s.overflowX === 'auto' || s.overflowX === 'scroll') && el.scrollWidth > el.clientWidth + 1 && !el.matches('pre, code, html, body') && !el.closest('pre, code')) add('scroll-x', el, `${el.scrollWidth - el.clientWidth} px de más`);

    // 5 · Botón partido en dos líneas.
    if (el.matches('[class*="mk-btn"]')) {
      const lines = new Set(ownTextDeep(el).flatMap((n) => { const range = document.createRange(); range.selectNodeContents(n); return [...range.getClientRects()].filter((r) => r.width > 0.5).map((r) => Math.round(r.top / 4)); })).size;
      if (lines > 1) add('boton-partido', el, `${lines} líneas`);
    }
  }

  function ownTextDeep(el) {
    const nodes = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) if (n.textContent.trim().length > 1 && !n.parentElement.closest('[class*="material-symbols"], [aria-hidden="true"]')) nodes.push(n);
    return nodes;
  }

  // 3 y 7 · Texto pegado al borde de su tarjeta o celda, o fuera de ella. Un hallazgo por caja: el peor.
  const worst = new Map();
  for (const el of all) {
    for (const node of ownText(el)) {
      const box = boxOf(el);
      if (!box) continue;
      const t = textRect(node);
      if (!t) continue;
      const b = box.getBoundingClientRect();
      const s = css(box);
      const inner = { left: b.left + px(s.borderLeftWidth), right: b.right - px(s.borderRightWidth), top: b.top + px(s.borderTopWidth), bottom: b.bottom - px(s.borderBottomWidth) };
      const clips = s.overflowX !== 'visible' || s.overflowY !== 'visible';
      // Lo que quedó desplazado fuera de la zona visible de una caja con scroll no cuenta.
      if (clips && (t.bottom < inner.top || t.top > inner.bottom || t.right < inner.left || t.left > inner.right)) continue;
      const gaps = { izquierda: t.left - inner.left, derecha: inner.right - t.right, arriba: t.top - inner.top, abajo: inner.bottom - t.bottom };
      // Si un elemento intermedio ya recorta el texto, no se sale de la tarjeta: eso lo mide «truncado».
      let cut = false;
      for (let p = el; p && p !== box; p = p.parentElement) if (css(p).overflowX !== 'visible') cut = true;
      if (cut) continue;
      if (!clips && (gaps.izquierda < -1.5 || gaps.derecha < -1.5)) {
        const over = Math.round(-Math.min(gaps.izquierda, gaps.derecha));
        const prev = worst.get(box);
        if (!prev || prev.rule !== 'desborde' || over > prev.size) worst.set(box, { rule: 'desborde', el, size: over, detail: `${over} px fuera` });
        continue;
      }
      const cell = isCell(box);
      const min = cell ? 8 : 16;
      const sides = cell ? ['izquierda', 'derecha'] : ['izquierda', 'derecha', 'arriba', 'abajo'];
      for (const side of sides) {
        const gap = gaps[side];
        if (gap < -1.5 || gap >= min - 0.5) continue;
        const prev = worst.get(box);
        if (prev?.rule === 'desborde') continue;
        if (!prev || gap < prev.size) worst.set(box, { rule: 'padding', el, size: gap, detail: `${Math.max(0, Math.round(gap))} px ${side === 'arriba' || side === 'abajo' ? side : `a la ${side}`} (mínimo ${min}) en la caja ${where(box)}` });
      }
    }
  }
  for (const [, f] of worst) add(f.rule, f.el, f.detail);

  // 4 · Tarjetas hermanas de una fila con alturas distintas. 6 · Hueco vacío grande al final de una tarjeta.
  const cards = all.filter(isCard);
  const byParent = new Map();
  for (const c of cards) byParent.set(c.parentElement, [...(byParent.get(c.parentElement) ?? []), c]);
  for (const [parent, kids] of byParent) {
    if (!parent || kids.length < 2) continue;
    const rows = new Map();
    for (const k of kids) {
      const r = k.getBoundingClientRect();
      const key = Math.round(r.top / 3);
      rows.set(key, [...(rows.get(key) ?? []), r.height]);
    }
    for (const heights of rows.values()) {
      if (heights.length < 2) continue;
      const diff = Math.max(...heights) - Math.min(...heights);
      if (diff > 4) add('alturas', parent, `${heights.map((h) => Math.round(h)).join(' / ')} px`);
    }
  }
  for (const c of cards) {
    const r = c.getBoundingClientRect();
    if (r.height < 240) continue;
    const s = css(c);
    if (s.overflowY === 'auto' || s.overflowY === 'scroll') continue;
    const bottoms = [...c.querySelectorAll('*')].filter(visible).map((k) => k.getBoundingClientRect().bottom);
    if (!bottoms.length) continue;
    const gap = r.bottom - px(s.borderBottomWidth) - px(s.paddingBottom) - Math.max(...bottoms);
    if (gap > Math.max(96, r.height * 0.3)) add('hueco', c, `${Math.round(gap)} px vacíos de ${Math.round(r.height)}`);
  }

  return out;
}
