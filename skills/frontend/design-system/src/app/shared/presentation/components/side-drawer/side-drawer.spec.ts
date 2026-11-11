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

  it('guarded blocks Esc and the backdrop but not the close button', () => {
    host.guarded = true;
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    (el().querySelector('[data-testid="drawer-backdrop"]') as HTMLElement).click();
    expect(host.closed).toBe(0);
    (el().querySelector('button[aria-label="COMMON.CLOSE"]') as HTMLElement).click();
    expect(host.closed).toBe(1);
  });

  it('locks the page scroll while open and releases it on close', () => {
    expect(document.body.classList.contains('overflow-hidden')).toBeTrue();
    host.open = false;
    fixture.detectChanges();
    expect(document.body.classList.contains('overflow-hidden')).toBeFalse();
  });
});
