import { useMemo, useState } from 'react';
import { ChannelBar } from '../../app/Shell';
import { navigate } from '../../app/router';
import { openSheet } from '../../app/sheets';
import { STATUS_LABEL } from '../plans/MarathonPanel';
import { usePlanDay } from '../plans/plans';
import { getSectionTopics, topicSectionMap, useToday } from '../../data/lt';
import { data } from '../../data/store';
import { SECTION_IDS, type SectionId } from '../../data/types';
import { conflicts, matchDone, occurrences, type Occurrence } from '../../domain/calendar/occurrences';
import { addDays, shortDay, weekdayIndex, weekStart } from '../../domain/log/dates';
import { sectionInfo } from '../../domain/sections';
import { useStore } from '../../lib/createStore';
import { accent, H2, Source } from '../../ui/i/bits';
import { Icon } from '../../ui/i/Icon';
import './EventSheet';
import '../tasks/TaskSheet';
import './calendar.css';

const H0 = 6;
const H1 = 22;
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const pos = (t: string) => ((+t.slice(0, 2) + +t.slice(3) / 60 - H0) / (H1 - H0)) * 100;

interface Logged {
  id: string;
  section: SectionId | 'general';
  title: string;
  minutes: number;
}

/** The training plans' sessions on the selected day: shown, never stored as events. */
function PlanRows({ items }: { items: ReturnType<typeof usePlanDay> }) {
  return (
    <>
      {items.map(({ s, state }) => (
        <button key={s.id} type="button" className="c-ev" style={accent(s.kind === 'run' ? 'sports' : 'gym')} onClick={() => navigate(s.kind === 'run' ? 'sports' : 'gym')}>
          <span className="i-mono i-small">PLAN</span>
          <span className={`c-stripe${state.status === 'done' ? '' : ' is-planned'}`} />
          <span className={`c-ti${state.status === 'missed' ? ' is-off' : ''}`}>
            {s.title}
            <small>{s.kind === 'run' ? `marathon plan · ${s.km} km${s.optional ? ' · optional' : ''}` : `gym plan${s.adjust ? ` · ${s.adjust.note}` : ''}`}</small>
          </span>
          <span className={`i-tag${state.status === 'done' ? ' i-tag--ok' : ''}`}>{STATUS_LABEL[state.status].toUpperCase()}</span>
        </button>
      ))}
    </>
  );
}

export function CalendarView() {
  const today = useToday();
  const st = useStore(data, (s) => s);
  const [monday, setMonday] = useState(weekStart(today));
  const [sel, setSel] = useState(today);
  const [filter, setFilter] = useState<SectionId[]>([]);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const sunday = days[6];

  const { occ, clash, status, logged, tasks } = useMemo(() => {
    const all = occurrences(st.lt_events.values(), monday, sunday);
    const clash = conflicts(all);
    const map = topicSectionMap(st.log_topics.values(), getSectionTopics());
    const logged = new Map<string, Logged[]>();
    const loggedSections = new Map<string, Set<string>>();
    for (const e of st.log_entries.values()) {
      if (e.deleted_at || e.date < monday || e.date > sunday) continue;
      const d = st.lt_details.get(e.id);
      const section = d && !d.deleted_at ? d.section : map.get(e.topic_id) ?? 'general';
      const topic = st.log_topics.get(e.topic_id)?.name ?? 'Activity';
      const sub = e.subcategory_id ? st.log_topics.get(e.subcategory_id)?.name : null;
      (logged.get(e.date) ?? logged.set(e.date, []).get(e.date)!).push({ id: e.id, section, title: sub ? `${topic} · ${sub}` : topic, minutes: e.minutes });
      (loggedSections.get(e.date) ?? loggedSections.set(e.date, new Set()).get(e.date)!).add(section);
    }
    const status = matchDone(all, loggedSections, today);
    const tasks = [...st.todos.values()].filter((t) => !t.deleted_at && t.due && t.due >= monday && t.due <= sunday);
    return { occ: all, clash, status, logged, tasks };
  }, [st, monday, sunday, today]);

  const show = (s: SectionId | 'general' | null) => !filter.length || (s && s !== 'general' && filter.includes(s));
  const visible = occ.filter((o) => show(o.event.section));
  const clashes = visible.filter((o) => clash.has(o.key) && !o.cancelled);
  const dayOcc = visible.filter((o) => o.date === sel);
  const dayLogs = (logged.get(sel) ?? []).filter((l) => show(l.section));
  const dayTasks = tasks.filter((t) => t.due === sel && show(t.section ?? null));
  const planDay = usePlanDay(sel).filter((x) => show(x.s.kind === 'run' ? 'sports' : 'gym'));
  const toggleFilter = (s: SectionId) => setFilter(filter.includes(s) ? filter.filter((x) => x !== s) : [...filter, s]);
  const go = (n: number) => {
    const m = addDays(monday, 7 * n);
    setMonday(m);
    setSel(m <= today && today <= addDays(m, 6) ? today : m);
  };

  const tag = (o: Occurrence) => {
    if (o.cancelled) return ['CANCELLED', ''];
    if (clash.has(o.key)) return ['CLASH', 'i-tag--warn'];
    const s = status.get(o.key);
    if (s === 'done') return ['DONE', 'i-tag--ok'];
    if (s === 'unlogged') return ['NOT LOGGED', ''];
    return [o.event.kind === 'session' ? 'PLANNED' : o.event.kind.toUpperCase(), ''];
  };

  return (
    <div>
      <ChannelBar current="calendar" />
      <header className="i-chhead">
        <div>
          <span className="i-chhead__k">SYS · shared calendar</span>
          <h1>Calendar</h1>
        </div>
        <button type="button" className="i-btn i-btn--sig" onClick={() => openSheet({ type: 'event', date: sel >= today ? sel : today })}>
          <Icon name="plus" /> Event
        </button>
      </header>
      <div className="i-chips" role="group" aria-label="Show sections">
        <button type="button" className="i-chip" aria-pressed={!filter.length} onClick={() => setFilter([])}>
          All
        </button>
        {SECTION_IDS.map((s) => (
          <button key={s} type="button" className="i-chip" aria-pressed={filter.includes(s)} onClick={() => toggleFilter(s)} style={accent(s)}>
            <span className="i-led" />
            {sectionInfo(s).name}
          </button>
        ))}
      </div>
      <div className="i-btns" style={{ alignItems: 'center', marginBottom: 8 }}>
        <button type="button" className="i-btn i-btn--sm" onClick={() => go(-1)} aria-label="Previous week">
          ←
        </button>
        <button type="button" className="i-btn i-btn--sm" onClick={() => (setMonday(weekStart(today)), setSel(today))}>
          Today
        </button>
        <button type="button" className="i-btn i-btn--sm" onClick={() => go(1)} aria-label="Next week">
          →
        </button>
        <span className="i-mono i-small i-mid">
          {shortDay(monday)} – {shortDay(sunday)}
        </span>
      </div>
      {clashes.length > 0 && (
        <div className="i-warnbox" style={{ marginBottom: 10 }}>
          <b>!CLASH</b>
          <span>
            {[...new Set(clashes.map((c) => shortDay(c.date)))].join(', ')}: {clashes[0].event.title} overlaps {clash.get(clashes[0].key)!.join(', ')}. Nothing is moved automatically; tap one to change it.
          </span>
        </div>
      )}
      <div className="c-gantt" role="grid" aria-label={`Week of ${shortDay(monday)}, 06:00 to 22:00`}>
        <div className="c-axis">
          <span />
          <div className="c-hrs">
            {[6, 8, 10, 12, 14, 16, 18, 20].map((h) => (
              <span key={h} style={{ left: `${((h - H0) / (H1 - H0)) * 100}%` }}>
                {String(h).padStart(2, '0')}
              </span>
            ))}
          </div>
        </div>
        {days.map((d) => {
          const timed = visible.filter((o) => o.date === d && o.start && o.end);
          const marks = [...visible.filter((o) => o.date === d && !o.start), ...(logged.get(d) ?? []).filter((l) => show(l.section)), ...tasks.filter((t) => t.due === d && show(t.section ?? null))];
          return (
            <button key={d} type="button" className={`c-row${d === today ? ' is-today' : ''}${d === sel ? ' is-sel' : ''}`} onClick={() => setSel(d)} aria-label={`${shortDay(d)}: ${timed.length} timed, ${marks.length} other`} aria-pressed={d === sel}>
              <span className="c-dl">
                {DAYS[weekdayIndex(d)]}
                <b>{+d.slice(8)}</b>
              </span>
              <span className="c-track">
                {timed.map((o, i) => (
                  <span
                    key={o.key}
                    className={`c-bar${status.get(o.key) === 'done' ? '' : ' is-planned'}${clash.has(o.key) && !o.cancelled ? ' is-clash' : ''}${o.cancelled ? ' is-off' : ''}`}
                    style={{ ...accent(o.event.section), left: `${Math.max(0, pos(o.start!))}%`, width: `${Math.max(2, pos(o.end!) - pos(o.start!))}%`, top: 6 + (i % 2) * 20 }}
                    title={`${o.event.title} ${o.start}–${o.end}`}
                  />
                ))}
                {marks.slice(0, 10).map((m, i) => (
                  <span key={i} className="c-dot" style={{ ...accent(('event' in m ? m.event.section : 'section' in m ? (m.section as SectionId) : null) ?? null), left: `${2 + i * 3.4}%` }} />
                ))}
              </span>
            </button>
          );
        })}
      </div>
      <p className="i-note" style={{ marginTop: 6 }}>
        Solid = completed · hatched = planned · red outline = clash · dots = all-day, logged activity and tasks due
      </p>

      <H2 aside={sel === today ? 'today' : undefined}>{shortDay(sel)}</H2>
      <div className="i-pnl i-pnl--flush">
        {dayOcc.length + dayLogs.length + dayTasks.length + planDay.length === 0 && <p className="i-note" style={{ padding: '12px 0' }}>Nothing on this day.</p>}
        {dayOcc.map((o) => {
          const [label, cls] = tag(o);
          return (
            <button key={o.key} type="button" className="c-ev" style={accent(o.event.section)} onClick={() => openSheet({ type: 'event', key: o.key })}>
              <span className="i-mono i-small">{o.start ?? '——'}</span>
              <span className={`c-stripe${status.get(o.key) === 'done' ? '' : ' is-planned'}`} />
              <span className={`c-ti${o.cancelled ? ' is-off' : ''}`}>
                {o.event.title}
                <small>
                  {o.event.section ? sectionInfo(o.event.section).code : 'GEN'}
                  {o.end ? ` · until ${o.end}` : ''}
                  {o.recurring ? ' · weekly' : ''}
                  {o.changed ? ' · moved' : ''}
                  {o.event.note ? ` · ${o.event.note}` : ''}
                </small>
              </span>
              <span className={`i-tag ${cls}`}>{label}</span>
            </button>
          );
        })}
        {dayLogs.map((l) => (
          <div key={l.id} className="c-ev" style={accent(l.section)}>
            <span className="i-mono i-small">——</span>
            <span className="c-stripe" />
            <span className="c-ti">
              {l.title}
              <small>logged · {l.minutes} min</small>
            </span>
            <span className="i-tag i-tag--ok">DONE</span>
          </div>
        ))}
        <PlanRows items={planDay} />
        {dayTasks.map((t) => (
          <button key={t.id} type="button" className="c-ev" style={accent(t.section ?? null)} onClick={() => openSheet({ type: 'task', editId: t.id })}>
            <span className="i-mono i-small">DUE</span>
            <span className="c-stripe is-planned" />
            <span className={`c-ti${t.done_at ? ' is-off' : ''}`}>
              {t.title}
              <small>task</small>
            </span>
            <span className={`i-tag${t.done_at ? ' i-tag--ok' : ''}`}>{t.done_at ? 'DONE' : 'TASK'}</span>
          </button>
        ))}
      </div>

      <H2>Connections</H2>
      <div className="i-stack">
        <Source kind="off">Google Calendar is not connected. It needs a Google OAuth client set up for this app; until then events live only here.</Source>
        <Source kind="off">
          Tanglin school calendar is a reference only: <a href="https://calendar.tts.edu.sg/" target="_blank" rel="noopener noreferrer">calendar.tts.edu.sg</a>. Add the events that matter to you yourself.
        </Source>
      </div>
    </div>
  );
}
