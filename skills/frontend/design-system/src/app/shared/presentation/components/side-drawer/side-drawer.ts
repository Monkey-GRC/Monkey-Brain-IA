import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
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
 * `guarded` true (a form with unsent data) blocks only Esc and the backdrop, so nothing is lost by accident; the close button still closes.
 */
@Component({
  selector: 'app-side-drawer',
  imports: [A11yModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'onEscape($event)' },
  styles: [
    `
      @keyframes mk-drawer-in {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
      }
      .mk-drawer { animation: mk-drawer-in 180ms ease-out; }
      @media (prefers-reduced-motion: reduce) {
        .mk-drawer { animation: none; }
      }
    `,
  ],
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-[100000] bg-scrim" (click)="dismissByChance()" aria-hidden="true" data-testid="drawer-backdrop"></div>
      <aside
        cdkTrapFocus
        [cdkTrapFocusAutoCapture]="true"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="titleId"
        class="mk-drawer fixed inset-y-0 right-0 z-[100001] flex w-full flex-col border-l border-line bg-surface shadow-float"
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
            (click)="dismiss()"
            [disabled]="!dismissible()"
            [attr.aria-label]="'COMMON.CLOSE' | translate"
            [title]="'COMMON.CLOSE' | translate"
            class="rounded-control p-1.5 text-ink-muted enabled:hover:bg-canvas focus:outline-none focus-visible:ring-2 focus-visible:ring-action/40 disabled:cursor-not-allowed disabled:text-ink-faint"
          >
            <span class="material-symbols-rounded text-[22px]" aria-hidden="true">close</span>
          </button>
        </header>
        <div class="flex-1 overflow-y-auto px-5 py-5 text-sm text-ink"><ng-content /></div>
        <footer class="flex items-center justify-end gap-3 border-t border-line px-5 py-4 empty:hidden"><ng-content select="[actions]" /></footer>
      </aside>
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

  constructor() {
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

  // Esc cierra solo si el drawer es la capa de arriba y nadie atendió ya el evento; una Esc con `dismissible` en falso se queda en esta capa (no pasa a las de abajo).
  protected onEscape(event: Event): void {
    if (!this.open() || !takeEscape(this, event)) return;
    this.dismissByChance();
  }

  // Esc y el fondo: se ignoran con datos sin enviar (`guarded`).
  protected dismissByChance(): void {
    if (!this.guarded()) this.dismiss();
  }

  protected dismiss(): void {
    if (this.open() && this.dismissible()) this.closed.emit();
  }
}
