import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { ToastContainer } from './toast-container';
import { TOAST_DURATION_MS, ToastService } from './toast.service';

describe('ToastContainer', () => {
  function setup() {
    TestBed.configureTestingModule({ imports: [ToastContainer], providers: [provideTranslateService({ fallbackLang: 'es' })] });
    const fixture = TestBed.createComponent(ToastContainer);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, el, service: TestBed.inject(ToastService), all: () => Array.from(el.querySelectorAll<HTMLElement>('[data-testid="toast"]')) };
  }

  beforeEach(() => jasmine.clock().install());
  afterEach(() => jasmine.clock().uninstall());

  it('keeps a polite live region in the DOM even when there is nothing to show', () => {
    const { el, all } = setup();
    const region = el.querySelector('[data-testid="toast-region"]')!;
    expect(region.getAttribute('role')).toBe('status');
    expect(region.getAttribute('aria-live')).toBe('polite');
    expect(all().length).toBe(0);
  });

  it('shows the title and the message as plain text, never as HTML', () => {
    const { fixture, el, service, all } = setup();
    service.showWarning('<b>Aviso</b>', '<img src=x onerror=alert(1)>');
    fixture.detectChanges();
    expect(all().length).toBe(1);
    expect(el.querySelector('[data-testid="toast-title"]')!.textContent).toBe('<b>Aviso</b>');
    expect(el.querySelector('[data-testid="toast-message"]')!.textContent).toBe('<img src=x onerror=alert(1)>');
    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('b')).toBeNull();
  });

  it('marks the tone, with the status dot, and gives only an error role="alert"', () => {
    const { fixture, service, all } = setup();
    service.showSuccess('ok');
    service.showError('fail');
    fixture.detectChanges();
    const [ok, fail] = all();
    expect(ok.getAttribute('data-tone')).toBe('success');
    expect(ok.getAttribute('role')).toBeNull();
    expect(ok.querySelector('app-status-indicator')!.getAttribute('data-tone')).toBe('ok');
    expect(fail.getAttribute('data-tone')).toBe('error');
    expect(fail.getAttribute('role')).toBe('alert');
    expect(fail.querySelector('app-status-indicator')!.getAttribute('data-tone')).toBe('bad');
  });

  it('omits the message line when there is no message', () => {
    const { fixture, el, service } = setup();
    service.showInfo('Solo título');
    fixture.detectChanges();
    expect(el.querySelector('[data-testid="toast-message"]')).toBeNull();
  });

  it('the close button has an accessible name and closes only its toast', () => {
    const { fixture, service, all } = setup();
    service.showInfo('a');
    service.showInfo('b');
    fixture.detectChanges();
    const button = all()[0].querySelector<HTMLButtonElement>('[data-testid="toast-close"]')!;
    expect(button.getAttribute('aria-label')).toBeTruthy();
    button.click();
    fixture.detectChanges();
    expect(all().length).toBe(1);
    expect(all()[0].querySelector('[data-testid="toast-title"]')!.textContent).toBe('b');
  });

  it('pauses the auto-close with hover and with focus, and resumes on leaving', () => {
    const { fixture, service, all } = setup();
    service.showInfo('x');
    fixture.detectChanges();
    const toast = all()[0];
    toast.dispatchEvent(new Event('mouseenter'));
    toast.dispatchEvent(new Event('focusin'));
    jasmine.clock().tick(TOAST_DURATION_MS * 4);
    fixture.detectChanges();
    expect(all().length).toBe(1);
    toast.dispatchEvent(new Event('mouseleave'));
    jasmine.clock().tick(TOAST_DURATION_MS * 4);
    expect(service.toasts().length).toBe(1);
    toast.dispatchEvent(new Event('focusout'));
    jasmine.clock().tick(TOAST_DURATION_MS);
    fixture.detectChanges();
    expect(all().length).toBe(0);
  });

  it('does not trap the keyboard: nothing takes focus on its own and the close button is the only tab stop', () => {
    const { fixture, el, service, all } = setup();
    const before = document.activeElement;
    service.showError('fail');
    fixture.detectChanges();
    expect(document.activeElement).toBe(before);
    expect(el.querySelectorAll('[tabindex]').length).toBe(0);
    expect(all()[0].querySelectorAll('button').length).toBe(1);
  });
});
