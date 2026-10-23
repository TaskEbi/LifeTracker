/** LifeTracker actions that span sections: tasks with rewards and undo. Section-specific ones live with their feature. */
import { withReward } from './lt';
import { data } from './store';
import { deleteTodo, restoreTodo, setTodoDone } from './todoActions';
import { toast } from './ui';

/** Tasks unticked on this device this session: ticking them again restores their XP without celebrating it twice. */
const unticked = new Set<string>();

/** Tick or untick a task. The XP is tied to the task, so it counts once however often it is ticked. */
export function toggleTask(id: string) {
  const t = data.get().todos.get(id);
  if (!t || t.deleted_at) return;
  if (t.done_at) {
    setTodoDone(id, false);
    unticked.add(id);
    toast('Marked not done');
    return;
  }
  if (unticked.has(id)) {
    setTodoDone(id, true);
    toast('Done again');
    return;
  }
  withReward(() => setTodoDone(id, true));
}

export function removeTask(id: string) {
  const at = deleteTodo(id);
  if (at) toast('Task deleted', { label: 'Undo', run: () => restoreTodo(id, at) });
}
