/**
 * Omens: what every aura of a tier does as it comes, before its own look. They are drawn over the
 * dial's stage while a rare roll winds up, and again under the aura's own wind-up in its full-screen
 * scene, so a tier always feels the same way and each is unlike the others:
 *   Rare      · shimmer: rings closing in, sparkles
 *   Epic      · storm: purple lightning striking the middle
 *   Legendary · dawn: pillars of gold light, motes gathering, a halo
 *   Mythic    · rift: the picture glitches, a tear opens down the middle, a heartbeat
 * `p` runs 0 to 1 over the wind-up; `t` is seconds.
 */
import { hash } from './auraFx';

type C2 = CanvasRenderingContext2D;
const TAU = Math.PI * 2;
const frac = (x: number) => x - Math.floor(x);
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const outCubic = (x: number) => 1 - (1 - x) ** 3;

export interface Box {
  w: number;
  h: number;
  cx: number;
  cy: number;
  S: number;
}

/** How dark the stage goes for each tier while it winds up. */
const DIM = [0, 0, 0.35, 0.62, 0.86, 0.93];

function star(ctx: C2, x: number, y: number, s: number) {
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.quadraticCurveTo(x, y, x + s, y);
  ctx.quadraticCurveTo(x, y, x, y + s);
  ctx.quadraticCurveTo(x, y, x - s, y);
  ctx.quadraticCurveTo(x, y, x, y - s);
  ctx.fill();
}

function shimmer(ctx: C2, p: number, t: number, b: Box, c: string, k: number) {
  ctx.strokeStyle = c;
  for (let i = 0; i < 3; i++) {
    const q = frac(t * 0.9 + i / 3);
    ctx.globalAlpha = q * p * 0.75 * k;
    ctx.lineWidth = 1 + 2 * q;
    ctx.beginPath();
    ctx.arc(b.cx, b.cy, b.S * 0.75 * (1 - q) + 4, 0, TAU);
    ctx.stroke();
  }
  ctx.fillStyle = '#e0f2fe';
  for (let i = 0; i < 26; i++) {
    const tw = Math.max(0, Math.sin(t * 5 + i * 1.7));
    if (tw <= 0) continue;
    ctx.globalAlpha = tw * p * k;
    star(ctx, b.w * hash(i, 31), b.h * hash(i, 32), b.S * (0.012 + 0.022 * hash(i, 33)) * (0.6 + 0.4 * tw));
  }
}

function boltPath(ctx: C2, seed: number, x0: number, y0: number, x1: number, y1: number, jit: number) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  const n = 12;
  for (let s = 1; s <= n; s++) {
    const f = s / n;
    const off = s === n ? 0 : (hash(seed * 13 + s, 2) - 0.5) * jit;
    ctx.lineTo(x0 + (x1 - x0) * f + off, y0 + (y1 - y0) * f);
  }
}

function storm(ctx: C2, p: number, t: number, b: Box, c: string, k: number) {
  // Clouds gathering at the top.
  const g = ctx.createLinearGradient(0, 0, 0, b.h * 0.45);
  g.addColorStop(0, 'rgb(76 29 149 / 0.55)');
  g.addColorStop(1, 'transparent');
  ctx.globalAlpha = p * k;
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, b.w, b.h);
  // Strikes come faster as it winds up.
  const rate = 2 + 6 * p;
  const K = Math.floor(t * rate);
  const ph = frac(t * rate);
  if (ph < 0.38 && hash(K, 9) < 0.35 + 0.6 * p) {
    const f = 1 - ph / 0.38;
    const x0 = b.w * (0.1 + 0.8 * hash(K, 1));
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = c;
    ctx.globalAlpha = 0.45 * f * k;
    ctx.lineWidth = Math.max(5, b.S * 0.03);
    boltPath(ctx, K, x0, -10, b.cx, b.cy, b.S * 0.14);
    ctx.stroke();
    ctx.strokeStyle = '#faf5ff';
    ctx.globalAlpha = f * k;
    ctx.lineWidth = Math.max(1.5, b.S * 0.007);
    boltPath(ctx, K, x0, -10, b.cx, b.cy, b.S * 0.14);
    ctx.stroke();
    // A fork off the side.
    const fy = b.cy * (0.35 + 0.2 * hash(K, 4));
    const fx = x0 + (b.cx - x0) * (fy / b.cy);
    boltPath(ctx, K + 50, fx, fy, fx + (hash(K, 5) - 0.5) * b.S * 0.7, fy + b.S * 0.25, b.S * 0.08);
    ctx.globalAlpha = 0.7 * f * k;
    ctx.stroke();
    ctx.fillStyle = c;
    ctx.globalAlpha = 0.22 * f * k;
    ctx.fillRect(0, 0, b.w, b.h);
  }
  // Crackle around the middle.
  const C = Math.floor(t * 15);
  const R = b.S * (0.2 - 0.07 * p);
  ctx.strokeStyle = '#e9d5ff';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 8; i++) {
    if (hash(C, i + 20) > 0.3 + 0.6 * p) continue;
    const a0 = TAU * hash(C, i);
    ctx.globalAlpha = p * k;
    ctx.beginPath();
    for (let s = 0; s <= 5; s++) {
      const a = a0 + s * 0.09;
      const r = R + (hash(C * 7 + i, s) - 0.5) * b.S * 0.05;
      const x = b.cx + Math.cos(a) * r;
      const y = b.cy + Math.sin(a) * r;
      if (s) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.stroke();
  }
}

const PILLARS = [3, 0, 5, 1, 6, 2, 4];

function dawn(ctx: C2, p: number, t: number, b: Box, c: string, k: number) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  PILLARS.forEach((slot, order) => {
    const rise = outCubic(clamp((p - order * 0.08) / 0.35));
    if (rise <= 0) return;
    const x = b.w * (0.08 + (0.84 * slot) / 6);
    const pw = b.S * 0.05 * (1 + 0.25 * Math.sin(t * 3 + slot));
    const top = b.h * (1 - rise);
    const g = ctx.createLinearGradient(0, b.h, 0, top);
    g.addColorStop(0, c);
    g.addColorStop(0.7, 'rgb(253 230 138 / 0.5)');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.globalAlpha = 0.55 * k;
    ctx.fillRect(x - pw / 2, top, pw, b.h - top);
    ctx.globalAlpha = 0.9 * k;
    ctx.fillRect(x - pw / 8, top, pw / 4, b.h - top);
  });
  // Motes spiralling in.
  ctx.fillStyle = '#fef3c7';
  for (let i = 0; i < 70; i++) {
    const q = frac(hash(i, 2) + t * (0.3 + 0.5 * p));
    const r = b.S * (0.12 + 0.85 * (1 - q));
    const a = TAU * hash(i, 1) + q * 2.5;
    ctx.globalAlpha = q * p * k;
    ctx.beginPath();
    ctx.arc(b.cx + Math.cos(a) * r, b.cy + Math.sin(a) * r, 1 + 1.5 * hash(i, 3), 0, TAU);
    ctx.fill();
  }
  // A halo forming.
  const hr = b.S * (0.05 + 0.14 * p);
  const hg = ctx.createRadialGradient(b.cx, b.cy, 0, b.cx, b.cy, hr * 2.2);
  hg.addColorStop(0, '#fffbeb');
  hg.addColorStop(0.4, c);
  hg.addColorStop(1, 'transparent');
  ctx.globalAlpha = p * k;
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.arc(b.cx, b.cy, hr * 2.2, 0, TAU);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.translate(b.cx, b.cy);
  ctx.rotate(t * 0.8);
  ctx.strokeStyle = c;
  ctx.lineWidth = 2;
  ctx.setLineDash([b.S * 0.03, b.S * 0.02]);
  ctx.globalAlpha = p * 0.9 * k;
  ctx.beginPath();
  ctx.arc(0, 0, hr * 1.6, 0, TAU);
  ctx.stroke();
  ctx.restore();
  if (p > 0.85) {
    ctx.fillStyle = '#fffbeb';
    ctx.globalAlpha = ((p - 0.85) / 0.15) * 0.45 * k;
    ctx.fillRect(0, 0, b.w, b.h);
  }
}

const GLITCH = ['#fb7185', '#22d3ee', '#f0abfc', '#ffffff'];

function rift(ctx: C2, p: number, t: number, b: Box, c: string, k: number, opaque: boolean) {
  const K = Math.floor(t * 14);
  for (let j = 0; j < 5 + 22 * p; j++) {
    ctx.fillStyle = GLITCH[j % 4];
    ctx.globalAlpha = (0.08 + 0.4 * hash(K, j + 80) * p) * k;
    ctx.fillRect(b.w * hash(K, j + 40) - b.w * 0.2, b.h * hash(K, j), b.w * (0.1 + 0.6 * hash(K, j + 60)), b.h * (0.004 + 0.025 * hash(K, j + 20)));
  }
  // A heartbeat that quickens.
  const rate = 1.1 + 2 * p;
  const beat = Math.max(0, Math.sin(TAU * t * rate)) ** 8;
  const hg = ctx.createRadialGradient(b.cx, b.cy, 0, b.cx, b.cy, b.S * 0.8);
  hg.addColorStop(0, c);
  hg.addColorStop(1, 'transparent');
  ctx.fillStyle = hg;
  ctx.globalAlpha = 0.3 * beat * p * k;
  ctx.fillRect(0, 0, b.w, b.h);
  // The tear down the middle, opening.
  const open = b.S * 0.22 * p ** 3 + 1.5;
  const J = Math.floor(t * 9);
  const n = 18;
  const xs: number[] = [];
  for (let i = 0; i <= n; i++) xs.push(b.cx + (hash(J * 31 + i, 5) - 0.5) * b.S * 0.06 * (0.4 + p));
  const tear = (dx: number) => {
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const y = (b.h * i) / n;
      const w = open * Math.sin((Math.PI * i) / n) ** 0.5;
      if (i) ctx.lineTo(xs[i] - w / 2 + dx, y);
      else ctx.moveTo(xs[i] - w / 2 + dx, y);
    }
    for (let i = n; i >= 0; i--) {
      const y = (b.h * i) / n;
      const w = open * Math.sin((Math.PI * i) / n) ** 0.5;
      ctx.lineTo(xs[i] + w / 2 + dx, y);
    }
    ctx.closePath();
  };
  ctx.globalAlpha = 0.7 * p * k;
  ctx.fillStyle = '#f43f5e';
  tear(-4);
  ctx.fill();
  ctx.fillStyle = '#22d3ee';
  tear(4);
  ctx.fill();
  ctx.globalAlpha = Math.min(1, 0.4 + p) * k;
  ctx.fillStyle = '#fff1f2';
  tear(0);
  ctx.fill();
  // Now and then the picture turns inside out (only where there's a picture to turn).
  if (opaque && hash(K, 77) < 0.07 * p) {
    ctx.save();
    ctx.globalCompositeOperation = 'difference';
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, b.w, b.h);
    ctx.restore();
  }
}

/** The tier's own signature. `k` scales its strength; `opaque` when drawn over a picture of its own. */
export function omenSign(ctx: C2, tier: number, p: number, t: number, b: Box, c: string, k = 1, opaque = false) {
  ctx.save();
  if (tier === 2) shimmer(ctx, p, t, b, c, k);
  else if (tier === 3) storm(ctx, p, t, b, c, k);
  else if (tier === 4) dawn(ctx, p, t, b, c, k);
  else if (tier >= 5) rift(ctx, p, t, b, c, k, opaque);
  ctx.restore();
}

/** Over the stage while a rare roll winds up: the room goes dark, then the tier's signature. */
export function drawOmen(ctx: C2, tier: number, p: number, t: number, b: Box, c: string) {
  ctx.save();
  ctx.fillStyle = '#05040a';
  ctx.globalAlpha = DIM[tier] * Math.min(1, p * 2.5);
  ctx.fillRect(0, 0, b.w, b.h);
  ctx.restore();
  omenSign(ctx, tier, p, t, b, c);
}

/**
 * The moment it lands on the stage: a flash, rings and sparks in the tier's colour, the dark lifting.
 * `q` runs 0 to 1 over the landing.
 */
export function drawLanding(ctx: C2, tier: number, q: number, t: number, b: Box, c: string, au: string) {
  ctx.save();
  ctx.fillStyle = '#05040a';
  ctx.globalAlpha = DIM[tier] * (1 - outCubic(clamp(q * 1.6)));
  ctx.fillRect(0, 0, b.w, b.h);
  if (tier >= 4) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.translate(b.cx, b.cy);
    ctx.rotate(t * 0.3);
    ctx.fillStyle = c;
    ctx.globalAlpha = 0.28 * (1 - q);
    const rn = tier >= 5 ? 18 : 12;
    for (let i = 0; i < rn; i++) {
      ctx.rotate(TAU / rn);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(b.S * 1.4, -b.S * 0.06);
      ctx.lineTo(b.S * 1.4, b.S * 0.06);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
  const rings: [string, number][] = tier >= 5 ? [['#f43f5e', -3], ['#22d3ee', 3], [c, 0]] : [[c, 0]];
  for (let k = 0; k < 2 + (tier >= 4 ? 1 : 0); k++) {
    const u = clamp(q * 1.3 - k * 0.14);
    if (u <= 0 || u >= 1) continue;
    for (const [rc, dx] of rings) {
      ctx.strokeStyle = rc;
      ctx.globalAlpha = 1 - u;
      ctx.lineWidth = 4 * (1 - u) + 1;
      ctx.beginPath();
      ctx.arc(b.cx + dx, b.cy, b.S * 0.95 * outCubic(u), 0, TAU);
      ctx.stroke();
    }
  }
  const bits = 16 + tier * 10;
  for (let i = 0; i < bits; i++) {
    const a = TAU * hash(i, 1);
    const reach = b.S * (0.25 + 0.7 * hash(i, 2)) * outCubic(clamp(q * 1.5));
    ctx.fillStyle = i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? au : c;
    ctx.globalAlpha = 1 - q;
    ctx.save();
    ctx.translate(b.cx + Math.cos(a) * reach, b.cy + Math.sin(a) * reach + q * q * b.S * 0.12);
    ctx.rotate(q * 6 * (hash(i, 3) - 0.5) + i);
    ctx.fillRect(-3, -1.5, 5 + 4 * hash(i, 4), 3);
    ctx.restore();
  }
  if (q < 0.3) {
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = (1 - q / 0.3) ** 2 * (tier >= 4 ? 0.85 : tier >= 3 ? 0.6 : 0.4);
    ctx.fillRect(0, 0, b.w, b.h);
  }
  ctx.restore();
}
