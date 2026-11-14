/**
 * How each aura looks: a list of layers drawn on a 2D canvas. Nothing here keeps state: where every
 * particle is comes from its number and the time, so any frame can be drawn on its own (a still for
 * the index, a loop on the dial, a big one in a scene).
 */
import { AURAS, AURA_TIERS } from '../../domain/game/aura';

const TAU = Math.PI * 2;
/** A steady pseudo-random number in [0, 1) for particle `i`, channel `k`. */
export const hash = (i: number, k: number) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const frac = (x: number) => x - Math.floor(x);

type Shape = 'dot' | 'puff' | 'spark' | 'petal' | 'leaf' | 'flake' | 'drop' | 'star' | 'glyph' | 'crane' | 'nut' | 'flame' | 'lantern' | 'bubble';

type Layer =
  | { k: 'glow'; c: string; r: number; a: number; pulse?: boolean }
  | { k: 'motes'; mode: 'rise' | 'fall' | 'orbit' | 'drift' | 'burst'; shape: Shape; c: string[]; n: number; size: number; speed: number; spread?: number; lit?: boolean; glyphs?: string; tilt?: number; rmin?: number; rmax?: number }
  | { k: 'ring'; c: string; r: number; w: number; tilt: number; spin: number; dash?: [number, number]; roll?: number }
  | { k: 'rays'; c: string; n: number; len: number; spin: number; a: number }
  | { k: 'bolts'; c: string; rate: number }
  | { k: 'gears'; c: string; n: number }
  | { k: 'ribbon'; c: string[] }
  | { k: 'hole' }
  | { k: 'glitch'; c: string[] }
  | { k: 'disc'; c: string; r: number; y: number }
  | { k: 'torii'; c: string }
  | { k: 'serpent'; c: [string, string] }
  | { k: 'koi'; c: [string, string][] }
  | { k: 'wave'; c: string[] }
  | { k: 'enso'; c: string }
  | { k: 'eclipse'; c: string }
  | { k: 'orrery'; c: string }
  | { k: 'cloud'; c: string }
  | { k: 'relic'; c: string };

const ALL_KANJI = AURAS.map((a) => a.kanji).join('');
const TIER_COLORS = AURA_TIERS.map((t) => t.color);

export const AURA_FX: Record<string, Layer[]> = {
  dust: [{ k: 'motes', mode: 'drift', shape: 'dot', c: ['#b8b2a7', '#8d877c'], n: 14, size: 2.2, speed: 0.05 }],
  steam: [{ k: 'motes', mode: 'rise', shape: 'puff', c: ['#dfe7ee'], n: 10, size: 16, speed: 0.12, spread: 0.6 }],
  ember: [
    { k: 'glow', c: '#ff8a3d', r: 0.9, a: 0.18 },
    { k: 'motes', mode: 'rise', shape: 'spark', c: ['#ffb347', '#ff6b1a'], n: 16, size: 3.4, speed: 0.25, lit: true },
  ],
  dew: [
    { k: 'motes', mode: 'drift', shape: 'dot', c: ['#7dd3fc', '#e0f2fe'], n: 12, size: 3, speed: 0.04 },
    { k: 'motes', mode: 'drift', shape: 'star', c: ['#ffffff'], n: 5, size: 5, speed: 0.03, lit: true },
  ],
  moss: [
    { k: 'glow', c: '#84cc16', r: 0.9, a: 0.12 },
    { k: 'motes', mode: 'orbit', shape: 'dot', c: ['#84cc16', '#4d7c0f', '#bef264'], n: 18, size: 4, speed: 0.05, tilt: 0.3, rmin: 0.7, rmax: 1 },
  ],
  copper: [
    { k: 'glow', c: '#d97745', r: 1.05, a: 0.32, pulse: true },
    { k: 'ring', c: '#f0a070', r: 0.9, w: 2, tilt: 0.3, spin: 0.2, dash: [10, 8] },
  ],
  lantern: [
    { k: 'glow', c: '#ffb84d', r: 1, a: 0.2, pulse: true },
    { k: 'motes', mode: 'drift', shape: 'lantern', c: ['#ffb84d', '#ff8a3d', '#ffd98a'], n: 6, size: 9, speed: 0.03 },
  ],
  rain: [
    { k: 'cloud', c: '#94a3b8' },
    { k: 'motes', mode: 'fall', shape: 'drop', c: ['#60a5fa', '#bfdbfe'], n: 26, size: 5, speed: 0.9, spread: 0.7 },
  ],
  firefly: [{ k: 'motes', mode: 'drift', shape: 'dot', c: ['#d9f99d', '#fef08a'], n: 14, size: 3, speed: 0.07, lit: true }],
  sakura: [
    { k: 'glow', c: '#f9a8d4', r: 1, a: 0.13 },
    { k: 'motes', mode: 'fall', shape: 'petal', c: ['#f9a8d4', '#fbcfe8', '#fff1f7'], n: 22, size: 6, speed: 0.18 },
  ],
  maple: [
    { k: 'glow', c: '#ef4444', r: 1, a: 0.13 },
    { k: 'motes', mode: 'fall', shape: 'leaf', c: ['#ef4444', '#f97316', '#facc15'], n: 18, size: 8, speed: 0.2 },
  ],
  tide: [
    { k: 'glow', c: '#22d3ee', r: 1, a: 0.12 },
    { k: 'motes', mode: 'rise', shape: 'bubble', c: ['#a5f3fc'], n: 10, size: 5, speed: 0.16 },
    { k: 'wave', c: ['#22d3ee', '#0ea5e9', '#0369a1'] },
  ],
  static: [
    { k: 'ring', c: '#fde047', r: 0.95, w: 2, tilt: 0.3, spin: 1.4, dash: [4, 14] },
    { k: 'motes', mode: 'drift', shape: 'spark', c: ['#fde047', '#ffffff'], n: 10, size: 4, speed: 0.3, lit: true },
    { k: 'bolts', c: '#fde047', rate: 2.2 },
  ],
  frost: [
    { k: 'glow', c: '#bae6fd', r: 1, a: 0.16 },
    { k: 'ring', c: '#bae6fd', r: 1, w: 1.2, tilt: 1, spin: 0.05, dash: [2, 9] },
    { k: 'motes', mode: 'fall', shape: 'flake', c: ['#e0f2fe', '#bae6fd', '#ffffff'], n: 18, size: 7, speed: 0.1 },
  ],
  sumi: [
    { k: 'enso', c: '#f5f5f5' },
    { k: 'motes', mode: 'drift', shape: 'dot', c: ['#f5f5f5', '#a3a3a3', '#525252'], n: 10, size: 5, speed: 0.03 },
  ],
  koi: [
    { k: 'glow', c: '#38bdf8', r: 1.1, a: 0.16 },
    { k: 'ring', c: '#7dd3fc', r: 1.1, w: 1.5, tilt: 0.34, spin: -0.1, dash: [26, 18] },
    { k: 'koi', c: [['#fb923c', '#ffffff'], ['#f8fafc', '#ef4444']] },
  ],
  thunder: [
    { k: 'glow', c: '#7c3aed', r: 1.1, a: 0.22 },
    { k: 'cloud', c: '#4c3d73' },
    { k: 'motes', mode: 'fall', shape: 'drop', c: ['#a78bfa', '#ddd6fe'], n: 18, size: 5, speed: 1.1, spread: 0.8 },
    { k: 'bolts', c: '#c4b5fd', rate: 3 },
  ],
  foxfire: [
    { k: 'glow', c: '#5eead4', r: 1.1, a: 0.2, pulse: true },
    { k: 'motes', mode: 'orbit', shape: 'flame', c: ['#5eead4', '#22d3ee', '#a7f3d0'], n: 9, size: 12, speed: 0.12, tilt: 0.35, rmin: 0.8, rmax: 1.05, lit: true },
  ],
  spring: [
    { k: 'glow', c: '#f5c451', r: 1.1, a: 0.2 },
    { k: 'gears', c: '#f5c451', n: 5 },
    { k: 'ring', c: '#f5c451', r: 1, w: 2, tilt: 0.3, spin: 0.5, dash: [3, 7] },
    { k: 'motes', mode: 'orbit', shape: 'nut', c: ['#f5c451', '#fde68a'], n: 6, size: 7, speed: 0.15, tilt: 0.3, rmin: 0.95, rmax: 1.05 },
  ],
  moon: [
    { k: 'glow', c: '#fde68a', r: 1.3, a: 0.25 },
    { k: 'disc', c: '#fde68a', r: 0.82, y: -0.3 },
    { k: 'motes', mode: 'drift', shape: 'star', c: ['#fff7d6', '#ffffff'], n: 10, size: 4, speed: 0.02, lit: true, spread: 1.3 },
  ],
  torii: [
    { k: 'glow', c: '#e11d48', r: 1.3, a: 0.22 },
    { k: 'rays', c: '#fbbf24', n: 12, len: 1.7, spin: 0.05, a: 0.3 },
    { k: 'torii', c: '#e11d48' },
    { k: 'motes', mode: 'fall', shape: 'petal', c: ['#fecdd3', '#fda4af'], n: 12, size: 5, speed: 0.14 },
  ],
  cranes: [
    { k: 'glow', c: '#f8fafc', r: 1.2, a: 0.18 },
    { k: 'rays', c: '#ffffff', n: 8, len: 1.5, spin: -0.04, a: 0.14 },
    { k: 'motes', mode: 'orbit', shape: 'crane', c: ['#f8fafc', '#fecaca', '#bfdbfe', '#fde68a'], n: 16, size: 10, speed: 0.1, tilt: 0.4, rmin: 0.7, rmax: 1.25 },
  ],
  veil: [
    { k: 'glow', c: '#34d399', r: 1.2, a: 0.15 },
    { k: 'ribbon', c: ['#34d399', '#22d3ee', '#a78bfa'] },
    { k: 'motes', mode: 'drift', shape: 'star', c: ['#ffffff'], n: 18, size: 3, speed: 0.015, lit: true, spread: 1.3 },
  ],
  dragon: [
    { k: 'glow', c: '#10b981', r: 1.3, a: 0.25, pulse: true },
    { k: 'ring', c: '#facc15', r: 1.15, w: 1.5, tilt: 0.3, spin: -0.3, dash: [2, 10] },
    { k: 'serpent', c: ['#10b981', '#facc15'] },
    { k: 'motes', mode: 'rise', shape: 'spark', c: ['#facc15', '#bbf7d0'], n: 14, size: 3.4, speed: 0.2, lit: true },
  ],
  corona: [
    { k: 'eclipse', c: '#fb923c' },
    { k: 'motes', mode: 'burst', shape: 'spark', c: ['#fdba74', '#fff7ed'], n: 20, size: 3.4, speed: 0.25, spread: 1.4, lit: true },
  ],
  null: [
    { k: 'ring', c: '#22ff88', r: 1.05, w: 2, tilt: 0.3, spin: 0.8, dash: [18, 6] },
    { k: 'motes', mode: 'fall', shape: 'glyph', c: ['#22ff88', '#86efac'], n: 26, size: 9, speed: 0.5, glyphs: '01{}<>;=' },
    { k: 'glitch', c: ['#22ff88', '#ff2bd6', '#21e6ff'] },
  ],
  horizon: [
    { k: 'hole' },
    { k: 'motes', mode: 'orbit', shape: 'dot', c: ['#f97316', '#fdba74', '#fff7ed'], n: 44, size: 2.4, speed: 0.35, tilt: 0.25, rmin: 0.8, rmax: 1.5, lit: true },
  ],
  orrery: [
    { k: 'glow', c: '#eab308', r: 1.3, a: 0.2 },
    { k: 'gears', c: '#a16207', n: 3 },
    { k: 'orrery', c: '#eab308' },
    { k: 'motes', mode: 'drift', shape: 'star', c: ['#fef9c3'], n: 12, size: 3, speed: 0.02, lit: true, spread: 1.4 },
  ],
  banbutsu: [
    { k: 'glow', c: '#f0abfc', r: 1.4, a: 0.3, pulse: true },
    { k: 'rays', c: '#f0abfc', n: 16, len: 1.9, spin: 0.08, a: 0.25 },
    { k: 'ring', c: '#ffffff', r: 0.95, w: 1.5, tilt: 0.36, spin: 0.4, dash: [3, 9] },
    { k: 'ring', c: '#f0abfc', r: 1.3, w: 1.5, tilt: 0.36, spin: -0.25, dash: [14, 10], roll: 0.25 },
    { k: 'motes', mode: 'orbit', shape: 'glyph', c: TIER_COLORS, n: 29, size: 13, speed: 0.08, tilt: 0.4, rmin: 0.75, rmax: 1.4, glyphs: ALL_KANJI },
    { k: 'motes', mode: 'burst', shape: 'star', c: TIER_COLORS, n: 18, size: 4, speed: 0.2, spread: 1.5, lit: true },
  ],
  lastbolt: [
    { k: 'glow', c: '#ffd700', r: 1.5, a: 0.42, pulse: true },
    { k: 'rays', c: '#ffd700', n: 20, len: 2.1, spin: 0.1, a: 0.34 },
    { k: 'rays', c: '#ffffff', n: 10, len: 1.5, spin: -0.16, a: 0.18 },
    { k: 'ring', c: '#ffd700', r: 1.1, w: 2.4, tilt: 0.3, spin: 0.5, dash: [22, 8] },
    { k: 'ring', c: '#fff3b0', r: 1.3, w: 1.5, tilt: 0.3, spin: -0.35, dash: [3, 8], roll: -0.3 },
    { k: 'motes', mode: 'orbit', shape: 'nut', c: ['#ffd700', '#fff3b0'], n: 12, size: 9, speed: 0.14, tilt: 0.34, rmin: 0.9, rmax: 1.35 },
    { k: 'motes', mode: 'rise', shape: 'spark', c: ['#ffd700', '#ffffff'], n: 24, size: 3.6, speed: 0.3, lit: true },
    { k: 'relic', c: '#ffd700' },
  ],
};

// ─── shapes ─────────────────────────────────────────────────────────────────

type C2 = CanvasRenderingContext2D;

function poly(ctx: C2, n: number, outer: number, inner: number) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? inner : outer;
    const a = (i * Math.PI) / n - Math.PI / 2;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
}

export function gearPath(ctx: C2, teeth: number, R: number, r: number) {
  const step = TAU / teeth;
  ctx.beginPath();
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    ctx.lineTo(Math.cos(a - step * 0.28) * r, Math.sin(a - step * 0.28) * r);
    ctx.lineTo(Math.cos(a - step * 0.17) * R, Math.sin(a - step * 0.17) * R);
    ctx.lineTo(Math.cos(a + step * 0.17) * R, Math.sin(a + step * 0.17) * R);
    ctx.lineTo(Math.cos(a + step * 0.28) * r, Math.sin(a + step * 0.28) * r);
  }
  ctx.closePath();
}

/** A hex nut seen from above, about `s` across. */
export function nut(ctx: C2, s: number, c: string) {
  ctx.fillStyle = c;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) ctx.lineTo(Math.cos((i * TAU) / 6) * s, Math.sin((i * TAU) / 6) * s);
  ctx.closePath();
  ctx.moveTo(s * 0.45, 0);
  ctx.arc(0, 0, s * 0.45, 0, TAU, true);
  ctx.fill('evenodd');
}

function shape(ctx: C2, kind: Shape, s: number, c: string, t: number, i: number, glyphs?: string) {
  ctx.fillStyle = c;
  ctx.strokeStyle = c;
  switch (kind) {
    case 'dot':
      ctx.beginPath();
      ctx.arc(0, 0, s, 0, TAU);
      ctx.fill();
      break;
    case 'puff':
      ctx.globalAlpha *= 0.16;
      ctx.beginPath();
      ctx.arc(0, 0, s, 0, TAU);
      ctx.fill();
      break;
    case 'bubble':
      ctx.lineWidth = Math.max(1, s * 0.25);
      ctx.beginPath();
      ctx.arc(0, 0, s, 0, TAU);
      ctx.stroke();
      break;
    case 'spark':
      ctx.lineWidth = Math.max(1, s * 0.4);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-s, 0);
      ctx.lineTo(s, 0);
      ctx.moveTo(0, -s);
      ctx.lineTo(0, s);
      ctx.stroke();
      break;
    case 'petal':
      ctx.beginPath();
      ctx.ellipse(0, 0, s, s * 0.55, 0, 0, TAU);
      ctx.fill();
      break;
    case 'leaf':
      poly(ctx, 5, s, s * 0.42);
      ctx.fill();
      break;
    case 'star':
      poly(ctx, 4, s, s * 0.28);
      ctx.fill();
      break;
    case 'flake':
      ctx.lineWidth = Math.max(1, s * 0.2);
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let k = 0; k < 3; k++) {
        const a = (k * Math.PI) / 3;
        ctx.moveTo(-Math.cos(a) * s, -Math.sin(a) * s);
        ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
      }
      ctx.stroke();
      break;
    case 'drop':
      ctx.lineWidth = Math.max(1, s * 0.3);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, -s * 1.6);
      ctx.lineTo(0, s * 1.6);
      ctx.stroke();
      break;
    case 'glyph': {
      const g = glyphs ?? '?';
      ctx.font = `700 ${Math.round(s * 1.7)}px "RocknRoll One", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(g[i % g.length], 0, 0);
      break;
    }
    case 'crane': {
      const flap = 0.2 + 0.8 * Math.abs(Math.sin(t * 5 + i));
      ctx.lineWidth = Math.max(1.2, s * 0.22);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(-s, -s * flap * 0.2);
      ctx.quadraticCurveTo(-s * 0.5, -s * flap, 0, 0);
      ctx.quadraticCurveTo(s * 0.5, -s * flap, s, -s * flap * 0.2);
      ctx.moveTo(0, 0);
      ctx.lineTo(s * 0.1, s * 0.5);
      ctx.stroke();
      break;
    }
    case 'nut':
      nut(ctx, s, c);
      break;
    case 'flame': {
      const lick = 1 + 0.18 * Math.sin(t * 9 + i * 2);
      ctx.beginPath();
      ctx.moveTo(0, -s * 1.3 * lick);
      ctx.bezierCurveTo(s * 0.9, -s * 0.2, s * 0.7, s * 0.8, 0, s * 0.8);
      ctx.bezierCurveTo(-s * 0.7, s * 0.8, -s * 0.9, -s * 0.2, 0, -s * 1.3 * lick);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha *= 0.7;
      ctx.beginPath();
      ctx.ellipse(0, s * 0.25, s * 0.28, s * 0.42, 0, 0, TAU);
      ctx.fill();
      break;
    }
    case 'lantern':
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.8, s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#1c1210';
      ctx.fillRect(-s * 0.45, -s * 1.15, s * 0.9, s * 0.28);
      ctx.fillRect(-s * 0.45, s * 0.87, s * 0.9, s * 0.28);
      break;
  }
}

// ─── layers ─────────────────────────────────────────────────────────────────

/** Which half is being drawn: behind the robot, or in front of it. */
type Pass = 'back' | 'front';

function drawLayer(ctx: C2, L: Layer, t: number, R: number, pass: Pass) {
  const back = pass === 'back';
  switch (L.k) {
    case 'glow': {
      if (!back) return;
      const a = L.a * (L.pulse ? 0.8 + 0.2 * Math.sin(t * 2.2) : 1);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R * L.r);
      g.addColorStop(0, L.c);
      g.addColorStop(1, 'transparent');
      ctx.globalAlpha *= a * 1.6;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, R * L.r, 0, TAU);
      ctx.fill();
      return;
    }
    case 'motes': {
      const spread = L.spread ?? 1;
      const k = R / 100;
      if (L.lit) ctx.globalCompositeOperation = 'lighter';
      const base = ctx.globalAlpha;
      for (let i = 0; i < L.n; i++) {
        const a = hash(i, 1);
        const b = hash(i, 2);
        const c = hash(i, 3);
        const d = hash(i, 4);
        let x = 0;
        let y = 0;
        let alpha = 1;
        let front = true;
        if (L.mode === 'rise' || L.mode === 'fall') {
          const p = frac(t * L.speed * (0.5 + c) + b);
          x = (a - 0.5) * 2 * R * spread + Math.sin(t * 1.1 + i * 1.7) * R * 0.08;
          y = L.mode === 'rise' ? R * (1 - 2.1 * p) : R * (-1.1 + 2.1 * p);
          alpha = Math.sin(Math.PI * p);
          front = i % 2 === 0;
        } else if (L.mode === 'drift') {
          x = R * spread * Math.sin(TAU * (a + t * L.speed * (0.3 + c))) * (0.4 + 0.6 * b);
          y = R * spread * Math.cos(TAU * (b + t * L.speed * 0.7 * (0.3 + d))) * (0.4 + 0.6 * a);
          alpha = 0.45 + 0.55 * Math.sin(t * 3 * (0.4 + d) + i * 2.3);
          front = i % 2 === 0;
        } else if (L.mode === 'burst') {
          const p = frac(t * L.speed * (0.5 + c) + b);
          x = Math.cos(TAU * a) * p * R * spread;
          y = Math.sin(TAU * a) * p * R * spread;
          alpha = 1 - p;
          front = i % 2 === 0;
        } else {
          const ang = TAU * (a + t * L.speed * (0.5 + c));
          const rr = R * ((L.rmin ?? 0.8) + ((L.rmax ?? 1.1) - (L.rmin ?? 0.8)) * b);
          x = Math.cos(ang) * rr;
          y = Math.sin(ang) * rr * (L.tilt ?? 0.35) + (d - 0.5) * R * 0.3;
          front = Math.sin(ang) > 0;
          alpha = front ? 1 : 0.6;
        }
        if (front === back || alpha <= 0.02) continue;
        ctx.save();
        ctx.globalAlpha = base * Math.max(0, alpha);
        ctx.translate(x, y);
        if (L.shape === 'petal' || L.shape === 'leaf' || L.shape === 'flake' || L.shape === 'nut' || L.shape === 'star') ctx.rotate(t * (c - 0.5) * 3 + i);
        shape(ctx, L.shape, L.size * (0.6 + 0.8 * d) * k, L.c[i % L.c.length], t, i, L.glyphs);
        ctx.restore();
      }
      return;
    }
    case 'ring': {
      const flat = L.tilt >= 1;
      if (flat && !back) return;
      ctx.rotate(L.roll ?? 0);
      ctx.strokeStyle = L.c;
      ctx.lineWidth = L.w * (R / 100) * 1.4;
      if (L.dash) {
        ctx.setLineDash(L.dash.map((v) => (v * R) / 100));
        ctx.lineDashOffset = -t * L.spin * R;
      }
      ctx.globalAlpha *= back ? 0.6 : 1;
      ctx.beginPath();
      if (flat) ctx.ellipse(0, 0, R * L.r, R * L.r, 0, 0, TAU);
      else ctx.ellipse(0, 0, R * L.r, R * L.r * L.tilt, 0, back ? Math.PI : 0, back ? TAU : Math.PI);
      ctx.stroke();
      return;
    }
    case 'rays': {
      if (!back) return;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha *= L.a * (0.8 + 0.2 * Math.sin(t * 1.7));
      const len = R * L.len;
      const g = ctx.createLinearGradient(0, 0, len, 0);
      g.addColorStop(0, L.c);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      const half = (Math.PI / L.n) * 0.42;
      for (let i = 0; i < L.n; i++) {
        ctx.save();
        ctx.rotate((i * TAU) / L.n + t * L.spin * TAU);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(len, -Math.tan(half) * len);
        ctx.lineTo(len, Math.tan(half) * len);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      return;
    }
    case 'bolts': {
      if (back) return;
      const K = Math.floor(t * L.rate);
      const p = frac(t * L.rate);
      ctx.globalAlpha *= (1 - p) ** 2;
      ctx.lineJoin = 'round';
      for (let j = 0; j < 2; j++) {
        const seed = K * 7 + j;
        const x0 = (hash(seed, 1) - 0.5) * R * 1.7;
        const x1 = (hash(seed, 2) - 0.5) * R * 0.9;
        ctx.beginPath();
        ctx.moveTo(x0, -R * 1.1);
        for (let s = 1; s <= 7; s++) ctx.lineTo(x0 + ((x1 - x0) * s) / 7 + (hash(seed, 10 + s) - 0.5) * R * 0.28, -R * 1.1 + (R * 1.8 * s) / 7);
        ctx.strokeStyle = L.c;
        ctx.lineWidth = R * 0.05;
        ctx.globalAlpha *= 0.5;
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = R * 0.018;
        ctx.globalAlpha *= 2;
        ctx.stroke();
      }
      return;
    }
    case 'gears': {
      if (!back) return;
      for (let i = 0; i < L.n; i++) {
        const ang = (i / L.n) * TAU + 0.6;
        const size = R * (0.26 + 0.14 * hash(i, 5));
        ctx.save();
        ctx.translate(Math.cos(ang) * R * 0.92, Math.sin(ang) * R * 0.92);
        ctx.rotate(t * (i % 2 ? -0.7 : 0.7) + i);
        gearPath(ctx, 10, size, size * 0.78);
        ctx.globalAlpha *= 0.16;
        ctx.fillStyle = L.c;
        ctx.fill();
        ctx.globalAlpha *= 4.5;
        ctx.strokeStyle = L.c;
        ctx.lineWidth = Math.max(1, R * 0.014);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.3, 0, TAU);
        ctx.stroke();
        ctx.restore();
      }
      return;
    }
    case 'ribbon': {
      if (!back) return;
      ctx.globalCompositeOperation = 'lighter';
      const step = Math.max(4, R * 0.05);
      L.c.forEach((c, j) => {
        for (let x = -R * 1.5; x < R * 1.5; x += step) {
          const u = x / R;
          const top = -R * (1.25 + 0.16 * Math.sin(u * 2.2 + t * 0.6 + j * 2));
          const hgt = R * (1.1 + 0.5 * Math.sin(u * 1.5 - t * 0.45 + j * 1.3) + 0.25 * Math.sin(u * 5 + t + j));
          const g = ctx.createLinearGradient(0, top, 0, top + hgt);
          g.addColorStop(0, 'transparent');
          g.addColorStop(0.35, c);
          g.addColorStop(1, 'transparent');
          ctx.fillStyle = g;
          ctx.globalAlpha = 0.2 * (0.6 + 0.4 * Math.sin(u * 3 + t * 0.8 + j));
          ctx.fillRect(x, top, step + 1, hgt);
        }
      });
      return;
    }
    case 'hole': {
      if (back) {
        const g = ctx.createRadialGradient(0, 0, R * 0.5, 0, 0, R * 1.5);
        g.addColorStop(0, 'rgb(249 115 22 / 0.55)');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, R * 1.5, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = '#fdba74';
        ctx.lineWidth = R * 0.07;
        ctx.beginPath();
        ctx.ellipse(0, 0, R * 1.3, R * 0.3, -0.2, Math.PI, TAU);
        ctx.stroke();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(0, 0, R * 0.74, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = '#fff7ed';
        ctx.lineWidth = R * 0.025;
        ctx.stroke();
      } else {
        ctx.rotate(-0.2);
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = R * 0.1;
        ctx.beginPath();
        ctx.ellipse(0, 0, R * 1.3, R * 0.3, 0, 0, Math.PI);
        ctx.stroke();
        ctx.strokeStyle = '#fff7ed';
        ctx.lineWidth = R * 0.03;
        ctx.setLineDash([R * 0.3, R * 0.2]);
        ctx.lineDashOffset = -t * R * 1.2;
        ctx.stroke();
      }
      return;
    }
    case 'glitch': {
      const K = Math.floor(t * 9);
      for (let j = 0; j < 7; j++) {
        if ((j % 2 === 0) === back) continue;
        ctx.fillStyle = L.c[j % L.c.length];
        ctx.globalAlpha = 0.25 + 0.4 * hash(K, j + 80);
        ctx.fillRect((hash(K, j + 40) - 0.5) * R * 1.6 - R * 0.3, (hash(K, j) - 0.5) * 2 * R, R * (0.3 + 0.9 * hash(K, j + 60)), R * (0.02 + 0.1 * hash(K, j + 20)));
      }
      return;
    }
    case 'disc': {
      if (!back) return;
      ctx.translate(0, R * L.y);
      ctx.fillStyle = L.c;
      ctx.beginPath();
      ctx.arc(0, 0, R * L.r, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgb(161 98 7 / 0.28)';
      for (const [x, y, r] of [[-0.3, -0.25, 0.14], [0.34, -0.36, 0.09], [0.38, 0.28, 0.17], [-0.42, 0.3, 0.08], [0, 0.1, 0.1]]) {
        ctx.beginPath();
        ctx.arc(x * R * L.r, y * R * L.r, r * R * L.r, 0, TAU);
        ctx.fill();
      }
      return;
    }
    case 'torii': {
      if (!back) return;
      const s = R;
      ctx.fillStyle = '#fbbf24';
      ctx.globalAlpha *= 0.9;
      ctx.beginPath();
      ctx.arc(0, -s * 0.15, s * 0.5, 0, TAU);
      ctx.fill();
      ctx.globalAlpha /= 0.9;
      ctx.fillStyle = L.c;
      ctx.fillRect(-s * 0.72, -s * 0.8, s * 0.13, s * 1.8);
      ctx.fillRect(s * 0.59, -s * 0.8, s * 0.13, s * 1.8);
      ctx.fillRect(-s * 0.88, -s * 0.62, s * 1.76, s * 0.1);
      ctx.beginPath();
      ctx.moveTo(-s * 1.12, -s * 1.02);
      ctx.quadraticCurveTo(0, -s * 0.86, s * 1.12, -s * 1.02);
      ctx.lineTo(s * 1.04, -s * 0.84);
      ctx.quadraticCurveTo(0, -s * 0.72, -s * 1.04, -s * 0.84);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#1c1210';
      ctx.beginPath();
      ctx.moveTo(-s * 1.16, -s * 1.08);
      ctx.quadraticCurveTo(0, -s * 0.92, s * 1.16, -s * 1.08);
      ctx.lineTo(s * 1.12, -s * 1.0);
      ctx.quadraticCurveTo(0, -s * 0.84, -s * 1.12, -s * 1.0);
      ctx.closePath();
      ctx.fill();
      return;
    }
    case 'serpent': {
      const N = 44;
      for (let i = N - 1; i >= 0; i--) {
        const ang = t * 0.9 - i * 0.135;
        const front = Math.sin(ang) > 0;
        if (front === back) continue;
        const x = Math.cos(ang) * R * 1.02;
        const y = Math.sin(ang) * R * 0.36 + Math.sin(ang * 2 + t) * R * 0.1 + (i / N - 0.4) * R * 0.7;
        const size = R * 0.11 * (1 - (i / N) * 0.8);
        ctx.fillStyle = i % 4 < 2 ? L.c[0] : L.c[1];
        ctx.globalAlpha = front ? 1 : 0.65;
        ctx.beginPath();
        ctx.arc(x, y, i === 0 ? size * 1.5 : size, 0, TAU);
        ctx.fill();
        if (i === 0) {
          ctx.strokeStyle = L.c[1];
          ctx.lineWidth = R * 0.022;
          ctx.lineCap = 'round';
          const dir = -Math.sin(ang) > 0 ? 1 : -1;
          ctx.beginPath();
          ctx.moveTo(x, y - size);
          ctx.lineTo(x - dir * size * 1.6, y - size * 2.6);
          ctx.moveTo(x, y - size);
          ctx.lineTo(x - dir * size * 0.4, y - size * 2.8);
          ctx.moveTo(x + dir * size, y + size * 0.4);
          ctx.quadraticCurveTo(x + dir * size * 3, y + size * 0.2, x + dir * size * 3.4, y + size * 1.6);
          ctx.stroke();
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(x + dir * size * 0.5, y - size * 0.3, size * 0.34, 0, TAU);
          ctx.fill();
        }
      }
      return;
    }
    case 'koi': {
      L.c.forEach(([body, patch], j) => {
        const ang = t * 0.7 + j * Math.PI;
        const front = Math.sin(ang) > 0;
        if (front === back) return;
        const x = Math.cos(ang) * R * 1.05;
        const y = Math.sin(ang) * R * 0.36 + R * 0.25;
        ctx.save();
        ctx.translate(x, y);
        // Head along the way it is swimming, flattened with the ring.
        ctx.rotate(Math.atan2(Math.cos(ang) * 0.36, -Math.sin(ang)));
        const s = R * 0.2;
        const wag = Math.sin(t * 7 + j * 2) * 0.35;
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.ellipse(0, 0, s, s * 0.4, 0, 0, TAU);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-s * 0.85, 0);
        ctx.lineTo(-s * 1.6, -s * 0.5 + wag * s);
        ctx.lineTo(-s * 1.6, s * 0.5 + wag * s);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = patch;
        ctx.beginPath();
        ctx.ellipse(s * 0.2, 0, s * 0.3, s * 0.26, 0, 0, TAU);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(-s * 0.45, 0, s * 0.18, s * 0.2, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(s * 0.72, -s * 0.14, s * 0.06, 0, TAU);
        ctx.arc(s * 0.72, s * 0.14, s * 0.06, 0, TAU);
        ctx.fill();
        ctx.restore();
      });
      return;
    }
    case 'wave': {
      if (back) return;
      L.c.forEach((c, j) => {
        const y0 = R * (0.62 + 0.14 * j);
        ctx.beginPath();
        ctx.moveTo(-R * 1.5, R * 1.3);
        for (let x = -R * 1.5; x <= R * 1.5; x += R * 0.06) ctx.lineTo(x, y0 + Math.sin((x / R) * 3.2 + t * (1.2 + 0.4 * j) + j * 1.7) * R * 0.06);
        ctx.lineTo(R * 1.5, R * 1.3);
        ctx.closePath();
        ctx.fillStyle = c;
        ctx.globalAlpha = 0.5;
        ctx.fill();
        ctx.strokeStyle = '#ecfeff';
        ctx.lineWidth = Math.max(1, R * 0.012);
        ctx.globalAlpha = 0.5;
        ctx.stroke();
      });
      return;
    }
    case 'enso': {
      if (!back) return;
      ctx.rotate(t * 0.08 - 1.2);
      ctx.strokeStyle = L.c;
      ctx.lineCap = 'round';
      const seg = 60;
      for (let i = 0; i < seg; i++) {
        const a0 = (i / seg) * TAU * 0.93;
        const a1 = ((i + 1.4) / seg) * TAU * 0.93;
        ctx.lineWidth = R * (0.035 + 0.11 * Math.sin((i / seg) * Math.PI) ** 0.7);
        ctx.globalAlpha = 0.5 + 0.4 * hash(i, 9);
        ctx.beginPath();
        ctx.arc(0, 0, R * 0.98, a0, a1);
        ctx.stroke();
      }
      return;
    }
    case 'eclipse': {
      if (!back) return;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(0, 0, R * 0.55, 0, 0, R * 1.5);
      g.addColorStop(0, '#fff7ed');
      g.addColorStop(0.25, L.c);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, R * 1.5, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#fed7aa';
      ctx.lineCap = 'round';
      for (let i = 0; i < 40; i++) {
        const a = (i / 40) * TAU + Math.sin(t * 0.3 + i) * 0.03;
        const len = R * (0.85 + 0.55 * hash(i, 3) * (0.7 + 0.3 * Math.sin(t * 2 + i * 1.3)));
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = R * 0.02;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * R * 0.7, Math.sin(a) * R * 0.7);
        ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
        ctx.stroke();
      }
      ctx.restore();
      ctx.fillStyle = '#05030a';
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.7, 0, TAU);
      ctx.fill();
      // The diamond ring: one bead of light on the rim.
      const b = -0.9 + Math.sin(t * 0.25) * 0.3;
      ctx.translate(Math.cos(b) * R * 0.7, Math.sin(b) * R * 0.7);
      ctx.rotate(t * 0.5);
      ctx.fillStyle = '#ffffff';
      poly(ctx, 4, R * 0.24 * (0.85 + 0.15 * Math.sin(t * 3)), R * 0.04);
      ctx.fill();
      return;
    }
    case 'orrery': {
      const rings: [number, number, number, string][] = [[0.75, 0.9, 0.15, '#fde68a'], [1.02, -0.6, -0.2, '#93c5fd'], [1.32, 0.4, 0.1, '#fca5a5']];
      if (back) {
        ctx.strokeStyle = L.c;
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = Math.max(1, R * 0.012);
        for (let i = 0; i < 60; i++) {
          const a = (i / 60) * TAU;
          const r0 = R * (i % 5 ? 1.5 : 1.44);
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
          ctx.lineTo(Math.cos(a) * R * 1.56, Math.sin(a) * R * 1.56);
          ctx.stroke();
        }
        for (const [len, speed] of [[1.4, 0.8], [1.0, 0.07]]) {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(t * speed - Math.PI / 2) * R * len, Math.sin(t * speed - Math.PI / 2) * R * len);
          ctx.stroke();
        }
      }
      for (const [r, speed, roll, c] of rings) {
        ctx.save();
        ctx.rotate(roll);
        ctx.strokeStyle = L.c;
        ctx.lineWidth = Math.max(1, R * 0.016);
        ctx.globalAlpha = back ? 0.55 : 1;
        ctx.beginPath();
        ctx.ellipse(0, 0, R * r, R * r * 0.3, 0, back ? Math.PI : 0, back ? TAU : Math.PI);
        ctx.stroke();
        const ang = t * speed + r * 5;
        if (Math.sin(ang) > 0 !== back) {
          ctx.fillStyle = c;
          ctx.beginPath();
          ctx.arc(Math.cos(ang) * R * r, Math.sin(ang) * R * r * 0.3, R * 0.075, 0, TAU);
          ctx.fill();
        }
        ctx.restore();
      }
      return;
    }
    case 'cloud': {
      if (!back) return;
      ctx.fillStyle = L.c;
      ctx.globalAlpha *= 0.85;
      ctx.translate(Math.sin(t * 0.4) * R * 0.06, -R * 1.02);
      for (const [x, y, r] of [[-0.5, 0.05, 0.3], [-0.15, -0.1, 0.38], [0.25, -0.05, 0.34], [0.58, 0.07, 0.26], [0.05, 0.12, 0.4]]) {
        ctx.beginPath();
        ctx.arc(x * R, y * R, r * R, 0, TAU);
        ctx.fill();
      }
      return;
    }
    case 'relic': {
      if (back) return;
      ctx.translate(0, -R * 1.18 + Math.sin(t * 1.6) * R * 0.05);
      ctx.rotate(t * 0.9);
      drawBolt(ctx, R * 0.2, L.c);
      return;
    }
  }
}

/** A single bolt, head up: what the Works makes. */
export function drawBolt(ctx: C2, s: number, c: string) {
  ctx.fillStyle = c;
  ctx.strokeStyle = '#7a5b00';
  ctx.lineWidth = Math.max(1, s * 0.08);
  ctx.beginPath();
  ctx.rect(-s * 0.28, -s * 0.2, s * 0.56, s * 1.5);
  ctx.fill();
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-s * 0.28, s * (0.1 + i * 0.3));
    ctx.lineTo(s * 0.28, s * (0.25 + i * 0.3));
    ctx.stroke();
  }
  ctx.beginPath();
  for (let i = 0; i < 6; i++) ctx.lineTo(Math.cos((i * TAU) / 6) * s * 0.7, -s * 0.5 + Math.sin((i * TAU) / 6) * s * 0.42);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

/**
 * Draw an aura round (cx, cy). `R` is roughly the reach of its inner ring; `pass` picks the half
 * behind the robot, the half in front, or both.
 */
export function drawAura(ctx: C2, id: string, t: number, cx: number, cy: number, R: number, pass: Pass | 'both' = 'both', alpha = 1) {
  const layers = AURA_FX[id];
  if (!layers) return;
  for (const p of pass === 'both' ? (['back', 'front'] as const) : [pass]) {
    for (const L of layers) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.globalAlpha = alpha;
      drawLayer(ctx, L, t, R, p);
      ctx.restore();
    }
  }
}
