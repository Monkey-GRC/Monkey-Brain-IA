import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { provideTranslateService } from '@ngx-translate/core';
import { PasswordField } from './password-field';

@Component({
  imports: [PasswordField],
  template: `
    <app-password-field [control]="first" inputId="first" label="Primera" autocomplete="new-password" />
    <app-password-field [control]="second" inputId="second" label="Segunda" [compact]="true" />
  `,
})
class Host {
  first = new FormControl('', { nonNullable: true });
  second = new FormControl('', { nonNullable: true });
}

describe('PasswordField (campo con su ojito)', () => {
  function setup() {
    TestBed.configureTestingModule({ imports: [Host], providers: [provideTranslateService({ fallbackLang: 'es' })] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const input = (id: string) => el.querySelector<HTMLInputElement>(`#${id}`)!;
    const eye = (id: string) => input(id).parentElement!.querySelector<HTMLButtonElement>('[data-testid="password-eye"]')!;
    return { fixture, el, input, eye };
  }

  it('hides the password by default and labels the field', () => {
    const { el, input } = setup();
    expect(input('first').type).toBe('password');
    expect(el.querySelector('label[for="first"]')!.textContent).toBe('Primera');
    expect(input('first').getAttribute('autocomplete')).toBe('new-password');
  });

  it('shows and hides the password with its own eye', () => {
    const { fixture, input, eye } = setup();
    eye('first').click();
    fixture.detectChanges();
    expect(input('first').type).toBe('text');
    expect(eye('first').getAttribute('aria-pressed')).toBe('true');
    eye('first').click();
    fixture.detectChanges();
    expect(input('first').type).toBe('password');
  });

  it('each field has its own eye: showing one does not show the others', () => {
    const { fixture, input, eye } = setup();
    eye('first').click();
    fixture.detectChanges();
    expect(input('first').type).toBe('text');
    expect(input('second').type).toBe('password');
    eye('second').click();
    fixture.detectChanges();
    eye('first').click();
    fixture.detectChanges();
    expect(input('first').type).toBe('password');
    expect(input('second').type).toBe('text');
  });

  it('centres the eye in the box of the input itself (not of the label): same parent, full height, auto margins', () => {
    const { input, eye } = setup();
    const button = eye('first');
    expect(button.parentElement).toBe(input('first').parentElement);
    expect(button.classList).toContain('inset-y-0');
    expect(button.classList).toContain('my-auto');
  });

  it('has no native tooltip (it covered the field below) and names the button for screen readers', () => {
    const { eye } = setup();
    expect(eye('first').hasAttribute('title')).toBeFalse();
    expect(eye('first').getAttribute('aria-label')).toBeTruthy();
  });

  it('writes what is typed to its control', () => {
    const { fixture, input } = setup();
    input('first').value = 'Nueva-Clave-2026!';
    input('first').dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.first.value).toBe('Nueva-Clave-2026!');
  });
});
