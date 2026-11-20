import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

// La barra fina de «abriendo…» arriba de la pantalla. Una navegación puede tardar (un módulo que se descarga, un guard que pregunta al servidor): mientras tanto la barra
// avisa que el clic funcionó. Vive en la raíz de la app, no en el layout, para que también se vea al entrar y salir de las pantallas que están fuera de él (Ajustes).
@Component({
  selector: 'app-navigation-progress',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (navigating()) {
      <div class="pointer-events-none fixed inset-x-0 top-0 z-(--z-popover) h-0.5 overflow-hidden bg-tint-strong" role="progressbar" aria-busy="true" [attr.aria-label]="'COMMON.LOADING' | translate" data-testid="navigation-progress">
        <div class="h-full w-1/3 animate-[navbar_1.1s_var(--ease-out)_infinite] rounded-full bg-action motion-reduce:w-full motion-reduce:animate-none"></div>
      </div>
    }
  `,
})
export class NavigationProgress {
  readonly navigating = signal(false);

  constructor() {
    inject(Router)
      .events.pipe(takeUntilDestroyed())
      .subscribe((event) => {
        if (event instanceof NavigationStart) this.navigating.set(true);
        else if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) this.navigating.set(false);
      });
  }
}
