import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * A code that is filtered by (`CC6.1`, `SOC 2`): small gray text, no icon, no colour, no background.
 * `text` is data (a code), not a translatable sentence.
 *
 *   <app-tag text="CC6.1" />
 */
@Component({
  selector: 'app-tag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-block whitespace-nowrap text-xs font-medium text-ink-muted' },
  template: `{{ text() }}`,
})
export class Tag {
  readonly text = input.required<string>();
}
