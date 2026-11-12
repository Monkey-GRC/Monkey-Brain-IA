import { ChangeDetectionStrategy, Component, ElementRef, effect, input, output, viewChild } from '@angular/core';
import { pushOverlay, takeEscape } from '@shared/presentation/components/overlay-stack/overlay-stack';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const SIZES = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-4xl', wide: 'max-w-2xl' } as const;

// La base de todos los modales de la app: el fondo oscuro, el panel y lo que un modal bien hecho debe hacer siempre. Lo de adentro lo pone quien lo usa:
//   <app-modal [open]="abierto" labelledBy="mi-titulo" (dismissed)="cerrar()"> <h2 id="mi-titulo">…</h2> … </app-modal>
// Es accesible (role=dialog, aria-modal, foco dentro, Tab que no se escapa, el foco vuelve a donde estaba al cerrar), bloquea el scroll de la página de atrás y pide cerrarse
// con Esc o con un clic en el fondo (`dismissed`); `dismissible` en falso (p. ej. mientras una llamada está en curso) lo impide. No sabe de qué trata el modal.
@Component({
  selector: 'app-modal',
  templateUrl: './modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'onEscape($event)' },
})
export class Modal {
  readonly open = input(false);
  readonly labelledBy = input.required<string>();
  readonly describedBy = input<string | null>(null);
  readonly dismissible = input(true);
  readonly size = input<keyof typeof SIZES>('md');
  // Con `padded` en falso el panel no lleva relleno ni scroll propio: quien lo usa reparte cabecera, cuerpo con scroll y pie fijo (`app-form-modal`).
  readonly padded = input(true);
  // Prefijo de los `data-testid` del fondo (`<id>-backdrop`) y del panel (`<id>-dialog`), para que las pruebas de quien lo usa los encuentren.
  readonly testId = input('modal');

  readonly dismissed = output<void>();

  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  constructor() {
    effect((onCleanup) => {
      if (!this.open()) return;
      const previous = document.activeElement as HTMLElement | null;
      document.body.classList.add('overflow-hidden');
      const release = pushOverlay(this);
      // El foco entra al modal; si quien lo usa ya puso el cursor en un campo (p. ej. el del código), se respeta.
      const timer = setTimeout(() => {
        const root = this.panel()?.nativeElement;
        if (root && !root.contains(document.activeElement)) (root.querySelector<HTMLElement>(FOCUSABLE) ?? root).focus();
      });
      onCleanup(() => {
        clearTimeout(timer);
        release();
        document.body.classList.remove('overflow-hidden');
        previous?.focus?.();
      });
    });
  }

  get sizeClass(): string {
    return SIZES[this.size()];
  }

  get panelClass(): string {
    return `${this.sizeClass} ${this.padded() ? 'overflow-y-auto p-6' : 'flex flex-col overflow-hidden'}`;
  }

  // Esc: solo la capa de arriba lo atiende (un diálogo abierto sobre el modal se lo lleva primero).
  onEscape(event: Event): void {
    if (this.open() && takeEscape(this, event)) this.dismiss();
  }

  dismiss(): void {
    if (this.open() && this.dismissible()) this.dismissed.emit();
  }

  // Se cierra solo si el clic empezó Y terminó en el fondo: arrastrar para seleccionar texto y soltar fuera del panel no debe cerrarlo.
  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.dismiss();
  }

  // El foco no se escapa del modal: Tab del último elemento vuelve al primero y Mayús+Tab del primero va al último.
  trapTab(event: KeyboardEvent): void {
    const root = this.panel()?.nativeElement;
    if (event.key !== 'Tab' || !root) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (!items.length) {
      event.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === root)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
