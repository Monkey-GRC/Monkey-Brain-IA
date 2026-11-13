import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

// El círculo que gira durante un PROCESO largo (conectar un proveedor, ejecutar una evaluación) (D116). No es para cargar datos: las tablas, campos, tarjetas y paneles que
// esperan datos usan `app-skeleton` (o `loading` en `app-data-table`), y los botones que lanzan una acción usan la directiva `appBusy`. Sin texto, a propósito (solo se
// anuncia a los lectores de pantalla). Con `prefers-reduced-motion` no gira.
@Component({
  selector: 'app-loading-spinner',
  imports: [TranslatePipe],
  template: `
    <div class="flex items-center justify-center py-16" role="status" [attr.aria-label]="'COMMON.LOADING' | translate">
      <span class="material-symbols-rounded motion-safe:animate-spin text-action" [style.font-size.px]="size()" aria-hidden="true">progress_activity</span>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingSpinner {
  readonly size = input(40);
}
