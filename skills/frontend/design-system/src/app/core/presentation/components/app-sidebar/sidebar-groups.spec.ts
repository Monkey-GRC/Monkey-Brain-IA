import { canReachPath, filterNavByRole, groupDomId, groupHasActiveRoute, isGroup, NavEntryLike, openActiveGroups, toggleGroup } from './sidebar-groups';

const ITEMS: NavEntryLike[] = [
  { name: 'home', path: '/', roles: ['admin_empresa', 'auditor'] },
  {
    name: 'company', roles: ['admin_empresa'],
    subItems: [{ path: '/onboarding' }, { path: '/services' }],
  },
  {
    name: 'team', path: '/equipo', roles: ['admin_empresa', 'auditor'],
    subItems: [{ path: '/responsables', roles: ['admin_empresa'] }],
  },
  {
    name: 'compliance', path: '/cumplimiento',
    subItems: [{ path: '/cumplimiento/resumen' }, { path: '/cumplimiento/riesgos' }],
  },
];

function active(url: string): (path: string) => boolean {
  return (path) => (path === '/' ? url === '/' : url === path || url.startsWith(path + '/'));
}

describe('sidebar groups', () => {
  describe('filterNavByRole', () => {
    it('keeps the children of a visible parent', () => {
      const items = filterNavByRole(ITEMS, 'admin_empresa');
      expect(items.map((i) => i.name)).toEqual(['home', 'company', 'team', 'compliance']);
      expect(items[2].subItems?.map((c) => c.path)).toEqual(['/responsables']);
    });

    it('hides a child the role cannot use', () => {
      const team = filterNavByRole(ITEMS, 'auditor').find((i) => i.name === 'team');
      expect(team?.subItems).toBeUndefined();
    });

    it('turns a parent without visible children into a simple item', () => {
      const team = filterNavByRole(ITEMS, 'auditor').find((i) => i.name === 'team');
      expect(team).toBeDefined();
      expect(isGroup(team as NavEntryLike)).toBeFalse();
    });

    it('shows nothing that is restricted when there is no role', () => {
      expect(filterNavByRole(ITEMS, undefined).map((i) => i.name)).toEqual(['compliance']);
    });

    it('does not mutate the configuration', () => {
      filterNavByRole(ITEMS, 'auditor');
      expect(ITEMS[2].subItems?.length).toBe(1);
    });
  });

  describe('groupHasActiveRoute', () => {
    it('is true on the page of the parent and on the page of a child', () => {
      expect(groupHasActiveRoute(ITEMS[1], active('/onboarding'))).toBeTrue();
      expect(groupHasActiveRoute(ITEMS[1], active('/services/42'))).toBeTrue();
    });

    it('is false on any other page', () => {
      expect(groupHasActiveRoute(ITEMS[1], active('/cumplimiento'))).toBeFalse();
    });

    it('uses the path of the group, if it has one, for a page that belongs to it without being a child', () => {
      expect(groupHasActiveRoute(ITEMS[3], active('/cumplimiento'))).toBeTrue();
      expect(groupHasActiveRoute(ITEMS[3], active('/cumplimiento/riesgos'))).toBeTrue();
    });

    it('depends only on the children when the group has no path of its own', () => {
      expect(ITEMS[1].path).toBeUndefined();
      expect(groupHasActiveRoute(ITEMS[1], active('/services/42'))).toBeTrue();
    });
  });

  describe('toggleGroup', () => {
    it('opens a closed group and closes an open one, without mutating the input', () => {
      const closed = new Set<string>();
      const opened = toggleGroup(closed, 'company');
      expect(opened.has('company')).toBeTrue();
      expect(closed.size).toBe(0);
      expect(toggleGroup(opened, 'company').has('company')).toBeFalse();
    });
  });

  describe('openActiveGroups', () => {
    it('opens the parent whose child route is active and leaves the others closed', () => {
      const open = openActiveGroups(new Set(), filterNavByRole(ITEMS, 'admin_empresa'), active('/responsables'));
      expect([...open]).toEqual(['team']);
    });

    it('opens the group on the first of its children', () => {
      const open = openActiveGroups(new Set(), filterNavByRole(ITEMS, 'admin_empresa'), active('/onboarding'));
      expect([...open]).toEqual(['company']);
    });

    it('does not close a group the person opened when the route changes', () => {
      const open = openActiveGroups(new Set(['company']), filterNavByRole(ITEMS, 'admin_empresa'), active('/responsables'));
      expect([...open].sort()).toEqual(['company', 'team']);
    });

    it('does not open anything for a simple item', () => {
      const open = openActiveGroups(new Set(), filterNavByRole(ITEMS, 'auditor'), active('/equipo'));
      expect(open.size).toBe(0);
    });
  });

  describe('groupDomId', () => {
    it('makes an id that is valid for aria-controls from a name with spaces or dots', () => {
      expect(groupDomId('Mi empresa')).toBe('nav-group-mi-empresa');
      expect(groupDomId('GRC_FRAMEWORK.COMPANIES')).toBe('nav-group-grc-framework-companies');
    });
  });

  describe('canReachPath', () => {
    it('is true when the menu of the role has the page, as an item or as a child', () => {
      expect(canReachPath(ITEMS, 'admin_empresa', '/onboarding')).toBeTrue();
      expect(canReachPath(ITEMS, 'auditor', '/equipo')).toBeTrue();
    });

    it('is false when the role does not see it, or has no role', () => {
      expect(canReachPath(ITEMS, 'auditor', '/responsables')).toBeFalse();
      expect(canReachPath(ITEMS, 'delegado', '/equipo')).toBeFalse();
      expect(canReachPath(ITEMS, undefined, '/equipo')).toBeFalse();
    });
  });
});
