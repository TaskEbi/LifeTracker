/**
 * 灯台, the lighthouse. Three doors: messages you left yourself, a shelf of other people's words, and
 * /read, a quiet walk through both for the moment you're struggling: your own message, words that
 * fit, what your records say you've already got through, then one small thing to do.
 */
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { registerSheet } from '../../../app/sheetRegistry';
import { closeSheet, openSheet, type SheetSpec } from '../../../app/sheets';
import { navigate, useRoute } from '../../../app/router';
import { progressInput, takeRestDay, useToday } from '../../../data/lt';
import { deleteRecord } from '../../../data/records';
import { data } from '../../../data/store';
import { daysAgo, goodDayToWrite, notesFor, proofLines, WRITING_PROMPTS, type Note } from '../../../domain/hq/beacon';
import { weatherOf } from '../../../domain/hq/checkin';
import { FEELINGS, QUOTES, quotesFor, TOPICS, TRUST_NOTE, wordsOfDay, type FeelingId, type Quote, type QuoteTopic } from '../../../domain/hq/quotes';
import { shortDay } from '../../../domain/log/dates';
import { useStore } from '../../../lib/createStore';
import { H2 } from '../../../ui/i/bits';
import { Sheet } from '../../../ui/i/Sheet';
import { bucketItems } from '../../bucket/actions';
import { booksIn, linesIn } from '../../reading/actions';
import { runMove, useMoves } from '../HomeCards';
import { RoomHead } from '../HqView';
import { markNoteRead, NOTE_MAX, saveNote, saveOwnQuote, savedQuoteIds, toggleSavedQuote, useHq } from '../store';
import './lighthouse.css';

function FeelingChips({ value, onChange, label }: { value: FeelingId[]; onChange: (v: FeelingId[]) => void; label: string }) {
  const flip = (id: FeelingId) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  return (
    <div className="i-chips i-chips--wrap" role="group" aria-label={label}>
      {FEELINGS.map((f) => (
        <button key={f.id} type="button" className="i-chip" aria-pressed={value.includes(f.id)} onClick={() => flip(f.id)}>
          {f.short}
        </button>
      ))}
    </div>
  );
}

function NoteSheet({ spec }: { spec: SheetSpec }) {
  const today = useToday();
  const hq = useHq();
  const prev = spec.editId ? hq.notes.find((n) => n.id === spec.editId) : undefined;
  const [text, setText] = useState(prev?.text ?? '');
  const [feelings, setFeelings] = useState<FeelingId[]>(prev?.feelings ?? (spec.feeling ? [spec.feeling as FeelingId] : []));
  const [prompt, setPrompt] = useState(() => Math.floor(Math.random() * WRITING_PROMPTS.length));
  return (
    <Sheet
      title={prev ? 'Your message' : 'A message to yourself'}
      onClose={closeSheet}
      footer={
        <>
          {prev && (
            <button type="button" className="i-btn i-btn--danger" onClick={() => (deleteRecord(prev.id, 'Message deleted'), closeSheet())}>
              Delete
            </button>
          )}
          <button type="button" className="i-btn i-btn--sig i-btn--block" disabled={!text.trim()} onClick={() => (saveNote({ text, feelings }, today, prev?.id), closeSheet())}>
            Keep it for that day
          </button>
        </>
      }
    >
      {!prev && (
        <p className="lh-prompt">
          {WRITING_PROMPTS[prompt]}{' '}
          <button type="button" className="i-link" onClick={() => setPrompt((prompt + 1) % WRITING_PROMPTS.length)}>
            Another
          </button>
        </p>
      )}
      <textarea data-autofocus className="i-textarea lh-write" value={text} onChange={(e) => setText(e.target.value)} placeholder="You’ll be tired when you read this. So:" aria-label="Your message" maxLength={NOTE_MAX} />
      <div className="i-field">
        <span className="i-lab">Read this when… (leave empty for any bad day)</span>
        <FeelingChips value={feelings} onChange={setFeelings} label="Read this when" />
      </div>
    </Sheet>
  );
}
registerSheet('lh-note', NoteSheet);

function QuoteSheet({ spec }: { spec: SheetSpec }) {
  const hq = useHq();
  const prev = spec.editId ? hq.ownQuotes.find((q) => q.id === spec.editId) : undefined;
  const [text, setText] = useState(prev?.text ?? '');
  const [by, setBy] = useState(prev?.by ?? '');
  const [source, setSource] = useState(prev?.source ?? '');
  const [feelings, setFeelings] = useState<FeelingId[]>(prev?.feelings ?? []);
  return (
    <Sheet
      title={prev ? 'Edit these words' : 'Add words you love'}
      onClose={closeSheet}
      footer={
        <>
          {prev && (
            <button type="button" className="i-btn i-btn--danger" onClick={() => (deleteRecord(prev.id, 'Removed'), closeSheet())}>
              Remove
            </button>
          )}
          <button type="button" className="i-btn i-btn--sig i-btn--block" disabled={!text.trim()} onClick={() => (saveOwnQuote({ text, by, source, feelings }, prev?.id), closeSheet())}>
            Save
          </button>
        </>
      }
    >
      <label className="i-field">
        <span className="i-lab">The words</span>
        <textarea data-autofocus className="i-textarea" value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} placeholder="A line from a teacher, a song, a book, a friend" />
      </label>
      <label className="i-field">
        <span className="i-lab">Who said it</span>
        <input className="i-input" value={by} onChange={(e) => setBy(e.target.value)} maxLength={80} />
      </label>
      <label className="i-field">
        <span className="i-lab">Where from (optional)</span>
        <input className="i-input" value={source} onChange={(e) => setSource(e.target.value)} maxLength={120} />
      </label>
      <div className="i-field">
        <span className="i-lab">Good for</span>
        <FeelingChips value={feelings} onChange={setFeelings} label="Good for" />
      </div>
    </Sheet>
  );
}
registerSheet('lh-quote', QuoteSheet);

function QuoteCard({ q, big, saved, own }: { q: Quote; big?: boolean; saved: boolean; own?: boolean }) {
  const note = TRUST_NOTE[q.trust];
  return (
    <figure className={`lh-q${big ? ' lh-q--big' : ''}`}>
      {q.ja && (
        <p className="lh-q__ja" lang="ja">
          {q.ja}
        </p>
      )}
      <blockquote>{q.text}</blockquote>
      <figcaption>
        <span>
          {q.by && <b>{q.by}</b>}
          {q.source && q.source !== q.ja ? <small>{q.source}</small> : null}
          {note && <small className="lh-q__trust">{note}</small>}
        </span>
        <span className="lh-q__acts">
          {own && (
            <button type="button" className="i-link" onClick={() => openSheet({ type: 'lh-quote', editId: q.id })}>
              Edit
            </button>
          )}
          <button type="button" className={`lh-star${saved ? ' is-on' : ''}`} aria-pressed={saved} aria-label={`${saved ? 'Saved' : 'Save'}: ${q.by || q.text.slice(0, 40)}`} onClick={() => toggleSavedQuote(q.id)}>
            {saved ? '★' : '☆'}
          </button>
        </span>
      </figcaption>
    </figure>
  );
}

function Tabs({ tab }: { tab: 'me' | 'words' }) {
  return (
    <nav className="lh-tabs" aria-label="Lighthouse">
      <button type="button" aria-current={tab === 'me' ? 'page' : undefined} onClick={() => navigate('base', ['lighthouse'], { replace: true })}>
        From me
      </button>
      <button type="button" aria-current={tab === 'words' ? 'page' : undefined} onClick={() => navigate('base', ['lighthouse', 'words'], { replace: true })}>
        Other people’s words
      </button>
    </nav>
  );
}

function SosButton() {
  return (
    <button type="button" className="lh-sos" onClick={() => navigate('base', ['lighthouse', 'read'])}>
      <b aria-hidden="true">灯</b>
      <span>
        I’m struggling right now
        <small>A few minutes, one thing at a time</small>
      </span>
    </button>
  );
}

function FromMe() {
  const today = useToday();
  const hq = useHq();
  const good = goodDayToWrite(hq.checkIns, today);
  return (
    <>
      <RoomHead room="lighthouse" />
      <SosButton />
      <Tabs tab="me" />
      {good && <p className="lh-nudge">Good weather in there today. This is exactly when to write to the you of a worse one.</p>}
      <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={() => openSheet({ type: 'lh-note' })}>
        + Write a message to yourself
      </button>
      {hq.notes.length ? (
        <div className="lh-notes">
          {hq.notes.map((n) => {
            const w = n.mood != null ? weatherOf(n.mood) : null;
            return (
              <button key={n.id} type="button" className="lh-note" onClick={() => openSheet({ type: 'lh-note', editId: n.id })} aria-label={`Message from ${shortDay(n.writtenOn, today)}: open`}>
                <span className="lh-note__text">{n.text}</span>
                <small>
                  {shortDay(n.writtenOn, today)}
                  {w ? ` · ${w.kanji} ${w.name}` : ''}
                  {n.feelings.length ? ` · ${n.feelings.map((f) => FEELINGS.find((x) => x.id === f)!.short.toLowerCase()).join(', ')}` : ''}
                  {n.reads ? ` · read ${n.reads === 1 ? 'once' : `${n.reads} times`}` : ''}
                </small>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="i-pnl i-stack" style={{ marginTop: 10 }}>
          <p className="i-note">Nobody knows what you need to hear on a bad day better than you do on a good one. You’re the one person who’ll believe it. Write it now, in your own words, and it’ll be here when you need it.</p>
          <p className="i-note">A few things to start from:</p>
          <ul className="lh-starters">
            {WRITING_PROMPTS.slice(0, 4).map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="i-note" style={{ marginTop: 10 }}>Private to your own account, like the rest of your data.</p>
    </>
  );
}

function Words() {
  const today = useToday();
  const hq = useHq();
  const st = useStore(data, (s) => s);
  const saved = useMemo(() => new Set(savedQuoteIds(st)), [st]);
  const all = useMemo(() => [...hq.ownQuotes, ...QUOTES], [hq.ownQuotes]);
  const own = useMemo(() => new Set(hq.ownQuotes.map((q) => q.id)), [hq.ownQuotes]);
  const books = useMemo(() => linesIn(st).filter((h) => h.fav && h.text.trim()), [st]);
  const [filter, setFilter] = useState<'all' | 'saved' | 'mine' | 'books' | FeelingId | QuoteTopic>('all');
  const [shuffle, setShuffle] = useState(0);
  const hero = useMemo(() => (shuffle ? quotesFor(null, `again:${today}:${shuffle}`, all)[0] : wordsOfDay(today)), [today, shuffle, all]);
  const shown = useMemo(() => {
    if (filter === 'all') return all;
    if (filter === 'saved') return all.filter((q) => saved.has(q.id));
    if (filter === 'mine') return hq.ownQuotes;
    if (filter === 'books') return [];
    return all.filter((q) => q.feelings.includes(filter as FeelingId) || q.topics.includes(filter as QuoteTopic));
  }, [filter, all, saved, hq.ownQuotes]);
  const options: { id: typeof filter; label: string }[] = [
    { id: 'all', label: `All ${all.length}` },
    { id: 'saved', label: `★ Saved ${saved.size}` },
    ...(hq.ownQuotes.length ? [{ id: 'mine' as const, label: 'Added by me' }] : []),
    ...(books.length ? [{ id: 'books' as const, label: 'From my books' }] : []),
    ...FEELINGS.map((f) => ({ id: f.id, label: f.short })),
    ...TOPICS.map((t) => ({ id: t.id, label: t.label })),
  ];
  return (
    <>
      <RoomHead room="lighthouse" />
      <SosButton />
      <Tabs tab="words" />
      <section aria-label="Today’s words">
        <span className="i-lab">{shuffle ? 'Another one' : 'Today’s words'}</span>
        <QuoteCard q={hero} big saved={saved.has(hero.id)} own={own.has(hero.id)} />
        <div className="hq-actions">
          <button type="button" className="i-btn" onClick={() => setShuffle(shuffle + 1)}>
            Another
          </button>
          <button type="button" className="i-btn" onClick={() => openSheet({ type: 'lh-quote' })}>
            + Add words you love
          </button>
        </div>
      </section>
      <H2 aside={filter === 'books' ? `${books.length}` : `${shown.length}`}>The shelf</H2>
      <div className="i-chips i-chips--wrap lh-filters" role="group" aria-label="Show">
        {options.map((o) => (
          <button key={o.id} type="button" className="i-chip" aria-pressed={filter === o.id} onClick={() => setFilter(o.id)}>
            {o.label}
          </button>
        ))}
      </div>
      <div className="lh-shelf">
        {filter === 'books'
          ? books.map((h) => (
              <figure key={h.id} className="lh-q">
                <blockquote>{h.text}</blockquote>
                <figcaption>
                  <span>
                    <b>{h.book}</b>
                    <small>Your favourite highlight</small>
                  </span>
                </figcaption>
              </figure>
            ))
          : shown.map((q) => <QuoteCard key={q.id} q={q} saved={saved.has(q.id)} own={own.has(q.id)} />)}
        {filter === 'saved' && !shown.length && <p className="i-note">Tap the star on any line to keep it here.</p>}
        {filter !== 'saved' && filter !== 'books' && !shown.length && <p className="i-note">Nothing here yet.</p>}
      </div>
      <p className="i-note" style={{ marginTop: 10 }}>
        Famous fakes are left out: “If you’re going through hell, keep going” was never Churchill, and “It always seems impossible until it’s done” can’t be traced to Mandela. “Wording varies” and “Attributed” mean what they say. The translations of the Japanese lines are this app’s own.
      </p>
    </>
  );
}

// ─── the struggling flow ────────────────────────────────────────────────────

type Stage = 'note' | 'words' | 'proof' | 'step';

function NextStep({ feeling }: { feeling: FeelingId | null }) {
  const moves = useMoves(15, 'low');
  const move = moves.find((m) => m.id !== 'sleep-log') ?? null;
  const go = (route: string, rest: string[] = []) => navigate(route as 'sleep', rest);
  return (
    <div className="lh-step">
      {(feeling === 'tired' || (move?.id === 'bed' && (feeling === 'flat' || feeling === 'swamped' || feeling === null))) && (
        <>
          <p>Being tired isn’t a character flaw. A rest day keeps your streak, and sleep fixes more than willpower does.</p>
          <button
            type="button"
            className="i-btn i-btn--sig i-btn--block"
            onClick={() => {
              takeRestDay();
              go('home');
            }}
          >
            Take today as a rest day
          </button>
          <button type="button" className="i-btn i-btn--block" onClick={() => go('sleep')}>
            See tonight’s bedtime
          </button>
        </>
      )}
      {feeling === 'failed' && (
        <>
          <p>Write down exactly what went wrong while it’s fresh. Then it’s a lesson on a card and not a weight in your head.</p>
          <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={() => openSheet({ type: 'hq-card', mistake: true })}>
            Put it in the mistake notebook
          </button>
        </>
      )}
      {feeling === 'afraid' && (
        <>
          <p>Write down what you’re afraid of and how likely it really is. The Oracle will keep score, and most fears don’t do well there.</p>
          <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={() => openSheet({ type: 'hq-prediction', claim: 'What I’m afraid of: ' })}>
            Put a number on it
          </button>
          <button type="button" className="i-btn i-btn--block" onClick={() => go('base', ['breath'])}>
            Breathe for a minute first
          </button>
        </>
      )}
      {feeling === 'doubt' && (
        <>
          <p>Look at what’s actually on the wall. Feelings argue; records don’t.</p>
          <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={() => go('base', ['hall'])}>
            Go to the Hall of records
          </button>
        </>
      )}
      {(feeling === 'flat' || feeling === 'swamped' || feeling === null) && move && move.id !== 'bed' && (
        <>
          <p>{feeling === 'swamped' ? 'You can’t do all of it. You can do this one, for fifteen minutes.' : 'You don’t have to want to. Motivation usually turns up after you start, not before. Fifteen minutes, then you’re allowed to stop.'}</p>
          <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={() => runMove(move)}>
            {move.title}: start small
          </button>
          <small className="lh-why">{move.why[0]}</small>
        </>
      )}
      <button type="button" className="i-btn i-btn--block" onClick={() => openSheet({ type: 'lh-note', feeling: feeling ?? undefined })}>
        Write to the next you who feels like this
      </button>
      <button type="button" className="i-link" onClick={() => navigate('home')}>
        I’m OK for now
      </button>
      <p className="lh-care">
        If this is heavier than a bad day, or it’s been going on a while, please tell someone: a parent, a teacher, a doctor, a friend. You don’t have to carry that with a quote.
      </p>
    </div>
  );
}

function Read() {
  const today = useToday();
  const hq = useHq();
  const st = useStore(data, (s) => s);
  const [feeling, setFeeling] = useState<FeelingId | null | undefined>(undefined);
  const [stage, setStage] = useState<Stage>('note');
  const [noteIdx, setNoteIdx] = useState(0);
  const [wordIdx, setWordIdx] = useState(0);
  // Fixed once you've said how you feel, so nothing moves under you as messages are marked read.
  const [notes, setNotes] = useState<Note[]>([]);
  const [seed] = useState(() => `read:${Date.now()}`);
  const words = useMemo(() => (feeling === undefined ? [] : quotesFor(feeling, seed, [...hq.ownQuotes, ...QUOTES])), [feeling, seed, hq.ownQuotes]);
  const saved = useMemo(() => new Set(savedQuoteIds(st)), [st]);
  const proof = useMemo(() => {
    if (feeling === undefined) return [];
    return proofLines(progressInput(st, today), { checkIns: hq.checkIns, reviews: hq.reviews, books: booksIn(st).filter((b) => b.status === 'finished').length, wishes: bucketItems(st).done.length }, feeling);
  }, [feeling, st, today, hq.checkIns, hq.reviews]);
  const note = stage === 'note' ? notes[noteIdx] : undefined;
  useEffect(() => {
    if (note) markNoteRead(note.id, today);
  }, [note?.id]);
  const choose = (f: FeelingId | null) => {
    const list = notesFor(hq.notes, f);
    setNotes(list);
    setFeeling(f);
    setStage(list.length ? 'note' : 'words');
  };
  const afterWords = () => setStage(proof.length ? 'proof' : 'step');
  const word = words[wordIdx % Math.max(1, words.length)];
  return (
    <div className="lh-read">
      <div className="lh-sea" aria-hidden="true">
        <i className="lh-sea__beam" />
      </div>
      <button type="button" className="i-home" onClick={() => navigate('base', ['lighthouse'])}>
        Leave
      </button>
      {feeling === undefined ? (
        <>
          <h1>What’s going on?</h1>
          <p className="lh-sub">You came here, and that already counts.</p>
          <div className="lh-feelings">
            {FEELINGS.map((f) => (
              <button key={f.id} type="button" onClick={() => choose(f.id)}>
                <b aria-hidden="true">{f.kanji}</b>
                {f.label}
              </button>
            ))}
          </div>
          <button type="button" className="i-link" onClick={() => choose(null)}>
            I don’t know. Just show me something.
          </button>
        </>
      ) : (
        <>
          <h1 className="lh-title">{stage === 'note' ? 'You left this for you' : stage === 'words' ? 'From someone who’s been there' : stage === 'proof' ? 'What you’ve already done' : 'One small thing'}</h1>
          {stage === 'note' && note && (
            <>
              <article className="lh-letter">
                <p>{note.text}</p>
                <footer>
                  You, {daysAgo(note.writtenOn, today) === 0 ? 'today' : `${daysAgo(note.writtenOn, today)} days ago`}
                  {note.mood != null ? `, on a ${weatherOf(note.mood).name.toLowerCase()} day` : ''}
                </footer>
              </article>
              <div className="lh-nav">
                {noteIdx + 1 < notes.length && (
                  <button type="button" className="i-btn" onClick={() => setNoteIdx(noteIdx + 1)}>
                    Another from me
                  </button>
                )}
                <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={() => setStage('words')}>
                  Keep going
                </button>
              </div>
            </>
          )}
          {stage === 'words' && word && (
            <>
              {!notes.length && <p className="lh-sub">You haven’t left yourself a message yet. That’s fine; you can at the end.</p>}
              <QuoteCard q={word} big saved={saved.has(word.id)} own={hq.ownQuotes.some((q) => q.id === word.id)} />
              <div className="lh-nav">
                {words.length > 1 && (
                  <button type="button" className="i-btn" onClick={() => setWordIdx(wordIdx + 1)}>
                    Another
                  </button>
                )}
                <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={afterWords}>
                  Keep going
                </button>
              </div>
            </>
          )}
          {stage === 'proof' && (
            <>
              <ul className="lh-proof">
                {proof.map((p, i) => (
                  <li key={p.id} style={{ '--i': i } as CSSProperties}>
                    <b>{p.big}</b>
                    <span>{p.text}</span>
                  </li>
                ))}
              </ul>
              <p className="lh-sub">Counted from your own records. A bad day doesn’t change these numbers.</p>
              <div className="lh-nav">
                <button type="button" className="i-btn i-btn--sig i-btn--block" onClick={() => setStage('step')}>
                  Keep going
                </button>
              </div>
            </>
          )}
          {stage === 'step' && <NextStep feeling={feeling} />}
        </>
      )}
    </div>
  );
}

export function LighthouseRoom() {
  const route = useRoute();
  if (route.rest[1] === 'read') return <Read />;
  if (route.rest[1] === 'words') return <Words />;
  return <FromMe />;
}
