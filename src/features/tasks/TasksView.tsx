import { useMemo, useState } from 'react';
import { ChannelBar } from '../../app/Shell';
import { navigate, useRoute } from '../../app/router';
import { openSheet } from '../../app/sheets';
import { useToday } from '../../data/lt';
import { data } from '../../data/store';
import { clearDoneTodos, restoreTodos } from '../../data/todoActions';
import { SECTION_IDS, type SectionId, type Todo } from '../../data/types';
import { toast } from '../../data/ui';
import { addDays } from '../../domain/log/dates';
import { sectionInfo } from '../../domain/sections';
import { useStore } from '../../lib/createStore';
import { accent, Chips } from '../../ui/i/bits';
import { Icon } from '../../ui/i/Icon';
import { TaskRow } from '../../ui/i/RelatedTasks';
import './TaskSheet';

type Show = 'open' | 'today' | 'week' | 'done';
const RANK = { high: 0, normal: 1, low: 2 } as const;

function group(t: Todo, today: string): string {
  if (t.done_at) return 'Done';
  if (!t.due) return 'No date';
  if (t.due < today) return 'Overdue';
  if (t.due === today) return 'Today';
  if (t.due <= addDays(today, 7)) return 'Next 7 days';
  return 'Later';
}
const ORDER = ['Overdue', 'Today', 'Next 7 days', 'Later', 'No date', 'Done'];

export function TasksView() {
  const today = useToday();
  const route = useRoute();
  const todos = useStore(data, (s) => s.todos);
  const [show, setShow] = useState<Show>('open');
  const section = (SECTION_IDS as readonly string[]).includes(route.rest[0] ?? '') ? (route.rest[0] as SectionId) : null;
  const setSection = (s: SectionId | 'all') => navigate('tasks', s === 'all' ? [] : [s], { replace: true });

  const list = useMemo(() => {
    const live = [...todos.values()].filter((t) => !t.deleted_at && (!section || t.section === section));
    const shown = live.filter((t) =>
      show === 'done' ? !!t.done_at : !t.done_at && (show === 'open' || (t.due != null && t.due <= (show === 'today' ? today : addDays(today, 7)))),
    );
    return shown.sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999') || RANK[a.priority] - RANK[b.priority] || b.created_at.localeCompare(a.created_at));
  }, [todos, section, show, today]);
  const counts = useMemo(() => {
    const live = [...todos.values()].filter((t) => !t.deleted_at);
    return { open: live.filter((t) => !t.done_at).length, late: live.filter((t) => !t.done_at && t.due && t.due < today).length };
  }, [todos, today]);

  const groups = ORDER.map((g) => [g, list.filter((t) => group(t, today) === g)] as const).filter(([, l]) => l.length);

  return (
    <div>
      <ChannelBar current="tasks" />
      <header className="i-chhead">
        <div>
          <span className="i-chhead__k">SYS · shared tasks</span>
          <h1>Tasks</h1>
          <p className="i-chhead__sub">{counts.open} open{counts.late ? ` · ${counts.late} late` : ''}</p>
        </div>
        <button type="button" className="i-btn i-btn--sig" onClick={() => openSheet({ type: 'task', section })}>
          <Icon name="plus" /> New
        </button>
      </header>
      <Chips label="Show" value={show} onChange={setShow} options={[{ id: 'open', label: 'Open' }, { id: 'today', label: 'Due today' }, { id: 'week', label: '7 days' }, { id: 'done', label: 'Done' }]} />
      <Chips label="Section" value={section ?? 'all'} onChange={setSection} options={[{ id: 'all' as const, label: 'All' }, ...SECTION_IDS.map((id) => ({ id, label: sectionInfo(id).name, c: id }))]} />
      {groups.length ? (
        groups.map(([g, l]) => (
          <section key={g}>
            <h2 className="i-lab" style={{ margin: '16px 2px 6px', color: g === 'Overdue' ? 'var(--warn)' : undefined }}>
              {g} · {l.length}
            </h2>
            <div className="i-pnl i-pnl--flush">
              {l.map((t) => (
                <div key={t.id} style={accent(t.section ?? null)}>
                  <TaskRow t={t} today={today} />
                </div>
              ))}
            </div>
          </section>
        ))
      ) : (
        <div className="i-pnl i-empty" style={{ marginTop: 12 }}>
          <span>{show === 'done' ? 'Nothing finished with these filters.' : 'Nothing to do here.'}</span>
          {show !== 'done' && (
            <button type="button" className="i-btn i-btn--sm" onClick={() => openSheet({ type: 'task', section })}>
              Add a task
            </button>
          )}
        </div>
      )}
      {show === 'done' && list.length > 0 && (
        <button
          type="button"
          className="i-link"
          onClick={() => {
            const r = clearDoneTodos();
            if (r) toast(`Cleared ${r.ids.length} finished`, { label: 'Undo', run: () => restoreTodos(r.ids, r.at) });
          }}
        >
          Clear finished
        </button>
      )}
      <p className="i-note" style={{ marginTop: 12 }}>
        Shared with Curio Cabinet's to-do list. Each finished task earns 5 XP once; unticking and re-ticking doesn't add more.
      </p>
    </div>
  );
}
