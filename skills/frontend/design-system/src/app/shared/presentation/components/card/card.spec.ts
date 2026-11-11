import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Card } from './card';

@Component({
  imports: [Card],
  template: `<app-card id="a">A</app-card><app-card id="b" featured>B</app-card><app-card id="c" [padded]="false">C</app-card><app-card id="d" tinted>D</app-card><app-card id="e" tone="bad" tinted>E</app-card>`,
})
class Host {}

describe('Card', () => {
  it('uses the base surface, the featured one and no padding on request', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const el = f.nativeElement as HTMLElement;
    const a = el.querySelector('#a')!;
    expect(a.classList.contains('mk-surface')).toBe(true);
    expect(a.classList.contains('p-5')).toBe(true);
    expect(el.querySelector('#b')!.classList.contains('mk-surface-featured')).toBe(true);
    expect(el.querySelector('#d')!.classList.contains('mk-surface-tinted')).toBe(true);
    expect(el.querySelector('#e')!.classList.contains('mk-surface-state-bad')).toBe(true);
    expect(el.querySelector('#e')!.classList.contains('mk-surface-tinted')).toBe(false);
    expect(el.querySelector('#c')!.classList.contains('p-5')).toBe(false);
  });
});
