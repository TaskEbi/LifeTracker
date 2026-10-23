/** LifeTracker actions that span sections: tasks with rewards and undo. Section-specific ones live with their feature. */
import { withReward } from './lt';
import { data } from './store';
import { deleteTodo, restoreTodo, setTodoDone } from './todoActions';
import { toast } from './ui';

/** Tick or untick a task. Ticking shows what it earned (once: the XP is tied to the task). */
export function toggleTask(id: string) {
  const t = data.get().todos.get(id);
  if (!t || t.deleted_at) return;
  if (t.done_at) {
    setTodoDone(id, false);
    toast('Marked not done');
    return;
  }
  withReward(() => setTodoDone(id, true));
}

export function removeTask(id: string) {
  const at = deleteTodo(id);
  if (at) toast('Task deleted', { label: 'Undo', run: () => restoreTodo(id, at) });
}
