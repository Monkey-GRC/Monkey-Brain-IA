import { Component, signal } from '@angular/core';
import { TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { SLOW_LOAD_MS, Skeleton, SkeletonRegion, SkeletonShape } from './skeleton';

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

  it('marks the region busy and gives screen readers a polite text, and removes the busy mark when it is not busy', () => {
    const { el, set } = setup();
    const region = el.querySelector('app-skeleton-region')!;
    expect(region.getAttribute('aria-busy')).toBe('true');
    expect(region.querySelector('[aria-live="polite"]')!.textContent).toContain('COMMON.LOADING');
    set((h) => h.busy.set(false));
    expect(region.hasAttribute('aria-busy')).toBeFalse();
    expect(region.querySelector('[aria-live="polite"]')!.textContent).not.toContain('COMMON.LOADING');
  });

  it('draws the progress bar by default, with aria-busy and the live status', () => {
    const { el } = setup();
    expect(el.querySelector('[data-load-progress]')).not.toBeNull();
    expect(el.querySelector('app-skeleton-region')!.getAttribute('aria-busy')).toBe('true');
    expect(el.querySelector('[aria-live="polite"]')).not.toBeNull();
  });

  it('draws the bar over the top edge of the region (absolute), so it does not push the content', () => {
    const { el } = setup();
    const bar = el.querySelector('app-skeleton-region > [data-load-progress]')!;
    expect(bar.classList).toContain('absolute');
    expect(bar.classList).not.toContain('mb-3');
    expect(el.querySelector('app-skeleton-region')!.classList).toContain('relative');
  });

  it('puts the slow-load line in its own slot below the content, reserved from the start, never inside the bar that is drawn over the content (MD-505)', () => {
    const { el } = setup();
    const region = el.querySelector('app-skeleton-region')!;
    const bar = region.querySelector(':scope > [data-load-progress]')!;
    const slot = region.querySelector(':scope > [data-slow-load-slot]')!;
    expect(slot).not.toBeNull();
    expect(bar.querySelector('[data-slow-load]')).toBeNull();
    expect(slot.classList).toContain('min-h-5');
    expect(slot.classList).not.toContain('absolute');
    // After the projected content: the line pushes nothing that is already drawn.
    const children = Array.from(region.children);
    expect(children.indexOf(slot)).toBeGreaterThan(children.findIndex((c) => !c.matches('[data-load-progress]')));
    expect(children.indexOf(slot)).toBeGreaterThan(children.indexOf(bar));
  });

  it('draws no bar when progress is turned off', () => {
    TestBed.configureTestingModule({ imports: [NoProgressHost], providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(NoProgressHost);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('[data-load-progress]')).toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('[data-slow-load-slot]')).toBeNull();
  });

  @Component({ imports: [SkeletonRegion], template: `<app-skeleton-region [progress]="false"><p>x</p></app-skeleton-region>` })
  class NoProgressHost {}

  describe('with progress', () => {
    @Component({ imports: [SkeletonRegion], template: `<app-skeleton-region [busy]="busy()"><p>x</p></app-skeleton-region>` })
    class ProgressHost {
      busy = signal(true);
    }

    function setupProgress() {
      TestBed.configureTestingModule({ imports: [ProgressHost], providers: [provideTranslateService()] });
      const fixture = TestBed.createComponent(ProgressHost);
      fixture.detectChanges();
      return { fixture, el: fixture.nativeElement as HTMLElement };
    }

    it('shows the bar at once and the slow-load text only after 2 s', fakeAsync(() => {
      const { fixture, el } = setupProgress();
      expect(el.querySelector('[data-load-progress]')).not.toBeNull();
      expect(el.querySelector('[data-slow-load]')).toBeNull();
      tick(SLOW_LOAD_MS - 1);
      fixture.detectChanges();
      expect(el.querySelector('[data-slow-load]')).toBeNull();
      tick(1);
      fixture.detectChanges();
      expect(el.querySelector('[data-slow-load]')!.textContent).toContain('COMMON.SLOW_LOAD');
      expect(el.querySelector('[aria-live="polite"]')!.textContent).toContain('COMMON.SLOW_LOAD');
    }));

    it('removes aria-busy, the bar and the text when the load ends, and does not announce a late timer', fakeAsync(() => {
      const { fixture, el } = setupProgress();
      tick(SLOW_LOAD_MS);
      fixture.detectChanges();
      fixture.componentInstance.busy.set(false);
      fixture.detectChanges();
      expect(el.querySelector('app-skeleton-region')!.hasAttribute('aria-busy')).toBeFalse();
      expect(el.querySelector('[data-load-progress]')).toBeNull();
      expect(el.querySelector('[data-slow-load]')).toBeNull();
      expect(el.querySelector('[data-slow-load-slot]')).toBeNull();
      fixture.componentInstance.busy.set(true);
      fixture.detectChanges();
      expect(el.querySelector('[data-slow-load]')).toBeNull();
      tick(SLOW_LOAD_MS);
      fixture.detectChanges();
      fixture.componentInstance.busy.set(false);
      fixture.detectChanges();
      flush();
    }));
  });
});
