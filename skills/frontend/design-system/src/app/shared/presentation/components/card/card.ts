import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type CardTone = 'ok' | 'warn' | 'bad' | 'neutral';

const TONE_SURFACE: Record<CardTone, string> = {
  ok: 'mk-surface-state-ok',
  warn: 'mk-surface-state-warn',
  bad: 'mk-surface-state-bad',
  neutral: 'mk-surface-state-neutral',
};

/**
 * Base card: white surface with a 1 px border and a minimal shadow, on the gray panel.
 * `featured` is the brand-blue variant with a subtle gradient (one per view at most, for the figure that matters most).
 * `tinted` is the soft brand-tint variant for support cards (several per view are fine). `featured` wins if both are set.
 * `tone` is the sober state card (a faint tint of `ok`/`warn`/`bad`/`neutral` and a full 1 px border of that tone, text stays `ink`): for a verdict or a notice that IS a status,
 * never decoration. Order: `featured` > `tone` > `tinted`.
 * It has no text of its own: the content is projected. Never inside another card or `section`.
 */
@Component({
  selector: 'app-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'hostClass()' },
  template: `<ng-content />`,
})
export class Card {
  readonly featured = input(false, { transform: booleanAttribute });
  readonly tinted = input(false, { transform: booleanAttribute });
  readonly tone = input<CardTone | null>(null);
  readonly padded = input(true, { transform: booleanAttribute });

  protected readonly hostClass = computed(() => {
    const tone = this.tone();
    const surface = this.featured() ? 'mk-surface-featured' : tone ? TONE_SURFACE[tone] : this.tinted() ? 'mk-surface-tinted' : 'mk-surface';
    return `block ${surface}${this.padded() ? ' p-5' : ''}`;
  });
}
