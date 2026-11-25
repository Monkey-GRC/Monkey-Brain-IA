import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Select, SelectOption } from '@shared/presentation/components/select/select';
import { PageInfo } from '@shared/domain/models/page-info.model';
import { canGoBack, canGoForward, pageWindow, visibleRange } from '@shared/presentation/components/data-table/table-page';

// Pagination bar: «Showing 1–10 of 31», rows per page, previous, page numbers and next. It fetches nothing: it receives the `PageInfo` and says which page
// or size was asked for; the owner slices the list (client side) or asks the server. Every control is a native button or select, so Tab, Enter and Space work;
// the current page carries `aria-current="page"` and the position is announced politely. Texts are `COMMON.TABLE.*` keys.
//   <app-pagination [page]="page()" [pageSizes]="[10, 25, 50]" (pageChange)="goTo($event)" (pageSizeChange)="resize($event)" />
@Component({
  selector: 'app-pagination',
  imports: [TranslatePipe, Select],
  templateUrl: './pagination.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Pagination {
  readonly page = input.required<PageInfo>();
  // An empty list hides the rows-per-page selector.
  readonly pageSizes = input<number[]>([10, 25, 50]);

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  protected readonly range = computed(() => visibleRange(this.page()));
  protected readonly pages = computed(() => pageWindow(this.page().page, this.page().totalPages));
  protected readonly hasPrevious = computed(() => canGoBack(this.page()));
  protected readonly hasNext = computed(() => canGoForward(this.page()));

  protected go(target: number): void {
    const p = this.page();
    if (target >= 1 && target <= p.totalPages && target !== p.page) this.pageChange.emit(target);
  }

  protected readonly sizeOptions = computed<SelectOption[]>(() => this.pageSizes().map((n) => ({ value: String(n), label: String(n) })));

  protected resize(value: string): void {
    this.pageSizeChange.emit(Number(value));
  }
}
