import type { CSSProperties, ReactNode } from 'react';
import type { BotArtProps, BotRegistry } from './types';
import './chassisEngines.css';

/** Engines: machines that came alive. Layered shading, fine inner lines, a light or dark outline from the theme. */

const OL = { stroke: 'var(--fg)', strokeWidth: 2.4, strokeLinejoin: 'round', strokeLinecap: 'round' } as const;
const TH = { ...OL, strokeWidth: 1.4 } as const;
const INK = '#15161b';
const GOLD = '#f2c14e';
const STEEL = '#b9c1ca';
const dk = (c: string, n = 35) => `color-mix(in srgb, ${c} ${100 - n}%, #000)`;
const lt = (c: string, n = 35) => `color-mix(in srgb, ${c} ${100 - n}%, #fff)`;
const mix = (a: string, b: string, n: number) => `color-mix(in srgb, ${a} ${100 - n}%, ${b})`;
const an = (still: boolean, cls: string) => (still ? undefined : cls);
const origin = (x: number, y: number): CSSProperties => ({ transformOrigin: `${x}px ${y}px` });
const delay = (s: number): CSSProperties => ({ animationDelay: `${s}s` });
const r1 = (n: number) => Math.round(n * 10) / 10;
/** A point on a circle; degrees, 0 = right, clockwise. */
const pt = (cx: number, cy: number, r: number, deg: number) => [r1(cx + r * Math.cos((deg * Math.PI) / 180)), r1(cy + r * Math.sin((deg * Math.PI) / 180))] as const;
const arc = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const [x0, y0] = pt(cx, cy, r, a0);
  const [x1, y1] = pt(cx, cy, r, a1);
  return `M${x0} ${y0} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
};
/** A curved band between two radii, from a0 to a1 degrees. */
const band = (cx: number, cy: number, ri: number, ro: number, a0: number, a1: number) => {
  const [x0, y0] = pt(cx, cy, ro, a0);
  const [x1, y1] = pt(cx, cy, ro, a1);
  const [x2, y2] = pt(cx, cy, ri, a1);
  const [x3, y3] = pt(cx, cy, ri, a0);
  const l = a1 - a0 > 180 ? 1 : 0;
  return `M${x0} ${y0} A${ro} ${ro} 0 ${l} 1 ${x1} ${y1} L${x2} ${y2} A${ri} ${ri} 0 ${l} 0 ${x3} ${y3}Z`;
};
const ring = (n: number, f: (i: number, deg: number) => ReactNode, start = -90) => Array.from({ length: n }, (_, i) => f(i, start + (360 * i) / n));
/** A gear outline (teeth on the rim), with a hole in the middle when filled evenodd. */
const gear = (cx: number, cy: number, r: number, n: number, d = 2.4, hole = r * 0.35) => {
  const s: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = (360 * i) / n;
    const w = 360 / n;
    const p = [pt(cx, cy, r - d, a), pt(cx, cy, r, a + w * 0.18), pt(cx, cy, r, a + w * 0.48), pt(cx, cy, r - d, a + w * 0.66)];
    s.push(`${i ? 'L' : 'M'}${p[0][0]} ${p[0][1]} L${p[1][0]} ${p[1][1]} L${p[2][0]} ${p[2][1]} L${p[3][0]} ${p[3][1]}`);
  }
  return `${s.join(' ')}Z M${cx + hole} ${cy} A${hole} ${hole} 0 1 0 ${cx - hole} ${cy} A${hole} ${hole} 0 1 0 ${cx + hole} ${cy}Z`;
};
const star = (x: number, y: number, r: number, n = 5, inner = 0.45) =>
  Array.from({ length: n * 2 }, (_, i) => {
    const a = (Math.PI * i) / n - Math.PI / 2;
    const k = i % 2 ? r * inner : r;
    return `${r1(x + k * Math.cos(a))},${r1(y + k * Math.sin(a))}`;
  }).join(' ');

function Eyes({ still, children }: { still: boolean; children: ReactNode }) {
  return (
    <g className="dr-gaze">
      <g className={still ? undefined : 'i-blink'}>{children}</g>
    </g>
  );
}
const Shadow = ({ rx = 52 }: { rx?: number }) => <ellipse cx="100" cy="185" rx={rx} ry="5" fill="var(--fg)" opacity=".16" />;

/** Across a cylinder standing up: deep edge, lit side, highlight, body, falloff. */
function CylX({ id, c, y = false }: { id: string; c: string; y?: boolean }) {
  return (
    <linearGradient id={id} x1="0" x2={y ? 0 : 1} y1="0" y2={y ? 1 : 0}>
      <stop offset="0" stopColor={dk(c, 50)} />
      <stop offset=".12" stopColor={dk(c, 10)} />
      <stop offset=".3" stopColor={lt(c, 30)} />
      <stop offset=".42" stopColor={c} />
      <stop offset=".8" stopColor={dk(c, 28)} />
      <stop offset="1" stopColor={dk(c, 58)} />
    </linearGradient>
  );
}
/** A lit ball: highlight up and to the left. */
function Ball({ id, c, fx = 0.34, fy = 0.3, hi = 45 }: { id: string; c: string; fx?: number; fy?: number; hi?: number }) {
  return (
    <radialGradient id={id} cx={fx} cy={fy} r=".85" fx={fx} fy={fy}>
      <stop offset="0" stopColor={lt(c, hi)} />
      <stop offset=".25" stopColor={lt(c, 14)} />
      <stop offset=".65" stopColor={c} />
      <stop offset="1" stopColor={dk(c, 45)} />
    </radialGradient>
  );
}
/** Soft light falling from the top. */
function Sheen({ id, c, a = 30, b = 30 }: { id: string; c: string; a?: number; b?: number }) {
  return (
    <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stopColor={lt(c, a)} />
      <stop offset=".45" stopColor={c} />
      <stop offset="1" stopColor={dk(c, b)} />
    </linearGradient>
  );
}
/** A glowing light: white heart, the colour, then nothing. */
function Hot({ id, c, core = '#fff' }: { id: string; c: string; core?: string }) {
  return (
    <radialGradient id={id}>
      <stop offset="0" stopColor={core} />
      <stop offset=".35" stopColor={lt(c, 40)} />
      <stop offset=".7" stopColor={c} stopOpacity=".75" />
      <stop offset="1" stopColor={c} stopOpacity="0" />
    </radialGradient>
  );
}
const Blur = ({ id, sd = 2.4 }: { id: string; sd?: number }) => (
  <filter id={id} x="-80%" y="-80%" width="260%" height="260%">
    <feGaussianBlur stdDeviation={sd} />
  </filter>
);
/** Brass, gold and steel: fixed materials. */
function Metal({ id, a, b, c, y = true }: { id: string; a: string; b: string; c: string; y?: boolean }) {
  return (
    <linearGradient id={id} x1="0" x2={y ? 0 : 1} y1="0" y2={y ? 1 : 0}>
      <stop offset="0" stopColor={a} />
      <stop offset=".45" stopColor={b} />
      <stop offset=".55" stopColor={c} />
      <stop offset="1" stopColor={b} />
    </linearGradient>
  );
}
/** A cloud of steam: one outline round the whole puff, then the fill, then highlights. */
function Cloud({ puffs, shade = '#c9ced6' }: { puffs: readonly (readonly [number, number, number])[]; shade?: string }) {
  return (
    <g>
      <g opacity=".5">
        {puffs.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r + 1.4} fill="var(--fg)" />
        ))}
      </g>
      {puffs.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={shade} />
      ))}
      {puffs.map(([x, y, r], i) => (
        <circle key={i} cx={x - r * 0.18} cy={y - r * 0.2} r={r * 0.78} fill="#f1f3f6" />
      ))}
      {puffs.map(([x, y, r], i) => (
        <circle key={i} cx={x - r * 0.35} cy={y - r * 0.38} r={r * 0.32} fill="#fff" />
      ))}
    </g>
  );
}

// ─── Steam Walker D51 ───────────────────────────────────────────────────────
/** A spoked driving wheel: steel tyre, painted centre, counterweight, hub. */
function Wheel({ x, y, r, c2, u, still, cls = 'ben-spin-slow' }: { x: number; y: number; r: number; c2: string; u: (s: string) => string; still: boolean; cls?: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={u('tyre')} {...OL} strokeWidth="2.2" />
      <g className={an(still, cls)} style={origin(x, y)}>
        <circle cx={x} cy={y} r={r * 0.8} fill={u('wheel')} stroke={dk(c2, 55)} strokeWidth=".8" />
        <path d={band(x, y, r * 0.38, r * 0.74, 120, 240)} fill={dk(c2, 30)} stroke={dk(c2, 55)} strokeWidth=".6" />
        {ring(12, (i, a) => {
          const [ax, ay] = pt(x, y, r * 0.3, a);
          const [bx, by] = pt(x, y, r * 0.76, a);
          return <line key={i} x1={ax} y1={ay} x2={bx} y2={by} stroke={dk(c2, 45)} strokeWidth={r * 0.09} strokeLinecap="round" />;
        })}
        <circle cx={x} cy={y} r={r * 0.3} fill={u('hub')} stroke={INK} strokeWidth=".7" />
        <circle cx={pt(x, y, r * 0.56, -40)[0]} cy={pt(x, y, r * 0.56, -40)[1]} r={r * 0.11} fill={STEEL} stroke={INK} strokeWidth=".6" />
        <circle cx={x} cy={y} r={r * 0.1} fill={INK} />
      </g>
      <path d={arc(x, y, r - 1.3, 190, 260)} fill="none" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" opacity=".75" />
      <path d={arc(x, y, r * 0.8 - 0.8, 200, 250)} fill="none" stroke={lt(c2, 45)} strokeWidth=".8" strokeLinecap="round" opacity=".8" />
    </g>
  );
}

function D51({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const id = (s: string) => `${uid}-${s}`;
  const u = (s: string) => `url(#${uid}-${s})`;
  const amber = '#ffbf3a';
  const deflector = (
    <g>
      <path d="M77 38 L65 36 Q57.5 38 57.5 46 L56 86 Q56 90.5 60 90.5 L75 88.5Z" fill={u('plate')} {...OL} />
      <path d="M73 40.5 L65.5 39.5 Q61 41 61 46.5 L59.8 85 Q59.8 87 62 87 L72.5 86" fill="none" stroke={lt(c, 38)} strokeWidth=".8" opacity=".8" />
      {[46, 58, 70, 82].map((y) => (
        <circle key={y} cx={y > 80 ? 60.6 : 61.2} cy={y} r=".9" fill={lt(c, 45)} />
      ))}
      <rect x="63.5" y="50" width="6" height="2.2" rx="1.1" fill={INK} />
    </g>
  );
  return (
    <g>
      <defs>
        <CylX id={id('boiler')} c={c} />
        <CylX id={id('cylY')} c={c} y />
        <CylX id={id('red')} c={c2} y />
        <linearGradient id={id('plate')} x1="0" x2="1">
          <stop offset="0" stopColor={lt(c, 26)} />
          <stop offset=".5" stopColor={c} />
          <stop offset="1" stopColor={dk(c, 30)} />
        </linearGradient>
        <Ball id={id('ring')} c={lt(c, 10)} hi={40} />
        <Ball id={id('door')} c={c} hi={30} fx={0.4} fy={0.32} />
        <Ball id={id('wheel')} c={c2} hi={30} />
        <Ball id={id('hub')} c={STEEL} hi={60} />
        <radialGradient id={id('tyre')}>
          <stop offset=".75" stopColor="#5b636d" />
          <stop offset=".9" stopColor="#d7dde3" />
          <stop offset="1" stopColor="#6e7680" />
        </radialGradient>
        <Metal id={id('brass')} a="#fff1b8" b={GOLD} c="#b8862a" />
        <radialGradient id={id('lamp')} cx=".45" cy=".4">
          <stop offset="0" stopColor="#fffbe8" />
          <stop offset=".55" stopColor="#ffe28a" />
          <stop offset="1" stopColor="#e39a2a" />
        </radialGradient>
        <radialGradient id={id('eye')} cx=".4" cy=".35">
          <stop offset="0" stopColor="#fff6c8" />
          <stop offset=".5" stopColor={amber} />
          <stop offset="1" stopColor="#d9601a" />
        </radialGradient>
        <linearGradient id={id('fire')} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff3b0" />
          <stop offset=".5" stopColor="#ff9a2a" />
          <stop offset="1" stopColor="#d2361a" />
        </linearGradient>
        <linearGradient id={id('ao')} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".4" />
        </linearGradient>
        <Blur id={id('glow')} sd={2.2} />
      </defs>
      <Shadow rx={mk === 3 ? 72 : 58} />

      {/* Mk III: a full head of steam behind it all */}
      {mk === 3 && (
        <g className={an(still, 'ben-billow')} style={origin(100, 30)}>
          <Cloud
            puffs={[
              [101, 14, 7],
              [93, 10, 8.5],
              [81, 11, 10.5],
              [67, 15, 11.5],
              [53, 21, 10.5],
              [41, 29, 9],
              [31, 38, 7],
              [24, 46, 5],
              [72, 26, 8],
              [56, 32, 7],
              [110, 9, 6],
              [119, 12, 4.5],
            ]}
          />
        </g>
      )}

      {/* Mk III: the coal tender, worn as a backpack */}
      {mk === 3 && (
        <g>
          <path d="M36 74 Q40 60 50 61 Q55 52 64 56 Q72 49 82 54 L118 54 Q128 49 136 56 Q145 52 150 61 Q160 60 164 74Z" fill={INK} {...OL} />
          {[
            [44, 66],
            [52, 60],
            [61, 63],
            [139, 62],
            [148, 61],
            [156, 67],
            [47, 71],
            [152, 72],
            [58, 70],
            [143, 69],
          ].map(([x, y], i) => (
            <g key={i}>
              <path d={`M${x - 3.5} ${y + 2} L${x - 1.5} ${y - 2.5} L${x + 3} ${y - 1.5} L${x + 2.5} ${y + 2.5}Z`} fill="#3d424d" />
              <path d={`M${x - 1.5} ${y - 2.5} L${x + 3} ${y - 1.5}`} stroke="#8a93a3" strokeWidth=".7" />
              <circle cx={x - 0.4} cy={y - 1.4} r=".6" fill="#fff" opacity=".9" />
            </g>
          ))}
          <rect x="34" y="70" width="132" height="62" rx="7" fill={u('boiler')} {...OL} />
          <path d="M37 76 H163" stroke={lt(c, 40)} strokeWidth=".8" opacity=".7" />
          {Array.from({ length: 15 }, (_, i) => (
            <circle key={i} cx={40 + i * 8.6} cy="73.5" r=".8" fill={lt(c, 45)} />
          ))}
          <path d="M45 80 V128 M155 80 V128" stroke={dk(c, 45)} strokeWidth="1" />
          <rect x="35" y="122" width="130" height="5" fill={c2} opacity=".9" />
          {[40, 160].map((x) => (
            <path key={x} d={`M${x} 84 V118 M${x - 2} 92 H${x + 2} M${x - 2} 100 H${x + 2} M${x - 2} 108 H${x + 2} M${x - 2} 116 H${x + 2}`} stroke={STEEL} strokeWidth="1" strokeLinecap="round" />
          ))}
        </g>
      )}

      {/* smoke deflectors either side of the head */}
      {deflector}
      <g transform="translate(200 0) scale(-1 1)">{deflector}</g>

      {/* driving wheels and connecting rods */}
      {[61, 139].map((x) => (
        <Wheel key={x} x={x} y={160} r={16} c2={c2} u={u} still={still} />
      ))}

      {/* legs and feet */}
      {[81, 106].map((x) => (
        <g key={x}>
          <rect x={x} y="149" width="13" height="27" rx="4" fill={u('boiler')} {...OL} />
          <circle cx={x + 6.5} cy="162" r="2.8" fill={c2} stroke={INK} strokeWidth=".8" />
          <circle cx={x + 6.5} cy="162" r=".9" fill={GOLD} />
          <rect x={x - 7} y="173" width="25" height="9" rx="3" fill={u('cylY')} {...OL} />
          <rect x={x - 6} y="178.5" width="23" height="2.6" rx="1" fill={c2} />
        </g>
      ))}

      {/* hips: the pistons, a frame, and the main rods down to the wheels */}
      {[0, 1].map((k) => {
        const x = k ? 124 : 52;
        const cap = k ? 148 : 52;
        return (
          <g key={k}>
            <rect x={x} y="139" width="24" height="13" rx="3.5" fill={u('cylY')} {...OL} />
            <path d={`M${x + 3} 142.5 H${x + 21}`} stroke={lt(c, 40)} strokeWidth=".8" opacity=".8" />
            <ellipse cx={cap} cy="145.5" rx="2.6" ry="6.5" fill={u('hub')} stroke={INK} strokeWidth=".8" />
            <path d={k ? 'M125 147 L134 166' : 'M75 147 L66 166'} stroke="var(--fg)" strokeWidth="5.2" strokeLinecap="round" />
            <path d={k ? 'M125 147 L134 166' : 'M75 147 L66 166'} stroke={STEEL} strokeWidth="2.8" strokeLinecap="round" />
            <circle cx={k ? 134 : 66} cy="166" r="2.4" fill={u('hub')} stroke={INK} strokeWidth=".7" />
          </g>
        );
      })}
      <rect x="76" y="139" width="48" height="13" rx="3" fill={dk(c, 15)} {...OL} />
      <rect x="94" y="142" width="12" height="7" rx="1.5" fill={c2} stroke={INK} strokeWidth=".7" />
      <path d="M97 145.5 h6" stroke={INK} strokeWidth="1.2" />

      {/* arms: the left one down, the right one up in a fist */}
      {[
        { d: 'M70 95 L56 114 L52 131', hand: [51, 134] as const },
        { d: 'M130 95 L148 107 L154 88', hand: [154, 84] as const },
      ].map((a, i) => (
        <g key={i}>
          <path d={a.d} fill="none" stroke="var(--fg)" strokeWidth="12.5" strokeLinejoin="round" strokeLinecap="round" />
          <path d={a.d} fill="none" stroke={lt(c, 8)} strokeWidth="8" strokeLinejoin="round" strokeLinecap="round" />
          <path d={a.d} fill="none" stroke={lt(c, 38)} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" transform="translate(-1.6 -1.4)" opacity=".8" />
          <circle cx={i ? 148 : 56} cy={i ? 107 : 114} r="4.6" fill={c2} stroke={INK} strokeWidth=".8" />
          <circle cx={i ? 148 : 56} cy={i ? 107 : 114} r="1.5" fill={GOLD} />
          <circle cx={a.hand[0]} cy={a.hand[1]} r="7" fill={u('door')} {...OL} strokeWidth="2" />
          <path d={`M${a.hand[0] - 4} ${a.hand[1] - (i ? 2 : -2)} h8 M${a.hand[0] - 3.5} ${a.hand[1] + (i ? 1.5 : -1.5)} h7`} stroke={lt(c, 40)} strokeWidth=".8" strokeLinecap="round" />
        </g>
      ))}

      {/* the boiler is its chest */}
      <rect x="70" y="86" width="60" height="53" rx="9" fill={u('boiler')} {...OL} />
      <rect x="71.5" y="125" width="57" height="12.5" rx="6" fill={u('ao')} />
      <rect x="77.5" y="90" width="2.4" height="44" rx="1.2" fill="#fff" opacity=".22" />
      <path d="M127.6 92 V133" stroke={lt(c, 45)} strokeWidth="1" opacity=".6" />
      {[96, 120].map((y) => (
        <g key={y}>
          <rect x="70.5" y={y} width="59" height="3.4" fill={u('brass')} stroke={dk(GOLD, 55)} strokeWidth=".5" />
          {[76, 86, 114, 124].map((x) => (
            <circle key={x} cx={x} cy={y + 1.7} r=".7" fill="#7a5a14" />
          ))}
        </g>
      ))}
      {[73.5, 126.5].map((x) => (
        <g key={x}>
          <path d={`M${x} 91 V133`} stroke={STEEL} strokeWidth="1.1" />
          {[93, 112, 131].map((y) => (
            <circle key={y} cx={x} cy={y} r="1" fill={STEEL} />
          ))}
        </g>
      ))}
      {/* firebox door with the fire showing */}
      <rect x="87" y="101" width="26" height="17" rx="3" fill={dk(c, 25)} stroke={lt(c, 30)} strokeWidth=".9" />
      <rect x="90" y="106" width="20" height="6.5" rx="1.5" fill={u('fire')} />
      <g className={an(still, 'ben-pulse')}>
        <rect x="88" y="104" width="24" height="10" rx="3" fill="#ff8a2a" filter={u('glow')} opacity=".85" />
      </g>
      {[93, 97, 101, 105].map((x) => (
        <path key={x} d={`M${x + 1} 106 v6.5`} stroke={dk(c, 40)} strokeWidth="1" />
      ))}
      <path d="M100 101.5 V117.5" stroke={lt(c, 30)} strokeWidth=".8" />
      <circle cx="97" cy="115.3" r="1" fill={GOLD} />
      <circle cx="103" cy="115.3" r="1" fill={GOLD} />
      {/* the running board, red with a white line */}
      <rect x="62" y="132" width="76" height="8" rx="2" fill={u('red')} {...OL} strokeWidth="2" />
      <path d="M64 134.6 H136" stroke="#fff" strokeWidth=".8" opacity=".85" />

      {/* Mk II: driving-wheel shoulders */}
      {mk >= 2 && [66, 134].map((x) => <Wheel key={x} x={x} y={93} r={12.5} c2={c2} u={u} still={still} cls="ben-spin-rev" />)}

      {/* head: the smokebox, its door the face */}
      <circle cx="100" cy="62" r="27" fill={u('ring')} {...OL} />
      {ring(20, (i, a) => {
        const [x, y] = pt(100, 62, 24.4, a);
        return <circle key={i} cx={x} cy={y} r=".85" fill={lt(c, 48)} />;
      })}
      <circle cx="100" cy="62" r="21.5" fill={u('door')} stroke={INK} strokeWidth="1.3" />
      <path d={arc(100, 62, 20, 195, 265)} fill="none" stroke={lt(c, 55)} strokeWidth="1.1" strokeLinecap="round" opacity=".8" />
      <path d={arc(100, 62, 26, 200, 250)} fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity=".55" />
      {[-45, 45, 135, 225].map((a) => {
        const [x, y] = pt(100, 62, 21.5, a);
        return <rect key={a} x={x - 2} y={y - 1.2} width="4" height="2.4" rx=".8" fill={STEEL} stroke={INK} strokeWidth=".5" transform={`rotate(${a + 90} ${x} ${y})`} />;
      })}
      {/* eyes: two lamps */}
      <Eyes still={still}>
        {happy ? (
          <g>
            <path d="M84.5 57.5 Q90.5 50 96.5 57.5 M103.5 57.5 Q109.5 50 115.5 57.5" fill="none" stroke={amber} strokeWidth="5" strokeLinecap="round" filter={u('glow')} opacity=".8" />
            <path d="M84.5 57.5 Q90.5 50 96.5 57.5 M103.5 57.5 Q109.5 50 115.5 57.5" fill="none" stroke="#fff1b0" strokeWidth="2.8" strokeLinecap="round" />
          </g>
        ) : (
          <g>
            <circle cx="90.5" cy="55" r="6.5" fill={amber} filter={u('glow')} opacity=".75" />
            <circle cx="109.5" cy="55" r="6.5" fill={amber} filter={u('glow')} opacity=".75" />
            {[90.5, 109.5].map((x) => (
              <g key={x}>
                <circle cx={x} cy="55" r="5.6" fill={dk(c, 60)} stroke={STEEL} strokeWidth=".9" />
                <circle cx={x} cy="55" r="4.4" fill={u('eye')} />
                <circle cx={x + 0.4} cy="55.6" r="2.1" fill={INK} />
                <circle cx={x - 1.3} cy="53.4" r="1.2" fill="#fff" />
              </g>
            ))}
          </g>
        )}
      </Eyes>
      {happy && (
        <g opacity=".6">
          <ellipse cx="83" cy="64" rx="3.4" ry="2" fill={c2} />
          <ellipse cx="117" cy="64" rx="3.4" ry="2" fill={c2} />
        </g>
      )}
      <circle cx="100" cy="62.5" r="2" fill={u('hub')} stroke={INK} strokeWidth=".6" />
      {/* the number plate */}
      <rect x="85" y="67" width="30" height="9" rx="1.6" fill={u('red')} stroke={GOLD} strokeWidth="1" />
      <text x="100" y="74.3" textAnchor="middle" fontSize="7.4" fontWeight="900" fontFamily="'Arial Black', 'Helvetica Neue', Arial, sans-serif" fill={GOLD} letterSpacing=".6">
        D51
      </text>
      {/* mouth: the fire showing through */}
      {happy ? (
        <g>
          <path d="M91 78.5 Q100 87 109 78.5 Q100 81.5 91 78.5Z" fill="#ff9a2a" filter={u('glow')} opacity=".7" />
          <path d="M91 78.5 Q100 87 109 78.5 Q100 81.5 91 78.5Z" fill={u('fire')} stroke={dk(c, 60)} strokeWidth=".7" />
        </g>
      ) : (
        <path d="M95.5 80.4 Q100 82 104.5 80.4" fill="none" stroke="#ffb03a" strokeWidth="1.6" strokeLinecap="round" />
      )}

      {/* chimney and headlamp on top */}
      <path d="M94 37 L95 22 H105 L106 37Z" fill={u('boiler')} {...OL} strokeWidth="2" />
      <rect x="91" y="17" width="18" height="5.5" rx="1.6" fill={u('boiler')} {...OL} strokeWidth="2" />
      <rect x="90.5" y="27" width="19" height="11" rx="3" fill={u('cylY')} {...OL} strokeWidth="2" />
      <circle cx="100" cy="32.5" r="6" fill="#ffe28a" filter={u('glow')} opacity=".7" />
      <circle cx="100" cy="32.5" r="3.7" fill={u('lamp')} stroke={STEEL} strokeWidth=".9" />
      <circle cx="98.8" cy="31.3" r="1.1" fill="#fff" />

      {/* Mk II: a whistle */}
      {mk >= 2 && (
        <g>
          <path d="M117 41 V33" stroke="var(--fg)" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M117 41 V33" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" />
          <rect x="114" y="23" width="6" height="10.5" rx="2" fill={u('brass')} {...OL} strokeWidth="1.4" />
          <path d="M114.5 27 h5" stroke="#8a6414" strokeWidth=".8" />
          <circle cx="117" cy="22.5" r="1.4" fill={GOLD} stroke="var(--fg)" strokeWidth="1" />
          <g className={an(still, 'ben-puff')} style={origin(126, 18)}>
            <Cloud
              puffs={[
                [125, 18, 4.2],
                [131, 15, 3.4],
                [130, 21, 3],
              ]}
            />
          </g>
        </g>
      )}

      {/* Mk III: the cylinder cocks blowing steam at its feet */}
      {mk === 3 &&
        [0, 1].map((k) => (
          <g key={k} transform={k ? 'translate(200 0) scale(-1 1)' : undefined}>
            <g className={an(still, 'ben-billow')} style={{ ...origin(36, 176), ...delay(-k * 1.2) }}>
              <Cloud
                puffs={[
                  [42, 177, 6.5],
                  [32, 173, 6],
                  [23, 178, 5],
                  [36, 182, 4.5],
                  [14, 175, 3.5],
                ]}
              />
            </g>
          </g>
        ))}
    </g>
  );
}

export const ENGINES: BotRegistry = {
  d51: { Art: D51, head: { x: 100, y: 35, s: 0.9 } },
};
