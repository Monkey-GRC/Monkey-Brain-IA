import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { DetailModal } from '@shared/presentation/components/detail-modal/detail-modal';
import { ConfirmDialog } from './confirm-dialog';

@Component({
  imports: [DetailModal, ConfirmDialog],
  template: `
    <app-detail-modal titleKey="TEST.PANEL" (closed)="detailClosed.set(detailClosed() + 1)">
      <p>detail</p>
    </app-detail-modal>
    @if (asking()) {
      <app-confirm-dialog titleKey="TEST.TITLE" (cancelled)="asking.set(false)" />
    }
  `,
})
class StackedHost {
  asking = signal(false);
  detailClosed = signal(0);
}

describe('ConfirmDialog over a detail modal', () => {
  it('the first Esc closes only the dialog and the second one closes the detail', () => {
    TestBed.configureTestingModule({ imports: [StackedHost], providers: [provideTranslateService()] });
    const f = TestBed.createComponent(StackedHost);
    f.detectChanges();
    f.componentInstance.asking.set(true); // the dialog opens over a detail that was already open
    f.detectChanges();
    const esc = () => {
      const e = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
      document.dispatchEvent(e);
      f.detectChanges();
      return e;
    };
    expect(esc().defaultPrevented).toBeTrue();
    expect(f.componentInstance.asking()).toBeFalse();
    expect(f.componentInstance.detailClosed()).toBe(0);
    esc();
    expect(f.componentInstance.detailClosed()).toBe(1);
  });
});

describe('ConfirmDialog', () => {
  let fixture: ComponentFixture<ConfirmDialog>;
  let component: ConfirmDialog;
  let confirmed: number;
  let cancelled: number;
  const el = () => fixture.nativeElement as HTMLElement;
  const buttons = () => Array.from(el().querySelectorAll<HTMLButtonElement>('button'));

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ConfirmDialog], providers: [provideTranslateService()] });
    fixture = TestBed.createComponent(ConfirmDialog);
    component = fixture.componentInstance;
    confirmed = 0;
    cancelled = 0;
    component.confirmed.subscribe(() => confirmed++);
    component.cancelled.subscribe(() => cancelled++);
    fixture.componentRef.setInput('titleKey', 'TEST.TITLE');
    fixture.componentRef.setInput('messageKey', 'TEST.MESSAGE');
    fixture.detectChanges();
  });

  it('is an alert dialog labelled by its title and described by its message', () => {
    const dialog = el().querySelector('[role="alertdialog"]')!;
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(el().querySelector('#' + dialog.getAttribute('aria-labelledby'))!.textContent).toContain('TEST.TITLE');
    expect(el().querySelector('#' + dialog.getAttribute('aria-describedby'))!.textContent).toContain('TEST.MESSAGE');
  });

  it('confirms and cancels with the buttons', () => {
    const [cancel, confirm] = buttons();
    cancel.click();
    confirm.click();
    expect(cancelled).toBe(1);
    expect(confirmed).toBe(1);
  });

  it('cancels with Escape', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(cancelled).toBe(1);
  });

  it('cancels when clicking outside the dialog, not inside it', () => {
    (el().querySelector('[role="alertdialog"]') as HTMLElement).click();
    expect(cancelled).toBe(0);
    (el().firstElementChild as HTMLElement).click();
    expect(cancelled).toBe(1);
  });

  it('puts the focus on «Cancelar», the safe option', async () => {
    await fixture.whenStable();
    expect(document.activeElement).toBe(buttons()[0]);
  });

  it('ignores everything while the action is running', () => {
    fixture.componentRef.setInput('busy', true);
    fixture.detectChanges();
    expect(buttons()[0].disabled).toBeTrue();
    expect(buttons()[1].disabled).toBeFalse();
    expect(buttons()[1].getAttribute('aria-disabled')).toBe('true');
    expect(buttons()[1].getAttribute('aria-busy')).toBe('true');
    expect(buttons()[1].querySelector('[data-busy-spinner]')).not.toBeNull();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(cancelled).toBe(0);
  });

  it('sits above the detail modal it is opened from, so its buttons are never hidden behind it', () => {
    const panel = TestBed.createComponent(DetailModal);
    panel.componentRef.setInput('titleKey', 'TEST.PANEL');
    panel.detectChanges();
    // Each layer asks for its name in the stacking scale of the theme (`z-(--z-dialog)`, `z-(--z-modal)`), and the scale puts the dialog above the modal.
    const layer = (root: HTMLElement) => /z-\(--(z-[a-z-]+)\)/.exec(root.querySelector<HTMLElement>('[class*="z-(--z-"]')?.className ?? '')?.[1];
    expect(layer(el())).toBe('z-dialog');
    expect(layer(panel.nativeElement)).toBe('z-modal');
    const scale = getComputedStyle(document.documentElement);
    const value = (name: string) => Number(scale.getPropertyValue('--' + name).trim());
    expect(value('z-dialog')).toBeGreaterThan(value('z-modal'));
    document.body.classList.remove('overflow-hidden');
  });

  it('paints the confirm button red for a dangerous action', () => {
    fixture.componentRef.setInput('tone', 'danger');
    fixture.detectChanges();
    expect(buttons()[1].className).toContain('mk-btn-danger');
  });
});
