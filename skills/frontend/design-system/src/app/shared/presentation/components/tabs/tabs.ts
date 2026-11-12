import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

export interface TabItem {
  id: string;
  /** Translation key of the label. */
  labelKey: string;
}

/**
 * Underline navigation between the views of a page. The active tab is ink with a 2 px underline; the others are muted.
 * Arrows, Home and End move between tabs. Filters are NOT tabs (use a segmented control for those).
 * The page decides what to show for the active id (put it under `[tabs]` of `app-page-header`).
 *
 *   <app-tabs [items]="items" [active]="tab()" ariaLabelKey="…" (activeChange)="tab.set($event)" />
 */
@Component({
  selector: 'app-tabs',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @let ariaKey = ariaLabelKey();
    <div role="tablist" class="flex flex-wrap gap-x-6 gap-y-1 border-b border-line" [attr.aria-label]="ariaKey ? (ariaKey | translate) : null">
      @for (item of items(); track item.id) {
        <button
          type="button"
          role="tab"
          [id]="'tab-' + item.id"
          [attr.aria-selected]="item.id === active()"
          [attr.tabindex]="item.id === active() ? 0 : -1"
          (click)="activeChange.emit(item.id)"
          (keydown)="onKey($event)"
          class="-mb-px border-b-2 pb-2.5 pt-1 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action/40"
          [class]="item.id === active() ? 'border-action text-ink' : 'border-transparent text-ink-muted hover:text-ink'"
        >{{ item.labelKey | translate }}</button>
      }
    </div>
  `,
})
export class Tabs {
  readonly items = input.required<TabItem[]>();
  readonly active = input.required<string>();
  readonly ariaLabelKey = input<string | null>(null);

  readonly activeChange = output<string>();

  protected onKey(event: KeyboardEvent): void {
    const ids = this.items().map((i) => i.id);
    const at = ids.indexOf(this.active());
    let next = -1;
    if (event.key === 'ArrowRight') next = (at + 1) % ids.length;
    else if (event.key === 'ArrowLeft') next = (at - 1 + ids.length) % ids.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = ids.length - 1;
    if (next < 0 || !ids.length) return;
    event.preventDefault();
    this.activeChange.emit(ids[next]);
    // The new tab gets the focus after the active input updates.
    queueMicrotask(() => (event.currentTarget as HTMLElement | null)?.closest('[role=tablist]')?.querySelector<HTMLElement>('#tab-' + ids[next])?.focus());
  }
}
