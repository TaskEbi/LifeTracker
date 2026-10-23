import { useMemo, useState } from 'react';
import { navigate, type RouteName } from '../../app/router';
import { registerSheet, sheetRegistry } from '../../app/sheetRegistry';
import { closeSheet, openSheet } from '../../app/sheets';
import { sectionInfo } from '../../domain/sections';
import type { SectionId } from '../../data/types';
import { accent } from '../../ui/i/bits';
import { Sheet } from '../../ui/i/Sheet';

interface Cmd {
  id: string;
  label: string;
  hint: string;
  section?: SectionId;
  /** A sheet type to open, or a route to go to when that sheet doesn't exist (yet). */
  sheet?: string;
  route: RouteName;
}

const CMDS: Cmd[] = [
  { id: 'violin', label: 'log violin', hint: 'type · minutes · pieces', section: 'violin', sheet: 'violin', route: 'violin' },
  { id: 'gym', label: 'start gym', hint: 'follow a template', section: 'gym', route: 'gym' },
  { id: 'sleep', label: 'log sleep', hint: 'bed · wake', section: 'sleep', sheet: 'sleep', route: 'sleep' },
  { id: 'screen', label: 'log screen time', hint: "today's total", section: 'screen', sheet: 'screen', route: 'screen' },
  { id: 'sports', label: 'log sport', hint: 'run · ride · swim · court', section: 'sports', sheet: 'sports', route: 'sports' },
  { id: 'study', label: 'log study', hint: 'subject · minutes', section: 'study', sheet: 'study', route: 'study' },
  { id: 'coding', label: 'log coding', hint: 'session · what clicked', section: 'coding', sheet: 'coding', route: 'coding' },
  { id: 'chess', label: 'log chess', hint: 'puzzles · study', section: 'chess', sheet: 'chess', route: 'chess' },
  { id: 'cabinet', label: 'save to cabinet', hint: 'link · note · photo', section: 'cabinet', route: 'cabinet' },
  { id: 'task', label: 'new task', hint: 'shared task list', sheet: 'task', route: 'tasks' },
  { id: 'event', label: 'new event', hint: 'shared calendar', sheet: 'event', route: 'calendar' },
];

function QuickSheet() {
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return CMDS.filter((c) => !s || c.label.includes(s) || c.hint.includes(s) || c.id.startsWith(s));
  }, [q]);
  const run = (c: Cmd) => {
    if (c.sheet && sheetRegistry.has(c.sheet)) openSheet({ type: c.sheet });
    else {
      closeSheet();
      navigate(c.route);
    }
  };
  return (
    <Sheet title="Command" onClose={closeSheet}>
      <label className="q-in">
        <span aria-hidden="true">›</span>
        <input
          data-autofocus
          className="q-in__input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && list[0]) {
              e.preventDefault();
              run(list[0]);
            }
          }}
          placeholder="type: violin, gym, sleep…"
          aria-label="Filter commands"
          autoComplete="off"
        />
      </label>
      <div className="q-list" role="list">
        {list.map((c) => (
          <button key={c.id} type="button" className="q-item" style={accent(c.section ?? null)} onClick={() => run(c)} role="listitem">
            <span className="q-item__code i-mono">{c.section ? sectionInfo(c.section).code : 'SYS'}</span>
            <span>
              {c.label}
              <small className="i-mono">{c.hint}</small>
            </span>
            <span className="i-mono i-dim" aria-hidden="true">
              ↵
            </span>
          </button>
        ))}
        {!list.length && <p className="i-note">No matching command.</p>}
      </div>
    </Sheet>
  );
}

registerSheet('quick', QuickSheet);
