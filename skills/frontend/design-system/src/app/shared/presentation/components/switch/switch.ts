import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * An on/off switch for a setting that applies at once (no «Save» button): a `<button role="switch">` with `aria-checked`, so a screen reader says «on» or «off».
 * It is controlled: it never flips itself, it emits `checkedChange` with the wanted value and the screen decides (it may wait for the server and put it back).
 * Track of 44 × 24 px (`rounded-full`, an exception like the avatar): `line-control` when off and `action` when on (both ≥ 3:1 against `surface`); the thumb (`surface`)
 * slides with `transform` in 150 ms ease-out and jumps with `prefers-reduced-motion`. `busy` keeps its colours and ignores clicks while the change travels (`aria-busy`,
 * `aria-disabled`); `disabled` greys it (`line`). Its name comes from a `<label for="inputId">` next to it, or from `ariaLabelKey`; `describedBy` points to the help line.
 *
 *   <label for="digest-switch">…</label> <app-switch inputId="digest-switch" describedBy="digest-help" [checked]="on()" [busy]="saving()" (checkedChange)="save($event)" />
 */
@Component({
  selector: 'app-switch',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex shrink-0 align-middle' },
  template: `
    @let key = ariaLabelKey();
    <button
      type="button"
      role="switch"
      [id]="inputId()"
      [attr.aria-checked]="checked()"
      [attr.aria-label]="key ? (key | translate) : null"
      [attr.aria-describedby]="describedBy()"
      [attr.aria-busy]="busy() ? 'true' : null"
      [attr.aria-disabled]="busy() ? 'true' : null"
      [attr.data-checked]="checked()"
      [disabled]="disabled()"
      (click)="toggle()"
      class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/25 disabled:cursor-not-allowed disabled:bg-line"
      [class]="track()"
    >
      <span
        class="pointer-events-none inline-block size-5 rounded-full bg-surface transition-transform motion-reduce:transition-none"
        [class]="checked() ? 'translate-x-5' : 'translate-x-0'"
        aria-hidden="true"
        data-switch-thumb
      ></span>
    </button>
  `,
})
export class Switch {
  readonly checked = input(false);
  readonly disabled = input(false);
  /** The value is on its way to the server: same look, clicks ignored. */
  readonly busy = input(false);
  /** `id` of the button, for a `<label for>`. */
  readonly inputId = input<string | null>(null);
  /** Accessible name when there is no `<label for>` (translation key). */
  readonly ariaLabelKey = input<string | null>(null);
  /** `id` of the line that explains the setting. */
  readonly describedBy = input<string | null>(null);

  readonly checkedChange = output<boolean>();

  // Every class is written whole: Tailwind does not see classes built from pieces.
  protected readonly track = computed(() => {
    const fill = this.checked() ? 'bg-action enabled:hover:bg-action-hover' : 'bg-line-control enabled:hover:bg-ink-faint';
    return `${fill} ${this.busy() ? 'cursor-progress' : 'cursor-pointer'}`;
  });

  protected toggle(): void {
    if (this.disabled() || this.busy()) return;
    this.checkedChange.emit(!this.checked());
  }
}
