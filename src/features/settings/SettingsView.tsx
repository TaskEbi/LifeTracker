import { useEffect, useRef, useState } from 'react';
import { ChannelBar } from '../../app/Shell';
import { applyTheme, setTheme, themeChoice, type ThemeChoice } from '../../app/theme';
import { flushSync, syncNow } from '../../app/syncHandle';
import { navigate } from '../../app/router';
import { exportCollection, download, importCollection } from '../../data/backup';
import { autoMapSections, setPref, useSectionTopics } from '../../data/lt';
import { data } from '../../data/store';
import { TIMED_SECTIONS, type TimedSection } from '../../data/types';
import { sectionInfo } from '../../domain/sections';
import { supabase, syncOffReason } from '../../lib/supabase';
import { useStore } from '../../lib/createStore';
import { accent, H2, Picks, Source } from '../../ui/i/bits';

function Account() {
  const mode = useStore(data, (s) => s.mode);
  const sync = useStore(data, (s) => s.sync);
  const [who, setWho] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    if (supabase) void supabase.auth.getSession().then(({ data: d }) => setWho(d.session?.user.email?.replace(/@any-stop\.vercel\.app$/, '') ?? null));
  }, []);
  const status =
    sync.status === 'local' ? 'Local only' : sync.status === 'syncing' ? 'Syncing…' : sync.status === 'offline' ? 'Offline' : sync.status === 'error' ? 'Sync problem' : 'Synced';
  const signOut = async () => {
    if (!supabase) return;
    if (sync.pending && !confirm) return setConfirm(true);
    setLeaving(true);
    await flushSync(8000);
    await supabase.auth.signOut();
  };
  return (
    <div className="i-pnl i-pnl--flush">
      <div className="i-kv">
        <span>Data</span>
        <b>{mode === 'synced' ? 'Shared with AnyStop (Supabase)' : 'This browser only'}</b>
      </div>
      <div className="i-kv">
        <span>Sync</span>
        <span>
          <b>{status}</b>
          {sync.pending > 0 && <span className="i-mono i-small"> · {sync.pending} waiting</span>}
        </span>
      </div>
      {sync.error && <p className="i-error" style={{ padding: '0 0 8px' }}>{sync.error}</p>}
      {mode === 'local' && syncOffReason && <p className="i-note" style={{ paddingBottom: 10 }}>{syncOffReason} Nothing here is sent anywhere.</p>}
      {mode === 'synced' && (
        <>
          <div className="i-kv">
            <span>Signed in as</span>
            <b>{who ?? '…'}</b>
          </div>
          <div className="i-btns" style={{ padding: '8px 0 12px' }}>
            <button type="button" className="i-btn i-btn--sm" onClick={() => syncNow()} disabled={sync.status === 'syncing'}>
              Sync now
            </button>
            <button type="button" className="i-btn i-btn--sm i-btn--danger" onClick={() => void signOut()} disabled={leaving}>
              {leaving ? 'Signing out…' : confirm ? `Sign out anyway (${sync.pending} not uploaded)` : 'Sign out'}
            </button>
          </div>
          {confirm && <p className="i-note" style={{ paddingBottom: 10 }}>Some changes haven't reached the server yet. They stay on this device and upload next time you sign in here.</p>}
        </>
      )}
    </div>
  );
}

function Mapping() {
  const mapping = useSectionTopics();
  const topics = useStore(data, (s) => s.log_topics);
  const top = [...topics.values()].filter((t) => !t.deleted_at && !t.parent_id).sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  const set = (s: TimedSection, id: string) => setPref('section_topics', { ...mapping, [s]: id || null });
  return (
    <>
      <p className="i-note">Each section reads and saves sessions under one Daily Log topic (and its subcategories). Changing this never moves, renames or deletes entries; AnyStop sees the same topics. A section with none set makes its topic on the first save.</p>
      <div className="i-pnl i-pnl--flush">
        {TIMED_SECTIONS.map((s) => {
          const taken = new Set(TIMED_SECTIONS.filter((o) => o !== s).map((o) => mapping[o]));
          return (
            <label key={s} className="i-kv" style={accent(s)}>
              <span>
                <span className="i-mono i-small" style={{ color: 'var(--c)' }}>{sectionInfo(s).code}</span> {sectionInfo(s).name}
              </span>
              <select className="i-input" style={{ width: 'auto', maxWidth: '55%', minHeight: 40 }} value={mapping[s] ?? ''} onChange={(e) => set(s, e.target.value)} aria-label={`${sectionInfo(s).name} topic`}>
                <option value="">Not set</option>
                {top
                  .filter((t) => !taken.has(t.id))
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                      {t.archived_at ? ' (archived)' : ''}
                    </option>
                  ))}
              </select>
            </label>
          );
        })}
      </div>
      <button type="button" className="i-link" onClick={() => autoMapSections()}>
        Fill unset ones by name
      </button>
    </>
  );
}

function Backup() {
  const mode = useStore(data, (s) => s.mode);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const file = useRef<HTMLInputElement>(null);
  return (
    <div className="i-pnl i-stack">
      <p className="i-note">The export is AnyStop's backup format (cabinet, Daily Log, tasks, settings). LifeTracker's own records (session details, events, nights, templates) are not in it yet.</p>
      <div className="i-btns">
        <button
          type="button"
          className="i-btn i-btn--sm"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              download(await exportCollection(), `lifetracker-${new Date().toISOString().slice(0, 10)}.zip`);
              setMsg({ ok: true, text: 'Export ready.' });
            } catch (e) {
              setMsg({ ok: false, text: e instanceof Error ? e.message : 'Export failed.' });
            }
            setBusy(false);
          }}
        >
          Export backup
        </button>
        {mode === 'local' && (
          <>
            <button type="button" className="i-btn i-btn--sm" disabled={busy} onClick={() => file.current?.click()}>
              Import a backup (local test data)
            </button>
            <input
              ref={file}
              type="file"
              accept=".zip,.json,application/zip,application/json"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (!f) return;
                setBusy(true);
                try {
                  const r = await importCollection(f);
                  setMsg({ ok: true, text: `Imported ${r.logEntries} log entries, ${r.logTopics} topics and ${r.items} cabinet items into this browser.` });
                  autoMapSections();
                } catch (err) {
                  setMsg({ ok: false, text: err instanceof Error ? err.message : 'Import failed.' });
                }
                setBusy(false);
              }}
            />
          </>
        )}
      </div>
      {mode === 'synced' && <p className="i-note">Importing is only offered in local mode, so test data can never reach the shared database.</p>}
      {msg && (
        <p className={msg.ok ? 'i-note' : 'i-error'} role="status">
          {msg.text}
        </p>
      )}
    </div>
  );
}

export function SettingsView() {
  const [theme, setThemeState] = useState<ThemeChoice>(themeChoice);
  const tz = useStore(data, (s) => s.settings.log_timezone);
  useEffect(() => {
    if (theme !== 'system') return;
    const m = matchMedia('(prefers-color-scheme: dark)');
    const on = () => applyTheme('system');
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, [theme]);
  return (
    <div>
      <ChannelBar current="settings" />
      <header className="i-chhead">
        <div>
          <span className="i-chhead__k">SYS · settings</span>
          <h1>Settings</h1>
        </div>
      </header>

      <H2>Account and sync</H2>
      <Account />

      <H2>Appearance</H2>
      <div className="i-pnl">
        <Picks
          label="Theme · this device"
          value={theme}
          onChange={(v) => {
            setTheme(v);
            setThemeState(v);
          }}
          options={[
            { id: 'system', label: 'System' },
            { id: 'light', label: 'Light' },
            { id: 'dark', label: 'Dark' },
          ]}
        />
      </div>

      <H2>Sections and Daily Log topics</H2>
      <Mapping />

      <H2>Days</H2>
      <div className="i-pnl i-pnl--flush">
        <div className="i-kv">
          <span>Time zone for “today”</span>
          <b className="i-mono">{tz}</b>
        </div>
        <p className="i-note" style={{ paddingBottom: 10 }}>Shared with AnyStop's Daily Log; change it there.</p>
      </div>

      <H2>Elsewhere</H2>
      <div className="i-pnl i-pnl--flush">
        <button type="button" className="i-row" onClick={() => navigate('log')}>
          <span className="i-row__t">All activity<small>Every Daily Log entry, including topics not mapped to a section</small></span>
          <span className="i-row__n">→</span>
        </button>
        <button type="button" className="i-row" onClick={() => navigate('progress')}>
          <span className="i-row__t">Progress<small>Levels, achievements, how XP works, rest days</small></span>
          <span className="i-row__n">→</span>
        </button>
      </div>

      <H2>Backup</H2>
      <Backup />

      <H2>Not connected</H2>
      <Source kind="off">
        Garmin sleep, iPhone Screen Time, Google Calendar and Strava are not connected: sleep and screen time are entered by hand, and the calendar is LifeTracker's own. Chess.com (public data) and DragonCode (read-only key) are the only live links.
      </Source>
    </div>
  );
}
