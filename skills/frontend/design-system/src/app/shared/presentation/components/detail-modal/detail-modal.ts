import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, input, output, viewChild } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DiscardConfirm, DiscardGuard } from '@shared/presentation/components/discard-confirm/discard-confirm';
import { Modal, ModalSize } from '@shared/presentation/components/modal/modal';
import { Skeleton } from '@shared/presentation/components/skeleton/skeleton';
import { TabItem, Tabs } from '@shared/presentation/components/tabs/tabs';

let nextId = 0;

export type DetailVariant = 'drawer' | 'drawer-narrow' | 'compact';

/**
 * The detail of one item: a control, a risk, a cause, a catalog item (MD-499, Rod's decision: «the side bar we had before, only wider»).
 * `variant="drawer"` (default) is the side panel of before: stuck to the right edge, full height, over the list, sliding in from the right; min(80vw, 80rem) wide
 * from lg and the whole screen below lg (1024 px); `drawer-narrow` is the same panel 56 rem wide (~900 px), for a detail read in one column (the catalog of Admin).
 * `variant="compact"` is a short centred modal (a discovered asset, a required evidence of the catalog).
 * A fixed header (the title first, then what is projected with `meta` —codes, badges— and with `summary` —e.g. the score of a control—, and the tabs below; the drawer
 * keeps its close button at the top right), a body that scrolls on its own and a fixed footer: «Cerrar» (`mk-btn-secondary`) alone at the left and, at the right, what is projected with `footerStart` and then the actions projected with `actions`, the primary one last;
 * `footerStart` (a destructive trigger such as «Dar de baja», `mk-btn-danger-outline`) goes first of the right group, set apart from the actions by a thin line, so it is never next to «Cerrar».
 * The size never changes between tabs or records; what does not fit scrolls inside the body.
 * Built on `app-modal` (role=dialog labelled by the title, focus trapped and returned, Esc, backdrop, scroll lock, entrance animation).
 *
 *   <app-detail-modal titleKey="COMPLIANCE.GLOSSARY.CONTROL" [heading]="detail()?.name ?? null" [tabs]="tabs()" [activeTab]="tab()" (activeTabChange)="tab.set($event)"
 *     [guarded]="editing()" (closed)="closed.emit()">
 *     <div meta>…codes…</div>
 *     <div summary>…score…</div>
 *     <div [hidden]="tab() !== 'summary'">…</div>      <- keep every tab rendered and hide the others: a draft in one tab is not lost when switching
 *   </app-detail-modal>
 *
 * The tabs ids are `detail-tab-<id>` (never the `tab-<id>` of a tab bar of the page behind). `heading` is the item's own name (data, not a key); while it is `null` (loading, error) the title is `titleKey`. `tabs` with fewer than two items shows no tab bar.
 * `loading` (D116) draws the skeleton of the header (title, codes and, with `loadingTabs` above 1, the tab bar); the body skeleton is the caller's, with the columns of
 * the first tab, and `summary` may carry the skeleton of the summary.
 * `dismissible` false (a call in progress) blocks Esc, the backdrop and the close buttons. `guarded` true (an editor inside holds data the person wrote and has not sent; see
 * `hasChanges` in `shared/domain/utils/form-changes`) never closes in silence: Esc, the backdrop and the close buttons open `app-confirm-dialog` on top («Seguir editando» /
 * «Descartar cambios», MD-485). «Seguir editando» goes back with what was written and the focus where it was; «Descartar cambios» emits `closed`.
 */
@Component({
  selector: 'app-detail-modal',
  imports: [Modal, Tabs, Skeleton, DiscardConfirm, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(focusin)': 'discardGuard.remember($event)' },
  template: `
    <app-modal [open]="open()" [size]="modalSize()" [padded]="false" [labelledBy]="titleId" [dismissible]="dismissible()" [testId]="testId()" (dismissed)="discardGuard.request()">
      <header class="shrink-0 pt-6" [class]="pad() + (hasTabs() || loadingTabs() > 1 ? ' pb-0' : ' border-b border-line pb-6')">
        <div class="flex items-start gap-4">
          <div class="min-w-0 flex-1">
            <h2 [id]="titleId" class="text-xl font-semibold leading-snug text-balance text-ink" [class.sr-only]="loading()" data-detail-title>{{ heading() || (titleKey() | translate) }}</h2>
            @if (loading()) {
              <!-- D116 · Mientras carga, la cabecera con su forma completa: el título y una fila de códigos; quien lo usa pone en \`summary\` la forma de su resumen. -->
              <div class="flex flex-col gap-3 pt-1" data-detail-loading>
                <app-skeleton shape="title" width="55%" />
                <div class="flex gap-2"><app-skeleton shape="badge" width="4.5rem" /><app-skeleton shape="badge" width="3.5rem" /></div>
              </div>
            } @else {
              <div class="mt-2 empty:hidden"><ng-content select="[meta]" /></div>
            }
          </div>
          @if (drawer()) {
            <!-- La X del panel lateral de siempre, arriba a la derecha (foco inicial): botón cuadrado de 40 px con borde fino (\`mk-btn-icon\`, como el de fijar el menú), centrado con la primera línea del título. -->
            <button #topClose type="button" (click)="discardGuard.request()" [disabled]="!dismissible()" data-detail-x [attr.aria-label]="'COMMON.CLOSE' | translate" [title]="'COMMON.CLOSE' | translate"
              class="mk-btn-icon -mt-1.5 border border-line">
              <span class="material-symbols-rounded text-[24px] leading-none" aria-hidden="true">close</span>
            </button>
          }
        </div>
        <div class="mt-5 empty:hidden"><ng-content select="[summary]" /></div>
        @if (hasTabs()) {
          <app-tabs class="mt-5" [items]="tabs()" [active]="activeTab()" [ariaLabelKey]="tabsLabelKey()" idPrefix="detail-tab" (activeChange)="activeTabChange.emit($event)" />
        } @else if (loading() && loadingTabs() > 1) {
          <app-skeleton class="mt-5" shape="tabs" [lines]="loadingTabs()" />
        }
      </header>
      <div class="min-h-0 flex-1 overflow-y-auto py-6 text-sm text-ink" [class]="pad()" data-detail-body
        [attr.role]="hasTabs() ? 'tabpanel' : null" [attr.aria-labelledby]="hasTabs() ? 'detail-tab-' + activeTab() : null">
        <ng-content />
      </div>
      <footer class="flex shrink-0 flex-wrap items-center gap-3 border-t border-line py-4 max-sm:flex-col-reverse max-sm:items-stretch" [class]="pad()">
        <button #closeButton type="button" class="mk-btn-secondary" [disabled]="!dismissible()" (click)="discardGuard.request()" data-detail-close [attr.data-testid]="testId() + '-close'">
          {{ 'COMMON.CLOSE' | translate }}
        </button>
        <!-- MD-508 (decisión de Rod): «Cerrar» a la izquierda; a la derecha, en este orden, lo destructivo (footerStart, separado por una línea fina), las acciones y al final la primaria. -->
        <div class="ml-auto flex grow flex-wrap items-center justify-end gap-3 max-sm:ml-0 max-sm:flex-col-reverse max-sm:items-stretch">
          <div class="flex flex-wrap items-center gap-3 empty:hidden"><ng-content select="[footerStart]" /></div>
          <div class="flex flex-wrap items-center justify-end gap-3 empty:hidden [div:not(:empty)+&]:border-l [div:not(:empty)+&]:border-line [div:not(:empty)+&]:pl-3 max-sm:[div:not(:empty)+&]:border-l-0 max-sm:[div:not(:empty)+&]:pl-0"><ng-content select="[actions]" /></div>
        </div>
      </footer>
    </app-modal>
    <!-- Fuera del panel, como en form-modal: la confirmación no queda atada al panel ni a su animación. -->
    <app-discard-confirm [guard]="discardGuard" />
  `,
})
export class DetailModal {
  readonly open = input(true);
  /** The kind of item («Control», «Riesgo»…): the title while `heading` is empty. */
  readonly titleKey = input.required<string>();
  /** The item's own name, already in the user's language. */
  readonly heading = input<string | null>(null);
  readonly tabs = input<TabItem[]>([]);
  readonly activeTab = input('');
  readonly tabsLabelKey = input<string | null>(null);
  /** The item is loading (D116): the header shows the skeleton of its title and codes, and `loadingTabs` tabs if the detail will have them. */
  readonly loading = input(false);
  readonly loadingTabs = input(0);
  /** `drawer`: the wide side panel (control, risk, cause). `drawer-narrow`: the same at 56 rem (catalog item). `compact`: a short centred modal. */
  readonly variant = input<DetailVariant>('drawer');
  readonly dismissible = input(true);
  readonly guarded = input(false);
  /** Prefix of the `data-testid` of the backdrop and the panel (those of `app-modal`) and of «Cerrar» (`<id>-close`). */
  readonly testId = input('detail-modal');

  readonly activeTabChange = output<string>();
  readonly closed = output<void>();

  protected readonly titleId = `detail-modal-title-${nextId++}`;
  protected readonly hasTabs = computed(() => this.tabs().length > 1);
  protected readonly drawer = computed(() => this.variant() !== 'compact');
  protected readonly modalSize = computed<ModalSize>(() => {
    const variant = this.variant();
    return variant === 'compact' ? 'detail-compact' : variant;
  });
  // Aire de los lados: generoso en el panel lateral (32 px), el de un modal en el corto (24 px).
  protected readonly pad = computed(() => (this.drawer() ? 'px-8 max-sm:px-5' : 'px-6'));
  // Esc, el fondo, la X y «Cerrar» pasan por aquí: nada mientras se envía; con datos sin enviar, se pregunta; si no, se cierra.
  protected readonly discardGuard = new DiscardGuard({ open: this.open, canClose: this.dismissible, guarded: this.guarded, close: () => this.closed.emit() });
  private readonly closeButton = viewChild<ElementRef<HTMLButtonElement>>('closeButton');
  private readonly topClose = viewChild<ElementRef<HTMLButtonElement>>('topClose');

  constructor() {
    // El foco inicial va al cierre (la X del panel lateral; «Cerrar» en el corto): el contenido puede empezar con un campo o una acción que no se quiere activar sin querer.
    effect((onCleanup) => {
      if (!this.open()) return;
      const timer = setTimeout(() => (this.topClose() ?? this.closeButton())?.nativeElement.focus());
      onCleanup(() => clearTimeout(timer));
    });
  }
}
