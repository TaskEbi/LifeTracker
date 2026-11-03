/** 闘技場: tasks fight in pairs until there's a ranking. For when everything feels equally urgent. */
import { useMemo, useState } from 'react';
import { navigate } from '../../../app/router';
import { useToday } from '../../../data/lt';
import { data } from '../../../data/store';
import { updateTodo } from '../../../data/todoActions';
import type { Todo } from '../../../data/types';
import { toast } from '../../../data/ui';
import { answerBout, currentPair, isFinished, maxQuestions, startBout, type Bout } from '../../../domain/hq/arena';
import { shortDay } from '../../../domain/log/dates';
import { sectionInfo } from '../../../domain/sections';
import { useStore } from '../../../lib/createStore';
import { accent } from '../../../ui/i/bits';
import { RoomHead } from '../HqView';

const MAX = 12;

export function ArenaRoom() {
  const today = useToday();
  const todos = useStore(data, (s) => s.todos);
  const open = useMemo(() => [...todos.values()].filter((t) => !t.deleted_at && !t.done_at).sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999')), [todos]);
  const [bout, setBout] = useState<Bout<Todo> | null>(null);
  const [asked, setAsked] = useState(0);
  const [total, setTotal] = useState(0);

  const begin = () => {
    const list = open.slice(0, MAX);
    setBout(startBout(list));
    setAsked(0);
    setTotal(maxQuestions(list.length));
  };
  const answer = (newcomer: boolean) => {
    setBout((b) => (b ? answerBout(b, newcomer) : b));
    setAsked((n) => n + 1);
  };
  const apply = (ranked: Todo[]) => {
    let n = 0;
    ranked.forEach((t, i) => {
      const priority = i < 3 ? ('high' as const) : t.priority === 'high' ? ('normal' as const) : t.priority;
      if (priority !== t.priority && !updateTodo(t.id, { title: t.title, priority, due: t.due, section: t.section })) n++;
    });
    toast(n ? `Top three are now high priority` : 'Already in that order');
    navigate('tasks');
  };

  const pair = bout ? currentPair(bout) : null;
  const card = (t: Todo, onClick: () => void) => (
    <button type="button" className="ar-card" style={accent(t.section ?? null)} onClick={onClick}>
      <b>{t.title}</b>
      <small>
        {t.section ? sectionInfo(t.section).name : 'No section'}
        {t.due ? ` · due ${shortDay(t.due, today)}` : ''}
      </small>
    </button>
  );

  return (
    <div>
      <RoomHead room="arena" />
      {!bout && (
        <div className="i-pnl i-stack">
          <p className="i-note">
            {open.length < 2 ? 'You need at least two open tasks to have a fight.' : `Everything feels urgent? Make them fight. ${open.length > MAX ? `The ${MAX} soonest` : `Your ${open.length} open tasks`} go in, two at a time. At most ${maxQuestions(Math.min(open.length, MAX))} taps, then you know what matters.`}
          </p>
          <button type="button" className="i-btn i-btn--sig i-btn--block" disabled={open.length < 2} onClick={begin}>
            Start the tournament
          </button>
        </div>
      )}
      {bout && pair && (
        <section className="ar-ring" aria-label="Which matters more">
          <p className="ar-q">Which matters more?</p>
          {card(pair[0], () => answer(true))}
          <span className="ar-vs" aria-hidden="true">
            VS
          </span>
          {card(pair[1], () => answer(false))}
          <span className="ar-bar" role="progressbar" aria-label="Tournament progress" aria-valuenow={Math.min(100, Math.round((asked / Math.max(1, total)) * 100))} aria-valuemin={0} aria-valuemax={100}>
            <i style={{ width: `${Math.min(100, (asked / Math.max(1, total)) * 100)}%` }} />
          </span>
        </section>
      )}
      {bout && isFinished(bout) && (
        <section aria-label="The ranking">
          <ol className="ar-rank">
            {bout.sorted.map((t, i) => (
              <li key={t.id} className={i === 0 ? 'is-champ' : ''} style={accent(t.section ?? null)}>
                <span className="ar-rank__n" aria-hidden="true">
                  {i === 0 ? '王' : i + 1}
                </span>
                <span>
                  <b>{t.title}</b>
                  {t.due && <small>due {shortDay(t.due, today)}</small>}
                </span>
              </li>
            ))}
          </ol>
          <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={() => apply(bout.sorted)}>
            Make the top three high priority
          </button>
          <button type="button" className="i-link" onClick={() => setBout(null)}>
            Leave my tasks as they are
          </button>
          <p className="i-note">The one at the top is the one to do first, whatever else is shouting.</p>
        </section>
      )}
    </div>
  );
}
