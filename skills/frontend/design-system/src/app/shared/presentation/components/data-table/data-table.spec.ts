import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { PageInfo } from './table-page';
import { StatusIndicator } from '../status-indicator/status-indicator';
import { DataTable, TableCell, TableColumn, TableStack } from './data-table';

interface Row { id: number; name: string; status: string }

@Component({
  imports: [DataTable, TableCell, StatusIndicator],
  template: `
    <app-data-table
      captionKey="TEST.CAPTION"
      [columns]="columns"
      [rows]="rows()"
      [rowKey]="byId"
      [page]="page()"
      [loading]="loading()"
      [clickable]="true"
      [focusable]="focusable()"
      [chevron]="chevron()"
      [selectable]="selectable()"
      [selected]="chosen()"
      [rowLabel]="labelOf"
      [groupBy]="groupBy()"
      [collapsible]="collapsible()"
      [compact]="compact()"
      [hideHeader]="hideHeader()"
      [stackBelow]="stackBelow()"
      (selectionChange)="selections.push($event)"
      (pageChange)="pages.push($event)"
      (pageSizeChange)="sizes.push($event)"
      (rowClick)="clicked.push($event.id)"
    >
      <ng-template appCell="status" let-row><app-status-indicator [tone]="row.status === 'ready' ? 'ok' : 'neutral'" labelKey="TEST.STATUS_LABEL" /></ng-template>
      <ng-template appCell="open" let-row><button type="button" data-inner (click)="inner.push(row.id)">Ir</button></ng-template>
    </app-data-table>
  `,
})
class Host {
  columns: TableColumn<Row>[] = [
    { key: 'name', headerKey: 'TEST.NAME', value: (r) => r.name },
    { key: 'status', headerKey: 'TEST.STATUS' },
    { key: 'open', headerKey: 'TEST.OPEN' },
  ];
  rows = signal<Row[]>([
    { id: 1, name: 'Acceso con MFA', status: 'ready' },
    { id: 2, name: 'Copias de seguridad', status: 'not_measured' },
  ]);
  page = signal<PageInfo | null>({ page: 2, pageSize: 25, total: 60, totalPages: 3 });
  loading = signal(false);
  pages: number[] = [];
  sizes: number[] = [];
  clicked: number[] = [];
  inner: number[] = [];
  chevron = signal(true);
  focusable = signal(true);
  selectable = signal(false);
  chosen = signal<ReadonlySet<string | number>>(new Set());
  selections: Set<string | number>[] = [];
  groupBy = signal<((r: Row) => string) | null>(null);
  collapsible = signal(false);
  compact = signal(false);
  hideHeader = signal(false);
  stackBelow = signal<TableStack>('lg');
  labelOf = (r: Row) => r.name;
  byId = (r: Row) => r.id;
}

describe('DataTable', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  const el = () => fixture.nativeElement as HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host], providers: [provideTranslateService()] });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the rows, using the cell template when there is one', () => {
    const rows = el().querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Acceso con MFA');
    expect(rows[0].querySelector('app-status-indicator')).not.toBeNull();
    expect(rows[1].querySelector('[data-tone="neutral"]')).not.toBeNull();
  });

  it('has a hidden caption and column headers for screen readers', () => {
    expect(el().querySelector('caption')!.textContent).toContain('TEST.CAPTION');
    expect(el().querySelectorAll('th[scope="col"]').length).toBe(4); // three columns and the chevron one (hidden text)
  });

  it('shows where you are and goes to the previous and next page', () => {
    expect(el().textContent).toContain('COMMON.TABLE.SHOWING');
    el().querySelector<HTMLButtonElement>('[data-prev]')!.click();
    el().querySelector<HTMLButtonElement>('[data-next]')!.click();
    expect(host.pages).toEqual([1, 3]);
  });

  it('disables the edges of the pagination', () => {
    host.page.set({ page: 1, pageSize: 25, total: 60, totalPages: 3 });
    fixture.detectChanges();
    expect(el().querySelector<HTMLButtonElement>('[data-prev]')!.disabled).toBeTrue();
    host.page.set({ page: 3, pageSize: 25, total: 60, totalPages: 3 });
    fixture.detectChanges();
    expect(el().querySelector<HTMLButtonElement>('[data-next]')!.disabled).toBeTrue();
  });

  it('emits the new page size', () => {
    const select = el().querySelector('select') as HTMLSelectElement;
    select.value = '50';
    select.dispatchEvent(new Event('change'));
    expect(host.sizes).toEqual([50]);
  });

  it('opens a row with click and with the keyboard', () => {
    const row = el().querySelectorAll<HTMLElement>('tbody tr')[1];
    expect(row.getAttribute('tabindex')).toBe('0');
    row.click();
    row.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(host.clicked).toEqual([2, 2]);
  });

  it('opens a row with Space without scrolling the page, and not from a control inside it', () => {
    const row = el().querySelectorAll<HTMLElement>('tbody tr')[0];
    const space = new KeyboardEvent('keydown', { key: ' ', cancelable: true });
    row.dispatchEvent(space);
    expect(space.defaultPrevented).toBeTrue();
    expect(host.clicked).toEqual([1]);
    const inner = row.querySelector<HTMLElement>('[data-inner]')!;
    const innerSpace = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    inner.dispatchEvent(innerSpace);
    expect(innerSpace.defaultPrevented).toBeFalse();
    expect(host.clicked).toEqual([1]);
  });

  it('names the clickable row from rowLabel and describes it as «open detail»', () => {
    const row = el().querySelectorAll<HTMLElement>('tbody tr')[0];
    expect(row.getAttribute('aria-label')).toBe('Acceso con MFA');
    const hint = el().querySelector('#' + row.getAttribute('aria-describedby'))!;
    expect(hint.textContent).toContain('COMMON.TABLE.OPEN_DETAIL');
    expect(hint.classList).toContain('sr-only');
    expect(row.getAttribute('role')).toBeNull();
    expect(el().querySelectorAll('[id^="data-table-open-"]').length).toBe(1);
  });

  it('with focusable off the row opens with the mouse but has no Tab stop, name or hint', () => {
    host.focusable.set(false);
    fixture.detectChanges();
    const row = el().querySelectorAll<HTMLElement>('tbody tr')[0];
    expect(row.hasAttribute('tabindex')).toBeFalse();
    expect(row.hasAttribute('aria-describedby')).toBeFalse();
    expect(el().querySelector('[id^="data-table-open-"]')).toBeNull();
    row.click();
    expect(host.clicked).toEqual([1]);
  });

  it('shows the empty state when there are no rows', () => {
    host.rows.set([]);
    fixture.detectChanges();
    expect(el().querySelector('app-empty-state')).not.toBeNull();
    expect(el().textContent).toContain('COMMON.TABLE.EMPTY_TITLE');
  });

  it('shows a loading row instead of the rows, and marks the table busy', () => {
    host.loading.set(true);
    fixture.detectChanges();
    expect(el().querySelector('table')!.getAttribute('aria-busy')).toBe('true');
    expect(el().querySelectorAll('tbody tr').length).toBe(1);
    expect(el().querySelector('app-empty-state')).toBeNull();
  });

  it('has no pagination bar without page info', () => {
    host.page.set(null);
    fixture.detectChanges();
    expect(el().querySelector('nav')).toBeNull();
  });

  it('puts a chevron at the end of every clickable row, and none when it is turned off', () => {
    expect(el().querySelectorAll('tbody [data-row-chevron]').length).toBe(2);
    expect(el().querySelector('[data-row-chevron]')!.getAttribute('aria-hidden')).toBe('true');
    host.chevron.set(false);
    fixture.detectChanges();
    expect(el().querySelector('[data-row-chevron]')).toBeNull();
  });

  it('does not open the row when a control inside it is used', () => {
    const inner = el().querySelectorAll<HTMLButtonElement>('[data-inner]')[0];
    inner.click();
    inner.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(host.inner).toEqual([1]);
    expect(host.clicked).toEqual([]);
  });

  it('highlights the whole row on hover, by token', () => {
    expect(el().querySelector('tbody tr')!.className).toContain('hover:bg-tint');
  });

  it('has no checkboxes unless it is selectable', () => {
    expect(el().querySelector('input[type="checkbox"]')).toBeNull();
  });

  it('selects rows and the whole page with checkboxes, and says which is which', () => {
    host.selectable.set(true);
    fixture.detectChanges();
    const rows = el().querySelectorAll<HTMLInputElement>('[data-select-row]');
    expect(rows.length).toBe(2);
    expect(rows[0].getAttribute('aria-label')).toContain('COMMON.TABLE.SELECT_ROW');
    rows[1].click();
    expect([...host.selections[0]]).toEqual([2]);
    el().querySelector<HTMLInputElement>('[data-select-all]')!.click();
    expect([...host.selections[1]].sort()).toEqual([1, 2]);

    host.chosen.set(new Set([1, 2]));
    fixture.detectChanges();
    expect(el().querySelector<HTMLInputElement>('[data-select-all]')!.checked).toBeTrue();
    el().querySelector<HTMLInputElement>('[data-select-all]')!.click();
    expect([...host.selections[2]]).toEqual([]);
    host.chosen.set(new Set([1]));
    fixture.detectChanges();
    expect(el().querySelector<HTMLInputElement>('[data-select-all]')!.indeterminate).toBeTrue();
    expect(el().querySelector('tbody tr')!.hasAttribute('data-selected')).toBeTrue();
  });

  it('groups the rows under section headers with their count, keeping the order received', () => {
    host.rows.set([
      { id: 1, name: 'Uno', status: 'ready' },
      { id: 2, name: 'Dos', status: 'ready' },
      { id: 3, name: 'Tres', status: 'ready' },
    ]);
    host.groupBy.set((r: Row) => (r.id === 2 ? 'b' : 'a'));
    fixture.detectChanges();
    const headers = el().querySelectorAll('[data-group-header]');
    expect(Array.from(headers).map((h) => h.getAttribute('data-group'))).toEqual(['a', 'b']);
    expect(headers[0].querySelector('[data-group-count]')!.textContent).toContain('COMMON.TABLE.GROUP_COUNT');
    expect(el().querySelectorAll('tbody tr').length).toBe(5);
    expect(headers[0].querySelector('[data-group-toggle]')).toBeNull();
  });

  it('the group header is a full-width cell, not a row, so its colspan applies', () => {
    host.groupBy.set(() => 'a');
    fixture.detectChanges();
    const th = el().querySelector('[data-group-header] th[scope="rowgroup"]')!;
    expect(th.getAttribute('colspan')).toBe(String(el().querySelectorAll('thead th[scope="col"]').length));
    expect(th.className).not.toContain('table-row');
    expect(th.className).toContain('table-cell');
  });

  it('a collapsible group folds its rows from a button that says whether it is open', () => {
    host.groupBy.set(() => 'a');
    host.collapsible.set(true);
    fixture.detectChanges();
    const toggle = () => el().querySelector<HTMLButtonElement>('[data-group-toggle]')!;
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    expect(el().querySelectorAll('tbody tr').length).toBe(3);
    toggle().click();
    fixture.detectChanges();
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(el().querySelectorAll('tbody tr').length).toBe(1);
    toggle().click();
    fixture.detectChanges();
    expect(el().querySelectorAll('tbody tr').length).toBe(3);
  });

  it('the compact variant drops the minimum width and the tall rows, for lists inside a side panel', () => {
    const table = () => el().querySelector('table')!;
    host.stackBelow.set('never');
    fixture.detectChanges();
    expect(table().className).toContain('min-w-[40rem]');
    expect(el().querySelector('tbody td')!.className).toContain('h-14');
    host.compact.set(true);
    fixture.detectChanges();
    expect(table().className).not.toContain('min-w-[40rem]');
    expect(el().querySelector('tbody td')!.className).not.toContain('h-14');
    expect(el().querySelectorAll('tbody tr').length).toBe(2);
  });

  it('stacks into cards below lg by default, each cell labelled with its column, so nobody scrolls sideways', () => {
    const table = el().querySelector('table')!;
    expect(table.className).toContain('lg:table');
    expect(table.className).not.toContain('min-w-');
    expect(el().querySelector('thead')!.className).toContain('max-lg:sr-only');
    expect(el().querySelector('tbody tr')!.className).toContain('lg:table-row');
    const cells = Array.from(el().querySelectorAll('tbody tr:first-child td'));
    expect(cells.map((c) => c.getAttribute('data-label'))).toEqual(['TEST.NAME', 'TEST.STATUS', 'TEST.OPEN', null]);
  });

  it('stackBelow 2xl stacks until 2xl, and never keeps the plain table with no labels', () => {
    host.stackBelow.set('2xl');
    fixture.detectChanges();
    expect(el().querySelector('table')!.className).toContain('stack-2xl');
    expect(el().querySelector('table')!.className).toContain('2xl:table');
    host.stackBelow.set('never');
    fixture.detectChanges();
    expect(el().querySelector('table')!.className).toContain('min-w-[40rem]');
    expect(el().querySelector('tbody td')!.hasAttribute('data-label')).toBe(false);
  });

  it('the compact variant is never stacked', () => {
    host.compact.set(true);
    fixture.detectChanges();
    expect(el().querySelector('table')!.className).not.toContain('lg:table');
    expect(el().querySelector('tbody td')!.hasAttribute('data-label')).toBe(false);
  });

  it('can keep the header only for screen readers (a list with no column titles)', () => {
    host.hideHeader.set(true);
    fixture.detectChanges();
    expect(el().querySelector('thead')!.className).toContain('sr-only');
    expect(el().querySelectorAll('thead th').length).toBeGreaterThan(0);
  });
});
