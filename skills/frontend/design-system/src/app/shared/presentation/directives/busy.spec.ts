import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Busy } from './busy';

@Component({
  imports: [Busy],
  template: `
    <button id="plain" type="button" class="mk-btn" [appBusy]="busy()" [busyLabel]="label()" [disabled]="locked()" (click)="clicks = clicks + 1" (keydown)="keys = keys + 1" style="width: 140px">Save</button>
    <form id="form" (submit)="submits = submits + 1; $event.preventDefault()">
      <input id="field" type="text" />
      <button id="submit" type="submit" class="mk-btn" [appBusy]="busy()">Go</button>
    </form>
    <button id="icon" type="button" class="mk-btn-secondary" [appBusy]="busySignal"><span class="material-symbols-rounded">add</span>Add</button>
  `,
})
class Host {
  busy = signal(false);
  busySignal = signal(false);
  label = signal<string | null>(null);
  locked = signal(false);
  clicks = 0;
  submits = 0;
  keys = 0;
}

describe('Busy directive', () => {
  function setup() {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const btn = (id: string) => el.querySelector<HTMLButtonElement>(`#${id}`)!;
    return { fixture, host: fixture.componentInstance, el, btn };
  }

  afterEach(() => document.body.querySelectorAll('ng-component').forEach((n) => n.remove()));

  it('does nothing while it is not busy', () => {
    const { btn, host } = setup();
    expect(btn('plain').disabled).toBeFalse();
    expect(btn('plain').hasAttribute('aria-busy')).toBeFalse();
    expect(btn('plain').querySelector('[data-busy-spinner]')).toBeNull();
    btn('plain').click();
    expect(host.clicks).toBe(1);
  });

  it('shows a spinner and marks the button busy and aria-disabled, without touching `disabled`', () => {
    const { fixture, host, btn } = setup();
    host.busy.set(true);
    fixture.detectChanges();
    const b = btn('plain');
    expect(b.disabled).toBeFalse();
    expect(b.getAttribute('aria-disabled')).toBe('true');
    expect(b.getAttribute('aria-busy')).toBe('true');
    const spinner = b.querySelector('[data-busy-spinner]')!;
    expect(spinner.getAttribute('aria-hidden')).toBe('true');
    expect(spinner.textContent).toBe('progress_activity');
    expect(spinner.className).toContain('motion-safe:animate-spin');
    expect(b.textContent).toContain('Save');
  });

  it('keeps the focus on the button while busy', () => {
    const { fixture, host, btn } = setup();
    btn('plain').focus();
    host.busy.set(true);
    fixture.detectChanges();
    expect(document.activeElement).toBe(btn('plain'));
  });

  it('keeps the width of the button', () => {
    const { fixture, host, btn } = setup();
    const before = btn('plain').getBoundingClientRect().width;
    host.busy.set(true);
    fixture.detectChanges();
    expect(btn('plain').style.minWidth).toBe(`${before}px`);
    expect(btn('plain').getBoundingClientRect().width).toBe(before);
  });

  it('ignores clicks while busy, including the ones made by code', () => {
    const { fixture, host, btn } = setup();
    host.busy.set(true);
    fixture.detectChanges();
    btn('plain').click();
    btn('plain').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(host.clicks).toBe(0);
  });

  it('ignores Enter and Space while busy, but lets Tab through', () => {
    const { fixture, host, btn } = setup();
    host.busy.set(true);
    fixture.detectChanges();
    for (const type of ['keydown', 'keyup']) {
      for (const key of ['Enter', ' ']) {
        const event = new KeyboardEvent(type, { key, bubbles: true, cancelable: true });
        btn('plain').dispatchEvent(event);
        expect(event.defaultPrevented).withContext(`${type} ${key}`).toBeTrue();
      }
    }
    expect(host.keys).toBe(0);
    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    btn('plain').dispatchEvent(tab);
    expect(tab.defaultPrevented).toBeFalse();
    expect(host.keys).toBe(1);
  });

  it('does not submit the form while busy (the implicit submission is a click on the submit button) and does when it ends', () => {
    const { fixture, host, btn } = setup();
    btn('submit').click();
    expect(host.submits).toBe(1);
    host.busy.set(true);
    fixture.detectChanges();
    btn('submit').click();
    expect(host.submits).toBe(1);
    host.busy.set(false);
    fixture.detectChanges();
    btn('submit').click();
    expect(host.submits).toBe(2);
  });

  it('never writes `disabled`: the screen binding rules while busy', () => {
    const { fixture, host, btn } = setup();
    host.busy.set(true);
    fixture.detectChanges();
    expect(btn('plain').disabled).toBeFalse();
    host.locked.set(true);
    fixture.detectChanges();
    expect(btn('plain').disabled).toBeTrue();
    host.locked.set(false);
    fixture.detectChanges();
    expect(btn('plain').disabled).toBeFalse();
  });

  it('when `[disabled]` turns on just as the process ends, it stays disabled', () => {
    const { fixture, host, btn } = setup();
    host.busy.set(true);
    fixture.detectChanges();
    host.busy.set(false);
    host.locked.set(true);
    fixture.detectChanges();
    expect(btn('plain').disabled).toBeTrue();
    expect(btn('plain').hasAttribute('aria-busy')).toBeFalse();
  });

  it('when `[disabled]` turns off just as the process ends, it stays enabled', () => {
    const { fixture, host, btn } = setup();
    host.locked.set(true);
    fixture.detectChanges();
    host.busy.set(true);
    fixture.detectChanges();
    host.busy.set(false);
    host.locked.set(false);
    fixture.detectChanges();
    expect(btn('plain').disabled).toBeFalse();
    btn('plain').click();
    expect(host.clicks).toBe(1);
  });

  it('leaves disabled a button that the screen had disabled', () => {
    const { fixture, host, btn } = setup();
    host.locked.set(true);
    fixture.detectChanges();
    host.busy.set(true);
    fixture.detectChanges();
    host.busy.set(false);
    fixture.detectChanges();
    expect(btn('plain').disabled).toBeTrue();
  });

  it('removes only what it put when it ends: no aria, no spinner, original width, and what was there before comes back', () => {
    const { fixture, host, btn } = setup();
    host.busy.set(true);
    fixture.detectChanges();
    host.busy.set(false);
    fixture.detectChanges();
    const b = btn('plain');
    expect(b.disabled).toBeFalse();
    expect(b.hasAttribute('aria-disabled')).toBeFalse();
    expect(b.hasAttribute('aria-busy')).toBeFalse();
    expect(b.querySelector('[data-busy-spinner]')).toBeNull();
    expect(b.style.minWidth).toBe('');
    expect(b.style.width).toBe('140px');
    b.click();
    expect(host.clicks).toBe(1);
    const i = btn('icon');
    i.setAttribute('aria-disabled', 'false');
    i.style.minWidth = '50px';
    host.busySignal.set(true);
    fixture.detectChanges();
    expect(i.getAttribute('aria-disabled')).toBe('true');
    host.busySignal.set(false);
    fixture.detectChanges();
    expect(i.getAttribute('aria-disabled')).toBe('false');
    expect(i.style.minWidth).toBe('50px');
  });

  it('keeps the text unless a busy label is given, and restores it afterwards', () => {
    const { fixture, host, btn } = setup();
    host.label.set('Saving…');
    host.busy.set(true);
    fixture.detectChanges();
    expect(btn('plain').textContent).toContain('Saving…');
    expect(btn('plain').textContent).not.toContain('Save ');
    host.busy.set(false);
    fixture.detectChanges();
    expect(btn('plain').textContent).toContain('Save');
    expect(btn('plain').textContent).not.toContain('Saving');
  });

  it('puts the spinner where the icon was, and brings the icon back', () => {
    const { fixture, host, btn } = setup();
    host.busySignal.set(true);
    fixture.detectChanges();
    const b = btn('icon');
    const icon = b.querySelector<HTMLElement>('.material-symbols-rounded:not([data-busy-spinner])')!;
    expect(icon.classList).toContain('hidden');
    expect(b.firstElementChild!.hasAttribute('data-busy-spinner')).toBeTrue();
    expect(b.getAttribute('aria-busy')).toBe('true');
    host.busySignal.set(false);
    fixture.detectChanges();
    expect(icon.classList).not.toContain('hidden');
    expect(b.querySelector('[data-busy-spinner]')).toBeNull();
  });
});
