import { Component, signal } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { DiscardConfirm, DiscardGuard } from './discard-confirm';

@Component({
  imports: [DiscardConfirm],
  host: { '(focusin)': 'guard.remember($event)' },
  template: `
    <div role="dialog"><input data-field /></div>
    <app-discard-confirm [guard]="guard" />
  `,
})
class Host {
  readonly open = signal(true);
  readonly canClose = signal(true);
  readonly guarded = signal(false);
  closes = 0;
  readonly guard = new DiscardGuard({ open: this.open, canClose: this.canClose, guarded: this.guarded, close: () => this.closes++ });
}

describe('DiscardGuard', () => {
  function setup() {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return { fixture, host: fixture.componentInstance, el: fixture.nativeElement as HTMLElement };
  }

  it('closes at once without unsent data, and asks with it', () => {
    const { fixture, host, el } = setup();
    host.guard.request();
    expect(host.closes).toBe(1);
    host.guarded.set(true);
    host.guard.request();
    fixture.detectChanges();
    expect(host.closes).toBe(1);
    expect(host.guard.confirming()).toBeTrue();
    expect(el.querySelector('[role="alertdialog"]')).not.toBeNull();
    host.guard.discard();
    expect(host.closes).toBe(2);
    expect(host.guard.confirming()).toBeFalse();
  });

  it('does nothing while closed or while it may not close', () => {
    const { host } = setup();
    host.canClose.set(false);
    host.guard.request();
    host.canClose.set(true);
    host.open.set(false);
    host.guard.request();
    expect(host.closes).toBe(0);
  });

  it('forgets a pending confirmation when the caller closes it', () => {
    const { fixture, host } = setup();
    host.guarded.set(true);
    host.guard.request();
    host.open.set(false);
    fixture.detectChanges();
    expect(host.guard.confirming()).toBeFalse();
    host.open.set(true);
    fixture.detectChanges();
    expect(host.guard.confirming()).toBeFalse();
  });

  it('«Seguir editando» puts the focus back on the field it was in', fakeAsync(() => {
    const { host, el } = setup();
    const field = el.querySelector<HTMLInputElement>('[data-field]')!;
    field.focus();
    field.blur();
    host.guarded.set(true);
    host.guard.request();
    host.guard.keepEditing();
    tick();
    expect(document.activeElement).toBe(field);
    expect(host.guard.confirming()).toBeFalse();
  }));
});
