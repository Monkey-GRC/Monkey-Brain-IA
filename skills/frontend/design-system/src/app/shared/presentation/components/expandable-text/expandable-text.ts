import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, effect, inject, input, signal, untracked, viewChild } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

let nextId = 0;

// The line clamp of each size, written whole so Tailwind finds it.
const CLAMP = { 2: 'line-clamp-2', 3: 'line-clamp-3', 4: 'line-clamp-4' } as const;

/**
 * A text cut to `lines` lines with «Ver más» / «Ver menos» (MD-499). The link shows ONLY when the text is really cut: it measures the clamp (`scrollHeight` against
 * `clientHeight`) and measures again when its width changes (`ResizeObserver`) or the text changes. A text that fits is shown whole, without a link.
 * The toggle is a link (`mk-link underline`): it shows more of the same thing, it does not do anything (README §2). `aria-expanded` and `aria-controls` point at the text.
 *
 *   <app-expandable-text [text]="test.display_description" textClass="text-sm text-ink-muted" moreKey="COMPLIANCE.TESTS.SHOW_MORE" lessKey="COMPLIANCE.TESTS.SHOW_LESS" />
 */
@Component({
  selector: 'app-expandable-text',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <p #body [id]="id" class="whitespace-pre-line" [class]="textClass() + ' ' + (open() ? '' : clampClass())" data-expandable-text>{{ text() }}</p>
    @if (overflowing() || open()) {
      <button type="button" class="mk-link mt-1 text-xs underline" [attr.aria-expanded]="open()" [attr.aria-controls]="id" (click)="toggle()" data-expandable-toggle>
        {{ (open() ? lessKey() : moreKey()) | translate }}
      </button>
    }
  `,
})
export class ExpandableText {
  readonly text = input.required<string>();
  /** How many lines are shown while closed. */
  readonly lines = input<2 | 3 | 4>(2);
  /** Classes of the text (size, colour, measure). */
  readonly textClass = input('');
  readonly moreKey = input('COMMON.SHOW_MORE');
  readonly lessKey = input('COMMON.SHOW_LESS');

  protected readonly id = `expandable-text-${nextId++}`;
  protected readonly open = signal(false);
  /** The closed text is cut: only then is there something to open. */
  protected readonly overflowing = signal(false);
  private readonly body = viewChild.required<ElementRef<HTMLElement>>('body');

  protected clampClass(): string {
    return CLAMP[this.lines()];
  }

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const el = this.body().nativeElement;
      this.measure();
      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(() => this.measure());
      observer.observe(el);
      destroyRef.onDestroy(() => observer.disconnect());
    });
    // A new text is measured again, closed.
    // The first run is measured by `afterNextRender`; only a later change measures again, and its pending frame is cancelled on cleanup.
    let first = true;
    effect((onCleanup) => {
      this.text();
      if (first) {
        first = false;
        return;
      }
      untracked(() => this.open.set(false));
      const frame = requestAnimationFrame(() => this.measure());
      onCleanup(() => cancelAnimationFrame(frame));
    });
  }

  protected toggle(): void {
    this.open.update((v) => !v);
  }

  /** Measured only while closed: open, the text is whole and the link stays to close it. */
  private measure(): void {
    if (this.open()) return;
    const el = this.body().nativeElement;
    this.overflowing.set(el.scrollHeight > el.clientHeight + 1);
  }
}
