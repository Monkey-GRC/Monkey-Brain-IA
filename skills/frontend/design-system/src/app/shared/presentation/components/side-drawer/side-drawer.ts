import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, input, output, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ConfirmDialog } from '@shared/presentation/components/confirm-dialog/confirm-dialog';
import { pushOverlay, takeEscape } from '@shared/presentation/components/overlay-stack/overlay-stack';

let nextId = 0;

/**
 * Panel that slides in from the right to see or edit something without leaving the page. It is the only layer (with the modals) that has a shadow.
 * Same behaviour as `app-modal`: focus trapped inside and returned on close, Esc (only if it is the top layer: a dialog opened over it takes the Esc first) and a click on the backdrop ask to close (`closed`), page scroll locked.
 *
 *   <app-side-drawer [open]="open()" titleKey="…" (closed)="open.set(false)">
 *     …body…
 *     <button actions class="mk-btn">Save</button>      <- `actions` stays fixed at the bottom
 *   </app-side-drawer>
 *
 * `dismissible` false (a call in progress) blocks Esc, the backdrop and the close button.
 * `guarded` true (an editor inside holds data the person wrote and has not sent; see `hasChanges`) never blocks in silence: Esc, the backdrop and the close button open a
 * confirmation on top (`app-confirm-dialog`, «Seguir editando» / «Descartar cambios», MD-485). «Seguir editando» goes back with what was written; «Descartar cambios» emits `closed`.
 */
@Component({
  selector: 'app-side-drawer',
  imports: [A11yModule, TranslatePipe, ConfirmDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'onEscape($event)', '(focusin)': 'remember($event)' },
  styles: [
    `
      @keyframes mk-drawer-in {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
      }
      .mk-drawer { animation: mk-drawer-in var(--motion-enter) var(--ease-out); }
      @media (prefers-reduced-motion: reduce) {
        .mk-drawer { animation: mk-fade-in var(--motion-enter) var(--ease-out); }
      }
    `,
  ],
  template: `
    @if (open()) {
      <div class="mk-backdrop-in fixed inset-0 z-(--z-drawer-scrim) bg-scrim" (click)="requestClose()" aria-hidden="true" data-testid="drawer-backdrop"></div>
      <aside
        cdkTrapFocus
        [cdkTrapFocusAutoCapture]="true"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="titleId"
        class="mk-drawer fixed inset-y-0 right-0 z-(--z-drawer) flex w-full flex-col border-l border-line bg-surface shadow-float"
        [class]="size() === 'lg' ? 'max-w-2xl' : 'max-w-md'"
      >
        <header class="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div class="min-w-0">
            <h2 [id]="titleId" class="truncate text-base font-semibold text-ink">{{ titleKey() | translate: titleParams() }}</h2>
            @if (subtitleKey(); as subtitle) {
              <p class="mt-0.5 text-sm text-ink-muted">{{ subtitle | translate: subtitleParams() }}</p>
            }
          </div>
          <button
            type="button"
            cdkFocusInitial
            (click)="requestClose()"
            [disabled]="!dismissible()"
            data-drawer-close
            [attr.aria-label]="'COMMON.CLOSE' | translate"
            [title]="'COMMON.CLOSE' | translate"
            class="rounded-control p-1.5 text-ink-muted enabled:hover:bg-canvas focus:outline-none focus-visible:ring-2 focus-visible:ring-action/40 disabled:cursor-not-allowed disabled:text-ink-faint"
          >
            <span class="material-symbols-rounded text-[24px]" aria-hidden="true">close</span>
          </button>
        </header>
        <div class="flex-1 overflow-y-auto px-5 py-5 text-sm text-ink"><ng-content /></div>
        <footer class="flex items-center justify-end gap-3 border-t border-line px-5 py-4 empty:hidden"><ng-content select="[actions]" /></footer>
      </aside>
      @if (confirmingDiscard()) {
        <app-confirm-dialog titleKey="COMMON.DISCARD.TITLE" messageKey="COMMON.DISCARD.MESSAGE" cancelLabelKey="COMMON.DISCARD.KEEP" confirmLabelKey="COMMON.DISCARD.CONFIRM"
          tone="danger" (cancelled)="keepEditing()" (confirmed)="discard()" />
      }
    }
  `,
})
export class SideDrawer {
  readonly open = input(false);
  readonly titleKey = input.required<string>();
  readonly titleParams = input<Record<string, unknown>>({});
  readonly subtitleKey = input<string | null>(null);
  readonly subtitleParams = input<Record<string, unknown>>({});
  readonly size = input<'md' | 'lg'>('md');
  readonly dismissible = input(true);
  readonly guarded = input(false);

  readonly closed = output<void>();

  protected readonly titleId = `drawer-title-${nextId++}`;
  // Se pidió descartar lo escrito: el sub-modal de confirmación está abierto.
  protected readonly confirmingDiscard = signal(false);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private lastFocus: HTMLElement | null = null;

  constructor() {
    effect(() => {
      if (!this.open()) this.confirmingDiscard.set(false);
    });
    effect((onCleanup) => {
      if (!this.open()) return;
      document.body.classList.add('overflow-hidden');
      const release = pushOverlay(this);
      onCleanup(() => {
        release();
        document.body.classList.remove('overflow-hidden');
      });
    });
  }

  // Esc cierra solo si el drawer es la capa de arriba y nadie atendió ya el evento (con la confirmación abierta, la Esc es suya); una Esc con `dismissible` en falso se
  // queda en esta capa (no pasa a las de abajo).
  protected onEscape(event: Event): void {
    if (!this.open() || !takeEscape(this, event)) return;
    this.requestClose();
  }

  // Esc, el fondo y la X: nada mientras se envía; con datos sin enviar (`guarded`), se pregunta antes; si no, se cierra.
  protected requestClose(): void {
    if (!this.open() || !this.dismissible() || this.confirmingDiscard()) return;
    if (this.guarded()) this.confirmingDiscard.set(true);
    else this.closed.emit();
  }

  protected keepEditing(): void {
    this.confirmingDiscard.set(false);
    setTimeout(() => {
      const panel = this.host.nativeElement.querySelector<HTMLElement>('aside[role="dialog"]');
      if (!panel || panel.contains(document.activeElement)) return;
      const target = this.lastFocus && panel.contains(this.lastFocus) ? this.lastFocus : panel.querySelector<HTMLElement>('input, textarea, select, button');
      (target ?? panel).focus();
    });
  }

  protected discard(): void {
    this.confirmingDiscard.set(false);
    this.closed.emit();
  }

  protected remember(event: FocusEvent): void {
    const target = event.target as HTMLElement | null;
    if (target?.closest('aside[role="dialog"]')) this.lastFocus = target;
  }
}
