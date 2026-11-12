import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

// `label` es una clave de i18n.
export interface StepperItem { icon: string; label: string }

// Pasos de un recorrido: un círculo con el icono de cada paso unidos por una línea; los hechos llevan check, el actual resalta y los siguientes quedan apagados.
//   <app-stepper [steps]="[{ icon: 'qr_code_scanner', label: 'AUTH.MFA.STEP_SCAN' }]" [current]="1" [ariaLabel]="'Paso 1 de 4'" />
// `current` es el paso en curso, desde 1.
@Component({
  selector: 'app-stepper',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <ol class="flex items-start" [attr.aria-label]="ariaLabel()">
      @for (step of steps(); track $index; let i = $index; let first = $first; let last = $last) {
        <li class="flex min-w-0 flex-1 flex-col items-center gap-1.5" [attr.aria-current]="i + 1 === current() ? 'step' : null">
          <div class="flex w-full items-center">
            <span class="h-0.5 flex-1 rounded-full transition-colors" [class]="first ? 'opacity-0' : line(i + 1 <= current())"></span>
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all" [class]="circle(i + 1)">
              <span class="material-symbols-rounded text-[20px]" aria-hidden="true">{{ i + 1 < current() ? 'check' : step.icon }}</span>
            </span>
            <span class="h-0.5 flex-1 rounded-full transition-colors" [class]="last ? 'opacity-0' : line(i + 1 < current())"></span>
          </div>
          <span class="max-w-full truncate px-1 text-[11px]" [class]="i + 1 === current() ? 'font-semibold text-action' : i + 1 < current() ? 'font-medium text-action' : 'font-medium text-ink-faint'">{{ step.label | translate }}</span>
        </li>
      }
    </ol>
  `,
})
export class Stepper {
  readonly steps = input.required<StepperItem[]>();
  readonly current = input.required<number>();
  readonly ariaLabel = input('');

  line(done: boolean): string {
    return done ? 'bg-action' : 'bg-line';
  }

  circle(n: number): string {
    if (n < this.current()) return 'border-action bg-action text-white';
    if (n === this.current()) return 'border-action bg-tint text-action ring-4 ring-action/20';
    return 'border-line text-ink-faint';
  }
}
