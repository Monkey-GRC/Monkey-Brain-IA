import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ProgressLine, ProgressTone } from './progress-line';

@Component({
  imports: [ProgressLine],
  template: `<app-progress-line [value]="value()" [tone]="tone()" [variant]="variant()" [ariaLabel]="label()" />`,
})
class Host {
  value = signal<number | null>(42);
  tone = signal<ProgressTone>('action');
  variant = signal<'default' | 'process'>('default');
  label = signal('');
}

describe('ProgressLine', () => {
  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('app-progress-line') as HTMLElement;
    return { fixture, el, fill: () => el.querySelector<HTMLElement>('[data-progress-fill]')! };
  }

  it('scales the fill (never its width) and clamps the value to 0-100', () => {
    const { fixture, el, fill } = setup();
    expect(fill().style.transform).toBe('scaleX(0.42)');
    expect(fill().style.width).toBe('');
    fixture.componentInstance.value.set(140);
    fixture.detectChanges();
    expect(el.getAttribute('data-value')).toBe('100');
    fixture.componentInstance.value.set(null);
    fixture.detectChanges();
    expect(fill().style.transform).toBe('scaleX(0)');
  });

  it('is action by default (progress is not a status) and takes a status tone when asked', () => {
    const { fixture, fill } = setup();
    expect(fill().classList).toContain('bg-action');
    fixture.componentInstance.tone.set('bad');
    fixture.detectChanges();
    expect(fill().classList).toContain('bg-bad');
  });

  it('is decorative without a label and a progressbar with its value when it has one', () => {
    const { fixture, el } = setup();
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.getAttribute('role')).toBeNull();
    fixture.componentInstance.label.set('Avance');
    fixture.detectChanges();
    expect(el.getAttribute('role')).toBe('progressbar');
    expect(el.getAttribute('aria-valuenow')).toBe('42');
    expect(el.getAttribute('aria-label')).toBe('Avance');
    expect(el.getAttribute('aria-hidden')).toBeNull();
  });

  it('is 4 px by default and 8 px for a process', () => {
    const { fixture, el } = setup();
    expect(el.firstElementChild!.classList).toContain('h-1');
    fixture.componentInstance.variant.set('process');
    fixture.detectChanges();
    expect(el.firstElementChild!.classList).toContain('h-2');
  });
});
