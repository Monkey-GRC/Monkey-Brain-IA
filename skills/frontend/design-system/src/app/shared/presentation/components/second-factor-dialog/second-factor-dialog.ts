import { ChangeDetectionStrategy, Component, effect, input, output, signal, untracked, viewChild } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Modal } from '@shared/presentation/components/modal/modal';
import { SecondFactorField } from '@shared/presentation/components/second-factor-field/second-factor-field';

export interface SecondFactorAnswer {
  code?: string;
  recovery_code?: string;
}

// El modal que pide el segundo factor justo antes de CUALQUIER acción sensible: la persona llena lo que sea que deba llenar y, cuando todo está bien, aquí confirma con el
// código de su app. No sabe de qué acción se trata: el título, la descripción y el botón los pone quien lo usa. El padre decide cuándo abrirlo (`open`), hace la llamada con la respuesta (`confirmed`) y le devuelve el error
// (`errorMessage`) para que se vea sin cerrar el modal. Con 6 dígitos del código de la app se envía solo; el código de recuperación lleva su botón.
@Component({
  selector: 'app-second-factor-dialog',
  imports: [TranslatePipe, Modal, SecondFactorField],
  templateUrl: './second-factor-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecondFactorDialog {
  readonly open = input(false);
  readonly title = input.required<string>();
  readonly description = input<string | null>(null);
  readonly confirmLabel = input.required<string>();
  readonly loading = input(false);
  readonly errorMessage = input<string | null>(null);
  readonly allowRecovery = input(true);
  // Una acción grave (archivar una empresa): el botón de confirmar va en rojo.
  readonly danger = input(false);

  readonly confirmed = output<SecondFactorAnswer>();
  readonly cancelled = output<void>();

  readonly code = signal('');
  readonly recoveryCode = signal('');
  readonly useRecovery = signal(false);

  private readonly factor = viewChild(SecondFactorField);
  // El último código de 6 dígitos que se envió solo: si el servidor lo rechaza, no se reenvía el mismo hasta que la persona lo cambie.
  private lastAutoSent = '';

  constructor() {
    // Cada vez que se abre, empieza limpio.
    effect(() => {
      if (!this.open()) return;
      this.code.set('');
      this.recoveryCode.set('');
      this.useRecovery.set(false);
      this.lastAutoSent = '';
    });

    // Un código es de un solo uso: si el servidor lo rechaza, se vacía para escribir el siguiente y el cursor vuelve al campo.
    effect(() => {
      if (!this.open() || !this.errorMessage()) return;
      untracked(() => {
        this.code.set('');
        this.recoveryCode.set('');
      });
      setTimeout(() => this.factor()?.focus());
    });

    effect(() => {
      const value = this.code().trim();
      if (value.length < 6) {
        this.lastAutoSent = '';
        return;
      }
      if (!this.open() || this.useRecovery() || this.loading() || value === this.lastAutoSent) return;
      this.lastAutoSent = value;
      this.confirmed.emit({ code: value });
    });
  }

  get canConfirm(): boolean {
    return this.useRecovery() ? this.recoveryCode().trim().length >= 10 : this.code().trim().length >= 6;
  }

  confirm(): void {
    if (this.loading() || !this.canConfirm) return;
    this.confirmed.emit(this.useRecovery() ? { recovery_code: this.recoveryCode().trim() } : { code: this.code().trim() });
  }

  // No se cancela mientras la llamada está en curso: la persona perdería el resultado de algo que ya se envió.
  cancel(): void {
    if (this.open() && !this.loading()) this.cancelled.emit();
  }
}
