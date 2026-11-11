import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';
import { toDataURL } from 'qrcode';

// Dibuja un QR en el navegador. El contenido (aquí, el secreto del segundo factor) nunca sale a un servicio externo.
@Component({
  selector: 'app-qr-code',
  template: `
    @if (src()) {
      <img [src]="src()" [alt]="label()" [attr.width]="size()" [attr.height]="size()" class="rounded-control bg-surface p-2" />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QrCode {
  readonly value = input.required<string>();
  readonly label = input('');
  readonly size = input(208);
  readonly src = signal('');

  constructor() {
    effect(() => {
      const value = this.value();
      const width = this.size();
      toDataURL(value, { margin: 1, width, errorCorrectionLevel: 'M' })
        .then((url) => this.src.set(url))
        .catch(() => this.src.set(''));
    });
  }
}
