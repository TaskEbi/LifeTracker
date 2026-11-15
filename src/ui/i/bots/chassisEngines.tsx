import type { CSSProperties, ReactNode } from 'react';
import type { BotArtProps, BotRegistry } from './types';
import './chassisEngines.css';

/** Engines: machines that came alive. Layered shading, fine inner lines, a light or dark outline from the theme. */

const OL = { stroke: 'var(--fg)', strokeWidth: 2.4, strokeLinejoin: 'round', strokeLinecap: 'round' } as const;
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

// ─── Shinkansen ─────────────────────────────────────────────────────────────
function Shinkansen({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const id = (s: string) => `${uid}-${s}`;
  const u = (s: string) => `url(#${uid}-${s})`;
  const sh = (n: number) => mix(c, '#4c5a74', n);
  const lamp = lt(c2, 72);
  const frame = '#3a4252';
  const arm = (d: string, k: number) => (
    <g key={k}>
      <path d={d} fill="none" stroke="var(--fg)" strokeWidth="12" strokeLinejoin="round" strokeLinecap="round" />
      <path d={d} fill="none" stroke={sh(16)} strokeWidth="8" strokeLinejoin="round" strokeLinecap="round" />
      <path d={d} fill="none" stroke={lt(c, 50)} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" transform="translate(-1.2 -1.3)" />
    </g>
  );
  return (
    <g>
      <defs>
        <radialGradient id={id('nose')} cx=".42" cy=".34" r=".78">
          <stop offset="0" stopColor={lt(c, 80)} />
          <stop offset=".35" stopColor={c} />
          <stop offset=".78" stopColor={sh(24)} />
          <stop offset="1" stopColor={sh(48)} />
        </radialGradient>
        <linearGradient id={id('body')} x1="0" x2="1">
          <stop offset="0" stopColor={sh(50)} />
          <stop offset=".14" stopColor={sh(18)} />
          <stop offset=".34" stopColor={lt(c, 70)} />
          <stop offset=".5" stopColor={c} />
          <stop offset=".84" stopColor={sh(26)} />
          <stop offset="1" stopColor={sh(52)} />
        </linearGradient>
        <Sheen id={id('blue')} c={c2} a={25} b={35} />
        <linearGradient id={id('glass')} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={mix(c2, '#02060e', 40)} />
          <stop offset=".6" stopColor={mix(c2, '#02060e', 78)} />
          <stop offset="1" stopColor={mix(c2, '#02060e', 60)} />
        </linearGradient>
        <radialGradient id={id('lamp')} cx=".4" cy=".4">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".6" stopColor="#fff6cf" />
          <stop offset="1" stopColor="#f0c75a" />
        </radialGradient>
        <Ball id={id('wheel')} c="#9aa3ae" hi={60} />
        <linearGradient id={id('streak')} x1="0" x2="1">
          <stop offset="0" stopColor={c2} stopOpacity="0" />
          <stop offset=".7" stopColor={lt(c2, 45)} stopOpacity=".9" />
          <stop offset="1" stopColor="#fff" />
        </linearGradient>
        <linearGradient id={id('streakR')} x1="1" x2="0">
          <stop offset="0" stopColor={c2} stopOpacity="0" />
          <stop offset=".7" stopColor={lt(c2, 45)} stopOpacity=".9" />
          <stop offset="1" stopColor="#fff" />
        </linearGradient>
        <Metal id={id('rail')} a="#f4f7fa" b="#9aa3ae" c="#6b737d" />
        <Blur id={id('glow')} sd={2} />
      </defs>

      {/* Mk III: a slipstream of light behind it */}
      {mk === 3 && (
        <g>
          <ellipse cx="100" cy="112" rx="94" ry="30" fill={c2} opacity=".08" filter={u('glow')} />
          {[
            [6, 58, 52, 0],
            [4, 76, 64, 0.5],
            [10, 96, 56, 0.2],
            [4, 118, 66, 0.8],
            [14, 138, 54, 0.35],
            [8, 156, 60, 0.65],
          ].map(([x0, y, x1, d], i) => (
            <g key={i} className={an(still, 'ben-stream')} style={delay(-d * 1.4)}>
              <path d={`M${x0} ${y} L${x1} ${y - 1.6} Q${x1 + 4} ${y} ${x1} ${y + 1.6}Z`} fill={u('streak')} filter={u('glow')} />
              <path d={`M${x0 + 10} ${y} L${x1} ${y - 0.7} Q${x1 + 2} ${y} ${x1} ${y + 0.7}Z`} fill={u('streak')} />
            </g>
          ))}
          {[
            [194, 66, 160, 0.3],
            [196, 104, 152, 0.7],
            [192, 146, 158, 0.1],
          ].map(([x0, y, x1, d], i) => (
            <g key={i} className={an(still, 'ben-stream')} style={delay(-d * 1.4)}>
              <path d={`M${x0} ${y} L${x1} ${y - 1.3} Q${x1 - 4} ${y} ${x1} ${y + 1.3}Z`} fill={u('streakR')} />
            </g>
          ))}
        </g>
      )}

      {/* Mk III: rails beneath */}
      {mk === 3 && (
        <g>
          <path d="M2 178 H198 L196 195 H4Z" fill="#76706a" opacity=".55" />
          {Array.from({ length: 15 }, (_, i) => (
            <path key={i} d={`M${7 + i * 13.3} 179 l2.5 0 l-1.2 15 l-5 0Z`} fill="#6d4f3a" stroke="#3f2d20" strokeWidth=".6" />
          ))}
          <rect x="2" y="180.2" width="196" height="2.6" fill={u('rail')} stroke="var(--fg)" strokeWidth=".7" />
          <rect x="2" y="188.6" width="196" height="3.4" fill={u('rail')} stroke="var(--fg)" strokeWidth=".8" />
          <path d="M2 181 H198 M2 189.5 H198" stroke="#fff" strokeWidth=".6" opacity=".9" />
        </g>
      )}
      <Shadow rx={mk === 3 ? 62 : 52} />

      {/* Mk II: pantograph horns */}
      {mk >= 2 &&
        [0, 1].map((k) => (
          <g key={k} transform={k ? 'translate(200 0) scale(-1 1)' : undefined}>
            <path d="M87 27 L78 15 L88 6.5" fill="none" stroke="var(--fg)" strokeWidth="3.6" strokeLinejoin="round" strokeLinecap="round" />
            <path d="M87 27 L78 15 L88 6.5" fill="none" stroke="#9aa3ae" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
            <circle cx="78" cy="15" r="1.8" fill={c2} stroke="var(--fg)" strokeWidth=".8" />
            <path d="M78 5 Q76 5 75.5 7 M78 5 H96 Q98 5 98.5 7" fill="none" stroke="var(--fg)" strokeWidth="3.4" strokeLinecap="round" />
            <path d="M78 5 Q76 5 75.5 7 M78 5 H96 Q98 5 98.5 7" fill="none" stroke="#d7dde3" strokeWidth="1.6" strokeLinecap="round" />
            {[0, 1, 2].map((i) => (
              <ellipse key={i} cx="87.5" cy={29 - i * 2} rx="2.6" ry="1" fill={i % 2 ? '#e7e2d6' : '#bfb8a8'} stroke="var(--fg)" strokeWidth=".6" />
            ))}
            <g className={an(still, 'ben-spark')} style={delay(-k * 1.1)}>
              <polygon points={star(87, 4.2, 4, 4, 0.3)} fill={lt(c2, 60)} filter={u('glow')} />
              <polygon points={star(87, 4.2, 3, 4, 0.25)} fill="#fff" />
            </g>
          </g>
        ))}

      {/* legs on bogies */}
      {[81, 106].map((x) => (
        <g key={x}>
          <rect x={x} y="143" width="13" height="28" rx="5" fill={u('body')} {...OL} />
          <rect x={x + 1.5} y="153" width="10" height="5" rx="1.5" fill={u('blue')} />
          <path d={`M${x + 3} 146 V168`} stroke="#fff" strokeWidth="1.2" opacity=".7" />
          <rect x={x - 6} y="168" width="25" height="8" rx="2.5" fill={frame} {...OL} strokeWidth="2" />
          <path d={`M${x - 4} 170.5 H${x + 17}`} stroke="#7d8798" strokeWidth=".8" />
          {[x - 1, x + 14].map((wx) => (
            <g key={wx}>
              <circle cx={wx} cy="178.5" r="4.6" fill={u('wheel')} stroke="var(--fg)" strokeWidth="1.4" />
              <circle cx={wx} cy="178.5" r="1.5" fill={frame} />
            </g>
          ))}
          <rect x={x + 3.5} y="171" width="6" height="4" rx="1" fill={c2} />
        </g>
      ))}
      <path d="M76 136 H124 L121 147 H79Z" fill={frame} {...OL} />
      <path d="M80 140 H120" stroke="#7d8798" strokeWidth=".8" />

      {/* arms: left hand on hip, right one pointing ahead (and calling it) */}
      {arm('M69 95 L58 113 L72 127', 0)}
      {arm('M131 95 L149 101 L163 88', 1)}
      <circle cx="73" cy="127.5" r="5.6" fill={u('nose')} {...OL} strokeWidth="2" />
      <rect x="157" y="86" width="8" height="5" rx="2" fill={u('blue')} stroke="var(--fg)" strokeWidth="1" transform="rotate(-40 161 88.5)" />
      <path d="M166 84 L173.5 77" stroke="var(--fg)" strokeWidth="5.4" strokeLinecap="round" />
      <path d="M166 84 L173.5 77" stroke={lt(c, 50)} strokeWidth="3" strokeLinecap="round" />
      <circle cx="166" cy="85" r="5.4" fill={u('nose')} {...OL} strokeWidth="2" />
      <path d="M163 82.5 q-2 -3 1 -4.5" fill="none" stroke="var(--fg)" strokeWidth="1.3" strokeLinecap="round" />
      {[69, 131].map((x) => (
        <g key={x}>
          <circle cx={x} cy="95" r="9.5" fill={u('nose')} {...OL} />
          <path d={arc(x, 95, 6.5, 200, 340)} fill="none" stroke={c2} strokeWidth="2.4" />
        </g>
      ))}

      {/* the body: a car with its window row */}
      <path d="M70 90 C70 87 76 86 100 86 C124 86 130 87 130 90 L126 134 C124 139 118 141 100 141 C82 141 76 139 74 134Z" fill={u('body')} {...OL} />
      <path d="M73 92 H127" stroke={sh(40)} strokeWidth="5" opacity=".35" />
      <rect x="81" y="89" width="2.2" height="46" rx="1.1" fill="#fff" opacity=".7" />
      {[79, 88.5, 98, 107.5, 117].map((x) => (
        <g key={x}>
          <rect x={x - 1} y="96" width="6.4" height="6.6" rx="1.6" fill={u('glass')} stroke={sh(55)} strokeWidth=".6" />
          <path d={`M${x} ${101.5} L${x + 3.6} ${97}`} stroke="#fff" strokeWidth=".7" opacity=".6" />
        </g>
      ))}
      <path d="M72.4 108 H127.6 L127.1 114 H72.9Z" fill={u('blue')} />
      <path d="M73.2 117 H126.8" stroke={c2} strokeWidth="1.4" />
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M${80 + i * 2.5} 122 v10 M${114 + i * 2.5} 122 v10`} stroke={sh(45)} strokeWidth=".9" />
      ))}
      <circle cx="100" cy="127" r="7" fill={u('blue')} stroke="var(--fg)" strokeWidth="1.2" />
      <text x="100" y="130.2" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#fff" fontFamily='"Yu Gothic", "Hiragino Sans", "Noto Sans JP", sans-serif'>
        新
      </text>
      {/* Mk II: blue speed stripes */}
      {mk >= 2 && (
        <g>
          {[0, 1].map((k) => (
            <g key={k} transform={k ? 'translate(200 0) scale(-1 1)' : undefined}>
              <path d="M72.6 119 C86 121 90 131 92 140 L88 140.6 C86 132 82 124 73 122Z" fill={u('blue')} />
              <path d="M60.5 60 C66 70 72 76 82 80 L80 82.5 C70 79 63 71 59.5 64Z" fill={u('blue')} />
              <path d={`M82 160 L93 155 L93 158 L82 163Z`} fill={c2} />
            </g>
          ))}
          <path d="M150 99.5 L160 92" stroke={c2} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M56.5 112 L63 101" stroke={c2} strokeWidth="2.2" strokeLinecap="round" />
        </g>
      )}

      {/* head: the nose of the train */}
      <path d="M100 22 C125 22 140 38 141 56 C142 72 128 85 100 87 C72 85 58 72 59 56 C60 38 75 22 100 22Z" fill={u('nose')} {...OL} />
      <path d="M60.5 64 C66 77 82 85.5 100 86.5 C118 85.5 134 77 139.5 64 C133 71 119 75.5 100 75.5 C81 75.5 67 71 60.5 64Z" fill={u('blue')} />
      <ellipse cx="86" cy="30" rx="14" ry="4.5" fill="#fff" opacity=".85" transform="rotate(-14 86 30)" />
      <path d="M118 28 Q132 36 136 52" fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity=".8" />
      <path d="M68 60 C72 66 78 68 84 70 M132 60 C128 66 122 68 116 70" fill="none" stroke={sh(40)} strokeWidth=".7" />
      {/* the windscreen is its visor */}
      <path d="M69 49 C73 36 127 36 131 49 L128 58 C117 53.5 83 53.5 72 58Z" fill={u('glass')} stroke="var(--fg)" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M74 45.5 C86 39.5 114 39.5 126 45.5" fill="none" stroke="#fff" strokeWidth=".9" opacity=".55" />
      <path d="M100 40 V54.5" stroke={sh(55)} strokeWidth="1.3" />
      <path d="M117 41.5 l-5 11 M121.5 42.5 l-4 9.5" stroke="#fff" strokeWidth="1" opacity=".3" />
      <Eyes still={still}>
        {happy ? (
          <g>
            <path d="M81.5 50.5 Q87 43.5 92.5 50.5 M107.5 50.5 Q113 43.5 118.5 50.5" fill="none" stroke={lamp} strokeWidth="4.5" strokeLinecap="round" filter={u('glow')} />
            <path d="M81.5 50.5 Q87 43.5 92.5 50.5 M107.5 50.5 Q113 43.5 118.5 50.5" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
          </g>
        ) : (
          <g>
            <rect x="81" y="44.5" width="12" height="6.2" rx="3.1" fill={lamp} filter={u('glow')} />
            <rect x="107" y="44.5" width="12" height="6.2" rx="3.1" fill={lamp} filter={u('glow')} />
            <rect x="82" y="45" width="10" height="5.2" rx="2.6" fill="#fff" />
            <rect x="108" y="45" width="10" height="5.2" rx="2.6" fill="#fff" />
            <rect x="85" y="46.2" width="4" height="2.8" rx="1.4" fill={c2} />
            <rect x="111" y="46.2" width="4" height="2.8" rx="1.4" fill={c2} />
          </g>
        )}
      </Eyes>
      {/* headlights and the nose cap */}
      {[0, 1].map((k) => (
        <g key={k} transform={k ? 'translate(200 0) scale(-1 1)' : undefined}>
          <ellipse cx="74" cy="64.5" rx="6" ry="3" fill="#fff6cf" filter={u('glow')} opacity=".8" transform="rotate(24 74 64.5)" />
          <ellipse cx="74" cy="64.5" rx="5" ry="2.4" fill={u('lamp')} stroke="var(--fg)" strokeWidth="1" transform="rotate(24 74 64.5)" />
        </g>
      ))}
      <circle cx="100" cy="64.5" r="5" fill={u('nose')} stroke={sh(45)} strokeWidth="1" />
      <circle cx="98.6" cy="63" r="1.6" fill="#fff" />
      {happy && (
        <g opacity=".55">
          <ellipse cx="75" cy="56.5" rx="4" ry="2" fill="#ff8fa3" />
          <ellipse cx="125" cy="56.5" rx="4" ry="2" fill="#ff8fa3" />
        </g>
      )}
      {happy ? (
        <path d="M90 77 Q100 86 110 77 Q100 80 90 77Z" fill="#0b1430" stroke="#fff" strokeWidth=".9" strokeLinejoin="round" />
      ) : (
        <path d="M93.5 78.5 Q100 82 106.5 78.5" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
      )}
    </g>
  );
}

// ─── Castle Keep ────────────────────────────────────────────────────────────
/** A tiled roof with up-turned eaves: top edge yt (half width ht), eave yb (half width hb). */
function Roof({ yt, ht, yb, hb, u, c, c2, lift = 4 }: { yt: number; ht: number; yb: number; hb: number; u: (s: string) => string; c: string; c2: string; lift?: number }) {
  const L = 100 - hb;
  const R = 100 + hb;
  const d = `M${100 - ht} ${yt} L${100 + ht} ${yt} Q${R - 5} ${yb - 3} ${R + 3} ${yb - lift} Q${R - 2} ${yb + 2} ${R - 7} ${yb + 1.4} Q100 ${yb + 3.5} ${L + 7} ${yb + 1.4} Q${L + 2} ${yb + 2} ${L - 3} ${yb - lift} Q${L + 5} ${yb - 3} ${100 - ht} ${yt}Z`;
  const n = Math.round(hb / 3.2);
  return (
    <g>
      <path d={`M${L + 4} ${yb + 1.5} Q100 ${yb + 4.5} ${R - 4} ${yb + 1.5} L${R - 9} ${yb + 5} Q100 ${yb + 7} ${L + 9} ${yb + 5}Z`} fill={dk(c, 18)} />
      <path d={d} fill={u('roof')} {...OL} />
      {Array.from({ length: n * 2 - 1 }, (_, i) => {
        const f = (i - n + 1) / n;
        return <path key={i} d={`M${r1(100 + f * ht)} ${yt + 0.8} L${r1(100 + f * (hb - 5))} ${yb + 0.6}`} stroke={dk(c2, 38)} strokeWidth=".7" opacity=".85" />;
      })}
      <path d={`M${100 - ht} ${yt + 0.8} L${100 + ht} ${yt + 0.8}`} stroke={lt(c2, 40)} strokeWidth="1" opacity=".8" />
      {Array.from({ length: n * 2 - 2 }, (_, i) => {
        const x = L + 8 + ((R - L - 16) * (i + 0.5)) / (n * 2 - 2);
        const y = yb + 1.4 + 2.1 * (1 - ((x - 100) / hb) ** 2);
        return <circle key={i} cx={r1(x)} cy={r1(y)} r=".95" fill={lt(c2, 35)} stroke={dk(c2, 50)} strokeWidth=".4" />;
      })}
      <circle cx={R + 2.6} cy={yb - lift + 0.4} r="1.3" fill={GOLD} />
      <circle cx={L - 2.6} cy={yb - lift + 0.4} r="1.3" fill={GOLD} />
    </g>
  );
}
/** A latticed window. */
function Lattice({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx=".8" fill="#2a2420" stroke="#140f0c" strokeWidth=".7" />
      {Array.from({ length: Math.max(2, Math.round(w / 2.6)) - 1 }, (_, i) => {
        const bx = x + ((i + 1) * w) / Math.max(2, Math.round(w / 2.6));
        return <path key={i} d={`M${r1(bx)} ${y + 0.6} V${y + h - 0.6}`} stroke="#8b7a66" strokeWidth=".8" />;
      })}
      <path d={`M${x} ${y + h + 0.8} H${x + w}`} stroke="#5a3a24" strokeWidth="1.4" />
    </g>
  );
}
function Sakura({ x, flip, still }: { x: number; flip: boolean; still: boolean }) {
  const puffs = [
    [x - 6, 102, 11],
    [x + 8, 94, 12],
    [x + 20, 100, 10],
    [x - 2, 86, 9],
    [x + 14, 82, 8],
    [x - 12, 114, 8],
    [x + 6, 110, 10],
    [x + 22, 114, 7],
  ] as const;
  return (
    <g transform={flip ? 'translate(200 0) scale(-1 1)' : undefined}>
      <path d={`M${x + 2} 180 C${x + 4} 160 ${x - 2} 140 ${x + 4} 118 M${x + 3} 136 C${x + 10} 128 ${x + 16} 120 ${x + 18} 110 M${x + 1} 126 C${x - 4} 120 ${x - 8} 112 ${x - 8} 106`} fill="none" stroke="var(--fg)" strokeWidth="7" strokeLinecap="round" />
      <path d={`M${x + 2} 180 C${x + 4} 160 ${x - 2} 140 ${x + 4} 118 M${x + 3} 136 C${x + 10} 128 ${x + 16} 120 ${x + 18} 110 M${x + 1} 126 C${x - 4} 120 ${x - 8} 112 ${x - 8} 106`} fill="none" stroke="#5b3b2a" strokeWidth="4.2" strokeLinecap="round" />
      <path d={`M${x + 1} 176 C${x + 2} 160 ${x - 3} 142 ${x + 2} 122`} fill="none" stroke="#8a6248" strokeWidth="1" strokeLinecap="round" />
      <g className={an(still, 'ben-sway')} style={origin(x + 4, 140)}>
        <g opacity=".55">
          {puffs.map(([px, py, r], i) => (
            <circle key={i} cx={px} cy={py} r={r + 1.3} fill="var(--fg)" />
          ))}
        </g>
        {puffs.map(([px, py, r], i) => (
          <circle key={i} cx={px} cy={py} r={r} fill="#e98fab" />
        ))}
        {puffs.map(([px, py, r], i) => (
          <circle key={i} cx={px - r * 0.15} cy={py - r * 0.2} r={r * 0.78} fill="#f7b6c9" />
        ))}
        {puffs.map(([px, py, r], i) => (
          <circle key={i} cx={px - r * 0.3} cy={py - r * 0.35} r={r * 0.36} fill="#ffe3ec" />
        ))}
        {puffs.map(([px, py], i) => (
          <polygon key={i} points={star(px + 3, py + 2, 2.2, 5, 0.5)} fill="#fff" opacity=".9" />
        ))}
      </g>
    </g>
  );
}

function Tenshu({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const id = (s: string) => `${uid}-${s}`;
  const u = (s: string) => `url(#${uid}-${s})`;
  const wood = '#4a3020';
  const stone = (x: number, y: number, w: number, k: number) => <rect key={`${x}-${y}`} x={x} y={y} width={w} height="4.4" rx="1.2" fill={k % 3 ? '#a59f93' : '#8f897d'} stroke="#57524a" strokeWidth=".5" />;
  const shachi = (
    <g>
      <path d="M90 18 C86 17 83.5 13 84.5 9 C85 6 87 4.5 86 2.8 C89 3.2 90.5 5.5 89.5 8 C92 6 93.5 7.5 92.5 9.5 C90.5 9 88.5 10.5 88.5 13 C88.5 15 90 16.5 91.5 17Z" fill={u('gold')} stroke="var(--fg)" strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M86 12 q1.5 1 3 0.4 M86.5 9.5 q1.2 .8 2.4 .3" fill="none" stroke="#9a6b14" strokeWidth=".5" />
      <circle cx="90.2" cy="16" r=".55" fill={INK} />
    </g>
  );
  return (
    <g>
      <defs>
        <Sheen id={id('wall')} c={c} a={45} b={14} />
        <linearGradient id={id('roof')} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={lt(c2, 22)} />
          <stop offset=".55" stopColor={c2} />
          <stop offset="1" stopColor={dk(c2, 38)} />
        </linearGradient>
        <Metal id={id('gold')} a="#fff3c4" b={GOLD} c="#c08a1e" />
        <radialGradient id={id('sky')} cx=".5" cy=".45" r=".55">
          <stop offset="0" stopColor="#ffd6e2" stopOpacity=".6" />
          <stop offset="1" stopColor="#ffd6e2" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('win')}>
          <stop offset="0" stopColor="#fff6d0" />
          <stop offset=".45" stopColor="#ffc95a" />
          <stop offset="1" stopColor="#ff9a2a" stopOpacity="0" />
        </radialGradient>
        <clipPath id={id('base')}>
          <path d="M58 147 H142 Q144 161 159 170 H41 Q56 161 58 147Z" />
        </clipPath>
        <Blur id={id('glow')} sd={1.8} />
      </defs>

      {/* Mk III: a spring sky and cherry trees in bloom */}
      {mk === 3 && (
        <g>
          <circle cx="100" cy="92" r="92" fill={u('sky')} />
          <Sakura x={24} flip={false} still={still} />
          <Sakura x={24} flip still={still} />
        </g>
      )}
      <Shadow rx={mk === 3 ? 66 : 50} />

      {/* stone feet and timber legs */}
      {[80, 107].map((x) => (
        <g key={x}>
          <rect x={x} y="148" width="13" height="28" rx="2.5" fill={wood} {...OL} />
          <path d={`M${x + 2.5} 150 V174`} stroke="#7a5638" strokeWidth="1.2" />
          {[156, 166].map((y) => (
            <rect key={y} x={x - 0.6} y={y} width="14.2" height="2.6" fill={u('gold')} stroke="#7a5414" strokeWidth=".4" />
          ))}
          <path d={`M${x - 6} 182 L${x - 4} 173 H${x + 17} L${x + 19} 182Z`} fill="#9d978b" {...OL} strokeWidth="2" />
          <path d={`M${x - 3} 177.5 H${x + 16} M${x + 6} 173.5 V177.5 M${x + 1} 177.5 V181.5 M${x + 12} 177.5 V181.5`} stroke="#5f5a51" strokeWidth=".7" />
        </g>
      ))}

      {/* little arms from under the eaves: one hangs, one waves */}
      {[
        { d: 'M64 124 L52 136 L50 149', h: [50, 151] as const, cls: '' },
        { d: 'M136 124 L150 120 L156 106', h: [156, 103] as const, cls: 'ben-wave' },
      ].map((a, i) => (
        <g key={i} className={a.cls ? an(still, a.cls) : undefined} style={origin(136, 124)}>
          <path d={a.d} fill="none" stroke="var(--fg)" strokeWidth="10.5" strokeLinejoin="round" strokeLinecap="round" />
          <path d={a.d} fill="none" stroke={wood} strokeWidth="6.5" strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={i ? 150 : 52} cy={i ? 120 : 136} r="2.4" fill={u('gold')} />
          <circle cx={a.h[0]} cy={a.h[1]} r="5.6" fill={u('wall')} {...OL} strokeWidth="2" />
        </g>
      ))}

      {/* first storey: the body, with its gate */}
      <rect x="60" y="113" width="80" height="37" fill={u('wall')} {...OL} />
      <rect x="61.2" y="114.2" width="77.6" height="6" fill={dk(c, 30)} opacity=".45" />
      <path d="M61 141 H139 V148.8 H61Z" fill="#2b2622" />
      {Array.from({ length: 13 }, (_, i) => (
        <path key={i} d={`M${64 + i * 6} 141.5 V148.5`} stroke="#4a423b" strokeWidth=".7" />
      ))}
      <path d="M61 141 H139" stroke={dk(c, 40)} strokeWidth="1" />
      <Lattice x={66} y={121} w={13} h={11} />
      <Lattice x={121} y={121} w={13} h={11} />
      {[82, 86, 114, 118].map((x, i) => (i % 2 ? <rect key={x} x={x - 1.3} y="135" width="2.6" height="2.6" fill="#2b2622" /> : <path key={x} d={`M${x - 1.6} 137.6 L${x} 134.6 L${x + 1.6} 137.6Z`} fill="#2b2622" />))}
      <rect x="90" y="127" width="20" height="22" rx="1" fill={wood} stroke="#1d130c" strokeWidth="1" />
      <path d="M100 127 V149 M90 133 H110 M90 142 H110" stroke="#1d130c" strokeWidth=".8" />
      {[93, 97, 103, 107].map((x) => [133, 142].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r=".75" fill={GOLD} />))}
      <rect x="88.5" y="125.5" width="23" height="2.4" fill={u('gold')} />
      <path d="M78.5 118 H121.5" stroke={dk(c, 22)} strokeWidth=".8" />

      {/* first roof, with a triangular gable and the crest */}
      <Roof yt={101} ht={32} yb={113} hb={52} u={u} c={c} c2={c2} />
      <path d="M84 112 L100 97 L116 112Z" fill={u('wall')} />
      <path d="M82 113 L100 96 L118 113" fill="none" stroke="var(--fg)" strokeWidth="5" strokeLinejoin="round" />
      <path d="M82 113 L100 96 L118 113" fill="none" stroke={c2} strokeWidth="3" strokeLinejoin="round" />
      <path d="M83.5 112.2 L100 97.6 L116.5 112.2" fill="none" stroke={lt(c2, 40)} strokeWidth=".6" />
      <circle cx="100" cy="106.5" r="3.6" fill={u('gold')} stroke="#7a5414" strokeWidth=".6" />
      {ring(5, (i, a) => {
        const [x, y] = pt(100, 106.5, 1.7, a);
        return <circle key={i} cx={x} cy={y} r=".9" fill="#9a6b14" />;
      })}
      <path d="M97.6 97.8 L100 95 L102.4 97.8" fill={GOLD} stroke="#7a5414" strokeWidth=".5" />

      {/* second storey: the chest */}
      <rect x="70" y="80" width="60" height="22" fill={u('wall')} {...OL} />
      <rect x="71.2" y="81.2" width="57.6" height="5" fill={dk(c, 30)} opacity=".45" />
      <Lattice x={75} y={87} w={12} h={9} />
      <Lattice x={113} y={87} w={12} h={9} />
      <path d="M71 98.5 H129" stroke={dk(c, 22)} strokeWidth=".8" />

      {/* second roof, with a curved karahafu gable */}
      <Roof yt={68} ht={22} yb={80} hb={40} u={u} c={c} c2={c2} lift={3.5} />
      <path d="M85 80.5 Q92 80.5 95 75 Q100 66 105 75 Q108 80.5 115 80.5Z" fill={u('wall')} />
      <path d="M84 81 Q92 81 95 75 Q100 65.5 105 75 Q108 81 116 81" fill="none" stroke="var(--fg)" strokeWidth="4.6" strokeLinecap="round" />
      <path d="M84 81 Q92 81 95 75 Q100 65.5 105 75 Q108 81 116 81" fill="none" stroke={c2} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M85 80 Q92 80 95 74.4 Q100 66.4 105 74.4 Q108 80 115 80" fill="none" stroke={GOLD} strokeWidth=".7" />
      <circle cx="100" cy="76" r="1.8" fill={u('gold')} />

      {/* top storey: the head, its windows the eyes */}
      <rect x="79" y="38" width="42" height="31" fill={u('wall')} {...OL} />
      <rect x="80.2" y="39.2" width="39.6" height="4.5" fill={dk(c, 30)} opacity=".45" />
      <path d="M80 44.5 H120" stroke={dk(c, 25)} strokeWidth=".8" />
      <path d="M83 39 V68 M117 39 V68" stroke={dk(c, 12)} strokeWidth=".8" />
      <Eyes still={still}>
        {happy ? (
          <g>
            <path d="M85 57 Q90.5 46 96 57Z M104 57 Q109.5 46 115 57Z" fill={u('win')} />
            <path d="M84.5 57.5 Q90.5 45 96.5 57.5 M103.5 57.5 Q109.5 45 115.5 57.5" fill="none" stroke="#2a1a10" strokeWidth="2.6" strokeLinecap="round" />
          </g>
        ) : (
          <g>
            {[85, 104].map((x) => (
              <g key={x}>
                <rect x={x} y="47" width="11" height="11" rx="1" fill="#231a14" stroke="#120c08" strokeWidth=".7" />
                <circle cx={x + 5.5} cy="52.5" r="4.6" fill={u('win')} filter={u('glow')} />
                <circle cx={x + 5.5} cy="52.5" r="2.6" fill="#fff4cc" />
                <circle cx={x + 6.1} cy="53" r="1.5" fill="#2a1a10" />
                <path d={`M${x + 0.6} 47.4 V57.6 M${x + 10.4} 47.4 V57.6`} stroke="#8b7a66" strokeWidth="1" />
                <path d={`M${x} 58.8 H${x + 11}`} stroke={wood} strokeWidth="1.4" />
              </g>
            ))}
          </g>
        )}
      </Eyes>
      {happy && (
        <g opacity=".55">
          <ellipse cx="85" cy="61" rx="3.2" ry="1.8" fill="#ff8fa3" />
          <ellipse cx="115" cy="61" rx="3.2" ry="1.8" fill="#ff8fa3" />
        </g>
      )}
      {happy ? (
        <path d="M95 61.5 Q100 67.5 105 61.5Z" fill="#3a1a14" stroke="#2a1a10" strokeWidth=".8" strokeLinejoin="round" />
      ) : (
        <path d="M97 63 Q100 65 103 63" fill="none" stroke="#2a1a10" strokeWidth="1.4" strokeLinecap="round" />
      )}

      {/* the top roof and its ridge */}
      <Roof yt={20} ht={13} yb={38} hb={31} u={u} c={c} c2={c2} lift={4.5} />
      <rect x="85" y="16" width="30" height="4.6" rx="1.4" fill={dk(c2, 45)} {...OL} strokeWidth="1.6" />
      <path d="M86.5 17.3 H113.5" stroke={lt(c2, 30)} strokeWidth=".7" />
      <rect x="83.5" y="14.5" width="5" height="6" rx="1.2" fill={dk(c2, 55)} stroke="var(--fg)" strokeWidth="1" />
      <rect x="111.5" y="14.5" width="5" height="6" rx="1.2" fill={dk(c2, 55)} stroke="var(--fg)" strokeWidth="1" />

      {/* Mk II: golden shachihoko on the ridge */}
      {mk >= 2 && (
        <g>
          <path d="M100 22 L76 28" stroke="none" />
          <g transform="translate(-4.5 0)">{shachi}</g>
          <g transform="translate(204.5 0) scale(-1 1)">{shachi}</g>
        </g>
      )}

      {/* Mk III: stone base walls */}
      {mk === 3 && (
        <g>
          <path d="M58 147 H142 Q144 161 159 170 H41 Q56 161 58 147Z" fill="#8f897d" {...OL} />
          <g clipPath={u('base')}>
            {Array.from({ length: 5 }, (_, row) => {
              const y = 147.5 + row * 4.6;
              const ws = [9, 12, 8, 11, 10, 13, 9, 12, 10, 8, 11, 12];
              let x = 30 + (row % 2) * 5;
              return ws.map((w, k) => {
                const el = stone(x, y, w - 0.8, k + row);
                x += w;
                return el;
              });
            })}
            <path d="M58 148 H142" stroke="#fff" strokeWidth=".8" opacity=".6" />
          </g>
          <path d="M58 147 H142 Q144 161 159 170 H41 Q56 161 58 147Z" fill="none" {...OL} />
          <path d="M44 169.5 H156" stroke="#5f5a51" strokeWidth="1" />
        </g>
      )}

      {/* Mk III: falling petals */}
      {mk === 3 &&
        [
          [40, 70, 0],
          [60, 130, 1.2],
          [150, 64, 2.1],
          [168, 128, 3.3],
          [30, 140, 2.8],
          [128, 150, 4.1],
          [72, 40, 3.7],
          [178, 92, 0.6],
        ].map(([x, y, d], i) => (
          <g key={i} className={an(still, 'ben-fall')} style={{ ...origin(x, y), ...delay(-d) }}>
            <path d={`M${x} ${y} q2.4 -2.4 4 0 q-2 2.6 -4 0Z`} fill="#f7a8c0" stroke="#d76d92" strokeWidth=".4" />
          </g>
        ))}
    </g>
  );
}

// ─── Abyss Diver ────────────────────────────────────────────────────────────
/** Points along a polyline, every `step` px. */
const along = (pts: readonly (readonly [number, number])[], step: number) => {
  const out: [number, number][] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[i + 1];
    const n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / step));
    for (let k = 0; k < n; k++) out.push([r1(ax + ((bx - ax) * k) / n), r1(ay + ((by - ay) * k) / n)]);
  }
  out.push([pts[pts.length - 1][0], pts[pts.length - 1][1]]);
  return out;
};
/** A small porthole: brass ring, dark glass, a glint. */
function Port({ x, y, r, u, glow }: { x: number; y: number; r: number; u: (s: string) => string; glow?: boolean }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={u('brass')} stroke="var(--fg)" strokeWidth="1.1" />
      <circle cx={x} cy={y} r={r * 0.66} fill={glow ? u('lampG') : u('glass')} stroke="#3b2a12" strokeWidth=".5" />
      <path d={arc(x, y, r * 0.48, 200, 260)} fill="none" stroke="#fff" strokeWidth=".8" strokeLinecap="round" opacity=".85" />
    </g>
  );
}

function Diver({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const id = (s: string) => `${uid}-${s}`;
  const u = (s: string) => `url(#${uid}-${s})`;
  const lead = '#3c4048';
  /** Segmented limb: overlapping rings like an armoured suit. */
  const limb = (pts: readonly (readonly [number, number])[], r: number, key: string) => {
    const p = along(pts, r * 0.9);
    return (
      <g key={key}>
        {p.map(([x, y], i) => (
          <circle key={`o${i}`} cx={x} cy={y} r={r + 1.2} fill="var(--fg)" />
        ))}
        {p.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={r} fill={u('cop')} />
            <path d={arc(x, y, r - 0.8, 200, 290)} fill="none" stroke={lt(c, 55)} strokeWidth=".8" opacity=".9" />
            <path d={arc(x, y, r, 20, 160)} fill="none" stroke={dk(c, 50)} strokeWidth=".9" />
          </g>
        ))}
      </g>
    );
  };
  const claw = (x: number, y: number, rot: number) => (
    <g transform={`rotate(${rot} ${x} ${y})`}>
      <path d={`M${x - 2} ${y} C${x - 7} ${y + 3} ${x - 7} ${y + 9} ${x - 3} ${y + 12} C${x - 4} ${y + 8} ${x - 3} ${y + 5} ${x} ${y + 3}Z`} fill={u('cop')} {...OL} strokeWidth="1.6" />
      <path d={`M${x + 2} ${y} C${x + 7} ${y + 3} ${x + 7} ${y + 9} ${x + 3} ${y + 12} C${x + 4} ${y + 8} ${x + 3} ${y + 5} ${x} ${y + 3}Z`} fill={u('cop')} {...OL} strokeWidth="1.6" />
      <circle cx={x} cy={y} r="4.6" fill={u('brass')} stroke="var(--fg)" strokeWidth="1.4" />
      <circle cx={x} cy={y} r="1.4" fill={lead} />
    </g>
  );
  return (
    <g>
      <defs>
        <Ball id={id('cop')} c={c} hi={50} />
        <Ball id={id('helm')} c={c} hi={60} fx={0.32} fy={0.26} />
        <CylX id={id('body')} c={c} />
        <Metal id={id('brass')} a="#fff1c0" b="#e0b252" c="#9c7224" />
        <radialGradient id={id('glass')} cx=".4" cy=".35">
          <stop offset="0" stopColor={mix(c2, '#02101a', 55)} />
          <stop offset="1" stopColor="#02070d" />
        </radialGradient>
        <Hot id={id('lampG')} c={c2} />
        <radialGradient id={id('deep')} cx=".5" cy=".4" r=".6">
          <stop offset="0" stopColor={c2} stopOpacity=".32" />
          <stop offset=".6" stopColor={mix(c2, '#0b2a4a', 50)} stopOpacity=".2" />
          <stop offset="1" stopColor="#0b2a4a" stopOpacity="0" />
        </radialGradient>
        <Ball id={id('fish')} c="#3a3566" hi={35} />
        <linearGradient id={id('ray')} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={lt(c2, 50)} stopOpacity=".7" />
          <stop offset="1" stopColor={c2} stopOpacity="0" />
        </linearGradient>
        <Blur id={id('glow')} sd={2.6} />
      </defs>

      {/* Mk III: deep water, light from far above */}
      {mk === 3 && (
        <g>
          <circle cx="100" cy="100" r="96" fill={u('deep')} />
          {[
            [70, 0.16],
            [100, 0.22],
            [132, 0.14],
          ].map(([x, o]) => (
            <path key={x} d={`M${x - 5} 4 L${x + 5} 4 L${x + 20} 140 L${x - 12} 140Z`} fill={u('ray')} opacity={o * 2.4} />
          ))}
          {[
            [22, 60],
            [36, 120],
            [176, 54],
            [184, 100],
            [16, 160],
            [150, 20],
            [50, 24],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r=".9" fill={lt(c2, 60)} opacity=".8" />
          ))}
        </g>
      )}
      <Shadow rx={mk === 3 ? 66 : 50} />

      {/* Mk II: the air hose, up to the surface */}
      {mk >= 2 && (
        <g>
          <path d="M76 42 C60 34 46 26 38 2" fill="none" stroke="var(--fg)" strokeWidth="9" strokeLinecap="round" />
          <path d="M76 42 C60 34 46 26 38 2" fill="none" stroke="#2c3038" strokeWidth="6.4" strokeLinecap="round" />
          <path d="M76 42 C60 34 46 26 38 2" fill="none" stroke="#5c6370" strokeWidth="6.4" strokeDasharray="1.2 2.6" />
          <path d="M74 39.8 C59 32 46 24 39.5 4" fill="none" stroke="#fff" strokeWidth=".8" opacity=".35" />
        </g>
      )}

      {/* boots and legs */}
      {[86, 114].map((x, k) => (
        <g key={x}>
          {limb([
            [x, 144],
            [x, 168],
          ], 6.4, `l${k}`)}
          <Port x={x} y={157} r={3.6} u={u} />
          <path d={`M${x - 15} 182 L${x - 13} 172 Q${x} 168 ${x + 13} 172 L${x + 14} 182Z`} fill={lead} {...OL} />
          <path d={`M${x - 15} 182 L${x - 13} 174 Q${x - 10} 171 ${x - 6} 171 L${x - 7} 182Z`} fill={u('brass')} />
          <path d={`M${x - 12} 177 H${x + 12}`} stroke="#6b717c" strokeWidth="1.6" />
          <circle cx={x + 7} cy="177" r="1.2" fill={u('brass')} />
        </g>
      ))}

      {/* arms: segmented, with pincers; the right one up in a hello */}
      {limb([
        [66, 106],
        [55, 124],
        [50, 142],
      ], 6.2, 'al')}
      {limb([
        [134, 106],
        [151, 116],
        [157, 98],
      ], 6.2, 'ar')}
      {claw(50, 146, 8)}
      {claw(158, 93, 200)}

      {/* the body */}
      <path d="M66 98 Q63 128 73 145 Q100 154 127 145 Q137 128 134 98Z" fill={u('body')} {...OL} />
      <path d="M69 128 Q100 138 131 128" fill="none" stroke={dk(c, 45)} strokeWidth="1" />
      <path d="M71 131 Q100 141 129 131" fill="none" stroke={lt(c, 40)} strokeWidth=".6" opacity=".7" />
      {Array.from({ length: 9 }, (_, i) => {
        const x = 72 + i * 7;
        return <circle key={i} cx={x} cy={r1(130.5 + 9 * (1 - ((x - 100) / 30) ** 2) * 0.55)} r=".8" fill={lt(c, 50)} />;
      })}
      <rect x="77" y="100" width="2.4" height="40" rx="1.2" fill="#fff" opacity=".28" />
      <Port x={78} y={113} r={4.6} u={u} />
      <Port x={122} y={113} r={4.6} u={u} />
      <Port x={87} y={140} r={3.4} u={u} />
      <Port x={113} y={140} r={3.4} u={u} />
      {/* the lamp heart */}
      <g className={an(still, 'ben-pulse')}>
        <circle cx="100" cy="119" r="16" fill={c2} opacity=".55" filter={u('glow')} />
      </g>
      <circle cx="100" cy="119" r="11.5" fill={u('brass')} stroke="var(--fg)" strokeWidth="1.4" />
      <circle cx="100" cy="119" r="8.6" fill={u('lampG')} />
      <path d="M100 110.5 V127.5 M91.5 119 H108.5 M94 113 L106 125 M106 113 L94 125" stroke="#9c7224" strokeWidth=".9" />
      <circle cx="100" cy="119" r="2.8" fill="#fff" />
      {ring(8, (i, a) => {
        const [x, y] = pt(100, 119, 10.1, a);
        return <circle key={i} cx={x} cy={y} r=".7" fill="#6b4a12" />;
      })}

      {/* shoulders with portholes */}
      {[66, 134].map((x) => (
        <g key={x}>
          <circle cx={x} cy="103" r="10" fill={u('cop')} {...OL} />
          <Port x={x} y={103} r={4.4} u={u} />
        </g>
      ))}

      {/* the breastplate and its bolts */}
      <path d="M60 99 Q58 84 76 79 L124 79 Q142 84 140 99 Q120 106 100 106 Q80 106 60 99Z" fill={u('cop')} {...OL} />
      <path d="M64 97 Q62 87 77 82.5 L123 82.5 Q138 87 136 97" fill="none" stroke={lt(c, 50)} strokeWidth=".8" opacity=".8" />
      {[64, 74, 86, 114, 126, 136].map((x, i) => {
        const y = [97, 101.5, 103.5, 103.5, 101.5, 97][i];
        return (
          <g key={x}>
            <path d={`M${x - 2.6} ${y - 1.2} L${x + 2.6} ${y + 1.2} M${x + 2.6} ${y - 1.2} L${x - 2.6} ${y + 1.2}`} stroke="var(--fg)" strokeWidth="2.6" strokeLinecap="round" />
            <path d={`M${x - 2.4} ${y - 1} L${x + 2.4} ${y + 1} M${x + 2.4} ${y - 1} L${x - 2.4} ${y + 1}`} stroke="#e0b252" strokeWidth="1.4" strokeLinecap="round" />
            <circle cx={x} cy={y} r="1.3" fill="#9c7224" />
          </g>
        );
      })}

      {/* the helmet */}
      <circle cx="100" cy="56" r="31" fill={u('helm')} {...OL} />
      <path d={arc(100, 56, 29, 15, 70)} fill="none" stroke={lt(c, 60)} strokeWidth="1.3" strokeLinecap="round" opacity=".7" />
      <path d="M100 25.5 C86 34 84 78 100 86.5" fill="none" stroke={dk(c, 35)} strokeWidth=".8" opacity=".7" />
      <path d="M100 25.5 C114 34 116 78 100 86.5" fill="none" stroke={dk(c, 35)} strokeWidth=".8" opacity=".7" />
      <ellipse cx="86" cy="36" rx="9" ry="4.2" fill="#fff" opacity=".6" transform="rotate(-34 86 36)" />
      <ellipse cx="80" cy="44" rx="2" ry="1.2" fill="#fff" opacity=".8" transform="rotate(-50 80 44)" />
      {/* side ports with guards */}
      {[0, 1].map((k) => (
        <g key={k} transform={k ? 'translate(200 0) scale(-1 1)' : undefined}>
          <ellipse cx="72" cy="58" rx="5.4" ry="9" fill={u('brass')} stroke="var(--fg)" strokeWidth="1.4" />
          <ellipse cx="72" cy="58" rx="3.6" ry="6.6" fill={u('glass')} />
          <path d="M69.2 54 H74.8 M68.8 58 H75.2 M69.2 62 H74.8" stroke="#e0b252" strokeWidth="1.1" />
        </g>
      ))}
      {/* top port */}
      <ellipse cx="100" cy="31" rx="7.5" ry="3.6" fill={u('brass')} stroke="var(--fg)" strokeWidth="1.2" />
      <ellipse cx="100" cy="31" rx="5" ry="2.1" fill={u('glass')} />
      {/* exhaust valve */}
      <rect x="121" y="72" width="6" height="5" rx="1.2" fill={u('brass')} stroke="var(--fg)" strokeWidth="1" transform="rotate(-38 124 74.5)" />
      {/* the faceplate: a big porthole with eyes behind the glass */}
      <circle cx="100" cy="60" r="17" fill={u('brass')} stroke="var(--fg)" strokeWidth="1.8" />
      <circle cx="100" cy="60" r="17" fill="none" stroke="#fff" strokeWidth=".8" opacity=".5" strokeDasharray="10 96" strokeDashoffset="-58" />
      {ring(8, (i, a) => {
        const [x, y] = pt(100, 60, 15, a + 22.5);
        return <circle key={i} cx={x} cy={y} r="1.1" fill="#7c5a1a" stroke="#fff3c8" strokeWidth=".3" />;
      })}
      <circle cx="100" cy="60" r="12.6" fill={u('glass')} stroke="#5a3e12" strokeWidth=".8" />
      <Eyes still={still}>
        {happy ? (
          <g>
            <path d="M89.5 62 Q94 55.5 98.5 62 M101.5 62 Q106 55.5 110.5 62" fill="none" stroke={c2} strokeWidth="4" strokeLinecap="round" filter={u('glow')} />
            <path d="M89.5 62 Q94 55.5 98.5 62 M101.5 62 Q106 55.5 110.5 62" fill="none" stroke={lt(c2, 60)} strokeWidth="2.2" strokeLinecap="round" />
          </g>
        ) : (
          <g>
            <ellipse cx="94" cy="59.5" rx="4.4" ry="5.4" fill={c2} filter={u('glow')} />
            <ellipse cx="106" cy="59.5" rx="4.4" ry="5.4" fill={c2} filter={u('glow')} />
            <ellipse cx="94" cy="59.5" rx="3.3" ry="4.3" fill={lt(c2, 55)} />
            <ellipse cx="106" cy="59.5" rx="3.3" ry="4.3" fill={lt(c2, 55)} />
            <circle cx="95" cy="58" r="1.3" fill="#fff" />
            <circle cx="107" cy="58" r="1.3" fill="#fff" />
          </g>
        )}
      </Eyes>
      {happy ? (
        <path d="M96 66 Q100 70.5 104 66" fill="none" stroke={lt(c2, 50)} strokeWidth="1.5" strokeLinecap="round" />
      ) : (
        <path d="M97.5 67 h5" stroke={mix(c2, '#02101a', 30)} strokeWidth="1.3" strokeLinecap="round" />
      )}
      {happy && (
        <g opacity=".7">
          <ellipse cx="89" cy="66" rx="2.4" ry="1.3" fill="#ff8fa3" />
          <ellipse cx="111" cy="66" rx="2.4" ry="1.3" fill="#ff8fa3" />
        </g>
      )}
      <path d={arc(100, 60, 10.5, 200, 255)} fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" opacity=".75" />
      <circle cx="108" cy="67" r=".9" fill="#fff" opacity=".7" />

      {/* Mk II: a pressure gauge on the chest */}
      {mk >= 2 && (
        <g>
          <path d="M76 42 L72 40" stroke="none" />
          <circle cx="74.5" cy="42" r="3.6" fill={u('brass')} stroke="var(--fg)" strokeWidth="1.2" />
          <circle cx="100" cy="96" r="8" fill={u('brass')} stroke="var(--fg)" strokeWidth="1.4" />
          <circle cx="100" cy="96" r="6.2" fill="#f6f1e2" stroke="#6b4a12" strokeWidth=".5" />
          <path d={arc(100, 96, 4.6, 140, 400)} fill="none" stroke="#2a2a2a" strokeWidth=".5" strokeDasharray=".6 1.4" />
          <path d={arc(100, 96, 4.6, 330, 400)} fill="none" stroke="#d62828" strokeWidth="1" />
          <g className={an(still, 'ben-wobble')} style={origin(100, 96)}>
            <path d="M100 96 L103.8 92.2" stroke="#d62828" strokeWidth="1.1" strokeLinecap="round" />
          </g>
          <circle cx="100" cy="96" r="1" fill={INK} />
          <path d="M96.5 93 Q97.5 92 99 91.6" fill="none" stroke="#fff" strokeWidth=".7" />
        </g>
      )}

      {/* Mk III: a lantern, bubbles and an anglerfish friend */}
      {mk === 3 && (
        <g>
          <g className={an(still, 'ben-sway')} style={origin(50, 152)}>
            <path d="M50 152 V158" stroke="var(--fg)" strokeWidth="1.4" />
            <circle cx="50" cy="168" r="12" fill={c2} opacity=".5" filter={u('glow')} />
            <path d="M44 159 H56 L54 162 H46Z" fill={u('brass')} stroke="var(--fg)" strokeWidth="1.1" strokeLinejoin="round" />
            <rect x="44.5" y="162" width="11" height="12" rx="2" fill={u('lampG')} stroke="var(--fg)" strokeWidth="1.1" />
            <path d="M47.5 162.4 V173.6 M52.5 162.4 V173.6" stroke="#9c7224" strokeWidth=".9" />
            <path d="M44 174 H56 L54.5 177 H45.5Z" fill={u('brass')} stroke="var(--fg)" strokeWidth="1.1" strokeLinejoin="round" />
            <circle cx="50" cy="168" r="1.8" fill="#fff" />
          </g>
          {[
            [128, 38, 2.6, 0],
            [133, 30, 1.8, 0.8],
            [127, 22, 3.2, 1.6],
            [135, 14, 2.2, 2.4],
            [130, 8, 1.6, 3],
            [62, 70, 1.8, 1.2],
            [58, 60, 2.4, 2.2],
          ].map(([x, y, r, d], i) => (
            <g key={i} className={an(still, 'ben-rise')} style={delay(-d)}>
              <circle cx={x} cy={y} r={r} fill={lt(c2, 70)} fillOpacity=".25" stroke={lt(c2, 50)} strokeWidth=".8" />
              <circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.3} fill="#fff" />
            </g>
          ))}
          <g className={an(still, 'ben-bob-slow')}>
            {/* the lure */}
            <path d="M170 142 C168 128 158 124 152 128" fill="none" stroke="var(--fg)" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M170 142 C168 128 158 124 152 128" fill="none" stroke="#5b5590" strokeWidth="1" strokeLinecap="round" />
            <g className={an(still, 'ben-pulse')}>
              <circle cx="151" cy="129.5" r="7" fill={c2} opacity=".7" filter={u('glow')} />
            </g>
            <circle cx="151" cy="129.5" r="3" fill={u('lampG')} stroke="var(--fg)" strokeWidth=".8" />
            <circle cx="150" cy="128.5" r="1" fill="#fff" />
            {/* tail and fins */}
            <path d="M184 150 L194 142 Q192 152 194 160Z" fill="#4a4480" {...OL} strokeWidth="1.6" />
            <path d="M174 140 Q178 134 184 138 Q180 140 178 144Z" fill="#4a4480" {...OL} strokeWidth="1.4" />
            {/* body */}
            <ellipse cx="170" cy="152" rx="15" ry="12.5" fill={u('fish')} {...OL} strokeWidth="2" />
            <path d="M158 160 Q166 166 178 162" fill="none" stroke="#6c66a8" strokeWidth=".8" />
            {/* mouth with little teeth */}
            <path d="M155.5 151 Q160 160 168 158.5" fill="#160f2a" stroke="var(--fg)" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M157.5 153.4 l1 -1.4 l.6 2 M160.5 156.3 l1.2 -1.3 l.4 2 M164 157.8 l1.4 -1 l.1 2" fill="none" stroke="#fff" strokeWidth=".7" strokeLinejoin="round" />
            {/* a big friendly eye */}
            <circle cx="166" cy="147" r="4.4" fill="#fff" stroke="var(--fg)" strokeWidth="1" />
            <circle cx="165" cy="147.5" r="2.4" fill={INK} />
            <circle cx="164.2" cy="146.5" r=".9" fill="#fff" />
            <path d="M178 150 q2 3 0 6" fill="none" stroke="#7d77bb" strokeWidth="1" />
            <ellipse cx="166" cy="153.5" rx="2" ry="1" fill="#ff8fa3" opacity=".6" />
          </g>
        </g>
      )}
    </g>
  );
}

// ─── Clocktower ─────────────────────────────────────────────────────────────
const ROMAN = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
const SERIF = '"Times New Roman", Georgia, serif';
/** A clock hand from (x, y) pointing at `deg` (0 = twelve). */
const hand = (x: number, y: number, len: number, w: number, deg: number) => {
  const tip = pt(x, y, len, deg - 90);
  const mid = pt(x, y, len * 0.62, deg - 90);
  const l = pt(mid[0], mid[1], w, deg - 180);
  const r = pt(mid[0], mid[1], w, deg);
  const tail = pt(x, y, len * 0.16, deg + 90);
  return `M${tail[0]} ${tail[1]} L${l[0]} ${l[1]} L${tip[0]} ${tip[1]} L${r[0]} ${r[1]}Z`;
};
function MiniDial({ x, y, r, c2, u, still, k }: { x: number; y: number; r: number; c2: string; u: (s: string) => string; still: boolean; k: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={u('gold')} stroke="var(--fg)" strokeWidth="1.4" />
      <circle cx={x} cy={y} r={r * 0.78} fill="#f8f1dc" />
      {ring(12, (i, a) => {
        const [ax, ay] = pt(x, y, r * 0.7, a);
        const [bx, by] = pt(x, y, r * (i % 3 ? 0.62 : 0.52), a);
        return <line key={i} x1={ax} y1={ay} x2={bx} y2={by} stroke="#3a2618" strokeWidth={i % 3 ? 0.5 : 0.9} />;
      })}
      <g className={an(still, 'ben-spin')} style={{ ...origin(x, y), ...delay(-k * 1.3) }}>
        <path d={hand(x, y, r * 0.6, 0.9, k * 70)} fill="#2a1a10" />
      </g>
      <path d={hand(x, y, r * 0.42, 1.1, 120 + k * 50)} fill="#2a1a10" />
      <circle cx={x} cy={y} r=".9" fill={c2} />
    </g>
  );
}

function Clocktower({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const id = (s: string) => `${uid}-${s}`;
  const u = (s: string) => `url(#${uid}-${s})`;
  const enamel = '#f8f1dc';
  const ink = '#2a1a10';
  return (
    <g>
      <defs>
        <CylX id={id('wood')} c={c} />
        <Sheen id={id('woodY')} c={c} a={22} b={35} />
        <linearGradient id={id('gold')} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor={lt(c2, 55)} />
          <stop offset=".45" stopColor={c2} />
          <stop offset=".55" stopColor={dk(c2, 25)} />
          <stop offset="1" stopColor={lt(c2, 10)} />
        </linearGradient>
        <Ball id={id('bob')} c={c2} hi={60} />
        <radialGradient id={id('dial')} cx=".45" cy=".4" r=".65">
          <stop offset="0" stopColor="#fffdf4" />
          <stop offset=".8" stopColor={enamel} />
          <stop offset="1" stopColor="#d9cfb2" />
        </radialGradient>
        <linearGradient id={id('roof')} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={lt(c, 18)} />
          <stop offset="1" stopColor={dk(c, 45)} />
        </linearGradient>
        <radialGradient id={id('halo')}>
          <stop offset=".55" stopColor={c2} stopOpacity="0" />
          <stop offset=".8" stopColor={c2} stopOpacity=".22" />
          <stop offset="1" stopColor={c2} stopOpacity="0" />
        </radialGradient>
        <Blur id={id('glow')} sd={1.8} />
      </defs>

      {/* Mk III: a great face behind it, four little faces turning and the hours afloat */}
      {mk === 3 && (
        <g>
          <circle cx="100" cy="98" r="96" fill={u('halo')} />
          <circle cx="100" cy="98" r="76" fill="none" stroke={c2} strokeWidth="1" opacity=".5" />
          {ring(60, (i, a) => {
            const [ax, ay] = pt(100, 98, 76, a);
            const [bx, by] = pt(100, 98, i % 5 ? 73 : 69, a);
            return <line key={i} x1={ax} y1={ay} x2={bx} y2={by} stroke={c2} strokeWidth={i % 5 ? 0.6 : 1.4} opacity=".55" />;
          })}
          <g className={an(still, 'ben-spin-xslow')} style={origin(100, 98)}>
            {ROMAN.map((n, i) => {
              const [x, y] = pt(100, 98, 87, i * 30 - 75);
              return (
                <g key={n}>
                  <text x={x} y={y + 3} textAnchor="middle" fontSize="9" fontWeight="700" fontFamily={SERIF} fill={c2} filter={u('glow')} opacity=".9">
                    {n}
                  </text>
                  <text x={x} y={y + 3} textAnchor="middle" fontSize="9" fontWeight="700" fontFamily={SERIF} fill={c2} stroke="var(--fg)" strokeWidth=".7" paintOrder="stroke">
                    {n}
                  </text>
                </g>
              );
            })}
          </g>
          <g className={an(still, 'ben-spin-slow')} style={origin(100, 98)}>
            {[70, 160, 250, 340].map((a, k) => {
              const [x, y] = pt(100, 98, 76, a - 90);
              return <MiniDial key={a} x={x} y={y} r={10} c2={c2} u={u} still={still} k={k} />;
            })}
          </g>
        </g>
      )}
      <Shadow rx={mk === 3 ? 60 : 50} />

      {/* the pendulum tail */}
      <g className={an(still, 'ben-swing')} style={origin(100, 128)}>
        <path d="M100 128 V166" stroke="var(--fg)" strokeWidth="4.4" strokeLinecap="round" />
        <path d="M100 128 V166" stroke={u('gold')} strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="100" cy="171" r="9" fill={u('bob')} {...OL} strokeWidth="2" />
        <circle cx="100" cy="171" r="5.6" fill="none" stroke={dk(c2, 30)} strokeWidth=".8" />
        <ellipse cx="97" cy="167.5" rx="3" ry="1.6" fill="#fff" opacity=".8" transform="rotate(-30 97 167.5)" />
      </g>

      {/* legs */}
      {[80, 108].map((x) => (
        <g key={x}>
          <rect x={x} y="150" width="12" height="25" rx="3" fill={u('wood')} {...OL} />
          <rect x={x - 0.6} y="160" width="13.2" height="3" fill={u('gold')} stroke={dk(c2, 45)} strokeWidth=".4" />
          <path d={`M${x - 6} 182 Q${x - 6} 172 ${x + 6} 172 Q${x + 18} 172 ${x + 18} 182Z`} fill={u('woodY')} {...OL} />
          <path d={`M${x - 5} 181 Q${x - 5} 175 ${x + 1} 174`} fill="none" stroke={c2} strokeWidth="1.6" strokeLinecap="round" />
        </g>
      ))}

      {/* arms: one holds the winding key */}
      {[
        { d: 'M72 118 L60 134 L58 148', h: [58, 150] as const },
        { d: 'M128 118 L144 128 L150 114', h: [150, 112] as const },
      ].map((a, i) => (
        <g key={i}>
          <path d={a.d} fill="none" stroke="var(--fg)" strokeWidth="9" strokeLinejoin="round" strokeLinecap="round" />
          <path d={a.d} fill="none" stroke={u('gold')} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={i ? 144 : 60} cy={i ? 128 : 134} r="3.4" fill={u('bob')} stroke="var(--fg)" strokeWidth="1.2" />
        </g>
      ))}
      <g transform="rotate(-20 150 112)">
        <path d="M150 112 V92" stroke="var(--fg)" strokeWidth="4.4" strokeLinecap="round" />
        <path d="M150 112 V92" stroke={u('gold')} strokeWidth="2.4" strokeLinecap="round" />
        <path d="M150 92 C144 92 141 86 145 82.5 C147 81 149 82 150 84 C151 82 153 81 155 82.5 C159 86 156 92 150 92Z" fill={u('gold')} {...OL} strokeWidth="1.5" />
        <circle cx="146.8" cy="86" r="1.4" fill={dk(c2, 40)} />
        <circle cx="153.2" cy="86" r="1.4" fill={dk(c2, 40)} />
        <path d="M148 106 h-3 v-3 h3" fill="none" stroke="var(--fg)" strokeWidth="1" />
      </g>
      {[58, 150].map((x, i) => (
        <g key={x}>
          <circle cx={x} cy={i ? 112 : 150} r="5.6" fill="#fffaf0" {...OL} strokeWidth="1.8" />
          <path d={`M${x - 2.5} ${(i ? 112 : 150) - 1} h5`} stroke="#c8bfae" strokeWidth=".8" />
        </g>
      ))}

      {/* the tower body */}
      <path d="M70 108 H130 L128 152 H72Z" fill={u('wood')} {...OL} />
      {[78, 86, 94, 106, 114, 122].map((x) => (
        <path key={x} d={`M${x} 111 V150`} stroke={dk(c, 40)} strokeWidth=".7" />
      ))}
      <path d="M73 111 H127" stroke={lt(c, 35)} strokeWidth=".7" opacity=".7" />
      <rect x="69" y="146" width="62" height="6" rx="1" fill={u('gold')} stroke="var(--fg)" strokeWidth="1.4" />
      {[71.5, 128.5].map((x) => (
        <path key={x} d={`M${x} 110 V146`} stroke={u('gold')} strokeWidth="2.4" />
      ))}
      {/* a little arched door */}
      <path d="M93 146 V136 Q100 128 107 136 V146Z" fill={dk(c, 55)} stroke={c2} strokeWidth="1.1" />
      <path d="M100 131 V146" stroke={dk(c, 25)} strokeWidth=".6" />
      <circle cx="103.4" cy="140" r=".8" fill={c2} />
      {/* the winding hole, or Mk II: the gear train itself */}
      {mk >= 2 ? (
        <g>
          <circle cx="100" cy="120" r="12.5" fill="#1d120b" {...OL} strokeWidth="1.8" />
          <g className={an(still, 'ben-spin-slow')} style={origin(94, 117)}>
            <path d={gear(94, 117, 7, 12, 1.6, 1.6)} fill={u('gold')} fillRule="evenodd" stroke={dk(c2, 50)} strokeWidth=".5" />
            <path d="M94 111.5 V122.5 M88.5 117 H99.5" stroke={dk(c2, 35)} strokeWidth=".9" />
          </g>
          <g className={an(still, 'ben-spin-rev')} style={origin(106.5, 124)}>
            <path d={gear(106.5, 124, 5.2, 9, 1.4, 1.2)} fill={u('gold')} fillRule="evenodd" stroke={dk(c2, 50)} strokeWidth=".5" />
          </g>
          <g className={an(still, 'ben-spin')} style={origin(104, 112)}>
            <path d={gear(104, 112, 3.6, 7, 1.2, 0.9)} fill={lt(c2, 25)} fillRule="evenodd" stroke={dk(c2, 50)} strokeWidth=".5" />
          </g>
          <path d={arc(100, 120, 11, 200, 260)} fill="none" stroke="#fff" strokeWidth=".9" opacity=".5" />
          <circle cx="100" cy="120" r="12.5" fill="none" stroke={u('gold')} strokeWidth="1.6" />
        </g>
      ) : (
        <g>
          <circle cx="100" cy="120" r="6.5" fill={u('gold')} stroke="var(--fg)" strokeWidth="1.4" />
          <circle cx="100" cy="120" r="2.4" fill="#1d120b" />
        </g>
      )}

      {/* Mk II: a bell on a bracket */}
      {mk >= 2 && (
        <g>
          <path d="M138 33 H152 Q160 33 160 39" fill="none" stroke="var(--fg)" strokeWidth="4.4" strokeLinecap="round" />
          <path d="M138 33 H152 Q160 33 160 39" fill="none" stroke="#3a2e28" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M141 33 Q146 39 152 33" fill="none" stroke="#3a2e28" strokeWidth="1.2" />
          <g className={an(still, 'ben-ring')} style={origin(160, 39)}>
            <path d="M160 39 C154.5 39 153.5 44 153 49 C152.5 52 150.5 53 150 54.5 H170 C169.5 53 167.5 52 167 49 C166.5 44 165.5 39 160 39Z" fill={u('bob')} {...OL} strokeWidth="1.8" />
            <path d="M155.5 44 C155 47 154.5 50 153 52.5" fill="none" stroke="#fff" strokeWidth="1" opacity=".7" />
            <path d="M151.5 52 H168.5" stroke={dk(c2, 35)} strokeWidth=".8" />
            <circle cx="160" cy="56.5" r="2" fill={dk(c2, 30)} stroke="var(--fg)" strokeWidth="1" />
          </g>
        </g>
      )}

      {/* the clock housing: the head */}
      <rect x="61" y="33" width="78" height="77" rx="4" fill={u('wood')} {...OL} />
      <rect x="65" y="37" width="70" height="69" rx="2" fill="none" stroke={u('gold')} strokeWidth="1.6" />
      <rect x="62.5" y="98" width="75" height="10.5" fill="#000" opacity=".18" />
      {[
        [65, 37],
        [135, 37],
        [65, 106],
        [135, 106],
      ].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="2.2" fill={u('bob')} stroke="var(--fg)" strokeWidth=".7" />
      ))}
      {/* the face: bezel, enamel, hours */}
      <circle cx="100" cy="71" r="32" fill={u('gold')} {...OL} />
      <circle cx="100" cy="71" r="28" fill={u('dial')} stroke={dk(c2, 50)} strokeWidth=".7" />
      {ring(60, (i, a) => {
        const [ax, ay] = pt(100, 71, 27, a);
        const [bx, by] = pt(100, 71, i % 5 ? 25.6 : 24.4, a);
        return <line key={i} x1={ax} y1={ay} x2={bx} y2={by} stroke={ink} strokeWidth={i % 5 ? 0.35 : 0.9} />;
      })}
      {ROMAN.map((n, i) => {
        const [x, y] = pt(100, 71, 20.2, i * 30 - 90);
        return (
          <text key={n} x={x} y={y + 1.9} textAnchor="middle" fontSize={n.length > 3 ? 4.4 : 5.4} fontWeight="700" fontFamily={SERIF} fill={ink} transform={`rotate(${i * 30 > 90 && i * 30 < 270 ? i * 30 - 180 : i * 30} ${x} ${y})`}>
            {n}
          </text>
        );
      })}
      <path d={arc(100, 71, 30.5, 200, 255)} fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity=".7" />
      {/* its face */}
      <Eyes still={still}>
        {happy ? (
          <path d="M86 68 Q90.5 61.5 95 68 M105 68 Q109.5 61.5 114 68" fill="none" stroke={ink} strokeWidth="2.8" strokeLinecap="round" />
        ) : (
          <g>
            <ellipse cx="90.5" cy="65.5" rx="3.6" ry="4.6" fill={ink} />
            <ellipse cx="109.5" cy="65.5" rx="3.6" ry="4.6" fill={ink} />
            <circle cx="91.6" cy="63.8" r="1.3" fill="#fff" />
            <circle cx="110.6" cy="63.8" r="1.3" fill="#fff" />
          </g>
        )}
      </Eyes>
      {happy && (
        <g opacity=".5">
          <ellipse cx="86" cy="75" rx="3.4" ry="2" fill="#f28482" />
          <ellipse cx="114" cy="75" rx="3.4" ry="2" fill="#f28482" />
        </g>
      )}
      {/* the hands are its moustache: twenty past eight, or ten past ten when it's pleased */}
      <path d={hand(100, 71, 15, 1.8, happy ? 300 : 245)} fill={ink} />
      <path d={hand(100, 71, 19, 1.4, happy ? 60 : 118)} fill={ink} />
      <g className={an(still, 'ben-tick')} style={origin(100, 71)}>
        <path d="M100 75 V49" stroke="#c0392b" strokeWidth=".7" strokeLinecap="round" />
        <circle cx="100" cy="51.5" r="1" fill="none" stroke="#c0392b" strokeWidth=".5" />
      </g>
      <circle cx="100" cy="71" r="2.4" fill={u('bob')} stroke={ink} strokeWidth=".6" />
      {happy ? (
        <path d="M94 80 Q100 87 106 80Z" fill="#7a2a1e" stroke={ink} strokeWidth=".9" strokeLinejoin="round" />
      ) : (
        <path d="M96.5 81.5 Q100 83.6 103.5 81.5" fill="none" stroke={ink} strokeWidth="1.3" strokeLinecap="round" />
      )}

      {/* the roof */}
      <path d="M56 35 L100 13 L144 35Z" fill={u('roof')} {...OL} />
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={`M${64 + i * 5.5} ${31 - i * 2.7} H${136 - i * 5.5}`} stroke={dk(c, 50)} strokeWidth=".7" />
      ))}
      <path d="M60 33.5 L100 14.5" stroke={lt(c, 40)} strokeWidth="1" opacity=".8" />
      <rect x="54" y="33" width="92" height="4.6" rx="1.4" fill={u('gold')} stroke="var(--fg)" strokeWidth="1.4" />
      <path d="M100 13 V5" stroke="var(--fg)" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M100 13 V5" stroke={u('gold')} strokeWidth="1.2" />
      <circle cx="100" cy="10" r="2.6" fill={u('bob')} stroke="var(--fg)" strokeWidth="1" />
      <polygon points={star(100, 4, 3, 4, 0.35)} fill={u('gold')} stroke="var(--fg)" strokeWidth=".6" />
    </g>
  );
}

// ─── Star Reactor ───────────────────────────────────────────────────────────
/** A jagged bolt of plasma from a to b. */
const bolt = (ax: number, ay: number, bx: number, by: number, seed: number, n = 6, amp = 4) => {
  let d = `M${ax} ${ay}`;
  const nx = -(by - ay);
  const ny = bx - ax;
  const l = Math.hypot(nx, ny) || 1;
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const o = Math.sin(seed * 12.9898 + i * 78.233) * amp;
    d += ` L${r1(ax + (bx - ax) * t + (nx / l) * o)} ${r1(ay + (by - ay) * t + (ny / l) * o)}`;
  }
  return `${d} L${bx} ${by}`;
};

function Reactor({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const id = (s: string) => `${uid}-${s}`;
  const u = (s: string) => `url(#${uid}-${s})`;
  const cop = '#d27a3a';
  const core = mk === 3 ? 19 : 14;
  const plate = (d: string, k: string) => (
    <g key={k}>
      <path d={d} fill={u('armour')} {...OL} />
      <path d={d} fill="none" stroke={lt(c, 45)} strokeWidth=".7" opacity=".8" transform="translate(0.8 0.9) scale(0.992)" />
    </g>
  );
  const coil = (cx: number, cy: number, rx: number, ry: number, rot: number, k: number) => (
    <g key={k} transform={`rotate(${rot} ${cx} ${cy})`}>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="var(--fg)" strokeWidth="4.6" />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={u('ringG')} strokeWidth="2.8" />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={cop} strokeWidth="2.8" strokeDasharray="1 2.2" opacity=".85" />
      <circle cx={cx + rx} cy={cy} r="2.4" fill={c2} filter={u('glow')} />
      <circle cx={cx + rx} cy={cy} r="1.6" fill="#fff" />
      <circle cx={cx - rx} cy={cy} r="1.6" fill={lt(c2, 50)} />
    </g>
  );
  return (
    <g>
      <defs>
        <linearGradient id={id('armour')} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor={lt(c, 38)} />
          <stop offset=".35" stopColor={c} />
          <stop offset=".75" stopColor={dk(c, 25)} />
          <stop offset="1" stopColor={dk(c, 50)} />
        </linearGradient>
        <CylX id={id('limb')} c={c} />
        <Ball id={id('pod')} c={c} hi={45} />
        <linearGradient id={id('ringG')} x1="0" x2="1">
          <stop offset="0" stopColor="#5b6472" />
          <stop offset=".5" stopColor="#e6ebf1" />
          <stop offset="1" stopColor="#5b6472" />
        </linearGradient>
        <radialGradient id={id('core')}>
          <stop offset="0" stopColor="#fff" />
          <stop offset=".3" stopColor={mk === 3 ? '#fff6c4' : lt(c2, 70)} />
          <stop offset=".62" stopColor={mk === 3 ? '#ffc23a' : c2} />
          <stop offset=".85" stopColor={mk === 3 ? '#ff7a1a' : mix(c2, '#0a2a50', 40)} />
          <stop offset="1" stopColor={mk === 3 ? '#d23a1a' : mix(c2, '#0a1030', 70)} />
        </radialGradient>
        <Hot id={id('aura')} c={c2} />
        <radialGradient id={id('halo')}>
          <stop offset=".5" stopColor={c2} stopOpacity="0" />
          <stop offset=".72" stopColor={c2} stopOpacity=".28" />
          <stop offset=".78" stopColor={c2} stopOpacity=".06" />
          <stop offset="1" stopColor={c2} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('visor')} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={mix(c2, '#03101c', 60)} />
          <stop offset="1" stopColor="#03070f" />
        </linearGradient>
        <Blur id={id('glow')} sd={2.2} />
        <Blur id={id('bloom')} sd={6} />
      </defs>

      {/* behind: a halo of field lines; Mk III adds the great ring and the stars */}
      <circle cx="100" cy="112" r={mk === 3 ? 96 : 66} fill={u('halo')} />
      {mk === 3 && (
        <g>
          <g className={an(still, 'ben-spin-xslow')} style={origin(100, 104)}>
            <circle cx="100" cy="104" r="88" fill="none" stroke={c2} strokeWidth="1.2" opacity=".55" strokeDasharray="18 6 2 6" />
            {ring(6, (i, a) => {
              const [x, y] = pt(100, 104, 88, a);
              return (
                <g key={i}>
                  <rect x={x - 4} y={y - 2.5} width="8" height="5" rx="1.5" fill={u('armour')} stroke={c2} strokeWidth=".8" transform={`rotate(${a + 90} ${x} ${y})`} />
                  <circle cx={x} cy={y} r="1.3" fill="#fff" />
                </g>
              );
            })}
          </g>
          <circle cx="100" cy="104" r="80" fill="none" stroke={c2} strokeWidth=".6" opacity=".35" />
          {[
            [18, 30, 2.4],
            [176, 24, 2],
            [186, 86, 1.6],
            [12, 96, 1.8],
            [30, 168, 1.4],
            [172, 160, 2.2],
            [148, 8, 1.2],
            [54, 10, 1.4],
          ].map(([x, y, r], i) => (
            <g key={i} className={an(still, 'ben-pulse')} style={delay(-i * 0.37)}>
              <polygon points={star(x, y, r * 2, 4, 0.22)} fill="#fff" />
              <circle cx={x} cy={y} r={r * 0.9} fill={lt(c2, 50)} opacity=".6" />
            </g>
          ))}
        </g>
      )}
      <Shadow rx={mk === 3 ? 60 : 48} />
      <ellipse cx="100" cy="185" rx="26" ry="3.6" fill={c2} opacity=".35" filter={u('glow')} />

      <g className={an(still, 'ben-bob')}>
        {/* thruster glow under the feet: it hovers */}
        {[86, 114].map((x) => (
          <g key={x} className={an(still, 'ben-flicker')}>
            <path d={`M${x - 5} 177 L${x} 186 L${x + 5} 177Z`} fill={c2} opacity=".7" filter={u('glow')} />
            <path d={`M${x - 2.5} 177 L${x} 182.5 L${x + 2.5} 177Z`} fill="#fff" />
          </g>
        ))}
        {/* legs */}
        {[0, 1].map((k) => (
          <g key={k} transform={k ? 'translate(200 0) scale(-1 1)' : undefined}>
            <path d="M80 140 L94 140 L95 158 L92 168 L80 168 L78 158Z" fill={u('limb')} {...OL} />
            <path d="M76 168 L96 168 L97 177 L75 177Z" fill={u('armour')} {...OL} />
            <path d="M80 172.5 H92" stroke={c2} strokeWidth="1.2" />
            <circle cx="86.5" cy="157" r="3.2" fill={c2} filter={u('glow')} />
            <circle cx="86.5" cy="157" r="2.4" fill={lt(c2, 60)} stroke="var(--fg)" strokeWidth=".7" />
            <path d="M82 144 V152" stroke={lt(c, 45)} strokeWidth=".8" />
          </g>
        ))}

        {/* arms, palms open with light in them */}
        {[0, 1].map((k) => (
          <g key={k} transform={k ? 'translate(200 0) scale(-1 1)' : undefined}>
            <path d="M64 96 L50 118 L46 136" fill="none" stroke="var(--fg)" strokeWidth="12.5" strokeLinejoin="round" strokeLinecap="round" />
            <path d="M64 96 L50 118 L46 136" fill="none" stroke={c} strokeWidth="8.4" strokeLinejoin="round" strokeLinecap="round" />
            <path d="M62 97 L48.6 117.4" fill="none" stroke={lt(c, 40)} strokeWidth="1.4" strokeLinecap="round" opacity=".8" />
            <path d="M44 122 L52 120 L50 138 L42 138Z" fill={u('armour')} {...OL} strokeWidth="1.8" />
            <path d="M47 124 L46 135" stroke={c2} strokeWidth="1.3" strokeLinecap="round" />
            <circle cx="50" cy="118" r="3.6" fill={u('pod')} stroke="var(--fg)" strokeWidth="1.2" />
            <circle cx="45" cy="143" r="9" fill={c2} opacity=".55" filter={u('glow')} />
            <path d="M40 139 Q38 147 44 150 Q50 150 51 144 L50 139Z" fill={u('pod')} {...OL} strokeWidth="1.8" />
            <circle cx="45.4" cy="144.5" r="2.2" fill="#fff" />
          </g>
        ))}

        {/* the torso: armour round an open cage */}
        {plate('M68 86 L132 86 L140 104 L134 140 L116 150 L84 150 L66 140 L60 104Z', 't')}
        <path d="M76 90 H124" stroke={lt(c, 50)} strokeWidth="1" opacity=".7" />
        <path d="M84 150 L88 144 H112 L116 150" fill="none" stroke={dk(c, 50)} strokeWidth=".9" />
        {/* coil blocks at the corners of the cage */}
        {[
          [72, 96, -35],
          [128, 96, 35],
          [72, 132, 35],
          [128, 132, -35],
        ].map(([x, y, r]) => (
          <g key={`${x}${y}`} transform={`rotate(${r} ${x} ${y})`}>
            <rect x={x - 6} y={y - 4} width="12" height="8" rx="2" fill={cop} stroke="var(--fg)" strokeWidth="1.2" />
            {[-3.6, -1.2, 1.2, 3.6].map((o) => (
              <path key={o} d={`M${x + o} ${y - 3.6} V${y + 3.6}`} stroke="#7a3d16" strokeWidth=".8" />
            ))}
            <path d={`M${x - 5} ${y - 2.6} H${x + 5}`} stroke="#ffd2a8" strokeWidth=".7" />
          </g>
        ))}
        {/* the opening, and the heart inside it */}
        <circle cx="100" cy="114" r="27" fill="#04060d" stroke="var(--fg)" strokeWidth="1.6" />
        <circle cx="100" cy="114" r="27" fill={u('aura')} opacity=".55" />
        <g className={an(still, 'ben-pulse')}>
          <circle cx="100" cy="114" r={core + 8} fill={c2} filter={u('bloom')} opacity={mk === 3 ? 0.9 : 0.75} />
        </g>
        {/* Mk III: a miniature sun with a corona */}
        {mk === 3 && (
          <g className={an(still, 'ben-spin-slow')} style={origin(100, 114)}>
            <circle cx="100" cy="114" r="25" fill="#ffd36b" opacity=".75" filter={u('glow')} />
            {ring(8, (i, a) => (
              <path key={i} d={`${arc(100, 114, 19.5, a - 9, a + 9)}`} fill="none" stroke="#ff8a2a" strokeWidth="2.2" strokeLinecap="round" transform={`translate(${r1(Math.cos((a * Math.PI) / 180) * 2.6)} ${r1(Math.sin((a * Math.PI) / 180) * 2.6)})`} opacity=".9" />
            ))}
          </g>
        )}
        <circle cx="100" cy="114" r={core} fill={u('core')} />
        {mk === 3 && (
          <g>
            <path d="M88 110 Q93 106 97 111 M103 121 Q109 125 112 119 M92 122 q3 2 5 0" fill="none" stroke="#ff9a3a" strokeWidth="1" opacity=".75" />
            <circle cx="107" cy="108" r="2.2" fill="#ffb347" opacity=".7" />
          </g>
        )}
        <circle cx={100 - core * 0.3} cy={114 - core * 0.35} r={core * 0.28} fill="#fff" opacity=".9" />
        {/* magnetic rings round the heart: still in Mk I, spinning from Mk II */}
        {[0, 60, 120].map((r, k) => (
          <g key={r} className={mk >= 2 ? an(still, k === 1 ? 'ben-spin-rev' : k ? 'ben-spin-slow' : 'ben-spin') : undefined} style={origin(100, 114)}>
            {coil(100, 114, 24, 8.6, r, k)}
          </g>
        ))}
        {/* the cage bars across the opening */}
        {[-1, 1].map((d) => (
          <path key={d} d={`M${100 + d * 9} 87.5 Q${100 + d * 14} 114 ${100 + d * 9} 140.5`} fill="none" stroke="#c8d0da" strokeWidth="1.2" opacity=".75" />
        ))}
        <circle cx="100" cy="114" r="27" fill="none" stroke={u('ringG')} strokeWidth="2.4" />
        {ring(12, (i, a) => {
          const [x, y] = pt(100, 114, 27, a);
          return <circle key={i} cx={x} cy={y} r="1.1" fill={i % 3 ? '#8a94a3' : c2} />;
        })}

        {/* Mk II: an outer field ring, spinning */}
        {mk >= 2 && (
          <g className={an(still, 'ben-spin-fast')} style={origin(100, 114)}>
            <circle cx="100" cy="114" r="33" fill="none" stroke={c2} strokeWidth="1.4" strokeDasharray="10 5 2 5" opacity=".9" />
            <circle cx="133" cy="114" r="2" fill="#fff" />
            <circle cx="67" cy="114" r="2" fill="#fff" />
          </g>
        )}

        {/* shoulder coils */}
        {[0, 1].map((k) => (
          <g key={k} transform={k ? 'translate(200 0) scale(-1 1)' : undefined}>
            <path d="M48 96 Q48 80 62 78 L74 80 Q78 92 72 102 L56 104 Q48 102 48 96Z" fill={u('armour')} {...OL} />
            {[0, 1, 2, 3].map((i) => (
              <path key={i} d={`M${53 + i * 4.4} 82 Q${51 + i * 4.4} 92 ${54 + i * 4.4} 102`} fill="none" stroke={cop} strokeWidth="1.5" />
            ))}
            <path d="M52 86 Q56 80 64 80" fill="none" stroke="#fff" strokeWidth="1" opacity=".55" />
            <circle cx="62" cy="91" r="2.4" fill={c2} filter={u('glow')} />
            <circle cx="62" cy="91" r="1.6" fill="#fff" />
          </g>
        ))}

        {/* head: a sleek helm with a visor of light */}
        <path d="M92 70 H108 L106 82 H94Z" fill={dk(c, 30)} {...OL} strokeWidth="1.8" />
        <path d="M95 74 H105 M95 78 H105" stroke={c2} strokeWidth=".8" opacity=".8" />
        {[0, 1].map((k) => (
          <g key={k} transform={k ? 'translate(200 0) scale(-1 1)' : undefined}>
            <rect x="70" y="40" width="8" height="18" rx="3" fill={u('limb')} {...OL} strokeWidth="1.8" />
            {[44, 47.5, 51, 54.5].map((y) => (
              <path key={y} d={`M71 ${y} H77`} stroke={cop} strokeWidth="1.2" />
            ))}
            <path d="M74 40 L70 26" stroke="var(--fg)" strokeWidth="3" strokeLinecap="round" />
            <path d="M74 40 L70 26" stroke={lt(c, 30)} strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="70" cy="25" r="2.4" fill={c2} filter={u('glow')} />
            <circle cx="70" cy="25" r="1.5" fill="#fff" />
          </g>
        ))}
        <path d="M100 24 L116 29 C123 36 125 48 121 61 L111 72 H89 L79 61 C75 48 77 36 84 29Z" fill={u('armour')} {...OL} />
        <path d="M100 25.5 V40" stroke={lt(c, 45)} strokeWidth="1" opacity=".8" />
        <path d="M85.5 30.5 L100 26 L114.5 30.5" fill="none" stroke={lt(c, 50)} strokeWidth=".9" opacity=".8" />
        <polygon points="100,29.5 103,35 100,40.5 97,35" fill={c2} />
        <path d="M81 45 Q100 40 119 45 L117 56 Q100 52.5 83 56Z" fill={u('visor')} stroke="var(--fg)" strokeWidth="1.4" strokeLinejoin="round" />
        <Eyes still={still}>
          {happy ? (
            <g>
              <path d="M87 52 Q91.5 45.5 96 52 M104 52 Q108.5 45.5 113 52" fill="none" stroke={c2} strokeWidth="4" strokeLinecap="round" filter={u('glow')} />
              <path d="M87 52 Q91.5 45.5 96 52 M104 52 Q108.5 45.5 113 52" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            </g>
          ) : (
            <g>
              <path d="M86 49 L96 48.6 L95 52 L87 52.2Z M114 49 L104 48.6 L105 52 L113 52.2Z" fill={c2} filter={u('glow')} />
              <path d="M86.5 49.4 L95.5 49 L94.7 51.6 L87.4 51.8Z M113.5 49.4 L104.5 49 L105.3 51.6 L112.6 51.8Z" fill="#fff" />
            </g>
          )}
        </Eyes>
        <path d="M84 46 Q100 42 116 46" fill="none" stroke="#fff" strokeWidth=".7" opacity=".45" />
        {happy ? (
          <path d="M93.5 61 Q100 67 106.5 61" fill="none" stroke={c2} strokeWidth="1.8" strokeLinecap="round" />
        ) : (
          <path d="M94 62.5 H106 M96 65.5 H104" stroke={c2} strokeWidth="1.1" strokeLinecap="round" opacity=".85" />
        )}

        {/* Mk III: plasma arcs off the sun */}
        {mk === 3 && (
          <g className={an(still, 'ben-flicker')}>
            {[
              [56, 84, 30, 40, 1],
              [144, 84, 170, 40, 2],
              [62, 88, 14, 110, 3],
              [138, 88, 186, 110, 4],
              [62, 88, 26, 52, 5],
              [138, 88, 174, 52, 6],
              [45, 146, 14, 176, 7],
              [155, 146, 186, 176, 8],
            ].map(([ax, ay, bx, by, s], i) => (
              <g key={i}>
                <path d={bolt(ax, ay, bx, by, s, 7, 4.5)} fill="none" stroke={c2} strokeWidth="3.4" strokeLinejoin="round" opacity=".7" filter={u('glow')} />
                <path d={bolt(ax, ay, bx, by, s, 7, 4.5)} fill="none" stroke={dk(c2, 15)} strokeWidth="1.8" strokeLinejoin="round" />
                <path d={bolt(ax, ay, bx, by, s, 7, 4.5)} fill="none" stroke="#fff" strokeWidth=".9" strokeLinejoin="round" />
              </g>
            ))}
          </g>
        )}
      </g>
    </g>
  );
}

export const ENGINES: BotRegistry = {
  d51: { Art: D51, head: { x: 100, y: 35, s: 0.9 } },
  shinkansen: { Art: Shinkansen, head: { x: 100, y: 22, s: 1.35 } },
  tenshu: { Art: Tenshu, head: { x: 100, y: 16, s: 0.8 } },
  diver: { Art: Diver, head: { x: 100, y: 25, s: 1.03 } },
  clocktower: { Art: Clocktower, head: { x: 100, y: 16, s: 0.85 } },
  reactor: { Art: Reactor, head: { x: 100, y: 24, s: 0.8 } },
};
