import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { highlightFontSize, NoticeDialog } from './notice-dialog';

@Component({
  imports: [NoticeDialog],
  template: `<app-notice-dialog [open]="open()" title="Te enviamos un correo" message="Enviamos un enlace a:" [highlight]="highlight()" [hint]="hint()" closeLabel="Entendido" (closed)="closes = closes + 1" />`,
})
class Host {
  readonly open = signal(false);
  readonly highlight = signal<string | null>(null);
  readonly hint = signal<string | null>(null);
  closes = 0;
}

describe('NoticeDialog (un aviso genérico)', () => {
  function setup() {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const q = (id: string) => el.querySelector<HTMLElement>(`[data-testid="${id}"]`);
    return { fixture, host: fixture.componentInstance, el, q };
  }

  afterEach(() => document.body.classList.remove('overflow-hidden'));

  it('shows nothing until it is opened', () => {
    expect(setup().q('notice-dialog')).toBeNull();
  });

  it('shows the title, the message and the close button the caller provides', () => {
    const { fixture, host, el, q } = setup();
    host.open.set(true);
    fixture.detectChanges();
    expect(el.querySelector('#notice-title')!.textContent).toBe('Te enviamos un correo');
    expect(q('notice-message')!.textContent).toBe('Enviamos un enlace a:');
    expect(q('notice-close')!.textContent).toBe('Entendido');
    expect(q('notice-hint')).toBeNull();
  });

  it('puts the key datum (an email) in a box of its own, not inside a sentence, and only when given', () => {
    const { fixture, host, q } = setup();
    host.open.set(true);
    fixture.detectChanges();
    expect(q('notice-highlight')).toBeNull();
    host.highlight.set('ana@acme.co');
    fixture.detectChanges();
    expect(q('notice-highlight')!.textContent).toBe('ana@acme.co');
    expect(q('notice-message')!.textContent).not.toContain('ana@acme.co');
  });

  it('shows the extra note only when there is one', () => {
    const { fixture, host, q } = setup();
    host.open.set(true);
    host.hint.set('Revisa tu carpeta de spam.');
    fixture.detectChanges();
    expect(q('notice-hint')!.textContent).toBe('Revisa tu carpeta de spam.');
  });

  it('closes with its button and with Escape', () => {
    const { fixture, host, q } = setup();
    host.open.set(true);
    fixture.detectChanges();
    q('notice-close')!.click();
    expect(host.closes).toBe(1);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(host.closes).toBe(2);
  });
});

describe('highlightFontSize (un dato destacado en una sola línea)', () => {
  // `clamp(mínimo, calc((100cqw - relleno) / ancho), máximo)`: se lee el divisor, que crece con el largo del dato.
  const divisor = (text: string) => Number(/\/ ([\d.]+)\), 1rem\)$/.exec(highlightFontSize(text))![1]);

  it('has a readable floor and the normal size as the ceiling', () => {
    expect(highlightFontSize('ana@acme.co')).toMatch(/^clamp\(0\.75rem, .*, 1rem\)$/);
  });

  it('reserves more width per character count: a longer email gets a bigger divisor, so a smaller letter', () => {
    expect(divisor('a@b.co')).toBeLessThan(divisor('riosrodriguezhectorhernan59@gmail.com'));
    expect(divisor('riosrodriguezhectorhernan59@gmail.com')).toBeLessThan(divisor('nombre.muy.largo.de.una.persona.con.apellidos@dominio-corporativo.com'));
  });

  it('is proportional to the number of characters (with a safety margin for wide letters)', () => {
    expect(divisor('x'.repeat(40))).toBeCloseTo(40 * 0.62, 2);
  });

  it('does not break on an empty value', () => {
    expect(highlightFontSize('')).toContain('clamp(');
  });
});

describe('NoticeDialog · el dato destacado nunca se parte', () => {
  it('is kept on one line: no wrapping classes, and its size adapts to its length', () => {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.open.set(true);
    fixture.componentInstance.highlight.set('riosrodriguezhectorhernan59@gmail.com');
    fixture.detectChanges();
    const box = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('[data-testid="notice-highlight"]')!;
    expect(box.classList).toContain('whitespace-nowrap');
    expect(box.classList).not.toContain('break-all');
    expect(box.classList).not.toContain('break-words');
    expect(box.style.fontSize).toContain('clamp(');
    document.body.classList.remove('overflow-hidden');
  });
});
