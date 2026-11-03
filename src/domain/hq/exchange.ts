/**
 * 為替, the exchange rate: screen time in the currency of your own life. Only rates your records
 * can back up: your own average session, your own pace, your own reading speed.
 */
import { addDays } from '../log/dates';
import { sectionOf, type ProgressInput } from '../progress/engine';

export interface ExchangeLine {
  section: string;
  text: string;
  /** How many, for sorting and showing big. */
  amount: number;
}

const round1 = (v: number) => Math.round(v * 10) / 10;

export function exchange(screenMinutes: number, input: ProgressInput): ExchangeLine[] {
  if (screenMinutes <= 0) return [];
  const from = addDays(input.today, -90);
  const violin: number[] = [];
  const study: number[] = [];
  const coding: number[] = [];
  let runKm = 0;
  let runMin = 0;
  for (const e of input.entries) {
    if (e.date < from || e.date > input.today) continue;
    const s = sectionOf(e, input);
    if (s === 'violin') violin.push(e.minutes);
    if (s === 'study') study.push(e.minutes);
    if (s === 'coding') coding.push(e.minutes);
    if (s === 'sports') {
      const d = input.details.get(e.id);
      const data = d && !d.deleted_at ? (d.data as { sport?: unknown; km?: unknown }) : null;
      if (data?.sport === 'running' && typeof data.km === 'number' && data.km > 0) {
        runKm += data.km;
        runMin += e.minutes;
      }
    }
  }
  const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
  const out: ExchangeLine[] = [];
  if (violin.length >= 3) {
    const n = screenMinutes / avg(violin);
    out.push({ section: 'violin', amount: round1(n), text: `${round1(n)} violin ${n === 1 ? 'session' : 'sessions'} at your usual ${Math.round(avg(violin))} min` });
  }
  if (runKm > 0 && runMin > 0) {
    const km = (screenMinutes / runMin) * runKm;
    const marathon = km / 42.195;
    out.push({ section: 'sports', amount: round1(km), text: `${round1(km)} km at your running pace${marathon >= 0.25 ? ` (${Math.round(marathon * 100)}% of a marathon)` : ''}` });
  }
  if (coding.length >= 3) {
    const n = screenMinutes / avg(coding);
    out.push({ section: 'coding', amount: round1(n), text: `${round1(n)} coding ${n === 1 ? 'session' : 'sessions'}` });
  }
  if (study.length >= 3) {
    const n = screenMinutes / avg(study);
    out.push({ section: 'study', amount: round1(n), text: `${round1(n)} study ${n === 1 ? 'session' : 'sessions'}` });
  }
  return out;
}
