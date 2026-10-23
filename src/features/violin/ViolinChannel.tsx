import { useMemo, useState } from 'react';
import { openSheet } from '../../app/sheets';
import { sectionEntries, sectionRecords, setTargets, useTargets, useToday } from '../../data/lt';
import { deleteSession } from '../../data/sessions';
import { data } from '../../data/store';
import { occurrences } from '../../domain/calendar/occurrences';
import { addDays, dayCount, shortDay, weekStart } from '../../domain/log/dates';
import { useStore } from '../../lib/createStore';
import { accent, H2, Meter, Seg, Stepper } from '../../ui/i/bits';
import { Bars, Matrix } from '../../ui/i/charts';
import { ChannelHead } from '../../ui/i/ChannelHead';
import { Icon } from '../../ui/i/Icon';
import { RelatedTasks } from '../../ui/i/RelatedTasks';
import { daysPractised, dayGrid, isViolinDetail, itemStats, pieceOf, SESSION_TYPES, typeInfo, weekTotals, type Session, type ViolinDetail } from './model';
import './LogSheet';
import './PieceSheet';

const PAGE = 15;

function SessionRow({ s, names }: { s: Session; names: Map<string, string> }) {
  const d = isViolinDetail(s.detail) ? s.detail : null;
  const items = d ? [...d.pieces, ...d.scales] : [];
  return (
    <div className="i-row">
      <button type="button" className="i-row__t" style={{ textAlign: 'left' }} onClick={() => openSheet({ type: 'violin', editId: s.entry.id })} aria-label={`Edit ${typeInfo(d?.type)?.name ?? 'session'} on ${shortDay(s.entry.date)}`}>
        <b>{typeInfo(d?.type)?.name ?? 'Violin'}</b> <span className="i-mono i-small i-dim">{shortDay(s.entry.date)}</span>
        <small>
          {items.length ? items.map((id) => `${names.get(id) ?? 'removed item'}${d?.split?.[id] ? ` ${d.split[id]}′` : ''}`).join(' · ') : d ? 'No pieces noted' : 'From the Daily Log · no details'}
          {s.entry.note ? ` — ${s.entry.note}` : ''}
        </small>
      </button>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span className="i-row__n">{s.entry.minutes}m</span>
        <button type="button" className="i-btn i-btn--sm" onClick={() => deleteSession(s.entry.id, 'Session deleted')} aria-label={`Delete session on ${shortDay(s.entry.date)}`}>
          <Icon name="trash" size={16} />
        </button>
      </span>
    </div>
  );
}

export function ViolinChannel() {
  const today = useToday();
  const targets = useTargets();
  const st = useStore(data, (s) => s);
  const sessions = useMemo(() => sectionEntries<ViolinDetail>(st, 'violin'), [st]);
  const records = useMemo(() => [...sectionRecords(st, 'violin', 'piece'), ...sectionRecords(st, 'violin', 'scale')].map(pieceOf), [st]);
  const names = useMemo(() => new Map(records.map((p) => [p.id, p.kind === 'piece' && p.composer ? `${p.composer} ${p.title}` : p.title])), [records]);
  const [shown, setShown] = useState(PAGE);
  const [showPast, setShowPast] = useState(false);

  const weeks = weekTotals(sessions, today, 8);
  const thisWeek = weeks[weeks.length - 1];
  const target = targets.violinWeek;
  const performances = useMemo(
    () => occurrences(st.lt_events.values(), today, addDays(today, 365)).filter((o) => o.event.kind === 'performance' && !o.cancelled && (o.event.section === 'violin' || !o.event.section)),
    [st.lt_events, today],
  );
  const current = records.filter((p) => !p.archived);
  const past = records.filter((p) => p.archived);

  return (
    <div style={accent('violin')}>
      <ChannelHead id="violin" />
      <div className="i-pnl i-stack">
        <div className="i-meters">
          <Meter value={<>{thisWeek.minutes}<small>/{target}</small></>} label="Min this week · lessons + rehearsals count" />
          <Meter value={<span style={{ color: thisWeek.minutes >= target ? 'var(--ok)' : undefined }}>{thisWeek.minutes >= target ? 'MET' : `−${target - thisWeek.minutes}`}</span>} label="Weekly target" />
        </div>
        <Seg pct={thisWeek.minutes / target} n={24} label="This week against the target" />
        {thisWeek.minutes > 0 && (
          <p className="i-mono i-small i-mid">
            {SESSION_TYPES.filter((t) => thisWeek.byType[t.id]).map((t) => `${t.name.split(' ')[0].toUpperCase()} ${thisWeek.byType[t.id]}m`).join(' · ')}
            {thisWeek.byType.unspecified ? ` · OTHER ${thisWeek.byType.unspecified}m` : ''}
          </p>
        )}
        <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={() => openSheet({ type: 'violin' })}>
          <Icon name="plus" /> Log practice
        </button>
      </div>

      <H2 aside={<button type="button" className="i-link" onClick={() => openSheet({ type: 'event', preset: { kind: 'performance', section: 'violin', title: '' } })}>+ Performance</button>}>Performances</H2>
      <div className="i-pnl i-pnl--flush">
        {performances.length ? (
          performances.slice(0, 4).map((o) => {
            const pieces = Array.isArray(o.event.data.pieces) ? (o.event.data.pieces as string[]).map((id) => names.get(id)).filter(Boolean) : [];
            return (
              <button key={o.key} type="button" className="i-row" onClick={() => openSheet({ type: 'event', key: o.key })}>
                <span className="i-row__t">
                  <b>{o.event.title}</b>
                  <small>
                    {shortDay(o.date)}
                    {o.start ? ` ${o.start}` : ''}
                    {o.event.note ? ` · ${o.event.note}` : ''}
                    {pieces.length ? ` · ${pieces.join(', ')}` : ''}
                  </small>
                </span>
                <span className="i-row__n">
                  <span style={{ fontSize: 22, color: 'var(--c)' }}>T−{dayCount(today, o.date) - 1}</span>
                  <small style={{ display: 'block', color: 'var(--fg-3)', fontSize: 11 }}>days</small>
                </span>
              </button>
            );
          })
        ) : (
          <p className="i-note" style={{ padding: '12px 0' }}>No performances coming up. Add one with its date and pieces.</p>
        )}
      </div>

      <div className="i-cols">
        <div>
          <H2 aside={<button type="button" className="i-link" onClick={() => openSheet({ type: 'violin-piece' })}>+ Add</button>}>On the stand</H2>
          <div className="i-pnl i-pnl--flush">
            {current.length ? (
              current.map((p) => {
                const s = itemStats(sessions, p.id);
                return (
                  <button key={p.id} type="button" className="i-row" onClick={() => openSheet({ type: 'violin-piece', editId: p.id })}>
                    <span className="i-row__t">
                      <b>{p.kind === 'piece' && p.composer ? `${p.composer} — ${p.title}` : p.title}</b>
                      <small>
                        {p.kind === 'piece' ? p.status : 'Scale'}
                        {p.group ? ` · ${p.group}` : ''} · last {s.last ? shortDay(s.last) : '—'}
                      </small>
                    </span>
                    <span className="i-row__n">
                      {s.sessions}×
                      <small style={{ display: 'block', color: 'var(--fg-3)', fontSize: 11 }}>{s.preciseSessions ? `${s.preciseMinutes}m split` : '—'}</small>
                    </span>
                  </button>
                );
              })
            ) : (
              <p className="i-note" style={{ padding: '12px 0' }}>Nothing on the stand yet. Add your current pieces and scales so sessions can note them.</p>
            )}
          </div>
          <p className="i-note" style={{ marginTop: 6 }}>Minutes per piece only appear for sessions where you split the time.</p>
          {past.length > 0 && (
            <>
              <button type="button" className="i-link" onClick={() => setShowPast(!showPast)}>
                {showPast ? 'Hide' : 'Show'} past repertoire ({past.length})
              </button>
              {showPast && (
                <div className="i-pnl i-pnl--flush">
                  {past.map((p) => (
                    <button key={p.id} type="button" className="i-row" onClick={() => openSheet({ type: 'violin-piece', editId: p.id })}>
                      <span className="i-row__t">
                        <b>{p.composer ? `${p.composer} — ${p.title}` : p.title}</b>
                        <small>{itemStats(sessions, p.id).sessions} sessions</small>
                      </span>
                      <span className="i-tag">{(p.status || 'Archived').toUpperCase()}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        <div>
          <H2 aside="min / week · 8 weeks">Weekly totals</H2>
          <div className="i-pnl">
            <Bars values={weeks.map((w) => w.minutes)} labels={weeks.map((w) => w.week.slice(8))} long={weeks.map((w) => `Week of ${shortDay(w.week)}`)} target={target} hi={[7]} caption="Violin minutes per week, last 8 weeks" />
          </div>
          <H2 aside={`${daysPractised(sessions, today)}/28 days`}>Consistency</H2>
          <div className="i-pnl">
            <Matrix days={dayGrid(sessions, today, 28)} today={today} label="Violin minutes per day, last 28 days" />
          </div>
        </div>
      </div>

      <H2 aside={`${sessions.length} sessions`}>Practice log</H2>
      <div className="i-pnl i-pnl--flush">
        {sessions.length ? (
          sessions.slice(0, shown).map((s) => <SessionRow key={s.entry.id} s={s} names={names} />)
        ) : (
          <div className="i-empty">
            <span>No sessions yet.</span>
            <button type="button" className="i-btn i-btn--sm i-btn--sig" onClick={() => openSheet({ type: 'violin' })}>
              Log the first one
            </button>
          </div>
        )}
      </div>
      {sessions.length > shown && (
        <button type="button" className="i-link" onClick={() => setShown(shown + PAGE)}>
          Show {Math.min(PAGE, sessions.length - shown)} more
        </button>
      )}

      <H2>Weekly target</H2>
      <div className="i-pnl i-pnl--flush">
        <div className="i-kv">
          <span>
            Violin minutes per week
            <br />
            <span className="i-mono i-small i-dim">applies from this week ({shortDay(weekStart(today))}); past weeks keep theirs</span>
          </span>
          <Stepper value={`${target} min`} label="weekly target" onStep={(s) => setTargets({ violinWeek: Math.max(15, target + 15 * s) })} />
        </div>
      </div>
      <RelatedTasks section="violin" />
    </div>
  );
}
