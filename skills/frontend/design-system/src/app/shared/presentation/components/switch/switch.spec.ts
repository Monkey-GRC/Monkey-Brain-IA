import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { Switch } from './switch';

@Component({
  imports: [Switch],
  template: `<label for="s1">Digest</label>
    <app-switch inputId="s1" describedBy="help" [checked]="on()" [busy]="busy()" [disabled]="off()" (checkedChange)="asked.push($event)" />
    <app-switch id="named" ariaLabelKey="TEST.NAME" />`,
})
class Host {
  readonly on = signal(false);
  readonly busy = signal(false);
  readonly off = signal(false);
  readonly asked: boolean[] = [];
}

describe('Switch', () => {
  function setup() {
    TestBed.configureTestingModule({ imports: [Host], providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const button = () => el.querySelector<HTMLButtonElement>('#s1')!;
    return { fixture, el, host: fixture.componentInstance, button };
  }

  it('is a button with role switch, aria-checked, its label and its help line', () => {
    const { el, fixture, host, button } = setup();
    expect(button().tagName).toBe('BUTTON');
    expect(button().getAttribute('type')).toBe('button');
    expect(button().getAttribute('role')).toBe('switch');
    expect(button().getAttribute('aria-checked')).toBe('false');
    expect(button().getAttribute('aria-describedby')).toBe('help');
    expect(button().labels?.[0]?.textContent).toBe('Digest');
    host.on.set(true);
    fixture.detectChanges();
    expect(button().getAttribute('aria-checked')).toBe('true');
    expect(button().getAttribute('data-checked')).toBe('true');
    expect(el.querySelector('#named button')!.getAttribute('aria-label')).toBe('TEST.NAME');
  });

  it('asks for the other value and never flips itself: the screen decides', () => {
    const { fixture, host, button } = setup();
    button().click();
    fixture.detectChanges();
    expect(host.asked).toEqual([true]);
    expect(button().getAttribute('aria-checked')).toBe('false');
  });

  it('the label toggles it too', () => {
    const { el, host } = setup();
    el.querySelector<HTMLLabelElement>('label')!.click();
    expect(host.asked).toEqual([true]);
  });

  it('is still on and ignores clicks while busy; is disabled and ignores clicks when disabled', () => {
    const { fixture, host, button } = setup();
    host.on.set(true);
    host.busy.set(true);
    fixture.detectChanges();
    expect(button().getAttribute('aria-busy')).toBe('true');
    expect(button().getAttribute('aria-disabled')).toBe('true');
    expect(button().disabled).toBeFalse();
    expect(button().getAttribute('aria-checked')).toBe('true');
    button().click();
    expect(host.asked).toEqual([]);
    host.busy.set(false);
    host.off.set(true);
    fixture.detectChanges();
    expect(button().disabled).toBeTrue();
    expect(button().getAttribute('aria-busy')).toBeNull();
    button().click();
    expect(host.asked).toEqual([]);
  });
});
