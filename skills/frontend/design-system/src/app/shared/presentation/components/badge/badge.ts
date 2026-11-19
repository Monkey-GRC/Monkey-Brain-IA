import { AfterContentChecked, ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, signal } from '@angular/core';

export type BadgeKind = 'code' | 'attribute' | 'status';
export type BadgeSize = 'sm' | 'md';
/** Status tones. `risk-*` is the risk scale (it keeps its own tokens); the other five are statuses (`info` is the brand tint). */
export type BadgeTone = 'ok' | 'warn' | 'bad' | 'neutral' | 'info' | 'risk-low' | 'risk-moderate' | 'risk-high' | 'risk-critical';
export type BadgeColor = 1 | 2 | 3 | 4 | 5;

interface Look {
  /** Box: tint, 1 px line and strong text, all tokens (`--color-badge-*`). */
  box: string;
  /** Status dot (the strong base colour of the tone). */
  dot: string;
}

// Every class is written whole: Tailwind does not see classes built from pieces.
const CODE: Look = { box: 'bg-badge-brand-bg border-badge-brand-line text-badge-brand-ink', dot: 'bg-action' };

const ATTRIBUTE: Record<BadgeColor, Look> = {
  1: { box: 'bg-badge-data-1-bg border-badge-data-1-line text-badge-data-1-ink', dot: 'bg-data-1' },
  2: { box: 'bg-badge-data-2-bg border-badge-data-2-line text-badge-data-2-ink', dot: 'bg-data-2' },
  3: { box: 'bg-badge-data-3-bg border-badge-data-3-line text-badge-data-3-ink', dot: 'bg-data-3' },
  4: { box: 'bg-badge-data-4-bg border-badge-data-4-line text-badge-data-4-ink', dot: 'bg-data-4' },
  5: { box: 'bg-badge-data-5-bg border-badge-data-5-line text-badge-data-5-ink', dot: 'bg-data-5' },
};

const STATUS: Record<BadgeTone, Look> = {
  ok: { box: 'bg-badge-ok-bg border-badge-ok-line text-badge-ok-ink', dot: 'bg-ok' },
  warn: { box: 'bg-badge-warn-bg border-badge-warn-line text-badge-warn-ink', dot: 'bg-warn' },
  bad: { box: 'bg-badge-bad-bg border-badge-bad-line text-badge-bad-ink', dot: 'bg-bad' },
  neutral: { box: 'bg-badge-neutral-bg border-badge-neutral-line text-badge-neutral-ink', dot: 'bg-neutral' },
  info: { box: 'bg-badge-brand-bg border-badge-brand-line text-badge-brand-ink', dot: 'bg-action' },
  'risk-low': { box: 'bg-badge-risk-low-bg border-badge-risk-low-line text-badge-risk-low-ink', dot: 'bg-risk-low' },
  'risk-moderate': { box: 'bg-badge-risk-moderate-bg border-badge-risk-moderate-line text-badge-risk-moderate-ink', dot: 'bg-risk-moderate' },
  'risk-high': { box: 'bg-badge-risk-high-bg border-badge-risk-high-line text-badge-risk-high-ink', dot: 'bg-risk-high' },
  'risk-critical': { box: 'bg-badge-risk-critical-bg border-badge-risk-critical-line text-badge-risk-critical-ink', dot: 'bg-risk-critical' },
};

const SIZE: Record<BadgeSize, string> = {
  sm: 'gap-1.5 px-1.5 py-0.5 text-xs leading-4',
  md: 'gap-1.5 px-2 py-1 text-sm leading-5',
};

/**
 * Stable colour of an attribute: the same text is always the same one of the five data colours (1..5), in the whole app.
 * The text is normalised (trimmed, lower case) and hashed (djb2); the hash picks the index.
 */
export function badgeColorIndex(text: string): BadgeColor {
  let hash = 5381;
  for (const ch of text.trim().toLowerCase()) {
    hash = ((hash << 5) + hash + (ch.codePointAt(0) ?? 0)) >>> 0;
  }
  return ((hash % 5) + 1) as BadgeColor;
}

/**
 * The only badge of the design system (D115): a rounded rectangle (`rounded-badge`, 4 px, never a pill) with a soft tint of its colour, a 1 px line of the same hue and strong text.
 * The content is projected and must already be translated: `<app-badge kind="status" tone="ok">Disponible</app-badge>`.
 *
 * - `code` (`T-CLD-001`, `AST-1`, `CC6.1`): brand tint, Geist Mono, tabular figures.
 * - `attribute` (resource type, capability, "works with", category): a FIXED colour of the data palette per value. It comes from `color` (1..5) if given, else from `value`
 *   (the text that identifies it), else from the projected text. The same text is always the same colour.
 * - `status` (available, ready, needs work, not measured): the tone's tint plus a dot at the left, so colour is not the only signal. `tone` is `ok | warn | bad | neutral | info`
 *   or a `risk-*` level (the risk scale keeps its own tokens).
 *
 * `size`: `sm` for tables, `md` (default). It never wraps; a long text is cut with an ellipsis and shows its full text as a tooltip (`hint` replaces it).
 */
@Component({
  selector: 'app-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.data-kind]': 'kind()',
    '[attr.data-tone]': 'kind() === "status" ? tone() : null',
    '[attr.data-color]': 'kind() === "attribute" ? colorIndex() : null',
  },
  template: `
    @if (kind() === 'status') {
      <span class="size-1.5 shrink-0 rounded-full" [class]="look().dot" aria-hidden="true"></span>
    }
    <span class="min-w-0 truncate" [attr.title]="tooltip()"><ng-content /></span>
  `,
})
export class Badge implements AfterContentChecked {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly kind = input<BadgeKind>('status');
  readonly size = input<BadgeSize>('md');
  /** Tone of a `status` badge. */
  readonly tone = input<BadgeTone>('neutral');
  /** `attribute` only: forces the data colour (1..5). */
  readonly color = input<BadgeColor | null>(null);
  /** `attribute` only: the text that picks the colour (when the projected text is a translation that varies by language, pass the stable value). */
  readonly value = input<string | null>(null);
  /** Tooltip (already translated). Without it, a long text shows itself. */
  readonly hint = input<string | null>(null);

  private readonly text = signal('');

  protected readonly colorIndex = computed<BadgeColor>(() => {
    const forced = this.color();
    if (forced && forced >= 1 && forced <= 5) {
      return forced;
    }
    return badgeColorIndex(this.value() ?? this.text());
  });

  protected readonly look = computed<Look>(() => {
    switch (this.kind()) {
      case 'code':
        return CODE;
      case 'attribute':
        return ATTRIBUTE[this.colorIndex()];
      default:
        return STATUS[this.tone()] ?? STATUS.neutral;
    }
  });

  protected readonly tooltip = computed(() => this.hint() ?? (this.text().length > 24 ? this.text() : null));

  protected readonly hostClass = computed(() => {
    const code = this.kind() === 'code' ? ' font-mono tabular-nums' : '';
    return `inline-flex max-w-full items-center whitespace-nowrap rounded-badge border align-middle font-medium ${SIZE[this.size()]} ${this.look().box}${code}`;
  });

  ngAfterContentChecked(): void {
    const text = (this.host.nativeElement.textContent ?? '').trim();
    if (text !== this.text()) {
      this.text.set(text);
    }
  }
}
