/**
 * The scene a rare aura plays when it's rolled: the screen goes dark, the dial winds up (longer and
 * stranger the rarer it is), a flash, and the aura itself with its name. Tap through; a queue of
 * them (after a night away) can be skipped in one go.
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { AURA_TIERS, AURAS, oddsText, type Aura } from '../../domain/game/aura';
import { bloom, reducedMotion, useCanvasLoop } from './AuraCanvas';
import { drawAura, drawBolt, gearPath, hash } from './auraFx';
import { PRELUDES } from './auraLooks';
import { drawPrelude } from './auraPreludes';

const TAU = Math.PI * 2;
/** Seconds of wind-up before the flash, by tier. */
const WIND = [0, 0, 2.2, 3.4, 5, 7.2];
const frac = (x: number) => x - Math.floor(x);
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const outBack = (x: number) => 1 + 2.7 * (x - 1) ** 3 + 1.7 * (x - 1) ** 2;

const NULL_LINES = ['> dial.roll()', 'TypeError: aura is undefined', '    at Dial.turn (works.ts:404)', '    at <anonymous>', 'Segmentation fault (core dumped)', 'recovering…', 'aura = 0x00000000'];

type C2 = CanvasRenderingContext2D;

/** What only this aura does while the dial winds up. `p` runs 0 to 1. */
function prelude(ctx: C2, a: Aura, p: number, t: number, w: number, h: number, cx: number, cy: number, S: number) {
  switch (a.id) {
    case 'torii': {
      const g = ctx.createLinearGradient(0, h, 0, h * (1 - p));
      g.addColorStop(0, 'rgb(225 29 72 / 0.55)');
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fbbf24';
      ctx.globalAlpha = 0.9 * p;
      ctx.beginPath();
      ctx.arc(cx, cy + S * 0.6 * (1 - p), S * 0.2, 0, TAU);
      ctx.fill();
      for (let i = 0; i < 30 * p; i++) {
        ctx.fillStyle = i % 2 ? '#fecdd3' : '#fda4af';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.ellipse(w * hash(i, 1) + Math.sin(t + i) * 20, h * frac(hash(i, 2) + t * 0.12 * (0.5 + hash(i, 3))), S * 0.012, S * 0.007, t + i, 0, TAU);
        ctx.fill();
      }
      return;
    }
    case 'cranes': {
      ctx.strokeStyle = '#f8fafc';
      ctx.lineCap = 'round';
      ctx.lineWidth = Math.max(1.5, S * 0.006);
      for (let i = 0; i < 40 * p; i++) {
        const x = w * (-0.2 + 1.4 * frac(hash(i, 1) + t * 0.16 * (0.6 + hash(i, 3))));
        const y = h * (0.12 + 0.7 * hash(i, 2)) + Math.sin(t * 1.4 + i) * S * 0.02 - x * 0.12;
        const s = S * (0.02 + 0.02 * hash(i, 4));
        const flap = 0.2 + 0.8 * Math.abs(Math.sin(t * 5 + i));
        ctx.globalAlpha = 0.5 + 0.5 * hash(i, 5);
        ctx.beginPath();
        ctx.moveTo(x - s, y - s * flap * 0.2);
        ctx.quadraticCurveTo(x - s * 0.5, y - s * flap, x, y);
        ctx.quadraticCurveTo(x + s * 0.5, y - s * flap, x + s, y - s * flap * 0.2);
        ctx.stroke();
      }
      return;
    }
    case 'veil': {
      ctx.globalCompositeOperation = 'lighter';
      ['#34d399', '#22d3ee', '#a78bfa'].forEach((c, j) => {
        for (let x = 0; x < w; x += 8) {
          const hgt = h * p * (0.7 + 0.3 * Math.sin(x * 0.012 + t * 0.7 + j * 2) + 0.15 * Math.sin(x * 0.04 - t + j));
          const g = ctx.createLinearGradient(0, 0, 0, hgt);
          g.addColorStop(0, 'transparent');
          g.addColorStop(0.5, c);
          g.addColorStop(1, 'transparent');
          ctx.fillStyle = g;
          ctx.globalAlpha = 0.16;
          ctx.fillRect(x, 0, 9, hgt);
        }
      });
      return;
    }
    case 'dragon': {
      const head = w * (1.4 - 2.4 * frac(t * 0.2));
      for (let i = 70; i >= 0; i--) {
        const x = head + i * S * 0.028;
        const y = cy + Math.sin(x * 0.011 + t * 1.5) * S * 0.2 * p + Math.sin(x * 0.03) * S * 0.03;
        ctx.fillStyle = i % 4 < 2 ? '#10b981' : '#facc15';
        ctx.globalAlpha = clamp(p * 3);
        ctx.beginPath();
        ctx.arc(x, y, S * 0.035 * (1 - (i / 70) * 0.8) * (i === 0 ? 1.5 : 1), 0, TAU);
        ctx.fill();
      }
      return;
    }
    case 'corona': {
      ctx.fillStyle = `rgb(120 53 15 / ${0.4 * (1 - p)})`;
      ctx.fillRect(0, 0, w, h);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, S * 0.5);
      g.addColorStop(0, '#fff7ed');
      g.addColorStop(0.3, '#fb923c');
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, S * 0.5, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(cx, cy, S * 0.16, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#05040a';
      ctx.beginPath();
      ctx.arc(cx - S * 0.42 * (1 - p), cy - S * 0.08 * (1 - p), S * 0.165, 0, TAU);
      ctx.fill();
      return;
    }
    case 'null': {
      const K = Math.floor(t * 12);
      const colors = ['#22ff88', '#ff2bd6', '#21e6ff'];
      for (let j = 0; j < 4 + 26 * p; j++) {
        ctx.fillStyle = colors[j % 3];
        ctx.globalAlpha = 0.15 + 0.5 * hash(K, j + 80) * p;
        ctx.fillRect(w * hash(K, j + 40) - w * 0.2, h * hash(K, j), w * (0.1 + 0.7 * hash(K, j + 60)), h * (0.004 + 0.03 * hash(K, j + 20)));
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#22ff88';
      ctx.font = `${Math.max(11, Math.round(S * 0.032))}px ui-monospace, Menlo, Consolas, monospace`;
      ctx.textBaseline = 'top';
      const shown = Math.ceil(p * NULL_LINES.length);
      for (let i = 0; i < shown; i++) ctx.fillText(NULL_LINES[i], 16 + (hash(K, i) < 0.1 ? 6 : 0), h * 0.12 + i * S * 0.05);
      return;
    }
    case 'horizon': {
      for (let i = 0; i < 180; i++) {
        const r = S * (0.1 + 0.9 * hash(i, 1)) * (1 - p * p * 0.93);
        const ang = TAU * hash(i, 2) + p * p * 5 + t * 0.05;
        ctx.strokeStyle = i % 5 ? '#fff7ed' : '#fdba74';
        ctx.globalAlpha = 0.4 + 0.6 * hash(i, 3);
        ctx.lineWidth = 1 + hash(i, 4);
        ctx.beginPath();
        ctx.arc(cx, cy, r, ang, ang + 0.01 + p * p * 0.5);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(cx, cy, S * (0.02 + 0.14 * p), 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#fff7ed';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      return;
    }
    case 'orrery': {
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = Math.max(1.5, S * 0.006);
      const spin = t * (0.3 + 2.4 * p * p);
      [[0, 0], [w, 0], [0, h], [w, h]].forEach(([x, y], i) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(i % 2 ? -spin : spin);
        gearPath(ctx, 14, S * 0.4, S * 0.34);
        ctx.globalAlpha = 0.14;
        ctx.fillStyle = '#eab308';
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
      const hand = TAU * p * p * 7 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(hand) * S * 0.36, cy + Math.sin(hand) * S * 0.36);
      ctx.stroke();
      return;
    }
    case 'banbutsu': {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `700 ${Math.round(S * 0.06)}px "RocknRoll One", system-ui, sans-serif`;
      AURAS.forEach((o, i) => {
        if (o.id === a.id || i > AURAS.length * (0.15 + p)) return;
        for (let k = 0; k < 3; k++) {
          const ang = (i / (AURAS.length - 1)) * TAU + t * (0.4 + 2.2 * p) - k * 0.09;
          const r = S * (0.12 + 0.55 * (1 - p)) + Math.sin(t * 2 + i) * S * 0.02;
          ctx.fillStyle = o.c;
          ctx.globalAlpha = (1 - k * 0.35) * 0.9;
          ctx.fillText(o.kanji, cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
        }
      });
      return;
    }
    case 'lastbolt': {
      const fall = clamp(p / 0.62);
      const land = clamp((p - 0.62) / 0.38);
      if (land > 0) {
        ctx.strokeStyle = '#ffd700';
        ctx.lineJoin = 'round';
        for (let i = 0; i < 14; i++) {
          const ang = (i / 14) * TAU + hash(i, 1) * 0.3;
          ctx.lineWidth = 1 + 3 * hash(i, 2);
          ctx.globalAlpha = 0.9;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          for (let s = 1; s <= 8; s++) {
            const r = (S * 0.9 * land * s) / 8;
            const wob = (hash(i * 9 + s, 3) - 0.5) * 0.25;
            ctx.lineTo(cx + Math.cos(ang + wob) * r, cy + Math.sin(ang + wob) * r);
          }
          ctx.stroke();
        }
        for (let k = 0; k < 3; k++) {
          const u = land * 1.6 - k * 0.25;
          if (u <= 0 || u >= 1) continue;
          ctx.globalAlpha = 1 - u;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(cx, cy + S * 0.05, S * 0.5 * u, S * 0.14 * u, 0, 0, TAU);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      ctx.save();
      ctx.translate(cx, -S * 0.1 + (cy + S * 0.1) * fall * fall);
      ctx.rotate(fall < 1 ? t * 1.5 : 0);
      drawBolt(ctx, S * 0.05, '#ffd700');
      ctx.restore();
      return;
    }
    default: {
      const P = PRELUDES[a.id];
      if (P) drawPrelude(ctx, P, a, p, t, w, h, cx, cy, S);
    }
  }
}

function drawScene(ctx: C2, a: Aura, t: number, w: number, h: number, wind: number) {
  const S = Math.min(w, h);
  const cx = w / 2;
  const cy = h * 0.3;
  ctx.fillStyle = '#05040a';
  ctx.fillRect(-20, -20, w + 40, h + 40);
  const u = t - wind;
  // The whole picture shakes harder as the wind-up ends, and once more on the flash.
  const shake = u < 0 ? (t / wind) ** 2 * a.tier * 1.5 : u < 0.5 ? (0.5 - u) * a.tier * 7 : 0;
  ctx.save();
  if (shake > 0.3) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);

  if (u < 0) {
    const p = t / wind;
    ctx.save();
    prelude(ctx, a, p, t, w, h, cx, cy, S);
    ctx.restore();
    // The Last Bolt falls in silence: nothing winds up until it lands.
    const gp = a.id === 'lastbolt' ? clamp((p - 0.62) / 0.38) : p;
    ctx.lineCap = 'round';
    const n = 24 + a.tier * 22;
    for (let i = 0; i < n; i++) {
      const ang = TAU * hash(i, 1);
      const q = frac(hash(i, 2) + t * (0.35 + gp * 1.7));
      const r = (1 - q) * S * 0.95 + S * 0.03;
      const len = S * 0.03 * (1 + gp * 5);
      ctx.strokeStyle = i % 3 ? a.c : '#ffffff';
      ctx.globalAlpha = q * gp * 0.9;
      ctx.lineWidth = 1 + hash(i, 3) * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
      ctx.lineTo(cx + Math.cos(ang) * (r + len), cy + Math.sin(ang) * (r + len));
      ctx.stroke();
    }
    ctx.globalAlpha = gp;
    const beat = 1 + 0.25 * Math.sin(t * (6 + gp * 30));
    const core = S * (0.012 + 0.07 * gp * gp) * beat;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, core * 6);
    g.addColorStop(0, a.c);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, core * 6, 0, TAU);
    ctx.fill();
    if (a.id !== 'horizon' && a.id !== 'lastbolt') {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(cx, cy, core, 0, TAU);
      ctx.fill();
    }
    ctx.strokeStyle = a.c;
    ctx.lineWidth = 2;
    ctx.globalAlpha = gp * 0.8;
    ctx.beginPath();
    ctx.arc(cx, cy, S * 0.55 * (1 - gp) + core, 0, TAU);
    ctx.stroke();
  } else {
    const scale = outBack(clamp(u / 0.7));
    // A wash of the aura's colour behind it.
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, S * 0.9);
    g.addColorStop(0, a.c);
    g.addColorStop(1, 'transparent');
    ctx.globalAlpha = 0.22 * clamp(u / 0.5);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
    if (a.tier >= 4) {
      // Slow rays behind a legendary, turning.
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.translate(cx, cy);
      ctx.rotate(t * 0.12);
      const rg = ctx.createLinearGradient(0, 0, S * 1.3, 0);
      rg.addColorStop(0, a.c);
      rg.addColorStop(1, 'transparent');
      ctx.fillStyle = rg;
      ctx.globalAlpha = 0.16 * clamp(u / 0.8);
      const rn = a.tier >= 5 ? 20 : 12;
      for (let i = 0; i < rn; i++) {
        ctx.rotate(TAU / rn);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(S * 1.3, -S * 0.05);
        ctx.lineTo(S * 1.3, S * 0.05);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
    drawAura(ctx, a.id, t, cx, cy, S * (a.tier >= 4 ? 0.17 : 0.2) * scale, 'both');
    if (a.tier >= 4 && u < 1.6) {
      // A streak of light across the middle as it lands.
      const f = 1 - u / 1.6;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const fg = ctx.createLinearGradient(0, 0, w, 0);
      fg.addColorStop(0, 'transparent');
      fg.addColorStop(0.5, '#ffffff');
      fg.addColorStop(1, 'transparent');
      ctx.fillStyle = fg;
      ctx.globalAlpha = f * f;
      ctx.fillRect(0, cy - S * 0.006 * (1 + f * 3), w, S * 0.012 * (1 + f * 3));
      ctx.restore();
    }
    if (a.tier >= 5 && u < 0.45) {
      // Speed lines for the rarest: black wedges closing in on the flash.
      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = '#000000';
      ctx.globalAlpha = 1 - u / 0.45;
      for (let i = 0; i < 40; i++) {
        const ang = TAU * hash(i, 7);
        const inner = S * (0.25 + 0.3 * hash(i, 8)) * (1 + u * 2);
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * inner, Math.sin(ang) * inner);
        ctx.lineTo(Math.cos(ang - 0.03) * S * 2, Math.sin(ang - 0.03) * S * 2);
        ctx.lineTo(Math.cos(ang + 0.03) * S * 2, Math.sin(ang + 0.03) * S * 2);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.strokeStyle = a.c;
    for (let k = 0; k < 2 + a.tier; k++) {
      const uu = u - k * 0.16;
      if (uu <= 0 || uu >= 1.4) continue;
      ctx.globalAlpha = 1 - uu / 1.4;
      ctx.lineWidth = 3 * (1 - uu / 1.4) + 1;
      ctx.beginPath();
      ctx.arc(cx, cy, S * 0.95 * uu, 0, TAU);
      ctx.stroke();
    }
    const tierColor = AURA_TIERS[a.tier].color;
    const bits = 30 + a.tier * 30;
    const fade = clamp(1 - u / 3);
    if (fade > 0) {
      for (let i = 0; i < bits; i++) {
        const ang = TAU * hash(i, 1);
        const reach = S * (0.3 + 0.9 * hash(i, 2)) * (1 - Math.exp(-u * 2.2));
        ctx.fillStyle = i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? a.c : tierColor;
        ctx.globalAlpha = fade;
        ctx.save();
        ctx.translate(cx + Math.cos(ang) * reach, cy + Math.sin(ang) * reach + u * u * S * 0.06);
        ctx.rotate(u * 5 * (hash(i, 3) - 0.5) + i);
        ctx.fillRect(-3, -1.5, 6 + 4 * hash(i, 4), 3);
        ctx.restore();
      }
    }
    if (u < 0.55) {
      ctx.globalAlpha = (1 - u / 0.55) ** 2;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-20, -20, w + 40, h + 40);
    }
  }
  ctx.restore();
  bloom(ctx, u < 0 ? 0.3 : 0.4);
}

export function AuraScene({ aura: a, isNew, more, replay, onDone, onSkipAll }: { aura: Aura; isNew: boolean; more: number; replay: boolean; onDone: () => void; onSkipAll: () => void }) {
  const still = reducedMotion();
  const wind = still ? 0 : WIND[a.tier];
  const [shown, setShown] = useState(wind === 0);
  /** Seconds to add to the clock: skipping jumps it to the flash. */
  const skip = useRef(0);
  const ref = useCanvasLoop((ctx, t, w, h) => drawScene(ctx, a, still ? 4 : t + skip.current, w, h, wind), !still, [a.id]);
  useEffect(() => {
    if (wind === 0) return;
    const timer = window.setTimeout(() => setShown(true), wind * 1000);
    return () => window.clearTimeout(timer);
  }, [wind]);
  const tier = AURA_TIERS[a.tier];
  const jump = () => {
    skip.current = wind;
    setShown(true);
  };
  return (
    <div className="au-scene" role="dialog" aria-modal="true" aria-label={`Aura rolled: ${a.name}`} style={{ '--au': a.c, '--tier': tier.color } as CSSProperties}>
      <canvas ref={ref} className="au-scene__cv" aria-hidden="true" />
      {shown ? (
        <div className="au-scene__card">
          <p className="au-scene__tier">
            {tier.name}
            {isNew && !replay ? ' · New' : ''}
          </p>
          <p className="au-scene__k" aria-hidden="true">
            {a.kanji}
          </p>
          <h2>{a.name}</h2>
          <p className="au-scene__odds">{oddsText(a)}</p>
          <p className="au-scene__blurb">{a.blurb}</p>
        </div>
      ) : (
        <p className="au-scene__wait">{a.tier >= 5 ? 'Something is wrong with the dial…' : a.tier >= 4 ? 'The dial will not stop…' : 'The dial slows…'}</p>
      )}
      <div className="au-scene__btns">
        {shown ? (
          <>
            <button type="button" className="i-btn i-btn--sig" autoFocus onClick={onDone}>
              {more > 0 ? `Next (${more} more)` : replay ? 'Close' : 'Continue'}
            </button>
            {more > 0 && (
              <button type="button" className="i-btn" onClick={onSkipAll}>
                Skip the rest
              </button>
            )}
          </>
        ) : (
          <button type="button" className="i-btn" onClick={jump}>
            Skip
          </button>
        )}
      </div>
    </div>
  );
}
