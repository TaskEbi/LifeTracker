import type { CSSProperties, ReactNode } from 'react';
import type { BotArtProps, BotRegistry } from './types';
import './chassisHeavens.css';

/**
 * Heavens: gods and celestial beings as robots. Drawn in a richer style than the first bodies:
 * a dark ink outline taken from the body's own colour, layered gradients, rim lights and glows.
 */

const mix = (a: string, b: string, n: number) => `color-mix(in srgb, ${a} ${n}%, ${b})`;
const dk = (c: string, n = 35) => mix(c, '#000', 100 - n);
const lt = (c: string, n = 35) => mix(c, '#fff', 100 - n);
/** The outline: a very dark shade of the main colour, so it repaints too. */
const inkOf = (c: string) => mix(c, '#140c1c', 22);
const an = (still: boolean, cls: string) => (still ? undefined : cls);
const origin = (x: number, y: number, delay = 0): CSSProperties => ({ transformOrigin: `${x}px ${y}px`, ...(delay ? { animationDelay: `${delay}s` } : {}) });
const S = (k: string, w = 2.4) => ({ stroke: k, strokeWidth: w, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const });
const f = (n: number) => n.toFixed(1);
const rad = (d: number) => (d * Math.PI) / 180;
const GOLD: [number, string][] = [[0, '#fff3c4'], [0.3, '#f6cf5a'], [0.62, '#b47b22'], [0.82, '#f0c860'], [1, '#7c5010']];
const STEEL: [number, string][] = [[0, '#ffffff'], [0.45, '#c9ccd8'], [1, '#6c6f80']];
const PORCELAIN = '#fbf1ea';
const KANJI = '"Yu Mincho", "Hiragino Mincho ProN", "Noto Serif JP", serif';

type Stops = [number, string][];
function Lin({ id, stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1 }: { id: string; stops: Stops; x1?: number; y1?: number; x2?: number; y2?: number }) {
  return (
    <linearGradient id={id} x1={x1} y1={y1} x2={x2} y2={y2}>
      {stops.map(([o, s], i) => (
        <stop key={i} offset={o} stopColor={s} />
      ))}
    </linearGradient>
  );
}
function Rad({ id, stops, cx = 0.38, cy = 0.3, r = 0.85 }: { id: string; stops: Stops; cx?: number; cy?: number; r?: number }) {
  return (
    <radialGradient id={id} cx={cx} cy={cy} r={r}>
      {stops.map(([o, s], i) => (
        <stop key={i} offset={o} stopColor={s} />
      ))}
    </radialGradient>
  );
}
/** Lacquer or skin: light top-left, the colour, a deep shade. */
const shade = (c: string, hi = 32, lo = 42): Stops => [[0, lt(c, hi)], [0.5, c], [1, dk(c, lo)]];
const Blur = ({ id, s = 3 }: { id: string; s?: number }) => (
  <filter id={id} x="-60%" y="-60%" width="220%" height="220%">
    <feGaussianBlur stdDeviation={s} />
  </filter>
);
function Eyes({ still, children }: { still: boolean; children: ReactNode }) {
  return (
    <g className="dr-gaze">
      <g className={still ? undefined : 'i-blink'}>{children}</g>
    </g>
  );
}
const Shadow = ({ rx = 50, x = 100 }: { rx?: number; x?: number }) => <ellipse cx={x} cy="185" rx={rx} ry="5" fill="var(--fg)" opacity=".14" />;
/** Mirror a part drawn on the left onto the right. */
const Mirror = ({ children }: { children: ReactNode }) => <g transform="translate(200 0) scale(-1 1)">{children}</g>;

/** Flame-like spikes around (cx, cy) between two angles: hair, manes. */
function spikes(cx: number, cy: number, r1: number, r2: number, a0: number, a1: number, n: number, bend = 8) {
  const step = (a1 - a0) / n;
  const pt = (a: number, r: number) => `${f(cx + r * Math.cos(rad(a)))} ${f(cy + r * Math.sin(rad(a)))}`;
  let d = `M${f(cx)} ${f(cy)} L${pt(a0, r1)}`;
  for (let i = 0; i < n; i++) {
    const a = a0 + i * step;
    const len = r2 * (i % 2 ? 0.86 : 1);
    d += ` Q${pt(a + step * 0.15, r1 + (len - r1) * 0.7)} ${pt(a + step * 0.5 + bend, len)}`;
    d += ` Q${pt(a + step * 0.75, r1 + (len - r1) * 0.35)} ${pt(a + step, r1)}`;
  }
  return `${d}Z`;
}
/** Points of a spiral winding in from angle a0 (radians). */
function spiralPts(cx: number, cy: number, r: number, a0: number, dir = 1, turns = 1.3) {
  return Array.from({ length: 27 }, (_, i) => {
    const t = i / 26;
    const a = a0 + dir * t * turns * Math.PI * 2;
    const rr = r * (1 - t * 0.8);
    return `${f(cx + rr * Math.cos(a))} ${f(cy + rr * Math.sin(a))}`;
  });
}
const spiral = (cx: number, cy: number, r: number, dir = 1, turns = 1.3) => `M${spiralPts(cx, cy, r, 0, dir, turns).join(' L')}`;
/** A gust of wind: a long stroke that curls up into a spiral. */
function gust(x0: number, y0: number, cx: number, cy: number, r: number, dir = 1, turns = 1.3) {
  const pts = spiralPts(cx, cy, r, Math.atan2(y0 - cy, x0 - cx), dir, turns);
  return `M${f(x0 - dir * 40)} ${f(y0 + 6)} Q${f(x0 - dir * 18)} ${f(y0 - 4)} ${pts.join(' L')}`;
}
/** A zigzag of lightning from one point to another. */
function bolt(x1: number, y1: number, x2: number, y2: number, n = 5, amp = 5) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const o = i === 0 || i === n ? 0 : i % 2 ? amp : -amp * 0.8;
    pts.push(`${f(x1 + dx * t + nx * o)} ${f(y1 + dy * t + ny * o)}`);
  }
  return `M${pts.join(' L')}`;
}
/** Mitsudomoe: three commas swirling, centred on (cx, cy), radius r. */
function tomoe(cx: number, cy: number, r: number) {
  return [0, 120, 240]
    .map((deg) => {
      const P = (rr: number, a: number) => `${f(cx + r * rr * Math.cos(rad(a + deg)))} ${f(cy + r * rr * Math.sin(rad(a + deg)))}`;
      const out: string[] = [];
      const inn: string[] = [];
      for (let i = 0; i <= 16; i++) {
        const s = i / 16;
        const rc = 0.4 + 0.5 * (1 - (1 - s) ** 3);
        const w = 0.33 * (1 - s) ** 0.9;
        const a = -90 + 165 * s;
        out.push(P(Math.min(rc + w, 1), a));
        inn.unshift(P(rc - w, a));
      }
      const hx = f(cx + r * 0.4 * Math.cos(rad(deg - 90)));
      const hy = f(cy + r * 0.4 * Math.sin(rad(deg - 90)));
      const hr = f(r * 0.33);
      return `M${out.join(' L')} L${inn.join(' L')}Z M${f(+hx - r * 0.33)} ${hy} a${hr} ${hr} 0 1 1 ${f(r * 0.66)} 0 a${hr} ${hr} 0 1 1 ${f(-r * 0.66)} 0Z`;
    })
    .join(' ');
}
/** A puffy cloud: circles along a baseline, as one path. */
function cloud(x: number, y: number, w: number, h: number, n = 4) {
  const step = w / n;
  let d = `M${f(x)} ${f(y)}`;
  for (let i = 0; i < n; i++) {
    const r = step * (i % 2 ? 0.54 : 0.6) + (i % 3 === 1 ? h * 0.06 : 0);
    d += ` A${f(r)} ${f(r)} 0 1 1 ${f(x + step * (i + 1))} ${f(y)}`;
  }
  for (let i = n - 1; i >= 0; i--) {
    const r = step * 0.9;
    d += ` A${f(r)} ${f(r)} 0 0 1 ${f(x + step * i)} ${f(y)}`;
  }
  return `${d}Z`;
}

// ─── Moon Rabbit ────────────────────────────────────────────────────────────
function UEar({ x, y, rot, fold, k, uid, cls, still }: { x: number; y: number; rot: number; fold: number; k: string; uid: string; cls?: string; still: boolean }) {
  return (
    <g className={cls ? an(still, cls) : undefined} style={origin(x, y)}>
      <g transform={`translate(${x} ${y}) rotate(${rot})`}>
        <g transform={`translate(0 -24) rotate(${fold})`}>
          <path d="M-9 1 C-13 -9 -12 -19 -6 -25 C-2 -29 2 -29 6 -25 C12 -19 13 -9 9 1Z" fill={`url(#${uid}-fur)`} {...S(k, 2.4)} />
          <path d="M-4.5 -2 C-7 -9 -6.5 -17 -3 -22 C-1 -24 1 -24 3 -22 C6.5 -17 7 -9 4.5 -2Z" fill={`url(#${uid}-pink)`} />
          <path d="M-7 -14 C-6 -20 -3 -24 0 -25" fill="none" stroke="#fff" strokeWidth="1.3" opacity=".8" strokeLinecap="round" />
        </g>
        <path d="M-9 4 C-12 -6 -12 -16 -9 -24 L9 -24 C12 -16 12 -6 9 4Z" fill={`url(#${uid}-fur)`} {...S(k, 2.4)} />
        <path d="M-4.5 1 C-6.5 -7 -6.5 -15 -5 -21 L5 -21 C6.5 -15 6.5 -7 4.5 1Z" fill={`url(#${uid}-pink)`} />
        <path d="M-9 -11 h18" stroke={k} strokeWidth=".8" opacity=".4" />
        <circle cx="0" cy="-24" r="4.4" fill={`url(#${uid}-steel)`} {...S(k, 1.2)} />
        <circle cx="0" cy="-24" r="1.5" fill={k} />
      </g>
    </g>
  );
}

function Usagi({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const k = inkOf(c);
  const u = (s: string) => `url(#${uid}-${s})`;
  const O = S(k, 2.4);
  const band = mix(c2, '#1d1636', 26);
  const mochi = [
    [34, 132, 0],
    [24, 92, 1.2],
    [46, 52, 2.6],
    [178, 118, 0.6],
    [156, 132, 2],
    [62, 26, 3.4],
  ];
  return (
    <g>
      <defs>
        <Rad id={`${uid}-fur`} stops={[[0, '#ffffff'], [0.5, c], [1, mix(c, '#5b4a7a', 70)]]} />
        <Lin id={`${uid}-pink`} stops={[[0, lt(c2, 35)], [1, dk(c2, 12)]]} />
        <Lin id={`${uid}-coat`} stops={shade(c2, 25, 30)} x2={0.3} />
        <Lin id={`${uid}-steel`} stops={STEEL} x2={1} y2={1} />
        <Lin id={`${uid}-gold`} stops={GOLD} />
        <Rad id={`${uid}-eye`} cx={0.5} cy={0.75} r={0.75} stops={[[0, mix(c2, '#ff2a5c', 55)], [0.55, mix(c2, '#7a0030', 35)], [1, '#1a0a1c']]} />
        <Lin id={`${uid}-wood`} x2={1} y2={0} stops={[[0, '#7a4520'], [0.3, '#c98a4c'], [0.55, '#e7b57c'], [1, '#6e3c18']]} />
        <Rad id={`${uid}-moon`} cx={0.42} cy={0.38} r={0.7} stops={[[0, '#fffdf0'], [0.6, '#ffefb0'], [1, '#f1c95c']]} />
        <Blur id={`${uid}-gl`} s={4} />
      </defs>
      {mk === 3 && (
        <g>
          <circle cx="100" cy="82" r="80" fill="#fff1b8" opacity=".5" filter={u('gl')} className={an(still, 'bhv-pulse')} />
          <circle cx="100" cy="82" r="74" fill={u('moon')} stroke="#d9a93a" strokeWidth="1.5" />
          {[
            [62, 50, 11],
            [134, 44, 7],
            [146, 96, 12],
            [52, 112, 8],
            [120, 132, 6],
            [40, 76, 5],
          ].map(([x, y, r]) => (
            <g key={x}>
              <circle cx={x} cy={y} r={r} fill="#e9c66c" opacity=".55" />
              <path d={`M${x - r * 0.8} ${y + r * 0.3} A${r} ${r} 0 0 0 ${x + r * 0.6} ${y + r * 0.7}`} fill="none" stroke="#fffbe6" strokeWidth="1.2" opacity=".9" />
            </g>
          ))}
          <circle cx="100" cy="82" r="68" fill="none" stroke="#fff" strokeWidth="1" opacity=".5" strokeDasharray="2 5" />
        </g>
      )}
      <Shadow rx={44} />
      {mk >= 2 && <ellipse cx="160" cy="185" rx="27" ry="4" fill="var(--fg)" opacity=".12" />}
      <g className={an(still, 'bhv-bob')}>
        {/* ears */}
        <UEar x={86} y={62} rot={-14} fold={-30} k={k} uid={uid} still={still} />
        <UEar x={114} y={62} rot={10} fold={4} k={k} uid={uid} still={still} cls="bhv-twitch" />
        {/* legs and big feet */}
        {[84, 116].map((x) => (
          <g key={x}>
            <rect x={x - 7} y="162" width="14" height="12" rx="4" fill={u('steel')} {...S(k, 1.6)} />
            <path d={`M${x - 15} 178 C${x - 15} 169 ${x + 15} 169 ${x + 15} 178 C${x + 15} 184 ${x - 15} 184 ${x - 15} 178Z`} fill={u('fur')} {...O} />
            <path d={`M${x - 7} 176 v4 M${x} 175 v5 M${x + 7} 176 v4`} stroke={k} strokeWidth=".9" opacity=".45" strokeLinecap="round" />
            <ellipse cx={x - 5} cy="173.5" rx="5" ry="1.6" fill="#fff" opacity=".8" />
          </g>
        ))}
        {/* the happi coat */}
        <path d="M72 118 C66 130 64 150 66 167 Q100 172 134 167 C136 150 134 130 128 118 Q100 110 72 118Z" fill={u('coat')} {...O} />
        <path d="M95 115 L105 115 L108 148 L108 167 L92 167 L92 148Z" fill={u('fur')} />
        <path d="M92 150 L108 150 M100 138 V150" stroke={k} strokeWidth=".8" opacity=".4" />
        <circle cx="100" cy="131" r="6" fill={c2} opacity=".7" filter={u('gl')} className={an(still, 'bhv-pulse')} />
        <circle cx="100" cy="131" r="3.8" fill={lt(c2, 40)} {...S(k, 1.2)} />
        <circle cx="99" cy="130" r="1.3" fill="#fff" />
        <path d="M66 160 Q100 165 134 160 L134 167 Q100 172 66 167Z" fill={dk(c2, 30)} />
        {Array.from({ length: 9 }, (_, i) => {
          const x = 70 + i * 7.5;
          return <path key={x} d={`M${x - 2.4} ${165.5 + 1.6 * (1 - ((x - 100) / 34) ** 2)} l2.4 -2.4 l2.4 2.4 l-2.4 2.4Z`} fill="#fff" opacity=".85" />;
        })}
        <path d="M88 115 L95 115 L92 148 L92 167 L85 167 L85 148Z M112 115 L105 115 L108 148 L108 167 L115 167 L115 148Z" fill={band} {...S(k, 1.2)} />
        <text x="88.5" y="163" fontSize="6.5" fontFamily={KANJI} textAnchor="middle" fill={lt(c2, 70)}>月</text>
        <text x="111.5" y="163" fontSize="6.5" fontFamily={KANJI} textAnchor="middle" fill={lt(c2, 70)}>兎</text>
        <path d="M70 126 C68 138 68 150 70 158" fill="none" stroke={dk(c2, 35)} strokeWidth="1.4" opacity=".5" />
        <path d="M130 126 C132 138 132 150 130 158" fill="none" stroke={lt(c2, 50)} strokeWidth="1.4" opacity=".7" />
        {/* obi with a gold cord and a bow */}
        <path d="M67 145 Q100 151 133 145 L133 154 Q100 160 67 154Z" fill={band} {...S(k, 1.6)} />
        <path d="M67 149.5 Q100 155.5 133 149.5" fill="none" stroke="#f2c14e" strokeWidth="1.4" />
        <path d="M100 153 l-7 -4 v8Z M100 153 l7 -4 v8Z" fill={c2} {...S(k, 1.2)} />
        <circle cx="100" cy="153" r="2" fill="#f2c14e" {...S(k, 0.8)} />
        {/* left arm, hanging */}
        <path d="M76 118 C64 122 56 134 54 150 L70 155 C70 144 72 134 80 128Z" fill={u('coat')} {...O} />
        <path d="M54 150 L70 155" stroke={band} strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="61" cy="157" r="6.5" fill={u('fur')} {...S(k, 2)} />
        <path d="M58 161 v-2.5 M61.5 162 v-2.5" stroke={k} strokeWidth=".9" opacity=".5" />
        {/* right arm: waves, or holds the mallet up */}
        {mk === 1 ? (
          <g>
            <path d="M124 118 C136 114 144 104 146 94 L158 100 C154 114 144 124 130 130Z" fill={u('coat')} {...O} />
            <path d="M146 94 L158 100" stroke={band} strokeWidth="3.5" strokeLinecap="round" />
            <g className={an(still, 'bhv-sway')} style={origin(152, 98)}>
              <circle cx="152" cy="90" r="6.8" fill={u('fur')} {...S(k, 2)} />
              <ellipse cx="152" cy="91" rx="2.6" ry="2" fill={c2} />
              <circle cx="148.5" cy="86.5" r="1.2" fill={c2} />
              <circle cx="152" cy="85.5" r="1.2" fill={c2} />
              <circle cx="155.5" cy="86.5" r="1.2" fill={c2} />
            </g>
          </g>
        ) : (
          <g>
            <path d="M124 118 C134 116 139 112 141 106 L152 113 C147 123 138 128 128 130Z" fill={u('coat')} {...O} />
            <path d="M141 106 L152 113" stroke={band} strokeWidth="3.5" strokeLinecap="round" />
          </g>
        )}
        {/* head */}
        <path d="M100 56 C125 56 139 71 139 89 C139 107 122 119 100 119 C78 119 61 107 61 89 C61 71 75 56 100 56Z" fill={u('fur')} {...O} />
        <path d="M70 76 Q100 62 130 76" fill="none" stroke={k} strokeWidth=".8" opacity=".3" />
        <path d="M68 108 Q100 124 132 108" fill="none" stroke={k} strokeWidth="1" opacity=".25" />
        <path d="M72 72 C76 64 86 60 95 60" fill="none" stroke="#fff" strokeWidth="3" opacity=".9" strokeLinecap="round" />
        <path d="M133 80 C138 92 136 104 126 112" fill="none" stroke={lt(c2, 20)} strokeWidth="1.8" opacity=".8" strokeLinecap="round" />
        {[61, 139].map((x) => (
          <g key={x}>
            <circle cx={x} cy="92" r="8" fill={u('coat')} {...S(k, 1.8)} />
            <circle cx={x} cy="92" r="4.4" fill={u('steel')} {...S(k, 1)} />
            <circle cx={x} cy="92" r="1.3" fill={k} />
          </g>
        ))}
        <path d="M96 64 a6.5 6.5 0 1 0 8.5 8.5 a5 5 0 1 1 -8.5 -8.5Z" fill={u('gold')} {...S(k, 0.9)} />
        <Eyes still={still}>
          {happy ? (
            <path d="M76 94 Q85 84 94 94 M106 94 Q115 84 124 94" fill="none" stroke={k} strokeWidth="3.4" strokeLinecap="round" />
          ) : (
            <>
              {[85, 115].map((x) => (
                <g key={x}>
                  <ellipse cx={x} cy="92" rx="8" ry="9.5" fill={u('eye')} {...S(k, 1.6)} />
                  <ellipse cx={x} cy="95" rx="4.6" ry="4" fill={mix(c2, '#ff2a5c', 60)} opacity=".55" />
                  <circle cx={x + 3} cy="88" r="3" fill="#fff" />
                  <circle cx={x - 3} cy="96.5" r="1.3" fill="#fff" opacity=".85" />
                </g>
              ))}
              <path d="M76.6 89 Q85 79.5 93.6 88 M106.4 88 Q115 79.5 123.4 89 M76.6 89 l-2.2 -1.6 M123.4 89 l2.2 -1.6" fill="none" stroke={k} strokeWidth="1.8" strokeLinecap="round" />
            </>
          )}
        </Eyes>
        {[73, 127].map((x) => (
          <g key={x}>
            <ellipse cx={x} cy="105" rx="6.5" ry="4" fill={c2} opacity={happy ? 0.85 : 0.6} />
            <path d={`M${x - 3.5} 103 l-1.2 3.5 M${x} 103 l-1.2 3.5 M${x + 3.5} 103 l-1.2 3.5`} stroke={dk(c2, 30)} strokeWidth=".9" strokeLinecap="round" />
          </g>
        ))}
        <path d="M96.5 100 h7 l-3.5 3.6Z" fill={c2} {...S(k, 0.9)} />
        {happy ? (
          <>
            <path d="M93.5 106 h13 q-1 8 -6.5 8 q-5.5 0 -6.5 -8Z" fill="#5a1630" {...S(k, 1.2)} />
            <path d="M96.5 111.5 q3.5 -3 7 0 q-3.5 2.4 -7 0Z" fill={c2} />
          </>
        ) : (
          <path d="M100 103.6 v2.4 M94.5 106 q2.75 3 5.5 0 q2.75 3 5.5 0" fill="none" stroke={k} strokeWidth="1.3" strokeLinecap="round" />
        )}
        {/* the mallet, bigger than the rabbit */}
        {mk >= 2 && (
          <g className={an(still, 'bhv-pound')} style={origin(143, 112)}>
            <path d="M128 138 L170 62" stroke={k} strokeWidth="7" strokeLinecap="round" />
            <path d="M128 138 L170 62" stroke={u('wood')} strokeWidth="4.4" strokeLinecap="round" />
            <path d="M129 134 L166 67" stroke="#f3cf9e" strokeWidth="1" opacity=".8" />
            <g transform="translate(170 62) rotate(28.9)">
              <rect x="-18" y="-10" width="36" height="20" rx="5" fill={u('wood')} {...O} />
              <rect x="-13" y="-10" width="3" height="20" fill={u('steel')} {...S(k, 0.8)} />
              <rect x="10" y="-10" width="3" height="20" fill={u('steel')} {...S(k, 0.8)} />
              <ellipse cx="-18" cy="0" rx="2.6" ry="9" fill="#e7b57c" {...S(k, 1.2)} />
              <ellipse cx="18" cy="0" rx="2.6" ry="9" fill="#c98a4c" {...S(k, 1.2)} />
              <path d="M-8 -7 h14" stroke="#fff" strokeWidth="1.6" opacity=".6" strokeLinecap="round" />
              <text x="-1.5" y="4" fontSize="9" fontFamily={KANJI} textAnchor="middle" fill="#5a2c10" opacity=".75">餅</text>
            </g>
            <circle cx="143" cy="112" r="6.8" fill={u('fur')} {...S(k, 2)} />
            <path d="M139 109 q4 3 8 0 M139 113 q4 3 8 0" fill="none" stroke={k} strokeWidth=".9" opacity=".5" />
          </g>
        )}
      </g>
      {/* the usu mortar, with mochi in it */}
      {mk >= 2 && (
        <g>
          <path d="M138 152 C138 147 182 147 182 152 L178 166 C176 171 178 178 180 182 L140 182 C142 178 144 171 142 166Z" fill={u('wood')} {...O} />
          <path d="M150 158 C148 166 150 174 151 181 M168 158 C170 166 169 174 168 181" fill="none" stroke="#6b3a17" strokeWidth=".9" opacity=".6" />
          <ellipse cx="160" cy="152" rx="22" ry="4.6" fill="#7a4520" {...S(k, 1.6)} />
          <path d="M143 152 C145 139 175 139 177 152 C170 155.5 150 155.5 143 152Z" fill="#fffaf4" {...S(k, 1.4)} />
          <path d="M150 145 C154 141 162 141 166 143" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="166" cy="150" rx="7" ry="2.2" fill={c2} opacity=".35" />
          <path d="M141 166 Q160 171 179 166" fill="none" stroke={k} strokeWidth="5" strokeLinecap="round" />
          <path d="M141 166 Q160 171 179 166" fill="none" stroke="#ecd48c" strokeWidth="3.4" strokeLinecap="round" />
          <path d="M141 166 Q160 171 179 166" fill="none" stroke="#a88a3c" strokeWidth="3.4" strokeDasharray="1.2 2.6" />
          <circle cx="160" cy="174.5" r="4.6" fill="none" stroke="#5a2c10" strokeWidth="1.2" opacity=".75" />
          <text x="160" y="177.4" fontSize="7" fontFamily={KANJI} textAnchor="middle" fill="#5a2c10" opacity=".8">月</text>
          <path d="M141.5 179 Q160 182 178.5 179" fill="none" stroke="#4d4858" strokeWidth="2.2" />
        </g>
      )}
      {/* mochi floating up to the moon */}
      {mk === 3 &&
        mochi.map(([x, y, d]) => (
          <g key={x} className={an(still, 'bhv-rise')} style={origin(x, y, -d)}>
            <ellipse cx={x} cy={y} rx="7" ry="5" fill="#fffaf4" {...S(k, 1.3)} />
            <ellipse cx={x + 2} cy={y + 1.5} rx="3.5" ry="1.5" fill={c2} opacity=".35" />
            <path d={`M${x - 4} ${y - 2} q3 -2 6 -1`} fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
          </g>
        ))}
    </g>
  );
}

// ─── Fūjin ──────────────────────────────────────────────────────────────────
/** Strong god legs, wide apart, drawn on the left (mirror for the right). */
function GodLeg({ k, skin, metal, gold }: { k: string; skin: string; metal: string; gold: string }) {
  return (
    <g>
      <path d="M80 140 C90 142 96 148 94 154 L80 170 C74 170 64 166 63 160 C64 150 70 142 80 140Z" fill={skin} {...S(k, 2.4)} />
      <path d="M72 148 C76 146 82 146 86 148" fill="none" stroke="#fff" strokeWidth="1.4" opacity=".45" strokeLinecap="round" />
      <path d="M64 162 L80 168 L77 178 L60 178Z" fill={metal} {...S(k, 2.2)} />
      <path d="M64 167 L79 172" stroke={k} strokeWidth=".8" opacity=".5" />
      <circle cx="72" cy="162" r="6" fill={gold} {...S(k, 1.6)} />
      <circle cx="72" cy="162" r="2" fill={k} opacity=".7" />
      <path d="M50 184 C50 176 58 174 66 175 L80 177 C84 178 85 184 82 185 Z" fill={skin} {...S(k, 2.2)} />
      <path d="M52 184 l-3 2 M60 184.5 l-2 2.5 M68 185 l-1 2.5" stroke={k} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M56 178 C60 176 66 176 72 177" fill="none" stroke="#fff" strokeWidth="1.2" opacity=".5" />
    </g>
  );
}
/** Shoulder turbine: a fan in a ring. */
function Turbine({ x, y, r, k, uid, still, spin }: { x: number; y: number; r: number; k: string; uid: string; still: boolean; spin: boolean }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={`url(#${uid}-steel)`} {...S(k, 2.2)} />
      <circle cx={x} cy={y} r={r * 0.74} fill={k} />
      <g className={spin ? an(still, 'bhv-fan') : undefined} style={origin(x, y)}>
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <path key={a} transform={`rotate(${a} ${x} ${y})`} d={`M${x} ${y} C${x + r * 0.2} ${y - r * 0.3} ${x + r * 0.5} ${y - r * 0.62} ${x + r * 0.16} ${y - r * 0.7} C${x} ${y - r * 0.5} ${x - r * 0.05} ${y - r * 0.2} ${x} ${y}Z`} fill={`url(#${uid}-steel)`} opacity=".9" />
        ))}
      </g>
      <circle cx={x} cy={y} r={r * 0.24} fill={`url(#${uid}-gold)`} {...S(k, 1)} />
      <circle cx={x} cy={y} r={r * 0.86} fill="none" stroke="#fff" strokeWidth=".8" opacity=".35" strokeDasharray="1 2.5" />
    </g>
  );
}

function Fujin({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const k = inkOf(c);
  const u = (s: string) => `url(#${uid}-${s})`;
  const O = S(k, 2.4);
  const cloth = mix(c, '#1a2a55', 32);
  const leaves = [
    [22, 128, '#e76f51', 20],
    [34, 160, '#f4a261', -30],
    [178, 132, '#2a9d8f', 60],
    [186, 160, '#e9c46a', -10],
    [12, 100, '#8ab17d', 80],
    [188, 98, '#e76f51', 120],
    [160, 24, '#f4a261', 40],
    [40, 22, '#8ab17d', -60],
    [26, 186, '#2a9d8f', 10],
  ] as const;
  return (
    <g>
      <defs>
        <Lin id={`${uid}-skin`} stops={shade(c, 30, 40)} x2={0.4} />
        <Rad id={`${uid}-face`} stops={shade(c, 34, 38)} />
        <Lin id={`${uid}-hair`} stops={[[0, '#ffffff'], [0.5, c2], [1, dk(c2, 30)]]} />
        <Lin id={`${uid}-cloth`} stops={shade(cloth, 22, 40)} />
        <Lin id={`${uid}-steel`} stops={STEEL} x2={1} y2={1} />
        <Lin id={`${uid}-gold`} stops={GOLD} />
        <Rad id={`${uid}-bag`} cx={0.4} cy={0.25} r={0.9} stops={[[0, '#ffffff'], [0.45, c2], [1, mix(c2, c, 55)]]} />
        <Rad id={`${uid}-eye`} cx={0.4} cy={0.35} r={0.7} stops={[[0, '#fffbe0'], [0.7, '#ffe066'], [1, '#e0a800']]} />
        <Blur id={`${uid}-gl`} s={2.5} />
      </defs>
      {/* gusts behind */}
      {mk === 3 && (
        <g fill="none" strokeLinecap="round" className={an(still, 'bhv-drift')} style={origin(100, 100)}>
          {[
            gust(44, 150, 26, 140, 14, -1),
            gust(150, 162, 176, 150, 13, 1),
            gust(52, 64, 22, 60, 12, -1),
            gust(150, 70, 180, 66, 12, 1),
            'M8 118 Q40 110 60 118',
            'M140 120 Q166 112 194 120',
            'M10 176 Q40 168 64 174',
          ].map((d, i) => (
            <g key={i}>
              <path d={d} stroke={k} strokeWidth="5" opacity=".55" />
              <path d={d} stroke={lt(c2, 30)} strokeWidth="3" />
              <path d={d} stroke="#fff" strokeWidth="1" opacity=".9" />
            </g>
          ))}
        </g>
      )}
      <Shadow rx={58} />
      {/* the wind bag: limp across his back, or puffed full over his head */}
      {mk === 1 ? (
        <g className={an(still, 'bhv-sway')} style={origin(100, 90)}>
          <path d="M46 92 C40 70 44 46 62 34 C78 24 122 24 138 34 C156 46 160 70 154 92 C150 86 150 72 146 60 C138 44 120 38 100 40 C80 38 62 44 54 60 C50 72 50 86 46 92Z" fill={u('bag')} {...O} />
          <path d="M52 76 q5 -4 4 -10 M60 52 q6 0 8 -6 M84 34 q4 4 10 3 M116 34 q-4 4 -10 3 M140 52 q-6 0 -8 -6 M148 76 q-5 -4 -4 -10" fill="none" stroke={mix(c2, c, 45)} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M50 66 C52 52 60 40 72 33" fill="none" stroke="#fff" strokeWidth="2" opacity=".8" strokeLinecap="round" />
        </g>
      ) : (
        <g className={an(still, 'bhv-puff')} style={origin(100, 100)}>
          <path d="M52 102 C20 92 6 54 28 28 C50 2 150 2 172 28 C194 54 180 92 148 102 C152 84 156 60 140 44 C122 26 78 26 60 44 C44 60 48 84 52 102Z" fill={u('bag')} {...O} />
          <path d="M40 80 C34 60 42 40 60 28 M160 80 C166 60 158 40 140 28 M84 16 C96 13 110 13 122 16" fill="none" stroke={mix(c2, c, 45)} strokeWidth="1.2" />
          <path d="M30 60 C32 42 46 26 64 18" fill="none" stroke="#fff" strokeWidth="3" opacity=".85" strokeLinecap="round" />
          {[
            [36, 44],
            [164, 44],
          ].map(([x, y]) => (
            <g key={x}>
              <circle cx={x} cy={y} r="8" fill="none" stroke={mix(c2, c, 40)} strokeWidth="1.6" />
              <path d={tomoe(x, y, 6)} fill={mix(c2, c, 40)} />
            </g>
          ))}
          <path d="M100 20 m-6 0 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0" fill="none" stroke={mix(c2, c, 40)} strokeWidth="1.2" />
          {/* wind escaping the mouths of the bag */}
          <path d="M44 108 q-8 6 -18 4 M42 114 q-6 8 -16 10 M156 108 q8 6 18 4 M158 114 q6 8 16 10" fill="none" stroke={lt(c2, 20)} strokeWidth="1.8" strokeLinecap="round" opacity=".9" />
        </g>
      )}
      <g className={an(still, 'bhv-bob')}>
        {/* legs */}
        <GodLeg k={k} skin={u('skin')} metal={u('steel')} gold={u('gold')} />
        <Mirror>
          <GodLeg k={k} skin={u('skin')} metal={u('steel')} gold={u('gold')} />
        </Mirror>
        {/* skirt and sash */}
        <path d="M70 132 L130 132 L142 158 Q124 152 112 162 Q100 152 88 162 Q76 152 58 158Z" fill={u('cloth')} {...O} />
        <path d="M64 152 Q76 148 88 158 M112 158 Q124 148 136 152" fill="none" stroke="#f2c14e" strokeWidth="1.2" />
        <path d="M82 136 L78 154 M100 136 V152 M118 136 L122 154" stroke={k} strokeWidth=".9" opacity=".5" />
        <g className={an(still, 'bhv-sway')} style={origin(126, 136)}>
          <path d="M126 134 C138 140 150 142 160 138 L158 146 L164 152 C152 154 140 150 128 142Z" fill={u('hair')} {...S(k, 1.8)} />
          <path d="M126 138 C134 150 142 160 154 166 L150 172 L158 176 C142 176 130 162 122 142Z" fill={u('hair')} {...S(k, 1.8)} />
          <path d="M132 140 C140 144 148 145 156 143 M128 146 C134 156 140 164 148 168" fill="none" stroke={dk(c2, 30)} strokeWidth="1" />
          <circle cx="125" cy="138" r="5" fill={u('hair')} {...S(k, 1.6)} />
        </g>
        {/* torso */}
        <path d="M68 102 C62 114 66 126 72 134 L128 134 C134 126 138 114 132 102 C122 96 78 96 68 102Z" fill={u('skin')} {...O} />
        <path d="M76 110 Q88 120 99 111 M101 111 Q112 120 124 110" fill="none" stroke={dk(c, 45)} strokeWidth="1.4" />
        {[0, 1].map((r) =>
          [-1, 1].map((d) => <rect key={`${r}${d}`} x={d < 0 ? 89 : 101} y={118 + r * 7} width="10" height="5.5" rx="2" fill={dk(c, 12)} {...S(k, 0.8)} />),
        )}
        <path d="M74 104 C80 100 88 99 96 100" fill="none" stroke="#fff" strokeWidth="1.6" opacity=".55" strokeLinecap="round" />
        <circle cx="100" cy="110" r="8" fill={lt(c2, 20)} opacity=".8" filter={u('gl')} className={an(still, 'bhv-pulse')} />
        <circle cx="100" cy="110" r="5.5" fill={u('steel')} {...S(k, 1.2)} />
        <path d={spiral(100, 110, 4.2, 1, 1.4)} fill="none" stroke={c} strokeWidth="1.3" />
        <path d="M70 130 L130 130 L130 136 L70 136Z" fill={u('gold')} {...S(k, 1.4)} />
        <circle cx="100" cy="133" r="3.5" fill={c2} {...S(k, 1)} />
        {/* arms raised, fists gripping the bag */}
        {[0, 1].map((side) => {
          const arm = (
            <g>
              <path d="M66 104 C60 112 54 120 46 128 C40 128 34 122 36 116 C44 110 50 104 58 98Z" fill={u('skin')} {...O} />
              <path d="M38 120 C34 110 38 100 44 94 L56 98 C52 106 50 114 48 124Z" fill={u('skin')} {...O} />
              <path d="M39 106 L52 110 L50 118 L37 114Z" fill={u('gold')} {...S(k, 1.2)} />
              <path d="M41 92 C40 86 44 83 50 83 C56 83 60 86 59 92 L58 98 C54 101 46 101 42 98Z" fill={u('skin')} {...S(k, 2.2)} />
              <path d="M42 89 q2.2 -3 4.4 0 q2.2 -3 4.4 0 q2.2 -3 4.4 0 q2.2 -3 3.8 0" fill="none" stroke={k} strokeWidth="1" opacity=".7" />
              <path d="M43 93 C47 92 51 93 53 96" fill="none" stroke={k} strokeWidth="1.2" />
              <path d="M44 85 C47 83.5 52 83.5 55 84.5" fill="none" stroke="#fff" strokeWidth="1.2" opacity=".6" />
            </g>
          );
          return side ? <Mirror key={side}>{arm}</Mirror> : <g key={side}>{arm}</g>;
        })}
        {mk >= 2 && (
          <path d="M44 88 Q50 82 56 88 M144 88 Q150 82 156 88" fill="none" stroke={u('gold')} strokeWidth="2.6" strokeLinecap="round" />
        )}
        <Turbine x={63} y={103} r={12} k={k} uid={uid} still={still} spin={mk >= 2} />
        <Turbine x={137} y={103} r={12} k={k} uid={uid} still={still} spin={mk >= 2} />
        {/* wild hair behind the head */}
        <g className={an(still, 'bhv-sway-r')} style={origin(100, 70)}>
          <path d={spikes(100, 70, 26, 46, 150, 390, 11, 10)} fill={u('hair')} {...O} />
        </g>
        {/* head */}
        <path d="M66 74 C60 70 58 80 64 86 C66 90 70 88 70 84Z M134 74 C140 70 142 80 136 86 C134 90 130 88 130 84Z" fill={u('skin')} {...S(k, 1.8)} />
        <circle cx="64" cy="88" r="2.6" fill="none" stroke={u('gold')} strokeWidth="1.6" />
        <circle cx="136" cy="88" r="2.6" fill="none" stroke={u('gold')} strokeWidth="1.6" />
        <path d="M100 42 C120 42 132 56 132 72 C132 90 120 104 100 106 C80 104 68 90 68 72 C68 56 80 42 100 42Z" fill={u('face')} {...O} />
        <path d="M76 56 C82 48 92 45 100 45" fill="none" stroke="#fff" strokeWidth="2" opacity=".5" strokeLinecap="round" />
        <path d="M70 84 Q74 96 86 101 M130 84 Q126 96 114 101" fill="none" stroke={k} strokeWidth=".9" opacity=".45" />
        {/* forehead plate */}
        <path d="M90 46 L110 46 L106 56 L94 56Z" fill={u('gold')} {...S(k, 1.2)} />
        <text x="100" y="54.5" fontSize="7.5" fontFamily={KANJI} textAnchor="middle" fill={k}>風</text>
        {/* brows */}
        <path d="M72 64 Q82 52 96 62 L94 66 Q84 60 74 68Z M128 64 Q118 52 104 62 L106 66 Q116 60 126 68Z" fill={u('hair')} {...S(k, 1.4)} />
        <Eyes still={still}>
          {happy ? (
            <path d="M77 74 Q86 66 95 74 M105 74 Q114 66 123 74" fill="none" stroke={k} strokeWidth="3.2" strokeLinecap="round" />
          ) : (
            [86, 114].map((x) => (
              <g key={x}>
                <circle cx={x} cy="73" r="7.6" fill={u('eye')} {...S(k, 1.8)} />
                <circle cx={x + 1.5} cy="73.5" r="2.8" fill={k} />
                <circle cx={x - 2} cy="70.5" r="1.8" fill="#fff" />
              </g>
            ))
          )}
        </Eyes>
        <path d="M95 80 Q100 76 105 80 Q106 86 100 87 Q94 86 95 80Z" fill={dk(c, 15)} {...S(k, 1.2)} />
        <circle cx="97" cy="84.5" r="1" fill={k} />
        <circle cx="103" cy="84.5" r="1" fill={k} />
        {happy ? (
          <>
            <path d="M80 89 Q100 92 120 89 Q114 106 100 106 Q86 106 80 89Z" fill="#3a0f14" {...S(k, 1.6)} />
            <path d="M82 90 Q100 93 118 90 L116 94 Q100 97 84 94Z" fill="#fff" />
            <path d="M92 101 Q100 96 108 101 Q104 105 100 105 Q96 105 92 101Z" fill="#e5566b" />
          </>
        ) : (
          <>
            <path d="M80 89 Q100 100 120 89 Q112 101 100 101 Q88 101 80 89Z" fill="#3a0f14" {...S(k, 1.6)} />
            <path d="M83 90.5 Q100 98 117 90.5 L115 94 Q100 99.5 85 94Z" fill="#fff" />
            <path d="M88 94 l1.5 4 l1.5 -3.6 M109 95 l1.5 3.6 l1.5 -4" fill="#fff" stroke="none" />
          </>
        )}
        <circle cx="70" cy="80" r="1.4" fill={u('gold')} />
        <circle cx="130" cy="80" r="1.4" fill={u('gold')} />
      </g>
      {/* leaves torn from the trees */}
      {mk === 3 &&
        leaves.map(([x, y, col, r], i) => (
          <g key={i} className={an(still, 'bhv-leaf')} style={origin(x, y, -i * 0.45)}>
            <g transform={`translate(${x} ${y}) rotate(${r})`}>
              {i % 3 ? (
                <path d="M0 -9 L2.4 -3.6 L8 -6 L6 0 L9.5 2.4 L3.6 3.6 L4.8 8.4 L0 4.8 L-4.8 8.4 L-3.6 3.6 L-9.5 2.4 L-6 0 L-8 -6 L-2.4 -3.6Z" fill={col} {...S(k, 1.1)} />
              ) : (
                <path d="M0 -9 C6 -5 6 4 0 9 C-6 4 -6 -5 0 -9Z" fill={col} {...S(k, 1.1)} />
              )}
              <path d="M0 -6 V9 M0 0 l4 -3 M0 0 l-4 -3" fill="none" stroke={k} strokeWidth=".7" opacity=".6" />
            </g>
          </g>
        ))}
    </g>
  );
}

// ─── Raijin ─────────────────────────────────────────────────────────────────
function Raijin({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const k = inkOf(c);
  const u = (s: string) => `url(#${uid}-${s})`;
  const O = S(k, 2.4);
  const hair = mix(c, '#140a12', 18);
  const angles = Array.from({ length: 8 }, (_, i) => 160 + (220 / 7) * i);
  const drums = angles.map((a) => [100 + 82 * Math.cos(rad(a)), 104 + 82 * Math.sin(rad(a))] as const);
  return (
    <g>
      <defs>
        <Lin id={`${uid}-skin`} stops={shade(c, 30, 40)} x2={0.4} />
        <Rad id={`${uid}-face`} stops={shade(c, 32, 36)} />
        <Lin id={`${uid}-tiger`} stops={shade(c2, 30, 25)} />
        <Lin id={`${uid}-steel`} stops={STEEL} x2={1} y2={1} />
        <Lin id={`${uid}-gold`} stops={GOLD} />
        <Lin id={`${uid}-horn`} stops={[[0, '#fffaf0'], [0.6, '#efe2c0'], [1, '#b8a272']]} />
        <Rad id={`${uid}-hide`} cx={0.4} cy={0.35} r={0.7} stops={[[0, '#fff8e6'], [0.75, '#f1dfb4'], [1, '#c9ad72']]} />
        <Rad id={`${uid}-eye`} cx={0.4} cy={0.35} r={0.7} stops={[[0, '#ffffff'], [0.6, c2], [1, dk(c2, 30)]]} />
        <Lin id={`${uid}-storm`} stops={[[0, '#8a83a6'], [1, '#34304a']]} />
        <Blur id={`${uid}-gl`} s={2.2} />
      </defs>
      {/* storm clouds behind */}
      {mk === 3 && (
        <g className={an(still, 'bhv-drift')} style={origin(100, 100)}>
          {[
            [8, 70, 56, 4],
            [136, 70, 56, 4],
            [40, 36, 120, 6],
            [4, 128, 40, 3],
            [156, 128, 40, 3],
          ].map(([x, y, w, n], i) => (
            <g key={i}>
              <path d={cloud(x, y, w, 30, n)} fill={u('storm')} {...S('#1e1a2c', 1.8)} />
              <path d={cloud(x + 4, y, w - 8, 30, n)} fill="none" stroke="#b9b2d4" strokeWidth="1" opacity=".55" transform="translate(0 2)" />
            </g>
          ))}
          <g className={an(still, 'bhv-flash')} style={{ animationDelay: '-1.3s' }}>
            <path d={bolt(30, 70, 14, 100, 4, 4)} fill="none" stroke={c2} strokeWidth="2" strokeLinejoin="round" />
            <path d={bolt(170, 70, 188, 104, 4, 4)} fill="none" stroke={c2} strokeWidth="2" strokeLinejoin="round" />
          </g>
        </g>
      )}
      <Shadow rx={56} />
      {/* the ring of drums */}
      {mk >= 2 && (
        <g>
          <path d={`M${f(drums[0][0])} ${f(drums[0][1])} A82 82 0 1 1 ${f(drums[7][0])} ${f(drums[7][1])}`} fill="none" stroke={k} strokeWidth="6" />
          <path d={`M${f(drums[0][0])} ${f(drums[0][1])} A82 82 0 1 1 ${f(drums[7][0])} ${f(drums[7][1])}`} fill="none" stroke={u('gold')} strokeWidth="3.4" />
          {drums.map(([x, y], i) => (
            <g key={i} className={an(still, 'bhv-thump')} style={origin(x, y, -i * 0.21)}>
              <circle cx={x} cy={y} r="13.5" fill={dk(c, 25)} {...S(k, 2.2)} />
              <circle cx={x} cy={y} r="13.5" fill="none" stroke={lt(c, 30)} strokeWidth="1" strokeDasharray="10 30" transform={`rotate(200 ${x} ${y})`} />
              <circle cx={x} cy={y} r="11.2" fill="none" stroke={u('gold')} strokeWidth="1.8" strokeDasharray="0.1 3.4" strokeLinecap="round" />
              <circle cx={x} cy={y} r="9.2" fill={u('hide')} {...S(k, 1.2)} />
              <path d={tomoe(x, y, 7.2)} fill={i % 2 ? c : dk(c2, 10)} />
              <circle cx={x - 3} cy={y - 4} r="2" fill="#fff" opacity=".6" />
            </g>
          ))}
          {mk === 3 &&
            angles.slice(1).map((a1, i) => {
              const a0 = angles[i];
              const d = `M${Array.from({ length: 7 }, (_, j) => {
                const t = j / 6;
                const a = a0 + (a1 - a0) * (0.2 + 0.6 * t);
                const r = 82 + 9 * Math.sin(Math.PI * t) + (j % 2 ? 3.5 : -2) * (j > 0 && j < 6 ? 1 : 0);
                return `${f(100 + r * Math.cos(rad(a)))} ${f(104 + r * Math.sin(rad(a)))}`;
              }).join(' L')}`;
              return (
                <g key={i} className={an(still, 'bhv-flash')} style={{ animationDelay: `${-i * 0.43}s` }}>
                  <path d={d} fill="none" stroke={c2} strokeWidth="5" opacity=".9" filter={u('gl')} />
                  <path d={d} fill="none" stroke={c2} strokeWidth="2.6" strokeLinejoin="round" />
                  <path d={d} fill="none" stroke="#fff" strokeWidth="1" strokeLinejoin="round" />
                </g>
              );
            })}
        </g>
      )}
      {/* storm cloud he stands in */}
      <g className={an(still, 'bhv-bob')}>
        <GodLeg k={k} skin={u('skin')} metal={u('steel')} gold={u('gold')} />
        <Mirror>
          <GodLeg k={k} skin={u('skin')} metal={u('steel')} gold={u('gold')} />
        </Mirror>
        {/* tiger-skin loincloth */}
        <path d="M68 130 L132 130 L140 150 L134 156 L128 152 L122 162 L114 154 L106 164 L100 156 L94 164 L86 154 L78 162 L72 152 L66 156 L60 150Z" fill={u('tiger')} {...O} />
        {[
          'M72 134 q4 6 -1 12',
          'M86 134 q5 8 0 16',
          'M100 134 q5 7 -1 14',
          'M114 134 q5 8 0 16',
          'M128 134 q4 6 -1 12',
          'M79 147 q3 4 0 8',
          'M121 147 q3 4 0 8',
        ].map((d) => (
          <path key={d} d={d} fill="none" stroke={k} strokeWidth="2.4" strokeLinecap="round" />
        ))}
        {/* torso */}
        <path d="M68 100 C62 112 66 124 72 132 L128 132 C134 124 138 112 132 100 C122 94 78 94 68 100Z" fill={u('skin')} {...O} />
        <path d="M76 108 Q88 118 99 109 M101 109 Q112 118 124 108" fill="none" stroke={dk(c, 45)} strokeWidth="1.4" />
        <path d="M74 102 C80 98 88 97 96 98" fill="none" stroke="#fff" strokeWidth="1.6" opacity=".5" strokeLinecap="round" />
        {/* the drum in his chest */}
        <circle cx="100" cy="117" r="10" fill={c2} opacity=".75" filter={u('gl')} className={an(still, 'bhv-pulse')} />
        <circle cx="100" cy="117" r="8.5" fill={dk(c, 30)} {...S(k, 1.6)} />
        <circle cx="100" cy="117" r="6.2" fill={u('hide')} />
        <path d={tomoe(100, 117, 5)} fill={dk(c, 5)} />
        {/* rope belt */}
        <path d="M68 129 Q100 135 132 129" fill="none" stroke={k} strokeWidth="6" strokeLinecap="round" />
        <path d="M68 129 Q100 135 132 129" fill="none" stroke="#efe2c0" strokeWidth="4" strokeLinecap="round" />
        <path d="M68 129 Q100 135 132 129" fill="none" stroke="#b8a272" strokeWidth="4" strokeDasharray="1.4 2.6" />
        {/* arms raised, drumsticks out */}
        {[0, 1].map((side) => {
          const arm = (
            <g>
              <path d="M68 102 C60 108 52 116 44 122 C38 122 32 116 34 110 C42 104 50 98 60 94Z" fill={u('skin')} {...O} />
              <path d="M36 114 C30 104 32 92 38 84 L50 88 C46 96 46 106 46 118Z" fill={u('skin')} {...O} />
              <path d="M33 98 L47 102 L46 110 L32 106Z" fill={u('gold')} {...S(k, 1.2)} />
              {/* the bachi */}
              <path d="M44 82 L30 52" stroke={k} strokeWidth="6" strokeLinecap="round" />
              <path d="M44 82 L30 52" stroke="#d9a066" strokeWidth="3.6" strokeLinecap="round" />
              <circle cx="29" cy="50" r="4.4" fill={u('gold')} {...S(k, 1.6)} />
              <rect x="36" y="76" width="16" height="13" rx="5" fill={u('skin')} {...S(k, 2.2)} transform="rotate(-20 44 82)" />
              <path d="M39 79 l3 9 M43 78 l3 9 M47 77 l3 9" stroke={k} strokeWidth=".9" opacity=".5" transform="rotate(-6 44 82)" />
            </g>
          );
          return side ? <Mirror key={side}>{arm}</Mirror> : <g key={side}>{arm}</g>;
        })}
        {/* pauldrons */}
        {[63, 137].map((x) => (
          <g key={x}>
            <path d={`M${x - 14} 104 C${x - 14} 92 ${x + 14} 92 ${x + 14} 104 C${x + 8} 108 ${x - 8} 108 ${x - 14} 104Z`} fill={u('gold')} {...S(k, 2)} />
            <path d={`M${x - 10} 99 C${x - 6} 95 ${x + 2} 94 ${x + 6} 95`} fill="none" stroke="#fff" strokeWidth="1.2" opacity=".7" />
            <circle cx={x} cy="101" r="2" fill={c} {...S(k, 0.8)} />
          </g>
        ))}
        {/* wild dark mane */}
        <g className={an(still, 'bhv-sway')} style={origin(100, 70)}>
          <path d={spikes(100, 72, 26, 48, 150, 390, 12, -8)} fill={hair} {...O} />
          <path d={spikes(100, 72, 24, 40, 170, 370, 9, -8)} fill={lt(hair, 18)} />
        </g>
        {/* horns */}
        {[0, 1].map((side) => {
          const horn = (
            <g>
              <path d="M84 52 C76 46 68 34 72 16 C76 30 84 38 94 44Z" fill={u('horn')} {...S(k, 2)} />
              <path d="M76 38 l7 -2 M73 30 l6 -2" stroke={u('gold')} strokeWidth="2.2" strokeLinecap="round" />
            </g>
          );
          return side ? <Mirror key={side}>{horn}</Mirror> : <g key={side}>{horn}</g>;
        })}
        {/* head */}
        <path d="M67 76 C60 72 58 82 64 88 C66 92 70 90 70 86Z M133 76 C140 72 142 82 136 88 C134 92 130 90 130 86Z" fill={u('skin')} {...S(k, 1.8)} />
        <path d="M100 44 C120 44 132 58 132 74 C132 92 120 106 100 108 C80 106 68 92 68 74 C68 58 80 44 100 44Z" fill={u('face')} {...O} />
        <path d="M76 58 C82 50 92 47 100 47" fill="none" stroke="#fff" strokeWidth="2" opacity=".5" strokeLinecap="round" />
        <path d="M70 86 Q74 98 86 103 M130 86 Q126 98 114 103" fill="none" stroke={k} strokeWidth=".9" opacity=".45" />
        {/* forehead gem */}
        <path d="M100 48 L106 55 L100 62 L94 55Z" fill={u('gold')} {...S(k, 1.2)} />
        <path d="M100 51 L103 55 L100 59 L97 55Z" fill={c2} />
        {/* brows, scowling */}
        <path d="M70 64 L96 68 L95 72 L72 70Z M130 64 L104 68 L105 72 L128 70Z" fill={hair} {...S(k, 1.2)} />
        <Eyes still={still}>
          {happy ? (
            <path d="M77 78 Q86 70 95 78 M105 78 Q114 70 123 78" fill="none" stroke={k} strokeWidth="3.2" strokeLinecap="round" />
          ) : (
            [86, 114].map((x) => (
              <g key={x}>
                <path d={`M${x - 8} 76 Q${x} 68 ${x + 8} 76 Q${x} 84 ${x - 8} 76Z`} fill={u('eye')} {...S(k, 1.8)} />
                <circle cx={x} cy="76" r="2.6" fill={k} />
                <circle cx={x - 2.4} cy="74" r="1.2" fill="#fff" />
              </g>
            ))
          )}
        </Eyes>
        <path d="M95 82 Q100 78 105 82 Q106 88 100 89 Q94 88 95 82Z" fill={dk(c, 15)} {...S(k, 1.2)} />
        {happy ? (
          <>
            <path d="M78 91 Q100 94 122 91 Q116 110 100 110 Q84 110 78 91Z" fill="#3a0f14" {...S(k, 1.6)} />
            <path d="M80 92 Q100 95 120 92 L118 96 Q100 99 82 96Z" fill="#fff" />
            <path d="M88 92 l2 6 l2 -6 M108 92 l2 6 l2 -6" fill="#fff" />
            <path d="M90 105 Q100 99 110 105 Q105 109 100 109 Q95 109 90 105Z" fill="#e5566b" />
          </>
        ) : (
          <>
            <path d="M80 93 Q100 88 120 93 Q112 104 100 104 Q88 104 80 93Z" fill="#3a0f14" {...S(k, 1.6)} />
            <path d="M83 93.5 Q100 89.5 117 93.5 L115 97 Q100 94 85 97Z" fill="#fff" />
            <path d="M86 103 l2 -6 l2 5 M110 102 l2 -5 l2 6" fill="#fff" />
          </>
        )}
      </g>
      {/* the storm cloud he stands in */}
      {mk === 3 && (
        <g>
          <path d={cloud(12, 186, 176, 26, 7)} fill={u('storm')} {...S('#1e1a2c', 2)} />
          <path d={cloud(20, 186, 160, 26, 7)} fill="none" stroke="#b9b2d4" strokeWidth="1.2" opacity=".6" transform="translate(0 2.5)" />
        </g>
      )}
    </g>
  );
}

/** A cloud of overlapping puffs, outlined as one shape (the ink is a wider copy underneath). */
function Cloud({ x, y, w, n, k, fill, rim, ow = 2.2, seed = 0 }: { x: number; y: number; w: number; n: number; k: string; fill: string; rim?: string; ow?: number; seed?: number }) {
  const step = w / n;
  const cs = Array.from({ length: n }, (_, i) => {
    const r = step * (0.68 + 0.2 * Math.sin(i * 2.1 + seed));
    return [x + step * (i + 0.5), y - r * 0.5, r] as const;
  });
  const h = step * 0.5;
  const shape = () => (
    <>
      {cs.map(([cx, cy, r], i) => (
        <circle key={i} cx={f(cx)} cy={f(cy)} r={f(r)} />
      ))}
      <rect x={x} y={y - h} width={w} height={h} rx={h / 2} />
    </>
  );
  return (
    <g>
      <g fill={k} stroke={k} strokeWidth={ow * 2}>
        {shape()}
      </g>
      <g fill={fill}>{shape()}</g>
      {rim &&
        cs.map(([cx, cy, r], i) => (
          <path key={i} d={`M${f(cx - r * 0.72)} ${f(cy - r * 0.1)} A${f(r * 0.78)} ${f(r * 0.78)} 0 0 1 ${f(cx + r * 0.05)} ${f(cy - r * 0.76)}`} fill="none" stroke={rim} strokeWidth="1.3" strokeLinecap="round" opacity=".85" />
        ))}
    </g>
  );
}
/** A four-pointed glint. */
const glint = (x: number, y: number, r: number) => `M${x} ${y - r} Q${x + r * 0.16} ${y - r * 0.16} ${x + r} ${y} Q${x + r * 0.16} ${y + r * 0.16} ${x} ${y + r} Q${x - r * 0.16} ${y + r * 0.16} ${x - r} ${y} Q${x - r * 0.16} ${y - r * 0.16} ${x} ${y - r}Z`;

// ─── Tennyo ─────────────────────────────────────────────────────────────────
function Lotus({ x, y, s, k, uid }: { x: number; y: number; s: number; k: string; uid: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-20 2 C-12 -4 12 -4 20 2 C12 6 -12 6 -20 2Z" fill={`url(#${uid}-pad)`} {...S(k, 1.4 / s)} />
      {[-64, -32, 0, 32, 64].map((a) => (
        <path key={a} transform={`rotate(${a})`} d="M0 0 C-6 -6 -6 -16 0 -22 C6 -16 6 -6 0 0Z" fill={`url(#${uid}-lotus)`} {...S(k, 1.2 / s)} />
      ))}
      <ellipse cx="0" cy="-5" rx="6" ry="2.6" fill={`url(#${uid}-gold)`} {...S(k, 0.8 / s)} />
      {[-30, 30, 0].map((a) => (
        <path key={a} transform={`rotate(${a})`} d="M0 2 C-5 -4 -5 -12 0 -17 C5 -12 5 -4 0 2Z" fill={`url(#${uid}-lotus)`} {...S(k, 1.1 / s)} />
      ))}
      <path d="M-1.5 -13 C-1 -9 -1 -5 0 -1" fill="none" stroke="#fff" strokeWidth={1.2 / s} opacity=".8" strokeLinecap="round" />
    </g>
  );
}

function Tennyo({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const k = inkOf(c);
  const u = (s: string) => `url(#${uid}-${s})`;
  const O = S(k, 2.2);
  const T = S(k, 1.2);
  const hair = '#231d38';
  const ribbon = (d: string, key: string | number, w = 4.4) => (
    <g key={key}>
      <path d={d} fill="none" stroke={k} strokeWidth={w + 2.2} strokeLinecap="round" />
      <path d={d} fill="none" stroke={u('rib')} strokeWidth={w} strokeLinecap="round" />
      <path d={d} fill="none" stroke="#fff" strokeWidth={w * 0.25} strokeLinecap="round" opacity=".7" transform="translate(-0.9 -0.9)" />
    </g>
  );
  const feathers =
    mk === 3
      ? [0, 1].flatMap((row) =>
          [-1, 1].flatMap((d) =>
            Array.from({ length: 7 }, (_, j) => {
              const a = (row ? 46 : 34) + j * (row ? 17 : 20);
              const L = (row ? 50 : 72) - Math.abs(j - 3) * 2;
              return { d, a, L, row, key: `${row}${d}${j}` };
            }),
          ),
        )
      : [];
  return (
    <g>
      <defs>
        <Lin id={`${uid}-robe`} stops={shade(c, 30, 38)} x2={0.4} />
        <Lin id={`${uid}-panel`} stops={[[0, '#ffffff'], [0.6, c2], [1, mix(c2, c, 70)]]} />
        <Lin id={`${uid}-rib`} x2={1} y2={0.3} stops={[[0, mix(c2, '#ff5c9a', 35)], [0.3, lt(c2, 30)], [0.55, lt(c, 25)], [0.8, lt(c2, 20)], [1, mix(c2, '#ff5c9a', 35)]]} />
        <Lin id={`${uid}-gold`} stops={GOLD} />
        <Lin id={`${uid}-hair`} stops={[[0, mix(c, hair, 30)], [0.4, hair], [1, '#0e0b18']]} />
        <Rad id={`${uid}-skin`} cx={0.42} cy={0.35} r={0.75} stops={[[0, '#ffffff'], [0.7, PORCELAIN], [1, '#ecd6cc']]} />
        <Rad id={`${uid}-iris`} cx={0.4} cy={0.35} r={0.8} stops={[[0, '#ffffff'], [0.4, lt(c, 20)], [1, dk(c, 35)]]} />
        <Rad id={`${uid}-cloud`} cx={0.4} cy={0.3} r={0.8} stops={[[0, '#ffffff'], [0.6, lt(c2, 30)], [1, mix(c2, c, 70)]]} />
        <Lin id={`${uid}-wood`} x2={1} y2={1} stops={[[0, '#e2a25e'], [0.5, '#a65a24'], [1, '#5e2a0c']]} />
        <Lin id={`${uid}-feather`} stops={[[0, c], [0.28, lt(c, 50)], [0.6, '#ffffff'], [1, c2]]} />
        <Lin id={`${uid}-lotus`} stops={[[0, mix(c2, '#ff4f93', 45)], [0.7, lt(c2, 40)], [1, '#ffffff']]} />
        <Lin id={`${uid}-pad`} stops={[[0, '#7cc58a'], [1, '#2e7d4f']]} />
        <Blur id={`${uid}-gl`} s={2.6} />
      </defs>
      {/* the feather robe, trailing out behind */}
      {feathers.map(({ d, a, L, key }) => (
        <g key={key} transform={`translate(${100 + d * 8} 96) rotate(${d * a})`}>
          <path d={`M0 0 C${-L * 0.2} ${-L * 0.3} ${-L * 0.17} ${-L * 0.8} 0 ${-L} C${L * 0.17} ${-L * 0.8} ${L * 0.2} ${-L * 0.3} 0 0Z`} fill={u('feather')} {...S(k, 1.5)} />
          <path d={`M0 -3 L0 ${-L * 0.9}`} stroke={mix(c2, c, 50)} strokeWidth="1" />
          <path d={`M${-L * 0.12} ${-L * 0.55} L-1 ${-L * 0.5} M${L * 0.12} ${-L * 0.7} L1 ${-L * 0.64}`} stroke={k} strokeWidth=".8" opacity=".5" />
        </g>
      ))}
      {/* a ring of light behind the head */}
      <g className={an(still, 'bhv-spin')} style={origin(100, 56)}>
        <circle cx="100" cy="56" r="28" fill="none" stroke={u('gold')} strokeWidth="1.6" />
        <circle cx="100" cy="56" r="31.5" fill="none" stroke={c2} strokeWidth="1.4" strokeDasharray="1 4" strokeLinecap="round" />
      </g>
      {/* the hagoromo, looped high behind her */}
      <g className={an(still, 'bhv-sway')} style={origin(100, 110)}>
        {ribbon('M30 172 C12 156 20 132 44 126 C60 122 64 104 64 86 C64 48 84 18 100 18 C116 18 136 48 136 86 C136 104 140 122 156 126 C180 132 188 156 170 172 C164 177 158 176 156 172', 'main')}
      </g>
      <Shadow rx={46} />
      <g className={an(still, 'bhv-float')}>
        {/* hair, down her back */}
        <path d="M80 58 C76 72 78 86 72 96 C84 101 116 101 128 96 C122 86 124 72 120 58 C120 42 110 34 100 34 C90 34 80 42 80 58Z" fill={u('hair')} {...O} />
        {/* sleeves */}
        {[0, 1].map((side) => {
          const sleeve = (
            <g>
              <path d="M88 82 C76 86 68 98 64 116 C60 130 60 141 66 149 C74 153 84 149 88 141 C90 127 92 107 92 92Z" fill={u('robe')} {...O} />
              <path d="M64.5 141 C70 149.5 80 150 87.5 142" fill="none" stroke={c2} strokeWidth="3.4" />
              <path d="M64 136.5 C70 145 80 145.5 88 137.5" fill="none" stroke={u('gold')} strokeWidth="1.3" />
              <path d="M70 100 C68 112 66 124 66 134" fill="none" stroke="#fff" strokeWidth="1.4" opacity=".55" strokeLinecap="round" />
              <path d="M84 96 C82 112 82 128 84 140" fill="none" stroke={dk(c, 40)} strokeWidth="1" opacity=".5" />
              <circle cx="87" cy="85" r="3" fill={u('gold')} {...S(k, 0.9)} />
            </g>
          );
          return side ? <Mirror key={side}>{sleeve}</Mirror> : <g key={side}>{sleeve}</g>;
        })}
        {/* long skirt, into the cloud */}
        <path d="M86 110 C80 130 70 152 62 176 L138 176 C130 152 120 130 114 110Z" fill={u('robe')} {...O} />
        <path d="M93 112 L107 112 L113 176 L87 176Z" fill={u('panel')} {...T} />
        <path d="M82 134 L74 172 M118 134 L126 172 M88 122 L82 172 M112 122 L118 172" stroke={dk(c, 35)} strokeWidth=".9" opacity=".55" />
        <path d="M78 128 C74 142 70 156 68 168" fill="none" stroke="#fff" strokeWidth="1.4" opacity=".5" strokeLinecap="round" />
        {[128, 144, 160].map((y) => (
          <g key={y}>
            <circle cx="100" cy={y} r="3.4" fill="none" stroke={u('gold')} strokeWidth="1.2" />
            <circle cx="100" cy={y} r="1.2" fill={c} />
          </g>
        ))}
        {/* jacket and layered collar */}
        <path d="M86 80 C84 90 84 100 86 112 L114 112 C116 100 116 90 114 80 Q100 76 86 80Z" fill={u('robe')} {...O} />
        <path d="M89 79 L100 98 L111 79" fill="none" stroke={c2} strokeWidth="4.4" strokeLinejoin="round" />
        <path d="M92.5 79 L100 92.5 L107.5 79" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinejoin="round" />
        <path d="M94.5 79 L100 89 L105.5 79Z" fill={u('skin')} />
        <circle cx="100" cy="97" r="5" fill={lt(c, 20)} opacity=".9" filter={u('gl')} className={an(still, 'bhv-pulse')} />
        <path d="M100 93.5 L103 97 L100 100.5 L97 97Z" fill={lt(c, 40)} {...S(k, 0.9)} />
        {/* high obi, cord and tassels */}
        <path d="M84.5 104 Q100 108 115.5 104 L115 113 Q100 117 85 113Z" fill={u('gold')} {...S(k, 1.4)} />
        <path d="M85 108.5 Q100 112.5 115 108.5" fill="none" stroke={c2} strokeWidth="1.4" />
        <g className={an(still, 'bhv-sway-r')} style={origin(100, 112)}>
          <path d="M98 112 C97 122 96 132 95 140 M102 112 C103 122 104 132 105 140" fill="none" stroke={c2} strokeWidth="1.3" />
          <path d="M93 140 h4 l-.6 7 h-2.8Z M103 140 h4 l-.6 7 h-2.8Z" fill={u('gold')} {...S(k, 0.8)} />
        </g>
        <path d="M100 111 l-6 -4 v8Z M100 111 l6 -4 v8Z" fill={c2} {...S(k, 1)} />
        <circle cx="100" cy="111" r="2" fill={u('gold')} {...S(k, 0.8)} />
        {/* hands together, or playing the biwa */}
        {mk === 1 ? (
          <g>
            <path d="M89 100 C92 97 96 99 97.6 104 L92 108.5 C89.6 106.5 88.6 103 89 100Z M111 100 C108 97 104 99 102.4 104 L108 108.5 C110.4 106.5 111.4 103 111 100Z" fill={c2} {...T} />
            <path d="M100 88 C96.4 92.5 96 99.5 97.4 104.5 L102.6 104.5 C104 99.5 103.6 92.5 100 88Z" fill={u('skin')} {...T} />
            <path d="M100 90 V104" stroke={k} strokeWidth=".7" opacity=".5" />
          </g>
        ) : (
          <g>
            <g transform="translate(113 126) rotate(-38)">
              <path d="M-4 -16 L-3 -52 L3 -52 L4 -16Z" fill={u('wood')} {...S(k, 1.4)} />
              {[-24, -31, -38, -45].map((y) => (
                <rect key={y} x="-4.6" y={y} width="9.2" height="2.2" rx="1" fill="#efdcb2" {...S(k, 0.6)} />
              ))}
              <path d="M-3 -52 L-7 -64 L1 -66 L3 -52Z" fill="#5e2a0c" {...S(k, 1.2)} />
              <path d="M-9 -56 h13 M-10 -61 h13" stroke="#efdcb2" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M0 -24 C10 -24 15 -10 15 2 C15 14 8 20 0 20 C-8 20 -15 14 -15 2 C-15 -10 -10 -24 0 -24Z" fill={u('wood')} {...O} />
              <path d="M-14.6 -1 C-6 -3.6 6 -3.6 14.6 -1 L14.8 5.6 C6 3 -6 3 -14.8 5.6Z" fill="#2a1710" {...S(k, 0.8)} />
              <path d="M-9 1.5 q3 -3 6 0 M3 1.5 q3 -3 6 0" fill="none" stroke={u('gold')} strokeWidth="1" />
              <circle cx="0" cy="1" r="1.4" fill={u('gold')} />
              <path d="M-9 -11 a2.6 2.6 0 0 0 4.4 0 M4.6 -11 a2.6 2.6 0 0 0 4.4 0" fill="none" stroke="#2a1710" strokeWidth="1.3" />
              <rect x="-7" y="11" width="14" height="3.2" rx="1" fill={u('gold')} {...S(k, 0.8)} />
              <path d="M-3 12 L-1.6 -52 M-1 12 L-0.5 -52 M1 12 L0.5 -52 M3 12 L1.6 -52" stroke="#fff7e0" strokeWidth=".55" />
              <path d="M-11 -6 C-11 -14 -7 -19 -2 -21" fill="none" stroke="#fff" strokeWidth="1.6" opacity=".55" strokeLinecap="round" />
            </g>
            {/* left hand on the neck, right hand with the plectrum */}
            <ellipse cx="87" cy="95" rx="4.4" ry="3.6" fill={u('skin')} {...T} transform="rotate(-30 87 95)" />
            <path d="M118 117 L130 112 L127 124Z" fill="#f6ecd2" {...S(k, 1)} />
            <ellipse cx="121" cy="121" rx="4.6" ry="3.6" fill={u('skin')} {...T} />
          </g>
        )}
        {/* neck and head */}
        <path d="M96 72 L104 72 L104.5 81 L95.5 81Z" fill={u('skin')} {...T} />
        <path d="M95.5 79 Q100 81.5 104.5 79" fill="none" stroke={u('gold')} strokeWidth="1.6" />
        {/* hair loops and pins */}
        {[86, 114].map((x) => (
          <g key={x}>
            <circle cx={x} cy="25" r="9" fill="none" stroke={k} strokeWidth="9.2" />
            <circle cx={x} cy="25" r="9" fill="none" stroke={u('hair')} strokeWidth="6" />
            <path d={`M${x - 6} 19 A9 9 0 0 1 ${x + 3} 16.4`} fill="none" stroke={mix(c, '#ffffff', 50)} strokeWidth="1.3" opacity=".7" strokeLinecap="round" />
          </g>
        ))}
        <ellipse cx="100" cy="33" rx="9" ry="5" fill={u('hair')} {...T} />
        {[0, 1].map((side) => {
          const pin = (
            <g>
              <path d="M84 36 L68 42" stroke={u('gold')} strokeWidth="1.8" strokeLinecap="round" />
              <path d="M70 41 V52 M74 39.6 V48" stroke={u('gold')} strokeWidth=".8" />
              <circle cx="70" cy="53.5" r="1.6" fill={c} {...S(k, 0.6)} />
              <circle cx="74" cy="49.5" r="1.3" fill="#fff" {...S(k, 0.6)} />
              <circle cx="68" cy="42" r="2.2" fill={u('gold')} {...S(k, 0.7)} />
            </g>
          );
          return side ? <Mirror key={side}>{pin}</Mirror> : <g key={side}>{pin}</g>;
        })}
        <path d="M100 42 C110 42 117 49 117 58 C117 68 110 75 100 75 C90 75 83 68 83 58 C83 49 90 42 100 42Z" fill={u('skin')} {...O} />
        {/* gold seams: a porcelain face, mended with gold */}
        <path d="M84.5 63 C86 67 88 70.5 92 73 M113 66 l-2.6 2.4 l1 2.6" fill="none" stroke={u('gold')} strokeWidth=".8" />
        <Eyes still={still}>
          {happy ? (
            <path d="M88 61 Q92.5 56 97 61 M103 61 Q107.5 56 112 61" fill="none" stroke={k} strokeWidth="1.9" strokeLinecap="round" />
          ) : (
            [0, 1].map((side) => {
              const eye = (
                <g>
                  <path d="M88 60.5 Q92.5 56.5 97 60 Q92.5 63.4 88 60.5Z" fill="#fff" />
                  <circle cx="92.8" cy="60.2" r="2.5" fill={u('iris')} />
                  <circle cx="92.8" cy="60.4" r="1" fill={k} />
                  <circle cx="93.6" cy="59.3" r=".8" fill="#fff" />
                  <path d="M87.4 60.6 Q92.5 55.6 97.6 59.6 M87.4 60.6 l-1.8 -1.2" fill="none" stroke={k} strokeWidth="1.5" strokeLinecap="round" />
                </g>
              );
              return side ? <Mirror key={side}>{eye}</Mirror> : <g key={side}>{eye}</g>;
            })
          )}
        </Eyes>
        <path d="M88 53.5 Q92.5 51.5 97 53.5 M103 53.5 Q107.5 51.5 112 53.5" fill="none" stroke={k} strokeWidth=".9" strokeLinecap="round" />
        <ellipse cx="89" cy="66" rx="3.2" ry="1.6" fill="#ff8fb1" opacity={happy ? 0.7 : 0.45} />
        <ellipse cx="111" cy="66" rx="3.2" ry="1.6" fill="#ff8fb1" opacity={happy ? 0.7 : 0.45} />
        <path d="M100 63 l-.8 2.6 h1.6" fill="none" stroke={k} strokeWidth=".7" opacity=".45" />
        {happy ? <path d="M96.6 67.8 Q100 72.6 103.4 67.8Z" fill="#c2185b" {...S(k, 0.6)} /> : <path d="M97.4 68.6 Q100 67.4 102.6 68.6 Q100 70.9 97.4 68.6Z" fill="#e0457b" />}
        {/* bangs, side locks, crown */}
        <path d="M82 58 C82 46 90 39 100 39 C110 39 118 46 118 58 C114 52 110 49 106 50 C104 47 101 46 98 48 C92 46 86 50 82 58Z" fill={u('hair')} {...T} />
        <path d="M82.5 56 C80 64 81 73 84.5 81 C85.5 73 84.5 64 86 58Z M117.5 56 C120 64 119 73 115.5 81 C114.5 73 115.5 64 114 58Z" fill={u('hair')} {...T} />
        <path d="M88 45 C92 42 96 41 100 41" fill="none" stroke={mix(c, '#ffffff', 45)} strokeWidth="1.3" opacity=".7" strokeLinecap="round" />
        <circle cx="100" cy="52.5" r="1.4" fill="#e0457b" {...S(k, 0.5)} />
        <path d="M90 40 L92 33 L96 37 L100 29.5 L104 37 L108 33 L110 40Z" fill={u('gold')} {...S(k, 1)} />
        <circle cx="100" cy="35.5" r="1.8" fill={c} {...S(k, 0.6)} />
        <circle cx="83" cy="63" r="1.4" fill={u('gold')} />
        <circle cx="83" cy="66.5" r="1.4" fill="#fff" {...S(k, 0.5)} />
        <circle cx="117" cy="63" r="1.4" fill={u('gold')} />
        <circle cx="117" cy="66.5" r="1.4" fill="#fff" {...S(k, 0.5)} />
        {/* the cloud she rides */}
        <Cloud x={32} y={186} w={136} n={6} k={k} fill={u('cloud')} rim="#ffffff" seed={1} />
        <path d={spiral(58, 172, 6, 1, 1.2)} fill="none" stroke={u('gold')} strokeWidth="1.3" strokeLinecap="round" />
        <path d={spiral(142, 172, 6, -1, 1.2)} fill="none" stroke={u('gold')} strokeWidth="1.3" strokeLinecap="round" />
        {mk === 3 && (
          <>
            <Lotus x={48} y={172} s={0.9} k={k} uid={uid} />
            <Lotus x={152} y={172} s={0.9} k={k} uid={uid} />
            <Lotus x={100} y={184} s={0.7} k={k} uid={uid} />
          </>
        )}
      </g>
      {/* ribbons floating free */}
      {mk >= 2 && (
        <g className={an(still, 'bhv-sway-r')} style={origin(100, 110)}>
          {ribbon('M12 120 C20 100 40 102 38 116 C36 130 46 142 62 136', 'l', 3.4)}
          {ribbon('M188 98 C180 80 160 86 162 102 C164 118 154 128 138 124', 'r', 3.4)}
        </g>
      )}
      {mk === 3 &&
        [
          [26, 74, 0.45, 0],
          [176, 62, 0.4, 1.6],
          [18, 144, 0.38, 3],
        ].map(([x, y, s, d]) => (
          <g key={x} className={an(still, 'bhv-rise')} style={origin(x, y, -d)}>
            <Lotus x={x} y={y} s={s} k={k} uid={uid} />
          </g>
        ))}
      {mk === 3 &&
        [
          [40, 34, 4],
          [164, 30, 3.5],
          [186, 140, 3],
        ].map(([x, y, r], i) => <path key={i} d={glint(x, y, r)} fill="#fff" stroke={c} strokeWidth=".6" className={an(still, 'bhv-pulse')} style={{ animationDelay: `${-i * 0.7}s` }} />)}
    </g>
  );
}

// ─── Ryūjin ─────────────────────────────────────────────────────────────────
function Ryujin({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const k = inkOf(c);
  const u = (s: string) => `url(#${uid}-${s})`;
  const O = S(k, 2.3);
  const T = S(k, 1.2);
  const sea = mix(c, '#1b4f9c', 30);
  // fish-scale rows on the breastplate
  let scales = '';
  for (let r = 0; r < 5; r++) for (let i = 0; i < 8; i++) {
    const x = 72 + i * 8 + (r % 2 ? 4 : 0);
    const y = 94 + r * 6;
    scales += `M${x - 4} ${y} A4 4 0 0 0 ${x + 4} ${y} `;
  }
  // seigaiha (waves) along the hem
  let waves = '';
  for (let r = 0; r < 3; r++) for (let i = 0; i < 12; i++) {
    const x = 54 + i * 8 + (r % 2 ? 4 : 0);
    const y = 168 + r * 5;
    for (const q of [6, 4, 2]) waves += `M${x - q} ${y + 6} A${q} ${q} 0 0 1 ${x + q} ${y + 6} `;
  }
  const foam = [
    [26, 44, -60],
    [40, 30, -44],
    [56, 21, -30],
    [74, 14, -16],
    [92, 10, -4],
    [110, 10, 8],
    [128, 14, 22],
    [143, 22, 36],
    [155, 34, 60],
  ];
  const jewel = (x: number, id: string, ch: string) => (
    <g className={an(still, 'bhv-orbit')} style={origin(x, 76, x > 100 ? -2.5 : 0)}>
      <circle cx={x} cy="78" r="14" fill={id === 'kan' ? '#9fe3ff' : c2} opacity=".7" filter={u('gl')} />
      <path d={`M${x} 60 C${x + 5} 66 ${x + 12} 70 ${x + 12} 78 C${x + 12} 85 ${x + 6} 90 ${x} 90 C${x - 6} 90 ${x - 12} 85 ${x - 12} 78 C${x - 12} 70 ${x - 5} 66 ${x} 60Z`} fill={u(id)} {...S(k, 1.6)} />
      <text x={x} y="84" fontSize="9" fontFamily={KANJI} textAnchor="middle" fill={id === 'kan' ? '#1e6aa0' : dk(c2, 50)} opacity=".8">
        {ch}
      </text>
      <path d={`M${x - 7} 72 C${x - 6} 68 ${x - 3} 66 ${x - 1} 65`} fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      <path d={`M${x - 13} 86 C${x - 18} 80 ${x - 16} 72 ${x - 12} 68 M${x + 13} 86 C${x + 18} 80 ${x + 16} 72 ${x + 12} 68`} fill="none" stroke={u('gold')} strokeWidth="1.6" strokeLinecap="round" />
    </g>
  );
  return (
    <g>
      <defs>
        <Lin id={`${uid}-scale`} stops={shade(c, 30, 40)} x2={0.4} />
        <Rad id={`${uid}-face`} stops={shade(c, 36, 36)} />
        <Lin id={`${uid}-muzzle`} stops={[[0, lt(c, 45)], [1, lt(c, 5)]]} />
        <Lin id={`${uid}-robe`} stops={shade(c, 22, 50)} x2={0.3} />
        <Lin id={`${uid}-gold`} stops={[[0, lt(c2, 65)], [0.3, c2], [0.62, dk(c2, 35)], [0.82, lt(c2, 20)], [1, dk(c2, 50)]]} />
        <Lin id={`${uid}-mane`} stops={[[0, '#ffffff'], [0.5, lt(c, 55)], [1, lt(c, 20)]]} />
        <Rad id={`${uid}-eye`} cx={0.5} cy={0.4} r={0.7} stops={[[0, '#fffbe0'], [0.6, lt(c2, 20)], [1, dk(c2, 30)]]} />
        <Rad id={`${uid}-pearl`} cx={0.38} cy={0.32} r={0.8} stops={[[0, '#ffffff'], [0.55, '#dff6f4'], [1, lt(c, 30)]]} />
        <Rad id={`${uid}-kan`} cx={0.38} cy={0.32} r={0.8} stops={[[0, '#ffffff'], [0.5, '#bfeeff'], [1, '#3d9ad6']]} />
        <Rad id={`${uid}-man`} cx={0.38} cy={0.32} r={0.8} stops={[[0, '#fffbe6'], [0.5, lt(c2, 20)], [1, dk(c2, 30)]]} />
        <Lin id={`${uid}-sea`} stops={[[0, lt(sea, 15)], [0.6, sea], [1, dk(sea, 45)]]} />
        <clipPath id={`${uid}-chest`}>
          <path d="M72 90 C66 102 68 116 74 124 L126 124 C132 116 134 102 128 90 C116 84 84 84 72 90Z" />
        </clipPath>
        <clipPath id={`${uid}-hem`}>
          <path d="M74 120 C70 142 62 162 56 182 L144 182 C138 162 130 142 126 120Z" />
        </clipPath>
        <Blur id={`${uid}-gl`} s={3} />
      </defs>
      {/* the great wave, and the palace under the sea */}
      {mk === 3 && (
        <g>
          <g className={an(still, 'bhv-ripple')} style={origin(60, 120)}>
            <path d="M4 196 L4 118 C4 70 28 30 66 16 C98 4 134 10 154 30 C160 36 160 44 154 46 C150 40 140 34 128 34 C112 34 100 42 96 54 C104 50 112 54 110 60 C100 60 88 58 80 66 C70 78 66 100 66 124 C66 150 60 176 56 196Z" fill={u('sea')} {...S(dk(sea, 60), 2.2)} />
            <path d="M14 190 C12 124 18 76 46 44 M30 190 C28 132 34 92 58 62 M44 190 C42 140 48 104 70 76 M30 52 C58 28 100 18 138 26" fill="none" stroke="#bfe3ff" strokeWidth="1.1" opacity=".6" />
            <path d="M8 104 C8 66 30 32 66 19 C98 8 134 13 152 31" fill="none" stroke="#f4f8fb" strokeWidth="3.4" strokeLinecap="round" />
            <path d="M96 54 C104 50 112 54 110 60" fill="none" stroke="#f4f8fb" strokeWidth="2" strokeLinecap="round" />
            {foam.map(([x, y, a]) => (
              <path key={x} transform={`rotate(${a} ${x} ${y})`} d={`M${x} ${y} c-1 -5 4 -8 8 -5 c-3 0 -4 2 -3 4 c2 -2 5 -1 5 1`} fill="none" stroke="#f4f8fb" strokeWidth="1.8" strokeLinecap="round" />
            ))}
            {[
              [50, 10, 1.6],
              [34, 22, 1.2],
              [164, 40, 1.4],
              [168, 30, 1],
              [16, 50, 1.4],
              [84, 6, 1.2],
            ].map(([x, y, r]) => (
              <circle key={x} cx={x} cy={y} r={r} fill="#f4f8fb" />
            ))}
          </g>
          <g>
            <path d="M146 152 C150 144 160 146 162 150 C166 142 182 142 186 150 C190 146 196 148 196 152Z" fill="#c95a6a" {...S(k, 1.4)} />
            <rect x="154" y="128" width="36" height="22" fill="#f5ecd8" {...S(k, 1.4)} />
            <path d="M158 128 V150 M166 128 V150 M178 128 V150 M186 128 V150" stroke="#d1453b" strokeWidth="2.2" />
            <path d="M168 150 V140 Q172 135 176 140 V150Z" fill={dk(c, 50)} />
            <path d="M148 131 Q172 121 196 131 L192 124 Q172 115 152 124Z" fill={lt(c, 25)} {...S(k, 1.4)} />
            <rect x="162" y="108" width="20" height="15" fill="#d1453b" {...S(k, 1.3)} />
            <path d="M166 112 h12 M166 116 h12" stroke="#f5ecd8" strokeWidth="1.2" />
            <path d="M154 111 Q172 102 190 111 L186 104 Q172 96 158 104Z" fill={lt(c, 25)} {...S(k, 1.3)} />
            <path d="M172 98 V88" stroke={u('gold')} strokeWidth="1.6" />
            <circle cx="172" cy="87" r="2.2" fill={u('gold')} {...S(k, 0.7)} />
            <path d="M150 124 l-2 3 M194 124 l2 3 M158 104 l-2 2.4 M186 104 l2 2.4" stroke={u('gold')} strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="160" cy="138" r="2.2" fill="#ff6b5a" {...S(k, 0.6)} />
            <circle cx="184" cy="138" r="2.2" fill="#ff6b5a" {...S(k, 0.6)} />
          </g>
          {[
            [150, 92, 2.4, 0],
            [190, 80, 1.8, 1.4],
            [160, 70, 1.4, 2.6],
            [184, 120, 2, 3.4],
          ].map(([x, y, r, d]) => (
            <circle key={x} cx={x} cy={y} r={r} fill="none" stroke="#dff6ff" strokeWidth="1" className={an(still, 'bhv-rise')} style={origin(x, y, -d)} />
          ))}
        </g>
      )}
      <Shadow rx={52} />
      <g className={an(still, 'bhv-bob')}>
        {/* tail, curling out on the left */}
        <path d="M72 164 C50 172 28 164 22 146 C18 134 26 122 36 126 C30 134 34 148 50 150 C60 152 68 150 76 146Z" fill={u('scale')} {...O} />
        <path d="M30 144 l-6 -2 M28 136 l-6 -4 M30 128 l-5 -6 M40 156 l-4 4 M52 160 l-2 6" stroke={u('gold')} strokeWidth="3" strokeLinecap="round" />
        <path d="M36 140 C40 146 48 148 56 148 M60 154 C52 156 44 154 38 150" fill="none" stroke={dk(c, 40)} strokeWidth="1" />
        {/* long robe */}
        <path d="M74 120 C70 142 62 162 56 182 L144 182 C138 162 130 142 126 120Z" fill={u('robe')} {...O} />
        <g clipPath={u('hem')}>
          <rect x="50" y="166" width="100" height="20" fill={dk(c, 45)} />
          <path d={waves} fill="none" stroke={c2} strokeWidth=".8" />
        </g>
        <path d="M60 166 Q100 170 140 166" fill="none" stroke={u('gold')} strokeWidth="2" />
        <path d="M90 124 L110 124 L116 166 L84 166Z" fill={dk(c, 30)} {...T} />
        <path d="M100 128 V162 M92 136 h16 M90 148 h20" stroke={u('gold')} strokeWidth="1" opacity=".8" />
        <path d="M78 130 C74 146 68 160 64 174" fill="none" stroke="#fff" strokeWidth="1.4" opacity=".35" strokeLinecap="round" />
        {/* clawed feet */}
        {[84, 116].map((x) => (
          <g key={x}>
            <path d={`M${x - 9} 185 C${x - 9} 178 ${x + 9} 178 ${x + 9} 185Z`} fill={u('scale')} {...S(k, 1.8)} />
            <path d={`M${x - 7} 185 l-2 2.4 M${x} 185.5 v2.6 M${x + 7} 185 l2 2.4`} stroke={u('gold')} strokeWidth="2" strokeLinecap="round" />
          </g>
        ))}
        {/* big sleeves */}
        {[0, 1].map((side) => {
          const sleeve = (
            <g>
              <path d="M76 92 C62 96 50 108 46 126 C42 142 44 154 50 160 C58 161 66 157 72 150 C74 136 78 118 82 104Z" fill={u('robe')} {...O} />
              <path d="M50 160 C58 161 66 157 72 150" fill="none" stroke={u('gold')} strokeWidth="3" />
              <path d="M48 150 C56 152 64 149 70 143" fill="none" stroke={c2} strokeWidth="1" opacity=".7" />
              <path d="M54 112 C50 124 48 138 49 150" fill="none" stroke="#fff" strokeWidth="1.4" opacity=".35" strokeLinecap="round" />
            </g>
          );
          return side ? <Mirror key={side}>{sleeve}</Mirror> : <g key={side}>{sleeve}</g>;
        })}
        {/* scaled breastplate */}
        <path d="M72 90 C66 102 68 116 74 124 L126 124 C132 116 134 102 128 90 C116 84 84 84 72 90Z" fill={u('scale')} {...O} />
        <g clipPath={u('chest')}>
          <path d={scales} fill="none" stroke={dk(c, 45)} strokeWidth=".9" />
          <path d={scales} fill="none" stroke={lt(c, 40)} strokeWidth=".6" opacity=".6" transform="translate(0 -1)" />
        </g>
        {/* pauldrons, layered like scales */}
        {[0, 1].map((side) => {
          const pad = (
            <g>
              <path d="M78 88 C64 82 50 88 44 100 C52 97 62 99 68 104Z" fill={u('scale')} {...S(k, 1.8)} />
              <path d="M76 95 C64 92 54 98 49 108 C57 105 65 107 70 112Z" fill={u('scale')} {...S(k, 1.8)} />
              <path d="M44 100 C52 97 62 99 68 104 M49 108 C57 105 65 107 70 112" fill="none" stroke={u('gold')} strokeWidth="1.6" />
              <path d="M52 92 C58 88 66 87 72 88" fill="none" stroke="#fff" strokeWidth="1.2" opacity=".6" strokeLinecap="round" />
            </g>
          );
          return side ? <Mirror key={side}>{pad}</Mirror> : <g key={side}>{pad}</g>;
        })}
        {/* belt */}
        <path d="M73 121 Q100 127 127 121 L126 130 Q100 136 74 130Z" fill={u('gold')} {...S(k, 1.4)} />
        {/* the pearl held in both claws */}
        <circle cx="100" cy="121" r="14" fill="#dff6f4" opacity=".7" filter={u('gl')} className={an(still, 'bhv-pulse')} />
        {[
          [88, 112, -1],
          [112, 112, 1],
          [100, 102, 0],
        ].map(([x, y, d]) => (
          <path key={x} d={`M${x} ${y + 8} C${x + d * 6 - 4} ${y + 2} ${x + d * 4 - 2} ${y - 4} ${x + d * 3} ${y - 9} C${x + d * 3 + 4} ${y - 3} ${x + 4} ${y + 2} ${x} ${y + 8}Z`} fill={u('gold')} {...S(k, 1)} opacity=".95" />
        ))}
        <path d="M100 106 C104 111 112 114 112 122 C112 129 106 134 100 134 C94 134 88 129 88 122 C88 114 96 111 100 106Z" fill={u('pearl')} {...S(k, 1.6)} />
        <path d="M94 116 C95 113 97 111 99 110" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
        {[0, 1].map((side) => {
          const claw = (
            <g>
              <path d="M80 116 C84 112 91 114 92 120 C92 127 87 131 81 129 C77 127 77 120 80 116Z" fill={u('scale')} {...S(k, 1.8)} />
              <path d="M90 116 l4 -1 M91.6 121 l4 0 M90.6 126 l3.6 1.4" stroke="#f6ecd2" strokeWidth="1.8" strokeLinecap="round" />
            </g>
          );
          return side ? <Mirror key={side}>{claw}</Mirror> : <g key={side}>{claw}</g>;
        })}
        {/* mane */}
        <path d={spikes(100, 62, 24, 46, 112, 428, 14, 6)} fill={u('mane')} {...O} />
        <path d={spikes(100, 62, 22, 36, 120, 420, 12, 6)} fill={lt(c, 25)} opacity=".6" />
        {/* antlers */}
        {[0, 1].map((side) => {
          const horn = (
            <g>
              <path d="M92 40 C86 30 78 22 70 8 C76 10 80 14 82 20 C84 15 84 10 82 4 C88 12 90 20 88 26 C92 30 96 34 98 38Z" fill={u('gold')} {...S(k, 1.8)} />
              <path d="M88 32 C82 26 78 18 74 11" fill="none" stroke="#fff" strokeWidth="1" opacity=".6" />
            </g>
          );
          return side ? <Mirror key={side}>{horn}</Mirror> : <g key={side}>{horn}</g>;
        })}
        {/* cheek fins */}
        {[0, 1].map((side) => {
          const fin = (
            <path d="M74 64 L52 58 L61 66 L48 72 L63 75 L55 84 L77 76Z" fill={u('scale')} {...S(k, 1.6)} />
          );
          return side ? <Mirror key={side}>{fin}</Mirror> : <g key={side}>{fin}</g>;
        })}
        {/* head */}
        <path d="M100 32 C117 32 130 43 130 58 C130 66 127 72 122 78 L78 78 C73 72 70 66 70 58 C70 43 83 32 100 32Z" fill={u('face')} {...O} />
        <path d="M79 46 C85 38 93 35.5 100 35.5" fill="none" stroke="#fff" strokeWidth="1.8" opacity=".5" strokeLinecap="round" />
        <path d="M92 38 Q100 34.6 108 38 L106 51 Q100 54 94 51Z" fill={dk(c, 18)} {...S(k, 1)} />
        <path d="M94 50 L92.4 39 M106 50 L107.6 39" fill="none" stroke={u('gold')} strokeWidth=".9" />
        <circle cx="100" cy="45" r="4.2" fill={u('gold')} {...S(k, 1)} />
        <circle cx="100" cy="45" r="2.6" fill={u('pearl')} />
        {/* beard */}
        <path d="M84 98 C84 106 88 112 92 118 L94 109 L98 120 L100 107 L102 120 L106 109 L108 118 C112 112 116 106 116 98Z" fill={u('gold')} {...S(k, 1.4)} />
        {/* brows, flaring up like flames */}
        {[0, 1].map((side) => {
          const brow = (
            <g>
              <path d="M97 52 C90 46 80 46 72 50 C75 45 78 40 76 33 C84 37 92 42 99 48Z" fill={u('gold')} {...S(k, 1.4)} />
              <path d="M95 49 C88 44 82 42 79 38" fill="none" stroke="#fff" strokeWidth=".9" opacity=".6" />
            </g>
          );
          return side ? <Mirror key={side}>{brow}</Mirror> : <g key={side}>{brow}</g>;
        })}
        {/* big round eyes */}
        <Eyes still={still}>
          {happy ? (
            <path d="M79 60 Q86.5 52 94 60 M106 60 Q113.5 52 121 60" fill="none" stroke={k} strokeWidth="2.8" strokeLinecap="round" />
          ) : (
            [0, 1].map((side) => {
              const eye = (
                <g>
                  <circle cx="86.5" cy="58.5" r="9.5" fill={c2} opacity=".5" filter={u('gl')} />
                  <circle cx="86.5" cy="58.5" r="7.4" fill={u('eye')} {...S(k, 1.6)} />
                  <path d="M87.5 52.6 Q85.6 58.5 87.5 64.4 Q89.4 58.5 87.5 52.6Z" fill={k} />
                  <circle cx="84" cy="56" r="1.7" fill="#fff" />
                  <path d="M79.6 61.6 Q86.5 67 93.4 61.6" fill="none" stroke={k} strokeWidth="1" opacity=".5" />
                </g>
              );
              return side ? <Mirror key={side}>{eye}</Mirror> : <g key={side}>{eye}</g>;
            })
          )}
        </Eyes>
        {/* snout, flaring at the nose */}
        <path d="M88 64 C89 70 88 76 84 82 C80 88 80 94 84 97 L116 97 C120 94 120 88 116 82 C112 76 111 70 112 64 Q100 61 88 64Z" fill={u('muzzle')} {...O} />
        <path d="M100 64 V73 M95 66 Q96 70 94.4 74 M105 66 Q104 70 105.6 74" fill="none" stroke={dk(c, 30)} strokeWidth=".9" opacity=".6" />
        <path d="M84 82 C89 75 111 75 116 82 C118 88 111 91 100 91 C89 91 82 88 84 82Z" fill={lt(c, 22)} {...T} />
        <path d={spiral(91, 83.6, 3.6, -1, 1.1)} fill="none" stroke={k} strokeWidth="1.3" />
        <path d={spiral(109, 83.6, 3.6, 1, 1.1)} fill="none" stroke={k} strokeWidth="1.3" />
        {happy ? (
          <>
            <path d="M80 93 Q100 98 120 93 Q114 110 100 110 Q86 110 80 93Z" fill="#3a0f14" {...S(k, 1.4)} />
            <path d="M82 94 L85 99 L88 95.4 L91 99.6 L94 96.2 L97 100 L100 96.4 L103 100 L106 96.2 L109 99.6 L112 95.4 L115 99 L118 94 Q100 98.6 82 94Z" fill="#fff" />
            <path d="M91 105 Q100 100 109 105 Q105 109 100 109 Q95 109 91 105Z" fill="#e5566b" />
          </>
        ) : (
          <>
            <path d="M80 93 Q100 100 120 93 Q116 103 100 104 Q84 103 80 93Z" fill="#3a0f14" {...S(k, 1.4)} />
            <path d="M82 94 L85 98 L88 95.4 L91 98.6 L94 96.2 L97 99.2 L100 96.6 L103 99.2 L106 96.2 L109 98.6 L112 95.4 L115 98 L118 94 Q100 99.4 82 94Z" fill="#fff" />
          </>
        )}
        <path d="M83 94 l1.6 7.4 l2.6 -6.2Z M117 94 l-1.6 7.4 l-2.6 -6.2Z" fill="#f6ecd2" {...S(k, 0.8)} />
        {/* whiskers */}
        <g className={an(still, 'bhv-sway')} style={origin(84, 84)}>
          <path d="M84 84 C70 78 58 84 56 96 C54 110 46 116 36 112" fill="none" stroke={k} strokeWidth="4" strokeLinecap="round" />
          <path d="M84 84 C70 78 58 84 56 96 C54 110 46 116 36 112" fill="none" stroke={u('gold')} strokeWidth="2.2" strokeLinecap="round" />
        </g>
        <g className={an(still, 'bhv-sway-r')} style={origin(116, 84)}>
          <path d="M116 84 C130 78 142 84 144 96 C146 110 154 116 164 112" fill="none" stroke={k} strokeWidth="4" strokeLinecap="round" />
          <path d="M116 84 C130 78 142 84 144 96 C146 110 154 116 164 112" fill="none" stroke={u('gold')} strokeWidth="2.2" strokeLinecap="round" />
        </g>
        {/* coral crown */}
        {mk >= 2 && (
          <g>
            <path d="M100 38 L100 16 M100 28 L93 20 M100 23 L107 13 M90 40 L84 25 M86 32 L80 27 M110 40 L116 25 M114 32 L120 27" fill="none" stroke={k} strokeWidth="5" strokeLinecap="round" />
            <path d="M100 38 L100 16 M100 28 L93 20 M100 23 L107 13 M90 40 L84 25 M86 32 L80 27 M110 40 L116 25 M114 32 L120 27" fill="none" stroke="#ff6b5a" strokeWidth="3" strokeLinecap="round" />
            <path d="M99.4 34 L99.4 18 M89.4 37 L84.6 27 M109.4 37 L114.6 27" fill="none" stroke="#ffd3c9" strokeWidth="1" strokeLinecap="round" />
            <path d="M80 42 Q100 34 120 42 L118 47 Q100 40 82 47Z" fill={u('gold')} {...S(k, 1.2)} />
            {[88, 100, 112].map((x) => (
              <circle key={x} cx={x} cy={x === 100 ? 39.6 : 41.6} r="1.6" fill="#ff6b5a" {...S(k, 0.6)} />
            ))}
          </g>
        )}
      </g>
      {/* the tide jewels: ebb and flow */}
      {mk >= 2 && (
        <>
          {jewel(28, 'kan', '干')}
          {jewel(172, 'man', '満')}
        </>
      )}
    </g>
  );
}

// ─── Amaterasu ──────────────────────────────────────────────────────────────
function Amaterasu({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const k = inkOf(c);
  const u = (s: string) => `url(#${uid}-${s})`;
  const O = S(k, 2.2);
  const T = S(k, 1.2);
  const hair = '#1d1626';
  const red = mix(c, '#c81d25', 40);
  const rays = Array.from({ length: 8 }, (_, i) => {
    const a = rad(-90 + i * 45);
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const lim = [ca > 0.01 ? (194 - 100) / ca : ca < -0.01 ? (6 - 100) / ca : 999, sa > 0.01 ? (194 - 58) / sa : sa < -0.01 ? (4 - 58) / sa : 999];
    const L = Math.min(122, ...lim);
    const P = (r: number, w: number) => `${f(100 + r * ca - w * sa)} ${f(58 + r * sa + w * ca)}`;
    return { d: `M${P(28, -11)} L${P(L, 0)} L${P(28, 11)}Z`, i };
  });
  const thin = Array.from({ length: 8 }, (_, i) => {
    const a = rad(-67.5 + i * 45);
    const L = 58;
    return `M${f(100 + 30 * Math.cos(a))} ${f(58 + 30 * Math.sin(a))} L${f(100 + L * Math.cos(a))} ${f(58 + L * Math.sin(a))}`;
  }).join(' ');
  const teeth = Array.from({ length: 24 }, (_, i) => {
    const a = rad(i * 15);
    const a1 = rad(i * 15 - 5);
    const a2 = rad(i * 15 + 5);
    return `M${f(100 + 44 * Math.cos(a1))} ${f(58 + 44 * Math.sin(a1))} L${f(100 + 50 * Math.cos(a))} ${f(58 + 50 * Math.sin(a))} L${f(100 + 44 * Math.cos(a2))} ${f(58 + 44 * Math.sin(a2))}Z`;
  }).join(' ');
  const crown = Array.from({ length: 12 }, (_, i) => {
    const a = rad(-180 + i * (180 / 11));
    const a1 = a - 0.12;
    const a2 = a + 0.12;
    return `M${f(100 + 7 * Math.cos(a1))} ${f(34 + 7 * Math.sin(a1))} L${f(100 + 12 * Math.cos(a))} ${f(34 + 12 * Math.sin(a))} L${f(100 + 7 * Math.cos(a2))} ${f(34 + 7 * Math.sin(a2))}Z`;
  }).join(' ');
  const scallop = Array.from({ length: 8 }, (_, i) => {
    const a = rad(i * 45 + 22.5);
    return `${i ? '' : `M${f(162 + 18 * Math.cos(rad(0)))} ${f(74 + 18 * Math.sin(rad(0)))} `}A7.6 7.6 0 0 1 ${f(162 + 18 * Math.cos(a + rad(22.5)))} ${f(74 + 18 * Math.sin(a + rad(22.5)))}`;
  }).join(' ');
  const magatama = (x: number, y: number, s: number, col: string) => (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M3 -1 A3.4 3.4 0 1 0 -2.6 2 C-3 5 -1 8 3 9 C1 6 1.6 3 3 -1Z" fill={col} {...S(k, 0.9 / s)} />
      <circle cx="0" cy="-1.2" r=".9" fill={k} />
      <path d="M-2 -2.6 a2.6 2.6 0 0 1 2.6 -1.4" fill="none" stroke="#fff" strokeWidth={0.9 / s} opacity=".8" />
    </g>
  );
  return (
    <g>
      <defs>
        <Lin id={`${uid}-robe`} stops={shade(c, 30, 32)} x2={0.4} />
        <Lin id={`${uid}-hakama`} stops={shade(red, 22, 40)} x2={0.3} />
        <Lin id={`${uid}-train`} x2={1} y2={0.2} stops={[[0, c2], [0.6, '#ffffff'], [1, lt(c, 40)]]} />
        <Lin id={`${uid}-gold`} stops={GOLD} />
        <Lin id={`${uid}-hair`} stops={[[0, mix(c, hair, 22)], [0.35, hair], [1, '#0b0810']]} />
        <Rad id={`${uid}-skin`} cx={0.42} cy={0.35} r={0.75} stops={[[0, '#ffffff'], [0.7, PORCELAIN], [1, '#efd6c8']]} />
        <Rad id={`${uid}-iris`} cx={0.4} cy={0.35} r={0.8} stops={[[0, '#fffbe0'], [0.45, lt(c, 25)], [1, dk(c, 30)]]} />
        <Lin id={`${uid}-stone`} x2={0.6} stops={[[0, '#a59c90'], [0.5, '#6f665c'], [1, '#3b352f']]} />
        <Rad id={`${uid}-glow`} cx={0.5} cy={0.5} r={0.5} stops={[[0, lt(c2, 10)], [0.45, mix(c2, c, 60)], [1, mix(c, c2, 50)]]} />
        <Rad id={`${uid}-disc`} cx={0.5} cy={0.5} r={0.5} stops={[[0, '#ffffff'], [0.5, c2], [0.85, lt(c, 20)], [1, c]]} />
        <Rad id={`${uid}-mirror`} cx={0.35} cy={0.3} r={0.85} stops={[[0, '#ffffff'], [0.45, '#e6eef5'], [0.8, lt(c2, 10)], [1, '#9aa7b6']]} />
        <radialGradient id={`${uid}-ray`} gradientUnits="userSpaceOnUse" cx="100" cy="58" r="122">
          <stop offset=".25" stopColor="#ffffff" />
          <stop offset=".55" stopColor={c2} />
          <stop offset=".85" stopColor={lt(c, 20)} stopOpacity=".7" />
          <stop offset="1" stopColor={c} stopOpacity="0" />
        </radialGradient>
        <Blur id={`${uid}-gl`} s={3.2} />
        <Blur id={`${uid}-bl`} s={8} />
      </defs>
      {/* the cave she steps out of */}
      <g>
        <path d="M4 196 L4 44 C12 34 24 34 30 42 C38 38 46 48 42 60 C50 70 48 86 40 94 C46 110 42 128 34 138 C40 154 36 176 32 196Z" fill={u('stone')} {...S(k, 2)} />
        <path d="M10 46 C16 42 24 42 28 48 M8 100 C16 96 26 98 32 104 M6 150 C14 146 22 148 28 154" fill="none" stroke="#c9c1b5" strokeWidth="1.4" opacity=".7" strokeLinecap="round" />
        <path d="M22 60 L28 74 L24 86 M14 120 L20 132 M18 170 L24 180" fill="none" stroke="#2a2520" strokeWidth="1" />
        <path d="M196 196 L196 58 C186 50 172 54 168 66 C158 72 158 90 166 98 C158 110 160 128 170 134 C164 150 168 176 172 196Z" fill={u('stone')} {...S(k, 2)} />
        <path d="M172 64 C178 58 188 58 194 62 M168 100 C174 96 186 96 194 100 M172 138 C178 134 188 134 194 138" fill="none" stroke="#c9c1b5" strokeWidth="1.4" opacity=".7" strokeLinecap="round" />
        <path d="M180 72 L176 86 L182 92 M184 112 L178 124 M180 160 L186 172" fill="none" stroke="#2a2520" strokeWidth="1" />
        <path d="M163 112 Q180 118 196 112" fill="none" stroke={k} strokeWidth="6" strokeLinecap="round" />
        <path d="M163 112 Q180 118 196 112" fill="none" stroke="#ecd48c" strokeWidth="4.2" strokeLinecap="round" />
        <path d="M163 112 Q180 118 196 112" fill="none" stroke="#a88a3c" strokeWidth="4.2" strokeDasharray="1.4 2.8" />
        {[172, 186].map((x) => (
          <path key={x} d={`M${x - 2} 116 h4 l-1.6 4 h3 l-1.6 4 h3 l-2 4.6 h-4 l1.6 -4 h-3 l1.6 -4 h-3Z`} fill="#fff" {...S(k, 0.7)} />
        ))}
        <path d="M14 70 q4 -3 8 0 M180 150 q4 -3 8 0" fill="none" stroke="#7a9a4a" strokeWidth="2.4" strokeLinecap="round" />
      </g>
      {/* light pouring out with her */}
      <circle cx="100" cy="96" r="70" fill={u('glow')} opacity=".55" filter={u('bl')} className={an(still, 'bhv-glow')} style={origin(100, 96)} />
      {mk === 3 && (
        <g>
          <g className={an(still, 'bhv-pulse')}>
            {rays.map(({ d, i }) => (
              <path key={i} d={d} fill={u('ray')} opacity={i % 2 ? 0.8 : 1} />
            ))}
            <path d={thin} stroke={c2} strokeWidth="1.4" opacity=".7" strokeLinecap="round" />
          </g>
          <circle cx="100" cy="58" r="46" fill={c2} opacity=".7" filter={u('gl')} />
          <g className={an(still, 'bhv-spin')} style={origin(100, 58)}>
            <path d={teeth} fill={u('gold')} {...S(k, 0.8)} />
            <circle cx="100" cy="58" r="44" fill={u('disc')} {...S(k, 1.4)} />
            <circle cx="100" cy="58" r="38" fill="none" stroke={u('gold')} strokeWidth="1.4" />
            <circle cx="100" cy="58" r="34.5" fill="none" stroke={c} strokeWidth=".8" strokeDasharray="2 3" />
          </g>
        </g>
      )}
      <Shadow rx={54} />
      <g className={an(still, 'bhv-bob')}>
        {/* the long train, sweeping back toward the cave */}
        <path d="M116 132 C130 148 146 156 164 160 C178 163 188 170 190 180 C182 176 176 180 170 184 C162 180 156 184 150 187 L120 186Z" fill={u('train')} {...O} />
        <path d="M122 150 C136 164 152 170 170 172 M134 178 C146 176 160 176 172 180" fill="none" stroke={dk(c2, 25)} strokeWidth="1" />
        <path d="M118 140 C132 154 148 162 168 165 C178 167 186 172 188 178" fill="none" stroke={c} strokeWidth="1.6" opacity=".8" />
        {[
          [146, 168],
          [160, 179],
          [134, 162],
          [178, 172],
        ].map(([x, y]) => (
          <g key={x}>
            <circle cx={x} cy={y} r="3.2" fill="none" stroke={u('gold')} strokeWidth="1.1" />
            <circle cx={x} cy={y} r="1.2" fill={c} />
          </g>
        ))}
        {/* hair down her back */}
        <g className={an(still, 'bhv-sway-r')} style={origin(100, 60)}>
          <path d="M80 54 C72 72 72 100 66 130 C62 148 66 160 74 164 C78 146 84 124 88 100 L112 100 C116 124 122 146 126 164 C134 160 138 148 134 130 C128 100 128 72 120 54 C118 40 110 34 100 34 C90 34 82 40 80 54Z" fill={u('hair')} {...O} />
          <path d="M76 90 C74 110 70 130 68 148 M124 90 C126 110 130 130 132 148" fill="none" stroke={mix(c, '#ffffff', 40)} strokeWidth="1.2" opacity=".45" strokeLinecap="round" />
        </g>
        {/* hakama */}
        <path d="M82 112 C76 136 66 160 58 184 L142 184 C134 160 124 136 118 112Z" fill={u('hakama')} {...O} />
        <path d="M90 118 L84 182 M100 118 V182 M110 118 L116 182 M80 140 L72 180 M120 140 L128 180" stroke={dk(red, 40)} strokeWidth=".9" opacity=".6" />
        <path d="M80 130 C76 146 70 162 66 176" fill="none" stroke="#fff" strokeWidth="1.4" opacity=".4" strokeLinecap="round" />
        <path d="M59 181 L141 181" stroke={u('gold')} strokeWidth="2" />
        <path d="M84 186 C84 180 96 180 97 186Z" fill="#fff" {...S(k, 1.4)} />
        <path d="M86 183 h9" stroke={red} strokeWidth="1.2" />
        {/* sleeves, arms open */}
        {[0, 1].map((side) => {
          const sleeve = (
            <g>
              <path d="M88 82 C74 84 60 90 48 98 C42 110 40 124 44 136 C50 140 58 136 62 128 C66 118 74 110 86 106Z" fill={u('robe')} {...O} />
              <path d="M48 98 C42 110 40 124 44 136" fill="none" stroke={c2} strokeWidth="6" strokeLinecap="round" />
              <path d="M50.6 99 C45 111 43.4 124 46.8 135" fill="none" stroke={red} strokeWidth="2.6" />
              <path d="M53 100 C47.6 112 46.4 124 49.6 134" fill="none" stroke={u('gold')} strokeWidth="1.2" />
              <path d="M62 94 C72 89 80 86 86 85" fill="none" stroke="#fff" strokeWidth="1.4" opacity=".55" strokeLinecap="round" />
              <path d="M58 116 l6 -2 M66 104 l6 -2" stroke={u('gold')} strokeWidth="1.2" strokeLinecap="round" />
              <path d="M45 98 C39 94 35 88 37 84 C39 82 43 84 45 88 C45 82 47 80 49 82 C51 86 51 92 50 99Z" fill={u('skin')} {...T} />
            </g>
          );
          return side ? <Mirror key={side}>{sleeve}</Mirror> : <g key={side}>{sleeve}</g>;
        })}
        {/* jacket, layered collar, obi */}
        <path d="M84 80 C80 92 80 104 82 114 L118 114 C120 104 120 92 116 80 Q100 76 84 80Z" fill={u('robe')} {...O} />
        <path d="M86.5 79 L100 101 L113.5 79" fill="none" stroke={c2} strokeWidth="4.4" strokeLinejoin="round" />
        <path d="M89.5 79 L100 96.5 L110.5 79" fill="none" stroke={red} strokeWidth="2.8" strokeLinejoin="round" />
        <path d="M92.5 79 L100 92 L107.5 79" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M94.4 79 L100 89 L105.6 79Z" fill={u('skin')} />
        <path d="M82 110 Q100 114 118 110 L118 118 Q100 122 82 118Z" fill={u('gold')} {...S(k, 1.4)} />
        <circle cx="100" cy="116" r="4" fill={c} {...S(k, 1)} />
        <circle cx="100" cy="116" r="2" fill={c2} />
        {/* magatama necklace over a glowing core */}
        <circle cx="100" cy="103" r="7" fill={c2} opacity=".9" filter={u('gl')} className={an(still, 'bhv-pulse')} />
        <path d="M88 81 C89 92 94 100 100 102 C106 100 111 92 112 81" fill="none" stroke={u('gold')} strokeWidth="1" />
        {[
          [88.6, 87],
          [90.6, 92.6],
          [109.4, 92.6],
          [111.4, 87],
        ].map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r="1.5" fill="#fff" {...S(k, 0.6)} />
        ))}
        {magatama(93.6, 96.4, 0.6, '#2fbf71')}
        {magatama(106.4, 96.4, 0.6, '#2fbf71')}
        {magatama(100, 102.6, 0.9, '#2fbf71')}
        {/* neck and head */}
        <path d="M96 72 L104 72 L104.5 81 L95.5 81Z" fill={u('skin')} {...T} />
        <path d="M95.5 79 Q100 81.5 104.5 79" fill="none" stroke={u('gold')} strokeWidth="1.6" />
        <path d="M100 41 C111 41 118 49 118 58 C118 68 110 75.5 100 75.5 C90 75.5 82 68 82 58 C82 49 89 41 100 41Z" fill={u('skin')} {...O} />
        <path d="M84 62.6 C85.6 67 88 70.6 92 73.4" fill="none" stroke={u('gold')} strokeWidth=".8" />
        <ellipse cx="93.4" cy="50.6" rx="1.8" ry=".9" fill={hair} opacity=".35" />
        <ellipse cx="106.6" cy="50.6" rx="1.8" ry=".9" fill={hair} opacity=".35" />
        <Eyes still={still}>
          {happy ? (
            <path d="M88 61 Q92.5 56 97 61 M103 61 Q107.5 56 112 61" fill="none" stroke={k} strokeWidth="1.9" strokeLinecap="round" />
          ) : (
            [0, 1].map((side) => {
              const eye = (
                <g>
                  <path d="M88 60 Q92.5 55.6 97.2 59.4 Q92.6 63.4 88 60Z" fill="#fff" />
                  <circle cx="92.7" cy="59.7" r="2.7" fill={u('iris')} />
                  <circle cx="92.7" cy="59.8" r="1" fill={dk(c, 55)} />
                  <circle cx="93.6" cy="58.7" r=".85" fill="#fff" />
                  <path d="M87.4 60 Q92.5 54.8 97.8 59.2 M87.4 60 l-1.8 -1.4 M97.8 59.2 l1 -.8" fill="none" stroke={k} strokeWidth="1.5" strokeLinecap="round" />
                </g>
              );
              return side ? <Mirror key={side}>{eye}</Mirror> : <g key={side}>{eye}</g>;
            })
          )}
        </Eyes>
        <ellipse cx="89" cy="66" rx="3.2" ry="1.6" fill="#ff8f6b" opacity={happy ? 0.7 : 0.45} />
        <ellipse cx="111" cy="66" rx="3.2" ry="1.6" fill="#ff8f6b" opacity={happy ? 0.7 : 0.45} />
        <path d="M100 63 l-.8 2.6 h1.6" fill="none" stroke={k} strokeWidth=".7" opacity=".45" />
        {happy ? <path d="M96.4 67.8 Q100 72.8 103.6 67.8Z" fill="#c81d25" {...S(k, 0.6)} /> : <path d="M97.2 68.6 Q100 67.2 102.8 68.6 Q100 71 97.2 68.6Z" fill="#d62828" />}
        {/* hair parted in the middle, with side locks tied in gold */}
        <path d="M81 60 C80 46 88 37 100 37 C112 37 120 46 119 60 C116 52 110 46 101 44 L100 41.5 L99 44 C90 46 84 52 81 60Z" fill={u('hair')} {...T} />
        <path d="M82 56 C78 68 80 84 84 96 C86 84 84 70 86 60Z M118 56 C122 68 120 84 116 96 C114 84 116 70 114 60Z" fill={u('hair')} {...T} />
        <path d="M80.6 86 h5 M114.4 86 h5" stroke={u('gold')} strokeWidth="2.2" />
        <path d="M86 44 C90 40 95 38.6 99 38.6" fill="none" stroke={mix(c, '#ffffff', 45)} strokeWidth="1.3" opacity=".6" strokeLinecap="round" />
        {/* the sun crown */}
        <path d={crown} fill={u('gold')} {...S(k, 0.7)} />
        <circle cx="100" cy="34" r="7" fill={u('gold')} {...S(k, 1)} />
        <circle cx="100" cy="34" r="3.6" fill={red} {...S(k, 0.7)} className={an(still, 'bhv-pulse')} />
        <circle cx="98.8" cy="32.8" r="1" fill="#fff" />
        {[0, 1].map((side) => {
          const pin = (
            <g>
              <path d="M84 42 L76 46" stroke={u('gold')} strokeWidth="1.8" strokeLinecap="round" />
              <path d="M77 46 V56 M80 44.6 V52" stroke={u('gold')} strokeWidth=".8" />
              <circle cx="77" cy="57.4" r="1.5" fill={red} {...S(k, 0.6)} />
              <circle cx="80" cy="53.4" r="1.2" fill="#fff" {...S(k, 0.5)} />
            </g>
          );
          return side ? <Mirror key={side}>{pin}</Mirror> : <g key={side}>{pin}</g>;
        })}
        {/* a little sun in her open hand */}
        <g className={an(still, 'bhv-glow')} style={origin(40, 78)}>
          <circle cx="40" cy="78" r="6" fill={c2} opacity=".9" filter={u('gl')} />
          <circle cx="40" cy="78" r="3.4" fill="#fff" {...S(c, 1)} />
        </g>
        {/* the mirror, Yata no Kagami */}
        {mk >= 2 && (
          <g className={an(still, 'bhv-float')} style={origin(162, 74)}>
            <path d="M160 95 C159 100 160 104 160 108" fill="none" stroke={red} strokeWidth="1.6" />
            <circle cx="162" cy="74" r="24" fill={c2} opacity=".75" filter={u('gl')} />
            <path d={`${scallop}Z`} fill={u('gold')} {...S(k, 1.6)} />
            <circle cx="162" cy="74" r="15" fill={dk(c, 35)} />
            <circle cx="162" cy="74" r="13.6" fill={u('mirror')} />
            <path d="M152 80 L166 63 L170 66 L156 83Z" fill="#fff" opacity=".7" />
            <path d="M159 84 L169 72 L170.6 73.4 L160.6 85.4Z" fill="#fff" opacity=".5" />
            <circle cx="162" cy="74" r="17.4" fill="none" stroke={dk(c, 20)} strokeWidth=".8" strokeDasharray="1.4 1.8" />
            <path d={glint(170, 66, 4)} fill="#fff" />
          </g>
        )}
      </g>
      {/* clouds of dawn and glints */}
      {mk === 3 && (
        <g>
          <Cloud x={4} y={194} w={56} n={3} k={k} fill={u('glow')} rim="#fff" />
          <Cloud x={144} y={196} w={52} n={3} k={k} fill={u('glow')} rim="#fff" seed={2} />
          {[
            [24, 20, 4.5],
            [178, 22, 4],
            [16, 112, 3.5],
            [188, 120, 3],
          ].map(([x, y, r], i) => (
            <path key={i} d={glint(x, y, r)} fill="#fff" stroke={c} strokeWidth=".6" className={an(still, 'bhv-pulse')} style={{ animationDelay: `${-i * 0.6}s` }} />
          ))}
        </g>
      )}
    </g>
  );
}

export const HEAVENS: BotRegistry = {
  usagi: { Art: Usagi, head: { x: 100, y: 56, s: 1.3 } },
  fujin: { Art: Fujin, head: { x: 100, y: 42, s: 1.07 } },
  raijin: { Art: Raijin, head: { x: 100, y: 44, s: 1.07 } },
  tennyo: { Art: Tennyo, head: { x: 100, y: 38, s: 0.6 } },
  ryujin: { Art: Ryujin, head: { x: 100, y: 34, s: 0.93 } },
  amaterasu: { Art: Amaterasu, head: { x: 100, y: 37, s: 0.6 } },
};
