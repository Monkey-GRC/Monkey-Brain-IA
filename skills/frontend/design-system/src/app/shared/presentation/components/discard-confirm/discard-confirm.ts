import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, Signal, WritableSignal, inject, input, linkedSignal } from '@angular/core';
import { ConfirmDialog } from '@shared/presentation/components/confirm-dialog/confirm-dialog';

/** What a guarded modal tells its guard: is it open, may it close now, does it hold unsent data, and how it closes. */
export interface DiscardGuardOptions {
  open: () => boolean;
  /** `false` while nothing may close it (`dismissible` false, a call in progress). */
  canClose: () => boolean;
  /** `true` while it holds data the person wrote and has not sent (`hasChanges` of `shared/domain/utils/form-changes`). */
  guarded: () => boolean;
  /** Closes for good (emits the modal's `closed`). */
  close: () => void;
}

// Where the focus goes back if the remembered field is gone: the first field or control of the panel.
const FOCUSABLE = 'input, textarea, select, button, [tabindex]:not([tabindex="-1"])';

/**
 * «Descartar cambios» of a modal (MD-485), the one rule of `form-modal` and `detail-modal`: every way out (Esc, backdrop, Cancel or «Cerrar», the X) calls `request()`;
 * nothing happens while it is closed or may not close; with unsent data it asks (`confirming`, drawn by `<app-discard-confirm [guard]>`); otherwise it closes.
 * «Seguir editando» (`keepEditing`) puts the focus back on the field it was in (a click on the backdrop had taken it out of the panel); «Descartar cambios» (`discard`) closes.
 * Create it in a field initializer (it injects the host and its `DestroyRef`) and bind the host's `(focusin)` to `remember($event)`:
 *
 *   protected readonly discardGuard = new DiscardGuard({ open: this.open, canClose: () => this.dismissible(), guarded: this.guarded, close: () => this.closed.emit() });
 *   host: { '(focusin)': 'discardGuard.remember($event)' }
 *   <app-modal … (dismissed)="discardGuard.request()">…</app-modal>
 *   <app-discard-confirm [guard]="discardGuard" />          <- outside the panel: the panel animates with transform and a `fixed` inside it would be tied to it
 *
 * If the modal is closed by its caller (saved, navigated), a pending confirmation is forgotten (it is a `linkedSignal` of `open`) and a pending focus does nothing.
 */
export class DiscardGuard {
  // Back to false whenever `open` changes: closing (or reopening) forgets a confirmation that was pending.
  private readonly pending: WritableSignal<boolean>;
  /** The confirmation on top is open (never while the modal is closed). */
  readonly confirming: Signal<boolean>;
  private readonly options: DiscardGuardOptions;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private lastFocus: HTMLElement | null = null;
  private focusTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(options: DiscardGuardOptions) {
    this.options = options;
    this.pending = linkedSignal({ source: options.open, computation: () => false });
    this.confirming = this.pending.asReadonly();
    inject(DestroyRef).onDestroy(() => clearTimeout(this.focusTimer));
  }

  /** Esc, the backdrop, Cancel or «Cerrar» and the X come here. */
  request(): void {
    if (!this.options.open() || !this.options.canClose() || this.confirming()) return;
    if (this.options.guarded()) this.pending.set(true);
    else this.options.close();
  }

  keepEditing(): void {
    this.pending.set(false);
    clearTimeout(this.focusTimer);
    this.focusTimer = setTimeout(() => {
      const panel = this.options.open() ? this.host.nativeElement.querySelector<HTMLElement>('[role="dialog"]') : null;
      if (!panel || panel.contains(document.activeElement)) return;
      const target = this.lastFocus && panel.contains(this.lastFocus) ? this.lastFocus : panel.querySelector<HTMLElement>(FOCUSABLE);
      (target ?? panel).focus();
    });
  }

  discard(): void {
    this.pending.set(false);
    this.options.close();
  }

  /** The host's `(focusin)`: the last field focused inside the panel, where «Seguir editando» goes back. */
  remember(event: FocusEvent): void {
    const target = event.target as HTMLElement | null;
    if (target?.closest('[role="dialog"]')) this.lastFocus = target;
  }
}

/** The confirmation of a `DiscardGuard`: `app-confirm-dialog` with the `COMMON.DISCARD.*` texts, «Seguir editando» (initial focus) and «Descartar cambios» (`danger`). */
@Component({
  selector: 'app-discard-confirm',
  imports: [ConfirmDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (guard().confirming()) {
      <app-confirm-dialog titleKey="COMMON.DISCARD.TITLE" messageKey="COMMON.DISCARD.MESSAGE" cancelLabelKey="COMMON.DISCARD.KEEP" confirmLabelKey="COMMON.DISCARD.CONFIRM"
        tone="danger" (cancelled)="guard().keepEditing()" (confirmed)="guard().discard()" />
    }
  `,
})
export class DiscardConfirm {
  readonly guard = input.required<DiscardGuard>();
}
