/**
 * 今日の記録: what's recorded today and what isn't yet, worked out from the records (nothing stored).
 * Mood and today's question open right here; everything else opens its own sheet or room.
 */
import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { navigate } from '../../app/router';
import { openSheet } from '../../app/sheets';
import { progressInput, useToday } from '../../data/lt';
import { data } from '../../data/store';
import type { SectionId } from '../../data/types';
import { weatherOf } from '../../domain/hq/checkin';
import { closingDate, isClosingTime, questionFor } from '../../domain/hq/diary';
import { appliesOn } from '../../domain/hq/rituals';
import { hourIn } from '../../domain/fun/season';
import { shortMinutes } from '../../domain/log/duration';
import { sectionInfo } from '../../domain/sections';
import { useStore } from '../../lib/createStore';
import { accent } from '../../ui/i/bits';
import { CheckInCard } from '../hq/HomeCards';
import { DiaryLine } from '../hq/rooms/Diary';
import { useHq, type HqState } from '../hq/store';
import { playNight } from '../../app/specialMoments';
import type { DataState } from '../../data/store';

export type RowId = 'mood' | 'question' | 'activity' | 'sleep' | 'rituals' | 'tasks' | 'screen' | 'close';

export interface Row {
  id: RowId;
  label: string;
  /** What's recorded, or what's still to do. */
  detail: string;
  done: boolean;
  /** Not expected yet (screen time before the evening): shown, but not counted as missing. */
  later?: boolean;
  /** Opens inside the list instead of going somewhere. */
  inline?: boolean;
  go?: () => void;
  c?: string;
}

export interface Logged {
  section: SectionId | null;
  name: string;
  minutes: number;
  count: number;
}

/** Everything in the Daily Log today, by section (topics no section uses are listed by name). */
export function loggedToday(st: DataState, today: string): Logged[] {
  const input = progressInput(st, today);
  const by = new Map<string, Logged>();
  for (const e of input.entries) {
    if (e.date !== today) continue;
    const section = input.topicSection.get(e.topic_id) ?? null;
    const key = section ?? `topic:${e.topic_id}`;
    const name = section ? sectionInfo(section).name : (st.log_topics.get(e.topic_id)?.name ?? 'Other');
    const cur = by.get(key) ?? { section, name, minutes: 0, count: 0 };
    cur.minutes += e.minutes;
    cur.count += 1;
    by.set(key, cur);
  }
  return [...by.values()].sort((a, b) => b.minutes - a.minutes);
}

/** The checklist's rows, worked out from the records. */
export function checklistRows(st: DataState, hq: HqState, today: string, hour: number, logged: Logged[]): Row[] {
  const evening = isClosingTime(hour);
  const metric = (m: string) => [...st.log_metrics.values()].find((x) => !x.deleted_at && x.metric === m && x.date === today);
  const sleep = metric('sleep');
  const screen = metric('screen');
  const mood = hq.checkIns.find((c) => c.date === today);
  const diary = hq.diary.find((e) => e.date === today);
  const rituals = hq.rituals.filter((r) => !r.archived && appliesOn(r, today));
  const ritualsDone = rituals.filter((r) => hq.ritualDays.get(today)?.has(r.id)).length;
  const todos = [...st.todos.values()].filter((t) => !t.deleted_at);
  const late = todos.filter((t) => !t.done_at && t.due && t.due <= today).length;
  const dueDone = todos.filter((t) => t.done_at && t.due === today).length;
  const closeDate = closingDate(today, hour);
  const closed = hq.closes.some((c) => c.date === closeDate && c.at);
  const minutes = logged.reduce((s, l) => s + l.minutes, 0);
  const w = mood ? weatherOf(mood.mood) : null;

  const out: Row[] = [
    {
      id: 'mood',
      label: 'Mood',
      detail: w ? `${w.name}${mood?.energy ? ` · energy ${mood.energy}/5` : ''}` : 'How’s the weather in there?',
      done: !!mood,
      inline: true,
      c: w?.c,
    },
    {
      id: 'question',
      label: 'Today’s question',
      detail: diary ? diary.text : questionFor(today),
      done: !!diary,
      inline: true,
    },
    {
      id: 'activity',
      label: 'Activity',
      detail: logged.length ? `${shortMinutes(minutes)} · ${logged.map((l) => l.name).join(', ')}` : 'Nothing logged yet',
      done: logged.length > 0,
      inline: true,
    },
    {
      id: 'sleep',
      label: 'Sleep last night',
      detail: sleep ? shortMinutes(sleep.minutes) : 'Not logged',
      done: !!sleep,
      go: () => openSheet({ type: 'sleep', date: today }),
      c: 'var(--c-sleep)',
    },
  ];
  if (rituals.length)
    out.push({
      id: 'rituals',
      label: 'Rituals',
      detail: `${ritualsDone} of ${rituals.length} done`,
      done: ritualsDone === rituals.length,
      go: () => navigate('base', ['rituals']),
    });
  if (late || dueDone)
    out.push({
      id: 'tasks',
      label: 'Tasks due',
      detail: late ? `${late} still open` : `${dueDone} done`,
      done: !late,
      go: () => navigate('tasks'),
    });
  out.push({
    id: 'screen',
    label: 'Screen time',
    detail: screen ? shortMinutes(screen.minutes) : evening ? 'Not logged' : 'Log it tonight',
    done: !!screen,
    later: !screen && !evening,
    go: () => openSheet({ type: 'screen', date: today }),
    c: 'var(--c-screen)',
  });
  if (evening)
    out.push({
      id: 'close',
      label: 'Close the day',
      detail: closed ? 'Closed' : 'Clear what’s left, then stop',
      done: closed,
      go: () => navigate('base', ['close']),
    });
  return out;
}

/** Today's checklist with its tally; also read by the shell for the "day complete" scene. */
export function useChecklist() {
  const today = useToday();
  const st = useStore(data, (s) => s);
  const hq = useHq();
  const hour = hourIn(st.settings.log_timezone);
  const logged = useMemo(() => loggedToday(st, today), [st, today]);
  const rows = useMemo(() => checklistRows(st, hq, today, hour, logged), [st, hq, today, hour, logged]);
  const counted = rows.filter((r) => !r.later);
  const done = counted.filter((r) => r.done).length;
  return { today, hour, evening: isClosingTime(hour), logged, rows, counted: counted.length, done, allDone: done === counted.length, ready: st.ready };
}

export function TodayChecklist() {
  const { today, logged, rows, counted, done, allDone, evening } = useChecklist();
  const [open, setOpen] = useState<RowId | null>(null);
  const [showAll, setShowAll] = useState(false);
  // When everything's in, fold down to one line until asked.
  const visible = allDone && !showAll ? [] : rows;

  const inlineBody = (id: RowId): ReactNode => {
    if (id === 'mood') return <CheckInCard always />;
    if (id === 'question') return <DiaryLine date={today} />;
    if (id === 'activity')
      return (
        <div className="h-tdl__log">
          {logged.length === 0 ? (
            <p className="i-note">Nothing in the Daily Log for today yet.</p>
          ) : (
            logged.map((l) => (
              <button key={l.section ?? l.name} type="button" className="h-tdl__logrow" style={accent(l.section)} onClick={() => l.section && navigate(l.section)} disabled={!l.section}>
                <span aria-hidden="true">{l.section ? sectionInfo(l.section).kanji : '・'}</span>
                <b>{l.name}</b>
                <small>{l.count > 1 ? `${l.count} sessions · ` : ''}{shortMinutes(l.minutes)}</small>
              </button>
            ))
          )}
          <div className="h-tdl__acts">
            <button type="button" className="i-btn i-btn--sm i-btn--sig" onClick={() => openSheet({ type: 'quick' })}>
              + Log something
            </button>
            <button type="button" className="i-link" onClick={() => navigate('log')}>
              All activity ▸
            </button>
          </div>
        </div>
      );
    return null;
  };

  return (
    <section className={`h-tdl${allDone ? ' is-all' : ''}`} aria-label="Today’s checklist">
      <div className="h-tdl__head">
        <h2 className="h-h2">
          <span aria-hidden="true">今日</span> Today’s checklist
        </h2>
        <span className="h-tdl__count" aria-label={`${done} of ${counted} recorded`}>
          {done}/{counted}
        </span>
      </div>
      <span className="h-tdl__bar" aria-hidden="true">
        <i style={{ width: `${counted ? Math.round((done / counted) * 100) : 0}%` }} />
      </span>
      {allDone && (
        <button type="button" className="h-tdl__all" onClick={() => setShowAll(!showAll)} aria-expanded={showAll}>
          ✓ Everything’s recorded for today · {showAll ? 'hide' : 'show'}
        </button>
      )}
      {visible.length > 0 && (
        <ul className="h-tdl__list">
          {visible.map((r) => {
            const expanded = open === r.id;
            return (
              <li key={r.id} className={`h-tdl__row${r.done ? ' is-done' : ''}${r.later ? ' is-later' : ''}`} style={r.c ? ({ '--c': r.c } as CSSProperties) : undefined}>
                <button
                  type="button"
                  className="h-tdl__btn"
                  aria-expanded={r.inline ? expanded : undefined}
                  onClick={() => (r.inline ? setOpen(expanded ? null : r.id) : r.go?.())}
                >
                  <span className="h-tdl__ck" aria-hidden="true">
                    {r.done ? '✓' : ''}
                  </span>
                  <span className="h-tdl__t">
                    <b>
                      {r.label}
                      <span className="i-sr">{r.done ? ', recorded' : r.later ? ', later' : ', not recorded yet'}</span>
                    </b>
                    <small>{r.detail}</small>
                  </span>
                  <span className="h-tdl__go" aria-hidden="true">
                    {r.inline ? (expanded ? '▴' : '▾') : '▸'}
                  </span>
                </button>
                {r.inline && expanded && <div className="h-tdl__body">{inlineBody(r.id)}</div>}
              </li>
            );
          })}
        </ul>
      )}
      {evening && (
        <button type="button" className="h-tdl__bed" onClick={playNight}>
          <span aria-hidden="true">☾</span> Going to bed
        </button>
      )}
    </section>
  );
}
