import type { CSSProperties, ReactNode } from 'react';
import type { BotArtProps, BotRegistry } from './types';
import './chassisGuardians.css';

/**
 * The beasts of the four directions, and the yellow dragon above them, as armoured machines.
 * Every identity colour comes from `c` and `c2` (a paint job replaces them); steel, gold, ivory,
 * ink and fire are materials and stay fixed.
 */

const FG = 'var(--fg)';
const OL = { stroke: FG, strokeWidth: 2.2, strokeLinejoin: 'round', strokeLinecap: 'round' } as const;
const INK = '#141821';
const GOLD = '#f2c14e';
const GOLD_D = '#9a6a12';
const IVORY = '#f6eedb';
const KANJI = '"Yu Mincho", "Hiragino Mincho ProN", "Noto Serif JP", serif';
const dk = (c: string, n = 35) => `color-mix(in srgb, ${c} ${100 - n}%, #000)`;
const lt = (c: string, n = 35) => `color-mix(in srgb, ${c} ${100 - n}%, #fff)`;
const mix = (a: string, b: string, n: number) => `color-mix(in srgb, ${a} ${n}%, ${b})`;
const an = (still: boolean, cls: string) => (still ? undefined : cls);
const origin = (x: number, y: number, delay?: number): CSSProperties => ({ transformOrigin: `${x}px ${y}px`, animationDelay: delay ? `${delay}s` : undefined });
const f1 = (v: number) => (Math.round(v * 10) / 10).toString();
const MIRROR = 'matrix(-1 0 0 1 200 0)';

function Eyes({ still, children }: { still: boolean; children: ReactNode }) {
  return (
    <g className="dr-gaze">
      <g className={still ? undefined : 'i-blink'}>{children}</g>
    </g>
  );
}
const Shadow = ({ rx = 56 }: { rx?: number }) => <ellipse cx="100" cy="186" rx={rx} ry="5.5" fill="var(--fg)" opacity=".16" />;
/** Glow: the shape plus a blurred copy of itself. */
const Glow = ({ id, s = 1.8 }: { id: string; s?: number }) => (
  <filter id={id} filterUnits="userSpaceOnUse" x="-20" y="-20" width="240" height="240">
    <feGaussianBlur stdDeviation={s} result="b" />
    <feMerge>
      <feMergeNode in="b" />
      <feMergeNode in="SourceGraphic" />
    </feMerge>
  </filter>
);
const Soft = ({ id, s = 4 }: { id: string; s?: number }) => (
  <filter id={id} filterUnits="userSpaceOnUse" x="-20" y="-20" width="240" height="240">
    <feGaussianBlur stdDeviation={s} />
  </filter>
);
function Rad({ id, a, m, b, cx = 0.36, cy = 0.28, r = 0.85 }: { id: string; a: string; m: string; b: string; cx?: number; cy?: number; r?: number }) {
  return (
    <radialGradient id={id} cx={cx} cy={cy} r={r}>
      <stop offset="0" stopColor={a} />
      <stop offset=".55" stopColor={m} />
      <stop offset="1" stopColor={b} />
    </radialGradient>
  );
}
function Lin({ id, a, m, b, x2 = 0, y2 = 1 }: { id: string; a: string; m?: string; b: string; x2?: number; y2?: number }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2={x2} y2={y2}>
      <stop offset="0" stopColor={a} />
      {m && <stop offset=".5" stopColor={m} />}
      <stop offset="1" stopColor={b} />
    </linearGradient>
  );
}

/** A pointed blade (a feather, a fin, a flame) along +x from the origin. */
const blade = (L: number, w: number) =>
  `M0 0 C${f1(L * 0.3)} ${f1(-w)} ${f1(L * 0.75)} ${f1(-w * 0.7)} ${L} 0 C${f1(L * 0.7)} ${f1(w * 0.35)} ${f1(L * 0.3)} ${f1(w * 0.5)} 0 0Z`;
/** A brush stroke: a pressed, rounded start tapering to a dry tip, along +x. */
/** A blade whose tip bends toward +y. */
const curved = (L: number, w: number, k = 0.8) =>
  `M0 0 C${f1(L * 0.3)} ${f1(-w)} ${f1(L * 0.72)} ${f1(-w * 0.6)} ${L} ${f1(w * k)} C${f1(L * 0.7)} ${f1(w * 0.55)} ${f1(L * 0.3)} ${f1(w * 0.55)} 0 0Z`;
const brush = (L: number, w: number) =>
  `M0 ${f1(-w / 2)} C${f1(L * 0.35)} ${f1(-w * 0.75)} ${f1(L * 0.75)} ${f1(-w * 0.35)} ${L} 0 C${f1(L * 0.72)} ${f1(w * 0.2)} ${f1(L * 0.35)} ${f1(w * 0.6)} 0 ${f1(w / 2)} C${f1(-w * 0.5)} ${f1(w * 0.35)} ${f1(-w * 0.5)} ${f1(-w * 0.35)} 0 ${f1(-w / 2)}Z`;
const hexPts = (x: number, y: number, r: number) =>
  Array.from({ length: 6 }, (_, i) => `${f1(x + r * Math.cos((Math.PI / 3) * i))},${f1(y + r * Math.sin((Math.PI / 3) * i))}`).join(' ');
const bz = (p: number[], u: number) => {
  const v = 1 - u;
  return v * v * v * p[0] + 3 * v * v * u * p[1] + 3 * v * u * u * p[2] + u * u * u * p[3];
};
const MAPLE = 'M0 -6 L1.5 -2.5 L4.5 -4 L3.5 -.5 L6 .5 L3 2 L3.5 4 L.8 3.2 L.5 6.5 L-.5 6.5 L-.8 3.2 L-3.5 4 L-3 2 L-6 .5 L-3.5 -.5 L-4.5 -4 L-1.5 -2.5Z';
/** A ruyi cloud, about 70 × 28, centred on the origin. */
const CLOUD = 'M-30 9 C-38 9 -40 -1 -32 -4 C-33 -14 -19 -18 -14 -9 C-11 -21 9 -22 12 -9 C17 -16 30 -13 29 -3 C37 -2 38 9 29 9Z';
const CLOUD_CURL = 'M-22 3 c1 -6 9 -6 9 -1 c0 3 -4 3 -4 1 M4 -2 c2 -6 10 -5 9 1 c-1 3 -5 2 -4 0 M18 5 c3 -3 7 -2 7 1';

// ─── Tubes: serpent bodies drawn along a spline ─────────────────────────────
type P = [number, number];
interface S {
  x: number;
  y: number;
  nx: number;
  ny: number;
  tx: number;
  ty: number;
  w: number;
}
function spline(pts: P[], n: number): P[] {
  const seg = pts.length - 1;
  const out: P[] = [];
  for (let i = 0; i <= n; i++) {
    const uu = (i / n) * seg;
    const k = Math.min(Math.floor(uu), seg - 1);
    const t = uu - k;
    const p0 = pts[Math.max(k - 1, 0)];
    const p1 = pts[k];
    const p2 = pts[k + 1];
    const p3 = pts[Math.min(k + 2, seg)];
    const t2 = t * t;
    const t3 = t2 * t;
    const cr = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
    out.push([cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])]);
  }
  return out;
}
function tube(pts: P[], w: (t: number) => number, n = 40): S[] {
  const sp = spline(pts, n);
  return sp.map((p, i) => {
    const a = sp[Math.max(i - 1, 0)];
    const b = sp[Math.min(i + 1, n)];
    let dx = b[0] - a[0];
    let dy = b[1] - a[1];
    const L = Math.hypot(dx, dy) || 1;
    dx /= L;
    dy /= L;
    return { x: p[0], y: p[1], nx: -dy, ny: dx, tx: dx, ty: dy, w: w(i / n) };
  });
}
const at = (q: S, k: number) => `${f1(q.x + q.nx * q.w * k)} ${f1(q.y + q.ny * q.w * k)}`;
const band = (s: S[], k1: number, k2: number) => `M${s.map((q) => at(q, k1)).join(' L')} L${[...s].reverse().map((q) => at(q, k2)).join(' L')}Z`;
/** The outline of a tube, optionally with round ends. */
function outline(s: S[], c0 = false, c1 = false) {
  const pts = s.map((q) => at(q, 0.5));
  const cap = (q: S, sign: number) => {
    const r = q.w / 2;
    for (let i = 1; i < 8; i++) {
      const th = (Math.PI * i) / 8;
      const cn = Math.cos(th) * sign;
      const st = Math.sin(th) * sign;
      pts.push(`${f1(q.x + r * (cn * q.nx + st * q.tx))} ${f1(q.y + r * (cn * q.ny + st * q.ty))}`);
    }
  };
  if (c1) cap(s[s.length - 1], 1);
  pts.push(...[...s].reverse().map((q) => at(q, -0.5)));
  if (c0) cap(s[0], -1);
  return `M${pts.join(' L')}Z`;
}
const lineAt = (s: S[], k: number) => `M${s.map((q) => at(q, k)).join(' L')}`;
function scalesD(s: S[], ks: number[], step = 2, r = 0.13) {
  let d = '';
  s.forEach((q, i) => {
    if (q.w < 4) return;
    ks.forEach((k, j) => {
      if ((i + j) % step) return;
      const x = q.x + q.nx * q.w * k;
      const y = q.y + q.ny * q.w * k;
      const rr = q.w * r;
      d += `M${f1(x - q.nx * rr)} ${f1(y - q.ny * rr)} Q${f1(x + q.tx * rr * 1.8)} ${f1(y + q.ty * rr * 1.8)} ${f1(x + q.nx * rr)} ${f1(y + q.ny * rr)}`;
    });
  });
  return d;
}
const rungsD = (s: S[], k1: number, k2: number, step = 2) =>
  s
    .filter((q, i) => i % step === 1 % step && q.w > 3)
    .map((q) => `M${at(q, k1)} L${at(q, k2)}`)
    .join('');
function spinesD(s: S[], side: number, step = 3, len = 0.4) {
  let d = '';
  s.forEach((q, i) => {
    if (i % step || q.w < 5 || i === 0) return;
    const bx = q.x - q.nx * q.w * 0.45 * side;
    const by = q.y - q.ny * q.w * 0.45 * side;
    const h = q.w * len;
    const b = q.w * 0.16;
    d += `M${f1(bx - q.tx * b)} ${f1(by - q.ty * b)} L${f1(bx - q.nx * h * side + q.tx * h * 0.45)} ${f1(by - q.ny * h * side + q.ty * h * 0.45)} L${f1(bx + q.tx * b)} ${f1(by + q.ty * b)}Z`;
  });
  return d;
}
interface CoilProps {
  s: S[];
  fill: string;
  side?: number;
  belly?: string;
  bellyK?: [number, number];
  scale?: string;
  scaleK?: number[];
  hi?: string;
  spine?: string;
  ol?: number;
  caps?: [boolean, boolean];
  rung?: number;
}
/** A scaled body: spines on the back, a lit edge, scales, and a plated belly along one side. */
function Coil({ s, fill, side = 1, belly, bellyK = [0.14, 0.5], scale, scaleK = [-0.08, -0.3], hi, spine, ol = 2.2, caps = [false, false], rung = 2 }: CoilProps) {
  const edge = outline(s, caps[0], caps[1]);
  return (
    <g>
      {spine && <path d={spinesD(s, side)} fill={spine} stroke={FG} strokeWidth="1.1" strokeLinejoin="round" />}
      <path d={edge} fill={fill} stroke={FG} strokeWidth={ol} strokeLinejoin="round" />
      {hi && <path d={band(s, -0.38 * side, -0.2 * side)} fill={hi} opacity=".55" />}
      {scale && <path d={scalesD(s, scaleK.map((k) => k * side))} fill="none" stroke={scale} strokeWidth=".9" strokeLinecap="round" />}
      {belly && (
        <>
          <path d={band(s, bellyK[0] * side, bellyK[1] * side)} fill={belly} />
          <path d={rungsD(s, bellyK[0] * side, bellyK[1] * side, rung)} stroke={dk(belly, 38)} strokeWidth=".9" />
          <path d={lineAt(s, bellyK[0] * side)} fill="none" stroke={dk(belly, 45)} strokeWidth=".8" />
        </>
      )}
      <path d={edge} fill="none" stroke={FG} strokeWidth={ol} strokeLinejoin="round" />
    </g>
  );
}

// ─── A serpent head, front view, about 32 × 36; the neck joins at (0, 15) ───
type Expr = 'stern' | 'grin' | 'sleepy' | 'tongue' | 'hiss' | 'wink' | 'shock' | 'drunk';
type EyeK = 'open' | 'narrow' | 'half' | 'round' | 'wink' | 'dizzy' | 'arc';
type MouthK = 'flat' | 'smile' | 'grin' | 'tongue' | 'hiss' | 'o' | 'wavy';
const EYES: Record<Expr, EyeK> = { stern: 'narrow', grin: 'open', sleepy: 'half', tongue: 'open', hiss: 'narrow', wink: 'wink', shock: 'round', drunk: 'dizzy' };
const MOUTHS: Record<Expr, MouthK> = { stern: 'flat', grin: 'grin', sleepy: 'flat', tongue: 'tongue', hiss: 'hiss', wink: 'smile', shock: 'o', drunk: 'wavy' };
interface HeadProps {
  x: number;
  y: number;
  a?: number;
  s?: number;
  c: string;
  c2: string;
  belly: string;
  e: Expr;
  happy: boolean;
  still: boolean;
  grad: string;
  glow: string;
  delay?: number;
}
function SnakeHead({ x, y, a = 0, s = 1, c, c2, belly, e, happy, still, grad, glow, delay = 0 }: HeadProps) {
  const ink = dk(c, 60);
  let eyes: EyeK = EYES[e];
  let mouth: MouthK = MOUTHS[e];
  const brow = e === 'stern' || e === 'hiss' ? 'angry' : e === 'shock' ? 'raised' : null;
  if (happy) {
    if (eyes !== 'wink' && eyes !== 'dizzy') eyes = 'arc';
    if (mouth === 'flat' || mouth === 'hiss' || mouth === 'o') mouth = 'smile';
  }
  const eye = (which: 'l' | 'r') => {
    const kind: EyeK = eyes === 'wink' ? (which === 'l' ? 'open' : 'arc') : eyes;
    switch (kind) {
      case 'arc':
        return <path d="M-12 -.5 Q-7 -6.5 -2 -.5" fill="none" stroke={INK} strokeWidth="2.1" strokeLinecap="round" />;
      case 'dizzy':
        return <path d="M-7 -1 m-3.4 0 a3.4 3.4 0 1 1 3.4 3.4 a2.2 2.2 0 1 1 -2.2 -2.2 a1 1 0 1 1 1 1" fill="none" stroke={INK} strokeWidth="1.2" />;
      case 'round':
        return (
          <g>
            <circle cx="-7" cy="-1" r="4" fill={c2} stroke={INK} strokeWidth=".9" filter={glow} />
            <circle cx="-7" cy="-1" r="1.3" fill={INK} />
          </g>
        );
      default: {
        const d = kind === 'narrow' ? 'M-12.5 -1 Q-7 -4.6 -1.6 -1.6 Q-7 1.6 -12.5 -1Z' : 'M-12.5 -1 Q-7 -6.5 -1.6 -1.6 Q-7 3 -12.5 -1Z';
        return (
          <g>
            <path d={d} fill={c2} stroke={INK} strokeWidth=".9" filter={glow} />
            <path d="M-7 -4.4 Q-6 -1.4 -7 1.6" fill="none" stroke={INK} strokeWidth="1.5" />
            <circle cx="-9" cy="-2.4" r=".9" fill="#fff" />
            {kind === 'half' && <path d="M-13 -1.4 Q-7 -7.4 -1.2 -1.8 L-1.6 -.8 Q-7 -2.4 -12.5 -.4Z" fill={dk(c, 18)} stroke={INK} strokeWidth=".8" />}
          </g>
        );
      }
    }
  };
  return (
    <g transform={`translate(${f1(x)} ${f1(y)}) rotate(${a}) scale(${s})`}>
      <g className={an(still, 'bgd-nod')} style={{ transformOrigin: '0px 14px', animationDelay: `${delay}s` }}>
        {[-1, 1].map((d) => (
          <path key={d} transform={d > 0 ? 'scale(-1 1)' : undefined} d="M-8 -12 C-14 -19 -14 -26 -9.5 -31 C-9 -24 -5.5 -18 -3.5 -14.5Z" fill={IVORY} stroke={FG} strokeWidth="1.3" strokeLinejoin="round" />
        ))}
        <path d="M0 -17 C10 -17 16.5 -9 16 0 C15.5 9 10 16 0 18 C-10 16 -15.5 9 -16 0 C-16.5 -9 -10 -17 0 -17Z" fill={grad} stroke={FG} strokeWidth="2" />
        {/* crown plate and cheek scales */}
        <path d="M-7 -15.5 C-3 -17.5 3 -17.5 7 -15.5 L5 -5 L0 -2 L-5 -5Z" fill={dk(c, 22)} stroke={ink} strokeWidth=".7" />
        <path d="M0 -16.5 V-3" stroke={lt(c, 25)} strokeWidth=".6" opacity=".7" />
        <path d="M-15 2 q2 2 4 0 q2 2 4 0 M15 2 q-2 2 -4 0 q-2 2 -4 0 M-13 7 q2 2 4 0 M13 7 q-2 2 -4 0" fill="none" stroke={ink} strokeWidth=".7" opacity=".8" />
        <path d="M-11 -13 C-7 -15 -3 -15.5 0 -15.6" fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity=".5" />
        <path d="M-10 9 C-6 17.5 6 17.5 10 9 C6 12.5 -6 12.5 -10 9Z" fill={belly} stroke={ink} strokeWidth=".7" />
        <ellipse cx="-3" cy="7.5" rx="1" ry=".7" fill={INK} />
        <ellipse cx="3" cy="7.5" rx="1" ry=".7" fill={INK} />
        <Eyes still={still}>
          {eye('l')}
          <g transform="scale(-1 1)">{eye('r')}</g>
        </Eyes>
        {brow === 'angry' && <path d="M-13.5 -6.5 L-3 -3.2 M13.5 -6.5 L3 -3.2" stroke={ink} strokeWidth="2.2" strokeLinecap="round" />}
        {brow === 'raised' && <path d="M-12 -8.5 Q-7 -11.5 -2 -8.5 M12 -8.5 Q7 -11.5 2 -8.5" fill="none" stroke={ink} strokeWidth="1.6" strokeLinecap="round" />}
        {mouth === 'flat' && <path d="M-6 12.6 Q0 14 6 12.6" fill="none" stroke={INK} strokeWidth="1.3" strokeLinecap="round" />}
        {mouth === 'smile' && <path d="M-7.5 11.4 Q0 17 7.5 11.4" fill="none" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />}
        {mouth === 'wavy' && <path d="M-6 12.5 q1.5 -2 3 0 t3 0 t3 0 t3 0" fill="none" stroke={INK} strokeWidth="1.3" strokeLinecap="round" />}
        {mouth === 'o' && <ellipse cx="0" cy="13" rx="2.6" ry="3" fill="#3a0a0c" stroke={INK} strokeWidth=".8" />}
        {(mouth === 'grin' || mouth === 'hiss') && (
          <g>
            <path d={mouth === 'grin' ? 'M-9.5 10.6 Q0 18.5 9.5 10.6 Q0 13.6 -9.5 10.6Z' : 'M-8 10 Q0 23 8 10 Q0 12.4 -8 10Z'} fill="#4a0b10" stroke={INK} strokeWidth="1" strokeLinejoin="round" />
            <path d={mouth === 'grin' ? 'M-5 11.9 L-4 15 L-3 12.4 M5 11.9 L4 15 L3 12.4' : 'M-5 11 L-4 17 L-2.8 11.6 M5 11 L4 17 L2.8 11.6'} fill="#fff" stroke={INK} strokeWidth=".5" />
          </g>
        )}
        {mouth === 'tongue' && (
          <g>
            <path d="M-6 12.6 Q0 14 6 12.6" fill="none" stroke={INK} strokeWidth="1.3" strokeLinecap="round" />
            <g className={an(still, 'bgd-flick')} style={{ transformOrigin: '0px 13px' }}>
              <path d="M0 13 L0 20 L-2.6 24 M0 20 L2.6 24" fill="none" stroke="#e0405a" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </g>
        )}
        {e === 'drunk' && (
          <g>
            <ellipse cx="-10.5" cy="6" rx="3.4" ry="2" fill="#ff7a8a" opacity=".75" />
            <ellipse cx="10.5" cy="6" rx="3.4" ry="2" fill="#ff7a8a" opacity=".75" />
            <circle cx="17" cy="-12" r="3" fill="none" stroke={FG} strokeWidth="1" opacity=".8" />
            <circle cx="21" cy="-17" r="1.8" fill="none" stroke={FG} strokeWidth=".9" opacity=".7" />
          </g>
        )}
        {e === 'sleepy' && !happy && (
          <text x="14" y="-12" fontSize="9" fontWeight="700" fill={FG} fontFamily="sans-serif">
            z
          </text>
        )}
      </g>
    </g>
  );
}

// ─── Genbu ──────────────────────────────────────────────────────────────────
function Genbu({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const u = (s: string) => `url(#${uid}-${s})`;
  const skin = mix(c, c2, 66);
  const domeD = 'M24 132 C20 84 56 42 100 40 C144 42 180 84 176 132 C144 150 56 150 24 132Z';
  const rimD = 'M24 132 C56 150 144 150 176 132 L178 142 C146 166 54 166 22 142Z';
  const hex: P[] = [];
  for (let k = -3; k <= 3; k++) for (const y of Math.abs(k) % 2 === 0 ? [54, 80, 106, 132] : [41, 67, 93, 119]) hex.push([100 + k * 22.5, y]);
  const rimTop = [24, 56, 144, 176];
  const rimTopY = [132, 150, 150, 132];
  const rimBot = [22, 54, 146, 178];
  const rimBotY = [142, 166, 166, 142];
  const segs = Array.from({ length: 8 }, (_, i) => (i + 1) / 9);
  const snakeBack = mk >= 2 ? tube([[24, 118], [12, 106], [9, 88], [13, 72], [22, 64]], (t) => 13 - t * 11, 18) : [];
  const snakeFront = mk >= 2 ? tube([[21, 110], [42, 123], [76, 129], [100, 129], [126, 127], [156, 119], [178, 102], [186, 80], [180, 62], [170, 54]], () => 13, 44) : [];
  const snake = mix(c2, c, 40);
  return (
    <g>
      <defs>
        <Rad id={`${uid}-shell`} a={lt(c, 30)} m={c} b={dk(c, 50)} cx={0.42} cy={0.22} r={0.9} />
        <Lin id={`${uid}-plate`} a={lt(c, 22)} m={c} b={dk(c, 30)} />
        <Rad id={`${uid}-skin`} a={lt(skin, 28)} m={skin} b={dk(skin, 40)} cx={0.4} cy={0.3} />
        <Rad id={`${uid}-vol`} a="#fff" m="rgba(255,255,255,0)" b="#000" cx={0.42} cy={0.26} r={0.75} />
        <Lin id={`${uid}-rock`} a={mix('#b9c2b5', c, 70)} m={mix('#7d8a7c', c, 70)} b={mix('#3c463e', c, 70)} />
        <Lin id={`${uid}-snake`} a={lt(snake, 15)} b={dk(snake, 30)} />
        <Glow id={`${uid}-g`} s={1.6} />
        <clipPath id={`${uid}-dome`}>
          <path d={domeD} />
        </clipPath>
        <clipPath id={`${uid}-fall`}>
          <path d="M115 28 C117 40 117 50 119 64 L127 64 C125 50 124 40 122 28Z" />
        </clipPath>
      </defs>
      <Shadow rx={mk >= 2 ? 80 : 74} />
      {/* the serpent's tail, behind the shell */}
      {mk >= 2 && <Coil s={snakeBack} fill={u('snake')} side={1} scale={dk(snake, 45)} belly={lt(c2, 25)} bellyK={[0.14, 0.5]} hi={lt(snake, 45)} />}
      <g className={an(still, 'bgd-bob')} style={origin(100, 180)}>
        {/* front legs: stout columns with scale armour and ivory claws */}
        {[0, 1].map((m) => (
          <g key={m} transform={m ? MIRROR : undefined}>
            <path d="M28 138 C26 156 30 170 27 181 Q45 188 64 181 C61 168 63 152 66 138Z" fill={u('skin')} {...OL} />
            <path d="M33 150 q5 4 10 0 q5 4 10 0 q4 4 9 0 M31 162 q5 4 10 0 q5 4 10 0 q4 4 9 0 M31 173 q5 3 10 0 q5 3 10 0 q4 3 9 0" fill="none" stroke={dk(skin, 40)} strokeWidth=".9" />
            <polygon points={hexPts(47, 150, 7.5)} fill={u('plate')} stroke={FG} strokeWidth="1.3" />
            <polygon points={hexPts(47, 150, 4)} fill="none" stroke={GOLD} strokeWidth=".8" />
            <path d="M29 142 C30 158 32 170 30 180" fill="none" stroke="#fff" strokeWidth="1.4" opacity=".3" />
            <path d="M58 140 C56 156 58 168 57 180 L63 180 C61 168 62 154 65 140Z" fill="#000" opacity=".22" />
            {[31, 43, 55].map((x) => (
              <path key={x} d={`M${x - 3} 181 C${x - 3} 186 ${x + 3} 187 ${x + 4} 182 Z`} fill={IVORY} stroke={FG} strokeWidth="1.1" />
            ))}
          </g>
        ))}
        {/* the shell */}
        <path d={domeD} fill={dk(c, 55)} stroke={FG} strokeWidth="2.6" />
        <g clipPath={u('dome')}>
          <g filter={u('g')}>
            {hex.map(([x, y]) => (
              <polygon key={`s${x}${y}`} points={hexPts(x, y, 15)} fill="none" stroke={c2} strokeWidth="1.6" opacity=".85" />
            ))}
          </g>
          {hex.map(([x, y]) => (
            <g key={`p${x}${y}`}>
              <polygon points={hexPts(x, y, 13.3)} fill={u('plate')} stroke={dk(c, 55)} strokeWidth=".8" />
              <polygon points={hexPts(x, y - 0.8, 9)} fill="none" stroke={lt(c, 35)} strokeWidth=".7" opacity=".7" />
              <path d={`M${f1(x - 11.5)} ${f1(y - 1)} L${f1(x - 6.6)} ${f1(y - 11.5)} L${f1(x + 6.6)} ${f1(y - 11.5)}`} fill="none" stroke="#fff" strokeWidth="1" opacity=".35" />
              <circle cx={x} cy={y - 0.8} r="1.1" fill={dk(c, 40)} />
            </g>
          ))}
          <path d={domeD} fill={u('vol')} opacity=".38" />
        </g>
        <path d="M44 70 C58 52 78 44 96 44" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity=".45" />
        {/* crest of the north on the crown plate */}
        <circle cx="100" cy="80" r="10.5" fill={GOLD} stroke={GOLD_D} strokeWidth="1.2" />
        <circle cx="100" cy="80" r="8" fill={dk(c, 45)} stroke={lt(GOLD, 20)} strokeWidth=".8" />
        <text x="100" y="84.4" textAnchor="middle" fontSize="12" fontWeight="700" fontFamily={KANJI} fill={c2} filter={u('g')}>
          玄
        </text>
        {/* marginal plates of the rim, with gold trim and rivets */}
        <path d={rimD} fill={u('plate')} stroke={FG} strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M26 134.5 C58 152 142 152 174 134.5" fill="none" stroke={GOLD} strokeWidth="1.5" />
        {segs.map((s) => (
          <g key={s}>
            <path d={`M${f1(bz(rimTop, s))} ${f1(bz(rimTopY, s) + 1)} L${f1(bz(rimBot, s))} ${f1(bz(rimBotY, s))}`} stroke={dk(c, 55)} strokeWidth="1.1" />
            <circle cx={bz(rimTop, s - 0.055) * 0.5 + bz(rimBot, s - 0.055) * 0.5} cy={(bz(rimTopY, s - 0.055) + bz(rimBotY, s - 0.055)) / 2 + 1} r="1.3" fill={GOLD} stroke={GOLD_D} strokeWidth=".5" />
          </g>
        ))}
        <path d="M30 144 C60 160 140 160 170 144" fill="none" stroke={dk(c, 60)} strokeWidth="1.2" opacity=".6" />
        {/* Mk III: a little mountain, a waterfall and a shrine */}
        {mk === 3 && (
          <g>
            <path d="M44 68 C54 58 60 50 68 38 L76 42 L92 14 L100 20 L108 8 L122 30 L130 26 L156 68 C132 58 68 58 44 68Z" fill={u('rock')} />
            <path d="M44 68 C54 58 60 50 68 38 L76 42 L92 14 L100 20 L108 8 L122 30 L130 26 L156 68" fill="none" stroke={FG} strokeWidth="2" strokeLinejoin="round" />
            <path d="M48 66 C70 58 130 58 152 66 C130 62 70 62 48 66Z" fill={mix('#3f7a4a', c, 70)} opacity=".9" />
            <path d="M92 14 L86 30 L94 26 L90 44 M108 8 L104 26 L112 22 M130 26 L134 44" fill="none" stroke={dk(c, 55)} strokeWidth=".9" opacity=".7" />
            <path d="M99 19 L108 8 L117 23 L112 21 L108 26 L104 21 Z M88 21 L92 14 L97 18 L93 20Z" fill="#fff" stroke={FG} strokeWidth=".9" strokeLinejoin="round" />
            {/* pines */}
            {[
              [60, 56, 1],
              [140, 54, 0.9],
              [148, 60, 0.75],
            ].map(([x, y, s]) => (
              <g key={x} transform={`translate(${x} ${y}) scale(${s})`}>
                <path d="M0 -16 L6 -6 L3 -6 L8 2 L-8 2 L-3 -6 L-6 -6Z" fill={mix('#2f6b3f', c, 75)} stroke={FG} strokeWidth="1.1" strokeLinejoin="round" />
                <path d="M0 2 V6" stroke="#6b4423" strokeWidth="1.8" />
              </g>
            ))}
            {/* the waterfall */}
            <path d="M115 28 C117 40 117 50 119 64 L127 64 C125 50 124 40 122 28Z" fill={lt(c2, 45)} stroke={FG} strokeWidth="1" />
            <g clipPath={u('fall')}>
              <g className={an(still, 'bgd-fall')}>
                {Array.from({ length: 6 }, (_, i) => (
                  <path key={i} d={`M117 ${16 + i * 9} l3 5 M121 ${20 + i * 9} l3 5`} stroke="#fff" strokeWidth="1.1" strokeLinecap="round" opacity=".9" />
                ))}
              </g>
            </g>
            <ellipse cx="123" cy="64" rx="9" ry="3" fill="#fff" opacity=".8" />
            <circle cx="117" cy="62" r="2.4" fill="#fff" opacity=".8" />
            <circle cx="130" cy="62" r="2" fill="#fff" opacity=".7" />
            {/* the shrine: a torii and a little hall */}
            <g transform="translate(76 47)">
              <path d="M-6 -11 h12 l-1 2 h-10Z" fill="#d4302b" stroke={FG} strokeWidth=".8" />
              <path d="M-4 -9 V0 M4 -9 V0 M-5 -6.6 H5" stroke="#d4302b" strokeWidth="1.5" />
              <path d="M8 -6 L15 -11 L22 -6 Z" fill={mix('#3b3b44', c, 70)} stroke={FG} strokeWidth=".8" strokeLinejoin="round" />
              <rect x="9.5" y="-6" width="11" height="6" fill={IVORY} stroke={FG} strokeWidth=".8" />
              <rect x="13.5" y="-4" width="3" height="4" fill="#d4302b" />
              <circle cx="15" cy="-12" r="1" fill={GOLD} filter={u('g')} />
            </g>
            <ellipse cx="58" cy="64" rx="12" ry="3.2" fill="#fff" opacity=".7" />
            <ellipse cx="146" cy="64" rx="10" ry="2.8" fill="#fff" opacity=".6" />
          </g>
        )}
        {/* Mk II: the serpent, coiled across the shell */}
        {mk >= 2 && (
          <g>
            <Coil s={snakeFront} fill={u('snake')} side={1} scale={dk(snake, 45)} belly={lt(c2, 25)} bellyK={[0.14, 0.5]} hi={lt(snake, 45)} caps={[true, false]} />
            <SnakeHead x={170} y={42} a={-24} s={0.82} c={snake} c2={c2} belly={lt(c2, 25)} e="tongue" happy={happy} still={still} grad={u('snake')} glow={u('g')} />
          </g>
        )}
        {/* head */}
        <path d="M86 152 L88 128 L112 128 L114 152Z" fill={dk(skin, 30)} {...OL} />
        <path d="M76 126 C76 108 88 102 100 102 C112 102 124 108 124 126 C124 142 114 153 100 153 C86 153 76 142 76 126Z" fill={u('skin')} {...OL} />
        <path d="M75 124 C75 106 88 99 100 99 C112 99 125 106 125 124 C117 116 83 116 75 124Z" fill={u('plate')} stroke={FG} strokeWidth="2" strokeLinejoin="round" />
        <path d="M77.5 122 C86 115 114 115 122.5 122" fill="none" stroke={GOLD} strokeWidth="1.3" />
        <path d="M84 104 C90 101 96 100 100 100" fill="none" stroke="#fff" strokeWidth="1.2" opacity=".5" strokeLinecap="round" />
        <polygon points={hexPts(100, 108, 4.6)} fill={c2} stroke={FG} strokeWidth="1" filter={u('g')} />
        <path d="M80 136 q3 2 6 0 M114 136 q3 2 6 0 M82 142 q3 2 6 0 M112 142 q3 2 6 0" fill="none" stroke={dk(skin, 40)} strokeWidth=".8" />
        <Eyes still={still}>
          {happy ? (
            <path d="M83 131 Q89 124 95 131 M105 131 Q111 124 117 131" fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
          ) : (
            [89, 111].map((x) => (
              <g key={x}>
                <ellipse cx={x} cy="130" rx="6.2" ry="5.8" fill={INK} />
                <circle cx={x} cy="130" r="4.2" fill={c2} filter={u('g')} />
                <circle cx={x} cy="130.4" r="1.9" fill={INK} />
                <circle cx={x - 1.6} cy="128.2" r="1.2" fill="#fff" />
              </g>
            ))
          )}
        </Eyes>
        {happy ? (
          <path d="M88 141 Q100 152 112 141 Q100 145 88 141Z" fill="#5a1c22" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
        ) : (
          <path d="M91 143 Q100 147.5 109 143" fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
        )}
        <circle cx="97" cy="137" r=".9" fill={INK} />
        <circle cx="103" cy="137" r=".9" fill={INK} />
        {happy && <ellipse cx="81" cy="139" rx="3.4" ry="2" fill="#ff8a8a" opacity=".55" />}
        {happy && <ellipse cx="119" cy="139" rx="3.4" ry="2" fill="#ff8a8a" opacity=".55" />}
      </g>
    </g>
  );
}

// ─── Byakko ─────────────────────────────────────────────────────────────────
function Byakko({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const u = (s: string) => `url(#${uid}-${s})`;
  const shade = mix(c, '#2a3550', 70);
  const steel = mix(c2, '#dfe6f2', 45);
  const roar = mk === 3 && !happy;
  /** Stripes on the left half: x, y, length, angle, width. The right half mirrors them. */
  const stripes: [number, number, number, number, number][] = [
    [63, 66, 14, 12, 4],
    [62, 75, 15, 4, 4.2],
    [64, 84, 12, -6, 3.4],
    [76, 44, 11, 62, 3.2],
    [69, 120, 13, 6, 4.4],
    [68, 132, 15, 2, 4.6],
    [70, 145, 13, -4, 4.2],
    [37, 150, 15, -24, 5],
    [36, 162, 14, -10, 4.6],
    [40, 172, 10, 0, 4],
    [77, 152, 7, 0, 2.6],
    [77, 162, 7, 0, 2.6],
  ];
  const tail = tube([[140, 172], [164, 170], [182, 152], [184, 128], [174, 108]], (t) => 11 - t * 3, 24);
  const leaves: [number, number, number, string][] = [
    [22, 38, 20, '#e8571e'],
    [178, 30, -30, '#f29d1f'],
    [14, 118, 50, '#c9301c'],
    [188, 100, 10, '#e8571e'],
    [40, 14, -40, '#f29d1f'],
    [160, 12, 70, '#c9301c'],
    [10, 78, 0, '#f29d1f'],
    [190, 160, 30, '#c9301c'],
  ];
  return (
    <g>
      <defs>
        <Rad id={`${uid}-fur`} a={lt(c, 30)} m={c} b={shade} cx={0.4} cy={0.25} r={0.9} />
        <Lin id={`${uid}-steel`} a={lt(steel, 40)} m={steel} b={dk(steel, 35)} />
        <Lin id={`${uid}-blade`} a={lt(c2, 55)} m={c2} b={dk(c2, 30)} x2={1} y2={0} />
        <radialGradient id={`${uid}-roar`} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#fff" stopOpacity=".95" />
          <stop offset=".35" stopColor={lt(c2, 40)} stopOpacity=".55" />
          <stop offset="1" stopColor={c2} stopOpacity="0" />
        </radialGradient>
        <Glow id={`${uid}-g`} s={1.6} />
      </defs>
      {/* Mk III: the roar of light and a storm of autumn wind */}
      {mk === 3 && (
        <g>
          <circle cx="100" cy="76" r="92" fill={u('roar')} />
          <g className={an(still, 'bgd-spin')} style={origin(100, 76)}>
            {Array.from({ length: 16 }, (_, i) => (
              <path key={i} transform={`rotate(${i * 22.5} 100 76)`} d={i % 2 ? 'M98 26 L100 16 L102 26 L100 50Z' : 'M97 22 L100 6 L103 22 L100 50Z'} fill={lt(c2, 55)} opacity=".8" />
            ))}
          </g>
          <g fill="none" stroke={lt(c2, 30)} strokeLinecap="round" opacity=".8">
            <path d="M12 150 C2 112 14 72 46 56 C62 48 74 62 64 72 C58 78 50 74 52 68 M188 150 C198 112 186 72 154 56 C138 48 126 62 136 72 C142 78 150 74 148 68" strokeWidth="2.6" />
            <path d="M26 176 C14 150 18 124 30 110 C38 102 46 110 40 116 M174 176 C186 150 182 124 170 110 C162 102 154 110 160 116" strokeWidth="1.8" />
            <path d="M28 34 C48 20 76 14 100 16 M172 34 C152 20 124 14 100 16" strokeWidth="1.4" strokeDasharray="12 5 3 5" />
          </g>
        </g>
      )}
      <Shadow rx={64} />
      {/* tail, with brush-ring stripes */}
      <g className={an(still, 'bgd-sway')} style={origin(140, 172)}>
        <path d={outline(tail, false, true)} fill={u('fur')} {...OL} />
        <path d={outline(tail.slice(19), false, true)} fill={INK} />
        {tail
          .filter((_, i) => i % 4 === 2 && i < 18)
          .map((q, i) => (
            <path key={i} d={`M${at(q, 0.55)} Q${f1(q.x + q.tx * 3)} ${f1(q.y + q.ty * 3)} ${at(q, -0.55)}`} fill="none" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
          ))}
        <path d={outline(tail, false, true)} fill="none" {...OL} />
      </g>
      <g className={an(still, 'bgd-bob')} style={origin(100, 182)}>
        {/* haunches and hind paws */}
        {[0, 1].map((m) => (
          <g key={m} transform={m ? MIRROR : undefined}>
            <ellipse cx="54" cy="158" rx="25" ry="23" fill={u('fur')} {...OL} />
            <path d="M34 178 C30 172 36 168 46 168 C58 168 64 172 62 178 C60 183 38 183 34 178Z" fill={lt(c, 20)} {...OL} />
            <path d="M42 176 v5 M48 176 v5 M54 176 v5" stroke={shade} strokeWidth="1" />
          </g>
        ))}
        {/* chest */}
        <path d="M70 104 C60 128 62 158 70 180 L130 180 C138 158 140 128 130 104Z" fill={u('fur')} {...OL} />
        <path d="M84 104 C80 120 84 134 100 140 C116 134 120 120 116 104Z" fill={lt(c, 40)} stroke={shade} strokeWidth=".8" />
        <path d="M86 112 l4 6 l2 -6 l4 7 l4 -7 l4 7 l4 -7 l2 6 l4 -6" fill="none" stroke={shade} strokeWidth=".8" opacity=".7" />
        {/* front legs with gauntlets */}
        {[0, 1].map((m) => (
          <g key={m} transform={m ? MIRROR : undefined}>
            <path d="M75 132 C73 150 74 166 72 178 L95 178 C95 166 96 148 95 134Z" fill={u('fur')} {...OL} />
            <path d="M73 158 L96 158 L96 168 L73 168Z" fill={u('steel')} stroke={FG} strokeWidth="1.4" />
            <path d="M74 160 H95" stroke="#fff" strokeWidth=".8" opacity=".6" />
            <circle cx="78" cy="163" r="1.1" fill={GOLD} />
            <circle cx="91" cy="163" r="1.1" fill={GOLD} />
            <path d="M68 180 C66 172 74 170 84 170 C94 170 99 173 98 180 C96 185 70 185 68 180Z" fill={lt(c, 25)} {...OL} />
            <path d="M77 178 v5 M83.5 178 v5 M90 178 v5" stroke={shade} strokeWidth="1" />
          </g>
        ))}
        {/* breastplate with the white kanji */}
        <path d="M82 116 L118 116 L120 134 L100 150 L80 134Z" fill={u('steel')} stroke={FG} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M85 119 L115 119 L116.5 133 L100 146 L83.5 133Z" fill="none" stroke={GOLD} strokeWidth=".9" />
        <path d="M84 118 L116 118" stroke="#fff" strokeWidth="1" opacity=".7" />
        <path d="M88 122 L112 122 L113 132 L100 142 L87 132Z" fill={dk(c2, 50)} />
        <text x="100" y="137" textAnchor="middle" fontSize="13" fontWeight="700" fontFamily={KANJI} fill={lt(c2, 45)} filter={u('g')}>
          白
        </text>
        {/* brush-script stripes */}
        {[0, 1].map((m) => (
          <g key={m} transform={m ? MIRROR : undefined} fill={INK}>
            {stripes.map(([x, y, L, a, w], i) => (
              <path key={i} transform={`translate(${x} ${y}) rotate(${a})`} d={brush(L, w)} />
            ))}
          </g>
        ))}
        {/* Mk II: wind-blade pauldrons */}
        {mk >= 2 &&
          [0, 1].map((m) => (
            <g key={m} transform={m ? MIRROR : undefined}>
              <g className={an(still, m ? 'bgd-gust-r' : 'bgd-gust-l')} style={origin(64, 108)}>
                {[
                  [30, 58, 1],
                  [18, 78, 0.92],
                  [16, 100, 0.8],
                ].map(([tx, ty, s], i) => (
                  <path key={i} d={`M66 104 C${f1(56 - 6 * i)} ${f1(94 - i * 2)} ${f1(tx + 10)} ${f1(ty + 12)} ${tx} ${ty} C${f1(tx + 16)} ${f1(ty + 4)} ${f1(56 - 4 * i)} ${f1(86 + i * 4)} ${f1(70 - i * 2)} ${f1(96 + i * 4)}Z`} fill={u('blade')} stroke={FG} strokeWidth="1.4" strokeLinejoin="round" opacity={s} />
                ))}
                <g filter={u('g')}>
                  <path d="M66 104 C56 94 40 70 30 58 M64 100 C50 92 28 90 18 78 M68 100 C54 98 28 108 16 100" fill="none" stroke={lt(c2, 50)} strokeWidth="1" />
                </g>
              </g>
              <path d="M50 120 C46 104 56 94 72 96 C82 98 88 104 86 114 C76 110 62 112 50 120Z" fill={u('steel')} stroke={FG} strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M54 114 C60 106 70 103 82 106" fill="none" stroke={GOLD} strokeWidth="1" />
              <path d="M58 104 C64 100 72 99 78 100" fill="none" stroke="#fff" strokeWidth="1.1" opacity=".7" strokeLinecap="round" />
              <circle cx="68" cy="108" r="2.4" fill={c2} stroke={FG} strokeWidth=".8" filter={u('g')} />
            </g>
          ))}
        {/* cheek ruff behind the head */}
        {[0, 1].map((m) => (
          <path key={m} transform={m ? MIRROR : undefined} d="M66 62 L52 66 L60 72 L48 78 L60 82 L50 90 L64 92 L58 100 L74 98 Z" fill={lt(c, 25)} {...OL} />
        ))}
        {/* ears */}
        {[0, 1].map((m) => (
          <g key={m} transform={m ? MIRROR : undefined}>
            <path d="M64 54 C60 40 64 28 74 26 C82 28 88 36 88 44Z" fill={u('fur')} {...OL} />
            <path d="M68 48 C66 40 69 33 74 32 C79 34 82 39 82 44Z" fill={mix(c2, INK, 30)} />
            <path d="M70 46 C70 40 72 36 75 35" fill="none" stroke={lt(c, 10)} strokeWidth="1.4" strokeLinecap="round" />
            <path d="M68 32 C70 26 76 24 80 28 L76 33Z" fill={u('steel')} stroke={FG} strokeWidth="1.2" strokeLinejoin="round" />
          </g>
        ))}
        {/* head */}
        <path d="M62 70 C60 50 76 38 100 38 C124 38 140 50 138 70 C142 84 132 100 118 106 C110 110 90 110 82 106 C68 100 58 84 62 70Z" fill={u('fur')} {...OL} />
        <path d="M70 52 C78 44 90 41 100 41" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity=".6" />
        {[0, 1].map((m) => (
          <g key={m} transform={m ? MIRROR : undefined} fill={INK}>
            {stripes.slice(0, 4).map(([x, y, L, a, w], i) => (
              <path key={i} transform={`translate(${x} ${y}) rotate(${a})`} d={brush(L, w)} />
            ))}
          </g>
        ))}
        {/* the king mark, 王, in brush strokes */}
        <g fill={INK}>
          <path transform="translate(92 47) rotate(-4)" d={brush(16, 3.4)} />
          <path transform="translate(94 53.5) rotate(-3)" d={brush(12, 3)} />
          <path transform="translate(91 60) rotate(-4)" d={brush(18, 3.6)} />
          <path transform="translate(100 46) rotate(92)" d={brush(15, 3.2)} />
        </g>
        {/* muzzle */}
        <path d="M84 90 C84 81 97 80 100 87 C103 80 116 81 116 90 C116 99 107 101 100 98 C93 101 84 99 84 90Z" fill={lt(c, 45)} stroke={shade} strokeWidth="1" />
        {[88, 91, 94, 106, 109, 112].map((x, i) => (
          <circle key={x} cx={x} cy={i % 3 === 1 ? 93 : 91} r=".8" fill={INK} opacity=".7" />
        ))}
        <path d="M74 92 L58 90 M74 95 L60 98 M126 92 L142 90 M126 95 L140 98" stroke={FG} strokeWidth=".8" opacity=".7" />
        <path d="M95 85 L105 85 Q105 88 100 90.5 Q95 88 95 85Z" fill={mix(c2, INK, 35)} stroke={INK} strokeWidth=".8" />
        <path d="M97 85.8 L100 85.8" stroke="#fff" strokeWidth=".8" opacity=".7" />
        {roar ? (
          <g>
            <path d="M88 94 Q100 120 112 94 Q100 100 88 94Z" fill="#5a1220" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
            <path d="M92 96 L94 102 L96 97 M108 96 L106 102 L104 97" fill="#fff" stroke={INK} strokeWidth=".6" />
            <path d="M94 108 Q100 112 106 108 Q100 106 94 108Z" fill="#e05a6c" />
          </g>
        ) : happy ? (
          <g>
            <path d="M90 95 Q100 110 110 95 Q100 99 90 95Z" fill="#5a1220" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M95 102 Q100 106 105 102 Q100 100 95 102Z" fill="#e05a6c" />
          </g>
        ) : (
          <path d="M100 90.5 V95 M92 96 Q96 99.5 100 95 Q104 99.5 108 96" fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
        )}
        <Eyes still={still}>
          {happy ? (
            <path d="M74 73 Q83 64 93 72 M107 72 Q117 64 126 73" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          ) : (
            [0, 1].map((m) => (
              <g key={m} transform={m ? MIRROR : undefined}>
                <path d="M73 74 Q81 63 94 70 Q88 79 73 74Z" fill={c2} stroke={INK} strokeWidth="1.6" strokeLinejoin="round" filter={u('g')} />
                <path d="M84 67 Q82.6 71.5 84 76" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
                <circle cx="80" cy="69.5" r="1.1" fill="#fff" />
                <path d="M72 66 Q82 60 95 66" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
              </g>
            ))
          )}
        </Eyes>
      </g>
      {/* Mk III: the roar, rolling out as waves of light */}
      {roar && (
        <g filter={u('g')} className={an(still, 'bgd-pulse')} style={origin(100, 100)}>
          {[0, 1].map((m) => (
            <path key={m} transform={m ? MIRROR : undefined} d="M52 84 C46 92 46 104 52 112 M44 78 C36 90 36 106 44 118 M36 72 C26 88 26 108 36 124" fill="none" stroke={lt(c2, 45)} strokeWidth="2.2" strokeLinecap="round" />
          ))}
        </g>
      )}
      {/* Mk III: maple leaves riding the wind */}
      {mk === 3 &&
        leaves.map(([x, y, a, col], i) => (
          <g key={i} className={an(still, 'bgd-leaf')} style={origin(x, y, -i * 0.7)}>
            <path transform={`translate(${x} ${y}) rotate(${a}) scale(1.1)`} d={MAPLE} fill={col} stroke={FG} strokeWidth=".8" strokeLinejoin="round" />
          </g>
        ))}
    </g>
  );
}

// ─── Suzaku ─────────────────────────────────────────────────────────────────
function Suzaku({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const u = (s: string) => `url(#${uid}-${s})`;
  const FIRE = '#ff7a1a';
  const wingBlades: [number, number, number, number][] = [
    [80, 92, 64, 122],
    [80, 99, 68, 113],
    [80, 106, 64, 104],
    [82, 113, 56, 96],
  ];
  const fire: [number, number][] = [
    [190, 80],
    [204, 86],
    [218, 92],
    [232, 94],
    [246, 90],
    [258, 80],
  ];
  /** A sweep of ribbons that stay together, like one long tail. */
  const streamers = [-12, -3, 6].map((o, i) =>
    tube(
      [
        [104, 146 + o * 0.3],
        [126, 160 + o * 0.7],
        [152, 168 + o * 0.8],
        [172, 160 + o * 0.7 + i * 2],
        [184 - i * 3, 142 + o * 0.5 + i * 4],
      ],
      (t) => (10 - i) * (1 - t) + 2,
      30,
    ),
  );
  return (
    <g>
      <defs>
        <Rad id={`${uid}-body`} a={lt(c, 30)} m={c} b={dk(c, 40)} cx={0.4} cy={0.25} />
        <Lin id={`${uid}-gold`} a={lt(GOLD, 40)} m={GOLD} b={GOLD_D} />
        <linearGradient id={`${uid}-feather`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={dk(c, 15)} />
          <stop offset=".75" stopColor={c} />
          <stop offset="1" stopColor={c2} />
        </linearGradient>
        <linearGradient id={`${uid}-flame`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={c} />
          <stop offset=".5" stopColor={FIRE} />
          <stop offset="1" stopColor={lt(c2, 30)} />
        </linearGradient>
        <radialGradient id={`${uid}-sun`} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#fffbe8" />
          <stop offset=".6" stopColor={c2} />
          <stop offset="1" stopColor={FIRE} />
        </radialGradient>
        <Glow id={`${uid}-g`} s={1.6} />
        <Soft id={`${uid}-soft`} s={5} />
      </defs>
      {/* Mk III: the sun disc and wings of fire */}
      {mk === 3 && (
        <g>
          <g className={an(still, 'bgd-spin')} style={origin(104, 52)}>
            {Array.from({ length: 24 }, (_, i) => (
              <path key={i} transform={`rotate(${i * 15} 104 52)`} d={i % 2 ? 'M102.2 11 L104 4 L105.8 11Z' : 'M101.6 14 L104 4 L106.4 14Z'} fill={c2} opacity=".9" />
            ))}
          </g>
          <circle cx="104" cy="52" r="40" fill={c2} opacity=".5" filter={u('soft')} />
          <circle cx="104" cy="52" r="36" fill={u('sun')} stroke={FG} strokeWidth="1.6" />
          <circle cx="104" cy="52" r="31" fill="none" stroke="#fff" strokeWidth=".9" opacity=".7" strokeDasharray="2 3" />
          {[0, 1].map((m) => (
            <g key={m} transform={m ? MIRROR : undefined}>
              <g className={an(still, 'bgd-flap')} style={origin(84, 96)}>
                {fire.map(([a, L], i) => (
                  <path key={i} transform={`translate(84 96) rotate(${a})`} d={curved(L, 13 - i * 0.6, 0.9)} fill={u('flame')} stroke={FG} strokeWidth="1.3" strokeLinejoin="round" />
                ))}
                {fire.map(([a, L], i) => (
                  <path key={`i${i}`} transform={`translate(84 96) rotate(${a + 3})`} d={curved(L * 0.68, 6, 0.6)} fill={lt(c2, 35)} opacity=".85" />
                ))}
                <g filter={u('g')}>
                  {[
                    [14, 30, 1.6],
                    [26, 18, 1.2],
                    [8, 58, 1.3],
                    [40, 10, 1],
                    [20, 92, 1.1],
                  ].map(([x, y, r]) => (
                    <circle key={x} cx={x} cy={y} r={r} fill="#fff3b0" />
                  ))}
                </g>
              </g>
            </g>
          ))}
        </g>
      )}
      <Shadow rx={mk >= 2 ? 66 : 46} />
      {/* Mk II: long tail streamers */}
      {mk >= 2 &&
        [0, 1].map((m) => (
          <g key={m} transform={m ? MIRROR : undefined}>
            {streamers.map((s, i) => (
              <g key={i} className={an(still, 'bgd-sway')} style={origin(104, 150, -i * 0.5 - m * 0.8)}>
                <path transform={`translate(${f1(s[29].x)} ${f1(s[29].y)}) rotate(${f1((Math.atan2(s[29].ty, s[29].tx) * 180) / Math.PI)})`} d={blade(10, 4.5)} fill={u('flame')} stroke={FG} strokeWidth="1.3" strokeLinejoin="round" />
                <path d={band(s, 0.5, -0.5)} fill={u('feather')} stroke={FG} strokeWidth="1.6" strokeLinejoin="round" />
                <path d={rungsD(s, 0.45, -0.45, 2)} stroke={lt(c, 30)} strokeWidth=".7" opacity=".7" />
                <path d={lineAt(s.slice(1, 29), 0)} fill="none" stroke={c2} strokeWidth="1.3" />
              </g>
            ))}
          </g>
        ))}
      <g className={an(still, 'bgd-bob')} style={origin(100, 182)}>
        {/* short fan tail */}
        {[118, 90, 62].map((a) => (
          <path key={a} transform={`translate(100 146) rotate(${a})`} d={blade(40, 9)} fill={u('feather')} stroke={FG} strokeWidth="1.6" strokeLinejoin="round" />
        ))}
        {/* legs: gold greaves and talons */}
        {[0, 1].map((m) => (
          <g key={m} transform={m ? MIRROR : undefined}>
            <path d="M90 150 L88 178" stroke={FG} strokeWidth="7" strokeLinecap="round" />
            <path d="M90 150 L88 178" stroke={GOLD_D} strokeWidth="3.6" strokeLinecap="round" />
            <path d="M85.5 156 L94 156 L92.5 168 L86.5 168Z" fill={u('gold')} stroke={FG} strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M87 159 H92.5" stroke="#fff" strokeWidth=".7" opacity=".7" />
            <path d="M88 178 C84 179 80 181 78 184 M88 178 C88 181 88 183 87 186 M88 178 C92 179 95 181 97 184 M88 178 L86 174" fill="none" stroke={FG} strokeWidth="2.8" strokeLinecap="round" />
            <path d="M88 178 C84 179 80 181 78 184 M88 178 C88 181 88 183 87 186 M88 178 C92 179 95 181 97 184" fill="none" stroke={GOLD} strokeWidth="1.2" strokeLinecap="round" />
          </g>
        ))}
        {/* body with feather-scale armour */}
        <path d="M100 66 C120 70 130 96 128 124 C126 148 114 160 100 160 C86 160 74 148 72 124 C70 96 80 70 100 66Z" fill={u('body')} {...OL} />
        <g clipPath={`url(#${uid}-chest)`}>
          <clipPath id={`${uid}-chest`}>
            <path d="M100 84 C114 86 122 102 121 124 C120 142 112 152 100 152 C88 152 80 142 79 124 C78 102 86 86 100 84Z" />
          </clipPath>
          <path d="M100 84 C114 86 122 102 121 124 C120 142 112 152 100 152 C88 152 80 142 79 124 C78 102 86 86 100 84Z" fill={lt(c, 18)} />
          {[92, 102, 112, 122, 132, 142].map((y, r) => (
            <path
              key={y}
              d={Array.from({ length: 6 }, (_, i) => {
                const x = 76 + i * 9.6 + (r % 2) * 4.8;
                return `M${f1(x - 5)} ${y} Q${f1(x)} ${y + 9} ${f1(x + 5)} ${y}`;
              }).join(' ')}
              fill={lt(c, 8)}
              stroke={GOLD}
              strokeWidth=".8"
            />
          ))}
        </g>
        <path d="M100 84 C114 86 122 102 121 124 C120 142 112 152 100 152 C88 152 80 142 79 124 C78 102 86 86 100 84Z" fill="none" stroke={GOLD_D} strokeWidth="1.2" />
        {/* the sun emblem */}
        <circle cx="100" cy="112" r="11" fill={u('gold')} stroke={FG} strokeWidth="1.5" />
        {Array.from({ length: 8 }, (_, i) => (
          <path key={i} transform={`rotate(${i * 45} 100 112)`} d="M100 99.5 L101.6 102 L98.4 102Z" fill={GOLD_D} />
        ))}
        <circle cx="100" cy="112" r="8" fill={dk(c, 30)} stroke={lt(GOLD, 30)} strokeWidth=".8" />
        <text x="100" y="116.4" textAnchor="middle" fontSize="12" fontWeight="700" fontFamily={KANJI} fill={c2} filter={u('g')}>
          朱
        </text>
        {/* folded wings: an armoured cape of blades */}
        {[0, 1].map((m) => (
          <g key={m} transform={m ? MIRROR : undefined}>
            {wingBlades.map(([x, y, L, a], i) => (
              <path key={i} transform={`translate(${x} ${y}) rotate(${a})`} d={curved(L, 8.5, 0.5)} fill={u('feather')} stroke={FG} strokeWidth="1.5" strokeLinejoin="round" />
            ))}
            {wingBlades.map(([x, y, L, a], i) => (
              <path key={`h${i}`} transform={`translate(${x} ${y}) rotate(${a})`} d={`M6 -2 L${L - 12} -1`} stroke={lt(c, 45)} strokeWidth=".9" opacity=".7" />
            ))}
            <path d="M72 84 C84 76 94 82 94 94 C90 106 80 110 70 114 C66 102 66 90 72 84Z" fill={u('body')} stroke={FG} strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M74 88 C82 83 89 86 90 93 C86 101 79 104 72 107" fill="none" stroke={GOLD} strokeWidth="1.2" />
            <path d="M76 95 q4 -3 7 0 q-1 4 -4 3" fill="none" stroke={GOLD} strokeWidth=".9" />
            <path d="M74 86 C78 83 82 82 85 82" fill="none" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" opacity=".6" />
          </g>
        ))}
        {/* neck with collar rings */}
        <path d="M92 80 C88 64 94 52 102 46 L114 50 C108 58 107 68 110 80Z" fill={u('body')} {...OL} />
        <path d="M91 72 Q100 76 110 72 M90.5 64 Q100 68 108.5 64" fill="none" stroke={GOLD} strokeWidth="2" />
        <path d="M91 72 Q100 76 110 72 M90.5 64 Q100 68 108.5 64" fill="none" stroke={GOLD_D} strokeWidth=".6" />
        {/* head in profile, under a crested helm */}
        <g className={an(still, 'bgd-peck')} style={origin(102, 50)}>
          <g transform="translate(104 36)">
            {[
              [196, 40, 6],
              [210, 46, 6.5],
              [224, 36, 5.5],
            ].map(([a, L, w], i) => (
              <path key={i} transform={`translate(-6 -12) rotate(${a})`} d={blade(L, w)} fill={u('feather')} stroke={FG} strokeWidth="1.4" strokeLinejoin="round" />
            ))}
            <path transform="translate(-12 6) rotate(160)" d={blade(16, 4)} fill={u('feather')} stroke={FG} strokeWidth="1.2" />
            <path transform="translate(-12 9) rotate(146)" d={blade(13, 3.5)} fill={u('feather')} stroke={FG} strokeWidth="1.2" />
            <path d="M-14 2 C-14 -10 -4 -16 6 -14 C14 -12 18 -6 18 0 C18 8 12 14 2 14 C-8 14 -14 10 -14 2Z" fill={u('body')} stroke={FG} strokeWidth="2" />
            <path d="M-15 3 C-16 -11 -4 -19 8 -17 C16 -15 21 -9 21 -2 L9 -4.5 C3 -4.5 -3 -1 -7 6Z" fill={u('gold')} stroke={FG} strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M-12 1 C-12 -9 -3 -14.5 7 -13.5" fill="none" stroke="#fff" strokeWidth="1.1" opacity=".7" strokeLinecap="round" />
            <path d="M8 -17 L6 -26 L13 -16Z" fill={u('gold')} stroke={FG} strokeWidth="1.1" strokeLinejoin="round" />
            <circle cx="2" cy="-9" r="2.2" fill={c2} stroke={FG} strokeWidth=".8" filter={u('g')} />
            {/* beak */}
            <path d="M15 -4 C25 -5 33 -1 36 5 C30 5 23 6 16 7Z" fill={u('gold')} stroke={FG} strokeWidth="1.6" strokeLinejoin="round" />
            <path transform={happy ? 'rotate(10 16 8)' : undefined} d="M16 8 C22 9 28 8 32 7.5 C28 12 22 12.5 16 11.5Z" fill={GOLD_D} stroke={FG} strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M18 -2 C24 -2.5 29 -.5 32 2.5" fill="none" stroke="#fff" strokeWidth=".9" opacity=".75" />
            <Eyes still={still}>
              {happy ? (
                <path d="M1 0 Q6.5 -6 12 -1" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
              ) : (
                <g>
                  <path d="M0 -1 Q6.5 -6.5 13 -2 Q6.5 2.5 0 -1Z" fill={c2} stroke={INK} strokeWidth="1.1" filter={u('g')} />
                  <circle cx="7.5" cy="-2" r="1.7" fill={INK} />
                  <circle cx="6.6" cy="-2.9" r=".6" fill="#fff" />
                </g>
              )}
            </Eyes>
            <path d="M0 -1 C-5 -1 -9 -4 -13 -9 M1 1 C-3 3 -7 2 -11 0" fill="none" stroke={c2} strokeWidth="1.4" strokeLinecap="round" />
          </g>
        </g>
      </g>
    </g>
  );
}

// ─── Seiryū ─────────────────────────────────────────────────────────────────
function DragonLeg({ x, y, a, s = 1, fill, fin, claw = IVORY, n = 4 }: { x: number; y: number; a: number; s?: number; fill: string; fin: string; claw?: string; n?: number }) {
  const claws = Array.from({ length: n }, (_, i) => -6 + (12 / (n - 1)) * i);
  return (
    <g transform={`translate(${x} ${y}) rotate(${a}) scale(${s})`}>
      <path d="M5 4 C14 6 19 13 17 21 C13 17 9 15 4 15Z" fill={fin} stroke={FG} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M-6 0 C-8 10 -6 18 -3 24 L6 24 C6 16 8 8 6 0Z" fill={fill} stroke={FG} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M-4 6 q3 2 6 0 M-4 12 q3 2 6 0 M-3 18 q3 2 6 0" fill="none" stroke="#000" strokeWidth=".7" opacity=".3" />
      <ellipse cx="1.5" cy="26" rx="7" ry="4.6" fill={fill} stroke={FG} strokeWidth="1.6" />
      {claws.map((cx) => (
        <path key={cx} transform={`translate(${f1(1.5 + cx)} 29) rotate(${f1(cx * 2)})`} d="M-1.6 0 C-1.6 3 -.6 6 1.4 8 C1.4 5 1.8 2 1.6 0Z" fill={claw} stroke={FG} strokeWidth=".8" strokeLinejoin="round" />
      ))}
    </g>
  );
}
function Seiryu({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const u = (s: string) => `url(#${uid}-${s})`;
  const pts: P[] = [[84, 56], [108, 64], [128, 82], [132, 104], [116, 120], [90, 122], [64, 124], [48, 140], [56, 162], [86, 172], [124, 172], [156, 160], [176, 140], [184, 116], [178, 96]];
  const more: P[] = [[178, 78], [166, 62], [150, 60], [146, 74]];
  const all = mk >= 2 ? [...pts.slice(0, -2), [182, 116] as P, ...more] : pts;
  const N = mk >= 2 ? 64 : 52;
  const body = tube(all, (t) => (t < 0.62 ? 20 - Math.max(0, 0.08 - t) * 50 : Math.max(0, 20 * (1 - (t - 0.62) / 0.38))), N);
  const tip = body[N - 3];
  const tipA = (Math.atan2(tip.ty, tip.tx) * 180) / Math.PI;
  const belly = mix(c2, '#f6efd2', 45);
  return (
    <g>
      <defs>
        <Rad id={`${uid}-scale`} a={lt(c, 25)} m={c} b={dk(c, 35)} cx={0.4} cy={0.3} />
        <Rad id={`${uid}-cloud`} a="#fff" m={lt(c2, 55)} b={lt(c2, 10)} cx={0.4} cy={0.25} r={0.9} />
        <Rad id={`${uid}-storm`} a="#6b7486" m="#434a5a" b="#262a35" cx={0.4} cy={0.3} r={0.9} />
        <radialGradient id={`${uid}-pearl`} cx=".38" cy=".32" r=".7">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".5" stopColor={lt(c2, 30)} />
          <stop offset="1" stopColor={c2} />
        </radialGradient>
        <Lin id={`${uid}-horn`} a={IVORY} m="#e8d7a8" b="#a68b4f" />
        <Glow id={`${uid}-g`} s={1.7} />
      </defs>
      {/* Mk III: thunderclouds */}
      {mk === 3 && (
        <g>
          <g className={an(still, 'bgd-drift')} style={origin(100, 20)}>
            {[
              [44, 26, 0.95],
              [158, 25, 0.95],
              [100, 19, 0.75],
            ].map(([x, y, s]) => (
              <g key={x} transform={`translate(${x} ${y}) scale(${s})`}>
                <path d={CLOUD} fill={u('storm')} stroke={FG} strokeWidth={1.6 / s} strokeLinejoin="round" />
                <path d={CLOUD_CURL} fill="none" stroke="#8a93a6" strokeWidth={1 / s} strokeLinecap="round" />
              </g>
            ))}
          </g>
          <g filter={u('g')} className={an(still, 'bgd-flash')} transform="translate(0 8)">
            <path d="M150 24 L142 40 L150 40 L138 60 L156 36 L148 36 L156 24Z" fill="#fff6a6" stroke="#ffd84a" strokeWidth=".8" strokeLinejoin="round" />
            <path d="M42 28 L36 40 L42 40 L34 54 L48 37 L42 37 L48 28Z" fill="#fff6a6" stroke="#ffd84a" strokeWidth=".8" strokeLinejoin="round" />
          </g>
          {[0, 1].map((k) => (
            <g key={k} className={an(still, 'bgd-rain')} style={origin(100, 100, -k * 0.6)}>
              {Array.from({ length: 14 }, (_, i) => {
                const x = 12 + ((i * 53 + k * 29) % 178);
                const y = 36 + ((i * 37 + k * 61) % 120);
                return <path key={i} d={`M${x} ${y} l-3 9`} stroke={lt(c2, 20)} strokeWidth="1.2" strokeLinecap="round" opacity=".75" />;
              })}
            </g>
          ))}
        </g>
      )}
      <Shadow rx={70} />
      {/* the cloud the dragon coils through */}
      <g transform="translate(104 146) scale(1.25)">
        <path d={CLOUD} fill={u('cloud')} stroke={FG} strokeWidth="1.4" strokeLinejoin="round" />
        <path d={CLOUD_CURL} fill="none" stroke={c2} strokeWidth=".9" strokeLinecap="round" />
      </g>
      <g className={an(still, 'bgd-bob')} style={origin(100, 170)}>
        {/* far legs */}
        <DragonLeg x={126} y={82} a={24} s={0.85} fill={dk(c, 25)} fin={dk(c2, 20)} />
        <Coil s={body} fill={u('scale')} side={1} belly={belly} bellyK={[0.12, 0.5]} scale={dk(c, 45)} scaleK={[-0.04, -0.24]} hi={lt(c, 40)} spine={c2} />
        <path transform={`translate(${f1(tip.x)} ${f1(tip.y)}) rotate(${f1(tipA)})`} d="M0 0 C6 -10 14 -12 22 -8 C14 -6 10 -2 12 2 C16 2 20 6 20 10 C12 8 6 6 0 0Z" fill={c2} stroke={FG} strokeWidth="1.4" strokeLinejoin="round" />
        {/* near legs */}
        <DragonLeg x={56} y={146} a={46} s={0.95} fill={u('scale')} fin={c2} />
        <DragonLeg x={114} y={70} a={34} s={0.95} fill={u('scale')} fin={c2} />
        {/* Mk II: the wish pearl, held in the front claw */}
        {mk >= 2 && (
          <g className={an(still, 'bgd-pulse')} style={origin(104, 104)}>
            <path d="M104 110 C92 108 92 92 100 86 C100 92 104 94 106 90 C110 96 114 92 113 86 C120 94 116 110 104 110Z" fill={c2} opacity=".55" filter={u('g')} />
            <circle cx="104" cy="102" r="7.5" fill={u('pearl')} stroke={FG} strokeWidth="1.4" />
            <path d="M100 99 q2 -3 5 -2" fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
          </g>
        )}
        {mk >= 2 && <path d="M98 96 C100 92 104 92 108 95 M97 100 C95 104 96 108 99 110" fill="none" stroke={IVORY} strokeWidth="2" strokeLinecap="round" />}
        {/* a wisp of cloud in front, so it really goes through */}
        <g transform="translate(46 158) scale(.62)">
          <path d={CLOUD} fill={u('cloud')} stroke={FG} strokeWidth="2" strokeLinejoin="round" />
          <path d={CLOUD_CURL} fill="none" stroke={c2} strokeWidth="1.3" strokeLinecap="round" />
        </g>
        <g transform="translate(150 176) scale(.5)">
          <path d={CLOUD} fill={u('cloud')} stroke={FG} strokeWidth="2.4" strokeLinejoin="round" />
        </g>
        {/* head, in profile, looking left */}
        <g className={an(still, 'bgd-nod')} style={origin(84, 58)}>
          <g transform="translate(66 50)">
            {/* mane */}
            {[
              [-30, 22, 5],
              [-8, 26, 6],
              [14, 24, 6],
              [36, 20, 5],
              [58, 16, 4],
            ].map(([a, L, w], i) => (
              <path key={i} transform={`translate(10 -6) rotate(${a})`} d={blade(L, w)} fill={i % 2 ? lt(c2, 20) : c2} stroke={FG} strokeWidth="1.3" strokeLinejoin="round" />
            ))}
            {/* horns: antlers swept back */}
            {[0, 1].map((k) => (
              <g key={k} transform={k ? 'translate(-6 1)' : undefined} opacity={k ? 1 : 0.85}>
                <path d="M4 -14 C10 -24 18 -32 30 -40 C22 -30 18 -22 12 -12Z" fill={u('horn')} stroke={FG} strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M18 -26 C16 -32 16 -36 18 -42 C20 -36 22 -32 22 -28Z" fill={u('horn')} stroke={FG} strokeWidth="1.1" strokeLinejoin="round" />
              </g>
            ))}
            {/* skull and snout */}
            <path d="M18 -12 C10 -22 -8 -22 -14 -15 L-30 -10 C-40 -9 -43 -1 -40 4 L-16 7 C-8 7 6 10 18 8 Z" fill={u('scale')} stroke={FG} strokeWidth="2" strokeLinejoin="round" />
            <path transform={happy ? 'rotate(-4 -14 8)' : undefined} d="M-14 8 L-34 12 C-30 20 -14 22 4 18 C12 16 18 12 18 8Z" fill={dk(c, 10)} stroke={FG} strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M-32 13 C-26 17 -14 18 0 16" fill="none" stroke={belly} strokeWidth="2" />
            <path d="M-30 8 L-28 12.5 L-26 8.4 M-22 8.6 L-20.5 12 L-19 8.8" fill="#fff" stroke={INK} strokeWidth=".5" />
            {happy && <path d="M-36 7 Q-26 12 -16 8" fill="none" stroke={INK} strokeWidth="1.2" strokeLinecap="round" />}
            <circle cx="-37" cy="-3" r="5" fill={lt(c, 15)} stroke={FG} strokeWidth="1.4" />
            <path d="M-39 -2 q2 2 4 0" fill="none" stroke={INK} strokeWidth="1.2" strokeLinecap="round" />
            <path d="M-8 -19 C-2 -21 6 -20 12 -16" fill="none" stroke="#fff" strokeWidth="1.2" opacity=".55" strokeLinecap="round" />
            <path d="M-26 -9 q3 -2 6 0 M-20 -5 q3 -2 6 0 M2 -4 q3 -2 6 0 M8 0 q3 -2 6 0" fill="none" stroke={dk(c, 45)} strokeWidth=".8" />
            {/* flame brow and eye */}
            <path d="M-16 -15 C-10 -22 0 -26 12 -26 C4 -22 -2 -17 -6 -12Z" fill={c2} stroke={FG} strokeWidth="1.2" strokeLinejoin="round" />
            <Eyes still={still}>
              {happy ? (
                <path d="M-14 -9 Q-8 -15 -2 -9" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
              ) : (
                <g>
                  <path d="M-15 -9 Q-8 -16 -1 -10 Q-8 -4 -15 -9Z" fill={c2} stroke={INK} strokeWidth="1.1" filter={u('g')} />
                  <path d="M-8 -14 Q-9 -10 -8 -6" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
                  <circle cx="-10.5" cy="-11.5" r=".8" fill="#fff" />
                </g>
              )}
            </Eyes>
            {/* jaw fin and beard */}
            <path d="M12 6 C20 10 26 16 26 24 C20 20 14 18 8 16Z" fill={c2} stroke={FG} strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M-10 19 C-12 26 -8 30 -4 34 C-2 28 0 24 0 18Z" fill={lt(c2, 25)} stroke={FG} strokeWidth="1.1" strokeLinejoin="round" />
            {/* whiskers, flowing */}
            <g className={an(still, 'bgd-whisk')} style={{ transformOrigin: '-38px 0px' }}>
              <path d="M-40 -1 C-52 -10 -60 4 -55 18 C-52 30 -58 38 -64 34" fill="none" stroke={FG} strokeWidth="2.8" strokeLinecap="round" />
              <path d="M-40 -1 C-52 -10 -60 4 -55 18 C-52 30 -58 38 -64 34" fill="none" stroke={lt(c2, 20)} strokeWidth="1.4" strokeLinecap="round" />
              <path d="M-36 6 C-44 14 -38 30 -46 42" fill="none" stroke={FG} strokeWidth="2.4" strokeLinecap="round" />
              <path d="M-36 6 C-44 14 -38 30 -46 42" fill="none" stroke={lt(c2, 20)} strokeWidth="1.1" strokeLinecap="round" />
              {mk === 3 && (
                <g className={an(still, 'bgd-rain')} style={origin(-55, 40)}>
                  <path d="M-64 37 v8 M-62 46 v6 M-46 45 v8 M-44 55 v5 M-66 54 v6" stroke={lt(c2, 20)} strokeWidth="1.3" strokeLinecap="round" />
                </g>
              )}
            </g>
          </g>
        </g>
      </g>
    </g>
  );
}

// ─── Yamata no Orochi ───────────────────────────────────────────────────────
interface OHead {
  x: number;
  y: number;
  a: number;
  s: number;
  e: Expr;
  b: P;
  bend: number;
}
const OROCHI: OHead[] = [
  { x: 100, y: 46, a: 0, s: 1.12, e: 'stern', b: [100, 150], bend: 7 },
  { x: 54, y: 72, a: -14, s: 1, e: 'grin', b: [86, 152], bend: -9 },
  { x: 146, y: 72, a: 14, s: 1, e: 'sleepy', b: [114, 152], bend: 9 },
  { x: 24, y: 110, a: -26, s: 0.9, e: 'tongue', b: [78, 156], bend: -10 },
  { x: 176, y: 108, a: 24, s: 0.9, e: 'hiss', b: [122, 156], bend: 10 },
  { x: 66, y: 31, a: -10, s: 0.82, e: 'wink', b: [93, 150], bend: -12 },
  { x: 134, y: 31, a: 10, s: 0.82, e: 'shock', b: [107, 150], bend: 12 },
  { x: 152, y: 136, a: 56, s: 0.85, e: 'drunk', b: [124, 158], bend: -6 },
];
function Orochi({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const u = (s: string) => `url(#${uid}-${s})`;
  const count = mk === 3 ? 8 : mk === 2 ? 5 : 3;
  const belly = mix(c2, '#f0c89a', 70);
  const heads = OROCHI.slice(0, count);
  const order = [5, 6, 0, 1, 2, 3, 4, 7].filter((i) => i < count);
  const necks = heads.map((h) => {
    const r = (h.a * Math.PI) / 180;
    const jx = h.x - Math.sin(r) * 14 * h.s;
    const jy = h.y + Math.cos(r) * 14 * h.s;
    const lx = (k: number) => h.b[0] + (jx - h.b[0]) * k;
    const ly = (k: number) => h.b[1] + (jy - h.b[1]) * k;
    const nx = jx - Math.sin(r) * 10;
    const ny = jy + Math.cos(r) * 10;
    return tube([h.b, [lx(0.3) + h.bend, ly(0.3)], [lx(0.62) - h.bend * 0.7, ly(0.62)], [nx, ny], [jx, jy]], (t) => 17 - t * (17 - 12 * h.s), 26);
  });
  const lower = tube([[30, 164], [36, 178], [62, 186], [100, 188], [138, 186], [164, 178], [170, 164]], (t) => 18 - 4 * Math.pow(Math.abs(t - 0.5) * 2, 3), 40);
  const upper = tube([[50, 152], [56, 163], [78, 170], [100, 172], [122, 170], [144, 163], [150, 152]], (t) => 16 - 3 * Math.pow(Math.abs(t - 0.5) * 2, 3), 34);
  const tail = tube([[40, 176], [22, 178], [12, 166], [16, 152]], (t) => 12 * (1 - t) + 1.5, 16);
  return (
    <g>
      <defs>
        <Rad id={`${uid}-scale`} a={lt(c, 28)} m={c} b={dk(c, 40)} cx={0.38} cy={0.28} />
        <Lin id={`${uid}-wood`} a="#d9a066" m="#b87a3e" b="#7a4a22" x2={1} y2={0} />
        <Lin id={`${uid}-steel`} a="#ffffff" m="#c9d2de" b="#7d8898" x2={1} y2={0} />
        <Glow id={`${uid}-g`} s={1.4} />
      </defs>
      <Shadow rx={76} />
      {/* the mound of coils behind */}
      <path d="M28 178 C24 150 60 134 100 134 C140 134 176 150 172 178Z" fill={u('scale')} {...OL} />
      <path d={`M40 160 q6 -4 12 0 q6 -4 12 0 M136 160 q6 -4 12 0 q6 -4 12 0 M60 146 q6 -4 12 0 q6 -4 12 0 q6 -4 12 0 q6 -4 12 0 q6 -4 12 0 q6 -4 12 0`} fill="none" stroke={dk(c, 45)} strokeWidth=".9" />
      {/* necks */}
      <g className={an(still, 'bgd-bob')} style={origin(100, 160)}>
        {order.map((i) => (
          <g key={i} className={an(still, 'bgd-sway-s')} style={origin(OROCHI[i].b[0], OROCHI[i].b[1], -i * 0.45)}>
            <Coil s={necks[i]} fill={u('scale')} side={1} belly={belly} bellyK={[-0.15, 0.15]} scale={dk(c, 45)} scaleK={[-0.33, 0.33]} hi={lt(c, 40)} ol={2} rung={3} />
            <SnakeHead x={OROCHI[i].x} y={OROCHI[i].y} a={OROCHI[i].a} s={OROCHI[i].s} c={c} c2={c2} belly={belly} e={OROCHI[i].e} happy={happy} still={still} grad={u('scale')} glow={u('g')} delay={-i * 0.45} />
          </g>
        ))}
      </g>
      {/* Mk III: a tail with the sword glinting in it */}
      {mk === 3 && (
        <g>
          <g transform="translate(22 154) rotate(-22)">
            <path d="M-2 0 L-2 -50 L0 -56 L2 -50 L2 0Z" fill={u('steel')} stroke={FG} strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M0 -2 V-52" stroke="#fff" strokeWidth=".6" />
            <rect x="-5" y="0" width="10" height="2.6" rx="1" fill={GOLD} stroke={FG} strokeWidth=".8" />
            <path d="M-1.6 2.6 h3.2 v9 h-3.2Z" fill="#3a2a5a" stroke={FG} strokeWidth=".8" />
          </g>
          <g className={an(still, 'bgd-glint')} style={origin(6, 104)}>
            <path d="M6 96 L7.4 102.6 L14 104 L7.4 105.4 L6 112 L4.6 105.4 L-2 104 L4.6 102.6Z" fill="#fff" filter={u('g')} />
          </g>
          <Coil s={tail} fill={u('scale')} side={-1} belly={belly} bellyK={[0.1, 0.5]} scale={dk(c, 45)} />
        </g>
      )}
      {/* front coils */}
      <Coil s={upper} fill={u('scale')} side={-1} belly={belly} bellyK={[0.2, 0.5]} scale={dk(c, 45)} scaleK={[-0.04, -0.28]} hi={lt(c, 40)} caps={[true, true]} rung={3} />
      <Coil s={lower} fill={u('scale')} side={-1} belly={belly} bellyK={[0.2, 0.5]} scale={dk(c, 45)} scaleK={[-0.04, -0.28]} hi={lt(c, 40)} caps={[true, true]} rung={3} />
      {/* Mk III: a barrel of sake for the thirsty one */}
      {mk === 3 && (
        <g transform="translate(176 168)">
          <path d="M-14 -16 C-16 -6 -16 6 -14 14 L14 14 C16 6 16 -6 14 -16Z" fill={u('wood')} {...OL} />
          <ellipse cx="0" cy="-16" rx="14" ry="3.6" fill="#e4b47a" stroke={FG} strokeWidth="1.6" />
          <ellipse cx="0" cy="-16" rx="10" ry="2.2" fill="#f7f0dc" />
          <path d="M-15 -8 H15 M-15.6 6 H15.6" stroke="#3b2a1a" strokeWidth="2.2" />
          <path d="M-8 -12 V12 M8 -12 V12" stroke="#6b4423" strokeWidth=".7" opacity=".6" />
          <rect x="-7" y="-6" width="14" height="11" fill={IVORY} stroke={FG} strokeWidth=".8" />
          <text x="0" y="3" textAnchor="middle" fontSize="9" fontWeight="700" fontFamily={KANJI} fill="#b3261e">
            酒
          </text>
        </g>
      )}
    </g>
  );
}

// ─── Kōryū ──────────────────────────────────────────────────────────────────
function Pavilion({ x, y, s, roof, wall }: { x: number; y: number; s: number; roof: string; wall: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-18 0 H18 L16 -3 H-16Z" fill={IVORY} stroke={FG} strokeWidth="1" />
      <path d="M-12 -3 V-16 M-4 -3 V-16 M4 -3 V-16 M12 -3 V-16" stroke="#c8372d" strokeWidth="2.4" />
      <path d="M-14 -16 H14" stroke={wall} strokeWidth="2" />
      <path d="M-24 -14 C-16 -18 -12 -22 -10 -26 H10 C12 -22 16 -18 24 -14 C14 -16 -14 -16 -24 -14Z" fill={roof} stroke={FG} strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M-8 -26 V-32 H8 V-26" fill={wall} stroke={FG} strokeWidth=".9" />
      <path d="M-17 -30 C-11 -33 -8 -36 -6 -40 H6 C8 -36 11 -33 17 -30 C9 -32 -9 -32 -17 -30Z" fill={roof} stroke={FG} strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M0 -40 V-47" stroke={GOLD} strokeWidth="1.6" />
      <circle cx="0" cy="-48" r="1.6" fill={GOLD} />
    </g>
  );
}
function Koryu({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const u = (s: string) => `url(#${uid}-${s})`;
  const coil = tube([[140, 158], [166, 166], [154, 183], [100, 187], [50, 183], [28, 168], [24, 148], [32, 132], [44, 128]], (t) => (t < 0.7 ? 20 : Math.max(0, 20 * (1 - (t - 0.7) / 0.3))), 44);
  const tip = coil[41];
  const tipA = (Math.atan2(tip.ty, tip.tx) * 180) / Math.PI;
  const mane: [number, number, number][] = [
    [-160, 22, 6],
    [-140, 26, 7],
    [-118, 24, 6.5],
    [-62, 24, 6.5],
    [-40, 26, 7],
    [-20, 22, 6],
    [-180, 20, 5.5],
    [0, 20, 5.5],
    [160, 18, 5],
    [20, 18, 5],
  ];
  const five = ['#2f7fd0', '#e8361e', c, '#f1f3f6', '#2a2a33'];
  const orbs: [string, string][] = [
    ['#2f7fd0', '青'],
    ['#f1f3f6', '白'],
    ['#e8361e', '朱'],
    ['#2a2a33', '玄'],
  ];
  return (
    <g>
      <defs>
        <Rad id={`${uid}-gold`} a={lt(c, 45)} m={c} b={dk(c, 40)} cx={0.38} cy={0.25} r={0.9} />
        <Lin id={`${uid}-plate`} a={lt(GOLD, 45)} m={GOLD} b={GOLD_D} />
        <Lin id={`${uid}-belly`} a={lt(c2, 30)} b={mix(c2, c, 70)} x2={1} y2={0} />
        <Lin id={`${uid}-horn`} a="#fffdf3" m={IVORY} b="#b8975a" />
        <radialGradient id={`${uid}-halo`} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#fff" stopOpacity=".95" />
          <stop offset=".5" stopColor={c2} stopOpacity=".6" />
          <stop offset="1" stopColor={c} stopOpacity="0" />
        </radialGradient>
        {orbs.map(([col], i) => (
          <Rad key={i} id={`${uid}-o${i}`} a={lt(col, 55)} m={col} b={dk(col, 45)} cx={0.36} cy={0.3} r={0.8} />
        ))}
        <Glow id={`${uid}-g`} s={1.8} />
        <Soft id={`${uid}-soft`} s={4} />
      </defs>
      {/* Mk III: the palace of clouds, the five-colour halo */}
      {mk === 3 && (
        <g>
          <circle cx="100" cy="60" r="96" fill={u('halo')} />
          <g className={an(still, 'bgd-spin')} style={origin(100, 60)}>
            {Array.from({ length: 30 }, (_, i) => (
              <path key={i} transform={`rotate(${i * 12} 100 60)`} d={i % 2 ? 'M99 -4 L100 -16 L101 -4 L100 10Z' : 'M98.5 0 L100 -12 L101.5 0 L100 12Z'} fill={i % 3 ? c2 : GOLD} opacity=".7" />
            ))}
          </g>
          <g opacity=".95">
            <Pavilion x={28} y={70} s={0.95} roof={u('plate')} wall={c2} />
            <Pavilion x={172} y={70} s={0.95} roof={u('plate')} wall={c2} />
            <path d="M44 66 H156 L150 62 H50Z" fill={u('plate')} stroke={FG} strokeWidth="1" />
            {[
              [36, 76, 0.8],
              [164, 76, 0.8],
              [60, 80, 0.6],
              [140, 80, 0.6],
            ].map(([x, y, s]) => (
              <g key={x} transform={`translate(${x} ${y}) scale(${s})`}>
                <path d={CLOUD} fill={lt(c2, 40)} stroke={FG} strokeWidth={1.4 / s} strokeLinejoin="round" />
                <path d={CLOUD_CURL} fill="none" stroke={c} strokeWidth={1 / s} strokeLinecap="round" />
              </g>
            ))}
          </g>
          <circle cx="100" cy="58" r="47" fill="none" stroke={GOLD} strokeWidth="1" />
          {five.map((col, i) => (
            <circle key={i} cx="100" cy="58" r="43" fill="none" stroke={col} strokeWidth="5.5" strokeDasharray="54.04 216.18" strokeDashoffset={-i * 54.04} transform="rotate(-90 100 58)" />
          ))}
          <circle cx="100" cy="58" r="40" fill="none" stroke={GOLD} strokeWidth=".9" />
          <circle cx="100" cy="58" r="46" fill="none" stroke={FG} strokeWidth=".8" opacity=".5" />
          {Array.from({ length: 10 }, (_, i) => {
            const a = (i / 10) * Math.PI * 2;
            return <circle key={i} cx={f1(100 + Math.cos(a) * 43)} cy={f1(58 + Math.sin(a) * 43)} r="1.3" fill="#fff" />;
          })}
        </g>
      )}
      {/* Mk II: a faint orbit behind */}
      {mk >= 2 && <ellipse cx="100" cy="104" rx="82" ry="82" fill="none" stroke={GOLD} strokeWidth=".8" strokeDasharray="2 5" opacity=".6" />}
      <Shadow rx={74} />
      <g className={an(still, 'bgd-bob')} style={origin(100, 182)}>
        {/* torso, upright, with belly plates */}
        <path d="M74 98 C66 124 70 152 78 176 L122 176 C130 152 134 124 126 98Z" fill={u('gold')} {...OL} />
        <path d="M78 120 q4 3 8 0 M76 132 q4 3 8 0 M77 144 q4 3 8 0 M79 156 q4 3 8 0 M114 120 q4 3 8 0 M116 132 q4 3 8 0 M115 144 q4 3 8 0 M113 156 q4 3 8 0" fill="none" stroke={dk(c, 45)} strokeWidth=".9" />
        <path d="M86 112 C83 132 84 152 88 174 L112 174 C116 152 117 132 114 112Z" fill={u('belly')} stroke={dk(c, 30)} strokeWidth="1" />
        {[122, 131, 140, 149, 158, 167].map((y) => (
          <path key={y} d={`M${86 - (y - 112) * 0.05} ${y} Q100 ${y + 3} ${114 + (y - 112) * 0.05} ${y}`} fill="none" stroke={dk(c2, 40)} strokeWidth=".9" />
        ))}
        {/* the seat of coils, and the thighs on it */}
        <Coil s={coil} fill={u('gold')} side={-1} belly={mix(c2, c, 80)} bellyK={[0.14, 0.5]} scale={dk(c, 45)} hi={lt(c, 50)} spine={c2} caps={[true, false]} />
        <path transform={`translate(${f1(tip.x)} ${f1(tip.y)}) rotate(${f1(tipA)})`} d="M0 0 C4 -10 12 -14 20 -12 C14 -8 12 -4 14 0 C18 -2 24 0 26 4 C16 6 8 6 0 0Z" fill={c2} stroke={FG} strokeWidth="1.4" strokeLinejoin="round" />
        {[0, 1].map((m) => (
          <g key={m} transform={m ? MIRROR : undefined}>
            <ellipse cx="62" cy="158" rx="21" ry="17" fill={u('gold')} {...OL} />
            <path d="M48 154 q4 3 8 0 q4 3 8 0 q4 3 8 0 M50 164 q4 3 8 0 q4 3 8 0" fill="none" stroke={dk(c, 45)} strokeWidth=".9" />
            <path d="M46 150 C50 144 56 142 62 142" fill="none" stroke="#fff" strokeWidth="1.3" opacity=".5" strokeLinecap="round" />
          </g>
        ))}
        {/* feet: five claws, as an emperor's dragon has */}
        {[0, 1].map((m) => (
          <g key={m} transform={m ? MIRROR : undefined}>
            <path d="M48 182 C46 174 52 170 62 170 C72 170 78 174 76 182Z" fill={u('gold')} {...OL} />
            {[50, 56, 62, 68, 74].map((x) => (
              <path key={x} d={`M${x - 2} 181 C${x - 2} 185 ${x} 187 ${x + 2.4} 187 C${x + 1.6} 185 ${x + 2} 183 ${x + 2} 181Z`} fill={IVORY} stroke={FG} strokeWidth=".9" strokeLinejoin="round" />
            ))}
          </g>
        ))}
        {/* arms resting on the knees */}
        {[0, 1].map((m) => (
          <g key={m} transform={m ? MIRROR : undefined}>
            <path d="M58 122 C48 128 44 136 48 140 C52 138 56 132 62 128Z" fill={c2} stroke={FG} strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M74 106 C64 112 58 124 56 136 C55 142 58 146 64 146 L72 142 C70 132 74 122 82 114Z" fill={u('gold')} {...OL} />
            <path d="M64 120 q3 2 6 0 M61 130 q3 2 6 0" fill="none" stroke={dk(c, 45)} strokeWidth=".9" />
            <path d="M58 140 L73 136 L74 142 L60 146Z" fill={u('plate')} stroke={FG} strokeWidth="1.1" />
            <ellipse cx="66" cy="148" rx="8" ry="5.5" fill={u('gold')} stroke={FG} strokeWidth="1.6" />
            {[59, 62.5, 66, 69.5, 73].map((x, i) => (
              <path key={x} transform={`translate(${x} 151) rotate(${-14 + i * 7})`} d="M-1.3 0 C-1.3 2.6 -.4 5 1.2 6.6 C1.1 4.4 1.5 2 1.3 0Z" fill={IVORY} stroke={FG} strokeWidth=".8" strokeLinejoin="round" />
            ))}
          </g>
        ))}
        {/* pauldrons and the imperial gorget */}
        {[0, 1].map((m) => (
          <g key={m} transform={m ? MIRROR : undefined}>
            <path d="M58 110 C56 98 64 90 76 92 C84 94 88 100 86 108 C78 106 66 106 58 110Z" fill={u('plate')} stroke={FG} strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M62 105 c2 -4 7 -5 9 -2 c1 3 -3 4 -4 2 M72 101 c3 -3 8 -2 8 2" fill="none" stroke={GOLD_D} strokeWidth=".9" strokeLinecap="round" />
            <path d="M62 96 C66 93 72 92 78 93" fill="none" stroke="#fff" strokeWidth="1.1" opacity=".75" strokeLinecap="round" />
            <circle cx="77" cy="100" r="1.8" fill="#3fb37f" stroke={FG} strokeWidth=".6" />
          </g>
        ))}
        <path d="M74 100 C86 94 114 94 126 100 L122 116 C112 122 88 122 78 116Z" fill={u('plate')} stroke={FG} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M78 104 C88 99 112 99 122 104 M80 113 C90 118 110 118 120 113" fill="none" stroke={GOLD_D} strokeWidth=".9" />
        {[82, 90, 110, 118].map((x) => (
          <circle key={x} cx={x} cy={x === 82 || x === 118 ? 108 : 110} r="1.1" fill={lt(GOLD, 40)} stroke={GOLD_D} strokeWidth=".4" />
        ))}
        <circle cx="100" cy="110" r="7.6" fill="#2f8f66" stroke={FG} strokeWidth="1.2" />
        <circle cx="100" cy="110" r="2.6" fill={dk('#2f8f66', 40)} />
        <circle cx="100" cy="110" r="5.6" fill="none" stroke={lt('#3fb37f', 40)} strokeWidth=".7" />
        {/* mane, horns, head */}
        <g className={an(still, 'bgd-breathe')} style={origin(100, 70)}>
          {mane.map(([a, L, w], i) => (
            <path key={i} transform={`translate(100 58) rotate(${a}) translate(20 0)`} d={blade(L, w)} fill={i % 2 ? c2 : lt(c, 25)} stroke={FG} strokeWidth="1.3" strokeLinejoin="round" />
          ))}
          {[0, 1].map((m) => (
            <g key={m} transform={m ? MIRROR : undefined}>
              <path d="M88 40 C82 30 76 20 70 6 C78 14 86 24 94 36Z" fill={u('horn')} stroke={FG} strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M80 24 C74 22 68 22 62 18 C68 26 74 28 82 28Z" fill={u('horn')} stroke={FG} strokeWidth="1.2" strokeLinejoin="round" />
              <path d="M76 16 C72 12 70 8 70 4" fill="none" stroke={FG} strokeWidth="1" />
              <path d="M76 62 C66 62 60 68 58 76 C64 72 70 70 76 70Z" fill={c2} stroke={FG} strokeWidth="1.2" strokeLinejoin="round" />
            </g>
          ))}
          <path d="M74 54 C74 38 86 32 100 32 C114 32 126 38 126 54 C126 64 122 70 116 74 L84 74 C78 70 74 64 74 54Z" fill={u('gold')} {...OL} />
          <path d="M82 40 C88 35 94 34 100 34" fill="none" stroke="#fff" strokeWidth="1.5" opacity=".6" strokeLinecap="round" />
          <path d="M90 40 q5 -3 10 0 q5 -3 10 0" fill="none" stroke={dk(c, 40)} strokeWidth=".8" />
          {/* muzzle */}
          <path d="M80 70 C80 62 90 60 100 62 C110 60 120 62 120 70 C122 82 112 92 100 92 C88 92 78 82 80 70Z" fill={u('gold')} {...OL} />
          <path d="M100 52 C97 58 96 62 96 66 M100 52 C103 58 104 62 104 66" fill="none" stroke={dk(c, 30)} strokeWidth=".9" />
          <path d="M86 70 C86 64 94 62 100 64 C106 62 114 64 114 70 C114 76 108 79 100 78 C92 79 86 76 86 70Z" fill={lt(c, 25)} stroke={dk(c, 35)} strokeWidth="1" />
          {[0, 1].map((m) => (
            <g key={m} transform={m ? MIRROR : undefined}>
              <path d="M88 71 C86 67 90 65 93 67 C95 69 93 72 91 71" fill={dk(c, 55)} stroke={INK} strokeWidth=".9" strokeLinejoin="round" />
              <path d="M85 68 C84 64 86 61 90 61" fill="none" stroke={dk(c, 35)} strokeWidth="1" strokeLinecap="round" />
            </g>
          ))}
          <path d="M92 65.5 Q100 63 108 65.5" fill="none" stroke="#fff" strokeWidth="1" opacity=".7" />
          {happy ? (
            <g>
              <path d="M85 83 Q100 96 115 83 Q100 88 85 83Z" fill="#6a1a14" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
              <path d="M89 84.4 L90.5 88 L92 85 M111 84.4 L109.5 88 L108 85" fill={IVORY} stroke={INK} strokeWidth=".5" />
            </g>
          ) : (
            <g>
              <path d="M86 84 Q100 89 114 84" fill="none" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
              <path d="M90 85.4 L91.2 89 L92.6 86 M110 85.4 L108.8 89 L107.4 86" fill={IVORY} stroke={INK} strokeWidth=".5" />
            </g>
          )}
          {/* flame brows */}
          {[0, 1].map((m) => (
            <path key={m} transform={m ? MIRROR : undefined} d="M94 52 C86 46 76 44 64 36 C68 46 78 52 90 56Z" fill={c2} stroke={FG} strokeWidth="1.2" strokeLinejoin="round" />
          ))}
          <Eyes still={still}>
            {happy ? (
              <path d="M80 60 Q88 53 96 60 M104 60 Q112 53 120 60" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
            ) : (
              [0, 1].map((m) => (
                <g key={m} transform={m ? MIRROR : undefined}>
                  <path d="M79 60 Q87 52 97 58 Q89 64 79 60Z" fill={mix(c, '#ff7a00', 45)} stroke={INK} strokeWidth="1" filter={u('g')} />
                  <ellipse cx="89" cy="58.6" rx="1.6" ry="2.8" fill={INK} />
                  <circle cx="87.8" cy="57.4" r=".8" fill="#fff" />
                  <path d="M76 56 L79.5 59.6 Q87 51.6 97.5 57.6" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              ))
            )}
          </Eyes>
          {/* the pearl on its brow */}
          <path d="M100 51 C95 49 95 42 98 39 C99 42 101 42 101 39 C105 42 105 49 100 51Z" fill={c2} opacity=".7" filter={u('g')} />
          <circle cx="100" cy="46" r="3.8" fill="#fff" stroke={GOLD_D} strokeWidth="1.2" filter={u('g')} />
          {/* beard and whiskers */}
          <path d="M88 90 C88 104 94 114 100 122 C106 114 112 104 112 90 C106 94 94 94 88 90Z" fill={c2} stroke={FG} strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M94 96 C95 104 98 110 100 116 M106 96 C105 104 102 110 100 116 M100 94 V112" fill="none" stroke={dk(c2, 30)} strokeWidth=".8" />
          {[0, 1].map((m) => (
            <g key={m} transform={m ? MIRROR : undefined}>
              <g className={an(still, 'bgd-whisk')} style={origin(82, 78, -m * 0.8)}>
                <path d="M82 78 C66 80 54 92 50 108 C47 120 38 126 28 122" fill="none" stroke={FG} strokeWidth="3" strokeLinecap="round" />
                <path d="M82 78 C66 80 54 92 50 108 C47 120 38 126 28 122" fill="none" stroke={lt(c, 40)} strokeWidth="1.5" strokeLinecap="round" />
                <path d="M84 74 C74 70 66 72 60 78" fill="none" stroke={FG} strokeWidth="2.2" strokeLinecap="round" />
                <path d="M84 74 C74 70 66 72 60 78" fill="none" stroke={lt(c, 40)} strokeWidth="1" strokeLinecap="round" />
                <circle cx="28" cy="122" r="2" fill={c2} filter={u('g')} />
              </g>
            </g>
          ))}
        </g>
      </g>
      {/* Mk II: the four guardians' orbs */}
      {mk >= 2 && (
        <g className={an(still, 'bgd-orbit')} style={origin(100, 104)}>
          {orbs.map(([col, k], i) => {
            const a = (Math.PI / 4) * (1 + 2 * i) + Math.PI;
            const x = 100 + Math.cos(a) * 82;
            const y = 104 + Math.sin(a) * 82;
            return (
              <g key={i}>
                <circle cx={f1(x)} cy={f1(y)} r="13" fill={col} opacity=".35" filter={u('soft')} />
                <circle cx={f1(x)} cy={f1(y)} r="9.5" fill={u(`o${i}`)} stroke={FG} strokeWidth="1.5" />
                <circle cx={f1(x)} cy={f1(y)} r="7.4" fill="none" stroke={GOLD} strokeWidth=".8" />
                <text x={f1(x)} y={f1(y + 3)} textAnchor="middle" fontSize="8" fontWeight="700" fontFamily={KANJI} fill={i === 1 ? '#3a4660' : '#fff'}>
                  {k}
                </text>
                <circle cx={f1(x - 3.4)} cy={f1(y - 3.6)} r="1.6" fill="#fff" opacity=".8" />
              </g>
            );
          })}
        </g>
      )}
      {/* sparkles of a mythic */}
      {mk === 3 &&
        [
          [20, 110],
          [182, 112],
          [42, 20],
          [158, 22],
          [100, 8],
        ].map(([x, y], i) => (
          <g key={i} className={an(still, 'bgd-glint')} style={origin(x, y, -i * 0.6)}>
            <path d={`M${x} ${y - 5} L${x + 1.2} ${y - 1.2} L${x + 5} ${y} L${x + 1.2} ${y + 1.2} L${x} ${y + 5} L${x - 1.2} ${y + 1.2} L${x - 5} ${y} L${x - 1.2} ${y - 1.2}Z`} fill="#fff" stroke={GOLD} strokeWidth=".6" />
          </g>
        ))}
    </g>
  );
}

export const GUARDIANS: BotRegistry = {
  genbu: { Art: Genbu, head: { x: 100, y: 100, s: 0.8 } },
  byakko: { Art: Byakko, head: { x: 100, y: 39, s: 1.25 } },
  suzaku: { Art: Suzaku, head: { x: 108, y: 20, s: 0.6 } },
  seiryu: { Art: Seiryu, head: { x: 70, y: 29, s: 0.75 } },
  orochi: { Art: Orochi, head: { x: 100, y: 27, s: 0.5 } },
  kohryu: { Art: Koryu, head: { x: 100, y: 33, s: 0.85 } },
};
