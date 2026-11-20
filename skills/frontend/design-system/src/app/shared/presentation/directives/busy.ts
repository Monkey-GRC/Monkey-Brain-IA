import { Directive, ElementRef, OnDestroy, Renderer2, Signal, effect, inject, input, isSignal } from '@angular/core';

/**
 * A button that launches a process (D116): while `appBusy` is true it shows a spinner inside, says `aria-busy="true"` and `aria-disabled="true"`, keeps its width (the measured one
 * is fixed as `min-width` before it fills) and ignores clicks, Enter and Space (and so the submit of a form: the implicit submission of an Enter in a field is a click on the submit
 * button, which is cancelled). It does NOT touch the `disabled` property and does not take the focus away: the `[disabled]` binding of the screen always rules, before, during and
 * after. The text does not change unless a translated `busyLabel` is given. It works with `mk-btn`, `mk-btn-secondary` and `mk-btn-danger` (the `[aria-busy='true']` rules of
 * `styles.css` keep their colours while busy) and with the buttons of `app-confirm-dialog` and `app-form-modal`.
 *
 *   <button type="button" class="mk-btn" [appBusy]="saving()" (click)="save()">{{ 'COMMON.SAVE' | translate }}</button>
 *
 * Keep the state on until the API answers (and, if the action navigates, until the route changes); on error, turn it off and show the error. If the button has a leading icon
 * (`material-symbols-rounded`), the spinner takes its place; otherwise it goes first. `busyLabel` replaces the button's direct text while busy (not text inside child elements).
 * When it ends it removes only what it put (`aria-busy`, `aria-disabled` if it was not there, `min-width`, spinner, label). Do not write `animate-spin` by hand in a screen: use this.
 */
@Directive({ selector: 'button[appBusy]' })
export class Busy implements OnDestroy {
  readonly appBusy = input<boolean | Signal<boolean> | null | undefined>(false);
  // Optional text for the button while busy (already translated).
  readonly busyLabel = input<string | null>(null);

  private readonly el = inject<ElementRef<HTMLButtonElement>>(ElementRef).nativeElement;
  private readonly renderer = inject(Renderer2);
  private active = false;
  private spinner: HTMLElement | null = null;
  private hiddenIcon: HTMLElement | null = null;
  private saved: { ariaDisabled: string | null; minWidth: string } | null = null;
  private texts: { node: Text; value: string }[] = [];
  private readonly block = (event: Event): void => {
    if (!this.active) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  };

  private readonly blockKey = (event: KeyboardEvent): void => {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') this.block(event);
  };

  constructor() {
    // Capture phase: it runs before the handlers of the screen, which never see a click or an Enter/Space made while busy.
    this.el.addEventListener('click', this.block, true);
    // Static mark: `appBusyFields` leaves this button to its own directive whatever the order of the effects.
    this.renderer.setAttribute(this.el, 'data-app-busy', '');
    this.el.addEventListener('keydown', this.blockKey, true);
    this.el.addEventListener('keyup', this.blockKey, true);
    effect(() => {
      const value = this.appBusy();
      const busy = !!(isSignal(value) ? value() : value);
      const label = this.busyLabel();
      if (busy) this.enter(label);
      else this.leave();
    });
  }

  ngOnDestroy(): void {
    this.el.removeEventListener('click', this.block, true);
    this.el.removeEventListener('keydown', this.blockKey, true);
    this.el.removeEventListener('keyup', this.blockKey, true);
  }

  private enter(label: string | null): void {
    if (!this.active) {
      this.active = true;
      this.saved = { ariaDisabled: this.el.getAttribute('aria-disabled'), minWidth: this.el.style.minWidth };
      const width = this.el.getBoundingClientRect().width;
      if (width > 0) this.renderer.setStyle(this.el, 'min-width', `${width}px`);
      this.renderer.setAttribute(this.el, 'aria-disabled', 'true');
      this.renderer.setAttribute(this.el, 'aria-busy', 'true');
      this.addSpinner();
    }
    this.applyLabel(label);
  }

  private leave(): void {
    if (!this.active) return;
    this.active = false;
    this.restoreTexts();
    this.spinner?.remove();
    this.spinner = null;
    this.hiddenIcon?.classList.remove('hidden');
    this.hiddenIcon = null;
    this.renderer.removeAttribute(this.el, 'aria-busy');
    const saved = this.saved;
    this.saved = null;
    if (!saved) return;
    if (saved.ariaDisabled === null) this.renderer.removeAttribute(this.el, 'aria-disabled');
    else this.renderer.setAttribute(this.el, 'aria-disabled', saved.ariaDisabled);
    if (saved.minWidth) this.renderer.setStyle(this.el, 'min-width', saved.minWidth);
    else this.renderer.removeStyle(this.el, 'min-width');
  }

  private addSpinner(): void {
    const spinner = this.renderer.createElement('span') as HTMLElement;
    spinner.className = 'material-symbols-rounded motion-safe:animate-spin text-[20px] leading-none';
    spinner.setAttribute('aria-hidden', 'true');
    spinner.setAttribute('data-busy-spinner', '');
    spinner.textContent = 'progress_activity';
    const icon = Array.from(this.el.children).find((c) => c.classList.contains('material-symbols-rounded')) as HTMLElement | undefined;
    if (icon) {
      icon.classList.add('hidden');
      this.hiddenIcon = icon;
      this.renderer.insertBefore(this.el, spinner, icon);
    } else {
      this.renderer.insertBefore(this.el, spinner, this.el.firstChild);
    }
    this.spinner = spinner;
  }

  private applyLabel(label: string | null): void {
    this.restoreTexts();
    if (!label) return;
    const nodes = Array.from(this.el.childNodes).filter((n): n is Text => n.nodeType === Node.TEXT_NODE && !!n.nodeValue?.trim());
    nodes.forEach((node, i) => {
      this.texts.push({ node, value: node.nodeValue ?? '' });
      node.nodeValue = i === 0 ? label : '';
    });
  }

  private restoreTexts(): void {
    for (const { node, value } of this.texts) node.nodeValue = value;
    this.texts = [];
  }
}
