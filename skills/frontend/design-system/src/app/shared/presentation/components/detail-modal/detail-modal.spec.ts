import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { pushOverlay } from '@shared/presentation/components/overlay-stack/overlay-stack';
import { TabItem } from '@shared/presentation/components/tabs/tabs';
import { DetailModal, DetailVariant } from './detail-modal';

@Component({
  imports: [DetailModal],
  template: `
    <app-detail-modal [open]="open" titleKey="TEST.KIND" [heading]="heading" [tabs]="tabs" [activeTab]="tab" tabsLabelKey="TEST.TABS" [variant]="variant" [loading]="loading" [loadingTabs]="loadingTabs"
      [dismissible]="dismissible" [guarded]="guarded" testId="demo" (activeTabChange)="tab = $event" (closed)="closed = closed + 1">
      <p meta id="meta">IAC-12</p>
      <div summary id="summary">score</div>
      <button actions type="button" id="edit">Edit</button>
      <button footerStart type="button" id="retire">Retire</button>
      <div id="one" [hidden]="tab !== 'one'"><input id="field" /></div>
      <div id="two" [hidden]="tab !== 'two'">two</div>
    </app-detail-modal>
  `,
})
class Host {
  open = true;
  heading: string | null = 'Gestión de accesos';
  tabs: TabItem[] = [
    { id: 'one', labelKey: 'TEST.ONE' },
    { id: 'two', labelKey: 'TEST.TWO', count: 4 },
  ];
  tab = 'one';
  variant: DetailVariant = 'drawer';
  loading = false;
  loadingTabs = 0;
  dismissible = true;
  guarded = false;
  closed = 0;
}

describe('DetailModal', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  const el = () => fixture.nativeElement as HTMLElement;
  const dialog = () => el().querySelector<HTMLElement>('[role="dialog"]')!;
  const close = () => el().querySelector<HTMLButtonElement>('[data-detail-close]')!;
  const backdrop = () => el().querySelector<HTMLElement>('[data-testid="demo-backdrop"]')!;
  const escape = () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host], providers: [provideTranslateService()] });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => document.body.classList.remove('overflow-hidden'));

  it('is a modal dialog labelled by the item name, with its codes and summary in a fixed header and «Cerrar» first in a fixed footer, then the actions', () => {
    expect(dialog().getAttribute('aria-modal')).toBe('true');
    const title = el().querySelector('#' + dialog().getAttribute('aria-labelledby'))!;
    expect(title.textContent).toContain('Gestión de accesos');
    const header = dialog().querySelector('header')!;
    expect(header.querySelector('#meta')).not.toBeNull();
    expect(header.querySelector('#summary')).not.toBeNull();
    expect(header.querySelector('[data-detail-close], #edit, #retire')).toBeNull();
    expect(header.querySelector('[data-detail-x]')!.getAttribute('aria-label')).toBe('COMMON.CLOSE');
    expect(header.querySelector<HTMLButtonElement>('[data-detail-x]')!.type).toBe('button');
    const footer = dialog().querySelector('footer')!;
    expect(close().previousElementSibling).toBe(footer.firstElementChild);
    expect(footer.querySelector('#edit')).not.toBeNull();
    expect(footer.firstElementChild!.querySelector('#retire')).not.toBeNull();
    expect(close().textContent).toContain('COMMON.CLOSE');
  });

  it('shows the kind of item as the title while the name is not there yet (loading)', () => {
    host.heading = null;
    fixture.detectChanges();
    expect(el().querySelector('[data-detail-title]')!.textContent).toContain('TEST.KIND');
  });

  it('draws the tabs under the header with their counts, the body is their tab panel and a click changes the tab', () => {
    const tabs = Array.from(dialog().querySelectorAll<HTMLElement>('header [role="tab"]'));
    expect(tabs.length).toBe(2);
    expect(tabs[1].querySelector('[data-tab-count]')!.textContent).toBe('4');
    const body = dialog().querySelector('[data-detail-body]')!;
    expect(body.getAttribute('role')).toBe('tabpanel');
    expect(body.getAttribute('aria-labelledby')).toBe('detail-tab-one');
    tabs[1].click();
    fixture.detectChanges();
    expect(host.tab).toBe('two');
    expect(body.getAttribute('aria-labelledby')).toBe('detail-tab-two');
    expect(el().querySelector<HTMLElement>('#one')!.hidden).toBeTrue();
  });

  it('while loading draws the skeleton of the title, the codes and the tab bar, and keeps the title for screen readers (D116)', () => {
    host.loading = true;
    host.loadingTabs = 3;
    host.tabs = [];
    host.heading = null;
    fixture.detectChanges();
    const header = dialog().querySelector('header')!;
    expect(header.querySelector('[data-detail-loading]')).not.toBeNull();
    expect(header.querySelector('[data-shape="tabs"]')).not.toBeNull();
    expect(header.querySelector('#meta')).toBeNull();
    expect(el().querySelector('[data-detail-title]')!.textContent).toContain('TEST.KIND');
  });

  it('has no tab bar with fewer than two tabs, and then the header closes with a line', () => {
    host.tabs = [{ id: 'one', labelKey: 'TEST.ONE' }];
    fixture.detectChanges();
    expect(dialog().querySelector('[role="tablist"]')).toBeNull();
    expect(dialog().querySelector('[data-detail-body]')!.getAttribute('role')).toBeNull();
  });

  it('is the side panel of before, only wider: stuck to the right, full height, the same size on every tab; compact is a short centred modal without the X', () => {
    expect(dialog().dataset['size']).toBe('drawer');
    host.tab = 'two';
    fixture.detectChanges();
    expect(dialog().dataset['size']).toBe('drawer');
    host.variant = 'drawer-narrow';
    fixture.detectChanges();
    expect(dialog().dataset['size']).toBe('drawer-narrow');
    expect(dialog().querySelector('[data-detail-x]')).not.toBeNull();
    host.variant = 'compact';
    fixture.detectChanges();
    expect(dialog().dataset['size']).toBe('detail-compact');
    expect(dialog().querySelector('[data-detail-x]')).toBeNull();
  });

  it('puts the initial focus on the X of the side panel', async () => {
    await new Promise((resolve) => setTimeout(resolve));
    await new Promise((resolve) => setTimeout(resolve));
    expect(document.activeElement).toBe(el().querySelector('[data-detail-x]'));
  });

  it('puts the initial focus on «Cerrar» in the compact modal', async () => {
    host.variant = 'compact';
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));
    await new Promise((resolve) => setTimeout(resolve));
    expect(document.activeElement).toBe(close());
  });

  it('closes with Esc, the backdrop, the X and «Cerrar»', () => {
    escape();
    backdrop().dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    el().querySelector<HTMLButtonElement>('[data-detail-x]')!.click();
    close().click();
    expect(host.closed).toBe(4);
  });

  it('ignores Esc while another layer is on top, and closes on the next one', () => {
    const release = pushOverlay({});
    escape();
    expect(host.closed).toBe(0);
    release();
    escape();
    expect(host.closed).toBe(1);
  });

  it('does not close while it is not dismissible (a call in progress)', () => {
    host.dismissible = false;
    fixture.detectChanges();
    escape();
    backdrop().dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(close().disabled).toBeTrue();
    expect(el().querySelector<HTMLButtonElement>('[data-detail-x]')!.disabled).toBeTrue();
    expect(host.closed).toBe(0);
  });

  describe('guarded (MD-485): with data written it asks before discarding, never in silence', () => {
    const confirm = () => document.querySelector<HTMLElement>('[role="alertdialog"]');
    const ways: [string, () => void][] = [
      ['Esc', escape],
      ['the backdrop', () => backdrop().dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))],
      ['«Cerrar»', () => close().click()],
      ['the X', () => el().querySelector<HTMLButtonElement>('[data-detail-x]')!.click()],
    ];

    beforeEach(() => {
      host.guarded = true;
      fixture.detectChanges();
    });

    for (const [name, way] of ways) {
      it(`asks before closing on ${name}; «Seguir editando» keeps it open and «Descartar cambios» closes`, () => {
        way();
        fixture.detectChanges();
        expect(host.closed).toBe(0);
        expect(confirm()!.textContent).toContain('COMMON.DISCARD.TITLE');
        confirm()!.querySelector<HTMLButtonElement>('[data-cancel]')!.click();
        fixture.detectChanges();
        expect(confirm()).toBeNull();
        expect(el().querySelector('#field')).not.toBeNull();
        way();
        fixture.detectChanges();
        confirm()!.querySelector<HTMLButtonElement>('[data-confirm]')!.click();
        fixture.detectChanges();
        expect(host.closed).toBe(1);
      });
    }

    it('Esc on the confirmation only answers it (keep editing); the modal stays open', () => {
      escape();
      fixture.detectChanges();
      expect(confirm()).not.toBeNull();
      escape();
      fixture.detectChanges();
      expect(confirm()).toBeNull();
      expect(host.closed).toBe(0);
      expect(el().querySelector('[role="dialog"]')).not.toBeNull();
    });
  });

  it('locks the page scroll while open and draws nothing once closed', () => {
    expect(document.body.classList.contains('overflow-hidden')).toBeTrue();
    host.open = false;
    fixture.detectChanges();
    expect(el().querySelector('[role="dialog"]')).toBeNull();
    expect(document.body.classList.contains('overflow-hidden')).toBeFalse();
  });
});
