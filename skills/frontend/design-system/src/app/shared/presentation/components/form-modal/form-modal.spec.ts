import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { Busy } from '@shared/presentation/directives/busy';
import { FormModal } from './form-modal';

@Component({
  imports: [FormModal, Busy],
  template: `
    <app-form-modal titleKey="T.TITLE" [descriptionKey]="description()" [dismissible]="dismissible()" [guarded]="guarded()" [busy]="busy()" [closeButton]="true" (closed)="closes = closes + 1">
      <input id="field" />
      <input id="check" type="checkbox" />
      <button actions type="button" class="mk-btn" id="save" [appBusy]="busy()">Save</button>
    </app-form-modal>
  `,
})
class Host {
  readonly description = signal<string | null>('T.DESC');
  readonly dismissible = signal(true);
  readonly guarded = signal(false);
  readonly busy = signal(false);
  closes = 0;
}

describe('FormModal', () => {
  function setup() {
    TestBed.configureTestingModule({ imports: [Host], providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, host: fixture.componentInstance, el, dialog: () => el.querySelector<HTMLElement>('[role="dialog"]')! };
  }

  afterEach(() => document.body.classList.remove('overflow-hidden'));

  it('is a dialog named by its title and described by its line', () => {
    const { dialog, el } = setup();
    expect(dialog().getAttribute('aria-labelledby')).toBe(el.querySelector('h2')!.id);
    expect(dialog().getAttribute('aria-describedby')).toBe(el.querySelector('p')!.id);
  });

  it('has no description link when there is no description', () => {
    const s = setup();
    s.host.description.set(null);
    s.fixture.detectChanges();
    expect(s.dialog().hasAttribute('aria-describedby')).toBeFalse();
  });

  it('puts Cancel first in the footer, before the projected action', () => {
    const { el } = setup();
    const footer = el.querySelector('footer')!;
    expect(footer.children[0].matches('[data-cancel]')).toBeTrue();
    expect(footer.children[0].getAttribute('data-testid')).toBe('form-modal-cancel');
    expect(footer.children[1].id).toBe('save');
  });

  it('Cancel closes, but not while a call is in progress', () => {
    const s = setup();
    s.el.querySelector<HTMLButtonElement>('[data-cancel]')!.click();
    expect(s.host.closes).toBe(1);
    s.host.dismissible.set(false);
    s.fixture.detectChanges();
    const cancel = s.el.querySelector<HTMLButtonElement>('[data-cancel]')!;
    expect(cancel.disabled).toBeTrue();
  });

  describe('guarded (MD-485): with data written it asks before discarding, never in silence', () => {
    const confirm = () => document.querySelector<HTMLElement>('[role="alertdialog"]');
    const escape = () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
    type Setup = ReturnType<typeof setup>;
    const ways: [string, (s: Setup) => void][] = [
      ['Esc', () => escape()],
      ['the backdrop', (s) => s.el.querySelector<HTMLElement>('[data-testid="form-modal-backdrop"]')!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))],
      ['Cancel', (s) => s.el.querySelector<HTMLButtonElement>('[data-cancel]')!.click()],
      ['the X', (s) => s.el.querySelector<HTMLButtonElement>('[data-close-x]')!.click()],
    ];
    const guardedSetup = () => {
      const s = setup();
      s.host.guarded.set(true);
      s.fixture.detectChanges();
      const field = s.el.querySelector<HTMLInputElement>('#field')!;
      field.value = 'Lo que escribí';
      return { ...s, field };
    };

    for (const [name, close] of ways) {
      it(`asks before closing on ${name}; «Seguir editando» keeps what was written and «Descartar cambios» closes`, () => {
        const s = guardedSetup();
        close(s);
        s.fixture.detectChanges();
        expect(s.host.closes).toBe(0);
        expect(confirm()).not.toBeNull();
        expect(confirm()!.textContent).toContain('COMMON.DISCARD.MESSAGE');
        confirm()!.querySelector<HTMLButtonElement>('[data-cancel]')!.click();
        s.fixture.detectChanges();
        expect(confirm()).toBeNull();
        expect(s.host.closes).toBe(0);
        expect(s.dialog()).not.toBeNull();
        expect(s.field.value).toBe('Lo que escribí');
        close(s);
        s.fixture.detectChanges();
        confirm()!.querySelector<HTMLButtonElement>('[data-confirm]')!.click();
        s.fixture.detectChanges();
        expect(s.host.closes).toBe(1);
      });
    }

    it('Esc on the confirmation means «Seguir editando»: only the confirmation closes', () => {
      const s = guardedSetup();
      escape();
      s.fixture.detectChanges();
      escape();
      s.fixture.detectChanges();
      expect(confirm()).toBeNull();
      expect(s.dialog()).not.toBeNull();
      expect(s.host.closes).toBe(0);
    });

    it('«Seguir editando» is the initial focus and «Descartar cambios» is the destructive button', () => {
      const s = guardedSetup();
      escape();
      s.fixture.detectChanges();
      expect(confirm()!.querySelector('[data-cancel]')!.hasAttribute('cdkFocusInitial')).toBeTrue();
      expect(confirm()!.querySelector('[data-cancel]')!.textContent).toContain('COMMON.DISCARD.KEEP');
      expect(confirm()!.querySelector('[data-confirm]')!.classList).toContain('mk-btn-danger');
    });

    it('while sending nothing closes and nothing asks', () => {
      const s = guardedSetup();
      s.host.dismissible.set(false);
      s.fixture.detectChanges();
      for (const [, close] of ways) close(s);
      s.fixture.detectChanges();
      expect(confirm()).toBeNull();
      expect(s.host.closes).toBe(0);
    });
  });

  it('without data every way out closes at once, without asking', () => {
    for (const close of [
      (s: ReturnType<typeof setup>) => s.el.querySelector<HTMLButtonElement>('[data-cancel]')!.click(),
      () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true })),
      (s: ReturnType<typeof setup>) => s.el.querySelector<HTMLButtonElement>('[data-close-x]')!.click(),
    ]) {
      TestBed.resetTestingModule();
      const s = setup();
      close(s);
      s.fixture.detectChanges();
      expect(document.querySelector('[role="alertdialog"]')).toBeNull();
      expect(s.host.closes).toBe(1);
      s.fixture.destroy();
    }
  });

  it('while busy holds the fields as read-only, blocks the way out and busies the action, then gives everything back', () => {
    const { fixture, host, el } = setup();
    host.busy.set(true);
    fixture.detectChanges();
    expect(el.querySelector<HTMLInputElement>('#field')!.readOnly).toBeTrue();
    expect(el.querySelector<HTMLInputElement>('#check')!.disabled).toBeTrue();
    expect(el.querySelector<HTMLButtonElement>('[data-cancel]')!.disabled).toBeTrue();
    expect(el.querySelector<HTMLButtonElement>('#save')!.getAttribute('aria-busy')).toBe('true');
    el.querySelector<HTMLButtonElement>('[data-cancel]')!.click();
    expect(host.closes).toBe(0);
    host.busy.set(false);
    fixture.detectChanges();
    expect(el.querySelector<HTMLInputElement>('#field')!.readOnly).toBeFalse();
    expect(el.querySelector<HTMLInputElement>('#check')!.disabled).toBeFalse();
    expect(el.querySelector<HTMLButtonElement>('[data-cancel]')!.disabled).toBeFalse();
    expect(el.querySelector<HTMLButtonElement>('#save')!.hasAttribute('aria-busy')).toBeFalse();
  });
});
