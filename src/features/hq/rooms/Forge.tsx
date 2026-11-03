/** 工房: today's free gaps filled with what matters, and a revision timetable up to the next exams. Nothing is added until you accept it. */
import { useMemo, useState, type CSSProperties } from 'react';
import { navigate, useRoute } from '../../../app/router';
import { openSheet } from '../../../app/sheets';
import { prefValue, sectionRecords, setPref, useSleepSchedule, useToday } from '../../../data/lt';
import { data } from '../../../data/store';
import { addTodo } from '../../../data/todoActions';
import { toast } from '../../../data/ui';
import { occurrences } from '../../../domain/calendar/occurrences';
import { forgeDay, freeGaps, revisionPlan, subjectOfExam, type ForgeItem, type RevisionExam } from '../../../domain/hq/forge';
import type { Energy } from '../../../domain/hq/nextMove';
import { addDays, dayCount, shortDay } from '../../../domain/log/dates';
import { scheduleFor } from '../../../domain/progress/engine';
import { sectionInfo } from '../../../domain/sections';
import { useStore } from '../../../lib/createStore';
import { accent, Chips, H2 } from '../../../ui/i/bits';
import { createEvent, deleteEvent } from '../../calendar/actions';
import { subjectsOf, topicOf, type HardTopic } from '../../study/model';
import { minutesNow, useMoves } from '../HomeCards';
import { RoomHead } from '../HqView';

const toMin = (t: string) => +t.slice(0, 2) * 60 + +t.slice(3, 5);

function DayTab() {
  const today = useToday();
  const st = useStore(data, (s) => s);
  const sleep = useSleepSchedule();
  const [when, setWhen] = useState<'today' | 'tomorrow'>('today');
  const [energy, setEnergy] = useState<Energy>('ok');
  const [dropped, setDropped] = useState<Set<string>>(new Set());
  const date = when === 'today' ? today : addDays(today, 1);
  const moves = useMoves(45, energy, 7);
  const plan = useMemo(() => {
    const busy = occurrences(st.lt_events.values(), date, date).filter((o) => !o.cancelled && o.start).map((o) => ({ start: o.start!, end: o.end }));
    const night = scheduleFor(addDays(date, 1), sleep);
    const from = when === 'today' ? minutesNow(st.settings.log_timezone) : toMin(scheduleFor(date, sleep).wake) + 30;
    const to = Math.max(toMin(night.bed) - sleep.windDown, 18 * 60);
    const tasks = [...st.todos.values()].filter((t) => !t.deleted_at && !t.done_at && t.due && t.due <= date).sort((a, b) => (a.due ?? '').localeCompare(b.due ?? '') || (a.priority === 'high' ? -1 : 0));
    const items: ForgeItem[] = [
      ...tasks.slice(0, 6).map((t) => ({ id: `task:${t.id}`, title: t.title, minutes: 20, section: t.section ?? null, taskId: t.id })),
      ...moves.filter((m) => !['bed', 'tasks', 'sleep-log'].includes(m.id)).map((m) => ({ id: `move:${m.id}`, title: m.title, minutes: Math.max(m.minutes, 15), section: m.section })),
    ].filter((i) => !dropped.has(i.id));
    return { ...forgeDay(items, freeGaps(busy, from, to)), busy: busy.length, wanted: items.length };
  }, [st, date, when, sleep, moves, dropped]);

  const accept = () => {
    const made: string[] = [];
    for (const b of plan.blocks) {
      const ev = createEvent({ title: b.title, section: b.section, kind: 'session', date, start: b.start, end: b.end, repeat: null, note: '', data: { forge: true } });
      if (!('error' in ev)) made.push(ev.id);
    }
    toast(`${made.length} blocks in the calendar`, { label: 'Undo', run: () => made.forEach((id) => deleteEvent(id)) });
    navigate('calendar');
  };

  return (
    <>
      <Chips label="Which day" value={when} onChange={setWhen} options={[{ id: 'today', label: 'Rest of today' }, { id: 'tomorrow', label: 'Tomorrow' }]} />
      <Chips label="Energy" value={energy} onChange={setEnergy} options={[{ id: 'low' as const, label: 'Tired' }, { id: 'ok' as const, label: 'OK' }, { id: 'high' as const, label: 'Sharp' }]} />
      {plan.blocks.length ? (
        <>
          <ol className="fg-plan" aria-label="Proposed plan">
            {plan.blocks.map((b) => (
              <li key={b.id} style={accent(b.section)}>
                <span className="i-mono fg-plan__t">
                  {b.start}
                  <small>{b.end}</small>
                </span>
                <span className="fg-plan__x">
                  <b>{b.title}</b>
                  <small>
                    {b.minutes} min{b.section ? ` · ${sectionInfo(b.section).name}` : ''}
                    {b.taskId ? ' · due' : ''}
                  </small>
                </span>
                <button type="button" className="i-btn i-btn--sm" onClick={() => setDropped(new Set([...dropped, b.id]))} aria-label={`Leave out: ${b.title}`}>
                  ✕
                </button>
              </li>
            ))}
          </ol>
          <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={accept}>
            Put {plan.blocks.length} in the calendar
          </button>
        </>
      ) : (
        <p className="i-note">{plan.wanted ? 'No free gap of 15 minutes left before you wind down. That’s a full day.' : 'Nothing left to plan.'}</p>
      )}
      {plan.left.length > 0 && <p className="i-note">Didn’t fit: {plan.left.map((l) => l.title).join(', ')}.</p>}
      <p className="i-note">Built around {plan.busy ? `${plan.busy} ${plan.busy === 1 ? 'event' : 'events'} in your calendar` : 'an empty calendar'}, stopping when your wind-down starts. Tasks are given 20 minutes; adjust the blocks in the calendar.</p>
      {dropped.size > 0 && (
        <button type="button" className="i-link" onClick={() => setDropped(new Set())}>
          Bring back what I left out
        </button>
      )}
    </>
  );
}

function RevisionTab() {
  const today = useToday();
  const st = useStore(data, (s) => s);
  const [minutes, setMinutes] = useState('60');
  const subjects = useMemo(() => subjectsOf(prefValue(st, 'study_subjects')), [st]);
  const chosen = (prefValue(st, 'rev_subjects') ?? {}) as Record<string, string>;
  const exams = useMemo<RevisionExam[]>(() => {
    const seen = new Set<string>();
    return occurrences(st.lt_events.values(), addDays(today, 1), addDays(today, 240))
      .filter((o) => !o.cancelled && o.event.kind === 'exam')
      .filter((o) => !seen.has(o.event.id + o.date) && !!seen.add(o.event.id + o.date))
      .map((o) => ({ title: o.event.title, date: o.date, subject: chosen[o.event.title] ?? subjectOfExam(o.event.title, subjects) ?? subjects[0] }));
  }, [st, today, subjects]);
  const topics = useMemo(() => sectionRecords(st, 'study', 'study_topic').map(topicOf).filter((t): t is HardTopic => !!t && !t.archived), [st]);
  const plan = useMemo(() => revisionPlan(exams, topics, today, Number(minutes)), [exams, topics, today, minutes]);
  const noTopics = exams.filter((e) => !topics.some((t) => t.subject === e.subject)).map((e) => e.subject);

  const toTasks = () => {
    const existing = new Set([...st.todos.values()].filter((t) => !t.deleted_at).map((t) => `${t.title}|${t.due}`));
    let n = 0;
    for (const d of plan.slice(0, 7)) {
      for (const i of d.items) {
        const title = `${i.subject}: ${i.what}`;
        if (existing.has(`${title}|${d.date}`)) continue;
        const made = addTodo({ title, priority: 'normal', due: d.date, section: 'study' });
        if (!('error' in made)) n++;
      }
    }
    toast(n ? `${n} revision tasks added` : 'Those are already in your tasks');
  };

  if (!exams.length) {
    return (
      <div className="i-pnl i-stack">
        <p className="i-note">Add your exams to the calendar and they’ll appear here with a timetable up to each one.</p>
        <button type="button" className="i-btn i-btn--sig" onClick={() => openSheet({ type: 'event', preset: { kind: 'exam', section: 'study', title: '' } })}>
          + Add an exam
        </button>
      </div>
    );
  }
  return (
    <>
      <div className="i-pnl i-pnl--flush">
        {exams.map((e) => (
          <div key={e.title + e.date} className="i-row">
            <span className="i-row__t">
              <b>{e.title}</b>
              <small>
                {shortDay(e.date, today)} · {dayCount(today, e.date) - 1} days
              </small>
            </span>
            <select className="i-input hq-select" value={e.subject} onChange={(x) => setPref('rev_subjects', { ...chosen, [e.title]: x.target.value })} aria-label={`Subject for ${e.title}`}>
              {subjects.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <Chips label="Time a day" value={minutes} onChange={setMinutes} options={['30', '60', '90', '120'].map((m) => ({ id: m, label: `${m} min a day` }))} />
      {noTopics.length > 0 && (
        <p className="i-note">
          No difficult topics listed for {[...new Set(noTopics)].join(', ')}, so it’s past papers.{' '}
          <button type="button" className="i-link" onClick={() => navigate('study')}>
            List them in Study
          </button>
        </p>
      )}
      <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={toTasks}>
        Add the next 7 days to my tasks
      </button>
      <H2 aside={`${plan.length} days`}>The timetable</H2>
      <div className="fg-days">
        {plan.slice(0, 21).map((d) => (
          <section key={d.date} className="fg-day" aria-label={shortDay(d.date, today)}>
            <h3>{d.date === today ? 'Today' : shortDay(d.date, today)}</h3>
            <ul>
              {d.items.map((i, k) => (
                <li key={k} className={i.paper ? 'is-paper' : ''} style={{ '--k': k } as CSSProperties}>
                  <b>{i.subject}</b> {i.what} <small className="i-mono">{i.minutes}m</small>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="i-note">The topics you marked Lost come up three times as often as Getting there. The last two days before each exam are timed past papers.</p>
    </>
  );
}

export function ForgeRoom() {
  const route = useRoute();
  const tab = route.rest[1] === 'revision' ? 'revision' : 'day';
  return (
    <div>
      <RoomHead room="forge" />
      <Chips label="What to forge" value={tab} onChange={(v) => navigate('base', v === 'day' ? ['forge'] : ['forge', v], { replace: true })} options={[{ id: 'day', label: 'My day' }, { id: 'revision', label: 'Revision' }]} />
      {tab === 'day' ? <DayTab /> : <RevisionTab />}
    </div>
  );
}
