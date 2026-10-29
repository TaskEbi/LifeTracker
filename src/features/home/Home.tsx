import { useMemo, useState, type CSSProperties } from 'react';
import { navigate } from '../../app/router';
import { StatusBar } from '../../app/Shell';
import { openSheet } from '../../app/sheets';
import { toggleTask } from '../../data/ltActions';
import { getSleepSchedule, progressInput, useAchievements, useBoss, useLookBack, useProgress, useQuests, useSectionStreaks, useToday } from '../../data/lt';
import { data, liveItems } from '../../data/store';
import type { SectionId } from '../../data/types';
import { conflicts, occurrences } from '../../domain/calendar/occurrences';
import { addDays, shortDay, weekdayIndex } from '../../domain/log/dates';
import { activeDays, rankFor, scheduleFor, sectionLevel, STAGES } from '../../domain/progress/engine';
import { SECTIONS, sectionInfo, SYSTEM_KANJI } from '../../domain/sections';
import { useStore } from '../../lib/createStore';
import { accent } from '../../ui/i/bits';
import { Drone } from '../../ui/i/Drone';
import { useFocus } from '../focus/focus';
import { BossCard } from '../progress/BossPanel';
import { Recap } from '../progress/LookBack';
import { QuestCard } from '../progress/QuestsPanel';
import { PlanToday } from '../plans/PlanToday';
import './home.css';

const pad2 = (n: number) => String(n).padStart(2, '0');
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

/** One section as a 技 technique: kanji, name, level and its streak light. */
function Technique({ id }: { id: SectionId }) {
  const p = useProgress();
  const streak = useSectionStreaks()[id];
  const items = useStore(data, (s) => s.items);
  const info = sectionInfo(id);
  const lv = id === 'cabinet' ? sectionLevel(p.bySection.cabinet) : p.sections[id];
  const saved = id === 'cabinet' ? liveItems(items).filter((i) => !i.is_example).length : 0;
  return (
    <button
      type="button"
      className="h-tech"
      style={accent(id)}
      onClick={() => navigate(id)}
      aria-label={`${info.full}, level ${lv.level}${streak?.n ? `, ${streak.n} ${streak.label}` : ''}${id === 'cabinet' ? `, ${saved} saved` : ''}`}
    >
      <span className="h-tech__k" aria-hidden="true">
        {info.kanji}
      </span>
      <span className="h-tech__name">
        {info.name}
        {streak?.n ? <i className="i-led is-on" /> : null}
      </span>
      <span className="h-tech__lv">LV {pad2(lv.level)}</span>
      <span className="h-tech__bar">
        <i style={{ width: `${Math.round(lv.pct * 100)}%` }} />
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
  const quests = useQuests();
  const ach = useAchievements();
  const boss = useBoss();
  const focus = useFocus();
  const { recap } = useLookBack(1);
  // The recap leads the first two days of a week, like the "previously on…" before an episode.
  const showRecap = weekdayIndex(today) <= 1 && (recap.minutes > 0 || recap.activeDays > 0);
  const [bubble, setBubble] = useState<string | null>(null);
  const [n, setN] = useState(0);
  const input = progressInput(st, today);
  const chapter = useMemo(() => [...activeDays(input)].filter((d) => d <= today).length || 1, [input, today]);
  const stage = STAGES[p.overall.stage];
  const next = STAGES[p.overall.stage + 1];
  const daily = quests.daily.quests;
  const dailyDone = daily.filter((q) => q.doneOn).length;

  const poke = () => {
    const violinWeek = input.entries.filter((e) => e.date >= addDays(today, -weekdayIndex(today)) && input.topicSection.get(e.topic_id) === 'violin').reduce((s, e) => s + e.minutes, 0);
    const open = daily.find((q) => !q.doneOn);
    const lines = [
      next ? `${p.overall.toNext} XP to the next level. ${next.name} form at LV ${next.level}!` : 'Final form. Nothing left to unlock, only to keep.',
      p.streak.n ? `${p.streak.n} days in a row. Rest days count too.` : 'Log anything today to start a streak.',
      open ? `Next training: ${open.title.toLowerCase()} (${open.progress}/${open.goal}).` : 'All three of today’s training done!',
      `Violin this week: ${violinWeek} of ${input.targets.violinWeek} min.`,
      rows[0] ? `Coming up: ${rows[0].title} at ${rows[0].when}.` : 'Nothing planned. Clear skies.',
      boss.defeatedOn ? `${boss.boss.name} is down. Rest easy… until Monday.` : `${boss.boss.name} has ${Math.max(0, boss.hp - boss.damage)} HP left. It hates ${sectionInfo(boss.boss.weak).name.toLowerCase()}.`,
    ];
    setBubble(lines[n % lines.length]);
    setN(n + 1);
  };

  return (
    <div className="h-home">
      <StatusBar />
      <header className="h-head">
        <div className="h-head__ep" aria-hidden="true">
          第<span className="h-head__num">{chapter}</span>話
        </div>
        <div className="h-head__t">
          <h1>LifeTracker</h1>
          <p>
            Chapter {chapter} · the {stage.name} arc · {shortDay(today)}
          </p>
        </div>
        <div className="h-head__streak" title="Days in a row with anything logged; planned rest days count">
          <b>{p.streak.n}日</b>
          <span>Streak</span>
        </div>
      </header>

      <div className="h-grid">
        <div>
          <section className="h-hero" style={{ '--c': stage.c, '--c2': stage.c2 } as CSSProperties} aria-label="Your character">
            <div className="h-hero__in">
              <span className="h-hero__speed" aria-hidden="true" />
              <button type="button" className="h-hero__drone i-drone" onClick={poke} aria-label="Talk to your drone">
                <Drone stage={p.overall.stage} label={false} />
              </button>
              <span className="h-hero__lv">
                <span className="h-hero__lvk">LV</span>
                <b>{p.overall.level}</b>
                <span className="h-hero__tag h-hero__tag--rank">{rankFor(p.overall.level)}</span>
                <span className="h-hero__tag h-hero__tag--form">
                  Form {p.overall.stage + 1} · {stage.name}
                </span>
              </span>
              <span className="h-hero__sfx" aria-hidden="true">
                ゴゴゴゴ
              </span>
              <span className="h-hero__power">
                <span className="h-hero__powerl">
                  <span>Power</span>
                  <span>
                    {p.overall.into.toLocaleString('en-GB')} / {p.overall.need.toLocaleString('en-GB')}
                    {next ? ` · 覚醒 → ${next.name.toUpperCase()} @ LV ${next.level}` : ' · 極 MAX FORM'}
                  </span>
                </span>
                <span className="h-hero__bar" role="progressbar" aria-label="Overall level progress" aria-valuenow={Math.round(p.overall.pct * 100)} aria-valuemin={0} aria-valuemax={100}>
                  {Array.from({ length: 24 }, (_, i) => (
                    <i key={i} className={i < Math.round(p.overall.pct * 24) ? 'is-on' : ''} />
                  ))}
                </span>
              </span>
              {bubble && (
                <span className="h-hero__bubble" role="status">
                  {bubble}
                </span>
              )}
            </div>
          </section>

          <button type="button" className="h-focus" onClick={() => openSheet({ type: 'focus' })}>
            <span className="h-focus__k" aria-hidden="true">
              集中
            </span>
            <span className="h-focus__t">
              <b>{focus ? (focus.finishedAt ? 'Focus finished' : 'Focus running') : 'Focus mode'}</b>
              <small>{focus ? (focus.finishedAt ? `${focus.minutes} min waiting to be logged` : `${sectionInfo(focus.section).name} · tap to see the timer`) : 'Start a timer, then log it in one tap'}</small>
            </span>
            <span className="h-focus__go" aria-hidden="true">
              ▶
            </span>
          </button>

          <PlanToday />

          <section className="h-sec" aria-label="Techniques: your sections">
            <h2 className="h-h2">
              <span aria-hidden="true">技</span> Techniques
            </h2>
            <div className="h-techs">
              {SECTIONS.map((s) => (
                <Technique key={s.id} id={s.id} />
              ))}
            </div>
          </section>
        </div>

        <div>
          {showRecap && <Recap recap={recap} />}

          <section className="h-sec" aria-label="Weekly boss">
            <div className="h-h2row">
              <h2 className="h-h2">
                <span aria-hidden="true">討伐</span> Boss raid
              </h2>
            </div>
            <BossCard fight={boss} compact />
          </section>

          <section className="h-sec" aria-label="Today's training">
            <div className="h-h2row">
              <h2 className="h-h2">
                <span aria-hidden="true">修行</span> Training · {dailyDone}/3
              </h2>
              <button type="button" className="i-link" onClick={() => navigate('progress', ['quests'])}>
                All missions ▶
              </button>
            </div>
            <div className="pg-quests">
              {daily.map((q) => (
                <QuestCard key={q.key} q={q} now={q === daily.find((x) => !x.doneOn)} />
              ))}
            </div>
          </section>

          <section className="h-sec" aria-label="Today and tomorrow">
            <div className="h-h2row">
              <h2 className="h-h2">
                <span aria-hidden="true">予定</span> Today / tomorrow
              </h2>
              <button type="button" className="i-link" onClick={() => navigate('calendar')}>
                Calendar ▶
              </button>
            </div>
            <div className="h-today">
              {rows.length === 0 ? (
                <p className="i-note" style={{ padding: '10px 0' }}>
                  Nothing planned or due. Add events in the calendar, or{' '}
                  <button type="button" className="i-link" style={{ minHeight: 0 }} onClick={() => openSheet({ type: 'task' })}>
                    add a task
                  </button>
                  .
                </p>
              ) : (
                rows.slice(0, 7).map((r) => (
                  <div key={r.key} className="h-trow" style={accent(r.section)}>
                    <span className="h-trow__t" style={r.when === 'LATE' ? { color: 'var(--warn)' } : undefined}>
                      {r.when}
                    </span>
                    <span className="h-trow__k" aria-hidden="true">
                      {r.section ? sectionInfo(r.section).kanji : '・'}
                    </span>
                    <span className="h-trow__x">{r.title}</span>
                    {r.taskId ? (
                      <button type="button" className="h-ck" onClick={() => toggleTask(r.taskId!)} aria-label={`Complete: ${r.title}`} />
                    ) : (
                      <span className={`h-trow__tag${r.clash ? ' is-warn' : ''}`}>{r.clash ? 'CLASH' : r.tag ?? ''}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          <nav className="h-sys" aria-label="More">
            <button type="button" className="h-sys__btn" onClick={() => navigate('progress')}>
              <span aria-hidden="true">{SYSTEM_KANJI.progress}</span>
              <b>Awakening</b>
              <small>
                {STAGES.length} forms · {rankFor(p.overall.level)}
              </small>
            </button>
            <button type="button" className="h-sys__btn" onClick={() => navigate('progress', ['achievements'])}>
              <span aria-hidden="true">紋</span>
              <b>Emblems</b>
              <small>
                {ach.filter((a) => a.unlockedOn).length}/{ach.length} earned
              </small>
            </button>
            <button type="button" className="h-sys__btn" onClick={() => navigate('log')}>
              <span aria-hidden="true">{SYSTEM_KANJI.log}</span>
              <b>All activity</b>
              <small>Daily Log</small>
            </button>
            <button type="button" className="h-sys__btn" onClick={() => navigate('settings')}>
              <span aria-hidden="true">{SYSTEM_KANJI.settings}</span>
              <b>Settings</b>
              <small>Themes · sync</small>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
