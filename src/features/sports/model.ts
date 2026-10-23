/** Sports sessions: a log entry with the sport as subcategory, plus distance or match details. */
import type { SectionEntry } from '../../data/lt';

export const SPORTS = [
  { id: 'running', name: 'Running', kind: 'distance' },
  { id: 'cycling', name: 'Cycling', kind: 'distance' },
  { id: 'swimming', name: 'Swimming', kind: 'distance' },
  { id: 'volleyball', name: 'Volleyball', kind: 'court' },
  { id: 'tennis', name: 'Tennis', kind: 'court' },
] as const;
export type SportId = (typeof SPORTS)[number]['id'];
export const sportInfo = (id: string | undefined) => SPORTS.find((s) => s.id === id);

export interface SportDetail {
  sport: SportId;
  km?: number;
  /** Training or a match (court sports). */
  type?: 'training' | 'match';
  score?: string;
  route?: string;
}
export type SportSession = SectionEntry<SportDetail>;
export const isSportDetail = (d: unknown): d is SportDetail => !!d && typeof (d as SportDetail).sport === 'string';

const pad = (n: number) => String(n).padStart(2, '0');
/** Running: min/km. Cycling: km/h. Swimming: min/100 m. */
export function paceOf(sport: string, minutes: number, km: number | undefined): string | null {
  if (!km || km <= 0 || minutes <= 0) return null;
  if (sport === 'cycling') return `${(km / (minutes / 60)).toFixed(1)} km/h`;
  const perUnit = sport === 'swimming' ? (minutes * 60) / (km * 10) : (minutes * 60) / km;
  const s = Math.round(perUnit);
  return `${Math.floor(s / 60)}:${pad(s % 60)} /${sport === 'swimming' ? '100 m' : 'km'}`;
}

/** Bests worked out from the records: longest distance and fastest pace (over at least a minimum distance) per sport. */
export function bests(sessions: SportSession[]): { sport: SportId; label: string; value: string; date: string }[] {
  const out: { sport: SportId; label: string; value: string; date: string }[] = [];
  for (const sp of SPORTS.filter((s) => s.kind === 'distance')) {
    const list = sessions.filter((s) => isSportDetail(s.detail) && s.detail.sport === sp.id && s.detail.km && s.detail.km > 0);
    if (!list.length) continue;
    const longest = list.reduce((a, b) => (b.detail!.km! > a.detail!.km! ? b : a));
    out.push({ sport: sp.id, label: 'Longest', value: `${longest.detail!.km} km`, date: longest.entry.date });
    const min = sp.id === 'swimming' ? 0.4 : sp.id === 'cycling' ? 10 : 5;
    const fair = list.filter((s) => s.detail!.km! >= min);
    if (fair.length) {
      const speed = (s: SportSession) => s.detail!.km! / s.entry.minutes;
      const fastest = fair.reduce((a, b) => (speed(b) > speed(a) ? b : a));
      out.push({ sport: sp.id, label: `Fastest (${min}+ km)`, value: paceOf(sp.id, fastest.entry.minutes, fastest.detail!.km)!, date: fastest.entry.date });
    }
  }
  return out;
}

export function matchRecord(sessions: SportSession[], sport: SportId): { matches: number } {
  return { matches: sessions.filter((s) => isSportDetail(s.detail) && s.detail.sport === sport && s.detail.type === 'match').length };
}
