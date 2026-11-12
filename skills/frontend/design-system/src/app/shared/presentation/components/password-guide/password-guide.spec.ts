import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { PasswordGuide } from './password-guide';

@Component({
  imports: [PasswordGuide],
  template: `<app-password-guide [password]="password()" [confirmation]="confirmation()" [current]="current()" [compact]="compact()" />`,
})
class Host {
  readonly password = signal('');
  readonly confirmation = signal('');
  readonly current = signal<string | null>(null);
  readonly compact = signal(false);
}

describe('PasswordGuide (no sabe en qué pantalla está)', () => {
  function setup() {
    TestBed.configureTestingModule({ imports: [Host], providers: [provideTranslateService({ fallbackLang: 'es' })] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const state = (key: string) => el.querySelector(`[data-check="${key}"]`)?.getAttribute('data-state');
    return { fixture, host: fixture.componentInstance, el, state };
  }

  it('lists the requirements, all pending while nothing is typed', () => {
    const { el, state } = setup();
    expect(el.querySelectorAll('[data-check]').length).toBe(6); // sin «distinta de la actual»
    for (const key of ['min_length', 'lowercase', 'uppercase', 'number', 'symbol', 'match']) expect(state(key)).toBe('idle');
  });

  it('marks them as the password is typed', () => {
    const { fixture, host, state } = setup();
    host.password.set('Nueva-Clave-2026!');
    fixture.detectChanges();
    for (const key of ['min_length', 'lowercase', 'uppercase', 'number', 'symbol']) expect(state(key)).toBe('ok');
    host.confirmation.set('otra');
    fixture.detectChanges();
    expect(state('match')).toBe('bad');
    host.confirmation.set('Nueva-Clave-2026!');
    fixture.detectChanges();
    expect(state('match')).toBe('ok');
  });

  it('asks «different from the current one» ONLY where there is a current password (first sign-in and recovery have none)', () => {
    const { fixture, host, el, state } = setup();
    expect(el.querySelector('[data-check="different"]')).toBeNull();
    host.current.set('Actual-Clave-2026!');
    host.password.set('Nueva-Clave-2026!');
    fixture.detectChanges();
    expect(state('different')).toBe('ok');
    host.password.set('Actual-Clave-2026!');
    fixture.detectChanges();
    expect(state('different')).toBe('idle');
  });

  it('has a compact version for the sign-in screens', () => {
    const { fixture, host, el } = setup();
    host.compact.set(true);
    fixture.detectChanges();
    expect(el.querySelector('ul')!.classList).toContain('grid-cols-1');
  });

  it('tells screen readers the state of each requirement, not only the colour', () => {
    const { el } = setup();
    expect(el.querySelector('[data-check="min_length"] .sr-only')).not.toBeNull();
  });
});
