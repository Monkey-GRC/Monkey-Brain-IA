import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { passwordChecks } from '@shared/domain/utils/password-rules';
import { PasswordRequirements } from './password-requirements';

@Component({
  imports: [PasswordRequirements],
  template: `<div #box style="margin-left: 400px"><input /></div><app-password-requirements [checks]="checks()" [anchor]="box" [open]="open()" />`,
})
class Host {
  readonly password = signal('');
  readonly current = signal<string | null>(null);
  readonly open = signal(true);
  checks = () => passwordChecks(this.password(), '', this.current()).filter((c) => c.key !== 'match');
}

describe('PasswordRequirements (la tarjeta flotante de requisitos)', () => {
  function setup(width = 1280) {
    TestBed.configureTestingModule({ imports: [Host], providers: [provideTranslateService({ fallbackLang: 'es' })] });
    spyOnProperty(window, 'innerWidth').and.returnValue(width);
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    fixture.detectChanges();
    const panel = () => document.body.querySelector<HTMLElement>('[data-testid="password-requirements"]')!;
    return { fixture, host: fixture.componentInstance, panel };
  }

  afterEach(() => document.body.querySelectorAll('[data-testid="password-requirements"]').forEach((n) => n.remove()));

  it('lives in the body and lists the policy rules (no «match»), all pending at first', () => {
    const { panel } = setup();
    expect(panel().parentElement).toBe(document.body);
    expect(panel().querySelectorAll('[data-check]').length).toBe(5);
    expect(panel().querySelector('[data-check="match"]')).toBeNull();
    expect(Array.from(panel().querySelectorAll('[data-check]')).every((li) => li.getAttribute('data-state') === 'idle')).toBeTrue();
  });

  it('marks a rule as met as it is typed, and asks «different» only with a current password', () => {
    const { fixture, host, panel } = setup();
    host.password.set('Nueva-Clave-2026!');
    fixture.detectChanges();
    expect(Array.from(panel().querySelectorAll('[data-check]')).every((li) => li.getAttribute('data-state') === 'ok')).toBeTrue();
    host.current.set('Actual-Clave-2026!');
    fixture.detectChanges();
    expect(panel().querySelector('[data-check="different"]')?.getAttribute('data-state')).toBe('ok');
  });

  it('is hidden while closed and never takes the focus or the clicks', () => {
    const { fixture, host, panel } = setup();
    expect(panel().hidden).toBeFalse();
    expect(panel().classList).toContain('pointer-events-none');
    host.open.set(false);
    fixture.detectChanges();
    expect(panel().hidden).toBeTrue();
  });

  it('opens to the left of the field on a wide screen, with the arrow on its right edge', () => {
    const { panel } = setup(1280);
    expect(panel().querySelector('[data-arrow]')?.getAttribute('data-mode')).toBe('side');
  });

  it('falls below the field on a narrow screen, with the arrow on top', () => {
    const { panel } = setup(390);
    expect(panel().querySelector('[data-arrow]')?.getAttribute('data-mode')).toBe('below');
  });

  it('repositioning on scroll or resize does not show it again once closed', () => {
    const { fixture, host, panel } = setup();
    host.open.set(false);
    fixture.detectChanges();
    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(panel().hidden).toBeTrue();
  });

  it('removes its panel from the body when destroyed', () => {
    const { fixture } = setup();
    fixture.destroy();
    expect(document.body.querySelector('[data-testid="password-requirements"]')).toBeNull();
  });
});
