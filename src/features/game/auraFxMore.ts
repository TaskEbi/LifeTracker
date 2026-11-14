/**
 * The finer brushes the rarer auras are painted with: wings, mandalas, rune circles, fire, galaxies,
 * a tesseract and so on. Same rules as auraFx.ts: nothing keeps state, every frame is a function of
 * the time, and each layer says which half (behind the robot or in front) it draws in.
 */
import { hash, poly, type Pass } from './auraFx';

const TAU = Math.PI * 2;
const frac = (x: number) => x - Math.floor(x);
type C2 = CanvasRenderingContext2D;

export type MoreShape = 'feather' | 'butterfly' | 'shuriken' | 'sword' | 'talisman' | 'cube' | 'coin' | 'diamond' | 'plane' | 'jelly' | 'dash' | 'clover' | 'piece' | 'orb';

export type MoreLayer =
  | { k: 'wings'; c: [string, string]; style?: 'feather' | 'flame' | 'blade' | 'tail'; pairs?: number; span?: number }
  | { k: 'halo'; c: string; y?: number; r?: number }
  | { k: 'mandala'; c: string[]; r: number; n: number; spin?: number; square?: boolean }
  | { k: 'runes'; c: string; glyphs: string; r?: number; y?: number }
  | { k: 'pillar'; c: string; w?: number }
  | { k: 'shards'; c: string[]; n: number; rmin?: number; rmax?: number; size?: number; speed?: number }
  | { k: 'spiral'; c: string[]; arms: number; n: number; r: number; spin: number }
  | { k: 'planet'; c: [string, string]; r: number; x: number; y: number; ring?: string }
  | { k: 'comets'; c: string; n: number }
  | { k: 'arcs'; c: string; n: number; r?: number }
  | { k: 'fireworks'; c: string[]; rate: number }
  | { k: 'scape'; kind: 'fuji' | 'pagoda' | 'bamboo' | 'city' | 'bigwave' | 'tree' | 'gates'; c: string; c2?: string }
  | { k: 'strings'; c: string[]; n: number }
  | { k: 'eye'; c: string }
  | { k: 'smoke'; c: string; n: number }
  | { k: 'flames'; c: [string, string, string]; n: number; h?: number; ring?: boolean }
  | { k: 'clock'; c: string; r?: number; rev?: boolean }
  | { k: 'grid'; c: string; checker?: string }
  | { k: 'hex'; c: string; r?: number }
  | { k: 'stars'; c: string; n: number; seed: number; r?: number }
  | { k: 'ripples'; c: string; n?: number }
  | { k: 'ribbons'; c: string[]; n: number; w?: number }
  | { k: 'yinyang'; c: [string, string]; r: number }
  | { k: 'lotus'; c: [string, string] }
  | { k: 'bars'; c: string[]; n: number }
  | { k: 'atom'; c: string; e: string }
  | { k: 'tesseract'; c: string }
  | { k: 'dna'; c: [string, string] }
  | { k: 'lissajous'; c: string[]; a: number; b: number }
  | { k: 'sun'; c: [string, string]; r: number }
  | { k: 'nova'; c: string[] }
  | { k: 'portal'; c: string[]; r?: number }
  | { k: 'cracks'; c: string }
  | { k: 'scan'; c: string }
  | { k: 'slashes'; c: string; n: number }
  | { k: 'drums'; c: string; n: number }
  | { k: 'frames'; c: string[] };

// ─── shapes for motes ───────────────────────────────────────────────────────

export function moreShape(ctx: C2, kind: string, s: number, c: string, t: number, i: number, glyphs?: string) {
  ctx.fillStyle = c;
  ctx.strokeStyle = c;
  switch (kind as MoreShape) {
    case 'feather':
      ctx.beginPath();
      ctx.moveTo(-s * 1.3, 0);
      ctx.quadraticCurveTo(0, -s * 0.6, s * 1.3, 0);
      ctx.quadraticCurveTo(0, s * 0.6, -s * 1.3, 0);
      ctx.fill();
      ctx.strokeStyle = 'rgb(0 0 0 / 0.35)';
      ctx.lineWidth = Math.max(0.6, s * 0.08);
      ctx.beginPath();
      ctx.moveTo(-s * 1.3, 0);
      ctx.lineTo(s * 1.3, 0);
      ctx.stroke();
      break;
    case 'butterfly': {
      const flap = 0.25 + 0.75 * Math.abs(Math.sin(t * 7 + i * 1.3));
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(side * s * 0.55 * flap, -s * 0.25, s * 0.6 * flap, s * 0.75, side * 0.5, 0, TAU);
        ctx.ellipse(side * s * 0.4 * flap, s * 0.5, s * 0.4 * flap, s * 0.5, side * -0.4, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = '#111';
      ctx.fillRect(-s * 0.07, -s * 0.7, s * 0.14, s * 1.5);
      break;
    }
    case 'shuriken':
      ctx.rotate(t * 9 + i);
      poly(ctx, 4, s * 1.2, s * 0.32);
      ctx.fill();
      ctx.fillStyle = '#0b0a14';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.18, 0, TAU);
      ctx.fill();
      break;
    case 'sword':
      ctx.beginPath();
      ctx.moveTo(0, s * 2.2);
      ctx.lineTo(-s * 0.22, s * 1.7);
      ctx.lineTo(-s * 0.22, -s * 0.9);
      ctx.lineTo(s * 0.22, -s * 0.9);
      ctx.lineTo(s * 0.22, s * 1.7);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.globalAlpha *= 0.6;
      ctx.fillRect(-s * 0.05, -s * 0.9, s * 0.1, s * 2.7);
      ctx.globalAlpha /= 0.6;
      ctx.fillStyle = '#3b2a12';
      ctx.fillRect(-s * 0.55, -s * 1.05, s * 1.1, s * 0.18);
      ctx.fillRect(-s * 0.14, -s * 1.9, s * 0.28, s * 0.9);
      break;
    case 'talisman':
    case 'piece': {
      const g = glyphs ?? '符';
      ctx.beginPath();
      if (kind === 'piece') {
        ctx.moveTo(0, -s * 1.25);
        ctx.lineTo(s * 0.8, -s * 0.6);
        ctx.lineTo(s, s * 1.1);
        ctx.lineTo(-s, s * 1.1);
        ctx.lineTo(-s * 0.8, -s * 0.6);
        ctx.closePath();
      } else ctx.rect(-s * 0.6, -s * 1.3, s * 1.2, s * 2.6);
      ctx.fill();
      ctx.fillStyle = kind === 'piece' ? '#2a1a08' : '#b91c1c';
      ctx.font = `700 ${Math.round(s * 1.15)}px "RocknRoll One", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(g[i % g.length], 0, s * 0.1);
      break;
    }
    case 'cube': {
      const h = s * 0.9;
      const face = (pts: number[], shade: number) => {
        ctx.beginPath();
        for (let k = 0; k < pts.length; k += 2) ctx.lineTo(pts[k], pts[k + 1]);
        ctx.closePath();
        ctx.fillStyle = c;
        ctx.fill();
        ctx.fillStyle = `rgb(0 0 0 / ${shade})`;
        ctx.fill();
      };
      face([0, -h, h, -h / 2, 0, 0, -h, -h / 2], 0);
      face([-h, -h / 2, 0, 0, 0, h, -h, h / 2], 0.3);
      face([h, -h / 2, 0, 0, 0, h, h, h / 2], 0.55);
      break;
    }
    case 'coin':
      ctx.scale(Math.max(0.15, Math.abs(Math.cos(t * 3 + i))), 1);
      ctx.beginPath();
      ctx.arc(0, 0, s, 0, TAU);
      ctx.rect(s * 0.3, -s * 0.3, -s * 0.6, s * 0.6);
      ctx.fill('evenodd');
      break;
    case 'diamond':
      ctx.beginPath();
      ctx.moveTo(0, -s * 1.3);
      ctx.lineTo(s * 0.8, 0);
      ctx.lineTo(0, s * 1.3);
      ctx.lineTo(-s * 0.8, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgb(255 255 255 / 0.4)';
      ctx.beginPath();
      ctx.moveTo(0, -s * 1.3);
      ctx.lineTo(s * 0.8, 0);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();
      break;
    case 'plane':
      ctx.rotate(Math.sin(t * 2 + i) * 0.2);
      ctx.beginPath();
      ctx.moveTo(s * 1.5, 0);
      ctx.lineTo(-s * 1.2, -s * 0.8);
      ctx.lineTo(-s * 0.6, 0);
      ctx.lineTo(-s * 1.2, s * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgb(0 0 0 / 0.3)';
      ctx.lineWidth = Math.max(0.6, s * 0.1);
      ctx.beginPath();
      ctx.moveTo(s * 1.5, 0);
      ctx.lineTo(-s * 0.6, 0);
      ctx.stroke();
      break;
    case 'jelly': {
      const beat = 1 + 0.15 * Math.sin(t * 3 + i);
      ctx.globalAlpha *= 0.8;
      ctx.beginPath();
      ctx.ellipse(0, 0, s * beat, s * 0.8, 0, Math.PI, TAU);
      ctx.fill();
      ctx.lineWidth = Math.max(0.8, s * 0.12);
      ctx.lineCap = 'round';
      for (let k = -1; k <= 1; k++) {
        ctx.beginPath();
        ctx.moveTo(k * s * 0.5, 0);
        ctx.quadraticCurveTo(k * s * 0.5 + Math.sin(t * 3 + k + i) * s * 0.4, s * 0.9, k * s * 0.4, s * 1.8);
        ctx.stroke();
      }
      break;
    }
    case 'dash':
      ctx.lineWidth = Math.max(1, s * 0.35);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-s * 2.2, 0);
      ctx.lineTo(s * 2.2, 0);
      ctx.stroke();
      break;
    case 'clover':
      ctx.beginPath();
      for (let k = 0; k < 3; k++) ctx.arc(Math.cos((k * TAU) / 3 - Math.PI / 2) * s * 0.55, Math.sin((k * TAU) / 3 - Math.PI / 2) * s * 0.55, s * 0.55, 0, TAU);
      ctx.fill();
      break;
    case 'orb': {
      const g = ctx.createRadialGradient(-s * 0.3, -s * 0.3, 0, 0, 0, s);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.35, c);
      g.addColorStop(1, 'rgb(0 0 0 / 0.55)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, s, 0, TAU);
      ctx.fill();
      ctx.lineWidth = Math.max(0.8, s * 0.12);
      ctx.globalAlpha *= 0.6;
      ctx.beginPath();
      ctx.arc(0, 0, s * 1.5, 0, TAU);
      ctx.stroke();
      break;
    }
  }
}

// ─── helpers ────────────────────────────────────────────────────────────────

/** A leaf from the origin along +x: the feather, flame tongue and petal are all this. */
function leaf(ctx: C2, len: number, wid: number, belly = 0.5) {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * belly, -wid, len, 0);
  ctx.quadraticCurveTo(len * belly, wid, 0, 0);
}

function toriiAt(ctx: C2, s: number, c: string) {
  ctx.fillStyle = c;
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
}

function branch(ctx: C2, len: number, depth: number, t: number, seed: number, c: string, c2: string) {
  if (depth === 0 || len < 2) {
    ctx.fillStyle = c2;
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 2 + seed);
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(1.2, len * 0.55), 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
    return;
  }
  ctx.strokeStyle = c;
  ctx.lineWidth = Math.max(1, depth * depth * 0.22);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -len);
  ctx.stroke();
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(0, -len);
    ctx.rotate(side * (0.38 + 0.25 * hash(seed, depth)) + Math.sin(t * 0.7 + depth) * 0.03);
    branch(ctx, len * (0.66 + 0.12 * hash(seed + side, depth)), depth - 1, t, seed * 2 + (side > 0 ? 1 : 0), c, c2);
    ctx.restore();
  }
}

// ─── layers ─────────────────────────────────────────────────────────────────

export function drawMore(ctx: C2, layer: unknown, t: number, R: number, pass: Pass) {
  const L = layer as MoreLayer;
  const back = pass === 'back';
  switch (L.k) {
    case 'wings': {
      if (!back) return;
      const style = L.style ?? 'feather';
      const span = L.span ?? 1.35;
      if (style === 'flame') ctx.globalCompositeOperation = 'lighter';
      if (style === 'tail') {
        for (let f = 0; f < 9; f++) {
          const ang = -Math.PI * (0.1 + (0.8 * f) / 8) + Math.sin(t * 1.3 + f * 0.9) * 0.09;
          const len = R * span * (0.85 + 0.25 * Math.sin((Math.PI * f) / 8));
          ctx.save();
          ctx.translate(0, R * 0.35);
          ctx.rotate(ang);
          const g = ctx.createLinearGradient(0, 0, len, 0);
          g.addColorStop(0, L.c[0]);
          g.addColorStop(0.7, L.c[0]);
          g.addColorStop(1, L.c[1]);
          ctx.fillStyle = g;
          leaf(ctx, len, len * 0.2, 0.72);
          ctx.fill();
          ctx.restore();
        }
        return;
      }
      const pairs = L.pairs ?? 1;
      for (let j = pairs - 1; j >= 0; j--) {
        const sc = span * 0.78 * (1 - j * 0.22);
        for (const side of [-1, 1]) {
          ctx.save();
          ctx.translate(side * R * 0.12, -R * 0.05 + j * R * 0.2);
          ctx.scale(side, 1);
          // Lower pairs droop; all of them beat slowly.
          ctx.rotate(Math.sin(t * 1.6 + j * 0.8) * 0.1 + j * 0.42 - 0.1);
          // Long flight feathers first, then a row of short ones over their roots.
          for (let row = 0; row < 2; row++) {
            const F = row ? 8 : 12;
            for (let f = 0; f < F; f++) {
              const u = f / (F - 1);
              // Along the arm: up and out to the wrist, then out to the tip.
              const bx = R * sc * (u < 0.45 ? (u / 0.45) * 0.55 : 0.55 + ((u - 0.45) / 0.55) * 0.6);
              const by = -R * sc * (u < 0.45 ? (u / 0.45) * 0.62 : 0.62 - ((u - 0.45) / 0.55) * 0.22);
              let len = R * sc * (row ? 0.26 + 0.12 * u : 0.42 + 0.4 * u);
              if (style === 'flame') len *= 0.85 + 0.25 * Math.sin(t * 7 + f * 2 + j + row);
              ctx.save();
              ctx.translate(bx, by);
              // Hanging down near the body, sweeping outwards at the tip.
              ctx.rotate(1.45 - u * 1.25);
              const g = ctx.createLinearGradient(0, 0, len, 0);
              g.addColorStop(0, L.c[0]);
              g.addColorStop(1, row ? L.c[0] : L.c[1]);
              ctx.fillStyle = g;
              ctx.globalAlpha *= style === 'flame' ? 0.42 : 0.94;
              if (style === 'blade') {
                ctx.beginPath();
                ctx.moveTo(0, -len * 0.05);
                ctx.lineTo(len, 0);
                ctx.lineTo(0, len * 0.05);
                ctx.closePath();
              } else leaf(ctx, len, len * (row ? 0.17 : 0.12), 0.45);
              ctx.fill();
              if (style === 'feather') {
                ctx.strokeStyle = 'rgb(0 0 0 / 0.2)';
                ctx.lineWidth = Math.max(0.6, R * 0.007);
                ctx.stroke();
              }
              ctx.restore();
            }
          }
          ctx.restore();
        }
      }
      return;
    }
    case 'halo': {
      if (back) return;
      const r = R * (L.r ?? 0.34);
      ctx.translate(0, -R * (L.y ?? 1.0) + Math.sin(t * 1.4) * R * 0.02);
      ctx.strokeStyle = L.c;
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineWidth = R * 0.09;
      ctx.globalAlpha *= 0.25;
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.3, 0, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha *= 4;
      ctx.lineWidth = R * 0.035;
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = R * 0.012;
      ctx.stroke();
      return;
    }
    case 'mandala': {
      if (!back) return;
      ctx.globalCompositeOperation = 'lighter';
      const spin = L.spin ?? 0.1;
      for (let j = 0; j < 3; j++) {
        const rr = R * L.r * (0.46 + 0.27 * j);
        const col = L.c[j % L.c.length];
        ctx.save();
        ctx.rotate(t * spin * (j % 2 ? -1.6 : 1) + j);
        ctx.strokeStyle = col;
        ctx.fillStyle = col;
        ctx.lineWidth = Math.max(1, R * 0.012);
        ctx.beginPath();
        ctx.arc(0, 0, rr, 0, TAU);
        ctx.stroke();
        const n = L.n * (j + 1);
        for (let i = 0; i < n; i++) {
          ctx.save();
          ctx.rotate((i * TAU) / n);
          if (L.square) {
            ctx.translate(rr * 0.86, 0);
            ctx.rotate(Math.PI / 4);
            ctx.beginPath();
            ctx.rect(-rr * 0.07, -rr * 0.07, rr * 0.14, rr * 0.14);
          } else {
            ctx.translate(rr * 0.72, 0);
            leaf(ctx, rr * 0.28, rr * (0.5 / n) * 2.4);
          }
          ctx.globalAlpha = 0.16;
          ctx.fill();
          ctx.globalAlpha = 0.85;
          ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      }
      // A star through every other point, in the middle.
      ctx.rotate(-t * spin * 2);
      ctx.strokeStyle = L.c[0];
      ctx.lineWidth = Math.max(1, R * 0.01);
      ctx.globalAlpha = 0.7;
      const m = Math.max(5, L.n);
      ctx.beginPath();
      for (let i = 0; i <= m; i++) {
        const a = (i * 2 * TAU) / m;
        ctx.lineTo(Math.cos(a) * R * L.r * 0.4, Math.sin(a) * R * L.r * 0.4);
      }
      ctx.stroke();
      return;
    }
    case 'runes': {
      if (!back) return;
      const r = R * (L.r ?? 1.1);
      ctx.translate(0, R * (L.y ?? 0.85));
      ctx.scale(1, 0.3);
      ctx.rotate(t * 0.3);
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = L.c;
      ctx.fillStyle = L.c;
      for (const [rr, w] of [[r, 0.02], [r * 0.8, 0.012], [r * 0.3, 0.012]]) {
        ctx.lineWidth = R * w;
        ctx.beginPath();
        ctx.arc(0, 0, rr, 0, TAU);
        ctx.stroke();
      }
      ctx.lineWidth = R * 0.012;
      for (let k = 0; k < 2; k++) {
        ctx.beginPath();
        for (let i = 0; i <= 3; i++) ctx.lineTo(Math.cos((i * TAU) / 3 + k * Math.PI) * r * 0.8, Math.sin((i * TAU) / 3 + k * Math.PI) * r * 0.8);
        ctx.stroke();
      }
      const n = 16;
      ctx.font = `700 ${Math.round(r * 0.14)}px "RocknRoll One", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = 0; i < n; i++) {
        ctx.save();
        ctx.rotate((i * TAU) / n);
        ctx.translate(0, -r * 0.9);
        ctx.fillText(L.glyphs[i % L.glyphs.length], 0, 0);
        ctx.restore();
      }
      return;
    }
    case 'pillar': {
      if (!back) return;
      const w = R * (L.w ?? 0.5);
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(-w, 0, w, 0);
      g.addColorStop(0, 'transparent');
      g.addColorStop(0.35, L.c);
      g.addColorStop(0.5, '#ffffff');
      g.addColorStop(0.65, L.c);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.globalAlpha *= 0.2 + 0.05 * Math.sin(t * 3);
      ctx.fillRect(-w, -R * 2.4, w * 2, R * 3.4);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1, R * 0.01);
      for (let i = 0; i < 8; i++) {
        const p = frac(t * (0.5 + hash(i, 1)) + hash(i, 2));
        const x = (hash(i, 3) - 0.5) * w * 1.3;
        ctx.globalAlpha = Math.sin(Math.PI * p) * 0.7;
        ctx.beginPath();
        ctx.moveTo(x, R * (1 - 3 * p));
        ctx.lineTo(x, R * (1 - 3 * p) - R * 0.3);
        ctx.stroke();
      }
      return;
    }
    case 'shards': {
      for (let i = 0; i < L.n; i++) {
        const ang = TAU * (hash(i, 1) + t * (L.speed ?? 0.08) * (0.5 + hash(i, 3)));
        const front = Math.sin(ang) > 0;
        if (front === back) continue;
        const rr = R * ((L.rmin ?? 0.85) + ((L.rmax ?? 1.25) - (L.rmin ?? 0.85)) * hash(i, 2));
        const s = R * (L.size ?? 0.1) * (0.6 + 0.8 * hash(i, 4));
        const col = L.c[i % L.c.length];
        ctx.save();
        ctx.translate(Math.cos(ang) * rr, Math.sin(ang) * rr * 0.36 + (hash(i, 5) - 0.5) * R * 0.9);
        ctx.rotate(Math.sin(t * 0.8 + i) * 0.4 + (hash(i, 6) - 0.5));
        ctx.globalAlpha = front ? 0.95 : 0.6;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(0, -s * 1.7);
        ctx.lineTo(s * 0.55, -s * 0.2);
        ctx.lineTo(0, s * 1.1);
        ctx.lineTo(-s * 0.55, -s * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgb(255 255 255 / 0.5)';
        ctx.beginPath();
        ctx.moveTo(0, -s * 1.7);
        ctx.lineTo(s * 0.55, -s * 0.2);
        ctx.lineTo(0, s * 1.1);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      return;
    }
    case 'spiral': {
      ctx.globalCompositeOperation = 'lighter';
      if (back) {
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R * L.r * 0.5);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.3, L.c[0]);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, R * L.r * 0.5, R * L.r * 0.22, 0, 0, TAU);
        ctx.fill();
      }
      for (let i = 0; i < L.n; i++) {
        const u = hash(i, 1);
        const ang = ((i % L.arms) * TAU) / L.arms + u * 5.2 + t * L.spin + (hash(i, 2) - 0.5) * 0.5;
        if (Math.sin(ang) > 0 === back) continue;
        const rad = R * L.r * (0.06 + 0.94 * u);
        ctx.fillStyle = L.c[i % L.c.length];
        ctx.globalAlpha = (0.35 + 0.65 * hash(i, 3)) * (0.7 + 0.3 * Math.sin(t * 3 + i));
        ctx.beginPath();
        ctx.arc(Math.cos(ang) * rad, Math.sin(ang) * rad * 0.42, Math.max(0.6, R * 0.012 * (0.5 + 1.5 * hash(i, 4))), 0, TAU);
        ctx.fill();
      }
      return;
    }
    case 'planet': {
      if (!back) return;
      ctx.translate(L.x * R, L.y * R);
      const r = R * L.r;
      if (L.ring) {
        ctx.strokeStyle = L.ring;
        ctx.lineWidth = r * 0.16;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.8, r * 0.45, -0.35, Math.PI, TAU);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      const g = ctx.createRadialGradient(-r * 0.4, -r * 0.4, r * 0.1, 0, 0, r);
      g.addColorStop(0, L.c[0]);
      g.addColorStop(1, L.c[1]);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TAU);
      ctx.fill();
      if (L.ring) {
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.8, r * 0.45, -0.35, 0, Math.PI);
        ctx.stroke();
      }
      return;
    }
    case 'comets': {
      if (!back) return;
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      for (let i = 0; i < L.n; i++) {
        const p = frac(t * 0.22 * (0.5 + hash(i, 3)) + hash(i, 2));
        const x = R * (1.7 - 3.4 * p);
        const y = R * (-1.6 + 2.4 * p + (hash(i, 1) - 0.5) * 1.6);
        const len = R * (0.4 + 0.5 * hash(i, 4));
        const g = ctx.createLinearGradient(x, y, x + len, y - len * 0.7);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.2, L.c);
        g.addColorStop(1, 'transparent');
        ctx.strokeStyle = g;
        ctx.lineWidth = R * 0.03;
        ctx.globalAlpha = Math.sin(Math.PI * p);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + len, y - len * 0.7);
        ctx.stroke();
      }
      return;
    }
    case 'arcs': {
      const K = Math.floor(t * 14);
      const r = R * (L.r ?? 1.05);
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineJoin = 'round';
      const at = (i: number) => {
        const a = (i * TAU) / L.n + t * 0.5;
        return [Math.cos(a) * r, Math.sin(a) * r * 0.36, Math.sin(a)] as const;
      };
      for (let i = 0; i < L.n; i++) {
        const [x0, y0, z0] = at(i);
        const [x1, y1, z1] = at(i + 1);
        if (z0 + z1 > 0 === back) continue;
        if (hash(K, i) < 0.35) continue;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        for (let s = 1; s < 6; s++) ctx.lineTo(x0 + ((x1 - x0) * s) / 6 + (hash(K * 7 + i, s) - 0.5) * R * 0.2, y0 + ((y1 - y0) * s) / 6 + (hash(K * 5 + i, s + 9) - 0.5) * R * 0.2);
        ctx.lineTo(x1, y1);
        ctx.strokeStyle = L.c;
        ctx.lineWidth = R * 0.035;
        ctx.globalAlpha = 0.45;
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = R * 0.012;
        ctx.globalAlpha = 1;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x0, y0, R * 0.035, 0, TAU);
        ctx.fill();
      }
      return;
    }
    case 'fireworks': {
      if (!back) return;
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      for (let j = 0; j < 3; j++) {
        const T = t * L.rate + j / 3;
        const K = Math.floor(T);
        const p = frac(T);
        const cx = (hash(K * 3 + j, 1) - 0.5) * R * 2.3;
        const cy = -R * (0.3 + 1.0 * hash(K * 3 + j, 2));
        const col = L.c[(K + j) % L.c.length];
        const reach = R * 0.62 * (1 - (1 - p) ** 3);
        for (let i = 0; i < 28; i++) {
          const a = (i * TAU) / 28 + hash(K, j);
          const rr = reach * (0.75 + 0.25 * hash(i, K));
          const x = cx + Math.cos(a) * rr;
          const y = cy + Math.sin(a) * rr + p * p * R * 0.22;
          ctx.strokeStyle = i % 4 ? col : '#ffffff';
          ctx.lineWidth = Math.max(1, R * 0.014);
          ctx.globalAlpha = (1 - p) ** 1.5;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - Math.cos(a) * rr * 0.22, y - Math.sin(a) * rr * 0.22);
          ctx.stroke();
        }
      }
      return;
    }
    case 'scape': {
      if (!back) return;
      const c2 = L.c2 ?? '#ffffff';
      ctx.fillStyle = L.c;
      if (L.kind === 'fuji') {
        ctx.beginPath();
        ctx.moveTo(-R * 1.7, R * 1.15);
        ctx.quadraticCurveTo(-R * 0.6, R * 0.3, -R * 0.22, -R * 0.42);
        ctx.lineTo(R * 0.22, -R * 0.42);
        ctx.quadraticCurveTo(R * 0.6, R * 0.3, R * 1.7, R * 1.15);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = c2;
        ctx.beginPath();
        ctx.moveTo(-R * 0.22, -R * 0.42);
        ctx.lineTo(R * 0.22, -R * 0.42);
        ctx.lineTo(R * 0.42, -R * 0.05);
        ctx.lineTo(R * 0.25, -R * 0.16);
        ctx.lineTo(R * 0.1, 0);
        ctx.lineTo(-R * 0.05, -R * 0.15);
        ctx.lineTo(-R * 0.22, -R * 0.02);
        ctx.lineTo(-R * 0.42, -R * 0.05);
        ctx.closePath();
        ctx.fill();
      } else if (L.kind === 'pagoda') {
        for (let k = 0; k < 5; k++) {
          const w = R * (0.95 - 0.14 * k);
          const y = R * (1.0 - 0.38 * k);
          ctx.fillRect(-w * 0.55, y - R * 0.3, w * 1.1, R * 0.3);
          ctx.beginPath();
          ctx.moveTo(-w * 1.05, y - R * 0.34);
          ctx.quadraticCurveTo(-w * 0.6, y - R * 0.3, -w * 0.45, y - R * 0.46);
          ctx.lineTo(w * 0.45, y - R * 0.46);
          ctx.quadraticCurveTo(w * 0.6, y - R * 0.3, w * 1.05, y - R * 0.34);
          ctx.lineTo(w * 0.9, y - R * 0.24);
          ctx.lineTo(-w * 0.9, y - R * 0.24);
          ctx.closePath();
          ctx.fill();
        }
        ctx.fillRect(-R * 0.02, -R * 1.45, R * 0.04, R * 0.6);
        ctx.fillStyle = c2;
        for (let k = 0; k < 5; k++) ctx.fillRect(-R * 0.06, R * (0.82 - 0.38 * k), R * 0.12, R * 0.1);
      } else if (L.kind === 'bamboo') {
        for (let i = 0; i < 8; i++) {
          const x = (hash(i, 1) - 0.5) * R * 2.6;
          const lean = (hash(i, 2) - 0.5) * 0.12 + Math.sin(t * 0.8 + i) * 0.015;
          const w = R * (0.05 + 0.04 * hash(i, 3));
          ctx.save();
          ctx.translate(x, R * 1.15);
          ctx.rotate(lean);
          ctx.fillStyle = L.c;
          ctx.globalAlpha = 0.55 + 0.4 * hash(i, 4);
          for (let s = 0; s < 8; s++) ctx.fillRect(-w / 2, -R * 0.34 * (s + 1) + R * 0.015, w, R * 0.325);
          ctx.fillStyle = c2;
          for (let s = 2; s < 8; s += 2) {
            ctx.save();
            ctx.translate(0, -R * 0.34 * s);
            ctx.rotate((s % 4 ? 1 : -1) * 0.5 - Math.PI / 2 + Math.PI / 2);
            leaf(ctx, R * 0.3 * (s % 4 ? 1 : -1), R * 0.035);
            ctx.fill();
            ctx.restore();
          }
          ctx.restore();
        }
      } else if (L.kind === 'city') {
        for (let i = 0; i < 16; i++) {
          const x = -R * 1.6 + i * R * 0.2;
          const hgt = R * (0.35 + 0.9 * hash(i, 1));
          ctx.fillStyle = L.c;
          ctx.fillRect(x, R * 1.15 - hgt, R * 0.19, hgt);
          ctx.fillStyle = c2;
          for (let wy = 0; wy < hgt / (R * 0.11) - 1; wy++) {
            for (let wx = 0; wx < 2; wx++) {
              if (hash(i * 31 + wy, wx + Math.floor(t * 0.4 + hash(i, wy))) < 0.45) continue;
              ctx.fillRect(x + R * 0.035 + wx * R * 0.08, R * 1.15 - hgt + R * 0.05 + wy * R * 0.11, R * 0.045, R * 0.055);
            }
          }
        }
      } else if (L.kind === 'bigwave') {
        const sway = Math.sin(t * 0.9) * R * 0.04;
        const sea = ctx.createLinearGradient(-R * 1.7, 0, R * 1.7, 0);
        sea.addColorStop(0, 'transparent');
        sea.addColorStop(0.12, L.c);
        sea.addColorStop(0.7, L.c);
        sea.addColorStop(1, 'transparent');
        ctx.fillStyle = sea;
        ctx.beginPath();
        ctx.moveTo(-R * 1.7, R * 1.2);
        ctx.lineTo(-R * 1.7, R * 0.2);
        ctx.bezierCurveTo(-R * 1.3, -R * 1.2 + sway, -R * 0.1, -R * 1.25 + sway, R * 0.25, -R * 0.55 + sway);
        ctx.bezierCurveTo(-R * 0.1, -R * 0.8, -R * 0.75, -R * 0.55, -R * 0.55, R * 0.2);
        ctx.bezierCurveTo(-R * 0.3, R * 0.75, R * 0.8, R * 0.55, R * 1.7, R * 0.85);
        ctx.lineTo(R * 1.7, R * 1.2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = c2;
        for (let i = 0; i < 16; i++) {
          const u = i / 15;
          const x = -R * 1.25 + u * R * 1.55;
          const y = -R * 1.02 + Math.abs(u - 0.55) * R * 0.75 + sway;
          ctx.beginPath();
          ctx.arc(x, y + Math.sin(t * 2 + i) * R * 0.015, R * (0.05 + 0.04 * hash(i, 1)), 0, TAU);
          ctx.fill();
        }
      } else if (L.kind === 'tree') {
        ctx.translate(0, R * 1.15);
        branch(ctx, R * 0.62, 7, t, 3, L.c, c2);
      } else {
        for (let k = 4; k >= 0; k--) {
          ctx.save();
          const s = R * (0.34 + 0.2 * k);
          ctx.translate(0, R * 0.25 + k * R * 0.05);
          ctx.globalAlpha = 0.35 + 0.16 * k;
          toriiAt(ctx, s, L.c);
          ctx.restore();
        }
      }
      return;
    }
    case 'strings': {
      for (let i = 0; i < L.n; i++) {
        if ((i % 2 === 0) === back) continue;
        const x0 = (hash(i, 1) - 0.5) * R * 2.6;
        const len = R * (0.9 + 1.0 * hash(i, 2));
        const col = L.c[i % L.c.length];
        const beads = Math.floor(len / (R * 0.1));
        ctx.fillStyle = col;
        for (let b = 0; b < beads; b++) {
          const u = b / beads;
          const x = x0 + Math.sin(t * 1.1 + i + u * 2.5) * R * 0.1 * u;
          ctx.globalAlpha = 0.9 - 0.5 * u;
          ctx.beginPath();
          ctx.arc(x, -R * 1.55 + u * len, R * 0.045 * (1 - u * 0.6), 0, TAU);
          ctx.fill();
        }
      }
      return;
    }
    case 'eye': {
      if (!back) return;
      ctx.translate(0, -R * 0.15);
      const blink = frac(t * 0.17);
      const open = blink > 0.94 ? Math.abs(blink - 0.97) / 0.03 : 1;
      const almond = () => {
        ctx.beginPath();
        ctx.moveTo(-R * 1.35, 0);
        ctx.quadraticCurveTo(0, -R * 0.95 * open, R * 1.35, 0);
        ctx.quadraticCurveTo(0, R * 0.95 * open, -R * 1.35, 0);
      };
      almond();
      ctx.fillStyle = '#08040f';
      ctx.fill();
      ctx.save();
      almond();
      ctx.clip();
      const lookX = Math.sin(t * 0.5) * R * 0.18;
      const g = ctx.createRadialGradient(lookX, 0, R * 0.08, lookX, 0, R * 0.5);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.25, L.c);
      g.addColorStop(1, '#08040f');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(lookX, 0, R * 0.5, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = L.c;
      ctx.lineWidth = R * 0.008;
      for (let i = 0; i < 36; i++) {
        const a = (i * TAU) / 36;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(lookX + Math.cos(a) * R * 0.16, Math.sin(a) * R * 0.16);
        ctx.lineTo(lookX + Math.cos(a) * R * 0.46, Math.sin(a) * R * 0.46);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(lookX, 0, R * 0.07, R * 0.3, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
      almond();
      ctx.strokeStyle = L.c;
      ctx.lineWidth = R * 0.03;
      ctx.stroke();
      return;
    }
    case 'smoke': {
      for (let i = 0; i < L.n; i++) {
        if ((i % 3 === 0) === back) continue;
        const p = frac(t * 0.1 * (0.5 + hash(i, 3)) + hash(i, 2));
        const x = (hash(i, 1) - 0.5) * R * 2 + Math.sin(t * 0.6 + i + p * 4) * R * 0.25;
        const y = R * (1 - 2.3 * p);
        const r = R * (0.25 + 0.5 * p);
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, L.c);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.globalAlpha = Math.sin(Math.PI * p) * 0.3;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TAU);
        ctx.fill();
      }
      return;
    }
    case 'flames': {
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < L.n; i++) {
        if (L.ring ? !back : (i % 4 === 0) === back) continue;
        const flick = 0.55 + 0.25 * Math.sin(t * 6 + i * 2.1) + 0.2 * Math.sin(t * 11 + i * 0.7);
        const hgt = R * (L.h ?? 0.9) * flick * (0.6 + 0.6 * hash(i, 2));
        ctx.save();
        if (L.ring) {
          ctx.rotate((i * TAU) / L.n + Math.sin(t + i) * 0.05);
          ctx.translate(R * 0.72, 0);
        } else {
          ctx.translate((i / (L.n - 1) - 0.5) * R * 2.3 + Math.sin(t * 2 + i) * R * 0.03, R * 1.05);
          ctx.rotate(-Math.PI / 2 + Math.sin(t * 3 + i) * 0.12);
        }
        L.c.forEach((col, k) => {
          ctx.fillStyle = col;
          ctx.globalAlpha = 0.5;
          const s = 1 - k * 0.3;
          leaf(ctx, hgt * s, R * 0.16 * s, 0.3);
          ctx.fill();
        });
        ctx.restore();
      }
      return;
    }
    case 'clock': {
      if (!back) return;
      const r = R * (L.r ?? 1.3);
      const dir = L.rev ? -1 : 1;
      ctx.strokeStyle = L.c;
      ctx.fillStyle = L.c;
      ctx.lineCap = 'round';
      ctx.lineWidth = R * 0.02;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.93, 0, TAU);
      ctx.lineWidth = R * 0.008;
      ctx.stroke();
      for (let i = 0; i < 60; i++) {
        const a = (i * TAU) / 60;
        const inner = i % 5 ? 0.88 : 0.8;
        ctx.lineWidth = R * (i % 5 ? 0.008 : 0.022);
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * inner, Math.sin(a) * r * inner);
        ctx.lineTo(Math.cos(a) * r * 0.93, Math.sin(a) * r * 0.93);
        ctx.stroke();
      }
      for (const [len, speed, w] of [[0.55, 0.05, 0.035], [0.78, 0.6, 0.022], [0.86, 7, 0.01]]) {
        const a = dir * t * speed - Math.PI / 2;
        ctx.lineWidth = R * w;
        ctx.beginPath();
        ctx.moveTo(-Math.cos(a) * r * 0.1, -Math.sin(a) * r * 0.1);
        ctx.lineTo(Math.cos(a) * r * len, Math.sin(a) * r * len);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.05, 0, TAU);
      ctx.fill();
      return;
    }
    case 'grid': {
      if (!back) return;
      const hz = R * 0.45;
      const depth = R * 0.95;
      const rows = 8;
      const scroll = frac(t * 0.5);
      const yAt = (k: number) => hz + depth * ((k + scroll) / rows) ** 2;
      const xAt = (i: number, y: number) => i * R * 0.07 + (i * R * 0.45 * (y - hz)) / depth;
      if (L.checker) {
        ctx.fillStyle = L.checker;
        for (let k = 0; k < rows; k++) {
          const y0 = yAt(k);
          const y1 = yAt(k + 1);
          for (let i = -6; i < 6; i++) {
            if ((i + k + Math.floor(t * 0.5)) % 2 === 0) continue;
            ctx.globalAlpha = 0.5 * Math.min(1, (y0 - hz) / (depth * 0.3) + 0.1);
            ctx.beginPath();
            ctx.moveTo(xAt(i, y0), y0);
            ctx.lineTo(xAt(i + 1, y0), y0);
            ctx.lineTo(xAt(i + 1, y1), y1);
            ctx.lineTo(xAt(i, y1), y1);
            ctx.closePath();
            ctx.fill();
          }
        }
      }
      ctx.strokeStyle = L.c;
      ctx.lineWidth = Math.max(1, R * 0.01);
      ctx.globalAlpha = 0.75;
      for (let i = -6; i <= 6; i++) {
        ctx.beginPath();
        ctx.moveTo(xAt(i, hz), hz);
        ctx.lineTo(xAt(i, hz + depth), hz + depth);
        ctx.stroke();
      }
      for (let k = 0; k < rows; k++) {
        const y = yAt(k);
        ctx.globalAlpha = 0.75 * Math.min(1, (y - hz) / (depth * 0.25) + 0.08);
        ctx.beginPath();
        ctx.moveTo(xAt(-6, y), y);
        ctx.lineTo(xAt(6, y), y);
        ctx.stroke();
      }
      return;
    }
    case 'hex': {
      if (!back) return;
      const r = R * (L.r ?? 1.2);
      const s = R * 0.15;
      const K = Math.floor(t * 4);
      ctx.strokeStyle = L.c;
      ctx.fillStyle = L.c;
      ctx.lineWidth = Math.max(1, R * 0.009);
      for (let row = -9; row <= 9; row++) {
        for (let col = -8; col <= 8; col++) {
          const x = col * s * 1.732 + (row % 2 ? s * 0.866 : 0);
          const y = row * s * 1.5;
          const d = Math.hypot(x, y) / r;
          if (d > 1) continue;
          // Squeezed towards the rim, like the far side of a ball.
          const k = 0.75 + 0.25 * Math.sqrt(1 - d * d * 0.8);
          ctx.beginPath();
          for (let v = 0; v < 6; v++) ctx.lineTo(x * k + Math.cos((v * TAU) / 6 + Math.PI / 6) * s * 0.92 * k, y * k + Math.sin((v * TAU) / 6 + Math.PI / 6) * s * 0.92 * k);
          ctx.closePath();
          const lit = hash(row * 31 + col, K);
          ctx.globalAlpha = 0.25 + 0.5 * d;
          ctx.stroke();
          if (lit > 0.86) {
            ctx.globalAlpha = 0.35 * (1 - frac(t * 4));
            ctx.fill();
          }
        }
      }
      return;
    }
    case 'stars': {
      if (!back) return;
      const r = R * (L.r ?? 1.4);
      ctx.rotate(t * 0.03);
      const pts: [number, number][] = [];
      for (let i = 0; i < L.n; i++) pts.push([(hash(i + L.seed, 1) - 0.5) * 2 * r, (hash(i + L.seed, 2) - 0.5) * 2 * r * 0.9]);
      ctx.strokeStyle = L.c;
      ctx.lineWidth = Math.max(0.8, R * 0.007);
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      // Join a star to the next only when they are neighbours.
      pts.forEach(([x, y], i) => (i === 0 || Math.hypot(x - pts[i - 1][0], y - pts[i - 1][1]) > r * 0.7 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      pts.forEach(([x, y], i) => {
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 2.2 + i * 1.9);
        ctx.save();
        ctx.translate(x, y);
        poly(ctx, 4, R * (0.03 + 0.03 * hash(i, 5)), R * 0.009);
        ctx.fill();
        ctx.restore();
      });
      return;
    }
    case 'ripples': {
      if (!back) return;
      const n = L.n ?? 3;
      ctx.strokeStyle = L.c;
      for (let k = 0; k < n; k++) {
        const p = frac(t * 0.35 + k / n);
        ctx.globalAlpha = (1 - p) * 0.85;
        ctx.lineWidth = R * 0.022 * (1 - p) + 0.6;
        ctx.beginPath();
        ctx.ellipse(0, R * 0.92, R * 1.5 * p, R * 0.4 * p, 0, 0, TAU);
        ctx.stroke();
      }
      return;
    }
    case 'ribbons': {
      ctx.lineCap = 'round';
      const N = 44;
      for (let j = 0; j < L.n; j++) {
        ctx.strokeStyle = L.c[j % L.c.length];
        let px = 0;
        let py = 0;
        for (let i = 0; i <= N; i++) {
          const u = i / N;
          const ang = u * TAU * 1.4 + t * 0.7 + (j * TAU) / L.n;
          const x = Math.cos(ang) * R * (0.75 + 0.3 * Math.sin(u * 5 + t * 0.9 + j));
          const y = (u - 0.5) * R * 2.3 + Math.sin(ang) * R * 0.16;
          if (i && Math.sin(ang) > 0 !== back) {
            ctx.globalAlpha = (back ? 0.55 : 0.9) * Math.sin(Math.PI * u) ** 0.5;
            ctx.lineWidth = R * (L.w ?? 0.07) * Math.sin(Math.PI * u) + 0.5;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(x, y);
            ctx.stroke();
          }
          px = x;
          py = y;
        }
      }
      return;
    }
    case 'yinyang': {
      if (!back) return;
      const r = R * L.r;
      ctx.rotate(t * 0.5);
      ctx.fillStyle = L.c[0];
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TAU);
      ctx.fill();
      ctx.fillStyle = L.c[1];
      ctx.beginPath();
      ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2);
      ctx.arc(0, r / 2, r / 2, Math.PI / 2, -Math.PI / 2, true);
      ctx.arc(0, -r / 2, r / 2, Math.PI / 2, -Math.PI / 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -r / 2, r * 0.14, 0, TAU);
      ctx.fill();
      ctx.fillStyle = L.c[0];
      ctx.beginPath();
      ctx.arc(0, r / 2, r * 0.14, 0, TAU);
      ctx.fill();
      return;
    }
    case 'lotus': {
      if (!back) return;
      ctx.translate(0, R * 0.95);
      for (let row = 0; row < 2; row++) {
        const n = row ? 7 : 11;
        const len = R * (row ? 0.75 : 1.05) * (1 + 0.03 * Math.sin(t * 1.5));
        for (let i = 0; i < n; i++) {
          const ang = -Math.PI * (0.06 + (0.88 * i) / (n - 1));
          ctx.save();
          ctx.rotate(ang);
          const g = ctx.createLinearGradient(0, 0, len, 0);
          g.addColorStop(0, L.c[1]);
          g.addColorStop(1, L.c[0]);
          ctx.fillStyle = g;
          ctx.globalAlpha = 0.9;
          leaf(ctx, len, len * 0.2, 0.6);
          ctx.fill();
          ctx.strokeStyle = 'rgb(255 255 255 / 0.5)';
          ctx.lineWidth = Math.max(0.8, R * 0.008);
          ctx.stroke();
          ctx.restore();
        }
      }
      return;
    }
    case 'bars': {
      if (!back) return;
      ctx.lineCap = 'round';
      ctx.lineWidth = Math.max(1.5, (R * 5.4) / L.n);
      for (let i = 0; i < L.n; i++) {
        const a = (i * TAU) / L.n - Math.PI / 2;
        const len = R * (0.08 + 0.4 * Math.abs(Math.sin(t * 3.1 + i * 0.7) * Math.sin(t * 1.3 + i * 1.9)));
        ctx.strokeStyle = L.c[i % L.c.length];
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * R * 1.05, Math.sin(a) * R * 1.05);
        ctx.lineTo(Math.cos(a) * (R * 1.05 + len), Math.sin(a) * (R * 1.05 + len));
        ctx.stroke();
      }
      return;
    }
    case 'atom': {
      for (let j = 0; j < 3; j++) {
        const roll = (j * Math.PI) / 3;
        ctx.save();
        ctx.rotate(roll);
        ctx.strokeStyle = L.c;
        ctx.lineWidth = Math.max(1, R * 0.014);
        ctx.globalAlpha = back ? 0.5 : 0.95;
        ctx.beginPath();
        ctx.ellipse(0, 0, R * 1.2, R * 0.42, 0, back ? Math.PI : 0, back ? TAU : Math.PI);
        ctx.stroke();
        const ph = t * 2.2 + j * 2.1;
        if (Math.sin(ph) > 0 !== back) {
          ctx.fillStyle = L.e;
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.arc(Math.cos(ph) * R * 1.2, Math.sin(ph) * R * 0.42, R * 0.06, 0, TAU);
          ctx.fill();
        }
        ctx.restore();
      }
      return;
    }
    case 'tesseract': {
      if (!back) return;
      ctx.globalCompositeOperation = 'lighter';
      const a = t * 0.5;
      const b = t * 0.31;
      const pts: [number, number, number][] = [];
      for (let v = 0; v < 16; v++) {
        let x = v & 1 ? 1 : -1;
        let y = v & 2 ? 1 : -1;
        let z = v & 4 ? 1 : -1;
        let w = v & 8 ? 1 : -1;
        [x, w] = [x * Math.cos(a) - w * Math.sin(a), x * Math.sin(a) + w * Math.cos(a)];
        [y, z] = [y * Math.cos(b) - z * Math.sin(b), y * Math.sin(b) + z * Math.cos(b)];
        [x, z] = [x * Math.cos(b * 0.7) - z * Math.sin(b * 0.7), x * Math.sin(b * 0.7) + z * Math.cos(b * 0.7)];
        const f4 = 1 / (2.4 - w);
        const f3 = 1 / (3.2 - z * f4);
        pts.push([x * f4 * f3 * R * 4.4, y * f4 * f3 * R * 4.4, f4]);
      }
      ctx.strokeStyle = L.c;
      ctx.lineCap = 'round';
      for (let v = 0; v < 16; v++) {
        for (let bit = 1; bit < 16; bit <<= 1) {
          if (v & bit) continue;
          const p = pts[v];
          const q = pts[v | bit];
          ctx.lineWidth = R * 0.03 * (p[2] + q[2]);
          ctx.globalAlpha = 0.35 + 0.5 * (p[2] + q[2]);
          ctx.beginPath();
          ctx.moveTo(p[0], p[1]);
          ctx.lineTo(q[0], q[1]);
          ctx.stroke();
        }
      }
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 1;
      for (const p of pts) {
        ctx.beginPath();
        ctx.arc(p[0], p[1], R * 0.05 * p[2] * 2, 0, TAU);
        ctx.fill();
      }
      return;
    }
    case 'dna': {
      const N = 30;
      for (let i = 0; i < N; i++) {
        const u = i / (N - 1);
        const y = (u - 0.5) * R * 2.5;
        const ph = u * TAU * 2 + t * 1.4;
        if (back && i % 2 === 0) {
          ctx.strokeStyle = 'rgb(255 255 255 / 0.3)';
          ctx.lineWidth = Math.max(1, R * 0.012);
          ctx.beginPath();
          ctx.moveTo(Math.cos(ph) * R * 0.9, y);
          ctx.lineTo(-Math.cos(ph) * R * 0.9, y);
          ctx.stroke();
        }
        for (let s = 0; s < 2; s++) {
          const z = Math.sin(ph + s * Math.PI);
          if (z > 0 === back) continue;
          ctx.fillStyle = L.c[s];
          ctx.globalAlpha = back ? 0.6 : 1;
          ctx.beginPath();
          ctx.arc(Math.cos(ph + s * Math.PI) * R * 0.9, y, R * (0.05 + 0.025 * z), 0, TAU);
          ctx.fill();
        }
      }
      return;
    }
    case 'lissajous': {
      if (!back) return;
      ctx.globalCompositeOperation = 'lighter';
      L.c.forEach((col, j) => {
        ctx.strokeStyle = col;
        ctx.lineWidth = Math.max(1, R * 0.012);
        ctx.globalAlpha = 0.75;
        ctx.beginPath();
        for (let i = 0; i <= 260; i++) {
          const s = (i / 260) * TAU;
          ctx.lineTo(Math.sin(L.a * s + t * 0.35 + j * 0.35) * R * 1.3 * (1 - j * 0.08), Math.sin(L.b * s + j * 0.2) * R * 1.15 * (1 - j * 0.08));
        }
        ctx.stroke();
      });
      return;
    }
    case 'sun': {
      if (!back) return;
      const r = R * L.r;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 2.1);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.3, L.c[0]);
      g.addColorStop(0.6, L.c[1]);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, r * 2.1, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = L.c[0];
      ctx.lineWidth = r * 0.06;
      for (let i = 0; i < 6; i++) {
        const a = (i * TAU) / 6 + t * 0.15;
        const lift = r * (0.25 + 0.2 * Math.sin(t * 1.3 + i * 2));
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a - 0.22) * r, Math.sin(a - 0.22) * r);
        ctx.quadraticCurveTo(Math.cos(a) * (r + lift * 2), Math.sin(a) * (r + lift * 2), Math.cos(a + 0.22) * r, Math.sin(a + 0.22) * r);
        ctx.stroke();
      }
      ctx.restore();
      const d = ctx.createRadialGradient(-r * 0.2, -r * 0.2, 0, 0, 0, r);
      d.addColorStop(0, '#ffffff');
      d.addColorStop(0.5, L.c[0]);
      d.addColorStop(1, L.c[1]);
      ctx.fillStyle = d;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgb(0 0 0 / 0.16)';
      for (let i = 0; i < 7; i++) {
        const a = hash(i, 1) * TAU + t * 0.12;
        const rr = r * 0.75 * hash(i, 2);
        ctx.beginPath();
        ctx.arc(Math.cos(a) * rr, Math.sin(a) * rr * 0.9, r * (0.05 + 0.08 * hash(i, 3)), 0, TAU);
        ctx.fill();
      }
      return;
    }
    case 'nova': {
      if (!back) return;
      ctx.globalCompositeOperation = 'lighter';
      L.c.forEach((col, k) => {
        const p = frac(t * 0.2 + k / L.c.length);
        ctx.strokeStyle = col;
        ctx.lineWidth = R * 0.14 * (1 - p) + 1;
        ctx.globalAlpha = (1 - p) ** 1.3;
        ctx.beginPath();
        ctx.arc(0, 0, R * 1.9 * p, 0, TAU);
        ctx.stroke();
      });
      const beat = 0.75 + 0.25 * Math.sin(t * 5);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.7 * beat);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.4, L.c[0]);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.7 * beat, 0, TAU);
      ctx.fill();
      return;
    }
    case 'portal': {
      if (!back) return;
      const r = R * (L.r ?? 1.2);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      g.addColorStop(0, '#000000');
      g.addColorStop(0.75, '#05030a');
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TAU);
      ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      for (let k = 0; k < 7; k++) {
        const rr = r * (1 - k * 0.13);
        ctx.strokeStyle = L.c[k % L.c.length];
        ctx.lineWidth = R * 0.045 * (1 - k * 0.1);
        ctx.setLineDash([rr * (0.5 + 0.3 * hash(k, 1)), rr * (0.25 + 0.3 * hash(k, 2))]);
        ctx.lineDashOffset = t * rr * (0.5 + k * 0.35) * (k % 2 ? -1 : 1);
        ctx.globalAlpha = 0.85 - k * 0.08;
        ctx.beginPath();
        ctx.arc(0, 0, rr, 0, TAU);
        ctx.stroke();
      }
      return;
    }
    case 'cracks': {
      if (!back) return;
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 11; i++) {
        const base = (i * TAU) / 11 + hash(i, 1) * 0.4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        for (let s = 1; s <= 7; s++) {
          const a = base + (hash(i * 13 + s, 2) - 0.5) * 0.45;
          const rr = (R * 1.35 * s) / 7;
          ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        ctx.strokeStyle = L.c;
        ctx.lineWidth = R * 0.03;
        ctx.globalAlpha = 0.22 + 0.14 * Math.sin(t * 2 + i);
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = R * 0.006;
        ctx.globalAlpha = 0.3;
        ctx.stroke();
      }
      return;
    }
    case 'scan': {
      if (back) return;
      ctx.fillStyle = L.c;
      ctx.globalAlpha = 0.1;
      for (let y = -R * 1.5; y < R * 1.5; y += R * 0.07) ctx.fillRect(-R * 1.5, y + frac(t * 0.6) * R * 0.07, R * 3, R * 0.02);
      const sweep = -R * 1.5 + frac(t * 0.3) * R * 3;
      const g = ctx.createLinearGradient(0, sweep - R * 0.3, 0, sweep);
      g.addColorStop(0, 'transparent');
      g.addColorStop(1, L.c);
      ctx.fillStyle = g;
      ctx.globalAlpha = 0.3;
      ctx.fillRect(-R * 1.5, sweep - R * 0.3, R * 3, R * 0.3);
      return;
    }
    case 'slashes': {
      if (back) return;
      ctx.lineCap = 'round';
      ctx.globalCompositeOperation = 'lighter';
      for (let j = 0; j < L.n; j++) {
        const T = t * 1.1 + j / L.n;
        const K = Math.floor(T);
        const p = frac(T);
        if (p > 0.6) continue;
        const a = hash(K * 5 + j, 1) * TAU;
        const q = p / 0.6;
        ctx.save();
        ctx.rotate(a);
        for (const [w, col, al] of [[0.09, L.c, 0.5], [0.03, '#ffffff', 1]] as const) {
          ctx.strokeStyle = col;
          ctx.lineWidth = R * w * (1 - q);
          ctx.globalAlpha = al * (1 - q);
          ctx.beginPath();
          ctx.moveTo(-R * 1.4, -R * 0.3);
          ctx.quadraticCurveTo(0, R * 0.45, R * 1.4 * Math.min(1, q * 3), -R * 0.3);
          ctx.stroke();
        }
        ctx.restore();
      }
      return;
    }
    case 'drums': {
      if (!back) return;
      for (let i = 0; i < L.n; i++) {
        const a = -Math.PI * (0.08 + (0.84 * i) / (L.n - 1));
        const hit = Math.max(0, 1 - frac(t * 1.5 + i / L.n) * 4);
        ctx.save();
        ctx.translate(Math.cos(a) * R * 1.3, Math.sin(a) * R * 1.3);
        const r = R * 0.2 * (1 + hit * 0.15);
        ctx.fillStyle = '#12091c';
        ctx.strokeStyle = L.c;
        ctx.lineWidth = R * 0.035;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.rotate(t * 2 + i);
        ctx.fillStyle = L.c;
        ctx.globalAlpha = 0.6 + 0.4 * hit;
        for (let k = 0; k < 3; k++) {
          ctx.rotate(TAU / 3);
          ctx.beginPath();
          ctx.arc(0, -r * 0.42, r * 0.3, 0, TAU);
          ctx.arc(r * 0.12, -r * 0.3, r * 0.42, -1.2, 0.4);
          ctx.fill();
        }
        ctx.restore();
      }
      return;
    }
    case 'frames': {
      if (!back) return;
      ctx.globalCompositeOperation = 'lighter';
      const n = 8;
      for (let k = 0; k < n; k++) {
        const p = frac(t * 0.25 + k / n);
        const s = R * (0.15 + 2.4 * p * p);
        ctx.save();
        ctx.rotate(p * 0.7);
        ctx.strokeStyle = L.c[k % L.c.length];
        ctx.lineWidth = Math.max(1, R * 0.03 * p + 1);
        ctx.globalAlpha = Math.sin(Math.PI * p);
        ctx.strokeRect(-s, -s * 0.72, s * 2, s * 1.44);
        ctx.fillStyle = L.c[k % L.c.length];
        ctx.fillRect(-s, -s * 0.72, s * 2, s * 0.12);
        ctx.restore();
      }
      return;
    }
  }
}
