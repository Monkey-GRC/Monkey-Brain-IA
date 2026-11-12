import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { SearchField } from '@shared/presentation/components/search-field/search-field';

/**
 * The bar above a table, one row: search (optional), filters and actions, aligned at the standard control height. The filters are `app-table-filter` projected
 * with `[filters]`; the actions (refresh, a button) with `[actions]`, pushed to the right. Without `searchPlaceholderKey` there is no search box (a list that the
 * server filters with no text search). The search is `app-search-field` (magnifier on the right). The query is the caller's: the toolbar only emits it.
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
    <div class="mb-4 flex flex-wrap items-center gap-3" role="group" [attr.aria-label]="ariaKey ? (ariaKey | translate) : null">
    @if (searchPlaceholderKey(); as key) {
      <app-search-field class="w-full max-w-sm" [placeholderKey]="key" [value]="query()" (valueChange)="queryChange.emit($event)" />
    }
    <ng-content select="[filters]" />
    <div class="ml-auto flex flex-wrap items-center gap-3 empty:hidden"><ng-content select="[actions]" /></div>
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
