/** The Stage's sheets: pick a kind, log a result (each kind with its own fields), and get ready for a day ahead. */
import { useMemo, useState, type CSSProperties } from 'react';
import { registerSheet } from '../../app/sheetRegistry';
import { closeSheet, openSheet, type SheetSpec } from '../../app/sheets';
import { ltToday, sectionRecords } from '../../data/lt';
import { deleteRecord } from '../../data/records';
import { deleteSession } from '../../data/sessions';
import { data } from '../../data/store';
import { toast } from '../../data/ui';
import { addDays, dayCount, longDay } from '../../domain/log/dates';
import {
  LOGGABLE,
  MATCH_STATS,
  lastNote,
  parseSets,
  parseTime,
  PLAN_EVENT,
  planOf,
  plannedMinutes,
  planTitle,
  PREP,
  setsText,
  setTally,
  STAGE_TYPES,
  SUBTYPES,
  timeText,
  type Outcome,
  type Plan,
  type Reflection,
  type ShowType,
  type StageType,
} from '../../domain/stage/model';
import { Picks } from '../../ui/i/bits';
import { DayPick, MinutesField } from '../../ui/i/fields';
import { Sheet } from '../../ui/i/Sheet';
import { Field } from '../life/Frame';
import { deleteEvent } from '../calendar/actions';
import { shift, TimeFields } from '../calendar/EventSheet';
import { SPORTS, sportInfo } from '../sports/model';
import { pieceName, pieceOf } from '../violin/model';
import { prepFor, rawOf, savePlan, savePrep, saveShow, saveSportResult, saveTest, showsIn, stageDays, subjectsNow, type PlanForm } from './store';

const READY = ['Not at all', 'Shaky', 'Okay', 'Ready', 'Totally ready'];
const NERVES = ['Calm', 'A little', 'Some', 'Very', 'Shaking'];
const RATING = ['Rough', 'Meh', 'Okay', 'Good', 'Brilliant'];

/** 1–5 as a row of buttons; tap the same one again to clear it. */
export function Scale({ label, value, onChange, words, glyph }: { label: string; value: number | null; onChange: (v: number | null) => void; words: string[]; glyph?: string }) {
  return (
    <div className="i-field">
      <span className="i-lab">
        {label}
        {value != null && <b className="stg-scale__w"> · {words[value - 1]}</b>}
      </span>
      <div className={`stg-scale${glyph ? ' stg-scale--stars' : ''}`} role="group" aria-label={label}>
        {[1, 2, 3, 4, 5].map((v) => (
          <button key={v} type="button" aria-label={`${label} ${v} of 5: ${words[v - 1]}`} aria-pressed={value === v} className={glyph && (value ?? 0) >= v ? 'is-on' : ''} onClick={() => onChange(value === v ? null : v)}>
            {glyph ?? v}
          </button>
        ))}
      </div>
    </div>
  );
}

/** What it was: the seven kinds, to log a result or to put one on the calendar. */
function PickSheet({ spec }: { spec: SheetSpec }) {
  const plan = spec.plan === true;
  const open = (t: StageType) => openSheet(plan ? { type: 'stage-plan', kind: t } : { type: 'stage-log', kind: t });
  return (
    <Sheet title={plan ? 'What’s coming up?' : 'What was it?'} onClose={closeSheet}>
      {plan && <p className="i-note">It goes on the calendar and the Stage counts down to it. When it’s over, one tap logs it with what you planned already filled in.</p>}
      <div className="stg-kinds">
        {LOGGABLE.map((t) => (
          <button key={t} type="button" className="stg-kind" style={{ '--tc': STAGE_TYPES[t].c } as CSSProperties} onClick={() => open(t)}>
            <span aria-hidden="true">{STAGE_TYPES[t].k}</span>
            <b>{STAGE_TYPES[t].one}</b>
            <small>{HINT[t]}</small>
          </button>
        ))}
      </div>
    </Sheet>
  );
}
const HINT: Record<string, string> = {
  violin: 'Concert, recital, grade exam, competition',
  test: 'A mark: goes into Study too',
  match: 'Volleyball, tennis: counts as sport time',
  race: 'A run, ride or swim with a time',
  chess: 'A game over the board',
  talk: 'Presentation, speech, debate, interview',
  other: 'Any other competition or big day',
};

/** Repertoire as toggles: what you played, or what you'll play. */
function PiecePicks({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  const repertoire = useMemo(() => {
    const all = sectionRecords(data.get(), 'violin', 'piece').map(pieceOf);
    return [...all.filter((p) => !p.archived), ...all.filter((p) => p.archived)];
  }, []);
  return (
    <div className="i-field">
      <span className="i-lab">{label}</span>
      {repertoire.length ? (
        <div className="stg-pieces" role="group" aria-label={label}>
          {repertoire.map((p) => (
            <button key={p.id} type="button" className="i-pick" aria-pressed={value.includes(p.id)} onClick={() => onChange(value.includes(p.id) ? value.filter((x) => x !== p.id) : [...value, p.id])}>
              {pieceName(p)}
            </button>
          ))}
        </div>
      ) : (
        <p className="i-note">Add pieces in Violin → Repertoire and they'll show here.</p>
      )}
    </div>
  );
}

const n = (v: string) => {
  const x = Number(v.replace(',', '.'));
  return v.trim() !== '' && Number.isFinite(x) ? x : null;
};
const s = (v: unknown) => (typeof v === 'string' ? v : '');
const nn = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? String(v) : '');

function LogSheet({ spec }: { spec: SheetSpec }) {
  const today = ltToday();
  const st = data.get();
  const editing = spec.editId ? showsIn(st).find((x) => x.id === spec.editId) : undefined;
  const raw = editing ? rawOf(st, editing) : {};
  const type: StageType = editing?.type ?? ((spec.kind as StageType) || 'other');
  const event = editing?.event ?? ((spec.event as string | undefined) || null);
  const ev = event ? stageDays(st, today).find((u) => u.key === event) : undefined;
  // A sports session keeps its own note (shown in the Sports log).
  const entryNote = editing?.source === 'sport' ? (st.log_entries.get(editing.id)?.note ?? '') : '';
  const prep = event && !editing ? prepFor(st, event) : null;
  // What you planned ahead of time fills the form in.
  const plan = ev && !editing ? planOf(ev.event.data) : planOf(undefined);
  const planned = plannedMinutes(ev?.event.start ?? null, ev?.event.end ?? null);
  const info = STAGE_TYPES[type];
  const sentDate = typeof spec.date === 'string' && spec.date <= today ? spec.date : null;

  const [date, setDate] = useState(editing?.date ?? sentDate ?? today);
  const [title, setTitle] = useState(editing ? (editing.source === 'sport' ? s(raw.race) : s(raw.title)) : s(spec.title));
  const [kind, setKind] = useState(s(raw.kind) || s(raw.testKind) || plan.kind || SUBTYPES[type]?.[0] || '');
  const [where, setWhere] = useState(s(raw.where) || s(raw.comp) || (type === 'match' ? plan.comp : plan.where));
  const [result, setResult] = useState(editing?.source === 'show' ? s(raw.result) : '');
  const [outcome, setOutcome] = useState<Outcome | null>(editing?.outcome ?? null);
  const [outcomeSet, setOutcomeSet] = useState(!!s(raw.result) || !!s(raw.outcome));
  const [place, setPlace] = useState(nn(raw.place));
  const [opp, setOpp] = useState(s(raw.opp) || plan.opp);
  const [oppRating, setOppRating] = useState(nn(raw.oppRating));
  const [colour, setColour] = useState<string | null>(s(raw.colour) || null);
  const [pieces, setPieces] = useState<string[]>(editing?.pieces ?? (Array.isArray(ev?.event.data.pieces) ? (ev!.event.data.pieces as string[]) : []));
  // tests
  const subjects = subjectsNow();
  const [subject, setSubject] = useState(editing?.type === 'test' ? editing.kind : plan.subject || subjects[0]);
  const [score, setScore] = useState(nn(raw.score));
  const [outOf, setOutOf] = useState(nn(raw.outOf));
  const [grade, setGrade] = useState(s(raw.grade));
  const [predict, setPredict] = useState(nn(raw.predict) || (prep?.predict != null ? String(prep.predict) : ''));
  // sport
  const court = SPORTS.filter((x) => x.kind === 'court');
  const distance = SPORTS.filter((x) => x.kind === 'distance');
  const [sport, setSport] = useState<string>(s(raw.sport) || plan.sport || (type === 'match' ? 'volleyball' : 'running'));
  const [minutes, setMinutes] = useState(editing?.minutes ?? planned ?? (type === 'match' ? 90 : 30));
  const [setsIn, setSetsIn] = useState(Array.isArray(raw.sets) && raw.sets.length ? setsText(raw.sets as [number, number][]) : s(raw.score));
  const [stats, setStats] = useState<Record<string, number>>(editing?.stats ?? {});
  const [km, setKm] = useState(nn(raw.km) || plan.km);
  const [time, setTime] = useState(typeof raw.secs === 'number' ? timeText(raw.secs) : '');
  // before and after
  const [goal, setGoal] = useState(editing?.goal ?? prep?.goal ?? '');
  const [ready, setReady] = useState<number | null>(editing ? editing.ready : (prep?.ready ?? null));
  const [nerves, setNerves] = useState<number | null>(editing ? editing.nerves : (prep?.nerves ?? null));
  const [rating, setRating] = useState<number | null>(editing?.rating ?? null);
  const [well, setWell] = useState(editing?.well ?? '');
  const [next, setNext] = useState(editing?.next ?? '');
  const [error, setError] = useState<string | null>(null);

  const sets = parseSets(setsIn);
  const tally = sets && sets.length ? setTally(sets) : null;
  const shownOutcome = outcomeSet ? outcome : (tally?.outcome ?? outcome);
  const last = lastNote(showsIn(st), type, editing?.date ?? date);
  const refl: Partial<Reflection> = { goal, ready, nerves, rating, well, next };
  const sc = n(score);
  const oo = n(outOf);
  const pct = sc != null && oo != null && oo > 0 && sc >= 0 && sc <= oo ? Math.round((sc / oo) * 100) : null;

  // A day that hasn't happened yet can't have a result: it goes on the calendar as a plan instead.
  const ahead = date > today && !editing && !event;
  const planFields: Partial<Plan> = {
    kind: SUBTYPES[type] ? kind : '',
    where: type === 'match' ? '' : where,
    comp: type === 'match' ? where : '',
    opp: type === 'match' || type === 'chess' ? opp : '',
    sport: type === 'match' || type === 'race' ? sport : '',
    km: type === 'race' ? km : '',
    subject: type === 'test' ? subject : '',
  };

  const save = () => {
    setError(null);
    if (ahead) {
      const err = savePlan({ type: type as PlanForm['type'], title: planTitle(type, type === 'match' ? '' : title, planFields, sportInfo(sport)?.name ?? 'Match'), date, start: null, end: null, plan: planFields, pieces: type === 'violin' ? pieces : [] });
      if (err) return setError(err);
      toast(`${info.one} added to Coming up`);
      return closeSheet();
    }
    if (date > today) return setError("That day hasn't happened yet.");
    const pl = n(place);
    const placeV = pl != null && pl >= 1 ? Math.round(pl) : null;
    if (type === 'test') {
      // No score yet is fine: it waits on the Stage until the test comes back.
      if (sc != null && pct == null) return setError('A score between 0 and the total, please.');
      if (sc == null && score.trim()) return setError('The score as a number, or leave it blank for now.');
      if (oo != null && oo <= 0) return setError('The total has to be more than 0.');
      if (sc == null && outOf.trim() && oo == null) return setError('The total as a number, or leave it blank.');
      const pr = n(predict);
      saveTest({ subject, title, score: sc, outOf: oo, date, testKind: kind, grade, predict: pr != null && pr >= 0 && pr <= 100 ? Math.round(pr) : null, event }, refl, editing?.id);
      if (!editing) toast(sc == null ? 'Test saved: add the score when it comes back' : `${info.one} saved to the Stage`);
      else if (editing.pending && sc != null) toast(`Score in: ${pct}%`);
      return closeSheet();
    } else if (type === 'match') {
      if (!sets) return setError('Sets as scores like 25-21, 22-25.');
      const detail = { sport, type: 'match', opp: opp.trim().slice(0, 80), comp: where.trim().slice(0, 80), sets: sets.length ? sets : null, score: sets.length ? setsText(sets) : null, result: shownOutcome, stats: Object.keys(stats).length ? stats : null, event };
      const err = saveSportResult({ date, minutes, note: entryNote, detail }, refl, editing?.id);
      if (err) return setError(err);
    } else if (type === 'race') {
      const secs = parseTime(time);
      if (!title.trim()) return setError('What was the race called?');
      if (!secs) return setError('Your time as h:mm:ss or mm:ss.');
      const k = n(km);
      if (k == null || k <= 0) return setError('How far it was, in km.');
      const detail = { sport, km: Math.round(k * 1000) / 1000, race: title.trim().slice(0, 80), secs, place: placeV, event };
      const err = saveSportResult({ date, minutes: Math.max(1, Math.round(secs / 60)), note: entryNote, detail }, refl, editing?.id);
      if (err) return setError(err);
    } else if (type !== 'maths') {
      if (!title.trim()) return setError('Give it a name.');
      const r = n(oppRating);
      saveShow(
        { type: type as ShowType, date, title, kind, where, result, outcome: shownOutcome, place: placeV, opp, oppRating: r != null && r > 0 ? Math.round(r) : null, colour, pieces: type === 'violin' ? pieces : [], event },
        refl,
        editing?.id,
      );
    }
    if (!editing) toast(`${info.one} saved to the Stage`);
    closeSheet();
  };

  const remove = () => {
    if (!editing) return;
    if (editing.source === 'sport') deleteSession(editing.id, 'Removed: the sports session is gone too');
    else deleteRecord(editing.id, editing.source === 'mark' ? 'Test removed: the Study mark is gone too' : `${info.one} removed`);
    closeSheet();
  };

  const outcomePicks = (
    <Picks
      label="Result"
      value={shownOutcome}
      onChange={(v) => {
        setOutcomeSet(true);
        setOutcome(v === shownOutcome ? null : v);
      }}
      options={[
        { id: 'win' as const, label: 'Won' },
        { id: 'loss' as const, label: 'Lost' },
        { id: 'draw' as const, label: 'Drew' },
      ]}
    />
  );

  return (
    <Sheet
      title={editing ? `${info.one}: ${editing.title}` : `Log a ${info.one.toLowerCase()}`}
      onClose={closeSheet}
      footer={
        <>
          {editing && (
            <button type="button" className="i-btn i-btn--danger" onClick={remove}>
              Delete
            </button>
          )}
          <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={save}>
            {ahead ? 'Add to Coming up' : 'Save'}
          </button>
        </>
      }
    >
      {ahead && <p className="i-note">That day is still ahead, so this goes on Coming up instead of the results. Log it once it has happened.</p>}
      {ev && !editing && (
        <p className="i-note">
          For <b>{ev.title}</b> on the calendar, {longDay(ev.date)}.
        </p>
      )}
      {editing?.source === 'mark' && <p className="i-note">This is a Study mark: changes show on the Study page too.</p>}
      {editing?.source === 'sport' && <p className="i-note">This is a sports session: its time counts for Sport.</p>}

      {SUBTYPES[type] && <Picks label={type === 'test' ? 'What kind of test' : 'What kind'} value={kind} onChange={setKind} options={SUBTYPES[type]!.map((x) => ({ id: x, label: x }))} />}

      {type === 'test' && (
        <>
          <Picks label="Subject" value={subject} onChange={setSubject} options={[...new Set([...subjects, subject])].map((x) => ({ id: x, label: x }))} />
          <Field label="What it was · optional">
            <input className="i-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Mechanics test 2" maxLength={80} />
          </Field>
          <div className="stg-two">
            <Field label="Score">
              <input className="i-input" inputMode="decimal" value={score} onChange={(e) => setScore(e.target.value)} placeholder="Not back yet" />
            </Field>
            <Field label="Out of">
              <input className="i-input" inputMode="decimal" value={outOf} onChange={(e) => setOutOf(e.target.value)} />
            </Field>
            <b className="stg-pct" aria-live="polite">{pct != null ? `${pct}%` : score.trim() ? '—' : 'Later'}</b>
          </div>
          {!score.trim() && <p className="i-note">No score yet? Save it without one. It waits on the Stage until you add the score, and goes into Study once it has one.</p>}
          <div className="stg-two">
            <Field label="Grade · optional">
              <input className="i-input" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="A*" maxLength={12} />
            </Field>
            <Field label="Your guess before (%) · optional">
              <input className="i-input" inputMode="numeric" value={predict} onChange={(e) => setPredict(e.target.value.replace(/[^\d]/g, ''))} placeholder="75" />
            </Field>
          </div>
        </>
      )}

      {type === 'match' && (
        <>
          <Picks label="Sport" value={sport} onChange={setSport} options={court.map((x) => ({ id: x.id, label: x.name }))} />
          <div className="stg-two">
            <Field label="Against">
              <input className="i-input" value={opp} onChange={(e) => setOpp(e.target.value)} placeholder="Team or player" maxLength={80} />
            </Field>
            <Field label="Competition · optional">
              <input className="i-input" value={where} onChange={(e) => setWhere(e.target.value)} placeholder="Inter-school league" maxLength={80} />
            </Field>
          </div>
          <Field label="Sets · optional (yours first)">
            <input className="i-input" value={setsIn} onChange={(e) => setSetsIn(e.target.value)} placeholder="25-21, 22-25, 15-12" maxLength={60} />
          </Field>
          {tally && (
            <p className="i-mono i-small" style={{ color: 'var(--fg-2)' }}>
              Sets {tally.won}–{tally.lost}
            </p>
          )}
          {!sets && setsIn.trim() && <p className="i-error">Write each set as two scores, like 25-21.</p>}
          {outcomePicks}
          <div className="i-field">
            <span className="i-lab">Your numbers · optional</span>
            <div className="stg-stats">
              {(MATCH_STATS[sport] ?? []).map((x) => (
                <div key={x.id} className="stg-stat">
                  <span>{x.name}</span>
                  <span className="stg-stat__c">
                    <button type="button" aria-label={`${x.name} one less`} onClick={() => setStats((o) => (o[x.id] ? { ...o, [x.id]: o[x.id] - 1 } : o))}>
                      −
                    </button>
                    <output aria-label={x.name}>{stats[x.id] ?? 0}</output>
                    <button type="button" aria-label={`${x.name} one more`} onClick={() => setStats((o) => ({ ...o, [x.id]: (o[x.id] ?? 0) + 1 }))}>
                      +
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <MinutesField value={minutes} onChange={setMinutes} presets={[45, 60, 90, 120]} />
        </>
      )}

      {type === 'race' && (
        <>
          <Picks label="Sport" value={sport} onChange={setSport} options={distance.map((x) => ({ id: x.id, label: x.name }))} />
          <Field label="Race">
            <input className="i-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sundown half marathon" maxLength={80} />
          </Field>
          <div className="stg-two">
            <Field label="Distance (km)">
              <input className="i-input" inputMode="decimal" value={km} onChange={(e) => setKm(e.target.value)} placeholder="21.1" />
            </Field>
            <Field label="Time">
              <input className="i-input" inputMode="numeric" value={time} onChange={(e) => setTime(e.target.value)} placeholder="1:52:10" />
            </Field>
            <Field label="Place · optional">
              <input className="i-input" inputMode="numeric" value={place} onChange={(e) => setPlace(e.target.value.replace(/\D/g, ''))} />
            </Field>
          </div>
        </>
      )}

      {(type === 'violin' || type === 'chess' || type === 'talk' || type === 'other') && (
        <>
          <Field label={type === 'chess' ? 'Event' : type === 'violin' ? 'What it was' : 'Name'}>
            <input className="i-input" data-autofocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder={type === 'violin' ? 'Winter concert' : type === 'chess' ? 'Singapore Rapid Open, round 3' : type === 'talk' ? 'EPQ presentation' : 'Science olympiad'} maxLength={120} />
          </Field>
          {type === 'chess' ? (
            <>
              <div className="stg-two">
                <Field label="Opponent · optional">
                  <input className="i-input" value={opp} onChange={(e) => setOpp(e.target.value)} maxLength={80} />
                </Field>
                <Field label="Their rating · optional">
                  <input className="i-input" inputMode="numeric" value={oppRating} onChange={(e) => setOppRating(e.target.value.replace(/\D/g, ''))} />
                </Field>
              </div>
              <Picks label="You played" value={colour} onChange={(v) => setColour(v === colour ? null : v)} options={[{ id: 'white', label: 'White' }, { id: 'black', label: 'Black' }]} />
              {outcomePicks}
            </>
          ) : (
            <Field label={type === 'talk' ? 'Audience or where · optional' : 'Where · optional'}>
              <input className="i-input" value={where} onChange={(e) => setWhere(e.target.value)} maxLength={120} />
            </Field>
          )}
          {type === 'violin' && <PiecePicks label="What you played" value={pieces} onChange={setPieces} />}
          {type !== 'chess' && (
            <>
              <div className="stg-two">
                <Field label="Result · optional">
                  <input className="i-input" value={result} onChange={(e) => setResult(e.target.value)} placeholder={type === 'violin' ? 'Distinction · 132/150' : type === 'talk' ? 'Got the place' : 'Silver award'} maxLength={80} />
                </Field>
                <Field label="Place · optional">
                  <input className="i-input" inputMode="numeric" value={place} onChange={(e) => setPlace(e.target.value.replace(/\D/g, ''))} placeholder="1" />
                </Field>
              </div>
              {type === 'other' && outcomePicks}
            </>
          )}
        </>
      )}

      {type !== 'maths' && <DayPick value={date} onChange={setDate} today={today} ahead={!editing && !event} />}

      <h3 className="stg-sub">How it went</h3>
      {last && !editing && (
        <p className="stg-last">
          Last time you told yourself: <q>{last.next}</q>
        </p>
      )}
      <Scale label="How it went" value={rating} onChange={setRating} words={RATING} glyph="★" />
      <Field label="What went well · optional">
        <textarea className="i-textarea" rows={2} value={well} onChange={(e) => setWell(e.target.value)} maxLength={600} />
      </Field>
      <Field label="Next time · optional">
        <textarea className="i-textarea" rows={2} value={next} onChange={(e) => setNext(e.target.value)} maxLength={600} placeholder="One thing to do differently. You'll see it before the next one." />
      </Field>
      <details className="stg-before" open={!!(goal || ready || nerves)}>
        <summary>Before it</summary>
        <Field label="What you were aiming for · optional">
          <input className="i-input" value={goal} onChange={(e) => setGoal(e.target.value)} maxLength={600} />
        </Field>
        <Scale label="Ready" value={ready} onChange={setReady} words={READY} />
        <Scale label="Nerves" value={nerves} onChange={setNerves} words={NERVES} />
      </details>
      {error && (
        <p className="i-error" role="alert">
          {error}
        </p>
      )}
    </Sheet>
  );
}

/** Putting a day ahead on the calendar, or editing one: what it is, who or where, and when. */
function PlanSheet({ spec }: { spec: SheetSpec }) {
  const today = ltToday();
  const st = data.get();
  const key = typeof spec.key === 'string' ? spec.key : null;
  const existing = key ? stageDays(st, today).find((u) => u.key === key) : undefined;
  const type = (existing?.type ?? (spec.kind as StageType | undefined) ?? 'other') as Exclude<StageType, 'maths'>;
  const info = STAGE_TYPES[type];
  const plan0 = planOf(existing?.event.data);
  const subjects = subjectsNow();
  const court = SPORTS.filter((x) => x.kind === 'court');
  const distance = SPORTS.filter((x) => x.kind === 'distance');
  const sportOf = (id: string) => sportInfo(id)?.name ?? (type === 'race' ? 'Run' : 'Match');
  // A name that was only made from the details stays blank, so it follows them when they change.
  const auto0 = existing ? existing.title === planTitle(type, '', plan0, sportOf(plan0.sport || (type === 'match' ? 'volleyball' : 'running'))) : true;

  const [title, setTitle] = useState(existing ? (auto0 ? '' : existing.title) : '');
  const [kind, setKind] = useState(plan0.kind || SUBTYPES[type]?.[0] || '');
  const [subject, setSubject] = useState(plan0.subject || subjects[0]);
  const [sport, setSport] = useState(plan0.sport || (type === 'match' ? 'volleyball' : 'running'));
  const [opp, setOpp] = useState(plan0.opp);
  const [comp, setComp] = useState(plan0.comp);
  const [where, setWhere] = useState(plan0.where);
  const [km, setKm] = useState(plan0.km);
  const [pieces, setPieces] = useState<string[]>(Array.isArray(existing?.event.data.pieces) ? (existing!.event.data.pieces as string[]) : []);
  const startAt = existing ? existing.event.start : '16:00';
  const [date, setDate] = useState(existing?.date ?? (typeof spec.date === 'string' ? spec.date : addDays(today, 1)));
  const [allDay, setAllDay] = useState(startAt === null);
  const [start, setStart] = useState(startAt ?? '16:00');
  const [end, setEnd] = useState(existing?.event.end ?? shift(startAt ?? '16:00', type === 'match' || type === 'violin' ? 90 : 60));
  const [error, setError] = useState<string | null>(null);

  if (key && !existing) {
    return (
      <Sheet title="Coming up" onClose={closeSheet}>
        <p className="i-note">That day isn’t on the calendar any more.</p>
      </Sheet>
    );
  }
  if (existing?.event.repeat) {
    return (
      <Sheet title={existing.title} onClose={closeSheet}>
        <p className="i-note">This one repeats, so it’s changed from the Calendar.</p>
        <button type="button" className="i-btn i-btn--sig" onClick={() => openSheet({ type: 'event', key: existing.key })}>
          Open in the Calendar
        </button>
      </Sheet>
    );
  }

  const fields: Partial<Plan> = {
    kind: SUBTYPES[type] ? kind : '',
    where,
    comp: type === 'match' ? comp : '',
    opp: type === 'match' || type === 'chess' ? opp : '',
    sport: type === 'match' || type === 'race' ? sport : '',
    km: type === 'race' ? km.replace(',', '.').replace(/[^\d.]/g, '') : '',
    subject: type === 'test' ? subject : '',
  };
  const made = planTitle(type, '', fields, sportOf(sport));
  const needsName = type !== 'match' && type !== 'test' && type !== 'race';
  const save = () => {
    setError(null);
    if (!existing && date < today) return setError('Pick today or a day ahead. For a day that has passed, log the result instead.');
    if (!allDay && end <= start) return setError('It has to end after it starts.');
    const err = savePlan({ type, title: planTitle(type, title, fields, sportOf(sport)), date, start: allDay ? null : start, end: allDay ? null : end, plan: fields, pieces: type === 'violin' ? pieces : [] }, existing?.event.id);
    if (err) return setError(err);
    if (!existing) toast(`${info.one} added to Coming up`);
    closeSheet();
  };
  const remove = () => {
    if (!existing) return;
    deleteEvent(existing.event.id);
    closeSheet();
  };
  const placeholders: Record<string, string> = { violin: 'Winter concert', race: 'Sundown half marathon', chess: 'Singapore Rapid Open', talk: 'EPQ presentation', other: 'Science olympiad' };

  return (
    <Sheet
      title={existing ? `Plan: ${existing.title}` : `Plan a ${info.one.toLowerCase()}`}
      onClose={closeSheet}
      accent={PLAN_EVENT[type].section ?? undefined}
      footer={
        <>
          {existing && (
            <button type="button" className="i-btn i-btn--danger" onClick={remove}>
              Delete
            </button>
          )}
          <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={save} disabled={needsName && !title.trim()}>
            {existing ? 'Save' : 'Add to Coming up'}
          </button>
        </>
      }
    >
      {SUBTYPES[type] && <Picks label={type === 'test' ? 'What kind of test' : 'What kind'} value={kind} onChange={setKind} options={SUBTYPES[type]!.map((x) => ({ id: x, label: x }))} />}
      {type === 'test' && <Picks label="Subject" value={subject} onChange={setSubject} options={[...new Set([...subjects, subject])].map((x) => ({ id: x, label: x }))} />}
      {type === 'match' && <Picks label="Sport" value={sport} onChange={setSport} options={court.map((x) => ({ id: x.id, label: x.name }))} />}
      {type === 'race' && <Picks label="Sport" value={sport} onChange={setSport} options={distance.map((x) => ({ id: x.id, label: x.name }))} />}

      <Field label={needsName ? 'Name' : 'Name · optional'}>
        <input className="i-input" data-autofocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder={needsName ? placeholders[type] : made} maxLength={120} />
      </Field>

      {type === 'match' && (
        <div className="stg-two">
          <Field label="Against · optional">
            <input className="i-input" value={opp} onChange={(e) => setOpp(e.target.value)} placeholder="Team or player" maxLength={80} />
          </Field>
          <Field label="Competition · optional">
            <input className="i-input" value={comp} onChange={(e) => setComp(e.target.value)} placeholder="Inter-school league" maxLength={80} />
          </Field>
        </div>
      )}
      {type === 'chess' && (
        <Field label="Opponent · optional">
          <input className="i-input" value={opp} onChange={(e) => setOpp(e.target.value)} maxLength={80} />
        </Field>
      )}
      {type === 'race' && (
        <Field label="Distance (km) · optional">
          <input className="i-input" inputMode="decimal" value={km} onChange={(e) => setKm(e.target.value)} placeholder="21.1" />
        </Field>
      )}
      <Field label={type === 'talk' ? 'Audience or where · optional' : 'Where · optional'}>
        <input className="i-input" value={where} onChange={(e) => setWhere(e.target.value)} placeholder={type === 'match' ? 'Court 2, away' : ''} maxLength={120} />
      </Field>
      {type === 'violin' && <PiecePicks label="What you’ll play" value={pieces} onChange={setPieces} />}

      <TimeFields {...{ date, setDate, allDay, setAllDay, start, setStart, end, setEnd }} />
      {error && (
        <p className="i-error" role="alert">
          {error}
        </p>
      )}
    </Sheet>
  );
}

/** Getting ready for a day on the calendar: the list, the aim, how you feel, and last time's lesson. */
function PrepSheet({ spec }: { spec: SheetSpec }) {
  const today = ltToday();
  const st = data.get();
  const key = spec.key as string;
  const day = stageDays(st, today).find((u) => u.key === key);
  const prev = prepFor(st, key);
  const [ticks, setTicks] = useState<string[]>(prev?.ticks ?? []);
  const [goal, setGoal] = useState(prev?.goal ?? '');
  const [ready, setReady] = useState<number | null>(prev?.ready ?? null);
  const [nerves, setNerves] = useState<number | null>(prev?.nerves ?? null);
  const [predict, setPredict] = useState(prev?.predict != null ? String(prev.predict) : '');
  if (!day) {
    return (
      <Sheet title="Get ready" onClose={closeSheet}>
        <p className="i-note">That day isn’t on the calendar any more.</p>
      </Sheet>
    );
  }
  const list = PREP[day.type];
  const last = lastNote(showsIn(st), day.type, day.date);
  const left = dayCount(today, day.date) - 1;
  const save = () => {
    const p = Number(predict);
    savePrep(key, { ticks, goal, ready, nerves, predict: predict.trim() && p >= 0 && p <= 100 ? Math.round(p) : null });
    closeSheet();
  };
  return (
    <Sheet
      title={day.title}
      onClose={closeSheet}
      footer={
        <>
          {day.date <= today && day.type !== 'maths' && (
            <button type="button" className="i-btn" onClick={() => (save(), openSheet({ type: 'stage-log', kind: day.type, event: key, date: day.date, title: day.title }))}>
              How did it go?
            </button>
          )}
          <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={save}>
            Save
          </button>
        </>
      }
    >
      <p className="i-note">
        {STAGE_TYPES[day.type].one} · {longDay(day.date)}
        {day.start ? ` at ${day.start}` : ''} · {left > 1 ? `${left} days to go` : left === 1 ? 'tomorrow' : left === 0 ? 'today' : 'done'}
      </p>
      {last && (
        <p className="stg-last">
          Last time you told yourself: <q>{last.next}</q>
        </p>
      )}
      <div className="i-field">
        <span className="i-lab">
          Ready list · {ticks.filter((t) => list.some((x) => x.id === t)).length}/{list.length}
        </span>
        <div className="stg-checks" role="group" aria-label="Ready list">
          {list.map((x) => {
            const on = ticks.includes(x.id);
            return (
              <button key={x.id} type="button" role="checkbox" aria-checked={on} className="stg-check" onClick={() => setTicks(on ? ticks.filter((t) => t !== x.id) : [...ticks, x.id])}>
                <i aria-hidden="true">{on ? '✓' : ''}</i>
                {x.t}
              </button>
            );
          })}
        </div>
      </div>
      <Field label="What you’re aiming for · optional">
        <input className="i-input" value={goal} onChange={(e) => setGoal(e.target.value)} maxLength={600} placeholder={day.type === 'test' ? 'Finish with ten minutes to check' : day.type === 'violin' ? 'Enjoy the slow movement' : 'Stay calm after a lost point'} />
      </Field>
      {(day.type === 'test' || day.type === 'maths') && (
        <Field label="Your guess (%) · optional">
          <input className="i-input" inputMode="numeric" value={predict} onChange={(e) => setPredict(e.target.value.replace(/\D/g, ''))} placeholder="Guess before, see how close you were after" />
        </Field>
      )}
      <Scale label="Ready" value={ready} onChange={setReady} words={READY} />
      <Scale label="Nerves" value={nerves} onChange={setNerves} words={NERVES} />
    </Sheet>
  );
}

registerSheet('stage-pick', PickSheet);
registerSheet('stage-log', LogSheet);
registerSheet('stage-plan', PlanSheet);
registerSheet('stage-prep', PrepSheet);
