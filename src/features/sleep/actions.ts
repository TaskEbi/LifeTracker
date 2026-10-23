/** Saving a night: the duration and score go in Curio Cabinet's log_metrics; bed and wake times in lt_nights. */
import { ltToday, withReward } from '../../data/lt';
import { pairId, setMetric } from '../../data/logActions';
import { commit, data } from '../../data/store';
import type { LtNight } from '../../data/types';
import { toast } from '../../data/ui';
import { durationOf } from './model';

const now = () => new Date().toISOString();
export const nightId = (date: string) => pairId('night', date);

export interface NightDraft {
  /** The morning you woke. */
  date: string;
  /** Both set, or both null when only the total is known. */
  bed: string | null;
  wake: string | null;
  /** Used when there are no times. */
  minutes: number;
  score: number | null;
}

function setTimes(date: string, bed: string | null, wake: string | null) {
  const id = nightId(date);
  const existing = data.get().lt_nights.get(id);
  const t = now();
  if (bed && wake) {
    const row: LtNight = existing ? { ...existing, bed, wake, deleted_at: null, updated_at: t } : { id, date, bed, wake, created_at: t, updated_at: t, deleted_at: null };
    commit('lt_nights', [row]);
  } else if (existing && !existing.deleted_at) commit('lt_nights', [{ ...existing, deleted_at: t, updated_at: t }]);
}

/** Save (or replace) a night. Returns an error message or null. */
export function saveNight(d: NightDraft): string | null {
  if (d.date > ltToday()) return "That morning hasn't happened yet.";
  const minutes = d.bed && d.wake ? durationOf(d.bed, d.wake) : d.minutes;
  if (minutes < 30 || minutes > 1200) return 'That is outside 30 minutes to 20 hours. Check the times.';
  if (d.score != null && (d.score < 0 || d.score > 100)) return 'A sleep score is 0 to 100.';
  let error: string | null = null;
  withReward(() => {
    error = setMetric('sleep', d.date, minutes);
    if (error) return false;
    setTimes(d.date, d.bed, d.wake);
    setMetric('sleep_score', d.date, d.score);
    return true;
  });
  return error;
}

/** Remove a night entirely (duration, score and times), with undo. */
export function clearNight(date: string) {
  const st = data.get();
  const before = {
    sleep: [...st.log_metrics.values()].find((m) => m.metric === 'sleep' && m.date === date && !m.deleted_at)?.minutes ?? null,
    score: [...st.log_metrics.values()].find((m) => m.metric === 'sleep_score' && m.date === date && !m.deleted_at)?.minutes ?? null,
    night: st.lt_nights.get(nightId(date)),
  };
  setMetric('sleep', date, null);
  setMetric('sleep_score', date, null);
  setTimes(date, null, null);
  toast('Night cleared', {
    label: 'Undo',
    run: () => {
      if (before.sleep != null) setMetric('sleep', date, before.sleep);
      if (before.score != null) setMetric('sleep_score', date, before.score);
      if (before.night && !before.night.deleted_at) setTimes(date, before.night.bed, before.night.wake);
    },
  });
}

/** Screen time: one total per day in log_metrics. */
export function saveScreen(date: string, minutes: number): string | null {
  if (date > ltToday()) return "That day hasn't happened yet.";
  let error: string | null = null;
  withReward(() => {
    error = setMetric('screen', date, minutes);
    return !error;
  });
  return error;
}

export function clearScreen(date: string) {
  const prev = [...data.get().log_metrics.values()].find((m) => m.metric === 'screen' && m.date === date && !m.deleted_at);
  setMetric('screen', date, null);
  if (prev) toast('Day cleared', { label: 'Undo', run: () => setMetric('screen', date, prev.minutes) });
}
