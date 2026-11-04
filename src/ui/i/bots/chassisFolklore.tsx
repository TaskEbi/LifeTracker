import type { CSSProperties, ReactNode } from 'react';
import type { BotArtProps, BotRegistry } from './types';
import './chassisFolklore.css';

const OL = { stroke: 'var(--fg)', strokeWidth: 3.5, strokeLinejoin: 'round', strokeLinecap: 'round' } as const;
const TH = { ...OL, strokeWidth: 2 } as const;
const INK = '#14141a';
const PAPER = '#f7f2e6';
const GOLD = '#f5c542';
const dk = (c: string, n = 35) => `color-mix(in srgb, ${c} ${100 - n}%, #000)`;
const lt = (c: string, n = 35) => `color-mix(in srgb, ${c} ${100 - n}%, #fff)`;
const an = (still: boolean, cls: string) => (still ? undefined : cls);
const origin = (x: number, y: number): CSSProperties => ({ transformOrigin: `${x}px ${y}px` });
const KANJI = '"Yu Mincho", "Hiragino Mincho ProN", "Noto Serif JP", serif';

function Eyes({ still, children }: { still: boolean; children: ReactNode }) {
  return (
    <g className="dr-gaze">
      <g className={still ? undefined : 'i-blink'}>{children}</g>
    </g>
  );
}
const Shadow = ({ rx = 52 }: { rx?: number }) => <ellipse cx="100" cy="185" rx={rx} ry="5" fill="var(--fg)" opacity=".14" />;
const Bolt = ({ x, y, r = 3 }: { x: number; y: number; r?: number }) => <circle cx={x} cy={y} r={r} fill="var(--surf-2)" stroke="var(--fg)" strokeWidth="1.5" />;
function Metal({ id, c }: { id: string; c: string }) {
  return (
    <radialGradient id={id} cx=".36" cy=".28" r=".9">
      <stop offset="0" stopColor={lt(c, 30)} />
      <stop offset=".5" stopColor={c} />
      <stop offset="1" stopColor={dk(c, 34)} />
    </radialGradient>
  );
}
/** A gear outline; `saw` leans the teeth over, for an escape wheel. */
function gear(cx: number, cy: number, r: number, teeth: number, depth = 5, saw = false) {
  const pts: string[] = [];
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const at = (rad: number, o: number) => `${(cx + rad * Math.cos(a + o * step)).toFixed(1)},${(cy + rad * Math.sin(a + o * step)).toFixed(1)}`;
    if (saw) pts.push(at(r - depth, 0), at(r, 0.1), at(r - depth, 0.55));
    else pts.push(at(r - depth, 0), at(r, 0.14), at(r, 0.4), at(r - depth, 0.54));
  }
  return pts.join(' ');
}

// ─── Tanuki ─────────────────────────────────────────────────────────────────
function Tanuki({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const fur = `${uid}-f`;
  const R = mk === 3 ? 56 : 45;
  const cy = mk === 3 ? 122 : 127;
  const skin = mk === 3 ? 44 : 34;
  return (
    <g>
      <defs>
        <Metal id={fur} c={c} />
        <radialGradient id={`${uid}-s`} cx=".4" cy=".35" r=".8">
          <stop offset="0" stopColor={lt(c2, 55)} />
          <stop offset="1" stopColor={c2} />
        </radialGradient>
      </defs>
      <Shadow rx={mk === 3 ? 72 : 58} />
      {/* ringed tail */}
      <g transform="rotate(32 158 150)">
        <ellipse cx="158" cy="124" rx="17" ry="34" fill={c} {...OL} />
        <path d="M143 112 Q158 120 173 112 M141 128 Q158 137 175 128 M145 144 Q158 151 171 144" fill="none" stroke={INK} strokeWidth="5" />
      </g>
      {mk >= 2 && (
        <g>
          <path d="M23 122 h12 v7 c0 7 11 11 11 26 a17 16 0 0 1 -34 0 c0 -15 11 -19 11 -26z" fill={PAPER} {...OL} />
          <rect x="19" y="141" width="20" height="20" rx="2" fill={INK} />
          <text x="29" y="157" textAnchor="middle" fontSize="16" fontWeight="900" fontFamily={KANJI} fill={PAPER}>酒</text>
          <path d="M23 127 h12" stroke={c2} strokeWidth="3" />
        </g>
      )}
      <circle cx="100" cy={cy} r={R} fill={`url(#${fur})`} {...OL} />
      {/* the belly is a drum */}
      <circle cx="100" cy={cy} r={skin} fill={`url(#${uid}-s)`} stroke={dk(c, 45)} strokeWidth="4" />
      {Array.from({ length: mk === 3 ? 14 : 10 }, (_, i) => {
        const n = mk === 3 ? 14 : 10;
        const a = (i / n) * Math.PI * 2;
        return <circle key={i} cx={100 + (skin + 5.5) * Math.cos(a)} cy={cy + (skin + 5.5) * Math.sin(a)} r="2.6" fill={mk === 3 ? GOLD : 'var(--surf-2)'} stroke="var(--fg)" strokeWidth="1.2" />;
      })}
      {[0, 120, 240].map((r) => (
        <path key={r} transform={`translate(100 ${cy}) rotate(${r}) scale(${mk === 3 ? 1.35 : 1.05})`} d="M0 -17 a8 8 0 0 1 8 8 c0 6 -4 9 -9 9 c3 -2 3 -6 0 -7 a5.5 5.5 0 0 1 1 -10z" fill={dk(c, 25)} />
      ))}
      {/* a bad repair */}
      <g transform={`rotate(38 ${100 + skin * 0.62} ${cy + skin * 0.62})`}>
        <rect x={100 + skin * 0.62 - 14} y={cy + skin * 0.62 - 4.5} width="28" height="9" rx="1.5" fill="#c9c4b4" stroke={INK} strokeWidth="1.2" />
        <rect x={100 + skin * 0.62 - 4.5} y={cy + skin * 0.62 - 14} width="9" height="28" rx="1.5" fill="#c9c4b4" stroke={INK} strokeWidth="1.2" />
      </g>
      {/* feet */}
      {[-1, 1].map((d) => (
        <g key={d}>
          <ellipse cx={100 + d * 36} cy="174" rx="21" ry="10" fill={c} {...OL} />
          <path d={`M${100 + d * 28} 170 v6 M${100 + d * 36} 169 v8 M${100 + d * 44} 170 v6`} stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      ))}
      {/* one spanner, one mallet */}
      {[-1, 1].map((d) => (
        <g key={d} className={an(still, d < 0 ? 'bcf-drum-l' : 'bcf-drum-r')} style={origin(100 + d * 42, 98)}>
          <path d={`M${100 + d * 42} 98 L${100 + d * (R + 12)} 118`} stroke="var(--fg)" strokeWidth="16" strokeLinecap="round" />
          <path d={`M${100 + d * 42} 98 L${100 + d * (R + 12)} 118`} stroke={dk(c, 12)} strokeWidth="10" strokeLinecap="round" />
          <path d={`M${100 + d * (R + 10)} 118 L${100 + d * 28} 108`} stroke="var(--fg)" strokeWidth="7" strokeLinecap="round" />
          <path d={`M${100 + d * (R + 10)} 118 L${100 + d * 28} 108`} stroke={PAPER} strokeWidth="3" strokeLinecap="round" />
          {d < 0 ? (
            <path d="M76 92 A13 13 0 1 0 85 108 L74 106 L78 96 Z" fill={PAPER} {...OL} strokeWidth="2.5" />
          ) : (
            <g transform="rotate(16 128 108)">
              <rect x="118" y="93" width="20" height="30" rx="4" fill={GOLD} {...OL} strokeWidth="2.5" />
              <path d="M119 101 h18 M119 115 h18" stroke={dk(GOLD, 45)} strokeWidth="2.5" />
            </g>
          )}
          <circle cx={100 + d * (R + 12)} cy="118" r="9.5" fill={c} {...OL} />
        </g>
      ))}
      {/* head */}
      {[-1, 1].map((d) => (
        <g key={d}>
          <circle cx={100 + d * 33} cy="35" r="14" fill={c} {...OL} />
          <circle cx={100 + d * 33} cy="35" r="6" fill={INK} />
          <circle cx={100 + d * 33} cy="35" r="2" fill={c2} />
        </g>
      ))}
      <path d="M100 28 C126 28 142 44 142 62 L153 73 L139 77 L145 88 L123 91 C110 98 90 98 77 91 L55 88 L61 77 L47 73 L58 62 C58 44 74 28 100 28Z" fill={`url(#${fur})`} {...OL} />
      <path d="M67 56 C75 45 92 49 98 58 L102 58 C108 49 125 45 133 56 C139 67 128 79 116 77 C108 75 104 71 100 66 C96 71 92 75 84 77 C72 79 61 67 67 56Z" fill={INK} />
      <Eyes still={still}>
        {happy ? (
          <path d="M74 66 Q84 53 94 66 M106 66 Q116 53 126 66" fill="none" stroke={c2} strokeWidth="5" strokeLinecap="round" />
        ) : (
          <>
            <circle cx="84" cy="62" r="8" fill={c2} />
            <circle cx="116" cy="62" r="8" fill={c2} />
            <circle cx="86" cy="60" r="3" fill={INK} />
            <circle cx="118" cy="60" r="3" fill={INK} />
          </>
        )}
      </Eyes>
      <ellipse cx="100" cy="82" rx="17" ry="11" fill={lt(c2, 40)} stroke={INK} strokeWidth="1.5" />
      <path d="M93 74 h14 q-2 7 -7 8 q-5 -1 -7 -8z" fill={INK} />
      <path d="M90 85 Q100 92 110 85" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
      <rect x="98" y="87.5" width="6" height="5" rx="1" fill={PAPER} stroke={INK} strokeWidth="1" />
      {/* plaster and a spring that has given up */}
      <g transform="rotate(-24 76 40)">
        <rect x="62" y="35" width="28" height="10" rx="3" fill="#e7cfa6" stroke={INK} strokeWidth="1.5" />
        <path d="M70 37.5 v5 M76 37.5 v5 M82 37.5 v5" stroke={INK} strokeWidth="1.2" />
      </g>
      {mk < 3 && (
        <g>
          <path d="M118 30 l10 -3 l-8 -4 l10 -3 l-8 -4 l10 -3" fill="none" stroke="var(--fg)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <Bolt x={131} y={11} r={4} />
        </g>
      )}
      {mk === 3 && (
        <g transform="rotate(-7 100 30)">
          <path d="M30 36 C56 -12 144 -12 170 36 Q100 14 30 36Z" fill={c2} {...OL} />
          <path d="M100 -2 L62 25 M100 -2 L82 20 M100 -2 V17 M100 -2 L118 20 M100 -2 L138 25 M60 14 Q100 -2 140 14" fill="none" stroke={dk(c2, 45)} strokeWidth="2.5" />
          <path d="M34 34 Q100 14 166 34" fill="none" stroke={dk(c, 20)} strokeWidth="4.5" />
        </g>
      )}
      {mk >= 2 && (
        <g transform={mk === 3 ? 'translate(38 -14) rotate(34 100 30)' : 'rotate(-14 100 30)'}>
          <path d="M100 30 C82 24 80 8 94 0 C112 4 116 22 100 30Z" fill="#79c850" {...TH} />
          <path d="M100 30 Q96 16 94 4" fill="none" stroke="#2e6b1a" strokeWidth="2" />
        </g>
      )}
    </g>
  );
}

// ─── Daruma ─────────────────────────────────────────────────────────────────
function Daruma({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const body = `${uid}-b`;
  const eye = (x: number, painted: boolean) =>
    painted ? (
      happy ? (
        <path d={`M${x - 14} ${88} Q${x} ${68} ${x + 14} ${88}`} fill="none" stroke={INK} strokeWidth="7" strokeLinecap="round" />
      ) : (
        <>
          <circle cx={x} cy="84" r="13.5" fill={INK} />
          <circle cx={x + 4} cy="79" r="4" fill={PAPER} />
        </>
      )
    ) : (
      <>
        <circle cx={x} cy="84" r="13.5" fill="#fff" stroke={INK} strokeWidth="1.8" strokeDasharray="3.5 3.5" />
        <path d={`M${x - 5} 84 h10 M${x} 79 v10`} stroke={INK} strokeWidth="1.5" opacity=".55" />
      </>
    );
  return (
    <g>
      <defs>
        <Metal id={body} c={c} />
      </defs>
      <Shadow rx={46} />
      {mk === 3 && (
        <g className={an(still, 'i-spin i-spin--slow')}>
          {Array.from({ length: 16 }, (_, i) => (
            <path key={i} d="M100 2 L108 34 L92 34Z" fill={i % 2 ? c2 : lt(c2, 35)} stroke="var(--fg)" strokeWidth="1.5" strokeLinejoin="round" transform={`rotate(${i * 22.5} 100 100)`} />
          ))}
        </g>
      )}
      <g className={an(still, 'bcf-rock')}>
        <path d="M100 26 C148 26 166 74 166 114 C166 156 138 180 100 180 C62 180 34 156 34 114 C34 74 52 26 100 26Z" fill={`url(#${body})`} {...OL} />
        {/* ballast */}
        <path d="M40 148 Q100 172 160 148 C150 170 128 178 100 178 C72 178 50 170 40 148Z" fill={dk(c, 42)} />
        {[58, 79, 100, 121, 142].map((x, i) => <Bolt key={x} x={x} y={[160, 166, 168, 166, 160][i]} r={2.8} />)}
        {/* seam and side hinges */}
        <path d="M60 44 Q100 26 140 44" fill="none" stroke={dk(c, 40)} strokeWidth="3" />
        <path d="M38 98 h9 M38 106 h11 M38 114 h11 M162 98 h-9 M162 106 h-11 M162 114 h-11" stroke={c2} strokeWidth="3" strokeLinecap="round" />
        {/* face plate */}
        <path d="M100 50 C126 42 146 62 144 88 C142 114 122 126 100 126 C78 126 58 114 56 88 C54 62 74 42 100 50Z" fill={PAPER} stroke={mk === 3 ? c2 : INK} strokeWidth={mk === 3 ? 5 : 3} />
        {mk === 3 && <path d="M100 50 C126 42 146 62 144 88 C142 114 122 126 100 126 C78 126 58 114 56 88 C54 62 74 42 100 50Z" fill="none" stroke={INK} strokeWidth="1.2" />}
        <Eyes still={still}>
          {eye(79, true)}
          {eye(121, mk === 3)}
        </Eyes>
        <path d="M95 96 h10 l-5 9z" fill={INK} />
        {mk >= 2 ? (
          <g>
            <path d="M58 74 C60 54 82 48 94 66 C82 60 70 62 58 74Z" fill={c2} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
            <path d="M142 74 C140 54 118 48 106 66 C118 60 130 62 142 74Z" fill={c2} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
            <path d="M100 106 C92 102 80 104 72 112 C68 116 66 110 68 106 C62 112 64 122 74 120 C84 118 94 116 100 112 C106 116 116 118 126 120 C136 122 138 112 132 106 C134 110 132 116 128 112 C120 104 108 102 100 106Z" fill={c2} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          </g>
        ) : (
          <path d="M88 113 Q100 106 112 113" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        )}
        {mk === 3 ? (
          <text x="100" y="160" textAnchor="middle" fontSize="33" fontWeight="900" fontFamily={KANJI} fill={c2} stroke={dk(c, 55)} strokeWidth="3" paintOrder="stroke">達</text>
        ) : (
          <g>
            <rect x="82" y="132" width="36" height="17" rx="3" fill={INK} stroke={c2} strokeWidth="2" />
            <path d="M88 140 h24 M88 145 h14" stroke={c2} strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )}
        <Bolt x={100} y={33} r={3.5} />
      </g>
    </g>
  );
}

// ─── Kappa ──────────────────────────────────────────────────────────────────
function Kappa({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const hull = `${uid}-h`;
  return (
    <g>
      <defs>
        <Metal id={hull} c={c} />
      </defs>
      <Shadow rx={60} />
      {mk >= 2 && (
        <g>
          <ellipse cx="100" cy="130" rx="64" ry="48" fill={dk(c, 48)} {...OL} />
          <path d="M64 96 L48 108 L48 146 L64 160 M48 108 L37 102 M48 146 L38 156 M48 127 H36 M136 96 L152 108 L152 146 L136 160 M152 108 L163 102 M152 146 L162 156 M152 127 H164" fill="none" stroke={c2} strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
        </g>
      )}
      {/* air hose */}
      <path d="M140 72 C170 76 168 118 136 122" fill="none" stroke="var(--fg)" strokeWidth="8" strokeLinecap="round" />
      <path d="M140 72 C170 76 168 118 136 122" fill="none" stroke={c2} strokeWidth="4" strokeLinecap="round" strokeDasharray="4 4" />
      {/* flippers and legs */}
      {[-1, 1].map((d) => (
        <g key={d}>
          <path d={`M${100 + d * 18} 150 v20`} stroke="var(--fg)" strokeWidth="14" strokeLinecap="round" />
          <path d={`M${100 + d * 18} 150 v20`} stroke={dk(c, 20)} strokeWidth="8" strokeLinecap="round" />
          <path d={`M${100 + d * 12} 168 L${100 + d * 24} 168 L${100 + d * 58} 180 Q${100 + d * 34} 186 ${100 + d * 8} 181Z`} fill={c2} {...OL} />
          <path d={`M${100 + d * 20} 171 L${100 + d * 28} 182 M${100 + d * 26} 171 L${100 + d * 42} 181`} stroke={dk(c2, 45)} strokeWidth="2" />
        </g>
      ))}
      {/* arms */}
      {[-1, 1].map((d) => {
        const hand: [number, number] = [100 + d * 54, 138];
        return (
          <g key={d}>
            <path d={`M${100 + d * 28} 116 L${hand[0]} ${hand[1]}`} stroke="var(--fg)" strokeWidth="14" strokeLinecap="round" />
            <path d={`M${100 + d * 28} 116 L${hand[0]} ${hand[1]}`} stroke={dk(c, 12)} strokeWidth="8" strokeLinecap="round" />
            {mk < 3 && <circle cx={hand[0]} cy={hand[1]} r="8" fill={c2} {...OL} />}
          </g>
        );
      })}
      {/* torso */}
      <ellipse cx="100" cy="130" rx="36" ry="32" fill={`url(#${hull})`} {...OL} />
      <ellipse cx="100" cy="134" rx="22" ry="20" fill={lt(c2, 35)} stroke={INK} strokeWidth="2" />
      <circle cx="100" cy="134" r="11" fill={PAPER} stroke={INK} strokeWidth="2.5" />
      <path d="M100 134 L106 127" stroke="#d9263c" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M92 138 a11 11 0 0 1 -1 -6 M108 138 a11 11 0 0 0 1 -6" stroke={INK} strokeWidth="1.5" fill="none" />
      {mk >= 2 && <path d="M74 110 L84 150 M126 110 L116 150" stroke={dk(c2, 50)} strokeWidth="5" strokeLinecap="round" />}
      {/* spiky hair, in sheet metal */}
      <path d="M52 62 L44 46 L60 48 L56 30 L72 38 L74 20 L88 30 L100 22 L112 30 L126 20 L128 38 L144 30 L140 48 L156 46 L148 62Z" fill={dk(c, 40)} {...OL} />
      {/* helmet */}
      <path d="M100 30 C130 30 146 50 146 72 C146 92 132 106 100 106 C68 106 54 92 54 72 C54 50 70 30 100 30Z" fill={`url(#${hull})`} {...OL} />
      <rect x="66" y="100" width="68" height="13" rx="6" fill={c2} {...OL} />
      {[76, 100, 124].map((x) => <Bolt key={x} x={x} y={106.5} r={3} />)}
      {/* porthole */}
      <circle cx="100" cy="68" r="31" fill="#d9a441" {...OL} />
      <circle cx="100" cy="68" r="24" fill={lt(c, 28)} stroke="var(--fg)" strokeWidth="2" />
      {[0, 60, 120, 180, 240, 300].map((a) => <circle key={a} cx={100 + 27.5 * Math.cos((a * Math.PI) / 180)} cy={68 + 27.5 * Math.sin((a * Math.PI) / 180)} r="2" fill={INK} />)}
      <Eyes still={still}>
        {happy ? (
          <path d="M82 62 Q90 52 98 62 M102 62 Q110 52 118 62" fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
        ) : (
          <>
            <circle cx="89" cy="58" r="8" fill={INK} />
            <circle cx="111" cy="58" r="8" fill={INK} />
            <circle cx="91" cy="55" r="2.6" fill="#fff" />
            <circle cx="113" cy="55" r="2.6" fill="#fff" />
          </>
        )}
      </Eyes>
      <path d="M78 74 Q100 64 122 74 Q120 90 100 92 Q80 90 78 74Z" fill="#f59e0b" stroke={INK} strokeWidth="2" />
      <path d="M79 77 Q100 83 121 77" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M78 54 Q81 47 90 44" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity=".7" />
      {/* the dish, and the water in it */}
      <ellipse cx="100" cy="26" rx="35" ry="11" fill={PAPER} {...OL} />
      <ellipse cx="100" cy="25" rx="27" ry="7" fill="#4cc2f1" stroke={INK} strokeWidth="1.5" />
      <g className={an(still, 'bcf-slosh')}>
        <path d="M82 24 Q91 19 100 24 T118 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      {/* bubbles from the valve */}
      <g>
        <circle className={an(still, 'bcf-bubble')} cx="172" cy="50" r="5" fill="none" stroke="#4cc2f1" strokeWidth="2.5" />
        <circle className={an(still, 'bcf-bubble')} style={{ animationDelay: '-1s' }} cx="182" cy="32" r="3.5" fill="none" stroke="#4cc2f1" strokeWidth="2.5" />
        <circle className={an(still, 'bcf-bubble')} style={{ animationDelay: '-1.8s' }} cx="166" cy="24" r="2.8" fill="none" stroke="#4cc2f1" strokeWidth="2" />
      </g>
      {mk === 3 && (
        <g>
          {/* webbed hands */}
          {[-1, 1].map((d) => (
            <g key={d}>
              <path d={`M${100 + d * 48} 132 L${100 + d * 76} 124 Q${100 + d * 74} 134 ${100 + d * 80} 142 Q${100 + d * 70} 146 ${100 + d * 70} 158 Q${100 + d * 58} 152 ${100 + d * 48} 146Z`} fill={c2} {...OL} />
              <path d={`M${100 + d * 52} 139 L${100 + d * 72} 129 M${100 + d * 52} 140 L${100 + d * 75} 141 M${100 + d * 52} 142 L${100 + d * 68} 152`} stroke={dk(c2, 45)} strokeWidth="2" strokeLinecap="round" />
            </g>
          ))}
          {/* cucumber torpedo */}
          <g transform="rotate(-62 164 112)">
            <path d="M136 112 l-11 -10 v20z" fill={dk(c, 20)} {...TH} />
            <rect x="130" y="97" width="72" height="30" rx="15" fill="#4e9d3d" {...OL} />
            <path d="M140 105 h44 M136 112 h52 M140 119 h44" stroke="#2c6a22" strokeWidth="2.5" strokeDasharray="10 5" strokeLinecap="round" />
            <ellipse cx="197" cy="112" rx="7" ry="14" fill="#d8f0b4" {...TH} />
            <path d="M197 104 v3 M197 112 v.1 M197 117 v3 M194 110 v.1 M200 114 v.1" stroke="#4e9d3d" strokeWidth="2" strokeLinecap="round" />
            <rect x="152" y="96" width="9" height="32" fill={c2} {...TH} />
          </g>
        </g>
      )}
    </g>
  );
}

// ─── Maneki ─────────────────────────────────────────────────────────────────
function Maneki({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const fur = `${uid}-f`;
  const shade = dk(c, 30);
  return (
    <g>
      <defs>
        <radialGradient id={fur} cx=".4" cy=".3" r=".85">
          <stop offset="0" stopColor={c} />
          <stop offset=".5" stopColor={c} />
          <stop offset="1" stopColor={shade} />
        </radialGradient>
      </defs>
      <Shadow rx={60} />
      {/* the tail is the mains lead */}
      <path d="M134 164 C160 182 170 150 184 168" fill="none" stroke="var(--fg)" strokeWidth="5" strokeLinecap="round" />
      <g transform="rotate(50 184 168)">
        <rect x="178" y="160" width="14" height="13" rx="3" fill={c2} {...TH} />
        <path d="M181 160 v-6 M189 160 v-6" stroke="var(--fg)" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      {mk === 3 && (
        <g>
          <ellipse cx="34" cy="178" rx="20" ry="6" fill={GOLD} {...TH} />
          <ellipse cx="36" cy="172" rx="20" ry="6" fill={GOLD} {...TH} />
          <ellipse cx="32" cy="166" rx="19" ry="6" fill={GOLD} {...TH} />
        </g>
      )}
      {/* body */}
      <ellipse cx="100" cy="132" rx="44" ry="46" fill={`url(#${fur})`} {...OL} />
      <path d="M62 104 Q100 124 138 104 L134 118 Q100 134 66 118Z" fill={shade} opacity=".6" />
      <path d="M142 146 Q128 134 130 158 Q136 170 138 164Z" fill={INK} />
      {/* the till */}
      <rect x="72" y="127" width="56" height="25" rx="4" fill={INK} stroke={mk === 3 ? GOLD : shade} strokeWidth="3" />
      <text x="100" y="145.5" textAnchor="middle" fontSize="19" fontWeight="800" fontFamily="ui-monospace, Consolas, monospace" fill={c2} letterSpacing="-.5">¥888</text>
      <rect x="84" y="154" width="32" height="4" rx="2" fill={INK} />
      <path d="M88 156 h24 v17 l-4 3 l-4 -3 l-4 3 l-4 -3 l-4 3 l-4 -3z" fill="#fff" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M92 161 h16 M92 166 h10" stroke={INK} strokeWidth="1.8" />
      {[-1, 1].map((d) => (
        <g key={d}>
          <ellipse cx={100 + d * 28} cy="173" rx="17" ry="9" fill={c} {...OL} />
          <path d={`M${100 + d * 22} 170 v5 M${100 + d * 29} 169 v6 M${100 + d * 36} 170 v5`} stroke={INK} strokeWidth="2" strokeLinecap="round" />
        </g>
      ))}
      {/* resting arm or koban arm */}
      {mk < 3 ? (
        <g>
          <path d="M62 112 L60 138" stroke="var(--fg)" strokeWidth="19" strokeLinecap="round" />
          <path d="M62 112 L60 138" stroke={c} strokeWidth="12.5" strokeLinecap="round" />
        </g>
      ) : (
        <g>
          <ellipse cx="42" cy="124" rx="28" ry="38" fill={GOLD} {...OL} transform="rotate(-8 42 124)" />
          <ellipse cx="42" cy="124" rx="21" ry="30" fill="none" stroke={dk(GOLD, 40)} strokeWidth="2" transform="rotate(-8 42 124)" />
          <path d="M28 100 l27 -4 M26 112 l32 -4 M28 138 l30 -4 M31 150 l23 -3" stroke={dk(GOLD, 40)} strokeWidth="2" />
          <text x="43" y="132" textAnchor="middle" fontSize="20" fontWeight="900" fontFamily={KANJI} fill={dk(GOLD, 62)} transform="rotate(-8 42 124)">壱</text>
          <path d="M28 88 l4 -9 l4 9 l9 4 l-9 4 l-4 9 l-4 -9 l-9 -4z" fill={GOLD} stroke="var(--fg)" strokeWidth="1.5" strokeLinejoin="round" transform="translate(-10 -6) scale(.8)" />
          <path d="M70 112 L60 150" stroke="var(--fg)" strokeWidth="19" strokeLinecap="round" />
          <path d="M70 112 L60 150" stroke={c} strokeWidth="12.5" strokeLinecap="round" />
        </g>
      )}
      {/* beckoning arm */}
      <g className={an(still, 'bcf-beckon')} style={origin(142, 112)}>
        <path d="M142 112 L158 60" stroke="var(--fg)" strokeWidth="21" strokeLinecap="round" />
        <path d="M142 112 L158 60" stroke={c} strokeWidth="14.5" strokeLinecap="round" />
        <path d="M144 88 l14 4 M147 80 l14 4" stroke={shade} strokeWidth="2.5" />
        <circle cx="160" cy="50" r="17" fill={c} {...OL} />
        <ellipse cx="160" cy="55" rx="7" ry="5.5" fill={c2} />
        <circle cx="151" cy="44" r="3" fill={c2} />
        <circle cx="160" cy="41" r="3" fill={c2} />
        <circle cx="169" cy="44" r="3" fill={c2} />
      </g>
      <circle cx="142" cy="112" r="6" fill="var(--surf-2)" stroke="var(--fg)" strokeWidth="2.5" />
      {/* whisker wires */}
      <path d="M56 70 L32 64 M56 80 L30 84" stroke="var(--fg)" strokeWidth="2.5" strokeLinecap="round" />
      <Bolt x={30} y={63} r={2.5} />
      <Bolt x={28} y={85} r={2.5} />
      {/* head */}
      <path d="M58 56 L56 14 L90 32 Q100 30 110 32 L144 14 L142 56 C150 72 146 96 120 102 Q100 106 80 102 C54 96 50 72 58 56Z" fill={`url(#${fur})`} {...OL} />
      <path d="M63 44 L62 24 L80 34Z" fill={c2} stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M137 44 L138 24 L120 34Z" fill={INK} />
      <path d="M90 32 Q72 34 64 50 Q60 64 70 62 Q78 44 96 42Z" fill={c2} opacity=".9" />
      <rect x="90" y="36" width="20" height="5" rx="2.5" fill={INK} stroke={GOLD} strokeWidth="1.5" />
      <Eyes still={still}>
        {happy ? (
          <path d="M70 72 Q82 56 94 72 M106 72 Q118 56 130 72" fill="none" stroke={INK} strokeWidth="5.5" strokeLinecap="round" />
        ) : (
          <>
            <ellipse cx="82" cy="67" rx="12" ry="14" fill={INK} />
            <ellipse cx="118" cy="67" rx="12" ry="14" fill={INK} />
            <ellipse cx="82" cy="67" rx="3.5" ry="10" fill={GOLD} />
            <ellipse cx="118" cy="67" rx="3.5" ry="10" fill={GOLD} />
          </>
        )}
      </Eyes>
      <path d="M95 80 h10 l-5 6z" fill={c2} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M88 89 Q94 95 100 88 Q106 95 112 89" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
      {mk >= 2 && (
        <g>
          <path d="M66 100 Q100 116 134 100 L136 110 Q100 128 64 110Z" fill={c2} {...OL} />
          <circle cx="100" cy="116" r="11" fill={GOLD} {...OL} />
          <path d="M90 114 h20" stroke={dk(GOLD, 50)} strokeWidth="2" />
          <circle cx="100" cy="120" r="2.4" fill={INK} />
          <circle cx="96" cy="110.5" r="2.2" fill="#fff" opacity=".8" />
        </g>
      )}
    </g>
  );
}

// ─── Kasa-obake ─────────────────────────────────────────────────────────────
function Kasa({ c, c2, still, happy, mk }: BotArtProps) {
  const pts: [number, number][] = [[30, 126], [58, 136], [86, 141], [114, 141], [142, 136], [170, 126]];
  const ctrl = (p: [number, number]) => `${100 + (p[0] - 100) * 0.86} 62`;
  const panel = (i: number) => {
    const a = pts[i];
    const b = pts[i + 1];
    const hem =
      mk >= 2 && i === 0
        ? `L38 106 L44 124 L50 112 L${b[0]} ${b[1]}`
        : mk >= 2 && i === 4
          ? `L150 114 L156 130 L162 108 L${b[0]} ${b[1]}`
          : `Q${(a[0] + b[0]) / 2} ${(a[1] + b[1]) / 2 - 11} ${b[0]} ${b[1]}`;
    return `M100 24 Q${ctrl(a)} ${a[0]} ${a[1]} ${hem} Q${ctrl(b)} 100 24Z`;
  };
  const Cloud = ({ x, y, s, d }: { x: number; y: number; s: number; d: string }) => (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g className={an(still, 'bcf-bob')} style={{ animationDelay: d }}>
        <g className={an(still, 'bcf-rain')} style={{ animationDelay: d }}>
          <path d="M-8 12 l-2 8 M2 12 l-2 8 M12 12 l-2 8" stroke="#4cc2f1" strokeWidth="3" strokeLinecap="round" />
        </g>
        <path d="M-15 9 a8 8 0 0 1 0 -15 a11 11 0 0 1 20 -4 a9 9 0 0 1 11 9 a6 6 0 0 1 -2 10z" fill="var(--surf-2)" {...OL} />
        <circle cx="-5" cy="1" r="1.8" fill="var(--fg)" />
        <circle cx="5" cy="1" r="1.8" fill="var(--fg)" />
        <path d="M-3 6 Q0 3 3 6" fill="none" stroke="var(--fg)" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </g>
  );
  return (
    <g>
      <Shadow rx={mk >= 2 ? 34 : 24} />
      {mk === 3 && (
        <g>
          <path d="M26 62 l-8 13 h7 l-4 13 l13 -17 h-7 l5 -9z" fill={GOLD} {...TH} />
          <Cloud x={28} y={42} s={1.15} d="0s" />
          <Cloud x={176} y={32} s={0.95} d="-1s" />
          <Cloud x={20} y={150} s={0.8} d="-2s" />
          <Cloud x={178} y={152} s={0.65} d="-1.5s" />
        </g>
      )}
      <g className={an(still, 'bcf-hop')}>
        {/* leg */}
        <rect x="95" y="134" width="10" height="22" fill="var(--surf-2)" {...TH} />
        <path d={mk >= 2 ? 'M92 150 L108 153 L92 157 L108 160 L92 163' : 'M92 152 L108 155 L92 159 L108 162 L92 166 L108 169'} fill="none" stroke="var(--fg)" strokeWidth="3" strokeLinejoin="round" />
        {mk >= 2 ? (
          <g>
            <rect x="82" y="172" width="11" height="10" fill={dk(c, 40)} {...TH} />
            <rect x="107" y="172" width="11" height="10" fill={dk(c, 40)} {...TH} />
            <rect x="70" y="165" width="60" height="8" rx="3" fill={c2} {...OL} />
            <path d="M100 165 L100 160 M90 167 Q100 154 110 167" fill="none" stroke="#e63946" strokeWidth="3.5" strokeLinecap="round" />
          </g>
        ) : (
          <rect x="84" y="170" width="32" height="11" rx="5.5" fill={c2} {...OL} />
        )}
        {/* canopy */}
        {mk >= 2 && (
          <g>
            <path d="M38 106 L18 146" stroke="var(--fg)" strokeWidth="4" strokeLinecap="round" />
            <circle cx="18" cy="147" r="4.5" fill={c2} {...TH} />
            <path d="M162 108 L184 146" stroke="var(--fg)" strokeWidth="4" strokeLinecap="round" />
            <circle cx="184" cy="147" r="4.5" fill={c2} {...TH} />
          </g>
        )}
        {[0, 1, 2, 3, 4].map((i) => (
          <path key={i} d={panel(i)} fill={i % 2 ? dk(c, 24) : c} {...OL} />
        ))}
        {mk < 2 ? [pts[0], pts[5]].map((p) => <circle key={p[0]} cx={p[0]} cy={p[1]} r="5" fill={c2} {...TH} />) : null}
        {pts.slice(1, 5).map((p) => <circle key={p[0]} cx={p[0]} cy={p[1]} r="4" fill={c2} {...TH} />)}
        {mk >= 2 && (
          <g>
            <rect x="130" y="48" width="20" height="17" rx="2" transform="rotate(14 140 56)" fill={lt(c, 40)} {...TH} />
            <path d="M128 52 h6 M128 58 h6 M146 56 h6 M146 62 h6" stroke="var(--fg)" strokeWidth="1.8" strokeLinecap="round" />
          </g>
        )}
        {/* ferrule and tie */}
        <path d="M86 42 Q100 34 114 42 L110 34 Q100 28 90 34Z" fill={c2} {...TH} />
        <path d="M96 30 L100 8 L104 30Z" fill={mk === 3 ? GOLD : 'var(--surf-2)'} {...OL} />
        {mk === 3 && <circle cx="100" cy="8" r="4.5" fill={GOLD} {...TH} />}
        {/* lens */}
        <Eyes still={still}>
          {happy ? (
            <path d="M74 82 Q100 50 126 82 Q100 68 74 82Z" fill={PAPER} {...OL} />
          ) : (
            <>
              <circle cx="100" cy="74" r="24" fill={PAPER} {...OL} />
              <circle cx="100" cy="74" r="14" fill={INK} />
              <circle cx="100" cy="74" r="7" fill={c2} />
              <circle cx="105" cy="69" r="3" fill="#fff" />
            </>
          )}
        </Eyes>
        {/* mouth and tongue */}
        <path d="M66 105 Q100 118 134 105 Q130 130 100 132 Q70 130 66 105Z" fill={INK} stroke="var(--fg)" strokeWidth="3" strokeLinejoin="round" />
        <path d="M74 109 l5 8 l5 -6 l5 7 l5 -6 l6 7 l6 -7 l5 6 l5 -7 l5 6 l5 -8" fill={PAPER} stroke={INK} strokeWidth="1" strokeLinejoin="round" />
        <g className={an(still, 'bcf-flap')} style={origin(118, 124)}>
          <path d="M110 120 Q106 146 114 158 Q124 172 134 158 Q142 142 136 116Z" fill="#ff5d7e" {...OL} />
          <path d="M123 121 V132 M124 150 V158" fill="none" stroke="#b32a4b" strokeWidth="2.5" strokeLinecap="round" />
          <g transform="rotate(-8 124 141)">
            <rect x="107" y="134" width="33" height="14" rx="1.5" fill="#fff" stroke={INK} strokeWidth="1.5" />
            <text x="123.5" y="145" textAnchor="middle" fontSize="10.5" fontWeight="900" fontFamily="system-ui, sans-serif" fill="#d9263c">VOID</text>
          </g>
        </g>
      </g>
    </g>
  );
}

// ─── Chōchin ────────────────────────────────────────────────────────────────
function Chochin({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const paper = `${uid}-p`;
  const lit = `${uid}-l`;
  const halo = `${uid}-g`;
  const ribs = [44, 56, 68, 80, 92, 104, 116, 128, 140, 152];
  const hw = (y: number) => 64 * Math.sqrt(Math.max(0, 1 - ((y - 98) / 68) ** 2));
  const flame = 'M0 -16 C8 -6 12 0 8 8 C5 14 -5 14 -8 8 C-12 0 -4 -4 0 -16Z';
  return (
    <g>
      <defs>
        <radialGradient id={paper} cx=".5" cy=".62" r=".62">
          <stop offset="0" stopColor={lt(c2, 45)} />
          <stop offset=".5" stopColor={c2} />
          <stop offset="1" stopColor={c} />
        </radialGradient>
        <radialGradient id={lit}>
          <stop offset="0" stopColor="#fff" />
          <stop offset=".55" stopColor={lt(c2, 40)} />
          <stop offset="1" stopColor={c} />
        </radialGradient>
        <radialGradient id={halo}>
          <stop offset=".45" stopColor={c2} stopOpacity=".5" />
          <stop offset="1" stopColor={c2} stopOpacity="0" />
        </radialGradient>
      </defs>
      <Shadow rx={40} />
      <circle cx="100" cy="98" r="98" fill={`url(#${halo})`} className={an(still, 'bcf-flicker')} />
      {mk === 3 && (
        <g className={an(still, 'i-spin i-spin--slow')}>
          <circle cx="100" cy="98" r="94" fill="none" />
          {[0, 90, 180, 270].map((a) => (
            <g key={a} transform={`rotate(${a + 45} 100 98) translate(100 12) rotate(-90) scale(1.28)`}>
              <path d={flame} transform="scale(1.25)" fill={lt(c2, 20)} stroke="var(--fg)" strokeWidth="2" strokeLinejoin="round" />
              <ellipse cx="0" cy="5" rx="5" ry="6" fill="#fff" />
              <circle cx="-2.5" cy="4" r="1.3" fill={INK} />
              <circle cx="2.5" cy="4" r="1.3" fill={INK} />
            </g>
          ))}
        </g>
      )}
      {/* tiny feet */}
      {[-1, 1].map((d) => (
        <g key={d}>
          <path d={`M${100 + d * 18} 164 v12`} stroke="var(--fg)" strokeWidth="5" />
          <rect x={100 + d * 18 - 10} y="174" width="20" height="8" rx="4" fill={dk(c, 55)} {...TH} />
        </g>
      ))}
      <g className={an(still, 'bcf-sway')}>
        {mk >= 2 && [-1, 1].map((d) => (
          <g key={d}>
            <path d={`M${100 + d * 42} 148 Q${100 + d * 56} 148 ${100 + d * 56} 154`} fill="none" stroke="var(--fg)" strokeWidth="3" />
            <circle cx={100 + d * 56} cy="157" r="5" fill={GOLD} {...TH} />
            <path d={`M${100 + d * 50} 161 h${d * 12} l${d * 3} 22 h${d * -18}z`} fill={c2} {...OL} />
            <path d={`M${100 + d * 53} 166 l${-d * 1} 15 M${100 + d * 56} 166 v15 M${100 + d * 59} 166 l${d} 15`} stroke={dk(c, 45)} strokeWidth="1.5" />
          </g>
        ))}
        {/* wick or hanging ring */}
        {mk >= 2 ? (
          <g>
            <path d="M100 32 v-12" stroke="var(--fg)" strokeWidth="4" strokeLinecap="round" />
            <g className={an(still, 'bcf-flame')}>
              <path d="M100 -6 C110 6 114 10 110 18 C106 24 94 24 90 18 C86 10 94 6 100 -6Z" fill={c} {...TH} />
              <path d="M100 6 C105 12 106 15 104 18 C102 21 98 21 96 18 C94 15 96 12 100 6Z" fill={lt(c2, 40)} />
            </g>
          </g>
        ) : (
          <circle cx="100" cy="21" r="9" fill="none" stroke="var(--fg)" strokeWidth="4" />
        )}
        {/* paper */}
        <ellipse cx="100" cy="98" rx="64" ry="68" fill={`url(#${paper})`} {...OL} />
        {ribs.map((y) => (
          <path key={y} d={`M${100 - hw(y)} ${y} Q100 ${y + 8} ${100 + hw(y)} ${y}`} fill="none" stroke={dk(c, 42)} strokeWidth="2.5" />
        ))}
        {/* brass caps */}
        <rect x="68" y="28" width="64" height="13" rx="4" fill={dk(c, 55)} {...OL} />
        <rect x="70" y="155" width="60" height="13" rx="4" fill={dk(c, 55)} {...OL} />
        {[80, 100, 120].map((x) => (
          <g key={x}>
            <Bolt x={x} y={34.5} r={2.6} />
            <Bolt x={x} y={161.5} r={2.6} />
          </g>
        ))}
        {/* the split */}
        <path d="M38 96 L50 110 L60 104 L70 116 L82 108 L92 118 L104 108 L116 118 L128 106 L138 114 L148 102 L162 92 C164 122 146 152 100 152 C56 152 38 124 38 96Z" fill={`url(#${lit})`} {...OL} />
        <g className={an(still, 'bcf-flicker')}>
          <path d="M100 118 v12" stroke={INK} strokeWidth="2.5" />
          <circle cx="100" cy="136" r="9" fill="#fff" stroke={INK} strokeWidth="2.5" />
          <path d="M95 138 q2.5 -5 5 0 t5 0" fill="none" stroke="#d9263c" strokeWidth="2" />
        </g>
        {/* lit-through eyes */}
        <Eyes still={still}>
          {happy ? (
            <path d="M58 82 Q74 58 90 82 M112 76 Q126 56 140 76" fill="none" stroke={INK} strokeWidth="7" strokeLinecap="round" />
          ) : (
            <>
              <ellipse cx="74" cy="72" rx="17" ry="19" fill="#fff" stroke={INK} strokeWidth="3.5" />
              <circle cx="78" cy="74" r="8" fill={INK} />
              <ellipse cx="127" cy="68" rx="12" ry="13" fill="#fff" stroke={INK} strokeWidth="3.5" />
              <circle cx="124" cy="70" r="5.5" fill={INK} />
            </>
          )}
        </Eyes>
      </g>
    </g>
  );
}

// ─── Karakuri ───────────────────────────────────────────────────────────────
function Karakuri({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const robe = `${uid}-r`;
  const brass = '#d9a441';
  return (
    <g>
      <defs>
        <Metal id={robe} c={c} />
      </defs>
      <Shadow rx={60} />
      {/* escapement behind the head */}
      {mk === 3 && (
        <g className={an(still, 'i-spin i-spin--slow')}>
          <polygon points={gear(100, 58, 62, 18, 12, true)} fill={brass} {...OL} />
          <circle cx="100" cy="58" r="42" fill="none" stroke={dk(brass, 45)} strokeWidth="3" />
          {[0, 60, 120].map((a) => <path key={a} d="M100 8 V108" stroke={dk(brass, 45)} strokeWidth="5" transform={`rotate(${a} 100 58)`} />)}
        </g>
      )}
      {/* wheels */}
      {[64, 136].map((x) => (
        <g key={x}>
          <circle cx={x} cy="172" r="10" fill="var(--surf-2)" {...OL} />
          <path d={`M${x - 6} 172 h12 M${x} 166 v12`} stroke="var(--fg)" strokeWidth="2" />
        </g>
      ))}
      {/* wind-up key */}
      <path d="M150 140 h16" stroke="var(--fg)" strokeWidth="5" />
      <path d="M166 140 l6 -12 a7 7 0 0 1 8 8 l-6 4 l6 4 a7 7 0 0 1 -8 8z" fill={brass} {...TH} />
      {/* robe */}
      <path d="M74 92 L126 92 L158 170 Q100 182 42 170Z" fill={`url(#${robe})`} {...OL} />
      {[[60, 152], [140, 152], [72, 128], [128, 128]].map(([x, y]) => (
        <path key={x} d={`M${x} ${y - 6} l6 6 l-6 6 l-6 -6z`} fill={c2} />
      ))}
      {/* the panel that came off */}
      <path d="M78 122 h44 l5 46 q-27 6 -54 0z" fill={INK} stroke="var(--fg)" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M78 122 L54 134 L50 166 L73 168Z" fill={c2} {...TH} />
      <circle cx="74" cy="128" r="2" fill="var(--fg)" />
      <circle cx="73" cy="160" r="2" fill="var(--fg)" />
      {mk === 1 ? (
        <path d="M100 146 m0 0 a4 4 0 0 1 4 4 a8 8 0 0 1 -12 -2 a12 12 0 0 1 17 -7 a16 16 0 0 1 4 22" fill="none" stroke={brass} strokeWidth="3" strokeLinecap="round" />
      ) : (
        <g>
          <g className={an(still, 'i-spin i-spin--slow')} style={{ animationDuration: '5s' }}>
            <polygon points={gear(90, 150, 15, 10, 4)} fill={brass} stroke={INK} strokeWidth="1.5" />
            <circle cx="90" cy="150" r="4" fill={INK} />
          </g>
          <g className={an(still, 'bcf-gear-r')}>
            <polygon points={gear(112, 140, 11, 8, 3.5)} fill={lt(brass, 25)} stroke={INK} strokeWidth="1.5" />
            <circle cx="112" cy="140" r="3" fill={INK} />
          </g>
          <g className={an(still, 'bcf-gear-r')} style={{ animationDuration: '3s' }}>
            <polygon points={gear(113, 160, 8, 7, 3)} fill={brass} stroke={INK} strokeWidth="1.5" />
          </g>
        </g>
      )}
      {/* obi */}
      <rect x="66" y="104" width="68" height="17" rx="3" fill={c2} {...OL} />
      <rect x="92" y="101" width="16" height="23" rx="3" fill={brass} {...TH} />
      {/* sleeves */}
      {mk < 3 ? (
        [-1, 1].map((d) => (
          <path key={d} d={`M${100 + d * 26} 94 L${100 + d * 54} 118 L${100 + d * 54} 146 L${100 + d * 32} 136 Z`} fill={dk(c, 14)} {...OL} />
        ))
      ) : (
        <g>
          {[-1, 1].map((d) => (
            <path key={d} d={`M${100 + d * 26} 94 L${100 + d * 58} 112 L${100 + d * 56} 134 L${100 + d * 34} 124 Z`} fill={dk(c, 14)} {...OL} />
          ))}
          <g>
            <g className={an(still, 'bcf-steam')}>
              <path d="M92 108 q-5 -5 0 -10 M108 108 q5 -5 0 -10" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
            </g>
            <path d="M80 110 h40 q0 20 -11 22 h-18 q-11 -2 -11 -22z" fill={dk(c, 45)} {...OL} />
            <ellipse cx="100" cy="111" rx="20" ry="3.5" fill={lt(c2, 20)} {...TH} />
            <rect x="50" y="130" width="100" height="9" rx="3" fill={dk(c, 55)} {...OL} />
            <path d="M58 134.5 h84" stroke={GOLD} strokeWidth="1.5" />
          </g>
        </g>
      )}
      {/* collar */}
      <path d="M82 92 L100 112 L118 92Z" fill={PAPER} {...TH} />
      <path d="M88 92 L100 106 L112 92" fill="none" stroke="#d9263c" strokeWidth="3" />
      {/* head */}
      <g className={an(still, 'bcf-nod')}>
        <circle cx="100" cy="17" r="11" fill={INK} {...OL} />
        <path d="M86 26 Q100 32 114 26" fill="none" stroke={c2} strokeWidth="4" strokeLinecap="round" />
        <path d="M56 62 C52 10 148 10 144 62 C146 78 146 90 136 96 Q100 102 64 96 C54 90 54 78 56 62Z" fill={INK} {...OL} />
        <ellipse cx="100" cy="68" rx="32" ry="31" fill={PAPER} stroke={INK} strokeWidth="2" />
        <path d="M66 62 Q100 46 134 62 L134 48 Q100 26 66 48Z" fill={INK} />
        <Eyes still={still}>
          {happy ? (
            <path d="M78 70 Q86 62 94 70 M106 70 Q114 62 122 70" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
          ) : (
            <>
              <ellipse cx="86" cy="68" rx="6.5" ry="8" fill={INK} />
              <ellipse cx="114" cy="68" rx="6.5" ry="8" fill={INK} />
              <circle cx="88.5" cy="65" r="2" fill="#fff" />
              <circle cx="116.5" cy="65" r="2" fill="#fff" />
            </>
          )}
        </Eyes>
        <path d="M80 58 q6 -3 12 0 M108 58 q6 -3 12 0" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="77" cy="79" r="5" fill={c} opacity=".55" />
        <circle cx="123" cy="79" r="5" fill={c} opacity=".55" />
        {/* ventriloquist's jaw */}
        <path d="M90 80 v14 M110 80 v14" stroke={INK} strokeWidth="1.5" />
        <circle cx="100" cy="82" r="3.2" fill="#d9263c" />
        <Bolt x={68} y={74} r={3} />
        <Bolt x={132} y={74} r={3} />
      </g>
    </g>
  );
}

// ─── Koi ────────────────────────────────────────────────────────────────────
function Koi({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const clip = `${uid}-c`;
  const BODY = 'M30 94 C34 72 58 58 88 56 C120 54 146 70 162 96 C146 124 118 140 86 140 C58 140 34 118 30 94Z';
  const belly = lt(c2, 65);
  return (
    <g>
      <defs>
        <clipPath id={clip}>
          <path d={BODY} />
        </clipPath>
        <linearGradient id={`${uid}-w`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4cc2f1" stopOpacity=".5" />
          <stop offset=".75" stopColor="#4cc2f1" stopOpacity=".24" />
          <stop offset="1" stopColor="#fff" stopOpacity=".55" />
        </linearGradient>
      </defs>
      <Shadow rx={46} />
      {mk === 3 && (
        <g>
          <path d="M58 -2 H142 Q136 60 146 120 Q150 150 158 182 H42 Q50 150 54 120 Q64 60 58 -2Z" fill={`url(#${uid}-w)`} stroke="#4cc2f1" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M74 2 V40 M92 6 V26 M112 2 V30 M128 8 V44 M66 150 V176 M134 146 V172 M100 150 V178" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".75" />
          {[[34, 176, 7], [52, 180, 5], [150, 178, 6], [168, 174, 7.5], [184, 160, 4], [18, 162, 4], [150, 34, 6], [168, 16, 4.5], [46, 6, 4], [186, 34, 3]].map(([x, y, r], i) => (
            <circle key={i} className={an(still, 'bcf-rise')} style={{ animationDelay: `${-i * 0.45}s` }} cx={x} cy={y} r={r} fill="#4cc2f1" fillOpacity=".3" stroke="#4cc2f1" strokeWidth="2.5" />
          ))}
        </g>
      )}
      {/* stubby sea-legs */}
      {[76, 118].map((x) => (
        <g key={x}>
          <path d={`M${x} 130 V168`} stroke="var(--fg)" strokeWidth="13" />
          <path d={`M${x} 130 V168`} stroke="var(--surf-2)" strokeWidth="7" />
          <path d={`M${x - 3} 148 h6 M${x - 3} 156 h6`} stroke="var(--fg)" strokeWidth="2" />
          <path d={`M${x - 16} 182 Q${x - 18} 168 ${x - 4} 166 L${x + 8} 166 L${x + 10} 182Z`} fill={c2} {...OL} />
        </g>
      ))}
      {/* tail */}
      <g className={an(still, 'bcf-tail')}>
        <path d="M154 90 C168 66 182 50 196 44 C196 66 192 84 178 96 C192 108 196 128 196 150 C182 142 168 124 154 102Z" fill={c} {...OL} />
        <path d="M162 92 L186 58 M168 94 L190 74 M162 100 L186 136 M168 98 L190 120" stroke={dk(c, 40)} strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <g transform="translate(172 96)">
        <g className={an(still, 'i-spin')}>
          <ellipse rx="5" ry="16" fill={PAPER} {...TH} />
        </g>
        <circle r="3.5" fill="var(--surf-2)" {...TH} />
      </g>
      {mk >= 2 && (
        <g>
          {/* dorsal */}
          <path d="M72 62 C78 40 96 30 120 36 L132 66Z" fill={c} {...OL} />
          <path d="M86 58 L92 40 M100 56 L106 36 M114 58 L118 40" stroke={dk(c, 40)} strokeWidth="2.5" strokeLinecap="round" />
          {/* periscope */}
          <path d="M134 68 V24 H122" fill="none" stroke="var(--fg)" strokeWidth="11" strokeLinejoin="round" />
          <path d="M134 68 V24 H122" fill="none" stroke="var(--surf-2)" strokeWidth="5.5" strokeLinejoin="round" />
          <rect x="108" y="15" width="16" height="18" rx="3" fill={c2} {...OL} />
          <rect x="105" y="19" width="5" height="10" rx="1.5" fill={INK} stroke="var(--fg)" strokeWidth="1.5" />
        </g>
      )}
      {/* hull */}
      <path d={BODY} fill={belly} {...OL} />
      <g clipPath={`url(#${clip})`}>
        <path d="M24 60 H70 C84 70 78 86 62 80 C50 76 40 82 30 80Z" fill={c} />
        <path d="M84 50 H136 L150 74 C132 66 124 82 108 78 C92 76 80 68 84 50Z" fill={c} />
        <path d="M100 116 C114 104 138 108 150 112 L132 150 H90Z" fill={c} />
        <path d="M30 118 Q90 150 150 118 V150 H30Z" fill={c2} opacity=".5" />
      </g>
      {/* gill seam and rivets */}
      <path d="M78 57 Q64 96 82 139" fill="none" stroke={dk(c, 40)} strokeWidth="3" />
      {[[77, 72], [73, 96], [77, 120]].map(([x, y]) => <Bolt key={y} x={x} y={y} r={2.4} />)}
      {/* portholes */}
      {[[98, 96, 12], [124, 96, 10], [145, 96, 7]].map(([x, y, r]) => (
        <g key={x}>
          <circle cx={x} cy={y} r={r + 3} fill={GOLD} {...TH} />
          <circle cx={x} cy={y} r={r} fill={INK} />
          <path d={`M${x - r * 0.5} ${y - r * 0.2} A${r * 0.6} ${r * 0.6} 0 0 1 ${x + r * 0.1} ${y - r * 0.55}`} fill="none" stroke="#7fdcff" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      ))}
      {/* pectoral fin */}
      <path d={mk >= 2 ? 'M72 110 C88 108 110 124 112 150 C94 148 72 140 66 122Z' : 'M72 112 C84 112 94 122 96 136 C84 134 70 128 68 120Z'} fill={c2} {...OL} />
      <path d="M78 118 L96 136 M73 122 L88 138" stroke={dk(c2, 40)} strokeWidth="2" strokeLinecap="round" />
      {/* face */}
      <Eyes still={still}>
        {happy ? (
          <path d="M42 90 Q54 74 66 90" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
        ) : (
          <>
            <circle cx="54" cy="86" r="14" fill={PAPER} stroke={INK} strokeWidth="3" />
            <circle cx="50" cy="86" r="7.5" fill={INK} />
            <circle cx="48" cy="83" r="2.5" fill="#fff" />
          </>
        )}
      </Eyes>
      {/* the pout */}
      <ellipse cx="28" cy="98" rx="10" ry="14" fill={c} {...OL} />
      <ellipse cx="26" cy="98" rx="4.5" ry="8" fill={INK} />
      {mk < 3 ? (
        <path d="M34 112 q-4 10 -12 12" fill="none" stroke="var(--fg)" strokeWidth="3.5" strokeLinecap="round" />
      ) : (
        <g>
          {['M26 110 C4 122 2 150 22 154 C38 156 36 136 26 140', 'M30 72 C14 56 8 26 30 22 C46 20 46 42 34 38'].map((d) => (
            <g key={d}>
              <path d={d} fill="none" stroke="var(--fg)" strokeWidth="9" strokeLinecap="round" />
              <path d={d} fill="none" stroke={GOLD} strokeWidth="4.5" strokeLinecap="round" />
            </g>
          ))}
        </g>
      )}
    </g>
  );
}

// ─── Tengu ──────────────────────────────────────────────────────────────────
function Tengu({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const armour = `${uid}-a`;
  const burn = `${uid}-b`;
  const feather = (L: number, w = 10) => `M0 0 C${w} ${-L * 0.3} ${w} ${-L * 0.72} 0 ${-L} C${-w} ${-L * 0.72} ${-w} ${-L * 0.3} 0 0Z`;
  return (
    <g>
      <defs>
        <Metal id={armour} c={c} />
        <linearGradient id={burn} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".35" stopColor={GOLD} />
          <stop offset="1" stopColor="#ff6a1a" />
        </linearGradient>
      </defs>
      <Shadow rx={mk === 3 ? 72 : 50} />
      {mk === 3 &&
        [-1, 1].map((d) => (
          <g key={d} transform={`translate(${100 + d * 34} 108) scale(${d} 1)`}>
            {[[112, 60], [90, 74], [68, 86], [46, 92], [24, 86]].map(([deg, L], i) => (
              <g key={i} transform={`rotate(${deg})`}>
                <path d={feather(L, 15)} fill={i % 2 ? dk(c, 30) : c} {...TH} strokeWidth="2.5" />
                <path d={`M0 ${-L * 0.45} V${-L + 10}`} stroke={c2} strokeWidth="4" strokeLinecap="round" />
              </g>
            ))}
          </g>
        ))}
      {/* jet engines with feather intakes */}
      {[-1, 1].map((d) => {
        const x = 100 + d * 48;
        return (
          <g key={d}>
            <g className={an(still, 'bcf-jet')} style={{ animationDelay: d < 0 ? '0s' : '-.14s' }}>
              <path d={mk === 3 ? `M${x - 13} 146 Q${x - 8} 176 ${x} 196 Q${x + 8} 176 ${x + 13} 146Z` : `M${x - 10} 146 Q${x - 6} 164 ${x} 174 Q${x + 6} 164 ${x + 10} 146Z`} fill={`url(#${burn})`} stroke="var(--fg)" strokeWidth="2" strokeLinejoin="round" />
              {mk === 3 && <path d={`M${x} 150 l5 7 l-5 7 l-5 -7z M${x} 166 l3.5 5 l-3.5 5 l-3.5 -5z`} fill="#fff" />}
            </g>
            {[-24, 0, 24].map((a) => (
              <path key={a} d={feather(30, 8)} transform={`translate(${x} 100) rotate(${a + d * 8})`} fill={c2} {...TH} />
            ))}
            <rect x={x - 14} y="94" width="28" height="42" rx="7" fill="var(--surf-2)" {...OL} />
            <path d={`M${x - 13} 106 h26 M${x - 13} 122 h26`} stroke={c} strokeWidth="4" />
            <path d={`M${x - 11} 136 h22 l4 11 h-30z`} fill={INK} stroke="var(--fg)" strokeWidth="2.5" strokeLinejoin="round" />
          </g>
        );
      })}
      {/* legs on one-tooth geta */}
      {[-1, 1].map((d) => (
        <g key={d}>
          <path d={`M${100 + d * 15} 142 V166`} stroke="var(--fg)" strokeWidth="13" />
          <path d={`M${100 + d * 15} 142 V166`} stroke={dk(c, 30)} strokeWidth="7" />
          <rect x={100 + d * 15 - 13} y="164" width="26" height="7" rx="2" fill={c2} {...TH} />
          <rect x={100 + d * 15 - 4} y="171" width="8" height="11" fill={dk(c, 45)} {...TH} />
        </g>
      ))}
      {/* robe, sash and pom-poms */}
      <path d="M72 98 L128 98 L124 148 L76 148Z" fill={`url(#${armour})`} {...OL} />
      <path d="M100 100 V148" stroke={dk(c, 45)} strokeWidth="2.5" />
      {[[116, 8.5], [132, 7]].map(([y, r]) => (
        <g key={y}>
          <circle cx="100" cy={y} r={r} fill={c2} {...TH} />
          <circle cx="100" cy={y} r={r * 0.4} fill={dk(c2, 35)} />
        </g>
      ))}
      {/* arms */}
      <path d="M126 106 L136 134" stroke="var(--fg)" strokeWidth="14" strokeLinecap="round" />
      <path d="M126 106 L136 134" stroke={dk(c, 18)} strokeWidth="8" strokeLinecap="round" />
      <circle cx="137" cy="136" r="7" fill={c2} {...TH} />
      <path d="M74 106 L56 128" stroke="var(--fg)" strokeWidth="14" strokeLinecap="round" />
      <path d="M74 106 L56 128" stroke={dk(c, 18)} strokeWidth="8" strokeLinecap="round" />
      {mk >= 2 && (
        <g className={an(still, 'bcf-fan')} style={origin(52, 130)}>
          <path d="M52 130 L40 92" stroke="var(--fg)" strokeWidth="5" strokeLinecap="round" />
          {[-60, -36, -12, 12, 36, 60].map((a, i) => (
            <path key={a} d={feather(i === 0 || i === 5 ? 36 : 46, 10)} transform={`translate(40 92) rotate(${a - 12})`} fill={i % 2 ? c : c2} {...TH} />
          ))}
          <circle cx="40" cy="92" r="4.5" fill={GOLD} {...TH} />
        </g>
      )}
      <circle cx="54" cy="130" r="7" fill={c2} {...TH} />
      {/* spiky hair and beard */}
      <path d="M72 44 L56 30 L60 50 L44 50 L58 66 L46 78 L64 82 L136 82 L154 78 L142 66 L156 50 L140 50 L144 30 L128 44Z" fill={c2} {...OL} />
      <path d="M68 90 L66 112 L78 106 L84 124 L94 110 L100 128 L106 110 L116 124 L122 106 L134 112 L132 90Z" fill={c2} {...OL} />
      {/* face */}
      <path d="M66 50 Q100 26 134 50 L136 80 Q132 104 100 104 Q68 104 64 80Z" fill={`url(#${armour})`} {...OL} />
      <path d="M72 92 h34 l-2 7 q-14 2 -28 -1z" fill={INK} stroke="var(--fg)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M82 92 v7 M93 92 v7" stroke={PAPER} strokeWidth="1.5" />
      <Eyes still={still}>
        {happy ? (
          <path d="M71 72 Q82 60 93 72 M107 72 Q118 60 129 72" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
        ) : (
          <>
            <path d="M70 60 L96 70 L92 80 L74 78Q68 70 70 60Z" fill={INK} />
            <path d="M130 60 L104 70 L108 80 L126 78Q132 70 130 60Z" fill={INK} />
            <circle cx="84" cy="71" r="4.5" fill={GOLD} />
            <circle cx="116" cy="71" r="4.5" fill={GOLD} />
          </>
        )}
      </Eyes>
      <path d="M64 56 L98 68 L96 56 L72 42Z M136 56 L102 68 L104 56 L128 42Z" fill={c2} {...TH} strokeWidth="2.5" />
      {/* nose: a missile, in effect */}
      <path d="M94 82 L178 66 L112 102 Q92 100 94 82Z" fill={`url(#${armour})`} {...OL} />
      <path d="M131 75 L137 90" stroke={c2} strokeWidth="5" />
      <path d="M178 66 L192 63" stroke="var(--fg)" strokeWidth="3" strokeLinecap="round" />
      {mk >= 2 && (
        <g>
          <path d="M100 18 L82 25 L84 42 Q100 34 116 42 L118 25Z" fill={INK} {...OL} />
          <path d="M92 24 V38 M100 22 V36 M108 24 V38" stroke={GOLD} strokeWidth="2.5" />
        </g>
      )}
    </g>
  );
}

// ─── Komainu ────────────────────────────────────────────────────────────────
function Komainu({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const stone = `${uid}-s`;
  const fire = `${uid}-f`;
  const crack = c2;
  return (
    <g>
      <defs>
        <Metal id={stone} c={c} />
        <linearGradient id={fire} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={lt(c2, 50)} />
          <stop offset=".5" stopColor={c2} />
          <stop offset="1" stopColor={dk(c2, 25)} />
        </linearGradient>
      </defs>
      <Shadow rx={84} />
      <g transform="translate(-8 0)">
        {mk === 3 && (
          <g className={an(still, 'bcf-flame')}>
            {Array.from({ length: 15 }, (_, i) => (
              <path key={i} transform={`rotate(${-140 + i * 20} 100 86) translate(100 ${86 - 60})`} d="M-18 12 C-18 -6 -6 -10 -2 -30 C8 -18 18 -6 18 12Z" fill={`url(#${fire})`} {...OL} />
            ))}
            <circle cx="100" cy="86" r="62" fill={`url(#${fire})`} />
          </g>
        )}
        {/* curling tail */}
        <path d="M146 150 C168 150 176 124 164 106 L176 110 L168 92 L156 104 C164 118 150 132 138 132Z" fill={`url(#${stone})`} {...OL} />
        {/* plinth */}
        <rect x="30" y="166" width="146" height="16" rx="2" fill={dk(c, 25)} {...OL} />
        <rect x="42" y="156" width="122" height="12" rx="2" fill={c} {...OL} />
        <path d="M60 173 h16 M90 173 h16 M120 173 h16" stroke={c2} strokeWidth="3" strokeLinecap="round" />
        {/* haunches, chest */}
        <path d="M60 100 C44 120 42 146 48 158 L152 158 C158 146 156 120 140 100Z" fill={`url(#${stone})`} {...OL} />
        <path d="M78 100 L122 100 L132 158 L68 158Z" fill={lt(c, 16)} stroke="var(--fg)" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M84 118 h32 M86 128 h28" stroke={c2} strokeWidth="3" strokeLinecap="round" />
        {/* forelegs */}
        {[-1, 1].map((d) => (
          <g key={d}>
            <path d={`M${100 + d * 12} 122 L${100 + d * 32} 122 L${100 + d * 34} 148 L${100 + d * 10} 148Z`} fill={`url(#${stone})`} {...OL} />
            <rect x={d < 0 ? 58 : 106} y="146" width="36" height="13" rx="6" fill={c} {...OL} />
            <path d={`M${100 + d * 15} 151 v6 M${100 + d * 24} 151 v6 M${100 + d * 33} 151 v6`} stroke={INK} strokeWidth="2" />
            <Bolt x={100 + d * 22} y={132} r={3} />
          </g>
        ))}
        {/* mane plates */}
        {mk >= 2 &&
          Array.from({ length: 11 }, (_, i) => {
            const a = Math.PI * (0.92 + (i / 10) * 1.16);
            const x = 100 + 58 * Math.cos(a);
            const y = 66 + 46 * Math.sin(a);
            return (
              <g key={i} transform={`translate(${x} ${y})`}>
                <circle r="15" fill={`url(#${stone})`} {...OL} />
                <path d="M0 0 a3 3 0 0 1 3 3 a6 6 0 0 1 -9 -1 a9 9 0 0 1 13 -7" fill="none" stroke={c2} strokeWidth="2.5" strokeLinecap="round" />
              </g>
            );
          })}
        {/* ears */}
        {[-1, 1].map((d) => (
          <path key={d} d={`M${100 + d * 34} 36 Q${100 + d * 66} 18 ${100 + d * 62} 58 Q${100 + d * 52} 52 ${100 + d * 46} 46Z`} fill={dk(c, 18)} {...OL} />
        ))}
        {/* head */}
        <path d="M58 46 Q58 26 78 26 L122 26 Q142 26 142 46 L148 76 Q148 102 124 106 L76 106 Q52 102 52 76Z" fill={`url(#${stone})`} {...OL} />
        {[80, 100, 120].map((x) => (
          <g key={x} transform={`translate(${x} ${x === 100 ? 22 : 26})`}>
            <circle r="10.5" fill={`url(#${stone})`} {...OL} strokeWidth="3" />
            <path d="M0 0 a2.4 2.4 0 0 1 2.4 2.4 a4.6 4.6 0 0 1 -7 -1 a6.6 6.6 0 0 1 10 -5" fill="none" stroke={c2} strokeWidth="2.2" strokeLinecap="round" />
          </g>
        ))}
        {/* kintsugi */}
        <path d={mk === 3 ? 'M130 36 L120 42 L124 48 L114 50 M60 84 L68 86 L66 78 M140 92 L132 88 L136 80' : 'M130 36 L120 42 L124 48 L114 50'} fill="none" stroke={crack} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* brow and eyes */}
        <path d="M62 56 L95 66 L93 78 L67 74Q60 66 62 56Z M138 56 L105 66 L107 78 L133 74Q140 66 138 56Z" fill={INK} />
        <Eyes still={still}>
          {happy ? (
            <path d="M70 69 Q79 59 88 70 M112 70 Q121 59 130 69" fill="none" stroke={c2} strokeWidth="5" strokeLinecap="round" />
          ) : (
            <>
              <circle cx="80" cy="67" r="7.5" fill={c2} />
              <circle cx="120" cy="67" r="7.5" fill={c2} />
              <circle cx="81" cy="68" r="3" fill={INK} />
              <circle cx="119" cy="68" r="3" fill={INK} />
            </>
          )}
        </Eyes>
        <path d="M56 54 L96 66 L100 56 L104 66 L144 54 L138 42 L108 50 L100 46 L92 50 L62 42Z" fill={dk(c, 28)} {...TH} strokeWidth="2.5" />
        {/* snout */}
        <path d="M86 72 h28 l6 10 H80Z" fill={lt(c, 16)} stroke="var(--fg)" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M92 72 h16 l-3 7 h-10z" fill={INK} />
        {/* A: the open mouth */}
        <path d="M68 82 H132 L128 118 Q100 128 72 118Z" fill={INK} {...OL} />
        <path d="M74 84 h52 l-4 7 l-5 -3 l-3 11 l-5 -8 h-18 l-5 8 l-3 -11 l-5 3z" fill={PAPER} stroke={INK} strokeWidth="1" strokeLinejoin="round" />
        <g className={an(still, 'bcf-jaw')}>
          <path d="M86 112 Q100 96 114 112Z" fill="#e0506a" stroke={INK} strokeWidth="1.5" />
          <path d="M70 112 Q100 122 130 112 L128 124 Q100 134 72 124Z" fill={`url(#${stone})`} {...OL} />
          <path d="M76 112 l4 -9 l4 11z M124 112 l-4 -9 l-4 11z" fill={PAPER} stroke={INK} strokeWidth="1" strokeLinejoin="round" />
        </g>
        {mk === 3 && (
          <g>
            {/* shimenawa */}
            <path d="M46 122 Q100 164 154 122" fill="none" stroke="var(--fg)" strokeWidth="17" strokeLinecap="round" />
            <path d="M46 122 Q100 164 154 122" fill="none" stroke="#d9c48a" strokeWidth="11.5" strokeLinecap="round" />
            <path d="M46 122 Q100 164 154 122" fill="none" stroke="#8b6f3a" strokeWidth="11.5" strokeDasharray="2.5 8" />
            {[[66, 137], [100, 146], [134, 137]].map(([x, y]) => (
              <path key={x} d={`M${x - 6} ${y} h9 v7 h6 v7 h-9 v7 h6 v7 h-9 v-7 h-6 v-7 h9 v-7 h-6z`} fill="#fff" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
            ))}
          </g>
        )}
        {/* Un: its small friend, mouth shut */}
        <g transform="translate(178 130) scale(1.28)">
          <path d="M-14 28 L-14 12 Q0 4 14 12 L14 28Z" fill={`url(#${stone})`} {...TH} strokeWidth="2.5" />
          <path d="M-13 -2 L-16 -14 L-5 -9 H5 L16 -14 L13 -2 L15 8 Q14 18 0 18 Q-14 18 -15 8Z" fill={`url(#${stone})`} {...TH} strokeWidth="2.5" />
          <rect x="-10" y="-3" width="20" height="6" rx="2" fill={INK} />
          <circle cx="-5" cy="0" r="2" fill={c2} />
          <circle cx="5" cy="0" r="2" fill={c2} />
          <path d="M-8 10 H8" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M-6 10 l1.5 -3 l1.5 3z M6 10 l-1.5 -3 l-1.5 3z" fill={PAPER} stroke={INK} strokeWidth=".6" />
        </g>
      </g>
    </g>
  );
}

export const FOLKLORE: BotRegistry = {
  tanuki: { Art: Tanuki, head: { x: 100, y: 28, s: 1.3 } },
  daruma: { Art: Daruma, head: { x: 100, y: 26, s: 1.4 } },
  kappa: { Art: Kappa, head: { x: 100, y: 16, s: 1.2 } },
  maneki: { Art: Maneki, head: { x: 100, y: 31, s: 1.4 } },
  kasa: { Art: Kasa, head: { x: 100, y: 24, s: 0.7 } },
  chochin: { Art: Chochin, head: { x: 100, y: 28, s: 1.1 } },
  karakuri: { Art: Karakuri, head: { x: 100, y: 12, s: 1.2 } },
  koi: { Art: Koi, head: { x: 58, y: 66, s: 0.8 } },
  tengu: { Art: Tengu, head: { x: 100, y: 37, s: 1.15 } },
  komainu: { Art: Komainu, head: { x: 92, y: 12, s: 1.4 } },
};
if (location.search.includes('happy')) for (const k in FOLKLORE) { const A = FOLKLORE[k].Art; FOLKLORE[k].Art = (p) => A({ ...p, happy: true }); } // TEMP
