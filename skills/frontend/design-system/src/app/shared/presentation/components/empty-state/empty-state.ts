import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * «Nothing here yet»: a line icon with no background, one title, one sentence and, if needed, the action (projected with `action`):
 *   <app-empty-state icon="group" titleKey="…" descriptionKey="…"><a action routerLink="…">…</a></app-empty-state>
 * An empty `icon` (`icon=""`) draws no icon. Texts are translation keys. Anything projected without `action` also goes in the action slot (compatibility with the older usage).
 */
@Component({
  selector: 'app-empty-state',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="px-4 py-10 text-center">
      @if (icon()) {
        <span class="material-symbols-rounded text-[32px] leading-none text-ink-faint" aria-hidden="true">{{ icon() }}</span>
      }
      <h2 class="mt-3 text-base font-semibold text-ink">{{ titleKey() | translate }}</h2>
      @if (descriptionKey(); as description) {
        <p class="mx-auto mt-1 max-w-sm text-sm text-ink-muted">{{ description | translate }}</p>
      }
      <div class="mt-5 flex justify-center empty:hidden"><ng-content select="[action]" /><ng-content /></div>
    </div>
  `,
})
export class EmptyState {
  readonly icon = input('inbox');
  readonly titleKey = input.required<string>();
  readonly descriptionKey = input<string | null>(null);
}
