import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** `action` (default): progress, not a status. A status tone only where the bar IS the status of what it measures (the text next to it still says it). */
export type ProgressTone = 'action' | 'ok' | 'warn' | 'bad' | 'neutral';

const FILL: Record<ProgressTone, string> = { action: 'bg-action', ok: 'bg-ok', warn: 'bg-warn', bad: 'bg-bad', neutral: 'bg-neutral' };

/**
 * A thin progress bar (MD-485): a `tint-strong` track and the fill. `value` is 0-100 as the backend (or the process) delivers it; `null` leaves the track empty.
 * `variant="process"` (8 px) is for a running process (connect, evaluate, the steps of a wizard); the default (4 px) goes next to a status and a coverage, never alone.
 * The fill moves with `transform: scaleX` (never `width`), 200 ms ease-out; with `prefers-reduced-motion` it jumps. With `ariaLabel` it is a `progressbar` with its value;
 * without it the bar is decorative (`aria-hidden`), because the figure is written next to it.
 *
 *   <app-progress-line [value]="42" />  ·  <app-progress-line variant="process" [value]="pct()" [ariaLabel]="'X.PROGRESS' | translate" />
 */
@Component({
  selector: 'app-progress-line',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block w-full',
    '[attr.role]': "ariaLabel() ? 'progressbar' : null",
    '[attr.aria-label]': 'ariaLabel() || null',
    '[attr.aria-valuemin]': 'ariaLabel() ? 0 : null',
    '[attr.aria-valuemax]': 'ariaLabel() ? 100 : null',
    '[attr.aria-valuenow]': 'ariaLabel() ? clamped() : null',
    '[attr.aria-hidden]': "ariaLabel() ? null : 'true'",
    '[attr.data-value]': 'clamped()',
  },
  template: `
    <div class="w-full overflow-hidden rounded-badge bg-tint-strong" [class]="variant() === 'process' ? 'h-2' : 'h-1'">
      <div
        class="h-full w-full origin-left rounded-badge transition-transform duration-200 motion-reduce:transition-none"
        [class]="fill()"
        [style.transform]="'scaleX(' + clamped() / 100 + ')'"
        data-progress-fill
      ></div>
    </div>
  `,
})
export class ProgressLine {
  readonly value = input<number | null>(null);
  readonly tone = input<ProgressTone>('action');
  readonly variant = input<'default' | 'process'>('default');
  readonly ariaLabel = input('');

  protected readonly clamped = computed(() => Math.min(100, Math.max(0, Math.round(this.value() ?? 0))));
  protected readonly fill = computed(() => FILL[this.tone()]);
}
