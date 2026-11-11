import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

export interface TableFilterOption {
  value: string;
  /** Translation key of the option. */
  labelKey?: string;
  /** Text that is already data (a group name); used when there is no `labelKey`. */
  label?: string;
}

/**
 * A filter of a table toolbar: the system select (standard height) with no label above it. The name of the filter is the first option («Rol») and the `aria-label`;
 * that option has the empty value and means «no filter». Emits the chosen value (`''` for none).
 *
 *   <app-table-filter labelKey="TEAM.FILTERS.ROLE" [options]="roles" [value]="role()" (valueChange)="setRole($event)" />
 */
@Component({
  selector: 'app-table-filter',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <select class="mk-input w-auto min-w-36" [attr.aria-label]="labelKey() | translate" (change)="onChange($event)">
      <option value="" [selected]="!value()">{{ labelKey() | translate }}</option>
      @for (o of options(); track o.value) {
        <option [value]="o.value" [selected]="value() === o.value">{{ o.labelKey ? (o.labelKey | translate) : o.label }}</option>
      }
    </select>
  `,
})
export class TableFilter {
  /** Translation key of the filter's name. */
  readonly labelKey = input.required<string>();
  readonly options = input.required<TableFilterOption[]>();
  readonly value = input('');

  readonly valueChange = output<string>();

  protected onChange(event: Event): void {
    this.valueChange.emit((event.target as HTMLSelectElement).value);
  }
}
