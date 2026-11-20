import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StackedBar, StackedBarSegment } from './stacked-bar';

@Component({ imports: [StackedBar], template: `<app-stacked-bar [segments]="segments()" ariaLabel="Claves" />` })
class Host {
  segments = signal<StackedBarSegment[]>([
    { key: 'used', value: 3, fill: 'bg-ok', label: 'Usadas' },
    { key: 'none', value: 0, fill: 'bg-neutral', label: 'Sin clave' },
    { key: 'expired', value: 1, fill: 'bg-warn', label: 'Vencidas' },
  ]);
}

describe('StackedBar', () => {
  it('draws one segment per part with a value, grown by its value, with its fill and tooltip', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('app-stacked-bar') as HTMLElement;
    const parts = Array.from(el.querySelectorAll<HTMLElement>('[data-segment]'));
    expect(parts.map((p) => p.getAttribute('data-segment'))).toEqual(['used', 'expired']);
    expect(parts[0].style.flexGrow).toBe('3');
    expect(parts[0].classList).toContain('bg-ok');
    expect(parts[1].title).toBe('Vencidas: 1');
    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('Claves');
  });
});
