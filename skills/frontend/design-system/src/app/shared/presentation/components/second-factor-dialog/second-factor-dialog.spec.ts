import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { SecondFactorAnswer, SecondFactorDialog } from './second-factor-dialog';

@Component({
  imports: [SecondFactorDialog],
  template: `<app-second-factor-dialog [open]="open()" [loading]="loading()" [errorMessage]="error()" [allowRecovery]="allowRecovery()" [danger]="danger()" title="Confirma con tu código" confirmLabel="Confirmar"
    (confirmed)="answers.push($event)" (cancelled)="cancels = cancels + 1" />`,
})
class Host {
  readonly open = signal(true);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly allowRecovery = signal(true);
  readonly danger = signal(false);
  answers: SecondFactorAnswer[] = [];
  cancels = 0;
}

describe('SecondFactorDialog (el modal del código)', () => {
  function setup() {
    TestBed.configureTestingModule({ imports: [Host], providers: [provideTranslateService({ fallbackLang: 'es' })] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const q = <T extends HTMLElement>(id: string) => el.querySelector<T>(`[data-testid="${id}"]`);
    const dialog = () => fixture.debugElement.children[0].componentInstance as SecondFactorDialog;
    return { fixture, host: fixture.componentInstance, el, q, dialog };
  }

  afterEach(() => document.body.classList.remove('overflow-hidden'));

  it('is an accessible modal named by its title, and only exists while open', () => {
    const { fixture, host, q } = setup();
    const panel = q('factor-dialog')!;
    expect(panel.getAttribute('role')).toBe('dialog');
    expect(panel.getAttribute('aria-modal')).toBe('true');
    expect(panel.getAttribute('aria-labelledby')).toBe('factor-title');
    host.open.set(false);
    fixture.detectChanges();
    expect(q('factor-dialog')).toBeNull();
  });

  it('sends the code by itself once the sixth digit is typed, and only once', () => {
    const { fixture, host, dialog } = setup();
    dialog().code.set('12345');
    fixture.detectChanges();
    expect(host.answers).toEqual([]);
    dialog().code.set('123456');
    fixture.detectChanges();
    expect(host.answers).toEqual([{ code: '123456' }]);
    // el servidor lo rechaza y el modal sigue abierto: el mismo código no se reenvía solo
    host.loading.set(true);
    fixture.detectChanges();
    host.loading.set(false);
    fixture.detectChanges();
    expect(host.answers.length).toBe(1);
    // pero uno distinto sí
    dialog().code.set('654321');
    fixture.detectChanges();
    expect(host.answers.at(-1)).toEqual({ code: '654321' });
  });

  it('sends a recovery code with the button, never by itself', () => {
    const { fixture, host, q, dialog } = setup();
    dialog().useRecovery.set(true);
    dialog().recoveryCode.set('K7QWM-3PZ9T');
    fixture.detectChanges();
    expect(host.answers).toEqual([]);
    q<HTMLButtonElement>('factor-confirm')!.click();
    expect(host.answers).toEqual([{ recovery_code: 'K7QWM-3PZ9T' }]);
  });

  it('shows the error inside the dialog', () => {
    const { fixture, host, q } = setup();
    host.error.set('Ese código no es correcto.');
    fixture.detectChanges();
    expect(q('factor-error')!.textContent).toContain('Ese código no es correcto.');
  });

  it('cancels with the button, with Escape and with a click on the backdrop, but not with a click inside', () => {
    const { fixture, host, q } = setup();
    q('factor-cancel')!.click();
    expect(host.cancels).toBe(1);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(host.cancels).toBe(2);
    q('factor-dialog')!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(host.cancels).toBe(2);
    q('factor-backdrop')!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(host.cancels).toBe(3);
    fixture.detectChanges();
  });

  it('cannot be cancelled while the request is in flight', () => {
    const { fixture, host, q } = setup();
    host.loading.set(true);
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    q('factor-backdrop')!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(host.cancels).toBe(0);
    expect(q<HTMLButtonElement>('factor-cancel')!.disabled).toBeTrue();
  });

  it('locks the page scroll while open and releases it when closed', () => {
    const { fixture, host } = setup();
    expect(document.body.classList.contains('overflow-hidden')).toBeTrue();
    host.open.set(false);
    fixture.detectChanges();
    expect(document.body.classList.contains('overflow-hidden')).toBeFalse();
  });

  it('starts clean every time it opens', () => {
    const { fixture, host, dialog } = setup();
    dialog().code.set('123');
    host.open.set(false);
    fixture.detectChanges();
    host.open.set(true);
    fixture.detectChanges();
    expect(dialog().code()).toBe('');
  });

  it('empties the code and puts the cursor back when the server rejects it (a code is single-use)', async () => {
    const { fixture, host, dialog, el } = setup();
    dialog().code.set('123456');
    fixture.detectChanges();
    host.loading.set(true);
    fixture.detectChanges();
    host.loading.set(false);
    host.error.set('Ese código no es correcto.');
    fixture.detectChanges();
    expect(dialog().code()).toBe('');
    await new Promise((resolve) => setTimeout(resolve));
    expect(document.activeElement).toBe(el.querySelector('input'));
  });

  it('paints the confirm button red for a serious action, and in the brand colour otherwise', () => {
    const { fixture, host, q } = setup();
    expect(q('factor-confirm')!.className).toContain('mk-btn');
    expect(q('factor-confirm')!.className).not.toContain('mk-btn-danger');
    host.danger.set(true);
    fixture.detectChanges();
    expect(q('factor-confirm')!.className).toContain('mk-btn-danger');
  });

  it('hides the recovery option when it is not allowed', () => {
    const { fixture, host, el } = setup();
    host.allowRecovery.set(false);
    fixture.detectChanges();
    expect(el.textContent).not.toContain('SECOND_FACTOR.USE_RECOVERY');
  });
});
