import { lazy, Suspense, type ComponentType } from 'react';
import { useProgress } from '../data/lt';
import { data } from '../data/store';
import { SECTIONS } from '../domain/sections';
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
function Rail({ current }: { current: RouteName }) {
  const p = useProgress();
  const item = (id: RouteName, label: string, code: string, extra?: string) => (
    <button
      key={id}
      type="button"
      className="i-rail__item"
      aria-current={current === id ? 'page' : undefined}
      onClick={() => navigate(id)}
      style={id === 'home' || ['calendar', 'tasks', 'progress', 'settings', 'log'].includes(id) ? undefined : accent(id as never)}
    >
      <span className="i-rail__code">{code}</span>
      <span>{label}</span>
      {extra && <span className="i-rail__lv">{extra}</span>}
    </button>
  );
  return (
    <nav className="i-rail" aria-label="Channels">
      <div className="i-rail__brand">
        <span>LifeTracker</span>
        <span className="i-mono i-dim" style={{ fontSize: 11, letterSpacing: 0 }}>
          LV {p.overall.level}
        </span>
      </div>
      <button type="button" className="i-btn i-btn--sig i-rail__log" onClick={() => openSheet({ type: 'quick' })}>
        <Icon name="plus" /> Log
      </button>
      {item('home', 'Home', '00')}
      {SECTIONS.map((s) => item(s.id, s.full, s.code, `LV ${pad2(p.sections[s.id].level)}`))}
      <div className="i-rail__sep" />
      {item('calendar', 'Calendar', 'SYS')}
      {item('tasks', 'Tasks', 'SYS')}
      {item('progress', 'Progress', 'SYS')}
      {item('log', 'All activity', 'SYS')}
      {item('settings', 'Settings', 'SYS')}
      <div style={{ marginTop: 'auto', padding: '8px' }} className="i-status">
        <SyncState />
      </div>
    </nav>
  );
}

/** Phone: Home · log prompt · Calendar · Tasks, always in thumb reach. */
function CommandBar({ current }: { current: RouteName }) {
  return (
    <nav className="i-cmd" aria-label="Commands">
      <div className="i-cmd__in">
        <button type="button" className="i-cmd__btn" aria-current={current === 'home' ? 'page' : undefined} onClick={() => navigate('home')}>
          Home
        </button>
        <button type="button" className="i-cmd__btn i-cmd__prompt" onClick={() => openSheet({ type: 'quick' })} aria-label="Log something">
          <span>›</span>log …<i className="i-cmd__caret" />
        </button>
        <button type="button" className="i-cmd__btn" aria-current={current === 'calendar' ? 'page' : undefined} onClick={() => navigate('calendar')}>
          Cal
        </button>
        <button type="button" className="i-cmd__btn" aria-current={current === 'tasks' ? 'page' : undefined} onClick={() => navigate('tasks')}>
          Tasks
        </button>
      </div>
    </nav>
  );
}

/** Phone: the channel strip at the top of every section, so any section is one tap away. */
export function ChannelBar({ current }: { current: RouteName }) {
  return (
    <nav className="i-chbar" aria-label="Channels">
      <button type="button" className="i-chbar__btn" onClick={() => navigate('home')} style={{ '--c': 'var(--fg)' } as React.CSSProperties}>
        <b>Home</b>00
      </button>
      {SECTIONS.map((s) => (
        <button key={s.id} type="button" className="i-chbar__btn" aria-current={current === s.id ? 'page' : undefined} onClick={() => navigate(s.id)} style={accent(s.id)}>
          <b>{s.name.slice(0, 7)}</b>
          {s.code}
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
      <Rail current={route.name} />
      {isCabinet ? (
        <div className="i-cabinet-host">
          <Suspense fallback={<p className="i-loading">CH09 · opening the cabinet…</p>}>
            <Cabinet />
          </Suspense>
        </div>
      ) : (
        <main className="i-main" id="main">
          <div className="i-view" data-dir={dir} key={`${route.name}/${route.rest.join('/')}`}>
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
