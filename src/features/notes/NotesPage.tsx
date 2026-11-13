/**
 * 講 Study notes, at /study/notes: compact notes for every topic of the AS and A2 units in
 * Physics, Maths, Further Maths and Computer Science. The look follows the CS revision site:
 * topics are discs on a diagonal stage, a topic opens like a film's credits page and then reads
 * as notes. The study tools made from the notes (flash cards, formula sheet, glossary, tips and
 * mistakes) are in Tools.tsx.
 * /study/notes · /study/notes/<subject> · /study/notes/<subject>/<topic> · /study/notes/<tool>/…
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import { navigate, useRoute } from '../../app/router';
import { openSheet } from '../../app/sheets';
import { findTopic, minutesOf, NOTE_SUBJECTS, searchNotes, subjectById, subjectProgress, TERMS_ID, topicProgress, topicsOf, type NoteSubject, type NoteTopic, type NoteUnit, type SubjectId } from '../../domain/notes';
import { useToday } from '../../data/lt';
import { countTopics, deck, deckStats, glossary, nextUp, unitsAt } from '../../domain/notes/tools';
import { setSection, type CardMarks, type NotesRead } from './actions';
import { discFace, discHtml, hashOf, posterArt, tear } from './art';
import { useCards, useNotes } from './door';
import { A, BlockView, Foot, pad, R, reduced, useReveal, vars } from './parts';
import { useNotesPrefs } from './prefs';
import { CardsHome, CardsSession, FormulaSheet, GlossaryView, isTool, LevelPick, TipsView, TOOL_NAME } from './Tools';
import './notes.css';

const TAGLINE: Record<SubjectId, string> = {
  physics: 'From a falling ball to a single photon.',
  maths: 'Pure, mechanics and statistics.',
  further: 'Complex numbers, matrices and proof.',
  cs: 'From bits to databases to code.',
};

let fontsAsked = false;
function loadFonts() {
  if (fontsAsked) return;
  fontsAsked = true;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Geist:wght@300..900&family=Geist+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap';
  document.head.appendChild(link);
}

// ── the stage of discs ──

interface StageItem {
  key: string;
  title: string;
  ref: string;
  rows: [string, string][];
  hook: string;
  face: string;
  to: string[];
}

const stageIdx = new Map<string, number>();
let fromDisc = false;

function Stage({ id, heading, items, credit, tools }: { id: string; heading: string; items: StageItem[]; credit: string; tools?: ReactNode }) {
  const [idx, setIdx] = useState(() => Math.min(items.length - 1, stageIdx.get(id) ?? 0));
  const [leaving, setLeaving] = useState<number | null>(null);
  const stage = useRef<HTMLElement>(null);
  const idxRef = useRef(idx);
  idxRef.current = idx;
  const last = items.length - 1;
  const move = (d: number) => setIdx((i) => Math.max(0, Math.min(last, i + d)));

  useEffect(() => {
    stageIdx.set(id, idx);
  }, [id, idx]);

  // arrow keys, sideways wheel and swipe
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const typing = (e: Event) => {
      const t = e.target as HTMLElement | null;
      return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
    };
    const onKey = (e: KeyboardEvent) => {
      if (typing(e) || e.metaKey || e.ctrlKey || e.altKey || document.querySelector('[role="dialog"]')) return;
      if (e.key === 'ArrowRight') move(1);
      else if (e.key === 'ArrowLeft') move(-1);
    };
    let lock = 0;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < 8) return;
      e.preventDefault();
      const now = Date.now();
      if (now - lock < 520) return;
      lock = now;
      move(e.deltaX > 0 ? 1 : -1);
    };
    let tx: number | null = null;
    let ty = 0;
    const onStart = (e: TouchEvent) => {
      tx = e.touches[0].clientX;
      ty = e.touches[0].clientY;
    };
    const onEnd = (e: TouchEvent) => {
      if (tx == null) return;
      const dx = e.changedTouches[0].clientX - tx;
      const dy = e.changedTouches[0].clientY - ty;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1);
      tx = null;
    };
    document.addEventListener('keydown', onKey);
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchend', onEnd);
    return () => {
      document.removeEventListener('keydown', onKey);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchend', onEnd);
    };
  }, [last]);

  // With a mouse, every disc in view leans a little with the pointer; the active one leans
  // towards it and its glare follows.
  useEffect(() => {
    const el = stage.current;
    if (!el || reduced()) return;
    const slots = [...el.querySelectorAll<HTMLElement>('.nt-slot')];
    const rest = { mx: 0, my: 0, mz: 0, sh: 0, gx: 32, gy: 28, go: 0.35 };
    type Tilt = typeof rest & { dirty?: boolean };
    const tilt: Tilt[] = slots.map(() => ({ ...rest }));
    let pointer: { x: number; y: number } | null = null;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      pointer = { x: e.clientX, y: e.clientY };
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const onLeave = () => {
      pointer = null;
    };
    function frame() {
      let any = false;
      const box = el!.getBoundingClientRect();
      slots.forEach((slot, i) => {
        const s = tilt[i];
        const o = i - idxRef.current;
        let t = rest;
        if (pointer && Math.abs(o) <= 2) {
          const r = slot.getBoundingClientRect();
          const lx = (pointer.x - (r.left + r.width / 2)) / (r.width / 2);
          const ly = (pointer.y - (r.top + r.height / 2)) / (r.height / 2);
          const over = o === 0 && Math.hypot(lx, ly) < 1.05;
          const nx = over ? lx : (pointer.x - (box.left + box.width / 2)) / (box.width / 2);
          const ny = over ? ly : (pointer.y - (box.top + box.height / 2)) / (box.height / 2);
          const k = over ? 13 : o === 0 ? 6 : 3;
          t = { mx: nx * k, my: -ny * k, mz: over ? 26 : 0, sh: nx * 55, gx: 50 + nx * 38, gy: 50 + ny * 38, go: over ? 0.95 : 0.4 };
        }
        let moving = false;
        for (const k of Object.keys(rest) as (keyof typeof rest)[]) {
          const diff = t[k] - s[k];
          if (Math.abs(diff) > 0.01) {
            s[k] += diff * 0.12;
            moving = true;
          }
        }
        if (!moving && !s.dirty) return;
        s.dirty = moving;
        any = any || moving;
        const st = slot.style;
        st.setProperty('--mx', `${s.mx.toFixed(2)}deg`);
        st.setProperty('--my', `${s.my.toFixed(2)}deg`);
        st.setProperty('--mz', `${s.mz.toFixed(1)}px`);
        st.setProperty('--sh', `${s.sh.toFixed(1)}deg`);
        st.setProperty('--gx', `${s.gx.toFixed(1)}%`);
        st.setProperty('--gy', `${s.gy.toFixed(1)}%`);
        st.setProperty('--go', s.go.toFixed(2));
      });
      raf = any || pointer ? requestAnimationFrame(frame) : 0;
    }
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(raf);
    };
  }, [items.length]);

  // Opening: the outline erases, the text flickers out, the neighbours shrink away, and a copy
  // of the disc shrinks into the middle of the screen while the next page builds underneath.
  const open = (i: number) => {
    const it = items[i];
    if (leaving != null) return;
    const slot = stage.current?.querySelector<HTMLElement>(`.nt-slot[data-i="${i}"]`);
    if (!slot || reduced() || typeof slot.animate !== 'function') {
      navigate('study', it.to);
      return;
    }
    setLeaving(i);
    const r = slot.getBoundingClientRect();
    const fly = document.createElement('div');
    fly.className = 'nt-fly';
    fly.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`;
    fly.innerHTML = discHtml(it.face);
    const from = getComputedStyle(slot.querySelector('.nt-tilt')!).transform;
    const ft = fly.querySelector<HTMLElement>('.nt-tilt')!;
    ft.style.transform = from;
    document.body.appendChild(fly);
    slot.querySelector<HTMLElement>('.nt-disc')!.style.opacity = '0';
    const dx = innerWidth / 2 - (r.left + r.width / 2);
    const dy = innerHeight * 0.5 - (r.top + r.height / 2);
    fly.animate(
      [
        { transform: 'translate(0,0) scale(1)', easing: 'cubic-bezier(.3,0,.3,1)' },
        { transform: 'translate(0,0) scale(.93)', offset: 0.28, easing: 'cubic-bezier(.6,0,.25,1)' },
        { transform: `translate(${dx}px,${dy}px) scale(.035)`, opacity: 1, offset: 0.9 },
        { transform: `translate(${dx}px,${dy}px) scale(0)`, opacity: 0 },
      ],
      { duration: 1300, fill: 'forwards' },
    );
    ft.animate([{ transform: from }, { transform: 'rotateX(34deg) rotateY(-14deg) rotateZ(-18deg)' }], { duration: 1200, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' });
    fly.querySelector<HTMLElement>('.nt-art')?.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(540deg)' }], { duration: 1300, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' });
    setTimeout(() => {
      fromDisc = true;
      navigate('study', it.to);
    }, 520);
    setTimeout(() => fly.remove(), 1350);
  };

  const cur = items[idx];
  return (
    <section className={`nt-stage${leaving != null ? ' is-leaving' : ''}`} ref={stage} aria-label={heading}>
      <div className="nt-stage__info">
        <h1>{heading}</h1>
        {tools}
        <div key={cur.key} className="nt-stage__now">
          <h2>{cur.title}</h2>
          <table className="nt-meta">
            <tbody>
              {cur.rows.map(([k, v], r) => (
                <tr key={k} style={vars({ '--r': r })}>
                  <td>{k}</td>
                  <td>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="nt-stage__counter" aria-hidden="true">
        {pad(idx + 1)} <span>/ {pad(items.length)}</span>
      </div>
      <div className="nt-discs">
        {items.map((it, i) => {
          const o = i - idx;
          const a = Math.abs(o);
          const gone = leaving != null && i !== leaving;
          const lo = leaving != null ? i - leaving : 0;
          const style: CSSProperties = gone
            ? { transform: `translate3d(${lo * 50}%, ${-lo * 18}%, -160px) scale(.22)`, opacity: 0, zIndex: 20 - a, transition: 'transform .6s cubic-bezier(.55,0,.75,.2), opacity .4s .2s' }
            : { transform: `translate3d(${o * 90}%, ${-o * 34}%, ${-a * 80}px) scale(${o === 0 ? 1 : 0.9})`, opacity: a > 2 ? 0 : 1, zIndex: 20 - a, pointerEvents: a > 2 ? 'none' : 'auto' };
          return (
            <div
              key={it.key}
              className={`nt-slot${o === 0 ? ' is-active' : ''}`}
              data-i={i}
              role="button"
              tabIndex={o === 0 ? 0 : -1}
              aria-hidden={a > 2 || undefined}
              aria-label={o === 0 ? `Open ${it.title}` : `Show ${it.title}`}
              style={{ ...style, ...vars({ '--n': Math.min(a, 3) }) }}
              onClick={() => (i === idx ? open(i) : setIdx(i))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  open(idx);
                }
              }}
              dangerouslySetInnerHTML={{ __html: discHtml(it.face, (hashOf(it.key) % 97) + 5) }}
            />
          );
        })}
      </div>
      <div className="nt-stage__hook" key={`h${cur.key}`}>
        <span className="nt-stars" aria-hidden="true">
          ★★★★★
        </span>
        <span className="nt-src">{cur.ref}</span>
        <blockquote>“{cur.hook}”</blockquote>
      </div>
      <div className="nt-stage__hint">
        <div className="nt-arrows">
          <button type="button" onClick={() => move(-1)} disabled={idx === 0} aria-label="Previous disc">
            ←
          </button>
          <button type="button" onClick={() => move(1)} disabled={idx === last} aria-label="Next disc">
            →
          </button>
        </div>
        <span>Swipe or use the arrows · tap the disc to open</span>
      </div>
      <div className="nt-stage__credit" aria-hidden="true">
        A study edition
        <br />
        {credit}
      </div>
    </section>
  );
}

// ── index rows ──

function IdxRow({ to, r, title, covers, pct, i }: { to: string[]; r: string; title: string; covers: string; pct: number; i: number }) {
  return (
    <A className="nt-idx" to={to}>
      <span className="nt-idx__r">{r}</span>
      <span className="nt-idx__t">{title}</span>
      <span className="nt-idx__c">{covers}</span>
      <span className="nt-idx__p">
        <span className="nt-bar">
          <i style={vars({ width: `${pct}%`, '--i': i })} />
        </span>
        <span className="nt-bar__l">{pct}% understood</span>
      </span>
      <span aria-hidden="true">→</span>
    </A>
  );
}

// ── home: the four subjects ──

function HomeView({ read, marks }: { read: NotesRead; marks: CardMarks }) {
  const root = useRef<HTMLDivElement>(null);
  const today = useToday();
  const { level } = useNotesPrefs();
  useReveal(root, `home:${level}`);
  const cards = useMemo(() => deckStats(deck(), marks, today), [marks, today]);
  const terms = useMemo(() => glossary().length, []);
  const next = useMemo(() => nextUp(read, level === 'all' ? 'as' : level), [read, level]);
  const stats = useMemo(() => NOTE_SUBJECTS.map((s) => ({ s, p: subjectProgress(s, read) })), [read]);
  const items = useMemo<StageItem[]>(
    () =>
      stats.map(({ s, p }) => ({
        key: s.id,
        title: s.name,
        ref: s.board,
        rows: [
          ['Board', s.board],
          ['AS units', unitsAt(s, 'as').map((u) => u.code).join(' · ')],
          ['A2 units', unitsAt(s, 'a2').map((u) => u.code).join(' · ')],
          ['Topics', String(p.topics)],
          ['Understood', `${p.pct}% · ${p.done} of ${p.topics} topics`],
        ],
        hook: TAGLINE[s.id],
        face: discFace(s.id, s.hue, s.name, unitsAt(s, 'as').map((u) => u.code).join(' ')),
        to: ['notes', s.id],
      })),
    [stats],
  );
  const total = stats.reduce((a, x) => a + x.p.topics, 0);
  return (
    <div ref={root}>
      <Stage id="home" heading="Study notes" items={items} credit="AS and A2 units" />
      <section className="nt-lower nt-wrap">
        <div className="nt-wrap__in">
          <div className="nt-sect" data-rv="">
            <h2>The Index</h2>
            <span className="nt-lbl">
              {NOTE_SUBJECTS.length} subjects · {total} topics · {countTopics('as')} AS, {countTopics('a2')} A2
            </span>
          </div>
          {stats.map(({ s, p }, i) => (
            <div key={s.id} data-rv="">
              <IdxRow to={['notes', s.id]} r={pad(i + 1)} title={s.name} covers={`${s.board} · ${s.units.map((u) => u.code).join(' · ')}`} pct={p.pct} i={i} />
            </div>
          ))}
          {next.length > 0 && (
            <>
              <div className="nt-sect nt-sect--gap" data-rv="">
                <h2>Up Next</h2>
                <span className="nt-lbl">The first topic you haven’t finished</span>
              </div>
              <div className="nt-opts nt-opts--tight" data-rv="">
                <div className="nt-opt">
                  <span className="nt-lbl">Level</span>
                  <LevelPick />
                </div>
              </div>
              {next.map((n, i) => (
                <div key={n.subject.id} data-rv="">
                  <IdxRow to={['notes', n.subject.id, n.topic.id]} r={pad(i + 1)} title={n.topic.title} covers={`${n.subject.name} · ${n.topic.ref} · ${n.read ? `${n.read} of ${n.total} sections understood` : 'not started'}`} pct={Math.round((n.read / n.total) * 100)} i={i} />
                </div>
              ))}
            </>
          )}
          <div className="nt-sect nt-sect--gap" data-rv="">
            <h2>Study Tools</h2>
            <span className="nt-lbl">Made from these notes</span>
          </div>
          <div className="nt-feats" data-rv="">
            <A className="nt-feat" to={['notes', 'cards']}>
              <span className="nt-lbl">Remember</span>
              <h3>Flash cards</h3>
              <p>A card for every key term and set of formulas. The ones you miss come back sooner.</p>
              <span className="nt-feat__k">{cards.due ? `${cards.due} due today →` : `${cards.total} cards →`}</span>
            </A>
            <A className="nt-feat" to={['notes', 'formulas']}>
              <span className="nt-lbl">Look up</span>
              <h3>Formula sheet</h3>
              <p>Every formula by topic, with a cover so you can test yourself.</p>
              <span className="nt-feat__k">Formulas →</span>
            </A>
            <A className="nt-feat" to={['notes', 'glossary']}>
              <span className="nt-lbl">Define</span>
              <h3>Glossary</h3>
              <p>Every key term from A to Z, searchable, with the topic it comes from.</p>
              <span className="nt-feat__k">{terms} terms →</span>
            </A>
            <A className="nt-feat" to={['notes', 'tips']}>
              <span className="nt-lbl">Avoid</span>
              <h3>Tips and mistakes</h3>
              <p>The examiner’s tips and the common mistakes, gathered for the night before.</p>
              <span className="nt-feat__k">Read the list →</span>
            </A>
            <button type="button" className="nt-feat" onClick={() => openSheet({ type: 'focus' })}>
              <span className="nt-lbl">Concentrate</span>
              <h3>Focus timer</h3>
              <p>Time a session with nothing else on screen, then log it to Study.</p>
              <span className="nt-feat__k">Opens the timer</span>
            </button>
          </div>
          <div className="nt-sect nt-sect--gap" data-rv="">
            <h2>The Toolkit</h2>
            <span className="nt-lbl">Elsewhere in Study</span>
          </div>
          <div className="nt-feats" data-rv="">
            <A className="nt-feat" to={['papers']}>
              <span className="nt-lbl">Practise</span>
              <h3>Past papers</h3>
              <p>Every paper with mark schemes, scores and mocks kept back.</p>
              <span className="nt-feat__k">Papers →</span>
            </A>
            <A className="nt-feat" to={['papers', 'hard']}>
              <span className="nt-lbl">Stretch</span>
              <h3>Hard questions</h3>
              <p>The AS Physics questions the examiners say were answered worst, by topic.</p>
              <span className="nt-feat__k">180 questions →</span>
            </A>
            <button type="button" className="nt-feat" onClick={() => openSheet({ type: 'study' })}>
              <span className="nt-lbl">Track</span>
              <h3>Log study</h3>
              <p>Time spent reading these notes counts as a Study session like any other.</p>
              <span className="nt-feat__k">Opens the Study sheet</span>
            </button>
          </div>
        </div>
      </section>
      <Foot left="Edexcel International A Level · Cambridge International 9618" right="A study edition for one student" />
    </div>
  );
}

// ── a subject: its topics as discs, then the index by unit ──

function SubjectView({ subject, read }: { subject: NoteSubject; read: NotesRead }) {
  const root = useRef<HTMLDivElement>(null);
  const { level } = useNotesPrefs();
  useReveal(root, `${subject.id}:${level}`);
  const units = useMemo(() => unitsAt(subject, level), [subject, level]);
  const rows = useMemo(() => units.flatMap((unit) => unit.topics.map((topic) => ({ unit, topic, mins: minutesOf(topic) }))), [units]);
  const items = useMemo<StageItem[]>(
    () =>
      rows.map(({ unit, topic, mins }) => {
        const p = topicProgress(topic, read.get(topic.id));
        return {
          key: topic.id,
          title: topic.title,
          ref: topic.ref,
          rows: [
            ['Unit', `${unit.code} · ${unit.a2 ? 'A2' : 'AS'}`],
            ['Covers', topic.covers.split(' · ').slice(0, 3).join(', ')],
            ['Key terms', String(topic.terms.length)],
            ['Reading time', `${mins} min`],
            ['Understood', `${p.read} of ${p.total} sections`],
          ],
          hook: topic.hook,
          face: discFace(topic.id, subject.hue, topic.title, topic.ref),
          to: ['notes', subject.id, topic.id],
        };
      }),
    [rows, read, subject],
  );
  let n = 0;
  return (
    <div ref={root}>
      <Stage key={level} id={`${subject.id}:${level}`} heading={subject.name} items={items} credit={subject.board} tools={<LevelPick />} />
      <section className="nt-lower nt-wrap">
        <div className="nt-wrap__in">
          {units.map((unit, ui) => (
            <div key={unit.id}>
              <div className={`nt-sect${ui ? ' nt-sect--gap' : ''}`} data-rv="">
                <h2>{unit.name.replace(/^Unit \d · /, '')}</h2>
                <span className="nt-lbl">
                  {unit.code} · {unit.a2 ? 'A2' : 'AS'} · {unit.topics.length} topics
                </span>
              </div>
              {unit.topics.map((t) => (
                <div key={t.id} data-rv="">
                  <IdxRow to={['notes', subject.id, t.id]} r={pad(++n)} title={t.title} covers={t.covers} pct={topicProgress(t, read.get(t.id)).pct} i={n} />
                </div>
              ))}
            </div>
          ))}
          <div className="nt-sect nt-sect--gap" data-rv="">
            <h2>Study Tools</h2>
            <span className="nt-lbl">{subject.name}</span>
          </div>
          <div className="nt-feats" data-rv="">
            <A className="nt-feat nt-feat--low" to={['notes', 'cards', subject.id]}>
              <span className="nt-lbl">Remember</span>
              <h3>Flash cards</h3>
              <span className="nt-feat__k">Start a sitting →</span>
            </A>
            <A className="nt-feat nt-feat--low" to={['notes', 'formulas', subject.id]}>
              <span className="nt-lbl">Look up</span>
              <h3>Formula sheet</h3>
              <span className="nt-feat__k">Formulas →</span>
            </A>
            <A className="nt-feat nt-feat--low" to={['notes', 'tips', subject.id]}>
              <span className="nt-lbl">Avoid</span>
              <h3>Tips and mistakes</h3>
              <span className="nt-feat__k">Read the list →</span>
            </A>
          </div>
        </div>
      </section>
      <Foot left={`${subject.board} · ${subject.name}`} right="A study edition for one student" />
    </div>
  );
}

// ── a topic ──

const POSTER_SPOTS: [number, number, 'left' | 'right'][] = [
  [7, 17, 'left'],
  [7, 31, 'right'],
  [11, 66, 'left'],
  [9, 66, 'right'],
];

function posterWords(t: NoteTopic): string[] {
  const pick = (s: string) => s.split(/[\s’'·,–-]+/).map((w) => w.toUpperCase());
  const ok = (w: string) => w.length >= 3 && w.length <= 9 && /^[A-Z]+$/.test(w);
  const words = [...new Set([...t.terms.map((k) => pick(k.t)[0]), ...pick(t.title)].filter(ok))];
  return words.slice(0, 4);
}

function TopicView({ subject, unit, topic, index, read }: { subject: NoteSubject; unit: NoteUnit; topic: NoteTopic; index: number; read: NotesRead }) {
  const all = useMemo(() => topicsOf(subject), [subject]);
  const next = all[(index + 1) % all.length];
  const done = read.get(topic.id);
  const p = topicProgress(topic, done);
  const secs = [{ id: TERMS_ID, title: 'Key terms' }, ...topic.sections.map((s) => ({ id: s.id, title: s.title }))];
  const root = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLElement>(null);
  const [cur, setCur] = useState(TERMS_ID);
  const [cover, setCover] = useState(false);
  const [peeked, setPeeked] = useState<ReadonlySet<string>>(new Set());
  const [intro] = useState(() => {
    const f = fromDisc;
    fromDisc = false;
    return f;
  });
  useReveal(root, topic.id);

  // which section is on screen, and how far down the notes you are
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const sections = [...el.querySelectorAll<HTMLElement>('.nt-article > section')];
    let raf = 0;
    const measure = () => {
      raf = 0;
      const art = el.querySelector<HTMLElement>('.nt-article');
      if (!art) return;
      const r = art.getBoundingClientRect();
      const at = Math.max(0, Math.min(1, (innerHeight * 0.5 - r.top) / Math.max(1, r.height)));
      if (bar.current) bar.current.style.transform = `scaleX(${at.toFixed(4)})`;
      let on = sections[0]?.dataset.sec ?? TERMS_ID;
      for (const s of sections) if (s.getBoundingClientRect().top < innerHeight * 0.4) on = s.dataset.sec ?? on;
      setCur(on);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    return () => {
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [topic.id]);

  const scrollTo = (id: string) => document.getElementById(`nt-${id}`)?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
  const words = useMemo(() => posterWords(topic), [topic]);
  const len = Math.max(...topic.lines.map((l) => l.length));
  const mins = useMemo(() => minutesOf(topic), [topic]);

  const understood = (id: string) => {
    const on = done?.has(id) ?? false;
    return (
      <div className={`nt-und${on ? ' is-on' : ''}`}>
        <label>
          <input type="checkbox" checked={on} onChange={(e) => setSection(topic.id, id, e.target.checked)} />
          <span>I understand this section</span>
        </label>
        <svg className="nt-und__tick" viewBox="0 0 40 40" aria-hidden="true">
          <circle cx="20" cy="20" r="16" pathLength={1} />
          <path d="M12,21 l6,6 l11,-13" pathLength={1} />
        </svg>
      </div>
    );
  };

  return (
    <div ref={root} className={`nt-topic nt-intro${intro ? ' nt-intro--disc' : ''}`}>
      <div className="nt-prog" aria-hidden="true">
        <i ref={bar} />
      </div>
      <section className="nt-hero nt-wrap">
        <div className="nt-wrap__in" style={vars({ '--len': len })}>
          <h1>
            {topic.lines.map((l, i) => (
              <span key={i} className="nt-ln" style={vars({ '--i': i })}>
                <span>
                  {l}
                  {i < topic.lines.length - 1 ? ' ' : ''}
                </span>
              </span>
            ))}
          </h1>
          <div className="nt-credits">
            <div className="nt-credits__t">
              <small>Board</small>
              {subject.board} <small>Unit</small>
              {unit.code} · {unit.name.replace(/^Unit \d · /, '')} ({unit.a2 ? 'A2' : 'AS'})
              <br />
              <small>Covers</small>
              {topic.covers}
            </div>
          </div>
          <table className="nt-meta nt-meta--wide">
            <tbody>
              {(
                [
                  ['Reference', topic.ref],
                  ['Sections', String(secs.length)],
                  ['Key terms', String(topic.terms.length)],
                  ['Reading time', `${mins}:00`],
                  ['Understood', p.read === p.total ? 'Every section' : `${p.read} of ${p.total} sections`],
                ] as const
              ).map(([k, v], r) => (
                <tr key={k} style={vars({ '--r': r })}>
                  <td>{k}</td>
                  <td>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="nt-ctas">
            <span className="nt-plus nt-plus--tl" />
            <span className="nt-plus nt-plus--tr" />
            <span className="nt-plus nt-plus--bl" />
            <span className="nt-plus nt-plus--br" />
            <div className="nt-btns">
              <button type="button" className="nt-ruled" style={vars({ '--i': 0 })} onClick={() => scrollTo(TERMS_ID)}>
                Start reading
              </button>
              <A className="nt-ruled" to={['notes', 'cards', subject.id, topic.id]}>
                Flash cards
              </A>
              <A className="nt-ruled" to={['papers']}>
                Past papers
              </A>
              <button type="button" className="nt-ruled" style={vars({ '--i': 2 })} onClick={() => openSheet({ type: 'study', subject: subject.study, topic: topic.title })}>
                Log time
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="nt-poster" aria-label="In one line">
        <div className="nt-poster__bg" dangerouslySetInnerHTML={{ __html: posterArt(topic.id, subject.hue) }} />
        <div className="nt-poster__tear" dangerouslySetInnerHTML={{ __html: tear(index * 7 + 3) }} />
        {words.map((w, i) => {
          const [x, y, side] = POSTER_SPOTS[i];
          return (
            <span key={w} className="nt-poster__w" style={vars({ [side]: `${x}%`, top: `${y}%`, '--i': i })} aria-hidden="true">
              {w}
            </span>
          );
        })}
        <p className="nt-poster__hook">“{topic.hook}”</p>
        <p className="nt-poster__syn">{topic.covers}</p>
      </section>

      <div className="nt-wrap">
        <div className="nt-body">
          <aside className="nt-toc" aria-label="Contents">
            <span className="nt-lbl">Contents</span>
            <div className="nt-toc__prog">
              <span className="nt-bar">
                <i style={{ width: `${p.pct}%` }} />
              </span>
              <span className="nt-bar__l">
                {p.read}/{p.total} sections understood
              </span>
            </div>
            <ol>
              {secs.map((s, i) => (
                <li key={s.id}>
                  <button type="button" className={cur === s.id ? 'is-cur' : undefined} onClick={() => scrollTo(s.id)}>
                    <span>{pad(i + 1)}</span>
                    <span>{s.title}</span>
                    <i className={`nt-tick${done?.has(s.id) ? ' is-done' : ''}`} />
                  </button>
                </li>
              ))}
            </ol>
            <div className="nt-toc__tools">
              <A to={['notes', 'cards', subject.id, topic.id]}>
                <span>Flash cards for this topic</span>
                <span aria-hidden="true">→</span>
              </A>
              <A to={['papers']}>
                <span>Past papers</span>
                <span aria-hidden="true">→</span>
              </A>
              <button type="button" onClick={() => openSheet({ type: 'study', subject: subject.study, topic: topic.title })}>
                <span>Log study time</span>
                <span aria-hidden="true">+</span>
              </button>
              {topic.link && (
                <a href={topic.link.href} target="_blank" rel="noreferrer">
                  <span>{topic.link.label}</span>
                  <span aria-hidden="true">↗</span>
                </a>
              )}
            </div>
          </aside>

          <article className="nt-article">
            <section id={`nt-${TERMS_ID}`} data-sec={TERMS_ID} data-rv="">
              <h2>
                <span className="nt-n">{topic.ref} · 01</span>Key terms
              </h2>
              <button
                type="button"
                className="nt-link nt-coverbtn"
                aria-pressed={cover}
                onClick={() => {
                  setCover((c) => !c);
                  setPeeked(new Set());
                }}
              >
                {cover ? 'Show the definitions' : 'Cover the definitions and test yourself'}
              </button>
              <dl className="nt-terms">
                {topic.terms.map((k) => (
                  <div key={k.t}>
                    <dt>{k.t}</dt>
                    <dd>
                      {cover && !peeked.has(k.t) ? (
                        <button type="button" className="nt-cover" onClick={() => setPeeked((s) => new Set(s).add(k.t))} aria-label={`Show the definition of ${k.t}`}>
                          Say it, then tap to check
                        </button>
                      ) : (
                        <R t={k.d} />
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
              {understood(TERMS_ID)}
            </section>
            {topic.sections.map((s, i) => (
              <section key={s.id} id={`nt-${s.id}`} data-sec={s.id} data-rv="">
                <h2>
                  <span className="nt-n">
                    {topic.ref} · {pad(i + 2)}
                  </span>
                  {s.title}
                </h2>
                {s.body.map((b, j) => (
                  <BlockView key={j} b={b} />
                ))}
                {understood(s.id)}
              </section>
            ))}
          </article>
        </div>
      </div>

      <A className="nt-next" to={['notes', subject.id, next.id]} label={`Next topic: ${next.title}`}>
        <span className="nt-lbl">Next · {next.ref}</span>
        <span className="nt-next__w nt-next__w--a">{next.lines[0]}</span>
        <span className="nt-next__w nt-next__w--b">{next.lines[1] ?? ''}</span>
        <span className="nt-next__peek" dangerouslySetInnerHTML={{ __html: discHtml(discFace(next.id, subject.hue, next.title, next.ref), index * 5 + 2) }} />
      </A>
      <Foot left={`${topic.ref} · ${topic.title}`} right={`A study edition · ${subject.board}`} />
    </div>
  );
}

// ── the top bar and search ──

function Search({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('');
  const hits = useMemo(() => searchNotes(q), [q]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="nt-search" role="dialog" aria-label="Search the notes">
      <button type="button" className="nt-search__scrim" onClick={onClose} aria-label="Close search" />
      <div className="nt-search__box">
        <input autoFocus type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search topics and key terms…" aria-label="Search topics and key terms" autoComplete="off" spellCheck={false} />
        <div className="nt-search__res">
          {hits.map((h) => (
            <A key={`${h.topic.id}:${h.term ?? ''}`} to={['notes', h.subject.id, h.topic.id]}>
              <span className="nt-lbl">
                {h.subject.name} · {h.term ? 'Key term' : h.topic.ref}
              </span>
              <b>{h.term ?? h.topic.title}</b>
              <small>{h.term ? h.topic.title : h.topic.covers}</small>
            </A>
          ))}
          {q.trim().length >= 2 && !hits.length && <p>Nothing matches “{q.trim()}”.</p>}
        </div>
      </div>
    </div>
  );
}

function TopBar({ back, backLabel, crumb }: { back: string[]; backLabel: string; crumb: string }) {
  const [search, setSearch] = useState(false);
  const onBack = (e: ReactMouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault();
    navigate('study', back);
  };
  return (
    <header className="nt-nav">
      <a className="nt-nav__back" href={`/study${back.length ? `/${back.join('/')}` : ''}`} onClick={onBack}>
        ← {backLabel}
      </a>
      <span className="nt-nav__logo" aria-hidden="true">
        {crumb}
      </span>
      <button type="button" className="nt-nav__btn" onClick={() => setSearch(true)} aria-label="Search the notes">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-4-4" />
        </svg>
        <span>Search</span>
      </button>
      {search && <Search onClose={() => setSearch(false)} />}
    </header>
  );
}

export default function NotesPage() {
  const route = useRoute();
  const [, sub, top] = route.rest;
  const read = useNotes();
  const marks = useCards();
  useEffect(loadFonts, []);
  const subject = sub ? subjectById(sub) : undefined;
  const ref = subject && top ? findTopic(subject.id, top) : undefined;
  if (isTool(sub)) {
    const of = top ? subjectById(top) : undefined;
    const sitting = sub === 'cards' && (top === 'all' || !!of);
    const topicOf = sitting && of && route.rest[3] ? findTopic(of.id, route.rest[3]) : undefined;
    return (
      <div className="nt">
        {sitting ? (
          <>
            <TopBar back={topicOf ? ['notes', topicOf.subject.id, topicOf.topic.id] : ['notes', 'cards']} backLabel={topicOf ? 'Notes' : 'Decks'} crumb="Flash cards" />
            <CardsSession key={`${top}/${topicOf?.topic.id ?? ''}`} scope={top!} topicId={topicOf?.topic.id} marks={marks} />
          </>
        ) : (
          <>
            <TopBar back={['notes']} backLabel="Notes" crumb={TOOL_NAME[sub]} />
            {sub === 'cards' ? <CardsHome marks={marks} /> : sub === 'formulas' ? <FormulaSheet subject={of ?? NOTE_SUBJECTS[0]} /> : sub === 'glossary' ? <GlossaryView /> : <TipsView subject={of ?? NOTE_SUBJECTS[0]} />}
          </>
        )}
      </div>
    );
  }
  return (
    <div className="nt">
      {ref ? (
        <>
          <TopBar back={['notes', ref.subject.id]} backLabel={ref.subject.name} crumb={ref.topic.ref} />
          <TopicView key={ref.topic.id} {...ref} read={read} />
        </>
      ) : subject ? (
        <>
          <TopBar back={['notes']} backLabel="Notes" crumb={subject.name} />
          <SubjectView key={subject.id} subject={subject} read={read} />
        </>
      ) : (
        <>
          <TopBar back={[]} backLabel="Study" crumb="Notes" />
          <HomeView read={read} marks={marks} />
        </>
      )}
    </div>
  );
}
