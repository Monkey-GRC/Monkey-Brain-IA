import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

// El «ojito» de una contraseña: se coloca dentro de un contenedor `relative` que tenga la etiqueta arriba y el campo debajo, y el campo
// cambia su `type` según `visible`. Uso: `<app-password-toggle [(visible)]="showPassword" />` + `[type]="showPassword() ? 'text' : 'password'"`.
@Component({
  selector: 'app-password-toggle',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      (click)="visible.set(!visible())"
      [attr.aria-pressed]="visible()"
      [attr.aria-label]="(visible() ? 'COMMON.HIDE_PASSWORD' : 'COMMON.SHOW_PASSWORD') | translate"
      class="absolute right-1.5 top-7 md:top-[30px] inline-flex h-9 w-9 items-center justify-center rounded-control text-ink-muted transition-colors hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-action/50"
    >
      <span class="material-symbols-rounded text-[20px] md:text-[22px] leading-none">{{ visible() ? 'visibility_off' : 'visibility' }}</span>
    </button>
  `,
})
export class PasswordToggle {
  readonly visible = model(false);
}
