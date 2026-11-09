/**
 * When a surprise scene follows a save (domain/fun/surprise.ts decides; this rolls the dice and
 * remembers what played). The log lives in this device's localStorage only: a per-viewer
 * convenience, never synced. Only real saves that earned XP qualify, never previews or rest days,
 * and only while celebrations play in full.
 */
import { ltToday, type RewardView } from '../data/lt';
import { data } from '../data/store';
import { mainSection, pickSurprise, shouldSurprise, type SurpriseLog } from '../domain/fun/surprise';
import { hourIn } from '../domain/fun/season';
import { fxPrefs, playStyle, type Celebration } from '../ui/i/fx/celebrate';

const KEY = 'lifetracker-surprises';

function load(): SurpriseLog {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<SurpriseLog>;
    return { shown: Array.isArray(v.shown) ? v.shown.filter((s) => s && typeof s.id === 'string' && typeof s.at === 'number').slice(-30) : [] };
  } catch {
    return { shown: [] };
  }
}
function save(log: SurpriseLog) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ shown: log.shown.slice(-30) }));
  } catch {
    /* private mode: this visit only */
  }
}

/** A surprise for this save, or null. `room` is how many more celebrations the queue may take. */
export function surpriseFor(r: RewardView, room: number, random: () => number = Math.random): Celebration | null {
  if (room < 1 || r.preview || r.rest || r.total <= 0) return null;
  if (!fxPrefs.get().surprises || playStyle() !== 'full') return null;
  const log = load();
  const now = Date.now();
  const day = ltToday();
  if (!shouldSurprise(log, now, day, random())) return null;
  const section = mainSection(r.lines);
  const id = pickSurprise(log, section, hourIn(data.get().settings.log_timezone), random());
  log.shown.push({ id, at: now, day });
  save(log);
  return { kind: 'surprise', id, section, xp: r.total };
}
