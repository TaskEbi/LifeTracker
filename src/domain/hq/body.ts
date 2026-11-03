/**
 * 医務室, the infirmary: where it hurts and whether training is ramping up too fast. Niggles are
 * lt_records rows (kind `hq_niggle`). The load guard is the acute:chronic ratio, a rule of thumb from
 * sports science and labelled as one, never medical advice.
 */
import type { LtRecord } from '../../data/types';
import { addDays, dayCount } from '../log/dates';

export const REGIONS = [
  { id: 'jaw', name: 'Jaw', view: 'front', legs: false, violin: true },
  { id: 'neck', name: 'Neck', view: 'back', legs: false, violin: true },
  { id: 'lshoulder', name: 'Left shoulder', view: 'front', legs: false, violin: true },
  { id: 'rshoulder', name: 'Right shoulder', view: 'front', legs: false, violin: true },
  { id: 'chest', name: 'Chest', view: 'front', legs: false, violin: false },
  { id: 'upperback', name: 'Upper back', view: 'back', legs: false, violin: true },
  { id: 'lowerback', name: 'Lower back', view: 'back', legs: false, violin: false },
  { id: 'lelbow', name: 'Left elbow', view: 'front', legs: false, violin: true },
  { id: 'relbow', name: 'Right elbow', view: 'front', legs: false, violin: true },
  { id: 'lwrist', name: 'Left wrist and hand', view: 'front', legs: false, violin: true },
  { id: 'rwrist', name: 'Right wrist and hand', view: 'front', legs: false, violin: true },
  { id: 'lhip', name: 'Left hip', view: 'front', legs: true, violin: false },
  { id: 'rhip', name: 'Right hip', view: 'front', legs: true, violin: false },
  { id: 'lknee', name: 'Left knee', view: 'front', legs: true, violin: false },
  { id: 'rknee', name: 'Right knee', view: 'front', legs: true, violin: false },
  { id: 'lshin', name: 'Left shin', view: 'front', legs: true, violin: false },
  { id: 'rshin', name: 'Right shin', view: 'front', legs: true, violin: false },
  { id: 'lcalf', name: 'Left calf and achilles', view: 'back', legs: true, violin: false },
  { id: 'rcalf', name: 'Right calf and achilles', view: 'back', legs: true, violin: false },
  { id: 'lfoot', name: 'Left foot', view: 'front', legs: true, violin: false },
  { id: 'rfoot', name: 'Right foot', view: 'front', legs: true, violin: false },
] as const;
export type RegionId = (typeof REGIONS)[number]['id'];
export const regionInfo = (id: string) => REGIONS.find((r) => r.id === id);

export const SEVERITY = [
  { v: 1, name: 'Niggle', hint: 'Noticeable, doesn’t change anything' },
  { v: 2, name: 'Sore', hint: 'Changes how I train' },
  { v: 3, name: 'Stop', hint: 'Can’t train through it' },
] as const;

export interface Niggle {
  id: string;
  region: RegionId;
  severity: 1 | 2 | 3;
  note: string;
  startedOn: string;
  healedOn: string | null;
  /** Each time you looked at it again. */
  log: { date: string; severity: number }[];
}

export function niggleOf(r: LtRecord): Niggle | null {
  if (r.deleted_at || r.kind !== 'hq_niggle') return null;
  const d = r.data;
  if (!regionInfo(String(d.region)) || typeof d.startedOn !== 'string') return null;
  return {
    id: r.id,
    region: d.region as RegionId,
    severity: d.severity === 2 || d.severity === 3 ? d.severity : 1,
    note: typeof d.note === 'string' ? d.note : '',
    startedOn: d.startedOn,
    healedOn: typeof d.healedOn === 'string' ? d.healedOn : null,
    log: Array.isArray(d.log) ? (d.log as Niggle['log']) : [],
  };
}

export const activeNiggles = (all: Niggle[]) => all.filter((n) => !n.healedOn);
export const legsHurt = (all: Niggle[]) => activeNiggles(all).some((n) => n.severity >= 2 && regionInfo(n.region)?.legs);

/** The same place, again and again: three or more in the last year. */
export function recurring(all: Niggle[], today: string): { region: RegionId; n: number }[] {
  const from = addDays(today, -365);
  const by = new Map<RegionId, number>();
  for (const x of all) if (x.startedOn >= from) by.set(x.region, (by.get(x.region) ?? 0) + 1);
  return [...by].filter(([, n]) => n >= 3).map(([region, n]) => ({ region, n }));
}
/** Days it lasted, or has lasted so far. */
export const niggleDays = (n: Niggle, today: string) => dayCount(n.startedOn, n.healedOn ?? today);

export type LoadZone = 'unknown' | 'low' | 'good' | 'caution' | 'high';

export interface LoadGuard {
  /** Last 7 days. */
  acute: number;
  /** Average of the last 28 days, per week. */
  chronic: number;
  ratio: number | null;
  zone: LoadZone;
  /** This week so far compared with all of last week (Monday-based windows are not used: rolling 7s). */
  jump: number | null;
}

export const ZONE_TEXT: Record<LoadZone, string> = {
  unknown: 'Needs about three weeks of data first.',
  low: 'Well under your usual load. Fine if it’s a rest week.',
  good: 'Building at a pace your body is used to.',
  caution: 'Ramping up quickly. Watch for niggles.',
  high: 'Much more than you’re used to. This is where overuse injuries start.',
};

/** Load per day (km, minutes…) → the acute:chronic ratio. */
export function loadGuard(load: Map<string, number>, today: string): LoadGuard {
  const sum = (a: number, b: number) => {
    let n = 0;
    for (let i = a; i < b; i++) n += load.get(addDays(today, -i)) ?? 0;
    return n;
  };
  const acute = sum(0, 7);
  const prior = sum(7, 14);
  const total28 = sum(0, 28);
  const chronic = total28 / 4;
  // Without load in the older weeks the ratio only reflects that the data just started.
  const enough = sum(14, 28) > 0;
  const ratio = enough && chronic > 0 ? acute / chronic : null;
  const zone: LoadZone = ratio == null ? 'unknown' : ratio < 0.8 ? 'low' : ratio <= 1.3 ? 'good' : ratio <= 1.5 ? 'caution' : 'high';
  return { acute, chronic, ratio, zone, jump: prior > 0 ? (acute - prior) / prior : null };
}
