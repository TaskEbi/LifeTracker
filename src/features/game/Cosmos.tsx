/**
 * 宙 The Cosmos: gather dust, light a star, and start again four ways. Each layer (Ignite, Collapse,
 * Big Bang, Transcend) has a room of its own; rooms stay shut until you're near them. Logic in
 * domain/game/cosmos.ts, saving in cosmosStore.ts, the sky in cosmosSky.ts.
 */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { navigate, useRoute } from '../../app/router';
import {
  ASCS,
  AUTO_KEYS,
  AUTO_NAME,
  autoNeed,
  autoOn,
  autoOpen,
  autoTaps,
  awayEff,
  awayHours,
  BODIES,
  bodyCost,
  bodyOpen,
  bodyRate,
  chalGoal,
  CHALLENGES,
  chalMax,
  chalsOpen,
  chalTier,
  critChance,
  critMult,
  darkGain,
  dustMult,
  dustParts,
  eonGain,
  era,
  FEATS,
  fmt,
  galGain,
  LAYERS,
  layerSeen,
  levelCost,
  lightGain,
  maxBody,
  MILES,
  NEED,
  needTranscend,
  nodeOpen,
  NODES,
  rateNow,
  RELIC_MAX,
  relicCost,
  RELICS,
  relicSlots,
  resoNext,
  resonance,
  speed,
  tapValue,
  timesDone,
  UPS,
  VOIDS,
  type CosmosSave,
  type Ext,
  type Layer,
  type Levelled,
} from '../../domain/game/cosmos';
import { fmtTime } from '../../domain/game/idle';
import { H2 } from '../../ui/i/bits';
import {
  buyAscension,
  buyBodies,
  buyDustUp,
  buyEveryBody,
  buyEveryDustUp,
  buyEveryVoidUp,
  buyRelicLevel,
  buyStar,
  buyVoidUp,
  clearFlash,
  dismissAway,
  dropPop,
  prestige,
  quitChallenge,
  startChallenge,
  switchAuto,
  tapCore,
  toggleRelic,
  useCosmos,
  useCosmosRunning,
} from './cosmosStore';
import { createSky, drawBody, type Sky, type SkyView } from './cosmosSky';
import { useExt } from './worksStore';
import './cosmos.css';

const ROOMS = [
  { id: 'orbit', label: 'Orbit', kanji: '軌', layer: 0 },
  { id: 'stars', label: 'Stars', kanji: '星', layer: 1 },
  { id: 'void', label: 'Void', kanji: '闇', layer: 2 },
  { id: 'galaxies', label: 'Galaxies', kanji: '銀', layer: 3 },
  { id: 'beyond', label: 'Beyond', kanji: '劫', layer: 4 },
  { id: 'auto', label: 'Auto', kanji: '自', layer: 0 },
  { id: 'log', label: 'Log', kanji: '録', layer: 0 },
] as const;
type RoomId = (typeof ROOMS)[number]['id'];

type Coin = 'dust' | 'light' | 'dark' | 'gal' | 'eon';
const COIN_NAME: Record<Coin, string> = { dust: 'dust', light: 'starlight', dark: 'dark matter', gal: 'galaxies', eon: 'aeons' };
const LAYER_COIN: Record<Layer, Coin> = { 1: 'light', 2: 'dark', 3: 'gal', 4: 'eon' };
const ERA_NAME = ['A cloud of dust', 'A star', 'A star and its shadow', 'A galaxy', 'Beyond the sky', 'Enlightened'];

const reduced = () => {
  try {
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

export default function CosmosTab() {
  useCosmosRunning();
  const route = useRoute();
  const live = useCosmos();
  const ext = useExt();
  const s = live.save;
  const want = ROOMS.find((r) => r.id === route.rest[1]) ?? ROOMS[0];
  const room: RoomId = want.layer === 0 || layerSeen(s, want.layer as Layer) ? want.id : 'orbit';
  if (!live.ready) {
    return (
      <section className="cz" aria-label="The Cosmos">
        <p className="i-note">Looking up…</p>
      </section>
    );
  }
  const now = Date.now();
  const ready: Record<Layer, number> = { 1: lightGain(s), 2: darkGain(s), 3: galGain(s), 4: eonGain(s) };
  return (
    <section className="cz" aria-label="The Cosmos">
      <Stage s={s} ext={ext} now={now} />
      <Purse s={s} />
      {live.away && (
        <div className="cz-away" role="status">
          <b>While you were away</b>
          <p>
            You were gone {fmtTime(live.away.gap)}. The sky kept turning for {fmtTime(live.away.worked)}
            {live.away.capped ? ' (as long as it will without you)' : ''} at {Math.round(live.away.eff * 100)}% and gathered <strong>{fmt(live.away.dust)} dust</strong>
            {live.away.light >= 1 ? `, ${fmt(live.away.light)} starlight` : ''}
            {live.away.dark >= 1 ? `, ${fmt(live.away.dark)} dark matter` : ''}
            {live.away.gal >= 1 ? `, ${fmt(live.away.gal)} galaxies` : ''}. Nothing buys itself or starts again while you’re away.
          </p>
          <button type="button" className="i-btn i-btn--sm i-btn--sig" onClick={dismissAway}>
            Carry on
          </button>
        </div>
      )}
      {s.chal && <ChalBanner s={s} />}
      <nav className="cz-rooms" aria-label="The Cosmos">
        {ROOMS.map((r) => {
          const open = r.layer === 0 || layerSeen(s, r.layer as Layer);
          const n = r.layer ? ready[r.layer as Layer] : 0;
          return (
            <button
              key={r.id}
              type="button"
              className={`cz-room${open ? '' : ' is-shut'}`}
              data-layer={r.layer || undefined}
              aria-current={room === r.id ? 'page' : undefined}
              disabled={!open}
              aria-label={open ? r.label : 'Not found yet'}
              onClick={() => navigate('hangar', r.id === 'orbit' ? ['cosmos'] : ['cosmos', r.id], { replace: true })}
            >
              <span aria-hidden="true">{open ? r.kanji : '？'}</span>
              <b>{open ? r.label : '???'}</b>
              {open && n >= 1 && <i className="cz-dot" aria-label="Ready" />}
            </button>
          );
        })}
      </nav>
      {room === 'stars' ? <Stars s={s} /> : room === 'void' ? <Void s={s} /> : room === 'galaxies' ? <Galaxies s={s} /> : room === 'beyond' ? <Beyond s={s} /> : room === 'auto' ? <Auto s={s} /> : room === 'log' ? <Log s={s} ext={ext} now={now} /> : <Orbit s={s} ext={ext} now={now} />}
    </section>
  );
}

// ─── the stage ──────────────────────────────────────────────────────────────

function SkyCanvas({ view }: { view: SkyView }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const sky = useRef<Sky | null>(null);
  const viewRef = useRef(view);
  viewRef.current = view;
  const pulse = useCosmos().pulse;
  const flash = useCosmos().flash;
  const pops = useCosmos().pops;
  useEffect(() => {
    if (pulse) sky.current?.tap(!!pops[pops.length - 1]?.crit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pulse]);
  useEffect(() => {
    if (flash) sky.current?.burst(flash.layer);
  }, [flash]);
  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    sky.current = createSky();
    const still = reduced();
    let raf = 0;
    let w = 0;
    let h = 0;
    const t0 = performance.now();
    const frame = () => {
      if (!w || !h) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sky.current!.draw(ctx, still ? 2.5 : (performance.now() - t0) / 1000, w, h, viewRef.current);
    };
    const size = () => {
      const r = cv.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = Math.round(r.width);
      h = Math.round(r.height);
      cv.width = Math.max(1, Math.round(w * dpr));
      cv.height = Math.max(1, Math.round(h * dpr));
      frame();
    };
    size();
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(size);
    ro?.observe(cv);
    let timer = 0;
    if (still) timer = window.setInterval(frame, 1000);
    else {
      const loop = () => {
        frame();
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(timer);
      ro?.disconnect();
    };
  }, []);
  return <canvas ref={ref} className="cz-sky" aria-hidden="true" />;
}

function Stage({ s, ext, now }: { s: CosmosSave; ext: Ext; now: number }) {
  const live = useCosmos();
  const e = era(s);
  const view: SkyView = { era: e, heat: Math.log10(1 + s.runDust), bodies: BODIES.map((b) => s.gens[b.id] ?? 0), dim: !!s.chal };
  const rate = rateNow(s, ext, now);
  const flash = live.flash;
  const flashN = flash?.n;
  useEffect(() => {
    if (flashN === undefined) return;
    const t = window.setTimeout(() => clearFlash(flashN), 3200);
    return () => window.clearTimeout(t);
  }, [flashN]);
  return (
    <div className="cz-stage" data-era={e}>
      <SkyCanvas view={view} />
      <div className="cz-count">
        <p className="cz-count__era">{ERA_NAME[e]}</p>
        <p className="cz-count__n" aria-label={`${fmt(s.dust)} dust`}>
          <CoinArt k="dust" />
          <b aria-hidden="true">{fmt(s.dust)}</b>
        </p>
        <p className="cz-count__r">
          {fmt(rate)} a second · {fmt(tapValue(s, ext, now))} a tap{speed(s) > 1.001 ? ` · time ×${speed(s).toFixed(2)}` : ''}
        </p>
      </div>
      <div className="cz-corebox">
        <button
          type="button"
          className="cz-core"
          aria-label="Gather dust"
          onPointerDown={(ev) => {
            if (ev.button === 0) tapCore();
          }}
          onClick={(ev) => {
            if (ev.detail === 0) tapCore();
          }}
        />
        {live.pops.map((pop) => (
          <span key={pop.id} className={`cz-pop${pop.crit ? ' is-crit' : ''}`} style={{ '--x': `${pop.x}px` } as CSSProperties} onAnimationEnd={() => dropPop(pop.id)} aria-hidden="true">
            {pop.text}
            {pop.crit ? '!' : ''}
          </span>
        ))}
      </div>
      {flash && (
        <p key={flash.n} className="cz-flash" data-layer={flash.layer} role="status">
          {flash.text}
        </p>
      )}
    </div>
  );
}

// ─── coins ──────────────────────────────────────────────────────────────────

/** The five currencies, each drawn as a small jewel. */
function CoinArt({ k }: { k: Coin }) {
  return (
    <svg className="cz-coin" data-k={k} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <radialGradient id={`czg-${k}`} cx="35%" cy="30%" r="80%">
          {k === 'dust' && (
            <>
              <stop offset="0" stopColor="#fff3d6" />
              <stop offset="0.5" stopColor="#ffb454" />
              <stop offset="1" stopColor="#8a4a12" />
            </>
          )}
          {k === 'light' && (
            <>
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.5" stopColor="#ffe27a" />
              <stop offset="1" stopColor="#d98a1c" />
            </>
          )}
          {k === 'dark' && (
            <>
              <stop offset="0" stopColor="#5a3d8f" />
              <stop offset="0.6" stopColor="#1a0f33" />
              <stop offset="1" stopColor="#000" />
            </>
          )}
          {k === 'gal' && (
            <>
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.45" stopColor="#5fe3ff" />
              <stop offset="1" stopColor="#3a2a9c" />
            </>
          )}
          {k === 'eon' && (
            <>
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.5" stopColor="#ffb3e6" />
              <stop offset="1" stopColor="#8a5cff" />
            </>
          )}
        </radialGradient>
      </defs>
      {k === 'dust' && (
        <g fill={`url(#czg-${k})`}>
          <circle cx="8" cy="14.5" r="5" />
          <circle cx="16" cy="9" r="4" />
          <circle cx="17.5" cy="17.5" r="2.6" />
          <circle cx="7" cy="6" r="1.8" />
          <circle cx="6.4" cy="13" r="1.1" fill="#fff" opacity="0.7" />
          <circle cx="14.8" cy="7.8" r="0.9" fill="#fff" opacity="0.7" />
        </g>
      )}
      {k === 'light' && (
        <g>
          <path d="M12 0.8 14.3 9.7 23.2 12 14.3 14.3 12 23.2 9.7 14.3 0.8 12 9.7 9.7Z" fill={`url(#czg-${k})`} />
          <path d="M12 6.5 13.2 10.8 17.5 12 13.2 13.2 12 17.5 10.8 13.2 6.5 12 10.8 10.8Z" fill="#fff" opacity="0.85" />
          <path d="M4.5 4.5 7 7M19.5 4.5 17 7M4.5 19.5 7 17M19.5 19.5 17 17" stroke="#ffe27a" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      )}
      {k === 'dark' && (
        <g>
          <ellipse cx="12" cy="12" rx="11" ry="4" fill="none" stroke="#b07cff" strokeWidth="1.6" opacity="0.55" transform="rotate(-20 12 12)" />
          <circle cx="12" cy="12" r="6.6" fill={`url(#czg-${k})`} />
          <circle cx="12" cy="12" r="6.9" fill="none" stroke="#e7d4ff" strokeWidth="0.7" />
          <path d="M1.7 15.8A11 4 -20 0 0 22.3 8.2" fill="none" stroke="#d9b8ff" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      )}
      {k === 'gal' && (
        <g>
          <circle cx="12" cy="12" r="3" fill={`url(#czg-${k})`} />
          <path d="M12 9C17 6 22 9 22 14M12 15C7 18 2 15 2 10M15 12C18 17 15 22 10 22M9 12C6 7 9 2 14 2" fill="none" stroke={`url(#czg-${k})`} strokeWidth="1.9" strokeLinecap="round" />
          <circle cx="19.5" cy="6" r="0.8" fill="#fff" />
          <circle cx="4.5" cy="18.5" r="0.8" fill="#fff" />
        </g>
      )}
      {k === 'eon' && (
        <g>
          <circle cx="12" cy="12" r="10" fill="none" stroke={`url(#czg-${k})`} strokeWidth="2" />
          <circle cx="12" cy="12" r="2.6" fill={`url(#czg-${k})`} />
          <path d="M12 2V9.4M12 14.6V22M2 12H9.4M14.6 12H22M4.9 4.9 10.2 10.2M13.8 13.8 19.1 19.1M19.1 4.9 13.8 10.2M10.2 13.8 4.9 19.1" stroke={`url(#czg-${k})`} strokeWidth="1.4" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}

function Purse({ s }: { s: CosmosSave }) {
  const shown: { k: Coin; n: number }[] = [];
  if (layerSeen(s, 1) && (s.lightAll > 0 || s.ignitesAll > 0)) shown.push({ k: 'light', n: s.light });
  if (s.darkAll > 0) shown.push({ k: 'dark', n: s.dark });
  if (s.galAll > 0) shown.push({ k: 'gal', n: s.gal });
  if (s.eonAll > 0) shown.push({ k: 'eon', n: s.eon });
  if (!shown.length) return null;
  return (
    <div className="cz-purse" role="group" aria-label="What you hold">
      {shown.map((c) => (
        <span key={c.k} className="cz-amt" data-k={c.k} aria-label={`${fmt(Math.floor(c.n))} ${COIN_NAME[c.k]}`}>
          <CoinArt k={c.k} />
          <b aria-hidden="true">{fmt(Math.floor(c.n))}</b>
          <small aria-hidden="true">{COIN_NAME[c.k]}</small>
        </span>
      ))}
    </div>
  );
}

const Cost = ({ k, n }: { k: Coin; n: number }) => (
  <small className="cz-cost">
    <CoinArt k={k} /> {fmt(n)}
  </small>
);

/** A button that has to be pressed twice: once to arm it, once to do it. */
function Twice({ label, armed, disabled, onDo, className = '' }: { label: ReactNode; armed: ReactNode; disabled?: boolean; onDo: () => void; className?: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!on) return;
    const t = window.setTimeout(() => setOn(false), 4000);
    return () => window.clearTimeout(t);
  }, [on]);
  return (
    <button
      type="button"
      className={`i-btn ${className}${on ? ' is-armed' : ''}`}
      disabled={disabled}
      onClick={() => {
        if (!on) return setOn(true);
        setOn(false);
        onDo();
      }}
    >
      {on ? armed : label}
    </button>
  );
}

const logPct = (have: number, need: number) => Math.max(0, Math.min(1, Math.log10(1 + have) / Math.log10(1 + need)));

function Bar({ pct, label }: { pct: number; label: string }) {
  return (
    <span className="cz-bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct * 100)}>
      <i style={{ width: `${pct * 100}%` }} />
    </span>
  );
}

// ─── orbit: bodies and dust upgrades ────────────────────────────────────────

function BodyIcon({ i }: { i: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = 44 * dpr;
    cv.height = 44 * dpr;
    let raf = 0;
    const t0 = performance.now();
    const still = reduced();
    const frame = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, 44, 44);
      ctx.save();
      ctx.translate(22, 22);
      const big = i === 1 || i === 4 || i === 7 || i === 8;
      drawBody(ctx, i, big ? 6.5 : 10, still ? 1 : (performance.now() - t0) / 1000);
      ctx.restore();
      if (!still) raf = requestAnimationFrame(frame);
    };
    frame();
    return () => cancelAnimationFrame(raf);
  }, [i]);
  return <canvas ref={ref} className="cz-bodyicon" aria-hidden="true" />;
}

const AMOUNTS = [
  { id: 1, label: '×1' },
  { id: 10, label: '×10' },
  { id: 'max', label: 'Max' },
] as const;

function Orbit({ s, ext, now }: { s: CosmosSave; ext: Ext; now: number }) {
  const [amount, setAmount] = useState<1 | 10 | 'max'>(1);
  const mult = dustMult(s, ext, now) * speed(s);
  const open = BODIES.filter((b) => bodyOpen(s, b));
  const top = open.reduce((n, b, i) => ((s.gens[b.id] ?? 0) > 0 ? i : n), -1);
  const shown = open.slice(0, Math.min(open.length, top + 3));
  const reso = resonance(s);
  const total = shown.reduce((n, b) => n + bodyRate(s, b), 0);
  const anyBody = open.some((b) => maxBody(s, b.id) > 0);
  return (
    <>
      <ul className="cz-boosts" aria-label="What real life adds">
        <li className={ext.sections ? 'is-on' : ''}>
          <b>Today +{Math.round(15 * ext.sections)}%</b>
          <small>{ext.sections ? `${ext.sections} section${ext.sections === 1 ? '' : 's'} logged today` : 'Log something today: +15% dust a section'}</small>
        </li>
        <li className={ext.streak ? 'is-on' : ''}>
          <b>Streak +{Math.min(100, ext.streak)}%</b>
          <small>{ext.streak ? `${ext.streak}-day streak` : '+1% dust for each day of your streak'}</small>
        </li>
        <li className={ext.level > 1 ? 'is-on' : ''}>
          <b>Level +{ext.level}%</b>
          <small>Your robot is level {ext.level}</small>
        </li>
      </ul>
      <H2
        aside={
          <span className="cz-amounts" role="group" aria-label="How many to buy">
            {AMOUNTS.map((a) => (
              <button key={a.id} type="button" aria-pressed={amount === a.id} onClick={() => setAmount(a.id)}>
                {a.label}
              </button>
            ))}
            <button type="button" className="cz-all" disabled={!anyBody} onClick={buyEveryBody}>
              Buy all
            </button>
          </span>
        }
      >
        In orbit
      </H2>
      <div className="cz-list">
        {shown.map((b) => {
          const own = s.gens[b.id] ?? 0;
          const n = amount === 'max' ? Math.max(1, maxBody(s, b.id)) : amount;
          const cost = bodyCost(s, b.id, n);
          const rate = bodyRate(s, b) * mult;
          const next = resoNext(own);
          const prev = own < 10 ? 0 : own < 25 ? 10 : own < 50 ? 25 : Math.floor(own / 50) * 50;
          return (
            <div key={b.id} className={`cz-row${own ? ' is-on' : ''}`}>
              <BodyIcon i={BODIES.indexOf(b)} />
              <div className="cz-row__t">
                <b>
                  {b.name}
                  {own > 0 && <em> ×{own}</em>}
                </b>
                <small>{b.blurb}</small>
                <small className="cz-row__n">{own > 0 ? `${fmt(rate)}/s${total > 0 ? ` (${Math.round((bodyRate(s, b) / total) * 100)}%)` : ''} · ` : ''}×{reso.toFixed(2).replace(/\.?0+$/, '')} at {next}</small>
                <Bar pct={(own - prev) / (next - prev)} label={`${b.name}: ${own} of ${next} to the next resonance`} />
              </div>
              <button type="button" className="i-btn i-btn--sm cz-buy" disabled={cost > s.dust} aria-label={`Buy ${n} ${b.name} for ${fmt(cost)} dust`} onClick={() => buyBodies(b.id, n)}>
                <span>Buy{n > 1 ? ` ×${n}` : ''}</span>
                <Cost k="dust" n={cost} />
              </button>
            </div>
          );
        })}
        {shown.length < open.length && <p className="i-note">Something bigger comes into view once you have a {shown[shown.length - 2]?.name ?? BODIES[0].name}.</p>}
      </div>
      <Levels title="Dust upgrades" note="These go at every Ignite." list={UPS} have={s.ups} purse={s.dust} coin="dust" onBuy={buyDustUp} onAll={buyEveryDustUp} />
      <p className="i-note">
        Close the app and the sky keeps turning for up to {awayHours(s)} hours at {Math.round(awayEff(s) * 100)}% speed.
      </p>
    </>
  );
}

/** A grid of upgrades that have levels. */
function Levels({ title, note, list, have, purse, coin, onBuy, onAll }: { title: string; note?: string; list: Levelled[]; have: Record<string, number>; purse: number; coin: Coin; onBuy: (id: string) => void; onAll?: () => void }) {
  const can = list.some((u) => (have[u.id] ?? 0) < u.max && levelCost(u, have[u.id] ?? 0) <= purse);
  return (
    <>
      <H2
        aside={
          onAll && (
            <button type="button" className="i-btn i-btn--sm" disabled={!can} onClick={onAll}>
              Buy all
            </button>
          )
        }
      >
        {title}
      </H2>
      <div className="cz-grid" data-k={coin}>
        {list.map((u) => {
          const lv = have[u.id] ?? 0;
          const maxed = lv >= u.max;
          const cost = levelCost(u, lv);
          return (
            <button key={u.id} type="button" className={`cz-card${lv ? ' is-on' : ''}${maxed ? ' is-max' : ''}`} disabled={maxed || cost > purse} aria-label={`${u.name}, level ${lv} of ${u.max}. ${u.blurb} ${maxed ? 'At the top.' : `Next level: ${fmt(cost)} ${COIN_NAME[coin]}.`}`} onClick={() => onBuy(u.id)}>
              <span className="cz-card__k" aria-hidden="true">
                {u.kanji}
              </span>
              <span className="cz-card__t">
                <b>{u.name}</b>
                <small>{u.blurb}</small>
              </span>
              <span className="cz-card__f">
                <i>
                  {u.max === 1 ? (lv ? 'Owned' : '') : `Lv ${lv}`}
                  {u.max > 1 && u.max <= 10 ? ` / ${u.max}` : ''}
                </i>
                {maxed ? <small className="cz-cost">Max</small> : <Cost k={coin} n={cost} />}
              </span>
            </button>
          );
        })}
      </div>
      {note && <p className="i-note">{note}</p>}
    </>
  );
}

// ─── the layers ─────────────────────────────────────────────────────────────

const RESETS: Record<Layer, string> = {
  1: 'Dust, bodies and dust upgrades start again.',
  2: 'Everything Ignite resets, plus your starlight and the constellation.',
  3: 'Everything Collapse resets, plus your dark matter and void upgrades. A challenge in progress is dropped.',
  4: 'Everything the Big Bang resets, plus your galaxies. Relics, challenge tiers and ascensions stay. The next one needs twice the galaxies.',
};
const FEEDS: Record<Layer, string> = {
  1: 'Starlight earned since the last Collapse makes more dust (its square root), and buys the stars below.',
  2: 'Dark matter earned since the last Big Bang makes more dust, and buys void upgrades.',
  3: 'Galaxies earned since the last Transcend make more dust and starlight, and buy relics.',
  4: 'Aeons ever earned make more of everything below (dust most of all), and buy ascensions.',
};

function LayerPanel({ s, layer }: { s: CosmosSave; layer: Layer }) {
  const L = LAYERS[layer - 1];
  const coin = LAYER_COIN[layer];
  const gain = layer === 1 ? lightGain(s) : layer === 2 ? darkGain(s) : layer === 3 ? galGain(s) : eonGain(s);
  const [have, need, of] = layer === 1 ? [s.runDust, NEED.ignite, 'dust this run'] : layer === 2 ? [s.lightRun, NEED.collapse, 'starlight since the last Collapse'] : layer === 3 ? [s.darkRun, NEED.bang, 'dark matter since the last Big Bang'] : [s.galRun, needTranscend(s), 'galaxies since the last Transcend'];
  const blocked = layer > 1 && !!s.chal;
  return (
    <div className="cz-layer" data-layer={layer}>
      <div className="cz-layer__sigil" aria-hidden="true">
        <span>{L.kanji}</span>
      </div>
      <div className="cz-layer__t">
        <b>{L.verb}</b>
        <p>{FEEDS[layer]}</p>
        {gain < 1 && (
          <>
            <Bar pct={logPct(have, need)} label={`${fmt(have)} of ${fmt(need)} ${of}`} />
            <small>
              {blocked ? 'Not during a challenge.' : `Needs ${fmt(need)} ${of}. You have ${fmt(have)}.`}
            </small>
          </>
        )}
        {gain >= 1 && <small>{RESETS[layer]}</small>}
      </div>
      <Twice className="i-btn--sig cz-go" disabled={gain < 1} label={<><span>{L.verb}</span><Cost k={coin} n={gain} /></>} armed={<><span>Sure?</span><small className="cz-cost">Tap again</small></>} onDo={() => prestige(layer)} />
      <p className="cz-layer__n">
        Done {fmt(timesDone(s, layer))} time{timesDone(s, layer) === 1 ? '' : 's'}
      </p>
    </div>
  );
}

function Miles({ s, layer }: { s: CosmosSave; layer: Layer }) {
  const n = timesDone(s, layer);
  const verb = LAYERS[layer - 1].verb;
  return (
    <>
      <H2>Milestones</H2>
      <ol className="cz-miles" data-layer={layer}>
        {MILES.filter((m) => m.layer === layer).map((m) => (
          <li key={m.at} className={n >= m.at ? 'is-on' : ''}>
            <i aria-hidden="true">{m.at}</i>
            <span>
              <b>{m.name}</b>
              <small>{m.blurb}</small>
            </span>
            <em>{n >= m.at ? 'Reached' : `${verb} ${m.at - n} more`}</em>
          </li>
        ))}
      </ol>
      <p className="i-note">Milestones count every {verb} you have ever done, and are kept for good.</p>
    </>
  );
}

// ─── stars: Ignite and the constellation ────────────────────────────────────

function Stars({ s }: { s: CosmosSave }) {
  const [pick, setPick] = useState<string | null>(null);
  const firstOpen = NODES.find((n) => !s.nodes.includes(n.id) && nodeOpen(s, n));
  const sel = NODES.find((n) => n.id === pick) ?? firstOpen ?? NODES[NODES.length - 1];
  const owned = s.nodes.includes(sel.id);
  const open = nodeOpen(s, sel);
  const dark = s.chal === 'dim';
  return (
    <>
      <LayerPanel s={s} layer={1} />
      <H2 aside={<span className="cz-tally">{s.nodes.length} / {NODES.length}</span>}>The constellation</H2>
      <div className={`cz-map${dark ? ' is-dark' : ''}`}>
        <svg viewBox="-4 0 108 104" role="group" aria-label="Constellation">
          <defs>
            <radialGradient id="cz-star-on" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="#fff" />
              <stop offset="0.35" stopColor="#ffe9a3" />
              <stop offset="1" stopColor="#ffb338" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="cz-star-can" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="#fff" />
              <stop offset="0.4" stopColor="#9fd8ff" />
              <stop offset="1" stopColor="#4a8cff" stopOpacity="0" />
            </radialGradient>
          </defs>
          {NODES.flatMap((n) =>
            n.req.map((r) => {
              const from = NODES.find((x) => x.id === r)!;
              const on = s.nodes.includes(n.id);
              const half = !on && s.nodes.includes(r);
              return <line key={`${r}-${n.id}`} x1={from.x} y1={from.y} x2={n.x} y2={n.y} className={`cz-map__line${on ? ' is-on' : half ? ' is-next' : ''}`} />;
            }),
          )}
          {NODES.map((n) => {
            const on = s.nodes.includes(n.id);
            const can = !on && nodeOpen(s, n);
            const r = 2.2 + n.mag * 1.1;
            return (
              <g
                key={n.id}
                className={`cz-map__node${on ? ' is-on' : can ? (n.cost <= s.light ? ' is-can is-ready' : ' is-can') : ''}${sel.id === n.id ? ' is-sel' : ''}`}
                transform={`translate(${n.x} ${n.y})`}
                role="button"
                tabIndex={0}
                aria-label={`${n.name}: ${on ? 'lit' : can ? `${fmt(n.cost)} starlight` : 'out of reach'}`}
                aria-pressed={sel.id === n.id}
                onClick={() => setPick(n.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setPick(n.id);
                  }
                }}
              >
                <circle r={8} fill="transparent" />
                {(on || can) && <circle r={r * 2.4} fill={on ? 'url(#cz-star-on)' : 'url(#cz-star-can)'} className="cz-map__glow" />}
                {on ? <path d={`M0 ${-r * 1.5} ${r * 0.34} ${-r * 0.34} ${r * 1.5} 0 ${r * 0.34} ${r * 0.34} 0 ${r * 1.5} ${-r * 0.34} ${r * 0.34} ${-r * 1.5} 0 ${-r * 0.34} ${-r * 0.34}Z`} className="cz-map__star" /> : <circle r={r * 0.5} className="cz-map__dot" />}
                {sel.id === n.id && <circle r={r * 2} className="cz-map__ring" />}
                <text y={r * 1.5 + 4.6} textAnchor="middle" className="cz-map__name">
                  {on || can ? n.name : '?'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className={`cz-node${owned ? ' is-on' : ''}`}>
        <span className="cz-card__k" aria-hidden="true">
          {open || owned ? sel.kanji : '？'}
        </span>
        <span className="cz-card__t">
          <b>{open || owned ? sel.name : 'Out of reach'}</b>
          <small>{open || owned ? sel.blurb : `Light ${sel.req.map((r) => NODES.find((n) => n.id === r)!.name).join(' and ')} first.`}</small>
        </span>
        {owned ? (
          <em className="cz-owned">Lit</em>
        ) : (
          <button type="button" className="i-btn i-btn--sm cz-buy" disabled={!open || sel.cost > s.light} aria-label={`Light ${sel.name} for ${fmt(sel.cost)} starlight`} onClick={() => buyStar(sel.id)}>
            <span>Light it</span>
            <Cost k="light" n={sel.cost} />
          </button>
        )}
      </div>
      <p className="i-note">
        {dark ? 'Lights Out: the constellation does nothing until the challenge is over. ' : ''}
        Stars stay lit through an Ignite. A Collapse puts them out{timesDone(s, 2) >= 5 ? ', but not for you any more' : ' (until its fifth milestone)'}.
      </p>
      <Miles s={s} layer={1} />
    </>
  );
}

// ─── void: Collapse, void upgrades, challenges ──────────────────────────────

function ChalBanner({ s }: { s: CosmosSave }) {
  const c = CHALLENGES.find((x) => x.id === s.chal);
  if (!c) return null;
  const goal = chalGoal(c, chalTier(s, c.id));
  return (
    <div className="cz-chalbar" role="status">
      <span className="cz-card__k" aria-hidden="true">
        {c.kanji}
      </span>
      <span className="cz-card__t">
        <b>
          Challenge: {c.name}, tier {chalTier(s, c.id) + 1}
        </b>
        <small>{c.rule}</small>
        <Bar pct={logPct(s.runDust, goal)} label={`${fmt(s.runDust)} of ${fmt(goal)} dust in one run`} />
        <small>
          {fmt(s.runDust)} of {fmt(goal)} dust in one run
        </small>
      </span>
      <Twice className="i-btn--sm" label="Give up" armed="Sure?" onDo={quitChallenge} />
    </div>
  );
}

function Void({ s }: { s: CosmosSave }) {
  const max = chalMax(s);
  return (
    <>
      <LayerPanel s={s} layer={2} />
      <Levels title="Void upgrades" note="These go at a Big Bang." list={VOIDS} have={s.voids} purse={s.dark} coin="dark" onBuy={buyVoidUp} onAll={buyEveryVoidUp} />
      <H2>Challenges</H2>
      {!chalsOpen(s) ? (
        <p className="i-note">Collapse twice and the gauntlet opens: runs with a handicap, each paying something you keep for good.</p>
      ) : (
        <>
          <div className="cz-chals">
            {CHALLENGES.map((c) => {
              const tier = chalTier(s, c.id);
              const done = tier >= max;
              const active = s.chal === c.id;
              return (
                <div key={c.id} className={`cz-chal${active ? ' is-active' : ''}${done ? ' is-max' : ''}`}>
                  <span className="cz-card__k" aria-hidden="true">
                    {c.kanji}
                  </span>
                  <span className="cz-card__t">
                    <b>{c.name}</b>
                    <small>{c.rule}</small>
                    <small className="cz-chal__r">
                      Each tier: {c.reward}
                    </small>
                    <span className="cz-pips" aria-label={`${tier} of ${max} tiers done`}>
                      {Array.from({ length: max }, (_, i) => (
                        <i key={i} className={i < tier ? 'is-on' : ''} />
                      ))}
                    </span>
                  </span>
                  {done ? (
                    <em className="cz-owned">Done</em>
                  ) : active ? (
                    <em className="cz-owned">Running</em>
                  ) : (
                    <Twice className="i-btn--sm cz-buy" disabled={!!s.chal} label={<><span>Start</span><small className="cz-cost">{fmt(chalGoal(c, tier))} dust</small></>} armed={<><span>Sure?</span><small className="cz-cost">Collapses now</small></>} onDo={() => startChallenge(c.id)} />
                  )}
                </div>
              );
            })}
          </div>
          <p className="i-note">Starting a challenge is a Collapse that pays nothing. Reach the goal in a single run (you may Ignite along the way, but each run starts from zero) and the tier is yours. Giving up just lifts the handicap.</p>
        </>
      )}
      <Miles s={s} layer={2} />
    </>
  );
}

// ─── galaxies: Big Bang and relics ──────────────────────────────────────────

function Galaxies({ s }: { s: CosmosSave }) {
  const slots = relicSlots(s);
  return (
    <>
      <LayerPanel s={s} layer={3} />
      <H2 aside={<span className="cz-tally">{s.worn.length} / {slots} worn</span>}>Relics</H2>
      <div className="cz-relics">
        {RELICS.map((r) => {
          const lv = s.relics[r.id] ?? 0;
          const on = s.worn.includes(r.id);
          const cost = relicCost(r, lv);
          return (
            <div key={r.id} className={`cz-relic${on ? ' is-worn' : ''}${lv ? ' is-on' : ''}`}>
              <span className="cz-relic__k" aria-hidden="true">
                {r.kanji}
              </span>
              <b>{r.name}</b>
              <small>{r.blurb(Math.max(1, lv))}</small>
              {lv > 0 && lv < RELIC_MAX && <small className="cz-relic__next">Next: {r.blurb(lv + 1)}</small>}
              <span className="cz-pips" aria-label={`Level ${lv} of ${RELIC_MAX}`}>
                {Array.from({ length: RELIC_MAX }, (_, i) => (
                  <i key={i} className={i < lv ? 'is-on' : ''} />
                ))}
              </span>
              <span className="cz-relic__f">
                {lv > 0 && (
                  <button type="button" className="i-btn i-btn--sm" aria-pressed={on} disabled={!on && s.worn.length >= slots} aria-label={on ? `Take off ${r.name}` : `Wear ${r.name}`} onClick={() => toggleRelic(r.id)}>
                    {on ? 'Worn' : 'Wear'}
                  </button>
                )}
                {lv < RELIC_MAX ? (
                  <button type="button" className="i-btn i-btn--sm cz-buy" disabled={cost > s.gal} aria-label={`${lv ? 'Raise' : 'Find'} ${r.name} for ${fmt(cost)} galaxies`} onClick={() => buyRelicLevel(r.id)}>
                    <span>{lv ? 'Raise' : 'Find'}</span>
                    <Cost k="gal" n={cost} />
                  </button>
                ) : (
                  <em className="cz-owned">Max</em>
                )}
              </span>
            </div>
          );
        })}
      </div>
      <p className="i-note">Relics are kept for good, but only the ones you wear do anything. Swap them whenever you like.</p>
      <Miles s={s} layer={3} />
    </>
  );
}

// ─── beyond: Transcend and ascensions ───────────────────────────────────────

function Beyond({ s }: { s: CosmosSave }) {
  return (
    <>
      {(s.asc.bodhi ?? 0) > 0 && (
        <div className="cz-end" role="status">
          <b>悟 Enlightened</b>
          <p>You reached the end of the road. The sky is gold, and everything still turns if you’d like to watch it.</p>
        </div>
      )}
      <LayerPanel s={s} layer={4} />
      <Levels title="Ascensions" note="Ascensions are kept for good." list={ASCS} have={s.asc} purse={s.eon} coin="eon" onBuy={buyAscension} />
      <Miles s={s} layer={4} />
    </>
  );
}

// ─── automation ─────────────────────────────────────────────────────────────

const AUTO_HINT: Record<string, string> = {
  bodies: 'As many of everything as the dust buys, twice a second.',
  ups: 'Cheapest first, twice a second.',
  nodes: 'Any star you can reach and pay for.',
  ignite: 'When it would at least double your starlight, or after two minutes.',
  voids: 'Cheapest first, twice a second.',
  collapse: 'When it would at least double your dark matter, or after ten minutes. Never during a challenge.',
  bang: 'When it would at least double your galaxies, or after half an hour. Never during a challenge.',
};

function Auto({ s }: { s: CosmosSave }) {
  const taps = autoTaps(s);
  return (
    <>
      <H2>Automation</H2>
      <div className="cz-autos">
        {AUTO_KEYS.map((k) => {
          const open = autoOpen(s, k);
          const on = autoOn(s, k);
          const need = autoNeed(k);
          return (
            <div key={k} className={`cz-auto${open ? '' : ' is-shut'}${on ? ' is-on' : ''}`}>
              <span className="cz-card__t">
                <b>{AUTO_NAME[k]}</b>
                <small>{open ? AUTO_HINT[k] : `${LAYERS[need.layer - 1].verb} ${need.at} time${need.at === 1 ? '' : 's'} (“${need.name}”). You’re at ${timesDone(s, need.layer)}.`}</small>
              </span>
              <button type="button" role="switch" className="cz-switch" aria-checked={on} aria-label={AUTO_NAME[k]} disabled={!open} onClick={() => switchAuto(k, !on)}>
                <i />
              </button>
            </div>
          );
        })}
      </div>
      <p className="i-note">
        {taps ? `The auto-tapper makes ${taps} taps a second. ` : 'An auto-tapper arrives at your fifth Ignite. '}
        Automation runs while this tab is open; while you’re away the sky only gathers.
      </p>
    </>
  );
}

// ─── the log: where the numbers come from, feats, totals ────────────────────

function Log({ s, ext, now }: { s: CosmosSave; ext: Ext; now: number }) {
  const parts = dustParts(s, ext, now).filter((p) => p.mult > 1.0001);
  const done = FEATS.filter((f) => s.done.includes(f.id)).length;
  return (
    <>
      <H2>Where your dust comes from</H2>
      <dl className="cz-parts">
        {parts.map((p) => (
          <div key={p.name}>
            <dt>{p.name}</dt>
            <dd>×{p.mult < 100 ? p.mult.toFixed(2) : fmt(p.mult)}</dd>
          </div>
        ))}
        <div className="is-sum">
          <dt>All together</dt>
          <dd>×{fmt(dustMult(s, ext, now))}</dd>
        </div>
        {speed(s) > 1.001 && (
          <div>
            <dt>Speed of time</dt>
            <dd>×{speed(s).toFixed(2)}</dd>
          </div>
        )}
      </dl>
      <H2 aside={<span className="cz-tally">{done} / {FEATS.length}</span>}>Feats</H2>
      <ul className="cz-feats">
        {FEATS.map((f) => {
          const on = s.done.includes(f.id);
          return (
            <li key={f.id} className={on ? 'is-on' : ''}>
              <b>{f.name}</b>
              <small>{f.blurb}</small>
            </li>
          );
        })}
      </ul>
      <p className="i-note">Each feat adds 5% dust, for good.</p>
      <H2>Totals</H2>
      <dl className="cz-stats">
        <Stat k="Dust ever gathered" v={fmt(s.life)} />
        <Stat k="Most dust a second" v={fmt(s.best)} />
        <Stat k="Taps" v={fmt(s.taps)} />
        <Stat k="Bright taps" v={`${fmt(s.crits)} (${Math.round(critChance(s) * 100)}% chance, ×${fmt(critMult(s))})`} />
        <Stat k="Ignites" v={fmt(s.ignitesAll)} />
        {s.collapsesAll > 0 && <Stat k="Collapses" v={fmt(s.collapsesAll)} />}
        {s.bangsAll > 0 && <Stat k="Big Bangs" v={fmt(s.bangsAll)} />}
        {s.transcends > 0 && <Stat k="Transcends" v={fmt(s.transcends)} />}
        {s.lightAll > 0 && <Stat k="Starlight ever earned" v={fmt(s.lightAll)} />}
        {s.darkAll > 0 && <Stat k="Dark matter ever earned" v={fmt(s.darkAll)} />}
        {s.galAll > 0 && <Stat k="Galaxies ever earned" v={fmt(s.galAll)} />}
        {s.eonAll > 0 && <Stat k="Aeons ever earned" v={fmt(s.eonAll)} />}
      </dl>
      <p className="i-note">The Cosmos is a game of its own: nothing here pays Ryō, Tama or XP, and nothing in the Hangar buys anything here.</p>
    </>
  );
}

const Stat = ({ k, v }: { k: string; v: string }) => (
  <div>
    <dt>{k}</dt>
    <dd>{v}</dd>
  </div>
);
