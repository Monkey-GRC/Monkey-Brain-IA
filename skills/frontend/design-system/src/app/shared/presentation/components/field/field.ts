import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * A form field: label above, the control (projected), help text and error. The control keeps its own `id`; pass it in `forId` so the label points to it.
 * Link help and error from the control with `aria-describedby`: their ids are `<forId>-hint` and `<forId>-error`.
 *
 *   <app-field labelKey="…" forId="email" hintKey="…" [errorKey]="error()"> <input id="email" class="mk-input" …> </app-field>
 */
@Component({
  selector: 'app-field',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <label [attr.for]="forId()" class="mb-1.5 block text-xs font-medium text-ink-faint">{{ labelKey() | translate }}</label>
    <ng-content />
    @if (hintKey(); as hint) {
      <p [id]="forId() + '-hint'" class="mt-1.5 text-xs text-ink-muted">{{ hint | translate }}</p>
    }
    @if (errorKey(); as error) {
      <p [id]="forId() + '-error'" class="mt-1.5 text-xs text-bad" role="alert">{{ error | translate: errorParams() }}</p>
    }
  `,
})
export class Field {
  readonly labelKey = input.required<string>();
  readonly forId = input.required<string>();
  readonly hintKey = input<string | null>(null);
  readonly errorKey = input<string | null>(null);
  readonly errorParams = input<Record<string, unknown>>({});
}
