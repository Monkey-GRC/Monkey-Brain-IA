import { TestBed } from '@angular/core/testing';
import { initialsOf, PersonCell } from './person-cell';

describe('PersonCell', () => {
  it('shows the initials, the name, the second line and the hint', () => {
    const fixture = TestBed.createComponent(PersonCell);
    fixture.componentRef.setInput('name', 'Ana Pérez Gómez');
    fixture.componentRef.setInput('secondary', 'ana@acme.test');
    fixture.componentRef.setInput('hint', 'Tú');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-avatar]')!.textContent!.trim()).toBe('AP');
    expect(el.querySelector('[data-avatar]')!.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelector('[data-person-name]')!.textContent).toContain('Ana Pérez Gómez');
    expect(el.querySelector('[data-person-secondary]')!.textContent).toContain('ana@acme.test');
    expect(el.querySelector('[data-person-hint]')!.textContent).toContain('Tú');
  });

  it('takes the initials from the email when there is no name, and has no second line without one', () => {
    const fixture = TestBed.createComponent(PersonCell);
    fixture.componentRef.setInput('name', 'luis.mora@acme.test');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('[data-avatar]')!.textContent!.trim()).toBe('LM');
    expect((fixture.nativeElement as HTMLElement).querySelector('[data-person-secondary]')).toBeNull();
  });

  it('gives a question mark when there is nothing to take initials from', () => {
    expect(initialsOf('')).toBe('?');
  });
});
