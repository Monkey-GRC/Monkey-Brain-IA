import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { pushOverlay } from '../overlay-stack/overlay-stack';
import { SideDrawer } from './side-drawer';

@Component({
  imports: [SideDrawer],
  template: `
    <app-side-drawer [open]="open" [dismissible]="dismissible" [guarded]="guarded" titleKey="TEST.TITLE" subtitleKey="TEST.SUB" (closed)="closed = closed + 1">
      <p id="body">content</p>
      <button actions id="save">Save</button>
    </app-side-drawer>
  `,
})
class Host {
  open = true;
  dismissible = true;
  guarded = false;
  closed = 0;
}

describe('SideDrawer', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  const el = () => fixture.nativeElement as HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host], providers: [provideTranslateService()] });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('is a modal dialog labelled by its title, with body, subtitle and the fixed actions', () => {
    const dialog = el().querySelector('[role="dialog"]')!;
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(el().querySelector('#' + dialog.getAttribute('aria-labelledby'))!.textContent).toContain('TEST.TITLE');
    expect(el().textContent).toContain('TEST.SUB');
    expect(dialog.querySelector('footer #save')).not.toBeNull();
    expect(dialog.className).toContain('shadow-float');
  });

  it('renders nothing while closed', () => {
    host.open = false;
    fixture.detectChanges();
    expect(el().querySelector('[role="dialog"]')).toBeNull();
  });

  it('asks to close with Esc, the backdrop and the close button', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    (el().querySelector('[data-testid="drawer-backdrop"]') as HTMLElement).click();
    (el().querySelector('button[aria-label="COMMON.CLOSE"]') as HTMLElement).click();
    expect(host.closed).toBe(3);
  });

  it('ignores Esc while another layer is on top or when the event was already handled, and closes on the next one', () => {
    const release = pushOverlay({});
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(host.closed).toBe(0);
    release();
    const handled = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    handled.preventDefault();
    document.dispatchEvent(handled);
    expect(host.closed).toBe(0);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(host.closed).toBe(1);
  });

  it('does not close when it is not dismissible', () => {
    host.dismissible = false;
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    (el().querySelector('[data-testid="drawer-backdrop"]') as HTMLElement).click();
    expect(host.closed).toBe(0);
  });

  describe('guarded (MD-485): with data written it asks before discarding, never in silence', () => {
    const confirm = () => document.querySelector<HTMLElement>('[role="alertdialog"]');
    const escape = () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
    const ways: [string, () => void][] = [
      ['Esc', escape],
      ['the backdrop', () => (el().querySelector('[data-testid="drawer-backdrop"]') as HTMLElement).click()],
      ['the close button', () => (el().querySelector('[data-drawer-close]') as HTMLElement).click()],
    ];

    beforeEach(() => {
      host.guarded = true;
      fixture.detectChanges();
    });

    for (const [name, close] of ways) {
      it(`asks before closing on ${name}; «Seguir editando» keeps it open and «Descartar cambios» closes`, () => {
        close();
        fixture.detectChanges();
        expect(host.closed).toBe(0);
        expect(confirm()).not.toBeNull();
        expect(confirm()!.textContent).toContain('COMMON.DISCARD.TITLE');
        confirm()!.querySelector<HTMLButtonElement>('[data-cancel]')!.click();
        fixture.detectChanges();
        expect(confirm()).toBeNull();
        expect(host.closed).toBe(0);
        expect(el().querySelector('#body')).not.toBeNull();
        close();
        fixture.detectChanges();
        confirm()!.querySelector<HTMLButtonElement>('[data-confirm]')!.click();
        fixture.detectChanges();
        expect(host.closed).toBe(1);
      });
    }

    it('Esc on the confirmation only answers it (keep editing); the drawer stays open', () => {
      escape();
      fixture.detectChanges();
      expect(confirm()).not.toBeNull();
      escape();
      fixture.detectChanges();
      expect(confirm()).toBeNull();
      expect(host.closed).toBe(0);
      expect(el().querySelector('[role="dialog"]')).not.toBeNull();
    });

    it('starts the confirmation on «Seguir editando», the safe choice', () => {
      escape();
      fixture.detectChanges();
      expect(confirm()!.querySelector('[data-cancel]')!.hasAttribute('cdkFocusInitial')).toBeTrue();
      expect(confirm()!.querySelector('[data-cancel]')!.textContent).toContain('COMMON.DISCARD.KEEP');
      expect(confirm()!.querySelector('[data-confirm]')!.textContent).toContain('COMMON.DISCARD.CONFIRM');
    });

    it('does nothing at all while it is not dismissible (sending)', () => {
      host.dismissible = false;
      fixture.detectChanges();
      for (const [, close] of ways) close();
      fixture.detectChanges();
      expect(confirm()).toBeNull();
      expect(host.closed).toBe(0);
    });
  });

  it('without data (not guarded) every way out closes at once, without asking', () => {
    (el().querySelector('[data-drawer-close]') as HTMLElement).click();
    fixture.detectChanges();
    expect(document.querySelector('[role="alertdialog"]')).toBeNull();
    expect(host.closed).toBe(1);
  });

  it('locks the page scroll while open and releases it on close', () => {
    expect(document.body.classList.contains('overflow-hidden')).toBeTrue();
    host.open = false;
    fixture.detectChanges();
    expect(document.body.classList.contains('overflow-hidden')).toBeFalse();
  });
});
