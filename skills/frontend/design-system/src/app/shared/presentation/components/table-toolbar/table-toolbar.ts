import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { SearchField } from '@shared/presentation/components/search-field/search-field';

/**
 * The bar above a table, at the standard control height. With a search (MD-499, the rule of components.md: the search on top, full width), the first row is the
 * search filling the width with the actions at its right, and the filters go in the row below. Without `searchPlaceholderKey` there is no search box (a list that
 * the server filters with no text search) and the filters and the actions share one row, the actions pushed to the right. The filters are `app-table-filter` or
 * `app-option-chips` projected with `[filters]`; the actions (refresh, a button) with `[actions]`. The search is `app-search-field` (magnifier on the right). The
 * query is the caller's: the toolbar only emits it.
 *
 *   <app-table-toolbar searchPlaceholderKey="SERVICES.LIST.SEARCH_PLACEHOLDER" [query]="query()" (queryChange)="query.set($event)" ariaLabelKey="…">
 *     <app-table-filter filters labelKey="…" [options]="…" (valueChange)="…" />
 *     <button actions type="button" class="mk-btn-secondary">…</button>
 *   </app-table-toolbar>
 */
@Component({
  selector: 'app-table-toolbar',
  imports: [TranslatePipe, SearchField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @let ariaKey = ariaLabelKey();
    <!-- One wrapping row: search, actions and filters; with a search the filters take a row of their own below (basis-full), without it they come first. -->
    <div class="mb-4 flex flex-wrap items-center gap-3" role="group" [attr.aria-label]="ariaKey ? (ariaKey | translate) : null">
    @if (searchPlaceholderKey(); as key) {
      <app-search-field class="min-w-0 flex-1 basis-72" [placeholderKey]="key" [value]="query()" (valueChange)="queryChange.emit($event)" data-toolbar-search />
    }
    <div class="ml-auto flex flex-wrap items-center gap-3 empty:hidden" data-toolbar-actions><ng-content select="[actions]" /></div>
    <div class="flex flex-wrap items-center gap-3 empty:hidden" [class]="searchPlaceholderKey() ? 'basis-full' : 'order-first'" data-toolbar-filters><ng-content select="[filters]" /></div>
    </div>
  `,
})
export class TableToolbar {
  /** Translation key of the search box (placeholder and label). Without it there is no search. */
  readonly searchPlaceholderKey = input<string | null>(null);
  readonly query = input('');
  /** Translation key that names the group of controls for screen readers. */
  readonly ariaLabelKey = input<string | null>(null);

  readonly queryChange = output<string>();
}
