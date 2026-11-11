import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { TableFilter, TableFilterOption } from './table-filter';

@Component({
  imports: [TableFilter],
  template: `<app-table-filter labelKey="TEST.ROLE" [options]="options" [value]="value()" (valueChange)="picked.push($event)" />`,
})
class Host {
  options: TableFilterOption[] = [{ value: 'a', labelKey: 'TEST.A' }, { value: 'b', label: 'Equipo B' }];
  value = signal('b');
  picked: string[] = [];
}

describe('TableFilter', () => {
  let fixture: ComponentFixture<Host>;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host], providers: [provideTranslateService()] });
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('names the filter with its first option and its aria-label, and shows the current value', () => {
    const select = (fixture.nativeElement as HTMLElement).querySelector('select')!;
    expect(select.getAttribute('aria-label')).toBe('TEST.ROLE');
    expect(select.options[0].textContent).toContain('TEST.ROLE');
    expect(select.options[0].value).toBe('');
    expect(select.options[2].textContent).toContain('Equipo B');
    expect(select.value).toBe('b');
  });

  it('emits the chosen value, and an empty one to clear the filter', () => {
    const select = (fixture.nativeElement as HTMLElement).querySelector('select')!;
    select.value = 'a';
    select.dispatchEvent(new Event('change'));
    select.value = '';
    select.dispatchEvent(new Event('change'));
    expect(fixture.componentInstance.picked).toEqual(['a', '']);
  });
});
