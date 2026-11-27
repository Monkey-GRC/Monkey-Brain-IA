import { ChangeDetectionStrategy, Component, DestroyRef, InjectionToken, forwardRef, computed, effect, inject, input, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

export type SkeletonShape = 'line' | 'title' | 'block' | 'circle' | 'field' | 'badge' | 'card' | 'metric' | 'row' | 'tabs' | 'section';

/**
 * Placeholder with the shape of the content that is loading (D116). Use one per region, not a single block for the whole screen. It is decorative (`aria-hidden`): the
 * region that loads carries `aria-busy` and the text for screen readers, see `app-skeleton-region`. The animation is a soft sweep; with `prefers-reduced-motion` it stays still.
 *
 * Shapes (`shape`):
 *  - `line`: text; `lines` lines (the last one shorter when there is more than one). `width` sets the width of a single line.
 *  - `title`: a heading line.
 *  - `block`: free box, `width` and `height` (any CSS length; default 100% x 6rem).
 *  - `circle`: avatar, `size` in px (default 36, the `app-person-cell` one).
 *  - `field`: label and input box (`app-field` + `mk-input`).
 *  - `badge`: the size of an `app-badge`; `width` to adjust.
 *  - `card`: an `app-card` with a title and some lines. `metric`: a KPI card (label, big number, caption).
 *  - `row`: a list row (avatar, two lines and a badge).
 *  - `tabs`: an `app-tabs` bar with `lines` tabs and its 1 px line (MD-499).
 *  - `section`: a section of a detail: its title with the 1 px line below and `lines` lines of content (MD-499).
 *
 *   <app-skeleton-region [busy]="loading()"> @if (loading()) { <app-skeleton shape="field" /> <app-skeleton shape="field" /> } @else { …real form… } </app-skeleton-region>
 */
@Component({
  selector: 'app-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block', 'aria-hidden': 'true', '[attr.data-shape]': 'shape()' },
  template: `
    @switch (shape()) {
      @case ('line') {
        <div class="space-y-2">
          @for (n of lineItems(); track n; let last = $last) {
            <div class="mk-skeleton h-3.5 rounded-badge" data-skeleton-block [style.width]="last && lineItems().length > 1 ? '60%' : (width() ?? '100%')"></div>
          }
        </div>
      }
      @case ('title') {
        <div class="mk-skeleton h-6 rounded-badge" data-skeleton-block [style.width]="width() ?? '40%'"></div>
      }
      @case ('block') {
        <div class="mk-skeleton rounded-control" data-skeleton-block [style.width]="width() ?? '100%'" [style.height]="height() ?? '6rem'"></div>
      }
      @case ('circle') {
        <div class="mk-skeleton rounded-full" data-skeleton-block [style.width.px]="size()" [style.height.px]="size()"></div>
      }
      @case ('field') {
        <div class="mk-skeleton mb-1.5 h-3 w-24 rounded-badge" data-skeleton-block></div>
        <div class="mk-skeleton h-10 w-full rounded-control" data-skeleton-block></div>
      }
      @case ('badge') {
        <div class="mk-skeleton h-5 rounded-badge" data-skeleton-block [style.width]="width() ?? '4rem'"></div>
      }
      @case ('card') {
        <div class="mk-surface space-y-3 p-5">
          <div class="mk-skeleton h-5 w-2/5 rounded-badge" data-skeleton-block></div>
          <div class="space-y-2">
            <div class="mk-skeleton h-3.5 w-full rounded-badge" data-skeleton-block></div>
            <div class="mk-skeleton h-3.5 w-full rounded-badge" data-skeleton-block></div>
            <div class="mk-skeleton h-3.5 w-3/5 rounded-badge" data-skeleton-block></div>
          </div>
        </div>
      }
      @case ('metric') {
        <div class="mk-surface space-y-3 p-5">
          <div class="mk-skeleton h-3 w-1/3 rounded-badge" data-skeleton-block></div>
          <div class="mk-skeleton h-8 w-24 rounded-badge" data-skeleton-block></div>
          <div class="mk-skeleton h-3 w-1/2 rounded-badge" data-skeleton-block></div>
        </div>
      }
      @case ('tabs') {
        <div class="flex gap-6 border-b border-line pb-3 pt-1">
          @for (n of lineItems(); track n) {
            <div class="mk-skeleton h-4 w-24 rounded-badge" data-skeleton-block></div>
          }
        </div>
      }
      @case ('section') {
        <div class="mb-3 border-b border-line pb-2.5 pt-1.5"><div class="mk-skeleton h-5 rounded-badge" data-skeleton-block [style.width]="width() ?? '35%'"></div></div>
        <div class="space-y-2">
          @for (n of lineItems(); track n; let last = $last) {
            <div class="mk-skeleton h-3.5 rounded-badge" data-skeleton-block [style.width]="last && lineItems().length > 1 ? '60%' : '100%'"></div>
          }
        </div>
      }
      @case ('row') {
        <div class="flex items-center gap-3 py-2">
          <div class="mk-skeleton size-9 shrink-0 rounded-full" data-skeleton-block></div>
          <div class="min-w-0 flex-1 space-y-2">
            <div class="mk-skeleton h-3.5 w-2/5 rounded-badge" data-skeleton-block></div>
            <div class="mk-skeleton h-3 w-3/5 rounded-badge" data-skeleton-block></div>
          </div>
          <div class="mk-skeleton h-5 w-16 shrink-0 rounded-badge" data-skeleton-block></div>
        </div>
      }
    }
  `,
})
export class Skeleton {
  readonly shape = input<SkeletonShape>('line');
  // How many lines (`line`, `section`) or tabs (`tabs`).
  readonly lines = input(1);
  // CSS length (`12rem`, `50%`) for `line` (single), `title`, `block` and `badge`.
  readonly width = input<string | null>(null);
  // CSS length for `block`.
  readonly height = input<string | null>(null);
  // Diameter in px for `circle`.
  readonly size = input(36);

  protected readonly lineItems = computed(() => Array.from({ length: Math.max(1, Math.floor(this.lines())) }, (_, i) => i));
}

/** After this long a load is «slow»: the region adds «This may take a few seconds». */
export const SLOW_LOAD_MS = 2000;

/** A `app-skeleton-region` that is loading with its bar on provides this, so a table inside does not draw a second bar. */
export const LOAD_REGION = new InjectionToken<{ readonly drawsBar: () => boolean }>('LOAD_REGION');

/**
 * The indeterminate bar of a load (4 px). Only the bar: the owner places it over its own top edge (absolute), so it appearing or going never moves the content.
 * The «may take a few seconds» line is `app-slow-load-note`, in a slot of its own below the content, never over it. Both are the common pieces of `app-skeleton-region`
 * and `app-data-table`; use one of those (or this bar alone for a running process with no total, e.g. a file the server is still processing).
 */
@Component({
  selector: 'app-load-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block', 'data-load-progress': '', 'aria-hidden': 'true' },
  styles: `
    @keyframes mk-indeterminate { from { transform: translateX(-100%); } to { transform: translateX(250%); } }
    .mk-indeterminate-fill { animation: mk-indeterminate 1.4s var(--ease-out) infinite; }
    @media (prefers-reduced-motion: reduce) { .mk-indeterminate-fill { animation: none; width: 100%; opacity: 0.5; } }
  `,
  template: `<div class="h-1 w-full overflow-hidden rounded-badge bg-tint-strong"><div class="mk-indeterminate-fill h-full w-2/5 rounded-badge bg-action"></div></div>`,
})
export class LoadProgress {}

/**
 * The line `COMMON.SLOW_LOAD` («This may take a few seconds»), past `SLOW_LOAD_MS` from the moment it is drawn. Its slot (`min-h-5`, the height of the line, and 12 px above)
 * exists from the first moment of the load, empty, so the text appearing never moves anything and never covers anything: the owner puts it BELOW its content (MD-505).
 * With `announce` it is its own polite live region; without it, decorative (the owner already announces it).
 */
@Component({
  selector: 'app-slow-load-note',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block mt-3 min-h-5',
    'data-slow-load-slot': '',
    '[attr.role]': "announce() ? 'status' : null",
    '[attr.aria-live]': "announce() ? 'polite' : null",
    '[attr.aria-hidden]': "announce() ? null : 'true'",
  },
  template: `
    @if (slow()) {
      <p class="text-sm text-ink-muted" data-slow-load>{{ 'COMMON.SLOW_LOAD' | translate }}</p>
    }
  `,
})
export class SlowLoadNote {
  readonly announce = input(false);
  readonly slow = signal(false);

  constructor() {
    const timer = setTimeout(() => this.slow.set(true), SLOW_LOAD_MS);
    inject(DestroyRef).onDestroy(() => clearTimeout(timer));
  }
}

/**
 * The region that is loading: `aria-busy` while `busy` and a text only for screen readers (`COMMON.LOADING`, `aria-live="polite"`). Put the skeletons inside and swap them for the
 * content when the data arrives. Without the region, a skeleton says nothing to a screen reader.
 * By default (`progress` on; `[progress]="false"` to turn it off) it also draws the bar of `app-load-progress`, and the slow-load line past `SLOW_LOAD_MS`, announced politely too.
 * A table inside a loading region does not draw its own bar (`LOAD_REGION`).
 * The bar is drawn over the top edge of the region (absolute), so it appearing or going never moves the content. The slow-load line goes in its own slot BELOW the content
 * (`app-slow-load-note`, reserved from the start of the load): it never covers a header or a row (MD-505).
 */
@Component({
  selector: 'app-skeleton-region',
  imports: [TranslatePipe, LoadProgress, SlowLoadNote],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: LOAD_REGION, useExisting: forwardRef(() => SkeletonRegion) }],
  host: { class: 'relative block', '[attr.aria-busy]': 'busy() ? "true" : null' },
  template: `
    @if (drawsBar()) {
      <app-load-progress class="pointer-events-none absolute inset-x-0 top-0 z-10" />
    }
    <ng-content />
    @if (drawsBar()) {
      <app-slow-load-note />
    }
    <span class="sr-only" aria-live="polite" role="status" data-skeleton-status>
      @if (busy()) {{{ 'COMMON.LOADING' | translate }}@if (slow()) { · {{ 'COMMON.SLOW_LOAD' | translate }}}}
    </span>
  `,
})
export class SkeletonRegion {
  readonly busy = input(true);
  /** The bar and the slow-load text are the default of every load; `[progress]="false"` turns them off. */
  readonly progress = input(true);
  protected readonly slow = signal(false);
  readonly drawsBar = computed(() => this.busy() && this.progress());

  constructor() {
    effect((onCleanup) => {
      this.slow.set(false);
      if (!this.drawsBar()) return;
      const timer = setTimeout(() => this.slow.set(true), SLOW_LOAD_MS);
      onCleanup(() => clearTimeout(timer));
    });
  }
}
