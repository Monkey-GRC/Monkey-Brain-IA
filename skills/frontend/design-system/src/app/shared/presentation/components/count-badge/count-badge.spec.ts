import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CountBadge } from './count-badge';

@Component({
  imports: [CountBadge],
  template: `<app-count-badge [count]="count()" [max]="max()" />`,
})
class Host {
  readonly count = signal(3);
  readonly max = signal(99);
}

describe('CountBadge', () => {
  function setup() {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const badge = () => (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('app-count-badge')!;
    return { fixture, host: fixture.componentInstance, badge };
  }

  it('shows the number, decorative for screen readers (the count goes in the name of its control)', () => {
    const { badge } = setup();
    expect(badge().textContent!.trim()).toBe('3');
    expect(badge().getAttribute('data-count')).toBe('3');
    expect(badge().getAttribute('aria-hidden')).toBe('true');
    expect(badge().hidden).toBeFalse();
  });

  it('caps the number at max with a plus', () => {
    const { fixture, host, badge } = setup();
    host.count.set(120);
    fixture.detectChanges();
    expect(badge().textContent!.trim()).toBe('99+');
    host.max.set(9);
    host.count.set(10);
    fixture.detectChanges();
    expect(badge().textContent!.trim()).toBe('9+');
  });

  it('hides itself at zero', () => {
    const { fixture, host, badge } = setup();
    host.count.set(0);
    fixture.detectChanges();
    expect(badge().hidden).toBeTrue();
    expect(badge().getAttribute('data-count')).toBe('0');
  });
});
