import type { CSSProperties } from 'react';
import { useProgress, useQuests, useToday } from '../../data/lt';
import { addDays, monthEnd, shortDay, weekdayIndex } from '../../domain/log/dates';
import { SWEEP_XP, type Quest, type QuestPeriod, type QuestSet } from '../../domain/progress/quests';
import { sectionInfo } from '../../domain/sections';

const fmt = (q: Quest, n: number) => (q.unit === 'min' && q.goal >= 120 ? `${Math.floor(n / 60)}h${n % 60 ? ` ${n % 60}m` : ''}` : `${q.unit === 'km' ? Math.round(n * 10) / 10 : n}${q.unit === 'min' ? ' min' : q.unit === 'km' ? ' km' : ''}`);

/** One quest as a slanted training bar: state, what to do, how far along, what it pays. */
export function QuestCard({ q, now }: { q: Quest; now?: boolean }) {
  const pct = q.goal ? q.progress / q.goal : 0;
  const done = !!q.doneOn;
  const state = done ? 'Clear' : now ? 'Now' : 'Next';
  return (
    <div className={`pg-q${done ? ' is-done' : now ? ' is-now' : ''}`} style={{ '--c': q.section ? `var(--c-${q.section})` : 'var(--acc2)' } as CSSProperties}>
      <span className="pg-q__state">{state}</span>
      <span className="pg-q__t">
        <b>
          {q.section && (
            <span className="pg-q__k" aria-hidden="true">
              {sectionInfo(q.section).kanji}
            </span>
          )}
          {q.title}
        </b>
        <small>{q.desc}</small>
        <span className="pg-q__bar" role="progressbar" aria-label={`${q.title} progress`} aria-valuenow={Math.round(pct * 100)} aria-valuemin={0} aria-valuemax={100}>
          <i style={{ width: `${Math.round(pct * 100)}%` }} />
        </span>
      </span>
      <span className="pg-q__r">
        <span className="pg-q__xp">+{q.xp}</span>
        <small>{done ? 'Done' : `${fmt(q, q.progress)}/${fmt(q, q.goal)}`}</small>
      </span>
    </div>
  );
}

const TITLE: Record<QuestPeriod, { name: string; kanji: string }> = {
  daily: { name: 'Daily', kanji: '日' },
  weekly: { name: 'Weekly', kanji: '週' },
  monthly: { name: 'Monthly', kanji: '月' },
};

function ends(set: QuestSet, today: string): string {
  if (set.period === 'daily') return 'New ones at midnight';
  const left = set.period === 'weekly' ? 6 - weekdayIndex(today) : (Date.parse(monthEnd(today)) - Date.parse(today)) / 86_400_000;
  return left === 0 ? 'Last day' : `${left} day${left === 1 ? '' : 's'} left · ends ${shortDay(set.period === 'weekly' ? addDays(today, left) : monthEnd(today))}`;
}

function QuestGroup({ set }: { set: QuestSet }) {
  const today = useToday();
  const done = set.quests.filter((q) => q.doneOn).length;
  const now = set.quests.find((q) => !q.doneOn);
  const t = TITLE[set.period];
  return (
    <section className={`pg-qgroup pg-qgroup--${set.period}`} aria-label={`${t.name} quests`}>
      <div className="pg-qgroup__h">
        <h2>
          <span aria-hidden="true">{t.kanji}</span> {t.name} · {done}/3
        </h2>
        <span>{ends(set, today)}</span>
      </div>
      <div className="pg-quests">
        {set.quests.map((q) => (
          <QuestCard key={q.key} q={q} now={q === now} />
        ))}
      </div>
      <div className={`pg-sweep${set.sweptOn ? ' is-done' : ''}`}>
        <span>{set.sweptOn ? 'All three cleared · bonus earned' : 'Clear all three for a bonus'}</span>
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
          <span className="i-meter__l">Missions cleared</span>
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
