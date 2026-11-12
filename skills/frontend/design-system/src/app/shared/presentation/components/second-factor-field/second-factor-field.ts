import { ChangeDetectionStrategy, Component, input, model, viewChild } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { CodeInput } from '@shared/presentation/components/code-input/code-input';

// El segundo factor de una acción sensible: el código de 6 dígitos de la app o, si la persona perdió el celular, uno de sus códigos de recuperación. El padre lee
// `code` o `recoveryCode` según `useRecovery`.
@Component({
  selector: 'app-second-factor-field',
  imports: [TranslatePipe, CodeInput],
  templateUrl: './second-factor-field.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecondFactorField {
  readonly code = model('');
  readonly recoveryCode = model('');
  readonly useRecovery = model(false);
  readonly allowRecovery = input(true);
  readonly disabled = input(false);
  readonly invalid = input(false);

  private readonly codeInput = viewChild(CodeInput);

  /** Devuelve el cursor al campo del código de la app (no hace nada si la persona está escribiendo un código de recuperación). */
  focus(): void {
    this.codeInput()?.focus();
  }

  onRecoveryInput(event: Event): void {
    this.recoveryCode.set((event.target as HTMLInputElement).value);
  }

  toggle(): void {
    this.useRecovery.set(!this.useRecovery());
    this.code.set('');
    this.recoveryCode.set('');
  }
}
