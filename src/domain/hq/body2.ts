/**
 * Things for the body and the nerves. Breath: patterns with a known purpose, and where you are in
 * one at a given moment. Bar tools: plates per side, an estimated one-rep max, a warm-up ramp. Race
 * kit: splits, fuel and what to do when, for a marathon goal. All of it is arithmetic and common
 * guidance, labelled as such on screen.
 */

// ─── breath ─────────────────────────────────────────────────────────────────

export interface BreathPattern {
  id: string;
  name: string;
  /** Seconds for each phase. */
  phases: { label: 'Breathe in' | 'Hold' | 'Breathe out' | 'Hold empty'; seconds: number }[];
  forWhat: string;
}

export const BREATHS: BreathPattern[] = [
  { id: 'box', name: 'Box', forWhat: 'Before a contest or an exam: steady and alert', phases: [{ label: 'Breathe in', seconds: 4 }, { label: 'Hold', seconds: 4 }, { label: 'Breathe out', seconds: 4 }, { label: 'Hold empty', seconds: 4 }] },
  { id: 'long-out', name: 'Long out', forWhat: 'Before going on stage: slows the shake, long breath out', phases: [{ label: 'Breathe in', seconds: 4 }, { label: 'Breathe out', seconds: 8 }] },
  { id: '478', name: '4-7-8', forWhat: 'In bed when your head won’t stop', phases: [{ label: 'Breathe in', seconds: 4 }, { label: 'Hold', seconds: 7 }, { label: 'Breathe out', seconds: 8 }] },
  { id: 'even', name: 'Even', forWhat: 'Any time: about five and a half breaths a minute', phases: [{ label: 'Breathe in', seconds: 5.5 }, { label: 'Breathe out', seconds: 5.5 }] },
];

export interface BreathState {
  label: string;
  /** Seconds left in this phase, rounded up. */
  left: number;
  /** How full the lungs are, 0–1, for the circle. */
  fill: number;
  round: number;
}

/** Where you are `ms` after starting. */
export function breathAt(p: BreathPattern, ms: number): BreathState {
  const cycle = p.phases.reduce((n, x) => n + x.seconds, 0) * 1000;
  const round = Math.floor(ms / cycle);
  let at = ms % cycle;
  let fill = 0;
  for (const ph of p.phases) {
    const len = ph.seconds * 1000;
    if (at < len) {
      const k = at / len;
      if (ph.label === 'Breathe in') fill = k;
      else if (ph.label === 'Breathe out') fill = 1 - k;
      else fill = ph.label === 'Hold' ? 1 : 0;
      return { label: ph.label, left: Math.ceil((len - at) / 1000), fill, round };
    }
    at -= len;
    fill = ph.label === 'Breathe in' || ph.label === 'Hold' ? 1 : 0;
  }
  return { label: p.phases[0].label, left: p.phases[0].seconds, fill: 0, round };
}

// ─── bar tools ──────────────────────────────────────────────────────────────

export const PLATE_SIZES = [25, 20, 15, 10, 5, 2.5, 1.25];

export interface PlateLoad {
  /** One side, heaviest first. */
  side: number[];
  /** What's actually on the bar. */
  total: number;
  /** How far off the target, when it can't be made exactly. */
  off: number;
}

export function platesFor(target: number, bar = 20, sizes: number[] = PLATE_SIZES): PlateLoad {
  let perSide = Math.max(0, (target - bar) / 2);
  const side: number[] = [];
  for (const p of sizes) {
    while (perSide >= p - 1e-9) {
      side.push(p);
      perSide -= p;
    }
  }
  const total = bar + side.reduce((a, b) => a + b, 0) * 2;
  return { side, total, off: Math.round((target - total) * 100) / 100 };
}

/** Estimated one-rep max (Epley). One rep is the number itself; past 12 reps it's only a rough guide. */
export function estimateMax(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  return reps === 1 ? weight : Math.round(weight * (1 + reps / 30) * 10) / 10;
}

export const roundToPlates = (kg: number, step = 2.5) => Math.round(kg / step) * step;

/** Warm-up sets up to a working weight. */
export function warmUp(working: number, bar = 20): { weight: number; reps: number }[] {
  const steps: [number, number][] = [[0, 10], [0.4, 8], [0.6, 5], [0.8, 3], [0.9, 1]];
  const sets = steps.map(([k, reps]) => ({ weight: k === 0 ? bar : roundToPlates(working * k), reps }));
  const seen = new Set<number>();
  return sets.filter((s) => s.weight >= bar && s.weight < working && !seen.has(s.weight) && !!seen.add(s.weight));
}

// ─── race kit ───────────────────────────────────────────────────────────────

export const MARATHON_KM = 42.195;

const clock = (sec: number) => {
  const s = Math.round(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h ? `${h}:${String(m).padStart(2, '0')}` : m}:${String(s % 60).padStart(2, '0')}`;
};

export interface Split {
  label: string;
  km: number;
  /** Time on the clock here. */
  at: string;
  pace: string;
}

/**
 * Time on the clock at each mark. `negative` is how much quicker the second half is than the first,
 * as a share: the usual advice is a touch quicker, 0–2%.
 */
export function paceBand(goalSec: number, negative = 0.01, distance = MARATHON_KM): Split[] {
  const half = distance / 2;
  // first half takes (1+n)/2 of the time per unit of the second half: t1 = goal·(1+n)/(2+n)
  const first = (goalSec * (1 + negative)) / (2 + negative);
  const second = goalSec - first;
  const at = (km: number) => (km <= half ? (first * km) / half : first + (second * (km - half)) / half);
  const marks = [5, 10, 15, 20, half, 25, 30, 35, 40, distance];
  return marks.map((km) => {
    const sec = at(km);
    const pace = (km <= half ? first : second) / half;
    return { label: km === half ? 'Half' : km === distance ? 'Finish' : `${km} km`, km, at: clock(sec), pace: `${Math.floor(pace / 60)}:${String(Math.round(pace % 60)).padStart(2, '0')}` };
  });
}

export interface FuelStop {
  /** Minutes into the race. */
  minute: number;
  km: number;
  what: string;
}

/** A gel about every 35 minutes after the first half hour, with water each time. Practise it on long runs. */
export function fuelPlan(goalSec: number, distance = MARATHON_KM): FuelStop[] {
  const out: FuelStop[] = [];
  const speed = distance / (goalSec / 60);
  for (let m = 35; m < goalSec / 60 - 15; m += 35) out.push({ minute: m, km: Math.round(m * speed * 10) / 10, what: 'Gel, with water' });
  return out;
}

export interface KitStep {
  id: string;
  when: string;
  what: string;
}

export const RACE_STEPS: KitStep[] = [
  { id: 'gear-test', when: 'Now, on long runs', what: 'Run in race shoes, socks and kit. Nothing new on race day.' },
  { id: 'gel-test', when: 'Now, on long runs', what: 'Practise taking gels at race pace. Your gut needs training too.' },
  { id: 'entry', when: 'Weeks before', what: 'Entry, ID and travel sorted. Check how you collect your number.' },
  { id: 'taper', when: 'Last three weeks', what: 'Trust the taper. Feeling flat and restless is normal.' },
  { id: 'sleep', when: 'Race week', what: 'Bank sleep on Tuesday to Thursday. The night before matters less than people think.' },
  { id: 'carbs', when: 'Last two days', what: 'More carbs and fewer fats and fibre. Foods you already know.' },
  { id: 'lay-out', when: 'Night before', what: 'Lay out kit, number, watch, gels, safety pins and an old top to throw away.' },
  { id: 'breakfast', when: 'Race morning', what: 'A familiar breakfast about three hours before. Toilet early, then again.' },
  { id: 'start', when: 'The first 10 km', what: 'Hold back. It should feel too easy. Every minute banked early is paid back double after 30.' },
  { id: 'wall', when: 'After 30 km', what: 'This is where it starts. Short targets: the next kilometre, the next water station.' },
];
