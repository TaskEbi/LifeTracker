/** 道場: spaced recall. Today's cards, a mistake notebook that shows where marks leak, blanks cut from highlights. */
import { useEffect, useMemo, useRef, useState } from 'react';
import { registerSheet } from '../../../app/sheetRegistry';
import { closeSheet, openSheet, type SheetSpec } from '../../../app/sheets';
import { prefValue, useToday } from '../../../data/lt';
import { deleteRecord } from '../../../data/records';
import { data } from '../../../data/store';
import { toast } from '../../../data/ui';
import { blankWords, CAUSES, clozeOf, deckStats, GRADES, hasBlank, intervalLabel, leaks, reviewQueue, tappableWords, type Card, type Cause, type Grade } from '../../../domain/hq/srs';
import { addDays } from '../../../domain/log/dates';
import { useStore } from '../../../lib/createStore';
import { H2, Meter, Picks } from '../../../ui/i/bits';
import { Sheet } from '../../../ui/i/Sheet';
import { linesIn } from '../../reading/actions';
import { subjectsOf } from '../../study/model';
import { RoomHead } from '../HqView';
import { gradeCard, hqOf, saveCard, useHq } from '../store';

const GRADE_LABEL: Record<Grade, string> = { again: 'Again', hard: 'Hard', good: 'Good', easy: 'Easy' };

function faces(c: Card) {
  if (hasBlank(c.front)) {
    const b = clozeOf(c.front);
    return { q: b.hidden, a: b.whole, sub: c.back };
  }
  return { q: c.front, a: c.back, sub: '' };
}

function Review({ queue, today, onDone }: { queue: Card[]; today: string; onDone: (r: { reviewed: number; again: number; minutes: number }) => void }) {
  const [list, setList] = useState(queue);
  const [flipped, setFlipped] = useState(false);
  const stats = useRef({ reviewed: 0, again: 0, started: Date.now() });
  const card = list[0];
  const grade = (g: Grade) => {
    // Re-read: an earlier pass in this session may have changed its schedule.
    const fresh = hqOf(data.get()).cards.find((c) => c.id === card.id) ?? card;
    gradeCard(fresh, g, today);
    stats.current.reviewed++;
    if (g === 'again') stats.current.again++;
    setFlipped(false);
    const rest = list.slice(1);
    // Forgotten: once more at the end of this sitting.
    const next = g === 'again' ? [...rest, fresh] : rest;
    if (next.length) setList(next);
    else onDone({ reviewed: stats.current.reviewed, again: stats.current.again, minutes: Math.round((Date.now() - stats.current.started) / 60000) });
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea')) return;
      if (e.key === ' ') {
        e.preventDefault();
        setFlipped((f) => !f);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  if (!card) return null;
  const f = faces(card);
  return (
    <section className="hq-review" aria-label="Recall session">
      <p className="hq-review__n i-mono">
        {list.length} to go · {card.deck}
      </p>
      <button type="button" className={`hq-card${flipped ? ' is-flipped' : ''}`} onClick={() => setFlipped(!flipped)} aria-label={flipped ? 'Show the question' : 'Show the answer'}>
        <span className="hq-card__in">
          <span className="hq-card__face">
            <span className="hq-card__txt">{f.q}</span>
            <small>Tap for the answer</small>
          </span>
          <span className="hq-card__face hq-card__face--back">
            <span className="hq-card__txt">{f.a || '(no answer written)'}</span>
            {f.sub && <small>{f.sub}</small>}
          </span>
        </span>
      </button>
      {flipped ? (
        <div className="hq-grades" role="group" aria-label="How well did you remember it">
          {GRADES.map((g) => (
            <button key={g} type="button" className={`hq-grade hq-grade--${g}`} onClick={() => grade(g)}>
              <b>{GRADE_LABEL[g]}</b>
              <small>{intervalLabel((hqOf(data.get()).cards.find((c) => c.id === card.id) ?? card).srs, g, today)}</small>
            </button>
          ))}
        </div>
      ) : (
        <button type="button" className="i-btn i-btn--block" onClick={() => setFlipped(true)}>
          Show answer
        </button>
      )}
    </section>
  );
}

function CardSheet({ spec }: { spec: SheetSpec }) {
  const today = useToday();
  const hq = useHq();
  const st = useStore(data, (s) => s);
  const editId = spec.editId as string | undefined;
  const prev = editId ? hq.cards.find((c) => c.id === editId) : undefined;
  const mistake = spec.mistake === true || prev?.source === 'mistake';
  const decks = useMemo(() => [...new Set([...subjectsOf(prefValue(st, 'study_subjects')), ...hq.cards.map((c) => c.deck), 'Algorithms', 'Music theory'])], [st, hq.cards]);
  const [deck, setDeck] = useState(prev?.deck ?? (spec.deck as string) ?? decks[0]);
  const [front, setFront] = useState(prev?.front ?? '');
  const [back, setBack] = useState(prev?.back ?? '');
  const [cause, setCause] = useState<Cause | null>(prev?.cause ?? null);
  const ok = front.trim() && (back.trim() || hasBlank(front));
  const save = (more: boolean) => {
    saveCard({ deck, front, back, source: mistake ? 'mistake' : prev?.source ?? 'typed', cause }, today, editId);
    if (more) {
      setFront('');
      setBack('');
      setCause(null);
      toast('Card added');
    } else closeSheet();
  };
  return (
    <Sheet
      title={prev ? 'Edit card' : mistake ? 'Log a mistake' : 'New card'}
      onClose={closeSheet}
      footer={
        <>
          {prev && (
            <button type="button" className="i-btn i-btn--danger" onClick={() => (deleteRecord(prev.id, 'Card deleted'), closeSheet())}>
              Delete
            </button>
          )}
          {!prev && (
            <button type="button" className="i-btn" disabled={!ok} onClick={() => save(true)}>
              Save, add another
            </button>
          )}
          <button type="button" className="i-btn i-btn--sig i-btn--block" disabled={!ok} onClick={() => save(false)}>
            Save
          </button>
        </>
      }
    >
      <div className="i-field">
        <span className="i-lab">Deck</span>
        <input className="i-input" list="hq-decks" value={deck} onChange={(e) => setDeck(e.target.value)} aria-label="Deck" maxLength={40} />
        <datalist id="hq-decks">
          {decks.map((d) => (
            <option key={d} value={d} />
          ))}
        </datalist>
      </div>
      <label className="i-field">
        <span className="i-lab">{mistake ? 'The question, or what you got wrong' : 'Question'}</span>
        <textarea data-autofocus className="i-textarea" value={front} onChange={(e) => setFront(e.target.value)} maxLength={2000} placeholder={mistake ? 'e.g. Integrated by parts the wrong way round in Q7' : 'e.g. What does the second derivative test need?'} />
      </label>
      <label className="i-field">
        <span className="i-lab">{mistake ? 'What to do next time' : 'Answer'}</span>
        <textarea className="i-textarea" value={back} onChange={(e) => setBack(e.target.value)} maxLength={2000} />
      </label>
      {mistake && <Picks label="Why it went wrong" value={cause} onChange={setCause} options={CAUSES.map((c) => ({ id: c.id, label: c.label }))} />}
      {!mistake && <p className="i-note">Wrap words in double braces to make a blank: the {'{{mitochondria}}'} is the powerhouse of the cell.</p>}
    </Sheet>
  );
}
registerSheet('hq-card', CardSheet);

/** Go through highlights one at a time and tap the words to hide. */
function CutSheet() {
  const today = useToday();
  const hq = useHq();
  const st = useStore(data, (s) => s);
  const used = useMemo(() => new Set(hq.cards.map((c) => c.highlightId).filter(Boolean)), [hq.cards]);
  const lines = useMemo(() => linesIn(st).filter((h) => h.text.trim() && !used.has(h.id)).sort((a, b) => Number(b.fav) - Number(a.fav)), [st, used]);
  const [skipped, setSkipped] = useState(0);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const line = lines[skipped];
  const words = useMemo(() => (line ? tappableWords(line.text) : []), [line]);
  const flip = (i: number) => {
    const n = new Set(picked);
    if (n.has(i)) n.delete(i);
    else n.add(i);
    setPicked(n);
  };
  const next = () => {
    setPicked(new Set());
    setSkipped(skipped + 1);
  };
  const save = () => {
    saveCard({ deck: 'Reading', front: blankWords(words, picked), back: line.book, source: 'highlight', highlightId: line.id }, today);
    setPicked(new Set());
    toast('Card cut');
  };
  return (
    <Sheet
      title="Cut a card from a highlight"
      onClose={closeSheet}
      footer={
        line ? (
          <>
            <button type="button" className="i-btn" onClick={next}>
              Skip
            </button>
            <button type="button" className="i-btn i-btn--sig i-btn--block" disabled={!picked.size} onClick={save}>
              Save card
            </button>
          </>
        ) : undefined
      }
    >
      {line ? (
        <>
          <p className="i-note">Tap the words worth remembering. They become the blank.</p>
          <div className="hq-cut" role="group" aria-label="Words in this highlight">
            {words.map((w, i) => (
              <button key={i} type="button" className="hq-cut__w" aria-pressed={picked.has(i)} onClick={() => flip(i)}>
                {w}
              </button>
            ))}
          </div>
          <p className="i-note">{line.book}</p>
        </>
      ) : (
        <p className="i-note">{skipped ? 'That’s all of them.' : 'No highlights left to cut. Add some in Reading → Lines, or import your Kindle clippings.'}</p>
      )}
    </Sheet>
  );
}
registerSheet('hq-cut', CutSheet);

export function DojoRoom() {
  const today = useToday();
  const hq = useHq();
  const [session, setSession] = useState<Card[] | null>(null);
  const [result, setResult] = useState<{ reviewed: number; again: number; minutes: number } | null>(null);
  const [deck, setDeck] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const queue = useMemo(() => reviewQueue(hq.cards, today, deck), [hq.cards, today, deck]);
  const decks = useMemo(() => deckStats(hq.cards, today), [hq.cards, today]);
  const leak = useMemo(() => leaks(hq.cards), [hq.cards]);
  const mature = hq.cards.filter((c) => c.srs.interval >= 21).length;
  const from = addDays(today, -30);
  const recent = hq.recall.filter((r) => r.date >= from);
  const reviewed = recent.reduce((n, r) => n + r.reviewed, 0);
  const again = recent.reduce((n, r) => n + r.again, 0);
  const memory = reviewed >= 20 ? Math.round((1 - again / reviewed) * 100) : null;
  const q = search.trim().toLowerCase();
  const found = q ? hq.cards.filter((c) => `${c.front} ${c.back} ${c.deck}`.toLowerCase().includes(q)).slice(0, 30) : [];

  if (session) {
    return (
      <div>
        <RoomHead room="dojo" />
        <Review
          queue={session}
          today={today}
          onDone={(r) => {
            setSession(null);
            setResult(r);
          }}
        />
        <button type="button" className="i-link" onClick={() => setSession(null)}>
          Stop for now
        </button>
      </div>
    );
  }

  return (
    <div>
      <RoomHead room="dojo" />
      {result && (
        <div className="hq-sealed" role="status">
          <span className="hq-sealed__stamp" aria-hidden="true">
            了
          </span>
          {result.reviewed} {result.reviewed === 1 ? 'review' : 'reviews'} done{result.again ? `, ${result.again} to go again` : ''}.
          {result.minutes >= 1 && (
            <button type="button" className="i-btn i-btn--sm" onClick={() => openSheet({ type: 'study', minutes: result.minutes })}>
              Log {result.minutes} min as study
            </button>
          )}
        </div>
      )}
      <div className="i-meters i-meters--4">
        <Meter value={queue.length} label="Waiting today" />
        <Meter value={hq.cards.length} label="Cards" />
        <Meter value={mature} label="Stuck (3 weeks+)" />
        <Meter value={memory != null ? `${memory}%` : '—'} label={memory != null ? 'Remembered, last 30 days' : 'Remembered: 20 reviews first'} />
      </div>
      <button
        type="button"
        className="i-btn i-btn--sig i-btn--block"
        style={{ marginTop: 10 }}
        disabled={!queue.length}
        onClick={() => {
          setResult(null);
          setSession(queue);
        }}
      >
        {queue.length ? `Start: ${queue.length} ${queue.length === 1 ? 'card' : 'cards'}, about ${Math.max(1, Math.round(queue.length / 3))} min` : hq.cards.length ? 'Nothing due. Come back tomorrow.' : 'Add a card to begin'}
      </button>
      <div className="hq-actions">
        <button type="button" className="i-btn" onClick={() => openSheet({ type: 'hq-card', deck: deck ?? undefined })}>
          + Card
        </button>
        <button type="button" className="i-btn" onClick={() => openSheet({ type: 'hq-card', mistake: true })}>
          + Mistake
        </button>
        <button type="button" className="i-btn" onClick={() => openSheet({ type: 'hq-cut' })}>
          Cut a highlight
        </button>
      </div>

      {decks.length > 0 && (
        <>
          <H2>Decks</H2>
          <div className="i-pnl i-pnl--flush">
            {decks.map((d) => (
              <button key={d.deck} type="button" className="i-row" aria-pressed={deck === d.deck} onClick={() => setDeck(deck === d.deck ? null : d.deck)}>
                <span className="i-row__t">
                  <b>{d.deck}</b>
                  <small>
                    {d.total} cards · {d.mature} stuck
                  </small>
                </span>
                <span className="i-row__n">{d.due ? `${d.due} due` : '✓'}</span>
              </button>
            ))}
          </div>
          {deck && <p className="i-note">Only {deck} for now. Tap it again for everything.</p>}
        </>
      )}

      {leak.length > 0 && (
        <>
          <H2 aside="from your mistakes">Where marks leak</H2>
          <div className="i-pnl i-stack">
            {leak.map((l) => (
              <div key={l.cause} className="hq-bar">
                <span>{l.label}</span>
                <i style={{ width: `${(l.n / leak[0].n) * 100}%` }} />
                <b className="i-mono">{l.n}</b>
              </div>
            ))}
          </div>
        </>
      )}

      {hq.cards.length > 0 && (
        <>
          <H2>Find a card</H2>
          <input className="i-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search your cards" aria-label="Search your cards" />
          {found.length > 0 && (
            <div className="i-pnl i-pnl--flush" style={{ marginTop: 8 }}>
              {found.map((c) => (
                <button key={c.id} type="button" className="i-row" onClick={() => openSheet({ type: 'hq-card', editId: c.id })}>
                  <span className="i-row__t">
                    <b>{faces(c).q}</b>
                    <small>
                      {c.deck} · next {c.srs.firstOn ? c.srs.due : 'new'}
                    </small>
                  </span>
                </button>
              ))}
            </div>
          )}
          {q && !found.length && <p className="i-note">No card has that in it.</p>}
        </>
      )}

      {!hq.cards.length && (
        <div className="i-pnl i-stack" style={{ marginTop: 10 }}>
          <p className="i-note">Write a card when you learn something worth keeping, or a mistake when you lose marks. Each comes back just before you’d forget it: tomorrow, in three days, in a week, in a month. Ten minutes a day is enough.</p>
        </div>
      )}
    </div>
  );
}
