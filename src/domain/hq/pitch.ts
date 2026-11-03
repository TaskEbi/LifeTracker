/**
 * The maths behind the practice room: pitch detection by autocorrelation, cents from the nearest
 * note and the tempo ladder. No audio APIs here, so all of it can be tested.
 */

const NOTE_NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];

/** The four open strings, low to high (MIDI numbers). */
export const VIOLIN_STRINGS = [
  { name: 'G', midi: 55 },
  { name: 'D', midi: 62 },
  { name: 'A', midi: 69 },
  { name: 'E', midi: 76 },
];

export const freqOfMidi = (midi: number, a4: number) => a4 * 2 ** ((midi - 69) / 12);
export const midiName = (midi: number) => `${NOTE_NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;

export interface Tuned {
  midi: number;
  name: string;
  /** Sharp (+) or flat (−) of the nearest note. */
  cents: number;
  freq: number;
}

export function nearestNote(freq: number, a4: number): Tuned {
  const exact = 69 + 12 * Math.log2(freq / a4);
  const midi = Math.round(exact);
  return { midi, name: midiName(midi), cents: Math.round((exact - midi) * 100), freq };
}

/**
 * Fundamental frequency of a buffer by normalised autocorrelation, or null when it's too quiet or
 * has no clear pitch. Tuned for a violin: G3 (196 Hz) to well above E7.
 */
export function detectPitch(buf: Float32Array, sampleRate: number, minHz = 150, maxHz = 3200): number | null {
  const n = buf.length;
  let rms = 0;
  for (let i = 0; i < n; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / n);
  if (rms < 0.008) return null;
  const minLag = Math.max(2, Math.floor(sampleRate / maxHz));
  const maxLag = Math.min(n - 1, Math.ceil(sampleRate / minHz));
  const size = n - maxLag;
  if (size <= 0) return null;
  const corr = new Float32Array(maxLag + 1);
  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0;
    let a = 0;
    let b = 0;
    for (let i = 0; i < size; i++) {
      sum += buf[i] * buf[i + lag];
      a += buf[i] * buf[i];
      b += buf[i + lag] * buf[i + lag];
    }
    corr[lag] = a && b ? sum / Math.sqrt(a * b) : 0;
  }
  // The first strong peak, not the highest one: later peaks are multiples of the period.
  let best = -1;
  for (let lag = minLag + 1; lag < maxLag; lag++) {
    if (corr[lag] > 0.9 && corr[lag] >= corr[lag - 1] && corr[lag] >= corr[lag + 1]) {
      best = lag;
      break;
    }
  }
  if (best < 0) return null;
  // Between samples, for finer than one sample's resolution.
  const [l, c, r] = [corr[best - 1], corr[best], corr[best + 1]];
  const d = l + r - 2 * c;
  const shift = d ? (l - r) / (2 * d) : 0;
  return sampleRate / (best + shift);
}

/** Tap tempo: BPM from the last few taps (ms), ignoring a long gap as a fresh start. */
export function tapTempo(taps: number[]): number | null {
  const recent: number[] = [];
  for (let i = taps.length - 1; i >= 0 && recent.length < 6; i--) {
    if (recent.length && recent[recent.length - 1] - taps[i] > 2000) break;
    recent.push(taps[i]);
  }
  if (recent.length < 2) return null;
  const gap = (recent[0] - recent[recent.length - 1]) / (recent.length - 1);
  return Math.max(20, Math.min(300, Math.round(60000 / gap)));
}

export interface TempoLog {
  date: string;
  bpm: number;
}

export interface Ladder {
  id: string;
  /** What's being brought up to speed: a passage, or a piece. */
  name: string;
  goal: number;
  log: TempoLog[];
}

/** One clean run at this tempo: replaces today's mark rather than adding another. */
export function logTempo(log: TempoLog[], date: string, bpm: number): TempoLog[] {
  return [...log.filter((l) => l.date !== date), { date, bpm }].sort((a, b) => a.date.localeCompare(b.date));
}

export interface LadderStatus {
  /** The fastest clean tempo so far. */
  best: number | null;
  /** Where to set the metronome next: a small step up from the last clean run, at most the goal. */
  next: number;
  pct: number;
  /** Clean tempos gained per week, over the marks there are. */
  perWeek: number | null;
}

const DAY_MS = 86_400_000;

export function ladderStatus(l: Ladder): LadderStatus {
  const best = l.log.length ? Math.max(...l.log.map((x) => x.bpm)) : null;
  const last = l.log[l.log.length - 1]?.bpm ?? null;
  const next = last == null ? Math.max(30, Math.round(l.goal * 0.6)) : Math.min(l.goal, last + Math.max(2, Math.round(last * 0.04)));
  const start = l.log[0];
  const days = start && l.log.length > 1 ? (Date.parse(l.log[l.log.length - 1].date) - Date.parse(start.date)) / DAY_MS : 0;
  return { best, next, pct: best != null ? Math.min(1, best / l.goal) : 0, perWeek: days >= 3 && best != null ? ((best - start.bpm) / days) * 7 : null };
}
