import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

// `label` y `description` son claves de i18n. Sin `icon`, el círculo lleva el número del paso.
export interface StepperItem { icon?: string; label: string; description?: string }

// Pasos de un recorrido: un círculo (icono o número) por paso unidos por una línea. Los hechos llevan check y la línea llena, el actual resalta y los siguientes quedan apagados.
//   <app-stepper [steps]="[{ icon: 'qr_code_scanner', label: 'AUTH.MFA.STEP_SCAN' }]" [current]="1" [ariaLabel]="'Paso 1 de 4'" />
//   <app-stepper orientation="vertical" [steps]="steps" [current]="3" [navigable]="true" (stepSelected)="goTo($event)" />
// `current` es el paso en curso, desde 1. `orientation`: horizontal (defecto; etiqueta bajo el círculo, envuelve hasta 2 líneas y lleva `title`) o vertical (círculo a la izquierda, línea vertical, etiqueta y `description` a la derecha).
// `navigable`: los pasos ya hechos son clicables y emiten `stepSelected` con su índice desde 0 (`disabled` los bloquea). Con `prefers-reduced-motion` no hay transiciones.
@Component({
  selector: 'app-stepper',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @if (orientation() === 'vertical') {
      <ol class="flex flex-col" [attr.aria-label]="ariaLabel()">
        @for (step of steps(); track $index; let i = $index; let last = $last) {
          <li class="relative flex gap-3" [attr.aria-current]="i + 1 === current() ? 'step' : null" [attr.data-step]="i">
            <div class="flex flex-col items-center">
              <span class="flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300 motion-reduce:transition-none" [class]="circle(i + 1)">
                @if (i + 1 < current()) {
                  <span class="material-symbols-rounded text-[18px]" aria-hidden="true">check</span>
                } @else if (step.icon) {
                  <span class="material-symbols-rounded text-[18px]" aria-hidden="true">{{ step.icon }}</span>
                } @else {
                  <span aria-hidden="true">{{ i + 1 }}</span>
                }
              </span>
              @if (!last) {
                <span class="my-1 min-h-4 w-0.5 flex-1 overflow-hidden rounded-full bg-line">
                  <span class="block w-full bg-action transition-all duration-500 motion-reduce:transition-none" [style.height.%]="i + 1 < current() ? 100 : 0"></span>
                </span>
              }
            </div>
            <div class="min-w-0 flex-1 pt-1.5" [class.pb-5]="!last">
              @if (selectable(i)) {
                <button type="button" (click)="stepSelected.emit(i)" class="text-left text-sm [overflow-wrap:anywhere] after:absolute after:inset-0 after:rounded-control focus:outline-none focus-visible:after:ring-2 focus-visible:after:ring-action/40" [class]="vLabel(i + 1)">{{ step.label | translate }}</button>
              } @else {
                <span class="block text-sm [overflow-wrap:anywhere]" [class]="vLabel(i + 1)">{{ step.label | translate }}</span>
              }
              @if (step.description) {
                <p class="mt-0.5 text-xs text-ink-muted [overflow-wrap:anywhere]">{{ step.description | translate }}</p>
              }
            </div>
          </li>
        }
      </ol>
    } @else {
      <ol class="flex items-start" [attr.aria-label]="ariaLabel()">
        @for (step of steps(); track $index; let i = $index; let first = $first; let last = $last) {
          <li class="relative flex min-w-0 flex-1 flex-col items-center gap-1.5" [attr.aria-current]="i + 1 === current() ? 'step' : null" [attr.data-step]="i">
            <div class="flex w-full items-center">
              <span class="h-0.5 flex-1 overflow-hidden rounded-full" [class]="first ? 'opacity-0' : 'bg-line'">
                <span class="block h-full bg-action transition-all duration-500 motion-reduce:transition-none" [style.width.%]="i + 1 <= current() ? 100 : 0"></span>
              </span>
              <span class="flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all duration-300 motion-reduce:transition-none sm:size-10 sm:text-sm" [class]="circle(i + 1)">
                @if (i + 1 < current()) {
                  <span class="material-symbols-rounded text-[18px] sm:text-[20px]" aria-hidden="true">check</span>
                } @else if (step.icon) {
                  <span class="material-symbols-rounded text-[18px] sm:text-[20px]" aria-hidden="true">{{ step.icon }}</span>
                } @else {
                  <span aria-hidden="true">{{ i + 1 }}</span>
                }
              </span>
              <span class="h-0.5 flex-1 overflow-hidden rounded-full" [class]="last ? 'opacity-0' : 'bg-line'">
                <span class="block h-full bg-action transition-all duration-500 motion-reduce:transition-none" [style.width.%]="i + 1 < current() ? 100 : 0"></span>
              </span>
            </div>
            @if (selectable(i)) {
              <button type="button" (click)="stepSelected.emit(i)" [title]="step.label | translate" class="line-clamp-2 max-w-full px-1 text-center text-xs leading-tight [overflow-wrap:anywhere] after:absolute after:inset-0 focus:outline-none focus-visible:after:ring-2 focus-visible:after:ring-action/40" [class]="hLabel(i + 1)">{{ step.label | translate }}</button>
            } @else {
              <span class="line-clamp-2 max-w-full px-1 text-center text-xs leading-tight [overflow-wrap:anywhere]" [class]="hLabel(i + 1)" [attr.title]="step.label | translate">{{ step.label | translate }}</span>
            }
          </li>
        }
      </ol>
    }
  `,
})
export class Stepper {
  readonly steps = input.required<StepperItem[]>();
  readonly current = input.required<number>();
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly ariaLabel = input('');
  readonly navigable = input(false);
  readonly disabled = input(false);
  readonly stepSelected = output<number>();

  selectable(i: number): boolean {
    return this.navigable() && !this.disabled() && i + 1 < this.current();
  }

  circle(n: number): string {
    if (n < this.current()) return 'border-action bg-action text-on-action';
    if (n === this.current()) return 'border-action bg-tint text-action ring-4 ring-action/20';
    return 'border-line text-ink-faint';
  }

  hLabel(n: number): string {
    if (n === this.current()) return 'font-semibold text-action';
    return n < this.current() ? 'font-medium text-action' : 'font-medium text-ink-faint';
  }

  vLabel(n: number): string {
    if (n === this.current()) return 'font-semibold text-action';
    return n < this.current() ? 'font-medium text-ink' : 'font-medium text-ink-faint';
  }
}
