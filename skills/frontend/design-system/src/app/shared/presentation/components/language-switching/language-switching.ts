import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LoadingSpinner } from '@shared/presentation/components/loading-spinner/loading-spinner';

// Capa a pantalla completa que tapa la app mientras se recarga por un cambio de idioma. El texto llega ya en el idioma de destino (lo resuelve quien la muestra);
// `aria-live` lo anuncia a los lectores de pantalla y el círculo es decorativo.
@Component({
  selector: 'app-language-switching',
  imports: [LoadingSpinner],
  template: `
    <div
      class="fixed inset-0 z-(--z-toast) flex flex-col items-center justify-center gap-2 bg-surface text-ink"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div aria-hidden="true"><app-loading-spinner [size]="48" data-long-process /></div>
      <p class="text-sm font-medium text-ink-muted">{{ message() }}</p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSwitching {
  readonly message = input.required<string>();
}
