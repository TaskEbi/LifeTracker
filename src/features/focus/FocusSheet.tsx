import { useEffect, useState, type CSSProperties } from 'react';
import { registerSheet } from '../../app/sheetRegistry';
import { closeSheet, openSheet, useSheet } from '../../app/sheets';
import { sectionEntries } from '../../data/lt';
import { data } from '../../data/store';
import { sectionInfo } from '../../domain/sections';
import { useStore } from '../../lib/createStore';
import { accent, Chips } from '../../ui/i/bits';
import { Sheet } from '../../ui/i/Sheet';
import { discardFocus, elapsedSec, finishFocus, FOCUS_GOALS, FOCUS_SECTIONS, pauseFocus, resumeFocus, startFocus, useFocus, type Focus, type FocusSection } from './focus';
import './focus.css';

const pad2 = (n: number) => String(n).padStart(2, '0');
const clock = (sec: number) => (sec >= 3600 ? `${Math.floor(sec / 3600)}:${pad2(Math.floor((sec % 3600) / 60))}:${pad2(sec % 60)}` : `${pad2(Math.floor(sec / 60))}:${pad2(sec % 60)}`);

/** Re-render once a second while the clock runs. */
function useTick(on: boolean) {
  const [, set] = useState(0);
  useEffect(() => {
    if (!on) return;
    const t = setInterval(() => set((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [on]);
}

/** Buzz once when the goal is reached (phones that allow it). */
function useGoalBuzz(f: Focus | null, sec: number) {
  const [buzzed, setBuzzed] = useState(false);
  const hit = !!f?.goal && sec >= f.goal * 60;
  useEffect(() => {
    if (hit && !buzzed && f?.startedAt) {
      setBuzzed(true);
      try {
        navigator.vibrate?.([120, 80, 120]);
      } catch {
        /* not supported */
      }
    }
    if (!hit && buzzed) setBuzzed(false);
  }, [hit, buzzed, f?.startedAt]);
  return hit;
}

const logIt = (f: Focus) => openSheet({ type: f.section, minutes: f.minutes });

function Ring({ f, sec, hit }: { f: Focus; sec: number; hit: boolean }) {
  const r = 84;
  const len = 2 * Math.PI * r;
  const pct = f.goal ? Math.min(1, sec / (f.goal * 60)) : (sec % 60) / 60;
  const running = !!f.startedAt;
  return (
    <div className={`fo-ring${running ? ' is-run' : ''}${hit ? ' is-hit' : ''}`}>
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <circle cx="100" cy="100" r={r} className="fo-ring__track" />
        <circle cx="100" cy="100" r={r} className="fo-ring__fill" strokeDasharray={len} strokeDashoffset={len * (1 - pct)} transform="rotate(-90 100 100)" />
        {Array.from({ length: 12 }, (_, i) => (
          <line key={i} x1="100" y1="8" x2="100" y2="16" className="fo-ring__tick" transform={`rotate(${i * 30} 100 100)`} />
        ))}
      </svg>
      <div className="fo-ring__c">
        <span className="fo-ring__k" aria-hidden="true">
          {sectionInfo(f.section).kanji}
        </span>
        <b className="fo-ring__t" role="timer" aria-label={`Focus time ${Math.floor(sec / 60)} minutes`}>
          {clock(sec)}
        </b>
        <small>{f.finishedAt ? 'Finished' : !running ? 'Paused' : hit ? 'Goal reached!' : f.goal ? `Goal ${f.goal} min` : 'Open session'}</small>
      </div>
    </div>
  );
}

function FocusSheet() {
  const f = useFocus();
  const [section, setSection] = useState<FocusSection>('study');
  const [goal, setGoal] = useState<string>('25');
  const [asking, setAsking] = useState(false);
  useTick(!!f?.startedAt);
  const sec = f ? elapsedSec(f) : 0;
  const hit = useGoalBuzz(f, sec);

  if (!f) {
    return (
      <Sheet
        title="集中 · Focus mode"
        onClose={closeSheet}
        accent={section}
        footer={
          <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={() => startFocus(section, goal === 'open' ? null : Number(goal))}>
            Start focus
          </button>
        }
      >
        <p className="i-note">A timer for one session. It keeps running if you close this or lock the phone; when you finish, the minutes go into that section's log sheet for you to save.</p>
        <Chips label="Section" value={section} onChange={setSection} options={FOCUS_SECTIONS.map((s) => ({ id: s, label: sectionInfo(s).name, c: s }))} />
        <Chips label="Goal" value={goal} onChange={setGoal} options={[...FOCUS_GOALS.map((g) => ({ id: String(g), label: `${g} min` })), { id: 'open', label: 'Open' }]} />
      </Sheet>
    );
  }

  const name = sectionInfo(f.section).name;
  return (
    <Sheet
      title={`集中 · ${name} focus`}
      onClose={closeSheet}
      accent={f.section}
      footer={
        f.finishedAt ? (
          <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={() => logIt(f)}>
            Log {f.minutes} min of {name.toLowerCase()}
          </button>
        ) : (
          <>
            {f.startedAt ? (
              <button type="button" className="i-btn" onClick={pauseFocus}>
                Pause
              </button>
            ) : (
              <button type="button" className="i-btn" onClick={resumeFocus}>
                Resume
              </button>
            )}
            <button
              type="button"
              className="i-btn i-btn--sig i-btn--block"
              onClick={() => {
                const done = finishFocus();
                if (done) logIt(done);
              }}
            >
              Finish and log
            </button>
          </>
        )
      }
    >
      <div style={accent(f.section)}>
        <Ring f={f} sec={sec} hit={hit} />
      </div>
      {f.finishedAt && <p className="i-note">Nothing is saved until you save the session. It waits here until then.</p>}
      {!f.finishedAt && hit && <p className="i-note fo-hit">Goal cleared. Keep going or finish now — every minute counts.</p>}
      <div className="fo-discard">
        {asking ? (
          <>
            <span className="i-note">Discard this focus? No time is logged.</span>
            <button
              type="button"
              className="i-btn i-btn--sm i-btn--danger"
              onClick={() => {
                discardFocus();
                setAsking(false);
              }}
            >
              Discard
            </button>
            <button type="button" className="i-btn i-btn--sm" onClick={() => setAsking(false)}>
              Keep
            </button>
          </>
        ) : (
          <button type="button" className="i-link" onClick={() => setAsking(true)}>
            Discard focus…
          </button>
        )}
      </div>
    </Sheet>
  );
}

registerSheet('focus', FocusSheet);

/**
 * The running focus, floating above the command bar on every page. Once a session is saved in that
 * section after the focus finished, the waiting minutes are cleared.
 */
export function FocusPill() {
  const f = useFocus();
  const sheet = useSheet();
  const entries = useStore(data, (s) => s.log_entries);
  useTick(!!f?.startedAt);
  useEffect(() => {
    if (!f?.finishedAt) return;
    const since = new Date(f.finishedAt).toISOString();
    if (sectionEntries(data.get(), f.section).some((e) => e.entry.created_at >= since)) discardFocus();
  }, [entries, f]);
  if (!f || sheet?.type === 'focus') return null;
  const sec = elapsedSec(f);
  const hit = !!f.goal && sec >= f.goal * 60;
  const info = sectionInfo(f.section);
  const text = f.finishedAt ? `Log ${f.minutes} min` : clock(sec);
  return (
    <button
      type="button"
      className={`fo-pill${f.startedAt ? ' is-run' : ''}${hit ? ' is-hit' : ''}${f.finishedAt ? ' is-done' : ''}`}
      style={{ '--c': `var(--c-${f.section})` } as CSSProperties}
      onClick={() => (f.finishedAt ? logIt(f) : openSheet({ type: 'focus' }))}
      aria-label={f.finishedAt ? `Log ${f.minutes} minutes of ${info.name.toLowerCase()} from focus` : `${info.name} focus: ${Math.floor(sec / 60)} minutes${f.startedAt ? '' : ', paused'}. Open`}
    >
      <span className="fo-pill__k" aria-hidden="true">
        {info.kanji}
      </span>
      <b>{text}</b>
      {!f.finishedAt && <small>{f.startedAt ? (hit ? 'Goal!' : 'Focus') : 'Paused'}</small>}
    </button>
  );
}
