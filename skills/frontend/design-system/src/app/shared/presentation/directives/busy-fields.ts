import { Directive, ElementRef, OnDestroy, Renderer2, effect, inject, input } from '@angular/core';

interface Held {
  disabled: boolean;
  readOnly: boolean;
}

// Text-like inputs are held with `readonly` (still focusable and readable); everything else (checkbox, radio, file, range, select, buttons) is `disabled`.
const TEXT_TYPES = new Set(['text', 'email', 'search', 'tel', 'url', 'password', 'number', 'date', 'datetime-local', 'month', 'time', 'week']);

/**
 * Holds the controls of a container as read-only while a process runs (D116), without touching the forms: it sets the DOM `readonly` or `disabled` on the controls and gives them
 * back as they were, so the `FormControl` keeps its value and nothing is emitted by `valueChanges`. Put it on the form (or on any block with fields) next to the `appBusy` button:
 *
 *   <form [appBusyFields]="saving()" (submit)="save()"> …fields… <button type="submit" class="mk-btn" [appBusy]="saving()">…</button> </form>
 *
 * Text inputs and textareas become `readonly`; checkboxes, radios, selects and buttons (including the trigger of `app-select`) become `disabled`. Controls already disabled stay so
 * afterwards, and an `appBusy` button (`data-app-busy`) is left to its own directive. Controls added while busy are not held. `app-form-modal` uses it with its `busy` input.
 */
@Directive({ selector: '[appBusyFields]' })
export class BusyFields implements OnDestroy {
  readonly appBusyFields = input<boolean | null | undefined>(false);

  private on = false;
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly renderer = inject(Renderer2);
  private readonly held = new Map<HTMLElement, Held>();

  constructor() {
    effect(() => {
      const busy = !!this.appBusyFields();
      if (busy) this.hold();
      else this.release();
    });
  }

  ngOnDestroy(): void {
    this.release();
  }

  private hold(): void {
    if (this.on) return;
    this.on = true;
    this.renderer.setAttribute(this.el, 'data-busy-fields', '');
    const controls = this.el.querySelectorAll<HTMLInputElement & HTMLButtonElement>('input, textarea, select, button');
    controls.forEach((c) => {
      if (c.hasAttribute('data-app-busy') || c.getAttribute('aria-busy') === 'true') return;
      this.held.set(c, { disabled: c.disabled, readOnly: 'readOnly' in c ? c.readOnly : false });
      const isText = c.tagName === 'TEXTAREA' || (c.tagName === 'INPUT' && TEXT_TYPES.has(c.type));
      if (isText) this.renderer.setProperty(c, 'readOnly', true);
      else this.renderer.setProperty(c, 'disabled', true);
    });
  }

  private release(): void {
    if (!this.on) return;
    this.on = false;
    this.renderer.removeAttribute(this.el, 'data-busy-fields');
    this.held.forEach((was, c) => {
      if ('readOnly' in c) this.renderer.setProperty(c, 'readOnly', was.readOnly);
      this.renderer.setProperty(c, 'disabled', was.disabled);
    });
    this.held.clear();
  }
}
