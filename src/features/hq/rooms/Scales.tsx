/** 天秤: a weighted decision matrix, and the part that matters: what would flip the answer. */
import { useMemo, useState } from 'react';
import { navigate, useRoute } from '../../../app/router';
import { sectionRecords } from '../../../data/lt';
import { deleteRecord } from '../../../data/records';
import { data } from '../../../data/store';
import { flipPoints, isClose, rankOptions, UNI_CRITERIA, type Criterion, type Decision } from '../../../domain/hq/scales';
import { useStore } from '../../../lib/createStore';
import { uuid } from '../../../lib/random';
import { H2, Stepper } from '../../../ui/i/bits';
import { RoomHead } from '../HqView';
import { saveDecision, useHq } from '../store';

function Editor({ d }: { d: Decision }) {
  const st = useStore(data, (s) => s);
  const [newOption, setNewOption] = useState('');
  const [newCrit, setNewCrit] = useState('');
  // Until you choose, the first option is the open one, even if it was only just added.
  const [chosenOpen, setOpen] = useState<string | null | undefined>(undefined);
  const open = chosenOpen === undefined ? d.options[0] ?? null : chosenOpen;
  const put = (patch: Partial<Decision>) => saveDecision({ ...d, ...patch }, d.id);
  const ranked = useMemo(() => rankOptions(d), [d]);
  const flips = useMemo(() => flipPoints(d), [d]);
  const unis = useMemo(() => sectionRecords(st, 'future', 'uni').map((r) => String(r.data.name ?? '')).filter(Boolean), [st]);
  const addOption = (name: string) => {
    const n = name.trim().slice(0, 60);
    if (n && !d.options.includes(n)) put({ options: [...d.options, n] });
  };
  const addCrit = (name: string) => {
    const n = name.trim().slice(0, 60);
    if (n && !d.criteria.some((c) => c.name === n)) put({ criteria: [...d.criteria, { id: uuid().slice(0, 8), name: n, weight: 3 }] });
  };
  const setWeight = (c: Criterion, w: number) => put({ criteria: d.criteria.map((x) => (x.id === c.id ? { ...x, weight: Math.max(1, Math.min(5, w)) } : x)) });
  const setScore = (opt: string, c: Criterion, v: number) => put({ scores: { ...d.scores, [opt]: { ...d.scores[opt], [c.id]: v } } });
  const ready = d.options.length >= 2 && d.criteria.length >= 1;
  return (
    <>
      <input className="i-input sc-title" defaultValue={d.title} onBlur={(e) => e.target.value.trim() && e.target.value !== d.title && put({ title: e.target.value })} aria-label="What you’re deciding" />
      <H2>The options</H2>
      <div className="i-chips i-chips--wrap">
        {d.options.map((o) => (
          <button key={o} type="button" className="i-chip" aria-label={`Remove option: ${o}`} onClick={() => put({ options: d.options.filter((x) => x !== o) })}>
            {o} ✕
          </button>
        ))}
      </div>
      <form
        className="sc-add"
        onSubmit={(e) => {
          e.preventDefault();
          addOption(newOption);
          setNewOption('');
        }}
      >
        <input className="i-input" value={newOption} onChange={(e) => setNewOption(e.target.value)} placeholder="Add an option" aria-label="Add an option" />
        <button type="submit" className="i-btn i-btn--sm" disabled={!newOption.trim()}>
          Add
        </button>
      </form>
      {unis.length > 0 && !d.options.length && (
        <button type="button" className="i-link" onClick={() => put({ options: unis.slice(0, 13) })}>
          Use my university shortlist
        </button>
      )}
      <H2 aside="how much each matters, 1–5">What matters</H2>
      <div className="i-pnl i-pnl--flush">
        {d.criteria.map((c) => (
          <div key={c.id} className="i-kv">
            <span>{c.name}</span>
            <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <Stepper value={c.weight} label={`weight of ${c.name}`} onStep={(s) => setWeight(c, c.weight + s)} />
              <button type="button" className="i-btn i-btn--sm" onClick={() => put({ criteria: d.criteria.filter((x) => x.id !== c.id) })} aria-label={`Remove: ${c.name}`}>
                ✕
              </button>
            </span>
          </div>
        ))}
      </div>
      <form
        className="sc-add"
        onSubmit={(e) => {
          e.preventDefault();
          addCrit(newCrit);
          setNewCrit('');
        }}
      >
        <input className="i-input" value={newCrit} onChange={(e) => setNewCrit(e.target.value)} placeholder="Add what matters" aria-label="Add what matters" />
        <button type="submit" className="i-btn i-btn--sm" disabled={!newCrit.trim()}>
          Add
        </button>
      </form>
      {!d.criteria.length && (
        <button type="button" className="i-link" onClick={() => put({ criteria: UNI_CRITERIA.map((name) => ({ id: uuid().slice(0, 8), name, weight: 3 })) })}>
          Start from what usually matters for a university
        </button>
      )}
      {ready && (
        <>
          <H2 aside="0 to 10">Score each one</H2>
          <div className="sc-scores">
            {d.options.map((o) => (
              <details key={o} open={open === o} className="sc-opt">
                <summary
                  onClick={(e) => {
                    e.preventDefault();
                    setOpen(open === o ? null : o);
                  }}
                >
                  {o}
                </summary>
                {d.criteria.map((c) => {
                  const v = d.scores[o]?.[c.id] ?? 5;
                  return (
                    <label key={c.id} className="sc-slider">
                      <span>
                        {c.name} <b className="i-mono">{v}</b>
                      </span>
                      <input type="range" min={0} max={10} value={v} onChange={(e) => setScore(o, c, Number(e.target.value))} aria-label={`${o}: ${c.name}`} />
                    </label>
                  );
                })}
              </details>
            ))}
          </div>
          <H2>The scales say</H2>
          <div className="i-pnl i-stack">
            {ranked.map((r, i) => (
              <div key={r.option} className={`sc-bar${i === 0 ? ' is-top' : ''}`}>
                <span>{r.option}</span>
                <i style={{ width: `${r.score}%` }} />
                <b className="i-mono">{Math.round(r.score)}</b>
              </div>
            ))}
            {isClose(ranked) && <p className="i-note">Too close to call: under 5 points. The numbers won’t decide this one for you.</p>}
            {flips.length > 0 ? (
              <p className="i-note">
                What would flip it to {ranked[1].option}: {flips.map((f) => `${f.criterion} at weight ${f.weight}`).join(', ')}. If you’re unsure about those weights, that’s the real question.
              </p>
            ) : (
              <p className="i-note">No single weight changes the answer. It’s a sturdy result.</p>
            )}
            <p className="lh-prompt">When you saw who won, were you relieved or disappointed? That’s information the numbers don’t have.</p>
          </div>
          <H2>What I decided</H2>
          <div className="i-chips i-chips--wrap" role="group" aria-label="What I decided">
            {d.options.map((o) => (
              <button key={o} type="button" className="i-chip" aria-pressed={d.chose === o} onClick={() => put({ chose: d.chose === o ? null : o })}>
                {o}
              </button>
            ))}
          </div>
        </>
      )}
      <button
        type="button"
        className="i-link"
        onClick={() => {
          deleteRecord(d.id, 'Decision deleted');
          navigate('base', ['scales']);
        }}
      >
        Delete this decision
      </button>
    </>
  );
}

export function ScalesRoom() {
  const route = useRoute();
  const hq = useHq();
  const open = route.rest[1] ? hq.decisions.find((x) => x.id === route.rest[1]) : undefined;
  const [title, setTitle] = useState('');
  const start = (t: string) => {
    const made = saveDecision({ title: t, options: [], criteria: [], scores: {}, chose: null });
    navigate('base', ['scales', made.id]);
  };
  return (
    <div>
      <RoomHead room="scales" />
      {open ? (
        <>
          <button type="button" className="i-link" onClick={() => navigate('base', ['scales'])}>
            ◀ All decisions
          </button>
          <Editor key={open.id} d={open} />
        </>
      ) : (
        <>
          <form
            className="sc-add"
            onSubmit={(e) => {
              e.preventDefault();
              if (title.trim()) start(title);
            }}
          >
            <input className="i-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What are you deciding?" aria-label="What are you deciding?" maxLength={100} />
            <button type="submit" className="i-btn i-btn--sig" disabled={!title.trim()}>
              Weigh it
            </button>
          </form>
          {hq.decisions.length ? (
            <div className="i-pnl i-pnl--flush" style={{ marginTop: 10 }}>
              {hq.decisions.map((d) => {
                const top = rankOptions(d)[0];
                return (
                  <button key={d.id} type="button" className="i-row" onClick={() => navigate('base', ['scales', d.id])}>
                    <span className="i-row__t">
                      <b>{d.title}</b>
                      <small>
                        {d.options.length} options · {d.criteria.length} criteria
                        {d.chose ? ` · decided: ${d.chose}` : top && d.criteria.length ? ` · leaning ${top.option}` : ''}
                      </small>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="i-note" style={{ marginTop: 10 }}>For a decision too big to feel your way through: which university to put first, which summer programme, whether to do both. List the options, say what matters and how much, and score them. The answer matters less than finding out what would change it.</p>
          )}
        </>
      )}
    </div>
  );
}
