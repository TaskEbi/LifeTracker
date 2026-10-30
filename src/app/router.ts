/**
 * Tiny path router: /violin, /calendar, /tasks… The browser's back gesture works because every
 * navigation is a history entry. Vercel rewrites unknown paths to index.html (vercel.json).
 */
import { createStore, useStore } from '../lib/createStore';
import { SECTION_IDS, type SectionId } from '../data/types';

export const UTILITY_ROUTES = ['calendar', 'tasks', 'progress', 'bucket', 'settings', 'log'] as const;
export type RouteName = 'home' | SectionId | (typeof UTILITY_ROUTES)[number];

export interface Route {
  name: RouteName;
  /** Path segments after the route name, e.g. ['history']. */
  rest: string[];
}

const ORDER: RouteName[] = ['home', ...SECTION_IDS, ...UTILITY_ROUTES];

function parse(pathname: string, hash: string): Route {
  // DragonCode links to Road to IOI as any-stop.vercel.app/#road; keep that working here.
  if (hash === '#road') return { name: 'coding', rest: ['road'] };
  // The phone's share sheet and the bookmarklet arrive at /share; the cabinet takes it from there.
  if (pathname === '/share') return { name: 'cabinet', rest: [] };
  const [first = '', ...rest] = pathname.replace(/^\/+|\/+$/g, '').split('/');
  const name = (ORDER as string[]).includes(first) ? (first as RouteName) : 'home';
  return { name, rest: name === 'home' ? [] : rest };
}

const initial = parse(location.pathname, location.hash);
export const router = createStore<{ route: Route; dir: 'fwd' | 'back' }>({ route: initial, dir: 'fwd' });

export function pathOf(route: Route): string {
  return route.name === 'home' ? '/' : `/${[route.name, ...route.rest].join('/')}`;
}

export function navigate(name: RouteName, rest: string[] = [], opts: { replace?: boolean } = {}) {
  const cur = router.get().route;
  const route = { name, rest };
  const path = pathOf(route);
  if (path === pathOf(cur)) return;
  const dir = ORDER.indexOf(name) < ORDER.indexOf(cur.name) || (name === cur.name && rest.length < cur.rest.length) ? 'back' : 'fwd';
  if (opts.replace) history.replaceState({ path }, '', path);
  else history.pushState({ path }, '', path);
  router.set({ route, dir });
  window.scrollTo({ top: 0 });
}

window.addEventListener('popstate', () => {
  router.set({ route: parse(location.pathname, location.hash), dir: 'back' });
});

// Normalise the address once (drop a #road hash, unknown paths).
if (location.pathname !== '/share' && (location.hash === '#road' || pathOf(initial) !== location.pathname)) history.replaceState({ path: pathOf(initial) }, '', pathOf(initial));

export const useRoute = () => useStore(router, (s) => s.route);
export const useRouteDir = () => useStore(router, (s) => s.dir);
