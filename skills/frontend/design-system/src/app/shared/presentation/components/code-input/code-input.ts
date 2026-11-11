import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, input, model, output, viewChild } from '@angular/core';

// Código de 6 dígitos de la app de autenticación: un solo campo (no seis casillas), para que pegar y el autocompletado del teléfono funcionen.
// Se envía solo al completar el sexto dígito.
@Component({
  selector: 'app-code-input',
  template: `
    <input
      #field
      type="text"
      inputmode="numeric"
      autocomplete="one-time-code"
      maxlength="7"
      placeholder="000000"
      [attr.aria-label]="label()"
      [disabled]="disabled()"
      [value]="value()"
      (input)="onInput($event)"
      class="w-full h-14 text-center text-2xl md:text-3xl font-semibold tracking-[0.5em] pl-[0.5em] rounded-control border bg-surface focus:border-action focus:outline-none focus:ring-2 focus:ring-action/20 transition disabled:cursor-not-allowed disabled:bg-tint disabled:text-ink-faint"
      [class]="invalid() ? 'border-bad' : 'border-gray-300 dark:border-gray-700'"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeInput {
  readonly value = model('');
  readonly label = input('');
  readonly disabled = input(false);
  readonly invalid = input(false);
  readonly complete = output<string>();

  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');

  constructor() {
    afterNextRender(() => this.focus());
  }

  focus(): void {
    this.field().nativeElement.focus();
  }

  onInput(event: Event): void {
    const element = event.target as HTMLInputElement;
    const digits = element.value.replace(/\D/g, '').slice(0, 6);
    element.value = digits;
    this.value.set(digits);
    if (digits.length === 6) this.complete.emit(digits);
  }
}
