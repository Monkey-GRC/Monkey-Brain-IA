import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { map, startWith, switchMap } from 'rxjs';
import { passwordChecks } from '@shared/domain/utils/password-rules';
import { PasswordField } from '@shared/presentation/components/password-field/password-field';
import { PasswordRequirements } from '@shared/presentation/components/password-requirements/password-requirements';

// La contraseña nueva y su confirmación, cada una con su propio ojito. Los requisitos salen en un globo anclado a la contraseña nueva (`app-password-requirements`): aparece al enfocar
// el campo, se muestra SOLO mientras el campo (o su ojito) tiene el foco y se oculta siempre al salir. «Las dos coinciden» no es del globo: es una línea bajo la confirmación.
// Sirve donde la persona elige una contraseña: cambiarla desde Ajustes, recuperarla con el enlace del correo y el primer ingreso. El grupo trae `password` y
// `password_confirmation` y, solo si la pantalla pide la actual, `current_password` (entonces el globo también pide que sea distinta). Los validadores del grupo los pone quien lo usa.
@Component({
  selector: 'app-new-password-fields',
  imports: [TranslatePipe, PasswordField, PasswordRequirements],
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

  private readonly checks = computed(() => passwordChecks(this.password(), this.confirmation(), this.current()));
  // Las reglas de la política (y «distinta de la actual» donde aplica); «coinciden» va aparte.
  readonly rules = computed(() => this.checks().filter((c) => c.key !== 'match'));
  readonly matchState = computed(() => this.checks().find((c) => c.key === 'match')?.state ?? 'idle');
  readonly missing = computed(() => this.rules().filter((c) => c.state !== 'ok').length);
  readonly announcement = computed(() => (this.missing() === 0 ? 'COMMON.PASSWORD.REQUIREMENTS.ALL_MET' : this.missing() === 1 ? 'COMMON.PASSWORD.REQUIREMENTS.REMAINING_ONE' : 'COMMON.PASSWORD.REQUIREMENTS.REMAINING_MANY'));

  // Abierto solo con el foco en la contraseña nueva o su ojito; al pasar el foco a cualquier otro sitio (o hacer clic fuera) se cierra, cumpla o no las reglas.
  readonly open = signal(false);

  // El campo o el formulario deshabilitados (FormControl) cierran el globo: algunos navegadores no disparan `focusout` al deshabilitar el elemento con foco.
  private readonly disabled = toSignal(
    toObservable(this.form).pipe(switchMap((group) => group.statusChanges.pipe(startWith(null), map(() => group.disabled || !!group.get('password')?.disabled)))),
    { initialValue: false },
  );
  private watcher: MutationObserver | null = null;

  constructor() {
    effect(() => {
      if (this.disabled()) this.close();
    });
    inject(DestroyRef).onDestroy(() => this.watcher?.disconnect());
  }

  onFocusIn(event: FocusEvent): void {
    if (this.disabled()) return;
    const box = event.currentTarget as HTMLElement;
    this.open.set(true);
    // `appBusyFields` retiene los campos solo en el DOM (`readonly`/`disabled`), sin tocar el FormControl: se vigila para cerrar el globo.
    if (!this.watcher && typeof MutationObserver !== 'undefined') {
      this.watcher = new MutationObserver(() => {
        const input = box.querySelector('input');
        if (input?.disabled || input?.readOnly) this.close();
      });
      this.watcher.observe(box, { attributes: true, subtree: true, attributeFilter: ['disabled', 'readonly'] });
    }
  }

  onFocusOut(event: FocusEvent): void {
    const box = event.currentTarget as HTMLElement;
    // Del campo a su ojito: sigue dentro.
    if (event.relatedTarget instanceof Node && box.contains(event.relatedTarget)) return;
    this.close();
  }

  private close(): void {
    this.open.set(false);
    this.watcher?.disconnect();
    this.watcher = null;
  }
}
