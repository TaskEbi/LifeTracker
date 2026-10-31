/** Future's sheets: log prep time, and add or edit each kind of record. */
import { useMemo, useState, type ReactNode } from 'react';
import { registerSheet } from '../../app/sheetRegistry';
import { closeSheet, type SheetSpec } from '../../app/sheets';
import { ltToday, prefValue, sectionEntries, withReward } from '../../data/lt';
import { deleteSession, saveSession } from '../../data/sessions';
import { data } from '../../data/store';
import { toast } from '../../data/ui';
import { uuid } from '../../lib/random';
import { bucketItems } from '../bucket/actions';
import {
  A_LEVEL_GRADES,
  activityOf,
  ACTIVITY_LIMITS,
  ageOf,
  careerOf,
  COMMON_PROMPTS,
  contactOf,
  CONTACT_KINDS,
  CONTACT_STATUS_LABEL,
  CONTACT_STATUSES,
  COUNTRIES,
  ESSAY_DEFAULTS,
  ESSAY_KINDS,
  ESSAY_STATUS_LABEL,
  ESSAY_STATUSES,
  essayCount,
  essayOf,
  gradeOf,
  HONOR_LEVELS,
  keepVersions,
  profileOf,
  programOf,
  PROGRAM_STATUS_LABEL,
  PROGRAM_STATUSES,
  scaleOf,
  SCHOOL_YEARS,
  storyOf,
  TEST_SCALES,
  testOf,
  TIERS,
  UCAS_MIN_PART,
  UCAS_QUESTIONS,
  uniOf,
  UNI_STATUS_LABEL,
  UNI_STATUSES,
  type Check,
  type EssayKind,
  type Score,
  type Sitting,
} from '../../domain/future/model';
import { subjectsOf } from '../study/model';
import { Picks } from '../../ui/i/bits';
import { DayPick, MinutesField } from '../../ui/i/fields';
import { Sheet } from '../../ui/i/Sheet';
import { futureRecords, removeFuture, saveFuture, setUpPlan } from './actions';

export const PREP_KINDS = ['SAT', 'TMUA', 'Essays', 'Applications', 'Research', 'Programmes', 'Planning'] as const;

const rec = (spec: SheetSpec) => (spec.editId ? data.get().lt_records.get(spec.editId as string) : undefined);
const opts = <T extends string>(list: readonly T[], label?: Record<T, string>) => list.map((id) => ({ id, label: label?.[id] ?? id }));

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <label className="i-field">
      <span className="i-lab">
        {label}
        {hint && <span className="fu-hint"> · {hint}</span>}
      </span>
      {children}
    </label>
  );
}
function Text({ label, value, onChange, max = 120, placeholder, hint }: { label: string; value: string; onChange: (v: string) => void; max?: number; placeholder?: string; hint?: ReactNode }) {
  return (
    <Field label={label} hint={hint}>
      <input className="i-input" value={value} maxLength={max} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </Field>
  );
}
function DateIn({ label, value, onChange }: { label: string; value: string | null; onChange: (v: string | null) => void }) {
  return (
    <Field label={label}>
      <span className="fu-row">
        <input className="i-input" type="date" value={value ?? ''} onChange={(e) => onChange(e.target.value || null)} />
        {value && (
          <button type="button" className="i-btn i-btn--sm" onClick={() => onChange(null)} aria-label={`Clear ${label.toLowerCase()}`}>
            ✕
          </button>
        )}
      </span>
    </Field>
  );
}
function Counter({ n, max, unit = 'characters' }: { n: number; max: number; unit?: string }) {
  return <span className={`fu-count${n > max ? ' is-over' : ''}`}>{n}/{max} {unit}</span>;
}
function Checklist({ items, onChange, label }: { items: Check[]; onChange: (c: Check[]) => void; label: string }) {
  const [add, setAdd] = useState('');
  return (
    <div className="i-field">
      <span className="i-lab">{label}</span>
      <ul className="fu-checks">
        {items.map((c, i) => (
          <li key={c.id}>
            <label>
              <input type="checkbox" checked={c.done} onChange={() => onChange(items.map((x, j) => (j === i ? { ...x, done: !x.done } : x)))} />
              <span>{c.label}</span>
            </label>
            <button type="button" className="i-btn i-btn--sm" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label={`Remove ${c.label}`}>
              ✕
            </button>
          </li>
        ))}
      </ul>
      <span className="fu-row">
        <input className="i-input" value={add} maxLength={120} onChange={(e) => setAdd(e.target.value)} placeholder="Add a step" aria-label={`Add to ${label.toLowerCase()}`} />
        <button type="button" className="i-btn i-btn--sm" disabled={!add.trim()} onClick={() => (onChange([...items, { id: uuid().slice(0, 8), label: add.trim(), done: false }]), setAdd(''))}>
          Add
        </button>
      </span>
    </div>
  );
}
function Foot({ onDelete, onSave, disabled, saveLabel = 'Save' }: { onDelete?: () => void; onSave: () => void; disabled?: boolean; saveLabel?: string }) {
  return (
    <>
      {onDelete && (
        <button type="button" className="i-btn i-btn--danger" onClick={onDelete}>
          Delete
        </button>
      )}
      <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={onSave} disabled={disabled}>
        {saveLabel}
      </button>
    </>
  );
}
const numOr = (s: string): number | null => (s.trim() === '' || !Number.isFinite(Number(s)) ? null : Number(s));

// ─── log prep time ──────────────────────────────────────────────────────────

function PrepSheet({ spec }: { spec: SheetSpec }) {
  const today = ltToday();
  const editId = (spec.editId as string | undefined) ?? null;
  const prev = editId ? sectionEntries<{ kind?: string; topic?: string }>(data.get(), 'future').find((s) => s.entry.id === editId) : undefined;
  const [kind, setKind] = useState<string>(prev?.detail?.kind ?? (spec.kind as string) ?? 'SAT');
  const [topic, setTopic] = useState(prev?.detail?.topic ?? '');
  const [minutes, setMinutes] = useState(prev?.entry.minutes ?? (spec.minutes as number | undefined) ?? 45);
  const [date, setDate] = useState(prev?.entry.date ?? today);
  const [note, setNote] = useState(prev?.entry.note ?? '');
  const [error, setError] = useState<string | null>(null);
  const save = () => {
    let err: string | null = null;
    withReward(() => {
      const r = saveSession({ section: 'future', date, minutes, note, subcategory: kind, detail: { kind, ...(topic.trim() ? { topic: topic.trim().slice(0, 80) } : {}) } }, editId);
      if ('error' in r) err = r.error;
      return !('error' in r);
    });
    if (err) setError(err);
    else closeSheet();
  };
  return (
    <Sheet
      title={prev ? 'Edit prep session' : 'CH10 · log prep'}
      onClose={closeSheet}
      accent="future"
      footer={<Foot onDelete={prev ? () => (deleteSession(prev.entry.id), closeSheet()) : undefined} onSave={save} />}
    >
      <Picks label="What" value={kind} onChange={setKind} options={[...new Set([...PREP_KINDS, kind])].map((k) => ({ id: k, label: k }))} />
      <MinutesField value={minutes} onChange={setMinutes} presets={[20, 30, 45, 60, 90, 120]} />
      <input className="i-input" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="On what · optional (e.g. SAT practice test 3, Why MIT)" aria-label="On what" maxLength={80} />
      <DayPick value={date} onChange={setDate} today={today} />
      <textarea className="i-textarea" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} placeholder="Notes · optional" aria-label="Notes" />
      {error && (
        <p className="i-error" role="alert">
          {error}
        </p>
      )}
    </Sheet>
  );
}

// ─── a university ───────────────────────────────────────────────────────────

const TEST_NAMES = Object.keys(TEST_SCALES);

function UniSheet({ spec }: { spec: SheetSpec }) {
  const r = rec(spec);
  const u = r ? uniOf(r) : null;
  const [name, setName] = useState(u?.name ?? '');
  const [country, setCountry] = useState(u?.country ?? 'US');
  const [course, setCourse] = useState(u?.course ?? '');
  const [tier, setTier] = useState<string>(u?.tier ?? 'none');
  const [plan, setPlan] = useState(u?.plan ?? '');
  const [deadline, setDeadline] = useState(u?.deadline ?? null);
  const [interview, setInterview] = useState(u?.interview ?? null);
  const [tests, setTests] = useState<string[]>(u?.tests ?? []);
  const [music, setMusic] = useState(u?.music ?? '');
  const [status, setStatus] = useState(u?.status ?? 'researching');
  const [checklist, setChecklist] = useState<Check[]>(u?.checklist ?? []);
  const [checked, setChecked] = useState(u?.checked ?? true);
  const [url, setUrl] = useState(u?.url ?? '');
  const [notes, setNotes] = useState(u?.notes ?? '');
  const save = () => {
    saveFuture('uni', { ...(r?.data ?? {}), name: name.trim(), country, course: course.trim(), tier: tier === 'none' ? null : tier, plan: plan.trim(), deadline, interview, tests, music: music.trim(), status, checklist, checked, url: url.trim(), notes: notes.trim() }, r?.id);
    closeSheet();
  };
  return (
    <Sheet title={u ? u.name : 'Add a university'} onClose={closeSheet} accent="future" footer={<Foot onDelete={r ? () => (removeFuture(r.id, 'University removed'), closeSheet()) : undefined} onSave={save} disabled={!name.trim()} />}>
      <Text label="University" value={name} onChange={setName} max={80} placeholder="e.g. MIT" />
      <Picks label="Country" value={country} onChange={setCountry} options={opts(COUNTRIES)} />
      <Text label="Course" value={course} onChange={setCourse} placeholder="e.g. Computer Science" />
      <div className="i-field">
        <span className="i-lab">Status</span>
        <Picks label="Status" value={status} onChange={setStatus} options={opts(UNI_STATUSES, UNI_STATUS_LABEL)} />
      </div>
      <div className="i-field">
        <span className="i-lab">For you it's a…</span>
        <Picks label="Reach, target or safety" value={tier} onChange={setTier} options={[...opts(TIERS), { id: 'none', label: 'Not sure' }]} />
      </div>
      <Text label="How you apply" value={plan} onChange={setPlan} max={40} placeholder="Early Action, REA, UCAS…" />
      <DateIn label="Deadline" value={deadline} onChange={setDeadline} />
      <DateIn label="Interview" value={interview} onChange={setInterview} />
      <div className="i-field">
        <span className="i-lab">Tests it asks for</span>
        <div className="i-picks" role="group" aria-label="Tests it asks for">
          {TEST_NAMES.map((t) => (
            <button key={t} type="button" className="i-pick" aria-pressed={tests.includes(t)} onClick={() => setTests(tests.includes(t) ? tests.filter((x) => x !== t) : [...tests, t])}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <Text label="Music there" value={music} onChange={setMusic} max={300} placeholder="Joint or dual degree, orchestras, lessons…" />
      <Checklist label="Checklist" items={checklist} onChange={setChecklist} />
      <label className="fu-tick">
        <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
        <span>I’ve checked the dates and requirements on the official site</span>
      </label>
      <Text label="Link" value={url} onChange={setUrl} max={300} placeholder="Admissions page" />
      <Field label="Notes">
        <textarea className="i-textarea" value={notes} maxLength={2000} onChange={(e) => setNotes(e.target.value)} placeholder="Why it, what stands out, people you know there…" />
      </Field>
      <p className="i-note">Deadlines and interviews go into your calendar, with a reminder task two weeks before a deadline until you mark it submitted.</p>
    </Sheet>
  );
}

// ─── a test ─────────────────────────────────────────────────────────────────

function TestSheet({ spec }: { spec: SheetSpec }) {
  const today = ltToday();
  const r = rec(spec);
  const t = r ? testOf(r) : null;
  const [name, setName] = useState(t?.name ?? 'SAT');
  const scale = scaleOf(name);
  const [target, setTarget] = useState(t?.target != null ? String(t.target) : '');
  const [sittings, setSittings] = useState<Sitting[]>(t?.sittings ?? []);
  const [scores, setScores] = useState<Score[]>(t?.scores ?? []);
  const [notes, setNotes] = useState(t?.notes ?? '');
  const [newSitting, setNewSitting] = useState<string | null>(null);
  const [sDate, setSDate] = useState(today);
  const [sScore, setSScore] = useState('');
  const [sOfficial, setSOfficial] = useState(false);
  const [sParts, setSParts] = useState<Record<string, string>>({});
  const scoreN = numOr(sScore);
  const scoreOk = scoreN !== null && scoreN >= scale.min && scoreN <= scale.max;
  const targetN = numOr(target);
  const addScore = () => {
    if (!scoreOk) return;
    const parts: Record<string, number> = {};
    for (const [k, v] of Object.entries(sParts)) if (numOr(v) !== null) parts[k] = numOr(v)!;
    setScores([...scores, { date: sDate, score: scoreN!, official: sOfficial, parts, note: '' }].sort((a, b) => a.date.localeCompare(b.date)));
    setSScore('');
    setSParts({});
  };
  const save = () => {
    saveFuture('test', { ...(r?.data ?? {}), name, target: targetN, sittings, scores, notes: notes.trim() }, r?.id);
    closeSheet();
  };
  return (
    <Sheet title={t ? t.name : 'Add a test'} onClose={closeSheet} accent="future" footer={<Foot onDelete={r ? () => (removeFuture(r.id, 'Test removed'), closeSheet()) : undefined} onSave={save} />}>
      {!t && <Picks label="Test" value={name} onChange={setName} options={TEST_NAMES.map((x) => ({ id: x, label: x }))} />}
      <Text label={`Target (${scale.min}–${scale.max})`} value={target} onChange={setTarget} max={6} placeholder={name === 'SAT' ? '1580' : ''} />
      {targetN !== null && (targetN < scale.min || targetN > scale.max) && <p className="i-error">A {name} score is {scale.min}–{scale.max}.</p>}

      <div className="i-field">
        <span className="i-lab">Sittings</span>
        <ul className="fu-checks">
          {sittings.map((s, i) => (
            <li key={s.date}>
              <label>
                <input type="checkbox" checked={s.registered} onChange={() => setSittings(sittings.map((x, j) => (j === i ? { ...x, registered: !x.registered } : x)))} />
                <span>
                  {s.date} · {s.registered ? 'registered' : 'not registered yet'}
                </span>
              </label>
              <button type="button" className="i-btn i-btn--sm" onClick={() => setSittings(sittings.filter((_, j) => j !== i))} aria-label={`Remove sitting ${s.date}`}>
                ✕
              </button>
            </li>
          ))}
        </ul>
        <span className="fu-row">
          <input className="i-input" type="date" value={newSitting ?? ''} onChange={(e) => setNewSitting(e.target.value || null)} aria-label="New sitting date" />
          <button type="button" className="i-btn i-btn--sm" disabled={!newSitting || sittings.some((s) => s.date === newSitting)} onClick={() => (setSittings([...sittings, { date: newSitting!, registered: false }].sort((a, b) => a.date.localeCompare(b.date))), setNewSitting(null))}>
            Add sitting
          </button>
        </span>
      </div>

      <div className="i-field">
        <span className="i-lab">Scores</span>
        <ul className="fu-scores">
          {[...scores].reverse().map((s, i) => (
            <li key={`${s.date}-${i}`}>
              <b>{s.score}</b>
              <span>
                {s.date} · {s.official ? 'official' : 'practice'}
                {Object.keys(s.parts).length ? ` · ${Object.entries(s.parts).map(([k, v]) => `${k} ${v}`).join(', ')}` : ''}
              </span>
              <button type="button" className="i-btn i-btn--sm" onClick={() => setScores(scores.filter((x) => x !== s))} aria-label={`Remove score ${s.score} from ${s.date}`}>
                ✕
              </button>
            </li>
          ))}
        </ul>
        <div className="fu-addscore">
          <input className="i-input" type="date" value={sDate} max={today} onChange={(e) => e.target.value && setSDate(e.target.value)} aria-label="Score date" />
          <input className="i-input" inputMode="decimal" value={sScore} onChange={(e) => setSScore(e.target.value)} placeholder="Score" aria-label="Score" />
          {scale.parts?.map((p) => (
            <input key={p} className="i-input" inputMode="numeric" value={sParts[p] ?? ''} onChange={(e) => setSParts({ ...sParts, [p]: e.target.value })} placeholder={p} aria-label={p} />
          ))}
          <label className="fu-tick">
            <input type="checkbox" checked={sOfficial} onChange={(e) => setSOfficial(e.target.checked)} />
            <span>Official</span>
          </label>
          <button type="button" className="i-btn i-btn--sm" disabled={!scoreOk} onClick={addScore}>
            Add score
          </button>
        </div>
        {sScore && !scoreOk && <p className="i-error">A {name} score is {scale.min}–{scale.max}.</p>}
      </div>
      <Field label="Notes">
        <textarea className="i-textarea" value={notes} maxLength={2000} onChange={(e) => setNotes(e.target.value)} placeholder="Weak areas, resources, plan…" />
      </Field>
      <p className="i-note">Sittings go into your calendar; one you haven’t registered for gets a reminder six weeks before. Your first official score earns 50 XP.</p>
    </Sheet>
  );
}

// ─── a grade ────────────────────────────────────────────────────────────────

function GradeSheet({ spec }: { spec: SheetSpec }) {
  const r = rec(spec);
  const g = r ? gradeOf(r) : null;
  const [subject, setSubject] = useState(g?.subject ?? '');
  const [target, setTarget] = useState(g?.target || 'A*');
  const [predicted, setPredicted] = useState(g?.predicted || '–');
  const [achieved, setAchieved] = useState(g?.achieved || '–');
  const grades = ['–', ...A_LEVEL_GRADES];
  const val = (v: string) => (v === '–' ? '' : v);
  return (
    <Sheet
      title={g ? g.subject : 'Add a subject'}
      onClose={closeSheet}
      accent="future"
      footer={<Foot onDelete={r ? () => (removeFuture(r.id, 'Subject removed'), closeSheet()) : undefined} onSave={() => (saveFuture('grade', { subject: subject.trim(), target, predicted: val(predicted), achieved: val(achieved) }, r?.id), closeSheet())} disabled={!subject.trim()} />}
    >
      <Text label="Subject" value={subject} onChange={setSubject} max={40} placeholder="e.g. Further Maths" />
      <div className="i-field">
        <span className="i-lab">Target</span>
        <Picks label="Target grade" value={target} onChange={setTarget} options={A_LEVEL_GRADES.map((x) => ({ id: x, label: x }))} />
      </div>
      <div className="i-field">
        <span className="i-lab">Predicted</span>
        <Picks label="Predicted grade" value={predicted} onChange={setPredicted} options={grades.map((x) => ({ id: x, label: x }))} />
      </div>
      <div className="i-field">
        <span className="i-lab">Achieved</span>
        <Picks label="Achieved grade" value={achieved} onChange={setAchieved} options={grades.map((x) => ({ id: x, label: x }))} />
      </div>
    </Sheet>
  );
}

// ─── an activity or honour ──────────────────────────────────────────────────

function ActivitySheet({ spec }: { spec: SheetSpec }) {
  const r = rec(spec);
  const a = r ? activityOf(r) : null;
  const pre = (spec.preset as Record<string, unknown> | undefined) ?? {};
  const [type, setType] = useState<string>(a?.type ?? (pre.type as string) ?? 'activity');
  const [title, setTitle] = useState(a?.title ?? (pre.title as string) ?? '');
  const [org, setOrg] = useState(a?.org ?? (pre.org as string) ?? '');
  const [role, setRole] = useState(a?.role ?? (pre.role as string) ?? '');
  const [desc, setDesc] = useState(a?.desc ?? (pre.desc as string) ?? '');
  const [hours, setHours] = useState(a?.hoursPerWeek != null ? String(a.hoursPerWeek) : pre.hoursPerWeek != null ? String(pre.hoursPerWeek) : '');
  const [weeks, setWeeks] = useState(a?.weeksPerYear != null ? String(a.weeksPerYear) : pre.weeksPerYear != null ? String(pre.weeksPerYear) : '');
  const [years, setYears] = useState<number[]>(a?.years ?? (pre.years as number[]) ?? []);
  const [level, setLevel] = useState(a?.level || (pre.level as string) || 'School');
  const honor = type === 'honor';
  const titleMax = honor ? ACTIVITY_LIMITS.honorTitle : ACTIVITY_LIMITS.title;
  const save = () => {
    saveFuture('activity', { type, title: title.trim(), org: org.trim(), role: role.trim(), desc: desc.trim(), hoursPerWeek: numOr(hours), weeksPerYear: numOr(weeks), years, level: honor ? level : '', source: a?.source ?? (pre.source as string) ?? '' }, r?.id);
    closeSheet();
  };
  return (
    <Sheet title={a ? a.title : honor ? 'Add an honour' : 'Add an activity'} onClose={closeSheet} accent="future" footer={<Foot onDelete={r ? () => (removeFuture(r.id, 'Removed from the list'), closeSheet()) : undefined} onSave={save} disabled={!title.trim()} />}>
      <Picks label="Kind" value={type} onChange={setType} options={[{ id: 'activity', label: 'Activity' }, { id: 'honor', label: 'Honour / award' }]} />
      <Text label={honor ? 'Honour' : 'Activity'} value={title} onChange={setTitle} max={200} hint={<Counter n={title.length} max={titleMax} />} />
      {!honor && <Text label="Role" value={role} onChange={setRole} max={60} placeholder="Leader, member, founder…" />}
      {!honor && <Text label="Organisation" value={org} onChange={setOrg} max={200} hint={<Counter n={org.length} max={ACTIVITY_LIMITS.org} />} />}
      {!honor && (
        <Field label="Description" hint={<Counter n={desc.length} max={ACTIVITY_LIMITS.desc} />}>
          <textarea className="i-textarea" value={desc} maxLength={400} onChange={(e) => setDesc(e.target.value)} placeholder="What you did and what came of it, with numbers" />
        </Field>
      )}
      {honor && (
        <div className="i-field">
          <span className="i-lab">Level</span>
          <Picks label="Level" value={level} onChange={setLevel} options={opts(HONOR_LEVELS)} />
        </div>
      )}
      {!honor && (
        <span className="fu-row">
          <Text label="Hours / week" value={hours} onChange={setHours} max={4} />
          <Text label="Weeks / year" value={weeks} onChange={setWeeks} max={2} />
        </span>
      )}
      <div className="i-field">
        <span className="i-lab">School years</span>
        <div className="i-picks" role="group" aria-label="School years">
          {SCHOOL_YEARS.map((y) => (
            <button key={y} type="button" className="i-pick" aria-pressed={years.includes(y)} onClick={() => setYears(years.includes(y) ? years.filter((x) => x !== y) : [...years, y].sort())}>
              Year {y}
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  );
}

// ─── an essay ───────────────────────────────────────────────────────────────

function EssaySheet({ spec }: { spec: SheetSpec }) {
  const r = rec(spec);
  const e0 = r ? essayOf(r) : null;
  const [kind, setKind] = useState<EssayKind>(e0?.kind ?? (spec.kind as EssayKind) ?? 'common');
  const def = ESSAY_DEFAULTS[kind];
  const [title, setTitle] = useState(e0?.title ?? '');
  const [uniId, setUniId] = useState<string>(e0?.uniId ?? (spec.uniId as string) ?? '');
  const [prompt, setPrompt] = useState(e0?.prompt ?? '');
  const [limitN, setLimitN] = useState(String(e0?.limit.n ?? def.limit.n));
  const [status, setStatus] = useState(e0?.status ?? 'idea');
  const [deadline, setDeadline] = useState(e0?.deadline ?? null);
  const [parts, setParts] = useState<string[]>(e0?.parts ?? (kind === 'ucas' ? ['', '', ''] : ['']));
  const [versions, setVersions] = useState(e0?.versions ?? []);
  const [stories, setStories] = useState<string[]>(e0?.stories ?? []);
  const unis = useMemo(() => futureRecords('uni').map(uniOf).filter((u) => !!u), []);
  const bank = useMemo(() => futureRecords('story').map(storyOf).filter((s) => !!s), []);
  const limit = { unit: def.limit.unit, n: Math.max(1, numOr(limitN) ?? def.limit.n) };
  const shownParts = kind === 'ucas' ? [0, 1, 2].map((i) => parts[i] ?? '') : [parts[0] ?? ''];
  const count = essayCount({ parts: shownParts, limit, kind });
  const changeKind = (k: EssayKind) => {
    setKind(k);
    setLimitN(String(ESSAY_DEFAULTS[k].limit.n));
    if (k === 'ucas' && parts.length < 3) setParts([parts[0] ?? '', '', '']);
  };
  const value = (): Record<string, unknown> => ({ kind, title: title.trim() || def.title, uniId: kind === 'supplement' ? uniId || null : null, prompt: prompt.trim(), limit, parts: shownParts, status, deadline, versions, stories });
  const snapshot = () => {
    const text = shownParts.join('\n\n— — —\n\n');
    if (!text.trim()) return;
    setVersions(keepVersions([{ at: new Date().toISOString(), text }, ...versions]));
    toast('Version kept');
  };
  const save = () => {
    saveFuture('essay', { ...(r?.data ?? {}), ...value() }, r?.id);
    closeSheet();
  };
  const unitLabel = limit.unit === 'words' ? 'words' : 'characters';
  return (
    <Sheet title={e0 ? e0.title : 'New essay'} onClose={closeSheet} accent="future" footer={<Foot onDelete={r ? () => (removeFuture(r.id, 'Essay deleted'), closeSheet()) : undefined} onSave={save} />}>
      {!e0 && <Picks label="Kind" value={kind} onChange={changeKind} options={ESSAY_KINDS.map((k) => ({ id: k, label: { common: 'Common App', ucas: 'UCAS', supplement: 'Supplement', other: 'Other' }[k] }))} />}
      <Text label="Title" value={title} onChange={setTitle} placeholder={def.title} />
      {kind === 'supplement' && (
        <div className="i-field">
          <span className="i-lab">For</span>
          <Picks label="University" value={uniId} onChange={setUniId} options={[{ id: '', label: 'None' }, ...unis.map((u) => ({ id: u!.id, label: u!.name }))]} />
        </div>
      )}
      {kind === 'common' ? (
        <div className="i-field">
          <span className="i-lab">Prompt (short version; full wording on the Common App site)</span>
          <Picks label="Prompt" value={prompt} onChange={setPrompt} options={COMMON_PROMPTS.map((p, i) => ({ id: p, label: `${i + 1}. ${p}` }))} />
        </div>
      ) : kind !== 'ucas' ? (
        <Field label="Prompt">
          <textarea className="i-textarea" value={prompt} maxLength={1000} onChange={(e) => setPrompt(e.target.value)} placeholder="Paste the question" />
        </Field>
      ) : null}
      <span className="fu-row">
        <Text label={`Limit (${unitLabel})`} value={limitN} onChange={setLimitN} max={5} />
        <DateIn label="Due" value={deadline} onChange={setDeadline} />
      </span>
      <div className="i-field">
        <span className="i-lab">Status</span>
        <Picks label="Status" value={status} onChange={setStatus} options={opts(ESSAY_STATUSES, ESSAY_STATUS_LABEL)} />
      </div>
      {shownParts.map((p, i) => (
        <Field key={i} label={kind === 'ucas' ? `${i + 1}. ${UCAS_QUESTIONS[i]}` : 'Draft'} hint={kind === 'ucas' ? <Counter n={p.length} max={4000} unit={`chars (min ${UCAS_MIN_PART})`} /> : undefined}>
          <textarea className="i-textarea fu-essay" value={p} maxLength={6000} onChange={(e) => setParts(shownParts.map((x, j) => (j === i ? e.target.value : x)))} placeholder={kind === 'ucas' ? 'At least 350 characters' : 'Write here. It saves when you press Save.'} />
        </Field>
      ))}
      <p className={`fu-total${count.over ? ' is-over' : ''}`} aria-live="polite">
        {count.used} / {limit.n} {unitLabel}
        {count.over ? ` · ${-count.left} over` : ` · ${count.left} left`}
        {count.shortParts.length ? ` · question ${count.shortParts.map((i) => i + 1).join(' and ')} under ${UCAS_MIN_PART} characters` : ''}
      </p>
      {bank.length > 0 && (
        <div className="i-field">
          <span className="i-lab">Stories it uses</span>
          <div className="i-picks" role="group" aria-label="Stories it uses">
            {bank.map((s) => (
              <button key={s!.id} type="button" className="i-pick" aria-pressed={stories.includes(s!.id)} onClick={() => setStories(stories.includes(s!.id) ? stories.filter((x) => x !== s!.id) : [...stories, s!.id])}>
                {s!.title}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="i-field">
        <span className="i-lab">Versions · newest {versions.length ? `of ${versions.length}` : ''}</span>
        <button type="button" className="i-btn i-btn--sm" onClick={snapshot}>
          Keep this version
        </button>
        {versions.map((v) => (
          <span key={v.at} className="fu-version">
            <span>{new Date(v.at).toLocaleString()}</span>
            <button type="button" className="i-link" onClick={() => setParts(kind === 'ucas' ? [...v.text.split('\n\n— — —\n\n'), '', ''].slice(0, 3) : [v.text])}>
              Bring back
            </button>
          </span>
        ))}
      </div>
      <p className="i-note">Marking it Final earns 40 XP. Essays stay in your LifeTracker database; keep a copy of anything you submit.</p>
    </Sheet>
  );
}

// ─── a story for the story bank ─────────────────────────────────────────────

function StorySheet({ spec }: { spec: SheetSpec }) {
  const r = rec(spec);
  const s = r ? storyOf(r) : null;
  const [title, setTitle] = useState(s?.title ?? '');
  const [text, setText] = useState(s?.text ?? '');
  const [tags, setTags] = useState((s?.tags ?? []).join(', '));
  return (
    <Sheet
      title={s ? 'Story' : 'Add a story'}
      onClose={closeSheet}
      accent="future"
      footer={<Foot onDelete={r ? () => (removeFuture(r.id, 'Story deleted'), closeSheet()) : undefined} onSave={() => (saveFuture('story', { title: title.trim(), text: text.trim(), tags: tags.split(',').map((t) => t.trim()).filter(Boolean) }, r?.id), closeSheet())} disabled={!title.trim()} />}
    >
      <Text label="The moment" value={title} onChange={setTitle} placeholder="e.g. The night before the ARSM exam" />
      <Field label="What happened, what it meant">
        <textarea className="i-textarea fu-essay" value={text} maxLength={3000} onChange={(e) => setText(e.target.value)} placeholder="Details you'd forget: what you saw, said, felt; what changed after" />
      </Field>
      <Text label="Tags" value={tags} onChange={setTags} placeholder="violin, failure, curiosity" />
    </Sheet>
  );
}

// ─── a programme or competition ─────────────────────────────────────────────

function ProgramSheet({ spec }: { spec: SheetSpec }) {
  const r = rec(spec);
  const p = r ? programOf(r) : null;
  const pre = (spec.preset as { name?: string; kind?: 'program' | 'competition'; note?: string } | undefined) ?? {};
  const [name, setName] = useState(p?.name ?? pre.name ?? '');
  const [kind, setKind] = useState<string>(p?.kind ?? pre.kind ?? 'program');
  const [deadline, setDeadline] = useState(p?.deadline ?? null);
  const [start, setStart] = useState(p?.start ?? null);
  const [end, setEnd] = useState(p?.end ?? null);
  const [status, setStatus] = useState(p?.status ?? 'considering');
  const [result, setResult] = useState(p?.result ?? '');
  const [url, setUrl] = useState(p?.url ?? '');
  const [notes, setNotes] = useState(p?.notes ?? pre.note ?? '');
  return (
    <Sheet
      title={p ? p.name : kind === 'competition' ? 'Add a competition' : 'Add a programme'}
      onClose={closeSheet}
      accent="future"
      footer={
        <Foot
          onDelete={r ? () => (removeFuture(r.id, 'Removed'), closeSheet()) : undefined}
          onSave={() => (saveFuture('program', { ...(r?.data ?? {}), name: name.trim(), kind, deadline, start, end, status, result: result.trim(), url: url.trim(), notes: notes.trim(), checked: true }, r?.id), closeSheet())}
          disabled={!name.trim()}
        />
      }
    >
      <Text label="Name" value={name} onChange={setName} max={100} />
      <Picks label="Kind" value={kind} onChange={setKind} options={[{ id: 'program', label: 'Programme' }, { id: 'competition', label: 'Competition' }]} />
      <div className="i-field">
        <span className="i-lab">Status</span>
        <Picks label="Status" value={status} onChange={setStatus} options={opts(PROGRAM_STATUSES, PROGRAM_STATUS_LABEL)} />
      </div>
      <DateIn label={kind === 'competition' ? 'Entry deadline' : 'Application deadline'} value={deadline} onChange={setDeadline} />
      <span className="fu-row">
        <DateIn label="Starts" value={start} onChange={setStart} />
        <DateIn label="Ends" value={end} onChange={setEnd} />
      </span>
      <Text label="Result" value={result} onChange={setResult} placeholder="Medal, placing, what you made" />
      <Text label="Link" value={url} onChange={setUrl} max={300} />
      <Field label="Notes">
        <textarea className="i-textarea" value={notes} maxLength={2000} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <p className="i-note">Dates you enter go into the calendar. Check them on the official site: they change every year.</p>
    </Sheet>
  );
}

// ─── a career path ──────────────────────────────────────────────────────────

function CareerSheet({ spec }: { spec: SheetSpec }) {
  const r = rec(spec);
  const c = r ? careerOf(r) : null;
  const pre = (spec.preset as { name?: string; needs?: string } | undefined) ?? {};
  const [name, setName] = useState(c?.name ?? pre.name ?? '');
  const [pull, setPull] = useState(String(c?.pull ?? 3));
  const [why, setWhy] = useState(c?.why ?? '');
  const [needs, setNeeds] = useState(c?.needs ?? pre.needs ?? '');
  const [steps, setSteps] = useState<Check[]>(c?.steps ?? []);
  return (
    <Sheet
      title={c ? c.name : 'Add a career path'}
      onClose={closeSheet}
      accent="future"
      footer={<Foot onDelete={r ? () => (removeFuture(r.id, 'Path removed'), closeSheet()) : undefined} onSave={() => (saveFuture('career', { name: name.trim(), pull: Number(pull), why: why.trim(), needs: needs.trim(), steps }, r?.id), closeSheet())} disabled={!name.trim()} />}
    >
      <Text label="Path" value={name} onChange={setName} max={80} />
      <div className="i-field">
        <span className="i-lab">How much it pulls right now</span>
        <Picks label="Pull" value={pull} onChange={setPull} options={['1', '2', '3', '4', '5'].map((x) => ({ id: x, label: '●'.repeat(Number(x)) }))} />
      </div>
      <Field label="Why it">
        <textarea className="i-textarea" value={why} maxLength={1000} onChange={(e) => setWhy(e.target.value)} />
      </Field>
      <Field label="What it takes">
        <textarea className="i-textarea" value={needs} maxLength={1000} onChange={(e) => setNeeds(e.target.value)} />
      </Field>
      <Checklist label="Steps toward it" items={steps} onChange={setSteps} />
    </Sheet>
  );
}

// ─── an age on the life timeline ────────────────────────────────────────────

function AgeSheet({ spec }: { spec: SheetSpec }) {
  const r = rec(spec);
  const a = r ? ageOf(r) : null;
  const [age, setAge] = useState(String(a?.age ?? (spec.age as number | undefined) ?? ''));
  const [text, setText] = useState(a?.text ?? '');
  const [bucket, setBucket] = useState<string[]>(a?.bucket ?? []);
  const open = useMemo(() => bucketItems(data.get()).open, []);
  const n = numOr(age);
  const ok = n !== null && n >= 10 && n <= 100;
  return (
    <Sheet title={a ? `At ${a.age}` : 'An age on the timeline'} onClose={closeSheet} accent="future" footer={<Foot onDelete={r ? () => (removeFuture(r.id, 'Removed from the timeline'), closeSheet()) : undefined} onSave={() => (saveFuture('age', { age: n, text: text.trim(), bucket }, r?.id), closeSheet())} disabled={!ok} />}>
      <Text label="Age" value={age} onChange={setAge} max={3} />
      <Field label="Where you want to be">
        <textarea className="i-textarea" value={text} maxLength={2000} onChange={(e) => setText(e.target.value)} placeholder="Studying where, doing what, living how…" />
      </Field>
      {open.length > 0 && (
        <div className="i-field">
          <span className="i-lab">Bucket-list things done by then</span>
          <div className="i-picks fu-bucketpicks" role="group" aria-label="Bucket-list things done by then">
            {open.map((b) => (
              <button key={b.id} type="button" className="i-pick" aria-pressed={bucket.includes(b.id)} onClick={() => setBucket(bucket.includes(b.id) ? bucket.filter((x) => x !== b.id) : [...bucket, b.id])}>
                {b.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </Sheet>
  );
}

// ─── a person to contact ────────────────────────────────────────────────────

function ContactSheet({ spec }: { spec: SheetSpec }) {
  const r = rec(spec);
  const c = r ? contactOf(r) : null;
  const [name, setName] = useState(c?.name ?? '');
  const [org, setOrg] = useState(c?.org ?? '');
  const [kind, setKind] = useState<string>(c?.kind ?? 'professor');
  const [status, setStatus] = useState(c?.status ?? 'idea');
  const [next, setNext] = useState(c?.next ?? null);
  const [notes, setNotes] = useState(c?.notes ?? '');
  return (
    <Sheet
      title={c ? c.name : 'Add a person or place'}
      onClose={closeSheet}
      accent="future"
      footer={<Foot onDelete={r ? () => (removeFuture(r.id, 'Removed'), closeSheet()) : undefined} onSave={() => (saveFuture('contact', { name: name.trim(), org: org.trim(), kind, status, next, notes: notes.trim() }, r?.id), closeSheet())} disabled={!name.trim()} />}
    >
      <Text label="Who or what" value={name} onChange={setName} max={100} placeholder="Prof. Name, a lab, a company" />
      <Text label="Where" value={org} onChange={setOrg} placeholder="University, department, company" />
      <Picks label="Kind" value={kind} onChange={setKind} options={CONTACT_KINDS.map((k) => ({ id: k, label: k[0].toUpperCase() + k.slice(1) }))} />
      <div className="i-field">
        <span className="i-lab">Status</span>
        <Picks label="Status" value={status} onChange={setStatus} options={opts(CONTACT_STATUSES, CONTACT_STATUS_LABEL)} />
      </div>
      <DateIn label="Next follow-up" value={next} onChange={setNext} />
      <Field label="Notes">
        <textarea className="i-textarea" value={notes} maxLength={2000} onChange={(e) => setNotes(e.target.value)} placeholder="Their work, what you asked, what they said" />
      </Field>
      <p className="i-note">A follow-up date adds a task for that day. A first reply earns 20 XP.</p>
    </Sheet>
  );
}

// ─── setting up ─────────────────────────────────────────────────────────────

function SetupSheet() {
  const profile = profileOf(prefValue(data.get(), 'future_profile'));
  const [entry, setEntry] = useState(String(profile.entryYear));
  const [unis, setUnis] = useState(true);
  const subjects = subjectsOf(prefValue(data.get(), 'study_subjects'));
  return (
    <Sheet title="Set up Future" onClose={closeSheet} accent="future" footer={<Foot onSave={() => (setUpPlan({ entry: Number(entry), unis, subjects }), closeSheet())} saveLabel="Set it up" />}>
      <div className="i-field">
        <span className="i-lab">Starting university in</span>
        <Picks label="Entry year" value={entry} onChange={setEntry} options={['2027', '2028', '2029', '2030'].map((y) => ({ id: y, label: y }))} />
      </div>
      <p className="i-note">Adds your A-level subjects ({subjects.join(', ')}) with A* targets, the SAT with a 1580 target, and the TMUA.</p>
      <label className="fu-tick">
        <input type="checkbox" checked={unis} onChange={(e) => setUnis(e.target.checked)} />
        <span>Also add Oxford, Cambridge, Imperial, UCL, Edinburgh, MIT, Stanford, Carnegie Mellon, Caltech, Tufts, Yale, Harvard and UC Berkeley, with their usual deadlines (marked “to check” until you confirm each one)</span>
      </label>
    </Sheet>
  );
}

registerSheet('future', PrepSheet);
registerSheet('future-uni', UniSheet);
registerSheet('future-test', TestSheet);
registerSheet('future-grade', GradeSheet);
registerSheet('future-activity', ActivitySheet);
registerSheet('future-essay', EssaySheet);
registerSheet('future-story', StorySheet);
registerSheet('future-program', ProgramSheet);
registerSheet('future-career', CareerSheet);
registerSheet('future-age', AgeSheet);
registerSheet('future-contact', ContactSheet);
registerSheet('future-setup', SetupSheet);
