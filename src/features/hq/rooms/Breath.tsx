/** 呼吸: guided breathing for before a contest, before going on stage, or in bed when your head won't stop. */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { BREATHS, breathAt } from '../../../domain/hq/body2';
import { Chips } from '../../../ui/i/bits';
import { RoomHead } from '../HqView';

const still = () => {
  try {
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

export function BreathRoom() {
  const [id, setId] = useState(BREATHS[0].id);
  const [length, setLength] = useState('2');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [done, setDone] = useState(false);
  const pattern = BREATHS.find((b) => b.id === id)!;
  const lastLabel = useRef('');
  useEffect(() => {
    if (startedAt == null) return;
    let raf = 0;
    const tick = () => {
      setNow(performance.now());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [startedAt]);
  const elapsed = startedAt == null ? 0 : Math.max(0, now - startedAt);
  const state = breathAt(pattern, elapsed);
  const total = Number(length) * 60_000;
  useEffect(() => {
    if (startedAt != null && elapsed >= total) {
      setStartedAt(null);
      setDone(true);
    }
  }, [elapsed, total, startedAt]);
  useEffect(() => {
    if (startedAt == null || state.label === lastLabel.current) return;
    lastLabel.current = state.label;
    try {
      navigator.vibrate?.(30);
    } catch {
      /* not supported */
    }
  }, [state.label, startedAt]);
  const running = startedAt != null;
  return (
    <div>
      <RoomHead room="breath" />
      {!running && (
        <>
          <Chips label="Pattern" value={id} onChange={setId} options={BREATHS.map((b) => ({ id: b.id, label: b.name }))} />
          <p className="i-note">{pattern.forWhat}.</p>
          <Chips label="How long" value={length} onChange={setLength} options={['1', '2', '5', '10'].map((m) => ({ id: m, label: `${m} min` }))} />
        </>
      )}
      <div className={`br-stage${running ? ' is-on' : ''}`} role="timer" aria-label={running ? `${state.label}, ${state.left} seconds` : 'Ready'}>
        <span className="br-circle" style={{ '--s': running && !still() ? 0.45 + state.fill * 0.55 : 0.7 } as CSSProperties} aria-hidden="true" />
        <span className="br-text">
          {running ? (
            <>
              <b>{state.label}</b>
              <span className="i-mono">{state.left}</span>
            </>
          ) : done ? (
            <b>That’s it. Carry on.</b>
          ) : (
            <b>Ready</b>
          )}
        </span>
      </div>
      {running ? (
        <button type="button" className="i-btn i-btn--block" onClick={() => setStartedAt(null)}>
          Stop
        </button>
      ) : (
        <button
          type="button"
          className="i-btn i-btn--sig i-btn--block"
          onClick={() => {
            setDone(false);
            const t = performance.now();
            setNow(t);
            setStartedAt(t);
          }}
        >
          {done ? 'Again' : 'Begin'}
        </button>
      )}
      <p className="i-note" style={{ marginTop: 10 }}>Slow breathing with a long breath out is a common way to settle nerves. If you feel light-headed, stop and breathe normally.</p>
    </div>
  );
}
