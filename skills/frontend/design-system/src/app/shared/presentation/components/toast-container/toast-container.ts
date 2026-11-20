import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ToastService, ToastTone } from './toast.service';

/**
 * Tone of a notice -> its look (MD-485): the wash of the card (`mk-toast-<tone>`), a line icon in the status `-ink` tone (`check_circle`, `info`, `error`, `warning`) and the word of the
 * status, read only by a screen reader (the icon and the title already say it on screen; colour is never the only signal). Classes are written whole so Tailwind sees them.
 */
export const TOAST_LOOK: Record<ToastTone, { labelKey: string; card: string; icon: string; glyph: string }> = {
  success: { labelKey: 'COMMON.TOAST.SUCCESS', card: 'mk-toast mk-toast-success pointer-events-auto', icon: 'text-ok-ink', glyph: 'check_circle' },
  warning: { labelKey: 'COMMON.TOAST.WARNING', card: 'mk-toast mk-toast-warning pointer-events-auto', icon: 'text-warn-ink', glyph: 'warning' },
  error: { labelKey: 'COMMON.TOAST.ERROR', card: 'mk-toast mk-toast-error pointer-events-auto', icon: 'text-bad-ink', glyph: 'error' },
  info: { labelKey: 'COMMON.TOAST.INFO', card: 'mk-toast mk-toast-info pointer-events-auto', icon: 'text-action', glyph: 'info' },
};

/**
 * Draws the notices of `ToastService`, top right, stacked. Mounted once in the root of each app. The region is always in the DOM
 * (a live region must exist before its content), `aria-live="polite"`; an error is `role="alert"`. Auto-close pauses with the pointer or the focus.
 */
@Component({
  selector: 'app-toast-container',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toast-container.html',
})
export class ToastContainer {
  protected readonly service = inject(ToastService);
  protected readonly look = TOAST_LOOK;
  /** Where the stack goes inside the app shell: `null` outside it (sign-in, Settings), where `top-6 right-6` apply. */
  protected readonly place = signal<{ top: number; right: number } | null>(null);

  constructor() {
    // Measured each time a toast appears (the header is sticky, so its bottom does not move with the scroll): just under the header, at the
    // layout's gap (12 px, the `mt-3` between the header and the content panel), and aligned with the right edge of the header and the content.
    effect(() => {
      if (this.service.toasts().length > 0) this.place.set(shellPlace());
    });
  }
}

/** The gap of the floating shell between the header and the content panel (`mt-3` in `app-layout`). */
export const SHELL_GAP_PX = 12;

/** Top and right offsets of the toast stack under the shell header (`[data-app-header]`), or `null` when there is no header on screen. */
export function shellPlace(doc: Document = document): { top: number; right: number } | null {
  const header = doc.querySelector<HTMLElement>('[data-app-header]');
  if (!header) return null;
  const box = header.getBoundingClientRect();
  if (box.height === 0) return null;
  return { top: Math.round(box.bottom + SHELL_GAP_PX), right: Math.round(doc.documentElement.clientWidth - box.right) };
}
