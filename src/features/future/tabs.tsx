/** Future's tabs: universities (tickets), tests, profile, essays and the roadmap. */
import { useMemo, useState, type CSSProperties } from 'react';
import { openSheet } from '../../app/sheets';
import { sectionEntries, sectionRecords, setPref } from '../../data/lt';
import { data } from '../../data/store';
import type { LtRecord } from '../../data/types';
import { toast } from '../../data/ui';
import { suggestActivities, type ActivityDraft, type LoggedSession } from '../../domain/future/activities';
import {
  activityOf,
  ACTIVITY_LIMITS,
  ageOf,
  careerOf,
  contactOf,
  CONTACT_STATUS_LABEL,
  CONTACT_STATUSES,
  ESSAY_STATUS_LABEL,
  ESSAY_STATUSES,
  essayCount,
  essayOf,
  gradeOf,
  programOf,
  PROGRAM_STATUS_LABEL,
  scaleOf,
  storyOf,
  testOf,
  testSummary,
  uniOf,
  UNI_STATUS_LABEL,
  type Uni,
} from '../../domain/future/model';
import { roadmap } from '../../domain/future/plan';
import { CAREER_PRESETS, PROGRAM_PRESETS, TIMELINE_AGES, UNI_PRESETS } from '../../domain/future/presets';
import { shortDay } from '../../domain/log/dates';
import { useStore } from '../../lib/createStore';
import { H2 } from '../../ui/i/bits';
import { bucketItems } from '../bucket/actions';
import { markOf, subjectMarks, type Mark } from '../study/model';
import { addUniPresets } from './actions';

type Props = { records: LtRecord[]; today: string };
const of = <T,>(records: LtRecord[], read: (r: LtRecord) => T | null) => records.map(read).filter((x): x is T => x !== null);
const shortDate = (d: string, today: string) => shortDay(d, today.slice(0, 4));

// ─── universities ───────────────────────────────────────────────────────────

const STAMP: Partial<Record<Uni['status'], string>> = { submitted: 'SENT', interview: 'INTERVIEW', offer: 'OFFER', accepted: 'ACCEPTED', waitlist: 'WAITLIST', rejected: 'NOT THIS TIME', declined: 'DECLINED' };

export function UnisTab({ records, entry, today }: Props & { entry: number }) {
  const unis = useMemo(() => of(records, uniOf).sort((a, b) => (a.deadline ?? '9999').localeCompare(b.deadline ?? '9999') || a.name.localeCompare(b.name)), [records]);
  const [filter, setFilter] = useState<'all' | 'US' | 'UK'>('all');
  const [compare, setCompare] = useState(false);
  const shown = unis.filter((u) => filter === 'all' || u.country === filter);
  const have = new Set(unis.map((u) => u.name.toLowerCase()));
  const missing = UNI_PRESETS.filter((p) => !have.has(p.name.toLowerCase()));
  const unchecked = unis.filter((u) => !u.checked).length;

  return (
    <>
      <div className="fu-bar">
        <div className="i-chips" role="group" aria-label="Show">
          {(['all', 'US', 'UK'] as const).map((f) => (
            <button key={f} type="button" className="i-chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {f === 'all' ? `All · ${unis.length}` : `${f} · ${unis.filter((u) => u.country === f).length}`}
            </button>
          ))}
        </div>
        <button type="button" className="i-link" onClick={() => setCompare(!compare)}>
          {compare ? 'Tickets' : 'Compare'}
        </button>
      </div>
      {unchecked > 0 && <p className="fu-warn">{unchecked} with usual dates still to check on the official sites (marked “to check”).</p>}

      {compare ? (
        <div className="fu-compare" role="region" aria-label="Compare universities" tabIndex={0}>
          <table>
            <thead>
              <tr>
                <th scope="col">University</th>
                <th scope="col">Tier</th>
                <th scope="col">Plan</th>
                <th scope="col">Deadline</th>
                <th scope="col">Tests</th>
                <th scope="col">Music</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((u) => (
                <tr key={u.id}>
                  <th scope="row">
                    <button type="button" className="i-link" onClick={() => openSheet({ type: 'future-uni', editId: u.id })}>
                      {u.name}
                    </button>
                  </th>
                  <td>{u.tier ?? '—'}</td>
                  <td>{u.plan || '—'}</td>
                  <td>{u.deadline ? shortDate(u.deadline, today) : '—'}{!u.checked && u.deadline ? ' *' : ''}</td>
                  <td>{u.tests.join(', ') || '—'}</td>
                  <td>{u.music || '—'}</td>
                  <td>{UNI_STATUS_LABEL[u.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {unchecked > 0 && <p className="i-note">* usual date, to check</p>}
        </div>
      ) : (
        <ul className="fu-tickets" aria-label="Universities">
          {shown.map((u, i) => {
            const done = u.checklist.filter((c) => c.done).length;
            return (
              <li key={u.id} style={{ '--i': i } as CSSProperties}>
                <button type="button" className={`fu-ticket is-${u.status}`} onClick={() => openSheet({ type: 'future-uni', editId: u.id })}>
                  <span className="fu-ticket__stub" aria-hidden="true">
                    <b>{u.country}</b>
                    <small>{u.tier ?? '·'}</small>
                  </span>
                  <span className="fu-ticket__main">
                    <span className="fu-ticket__from">{u.course || 'Course to choose'}</span>
                    <b className="fu-ticket__to">{u.name}</b>
                    <span className="fu-ticket__meta">
                      {u.plan || 'Plan to choose'}
                      {u.deadline && ` · ${shortDate(u.deadline, today)}`}
                      {!u.checked && <em> · to check</em>}
                    </span>
                    {u.tests.length > 0 && <span className="fu-ticket__tests">{u.tests.map((t) => <i key={t}>{t}</i>)}</span>}
                    {u.music && <span className="fu-ticket__music">♪ {u.music}</span>}
                    {u.checklist.length > 0 && (
                      <span className="fu-ticket__prog" style={{ '--p': `${(done / u.checklist.length) * 100}%` } as CSSProperties}>
                        <i />
                        <small>
                          {done}/{u.checklist.length}
                        </small>
                      </span>
                    )}
                  </span>
                  {STAMP[u.status] && <span className="fu-stamp">{STAMP[u.status]}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {!unis.length && <p className="i-note">No universities yet. Add yours below, or from your list.</p>}
      <button type="button" className="i-btn i-btn--block" onClick={() => openSheet({ type: 'future-uni' })} style={{ marginTop: 12 }}>
        + Add a university
      </button>
      {missing.length > 0 && (
        <>
          <H2>From your list</H2>
          <div className="i-picks">
            {missing.map((p) => (
              <button key={p.name} type="button" className="i-pick" onClick={() => toast(addUniPresets([p], entry) ? `${p.name} added · check its dates` : 'Already there')}>
                + {p.name}
              </button>
            ))}
          </div>
          <p className="i-note">These come with their usual plan, deadline and tests for starting in {entry}, marked “to check” until you confirm them on the official site.</p>
        </>
      )}
    </>
  );
}

// ─── tests ──────────────────────────────────────────────────────────────────

function Spark({ scores, min, max, target }: { scores: { score: number; official: boolean }[]; min: number; max: number; target: number | null }) {
  if (scores.length < 2) return null;
  const w = 200;
  const h = 48;
  const lo = Math.min(min + (max - min) * 0.5, ...scores.map((s) => s.score), target ?? max);
  const y = (v: number) => h - 4 - ((v - lo) / Math.max(1e-6, max - lo)) * (h - 8);
  const x = (i: number) => 4 + (i / (scores.length - 1)) * (w - 8);
  return (
    <svg className="fu-spark" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      {target !== null && <line x1="0" x2={w} y1={y(target)} y2={y(target)} className="fu-spark__target" />}
      <polyline points={scores.map((s, i) => `${x(i)},${y(s.score)}`).join(' ')} className="fu-spark__line" />
      {scores.map((s, i) => (
        <circle key={i} cx={x(i)} cy={y(s.score)} r={s.official ? 3.5 : 2.4} className={s.official ? 'is-official' : ''} />
      ))}
    </svg>
  );
}

export function TestsTab({ records, today }: Props) {
  const tests = of(records, testOf);
  const unis = of(records, uniOf);
  const asked = [...new Set(unis.flatMap((u) => u.tests))];
  return (
    <>
      {asked.length > 0 && (
        <p className="fu-asked">
          Your shortlist asks for: {asked.map((t) => `${t} (${unis.filter((u) => u.tests.includes(t)).map((u) => u.name).join(', ')})`).join(' · ')}
        </p>
      )}
      <div className="fu-tests">
        {tests.map((t) => {
          const s = testSummary(t);
          const sc = scaleOf(t.name);
          const best = s.official?.score ?? s.practice?.score ?? null;
          const pct = best !== null ? (best - sc.min) / (sc.max - sc.min) : 0;
          const next = t.sittings.find((x) => x.date >= today);
          return (
            <button key={t.id} type="button" className="fu-test" onClick={() => openSheet({ type: 'future-test', editId: t.id })}>
              <span className="fu-test__name">{t.name}</span>
              <span className="fu-test__best">
                <b>{best ?? '—'}</b>
                {t.target !== null && <small>target {t.target}</small>}
              </span>
              <span className="fu-test__bar" style={{ '--p': `${pct * 100}%`, '--t': t.target !== null ? `${((t.target - sc.min) / (sc.max - sc.min)) * 100}%` : '-10%' } as CSSProperties}>
                <i />
                <em />
              </span>
              <Spark scores={t.scores} min={sc.min} max={sc.max} target={t.target} />
              <small className="fu-test__meta">
                {s.official ? `Official ${s.official.score}` : 'No official score yet'}
                {s.practice ? ` · best practice ${s.practice.score}` : ''}
                {` · ${t.scores.length} score${t.scores.length === 1 ? '' : 's'}`}
                {next ? ` · next sitting ${shortDate(next.date, today)}${next.registered ? '' : ' (not registered)'}` : ' · no sitting booked'}
              </small>
            </button>
          );
        })}
      </div>
      <button type="button" className="i-btn i-btn--block" onClick={() => openSheet({ type: 'future-test' })} style={{ marginTop: 12 }}>
        + Add a test
      </button>
      <p className="i-note">Log practice time with Log prep (SAT, TMUA…); add each practice-test score here to see the line climb toward the target.</p>
    </>
  );
}

// ─── profile: grades and the activity list ──────────────────────────────────

export function ProfileTab({ records, entry, today }: Props & { entry: number }) {
  const st = useStore(data, (s) => s);
  const grades = of(records, gradeOf);
  const acts = of(records, activityOf).sort((a, b) => a.order - b.order);
  const activities = acts.filter((a) => a.type === 'activity');
  const honors = acts.filter((a) => a.type === 'honor');
  const marks = useMemo(() => sectionRecords(st, 'study', 'study_mark').map(markOf).filter((m): m is Mark => !!m), [st]);
  const suggestions = useMemo(() => {
    const sessions: LoggedSession[] = [];
    for (const s of ['violin', 'coding', 'sports', 'gym', 'chess'] as const)
      for (const e of sectionEntries<{ sport?: string }>(st, s)) sessions.push({ section: s, date: e.entry.date, minutes: e.entry.minutes, sport: e.detail?.sport });
    const events = [...st.lt_events.values()].filter((e) => !e.deleted_at && !e.repeat).map((e) => ({ title: e.title, date: e.date, section: e.section, kind: e.kind }));
    return suggestActivities(sessions, events, today, entry, acts);
  }, [st, today, entry, acts]);

  const copy = async () => {
    const text = [
      ...activities.map((a, i) => `${i + 1}. ${a.title}${a.role ? ` (${a.role})` : ''}${a.org ? `, ${a.org}` : ''}\n   ${a.desc}\n   ${a.hoursPerWeek ?? '?'} h/week, ${a.weeksPerYear ?? '?'} weeks/year · Years ${a.years.join(', ') || '?'}`),
      ...honors.map((h, i) => `Honour ${i + 1}. ${h.title} · ${h.level || 'level?'} · Years ${h.years.join(', ') || '?'}`),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      toast('Copied the list');
    } catch {
      toast('Couldn’t copy here; select the list by hand');
    }
  };
  const add = (d: ActivityDraft) => openSheet({ type: 'future-activity', preset: d });

  return (
    <>
      <H2 aside={<button type="button" className="i-link" onClick={() => openSheet({ type: 'future-grade' })}>+ Subject</button>}>A-level grades</H2>
      <div className="fu-grades" role="table" aria-label="A-level grades">
        <div role="row" className="fu-grades__head">
          <span role="columnheader">Subject</span>
          <span role="columnheader">Target</span>
          <span role="columnheader">Pred.</span>
          <span role="columnheader">Final</span>
          <span role="columnheader">Marks</span>
        </div>
        {grades.map((g) => {
          const m = subjectMarks(marks, g.subject);
          return (
            <button key={g.id} type="button" role="row" className="fu-grades__row" onClick={() => openSheet({ type: 'future-grade', editId: g.id })}>
              <span role="cell">{g.subject}</span>
              <span role="cell" className="fu-grade">{g.target || '—'}</span>
              <span role="cell" className="fu-grade">{g.predicted || '—'}</span>
              <span role="cell" className="fu-grade">{g.achieved || '—'}</span>
              <span role="cell" className="i-mono">{m.avg != null ? `${m.avg}%` : '—'}</span>
            </button>
          );
        })}
        {!grades.length && <p className="i-note">Add your subjects to track targets and predicted grades. Marks come from Study.</p>}
      </div>

      <H2 aside={<span className="i-h2__aside">{activities.length}/{ACTIVITY_LIMITS.activities} · honours {honors.length}/{ACTIVITY_LIMITS.honors}</span>}>Activities & honours</H2>
      <ol className="fu-acts">
        {acts.map((a) => (
          <li key={a.id}>
            <button type="button" className="fu-act" onClick={() => openSheet({ type: 'future-activity', editId: a.id })}>
              <span className="fu-act__kind">{a.type === 'honor' ? '★' : '◆'}</span>
              <span className="fu-act__t">
                <b>
                  {a.title}
                  {a.role ? ` · ${a.role}` : ''}
                </b>
                <small>
                  {a.type === 'honor' ? a.level || 'Level?' : `${a.hoursPerWeek ?? '?'} h/wk · ${a.weeksPerYear ?? '?'} wk/yr`}
                  {a.years.length ? ` · Y${a.years.join(', Y')}` : ''}
                  {a.desc ? ` · ${a.desc}` : ''}
                </small>
              </span>
              {a.type === 'activity' && a.desc.length > ACTIVITY_LIMITS.desc && <span className="fu-over">{a.desc.length}/150</span>}
            </button>
          </li>
        ))}
      </ol>
      <div className="fu-row" style={{ marginTop: 8 }}>
        <button type="button" className="i-btn" onClick={() => openSheet({ type: 'future-activity' })}>
          + Activity
        </button>
        <button type="button" className="i-btn" onClick={() => openSheet({ type: 'future-activity', preset: { type: 'honor' } })}>
          + Honour
        </button>
        {acts.length > 0 && (
          <button type="button" className="i-btn" onClick={copy}>
            Copy list
          </button>
        )}
      </div>

      {suggestions.length > 0 && (
        <>
          <H2>Suggested from your logs</H2>
          <ul className="fu-suggest">
            {suggestions.map((d) => (
              <li key={d.key}>
                <span>
                  <b>
                    {d.type === 'honor' ? '★ ' : ''}
                    {d.title}
                  </b>
                  <small>{d.type === 'activity' ? `${d.hoursPerWeek} h/week over ${d.weeksPerYear} weeks in the last year${d.years.length ? ` · Year ${d.years.join(', ')}` : ''}` : `${d.desc}`}</small>
                </span>
                <button type="button" className="i-btn i-btn--sm" onClick={() => add(d)} aria-label={`Add ${d.title}`}>
                  Add
                </button>
              </li>
            ))}
          </ul>
          <p className="i-note">Hours are averaged over the weeks you actually logged it in the last year. Things you never log here (like your ARSM diploma) add by hand.</p>
        </>
      )}
    </>
  );
}

// ─── essays and the story bank ──────────────────────────────────────────────

export function EssaysTab({ records, today }: Props) {
  const essays = of(records, essayOf);
  const stories = of(records, storyOf);
  const unis = new Map(of(records, uniOf).map((u) => [u.id, u.name]));
  return (
    <>
      <div className="fu-pipeline" aria-label="Essays by status">
        {ESSAY_STATUSES.map((s) => (
          <span key={s} className={`fu-pipe is-${s}`}>
            <b>{essays.filter((e) => e.status === s).length}</b>
            {ESSAY_STATUS_LABEL[s]}
          </span>
        ))}
      </div>
      <div className="fu-row" style={{ flexWrap: 'wrap' }}>
        <button type="button" className="i-btn" onClick={() => openSheet({ type: 'future-essay', kind: 'common' })}>
          + Common App
        </button>
        <button type="button" className="i-btn" onClick={() => openSheet({ type: 'future-essay', kind: 'ucas' })}>
          + UCAS statement
        </button>
        <button type="button" className="i-btn" onClick={() => openSheet({ type: 'future-essay', kind: 'supplement' })}>
          + Supplement
        </button>
      </div>
      <ul className="fu-essays" aria-label="Essays">
        {essays.map((e) => {
          const c = essayCount(e);
          return (
            <li key={e.id}>
              <button type="button" className={`fu-essay-card is-${e.status}`} onClick={() => openSheet({ type: 'future-essay', editId: e.id })}>
                <span className="fu-essay-card__top">
                  <b>{e.title}</b>
                  <em>{ESSAY_STATUS_LABEL[e.status]}</em>
                </span>
                <small>
                  {e.uniId && unis.get(e.uniId) ? `${unis.get(e.uniId)} · ` : ''}
                  {e.prompt ? `${e.prompt.slice(0, 90)}${e.prompt.length > 90 ? '…' : ''}` : e.kind === 'ucas' ? 'Three questions' : 'No prompt yet'}
                </small>
                <span className={`fu-essay-card__bar${c.over ? ' is-over' : ''}`} style={{ '--p': `${Math.min(100, (c.used / e.limit.n) * 100)}%` } as CSSProperties}>
                  <i />
                </span>
                <small className="i-mono">
                  {c.used}/{e.limit.n} {e.limit.unit === 'words' ? 'words' : 'chars'}
                  {e.deadline ? ` · due ${shortDate(e.deadline, today)}` : ''}
                  {e.versions.length ? ` · ${e.versions.length} version${e.versions.length === 1 ? '' : 's'}` : ''}
                </small>
              </button>
            </li>
          );
        })}
      </ul>
      {!essays.length && <p className="i-note">Start with the ones everyone needs: the Common App essay (650 words) and the UCAS statement (three questions, 4,000 characters).</p>}

      <H2 aside={<button type="button" className="i-link" onClick={() => openSheet({ type: 'future-story' })}>+ Story</button>}>Story bank</H2>
      <p className="i-note" style={{ marginTop: 0 }}>Moments worth writing about, caught while you remember the details. Link them to essays when you use them.</p>
      <ul className="fu-stories">
        {stories.map((s) => {
          const used = essays.filter((e) => e.stories.includes(s.id)).length;
          return (
            <li key={s.id}>
              <button type="button" className="fu-story" onClick={() => openSheet({ type: 'future-story', editId: s.id })}>
                <b>{s.title}</b>
                <small>
                  {s.tags.length ? `${s.tags.join(' · ')} · ` : ''}
                  {used ? `in ${used} essay${used === 1 ? '' : 's'}` : 'not used yet'}
                </small>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

// ─── the roadmap ────────────────────────────────────────────────────────────

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function RoadmapTab({ records, entry, birthYear, today }: Props & { entry: number; birthYear: number | null }) {
  const st = useStore(data, (s) => s);
  const stops = useMemo(
    () => [...roadmap(entry, records, today).filter((s) => s.date >= today.slice(0, 8) + '01'), { date: today, title: 'You are here', typical: false, kind: 'system' as const }].sort((a, b) => a.date.localeCompare(b.date)),
    [entry, records, today],
  );
  const months = useMemo(() => {
    const m = new Map<string, typeof stops>();
    for (const s of stops) m.set(s.date.slice(0, 7), [...(m.get(s.date.slice(0, 7)) ?? []), s]);
    return [...m.entries()];
  }, [stops]);
  const programs = of(records, programOf);
  const careers = of(records, careerOf).sort((a, b) => b.pull - a.pull);
  const ages = of(records, ageOf).sort((a, b) => a.age - b.age);
  const contacts = of(records, contactOf);
  const [birth, setBirth] = useState(birthYear ? String(birthYear) : '');
  const nowAge = birthYear ? Number(today.slice(0, 4)) - birthYear : null;
  const { open: bucketOpen } = useMemo(() => bucketItems(st), [st]);
  const bucketById = new Map(bucketOpen.map((b) => [b.id, b]));
  // every age on the timeline: the ones written, plus the usual milestones not written yet
  const slots = [...ages.map((a) => ({ ...a, id: a.id as string | null })), ...TIMELINE_AGES.filter((n) => !ages.some((x) => x.age === n)).map((n) => ({ id: null as string | null, age: n, text: '', bucket: [] as string[] }))].sort((a, b) => a.age - b.age);
  // a bucket-list wish with a year sits at the first age on the timeline reached by that year
  const dated = new Map<number, typeof bucketOpen>();
  if (birthYear)
    for (const b of bucketOpen) {
      const by = b.data.by;
      if (typeof by !== 'number') continue;
      const slot = slots.find((a) => birthYear + a.age >= by) ?? slots.at(-1);
      if (slot) dated.set(slot.age, [...(dated.get(slot.age) ?? []), b]);
    }
  const havePrograms = new Set(programs.map((p) => p.name.toLowerCase()));
  const haveCareers = new Set(careers.map((c) => c.name.toLowerCase()));

  return (
    <>
      <H2>Timeline to {entry}</H2>
      <ol className="fu-line" aria-label="Timeline">
        {months.map(([ym, list]) => (
          <li key={ym} className={ym === today.slice(0, 7) ? 'is-now' : ''}>
            <span className="fu-line__m">
              {MONTHS[Number(ym.slice(5, 7)) - 1]} <small>{ym.slice(0, 4)}</small>
            </span>
            <ul>
              {list.map((s, i) => (
                <li key={i} className={s.typical ? 'is-typical' : 'is-mine'}>
                  <span className="i-mono">{s.date.slice(8, 10)}</span> {s.title}
                  {s.typical && <em> · usual date</em>}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      <p className="i-note">Grey stops are the usual pattern for a {entry} start, not confirmed dates. Amber ones are yours.</p>

      <H2 aside={<button type="button" className="i-link" onClick={() => openSheet({ type: 'future-program' })}>+ Add</button>}>Programmes & competitions</H2>
      <ul className="fu-cards">
        {programs.map((p) => (
          <li key={p.id}>
            <button type="button" className={`fu-card is-${p.status}`} onClick={() => openSheet({ type: 'future-program', editId: p.id })}>
              <b>{p.name}</b>
              <small>
                {p.kind === 'competition' ? 'Competition' : 'Programme'} · {PROGRAM_STATUS_LABEL[p.status]}
                {p.deadline ? ` · apply by ${shortDate(p.deadline, today)}` : ''}
                {p.start ? ` · ${shortDate(p.start, today)}` : ''}
                {p.result ? ` · ${p.result}` : ''}
              </small>
            </button>
          </li>
        ))}
      </ul>
      <div className="i-picks">
        {PROGRAM_PRESETS.filter((p) => !havePrograms.has(p.name.toLowerCase())).map((p) => (
          <button key={p.name} type="button" className="i-pick" onClick={() => openSheet({ type: 'future-program', preset: p })} title={p.note}>
            + {p.name}
          </button>
        ))}
      </div>

      <H2 aside={<button type="button" className="i-link" onClick={() => openSheet({ type: 'future-career' })}>+ Add</button>}>Career paths</H2>
      <ul className="fu-cards">
        {careers.map((c) => {
          const done = c.steps.filter((s) => s.done).length;
          return (
            <li key={c.id}>
              <button type="button" className="fu-card" onClick={() => openSheet({ type: 'future-career', editId: c.id })}>
                <b>
                  {c.name} <span className="fu-pull" aria-label={`pull ${c.pull} of 5`}>{'●'.repeat(c.pull)}{'○'.repeat(5 - c.pull)}</span>
                </b>
                <small>
                  {c.steps.length ? `${done}/${c.steps.length} steps · ` : ''}
                  {c.needs || c.why || 'What it takes, and why it pulls'}
                </small>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="i-picks">
        {CAREER_PRESETS.filter((c) => !haveCareers.has(c.name.toLowerCase())).map((c) => (
          <button key={c.name} type="button" className="i-pick" onClick={() => openSheet({ type: 'future-career', preset: c })}>
            + {c.name}
          </button>
        ))}
      </div>

      <H2>Life by age</H2>
      {nowAge === null ? (
        <div className="fu-row">
          <input className="i-input" inputMode="numeric" maxLength={4} value={birth} onChange={(e) => setBirth(e.target.value)} placeholder="Birth year" aria-label="Birth year" />
          <button
            type="button"
            className="i-btn"
            disabled={!/^(19|20)\d\d$/.test(birth)}
            onClick={() => setPref('future_profile', { ...((data.get().lt_prefs.get('future_profile')?.value as object) ?? {}), entryYear: entry, birthYear: Number(birth) })}
          >
            Save
          </button>
        </div>
      ) : (
        <p className="i-note" style={{ marginTop: 0 }}>
          You turn {nowAge} this year. Bucket-list things with a year sit at the age you'll be then.
        </p>
      )}
      <ol className="fu-ages">
        {slots.map((a) => {
          const year = birthYear ? birthYear + a.age : null;
          const items = [...a.bucket.map((id) => bucketById.get(id)), ...(dated.get(a.age) ?? [])].filter((b, i, l) => !!b && l.indexOf(b) === i);
          return (
            <li key={a.age} className={nowAge !== null && a.age <= nowAge ? 'is-past' : ''}>
              <button type="button" className="fu-age" onClick={() => openSheet({ type: 'future-age', editId: a.id ?? undefined, age: a.age })}>
                <span className="fu-age__n">
                  {a.age}
                  {year && <small>{year}</small>}
                </span>
                <span className="fu-age__t">
                  {a.text || <em>Where do you want to be at {a.age}?</em>}
                  {items.length > 0 && <small>夢 {items.map((b) => b!.title).join(' · ')}</small>}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <button type="button" className="i-link" onClick={() => openSheet({ type: 'future-age' })}>
        + Another age
      </button>

      <H2 aside={<button type="button" className="i-link" onClick={() => openSheet({ type: 'future-contact' })}>+ Add</button>}>People & research</H2>
      {contacts.length ? (
        <div className="fu-kanban">
          {CONTACT_STATUSES.filter((s) => contacts.some((c) => c.status === s)).map((s) => (
            <div key={s} className="fu-kanban__col">
              <h3>{CONTACT_STATUS_LABEL[s]}</h3>
              {contacts
                .filter((c) => c.status === s)
                .map((c) => (
                  <button key={c.id} type="button" className="fu-card" onClick={() => openSheet({ type: 'future-contact', editId: c.id })}>
                    <b>{c.name}</b>
                    <small>
                      {[c.org, c.kind].filter(Boolean).join(' · ')}
                      {c.next ? ` · follow up ${shortDate(c.next, today)}` : ''}
                    </small>
                  </button>
                ))}
            </div>
          ))}
        </div>
      ) : (
        <p className="i-note">Professors whose work you like, labs, internships. Track who you've written to and when to follow up.</p>
      )}
    </>
  );
}

