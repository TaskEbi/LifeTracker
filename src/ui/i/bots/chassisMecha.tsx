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

export const MECHA: BotRegistry = {
  gattai: { Art: Gattai, head: { x: 100, y: 28, s: 0.57 } },
  sniper: { Art: Sniper, head: { x: 100, y: 33, s: 0.5 } },
};
// DEV: happy previews, removed before handing back.
for (const k of Object.keys(MECHA)) {
  const A = MECHA[k].Art;
  MECHA[`${k}_h`] = { Art: (p) => A({ ...p, happy: true }), head: MECHA[k].head };
}
