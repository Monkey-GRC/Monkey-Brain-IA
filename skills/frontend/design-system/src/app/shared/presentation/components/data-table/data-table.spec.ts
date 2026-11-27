import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { PageInfo } from '@shared/domain/models/page-info.model';
import { StatusIndicator } from '../status-indicator/status-indicator';
import { pickOption } from '../select/select.testing';
import { SLOW_LOAD_MS, SkeletonRegion } from '../skeleton/skeleton';
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
      [loadingRows]="loadingRows()"
      [clickable]="clickable()"
      [focusable]="focusable()"
      [chevron]="chevron()"
      [selectable]="selectable()"
      [selected]="chosen()"
      [rowLabel]="labelOf"
      [groupBy]="groupBy()"
      [collapsible]="collapsible()"
      [compact]="compact()"
      [hideHeader]="hideHeader()"
      [alignTop]="alignTop()"
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
    { key: 'status', headerKey: 'TEST.STATUS', align: 'center', skeleton: 'badge', class: 'w-40' },
    { key: 'open', headerKey: 'TEST.OPEN', align: 'right', skeleton: 'actions' },
  ];
  rows = signal<Row[]>([
    { id: 1, name: 'Acceso con MFA', status: 'ready' },
    { id: 2, name: 'Copias de seguridad', status: 'not_measured' },
  ]);
  page = signal<PageInfo | null>({ page: 2, pageSize: 25, total: 60, totalPages: 3 });
  loading = signal(false);
  loadingRows = signal(5);
  pages: number[] = [];
  sizes: number[] = [];
  clicked: number[] = [];
  inner: number[] = [];
  chevron = signal(true);
  clickable = signal(true);
  focusable = signal(true);
  selectable = signal(false);
  chosen = signal<ReadonlySet<string | number>>(new Set());
  selections: Set<string | number>[] = [];
  groupBy = signal<((r: Row) => string | null) | null>(null);
  collapsible = signal(false);
  compact = signal(false);
  hideHeader = signal(false);
  alignTop = signal(false);
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
    pickOption(el(), 'app-pagination app-select', '50', () => fixture.detectChanges());
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

  it('shows skeleton rows instead of the rows, and marks the table busy', () => {
    host.loading.set(true);
    fixture.detectChanges();
    expect(el().querySelector('table')!.getAttribute('aria-busy')).toBe('true');
    expect(el().querySelectorAll('tbody [data-skeleton-row]').length).toBe(5);
    expect(el().querySelectorAll('tbody [data-skeleton-row][aria-hidden="true"]').length).toBe(5);
    expect(el().querySelector('tbody [role="status"]')!.textContent).toContain('COMMON.LOADING');
    expect(el().textContent).not.toContain('Acceso con MFA');
    expect(el().querySelector('app-empty-state')).toBeNull();
  });

  it('draws as many skeleton rows as loadingRows says', () => {
    host.loading.set(true);
    host.loadingRows.set(3);
    fixture.detectChanges();
    expect(el().querySelectorAll('[data-skeleton-row]').length).toBe(3);
  });

  it('keeps the real header and gives each skeleton cell the width class and alignment of its column', () => {
    const real = Array.from(el().querySelectorAll('thead th')).map((h) => h.textContent!.trim());
    host.loading.set(true);
    fixture.detectChanges();
    expect(Array.from(el().querySelectorAll('thead th')).map((h) => h.textContent!.trim())).toEqual(real);
    const cells = el().querySelectorAll<HTMLElement>('[data-skeleton-row]')[0].querySelectorAll<HTMLElement>('td');
    // 3 columns + the chevron of a clickable table, the same as a real row.
    expect(cells.length).toBe(4);
    expect(cells[1].classList).toContain('w-40');
    expect(cells[1].className).toContain('text-center');
    expect(cells[2].className).toContain('text-right');
  });

  it('draws each cell according to the column kind: text, badge, actions', () => {
    host.loading.set(true);
    fixture.detectChanges();
    const cells = el().querySelectorAll<HTMLElement>('[data-skeleton-row]')[0].querySelectorAll<HTMLElement>('td');
    expect(cells[0].querySelector('[data-shape="line"]')).not.toBeNull();
    expect(cells[1].querySelector('[data-shape="badge"]')).not.toBeNull();
    expect(cells[2].querySelector('[data-shape="block"]')).not.toBeNull();
  });

  it('draws the full shape of a title with its caption, two badges and a progress cell (MD-499)', () => {
    const fixture2 = TestBed.createComponent(DataTable<Row>);
    fixture2.componentRef.setInput('captionKey', 'TEST.CAPTION');
    fixture2.componentRef.setInput('columns', [
      { key: 'a', headerKey: 'TEST.NAME', skeleton: 'lines' },
      { key: 'b', headerKey: 'TEST.NAME', skeleton: 'badges' },
      { key: 'c', headerKey: 'TEST.NAME', skeleton: 'progress' },
    ] as TableColumn<Row>[]);
    fixture2.componentRef.setInput('rows', []);
    fixture2.componentRef.setInput('rowKey', (r: Row) => r.id);
    fixture2.componentRef.setInput('loading', true);
    fixture2.detectChanges();
    const cells = (fixture2.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('[data-skeleton-row]')[0].querySelectorAll<HTMLElement>('td');
    expect(cells[0].querySelectorAll('app-skeleton').length).toBe(2);
    expect(cells[1].querySelectorAll('[data-shape="badge"]').length).toBe(2);
    expect(cells[2].querySelectorAll('app-skeleton').length).toBe(3);
  });

  it('draws a person cell with an avatar circle', () => {
    const fixture2 = TestBed.createComponent(DataTable<Row>);
    fixture2.componentRef.setInput('captionKey', 'TEST.CAPTION');
    fixture2.componentRef.setInput('columns', [{ key: 'who', headerKey: 'TEST.NAME', skeleton: 'person' }] as TableColumn<Row>[]);
    fixture2.componentRef.setInput('rows', []);
    fixture2.componentRef.setInput('rowKey', (r: Row) => r.id);
    fixture2.componentRef.setInput('loading', true);
    fixture2.detectChanges();
    const cell = (fixture2.nativeElement as HTMLElement).querySelector('[data-skeleton-row] td')!;
    expect(cell.querySelector('[data-shape="circle"]')).not.toBeNull();
    expect(cell.querySelectorAll('[data-shape="line"] [data-skeleton-block]').length).toBe(2);
  });

  it('leaves no skeleton once the data arrives', () => {
    host.loading.set(true);
    fixture.detectChanges();
    host.loading.set(false);
    fixture.detectChanges();
    expect(el().querySelector('[data-skeleton-row]')).toBeNull();
    expect(el().querySelector('table')!.getAttribute('aria-busy')).toBe('false');
    expect(el().querySelectorAll('tbody tr').length).toBe(2);
  });

  it('has no pagination bar without page info', () => {
    host.page.set(null);
    fixture.detectChanges();
    expect(el().querySelector('nav')).toBeNull();
  });

  it('has no pagination bar when there are no results: the empty state says it, not «Showing 0–0 of 0»', () => {
    host.page.set({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
    fixture.detectChanges();
    expect(el().querySelector('app-pagination')).toBeNull();
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

  it('highlights the whole row on hover, by token, only when the row is clickable', () => {
    const row = el().querySelector('tbody tr')!;
    expect(row.className).toContain('data-clickable:hover:bg-tint');
    expect(row.hasAttribute('data-clickable')).toBe(true);
  });

  it('does not mark the row as hoverable when the table is not clickable', () => {
    host.clickable.set(false);
    fixture.detectChanges();
    expect(el().querySelector('tbody tr')!.hasAttribute('data-clickable')).toBe(false);
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

  it('draws no group rows when every row is in the same group or has no group (null key): the plain table, no «— · 100» row', () => {
    host.groupBy.set(() => 'a');
    fixture.detectChanges();
    expect(el().querySelector('[data-group-header]')).toBeNull();
    expect(el().querySelectorAll('tbody tr').length).toBe(2);
    host.groupBy.set(() => null);
    fixture.detectChanges();
    expect(el().querySelector('[data-group-header]')).toBeNull();
    host.groupBy.set((r: Row) => (r.id === 2 ? 'b' : null));
    fixture.detectChanges();
    expect(Array.from(el().querySelectorAll('[data-group-header]')).map((h) => h.getAttribute('data-group'))).toEqual(['', 'b']);
  });

  it('the group header is a full-width cell, not a row, so its colspan applies', () => {
    host.groupBy.set((r: Row) => (r.id === 2 ? 'b' : 'a'));
    fixture.detectChanges();
    const th = el().querySelector('[data-group-header] th[scope="rowgroup"]')!;
    expect(th.getAttribute('colspan')).toBe(String(el().querySelectorAll('thead th[scope="col"]').length));
    expect(th.className).not.toContain('table-row');
    expect(th.className).toContain('table-cell');
  });

  it('a collapsible group folds its rows from a button that says whether it is open', () => {
    host.groupBy.set((r: Row) => (r.id === 2 ? 'b' : 'a'));
    host.collapsible.set(true);
    fixture.detectChanges();
    const toggle = () => el().querySelector<HTMLButtonElement>('[data-group-toggle]')!;
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    expect(el().querySelectorAll('tbody tr').length).toBe(4);
    toggle().click();
    fixture.detectChanges();
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(el().querySelectorAll('tbody tr').length).toBe(3);
    toggle().click();
    fixture.detectChanges();
    expect(el().querySelectorAll('tbody tr').length).toBe(4);
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

  it('the compact variant drops the page bar while everything fits on the smallest page, and keeps it once the list is longer', () => {
    host.compact.set(true);
    host.page.set({ page: 1, pageSize: 10, total: 3, totalPages: 1 });
    fixture.detectChanges();
    expect(el().querySelector('app-pagination')).toBeNull();
    host.page.set({ page: 1, pageSize: 10, total: 11, totalPages: 2 });
    fixture.detectChanges();
    expect(el().querySelector('app-pagination')).not.toBeNull();
    host.compact.set(false);
    host.page.set({ page: 1, pageSize: 10, total: 3, totalPages: 1 });
    fixture.detectChanges();
    expect(el().querySelector('app-pagination')).not.toBeNull();
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

  it('centres the cells by default and, with alignTop, starts them at the top 16 px from the edge', () => {
    const cell = () => el().querySelector('tbody tr:first-child td')!;
    expect(cell().className).not.toContain('align-top');
    host.alignTop.set(true);
    fixture.detectChanges();
    expect(cell().className).toContain('lg:align-top');
    expect(cell().className).toContain('lg:py-4');
  });

  it('keeps absolutely positioned header texts inside the scroll box, so they never widen the page', () => {
    expect(el().querySelector('table')!.parentElement!.className).toContain('relative');
  });

  it('aligns every header like its cells and gives both the same horizontal padding', () => {
    const heads = Array.from(el().querySelectorAll('thead th')).filter((th) => th.hasAttribute('scope') && th.getAttribute('scope') === 'col');
    const cells = Array.from(el().querySelectorAll('tbody tr:first-child td'));
    ['name', 'status', 'open'].forEach((_, i) => {
      const align = (c: Element) => c.className.split(' ').filter((n) => /text-(left|center|right)$/.test(n)).join(' ');
      const pad = (c: Element) => c.className.split(' ').filter((n) => /(^|:)px-\d/.test(n)).join(' ');
      expect(align(heads[i])).toBe(align(cells[i]));
      expect(pad(heads[i])).toBe(pad(cells[i]));
      expect(pad(heads[i])).toContain('px-6');
    });
  });
});

describe('DataTable load bar', () => {
  @Component({
    imports: [DataTable, SkeletonRegion],
    template: `
      @if (inRegion()) {
        <app-skeleton-region [busy]="regionBusy()"><app-data-table captionKey="T" [columns]="columns" [rows]="rows" [rowKey]="byId" [loading]="loading()" [progress]="progress()" /></app-skeleton-region>
      } @else {
        <app-data-table captionKey="T" [columns]="columns" [rows]="rows" [rowKey]="byId" [loading]="loading()" [progress]="progress()" />
      }
    `,
  })
  class LoadHost {
    loading = signal(true);
    progress = signal(true);
    inRegion = signal(false);
    regionBusy = signal(true);
    rows: Row[] = [];
    columns: TableColumn<Row>[] = [{ key: 'name', headerKey: 'T.NAME' }];
    byId = (r: Row) => r.id;
  }

  function setup() {
    TestBed.configureTestingModule({ imports: [LoadHost], providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(LoadHost);
    fixture.detectChanges();
    return { fixture, host: fixture.componentInstance, el: fixture.nativeElement as HTMLElement };
  }

  it('draws its own bar and announces the load while it loads', () => {
    const { el } = setup();
    expect(el.querySelectorAll('[data-load-progress]').length).toBe(1);
    expect(el.querySelector('[data-table-status]')!.textContent).toContain('COMMON.LOADING');
  });

  it('draws its bar over the top edge of the table (absolute) and the slow-load line below the table, never over the header (MD-505)', fakeAsync(() => {
    const { fixture, el } = setup();
    const surface = el.querySelector('app-data-table > .mk-surface')!;
    const bar = el.querySelector('[data-table-progress]')!;
    expect(bar.parentElement).toBe(surface as HTMLElement);
    expect(bar.classList).toContain('absolute');
    expect(surface.classList).toContain('relative');
    const slot = el.querySelector('app-data-table > [data-table-slow]')!;
    expect(slot).not.toBeNull();
    expect(surface.contains(slot)).toBeFalse();
    expect(surface.compareDocumentPosition(slot) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(slot.querySelector('[data-slow-load]')).toBeNull();
    tick(SLOW_LOAD_MS);
    fixture.detectChanges();
    expect(slot.querySelector('[data-slow-load]')!.textContent).toContain('COMMON.SLOW_LOAD');
    expect(slot.getAttribute('aria-live')).toBe('polite');
    expect(el.querySelector('thead [data-slow-load]')).toBeNull();
    fixture.componentInstance.loading.set(false);
    fixture.detectChanges();
    expect(el.querySelector('[data-table-slow]')).toBeNull();
  }));

  it('keeps the live status mounted, empty, when it is not loading', () => {
    const { fixture, host, el } = setup();
    host.loading.set(false);
    fixture.detectChanges();
    const status = el.querySelector('[data-table-status]')!;
    expect(status.getAttribute('role')).toBe('status');
    expect(status.textContent!.trim()).toBe('');
  });

  it('draws no bar when it is not loading, or with progress off', () => {
    const { fixture, host, el } = setup();
    host.progress.set(false);
    fixture.detectChanges();
    expect(el.querySelector('[data-load-progress]')).toBeNull();
    host.progress.set(true);
    host.loading.set(false);
    fixture.detectChanges();
    expect(el.querySelector('[data-load-progress]')).toBeNull();
  });

  it('does not draw a second bar inside a region that is loading, and draws its own if the region is not', () => {
    const { fixture, host, el } = setup();
    host.inRegion.set(true);
    fixture.detectChanges();
    expect(el.querySelectorAll('[data-load-progress]').length).toBe(1);
    expect(el.querySelector('[data-table-progress]')).toBeNull();
    host.regionBusy.set(false);
    fixture.detectChanges();
    expect(el.querySelectorAll('[data-load-progress]').length).toBe(1);
    expect(el.querySelector('[data-table-progress]')).not.toBeNull();
  });
});
