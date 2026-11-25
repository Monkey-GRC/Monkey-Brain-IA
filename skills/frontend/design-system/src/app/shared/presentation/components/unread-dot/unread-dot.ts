import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The «new, not read yet» mark of a list row (a notice of the bell): an 8 px dot in `action` (`rounded-full`, like the dot of a status badge). When the row is read the
 * dot keeps its place, transparent, so the texts of read and unread rows stay aligned. It is decorative (`aria-hidden`): the row says «Unread» in an `sr-only` text
 * and with its weight, so the colour is never the only signal.
 *
 *   <app-unread-dot class="mt-1.5" [unread]="!item.is_read" />
 */
@Component({
  selector: 'app-unread-dot',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-block size-2 shrink-0 rounded-full',
    '[class.bg-action]': 'unread()',
    '[attr.data-unread]': 'unread()',
    'aria-hidden': 'true',
  },
  template: '',
})
export class UnreadDot {
  readonly unread = input(true);
}
