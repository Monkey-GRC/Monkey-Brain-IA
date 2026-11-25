import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

let nextId = 0;

/**
 * A section inside a detail (`app-detail-modal`, MD-499): the title (`h3`, 16 px / 600) with a thin `line` below and, on its right, its actions (projected with the
 * `actions` attribute, e.g. a small «Edit» button). No box and no shadow: the panel is already the container (one level, README §1), and every section of a detail uses
 * the same heading so it reads as one structure. `count` (optional) says how many items the section lists, in `ink-faint` after the title. The body goes 12 px below.
 * The `<section>` is labelled by its title.
 *
 *   <app-detail-section titleKey="DOCUMENTS.DETAIL.WHAT"> <button actions class="mk-btn-secondary-sm">…</button> <p>…</p> </app-detail-section>
 */
@Component({
  selector: 'app-detail-section',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <section [attr.aria-labelledby]="titleId">
      <div class="flex min-h-9 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-line pb-2">
        <h3 [id]="titleId" class="text-base font-semibold text-ink">
          {{ titleKey() | translate }}@if (count() !== null) {<span class="ml-1.5 font-normal tabular-nums text-ink-faint" data-section-count>{{ count() }}</span>}
        </h3>
        <div class="flex items-center gap-3 empty:hidden"><ng-content select="[actions]" /></div>
      </div>
      <div class="pt-3"><ng-content /></div>
    </section>
  `,
})
export class DetailSection {
  readonly titleKey = input.required<string>();
  /** How many items the section lists; `null` shows nothing. */
  readonly count = input<number | null>(null);

  protected readonly titleId = `detail-section-${nextId++}`;
}
