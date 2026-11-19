import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, computed, effect, inject, input, signal, viewChild } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { PasswordCheck, PasswordCheckKey } from '@shared/domain/utils/password-rules';

interface Place {
  left: number;
  top: number;
  width: number;
  /** Where the arrow points from: the panel's right edge (`side`) or its top edge (`below`). */
  mode: 'side' | 'below';
  /** Offset of the arrow along the edge it sits on. */
  arrow: number;
}

const WIDTH = 288; // 18 rem: the panel when it opens beside the field
const GAP = 14; // room for the arrow between the field and the panel
const MARGIN = 8;
const ARROW_SIDE = 26; // px from the panel's top to the arrow when it opens beside the field
const SIDE_MIN_VIEWPORT = 768; // below this width (mobile) it never opens beside the field

/**
 * The requirements balloon of a new password: a floating card (surface, 1 px border, soft shadow, system radius) with a small title and one row per requirement; each
 * circle fills with a check when its rule is met. An arrow points at the field. It does not know the rules or the screen: it receives the `checks` already computed and the field it hangs from.
 *
 * Placement (decided, MD-217): `position: fixed` and moved to `<body>` (like the panel of `app-select`), so it never moves the form and no modal's transform or overflow clips it.
 * Beside the field (to its LEFT, arrow on its right edge) when the viewport is 768 px or wider and there is room; otherwise BELOW the field, with the arrow on top. Below, it would cover
 * the next field, so it is `pointer-events-none` (a tap goes through). Visibility is the owner's: `open` is true only while the field (or its eye) has the focus; moving or resizing only repositions it.
 * It never takes the focus. The field points at it with `aria-describedby`; the screen-reader announcement (`aria-live`) is the owner's job, it is not repeated here.
 */
@Component({
  selector: 'app-password-requirements',
  imports: [TranslatePipe],
  templateUrl: './password-requirements.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordRequirements {
  readonly checks = input.required<PasswordCheck[]>();
  /** The element that holds the field (the text box inside it is what the arrow points at). */
  readonly anchor = input<HTMLElement | null>(null);
  readonly open = input(false);
  readonly balloonId = input('password-requirements');

  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly place = signal<Place | null>(null);
  protected readonly visible = computed(() => this.open() && this.place() !== null);
  protected readonly style = computed(() => {
    const p = this.place();
    return p ? { left: `${p.left}px`, top: `${p.top}px`, width: `${p.width}px` } : {};
  });
  protected readonly placement = computed(() => this.place());

  constructor() {
    // The panel lives in <body>: a modal that animates with `transform` would otherwise become the containing block of `position: fixed`.
    effect(() => {
      const el = this.panel()?.nativeElement;
      if (el && el.parentElement !== document.body) document.body.appendChild(el);
    });
    effect((onCleanup) => {
      const anchor = this.anchor();
      if (!this.open() || !anchor) return;
      const move = () => this.place.set(this.measure(anchor));
      move();
      window.addEventListener('scroll', move, true);
      window.addEventListener('resize', move);
      onCleanup(() => {
        window.removeEventListener('scroll', move, true);
        window.removeEventListener('resize', move);
      });
    });
    inject(DestroyRef).onDestroy(() => this.panel()?.nativeElement.remove());
  }

  private measure(anchor: HTMLElement): Place {
    const target = anchor.querySelector('input') ?? anchor;
    const r = target.getBoundingClientRect();
    const vw = window.innerWidth;
    if (vw >= SIDE_MIN_VIEWPORT && r.left - GAP - WIDTH >= MARGIN) {
      return { mode: 'side', left: r.left - GAP - WIDTH, top: Math.max(MARGIN, r.top + r.height / 2 - ARROW_SIDE), width: WIDTH, arrow: ARROW_SIDE };
    }
    const width = Math.min(Math.max(r.width, 240), vw - 2 * MARGIN);
    const left = Math.min(Math.max(MARGIN, r.left), vw - width - MARGIN);
    return { mode: 'below', left, top: r.bottom + GAP - 4, width, arrow: Math.min(Math.max(24, r.left + 24 - left), width - 24) };
  }

  protected labelKey(key: PasswordCheckKey): string {
    return `COMMON.PASSWORD.GUIDE.${key.toUpperCase()}`;
  }
}
