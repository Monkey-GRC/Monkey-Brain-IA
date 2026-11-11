import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** The initials of a name: first letter of the first two words, upper case; `?` when there is nothing to take them from. */
export function initialsOf(name: string): string {
  const letters = name
    .replace(/@.*$/, '')
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase());
  return letters.join('') || '?';
}

/**
 * The cell of a person in a table: profile circle with initials, name and a second short line (usually the email). `hint` goes next to the name in muted text
 * («Tú»). Text only: the caller translates it. The circle is an avatar (allowed by the design system), not a decorative icon.
 *
 *   <app-person-cell [name]="fullName" [secondary]="email" [hint]="isMe ? ('TEAM.YOU' | translate) : null" />
 */
@Component({
  selector: 'app-person-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-w-0 items-center gap-3' },
  template: `
    <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-tint-strong text-xs font-semibold text-tint-ink" data-avatar aria-hidden="true">{{ initials() }}</span>
    <span class="min-w-0">
      <span class="block truncate font-medium text-ink" data-person-name>{{ name() }}@if (hint()) {<span class="ml-2 text-xs font-normal text-ink-muted" data-person-hint>{{ hint() }}</span>}</span>
      @if (secondary()) {
        <span class="block truncate text-xs text-ink-muted" data-person-secondary>{{ secondary() }}</span>
      }
    </span>
  `,
})
export class PersonCell {
  readonly name = input.required<string>();
  readonly secondary = input<string | null>(null);
  readonly hint = input<string | null>(null);
  /** Initials to use instead of the ones taken from `name` (for a person with no name: from the email). */
  readonly initialsFrom = input<string | null>(null);

  protected readonly initials = computed(() => initialsOf(this.initialsFrom() ?? this.name()));
}
