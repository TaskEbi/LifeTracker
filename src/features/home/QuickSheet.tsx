import { useMemo, useState } from 'react';
import { navigate, type RouteName } from '../../app/router';
import { registerSheet, sheetRegistry } from '../../app/sheetRegistry';
import { closeSheet, openSheet } from '../../app/sheets';
import { sectionInfo } from '../../domain/sections';
import type { SectionId } from '../../data/types';
import { toast } from '../../data/ui';
import { describeIntent, hasIntents, parseScroll, type Intent } from '../../domain/hq/scroll';
import { accent } from '../../ui/i/bits';
import { Sheet } from '../../ui/i/Sheet';
import { saveScroll, scrollContext } from '../hq/scrollActions';

interface Cmd {
  id: string;
  label: string;
  hint: string;
  section?: SectionId;
  /** A sheet type to open, or a route to go to when that sheet doesn't exist (yet). */
  sheet?: string;
  route: RouteName;
  rest?: string[];
}

const CMDS: Cmd[] = [
  { id: 'focus', label: 'start focus timer', hint: 'timer · then log it', sheet: 'focus', route: 'home' },
  { id: 'violin', label: 'log violin', hint: 'type · minutes · pieces', section: 'violin', sheet: 'violin', route: 'violin' },
  { id: 'gym', label: 'start gym', hint: 'follow a template', section: 'gym', route: 'gym' },
  { id: 'sleep', label: 'log sleep', hint: 'bed · wake', section: 'sleep', sheet: 'sleep', route: 'sleep' },
  { id: 'screen', label: 'log screen time', hint: "today's total", section: 'screen', sheet: 'screen', route: 'screen' },
  { id: 'sports', label: 'log sport', hint: 'run · ride · swim · court', section: 'sports', sheet: 'sports', route: 'sports' },
  { id: 'study', label: 'log study', hint: 'subject · minutes', section: 'study', sheet: 'study', route: 'study' },
  { id: 'coding', label: 'log coding', hint: 'session · what clicked', section: 'coding', sheet: 'coding', route: 'coding' },
  { id: 'chess', label: 'log chess', hint: 'puzzles · study', section: 'chess', sheet: 'chess', route: 'chess' },
  { id: 'future', label: 'log uni prep', hint: 'SAT · essays · applications', section: 'future', sheet: 'future', route: 'future' },
  { id: 'reading', label: 'log reading', hint: 'book · minutes · where you got to', section: 'reading', sheet: 'reading', route: 'reading' },
  { id: 'maths', label: 'log maths', hint: 'problems · past papers · contests', section: 'maths', sheet: 'maths', route: 'maths' },
  { id: 'cabinet', label: 'save to cabinet', hint: 'link · note · photo', section: 'cabinet', route: 'cabinet' },
  { id: 'task', label: 'new task', hint: 'shared task list', sheet: 'task', route: 'tasks' },
  { id: 'event', label: 'new event', hint: 'shared calendar', sheet: 'event', route: 'calendar' },
  { id: 'bucket', label: 'bucket list', hint: 'add · cross off', route: 'bucket' },
  { id: 'hangar', label: 'hangar', hint: 'your robot · chests · bounties', route: 'hangar' },
  { id: 'shop', label: 'shop', hint: 'hangar · this week’s shelf', route: 'hangar', rest: ['shop'] },
  { id: 'capsule', label: 'capsule machine', hint: 'hangar · gashapon', route: 'hangar', rest: ['capsule'] },
  { id: 'festival', label: 'festival', hint: 'hangar · seasonal event', route: 'hangar', rest: ['events'] },
  { id: 'arcade', label: 'arcade', hint: 'hangar · bingo · sugoroku · fishing', route: 'hangar', rest: ['arcade'] },
  { id: 'bingo', label: 'bingo', hint: 'arcade · this week’s card', route: 'hangar', rest: ['arcade', 'bingo'] },
  { id: 'sugoroku', label: 'sugoroku', hint: 'arcade · roll the dice', route: 'hangar', rest: ['arcade', 'board'] },
  { id: 'fishing', label: 'fishing pond', hint: 'arcade · cast a line', route: 'hangar', rest: ['arcade', 'pond'] },
  { id: 'papers', label: 'past papers', hint: 'study · every paper to 2021 · hard questions · retry', section: 'study', route: 'study', rest: ['papers'] },
  { id: 'hardqs', label: 'hard physics questions', hint: 'past papers · worst-answered by topic', section: 'study', route: 'study', rest: ['papers', 'hard'] },
  { id: 'stage', label: 'stage', hint: 'performances · tests · matches · races', route: 'stage' },
  { id: 'result', label: 'log a result', hint: 'stage · concert · test · match · race', sheet: 'stage-pick', route: 'stage' },
  { id: 'repertoire', label: 'violin repertoire', hint: 'every piece you’ve played', section: 'violin', route: 'violin', rest: ['repertoire'] },
  { id: 'album', label: 'photo of the day', hint: 'album · your face · memories · the year’s reel', route: 'album' },
  { id: 'struggling', label: 'i’m struggling', hint: 'the lighthouse · your own messages · motivation', route: 'base', rest: ['lighthouse', 'read'] },
  { id: 'quotes', label: 'motivating quotes', hint: 'the lighthouse · words to keep going', route: 'base', rest: ['lighthouse', 'words'] },
  { id: 'plan', label: 'plan my day', hint: 'the forge · fill the free gaps', route: 'base', rest: ['forge'] },
  { id: 'close', label: 'close the day', hint: 'leftovers · tomorrow’s first thing', route: 'base', rest: ['close'] },
  { id: 'diary', label: 'five-year diary', hint: 'one line a day', route: 'base', rest: ['diary'] },
  { id: 'breathe', label: 'breathe', hint: 'box · long out · 4-7-8', route: 'base', rest: ['breath'] },
  { id: 'mock', label: 'mock exam', hint: 'exam hall · SAT · TMUA · A-level clock', route: 'base', rest: ['exam'] },
  { id: 'tree', label: 'tech tree', hint: 'what to learn next', section: 'coding', route: 'coding', rest: ['tree'] },
  { id: 'road', label: 'tōkaidō road', hint: 'your km from Edo to Kyoto', section: 'sports', route: 'sports', rest: ['road'] },
  { id: 'race', label: 'race kit', hint: 'pace band · fuel · race week', section: 'sports', route: 'sports', rest: ['race'] },
  { id: 'bouncer', label: 'about to scroll', hint: 'the bouncer · one minute first', section: 'screen', route: 'screen', rest: ['bouncer'] },
  { id: 'vision', label: 'board vision', hint: '30-second square drill', section: 'chess', route: 'chess', rest: ['vision'] },
  { id: 'hideout', label: 'hideout', hint: 'review · recall · lab · oracle · vault', route: 'base' },
  { id: 'recall', label: 'recall cards', hint: 'the dojo · spaced repetition', route: 'base', rest: ['dojo'] },
  { id: 'review', label: 'weekly review', hint: 'the war room · Big Three', route: 'base', rest: ['war'] },
  { id: 'metronome', label: 'metronome', hint: 'practice room · tuner · drone', section: 'violin', route: 'violin', rest: ['room'] },
];

const EXAMPLES = ['violin 45 bach partita', 'ran 8k in 44', 'physics 40 past paper', 'read 30 dune', 'slept 23:30-7:10', 'screen 2h15', 'task buy rosin fri', 'wish see the aurora', 'yesterday: gym 60, chess 30'];

const SECTION_OF = (i: Intent): SectionId | null => (i.kind === 'session' ? i.section : i.kind === 'night' ? 'sleep' : i.kind === 'screen' ? 'screen' : null);

function QuickSheet() {
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [help, setHelp] = useState(false);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return CMDS.filter((c) => !s || c.label.includes(s) || c.hint.includes(s) || c.id.startsWith(s));
  }, [q]);
  const ctx = useMemo(() => scrollContext(), []);
  const intents = useMemo(() => (q.trim() ? parseScroll(q, ctx) : []), [q, ctx]);
  const understood = hasIntents(intents);
  const run = (c: Cmd) => {
    if (c.sheet && sheetRegistry.has(c.sheet)) openSheet({ type: c.sheet });
    else {
      closeSheet();
      navigate(c.route, c.rest ?? []);
    }
  };
  const saveAll = () => {
    const { saved, errors } = saveScroll(intents);
    if (errors.length) {
      setError(errors.join(' '));
      if (!saved) return;
    }
    if (saved) {
      toast(`Logged ${saved} ${saved === 1 ? 'thing' : 'things'}`);
      if (!errors.length) closeSheet();
      else setQ(intents.filter((i) => i.kind === 'unknown').map((i) => (i as { text: string }).text).join(', '));
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
          onChange={(e) => {
            setQ(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            if (understood) saveAll();
            else if (list[0]) run(list[0]);
          }}
          placeholder="violin 45, ran 8k in 44, slept 7h30…"
          aria-label="Type what you did, or filter commands"
          autoComplete="off"
        />
      </label>
      {understood && (
        <section className="q-scroll" aria-label="What this will log">
          <span className="q-scroll__k" aria-hidden="true">
            巻物
          </span>
          <ul>
            {intents.map((i, k) => (
              <li key={k} className={i.kind === 'unknown' ? 'is-unknown' : ''} style={accent(SECTION_OF(i))}>
                {i.kind === 'unknown' ? (
                  <>
                    <b>Not sure about “{i.text}”</b>
                    {i.hint ? ` ${i.hint}` : ' Left out.'}
                  </>
                ) : (
                  describeIntent(i, ctx.today)
                )}
              </li>
            ))}
          </ul>
          <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={saveAll}>
            Log {intents.filter((i) => i.kind !== 'unknown').length === 1 ? 'it' : `all ${intents.filter((i) => i.kind !== 'unknown').length}`}
          </button>
        </section>
      )}
      {error && (
        <p className="i-error" role="alert">
          {error}
        </p>
      )}
      {!q && (
        <button type="button" className="i-link" onClick={() => setHelp(!help)} aria-expanded={help}>
          巻物 You can also just type what you did {help ? '▲' : '▼'}
        </button>
      )}
      {help && !q && (
        <div className="i-chips i-chips--wrap" aria-label="Examples">
          {EXAMPLES.map((x) => (
            <button key={x} type="button" className="i-chip" onClick={() => setQ(x)}>
              {x}
            </button>
          ))}
        </div>
      )}
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
        {!list.length && !understood && <p className="i-note">No matching command.</p>}
      </div>
    </Sheet>
  );
}

registerSheet('quick', QuickSheet);
