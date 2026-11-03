/**
 * The conductor: a practice session planned for the time you have, from what's on your stand: warm
 * up, then the pieces that most need it, then a run-through. And the ear trainer: intervals, with the
 * ones you get wrong coming up more often.
 */

export interface StandItem {
  id: string;
  kind: 'piece' | 'scale';
  title: string;
  status: string;
  /** Days since you last practised it; null if never. */
  idle: number | null;
  /** Days to its next performance, if it's on a programme. */
  performIn: number | null;
}

export interface Segment {
  id: string;
  title: string;
  minutes: number;
  what: string;
  /** The stand item, when it is one. */
  itemId: string | null;
}

const HOW: Record<string, string> = {
  Learning: 'Slowly, in small sections. Hands separately for anything awkward. Accuracy, not speed.',
  Polishing: 'Pick the two worst bars and fix them. Then one tempo-ladder step.',
  Rehearsing: 'Play it through as if it counts, then go back to the one place that slipped.',
  Performed: 'Keep it in the fingers: once through, musically.',
};

function urgency(i: StandItem): number {
  let s = 0;
  if (i.performIn != null) s += i.performIn <= 14 ? 100 - i.performIn : i.performIn <= 60 ? 40 : 10;
  s += Math.min(30, (i.idle ?? 21) * 2);
  if (i.status === 'Learning') s += 12;
  if (i.status === 'Polishing') s += 8;
  if (i.status === 'Shelved') s -= 40;
  return s;
}

/** Warm-up, up to three pieces by urgency, and a run-through if there's time. */
export function programme(items: StandItem[], minutes: number): Segment[] {
  const pieces = items.filter((i) => i.kind === 'piece').sort((a, b) => urgency(b) - urgency(a));
  const scales = items.filter((i) => i.kind === 'scale').sort((a, b) => (b.idle ?? 99) - (a.idle ?? 99));
  const warm = Math.max(5, Math.round(minutes * 0.15));
  const out: Segment[] = [
    scales[0]
      ? { id: 'warm', title: scales[0].title, minutes: warm, what: 'Warm up slowly with a drone. Listen to every note.', itemId: scales[0].id }
      : { id: 'warm', title: 'Warm up', minutes: warm, what: 'Long bows on open strings, then a scale, slowly.', itemId: null },
  ];
  const run = minutes >= 30 && pieces.length ? Math.max(5, Math.round(minutes * 0.15)) : 0;
  const left = minutes - warm - run;
  const count = pieces.length ? Math.min(pieces.length, left >= 40 ? 3 : left >= 20 ? 2 : 1) : 0;
  if (!count) {
    out.push({ id: 'free', title: 'Whatever you’re working on', minutes: Math.max(1, left + run), what: 'Add your pieces to the stand and this gets planned for you.', itemId: null });
    return out;
  }
  // The most urgent gets the most: shares of 3:2:1.
  const shares = [3, 2, 1].slice(0, count);
  const unit = left / shares.reduce((a, b) => a + b, 0);
  let given = 0;
  pieces.slice(0, count).forEach((p, i) => {
    const m = i === count - 1 ? left - given : Math.round(unit * shares[i]);
    given += m;
    out.push({ id: p.id, title: p.title, minutes: m, what: HOW[p.status] ?? HOW.Learning, itemId: p.id });
  });
  if (run) out.push({ id: 'run', title: `Run-through: ${pieces[0].title}`, minutes: run, what: 'From the top, no stopping, whatever happens. That’s the practice.', itemId: pieces[0].id });
  return out;
}

/** Time spent on each item: what the violin log needs for its split. */
export function splitOf(segments: Segment[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of segments) if (s.itemId) out[s.itemId] = (out[s.itemId] ?? 0) + s.minutes;
  return out;
}

// ─── ear trainer ────────────────────────────────────────────────────────────

export const INTERVALS = [
  { id: 'm2', name: 'Minor 2nd', semitones: 1 },
  { id: 'M2', name: 'Major 2nd', semitones: 2 },
  { id: 'm3', name: 'Minor 3rd', semitones: 3 },
  { id: 'M3', name: 'Major 3rd', semitones: 4 },
  { id: 'P4', name: 'Perfect 4th', semitones: 5 },
  { id: 'TT', name: 'Tritone', semitones: 6 },
  { id: 'P5', name: 'Perfect 5th', semitones: 7 },
  { id: 'm6', name: 'Minor 6th', semitones: 8 },
  { id: 'M6', name: 'Major 6th', semitones: 9 },
  { id: 'm7', name: 'Minor 7th', semitones: 10 },
  { id: 'M7', name: 'Major 7th', semitones: 11 },
  { id: 'P8', name: 'Octave', semitones: 12 },
] as const;
export type IntervalId = (typeof INTERVALS)[number]['id'];

export interface EarStat {
  asked: number;
  right: number;
}
export type EarStats = Partial<Record<IntervalId, EarStat>>;

/** Weak intervals come up more: unseen ones count as weak, and nothing ever drops out. */
export function intervalWeight(s: EarStat | undefined): number {
  if (!s || !s.asked) return 3;
  return 1 + 4 * (1 - s.right / s.asked);
}

/** `roll` in 0–1 picks one, in proportion to its weight. */
export function pickInterval(stats: EarStats, roll: number): (typeof INTERVALS)[number] {
  const weights = INTERVALS.map((i) => intervalWeight(stats[i.id]));
  let at = roll * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < INTERVALS.length; i++) {
    at -= weights[i];
    if (at < 0) return INTERVALS[i];
  }
  return INTERVALS[INTERVALS.length - 1];
}

/** Your weakest, once you've heard it enough for that to mean something. */
export function weakest(stats: EarStats, minAsked = 5): (typeof INTERVALS)[number] | null {
  const seen = INTERVALS.filter((i) => (stats[i.id]?.asked ?? 0) >= minAsked);
  if (!seen.length) return null;
  return [...seen].sort((a, b) => stats[a.id]!.right / stats[a.id]!.asked - stats[b.id]!.right / stats[b.id]!.asked)[0];
}
