import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, Directive, TemplateRef, computed, contentChildren, inject, input, output, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { PageInfo } from './table-page';
import { Pagination } from '@shared/presentation/components/pagination/pagination';
import { EmptyState } from '@shared/presentation/components/empty-state/empty-state';
import { Skeleton } from '@shared/presentation/components/skeleton/skeleton';

let nextId = 0;

// Punto de corte por debajo del cual la tabla se apila en tarjetas (sin desplazamiento horizontal): `lg` (1024 px), `2xl` (1536 px, tablas de muchas columnas) o `never`.
export type TableStack = 'lg' | '2xl' | 'never';

// Clases completas y literales por modo (Tailwind no ve clases armadas por pedazos).
interface StackClasses {
  table: string;
  head: string;
  body: string;
  row: string;
  cell: string;
  pad: string;
  // Horizontal padding, the SAME for a column's header and its cells (so both start and end at the same x, whatever the alignment).
  padX: string;
  select: string;
  chevron: string;
  group: string;
  right: string;
  center: string;
}

const STACK: Record<TableStack, StackClasses> = {
  lg: {
    table: 'block lg:table',
    head: 'max-lg:sr-only',
    body: 'block lg:table-row-group',
    row: 'block space-y-3 p-4 lg:table-row lg:space-y-0 lg:p-0',
    cell: 'block lg:table-cell',
    pad: 'lg:h-14 lg:py-2',
    padX: 'lg:px-6',
    select: 'lg:w-12 lg:h-14 lg:px-4 lg:py-2',
    chevron: 'lg:h-14',
    group: 'block lg:table-row',
    right: 'lg:text-right',
    center: 'lg:text-center',
  },
  '2xl': {
    table: 'stack-2xl block 2xl:table',
    head: 'max-2xl:sr-only',
    body: 'block 2xl:table-row-group',
    row: 'block space-y-3 p-4 2xl:table-row 2xl:space-y-0 2xl:p-0',
    cell: 'block 2xl:table-cell',
    pad: '2xl:h-14 2xl:py-2',
    padX: '2xl:px-6',
    select: '2xl:w-12 2xl:h-14 2xl:px-4 2xl:py-2',
    chevron: '2xl:h-14',
    group: 'block 2xl:table-row',
    right: '2xl:text-right',
    center: '2xl:text-center',
  },
  never: {
    table: 'min-w-[40rem]',
    head: '',
    body: '',
    row: '',
    cell: '',
    pad: 'h-14 py-2',
    padX: 'px-6',
    select: 'w-12 h-14 px-4 py-2',
    chevron: 'h-14',
    group: '',
    right: 'text-right',
    center: 'text-center',
  },
};

// La compacta (panel lateral) es una lista corta: nunca se apila, solo quita el ancho mínimo.
const COMPACT: StackClasses = { ...STACK.never, table: 'min-w-0', pad: 'py-2.5', padX: 'px-3', select: 'w-12 px-4 py-2', chevron: '' };

export interface TableGroup<T> {
  key: string;
  label: string;
  rows: T[];
}

export interface TableColumn<T> {
  key: string;
  // Clave de traducción del encabezado.
  headerKey: string;
  // Texto de la celda cuando no hay plantilla propia (`<ng-template appCell="key">`).
  value?: (row: T) => string | number | null | undefined;
  align?: 'left' | 'right' | 'center';
  // Clases extra para la celda y el encabezado (por ejemplo, un ancho).
  class?: string;
  // El encabezado se oculta a la vista pero sigue ahí para los lectores de pantalla (columna de acciones).
  srOnlyHeader?: boolean;
  // What the column holds, so the loading rows draw a cell of the same kind: `text` (default), `badge` (status, code), `person` (avatar and two lines), `actions` (a small button) or
  // `none` (empty cell).
  skeleton?: 'text' | 'badge' | 'person' | 'actions' | 'none';
}

// Marca la plantilla de una celda: `<ng-template appCell="status" let-row><app-status-indicator tone="ok" labelKey="..." /></ng-template>`.
@Directive({ selector: 'ng-template[appCell]' })
export class TableCell {
  readonly key = input.required<string>({ alias: 'appCell' });
  readonly template = inject(TemplateRef);
}

// Tabla única del producto: cabecera pequeña en gris, filas con hover en toda la fila, bordes y radios por token, paginación al pie. Las columnas y las celdas son de
// quien la usa; el estilo, no. Celdas y atajos que se reutilizan: `app-person-cell` (avatar con iniciales + nombre y correo), `app-status-indicator` (badge de estado),
// `app-tag` (badge de código), `app-table-toolbar` + `app-table-filter` (barra con buscador, filtros y acciones). Opciones: `clickable` (fila activable con clic, Enter o Espacio; con `[focusable]="false"` solo con el mouse, para filas que ya traen su propio enlace o botón: una sola parada de Tab; pone un
// chevron al final salvo `[chevron]="false"`), `selectable` (casillas y «seleccionar todo» de la página; quien la usa guarda la selección).
//
// Tabla con paginación (la barra es `pagination`; el formato de `page`, `page_size`, `total` y `total_pages` es el del backend). No pide datos: recibe las filas y
// avisa cuando se cambia de página o de tamaño; quien la usa vuelve a pedir. Con la lista vacía muestra el estado vacío (se puede reemplazar
// proyectando algo con el atributo `tableEmpty`). Los textos son claves de traducción.
//   <app-data-table captionKey="..." [columns]="columns" [rows]="rows()" [rowKey]="byId" [page]="page()" [loading]="loading()"
//     (pageChange)="goTo($event)" (pageSizeChange)="resize($event)">
//     <ng-template appCell="status" let-row><app-status-indicator tone="ok" labelKey="..." /></ng-template>
//   </app-data-table>
@Component({
  selector: 'app-data-table',
  imports: [NgTemplateOutlet, TranslatePipe, EmptyState, Pagination, Skeleton],
  templateUrl: './data-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTable<T> {
  // Descripción de la tabla para lectores de pantalla (no se ve).
  readonly captionKey = input.required<string>();
  readonly columns = input.required<TableColumn<T>[]>();
  readonly rows = input.required<T[]>();
  readonly rowKey = input.required<(row: T) => string | number>();
  readonly page = input<PageInfo | null>(null);
  readonly pageSizes = input<number[]>([10, 25, 50]);
  // Loading (D116): `loadingRows` skeleton rows with the same columns, widths and alignment as the real ones, under the real header (see `TableColumn.skeleton`). The layout does not move when the data arrives.
  readonly loading = input(false);
  readonly loadingRows = input(5);
  // Las filas se pueden activar (clic, Enter) para abrir su detalle.
  readonly clickable = input(false);
  // Una fila activable es una parada de Tab (con nombre accesible de `rowLabel` y la descripción «Abrir detalle»). Si la fila ya contiene el enlace o botón que hace lo mismo,
  // se usa `[focusable]="false"`: la fila sigue abriéndose con el mouse, pero sin tabindex, para no tener dos paradas de Tab por fila.
  readonly focusable = input(true);
  // Con filas activables, una flecha al final indica que hay detalle. Es solo la señal: la fila entera se activa.
  readonly chevron = input(true);
  // Casillas por fila y «seleccionar todo» en el encabezado. La selección es de quien usa la tabla (`selected` entra, `selectionChange` sale).
  readonly selectable = input(false);
  readonly selected = input<ReadonlySet<string | number>>(new Set());
  // Nombre de la fila: etiqueta accesible de su casilla y, en una fila activable, nombre de la fila misma.
  readonly rowLabel = input<((row: T) => string) | null>(null);
  // Filas agrupadas: `groupBy` da la clave de grupo de cada fila (las filas se muestran en el orden recibido; los grupos, en el de su primera aparición) y `groupLabel` el
  // título ya traducido del grupo (por defecto, la clave). Cada grupo lleva un encabezado de sección con su conteo; con `collapsible` el encabezado es un botón que pliega o
  // despliega las filas del grupo (`aria-expanded`). Sin `groupBy` la tabla es la plana de siempre.
  readonly groupBy = input<((row: T) => string) | null>(null);
  readonly groupLabel = input<((key: string, rows: T[]) => string) | null>(null);
  readonly collapsible = input(false);
  // Variante compacta para listas dentro de un panel lateral (`side-drawer`, de 28 a 42 rem): sin ancho mínimo, celdas más bajas que pueden partir el texto en dos líneas; es la
  // misma tabla (mismo borde, hover, fila activable, vacío y carga). Con `hideHeader` el encabezado queda solo para lectores de pantalla (una lista sin títulos de columna).
  readonly compact = input(false);
  readonly hideHeader = input(false);
  // Por debajo de este ancho de pantalla cada fila pasa a ser una tarjeta apilada (cada celda con el rótulo de su columna encima) y no hay desplazamiento horizontal. Por defecto
  // `lg`; `2xl` para tablas de muchas columnas; `never` la deja siempre como tabla (con ancho mínimo). La variante `compact` nunca se apila.
  readonly stackBelow = input<TableStack>('lg');
  readonly emptyIcon = input('inbox');
  readonly emptyTitleKey = input('COMMON.TABLE.EMPTY_TITLE');
  readonly emptyDescriptionKey = input<string | null>(null);

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();
  readonly rowClick = output<T>();
  readonly selectionChange = output<Set<string | number>>();

  protected readonly openHintId = `data-table-open-${nextId++}`;
  protected readonly s = computed<StackClasses>(() => (this.compact() ? COMPACT : STACK[this.stackBelow()]));
  protected readonly stacked = computed(() => !this.compact() && this.stackBelow() !== 'never');
  protected readonly cellPad = computed(() => this.s().pad + ' ' + this.s().padX);
  protected readonly isFocusable = computed(() => this.clickable() && this.focusable());
  protected readonly hasChevron = computed(() => this.clickable() && this.chevron());
  protected readonly columnCount = computed(() => this.columns().length + (this.selectable() ? 1 : 0) + (this.hasChevron() ? 1 : 0));
  protected readonly allSelected = computed(() => this.rows().length > 0 && this.rows().every((r) => this.selected().has(this.rowKey()(r))));
  protected readonly someSelected = computed(() => !this.allSelected() && this.rows().some((r) => this.selected().has(this.rowKey()(r))));

  protected readonly groups = computed<TableGroup<T>[]>(() => {
    const keyOf = this.groupBy();
    if (!keyOf) return [];
    const byKey = new Map<string, T[]>();
    for (const row of this.rows()) {
      const key = keyOf(row);
      const list = byKey.get(key);
      if (list) list.push(row);
      else byKey.set(key, [row]);
    }
    const labelOf = this.groupLabel();
    return Array.from(byKey, ([key, rows]) => ({ key, label: labelOf ? labelOf(key, rows) : key, rows }));
  });
  protected readonly skeletonRows = computed(() => Array.from({ length: Math.max(1, Math.floor(this.loadingRows())) }, (_, i) => i));
  private readonly collapsedGroups = signal<ReadonlySet<string>>(new Set());

  private readonly cells = contentChildren(TableCell);

  protected isCollapsed(key: string): boolean {
    return this.collapsible() && this.collapsedGroups().has(key);
  }

  protected toggleGroup(key: string): void {
    const next = new Set(this.collapsedGroups());
    if (!next.delete(key)) next.add(key);
    this.collapsedGroups.set(next);
  }

  protected cellFor(key: string): TemplateRef<unknown> | null {
    return this.cells().find((c) => c.key() === key)?.template ?? null;
  }

  // Width of a text skeleton: varies by row and column so the rows do not look like a stripe.
  protected skeletonWidth(row: number, col: number): string {
    return ['70%', '55%', '85%', '62%'][(row + col) % 4];
  }

  // Alignment of the skeleton inside its cell: the same as the column's text.
  protected skeletonJustify(column: TableColumn<T>): string {
    return column.align === 'right' ? 'justify-end' : column.align === 'center' ? 'justify-center' : 'justify-start';
  }

  protected align(column: TableColumn<T>): string {
    const s = this.s();
    return column.align === 'right' ? s.right : column.align === 'center' ? s.center : 'text-left';
  }

  // Un clic en un enlace, botón o campo de la fila es de ese control, no abre la fila.
  protected activate(row: T, event: Event): void {
    if (!this.clickable()) return;
    if ((event.target as HTMLElement | null)?.closest('a, button, input, select, textarea, label')) return;
    this.rowClick.emit(row);
  }

  // Enter y Espacio abren la fila solo si el foco está en la fila misma; en un control de dentro, la tecla es de ese control. Espacio no desplaza la página.
  protected activateKey(row: T, event: Event, preventScroll = false): void {
    if (event.target !== event.currentTarget || !this.isFocusable()) return;
    if (preventScroll) event.preventDefault();
    this.rowClick.emit(row);
  }

  protected isSelected(row: T): boolean {
    return this.selected().has(this.rowKey()(row));
  }

  protected labelOf(row: T): string {
    return this.rowLabel()?.(row) ?? '';
  }

  protected toggle(row: T): void {
    const next = new Set(this.selected());
    const key = this.rowKey()(row);
    if (!next.delete(key)) next.add(key);
    this.selectionChange.emit(next);
  }

  protected toggleAll(): void {
    const next = new Set(this.selected());
    const keys = this.rows().map((r) => this.rowKey()(r));
    if (this.allSelected()) keys.forEach((k) => next.delete(k));
    else keys.forEach((k) => next.add(k));
    this.selectionChange.emit(next);
  }
}
