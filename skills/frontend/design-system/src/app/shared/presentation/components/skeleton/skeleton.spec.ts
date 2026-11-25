import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { Skeleton, SkeletonRegion, SkeletonShape } from './skeleton';

@Component({
  imports: [Skeleton, SkeletonRegion],
  template: `
    <app-skeleton-region [busy]="busy()">
      <app-skeleton [shape]="shape()" [lines]="lines()" [width]="width()" [height]="height()" [size]="size()" />
    </app-skeleton-region>
  `,
})
class Host {
  busy = signal(true);
  shape = signal<SkeletonShape>('line');
  lines = signal(1);
  width = signal<string | null>(null);
  height = signal<string | null>(null);
  size = signal(36);
}

describe('Skeleton', () => {
  function setup() {
    TestBed.configureTestingModule({ imports: [Host], providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const set = (fn: (h: Host) => void) => {
      fn(fixture.componentInstance);
      fixture.detectChanges();
    };
    const blocks = () => Array.from(el.querySelectorAll<HTMLElement>('[data-skeleton-block]'));
    return { fixture, el, set, blocks };
  }

  it('is hidden from assistive technology and its blocks use the skeleton token, not fixed colours', () => {
    const { el, blocks } = setup();
    expect(el.querySelector('app-skeleton')!.getAttribute('aria-hidden')).toBe('true');
    expect(blocks().length).toBeGreaterThan(0);
    blocks().forEach((b) => {
      expect(b.classList).toContain('mk-skeleton');
      expect(b.className).not.toMatch(/\b(?:bg|from|to)-(?:gray|slate|zinc)-/);
    });
  });

  it('draws as many lines as asked, the last one shorter', () => {
    const { set, blocks } = setup();
    set((h) => h.lines.set(3));
    expect(blocks().length).toBe(3);
    expect(blocks()[0].style.width).toBe('100%');
    expect(blocks()[2].style.width).toBe('60%');
  });

  it('keeps a single line at the width given', () => {
    const { set, blocks } = setup();
    set((h) => h.width.set('50%'));
    expect(blocks()[0].style.width).toBe('50%');
  });

  const SHAPES: [SkeletonShape, number][] = [
    ['title', 1],
    ['block', 1],
    ['circle', 1],
    ['field', 2],
    ['badge', 1],
    ['card', 4],
    ['metric', 3],
    ['row', 4],
    ['tabs', 1],
    ['section', 2],
  ];
  SHAPES.forEach(([shape, count]) => {
    it(`draws the «${shape}» shape (${count} block${count > 1 ? 's' : ''})`, () => {
      const { el, set, blocks } = setup();
      set((h) => h.shape.set(shape));
      expect(el.querySelector('app-skeleton')!.getAttribute('data-shape')).toBe(shape);
      expect(blocks().length).toBe(count);
    });
  });

  it('sizes the block, the circle and the badge', () => {
    const { set, blocks } = setup();
    set((h) => {
      h.shape.set('block');
      h.width.set('10rem');
      h.height.set('3rem');
    });
    expect(blocks()[0].style.width).toBe('10rem');
    expect(blocks()[0].style.height).toBe('3rem');
    set((h) => {
      h.shape.set('circle');
      h.size.set(48);
    });
    expect(blocks()[0].style.width).toBe('48px');
    expect(blocks()[0].style.height).toBe('48px');
    set((h) => {
      h.shape.set('badge');
      h.width.set('5rem');
    });
    expect(blocks()[0].style.width).toBe('5rem');
  });

  it('uses Monkey radii: control for boxes, badge for text, round only for the avatar', () => {
    const { set, blocks } = setup();
    set((h) => h.shape.set('field'));
    expect(blocks()[1].classList).toContain('rounded-control');
    set((h) => h.shape.set('circle'));
    expect(blocks()[0].classList).toContain('rounded-full');
  });

  it('marks the region busy and gives screen readers a text, and removes both when it is not busy', () => {
    const { el, set } = setup();
    const region = el.querySelector('app-skeleton-region')!;
    expect(region.getAttribute('aria-busy')).toBe('true');
    expect(region.querySelector('[role="status"]')!.textContent).toContain('COMMON.LOADING');
    set((h) => h.busy.set(false));
    expect(region.hasAttribute('aria-busy')).toBeFalse();
    expect(region.querySelector('[role="status"]')).toBeNull();
  });
});
