/** What the ways in (Home) need without loading the Atlas screens or its maps. */
import { dueCount } from '../../domain/atlas/model';
import { atlasStreak, type AtlasState } from './store';

export { useAtlas } from './store';

/** The line under the door on Home. */
export function atlasLine(a: AtlasState, today: string): string {
  if (!a.days.length) return 'Every flag, country and capital · games, medals and a passport';
  const due = dueCount(a.marks, today);
  const streak = atlasStreak(a, today);
  const daily = a.days.find((d) => d.date === today)?.daily;
  return [`${a.stamps.size} of 195 stamped`, due ? `${due} ${due === 1 ? 'card' : 'cards'} due` : '', daily ? '' : 'daily challenge open', streak > 1 ? `${streak}-day streak` : ''].filter(Boolean).join(' · ');
}
