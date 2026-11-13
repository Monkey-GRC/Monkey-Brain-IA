import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Badge, BadgeColor, badgeColorIndex } from './badge';

@Component({
  imports: [Badge],
  template: `
    <app-badge id="code" kind="code">T-CLD-001</app-badge>
    <app-badge id="attr-a" kind="attribute">Bucket</app-badge>
    <app-badge id="attr-b" kind="attribute">Bucket</app-badge>
    <app-badge id="attr-v" kind="attribute" value="bucket">Cubo</app-badge>
    <app-badge id="attr-c" kind="attribute" [color]="4">Bucket</app-badge>
    <app-badge id="st" kind="status" tone="ok">Disponible</app-badge>
    <app-badge id="long" kind="status" tone="warn">Una etiqueta de estado demasiado larga para caber</app-badge>
    <app-badge id="small" kind="code" size="sm">AST-1</app-badge>
  `,
})
class Host {}

describe('Badge', () => {
  const root = () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };
  const byId = (r: HTMLElement, id: string) => r.querySelector('#' + id) as HTMLElement;

  it('is a rounded rectangle with tint, line and strong text from tokens, never a pill', () => {
    const el = byId(root(), 'code');
    expect(el.className).toContain('rounded-badge');
    expect(el.className).not.toContain('rounded-full');
    expect(el.className).toContain('bg-badge-brand-bg');
    expect(el.className).toContain('border-badge-brand-line');
    expect(el.className).toContain('text-badge-brand-ink');
    expect(el.className).toContain('whitespace-nowrap');
  });

  it('code: tabular figures, no dot', () => {
    const el = byId(root(), 'code');
    expect(el.className).toContain('tabular-nums');
    expect(el.querySelector('span[aria-hidden="true"]')).toBeNull();
    expect(el.textContent!.trim()).toBe('T-CLD-001');
  });

  it('attribute: the same text is always the same data colour', () => {
    const r = root();
    expect(byId(r, 'attr-a').dataset['color']).toBe(byId(r, 'attr-b').dataset['color']);
    expect(byId(r, 'attr-a').className).toBe(byId(r, 'attr-b').className);
    expect(byId(r, 'attr-a').className).toMatch(/bg-badge-data-[1-5]-bg/);
  });

  it('attribute: `value` picks the colour (stable across translations) and `color` forces it', () => {
    const r = root();
    expect(byId(r, 'attr-v').dataset['color']).toBe(String(badgeColorIndex('bucket')));
    expect(byId(r, 'attr-c').dataset['color']).toBe('4');
    expect(byId(r, 'attr-c').className).toContain('bg-badge-data-4-bg');
  });

  it('badgeColorIndex is deterministic, ignores case and spaces and stays in 1..5', () => {
    expect(badgeColorIndex(' Bucket ')).toBe(badgeColorIndex('bucket'));
    const seen = new Set<BadgeColor>();
    for (const t of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'Cloud Storage', 'VM', 'Firewall', 'IAM']) {
      const i = badgeColorIndex(t);
      expect(i).toBeGreaterThanOrEqual(1);
      expect(i).toBeLessThanOrEqual(5);
      seen.add(i);
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('status: tinted by tone with a dot and the visible text', () => {
    const el = byId(root(), 'st');
    expect(el.className).toContain('bg-badge-ok-bg');
    expect(el.dataset['tone']).toBe('ok');
    expect(el.querySelector('span[aria-hidden="true"]')!.className).toContain('bg-ok');
    expect(el.textContent!.trim()).toBe('Disponible');
  });

  it('a long text is truncated and shows itself as a tooltip; a short one has none', () => {
    const r = root();
    const long = byId(r, 'long');
    expect(long.querySelector('.truncate')!.getAttribute('title')).toContain('demasiado larga');
    expect(byId(r, 'st').querySelector('[title]')).toBeNull();
  });

  it('small size is more compact than the default', () => {
    const r = root();
    expect(byId(r, 'small').className).toContain('text-xs');
    expect(byId(r, 'st').className).toContain('text-sm');
  });

  it('never names the probe or cloud engine provider', () => {
    const text = (root().textContent ?? '').toLowerCase();
    for (const name of [['wa', 'zuh'], ['pro', 'wler']]) {
      expect(text).not.toContain(name.join(''));
    }
  });
});
