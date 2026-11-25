import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * How many new things a control has (the unread notices of the bell): a small filled box (`rounded-badge`, `action` with `on-action` text, `text-xs` semibold,
 * tabular figures), at least 20 px wide so one digit is square, with a 2 px `surface` ring that separates it from the icon it overlaps. Above `max` it reads «99+». With 0 or less it is not drawn (the `hidden` attribute): the consumer may still wrap it
 * in an `@if`. It is decorative (`aria-hidden`): the number must also be in the accessible name of the control that carries it («Avisos, 3 sin leer»).
 * The position is the consumer's: on a 40 px icon button, `class="absolute -top-1 left-6"` (its left edge past the middle of the icon, so a long «99+» grows to the
 * right and never hides the icon).
 *
 *   <app-count-badge class="absolute -top-1 left-6" [count]="unread()" />
 */
@Component({
  selector: 'app-count-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-flex h-5 min-w-5 items-center justify-center rounded-badge bg-action px-1 text-xs font-semibold leading-none text-on-action tabular-nums ring-2 ring-surface',
    '[attr.hidden]': "count() <= 0 ? '' : null",
    '[attr.data-count]': 'count()',
    'aria-hidden': 'true',
  },
  template: `{{ shown() }}`,
})
export class CountBadge {
  readonly count = input(0);
  /** Above it the badge reads «<max>+». */
  readonly max = input(99);

  protected readonly shown = computed(() => (this.count() > this.max() ? `${this.max()}+` : String(Math.max(0, this.count()))));
}
