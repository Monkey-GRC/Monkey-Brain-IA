import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { FormModal } from '@shared/presentation/components/form-modal/form-modal';
import { Select, SelectOption } from './select';

@Component({
  imports: [FormModal, Select],
  template: `
    <app-form-modal titleKey="T.TITLE" (closed)="closes = closes + 1">
      <p id="inside">Inside the modal</p>
      <app-select inputId="in-modal" [options]="options" (valueChange)="picked.push($event)" />
    </app-form-modal>
  `,
})
class Host {
  options: SelectOption[] = [{ value: 'a', label: 'Alfa' }, { value: 'b', label: 'Beta' }];
  picked: string[] = [];
  closes = 0;
}

// A select inside a modal: its panel lives in <body>, outside the dialog, and none of the three ways of leaving the select may take the modal with it.
describe('Select inside a form-modal', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  const trigger = () => fixture.nativeElement.querySelector('[data-select-trigger]') as HTMLButtonElement;
  const panel = () => document.body.querySelector<HTMLElement>('[data-select-panel]');
  const open = () => {
    trigger().click();
    fixture.detectChanges();
  };
  const esc = (target: EventTarget) => {
    target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host], providers: [provideTranslateService()] });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });
  afterEach(() => document.body.classList.remove('overflow-hidden'));

  it('choosing an option, or pressing inside the panel, never closes the modal', () => {
    open();
    panel()!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    panel()!.click();
    fixture.detectChanges();
    expect(panel()).not.toBeNull();
    const option = panel()!.querySelector('[data-value="b"]') as HTMLElement;
    option.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    option.click();
    fixture.detectChanges();
    expect(host.picked).toEqual(['b']);
    expect(panel()).toBeNull();
    expect(host.closes).toBe(0);
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it('Esc with the select open closes only the select, wherever the focus is; the next Esc closes the modal', () => {
    open();
    esc(trigger());
    expect(panel()).toBeNull();
    expect(host.closes).toBe(0);
    open();
    esc(document.body);
    expect(panel()).toBeNull();
    expect(host.closes).toBe(0);
    esc(document.body);
    expect(host.closes).toBe(1);
  });

  it('a click outside the select but inside the modal closes only the select', () => {
    open();
    (fixture.nativeElement.querySelector('#inside') as HTMLElement).dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    fixture.detectChanges();
    expect(panel()).toBeNull();
    expect(host.closes).toBe(0);
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
  });
});
