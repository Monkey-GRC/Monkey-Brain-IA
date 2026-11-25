import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { TabItem, Tabs } from './tabs';

@Component({
  imports: [Tabs],
  template: `<app-tabs [items]="items" [active]="active" ariaLabelKey="TEST.ARIA" (activeChange)="active = $event" />`,
})
class Host {
  items: TabItem[] = [
    { id: 'a', labelKey: 'TEST.A' },
    { id: 'b', labelKey: 'TEST.B', count: 3 },
  ];
  active = 'a';
}

describe('Tabs', () => {
  let fixture: ComponentFixture<Host>;
  const tabs = () => Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('[role="tab"]'));

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host], providers: [provideTranslateService()] });
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('marks the active tab as selected and underlines it', () => {
    expect(tabs().map((t) => t.getAttribute('aria-selected'))).toEqual(['true', 'false']);
    expect(tabs()[0].className).toContain('border-action');
    expect(tabs()[1].className).toContain('border-transparent');
    expect(tabs()[1].getAttribute('tabindex')).toBe('-1');
  });

  it('shows the count of a tab after its label, only where there is one', () => {
    expect(tabs()[0].querySelector('[data-tab-count]')).toBeNull();
    expect(tabs()[1].querySelector('[data-tab-count]')?.textContent).toBe('3');
  });

  it('names each tab `tab-<id>` by default, so the tab panel can point at it', () => {
    expect(tabs().map((t) => t.id)).toEqual(['tab-a', 'tab-b']);
  });

  it('changes tab with a click', () => {
    tabs()[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.active).toBe('b');
    expect(tabs()[1].getAttribute('aria-selected')).toBe('true');
  });

  it('moves with the arrow keys and wraps around', () => {
    tabs()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.active).toBe('b');
    tabs()[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.active).toBe('a');
  });
});
