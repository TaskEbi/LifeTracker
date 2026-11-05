import type { CSSProperties, ReactNode } from 'react';
import type { AuraArt, HatArt, PetArt } from './types';
import './gear.css';

/* ── helpers ─────────────────────────────────────────────────────────────── */

const FG = 'var(--fg)';
/** Eyes and pupils: dark on every theme, because the faces they sit on are light. */
const EYE = '#17131f';
const ink = (w = 2.5) => ({ stroke: FG, strokeWidth: w, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const });
const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const n2 = (n: number) => +n.toFixed(2);
const polar = (r: number, deg: number, cx = 0, cy = 0): [number, number] => [n2(cx + r * Math.cos((deg * Math.PI) / 180)), n2(cy + r * Math.sin((deg * Math.PI) / 180))];
const mix = (a: string, b: string, pct: number) => `color-mix(in srgb, ${a} ${pct}%, ${b})`;

type Stop = [number, string, number?];
const stops = (s: Stop[]) => s.map(([o, col, op], i) => <stop key={i} offset={o} stopColor={col} stopOpacity={op} />);
/** A vertical gradient, or diagonal/horizontal with `to`. */
const Lin = ({ id, s, to = [0, 1] }: { id: string; s: Stop[]; to?: [number, number] }) => (
  <linearGradient id={id} x1="0" y1="0" x2={to[0]} y2={to[1]}>
    {stops(s)}
  </linearGradient>
);
const Rad = ({ id, s, at }: { id: string; s: Stop[]; at?: [number, number, number] }) =>
  at ? (
    <radialGradient id={id} gradientUnits="userSpaceOnUse" cx={at[0]} cy={at[1]} r={at[2]}>
      {stops(s)}
    </radialGradient>
  ) : (
    <radialGradient id={id}>{stops(s)}</radialGradient>
  );

const GOLD: Stop[] = [[0, '#fffbd1'], [0.24, '#fde047'], [0.5, '#f59e0b'], [0.62, '#b45309'], [0.8, '#fde68a'], [1, '#d97706']];

interface Fx {
  /** Seconds per cycle. */
  d?: number;
  /** How far into its cycle it starts, in seconds. */
  t?: number;
  dx?: number;
  dy?: number;
  /** Degrees. */
  r?: number;
}
/** className + timing for a moving part; nothing at all when `still`. */
const fx = (still: boolean, cls: string, { d, t, dx, dy, r }: Fx = {}): { className?: string; style?: CSSProperties } => {
  if (still) return {};
  const style: Record<string, string> = {};
  if (d !== undefined) style.animationDuration = `${d}s`;
  if (t !== undefined) style.animationDelay = `${-t}s`;
  if (dx !== undefined) style['--bg-dx'] = `${dx}px`;
  if (dy !== undefined) style['--bg-dy'] = `${dy}px`;
  if (r !== undefined) style['--bg-r'] = `${r}deg`;
  return { className: cls, style: style as CSSProperties };
};
const At = ({ x = 0, y = 0, s = 1, rot = 0, children }: { x?: number; y?: number; s?: number; rot?: number; children: ReactNode }) => (
  <g transform={`translate(${x} ${y})${rot ? ` rotate(${rot})` : ''}${s !== 1 ? ` scale(${s})` : ''}`}>{children}</g>
);
const Mirror = ({ children }: { children: ReactNode }) => (
  <>
    {children}
    <g transform="scale(-1 1)">{children}</g>
  </>
);
/** A round spinning layer. The invisible circle keeps its pivot on the centre whatever is inside. */
const Wheel = ({ still, r, d, rev, children }: { still: boolean; r: number; d: number; rev?: boolean; children: ReactNode }) => (
  <g {...fx(still, rev ? 'bg-rev' : 'bg-spin', { d })}>
    <circle r={r} fill="none" />
    {children}
  </g>
);
/** A stroke with an outline: horns, ropes, antlers. */
const Tube = ({ d, col, w = 5, o = 2.5 }: { d: string; col: string; w?: number; o?: number }) => (
  <>
    <path d={d} fill="none" stroke={FG} strokeWidth={w + o * 2} strokeLinecap="round" strokeLinejoin="round" />
    <path d={d} fill="none" stroke={col} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
  </>
);
const sparkPath = (R: number, w = 0.12) => `M0 ${-R}Q${R * w} ${-R * w} ${R} 0Q${R * w} ${R * w} 0 ${R}Q${-R * w} ${R * w} ${-R} 0Q${-R * w} ${-R * w} 0 ${-R}Z`;
const starPath = (n: number, R: number, r: number, rot = -90) =>
  `M${range(n * 2).map((i) => polar(i % 2 ? r : R, rot + (i * 180) / n).join(' ')).join('L')}Z`;
/** A hard white sparkle with a coloured rim, so it shows on light themes too. */
const Glint = ({ x, y, R = 7, still, t = 0, d = 3.4, col = '#fff', rim = '#b45309' }: { x: number; y: number; R?: number; still: boolean; t?: number; d?: number; col?: string; rim?: string }) => (
  <At x={x} y={y}>
    <g {...fx(still, 'bg-glint', { t, d })}>
      <path d={sparkPath(R)} fill={col} stroke={rim} strokeWidth=".9" strokeLinejoin="round" />
    </g>
  </At>
);
/** A brilliant-cut stone, side on. */
const Gem = ({ x, y, r, col }: { x: number; y: number; r: number; col: string }) => (
  <g transform={`translate(${x} ${y}) scale(${r})`}>
    <path d="M-1 -.32L-.58 -.85H.58L1 -.32L0 1Z" fill={col} stroke={FG} strokeWidth={1.5 / r} strokeLinejoin="round" />
    <path d="M-1 -.32H1L.58 -.85H-.58Z" fill="#fff" opacity=".5" />
    <path d="M-.42 -.32L0 1L.42 -.32Z" fill="#fff" opacity=".28" />
    <path d="M-1 -.32L0 1L-.42 -.32Z" fill="#000" opacity=".22" />
  </g>
);
const MAPLE = 'M0 -11L2.2 -5.6L6 -7.6L4.8 -2.4L10 -3.2L7.4 1L9 3.8L3.2 4L3.6 7L.7 5.2L.7 10H-.7L-.7 5.2L-3.6 7L-3.2 4L-9 3.8L-7.4 1L-10 -3.2L-4.8 -2.4L-6 -7.6L-2.2 -5.6Z';
const AUTUMN = ['#dc2626', '#ea580c', '#f59e0b', '#b91c1c', '#f97316'];
const Maple = ({ col, w = 1.2 }: { col: string; w?: number }) => <path d={MAPLE} fill={col} {...ink(w)} />;
const PETAL = 'M0 0C-4.4 -2.6 -4.6 -8 -1.3 -10L0 -8.2L1.3 -10C4.6 -8 4.4 -2.6 0 0Z';
const Sakura = ({ x, y, s = 1, rot = 0, w = 1 }: { x: number; y: number; s?: number; rot?: number; w?: number }) => (
  <At x={x} y={y} s={s} rot={rot}>
    {range(5).map((i) => (
      <path key={i} d={PETAL} transform={`rotate(${i * 72})`} fill={i % 2 ? '#fbcfe8' : '#f9a8d4'} {...ink(w)} />
    ))}
    <circle r="2.2" fill="#be185d" />
    {range(5).map((i) => {
      const [a, b] = polar(4, i * 72 - 90);
      return <circle key={i} cx={a} cy={b} r=".7" fill="#fde047" />;
    })}
  </At>
);
/** Points round the rim of the box, evenly spread and not in a pattern (golden angle). */
const rim = (n: number, seed = 0, rmin = 64, rmax = 92) =>
  range(n).map((i) => {
    const [x, y] = polar(rmin + ((i * 0.618 + seed * 0.013) % 1) * (rmax - rmin), i * 137.508 + seed, 100, 100);
    return { x, y, i };
  });

/* ── headgear ────────────────────────────────────────────────────────────── */

export const HAT_ART: Record<string, HatArt> = {
  cap: ({ c, c2 }) => {
    const pleat = (i: number) => {
      const b = -32 + i * 6.4;
      return `M${n2(b * 0.84)} -17L${n2((b + 6.4) * 0.84)} -17L${n2(b + 6.4)} -1Q${n2(b + 3.2)} 3.6 ${n2(b)} -1Z`;
    };
    return (
      <g transform="rotate(-7) translate(0 -1)">
        {range(10).map((i) => (
          <path key={i} d={pleat(i)} fill={i % 2 ? mix(c, '#000', 72) : mix(c, '#fff', 70)} {...ink(1.8)} />
        ))}
        <ellipse cy="-19" rx="28" ry="8" fill={c} {...ink()} />
        <ellipse cy="-20" rx="20" ry="4.8" fill={mix(c, '#fff', 66)} />
        <path d={starPath(5, 9, 3.8)} transform="translate(0 -19.6) scale(1 .5)" fill={c2} {...ink(1.3)} />
      </g>
    );
  },

  headband: ({ c, still }) => (
    <g>
      <g transform="translate(31 12)">
        <g {...fx(still, 'bg-flag')}>
          <path d="M0 -3C10 -9 16 0 28 -7L29 1C17 7 10 -1 0 3Z" fill="#fdfcf7" {...ink(2.2)} />
          <path d="M-1 1C7 6 11 11 21 20L15 24C8 16 3 11 -3 5Z" fill="#fdfcf7" {...ink(2.2)} />
        </g>
      </g>
      <path d="M-31 6Q0 0 31 6L30 21Q0 15 -30 21Z" fill="#fdfcf7" {...ink()} />
      <circle cy="11" r="5.4" fill={c} stroke={EYE} strokeWidth="1" />
      <circle cx="31" cy="13" r="4" fill="#fdfcf7" {...ink(2.2)} />
    </g>
  ),

  propeller: ({ c, c2, still }) => (
    <g>
      <path d="M-30 1C-30 -28 30 -28 30 1Q0 7 -30 1Z" fill={c} {...ink()} />
      <path d="M-12 3.6C-11 -13 -4 -21 0 -21C4 -21 11 -13 12 3.6Q0 5.4 -12 3.6Z" fill={c2} {...ink(1.8)} />
      <path d="M-27 -8Q-22 -16 -14 -19" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity=".55" />
      <path d="M0 -21V-29" {...ink(3)} />
      <At y={-30}>
        <g {...fx(still, 'bg-prop')}>
          <path d="M0 0C-8 -6 -22 -6 -25 -1C-22 4 -8 3 0 0Z" fill={c2} {...ink(2)} />
          <path d="M0 0C8 -3 22 -4 25 1C22 6 8 6 0 0Z" fill={c} {...ink(2)} />
        </g>
        <circle r="3.4" fill="#fde047" {...ink(2)} />
      </At>
    </g>
  ),

  catears: ({ c, c2, still }) => {
    const ear = (
      <>
        <path d="M-31 3L-27 -30L-5 -7Z" fill={c} {...ink()} />
        <path d="M-26.5 -3L-24.5 -20L-12 -7Z" fill={mix(c2, '#f9a8d4', 30)} />
      </>
    );
    return (
      <g>
        <Tube d="M-31 5Q0 -12 31 5" col={c} w={3.6} o={2} />
        {ear}
        <g transform="scale(-1 1)">
          <g {...fx(still, 'bg-twitch')}>{ear}</g>
        </g>
      </g>
    );
  },

  kasa: ({ c, uid }) => (
    <g transform="rotate(-3)">
      <defs>
        <Lin id={`${uid}s`} to={[1, 1]} s={[[0, '#fde68a'], [0.55, '#e0a83a'], [1, '#a16207']]} />
      </defs>
      <path d="M-24 5C-27 16 -22 24 -15 28M24 5C27 16 22 24 15 28" fill="none" stroke={c} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M-46 2Q-22 -10 -4 -33Q0 -37 4 -33Q22 -10 46 2Q0 11 -46 2Z" fill={`url(#${uid}s)`} {...ink()} />
      {[-36, -28, -20, -13, -6, 1, 8, 15, 22, 29, 37].map((x) => (
        <path key={x} d={`M0 -32L${x} ${n2(6 - Math.abs(x) * 0.08)}`} stroke="#7c4a06" strokeWidth="1" opacity=".55" />
      ))}
      <path d="M-30 -5Q0 3 30 -5M-15 -18Q0 -13 15 -18" fill="none" stroke="#7c4a06" strokeWidth="1.6" opacity=".7" />
      <path d="M-46 2l-5 2M46 2l5 2.5M-31 5.5l-3 4M28 6.5l3 4" {...ink(1.6)} />
      <circle cy="-34" r="3" fill="#a16207" {...ink(2)} />
    </g>
  ),

  headphones: ({ c, c2, uid, still }) => {
    const cup = (
      <>
        <rect x="-43" y="-2" width="15" height="30" rx="7" fill={`url(#${uid}p)`} {...ink()} />
        <rect x="-31" y="1" width="6" height="24" rx="3" fill={c} {...ink(2)} />
        <circle cx="-37" cy="13" r="3.4" fill={c2} stroke="#000" strokeWidth=".8" />
      </>
    );
    return (
      <g>
        <defs>
          <Lin id={`${uid}p`} to={[1, 0]} s={[[0, '#52525b'], [0.45, '#27272a'], [1, '#09090b']]} />
        </defs>
        <Tube d="M-34 6C-36 -20 36 -20 34 6" col="#3f3f46" w={5} o={2} />
        <path d="M-14 -11Q0 -14 14 -11" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round" />
        <Mirror>{cup}</Mirror>
        <At x={22} y={-26}>
          <g {...fx(still, 'bg-float', { d: 2.2 })}>
            <path d="M2.6 2V-9C5 -6 9 -6 8.4 -1" fill="none" stroke={FG} strokeWidth="2.2" strokeLinecap="round" />
            <ellipse cy="2.4" rx="3.4" ry="2.6" transform="rotate(-20)" fill={c2} stroke={FG} strokeWidth="1.4" />
          </g>
        </At>
      </g>
    );
  },

  mortar: ({ c, c2, uid, still }) => (
    <g>
      <defs>
        <Lin id={`${uid}b`} to={[1, 1]} s={[[0, '#475569'], [1, '#0f172a']]} />
      </defs>
      <path d="M-24 -14V2Q0 9 24 2V-14Z" fill="#1e293b" {...ink()} />
      <path d="M0 -33L46 -18L0 -4L-46 -18Z" fill={`url(#${uid}b)`} {...ink()} />
      <path d="M0 -29L-38 -18" stroke="#fff" strokeWidth="1.6" opacity=".35" strokeLinecap="round" />
      <path d="M0 -19Q18 -18 34 -12" fill="none" stroke={c2} strokeWidth="2.6" strokeLinecap="round" />
      <circle cy="-19" r="3.4" fill={c} {...ink(1.8)} />
      <At x={34} y={-12}>
        <g {...fx(still, 'bg-hang', { d: 2.4, r: 9 })}>
          <path d="M0 0V8" stroke={c2} strokeWidth="2.6" />
          <path d="M-3.4 8H3.4L4.4 22H-4.4Z" fill={c2} {...ink(1.8)} />
          <path d="M-1.4 11V21M1.4 11V21" stroke="#000" strokeWidth=".8" opacity=".5" />
        </g>
      </At>
    </g>
  ),

  tophat: ({ c, c2, uid }) => (
    <g transform="rotate(-7) translate(-2 0)">
      <defs>
        <Lin id={`${uid}t`} to={[1, 0]} s={[[0, '#18181b'], [0.25, '#52525b'], [0.42, '#27272a'], [1, '#09090b']]} />
      </defs>
      <ellipse cy="-2" rx="39" ry="7" fill="#18181b" {...ink()} />
      <path d="M-22 -4L-26 -48Q0 -55 26 -48L22 -4Q0 2 -22 -4Z" fill={`url(#${uid}t)`} {...ink()} />
      <ellipse cy="-49" rx="26" ry="5" fill="#3f3f46" {...ink()} />
      <path d="M-23.2 -16Q0 -10 23.2 -16L22 -4Q0 2 -22 -4Z" fill={c} {...ink(2)} />
      <g transform="translate(13 -18) rotate(14)">
        <rect x="-6" y="-13" width="12" height="17" rx="1.6" fill="#fffef8" {...ink(1.6)} />
        <path d="M0 -2C-5 -6 -3 -10 0 -7.4C3 -10 5 -6 0 -2Z" fill="#dc2626" />
      </g>
      <path d="M-22.6 -11Q-12 -7.4 3 -7" fill="none" stroke={c2} strokeWidth="1.6" opacity=".9" />
    </g>
  ),

  antlers: () => {
    const left = 'M-14 1C-18 -10 -26 -16 -28 -34M-23 -15C-30 -16 -37 -20 -42 -30M-26.4 -26C-20 -32 -18 -38 -18 -46M-28 -34C-33 -38 -35 -44 -35 -51';
    return (
      <g>
        <Mirror>
          <Tube d={left} col="#d9b98a" w={4.4} o={2} />
          <path d="M-22 4C-22 -3 -7 -3 -6 4Q-14 8 -22 4Z" fill="#8a5a2b" {...ink(2.2)} />
        </Mirror>
        <path d="M35 -38V-29" stroke={FG} strokeWidth="1.4" />
        <circle cx="35" cy="-23" r="6.6" fill="#e5b97a" {...ink(2)} />
        <path d="M32 -25h6M32 -22h6" stroke="#8a5a2b" strokeWidth="1.3" />
      </g>
    );
  },

  kitsune: ({ uid, still }) => (
    <g transform="translate(3 -3) rotate(-11)">
      <defs>
        <Lin id={`${uid}k`} s={[[0, '#ffffff'], [1, '#f1e7d2']]} />
      </defs>
      <At x={-25} y={-8}>
        <g {...fx(still, 'bg-hang', { d: 2.8, r: 8 })}>
          <path d="M0 0C-4 4 -4 8 -4 14" fill="none" stroke="#dc2626" strokeWidth="2.2" />
          <path d="M-7 14H-1L0 26H-8Z" fill="#dc2626" {...ink(1.6)} />
          <rect x="-7.4" y="12" width="6.8" height="4" fill="#fbbf24" {...ink(1.2)} />
        </g>
      </At>
      <path d="M0 12C-7 10 -19 -1 -25 -14L-28 -46L-12 -34Q0 -36 12 -34L28 -46L25 -14C19 -1 7 10 0 12Z" fill={`url(#${uid}k)`} {...ink()} />
      <Mirror>
        <path d="M-25 -41L-24 -24L-14.5 -32Z" fill="#dc2626" />
        <path d="M-28 -46L-26.8 -35L-22 -39.6Z" fill="#fbbf24" />
        <path d="M-19 -18Q-11 -20 -5 -11Q-14 -10 -19 -18Z" fill={EYE} />
        <path d="M-22 -24Q-12 -28 -4 -19" fill="none" stroke="#dc2626" strokeWidth="2.8" strokeLinecap="round" />
        <circle cx="-15" cy="-3" r="1.2" fill="#dc2626" />
        <circle cx="-11" cy="-.5" r="1.2" fill="#dc2626" />
        <circle cx="-16" cy=".6" r="1.2" fill="#dc2626" />
      </Mirror>
      <path d="M0 -33C-4 -28 -2.6 -23 0 -21C2.6 -23 4 -28 0 -33Z" fill="#dc2626" />
      <path d="M-3 6Q0 3 3 6L0 9Z" fill={EYE} />
    </g>
  ),

  kabuto: ({ c, uid }) => (
    <g>
      <defs>
        <Lin id={`${uid}g`} s={GOLD} />
        <Lin id={`${uid}d`} to={[1, 0.4]} s={[[0, '#64748b'], [0.35, '#334155'], [1, '#0b1120']]} />
      </defs>
      <Mirror>
        <path d="M-29 -8Q-41 0 -50 16L-44 22L-30 18L-26 2Z" fill="#1e293b" {...ink()} />
        <path d="M-35 0L-31 18M-42 8L-38 20" stroke={c} strokeWidth="2.2" />
        <path d="M-41 13.6L-27 8M-37 3.6L-27 -1" stroke="#94a3b8" strokeWidth="1.2" />
        <path d="M-29 -18L-48 -28L-47 -9L-31 -2Z" fill={`url(#${uid}g)`} {...ink(2)} />
      </Mirror>
      <path d="M-31 -2C-31 -36 31 -36 31 -2Q0 5 -31 -2Z" fill={`url(#${uid}d)`} {...ink()} />
      {[-20, -10, 0, 10, 20].map((x) => (
        <path key={x} d={`M${x} 0Q${n2(x * 0.72)} -18 ${n2(x * 0.1)} -27`} fill="none" stroke="#94a3b8" strokeWidth="1.3" opacity=".7" />
      ))}
      <path d="M-34 -7Q0 3 34 -7L36 1Q0 12 -36 1Z" fill={`url(#${uid}g)`} {...ink(2.2)} />
      <Mirror>
        <path d="M-3 -18C-10 -28 -24 -46 -36 -60C-20 -56 -7 -40 2 -26Z" fill={`url(#${uid}g)`} {...ink(2.2)} />
      </Mirror>
      <circle cy="-20" r="7.4" fill="#dc2626" {...ink(2.2)} />
      <circle cx="-2" cy="-22" r="2" fill="#fff" opacity=".7" />
    </g>
  ),

  wizard: ({ c2, uid, still }) => (
    <g>
      <defs>
        <Lin id={`${uid}w`} to={[1, 0.5]} s={[[0, '#4338ca'], [1, '#1e1b4b']]} />
      </defs>
      <ellipse cy="-1" rx="42" ry="8" fill={`url(#${uid}w)`} {...ink()} />
      <path d="M-25 -3C-20 -22 -10 -44 8 -60C5 -40 17 -20 25 -3Q0 5 -25 -3Z" fill={`url(#${uid}w)`} {...ink()} />
      <path d="M-25 -3Q0 5 25 -3L22 -11Q0 -4 -22 -11Z" fill={c2} {...ink(2)} />
      <path d="M-8 -28A7 7 0 1 0 -1 -18.6A5.6 5.6 0 0 1 -8 -28Z" fill="#fde047" />
      <path d={starPath(5, 4.4, 1.9)} transform="translate(9 -26)" fill="#fde047" />
      <path d={starPath(5, 3, 1.3)} transform="translate(5 -41)" fill="#fde047" />
      <path d={starPath(4, 2.2, 0.8)} transform="translate(13 -15)" fill="#fff" />
      <At x={8} y={-62}>
        <g {...fx(still, 'bg-sway', { d: 2.6, r: 14 })}>
          <path d={starPath(5, 11, 4.8)} fill="#fde047" {...ink(2.2)} />
          <circle cx="-2.6" cy="-1.2" r="1" fill={EYE} />
          <circle cx="2.6" cy="-1.2" r="1" fill={EYE} />
          <path d="M-1.4 1.6Q0 3 1.4 1.6" fill="none" stroke={EYE} strokeWidth=".9" strokeLinecap="round" />
        </g>
      </At>
    </g>
  ),

  horns: ({ c, uid }) => (
    <g>
      <defs>
        <Lin id={`${uid}h`} s={[[0, '#fffbeb'], [0.5, '#fde68a'], [1, c]]} />
      </defs>
      <Mirror>
        <path d="M-27 1C-38 -16 -42 -34 -30 -50C-29 -34 -18 -20 -7 -6Q-16 5 -27 1Z" fill={`url(#${uid}h)`} {...ink()} />
        <path d="M-31 -13Q-24 -14 -20 -19M-34 -24Q-29 -26 -26 -30" fill="none" stroke="#92400e" strokeWidth="1.5" opacity=".65" />
        <path d="M-30 -3Q-17 7 -5 -7L-3 0Q-16 14 -31 5Z" fill="#fbbf24" {...ink(2.2)} />
        <path d="M-25 1.5L-23 8M-18 2.5L-16.6 8.6M-11 0L-9 6" stroke={EYE} strokeWidth="2.2" strokeLinecap="round" />
      </Mirror>
    </g>
  ),

  crown: ({ c, uid, still }) => (
    <g>
      <defs>
        <Lin id={`${uid}g`} s={[[0, '#fff3a8'], [0.3, '#fde047'], [0.62, '#f59e0b'], [0.82, '#b45309'], [1, '#fbbf24']]} />
        <Lin id={`${uid}b`} to={[1, 0]} s={[[0, '#a15c0a'], [0.2, '#fbbf24'], [0.4, '#fff3a8'], [0.6, '#f59e0b'], [0.85, '#fde047'], [1, '#a15c0a']]} />
        <Lin id={`${uid}v`} s={[[0, mix(c, '#fff', 78)], [0.5, c], [1, mix(c, '#000', 50)]]} />
        <Rad id={`${uid}a`} s={[[0, '#fde047', 0.55], [1, '#fde047', 0]]} />
      </defs>
      <ellipse cy="-30" rx="58" ry="42" fill={`url(#${uid}a)`} />
      <path d="M-29 -6C-32 -38 -14 -46 0 -46C14 -46 32 -38 29 -6Z" fill={`url(#${uid}v)`} {...ink(2)} />
      <path d="M-16 -39Q-6 -44 4 -43" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".6" />
      <path d="M-31 0L-39 -39L-23 -19L-19 -50L-8 -21L0 -60L8 -21L19 -50L23 -19L39 -39L31 0Q0 7 -31 0Z" fill={`url(#${uid}g)`} {...ink(2.6)} />
      <path d="M-35 -30L-29 -10M-18.8 -41L-15.6 -18M0 -51L-1.6 -21" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" opacity=".85" />
      <path d="M-32 -1Q0 6 32 -1L31 -18Q0 -11 -31 -18Z" fill={`url(#${uid}b)`} {...ink(2.4)} />
      <path d="M-30 -15Q0 -8 30 -15M-30.6 -4Q0 3 30.6 -4" fill="none" stroke="#7c2d12" strokeWidth="1" strokeDasharray="1 2.6" />
      <Mirror>
        <Gem x={-24} y={-8.6} r={3.8} col="#10b981" />
        <Gem x={-13} y={-7.2} r={4.8} col="#2563eb" />
        <circle cx="-39" cy="-42" r="4.4" fill="#fffdf5" {...ink(2)} />
        <circle cx="-19" cy="-53" r="4.6" fill="#fffdf5" {...ink(2)} />
      </Mirror>
      <Gem x={0} y={-7} r={7.4} col="#e11d48" />
      <Gem x={0} y={-30} r={5} col="#a855f7" />
      <path d="M-5 -62H5M0 -68V-57" {...ink(4.6)} />
      <path d="M-5 -62H5M0 -68V-57" stroke="#fde047" strokeWidth="2.4" strokeLinecap="round" />
      <Glint x={-27} y={-27} R={8} still={still} t={0.4} />
      <Glint x={27} y={-40} R={9} still={still} t={1.8} />
    </g>
  ),

  halo: ({ uid, still }) => (
    <g {...(still ? {} : { className: 'i-hover' })}>
      <defs>
        <linearGradient id={`${uid}g`} x1="0" y1="0" x2="1" y2="0">
          {stops([[0, '#d97706'], [0.2, '#fde047'], [0.38, '#fffbd1'], [0.55, '#f59e0b'], [0.8, '#fef08a'], [1, '#b45309']])}
        </linearGradient>
        <Rad id={`${uid}a`} s={[[0, '#fff7c2', 0.95], [0.5, '#fde047', 0.42], [1, '#fde047', 0]]} />
        <Lin id={`${uid}r`} s={[[0, '#fde047', 0], [1, '#fde047', 0.85]]} />
      </defs>
      <ellipse cy="-30" rx="60" ry="36" fill={`url(#${uid}a)`} />
      {[-40, -27, -13, 0, 13, 27, 40].map((x) => (
        <path key={x} d={`M${n2(x * 0.8 - 3)} -24L${n2(x * 1.25)} ${n2(-70 + Math.abs(x) * 0.5)}L${n2(x * 0.8 + 3)} -24Z`} fill={`url(#${uid}r)`} />
      ))}
      <At y={-25}>
        <path d="M-36 0A36 12 0 0 1 36 0" fill="none" stroke={FG} strokeWidth="7" />
        <path d="M-36 0A36 12 0 0 1 36 0" fill="none" stroke="#b45309" strokeWidth="4" />
        <path d="M-36 0A36 12 0 0 0 36 0" fill="none" stroke={FG} strokeWidth="12" strokeLinecap="round" />
        <path d="M-36 0A36 12 0 0 0 36 0" fill="none" stroke={`url(#${uid}g)`} strokeWidth="8" strokeLinecap="round" />
        {[[-24, 9], [-12, 11.4], [12, 11.4], [24, 9]].map(([x, y], i) => (
          <circle key={x} cx={x} cy={y} r={1.9} fill={i % 3 ? '#7dd3fc' : '#f472b6'} stroke="#7c2d12" strokeWidth=".8" />
        ))}
        <Gem x={0} y={11.4} r={4.2} col="#e0f2fe" />
        <g transform="translate(0 -14) rotate(-7) scale(1 .3)">
          <Wheel still={still} r={44} d={9}>
            <circle r="42" fill="none" stroke="#fde68a" strokeWidth="4.6" strokeDasharray="3 13" strokeLinecap="round" />
          </Wheel>
        </g>
      </At>
      <Glint x={-37} y={-40} R={8} still={still} t={0.3} />
      <Glint x={31} y={-52} R={10} still={still} t={1.5} />
    </g>
  ),

  sunwheel: ({ c, c2, uid, still }) => {
    const y = -38;
    return (
      <g>
        <defs>
          <Lin id={`${uid}g`} s={GOLD} />
          <Rad id={`${uid}a`} s={[[0, '#fff7c2', 0.95], [0.55, '#f59e0b', 0.45], [1, '#f59e0b', 0]]} />
          <Rad id={`${uid}c`} s={[[0, '#ffffff'], [0.4, '#fff7a8'], [0.75, '#fbbf24'], [1, '#ea580c']]} />
          <Lin id={`${uid}r`} s={[[0, '#fffbd1'], [0.5, '#fbbf24'], [1, '#c2410c']]} />
        </defs>
        <At y={y}>
          <circle r="56" fill={`url(#${uid}a)`} />
          <Wheel still={still} r={42} d={30}>
            {range(16).map((i) => (
              <path
                key={i}
                d={i % 2 ? 'M-4 -24L0 -34L4 -24Z' : 'M-6 -24L0 -42L6 -24Z'}
                transform={`rotate(${i * 22.5})`}
                fill={i % 2 ? c2 : `url(#${uid}r)`}
                {...ink(1.8)}
              />
            ))}
          </Wheel>
          <circle r="25" fill={`url(#${uid}g)`} {...ink(2.4)} />
          <Wheel still={still} r={25} d={14} rev>
            {range(12).map((i) => {
              const [a, b] = polar(21, i * 30);
              return <circle key={i} cx={a} cy={b} r={i % 2 ? 1.5 : 2.3} fill={i % 2 ? '#fff' : c} stroke="#7c2d12" strokeWidth=".8" />;
            })}
          </Wheel>
          <circle r="16.4" fill="#7c2d12" {...ink(1.6)} />
          {range(8).map((i) => (
            <rect key={i} x="-1.4" y="-16" width="2.8" height="16" fill={`url(#${uid}g)`} transform={`rotate(${i * 45})`} />
          ))}
          <g {...fx(still, 'bg-shine', { d: 2.2 })}>
            <circle r="9.6" fill={`url(#${uid}c)`} {...ink(1.8)} />
          </g>
        </At>
        <path d="M-30 3Q0 -7 30 3L20 -15Q0 -21 -20 -15Z" fill={`url(#${uid}g)`} {...ink(2.4)} />
        <Gem x={0} y={-7} r={4.6} col="#e11d48" />
        <Glint x={-30} y={-60} R={9} still={still} t={0.4} />
        <Glint x={33} y={-20} R={8} still={still} t={1.9} />
      </g>
    );
  },

  momijiwreath: ({ still }) => {
    const leaf = (deg: number, i: number, s: number) => {
      const [x, y] = polar(1, deg);
      return (
        <At key={deg} x={n2(x * 31)} y={n2(y * 10 - 2)} rot={n2(x * 42 + (i % 2 ? 14 : -10))} s={s}>
          <Maple col={AUTUMN[i % AUTUMN.length]} w={1.2} />
        </At>
      );
    };
    return (
      <g>
        {[215, 270, 325].map((d, i) => leaf(d, i + 1, 1.05))}
        <path d="M-32 -2A32 10 0 0 0 32 -2" fill="none" stroke={FG} strokeWidth="6" />
        <path d="M-32 -2A32 10 0 0 0 32 -2" fill="none" stroke="#713f12" strokeWidth="3" />
        {[160, 20, 118, 62].map((d, i) => leaf(d, i, 1.25))}
        <At y={8} s={1.5}>
          <Maple col="#ef4444" w={1} />
        </At>
        <At x={42} y={-20} rot={26} s={0.72}>
          <g {...fx(still, 'bg-drift', { d: 5, dy: 22, dx: 8, r: 120 })}>
            <Maple col="#f59e0b" w={1.6} />
          </g>
        </At>
      </g>
    );
  },

  santa: ({ uid, still }) => (
    <g>
      <defs>
        <Lin id={`${uid}r`} to={[1, 1]} s={[[0, '#f87171'], [0.6, '#dc2626'], [1, '#7f1d1d']]} />
      </defs>
      <path d="M-27 0C-26 -26 -8 -44 13 -44C28 -44 40 -32 44 -14C36 -26 28 -30 21 -28C26 -18 28 -8 28 0Z" fill={`url(#${uid}r)`} {...ink()} />
      <path d="M-18 -26C-10 -42 2 -46 14 -45C25 -45 33 -39 38 -30C33 -33 28 -32 25 -35C20 -29 15 -36 10 -32C4 -27 0 -33 -4 -29C-9 -25 -13 -27 -18 -26Z" fill="#fff" {...ink(1.8)} />
      <At x={44} y={-9}>
        <g {...fx(still, 'bg-hang', { d: 2.6, r: 8 })}>
          <circle r="8" fill="#fff" {...ink()} />
          <path d="M-3 -2.6Q-4.4 0 -2.6 3" fill="none" stroke="#7dd3fc" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      </At>
      <path d="M-30 -7C-36 -7 -36 7 -30 7C-27 11 -21 11 -18 8C-14 11 -8 11 -5 8C-1 11 5 11 8 8C12 11 18 11 21 8C24 10 28 10 30 7C36 7 36 -7 30 -7C26 -11 22 -10 19 -8C15 -11 9 -11 6 -8C2 -11 -4 -11 -7 -8C-11 -11 -17 -11 -20 -8C-23 -10 -27 -10 -30 -7Z" fill="#fff" {...ink()} />
      <g transform="translate(-6 -18)" stroke="#bae6fd" strokeWidth="2" strokeLinecap="round">
        <path d="M0 -6V6M-5.2 -3L5.2 3M-5.2 3L5.2 -3" />
      </g>
    </g>
  ),

  onimask: () => (
    <g transform="rotate(4)">
      <path d="M-27 -12Q-36 -8 -32 8M27 -12Q36 -8 32 8" fill="none" stroke={FG} strokeWidth="1.6" />
      <path d="M-22 -30L-31 -56L-8 -38Z" fill="#fde047" {...ink()} />
      <path d="M22 -30L32 -56L8 -38Z" fill="#fde047" {...ink()} />
      <path d="M26.6 -42L32 -56L39 -44Z" fill="#eab308" {...ink(2)} />
      <path d="M-27 -30L-24 -34L-18 -36L12 -38L24 -33L28 -24L26 -6L22 4L10 12L-9 11L-23 3L-29 -12Z" fill="#ef4444" {...ink()} />
      <path d="M-22 -33Q-24 -44 -14 -40Q-14 -50 -4 -42Q0 -52 6 -41Q14 -48 15 -38Q24 -40 22 -32Q0 -30 -22 -33Z" fill="#1f2937" {...ink(2)} />
      <circle cx="-11" cy="-15" r="6.6" fill="#fff" stroke={EYE} strokeWidth="1.6" />
      <circle cx="12" cy="-15" r="5.4" fill="#fff" stroke={EYE} strokeWidth="1.6" />
      <circle cx="-9" cy="-14" r="2.4" fill={EYE} />
      <circle cx="10" cy="-14" r="2" fill={EYE} />
      <path d="M-20 -25L-4 -19M20 -25L5 -19" stroke={EYE} strokeWidth="3.4" strokeLinecap="round" />
      <path d="M-15 1Q0 -7 15 1Q0 8 -15 1Z" fill={EYE} />
      <path d="M-11 0L-8 -7L-5 -2.4ZM11 0L8 -7L5 -2.4Z" fill="#fff" stroke={EYE} strokeWidth=".8" strokeLinejoin="round" />
      <path d="M-23 -7l5 2l-4 1l5 2M18 -8l5 2l-4 1l5 2" fill="none" stroke="#7f1d1d" strokeWidth="1.2" />
    </g>
  ),

  blossom: ({ still }) => (
    <g>
      {[-34, -16, 2, 20, 34].map((x, i) => (
        <Sakura key={x} x={x * 0.84} y={-8 + (Math.abs(x) * Math.abs(x)) / 170 - 1} s={0.82} rot={i * 21} w={1.5} />
      ))}
      <path d="M-32 -1A32 10 0 0 0 32 -1" fill="none" stroke={FG} strokeWidth="6" strokeLinecap="round" />
      <path d="M-32 -1A32 10 0 0 0 32 -1" fill="none" stroke="#6b3f1d" strokeWidth="3" strokeLinecap="round" />
      <Sakura x={-30} y={3} s={1.05} rot={18} w={1.3} />
      <Sakura x={30} y={3} s={1.05} rot={40} w={1.3} />
      <Sakura x={-14} y={8} s={1.05} rot={8} w={1.3} />
      <Sakura x={15} y={8} s={1.05} rot={60} w={1.3} />
      <Sakura x={0} y={6} s={1.4} w={1.1} />
      <At x={-42} y={-18} s={0.62} rot={40}>
        <g {...fx(still, 'bg-drift', { d: 6, dy: 28, dx: -6, r: 200 })}>
          <path d={PETAL} fill="#f9a8d4" {...ink(1.6)} />
        </g>
      </At>
      <At x={40} y={-24} s={0.62} rot={-30}>
        <g {...fx(still, 'bg-drift', { d: 7, t: 3, dy: 30, dx: 6, r: -200 })}>
          <path d={PETAL} fill="#fbcfe8" {...ink(1.6)} />
        </g>
      </At>
    </g>
  ),

  raincoat: ({ uid, still }) => (
    <g>
      <defs>
        <Lin id={`${uid}y`} to={[1, 1]} s={[[0, '#fef08a'], [0.5, '#facc15'], [1, '#b45309']]} />
      </defs>
      <path d="M-22 24V34M22 24V38" stroke={FG} strokeWidth="1.8" />
      <rect x="-25" y="33" width="6" height="7" rx="2" fill="#dc2626" {...ink(1.5)} />
      <rect x="19" y="37" width="6" height="7" rx="2" fill="#dc2626" {...ink(1.5)} />
      <path d="M-39 26C-46 -16 -24 -32 0 -32C24 -32 46 -16 39 26L27 28C33 6 18 -3 0 -3C-18 -3 -33 6 -27 28Z" fill={`url(#${uid}y)`} {...ink()} />
      <path d="M-34 8C-33 -10 -18 -19 0 -19C18 -19 33 -10 34 8" fill="none" stroke="#a16207" strokeWidth="1.5" strokeDasharray="4 3.4" />
      <path d="M-26 -1Q0 -18 26 -1Q0 -6 -26 -1Z" fill="#eab308" {...ink(2)} />
      <At y={-37}>
        <ellipse rx="10.5" ry="7.6" cy="1" fill="#4ade80" {...ink(2.2)} />
        <Mirror>
          <circle cx="-6" cy="-6" r="4" fill="#4ade80" {...ink(2)} />
          <circle cx="-6" cy="-6" r="2" fill={EYE} />
        </Mirror>
        <path d="M-5 1.8Q0 5.4 5 1.8" fill="none" stroke={EYE} strokeWidth="1.5" strokeLinecap="round" />
      </At>
      {[
        [-43, 8, 0],
        [44, 2, 1.4],
      ].map(([x, y, t]) => (
        <At key={x} x={x} y={y}>
          <g {...fx(still, 'bg-drift', { d: 2.2, t, dy: 22 })}>
            <path d="M0 -6C3 -2 4 0 4 2A4 4 0 0 1 -4 2C-4 0 -3 -2 0 -6Z" fill="#60a5fa" {...ink(1.6)} />
          </g>
        </At>
      ))}
    </g>
  ),

  tanzaku: ({ still }) => {
    const strips: [number, number, string, number][] = [
      [-31, -25, '#ef4444', 20],
      [-16, -26, '#fde047', 23],
      [15, -33, '#38bdf8', 23],
      [30, -34, '#f472b6', 20],
      [-14, -50, '#a78bfa', 16],
    ];
    return (
      <g>
        <Tube d="M0 -20C-12 -27 -26 -29 -38 -25" col="#15803d" w={2.2} o={1.6} />
        <Tube d="M1 -28C13 -36 27 -38 39 -33" col="#15803d" w={2.2} o={1.6} />
        <Tube d="M1 -44C-6 -51 -14 -53 -24 -50" col="#15803d" w={2.2} o={1.6} />
        <Tube d="M-1 2C-2 -18 0 -40 2 -60" col="#22c55e" w={4.4} o={2} />
        <path d="M-5 -14H4M-4.4 -32H5" stroke={FG} strokeWidth="1.8" />
        {[
          'M2 -60C10 -68 20 -68 25 -62C18 -58 8 -57 2 -60Z',
          'M-38 -25C-44 -33 -52 -32 -56 -28C-50 -23 -44 -22 -38 -25Z',
          'M39 -33C46 -41 54 -40 58 -35C52 -30 45 -29 39 -33Z',
          'M2 -60C-4 -68 -13 -70 -19 -66C-14 -60 -5 -57 2 -60Z',
        ].map((d) => (
          <path key={d} d={d} fill="#4ade80" {...ink(2)} />
        ))}
        {strips.map(([x, y, col, h], i) => (
          <At key={x} x={x} y={y}>
            <g {...fx(still, 'bg-hang', { d: 2.4 + i * 0.3, t: i * 0.7, r: 7 })}>
              <path d="M0 0V4" stroke={FG} strokeWidth="1.4" />
              <rect x="-5.4" y="4" width="10.8" height={h} rx="1" fill={col} {...ink(2)} />
              <path d={`M0 8q2 2 0 4t0 4${h > 18 ? 't0 4' : ''}`} fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" opacity=".75" />
            </g>
          </At>
        ))}
      </g>
    );
  },

  happi: ({ c, c2 }) => (
    <g>
      <g transform="translate(17 -2) rotate(22)">
        <path d="M0 2V-14" {...ink(5.4)} />
        <path d="M0 2V-14" stroke="#d6a35c" strokeWidth="3" />
        <path d="M0 -12C-7 -15 -21 -18 -21 -32C-21 -44 -10 -48 0 -48C10 -48 21 -44 21 -32C21 -18 7 -15 0 -12Z" fill="#fffdf5" {...ink()} />
        {[-60, -36, -12, 12, 36, 60].map((a) => {
          const [x, y] = polar(30, a - 90, 0, -12);
          return <path key={a} d={`M0 -12L${x} ${y}`} stroke="#94a3b8" strokeWidth=".9" />;
        })}
        {range(10).map((i) => {
          const [x, y] = polar(10.5, i * 36, 0, -31);
          return <path key={i} d={`M0 -31L${x} ${y}`} stroke={i % 2 ? '#dc2626' : c2} strokeWidth="2.4" strokeLinecap="round" />;
        })}
      </g>
      <path d="M-13 3C-20 -3 -23 -10 -21 -16L-14 -13C-14 -8 -11 -3 -7 1ZM13 3C20 -3 23 -10 21 -16L14 -13C14 -8 11 -3 7 1Z" fill={c} {...ink(2)} />
      <path d="M-31 9Q0 2 31 9" fill="none" stroke={FG} strokeWidth="14" strokeLinecap="round" />
      <path d="M-31 9Q0 2 31 9" fill="none" stroke={c} strokeWidth="10" strokeLinecap="round" />
      <path d="M-31 9Q0 2 31 9" fill="none" stroke="#fff" strokeWidth="10" strokeDasharray="3.6 5.4" />
      <rect x="-9" y="-1.6" width="18" height="14" rx="6" fill={c} {...ink(2.4)} />
      <path d="M-4 1L3 10M1 0L6.6 7.6M-6.6 3.6L-1 10.6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
    </g>
  ),

  witch: ({ uid, still }) => (
    <g transform="rotate(-4)">
      <defs>
        <Lin id={`${uid}w`} to={[1, 0.6]} s={[[0, '#6d28d9'], [0.6, '#3b0764'], [1, '#1a0536']]} />
      </defs>
      <path d="M-46 3C-30 -8 30 -8 46 -1C30 10 -30 12 -46 3Z" fill={`url(#${uid}w)`} {...ink()} />
      <path d="M-23 -2L-13 -35Q-8 -48 6 -52Q18 -54 30 -44Q18 -45 13 -38Q16 -20 23 -2Q0 5 -23 -2Z" fill={`url(#${uid}w)`} {...ink()} />
      <path d="M-23 -2Q0 5 23 -2L20 -12Q0 -5 -20 -12Z" fill="#f97316" {...ink(2)} />
      <rect x="-7" y="-11" width="14" height="12" rx="1.6" fill="none" stroke="#fde047" strokeWidth="3" />
      <rect x="-7" y="-11" width="14" height="12" rx="1.6" fill="none" stroke={EYE} strokeWidth="1" />
      <path d="M-10 -35L0 -33L-2 -22L-13 -24Z" fill="#a855f7" {...ink(1.4)} />
      <path d="M-8 -30l4 1M-9 -26l4 1" stroke="#fde047" strokeWidth="1.2" />
      <At x={30} y={-44}>
        <g {...fx(still, 'bg-hang', { d: 2, r: 12 })}>
          <path d="M0 0V5" stroke={FG} strokeWidth="1.4" />
          <path d="M0 6C-3 3 -6 4 -11 2C-10 6 -11 8 -9 11C-6 9 -5 11 -3 13C-2 11 2 11 3 13C5 11 6 9 9 11C11 8 10 6 11 2C6 4 3 3 0 6Z" fill="#27272a" {...ink(1.6)} />
          <circle cx="-1.7" cy="8" r="1" fill="#fde047" />
          <circle cx="1.7" cy="8" r="1" fill="#fde047" />
        </g>
      </At>
    </g>
  ),
};

/* ── companions ──────────────────────────────────────────────────────────── */

const Face = ({ x = 0, y = 0, gap = 4, r = 1.5, smile = true, blush = true }: { x?: number; y?: number; gap?: number; r?: number; smile?: boolean; blush?: boolean }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle cx={-gap} r={r} fill={EYE} />
    <circle cx={gap} r={r} fill={EYE} />
    <circle cx={-gap + 0.5} cy={-0.5} r={r * 0.35} fill="#fff" />
    <circle cx={gap + 0.5} cy={-0.5} r={r * 0.35} fill="#fff" />
    {blush && <ellipse cx={-gap - 2.6} cy={2.2} rx="1.8" ry="1.1" fill="#fb7185" opacity=".7" />}
    {blush && <ellipse cx={gap + 2.6} cy={2.2} rx="1.8" ry="1.1" fill="#fb7185" opacity=".7" />}
    {smile && <path d="M-1.6 1.2Q0 3 1.6 1.2" fill="none" stroke={EYE} strokeWidth="1" strokeLinecap="round" />}
  </g>
);
const W = 1.8;

export const PET_ART: Record<string, PetArt> = {
  chick: () => (
    <g>
      <circle cy="-2" r="12" fill="#fde047" {...ink(W)} />
      <path d="M-1.6 -13.6Q-1 -17 1 -16M1 -13.6Q3 -16 4.4 -14.6" fill="none" {...ink(1.6)} />
      <Face y={-4} gap={4.6} smile={false} />
      <path d="M-2.4 -1.8H2.4L0 1.4Z" fill="#f97316" stroke={EYE} strokeWidth=".7" strokeLinejoin="round" />
      <path d="M-13 3.4L-9.4 6.6L-6.4 2.8L-3 6.4L0 2.8L3 6.4L6.4 2.8L9.4 6.6L13 3.4C13.4 11 8 15.4 0 15.4C-8 15.4 -13.4 11 -13 3.4Z" fill="#fff" {...ink(W)} />
    </g>
  ),

  cube: ({ uid }) => (
    <g>
      <defs>
        <Lin id={`${uid}c`} to={[1, 1]} s={[[0, '#f1f5f9'], [1, '#94a3b8']]} />
      </defs>
      <rect x="-14" y="-14" width="28" height="28" rx="4" fill={`url(#${uid}c)`} {...ink(W)} />
      {[-1, 1].map((a) =>
        [-1, 1].map((b) => (
          <path key={`${a}${b}`} d={`M${a * 13} ${b * 6}V${b * 13}H${a * 6}`} fill="none" stroke="#475569" strokeWidth="3" strokeLinejoin="round" />
        )),
      )}
      <circle r="8" fill="#fff" stroke="#64748b" strokeWidth="1.6" />
      <path d="M0 5.4C-8.4 -.6 -4.4 -6.4 0 -2.8C4.4 -6.4 8.4 -.6 0 5.4Z" fill="#f472b6" stroke="#9d174d" strokeWidth=".8" strokeLinejoin="round" />
    </g>
  ),

  slime: ({ uid, still }) => (
    <g>
      <defs>
        <Rad id={`${uid}s`} s={[[0, '#ffffff'], [0.7, '#fdf2f8'], [1, '#f9c6dd']]} />
      </defs>
      <g {...fx(still, 'bg-squish')}>
        <path d="M-15 13C-17.6 2 -10 -12 0 -12C10 -12 17.6 2 15 13Q0 16.6 -15 13Z" fill={`url(#${uid}s)`} {...ink(W)} />
        <Face y={1} gap={5} />
        <path d="M-7.6 -5.6Q-5 -9 -2.4 -9.4" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        <path d="M-4 -12.4C-3 -15 3 -15 4 -12.4Q0 -10.4 -4 -12.4Z" fill="#65a30d" {...ink(1.4)} />
      </g>
    </g>
  ),

  cat: ({ still }) => (
    <g>
      <At x={12} y={9}>
        <g {...fx(still, 'bg-sway', { d: 2.8, r: 10 })}>
          <Tube d="M0 0C6 0 6 -8 2.6 -11" col="#fb923c" w={2.8} o={1.4} />
        </g>
      </At>
      <path d="M-13 12C-15.4 2 -12 -3 -10.6 -6L-13 -15.4L-5.6 -10.6Q0 -11.6 5.6 -10.6L13 -15.4L10.6 -6C12 -3 15.4 2 13 12Z" fill="#fb923c" {...ink(W)} />
      <path d="M-3 -10.6V-7M0 -11V-6.4M3 -10.6V-7" stroke="#9a3412" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M-9 -2.4H-3M3 -2.4H9" stroke={EYE} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="-5.4" cy="-1.2" r="1.2" fill={EYE} />
      <circle cx="6.6" cy="-1.2" r="1.2" fill={EYE} />
      <path d="M-1 1H1L0 2.2ZM-2 3.6Q-1 4.4 0 3.2Q1 4.4 2 3.6" fill="#fda4af" stroke={EYE} strokeWidth=".6" />
      <path d="M-16 11.6Q-12 15 -8 11.6Q-4 15 0 11.6Q4 15 8 11.6Q12 15 16 11.6V16H-16Z" fill="#64748b" {...ink(W)} />
    </g>
  ),

  goldfish: ({ uid, still }) => (
    <g>
      <defs>
        <Lin id={`${uid}f`} s={[[0, '#fdba74'], [1, '#ea580c']]} />
      </defs>
      <At x={3} y={1}>
        <g {...fx(still, 'bg-wag')}>
          <path d="M0 0C5 -12 13 -13 14 -7C11 -4 11 2 14 6C13 13 5 11 0 0Z" fill="#fb923c" {...ink(W)} />
          <path d="M3 -1L10 -7M3 1L10 6" stroke="#fff" strokeWidth="1.1" opacity=".75" strokeLinecap="round" />
        </g>
      </At>
      <path d="M-4 -7C-1 -12 4 -11 4 -7Z" fill="#f97316" {...ink(1.6)} />
      <ellipse cx="-4" cy="1" rx="10.5" ry="8.4" fill={`url(#${uid}f)`} {...ink(W)} />
      <path d="M-1 -6.4C3 -6 5 -2 3.6 2C1 1 -1 -2 -1 -6.4Z" fill="#fff" />
      <path d="M-4 3.6C-2 3 0 4 1 6.6C-2 7.4 -4 6 -4 3.6Z" fill="#fed7aa" {...ink(1.2)} />
      <circle cx="-8.6" cy="-1.4" r="3" fill="#fff" stroke={EYE} strokeWidth=".9" />
      <circle cx="-9" cy="-1.2" r="1.6" fill={EYE} />
      <path d="M-13.4 2.4Q-12 3.8 -10.8 3" fill="none" stroke={EYE} strokeWidth="1" strokeLinecap="round" />
      {[
        [-13, -8, 2],
        [-9.6, -13.4, 1.4],
      ].map(([x, y, r], i) => (
        <At key={x} x={x} y={y}>
          <g {...fx(still, 'bg-float', { d: 2 + i, dy: 1.6 })}>
            <circle r={r} fill="#bae6fd" {...ink(1.2)} />
          </g>
        </At>
      ))}
    </g>
  ),

  wisp: ({ uid, still }) => (
    <g>
      <defs>
        <Rad id={`${uid}w`} s={[[0, '#ffffff'], [0.45, '#a5f3fc'], [1, '#2563eb']]} />
        <Rad id={`${uid}a`} s={[[0, '#67e8f9', 0.65], [1, '#67e8f9', 0]]} />
      </defs>
      <circle cy="3" r="16" fill={`url(#${uid}a)`} />
      <g {...fx(still, 'bg-flick', { d: 1.3 })}>
        <path d="M0 15C-8 15 -12 9 -11 3C-10 -3 -4 -5 -3 -9C-2 -12 1 -14 7 -16C4 -12 5 -9 7 -6C10 -2 12 2 11 6C10 11 6 15 0 15Z" fill={`url(#${uid}w)`} {...ink(W)} />
        <Face y={4} gap={4} r={1.4} blush={false} smile={false} />
        <ellipse cy="8" rx="1.3" ry="1.7" fill={EYE} />
      </g>
    </g>
  ),

  bat: ({ c, c2, still }) => {
    const wing = 'M-5 -3C-9 -10 -14 -11 -16.4 -7C-15 -4.6 -15 -2 -15.6 1C-13 -1 -11 -.6 -10 3C-8.6 1 -6.6 1 -5 3.4Z';
    return (
      <g>
        <path d="M0 -8V-12.6" {...ink(1.6)} />
        <circle cy="-13.4" r="1.8" fill={c2} {...ink(1.1)} />
        <g {...fx(still, 'bg-flap-l')}>
          <path d={wing} fill="#52525b" {...ink(W)} />
        </g>
        <g transform="scale(-1 1)">
          <g {...fx(still, 'bg-flap-l')}>
            <path d={wing} fill="#52525b" {...ink(W)} />
          </g>
        </g>
        <path d="M-6.6 -3L-6 -11L-1.6 -7.4H1.6L6 -11L6.6 -3C8 3 4 8 0 8C-4 8 -8 3 -6.6 -3Z" fill="#27272a" {...ink(W)} />
        <rect x="-5.6" y="-3.4" width="11.2" height="4.8" rx="2.4" fill="#09090b" />
        <circle cx="-2.6" cy="-1" r="1.5" fill={c} />
        <circle cx="2.6" cy="-1" r="1.5" fill={c} />
        <path d="M-2.6 3.6L-1.6 6L-.6 3.6ZM.6 3.6L1.6 6L2.6 3.6Z" fill="#fff" />
      </g>
    );
  },

  minidrone: ({ c, c2, uid, still }) => (
    <g {...(still ? {} : { className: 'i-hover' })}>
      <defs>
        <Rad id={`${uid}b`} at={[-3, -4, 16]} s={[[0, 'var(--surf)'], [0.65, mix(c, 'var(--surf)', 16)], [1, mix(c, 'var(--surf)', 38)]]} />
      </defs>
      <path d="M-8 0L-14 -5M8 0L14 -5" {...ink(1.8)} />
      {[-14, 14].map((x) => (
        <At key={x} x={x} y={-6}>
          <g {...fx(still, 'bg-prop', { d: 0.22 })}>
            <ellipse rx="5" ry="1.1" fill={c2} opacity=".8" />
          </g>
          <circle r="1.5" fill={c} {...ink(0.9)} />
        </At>
      ))}
      <path d="M0 -9V-13" {...ink(1.4)} />
      <circle cy="-13.6" r="1.9" fill={c2} stroke={c} strokeWidth="1" {...fx(still, 'i-pulse')} />
      <ellipse rx="15.6" ry="3.8" cy="2" fill="none" {...ink(1.3)} />
      <circle r="10" fill={`url(#${uid}b)`} {...ink(W)} />
      <path d="M-7 -4.4A10 10 0 0 1 7 -4.4" fill="none" stroke="#fff" strokeWidth="1" opacity=".6" />
      <rect x="-6.6" y="-2.8" width="13.2" height="5.4" rx="2.7" fill={FG} />
      <g {...fx(still, 'i-blink')}>
        <rect x="-3.8" y="-1.6" width="7.6" height="3" rx="1.5" fill={c} />
      </g>
    </g>
  ),

  shuriken: ({ c, uid, still }) => (
    <g>
      <defs>
        <Lin id={`${uid}s`} to={[1, 1]} s={[[0, '#f8fafc'], [0.5, '#94a3b8'], [1, '#475569']]} />
      </defs>
      <Wheel still={still} r={16.4} d={2.4}>
        {range(4).map((i) => (
          <g key={i} transform={`rotate(${i * 90})`}>
            <path d="M-5.4 -4.6C-4 -9 -1 -13 3 -16.2C3.4 -11 4.6 -8 5.4 -4.6Z" fill={`url(#${uid}s)`} {...ink(W)} />
            <path d="M0 -5L3 -16.2L5.4 -4.6Z" fill="#334155" opacity=".45" />
          </g>
        ))}
      </Wheel>
      <circle r="7.6" fill={c} {...ink(W)} />
      <circle cx="-2.8" cy="-.2" r="1.5" fill="#fff" />
      <circle cx="2.8" cy="-.2" r="1.5" fill="#fff" />
      <circle cx="-2.6" cy="0" r=".8" fill={EYE} />
      <circle cx="2.6" cy="0" r=".8" fill={EYE} />
      <path d="M-5 -3.4L-1.2 -1.8M5 -3.4L1.2 -1.8" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M-1.4 3.4H1.4" stroke={EYE} strokeWidth="1" strokeLinecap="round" />
    </g>
  ),

  moon: ({ uid, still }) => (
    <g>
      <defs>
        <Rad id={`${uid}a`} s={[[0, '#fef9c3', 0.55], [1, '#fef9c3', 0]]} />
        <Lin id={`${uid}m`} to={[1, 1]} s={[[0, '#fffbe0'], [1, '#e6c75c']]} />
      </defs>
      <circle r="16.4" fill={`url(#${uid}a)`} />
      <path d="M4 -15A15 15 0 1 0 15 6A12 12 0 0 1 4 -15Z" fill={`url(#${uid}m)`} {...ink(W)} />
      <circle cx="-5" cy="-9.4" r="1.7" fill="#c9a640" />
      <circle cx="1" cy="10" r="1.5" fill="#c9a640" />
      <circle cx="-9.4" cy="7" r="1.1" fill="#c9a640" />
      <path d="M-10.4 -2Q-8.2 .4 -6 -2" fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M-2.8 -3Q-1 -.8 1 -3" fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
      <ellipse cx="-9" cy="2" rx="1.8" ry="1.1" fill="#fb7185" opacity=".7" />
      <path d="M-5.6 3.6Q-4 5.2 -2.4 3.4" fill="none" stroke={EYE} strokeWidth="1" strokeLinecap="round" />
      <At x={9.6} y={-5}>
        <g {...fx(still, 'bg-twinkle')}>
          <path d={starPath(5, 4.4, 1.9)} fill="#fde047" {...ink(1)} />
        </g>
      </At>
    </g>
  ),

  dragon: ({ uid, still }) => {
    const body = 'M2 1C13 2 14 11 5 11C-3 11 -5 6 -10 8C-13 9 -13 12 -11 13.6';
    return (
      <g>
        <defs>
          <Lin id={`${uid}g`} s={[[0, '#fff3a8'], [0.5, '#fbbf24'], [1, '#d97706']]} />
          <Rad id={`${uid}p`} s={[[0, '#ffffff'], [0.5, '#bae6fd'], [1, '#c084fc']]} />
          <Rad id={`${uid}a`} s={[[0, '#fde047', 0.5], [1, '#fde047', 0]]} />
        </defs>
        <circle r="17.4" fill={`url(#${uid}a)`} />
        <path d="M-11 13C-14 16.4 -17 14 -16.4 10C-15 11.6 -14 11.6 -13 10.4C-12.4 11.6 -11.6 12 -11 13Z" fill="#dc2626" {...ink(1.2)} />
        <path d={body} fill="none" stroke={FG} strokeWidth="8.4" strokeLinecap="round" />
        <path d={body} fill="none" stroke={`url(#${uid}g)`} strokeWidth="5" strokeLinecap="round" />
        <path d={body} fill="none" stroke="#b45309" strokeWidth="1.6" strokeDasharray="1.4 2.8" />
        <path d="M11 3L15.6 1.6L13.4 6L16.4 7.6L12.6 9.4ZM-1 12.6L-3 16.4L2 14.6Z" fill="#dc2626" {...ink(1.1)} />
        <Mirror>
          <path d="M-5 -12C-6 -14.6 -8 -15.6 -9.4 -17.6M-7.4 -15C-9.6 -15 -11 -14.4 -12.6 -14.8" fill="none" {...ink(3.6)} />
          <path d="M-5 -12C-6 -14.6 -8 -15.6 -9.4 -17.6M-7.4 -15C-9.6 -15 -11 -14.4 -12.6 -14.8" fill="none" stroke="#fde68a" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M-9 -9L-14.4 -10L-12.4 -7L-15.4 -5.4L-10 -4Z" fill="#dc2626" {...ink(1.1)} />
          <path d="M-5.6 -1.6C-10 -1 -13 -2 -15.6 .6" fill="none" stroke="#dc2626" strokeWidth="1.1" strokeLinecap="round" />
        </Mirror>
        <path d="M-10 -8C-10 -14 -5 -15 0 -15C5 -15 10 -14 10 -8C10 -6 8.4 -4.6 7 -4C7.4 0 4 2 0 2C-4 2 -7.4 0 -7 -4C-8.4 -4.6 -10 -6 -10 -8Z" fill={`url(#${uid}g)`} {...ink(W)} />
        <ellipse cy="-1.8" rx="5.4" ry="3" fill="#fffbe0" />
        <circle cx="-1.8" cy="-2.2" r=".7" fill={EYE} />
        <circle cx="1.8" cy="-2.2" r=".7" fill={EYE} />
        <path d="M-2.4 .2Q0 1.4 2.4 .2" fill="none" stroke={EYE} strokeWidth=".8" strokeLinecap="round" />
        <Mirror>
          <circle cx="-4.6" cy="-8.4" r="2.8" fill="#fff" stroke={EYE} strokeWidth=".7" />
          <circle cx="-4.2" cy="-8" r="1.7" fill={EYE} />
          <circle cx="-4.8" cy="-8.8" r=".6" fill="#fff" />
        </Mirror>
        <circle cx="-11" cy="1" r="3.6" fill={`url(#${uid}p)`} {...ink(1.3)} />
        <Glint x={-14} y={-3} R={4} still={still} t={1} />
      </g>
    );
  },

  blackhole: ({ uid, still }) => {
    const disc = (id: string, sw: number) => (
      <g transform="rotate(-14) scale(1 .34)">
        <Wheel still={still} r={15.8} d={5}>
          <circle r="13.6" fill="none" stroke={`url(#${id}d)`} strokeWidth={sw} />
          <circle r="15" fill="none" stroke="#fff" strokeWidth="1.5" strokeDasharray="6 14 2 10" />
          <circle r="11.4" fill="none" stroke="#fff7c2" strokeWidth="1.2" strokeDasharray="10 8 3 8" />
        </Wheel>
      </g>
    );
    return (
      <g>
        <defs>
          <linearGradient id={`${uid}d`} x1="0" y1="0" x2="1" y2="1">
            {stops([[0, '#fff7c2'], [0.3, '#f59e0b'], [0.55, '#dc2626'], [0.8, '#f59e0b'], [1, '#fff7c2']])}
          </linearGradient>
          <Rad id={`${uid}a`} s={[[0.45, '#f97316', 0.75], [1, '#a855f7', 0]]} />
          <clipPath id={`${uid}f`}>
            <rect x="-20" y="-1" width="40" height="20" transform="rotate(-14)" />
          </clipPath>
        </defs>
        <circle r="17.6" fill={`url(#${uid}a)`} />
        {disc(uid, 6.4)}
        <circle r="9.6" fill="#000" stroke="#ffedb0" strokeWidth="1.5" />
        <circle r="10.8" fill="none" stroke="#f97316" strokeWidth=".8" />
        <circle cx="-3.6" cy="-2.8" r="2.7" fill="#fff" />
        <circle cx="3.6" cy="-2.8" r="2.7" fill="#fff" />
        <circle cx="-3.3" cy="-2.5" r="1.7" fill="#0b0b0d" />
        <circle cx="3.9" cy="-2.5" r="1.7" fill="#0b0b0d" />
        <circle cx="-2.7" cy="-3.2" r=".7" fill="#fff" />
        <circle cx="4.5" cy="-3.2" r=".7" fill="#fff" />
        <path d="M-1 .2Q0 1.3 1 .2" fill="none" stroke="#fff" strokeWidth=".9" strokeLinecap="round" />
        <ellipse cx="-6.6" cy="-.2" rx="1.5" ry=".9" fill="#fb7185" opacity=".85" />
        <ellipse cx="6.6" cy="-.2" rx="1.5" ry=".9" fill="#fb7185" opacity=".85" />
        <g clipPath={`url(#${uid}f)`}>{disc(uid, 6.4)}</g>
        <g transform="translate(6 -9.6) rotate(18)">
          <path d="M0 0L-4.4 -2.6V2.6ZM0 0L4.4 -2.6V2.6Z" fill="#f472b6" stroke="#fff" strokeWidth=".8" strokeLinejoin="round" />
          <circle r="1.1" fill="#fff" />
        </g>
      </g>
    );
  },

  tanukileaf: ({ uid }) => (
    <g>
      <defs>
        <Lin id={`${uid}l`} s={[[0, '#fb923c'], [1, '#dc2626']]} />
      </defs>
      <g transform="translate(0 -1) scale(1.42)">
        <path d={MAPLE} fill={`url(#${uid}l)`} {...ink(1.3)} />
      </g>
      <Mirror>
        <ellipse cx="-4.2" cy="-2" rx="3.8" ry="3" fill="#44260f" transform="rotate(14 -4.2 -2)" />
        <circle cx="-3.8" cy="-2.2" r="1.4" fill="#fff" />
        <circle cx="-3.6" cy="-2" r=".7" fill={EYE} />
      </Mirror>
      <ellipse cy="1.6" rx="1.3" ry="1" fill={EYE} />
      <path d="M-2 3.2Q0 4.8 2 3.2" fill="none" stroke={EYE} strokeWidth=".9" strokeLinecap="round" />
    </g>
  ),

  snowbun: ({ uid }) => (
    <g>
      <defs>
        <Lin id={`${uid}s`} s={[[0, '#ffffff'], [1, '#bfdbfe']]} />
      </defs>
      <path d="M-3 -6C-10 -12 -10 -16.4 -7 -17C-3 -16 -1 -11 -1 -6Z" fill="#22c55e" {...ink(1.6)} />
      <path d="M3 -6C10 -12 10 -16.4 7 -17C3 -16 1 -11 1 -6Z" fill="#16a34a" {...ink(1.6)} />
      <path d="M-15 12C-16.4 -2 -8 -8 0 -8C8 -8 16.4 -2 15 12Q0 16.4 -15 12Z" fill={`url(#${uid}s)`} {...ink(W)} />
      <circle cx="-5" cy="1" r="2.2" fill="#dc2626" stroke="#7f1d1d" strokeWidth=".7" />
      <circle cx="5" cy="1" r="2.2" fill="#dc2626" stroke="#7f1d1d" strokeWidth=".7" />
      <circle cx="-5.6" cy=".4" r=".6" fill="#fff" />
      <circle cx="4.4" cy=".4" r=".6" fill="#fff" />
      <path d="M-1.4 4.6Q0 6 1.4 4.6" fill="none" stroke="#475569" strokeWidth="1" strokeLinecap="round" />
    </g>
  ),

  bean: ({ uid }) => (
    <g>
      <defs>
        <Rad id={`${uid}b`} s={[[0, '#f9e2ad'], [1, '#c98a3a']]} />
      </defs>
      <ellipse cy="-5" rx="10" ry="10.6" fill={`url(#${uid}b)`} {...ink(W)} />
      <path d="M3.6 -14Q6.6 -13 7 -9.6" fill="none" stroke="#8a5a2b" strokeWidth="1.6" strokeLinecap="round" />
      <Face y={-6.6} gap={3.8} r={1.4} />
      <path d="M-15.4 1H15.4L12.8 15.4H-12.8Z" fill="#d6a35c" {...ink(W)} />
      <path d="M-14.4 4.6H14.4" stroke="#8a5a2b" strokeWidth="1.1" />
      <text y="13.4" fontSize="8.4" fontWeight="700" textAnchor="middle" fill="#7c2d12">
        福
      </text>
    </g>
  ),

  bee: ({ still }) => (
    <g>
      <g {...fx(still, 'bg-flap-r', { d: 0.2 })}>
        <ellipse cx="1" cy="-10" rx="4.2" ry="6.4" transform="rotate(-16 1 -10)" fill="#e0f2fe" {...ink(1.5)} />
      </g>
      <g {...fx(still, 'bg-flap-r', { d: 0.2, t: 0.05 })}>
        <ellipse cx="7" cy="-8" rx="3.4" ry="5.4" transform="rotate(22 7 -8)" fill="#e0f2fe" {...ink(1.5)} />
      </g>
      <path d="M12 1L16.4 2L12 4Z" fill={EYE} {...ink(1)} />
      <ellipse cy="2" rx="13" ry="9.4" fill="#fde047" {...ink(W)} />
      <path d="M1 -7.2C3.4 -3 3.4 7 1 11.2L5.6 10.4C8 6 8 -2 5.6 -6.4Z" fill={EYE} />
      <path d="M9 -5C11.4 -1.4 11.4 5.4 9 9L11 7.4C13 4 13 0 11 -3.4Z" fill={EYE} />
      <ellipse cy="2" rx="13" ry="9.4" fill="none" {...ink(W)} />
      <Face x={-6.6} y={1.4} gap={3.2} r={1.3} />
      <Sakura x={-8} y={-8} s={0.68} rot={12} w={1.6} />
    </g>
  ),

  snail: ({ uid }) => (
    <g>
      <defs>
        <Rad id={`${uid}s`} s={[[0, '#c4b5fd'], [0.6, '#818cf8'], [1, '#4338ca']]} />
      </defs>
      <path d="M-11 -4L-14 -12M-6 -4L-6.6 -13" {...ink(1.6)} />
      <circle cx="-14.2" cy="-13" r="2.3" fill="#fef3c7" {...ink(1.2)} />
      <circle cx="-6.6" cy="-14" r="2.3" fill="#fef3c7" {...ink(1.2)} />
      <circle cx="-14.6" cy="-13" r="1" fill={EYE} />
      <circle cx="-7" cy="-14" r="1" fill={EYE} />
      <path d="M-16 13C-16 10 -13.6 9 -13 6L-13 -2C-13 -7 -4 -7 -4 -2L-4 6L13 7C16 8 16 13 13 13Z" fill="#fde68a" {...ink(W)} />
      <path d="M-11 2Q-9 3.4 -7 2" fill="none" stroke={EYE} strokeWidth="1" strokeLinecap="round" />
      <circle cx="4.4" cy="-2.6" r="10.6" fill={`url(#${uid}s)`} {...ink(W)} />
      <path d="M4.4 -2.6C6.4 -4.4 8.6 -1.6 6.6 .4C3.6 2.8 -.6 -.2 .4 -4.4C1.6 -9 8.4 -9.6 10.6 -5" fill="none" {...ink(1.7)} />
      <path d="M7.6 -14.4C9.4 -12 10 -11 10 -10A2.4 2.4 0 0 1 5.2 -10C5.2 -11 5.8 -12 7.6 -14.4Z" fill="#7dd3fc" {...ink(1.1)} />
    </g>
  ),

  magpie: () => (
    <g>
      <path d="M4 3L16 12L12 15.4L0 7Z" fill="#2563eb" {...ink(W)} />
      <path d="M-2 8V13M2 8V13" {...ink(1.5)} />
      <ellipse cx="-1" cy="1" rx="10" ry="8" fill="#1f2937" {...ink(W)} />
      <path d="M-9.6 3C-7 8.6 2 9.6 6.6 5C2 4.4 -5 3.4 -9.6 3Z" fill="#fff" />
      <path d="M-3 -3C3 -5 9 -3 11 4C5 6 -1 3 -3 -3Z" fill="#3b82f6" {...ink(1.5)} />
      <path d="M0 -1.4C3 -1 6 1 7.6 3.6" fill="none" stroke="#fff" strokeWidth="1.5" />
      <circle cx="-7" cy="-6" r="6" fill="#1f2937" {...ink(W)} />
      <path d="M-12 -7.4L-16 -5L-12 -3.8Z" fill="#fbbf24" {...ink(1.2)} />
      <circle cx="-8.4" cy="-7" r="1.7" fill="#fff" />
      <circle cx="-8.8" cy="-6.8" r=".9" fill={EYE} />
      <rect x="-16.4" y="-15" width="3.6" height="19" rx=".8" transform="rotate(14 -14.6 -5.5)" fill="#c08a4c" {...ink(1.4)} />
    </g>
  ),

  hanabi: ({ uid, still }) => (
    <g>
      <defs>
        <Rad id={`${uid}s`} s={[[0, '#f87171'], [1, '#b91c1c']]} />
      </defs>
      <path d="M2 -7C3 -11 6 -10 8 -10.6" fill="none" {...ink(2)} />
      <At x={9.6} y={-11}>
        <g {...fx(still, 'bg-glint', { d: 0.7 })}>
          <path d={starPath(6, 6.6, 2)} fill="#fde047" stroke="#ea580c" strokeWidth=".9" strokeLinejoin="round" />
          <circle r="1.4" fill="#fff" />
        </g>
      </At>
      <circle cx="-1" cy="3.4" r="11.6" fill={`url(#${uid}s)`} {...ink(W)} />
      <path d="M-12.4 1.6Q-1 7 10.4 1.6" fill="none" stroke="#fde047" strokeWidth="1.8" />
      <circle cx="-5" cy="1" r="2.6" fill="#fff" stroke={EYE} strokeWidth=".6" />
      <circle cx="3" cy="1" r="2.6" fill="#fff" stroke={EYE} strokeWidth=".6" />
      <circle cx="-4.4" cy="1" r=".9" fill={EYE} />
      <circle cx="3.6" cy="1" r=".9" fill={EYE} />
      <path d="M-5 8Q-3.4 6.6 -2 8T1 8T3 8" fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
      <path d="M9 -3.6C10.6 -1.6 11 -.8 11 0A1.9 1.9 0 0 1 7.2 0C7.2 -.8 7.6 -1.6 9 -3.6Z" fill="#7dd3fc" {...ink(.8)} />
    </g>
  ),

  ghost: ({ uid, still }) => (
    <g {...(still ? {} : { className: 'i-hover' })}>
      <defs>
        <Lin id={`${uid}g`} s={[[0, '#ffffff'], [1, '#d6d3f5']]} />
      </defs>
      <path d="M-12 14V-3C-12 -19 12 -19 12 -3V14Q9 10 6 14Q3 10 0 14Q-3 10 -6 14Q-9 10 -12 14Z" fill={`url(#${uid}g)`} {...ink(W)} />
      <path d="M-11.6 -8Q0 -12 11.6 -8" fill="none" stroke="#475569" strokeWidth="1.2" />
      <path d="M-4.6 -10.6L4.6 -10.6L0 -3.6Z" fill="#fff" stroke="#475569" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M-15.6 3C-14 .4 -12 0 -11 1.4M15.6 3C14 .4 12 0 11 1.4" fill="none" {...ink(1.8)} />
      <ellipse cx="-4.4" cy="1" rx="1.6" ry="2.2" fill={EYE} />
      <ellipse cx="4.4" cy="1" rx="1.6" ry="2.2" fill={EYE} />
      <ellipse cy="5.6" rx="1.3" ry="1.7" fill={EYE} />
      <ellipse cx="-8" cy="4.4" rx="1.9" ry="1.1" fill="#fb7185" opacity=".7" />
      <ellipse cx="8" cy="4.4" rx="1.9" ry="1.1" fill="#fb7185" opacity=".7" />
    </g>
  ),
};

/* ── auras ───────────────────────────────────────────────────────────────── */

/** Tapered spiral arm of the galaxy. */
const armPath = (rot: number, w: number) => {
  const out: string[] = [];
  const back: string[] = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const half = w * Math.sin(Math.PI * Math.min(1, t + 0.15)) + 0.4;
    out.push(polar(26 + t * 74 + half, rot + t * 190, 100, 100).join(' '));
    back.unshift(polar(26 + t * 74 - half, rot + t * 190, 100, 100).join(' '));
  }
  return `M${out.join('L')}L${back.join('L')}Z`;
};
const ARMS = [armPath(0, 11), armPath(120, 10), armPath(240, 11)];
const ARM_DUST = range(40).map((i) => {
  const t = ((i * 0.381) % 1) * 0.92 + 0.08;
  const [x, y] = polar(26 + t * 74 + (((i * 7) % 11) - 5) * 1.4, (i % 3) * 120 + t * 190 + ((i * 13) % 9) - 4, 100, 100);
  return { x, y, r: i % 5 === 0 ? 1.5 : 0.8 };
});
const CORONA = (seed: number, n: number, lo: number, hi: number) =>
  `M${range(n * 2)
    .map((i) => polar(i % 2 ? lo : lo + ((i * seed) % 17) / 17 * (hi - lo), (i * 180) / n, 100, 100).join(' '))
    .join('L')}Z`;
const CORONA_A = CORONA(7, 22, 66, 99);
const CORONA_B = CORONA(11, 16, 66, 90);
const RIVER_DUST = range(46).map((i) => {
  const t = (i * 0.618) % 1;
  const off = (((i * 0.37) % 1) - 0.5) * 34;
  return { x: n2(t * 210 - 5 + off * 0.5), y: n2(178 - t * 156 + off), r: i % 6 === 0 ? 1.5 : 0.8, gold: i % 3 === 0 };
});
const BOLTS = range(8).map((i) => {
  const a = i * 45 + 20 + (i % 2) * 6;
  const pts = [58, 67, 75, 84, 95].map((r, j) => polar(r, a + (j % 2 ? 7 : -7) * (i % 3 === 0 ? -1 : 1), 100, 100).join(' '));
  return `M${pts.join('L')}`;
});
const RUNES = ['M-3 -4L3 4M3 -4L0 0', 'M0 -4V4M-3 -1L3 -1', 'M-3 4L0 -4L3 4', 'M-3 -4H3L-3 4H3', 'M0 -4V4M0 -4L3 -1M0 0L3 -3', 'M-3 -3L0 4L3 -3M-2 0H2'];
const MATRIX: [number, number, string][] = [
  [10, 40, 'ｱ0ﾊ1ﾐｳ7'],
  [26, 96, 'ｼ1ﾅﾓ0ｻ'],
  [42, 26, '0ﾜﾂｵﾘ1ﾋ'],
  [18, 136, 'ﾘ9ｱ0ﾍ'],
  [58, 10, 'ｳｼ01ｶ'],
  [76, 4, 'ﾅ1ﾐ0'],
  [122, 4, 'ｻ0ﾜ1'],
  [140, 10, 'ﾂ1ｵ0ﾘ'],
  [158, 24, '1ﾋｰｳ0ｼﾅ'],
  [176, 100, 'ﾓ1ﾆ0ｻ'],
  [190, 42, 'ﾜ0ﾂ1ｵ8ﾘ'],
  [166, 138, '0ﾏ1ｹﾑ'],
];

const noteOne = (col: string) => (
  <>
    <path d="M3.4 4V-10C5.4 -6.4 10 -6.4 9.4 -1" fill="none" stroke={FG} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3.4 4V-10C5.4 -6.4 10 -6.4 9.4 -1" fill="none" stroke={col} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <ellipse cy="4.4" rx="4.2" ry="3.2" transform="rotate(-20)" fill={col} stroke={FG} strokeWidth="1" />
  </>
);
const noteTwo = (col: string) => (
  <>
    <path d="M-5 5V-8L8 -11V2" fill="none" stroke={FG} strokeWidth="3.6" strokeLinejoin="round" strokeLinecap="round" />
    <path d="M-5 5V-8L8 -11V2" fill="none" stroke={col} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
    <ellipse cx="-8" cy="5.4" rx="4" ry="3" transform="rotate(-20 -8 5.4)" fill={col} stroke={FG} strokeWidth="1" />
    <ellipse cx="5" cy="2.4" rx="4" ry="3" transform="rotate(-20 5 2.4)" fill={col} stroke={FG} strokeWidth="1" />
  </>
);

const Lantern = ({ id, band }: { id: string; band: string }) => (
  <>
    <path d="M0 0V6" stroke={FG} strokeWidth="1.5" />
    <ellipse cy="17" rx="10" ry="12" fill={`url(#${id})`} {...ink(1.8)} />
    <path d="M-9.4 12.6Q0 15 9.4 12.6M-10 17Q0 19.4 10 17M-9.4 21.4Q0 23.8 9.4 21.4" fill="none" stroke="#7f1d1d" strokeWidth=".9" opacity=".7" />
    <path d="M-10 16.2Q0 19 10 16.2V18.6Q0 21.4 -10 18.6Z" fill={band} opacity=".9" />
    <rect x="-5.4" y="4.4" width="10.8" height="3" rx="1" fill="#27272a" {...ink(1.2)} />
    <rect x="-5.4" y="26.8" width="10.8" height="3" rx="1" fill="#27272a" {...ink(1.2)} />
    <path d="M0 30V36" stroke="#fde047" strokeWidth="2" />
  </>
);

const flake = (big: boolean) =>
  big ? (
    <>
      <path d="M0 -7V7M-6 -3.5L6 3.5M-6 3.5L6 -3.5" stroke="#7dd3fc" strokeWidth="3" strokeLinecap="round" />
      <path d="M0 -7V7M-6 -3.5L6 3.5M-6 3.5L6 -3.5" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
    </>
  ) : (
    <circle r="3" fill="#fff" stroke="#7dd3fc" strokeWidth="1.2" />
  );

const Hydrangea = ({ x, y, flip }: { x: number; y: number; flip?: boolean }) => (
  <g transform={`translate(${x} ${y})${flip ? ' scale(-1 1)' : ''}`}>
    <path d="M-16 8C-30 6 -32 16 -28 24C-20 24 -12 18 -16 8Z" fill="#16a34a" {...ink(1.6)} />
    <path d="M14 10C28 8 30 18 26 25C18 25 10 20 14 10Z" fill="#15803d" {...ink(1.6)} />
    <circle r="19" fill="#6366f1" {...ink(2)} />
    {[[-9, -9], [2, -12], [11, -6], [-13, 1], [-3, -2], [8, 3], [-6, 9], [5, 11], [14, 7 - 9]].map(([a, b], i) => (
      <g key={i} transform={`translate(${a} ${b})`}>
        {[0, 90, 180, 270].map((r) => (
          <circle key={r} cx={polar(2.6, r)[0]} cy={polar(2.6, r)[1]} r="2.4" fill={i % 3 === 0 ? '#c4b5fd' : i % 3 === 1 ? '#a5b4fc' : '#818cf8'} />
        ))}
        <circle r="1" fill="#fff" />
      </g>
    ))}
  </g>
);

export const AURA_ART: Record<string, AuraArt> = {
  dust: ({ still }) => (
    <g>
      {rim(9, 20, 58, 90).map(({ x, y, i }) => (
        <At key={i} x={x} y={y}>
          <g {...fx(still, 'bg-drift', { d: 8 + i, t: i * 1.3, dx: i % 2 ? 16 : -14, dy: -22 })}>
            <circle r={i % 3 === 0 ? 3.6 : 2.2} fill="#a8a29e" opacity={i % 2 ? 0.85 : 0.6} />
          </g>
        </At>
      ))}
      <At x={30} y={52}>
        <g {...fx(still, 'bg-spin', { d: 14 })}>
          <path d={starPath(8, 9, 6.4)} fill="#a8a29e" {...ink(1.4)} />
          <circle r="2.6" fill="var(--surf)" {...ink(1.2)} />
        </g>
      </At>
      <At x={170} y={148} rot={32}>
        <g {...fx(still, 'bg-float', { d: 5, dy: 4 })}>
          <path d="M-5 -8H5M0 -8V8" fill="none" {...ink(3)} />
          <path d="M-3 -2.6H3M-3 1H3M-3 4.6H3" {...ink(1.2)} />
        </g>
      </At>
      <At x={172} y={44} rot={-20}>
        <g {...fx(still, 'bg-float', { d: 6, t: 2, dy: 5 })}>
          <path d={starPath(6, 5, 4)} fill="#d6d3d1" {...ink(1.2)} />
          <circle r="1.6" fill={FG} />
        </g>
      </At>
    </g>
  ),

  embers: ({ uid, still }) => (
    <g>
      <defs>
        <Rad id={`${uid}a`} at={[100, 190, 110]} s={[[0, '#f97316', 0.5], [0.6, '#ef4444', 0.16], [1, '#ef4444', 0]]} />
      </defs>
      <circle cx="100" cy="190" r="110" fill={`url(#${uid}a)`} />
      {rim(13, 40, 60, 94).map(({ x, y, i }) => (
        <At key={i} x={x} y={y} s={i % 3 === 0 ? 2 : 1.4}>
          <g {...fx(still, 'bg-drift', { d: 3 + (i % 4), t: i * 0.47, dx: i % 2 ? 14 : -12, dy: -46, r: 180 })}>
            <path d="M0 -4.6L2.8 0L0 4.6L-2.8 0Z" fill={['#fde047', '#fb923c', '#ef4444'][i % 3]} stroke="#7f1d1d" strokeWidth=".7" />
          </g>
        </At>
      ))}
    </g>
  ),

  bubbles: ({ still }) => (
    <g>
      {rim(11, 10, 60, 92).map(({ x, y, i }) => {
        const r = [11, 6, 9, 5, 13, 6, 10][i % 7];
        return (
          <At key={i} x={x} y={y}>
            <g {...fx(still, 'bg-drift', { d: 5 + (i % 4) * 1.5, t: i * 0.8, dx: i % 2 ? 10 : -10, dy: -52 })}>
              <circle r={r} fill="#7dd3fc" fillOpacity=".18" stroke="#0ea5e9" strokeWidth="2" />
              <path d={`M${-r * 0.55} ${-r * 0.2}A${r * 0.6} ${r * 0.6} 0 0 1 ${-r * 0.1} ${-r * 0.6}`} fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx={r * 0.42} cy={r * 0.42} r={r * 0.09 + 0.3} fill="#fff" stroke="#0ea5e9" strokeWidth=".4" />
            </g>
          </At>
        );
      })}
    </g>
  ),

  notes: ({ c, c2, still }) => (
    <g>
      <g fill="none" stroke={FG} strokeWidth="1" opacity=".22">
        {[0, 6, 12, 18, 24].map((o) => (
          <path key={o} d={`M4 ${44 + o}C40 ${10 + o} 70 ${10 + o} 100 ${18 + o}S160 ${38 + o} 196 ${16 + o}`} />
        ))}
      </g>
      {[
        [26, 60, 0, 1.1],
        [58, 32, 1, 1],
        [148, 44, 0, 1.2],
        [178, 74, 1, 1.1],
        [20, 118, 1, 1],
        [176, 128, 0, 1],
        [40, 164, 0, 1.2],
        [160, 170, 1, 1.1],
        [100, 22, 0, 0.9],
      ].map(([x, y, kind, s], i) => (
        <At key={i} x={x} y={y} s={s}>
          <g {...fx(still, 'bg-drift', { d: 5 + (i % 3), t: i * 0.9, dx: i % 2 ? 12 : -12, dy: -30, r: i % 2 ? 16 : -16 })}>
            {kind ? noteTwo(i % 2 ? c : c2) : noteOne(i % 2 ? c2 : c)}
          </g>
        </At>
      ))}
    </g>
  ),

  matrix: ({ still }) => (
    <g fontFamily="ui-monospace, Menlo, Consolas, monospace" fontSize="12" fontWeight="800" textAnchor="middle">
      {MATRIX.map(([x, y, s], i) => (
        <At key={x} x={x} y={y}>
          <g {...fx(still, 'bg-drift', { d: 2.6 + (i % 4) * 0.7, t: i * 0.53, dy: 44 })}>
            {[...s].map((ch, j) => (
              <text key={j} y={j * 12.5} fill={j === s.length - 1 ? FG : '#22c55e'} opacity={j === s.length - 1 ? 1 : n2(0.28 + (j / s.length) * 0.72)}>
                {ch}
              </text>
            ))}
          </g>
        </At>
      ))}
    </g>
  ),

  lightning: ({ still }) => (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="100" cy="100" r="60" stroke="#38bdf8" strokeWidth="1.4" strokeDasharray="2 9" opacity=".7" />
      {BOLTS.map((d, i) => (
        <g key={d} {...fx(still, 'bg-zap', { d: 1.3 + (i % 4) * 0.37, t: i * 0.43 })}>
          <path d={d} stroke="#2563eb" strokeWidth="6" opacity=".35" />
          <path d={d} stroke={i % 3 === 1 ? '#facc15' : '#38bdf8'} strokeWidth="3.4" />
          <path d={d} stroke="#fff" strokeWidth="1.2" />
        </g>
      ))}
      {BOLTS.slice(0, 4).map((_, i) => {
        const [x, y] = polar(90, i * 90 + 62, 100, 100);
        return (
          <At key={i} x={x} y={y}>
            <g {...fx(still, 'bg-twinkle', { d: 0.8 + i * 0.2, t: i * 0.3 })}>
              <path d={sparkPath(7)} fill="#fff" stroke="#2563eb" strokeWidth="1" />
            </g>
          </At>
        );
      })}
    </g>
  ),

  sigil: ({ c, c2, still }) => (
    <At x={100} y={100}>
      <circle r="88" fill="none" stroke={c} strokeWidth="14" opacity=".12" />
      <Wheel still={still} r={97} d={40}>
        <circle r="96" fill="none" stroke={c} strokeWidth="2.6" />
        <circle r="78" fill="none" stroke={c} strokeWidth="2" />
        {range(18).map((i) => (
          <g key={i} transform={`rotate(${i * 20}) translate(0 -87)`}>
            <path d={RUNES[i % RUNES.length]} fill="none" stroke={c2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ))}
      </Wheel>
      <Wheel still={still} r={78} d={28} rev>
        <path d={`M${[0, 2, 4].map((i) => polar(78, -90 + i * 60).join(' ')).join('L')}Z`} fill="none" stroke={c} strokeWidth="2.4" strokeLinejoin="round" />
        <path d={`M${[1, 3, 5].map((i) => polar(78, -90 + i * 60).join(' ')).join('L')}Z`} fill="none" stroke={c2} strokeWidth="2.4" strokeLinejoin="round" />
        {range(6).map((i) => {
          const [x, y] = polar(78, -90 + i * 60);
          return <circle key={i} cx={x} cy={y} r="5" fill={i % 2 ? c2 : c} {...ink(1.6)} />;
        })}
      </Wheel>
      <circle r="52" fill="none" stroke={c2} strokeWidth="2" strokeDasharray="3 6" />
    </At>
  ),

  galaxy: ({ uid, still }) => (
    <g>
      <defs>
        <Rad id={`${uid}s`} at={[100, 100, 100]} s={[[0, '#2e1065', 0.98], [0.72, '#1e1b4b', 0.92], [0.92, '#172554', 0.5], [1, '#172554', 0]]} />
        <Rad id={`${uid}c`} at={[100, 100, 66]} s={[[0, '#fff7c2', 1], [0.5, '#f0abfc', 0.8], [1, '#a855f7', 0]]} />
        <Rad id={`${uid}a`} at={[100, 100, 100]} s={[[0.2, '#f0abfc', 0.95], [0.6, '#818cf8', 0.8], [1, '#38bdf8', 0.15]]} />
      </defs>
      <circle cx="100" cy="100" r="100" fill={`url(#${uid}s)`} />
      <g {...fx(still, 'bg-spin', { d: 48 })}>
        <circle cx="100" cy="100" r="100" fill="none" />
        {ARMS.map((d) => (
          <path key={d} d={d} fill={`url(#${uid}a)`} />
        ))}
        {ARM_DUST.map(({ x, y, r }, i) => (
          <circle key={i} cx={x} cy={y} r={r} fill={i % 4 ? '#fff' : '#fde68a'} />
        ))}
      </g>
      <circle cx="100" cy="100" r="66" fill={`url(#${uid}c)`} />
      {rim(10, 77, 70, 94).map(({ x, y, i }) => (
        <At key={i} x={x} y={y}>
          <g {...fx(still, 'bg-twinkle', { d: 2 + (i % 4) * 0.7, t: i * 0.6 })}>
            <path d={sparkPath(i % 3 === 0 ? 7 : 4)} fill="#fff" />
          </g>
        </At>
      ))}
    </g>
  ),

  rays: ({ uid, still }) => {
    const sign = (x: number, y: number, rot: number) => (
      <g transform={`translate(${x} ${y}) rotate(${rot})`} fontFamily="Arial Black, Impact, system-ui, sans-serif" fontWeight="900" fontSize="20" textAnchor="middle">
        <rect x="-23" y="-17" width="46" height="23" rx="5" fill="#b91c1c" {...ink(2.4)} />
        <text y="-.6" fill="#fde047" stroke="#7c2d12" strokeWidth=".6">
          GO!
        </text>
      </g>
    );
    return (
      <g>
        <defs>
          <Rad id={`${uid}r`} at={[0, 0, 100]} s={[[0.2, '#fffbd1'], [0.55, '#fde047'], [0.82, '#f59e0b'], [1, '#ea580c', 0.5]]} />
          <Rad id={`${uid}x`} at={[0, 0, 100]} s={[[0.2, '#ef4444'], [0.75, '#dc2626'], [1, '#991b1b', 0.5]]} />
        </defs>
        <At x={100} y={100}>
          <Wheel still={still} r={97} d={36}>
            {range(24).map((i) => (
              <path key={i} d="M-5 0L-25.4 -97L25.4 -97L5 0Z" transform={`rotate(${i * 15})`} fill={`url(#${uid}${i % 2 ? 'x' : 'r'})`} />
            ))}
          </Wheel>
          <circle r="93" fill="none" stroke="#7c2d12" strokeWidth="9" />
          <circle r="93" fill="none" stroke="#fbbf24" strokeWidth="5.4" />
          {[0, 1].map((k) => (
            <g key={k} {...fx(still, 'bg-shine', { d: 0.9, t: k * 0.45 })}>
              {range(11).map((i) => {
                const [x, y] = polar(93, (i * 2 + k) * (360 / 22));
                return <circle key={i} cx={x} cy={y} r="4.2" fill={k ? '#fff' : '#fde047'} {...ink(1.5)} />;
              })}
            </g>
          ))}
        </At>
        {sign(36, 44, -14)}
        {sign(164, 44, 14)}
      </g>
    );
  },

  eclipse: ({ uid, still }) => (
    <g>
      <defs>
        <Rad id={`${uid}s`} at={[100, 100, 100]} s={[[0.55, '#0b0820', 1], [0.86, '#1e1b4b', 0.92], [1, '#1e1b4b', 0]]} />
        <Rad id={`${uid}a`} at={[100, 100, 100]} s={[[0.6, '#ffffff'], [0.72, '#fde68a', 0.95], [0.86, '#f59e0b', 0.5], [1, '#ef4444', 0]]} />
        <Rad id={`${uid}b`} at={[100, 100, 92]} s={[[0.68, '#e0f2fe'], [0.84, '#a5b4fc', 0.65], [1, '#c084fc', 0]]} />
        <Rad id={`${uid}d`} s={[[0, '#ffffff'], [0.3, '#fff7c2', 0.95], [1, '#fde047', 0]]} />
      </defs>
      <circle cx="100" cy="100" r="100" fill={`url(#${uid}s)`} />
      {[[16, 40], [30, 174], [186, 150], [176, 24], [6, 112]].map(([x, y]) => (
        <path key={x} d={sparkPath(3.4, 0.2)} transform={`translate(${x} ${y})`} fill="#fff" />
      ))}
      <g {...fx(still, 'bg-spin', { d: 60 })}>
        <circle cx="100" cy="100" r="100" fill="none" />
        <path d={CORONA_A} fill={`url(#${uid}a)`} />
      </g>
      <g {...fx(still, 'bg-rev', { d: 44 })}>
        <circle cx="100" cy="100" r="100" fill="none" />
        <path d={CORONA_B} fill={`url(#${uid}b)`} />
      </g>
      <circle cx="100" cy="100" r="66" fill="#000" stroke="#fff" strokeWidth="2.6" />
      <circle cx="100" cy="100" r="62" fill="none" stroke="#fde68a" strokeWidth="1" opacity=".5" />
      {[-32, -20, 8, 20].map((a, i) => {
        const [x, y] = polar(66, a - 52, 100, 100);
        return (
          <At key={a} x={x} y={y}>
            <g {...fx(still, 'bg-twinkle', { d: 1.4 + i * 0.4, t: i * 0.4 })}>
              <circle r={2.6 - i * 0.2} fill="#fff" />
            </g>
          </At>
        );
      })}
      <At x={polar(66, -52, 100, 100)[0]} y={polar(66, -52, 100, 100)[1]}>
        <g {...fx(still, 'bg-shine', { d: 2.4 })}>
          <circle r="22" fill={`url(#${uid}d)`} />
          <path d={sparkPath(30, 0.07)} fill="#fff" />
        </g>
      </At>
    </g>
  ),

  leaves: ({ still }) => (
    <g>
      {rim(11, 200, 60, 94).map(({ x, y, i }) => (
        <At key={i} x={x} y={y} s={[1.3, 0.9, 1.1, 1.45][i % 4]} rot={i * 47}>
          <g {...fx(still, 'bg-drift', { d: 6 + (i % 4), t: i * 0.84, dx: i % 2 ? 22 : -18, dy: 70, r: i % 2 ? 220 : -220 })}>
            <Maple col={AUTUMN[i % AUTUMN.length]} w={1.1} />
          </g>
        </At>
      ))}
    </g>
  ),

  snow: ({ still }) => (
    <g>
      <path d="M6 198C10 186 24 180 42 184C60 188 72 180 96 184C120 188 134 178 156 182C176 185 190 186 194 198Q100 202 6 198Z" fill="#f8fafc" stroke="#7dd3fc" strokeWidth="2" />
      {rim(13, 300, 56, 94).map(({ x, y, i }) => (
        <At key={i} x={x} y={y} s={i % 4 === 0 ? 1.15 : 1}>
          <g {...fx(still, 'bg-drift', { d: 8 + (i % 4) * 1.5, t: i * 1.1, dx: i % 2 ? 10 : -10, dy: 56, r: i % 4 === 0 ? 90 : 0 })}>{flake(i % 2 === 0)}</g>
        </At>
      ))}
    </g>
  ),

  beanstorm: ({ still }) => (
    <g>
      {rim(12, 15, 62, 92).map(({ x, y, i }) => {
        const left = x < 100;
        const dx = left ? 58 : -58;
        const dy = i % 2 ? 26 : -16;
        return (
          <At key={i} x={x} y={y}>
            <g {...fx(still, 'bg-drift', { d: 1.3 + (i % 4) * 0.25, t: i * 0.37, dx, dy, r: left ? 540 : -540 })}>
              <path d={`M${left ? -9 : 9} -3.4H${left ? -19 : 19}M${left ? -9 : 9} 1H${left ? -16 : 16}M${left ? -9 : 9} 4H${left ? -21 : 21}`} stroke={FG} strokeWidth="1.2" strokeLinecap="round" opacity=".55" />
              <ellipse rx="8.4" ry="6.8" fill={i % 3 ? '#d8a657' : '#b77a2e'} transform={`rotate(${i * 40})`} {...ink(1.7)} />
              <path d="M-2.4 -1Q0 .8 2.4 -1" fill="none" stroke="#6b3f1d" strokeWidth="1.2" strokeLinecap="round" transform={`rotate(${i * 40})`} />
            </g>
          </At>
        );
      })}
      <path d={sparkPath(8, 0.25)} transform="translate(42 104)" fill="#fde047" {...ink(1)} />
      <path d={sparkPath(7, 0.25)} transform="translate(158 88)" fill="#fde047" {...ink(1)} />
    </g>
  ),

  petals: ({ still }) => (
    <g>
      <g fill="none" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" opacity=".32">
        <path d="M6 66C40 28 110 8 168 40" />
        <path d="M194 128C170 176 96 196 40 160" />
        <path d="M18 104C20 70 42 44 72 32" />
      </g>
      {rim(13, 120, 58, 94).map(({ x, y, i }) => (
        <At key={i} x={x} y={y} s={[1.3, 1, 1.15, 0.85][i % 4]} rot={i * 61}>
          <g {...fx(still, 'bg-drift', { d: 3.4 + (i % 4) * 0.7, t: i * 0.51, dx: 62, dy: i % 2 ? 22 : 38, r: i % 2 ? 300 : -300 })}>
            <path d="M0 -7C5 -5.4 5.6 2 0 7.4C-5.6 2 -5 -5.4 -1.1 -7L0 -5.2Z" fill={['#f9a8d4', '#fbcfe8', '#f472b6'][i % 3]} stroke="#be185d" strokeWidth=".9" strokeLinejoin="round" />
          </g>
        </At>
      ))}
    </g>
  ),

  rain: ({ still }) => (
    <g>
      <Hydrangea x={24} y={172} />
      <Hydrangea x={176} y={176} flip />
      {[
        [72, 192],
        [130, 188],
      ].map(([x, y], i) => (
        <At key={x} x={x} y={y}>
          <g {...fx(still, 'bg-ripple', { t: i * 1.1 })}>
            <ellipse rx="18" ry="5" fill="none" stroke="#818cf8" strokeWidth="2" />
          </g>
        </At>
      ))}
      {range(12).map((i) => {
        const x = 8 + ((i * 7) % 12) * 16.4;
        const y = Math.abs(x - 100) < 56 ? 16 + (i % 3) * 8 : 40 + ((i * 5) % 7) * 15;
        return (
          <At key={i} x={n2(x)} y={y} rot={12}>
            <g {...fx(still, 'bg-drift', { d: 0.8 + (i % 3) * 0.2, t: i * 0.17, dx: -12, dy: 62 })}>
              <path d="M0 -10V8" stroke={['#8b5cf6', '#6366f1', '#a855f7'][i % 3]} strokeWidth="3" strokeLinecap="round" />
              <circle cy="9" r="2.4" fill={['#8b5cf6', '#6366f1', '#a855f7'][i % 3]} />
            </g>
          </At>
        );
      })}
    </g>
  ),

  stars: ({ uid, still }) => (
    <g>
      <defs>
        <Rad id={`${uid}a`} s={[[0, '#f9a8d4', 0.9], [1, '#f9a8d4', 0]]} />
        <Rad id={`${uid}b`} s={[[0, '#7dd3fc', 0.9], [1, '#7dd3fc', 0]]} />
        <Lin id={`${uid}r`} to={[1, 0]} s={[[0, '#312e81', 0.2], [0.3, '#4338ca', 0.75], [0.5, '#a5b4fc', 0.85], [0.7, '#4338ca', 0.75], [1, '#312e81', 0.2]]} />
      </defs>
      <path d="M-4 150C50 150 80 110 112 76C136 50 170 36 204 28V76C176 80 150 94 126 118C92 150 56 188 -4 196Z" fill={`url(#${uid}r)`} />
      {RIVER_DUST.map(({ x, y, r, gold }, i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={gold ? '#fde047' : '#fff'} stroke="#312e81" strokeWidth=".3" />
      ))}
      {[[20, 168], [50, 144], [78, 166], [40, 188], [128, 62], [158, 76], [186, 40], [172, 60], [106, 40], [150, 30]].map(([x, y], i) => (
        <At key={i} x={x} y={y}>
          <g {...fx(still, 'bg-twinkle', { d: 1.8 + (i % 4) * 0.6, t: i * 0.5 })}>
            <path d={starPath(5, i % 3 === 0 ? 6.4 : 4.4, i % 3 === 0 ? 2.6 : 1.8)} fill="#fde047" stroke="#92400e" strokeWidth=".6" />
          </g>
        </At>
      ))}
      {[
        [30, 52, '#f9a8d4', '#be185d'],
        [170, 150, '#7dd3fc', '#0369a1'],
      ].map(([x, y, col, edge], i) => (
        <At key={i} x={x as number} y={y as number}>
          <circle r="22" fill={`url(#${uid}${i ? 'b' : 'a'})`} />
          <g {...fx(still, 'bg-glint', { d: 3.2, t: i * 1.6 })}>
            <path d={sparkPath(15, 0.14)} fill="#fff" stroke={edge as string} strokeWidth="1" />
          </g>
          <circle r="3.2" fill={col as string} stroke={edge as string} strokeWidth="1" />
        </At>
      ))}
    </g>
  ),

  lanterns: ({ uid, still }) => {
    const spots = [-196, -162, -136, -113, -90, -67, -44, -18, 16].map((a) => polar(1, a));
    return (
      <g>
        <defs>
          <Rad id={`${uid}l`} s={[[0, '#fff7c2'], [0.55, '#f87171'], [1, '#b91c1c']]} />
          <Rad id={`${uid}w`} s={[[0, '#fffbeb'], [0.6, '#fde68a'], [1, '#f59e0b']]} />
          <Rad id={`${uid}a`} s={[[0, '#fbbf24', 0.5], [1, '#fbbf24', 0]]} />
        </defs>
        <path d={`M${n2(100 + 88 * spots[0][0])} ${n2(110 + 96 * spots[0][1])}A88 96 0 1 1 ${n2(100 + 88 * spots[8][0])} ${n2(110 + 96 * spots[8][1])}`} fill="none" stroke={FG} strokeWidth="1.8" />
        {spots.map(([a, b], i) => {
          const x = n2(100 + 88 * a);
          const y = n2(110 + 96 * b);
          return (
            <At key={i} x={x} y={y}>
              <circle cy="17" r="22" fill={`url(#${uid}a)`} />
              <g {...fx(still, 'bg-hang', { d: 2.6 + (i % 3) * 0.5, t: i * 0.6, r: 5 })}>
                <Lantern id={`${uid}${i % 3 === 1 ? 'w' : 'l'}`} band={i % 3 === 1 ? '#dc2626' : '#fde047'} />
              </g>
            </At>
          );
        })}
      </g>
    );
  },

  flames: ({ uid, still }) => (
    <g>
      <defs>
        <Lin id={`${uid}f`} s={[[0, '#a5f3fc'], [0.5, '#22d3ee'], [1, '#6d28d9']]} />
        <Rad id={`${uid}a`} s={[[0, '#22d3ee', 0.5], [1, '#22d3ee', 0]]} />
      </defs>
      {range(9).map((i) => {
        const [x, y] = polar(78, i * 40 - 90, 100, 100);
        const s = i % 3 === 0 ? 1.25 : i % 3 === 1 ? 0.8 : 1;
        return (
          <At key={i} x={x} y={y} s={s}>
            <circle cy="4" r="17" fill={`url(#${uid}a)`} />
            <g {...fx(still, 'bg-flick', { d: 0.9 + (i % 3) * 0.3, t: i * 0.3 })}>
              <path d="M0 13C-7 13 -11 8 -10 2C-9 -3 -4 -4 -3 -8C-2.4 -11 1 -14 5 -16C3 -12 4 -9 6 -6C9 -2 11 2 10 6C9 10 6 13 0 13Z" fill={`url(#${uid}f)`} {...ink(1.6)} />
              <path d="M0 10C-3.4 10 -5 7 -4 4C-3 1.4 -1 0 0 -3C2 0 5 2 4.6 5C4.2 8 2.6 10 0 10Z" fill="#ecfeff" />
              {i % 3 === 0 && (
                <>
                  <circle cx="-2.2" cy="5.4" r="1.2" fill={EYE} />
                  <circle cx="2.2" cy="5.4" r="1.2" fill={EYE} />
                  <ellipse cy="8.2" rx=".9" ry="1.2" fill={EYE} />
                </>
              )}
            </g>
          </At>
        );
      })}
    </g>
  ),
};
