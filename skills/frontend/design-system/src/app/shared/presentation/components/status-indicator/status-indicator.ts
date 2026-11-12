import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { StatusTone } from '@shared/domain/models/status-tone.model';

export type { StatusTone };

/** The only map tone -> token. Colour never travels alone: the label is always next to the dot. */
export const TONE_DOT: Record<StatusTone, string> = {
  ok: 'bg-ok',
  bad: 'bg-bad',
  warn: 'bg-warn',
  neutral: 'bg-neutral',
};

/**
 * A status: an 8 px dot of the tone colour plus the text. No background, no pill (design-system README, section 2).
 *
 *   <app-status-indicator tone="ok" labelKey="TEAM.STATUS.ACTIVE" />
 *   <app-status-indicator tone="warn" [label]="labels.of('PREFIX', value)" />
 */
@Component({
  selector: 'app-status-indicator',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex items-center gap-2 whitespace-nowrap text-sm text-ink', '[attr.data-tone]': 'tone()' },
  template: `
    <span class="size-2 shrink-0 rounded-full" [class]="dot()" aria-hidden="true"></span>
    @let hint = hintKey();
    @let key = labelKey();
    <span [attr.title]="hint ? (hint | translate) : null">{{ label() ?? (key ? (key | translate: labelParams()) : '') }}</span>
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

  protected dot(): string {
    return TONE_DOT[this.tone()] ?? TONE_DOT.neutral;
  }
}
