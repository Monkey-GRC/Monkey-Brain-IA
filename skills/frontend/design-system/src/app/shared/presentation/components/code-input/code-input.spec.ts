import { TestBed } from '@angular/core/testing';
import { CodeInput } from './code-input';

describe('CodeInput', () => {
  function setup() {
    const fixture = TestBed.createComponent(CodeInput);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const emitted: string[] = [];
    fixture.componentInstance.complete.subscribe((c) => emitted.push(c));
    const type = (text: string) => {
      input.value = text;
      input.dispatchEvent(new Event('input'));
    };
    return { fixture, input, emitted, type };
  }

  it('quita lo que no son dígitos y no pasa de seis', () => {
    const { input, type, fixture } = setup();
    type('12 34-56 78');
    expect(input.value).toBe('123456');
    expect(fixture.componentInstance.value()).toBe('123456');
  });

  it('se envía solo al completar el sexto dígito', () => {
    const { emitted, type } = setup();
    type('12345');
    expect(emitted).toEqual([]);
    type('123456');
    expect(emitted).toEqual(['123456']);
  });

  it('pegar un código con espacios lo completa', () => {
    const { emitted, type } = setup();
    type('123 456');
    expect(emitted).toEqual(['123456']);
  });

  it('pide al navegador el autocompletado de códigos de un solo uso', () => {
    const { input } = setup();
    expect(input.getAttribute('autocomplete')).toBe('one-time-code');
    expect(input.getAttribute('inputmode')).toBe('numeric');
  });
});
