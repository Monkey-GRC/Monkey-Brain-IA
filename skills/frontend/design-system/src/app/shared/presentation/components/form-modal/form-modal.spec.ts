import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { Busy } from '@shared/presentation/directives/busy';
import { FormModal } from './form-modal';

@Component({
  imports: [FormModal, Busy],
  template: `
    <app-form-modal titleKey="T.TITLE" [descriptionKey]="description()" [dismissible]="dismissible()" [guarded]="guarded()" [busy]="busy()" (closed)="closes = closes + 1">
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

  it('is a dialog named by its title and described by its line, with no close X', () => {
    const { dialog, el } = setup();
    expect(dialog().getAttribute('aria-labelledby')).toBe(el.querySelector('h2')!.id);
    expect(dialog().getAttribute('aria-describedby')).toBe(el.querySelector('p')!.id);
    expect(el.querySelector('[aria-label]')).toBeNull();
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

  it('guarded blocks the backdrop but Cancel still closes', () => {
    const s = setup();
    s.host.guarded.set(true);
    s.fixture.detectChanges();
    s.el.querySelector<HTMLElement>('[data-testid="form-modal-backdrop"]')!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(s.host.closes).toBe(0);
    s.el.querySelector<HTMLButtonElement>('[data-cancel]')!.click();
    expect(s.host.closes).toBe(1);
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
