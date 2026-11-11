import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { pageWindow } from '../data-table/table-page';
import { Pagination } from './pagination';

describe('pageWindow', () => {
  it('shows every page when there are few', () => {
    expect(pageWindow(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });
  it('keeps the first, the last and the neighbours, with gaps', () => {
    expect(pageWindow(6, 12)).toEqual([1, null, 5, 6, 7, null, 12]);
  });
  it('does not leave a gap of a single page', () => {
    expect(pageWindow(1, 12)).toEqual([1, 2, 3, 4, null, 12]);
    expect(pageWindow(12, 12)).toEqual([1, null, 9, 10, 11, 12]);
  });
});

describe('Pagination', () => {
  let fixture: ComponentFixture<Pagination>;
  const el = () => fixture.nativeElement as HTMLElement;
  const numbers = () => Array.from(el().querySelectorAll<HTMLButtonElement>('[data-page-number]'));
  const pages: number[] = [];
  const sizes: number[] = [];

  function setup(page: number, total = 31, pageSize = 10): void {
    pages.length = 0;
    sizes.length = 0;
    TestBed.configureTestingModule({ imports: [Pagination], providers: [provideTranslateService()] });
    fixture = TestBed.createComponent(Pagination);
    fixture.componentRef.setInput('page', { page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
    fixture.componentInstance.pageChange.subscribe((n) => pages.push(n));
    fixture.componentInstance.pageSizeChange.subscribe((n) => sizes.push(n));
    fixture.detectChanges();
  }

  it('is a labelled navigation with the range and a button per page', () => {
    setup(1);
    expect(el().querySelector('nav')!.getAttribute('aria-label')).toBe('COMMON.TABLE.PAGINATION');
    expect(el().querySelector('[data-showing]')!.textContent).toContain('COMMON.TABLE.SHOWING');
    expect(numbers().length).toBe(4);
  });

  it('marks the current page and labels every number', () => {
    setup(2);
    expect(numbers().map((b) => b.getAttribute('aria-current'))).toEqual([null, 'page', null, null]);
    expect(numbers()[0].getAttribute('aria-label')).toBe('COMMON.TABLE.GO_TO_PAGE');
  });

  it('goes to a number, the previous and the next page', () => {
    setup(2);
    numbers()[3].click();
    el().querySelector<HTMLButtonElement>('[data-prev]')!.click();
    el().querySelector<HTMLButtonElement>('[data-next]')!.click();
    expect(pages).toEqual([4, 1, 3]);
  });

  it('disables previous on the first page and emits nothing from it', () => {
    setup(1);
    const prev = el().querySelector<HTMLButtonElement>('[data-prev]')!;
    expect(prev.disabled).toBeTrue();
    prev.click();
    expect(pages).toEqual([]);
  });

  it('disables next on the last page', () => {
    setup(4);
    expect(el().querySelector<HTMLButtonElement>('[data-next]')!.disabled).toBeTrue();
  });

  it('does not emit for the page that is already open', () => {
    setup(2);
    numbers()[1].click();
    expect(pages).toEqual([]);
  });

  it('emits the new page size, and hides the selector when there are no sizes', () => {
    setup(1);
    const select = el().querySelector('select') as HTMLSelectElement;
    select.value = '25';
    select.dispatchEvent(new Event('change'));
    expect(sizes).toEqual([25]);
    fixture.componentRef.setInput('pageSizes', []);
    fixture.detectChanges();
    expect(el().querySelector('select')).toBeNull();
  });
});
