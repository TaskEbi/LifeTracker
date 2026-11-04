import type { ReactNode } from 'react';
import type { BotArtProps, BotRegistry } from './types';
import './chassisToys.css';

/** Toys: retro toys and consoles. Every one is a different maker's idea of a robot. */

const FG = 'var(--fg)';
const INK = '#15131b';
const mix = (a: string, p: number, b = '#000') => `color-mix(in srgb, ${a} ${p}%, ${b})`;
const Eyes = ({ still, children }: { still: boolean; children: ReactNode }) => (
  <g className="dr-gaze">
    <g className={still ? undefined : 'i-blink'}>{children}</g>
  </g>
);
const Shadow = ({ rx = 46 }: { rx?: number }) => <ellipse cx="100" cy="186" rx={rx} ry="5" fill={FG} opacity=".14" />;
/** A hard little starburst: sparks, flashes, stickers. */
const star = (x: number, y: number, r: number, n = 8, inner = 0.42) =>
  Array.from({ length: n * 2 }, (_, i) => {
    const a = (Math.PI * i) / n - Math.PI / 2;
    const k = i % 2 ? r * inner : r;
    return `${(x + k * Math.cos(a)).toFixed(1)},${(y + k * Math.sin(a)).toFixed(1)}`;
  }).join(' ');

/* ---------------------------------------------------------------- tin */
function Tin({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const a = (k: string) => (still ? undefined : k);
  const tin = `${uid}-tin`;
  const fire = `${uid}-fire`;
  const YEL = '#ffd23f';
  const rivets = (xs: number[], y: number) => xs.map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.7" fill={FG} />);
  return (
    <g>
      <defs>
        <linearGradient id={tin} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={mix(c, 72, '#fff')} />
          <stop offset=".45" stopColor={c} />
          <stop offset="1" stopColor={mix(c, 62)} />
        </linearGradient>
        <linearGradient id={fire} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff3b0" />
          <stop offset=".5" stopColor={YEL} />
          <stop offset="1" stopColor="#ff6b35" />
        </linearGradient>
      </defs>
      <Shadow rx={52} />

      {mk >= 3 &&
        [-1, 1].map((d) => (
          <g key={d} transform={`translate(${100 + d * 60} 0)`}>
            <g className={a('bct-flame')}>
              <path d="M-10 128 L0 176 L10 128Z" fill={`url(#${fire})`} stroke={FG} strokeWidth="2.5" strokeLinejoin="round" />
            </g>
            <path d="M0 14 C12 26 13 40 13 54 V124 H-13 V54 C-13 40 -12 26 0 14Z" fill={c2} stroke={FG} strokeWidth="3" strokeLinejoin="round" />
            <path d="M0 14 C6 20 10 28 11 38 H-11 C-10 28 -6 20 0 14Z" fill={c} stroke={FG} strokeWidth="2.5" strokeLinejoin="round" />
            <path d={`M${d * 13} 96 L${d * 26} 124 L${d * 13} 124Z`} fill={c} stroke={FG} strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M-13 56 H13 M-13 62 H13" stroke={FG} strokeWidth="1.5" />
          </g>
        ))}

      {/* the key, in its back */}
      <g transform={`translate(${mk >= 3 ? 170 : 160} ${mk >= 3 ? 34 : 54}) rotate(-42) scale(${mk >= 3 ? 1.45 : 1.05})`}>
        <path d="M-46 0 H-2" stroke={FG} strokeWidth="9" />
        <path d="M-46 0 H-2" stroke={YEL} strokeWidth="4" />
        <g className={a('bct-key')}>
          {[-1, 1].map((d) => (
            <g key={d}>
              <circle cx="2" cy={d * 13} r="10" fill="none" stroke={FG} strokeWidth="9" />
              <circle cx="2" cy={d * 13} r="10" fill="none" stroke={YEL} strokeWidth="4.5" />
            </g>
          ))}
        </g>
      </g>

      {/* legs and roller feet */}
      {[-1, 1].map((d) => (
        <g key={d} stroke={FG} strokeWidth="3" strokeLinejoin="round">
          <rect x={100 + d * 22 - 13} y="146" width="26" height="24" fill={`url(#${tin})`} />
          <path d={`M${100 + d * 22 - 13} 155 h26 M${100 + d * 22 - 13} 162 h26`} strokeWidth="1.5" />
          <path d={`M${100 + d * 22 - 20} 182 V174 Q${100 + d * 22 - 20} 168 ${100 + d * 22 - 14} 168 H${100 + d * 22 + 14} Q${100 + d * 22 + 20} 168 ${100 + d * 22 + 20} 174 V182Z`} fill={c2} />
        </g>
      ))}

      {/* arms */}
      {[-1, 1].map((d) => (
        <g key={d} transform={`translate(${100 + d * 52} 0)`}>
          <rect x="-9" y="92" width="18" height="36" rx="3" fill={`url(#${tin})`} stroke={FG} strokeWidth="3" />
          <path d="M-9 102 h18 M-9 110 h18 M-9 118 h18" stroke={FG} strokeWidth="1.6" />
          <circle cy="94" r="10" fill={c2} stroke={FG} strokeWidth="3" />
          <circle cy="94" r="3" fill={FG} />
          {mk >= 2 ? (
            <path d="M0 126 C-18 130 -20 152 -9 164 C-11 152 -9 145 0 142 C9 145 11 152 9 164 C20 152 18 130 0 126Z" fill={c2} stroke={FG} strokeWidth="3" strokeLinejoin="round" />
          ) : (
            <circle cy="136" r="10" fill={c2} stroke={FG} strokeWidth="3" />
          )}
        </g>
      ))}

      {/* torso */}
      <rect x="56" y="86" width="88" height="62" rx="5" fill={`url(#${tin})`} stroke={FG} strokeWidth="3.5" />
      {rivets([62, 76, 90, 110, 124, 138], 91)}
      {rivets([62, 76, 90, 110, 124, 138], 143)}
      <rect x="66" y="97" width="68" height="41" rx="3" fill={c2} stroke={FG} strokeWidth="2.5" />
      {mk < 2 ? (
        <>
          <circle cx="79" cy="111" r="8" fill="#fff" stroke={FG} strokeWidth="2" />
          <path d="M79 111 L84 106" stroke={INK} strokeWidth="2" strokeLinecap="round" />
          <path d="M72 125 h14 M72 130 h14" stroke={INK} strokeWidth="2.5" />
          <rect x="94" y="102" width="34" height="31" rx="2" fill={INK} />
          <polygon points={star(111, 117.5, 15)} fill={YEL} stroke={c} strokeWidth="1.5" className={a('bct-spark')} />
        </>
      ) : (
        <>
          <rect x="80" y="99" width="40" height="37" fill={INK} />
          <path d="M80 99 L60 92 V144 L80 136Z M120 99 L140 92 V144 L120 136Z" fill={c2} stroke={FG} strokeWidth="2.5" strokeLinejoin="round" />
          <circle cx="66" cy="118" r="2" fill={FG} />
          <circle cx="134" cy="118" r="2" fill={FG} />
          {[90, 110].map((x) => (
            <g key={x}>
              <circle cx={x} cy="118" r="8.5" fill="#9aa0ab" stroke={FG} strokeWidth="2.5" />
              <circle cx={x} cy="118" r="3.5" fill={INK} />
              <polygon points={star(x, 118, x === 90 ? 13 : 16, 7, 0.34)} fill={YEL} stroke="#ff6b35" strokeWidth="1.2" className={a('bct-spark')} style={x === 110 ? { animationDelay: '-.2s' } : undefined} />
            </g>
          ))}
        </>
      )}

      {/* neck and head */}
      <rect x="86" y="76" width="28" height="12" fill="#9aa0ab" stroke={FG} strokeWidth="3" />
      {[-1, 1].map((d) => (
        <path key={d} d={`M${100 + d * 33} 44 L${100 + d * 47} 36 V70 L${100 + d * 33} 62Z`} fill={c2} stroke={FG} strokeWidth="3" strokeLinejoin="round" />
      ))}
      <path d="M100 24 c-4 -3 4 -5 0 -8 c-4 -3 4 -5 0 -8" fill="none" stroke={FG} strokeWidth="3" />
      <circle cx="100" cy="6" r="5" fill={YEL} stroke={FG} strokeWidth="2.5" className={a('i-pulse')} />
      <rect x="66" y="24" width="68" height="54" rx="7" fill={`url(#${tin})`} stroke={FG} strokeWidth="3.5" />
      {rivets([72, 128], 30)}
      {rivets([72, 128], 72)}
      <rect x="72" y="62" width="56" height="12" rx="2" fill={INK} />
      <path d="M81 62 v12 M90 62 v12 M100 62 v12 M110 62 v12 M119 62 v12" stroke={c2} strokeWidth="2.5" />
      {[84, 116].map((x) => (
        <circle key={x} cx={x} cy="44" r="13" fill={INK} stroke={c2} strokeWidth="3" />
      ))}
      <Eyes still={still}>
        {happy ? (
          <path d="M75 47 Q84 34 93 47 M107 47 Q116 34 125 47" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" />
        ) : (
          <>
            <circle cx="84" cy="44" r="8.5" fill="#fff" />
            <circle cx="116" cy="44" r="8.5" fill="#fff" />
            <circle cx="84" cy="44" r="4" fill={INK} />
            <circle cx="116" cy="44" r="4" fill={INK} />
          </>
        )}
      </Eyes>
    </g>
  );
}

/* ---------------------------------------------------------------- pocket */
function Pocket({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const a = (k: string) => (still ? undefined : k);
  const shell = `${uid}-shell`;
  const dark = mix(c2, 26, INK);
  const midg = mix(c2, 62, INK);
  return (
    <g>
      <defs>
        <linearGradient id={shell} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor={mix(c, 62, '#fff')} />
          <stop offset="1" stopColor={c} />
        </linearGradient>
      </defs>
      <Shadow rx={48} />

      {/* the link cable */}
      {mk >= 2 && (
        <g>
          <path d="M52 136 C18 138 6 162 24 174 C42 184 54 160 34 154 C20 150 12 132 20 112" fill="none" stroke={FG} strokeWidth="9" strokeLinecap="round" />
          <path d="M52 136 C18 138 6 162 24 174 C42 184 54 160 34 154 C20 150 12 132 20 112" fill="none" stroke={c} strokeWidth="4" strokeLinecap="round" />
          <rect x="11" y="94" width="18" height="20" rx="2" fill="#9aa0ab" stroke={FG} strokeWidth="3" />
          <path d="M15 94 V86 M20 94 V86 M25 94 V86" stroke={FG} strokeWidth="2.5" />
        </g>
      )}

      {/* the crown: a cartridge pushed into the top */}
      {mk >= 3 && (
        <g stroke={FG} strokeWidth="3" strokeLinejoin="round">
          <path d="M60 36 V6 L74 16 L87 0 L100 14 L113 0 L126 16 L140 6 V36Z" fill={mix(c, 70)} />
          <rect x="74" y="18" width="52" height="11" rx="2" fill={c2} strokeWidth="2.5" />
          <path d="M80 23.5 h40" stroke={dark} strokeWidth="2.5" />
        </g>
      )}

      {/* rubber-hose limbs and big shoes */}
      <g fill="none" strokeLinecap="round">
        <path d="M78 160 C76 170 76 172 76 178 M122 160 C124 170 124 172 124 178" stroke={FG} strokeWidth="6" />
        <path d="M150 104 C168 104 170 88 176 74" stroke={FG} strokeWidth="6" />
        {mk < 2 && <path d="M50 104 C32 106 28 120 28 134" stroke={FG} strokeWidth="6" />}
        {mk >= 2 && <path d="M50 104 C38 100 30 92 24 86" stroke={FG} strokeWidth="6" />}
      </g>
      {[[62, 88], [114, 140]].map(([x1, x2]) => (
        <path key={x1} d={`M${x1} 186 Q${x1 - 2} 176 ${x1 + 12} 175 H${x2 - 4} Q${x2 + 2} 178 ${x2} 186Z`} fill={c2} stroke={FG} strokeWidth="3" strokeLinejoin="round" />
      ))}
      <circle cx="177" cy="68" r="9" fill="#fff" stroke={INK} strokeWidth="3" />
      {mk < 2 && <circle cx="28" cy="140" r="9" fill="#fff" stroke={INK} strokeWidth="3" />}

      {/* the brick */}
      <path d="M58 26 H142 Q150 26 150 34 V134 Q150 164 120 164 H58 Q50 164 50 156 V34 Q50 26 58 26Z" fill={`url(#${shell})`} stroke={FG} strokeWidth="3.5" />
      <path d="M50 35 H150" stroke={FG} strokeWidth="1.5" opacity=".6" />
      <path d="M66 39 H134 Q140 39 140 45 V92 Q140 104 128 104 H66 Q60 104 60 98 V45 Q60 39 66 39Z" fill="#2c2d3a" stroke={FG} strokeWidth="2.5" />
      <circle cx="66" cy="68" r="2.6" fill="#ff3b5c" className={a('i-pulse')} />
      <rect x="72" y="45" width="56" height="52" fill={c2} />
      <rect x="72" y="45" width="56" height="26" fill={mix(c2, 86, '#fff')} />

      {/* the two-tone game behind the face */}
      <g shapeRendering="crispEdges">
        <rect x="76" y="89" width="48" height="4" fill={midg} />
        <rect x="76" y="85" width="16" height="4" fill={midg} />
        <rect x="112" y="85" width="12" height="4" fill={midg} />
        <g className={a('bct-block')}>
          <rect x="104" y="48" width="8" height="4" fill={midg} />
          <rect x="108" y="52" width="4" height="4" fill={midg} />
        </g>
      </g>
      <Eyes still={still}>
        <g shapeRendering="crispEdges" fill={dark}>
          {happy
            ? [80, 106].map((x) => (
                <g key={x}>
                  <rect x={x} y="65" width="4" height="4" />
                  <rect x={x + 4} y="61" width="6" height="4" />
                  <rect x={x + 10} y="65" width="4" height="4" />
                </g>
              ))
            : [82, 108].map((x) => (
                <g key={x}>
                  <rect x={x} y="58" width="10" height="14" />
                  <rect x={x + 2} y="60" width="3" height="3" fill={c2} />
                </g>
              ))}
          <rect x="94" y="76" width="12" height="3" />
        </g>
      </Eyes>

      {/* d-pad, buttons, speaker */}
      <path d="M60 124 h9 v-9 h10 v9 h9 v10 h-9 v9 h-10 v-9 h-9z" fill="#2c2d3a" stroke={FG} strokeWidth="2.5" strokeLinejoin="round" />
      {[[116, 132], [136, 120]].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="8.5" fill={mix(c2, 55, INK)} stroke={FG} strokeWidth="2.5" />
      ))}
      <path d="M74 155 l10 -3 M92 155 l10 -3" stroke={FG} strokeWidth="4" strokeLinecap="round" />
      <path d="M124 160 L144 144 M130 161 L146 149 M118 158 L140 141" stroke={FG} strokeWidth="2" strokeLinecap="round" opacity=".7" />

      {mk >= 3 &&
        [[28, 40, 8], [176, 30, 6], [20, 66, 5], [38, 16, 5], [184, 116, 6], [166, 8, 4]].map(([x, y, s], i) => (
          <rect key={i} x={x} y={y} width={s} height={s} fill={i % 2 ? c : c2} stroke={FG} strokeWidth="1.5" shapeRendering="crispEdges" className={a('bct-float')} style={{ animationDelay: `${-i * 0.5}s` }} />
        ))}
    </g>
  );
}

/* ---------------------------------------------------------------- capsule */
const MiniCapsule = ({ c, c2, r = 13 }: { c: string; c2: string; r?: number }) => (
  <g>
    <circle r={r} fill={mix(c2, 62, 'transparent')} />
    <path d={`M${-r} 0 A${r} ${r} 0 0 0 ${r} 0Z`} fill={c} />
    <circle r={r} fill="none" stroke={FG} strokeWidth="2.5" />
    <path d={`M${-r} 0 H${r}`} stroke={FG} strokeWidth="2.5" />
    <path d={`M${-r * 0.55} ${-r * 0.3} Q${-r * 0.4} ${-r * 0.7} 0 ${-r * 0.72}`} fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
  </g>
);

function Capsule({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const a = (k: string) => (still ? undefined : k);
  const low = `${uid}-low`;
  const glass = `${uid}-glass`;
  const skin = mix(c2, 76, '#fff');
  return (
    <g>
      <defs>
        <linearGradient id={low} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={mix(c, 82, '#fff')} />
          <stop offset="1" stopColor={mix(c, 74)} />
        </linearGradient>
        <radialGradient id={glass} cx="50%" cy="85%" r="85%">
          <stop offset="0" stopColor={c} stopOpacity=".1" />
          <stop offset="1" stopColor={c} stopOpacity=".42" />
        </radialGradient>
      </defs>
      <Shadow rx={44} />
      {mk >= 3 && (
        <g transform="translate(100 112)">
          <g className={a('bct-orbit')}>
            <circle r="84" fill="none" stroke={FG} strokeWidth="1.5" strokeDasharray="2 7" opacity=".55" />
            {[20, 140, 260].map((deg, i) => (
              <g key={deg} transform={`rotate(${deg}) translate(84 0)`}>
                <MiniCapsule c={i === 1 ? mix(c, 60, '#fff') : c} c2={c2} r={i === 0 ? 18 : 15} />
              </g>
            ))}
          </g>
        </g>
      )}
      <g className={a('bct-rock')}>
        {/* feet */}
        {[-1, 1].map((d) => (
          <ellipse key={d} cx={100 + d * 24} cy="176" rx="15" ry="9" fill={skin} stroke={FG} strokeWidth="3" />
        ))}
        {mk >= 2 &&
          [-1, 1].map((d) => (
            <g key={d} transform={`translate(${100 + d * 62} 128) rotate(${d * 118})`}>
              <rect x="-7.5" y="-30" width="15" height="34" rx="7.5" fill={skin} stroke={FG} strokeWidth="3" />
              <path d="M-3 -24 h6" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
            </g>
          ))}
        {/* the kid, inside */}
        <circle cx="100" cy="112" r="66" fill={`url(#${glass})`} />
        <ellipse cx="100" cy="88" rx="33" ry="29" fill={skin} stroke={FG} strokeWidth="3" />
        <path d="M100 60 C94 50 96 46 104 47 C100 50 103 54 104 60Z" fill={c} stroke={FG} strokeWidth="2.5" strokeLinejoin="round" />
        {[-1, 1].map((d) => (
          <ellipse key={d} cx={100 + d * 23} cy="98" rx="6" ry="3.6" fill={c} opacity=".6" />
        ))}
        <Eyes still={still}>
          {happy ? (
            <path d="M76 92 Q85 78 94 92 M106 92 Q115 78 124 92" fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
          ) : (
            [85, 115].map((x) => (
              <g key={x}>
                <ellipse cx={x} cy="87" rx="8.5" ry="11" fill={INK} />
                <circle cx={x + 2.5} cy="82.5" r="3.2" fill="#fff" />
                <circle cx={x - 3} cy="92" r="1.5" fill="#fff" />
              </g>
            ))
          )}
        </Eyes>
        <path d="M95 102 Q100 106 105 102" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />

        {/* the shell */}
        <path d="M34 110 A66 66 0 0 0 166 110Z" fill={`url(#${low})`} />
        <circle cx="100" cy="112" r="66" fill="none" stroke={FG} strokeWidth="3.5" />
        <path d="M46 78 C52 62 64 54 76 50" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity=".9" />
        <path d="M152 84 C150 76 146 70 142 66" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".6" />
        <rect x="31" y="106" width="138" height="11" rx="5.5" fill={c2} stroke={FG} strokeWidth="3" />
        <rect x="90" y="102" width="20" height="19" rx="4" fill={c} stroke={FG} strokeWidth="3" />
        <path d="M58 140 Q84 158 124 152" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".35" />

        {/* stickers */}
        {mk >= 2 && (
          <g stroke={FG} strokeWidth="2" strokeLinejoin="round">
            <polygon points={star(72, 139, 13, 5, 0.46)} fill="#ffd23f" transform="rotate(-14 72 139)" />
            <path d="M118 146 c-9 -9 -17 -1 -12 6 l12 11 12 -11 c5 -7 -3 -15 -12 -6z" transform="rotate(10 118 150) translate(0 -12)" fill={c2} />
            <circle cx="98" cy="157" r="7.5" fill="#fff" />
            <path d="M95 155 v1 M101 155 v1 M94 159 q4 4 8 0" fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
          </g>
        )}
      </g>
    </g>
  );
}

/* ---------------------------------------------------------------- boombox */
function Boombox({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const a = (k: string) => (still ? undefined : k);
  const body = `${uid}-bx`;
  const cone = `${uid}-cone`;
  const chrome = '#b9bec7';
  return (
    <g>
      <defs>
        <linearGradient id={body} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={mix(c, 74, '#fff')} />
          <stop offset=".55" stopColor={c} />
          <stop offset="1" stopColor={mix(c, 72)} />
        </linearGradient>
        <radialGradient id={cone}>
          <stop offset="0" stopColor="#000" />
          <stop offset=".72" stopColor="#3a3a44" />
          <stop offset="1" stopColor={c2} />
        </radialGradient>
      </defs>
      <Shadow rx={56} />

      {/* legs in hi-tops */}
      {[-1, 1].map((d) => (
        <g key={d}>
          <path d={`M${100 + d * 34} 140 V170`} stroke={FG} strokeWidth="7" />
          <path d={`M${100 + d * 34 - 13} 160 h22 v12 q14 2 18 14 h-40z`} transform={d < 0 ? `translate(${2 * (100 + d * 34) - 4} 0) scale(-1 1)` : undefined} fill={c2} stroke={FG} strokeWidth="3" strokeLinejoin="round" />
          <path d={`M${100 + d * 34 - 17} 180 h38`} stroke="#fff" strokeWidth="3" transform={d < 0 ? 'translate(-2 0)' : 'translate(4 0)'} />
        </g>
      ))}

      {/* headphones first: they sit behind the handle */}
      {mk >= 3 && (
        <g>
          <path d="M14 76 C14 -8 186 -8 186 76" fill="none" stroke={FG} strokeWidth="9" />
          <path d="M14 76 C14 -8 186 -8 186 76" fill="none" stroke={c2} strokeWidth="4" />
        </g>
      )}

      {/* telescopic aerial */}
      <path d="M170 66 L192 8" stroke={FG} strokeWidth="5" strokeLinecap="round" />
      <path d="M170 66 L192 8" stroke={chrome} strokeWidth="2" strokeLinecap="round" />
      <circle cx="192" cy="8" r="4.5" fill={c2} stroke={FG} strokeWidth="2.5" />

      {mk >= 3 && (
        <g>
          <path d="M40 66 V46 Q40 30 56 30 H144 Q160 30 160 46 V66" fill="none" stroke={FG} strokeWidth="13" />
          <path d="M40 66 V46 Q40 30 56 30 H144 Q160 30 160 46 V66" fill="none" stroke={chrome} strokeWidth="7" />
          {[72, 80, 88, 96, 104, 112, 120, 128].map((x, i) => (
            <rect key={x} x={x - 3} y={42} width="6" height="20" fill={i % 3 === 1 ? '#fff' : c2} stroke={FG} strokeWidth="1.2" className={a('bct-eq')} style={{ animationDelay: `${-i * 0.23}s`, animationDuration: `${0.5 + (i % 3) * 0.17}s` }} />
          ))}
        </g>
      )}

      {/* piano keys */}
      <g stroke={FG} strokeWidth="2.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={22 + i * 9} y="57" width="9" height="9" fill={i === 2 ? c2 : '#d8d8de'} />
        ))}
      </g>

      {/* body */}
      <rect x="10" y="64" width="180" height="78" rx="9" fill={`url(#${body})`} stroke={FG} strokeWidth="3.5" />
      {[42, 158].map((x) => (
        <g key={x}>
          <circle cx={x} cy="103" r="29" fill={INK} stroke={FG} strokeWidth="3" />
          {mk < 2 && (
            <g fill="#70707c">
              {Array.from({ length: 49 }, (_, i) => {
                const px = (i % 7) * 7 - 21;
                const py = Math.floor(i / 7) * 7 - 21;
                return px * px + py * py < 620 ? <circle key={i} cx={x + px} cy={103 + py} r="1.7" /> : null;
              })}
            </g>
          )}
          {mk >= 2 && (
            <g className={a('bct-pump')}>
              <circle cx={x} cy="103" r="25" fill={`url(#${cone})`} />
              <circle cx={x} cy="103" r="17" fill="none" stroke={c2} strokeWidth="1.5" opacity=".7" />
              <circle cx={x} cy="103" r="9.5" fill={mix(c2, 65, INK)} stroke={c2} strokeWidth="2" />
            </g>
          )}
          {mk < 2 && <circle cx={x} cy="103" r="6" fill={c2} stroke={FG} strokeWidth="2" />}
        </g>
      ))}

      {/* tuner with eyes */}
      <rect x="72" y="69" width="56" height="24" rx="4" fill={INK} stroke={FG} strokeWidth="2.5" />
      <Eyes still={still}>
        {happy ? (
          <path d="M77 86 Q86 73 95 86 M105 86 Q114 73 123 86" fill="none" stroke={c2} strokeWidth="4.5" strokeLinecap="round" />
        ) : (
          <>
            <rect x="79" y="74" width="15" height="14" rx="3" fill={c2} />
            <rect x="106" y="74" width="15" height="14" rx="3" fill={c2} />
            <rect x="83" y="77" width="5" height="5" fill="#fff" />
            <rect x="110" y="77" width="5" height="5" fill="#fff" />
          </>
        )}
      </Eyes>

      {/* the cassette: a mouth */}
      <rect x="72" y="97" width="56" height="39" rx="3" fill="#e9e6dc" stroke={FG} strokeWidth="2.5" />
      <rect x="76" y="100" width="48" height="8" fill={c2} />
      <text x="100" y="107" textAnchor="middle" fontSize="7.5" fontWeight="900" fontFamily="sans-serif" fill={INK}>SIDE B</text>
      <rect x="78" y="111" width="44" height="15" rx="7.5" fill={INK} />
      {[87, 113].map((x) => (
        <g key={x} transform={`translate(${x} 118.5)`}>
          <g className={a('i-spin')}>
            <circle r="5.5" fill="#fff" />
            <path d="M0 -5.5 V-2.5 M0 5.5 V2.5 M-5.5 0 H-2.5 M5.5 0 H2.5" stroke={INK} strokeWidth="1.8" />
            <circle r="1.8" fill={INK} />
          </g>
        </g>
      ))}
      <path d="M82 136 L86 128 H114 L118 136" fill="#c9c6bc" stroke={FG} strokeWidth="2" strokeLinejoin="round" />

      {mk >= 3 &&
        [-1, 1].map((d) => (
          <g key={d}>
            <rect x={100 + d * 90 - 11} y="68" width="22" height="48" rx="10" fill={c2} stroke={FG} strokeWidth="3" />
            <path d={`M${100 + d * 90 - 4} 78 v28 M${100 + d * 90 + 4} 78 v28`} stroke={FG} strokeWidth="1.8" opacity=".6" />
          </g>
        ))}
    </g>
  );
}

/* ---------------------------------------------------------------- vending */
function Vending({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const a = (k: string) => (still ? undefined : k);
  const lit = `${uid}-lit`;
  const body = `${uid}-vb`;
  const hues = [c2, '#ffffff', '#ff5a5f', '#7ae582'];
  const can = (x: number, y: number, f: string, k: string) => (
    <g key={k}>
      <rect x={x} y={y} width="13" height="19" rx="3" fill={f} stroke={INK} strokeWidth="1.2" />
      <rect x={x + 2} y={y + 6} width="9" height="5" fill={mk >= 2 ? INK : 'none'} opacity=".28" />
    </g>
  );
  return (
    <g>
      <defs>
        <linearGradient id={body} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={mix(c, 82, '#fff')} />
          <stop offset="1" stopColor={c} />
        </linearGradient>
        <linearGradient id={lit} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={mix(c2, 40, '#fff')} />
          <stop offset="1" stopColor={mix(c2, 26, '#fff')} />
        </linearGradient>
      </defs>
      <Shadow rx={54} />

      {/* walking legs */}
      <g className={a('bct-step')}>
        <path d="M76 150 L60 172" stroke={FG} strokeWidth="10" strokeLinecap="round" />
        <path d="M34 184 Q36 172 50 168 H66 Q72 172 72 184Z" fill={c2} stroke={FG} strokeWidth="3" strokeLinejoin="round" />
      </g>
      <g className={a('bct-step2')}>
        <path d="M124 150 L142 170" stroke={FG} strokeWidth="10" strokeLinecap="round" />
        <path d="M130 178 L132 166 L150 164 L166 176 L160 184Z" fill={c2} stroke={FG} strokeWidth="3" strokeLinejoin="round" />
      </g>

      <g className={a('bct-waddle')}>
        {/* one arm back; the other holds up today's special */}
        <path d="M46 92 C28 96 20 84 24 66" fill="none" stroke={FG} strokeWidth="7" strokeLinecap="round" />
        <rect x="14" y="44" width="20" height="26" rx="4" fill={c2} stroke={FG} strokeWidth="3" />
        <path d="M14 53 H34 M14 61 H34" stroke={FG} strokeWidth="1.5" />
        <path d="M146 96 C164 100 172 112 168 126" fill="none" stroke={FG} strokeWidth="7" strokeLinecap="round" />
        <circle cx="168" cy="130" r="8" fill="#fff" stroke={INK} strokeWidth="2.5" />

        {/* box with a side, so it stands in a street */}
        <path d="M146 16 L160 24 V146 L146 156Z" fill={mix(c, 60)} stroke={FG} strokeWidth="3" strokeLinejoin="round" />
        <rect x="46" y="10" width="100" height="146" rx="5" fill={`url(#${body})`} stroke={FG} strokeWidth="3.5" />
        <path d="M153 34 v98" stroke={c2} strokeWidth="2" opacity=".7" />

        {/* the sign panel holds its face */}
        <rect x="52" y="15" width="88" height="29" rx="3" fill={INK} stroke={FG} strokeWidth="2.5" />
        <Eyes still={still}>
          {happy ? (
            <path d="M64 37 Q74 22 84 37 M108 37 Q118 22 128 37" fill="none" stroke={c2} strokeWidth="5" strokeLinecap="round" />
          ) : (
            <>
              <rect x="64" y="20" width="20" height="19" rx="4" fill={c2} />
              <rect x="108" y="20" width="20" height="19" rx="4" fill={c2} />
              <rect x="73" y="24" width="8" height="11" rx="1" fill={INK} />
              <rect x="117" y="24" width="8" height="11" rx="1" fill={INK} />
            </>
          )}
        </Eyes>

        {/* the drink window */}
        <rect x="52" y="48" width="73" height="70" rx="2" fill={mk >= 2 ? `url(#${lit})` : INK} stroke={FG} strokeWidth="2.5" />
        {[0, 1, 2].map((r) => (
          <g key={r}>
            {[0, 1, 2, 3].map((k) => can(56.5 + k * 16.5, 50.5 + r * 22.5, mk >= 2 ? hues[(r * 3 + k * 2) % 4] : mix(c, 72, '#555'), `${r}${k}`))}
            {r < 2 && <path d={`M52 ${71 + r * 22.5} H125`} stroke={mk >= 2 ? INK : '#666'} strokeWidth="1.5" />}
          </g>
        ))}

        {/* buttons and coins */}
        <rect x="129" y="48" width="13" height="70" rx="2" fill={mix(c, 55)} stroke={FG} strokeWidth="2" />
        {mk >= 2 && (
          <g>
            <rect x="133" y="54" width="5" height="14" rx="2.5" fill={INK} stroke="#fff" strokeWidth="1.2" />
            <circle cx="135.5" cy="80" r="4" fill={c2} stroke={INK} strokeWidth="1.5" />
            <circle cx="135.5" cy="92" r="4" fill="#fff" stroke={INK} strokeWidth="1.5" />
          </g>
        )}

        {/* hot and cold */}
        {mk >= 3 && (
          <g>
            <rect x="52" y="120" width="36" height="11" fill="#d7263d" stroke={FG} strokeWidth="2" />
            <rect x="88" y="120" width="37" height="11" fill="#1d7dff" stroke={FG} strokeWidth="2" />
            <text x="70" y="129" textAnchor="middle" fontSize="8" fontWeight="800" fontFamily="sans-serif" fill="#fff">HOT</text>
            <text x="106.5" y="129" textAnchor="middle" fontSize="8" fontWeight="800" fontFamily="sans-serif" fill="#fff">COLD</text>
          </g>
        )}

        {/* the flap */}
        <rect x="52" y={mk >= 3 ? 134 : 122} width="60" height={mk >= 3 ? 18 : 30} rx="3" fill={INK} stroke={FG} strokeWidth="2.5" />
        {mk >= 3 && (
          <g className={a('bct-can')}>
            <rect x="74" y={still ? 141 : 115} width="17" height="10" rx="2" fill={c2} stroke={FG} strokeWidth="1.5" />
          </g>
        )}
        <rect x="116" y="124" width="25" height="24" rx="2" fill={mix(c, 55)} stroke={FG} strokeWidth="2" />
        <path d="M122 134 h13" stroke={mk >= 2 ? c2 : INK} strokeWidth="3" />
        <circle cx="128.5" cy="142" r="2.5" fill={FG} />
      </g>
    </g>
  );
}

/* ---------------------------------------------------------------- sprite */
/** A bitmap. One letter, one colour, one 7 px square: runs are merged so the DOM stays small. */
const P = 7;
function Bitmap({ rows, pal, x = 0, y = 0 }: { rows: string[]; pal: Record<string, string>; x?: number; y?: number }) {
  const out: ReactNode[] = [];
  rows.forEach((row, ry) => {
    let i = 0;
    while (i < row.length) {
      const ch = row[i];
      let n = 1;
      while (row[i + n] === ch) n++;
      if (pal[ch]) out.push(<rect key={`${ry}.${i}`} x={9 + (x + i) * P} y={(y + ry) * P} width={n * P} height={P} fill={pal[ch]} />);
      i += n;
    }
  });
  return <g shapeRendering="crispEdges">{out}</g>;
}
const sym = (rows: string[]) => rows.map((r) => r + [...r].reverse().join(''));

const KNIGHT = sym([
  '............k',
  '...........kg',
  '...........kg',
  '........kkkkg',
  '.......kmmmmg',
  '......kmWmmmg',
  '......kmWmmmm',
  '......kmmmmmm',
  '......kvvvvvv',
  '......kvvvvvv',
  '......kmmmmmN',
  '.......kmmmmN',
  '....kkkkkkkkk',
  '...kAAAkaaaaa',
  '...kAAAkaaaag',
  '...kkkkkaaagg',
  '...kmkkaaaaag',
  '...kmkaaaaaag',
  '...kmkaaaaaaa',
  '...kMkkgggggg',
  '...kkk.kaaaaa',
  '.......kAAAk.',
  '.......kAAAk.',
  '.......kmmmk.',
  '......kmmmmk.',
  '......kkkkkk.',
]);
const SWORD = ['...kk...', '..kWMk..', '..kWMk..', '..kWMk..', '..kWMk..', '..kWMk..', '..kWMk..', '..kWMk..', '..kWMk..', '..kWMk..', '..kWMk..', '..kWMk..', 'kkkkkkkk', 'kggggggk', 'kkkkkkkk', '..kaak..', '..kaak..', '..kggk..', '..kkkk..'];
const SHIELD = ['kkkkkkkkk', 'kaaagaaak', 'kaaagaaak', 'kaaagaaak', 'kgggggggk', 'kaaagaaak', 'kaaagaaak', '.kaagaak.', '.kaagaak.', '..kagak..', '...kgk...', '....k....'];
const CAPE = [
  '......kkkkkkkkkkkkkk......',
  '.....kCCCCCCCCCCCCCCk.....',
  '....kCCCCCCCCCCCCCCCCk....',
  '...kCCCCCCCCCCCCCCCCCCk...',
  '...kCCCCCCCCCCCCCCCCCCk...',
  '..kCCCCCCCCCCCCCCCCCCCCk..',
  '..kCCCCCCCCCCCCCCCCCCCCk..',
  '..kCCCCCCCCCCCCCCCCCCCCk..',
  '.kCCCCCCCCCCCCCCCCCCCCCCk.',
  '.kCCCCCCCCCCCCCCCCCCCCCCk.',
  'kCCCCCCCCCCCCCCCCCCCCCCCCk',
  'kCCCkkCCCCkkkkkkCCCCkkCCCk',
  'kkkk..kkkk......kkkk..kkkk',
];
const HEART = ['r.r', 'rrr', '.r.'];

function Sprite({ c, c2, still, happy, mk }: BotArtProps) {
  const pal = { k: FG, m: '#d5d9e0', M: '#8d94a3', W: '#ffffff', g: c2, a: c, A: mix(c, 68), v: INK, N: '#50535f', C: mix(c2, 62, '#e8432e'), r: '#ff3b5c', e: '#6b6f7b' };
  return (
    <g className={still ? undefined : 'bct-frame'}>
      {mk >= 3 && (
        <>
          <Bitmap rows={CAPE} pal={pal} x={0} y={12} />
          <Bitmap rows={HEART} pal={pal} x={0} y={0} />
          <Bitmap rows={HEART} pal={pal} x={4} y={0} />
          <Bitmap rows={HEART} pal={{ ...pal, r: pal.e }} x={8} y={0} />
        </>
      )}
      <Bitmap rows={KNIGHT} pal={pal} />
      {mk >= 2 && (
        <>
          <Bitmap rows={SWORD} pal={pal} x={20} y={1} />
          <Bitmap rows={SHIELD} pal={pal} x={-1} y={13} />
        </>
      )}
      <Eyes still={still}>
        <g shapeRendering="crispEdges" fill={c2}>
          {happy
            ? [8, 15].map((cx) => (
                <g key={cx}>
                  <rect x={9 + cx * P} y={9 * P} width={P} height={P} />
                  <rect x={9 + (cx + 1) * P} y={8 * P} width={P} height={P} />
                  <rect x={9 + (cx + 2) * P} y={9 * P} width={P} height={P} />
                </g>
              ))
            : [9, 15].map((cx) => <rect key={cx} x={9 + cx * P} y={8 * P} width={2 * P} height={2 * P} />)}
        </g>
      </Eyes>
    </g>
  );
}

/* ---------------------------------------------------------------- arcade */
function Arcade({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const a = (k: string) => (still ? undefined : k);
  const side = `${uid}-side`;
  const crt = `${uid}-crt`;
  const halo = `${uid}-halo`;
  const SCR = '#0b0920';
  return (
    <g>
      <defs>
        <linearGradient id={side} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={mix(c, 60)} />
          <stop offset=".5" stopColor={mix(c, 88, '#fff')} />
          <stop offset="1" stopColor={mix(c, 60)} />
        </linearGradient>
        <radialGradient id={crt}>
          <stop offset="0" stopColor={mix(c2, 45, SCR)} />
          <stop offset="1" stopColor={SCR} />
        </radialGradient>
        <radialGradient id={halo}>
          <stop offset="0" stopColor={c2} stopOpacity=".55" />
          <stop offset="1" stopColor={c2} stopOpacity="0" />
        </radialGradient>
      </defs>
      <Shadow rx={56} />
      {mk >= 2 && <circle cx="100" cy="76" r="78" fill={`url(#${halo})`} />}

      {/* rex feet */}
      {[-1, 1].map((d) => (
        <path key={d} d={`M${100 + d * 34 - 22} 186 l4 -8 4 3 4 -3 6 0 4 -8 h8 l6 8 6 0 4 3 4 -3 4 8z`} fill={c2} stroke={FG} strokeWidth="3" strokeLinejoin="round" />
      ))}

      {/* cabinet: the waist is what makes it an arcade machine */}
      <path d="M54 126 L146 126 L146 176 H54Z" fill={`url(#${side})`} stroke={FG} strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M58 50 H142 V108 H58Z" fill={mix(c, 64)} stroke={FG} strokeWidth="3.5" />

      {/* stumpy rex arm */}
      <g stroke={FG} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
        <path d="M58 86 C46 86 38 90 34 98" fill="none" strokeWidth="8" />
        <path d="M58 86 C46 86 38 90 34 98" fill="none" stroke={c} strokeWidth="3" />
        <path d="M36 94 L24 96 M35 97 L27 106 M36 99 L36 110" strokeWidth="3.5" stroke={FG} />
      </g>

      {/* screen */}
      <rect x="66" y="52" width="68" height="52" rx="6" fill={mk >= 2 ? `url(#${crt})` : SCR} stroke={FG} strokeWidth="2.5" />
      {mk >= 2 && (
        <g stroke={c2} strokeWidth="1" opacity=".18">
          {[62, 68, 74, 80, 86, 92, 98].map((y) => (
            <path key={y} d={`M67 ${y} H133`} />
          ))}
        </g>
      )}
      <Eyes still={still}>
        <g shapeRendering="crispEdges">
          {happy ? (
            <g fill={c2}>
              {[74, 106].map((x) => (
                <g key={x}>
                  <rect x={x} y="80" width="5" height="5" />
                  <rect x={x + 5} y="75" width="10" height="5" />
                  <rect x={x + 15} y="80" width="5" height="5" />
                </g>
              ))}
            </g>
          ) : (
            [76, 106].map((x) => (
              <g key={x}>
                <rect x={x} y="70" width="18" height="18" fill={c2} />
                <rect x={x + 9} y="75" width="7" height="8" fill={SCR} />
              </g>
            ))
          )}
        </g>
      </Eyes>
      {mk >= 3 && (
        <text x="100" y="66" textAnchor="middle" fontSize="8.5" fontWeight="700" fontFamily="ui-monospace, Menlo, Consolas, monospace" fill="#fff">HI 999900</text>
      )}

      {/* control panel */}
      <path d="M38 124 L52 104 H148 L162 124 V134 H38Z" fill={mix(c, 82, '#111')} stroke={FG} strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M38 124 H162" stroke={FG} strokeWidth="2.5" />
      {[[72, 114], [90, 114], [108, 114]].map(([x, y], i) => (
        <g key={x}>
          <ellipse cx={x} cy={y + 1.5} rx="6.5" ry="4" fill={INK} />
          <ellipse cx={x} cy={y - 0.5} rx="6" ry="3.6" fill={i === 1 ? c : c2} stroke={FG} strokeWidth="1.8" />
        </g>
      ))}

      {/* joystick arm */}
      <g transform="translate(146 118)">
        <ellipse cx="0" cy="1" rx="10" ry="5" fill={INK} stroke={FG} strokeWidth="2" />
        <g className={a('bct-stick')}>
          <path d="M0 0 V-46" stroke={FG} strokeWidth="9" strokeLinecap="round" />
          <path d="M0 0 V-46" stroke="#c8ccd4" strokeWidth="3.5" strokeLinecap="round" />
          <circle cy="-54" r="13" fill={c2} stroke={FG} strokeWidth="3.5" />
          <path d="M-6 -59 Q-3 -63 2 -63" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        </g>
      </g>

      {/* side art under the panel */}
      {mk < 3 && (
        <g>
          <path d="M60 148 L80 138 L74 150 L100 138 L92 152 L124 138 L114 156 L142 146" fill="none" stroke={c2} strokeWidth="4" strokeLinejoin="round" />
          <rect x="62" y="158" width="76" height="10" fill={INK} stroke={FG} strokeWidth="2" />
          <path d="M70 163 h60" stroke={c2} strokeWidth="1.5" strokeDasharray="4 4" />
        </g>
      )}
      {/* coin door */}
      {mk >= 3 && (
        <g>
          <rect x="68" y="138" width="64" height="34" rx="2" fill={INK} stroke={FG} strokeWidth="2.5" />
          {[84, 116].map((x) => (
            <g key={x}>
              <rect x={x - 9} y="143" width="18" height="16" rx="1.5" fill={c2} stroke={FG} strokeWidth="1.5" className={a('bct-chase')} style={x === 116 ? { animationDelay: '-.45s' } : undefined} />
              <rect x={x - 1.3} y="146" width="2.6" height="10" fill={INK} />
            </g>
          ))}
          <text x="100" y="169" textAnchor="middle" fontSize="6.5" fontWeight="700" fontFamily="ui-monospace, Menlo, Consolas, monospace" fill={c2}>INSERT COIN</text>
        </g>
      )}

      {/* marquee: a forehead with teeth */}
      <path d="M68 50 l5 9 5 -9 5 9 5 -9 5 9 5 -9 5 9 5 -9 5 9 5 -9 5 9 5 -9z" fill="#f4f1ea" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
      {mk >= 3 && (
        <path d="M78 14 L70 -4 L88 6 L100 -8 L112 6 L130 -4 L122 14Z" fill={c2} stroke={FG} strokeWidth="3" strokeLinejoin="round" />
      )}
      <path d="M46 14 H154 Q158 14 158 18 L152 50 H48 L42 18 Q42 14 46 14Z" fill={mk >= 2 ? c2 : c} stroke={FG} strokeWidth="3.5" strokeLinejoin="round" />
      <text x="100" y="42" textAnchor="middle" fontSize="23" fontWeight="900" letterSpacing="2" fontFamily="Impact, 'Arial Black', sans-serif" fill={mk >= 2 ? c : c2}>REX</text>
      {mk >= 2 &&
        [52, 66, 80, 94, 108, 122, 136, 150].map((x, i) => (
          <circle key={x} cx={x} cy="20" r="2.6" fill="#fff" stroke={INK} strokeWidth="1" className={a('bct-chase')} style={{ animationDelay: `${(-i % 2) * 0.45}s` }} />
        ))}
    </g>
  );
}

export const TOYS: BotRegistry = {
  tin: { Art: Tin, head: { x: 100, y: 24, s: 1.13 } },
  pocket: { Art: Pocket, head: { x: 100, y: 26, s: 1.67 } },
  capsule: { Art: Capsule, head: { x: 100, y: 46, s: 1.5 } },
  boombox: { Art: Boombox, head: { x: 100, y: 62, s: 1.4 } },
  vending: { Art: Vending, head: { x: 96, y: 10, s: 1.67 } },
  sprite: { Art: Sprite, head: { x: 100, y: 21, s: 1.6 } },
  arcade: { Art: Arcade, head: { x: 100, y: 14, s: 1.8 } },
};
