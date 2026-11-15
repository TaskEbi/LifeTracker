import type { CSSProperties, ReactNode } from 'react';
import type { BotArtProps, BotRegistry } from './types';
import './chassisSamurai.css';

/**
 * Warlords: six robot frames in Japanese armour, drawn as key art at icon size. Lacquered and laced
 * plates, glowing eyes behind iron masks. The silhouette gets a theme-coloured contour (a filter), so
 * the dark ink linework inside reads on both themes.
 */

const INK = '#16121b';
const KANJI = '"Yu Mincho", "Hiragino Mincho ProN", "Noto Serif JP", serif';
/** Mirror across x = 100. Never put text inside it. */
const MIR = 'matrix(-1 0 0 1 200 0)';
const dk = (c: string, n = 35) => `color-mix(in srgb, ${c} ${100 - n}%, #000)`;
const lt = (c: string, n = 35) => `color-mix(in srgb, ${c} ${100 - n}%, #fff)`;
const mix = (a: string, b: string, n: number) => `color-mix(in srgb, ${a} ${n}%, ${b})`;
const an = (still: boolean, cls: string) => (still ? undefined : cls);
const origin = (x: number, y: number, delay = 0): CSSProperties => ({ transformOrigin: `${x}px ${y}px`, animationDelay: delay ? `${delay}s` : undefined });
const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const f = (n: number) => +n.toFixed(2);

/** A tapered limb from (x1, y1) to (x2, y2) with round ends. */
const limb = (x1: number, y1: number, x2: number, y2: number, w1: number, w2 = w1) => {
  const L = Math.hypot(x2 - x1, y2 - y1);
  const nx = -(y2 - y1) / L;
  const ny = (x2 - x1) / L;
  const a = w1 / 2;
  const b = w2 / 2;
  return `M${f(x1 + nx * a)} ${f(y1 + ny * a)}L${f(x2 + nx * b)} ${f(y2 + ny * b)}A${b} ${b} 0 0 0 ${f(x2 - nx * b)} ${f(y2 - ny * b)}L${f(x1 - nx * a)} ${f(y1 - ny * a)}A${a} ${a} 0 0 0 ${f(x1 + nx * a)} ${f(y1 + ny * a)}Z`;
};

type Stops = [number, string][];
function Lin({ id, stops, h }: { id: string; stops: Stops; h?: boolean }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2={h ? 1 : 0} y2={h ? 0 : 1}>
      {stops.map(([o, s]) => (
        <stop key={o} offset={o} stopColor={s} />
      ))}
    </linearGradient>
  );
}
/** Lacquer, lit from above: a bright lip, the colour, then a deep pool at the bottom. */
const lacq = (c: string): Stops => [
  [0, lt(c, 42)],
  [0.12, lt(c, 12)],
  [0.45, c],
  [0.82, dk(c, 32)],
  [1, dk(c, 55)],
];
/** A cylinder lit from the upper left, with a sharp specular streak. */
const cyl = (c: string): Stops => [
  [0, dk(c, 45)],
  [0.2, c],
  [0.33, lt(c, 28)],
  [0.39, lt(c, 58)],
  [0.46, lt(c, 14)],
  [0.78, dk(c, 22)],
  [1, dk(c, 55)],
];

/** Shared gradients and the two filters: the contour round the silhouette, and a glow. */
function Kit({ uid, c, c2, glow = 1.5 }: { uid: string; c: string; c2: string; glow?: number }) {
  return (
    <>
      <Lin id={`${uid}-v`} stops={lacq(c)} />
      <Lin id={`${uid}-h`} stops={cyl(c)} h />
      <Lin id={`${uid}-g`} stops={lacq(c2)} />
      <Lin id={`${uid}-gh`} stops={cyl(c2)} h />
      <Lin id={`${uid}-st`} stops={cyl('#b4bcc8')} h />
      <Lin id={`${uid}-ir`} stops={cyl('#3d3a46')} h />
      <filter id={`${uid}-ol`} filterUnits="userSpaceOnUse" x="-10" y="-10" width="220" height="220">
        <feMorphology in="SourceAlpha" operator="dilate" radius="1.5" result="d" />
        <feFlood style={{ floodColor: 'var(--fg)' }} />
        <feComposite in2="d" operator="in" result="o" />
        <feMerge>
          <feMergeNode in="o" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id={`${uid}-gl`} filterUnits="userSpaceOnUse" x="-10" y="-10" width="220" height="220">
        <feGaussianBlur stdDeviation={glow} result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </>
  );
}

function Eyes({ still, children }: { still: boolean; children: ReactNode }) {
  return (
    <g className="dr-gaze">
      <g className={still ? undefined : 'i-blink'}>{children}</g>
    </g>
  );
}
const Shadow = ({ rx = 52 }: { rx?: number }) => <ellipse cx="100" cy="185" rx={rx} ry="5" fill="var(--fg)" opacity=".14" />;

/**
 * One row of plates, bowed by k. With `head`, the top of the row is the dark plate heads and the rest
 * is silk lacing (lamellar); without, it is a solid lacquered band, optionally riveted.
 */
function Plates({ x, y, w, h, n, k = 0, fill, head, lace, rivet, ink = INK }: { x: number; y: number; w: number; h: number; n: number; k?: number; fill: string; head?: string; lace?: string; rivet?: string; ink?: string }) {
  const at = (t: number) => 2 * t * (1 - t) * k;
  const arc = (yy: number) => `M${x} ${yy}Q${x + w / 2} ${yy + k} ${x + w} ${yy}`;
  const band = (y1: number, y2: number) => `M${x} ${y1}Q${x + w / 2} ${y1 + k} ${x + w} ${y1}V${y2}Q${x + w / 2} ${y2 + k} ${x} ${y2}Z`;
  const hh = h * 0.38;
  const cuts = range(n - 1)
    .map((i) => {
      const t = (i + 1) / n;
      return `M${f(x + t * w)} ${f(y + at(t))}v${f(head ? hh : h)}`;
    })
    .join('');
  const cords = lace
    ? range(n * 3)
        .map((i) => {
          const t = (i + 0.5) / (n * 3);
          return `M${f(x + t * w)} ${f(y + at(t) + hh)}v${f(h - hh - 0.4)}`;
        })
        .join('')
    : '';
  return (
    <g>
      <path d={band(y, y + h)} fill={fill} stroke={ink} strokeWidth=".8" strokeLinejoin="round" />
      {lace && <path d={cords} stroke={lace} strokeWidth=".75" opacity=".8" />}
      {head && <path d={band(y, y + hh)} fill={head} />}
      {cuts && <path d={cuts} stroke={ink} strokeWidth=".6" opacity=".85" />}
      {rivet && <path d={arc(y + h * 0.5)} fill="none" stroke={rivet} strokeWidth="1.3" strokeDasharray="0 4.6" strokeLinecap="round" />}
      <path d={arc(y + 0.7)} fill="none" stroke="#fff" strokeOpacity=".42" strokeWidth=".6" />
    </g>
  );
}

/** A katana drawn along +x: the grip round the origin (where the fist goes), the blade out to L. */
function Katana({ L, blade, wrap, metal }: { L: number; blade: string; wrap: string; metal: string }) {
  return (
    <g>
      <path d="M-14 -2.3 H7 V2.3 H-14Z" fill={INK} />
      <path d="M-13 -2 l2.5 4 l2.5 -4 l2.5 4 l2.5 -4 l2.5 4 l2.5 -4 l2.5 4 l2.5 -4" fill="none" stroke={wrap} strokeWidth=".8" />
      <rect x="-16.5" y="-2.6" width="3" height="5.2" rx="1.2" fill={metal} stroke={INK} strokeWidth=".5" />
      <ellipse cx="8.5" cy="0" rx="1.8" ry="5.6" fill={metal} stroke={INK} strokeWidth=".6" />
      <rect x="10" y="-2" width="3.2" height="4" fill={metal} />
      <path d={`M13 -2 Q${L * 0.55} -3.4 ${L} -6.5 Q${L - 3} -1.4 ${L - 9} .3 Q${L * 0.55} 1 13 2Z`} fill={blade} stroke={INK} strokeWidth=".6" strokeLinejoin="round" />
      <path d={`M15 .6 Q${L * 0.3} -.2 ${L * 0.45} .3 Q${L * 0.6} .9 ${L * 0.75} -.6 Q${L * 0.85} -1.4 ${L - 9} -.6`} fill="none" stroke="#fff" strokeOpacity=".8" strokeWidth=".55" />
    </g>
  );
}

// ─── Ō-yoroi General ────────────────────────────────────────────────────────
function Oyoroi({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const u = (s: string) => `url(#${uid}-${s})`;
  const lac = dk(c, 62);
  const cord = lt(c, 30);
  const eye = lt(c2, 62);
  const arm = (
    <g>
      <path d={limb(64, 90, 56, 116, 14, 11)} fill={u('kt')} stroke={INK} strokeWidth=".9" />
      <path d="M57.5 97 l8 2.4 M56.5 103 l8.6 2.4 M55.6 109 l8.6 2.4" stroke="#fff" strokeOpacity=".22" strokeWidth=".6" />
      <path d={limb(56, 116, 58, 138, 11, 10)} fill={u('ir')} stroke={INK} strokeWidth=".9" />
      <path d="M52.6 121 h10 v5 h-10z M53 128 h9.6 v5 h-9.6z" fill={u('gh')} stroke={INK} strokeWidth=".6" />
      <circle cx="56" cy="116" r="4.2" fill={u('gh')} stroke={INK} strokeWidth=".7" />
      <path d="M51 137 h15 v6 q0 6 -6 6 h-4 q-5 0 -5 -6z" fill={u('h')} stroke={INK} strokeWidth=".8" />
      <path d="M52 141.4 h13 M55.5 141.4 v3 M59 141.4 v3 M62.5 141.4 v3" fill="none" stroke={INK} strokeWidth=".55" opacity=".7" />
    </g>
  );
  const sode = (
    <g transform="rotate(10 66 86)">
      {range(5).map((i) => (
        <Plates key={i} x={40} y={89 + i * 7.6} w={28} h={8.2} n={4} k={1.5} fill={u('v')} head={lac} lace={cord} />
      ))}
      <path d="M39 83 H69 V90 H39Z" fill={u('ir')} stroke={INK} strokeWidth=".8" />
      <path d="M39.5 83.6 H68.5" stroke={c2} strokeWidth="1" />
      <circle cx="45" cy="86.5" r="1.6" fill={u('gh')} />
      <circle cx="63" cy="86.5" r="1.6" fill={u('gh')} />
      <path d={range(6).map((i) => `M${41 + i * 4.6} 125.6 l2.4 2.4 m0 -2.4 l-2.4 2.4`).join('')} stroke={c2} strokeWidth=".8" />
    </g>
  );
  return (
    <g>
      <defs>
        <Kit uid={uid} c={c} c2={c2} />
        <Lin id={`${uid}-kt`} stops={cyl(dk(c, 45))} h />
        <pattern id={`${uid}-tb`} width="4.5" height="4.5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="4.5" height="4.5" fill={mix(c2, c, 62)} />
          <path d="M0 0H4.5M0 0V4.5" stroke={dk(c2, 40)} strokeWidth=".5" />
          <circle cx="2.25" cy="2.25" r=".7" fill={dk(c, 10)} />
        </pattern>
        <radialGradient id={`${uid}-cape`} cx=".3" cy=".25" r=".85">
          <stop offset="0" stopColor={lt(c, 35)} />
          <stop offset=".5" stopColor={c} />
          <stop offset="1" stopColor={dk(c, 50)} />
        </radialGradient>
      </defs>
      <Shadow rx={mk === 3 ? 66 : 54} />
      <g filter={`url(#${uid}-ol)`}>
        {mk === 3 && (
          <>
            {/* sashimono: the clan banner */}
            <path d="M35 128 V5" stroke={INK} strokeWidth="3" />
            <path d="M35.7 126 V7" stroke={lt(c2, 20)} strokeWidth=".6" opacity=".6" />
            <path d="M35 6 H10" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
            <g className={an(still, 'bsm-flag')} style={origin(35, 6)}>
              <path d="M11 7 H34 V80 C28 76 22 82 16 78 C14 77 12 78 11 79Z" fill={u('g')} stroke={INK} strokeWidth="1" />
              <path d="M11 7 H34 V13 H11Z" fill={c} />
              {[18, 32, 46, 60, 72].map((y) => (
                <rect key={y} x="32" y={y} width="4" height="3" rx="1" fill={c} stroke={INK} strokeWidth=".5" />
              ))}
              <circle cx="22.5" cy="30" r="8" fill={c} stroke={INK} strokeWidth=".8" />
              <path d="M17 26 Q22.5 40 28 26 Q22.5 35 17 26Z" fill={lt(c2, 30)} />
              <text x="22.5" y="62" textAnchor="middle" fontSize="15" fontWeight="700" fontFamily={KANJI} fill={dk(c, 15)}>
                将
              </text>
            </g>
            {/* horo: the cape that fills with air */}
            <g className={an(still, 'bsm-billow')} style={origin(128, 112)}>
              <path d="M118 102 C114 68 136 38 164 38 C188 40 196 74 189 102 C182 128 158 140 136 128Z" fill={u('cape')} stroke={INK} strokeWidth="1" />
              <path d="M126 118 C134 90 146 62 164 39 M132 124 C152 100 172 80 190 72 M122 110 C122 84 132 60 146 46" fill="none" stroke={lt(c, 30)} strokeWidth=".8" opacity=".7" />
              <path d="M130 126 C150 108 170 98 189 96" fill="none" stroke={c2} strokeWidth="2.6" />
              <path d="M142 48 C152 42 166 42 174 47" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="1.3" strokeLinecap="round" />
            </g>
          </>
        )}
        {/* legs: thigh guards, splinted shins, sandals */}
        {[-1, 1].map((d) => {
          const x = 100 + d * 21;
          return (
            <g key={d}>
              <path d={`M${x - 11} 144 L${x + 11} 144 L${x + 9} 160 L${x - 9} 160Z`} fill={u('ir')} stroke={INK} strokeWidth=".8" />
              <path d={`M${x - 9} 158 L${x + 9} 158 L${x + 7} 175 L${x - 7} 175Z`} fill={u('ir')} stroke={INK} strokeWidth=".8" />
              {[-4.5, 0, 4.5].map((o) => (
                <rect key={o} x={x + o - 1.6} y="160" width="3.2" height="14" rx="1" fill={u('st')} stroke={INK} strokeWidth=".4" />
              ))}
              <path d={`M${x - 8} 164 h16 M${x - 7.5} 170.5 h15`} stroke={c2} strokeWidth="1" />
              <path d={`M${x - 9} 160 Q${x} 152 ${x + 9} 160 L${x + 8} 163 Q${x} 157 ${x - 8} 163Z`} fill={u('g')} stroke={INK} strokeWidth=".6" />
              <path d={`M${x - 11} 182 v-3 q0 -5 5 -5 h12 q5 0 5 5 v3Z`} fill={dk(c2, 55)} stroke={INK} strokeWidth=".8" />
              <path d={`M${x - 12} 182 h24`} stroke={dk(c2, 30)} strokeWidth="1.6" strokeLinecap="round" />
              <path d={`M${x - 6} 175 l6 4 l6 -4`} fill="none" stroke={c2} strokeWidth=".8" />
            </g>
          );
        })}
        {/* kusazuri: four laced skirts */}
        {[
          [76, -9],
          [124, 9],
          [90, -2],
          [110, 2],
        ].map(([x, r]) => (
          <g key={x} transform={`rotate(${r} ${x} 122)`}>
            {range(3).map((i) => (
              <Plates key={i} x={x - 12} y={122 + i * 9} w={24} h={9.6} n={4} k={1.5} fill={u('v')} head={lac} lace={cord} />
            ))}
            <path d={range(5).map((i) => `M${x - 10.5 + i * 4.6} 147.6 l2.4 2.4 m0 -2.4 l-2.4 2.4`).join('')} stroke={c2} strokeWidth=".8" />
          </g>
        ))}
        <g className={an(still, 'bsm-breathe')} style={origin(100, 130)}>
          {/* dō */}
          {range(5).map((i) => (
            <Plates key={i} x={66} y={86 + i * 8} w={68} h={8.8} n={7} k={3} fill={u('v')} head={lac} lace={cord} />
          ))}
          <path d="M74 80 Q100 76 126 80 L125 90 Q100 86 75 90Z" fill={u('ir')} stroke={INK} strokeWidth=".8" />
          <path d="M74.5 81 Q100 77 125.5 81" fill="none" stroke={c2} strokeWidth="1" />
          {[80, 120].map((x) => (
            <circle key={x} cx={x} cy={85} r={2} fill={u('gh')} stroke={INK} strokeWidth=".5" />
          ))}
          {/* tsurubashiri: the stencilled leather front */}
          <path d="M82 91 H118 V121 Q100 125 82 121Z" fill={`url(#${uid}-tb)`} stroke={INK} strokeWidth=".8" />
          <path d="M83.6 92.6 H116.4 V119.8 Q100 123.4 83.6 119.8Z" fill="none" stroke={c} strokeWidth=".8" strokeDasharray="1.6 1.2" />
          <circle cx="100" cy="106" r="8" fill={u('v')} stroke={c2} strokeWidth="1.2" />
          <text x="100" y="109.6" textAnchor="middle" fontSize="10" fontWeight="700" fontFamily={KANJI} fill={lt(c2, 20)}>
            将
          </text>
          <path d="M66 125 Q100 131 134 125" fill="none" stroke={c2} strokeWidth="2.2" />
          <path d="M100 128 q-6 -3 -8 1 q3 3 8 -1 q6 -3 8 1 q-3 3 -8 -1 M99 128.5 l-3 8 M101 128.5 l3 8" fill={c2} stroke={dk(c2, 30)} strokeWidth=".6" />
          {/* the closed iron fan: in hand, then tucked in the belt once the war fan comes out */}
          {mk >= 2 ? (
            <g>
              <path d="M70 131 L89 119.5 L91 122.5 L72 134Z" fill={lac} stroke={INK} strokeWidth=".7" />
              <path d="M73 131.4 L89.5 121.4" stroke={c2} strokeWidth=".5" />
            </g>
          ) : (
            <g>
              <path d="M138 143 L150 113 L156 115.5 L144.5 145Z" fill={lac} stroke={INK} strokeWidth=".8" />
              <path d="M141 141.5 L152 114 M143 142.5 L154.4 115" stroke={c2} strokeWidth=".5" />
              <path d="M150 113 L156 115.5 L154.6 118.6 L148.8 116Z" fill={u('gh')} />
            </g>
          )}
          {arm}
          <g transform={MIR}>{arm}</g>
          {mk >= 2 && (
            <>
              {sode}
              <g transform={MIR}>{sode}</g>
            </>
          )}
          {/* head: neck guard, turnbacks, bowl */}
          {[2, 1, 0].map((i) => (
            <Plates key={i} x={72 - i * 8} y={56 + i * 7} w={56 + i * 16} h={9} n={6 + i * 2} k={9 + i * 2} fill={u('v')} head={lac} lace={cord} />
          ))}
          {[0, 1].map((m) => (
            <g key={m} transform={m ? MIR : undefined}>
              <path d="M76 59 C68 59 60 55 55 46 C62 44 70 46 79 53Z" fill={u('v')} stroke={c2} strokeWidth="1.2" strokeLinejoin="round" />
              <circle cx="63" cy="50" r="2.6" fill={u('gh')} stroke={INK} strokeWidth=".5" />
            </g>
          ))}
          <path d="M74 60 C74 40 86 30 100 30 C114 30 126 40 126 60Z" fill={u('ir')} stroke={INK} strokeWidth=".9" />
          <path
            d={range(7)
              .map((i) => `M${100 + (i - 3) * 2} 31.5 Q${100 + (i - 3) * 6.5} 40 ${100 + (i - 3) * 8.4} 59.5`)
              .join('')}
            fill="none"
            stroke="#fff"
            strokeOpacity=".2"
            strokeWidth=".7"
          />
          <path d="M76 57 Q100 53 124 57" fill="none" stroke={c2} strokeWidth="1.4" strokeDasharray="0 3.2" strokeLinecap="round" />
          <circle cx="100" cy="31" r="3" fill={u('gh')} stroke={INK} strokeWidth=".6" />
          <path d="M70 61 Q100 52 130 61 L128 66 Q100 58 72 66Z" fill={u('v')} stroke={INK} strokeWidth=".8" />
          <path d="M71 61.5 Q100 53 129 61.5" fill="none" stroke={c2} strokeWidth=".9" />
          {/* face: iron shadow, glowing eyes, a red menpō with a gold moustache */}
          <path d="M79 64 Q100 59 121 64 L119 82 Q100 91 81 82Z" fill={INK} />
          <g filter={`url(#${uid}-gl)`}>
            <Eyes still={still}>
              {happy ? (
                <path d="M85 70 Q90.5 64.5 96 70 M104 70 Q109.5 64.5 115 70" fill="none" stroke={eye} strokeWidth="2.2" strokeLinecap="round" />
              ) : (
                <path d="M85 66.5 L96 68.8 L95.4 71.4 L85.6 70Z M115 66.5 L104 68.8 L104.6 71.4 L114.4 70Z" fill={eye} />
              )}
            </Eyes>
          </g>
          {range(2).map((i) => (
            <Plates key={i} x={86 - i * 1.5} y={85 + i * 5} w={28 + 3 * i} h={5.6} n={5} k={2} fill={u('v')} head={lac} lace={cord} />
          ))}
          <path d="M83 72 Q100 69 117 72 L115.5 83 Q100 93 84.5 83Z" fill={u('h')} stroke={INK} strokeWidth=".8" />
          <path d="M98 71 L100 77 L102 71" fill={dk(c, 20)} stroke={INK} strokeWidth=".5" />
          <path d="M100 77.5 C94 75 88 76 84 80 C90 79 95 79.5 100 79.6 C105 79.5 110 79 116 80 C112 76 106 75 100 77.5Z" fill={lt(c2, 35)} stroke={INK} strokeWidth=".4" />
          {happy ? (
            <path d="M93 82.5 Q100 88.5 107 82.5" fill={INK} stroke={INK} strokeWidth="1" strokeLinejoin="round" />
          ) : (
            <path d="M94 83.6 H106" stroke={INK} strokeWidth="1.2" strokeLinecap="round" />
          )}
          {/* crescent maedate */}
          <path d="M96.5 56.5 L100 50 L103.5 56.5Z" fill={u('gh')} stroke={INK} strokeWidth=".5" />
          <path d="M58 16 Q100 86 142 16 Q100 70 58 16Z" fill={u('g')} stroke={INK} strokeWidth=".9" strokeLinejoin="round" />
          <path d="M64 22 Q100 76 136 22" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth=".8" />
          {/* gunbai: the commander's war fan */}
          {mk >= 2 && (
            <g transform="translate(141 141) rotate(24)">
              <g className={an(still, 'bsm-fan')} style={origin(0, 0)}>
                <path d="M-1.8 2 V-26 H1.8 V2Z" fill={INK} />
                <path d="M-2 -6 h4 M-2 -12 h4 M-2 -18 h4" stroke={c2} strokeWidth="1.2" />
                <path d="M0 -24 C-16 -26 -21 -42 -19 -54 C-17 -66 -9 -73 0 -73 C9 -73 17 -66 19 -54 C21 -42 16 -26 0 -24Z" fill={lac} stroke={INK} strokeWidth=".9" />
                <path d="M0 -28 C-13 -30 -17 -43 -15.5 -53 C-14 -63 -7 -69 0 -69 C7 -69 14 -63 15.5 -53 C17 -43 13 -30 0 -28Z" fill={u('g')} />
                <circle cx="0" cy="-50" r="9" fill={c} stroke={INK} strokeWidth=".7" />
                <path d="M-6 -54 a8 8 0 0 1 9 -4" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth=".9" strokeLinecap="round" />
                <path d="M0 -26.5 C-12 -28.5 -18.6 -42 -17.2 -53.6 C-15.6 -64.6 -8 -71 0 -71 C8 -71 15.6 -64.6 17.2 -53.6 C18.6 -42 12 -28.5 0 -26.5" fill="none" stroke={lt(c2, 30)} strokeWidth=".9" strokeDasharray="0 3.4" strokeLinecap="round" />
                <path d="M0 3 q-3 7 -1.5 13 M0 3 q3 7 1.5 13 M0 3 v14" fill="none" stroke={c2} strokeWidth="1.3" strokeLinecap="round" />
              </g>
            </g>
          )}
        </g>
      </g>
    </g>
  );
}

// ─── Kage Shinobi ───────────────────────────────────────────────────────────
function Kage({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const u = (s: string) => `url(#${uid}-${s})`;
  const edge = lt(c, 38);
  const seam = lt(c, 20);
  const eye = lt(c2, 38);
  const leg = (
    <g>
      <path d={limb(92, 122, 76, 150, 16, 12)} fill={u('h')} stroke={INK} strokeWidth=".8" />
      <path d={limb(76, 150, 72, 174, 12, 9.5)} fill={u('h')} stroke={INK} strokeWidth=".8" />
      <path d="M69.5 156 l9 4 M69 161 l9 4 M68.5 166 l8.6 4 M78.5 156 l-9 4 M78 161 l-9 4 M77.5 166 l-8.6 4" stroke={seam} strokeWidth=".7" />
      <path d="M84 128 l-7 13" stroke={edge} strokeWidth=".7" opacity=".7" />
      <circle cx="76" cy="150" r="5.4" fill={u('st')} stroke={INK} strokeWidth=".7" />
      <path d="M62 182 C62 176 65.5 172.5 71 172.5 C76.5 172.5 80 175.5 81 182Z" fill={dk(c, 10)} stroke={INK} strokeWidth=".8" />
      <path d="M68 175.4 V182" stroke={INK} strokeWidth=".7" />
      <path d="M63.5 180 Q71 178.5 80 180" fill="none" stroke={edge} strokeWidth=".6" />
    </g>
  );
  const fig = (
    <g id={`${uid}-fig`}>
      {/* ninjatō across the back */}
      <path d={limb(86, 99, 66, 61, 4.8)} fill={INK} />
      <path d="M85 97 L67 63" stroke={c2} strokeWidth="2.8" strokeDasharray="1.2 2.2" opacity=".9" />
      <rect x="80" y="93" width="11" height="3.2" rx=".8" transform="rotate(-62 85.5 94.6)" fill={u('st')} stroke={INK} strokeWidth=".6" />
      <circle cx="65.6" cy="60.6" r="2.8" fill={u('st')} stroke={INK} strokeWidth=".6" />
      {/* headband tails, behind the hood */}
      <g className={an(still, 'bsm-flutter')} style={origin(122, 51)}>
        <path d="M121 48 C132 43 142 48 153 41 L151 48.6 C141 54 131 54 121 54Z" fill={dk(c2, 25)} stroke={INK} strokeWidth=".7" />
        <path d="M121 52 C129 55 137 61 146 61 L142 65.5 C134 63 127 58.6 120 55Z" fill={dk(c2, 25)} stroke={INK} strokeWidth=".7" />
      </g>
      {leg}
      <g transform={MIR}>{leg}</g>
      <g className={an(still, 'bsm-breathe')} style={origin(100, 130)}>
        <path d="M84 115 H116 L119 132 Q100 136 81 132Z" fill={u('v')} stroke={INK} strokeWidth=".8" />
        <path d="M80 88 C88 84 112 84 120 88 L117 120 Q100 124 83 120Z" fill={u('h')} stroke={INK} strokeWidth=".9" />
        <path d="M84 91 Q100 87 116 91 L114 108 Q100 114 86 108Z" fill={u('pl')} stroke={INK} strokeWidth=".8" />
        <path d="M85 91.7 Q100 87.7 115 91.7" fill="none" stroke={edge} strokeWidth=".7" />
        <path d="M100 89 V112" stroke={INK} strokeWidth=".7" />
        <path d="M88.5 97 h7 M88.5 100 h7 M104.5 97 h7 M104.5 100 h7" stroke={INK} strokeWidth="1.1" strokeLinecap="round" />
        <circle cx="92" cy="105" r="1" fill={edge} />
        <circle cx="108" cy="105" r="1" fill={edge} />
        {/* belt and cord */}
        <path d="M82 113 Q100 117.5 118 113 L118.5 121 Q100 125.5 81.5 121Z" fill={dk(c, 30)} stroke={INK} strokeWidth=".7" />
        <path d="M82 116 Q100 120.5 118 116 M82 118.6 Q100 123 118 118.6" fill="none" stroke={c2} strokeWidth="1.1" />
        <path d="M109.5 120.5 l-2.4 7.5 M110.5 120.5 l2.2 7" stroke={c2} strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="110" cy="120" r="2.3" fill={c2} stroke={INK} strokeWidth=".5" />
        {mk >= 2 && (
          <g>
            <path d="M118 133 l9.5 3.6 l-2.6 7.4 l-9.5 -3.6z" fill={dk(c, 25)} stroke={INK} strokeWidth=".6" />
            <path d="M123.4 135.4 l2.4 -6.4" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="126.6" cy="127.4" r="1.8" fill="none" stroke={u('st')} strokeWidth="1" />
          </g>
        )}
        {/* left arm: a hand seal at the chest */}
        <path d={limb(82, 92, 68, 110, 11, 9)} fill={u('h')} stroke={INK} strokeWidth=".8" />
        <path d={limb(68, 110, 88, 103, 9, 8)} fill={u('h')} stroke={INK} strokeWidth=".8" />
        <path d={limb(72.5, 108.6, 84, 104.6, 6.6)} fill={u('st')} stroke={INK} strokeWidth=".5" />
        <circle cx="68" cy="110" r="3.6" fill={u('st')} stroke={INK} strokeWidth=".6" />
        <path d="M74 86 C78 84 86 86 88 90 L84 97 C80 95 76 94 72 95Z" fill={u('st')} stroke={INK} strokeWidth=".7" />
        <rect x="87.6" y="92.6" width="4.8" height="9" rx="2.4" fill={u('h')} stroke={INK} strokeWidth=".6" />
        <path d="M90 93.4 V101" stroke={INK} strokeWidth=".5" />
        <circle cx="90" cy="104" r="5" fill={u('h')} stroke={INK} strokeWidth=".7" />
        {/* right arm, low, with a kunai (then the kama) */}
        <path d={limb(118, 92, 134, 110, 11, 9)} fill={u('h')} stroke={INK} strokeWidth=".8" />
        <path d={limb(134, 110, 142, 128, 9, 8)} fill={u('h')} stroke={INK} strokeWidth=".8" />
        <path d={limb(135.6, 113.6, 140.6, 124.4, 6.6)} fill={u('st')} stroke={INK} strokeWidth=".5" />
        <circle cx="134" cy="110" r="3.6" fill={u('st')} stroke={INK} strokeWidth=".6" />
        <path d="M126 86 C122 84 114 86 112 90 L116 97 C120 95 124 94 128 95Z" fill={u('st')} stroke={INK} strokeWidth=".7" />
        {mk >= 2 ? (
          <g>
            <path d={limb(142, 141, 150, 104, 3.8)} fill="#6e4524" stroke={INK} strokeWidth=".6" />
            <path d="M151.5 103 C144 95.5 132 94.5 121 101 C132 99.6 143 101.6 149.4 108.4Z" fill={u('st')} stroke={INK} strokeWidth=".7" strokeLinejoin="round" />
            <path d="M146 99.6 C139 97.6 131 98 124 100.4" fill="none" stroke="#fff" strokeOpacity=".8" strokeWidth=".5" />
            <rect x="147" y="103" width="6" height="3.4" rx="1" transform="rotate(12 150 104.7)" fill={dk('#b4bcc8', 30)} />
          </g>
        ) : (
          <g>
            <path d={limb(142, 125, 138.6, 116, 2.8)} fill={INK} />
            <path d="M141.6 124 L139 117" stroke={c2} strokeWidth="2" strokeDasharray="1 1.2" />
            <circle cx="137.6" cy="113.2" r="2.4" fill="none" stroke={u('st')} strokeWidth="1.2" />
            <path d="M139.5 133.5 C138 142 143 150 149.5 157.5 C149.5 149 147.6 140 146 133.5Z" fill={u('st')} stroke={INK} strokeWidth=".6" strokeLinejoin="round" />
            <path d="M142.8 135 L148 154" stroke="#fff" strokeOpacity=".6" strokeWidth=".5" />
          </g>
        )}
        <circle cx="143" cy="130" r="5" fill={u('h')} stroke={INK} strokeWidth=".7" />
        <path d="M139 128 h8" stroke={INK} strokeWidth=".5" opacity=".6" />
        {/* hood, hachigane, eyes, mask */}
        <path d="M76 66 C74 44 84 31 100 30 C116 31 126 44 124 66 C124 80 114 88 100 88 C86 88 76 80 76 66Z" fill={u('hd')} stroke={INK} strokeWidth=".9" />
        <path d="M83 39 C87 34 93 31.6 100 31.4" fill="none" stroke={edge} strokeWidth="1.1" strokeLinecap="round" opacity=".8" />
        <path d="M78 70 C79 77 83 82 88 85 M122 70 C121 77 117 82 112 85" fill="none" stroke={seam} strokeWidth=".7" />
        <path d="M80 55 Q100 49 120 55 L119 66 Q100 61 81 66Z" fill={INK} />
        <path d="M81 49 Q100 43 119 49 L118.5 54.4 Q100 48.6 81.5 54.4Z" fill={u('st')} stroke={INK} strokeWidth=".6" />
        <text x="100" y="52.6" textAnchor="middle" fontSize="5" fontWeight="700" fontFamily={KANJI} fill={INK}>
          影
        </text>
        <circle cx="84.5" cy="50.6" r=".8" fill={INK} />
        <circle cx="115.5" cy="50.6" r=".8" fill={INK} />
        <g filter={`url(#${uid}-gl)`}>
          <Eyes still={still}>
            {happy ? (
              <path d="M85.5 62.4 Q90.5 56.8 95.5 62.4 M104.5 62.4 Q109.5 56.8 114.5 62.4" fill="none" stroke={eye} strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M85 58.4 L96 60.6 L95.4 63 L85.6 61.6Z M115 58.4 L104 60.6 L104.6 63 L114.4 61.6Z" fill={eye} />
            )}
          </Eyes>
        </g>
        <path d="M81.5 66 Q100 62 118.5 66 L116.5 80 Q100 87 83.5 80Z" fill={u('v')} stroke={INK} strokeWidth=".7" />
        <path d="M90 68 Q91 75 89 81.4 M100 66 V85 M110 68 Q109 75 111 81.4" fill="none" stroke={seam} strokeWidth=".6" />
        {happy && <path d="M94.5 75 Q100 78.6 105.5 75" fill="none" stroke={edge} strokeWidth=".9" strokeLinecap="round" />}
        {/* scarf */}
        <path d="M78 82 Q100 92 122 82 L124 93 Q100 104 76 93Z" fill={u('g')} stroke={INK} strokeWidth=".8" />
        <path d="M80 86.6 Q100 96 120 86.6 M79 90 Q100 99.6 121.4 90" fill="none" stroke={dk(c2, 35)} strokeWidth=".6" />
        <path d="M115 96 C118 104 120 112 125.4 118 L119.8 120.4 C115 113 112.4 104 111 97Z" fill={u('g')} stroke={INK} strokeWidth=".7" />
        <ellipse cx="116.6" cy="94.6" rx="4.4" ry="3.6" fill={u('g')} stroke={INK} strokeWidth=".7" />
      </g>
    </g>
  );
  return (
    <g>
      <defs>
        <Kit uid={uid} c={c} c2={c2} />
        <Lin id={`${uid}-pl`} stops={lacq(lt(c, 16))} />
        <radialGradient id={`${uid}-hd`} cx=".38" cy=".3" r=".8">
          <stop offset="0" stopColor={lt(c, 26)} />
          <stop offset=".55" stopColor={c} />
          <stop offset="1" stopColor={dk(c, 45)} />
        </radialGradient>
        <radialGradient id={`${uid}-wt`} cx=".35" cy=".3" r=".7">
          <stop offset="0" stopColor="#eef1f5" />
          <stop offset=".5" stopColor="#8d96a3" />
          <stop offset="1" stopColor="#2a2e36" />
        </radialGradient>
        <filter id={`${uid}-cl`} filterUnits="userSpaceOnUse" x="-20" y="-20" width="240" height="240">
          <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 .5 0" result="a" />
          <feFlood style={{ floodColor: mix(lt(c, 45), c2, 80) }} floodOpacity=".45" />
          <feComposite in2="SourceAlpha" operator="in" result="s" />
          <feMerge>
            <feMergeNode in="a" />
            <feMergeNode in="s" />
          </feMerge>
        </filter>
      </defs>
      <Shadow rx={mk === 3 ? 84 : 50} />
      {/* shadow clones */}
      {mk === 3 &&
        [-1, 1].map((d) => (
          <g key={d} className={an(still, 'bsm-flicker')} style={origin(100 + d * 60, 140, d < 0 ? 0 : -1.4)}>
            <ellipse cx={100 + d * 60} cy="183" rx="24" ry="4" fill={lt(c, 40)} opacity=".25" />
            <use href={`#${uid}-fig`} transform={`translate(${100 + d * 60} 182) scale(${0.76 * d} .76) translate(-100 -182)`} filter={`url(#${uid}-cl)`} />
            {[0, 1, 2].map((i) => (
              <circle key={i} cx={100 + d * (44 + i * 12)} cy={176 - (i % 2) * 5} r={4 + (i % 2) * 2} fill={lt(c, 45)} opacity=".22" />
            ))}
          </g>
        ))}
      <g filter={`url(#${uid}-ol)`}>
        {mk >= 2 && (
          <g className={an(still, 'bsm-flutter')} style={origin(118, 94)}>
            <path d="M118 90 C134 82 150 94 166 86 C176 81 186 84 194 78 L190 88 L195 92 C184 98 172 98 160 99 C146 100 132 100 118 98Z" fill={u('g')} stroke={INK} strokeWidth=".8" />
            <path d="M126 93 C140 90 152 96 166 92 C174 90 182 90 188 88" fill="none" stroke={dk(c2, 35)} strokeWidth=".7" />
          </g>
        )}
        {fig}
        {/* kusarigama chain and weight */}
        {mk >= 2 && (
          <g className={an(still, 'bsm-swing')} style={origin(142, 141)}>
            <path d="M142 141 C150 168 118 178 90 172 C62 166 42 150 40 128" fill="none" stroke={INK} strokeWidth="3.2" strokeDasharray="3 1" />
            <path d="M142 141 C150 168 118 178 90 172 C62 166 42 150 40 128" fill="none" stroke="#c9d0da" strokeWidth="1.8" strokeDasharray="3 1" />
            <circle cx="40" cy="123.5" r="5.4" fill={u('wt')} stroke={INK} strokeWidth=".7" />
            <path d="M37.4 121 a3 3 0 0 1 3 -1.6" fill="none" stroke="#fff" strokeWidth=".7" strokeLinecap="round" />
          </g>
        )}
      </g>
    </g>
  );
}

// ─── Tomoe ──────────────────────────────────────────────────────────────────
/** One comma of the mitsudomoe, in a circle of radius 6.6. */
const COMMA = 'M0 -6.2 A6.2 6.2 0 0 1 5.37 3.1 A4.4 4.4 0 0 0 0 -1.4 A2.4 2.4 0 0 1 0 -6.2Z';
const PETAL = 'M0 -2.2 L-.9 -3.3 C-2.6 -3 -3 -1 -2.2 .8 L0 3.2 L2.2 .8 C3 -1 2.6 -3 .9 -3.3Z';

function Tomoe({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const u = (s: string) => `url(#${uid}-${s})`;
  const lac = dk(c, 58);
  const hair = mix(c, '#0d0a12', 22);
  const eye = lt(c, 58);
  const lip = '#c8324a';
  const sode = (
    <g transform="rotate(14 82 86)">
      {range(3).map((i) => (
        <Plates key={i} x={66} y={87 + i * 6.4} w={17} h={7} n={3} k={1} fill={u('v')} head={lac} lace={lt(c2, 10)} />
      ))}
      <path d="M65 84 H84 V88 H65Z" fill={u('g')} stroke={INK} strokeWidth=".6" />
    </g>
  );
  return (
    <g>
      <defs>
        <Kit uid={uid} c={c} c2={c2} />
        <Lin id={`${uid}-hk`} stops={lacq(dk(c, 32))} />
        <Lin id={`${uid}-hr`} stops={[
          [0, lt(hair, 34)],
          [0.25, hair],
          [1, dk(hair, 45)],
        ]} />
        <radialGradient id={`${uid}-fc`} cx=".42" cy=".38" r=".7">
          <stop offset="0" stopColor="#fffaf6" />
          <stop offset=".6" stopColor="#f1e5dc" />
          <stop offset="1" stopColor={mix(c, '#e6d6ca', 28)} />
        </radialGradient>
      </defs>
      <Shadow rx={mk === 3 ? 58 : 50} />
      <g filter={`url(#${uid}-ol)`}>
        {/* ebira quiver of hawk-fletched arrows */}
        {mk === 3 && (
          <g>
            {[-72, -64, -56, -48, -40].map((a, i) => (
              <g key={a} transform={`translate(${124 + i * 3.2} ${68 + i}) rotate(${a})`}>
                <path d="M0 0 H36" stroke="#d8bf86" strokeWidth="1.3" />
                <path d="M21 0 L23.5 -3.2 L34 -3.4 L35.5 0 L34 3.4 L23.5 3.2Z" fill="#7a5230" stroke={INK} strokeWidth=".5" />
                <path d="M25 -3.2 v6.4 M28 -3.3 v6.6 M31 -3.4 v6.8" stroke="#f1e6cf" strokeWidth=".9" />
                <path d="M35.5 -.9 h2 v1.8 h-2z" fill={INK} />
              </g>
            ))}
            <path d="M114 102 L125 64 L141 68 L131 106Z" fill={u('v')} stroke={INK} strokeWidth=".8" strokeLinejoin="round" />
            <path d="M118 98 L127 68 M136 70 L127 102" stroke={c2} strokeWidth=".9" />
            <path d="M124.6 66 L141 70" stroke={c2} strokeWidth="1.6" />
          </g>
        )}
        {/* ponytail */}
        <g className={an(still, 'bsm-sway')} style={origin(100, 30)}>
          <path d="M100 30 C92 17 74 15 66 26 C58 37 64 56 59 78 C68 68 72 52 76 41 C80 33 90 30 100 34Z" fill={u('hr')} stroke={INK} strokeWidth=".8" />
          <path d="M92 24 C80 22 70 30 69 42 C68 52 66 62 62 72 M86 27 C78 28 74 38 73 48" fill="none" stroke={lt(hair, 40)} strokeWidth=".6" opacity=".8" />
          <path d="M97 29.5 l4 -4.5 l3 3" fill="none" stroke={c2} strokeWidth="2" strokeLinecap="round" />
        </g>
        {/* hakama and feet */}
        {[84, 116].map((x) => (
          <g key={x}>
            <path d={`M${x - 8} 182 C${x - 8} 177.6 ${x - 5} 175.6 ${x} 175.6 C${x + 5} 175.6 ${x + 8} 177.6 ${x + 8} 182Z`} fill="#f6f1ea" stroke={INK} strokeWidth=".7" />
            <path d={`M${x - 9} 182 h18`} stroke={dk(c2, 45)} strokeWidth="1.6" strokeLinecap="round" />
            <path d={`M${x - 3} 176.6 l3 2.6 l3 -2.6`} fill="none" stroke={c} strokeWidth=".9" />
          </g>
        ))}
        <path d="M82 118 L118 118 C126 140 133 160 139 178 L104 178 L100 152 L96 178 L61 178 C67 160 74 140 82 118Z" fill={u('hk')} stroke={INK} strokeWidth=".9" strokeLinejoin="round" />
        <path d="M88 120 L77 177 M94 121 L89 177 M106 121 L111 177 M112 120 L123 177" stroke={dk(c, 55)} strokeWidth=".8" opacity=".8" />
        <path d="M87 121 L75 175 M111 121 L121 175" stroke={lt(c, 20)} strokeWidth=".6" opacity=".5" />
        <path d="M62 177 L96 177 M104 177 L138 177" stroke={c2} strokeWidth="1.2" />
        {/* kusazuri over the hips */}
        {[
          [80, -8],
          [120, 8],
          [100, 0],
        ].map(([x, r]) => (
          <g key={x} transform={`rotate(${r} ${x} 118)`}>
            {range(2).map((i) => (
              <Plates key={i} x={x - 10} y={118 + i * 7.4} w={20} h={8} n={3} k={1.2} fill={u('v')} head={lac} lace={lt(c2, 10)} />
            ))}
          </g>
        ))}
        <g className={an(still, 'bsm-breathe')} style={origin(100, 130)}>
          {/* dō */}
          {range(4).map((i) => (
            <Plates key={i} x={82.5} y={88 + i * 7.2} w={35} h={7.8} n={5} k={2} fill={u('v')} head={lac} lace={lt(c2, 10)} />
          ))}
          <path d="M83 82 Q100 78 117 82 L116 89.5 Q100 85.5 84 89.5Z" fill={u('g')} stroke={INK} strokeWidth=".7" />
          <path d="M86 84.6 Q100 81.4 114 84.6" fill="none" stroke={c} strokeWidth=".6" strokeDasharray="1.4 1.4" />
          {mk === 3 && (
            <g transform="translate(100 103)">
              <circle r="8.4" fill={INK} stroke={c2} strokeWidth="1.1" />
              {[0, 120, 240].map((a) => (
                <path key={a} d={COMMA} transform={`rotate(${a}) scale(.92)`} fill={c2} />
              ))}
            </g>
          )}
          <path d="M83 114 Q100 118.5 117 114 L117 121 Q100 125.5 83 121Z" fill={u('g')} stroke={INK} strokeWidth=".7" />
          <path d="M86 118 C80 112 76 114 77 118 C76 122 80 124 86 118 C84 124 86 128 89 128" fill={u('g')} stroke={INK} strokeWidth=".6" />
          {sode}
          <g transform={MIR}>{sode}</g>
          {/* bow arm */}
          <path d={limb(80, 90, 64, 104, 9, 8)} fill={u('hk')} stroke={INK} strokeWidth=".8" />
          <path d={limb(64, 104, 51, 117, 8, 7)} fill={u('hk')} stroke={INK} strokeWidth=".8" />
          <path d={limb(61, 107.4, 54, 114.4, 5.6)} fill={u('gh')} stroke={INK} strokeWidth=".5" />
          <circle cx="64" cy="104" r="3.2" fill={u('gh')} stroke={INK} strokeWidth=".5" />
          {/* the yumi: long, the grip below the middle */}
          <path d="M64 10 C57 10 44 42 44 82 C44 100 46 112 48 120 C50 140 53 162 62 180" fill="none" stroke={INK} strokeWidth="4.2" strokeLinecap="round" />
          <path d="M64 10 C57 10 44 42 44 82 C44 100 46 112 48 120 C50 140 53 162 62 180" fill="none" stroke={lac} strokeWidth="2.6" strokeLinecap="round" />
          <path d="M64 10 C57 10 44 42 44 82 C44 100 46 112 48 120 C50 140 53 162 62 180" fill="none" stroke={c2} strokeWidth="2.8" strokeDasharray="1.2 9" />
          <path d="M62 12 C56 16 46 44 45.6 80" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth=".6" />
          <path d="M64 10 L62 180" stroke={lt(c2, 40)} strokeWidth=".7" />
          <path d="M46.8 113 L49.6 126" stroke={c2} strokeWidth="4" />
          <circle cx="50" cy="118.6" r="4.6" fill={u('h')} stroke={INK} strokeWidth=".7" />
          {/* right arm */}
          <path d={limb(120, 90, 134, 104, 9, 8)} fill={u('hk')} stroke={INK} strokeWidth=".8" />
          <path d={limb(134, 104, 141, 119, 8, 7)} fill={u('hk')} stroke={INK} strokeWidth=".8" />
          <path d={limb(136, 108, 139.6, 116, 5.6)} fill={u('gh')} stroke={INK} strokeWidth=".5" />
          <circle cx="134" cy="104" r="3.2" fill={u('gh')} stroke={INK} strokeWidth=".5" />
          {/* head */}
          <path d="M95 68 h10 v12 h-10z" fill={dk('#e9dcd2', 25)} stroke={INK} strokeWidth=".6" />
          <path d="M95 72 h10 M95 76 h10" stroke={INK} strokeWidth=".4" opacity=".5" />
          <path d="M86 80 Q100 74 114 80 L112 86 Q100 81 88 86Z" fill={u('v')} stroke={INK} strokeWidth=".6" />
          <path d="M84 52 C82 36 90 27 100 27 C110 27 118 36 116 52 C113 46 108 42 100 42 C92 42 87 46 84 52Z" fill={u('hr')} stroke={INK} strokeWidth=".8" />
          <path d="M86 50 C86 39 92 34 100 34 C108 34 114 39 114 50 C114 61 108 69 100 71 C92 69 86 61 86 50Z" fill={u('fc')} stroke={INK} strokeWidth=".8" />
          <path d="M89 59 l1.6 3.4 M111 59 l-1.6 3.4" stroke={INK} strokeWidth=".4" opacity=".35" />
          <path d="M85 44 C82 56 83 68 87.6 77 C88.6 68 89.4 58 90 50 C92 47 96 45.6 100 45.6 C104 45.6 108 47 110 50 C110.6 58 111.4 68 112.4 77 C117 68 118 56 115 44 C110 41 90 41 85 44Z" fill={u('hr')} stroke={INK} strokeWidth=".7" />
          <path d="M91 46 C94 44 97 43.6 99 43.8 M101 43.8 C104 43.6 107 44.4 109 46" fill="none" stroke={lt(hair, 45)} strokeWidth=".6" />
          {/* hachimaki */}
          <path d="M85 41 Q100 35 115 41 L115.4 45.6 Q100 39.6 84.6 45.6Z" fill={u('g')} stroke={INK} strokeWidth=".7" />
          <circle cx="100" cy="40.6" r="2.3" fill={c} />
          <g className={an(still, 'bsm-flutter')} style={origin(115, 43)}>
            <path d="M115 41.6 C126 38 134 44 146 42 L143 47.6 C133 49 124 46 115.4 45.6Z" fill={u('g')} stroke={INK} strokeWidth=".6" />
            <path d="M115 44 C124 48 130 54 140 56 L135.6 60 C127 56 121 51 114.6 46.6Z" fill={u('g')} stroke={INK} strokeWidth=".6" />
          </g>
          {/* eyes, brows, mouth */}
          <path d="M89 48.4 Q93.5 46.4 97.4 48 M102.6 48 Q106.5 46.4 111 48.4" fill="none" stroke={hair} strokeWidth=".9" strokeLinecap="round" />
          <Eyes still={still}>
            {happy ? (
              <path d="M89 54 Q93.5 49.6 98 54 M102 54 Q106.5 49.6 111 54" fill="none" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
            ) : (
              <g>
                <path d="M89 53 Q93.5 49 98 52.6 Q93.5 56 89 53Z M111 53 Q106.5 49 102 52.6 Q106.5 56 111 53Z" fill={INK} />
                <g filter={`url(#${uid}-gl)`}>
                  <circle cx="94" cy="52.8" r="1.9" fill={eye} />
                  <circle cx="106" cy="52.8" r="1.9" fill={eye} />
                </g>
                <circle cx="94.6" cy="52.1" r=".6" fill="#fff" />
                <circle cx="106.6" cy="52.1" r=".6" fill="#fff" />
              </g>
            )}
          </Eyes>
          <path d="M88.6 52.6 l-2.2 -1.6 M111.4 52.6 l2.2 -1.6" stroke={lip} strokeWidth=".9" strokeLinecap="round" />
          {happy ? (
            <>
              <path d="M96 62.4 Q100 66.8 104 62.4Z" fill={lip} stroke={INK} strokeWidth=".4" />
              <ellipse cx="90" cy="59.6" rx="2.6" ry="1.4" fill={lt(c, 50)} opacity=".7" />
              <ellipse cx="110" cy="59.6" rx="2.6" ry="1.4" fill={lt(c, 50)} opacity=".7" />
            </>
          ) : (
            <path d="M97.4 63.4 Q100 64.8 102.6 63.4 Q100 62.6 97.4 63.4Z" fill={lip} stroke={lip} strokeWidth=".6" />
          )}
          {/* naginata */}
          {mk >= 2 && (
            <g>
              <path d={limb(152, 178, 128.4, 44, 3.8)} fill={u('h')} stroke={INK} strokeWidth=".6" />
              <path d="M152 178 L128.4 44" stroke={c2} strokeWidth="4.2" strokeDasharray="1.6 15" />
              <path d="M150 177 l4 -1 l1.4 6 l-4.4 .6z" fill={u('gh')} stroke={INK} strokeWidth=".5" />
              <ellipse cx="128.8" cy="47" rx="4.6" ry="1.4" transform="rotate(-10 128.8 47)" fill={u('gh')} stroke={INK} strokeWidth=".5" />
              <path d="M126.2 42.6 h5.4 v4 h-5.4z" transform="rotate(-10 128.9 44.6)" fill={u('gh')} />
              <path d="M126.4 42 C121 30 124 16 133.4 7.6 C134.6 20 134.2 32 131.6 42Z" fill={u('st')} stroke={INK} strokeWidth=".7" strokeLinejoin="round" />
              <path d="M128.4 40 C125.6 30 127.6 19 132 12" fill="none" stroke="#fff" strokeOpacity=".85" strokeWidth=".6" />
            </g>
          )}
          <circle cx="141.6" cy="120" r="4.8" fill={u('h')} stroke={INK} strokeWidth=".7" />
        </g>
      </g>
      {mk === 3 &&
        [
          [30, 40, 20],
          [158, 26, -30],
          [180, 118, 60],
          [22, 146, -50],
          [158, 160, 15],
          [36, 92, 80],
          [186, 72, -10],
          [80, 14, 40],
          [176, 176, 70],
        ].map(([x, y, r], i) => (
          <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
            <path className={an(still, 'bsm-petal')} style={origin(0, 0, -i * 0.6)} d={PETAL} fill={lt(c, 62)} stroke={dk(c, 10)} strokeWidth=".4" />
          </g>
        ))}
    </g>
  );
}

// ─── Sōhei Monk ─────────────────────────────────────────────────────────────
const SUTRA = '観自在菩薩行深般若波羅蜜多時照見五蘊皆空度一切苦厄舎利子色不異空空不異色色即是空空即是色受想行識';

function Sohei({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const u = (s: string) => `url(#${uid}-${s})`;
  const fold = dk(c, 26);
  const eye = lt(c2, 58);
  const beads = range(18).map((i) => {
    const a = (i / 18) * Math.PI * 2 + 0.17;
    return { x: 100 + 47 * Math.cos(a), y: 104 + 22 * Math.sin(a), back: Math.sin(a) < -0.3 };
  });
  const bead = (b: { x: number; y: number }, i: number) => (
    <g key={i}>
      <circle cx={f(b.x)} cy={f(b.y)} r="6" fill={u('wd')} stroke={INK} strokeWidth=".6" />
      <ellipse cx={f(b.x - 1.8)} cy={f(b.y - 2.2)} rx="1.8" ry="1.1" fill="#fff" opacity=".45" />
    </g>
  );
  return (
    <g>
      <defs>
        <Kit uid={uid} c={c} c2={c2} />
        <Lin id={`${uid}-hk`} stops={lacq(dk(c2, 22))} />
        <Lin id={`${uid}-bz`} stops={cyl('#b5803c')} h />
        <Lin id={`${uid}-pole`} stops={cyl('#5c3d24')} h />
        <radialGradient id={`${uid}-rb`} cx=".35" cy=".25" r=".9">
          <stop offset="0" stopColor={lt(c, 45)} />
          <stop offset=".55" stopColor={c} />
          <stop offset="1" stopColor={dk(c, 30)} />
        </radialGradient>
        <radialGradient id={`${uid}-wd`} cx=".35" cy=".3" r=".75">
          <stop offset="0" stopColor="#b57a45" />
          <stop offset=".6" stopColor="#6e4122" />
          <stop offset="1" stopColor="#2e190c" />
        </radialGradient>
        <path id={`${uid}-ring`} d="M100 20 a84 84 0 1 1 0 168 a84 84 0 1 1 0 -168" />
      </defs>
      <Shadow rx={mk === 3 ? 62 : 56} />
      {/* ring of sutra light */}
      {mk === 3 && (
        <g filter={`url(#${uid}-gl)`}>
          <g className={an(still, 'bsm-spin')} style={origin(100, 104)}>
            <circle cx="100" cy="104" r="77" fill="none" stroke={mix(c2, 'var(--fg)', 40)} strokeWidth=".6" opacity=".6" />
            <circle cx="100" cy="104" r="91" fill="none" stroke={mix(c2, 'var(--fg)', 40)} strokeWidth=".6" opacity=".6" strokeDasharray="2 4" />
            <text fontSize="8.2" fill={mix(c2, 'var(--fg)', 40)} fontFamily={KANJI} letterSpacing="3.1">
              <textPath href={`#${uid}-ring`}>{SUTRA}</textPath>
            </text>
          </g>
        </g>
      )}
      <g filter={`url(#${uid}-ol)`}>
        {/* the temple bell on its back */}
        {mk === 3 && (
          <g className={an(still, 'bsm-hover')} style={origin(48, 56)}>
            <g transform="rotate(-10 48 56)">
              <path d="M42 22 C42 12 54 12 54 22" fill="none" stroke={INK} strokeWidth="4" />
              <path d="M42 22 C42 12 54 12 54 22" fill="none" stroke={u('bz')} strokeWidth="2.4" />
              <path d="M24 89 C28 80 29 48 32 36 C34 26 40 21 48 21 C56 21 62 26 64 36 C67 48 68 80 72 89 Q48 94 24 89Z" fill={u('bz')} stroke={INK} strokeWidth=".9" />
              <path d="M31.4 42 Q48 45 64.6 42 M29.6 64 Q48 67 66.4 64 M28.4 79 Q48 82 67.6 79 M48 44 V65" fill="none" stroke={dk('#b5803c', 45)} strokeWidth="1" />
              {[28, 33, 38].map((y) => (
                <path key={y} d={`M${35 + (y - 28) * 0.15} ${y} H${45}`} stroke={lt('#b5803c', 35)} strokeWidth="1.8" strokeDasharray="0 3.2" strokeLinecap="round" />
              ))}
              <circle cx="38" cy="72" r="3.6" fill={dk('#b5803c', 20)} stroke={INK} strokeWidth=".6" />
              <circle cx="38" cy="72" r="1.6" fill={lt('#b5803c', 30)} />
              <path d="M56 52 q3 4 1 9 M60 70 q-4 3 -2 8" fill="none" stroke="#5f8f7a" strokeWidth="2" opacity=".7" strokeLinecap="round" />
              <path d="M24 89 Q48 94 72 89 L70.6 85.6 Q48 90 25.4 85.6Z" fill={dk('#b5803c', 40)} />
            </g>
          </g>
        )}
        {/* shakujō */}
        <path d={limb(149, 30, 149, 181, 3.6)} fill={u('pole')} stroke={INK} strokeWidth=".6" />
        <path d="M147.4 172 h3.2 v9 h-3.2z" fill={u('bz')} />
        <g className={an(still, 'bsm-jingle')} style={origin(149, 30)}>
          <path d="M149 31 C137 29 136 13 149 5 C162 13 161 29 149 31Z" fill="none" stroke={INK} strokeWidth="3.6" />
          <path d="M149 31 C137 29 136 13 149 5 C162 13 161 29 149 31Z" fill="none" stroke={u('bz')} strokeWidth="2.2" />
          <path d="M149 31 V9" stroke={u('bz')} strokeWidth="1.6" />
          <circle cx="149" cy="7.6" r="2.2" fill={u('bz')} stroke={INK} strokeWidth=".5" />
          {[
            [139.6, 19],
            [140.4, 26],
            [143.6, 31.4],
            [154.4, 31.4],
            [157.6, 26],
            [158.4, 19],
          ].map(([x, y]) => (
            <circle key={x * y} cx={x} cy={y} r="3.2" fill="none" stroke={INK} strokeWidth="2.2" />
          ))}
          {[
            [139.6, 19],
            [140.4, 26],
            [143.6, 31.4],
            [154.4, 31.4],
            [157.6, 26],
            [158.4, 19],
          ].map(([x, y]) => (
            <circle key={x * y} cx={x} cy={y} r="3.2" fill="none" stroke="#e0b765" strokeWidth="1.1" />
          ))}
        </g>
        {/* legs on tall geta */}
        {[80, 120].map((x) => (
          <g key={x}>
            <path d={`M${x - 6} 168 h12 v9 h-12z`} fill={dk(c2, 45)} stroke={INK} strokeWidth=".6" />
            <path d={`M${x - 6} 170 l12 3 M${x - 6} 174 l12 -3`} stroke={lt(c, 10)} strokeWidth=".7" />
            <path d={`M${x - 7} 177 q0 -4.4 7 -4.4 q7 0 7 4.4z`} fill="#f4f0e6" stroke={INK} strokeWidth=".6" />
            <path d={`M${x - 12} 177 h24 v2.8 h-24z`} fill="#b98a55" stroke={INK} strokeWidth=".6" />
            <path d={`M${x - 10} 179.8 h4.4 v3.4 h-4.4z M${x + 5.6} 179.8 h4.4 v3.4 h-4.4z`} fill="#7d5730" stroke={INK} strokeWidth=".5" />
            <path d={`M${x - 4} 176 l4 -3 l4 3`} fill="none" stroke={c2} strokeWidth="1.1" />
          </g>
        ))}
        <path d="M66 122 L134 122 C141 140 147 156 151 171 L106 171 L100 150 L94 171 L49 171 C53 156 59 140 66 122Z" fill={u('hk')} stroke={INK} strokeWidth=".9" strokeLinejoin="round" />
        <path d="M74 125 L60 169 M84 125 L78 169 M116 125 L122 169 M126 125 L140 169" stroke={dk(c2, 55)} strokeWidth=".8" opacity=".8" />
        <path d="M72 125 L57 166 M124 125 L137 166" stroke={lt(c2, 25)} strokeWidth=".6" opacity=".5" />
        <g className={an(still, 'bsm-breathe')} style={origin(100, 130)}>
          {/* robe, armour under it, kesa */}
          <path d="M66 90 Q100 82 134 90 L138 127 Q100 133 62 127Z" fill={u('rb')} stroke={INK} strokeWidth=".9" />
          <path d="M89 87 L100 117 L111 87Z" fill={u('ir')} stroke={INK} strokeWidth=".6" />
          <path d="M91 92 h18 M93.4 98 h13.2 M95.6 104 h8.8 M97.6 110 h4.8" stroke={c2} strokeWidth="1" />
          <path d="M91 95 h18 M93.4 101 h13.2 M95.6 107 h8.8" stroke={INK} strokeWidth=".5" strokeDasharray="1 1.4" />
          <path d="M86 86 L100 119 L114 86" fill="none" stroke={lt(c, 40)} strokeWidth="3.4" strokeLinejoin="round" />
          <path d="M86 86 L100 119 L114 86" fill="none" stroke={fold} strokeWidth=".7" />
          <path d="M70 92 L80 86 L137 121 L131 129Z" fill={u('g')} stroke={INK} strokeWidth=".8" strokeLinejoin="round" />
          <path d="M84.6 94 l-5 7.4 M96.6 101.4 l-5 7.4 M108.6 108.8 l-5 7.4 M120.6 116.2 l-5 7.4" stroke={lt(c2, 45)} strokeWidth=".8" />
          <path d="M74 91 L133 126" stroke={lt(c2, 45)} strokeWidth=".5" strokeDasharray="1.4 1.2" />
          <circle cx="81" cy="93" r="3.2" fill="none" stroke="#e0b765" strokeWidth="1.4" />
          <path d="M62 124 Q100 130 138 124 L138.6 131 Q100 137 61.4 131Z" fill={dk(c2, 30)} stroke={INK} strokeWidth=".7" />
          {/* sleeves */}
          <path d="M68 90 C56 94 48 106 46 120 L42 152 C52 158 64 156 72 150 L74 118Z" fill={u('rb')} stroke={INK} strokeWidth=".9" strokeLinejoin="round" />
          <path d="M56 104 C52 120 50 136 49.6 150 M64 112 L65.6 151" fill="none" stroke={fold} strokeWidth=".8" />
          <path d="M42 152 C52 158 64 156 72 150 C64 152.6 52 153.6 42 152Z" fill={dk(c, 40)} />
          <path d="M132 90 C143 93 150 101 153 111 L157 140 C149 146 137 145 129 139 L127 117Z" fill={u('rb')} stroke={INK} strokeWidth=".9" strokeLinejoin="round" />
          <path d="M141 100 C145 112 147 126 148 142 M134 108 L134.6 140" fill="none" stroke={fold} strokeWidth=".8" />
          <path d="M129 139 C137 145 149 146 157 140 C149 142.6 137 142.6 129 139Z" fill={dk(c, 40)} />
          {mk >= 2 && beads.filter((b) => b.back).map(bead)}
          {/* cowl */}
          <path d="M70 72 C64 46 80 28 100 28 C120 28 136 46 130 72 C134 86 141 93 147 97 Q100 110 53 97 C59 93 66 86 70 72Z" fill={u('rb')} stroke={INK} strokeWidth=".9" strokeLinejoin="round" />
          <path d="M72 78 C78 88 88 94 100 95 C112 94 122 88 128 78 M66 88 C76 96 88 100 100 100.6 M134 88 C124 96 112 100 100 100.6 M80 34 C74 42 72 54 73 66" fill="none" stroke={fold} strokeWidth=".8" />
          <path d="M84 33 C90 30 96 29 102 29" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M70 47 C84 35 114 32 130 42 L130.4 48 C114 39 86 41 70.6 53Z" fill={lt(c, 22)} stroke={fold} strokeWidth=".7" />
          <path d="M74 44 C88 36 112 35 126 41" fill="none" stroke={fold} strokeWidth=".5" opacity=".7" />
          <path d="M71 74 C86 66 112 63 129 68 L128.4 74 C112 69 88 72 72 80Z" fill={lt(c, 18)} stroke={fold} strokeWidth=".7" />
          <path d="M81 50 Q100 44 119 50 L118 64 Q100 59.4 82 64Z" fill={INK} />
          <path d="M83.6 52.6 Q90 48.6 96.4 52.2 M103.6 52.2 Q110 48.6 116.4 52.6" fill="none" stroke={lt(c, 25)} strokeWidth={happy ? 2 : 2.4} strokeLinecap="round" />
          <g filter={`url(#${uid}-gl)`}>
            <Eyes still={still}>
              {happy ? (
                <path d="M85.6 58.4 Q90.4 54 95.2 58.4 M104.8 58.4 Q109.6 54 114.4 58.4" fill="none" stroke={eye} strokeWidth="1.8" strokeLinecap="round" />
              ) : (
                <path d="M86 57 Q90.6 54.6 95.2 57 Q90.6 59.6 86 57Z M114 57 Q109.4 54.6 104.8 57 Q109.4 59.6 114 57Z" fill={eye} />
              )}
            </Eyes>
          </g>
                    {happy && <path d="M88 67.6 Q100 73 112 67.6" fill="none" stroke={fold} strokeWidth="1" strokeLinecap="round" />}
          {mk >= 2 && (
            <g>
              <path d="M100 131 V137" stroke={INK} strokeWidth="1" />
              <path d="M96 137 h8 l2.4 15 h-12.8z" fill={u('g')} stroke={INK} strokeWidth=".6" />
              <path d="M98 139 l-.8 12 M100 139 v12.6 M102 139 l.8 12" stroke={dk(c2, 35)} strokeWidth=".5" />
              {beads.filter((b) => !b.back).map(bead)}
              <circle cx="100" cy="129" r="7" fill={u('wd')} stroke={INK} strokeWidth=".7" />
              <ellipse cx="97.8" cy="126.4" rx="2.2" ry="1.3" fill="#fff" opacity=".45" />
            </g>
          )}
          {/* hands: one raised in prayer, one on the staff */}
          <path d={limb(66, 124, 88, 108, 9, 8)} fill={u('ir')} stroke={INK} strokeWidth=".8" />
          <path d={limb(71, 119.6, 83, 111.2, 5.6)} fill={u('gh')} stroke={INK} strokeWidth=".5" />
          <path d="M86 106 L86 92 Q86 88.6 88.3 88.6 Q90.4 88.6 90.6 91 L90.8 88 Q91 85.8 93 86 Q95.2 86.2 95.2 89 L95.2 105 Q90.6 109 86 106Z" fill={u('ir')} stroke={INK} strokeWidth=".7" strokeLinejoin="round" />
          <path d="M86 98.6 q-3.4 -1.4 -3.8 2.2 q.4 3.4 3.8 3.6" fill={u('ir')} stroke={INK} strokeWidth=".6" />
          <path d="M88.4 91 V100 M90.7 90 V100 M93 89 V100" stroke="#fff" strokeOpacity=".3" strokeWidth=".5" />
          <path d="M86 103 Q90.6 106 95.2 103" fill="none" stroke={c2} strokeWidth="1.2" />
          <path d={limb(142, 124, 149, 110, 9, 8)} fill={u('ir')} stroke={INK} strokeWidth=".8" />
          <path d="M143.4 104.6 h11.2 q2.2 0 2.2 2.2 v7 q0 2.2 -2.2 2.2 h-11.2 q-2.2 0 -2.2 -2.2 v-7 q0 -2.2 2.2 -2.2z" fill={u('ir')} stroke={INK} strokeWidth=".7" />
          <path d="M145.2 105 V115.6 M148.6 105 V115.6 M152 105 V115.6" stroke={INK} strokeWidth=".5" opacity=".7" />
          <path d="M143 106.4 h12" stroke="#fff" strokeOpacity=".3" strokeWidth=".6" />
        </g>
      </g>
    </g>
  );
}

// ─── Shōgun ─────────────────────────────────────────────────────────────────
const ANTLER = 'M80 44 C70 36 60 26 53 10 M68 33 C60 29 50 30 40 35 M60 23 C54 18 45 16 36 19 M55 15 C55 10 57 6 61 3';

function Shogun({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const u = (s: string) => `url(#${uid}-${s})`;
  const eye = lt(c2, 52);
  const crimson = '#9e1b2b';
  const arm =
    mk === 3 ? (
      <g>
        <path d={limb(64, 92, 56, 116, 13, 11)} fill={u('h')} stroke={INK} strokeWidth=".9" />
        <path d={limb(56, 116, 60, 136, 11, 10)} fill={u('h')} stroke={INK} strokeWidth=".9" />
        <path d={limb(57, 121, 59.4, 131, 7.4)} fill={u('gh')} stroke={INK} strokeWidth=".5" />
        <circle cx="56" cy="116" r="4.6" fill={u('gh')} stroke={INK} strokeWidth=".7" />
        <g transform="translate(60 138) rotate(-122) scale(1.2)">
          <Katana L={78} blade={u('bl')} wrap={c2} metal={u('gh')} />
        </g>
        <circle cx="60" cy="138" r="6.4" fill={u('h')} stroke={INK} strokeWidth=".8" />
        <path d="M55 136 l10 3.6 M55 139.4 l9 3.2" stroke={INK} strokeWidth=".5" opacity=".7" />
      </g>
    ) : (
      <g>
        <path d={limb(64, 92, 62, 116, 13, 11)} fill={u('h')} stroke={INK} strokeWidth=".9" />
        <path d={limb(62, 116, 93, 107, 11, 9.5)} fill={u('h')} stroke={INK} strokeWidth=".9" />
        <path d={limb(70, 113.6, 86, 109.2, 7)} fill={u('gh')} stroke={INK} strokeWidth=".5" />
        <path d="M74 111 v4.6 M78 110 v4.6 M82 109 v4.6" stroke={INK} strokeWidth=".5" opacity=".6" />
        <circle cx="62" cy="116" r="4.6" fill={u('gh')} stroke={INK} strokeWidth=".7" />
        <circle cx="94" cy="106" r="6.4" fill={u('h')} stroke={INK} strokeWidth=".8" />
        <path d="M90 102.4 v7.4 M93.4 101 v9 M96.8 101 v9" stroke={INK} strokeWidth=".5" opacity=".7" />
      </g>
    );
  const sode = (
    <g transform="rotate(15 67 86)">
      {range(5).map((i) => (
        <Plates key={i} x={42} y={89 + i * 7.6} w={25} h={8.2} n={1} k={2} fill={u('v')} rivet={c2} />
      ))}
      <path d="M42 127 Q54.5 129 67 127" fill="none" stroke={c2} strokeWidth="1.4" />
      <path d="M41 83 H68 V90 H41Z" fill={u('v')} stroke={INK} strokeWidth=".8" />
      <path d="M41.5 83.6 H67.5 M41.5 89.4 H67.5" stroke={c2} strokeWidth="1" />
      <circle cx="54.5" cy="86.5" r="2" fill={u('gh')} stroke={INK} strokeWidth=".4" />
    </g>
  );
  return (
    <g>
      <defs>
        <Kit uid={uid} c={c} c2={c2} />
        <Lin id={`${uid}-jb`} stops={lacq(mix(c, c2, 84))} />
        <Lin id={`${uid}-sc`} stops={[
          [0, dk(c2, 12)],
          [0.5, lt(c2, 30)],
          [1, c2],
        ]} h />
        <Lin id={`${uid}-sc2`} stops={[
          [0, dk(c2, 38)],
          [1, dk(c2, 14)],
        ]} h />
        <Lin id={`${uid}-bl`} stops={[
          [0, '#f7f9fc'],
          [0.45, '#c9d0da'],
          [0.6, '#8b95a4'],
          [1, '#e1e6ee'],
        ]} />
      </defs>
      {/* byōbu: a folding gold screen */}
      {mk === 3 && (
        <g>
          {range(6).map((i) => {
            const x0 = f(6 + i * 31.33);
            const x1 = f(6 + (i + 1) * 31.33);
            const a = i % 2 === 0;
            const [t0, t1, b0, b1] = a ? [16, 22, 156, 150] : [22, 16, 150, 156];
            return (
              <g key={i}>
                <path d={`M${x0} ${t0} L${x1} ${t1} L${x1} ${b1} L${x0} ${b0}Z`} fill={a ? u('sc') : u('sc2')} stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
                <path d={`M${x0 + 2.6} ${t0 + 3} L${x1 - 2.6} ${t1 + 3} L${x1 - 2.6} ${b1 - 3} L${x0 + 2.6} ${b0 - 3}Z`} fill="none" stroke={dk(c2, 45)} strokeWidth=".6" />
              </g>
            );
          })}
          <circle cx="164" cy="50" r="13" fill="#c8321e" />
          <circle cx="164" cy="50" r="13" fill="none" stroke="#f08a5a" strokeWidth="1" opacity=".7" />
          <path d="M16 58 H58 A5 5 0 0 1 58 68 H16 A5 5 0 0 1 16 58Z M124 96 H186 A5 5 0 0 1 186 106 H124 A5 5 0 0 1 124 96Z M30 126 H86 A4 4 0 0 1 86 134 H30 A4 4 0 0 1 30 126Z M128 28 H150 A4 4 0 0 1 150 36 H128 A4 4 0 0 1 128 28Z M150 132 H184 A4 4 0 0 1 184 140 H150 A4 4 0 0 1 150 132Z" fill={lt(c2, 55)} opacity=".85" />
          <path d="M12 150 C20 128 16 110 30 96 C40 86 52 88 62 80" fill="none" stroke="#4a3424" strokeWidth="4" strokeLinecap="round" />
          {[
            [28, 94, 11],
            [46, 84, 10],
            [62, 78, 8],
            [20, 112, 8],
          ].map(([x, y, r]) => (
            <g key={x}>
              <ellipse cx={x} cy={y} rx={r} ry={r * 0.55} fill="#2f4a2c" />
              <ellipse cx={x - 1} cy={y - 1.6} rx={r * 0.75} ry={r * 0.3} fill="#4f6e3e" />
            </g>
          ))}
          {[37.3, 68.7, 100, 131.3, 162.7].map((x, i) => (
            <circle key={x} cx={x} cy={i % 2 ? 22 : 22} r="1.4" fill={dk(c2, 30)} />
          ))}
        </g>
      )}
      <Shadow rx={mk === 3 ? 70 : 58} />
      <g filter={`url(#${uid}-ol)`}>
        {/* jinbaori */}
        {mk >= 2 &&
          [0, 1].map((m) => (
            <g key={m} transform={m ? MIR : undefined}>
              <path d="M70 84 C52 86 40 100 38 124 L36 168 L60 172 L66 126Z" fill={u('jb')} stroke={INK} strokeWidth=".9" strokeLinejoin="round" />
              <path d="M66 126 L60 172 L54.6 171.4 L60.6 125Z" fill={crimson} />
              <path d="M36 168 L60 172" stroke={c2} strokeWidth="1.8" />
              <path d="M44 104 C40 120 39 140 39 164" fill="none" stroke={lt(mix(c, c2, 84), 25)} strokeWidth=".7" />
              <circle cx="48" cy="150" r="5" fill="none" stroke={c2} strokeWidth="1.1" />
              <path d="M48 146 v8 M44 150 h8" stroke={c2} strokeWidth=".9" />
            </g>
          ))}
        {/* legs */}
        {[78, 122].map((x) => (
          <g key={x}>
            <path d={`M${x - 11} 144 L${x + 11} 144 L${x + 9} 158 L${x - 9} 158Z`} fill={u('h')} stroke={INK} strokeWidth=".8" />
            <path d={`M${x - 10} 148 h20 M${x - 9.5} 152.6 h19`} stroke={c2} strokeWidth=".6" strokeDasharray="0 3" strokeLinecap="round" />
            <path d={`M${x - 8} 156 L${x + 8} 156 L${x + 7} 174 L${x - 7} 174Z`} fill={u('h')} stroke={INK} strokeWidth=".8" />
            <path d={`M${x - 4} 160 V172 M${x} 160 V173 M${x + 4} 160 V172`} stroke={c2} strokeWidth=".9" />
            <path d={`M${x - 9.5} 150 Q${x} 143 ${x + 9.5} 150 L${x + 8.5} 161 Q${x} 157 ${x - 8.5} 161Z`} fill={u('g')} stroke={INK} strokeWidth=".7" />
            <path d={`M${x - 11} 182 v-3 q0 -6 6 -6 h10 q6 0 6 6 v3Z`} fill={u('v')} stroke={INK} strokeWidth=".8" />
            <path d={`M${x - 6} 174 l6 3.6 l6 -3.6 M${x - 12} 182 h24`} fill="none" stroke={c2} strokeWidth="1.1" />
          </g>
        ))}
        {/* kusazuri */}
        {[
          [64, -12],
          [136, 12],
          [82, -5],
          [118, 5],
          [100, 0],
        ].map(([x, r]) => (
          <g key={x} transform={`rotate(${r} ${x} 124)`}>
            {range(4).map((i) => (
              <Plates key={i} x={x - 10.5} y={124 + i * 6.6} w={21} h={7.2} n={1} k={1.4} fill={u('v')} rivet={c2} />
            ))}
            <path d={`M${x - 10.5} 151.6 Q${x} 152.8 ${x + 10.5} 151.6`} fill="none" stroke={c2} strokeWidth="1.4" />
          </g>
        ))}
        <g className={an(still, 'bsm-breathe')} style={origin(100, 130)}>
          {/* dō: solid lacquered bands, gold rivets, the clan mon */}
          {range(6).map((i) => (
            <Plates key={i} x={64} y={84 + i * 7} w={72} h={7.6} n={1} k={3} fill={u('v')} rivet={c2} />
          ))}
          <path d="M72 79 Q100 74 128 79 L127 88 Q100 83 73 88Z" fill={u('v')} stroke={INK} strokeWidth=".8" />
          <path d="M72.6 79.8 Q100 74.8 127.4 79.8" fill="none" stroke={c2} strokeWidth="1.2" />
          {mk >= 2 &&
            [0, 1].map((m) => (
              <g key={m} transform={m ? MIR : undefined}>
                <path d="M71 83 L81 84.6 L79.4 125 L69.4 126Z" fill={u('jb')} stroke={INK} strokeWidth=".8" />
                <path d="M80.4 85 L78.8 124.6" stroke={c2} strokeWidth="1.3" />
              </g>
            ))}
          <circle cx="100" cy="105" r="9.6" fill={u('g')} stroke={INK} strokeWidth=".9" />
          {range(5).map((i) => {
            const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
            return <circle key={i} cx={f(100 + 4.4 * Math.cos(a))} cy={f(105 + 4.4 * Math.sin(a))} r="2.8" fill={c} stroke={dk(c2, 30)} strokeWidth=".4" />;
          })}
          <circle cx="100" cy="105" r="1.8" fill={u('g')} />
          <path d="M64 124 Q100 130 136 124 L136 131 Q100 137 64 131Z" fill={dk(c, 10)} stroke={INK} strokeWidth=".8" />
          <path d="M64 127.4 Q100 133.4 136 127.4" fill="none" stroke={c2} strokeWidth="1.2" />
          {/* the tachi, planted point down */}
          {mk < 3 && (
            <g>
              <path d="M97.6 130 h4.8 v50 h-4.8z" fill={u('h')} stroke={INK} strokeWidth=".7" />
              <path d="M97.4 130 h5.2 v3 h-5.2z M97.4 140 h5.2 v2 h-5.2z M97.4 152 h5.2 v2 h-5.2z M97.2 175 h5.6 v6 h-5.6z" fill={u('gh')} />
              <path d="M102 141 q6 4 3 12 q-2 4 1 8" fill="none" stroke={c2} strokeWidth="1.1" />
              <ellipse cx="100" cy="128" rx="7.4" ry="2.4" fill={u('g')} stroke={INK} strokeWidth=".7" />
              <path d="M97 104 h6 v22 h-6z" fill={INK} />
              <path d="M97.4 106 l5.2 4 l-5.2 4 l5.2 4 l-5.2 4 l5.2 4" fill="none" stroke={c2} strokeWidth=".8" />
              <rect x="96.4" y="100" width="7.2" height="4" rx="1.6" fill={u('gh')} stroke={INK} strokeWidth=".5" />
            </g>
          )}
          {arm}
          <g transform={MIR}>{arm}</g>
          {sode}
          <g transform={MIR}>{sode}</g>
          {/* head */}
          {[3, 2, 1, 0].map((i) => (
            <g key={i}>
              <Plates x={68 - i * 9} y={54 + i * 7} w={64 + i * 18} h={8.6} n={1} k={10 + i * 2} fill={u('v')} rivet={c2} />
              <path d={`M${68 - i * 9} ${62.4 + i * 7} Q100 ${72.4 + i * 9} ${132 + i * 9} ${62.4 + i * 7}`} fill="none" stroke={c2} strokeWidth="1" />
            </g>
          ))}
          {[0, 1].map((m) => (
            <g key={m} transform={m ? MIR : undefined}>
              <path d="M74 58 C64 58 54 52 49 41 C58 39 68 43 77 51Z" fill={u('v')} stroke={c2} strokeWidth="1.6" strokeLinejoin="round" />
              <circle cx="60" cy="47" r="3" fill={u('gh')} stroke={INK} strokeWidth=".5" />
            </g>
          ))}
          {mk >= 2 &&
            [0, 1].map((m) => (
              <g key={m} transform={m ? MIR : undefined}>
                <path d={ANTLER} fill="none" stroke={INK} strokeWidth="5.6" strokeLinecap="round" />
                <path d={ANTLER} fill="none" stroke={u('gh')} strokeWidth="3.6" strokeLinecap="round" />
                <path d={ANTLER} fill="none" stroke={lt(c2, 60)} strokeWidth=".7" strokeLinecap="round" transform="translate(-.7 -.6)" />
              </g>
            ))}
          <path d="M70 58 C70 36 84 26 100 26 C116 26 130 36 130 58Z" fill={u('h')} stroke={INK} strokeWidth=".9" />
          <path
            d={range(9)
              .map((i) => `M${100 + (i - 4) * 1.6} 27.5 Q${100 + (i - 4) * 5.6} 38 ${100 + (i - 4) * 7.2} 57.5`)
              .join('')}
            fill="none"
            stroke={c2}
            strokeOpacity=".55"
            strokeWidth=".6"
          />
          <path d="M72 55 Q100 51 128 55" fill="none" stroke={c2} strokeWidth="1.5" strokeDasharray="0 3.2" strokeLinecap="round" />
          <circle cx="100" cy="27" r="3.2" fill={u('gh')} stroke={INK} strokeWidth=".6" />
          <path d="M66 59 Q100 49 134 59 L131 65 Q100 56 69 65Z" fill={u('v')} stroke={INK} strokeWidth=".8" />
          <path d="M67 59.4 Q100 49.8 133 59.4" fill="none" stroke={c2} strokeWidth="1.3" />
          {/* nichirin maedate */}
          <path d="M96 56 L100 49 L104 56Z" fill={u('gh')} />
          <circle cx="100" cy="41" r="9.4" fill={u('g')} stroke={INK} strokeWidth=".8" />
          <circle cx="100" cy="41" r="6.4" fill="none" stroke={dk(c2, 30)} strokeWidth=".7" />
          <circle cx="100" cy="41" r="4" fill="#c8321e" />
          <path d="M95.6 37 a6 6 0 0 1 5 -2.4" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth=".9" strokeLinecap="round" />
          {/* face */}
          <path d="M76 62 Q100 56 124 62 L121 84 Q100 94 79 84Z" fill={INK} />
          <path d={happy ? 'M81 64 L95 63 M119 64 L105 63' : 'M81 63 L96 67.2 M119 63 L104 67.2'} stroke={c2} strokeWidth="1.7" strokeLinecap="round" />
          <g filter={`url(#${uid}-gl)`}>
            <Eyes still={still}>
              {happy ? (
                <path d="M83.6 70.4 Q89.6 64.6 95.6 70.4 M104.4 70.4 Q110.4 64.6 116.4 70.4" fill="none" stroke={eye} strokeWidth="2.2" strokeLinecap="round" />
              ) : (
                <path d="M83 67 L96 70 L95.2 72.8 L83.6 70.8Z M117 67 L104 70 L104.8 72.8 L116.4 70.8Z" fill={eye} />
              )}
            </Eyes>
          </g>
          {range(3).map((i) => (
            <Plates key={i} x={84 - i * 2} y={86 + i * 4.6} w={32 + i * 4} h={5} n={1} k={2.4} fill={u('v')} rivet={c2} />
          ))}
          <path d="M80 72 Q100 69 120 72 L118 84 Q100 95 82 84Z" fill={u('h')} stroke={INK} strokeWidth=".8" />
          <path d="M97.6 71 L100 77.4 L102.4 71" fill={dk(c, 10)} stroke={INK} strokeWidth=".5" />
          <path
            d={
              happy
                ? 'M100 78.4 C93 75 85 74 78 67 C82 77 92 81 100 80.4 C108 81 118 77 122 67 C115 74 107 75 100 78.4Z'
                : 'M100 77.6 C92 74.6 84 76 80 72 C82 81 92 81 100 79.6 C108 81 118 81 120 72 C116 76 108 74.6 100 77.6Z'
            }
            fill={u('g')}
            stroke={INK}
            strokeWidth=".5"
          />
          {happy ? (
            <g>
              <path d="M90 83 Q100 93 110 83Z" fill={INK} />
              <path d="M91.6 83.6 H108.4 L107 85.8 H93Z" fill={u('gh')} />
            </g>
          ) : (
            <g>
              <path d="M92 84 Q100 82.4 108 84 L106.4 87.4 Q100 86.2 93.6 87.4Z" fill={INK} />
              <path d="M94 84.2 v2.6 M97.4 83.6 v2.8 M100 83.4 v2.8 M102.6 83.6 v2.8 M106 84.2 v2.6" stroke={c2} strokeWidth=".7" />
            </g>
          )}
        </g>
      </g>
    </g>
  );
}

// ─── The Last Rōnin ─────────────────────────────────────────────────────────
function Ronin({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const u = (s: string) => `url(#${uid}-${s})`;
  const glow = lt(c2, 28);
  const hair = mix(c, '#0b0a0e', 24);
  const scar = lt(c, 42);
  const band = mix(c2, c, 70);
  const rain = mix(c, 'var(--fg)', 45);
  // the cyber arm: shoulder, elbow, hand
  const [ex, ey, hx, hy] = mk === 3 ? [140, 104, 152, 112] : [131, 111, 108, 114];
  return (
    <g>
      <defs>
        <Kit uid={uid} c={c} c2={c2} glow={1.8} />
        <Lin id={`${uid}-hr`} stops={lacq(dk(c, 30))} />
        <Lin id={`${uid}-hk`} stops={lacq(dk(c, 42))} />
        <Lin id={`${uid}-hair`} stops={lacq(hair)} />
        <Lin id={`${uid}-sw`} stops={lacq('#d9b86c')} />
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix(c, '#05070b', 45)} stopOpacity=".95" />
          <stop offset=".55" stopColor={mix(c, '#05070b', 55)} stopOpacity=".6" />
          <stop offset="1" stopColor={mix(c, '#05070b', 55)} stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${uid}-moon`}>
          <stop offset="0" stopColor={lt(c2, 20)} stopOpacity=".9" />
          <stop offset=".7" stopColor={c2} stopOpacity=".55" />
          <stop offset="1" stopColor={c2} stopOpacity="0" />
        </radialGradient>
        {/* the storm fades out at the edges, so it sits in any frame */}
        <radialGradient id={`${uid}-fade`} cx=".5" cy=".46" r=".5">
          <stop offset=".62" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id={`${uid}-rc`} maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200">
          <rect x="0" y="0" width="200" height="200" fill={`url(#${uid}-fade)`} />
        </mask>
      </defs>
      {/* the storm */}
      {mk === 3 && (
        <g mask={`url(#${uid}-rc)`}>
          <rect x="0" y="0" width="200" height="200" fill={`url(#${uid}-sky)`} />
          <circle cx="128" cy="62" r="38" fill={`url(#${uid}-moon)`} />
          <circle cx="128" cy="62" r="26" fill="none" stroke={lt(c2, 30)} strokeWidth=".6" opacity=".6" />
          <path d="M2 32 C8 16 24 12 34 20 C40 6 62 2 72 14 C82 2 104 2 112 14 C122 4 146 4 154 16 C164 6 188 8 198 22 V40 C172 48 140 40 110 46 C80 50 40 42 2 48Z" fill={mix(c, '#05070b', 40)} opacity=".92" />
          <path d="M34 20 C38 26 44 28 50 27 M72 14 C76 20 84 22 90 20 M112 14 C116 22 126 24 132 22 M154 16 C158 22 168 24 174 22" fill="none" stroke={lt(c, 20)} strokeWidth=".9" opacity=".7" />
          <path d="M8 46 C40 40 80 48 110 44 C140 40 172 46 196 38" fill="none" stroke={c2} strokeWidth="1" opacity=".5" />
          <g className={an(still, 'bsm-flash')}>
            <g filter={`url(#${uid}-gl)`}>
              <path d="M40 34 L30 60 L40 63 L25 98 L35 100 L21 136 M40 63 L50 78 L47 92 M170 36 L162 56 L170 58 L158 86" fill="none" stroke={c2} strokeWidth="3.6" strokeLinejoin="round" opacity=".6" />
              <path d="M40 34 L30 60 L40 63 L25 98 L35 100 L21 136 M40 63 L50 78 L47 92 M170 36 L162 56 L170 58 L158 86" fill="none" stroke="#fffbe8" strokeWidth="1.5" strokeLinejoin="round" />
            </g>
          </g>
          <g className={an(still, 'bsm-rain-a')}>
            {range(20).map((i) => (
              <path key={i} d={`M${4 + i * 16} -80 l-100 300`} stroke={lt(c, 50)} strokeWidth=".7" strokeDasharray="9 27" strokeDashoffset={(i * 13) % 36} opacity=".5" />
            ))}
          </g>
        </g>
      )}
      <Shadow rx={mk === 3 ? 64 : 52} />
      <g filter={`url(#${uid}-ol)`}>
        {/* hair and headband tails, streaming back */}
        <g className={an(still, 'bsm-sway')} style={origin(104, 40)}>
          <path d="M106 36 C96 26 80 28 72 40 C66 50 64 62 55 70 C66 68 72 60 76 52 C71 64 70 72 63 81 C76 75 82 63 86 51 C90 43 98 39 106 41Z" fill={u('hair')} stroke={INK} strokeWidth=".8" />
          <path d="M96 33 C84 34 76 44 72 56 M92 38 C84 44 80 54 76 64" fill="none" stroke={lt(hair, 40)} strokeWidth=".6" />
        </g>
        <g className={an(still, 'bsm-flutter')} style={origin(84, 45)}>
          <path d="M85 43 C74 38 64 46 52 41 L55.6 46.6 L50 49 C62 53 74 49 85 47.6Z" fill={band} stroke={INK} strokeWidth=".7" />
          <path d="M85 46 C78 50 70 58 60 59 L62 63 L57.6 66 C68 65 78 56 85.6 49Z" fill={band} stroke={INK} strokeWidth=".7" />
        </g>
        {/* haori, the back of it */}
        {mk >= 2 && (
          <g>
            <path d="M78 88 C64 92 58 110 56 138 L54 160 L60 155 L64 162 L70 154 L74 158 L76 130Z" fill={u('hr')} stroke={INK} strokeWidth=".8" strokeLinejoin="round" />
            <path d="M122 88 C136 92 142 110 144 136 L146 154 L140 150 L136 158 L132 150 L126 154 L124 128Z" fill={u('hr')} stroke={INK} strokeWidth=".8" strokeLinejoin="round" />
            <path d="M64 112 C62 126 61 140 60 152 M136 112 C138 126 139 138 140 148" fill="none" stroke={lt(c, 8)} strokeWidth=".6" />
          </g>
        )}
        {/* the scabbard at the hip */}
        <path d={limb(93, 124, 44, 151, 5.6, 4.6)} fill={u('ir')} stroke={INK} strokeWidth=".7" />
        <path d="M80 131.6 L56 144.6" stroke={scar} strokeWidth=".5" opacity=".7" />
        <path d={limb(48, 148.8, 43.4, 151.4, 5.4)} fill={u('gh')} stroke={INK} strokeWidth=".4" />
        <path d="M86 128 q-6 10 -14 8 q-6 -2 -10 6" fill="none" stroke={c2} strokeWidth="1" opacity=".85" />
        {/* hakama, frayed, and sandals */}
        {[80, 122].map((x) => (
          <g key={x}>
            <path d={`M${x - 5.6} 166 h11.2 v10 h-11.2z`} fill={dk(c, 20)} stroke={INK} strokeWidth=".6" />
            <path d={`M${x - 5.6} 168 l11.2 3 M${x - 5.6} 172 l11.2 -3`} stroke={scar} strokeWidth=".6" />
            <path d={`M${x - 10} 182 v-2 q0 -4.4 5 -4.4 h10 q5 0 5 4.4 v2Z`} fill={dk(c, 25)} stroke={INK} strokeWidth=".7" />
            <path d={`M${x - 11} 182 h22`} stroke="#c9a65e" strokeWidth="1.8" strokeLinecap="round" />
            <path d={`M${x - 4} 177 l4 -2.6 l4 2.6`} fill="none" stroke="#c9a65e" strokeWidth=".9" />
          </g>
        ))}
        <path d="M80 120 L120 120 C126 138 132 154 137 170 L131 168 L127 173 L121 168 L115 172 L108 168 L100 146 L94 169 L87 172 L82 167 L76 172 L70 168 L64 171 C68 156 74 138 80 120Z" fill={u('hk')} stroke={INK} strokeWidth=".9" strokeLinejoin="round" />
        <path d="M88 122 L78 168 M93 122 L90 168 M107 122 L112 167 M113 122 L124 168" stroke={dk(c, 60)} strokeWidth=".7" opacity=".8" />
        <path d="M74 150 l4 3 M118 156 l3 -4 M126 148 l2 3" stroke={scar} strokeWidth=".5" />
        <g className={an(still, 'bsm-breathe')} style={origin(100, 130)}>
          {/* weathered dō */}
          <path d="M80 86 Q100 80 120 86 L118 122 Q100 128 82 122Z" fill={u('h')} stroke={INK} strokeWidth=".9" />
          <path d="M81 95 Q100 90 119 95 M81.5 104 Q100 99 118.5 104 M82 113 Q100 108 118 113" fill="none" stroke={INK} strokeWidth=".7" />
          <path d="M81.4 96 Q100 91 118.6 96 M81.9 105 Q100 100 118.1 105" fill="none" stroke="#fff" strokeOpacity=".25" strokeWidth=".6" />
          <path d="M87 90 l6 5 M89.4 89.4 l4 3.6 M111 106 l-5 7 M113 108 l-3 5 M84 108 l7 -2" stroke={scar} strokeWidth=".6" />
          <ellipse cx="108" cy="96.6" rx="3.2" ry="2" fill={dk(c, 30)} />
          <path d="M105.2 95.6 a3.4 2 0 0 1 5.6 0" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth=".5" />
          <circle cx="84.4" cy="90.6" r="1.2" fill={u('st')} />
          <circle cx="115.6" cy="90.6" r="1.2" fill={INK} />
          <circle cx="84" cy="118" r="1.2" fill={u('st')} />
          <g className={an(still, 'bsm-pulse')}>
            <path d="M95 99 L98.4 103 L96.4 107.4 L100.6 111.4 L98.6 116.6" fill="none" stroke={c2} strokeWidth="1.3" strokeLinejoin="round" filter={`url(#${uid}-gl)`} />
            <path d="M95 99 L98.4 103 L96.4 107.4 L100.6 111.4 L98.6 116.6" fill="none" stroke={lt(c2, 60)} strokeWidth=".5" strokeLinejoin="round" />
          </g>
          {mk >= 2 && (
            <g>
              <path d="M82 84 L90 84 L96.4 120 L90.4 121Z M118 84 L110 84 L103.6 120 L109.6 121Z" fill={u('hr')} stroke={INK} strokeWidth=".7" strokeLinejoin="round" />
              <path d="M89 85 L94.6 119.6 M111 85 L105.4 119.6" stroke={band} strokeWidth=".8" />
            </g>
          )}
          {/* straw rope belt */}
          <path d="M80 116 Q100 121 120 116 L120.5 124 Q100 129 79.5 124Z" fill={u('sw')} stroke={INK} strokeWidth=".7" />
          <path d="M80 118.6 Q100 123.6 120 118.6 M80 121.4 Q100 126.4 120 121.4" fill="none" stroke="#7d5f2c" strokeWidth=".7" strokeDasharray="1.6 1.4" />
          <path d="M115 123 q2 6 -1 11 M117 123 q3 5 2 10" fill="none" stroke="#c9a65e" strokeWidth="1.3" strokeLinecap="round" />
          {/* the hilt, waiting */}
          {mk < 3 && (
            <g transform="translate(94 121) rotate(-28)">
              <ellipse cx="0" cy="0" rx="1.9" ry="5.8" fill={u('ir')} stroke={INK} strokeWidth=".6" />
              <path d="M2 -2.4 H22 V2.4 H2Z" fill={INK} />
              <path d="M3 -2.2 l2.4 4.4 l2.4 -4.4 l2.4 4.4 l2.4 -4.4 l2.4 4.4 l2.4 -4.4 l2.4 4.4" fill="none" stroke={band} strokeWidth=".8" />
              <rect x="21" y="-2.8" width="3.4" height="5.6" rx="1.2" fill={u('st')} stroke={INK} strokeWidth=".5" />
            </g>
          )}
          {/* armoured arm, holding the scabbard */}
          <path d={limb(80, 90, 68, 110, 12, 10)} fill={u('ir')} stroke={INK} strokeWidth=".8" />
          <path d={limb(68, 110, 87, 126, 10, 9)} fill={u('ir')} stroke={INK} strokeWidth=".8" />
          <path d={limb(72, 113.6, 82.6, 122.4, 6.6)} fill={u('h')} stroke={INK} strokeWidth=".5" />
          <path d="M74 114 l2 4 M78 117 l1.6 4" stroke={scar} strokeWidth=".5" />
          <circle cx="68" cy="110" r="3.8" fill={u('h')} stroke={INK} strokeWidth=".6" />
          <circle cx="88" cy="126" r="5.2" fill={u('ir')} stroke={INK} strokeWidth=".7" />
          <path d="M84 124 h8 M84 127 h8" stroke="#fff" strokeOpacity=".25" strokeWidth=".5" />
          {/* one battered shoulder guard */}
          <g transform="rotate(8 82 86)">
            <Plates x={57} y={88} w={25} h={8.4} n={4} k={1.4} fill={u('v')} head={dk(c, 55)} lace={band} />
            <Plates x={57} y={95.6} w={25} h={8.4} n={4} k={1.4} fill={u('v')} head={dk(c, 55)} lace={band} />
            <Plates x={57} y={103.2} w={15} h={8.4} n={2} k={.8} fill={u('v')} head={dk(c, 55)} lace={band} />
            <path d="M74 103.4 q2 6 -1 10 M77.6 103.4 q1 5 3 7" fill="none" stroke={band} strokeWidth=".7" />
            <path d="M60 90 l7 5 M70 97 l5 4 M60 105 l4 3" stroke={scar} strokeWidth=".6" />
            <path d="M56 84 H83 V89 H56Z" fill={u('ir')} stroke={INK} strokeWidth=".7" />
          </g>
          {mk >= 2 && (
            <g>
              <path d="M76 85 C66 87 58 95 55 108 L52.6 132 L58 128.4 L62 134 L66 128 L71.6 132.6 L74 112Z" fill={u('hr')} stroke={INK} strokeWidth=".8" strokeLinejoin="round" />
              <path d="M59.6 112 h8 v7 h-8z" fill={lt(dk(c, 30), 18)} stroke={INK} strokeWidth=".5" />
              <path d="M60.6 113 h6 v5 h-6z" fill="none" stroke={band} strokeWidth=".5" strokeDasharray=".9 .9" />
              <path d="M62 96 C60 106 58 116 57 126" fill="none" stroke={lt(c, 8)} strokeWidth=".6" />
            </g>
          )}
          {/* the cyber arm */}
          <path d={limb(120, 90, ex, ey, 6.6, 6)} fill={u('st')} stroke={INK} strokeWidth=".7" />
          <path d={`M121 94 Q${(120 + ex) / 2 + 6} ${(90 + ey) / 2 + 2} ${ex + 1} ${ey + 3}`} fill="none" stroke={INK} strokeWidth="2.2" />
          <path d={`M121 94 Q${(120 + ex) / 2 + 6} ${(90 + ey) / 2 + 2} ${ex + 1} ${ey + 3}`} fill="none" stroke={c2} strokeWidth="1" />
          <path d={limb(ex, ey, hx, hy, 6.8, 6)} fill={u('st')} stroke={INK} strokeWidth=".7" />
          <path d={limb(ex + (hx - ex) * 0.2, ey + (hy - ey) * 0.2, ex + (hx - ex) * 0.7, ey + (hy - ey) * 0.7, 2.4)} fill={u('ir')} />
          <circle cx="120" cy="90" r="7" fill={u('st')} stroke={INK} strokeWidth=".8" />
          <circle cx="120" cy="90" r="3.6" fill={INK} />
          <circle cx="120" cy="90" r="2" fill={glow} filter={`url(#${uid}-gl)`} />
          <circle cx={ex} cy={ey} r="4.6" fill={u('ir')} stroke={INK} strokeWidth=".7" />
          <circle cx={ex} cy={ey} r="1.5" fill={glow} />
          {mk < 3 && (
            <g>
              <circle cx={hx} cy={hy} r="5.2" fill={u('st')} stroke={INK} strokeWidth=".7" />
              <path d={`M${hx - 2} ${hy - 4.6} v9.2 M${hx + 1} ${hy - 4.8} v9.6`} stroke={INK} strokeWidth=".55" />
            </g>
          )}
          {/* head */}
          <path d="M95 72 h10 v10 h-10z" fill={u('ir')} />
          <path d="M97 72 v10 M100 72 v10 M103 72 v10" stroke={c2} strokeWidth=".6" opacity=".7" />
          <path d="M83 52 C80 38 88 29 100 29 C112 29 121 38 117 52 L114.6 45 L111.4 48.6 L108.6 41.6 L104.6 46 L100.6 39.6 L96.4 46 L92.6 41.6 L89.4 48.4 L86 44.4Z" fill={u('hair')} stroke={INK} strokeWidth=".8" strokeLinejoin="round" />
          <path d="M84 53 C84 41 90 36 100 36 C110 36 116 41 116 53 C116 65 110 74 100 76 C90 74 84 65 84 53Z" fill={u('h')} stroke={INK} strokeWidth=".8" />
          <path d="M84 43 Q100 38 116 43 L116.4 47.4 Q100 42.6 83.6 47.4Z" fill={band} stroke={INK} strokeWidth=".6" />
          <path d="M98 41 l2 3 l1.6 -3.4" fill="none" stroke={dk(c2, 40)} strokeWidth=".5" />
          {/* the dead eye and its scar */}
          <path d="M103.6 54 Q108.4 51.6 113 54 Q108.4 56.6 103.6 54Z" fill={INK} />
          <path d="M106 52.6 l2 2.6 l1.4 -2" fill="none" stroke={scar} strokeWidth=".5" />
          <path d="M104 46 L113.6 65" stroke={scar} strokeWidth="1.1" strokeLinecap="round" />
          <path d="M106 50 l3 -1.2 M108.4 55 l3 -1.4 M110.6 59.6 l3 -1.4" stroke={scar} strokeWidth=".6" />
          {/* the eye that still burns */}
          <circle cx="92" cy="54" r="4" fill={INK} stroke={u('st')} strokeWidth=".8" />
          <g filter={`url(#${uid}-gl)`}>
            <Eyes still={still}>
              {happy ? (
                <path d="M88.6 55.6 Q92 51 95.4 55.6" fill="none" stroke={glow} strokeWidth="1.8" strokeLinecap="round" />
              ) : (
                <>
                  <circle cx="92" cy="54" r="2.3" fill={glow} />
                  <circle cx="92.6" cy="53.4" r=".8" fill="#fff" />
                </>
              )}
            </Eyes>
          </g>
          <path d="M88 64 Q100 67.6 112 64 L110.4 74 Q100 79 89.6 74Z" fill={u('ir')} stroke={INK} strokeWidth=".7" />
          <path d="M91 67.4 v5 M94 68 v6 M97 68.4 v6.4 M103 68.4 v6.4 M106 68 v6 M109 67.4 v5" stroke="#fff" strokeOpacity=".22" strokeWidth=".7" />
          {happy && <path d="M95 71.6 Q100 73.8 106 70.4" fill="none" stroke={glow} strokeWidth=".9" strokeLinecap="round" />}
          {/* kasa, pulled low */}
          {mk >= 2 && (
            <g>
              <path d="M84 50 Q100 54.4 116 50 L116 56 Q100 58.4 84 56Z" fill="#000" opacity=".35" />
              <path d="M62 50 Q74 72 90 75" fill="none" stroke={INK} strokeWidth=".6" />
              <g transform="rotate(-6 100 40)">
                <path d="M46 47 C62 53 138 53 154 47 C140 57 60 57 46 47Z" fill="#5a4320" />
                <path d="M46 47 C60 34 82 20 100 17 C118 20 140 34 154 47 C138 53 62 53 46 47Z" fill={u('sw')} stroke={INK} strokeWidth=".9" strokeLinejoin="round" />
                <path
                  d={range(11)
                    .map((i) => `M100 18.6 L${50 + i * 10} ${f(49 + 2.2 * Math.sin((i / 10) * Math.PI))}`)
                    .join('')}
                  stroke="#8a6a32"
                  strokeWidth=".5"
                  opacity=".8"
                />
                <path d="M60 41 Q100 30 140 41 M72 32 Q100 24 128 32" fill="none" stroke="#8a6a32" strokeWidth=".6" />
                <path d="M136 50.6 L140.6 44 L145.4 50.4Z" fill="#3a2c14" stroke={INK} strokeWidth=".5" />
                <path d="M46 47 l-5 2 M48 45 l-4.4 -1.4 M154 47 l4.4 2.6 M151 44.6 l4 -1" stroke="#c9a65e" strokeWidth=".7" strokeLinecap="round" />
                <path d="M84 24 C90 20 96 18.6 100 18.4" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="1" strokeLinecap="round" />
              </g>
            </g>
          )}
        </g>
      </g>
      {/* the blade, drawn and glowing */}
      {mk === 3 && (
        <g className={an(still, 'bsm-breathe')} style={origin(100, 130)}>
          <path d="M126 28 Q174 6 194 62" fill="none" stroke={c2} strokeWidth="1.4" opacity=".45" strokeLinecap="round" />
          <path d="M134 22 Q172 8 188 44" fill="none" stroke={glow} strokeWidth=".7" opacity=".6" strokeLinecap="round" />
          <path d="M90 53 L58 50.4 L58 51.6 L90 55.6Z" fill={glow} opacity=".55" />
          <g filter={`url(#${uid}-gl)`}>
            <g transform={`translate(${hx} ${hy}) rotate(-63)`}>
              <path className={an(still, 'bsm-pulse')} d="M13 -2 Q46 -3.4 84 -6.5 Q81 -1.4 75 .3 Q46 1 13 2Z" fill={c2} stroke={c2} strokeWidth="3" strokeLinejoin="round" opacity=".7" />
              <Katana L={84} blade={lt(c2, 62)} wrap={c2} metal="#9aa3ad" />
            </g>
            {[
              [170, 64, 1.2],
              [182, 50, 0.9],
              [164, 46, 0.8],
              [188, 30, 1],
            ].map(([x, y, r], i) => (
              <circle key={i} className={an(still, 'bsm-pulse')} style={origin(x, y, -i * 0.5)} cx={x} cy={y} r={r} fill={glow} />
            ))}
          </g>
          <circle cx={hx} cy={hy} r="5.2" fill={u('st')} stroke={INK} strokeWidth=".7" />
          <path d={`M${hx - 2} ${hy - 4.6} v9.2 M${hx + 1} ${hy - 4.8} v9.6`} stroke={INK} strokeWidth=".55" />
        </g>
      )}
      {mk === 3 && (
        <g clipPath={`url(#${uid}-rc)`}>
          <g className={an(still, 'bsm-rain-b')}>
            {range(13).map((i) => (
              <path key={i} d={`M${10 + i * 25} -80 l-100 300`} stroke={rain} strokeWidth="1.1" strokeDasharray="14 40" strokeDashoffset={(i * 23) % 54} opacity=".7" />
            ))}
          </g>
          {[
            [56, 183],
            [146, 184],
            [26, 181],
            [176, 182],
            [104, 187],
          ].map(([x, y], i) => (
            <ellipse key={i} className={an(still, 'bsm-splash')} style={origin(x, y, -i * 0.2)} cx={x} cy={y} rx="5" ry="1.3" fill="none" stroke={rain} strokeWidth=".8" />
          ))}
        </g>
      )}
    </g>
  );
}

export const SAMURAI: BotRegistry = {
  oyoroi: { Art: Oyoroi, head: { x: 100, y: 31, s: 0.86 } },
  kage: { Art: Kage, head: { x: 100, y: 30, s: 0.82 } },
  tomoe: { Art: Tomoe, head: { x: 100, y: 28, s: 0.58 } },
  sohei: { Art: Sohei, head: { x: 100, y: 29, s: 0.95 } },
  shogun: { Art: Shogun, head: { x: 100, y: 27, s: 1 } },
  ronin47: { Art: Ronin, head: { x: 100, y: 31, s: 0.62 } },
};
