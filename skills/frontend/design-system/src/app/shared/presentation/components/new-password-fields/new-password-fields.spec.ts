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

describe('NewPasswordFields (la contraseña nueva y su globo de requisitos)', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [WithCurrent, WithoutCurrent], providers: [provideTranslateService({ fallbackLang: 'es' })] }));
  afterEach(() => document.body.querySelectorAll('[data-testid="password-requirements"]').forEach((n) => n.remove()));

  const balloon = () => document.body.querySelector<HTMLElement>('[data-testid="password-requirements"]')!;
  const state = (key: string) => balloon().querySelector(`[data-check="${key}"]`)?.getAttribute('data-state');
  const field = (el: HTMLElement) => el.querySelector<HTMLInputElement>('#new-password')!;
  const flush = (fixture: { detectChanges: () => void }) => {
    fixture.detectChanges();
    fixture.detectChanges();
  };

  it('has no big guide block any more: the requirements are in the balloon, hidden until the field is focused', () => {
    const fixture = TestBed.createComponent(WithCurrent);
    flush(fixture);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="password-guide"]')).toBeNull();
    expect(balloon().hidden).toBeTrue();
    field(el).dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    flush(fixture);
    expect(balloon().hidden).toBeFalse();
    for (const key of ['min_length', 'lowercase', 'uppercase', 'number', 'symbol', 'different']) expect(state(key)).toBe('idle');
    expect(state('match')).toBeUndefined();
  });

  it('marks each requirement live, and points the field at the balloon', () => {
    const fixture = TestBed.createComponent(WithCurrent);
    flush(fixture);
    const el = fixture.nativeElement as HTMLElement;
    expect(field(el).getAttribute('aria-describedby')).toBe('password-requirements');
    fixture.componentInstance.form.patchValue({ current_password: 'Actual-Clave-2026!', password: 'Nueva' });
    flush(fixture);
    expect(state('uppercase')).toBe('ok');
    expect(state('number')).toBe('idle');
    fixture.componentInstance.form.patchValue({ password: 'Nueva-Clave-2026!' });
    flush(fixture);
    for (const key of ['min_length', 'lowercase', 'uppercase', 'number', 'symbol', 'different']) expect(state(key)).toBe('ok');
  });

  it('on leaving the field it hides ALWAYS, met or not, and comes back on focusing it again with the current state', () => {
    const fixture = TestBed.createComponent(WithoutCurrent);
    flush(fixture);
    const el = fixture.nativeElement as HTMLElement;
    fixture.componentInstance.form.patchValue({ password: 'Nueva' });
    field(el).dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    flush(fixture);
    expect(balloon().hidden).toBeFalse();
    field(el).dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    flush(fixture);
    expect(balloon().hidden).toBeTrue();
    field(el).dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    flush(fixture);
    expect(balloon().hidden).toBeFalse();
    expect(state('uppercase')).toBe('ok');
    fixture.componentInstance.form.patchValue({ password: 'Nueva-Clave-2026!' });
    flush(fixture);
    field(el).dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    flush(fixture);
    expect(balloon().hidden).toBeTrue();
  });

  it('closes when the focused field is disabled (FormControl) or held read-only by the busy directive, even with no focusout', async () => {
    const fixture = TestBed.createComponent(WithoutCurrent);
    flush(fixture);
    const el = fixture.nativeElement as HTMLElement;
    field(el).dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    flush(fixture);
    expect(balloon().hidden).toBeFalse();
    fixture.componentInstance.form.get('password')!.disable();
    flush(fixture);
    expect(balloon().hidden).toBeTrue();
    fixture.componentInstance.form.get('password')!.enable();
    flush(fixture);
    field(el).dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    flush(fixture);
    expect(balloon().hidden).toBeFalse();
    field(el).readOnly = true;
    await new Promise((r) => setTimeout(r));
    flush(fixture);
    expect(balloon().hidden).toBeTrue();
  });

  it('leaves no node in the body when destroyed', () => {
    const fixture = TestBed.createComponent(WithoutCurrent);
    flush(fixture);
    fixture.destroy();
    expect(document.body.querySelector('[data-testid="password-requirements"]')).toBeNull();
  });

  it('moving from the field to its eye keeps it open', () => {
    const fixture = TestBed.createComponent(WithoutCurrent);
    flush(fixture);
    const el = fixture.nativeElement as HTMLElement;
    fixture.componentInstance.form.patchValue({ password: 'Nueva-Clave-2026!' });
    field(el).dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    field(el).dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: el.querySelector('[data-testid="password-eye"]') }));
    flush(fixture);
    expect(balloon().hidden).toBeFalse();
  });

  it('shows «both match» as a line under the confirmation: nothing, neutral warning, then green', () => {
    const fixture = TestBed.createComponent(WithCurrent);
    flush(fixture);
    const el = fixture.nativeElement as HTMLElement;
    const line = () => el.querySelector('[data-testid="password-match"]')!;
    expect(line().getAttribute('data-state')).toBe('idle');
    expect(line().textContent!.trim()).toBe('');
    fixture.componentInstance.form.patchValue({ password: 'Nueva-Clave-2026!', password_confirmation: 'Nueva-Clave-2026' });
    flush(fixture);
    expect(line().getAttribute('data-state')).toBe('bad');
    expect(line().classList).toContain('text-ink-muted');
    fixture.componentInstance.form.patchValue({ password_confirmation: 'Nueva-Clave-2026!' });
    flush(fixture);
    expect(line().getAttribute('data-state')).toBe('ok');
    expect(line().classList).toContain('text-ok-ink');
    expect(el.querySelector('#confirm-password')!.getAttribute('aria-describedby')).toBe('password-match');
  });

  it('only asks «different from the current one» where there is a current password', () => {
    const fixture = TestBed.createComponent(WithoutCurrent);
    flush(fixture);
    expect(balloon().querySelector('[data-check="different"]')).toBeNull();
  });

  it('announces the count of missing requirements politely, once per change', () => {
    const fixture = TestBed.createComponent(WithoutCurrent);
    flush(fixture);
    const live = fixture.nativeElement.querySelector('[data-testid="password-live"]') as HTMLElement;
    expect(live.getAttribute('aria-live')).toBe('polite');
    expect(live.textContent!.trim()).toBe('');
    fixture.componentInstance.form.patchValue({ password: 'Nueva' });
    flush(fixture);
    expect(live.textContent!.trim()).not.toBe('');
  });
});
