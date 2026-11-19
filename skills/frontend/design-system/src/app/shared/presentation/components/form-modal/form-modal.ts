import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Modal } from '@shared/presentation/components/modal/modal';
import { BusyFields } from '@shared/presentation/directives/busy-fields';

let nextId = 0;

/**
 * Centered modal to create, edit or see something: title, one short line saying what it is for, a body that scrolls and a footer that stays fixed. It is built on `app-modal`
 * (role=dialog, focus trapped and returned, Esc, backdrop, entrance animation) and replaces the side drawer for forms and for the detail of a person or a group.
 * By default there is no X: the way out is the **Cancel** button of the footer, always first, next to the main action(s) projected with `actions`. `icon` (a brand container at the left of the title) and `closeButton` (an X, same effect as Cancel) are opt-in; today only the detail of a person uses them (MD-483).
 *
 *   <app-form-modal titleKey="…" descriptionKey="…" [dismissible]="!saving()" [guarded]="dirty()" (closed)="close()">
 *     <form id="my-form" (submit)="$event.preventDefault(); save()"> …fields… </form>
 *     <button actions type="submit" form="my-form" class="mk-btn">Save</button>
 *   </app-form-modal>
 *
 * `dismissible` false (a call in progress) blocks Esc, the backdrop and Cancel. `guarded` true (a form with unsent data) blocks only Esc and the backdrop; Cancel still closes.
 * For a read-only detail use `cancelLabelKey="COMMON.CLOSE"`. The primary action is a `mk-btn` (one per modal); a destructive one is `mk-btn-danger`; the rest, `mk-btn-secondary`.
 * `busy` true (a process launched from the footer, D116) holds the fields of the body as read-only (`appBusyFields`: `readonly`/`disabled`, values untouched) and blocks Esc, the
 * backdrop and Cancel; mark the action button with `[appBusy]` and keep both on until the API answers. The description is linked with `aria-describedby`; the body is a normal block (use `app-field` and `mk-input` inside).
 */
@Component({
  selector: 'app-form-modal',
  imports: [Modal, TranslatePipe, BusyFields],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal
      [open]="open()"
      [size]="size()"
      [padded]="false"
      [labelledBy]="titleId"
      [describedBy]="descriptionKey() ? descriptionId : null"
      [dismissible]="dismissible() && !guarded() && !busy()"
      [testId]="testId()"
      (dismissed)="closed.emit()"
    >
      <header class="flex shrink-0 items-start gap-4 border-b border-line px-6 pb-4 pt-5">
        @if (icon(); as name) {
          <span class="inline-flex size-12 shrink-0 items-center justify-center rounded-card border border-metric-data-1-line bg-metric-data-1-bg text-badge-data-1-ink" data-modal-icon aria-hidden="true"><span class="material-symbols-rounded text-[28px] leading-none">{{ name }}</span></span>
        }
        <div class="min-w-0 flex-1">
          <h2 [id]="titleId" class="text-lg font-semibold text-ink">{{ titleKey() | translate: titleParams() }}</h2>
          @if (descriptionKey(); as description) {
            <p [id]="descriptionId" class="mt-1 text-sm text-ink-muted">{{ description | translate: descriptionParams() }}</p>
          }
        </div>
        @if (closeButton()) {
          <button type="button" class="inline-flex size-9 shrink-0 items-center justify-center rounded-control text-ink-muted transition-colors enabled:hover:bg-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action/40 disabled:cursor-not-allowed disabled:text-ink-faint" [disabled]="!dismissible() || busy()" [attr.aria-label]="cancelLabelKey() | translate" (click)="cancel()" data-close-x><span class="material-symbols-rounded text-[22px] leading-none" aria-hidden="true">close</span></button>
        }
      </header>
      <div class="min-h-0 flex-1 overflow-y-auto px-6 py-5 text-sm text-ink" data-form-modal-body [appBusyFields]="busy()"><ng-content /></div>
      <footer class="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-line px-6 py-4 max-sm:flex-col-reverse max-sm:items-stretch">
        <button type="button" class="mk-btn-secondary" [disabled]="!dismissible() || busy()" (click)="cancel()" data-cancel>{{ cancelLabelKey() | translate }}</button>
        <ng-content select="[actions]" />
      </footer>
    </app-modal>
  `,
})
export class FormModal {
  readonly open = input(true);
  readonly titleKey = input.required<string>();
  readonly titleParams = input<Record<string, unknown>>({});
  readonly descriptionKey = input<string | null>(null);
  readonly descriptionParams = input<Record<string, unknown>>({});
  /** Material Symbols name: a rounded container in the brand colour at the left of the title (the metric-circle style). Optional; most modals have none. */
  readonly icon = input<string | null>(null);
  /** Adds an X at the right of the header that does the same as the footer button. Off by default: the footer button is the way out. */
  readonly closeButton = input(false);
  readonly size = input<'md' | 'lg' | 'wide' | 'xl' | 'max'>('lg');
  readonly dismissible = input(true);
  readonly guarded = input(false);
  // A process is running: fields read-only and the way out blocked until it ends.
  readonly busy = input(false);
  readonly cancelLabelKey = input('COMMON.CANCEL');
  // Prefijo de los `data-testid` del fondo y del panel (los de `app-modal`).
  readonly testId = input('form-modal');

  readonly closed = output<void>();

  protected readonly titleId = `form-modal-title-${nextId}`;
  protected readonly descriptionId = `form-modal-description-${nextId++}`;

  protected cancel(): void {
    if (this.dismissible() && !this.busy()) this.closed.emit();
  }
}
