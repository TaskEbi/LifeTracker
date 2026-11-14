/**
 * Wind-ups shared between scenes: what the screen does while the dial is deciding. Each is drawn
 * from `p` (0 at the start, 1 at the flash) and the time, in the aura's colours.
 */
import type { Aura } from '../../domain/game/aura';
import { gearPath, hash } from './auraFx';
import type { Prelude } from './auraLooks';

const TAU = Math.PI * 2;
const frac = (x: number) => x - Math.floor(x);
const clamp = (x: number) => Math.max(0, Math.min(1, x));
type C2 = CanvasRenderingContext2D;

export function drawPrelude(ctx: C2, P: Prelude, a: Aura, p: number, t: number, w: number, h: number, cx: number, cy: number, S: number) {
  const cs = P.c ?? [a.c, '#ffffff'];
  const col = (i: number) => cs[i % cs.length];
  switch (P.k) {
    case 'rise': {
      // Something round comes up over the bottom edge and colours the sky.
      const g = ctx.createLinearGradient(0, h, 0, h * (1 - p * 0.9));
      g.addColorStop(0, a.c);
      g.addColorStop(1, 'transparent');
      ctx.globalAlpha = 0.5 * p;
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      const y = h + S * 0.3 - (h + S * 0.3 - cy) * p * p;
      const halo = ctx.createRadialGradient(cx, y, S * 0.1, cx, y, S * 0.6);
      halo.addColorStop(0, a.c);
      halo.addColorStop(1, 'transparent');
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, y, S * 0.6, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff7ed';
      ctx.beginPath();
      ctx.arc(cx, y, S * 0.17, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#05040a';
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 12) ctx.lineTo(x, h - S * 0.08 - Math.sin(x * 0.011) * S * 0.04 - Math.sin(x * 0.037) * S * 0.015);
      ctx.lineTo(w, h);
      ctx.fill();
      return;
    }
    case 'feathers': {
      for (let i = 0; i < 46 * p + 4; i++) {
        const q = frac(hash(i, 2) + t * 0.1 * (0.5 + hash(i, 3)));
        const x = w * hash(i, 1) + Math.sin(t * 1.2 + i) * S * 0.06;
        const s = S * (0.03 + 0.03 * hash(i, 4));
        ctx.save();
        ctx.translate(x, -S * 0.1 + q * (h + S * 0.2));
        ctx.rotate(Math.sin(t * 1.5 + i * 2) * 0.8 + i);
        ctx.fillStyle = col(i);
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.moveTo(-s * 1.3, 0);
        ctx.quadraticCurveTo(0, -s * 0.6, s * 1.3, 0);
        ctx.quadraticCurveTo(0, s * 0.6, -s * 1.3, 0);
        ctx.fill();
        ctx.restore();
      }
      return;
    }
    case 'curtain': {
      ctx.globalCompositeOperation = 'lighter';
      for (let j = 0; j < 3; j++) {
        for (let x = 0; x < w; x += 8) {
          const hgt = h * p * (0.75 + 0.25 * Math.sin(x * 0.012 + t * 0.7 + j * 2) + 0.15 * Math.sin(x * 0.04 - t + j));
          const g = ctx.createLinearGradient(0, 0, 0, hgt);
          g.addColorStop(0, 'transparent');
          g.addColorStop(0.5, col(j));
          g.addColorStop(1, 'transparent');
          ctx.fillStyle = g;
          ctx.globalAlpha = 0.18;
          ctx.fillRect(x, 0, 9, hgt);
        }
      }
      return;
    }
    case 'storm': {
      ctx.strokeStyle = a.c;
      ctx.lineCap = 'round';
      for (let i = 0; i < 90 * p + 10; i++) {
        const q = frac(hash(i, 2) + t * (1.2 + hash(i, 3)));
        const x = w * (hash(i, 1) * 1.3 - 0.15) - q * S * 0.2;
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 1 + hash(i, 4);
        ctx.beginPath();
        ctx.moveTo(x, q * h);
        ctx.lineTo(x - S * 0.02, q * h + S * 0.06);
        ctx.stroke();
      }
      const K = Math.floor(t * (2 + p * 6));
      const strike = frac(t * (2 + p * 6));
      if (hash(K, 1) < 0.25 + p * 0.55) {
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.25 * (1 - strike);
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#ffffff';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = (1 - strike) ** 2;
        ctx.lineWidth = 2 + p * 3;
        const x0 = w * hash(K, 2);
        ctx.beginPath();
        ctx.moveTo(x0, 0);
        for (let s = 1; s <= 9; s++) ctx.lineTo(x0 + (cx - x0) * (s / 9) + (hash(K * 9 + s, 3) - 0.5) * S * 0.25, (cy * s) / 9);
        ctx.stroke();
      }
      return;
    }
    case 'embers': {
      ctx.globalCompositeOperation = 'lighter';
      const wall = h * (1 - p * 0.75);
      for (let i = 0; i < 26; i++) {
        const x = (i / 25) * w;
        const top = wall - S * 0.2 * (0.5 + 0.5 * Math.sin(t * 5 + i * 1.9)) - S * 0.1 * Math.sin(t * 9 + i);
        const g = ctx.createLinearGradient(0, h, 0, top);
        g.addColorStop(0, col(1));
        g.addColorStop(0.5, col(0));
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(x - w / 18, h);
        ctx.quadraticCurveTo(x, top - S * 0.1, x + w / 18, h);
        ctx.fill();
      }
      for (let i = 0; i < 70 * p + 10; i++) {
        const q = frac(hash(i, 2) + t * 0.3 * (0.5 + hash(i, 3)));
        ctx.fillStyle = col(i % 2 ? 2 : 0);
        ctx.globalAlpha = 1 - q;
        ctx.beginPath();
        ctx.arc(w * hash(i, 1) + Math.sin(t * 2 + i) * S * 0.03, h - q * h * 1.1, 1 + 2.5 * hash(i, 4), 0, TAU);
        ctx.fill();
      }
      return;
    }
    case 'blizzard': {
      ctx.fillStyle = '#e0f2fe';
      ctx.globalAlpha = 0.12 * p;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';
      for (let i = 0; i < 160 * p + 20; i++) {
        const q = frac(hash(i, 2) + t * (0.5 + p * 1.5) * (0.5 + hash(i, 3)));
        const x = w * 1.2 - q * w * 1.4;
        const y = h * hash(i, 1) + q * S * 0.3;
        ctx.globalAlpha = 0.3 + 0.6 * hash(i, 4);
        ctx.lineWidth = 1 + 2 * hash(i, 5);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + S * 0.01 + S * 0.08 * p, y - S * 0.02 * p);
        ctx.stroke();
      }
      return;
    }
    case 'warp': {
      ctx.lineCap = 'round';
      for (let i = 0; i < 150; i++) {
        const ang = TAU * hash(i, 1);
        const q = frac(hash(i, 2) + t * (0.2 + p * 1.2));
        const r0 = S * 1.1 * q * q;
        const len = S * (0.005 + 0.3 * p * q);
        ctx.strokeStyle = i % 4 ? '#ffffff' : a.c;
        ctx.globalAlpha = q;
        ctx.lineWidth = 0.6 + 2 * q;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0);
        ctx.lineTo(cx + Math.cos(ang) * (r0 + len), cy + Math.sin(ang) * (r0 + len));
        ctx.stroke();
      }
      return;
    }
    case 'shatter': {
      ctx.lineJoin = 'round';
      for (let i = 0; i < 16; i++) {
        const base = (i / 16) * TAU + hash(i, 1) * 0.3;
        const reach = S * 1.2 * clamp(p * 1.4 - hash(i, 4) * 0.4);
        if (reach <= 0) continue;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        for (let s = 1; s <= 8; s++) {
          const ang = base + (hash(i * 11 + s, 2) - 0.5) * 0.5;
          ctx.lineTo(cx + (Math.cos(ang) * reach * s) / 8, cy + (Math.sin(ang) * reach * s) / 8);
        }
        ctx.strokeStyle = a.c;
        ctx.lineWidth = 5;
        ctx.globalAlpha = 0.35;
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.4;
        ctx.globalAlpha = 0.95;
        ctx.stroke();
      }
      // Slivers of glass coming loose.
      for (let i = 0; i < 24 * p; i++) {
        const ang = TAU * hash(i, 5);
        const r = S * (0.15 + 0.7 * hash(i, 6)) * (1 + p * 0.3);
        ctx.save();
        ctx.translate(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
        ctx.rotate(t * (hash(i, 7) - 0.5) * 3 + i);
        ctx.fillStyle = i % 2 ? '#ffffff' : a.c;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, -S * 0.04);
        ctx.lineTo(S * 0.02, S * 0.02);
        ctx.lineTo(-S * 0.015, S * 0.03);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      return;
    }
    case 'ink': {
      for (let i = 0; i < 14; i++) {
        const q = clamp(p * 1.5 - hash(i, 3) * 0.5);
        if (q <= 0) continue;
        const x = w * hash(i, 1);
        const y = h * hash(i, 2);
        const r = S * (0.1 + 0.35 * hash(i, 4)) * q;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, a.c);
        g.addColorStop(0.6, a.c);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.globalAlpha = 0.22;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TAU);
        ctx.fill();
        for (let k = 0; k < 6; k++) {
          const ang = TAU * hash(i * 7 + k, 5);
          ctx.beginPath();
          ctx.arc(x + Math.cos(ang) * r * 1.15, y + Math.sin(ang) * r * 1.15, r * 0.08, 0, TAU);
          ctx.fill();
        }
      }
      return;
    }
    case 'bloom': {
      const n = 90;
      for (let i = 0; i < n * p + 6; i++) {
        // Petals laid out like a sunflower head, opening outwards.
        const ang = i * 2.39996 + t * 0.4;
        const r = S * 0.06 * Math.sqrt(i) * (0.4 + 0.9 * p);
        const s = S * (0.02 + 0.012 * Math.sqrt(i) * 0.3);
        ctx.save();
        ctx.translate(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
        ctx.rotate(ang);
        ctx.fillStyle = col(i);
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 1.6, s * 0.8, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
      return;
    }
    case 'beam': {
      ctx.globalCompositeOperation = 'lighter';
      cs.forEach((c, j) => {
        const x = cx + (j - (cs.length - 1) / 2) * S * 0.09;
        const wid = S * (0.02 + 0.16 * p) * (cs.length > 2 ? 0.4 : 1);
        const g = ctx.createLinearGradient(x - wid, 0, x + wid, 0);
        g.addColorStop(0, 'transparent');
        g.addColorStop(0.5, c);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.globalAlpha = 0.7;
        ctx.fillRect(x - wid, 0, wid * 2, h * clamp(p * 2.2));
      });
      for (let i = 0; i < 40 * p; i++) {
        const q = frac(hash(i, 2) + t * (0.5 + hash(i, 3)));
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 1 - q;
        ctx.beginPath();
        ctx.arc(cx + (hash(i, 1) - 0.5) * S * 0.4, q * h, 1 + 2 * hash(i, 4), 0, TAU);
        ctx.fill();
      }
      return;
    }
    case 'tide': {
      for (let j = 0; j < 3; j++) {
        const level = h * (1 - p * (0.85 - j * 0.12));
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 10) ctx.lineTo(x, level + Math.sin(x * 0.014 + t * (1.4 + j * 0.5) + j * 2) * S * 0.03 + Math.sin(x * 0.04 - t * 2) * S * 0.01);
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fillStyle = a.c;
        ctx.globalAlpha = 0.2 + j * 0.08;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.5;
        ctx.stroke();
      }
      for (let i = 0; i < 40 * p; i++) {
        const q = frac(hash(i, 2) + t * 0.2 * (0.5 + hash(i, 3)));
        ctx.strokeStyle = '#ffffff';
        ctx.globalAlpha = 0.6 * (1 - q);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(w * hash(i, 1), h - q * h * p, 2 + 4 * hash(i, 4), 0, TAU);
        ctx.stroke();
      }
      return;
    }
    case 'pulse': {
      // A heartbeat trace that quickens.
      const rate = 1 + p * 3;
      ctx.strokeStyle = a.c;
      ctx.lineJoin = 'round';
      ctx.lineWidth = 2 + p * 2;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 4) {
        const u = frac((x / w) * 3 - t * rate * 0.6);
        const spike = u < 0.08 ? -Math.sin((u / 0.08) * Math.PI) : u < 0.14 ? Math.sin(((u - 0.08) / 0.06) * Math.PI) * 0.4 : 0;
        ctx.lineTo(x, h * 0.72 + spike * S * (0.12 + 0.2 * p));
      }
      ctx.globalAlpha = 0.9;
      ctx.stroke();
      for (let k = 0; k < 3; k++) {
        const q = frac(t * rate * 0.6 + k / 3);
        ctx.globalAlpha = (1 - q) * p;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, S * 0.6 * q, 0, TAU);
        ctx.stroke();
      }
      return;
    }
    case 'glyphs': {
      const g = P.glyphs ?? a.kanji;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = 0; i < 70 * p + 12; i++) {
        const q = frac(hash(i, 2) + t * 0.18 * (0.5 + hash(i, 3)));
        const size = S * (0.03 + 0.05 * hash(i, 4));
        ctx.font = `700 ${Math.round(size)}px "RocknRoll One", system-ui, sans-serif`;
        ctx.fillStyle = i % 3 ? a.c : '#ffffff';
        ctx.globalAlpha = Math.sin(Math.PI * q) * 0.9;
        // They fall, and are drawn in towards the middle as the wind-up ends.
        const x = w * hash(i, 1);
        const y = -size + q * (h + size * 2);
        ctx.fillText(g[(i * 7) % g.length], x + (cx - x) * p * p * 0.8, y + (cy - y) * p * p * 0.8);
      }
      return;
    }
    case 'vortex': {
      for (let i = 0; i < 200; i++) {
        const r = S * (0.08 + 0.95 * hash(i, 1)) * (1 - p * p * 0.9);
        const ang = TAU * hash(i, 2) + p * p * 6 + t * 0.3;
        ctx.strokeStyle = i % 4 ? '#ffffff' : a.c;
        ctx.globalAlpha = 0.35 + 0.6 * hash(i, 3);
        ctx.lineWidth = 1 + hash(i, 4);
        ctx.beginPath();
        ctx.arc(cx, cy, r, ang, ang + 0.02 + p * 0.6);
        ctx.stroke();
      }
      return;
    }
    case 'gears': {
      ctx.strokeStyle = a.c;
      ctx.lineWidth = Math.max(1.5, S * 0.006);
      const spin = t * (0.3 + 2.4 * p * p);
      [[0, 0], [w, 0], [0, h], [w, h], [0, h / 2], [w, h / 2]].forEach(([x, y], i) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(i % 2 ? -spin : spin);
        gearPath(ctx, i < 4 ? 14 : 10, S * (i < 4 ? 0.4 : 0.22), S * (i < 4 ? 0.34 : 0.18));
        ctx.globalAlpha = 0.14;
        ctx.fillStyle = a.c;
        ctx.fill();
        ctx.globalAlpha = 0.8;
        ctx.stroke();
        ctx.restore();
      });
      ctx.globalAlpha = 0.9;
      for (let i = 0; i < 60 * p; i++) {
        const ang = (i / 60) * TAU - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * S * (i % 5 ? 0.4 : 0.38), cy + Math.sin(ang) * S * (i % 5 ? 0.4 : 0.38));
        ctx.lineTo(cx + Math.cos(ang) * S * 0.42, cy + Math.sin(ang) * S * 0.42);
        ctx.stroke();
      }
      return;
    }
    case 'eyes': {
      for (let i = 0; i < 22; i++) {
        const born = hash(i, 3) * 0.8;
        if (p < born) continue;
        const open = clamp((p - born) * 6) * (frac(t * 0.3 + hash(i, 4)) > 0.93 ? 0.1 : 1);
        const x = w * (0.08 + 0.84 * hash(i, 1));
        const y = h * (0.05 + 0.75 * hash(i, 2));
        const s = S * (0.04 + 0.07 * hash(i, 5));
        ctx.beginPath();
        ctx.moveTo(x - s, y);
        ctx.quadraticCurveTo(x, y - s * 0.75 * open, x + s, y);
        ctx.quadraticCurveTo(x, y + s * 0.75 * open, x - s, y);
        ctx.fillStyle = '#0b0612';
        ctx.globalAlpha = 1;
        ctx.fill();
        ctx.strokeStyle = a.c;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.save();
        ctx.clip();
        // Every one of them looks at the middle.
        const look = Math.atan2(cy - y, cx - x);
        ctx.fillStyle = a.c;
        ctx.beginPath();
        ctx.arc(x + Math.cos(look) * s * 0.3, y + Math.sin(look) * s * 0.2, s * 0.36, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(x + Math.cos(look) * s * 0.3, y + Math.sin(look) * s * 0.2, s * 0.08, s * 0.3, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
      return;
    }
    case 'fireworks': {
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      const bursts = 2 + Math.floor(p * 5);
      for (let j = 0; j < bursts; j++) {
        const T = t * (0.5 + p * 0.5) + j / bursts;
        const K = Math.floor(T);
        const q = frac(T);
        const bx = w * (0.12 + 0.76 * hash(K * 5 + j, 1));
        const by = h * (0.1 + 0.5 * hash(K * 5 + j, 2));
        if (q < 0.25) {
          // The shell going up.
          ctx.strokeStyle = '#ffffff';
          ctx.globalAlpha = 0.7;
          ctx.lineWidth = 2;
          const y = h - (h - by) * (q / 0.25);
          ctx.beginPath();
          ctx.moveTo(bx, y);
          ctx.lineTo(bx, y + S * 0.05);
          ctx.stroke();
          continue;
        }
        const e = (q - 0.25) / 0.75;
        const reach = S * 0.3 * (1 - (1 - e) ** 3);
        for (let i = 0; i < 34; i++) {
          const ang = (i * TAU) / 34;
          const rr = reach * (0.7 + 0.3 * hash(i, K));
          const x = bx + Math.cos(ang) * rr;
          const y = by + Math.sin(ang) * rr + e * e * S * 0.1;
          ctx.strokeStyle = i % 5 ? col(K + j) : '#ffffff';
          ctx.lineWidth = 2;
          ctx.globalAlpha = (1 - e) ** 1.5;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - Math.cos(ang) * rr * 0.25, y - Math.sin(ang) * rr * 0.25);
          ctx.stroke();
        }
      }
      return;
    }
    case 'frames': {
      ctx.globalCompositeOperation = 'lighter';
      const n = 6 + Math.floor(p * 10);
      for (let k = 0; k < n; k++) {
        const q = frac(t * (0.2 + p * 0.5) + k / n);
        const s = S * (0.05 + 1.5 * q * q);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(q * 0.5 * (k % 2 ? 1 : -1));
        ctx.strokeStyle = k % 3 ? a.c : '#ffffff';
        ctx.lineWidth = 1 + q * 3;
        ctx.globalAlpha = Math.sin(Math.PI * q);
        ctx.strokeRect(-s, -s * 0.7, s * 2, s * 1.4);
        ctx.fillStyle = a.c;
        ctx.fillRect(-s, -s * 0.7, s * 2, s * 0.1);
        ctx.restore();
      }
      return;
    }
    case 'countdown': {
      // A clock face running down, and the digits of what is left.
      const left = Math.max(0, Math.ceil((1 - p) * 5));
      ctx.strokeStyle = a.c;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(cx, cy, S * 0.34, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - p));
      ctx.stroke();
      for (let i = 0; i < 60; i++) {
        if (i / 60 > 1 - p) continue;
        const ang = (i / 60) * TAU - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * S * 0.36, cy + Math.sin(ang) * S * 0.36);
        ctx.lineTo(cx + Math.cos(ang) * S * (i % 5 ? 0.38 : 0.4), cy + Math.sin(ang) * S * (i % 5 ? 0.38 : 0.4));
        ctx.stroke();
      }
      const beat = frac((1 - p) * 5);
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.25 + 0.6 * beat;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `700 ${Math.round(S * 0.22 * (1.3 - 0.3 * beat))}px "RocknRoll One", system-ui, sans-serif`;
      ctx.fillText(String(left), cx, cy);
      return;
    }
  }
}
