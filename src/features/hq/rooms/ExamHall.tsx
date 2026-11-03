/** 模試: a mock exam under real timings. Tap as you finish each question; afterwards see which one ate your time. */
import { useEffect, useState } from 'react';
import { openSheet } from '../../../app/sheets';
import { prefValue, useToday } from '../../../data/lt';
import { saveRecord } from '../../../data/records';
import { data } from '../../../data/store';
import { toast } from '../../../data/ui';
import { clockText, mockPace, mockReview, MOCK_PRESETS, type MockPreset, type MockRun } from '../../../domain/hq/drills';
import { shortDay } from '../../../domain/log/dates';
import { useStore } from '../../../lib/createStore';
import { H2, Picks } from '../../../ui/i/bits';
import { subjectsOf } from '../../study/model';
import { RoomHead } from '../HqView';
import { saveMock, useHq } from '../store';

const KEY = 'lifetracker-mock';
const load = (): MockRun | null => {
  try {
    const m = JSON.parse(localStorage.getItem(KEY) ?? 'null') as MockRun | null;
    return m && typeof m.startedAt === 'number' && Array.isArray(m.marks) ? m : null;
  } catch {
    return null;
  }
};
const keep = (m: MockRun | null) => {
  try {
    if (m) localStorage.setItem(KEY, JSON.stringify(m));
    else localStorage.removeItem(KEY);
  } catch {
    /* lasts for this visit */
  }
};

/** Keep the screen on during a paper, where the phone allows it. */
function useWakeLock(on: boolean) {
  useEffect(() => {
    if (!on) return;
    let lock: { release: () => Promise<void> } | null = null;
    let live = true;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } };
    nav.wakeLock
      ?.request('screen')
      .then((l) => {
        if (live) lock = l;
        else void l.release();
      })
      .catch(() => {
        /* not allowed: the clock still runs */
      });
    return () => {
      live = false;
      void lock?.release();
    };
  }, [on]);
}

function Clock({ run, onEnd }: { run: MockRun; onEnd: (r: MockRun) => void }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  useWakeLock(true);
  const elapsed = (Date.now() - run.startedAt) / 1000;
  const p = mockPace(run, elapsed);
  const label = run.unit === 'marks' ? 'mark' : run.unit === 'problems' ? 'problem' : 'question';
  const stepMarks = run.unit === 'marks' ? 5 : 1;
  const step = () => {
    const at = Math.round(elapsed);
    const next = { ...run, marks: [...run.marks, ...Array.from({ length: stepMarks }, () => at)] };
    keep(next);
    onEnd(next);
  };
  return (
    <section className={`ex-clock${p.over ? ' is-over' : p.lead < -1 ? ' is-behind' : ''}`} aria-label="Mock in progress">
      <span className="i-lab">{run.name}</span>
      <b className="ex-time i-mono" role="timer" aria-label={`${Math.ceil(p.left / 60)} minutes left`}>
        {p.over ? `+${clockText(-p.left)}` : clockText(p.left)}
      </b>
      <p className="ex-pace">
        {p.over ? 'Time’s up.' : `By now you’d be on ${label} ${Math.floor(p.shouldBe) + 1}.`} You’ve done <b>{p.done}</b> of {run.count}.
        {!p.over && p.done > 0 && (p.lead >= 0 ? ` ${Math.abs(p.lead)} ahead.` : ` ${Math.abs(p.lead)} behind.`)}
      </p>
      <button type="button" className="ex-next" onClick={step}>
        {run.unit === 'marks' ? '+5 marks done' : `${label[0].toUpperCase()}${label.slice(1)} ${p.done + 1} done`}
      </button>
      <button
        type="button"
        className="i-btn i-btn--block"
        onClick={() => {
          keep(null);
          // A negative start means it's over: the seconds it took.
          onEnd({ ...run, startedAt: -Math.max(1, Math.round(elapsed)) });
        }}
      >
        Finish the paper
      </button>
    </section>
  );
}

function Review({ run, seconds, onDone }: { run: MockRun; seconds: number; onDone: () => void }) {
  const today = useToday();
  const st = useStore(data, (s) => s);
  const subjects = subjectsOf(prefValue(st, 'study_subjects'));
  const [subject, setSubject] = useState(subjects[0]);
  const [score, setScore] = useState('');
  const [outOf, setOutOf] = useState(String(run.count));
  const r = mockReview(run);
  const minutes = Math.max(1, Math.round(seconds / 60));
  const s = score === '' ? null : Number(score);
  const o = Number(outOf);
  const valid = s == null || (o > 0 && s >= 0 && s <= o);
  const save = () => {
    saveMock({ name: run.name, date: today, minutes, count: run.count, unit: run.unit, done: run.marks.length, score: s, outOf: s == null ? null : o, slowest: r.slowest?.n ?? null, slowestSec: r.slowest?.seconds ?? null });
    if (run.section === 'study' && s != null) saveRecord('study', 'study_mark', { subject, title: run.name, score: s, outOf: o, date: today });
    onDone();
    openSheet({ type: run.section, minutes });
    toast('Mock saved. Log the time if you’d like it to count.');
  };
  return (
    <section className="i-pnl i-stack" aria-label="How it went">
      <p className="hq-verdict">
        {run.marks.length} of {run.count} in {clockText(seconds)}.
        {r.slowest && run.unit !== 'marks' && ` Number ${r.slowest.n} took longest: ${clockText(r.slowest.seconds)}, against a fair share of ${clockText(r.fair)}.`}
      </p>
      {r.sinks.length > 0 && run.unit !== 'marks' && <p className="i-note">Over twice the fair share: {r.sinks.join(', ')}. In the real thing, these are the ones to skip and come back to.</p>}
      {run.unit !== 'marks' && r.each.length > 1 && (
        <div className="ex-times" role="img" aria-label="Time on each question">
          {r.each.map((v, i) => (
            <i key={i} style={{ height: `${Math.min(100, (v / Math.max(...r.each)) * 100)}%` }} className={v > r.fair * 2 ? 'is-sink' : ''} />
          ))}
        </div>
      )}
      <div className="sc-add">
        <label className="i-field" style={{ flex: 1 }}>
          <span className="i-lab">Score (optional)</span>
          <input className="i-input" inputMode="numeric" value={score} onChange={(e) => setScore(e.target.value.replace(/\D/g, ''))} />
        </label>
        <label className="i-field" style={{ flex: 1 }}>
          <span className="i-lab">Out of</span>
          <input className="i-input" inputMode="numeric" value={outOf} onChange={(e) => setOutOf(e.target.value.replace(/\D/g, ''))} />
        </label>
      </div>
      {run.section === 'study' && <Picks label="Subject, for your marks" value={subject} onChange={setSubject} options={subjects.map((x) => ({ id: x, label: x }))} />}
      <button type="button" className="i-btn i-btn--sig i-btn--block" disabled={!valid} onClick={save}>
        Save and log {minutes} min
      </button>
      <button type="button" className="i-link" onClick={onDone}>
        Throw this one away
      </button>
    </section>
  );
}

export function ExamRoom() {
  const today = useToday();
  const hq = useHq();
  const [run, setRun] = useState<MockRun | null>(load);
  const [ended, setEnded] = useState<{ run: MockRun; seconds: number } | null>(null);
  const [custom, setCustom] = useState('60');
  const [customCount, setCustomCount] = useState('20');
  const start = (p: MockPreset) => {
    const r: MockRun = { name: p.name, minutes: p.minutes, count: p.count, unit: p.unit, section: p.section, startedAt: Date.now(), marks: [] };
    keep(r);
    setRun(r);
  };
  const onEnd = (r: MockRun) => {
    if (r.startedAt < 0) {
      setRun(null);
      setEnded({ run: { ...r, startedAt: 0 }, seconds: -r.startedAt });
    } else setRun(r);
  };
  return (
    <div>
      <RoomHead room="exam" />
      {run ? (
        <Clock run={run} onEnd={onEnd} />
      ) : ended ? (
        <Review run={ended.run} seconds={ended.seconds} onDone={() => setEnded(null)} />
      ) : (
        <>
          <p className="i-note">Timed practice under real conditions, with one tap per question, so you find out where the time went. The clock keeps going if you lock the phone.</p>
          <div className="i-pnl i-pnl--flush">
            {MOCK_PRESETS.map((p) => (
              <button key={p.id} type="button" className="i-row" onClick={() => start(p)}>
                <span className="i-row__t">
                  <b>{p.name}</b>
                  <small>{p.note}</small>
                </span>
                <span className="i-row__n">
                  {p.minutes}m<small style={{ display: 'block', fontSize: 11 }}>{p.count} {p.unit}</small>
                </span>
              </button>
            ))}
          </div>
          <H2>My own</H2>
          <div className="sc-add">
            <label className="i-field" style={{ flex: 1 }}>
              <span className="i-lab">Minutes</span>
              <input className="i-input" inputMode="numeric" value={custom} onChange={(e) => setCustom(e.target.value.replace(/\D/g, ''))} />
            </label>
            <label className="i-field" style={{ flex: 1 }}>
              <span className="i-lab">Questions</span>
              <input className="i-input" inputMode="numeric" value={customCount} onChange={(e) => setCustomCount(e.target.value.replace(/\D/g, ''))} />
            </label>
          </div>
          <button type="button" className="i-btn i-btn--block" disabled={!(Number(custom) > 0 && Number(customCount) > 0)} onClick={() => start({ id: 'custom', name: `${custom}-minute paper`, minutes: Number(custom), count: Number(customCount), unit: 'questions', section: 'study', note: '' })}>
            Start my own
          </button>
          {hq.mocks.length > 0 && (
            <>
              <H2>Past papers</H2>
              <div className="i-pnl i-pnl--flush">
                {hq.mocks.slice(0, 12).map((m) => (
                  <div key={m.id} className="i-row">
                    <span className="i-row__t">
                      <b>{m.name}</b>
                      <small>
                        {shortDay(m.date, today)} · {m.minutes} min · {m.done}/{m.count}
                        {m.slowest && m.unit !== 'marks' ? ` · slowest no. ${m.slowest}` : ''}
                      </small>
                    </span>
                    {m.score != null && <span className="i-row__n">{m.score}/{m.outOf}</span>}
                  </div>
                ))}
              </div>
            </>
          )}
          <p className="i-note" style={{ marginTop: 10 }}>Timings are the usual published formats. Always check the current rules with the exam board or test maker.</p>
        </>
      )}
    </div>
  );
}
