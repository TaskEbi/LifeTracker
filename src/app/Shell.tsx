import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { useProgress, useQuests } from '../data/lt';
import { data } from '../data/store';
import { SECTIONS } from '../domain/sections';
import { SECTION_IDS } from '../data/types';
import { useStore } from '../lib/createStore';
import { accent } from '../ui/i/bits';
import { Icon } from '../ui/i/Icon';
import { RewardOverlay, Toasts } from '../ui/i/Overlays';
import { navigate, useRoute, useRouteDir, type RouteName } from './router';
import { openSheet } from './sheets';
import { SheetHost } from './SheetHost';
import { Home } from '../features/home/Home';
import { sectionViews } from './views';

const Cabinet = lazy(() => import('../features/cabinet/CabinetChannel'));

const pad2 = (n: number) => String(n).padStart(2, '0');

function SyncState() {
  const sync = useStore(data, (s) => s.sync);
  const label =
    sync.status === 'local'
      ? 'LOCAL ONLY'
      : sync.status === 'syncing'
        ? 'SYNCING'
        : sync.status === 'offline'
          ? sync.pending
            ? `OFFLINE · ${sync.pending} WAITING`
            : 'OFFLINE'
          : sync.status === 'error'
            ? 'SYNC PROBLEM'
            : sync.pending
              ? `${sync.pending} WAITING`
              : 'SYNCED';
  const on = sync.status === 'idle' && !sync.pending;
  return (
    <span className="i-status__sync" title={sync.error ?? undefined} style={{ '--c': on ? 'var(--ok)' : sync.status === 'error' ? 'var(--warn)' : 'var(--sig)' } as React.CSSProperties}>
      <span className={`i-led${sync.status === 'local' ? '' : ' is-on'}`} />
      {label}
    </span>
  );
}

/** Desktop: a rail with every channel and the shared utilities. */
function Rail({ current, rest }: { current: RouteName; rest: string[] }) {
  const p = useProgress();
  const quests = useQuests();
  const open = quests.daily.quests.filter((q) => !q.doneOn).length;
  const item = (id: RouteName, label: string, icon: string, extra?: ReactNode, sub: string[] = []) => (
    <button
      key={`${id}/${sub.join('/')}`}
      type="button"
      className="i-rail__item"
      aria-current={current === id && rest.join('/') === sub.join('/') ? 'page' : undefined}
      onClick={() => navigate(id, sub)}
      style={(SECTION_IDS as readonly string[]).includes(id) ? accent(id as never) : undefined}
    >
      <span className="i-rail__code">
        <Icon name={icon} size={17} />
      </span>
      <span>{label}</span>
      {extra && <span className="i-rail__lv">{extra}</span>}
    </button>
  );
  return (
    <nav className="i-rail" aria-label="Channels">
      <div className="i-rail__brand">
        <span>LifeTracker</span>
        <span className="i-rail__badge">LV {p.overall.level}</span>
      </div>
      <button type="button" className="i-btn i-btn--sig i-rail__log" onClick={() => openSheet({ type: 'quick' })}>
        <Icon name="plus" /> Log
      </button>
      {item('home', 'Home', 'home')}
      {SECTIONS.map((s) => item(s.id, s.full, s.id, `LV ${pad2(p.sections[s.id].level)}`))}
      <div className="i-rail__sep" />
      {item('progress', 'Progress', 'progress')}
      {item('progress', 'Quests', 'quest', open ? <span className="i-cmd__badge i-cmd__badge--inline">{open}</span> : undefined, ['quests'])}
      {item('progress', 'Achievements', 'trophy', undefined, ['achievements'])}
      <div className="i-rail__sep" />
      {item('calendar', 'Calendar', 'cal')}
      {item('tasks', 'Tasks', 'tasks')}
      {item('log', 'All activity', 'log')}
      {item('settings', 'Settings', 'settings')}
      <div style={{ marginTop: 'auto', padding: '8px' }} className="i-status">
        <SyncState />
      </div>
    </nav>
  );
}

/** Phone: Home · Calendar · log · Tasks · Progress, always in thumb reach. */
function CommandBar({ current }: { current: RouteName }) {
  const p = useProgress();
  const quests = useQuests();
  const open = quests.daily.quests.filter((q) => !q.doneOn).length;
  const btn = (id: RouteName, label: string, icon: string, badge?: ReactNode) => (
    <button type="button" className="i-cmd__btn" aria-current={current === id ? 'page' : undefined} onClick={() => navigate(id)}>
      <Icon name={icon} />
      <span>{label}</span>
      {badge}
    </button>
  );
  return (
    <nav className="i-cmd" aria-label="Commands">
      <div className="i-cmd__in">
        {btn('home', 'Home', 'home')}
        {btn('calendar', 'Cal', 'cal')}
        <button type="button" className="i-cmd__btn i-cmd__prompt" onClick={() => openSheet({ type: 'quick' })} aria-label="Log something">
          <Icon name="plus" size={26} />
        </button>
        {btn('tasks', 'Tasks', 'tasks')}
        {btn(
          'progress',
          `LV ${p.overall.level}`,
          'progress',
          open > 0 ? (
            <i className="i-cmd__badge" aria-label={`${open} daily quests open`}>
              {open}
            </i>
          ) : undefined,
        )}
      </div>
    </nav>
  );
}

const SYSTEM: { id: RouteName; label: string; icon: string }[] = [
  { id: 'progress', label: 'Progress', icon: 'progress' },
  { id: 'log', label: 'Activity', icon: 'log' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

/** Phone: the channel strip at the top of every section, so any section is one tap away. */
export function ChannelBar({ current }: { current: RouteName }) {
  return (
    <nav className="i-chbar" aria-label="Channels">
      <button type="button" className="i-chbar__btn" aria-current={current === 'home' ? 'page' : undefined} onClick={() => navigate('home')} style={{ '--c': 'var(--sig)' } as React.CSSProperties}>
        <Icon name="home" size={16} />
        <b>Home</b>
      </button>
      {SECTIONS.map((s) => (
        <button key={s.id} type="button" className="i-chbar__btn" aria-current={current === s.id ? 'page' : undefined} onClick={() => navigate(s.id)} style={accent(s.id)}>
          <Icon name={s.id} size={16} />
          <b>{s.name.slice(0, 7)}</b>
        </button>
      ))}
      <span className="i-chbar__sep" aria-hidden="true" />
      {SYSTEM.map((x) => (
        <button key={x.id} type="button" className="i-chbar__btn" aria-current={current === x.id ? 'page' : undefined} onClick={() => navigate(x.id)} style={{ '--c': 'var(--c-general)' } as React.CSSProperties}>
          <Icon name={x.icon} size={16} />
          <b>{x.label}</b>
        </button>
      ))}
    </nav>
  );
}

export function StatusBar() {
  return (
    <div className="i-status">
      <span>LIFETRACKER</span>
      <SyncState />
    </div>
  );
}

export function Shell() {
  const route = useRoute();
  const dir = useRouteDir();
  const View: ComponentType | undefined = route.name === 'home' ? Home : sectionViews[route.name];
  const isCabinet = route.name === 'cabinet';
  return (
    <div className="i-shell">
      <Rail current={route.name} rest={route.rest} />
      {isCabinet ? (
        <div className="i-cabinet-host">
          <Suspense fallback={<p className="i-loading">CH09 · opening the cabinet…</p>}>
            <Cabinet />
          </Suspense>
        </div>
      ) : (
        <main className="i-main" id="main">
          <div className="i-view" data-dir={dir} key={`${route.name}/${route.rest.join('/')}`} style={(SECTION_IDS as readonly string[]).includes(route.name) ? accent(route.name as never) : undefined}>
            {View ? <View /> : <Home />}
          </div>
        </main>
      )}
      <CommandBar current={route.name} />
      <SheetHost />
      <Toasts />
      <RewardOverlay />
    </div>
  );
}
