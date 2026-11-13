/** Saving a gym session: the muscle groups, how long, and an optional check-in. One entry, one detail. */
import { withReward } from '../../data/lt';
import { saveSession } from '../../data/sessions';
import { detailFor, type GymDetail, type MuscleId } from './model';

export interface GymForm {
  date: string;
  minutes: number;
  muscles: MuscleId[];
  effort: number | null;
  soreness: number | null;
  pain: boolean;
  painNote: string;
  note: string;
}

/**
 * Create (or, with `editId`, update) a session. A new one shows what it earned; an edit doesn't
 * (it is the same entry, and an entry earns once). Returns an error message, or null when saved.
 * No subcategory is set: the groups live in the detail, so Curio Cabinet's Daily Log doesn't
 * grow a subcategory for every combination.
 */
export function saveGym(f: GymForm, editId?: string | null, prev?: GymDetail | null): string | null {
  if (!f.muscles.length && !prev) return 'Pick at least one muscle group.';
  let error: string | null = null;
  const save = () => {
    const r = saveSession({ section: 'gym', date: f.date, minutes: f.minutes, note: f.note, detail: { ...detailFor(f.muscles, f, prev) } }, editId);
    if ('error' in r) error = r.error;
    return !('error' in r);
  };
  if (editId) save();
  else withReward(save, { pain: f.pain });
  return error;
}
