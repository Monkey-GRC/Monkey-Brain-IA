import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, Injector, afterNextRender, booleanAttribute, computed, effect, forwardRef, inject, input, linkedSignal, output, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { map, merge } from 'rxjs';
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
  /** Translation key (or text already translated) of the group the option belongs to. Consecutive options of the same group go under its heading. */
  group?: string;
}

interface Section {
  group: string | null;
  items: { option: SelectOption; index: number }[];
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
const SEARCH = 52; // px of the search box at the top of the panel
const HEADING = 28; // px of a group heading
const MAX_HEIGHT = 256; // 16 rem
const GAP = 4;
const MARGIN = 8;

/**
 * The select of Monkey: it replaces the browser's native select element everywhere. A trigger button (value + chevron) and its own panel (surface, 1 px border, soft shadow, system radius)
 * that opens under the button, or over it when there is no room. The panel is moved to `<body>` with `position: fixed`, so it is never clipped by a modal or a table.
 * Combobox/listbox pattern: the focus stays on the trigger and the active option is `aria-activedescendant`.
 *
 * Keyboard: Arrows, Home, End move; Enter or Space choose (or open); Esc closes (only the select, not the modal around it); Tab closes and moves on; typing jumps to an option.
 * Outside click closes. `multiple` shows a checkbox per option and keeps the panel open.
 * `searchable` puts a search box at the top of the panel (for long lists): the focus goes into it, typing filters by the option text (case and accents ignored),
 * arrows and Enter work from it, Esc and Tab close and give the focus back to the trigger. An option with `group` goes under that group's heading.
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
      [class]="(size() === 'sm' ? 'h-9 ' : 'h-10 ') + (invalid() ? 'border-bad' : open() ? 'border-action ring-2 ring-action/20' : 'border-line-control hover:border-ink-faint focus-visible:border-action')"
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
        data-select-panel
        tabindex="-1"
        [attr.role]="searchable() ? null : 'listbox'"
        [id]="searchable() ? listId + '-panel' : listId"
        [attr.aria-multiselectable]="!searchable() && multiple() ? 'true' : null"
        [attr.aria-label]="searchable() ? null : (listLabelKey() | translate)"
        class="mk-enter fixed z-(--z-popover) flex flex-col overflow-hidden rounded-card border border-line bg-surface text-sm text-ink shadow-float"
        [style.left.px]="p?.left"
        [style.top.px]="p && !p.up ? p.edge : null"
        [style.bottom.px]="p && p.up ? p.edge : null"
        [style.min-width.px]="p?.minWidth"
        [style.max-width.px]="p?.maxWidth"
        [style.max-height.px]="p?.maxHeight"
        (mousedown)="keepFocus($event)"
      >
        @if (searchable()) {
          <!-- The search box stays above the list (outside the listbox, which only holds options) and does not scroll with it. -->
          <div class="shrink-0 border-b border-line p-2">
            <input
              #search
              type="text"
              data-select-search
              autocomplete="off"
              class="mk-input h-9"
              [value]="query()"
              [attr.aria-label]="'COMMON.SELECT.SEARCH' | translate"
              [placeholder]="'COMMON.SELECT.SEARCH' | translate"
              [attr.aria-controls]="listId"
              aria-autocomplete="list"
              [attr.aria-activedescendant]="active() >= 0 ? optionId(active()) : null"
              (input)="filter($event)"
              (keydown)="onSearchKeydown($event)"
            />
          </div>
        }
        <div
          class="min-h-0 flex-1 overflow-y-auto p-1"
          [attr.role]="searchable() ? 'listbox' : null"
          [id]="searchable() ? listId : null"
          [attr.aria-multiselectable]="searchable() && multiple() ? 'true' : null"
          [attr.aria-label]="searchable() ? (listLabelKey() | translate) : null"
        >
        @for (section of sections(); track section.group; let si = $index) {
          <div [attr.role]="section.group ? 'group' : null" [attr.aria-labelledby]="section.group ? listId + '-g' + si : null" class="contents">
            @if (section.group) {
              <div [id]="listId + '-g' + si" data-select-group class="px-2.5 pb-1 pt-2 text-xs font-medium text-ink-faint">{{ section.group | translate }}</div>
            }
            @for (item of section.items; track item.option.value) {
              @let o = item.option;
              @let i = item.index;
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
                class="flex size-[1.125rem] shrink-0 items-center justify-center rounded-[0.3rem] border-2 text-on-action"
                [class]="isSelected(o) ? 'border-action bg-action' : 'border-line-control'"
              >
                @if (isSelected(o)) {
                  <span class="material-symbols-rounded text-[16px] leading-none">check</span>
                }
              </span>
            }
            <span class="min-w-0 flex-1 break-words">{{ o.labelKey ? (o.labelKey | translate: o.labelParams) : o.label }}</span>
            @if (!multiple() && isSelected(o)) {
              <span class="material-symbols-rounded text-[20px] text-action" aria-hidden="true">check</span>
            }
          </button>
            }
          </div>
        } @empty {
          <div class="px-2.5 py-2 text-ink-muted" data-select-empty>{{ (query() ? 'COMMON.SELECT.NO_MATCH' : 'COMMON.SELECT.NO_OPTIONS') | translate }}</div>
        }
        </div>
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
  /** A search box at the top of the panel, for long lists. */
  readonly searchable = input(false, { transform: booleanAttribute });

  readonly valueChange = output<string>();
  readonly valuesChange = output<string[]>();

  protected readonly listId = `app-select-${nextId++}`;
  protected readonly open = signal(false);
  protected readonly active = signal(-1);
  protected readonly place = signal<Place | null>(null);
  /** What is typed in the search box (`searchable`). */
  protected readonly query = signal('');
  private readonly cvaDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());

  private readonly selected = linkedSignal<string[]>(() => (this.multiple() ? this.values() : [this.value()]));
  protected readonly rows = computed<SelectOption[]>(() => {
    const empty = this.emptyLabelKey() ?? (this.clearable() ? 'COMMON.SELECT.NONE' : null);
    return empty && !this.multiple() ? [{ value: '', labelKey: empty }, ...this.options()] : this.options();
  });
  /** Accessible name of the list (translated in the template, so it follows the language): the select's own label or, for a multiple filter, its summary. */
  protected readonly listLabelKey = computed(() => this.ariaLabelKey() ?? this.summaryKey());
  // Changes when the language or its translations change: a `computed` that translates with `instant()` reads it, so it is recalculated.
  private readonly translations = toSignal(merge(this.translate.onLangChange, this.translate.onTranslationChange).pipe(map(() => ({}))), { initialValue: {} });
  /** The options the panel shows: all of them, or those that match the search (by the text in the current language). The active index points into this list. */
  protected readonly visible = computed<SelectOption[]>(() => {
    this.translations();
    const q = fold(this.query());
    return q ? this.rows().filter((o) => o.value !== '' && fold(this.plain(o)).includes(q)) : this.rows();
  });
  protected readonly sections = computed<Section[]>(() => {
    const out: Section[] = [];
    this.visible().forEach((option, index) => {
      const group = option.group ?? null;
      let last = out[out.length - 1];
      if (!last || last.group !== group) out.push((last = { group, items: [] }));
      last.items.push({ option, index });
    });
    return out;
  });
  protected readonly chosen = computed(() => this.rows().filter((o) => this.selected().includes(o.value)));
  protected readonly current = computed(() => this.rows().find((o) => o.value === this.selected()[0]) ?? null);
  protected readonly count = computed(() => this.selected().filter((v) => v !== '').length);

  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly searchBox = viewChild<ElementRef<HTMLInputElement>>('search');
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
    if (!this.visible()[i]?.disabled) this.active.set(i);
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
    const rows = this.visible();
    this.place.set(this.measure());
    this.open.set(true);
    let at = start === 'first' ? this.step(-1, 1) : start === 'last' ? this.step(rows.length, -1) : rows.findIndex((o) => this.selected().includes(o.value) && !o.disabled);
    if (at < 0) at = this.step(-1, 1);
    this.active.set(at);
    this.reveal(at);
    if (this.searchable()) afterNextRender(() => this.searchBox()?.nativeElement.focus(), { injector: this.injector });
    else this.trigger()?.nativeElement.focus();
    this.releaseLayer = pushOverlay(this);
    const onDown = (e: Event) => {
      const t = e.target as Node | null;
      if (t && !this.host.nativeElement.contains(t) && !this.panel()?.nativeElement.contains(t)) this.close();
    };
    const onMove = (e: Event) => {
      if (!this.panel()?.nativeElement.contains(e.target as Node)) this.place.set(this.measure());
    };
    // Esc is taken in the capture phase so it reaches the select before any modal around it, wherever the focus is; the modal then sees it as already handled.
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
    // The focus was in the search box (inside the panel, in <body>): it goes back to the trigger before the panel goes away.
    const hadFocus = !!this.panel()?.nativeElement.contains(document.activeElement);
    this.teardown();
    this.open.set(false);
    this.active.set(-1);
    this.query.set('');
    if (hadFocus) this.trigger()?.nativeElement.focus();
    this.onTouched();
  }

  // A click inside the panel never takes the focus from the trigger, except on the search box, which needs it.
  protected keepFocus(event: MouseEvent): void {
    if (event.target !== this.searchBox()?.nativeElement) event.preventDefault();
  }

  protected filter(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.active.set(this.step(-1, 1));
    this.place.set(this.measure());
  }

  // From the search box: arrows move, Enter chooses, Esc and Tab close (the focus goes back to the trigger). The rest is typing.
  protected onSearchKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.move(this.step(this.active(), 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.move(this.step(this.active(), -1));
        break;
      case 'Enter': {
        event.preventDefault();
        const o = this.visible()[this.active()];
        if (o) this.choose(o);
        break;
      }
      case 'Escape':
        if (takeEscape(this, event)) this.close();
        break;
      case 'Tab':
        event.preventDefault();
        this.close();
        break;
    }
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
    const shown = this.visible();
    const headings = new Set(shown.map((o) => o.group ?? null)).size - (shown.some((o) => !o.group) ? 1 : 0);
    const want = Math.min(MAX_HEIGHT, Math.max(shown.length, 1) * ROW + headings * HEADING + (this.searchable() ? SEARCH : 0) + 10);
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
    const rows = this.visible();
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
        if (this.searchable()) {
          // The first letter starts the search: the box gets the focus with it already written.
          event.preventDefault();
          this.query.set(key);
          this.active.set(this.step(-1, 1));
        } else this.search(key);
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
        this.move(this.step(this.visible().length, -1));
        break;
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const o = this.visible()[this.active()];
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
    const rows = this.visible();
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

/** Lower case and without accents, to compare what is typed with an option («gestion» finds «Gestión»). */
function fold(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase();
}
