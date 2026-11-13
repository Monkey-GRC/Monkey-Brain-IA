import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Badge, BadgeSize } from '../badge/badge';

/**
 * A code (`CC6.1`, `SOC 2`, `T-CLD-001`): an `app-badge` of kind `code` (brand tint, tabular figures).
 * `text` is data (a code), not a translatable sentence.
 *
 *   <app-tag text="CC6.1" />
 */
@Component({
  selector: 'app-tag',
  imports: [Badge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex max-w-full align-middle' },
  template: `<app-badge kind="code" [size]="size()">{{ text() }}</app-badge>`,
})
export class Tag {
  readonly text = input.required<string>();
  readonly size = input<BadgeSize>('sm');
}
