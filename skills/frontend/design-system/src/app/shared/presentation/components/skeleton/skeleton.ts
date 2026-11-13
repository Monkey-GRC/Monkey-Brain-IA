import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

export type SkeletonShape = 'line' | 'title' | 'block' | 'circle' | 'field' | 'badge' | 'card' | 'metric' | 'row';

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
  // Only for `line`: how many lines.
  readonly lines = input(1);
  // CSS length (`12rem`, `50%`) for `line` (single), `title`, `block` and `badge`.
  readonly width = input<string | null>(null);
  // CSS length for `block`.
  readonly height = input<string | null>(null);
  // Diameter in px for `circle`.
  readonly size = input(36);

  protected readonly lineItems = computed(() => Array.from({ length: Math.max(1, Math.floor(this.lines())) }, (_, i) => i));
}

/**
 * The region that is loading: `aria-busy` while `busy` and a text only for screen readers (`COMMON.LOADING`, announced politely). Put the skeletons inside and swap them for the
 * content when the data arrives. Without the region, a skeleton says nothing to a screen reader.
 */
@Component({
  selector: 'app-skeleton-region',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block', '[attr.aria-busy]': 'busy() ? "true" : null' },
  template: `
    <ng-content />
    @if (busy()) {
      <span class="sr-only" role="status" data-skeleton-status>{{ 'COMMON.LOADING' | translate }}</span>
    }
  `,
})
export class SkeletonRegion {
  readonly busy = input(true);
}
