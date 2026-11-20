import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** One part of the whole. `fill` is a token class written whole by the caller (`bg-ok`, `bg-data-2`…) so Tailwind sees it; `label` is already translated (it is the tooltip). */
export interface StackedBarSegment {
  readonly key: string;
  readonly value: number;
  readonly fill: string;
  readonly label: string;
}

/**
 * Parts of a whole in one 8 px bar (MD-485): each segment grows with its value, 2 px apart, on a `tint-strong` track; a part of 0 is not drawn.
 * It never goes alone: the list with each part's name, figure and dot goes next to it, so colour is not the only signal. The bar is a `role="img"` with `ariaLabel`.
 *
 *   <app-stacked-bar [segments]="parts()" [ariaLabel]="'HOME.KEYS.TITLE' | translate" />
 */
@Component({
  selector: 'app-stacked-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full', role: 'img', '[attr.aria-label]': 'ariaLabel() || null' },
  template: `
    <div class="flex h-2 w-full gap-0.5 overflow-hidden rounded-badge bg-tint-strong">
      @for (s of visible(); track s.key) {
        <span class="h-full min-w-1" [class]="s.fill" [style.flex-grow]="s.value" [title]="s.label + ': ' + s.value" [attr.data-segment]="s.key"></span>
      }
    </div>
  `,
})
export class StackedBar {
  readonly segments = input<readonly StackedBarSegment[]>([]);
  readonly ariaLabel = input('');

  protected readonly visible = computed(() => this.segments().filter((s) => s.value > 0));
}
