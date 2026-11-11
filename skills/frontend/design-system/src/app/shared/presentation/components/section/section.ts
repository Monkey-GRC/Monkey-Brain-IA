import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * The one container level: 1 px border and a minimal shadow. The title has a 1 px line below. Never inside another `section`.
 *
 *   <app-section titleKey="…" descriptionKey="…"> <button actions>…</button> … </app-section>
 */
@Component({
  selector: 'app-section',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block mk-surface' },
  template: `
    @if (titleKey(); as title) {
      <header class="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div class="min-w-0">
          <h2 class="text-base font-semibold text-ink">{{ title | translate }}</h2>
          @if (descriptionKey(); as description) {<p class="mt-0.5 text-sm text-ink-muted">{{ description | translate }}</p>}
        </div>
        <div class="flex items-center gap-2 empty:hidden"><ng-content select="[actions]" /></div>
      </header>
    }
    <div class="px-5 py-4"><ng-content /></div>
  `,
})
export class Section {
  readonly titleKey = input<string | null>(null);
  readonly descriptionKey = input<string | null>(null);
}
