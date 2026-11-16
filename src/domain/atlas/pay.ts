/**
 * What the Atlas pays in the Hangar, derived from its rows like every other grant: a little for
 * each day's right answers, the daily challenge, each passport stamp, each medal, and a prize for
 * finishing a continent and the world. Nothing is stored as a balance.
 */
import { CONTS, COUNTRIES, deck, DAILY_N, MEDALS } from './model';

export interface AtlasRow {
  id: string;
  kind: string;
  data: Record<string, unknown>;
}

export interface AtlasGrant {
  key: string;
  date: string;
  label: string;
  coins?: number;
  gems?: number;
  chest?: 'gold' | 'mythic';
}

const isDay = (x: unknown): x is string => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x);
const num = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) && x > 0 ? Math.floor(x) : 0);

/** Ryō for a day's right answers: five for turning up, one more for every three, sixty at most. */
export const dayCoins = (ok: number) => (ok > 0 ? Math.min(5 + Math.floor(ok / 3), 60) : 0);
export const DAILY_COINS = 40;
export const DAILY_PERFECT_GEMS = 3;
export const STAMP_COINS = 15;
/** A medal pays by the size of its deck: once, twice and four times its countries. */
export const MEDAL_RATE = [0, 1, 2, 4];
export const CONT_PRIZE = { coins: 300, gems: 20 };
export const WORLD_PRIZE = { coins: 1000, gems: 100 };

export function atlasGrants(rows: readonly AtlasRow[]): AtlasGrant[] {
  const out: AtlasGrant[] = [];
  const stamps = new Map<string, string>();
  for (const r of rows) {
    const d = r.data;
    if (r.kind === 'geo_day' && isDay(d.date)) {
      const ok = num(d.ok);
      if (ok) out.push({ key: `geo:day:${d.date}`, date: d.date, label: `Atlas: ${ok} right`, coins: dayCoins(ok) });
      const daily = d.daily as { ok?: unknown } | null | undefined;
      if (daily && typeof daily === 'object') {
        const perfect = num(daily.ok) >= DAILY_N;
        out.push({ key: `geo:daily:${d.date}`, date: d.date, label: perfect ? 'Atlas daily challenge, all twelve' : 'Atlas daily challenge', coins: DAILY_COINS, ...(perfect ? { gems: DAILY_PERFECT_GEMS } : {}) });
      }
    } else if (r.kind === 'geo_stamp' && typeof d.cc === 'string' && isDay(d.date)) {
      if (!stamps.has(d.cc)) stamps.set(d.cc, d.date);
    } else if (r.kind === 'geo_medal' && typeof d.deck === 'string' && isDay(d.date)) {
      const n = deck(d.deck)?.ids.length ?? 0;
      const tier = Math.min(num(d.tier), 3);
      // each step up pays its own share, dated when the best one was won
      for (let t = 1; t <= tier; t++) out.push({ key: `geo:medal:${r.id}:${t}`, date: d.date, label: `Atlas ${MEDALS[t].toLowerCase()} medal`, coins: n * MEDAL_RATE[t], ...(t === 3 && n >= 10 ? { gems: 2 } : {}) });
      if (d.flawless === true && tier) out.push({ key: `geo:medal:${r.id}:flawless`, date: isDay(d.flawlessOn) ? d.flawlessOn : d.date, label: 'Atlas flawless round', coins: n });
    }
  }
  for (const [cc, date] of stamps) out.push({ key: `geo:stamp:${cc}`, date, label: 'Passport stamp', coins: STAMP_COINS });
  let world = '';
  let all = true;
  for (const k of CONTS) {
    const ids = COUNTRIES.filter((c) => c.cont === k.id).map((c) => c.id);
    if (!ids.every((id) => stamps.has(id))) {
      all = false;
      continue;
    }
    const date = ids.map((id) => stamps.get(id)!).sort().pop()!;
    if (date > world) world = date;
    out.push({ key: `geo:cont:${k.id}`, date, label: `Every country in ${k.name}`, ...CONT_PRIZE, chest: 'gold' });
  }
  if (all) out.push({ key: 'geo:world', date: world, label: 'Every country in the world', ...WORLD_PRIZE, chest: 'mythic' });
  return out;
}

export function payTotal(rows: readonly AtlasRow[]): { coins: number; gems: number } {
  let coins = 0;
  let gems = 0;
  for (const g of atlasGrants(rows)) {
    coins += g.coins ?? 0;
    gems += g.gems ?? 0;
  }
  return { coins, gems };
}
