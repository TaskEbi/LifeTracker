/**
 * Building blocks shared by the celebration scenes: seeded randomness, the told/timing types and
 * the small actors every sequence reuses (sparks, extruded words, captions, seals, stamps, embers,
 * ripples, rolling digits…). All of them animate transform and opacity only (see fx.css).
 */
import { useMemo, type CSSProperties, type ReactNode } from 'react';
import type { Achievement } from '../../../domain/progress/achievements';
import { BOSSES, type BossDef } from '../../../domain/progress/boss';
import { sectionInfo } from '../../../domain/sections';
import type { SectionId } from '../../../data/types';
import { Emblem } from '../Emblem';
// first, so the scene stylesheets (imported after this module) can refine its rules
import './fx.css';

export type Css = CSSProperties & Record<`--${string}`, string | number>;
export const range = (n: number) => Array.from({ length: n }, (_, i) => i);
export const pad2 = (n: number) => String(n).padStart(2, '0');
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9) >>> 0;
    return s / 4294967296;
  };
}
export const seedOf = (t: string) => [...t].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619), 2166136261);

export const bossOf = (c: { name: string; bossId?: string }): BossDef => BOSSES.find((b) => b.id === c.bossId) ?? BOSSES.find((b) => b.name === c.name) ?? BOSSES[0];
export const safeSection = (id: string) => {
  try {
    return sectionInfo(id as SectionId) ?? null;
  } catch {
    return null;
  }
};

/** What a sequence says: the calm card, the dialog name and the live-region announcement. */
export interface Told {
  kicker: string;
  title: string;
  line: string;
  /** CSS colour for the scene. */
  color: string;
}

/**
 * Length of a sequence and the moment of its main impact (camera shake), in ms. `shake`: 'soft'
 * for a gentle nudge, 'none' for scenes that should stay still (a rest day).
 */
export interface Timing {
  dur: number;
  hit: number;
  shake?: 'soft' | 'none';
}

// ─── sparks, streaks, extruded words, captions, seals ────────────────────────

/** Sparks and streaks bursting from the centre at the impact. */
export function Burst({ n, seed, spread = [150, 320], colors, delay }: { n: number; seed: number; spread?: [number, number]; colors: string[]; delay?: string }) {
  const parts = useMemo(() => {
    const r = rng(seed);
    return range(n).map((i) => {
      const streak = i % 3 === 0;
      const size = 7 + r() * 9;
      return {
        streak,
        style: {
          '--a': `${(i / n) * 360 + r() * 18}deg`,
          '--dist': `${spread[0] + r() * (spread[1] - spread[0])}px`,
          '--z': `${Math.round(-260 + r() * 640)}px`,
          '--r': `${Math.round(240 + r() * 540)}deg`,
          '--d': `${Math.round(r() * 70)}ms`,
          '--w': `${streak ? 34 + r() * 30 : size}px`,
          '--h': `${streak ? 3 : size}px`,
          '--sc': colors[i % colors.length],
        } as Css,
      };
    });
  }, [n, seed, spread, colors]);
  return (
    <div className="fx-at" style={delay ? ({ '--burst-delay': delay } as Css) : undefined}>
      {parts.map((p, i) => (
        <i key={i} className={`fx-shard${p.streak ? ' fx-shard--streak' : ''}`} style={p.style} />
      ))}
    </div>
  );
}

/** Text drawn as a few stacked layers in depth: an extruded 3D word. */
export function Extruded({ text, depth = 5, step = 4, className = '', back }: { text: string; depth?: number; step?: number; className?: string; back: string }) {
  return (
    <span className={`fx-xt ${className}`}>
      {range(depth).map((i) => (
        <span
          key={i}
          className="fx-xt__l"
          aria-hidden={i > 0 || undefined}
          style={i === 0 ? undefined : ({ transform: `translateZ(${-i * step}px)`, color: `color-mix(in srgb, ${back} ${100 - i * 13}%, #000)` } as Css)}
        >
          {text}
        </span>
      ))}
    </span>
  );
}

export function Caption({ chip, title, line, className = '' }: { chip: string; title: string; line?: ReactNode; className?: string }) {
  return (
    <div className={`fx-cap ${className}`}>
      <span className="fx-chip">{chip}</span>
      <h2 className="fx-title">{title}</h2>
      {line && <p className="fx-line">{line}</p>}
    </div>
  );
}

export function Seal({ chars, className = '' }: { chars: string; className?: string }) {
  return (
    <span className={`fx-seal ${className}`}>
      {[...chars].map((ch, i) => (
        <span key={i}>{ch}</span>
      ))}
    </span>
  );
}

export function Streaks({ n, seed }: { n: number; seed: number }) {
  const parts = useMemo(() => {
    const r = rng(seed);
    return range(n).map((i) => ({ '--a': `${(i / n) * 360 + r() * 12}deg`, '--d': `${Math.round(r() * 600)}ms`, '--w': `${70 + r() * 90}px` }) as Css);
  }, [n, seed]);
  return (
    <div className="fx-at">
      {parts.map((s, i) => (
        <i key={i} className="fx-streak" style={s} />
      ))}
    </div>
  );
}

export function Ink({ seed, n = 12, at, color }: { seed: number; n?: number; at?: [number, number]; color?: string }) {
  const drops = useMemo(() => {
    const r = rng(seed);
    return range(n).map((i) => {
      const size = 6 + r() * 16;
      return { '--a': `${(i / n) * 360 + r() * 25}deg`, '--dist': `${80 + r() * 150}px`, '--s': `${size}px`, '--d': `${Math.round(r() * 60)}ms` } as Css;
    });
  }, [seed, n]);
  return (
    <div className="fx-at" style={{ ...(at ? { marginLeft: at[0], marginTop: at[1] } : null), ...(color ? { '--ink': color } : null) } as Css}>
      {drops.map((d, i) => (
        <i key={i} className="fx-ink" style={d} />
      ))}
    </div>
  );
}

// ─── split-flap number, hanko, the 3D coin ───────────────────────────────────

export function Flap({ from, to, delay = 1150 }: { from: number | string; to: number | string; delay?: number }) {
  const w = Math.max(String(from).length, String(to).length);
  return (
    <span className="fx-flap" style={{ '--fw': `${w * 0.78 + 0.42}em`, '--fd': `${delay}ms` } as Css} aria-label={String(to)}>
      <span className="fx-flap__h fx-flap__h--top" aria-hidden="true">
        <span>{to}</span>
      </span>
      <span className="fx-flap__h fx-flap__h--bot" aria-hidden="true">
        <span>{from}</span>
      </span>
      <span className="fx-flap__h fx-flap__h--top fx-flap__f1" aria-hidden="true">
        <span>{from}</span>
      </span>
      <span className="fx-flap__h fx-flap__h--bot fx-flap__f2" aria-hidden="true">
        <span>{to}</span>
      </span>
    </span>
  );
}

export function Hanko({ chars }: { chars: string }) {
  return (
    <div className="fx-hanko">
      <span className="fx-hanko__f fx-hanko__top">
        <Seal chars={chars} className="fx-seal--top" />
      </span>
      <span className="fx-hanko__f fx-hanko__s1" />
      <span className="fx-hanko__f fx-hanko__s2" />
      <span className="fx-hanko__f fx-hanko__s3" />
      <span className="fx-hanko__f fx-hanko__s4" />
    </div>
  );
}

/** A thick emblem coin: outline layers stepping back, the face with a gloss sweep, the back. */
export function Coin({ a, size }: { a: Achievement; size: number }) {
  return (
    <div className="fx-coin">
      <div className="fx-coin__l fx-coin__back">
        <Emblem a={a} size={size} silhouette={`color-mix(in srgb, var(--t-${a.tier}) 70%, #000)`} />
      </div>
      {[-7.5, -6, -4.5, -3, -1.5].map((z, i) => (
        <div key={z} className="fx-coin__l" style={{ transform: `translateZ(${z}px)` }}>
          <Emblem a={a} size={size} silhouette={`color-mix(in srgb, var(--t-${a.tier}) ${38 + i * 6}%, #000)`} />
        </div>
      ))}
      <div className="fx-coin__l fx-coin__face">
        <Emblem a={a} size={size} ribbon={false} />
        <i className="fx-coin__gloss">
          <i className="fx-coin__shine" />
        </i>
      </div>
    </div>
  );
}

// ─── breaking a panel into 3D triangles (boss, secret card) ──────────────────

export interface Tri {
  x0: number;
  y0: number;
  clip: string;
  style: Css;
}

export function shatter(seed: number, PW: number, PH: number, cols = 3, rows = 3): { tris: Tri[]; cracks: string } {
  const r = rng(seed);
  const pt: [number, number][][] = range(rows + 1).map((j) =>
    range(cols + 1).map((i) => {
      const edgeX = i === 0 || i === cols;
      const edgeY = j === 0 || j === rows;
      return [(i / cols) * PW + (edgeX ? 0 : (r() - 0.5) * (PW / cols) * 0.6), (j / rows) * PH + (edgeY ? 0 : (r() - 0.5) * (PH / rows) * 0.6)];
    }),
  );
  const tris: [number, number][][] = [];
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const a = pt[j][i];
      const b = pt[j][i + 1];
      const c = pt[j + 1][i + 1];
      const d = pt[j + 1][i];
      if ((i + j) % 2) tris.push([a, b, c], [a, c, d]);
      else tris.push([a, b, d], [b, c, d]);
    }
  const cx = PW / 2;
  const cy = PH / 2;
  const out = tris.map((t) => {
    const gx = (t[0][0] + t[1][0] + t[2][0]) / 3;
    const gy = (t[0][1] + t[1][1] + t[2][1]) / 3;
    // grow each piece a pixel from its centre so no hairline seams show before it breaks
    const g = t.map(([x, y]) => {
      const dx = x - gx;
      const dy = y - gy;
      const l = Math.hypot(dx, dy) || 1;
      return [x + (dx / l) * 1.2, y + (dy / l) * 1.2] as [number, number];
    });
    const x0 = Math.floor(Math.min(...g.map((p) => p[0])));
    const y0 = Math.floor(Math.min(...g.map((p) => p[1])));
    const w = Math.ceil(Math.max(...g.map((p) => p[0]))) - x0;
    const h = Math.ceil(Math.max(...g.map((p) => p[1]))) - y0;
    const dx = gx - cx;
    const dy = gy - cy;
    const l = Math.hypot(dx, dy) || 1;
    const dist = 220 + r() * 260;
    return {
      x0,
      y0,
      clip: `polygon(${g.map(([x, y]) => `${(x - x0).toFixed(1)}px ${(y - y0).toFixed(1)}px`).join(', ')})`,
      style: {
        left: x0,
        top: y0,
        width: w,
        height: h,
        transformOrigin: `${(gx - x0).toFixed(1)}px ${(gy - y0).toFixed(1)}px`,
        '--x': `${Math.round((dx / l) * dist)}px`,
        '--y': `${Math.round((dy / l) * dist * 0.8)}px`,
        '--z': `${Math.round(-420 + r() * 560)}px`,
        '--ax': (r() - 0.5).toFixed(2),
        '--ay': (r() - 0.5).toFixed(2),
        '--r': `${Math.round((r() > 0.5 ? 1 : -1) * (200 + r() * 360))}deg`,
        '--d': `${Math.round(Math.hypot(dx, dy) * 0.35)}ms`,
      } as Css,
    };
  });
  const cracks = tris.map((t) => `M${t[0][0].toFixed(0)} ${t[0][1].toFixed(0)}L${t[1][0].toFixed(0)} ${t[1][1].toFixed(0)}L${t[2][0].toFixed(0)} ${t[2][1].toFixed(0)}Z`).join('');
  return { tris: out, cracks };
}

/** The same picture drawn once per shard, each clipped to its triangle. */
export function Shards({ tris, w, h, children }: { tris: Tri[]; w: number; h: number; children: ReactNode }) {
  return (
    <>
      {tris.map((t, i) => (
        <div key={i} className="fx-tri" style={{ ...t.style, clipPath: t.clip, WebkitClipPath: t.clip }}>
          <div className="fx-tri__in" style={{ left: -t.x0, top: -t.y0, width: w, height: h }}>
            {children}
          </div>
        </div>
      ))}
    </>
  );
}

// ─── new shared actors ───────────────────────────────────────────────────────

/** Embers or motes rising from below the anchor, drifting sideways. */
export function Embers({ n, seed, colors, spread = 280, rise = 360, delay = 0, className = '' }: { n: number; seed: number; colors: string[]; spread?: number; rise?: number; delay?: number; className?: string }) {
  const parts = useMemo(() => {
    const r = rng(seed);
    return range(n).map(
      (i) =>
        ({
          '--x': `${Math.round((r() - 0.5) * spread)}px`,
          '--dx': `${Math.round((r() - 0.5) * 70)}px`,
          '--rise': `${Math.round(rise * (0.6 + r() * 0.5))}px`,
          '--z': `${Math.round((r() - 0.5) * 400)}px`,
          '--d': `${delay + Math.round(r() * 1100)}ms`,
          '--s': `${3 + r() * 6}px`,
          '--ec': colors[i % colors.length],
        }) as Css,
    );
  }, [n, seed, colors, spread, rise, delay]);
  return (
    <div className={`fx-at ${className}`}>
      {parts.map((p, i) => (
        <i key={i} className="fx-ember" style={p} />
      ))}
    </div>
  );
}

/** Rings spreading over a floor plane (sand, water) from the anchor. */
export function Ripples({ n, delay, gap = 160, className = '', tilt = 72 }: { n: number; delay: number; gap?: number; className?: string; tilt?: number }) {
  return (
    <div className={`fx-at ${className}`}>
      {range(n).map((i) => (
        <i key={i} className="fx-ripple" style={{ '--d': `${delay + i * gap}ms`, '--tilt': `${tilt}deg` } as Css} />
      ))}
    </div>
  );
}

/** Confetti in depth: slips falling and turning, some in front of the subject, some behind. */
export function Confetti({ n, seed, colors, delay }: { n: number; seed: number; colors: string[]; delay: number }) {
  const parts = useMemo(() => {
    const r = rng(seed);
    return range(n).map(
      (i) =>
        ({
          '--x': `${Math.round((r() - 0.5) * 420)}px`,
          '--dx': `${Math.round((r() - 0.5) * 140)}px`,
          '--z': `${Math.round(-500 + r() * 800)}px`,
          '--r': `${Math.round(360 + r() * 720)}deg`,
          '--d': `${delay + Math.round(r() * 500)}ms`,
          '--cc': colors[i % colors.length],
          '--w': `${6 + r() * 6}px`,
        }) as Css,
    );
  }, [n, seed, colors, delay]);
  return (
    <div className="fx-at fx-at--top">
      {parts.map((p, i) => (
        <i key={i} className="fx-confetti" style={p} />
      ))}
    </div>
  );
}

/** Twinkling stars at seeded spots across the top of the screen (opacity only). */
export function Twinkles({ n, seed, top = 60 }: { n: number; seed: number; top?: number }) {
  const parts = useMemo(() => {
    const r = rng(seed);
    return range(n).map((i) => ({ left: `${4 + r() * 92}%`, top: `${3 + r() * top}%`, '--s': `${6 + r() * 10}px`, '--d': `${Math.round(r() * 900)}ms`, '--p': `${900 + Math.round(r() * 700)}ms`, '--i': i }) as Css);
  }, [n, seed, top]);
  return (
    <>
      {parts.map((p, i) => (
        <i key={i} className="fx-twk" style={p} />
      ))}
    </>
  );
}

/** Digits rolling up to a value like a counter (each digit a strip of 0–9 sliding into place). */
export function Roller({ value, delay, step = 90, className = '' }: { value: string; delay: number; step?: number; className?: string }) {
  const chars = [...value];
  let k = 0;
  return (
    <span className={`fx-roll ${className}`} aria-label={value}>
      {chars.map((ch, i) => {
        if (!/[0-9]/.test(ch)) {
          return (
            <span key={i} className="fx-roll__c" aria-hidden="true">
              {ch}
            </span>
          );
        }
        const n = Number(ch);
        const order = k++;
        return (
          <span key={i} className="fx-roll__c fx-roll__c--d" aria-hidden="true">
            <span className="fx-roll__ghost">0</span>
            {/* 0 up to the digit: a short strip keeps the texture small */}
            <span className="fx-roll__strip" style={{ '--n': n, '--d': `${delay + order * step}ms` } as Css}>
              {range(n + 1).map((j) => (
                <span key={j}>{j}</span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}

/** A big impact stamp: slammed from the viewer onto the scene at `--hit` + `delay`. */
export function Stamp({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <span className={`fx-stamp ${className}`} style={{ '--sd': `${delay}ms` } as Css}>
      {children}
    </span>
  );
}

/** Single-stroke glyphs in a 40×60 box: chalk writing and star constellations. */
export const GLYPHS: Record<string, [number, number][][]> = {
  L: [
    [
      [6, 4],
      [6, 56],
      [34, 56],
    ],
  ],
  V: [
    [
      [2, 4],
      [20, 56],
      [38, 4],
    ],
  ],
  '0': [
    [
      [20, 4],
      [35, 15],
      [36, 44],
      [20, 56],
      [5, 44],
      [4, 15],
      [20, 4],
    ],
  ],
  '1': [
    [
      [9, 15],
      [22, 4],
      [22, 56],
    ],
  ],
  '2': [
    [
      [5, 16],
      [19, 4],
      [34, 13],
      [33, 27],
      [5, 56],
      [36, 56],
    ],
  ],
  '3': [
    [
      [5, 7],
      [33, 7],
      [17, 27],
      [34, 38],
      [27, 54],
      [5, 52],
    ],
  ],
  '4': [
    [
      [28, 56],
      [28, 4],
      [4, 40],
      [38, 40],
    ],
  ],
  '5': [
    [
      [34, 4],
      [9, 4],
      [7, 26],
      [27, 23],
      [36, 40],
      [26, 56],
      [5, 52],
    ],
  ],
  '6': [
    [
      [32, 6],
      [10, 20],
      [4, 42],
      [18, 56],
      [34, 46],
      [30, 30],
      [6, 35],
    ],
  ],
  '7': [
    [
      [4, 5],
      [36, 5],
      [15, 56],
    ],
  ],
  '8': [
    [
      [20, 28],
      [7, 16],
      [20, 4],
      [33, 16],
      [20, 28],
      [5, 42],
      [20, 56],
      [35, 42],
      [20, 28],
    ],
  ],
  '9': [
    [
      [34, 24],
      [18, 30],
      [6, 18],
      [20, 4],
      [34, 14],
      [30, 56],
    ],
  ],
};
export const glyphPath = (strokes: [number, number][][], dx = 0, scale = 1) =>
  strokes.map((s) => s.map(([x, y], i) => `${i ? 'L' : 'M'}${(x * scale + dx).toFixed(1)} ${(y * scale).toFixed(1)}`).join('')).join('');
