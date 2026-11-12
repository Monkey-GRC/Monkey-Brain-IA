import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * The bar above a table, one row: search (optional), filters and actions, aligned at the standard control height. The filters are `app-table-filter` projected
 * with `[filters]`; the actions (refresh, a button) with `[actions]`, pushed to the right. Without `searchPlaceholderKey` there is no search box (a list that the
 * server filters with no text search). The query is the caller's: the toolbar only emits it.
 *
 *   <app-table-toolbar searchPlaceholderKey="SERVICES.LIST.SEARCH_PLACEHOLDER" [query]="query()" (queryChange)="query.set($event)" ariaLabelKey="…">
 *     <app-table-filter filters labelKey="…" [options]="…" (valueChange)="…" />
 *     <button actions type="button" class="mk-btn-secondary">…</button>
 *   </app-table-toolbar>
 */
@Component({
  selector: 'app-table-toolbar',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @let ariaKey = ariaLabelKey();
    <div class="mb-4 flex flex-wrap items-center gap-3" role="group" [attr.aria-label]="ariaKey ? (ariaKey | translate) : null">
    @if (searchPlaceholderKey(); as key) {
      <label class="relative block w-full max-w-sm">
        <span class="sr-only">{{ key | translate }}</span>
        <span class="material-symbols-rounded pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-ink-faint" aria-hidden="true">search</span>
        <input type="search" data-table-search [value]="query()" (input)="onInput($event)" [placeholder]="key | translate" class="mk-input pl-10" />
      </label>
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

  protected onInput(event: Event): void {
    this.queryChange.emit((event.target as HTMLInputElement).value);
  }
}
