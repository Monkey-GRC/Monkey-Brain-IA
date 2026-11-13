import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { StatusTone } from '@shared/domain/models/status-tone.model';
import { Badge, BadgeSize } from '../badge/badge';

export type { StatusTone };

/**
 * A status: an `app-badge` of kind `status` (soft tint of the tone, 1 px line, dot at the left and the text; D115). The dot is not the only signal: the text is always there.
 *
 *   <app-status-indicator tone="ok" labelKey="TEAM.STATUS.ACTIVE" />
 *   <app-status-indicator tone="warn" [label]="labels.of('PREFIX', value)" />
 */
@Component({
  selector: 'app-status-indicator',
  imports: [TranslatePipe, Badge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex max-w-full align-middle', '[attr.data-tone]': 'tone()' },
  template: `
    @let hint = hintKey();
    @let key = labelKey();
    <app-badge kind="status" [tone]="tone()" [size]="size()" [hint]="hint ? (hint | translate) : null">{{ label() ?? (key ? (key | translate: labelParams()) : '') }}</app-badge>
  `,
})
export class StatusIndicator {
  readonly tone = input<StatusTone>('neutral');
  /** Translation key of the text. */
  readonly labelKey = input<string | null>(null);
  /** Text already translated by the caller (a value the backend serves, or an enum label that may be unknown); wins over `labelKey`. */
  readonly label = input<string | null>(null);
  readonly labelParams = input<Record<string, unknown>>({});
  /** Optional tooltip (translation key). */
  readonly hintKey = input<string | null>(null);
  readonly size = input<BadgeSize>('sm');
}
