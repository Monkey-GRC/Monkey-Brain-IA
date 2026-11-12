/**
 * Pure logic of the side menu with groups (design-system components.md, «Menú lateral con grupos»).
 * No Angular and no DOM, so it is tested without a TestBed. It works on the `NavItem` / `NavSubItem` shape of `navigation.config.ts`,
 * of which it only needs the fields below.
 */
export interface NavChildLike {
  path: string;
  roles?: string[];
}

export interface NavEntryLike<C extends NavChildLike = NavChildLike> {
  name: string;
  path?: string;
  roles?: string[];
  subItems?: C[];
}

function isVisibleFor(entry: { roles?: string[] }, role: string | undefined): boolean {
  return !entry.roles || (!!role && entry.roles.includes(role));
}

/**
 * Items (and children) that the role can use. A parent whose children are all hidden loses `subItems`, so it behaves as a simple item
 * (and shows only if it has its own `path`).
 * Hiding is UX: the real barrier is the backend.
 */
export function filterNavByRole<T extends NavEntryLike>(items: readonly T[], role: string | undefined): T[] {
  return items
    .filter((item) => isVisibleFor(item, role))
    .map((item) => {
      if (!item.subItems) return item;
      const children = item.subItems.filter((child) => isVisibleFor(child, role));
      if (children.length > 0) return { ...item, subItems: children } as T;
      const { subItems: _hidden, ...simple } = item;
      return simple as T;
    });
}

/** True when the item has at least one visible child (the items given are already filtered by role). */
export function isGroup(item: NavEntryLike): boolean {
  return !!item.subItems && item.subItems.length > 0;
}

/** True when the route of the parent or the route of one of its children is the active one. */
export function groupHasActiveRoute(item: NavEntryLike, isActive: (path: string) => boolean): boolean {
  if (item.path && isActive(item.path)) return true;
  return (item.subItems ?? []).some((child) => isActive(child.path));
}

/** Open and close a group by hand. Returns a new set; the argument is not mutated. */
export function toggleGroup(open: ReadonlySet<string>, name: string): Set<string> {
  const next = new Set(open);
  if (!next.delete(name)) next.add(name);
  return next;
}

/**
 * A group opens by itself when it holds the active page (see `groupHasActiveRoute`). It never closes by itself:
 * the groups that were open stay open, and the person closes them by clicking the title.
 */
export function openActiveGroups(open: ReadonlySet<string>, items: readonly NavEntryLike[], isActive: (path: string) => boolean): Set<string> {
  const next = new Set(open);
  for (const item of items) {
    if (isGroup(item) && groupHasActiveRoute(item, isActive)) next.add(item.name);
  }
  return next;
}

/** The DOM id of the list of children of a group (for `aria-controls`). The `name` of an item can have spaces or dots. */
export function groupDomId(name: string): string {
  return 'nav-group-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** True when the menu of this role has an entry (or a child) that goes to `path`: the same source of permissions as the menu itself. */
export function canReachPath(items: readonly NavEntryLike[], role: string | undefined, path: string): boolean {
  return filterNavByRole(items, role).some((item) => item.path === path || (item.subItems ?? []).some((child) => child.path === path));
}
