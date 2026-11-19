import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** The data palette (`--color-data-1..5`): categories, never a status. */
export type DonutColor = 1 | 2 | 3 | 4 | 5;
/** A status (`--color-ok|warn|bad|neutral`): only where the ring itself says a status, e.g. Compliance. */
export type DonutTone = 'ok' | 'warn' | 'bad' | 'neutral';

const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * A donut with the value in the centre. `value` is 0-100 as the backend delivers it (already truncated); `null` means "not measured": the ring stays empty and
 * the centre shows nothing, so there is no misleading 0 %. `text` is the centre label, already formatted by the caller. The colour comes from the data palette
 * and never carries a status on its own: the status and the number are written as text next to it. `ariaLabel` carries the value for assistive technology.
 * `tone` (optional) replaces the data colour with a status token, for the views where the ring is the status of what it measures (Compliance); the text next to it still says it.
 *
 *   <app-donut [value]="42" text="42 %" [color]="2" ariaLabel="SOC 2: progress 42 %" />
 */
@Component({
  selector: 'app-donut',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative inline-flex shrink-0 items-center justify-center', '[style.width.px]': 'size()', '[style.height.px]': 'size()', role: 'img', '[attr.aria-label]': 'ariaLabel()' },
  template: `
    <svg viewBox="0 0 100 100" class="h-full w-full -rotate-90" aria-hidden="true">
      <circle cx="50" cy="50" [attr.r]="radius" fill="none" stroke-width="10" stroke="var(--color-tint-strong)" />
      @if (filled() > 0) {
      <circle cx="50" cy="50" [attr.r]="radius" fill="none" stroke-width="10" stroke-linecap="round" [attr.stroke]="stroke()" [attr.stroke-dasharray]="dash()" />
      }
    </svg>
    @if (text()) {
    <span class="absolute inset-0 flex items-center justify-center font-semibold leading-none tabular-nums text-ink" [class]="large() ? 'text-3xl' : 'text-sm'" aria-hidden="true">{{ text() }}</span>
    }
  `,
})
export class Donut {
  /** 0-100, or `null` when there is nothing measured (empty ring). */
  readonly value = input<number | null>(null);
  readonly text = input('');
  readonly color = input<DonutColor>(1);
  /** A status colour instead of the data palette; `null` (default) keeps `color`. */
  readonly tone = input<DonutTone | null>(null);
  readonly size = input(64);
  /** Large variant (use with `size` of 140-168): the centre text grows to `text-3xl`. */
  readonly large = input(false);
  readonly ariaLabel = input('');

  protected readonly radius = RADIUS;
  protected readonly stroke = computed(() => (this.tone() ? `var(--color-${this.tone()})` : `var(--color-data-${this.color()})`));
  protected readonly filled = computed(() => (Math.min(100, Math.max(0, this.value() ?? 0)) / 100) * CIRCUMFERENCE);
  protected readonly dash = computed(() => `${this.filled()} ${CIRCUMFERENCE}`);
}
