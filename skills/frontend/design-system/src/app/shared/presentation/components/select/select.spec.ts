import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { Select, SelectOption } from './select';

const OPTIONS: SelectOption[] = [
  { value: 'a', labelKey: 'TEST.A' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma', disabled: true },
  { value: 'd', label: 'Delta' },
];

@Component({
  imports: [Select, ReactiveFormsModule, FormsModule],
  template: `
    <div id="plain"><app-select inputId="plain-id" [options]="options" [value]="value()" [invalid]="invalid()" [disabled]="disabled()" placeholderKey="TEST.PLACEHOLDER" ariaLabelKey="TEST.NAME" (valueChange)="picked.push($event)" /></div>
    <div id="multi"><app-select [options]="options" multiple [values]="values()" summaryKey="TEST.SUMMARY" (valuesChange)="many.push($event)" /></div>
    <div id="reactive"><app-select [options]="options" [formControl]="control" /></div>
    <div id="model"><app-select [options]="options" [(ngModel)]="model" /></div>
    <div id="clear"><app-select [options]="options" clearable placeholderKey="TEST.PLACEHOLDER" (valueChange)="picked.push($event)" /></div>
    <div id="empty"><app-select [options]="options" emptyLabelKey="TEST.ALL" (valueChange)="picked.push($event)" /></div>
    <div id="search"><app-select [options]="grouped" searchable (valueChange)="picked.push($event)" /></div>
    <div id="i18n"><app-select [options]="translated" searchable ariaLabelKey="TEST.NAME" /></div>
    <button id="outside" type="button">outside</button>
  `,
})
class Host {
  options = OPTIONS;
  grouped: SelectOption[] = [
    { value: 'soc2', label: 'SOC 2 · 2017', group: 'TEST.AVAILABLE' },
    { value: 'iso', label: 'ISO 27001 · 2022', group: 'TEST.AVAILABLE' },
    { value: 'gdpr', label: 'Protección de datos · 2018', group: 'TEST.SOON' },
  ];
  translated: SelectOption[] = [
    { value: 'red', labelKey: 'TEST.RED' },
    { value: 'blue', labelKey: 'TEST.BLUE' },
  ];
  value = signal('');
  values = signal<string[]>([]);
  invalid = signal(false);
  disabled = signal(false);
  picked: string[] = [];
  many: string[][] = [];
  control = new FormControl('b', { nonNullable: true });
  model = 'd';
}

describe('Select', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  const trigger = (id: string) => fixture.nativeElement.querySelector(`#${id} [data-select-trigger]`) as HTMLButtonElement;
  const panel = () => document.body.querySelector<HTMLElement>('[data-select-panel]');
  const options = () => Array.from(document.body.querySelectorAll<HTMLElement>('[data-select-option]'));
  const key = (id: string, k: string) => {
    trigger(id).dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
    fixture.detectChanges();
  };
  const open = (id: string) => {
    trigger(id).click();
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host], providers: [provideTranslateService()] });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('is a combobox that shows the placeholder and the chevron, closed', () => {
    const t = trigger('plain');
    expect(t.getAttribute('role')).toBe('combobox');
    expect(t.id).toBe('plain-id');
    expect(t.getAttribute('aria-expanded')).toBe('false');
    expect(t.getAttribute('aria-label')).toBe('TEST.NAME');
    expect(t.textContent).toContain('TEST.PLACEHOLDER');
    expect(t.querySelector('.material-symbols-rounded')!.textContent).toContain('expand_more');
    expect(t.className).toContain('pr-3');
    expect(panel()).toBeNull();
  });

  it('opens a listbox in <body> (position fixed) and links the active option with aria-activedescendant', () => {
    open('plain');
    const p = panel()!;
    expect(trigger('plain').getAttribute('aria-expanded')).toBe('true');
    expect(p.getAttribute('role')).toBe('listbox');
    expect(p.className).toContain('fixed');
    expect(options().length).toBe(4);
    expect(options()[0].textContent).toContain('TEST.A');
    expect(trigger('plain').getAttribute('aria-controls')).toBe(p.id);
    expect(trigger('plain').getAttribute('aria-activedescendant')).toBe(options()[0].id);
  });

  it('chooses with the mouse, emits the value and closes', () => {
    open('plain');
    options()[1].click();
    fixture.detectChanges();
    expect(host.picked).toEqual(['b']);
    expect(panel()).toBeNull();
    expect(trigger('plain').textContent).toContain('Beta');
  });

  it('does not choose a disabled option', () => {
    open('plain');
    options()[2].click();
    fixture.detectChanges();
    expect(host.picked).toEqual([]);
    expect(panel()).not.toBeNull();
  });

  it('moves with the arrows (skipping disabled ones), Home and End, and chooses with Enter', () => {
    open('plain');
    key('plain', 'ArrowDown');
    expect(trigger('plain').getAttribute('aria-activedescendant')).toBe(options()[1].id);
    key('plain', 'ArrowDown');
    expect(trigger('plain').getAttribute('aria-activedescendant')).toBe(options()[3].id);
    key('plain', 'Home');
    expect(trigger('plain').getAttribute('aria-activedescendant')).toBe(options()[0].id);
    key('plain', 'End');
    key('plain', 'Enter');
    expect(host.picked).toEqual(['d']);
    expect(panel()).toBeNull();
  });

  it('opens with the keyboard, and Space chooses', () => {
    key('plain', 'ArrowDown');
    expect(panel()).not.toBeNull();
    key('plain', 'ArrowDown');
    key('plain', ' ');
    expect(host.picked).toEqual(['b']);
  });

  it('closes with Esc (without letting it through), with Tab and with a click outside', () => {
    open('plain');
    const esc = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    trigger('plain').dispatchEvent(esc);
    fixture.detectChanges();
    expect(esc.defaultPrevented).toBe(true);
    expect(panel()).toBeNull();
    open('plain');
    key('plain', 'Tab');
    expect(panel()).toBeNull();
    open('plain');
    (fixture.nativeElement.querySelector('#outside') as HTMLElement).dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    fixture.detectChanges();
    expect(panel()).toBeNull();
  });

  it('jumps to an option by typing', () => {
    open('plain');
    key('plain', 'd');
    expect(trigger('plain').getAttribute('aria-activedescendant')).toBe(options()[3].id);
  });

  it('marks the error state and the disabled state with tokens, and does not open when disabled', () => {
    host.invalid.set(true);
    fixture.detectChanges();
    expect(trigger('plain').className).toContain('border-bad');
    expect(trigger('plain').getAttribute('aria-invalid')).toBe('true');
    host.disabled.set(true);
    fixture.detectChanges();
    expect(trigger('plain').disabled).toBe(true);
    trigger('plain').click();
    fixture.detectChanges();
    expect(panel()).toBeNull();
    expect(trigger('plain').className).not.toMatch(/opacity-\d/);
  });

  it('`clearable` adds «Sin elegir» first and lets the choice go back to empty, keeping the placeholder', () => {
    open('clear');
    expect(options()[0].dataset['value']).toBe('');
    expect(options()[0].textContent).toContain('COMMON.SELECT.NONE');
    options()[2].click();
    fixture.detectChanges();
    open('clear');
    options()[0].click();
    fixture.detectChanges();
    expect(host.picked).toEqual(['b', '']);
    expect(trigger('clear').textContent).toContain('TEST.PLACEHOLDER');
  });

  it('a required select has no empty option', () => {
    open('plain');
    expect(options().map((o) => o.dataset['value'])).not.toContain('');
  });

  it('adds the empty option when it has `emptyLabelKey` and emits an empty value for it', () => {
    expect(trigger('empty').textContent).toContain('TEST.ALL');
    open('empty');
    expect(options()[0].dataset['value']).toBe('');
    options()[1].click();
    fixture.detectChanges();
    open('empty');
    options()[0].click();
    fixture.detectChanges();
    expect(host.picked).toEqual(['a', '']);
  });

  describe('multiple', () => {
    it('has a checkbox per option, stays open and emits the list in option order', () => {
      open('multi');
      expect(panel()!.getAttribute('aria-multiselectable')).toBe('true');
      expect(options()[0].querySelector('[data-select-box]')).not.toBeNull();
      options()[3].click();
      fixture.detectChanges();
      options()[0].click();
      fixture.detectChanges();
      expect(panel()).not.toBeNull();
      expect(host.many).toEqual([['d'], ['a', 'd']]);
      expect(options()[0].getAttribute('aria-selected')).toBe('true');
      expect(options()[0].querySelector('[data-select-box]')!.className).toContain('bg-action');
    });

    it('shows the filter name and how many are chosen, and unchooses', () => {
      host.values.set(['a', 'b']);
      fixture.detectChanges();
      expect(trigger('multi').textContent).toContain('TEST.SUMMARY');
      expect(trigger('multi').querySelector('[data-select-count]')!.textContent).toBe('2');
      open('multi');
      options()[0].click();
      fixture.detectChanges();
      expect(host.many).toEqual([['b']]);
      expect(trigger('multi').querySelector('[data-select-count]')!.textContent).toBe('1');
    });

    it('toggles with Space and keeps the panel open', () => {
      key('multi', 'ArrowDown');
      key('multi', ' ');
      expect(panel()).not.toBeNull();
      expect(host.many).toEqual([['a']]);
    });
  });

  describe('as a form control', () => {
    it('reads and writes a reactive control', () => {
      expect(trigger('reactive').textContent).toContain('Beta');
      open('reactive');
      options()[3].click();
      fixture.detectChanges();
      expect(host.control.value).toBe('d');
      host.control.setValue('a');
      fixture.detectChanges();
      expect(trigger('reactive').textContent).toContain('TEST.A');
    });

    it('disables with the control', () => {
      host.control.disable();
      fixture.detectChanges();
      expect(trigger('reactive').disabled).toBe(true);
    });

    it('works with ngModel', async () => {
      await fixture.whenStable();
      fixture.detectChanges();
      expect(trigger('model').textContent).toContain('Delta');
      open('model');
      options()[0].click();
      fixture.detectChanges();
      expect(host.model).toBe('a');
    });
  });

  describe('searchable, with groups', () => {
    const search = () => document.body.querySelector<HTMLInputElement>('[data-select-search]')!;
    const type = (text: string) => {
      search().value = text;
      search().dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };
    const keyIn = (k: string) => {
      search().dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
      fixture.detectChanges();
    };

    it('puts the options under the heading of their group, each group a labelled group of the listbox', () => {
      open('search');
      const groups = Array.from(document.body.querySelectorAll<HTMLElement>('[role="group"]'));
      expect(groups.length).toBe(2);
      expect(groups.map((g) => document.getElementById(g.getAttribute('aria-labelledby')!)!.textContent!.trim())).toEqual(['TEST.AVAILABLE', 'TEST.SOON']);
      expect(groups[0].querySelectorAll('[data-select-option]').length).toBe(2);
      expect(groups[1].querySelectorAll('[data-select-option]').length).toBe(1);
    });

    it('has a search box above the listbox (not inside it) that takes the focus', async () => {
      open('search');
      await fixture.whenStable();
      expect(search()).not.toBeNull();
      expect(search().closest('[role="listbox"]')).toBeNull();
      const list = document.body.querySelector('[role="listbox"]')!;
      expect(search().getAttribute('aria-controls')).toBe(list.id);
      expect(trigger('search').getAttribute('aria-controls')).toBe(list.id);
      expect(document.activeElement).toBe(search());
    });

    it('filters by the option text ignoring case and accents, says when nothing matches, and chooses with Enter', () => {
      open('search');
      type('PROTECCION');
      expect(options().map((o) => o.getAttribute('data-value'))).toEqual(['gdpr']);
      expect(document.body.querySelectorAll('[data-select-group]').length).toBe(1);
      type('zzz');
      expect(options().length).toBe(0);
      expect(document.body.querySelector('[data-select-empty]')!.textContent).toContain('COMMON.SELECT.NO_MATCH');
      type('iso');
      keyIn('Enter');
      expect(host.picked).toEqual(['iso']);
      expect(panel()).toBeNull();
    });

    it('follows a change of language: the search matches the new texts and the list keeps its name in the new language', () => {
      const translate = TestBed.inject(TranslateService);
      translate.setTranslation('es', { TEST: { NAME: 'Color', RED: 'Rojo', BLUE: 'Azul' } });
      translate.setTranslation('en', { TEST: { NAME: 'Colour', RED: 'Red', BLUE: 'Blue' } });
      translate.use('es');
      fixture.detectChanges();
      open('i18n');
      type('roj');
      expect(options().map((o) => o.getAttribute('data-value'))).toEqual(['red']);
      expect(document.body.querySelector('[role="listbox"]')!.getAttribute('aria-label')).toBe('Color');
      translate.use('en');
      fixture.detectChanges();
      expect(options().length).toBe(0);
      expect(document.body.querySelector('[role="listbox"]')!.getAttribute('aria-label')).toBe('Colour');
      type('re');
      expect(options().map((o) => o.getAttribute('data-value'))).toEqual(['red']);
    });

    it('moves with the arrows from the box; Esc closes, clears the search and gives the focus back to the trigger', async () => {
      open('search');
      await fixture.whenStable();
      keyIn('ArrowDown');
      expect(search().getAttribute('aria-activedescendant')).toBe(options()[1].id);
      type('soc');
      keyIn('Escape');
      expect(panel()).toBeNull();
      expect(document.activeElement).toBe(trigger('search'));
      open('search');
      expect(search().value).toBe('');
      expect(options().length).toBe(3);
    });

    it('typing a letter on the closed trigger opens it with the search already started', () => {
      key('search', 'p');
      expect(search().value).toBe('p');
      expect(options().map((o) => o.getAttribute('data-value'))).toEqual(['gdpr']);
    });
  });

  it('removes the panel from <body> when the component is destroyed', () => {
    open('plain');
    expect(panel()).not.toBeNull();
    fixture.destroy();
    expect(panel()).toBeNull();
  });
});
