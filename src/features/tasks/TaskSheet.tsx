import { useState } from 'react';
import { registerSheet } from '../../app/sheetRegistry';
import { closeSheet, openSheet, type SheetSpec } from '../../app/sheets';
import { ltToday } from '../../data/lt';
import { removeTask, setTaskRepeat, taskRepeat, toggleTask } from '../../data/ltActions';
import { data } from '../../data/store';
import { addTodo, updateTodo } from '../../data/todoActions';
import { SECTION_IDS, type SectionId, type TodoPriority } from '../../data/types';
import { checkRepeat } from '../../domain/calendar/repeat';
import { addDays, weekdayIndex } from '../../domain/log/dates';
import { sectionInfo } from '../../domain/sections';
import { Picks } from '../../ui/i/bits';
import { Sheet } from '../../ui/i/Sheet';
import { RepeatPicker, repeatState, toRepeat, type RepeatState } from '../calendar/RepeatPicker';

/** Add or edit a task in the shared list (Curio Cabinet's to-dos, with an optional section). */
function TaskSheet({ spec }: { spec: SheetSpec }) {
  const editId = (spec.editId as string | undefined) ?? null;
  const prev = editId ? data.get().todos.get(editId) : undefined;
  const today = ltToday();
  const [title, setTitle] = useState(prev?.title ?? '');
  const [priority, setPriority] = useState<TodoPriority>(prev?.priority ?? 'normal');
  const [section, setSection] = useState<SectionId | 'none'>(prev?.section ?? ((spec.section as SectionId | undefined) || 'none'));
  const [due, setDue] = useState<string>(prev?.due ?? ((spec.due as string | undefined) || ''));
  const [rep, setRep] = useState<RepeatState>(() => repeatState(prev ? taskRepeat(data.get(), prev.id) : null, prev?.due || today));
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    const { repeat } = toRepeat(rep);
    // A repeating task counts from its due day: today when it has none.
    const day = due || (repeat ? today : '');
    const rerr = repeat && checkRepeat(repeat, day);
    if (rerr) return setError(rerr);
    const draft = { title, priority, due: day || null, section: section === 'none' ? null : section };
    let id = prev?.id;
    if (prev) {
      const err = updateTodo(prev.id, draft);
      if (err) return setError(err);
    } else {
      const r = addTodo(draft);
      if ('error' in r) return setError(r.error);
      id = r.id;
    }
    const err = setTaskRepeat(id!, repeat);
    if (err) return setError(err);
    closeSheet();
  };

  const nextMonday = addDays(today, 7 - weekdayIndex(today));
  const saturday = addDays(today, (12 - weekdayIndex(today)) % 7);
  const quick = [
    ['', 'No date'],
    [today, 'Today'],
    [addDays(today, 1), 'Tomorrow'],
    [saturday, 'Weekend'],
    [nextMonday, 'Next Mon'],
    [addDays(today, 7), 'In a week'],
  ] as const;

  return (
    <Sheet
      title={prev ? 'Edit task' : 'New task'}
      onClose={closeSheet}
      accent={section === 'none' ? undefined : section}
      footer={
        <>
          {prev && (
            <button type="button" className="i-btn i-btn--danger" onClick={() => (removeTask(prev.id), closeSheet())}>
              Delete
            </button>
          )}
          {prev && !prev.done_at && (
            <button type="button" className="i-btn" onClick={() => (toggleTask(prev.id), closeSheet())}>
              Done
            </button>
          )}
          <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={save} disabled={!title.trim()}>
            {prev ? 'Save' : 'Add task'}
          </button>
        </>
      }
    >
      <label className="i-field">
        <span className="i-lab">Task</span>
        <input className="i-input" data-autofocus value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), save())} placeholder="What needs doing?" />
      </label>
      <div className="i-field">
        <span className="i-lab">Priority</span>
        <Picks label="Priority" value={priority} onChange={setPriority} options={[{ id: 'high', label: 'P1 High' }, { id: 'normal', label: 'P2 Normal' }, { id: 'low', label: 'P3 Low' }]} />
      </div>
      <div className="i-field">
        <span className="i-lab">Due</span>
        <div className="i-picks" role="group" aria-label="Due">
          {quick.map(([d, l]) => (
            <button key={l} type="button" className="i-pick" aria-pressed={due === d} onClick={() => setDue(d)}>
              {l}
            </button>
          ))}
          <input className="i-input" type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Due date" style={{ width: 'auto', minHeight: 42 }} />
        </div>
      </div>
      <RepeatPicker value={rep} anchor={due || today} onChange={setRep} ends={false} />
      <div className="i-field">
        <span className="i-lab">Section · optional</span>
        <Picks label="Section" value={section} onChange={setSection} options={[{ id: 'none', label: 'None' }, ...SECTION_IDS.map((id) => ({ id, label: sectionInfo(id).name }))]} />
      </div>
      {error && (
        <p className="i-error" role="alert">
          {error}
        </p>
      )}
      {prev && !prev.done_at && (
        <button
          type="button"
          className="i-link"
          onClick={() => openSheet({ type: 'event', preset: { title: prev.title, section: prev.section ?? undefined, kind: 'session', date: prev.due && prev.due >= today ? prev.due : today } })}
        >
          Block time for it in the calendar
        </button>
      )}
      <p className="i-note">
        Shared with Curio Cabinet's to-do list. Tagged tasks also show in their section. A repeating task adds its next one when you tick it.
      </p>
    </Sheet>
  );
}

registerSheet('task', TaskSheet);
