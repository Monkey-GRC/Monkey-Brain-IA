import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * The header of a screen: title, optional description and back link, actions on the right and tabs below.
 * No background, no gradient, no icon box (design-system README, section 2).
 *
 *   <app-page-header [title]="…" [description]="…" [backLink]="['/services']" [backLabel]="…">
 *     <a actions routerLink="/services/new" class="mk-btn">…</a>
 *     <nav tabs>…</nav>
 *   </app-page-header>
 *
 * Whatever carries `actions` goes to the right; whatever carries `tabs` goes below the title. The primary action uses `mk-btn`, the others `mk-btn-secondary`.
 */
@Component({
  selector: 'app-page-header',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <header class="flex flex-col gap-4 pb-4">
      <div class="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div class="min-w-0">
          @if (backLink(); as link) {
            <a [routerLink]="link" [attr.aria-label]="backLabel() || null"
              class="mb-2 inline-flex items-center gap-1 rounded-control text-sm text-ink-muted transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action/40">
              <span class="material-symbols-rounded text-[20px]" aria-hidden="true">arrow_back</span>
              @if (backLabel()) {<span>{{ backLabel() }}</span>}
            </a>
          }
          <h1 class="truncate text-2xl font-semibold text-ink">{{ title() }}</h1>
          @if (description(); as text) {<p class="mt-1 text-sm text-ink-muted">{{ text }}</p>}
        </div>
        <div class="flex flex-wrap items-center gap-2"><ng-content select="[actions]" /></div>
      </div>
      <ng-content select="[tabs]" />
    </header>
  `,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly description = input<string | null>(null);
  /** When it comes, a «back» link to that route shows above the title. */
  readonly backLink = input<string | readonly string[] | null>(null);
  readonly backLabel = input('');
}
