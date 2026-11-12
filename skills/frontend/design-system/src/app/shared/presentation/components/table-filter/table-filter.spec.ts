import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { TableFilter, TableFilterOption } from './table-filter';

@Component({
  imports: [TableFilter],
  template: `
    <app-table-filter id="single" labelKey="TEST.ROLE" [options]="options" [value]="value()" (valueChange)="picked.push($event)" />
    <app-table-filter id="multi" labelKey="TEST.STATUS" [options]="options" multiple [values]="values()" (valuesChange)="many.push($event)" />
  `,
})
class Host {
  options: TableFilterOption[] = [{ value: 'a', labelKey: 'TEST.A' }, { value: 'b', label: 'Equipo B' }];
  value = signal('b');
  values = signal<string[]>(['a']);
  picked: string[] = [];
  many: string[][] = [];
}

describe('TableFilter', () => {
  let fixture: ComponentFixture<Host>;
  const trigger = (id: string) => (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(`#${id} [data-select-trigger]`)!;
  const options = () => Array.from(document.body.querySelectorAll<HTMLElement>('[data-select-option]'));
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host], providers: [provideTranslateService()] });
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('names the filter with its first option and its aria-label, and shows the current value', () => {
    expect(trigger('single').getAttribute('aria-label')).toBe('TEST.ROLE');
    expect(trigger('single').textContent).toContain('Equipo B');
    trigger('single').click();
    fixture.detectChanges();
    expect(options()[0].textContent).toContain('TEST.ROLE');
    expect(options()[0].dataset['value']).toBe('');
    expect(options()[2].textContent).toContain('Equipo B');
  });

  it('emits the chosen value, and an empty one to clear the filter', () => {
    trigger('single').click();
    fixture.detectChanges();
    options()[1].click();
    fixture.detectChanges();
    trigger('single').click();
    fixture.detectChanges();
    options()[0].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.picked).toEqual(['a', '']);
  });

  it('in multiple mode shows its name with the number chosen, and emits the list', () => {
    expect(trigger('multi').textContent).toContain('TEST.STATUS');
    expect(trigger('multi').querySelector('[data-select-count]')!.textContent).toBe('1');
    trigger('multi').click();
    fixture.detectChanges();
    expect(options().length).toBe(2);
    options()[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.many).toEqual([['a', 'b']]);
  });
});
