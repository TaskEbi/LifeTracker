import { navigate } from '../../app/router';
import { openSheet } from '../../app/sheets';
import { toggleTask } from '../../data/ltActions';
import { data } from '../../data/store';
import type { SectionId, Todo } from '../../data/types';
import { useToday } from '../../data/lt';
import { relativeDay } from '../../domain/log/dates';
import { useStore } from '../../lib/createStore';
import { H2 } from './bits';

export function TaskRow({ t, today }: { t: Todo; today: string }) {
  const late = !t.done_at && t.due && t.due < today;
  return (
    <div className="i-task">
      <button type="button" className={`i-task__ck${t.done_at ? ' is-on' : ''}`} onClick={() => toggleTask(t.id)} aria-label={`${t.done_at ? 'Mark not done' : 'Complete'}: ${t.title}`} />
      <button type="button" className="i-task__t" onClick={() => openSheet({ type: 'task', editId: t.id })}>
        <span className={t.done_at ? 'is-done' : ''}>{t.title}</span>
        <small>
          {t.due ? <span className={late ? 'i-warn-text' : undefined}>{late ? 'late · ' : ''}{relativeDay(t.due, today)}</span> : 'no date'}
        </small>
      </button>
      <span className={`i-task__p is-${t.priority}`}>{t.priority === 'high' ? 'P1' : t.priority === 'normal' ? 'P2' : 'P3'}</span>
    </div>
  );
}

/** A section's open tasks, so they show where they belong as well as in the shared list. */
export function RelatedTasks({ section }: { section: SectionId }) {
  const todos = useStore(data, (s) => s.todos);
  const today = useToday();
  const list = [...todos.values()].filter((t) => !t.deleted_at && !t.done_at && t.section === section).sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999'));
  return (
    <>
      <H2
        aside={
          <span className="i-btns">
            <button type="button" className="i-link" onClick={() => openSheet({ type: 'task', section })}>
              + Task
            </button>
            {list.length > 0 && (
              <button type="button" className="i-link" onClick={() => navigate('tasks', [section])}>
                All →
              </button>
            )}
          </span>
        }
      >
        Tasks
      </H2>
      <div className="i-pnl i-pnl--flush">
        {list.length ? list.map((t) => <TaskRow key={t.id} t={t} today={today} />) : <p className="i-note" style={{ padding: '12px 0' }}>No open tasks for this section.</p>}
      </div>
    </>
  );
}
