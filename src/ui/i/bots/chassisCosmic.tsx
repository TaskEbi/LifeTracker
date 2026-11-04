import type { ReactNode } from 'react';
import type { BotArtProps, BotRegistry } from './types';
import './chassisCosmic.css';

/** Cosmic: strange, beautiful, high-end. No two of them share a way of being drawn. */

const FG = 'var(--fg)';
const INK = '#100e18';
const mix = (a: string, p: number, b = '#000') => `color-mix(in srgb, ${a} ${p}%, ${b})`;
const Eyes = ({ still, children }: { still: boolean; children: ReactNode }) => (
  <g className="dr-gaze">
    <g className={still ? undefined : 'i-blink'}>{children}</g>
  </g>
);
const Shadow = ({ rx = 46 }: { rx?: number }) => <ellipse cx="100" cy="188" rx={rx} ry="5" fill={FG} opacity=".14" />;
/** A flat facet. The hairline in its own colour closes the seam with its neighbour. */
const F = ({ p, f }: { p: string; f: string }) => <polygon points={p} fill={f} stroke={f} strokeWidth=".7" strokeLinejoin="miter" />;
const polar = (cx: number, cy: number, r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
};

/* ---------------------------------------------------------------- origami */
function MiniCrane({ c, c2, x, y, s, flip }: { c: string; c2: string; x: number; y: number; s: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <F p="0,2 -22,-10 -6,8" f={mix(c2, 82, c)} />
      <F p="0,2 -22,-10 -3,-1" f={c} />
      <F p="0,2 22,-10 6,8" f={mix(c, 62)} />
      <F p="0,2 22,-10 3,-1" f={c} />
      <F p="-6,4 -15,-12 -1,0" f={mix(c, 75, '#fff')} />
      <F p="-15,-12 -22,-7 -13,-7" f={c} />
      <F p="6,4 15,-13 1,0" f={mix(c, 70)} />
      <F p="-7,2 0,-3 7,2 0,11" f={c} />
      <F p="0,-3 7,2 0,11" f={mix(c, 66)} />
    </g>
  );
}

function Origami({ c, c2, still, happy, mk }: BotArtProps) {
  const a = (k: string) => (still ? undefined : k);
  const L = mix(c, 72, '#fff');
  const D = mix(c, 66);
  const DD = mix(c, 42);
  const U = mix(c2, 84, c);
  const U2 = mix(c2, 62, c);
  return (
    <g>
      <polygon points="58,186 100,180 142,186 100,192" fill={FG} opacity=".14" />
      <g className={a('i-hover')}>
        {mk >= 3 && (
          <g>
            <MiniCrane c={c} c2={c2} x={28} y={22} s={0.85} />
            <MiniCrane c={c} c2={c2} x={176} y={18} s={0.7} flip />
            <MiniCrane c={c} c2={c2} x={22} y={160} s={0.72} />
            <MiniCrane c={c} c2={c2} x={170} y={156} s={0.95} flip />
            <MiniCrane c={c} c2={c2} x={150} y={186} s={0.45} flip />
          </g>
        )}

        {/* left wing */}
        <g className={a('bcc-flap')}>
          {mk >= 2 && (
            <>
              <F p="80,104 0,38 26,84" f={mix(c, 54)} />
              <F p="80,104 0,38 40,62" f={c} />
              <F p="80,104 24,6 40,62" f={DD} />
              <F p="80,104 24,6 58,52" f={D} />
            </>
          )}
          <F p="96,104 6,74 66,128" f={U} />
          <F p="96,104 6,74 62,92" f={c} />
          <F p="96,104 62,92 42,84" f={L} />
          <F p="88,116 6,74 66,128" f={U2} />
        </g>
        {/* right wing */}
        <g className={a('bcc-flapr')}>
          {mk >= 2 && (
            <>
              <F p="120,104 200,38 174,84" f={c} />
              <F p="120,104 200,38 160,62" f={L} />
              <F p="120,104 182,4 160,62" f={D} />
              <F p="120,104 182,4 152,44" f={c} />
            </>
          )}
          <F p="104,104 194,74 134,128" f={U2} />
          <F p="104,104 194,74 138,92" f={D} />
          <F p="104,104 138,92 158,84" f={c} />
          <F p="112,116 194,74 134,128" f={U} />
        </g>

        {/* tail */}
        <F p="108,134 158,20 118,98" f={D} />
        <F p="108,134 158,20 130,120" f={DD} />

        {/* body */}
        <F p="100,86 64,118 100,164" f={c} />
        <F p="100,86 136,118 100,164" f={D} />
        <F p="64,118 100,128 100,164" f={L} />
        <F p="136,118 100,128 100,164" f={c} />
        <F p="100,86 100,128 80,104" f={DD} />

        {/* neck */}
        <F p="92,138 74,44 100,102" f={L} />
        <F p="92,138 74,44 70,118" f={c} />
        <F p="74,44 66,62 70,118" f={D} />

        {/* head: one last reverse fold */}
        <F p="74,28 94,52 62,64" f={c} />
        <F p="74,28 62,64 22,78" f={L} />
        <F p="62,64 94,52 72,72" f={DD} />
        <F p="62,64 22,78 72,72" f={D} />

        <Eyes still={still}>
          {happy ? (
            <>
              <polygon points="58,52 70,41 82,52 76,52 70,47 64,52" fill={INK} />
            </>
          ) : (
            <>
              <polygon points="57,49 71,40 82,50 70,57" fill="#fff" />
              <polygon points="65,48 72,44 77,50 70,53" fill={INK} />
            </>
          )}
        </Eyes>
      </g>
    </g>
  );
}

/* ---------------------------------------------------------------- bonsai */
/** A foliage pad: flat underneath, clouds on top, the way a bonsai is really trained. */
const pad = (cx: number, cy: number, w: number, h: number, n = 4) => {
  const step = (w * 2) / n;
  let d = `M${cx - w} ${cy}`;
  for (let i = 0; i < n; i++) {
    const rise = h * (0.75 + 0.45 * Math.sin(((i + 0.5) / n) * Math.PI));
    d += ` c${step * 0.02} ${-rise} ${step * 0.98} ${-rise} ${step} 0`;
  }
  return `${d} q${-w} ${h * 0.5} ${-w * 2} 0Z`;
};

function Bonsai({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const a = (k: string) => (still ? undefined : k);
  const glaze = `${uid}-glaze`;
  const steel = `${uid}-steel`;
  const bark = '#6d4c35';
  const BLOSSOM = '#ffc4d6';
  const pads: [number, number, number, number][] = [
    [106, 42, 52, 24],
    [44, 84, 38, 17],
    [160, 72, 36, 17],
  ];
  const trunk = 'M100 104 C100 92 128 98 124 82 C120 70 84 78 90 56 C92 48 100 46 104 38';
  const limbs = 'M112 90 C102 88 78 88 50 84 M124 80 C136 78 146 74 158 70';
  return (
    <g>
      <defs>
        <linearGradient id={glaze} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={mix(c, 30, '#4f79b8')} />
          <stop offset=".4" stopColor={mix(c, 26, '#27477f')} />
          <stop offset="1" stopColor={mix(c, 24, '#111e40')} />
        </linearGradient>
        <linearGradient id={steel} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#e6e8ec" />
          <stop offset="1" stopColor="#7f8591" />
        </linearGradient>
      </defs>
      <Shadow rx={66} />

      {mk >= 2 && (
        <g fill="none" stroke="#c77d3a" strokeWidth="2">
          <circle cx="100" cy="74" r="78" strokeDasharray="1 0" opacity=".85" />
          <ellipse cx="100" cy="74" rx="78" ry="26" opacity=".6" />
          <ellipse cx="100" cy="74" rx="30" ry="78" opacity=".6" />
          {[[22, 74], [178, 74], [100, 152], [100, -4]].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r="3" fill="#c77d3a" stroke={FG} strokeWidth="1.5" />
          ))}
        </g>
      )}

      {/* robot, up to its chin in the soil */}
      <path d="M58 146 V124 C58 86 142 86 142 124 V146Z" fill={`url(#${steel})`} stroke={FG} strokeWidth="3.5" strokeLinejoin="round" />
      <rect x="66" y="113" width="68" height="26" rx="12" fill={INK} stroke={FG} strokeWidth="2.5" />
      <Eyes still={still}>
        {happy ? (
          <path d="M73 131 Q84 117 95 131 M105 131 Q116 117 127 131" fill="none" stroke={c2} strokeWidth="5" strokeLinecap="round" />
        ) : (
          <path d="M73 121 H96 A11.5 11.5 0 0 1 73 121Z M104 121 H127 A11.5 11.5 0 0 1 104 121Z" fill={c2} />
        )}
      </Eyes>
      {/* old-man brows */}
      <path d="M68 110 Q82 102 95 110 M105 110 Q118 102 132 110" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" />
      {[-1, 1].map((d) => (
        <rect key={d} x={100 + d * 46 - 5} y="114" width="10" height="24" rx="3" fill={c} stroke={FG} strokeWidth="2.5" />
      ))}

      <g className={a('bcc-sway')}>
        {/* the tree */}
        <path d={limbs} fill="none" stroke={FG} strokeWidth="11" strokeLinecap="round" />
        <path d={trunk} fill="none" stroke={FG} strokeWidth="17" strokeLinecap="round" />
        <path d={limbs} fill="none" stroke={bark} strokeWidth="6" strokeLinecap="round" />
        <path d={trunk} fill="none" stroke={bark} strokeWidth="11.5" strokeLinecap="round" />
        <path d="M104 96 C112 94 122 94 119 84 M110 76 C100 72 92 68 94 58" fill="none" stroke="#9a7654" strokeWidth="2.5" strokeLinecap="round" />
        {mk >= 2 && <path d={trunk} fill="none" stroke="#e29a52" strokeWidth="15" strokeDasharray="2.2 11" />}

        {/* moss */}
        {mk >= 2 &&
          pads.flatMap(([x, y, w], i) =>
            [-0.7, -0.2, 0.3, 0.75].map((k, j) => (
              <path key={`${i}${j}`} d={`M${x + k * w} ${y} q${j % 2 ? 3 : -3} ${10 + (j % 3) * 7} 0 ${20 + (j % 3) * 9}`} fill="none" stroke={mix(c2, 80, c)} strokeWidth="3" strokeLinecap="round" />
            )),
          )}

        {pads.map(([x, y, w, h], i) => (
          <g key={i}>
            <path d={pad(x, y + 8, w, h, i ? 3 : 4)} fill={mix(c, 66)} stroke={FG} strokeWidth="3" strokeLinejoin="round" />
            <path d={pad(x - 2, y + 2, w - 6, h * 0.78, i ? 3 : 4)} fill={c} />
            <path d={pad(x - 6, y - 6, w * 0.55, h * 0.48, 3)} fill={c2} />
          </g>
        ))}

        {mk >= 3 &&
          [[66, 28], [88, 12], [122, 14], [146, 30], [106, 30], [22, 76], [46, 62], [68, 82], [138, 58], [166, 50], [188, 72]].map(([x, y], i) => (
            <g key={i}>
              {[0, 72, 144, 216, 288].map((r) => {
                const [px, py] = polar(x, y, 3.8, r - 90);
                return <circle key={r} cx={px} cy={py} r="3" fill={BLOSSOM} stroke={INK} strokeWidth=".6" />;
              })}
              <circle cx={x} cy={y} r="1.6" fill="#d7263d" />
            </g>
          ))}
      </g>
      {mk >= 3 &&
        !still &&
        [[80, 60], [140, 84], [40, 98]].map(([x, y], i) => (
          <ellipse key={i} cx={x} cy={y} rx="3.4" ry="2.2" fill={BLOSSOM} className="bcc-petal" style={{ animationDelay: `${-i * 1.7}s` }} />
        ))}

      {/* the pot */}
      <path d="M28 146 Q100 136 172 146 V154 H28Z" fill="#4d3b2d" stroke={FG} strokeWidth="3" strokeLinejoin="round" />
      <path d="M40 154 H160 L150 176 H50Z" fill={`url(#${glaze})`} stroke={FG} strokeWidth="3.5" strokeLinejoin="round" />
      <rect x="24" y="146" width="152" height="10" rx="4" fill={`url(#${glaze})`} stroke={FG} strokeWidth="3" />
      <path d="M36 156 H164 L162 160 Q150 170 142 161 Q130 172 118 161 Q104 176 90 161 Q74 170 62 161 Q50 170 38 160Z" fill={c2} opacity=".85" />
      {[64, 136].map((x) => (
        <rect key={x} x={x - 10} y="176" width="20" height="8" fill={mix(c, 24, '#111e40')} stroke={FG} strokeWidth="3" />
      ))}

      {mk >= 3 && (
        <g stroke={FG} strokeLinejoin="round">
          {/* a tiny torii on the rim */}
          <path d="M30 148 Q48 134 64 148Z" fill={c} strokeWidth="2.5" />
          <path d="M37 142 V122 M57 142 V122" stroke="#e8432e" strokeWidth="4.5" />
          <path d="M31 120 Q47 124 63 120 L65 115 Q47 119 29 115Z" fill="#e8432e" strokeWidth="1.8" />
          <path d="M35 128 H59" stroke="#e8432e" strokeWidth="3" />
          {/* and a stone lantern opposite */}
          <path d="M148 146 h16 l-3 -6 h-3 v-10 h4 l-7 -7 l-7 7 h4 v10 h-3z" fill="#b6b2a8" strokeWidth="2" />
          <rect x="153" y="131" width="6" height="5" fill="#ffd166" strokeWidth="0" />
        </g>
      )}
    </g>
  );
}

/* ---------------------------------------------------------------- jelly */
const wave = (x: number, y: number, len: number, amp: number, n: number, ph = 1) => {
  const seg = len / n;
  let d = `M${x} ${y}`;
  for (let i = 0; i < n; i++) {
    const s = (i % 2 ? -1 : 1) * ph * amp * (1 - (i / n) * 0.45);
    d += ` Q${(x + s).toFixed(1)} ${y + seg * (i + 0.5)} ${x} ${y + seg * (i + 1)}`;
  }
  return d;
};

function Jelly({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const a = (k: string) => (still ? undefined : k);
  const bell = `${uid}-bell`;
  const halo = `${uid}-halo`;
  const lure = `${uid}-lure`;
  const xs = [52, 66, 80, 120, 134, 148];
  return (
    <g>
      <defs>
        <radialGradient id={bell} cx="50%" cy="72%" r="78%">
          <stop offset="0" stopColor={mix(c, 45, '#fff')} />
          <stop offset=".45" stopColor={c} />
          <stop offset="1" stopColor={mix(c, 34, '#07123a')} />
        </radialGradient>
        <radialGradient id={halo}>
          <stop offset="0" stopColor={c} stopOpacity=".55" />
          <stop offset=".6" stopColor={c} stopOpacity=".14" />
          <stop offset="1" stopColor={c} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={lure}>
          <stop offset="0" stopColor="#fff" />
          <stop offset=".35" stopColor={c2} />
          <stop offset="1" stopColor={c2} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="74" r="96" fill={`url(#${halo})`} />
      {mk >= 3 &&
        [[24, 52, 3.5], [172, 40, 3], [14, 118, 3], [186, 110, 4], [40, 164, 2.5], [162, 170, 3], [30, 90, 2], [176, 150, 2]].map(([x, y, r], i) => (
          <g key={i} className={a('bcc-spore')} style={{ animationDelay: `${-i * 0.6}s` }}>
            <circle cx={x} cy={y} r={r * 2.4} fill={`url(#${lure})`} />
            <circle cx={x} cy={y} r={r * 0.7} fill="#fff" />
          </g>
        ))}
      <g className={a('i-hover')}>
        {/* tentacles */}
        <g className={a('bcc-trail')} fill="none" strokeLinecap="round">
          {xs.map((x, i) => {
            const len = (mk >= 2 ? 104 : 62) - Math.abs(i - 2.5) * 6;
            const d = wave(x, 92, len, 9, mk >= 2 ? 6 : 4, i % 2 ? 1 : -1);
            return (
              <g key={x}>
                <path d={d} stroke={c} strokeWidth={mk >= 2 ? 7 : 5} opacity=".28" />
                <path d={d} stroke={i % 2 ? c2 : c} strokeWidth="2.6" />
              </g>
            );
          })}
          {/* the frilled oral arms */}
          {[90, 110].map((x, i) => {
            const d = wave(x, 92, mk >= 2 ? 92 : 58, 6, mk >= 2 ? 11 : 7, i ? 1 : -1);
            return <path key={x} d={d} stroke={c2} strokeWidth="6.5" />;
          })}
          {mk >= 2 &&
            xs.map((x, i) => (
              <circle key={x} cx={x} cy={148 + (i % 3) * 14} r="3.2" fill="#fff" stroke={c2} strokeWidth="1.6" className={a('i-pulse')} style={{ animationDelay: `${-i * 0.3}s` }} />
            ))}
        </g>

        <g className={a('bcc-bell')}>
          {mk >= 3 && (
            <g>
              <path d="M100 24 C102 6 126 -2 146 8 C154 12 158 20 156 28" fill="none" stroke={FG} strokeWidth="6" strokeLinecap="round" />
              <path d="M100 24 C102 6 126 -2 146 8 C154 12 158 20 156 28" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="156" cy="36" r="22" fill={`url(#${lure})`} />
              <circle cx="156" cy="36" r="7.5" fill="#fff" stroke={c2} strokeWidth="2.5" className={a('i-pulse')} />
            </g>
          )}
          {/* bell */}
          <path
            d="M34 92 C30 44 62 22 100 22 C138 22 170 44 166 92 Q158 104 149 94 Q141 106 130 96 Q120 108 110 98 Q100 110 90 98 Q80 108 70 96 Q59 106 51 94 Q42 104 34 92Z"
            fill={`url(#${bell})`}
            stroke={c2}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* the inner lobes, like a moon jelly */}
          <g fill="none" stroke="#fff" strokeWidth="4" opacity=".55" strokeLinecap="round">
            <path d="M70 44 C62 52 62 66 72 70 M130 44 C138 52 138 66 128 70" />
            <path d="M88 34 Q100 28 112 34" />
          </g>
          <path d="M50 58 C54 42 66 34 80 30" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" opacity=".8" />
          {[45, 62, 80, 100, 120, 138, 155].map((x, i) => (
            <circle key={x} cx={x} cy={i === 3 ? 96 : i % 6 === 0 ? 87 : 90} r="2.4" fill="#fff" className={a('i-pulse')} style={{ animationDelay: `${-i * 0.22}s` }} />
          ))}
          <Eyes still={still}>
            {happy ? (
              <path d="M70 74 Q83 58 96 74 M104 74 Q117 58 130 74" fill="none" stroke="#fff" strokeWidth="5.5" strokeLinecap="round" />
            ) : (
              <>
                <ellipse cx="82" cy="66" rx="13" ry="15" fill="#fff" />
                <ellipse cx="118" cy="66" rx="13" ry="15" fill="#fff" />
                <ellipse cx="82" cy="68" rx="6" ry="10" fill={INK} />
                <ellipse cx="118" cy="68" rx="6" ry="10" fill={INK} />
              </>
            )}
          </Eyes>
        </g>
      </g>
    </g>
  );
}

/* ---------------------------------------------------------------- saucer */
function Saucer({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const a = (k: string) => (still ? undefined : k);
  const hull = `${uid}-hull`;
  const beam = `${uid}-beam`;
  const dome = `${uid}-dome`;
  const lights = [24, 46, 72, 100, 128, 154, 176];
  return (
    <g>
      <defs>
        <linearGradient id={hull} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={mix(c, 58, '#fff')} />
          <stop offset=".6" stopColor={c} />
          <stop offset="1" stopColor={mix(c, 66)} />
        </linearGradient>
        <linearGradient id={beam} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={c2} stopOpacity=".85" />
          <stop offset="1" stopColor={c2} stopOpacity=".12" />
        </linearGradient>
        <radialGradient id={dome} cx="35%" cy="25%" r="85%">
          <stop offset="0" stopColor="#fff" stopOpacity=".28" />
          <stop offset=".5" stopColor={c2} stopOpacity=".06" />
          <stop offset="1" stopColor={c2} stopOpacity=".3" />
        </radialGradient>
      </defs>
      <Shadow rx={mk >= 2 ? 80 : 54} />

      {mk >= 3 && <path d="M78 112 H122 L164 186 H36Z" fill={`url(#${beam})`} />}

      {mk >= 2 &&
        [-1, 1].map((d) => (
          <g key={d} fill="none" strokeLinejoin="round" strokeLinecap="round">
            <path d={`M${100 + d * 50} 108 L${100 + d * 78} 138 L${100 + d * 82} 178`} stroke={FG} strokeWidth="8" />
            <path d={`M${100 + d * 50} 108 L${100 + d * 78} 138 L${100 + d * 82} 178`} stroke="#b9bec7" strokeWidth="3" />
            <circle cx={100 + d * 78} cy="138" r="5" fill={c2} stroke={FG} strokeWidth="2.5" />
            <path d={`M${100 + d * 66} 184 Q${100 + d * 82} 172 ${100 + d * 96} 184Z`} fill={c2} stroke={FG} strokeWidth="3" />
          </g>
        ))}

      <g className={mk >= 2 ? undefined : a('i-hover')}>
        {mk < 2 && (
          <g>
            <path d="M84 112 H116 L108 146 H92Z" fill={`url(#${beam})`} />
          </g>
        )}
        {/* pilot, behind the rim */}
        <path d="M86 90 Q100 66 114 90Z" fill={c2} stroke={FG} strokeWidth="3" />
        {[-1, 1].map((d) => (
          <g key={d}>
            <path d={`M${100 + d * 8} 40 L${100 + d * 14} 28`} stroke={FG} strokeWidth="2.5" strokeLinecap="round" />
            <circle cx={100 + d * 15} cy="26" r="3.5" fill={c} stroke={FG} strokeWidth="2" />
          </g>
        ))}
        <ellipse cx="100" cy="56" rx="24" ry="20" fill={c2} stroke={FG} strokeWidth="3" />
        <Eyes still={still}>
          {happy ? (
            <path d="M81 58 Q89 48 96 58 M104 58 Q111 48 119 58" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
          ) : (
            <>
              <ellipse cx="89" cy="56" rx="8" ry="10.5" transform="rotate(20 89 56)" fill={INK} />
              <ellipse cx="111" cy="56" rx="8" ry="10.5" transform="rotate(-20 111 56)" fill={INK} />
              <circle cx="87" cy="52" r="2.3" fill="#fff" />
              <circle cx="109" cy="52" r="2.3" fill="#fff" />
            </>
          )}
        </Eyes>
        {mk < 2 ? (
          <path d="M64 84 Q68 66 78 62 L80 84Z M136 84 Q132 66 122 62 L120 84Z" fill={`url(#${dome})`} stroke={FG} strokeWidth="2.5" strokeLinejoin="round" />
        ) : (
          <>
            <path d="M58 86 A42 42 0 0 1 142 86Z" fill={`url(#${dome})`} stroke={FG} strokeWidth="3" />
            <path d="M68 66 Q74 54 86 50" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
          </>
        )}

        {/* the hull */}
        <path d="M40 98 Q100 136 160 98 L148 112 Q100 134 52 112Z" fill={mix(c, 50)} stroke={FG} strokeWidth="3" strokeLinejoin="round" />
        <path d="M8 98 C22 78 60 74 100 74 C140 74 178 78 192 98 C178 118 22 118 8 98Z" fill={`url(#${hull})`} stroke={FG} strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M30 86 C50 78 76 78 100 78" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".7" />
        <path d="M10 98 C40 108 160 108 190 98" fill="none" stroke={FG} strokeWidth="2" opacity=".6" />
        {lights.map((x, i) => (
          <g key={x}>
            <circle cx={x} cy={100 + 9 * (1 - Math.pow((x - 100) / 80, 2))} r={i === 3 ? 6 : 4.8} fill={c2} stroke={FG} strokeWidth="2" className={a('bcc-chase')} style={{ animationDelay: `${(i * -1.4) / 7}s` }} />
          </g>
        ))}
        <ellipse cx="100" cy="124" rx="18" ry="6" fill={c2} stroke={FG} strokeWidth="2.5" />
      </g>

      {/* the very big plan involves this cow */}
      {mk >= 3 && (
        <g transform="translate(100 158)">
          <g className={a('bcc-cow')}>
            <g transform={still ? 'rotate(-12)' : undefined} stroke={FG} strokeWidth="2.5" strokeLinejoin="round">
              <path d="M-15 8 V19 M-7 9 V19 M7 9 V19 M15 8 V19" strokeWidth="5" strokeLinecap="round" />
              <rect x="-21" y="-10" width="42" height="21" rx="9" fill="#fff" />
              <path d="M-10 -9 Q-4 -2 -11 3 Q-18 4 -19 -4 Q-16 -9 -10 -9Z M7 -9 Q15 -6 14 2 Q7 6 3 -2Z" fill={INK} strokeWidth="0" />
              <path d="M21 -8 l-6 -9 M30 -8 l6 -9" strokeWidth="3" strokeLinecap="round" />
              <rect x="16" y="-14" width="20" height="17" rx="7" fill="#fff" />
              <rect x="20" y="-5" width="16" height="9" rx="4.5" fill="#ffb3c7" strokeWidth="1.8" />
              <circle cx="22" cy="-9" r="1.6" fill={INK} strokeWidth="0" />
              <circle cx="31" cy="-9" r="1.6" fill={INK} strokeWidth="0" />
              <path d="M-21 -4 q-8 2 -7 10" fill="none" />
            </g>
          </g>
        </g>
      )}
    </g>
  );
}

/* ---------------------------------------------------------------- crystal */
function Crystal({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const a = (k: string) => (still ? undefined : k);
  const core = `${uid}-core`;
  const L = mix(c2, 72, '#fff');
  const M = c2;
  const A = mix(c, 60, c2);
  const B = c;
  const D = mix(c, 62, '#050818');
  const E = mix(c, 34, '#050818');
  const line = '#ffffff';
  /** One crystal mass: facets as they catch the light, then one hard silhouette. */
  const Gem = ({ out, facets }: { out: string; facets: [string, string][] }) => (
    <g>
      {facets.map(([p, f], i) => (
        <polygon key={i} points={p} fill={f} stroke={line} strokeOpacity=".55" strokeWidth=".8" strokeLinejoin="round" />
      ))}
      <polygon points={out} fill="none" stroke={FG} strokeWidth="3" strokeLinejoin="round" />
    </g>
  );
  const SPECTRUM = ['#ff4d6d', '#ff9f1c', '#ffe14d', '#3ddc84', '#3ab7ff', '#8f5bff'];
  return (
    <g>
      <defs>
        <radialGradient id={core}>
          <stop offset="0" stopColor="#fff" />
          <stop offset=".4" stopColor={c2} />
          <stop offset="1" stopColor={c2} stopOpacity="0" />
        </radialGradient>
      </defs>
      <Shadow rx={62} />

      {/* legs */}
      <Gem out="62,142 96,142 92,184 54,184" facets={[['62,142 80,142 74,184 54,184', A], ['80,142 96,142 92,184 74,184', D]]} />
      <Gem out="104,142 138,142 146,184 108,184" facets={[['104,142 122,142 126,184 108,184', B], ['122,142 138,142 146,184 126,184', E]]} />

      {/* arms: they hang low, it's a golem */}
      <Gem out="34,78 56,76 58,122 40,132 26,112" facets={[['34,78 56,76 46,104 26,112', A], ['56,76 58,122 46,104', D], ['26,112 46,104 58,122 40,132', B]]} />
      <Gem out="166,78 144,76 142,122 160,132 174,112" facets={[['166,78 144,76 154,104 174,112', B], ['144,76 142,122 154,104', E], ['174,112 154,104 142,122 160,132', D]]} />
      <Gem
        out="30,124 52,120 68,138 62,166 38,176 14,158 16,136"
        facets={[['30,124 52,120 44,144 16,136', L], ['52,120 68,138 44,144', M], ['16,136 44,144 38,176 14,158', A], ['44,144 68,138 62,166 38,176', D]]}
      />
      <Gem
        out="170,124 148,120 132,138 138,166 162,176 186,158 184,136"
        facets={[['170,124 148,120 156,144 184,136', M], ['148,120 132,138 156,144', A], ['184,136 156,144 162,176 186,158', E], ['156,144 132,138 138,166 162,176', B]]}
      />

      {/* torso */}
      <Gem
        out="62,76 100,64 138,76 148,104 126,146 74,146 52,104"
        facets={[
          ['62,76 100,64 100,84', L],
          ['100,64 138,76 100,84', M],
          ['62,76 100,84 74,104 52,104', A],
          ['138,76 100,84 126,104 148,104', D],
          ['52,104 74,104 74,146', B],
          ['148,104 126,104 126,146', E],
          ['100,84 74,104 74,146 100,124', A],
          ['100,84 126,104 126,146 100,124', D],
          ['74,146 100,124 126,146', E],
        ]}
      />
      {/* shoulders */}
      <Gem out="62,70 26,44 16,72 30,92 60,94" facets={[['62,70 26,44 16,72 40,76', L], ['62,70 40,76 60,94', A], ['16,72 40,76 60,94 30,92', D]]} />
      <Gem out="138,70 174,44 184,72 170,92 140,94" facets={[['138,70 174,44 160,76', M], ['174,44 184,72 160,76', A], ['138,70 160,76 140,94', B], ['184,72 160,76 140,94 170,92', E]]} />

      {/* the light inside */}
      <circle cx="100" cy="104" r="30" fill={`url(#${core})`} className={a('i-pulse')} />
      <polygon points="100,90 112,104 100,118 88,104" fill="#fff" stroke={c} strokeWidth="1.5" />

      {mk >= 3 && (
        <g>
          <polygon points="0,44 0,52 98,106 98,102" fill="#fff" stroke={FG} strokeWidth="1" />
          {SPECTRUM.map((col, i) => (
            <polygon key={col} points={`102,${101 + i} 200,${70 + i * 15} 200,${85 + i * 15}`} fill={col} opacity=".82" className={a('bcc-glint')} style={{ animationDelay: `${-i * 0.2}s` }} />
          ))}
          <polygon points="100,90 112,104 100,118 88,104" fill="#fff" stroke={c} strokeWidth="1.5" />
        </g>
      )}

      {mk >= 2 &&
        [[20, 26, 13], [180, 22, 15], [8, 100, 9], [192, 104, 10], [44, 22, 7], [156, 8, 7]].map(([x, y, s], i) => (
          <g key={i} className={a('bcc-shard')} style={{ animationDelay: `${-i * 0.55}s` }}>
            <polygon points={`${x},${y - s} ${x + s * 0.55},${y} ${x},${y + s}`} fill={i % 2 ? D : A} />
            <polygon points={`${x},${y - s} ${x - s * 0.55},${y} ${x},${y + s}`} fill={L} />
            <polygon points={`${x},${y - s} ${x + s * 0.55},${y} ${x},${y + s} ${x - s * 0.55},${y}`} fill="none" stroke={FG} strokeWidth="2" strokeLinejoin="round" />
          </g>
        ))}

      {mk >= 3 &&
        [[-28, 18, 16], [-14, 28, 14], [0, 36, 14], [14, 28, 14], [28, 18, 16]].map(([dx, h, w], i) => (
          <g key={i}>
            <polygon points={`${100 + dx - w / 2},34 ${100 + dx},${34 - h} ${100 + dx},34`} fill={L} />
            <polygon points={`${100 + dx + w / 2},34 ${100 + dx},${34 - h} ${100 + dx},34`} fill={i % 2 ? D : B} />
            <polygon points={`${100 + dx - w / 2},34 ${100 + dx},${34 - h} ${100 + dx + w / 2},34`} fill="none" stroke={FG} strokeWidth="2.5" strokeLinejoin="round" />
          </g>
        ))}

      {/* head */}
      <Gem
        out="82,38 118,38 126,54 112,74 88,74 74,54"
        facets={[['82,38 100,44 74,54', L], ['118,38 100,44 126,54', M], ['82,38 118,38 100,44', L], ['74,54 100,44 126,54 112,74 88,74', E]]}
      />
      <Eyes still={still}>
        {happy ? (
          <path d="M80 62 L90 52 L97 60 M103 60 L110 52 L120 62" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <>
            <polygon points="79,55 96,58 92,65 83,63" fill="#fff" />
            <polygon points="121,55 104,58 108,65 117,63" fill="#fff" />
          </>
        )}
      </Eyes>
    </g>
  );
}

/* ---------------------------------------------------------------- orrery */
function Orrery({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const brass = `${uid}-brass`;
  const sun = `${uid}-sun`;
  const sky = `${uid}-sky`;
  const CX = 100;
  const CY = 104;
  const warm = mix(c, 66, c2);
  const hi = mix(warm, 62, '#fff6d8');
  const lo = mix(c, 62);
  const ticks = (r: number, n: number, len: number, w: number, col: string, major = 0) =>
    Array.from({ length: n }, (_, i) => {
      const big = major && i % major === 0;
      const [x1, y1] = polar(CX, CY, r, (i * 360) / n);
      const [x2, y2] = polar(CX, CY, r - (big ? len * 2 : len), (i * 360) / n);
      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={col} strokeWidth={big ? w * 1.7 : w} />;
    });
  const band = (rx: number, ry: number, rot: number) => (
    <g transform={`rotate(${rot} ${CX} ${CY})`} fill="none">
      <ellipse cx={CX} cy={CY} rx={rx} ry={ry} stroke={FG} strokeWidth="5.5" />
      <ellipse cx={CX} cy={CY} rx={rx} ry={ry} stroke={`url(#${brass})`} strokeWidth="3" />
    </g>
  );
  /** An arm from the sun to a planet; the moving part is the arm, so the pivot is exact. */
  const arm = (key: string, r: number, deg: number, dur: number, children: ReactNode, back?: boolean) => (
    <g key={key} transform={`translate(${CX} ${CY}) rotate(${deg})`}>
      <g className={still ? undefined : `bcc-orbit${back ? ' bcc-orbit--back' : ''}`} style={still ? undefined : { animationDuration: `${dur}s` }}>
        <rect x="0" y="-2.4" width={r} height="4.8" rx="1" fill={FG} />
        <rect x="0" y="-1.1" width={r} height="2.2" fill={hi} />
        <g transform={`translate(${r} 0)`}>{children}</g>
      </g>
    </g>
  );
  const STARS: [number, number][] = [[40, 46], [54, 30], [34, 72], [150, 34], [168, 54], [176, 84], [26, 118], [36, 146], [60, 168], [170, 136], [150, 166], [132, 180]];
  return (
    <g>
      <defs>
        <linearGradient id={brass} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor={hi} />
          <stop offset=".5" stopColor={warm} />
          <stop offset="1" stopColor={lo} />
        </linearGradient>
        <radialGradient id={sun}>
          <stop offset="0" stopColor="#fff" />
          <stop offset=".45" stopColor={c2} />
          <stop offset="1" stopColor={mix(c2, 62, '#ff5a1f')} />
        </radialGradient>
        <radialGradient id={sky}>
          <stop offset="0" stopColor="#233066" />
          <stop offset="1" stopColor="#090d24" />
        </radialGradient>
      </defs>
      <Shadow rx={58} />

      {/* star map */}
      {mk >= 3 && (
        <g>
          <circle cx={CX} cy={CY} r="88" fill={`url(#${sky})`} stroke={FG} strokeWidth="3.5" />
          <circle cx={CX} cy={CY} r="83" fill="none" stroke={c2} strokeWidth="1.2" />
          {ticks(88, 72, 4, 1, c2, 6)}
          <circle cx={CX} cy={CY} r="70" fill="none" stroke={c2} strokeWidth=".8" strokeDasharray="1.5 3" opacity=".7" />
          <path d="M34 72 L40 46 L54 30 M150 34 L168 54 L176 84 M26 118 L36 146 L60 168 M170 136 L150 166 L132 180" fill="none" stroke={c2} strokeWidth="1.1" opacity=".8" />
          {STARS.map(([x, y], i) => (
            <path key={i} d={`M${x} ${y - 4} L${x + 1} ${y - 1} L${x + 4} ${y} L${x + 1} ${y + 1} L${x} ${y + 4} L${x - 1} ${y + 1} L${x - 4} ${y} L${x - 1} ${y - 1}Z`} fill="#fff" />
          ))}
        </g>
      )}

      {/* stand: three fine legs and a turned collar */}
      <path d="M100 156 L58 184 M100 156 L142 184 M100 156 V184" stroke={FG} strokeWidth="8.5" strokeLinecap="round" />
      <path d="M100 156 L58 184 M100 156 L142 184 M100 156 V184" stroke={`url(#${brass})`} strokeWidth="4" strokeLinecap="round" />
      {[58, 100, 142].map((x) => (
        <circle key={x} cx={x} cy="184" r="4.5" fill={`url(#${brass})`} stroke={FG} strokeWidth="2.2" />
      ))}
      <rect x="82" y="152" width="36" height="10" rx="2" fill={`url(#${brass})`} stroke={FG} strokeWidth="2.5" />

      {/* the great circle, graduated */}
      <circle cx={CX} cy={CY} r="54" fill={mk >= 3 ? 'none' : mix(c, 16, 'var(--surf)')} stroke={FG} strokeWidth="11.5" />
      <circle cx={CX} cy={CY} r="54" fill="none" stroke={`url(#${brass})`} strokeWidth="8.5" />
      {ticks(58, 60, 3, 1, INK, 5)}
      {band(54, 16, 0)}
      {band(54, 16, 60)}
      {band(54, 16, -60)}

      {/* the sweep hand ticks once a second */}
      <g transform={`translate(${CX} ${CY}) rotate(-20)`}>
        <g className={still ? undefined : 'bcc-tick'}>
          <path d="M-2.5 0 L0 -46 L2.5 0Z" fill={c2} stroke={FG} strokeWidth="1.2" strokeLinejoin="round" />
        </g>
      </g>

      {/* head: a domed instrument with two lenses */}
      <rect x="93" y="42" width="14" height="12" fill={`url(#${brass})`} stroke={FG} strokeWidth="2.5" />
      <path d="M68 40 V30 C68 6 132 6 132 30 V40 Q132 46 126 46 H74 Q68 46 68 40Z" fill={`url(#${brass})`} stroke={FG} strokeWidth="3.2" strokeLinejoin="round" />
      <path d="M68 38 H132" stroke={FG} strokeWidth="1.5" />
      {[74, 82, 90, 98, 106, 114, 122].map((x) => (
        <rect key={x} x={x + 1} y="39.5" width="1.6" height="4.5" fill={INK} />
      ))}
      <path d="M100 12 V4" stroke={FG} strokeWidth="3.5" />
      <circle cx="100" cy="4" r="4" fill={c2} stroke={FG} strokeWidth="2" />
      {[85, 115].map((x) => (
        <circle key={x} cx={x} cy="26" r="11.5" fill={INK} stroke={FG} strokeWidth="2.5" />
      ))}
      <Eyes still={still}>
        {happy ? (
          <path d="M77 30 Q85 18 93 30 M107 30 Q115 18 123 30" fill="none" stroke={c2} strokeWidth="4" strokeLinecap="round" />
        ) : (
          <>
            <circle cx="85" cy="26" r="7.5" fill={c2} />
            <circle cx="115" cy="26" r="7.5" fill={c2} />
            <circle cx="85" cy="26" r="3" fill={INK} />
            <circle cx="115" cy="26" r="3" fill={INK} />
          </>
        )}
      </Eyes>

      {/* planets */}
      {mk >= 3 &&
        arm(
          'saturn',
          72,
          -26,
          110,
          <g transform="rotate(26)">
            <path d="M-26 6 A26 8 -13 0 1 26 -6" fill="none" stroke={FG} strokeWidth="6" />
            <path d="M-26 6 A26 8 -13 0 1 26 -6" fill="none" stroke={c2} strokeWidth="3" />
            <circle r="13" fill={`url(#${brass})`} stroke={FG} strokeWidth="2.5" />
            <path d="M-26 6 A26 8 -13 0 0 26 -6" fill="none" stroke={FG} strokeWidth="6" />
            <path d="M-26 6 A26 8 -13 0 0 26 -6" fill="none" stroke={c2} strokeWidth="3" />
          </g>,
        )}
      {mk >= 2 && (
        <>
          {arm(
            'venus',
            72,
            158,
            55,
            <>
              <circle r="11" fill={c2} stroke={FG} strokeWidth="2.8" />
              <circle cx="-3.5" cy="-3.5" r="3" fill="#fff" />
            </>,
          )}
          {arm(
            'earth',
            68,
            38,
            34,
            <>
              <circle r="9" fill={mix(c2, 35, '#3ab7ff')} stroke={FG} strokeWidth="2.8" />
              <path d="M8 0 H16" stroke={FG} strokeWidth="2" />
              <circle cx="19" r="3.6" fill="#fff" stroke={FG} strokeWidth="1.8" />
            </>,
            true,
          )}
          {arm('mercury', 36, -142, 18, <circle r="6.5" fill={hi} stroke={FG} strokeWidth="2.4" />)}
        </>
      )}

      {/* the sun in its chest */}
      <g transform={`translate(${CX} ${CY})`}>
        <g className={still ? undefined : 'bcc-orbit'}>
          {Array.from({ length: 16 }, (_, i) => (
            <path key={i} d={i % 2 ? 'M-2.6 -15 L0 -22 L2.6 -15Z' : 'M-3 -15 L0 -27 L3 -15Z'} fill={c2} stroke={FG} strokeWidth="1.2" strokeLinejoin="round" transform={`rotate(${i * 22.5})`} />
          ))}
        </g>
        <circle r="16.5" fill={`url(#${sun})`} stroke={FG} strokeWidth="2.5" />
        <circle r="2.6" fill={INK} />
      </g>
    </g>
  );
}

/* ---------------------------------------------------------------- tesla */
function Arc({ d, c, c2, w = 1 }: { d: string; c: string; c2: string; w?: number }) {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={c} strokeWidth={9 * w} opacity=".32" />
      <path d={d} stroke={c} strokeWidth={4.2 * w} />
      <path d={d} stroke={c2} strokeWidth={2.4 * w} />
      <path d={d} stroke="#fff" strokeWidth={1 * w} />
    </g>
  );
}

function Tesla({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const fa = still ? undefined : 'bcc-fa';
  const fb = still ? undefined : 'bcc-fb';
  const a = (k: string) => (still ? undefined : k);
  const off = still ? 0 : undefined;
  const cu = `${uid}-cu`;
  const tor = `${uid}-tor`;
  const plasma = `${uid}-plasma`;
  const hz = `${uid}-hz`;
  const globe = `${uid}-globe`;
  const rings = [
    [160, 90],
    [148, 82],
    [136, 74],
    [124, 66],
    [112, 60],
    [100, 54],
    [88, 48],
    [76, 44],
  ] as const;
  const HEAD = [100, 36] as const;
  return (
    <g>
      <defs>
        <linearGradient id={cu} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#f2b37a" />
          <stop offset=".45" stopColor="#c8743a" />
          <stop offset="1" stopColor="#6e3a1b" />
        </linearGradient>
        <linearGradient id={tor} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={mix(c, 45, '#fff')} />
          <stop offset=".5" stopColor={c} />
          <stop offset="1" stopColor={mix(c, 55)} />
        </linearGradient>
        <radialGradient id={plasma}>
          <stop offset="0" stopColor="#fff" />
          <stop offset=".3" stopColor={c2} />
          <stop offset=".62" stopColor={c} stopOpacity=".9" />
          <stop offset="1" stopColor={c} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={globe} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor={c} stopOpacity=".5" />
          <stop offset=".85" stopColor={c} stopOpacity=".12" />
          <stop offset="1" stopColor="#fff" stopOpacity=".45" />
        </radialGradient>
        <pattern id={hz} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="14" height="14" fill={c2} />
          <rect width="7" height="14" fill={INK} />
        </pattern>
      </defs>
      <circle cx={HEAD[0]} cy={HEAD[1]} r="66" fill={`url(#${plasma})`} opacity=".3" />
      <Shadow rx={60} />

      {/* hazard plinth */}
      <rect x="44" y="170" width="112" height="16" rx="2" fill={`url(#${hz})`} stroke={FG} strokeWidth="3" />

      {/* insulator arms */}
      {[-1, 1].map((d) => (
        <g key={d}>
          <path d={`M${100 + d * 26} 118 L${100 + d * 62} 104 L${100 + d * 72} 122`} fill="none" stroke={FG} strokeWidth="9" strokeLinejoin="round" />
          <path d={`M${100 + d * 26} 118 L${100 + d * 62} 104 L${100 + d * 72} 122`} fill="none" stroke={c} strokeWidth="4" strokeLinejoin="round" />
          {[0.3, 0.55, 0.8].map((k) => (
            <ellipse key={k} cx={100 + d * (26 + 36 * k)} cy={118 - 14 * k} rx="3.5" ry="8" fill="#e8e4d8" stroke={FG} strokeWidth="2" />
          ))}
          {/* forked electrode hands */}
          <path d={`M${100 + d * 72} 122 L${100 + d * 66} 138 M${100 + d * 72} 122 L${100 + d * 80} 138`} stroke={FG} strokeWidth="5.5" strokeLinecap="round" />
          <path d={`M${100 + d * 72} 122 L${100 + d * 66} 138 M${100 + d * 72} 122 L${100 + d * 80} 138`} stroke="#c8743a" strokeWidth="2" strokeLinecap="round" />
          <circle cx={100 + d * 72} cy="122" r="5" fill={c2} stroke={FG} strokeWidth="2.2" />
        </g>
      ))}

      {/* the coil */}
      {rings.map(([y, w], i) => (
        <rect key={y} x={100 - w / 2} y={y} width={w} height="12.5" rx="6.25" fill={i % 3 === 2 ? `url(#${tor})` : `url(#${cu})`} stroke={FG} strokeWidth="2.8" />
      ))}
      <rect x="84" y="56" width="32" height="20" fill={`url(#${cu})`} stroke={FG} strokeWidth="2.8" />
      <path d="M84 62 H116 M84 68 H116" stroke={FG} strokeWidth="1.3" />

      {/* warning sign */}
      <path d="M100 138 L114 164 H86Z" fill={c2} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M102 145 L95 155 H100 L97 162 L106 151 H101Z" fill={INK} />

      {/* top load */}
      <ellipse cx="100" cy="66" rx="42" ry="13" fill={`url(#${tor})`} stroke={FG} strokeWidth="3.2" />
      <ellipse cx="100" cy="62" rx="20" ry="5" fill={INK} stroke={FG} strokeWidth="2" />
      <path d="M68 62 Q84 56 100 56" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity=".7" />

      {/* plasma globe around the head */}
      {mk >= 3 && (
        <g>
          <circle cx={HEAD[0]} cy={HEAD[1]} r="35" fill={`url(#${globe})`} stroke={FG} strokeWidth="3" />
          <g className={fa}>
            {[[64, 14], [132, 12], [136, 52], [66, 56]].map(([x, y], i) => (
              <Arc key={i} c={c} c2={c2} w={0.6} d={`M100 36 L${(100 + x) / 2 + (i % 2 ? 5 : -5)} ${(36 + y) / 2 - 3} L${(100 + x) / 2 + 3} ${(36 + y) / 2 + 4} L${x} ${y}`} />
            ))}
          </g>
          <g className={fb} opacity={off}>
            {[[100, 2], [136, 34], [100, 68], [65, 34]].map(([x, y], i) => (
              <Arc key={i} c={c} c2={c2} w={0.6} d={`M100 36 L${(100 + x) / 2 + 6} ${(36 + y) / 2 - 2} L${(100 + x) / 2 - 3} ${(36 + y) / 2 + 3} L${x} ${y}`} />
            ))}
          </g>
        </g>
      )}

      {/* the head is a live arc: a corona, a black core, and two eyes that don't like you */}
      <circle cx={HEAD[0]} cy={HEAD[1]} r="33" fill={`url(#${plasma})`} />
      <g className={fa}>
        <Arc c={c} c2={c2} d="M100 62 L90 58 L84 66 M72 46 L62 48 L66 38 L52 34 M72 24 L66 14 L78 14 L76 2 M100 12 L98 2 M128 24 L136 12 L124 12 L128 0 M128 46 L142 50 L136 38 L150 32 M110 60 L116 66" w={0.8} />
      </g>
      <g className={fb} opacity={off}>
        <Arc c={c} c2={c2} d="M90 60 L84 56 L78 66 M72 40 L60 40 L66 30 L54 22 M80 16 L84 6 L74 2 M116 16 L112 6 L126 2 M128 36 L142 40 L134 28 L148 20 M124 52 L134 60 L128 66 M108 62 L104 68" w={0.8} />
      </g>
      <circle cx={HEAD[0]} cy={HEAD[1]} r="28" fill={INK} stroke={c2} strokeWidth="3" />
      <circle cx={HEAD[0]} cy={HEAD[1]} r="28" fill="none" stroke="#fff" strokeWidth="1.2" />
      <Eyes still={still}>
        {happy ? (
          <path d="M76 42 L86 30 L95 40 M105 40 L114 30 L124 42" fill="none" stroke={c2} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <>
            <polygon points="75,24 97,36 92,45 78,40" fill={c2} />
            <polygon points="125,24 103,36 108,45 122,40" fill={c2} />
            <polygon points="82,31 92,37 89,41 83,38" fill="#fff" />
            <polygon points="118,31 108,37 111,41 117,38" fill="#fff" />
          </>
        )}
      </Eyes>
      <path d="M86 54 L91 50 L96 55 L100 50 L104 55 L109 50 L114 54" fill="none" stroke={c2} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

      {/* arcs between its hands */}
      {mk >= 2 && (
        <>
          <g className={fa}>
            <Arc c={c} c2={c2} w={1.25} d="M28 140 L40 122 L50 148 L66 118 L76 150 L92 112 L106 154 L120 118 L134 150 L150 120 L158 146 L172 140" />
          </g>
          <g className={fb} opacity={off}>
            <Arc c={c} c2={c2} w={1.25} d="M28 140 L42 156 L56 124 L70 156 L88 116 L102 160 L116 120 L132 156 L146 124 L160 152 L172 140" />
          </g>
        </>
      )}

      {/* ball lightning */}
      {mk >= 3 &&
        [[24, 62], [176, 70]].map(([x, y], i) => (
          <g key={x} className={a('bcc-ball')} style={{ animationDelay: `${-i * 1.2}s` }}>
            <circle cx={x} cy={y} r="22" fill={`url(#${plasma})`} />
            <Arc c={c} c2={c2} w={0.6} d={`M${x - 15} ${y - 8} L${x - 5} ${y - 3} L${x - 11} ${y + 9} M${x + 16} ${y - 10} L${x + 6} ${y - 2} L${x + 14} ${y + 8} M${x} ${y - 16} L${x + 2} ${y - 6} M${x - 2} ${y + 6} L${x + 2} ${y + 16}`} />
            <circle cx={x} cy={y} r="8" fill="#fff" stroke={c2} strokeWidth="2.5" />
          </g>
        ))}
    </g>
  );
}

export const COSMIC: BotRegistry = {
  origami: { Art: Origami, head: { x: 72, y: 28, s: 0.6 } },
  bonsai: { Art: Bonsai, head: { x: 104, y: 14, s: 1.2 } },
  jelly: { Art: Jelly, head: { x: 100, y: 22, s: 1.5 } },
  saucer: { Art: Saucer, head: { x: 100, y: 36, s: 0.75 } },
  crystal: { Art: Crystal, head: { x: 100, y: 38, s: 0.75 } },
  orrery: { Art: Orrery, head: { x: 100, y: 11, s: 1 } },
  tesla: { Art: Tesla, head: { x: 100, y: 8, s: 1 } },
};
