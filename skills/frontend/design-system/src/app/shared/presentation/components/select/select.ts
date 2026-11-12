import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, Injector, afterNextRender, booleanAttribute, computed, effect, forwardRef, inject, input, linkedSignal, output, signal, viewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { pushOverlay, takeEscape } from '@shared/presentation/components/overlay-stack/overlay-stack';

export interface SelectOption {
  value: string;
  /** Translation key of the option. */
  labelKey?: string;
  /** Parameters of `labelKey` (`{{team}}` in «{{team}} · {{leader}}»). */
  labelParams?: Record<string, unknown>;
  /** Text that is already data (a group name, a person); used when there is no `labelKey`. */
  label?: string;
  disabled?: boolean;
}

interface Place {
  left: number;
  minWidth: number;
  maxWidth: number;
  maxHeight: number;
  /** Distance from the top of the viewport (opens down) or from its bottom (opens up). */
  edge: number;
  up: boolean;
}

let nextId = 0;
const ROW = 36; // px of an option (h-9)
const MAX_HEIGHT = 256; // 16 rem
const GAP = 4;
const MARGIN = 8;

/**
 * The select of Monkey: it replaces the browser's native select element everywhere. A trigger button (value + chevron) and its own panel (surface, 1 px border, soft shadow, system radius)
 * that opens under the button, or over it when there is no room. The panel is moved to `<body>` with `position: fixed`, so it is never clipped by a modal, a drawer or a table.
 * Combobox/listbox pattern: the focus stays on the trigger and the active option is `aria-activedescendant`.
 *
 * Keyboard: Arrows, Home, End move; Enter or Space choose (or open); Esc closes (only the select, not the modal around it); Tab closes and moves on; typing jumps to an option.
 * Outside click closes. `multiple` shows a checkbox per option and keeps the panel open.
 *
 * Works as a form control (`formControlName`, `ngModel`: a string, or `string[]` with `multiple`) and with plain inputs/outputs (`value`/`valueChange`, `values`/`valuesChange`).
 * Values are strings. `emptyLabelKey` adds a first option with the empty value («Todos») for single mode; `summaryKey` names a multiple filter on its trigger with the count.
 *
 *   <app-select inputId="role" [options]="roles" placeholderKey="TEAM.ROLE.PLACEHOLDER" [formControl]="role" />
 *   <app-select [options]="statuses" multiple summaryKey="LIST.FILTER_STATUS" [values]="picked()" (valuesChange)="picked.set($event)" />
 */
@Component({
  selector: 'app-select',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Select), multi: true }],
  host: { class: 'block' },
  template: `
    <button
      #trigger
      type="button"
      role="combobox"
      data-select-trigger
      [id]="inputId()"
      [disabled]="isDisabled()"
      aria-haspopup="listbox"
      [attr.aria-expanded]="open()"
      [attr.aria-controls]="open() ? listId : null"
      [attr.aria-activedescendant]="open() && active() >= 0 ? optionId(active()) : null"
      [attr.aria-label]="ariaLabelKey() ? (ariaLabelKey() | translate) : null"
      [attr.aria-invalid]="invalid() ? 'true' : null"
      class="flex w-full items-center gap-2 rounded-control border bg-surface pl-3 pr-3 text-left text-sm text-ink transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action/20 disabled:cursor-not-allowed disabled:bg-tint disabled:text-ink-faint"
      [class]="(size() === 'sm' ? 'h-9 ' : 'h-10 ') + (invalid() ? 'border-bad' : open() ? 'border-action ring-2 ring-action/20' : 'border-gray-300 hover:border-gray-400 focus-visible:border-action dark:border-gray-700 dark:hover:border-gray-600')"
      (click)="toggle()"
      (keydown)="onKeydown($event)"
      (keyup.space)="$event.preventDefault()"
      (blur)="onTouched()"
    >
      <span class="flex min-w-0 flex-1 items-center gap-2">
        @if (summaryKey(); as key) {
          <span class="truncate">{{ key | translate }}</span>
          @if (count() > 0) {
            <span data-select-count class="rounded-control bg-tint-strong px-1.5 text-xs font-medium leading-5 text-tint-ink">{{ count() }}</span>
          }
        } @else if (multiple()) {
          @switch (chosen().length) {
            @case (0) {
              <span class="truncate text-ink-faint">{{ placeholderKey() ? (placeholderKey() | translate) : '' }}</span>
            }
            @case (1) {
              @let only = chosen()[0];
              <span class="truncate">{{ only.labelKey ? (only.labelKey | translate: only.labelParams) : only.label }}</span>
            }
            @default {
              <span class="truncate">{{ 'COMMON.SELECT.COUNT' | translate: { count: chosen().length } }}</span>
            }
          }
        } @else if (current(); as o) {
          <span class="truncate" [class.text-ink-faint]="o.value === '' && clearable() && !!placeholderKey()">{{ o.value === '' && clearable() && placeholderKey() ? (placeholderKey() | translate) : o.labelKey ? (o.labelKey | translate: o.labelParams) : o.label }}</span>
        } @else {
          <span class="truncate text-ink-faint">{{ placeholderKey() ? (placeholderKey() | translate) : '' }}</span>
        }
      </span>
      <span class="material-symbols-rounded shrink-0 text-[20px] text-ink-muted transition-transform" [class.rotate-180]="open()" aria-hidden="true">expand_more</span>
    </button>

    @if (open()) {
      @let p = place();
      <div
        #panel
        role="listbox"
        data-select-panel
        tabindex="-1"
        [id]="listId"
        [attr.aria-multiselectable]="multiple() ? 'true' : null"
        [attr.aria-label]="ariaLabelKey() ? (ariaLabelKey() | translate) : (summaryKey() ? (summaryKey() | translate) : null)"
        class="mk-enter fixed z-[100003] overflow-y-auto rounded-card border border-line bg-surface p-1 text-sm text-ink shadow-float"
        [style.left.px]="p?.left"
        [style.top.px]="p && !p.up ? p.edge : null"
        [style.bottom.px]="p && p.up ? p.edge : null"
        [style.min-width.px]="p?.minWidth"
        [style.max-width.px]="p?.maxWidth"
        [style.max-height.px]="p?.maxHeight"
        (mousedown)="$event.preventDefault()"
      >
        @for (o of rows(); track o.value; let i = $index) {
          <button
            type="button"
            role="option"
            tabindex="-1"
            data-select-option
            [id]="optionId(i)"
            [attr.data-value]="o.value"
            [attr.aria-selected]="isSelected(o)"
            [attr.aria-disabled]="o.disabled ? 'true' : null"
            class="flex min-h-9 w-full items-center gap-2.5 rounded-control px-2.5 py-1.5 text-left text-sm"
            [class]="(o.disabled ? 'cursor-not-allowed text-ink-faint ' : 'cursor-pointer text-ink ') + (active() === i && !o.disabled ? 'bg-tint ' : '') + (!multiple() && isSelected(o) ? 'font-medium' : '')"
            (click)="choose(o)"
            (mouseenter)="hover(i)"
          >
            @if (multiple()) {
              <span
                data-select-box
                aria-hidden="true"
                class="flex size-[1.125rem] shrink-0 items-center justify-center rounded-[0.3rem] border-2 text-white"
                [class]="isSelected(o) ? 'border-action bg-action' : 'border-gray-400'"
              >
                @if (isSelected(o)) {
                  <span class="material-symbols-rounded text-[14px] leading-none">check</span>
                }
              </span>
            }
            <span class="min-w-0 flex-1 break-words">{{ o.labelKey ? (o.labelKey | translate: o.labelParams) : o.label }}</span>
            @if (!multiple() && isSelected(o)) {
              <span class="material-symbols-rounded text-[18px] text-action" aria-hidden="true">check</span>
            }
          </button>
        } @empty {
          <div class="px-2.5 py-2 text-ink-muted">{{ 'COMMON.SELECT.NO_OPTIONS' | translate }}</div>
        }
      </div>
    }
  `,
})
export class Select implements ControlValueAccessor {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly translate = inject(TranslateService);

  readonly options = input<SelectOption[]>([]);
  /** Single mode: the chosen value (`''` = none). */
  readonly value = input('');
  /** Multiple mode: the chosen values. */
  readonly values = input<string[]>([]);
  readonly multiple = input(false, { transform: booleanAttribute });
  /** Text of the trigger when nothing is chosen (translation key). */
  readonly placeholderKey = input<string | null>(null);
  /** Single mode: adds a first option with the empty value that clears the choice, labelled with this key. */
  readonly emptyLabelKey = input<string | null>(null);
  /** Single mode, optional field: adds a first option «Sin elegir» (`COMMON.SELECT.NONE`, or `emptyLabelKey`) so the choice can go back to empty. A required field does not use it. */
  readonly clearable = input(false, { transform: booleanAttribute });
  /** Names a multiple filter on its trigger: the label and, next to it, how many are chosen. */
  readonly summaryKey = input<string | null>(null);
  readonly ariaLabelKey = input<string | null>(null);
  /** `id` of the trigger button, so an `app-field` label can point to it. */
  readonly inputId = input<string | null>(null);
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  /** `md` is the 40 px control of forms and toolbars; `sm` is 36 px (pagination, a compact bar). */
  readonly size = input<'md' | 'sm'>('md');

  readonly valueChange = output<string>();
  readonly valuesChange = output<string[]>();

  protected readonly listId = `app-select-${nextId++}`;
  protected readonly open = signal(false);
  protected readonly active = signal(-1);
  protected readonly place = signal<Place | null>(null);
  private readonly cvaDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());

  private readonly selected = linkedSignal<string[]>(() => (this.multiple() ? this.values() : [this.value()]));
  protected readonly rows = computed<SelectOption[]>(() => {
    const empty = this.emptyLabelKey() ?? (this.clearable() ? 'COMMON.SELECT.NONE' : null);
    return empty && !this.multiple() ? [{ value: '', labelKey: empty }, ...this.options()] : this.options();
  });
  protected readonly chosen = computed(() => this.rows().filter((o) => this.selected().includes(o.value)));
  protected readonly current = computed(() => this.rows().find((o) => o.value === this.selected()[0]) ?? null);
  protected readonly count = computed(() => this.selected().filter((v) => v !== '').length);

  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private stopListening: (() => void) | null = null;
  private releaseLayer: (() => void) | null = null;
  private typed = '';
  private typedTimer: ReturnType<typeof setTimeout> | null = null;

  private onChange: (value: string | string[]) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  constructor() {
    // The panel lives in <body>: a modal that animates with `transform` would otherwise become the containing block of `position: fixed`.
    effect(() => {
      const el = this.panel()?.nativeElement;
      if (el && el.parentElement !== document.body) document.body.appendChild(el);
    });
    inject(DestroyRef).onDestroy(() => {
      this.teardown();
      if (this.typedTimer) clearTimeout(this.typedTimer);
      // Destroying the component removes only its own root: the panel, moved to <body>, has to go by hand.
      this.panel()?.nativeElement.remove();
    });
  }

  writeValue(value: unknown): void {
    if (this.multiple()) this.selected.set(Array.isArray(value) ? value.map(String) : []);
    else this.selected.set([value === null || value === undefined ? '' : String(value)]);
  }
  registerOnChange(fn: (value: string | string[]) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.cvaDisabled.set(disabled);
    if (disabled) this.close();
  }

  protected optionId(i: number): string {
    return `${this.listId}-opt-${i}`;
  }

  protected isSelected(o: SelectOption): boolean {
    return this.selected().includes(o.value);
  }

  protected toggle(): void {
    if (this.open()) this.close();
    else this.openPanel('selected');
  }

  protected hover(i: number): void {
    if (!this.rows()[i]?.disabled) this.active.set(i);
  }

  protected choose(o: SelectOption): void {
    if (o.disabled) return;
    if (this.multiple()) {
      const set = new Set(this.selected());
      if (!set.delete(o.value)) set.add(o.value);
      this.commit(this.rows().filter((r) => set.has(r.value)).map((r) => r.value));
    } else {
      this.commit([o.value]);
      this.close();
    }
  }

  private commit(next: string[]): void {
    this.selected.set(next);
    if (this.multiple()) {
      this.valuesChange.emit(next);
      this.onChange(next);
    } else {
      this.valueChange.emit(next[0] ?? '');
      this.onChange(next[0] ?? '');
    }
  }

  private openPanel(start: 'selected' | 'first' | 'last'): void {
    if (this.isDisabled() || this.open()) return;
    const rows = this.rows();
    this.place.set(this.measure());
    this.open.set(true);
    let at = start === 'first' ? this.step(-1, 1) : start === 'last' ? this.step(rows.length, -1) : rows.findIndex((o) => this.selected().includes(o.value) && !o.disabled);
    if (at < 0) at = this.step(-1, 1);
    this.active.set(at);
    this.reveal(at);
    this.trigger()?.nativeElement.focus();
    this.releaseLayer = pushOverlay(this);
    const onDown = (e: Event) => {
      const t = e.target as Node | null;
      if (t && !this.host.nativeElement.contains(t) && !this.panel()?.nativeElement.contains(t)) this.close();
    };
    const onMove = (e: Event) => {
      if (!this.panel()?.nativeElement.contains(e.target as Node)) this.place.set(this.measure());
    };
    // Esc is taken in the capture phase so it reaches the select before any modal or drawer around it, wherever the focus is; the modal then sees it as already handled.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && takeEscape(this, e)) this.close();
    };
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('mousedown', onDown, true);
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    this.stopListening = () => {
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('mousedown', onDown, true);
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }

  protected close(): void {
    if (!this.open()) return;
    this.teardown();
    this.open.set(false);
    this.active.set(-1);
    this.onTouched();
  }

  private teardown(): void {
    this.stopListening?.();
    this.stopListening = null;
    this.releaseLayer?.();
    this.releaseLayer = null;
  }

  // Under the trigger when there is room for the panel, otherwise over it (whichever side has more); never taller than the free space.
  private measure(): Place | null {
    const el = this.trigger()?.nativeElement;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const want = Math.min(MAX_HEIGHT, this.rows().length * ROW + 10);
    const below = window.innerHeight - r.bottom - GAP - MARGIN;
    const above = r.top - GAP - MARGIN;
    const up = below < want && above > below;
    const room = up ? above : below;
    const left = Math.max(MARGIN, Math.min(r.left, window.innerWidth - r.width - MARGIN));
    return {
      left,
      minWidth: r.width,
      maxWidth: Math.max(r.width, Math.min(384, window.innerWidth - left - MARGIN)),
      maxHeight: Math.max(96, Math.min(MAX_HEIGHT, room)),
      edge: up ? window.innerHeight - r.top + GAP : r.bottom + GAP,
      up,
    };
  }

  // Next enabled option from `from` in the direction `dir` (no wrap); -1 if there is none.
  private step(from: number, dir: 1 | -1): number {
    const rows = this.rows();
    for (let i = from + dir; i >= 0 && i < rows.length; i += dir) if (!rows[i].disabled) return i;
    return -1;
  }

  private reveal(i: number): void {
    afterNextRender(() => document.getElementById(this.optionId(i))?.scrollIntoView?.({ block: 'nearest' }), { injector: this.injector });
  }

  private move(i: number): void {
    if (i < 0) return;
    this.active.set(i);
    this.reveal(i);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.isDisabled() || event.altKey || event.ctrlKey || event.metaKey) return;
    const key = event.key;
    if (!this.open()) {
      if (key === 'ArrowDown' || key === 'Enter' || key === ' ') this.openAndStop(event, 'selected');
      else if (key === 'ArrowUp' || key === 'End') this.openAndStop(event, 'last');
      else if (key === 'Home') this.openAndStop(event, 'first');
      else if (key.length === 1) {
        this.openPanel('selected');
        this.search(key);
      }
      return;
    }
    switch (key) {
      case 'ArrowDown':
        event.preventDefault();
        this.move(this.step(this.active(), 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.move(this.step(this.active(), -1));
        break;
      case 'Home':
        event.preventDefault();
        this.move(this.step(-1, 1));
        break;
      case 'End':
        event.preventDefault();
        this.move(this.step(this.rows().length, -1));
        break;
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const o = this.rows()[this.active()];
        if (o) this.choose(o);
        break;
      }
      case 'Escape':
        if (takeEscape(this, event)) this.close();
        break;
      case 'Tab':
        this.close();
        break;
      default:
        if (key.length === 1) this.search(key);
    }
  }

  private openAndStop(event: Event, start: 'selected' | 'first' | 'last'): void {
    event.preventDefault();
    this.openPanel(start);
  }

  // Type-ahead: the typed letters (reset after 600 ms) jump to the next option whose text starts with them.
  private search(char: string): void {
    this.typed += char.toLowerCase();
    if (this.typedTimer) clearTimeout(this.typedTimer);
    this.typedTimer = setTimeout(() => (this.typed = ''), 600);
    const rows = this.rows();
    const start = this.typed.length === 1 ? this.active() + 1 : Math.max(this.active(), 0);
    for (let n = 0; n < rows.length; n++) {
      const i = (start + n) % rows.length;
      if (!rows[i].disabled && this.plain(rows[i]).toLowerCase().startsWith(this.typed)) {
        this.move(i);
        return;
      }
    }
  }

  private plain(o: SelectOption): string {
    return o.labelKey ? String(this.translate.instant(o.labelKey, o.labelParams)) : (o.label ?? o.value);
  }
}
