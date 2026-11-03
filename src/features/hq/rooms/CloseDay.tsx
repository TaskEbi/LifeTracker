/** 終礼: close the day. Deal with what's left over, decide tomorrow's first thing, write a line, and stop. */
import { useMemo, useState } from 'react';
import { navigate } from '../../../app/router';
import { progressInput, useSleepSchedule, useToday } from '../../../data/lt';
import { data } from '../../../data/store';
import { deleteTodo, restoreTodo, updateTodo } from '../../../data/todoActions';
import { toggleTask } from '../../../data/ltActions';
import { toast } from '../../../data/ui';
import { occurrences } from '../../../domain/calendar/occurrences';
import { closingDate } from '../../../domain/hq/diary';
import { sleepBank, tonight } from '../../../domain/hq/sleepBank';
import { addDays, shortDay } from '../../../domain/log/dates';
import { formatMinutes } from '../../../domain/log/duration';
import { dayFacts } from '../../../domain/progress/quests';
import { useStore } from '../../../lib/createStore';
import { H2 } from '../../../ui/i/bits';
import { hourIn } from '../../../domain/fun/season';
import { currentReview } from '../../../domain/hq/review';
import { RoomHead } from '../HqView';
import { saveClose, useHq } from '../store';
import { DiaryLine } from './Diary';

export function CloseDayRoom() {
  const today = useToday();
  const st = useStore(data, (s) => s);
  const hq = useHq();
  const schedule = useSleepSchedule();
  const date = closingDate(today, hourIn(st.settings.log_timezone));
  const closed = hq.closes.find((c) => c.date === date);
  const [first, setFirst] = useState(closed?.first ?? '');
  const input = progressInput(st, today);
  const facts = useMemo(() => dayFacts(input).get(date), [input, date]);
  const tomorrow = addDays(date, 1);
  const leftover = useMemo(() => [...st.todos.values()].filter((t) => !t.deleted_at && !t.done_at && t.due && t.due <= date).sort((a, b) => (a.due ?? '').localeCompare(b.due ?? '')), [st.todos, date]);
  const ideas = useMemo(() => {
    const big = currentReview(hq.reviews, tomorrow)?.big.filter((b) => !b.done).map((b) => b.text) ?? [];
    const due = [...st.todos.values()].filter((t) => !t.deleted_at && !t.done_at && t.due === tomorrow).map((t) => t.title);
    return [...new Set([...due, ...big])].slice(0, 4);
  }, [hq.reviews, st.todos, tomorrow]);
  const bed = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of st.log_metrics.values()) if (!r.deleted_at && r.metric === 'sleep') m.set(r.date, r.minutes);
    const firstEvent = occurrences(st.lt_events.values(), tomorrow, tomorrow).filter((o) => !o.cancelled && o.start).sort((a, b) => a.start!.localeCompare(b.start!))[0];
    return tonight(date, schedule, sleepBank(m, date, schedule), firstEvent ? { title: firstEvent.event.title, start: firstEvent.start! } : null);
  }, [st.log_metrics, st.lt_events, tomorrow, date, schedule]);

  const push = (id: string) => {
    const t = data.get().todos.get(id);
    if (t) updateTodo(id, { title: t.title, priority: t.priority, due: tomorrow, section: t.section });
  };
  const drop = (id: string) => {
    const at = deleteTodo(id);
    if (at) toast('Dropped', { label: 'Undo', run: () => restoreTodo(id, at) });
  };
  const close = () => {
    const d = new Date();
    saveClose(date, first, `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
  };

  if (closed?.at) {
    return (
      <div>
        <RoomHead room="close" />
        <section className="cl-done" aria-label="Day closed">
          <span className="cl-done__stamp" aria-hidden="true">
            閉
          </span>
          <h2>The day is closed.</h2>
          {closed.first && (
            <p>
              Tomorrow starts with: <b>{closed.first}</b>
            </p>
          )}
          <p>
            In bed by <b className="i-mono">{bed.bed}</b>. Whatever’s left can wait: it’s written down.
          </p>
          <button type="button" className="i-link" onClick={() => saveClose(date, closed.first, null)}>
            Open it again
          </button>
          <button type="button" className="i-btn i-btn--block" onClick={() => navigate('home')}>
            Home
          </button>
        </section>
      </div>
    );
  }

  return (
    <div>
      <RoomHead room="close" />
      <p className="i-note">{shortDay(date)}: {facts?.minutes ? `${formatMinutes(facts.minutes)} logged across ${facts.sessions} ${facts.sessions === 1 ? 'session' : 'sessions'}` : 'nothing logged'}{facts?.tasks ? `, ${facts.tasks} ${facts.tasks === 1 ? 'task' : 'tasks'} done` : ''}.</p>

      <H2 aside={leftover.length ? `${leftover.length} left` : undefined}>1. What’s left over</H2>
      {leftover.length ? (
        <div className="i-pnl i-pnl--flush">
          {leftover.map((t) => (
            <div key={t.id} className="cl-task">
              <span>
                <b>{t.title}</b>
                {t.due && t.due < date && <small>due {shortDay(t.due, today)}</small>}
              </span>
              <span className="cl-task__acts" role="group" aria-label={`What to do with: ${t.title}`}>
                <button type="button" className="i-btn i-btn--sm" onClick={() => toggleTask(t.id)}>
                  Did it
                </button>
                <button type="button" className="i-btn i-btn--sm" onClick={() => push(t.id)}>
                  Tomorrow
                </button>
                <button type="button" className="i-btn i-btn--sm" onClick={() => drop(t.id)}>
                  Drop
                </button>
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="i-note">Nothing. Clean slate.</p>
      )}

      <H2>2. Tomorrow’s first thing</H2>
      <input className="i-input" value={first} onChange={(e) => setFirst(e.target.value)} placeholder="The one thing you’ll start with" aria-label="Tomorrow’s first thing" maxLength={200} />
      {ideas.length > 0 && (
        <div className="i-chips i-chips--wrap" style={{ marginTop: 6 }}>
          {ideas.map((x) => (
            <button key={x} type="button" className="i-chip" onClick={() => setFirst(x)}>
              {x}
            </button>
          ))}
        </div>
      )}

      <H2>3. One line</H2>
      <div className="i-pnl">
        <DiaryLine date={date} />
      </div>

      <H2>4. Stop</H2>
      <p className="i-note">
        In bed by <b className="i-mono">{bed.bed}</b> to be up at {bed.wake}.
      </p>
      <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={close}>
        Close the day
      </button>
    </div>
  );
}
