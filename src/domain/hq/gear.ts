/**
 * 武器庫, the armoury: things that wear out, measured by what you've actually done with them. Running
 * shoes by the kilometres in your log, violin strings by hours played, a bow by months. Each piece is
 * an lt_records row (kind `hq_gear`); replacing it keeps what the old one did.
 */
import type { LtRecord } from '../../data/types';
import { addDays, dayCount } from '../log/dates';

export type GearMetric = 'km' | 'hours' | 'days';
export type GearSource = 'running' | 'cycling' | 'violin' | 'gym' | 'tennis' | 'volleyball' | 'none';

export const GEAR_PRESETS: { id: string; name: string; icon: string; metric: GearMetric; source: GearSource; limit: number; tip: string }[] = [
  { id: 'shoes', name: 'Running shoes', icon: '靴', metric: 'km', source: 'running', limit: 700, tip: 'Usually good for 500–800 km. If your shins or knees start complaining early, check here first.' },
  { id: 'strings', name: 'Violin strings', icon: '弦', metric: 'hours', source: 'violin', limit: 200, tip: 'They go false and dull long before they break. Heavy practice: every three to six months.' },
  { id: 'rehair', name: 'Bow hair', icon: '弓', metric: 'days', source: 'none', limit: 240, tip: 'A rehair every six to twelve months, sooner if it stops holding rosin.' },
  { id: 'rosin', name: 'Rosin', icon: '松', metric: 'days', source: 'none', limit: 365, tip: 'Old rosin turns glassy and stops gripping.' },
  { id: 'luthier', name: 'Luthier check', icon: '匠', metric: 'days', source: 'none', limit: 365, tip: 'Soundpost, bridge and seams, once a year or before a big performance.' },
  { id: 'racket', name: 'Tennis strings', icon: '球', metric: 'hours', source: 'tennis', limit: 40, tip: 'Restring as many times a year as you play a week.' },
  { id: 'bike', name: 'Bike chain', icon: '輪', metric: 'km', source: 'cycling', limit: 3000, tip: 'Check for stretch; a new chain saves the cassette.' },
];
export const gearPreset = (id: string) => GEAR_PRESETS.find((p) => p.id === id);

export interface PastGear {
  name: string;
  since: string;
  until: string;
  used: number;
}

export interface Gear {
  id: string;
  type: string;
  name: string;
  metric: GearMetric;
  source: GearSource;
  limit: number;
  /** When this one came into use. */
  since: string;
  /** Used already when added (a pair of shoes that had done 200 km). */
  baseline: number;
  /** The last ones it replaced. */
  past: PastGear[];
}

export function gearOf(r: LtRecord): Gear | null {
  if (r.deleted_at || r.kind !== 'hq_gear') return null;
  const d = r.data;
  if (typeof d.name !== 'string' || typeof d.since !== 'string') return null;
  const metric: GearMetric = d.metric === 'km' || d.metric === 'hours' ? d.metric : 'days';
  return {
    id: r.id,
    type: typeof d.type === 'string' ? d.type : 'custom',
    name: d.name,
    metric,
    source: typeof d.source === 'string' ? (d.source as GearSource) : 'none',
    limit: typeof d.limit === 'number' && d.limit > 0 ? d.limit : 100,
    since: d.since,
    baseline: typeof d.baseline === 'number' && d.baseline > 0 ? d.baseline : 0,
    past: Array.isArray(d.past) ? (d.past as PastGear[]) : [],
  };
}

/** One logged activity that can wear something out. */
export interface WearEvent {
  date: string;
  source: Exclude<GearSource, 'none'>;
  minutes: number;
  km: number | null;
}

export interface Wear {
  used: number;
  /** used / limit (over 1 means past it). */
  pct: number;
  left: number;
  status: 'fresh' | 'worn' | 'due';
  /** When it reaches the limit at the pace of the last eight weeks. */
  dueDate: string | null;
}

export function wearOf(g: Gear, events: WearEvent[], today: string): Wear {
  let used = g.baseline;
  let recent = 0;
  const from = addDays(today, -55);
  if (g.metric === 'days') {
    used += dayCount(g.since, today) - 1;
    recent = 56;
  } else {
    for (const e of events) {
      if (e.source !== g.source || e.date < g.since || e.date > today) continue;
      const v = g.metric === 'km' ? e.km ?? 0 : e.minutes / 60;
      used += v;
      if (e.date >= from) recent += v;
    }
  }
  const pct = used / g.limit;
  const left = g.limit - used;
  const perDay = recent / 56;
  const dueDate = left <= 0 ? today : perDay > 0 ? addDays(today, Math.ceil(left / perDay)) : null;
  return { used, pct, left, status: pct >= 1 ? 'due' : pct >= 0.8 ? 'worn' : 'fresh', dueDate };
}

export const fmtWear = (metric: GearMetric, v: number) => {
  const n = Math.round(v);
  return metric === 'km' ? `${n} km` : metric === 'hours' ? `${n} h` : `${n} days`;
};
