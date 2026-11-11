import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { CheckState, PasswordCheckKey, passwordChecks } from '@shared/domain/utils/password-rules';

const ICONS: Record<CheckState, string> = { ok: 'check_circle', bad: 'cancel', idle: 'radio_button_unchecked' };
const STATE_KEYS: Record<CheckState, string> = { ok: 'MET', bad: 'MISMATCH', idle: 'PENDING' };

// La guía de la contraseña nueva: lista qué debe cumplir y se va marcando sola mientras la persona escribe. No sabe en qué pantalla está; solo recibe lo que se escribió:
// la contraseña, su confirmación y —únicamente donde existe una contraseña actual— esa contraseña actual. Con `current` en null (primer ingreso, recuperar con el
// enlace) no hay con qué comparar, así que «ser distinta de la actual» no aparece.
@Component({
  selector: 'app-password-guide',
  imports: [TranslatePipe],
  templateUrl: './password-guide.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class PasswordGuide {
  readonly password = input('');
  readonly confirmation = input('');
  readonly current = input<string | null>(null);
  readonly compact = input(false);
  readonly guideId = input('password-guide');

  readonly checks = computed(() => passwordChecks(this.password(), this.confirmation(), this.current()));

  labelKey(key: PasswordCheckKey): string {
    return `COMMON.PASSWORD.GUIDE.${key.toUpperCase()}`;
  }

  icon(state: CheckState): string {
    return ICONS[state];
  }

  stateKey(state: CheckState): string {
    return `COMMON.PASSWORD.GUIDE.${STATE_KEYS[state]}`;
  }
}
