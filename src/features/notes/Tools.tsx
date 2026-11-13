/**
 * The study tools on the notes pages, all read from the notes' own content:
 *   /study/notes/cards              the decks, with what is due
 *   /study/notes/cards/<subject|all>[/<topic>]   a sitting of flash cards
 *   /study/notes/formulas[/<subject>]            every formula, by topic
 *   /study/notes/glossary                        every key term, A to Z
 *   /study/notes/tips[/<subject>]                examiner's tips and common mistakes
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { openSheet } from '../../app/sheets';
import { useToday } from '../../data/lt';
import { shortDay } from '../../domain/log/dates';
import { findTopic, NOTE_SUBJECTS, subjectById, type NoteSubject } from '../../domain/notes';
import { calloutsOf, deck, deckStats, formulasOf, glossary, gradeCard, KNOWN_BOX, letterOf, LEVELS, sessionCards, type Card, type CardKind, type DeckStats, type Level, type SessionMode } from '../../domain/notes/tools';
import { markCard, resetCards, type CardMarks } from './actions';
import { A, Foot, pad, R, useReveal, vars } from './parts';
import { setNotesPrefs, useNotesPrefs } from './prefs';

export const TOOL_IDS = ['cards', 'formulas', 'glossary', 'tips'] as const;
export type ToolId = (typeof TOOL_IDS)[number];
export const isTool = (x: string | undefined): x is ToolId => (TOOL_IDS as readonly string[]).includes(x ?? '');
export const TOOL_NAME: Record<ToolId, string> = { cards: 'Flash cards', formulas: 'Formula sheet', glossary: 'Glossary', tips: 'Tips and mistakes' };

const SITTING = 20;
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

// ── small controls ──

export function Segs<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="nt-segs" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" aria-pressed={value === o.id} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function LevelPick() {
  const { level } = useNotesPrefs();
  return <Segs<Level> label="Level" value={level} options={LEVELS} onChange={(v) => setNotesPrefs({ level: v })} />;
}

function Head({ label, title, children }: { label: string; title: string; children?: ReactNode }) {
  return (
    <header className="nt-thead">
      <span className="nt-lbl">{label}</span>
      <h1>{title}</h1>
      {children}
    </header>
  );
}

function SubjectTabs({ tool, current }: { tool: ToolId; current: string }) {
  return (
    <nav className="nt-tabs" aria-label="Subject">
      {NOTE_SUBJECTS.map((s) => (
        <A key={s.id} to={['notes', tool, s.id]} className={s.id === current ? 'is-cur' : undefined} current={s.id === current}>
          {s.name}
        </A>
      ))}
    </nav>
  );
}

// ── flash cards: the decks ──

const KINDS: { id: CardKind | 'all'; label: string }[] = [
  { id: 'all', label: 'Both' },
  { id: 'term', label: 'Key terms' },
  { id: 'formula', label: 'Formulas' },
];
const MODES: { id: SessionMode; label: string }[] = [
  { id: 'due', label: 'Due and new' },
  { id: 'all', label: 'Everything' },
];

function statLine(st: DeckStats) {
  if (!st.total) return 'No cards';
  const parts = [plural(st.total, 'card')];
  if (st.due) parts.push(`${st.due} due`);
  if (st.fresh) parts.push(`${st.fresh} new`);
  if (st.known) parts.push(`${st.known} known`);
  return parts.join(' · ');
}

function DeckRow({ to, r, title, st, i }: { to: string[]; r: string; title: string; st: DeckStats; i: number }) {
  const pct = st.total ? Math.round((st.known / st.total) * 100) : 0;
  return (
    <A className="nt-idx" to={to}>
      <span className="nt-idx__r">{r}</span>
      <span className="nt-idx__t">{title}</span>
      <span className="nt-idx__c">{statLine(st)}</span>
      <span className="nt-idx__p">
        <span className="nt-bar">
          <i style={vars({ width: `${pct}%`, '--i': i })} />
        </span>
        <span className="nt-bar__l">{st.due ? `${st.due} due` : `${pct}% known`}</span>
      </span>
      <span aria-hidden="true">→</span>
    </A>
  );
}

export function CardsHome({ marks }: { marks: CardMarks }) {
  const today = useToday();
  const { level, kind, mode } = useNotesPrefs();
  const root = useRef<HTMLDivElement>(null);
  useReveal(root, `cards:${level}:${kind}`);
  const rows = useMemo(() => NOTE_SUBJECTS.map((s) => ({ s, st: deckStats(deck({ subject: s.id, level, kind }), marks, today) })), [marks, today, level, kind]);
  const all = useMemo(() => deckStats(deck({ level, kind }), marks, today), [marks, today, level, kind]);
  return (
    <div ref={root}>
      <section className="nt-tool nt-wrap">
        <div className="nt-wrap__in">
          <Head label="Study tools" title="Flash cards">
            <p>
              One card for every key term and one for each set of formulas, made from the notes. Say the answer to yourself, turn the card, and be honest: a card you get right comes back after 1, 3, 7, 16 and then 35 days; one you
              miss comes back today.
            </p>
          </Head>
          <div className="nt-opts">
            <div className="nt-opt">
              <span className="nt-lbl">Level</span>
              <LevelPick />
            </div>
            <div className="nt-opt">
              <span className="nt-lbl">Cards</span>
              <Segs label="Cards" value={kind} options={KINDS} onChange={(v) => setNotesPrefs({ kind: v })} />
            </div>
            <div className="nt-opt">
              <span className="nt-lbl">A sitting takes</span>
              <Segs label="A sitting takes" value={mode} options={MODES} onChange={(v) => setNotesPrefs({ mode: v })} />
            </div>
          </div>
          <div className="nt-sect nt-sect--gap" data-rv="">
            <h2>The Decks</h2>
            <span className="nt-lbl">{all.due ? `${all.due} due` : plural(all.total, 'card')}</span>
          </div>
          <div data-rv="">
            <DeckRow to={['notes', 'cards', 'all']} r="00" title="Every subject" st={all} i={0} />
          </div>
          {rows.map(({ s, st }, i) => (
            <div key={s.id} data-rv="">
              <DeckRow to={['notes', 'cards', s.id]} r={pad(i + 1)} title={s.name} st={st} i={i + 1} />
            </div>
          ))}
          <p className="nt-tnote">A sitting is up to {SITTING} cards. For one topic’s cards, open the topic and choose “Flash cards”.</p>
        </div>
      </section>
      <Foot left="Flash cards · made from the notes" right="A study edition for one student" />
    </div>
  );
}

// ── flash cards: a sitting ──

export function CardsSession({ scope, topicId, marks }: { scope: string; topicId?: string; marks: CardMarks }) {
  const today = useToday();
  const { level, kind, mode } = useNotesPrefs();
  const subject = subjectById(scope);
  const ref = subject && topicId ? findTopic(subject.id, topicId) : undefined;
  const all = useMemo(() => (ref ? deck({ topic: ref.topic.id }) : deck({ subject: subject?.id, level, kind })), [ref, subject, level, kind]);
  const title = ref ? ref.topic.title : subject ? subject.name : 'Every subject';
  const back = ref ? ['notes', ref.subject.id, ref.topic.id] : ['notes', 'cards'];

  const marksRef = useRef(marks);
  marksRef.current = marks;
  const deal = (m: SessionMode) => sessionCards(all, marksRef.current, today, m, SITTING);
  const [queue, setQueue] = useState<Card[]>(() => deal(mode));
  const [size, setSize] = useState(queue.length);
  const [at, setAt] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [missed, setMissed] = useState<ReadonlySet<string>>(new Set());
  const [started, setStarted] = useState(() => Date.now());

  const restart = (m: SessionMode = mode) => {
    const q = deal(m);
    setQueue(q);
    setSize(q.length);
    setAt(0);
    setFlipped(false);
    setMissed(new Set());
    setStarted(Date.now());
  };

  const card: Card | undefined = queue[at];
  const answer = (right: boolean) => {
    if (!card) return;
    markCard(card.topic.id, card.key, gradeCard(marksRef.current.get(card.id), right, today, missed.has(card.id)));
    if (!right) {
      setMissed((s) => new Set(s).add(card.id));
      setQueue((q) => [...q, card]);
    }
    setFlipped(false);
    setAt((i) => i + 1);
  };
  const answerRef = useRef(answer);
  answerRef.current = answer;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.metaKey || e.ctrlKey || e.altKey || document.querySelector('[role="dialog"]')) return;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
      if (!flipped) {
        if (e.key === ' ' || e.key === 'Enter') {
          if (t?.tagName === 'BUTTON' || t?.tagName === 'A') return;
          e.preventDefault();
          setFlipped(true);
        }
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === '1') answerRef.current(false);
      else if (e.key === 'ArrowRight' || e.key === '2') answerRef.current(true);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [flipped]);

  const st = deckStats(all, marks, today);
  const head = (
    <Head label={ref ? `${ref.subject.name} · ${ref.topic.ref}` : subject ? subject.board : 'Flash cards'} title={title}>
      <p className="nt-thead__k">{statLine(st)}</p>
    </Head>
  );

  // nothing to show: an empty deck, or nothing due
  if (!size) {
    const next = all.map((c) => marks.get(c.id)?.due).filter((d): d is string => !!d && d > today).sort()[0];
    return (
      <section className="nt-tool nt-wrap">
        <div className="nt-wrap__in nt-sit">
          {head}
          <div className="nt-done">
            <h2>{all.length ? 'Nothing is due' : 'No cards here'}</h2>
            <p>{all.length ? (next ? `Every card in this deck has been seen. The next one comes back on ${shortDay(next, today)}.` : 'Every card in this deck has been seen.') : 'This choice of level and cards has none. Change it on the decks page.'}</p>
            <div className="nt-btns">
              {all.length > 0 && (
                <button type="button" className="nt-ruled" onClick={() => restart('all')}>
                  Go through them anyway
                </button>
              )}
              <A className="nt-ruled" to={back}>
                {ref ? 'Back to the notes' : 'Back to the decks'}
              </A>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // the sitting is over
  if (!card) {
    const first = size - missed.size;
    const minutes = Math.max(1, Math.round((Date.now() - started) / 60000));
    const more = deal(mode).length;
    const study = (ref?.subject ?? subject ?? queue[0].subject).study;
    return (
      <section className="nt-tool nt-wrap">
        <div className="nt-wrap__in nt-sit">
          {head}
          <div className="nt-done">
            <h2>Sitting done</h2>
            <p>
              {first} of {plural(size, 'card')} right first time.{missed.size ? ` ${plural(missed.size, 'card')} you missed ${missed.size === 1 ? 'comes' : 'come'} back tomorrow.` : ''}
            </p>
            <div className="nt-btns">
              {more > 0 && (
                <button type="button" className="nt-ruled" onClick={() => restart()}>
                  {mode === 'due' ? `${plural(more, 'more card')}` : 'Another round'}
                </button>
              )}
              <button type="button" className="nt-ruled" onClick={() => openSheet({ type: 'study', subject: study, kind: 'Revision', topic: ref ? `${ref.topic.title} flash cards` : 'Flash cards', minutes })}>
                Log {minutes} min
              </button>
              <A className="nt-ruled" to={back}>
                {ref ? 'Back to the notes' : 'Back to the decks'}
              </A>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const again = missed.has(card.id);
  const box = marks.get(card.id)?.box ?? 0;
  return (
    <section className="nt-tool nt-wrap">
      <div className="nt-wrap__in nt-sit">
        {head}
        <div className="nt-sit__bar">
          <span className="nt-bar">
            <i style={{ width: `${Math.round((Math.min(at, queue.length) / queue.length) * 100)}%` }} />
          </span>
          <span className="nt-bar__l">
            Card {at + 1} of {queue.length}
            {again ? ' · again' : box ? ` · box ${box}${box >= KNOWN_BOX ? ', known' : ''}` : ' · new'}
          </span>
        </div>
        <div className={`nt-card${flipped ? ' is-flipped' : ''}`} key={`${card.id}:${at}`}>
          <div className="nt-card__in">
            <div className="nt-card__face nt-card__front" aria-hidden={flipped || undefined}>
              <span className="nt-lbl">
                {card.subject.name} · {card.topic.title}
              </span>
              <p className="nt-card__q">
                <R t={card.front} />
              </p>
              <span className="nt-card__ask">{card.kind === 'term' ? 'What does it mean?' : 'Write down the formulas.'}</span>
              <button type="button" className="nt-ruled" onClick={() => setFlipped(true)} disabled={flipped} tabIndex={flipped ? -1 : 0}>
                Show the answer
              </button>
            </div>
            <div className="nt-card__face nt-card__back" aria-hidden={!flipped || undefined}>
              <span className="nt-lbl">
                {card.kind === 'term' ? 'Key term' : 'Formulas'} · <R t={card.front} />
              </span>
              {card.kind === 'term' ? (
                <p className="nt-card__a" aria-live="polite">
                  <R t={card.back[0]} />
                </p>
              ) : (
                <div className="nt-f nt-card__f" aria-live="polite">
                  {card.back.map((l, i) => (
                    <div key={i}>
                      <R t={l} />
                    </div>
                  ))}
                </div>
              )}
              <div className="nt-card__btns">
                <button type="button" className="nt-ruled nt-ruled--no" onClick={() => answer(false)} disabled={!flipped} tabIndex={flipped ? 0 : -1}>
                  Missed it
                </button>
                <button type="button" className="nt-ruled" onClick={() => answer(true)} disabled={!flipped} tabIndex={flipped ? 0 : -1}>
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
        <p className="nt-tnote">
          <A to={['notes', card.subject.id, card.topic.id]}>Open the notes for {card.topic.title} →</A>
          <span className="nt-keys">Space turns the card · ← missed · → got it</span>
        </p>
        {ref && st.total - st.fresh > 0 && (
          <p className="nt-tnote">
            <button
              type="button"
              className="nt-link"
              onClick={() => {
                resetCards([ref.topic.id]);
                marksRef.current = new Map();
                restart();
              }}
            >
              Start this topic’s cards again
            </button>
          </p>
        )}
      </div>
    </section>
  );
}

// ── the formula sheet ──

export function FormulaSheet({ subject }: { subject: NoteSubject }) {
  const { level } = useNotesPrefs();
  const [hide, setHide] = useState(false);
  const [shown, setShown] = useState<ReadonlySet<string>>(new Set());
  const groups = useMemo(() => formulasOf(subject, level), [subject, level]);
  const root = useRef<HTMLDivElement>(null);
  useReveal(root, `f:${subject.id}:${level}`);
  const byTopic = useMemo(() => {
    const out: { key: string; unit: string; topic: (typeof groups)[number]['topic']; groups: typeof groups }[] = [];
    for (const g of groups) {
      const last = out[out.length - 1];
      if (last && last.topic.id === g.topic.id) last.groups.push(g);
      else out.push({ key: g.topic.id, unit: g.unit.code, topic: g.topic, groups: [g] });
    }
    return out;
  }, [groups]);
  const lines = groups.reduce((a, g) => a + g.lines.length, 0);
  return (
    <div ref={root}>
      <section className="nt-tool nt-wrap">
        <div className="nt-wrap__in">
          <Head label="Study tools" title="Formula sheet">
            <p>Every formula in the notes, topic by topic. Cover them to test yourself: say what belongs under each heading, then tap it.</p>
          </Head>
          <SubjectTabs tool="formulas" current={subject.id} />
          <div className="nt-opts">
            <div className="nt-opt">
              <span className="nt-lbl">Level</span>
              <LevelPick />
            </div>
            <div className="nt-opt">
              <span className="nt-lbl">Formulas</span>
              <Segs
                label="Formulas"
                value={hide ? 'hide' : 'show'}
                options={[
                  { id: 'show', label: 'Shown' },
                  { id: 'hide', label: 'Covered' },
                ]}
                onChange={(v) => {
                  setHide(v === 'hide');
                  setShown(new Set());
                }}
              />
            </div>
          </div>
          <div className="nt-sect nt-sect--gap">
            <h2>{subject.name}</h2>
            <span className="nt-lbl">
              {plural(lines, 'formula', 'formulas')} · {plural(byTopic.length, 'topic')}
            </span>
          </div>
          {!byTopic.length && <p className="nt-tnote">No formulas at this level.</p>}
          <div className="nt-fsheet">
            {byTopic.map((t) => (
              <section key={t.key} className="nt-fsheet__t" data-rv="">
                <h3>
                  <A to={['notes', subject.id, t.topic.id]}>
                    <span className="nt-n">{t.topic.ref}</span>
                    {t.topic.title}
                  </A>
                </h3>
                {t.groups.map((g) => {
                  const id = `${t.key}/${g.section}`;
                  const covered = hide && !shown.has(id);
                  return (
                    <div key={g.section} className="nt-fsheet__g">
                      <span className="nt-lbl">{g.section}</span>
                      {covered ? (
                        <button type="button" className="nt-cover" onClick={() => setShown((s) => new Set(s).add(id))} aria-label={`Show the formulas for ${g.section}`}>
                          {plural(g.lines.length, 'formula', 'formulas')} · tap to show
                        </button>
                      ) : (
                        <div className="nt-f">
                          {g.lines.map((l, i) => (
                            <div key={i}>
                              <R t={l} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </section>
            ))}
          </div>
        </div>
      </section>
      <Foot left={`${subject.board} · ${subject.name}`} right="Check against the formula booklet you get in the exam" />
    </div>
  );
}

// ── the glossary ──

export function GlossaryView() {
  const { level } = useNotesPrefs();
  const [q, setQ] = useState('');
  const [subject, setSubject] = useState('all');
  const entries = useMemo(() => glossary({ subject: subject === 'all' ? undefined : subject, level, q }), [subject, level, q]);
  const letters = useMemo(() => {
    const out: { letter: string; items: typeof entries }[] = [];
    for (const e of entries) {
      const l = letterOf(e.term);
      const last = out[out.length - 1];
      if (last && last.letter === l) last.items.push(e);
      else out.push({ letter: l, items: [e] });
    }
    return out;
  }, [entries]);
  return (
    <div>
      <section className="nt-tool nt-wrap">
        <div className="nt-wrap__in">
          <Head label="Study tools" title="Glossary">
            <p>Every key term in the notes, A to Z. Definitions are worth marks word for word, so learn them as written.</p>
          </Head>
          <input className="nt-find" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a term or a word in its definition…" aria-label="Find a term" autoComplete="off" spellCheck={false} />
          <div className="nt-opts">
            <div className="nt-opt">
              <span className="nt-lbl">Subject</span>
              <Segs label="Subject" value={subject} options={[{ id: 'all', label: 'All' }, ...NOTE_SUBJECTS.map((s) => ({ id: s.id as string, label: s.id === 'further' ? 'Further' : s.id === 'cs' ? 'CS' : s.name }))]} onChange={setSubject} />
            </div>
            <div className="nt-opt">
              <span className="nt-lbl">Level</span>
              <LevelPick />
            </div>
          </div>
          <div className="nt-sect nt-sect--gap">
            <h2>A to Z</h2>
            <span className="nt-lbl">{plural(entries.length, 'term')}</span>
          </div>
          {!entries.length && <p className="nt-tnote">Nothing matches{q.trim() ? ` “${q.trim()}”` : ''}.</p>}
          {letters.map((g) => (
            <section key={g.letter} className="nt-gloss" aria-label={g.letter === '#' ? 'Numbers and symbols' : g.letter}>
              <h3 aria-hidden="true">{g.letter}</h3>
              <dl className="nt-terms">
                {g.items.map((e) => (
                  <div key={`${e.topic.id}:${e.term}`}>
                    <dt>{e.term}</dt>
                    <dd>
                      <R t={e.def} />
                      <A className="nt-gloss__src" to={['notes', e.subject.id, e.topic.id]}>
                        {e.subject.name} · {e.topic.title}
                      </A>
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </section>
      <Foot left="Glossary · every key term" right="A study edition for one student" />
    </div>
  );
}

// ── tips and mistakes ──

const CALLOUTS: { id: 'all' | 'trap' | 'tip'; label: string }[] = [
  { id: 'all', label: 'Both' },
  { id: 'trap', label: 'Mistakes' },
  { id: 'tip', label: 'Tips' },
];

export function TipsView({ subject }: { subject: NoteSubject }) {
  const { level } = useNotesPrefs();
  const [kind, setKind] = useState<'all' | 'trap' | 'tip'>('all');
  const items = useMemo(() => calloutsOf(subject, level, kind === 'all' ? undefined : kind), [subject, level, kind]);
  const root = useRef<HTMLDivElement>(null);
  useReveal(root, `tips:${subject.id}:${level}:${kind}`);
  return (
    <div ref={root}>
      <section className="nt-tool nt-wrap">
        <div className="nt-wrap__in">
          <Head label="Study tools" title="Tips and mistakes">
            <p>Every examiner’s tip and common mistake from the notes in one list. Worth reading the night before a paper.</p>
          </Head>
          <SubjectTabs tool="tips" current={subject.id} />
          <div className="nt-opts">
            <div className="nt-opt">
              <span className="nt-lbl">Level</span>
              <LevelPick />
            </div>
            <div className="nt-opt">
              <span className="nt-lbl">Show</span>
              <Segs label="Show" value={kind} options={CALLOUTS} onChange={setKind} />
            </div>
          </div>
          <div className="nt-sect nt-sect--gap">
            <h2>{subject.name}</h2>
            <span className="nt-lbl">{plural(items.length, 'note')}</span>
          </div>
          {!items.length && <p className="nt-tnote">None at this level.</p>}
          <ul className="nt-tips">
            {items.map((c, i) => (
              <li key={i} className={`nt-tips__i nt-tips__i--${c.kind}`} data-rv="">
                <span className="nt-tag">{c.kind === 'tip' ? 'Examiner’s tip' : 'Common mistake'}</span>
                <p>
                  <R t={c.text} />
                </p>
                <A className="nt-gloss__src" to={['notes', subject.id, c.topic.id]}>
                  {c.topic.ref} · {c.topic.title} · {c.section}
                </A>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <Foot left={`${subject.board} · ${subject.name}`} right="A study edition for one student" />
    </div>
  );
}
