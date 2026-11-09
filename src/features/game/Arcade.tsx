/**
 * 遊 The Arcade: bingo, sugoroku and the pond. Each plays with what you've logged (arcade.ts), and
 * each roll, cast and claim is a saved record.
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { navigate, useRoute } from '../../app/router';
import { useProgress } from '../../data/lt';
import {
  BOARD,
  BOOK_PRIZES,
  biting,
  bingoPrize,
  CAST_CAP,
  DICE_CAP,
  FISH,
  FULL_PRIZE,
  GOLD_LINE_PRIZE,
  hotCells,
  isNight,
  LINE_PRIZE,
  lineName,
  REELS,
  ZONE,
  type ArcadeState,
  type Bite,
  type BingoState,
  type Fish,
  type Roll,
} from '../../domain/game/arcade';
import { RARITY, type Bag } from '../../domain/game/catalog';
import { plus } from '../../domain/game/wallet';
import { shortDay, monthName } from '../../domain/log/dates';
import { H2 } from '../../ui/i/bits';
import { playStyle } from '../../ui/i/fx/celebrate';
import { Robot } from '../../ui/i/bots/Robot';
import { lootLines, num, Rar } from './bits';
import { claimAllBingo, claimBingo, claimBook, endCast, nextBite, pondContext, rollOnce, useArcade } from './arcadeStore';
import { showReveal } from './revealStore';
import { useLoadout } from './store';
import './arcade.css';

const GAMES = [
  { id: 'bingo', label: 'Bingo', kanji: '賓' },
  { id: 'board', label: 'Sugoroku', kanji: '双' },
  { id: 'pond', label: 'Pond', kanji: '釣' },
] as const;
type GameId = (typeof GAMES)[number]['id'];

export function ArcadeTab() {
  const route = useRoute();
  const game: GameId = GAMES.find((x) => x.id === route.rest[1])?.id ?? 'bingo';
  const a = useArcade();
  const badge = (id: GameId) => (id === 'bingo' ? a.bingo.toClaim.length + (a.lastBingo?.toClaim.length ?? 0) : id === 'board' ? a.dice.now : a.casts.now + a.bookToClaim.length);
  return (
    <section className="ar" aria-label="Arcade">
      <div className="ar-marquee" aria-hidden="true">
        <span>遊</span>
        <b>ARCADE</b>
        <span>遊</span>
      </div>
      <nav className="ar-games" aria-label="Arcade games">
        {GAMES.map((x) => (
          <button key={x.id} type="button" className="ar-game" aria-current={game === x.id ? 'page' : undefined} onClick={() => navigate('hangar', ['arcade', x.id], { replace: true })}>
            <span aria-hidden="true">{x.kanji}</span>
            <b>{x.label}</b>
            {badge(x.id) > 0 && <i className="gm-tab__n">{badge(x.id)}</i>}
          </button>
        ))}
      </nav>
      {game === 'bingo' ? <BingoGame a={a} /> : game === 'board' ? <BoardGame a={a} /> : <PondGame a={a} />}
      <Guide />
    </section>
  );
}

function prizeLine(b: Bag) {
  return lootLines(b)
    .map((l) => l.label)
    .join(' + ');
}

// ─── bingo ──────────────────────────────────────────────────────────────────

function BingoGame({ a }: { a: ArcadeState }) {
  const s = a.bingo;
  const marked = s.progress.filter((p) => p.marked).length;
  const lines = s.lines.filter((l) => l.complete).length;
  return (
    <>
      {a.lastBingo && <Leftovers s={a.lastBingo} />}
      <H2 aside={`${marked}/16 · ${lines}/10 lines`}>This week's card</H2>
      <Card s={s} />
      <Claims s={s} />
      <p className="i-note">
        Cells mark themselves from what you log this week. Each line pays {prizeLine(LINE_PRIZE)}; a line through the gold cell pays {prizeLine(GOLD_LINE_PRIZE)}. All sixteen: {prizeLine(FULL_PRIZE)}. A new card every Monday.
      </p>
    </>
  );
}

function Card({ s }: { s: BingoState }) {
  const hot = hotCells(s);
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="ar-bingo">
      <ol className="ar-card" aria-label="Bingo card">
        {s.progress.map((p, i) => {
          const gold = s.card.gold === i;
          const cls = ['ar-cell', p.marked && 'is-marked', gold && 'is-gold', hot.has(i) && 'is-hot', open === i && 'is-open'].filter(Boolean).join(' ');
          return (
            <li key={p.def.id} className={cls}>
              <button type="button" onClick={() => setOpen(open === i ? null : i)} aria-label={`${p.def.label}: ${p.marked ? 'done' : `${num(p.done)} of ${num(p.def.goal)}`}${gold ? ', gold cell' : ''}${hot.has(i) ? ', completes a line' : ''}`}>
                <span className="ar-cell__k" aria-hidden="true">
                  {p.def.kanji}
                </span>
                <span className="ar-cell__l">{p.def.label}</span>
                {!p.marked && p.def.goal > 1 && (
                  <span className="ar-cell__bar" aria-hidden="true">
                    <i style={{ width: `${(p.done / p.def.goal) * 100}%` }} />
                  </span>
                )}
                {p.marked && (
                  <span className="ar-cell__stamp" aria-hidden="true">
                    済
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ol>
      {open != null && (
        <p className="ar-cell__more" aria-live="polite">
          <b>{s.progress[open].def.label}</b> · {s.progress[open].marked ? 'done' : `${num(s.progress[open].done)} of ${num(s.progress[open].def.goal)}`}
          {s.card.gold === open && ' · the gold cell: its lines pay double'}
          {hotCells(s).has(open) && ' · one more and a line is yours'}
        </p>
      )}
    </div>
  );
}

function revealGain(title: string, gains: Bag[], art: 'bingo' | 'fish', line?: string) {
  if (!gains.length) return;
  const gain = gains.reduce((x, y) => plus(x, y), {} as Bag);
  showReveal({ kind: 'loot', art, title, line, gain });
}

function Claims({ s }: { s: BingoState }) {
  if (!s.toClaim.length) return null;
  return (
    <div className="ar-claims">
      <ul>
        {s.toClaim.map((l) => (
          <li key={String(l)}>
            <b>{l === 'full' ? 'Full card!' : lineName(l)}</b>
            <small>
              {prizeLine(bingoPrize(s, l))}
              {l !== 'full' && s.lines[l].gold ? ' · gold line' : ''}
            </small>
          </li>
        ))}
      </ul>
      <button type="button" className="i-btn i-btn--sig" onClick={() => revealGain(s.toClaim.length === 1 ? 'Bingo!' : `Bingo × ${s.toClaim.length}`, claimAllBingo(s), 'bingo', s.toClaim.includes('full') ? 'A full card. The caller tips their hat.' : undefined)}>
        Claim {s.toClaim.length === 1 ? 'it' : `all ${s.toClaim.length}`}
      </button>
    </div>
  );
}

function Leftovers({ s }: { s: BingoState }) {
  return (
    <div className="ar-left">
      <p>
        <b>Last week's card</b> still has {s.toClaim.length} prize{s.toClaim.length === 1 ? '' : 's'} to claim.
      </p>
      <button
        type="button"
        className="i-btn i-btn--sm i-btn--sig"
        onClick={() => {
          const out = s.toClaim.map((l) => claimBingo(s, l)).filter((x): x is Bag => !!x);
          revealGain("Last week's bingo", out, 'bingo');
        }}
      >
        Claim
      </button>
    </div>
  );
}

// ─── sugoroku ───────────────────────────────────────────────────────────────

/** Square i of the board → [row, col] on a 9 × 9 ring, Start at the bottom right, going clockwise. */
function cellOf(i: number): [number, number] {
  if (i <= 8) return [8, 8 - i];
  if (i <= 16) return [8 - (i - 8), 0];
  if (i <= 24) return [0, i - 16];
  return [i - 24, 8];
}

const DIE = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

function BoardGame({ a }: { a: ArcadeState }) {
  const stage = useProgress().overall.stage;
  const look = useLoadout();
  const [shown, setShown] = useState(a.board.pos);
  const [busy, setBusy] = useState(false);
  const [face, setFace] = useState<number | null>(null);
  const [last, setLast] = useState<Roll | null>(null);
  const [pick, setPick] = useState<number | null>(null);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  useEffect(() => {
    if (!busy) setShown(a.board.pos);
  }, [a.board.pos, busy]);

  const go = () => {
    if (busy) return;
    const from = a.board.pos;
    const r = rollOnce();
    if (!r) return;
    setPick(null);
    if (playStyle() !== 'full') {
      setFace(r.value);
      setShown(r.to);
      setLast(r);
      return;
    }
    setBusy(true);
    setLast(null);
    const at = (ms: number, f: () => void) => timers.current.push(window.setTimeout(f, ms));
    // The die tumbles…
    for (let i = 0; i < 8; i++) at(i * 70, () => setFace(1 + ((i * 5 + r.value) % 6)));
    at(600, () => setFace(r.value));
    // …then the robot hops square by square, and the wind carries it on.
    const path: number[] = [];
    for (let k = 1; k <= r.value; k++) path.push((from + k) % BOARD.length);
    if (r.windFrom != null) for (let k = 1; k <= (BOARD[r.windFrom].jump ?? 0); k++) path.push((r.windFrom + k) % BOARD.length);
    path.forEach((p, k) => at(800 + k * 210 + (r.windFrom != null && k >= r.value ? 120 : 0), () => setShown(p)));
    at(800 + path.length * 210 + 250, () => {
      setBusy(false);
      setLast(r);
    });
  };

  const tile = BOARD[pick ?? shown];
  return (
    <>
      <H2 aside={`Lap ${a.board.lap + 1} · ${a.board.rolls} roll${a.board.rolls === 1 ? '' : 's'}`}>Sugoroku 双六</H2>
      <div className="ar-board" role="group" aria-label="Sugoroku board">
        {BOARD.map((t, i) => {
          const [r, c] = cellOf(i);
          return (
            <button
              key={i}
              type="button"
              className={`ar-sq ar-sq--${t.kind}${shown === i ? ' is-here' : ''}${pick === i ? ' is-pick' : ''}`}
              style={{ gridRow: r + 1, gridColumn: c + 1 } as CSSProperties}
              aria-label={`Square ${i}: ${t.label}${shown === i ? ', you are here' : ''}`}
              onClick={() => setPick(pick === i ? null : i)}
            >
              <span aria-hidden="true">{t.kanji}</span>
              {shown === i && (
                <span className="ar-token i-drone" aria-hidden="true">
                  <Robot stage={stage} look={look} still label={false} />
                </span>
              )}
            </button>
          );
        })}
        <div className="ar-board__mid">
          <div className={`ar-die${busy ? ' is-rolling' : ''}`} aria-hidden="true">
            {face ? DIE[face] : '🎲'}
          </div>
          <p className="ar-board__tile" aria-live="polite">
            {busy ? 'Rolling…' : last ? landLine(last) : pick != null ? tile.label : `On: ${BOARD[shown].label}`}
          </p>
          <button type="button" className="i-btn i-btn--sig" disabled={busy || a.dice.now < 1} onClick={go}>
            Roll · {a.dice.now} {a.dice.now === 1 ? 'die' : 'dice'}
          </button>
        </div>
      </div>
      {last && !busy && lootLines(last.gain).length > 0 && (
        <p className="ar-won" aria-live="polite">
          <b>Won</b> {prizeLine(last.gain)}
          {last.tile.kind === 'dice' && ' · and a die to roll again'}
          {last.tile.kind === 'pond' && ' · and 2 casts at the pond'}
        </p>
      )}
      {last && !busy && !lootLines(last.gain).length && (last.tile.kind === 'dice' || last.tile.kind === 'pond') && (
        <p className="ar-won" aria-live="polite">
          {last.tile.kind === 'dice' ? 'A lucky die: roll again.' : 'The pond square: 2 free casts are waiting.'}
        </p>
      )}
      <p className="i-note">
        Dice: one for each day you log anything, one more for a day with three sections, one more for a 120-XP day (up to {DICE_CAP} saved). Pass Start for a lap prize; tap a square to see what's on it.
      </p>
    </>
  );
}

function landLine(r: Roll): string {
  const wind = r.windFrom != null ? 'The wind blew you on! ' : '';
  const lap = r.passedStart ? `Lap ${r.lap} done! ` : '';
  if (r.fortune) return `${lap}${wind}Shrine: ${r.fortune.kanji} ${r.fortune.name}.`;
  return `${lap}${wind}Rolled ${r.value}: ${r.tile.label}.`;
}

// ─── the pond ───────────────────────────────────────────────────────────────

type Phase = { k: 'idle' } | { k: 'wait'; b: Bite } | { k: 'bite'; b: Bite } | { k: 'reel'; b: Bite; hits: number; slips: number; perfect: boolean } | { k: 'done'; b: Bite; landed: boolean; why?: string; perfect: boolean; gain: Bag | null };

function PondGame({ a }: { a: ArcadeState }) {
  const [phase, setPhase] = useState<Phase>({ k: 'idle' });
  const timer = useRef<number | null>(null);
  const clear = () => {
    if (timer.current != null) window.clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => clear, []);
  const ctx = pondContext(a);
  const night = isNight(ctx.hour);
  const now = biting(ctx);

  const finish = (b: Bite, landed: boolean, perfect: boolean, why?: string) => {
    clear();
    const gain = endCast(b, landed, perfect);
    setPhase({ k: 'done', b, landed, why, perfect, gain });
  };

  const cast = () => {
    const b = nextBite();
    if (!b) return;
    setPhase({ k: 'wait', b });
    clear();
    timer.current = window.setTimeout(() => {
      setPhase({ k: 'bite', b });
      // Calm mode gives more time to react.
      timer.current = window.setTimeout(() => finish(b, false, false, 'Too slow: it spat the hook.'), playStyle() === 'full' ? 1300 : 2600);
    }, b.wait * 1000);
  };

  const tap = () => {
    if (phase.k === 'wait') return finish(phase.b, false, false, 'Too early: you spooked it.');
    if (phase.k === 'bite') {
      clear();
      setPhase({ k: 'reel', b: phase.b, hits: 0, slips: 0, perfect: true });
    }
  };

  return (
    <>
      <H2 aside={`${a.casts.now} cast${a.casts.now === 1 ? '' : 's'}`}>The pond 釣り堀</H2>
      <div className={`ar-pond${night ? ' is-night' : ''} ar-pond--${phase.k}`}>
        <div className="ar-pond__sky" aria-hidden="true">
          <span className="ar-pond__orb" />
        </div>
        <div className="ar-pond__water" aria-hidden="true">
          <span className="ar-ripple" />
          <span className="ar-ripple ar-ripple--2" />
          {(phase.k === 'wait' || phase.k === 'bite') && (
            <span className="ar-float">
              <i />
            </span>
          )}
          {phase.k === 'bite' && <span className="ar-bang">!</span>}
          {phase.k === 'done' && phase.landed && (
            <span className="ar-catch">
              <FishArt f={phase.b.fish} />
            </span>
          )}
        </div>
        <div className="ar-pond__ctl">
          {phase.k === 'idle' && (
            <>
              <p>
                {night ? 'Night at the pond.' : 'Day at the pond.'} {now.length} kinds biting{now.some((f) => f.section) ? `, including ${now.filter((f) => f.section).length} spirit fish from today's sections` : ''}.
              </p>
              <button type="button" className="i-btn i-btn--sig" disabled={a.casts.now < 1} onClick={cast}>
                Cast
              </button>
            </>
          )}
          {(phase.k === 'wait' || phase.k === 'bite') && (
            <>
              <p aria-live="assertive">{phase.k === 'wait' ? 'Wait for the float to dip…' : 'A bite! Strike now!'}</p>
              <button type="button" className={`i-btn ${phase.k === 'bite' ? 'i-btn--sig ar-strike' : ''}`} onClick={tap}>
                Strike!
              </button>
            </>
          )}
          {phase.k === 'reel' && (
            <Reel
              key={`${phase.b.n}:${phase.hits}:${phase.slips}`}
              b={phase.b}
              hits={phase.hits}
              slips={phase.slips}
              onStop={(hit, centre) => {
                if (!hit) {
                  if (phase.slips >= 1) return finish(phase.b, false, false, 'The line snapped.');
                  return setPhase({ ...phase, slips: phase.slips + 1, perfect: false });
                }
                const hits = phase.hits + 1;
                const perfect = phase.perfect && centre;
                if (hits >= REELS[phase.b.fish.rarity]) return finish(phase.b, true, perfect);
                setPhase({ ...phase, hits, perfect });
              }}
            />
          )}
          {phase.k === 'done' && (
            <div className="ar-result" aria-live="polite">
              {phase.landed ? (
                <>
                  <p>
                    <Rar r={phase.b.fish.rarity} /> <b>{phase.b.fish.name}</b> {phase.b.fish.jp} · {phase.b.cm} cm{phase.perfect ? ' · perfect reel' : ''}
                  </p>
                  {phase.gain && <small>{prizeLine(phase.gain)}{phase.gain.gems ? ' · new in the fish book!' : ''}</small>}
                </>
              ) : (
                <>
                  <p>
                    <b>It got away.</b> {phase.why}
                  </p>
                  <small>It was something {RARITY[phase.b.fish.rarity].name.toLowerCase()}. {phase.gain ? `${prizeLine(phase.gain)} for the bait back.` : ''}</small>
                </>
              )}
              <button type="button" className="i-btn i-btn--sig" onClick={() => (a.casts.now > 0 ? cast() : setPhase({ k: 'idle' }))}>
                {a.casts.now > 0 ? `Cast again · ${a.casts.now} left` : 'Done'}
              </button>
            </div>
          )}
        </div>
      </div>
      <p className="i-note">
        Casts: one for each day you log anything and one more per 40 XP that day, five a day at most (up to {CAST_CAP} saved). Strike when the float dips, then stop the needle in the green. Night fish bite from 19:00; spirit fish only on a day you logged their section.
      </p>
      <Book a={a} />
    </>
  );
}

/** Stop the needle in the zone. Rarer fish: a smaller zone and a faster needle. */
function Reel({ b, hits, slips, onStop }: { b: Bite; hits: number; slips: number; onStop: (hit: boolean, centre: boolean) => void }) {
  const need = REELS[b.fish.rarity];
  const zone = ZONE[b.fish.rarity];
  const speed = 0.9 + RARITY[b.fish.rarity].order * 0.25 + hits * 0.15;
  const calm = playStyle() !== 'full';
  const [x, setX] = useState(0);
  const pos = useRef(0);
  const centre = useRef(0.2 + ((b.n * 7 + hits * 3) % 6) / 10);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      // A triangle wave from 0 to 1 and back.
      const p = (((t - t0) / 1000) * speed * (calm ? 0.55 : 1)) % 2;
      pos.current = p < 1 ? p : 2 - p;
      setX(pos.current);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [speed, calm]);
  const lo = Math.max(0, centre.current - zone / 2);
  const hi = Math.min(1, centre.current + zone / 2);
  const stop = () => {
    const v = pos.current;
    const hit = v >= lo && v <= hi;
    onStop(hit, hit && Math.abs(v - centre.current) <= zone / 6);
  };
  return (
    <div className="ar-reel">
      <p aria-live="polite">
        Reel it in: {hits}/{need}
        {slips ? ' · the line is fraying' : ''}
      </p>
      <div className="ar-reel__bar" aria-hidden="true">
        <span className="ar-reel__zone" style={{ left: `${lo * 100}%`, width: `${(hi - lo) * 100}%` }}>
          <i />
        </span>
        <span className="ar-reel__needle" style={{ left: `${x * 100}%` }} />
      </div>
      <button type="button" className="i-btn i-btn--sig ar-strike" onClick={stop}>
        Reel!
      </button>
    </div>
  );
}

function Book({ a }: { a: ArcadeState }) {
  const p = a.pond;
  const [open, setOpen] = useState<string | null>(null);
  const sel = open ? FISH.find((f) => f.id === open) : null;
  const entry = sel ? p.book.get(sel.id) : null;
  return (
    <>
      <H2 aside={`${p.book.size}/${FISH.length} kinds · ${p.caught} caught`}>Fish book 魚譜</H2>
      {a.bookToClaim.length > 0 && (
        <div className="ar-left">
          <p>
            <b>Fish book prize:</b> {a.bookToClaim.map((n) => `${n} kinds`).join(', ')}.
          </p>
          <button
            type="button"
            className="i-btn i-btn--sm i-btn--sig"
            onClick={() => {
              const out = a.bookToClaim.map((n) => claimBook(n)).filter((x): x is Bag => !!x);
              revealGain('Fish book', out, 'fish');
            }}
          >
            Claim
          </button>
        </div>
      )}
      <ol className="ar-book">
        {FISH.map((f) => {
          const e = p.book.get(f.id);
          return (
            <li key={f.id} className={`${e ? 'is-got' : ''}${open === f.id ? ' is-open' : ''}`}>
              <button type="button" onClick={() => setOpen(open === f.id ? null : f.id)} aria-label={e ? `${f.name}, caught ${e.caught}` : `Not caught yet: ${hint(f)}`} style={{ '--a': RARITY[f.rarity].color } as CSSProperties}>
                <FishArt f={f} dark={!e} />
                <small>{e ? f.name : '???'}</small>
              </button>
            </li>
          );
        })}
      </ol>
      {sel && (
        <div className="ar-entry" aria-live="polite">
          <p>
            <Rar r={sel.rarity} /> <b>{entry ? sel.name : '???'}</b> {entry ? sel.jp : ''}
          </p>
          <small>{entry ? sel.note : hint(sel)}</small>
          {entry && (
            <small>
              Caught {entry.caught} · best {entry.best} cm · first on {shortDay(entry.first!)}
            </small>
          )}
        </div>
      )}
      <ol className="ar-milestones">
        {BOOK_PRIZES.map((m) => (
          <li key={m.at} className={p.book.size >= m.at ? 'is-on' : ''}>
            <b>{m.at} kinds</b>
            <small>
              {prizeLine(m.gain)}
              {m.title ? ` + a title` : ''}
            </small>
          </li>
        ))}
      </ol>
      {p.recent.length > 0 && (
        <>
          <H2>Latest at the pond</H2>
          <ul className="ar-recent">
            {p.recent.map((r, i) => (
              <li key={i}>
                {r.fish ? (
                  <>
                    <b>{r.fish.name}</b> {r.cm} cm{r.perfect ? ' ✦' : ''}
                  </>
                ) : (
                  <span>The one that got away</span>
                )}
                <small>{shortDay(r.at)}</small>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

function hint(f: Fish): string {
  const bits: string[] = [RARITY[f.rarity].name];
  if (f.when === 'night') bits.push('bites at night');
  if (f.when === 'day') bits.push('bites by day');
  if (f.months) bits.push(`in season ${monthName(`2026-${String(f.months[0]).padStart(2, '0')}-01`)}–${monthName(`2026-${String(f.months[f.months.length - 1]).padStart(2, '0')}-01`)}`);
  if (f.section) bits.push(`only on a day you logged ${f.section === 'future' ? 'uni prep' : f.section}`);
  return bits.join(' · ');
}

/** A fish drawn from its shape and two colours. */
export function FishArt({ f, dark }: { f: Fish; dark?: boolean }) {
  const c = dark ? '#2a2342' : f.color;
  const c2 = dark ? '#3a3158' : f.color2;
  const eye = dark ? 'none' : '#0c0916';
  if (f.shape === 'squid') {
    return (
      <svg viewBox="0 0 64 40" className="ar-fish" aria-hidden="true">
        <path d="M8 20 C 14 8, 30 8, 40 14 L 56 6 L 50 20 L 56 34 L 40 26 C 30 32, 14 32, 8 20 Z" fill={c} />
        <path d="M8 20 L 2 14 M8 20 L 1 20 M8 20 L 2 26" stroke={c2} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="16" cy="18" r="2.2" fill={eye} />
        {!dark && <ellipse cx="30" cy="20" rx="8" ry="3" fill={c2} opacity="0.6" />}
      </svg>
    );
  }
  const body =
    f.shape === 'long'
      ? 'M4 20 C 12 12, 40 13, 52 18 L 62 12 L 60 20 L 62 28 L 52 22 C 40 27, 12 28, 4 20 Z'
      : f.shape === 'round'
        ? 'M6 20 C 6 4, 42 2, 46 20 C 42 38, 6 36, 6 20 Z M46 20 L 60 10 L 58 20 L 60 30 Z'
        : f.shape === 'flat'
          ? 'M4 20 C 10 4, 40 2, 48 20 C 40 38, 10 36, 4 20 Z M48 20 L 60 12 L 60 28 Z'
          : 'M4 20 C 12 6, 36 4, 46 18 L 60 8 L 56 20 L 60 32 L 46 22 C 36 36, 12 34, 4 20 Z';
  return (
    <svg viewBox="0 0 64 40" className="ar-fish" aria-hidden="true">
      <path d={body} fill={c} />
      {!dark && <path d={f.shape === 'long' ? 'M10 22 C 24 26, 40 25, 50 21' : 'M8 23 C 18 31, 34 31, 44 22'} stroke={c2} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.85" />}
      {!dark && f.shape === 'round' && <path d="M14 12 l2 -3 M22 9 l1 -3 M30 9 l0 -3 M36 12 l2 -3" stroke={c2} strokeWidth="2" />}
      <circle cx={f.shape === 'long' ? 10 : 13} cy="17" r={f.shape === 'round' ? 3 : 2.2} fill={eye} />
      {!dark && f.rarity === 'mythic' && <circle cx="30" cy="18" r="16" fill="none" stroke={c2} strokeWidth="1" opacity="0.6" />}
    </svg>
  );
}

// ─── how it works ───────────────────────────────────────────────────────────

function Guide() {
  return (
    <details className="gm-guide">
      <summary>How the Arcade works</summary>
      <ul>
        <li>
          <b>Nothing to buy.</b> Dice, casts and bingo marks all come from what you log, worked out like XP. Each roll, cast and claim is saved once, so it's the same on every device.
        </li>
        <li>
          <b>Bingo 賓.</b> Every Monday a new 4 × 4 card: up to six cells ask for the sections you've been doing lately, the rest are things like tasks, nights, quests and busy days. Cells tick themselves. Each of the 10 lines pays once; lines through the gold cell pay double. Last week's unclaimed lines can still be claimed for a week.
        </li>
        <li>
          <b>Sugoroku 双.</b> Roll a die and move round 32 squares: Ryō, Tama, materials (from your recent sections), tickets, chests, Stardust, shrines (a fortune), wind (three squares on), the pond (two casts), a lucky die (roll again) and the tea house. Passing Start pays a lap prize, a gold chest every fifth lap and a title on the third.
        </li>
        <li>
          <b>The pond 釣.</b> Cast, wait for the float to dip, strike, then stop the needle in the green: once for common fish, up to three times for the rarest, with one slip allowed. The fish is fixed when you cast, so leaving doesn't change it. What bites depends on the hour (night fish), the month (seasonal fish) and the sections you logged today (each has a spirit fish). Bigger and rarer pays more; a new kind pays Tama too.
        </li>
        <li>
          <b>Saved up.</b> Dice keep up to {DICE_CAP} and casts up to {CAST_CAP}; past that, a day's new ones are lost, so play now and then.
        </li>
      </ul>
    </details>
  );
}
