import { Injectable, signal } from '@angular/core';

export type ToastTone = 'info' | 'success' | 'warning' | 'error';

export interface ToastItem {
  readonly id: number;
  readonly tone: ToastTone;
  /** Text already translated by the caller; it is shown as plain text, never as HTML. */
  readonly title: string;
  readonly message: string;
}

type HoldSource = 'hover' | 'focus';

/** How many toasts are visible at once; a new one beyond the limit pushes the oldest out. */
export const MAX_VISIBLE_TOASTS = 4;
/** Default time on screen (ms). An error stays longer: it usually says what to do next. */
export const TOAST_DURATION_MS = 5000;
export const TOAST_ERROR_DURATION_MS = 8000;

interface Timing {
  timer: ReturnType<typeof setTimeout> | null;
  remaining: number;
  startedAt: number;
  holds: Set<HoldSource>;
}

/**
 * The only way to show a notice. Callers pass text that is already translated (the title and, optionally, the message) and never HTML.
 * `app-toast-container` (mounted once in each app's root) draws the list; this service owns the list and the timers.
 *
 *   private readonly toast = inject(ToastService);
 *   this.toast.showSuccess(this.translate.instant('X.SAVED'), response.message);
 *   this.toast.showError(title, error.message, 6000);   // `duration` (ms) is optional: 5 s, 8 s for an error
 *
 * Auto-close pauses while the pointer or the keyboard focus is on a toast (`hold` / `release`, called by the container).
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly list = signal<readonly ToastItem[]>([]);
  private readonly timings = new Map<number, Timing>();
  private nextId = 1;

  /** The toasts on screen, oldest first. */
  readonly toasts = this.list.asReadonly();

  showInfo(title: string, message = '', duration?: number): number {
    return this.show('info', title, message, duration);
  }

  showSuccess(title: string, message = '', duration?: number): number {
    return this.show('success', title, message, duration);
  }

  showWarning(title: string, message = '', duration?: number): number {
    return this.show('warning', title, message, duration);
  }

  showError(title: string, message = '', duration?: number): number {
    return this.show('error', title, message, duration);
  }

  /** Shows a toast and returns its id. A `duration` of 0 or less keeps it until the person closes it. */
  show(tone: ToastTone, title: string, message = '', duration?: number): number {
    const id = this.nextId++;
    const next = [...this.list(), { id, tone, title, message: message ?? '' }];
    while (next.length > MAX_VISIBLE_TOASTS) {
      const dropped = next.shift();
      if (dropped) this.forget(dropped.id);
    }
    this.list.set(next);
    const ms = duration ?? (tone === 'error' ? TOAST_ERROR_DURATION_MS : TOAST_DURATION_MS);
    const timing: Timing = { timer: null, remaining: ms, startedAt: 0, holds: new Set() };
    this.timings.set(id, timing);
    if (ms > 0) this.arm(id, timing);
    return id;
  }

  dismiss(id: number): void {
    this.forget(id);
    this.list.update((items) => items.filter((item) => item.id !== id));
  }

  dismissAll(): void {
    for (const id of [...this.timings.keys()]) this.forget(id);
    this.list.set([]);
  }

  /** Pause the auto-close while the pointer or the focus is on the toast. */
  hold(id: number, source: HoldSource): void {
    const timing = this.timings.get(id);
    if (!timing) return;
    const wasRunning = timing.holds.size === 0;
    timing.holds.add(source);
    if (wasRunning && timing.timer !== null) {
      clearTimeout(timing.timer);
      timing.timer = null;
      timing.remaining = Math.max(0, timing.remaining - (Date.now() - timing.startedAt));
    }
  }

  /** Resume the auto-close once neither the pointer nor the focus is on the toast. */
  release(id: number, source: HoldSource): void {
    const timing = this.timings.get(id);
    if (!timing) return;
    timing.holds.delete(source);
    if (timing.holds.size === 0 && timing.timer === null && timing.remaining > 0) this.arm(id, timing);
  }

  private arm(id: number, timing: Timing): void {
    timing.startedAt = Date.now();
    timing.timer = setTimeout(() => this.dismiss(id), timing.remaining);
  }

  private forget(id: number): void {
    const timing = this.timings.get(id);
    if (timing?.timer != null) clearTimeout(timing.timer);
    this.timings.delete(id);
  }
}
