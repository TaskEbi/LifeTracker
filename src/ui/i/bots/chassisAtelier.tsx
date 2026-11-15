import { useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from 'react';
import type { BotArtProps, BotRegistry } from './types';
import { frame, shader, vertexMesh, type Tone } from './poly3d';
import './chassisAtelier.css';

/**
 * The Atelier (M56): five bodies, each drawn another way. Crayon on paper, bent neon tubes, ink
 * and brush, an anime cel, and one in real 3D. Original designs.
 */

const KANJI = '"Yu Mincho", "Hiragino Mincho ProN", "Noto Serif JP", serif';
const dk = (c: string, n = 35) => `color-mix(in srgb, ${c} ${100 - n}%, #000)`;
const lt = (c: string, n = 35) => `color-mix(in srgb, ${c} ${100 - n}%, #fff)`;
const an = (still: boolean, cls: string) => (still ? undefined : cls);
const origin = (x: number, y: number): CSSProperties => ({ transformOrigin: `${x}px ${y}px` });
const MIR = 'matrix(-1 0 0 1 200 0)';
const calm = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
/** The same "random" numbers every time, so a drawing doesn't change between renders. */
const rng = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

function Eyes({ still, children }: { still: boolean; children: ReactNode }) {
  return (
    <g className="dr-gaze">
      <g className={still ? undefined : 'i-blink'}>{children}</g>
    </g>
  );
}

// ─── Rakugaki: crayon ───────────────────────────────────────────────────────
// A child's drawing. Every line wobbles, the colouring-in goes over the edges, and when it moves
// the lines "boil" the way hand-drawn animation does.

/** Colouring-in: one crayon line going back and forth across a box. */
function scribble(x: number, y: number, w: number, h: number, gap: number, seed: number) {
  const r = rng(seed);
  let d = '';
  for (let i = 0, yy = y; yy <= y + h; i++, yy += gap * (0.8 + r() * 0.4)) {
    const px = (i % 2 ? x + w : x) + (r() - 0.5) * 7;
    d += `${i ? 'L' : 'M'}${px.toFixed(1)} ${(yy + (r() - 0.5) * 2).toFixed(1)} `;
  }
  return d;
}

function Rakugaki({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const F = `${uid}-cr`;
  const boil = !still && !calm();
  const pen = { fill: 'none', stroke: 'var(--fg)', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  const wax = (col: string, w = 4.2) => ({ fill: 'none', stroke: col, strokeWidth: w, strokeLinecap: 'round', strokeLinejoin: 'round', opacity: 0.88 }) as const;
  const SUN = '#ffc93c', GRASS = '#4caf50', DOG = '#a9713f';
  return (
    <g>
      <defs>
        <filter id={F} x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency=".032" numOctaves="2" seed="3" result="w">
            {boil && <animate attributeName="seed" values="3;11;19;7" dur=".64s" calcMode="discrete" repeatCount="indefinite" />}
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="w" scale="5.5" xChannelSelector="R" yChannelSelector="G" result="d" />
          <feTurbulence type="fractalNoise" baseFrequency="1.15" numOctaves="1" seed="5" result="g" />
          <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -8 5.3" result="m" />
          <feComposite in="d" in2="m" operator="in" />
        </filter>
      </defs>
      <g filter={`url(#${F})`}>
        {mk >= 3 && (
          <g>
            {/* a sun in the corner, as every drawing has */}
            <g className={an(still, 'bat-spin-slow')} style={origin(30, 30)}>
              {Array.from({ length: 9 }, (_, i) => {
                const a = (i * 2 * Math.PI) / 9;
                return <path key={i} d={`M${(30 + 19 * Math.cos(a)).toFixed(1)} ${(30 + 19 * Math.sin(a)).toFixed(1)} L${(30 + 29 * Math.cos(a)).toFixed(1)} ${(30 + 29 * Math.sin(a)).toFixed(1)}`} {...wax(SUN, 3.4)} />;
              })}
            </g>
            <path d={scribble(17, 18, 26, 25, 3.6, 21)} {...wax(SUN, 4)} />
            <circle cx="30" cy="30" r="14" {...wax('#f59e0b', 2.4)} />
            <path d="M24 27 v3 M36 27 v3 M23 34 Q30 40 37 34" {...pen} strokeWidth="2" />
            {/* grass */}
            <path d="M6 186 L12 174 L18 187 L25 173 L31 186 L38 175 L45 187 L52 176 L58 186" {...wax(GRASS, 3.2)} />
            <path d="M142 187 L148 175 L155 186 L161 174 L168 187 L175 175 L181 186 L188 174 L194 187" {...wax(GRASS, 3.2)} />
            {/* a dog (probably) */}
            <g className={an(still, 'bat-hop')}>
              <path d={scribble(153, 150, 26, 14, 3.4, 33)} {...wax(DOG, 3.6)} />
              <ellipse cx="166" cy="157" rx="15" ry="9" {...pen} strokeWidth="2.4" />
              <circle cx="182" cy="146" r="8" {...pen} strokeWidth="2.4" />
              <path d="M177 139 L174 131 L181 137 M186 139 L190 131 L188 141" {...pen} strokeWidth="2.4" />
              <path d="M157 165 v11 M163 166 v10 M170 166 v10 M176 164 v12 M151 154 Q142 150 144 141" {...pen} strokeWidth="2.4" />
              <circle cx="180" cy="145" r="1.2" fill="var(--fg)" />
              <circle cx="186" cy="145" r="1.2" fill="var(--fg)" />
              <path d="M181 150 Q184 152 187 149" {...pen} strokeWidth="1.8" />
            </g>
            <path d="M158 40 C150 30 164 24 164 34 C165 24 178 30 170 40 L164 47Z" {...wax('#ef476f', 3)} />
          </g>
        )}
        {mk >= 2 && (
          <g className={an(still, 'bat-sway')} style={origin(68, 112)}>
            <path d={scribble(40, 120, 32, 46, 4.2, 44)} {...wax(c2, 4.6)} transform="rotate(14 60 140)" />
            <path d="M66 110 L28 168 L52 162 L70 172" {...pen} />
          </g>
        )}
        {/* colouring-in, a bit outside the lines */}
        <path d={scribble(68, 54, 66, 42, 4.4, 7)} {...wax(c2, 4.8)} />
        <path d={scribble(63, 111, 76, 46, 4.6, 13)} {...wax(c, 5)} />
        <path d={scribble(66, 173, 24, 9, 3.2, 17)} {...wax(c, 4)} />
        <path d={scribble(112, 173, 26, 9, 3.2, 19)} {...wax(c, 4)} />
        {/* antenna */}
        <path d="M100 49 L97 33" {...pen} />
        <path d="M97 28 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 M97 28 m-2 0 a2 2 0 1 0 4 0" {...wax('#ef476f', 2.6)} />
        {/* head: four lines that don't quite meet */}
        <path d="M64 51 L137 48 M134 45 L138 98 M140 96 L63 100 M66 102 L67 48" {...pen} />
        <Eyes still={still}>
          {happy ? (
            <path d="M77 72 Q86 61 95 72 M108 70 Q116 61 124 70" {...pen} />
          ) : (
            <g>
              <circle cx="86" cy="70" r="9.5" fill="#fff" stroke="var(--fg)" strokeWidth="2.6" />
              <circle cx="116" cy="68" r="6.8" fill="#fff" stroke="var(--fg)" strokeWidth="2.6" />
              <circle cx="88" cy="72" r="3.2" fill="var(--fg)" />
              <circle cx="117" cy="69" r="2.6" fill="var(--fg)" />
            </g>
          )}
        </Eyes>
        {happy ? <path d="M82 83 Q101 104 122 82Z" fill="#ef476f" stroke="var(--fg)" strokeWidth="2.6" strokeLinejoin="round" /> : <path d="M80 84 Q100 98 123 82 M78 81 l4 5 M125 79 l-3 5" {...pen} strokeWidth="2.6" />}
        {/* neck and body */}
        <path d="M94 100 L93 109 M107 100 L108 109" {...pen} />
        <path d="M60 110 L141 108 M138 105 L140 158 M142 157 L60 159 M62 161 L62 107" {...pen} />
        {[
          [78, '#ffc93c'],
          [93, '#4caf50'],
          [108, c2],
        ].map(([x, col]) => (
          <g key={x as number}>
            <circle cx={x as number} cy="122" r="4.6" fill={col as string} opacity=".9" />
            <circle cx={x as number} cy="122" r="4.6" {...pen} strokeWidth="2" />
          </g>
        ))}
        <path d="M70 134 H102 V150 H70Z M78 134 V150 M86 134 V150 M94 134 V150" {...pen} strokeWidth="2.2" />
        <circle cx="121" cy="141" r="9" fill="#fff" stroke="var(--fg)" strokeWidth="2.4" />
        <path d="M121 141 L126 135" {...pen} strokeWidth="2.2" className={an(still, 'bat-tick')} style={origin(121, 141)} />
        {/* arms: a claw on one, a wave on the other */}
        <path d="M61 119 L41 131 M41 131 L31 125 M41 131 L30 135 M41 131 L36 142" {...pen} />
        <g className={an(still, 'bat-wave')} style={origin(140, 119)}>
          <path d="M140 119 L161 106 M161 106 L160 95 M161 106 L171 101 M161 106 L170 112" {...pen} />
          {mk >= 2 && (
            <g>
              <path d="M163 103 L172 58" {...wax('#ffc93c', 6)} />
              <path d="M163 103 L172 58 M172 58 L176 50 L177 60" {...pen} strokeWidth="2.2" />
              <path d="M154 92 L176 99" {...pen} />
            </g>
          )}
        </g>
        {/* legs and feet */}
        <path d="M83 160 L80 173 M118 160 L122 173" {...pen} />
        <path d="M66 173 H90 V183 H65Z M112 173 H138 V183 H111Z" {...pen} strokeWidth="2.6" />
      </g>
    </g>
  );
}

// ─── Open Late: neon ────────────────────────────────────────────────────────
// Bent glass tubes on a smoked panel: a glow, the coloured glass, and a white-hot core.

function Neon({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const G = `${uid}-ng`, P = `${uid}-np`;
  /** A set of tubes: drawn as glow, glass, then core. */
  const tube = (col: string, d: ReactNode, key: string) => (
    <g key={key} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <g stroke={col} strokeWidth="7" opacity=".75" filter={`url(#${G})`}>{d}</g>
      <g stroke={col} strokeWidth="3.4">{d}</g>
      <g stroke="#fff" strokeWidth="1.2" opacity=".9">{d}</g>
    </g>
  );
  const bulbs: [number, number][] = [];
  for (let i = 0; i < 9; i++) bulbs.push([46 + i * 13.5, 33]);
  for (let i = 0; i < 9; i++) bulbs.push([159, 44 + i * 13.5]);
  for (let i = 0; i < 9; i++) bulbs.push([154 - i * 13.5, 165]);
  for (let i = 0; i < 9; i++) bulbs.push([41, 154 - i * 13.5]);
  const wide = mk >= 2;
  return (
    <g>
      <defs>
        <filter id={G} filterUnits="userSpaceOnUse" x="-20" y="-20" width="240" height="240">
          <feGaussianBlur stdDeviation="3.2" />
        </filter>
        <linearGradient id={P} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#221d33" />
          <stop offset=".5" stopColor="#0f0c18" />
          <stop offset="1" stopColor="#08060d" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="186" rx="52" ry="5" fill="var(--fg)" opacity=".16" />
      {/* the flex and its plug */}
      <path d="M150 168 C172 172 178 184 190 181" fill="none" stroke="#2a2740" strokeWidth="2.6" strokeLinecap="round" />
      <rect x="187" y="176" width="9" height="9" rx="2" fill="#3b3756" stroke="#15121f" strokeWidth="1.2" />
      {/* feet */}
      {[66, 122].map((x) => (
        <g key={x}>
          <rect x={x + 3} y="166" width="6" height="13" fill="#4b4766" stroke="#15121f" strokeWidth="1.4" />
          <rect x={x - 4} y="177" width="20" height="7" rx="3" fill="#6a6590" stroke="#15121f" strokeWidth="1.6" />
        </g>
      ))}
      {/* the panel */}
      <rect x="32" y="24" width="136" height="150" rx="13" fill={`url(#${P})`} stroke="#3b3756" strokeWidth="2.4" />
      <rect x="36" y="28" width="128" height="142" rx="10" fill="none" stroke="#fff" strokeWidth=".8" opacity=".12" />
      <path d="M44 40 L70 30 M40 58 L58 31" stroke="#fff" strokeWidth="2" opacity=".07" strokeLinecap="round" />
      {[[40, 32], [160, 32], [40, 166], [160, 166]].map(([x, y]) => (mk < 3 ? <circle key={`${x}${y}`} cx={x} cy={y} r="2" fill="#7c77a3" /> : null))}
      {/* a soft pool of light on the panel */}
      <ellipse cx={wide ? 86 : 100} cy="100" rx="52" ry="62" fill={c} opacity=".1" filter={`url(#${G})`} />
      <g transform={wide ? 'translate(-15 0)' : undefined}>
        <g className={an(still, 'bat-buzz')}>
          {tube(c, <path d="M82 54 H118 C126 54 130 58 130 66 V84 C130 92 126 96 118 96 H82 C74 96 70 92 70 84 V66 C70 58 74 54 82 54Z M100 54 V44" />, 'head')}
          {tube(c, <path d="M84 104 H116 C121 104 124 107 124 112 V138 C124 143 121 146 116 146 H84 C79 146 76 143 76 138 V112 C76 107 79 104 84 104Z M96 97 V103 M104 97 V103" />, 'body')}
          {tube(c, <path d="M76 112 H62 V131 M88 147 V160 H79 M112 147 V160 H121" />, 'limbs')}
        </g>
        {/* the waving arm: two tubes, lit in turn */}
        <g className={an(still, 'bat-arm-a')}>{tube(c, <path d="M124 112 H138 L143 93" />, 'arm-a')}</g>
        {!still && <g className="bat-arm-b">{tube(c, <path d="M124 112 H138 L154 101" />, 'arm-b')}</g>}
        <g className={an(still, 'bat-flick')}>{tube(c2, <circle cx="100" cy="39" r="3.6" />, 'tip')}</g>
        <Eyes still={still}>{tube(c2, happy ? <path d="M81 74 Q87 66 93 74 M107 74 Q113 66 119 74" /> : <path d="M87 67 a5 5 0 1 0 .01 0Z M113 67 a5 5 0 1 0 .01 0Z" />, 'eyes')}</Eyes>
        {tube(c2, happy ? <path d="M89 82 Q100 94 111 82Z" /> : <path d="M90 84 Q100 91 110 84" />, 'mouth')}
        <g className={an(still, 'bat-beat')} style={origin(100, 126)}>
          {tube(c2, <path d="M100 133 C88 124 93 114 100 121 C107 114 112 124 100 133Z" />, 'heart')}
        </g>
      </g>
      {mk >= 2 && (
        <g className={an(still, 'bat-flick-slow')}>
          {['営', '業', '中'].map((k, i) => (
            <g key={k} fontFamily={KANJI} fontSize="20" fontWeight="700" textAnchor="middle" fill="none" strokeLinejoin="round">
              <text x="147" y={66 + i * 33} stroke={c2} strokeWidth="3.6" opacity=".7" filter={`url(#${G})`}>{k}</text>
              <text x="147" y={66 + i * 33} stroke={c2} strokeWidth="1.5">{k}</text>
              <text x="147" y={66 + i * 33} stroke="#fff" strokeWidth=".5" opacity=".9">{k}</text>
            </g>
          ))}
        </g>
      )}
      {mk >= 3 && (
        <g>
          {bulbs.map(([x, y], i) => (
            <g key={i} className={an(still, 'bat-chase')} style={{ animationDelay: `${(-(i % 6) * 0.15).toFixed(2)}s` }} opacity={still && i % 3 ? 0.3 : 1}>
              <circle cx={x} cy={y} r="5" fill="#ffd76a" opacity=".55" filter={`url(#${G})`} />
              <circle cx={x} cy={y} r="2.5" fill="#fff3c2" stroke="#e8a317" strokeWidth=".8" />
            </g>
          ))}
          {[[16, 52, 6, 0], [186, 78, 5, 0.7], [14, 132, 4.5, 1.3], [184, 30, 4, 1.9]].map(([x, y, r, d]) => (
            <g key={`${x}${y}`} className={an(still, 'bat-twinkle')} style={{ ...origin(x, y), animationDelay: `${d}s` }}>
              {tube(d % 1.4 < 0.7 ? c2 : c, <path d={`M${x} ${y - r} L${x + r * 0.3} ${y - r * 0.3} L${x + r} ${y} L${x + r * 0.3} ${y + r * 0.3} L${x} ${y + r} L${x - r * 0.3} ${y + r * 0.3} L${x - r} ${y} L${x - r * 0.3} ${y - r * 0.3}Z`} />, 'star')}
            </g>
          ))}
        </g>
      )}
    </g>
  );
}

// ─── Fude: ink and brush ────────────────────────────────────────────────────
// Sumi-e on a round of washi: a few loaded strokes, pale washes, dry-brush gaps and one red seal.

/** The ensō: pressed down hard at the top, round once, thinning as the brush lifts; and the streaks where it ran dry. */
const [ENSO, ENSO_DRY] = (() => {
  const N = 60, a0 = -1.9, a1 = a0 + 5.75;
  const at = (r: number, a: number) => `${(100 + r * Math.cos(a)).toFixed(1)} ${(135 + r * 0.95 * Math.sin(a)).toFixed(1)}`;
  const outer: string[] = [], inner: string[] = [], dry: string[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, a = a0 + t * (a1 - a0);
    const r = 38 + 1.4 * Math.sin(a * 3 + 1);
    const w = 3.5 + 11.5 * (1 - t ** 1.6) + (t < 0.08 ? 3 * (1 - t / 0.08) : 0);
    outer.push(at(r, a));
    inner.push(at(r - w, a));
    if (t > 0.6) for (const [k, off] of [0.3, 0.55, 0.78].entries()) if ((i + k * 3) % 7 < 5) dry.push(`M${at(r - w * off, a)} L${at(r - w * off, a + (a1 - a0) / N)}`);
  }
  return [`M${outer.join(' L')} L${inner.reverse().join(' L')}Z`, dry.join(' ')];
})();

function Fude({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const R = `${uid}-fr`, W = `${uid}-fw`, PC = `${uid}-fc`, PG = `${uid}-fp`, MG = `${uid}-fm`;
  const PAPER = '#f2e8d2';
  const ink = { fill: 'none', stroke: c, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  return (
    <g>
      <defs>
        {/* a loaded brush: ragged edges, and gaps where the bristles ran dry */}
        <filter id={R} x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="3" seed="8" result="w" />
          <feDisplacementMap in="SourceGraphic" in2="w" scale="3.6" xChannelSelector="R" yChannelSelector="G" result="d" />
          <feTurbulence type="fractalNoise" baseFrequency=".34 .5" numOctaves="1" seed="2" result="g" />
          <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -7 5.5" result="m" />
          <feComposite in="d" in2="m" operator="in" />
        </filter>
        {/* a wash: ink let down with water, bleeding at the edge */}
        <filter id={W} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency=".04" numOctaves="2" seed="4" result="w" />
          <feDisplacementMap in="SourceGraphic" in2="w" scale="9" xChannelSelector="R" yChannelSelector="G" />
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
        <clipPath id={PC}>
          <circle cx="100" cy="104" r="85" />
        </clipPath>
        <radialGradient id={PG} cx=".42" cy=".36" r=".75">
          <stop offset="0" stopColor="#fbf5e6" />
          <stop offset=".7" stopColor={PAPER} />
          <stop offset="1" stopColor="#ddcfb0" />
        </radialGradient>
        <linearGradient id={MG} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c} stopOpacity=".5" />
          <stop offset="1" stopColor={c} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* the paper */}
      <circle cx="100" cy="104" r="85" fill={`url(#${PG})`} stroke="#b9a988" strokeWidth="1.2" />
      <g clipPath={`url(#${PC})`}>
        <g opacity=".5" stroke="#cdbf9f" strokeWidth=".6" fill="none">
          <path d="M24 70 q30 -6 52 4 M120 150 q26 8 50 -2 M40 160 q20 6 44 0 M118 44 q22 -8 44 2 M30 112 q12 4 26 0" />
        </g>
        {mk >= 3 && (
          <g>
            {/* far mountains, each paler than the last, with mist at their feet */}
            <g filter={`url(#${W})`}>
              <path d="M8 124 L42 70 L58 92 L74 62 L104 124Z" fill={`url(#${MG})`} opacity=".55" />
              <path d="M96 128 L130 84 L146 104 L164 74 L198 128Z" fill={`url(#${MG})`} opacity=".4" />
            </g>
            <circle cx="150" cy="54" r="13" fill={c2} opacity=".85" filter={`url(#${W})`} />
            <g className={an(still, 'bat-drift')} {...ink} strokeWidth="1.8" filter={`url(#${R})`}>
              <path d="M40 46 q5 -6 9 0 q4 -6 9 0 M62 34 q4 -5 7 0 q3 -5 7 0 M30 62 q3 -4 6 0 q3 -4 6 0" />
            </g>
          </g>
        )}
      </g>
      <g className={an(still, 'bat-breathe')} style={origin(100, 170)}>
        {/* washes first, under the line */}
        <g filter={`url(#${W})`} fill={c}>
          <circle cx="100" cy="130" r="31" opacity=".2" />
          <ellipse cx="108" cy="140" rx="20" ry="16" opacity=".16" />
          <path d="M79 55 C92 50 110 50 122 55 C125 67 124 79 121 89 C108 93 92 93 80 89 C76 77 76 65 79 55Z" opacity=".17" />
        </g>
        {mk >= 2 && (
          <g>
            {/* a bamboo staff, a joint at a time, and a gourd on a cord */}
            <g filter={`url(#${R})`} {...ink}>
              <path d="M157 52 L158 78 M158.4 82 L159.4 112 M159.8 116 L160.8 146 M161.2 150 L162 180" strokeWidth="4.6" />
              <path d="M157 58 C168 50 176 50 184 44 M157 62 C166 62 172 66 180 64 M157 56 C150 48 146 46 140 40" strokeWidth="3.2" />
              <path d="M152 118 C146 122 146 128 149 131" strokeWidth="1.4" />
            </g>
            <g filter={`url(#${W})`} fill={c} opacity=".7">
              <circle cx="148" cy="136" r="5" />
              <circle cx="148" cy="147" r="8" />
            </g>
          </g>
        )}
        <g filter={`url(#${R})`}>
          {/* the body: an ensō, one stroke, left open */}
          <path d={ENSO} fill={c} />
          <path d={ENSO_DRY} fill="none" stroke={PAPER} strokeWidth="1" strokeLinecap="round" opacity=".75" />
          {/* head */}
          <path d="M80 56 C92 51 110 51 121 56 C124 67 123 79 120 88 C108 92 92 92 81 88 C77 77 77 66 80 56" {...ink} strokeWidth="5.5" />
          <path d="M76 68 L70 66 M124 68 L131 65" {...ink} strokeWidth="4.5" />
          {/* arms: pressed down, then lifted away */}
          <path d="M66 116 C56 122 50 130 46 142 M46 142 L40 147 M46 142 L46 150 M46 142 L52 148" {...ink} strokeWidth="5" />
          <path d={mk >= 2 ? 'M136 114 C144 114 150 118 157 124' : 'M136 114 C146 118 152 126 155 140 M155 140 L150 147 M155 140 L156 149 M155 140 L161 146'} {...ink} strokeWidth="5" />
          {/* feet: two dabs */}
          <path d="M88 170 L84 176 M76 180 H94 M113 170 L117 176 M108 180 H127" {...ink} strokeWidth="6" />
        </g>
        <text x="101" y="146" textAnchor="middle" fontFamily={KANJI} fontSize="28" fontWeight="900" fill={c} opacity=".92">心</text>
        {/* face */}
        <circle cx="86" cy="79" r="4.2" fill={c2} opacity=".55" filter={`url(#${W})`} />
        <circle cx="115" cy="79" r="4.2" fill={c2} opacity=".55" filter={`url(#${W})`} />
        <Eyes still={still}>
          {happy ? (
            <path d="M86 72 Q91 66 96 72 M105 72 Q110 66 115 72" {...ink} strokeWidth="2.8" />
          ) : (
            <g fill={c}>
              <ellipse cx="91" cy="70" rx="3.2" ry="4.6" />
              <ellipse cx="110" cy="70" rx="3.2" ry="4.6" />
              <circle cx="92" cy="68.4" r="1" fill={PAPER} />
              <circle cx="111" cy="68.4" r="1" fill={PAPER} />
            </g>
          )}
        </Eyes>
        <path d={happy ? 'M94 80 Q100.5 87 107 80' : 'M96 81 Q100.5 84 105 81'} {...ink} strokeWidth="2.2" />
      </g>
      {mk >= 3 && (
        <g>
          <rect x="36" y="148" width="17" height="17" rx="2" fill={c2} filter={`url(#${R})`} />
          <text x="44.5" y="161.5" textAnchor="middle" fontFamily={KANJI} fontSize="13" fontWeight="900" fill={PAPER}>筆</text>
          {!still && <circle className="bat-drip" cx="68" cy="176" r="2" fill={c} />}
        </g>
      )}
    </g>
  );
}

// ─── Kira: an anime cel ─────────────────────────────────────────────────────
// Flat colour, one hard shadow, a clean line, a shine across the hair, and eyes with whole skies in them.

const SKIN = '#ffe6d5';
const SKIN_S = '#f3bfa8';
const LINE = '#2b1c33';
const BANGS = 'M60 104 C54 94 53 84 54 76 C50 26 150 26 146 76 C147 84 146 94 140 104 C139 94 137 85 134 77 L130 68 L124 81 L116 64 L108 79 L99 63 L92 82 L84 65 L78 81 L72 68 L67 77 C64 85 62 94 60 104Z';
const FACE = 'M65 78 C64 98 80 113 100 117 C120 113 136 98 135 78 C135 50 65 50 65 78Z';

function Kira({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const ST = `${uid}-ks`, IR = `${uid}-ki`, FC = `${uid}-kf`, HC = `${uid}-kh`, TC = `${uid}-kt`, BG = `${uid}-kb`;
  const ol = { stroke: LINE, strokeWidth: 2, strokeLinejoin: 'round', strokeLinecap: 'round' } as const;
  const th = { ...ol, strokeWidth: 1.3 } as const;
  const eyeC = c;
  const SCARF = '#ffd447';
  const r = rng(91);
  const lines = Array.from({ length: 34 }, (_, i) => {
    const a = (i / 34) * Math.PI * 2 + (r() - 0.5) * 0.12;
    const r0 = 66 + r() * 16, w = 0.012 + r() * 0.03;
    const pt = (rad: number, ang: number) => `${(100 + rad * Math.cos(ang)).toFixed(1)} ${(104 + rad * Math.sin(ang)).toFixed(1)}`;
    return `M${pt(r0, a)} L${pt(118, a - w)} L${pt(118, a + w)}Z`;
  }).join(' ');
  const eye = (x: number, flip: 1 | -1) => (
    <g key={x}>
      <ellipse cx={x} cy="93" rx="8.6" ry="10" fill="#fff" />
      <ellipse cx={x} cy="94" rx="7.2" ry="9.2" fill={`url(#${IR})`} />
      <ellipse cx={x} cy="92.5" rx="3.2" ry="4.8" fill={dk(eyeC, 78)} />
      <ellipse cx={x} cy="100" rx="4.6" ry="2.4" fill={lt(eyeC, 72)} opacity=".85" />
      <circle cx={x - 3.2} cy="88.6" r="2.9" fill="#fff" />
      <circle cx={x + 3.4} cy="97.6" r="1.4" fill="#fff" />
      <path d={`M${x - 9.6 * flip} 91 C${x - 8 * flip} 81.5 ${x + 5 * flip} 80.5 ${x + 9.6 * flip} 87.5 L${x + 12.6 * flip} 84.6`} fill="none" stroke={LINE} strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
  return (
    <g>
      <defs>
        {/* cut out like a sticker: a white edge all the way round */}
        <filter id={ST} x="-12%" y="-12%" width="124%" height="124%">
          <feMorphology in="SourceAlpha" operator="dilate" radius="2.6" result="fat" />
          <feFlood floodColor="#fff" />
          <feComposite in2="fat" operator="in" result="edge" />
          <feMerge>
            <feMergeNode in="edge" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id={IR} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={dk(eyeC, 62)} />
          <stop offset=".5" stopColor={eyeC} />
          <stop offset="1" stopColor={lt(eyeC, 60)} />
        </linearGradient>
        <linearGradient id={BG} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".5" stopColor="#dffcff" />
          <stop offset="1" stopColor="#fff" />
        </linearGradient>
        <clipPath id={FC}><path d={FACE} /></clipPath>
        <clipPath id={HC}><path d={BANGS} /></clipPath>
        <clipPath id={TC}><path d="M78 122 C86 118 114 118 122 122 L129 159 H71Z" /></clipPath>
      </defs>
      <ellipse cx="100" cy="186" rx="40" ry="4.6" fill="var(--fg)" opacity=".16" />
      {mk >= 3 && <path d={lines} fill="var(--fg)" opacity=".42" className={an(still, 'bat-lines')} style={origin(100, 104)} />}
      <g filter={`url(#${ST})`}>
        {mk >= 2 && (
          <g className={an(still, 'bat-sway')} style={origin(86, 126)}>
            <path d="M88 122 C68 118 52 128 30 118 C37 128 34 136 26 140 C46 146 66 140 88 134Z" fill={SCARF} {...ol} />
            <path d="M88 128 C70 126 52 136 36 131 C33 135 30 138 26 140 C46 146 66 140 88 134Z" fill={dk(SCARF, 18)} />
            <path d="M40 124 C48 127 56 126 62 124" fill="none" {...th} />
          </g>
        )}
        {/* hair behind the head */}
        <g className={an(still, 'bat-hair')} style={origin(100, 60)}>
          <path d="M56 78 C50 24 150 24 144 78 C148 100 147 118 139 133 L129 119 L122 134 L100 123 L78 134 L71 119 L61 133 C53 118 52 100 56 78Z" fill={dk(c2, 20)} {...ol} />
        </g>
        {/* legs and boots */}
        {[0, 1].map((i) => (
          <g key={i} transform={i ? MIR : undefined}>
            <path d="M81 156 H98 L97 170 H83Z" fill="#33375a" {...ol} />
            <path d="M82 168 H98 L99 180 C99 184 79 184 79 180Z" fill="#fbfbff" {...ol} />
            <path d="M80 177 C86 179 93 179 99 177 L99 180 C99 184 79 184 79 180Z" fill={c} />
            <path d="M82 168 H98 L99 180 C99 184 79 184 79 180Z" fill="none" {...ol} />
            <path d="M83 171.5 H97.5" stroke={c} strokeWidth="2" />
          </g>
        ))}
        {/* the arm at rest */}
        <path d="M80 123 C70 124 65 131 63 147 L74 150 C75 139 78 133 83 129Z" fill={c} {...ol} />
        <path d="M63 147 L74 150 L73.4 153.5 L62.6 150.6Z" fill="#fbfbff" {...th} />
        <circle cx="68" cy="156" r="5.2" fill={SKIN} {...ol} />
        {/* jacket */}
        <path d="M78 122 C86 118 114 118 122 122 L129 159 H71Z" fill={c} {...ol} />
        <g clipPath={`url(#${TC})`}>
          <path d="M112 116 C118 132 118 146 115 162 H134 V116Z" fill={dk(c, 24)} />
          <path d="M68 151 H132 V162 H68Z" fill="#33375a" />
          <path d="M68 151 H132" stroke={LINE} strokeWidth="1.3" />
          <path d="M100 128 V152" stroke={LINE} strokeWidth="1.3" />
        </g>
        <path d="M89.5 140 l1.5 3.2 3.5.4 -2.6 2.4 .7 3.5 -3.1 -1.7 -3.1 1.7 .7 -3.5 -2.6 -2.4 3.5 -.4z" fill="#fff" stroke={LINE} strokeWidth=".9" strokeLinejoin="round" />
        <rect x="96.5" y="152.5" width="7" height="5.5" rx="1" fill={SCARF} {...th} />
        <path d="M78 122 C86 118 114 118 122 122 L129 159 H71Z" fill="none" {...ol} />
        {/* neck and collar */}
        <path d="M94 110 H106 V124 H94Z" fill={SKIN_S} />
        {mk >= 2 ? (
          <g>
            <path d="M83 116 C92 124 108 124 117 116 L120 126 C108 135 92 135 80 126Z" fill={SCARF} {...ol} />
            <path d="M82 123 C92 131 108 131 118 123 L120 126 C108 135 92 135 80 126Z" fill={dk(SCARF, 18)} />
            <path d="M83 116 C92 124 108 124 117 116 L120 126 C108 135 92 135 80 126Z" fill="none" {...ol} />
          </g>
        ) : (
          <path d="M87 118 L100 129 L113 118 L118 124 L100 138 L82 124Z" fill="#fbfbff" {...ol} />
        )}
        {/* the raised arm, and what's in it */}
        <g className={an(still, 'bat-cheer')} style={origin(122, 126)}>
          {mk >= 3 && (
            <g>
              <path d="M160 100 L183 34" stroke={lt(c2, 20)} strokeWidth="11" strokeLinecap="round" opacity=".5" className={an(still, 'bat-beat')} style={origin(170, 66)} />
              <path d="M160 100 L183 34" stroke={`url(#${BG})`} strokeWidth="5" strokeLinecap="round" />
              <path d="M160 100 L183 34" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              <path d="M153.6 118 L161.4 96 L166.4 97.8 L158.6 119.8Z" fill="#d9dbe6" {...th} />
              <path d="M155 100 L171 105.6" stroke={LINE} strokeWidth="3.4" strokeLinecap="round" />
            </g>
          )}
          <path d="M119 123 C128 121 138 125 143 122 L151 107 L161 112 L152 131 C146 137 130 135 120 133Z" fill={c} {...ol} />
          <path d="M132 124 C138 126 142 124 144 121 L152 131 C147 136 138 136 130 134Z" fill={dk(c, 24)} />
          <path d="M151 107 L161 112 L159.4 115.2 L149.4 110.2Z" fill="#fbfbff" {...th} />
          <circle cx="157.5" cy="104" r="6.4" fill={SKIN} {...ol} />
          <path d="M153.5 102 h7 M154 105.4 h6.4" stroke={SKIN_S} strokeWidth="1.2" strokeLinecap="round" />
        </g>
        {/* face */}
        <path d={FACE} fill={SKIN} {...ol} />
        <g clipPath={`url(#${FC})`}>
          <path d={BANGS} fill={SKIN_S} transform="translate(0 4.5)" />
          <ellipse cx="74" cy="104" rx="7" ry="3.4" fill="#ff8fa3" opacity=".6" />
          <ellipse cx="126" cy="104" rx="7" ry="3.4" fill="#ff8fa3" opacity=".6" />
          <path d="M70 103 l-1.6 3 M74 103 l-1.6 3 M78 103 l-1.6 3 M122 103 l-1.6 3 M126 103 l-1.6 3 M130 103 l-1.6 3" stroke="#f0607c" strokeWidth=".9" strokeLinecap="round" />
        </g>
        <Eyes still={still}>
          {happy ? (
            <path d="M74 95 Q83 84 92 95 M108 95 Q117 84 126 95" fill="none" stroke={LINE} strokeWidth="2.8" strokeLinecap="round" />
          ) : (
            <>
              {eye(83, 1)}
              {eye(117, -1)}
            </>
          )}
        </Eyes>
        {happy ? (
          <g>
            <path d="M93 104 Q100 117 107 104Z" fill="#b8323f" {...th} />
            <path d="M96.5 110 Q100 107.5 103.5 110 Q100 114.5 96.5 110Z" fill="#ff8fa3" />
          </g>
        ) : (
          <path d="M96 107.5 Q100 110.6 104 107.5" fill="none" stroke={LINE} strokeWidth="1.5" strokeLinecap="round" />
        )}
        <path d="M100 100.5 l-1 1.6" stroke={SKIN_S} strokeWidth="1.4" strokeLinecap="round" />
        {/* the fringe: flat colour, a shadow tone, then the shine */}
        <g className={an(still, 'bat-hair')} style={origin(100, 60)}>
          <path d={BANGS} fill={c2} {...ol} />
          <g clipPath={`url(#${HC})`}>
            <path d="M54 76 C56 90 58 98 60 104 L67 77 L72 68 L78 81 L84 65 L92 82 L99 63 L108 79 L116 64 L124 81 L130 68 L134 77 L140 104 L146 76 L143 70 L133 70 L129 62 L124 74 L116 57 L108 72 L99 56 L92 75 L84 58 L78 74 L72 62 L66 70 L56 70Z" fill={dk(c2, 20)} opacity=".8" />
            <path d="M118 30 C140 40 148 60 146 108 H126 C132 80 130 52 118 30Z" fill={dk(c2, 20)} opacity=".7" />
            <path d="M63 60 L71 52 L77 58 L87 49 L95 55 L105 48 L113 55 L123 50 L129 57 L137 54 L135 61 L129 61 L122 56 L113 62 L105 54 L95 62 L87 55 L77 65 L71 58 L65 65Z" fill={lt(c2, 68)} />
          </g>
          <path d={BANGS} fill="none" {...ol} />
          <path d="M99 39 C94 27 103 19 113 22 C106 26 104 32 105 39Z" fill={c2} {...ol} />
          <path d="M76 77 Q82 74 89 76 M111 76 Q118 74 124 77" fill="none" stroke={LINE} strokeWidth="1.5" strokeLinecap="round" opacity=".6" />
        </g>
        {mk >= 2 && (
          <g>
            {[0, 1].map((i) => (
              <g key={i} transform={i ? MIR : undefined}>
                <path d="M57 80 L44 50 L52 82Z" fill="#fbfbff" {...ol} />
                <path d="M47.6 58 L51 71" stroke={c} strokeWidth="2.4" strokeLinecap="round" />
                <rect x="51" y="78" width="11" height="19" rx="4.5" fill="#fbfbff" {...ol} />
                <rect x="53.6" y="83" width="5.8" height="9" rx="2.4" fill={c} stroke={LINE} strokeWidth="1" />
                <circle cx="56.5" cy="87.5" r="1.3" fill="#fff" className={an(still, 'bat-flick')} />
              </g>
            ))}
          </g>
        )}
      </g>
      {mk >= 3 &&
        [[30, 64, 7, 0], [174, 150, 6, 0.8], [24, 150, 4.5, 1.6]].map(([x, y, s, d]) => (
          <path key={`${x}${y}`} className={an(still, 'bat-twinkle')} style={{ ...origin(x, y), animationDelay: `${d}s` }} d={`M${x} ${y - s} Q${x + s * 0.2} ${y - s * 0.2} ${x + s} ${y} Q${x + s * 0.2} ${y + s * 0.2} ${x} ${y + s} Q${x - s * 0.2} ${y + s * 0.2} ${x - s} ${y} Q${x - s * 0.2} ${y - s * 0.2} ${x} ${y - s}Z`} fill="#fff" stroke={LINE} strokeWidth="1.2" strokeLinejoin="round" />
        ))}
    </g>
  );
}

// ─── Vertex: real 3D ────────────────────────────────────────────────────────
// A mesh of flat faces (poly3d.ts), turned and lit every frame. It looks about, and now and then
// spins right round so you can see its back.

const STILL_YAW = -0.5;
function yawAt(t: number) {
  const look = 0.78 * Math.sin(0.7 * t - 0.695);
  const k = (t % 11) / 11;
  const u = k < 0.82 ? 0 : (k - 0.82) / 0.18;
  return look + Math.PI * 2 * (u * u * (3 - 2 * u));
}

function Vertex({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const mesh = useMemo(() => vertexMesh(mk, happy), [mk, happy]);
  const pal = useMemo<Record<Tone, string>>(() => ({ c, c2, k: '#2c3142', s: '#aeb6c4', glow: `color-mix(in srgb, ${c2} 30%, #fff)` }), [c, c2]);
  const shade = useMemo(() => shader(pal), [pal]);
  const first = useMemo(() => frame(mesh, STILL_YAW, 0, shade, pal), [mesh, shade, pal]);
  const ref = useRef<SVGGElement>(null);
  useEffect(() => {
    const g = ref.current;
    if (!g || still || calm()) return;
    const kids = g.children;
    const draw = (polys: { p: string; f: string }[]) => {
      for (let i = 0; i < kids.length; i++) {
        const el = kids[i], q = polys[i];
        if (q) {
          el.setAttribute('points', q.p);
          el.setAttribute('fill', q.f);
          el.setAttribute('stroke', q.f);
        } else if (el.getAttribute('points')) el.setAttribute('points', '');
      }
    };
    let raf = 0;
    const t0 = performance.now();
    const loop = (now: number) => {
      const t = (now - t0) / 1000;
      draw(frame(mesh, yawAt(t), t, shade, pal));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      draw(first);
    };
  }, [mesh, shade, pal, first, still]);
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-vs`}>
          <stop offset="0" stopColor="#000" stopOpacity=".34" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="184" rx={mk === 3 ? 66 : 50} ry={mk === 3 ? 12 : 9} fill={`url(#${uid}-vs)`} />
      <g ref={ref} strokeWidth=".7" strokeLinejoin="round">
        {Array.from({ length: mesh.count }, (_, i) => {
          const q = first[i];
          return <polygon key={i} points={q?.p ?? ''} fill={q?.f ?? 'none'} stroke={q?.f ?? 'none'} />;
        })}
      </g>
    </g>
  );
}

export const ATELIER: BotRegistry = {
  rakugaki: { Art: Rakugaki, head: { x: 100, y: 47, s: 1.2 } },
  neon: { Art: Neon, head: { x: 100, y: 24, s: 1.5 } },
  fude: { Art: Fude, head: { x: 100, y: 52, s: 0.82 } },
  kira: { Art: Kira, head: { x: 100, y: 40, s: 1.45 } },
  vertex: { Art: Vertex, head: { x: 100, y: 44, s: 0.72 } },
};
