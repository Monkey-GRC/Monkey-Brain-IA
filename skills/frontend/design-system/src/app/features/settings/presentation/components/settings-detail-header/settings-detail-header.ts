import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

// La cabecera de una pantalla de detalle de Ajustes (a la que se llega con el «>» de una fila): «← Atrás» en la esquina superior izquierda del panel, y debajo el título, el
// subtítulo y, a la derecha, lo que se proyecte (p. ej. el botón principal).
@Component({
  selector: 'app-settings-detail-header',
  imports: [RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block pt-8' },
  template: `
    <!-- «← Atrás» vive en la esquina superior izquierda del panel de la sección (el contenedor relativo de Ajustes), fuera de la columna del contenido, como en el patrón de referencia. -->
    <a [routerLink]="backLink()" data-testid="settings-detail-back"
      class="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-control px-2.5 py-1.5 text-base text-ink-muted transition hover:bg-tint hover:text-ink active:bg-tint-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-action/40">
      <span class="material-symbols-rounded text-[20px]" aria-hidden="true">arrow_back</span>{{ 'SETTINGS.PREVIOUS' | translate }}
    </a>
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-2xl font-semibold text-ink text-balance">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="mt-1 text-base text-ink-muted text-pretty">{{ subtitle() }}</p>
        }
      </div>
      <ng-content />
    </div>
  `,
})
export class SettingsDetailHeader {
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
  readonly backLink = input.required<string>();
}
