import { useMemo, useState } from 'react';
import { navigate } from '../../app/router';
import { StatusBar } from '../../app/Shell';
import { openSheet } from '../../app/sheets';
import { toggleTask } from '../../data/ltActions';
import { getSleepSchedule, progressInput, useProgress, useSectionStreaks, useToday } from '../../data/lt';
import { data, liveItems } from '../../data/store';
import type { SectionId } from '../../data/types';
import { conflicts, occurrences } from '../../domain/calendar/occurrences';
import { addDays, shortDay, weekdayIndex } from '../../domain/log/dates';
import { sectionLevel, STAGES } from '../../domain/progress/engine';
import { scheduleFor } from '../../domain/progress/engine';
import { SECTIONS, sectionInfo } from '../../domain/sections';
import { useStore } from '../../lib/createStore';
import { accent, Seg } from '../../ui/i/bits';
import { Drone } from '../../ui/i/Drone';
import './home.css';

const pad2 = (n: number) => String(n).padStart(2, '0');
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

function Key({ id }: { id: SectionId }) {
  const p = useProgress();
  const streak = useSectionStreaks()[id];
  const info = sectionInfo(id);
  const lv = p.sections[id];
  return (
    <button type="button" className="h-key" style={accent(id)} onClick={() => navigate(id)} aria-label={`${info.full}, level ${lv.level}${streak?.n ? `, ${streak.n} ${streak.label}` : ''}`}>
      <span className="h-key__ch">
        <span>{info.code}</span>
        <span className={`i-led${streak?.n ? ' is-on' : ''}`} />
      </span>
      <b>{info.name}</b>
      <span className="h-key__lv">
        LV {pad2(lv.level)}
        {streak?.n ? ` · ${streak.n}${streak.unit.toUpperCase()}` : ''}
      </span>
      <span className="h-key__bar">
        <i style={{ width: `${(lv.pct * 100).toFixed(0)}%` }} />
      </span>
    </button>
  );
}

interface TodayRow {
  key: string;
  when: string;
  title: string;
  section: SectionId | null;
  tag?: string;
  taskId?: string;
  clash?: boolean;
}

function useTodayRows(today: string): TodayRow[] {
  const events = useStore(data, (s) => s.lt_events);
  const todos = useStore(data, (s) => s.todos);
  const prefs = useStore(data, (s) => s.lt_prefs);
  return useMemo(() => {
    const tomorrow = addDays(today, 1);
    const occ = occurrences(events.values(), today, tomorrow).filter((o) => !o.cancelled);
    const clash = conflicts(occ);
    const rows: TodayRow[] = occ.map((o) => ({
      key: o.key,
      when: (o.date === today ? '' : `${DAYS[weekdayIndex(o.date)]} `) + (o.start ?? 'ALL DAY'),
      title: o.event.title,
      section: o.event.section,
      clash: clash.has(o.key),
      tag: o.event.kind === 'exam' ? 'EXAM' : o.event.kind === 'performance' ? 'CONCERT' : o.event.kind === 'competition' ? 'MATCH' : undefined,
    }));
    const sleep = getSleepSchedule();
    if (sleep.reminders) {
      const bed = scheduleFor(tomorrow, sleep).bed;
      const m = (+bed.slice(0, 2) * 60 + +bed.slice(3) - sleep.windDown + 1440) % 1440;
      rows.push({ key: 'winddown', when: `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`, title: 'Wind down for bed', section: 'sleep', tag: 'RMD' });
    }
    rows.sort((a, b) => (a.when.length > 5 ? 1 : 0) - (b.when.length > 5 ? 1 : 0) || a.when.localeCompare(b.when));
    const due = [...todos.values()]
      .filter((t) => !t.deleted_at && !t.done_at && t.due && t.due <= tomorrow)
      .sort((a, b) => (a.due ?? '').localeCompare(b.due ?? ''))
      .map<TodayRow>((t) => ({ key: t.id, when: t.due! < today ? 'LATE' : t.due === today ? 'DUE' : `DUE ${DAYS[weekdayIndex(t.due!)]}`, title: t.title, section: t.section ?? null, taskId: t.id }));
    return [...rows, ...due];
  }, [events, todos, prefs, today]);
}

export function Home() {
  const today = useToday();
  const p = useProgress();
  const st = useStore(data, (s) => s);
  const rows = useTodayRows(today);
  const [bubble, setBubble] = useState<string | null>(null);
  const [n, setN] = useState(0);
  const allItems = liveItems(st.items);
  const items = allItems.filter((i) => !i.is_example).length;
  const examples = allItems.length - items;
  const cab = sectionLevel(p.bySection.cabinet);
  const next = STAGES[p.overall.stage + 1];
  const input = progressInput(st, today);

  const poke = () => {
    const violinWeek = input.entries.filter((e) => e.date >= addDays(today, -weekdayIndex(today)) && input.topicSection.get(e.topic_id) === 'violin').reduce((s, e) => s + e.minutes, 0);
    const lines = [
      p.streak.n ? `streak=${p.streak.n}d · rest days count` : 'streak=0 · log anything to start one',
      `xp_to_next=${p.overall.toNext}`,
      `violin_week=${violinWeek}/${input.targets.violinWeek} min`,
      rows[0] ? `next: ${rows[0].title.toLowerCase()} @ ${rows[0].when}` : 'nothing planned · clear skies',
    ];
    setBubble(lines[n % lines.length]);
    setN(n + 1);
  };

  return (
    <div className="h-home">
      <StatusBar />
      <div className="h-status2 i-mono">
        <span>
          {shortDay(today).toUpperCase()} · <b>{['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'][weekdayIndex(today)]}</b>
        </span>
        <span title="Overall streak: days with anything logged, rest days included">
          <span className={`i-led${p.streak.n ? ' is-on' : ''}`} /> STREAK <b>{String(p.streak.n).padStart(3, '0')}</b>
        </span>
      </div>
      <div className="h-grid">
        <div>
          <div className="h-console">
            <div className="h-rail">
              {SECTIONS.slice(0, 4).map((s) => (
                <Key key={s.id} id={s.id} />
              ))}
            </div>
            <button type="button" className="h-scope i-pnl--grid" onClick={poke} aria-label="Ping your drone for a status line">
              {bubble && (
                <span className="h-tip i-mono" role="status">
                  &gt; {bubble}
                </span>
              )}
              <span className="h-drone i-drone">
                <Drone stage={p.overall.stage} />
              </span>
              <span className="h-scope__name">
                {STAGES[p.overall.stage].name} · form {p.overall.stage + 1}/5
              </span>
              <span className="h-scope__lv">LV {p.overall.level}</span>
              <Seg pct={p.overall.pct} label="Overall level progress" />
              <span className="h-scope__xp i-mono">
                {p.overall.into.toLocaleString('en-GB')}/{p.overall.need.toLocaleString('en-GB')} XP{next ? ` · upgrade @ LV ${next.level}` : ''}
              </span>
            </button>
            <div className="h-rail h-rail--right">
              {SECTIONS.slice(4, 8).map((s) => (
                <Key key={s.id} id={s.id} />
              ))}
            </div>
          </div>
          <button type="button" className="h-bay" style={accent('cabinet')} onClick={() => navigate('cabinet')}>
            <span className="i-mono h-bay__code">CH09</span>
            <b>Cabinet</b>
            <span className="i-mono i-small i-mid">
              {items || !examples ? `${items} saved` : `${examples} examples`} · LV {pad2(cab.level)}
            </span>
            <span className="h-bay__slots" aria-hidden="true">
              {Array.from({ length: 12 }, (_, i) => (
                <i key={i} className={i < Math.min(12, Math.ceil(items / 10)) ? 'is-on' : ''} />
              ))}
            </span>
          </button>
        </div>
        <section className="h-today i-pnl" aria-label="Today and tomorrow">
          <div className="h-today__h">
            <span className="i-lab">Today / tomorrow</span>
            <button type="button" className="i-link" onClick={() => navigate('calendar')}>
              Calendar →
            </button>
          </div>
          {rows.length === 0 ? (
            <p className="i-note" style={{ padding: '8px 0 4px' }}>
              Nothing planned or due. Add events in the calendar, or <button type="button" className="i-link" style={{ minHeight: 0 }} onClick={() => openSheet({ type: 'task' })}>add a task</button>.
            </p>
          ) : (
            rows.slice(0, 7).map((r) => (
              <div key={r.key} className="h-trow" style={accent(r.section)}>
                <span className="h-trow__t i-mono" style={r.when === 'LATE' ? { color: 'var(--warn)' } : undefined}>
                  {r.when}
                </span>
                <span className="i-led is-on" />
                <span className="h-trow__x">{r.title}</span>
                {r.taskId ? (
                  <button type="button" className="h-ck" onClick={() => toggleTask(r.taskId!)} aria-label={`Complete: ${r.title}`} />
                ) : (
                  <span className={`i-mono i-small ${r.clash ? 'i-warn-text' : 'i-dim'}`}>{r.clash ? 'CLASH' : r.tag ?? ''}</span>
                )}
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
