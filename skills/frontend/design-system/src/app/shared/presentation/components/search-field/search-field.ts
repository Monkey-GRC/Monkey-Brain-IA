import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { targetValue } from '@shared/presentation/utils/event-target';

/**
 * The search box of the product: an input of the system with the magnifier on the RIGHT, 12 px from the edge, and room in the input so the text never runs under it
 * (44 px of padding on that side; the browser's own «clear» cross is hidden). Every search in the product uses it (`app-table-toolbar` too). The query is the caller's.
 *
 *   <app-search-field placeholderKey="SERVICES.LIST.SEARCH_PLACEHOLDER" [value]="query()" (valueChange)="query.set($event)" />
 */
@Component({
  selector: 'app-search-field',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative block' },
  template: `
    <input
      type="search"
      data-search-input
      [id]="inputId()"
      [attr.aria-label]="(ariaLabelKey() ?? placeholderKey()) | translate"
      [value]="value()"
      [placeholder]="placeholderKey() | translate"
      (input)="valueChange.emit(targetValue($event))"
      class="mk-input pr-11 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
    />
    <span class="material-symbols-rounded pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[20px] text-ink-faint" aria-hidden="true">search</span>
  `,
})
export class SearchField {
  /** Translation key of the placeholder (and of the label for screen readers unless `ariaLabelKey` is given). */
  readonly placeholderKey = input.required<string>();
  readonly value = input('');
  readonly ariaLabelKey = input<string | null>(null);
  readonly inputId = input<string | null>(null);

  readonly valueChange = output<string>();

  protected readonly targetValue = targetValue;
}
