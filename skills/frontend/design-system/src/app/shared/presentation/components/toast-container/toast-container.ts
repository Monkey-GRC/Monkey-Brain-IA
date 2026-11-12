import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { StatusIndicator, StatusTone } from '@shared/presentation/components/status-indicator/status-indicator';
import { ToastService, ToastTone } from './toast.service';

/** Tone of a notice -> status tone (token) and the word that always travels with the dot. `info` is neutral: the system has no fifth status colour. */
export const TOAST_LOOK: Record<ToastTone, { tone: StatusTone; labelKey: string; card: string }> = {
  success: { tone: 'ok', labelKey: 'COMMON.TOAST.SUCCESS', card: 'mk-surface-state-ok' },
  warning: { tone: 'warn', labelKey: 'COMMON.TOAST.WARNING', card: 'mk-surface-state-warn' },
  error: { tone: 'bad', labelKey: 'COMMON.TOAST.ERROR', card: 'mk-surface-state-bad' },
  info: { tone: 'neutral', labelKey: 'COMMON.TOAST.INFO', card: 'mk-surface-state-neutral' },
};

/**
 * Draws the notices of `ToastService`, top right, stacked. Mounted once in the root of each app. The region is always in the DOM
 * (a live region must exist before its content), `aria-live="polite"`; an error is `role="alert"`. Auto-close pauses with the pointer or the focus.
 */
@Component({
  selector: 'app-toast-container',
  imports: [TranslatePipe, StatusIndicator],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toast-container.html',
})
export class ToastContainer {
  protected readonly service = inject(ToastService);
  protected readonly look = TOAST_LOOK;
}
