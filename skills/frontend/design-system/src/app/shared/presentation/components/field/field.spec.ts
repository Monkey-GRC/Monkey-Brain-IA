import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { Field } from './field';

@Component({
  imports: [Field],
  template: `<app-field labelKey="TEST.LABEL" forId="email" [hintKey]="hint" [errorKey]="error"><input id="email" /></app-field>`,
})
class Host {
  hint: string | null = 'TEST.HINT';
  error: string | null = null;
}

describe('Field', () => {
  it('puts the label above the control and links it by id', () => {
    TestBed.configureTestingModule({ imports: [Host], providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const label = el.querySelector('label')!;
    expect(label.getAttribute('for')).toBe('email');
    expect(label.textContent).toContain('TEST.LABEL');
    expect(label.compareDocumentPosition(el.querySelector('input')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(el.querySelector('#email-hint')!.textContent).toContain('TEST.HINT');
    expect(el.querySelector('#email-error')).toBeNull();
  });

  it('shows the error as an alert only when there is one', () => {
    TestBed.configureTestingModule({ imports: [Host], providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.error = 'TEST.ERROR';
    fixture.detectChanges();
    const error = (fixture.nativeElement as HTMLElement).querySelector('#email-error')!;
    expect(error.getAttribute('role')).toBe('alert');
    expect(error.textContent).toContain('TEST.ERROR');
  });
});
