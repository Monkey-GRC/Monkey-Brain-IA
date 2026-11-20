import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { shellPlace, ToastContainer } from './toast-container';
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
    expect(el.querySelector('[data-testid="toast-title"]')!.textContent).toContain('<b>Aviso</b>');
    expect(el.querySelector('[data-testid="toast-message"]')!.textContent).toBe('<img src=x onerror=alert(1)>');
    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('b')).toBeNull();
  });

  it('marks the tone with its icon and wash, says the status word to a screen reader, and gives only an error role="alert"', () => {
    const { fixture, service, all } = setup();
    service.showSuccess('ok');
    service.showError('fail');
    service.showInfo('info');
    service.showWarning('warn');
    fixture.detectChanges();
    const [ok, fail, info, warn] = all();
    const icon = (el: HTMLElement) => el.querySelector('[data-testid="toast-icon"]')!;
    expect(ok.getAttribute('data-tone')).toBe('success');
    expect(ok.getAttribute('role')).toBeNull();
    expect(ok.classList).toContain('mk-toast-success');
    expect(icon(ok).textContent!.trim()).toBe('check_circle');
    expect(icon(ok).getAttribute('aria-hidden')).toBe('true');
    expect(ok.querySelector('[data-testid="toast-tone"]')!.classList).toContain('sr-only');
    expect(ok.querySelector('[data-testid="toast-tone"]')!.textContent).toContain('COMMON.TOAST.SUCCESS');
    expect(fail.getAttribute('role')).toBe('alert');
    expect(fail.classList).toContain('mk-toast-error');
    expect(icon(fail).textContent!.trim()).toBe('error');
    expect(icon(info).textContent!.trim()).toBe('info');
    expect(icon(warn).textContent!.trim()).toBe('warning');
    expect(ok.querySelector('app-status-indicator')).toBeNull();
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
    expect(all()[0].querySelector('[data-testid="toast-title"]')!.textContent).toMatch(/: b$/);
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

  it('sits under the shell header, at the layout gap and aligned with its right edge; without a header it keeps its own margin', () => {
    expect(shellPlace()).toBeNull();
    const header = document.createElement('header');
    header.setAttribute('data-app-header', '');
    header.style.cssText = 'position:fixed;top:12px;left:0;width:calc(100% - 12px);height:82px';
    document.body.appendChild(header);
    try {
      const place = shellPlace()!;
      expect(place.top).toBe(12 + 82 + 12);
      expect(place.right).toBe(12);
      const { fixture, el, service } = setup();
      service.showInfo('x');
      fixture.detectChanges();
      expect((el.querySelector('[data-testid="toast-region"]') as HTMLElement).style.top).toBe('106px');
    } finally {
      header.remove();
    }
  });
});
