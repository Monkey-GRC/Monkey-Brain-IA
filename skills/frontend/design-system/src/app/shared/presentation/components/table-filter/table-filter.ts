import { ChangeDetectionStrategy, Component, booleanAttribute, input, output } from '@angular/core';
import { Select, SelectOption } from '@shared/presentation/components/select/select';

export type TableFilterOption = SelectOption;

/**
 * A filter of a table toolbar: `app-select` at the standard height with no label above it. Single mode: the name of the filter is the first option («Rol», the empty
 * value = «no filter») and the `aria-label`; emits the chosen value (`''` for none). With `multiple` the trigger shows the filter's name and how many are chosen, the options
 * carry a checkbox, and it emits the list (`valuesChange`; an empty list = no filter).
 *
 *   <app-table-filter labelKey="TEAM.FILTERS.ROLE" [options]="roles" [value]="role()" (valueChange)="setRole($event)" />
 *   <app-table-filter labelKey="…" [options]="statuses" multiple [values]="picked()" (valuesChange)="picked.set($event)" />
 */
@Component({
  selector: 'app-table-filter',
  imports: [Select],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-44' },
  template: `
    <app-select
      [options]="options()"
      [multiple]="multiple()"
      [value]="value()"
      [values]="values()"
      [emptyLabelKey]="multiple() ? null : labelKey()"
      [summaryKey]="multiple() ? labelKey() : null"
      [ariaLabelKey]="labelKey()"
      (valueChange)="valueChange.emit($event)"
      (valuesChange)="valuesChange.emit($event)"
    />
  `,
})
export class TableFilter {
  /** Translation key of the filter's name. */
  readonly labelKey = input.required<string>();
  readonly options = input.required<TableFilterOption[]>();
  readonly value = input('');
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly values = input<string[]>([]);

  readonly valueChange = output<string>();
  readonly valuesChange = output<string[]>();
}
