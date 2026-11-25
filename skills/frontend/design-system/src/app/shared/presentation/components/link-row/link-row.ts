import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Busy } from '@shared/presentation/directives/busy';

/** «Título — descripción» en un solo texto (así llegan algunos datos del catálogo): se parte en la presentación, sin tocar el dato. */
export function splitTitle(text: string | null | undefined): { title: string; description: string | null } {
  const value = (text ?? '').trim();
  const match = /\s*—\s*/.exec(value);
  if (!match || match.index === 0) return { title: value, description: null };
  const title = value.slice(0, match.index).trim();
  const description = value.slice(match.index + match[0].length).trim();
  return description ? { title, description } : { title, description: null };
}

/**
 * One row of a list of links (MD-499): a requirement, a test, a cause… linked to the item that is open. Put it in a `<div role="list" class="divide-y divide-line">` (the row is a `listitem`):
 * thin line between rows and vertical air. Inside: the code (`[code]`, an `app-badge`) and the title in bold on one line, the description below in secondary text,
 * the chips of an attribute (`[meta]`, e.g. the dimension) in a column of fixed width so they line up row after row, and «Desvincular» as a button WITH text
 * at the right (`mk-btn-danger-sm`, icon `link_off`; never an icon alone). With `description` empty and a title «Título — descripción», it splits it.
 *
 *   <app-link-row [title]="p.description" [unlinkable]="true" [unlinkLabel]="'Quitar el vínculo con CC6.1#1'" (unlink)="remove(p)">
 *     <app-badge code kind="code" size="sm">CC6.1#1</app-badge>
 *     <app-badge meta kind="attribute" size="sm" value="policy">Política</app-badge>
 *   </app-link-row>
 */
@Component({
  selector: 'app-link-row',
  imports: [TranslatePipe, Busy],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'listitem', class: 'flex flex-wrap items-start gap-x-4 gap-y-2 py-3 first:pt-0 last:pb-0 sm:flex-nowrap', 'data-link-row': '' },
  template: `
    <div class="min-w-0 flex-1 basis-60">
      <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <ng-content select="[code]" />
        <span class="min-w-0 break-words font-semibold text-ink" data-link-title>{{ parts().title }}</span>
      </div>
      @if (parts().description; as text) {
        <p class="mt-1 text-pretty text-sm text-ink-muted" data-link-description>{{ text }}</p>
      }
      <ng-content />
    </div>
    <div class="flex w-44 shrink-0 flex-wrap items-start gap-1 empty:hidden max-sm:w-auto" data-link-meta><ng-content select="[meta]" /></div>
    @if (unlinkable()) {
      <button type="button" class="mk-btn-danger-sm shrink-0" [disabled]="disabled()" [appBusy]="busy()" [attr.aria-label]="unlinkLabel()" (click)="unlink.emit()" data-unlink>
        <span class="material-symbols-rounded text-[16px]" aria-hidden="true">link_off</span>{{ unlinkKey() | translate }}
      </button>
    }
  `,
})
export class LinkRow {
  readonly title = input.required<string>();
  readonly description = input<string | null>(null);
  /** Shows «Desvincular». */
  readonly unlinkable = input(false);
  /** The accessible name of the button, already translated, with what it unlinks («Quitar el vínculo con CC6.1#1»). */
  readonly unlinkLabel = input<string | null>(null);
  readonly unlinkKey = input('COMMON.UNLINK');
  readonly disabled = input(false);
  readonly busy = input(false);

  readonly unlink = output<void>();

  protected readonly parts = computed(() => {
    const description = this.description();
    return description ? { title: this.title(), description } : splitTitle(this.title());
  });
}
