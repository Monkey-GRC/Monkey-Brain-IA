import { ChangeDetectionStrategy, Component, ElementRef, effect, input, output, viewChild } from '@angular/core';
import { pushOverlay, takeEscape } from '@shared/presentation/components/overlay-stack/overlay-stack';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
// Las clases van completas (Tailwind las lee del código tal cual).
const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-4xl',
  wide: 'max-w-2xl',
  max: 'max-w-6xl',
  // El detalle corto (un activo descubierto, una evidencia requerida del catálogo): centrado, de alto fijo, a pantalla completa por debajo de md (768 px).
  'detail-compact': 'max-w-2xl h-[min(31rem,calc(100dvh-2rem))] max-md:h-dvh max-md:max-h-dvh max-md:max-w-none max-md:rounded-none max-md:border-0',
  // El modal auxiliar sobre un panel de detalle (patrón 19, Rod 2026-11-27: las brechas de una prueba): centrado, ancho y de alto fijo; a pantalla completa por debajo de md.
  'detail-wide': 'max-w-6xl h-[min(52rem,calc(100dvh-2rem))] max-md:h-dvh max-md:max-h-dvh max-md:max-w-none max-md:rounded-none max-md:border-0',
  // El panel lateral del detalle (MD-499, decisión de Rod: «la barra lateral de antes, solo que más ancha»): pegado a la derecha, a todo el alto, sin margen ni radio,
  // con borde izquierdo; min(80vw, 80rem) desde lg y la pantalla entera por debajo de lg (1024 px). Entra desde la derecha (`mk-drawer-in`).
  drawer: 'h-dvh max-h-dvh lg:w-[min(80vw,80rem)]',
  // El mismo panel lateral con un ancho contenido (56 rem, ~900 px; la pantalla entera si no cabe): un detalle que se lee en una columna (el catálogo de Admin).
  'drawer-narrow': 'h-dvh max-h-dvh max-w-[56rem]',
} as const;

export type ModalSize = keyof typeof SIZES;

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
  readonly size = input<ModalSize>('md');
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

  // Centrado con 16 px de margen; el panel lateral va pegado a la derecha, sin margen; el detalle corto pierde el margen donde pasa a pantalla completa.
  get backdropClass(): string {
    if (this.isDrawer) return 'justify-end';
    return this.size() === 'detail-compact' || this.size() === 'detail-wide' ? 'items-center justify-center p-4 max-md:p-0' : 'items-center justify-center p-4';
  }

  private get isDrawer(): boolean {
    return this.size() === 'drawer' || this.size() === 'drawer-narrow';
  }

  get panelClass(): string {
    const frame = this.isDrawer ? 'mk-drawer-in border-l' : 'mk-modal-in rounded-panel border';
    const height = this.isDrawer || this.size() === 'detail-compact' || this.size() === 'detail-wide' ? '' : 'max-h-[calc(100dvh-2rem)]';
    return `${frame} ${this.sizeClass} ${height} ${this.padded() ? 'overflow-y-auto p-6' : 'flex flex-col overflow-hidden'}`;
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
