import { Signal, computed, signal } from '@angular/core';
import type { PageInfo } from '@shared/domain/models/page-info.model';

const CLIENT_PAGE_SIZE = 10;

/**
 * A list that already arrived whole and is shown in an `app-data-table` with a search box and pages (MD-499: the long lists of a detail, in both apps).
 * `items` is a signal (a `computed` over the detail, or an `input`), so a reload shows at once. The search, the page and its size are signals; `filtered`, `info`,
 * `rows` and `searching` are `computed`: they recalculate only when the list, the search, the page or what `matches` reads change (not on every render). `matches`
 * decides what passes and may read other signals (e.g. the one of an `option-chips` filter); they are tracked too. The page is capped to the total that is left.
 *
 *   private readonly causes = computed(() => this.detail()?.causes ?? []);
 *   readonly causeList = new ClientList(this.causes, (c, q) => includesText(q, c.code, c.name));
 *   <app-search-field [value]="causeList.query()" (valueChange)="causeList.search($event)" />
 *   <app-data-table [rows]="causeList.rows()" [page]="causeList.info()" (pageChange)="causeList.goTo($event)" (pageSizeChange)="causeList.resize($event)" … />
 */
export class ClientList<T> {
  readonly query = signal('');
  readonly page = signal(1);
  readonly pageSize = signal(CLIENT_PAGE_SIZE);

  /** Everything that passes the search and the filters. */
  readonly filtered: Signal<T[]>;
  readonly info: Signal<PageInfo>;
  /** The rows of the current page. */
  readonly rows: Signal<T[]>;
  /** Is there a text searched? (The view's own filters add to this where it is used.) */
  readonly searching = computed(() => this.query().trim() !== '');

  constructor(items: Signal<readonly T[]>, matches: (item: T, query: string) => boolean) {
    this.filtered = computed(() => {
      const q = this.query().trim().toLocaleLowerCase();
      return items().filter((item) => matches(item, q));
    });
    this.info = computed(() => {
      const total = this.filtered().length;
      const pageSize = this.pageSize();
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      return { page: Math.min(this.page(), totalPages), pageSize, total, totalPages };
    });
    this.rows = computed(() => {
      const { page, pageSize } = this.info();
      return this.filtered().slice((page - 1) * pageSize, page * pageSize);
    });
  }

  search(query: string): void {
    this.query.set(query);
    this.page.set(1);
  }

  goTo(page: number): void {
    this.page.set(page);
  }

  resize(size: number): void {
    this.pageSize.set(size);
    this.page.set(1);
  }

  /** Back to the first page (a filter changed). */
  restart(): void {
    this.page.set(1);
  }

  /** Empty search and first page (another item was opened). */
  reset(): void {
    this.query.set('');
    this.page.set(1);
  }
}

/** Does the text (in lower case) appear in any of these fields? An empty text matches everything. */
export function includesText(query: string, ...fields: (string | number | null | undefined)[]): boolean {
  return !query || fields.some((f) => f !== null && f !== undefined && String(f).toLocaleLowerCase().includes(query));
}
