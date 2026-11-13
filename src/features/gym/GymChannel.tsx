import { useMemo } from 'react';
import { openSheet } from '../../app/sheets';
import { getSectionTopics, sectionEntries, setTargets, topicSectionMap, useTargets, useToday } from '../../data/lt';
import { data } from '../../data/store';
import { occurrences } from '../../domain/calendar/occurrences';
import { addDays, shortDay, weekdayIndex, weekStart } from '../../domain/log/dates';
import { useStore } from '../../lib/createStore';
import { accent, H2, Meter, Source, Stepper } from '../../ui/i/bits';
import { ChannelHead } from '../../ui/i/ChannelHead';
import { RelatedTasks } from '../../ui/i/RelatedTasks';
import { gymStats, isGymDetail, muscleName, musclesOf, overdue, setsDone, type GymDetail } from './model';
import './sheets';
import './gym.css';
import { GymArt } from './Art';
import { BarTools } from './BarTools';
import './theme.css';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const ago = (n: number | null) => (n === null ? 'never' : n === 0 ? 'today' : n === 1 ? 'yesterday' : `${n} days ago`);

/** A day's chip: the first group's first letters, and how many more. */
function chipText(groups: string[]) {
  if (!groups.length) return 'GYM';
  return `${muscleName(groups[0]).slice(0, 4).toUpperCase()}${groups.length > 1 ? `+${groups.length - 1}` : ''}`;
}

export function GymChannel() {
  const today = useToday();
  const targets = useTargets();
  const st = useStore(data, (s) => s);
  const sessions = useMemo(() => sectionEntries<GymDetail>(st, 'gym'), [st]);
  const stats = useMemo(() => gymStats(sessions, today), [sessions, today]);
  const lately = useMemo(() => overdue(stats), [stats]);

  const monday = weekStart(today);
  const week = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const occ = useMemo(() => occurrences(st.lt_events.values(), monday, addDays(monday, 6)).filter((o) => !o.cancelled), [st.lt_events, monday]);
  const map = topicSectionMap(st.log_topics.values(), getSectionTopics());
  const sportByDay = (d: string) => occ.some((o) => o.date === d && o.event.section === 'sports') || [...st.log_entries.values()].some((e) => !e.deleted_at && e.date === d && map.get(e.topic_id) === 'sports');
  const thisWeek = sessions.filter((s) => s.entry.date >= monday && s.entry.date <= today).length;
  const last = sessions.find((s) => s.entry.date <= today);
  const lastD = last && isGymDetail(last.detail) ? last.detail : null;
  const top = Math.max(1, ...stats.muscles.map((m) => m.month));

  return (
    <div style={accent('gym')}>
      <ChannelHead id="gym" art={<GymArt />} />
      <div className="i-pnl i-stack">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span className="i-lab">{last ? `Last · ${shortDay(last.entry.date, today)}` : 'No sessions yet'}</span>
          <span className="i-tag i-tag--c">{thisWeek}/{targets.gymWeek} THIS WEEK</span>
        </div>
        {last && <h2 className="g-title">{lastD?.name ?? 'Gym'}</h2>}
        <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={() => openSheet({ type: 'gym-log' })}>
          Log gym
        </button>
        <p className="i-note">Pick the muscle groups you hit. That is all it needs.</p>
      </div>

      <H2>This week</H2>
      <div className="g-week">
        {week.map((d) => (
          <div key={d} className={d === today ? 'is-now' : ''}>
            <span className="i-mono">{DAYS[weekdayIndex(d)]}</span>
            <b>{+d.slice(8)}</b>
            {sessions
              .filter((s) => s.entry.date === d)
              .map((s) => (
                <span key={s.entry.id} className="g-chip is-done">{chipText(musclesOf(s.detail))}</span>
              ))}
            {sportByDay(d) && <span className="g-sport">SPORT</span>}
          </div>
        ))}
      </div>

      <H2 aside={stats.tagged ? 'sessions that hit it' : undefined}>Muscle groups</H2>
      {stats.tagged ? (
        <>
          <div className="i-pnl i-pnl--flush g-mus" role="table" aria-label="Sessions per muscle group">
            <div className="g-mus__r g-mus__h i-mono i-small i-dim" role="row">
              <span role="columnheader">GROUP</span>
              <span role="columnheader">28 DAYS</span>
              <span role="columnheader">7D</span>
              <span role="columnheader">ALL</span>
              <span role="columnheader">LAST</span>
            </div>
            {stats.muscles.map((m) => (
              <div key={m.id} className="g-mus__r" role="row">
                <span role="cell" className="g-mus__n">{m.name}</span>
                <span role="cell" className="g-mus__bar" aria-label={`${m.name}: ${m.month} in the last 28 days`}>
                  <i style={{ width: `${(m.month / top) * 100}%` }} />
                  <b className="i-mono">{m.month}</b>
                </span>
                <span role="cell" className="i-mono">{m.week}</span>
                <span role="cell" className="i-mono">{m.total}</span>
                <span role="cell" className="i-mono i-small i-dim">{ago(m.daysAgo)}</span>
              </div>
            ))}
          </div>
          {lately.length > 0 && (
            <p className="i-note" style={{ marginTop: 8 }}>
              Not hit for a week or more: {lately.slice(0, 6).map((m) => `${m.name}${m.daysAgo === null ? '' : ` (${m.daysAgo}d)`}`).join(', ')}.
            </p>
          )}
        </>
      ) : (
        <p className="i-note">Counts per group appear once a session has muscle groups.</p>
      )}
      {stats.untagged > 0 && stats.tagged > 0 && <Source kind="off">{stats.untagged} earlier session{stats.untagged === 1 ? ' has' : 's have'} no muscle groups, so {stats.untagged === 1 ? 'it isn’t' : 'they aren’t'} counted here.</Source>}

      <H2 aside={`${sessions.length} sessions`}>History</H2>
      <div className="i-pnl i-pnl--flush">
        {sessions.length ? (
          sessions.slice(0, 12).map((s) => {
            const d = isGymDetail(s.detail) ? s.detail : null;
            const groups = musclesOf(d);
            return (
              <button key={s.entry.id} type="button" className="i-row" onClick={() => openSheet({ type: 'gym-log', editId: s.entry.id })}>
                <span className="i-row__t">
                  <b>{d?.name ?? 'Gym'}</b> <span className="i-mono i-small i-dim">{shortDay(s.entry.date)}</span>
                  <small>
                    {d ? (groups.length ? groups.map(muscleName).join(', ') : setsDone(d) ? `${setsDone(d)} sets` : 'No groups') : 'From the Daily Log · no groups'}
                    {d?.effort ? ` · effort ${d.effort}/10` : ''}
                    {d?.soreness != null ? ` · soreness ${d.soreness}` : ''}
                    {d?.pain ? ` · pain noted${d.painNote ? `: ${d.painNote}` : ''}` : ''}
                  </small>
                </span>
                <span className="i-row__n">{s.entry.minutes}m</span>
              </button>
            );
          })
        ) : (
          <p className="i-note" style={{ padding: '12px 0' }}>Finished sessions appear here.</p>
        )}
      </div>

      <BarTools sessions={sessions} />

      <H2>Weekly target</H2>
      <div className="i-pnl i-pnl--flush">
        <div className="i-kv">
          <span>
            Gym sessions per week
            <br />
            <span className="i-mono i-small i-dim">from this week on; past weeks keep theirs</span>
          </span>
          <Stepper value={targets.gymWeek} label="gym sessions per week" onStep={(s) => setTargets({ gymWeek: Math.max(1, Math.min(6, targets.gymWeek + s)) })} />
        </div>
      </div>
      <div className="i-meters" style={{ marginTop: 10 }}>
        <Meter value={sessions.filter((s) => s.entry.date > addDays(today, -28)).length} label="Sessions · last 4 weeks" />
        <Meter value={sessions.length ? `${Math.round(sessions.slice(0, 8).reduce((a, s) => a + s.entry.minutes, 0) / Math.min(8, sessions.length))}m` : '—'} label="Average length · recent" />
      </div>
      <RelatedTasks section="gym" />
    </div>
  );
}
