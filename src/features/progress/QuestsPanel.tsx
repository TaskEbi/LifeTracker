import type { CSSProperties } from 'react';
import { useProgress, useQuests, useToday } from '../../data/lt';
import { addDays, monthEnd, shortDay, weekdayIndex } from '../../domain/log/dates';
import { SWEEP_XP, type Quest, type QuestPeriod, type QuestSet } from '../../domain/progress/quests';
import { H2 } from '../../ui/i/bits';
import { Icon } from '../../ui/i/Icon';

const fmt = (q: Quest, n: number) => (q.unit === 'min' && q.goal >= 120 ? `${Math.floor(n / 60)}h${n % 60 ? ` ${n % 60}m` : ''}` : `${n}${q.unit === 'min' ? ' min' : ''}`);

/** One quest: what to do, how far along, what it pays. */
export function QuestCard({ q }: { q: Quest }) {
  const pct = q.goal ? q.progress / q.goal : 0;
  const done = !!q.doneOn;
  return (
    <div className={`pg-q${done ? ' is-done' : ''}`} style={{ '--c': q.section ? `var(--c-${q.section})` : 'var(--c-quests)' } as CSSProperties}>
      <span className="pg-q__ck" aria-hidden="true">
        {done ? <Icon name="check" size={18} /> : <Icon name={q.section ?? 'quest'} size={18} />}
      </span>
      <span className="pg-q__t">
        <b>{q.title}</b>
        <small>{q.desc}</small>
        <span className="pg-q__bar" role="progressbar" aria-label={`${q.title} progress`} aria-valuenow={Math.round(pct * 100)} aria-valuemin={0} aria-valuemax={100}>
          <i style={{ width: `${Math.round(pct * 100)}%` }} />
        </span>
      </span>
      <span className="pg-q__r">
        <span className="pg-q__xp">+{q.xp} XP</span>
        <small className="i-mono">{done ? 'Done' : `${fmt(q, q.progress)}/${fmt(q, q.goal)}`}</small>
      </span>
    </div>
  );
}

const TITLE: Record<QuestPeriod, string> = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };

function ends(set: QuestSet, today: string): string {
  if (set.period === 'daily') return 'New ones at midnight';
  const left = set.period === 'weekly' ? 6 - weekdayIndex(today) : (Date.parse(monthEnd(today)) - Date.parse(today)) / 86_400_000;
  return left === 0 ? 'Last day' : `${left} day${left === 1 ? '' : 's'} left · ends ${shortDay(set.period === 'weekly' ? addDays(today, left) : monthEnd(today))}`;
}

function QuestGroup({ set }: { set: QuestSet }) {
  const today = useToday();
  const done = set.quests.filter((q) => q.doneOn).length;
  return (
    <section className={`pg-qgroup pg-qgroup--${set.period}`} aria-label={`${TITLE[set.period]} quests`}>
      <H2 aside={ends(set, today)}>
        {TITLE[set.period]} · {done}/3
      </H2>
      <div className="pg-quests">
        {set.quests.map((q) => (
          <QuestCard key={q.key} q={q} />
        ))}
      </div>
      <div className={`pg-sweep${set.sweptOn ? ' is-done' : ''}`}>
        <Icon name={set.sweptOn ? 'check' : 'bolt'} size={16} />
        <span>{set.sweptOn ? `All three done · bonus earned` : `Clear all three for a bonus`}</span>
        <b>+{SWEEP_XP[set.period]} XP</b>
      </div>
    </section>
  );
}

export function QuestsPanel() {
  const board = useQuests();
  const p = useProgress();
  const questXp = p.bySection.quests;
  const completed = p.events.filter((e) => e.section === 'quests' && !e.key.endsWith(':sweep')).length;
  const sweeps = p.events.filter((e) => e.key.startsWith('quest:daily:') && e.key.endsWith(':sweep')).length;
  return (
    <>
      <div className="i-meters pg-qstats">
        <div className="i-meter">
          <span className="i-meter__v">{completed}</span>
          <span className="i-meter__l">Quests done</span>
        </div>
        <div className="i-meter">
          <span className="i-meter__v">{sweeps}</span>
          <span className="i-meter__l">Daily sweeps</span>
        </div>
        <div className="i-meter">
          <span className="i-meter__v">{questXp.toLocaleString('en-GB')}</span>
          <span className="i-meter__l">XP from quests</span>
        </div>
      </div>
      <QuestGroup set={board.daily} />
      <QuestGroup set={board.weekly} />
      <QuestGroup set={board.monthly} />
      <p className="i-note" style={{ marginTop: 12 }}>
        Quests are picked by date, so every device shows the same three. They complete from what you log; deleting a session can undo one.
      </p>
    </>
  );
}
