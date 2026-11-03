/**
 * The practice room, /violin/room: a metronome, a tuner, a drone to tune against, a mirror to hear
 * yourself back, and tempo ladders for bringing a passage up to speed. Sound is generated here and
 * the mic is only used while the tuner or mirror is on; nothing recorded is kept or sent anywhere.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { registerSheet } from '../../app/sheetRegistry';
import { closeSheet, openSheet, type SheetSpec } from '../../app/sheets';
import { navigate } from '../../app/router';
import { prefValue, sectionRecords, setPref, useToday } from '../../data/lt';
import { deleteRecord, saveRecord } from '../../data/records';
import { data } from '../../data/store';
import { detectPitch, freqOfMidi, ladderStatus, logTempo, midiName, nearestNote, tapTempo, VIOLIN_STRINGS, type Ladder, type Tuned } from '../../domain/hq/pitch';
import { shortDay } from '../../domain/log/dates';
import { useStore } from '../../lib/createStore';
import { accent, Chips, H2, Source, Stepper } from '../../ui/i/bits';
import { ChannelHead } from '../../ui/i/ChannelHead';
import { Icon } from '../../ui/i/Icon';
import { Sheet } from '../../ui/i/Sheet';
import { ViolinArt } from './Art';
import './practice.css';

let shared: AudioContext | null = null;
function audio(): AudioContext {
  if (!shared) shared = new (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  void shared.resume();
  return shared;
}

// ─── metronome ──────────────────────────────────────────────────────────────

function Metronome({ bpm, setBpm }: { bpm: number; setBpm: (n: number) => void }) {
  const [on, setOn] = useState(false);
  const [beats, setBeats] = useState('4');
  const [sub, setSub] = useState('1');
  const [beat, setBeat] = useState(-1);
  const taps = useRef<number[]>([]);
  const cfg = useRef({ bpm, beats: 4, sub: 1 });
  cfg.current = { bpm, beats: Number(beats), sub: Number(sub) };
  useEffect(() => {
    if (!on) return;
    let ctx: AudioContext;
    try {
      ctx = audio();
    } catch {
      setOn(false);
      return;
    }
    // A short look-ahead on the audio clock, so a busy page never makes it drift.
    let next = ctx.currentTime + 0.06;
    let n = 0;
    const visual: number[] = [];
    const tick = () => {
      while (next < ctx.currentTime + 0.14) {
        const { bpm: b, beats: bs, sub: s } = cfg.current;
        const perBar = bs * s;
        const i = n % perBar;
        const main = i % s === 0;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.frequency.value = i === 0 ? 1560 : main ? 1040 : 720;
        g.gain.setValueAtTime(main ? 0.5 : 0.22, next);
        g.gain.exponentialRampToValueAtTime(0.001, next + 0.04);
        osc.connect(g).connect(ctx.destination);
        osc.start(next);
        osc.stop(next + 0.05);
        if (main) {
          const at = (next - ctx.currentTime) * 1000;
          const which = i / s;
          visual.push(window.setTimeout(() => setBeat(which), at));
        }
        next += 60 / b / s;
        n++;
      }
    };
    const t = window.setInterval(tick, 25);
    tick();
    return () => {
      window.clearInterval(t);
      visual.forEach((v) => window.clearTimeout(v));
      setBeat(-1);
    };
  }, [on]);
  const tap = () => {
    taps.current = [...taps.current.slice(-7), performance.now()];
    const v = tapTempo(taps.current);
    if (v) setBpm(v);
  };
  return (
    <div className="pr-metro">
      <div className="pr-metro__dots" aria-hidden="true">
        {Array.from({ length: Number(beats) }, (_, i) => (
          <i key={i} className={`${beat === i ? 'is-on' : ''}${i === 0 ? ' is-first' : ''}`} />
        ))}
      </div>
      <div className="pr-metro__row">
        <button type="button" className="pr-step" onClick={() => setBpm(Math.max(20, bpm - 4))} aria-label="4 beats a minute slower">
          −4
        </button>
        <output className="pr-bpm" aria-live="off">
          <b>{bpm}</b>
          <small>BPM</small>
        </output>
        <button type="button" className="pr-step" onClick={() => setBpm(Math.min(300, bpm + 4))} aria-label="4 beats a minute faster">
          +4
        </button>
      </div>
      <input type="range" className="pr-range" min={20} max={240} value={Math.min(240, bpm)} onChange={(e) => setBpm(Number(e.target.value))} aria-label="Tempo" />
      <Chips label="Beats in a bar" value={beats} onChange={setBeats} options={['2', '3', '4', '5', '6'].map((b) => ({ id: b, label: `${b}/4` }))} />
      <Chips
        label="Subdivision"
        value={sub}
        onChange={setSub}
        options={[
          { id: '1', label: '♩' },
          { id: '2', label: '♪♪' },
          { id: '3', label: 'triplets' },
          { id: '4', label: '♬♬' },
        ]}
      />
      <div className="pr-metro__acts">
        <button type="button" className="i-btn" onClick={tap}>
          Tap tempo
        </button>
        <button type="button" className="i-btn i-btn--sig i-btn--block" aria-pressed={on} onClick={() => setOn(!on)}>
          {on ? 'Stop' : 'Start'}
        </button>
      </div>
    </div>
  );
}

// ─── drone ──────────────────────────────────────────────────────────────────

const DRONE_NOTES = [55, 57, 59, 60, 62, 64, 65, 67, 69];

function Drone({ a4 }: { a4: number }) {
  const [midi, setMidi] = useState<number | null>(null);
  const [fifth, setFifth] = useState(false);
  useEffect(() => {
    if (midi == null) return;
    let ctx: AudioContext;
    try {
      ctx = audio();
    } catch {
      setMidi(null);
      return;
    }
    const master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 0.25);
    master.connect(ctx.destination);
    const oscs = [midi, midi - 12, ...(fifth ? [midi + 7] : [])].map((m, i) => {
      const o = ctx.createOscillator();
      o.type = i === 0 ? 'sawtooth' : 'triangle';
      o.frequency.value = freqOfMidi(m, a4);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1400;
      o.connect(lp).connect(master);
      o.start();
      return o;
    });
    return () => {
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(0, t + 0.15);
      oscs.forEach((o) => o.stop(t + 0.2));
    };
  }, [midi, fifth, a4]);
  return (
    <div className="i-stack">
      <p className="i-note">Play scales and double stops against a held note. Your ear hears the beats when you’re out of tune with it.</p>
      <div className="pr-notes" role="group" aria-label="Drone note">
        {DRONE_NOTES.map((m) => (
          <button key={m} type="button" className="pr-note" aria-pressed={midi === m} onClick={() => setMidi(midi === m ? null : m)}>
            {midiName(m).replace(/\d/, '')}
          </button>
        ))}
      </div>
      <label className="i-toggle" style={{ cursor: 'pointer' }}>
        <span>Add the fifth</span>
        <input type="checkbox" checked={fifth} onChange={(e) => setFifth(e.target.checked)} aria-label="Add the fifth" />
      </label>
    </div>
  );
}

// ─── tuner ──────────────────────────────────────────────────────────────────

function useMic(on: boolean, onFail: (msg: string) => void) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  useEffect(() => {
    if (!on) return;
    let live = true;
    let got: MediaStream | null = null;
    if (!navigator.mediaDevices?.getUserMedia) {
      onFail('This browser can’t use the microphone here.');
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } })
      .then((s) => {
        if (!live) return s.getTracks().forEach((t) => t.stop());
        got = s;
        setStream(s);
      })
      .catch(() => onFail('The microphone wasn’t allowed. Check the permission for this site and try again.'));
    return () => {
      live = false;
      got?.getTracks().forEach((t) => t.stop());
      setStream(null);
    };
  }, [on]);
  return stream;
}

function Tuner({ a4, setA4 }: { a4: number; setA4: (n: number) => void }) {
  const [on, setOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<Tuned | null>(null);
  const stream = useMic(on, (m) => {
    setError(m);
    setOn(false);
  });
  useEffect(() => {
    if (!stream) return;
    const ctx = audio();
    const source = ctx.createMediaStreamSource(stream);
    const an = ctx.createAnalyser();
    an.fftSize = 4096;
    source.connect(an);
    const buf = new Float32Array(an.fftSize);
    let raf = 0;
    let last = 0;
    const smooth: number[] = [];
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (t - last < 90) return;
      last = t;
      an.getFloatTimeDomainData(buf);
      const hz = detectPitch(buf, ctx.sampleRate);
      if (hz == null) {
        smooth.length = 0;
        setNote(null);
        return;
      }
      smooth.push(hz);
      if (smooth.length > 4) smooth.shift();
      const sorted = [...smooth].sort((a, b) => a - b);
      setNote(nearestNote(sorted[Math.floor(sorted.length / 2)], a4));
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      source.disconnect();
    };
  }, [stream, a4]);
  const cents = note?.cents ?? 0;
  const inTune = note && Math.abs(cents) <= 5;
  const string = note ? VIOLIN_STRINGS.find((s) => s.midi === note.midi) : null;
  return (
    <div className="i-stack">
      <div className={`pr-tuner${inTune ? ' is-tune' : ''}`} role="status" aria-label={note ? `${note.name}, ${cents > 0 ? `${cents} cents sharp` : cents < 0 ? `${-cents} cents flat` : 'in tune'}` : 'No note'}>
        <div className="pr-tuner__note">{note ? note.name : on ? '…' : '—'}</div>
        <div className="pr-tuner__scale" aria-hidden="true">
          <span>♭</span>
          <i className="pr-tuner__zero" />
          {note && <i className="pr-tuner__needle" style={{ '--x': `${50 + Math.max(-50, Math.min(50, cents))}%` } as CSSProperties} />}
          <span>♯</span>
        </div>
        <small>{note ? `${cents > 0 ? '+' : ''}${cents} cents · ${note.freq.toFixed(1)} Hz${string ? ` · open ${string.name} string` : ''}` : on ? 'Play a note' : 'Uses the microphone while it’s on'}</small>
      </div>
      {error && (
        <p className="i-error" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        className="i-btn i-btn--sig i-btn--block"
        aria-pressed={on}
        onClick={() => {
          setError(null);
          setOn(!on);
        }}
      >
        {on ? 'Stop the tuner' : 'Start the tuner'}
      </button>
      <div className="i-kv">
        <span>Concert pitch</span>
        <Stepper value={`A = ${a4}`} label="concert pitch" onStep={(s) => setA4(Math.max(430, Math.min(450, a4 + s)))} />
      </div>
    </div>
  );
}

// ─── mirror ─────────────────────────────────────────────────────────────────

/** Record a passage, hear it straight back, gone when you leave. */
function Mirror() {
  const [state, setState] = useState<'idle' | 'on' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [secs, setSecs] = useState(0);
  const stream = useMic(state === 'on', (m) => {
    setError(m);
    setState('idle');
  });
  const rec = useRef<MediaRecorder | null>(null);
  useEffect(() => {
    if (!stream) return;
    if (typeof MediaRecorder === 'undefined') {
      setError('This browser can’t record audio.');
      setState('idle');
      return;
    }
    const chunks: Blob[] = [];
    const r = new MediaRecorder(stream);
    rec.current = r;
    r.ondataavailable = (e) => chunks.push(e.data);
    r.onstop = () => setUrl(URL.createObjectURL(new Blob(chunks, { type: r.mimeType })));
    r.start();
    const start = Date.now();
    const t = window.setInterval(() => setSecs(Math.floor((Date.now() - start) / 1000)), 500);
    return () => {
      window.clearInterval(t);
      if (r.state !== 'inactive') r.stop();
    };
  }, [stream]);
  useEffect(() => () => void (url && URL.revokeObjectURL(url)), [url]);
  return (
    <div className="i-stack">
      <p className="i-note">You don’t hear what the audience hears. Record a passage and listen back. It stays on this page and disappears when you leave.</p>
      {state === 'on' && (
        <p className="pr-rec" role="status">
          <i aria-hidden="true" /> Recording · {secs}s
        </p>
      )}
      {url && state !== 'on' && <audio controls src={url} className="pr-audio" aria-label="What you just played" />}
      {error && (
        <p className="i-error" role="alert">
          {error}
        </p>
      )}
      {state === 'on' ? (
        <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={() => setState('done')}>
          Stop and listen
        </button>
      ) : (
        <button
          type="button"
          className="i-btn i-btn--block"
          onClick={() => {
            setError(null);
            setUrl(null);
            setSecs(0);
            setState('on');
          }}
        >
          {url ? 'Record again' : 'Record'}
        </button>
      )}
    </div>
  );
}

// ─── tempo ladders ──────────────────────────────────────────────────────────

const ladderOf = (r: { id: string; data: Record<string, unknown> }): Ladder => ({
  id: r.id,
  name: typeof r.data.name === 'string' ? r.data.name : 'Passage',
  goal: typeof r.data.goal === 'number' ? r.data.goal : 120,
  log: Array.isArray(r.data.log) ? (r.data.log as Ladder['log']) : [],
});

function LadderSheet({ spec }: { spec: SheetSpec }) {
  const prev = spec.editId ? data.get().lt_records.get(spec.editId as string) : undefined;
  const l = prev ? ladderOf(prev) : null;
  const [name, setName] = useState(l?.name ?? '');
  const [goal, setGoal] = useState(String(l?.goal ?? 120));
  const g = Number(goal);
  return (
    <Sheet
      title={l ? 'Edit tempo ladder' : 'New tempo ladder'}
      onClose={closeSheet}
      accent="violin"
      footer={
        <>
          {l && (
            <button type="button" className="i-btn i-btn--danger" onClick={() => (deleteRecord(l.id, 'Ladder deleted'), closeSheet())}>
              Delete
            </button>
          )}
          <button type="button" className="i-btn i-btn--sig i-btn--block" disabled={!name.trim() || !(g >= 20 && g <= 300)} onClick={() => (saveRecord('violin', 'tempo_ladder', { name: name.trim().slice(0, 80), goal: g, log: l?.log ?? [] }, l?.id), closeSheet())}>
            Save
          </button>
        </>
      }
    >
      <label className="i-field">
        <span className="i-lab">Which passage?</span>
        <input data-autofocus className="i-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bach Partita 3, bars 17–32" maxLength={80} />
      </label>
      <label className="i-field">
        <span className="i-lab">Performance tempo (BPM)</span>
        <input className="i-input" inputMode="numeric" value={goal} onChange={(e) => setGoal(e.target.value.replace(/\D/g, ''))} />
      </label>
    </Sheet>
  );
}
registerSheet('violin-ladder', LadderSheet);

function LadderCard({ l, today, setBpm }: { l: Ladder; today: string; setBpm: (n: number) => void }) {
  const s = ladderStatus(l);
  const W = 200;
  const H = 40;
  const points = l.log.slice(-20);
  const lo = Math.min(l.goal * 0.5, ...points.map((p) => p.bpm));
  const y = (v: number) => H - 3 - ((v - lo) / (l.goal - lo || 1)) * (H - 6);
  const x = (i: number) => (points.length < 2 ? W / 2 : 3 + (i / (points.length - 1)) * (W - 6));
  const mark = (bpm: number) => {
    saveRecord('violin', 'tempo_ladder', { name: l.name, goal: l.goal, log: logTempo(l.log, today, bpm) }, l.id);
    setBpm(Math.min(l.goal, bpm + Math.max(2, Math.round(bpm * 0.04))));
  };
  return (
    <article className="pr-ladder">
      <button type="button" className="pr-ladder__h" onClick={() => openSheet({ type: 'violin-ladder', editId: l.id })}>
        <b>{l.name}</b>
        <small>
          {s.best != null ? `Clean at ${s.best} of ${l.goal} BPM` : `Goal ${l.goal} BPM`}
          {s.perWeek != null && s.perWeek > 0 ? ` · +${Math.round(s.perWeek)} a week` : ''}
          {l.log.length ? ` · last ${shortDay(l.log[l.log.length - 1].date, today)}` : ''}
        </small>
      </button>
      {points.length > 0 && (
        <svg className="pr-ladder__chart" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          <line x1="0" x2={W} y1={y(l.goal)} y2={y(l.goal)} className="pr-ladder__goal" />
          {points.length > 1 && <polyline points={points.map((p, i) => `${x(i)},${y(p.bpm)}`).join(' ')} className="pr-ladder__line" />}
          {points.map((p, i) => (
            <circle key={p.date} cx={x(i)} cy={y(p.bpm)} r="2.4" className="pr-ladder__pt" />
          ))}
        </svg>
      )}
      <div className="pr-ladder__acts">
        <button type="button" className="i-btn i-btn--sm" onClick={() => setBpm(s.next)}>
          Set metronome to {s.next}
        </button>
        <button type="button" className="i-btn i-btn--sm i-btn--sig" onClick={() => mark(s.next)}>
          Clean at {s.next}
        </button>
      </div>
    </article>
  );
}

export function PracticeRoom() {
  const today = useToday();
  const st = useStore(data, (s) => s);
  const [bpm, setBpm] = useState(() => {
    try {
      return Number(localStorage.getItem('lt.violin.bpm')) || 72;
    } catch {
      return 72;
    }
  });
  const saveBpm = (n: number) => {
    setBpm(n);
    try {
      localStorage.setItem('lt.violin.bpm', String(n));
    } catch {
      /* remembered for this visit only */
    }
  };
  const a4 = typeof prefValue(st, 'violin_a4') === 'number' ? (prefValue(st, 'violin_a4') as number) : 442;
  const ladders = useMemo(() => sectionRecords(st, 'violin', 'tempo_ladder').map(ladderOf), [st]);
  const [tab, setTab] = useState<'metronome' | 'tuner' | 'drone' | 'mirror'>('metronome');
  return (
    <div style={accent('violin')}>
      <ChannelHead id="violin" sub="practice room" art={<ViolinArt />} />
      <button type="button" className="i-link" onClick={() => navigate('violin')}>
        ◀ Back to the journal
      </button>
      <Chips
        label="Tool"
        value={tab}
        onChange={setTab}
        options={[
          { id: 'metronome' as const, label: 'Metronome' },
          { id: 'tuner' as const, label: 'Tuner' },
          { id: 'drone' as const, label: 'Drone' },
          { id: 'mirror' as const, label: 'Mirror' },
        ]}
      />
      <div className="i-pnl pr-panel">
        {tab === 'metronome' && <Metronome bpm={bpm} setBpm={saveBpm} />}
        {tab === 'tuner' && <Tuner a4={a4} setA4={(n) => setPref('violin_a4', n)} />}
        {tab === 'drone' && <Drone a4={a4} />}
        {tab === 'mirror' && <Mirror />}
      </div>
      <Source kind="off">Sound is made on this device. The microphone only runs while the tuner or mirror is on, and nothing it hears is kept or sent.</Source>

      <H2 aside={<button type="button" className="i-link" onClick={() => openSheet({ type: 'violin-ladder' })}>+ New</button>}>Tempo ladders</H2>
      {ladders.length ? (
        <div className="pr-ladders">
          {ladders.map((l) => (
            <LadderCard key={l.id} l={l} today={today} setBpm={saveBpm} />
          ))}
        </div>
      ) : (
        <div className="i-pnl i-stack">
          <p className="i-note">Take a hard passage from slow to performance tempo in small, clean steps: set the metronome, play it clean, step up. The ladder remembers where you got to.</p>
          <button type="button" className="i-btn i-btn--sm" onClick={() => openSheet({ type: 'violin-ladder' })}>
            <Icon name="plus" size={16} /> Start a ladder
          </button>
        </div>
      )}
    </div>
  );
}
