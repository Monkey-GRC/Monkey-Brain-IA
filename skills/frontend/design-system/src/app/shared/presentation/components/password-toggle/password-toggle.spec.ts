import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { PasswordToggle } from './password-toggle';

@Component({
  imports: [PasswordToggle],
  template: `<app-password-toggle [(visible)]="visible" />`,
})
class Host {
  visible = signal(false);
}

describe('PasswordToggle (el ojito)', () => {
  function setup() {
    TestBed.configureTestingModule({ imports: [Host], providers: [provideTranslateService({ fallbackLang: 'es' })] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const button = () => (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button')!;
    return { fixture, host: fixture.componentInstance, button };
  }

  it('starts hidden and flips the two-way model on each click', () => {
    const { fixture, host, button } = setup();
    expect(button().getAttribute('aria-pressed')).toBe('false');
    button().click();
    fixture.detectChanges();
    expect(host.visible()).toBe(true);
    expect(button().getAttribute('aria-pressed')).toBe('true');
    button().click();
    fixture.detectChanges();
    expect(host.visible()).toBe(false);
  });

  it('is a plain button that uses the muted ink token', () => {
    const { button } = setup();
    expect(button().type).toBe('button');
    expect(button().className).toContain('text-ink-muted');
  });
});
