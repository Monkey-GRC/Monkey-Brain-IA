import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { provideTranslateService } from '@ngx-translate/core';
import { NewPasswordFields } from './new-password-fields';

@Component({ imports: [NewPasswordFields], template: `<app-new-password-fields [form]="form" layout="row" />` })
class WithCurrent {
  form = new FormGroup({ current_password: new FormControl(''), password: new FormControl(''), password_confirmation: new FormControl('') });
}

@Component({ imports: [NewPasswordFields], template: `<app-new-password-fields [form]="form" />` })
class WithoutCurrent {
  form = new FormGroup({ password: new FormControl(''), password_confirmation: new FormControl('') });
}

describe('NewPasswordFields (la guía de la contraseña nueva)', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [WithCurrent, WithoutCurrent], providers: [provideTranslateService({ fallbackLang: 'es' })] }));

  const state = (el: HTMLElement, key: string) => el.querySelector(`[data-check="${key}"]`)?.getAttribute('data-state');

  it('lists what the password must have, all pending while nothing is typed', () => {
    const fixture = TestBed.createComponent(WithCurrent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    for (const key of ['min_length', 'lowercase', 'uppercase', 'number', 'symbol', 'different', 'match']) expect(state(el, key)).toBe('idle');
  });

  it('marks each requirement as the person types, live', () => {
    const fixture = TestBed.createComponent(WithCurrent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    fixture.componentInstance.form.patchValue({ current_password: 'Actual-Clave-2026!', password: 'Nueva' });
    fixture.detectChanges();
    expect(state(el, 'uppercase')).toBe('ok');
    expect(state(el, 'lowercase')).toBe('ok');
    expect(state(el, 'number')).toBe('idle');
    expect(state(el, 'min_length')).toBe('idle');
    fixture.componentInstance.form.patchValue({ password: 'Nueva-Clave-2026!' });
    fixture.detectChanges();
    for (const key of ['min_length', 'lowercase', 'uppercase', 'number', 'symbol', 'different']) expect(state(el, key)).toBe('ok');
  });

  it('checks that the two copies match, and warns when they do not', () => {
    const fixture = TestBed.createComponent(WithCurrent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    fixture.componentInstance.form.patchValue({ password: 'Nueva-Clave-2026!', password_confirmation: 'Nueva-Clave-2026' });
    fixture.detectChanges();
    expect(state(el, 'match')).toBe('bad');
    fixture.componentInstance.form.patchValue({ password_confirmation: 'Nueva-Clave-2026!' });
    fixture.detectChanges();
    expect(state(el, 'match')).toBe('ok');
  });

  it('only asks «different from the current one» where there is a current password', () => {
    const fixture = TestBed.createComponent(WithoutCurrent);
    fixture.detectChanges();
    expect(state(fixture.nativeElement as HTMLElement, 'different')).toBeUndefined();
    expect(state(fixture.nativeElement as HTMLElement, 'match')).toBe('idle');
  });

  it('gives screen readers the state of each requirement, not only the colour', () => {
    const fixture = TestBed.createComponent(WithCurrent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('[data-check="min_length"] .sr-only')).not.toBeNull();
  });
});
