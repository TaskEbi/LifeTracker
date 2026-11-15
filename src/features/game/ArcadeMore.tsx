/**
 * 遊 Three more Arcade games: pachinko, the dojo and the vault (arcadeMore.ts). Like the first three,
 * each ball, duel and cracked lock is a saved record, and what you can play comes from what you log.
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useProgress } from '../../data/lt';
import {
  BALL_CAP,
  BALLS_A_DAY,
  BOUT_CAP,
  CHUTES,
  codeFor,
  duelPrize,
  GRIT_STEP,
  heroOf,
  isMaster,
  judge,
  NO_MATCH_PRIZE,
  PAIR_PRIZE,
  PIN_ROWS,
  playRound,
  pocketsFor,
  REEL_FACES,
  rivalOf,
  STANCES,
  TRIPLE_PRIZE,
  VAULT_NAMES,
  VAULT_PRIZES,
  VAULT_SLOTS,
  VAULT_SYMBOLS,
  VAULT_TRIES,
  validGuess,
  vaultPrize,
  withGrit,
  type Drop,
  type Duel,
  type Fighter,
  type MoreState,
  type Rival,
  type Round,
  type Stance,
} from '../../domain/game/arcadeMore';
import { BODY_LINES, RARITY, type Bag } from '../../domain/game/catalog';
import { chassisMk, DEFAULT_LOADOUT, plus, type Loadout } from '../../domain/game/wallet';
import { H2 } from '../../ui/i/bits';
import { Robot } from '../../ui/i/bots/Robot';
import { playStyle } from '../../ui/i/fx/celebrate';
import { claimVaultBook, dropOnce, endDuel, endVault, nextDuel } from './arcadeStore';
import { lootLines, Rar } from './bits';
import { showReveal } from './revealStore';
import { useBodies, useGame, useLoadout } from './store';
import './arcadeMore.css';

const prizeLine = (b: Bag) =>
  lootLines(b)
    .map((l) => l.label)
    .join(' + ');

// ─── pachinko ───────────────────────────────────────────────────────────────

const BW = 260;
const px = (x: number) => 20 + (x * 220) / ((CHUTES - 1) * 2);
const py = (row: number) => 30 + row * 24;
const STEP_MS = 115;

const dropText = (d: Drop) => (d.reels ? `${d.reels.faces.join(' ')} · ${d.reels.cls === 'jackpot' ? 'three sevens!' : d.reels.cls === 'triple' ? 'three of a kind' : d.reels.cls === 'pair' ? 'a pair' : 'no match'}` : d.hit.label);

export function PachiGame({ m }: { m: MoreState }) {
  const [chute, setChute] = useState(3);
  const [ball, setBall] = useState<{ d: Drop; step: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [spin, setSpin] = useState(false);
  const [log, setLog] = useState<Drop[]>([]);
  const timers = useRef<number[]>([]);
  const left = useRef(0);
  const aim = useRef(chute);
  aim.current = chute;
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  const pockets = pocketsFor(m.today);
  const last = !busy || !ball ? log[0] : undefined;

  const landed = (d: Drop) => {
    setLog((l) => [d, ...l].slice(0, 6));
    if (d.reels && (d.reels.cls === 'jackpot' || d.reels.cls === 'triple')) {
      left.current = 0;
      showReveal({ kind: 'loot', art: 'bingo', title: d.reels.cls === 'jackpot' ? '七 七 七' : d.reels.faces.join(' '), line: d.reels.cls === 'jackpot' ? 'Three sevens. The whole parlour turns to look.' : 'Three of a kind on the reels.', gain: d.gain });
    }
  };

  const next = () => {
    const at = (ms: number, f: () => void) => timers.current.push(window.setTimeout(f, ms));
    const d = dropOnce(aim.current);
    if (!d) {
      left.current = 0;
      setBusy(false);
      return;
    }
    left.current--;
    if (playStyle() !== 'full') {
      setBall({ d, step: PIN_ROWS });
      landed(d);
      if (left.current > 0) next();
      else setBusy(false);
      return;
    }
    setBusy(true);
    setSpin(false);
    for (let i = 0; i <= PIN_ROWS; i++) at(i * STEP_MS, () => setBall({ d, step: i }));
    const down = PIN_ROWS * STEP_MS + 220;
    const done = () => {
      setSpin(false);
      landed(d);
      if (left.current > 0) at(380, next);
      else setBusy(false);
    };
    if (d.reels) {
      at(down, () => setSpin(true));
      at(down + 850, done);
    } else at(down, done);
  };

  const run = (count: number) => {
    if (busy) return;
    left.current = Math.min(count, m.balls.now);
    if (left.current > 0) next();
  };

  const at = ball ? { x: px(ball.d.path[ball.step]), y: py(ball.step) } : null;
  const inPocket = ball && ball.step === PIN_ROWS ? ball.d.pocket : -1;
  return (
    <>
      <H2 aside={`${m.balls.now} ball${m.balls.now === 1 ? '' : 's'}`}>Pachinko パチンコ</H2>
      <div className="ar-pachi">
        <div className="ar-chutes" role="group" aria-label="Chute to drop from">
          {Array.from({ length: CHUTES }, (_, i) => (
            <button key={i} type="button" aria-pressed={chute === i} aria-label={`Chute ${i + 1}`} onClick={() => setChute(i)}>
              ▼
            </button>
          ))}
        </div>
        <svg viewBox={`0 0 ${BW} ${py(PIN_ROWS) + 58}`} className="ar-pins" role="img" aria-label={`Pachinko board. Pockets, left to right: ${pockets.map((p) => p.label).join(', ')}.`}>
          {Array.from({ length: PIN_ROWS }, (_, row) =>
            Array.from({ length: (CHUTES - 1) * 2 + 1 }, (_, x) => (x % 2 === row % 2 ? <circle key={`${row}:${x}`} cx={px(x)} cy={py(row) + 12} r="2.6" className="ar-pin" /> : null)),
          )}
          {pockets.map((p, i) => (
            <g key={i} className={`ar-pocket ar-pocket--${p.kind}${inPocket === i ? ' is-hit' : ''}`}>
              <rect x={px(i * 2) - 16} y={py(PIN_ROWS) + 12} width="32" height="40" rx="6" />
              <text x={px(i * 2)} y={py(PIN_ROWS) + 31} textAnchor="middle">
                {p.kanji}
              </text>
              <text x={px(i * 2)} y={py(PIN_ROWS) + 45} textAnchor="middle" className="ar-pocket__n">
                {p.kind === 'reel' ? '回' : (p.coins ?? p.gems)}
              </text>
            </g>
          ))}
          <path d={`M${px(chute * 2) - 6} 4 L${px(chute * 2) + 6} 4 L${px(chute * 2)} 14 Z`} className="ar-aim" />
          {at && <circle r="6" className="ar-ball" style={{ transform: `translate(${at.x}px, ${at.y}px)` } as CSSProperties} />}
        </svg>
        <div className="ar-pachi__ctl">
          <div className={`ar-reels${spin ? ' is-spinning' : ''}`} aria-hidden="true">
            {(spin || !last?.reels ? ['回', '回', '回'] : last.reels.faces).map((f, i) => (
              <span key={i} className={!spin && last?.reels ? 'is-set' : ''}>
                {f}
              </span>
            ))}
          </div>
          <p className="ar-board__tile" aria-live="polite">
            {busy ? (spin ? 'The reels are spinning…' : 'Falling…') : last ? `${dropText(last)}${last.reels ? ` · ${prizeLine(last.gain)}` : ''}` : 'Pick a chute, then drop a ball.'}
          </p>
          <div className="ar-pachi__btns">
            <button type="button" className="i-btn i-btn--sig" disabled={busy || m.balls.now < 1} onClick={() => run(1)}>
              Drop a ball
            </button>
            <button type="button" className="i-btn" disabled={busy || m.balls.now < 2} onClick={() => run(5)}>
              Drop {Math.min(5, Math.max(2, m.balls.now))}
            </button>
          </div>
        </div>
      </div>
      {log.length > 0 && (
        <ul className="ar-recent" aria-label="Balls just dropped">
          {log.map((d) => (
            <li key={d.n}>
              <span>
                <b>Ball {d.n}</b> chute {d.chute + 1}{d.reels ? ` · ${dropText(d)}` : ''}
              </span>
              <small>{prizeLine(d.gain)}</small>
            </li>
          ))}
        </ul>
      )}
      <H2 aside={`${m.pachi.balls} dropped · ${m.pachi.jackpots} jackpot${m.pachi.jackpots === 1 ? '' : 's'}`}>The reels 当</H2>
      <ol className="ar-milestones">
        {REEL_FACES.map((f) => (
          <li key={f} className={f === '七' ? 'is-on' : ''}>
            <b>
              {f} {f} {f}
            </b>
            <small>
              {prizeLine(TRIPLE_PRIZE[f])}
              {f === '七' ? ' + a title' : ''}
            </small>
          </li>
        ))}
        <li>
          <b>A pair</b>
          <small>{prizeLine(PAIR_PRIZE)}</small>
        </li>
        <li>
          <b>No match</b>
          <small>{prizeLine(NO_MATCH_PRIZE)}</small>
        </li>
      </ol>
      <p className="i-note">
        Balls: two for each day you log anything and one more per 15 XP that day, {BALLS_A_DAY} a day at most (up to {BALL_CAP} saved). The pockets change places every day; a ball in the 当 pocket spins the reels. Each ball's bounces are fixed before it drops, so the chute is your only say.
      </p>
    </>
  );
}

// ─── the dojo ───────────────────────────────────────────────────────────────

interface Hero {
  level: number;
  bodyLevel: number;
  mk: number;
  base: Fighter;
  stage: number;
  look: Loadout;
}

function useHero(): Hero {
  const p = useProgress();
  const look = useLoadout();
  const bodies = useBodies();
  const g = useGame();
  const drone = look.chassis === 'drone';
  // The drone has no body level of its own: it goes by the overall level, and its form stands in for a Mk.
  const mk = drone ? Math.min(3, 1 + Math.floor(p.overall.stage / 3)) : Math.max(1, chassisMk(g.wallet, look.chassis));
  const bodyLevel = drone ? Math.min(30, p.overall.level) : (bodies.stats.get(look.chassis)?.level ?? 1);
  return { level: p.overall.level, bodyLevel, mk, base: heroOf(p.overall.level, bodyLevel, mk), stage: p.overall.stage, look };
}

const STANCE_IDS = Object.keys(STANCES) as Stance[];

function roundLine(r: Round): string {
  const y = STANCES[r.yours].name;
  const t = STANCES[r.theirs].name;
  if (r.result === 'win') return `Your ${y} beat its ${t}: ${r.dealt} damage${r.kiai ? ', doubled by kiai' : ''}.`;
  if (r.result === 'lose') return `Its ${t} beat your ${y}: you took ${r.taken}${r.kiai ? ', and the kiai was wasted' : ''}.`;
  return `Both chose ${y}: a clash. You dealt ${r.dealt} and took ${r.taken}${r.kiai ? '; the kiai was wasted' : ''}.`;
}

function Bar({ now, max, label }: { now: number; max: number; label: string }) {
  return (
    <span className="ar-hp" role="img" aria-label={`${label}: ${now} of ${max} health`}>
      <i style={{ width: `${Math.max(0, (now / max) * 100)}%` }} />
      <b aria-hidden="true">
        {now}/{max}
      </b>
    </span>
  );
}

function RivalBot({ rival }: { rival: Rival }) {
  return <Robot stage={0} look={{ ...DEFAULT_LOADOUT, chassis: rival.body.id }} mk={rival.mk} still label={false} />;
}

export function DojoGame({ m }: { m: MoreState }) {
  const h = useHero();
  const [duel, setDuel] = useState<Duel | null>(null);
  const [kiai, setKiai] = useState(false);
  const [gain, setGain] = useState<Bag | null>(null);
  const open = useRef<Duel | null>(null);
  open.current = duel && !duel.over && duel.rounds.length > 0 ? duel : null;
  // Walking out of a duel that has started is a loss.
  useEffect(
    () => () => {
      if (open.current) endDuel({ ...open.current, over: 'lost' });
    },
    [],
  );

  const start = () => {
    const d = nextDuel(h.base);
    if (!d) return;
    setGain(null);
    setKiai(false);
    setDuel(d);
  };

  const pick = (s: Stance) => {
    if (!duel || duel.over) return;
    const d = playRound(duel, s, kiai);
    setKiai(false);
    setDuel(d);
    if (!d.over) return;
    const won = endDuel(d);
    setGain(won);
    if (d.over === 'won' && won && isMaster(d.rival.floor)) showReveal({ kind: 'loot', art: 'mastery', title: `Floor ${d.rival.floor} cleared`, line: `${d.rival.body.name}, master of the floor, bows.`, gain: won });
  };

  if (duel) {
    const r = duel.rival;
    const lastRound = duel.rounds[duel.rounds.length - 1];
    const k = duel.rounds.length;
    const barred = k >= 2 && duel.rounds[k - 1].theirs === duel.rounds[k - 2].theirs ? duel.rounds[k - 1].theirs : null;
    return (
      <>
        <H2 aside={`Round ${duel.over ? k : k + 1}`}>
          Floor {r.floor}
          {r.master ? ' · master' : ''}
        </H2>
        <div className={`ar-mat${lastRound ? ` is-${lastRound.result}` : ''}`} key={k}>
          <div className="ar-fighter">
            <span className="ar-fighter__bot i-drone" aria-hidden="true">
              <Robot stage={h.stage} look={h.look} still label={false} happy={duel.over === 'won'} />
            </span>
            <b>You</b>
            <Bar now={duel.heroHp} max={duel.hero.hp} label="You" />
            <small>Attack {duel.hero.atk}</small>
          </div>
          <span className="ar-vs" aria-hidden="true">
            対
          </span>
          <div className="ar-fighter ar-fighter--rival">
            <span className="ar-fighter__bot i-drone" aria-hidden="true">
              <RivalBot rival={r} />
            </span>
            <b>{r.body.name}</b>
            <Bar now={duel.rivalHp} max={r.hp} label={r.body.name} />
            <small>Attack {r.atk}</small>
          </div>
        </div>
        <p className="ar-won" aria-live="polite">
          {lastRound ? roundLine(lastRound) : `"${BODY_LINES[r.body.id] ?? 'Show me what you logged.'}" It favours ${STANCES[r.style].name}.`}
        </p>
        {duel.over ? (
          <div className="ar-result" aria-live="polite">
            <p>
              <b>{duel.over === 'won' ? `You won floor ${r.floor}.` : 'You lost this one.'}</b> {duel.over === 'lost' && `You'll hit ${Math.round(GRIT_STEP * 100)}% harder on this floor next time.`}
            </p>
            {gain && <small>{prizeLine(gain)}</small>}
            <div className="ar-pachi__btns">
              <button type="button" className="i-btn i-btn--sig" disabled={m.bouts.now < 1} onClick={start}>
                {duel.over === 'won' ? 'Next floor' : 'Try again'} · {m.bouts.now} left
              </button>
              <button type="button" className="i-btn" onClick={() => setDuel(null)}>
                Back to the ladder
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="ar-stances" role="group" aria-label="Your stance">
              {STANCE_IDS.map((s) => (
                <button key={s} type="button" className={`ar-stance ar-stance--${s}`} onClick={() => pick(s)}>
                  <span aria-hidden="true">{STANCES[s].kanji}</span>
                  <b>{STANCES[s].name}</b>
                  <small>{STANCES[s].line}</small>
                </button>
              ))}
            </div>
            <div className="ar-kiai">
              <button type="button" className="i-btn i-btn--sm" aria-pressed={kiai} disabled={!duel.kiaiLeft} onClick={() => setKiai(!kiai)}>
                気 Kiai {duel.kiaiLeft ? (kiai ? 'ready' : '· once a duel') : 'spent'}
              </button>
              <small>
                {kiai ? 'Win this round and the hit is doubled. Anything else wastes it.' : `It favours ${STANCES[r.style].name}${barred ? `, and has used ${STANCES[barred].name} twice running, so not that this round` : ''}.`}
              </small>
            </div>
            <p className="i-note">Leaving in the middle of a duel counts as a loss.</p>
          </>
        )}
      </>
    );
  }

  const rival = rivalOf(m.dojo.floor);
  const me = withGrit(h.base, m.dojo.grit);
  const nextMaster = Math.ceil(m.dojo.floor / 5) * 5;
  return (
    <>
      <H2 aside={`${m.bouts.now} challenge${m.bouts.now === 1 ? '' : 's'}`}>The dojo 道場</H2>
      <div className="ar-mat">
        <div className="ar-fighter">
          <span className="ar-fighter__bot i-drone" aria-hidden="true">
            <Robot stage={h.stage} look={h.look} still label={false} />
          </span>
          <b>You</b>
          <small>
            Health {me.hp} · attack {me.atk}
          </small>
          {m.dojo.grit > 0 && <small className="ar-grit">Grit: +{Math.round(m.dojo.grit * GRIT_STEP * 100)}% attack here</small>}
        </div>
        <span className="ar-vs" aria-hidden="true">
          対
        </span>
        <div className="ar-fighter ar-fighter--rival">
          <span className="ar-fighter__bot i-drone" aria-hidden="true">
            <RivalBot rival={rival} />
          </span>
          <b>
            {rival.body.name} <span aria-hidden="true">{rival.body.kanji}</span>
          </b>
          <small>
            Health {rival.hp} · attack {rival.atk}
          </small>
          <small>
            <Rar r={rival.body.rarity} /> favours {STANCES[rival.style].name} {STANCES[rival.style].kanji}
          </small>
        </div>
      </div>
      <div className="ar-left">
        <p>
          <b>
            Floor {rival.floor}
            {rival.master ? ' · the master of the floor' : ''}
          </b>{' '}
          pays {prizeLine(duelPrize(rival.floor))}
          {duelPrize(rival.floor).items ? ' + a title' : ''}.
        </p>
        <button type="button" className="i-btn i-btn--sig" disabled={m.bouts.now < 1} onClick={start}>
          Challenge
        </button>
      </div>
      <ol className="ar-milestones">
        <li className="is-on">
          <b>Your strength</b>
          <small>
            Level {h.level} · body level {h.bodyLevel} · Mk {['I', 'II', 'III'][h.mk - 1]}
          </small>
        </li>
        <li className={m.dojo.wins ? 'is-on' : ''}>
          <b>Record</b>
          <small>
            {m.dojo.wins} won · {m.dojo.losses} lost
          </small>
        </li>
        <li>
          <b>Next master: floor {nextMaster}</b>
          <small>
            {prizeLine(duelPrize(nextMaster))}
            {duelPrize(nextMaster).items ? ' + a title' : ''}
          </small>
        </li>
      </ol>
      {m.dojo.recent.length > 0 && (
        <ul className="ar-recent" aria-label="Latest duels">
          {m.dojo.recent.map((d) => (
            <li key={d.n}>
              <span>
                <b>Floor {d.floor}</b> {d.won ? 'won' : 'lost'} in {d.rounds} round{d.rounds === 1 ? '' : 's'}
              </span>
              <small style={{ color: d.won ? RARITY.legendary.color : undefined }}>{d.won ? '勝' : '負'}</small>
            </li>
          ))}
        </ul>
      )}
      <p className="i-note">
        Challenges: two for each day you log anything, one more for a 100-XP day (up to {BOUT_CAP} saved). Strike beats Feint, Feint beats Guard, Guard beats Strike. Your health and attack come from your overall level, the level of the body you're piloting and its Mk, so levelling up in real life is how you climb. Every fifth floor is a master.
      </p>
    </>
  );
}

// ─── the vault ──────────────────────────────────────────────────────────────

const VAULT_COLOR = ['#ff5a3c', '#4db8ff', '#5fd068', '#ffc23d', '#c98f5a', '#c9a7ff'];
const vaultKey = (date: string) => `lt:vault:${date}`;

/** The guesses made on this device today (a reload keeps them). */
function loadGuesses(date: string): number[][] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(vaultKey(date)) ?? '[]');
    return Array.isArray(v) && v.every(validGuess) ? (v as number[][]).slice(0, VAULT_TRIES) : [];
  } catch {
    return [];
  }
}

function saveGuesses(date: string, g: number[][]) {
  try {
    localStorage.setItem(vaultKey(date), JSON.stringify(g));
  } catch {
    // Private mode: the guesses last until the page is closed.
  }
}

function Sym({ i }: { i: number }) {
  return (
    <span className="ar-sym" style={{ '--a': VAULT_COLOR[i] } as CSSProperties} role="img" aria-label={VAULT_NAMES[i]}>
      {VAULT_SYMBOLS[i]}
    </span>
  );
}

export function VaultGame({ m }: { m: MoreState }) {
  const [guesses, setGuesses] = useState<number[][]>(() => loadGuesses(m.today));
  const [cur, setCur] = useState<number[]>([]);
  const day = useRef(m.today);
  useEffect(() => {
    if (day.current === m.today) return;
    // Midnight passed with the vault open: a new code, a clean sheet.
    day.current = m.today;
    setGuesses(loadGuesses(m.today));
    setCur([]);
  }, [m.today]);
  const code = codeFor(m.today);
  const marks = guesses.map((g) => judge(code, g));
  const cracked = marks.some((x) => x.hit === VAULT_SLOTS);
  const finished = cracked || guesses.length >= VAULT_TRIES;
  const done = m.vault.today;
  // A finished lock that never reached the records (closed at the wrong moment) is handed in now.
  useEffect(() => {
    if (finished && !done && m.vault.open) endVault(guesses);
  }, [finished, done, m.vault.open, guesses]);

  const tryIt = () => {
    if (cur.length !== VAULT_SLOTS || finished || done) return;
    const next = [...guesses, cur];
    saveGuesses(m.today, next);
    setGuesses(next);
    setCur([]);
    const hit = judge(code, cur).hit === VAULT_SLOTS;
    if (hit || next.length >= VAULT_TRIES) {
      const gain = endVault(next);
      if (gain && hit) showReveal({ kind: 'loot', art: 'stamp', title: 'The vault opens', line: `Cracked in ${next.length} ${next.length === 1 ? 'try' : 'tries'}.`, gain });
    }
  };

  return (
    <>
      <H2 aside={done ? (done.tries ? `cracked in ${done.tries}` : 'stayed shut') : m.vault.open ? `${VAULT_TRIES - guesses.length} tries left` : 'locked'}>The vault 金庫</H2>
      <div className={`ar-vault${done?.tries ? ' is-open' : ''}`}>
        {!m.vault.open && !done ? (
          <p className="ar-vault__shut">
            <span aria-hidden="true">錠</span>
            The vault opens once you've logged something today.
          </p>
        ) : (
          <>
            <ol className="ar-guesses" aria-label="Your tries">
              {guesses.map((g, i) => (
                <li key={i}>
                  <span className="ar-guess">
                    {g.map((s, j) => (
                      <Sym key={j} i={s} />
                    ))}
                  </span>
                  <span className="ar-marks" role="img" aria-label={`${marks[i].hit} in the right place, ${marks[i].near} in the wrong place`}>
                    {'●'.repeat(marks[i].hit)}
                    {'○'.repeat(marks[i].near)}
                    {marks[i].hit + marks[i].near === 0 && '–'}
                  </span>
                </li>
              ))}
              {done && !guesses.length && <li className="ar-guesses__else">Played on another device today.</li>}
            </ol>
            {done || finished ? (
              <div className="ar-result" aria-live="polite">
                <p>
                  <b>{(done?.tries ?? (cracked ? guesses.length : 0)) ? 'Cracked.' : 'It stayed shut.'}</b> The code was{' '}
                  <span className="ar-guess">
                    {code.map((s, j) => (
                      <Sym key={j} i={s} />
                    ))}
                  </span>
                </p>
                <small>{prizeLine(vaultPrize(done?.tries ?? (cracked ? guesses.length : 0)))} · a new code tomorrow</small>
              </div>
            ) : (
              <>
                <div className="ar-guess ar-guess--cur" aria-label="The combination you're setting" role="group">
                  {Array.from({ length: VAULT_SLOTS }, (_, j) => (cur[j] != null ? <Sym key={j} i={cur[j]} /> : <span key={j} className="ar-sym ar-sym--empty" aria-label="empty" role="img" />))}
                </div>
                <div className="ar-keys" role="group" aria-label="Symbols">
                  {VAULT_SYMBOLS.map((s, i) => (
                    <button key={s} type="button" style={{ '--a': VAULT_COLOR[i] } as CSSProperties} aria-label={VAULT_NAMES[i]} disabled={cur.length >= VAULT_SLOTS} onClick={() => setCur([...cur, i])}>
                      {s}
                    </button>
                  ))}
                </div>
                <div className="ar-pachi__btns">
                  <button type="button" className="i-btn" disabled={!cur.length} onClick={() => setCur(cur.slice(0, -1))}>
                    Undo
                  </button>
                  <button type="button" className="i-btn i-btn--sig" disabled={cur.length !== VAULT_SLOTS} onClick={tryIt}>
                    Try the lock
                  </button>
                </div>
                <small className="ar-vault__key">● right symbol, right place · ○ right symbol, wrong place</small>
              </>
            )}
          </>
        )}
      </div>
      {m.vaultToClaim.length > 0 && (
        <div className="ar-left">
          <p>
            <b>Vault prize:</b> {m.vaultToClaim.map((n) => `${n} cracked`).join(', ')}.
          </p>
          <button
            type="button"
            className="i-btn i-btn--sm i-btn--sig"
            onClick={() => {
              const out = m.vaultToClaim.map((n) => claimVaultBook(n)).filter((x): x is Bag => !!x);
              if (out.length) showReveal({ kind: 'loot', art: 'stamp', title: 'Vault prize', gain: out.reduce((a, b) => plus(a, b), {} as Bag) });
            }}
          >
            Claim
          </button>
        </div>
      )}
      <ol className="ar-milestones">
        <li className={m.vault.cracked ? 'is-on' : ''}>
          <b>{m.vault.cracked} cracked</b>
          <small>
            {m.vault.best ? `best: ${m.vault.best} ${m.vault.best === 1 ? 'try' : 'tries'}` : 'none yet'}
            {m.vault.run > 1 ? ` · ${m.vault.run} days running` : ''}
          </small>
        </li>
        {VAULT_PRIZES.map((p) => (
          <li key={p.at} className={m.vault.cracked >= p.at ? 'is-on' : ''}>
            <b>{p.at} cracked</b>
            <small>
              {prizeLine(p.gain)}
              {p.title ? ' + a title' : ''}
            </small>
          </li>
        ))}
      </ol>
      <p className="i-note">
        One code a day: {VAULT_SLOTS} symbols out of {VAULT_SYMBOLS.length}, and a symbol can come up more than once. You have {VAULT_TRIES} tries. In 3 or fewer: {prizeLine(vaultPrize(3))}. In 4 or 5: {prizeLine(vaultPrize(5))}. In 6: {prizeLine(vaultPrize(6))}. In 7: {prizeLine(vaultPrize(7))}. In 8: {prizeLine(vaultPrize(8))}.
      </p>
    </>
  );
}
