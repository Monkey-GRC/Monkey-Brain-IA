import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export interface ChipOption {
  value: string;
  label: string;
  // Imagen redonda a la izquierda del texto: nombre de un archivo de `public/images/flags/` (sin la extensión).
  flag?: string;
  // Icono (Material Symbols) cuando no hay imagen, por ejemplo «global».
  symbol?: string;
}

// Opciones como botones de borde fino que se tocan para elegir: más rápidas y amables que una lista
// desplegable cuando hay pocas opciones. Sirve para elegir una (`multiple = false`) o varias.
// No decide nada: solo avisa qué opción se tocó y quien la usa aplica la regla.
@Component({
  selector: 'app-option-chips',
  templateUrl: './option-chips.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionChips {
  readonly options = input.required<ChipOption[]>();
  readonly selected = input<string[]>([]);
  readonly multiple = input(false);
  readonly ariaLabel = input('Opciones');
  // Más bajas, para una barra de herramientas encima de una tabla.
  readonly compact = input(false);

  readonly picked = output<string>();

  private readonly selectedSet = computed(() => new Set(this.selected()));

  isSelected(value: string): boolean {
    return this.selectedSet().has(value);
  }
}
