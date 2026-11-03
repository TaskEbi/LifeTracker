/** 作戦室: the weekly review. The tape, what happened, the week's theme and Big Three, sealed with a stamp. */
import { useMemo, useState } from 'react';
import { progressInput, useTargets, useToday } from '../../../data/lt';
import { data } from '../../../data/store';
import { SECTION_IDS, type SectionId } from '../../../data/types';
import { weatherOf } from '../../../domain/hq/checkin';
import { currentReview, planWeekFor, reviewStreak, tapeFor, type BigThree, type Review } from '../../../domain/hq/review';
import { addDays, rangeLabel, shortDay } from '../../../domain/log/dates';
import { formatMinutes } from '../../../domain/log/duration';
import { sectionInfo } from '../../../domain/sections';
import { useStore } from '../../../lib/createStore';
import { accent, H2, Meter, Picks } from '../../../ui/i/bits';
import { RoomHead } from '../HqView';
import { saveReview, tickBig, useHq } from '../store';
import { occurrences } from '../../../domain/calendar/occurrences';

const KEY = 'lt.hq.review-draft';
interface Draft {
  week: string;
  win: string;
  stuck: string;
  change: string;
  theme: string;
  rating: number | null;
  big: BigThree[];
}
const blank = (week: string): Draft => ({ week, win: '', stuck: '', change: '', theme: '', rating: null, big: [0, 1, 2].map(() => ({ text: '', section: null, done: false })) });
function loadDraft(week: string, existing: Review | undefined): Draft {
  if (existing) return { ...existing, big: [0, 1, 2].map((i) => existing.big[i] ?? { text: '', section: null, done: false }) };
  try {
    const d = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Draft | null;
    if (d?.week === week) return d;
  } catch {
    /* no draft */
  }
  return blank(week);
}
function keepDraft(d: Draft | null) {
  try {
    if (d) localStorage.setItem(KEY, JSON.stringify(d));
    else localStorage.removeItem(KEY);
  } catch {
    /* private mode: the draft lasts until the page closes */
  }
}

const RATINGS = [
  { id: '1', label: 'Rough' },
  { id: '2', label: 'Meh' },
  { id: '3', label: 'Fine' },
  { id: '4', label: 'Good' },
  { id: '5', label: 'Great' },
];

function SectionSelect({ value, onChange, label }: { value: SectionId | null; onChange: (s: SectionId | null) => void; label: string }) {
  return (
    <select className="i-input hq-select" value={value ?? ''} onChange={(e) => onChange((e.target.value || null) as SectionId | null)} aria-label={label}>
      <option value="">No section</option>
      {SECTION_IDS.filter((s) => s !== 'cabinet').map((s) => (
        <option key={s} value={s}>
          {sectionInfo(s).name}
        </option>
      ))}
    </select>
  );
}

function Plan({ review, label }: { review: Review; label: string }) {
  const done = review.big.filter((b) => b.done).length;
  return (
    <section className="hq-plan" aria-label={label}>
      <div className="hq-plan__h">
        <span className="i-lab">{label}</span>
        {review.theme && <b className="hq-plan__theme">{review.theme}</b>}
        <span className="hq-plan__stamp" aria-hidden="true">
          決
        </span>
      </div>
      <div className="hq-plan__big">
        {review.big.map((b, i) => (
          <button key={i} type="button" role="checkbox" aria-checked={b.done} className={`hq-tick${b.done ? ' is-done' : ''}`} style={accent(b.section)} onClick={() => tickBig(review, i)}>
            <span className="hq-tick__box" aria-hidden="true">
              {b.done ? '✓' : i + 1}
            </span>
            <span className="hq-tick__t">{b.text}</span>
            {b.section && <small>{sectionInfo(b.section).name}</small>}
          </button>
        ))}
        {!review.big.length && <p className="i-note">No Big Three this week.</p>}
      </div>
      {review.big.length > 0 && <p className="i-note">{done === review.big.length ? 'All three done. That was the week.' : `${done} of ${review.big.length} done.`}</p>}
    </section>
  );
}

export function WarRoom() {
  const today = useToday();
  const hq = useHq();
  const st = useStore(data, (s) => s);
  const targets = useTargets();
  const week = planWeekFor(today);
  const sealed = hq.reviews.find((r) => r.week === week);
  const [editing, setEditing] = useState(false);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(() => loadDraft(week, sealed));
  const [justSealed, setJustSealed] = useState(false);
  const current = currentReview(hq.reviews, today);
  const tape = useMemo(() => tapeFor(progressInput(st, today), week, hq.checkIns, hq.reviews), [st, today, week, hq.checkIns, hq.reviews]);
  const ahead = useMemo(() => occurrences(st.lt_events.values(), week, addDays(week, 6)).filter((o) => !o.cancelled && o.event.kind !== 'session').slice(0, 6), [st.lt_events, week]);
  const openTasks = useMemo(() => [...st.todos.values()].filter((t) => !t.deleted_at && !t.done_at && t.due && t.due < addDays(week, 7)).length, [st.todos, week]);
  const streak = reviewStreak(hq.reviews, today);

  const put = (patch: Partial<Draft>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    keepDraft(next);
  };
  const putBig = (i: number, patch: Partial<BigThree>) => put({ big: draft.big.map((b, k) => (k === i ? { ...b, ...patch } : b)) });
  const seal = () => {
    saveReview(draft, today);
    keepDraft(null);
    setEditing(false);
    setStep(0);
    setJustSealed(true);
  };

  const r = tape.recap;
  const change = r.minutes - r.prevMinutes;
  const flow = !sealed || editing;

  return (
    <div>
      <RoomHead room="war" />
      {current && current.week !== week && <Plan review={current} label="This week" />}
      {sealed && !editing && (
        <>
          {justSealed && (
            <div className="hq-sealed" role="status">
              <span className="hq-sealed__stamp" aria-hidden="true">
                決定
              </span>
              Sealed. Go and do it.
            </div>
          )}
          <Plan review={sealed} label={sealed.week === current?.week ? 'This week' : `Week of ${shortDay(sealed.week)}`} />
          <button
            type="button"
            className="i-btn i-btn--block"
            onClick={() => {
              setDraft(loadDraft(week, sealed));
              setEditing(true);
              setStep(1);
              setJustSealed(false);
            }}
          >
            Change this plan
          </button>
        </>
      )}

      {flow && (
        <section className="hq-flow" aria-label="Weekly review">
          <ol className="hq-flow__steps" aria-label={`Step ${step + 1} of 4`}>
            {['The tape', 'What happened', 'The plan', 'Seal it'].map((s, i) => (
              <li key={s} className={i === step ? 'is-now' : i < step ? 'is-past' : ''}>
                {s}
              </li>
            ))}
          </ol>

          {step === 0 && (
            <div className="i-stack">
              <H2 aside={rangeLabel(r.start, r.end)}>Last week on tape</H2>
              {r.minutes === 0 && r.activeDays === 0 ? (
                <p className="i-note">Nothing was logged that week. That’s worth knowing too.</p>
              ) : (
                <>
                  <div className="i-meters i-meters--4">
                    <Meter value={formatMinutes(r.minutes)} label={r.prevMinutes ? `${change >= 0 ? '+' : '−'}${formatMinutes(Math.abs(change))} on the week before` : 'Logged'} />
                    <Meter value={`${r.activeDays}/7`} label="Active days" />
                    <Meter value={tape.sleep != null ? formatMinutes(Math.round(tape.sleep)) : '—'} label={`Average night · ${r.nights} logged`} />
                    <Meter value={tape.screen != null ? formatMinutes(Math.round(tape.screen)) : '—'} label="Screen a day" />
                  </div>
                  <div className="i-pnl i-pnl--flush">
                    {r.sections.slice(0, 6).map((s) => {
                      const isSection = (SECTION_IDS as readonly string[]).includes(s.id);
                      return (
                        <div key={s.id} className="i-row" style={accent(isSection ? (s.id as SectionId) : null)}>
                          <span className="i-row__t">
                            <b>{isSection ? sectionInfo(s.id as SectionId).name : 'Other'}</b>
                            {s.id === 'violin' && <small>target {targets.violinWeek} min</small>}
                            {s.id === 'future' && <small>target {targets.futureWeek} min</small>}
                            {s.id === 'reading' && <small>target {targets.readingWeek} min</small>}
                          </span>
                          <span className="i-row__n">{formatMinutes(s.minutes)}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="i-note">
                    {r.tasks} tasks done
                    {r.boss ? ` · ${r.boss.name} ${r.boss.defeatedOn ? 'defeated' : 'got away'}` : ''}
                    {tape.mood != null ? ` · inner weather mostly ${weatherOf(tape.mood).name.toLowerCase()}` : ''}
                    {r.bestDay ? ` · best day ${shortDay(r.bestDay.date)}` : ''}
                  </p>
                </>
              )}
              {tape.previous && tape.previous.big.length > 0 && (
                <div className="i-pnl">
                  <span className="i-lab">What you said you’d do</span>
                  {tape.previous.theme && <p className="i-note">Theme: {tape.previous.theme}</p>}
                  <ul className="hq-list">
                    {tape.previous.big.map((b, i) => (
                      <li key={i} className={b.done ? 'is-done' : ''}>
                        {b.done ? '✓' : '✗'} {b.text}
                      </li>
                    ))}
                  </ul>
                  {tape.previous.change && <p className="i-note">You wanted to change: {tape.previous.change}</p>}
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="i-stack">
              <div className="i-field">
                <span className="i-lab">How did it feel?</span>
                <Picks label="How did last week feel" value={draft.rating != null ? String(draft.rating) : null} onChange={(v) => put({ rating: Number(v) })} options={RATINGS} />
              </div>
              <label className="i-field">
                <span className="i-lab">The best thing about it</span>
                <textarea className="i-textarea" value={draft.win} onChange={(e) => put({ win: e.target.value })} placeholder="Something that went well, however small" maxLength={500} />
              </label>
              <label className="i-field">
                <span className="i-lab">What got in the way</span>
                <textarea className="i-textarea" value={draft.stuck} onChange={(e) => put({ stuck: e.target.value })} placeholder="Be honest, nobody else reads this" maxLength={500} />
              </label>
              <label className="i-field">
                <span className="i-lab">One thing to change</span>
                <input className="i-input" value={draft.change} onChange={(e) => put({ change: e.target.value })} placeholder="Small enough to actually do" maxLength={500} />
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="i-stack">
              {ahead.length > 0 && (
                <div className="i-pnl">
                  <span className="i-lab">Coming up that week</span>
                  <ul className="hq-list">
                    {ahead.map((o) => (
                      <li key={o.key}>
                        {shortDay(o.date)} · {o.event.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {openTasks > 0 && <p className="i-note">{openTasks} tasks are due by the end of it.</p>}
              <label className="i-field">
                <span className="i-lab">Theme of the week</span>
                <input className="i-input" value={draft.theme} onChange={(e) => put({ theme: e.target.value })} placeholder="e.g. Bed by eleven · Segment trees · Bach week" maxLength={80} />
              </label>
              <span className="i-lab">The Big Three: if only these happen, it was a good week</span>
              {draft.big.map((b, i) => (
                <div key={i} className="hq-bigrow">
                  <input className="i-input" value={b.text} onChange={(e) => putBig(i, { text: e.target.value })} placeholder={['The one that matters most', 'The next one', 'And one more'][i]} aria-label={`Big Three, number ${i + 1}`} maxLength={120} />
                  <SectionSelect value={b.section} onChange={(s) => putBig(i, { section: s })} label={`Section for number ${i + 1}`} />
                </div>
              ))}
              <p className="i-note">A Big Three with a section also moves that section up in Next move.</p>
            </div>
          )}

          {step === 3 && (
            <div className="i-stack">
              <div className="hq-seal">
                <span className="i-lab">Week of {shortDay(week)}</span>
                <b className="hq-seal__t">{draft.theme || 'No theme'}</b>
                <ol>
                  {draft.big.filter((b) => b.text.trim()).map((b, i) => (
                    <li key={i}>{b.text}</li>
                  ))}
                </ol>
                {!draft.big.some((b) => b.text.trim()) && <p className="i-note">No Big Three chosen. You can still seal it.</p>}
              </div>
            </div>
          )}

          <div className="hq-flow__nav">
            {step > 0 && (
              <button type="button" className="i-btn" onClick={() => setStep(step - 1)}>
                Back
              </button>
            )}
            {step < 3 ? (
              <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={() => setStep(step + 1)}>
                Next
              </button>
            ) : (
              <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={seal}>
                Seal the plan
              </button>
            )}
            {editing && (
              <button type="button" className="i-btn" onClick={() => setEditing(false)}>
                Cancel
              </button>
            )}
          </div>
        </section>
      )}

      {hq.reviews.length > 0 && (
        <>
          <H2 aside={streak > 1 ? `${streak} in a row` : undefined}>Past reviews</H2>
          <div className="i-pnl i-pnl--flush">
            {hq.reviews.slice(0, 12).map((v) => (
              <details key={v.id} className="hq-past">
                <summary>
                  <b>{shortDay(v.week)}</b> {v.theme ? `· ${v.theme}` : ''} <span className="i-mono i-small i-dim">{v.big.filter((b) => b.done).length}/{v.big.length}</span>
                </summary>
                {v.win && <p>Best: {v.win}</p>}
                {v.stuck && <p>In the way: {v.stuck}</p>}
                {v.change && <p>To change: {v.change}</p>}
                <ul className="hq-list">
                  {v.big.map((b, i) => (
                    <li key={i} className={b.done ? 'is-done' : ''}>
                      {b.done ? '✓' : '✗'} {b.text}
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
