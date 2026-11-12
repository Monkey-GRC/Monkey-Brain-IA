import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { TableFilter } from '../table-filter/table-filter';
import { TableToolbar } from './table-toolbar';

@Component({
  imports: [TableToolbar, TableFilter],
  template: `
    <app-table-toolbar [searchPlaceholderKey]="search()" [query]="query" (queryChange)="typed.push($event)">
      <app-table-filter filters labelKey="TEST.F" [options]="[]" />
      <button actions type="button">Go</button>
    </app-table-toolbar>
  `,
})
class Host {
  search = signal<string | null>('TEST.SEARCH');
  query = '';
  typed: string[] = [];
}

describe('TableToolbar', () => {
  let fixture: ComponentFixture<Host>;
  const el = () => fixture.nativeElement as HTMLElement;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host], providers: [provideTranslateService()] });
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('puts the search, the filters and the actions in one row, and emits what is typed', () => {
    const input = el().querySelector<HTMLInputElement>('input[type="search"]')!;
    expect(input.placeholder).toBe('TEST.SEARCH');
    input.value = 'ana';
    input.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.typed).toEqual(['ana']);
    expect(el().querySelector('app-search-field span.material-symbols-rounded')!.className).toContain('right-');
    expect(input.className).toContain('pr-11');
    expect(el().querySelector('app-table-filter')).not.toBeNull();
    expect(el().querySelector('button[actions]')!.textContent).toBe('Go');
    expect(el().querySelector('app-table-toolbar [role="group"]')!.className).toContain('flex');
  });

  it('has no search box without a placeholder key', () => {
    fixture.componentInstance.search.set(null);
    fixture.detectChanges();
    expect(el().querySelector('input[type="search"]')).toBeNull();
  });
});
