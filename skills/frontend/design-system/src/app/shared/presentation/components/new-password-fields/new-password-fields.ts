import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { startWith, switchMap } from 'rxjs';
import { PasswordField } from '@shared/presentation/components/password-field/password-field';
import { PasswordGuide } from '@shared/presentation/components/password-guide/password-guide';

// La contraseña nueva y su confirmación, cada una con su propio ojito, y debajo la guía de lo que debe cumplir. Sirve donde la persona elige una contraseña: cambiarla desde
// Ajustes, recuperarla con el enlace del correo y el primer ingreso (activar la cuenta). El grupo trae `password` y `password_confirmation` y, solo si la pantalla pide la
// actual, `current_password` (entonces la guía también comprueba que sea distinta; sin ella, no). Los validadores del grupo los pone quien lo usa; aquí solo se muestra.
@Component({
  selector: 'app-new-password-fields',
  imports: [TranslatePipe, PasswordField, PasswordGuide],
  templateUrl: './new-password-fields.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewPasswordFields {
  readonly form = input.required<FormGroup>();
  // `stack`: uno bajo el otro (pantallas angostas). `row`: lado a lado desde tablet (formularios anchos).
  readonly layout = input<'stack' | 'row'>('stack');
  // Las pantallas de acceso usan etiquetas pequeñas.
  readonly compact = input(false);
  // Un error de la contraseña que devolvió el servidor, para mostrarlo bajo el primer campo.
  readonly passwordError = input<string | null>(null);

  readonly passwordControl = computed(() => this.form().get('password') as FormControl<string>);
  readonly confirmationControl = computed(() => this.form().get('password_confirmation') as FormControl<string>);

  private readonly values = toSignal(toObservable(this.form).pipe(switchMap((group) => group.valueChanges.pipe(startWith(group.getRawValue())))), {
    initialValue: {} as Record<string, string | null>,
  });

  readonly password = computed(() => this.values()['password'] ?? '');
  readonly confirmation = computed(() => this.values()['password_confirmation'] ?? '');
  // `null` = esta pantalla no tiene contraseña actual.
  readonly current = computed(() => (this.form().get('current_password') ? (this.values()['current_password'] ?? '') : null));
}
