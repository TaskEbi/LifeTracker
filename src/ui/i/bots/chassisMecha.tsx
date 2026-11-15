import type { CSSProperties, ReactNode } from 'react';
import type { BotArtProps, BotRegistry } from './types';
import './chassisMecha.css';

/** Super robots (M53): six anime mecha, drawn as key art at icon size. Original designs. */

const OL = { stroke: 'var(--fg)', strokeWidth: 2.2, strokeLinejoin: 'round', strokeLinecap: 'round' } as const;
const TH = { ...OL, strokeWidth: 1.5 } as const;
const INK = '#14151b';
const GUN = '#2b2f37';
const STEEL = '#aab2bc';
const STEEL_D = '#59616b';
const GOLD = '#f2c14e';
const FIRE = '#ff8a1f';
const KANJI = '"Yu Mincho", "Hiragino Mincho ProN", "Noto Serif JP", serif';
const dk = (c: string, n = 35) => `color-mix(in srgb, ${c} ${100 - n}%, #000)`;
const lt = (c: string, n = 35) => `color-mix(in srgb, ${c} ${100 - n}%, #fff)`;
const mix = (a: string, b: string, n = 50) => `color-mix(in srgb, ${a} ${n}%, ${b})`;
const an = (still: boolean, cls: string) => (still ? undefined : cls);
const origin = (x: number, y: number): CSSProperties => ({ transformOrigin: `${x}px ${y}px` });
/** Mirror about the centre line. */
const MIR = 'matrix(-1 0 0 1 200 0)';
const pts = (a: [number, number][]) => a.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
const star = (x: number, y: number, r: number, n = 5, inner = 0.45, rot = 0) =>
  pts(
    Array.from({ length: n * 2 }, (_, i) => {
      const a = (Math.PI * i) / n - Math.PI / 2 + rot;
      const k = i % 2 ? r * inner : r;
      return [x + k * Math.cos(a), y + k * Math.sin(a)];
    }),
  );
const flame = (x: number, y: number, h: number, w = h * 0.45) =>
  `M${x} ${y} C${x - w} ${y - h * 0.3} ${x - w * 0.6} ${y - h * 0.7} ${x} ${y - h} C${x + w * 0.6} ${y - h * 0.7} ${x + w} ${y - h * 0.3} ${x} ${y}Z`;

/** Place a part drawn hanging down from (0, 0) so it runs from (x1, y1) towards (x2, y2). */
const aim = (x1: number, y1: number, x2: number, y2: number) => ({
  t: `translate(${x1} ${y1}) rotate(${((Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI - 90).toFixed(1)})`,
  L: Math.hypot(x2 - x1, y2 - y1),
});

function Eyes({ still, children }: { still: boolean; children: ReactNode }) {
  return (
    <g className="dr-gaze">
      <g className={still ? undefined : 'i-blink'}>{children}</g>
    </g>
  );
}
function Sym({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <g transform={MIR}>{children}</g>
    </>
  );
}
const Shadow = ({ rx = 56 }: { rx?: number }) => <ellipse cx="100" cy="185" rx={rx} ry="5.5" fill="var(--fg)" opacity=".16" />;
/** Lacquered metal: a bright rim, the colour, then a deep ambient edge. */
function Lin({ id, c, h, k = 1 }: { id: string; c: string; h?: boolean; k?: number }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2={h ? 1 : 0} y2={h ? 0 : 1}>
      <stop offset="0" stopColor={lt(c, 48 * k)} />
      <stop offset=".2" stopColor={lt(c, 14 * k)} />
      <stop offset=".55" stopColor={c} />
      <stop offset=".86" stopColor={dk(c, 30 * k)} />
      <stop offset="1" stopColor={dk(c, 48 * k)} />
    </linearGradient>
  );
}
function Glass({ id, c = '#4fb6ff' }: { id: string; c?: string }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2=".4" y2="1">
      <stop offset="0" stopColor={lt(c, 75)} />
      <stop offset=".35" stopColor={c} />
      <stop offset="1" stopColor={dk(c, 70)} />
    </linearGradient>
  );
}
function Blur({ id, s = 2 }: { id: string; s?: number }) {
  return (
    <filter id={id} x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation={s} />
    </filter>
  );
}
const Bolt = ({ x, y, r = 1.3 }: { x: number; y: number; r?: number }) => (
  <g>
    <circle cx={x} cy={y} r={r} fill={STEEL_D} />
    <circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.45} fill="#fff" opacity=".8" />
  </g>
);

// ─── Gattai Prime ───────────────────────────────────────────────────────────
// Five machines: a jet (head and chest), a bullet train (waist), two trucks (arms), a tank (legs).
function Gattai({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const R = `${uid}-r`, Rh = `${uid}-rh`, W = `${uid}-w`, Wh = `${uid}-wh`, S = `${uid}-s`, GL = `${uid}-gl`, BL = `${uid}-bl`, HZ = `${uid}-hz`, AU = `${uid}-au`;
  const ink = dk(c, 62);
  const ln = { fill: 'none', stroke: ink, strokeWidth: 0.9, strokeLinecap: 'round' } as const;
  const wl = { fill: 'none', stroke: dk(c2, 45), strokeWidth: 0.9, strokeLinecap: 'round' } as const;
  const upper = (
    <g>
      <rect x="-8" y="2" width="16" height="25" rx="3" fill={`url(#${Wh})`} {...OL} />
      <path d="M-8 9 H8 M-8 20 H8" {...wl} />
      <rect x="-9.5" y="23" width="19" height="6" rx="3" fill={GUN} {...TH} />
      <circle cx="0" cy="1" r="8" fill={`url(#${S})`} {...OL} />
      {mk >= 2 && <circle cx="0" cy="1" r="8" fill="none" stroke={`url(#${HZ})`} strokeWidth="3.2" />}
      <circle cx="0" cy="1" r="3" fill={STEEL_D} />
    </g>
  );
  const fore = (out: 1 | -1, kind: 'ladder' | 'siren', cannon = false) => (
    <g>
      <rect x="-11" y="0" width="22" height="32" rx="4" fill={`url(#${Rh})`} {...OL} />
      <path d="M-8 3 H8 L6.5 10 H-6.5Z" fill={`url(#${BL})`} stroke={ink} strokeWidth=".8" />
      <path d="M-5 4 L-2.5 9" stroke="#fff" strokeWidth="1.2" opacity=".75" />
      <path d="M-11 12 H11 M-11 29 H11" {...ln} />
      {kind === 'ladder' ? (
        <g>
          <path d="M-4 13 V28 M4 13 V28" stroke={lt(c2, 0)} strokeWidth="1.6" />
          {[16, 20, 24].map((y) => <path key={y} d={`M-4 ${y} H4`} stroke={c2} strokeWidth="1.2" />)}
        </g>
      ) : (
        <g>
          <rect x="-6" y="14" width="5" height="3.5" rx="1" fill={c2} stroke={ink} strokeWidth=".6" />
          <rect x="1" y="14" width="5" height="3.5" rx="1" fill={`url(#${BL})`} stroke={ink} strokeWidth=".6" />
          <path d="M-7 21 H7 M-7 24.5 H7" stroke={c2} strokeWidth="1.6" />
        </g>
      )}
      {[12, 25].map((y) => (
        <g key={y}>
          <circle cx={out * 11} cy={y} r="5" fill={GUN} {...TH} />
          <circle cx={out * 11} cy={y} r="2.2" fill={STEEL} />
        </g>
      ))}
      <path d="M-10 30 H10 L11 41 C11 46 8 48 4 48 H-4 C-8 48 -11 46 -11 41Z" fill={`url(#${S})`} {...OL} />
      <path d="M-10 35 H10" stroke={STEEL_D} strokeWidth="1" />
      <path d="M-5.5 37 V46 M-.5 37 V47 M4.5 37 V46" stroke={STEEL_D} strokeWidth=".9" />
      <path d="M-8 31.5 H7" stroke="#fff" strokeWidth="1" opacity=".7" />
      {cannon && (
        <g>
          <rect x="-14" y="40" width="28" height="13" rx="3" fill={`url(#${Wh})`} {...OL} />
          <path d="M-14 46 H14" {...wl} />
          {[-8, 0, 8].map((x) => (
            <g key={x}>
              <rect x={x - 3.2} y="52" width="6.4" height="16" rx="1" fill={`url(#${S})`} {...TH} />
              <path d={`M${x - 1.5} 54 V66`} stroke="#fff" strokeWidth=".9" opacity=".7" />
            </g>
          ))}
          <rect x="-13" y="65" width="26" height="6" rx="2" fill={`url(#${Rh})`} {...OL} />
          <g className={an(still, 'bmc-pulse')}>
            <ellipse cx="0" cy="76" rx="16" ry="9" fill={GOLD} filter={`url(#${GL})`} opacity=".9" />
            <ellipse cx="0" cy="74" rx="9" ry="4" fill="#fff8d8" />
          </g>
        </g>
      )}
    </g>
  );
  return (
    <g>
      <defs>
        <Lin id={R} c={c} />
        <Lin id={Rh} c={c} h />
        <Lin id={W} c={c2} k={0.7} />
        <Lin id={Wh} c={c2} h k={0.7} />
        <Lin id={S} c={STEEL} h />
        <Lin id={AU} c={GOLD} />
        <Glass id={BL} />
        <Blur id={GL} s={2.2} />
        <pattern id={HZ} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="5" height="5" fill={GOLD} />
          <rect width="2.5" height="5" fill={INK} />
        </pattern>
      </defs>
      <Shadow rx={mk === 3 ? 66 : 58} />
      <g className={an(still, 'bmc-bob')}>
        {/* jet wings and tail fins, behind */}
        <Sym>
          <path d="M72 74 L18 98 L21 108 L74 92Z" fill={`url(#${W})`} {...OL} />
          <path d="M18 98 L21 108 L31 104 L28 93.5Z" fill={c} stroke={ink} strokeWidth=".8" />
          <path d="M40 92 L66 82 M36 100 L68 88" {...wl} />
          <path d="M68 70 L55 38 L63 36 L82 64Z" fill={`url(#${R})`} {...OL} />
          <path d="M60 40 L66 54" stroke={c2} strokeWidth="2.2" />
        </Sym>
        {/* tank legs */}
        <Sym>
          <path d="M74 128 H94 L92 150 H77Z" fill={`url(#${Wh})`} {...OL} />
          <path d="M77 134 H92 M84 136 V148" {...wl} />
          <rect x="59" y="148" width="13" height="30" rx="6.5" fill={GUN} {...OL} />
          {[156, 164, 172].map((y) => (
            <g key={y}>
              <circle cx="65.5" cy={y} r="3.6" fill={STEEL_D} />
              <circle cx="65.5" cy={y} r="1.4" fill={STEEL} />
            </g>
          ))}
          <path d="M59.5 152 v22" stroke={STEEL} strokeWidth="1.6" strokeDasharray="1.6 1.8" />
          <path d="M68 156 H96 L94 177 H70Z" fill={`url(#${Wh})`} {...OL} />
          <path d="M72 168 H94 M76 172 h6" {...wl} />
          <path d="M70 146 H97 L95 159 H72Z" fill={`url(#${R})`} {...OL} />
          <path d="M74 150 H94" stroke="#fff" strokeWidth="1" opacity=".55" />
          <path d="M84 153 h8" stroke={GOLD} strokeWidth="2" />
          <path d="M63 177 H98 L100 183 H61Z" fill={`url(#${S})`} {...OL} />
          {mk >= 2 && (
            <g>
              <rect x="75" y="127" width="19" height="4.5" rx="1" fill={`url(#${HZ})`} stroke={INK} strokeWidth=".8" />
              <rect x="70" y="157" width="25" height="3" fill={`url(#${HZ})`} stroke={INK} strokeWidth=".6" />
            </g>
          )}
        </Sym>
        {/* hips: the train's nose clamps */}
        <path d="M88 126 H112 L106 140 H94Z" fill={`url(#${R})`} {...OL} />
        <path d="M94 129 L100 137 L106 129" fill="none" stroke={GOLD} strokeWidth="2" />
        {/* waist: a bullet train */}
        <path d="M74 114 H126 C134 114 138 121 138 121 C138 121 134 128 126 128 H74 C66 128 62 121 62 121 C62 121 66 114 74 114Z" fill={`url(#${W})`} {...OL} />
        <rect x="74" y="116.5" width="52" height="5" rx="2.5" fill={`url(#${BL})`} stroke={ink} strokeWidth=".7" />
        {[81, 88, 95, 102, 109, 116].map((x) => <path key={x} d={`M${x} 116.5 v5`} stroke={c2} strokeWidth="1" />)}
        <path d="M66 124 H134" stroke={c} strokeWidth="1.8" />
        {mk >= 2 && [64, 136].map((x) => <circle key={x} cx={x} cy="121" r="2.2" fill={`url(#${HZ})`} stroke={INK} strokeWidth=".6" />)}
        {/* chest: the jet */}
        <path d="M70 66 H130 L137 80 L128 106 L114 117 H86 L72 106 L63 80Z" fill={`url(#${R})`} {...OL} />
        <path d="M66 80 L74 104 L86 113 M134 80 L126 104 L114 113" {...ln} />
        <path d="M71 70 H129" stroke="#fff" strokeWidth="1.4" opacity=".5" />
        <Sym>
          <path d="M70 76 H86 L85 92 H74Z" fill={INK} stroke={ink} strokeWidth=".8" />
          {[80, 84, 88].map((y) => <path key={y} d={`M73 ${y} H85`} stroke={STEEL_D} strokeWidth="1" />)}
          <Bolt x={68} y={98} />
        </Sym>
        <path d="M92 68 H108 L106.5 104 L100 116 L93.5 104Z" fill={`url(#${Wh})`} stroke={ink} strokeWidth="1" />
        <path d="M100 92 C104.5 94 105.5 100 104.5 106 L100 113 L95.5 106 C94.5 100 95.5 94 100 92Z" fill={`url(#${BL})`} stroke={ink} strokeWidth=".9" />
        <path d="M97.5 96 C96.5 100 96.5 104 97.5 107" stroke="#fff" strokeWidth="1.2" opacity=".8" fill="none" />
        <path d="M96 114 H104 L100 124Z" fill={`url(#${S})`} {...TH} />
        {/* the lion */}
        {mk >= 2 && (
          <g>
            <polygon points={star(100, 82, 17, 12, 0.7)} fill={`url(#${AU})`} stroke={dk(GOLD, 55)} strokeWidth="1" strokeLinejoin="round" />
            <circle cx="100" cy="82" r="10.5" fill={lt(GOLD, 25)} stroke={dk(GOLD, 55)} strokeWidth="1" />
            <path d="M94 79 L98 80.5 M106 79 L102 80.5" stroke="#c1121f" strokeWidth="2" strokeLinecap="round" />
            <path d="M98 83 H102 L100 86Z" fill={INK} />
            <path d="M95 87 Q100 91 105 87 M97 87.5 L97.5 90 M103 87.5 L102.5 90" fill="none" stroke={INK} strokeWidth="1.1" strokeLinecap="round" />
            <path d="M93 76 Q100 72 107 76" stroke={dk(GOLD, 40)} strokeWidth="1" fill="none" />
          </g>
        )}
        {/* shoulders */}
        <Sym>
          <path d="M44 66 C44 59 49 56 56 56 H76 L80 82 C70 87 55 87 46 82Z" fill={`url(#${W})`} {...OL} />
          <path d="M47 63 H77" stroke={c} strokeWidth="3.5" />
          <path d="M47 77 Q62 81 79 77" {...wl} />
          <Bolt x={50} y={70} />
          <Bolt x={74} y={70} />
        </Sym>
        <rect x="55" y="65.5" width="13" height="13" rx="2" fill={c} stroke={ink} strokeWidth=".8" />
        <text x="61.5" y="75.8" textAnchor="middle" fontFamily={KANJI} fontSize="10" fontWeight="700" fill={c2}>
          合
        </text>
        {/* arms */}
        <g transform="translate(53 82)">{upper}</g>
        <g transform="translate(53 108)">{fore(-1, 'ladder')}</g>
        {mk < 3 ? (
          <>
            <g transform="translate(147 82)">{upper}</g>
            <g transform="translate(147 108)">{fore(1, 'siren')}</g>
          </>
        ) : (
          <>
            <g transform="translate(164 101) rotate(-165)">{fore(-1, 'siren', true)}</g>
            <g transform="translate(147 82) rotate(-40)">{upper}</g>
          </>
        )}
        {/* neck and head */}
        <rect x="92" y="56" width="16" height="12" rx="2" fill={`url(#${S})`} {...TH} />
        {mk >= 2 && <rect x="91" y="62" width="18" height="3.5" fill={`url(#${HZ})`} stroke={INK} strokeWidth=".6" />}
        <path d="M84 44 C84 34 91 28 100 28 C109 28 116 34 116 44 L118 58 L110 66 H90 L82 58Z" fill={`url(#${R})`} {...OL} />
        <path d="M96.5 29 L100 14 L103.5 29Z" fill={`url(#${W})`} {...TH} />
        <Sym>
          <circle cx="82" cy="51" r="5" fill={`url(#${S})`} {...TH} />
          <circle cx="82" cy="51" r="2" fill={c2} />
          <path d="M87 33 Q90 30 95 30" stroke="#fff" strokeWidth="1.3" opacity=".6" fill="none" />
        </Sym>
        <path d="M88 45 H112 L111 58 L104 64 H96 L89 58Z" fill={`url(#${S})`} stroke={ink} strokeWidth="1" />
        <path d="M95 56 V62 M100 56 V63 M105 56 V62" stroke={STEEL_D} strokeWidth="1" />
        <path d="M94 36 L100 31 L106 36 L100 44Z" fill={`url(#${BL})`} stroke={ink} strokeWidth=".8" />
        <path d="M97 36 L100 33.5" stroke="#fff" strokeWidth="1" />
        <Eyes still={still}>
          <g className={an(still, 'bmc-pulse')}>
            {happy ? (
              <path d="M89.5 52 Q93.5 46 98 51.5 M110.5 52 Q106.5 46 102 51.5" stroke={GOLD} strokeWidth="5" fill="none" filter={`url(#${GL})`} />
            ) : (
              <path d="M89 47.5 L98 49.5 L97 53.5 L90 52.5Z M111 47.5 L102 49.5 L103 53.5 L110 52.5Z" fill={GOLD} filter={`url(#${GL})`} />
            )}
          </g>
          {happy ? (
            <path d="M89.5 52 Q93.5 46 98 51.5 M110.5 52 Q106.5 46 102 51.5" stroke="#fff6c8" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          ) : (
            <path d="M89 47.5 L98 49.5 L97 53.5 L90 52.5Z M111 47.5 L102 49.5 L103 53.5 L110 52.5Z" fill="#fff6c8" stroke={dk(GOLD, 40)} strokeWidth=".8" />
          )}
        </Eyes>
        {/* Mk III: the wing crest */}
        {mk === 3 && (
          <Sym>
            <path d="M95 40 C82 30 66 18 46 8 C54 20 60 25 66 29 C58 29 52 28 44 26 C56 36 70 41 90 45Z" fill={`url(#${AU})`} {...OL} />
            <path d="M90 41 C78 34 66 26 54 16 M88 43.5 C76 39 64 34 54 30" fill="none" stroke={dk(GOLD, 45)} strokeWidth=".9" />
            <path d="M58 16 C66 22 76 30 86 36" stroke="#fff" strokeWidth="1.1" opacity=".7" fill="none" />
          </Sym>
        )}
      </g>
    </g>
  );
}

// ─── Long Range ─────────────────────────────────────────────────────────────
// A real robot: grey-green armour, a mono-eye on a rail, a rifle held at low ready.
const RIFLE = 'translate(150 72) rotate(146.7) scale(1 -1)';
const CLOAK = 'M70 58 C58 82 46 124 38 168 L46 162 L52 172 L60 163 L68 173 L76 164 L84 172 L92 164 L100 173 L108 164 L116 172 L124 164 L132 173 L140 163 L148 172 L154 162 L162 168 C154 124 142 82 130 58Z';
const CAMO: [number, number, number, number, number, 0 | 1 | 2][] = [
  [52, 140, 14, 8, 20, 0], [90, 152, 12, 6, -10, 1], [132, 122, 15, 7, 30, 0], [62, 100, 10, 6, -30, 2], [142, 156, 11, 6, 0, 2],
  [112, 166, 9, 4, 15, 1], [72, 166, 8, 4, -5, 0], [148, 96, 8, 5, 40, 1], [44, 162, 7, 4, 0, 1], [118, 140, 7, 4, -20, 2],
];
function Sniper({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const A = `${uid}-a`, Ah = `${uid}-ah`, T = `${uid}-t`, M = `${uid}-m`, GL = `${uid}-gl`, LS = `${uid}-ls`, CK = `${uid}-ck`;
  const ink = dk(c, 65);
  const ln = { fill: 'none', stroke: ink, strokeWidth: 0.85, strokeLinecap: 'round' } as const;
  const EYE = '#ff3b6b';
  const camo = [dk(c, 18), dk(c2, 52), lt(c2, 18)];
  const la1 = aim(64, 74, 55, 100), la2 = aim(55, 100, 70, 125);
  const ra1 = aim(136, 74, 147, 98), ra2 = aim(147, 98, 120, 99);
  const upper = (L: number) => (
    <g>
      <rect x="-6" y="0" width="12" height={L} rx="4" fill={`url(#${M})`} {...TH} />
      <path d={`M-8 3 H8 L7 ${L * 0.62} H-7Z`} fill={`url(#${Ah})`} {...TH} />
      <path d={`M-6 ${L * 0.35} H6`} {...ln} />
      <circle cx="0" cy={L} r="6" fill={`url(#${M})`} {...TH} />
      <circle cx="0" cy={L} r="2" fill={STEEL_D} />
    </g>
  );
  const fore = (L: number) => (
    <g>
      <path d={`M-7 0 H7 L9 ${L - 8} H-9Z`} fill={`url(#${Ah})`} {...OL} />
      <path d={`M-5.5 4 H5.5 M-7.6 ${L - 14} H7.6`} {...ln} />
      <rect x="-3.5" y={L * 0.3} width="7" height="6" rx="1" fill={c2} stroke={ink} strokeWidth=".6" />
      <path d={`M-8 ${L - 8} H8 L7 ${L + 2} C5 ${L + 5} -5 ${L + 5} -7 ${L + 2}Z`} fill={`url(#${M})`} {...TH} />
      <path d={`M-3.5 ${L - 5} V${L + 2} M0 ${L - 5} V${L + 3} M3.5 ${L - 5} V${L + 2}`} stroke={STEEL_D} strokeWidth=".7" />
    </g>
  );
  return (
    <g>
      <defs>
        <Lin id={A} c={c} />
        <Lin id={Ah} c={c} h />
        <Lin id={T} c={c2} />
        <Lin id={M} c="#6b7480" h />
        <Glass id={LS} c="#43d8c0" />
        <Blur id={GL} s={1.8} />
        {mk >= 2 && (
          <clipPath id={CK}>
            <path d={CLOAK} />
          </clipPath>
        )}
      </defs>
      <Shadow rx={62} />
      {mk === 3 && (
        <g>
          {/* rangefinder line and muzzle smoke */}
          <path d="M72 107.5 L4 152" stroke={EYE} strokeWidth=".9" strokeDasharray="3 2" opacity=".75" />
          <g className={an(still, 'bmc-plume')} style={origin(10, 160)} opacity=".55">
            <circle cx="9" cy="156" r="5" fill={STEEL} />
            <circle cx="15" cy="150" r="3.6" fill={STEEL} />
            <circle cx="12" cy="143" r="2.4" fill={STEEL} />
          </g>
        </g>
      )}
      <g className={an(still, 'bmc-bob')}>
        {mk >= 2 && (
          <g className={an(still, 'bmc-sway')} style={origin(100, 60)}>
            <path d={CLOAK} fill={mix(c2, c, 55)} {...OL} />
            <g clipPath={`url(#${CK})`}>
              {CAMO.map(([x, y, rx, ry, r, k], i) => (
                <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} transform={`rotate(${r} ${x} ${y})`} fill={camo[k]} />
              ))}
              <path d="M74 70 C66 110 60 140 56 168 M126 70 C134 110 140 140 144 168 M100 120 V170" stroke={INK} strokeWidth="1" opacity=".3" fill="none" />
            </g>
          </g>
        )}
        {/* backpack thrusters */}
        <Sym>
          <rect x="72" y="46" width="11" height="20" rx="3" fill={`url(#${M})`} {...TH} />
          <path d="M73.5 46 H81.5 L80 41 H75Z" fill={GUN} />
        </Sym>
        {/* legs */}
        <Sym>
          <path d="M83 114 H97 L96 142 H85Z" fill={`url(#${M})`} {...TH} />
          <path d="M79 117 H91 L90 138 H81Z" fill={`url(#${Ah})`} {...OL} />
          <path d="M81 124 H90" {...ln} />
          <path d="M77 150 H99 L101 173 H75Z" fill={`url(#${Ah})`} {...OL} />
          <rect x="80" y="157" width="7" height="10" rx="1" fill={`url(#${T})`} stroke={ink} strokeWidth=".6" />
          <path d="M81 160 H86 M81 163 H86 M91 154 L93 170" stroke={ink} strokeWidth=".7" />
          <path d="M78 138 H98 L97 150 L88 155 L79 150Z" fill={`url(#${A})`} {...OL} />
          <path d="M82 142 L88 151 L94 142" fill="none" stroke={c2} strokeWidth="1.4" />
          <rect x="80" y="171" width="17" height="6" fill={GUN} />
          <path d="M71 177 H100 L102 183 H67Z" fill={`url(#${A})`} {...OL} />
          <path d="M72 180 H100" stroke={INK} strokeWidth=".7" opacity=".5" />
        </Sym>
        {/* waist */}
        <rect x="86" y="98" width="28" height="16" rx="3" fill={`url(#${M})`} {...TH} />
        <path d="M86 103 H114 M86 108 H114" stroke={STEEL_D} strokeWidth=".9" />
        <path d="M92 112 H108 L104 126 H96Z" fill={`url(#${A})`} {...OL} />
        <Sym>
          <path d="M70 107 H80 L84 128 L74 131Z" fill={`url(#${Ah})`} {...OL} />
          <path d="M78 110 H97 L95 131 H82Z" fill={`url(#${A})`} {...OL} />
          <path d="M79 113 H96" stroke={c2} strokeWidth="2.2" strokeDasharray="3 2" />
          <Bolt x={88} y={125} r={1.1} />
        </Sym>
        {/* torso */}
        <path d="M70 62 H130 L135 80 L124 102 H76 L65 80Z" fill={`url(#${A})`} {...OL} />
        <path d="M71 65 H129" stroke="#fff" strokeWidth="1.2" opacity=".45" />
        <Sym>
          <path d="M72 70 H90 L88 87 H76Z" fill={`url(#${T})`} stroke={ink} strokeWidth=".8" />
          {[74, 78, 82].map((y) => <path key={y} d={`M75 ${y} H88.5`} stroke={dk(c2, 55)} strokeWidth="1.1" />)}
          <path d="M68 82 L77 99" {...ln} />
          <Bolt x={84} y={95} r={1.1} />
        </Sym>
        <path d="M93 64 H107 L105.5 92 L100 97 L94.5 92Z" fill={dk(c, 14)} stroke={ink} strokeWidth=".9" />
        <path d="M96 70 H104 M96 86 H104" stroke={ink} strokeWidth=".8" />
        <text x="100" y="81" textAnchor="middle" fontSize="6.5" fontFamily="ui-monospace, monospace" fontWeight="700" fill={c2}>
          07
        </text>
        {mk >= 2 && (
          <g>
            <path d="M76 62 C82 74 118 74 124 62 C120 56 80 56 76 62Z" fill={mix(c2, c, 55)} {...OL} />
            <path d="M84 63 C90 68 98 69 104 67 M110 62 C114 65 118 65 121 63" stroke={camo[0]} strokeWidth="3.4" fill="none" strokeLinecap="round" />
            <path d="M80 66 C90 71 110 71 120 66" stroke={INK} strokeWidth=".8" opacity=".35" fill="none" />
          </g>
        )}
        {/* head */}
        <rect x="93" y="56" width="14" height="10" fill={`url(#${M})`} {...TH} />
        <Sym>
          <path d="M94.5 60 C90 63 88 67 86.5 70" stroke={GUN} strokeWidth="3.6" fill="none" strokeLinecap="round" />
          <path d="M94.5 60 C90 63 88 67 86.5 70" stroke={STEEL} strokeWidth="3.6" fill="none" strokeDasharray=".9 1.5" />
        </Sym>
        <path d="M88 40 L74 12" stroke={GUN} strokeWidth="2" strokeLinecap="round" />
        <path d="M88 40 L74 12" stroke={STEEL} strokeWidth=".8" />
        <circle cx="74" cy="12" r="1.8" fill={EYE} />
        <path d="M86 46 C86 37 92 33 100 33 C108 33 114 37 114 46 L116 56 L108 64 H92 L84 56Z" fill={`url(#${A})`} {...OL} />
        <path d="M98.5 33.5 L100 27 L101.5 33.5Z" fill={c2} stroke={ink} strokeWidth=".6" />
        <path d="M90 37 Q95 34.5 100 34.5" stroke="#fff" strokeWidth="1.2" opacity=".6" fill="none" />
        <Sym>
          <circle cx="84.5" cy="52" r="3" fill={`url(#${M})`} stroke={ink} strokeWidth=".7" />
        </Sym>
        <path d="M92 54 H108 L106 63 H94Z" fill={`url(#${M})`} stroke={ink} strokeWidth=".8" />
        <path d="M96 56 V61 M100 56 V62 M104 56 V61" stroke={INK} strokeWidth=".9" />
        <rect x="86" y="44.5" width="28" height="7.5" rx="3.75" fill={INK} stroke={ink} strokeWidth=".8" />
        <path d="M89 48.25 H111" stroke="#4a1626" strokeWidth="1.4" />
        <Eyes still={still}>
          <g className={an(still, 'bmc-pulse')}>
            {happy ? (
              <path d="M95.5 50.5 Q100 44.5 104.5 50.5" stroke={EYE} strokeWidth="4" fill="none" filter={`url(#${GL})`} />
            ) : (
              <circle cx="100" cy="48.25" r="4.5" fill={EYE} filter={`url(#${GL})`} />
            )}
          </g>
          {happy ? (
            <path d="M95.5 50.5 Q100 44.5 104.5 50.5" stroke="#ffd0dc" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          ) : (
            <>
              <circle cx="100" cy="48.25" r="2.8" fill={EYE} stroke="#ffd0dc" strokeWidth=".8" />
              <circle cx="99" cy="47.3" r=".9" fill="#fff" />
            </>
          )}
        </Eyes>
        {/* arms, shoulders, then the rifle in its hands */}
        <g transform={la1.t}>{upper(la1.L)}</g>
        <g transform={ra1.t}>{upper(ra1.L)}</g>
        <Sym>
          <path d="M47 64 C47 57 53 54 61 54 H76 L80 72 L74 87 H53 L45 77Z" fill={`url(#${A})`} {...OL} />
          <path d="M47 64 H78" stroke={c2} strokeWidth="2.6" />
          <path d="M50 58 Q60 55.5 72 56" stroke="#fff" strokeWidth="1.1" opacity=".55" fill="none" />
          <path d="M48 76 L74 79" {...ln} />
          <Bolt x={52} y={70} r={1.1} />
          <Bolt x={72} y={71} r={1.1} />
        </Sym>
        <text x="62" y="84.5" textAnchor="middle" fontSize="5" fontFamily="ui-monospace, monospace" fontWeight="700" fill={c2} opacity=".9">
          LR-7
        </text>
        {mk >= 2 && (
          <g>
            <path d="M58 56 L50 39 M64 56 L52 40" stroke={GUN} strokeWidth="2.4" strokeLinecap="round" />
            <ellipse cx="49" cy="36" rx="17" ry="5.4" fill={`url(#${T})`} {...OL} />
            <path d="M33 36 H65" stroke={dk(c2, 55)} strokeWidth="2.2" />
            <path d="M38 33.2 Q49 31.5 60 33.2" stroke="#fff" strokeWidth="1" opacity=".75" fill="none" />
            <circle cx="49" cy="30" r="1.8" fill={EYE} className={an(still, 'bmc-pulse')} />
          </g>
        )}
        <g transform={RIFLE}>
          <path d="M0 -7 H22 L30 -4 V5 L20 9 H2 C0 9 -1 7 -1 5Z" fill={`url(#${T})`} {...OL} />
          <path d="M5 -2.5 H17 L19 0 L17 2.5 H5Z" fill={dk(c2, 55)} />
          <path d="M36 4 H44 L41 17 H33Z" fill={GUN} {...TH} />
          <path d="M50 4 H62 L60 21 H51Z" fill={`url(#${T})`} {...TH} />
          <path d="M52 9 H60.5 M52 13 H60" stroke={dk(c2, 45)} strokeWidth=".7" />
          <rect x="26" y="-6" width="50" height="11" rx="2" fill={`url(#${M})`} {...OL} />
          <path d="M30 0 H55 M56 -6 V5" stroke={STEEL_D} strokeWidth=".8" />
          <rect x="58" y="-4.5" width="9" height="3" rx="1" fill={INK} />
          <rect x="36" y="-10" width="5" height="5" fill={GUN} />
          <rect x="62" y="-10" width="5" height="5" fill={GUN} />
          <rect x="28" y="-17" width="48" height="8" rx="4" fill={`url(#${M})`} {...TH} />
          <rect x="47" y="-20.5" width="6" height="4" rx="1" fill={GUN} />
          <path d="M74 -19 H84 V-7 H74Z" fill={GUN} {...TH} />
          <ellipse cx="84.5" cy="-13" rx="1.8" ry="5.2" fill={`url(#${LS})`} />
          {mk === 3 && <path d="M28 -16 L21 -22 M84 -18 L90 -24" stroke={GUN} strokeWidth="2.2" strokeLinecap="round" />}
          <rect x="74" y="-5.5" width="46" height="10" rx="1.5" fill={`url(#${A})`} {...OL} />
          {[80, 87, 94, 101, 108].map((x) => <rect key={x} x={x} y="-2.5" width="4.5" height="3.5" rx="1" fill={INK} />)}
          <rect x="118" y="-2.6" width="38" height="5.2" fill={`url(#${M})`} {...TH} />
          <rect x="154" y="-4.6" width="13" height="9.2" rx="1.2" fill={GUN} {...TH} />
          <path d="M158 -4.6 V4.6 M162 -4.6 V4.6" stroke={STEEL} strokeWidth="1" />
          {mk < 3 ? (
            <path d="M100 6.5 H124" stroke={STEEL_D} strokeWidth="2.2" strokeLinecap="round" />
          ) : (
            <g>
              <path d="M112 5 L102 25 M112 5 L122 25" stroke={GUN} strokeWidth="3" strokeLinecap="round" />
              <path d="M112 5 L102 25 M112 5 L122 25" stroke={STEEL} strokeWidth="1" strokeLinecap="round" />
              <circle cx="112" cy="5" r="2.2" fill={STEEL_D} />
            </g>
          )}
        </g>
        {/* forearms and hands over the rifle */}
        <g transform={la2.t}>{fore(la2.L)}</g>
        <g transform={ra2.t}>{fore(ra2.L)}</g>
        {mk === 3 && (
          <g>
            {[[118, 181, 20], [126, 183, -30], [135, 180.5, 70], [145, 182.5, 10], [110, 183, -60]].map(([x, y, r], i) => (
              <g key={i} transform={`rotate(${r} ${x} ${y})`}>
                <rect x={x - 3} y={y - 1.1} width="6" height="2.2" rx=".8" fill="#d6a63f" stroke="#7a5512" strokeWidth=".5" />
                <rect x={x + 2} y={y - 1.1} width="1" height="2.2" fill="#7a5512" />
              </g>
            ))}
            <g transform="rotate(-35 108 90)">
              <rect x="105" y="88.9" width="6" height="2.2" rx=".8" fill="#d6a63f" stroke="#7a5512" strokeWidth=".5" />
            </g>
            <path d="M99 96 Q103 92 106 93" stroke={STEEL} strokeWidth="1.2" fill="none" opacity=".7" />
            <g className={an(still, 'bmc-glint')} style={origin(72.3, 107.5)}>
              <polygon points={star(72.3, 107.5, 11, 4, 0.18)} fill="#fff" filter={`url(#${GL})`} />
              <polygon points={star(72.3, 107.5, 9, 4, 0.14)} fill="#fff" />
              <circle cx="72.3" cy="107.5" r="2" fill="#bff7ff" />
            </g>
          </g>
        )}
      </g>
    </g>
  );
}

// ─── Rocket Fist ────────────────────────────────────────────────────────────
// A seventies super robot: a chest plate like a radiator grille, horns, and fists that fly.
const ROCKET = 'translate(174 64) rotate(-170)';
function RocketFist({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const B = `${uid}-b`, Bh = `${uid}-bh`, Y = `${uid}-y`, S = `${uid}-s`, AU = `${uid}-au`, GL = `${uid}-gl`, HOT = `${uid}-hot`, RAY = `${uid}-ray`;
  const ink = dk(c, 62);
  const ln = { fill: 'none', stroke: ink, strokeWidth: 0.9, strokeLinecap: 'round' } as const;
  const EYE = '#fff27a';
  const upper = (
    <g>
      <rect x="-7.5" y="-2" width="15" height="22" rx="3" fill={`url(#${S})`} {...TH} />
      {[3, 8, 13].map((y) => <path key={y} d={`M-7.5 ${y} H7.5`} stroke={STEEL_D} strokeWidth="1.2" />)}
    </g>
  );
  const fore = (
    <g>
      <path d="M-11 0 H11 L13.5 31 H-13.5Z" fill={`url(#${Bh})`} {...OL} />
      <path d="M-8 4 L-3 26" stroke="#fff" strokeWidth="1.2" opacity=".45" />
      <rect x="-13.5" y="22" width="27" height="6" fill={`url(#${Y})`} {...TH} />
      <path d="M-13.5 25 H13.5" stroke={dk(c2, 45)} strokeWidth=".8" />
      <path d="M-10 10 H10" {...ln} />
      <path d="M-13.5 30 H13.5 V44 C13.5 49 9.5 52 5 52 H-5 C-9.5 52 -13.5 49 -13.5 44Z" fill={`url(#${S})`} {...OL} />
      <path d="M-13.5 36 H13.5" stroke={STEEL_D} strokeWidth="1.1" />
      <path d="M-6.5 38 V50 M0 38 V51.5 M6.5 38 V50" stroke={STEEL_D} strokeWidth="1" />
      <path d="M-11 32.5 H10" stroke="#fff" strokeWidth="1.1" opacity=".75" />
    </g>
  );
  return (
    <g>
      <defs>
        <Lin id={B} c={c} />
        <Lin id={Bh} c={c} h />
        <Lin id={Y} c={c2} />
        <Lin id={S} c={STEEL} h />
        <Lin id={AU} c={GOLD} />
        <Blur id={GL} s={2.4} />
        <radialGradient id={RAY} cx="100" cy="82" r="92" gradientUnits="userSpaceOnUse">
          <stop offset=".2" stopColor="#fff6d0" />
          <stop offset=".45" stopColor={GOLD} stopOpacity=".85" />
          <stop offset="1" stopColor={FIRE} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={HOT} cx=".5" cy=".35" r=".7">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".45" stopColor="#ffe08a" />
          <stop offset="1" stopColor={FIRE} />
        </radialGradient>
      </defs>
      {mk === 3 && (
        <g className={an(still, 'bmc-beam')} style={origin(100, 82)}>
          {Array.from({ length: 18 }, (_, i) => {
            const a = ((i * 360) / 18 + 6) * (Math.PI / 180);
            const r = i % 2 ? 70 : 92;
            const w = i % 2 ? 0.05 : 0.08;
            return (
              <polygon
                key={i}
                points={pts([[100, 82], [100 + r * Math.cos(a - w), 82 + r * Math.sin(a - w)], [100 + r * Math.cos(a + w), 82 + r * Math.sin(a + w)]])}
                fill={`url(#${RAY})`}
              />
            );
          })}
          <circle cx="100" cy="82" r="40" fill={FIRE} opacity=".5" filter={`url(#${GL})`} />
        </g>
      )}
      <Shadow rx={62} />
      <g className={an(still, 'bmc-bob')}>
        {/* legs */}
        <Sym>
          <rect x="78" y="132" width="17" height="16" rx="2" fill={`url(#${S})`} {...TH} />
          <path d="M78 137 H95 M78 142 H95" stroke={STEEL_D} strokeWidth="1.2" />
          <path d="M68 150 L57 158 L60 173 L67 171Z" fill={`url(#${Y})`} {...OL} />
          <path d="M70 146 H100 L102 174 H66Z" fill={`url(#${Bh})`} {...OL} />
          <path d="M72 162 H100 M86 156 V172" {...ln} />
          <path d="M73 150 L76 170" stroke="#fff" strokeWidth="1.3" opacity=".4" />
          <path d="M75 143 H97 L95 155 L86 158 L77 155Z" fill={`url(#${Y})`} {...OL} />
          <path d="M79 147 H93" stroke="#fff" strokeWidth="1" opacity=".7" />
          <path d="M59 172 H104 L106 184 H55Z" fill={`url(#${B})`} {...OL} />
          <path d="M60 176 H105" stroke={c2} strokeWidth="1.6" />
          <Bolt x={63} y={180} />
          <Bolt x={98} y={180} />
        </Sym>
        {/* hips and belt */}
        <path d="M93 122 H107 L105 140 H95Z" fill={`url(#${S})`} {...TH} />
        <Sym>
          <path d="M68 122 H96 L94 137 H73Z" fill={`url(#${B})`} {...OL} />
          <path d="M71 133 H94" stroke={c2} strokeWidth="1.8" />
        </Sym>
        <path d="M76 102 H124 L121 118 H79Z" fill={`url(#${S})`} {...TH} />
        {[106, 110, 114].map((y) => <path key={y} d={`M78 ${y} H122`} stroke={STEEL_D} strokeWidth="1.2" />)}
        <rect x="68" y="115" width="64" height="10" rx="2.5" fill={`url(#${Y})`} {...OL} />
        <rect x="91" y="114" width="18" height="12" rx="2" fill={`url(#${S})`} {...TH} />
        <rect x="95" y="118" width="10" height="4" rx="1" fill={INK} />
        {/* torso */}
        <path d="M60 62 H140 L134 106 H66Z" fill={`url(#${B})`} {...OL} />
        <path d="M63 66 L68 102 M137 66 L132 102" {...ln} />
        <path d="M64 66 H136 L128 85 L100 99 L72 85Z" fill={`url(#${Y})`} {...OL} />
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M${72 + i * 7} ${70 + i * 1.5} L100 ${84 - i * 4.5} L${128 - i * 7} ${70 + i * 1.5}`} fill="none" stroke={dk(c2, 40)} strokeWidth="1.3" />
        ))}
        <path d="M67 68 H133" stroke="#fff" strokeWidth="1.3" opacity=".65" />
        {mk === 3 && (
          <g className={an(still, 'bmc-pulse')}>
            <path d="M64 66 H136 L128 85 L100 99 L72 85Z" fill={`url(#${HOT})`} opacity=".92" />
            <path d="M64 66 H136 L128 85 L100 99 L72 85Z" fill="#fff" opacity=".5" filter={`url(#${GL})`} />
          </g>
        )}
        <Bolt x={68} y={100} />
        <Bolt x={132} y={100} />
        {/* shoulders */}
        <Sym>
          <path d="M51 57 L55 44 L61 57Z" fill={`url(#${S})`} {...TH} />
          <path d="M40 70 C40 60 48 56 58 56 H74 L77 90 H45 C42 90 40 87 40 83Z" fill={`url(#${B})`} {...OL} />
          <path d="M41 74 H76" stroke={c2} strokeWidth="4" />
          <path d="M45 61 Q56 57.5 70 58.5" stroke="#fff" strokeWidth="1.4" opacity=".6" fill="none" />
          {[47, 55, 63, 71].map((x) => <Bolt key={x} x={x} y={84} r={1.1} />)}
        </Sym>
        {/* arms */}
        <g transform="translate(59 90)">{upper}</g>
        <g transform="translate(59 108)">{fore}</g>
        <g transform="translate(141 90)">{upper}</g>
        {mk === 1 ? (
          <g transform="translate(141 108)">{fore}</g>
        ) : (
          <g>
            <ellipse cx="141" cy="110" rx="10" ry="4.5" fill={INK} {...TH} />
            <ellipse cx="141" cy="110" rx="6" ry="2.4" fill={FIRE} filter={`url(#${GL})`} />
            <ellipse cx="141" cy="110" rx="5" ry="2" fill="#ffd48a" />
            {[-7, -2.5, 2.5, 7].map((x) => <rect key={x} x={141 + x - 0.8} y="107" width="1.6" height="3" fill={STEEL} />)}
          </g>
        )}
        {/* neck and head */}
        <rect x="91" y="56" width="18" height="10" rx="2" fill={`url(#${S})`} {...TH} />
        <Sym>
          <path d="M86 36 C76 31 73 20 77 11 C80 20 85 26 92 30Z" fill={`url(#${Y})`} {...OL} />
          <path d="M80 44 L69 39 L72 53 L80 55Z" fill={`url(#${Y})`} {...TH} />
        </Sym>
        <path d="M80 46 C80 34 90 28 100 28 C110 28 120 34 120 46 V58 L112 64 H88 L80 58Z" fill={`url(#${B})`} {...OL} />
        <path d="M86 34 Q93 30 100 30" stroke="#fff" strokeWidth="1.4" opacity=".6" fill="none" />
        <path d="M86 43 H114 V56 L108 62 H92 L86 56Z" fill={`url(#${S})`} stroke={ink} strokeWidth="1" />
        <path d="M89 36 L100 44 L111 36 L107 33.5 L100 38.5 L93 33.5Z" fill={`url(#${Y})`} stroke={ink} strokeWidth=".8" />
        <rect x="93" y="54" width="14" height="7" rx="1" fill={INK} />
        {[96, 99, 102, 105].map((x) => <rect key={x} x={x - 0.7} y="54.5" width="1.4" height="6" fill={STEEL} />)}
        <Sym>
          <circle cx="80.5" cy="50" r="2.4" fill={`url(#${S})`} stroke={ink} strokeWidth=".6" />
        </Sym>
        <Eyes still={still}>
          <g className={an(still, 'bmc-pulse')}>
            {happy ? (
              <path d="M88 51 Q93 44.5 98 50.5 M112 51 Q107 44.5 102 50.5" stroke={EYE} strokeWidth="5" fill="none" filter={`url(#${GL})`} />
            ) : (
              <path d="M87 45.5 L98 48 L97 52.5 L88 51.5Z M113 45.5 L102 48 L103 52.5 L112 51.5Z" fill={EYE} filter={`url(#${GL})`} />
            )}
          </g>
          {happy ? (
            <path d="M88 51 Q93 44.5 98 50.5 M112 51 Q107 44.5 102 50.5" stroke="#fffbe0" strokeWidth="2.6" strokeLinecap="round" fill="none" />
          ) : (
            <path d="M87 45.5 L98 48 L97 52.5 L88 51.5Z M113 45.5 L102 48 L103 52.5 L112 51.5Z" fill="#fffbe0" stroke="#c9a400" strokeWidth=".8" />
          )}
        </Eyes>
        {/* Mk III: the horned crown */}
        {mk === 3 && (
          <g>
            <Sym>
              <path d="M88 31 C72 25 62 12 66 2 C71 12 79 18 94 24Z" fill={`url(#${AU})`} {...OL} />
              <path d="M84 26 C76 22 70 16 68 8" stroke="#fff" strokeWidth="1.1" opacity=".7" fill="none" />
            </Sym>
            <path d="M84 34 L87 21 L94 28 L100 15 L106 28 L113 21 L116 34 Q100 30 84 34Z" fill={`url(#${AU})`} {...OL} />
            <circle cx="100" cy="25" r="2.6" fill="#e0245e" stroke={dk(GOLD, 55)} strokeWidth=".8" />
            <circle cx="99.2" cy="24.2" r=".8" fill="#fff" />
            <circle cx="90" cy="30" r="1.4" fill={c2} />
            <circle cx="110" cy="30" r="1.4" fill={c2} />
          </g>
        )}
      </g>
      {/* Mk II: the right fist, launched */}
      {mk >= 2 && (
        <g className={an(still, 'bmc-float')} style={origin(178, 40)}>
          <g transform={ROCKET}>
            <g className={an(still, 'bmc-flick')} style={origin(0, 0)}>
              <path d={flame(0, 0, 40, 15)} fill={FIRE} filter={`url(#${GL})`} opacity=".8" />
              <path d={flame(0, 0, 38, 12)} fill={FIRE} />
              <path d={flame(0, 0, 26, 8)} fill="#ffd166" />
              <path d={flame(0, 0, 14, 4.5)} fill="#fff" />
            </g>
            {fore}
            <ellipse cx="0" cy="0" rx="11" ry="3.5" fill={INK} stroke="var(--fg)" strokeWidth="1.5" />
          </g>
          <path d="M160 46 L156 70 M190 30 L187 52 M166 22 L163 36" stroke="var(--fg)" strokeWidth="1.2" opacity=".45" strokeLinecap="round" />
        </g>
      )}
    </g>
  );
}

// ─── Sentai Red ─────────────────────────────────────────────────────────────
// A transformation suit: a black visor, white gloves and boots, one fist to the sky.
const PLUMES: [number, number, string][] = [
  [-60, 86, '#2bc653'], [60, 86, '#ff5fa2'], [-33, 118, '#1e6bff'], [33, 118, '#ffd60a'], [0, 136, '#ef233c'],
];
function Sentai({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const R = `${uid}-r`, Rh = `${uid}-rh`, W = `${uid}-w`, S = `${uid}-s`, V = `${uid}-v`, GL = `${uid}-gl`;
  const ink = dk(c, 60);
  const ln = { fill: 'none', stroke: ink, strokeWidth: 0.9, strokeLinecap: 'round' } as const;
  const SUIT = '#1a1a22';
  const la1 = aim(74, 74, 58, 54), la2 = aim(58, 54, 50, 30);
  const ra1 = mk === 1 ? aim(126, 74, 146, 94) : aim(126, 74, 147, 84);
  const ra2 = mk === 1 ? aim(146, 94, 124, 108) : aim(147, 84, 158, 88);
  const upper = (L: number) => (
    <g>
      <rect x="-7" y="-3" width="14" height={L + 5} rx="6" fill={`url(#${Rh})`} {...OL} />
      <path d={`M-7 4 H7`} stroke={c2} strokeWidth="2.2" />
      <path d={`M-3.5 0 V${L - 2}`} stroke="#fff" strokeWidth="1.2" opacity=".35" />
    </g>
  );
  const fist = (vsign: boolean) =>
    vsign ? (
      <g>
        <path d="M-4.5 4 L-6.5 16 M2 4 L4 16" stroke="var(--fg)" strokeWidth="6" strokeLinecap="round" />
        <path d="M-4.5 4 L-6.5 16 M2 4 L4 16" stroke={c2} strokeWidth="3.4" strokeLinecap="round" />
        <rect x="-7" y="-2" width="14" height="11" rx="4.5" fill={`url(#${W})`} {...OL} />
        <path d="M-3 7 Q0 9 4 6" {...ln} stroke={dk(c2, 40)} />
      </g>
    ) : (
      <g>
        <rect x="-7.5" y="-2" width="15" height="13" rx="4.5" fill={`url(#${W})`} {...OL} />
        <path d="M-7.5 5 H7.5 M-2.5 5 V10.5 M2.5 5 V10.5" stroke={dk(c2, 40)} strokeWidth=".8" />
      </g>
    );
  const fore = (L: number, vsign = false) => (
    <g>
      <rect x="-6" y="-2" width="12" height={L} rx="5" fill={`url(#${Rh})`} {...OL} />
      <path d={`M-6.5 ${L - 9} H6.5 L7.5 ${L} H-7.5Z`} fill={`url(#${W})`} {...TH} />
      <path d={`M-6.5 ${L - 9} H6.5`} stroke={SUIT} strokeWidth="1.4" />
      <g transform={`translate(0 ${L})`}>{fist(vsign)}</g>
    </g>
  );
  const thigh = aim(91, 112, 80, 146), shin = aim(80, 146, 73, 174);
  return (
    <g>
      <defs>
        <Lin id={R} c={c} />
        <Lin id={Rh} c={c} h />
        <Lin id={W} c={c2} k={0.6} />
        <Lin id={S} c={STEEL} h />
        <linearGradient id={V} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a4254" />
          <stop offset=".45" stopColor="#0c0d12" />
          <stop offset=".55" stopColor="#262c3a" />
          <stop offset="1" stopColor="#050508" />
        </linearGradient>
        <Blur id={GL} s={2.4} />
      </defs>
      {mk === 3 && (
        <g>
          <ellipse cx="100" cy="174" rx="70" ry="12" fill="#fff3b0" opacity=".7" filter={`url(#${GL})`} />
          {PLUMES.map(([a, d, col], i) => {
            const r = (a * Math.PI) / 180;
            const x = 100 + d * Math.sin(r), y = 172 - d * Math.cos(r);
            const k = i === 4 ? 19 : i < 2 ? 13 : 15;
            const nx = Math.cos(r), ny = Math.sin(r);
            const puffs: [number, number, number][] = [
              [0, 0, k], [-k * 0.8, k * 0.35, k * 0.72], [k * 0.8, k * 0.35, k * 0.72], [0, -k * 0.75, k * 0.7],
              ...([[0.3, 0.36, 1], [0.55, 0.48, -1], [0.78, 0.6, 1]] as const).map(([t, f, s]): [number, number, number] => [
                (100 - x) * (1 - t) + nx * k * 0.14 * s, (172 - y) * (1 - t) + ny * k * 0.14 * s, k * f,
              ]),
            ];
            const col2 = `${x - nx * k * 0.45},${y - ny * k * 0.45} ${100 - nx * 3},${172 - ny * 3} ${100 + nx * 3},${172 + ny * 3} ${x + nx * k * 0.45},${y + ny * k * 0.45}`;
            return (
              <g key={i} className={an(still, 'bmc-plume')} style={{ ...origin(100, 172), animationDelay: `${-i * 0.45}s` }}>
                <polygon points={col2} fill={col} stroke="var(--fg)" strokeWidth="1.4" strokeLinejoin="round" />
                {puffs.map(([dx, dy, pr], j) => <circle key={j} cx={x + dx} cy={y + dy} r={pr} fill={col} stroke="var(--fg)" strokeWidth="2.6" />)}
                <polygon points={col2} fill={col} />
                {puffs.map(([dx, dy, pr], j) => <circle key={j} cx={x + dx} cy={y + dy} r={pr} fill={col} />)}
                <circle cx={x + k * 0.25} cy={y + k * 0.35} r={k * 0.8} fill="#000" opacity=".14" />
                <circle cx={x - k * 0.3} cy={y - k * 0.4} r={k * 0.42} fill="#fff" opacity=".45" />
                <polygon points={`${100 - nx * 1.6},${172 - ny * 1.6} ${100 + nx * 1.6},${172 + ny * 1.6} ${x},${y}`} fill="#fff" opacity=".6" />
              </g>
            );
          })}
          {[[30, 60], [170, 50], [58, 18], [146, 16], [20, 128], [182, 134]].map(([x, y], i) => (
            <polygon key={i} points={star(x, y, 4.5, 4, 0.3)} fill="#fff" stroke="var(--fg)" strokeWidth=".8" />
          ))}
        </g>
      )}
      <Shadow rx={mk === 3 ? 66 : 54} />
      <g className={an(still, 'bmc-bob')}>
        {/* legs: a wide stance */}
        <Sym>
          <g transform={thigh.t}>
            <path d={`M-9 -4 H9 L7 ${thigh.L + 2} H-7Z`} fill={`url(#${Rh})`} {...OL} />
            <path d={`M-4 2 V${thigh.L - 4}`} stroke="#fff" strokeWidth="1.2" opacity=".35" />
          </g>
          <g transform={shin.t}>
            <path d={`M-7.5 -3 H7.5 L6.5 ${shin.L} H-6.5Z`} fill={`url(#${Rh})`} {...OL} />
            <path d={`M-7.4 8 H7.3 L6.5 ${shin.L + 1} H-6.5Z`} fill={`url(#${W})`} {...TH} />
            <path d="M-7.4 8 L0 13 L7.3 8" fill="none" stroke={c} strokeWidth="1.6" />
          </g>
          <circle cx="80" cy="146" r="6" fill={`url(#${R})`} {...TH} />
          <path d="M64 172 H81 L83 180 H57 C57 176 59 173 64 172Z" fill={`url(#${W})`} {...OL} />
          <path d="M56.5 180 H83.5 V183 H56.5Z" fill={SUIT} />
        </Sym>
        {/* torso */}
        <path d="M86 108 H114 L116 118 L108 124 H92 L84 118Z" fill={`url(#${R})`} {...OL} />
        <path d="M76 68 C76 66 78 64 82 64 H118 C122 64 124 66 124 68 L122 98 L114 110 H86 L78 98Z" fill={`url(#${R})`} {...OL} />
        <path d="M78 68 L100 96 L122 68 L115.5 65 L100 86 L84.5 65Z" fill={`url(#${W})`} stroke={ink} strokeWidth=".8" />
        <path d="M84 98 Q92 102 100 100 Q108 102 116 98 M100 100 V108 M90 104 Q95 106 100 105" {...ln} />
        <path d="M80 72 L83 94" stroke="#fff" strokeWidth="1.3" opacity=".4" />
        <circle cx="100" cy="76" r="5.4" fill={`url(#${W})`} stroke={ink} strokeWidth=".8" />
        <text x="100" y="79" textAnchor="middle" fontFamily={KANJI} fontSize="7.4" fontWeight="700" fill={c}>
          戦
        </text>
        {/* belt */}
        <rect x="83" y="105" width="34" height="8" rx="2" fill={SUIT} {...TH} />
        {mk === 1 ? (
          <g>
            <rect x="93" y="102.5" width="14" height="13" rx="3" fill={`url(#${S})`} {...TH} />
            <polygon points={star(100, 109, 4.2)} fill={c} />
          </g>
        ) : (
          <g>
            {[86, 111].map((x) => <rect key={x} x={x} y="104" width="4" height="10" rx="1" fill={`url(#${W})`} stroke={SUIT} strokeWidth=".6" />)}
            <g className={an(still, 'bmc-pulse')}>
              <circle cx="100" cy="109" r="13" fill={c} filter={`url(#${GL})`} opacity=".85" />
              {Array.from({ length: 8 }, (_, i) => {
                const a = (i * Math.PI) / 4;
                return <path key={i} d={`M${100 + 10 * Math.cos(a)} ${109 + 10 * Math.sin(a)} L${100 + 17 * Math.cos(a)} ${109 + 17 * Math.sin(a)}`} stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity=".8" />;
              })}
            </g>
            <circle cx="100" cy="109" r="8.5" fill={`url(#${S})`} {...TH} />
            <circle cx="100" cy="109" r="5.4" fill={lt(c, 25)} stroke={dk(c, 40)} strokeWidth=".8" />
            <circle cx="100" cy="109" r="2.6" fill="#fff" />
            <path d="M96.5 106 Q98 104.5 100 104.5" stroke="#fff" strokeWidth="1" fill="none" />
          </g>
        )}
        {/* arms: one fist raised, one on the hip (or holding the blaster) */}
        <g transform={la1.t}>{upper(la1.L)}</g>
        <g transform={la2.t}>{fore(la2.L, happy)}</g>
        <g transform={ra1.t}>{upper(ra1.L)}</g>
        <g transform={ra2.t}>{fore(ra2.L)}</g>
        {mk >= 2 && (
          <g>
            <path d="M149 80.5 H183 L188 83 V88 L183 90.5 H171 L169 93 H157 L151 90.5 H148Z" fill={`url(#${W})`} {...OL} />
            <path d="M151 84 H182" stroke={c} strokeWidth="2.4" />
            <path d="M153 88 H168" stroke={dk(c2, 40)} strokeWidth=".8" />
            <rect x="155" y="76.5" width="13" height="4.5" rx="1.5" fill={SUIT} {...TH} />
            <rect x="183" y="82.5" width="7" height="6" rx="1" fill={`url(#${S})`} {...TH} />
            <circle cx="192" cy="85.5" r="2.4" fill={c} filter={`url(#${GL})`} className={an(still, 'bmc-pulse')} />
            <circle cx="191.5" cy="85.5" r="1" fill="#fff" />
          </g>
        )}
        {/* head */}
        <rect x="93" y="60" width="14" height="8" fill={SUIT} />
        <path d="M80 44 C80 30 89 22 100 22 C111 22 120 30 120 44 V56 C120 62 114 66 108 66 H92 C86 66 80 62 80 56Z" fill={`url(#${R})`} {...OL} />
        <path d="M86 30 Q92 25 100 24.5" stroke="#fff" strokeWidth="1.6" opacity=".6" fill="none" />
        <Sym>
          <circle cx="80.5" cy="51" r="4" fill={`url(#${S})`} stroke={ink} strokeWidth=".8" />
        </Sym>
        <path d="M83 39 H117 L115.5 49.5 L105 52 L100 59 L95 52 L84.5 49.5Z" fill={c2} stroke={ink} strokeWidth=".9" />
        <path d="M85 40.5 H115 L113.8 48.4 L104 50.6 L100 56.4 L96 50.6 L86.2 48.4Z" fill={`url(#${V})`} />
        <path d="M88 42.5 L97 42.5 L95 45 L88.5 45Z" fill="#fff" opacity=".35" />
        <path d="M104 46.5 H112" stroke="#8fb6ff" strokeWidth=".9" opacity=".6" />
        {happy && (
          <g>
            <path d="M89 47 Q93 43.5 97 47 M103 47 Q107 43.5 111 47" stroke="#ff9aa6" strokeWidth="1.3" fill="none" opacity=".85" strokeLinecap="round" />
            <polygon points={star(113, 41, 3.4, 4, 0.25)} fill="#fff" />
          </g>
        )}
        <path d="M94 57 H106 L104.5 63.5 H95.5Z" fill={`url(#${S})`} stroke={ink} strokeWidth=".8" />
        <path d="M97 59.5 H103 M97.5 61.5 H102.5" stroke={STEEL_D} strokeWidth=".7" />
        <path d="M97 22.6 L100 32 L103 22.6" fill={c2} stroke={ink} strokeWidth=".7" />
      </g>
    </g>
  );
}

// ─── Kaiju Breaker ──────────────────────────────────────────────────────────
// Twenty storeys of armour: huge shoulders, a small sunk head, a reactor in the chest.
/** A container crane, tiny, drawn in ink so it reads on both themes. Feet at (0, 0). */
function Crane({ x, flip }: { x: number; flip?: boolean }) {
  const st = { stroke: 'var(--fg)', strokeWidth: 1.1, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  return (
    <g transform={`translate(${x} 184) scale(${flip ? -1 : 1} 1)`}>
      <path d="M-8 0 L-6 -22 M6 0 L4 -22 M-6 -22 H4 M-7 -11 H5 M-7 -11 L5 0 M5 -11 L-7 0" {...st} />
      <path d="M-14 -22 H22 M-10 -22 L-1 -32 L8 -22 M-1 -32 L22 -22" {...st} />
      <rect x="-3" y="-21" width="5" height="4" fill="#e9503f" stroke="var(--fg)" strokeWidth=".7" />
      <path d="M16 -22 V-15" stroke="var(--fg)" strokeWidth=".7" />
      <rect x="13.5" y="-15" width="5" height="2.5" fill="#3d8bfd" />
    </g>
  );
}
function Kaiju({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const A = `${uid}-a`, Ah = `${uid}-ah`, D = `${uid}-d`, S = `${uid}-s`, GL = `${uid}-gl`, HZ = `${uid}-hz`, CORE = `${uid}-core`;
  const ink = dk(c, 60);
  const ln = { fill: 'none', stroke: ink, strokeWidth: 0.9, strokeLinecap: 'round' } as const;
  const DARK = dk(c, 45);
  const upper = (
    <g>
      <rect x="-10" y="-2" width="20" height="28" rx="4" fill={`url(#${D})`} {...TH} />
      <path d="M-6 0 V24 M6 0 V24" stroke={STEEL} strokeWidth="2" />
      <path d="M-6 0 V12 M6 0 V12" stroke="#fff" strokeWidth=".7" opacity=".7" />
      <circle cx="0" cy="25" r="8" fill={`url(#${S})`} {...TH} />
      <circle cx="0" cy="25" r="3" fill={DARK} />
    </g>
  );
  const gauntlet = (
    <g>
      <path d="M-15 0 H15 L17 34 H-17Z" fill={`url(#${Ah})`} {...OL} />
      <rect x="-16" y="7" width="32" height="5" fill={`url(#${HZ})`} stroke={INK} strokeWidth=".6" />
      <path d="M-9 17 H9 M-9 21 H9 M-9 25 H9" stroke={INK} strokeWidth="1.4" />
      <path d="M-12 2 L-13 30" stroke="#fff" strokeWidth="1.2" opacity=".35" />
      <Bolt x={-12} y={31} />
      <Bolt x={12} y={31} />
    </g>
  );
  const fist = (
    <g>
      <path d="M-17 33 H17 V46 C17 52 13 55 7 55 H-7 C-13 55 -17 52 -17 46Z" fill={`url(#${D})`} {...OL} />
      {[-11.5, -4, 3.5, 11].map((x) => <rect key={x} x={x - 3.2} y="35" width="6.6" height="8" rx="2" fill={`url(#${S})`} stroke={INK} strokeWidth=".6" />)}
      <path d="M-14 48 H14" stroke={INK} strokeWidth=".8" opacity=".6" />
    </g>
  );
  const sword = (
    <g>
      <path d="M-11 30 H11 L10 42 H-10Z" fill={`url(#${S})`} {...TH} />
      <path d="M-8 42 H8 L9 64 L0 75 L-9 64Z" fill={`url(#${S})`} {...OL} />
      <path d="M-3 44 V66 M3 44 V66" stroke={STEEL_D} strokeWidth=".8" />
      <path d="M-2 45 L-2 64" stroke="#fff" strokeWidth="1.1" opacity=".75" />
      <g filter={`url(#${GL})`} opacity=".8">
        <path d="M-9 42 V64 L0 76 L9 64 V42" fill="none" stroke={c2} strokeWidth="3" />
      </g>
      {Array.from({ length: 7 }, (_, i) => {
        const y = 44 + i * 3.1;
        return (
          <g key={i}>
            <path d={`M-9 ${y} l-3 1.6 l3 1.6 M9 ${y} l3 1.6 l-3 1.6`} fill={c2} stroke={dk(c2, 45)} strokeWidth=".5" />
          </g>
        );
      })}
      <path d="M-10 31.5 H10" stroke={c2} strokeWidth="1.6" />
    </g>
  );
  return (
    <g>
      <defs>
        <Lin id={A} c={c} />
        <Lin id={Ah} c={c} h />
        <Lin id={D} c={DARK} h />
        <Lin id={S} c={STEEL} h />
        <Blur id={GL} s={2.6} />
        <radialGradient id={CORE} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".35" stopColor={lt(c2, 45)} />
          <stop offset=".75" stopColor={c2} />
          <stop offset="1" stopColor={dk(c2, 45)} />
        </radialGradient>
        <pattern id={HZ} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="5" height="5" fill={c2} />
          <rect width="2.5" height="5" fill={INK} />
        </pattern>
      </defs>
      <Shadow rx={mk === 3 ? 74 : 66} />
      {mk === 3 && (
        <g opacity=".75">
          {[[22, 189], [58, 192], [142, 192], [178, 189], [100, 194]].map(([x, y], i) => (
            <path key={i} d={`M${x - 9} ${y} q4.5 -3 9 0 t9 0`} fill="none" stroke="#4aa3df" strokeWidth="1.3" strokeLinecap="round" />
          ))}
        </g>
      )}
      <g className={an(still, 'bmc-bob')}>
        {/* legs: stubby, heavy */}
        <Sym>
          <path d="M70 128 H95 L93 150 H72Z" fill={`url(#${D})`} {...TH} />
          <path d="M74 134 H92 M74 139 H92" stroke={INK} strokeWidth="1" />
          <path d="M62 156 H98 L101 177 H59Z" fill={`url(#${Ah})`} {...OL} />
          <path d="M66 166 H96 M80 160 V174" {...ln} />
          <rect x="84" y="160" width="10" height="4" rx="1" fill={c2} />
          <path d="M65 145 H97 L95 159 H67Z" fill={`url(#${A})`} {...OL} />
          <rect x="67" y="150" width="27" height="4" fill={`url(#${HZ})`} stroke={INK} strokeWidth=".6" />
          <path d="M53 175 H103 L105 184 H50Z" fill={`url(#${D})`} {...OL} />
          <path d="M55 179 H103" stroke={c2} strokeWidth="1.2" opacity=".8" />
        </Sym>
        {/* waist and hips */}
        <path d="M76 114 H124 L120 132 H80Z" fill={`url(#${D})`} {...TH} />
        {[119, 124, 129].map((y) => <path key={y} d={`M79 ${y} H121`} stroke={INK} strokeWidth="1.1" />)}
        <Sym>
          <path d="M60 116 H92 L90 138 H66Z" fill={`url(#${A})`} {...OL} />
          <path d="M64 121 H90" stroke={c2} strokeWidth="1.6" />
          <Bolt x={70} y={131} />
        </Sym>
        {/* torso and reactor */}
        <path d="M58 54 H142 L148 92 L132 118 H68 L52 92Z" fill={`url(#${A})`} {...OL} />
        {mk < 3 ? (
          <g>
            <Sym>
              <path d="M62 58 H92 C93 66 85 72 85 84 C85 96 93 100 92 106 H74 L60 92Z" fill={`url(#${Ah})`} {...OL} />
              <path d="M66 64 H88 M64 92 L74 102" {...ln} />
              <path d="M66 62 L64 88" stroke="#fff" strokeWidth="1.2" opacity=".35" />
              <Bolt x={68} y={70} />
              <Bolt x={70} y={96} />
            </Sym>
            <circle cx="100" cy="84" r="15" fill={INK} {...TH} />
            <circle cx="100" cy="84" r="14" fill={c2} opacity=".7" filter={`url(#${GL})`} className={an(still, 'bmc-pulse')} />
            <circle cx="100" cy="84" r="10" fill={`url(#${CORE})`} />
            <g className={an(still, 'bmc-spin')} style={origin(100, 84)}>
              {Array.from({ length: 8 }, (_, i) => (
                <path key={i} transform={`rotate(${i * 45} 100 84)`} d="M100 84 L98 74.5 Q101 73.5 103.5 75Z" fill={INK} opacity=".55" />
              ))}
            </g>
            <circle cx="100" cy="84" r="3" fill="#fff" />
            <circle cx="100" cy="84" r="14.5" fill="none" stroke={`url(#${S})`} strokeWidth="2" />
          </g>
        ) : (
          <g>
            <path d="M64 58 H136 L134 108 L118 114 H82 L66 108Z" fill={INK} {...TH} />
            <path d="M70 64 V106 M130 64 V106 M70 72 H82 M118 72 H130 M70 98 H82 M118 98 H130" stroke={dk(c, 20)} strokeWidth="1.6" />
            <Sym>
              <path d="M64 58 L50 52 L46 96 L62 104Z" fill={`url(#${Ah})`} {...OL} />
              <path d="M52 60 L50 92" {...ln} />
              <Bolt x={56} y={64} />
            </Sym>
            <circle cx="100" cy="85" r="30" fill={c2} opacity=".85" filter={`url(#${GL})`} className={an(still, 'bmc-pulse')} />
            <circle cx="100" cy="85" r="21" fill={`url(#${CORE})`} stroke={dk(c2, 40)} strokeWidth="1" />
            <g className={an(still, 'bmc-spin')} style={origin(100, 85)}>
              {Array.from({ length: 10 }, (_, i) => (
                <path key={i} transform={`rotate(${i * 36} 100 85)`} d="M100 85 L97 66 Q101.5 64.5 105 67Z" fill={dk(c2, 30)} opacity=".45" />
              ))}
            </g>
            <circle cx="100" cy="85" r="7" fill="#fff" />
            {[0, 1, 2, 3].map((i) => (
              <path key={i} transform={`rotate(${i * 90 + 45} 100 85)`} d="M100 61 l-3 -5 l4 -2 l-3 -5" fill="none" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" opacity=".9" />
            ))}
          </g>
        )}
        <path d="M60 58 H140" stroke="#fff" strokeWidth="1.2" opacity=".4" />
        {/* the head, sunk between collar plates */}
        <rect x="92" y="56" width="16" height="8" fill={`url(#${D})`} />
        <path d="M88 52 C88 44 93 40 100 40 C107 40 112 44 112 52 V60 L106 64 H94 L88 60Z" fill={`url(#${A})`} {...OL} />
        <path d="M92 44 Q96 41.5 100 41.5" stroke="#fff" strokeWidth="1.1" opacity=".55" fill="none" />
        <rect x="90" y="48.5" width="20" height="6" rx="3" fill={INK} />
        <Eyes still={still}>
          <g className={an(still, 'bmc-pulse')}>
            {happy ? (
              <path d="M92.5 54 Q100 47 107.5 54" stroke={c2} strokeWidth="4" fill="none" filter={`url(#${GL})`} />
            ) : (
              <rect x="91.5" y="49.5" width="17" height="4" rx="2" fill={c2} filter={`url(#${GL})`} />
            )}
          </g>
          {happy ? (
            <path d="M92.5 54 Q100 47 107.5 54" stroke={lt(c2, 60)} strokeWidth="1.8" fill="none" strokeLinecap="round" />
          ) : (
            <rect x="92" y="50.3" width="16" height="2.4" rx="1.2" fill={lt(c2, 60)} />
          )}
        </Eyes>
        <path d="M96 58 H104 M96 60.5 H104" stroke={INK} strokeWidth=".9" />
        <Sym>
          <path d="M78 64 L82 44 L90 46 L90 66Z" fill={`url(#${Ah})`} {...TH} />
        </Sym>
        {/* shoulders: the biggest thing on it */}
        <Sym>
          <g transform={mk >= 2 ? undefined : undefined}>
            <path d="M18 60 C18 46 30 38 46 38 H74 L82 50 L80 84 L58 94 H28 C21 94 17 88 17 82Z" fill={`url(#${A})`} {...OL} />
            <rect x="19" y="47" width="62" height="5.5" fill={`url(#${HZ})`} stroke={INK} strokeWidth=".6" />
            <path d="M24 43 Q40 39 70 40" stroke="#fff" strokeWidth="1.4" opacity=".5" fill="none" />
            <path d="M18 74 H78 L76 88 L58 96 H28 C21 96 17 90 17 84Z" fill={`url(#${Ah})`} {...OL} />
            {[24, 33, 42, 51, 60, 69].map((x) => <Bolt key={x} x={x} y={79} r={1.1} />)}
            {[58, 62, 66, 70].map((y) => <path key={y} d={`M54 ${y} H74`} stroke={INK} strokeWidth="1.5" />)}
            <path d="M22 58 V70" {...ln} />
          </g>
        </Sym>
        <rect x="28" y="56" width="16" height="15" rx="2" fill={c2} stroke={INK} strokeWidth=".8" />
        <text x="36" y="67.8" textAnchor="middle" fontFamily={KANJI} fontSize="12" fontWeight="700" fill={INK}>
          砕
        </text>
        <text x="146" y="69" textAnchor="middle" fontSize="11" fontFamily="ui-monospace, monospace" fontWeight="800" fill={c2}>
          09
        </text>
        {/* arms */}
        <g transform="translate(37 92)">{upper}</g>
        <g transform="translate(37 118)">
          {gauntlet}
          {fist}
        </g>
        <g transform="translate(163 92)">{upper}</g>
        {mk === 1 ? (
          <g transform="translate(163 118)">
            {gauntlet}
            {fist}
          </g>
        ) : (
          <g transform="translate(163 118) rotate(-10)">
            {sword}
            {gauntlet}
          </g>
        )}
        {mk === 3 && (
          <g>
            <Crane x={22} />
            <Crane x={142} flip />
            {[[34, 180, '#e9503f'], [40, 180, '#3d8bfd'], [37, 176.5, '#f4b400'], [118, 180, '#2bb673'], [124, 180, '#e9503f'], [121, 176.5, '#3d8bfd']].map(([x, y, f], i) => (
              <rect key={i} x={(x as number) - 3} y={y as number} width="6" height="3.5" fill={f as string} stroke="var(--fg)" strokeWidth=".5" />
            ))}
          </g>
        )}
      </g>
    </g>
  );
}

// ─── Unit Zero ──────────────────────────────────────────────────────────────
// A white prototype with a V-fin and violet light running in its seams.
const FEATHERS: [number, number][] = [[-72, 64], [-54, 76], [-36, 84], [-18, 84], [0, 72], [18, 58]];
const FRONT: [number, number][] = [[-62, 46], [-40, 54], [-18, 54], [4, 46], [24, 36]];
const FUNNELS: [number, number, number][] = [[28, 58, 150], [18, 104, 110], [36, 150, 60]];
/** The seams that glow, left half (mirrored). */
const ZERO_SEAMS = 'M88.5 55 L66 17.5 M85 62.5 L54 46.5 M85 92.5 L100 99.5 M89.5 126 V139 M92 158 L94.5 172 M67.8 109 V121 M93 114 L94 127';
function Zero({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const Z = `${uid}-z`, Zh = `${uid}-zh`, F = `${uid}-f`, AU = `${uid}-au`, FT = `${uid}-ft`, GL = `${uid}-gl`, BG = `${uid}-bg`, RY = `${uid}-ry`;
  const shade = dk(c2, 55);
  const ink = mix(c, shade, 45);
  const ln = { fill: 'none', stroke: ink, strokeWidth: 0.8, strokeLinecap: 'round' } as const;
  const lite = lt(c2, 45);
  const seamW = mk === 3 ? 1.5 : 1.1;
  return (
    <g>
      <defs>
        <linearGradient id={Z} x1="0" y1="0" x2=".6" y2="1">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".45" stopColor={c} />
          <stop offset=".82" stopColor={mix(c, shade, 80)} />
          <stop offset="1" stopColor={mix(c, shade, 62)} />
        </linearGradient>
        <linearGradient id={Zh} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={mix(c, shade, 70)} />
          <stop offset=".3" stopColor="#fff" />
          <stop offset=".6" stopColor={c} />
          <stop offset="1" stopColor={mix(c, shade, 66)} />
        </linearGradient>
        <Lin id={F} c="#9aa1b1" h />
        <Lin id={AU} c={GOLD} />
        <linearGradient id={FT} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={lt(c2, 70)} stopOpacity=".95" />
          <stop offset=".45" stopColor={lt(c2, 20)} stopOpacity=".7" />
          <stop offset="1" stopColor={c2} stopOpacity=".05" />
        </linearGradient>
        <radialGradient id={RY} cx="100" cy="92" r="96" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".35" stopColor={lt(c2, 40)} stopOpacity=".8" />
          <stop offset="1" stopColor={c2} stopOpacity="0" />
        </radialGradient>
        <Blur id={GL} s={1.6} />
        {mk === 3 && <Blur id={BG} s={9} />}
      </defs>
      {/* Mk III: the full burst behind everything */}
      {mk === 3 && (
        <g>
          <ellipse cx="100" cy="92" rx="62" ry="70" fill={c2} opacity=".5" filter={`url(#${BG})`} className={an(still, 'bmc-pulse')} />
          <g className={an(still, 'bmc-spin-r')} style={origin(100, 92)}>
            {Array.from({ length: 16 }, (_, i) => {
              const a = (i * Math.PI) / 8;
              const r = i % 4 === 0 ? 94 : i % 2 ? 60 : 76;
              const w = i % 4 === 0 ? 0.035 : 0.05;
              return (
                <polygon
                  key={i}
                  points={pts([[100, 92], [100 + r * Math.cos(a - w), 92 + r * Math.sin(a - w)], [100 + r * Math.cos(a + w), 92 + r * Math.sin(a + w)]])}
                  fill={`url(#${RY})`}
                />
              );
            })}
          </g>
        </g>
      )}
      {/* Mk II: wings of light */}
      {mk >= 2 && (
        <g className={an(still, 'bmc-plume')} style={origin(100, 70)}>
          <Sym>
            {FEATHERS.map(([a, L], i) => (
              <g key={i} transform={`translate(104 70) rotate(${a}) scale(${(L / 80) * (mk === 3 ? 1.04 : 1)} 1)`}>
                <path d="M0 -3.5 C25 -10 55 -8 80 0 C55 8 25 10 0 3.5Z" fill={`url(#${FT})`} stroke={c2} strokeOpacity=".55" strokeWidth=".7" />
                <path d="M4 0 H66" stroke="#fff" strokeWidth=".9" opacity=".75" />
              </g>
            ))}
            {FRONT.map(([a, L], i) => (
              <g key={`f${i}`} transform={`translate(102 74) rotate(${a}) scale(${L / 80} 1)`}>
                <path d="M0 -4 C25 -11 55 -9 80 0 C55 9 25 11 0 4Z" fill={`url(#${FT})`} stroke={c2} strokeOpacity=".6" strokeWidth=".7" />
                <path d="M4 0 H62" stroke="#fff" strokeWidth=".9" opacity=".85" />
              </g>
            ))}
          </Sym>
        </g>
      )}
      <Shadow rx={mk === 3 ? 60 : 50} />
      <g className={an(still, 'bmc-bob')}>
        {/* Mk II: the halo array */}
        {mk >= 2 && (
          <g className={an(still, 'bmc-spin-r')} style={origin(100, 44)}>
            <circle cx="100" cy="44" r="27" fill="none" stroke={c2} strokeWidth="1.2" opacity=".8" />
            <circle cx="100" cy="44" r="27" fill="none" stroke={lite} strokeWidth="3" opacity=".5" filter={`url(#${GL})`} />
            <circle cx="100" cy="44" r="31" fill="none" stroke={lite} strokeWidth=".7" strokeDasharray="2 3" opacity=".9" />
            {Array.from({ length: 12 }, (_, i) => (
              <g key={i} transform={`rotate(${i * 30} 100 44)`}>
                <path d={i % 3 ? 'M100 13 L102 17 L100 20 L98 17Z' : 'M100 8 L103 15 L100 20 L97 15Z'} fill={`url(#${Z})`} stroke="var(--fg)" strokeWidth=".8" strokeLinejoin="round" />
                <path d="M100 14.5 V18.5" stroke={c2} strokeWidth="1.2" />
              </g>
            ))}
          </g>
        )}
        {/* wing binders: folded wings on its back */}
        <Sym>
          <path d="M86 61 L61 18 L66 15.5 L93 56Z" fill={`url(#${Zh})`} {...OL} />
          <path d="M84 67 L49 49 L51.5 44 L88 61Z" fill={`url(#${Zh})`} {...OL} />
          <path d="M70 34 L76 31 M76 44 L82 41 M60 50 L62 46 M70 55 L72 51" stroke={ink} strokeWidth=".7" />
          <path d="M61 18 L62 13 L66 15.5Z" fill={c2} />
        </Sym>
        {/* legs */}
        <Sym>
          <path d="M88 124 H98 V146 H89Z" fill={`url(#${F})`} {...TH} />
          <path d="M84 122 H95 L94 142 L86 144Z" fill={`url(#${Zh})`} {...TH} />
          <path d="M84 152 H99 L102 176 H86Z" fill={`url(#${Zh})`} {...OL} />
          <path d="M84 156 L78.5 168 L85.5 174Z" fill={`url(#${Z})`} {...TH} />
          <path d="M83 142 H99 L98 151 L91 156 L84 151Z" fill={`url(#${Z})`} {...OL} />
          <path d="M86 146 L91 150 L96 146" fill="none" stroke={ink} strokeWidth=".8" />
          <path d="M80 176 H104 L108 183 H77Z" fill={`url(#${Z})`} {...OL} />
          <path d="M80 180.5 H106" stroke={c2} strokeWidth="1" opacity=".8" />
        </Sym>
        {/* waist and skirt */}
        <rect x="90" y="98" width="20" height="16" rx="2" fill={`url(#${F})`} {...TH} />
        {[103, 107, 111].map((y) => <path key={y} d={`M91 ${y} H109`} stroke="#4a4f5e" strokeWidth=".9" />)}
        <path d="M94 112 H106 L103 128 H97Z" fill={`url(#${Z})`} {...OL} />
        <path d="M98 116 H102 L100 121Z" fill={c2} />
        <Sym>
          <path d="M77 107 H85 L86 127 L79 123Z" fill={`url(#${Zh})`} {...TH} />
          <path d="M85 108 H98 L96 134 L87 130Z" fill={`url(#${Z})`} {...OL} />
        </Sym>
        {/* torso */}
        <path d="M78 63 H122 L127 76 L120 94 L110 101 H90 L80 94 L73 76Z" fill={`url(#${Z})`} {...OL} />
        <path d="M81 66 H119" stroke="#fff" strokeWidth="1.3" opacity=".9" />
        <Sym>
          <path d="M79 68.5 L95 67.5 L96 84 L86 90 L78.5 78Z" fill={`url(#${Zh})`} stroke={ink} strokeWidth=".8" />
          <path d="M82 72 L93 71.5" stroke="#fff" strokeWidth="1" opacity=".9" />
          <path d="M76 77 L80 92" {...ln} />
        </Sym>
        <path d="M100 72 L106 81 L100 92 L94 81Z" fill={c2} filter={`url(#${GL})`} opacity=".9" className={an(still, 'bmc-pulse')} />
        <path d="M100 73.5 L105 81 L100 90 L95 81Z" fill={lite} stroke={dk(c2, 30)} strokeWidth=".7" />
        <path d="M98 77 L100 74.5 L101.5 77" stroke="#fff" strokeWidth="1" fill="none" />
        {/* arms: open hands, held a little out */}
        <Sym>
          <path d="M65 80 H73 L72 102 H65Z" fill={`url(#${F})`} {...TH} />
          <path d="M62.5 82 H72 L71 95 H63.5Z" fill={`url(#${Zh})`} {...TH} />
          <circle cx="68" cy="103" r="4.5" fill={`url(#${F})`} {...TH} />
          <path d="M61 106 H74.5 L73.5 125 H62Z" fill={`url(#${Zh})`} {...OL} />
          <path d="M61 108 L55 118 L61.5 124Z" fill={`url(#${Z})`} {...TH} />
          <path d="M62.5 125 H72.5 L73 132 C73 136 70 139 67 139 C64 139 62 136 62 132Z" fill={`url(#${F})`} {...TH} />
          <path d="M64.5 132 V137.5 M67.5 132.5 V138.5 M70.5 132 V137" stroke="#3a3f4c" strokeWidth=".7" />
          <path d="M60 66 C60 61 65 58 72 58 H83 L84 72 L77 80 H65 L58 73Z" fill={`url(#${Z})`} {...OL} />
          <path d="M61 62 L49 50 L53 48 L66 58Z" fill={`url(#${Z})`} {...TH} />
          <path d="M63 63 Q70 60.5 80 61" stroke="#fff" strokeWidth="1.2" opacity=".9" fill="none" />
          <path d="M60 72 L76 75" {...ln} />
        </Sym>
        {/* the glowing seams */}
        <g filter={`url(#${GL})`} opacity={mk === 3 ? 0.85 : 0.6}>
          <Sym>
            <path d={ZERO_SEAMS} stroke={c2} strokeWidth={seamW * 2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </Sym>
        </g>
        <Sym>
          <path d={ZERO_SEAMS} stroke={lite} strokeWidth={seamW} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Sym>
        {/* head */}
        <rect x="94" y="56" width="12" height="9" fill={`url(#${F})`} />
        <path d="M89 46 C89 38 94 33 100 33 C106 33 111 38 111 46 L112 54 L106 60 H94 L88 54Z" fill={`url(#${Z})`} {...OL} />
        <path d="M92 38 Q96 34.5 100 34.5" stroke="#fff" strokeWidth="1.2" fill="none" />
        <Sym>
          <path d="M88.5 47 L84 44 L85 53 L88.5 54Z" fill={`url(#${Zh})`} {...TH} />
        </Sym>
        <path d="M92 50 H108 L106 57 L100 60 L94 57Z" fill={`url(#${Z})`} stroke={ink} strokeWidth=".8" />
        <path d="M95.5 54 L98.5 56 M104.5 54 L101.5 56 M100 57 V59" stroke={shade} strokeWidth=".8" opacity=".75" />
        <path d="M98 59 H102 L100 61.5Z" fill={c2} />
        <rect x="90.5" y="43.5" width="19" height="6" rx="1.5" fill="#15121f" />
        <Eyes still={still}>
          <g className={an(still, 'bmc-pulse')} filter={`url(#${GL})`}>
            {happy ? (
              <path d="M91.5 48.5 Q95 44 98.5 48 M108.5 48.5 Q105 44 101.5 48" stroke={c2} strokeWidth={mk === 3 ? 4.4 : 3.6} fill="none" />
            ) : (
              <path d="M91.5 45 L98.5 46.5 L98 48.6 L92 48Z M108.5 45 L101.5 46.5 L102 48.6 L108 48Z" fill={c2} stroke={c2} strokeWidth={mk === 3 ? 2.4 : 1.4} />
            )}
          </g>
          {happy ? (
            <path d="M91.5 48.5 Q95 44 98.5 48 M108.5 48.5 Q105 44 101.5 48" stroke="#fff" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          ) : (
            <path d="M91.5 45 L98.5 46.5 L98 48.6 L92 48Z M108.5 45 L101.5 46.5 L102 48.6 L108 48Z" fill={lt(c2, 75)} />
          )}
        </Eyes>
        {/* V-fin */}
        <Sym>
          <path d="M100 41.5 L71 17 L74 15 L101 36Z" fill={`url(#${AU})`} stroke="var(--fg)" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M98 38 L75 17.5" stroke="#fff" strokeWidth=".8" opacity=".8" />
        </Sym>
        <path d="M100 34.5 L104 39 L100 44 L96 39Z" fill={c2} stroke="var(--fg)" strokeWidth="1" />
        <path d="M98.5 38 L100 36.2" stroke="#fff" strokeWidth=".9" />
        {mk === 3 && (
          <Sym>
            <ellipse cx="91" cy="184" rx="11" ry="2.6" fill={c2} opacity=".7" filter={`url(#${GL})`} />
          </Sym>
        )}
      </g>
      {/* Mk III: six funnels */}
      {mk === 3 && (
        <Sym>
          {FUNNELS.map(([x, y, r], i) => (
            <g key={i} className={an(still, 'bmc-orbit')} style={{ ...origin(x, y), animationDelay: `${-i * 1.3}s` }}>
              <g transform={`translate(${x} ${y}) rotate(${r})`}>
                <path d="M0 -15 L-3 -20 M0 -15 L3 -20" stroke={lite} strokeWidth="1.4" filter={`url(#${GL})`} />
                <path d="M0 -14 L5.5 -8 L4.5 8 L0 13 L-4.5 8 L-5.5 -8Z" fill={`url(#${Zh})`} {...TH} />
                <path d="M0 -10 V7" stroke={c2} strokeWidth="1.1" />
                <path d="M-5.5 -8 L-8.5 -3 L-4.8 1Z M5.5 -8 L8.5 -3 L4.8 1Z" fill={`url(#${Z})`} stroke="var(--fg)" strokeWidth=".8" strokeLinejoin="round" />
                <circle cx="0" cy="14" r="4" fill={c2} filter={`url(#${GL})`} />
                <circle cx="0" cy="13.5" r="1.8" fill="#fff" />
              </g>
            </g>
          ))}
          {[[14, 30], [40, 22], [12, 76], [30, 128], [8, 168], [50, 172]].map(([x, y], i) => (
            <polygon key={i} points={star(x, y, i % 2 ? 3 : 4.4, 4, 0.28)} fill={i % 2 ? lite : '#fff'} className={an(still, 'bmc-pulse')} style={{ animationDelay: `${-i * 0.4}s` }} />
          ))}
        </Sym>
      )}
    </g>
  );
}

export const MECHA: BotRegistry = {
  gattai: { Art: Gattai, head: { x: 100, y: 28, s: 0.57 } },
  sniper: { Art: Sniper, head: { x: 100, y: 33, s: 0.5 } },
  rocketfist: { Art: RocketFist, head: { x: 100, y: 28, s: 0.67 } },
  sentai: { Art: Sentai, head: { x: 100, y: 22, s: 0.67 } },
  kaijuhunter: { Art: Kaiju, head: { x: 100, y: 40, s: 0.4 } },
  zero: { Art: Zero, head: { x: 100, y: 33, s: 0.38 } },
};
