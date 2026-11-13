import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Busy } from '@shared/presentation/directives/busy';
import { pushOverlay, takeEscape } from '@shared/presentation/components/overlay-stack/overlay-stack';

let nextId = 0;

// Pide confirmar una acción antes de hacerla. Existe mientras esté en pantalla: se pone dentro de un `@if` y se quita al terminar.
//   @if (confirming()) {
//     <app-confirm-dialog titleKey="..." [titleParams]="{ name }" messageKey="..." tone="danger" [busy]="deleting()"
//       (confirmed)="remove()" (cancelled)="confirming.set(false)" />
//   }
// Teclado: el foco queda dentro (empieza en «Cancelar», lo seguro), Esc cancela (y solo a él: el panel de abajo sigue abierto hasta otro Esc) y al cerrar el foco vuelve a donde estaba.
// Todos los textos son claves de traducción; si no se da `confirmLabelKey`/`cancelLabelKey` usa «Confirmar» y «Cancelar».
@Component({
  selector: 'app-confirm-dialog',
  imports: [A11yModule, TranslatePipe, Busy],
  templateUrl: './confirm-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'onEscape($event)' },
})
export class ConfirmDialog {
  readonly titleKey = input.required<string>();
  readonly titleParams = input<Record<string, unknown>>({});
  readonly messageKey = input<string | null>(null);
  readonly messageParams = input<Record<string, unknown>>({});
  readonly confirmLabelKey = input('COMMON.CONFIRM');
  readonly cancelLabelKey = input('COMMON.CANCEL');
  // `danger` pinta el botón de confirmar en rojo (eliminar, quitar); `primary` en azul; `neutral` como botón secundario (una salida que no pierde nada).
  readonly tone = input<'primary' | 'danger' | 'neutral'>('primary');
  // Mientras la acción corre, «Cancelar» se bloquea, el botón de confirmar queda ocupado (`appBusy`) y no se puede cerrar.
  readonly busy = input(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  protected readonly titleId = `confirm-title-${nextId}`;
  protected readonly messageId = `confirm-message-${nextId++}`;

  constructor() {
    inject(DestroyRef).onDestroy(pushOverlay(this));
  }

  protected onEscape(event: Event): void {
    if (takeEscape(this, event)) this.cancel();
  }

  protected cancel(): void {
    if (!this.busy()) this.cancelled.emit();
  }

  protected confirm(): void {
    if (!this.busy()) this.confirmed.emit();
  }
}
