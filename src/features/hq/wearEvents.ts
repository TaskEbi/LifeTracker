/** Logged sessions in the shape the armoury and the load guard need. */
import type { ProgressInput } from '../../domain/progress/engine';
import { sectionOf } from '../../domain/progress/engine';
import type { WearEvent } from '../../domain/hq/gear';

export function wearEvents(input: ProgressInput): WearEvent[] {
  const out: WearEvent[] = [];
  for (const e of input.entries) {
    if (e.date > input.today) continue;
    const s = sectionOf(e, input);
    const det = input.details.get(e.id);
    const d = det && !det.deleted_at ? (det.data as { sport?: unknown; km?: unknown }) : null;
    if (s === 'violin') out.push({ date: e.date, source: 'violin', minutes: e.minutes, km: null });
    else if (s === 'gym') out.push({ date: e.date, source: 'gym', minutes: e.minutes, km: null });
    else if (s === 'sports' && (d?.sport === 'running' || d?.sport === 'cycling' || d?.sport === 'tennis' || d?.sport === 'volleyball')) {
      out.push({ date: e.date, source: d.sport, minutes: e.minutes, km: typeof d.km === 'number' ? d.km : null });
    }
  }
  return out;
}
