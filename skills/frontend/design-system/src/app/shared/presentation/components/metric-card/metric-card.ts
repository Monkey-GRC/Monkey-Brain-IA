import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** `data-1..5` for a plain count (the data palette); `ok | warn | bad | neutral` only when the metric IS that status (expired, failing, pending). */
export type MetricColor = 'data-1' | 'data-2' | 'data-3' | 'data-4' | 'data-5' | 'ok' | 'warn' | 'bad' | 'neutral';

// Every class is written whole: Tailwind does not see classes built from pieces.
const ICON: Record<MetricColor, string> = {
  'data-1': 'mk-metric-icon-data-1',
  'data-2': 'mk-metric-icon-data-2',
  'data-3': 'mk-metric-icon-data-3',
  'data-4': 'mk-metric-icon-data-4',
  'data-5': 'mk-metric-icon-data-5',
  ok: 'mk-metric-icon-ok',
  warn: 'mk-metric-icon-warn',
  bad: 'mk-metric-icon-bad',
  neutral: 'mk-metric-icon-neutral',
};

/**
 * The only metric card (MD-483), horizontal: a surface card with a 1 px line and no shadow, low and compact (16 px padding, height set by the circle). On the left, the line icon inside a 56 px circle of the
 * metric's colour (vivid tint, 1 px line, 28 px icon), vertically centred; to its right the label (`text-sm` medium, `ink-muted`) with the figure below (`text-kpi`, semibold, tabular, `ink`).
 * A metric with a percentage keeps its `app-donut`: project it with the `metricDonut` attribute at 72 px and it sits at the right edge of the card, centred vertically; the cards of a row stretch to the same
 * height, so those without a donut keep their content centred. The descriptive line (`description`) is optional and no view passes it. All the cards of a row look the same: no featured card here.
 * Put them in a `mk-metric-grid` (4 per row), `mk-metric-grid-6` (six, with a divider between two groups of three) or `mk-metric-grid-3`.
 * Every text arrives already translated. The icon is a Material Symbols Rounded name and is decorative: the label says what the metric is, and a status colour always has its word.
 *
 *   <app-metric-card icon="apartment" color="data-1" [label]="'…' | translate" [value]="total"> <app-donut metricDonut [value]="80" text="80%" [size]="72" /> </app-metric-card>
 */
@Component({
  selector: 'app-metric-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex h-full items-center gap-4 rounded-card border border-line bg-surface p-4' },
  template: `
    <span class="mk-metric-icon" [class]="iconClass()" aria-hidden="true"><span class="material-symbols-rounded text-[28px] leading-none">{{ icon() }}</span></span>
    <div class="min-w-0 flex-1">
      <p class="text-sm font-medium text-ink-muted" data-metric-label>{{ label() }}</p>
      <p class="mt-0.5 text-kpi font-semibold tabular-nums text-ink" data-metric-value>{{ value() }}</p>
      @if (description()) {
        <p class="mt-1 text-sm text-ink-muted" data-metric-description>{{ description() }}</p>
      }
      <ng-content />
    </div>
    <div class="shrink-0 empty:hidden"><ng-content select="[metricDonut]" /></div>
  `,
})
export class MetricCard {
  readonly icon = input.required<string>();
  readonly color = input.required<MetricColor>();
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  /** Optional one-line caption; none by default (Rod, MD-483: title and figure are enough). No gap when absent. */
  readonly description = input('');

  protected readonly iconClass = computed(() => ICON[this.color()] ?? ICON.neutral);
}
