import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Modal } from '@shared/presentation/components/modal/modal';

let nextId = 0;

/**
 * Centered modal to create, edit or see something: title, one short line saying what it is for, a body that scrolls and a footer that stays fixed. It is built on `app-modal`
 * (role=dialog, focus trapped and returned, Esc, backdrop, entrance animation) and replaces the side drawer for forms and for the detail of a person or a group.
 * There is no X: the way out is the **Cancel** button of the footer, always first, next to the main action(s) projected with `actions`.
 *
 *   <app-form-modal titleKey="…" descriptionKey="…" [dismissible]="!saving()" [guarded]="dirty()" (closed)="close()">
 *     <form id="my-form" (submit)="$event.preventDefault(); save()"> …fields… </form>
 *     <button actions type="submit" form="my-form" class="mk-btn">Save</button>
 *   </app-form-modal>
 *
 * `dismissible` false (a call in progress) blocks Esc, the backdrop and Cancel. `guarded` true (a form with unsent data) blocks only Esc and the backdrop; Cancel still closes.
 * For a read-only detail use `cancelLabelKey="COMMON.CLOSE"`. The primary action is a `mk-btn` (one per modal); a destructive one is `mk-btn-danger`; the rest, `mk-btn-secondary`.
 * The description is linked with `aria-describedby`; the body is a normal block (use `app-field` and `mk-input` inside).
 */
@Component({
  selector: 'app-form-modal',
  imports: [Modal, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal
      [open]="open()"
      [size]="size()"
      [padded]="false"
      [labelledBy]="titleId"
      [describedBy]="descriptionKey() ? descriptionId : null"
      [dismissible]="dismissible() && !guarded()"
      [testId]="testId()"
      (dismissed)="closed.emit()"
    >
      <header class="shrink-0 border-b border-line px-6 pb-4 pt-5">
        <h2 [id]="titleId" class="text-lg font-semibold text-ink">{{ titleKey() | translate: titleParams() }}</h2>
        @if (descriptionKey(); as description) {
          <p [id]="descriptionId" class="mt-1 text-sm text-ink-muted">{{ description | translate: descriptionParams() }}</p>
        }
      </header>
      <div class="min-h-0 flex-1 overflow-y-auto px-6 py-5 text-sm text-ink" data-form-modal-body><ng-content /></div>
      <footer class="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-line px-6 py-4 max-sm:flex-col-reverse max-sm:items-stretch">
        <button type="button" class="mk-btn-secondary" [disabled]="!dismissible()" (click)="cancel()" data-cancel>{{ cancelLabelKey() | translate }}</button>
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
  readonly size = input<'md' | 'lg' | 'wide' | 'xl'>('lg');
  readonly dismissible = input(true);
  readonly guarded = input(false);
  readonly cancelLabelKey = input('COMMON.CANCEL');
  // Prefijo de los `data-testid` del fondo y del panel (los de `app-modal`).
  readonly testId = input('form-modal');

  readonly closed = output<void>();

  protected readonly titleId = `form-modal-title-${nextId}`;
  protected readonly descriptionId = `form-modal-description-${nextId++}`;

  protected cancel(): void {
    if (this.dismissible()) this.closed.emit();
  }
}
