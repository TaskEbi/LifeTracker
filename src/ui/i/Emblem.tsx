import { memo, useId, type CSSProperties, type ReactNode } from 'react';
import type { Achievement, Tier } from '../../domain/progress/achievements';
import type { Glyph } from '../../domain/progress/glyphs';
import { hash } from '../../domain/progress/quests';

/** What an emblem needs to be drawn. */
export type EmblemOf = Pick<Achievement, 'id' | 'tier' | 'glyph' | 'section'>;

/**
 * An achievement's emblem as SVG (100×100): a tier frame in its metal, a field in the section's
 * colour and a glyph drawn in ink. Bronze is a milled medallion, silver a bevelled hexagon, gold an
 * eight-point star with a laurel ring, platinum a faceted crowned octagon with rays.
 * Each achievement gets its own small variation (rim marks, field pattern, stars, ribbon) seeded
 * from its id, so a wall of them doesn't look cloned. No filters: a grid of 160 stays smooth.
 */
export interface EmblemProps {
  a: EmblemOf;
  size?: number;
  locked?: boolean;
  /** Locked and secret: a question mark instead of the glyph. */
  secret?: boolean;
  /** No ribbon tails (the inspector's coin). */
  ribbon?: boolean;
  /** Only the frame's outline shape in one flat colour: the coin's edge layers and back. */
  silhouette?: string;
  className?: string;
  style?: CSSProperties;
}

/* ── geometry ─────────────────────────────────────────────────────────────── */

const R = Math.PI / 180;
const f = (n: number) => Math.round(n * 100) / 100;
const at = (r: number, deg: number, cx = 50, cy = 50): [number, number] => [f(cx + r * Math.cos(deg * R)), f(cy + r * Math.sin(deg * R))];
const pts = (p: [number, number][]) => p.map((q) => q.join(',')).join(' ');
/** A regular polygon's corners. */
const ngon = (n: number, r: number, rot: number) => Array.from({ length: n }, (_, i) => at(r, rot + (i * 360) / n));
/** A star: `n` points alternating outer and inner radius. */
const starP = (n: number, ro: number, ri: number, rot = -90, cx = 50, cy = 50) =>
  Array.from({ length: n * 2 }, (_, i) => at(i % 2 ? ri : ro, rot + (i * 180) / n, cx, cy));

const LIGHT: [number, number] = [-0.6, -0.8];
/** Bevel facets between two concentric polygons, each lit by how much it faces the top-left. */
function facets(n: number, ro: number, ri: number, rot: number) {
  const o = ngon(n, ro, rot);
  const i = ngon(n, ri, rot);
  return o.map((_, k) => {
    const k2 = (k + 1) % n;
    const mid = rot + ((k + 0.5) * 360) / n;
    const b = Math.cos(mid * R) * LIGHT[0] + Math.sin(mid * R) * LIGHT[1];
    return { p: pts([o[k], o[k2], i[k2], i[k]]), b };
  });
}

const GEAR = pts(starP(40, 48.6, 46.4, -90));
const HEX = (r: number) => pts(ngon(6, r, 0));
const OCT = (r: number, rot = 22.5) => pts(ngon(8, r, rot));
const STAR8 = pts(starP(8, 50, 39.5, -90));
const STAR8_P = starP(8, 50, 39.5, -90);
/** The gold star's points, each split into a lit and a shaded half. */
const STAR8_FACETS = STAR8_P.map((p, k) => {
  const q = STAR8_P[(k + 1) % STAR8_P.length];
  const mid = -90 + (k + 0.5) * 22.5;
  const b = Math.cos(mid * R) * LIGHT[0] + Math.sin(mid * R) * LIGHT[1];
  return { p: pts([[50, 50], p, q]), b: b + (k % 2 ? -0.35 : 0.35) };
});
const HEX_FACETS = facets(6, 49, 42.5, 0);
const OCT_FACETS = facets(8, 41.5, 36, 22.5);
const OCT_SPOKES = (
  <path
    d={ngon(8, 41.5, 22.5)
      .map((p, i) => `M${p.join(' ')}L${ngon(8, 36, 22.5)[i].join(' ')}`)
      .join('')}
    stroke="#fff"
    strokeOpacity=".4"
    strokeWidth=".6"
  />
);
const CROWN = '33,16 35.5,3.5 43,10 50,0.8 57,10 64.5,3.5 67,16';
/** Platinum's radiance: sixteen spikes, long on the back octagon's corners, none under the crown. */
const RAY_PATH = Array.from({ length: 16 }, (_, i) => {
  const a = i * 22.5;
  if (a === 270) return '';
  const long = i % 2 === 0;
  return `M${at(34, a - 5).join(' ')}L${at(long ? 50 : 47.5, a).join(' ')}L${at(34, a + 5).join(' ')}Z`;
}).join('');

/** Laurel: two branches of leaves round the lower half of the gold ring. */
const LAUREL = [0, 1].flatMap((side) =>
  Array.from({ length: 6 }, (_, i) => {
    const deg = side ? 160 - i * 15 : 20 + i * 15;
    const [x, y] = at(37, deg);
    const tilt = deg + (side ? -90 + 35 : 90 - 35);
    return { x, y, r: f(tilt) };
  }),
);

/** The field (inner) shape per tier, and the glyph's scale to fit it. */
const FIELD: Record<Tier, { el: (p: Record<string, unknown>) => ReactNode; d: string; s: number; deco: number }> = {
  bronze: { el: (p) => <circle cx="50" cy="50" r="37.5" {...p} />, d: circleD(37.5), s: 0.98, deco: 43.4 },
  silver: { el: (p) => <polygon points={HEX(39)} {...p} />, d: `M${HEX(39)}Z`, s: 0.9, deco: 45.6 },
  gold: { el: (p) => <circle cx="50" cy="50" r="32.5" {...p} />, d: circleD(32.5), s: 0.88, deco: 37 },
  platinum: { el: (p) => <polygon points={OCT(34)} {...p} />, d: `M${OCT(34)}Z`, s: 0.86, deco: 38.8 },
};
function circleD(r: number) {
  return `M${50 - r} 50a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
}

/** The frame's outer outline (for silhouettes); `rays` adds platinum's spikes. */
function outline(tier: Tier, p: Record<string, unknown>, rays = false) {
  if (tier === 'bronze') return <polygon points={GEAR} {...p} />;
  if (tier === 'silver') return <polygon points={HEX(49)} {...p} />;
  if (tier === 'gold')
    return (
      <>
        <polygon points={STAR8} {...p} />
        <circle cx="50" cy="50" r="39.5" {...p} />
      </>
    );
  return (
    <>
      {rays && <path d={RAY_PATH} {...p} />}
      <polygon points={OCT(43.5, 0)} {...p} />
      <polygon points={CROWN} {...p} />
    </>
  );
}

/* ── glyphs ───────────────────────────────────────────────────────────────── */

/** Paints for a glyph: body (light), mid tone, accent (tier metal), ink. */
interface T {
  b: string;
  m: string;
  a: string;
  k: string;
}

/** A thick outlined stroke: ink underneath, body on top. */
const tube = (t: T, d: string, w = 7) => (
  <>
    <path d={d} fill="none" strokeWidth={w + 6} />
    <path d={d} fill="none" stroke={t.b} strokeWidth={w} />
  </>
);

const GLYPH: Record<Glyph | 'secret', (t: T) => ReactNode> = {
  spark: (t) => (
    <>
      <path d="M46 18C48 38 52 44 72 48C52 52 48 58 46 80C44 58 40 52 20 48C40 44 44 38 46 18Z" />
      <path d="M68 18C69 25 71 27 78 28C71 29 69 31 68 38C67 31 65 29 58 28C65 27 67 25 68 18Z" fill={t.a} strokeWidth={2.2} />
      <path d="M70 62C71 67 72 68 77 69C72 70 71 71 70 76C69 71 68 70 63 69C68 68 69 67 70 62Z" fill={t.a} strokeWidth={2} />
    </>
  ),
  star: (t) => {
    const p = starP(5, 30, 12.5, -90, 50, 53);
    return (
      <>
        <polygon points={pts(p)} />
        <path d={p.filter((_, i) => i % 2 === 0).map((q) => `M50 53L${q.join(' ')}`).join('')} fill="none" strokeWidth={1.6} />
        <polygon points={pts([[50, 53], p[0], p[1]])} fill={t.m} strokeWidth={1.6} />
        <polygon points={pts([[50, 53], p[2], p[3]])} fill={t.m} strokeWidth={1.6} />
        <polygon points={pts([[50, 53], p[4], p[5]])} fill={t.m} strokeWidth={1.6} />
        <polygon points={pts([[50, 53], p[6], p[7]])} fill={t.m} strokeWidth={1.6} />
        <polygon points={pts([[50, 53], p[8], p[9]])} fill={t.m} strokeWidth={1.6} />
      </>
    );
  },
  flame: (t) => (
    <>
      <path d="M50 80C35 80 26 70 26 58C26 46 35 40 37 28C42 33 44 38 45 42C46 32 51 24 60 18C58 29 64 35 69 42C73 48 75 53 75 59C75 71 65 80 50 80Z" />
      <path d="M50 78C43 78 38 73 38 66C38 59 44 55 46 48C49 53 51 55 54 57C55 53 57 51 59 49C62 55 63 59 63 65C63 72 57 78 50 78Z" fill={t.a} strokeWidth={2.4} />
      <path d="M50 76C47 76 45 74 45 71C45 68 48 66 49 62C51 65 55 67 55 71C55 74 53 76 50 76Z" fill={t.b} strokeWidth={1.6} />
    </>
  ),
  bolt: (t) => (
    <>
      <path d="M58 16L28 54H46L38 84L73 42H55L66 16Z" />
      <path d="M58 22L35 51" fill="none" stroke={t.a} strokeWidth={2.4} />
    </>
  ),
  crown: (t) => (
    <>
      <path d="M25 66L21 32L36 46L50 24L64 46L79 32L75 66Z" />
      <rect x="24" y="65" width="52" height="11" rx="2" fill={t.a} />
      <circle cx="21" cy="31" r="4.5" fill={t.a} strokeWidth={2.4} />
      <circle cx="50" cy="23" r="4.5" fill={t.a} strokeWidth={2.4} />
      <circle cx="79" cy="31" r="4.5" fill={t.a} strokeWidth={2.4} />
      <path d="M50 52L54 58L50 64L46 58Z" fill={t.k} strokeWidth={1.2} />
      <circle cx="35" cy="70.5" r="2" fill={t.k} stroke="none" />
      <circle cx="50" cy="70.5" r="2" fill={t.k} stroke="none" />
      <circle cx="65" cy="70.5" r="2" fill={t.k} stroke="none" />
    </>
  ),
  gem: (t) => (
    <>
      <path d="M35 28H65L78 43L50 79L22 43Z" />
      <path d="M22 43H78M35 28L42 43L50 28L58 43L65 28M42 43L50 79L58 43" fill="none" strokeWidth={2} />
      <path d="M35 28L42 43H22Z" fill={t.a} strokeWidth={2} />
      <path d="M58 43L50 79L78 43Z" fill={t.m} strokeWidth={2} />
      <path d="M44 32L47 36" fill="none" stroke={t.b} strokeWidth={2} />
    </>
  ),
  infinity: (t) => (
    <>
      {tube(t, 'M50 50C42 37 24 35 24 50C24 65 42 63 50 50C58 37 76 35 76 50C76 65 58 63 50 50Z', 8)}
      <path d="M30 44C33 41 37 41 40 43" fill="none" stroke={t.a} strokeWidth={2.4} />
    </>
  ),
  hourglass: (t) => (
    <>
      <path d="M35 27H65C65 41 54 45 54 50C54 55 65 59 65 73H35C35 59 46 55 46 50C46 45 35 41 35 27Z" />
      <path d="M40 34H60C58 40 52 43 50 47C48 43 42 40 40 34Z" fill={t.a} strokeWidth={1.6} />
      <path d="M38 71C40 63 46 61 50 58C54 61 60 63 62 71Z" fill={t.a} strokeWidth={1.6} />
      <path d="M50 48V60" fill="none" stroke={t.a} strokeWidth={2} />
      <rect x="27" y="20" width="46" height="8" rx="2" fill={t.m} />
      <rect x="27" y="72" width="46" height="8" rx="2" fill={t.m} />
    </>
  ),
  clock: (t) => (
    <>
      <path d="M31 34L24 27M69 34L76 27" fill="none" strokeWidth={4} />
      <circle cx="29" cy="25" r="7" fill={t.a} />
      <circle cx="71" cy="25" r="7" fill={t.a} />
      <path d="M36 74L31 80M64 74L69 80" fill="none" strokeWidth={4} />
      <circle cx="50" cy="52" r="26" />
      <circle cx="50" cy="52" r="20.5" fill="none" strokeWidth={1.6} />
      <path d="M50 34V38M50 66V70M32 52H36M64 52H68" fill="none" strokeWidth={2.6} />
      <path d="M50 52V38M50 52L61 58" fill="none" strokeWidth={3.6} />
      <circle cx="50" cy="52" r="3" fill={t.k} stroke="none" />
    </>
  ),
  calendar: (t) => (
    <>
      <rect x="24" y="28" width="52" height="48" rx="4" />
      <path d="M24 32a4 4 0 0 1 4-4h44a4 4 0 0 1 4 4v10H24Z" fill={t.a} />
      <rect x="34" y="21" width="6" height="13" rx="3" fill={t.m} />
      <rect x="60" y="21" width="6" height="13" rx="3" fill={t.m} />
      {[0, 1, 2, 3].flatMap((c) =>
        [0, 1, 2].map((r) =>
          c === 2 && r === 1 ? null : <rect key={`${c}${r}`} x={30 + c * 11} y={47 + r * 9} width="7" height="6" rx="1" fill={t.k} stroke="none" opacity=".75" />,
        ),
      )}
      <path d="M50 57L54 61L61 53" fill="none" stroke={t.a} strokeWidth={3.4} />
    </>
  ),
  check: (t) => (
    <>
      {tube(t, 'M27 51L43 67L74 31', 10)}
      <path d="M31 51L43 63" fill="none" stroke={t.a} strokeWidth={2.4} />
    </>
  ),
  scroll: (t) => (
    <>
      <rect x="28" y="30" width="44" height="40" />
      <path d="M36 40H64M36 47H64M36 54H64M36 61H54" fill="none" strokeWidth={2.4} />
      <rect x="19" y="25" width="11" height="50" rx="5.5" fill={t.a} />
      <rect x="70" y="25" width="11" height="50" rx="5.5" fill={t.a} />
      <rect x="22" y="19" width="5" height="7" rx="1.5" fill={t.m} strokeWidth={2} />
      <rect x="22" y="74" width="5" height="7" rx="1.5" fill={t.m} strokeWidth={2} />
      <rect x="73" y="19" width="5" height="7" rx="1.5" fill={t.m} strokeWidth={2} />
      <rect x="73" y="74" width="5" height="7" rx="1.5" fill={t.m} strokeWidth={2} />
      <path d="M58 64l4-4M60 66l4-4" fill="none" stroke={t.a} strokeWidth={2} />
    </>
  ),
  target: (t) => (
    <>
      <circle cx="47" cy="53" r="27" />
      <circle cx="47" cy="53" r="19" fill={t.a} />
      <circle cx="47" cy="53" r="11" />
      <circle cx="47" cy="53" r="4.5" fill={t.k} />
      <path d="M48 52L73 27" fill="none" strokeWidth={3.6} />
      <path d="M70 22L80 20L78 30L70 30Z" fill={t.m} strokeWidth={2} />
      <path d="M48 52L55 50L50 45Z" fill={t.k} strokeWidth={1.4} />
    </>
  ),
  key: (t) => (
    <g transform="rotate(-40 50 50)">
      <path d="M44 50a14 14 0 1 1-28 0a14 14 0 1 1 28 0Z" fill={t.a} />
      <circle cx="30" cy="50" r="5.5" fill={t.k} />
      <rect x="43" y="45.5" width="40" height="9" rx="2" />
      <path d="M66 54.5v9h6v-9M76 54.5v6h5v-6" />
      <path d="M48 50H80" fill="none" stroke={t.m} strokeWidth={1.6} />
    </g>
  ),
  chest: (t) => (
    <>
      <path d="M24 48V40C24 30 35 25 50 25C65 25 76 30 76 40V48Z" fill={t.m} />
      <rect x="24" y="48" width="52" height="28" rx="2" />
      <rect x="32" y="25" width="7" height="51" fill={t.a} strokeWidth={2.2} />
      <rect x="61" y="25" width="7" height="51" fill={t.a} strokeWidth={2.2} />
      <path d="M24 48H76" fill="none" />
      <rect x="44" y="42" width="12" height="14" rx="2" fill={t.a} />
      <path d="M50 47v4" fill="none" strokeWidth={3} />
      <path d="M41 33l3 3M54 30l2 2" fill="none" stroke={t.b} strokeWidth={2} />
    </>
  ),
  mountain: (t) => (
    <>
      <path d="M17 76L43 30L56 50L63 40L84 76Z" fill={t.m} />
      <path d="M43 30L51 44L46 41L41 47L37 41L35 44Z" strokeWidth={2.4} />
      <path d="M63 40L70 52L66 50L62 54L59 49L57 51Z" strokeWidth={2.2} />
      <path d="M43 50L38 62M51 56L48 66M66 60L70 68" fill="none" strokeWidth={1.8} />
      <circle cx="73" cy="25" r="6" fill={t.a} strokeWidth={2.2} />
    </>
  ),
  wave: (t) => (
    <>
      <path d="M18 76C18 54 30 34 52 28C66 24 79 30 82 42C76 37 66 38 62 45C58 53 64 60 72 57C68 66 54 68 48 60C44 66 42 72 42 76Z" />
      <path d="M62 45C58 53 64 60 72 57" fill="none" strokeWidth={2} />
      <path d="M82 42C78 40 76 44 72 42M76 37C72 33 68 36 66 34" fill="none" strokeWidth={2} />
      <path d="M26 70C28 56 36 44 48 38M34 72C36 60 42 52 50 48" fill="none" stroke={t.a} strokeWidth={2.6} />
      <path d="M16 78H84" fill="none" strokeWidth={3.4} />
    </>
  ),
  sun: (t) => (
    <>
      <polygon points={pts(starP(12, 31, 20, -90))} />
      <circle cx="50" cy="50" r="15" fill={t.a} />
      <path d="M42 44a10 10 0 0 1 6-5" fill="none" stroke={t.b} strokeWidth={2.4} />
    </>
  ),
  moon: (t) => (
    <>
      <path d="M57 21A29 29 0 1 0 79 63A23 23 0 1 1 57 21Z" />
      <circle cx="40" cy="55" r="4" fill={t.m} strokeWidth={1.8} />
      <circle cx="46" cy="68" r="2.6" fill={t.m} strokeWidth={1.6} />
      <circle cx="34" cy="41" r="2.4" fill={t.m} strokeWidth={1.6} />
      <path d="M70 30C71 35 72 36 77 37C72 38 71 39 70 44C69 39 68 38 63 37C68 36 69 35 70 30Z" fill={t.a} strokeWidth={1.8} />
    </>
  ),
  leaf: (t) => (
    <>
      <path d="M27 73C25 46 42 27 76 24C77 55 59 75 27 73Z" />
      <path d="M22 78L68 32" fill="none" strokeWidth={3} />
      <path d="M38 62L36 50M46 54L44 42M54 46L54 36M38 62L50 63M46 54L60 55M54 46L66 46" fill="none" strokeWidth={2} />
      <path d="M58 30C64 28 68 28 72 28" fill="none" stroke={t.a} strokeWidth={2.4} />
    </>
  ),
  sword: (t) => (
    <g transform="rotate(40 50 50)">
      <path d="M50 12L56.5 21V60H43.5V21Z" />
      <path d="M50 20V56" fill="none" stroke={t.m} strokeWidth={2.4} />
      <rect x="34" y="59" width="32" height="7" rx="3.5" fill={t.a} />
      <rect x="45.5" y="66" width="9" height="16" rx="1.5" fill={t.m} />
      <path d="M45.5 71h9M45.5 76h9" fill="none" strokeWidth={1.8} />
      <circle cx="50" cy="85" r="4.5" fill={t.a} />
    </g>
  ),
  shield: (t) => (
    <>
      <path d="M50 20L76 29V48C76 64 65 74 50 81C35 74 24 64 24 48V29Z" />
      <path d="M50 27L69 34V48C69 60 61 68 50 73C39 68 31 60 31 48V34Z" fill={t.a} strokeWidth={2.2} />
      <path d="M50 27V73M31 46H69" fill="none" strokeWidth={6} />
      <path d="M50 27V73M31 46H69" fill="none" stroke={t.b} strokeWidth={2.6} />
    </>
  ),
  dragon: (t) => (
    <>
      {/* horns sweeping back */}
      <path d="M44 34C40 26 33 21 22 20C29 25 33 31 35 39Z" fill={t.a} />
      <path d="M52 31C51 23 47 17 39 13C43 19 44 26 44 33Z" fill={t.a} />
      {/* head, open jaw, neck with spines */}
      <path d="M26 82C27 68 29 58 34 50C38 42 46 36 56 35L80 42C83 44 82 48 79 49L62 51L76 58C74 63 67 64 60 61C56 66 51 74 49 82Z" />
      <path d="M34 50L24 50L30 56L24 60L31 64L26 70L32 72" fill={t.a} strokeWidth={2.4} />
      <path d="M64 51L66.5 56L69 51ZM71 50.5L73 54.5L75 50.2Z" fill={t.b} strokeWidth={1.4} />
      <path d="M64 58.5L66 54.5L68 59.5Z" fill={t.b} strokeWidth={1.4} />
      <circle cx="77" cy="44.5" r="1.3" fill={t.k} stroke="none" />
      <path d="M53 41L64 41" fill="none" strokeWidth={3.4} />
      <ellipse cx="59" cy="44.5" rx="3.6" ry="2.4" fill={t.a} strokeWidth={1.8} />
      <path d="M79 47C86 52 84 62 76 66M76 41C82 36 80 30 74 28" fill="none" strokeWidth={2} />
      <path d="M36 70C38 64 42 60 46 58M38 78C40 73 44 68 48 66" fill="none" strokeWidth={1.8} />
    </>
  ),
  oni: (t) => (
    <>
      <path d="M36 32L29 13L44 27ZM64 32L71 13L56 27Z" fill={t.a} />
      <path d="M30 42C30 31 38 25 50 25C62 25 70 31 70 42L73 56C73 70 63 79 50 79C37 79 27 70 27 56Z" />
      <path d="M33 39L47 46V40L36 35ZM67 39L53 46V40L64 35Z" fill={t.k} strokeWidth={1.4} />
      <path d="M36 47C38 44 44 45 46 49C42 52 38 51 36 47ZM64 47C62 44 56 45 54 49C58 52 62 51 64 47Z" fill={t.a} strokeWidth={1.8} />
      <circle cx="42" cy="48" r="1.8" fill={t.k} stroke="none" />
      <circle cx="58" cy="48" r="1.8" fill={t.k} stroke="none" />
      <path d="M46 56L50 53L54 56" fill="none" strokeWidth={2.2} />
      <path d="M35 62C40 72 60 72 65 62C58 64 42 64 35 62Z" fill={t.k} strokeWidth={2} />
      <path d="M40 63L42 69L45 63.6M60 63L58 69L55 63.6" fill={t.b} strokeWidth={1.2} />
    </>
  ),
  torii: (t) => (
    <>
      <path d="M17 26C33 31 67 31 83 26L80 35C66 38 34 38 20 35Z" fill={t.a} />
      <rect x="25" y="37" width="50" height="5" fill={t.m} strokeWidth={2.4} />
      <rect x="22" y="49" width="56" height="7" />
      <rect x="46" y="41" width="8" height="9" strokeWidth={2.4} />
      <path d="M33 41H40L42 82H31Z" />
      <path d="M60 41H67L69 82H58Z" />
      <rect x="29" y="78" width="15" height="5" fill={t.m} strokeWidth={2.2} />
      <rect x="56" y="78" width="15" height="5" fill={t.m} strokeWidth={2.2} />
    </>
  ),
  sakura: (t) => (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d="M50 50C41 45 37 33 42 22L50 27L58 22C63 33 59 45 50 50Z" transform={`rotate(${i * 72} 50 51)`} />
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={`v${i}`} d="M50 49V36" fill="none" stroke={t.a} strokeWidth={1.8} transform={`rotate(${i * 72 + 36} 50 51)`} />
      ))}
      <circle cx="50" cy="51" r="6.5" fill={t.a} strokeWidth={2.4} />
      <circle cx="50" cy="51" r="2" fill={t.k} stroke="none" />
    </>
  ),
  wing: (t) => (
    <>
      <path d="M22 70C20 50 30 32 50 26C62 22 74 22 82 24C80 30 76 33 70 35C76 36 79 38 80 41C74 45 66 47 60 47C66 50 68 52 69 56C62 59 54 59 48 58C51 62 52 65 52 69C42 70 32 72 22 70Z" />
      <path d="M70 35C58 36 48 40 40 48M60 47C52 48 44 52 38 58M48 58C42 60 36 64 32 68" fill="none" strokeWidth={2.2} />
      <path d="M26 62C28 48 36 38 48 33" fill="none" stroke={t.a} strokeWidth={2.8} />
    </>
  ),
  fist: (t) => (
    <>
      <path d="M30 40C30 33 35 30 40 32C41 27 47 26 50 30C52 26 58 26 60 31C63 28 70 30 70 37V58C70 66 64 70 56 70H42C35 70 30 64 30 58Z" />
      <path d="M40 32V44M50 30V44M60 31V44" fill="none" strokeWidth={2.4} />
      <path d="M30 50C38 46 52 47 60 52C58 58 46 60 33 59" strokeWidth={2.8} />
      <path d="M52 50.5C55 51 57 52 58 53" fill="none" strokeWidth={1.6} />
      <rect x="37" y="69" width="26" height="13" rx="2" fill={t.a} />
      <path d="M22 26L28 32M50 15V22M78 26L72 32" fill="none" strokeWidth={2.8} />
    </>
  ),
  eye: (t) => (
    <>
      <path d="M18 52C30 33 70 33 82 52C70 71 30 71 18 52Z" />
      <circle cx="50" cy="52" r="13" fill={t.a} strokeWidth={2.6} />
      <circle cx="50" cy="52" r="6" fill={t.k} stroke="none" />
      <circle cx="54" cy="48" r="2.6" fill={t.b} stroke="none" />
      <path d="M30 37L26 31M40 33L38 26M50 32V25M60 33L62 26M70 37L74 31" fill="none" strokeWidth={2.6} />
    </>
  ),
  mask: (t) => (
    <>
      <path d="M50 81C43 74 33 63 30 50L25 18L42 33C46 31 54 31 58 33L75 18L70 50C67 63 57 74 50 81Z" />
      <path d="M29 24L39 34L33 39ZM71 24L61 34L67 39Z" fill={t.a} strokeWidth={1.8} />
      <path d="M35 47C38 44 43 45 46 49M65 47C62 44 57 45 54 49" fill="none" strokeWidth={3.4} />
      <path d="M50 36V42M47 38l3 3 3-3" fill="none" stroke={t.a} strokeWidth={2.4} />
      <path d="M36 57C39 55 41 58 40 62M64 57C61 55 59 58 60 62" fill="none" stroke={t.a} strokeWidth={2.6} />
      <path d="M47 68L50 71L53 68Z" fill={t.k} strokeWidth={1.6} />
      <path d="M50 71V74M45 75C48 77 52 77 55 75" fill="none" strokeWidth={1.8} />
    </>
  ),
  violin: (t) => (
    <g transform="rotate(35 50 50) translate(50 50) scale(.98) translate(-50 -52)">
      {/* scroll, pegbox, pegs */}
      <path d="M41 25H47M53 29H59M41 33H47" fill="none" strokeWidth={5} />
      <path d="M41.6 25H47M53 29H58.4M41.6 33H47" fill="none" stroke={t.m} strokeWidth={2} />
      <rect x="46.5" y="21" width="7" height="15" rx="1.5" fill={t.a} />
      <path d="M50 22C45 22 44.5 13 50 12.5C55 12 56 18.5 52 19C49.5 19.3 49 16 51 15.8" fill={t.a} strokeWidth={2.4} />
      {/* body: upper bout, C-bouts, lower bout */}
      <path d="M50 40C57 40 64 42 64 49C64 54 60 55 58.5 57C57.5 59 57.5 62 58.5 64C62.5 66 67 70 67 77C67 84 60 88 50 88C40 88 33 84 33 77C33 70 37.5 66 41.5 64C42.5 62 42.5 59 41.5 57C40 55 36 54 36 49C36 42 43 40 50 40Z" fill={t.a} />
      <path d="M50 42.5C55.5 42.5 61 44.5 61 49.5C61 53 58 54.5 56.5 56C55 58 55 63 56.5 65.5C60 67 64 70.5 64 76.5C64 82 58 85.5 50 85.5C42 85.5 36 82 36 76.5C36 70.5 40 67 43.5 65.5C45 63 45 58 43.5 56C42 54.5 39 53 39 49.5C39 44.5 44.5 42.5 50 42.5Z" fill="none" stroke={t.b} strokeWidth={1} opacity=".7" />
      {/* fingerboard */}
      <path d="M47.6 33H52.4L53.6 63H46.4Z" fill={t.k} strokeWidth={1.4} />
      {/* f-holes */}
      <path d="M43.5 64C41 67 45.5 71 42.5 75M56.5 64C59 67 54.5 71 57.5 75" fill="none" strokeWidth={1.9} />
      <circle cx="43.5" cy="64" r="1.3" fill={t.k} stroke="none" />
      <circle cx="42.5" cy="75" r="1.3" fill={t.k} stroke="none" />
      <circle cx="56.5" cy="64" r="1.3" fill={t.k} stroke="none" />
      <circle cx="57.5" cy="75" r="1.3" fill={t.k} stroke="none" />
      {/* bridge, tailpiece, strings */}
      <path d="M45.5 69.5H54.5" fill="none" strokeWidth={2.2} />
      <path d="M47 73.5H53L54 84H46Z" fill={t.k} strokeWidth={1.2} />
      <path d="M48.8 30V74M51.2 30V74" fill="none" stroke={t.b} strokeWidth={0.6} />
    </g>
  ),
  note: (t) => (
    <>
      <path d="M38 33L72 24V31L38 40Z" fill={t.k} strokeWidth={2.4} />
      <rect x="35" y="35" width="4.5" height="34" fill={t.k} strokeWidth={1.4} />
      <rect x="68.5" y="27" width="4.5" height="34" fill={t.k} strokeWidth={1.4} />
      <ellipse cx="30" cy="70" rx="10" ry="7.5" transform="rotate(-22 30 70)" />
      <ellipse cx="63" cy="62" rx="10" ry="7.5" transform="rotate(-22 63 62)" />
      <path d="M25 68a5 3 -22 0 1 7-4M58 60a5 3 -22 0 1 7-4" fill="none" stroke={t.a} strokeWidth={2.2} />
    </>
  ),
  code: (t) => (
    <>
      {tube(t, 'M36 30L18 50L36 70', 7)}
      {tube(t, 'M64 30L82 50L64 70', 7)}
      {tube(t, 'M57 24L43 76', 6)}
      <path d="M57 24L43 76" fill="none" stroke={t.a} strokeWidth={6} />
    </>
  ),
  chip: (t) => (
    <>
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`rotate(${i * 90} 50 50)`}>
          <path d="M38 30V20M46 30V20M54 30V20M62 30V20" fill="none" strokeWidth={6.5} />
          <path d="M38 30V21M46 30V21M54 30V21M62 30V21" fill="none" stroke={t.m} strokeWidth={2.4} />
        </g>
      ))}
      <rect x="29" y="29" width="42" height="42" rx="4" />
      <rect x="38" y="38" width="24" height="24" rx="2" fill={t.a} />
      <path d="M43 50H57M50 43V57" fill="none" strokeWidth={2.2} />
      <circle cx="34.5" cy="34.5" r="2" fill={t.k} stroke="none" />
    </>
  ),
  shoe: (t) => (
    <>
      <path d="M20 66C20 56 24 46 29 38C33 41 38 42 42 41C44 46 48 50 55 52L72 56C79 58 82 62 82 67Z" />
      <path d="M19 66H83V71C83 74 81 76 78 76H24C21 76 19 74 19 71Z" fill={t.a} />
      <path d="M38 44L42 49M42 42L46 47M46 41L50 46" fill="none" strokeWidth={2.4} />
      <path d="M26 58C38 56 50 58 62 64" fill="none" stroke={t.m} strokeWidth={4} />
      <path d="M29 38C28 34 30 31 33 31" fill="none" strokeWidth={2.4} />
      <path d="M10 46H18M7 54H17M11 62H17" fill="none" strokeWidth={2.6} />
    </>
  ),
  flag: (t) => (
    <>
      <path d="M33 25C45 19 56 31 76 23V51C56 59 45 47 33 53Z" />
      <circle cx="54" cy="38" r="7.5" fill={t.a} strokeWidth={2.4} />
      <path d="M38 47C46 44 52 49 60 50" fill="none" strokeWidth={1.6} opacity=".6" />
      <rect x="27" y="19" width="6" height="63" rx="2" fill={t.m} />
      <circle cx="30" cy="17" r="4.5" fill={t.a} />
    </>
  ),
  compass: (t) => (
    <>
      <circle cx="50" cy="50" r="29" />
      <circle cx="50" cy="50" r="23" fill="none" strokeWidth={1.6} />
      {Array.from({ length: 16 }, (_, i) => (
        <path key={i} d={`M${at(23, i * 22.5).join(' ')}L${at(i % 4 ? 26 : 28, i * 22.5).join(' ')}`} fill="none" strokeWidth={1.6} />
      ))}
      <path d="M50 50L59 41L50 46L41 41ZM50 50L59 59L54 50L59 41ZM50 50L41 59L50 54L59 59ZM50 50L41 41L46 50L41 59Z" fill={t.m} strokeWidth={1.4} />
      <path d="M50 22L56 50H44Z" fill={t.a} strokeWidth={2.2} />
      <path d="M50 78L56 50H44Z" fill={t.b} strokeWidth={2.2} />
      <circle cx="50" cy="50" r="3.6" fill={t.k} stroke="none" />
    </>
  ),
  dumbbell: (t) => (
    <g transform="rotate(-25 50 50)">
      <rect x="31" y="46.5" width="38" height="7" fill={t.m} />
      <path d="M40 46.5v7M44 46.5v7M56 46.5v7M60 46.5v7" fill="none" strokeWidth={1.4} />
      <rect x="15" y="43" width="6" height="14" rx="2" />
      <rect x="20" y="32" width="9" height="36" rx="2.5" fill={t.a} />
      <rect x="28" y="37" width="5" height="26" rx="1.5" />
      <rect x="79" y="43" width="6" height="14" rx="2" />
      <rect x="71" y="32" width="9" height="36" rx="2.5" fill={t.a} />
      <rect x="67" y="37" width="5" height="26" rx="1.5" />
    </g>
  ),
  kettlebell: (t) => (
    <>
      <path d="M34 54C31 37 35 23 50 23C65 23 69 37 66 54L58 52C61 40 58 31 50 31C42 31 39 40 42 52Z" fill={t.m} />
      <path d="M50 42C64 42 74 51 74 63C74 70 71 75 67 79H33C29 75 26 70 26 63C26 51 36 42 50 42Z" />
      <rect x="40" y="57" width="20" height="11" rx="2" fill={t.a} strokeWidth={2.2} />
      <path d="M44 62.5H56" fill="none" strokeWidth={1.8} />
      <path d="M33 58C34 52 38 48 43 46" fill="none" stroke={t.a} strokeWidth={2.6} />
    </>
  ),
  book: (t) => (
    <>
      <path d="M19 32V77C30 73 42 73 50 79C58 73 70 73 81 77V32Z" fill={t.a} />
      <path d="M50 33C42 27 31 26 23 29V72C31 69 42 70 50 75C58 70 69 69 77 72V29C69 26 58 27 50 33Z" />
      <path d="M50 33V75" fill="none" />
      <path d="M29 38C35 37 40 37 45 39M29 45C35 44 40 44 45 46M29 52C35 51 40 51 45 53M55 39C60 37 65 37 71 38M55 46C60 44 65 44 71 45" fill="none" strokeWidth={1.8} />
      <path d="M62 51V66L65.5 63L69 66V51Z" fill={t.a} strokeWidth={1.8} />
    </>
  ),
  pencil: (t) => (
    <g transform="rotate(-45 50 50)">
      <path d="M34 43H67V57H34Z" fill={t.a} />
      <path d="M34 47.7H67M34 52.3H67" fill="none" strokeWidth={1.4} />
      <path d="M34 43L17 50L34 57Z" />
      <path d="M22.5 47.7L17 50L22.5 52.3Z" fill={t.k} strokeWidth={1.4} />
      <rect x="67" y="42" width="8" height="16" fill={t.m} />
      <path d="M70 42V58M72.5 42V58" fill="none" strokeWidth={1.2} />
      <path d="M75 42H80a3 3 0 0 1 3 3V55a3 3 0 0 1-3 3H75Z" />
    </g>
  ),
  pawn: (t) => (
    <>
      <circle cx="50" cy="30" r="9.5" />
      <path d="M38 44.5C38 40 62 40 62 44.5C62 47 38 47 38 44.5Z" fill={t.a} strokeWidth={2.4} />
      <path d="M43 47C44 56 40 63 35 68H65C60 63 56 56 57 47Z" />
      <rect x="29" y="68" width="42" height="7" rx="2" fill={t.a} />
      <rect x="26" y="74" width="48" height="7" rx="2" />
      <path d="M46 26a5 5 0 0 1 4-2" fill="none" stroke={t.a} strokeWidth={2.4} />
    </>
  ),
  knight: (t) => (
    <>
      <path d="M36 70C35 62 39 56 46 52C40 53 34 56 30 55C25 54 22 50 23.5 45.5L37 29C38 26 40 24 42 23L43 15L49 21C61 21 71 31 70 46C69 57 65 64 65 70Z" />
      <path d="M49 21C59 22 66 30 67 41C67 50 64 58 62 65" fill="none" stroke={t.a} strokeWidth={4} />
      <path d="M53 24L57 21M58 28L62 25M62 34L66 32M64 41L68 40M64 48L68 49" fill="none" strokeWidth={2} />
      <path d="M39 34L45 33L44 37Z" fill={t.k} strokeWidth={1.4} />
      <circle cx="28" cy="47.5" r="1.8" fill={t.k} stroke="none" />
      <path d="M24.5 50.5C28 51 31 51 34 49" fill="none" strokeWidth={1.8} />
      <rect x="31" y="68" width="38" height="6" rx="2" fill={t.a} />
      <rect x="27" y="73" width="46" height="8" rx="2" />
    </>
  ),
  king: (t) => (
    <>
      <rect x="47" y="13" width="6" height="16" rx="1" fill={t.a} strokeWidth={2.4} />
      <rect x="42" y="17" width="16" height="6" rx="1" fill={t.a} strokeWidth={2.4} />
      <path d="M35 36C35 29 65 29 65 36L60 45H40Z" />
      <rect x="37" y="44" width="26" height="6" rx="2" fill={t.a} />
      <path d="M41 50C43 58 40 64 35 70H65C60 64 57 58 59 50Z" />
      <rect x="29" y="69" width="42" height="6" rx="2" fill={t.a} />
      <rect x="26" y="74" width="48" height="8" rx="2" />
      <path d="M41 35C44 33 48 33 50 33" fill="none" stroke={t.a} strokeWidth={2.2} />
    </>
  ),
  bed: (t) => (
    <>
      <rect x="18" y="30" width="7" height="50" rx="2" fill={t.a} />
      <rect x="75" y="46" width="7" height="34" rx="2" fill={t.a} />
      <rect x="24" y="56" width="52" height="11" />
      <path d="M24 67H76V71H24Z" fill={t.m} strokeWidth={2.2} />
      <ellipse cx="34" cy="50" rx="8.5" ry="6" />
      <path d="M42 49C52 43 66 46 76 52V60H40Z" fill={t.a} />
      <path d="M48 51C56 49 64 51 70 54" fill="none" strokeWidth={1.8} />
      <path d="M58 24h8l-8 9h8M68 14h6l-6 7h6" fill="none" strokeWidth={2.6} />
    </>
  ),
  zzz: (t) => (
    <>
      {tube(t, 'M22 52H44L22 76H44', 6)}
      {tube(t, 'M50 36H66L50 54H66', 5)}
      {tube(t, 'M68 22H79L68 34H79', 4)}
      <path d="M24 52H42" fill="none" stroke={t.a} strokeWidth={2} />
    </>
  ),
  phone: (t) => (
    <>
      <rect x="32" y="17" width="36" height="66" rx="7" />
      <rect x="37" y="26" width="26" height="46" rx="2" fill={t.k} strokeWidth={1.6} />
      <path d="M45 21.5H55" fill="none" strokeWidth={2.4} />
      <path d="M45 78H55" fill="none" strokeWidth={2.4} />
      <path d="M41 46L56 31M41 56L60 37" fill="none" stroke={t.a} strokeWidth={2.4} opacity=".85" />
      <circle cx="66" cy="21" r="6" fill={t.a} strokeWidth={2.2} />
    </>
  ),
  lotus: (t) => (
    <>
      <ellipse cx="50" cy="71" rx="28" ry="6.5" fill={t.a} />
      <path d="M50 70C38 70 25 64 20 52C34 51 45 58 50 70ZM50 70C62 70 75 64 80 52C66 51 55 58 50 70Z" fill={t.m} />
      <path d="M50 68C39 64 31 52 32 37C43 41 49 52 50 68ZM50 68C61 64 69 52 68 37C57 41 51 52 50 68Z" />
      <path d="M50 24C59 34 60 54 50 68C40 54 41 34 50 24Z" />
      <path d="M50 32V62" fill="none" stroke={t.a} strokeWidth={2} />
    </>
  ),
  cabinet: (t) => (
    <>
      <path d="M24 26L28 19H72L76 26Z" fill={t.a} />
      <rect x="27" y="26" width="46" height="50" />
      <rect x="31" y="30" width="17" height="24" fill={t.m} strokeWidth={2.2} />
      <rect x="52" y="30" width="17" height="24" fill={t.m} strokeWidth={2.2} />
      <path d="M31 42H48M52 42H69" fill="none" strokeWidth={1.8} />
      <circle cx="39.5" cy="38" r="2.6" fill={t.a} strokeWidth={1.4} />
      <path d="M57 41L60 35L63 41Z" fill={t.a} strokeWidth={1.4} />
      <rect x="37" y="47" width="5" height="7" fill={t.a} strokeWidth={1.4} />
      <circle cx="61" cy="50" r="3" fill={t.a} strokeWidth={1.4} />
      <rect x="31" y="58" width="38" height="7" strokeWidth={2.2} />
      <rect x="31" y="67" width="38" height="6" strokeWidth={2.2} />
      <circle cx="50" cy="61.5" r="1.6" fill={t.k} stroke="none" />
      <circle cx="50" cy="70" r="1.6" fill={t.k} stroke="none" />
      <path d="M30 76V82M70 76V82" fill="none" strokeWidth={4} />
    </>
  ),
  drone: (t) => (
    <>
      <path d="M30 44H22M70 44H78" fill="none" strokeWidth={4} />
      <ellipse cx="22" cy="40" rx="11" ry="3.4" fill={t.m} strokeWidth={2.2} />
      <ellipse cx="78" cy="40" rx="11" ry="3.4" fill={t.m} strokeWidth={2.2} />
      <path d="M22 41V46M78 41V46" fill="none" strokeWidth={3} />
      <circle cx="50" cy="52" r="22" />
      <path d="M30 56C38 62 62 62 70 56" fill="none" stroke={t.a} strokeWidth={3} />
      <path d="M34 47C34 39 42 35 50 35C58 35 66 39 66 47C66 53 58 55 50 55C42 55 34 53 34 47Z" fill={t.k} strokeWidth={1.6} />
      <circle cx="50" cy="46" r="5.5" fill={t.a} stroke="none" />
      <circle cx="52" cy="44" r="1.8" fill={t.b} stroke="none" />
      <path d="M50 30V22" fill="none" strokeWidth={2.6} />
      <circle cx="50" cy="20" r="3" fill={t.a} strokeWidth={1.8} />
    </>
  ),
  secret: (t) => (
    <>
      {tube(t, 'M37 38C37 26 63 25 63 38C63 47 50 47 50 58', 8)}
      <circle cx="50" cy="71" r="6" />
    </>
  ),
};

/* ── variation ────────────────────────────────────────────────────────────── */

interface Variant {
  rim: 0 | 1 | 2 | 3;
  field: 0 | 1 | 2 | 3 | 4;
  stars: number;
  ribbon: boolean;
}
const STAR_CAP: Record<Tier, [number, number]> = { bronze: [0, 1], silver: [0, 2], gold: [1, 3], platinum: [1, 3] };
function variant(id: string, tier: Tier): Variant {
  const h = hash(id);
  const [lo, hi] = STAR_CAP[tier];
  return {
    rim: (h % 4) as Variant['rim'],
    field: ((h >>> 3) % 5) as Variant['field'],
    stars: lo + ((h >>> 7) % (hi - lo + 1)),
    ribbon: (h >>> 10) % 3 === 0 || (tier !== 'bronze' && (h >>> 12) % 4 === 0),
  };
}

/** Metal tones as CSS colours, from the theme's tier token. */
const metal = (tier: Tier) => {
  const c = `var(--t-${tier})`;
  return {
    hi: `color-mix(in srgb, ${c} 42%, #fff)`,
    c,
    lo: `color-mix(in srgb, ${c} 58%, #000)`,
    dk: `color-mix(in srgb, ${c} 35%, #000)`,
  };
};

const INK = '#15111b';

/* ── the emblem ───────────────────────────────────────────────────────────── */

function EmblemSvg({ a, size = 64, locked = false, secret = false, ribbon = true, silhouette, className, style }: EmblemProps) {
  const u = 'em' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const tier = a.tier;
  const glyph = (GLYPH[a.glyph] ? a.glyph : 'star') as Glyph;

  if (silhouette) {
    return (
      <svg className={className} style={style} width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
        {outline(tier, { style: { fill: silhouette } })}
      </svg>
    );
  }

  const v = variant(a.id, tier);
  const m = metal(tier);
  const sec = a.section ? `var(--c-${a.section})` : 'var(--c-quests)';
  const F = FIELD[tier];
  const id = (s: string) => `${u}${s}`;
  const url = (s: string) => `url(#${id(s)})`;

  const tones: T = locked
    ? { b: url('lb'), m: url('lb'), a: url('lb'), k: url('lk') }
    : { b: url('gb'), m: url('gm'), a: url('ga'), k: INK };

  const metalFill = locked ? undefined : url('mt');
  const metalRev = locked ? undefined : url('mr');
  const lockFill = { fill: 'color-mix(in srgb, var(--fg) 8%, var(--surf-2))', stroke: 'var(--fg-3)', strokeOpacity: 0.45, strokeWidth: 1.2 };

  const showRibbon = ribbon && v.ribbon && !locked;

  return (
    <svg
      className={className}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      data-glyph={a.glyph}
      data-tier={tier}
      data-locked={locked || undefined}
    >
      <defs>
        {locked ? (
          <>
            <linearGradient id={id('lb')} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100">
              <stop offset="0" style={{ stopColor: 'var(--surf-3)' }} />
              <stop offset="1" style={{ stopColor: 'var(--surf-2)' }} />
            </linearGradient>
            <linearGradient id={id('lk')} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100">
              <stop offset="0" style={{ stopColor: 'var(--fg-3)', stopOpacity: 0.75 }} />
              <stop offset="1" style={{ stopColor: 'var(--fg-3)', stopOpacity: 0.5 }} />
            </linearGradient>
          </>
        ) : (
          <>
            <linearGradient id={id('mt')} gradientUnits="userSpaceOnUse" x1="12" y1="6" x2="84" y2="96">
              <stop offset="0" style={{ stopColor: m.hi }} />
              <stop offset=".32" style={{ stopColor: m.c }} />
              <stop offset=".62" style={{ stopColor: m.lo }} />
              <stop offset=".84" style={{ stopColor: m.c }} />
              <stop offset="1" style={{ stopColor: m.hi }} />
            </linearGradient>
            <linearGradient id={id('mr')} gradientUnits="userSpaceOnUse" x1="80" y1="90" x2="20" y2="10">
              <stop offset="0" style={{ stopColor: m.hi }} />
              <stop offset=".45" style={{ stopColor: m.c }} />
              <stop offset="1" style={{ stopColor: m.dk }} />
            </linearGradient>
            <radialGradient id={id('fd')} gradientUnits="userSpaceOnUse" cx="44" cy="38" r="48">
              <stop offset="0" style={{ stopColor: `color-mix(in srgb, ${sec} 78%, #fff)` }} />
              <stop offset=".55" style={{ stopColor: sec }} />
              <stop offset="1" style={{ stopColor: `color-mix(in srgb, ${sec} 45%, #000)` }} />
            </radialGradient>
            <linearGradient id={id('gb')} gradientUnits="userSpaceOnUse" x1="0" y1="18" x2="0" y2="84">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset=".6" stopColor="#fbf6ec" />
              <stop offset="1" style={{ stopColor: `color-mix(in srgb, ${m.c} 30%, #efe7da)` }} />
            </linearGradient>
            <linearGradient id={id('gm')} gradientUnits="userSpaceOnUse" x1="0" y1="18" x2="0" y2="84">
              <stop offset="0" style={{ stopColor: `color-mix(in srgb, ${sec} 30%, #9d98a8)` }} />
              <stop offset="1" style={{ stopColor: `color-mix(in srgb, ${sec} 30%, #5f5a6b)` }} />
            </linearGradient>
            <linearGradient id={id('ga')} gradientUnits="userSpaceOnUse" x1="20" y1="18" x2="80" y2="84">
              <stop offset="0" style={{ stopColor: m.hi }} />
              <stop offset=".5" style={{ stopColor: m.c }} />
              <stop offset="1" style={{ stopColor: m.lo }} />
            </linearGradient>
            <clipPath id={id('cf')}>
              <path d={F.d} />
            </clipPath>
            {v.field === 1 && (
              <pattern id={id('pt')} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
                <circle cx="2.5" cy="2.5" r="1.05" fill="#fff" fillOpacity=".22" />
              </pattern>
            )}
            {v.field === 3 && (
              <pattern id={id('pt')} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45 50 50)">
                <rect width="4" height="4" fill="#fff" fillOpacity=".1" />
                <rect x="4" y="4" width="4" height="4" fill="#fff" fillOpacity=".1" />
              </pattern>
            )}
          </>
        )}
      </defs>

      {/* ribbon tails behind the frame */}
      {showRibbon && (
        <g stroke={INK} strokeWidth="1.4" strokeLinejoin="round">
          <path d="M24 66L42 78L25 99.4L19.5 91L8.5 95.5Z" style={{ fill: `color-mix(in srgb, ${sec} 75%, #000)` }} />
          <path d="M76 66L58 78L75 99.4L80.5 91L91.5 95.5Z" style={{ fill: `color-mix(in srgb, ${sec} 75%, #000)` }} />
          <path d="M27 73L35 78.5L21 95" fill="none" stroke={metalFill} strokeWidth="2.2" />
          <path d="M73 73L65 78.5L79 95" fill="none" stroke={metalFill} strokeWidth="2.2" />
        </g>
      )}

      {/* frame */}
      {locked ? (
        <>
          {outline(tier, { style: lockFill }, true)}
          {F.el({ style: { fill: 'color-mix(in srgb, var(--fg) 4%, var(--surf))', stroke: 'var(--fg-3)', strokeOpacity: 0.35, strokeWidth: 1 } })}
        </>
      ) : tier === 'bronze' ? (
          <>
            <polygon points={GEAR} fill={metalFill} stroke={INK} strokeOpacity=".55" strokeWidth="0.8" />
            <circle cx="50" cy="50" r="46" fill="none" style={{ stroke: m.dk }} strokeOpacity=".5" strokeWidth=".8" />
            <circle cx="50" cy="50" r="40.6" fill={metalRev} />
            <circle cx="50" cy="50" r="38.4" style={{ fill: m.dk }} />
          </>
      ) : tier === 'silver' ? (
        <>
          <polygon points={HEX(49)} fill={metalFill} stroke={INK} strokeOpacity=".55" strokeWidth="0.8" />
          {HEX_FACETS.map((q, i) => (
            <polygon key={i} points={q.p} fill={q.b > 0 ? '#fff' : '#000'} fillOpacity={Math.abs(q.b) * (q.b > 0 ? 0.42 : 0.32)} />
          ))}
          <polygon points={HEX(42.5)} fill={metalRev} />
          <polygon points={HEX(40)} style={{ fill: m.dk }} />
        </>
      ) : tier === 'gold' ? (
        <>
          <polygon points={STAR8} fill={metalFill} stroke={INK} strokeOpacity=".55" strokeWidth="0.8" />
          {STAR8_FACETS.map((q, i) => (
            <polygon key={i} points={q.p} fill={q.b > 0 ? '#fff' : '#000'} fillOpacity={Math.min(0.5, Math.abs(q.b) * 0.3)} />
          ))}
          <circle cx="50" cy="50" r="39.5" fill={metalFill} stroke={INK} strokeOpacity=".4" strokeWidth=".8" />
          <circle cx="50" cy="50" r="34.6" fill={metalRev} />
          {LAUREL.map((l, i) => (
            <ellipse key={i} cx={l.x} cy={l.y} rx="3.4" ry="1.5" transform={`rotate(${l.r} ${l.x} ${l.y})`} style={{ fill: m.dk }} fillOpacity=".7" />
          ))}
          <circle cx="50" cy="50" r="33.4" style={{ fill: m.dk }} />
        </>
      ) : (
        <>
          <path d={RAY_PATH} style={{ fill: m.hi }} stroke={INK} strokeOpacity=".45" strokeWidth=".6" strokeLinejoin="round" />
          <polygon points={OCT(43.5, 0)} fill={metalRev} stroke={INK} strokeOpacity=".5" strokeWidth=".7" />
          <polygon points={CROWN} fill={metalFill} stroke={INK} strokeOpacity=".6" strokeWidth="0.8" strokeLinejoin="round" />
          <path d="M37 13.5H63" style={{ stroke: m.dk }} strokeWidth="1.2" />
          <circle cx="35.5" cy="4.6" r="2" fill="#fff" stroke={INK} strokeOpacity=".4" strokeWidth=".5" />
          <circle cx="50" cy="2.4" r="2.3" fill="#fff" stroke={INK} strokeOpacity=".4" strokeWidth=".5" />
          <circle cx="64.5" cy="4.6" r="2" fill="#fff" stroke={INK} strokeOpacity=".4" strokeWidth=".5" />
          <polygon points={OCT(41.5)} fill={metalFill} stroke={INK} strokeOpacity=".5" strokeWidth=".7" />
          {OCT_FACETS.map((q, i) => (
            <polygon key={i} points={q.p} fill={q.b > 0 ? '#fff' : '#000'} fillOpacity={Math.abs(q.b) * (q.b > 0 ? 0.5 : 0.36)} />
          ))}
          {OCT_SPOKES}
          <polygon points={OCT(36)} fill={metalRev} />
          <polygon points={OCT(34.6)} style={{ fill: m.dk }} />
        </>
      )}

      {/* rim marks */}
      {!locked && v.rim > 0 && <Rim tier={tier} kind={v.rim as 1 | 2 | 3} r={F.deco} m={m} gap={v.stars ? (v.stars === 1 ? 10 : 28) : 0} />}

      {/* field */}
      {!locked && (
        <>
          {F.el({ fill: url('fd') })}
          {(v.field === 1 || v.field === 3) && F.el({ fill: url('pt') })}
          {(v.field === 0 || v.field === 2) && (
            <g clipPath={url('cf')}>
              <path d={v.field === 0 ? SUNBURST : FOCUS} fill="#fff" fillOpacity={v.field === 0 ? 0.13 : 0.2} />
            </g>
          )}
          {v.field === 4 && (
            <g fill="none" stroke="#fff" strokeOpacity=".16" strokeWidth="1.2" clipPath={url('cf')}>
              <circle cx="50" cy="50" r="30" />
              <circle cx="50" cy="50" r="22" />
              <circle cx="50" cy="50" r="14" />
            </g>
          )}
        </>
      )}

      {/* glyph */}
      <g
        transform={`translate(50 50) scale(${F.s}) translate(-50 -50)`}
        fill={tones.b}
        stroke={tones.k}
        strokeWidth="3.2"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={locked ? 0.85 : undefined}
      >
        {GLYPH[locked && secret ? 'secret' : glyph](tones)}
      </g>

      {/* stars and gloss */}
      {!locked && v.stars > 0 && <Stars tier={tier} n={v.stars} />}
      {!locked && (
        <g clipPath={url('cf')}>
          <path d="M8 44C14 22 34 10 56 12C40 18 26 30 20 50Z" fill="#fff" fillOpacity=".16" />
        </g>
      )}
    </svg>
  );
}

/** Field patterns: a sunburst of 12 wedges, or 28 thin manga focus lines. */
const SUNBURST = Array.from({ length: 12 }, (_, i) => {
  const a = i * 30;
  return `M50 50L${at(60, a - 7.5).join(' ')}L${at(60, a + 7.5).join(' ')}Z`;
}).join('');
const FOCUS = Array.from({ length: 28 }, (_, i) => {
  const a = i * (360 / 28) + (i % 3) * 2;
  const r0 = 24 + (i % 4) * 3;
  return `M${at(r0, a).join(' ')}L${at(60, a - 1.1).join(' ')}L${at(60, a + 1.1).join(' ')}Z`;
}).join('');

function Rim({ tier, kind, r, m, gap }: { tier: Tier; kind: 1 | 2 | 3; r: number; m: ReturnType<typeof metal>; gap: number }) {
  // Where the marks go: round frames all the way round, polygons at corners and edge middles,
  // gold on its eight star points. `gap` keeps clear of the stars (top, or bottom on platinum).
  const marks: [number, number][] =
    tier === 'silver'
      ? Array.from({ length: 12 }, (_, i) => [i * 30, i % 2 ? 39.6 : r])
      : tier === 'platinum'
        ? Array.from({ length: 16 }, (_, i) => [i * 22.5, i % 2 ? r : 35.9])
        : tier === 'gold'
          ? Array.from({ length: 8 }, (_, i) => [i * 45 - 90, 44.2])
          : Array.from({ length: 24 }, (_, i) => [i * 15, r]);
  const clear = tier === 'platinum' ? 90 : 270;
  const keep = marks.filter(([a]) => {
    const d = Math.abs((((a - clear) % 360) + 540) % 360 - 180);
    return tier === 'platinum' ? d > Math.max(gap, 12) && Math.abs((((a - 270) % 360) + 540) % 360 - 180) > 12 : tier === 'gold' ? true : d > gap;
  });
  return (
    <g>
      {keep.map(([a, rr]) => {
        const [x, y] = at(rr, a);
        if (kind === 1) return <circle key={a} cx={x} cy={y} r="1.25" style={{ fill: m.hi }} stroke={INK} strokeOpacity=".5" strokeWidth=".5" />;
        if (kind === 2) {
          const [x1, y1] = at(rr - 1.8, a);
          const [x2, y2] = at(rr + 1.8, a);
          return <path key={a} d={`M${x1} ${y1}L${x2} ${y2}`} style={{ stroke: m.dk }} strokeWidth="1.1" strokeLinecap="round" />;
        }
        return <path key={a} d={`M${pts([at(rr + 1.9, a - 2.6), at(rr - 1.6, a), at(rr + 1.9, a + 2.6)])}Z`} style={{ fill: m.dk }} fillOpacity=".75" />;
      })}
    </g>
  );
}

/** Up to three small stars along the top of the frame (the bottom on platinum, under the crown). */
function Stars({ tier, n }: { tier: Tier; n: number }) {
  const r = tier === 'bronze' ? 43.4 : tier === 'silver' ? 39.6 : tier === 'gold' ? 37 : 36;
  const base = tier === 'platinum' ? 90 : -90;
  const spread = tier === 'silver' ? 16 : 18;
  const list = n === 1 ? [0] : n === 2 ? [-spread / 2, spread / 2] : [-spread, 0, spread];
  return (
    <g fill="#fff" stroke={INK} strokeWidth=".7" strokeLinejoin="round">
      {list.map((d, i) => {
        const [x, y] = at(r, base + d);
        return <polygon key={i} points={pts(starP(5, i === 1 || n === 1 ? 3.6 : 3, 1.4, -90, x, y))} />;
      })}
    </g>
  );
}

/** An achievement's emblem as SVG: tier frame, section colour, glyph. */
export const Emblem = memo(EmblemSvg);
