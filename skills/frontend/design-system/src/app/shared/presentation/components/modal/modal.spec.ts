import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Modal } from './modal';

@Component({
  imports: [Modal],
  template: `
    <button id="opener" type="button">abrir</button>
    <app-modal [open]="open()" [dismissible]="dismissible()" labelledBy="t" describedBy="d" size="sm" testId="demo" (dismissed)="dismissals = dismissals + 1">
      @if (open()) {
        <h2 id="t">Título</h2>
        <p id="d">Descripción</p>
        <button id="first" type="button">uno</button>
        <button id="last" type="button">dos</button>
      }
    </app-modal>
  `,
})
class Host {
  readonly open = signal(false);
  readonly dismissible = signal(true);
  dismissals = 0;
}

describe('Modal (la base de todos los modales)', () => {
  function setup() {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const q = <T extends HTMLElement>(id: string) => el.querySelector<T>(`[data-testid="${id}"]`);
    return { fixture, host: fixture.componentInstance, el, q };
  }
  const open = async (s: ReturnType<typeof setup>) => {
    s.host.open.set(true);
    s.fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));
  };

  afterEach(() => document.body.classList.remove('overflow-hidden'));

  it('draws nothing while closed, and an accessible dialog while open', async () => {
    const s = setup();
    expect(s.q('demo-dialog')).toBeNull();
    await open(s);
    const panel = s.q('demo-dialog')!;
    expect(panel.getAttribute('role')).toBe('dialog');
    expect(panel.getAttribute('aria-modal')).toBe('true');
    expect(panel.getAttribute('aria-labelledby')).toBe('t');
    expect(panel.getAttribute('aria-describedby')).toBe('d');
    expect(panel.className).toContain('max-w-sm');
  });

  it('has the four sizes of the system, with xl for wide content such as a document preview', () => {
    const fixture = TestBed.createComponent(Modal);
    fixture.componentRef.setInput('labelledBy', 't');
    const sizes = (['sm', 'md', 'lg', 'xl'] as const).map((size) => {
      fixture.componentRef.setInput('size', size);
      return fixture.componentInstance.sizeClass;
    });
    expect(sizes).toEqual(['max-w-sm', 'max-w-md', 'max-w-lg', 'max-w-4xl']);
  });

  it('puts the keyboard focus inside when it opens', async () => {
    const s = setup();
    await open(s);
    expect(s.q('demo-dialog')!.contains(document.activeElement)).toBeTrue();
  });

  it('gives the focus back to where it was when it closes', async () => {
    const s = setup();
    const opener = s.el.querySelector<HTMLElement>('#opener')!;
    opener.focus();
    await open(s);
    s.host.open.set(false);
    s.fixture.detectChanges();
    expect(document.activeElement).toBe(opener);
  });

  it('locks the page scroll while open and releases it when closed', async () => {
    const s = setup();
    await open(s);
    expect(document.body.classList.contains('overflow-hidden')).toBeTrue();
    s.host.open.set(false);
    s.fixture.detectChanges();
    expect(document.body.classList.contains('overflow-hidden')).toBeFalse();
  });

  it('asks to be dismissed with Escape and with a click on the backdrop, not with a click inside', async () => {
    const s = setup();
    await open(s);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(s.host.dismissals).toBe(1);
    s.q('demo-dialog')!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(s.host.dismissals).toBe(1);
    s.q('demo-backdrop')!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(s.host.dismissals).toBe(2);
  });

  it('cannot be dismissed while it is not dismissible (a request is in flight)', async () => {
    const s = setup();
    await open(s);
    s.host.dismissible.set(false);
    s.fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    s.q('demo-backdrop')!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(s.host.dismissals).toBe(0);
  });

  it('keeps Tab inside: from the last control it goes back to the first, and Shift+Tab does the reverse', async () => {
    const s = setup();
    await open(s);
    const first = s.el.querySelector<HTMLElement>('#first')!;
    const last = s.el.querySelector<HTMLElement>('#last')!;
    last.focus();
    const forward = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    last.dispatchEvent(forward);
    expect(forward.defaultPrevented).toBeTrue();
    expect(document.activeElement).toBe(first);
    const back = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true });
    first.dispatchEvent(back);
    expect(back.defaultPrevented).toBeTrue();
    expect(document.activeElement).toBe(last);
  });
});
