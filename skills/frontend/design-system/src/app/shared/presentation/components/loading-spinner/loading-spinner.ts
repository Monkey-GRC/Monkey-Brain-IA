import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

// El círculo que gira mientras responde la API. Sin texto, a propósito (solo se anuncia a los lectores de pantalla). Se usa en las pantallas que cargan datos;
// los botones que llaman a la API ya muestran el suyo.
@Component({
  selector: 'app-loading-spinner',
  imports: [TranslatePipe],
  template: `
    <div class="flex items-center justify-center py-16" role="status" [attr.aria-label]="'COMMON.LOADING' | translate">
      <span class="material-symbols-rounded animate-spin text-action" [style.font-size.px]="size()" aria-hidden="true">progress_activity</span>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingSpinner {
  readonly size = input(40);
}
