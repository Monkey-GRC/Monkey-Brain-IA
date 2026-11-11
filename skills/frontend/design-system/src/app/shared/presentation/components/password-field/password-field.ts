import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

// Un campo de contraseña con su etiqueta y su «ojito» para verla u ocultarla. Cada campo lleva su PROPIO ojito: mostrar uno no muestra los demás. El ojito vive dentro del
// recuadro del campo (no de la etiqueta), así queda centrado verticalmente sin importar el tamaño de la letra. No sabe en qué pantalla está: sirve para la actual, la nueva,
// la confirmación o el inicio de sesión.
@Component({
  selector: 'app-password-field',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './password-field.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class PasswordField {
  readonly control = input.required<FormControl<string>>();
  readonly label = input.required<string>();
  readonly inputId = input.required<string>();
  readonly autocomplete = input<'current-password' | 'new-password'>('current-password');
  readonly describedBy = input<string | null>(null);
  // Las pantallas de acceso (inicio de sesión, activación) usan etiquetas más pequeñas; los formularios de ajustes, no.
  readonly compact = input(false);

  readonly visible = signal(false);
}
