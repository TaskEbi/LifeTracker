/**
 * How a roll shows on the dial's stage. Every roll spins a reel of auras you have already rolled and
 * lands on the result; a fast dial skips the reel for common ones. Rare and above are different every
 * time: the reel slows, the stage goes dark and the tier's omen plays (auraOmens.ts): Rare shimmers,
 * Epic fakes a stop on a common one and then lightning strikes, Legendary goes quiet and pillars of
 * gold rise, Mythic glitches and tears open. Then it lands with a burst, or, if it has a scene, the
 * full-screen scene takes over from there. The reel only ever shows auras already rolled.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { AURA_TIERS, AURAS, auraById, oddsText, SCENE_TIER, type Aura, type AuraSave } from '../../domain/game/aura';
import { fmt } from '../../domain/game/idle';
import { bloom, reducedMotion } from './AuraCanvas';
import { hash } from './auraFx';
import { drawLanding, drawOmen, type Box } from './auraOmens';
import { holdScenes, type Hit } from './auraStore';

/** Seconds of each part: the spinning reel, a fake stop, and the omen. */
export interface Plan {
  tier: number;
  reel: number;
  fake: number;
  omen: number;
}

/** Seconds the landing burst lasts. */
const LAND = 1.1;

export function planOf(a: Aura, hit: Hit, step: number): Plan {
  const t = a.tier;
  if (reducedMotion()) return { tier: t, reel: 0, fake: 0, omen: 0 };
  // A dial turning faster than this shows common rolls straight away (unless you pulled it).
  const quick = step < 1.2 && !hit.hand;
  if (t === 0) return { tier: t, reel: quick ? 0 : 0.4, fake: 0, omen: 0 };
  if (t === 1) return { tier: t, reel: quick ? 0 : 0.6, fake: 0, omen: 0 };
  if (t === 2) return { tier: t, reel: 0.7, fake: 0, omen: 1.0 };
  if (t === 3) return { tier: t, reel: 0.6, fake: 0.55, omen: 1.2 };
  if (t === 4) return { tier: t, reel: 0.6, fake: 0.45, omen: 1.9 };
  return { tier: t, reel: 0.6, fake: 0.45, omen: 2.5 };
}

export const windOf = (p: Plan) => p.reel + p.fake + p.omen;
/** How long a roll keeps the stage before a commoner one can take it over (seconds). */
export const spotLen = (p: Plan) => windOf(p) + (p.tier >= SCENE_TIER ? 1.8 : 0);

interface Face {
  kanji: string;
  name: string;
  c: string;
  tier: number;
}
const UNKNOWN: Face = { kanji: '？', name: '???', c: '#8b8fa3', tier: 0 };

/** What the reel spins through: auras already rolled, commoner than this one, in a shuffled order. */
function facesFor(s: AuraSave, hit: Aura, seed: number): Face[] {
  const top = Math.max(1, hit.tier - 1);
  const pool = AURAS.filter((a) => s.got[a.id] && a.id !== hit.id && a.tier <= top);
  if (!pool.length) return [UNKNOWN];
  return pool
    .map((a, i) => ({ a, k: hash(seed, i + 1) }))
    .sort((x, y) => x.k - y.k)
    .slice(0, 16)
    .map(({ a }) => ({ kanji: a.kanji, name: a.name, c: a.c, tier: a.tier }));
}

const GLYPHS = '▓▒░█◆？霊#%&@¤';
const scramble = (n: number, k: number) => Array.from({ length: n }, (_, i) => GLYPHS[Math.floor(hash(k, i + 3) * GLYPHS.length)]).join('');

const OMEN_TEXT = ['', '', 'Something rare…', 'The dial is fighting back…', 'The Works goes quiet…', 'This should not be possible.'];
const BUZZ: number[][] = [[], [], [30], [40, 40, 70], [60, 50, 60, 50, 140], [90, 60, 90, 60, 90, 60, 220]];

function buzz(tier: number) {
  const pattern = BUZZ[tier];
  if (!pattern?.length) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* not on this device */
  }
}

type Phase = 'reel' | 'fake' | 'omen' | 'land';

export function AuraRoll({ hit, plan, s, onOmen }: { hit: Hit; plan: Plan; s: AuraSave; onOmen: (tier: number) => void }) {
  const a = auraById(hit.id)!;
  const wind = windOf(plan);
  const rare = plan.tier >= SCENE_TIER && wind > 0;
  // The reel is chosen once, when the roll lands.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const faces = useMemo(() => facesFor(s, a, hit.n), [hit.n]);
  const [view, setView] = useState<{ phase: Phase; i: number }>({ phase: wind > 0 ? 'reel' : 'land', i: 0 });
  const cv = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (wind === 0) {
      buzz(plan.tier);
      return;
    }
    const t0 = performance.now();
    if (hit.scene) holdScenes(Date.now() + wind * 1000);
    const canvas = cv.current;
    const ctx = canvas?.getContext('2d') ?? null;
    let box: Box | null = null;
    if (canvas && ctx) {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      box = { w: r.width, h: r.height, cx: r.width / 2, cy: r.height / 2, S: Math.min(r.width, r.height) };
    }
    const tc = AURA_TIERS[plan.tier].color;
    let raf = 0;
    let lastKey = '';
    let lastPhase: Phase = 'reel';
    const frame = () => {
      const e = (performance.now() - t0) / 1000;
      let phase: Phase;
      let i = 0;
      if (e < plan.reel) {
        phase = 'reel';
        // Ten faces go by, slowing down.
        i = Math.floor(10 * (1 - (1 - e / plan.reel) ** 2));
      } else if (e < plan.reel + plan.fake) {
        phase = 'fake';
      } else if (e < wind) {
        phase = 'omen';
        i = Math.floor((e - plan.reel - plan.fake) * (plan.tier >= 5 ? 14 : plan.tier === 2 ? 4 : 1));
      } else {
        phase = 'land';
      }
      const key = `${phase}${i}`;
      if (key !== lastKey) {
        lastKey = key;
        setView({ phase, i });
      }
      if (phase !== lastPhase) {
        lastPhase = phase;
        onOmen(phase === 'omen' && plan.tier >= 3 ? plan.tier : 0);
        if (phase === 'land') buzz(plan.tier);
      }
      if (ctx && box) {
        ctx.clearRect(0, 0, box.w, box.h);
        if (phase === 'omen') {
          drawOmen(ctx, plan.tier, (e - plan.reel - plan.fake) / plan.omen, e, box, tc);
          bloom(ctx, 0.3);
        } else if (phase === 'land' && e < wind + LAND) {
          drawLanding(ctx, plan.tier, (e - wind) / LAND, e, box, tc, a.c);
          bloom(ctx, 0.3);
        }
      }
      if (e < wind + (rare ? LAND : 0)) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      onOmen(0);
      // Left (or overtaken) before the wind-up ended: let its scene play now.
      if (hit.scene && performance.now() < t0 + wind * 1000) holdScenes(0);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hit.n]);

  const tier = AURA_TIERS[plan.tier];
  const style = { '--a': tier.color, '--au': a.c } as CSSProperties;
  let face: Face = faces[view.i % faces.length];
  let label = face.name;
  if (view.phase === 'fake' || (view.phase === 'omen' && plan.tier >= 3)) face = faces.find((f) => f.tier === 0) ?? faces[0];
  if (view.phase === 'omen' && plan.tier === 2) face = faces[(10 + view.i) % faces.length];
  label = face.name;
  if (view.phase === 'omen' && plan.tier >= 5) label = scramble(Math.max(4, face.name.length), view.i);

  return (
    <>
      {rare && <canvas ref={cv} className="au-omen" aria-hidden="true" />}
      {view.phase === 'land' ? (
        <p className={`au-hit t${plan.tier}${plan.tier >= SCENE_TIER ? ' is-big' : ''}`} style={style}>
          {plan.tier >= SCENE_TIER && <em className="au-hit__stamp">{tier.name}</em>}
          <span aria-hidden="true">{a.kanji}</span>
          <b>{a.name}</b>
          <small>
            {oddsText(a)}
            {hit.of > 1 ? ` · best of ${fmt(hit.of)}` : ''}
            {hit.fresh ? ' · new' : ''}
          </small>
        </p>
      ) : (
        <p className={`au-reel is-${view.phase} t${plan.tier}`} style={style} aria-hidden="true">
          <span key={`${view.phase}${view.i}`} className="au-reel__face" style={{ '--f': face.c } as CSSProperties}>
            <i>{view.phase === 'omen' && plan.tier >= 5 ? '？' : face.kanji}</i>
            <b>{label}</b>
          </span>
          {view.phase === 'omen' && <small>{OMEN_TEXT[plan.tier]}</small>}
        </p>
      )}
    </>
  );
}
