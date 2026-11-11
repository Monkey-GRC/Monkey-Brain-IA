import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Modal } from '@shared/presentation/components/modal/modal';

// Cuánto ocupa de ancho un carácter, en `em`, con holgura (la «@», las «m» y las «w» son más anchas que el promedio): así lo que se calcula nunca se queda corto.
const CHAR_WIDTH_EM = 0.62;
const HIGHLIGHT_PADDING = '2.25rem'; // el relleno horizontal del recuadro (1rem a cada lado) y su borde

/**
 * El tamaño de letra con el que un dato destacado cabe EN UNA SOLA LÍNEA: el ancho del recuadro (`cqw`, que mide el contenedor) repartido entre los caracteres del dato.
 * Con un correo corto llega al tamaño normal (1rem); con uno largo baja hasta un mínimo legible (0.75rem). Un correo nunca se parte en dos líneas.
 */
export function highlightFontSize(text: string): string {
  const width = Math.max(text.length, 1) * CHAR_WIDTH_EM;
  return `clamp(0.75rem, calc((100cqw - ${HIGHLIGHT_PADDING}) / ${width.toFixed(2)}), 1rem)`;
}

// Un aviso que la persona debe ver antes de seguir: un título, un mensaje corto, un dato destacado opcional (un correo, un código), una nota opcional y un botón para
// cerrarlo. No sabe de qué trata; el texto lo pone quien lo usa. Lo importante va en `highlight`, no dentro de una frase larga.
//   <app-notice-dialog [open]="enviado" [title]="…" [message]="…" [highlight]="correo" [closeLabel]="…" (closed)="enviado = false" />
@Component({
  selector: 'app-notice-dialog',
  imports: [Modal],
  templateUrl: './notice-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoticeDialog {
  readonly open = input(false);
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  // El dato que la persona debe ver y reconocer de un vistazo (p. ej. el correo al que se envió algo): va en un recuadro propio.
  readonly highlight = input<string | null>(null);
  readonly hint = input<string | null>(null);
  readonly closeLabel = input.required<string>();

  readonly closed = output<void>();

  readonly highlightSize = computed(() => highlightFontSize(this.highlight() ?? ''));
}
