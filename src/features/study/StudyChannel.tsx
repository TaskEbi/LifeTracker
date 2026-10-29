import { useMemo, useState } from 'react';
import { registerSheet } from '../../app/sheetRegistry';
import { closeSheet, openSheet, type SheetSpec } from '../../app/sheets';
import { ltToday, prefValue, sectionEntries, sectionRecords, setPref, useToday, withReward } from '../../data/lt';
import { deleteRecord, saveRecord, setArchived } from '../../data/records';
import { deleteSession, saveSession } from '../../data/sessions';
import { data } from '../../data/store';
import { occurrences } from '../../domain/calendar/occurrences';
import { addDays, shortDay, weekStart } from '../../domain/log/dates';
import { formatMinutes } from '../../domain/log/duration';
import { useStore } from '../../lib/createStore';
import { accent, H2, Meter, Picks, Source } from '../../ui/i/bits';
import { ChannelHead } from '../../ui/i/ChannelHead';
import { DayPick, MinutesField } from '../../ui/i/fields';
import { Icon } from '../../ui/i/Icon';
import { RelatedTasks } from '../../ui/i/RelatedTasks';
import { Sheet } from '../../ui/i/Sheet';
import { isStudyDetail, LEVEL_LABEL, markOf, minutesBySubject, pct, STUDY_KINDS, subjectMarks, subjectsOf, topicOf, type HardTopic, type Mark, type StudyDetail } from './model';
import './study.css';
import { StudyArt } from './Art';
import './theme.css';

const subjectsNow = () => subjectsOf(prefValue(data.get(), 'study_subjects'));

function StudySheet({ spec }: { spec: SheetSpec }) {
  const today = ltToday();
  const subjects = subjectsNow();
  const editId = (spec.editId as string | undefined) ?? null;
  const prev = editId ? sectionEntries<StudyDetail>(data.get(), 'study').find((s) => s.entry.id === editId) : undefined;
  const pd = prev && isStudyDetail(prev.detail) ? prev.detail : null;
  const [subject, setSubject] = useState(pd?.subject ?? (spec.subject as string) ?? subjects[0]);
  const [kind, setKind] = useState<string>(pd?.kind ?? 'Homework');
  const [topic, setTopic] = useState(pd?.topic ?? '');
  const [minutes, setMinutes] = useState(prev?.entry.minutes ?? (spec.minutes as number | undefined) ?? 45);
  const [date, setDate] = useState(prev?.entry.date ?? today);
  const [note, setNote] = useState(prev?.entry.note ?? '');
  const [error, setError] = useState<string | null>(null);
  const save = () => {
    let err: string | null = null;
    withReward(() => {
      const r = saveSession({ section: 'study', date, minutes, note, subcategory: subject, detail: { subject, kind, ...(topic.trim() ? { topic: topic.trim().slice(0, 80) } : {}) } }, editId);
      if ('error' in r) err = r.error;
      return !('error' in r);
    });
    if (err) setError(err);
    else closeSheet();
  };
  return (
    <Sheet
      title={prev ? 'Edit study session' : 'CH05 · log study'}
      onClose={closeSheet}
      accent="study"
      footer={
        <>
          {prev && (
            <button type="button" className="i-btn i-btn--danger" onClick={() => (deleteSession(prev.entry.id), closeSheet())}>
              Delete
            </button>
          )}
          <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={save}>
            Save
          </button>
        </>
      }
    >
      <Picks label="Subject" value={subject} onChange={setSubject} options={[...new Set([...subjects, subject])].map((s) => ({ id: s, label: s }))} />
      <Picks label="Kind" value={kind} onChange={setKind} options={STUDY_KINDS.map((k) => ({ id: k, label: k }))} />
      <MinutesField value={minutes} onChange={setMinutes} presets={[20, 30, 45, 60, 90, 120]} />
      <input className="i-input" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic · optional (e.g. SHM, matrices)" aria-label="Topic" maxLength={80} />
      <DayPick value={date} onChange={setDate} today={today} />
      <textarea className="i-textarea" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} placeholder="What clicked, what didn't · optional" aria-label="Notes" />
      {error && <p className="i-error" role="alert">{error}</p>}
    </Sheet>
  );
}

function MarkSheet({ spec }: { spec: SheetSpec }) {
  const today = ltToday();
  const subjects = subjectsNow();
  const rec = spec.editId ? data.get().lt_records.get(spec.editId as string) : undefined;
  const m = rec ? markOf(rec) : null;
  const [subject, setSubject] = useState(m?.subject ?? (spec.subject as string) ?? subjects[0]);
  const [title, setTitle] = useState(m?.title ?? '');
  const [score, setScore] = useState(m ? String(m.score) : '');
  const [outOf, setOutOf] = useState(m ? String(m.outOf) : '');
  const [date, setDate] = useState(m?.date ?? today);
  const s = Number(score.replace(',', '.'));
  const o = Number(outOf.replace(',', '.'));
  const valid = score.trim() !== '' && Number.isFinite(s) && Number.isFinite(o) && o > 0 && s >= 0 && s <= o;
  return (
    <Sheet
      title={m ? 'Edit mark' : 'Add a mark'}
      onClose={closeSheet}
      accent="study"
      footer={
        <>
          {rec && (
            <button type="button" className="i-btn i-btn--danger" onClick={() => (deleteRecord(rec.id, 'Mark deleted'), closeSheet())}>
              Delete
            </button>
          )}
          <button type="button" className="i-btn i-btn--sig i-btn--block" disabled={!valid} onClick={() => (saveRecord('study', 'study_mark', { subject, title: title.trim().slice(0, 80), score: s, outOf: o, date }, rec?.id), closeSheet())}>
            Save mark
          </button>
        </>
      }
    >
      <Picks label="Subject" value={subject} onChange={setSubject} options={subjects.map((x) => ({ id: x, label: x }))} />
      <input className="i-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What it was (e.g. Mechanics test 2)" aria-label="Title" maxLength={80} />
      <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input className="i-input" inputMode="decimal" value={score} onChange={(e) => setScore(e.target.value)} placeholder="Score" aria-label="Score" />
        <span className="i-mono">/</span>
        <input className="i-input" inputMode="decimal" value={outOf} onChange={(e) => setOutOf(e.target.value)} placeholder="Out of" aria-label="Out of" />
        <b className="i-mono" style={{ minWidth: 48, textAlign: 'right' }}>{valid ? `${pct({ score: s, outOf: o })}%` : '—'}</b>
      </span>
      {score && outOf && !valid && <p className="i-error">The score needs to be between 0 and the total.</p>}
      <DayPick value={date} onChange={setDate} today={today} />
    </Sheet>
  );
}

function TopicSheet({ spec }: { spec: SheetSpec }) {
  const subjects = subjectsNow();
  const rec = spec.editId ? data.get().lt_records.get(spec.editId as string) : undefined;
  const t = rec ? topicOf(rec) : null;
  const [subject, setSubject] = useState(t?.subject ?? (spec.subject as string) ?? subjects[0]);
  const [name, setName] = useState(t?.name ?? '');
  const [level, setLevel] = useState<'1' | '2' | '3'>(String(t?.level ?? 2) as '1' | '2' | '3');
  return (
    <Sheet
      title={t ? 'Difficult topic' : 'Add a difficult topic'}
      onClose={closeSheet}
      accent="study"
      footer={
        <>
          {rec && (
            <button type="button" className="i-btn i-btn--danger" onClick={() => (deleteRecord(rec.id, 'Topic deleted'), closeSheet())}>
              Delete
            </button>
          )}
          <button type="button" className="i-btn i-btn--sig i-btn--block" disabled={!name.trim()} onClick={() => (saveRecord('study', 'study_topic', { subject, name: name.trim().slice(0, 80), level: Number(level) }, rec?.id), closeSheet())}>
            Save
          </button>
        </>
      }
    >
      <Picks label="Subject" value={subject} onChange={setSubject} options={subjects.map((x) => ({ id: x, label: x }))} />
      <input className="i-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Topic (e.g. Integration by parts)" aria-label="Topic name" maxLength={80} />
      <Picks label="How it feels" value={level} onChange={setLevel} options={(['1', '2', '3'] as const).map((l) => ({ id: l, label: LEVEL_LABEL[l] }))} />
      {rec && (
        <button type="button" className="i-link" onClick={() => (setArchived(rec.id, !t!.archived), closeSheet())}>
          {t!.archived ? 'Bring back' : 'Got it now: mark as sorted'}
        </button>
      )}
    </Sheet>
  );
}

function SubjectsSheet() {
  const [list, setList] = useState(subjectsNow());
  const [add, setAdd] = useState('');
  return (
    <Sheet
      title="Subjects"
      onClose={closeSheet}
      accent="study"
      footer={
        <button type="button" className="i-btn i-btn--sig i-btn--block" disabled={!list.length} onClick={() => (setPref('study_subjects', list), closeSheet())}>
          Save subjects
        </button>
      }
    >
      <p className="i-note">Removing a subject keeps its sessions and marks; it just leaves the pickers.</p>
      <div className="i-rows">
        {list.map((s, i) => (
          <div key={s} className="i-row">
            <span className="i-row__t">{s}</span>
            <button type="button" className="i-btn i-btn--sm" onClick={() => setList(list.filter((_, j) => j !== i))} aria-label={`Remove ${s}`}>
              ✕
            </button>
          </div>
        ))}
      </div>
      <span style={{ display: 'flex', gap: 6 }}>
        <input className="i-input" value={add} onChange={(e) => setAdd(e.target.value)} placeholder="Add a subject" aria-label="New subject" maxLength={40} />
        <button type="button" className="i-btn i-btn--sm" disabled={!add.trim() || list.includes(add.trim())} onClick={() => (setList([...list, add.trim()]), setAdd(''))}>
          Add
        </button>
      </span>
    </Sheet>
  );
}

registerSheet('study', StudySheet);
registerSheet('study-mark', MarkSheet);
registerSheet('study-topic', TopicSheet);
registerSheet('study-subjects', SubjectsSheet);

export function StudyChannel() {
  const today = useToday();
  const st = useStore(data, (s) => s);
  const subjects = subjectsOf(prefValue(st, 'study_subjects'));
  const sessions = useMemo(() => sectionEntries<StudyDetail>(st, 'study'), [st]);
  const marks = useMemo(() => sectionRecords(st, 'study', 'study_mark').map(markOf).filter((m): m is Mark => !!m).sort((a, b) => b.date.localeCompare(a.date)), [st]);
  const topics = useMemo(() => sectionRecords(st, 'study', 'study_topic').map(topicOf).filter((t): t is HardTopic => !!t && !t.archived).sort((a, b) => a.level - b.level), [st]);
  const exams = useMemo(() => occurrences(st.lt_events.values(), today, addDays(today, 120)).filter((o) => !o.cancelled && o.event.kind === 'exam'), [st.lt_events, today]);
  const monday = weekStart(today);
  const week = minutesBySubject(sessions, monday, today);
  const month = minutesBySubject(sessions, addDays(today, -27), today);
  const weekTotal = [...week.values()].reduce((a, b) => a + b, 0);
  const rows = [...new Set([...subjects, ...month.keys()])];
  const maxMonth = Math.max(1, ...month.values());

  return (
    <div style={accent('study')}>
      <ChannelHead id="study" art={<StudyArt />} />
      <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={() => openSheet({ type: 'study' })}>
        <Icon name="plus" /> Log study
      </button>
      <div className="i-meters" style={{ marginTop: 10 }}>
        <Meter value={formatMinutes(weekTotal)} label="This week" />
        <Meter value={exams[0] ? `${Math.round((Date.parse(exams[0].date) - Date.parse(today)) / 864e5)}d` : '—'} label={exams[0] ? `To ${exams[0].event.title}` : 'No exams set'} />
      </div>

      <H2 aside={<button type="button" className="i-link" onClick={() => openSheet({ type: 'study-subjects' })}>Edit subjects</button>}>Subjects · last 4 weeks</H2>
      <div className="i-pnl i-pnl--flush">
        {rows.map((s) => {
          const mk = subjectMarks(marks, s);
          const min = month.get(s) ?? 0;
          return (
            <button key={s} type="button" className="i-row" onClick={() => openSheet({ type: 'study', subject: s })} aria-label={`${s}: ${formatMinutes(min)} in 4 weeks${mk.avg != null ? `, marks average ${mk.avg}%` : ''}. Log a session`}>
              <span className="i-row__t">
                <b>{s}</b>
                <span className="s-bar" aria-hidden="true">
                  <i style={{ width: `${(min / maxMonth) * 100}%` }} />
                </span>
                <small>
                  {formatMinutes(week.get(s) ?? 0)} this week · {formatMinutes(min)} in 4 weeks
                  {mk.avg != null ? ` · marks ${mk.avg}%${mk.trend ? ` (${mk.trend > 0 ? '+' : ''}${mk.trend} last)` : ''}` : ''}
                </small>
              </span>
              <span className="i-row__n">+</span>
            </button>
          );
        })}
      </div>

      <div className="i-cols">
        <div>
          <H2 aside={<button type="button" className="i-link" onClick={() => openSheet({ type: 'event', preset: { kind: 'exam', section: 'study', title: '' } })}>+ Exam</button>}>Exams</H2>
          <div className="i-pnl i-pnl--flush">
            {exams.length ? (
              exams.slice(0, 6).map((o) => (
                <button key={o.key} type="button" className="i-row" onClick={() => openSheet({ type: 'event', key: o.key })}>
                  <span className="i-row__t">
                    <b>{o.event.title}</b>
                    <small>{shortDay(o.date)}{o.start ? ` · ${o.start}` : ''}</small>
                  </span>
                  <span className="i-row__n">{Math.round((Date.parse(o.date) - Date.parse(today)) / 864e5)}d</span>
                </button>
              ))
            ) : (
              <p className="i-note" style={{ padding: '12px 0' }}>Exams added here also show in the calendar.</p>
            )}
          </div>
        </div>
        <div>
          <H2 aside={<button type="button" className="i-link" onClick={() => openSheet({ type: 'study-topic' })}>+ Topic</button>}>Difficult topics</H2>
          <div className="i-pnl i-pnl--flush">
            {topics.length ? (
              topics.map((t) => (
                <button key={t.id} type="button" className="i-row" onClick={() => openSheet({ type: 'study-topic', editId: t.id })}>
                  <span className="i-row__t">
                    <b>{t.name}</b>
                    <small>{t.subject}</small>
                  </span>
                  <span className={`s-lvl is-${t.level}`}>{LEVEL_LABEL[t.level]}</span>
                </button>
              ))
            ) : (
              <p className="i-note" style={{ padding: '12px 0' }}>Note topics that feel shaky; mark them sorted when they click.</p>
            )}
          </div>
        </div>
      </div>

      <H2 aside={<button type="button" className="i-link" onClick={() => openSheet({ type: 'study-mark' })}>+ Mark</button>}>Marks</H2>
      <div className="i-pnl i-pnl--flush">
        {marks.length ? (
          marks.slice(0, 10).map((m) => (
            <button key={m.id} type="button" className="i-row" onClick={() => openSheet({ type: 'study-mark', editId: m.id })}>
              <span className="i-row__t">
                <b>{m.title || m.subject}</b>
                <small>{m.subject} · {shortDay(m.date)} · {m.score}/{m.outOf}</small>
              </span>
              <span className="i-row__n">{pct(m)}%</span>
            </button>
          ))
        ) : (
          <p className="i-note" style={{ padding: '12px 0' }}>Test and homework marks go here, per subject.</p>
        )}
      </div>

      <H2 aside={`${sessions.length} sessions`}>Recent sessions</H2>
      <div className="i-pnl i-pnl--flush">
        {sessions.length ? (
          sessions.slice(0, 10).map((s) => {
            const d = isStudyDetail(s.detail) ? s.detail : null;
            return (
              <button key={s.entry.id} type="button" className="i-row" onClick={() => openSheet({ type: 'study', editId: s.entry.id })}>
                <span className="i-row__t">
                  <b>{d?.subject ?? 'Study'}{d?.kind ? ` · ${d.kind.toLowerCase()}` : ''}</b> <span className="i-mono i-small i-dim">{shortDay(s.entry.date)}</span>
                  <small>{[d?.topic, s.entry.note].filter(Boolean).join(' · ') || (d ? '' : 'From the Daily Log')}</small>
                </span>
                <span className="i-row__n">{s.entry.minutes}m</span>
              </button>
            );
          })
        ) : (
          <p className="i-note" style={{ padding: '12px 0' }}>Nothing logged yet.</p>
        )}
      </div>
      <RelatedTasks section="study" />
      <Source kind="off">A maths and physics practice app is planned as a separate project; there is no link to it yet.</Source>
    </div>
  );
}
