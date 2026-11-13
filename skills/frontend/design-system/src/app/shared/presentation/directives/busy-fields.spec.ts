import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BusyFields } from './busy-fields';

@Component({
  imports: [BusyFields, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" [appBusyFields]="busy()">
      <input id="name" formControlName="name" />
      <textarea id="note" formControlName="note"></textarea>
      <input id="agree" type="checkbox" formControlName="agree" />
      <input id="locked" disabled />
      <button id="extra" type="button">Extra</button>
    </form>
  `,
})
class Host {
  busy = signal(false);
  form = new FormGroup({ name: new FormControl('Ana'), note: new FormControl('x'), agree: new FormControl(true) });
}

describe('BusyFields directive', () => {
  function setup() {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const q = <T extends HTMLElement>(id: string) => el.querySelector<T>(`#${id}`)!;
    return { fixture, host: fixture.componentInstance, el, q };
  }

  it('holds text fields as read-only and the rest as disabled while busy', () => {
    const { fixture, host, q, el } = setup();
    host.busy.set(true);
    fixture.detectChanges();
    expect(q<HTMLInputElement>('name').readOnly).toBeTrue();
    expect(q<HTMLInputElement>('name').disabled).toBeFalse();
    expect(q<HTMLTextAreaElement>('note').readOnly).toBeTrue();
    expect(q<HTMLInputElement>('agree').disabled).toBeTrue();
    expect(q<HTMLButtonElement>('extra').disabled).toBeTrue();
    expect(el.querySelector('form')!.hasAttribute('data-busy-fields')).toBeTrue();
  });

  it('keeps the values and does not emit valueChanges', () => {
    const { fixture, host } = setup();
    const emitted: unknown[] = [];
    host.form.valueChanges.subscribe((v) => emitted.push(v));
    host.busy.set(true);
    fixture.detectChanges();
    host.busy.set(false);
    fixture.detectChanges();
    expect(emitted).toEqual([]);
    expect(host.form.getRawValue()).toEqual({ name: 'Ana', note: 'x', agree: true });
    expect(host.form.pristine).toBeTrue();
  });

  it('gives the fields back as they were, a disabled one stays disabled', () => {
    const { fixture, host, q, el } = setup();
    host.busy.set(true);
    fixture.detectChanges();
    host.busy.set(false);
    fixture.detectChanges();
    expect(q<HTMLInputElement>('name').readOnly).toBeFalse();
    expect(q<HTMLInputElement>('agree').disabled).toBeFalse();
    expect(q<HTMLButtonElement>('extra').disabled).toBeFalse();
    expect(q<HTMLInputElement>('locked').disabled).toBeTrue();
    expect(el.querySelector('form')!.hasAttribute('data-busy-fields')).toBeFalse();
  });
});
