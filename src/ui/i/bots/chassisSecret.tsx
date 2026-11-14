import type { CSSProperties, ReactNode } from 'react';
import type { BotArtProps, BotRegistry } from './types';
import './chassisSecret.css';

/** Hidden bodies: never sold, each woken by doing something (domain/game/mastery.ts). */

const OL = { stroke: 'var(--fg)', strokeWidth: 3.5, strokeLinejoin: 'round', strokeLinecap: 'round' } as const;
const TH = { ...OL, strokeWidth: 2 } as const;
const INK = '#14141a';
const PAPER = '#f7f2e6';
const GOLD = '#f5c542';
const FIRE = '#ff7a1a';
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
function Shine({ id, c }: { id: string; c: string }) {
  return (
    <radialGradient id={id} cx=".36" cy=".28" r=".9">
      <stop offset="0" stopColor={lt(c, 30)} />
      <stop offset=".55" stopColor={c} />
      <stop offset="1" stopColor={dk(c, 30)} />
    </radialGradient>
  );
}
const star = (x: number, y: number, r: number, n = 5, inner = 0.45) =>
  Array.from({ length: n * 2 }, (_, i) => {
    const a = (Math.PI * i) / n - Math.PI / 2;
    const k = i % 2 ? r * inner : r;
    return `${(x + k * Math.cos(a)).toFixed(1)},${(y + k * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
/** A flame pointing up from (x, y). */
const flame = (x: number, y: number, h: number, w = h * 0.45) => `M${x} ${y} C${x - w} ${y - h * 0.3} ${x - w * 0.6} ${y - h * 0.7} ${x} ${y - h} C${x + w * 0.6} ${y - h * 0.7} ${x + w} ${y - h * 0.3} ${x} ${y}Z`;
/** Simple round eyes, or happy arcs. */
function Dots({ x1, x2, y, r = 6, happy, c = INK, still }: { x1: number; x2: number; y: number; r?: number; happy: boolean; c?: string; still: boolean }) {
  return (
    <Eyes still={still}>
      {happy ? (
        <path d={`M${x1 - r} ${y + 2} Q${x1} ${y - r - 2} ${x1 + r} ${y + 2} M${x2 - r} ${y + 2} Q${x2} ${y - r - 2} ${x2 + r} ${y + 2}`} fill="none" stroke={c} strokeWidth="4" strokeLinecap="round" />
      ) : (
        <>
          <circle cx={x1} cy={y} r={r} fill={c} />
          <circle cx={x2} cy={y} r={r} fill={c} />
          <circle cx={x1 + r * 0.35} cy={y - r * 0.35} r={r * 0.35} fill="#fff" />
          <circle cx={x2 + r * 0.35} cy={y - r * 0.35} r={r * 0.35} fill="#fff" />
        </>
      )}
    </Eyes>
  );
}

// ─── Kitsune Mech ───────────────────────────────────────────────────────────
function Kitsune({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const fur = `${uid}-f`;
  const tails = mk === 3 ? [-94, -72, -50, -28, 28, 50, 72, 94, 116] : mk === 2 ? [-52, 48, 74] : [56];
  return (
    <g>
      <defs>
        <Shine id={fur} c={c} />
      </defs>
      <Shadow rx={mk === 3 ? 70 : 54} />
      {/* tails, fanned out behind */}
      <g className={an(still, 'bcx-sway')} style={origin(100, 150)}>
        {tails.map((a, i) => (
          <g key={a} transform={`translate(100 150) rotate(${a}) scale(${a < 0 ? -1 : 1} 1) scale(${mk === 3 ? 0.86 : 1})`}>
            <path d="M0 0 C-24 -12 -34 -52 -16 -84 C-6 -100 14 -104 24 -92 C12 -90 6 -76 10 -58 C14 -34 12 -12 0 0Z" fill={`url(#${fur})`} {...OL} />
            <path d="M-12 -80 C-4 -98 14 -102 24 -92 C14 -90 8 -82 8 -74 C0 -72 -8 -74 -12 -80Z" fill={c2} {...TH} />
            {mk === 3 && i % 2 === 0 && <path d="M-6 -40 q8 -6 16 0" fill="none" stroke={dk(c, 30)} strokeWidth="2" />}
          </g>
        ))}
      </g>
      {/* sitting body */}
      <path d="M62 178 C56 150 64 112 100 104 C136 112 144 150 138 178Z" fill={`url(#${fur})`} {...OL} />
      <path d="M82 176 C80 150 86 126 100 120 C114 126 120 150 118 176Z" fill={c2} {...TH} />
      {[-1, 1].map((d) => (
        <g key={d}>
          <path d={`M${100 + d * 26} 178 v-26`} stroke="var(--fg)" strokeWidth="13" strokeLinecap="round" />
          <path d={`M${100 + d * 26} 178 v-26`} stroke={c} strokeWidth="7" strokeLinecap="round" />
          <ellipse cx={100 + d * 26} cy="179" rx="10" ry="5" fill={c2} {...TH} />
        </g>
      ))}
      {/* panel seams: it is a machine */}
      <path d="M100 124 v48" stroke={dk(c2, 25)} strokeWidth="1.5" strokeDasharray="3 3" />
      <circle cx="100" cy="142" r="5" fill={GOLD} {...TH} />
      {/* head */}
      {[-1, 1].map((d) => (
        <g key={d}>
          <path d={`M${100 + d * 14} 46 L${100 + d * 34} 6 L${100 + d * 42} 56Z`} fill={`url(#${fur})`} {...OL} />
          <path d={`M${100 + d * 22} 46 L${100 + d * 33} 20 L${100 + d * 37} 50Z`} fill={INK} />
        </g>
      ))}
      <path d="M100 40 C128 40 146 56 146 74 C146 86 128 100 100 108 C72 100 54 86 54 74 C54 56 72 40 100 40Z" fill={`url(#${fur})`} {...OL} />
      <path d="M100 66 C114 70 128 80 126 88 C118 98 108 104 100 106 C92 104 82 98 74 88 C72 80 86 70 100 66Z" fill={c2} {...TH} />
      {/* kumadori marks */}
      <path d="M70 62 q10 -8 20 2 M130 62 q-10 -8 -20 2" fill="none" stroke="#d62828" strokeWidth="3.5" strokeLinecap="round" />
      <Eyes still={still}>
        {happy ? (
          <path d="M72 74 Q80 66 90 74 M110 74 Q120 66 128 74" fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
        ) : (
          <>
            <path d="M70 76 Q80 66 92 74 Q82 80 70 76Z" fill={GOLD} stroke={INK} strokeWidth="2" />
            <path d="M130 76 Q120 66 108 74 Q118 80 130 76Z" fill={GOLD} stroke={INK} strokeWidth="2" />
            <path d="M81 70 v8 M119 70 v8" stroke={INK} strokeWidth="2.5" />
          </>
        )}
      </Eyes>
      <ellipse cx="100" cy="96" rx="5" ry="3.5" fill={INK} />
      {mk === 3 && (
        <g transform="translate(100 50)">
          <path d="M-11 -2 h22 M-13 -7 q13 -4 26 0 M-7 -7 v12 M7 -7 v12" fill="none" stroke="#d62828" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}
      {mk >= 2 && (
        <g className={an(still, 'bcx-float')} style={origin(164, 96)}>
          <path d={flame(164, 112, 30)} fill="#8ecae6" stroke="var(--fg)" strokeWidth="2.5" strokeLinejoin="round" opacity=".95" />
          <path d={flame(164, 110, 16)} fill="#fff" />
        </g>
      )}
    </g>
  );
}

// ─── Hō-ō ───────────────────────────────────────────────────────────────────
function Hoo({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const body = `${uid}-b`;
  return (
    <g>
      <defs>
        <Shine id={body} c={c} />
        <linearGradient id={`${uid}-fl`} x1="0" x2="0" y1="1" y2="0">
          <stop offset="0" stopColor={FIRE} />
          <stop offset="1" stopColor={c2} />
        </linearGradient>
      </defs>
      <Shadow rx={mk === 3 ? 76 : 50} />
      {mk === 3 && (
        <g className={an(still, 'bcx-spin')} style={origin(100, 40)}>
          <circle cx="100" cy="40" r="34" fill="none" stroke={c2} strokeWidth="3" strokeDasharray="6 7" />
        </g>
      )}
      {/* tail plumes */}
      {mk >= 2 &&
        [-34, -14, 6].map((a, i) => (
          <g key={a} className={an(still, 'bcx-sway')} style={{ ...origin(112, 150), animationDelay: `${-i * 0.3}s` }}>
            <g transform={`rotate(${a} 112 150)`}>
              <path d="M112 150 C140 150 170 160 186 178 C166 176 140 168 112 158Z" fill={c} {...TH} />
              <circle cx="172" cy="170" r="6" fill={c2} stroke="var(--fg)" strokeWidth="1.5" />
              <circle cx="172" cy="170" r="2.5" fill={INK} />
            </g>
          </g>
        ))}
      {/* wings */}
      {mk === 3 ? (
        [-1, 1].map((d) => (
          <g key={d} className={an(still, d < 0 ? 'bcx-flap-l' : 'bcx-flap-r')} style={origin(100 + d * 24, 110)}>
            <path d={`M${100 + d * 24} 110 C${100 + d * 50} 70 ${100 + d * 80} 56 ${100 + d * 96} 60 C${100 + d * 84} 76 ${100 + d * 90} 90 ${100 + d * 82} 98 C${100 + d * 70} 102 ${100 + d * 76} 116 ${100 + d * 62} 122 C${100 + d * 50} 128 ${100 + d * 40} 128 ${100 + d * 26} 132Z`} fill={`url(#${uid}-fl)`} {...OL} />
            <path d={`M${100 + d * 34} 112 L${100 + d * 82} 68 M${100 + d * 36} 120 L${100 + d * 74} 100`} stroke={dk(c, 20)} strokeWidth="2" />
          </g>
        ))
      ) : null}
      {/* legs */}
      {[-1, 1].map((d) => (
        <g key={d}>
          <path d={`M${100 + d * 12} 150 L${100 + d * 14} 178`} stroke="var(--fg)" strokeWidth="7" strokeLinecap="round" />
          <path d={`M${100 + d * 12} 150 L${100 + d * 14} 178`} stroke={GOLD} strokeWidth="3.5" strokeLinecap="round" />
          <path d={`M${100 + d * 14} 178 l-8 4 M${100 + d * 14} 178 l8 4 M${100 + d * 14} 178 l0 6`} stroke="var(--fg)" strokeWidth="3" strokeLinecap="round" />
        </g>
      ))}
      {/* body */}
      <ellipse cx="100" cy="128" rx="34" ry="30" fill={`url(#${body})`} {...OL} />
      <path d="M80 118 C86 144 114 144 120 118 C114 128 86 128 80 118Z" fill={c2} {...TH} />
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M${86 + i * 10} ${132 + (i % 2) * 2} q5 6 10 0`} fill="none" stroke={dk(c, 25)} strokeWidth="2" />
      ))}
      {mk < 3 &&
        [-1, 1].map((d) => <path key={d} d={`M${100 + d * 30} 112 C${100 + d * 44} 120 ${100 + d * 44} 142 ${100 + d * 30} 154 C${100 + d * 34} 140 ${100 + d * 30} 126 ${100 + d * 22} 118Z`} fill={dk(c, 15)} {...TH} />)}
      {/* neck and head */}
      <path d="M90 104 C86 84 90 70 100 62 C110 70 114 84 110 104Z" fill={`url(#${body})`} {...OL} />
      <circle cx="100" cy="52" r="18" fill={`url(#${body})`} {...OL} />
      {/* crest */}
      {[-24, 0, 24].map((a) => (
        <g key={a} transform={`rotate(${a} 100 36)`}>
          <path d="M100 36 C96 26 98 16 104 10 C104 20 106 28 100 36Z" fill={c2} {...TH} />
        </g>
      ))}
      <path d="M100 52 L122 58 L100 64Z" fill={GOLD} {...TH} />
      <Eyes still={still}>{happy ? <path d="M86 50 q5 -6 10 0" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" /> : <circle cx="92" cy="49" r="4" fill={INK} />}</Eyes>
      <path d="M86 56 q-6 6 -2 14" fill="none" stroke={c2} strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}

// ─── Niwatori ───────────────────────────────────────────────────────────────
function Niwatori({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const body = `${uid}-b`;
  return (
    <g>
      <defs>
        <Shine id={body} c={c} />
      </defs>
      <Shadow rx={50} />
      {mk === 3 && (
        <g className={an(still, 'bcx-spin-slow')} style={origin(100, 110)}>
          {Array.from({ length: 12 }, (_, i) => (
            <path key={i} transform={`rotate(${i * 30} 100 110)`} d="M96 30 L100 12 L104 30Z" fill={GOLD} stroke="var(--fg)" strokeWidth="1.5" />
          ))}
          <circle cx="100" cy="110" r="74" fill="none" stroke={GOLD} strokeWidth="2" opacity=".6" />
        </g>
      )}
      {/* tail feathers */}
      {[-30, -10, 10].map((a) => (
        <path key={a} transform={`rotate(${a} 140 118)`} d="M140 118 C150 92 170 84 178 90 C168 100 160 112 146 126Z" fill={dk(c2, 15)} {...TH} />
      ))}
      {/* legs */}
      {[-1, 1].map((d) => (
        <g key={d}>
          <path d={`M${100 + d * 14} 150 V178`} stroke="var(--fg)" strokeWidth="7" strokeLinecap="round" />
          <path d={`M${100 + d * 14} 150 V178`} stroke={GOLD} strokeWidth="3.5" strokeLinecap="round" />
          <path d={`M${100 + d * 14} 178 l-9 5 M${100 + d * 14} 178 l9 5`} stroke="var(--fg)" strokeWidth="3" strokeLinecap="round" />
        </g>
      ))}
      {/* body: an alarm clock */}
      <circle cx="100" cy="118" r="38" fill={`url(#${body})`} {...OL} />
      <circle cx="100" cy="122" r="25" fill={PAPER} {...TH} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <circle key={i} cx={100 + 20 * Math.sin(a)} cy={122 - 20 * Math.cos(a)} r={i % 3 ? 1.2 : 2} fill={INK} />;
      })}
      <path d="M100 122 V106" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      <g className={an(still, 'bcx-tick')} style={origin(100, 122)}>
        <path d="M100 122 L100 138" stroke={c2} strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <circle cx="100" cy="122" r="2.5" fill={INK} />
      {/* wings */}
      {[-1, 1].map((d) => (
        <path key={d} d={`M${100 + d * 36} 108 C${100 + d * 52} 114 ${100 + d * 54} 134 ${100 + d * 42} 144 C${100 + d * 42} 132 ${100 + d * 38} 122 ${100 + d * 34} 118Z`} fill={dk(c, 12)} {...TH} />
      ))}
      {/* head */}
      <circle cx="100" cy="62" r="22" fill={`url(#${body})`} {...OL} />
      {[-12, 0, 12].map((x, i) => (
        <circle key={x} cx={100 + x} cy={40 - (i === 1 ? 6 : 0)} r={i === 1 ? 9 : 7} fill={c2} {...TH} />
      ))}
      <path d="M100 64 L116 70 L100 76Z" fill={GOLD} {...TH} />
      <path d="M102 76 q6 14 -2 16 q-6 -2 -2 -16Z" fill={c2} {...TH} />
      <Dots x1={88} x2={110} y={58} r={4} happy={happy} still={still} />
      {mk >= 2 && (
        <g className={an(still, 'bcx-ring')} style={origin(100, 46)}>
          {[-1, 1].map((d) => (
            <g key={d} transform={`rotate(${d * 28} ${100 + d * 30} 34)`}>
              <path d={`M${100 + d * 30 - 15} 40 A15 15 0 0 1 ${100 + d * 30 + 15} 40Z`} fill={GOLD} {...OL} strokeWidth="2.5" />
              <circle cx={100 + d * 30} cy="23" r="3" fill={GOLD} {...TH} />
              <path d={`M${100 + d * 30 - 9} 34 h18`} stroke={lt(GOLD, 50)} strokeWidth="2" />
            </g>
          ))}
          <path d="M100 30 V18" stroke="var(--fg)" strokeWidth="3" />
          <circle cx="100" cy="16" r="4" fill={c2} {...TH} />
        </g>
      )}
    </g>
  );
}

// ─── Nue ────────────────────────────────────────────────────────────────────
function Nue({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const body = `${uid}-b`;
  return (
    <g>
      <defs>
        <Shine id={body} c={c} />
      </defs>
      <Shadow rx={62} />
      {mk === 3 && (
        <g className={an(still, 'bcx-float')} style={origin(100, 14)}>
          <path d="M60 22 a12 12 0 0 1 18 -12 a16 16 0 0 1 30 -2 a13 13 0 0 1 22 10 a10 10 0 0 1 -2 18 H66 a10 10 0 0 1 -6 -14Z" fill="#9aa0ab" {...TH} />
          <path d="M96 36 l-6 12 h8 l-6 12" fill="none" stroke={GOLD} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={an(still, 'i-pulse')} />
        </g>
      )}
      {/* snake tail */}
      <path d="M140 150 C170 150 176 120 160 104 C150 94 160 80 172 84" fill="none" stroke="var(--fg)" strokeWidth="12" strokeLinecap="round" />
      <path d="M140 150 C170 150 176 120 160 104 C150 94 160 80 172 84" fill="none" stroke="#2a9d8f" strokeWidth="7" strokeLinecap="round" />
      <g transform="translate(176 82) rotate(-20)">
        <ellipse rx="10" ry="7" fill="#2a9d8f" {...TH} />
        <circle cx="3" cy="-2" r="1.8" fill={INK} />
        <path d="M10 0 l7 -2 M10 0 l7 2" stroke="#e63946" strokeWidth="1.5" />
      </g>
      {/* tiger legs */}
      {[-30, -12, 12, 30].map((x) => (
        <g key={x}>
          <rect x={100 + x - 8} y="142" width="16" height="34" rx="6" fill={c2} {...TH} />
          <path d={`M${100 + x - 8} 152 h7 M${100 + x + 8} 160 h-7 M${100 + x - 8} 168 h6`} stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <ellipse cx={100 + x} cy="178" rx="10" ry="5" fill={c2} {...TH} />
        </g>
      ))}
      {/* body */}
      <rect x="50" y="98" width="100" height="52" rx="24" fill={`url(#${body})`} {...OL} />
      {mk >= 2 && (
        <g>
          <path d="M60 108 h22 v20 h-22z" fill="#e76f51" {...TH} />
          <path d="M112 120 h24 v18 h-24z" fill="#8ac926" {...TH} />
          <path d="M86 132 h18 v14 h-18z" fill="#1982c4" {...TH} />
          {[
            [60, 118, 82],
            [112, 129, 136],
            [86, 139, 104],
          ].map(([x1, y, x2]) => (
            <path key={x1} d={`M${x1} ${y} H${x2}`} stroke={PAPER} strokeWidth="1.5" strokeDasharray="2 3" />
          ))}
        </g>
      )}
      <path d="M58 124 Q100 136 142 124" fill="none" stroke={dk(c, 30)} strokeWidth="2" strokeDasharray="4 4" />
      {/* monkey head */}
      {[-1, 1].map((d) => (
        <circle key={d} cx={100 + d * 36} cy="62" r="11" fill={c} {...OL} />
      ))}
      <circle cx="100" cy="64" r="34" fill={`url(#${body})`} {...OL} />
      <path d="M100 52 C108 40 128 44 128 62 C128 82 114 92 100 92 C86 92 72 82 72 62 C72 44 92 40 100 52Z" fill={lt(c2, 30)} {...TH} />
      <Dots x1={88} x2={112} y={62} r={5} happy={happy} still={still} />
      <path d="M92 80 q8 6 16 0" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      <path d="M96 72 h8" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
    </g>
  );
}

// ─── Ashura ─────────────────────────────────────────────────────────────────
function Ashura({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const body = `${uid}-b`;
  // Three pairs of arms, from the shoulders out.
  const arms = [
    { a: -62, y: 98, len: 46 },
    { a: -20, y: 108, len: 50 },
    { a: 24, y: 118, len: 46 },
  ];
  const tool = (i: number, d: number): ReactNode => {
    const k = d < 0 ? i : i + 3;
    switch (k) {
      case 0: // violin bow
        return <path d="M-4 -22 L4 22" stroke={PAPER} strokeWidth="3" strokeLinecap="round" />;
      case 1: // a book
        return <rect x="-9" y="-7" width="18" height="14" rx="1.5" fill="#457b9d" {...TH} />;
      case 2: // a dumbbell
        return <path d="M-12 0 h24 M-12 -6 v12 M12 -6 v12" stroke="var(--fg)" strokeWidth="4" strokeLinecap="round" />;
      case 3: // a pawn
        return <path d="M0 -10 a4 4 0 1 1 0.1 0 M-4 -4 h8 l2 12 h-12z" fill={PAPER} {...TH} />;
      case 4: // a pencil
        return <path d="M-3 -14 h6 v22 l-3 6 l-3 -6z" fill={GOLD} {...TH} />;
      default: // a moon
        return <path d="M4 -10 a10 10 0 1 0 0 20 a8 8 0 1 1 0 -20z" fill="#ffe8a3" {...TH} />;
    }
  };
  return (
    <g>
      <defs>
        <Shine id={body} c={c} />
      </defs>
      <Shadow rx={56} />
      {mk === 3 && (
        <g className={an(still, 'bcx-spin-slow')} style={origin(100, 92)}>
          <circle cx="100" cy="92" r="66" fill="none" stroke={FIRE} strokeWidth="4" />
          {Array.from({ length: 14 }, (_, i) => (
            <path key={i} transform={`rotate(${(i * 360) / 14} 100 92)`} d={flame(100, 30, 18, 7)} fill={i % 2 ? FIRE : GOLD} stroke="var(--fg)" strokeWidth="1.5" />
          ))}
        </g>
      )}
      {/* arms */}
      {[-1, 1].map((d) =>
        arms.map((arm, i) => (
          <g key={`${d}${i}`} className={an(still, 'bcx-wave')} style={{ ...origin(100 + d * 26, arm.y), animationDelay: `${-i * 0.25 - (d > 0 ? 0.6 : 0)}s` }}>
            <g transform={`translate(${100 + d * 26} ${arm.y}) rotate(${d * arm.a}) scale(${-d} 1)`}>
              <path d={`M0 0 H-${arm.len}`} stroke="var(--fg)" strokeWidth="11" strokeLinecap="round" />
              <path d={`M0 0 H-${arm.len}`} stroke={c} strokeWidth="6" strokeLinecap="round" />
              <circle cx={-arm.len - 4} cy="0" r="6.5" fill={c2} {...TH} />
              {mk >= 2 && <g transform={`translate(${-arm.len - 6} -2) scale(${-d} 1) rotate(${-d * arm.a})`}>{tool(i, d)}</g>}
            </g>
          </g>
        )),
      )}
      {/* legs, seated */}
      <path d="M58 176 C60 156 80 150 100 152 C120 150 140 156 142 176Z" fill={dk(c, 15)} {...OL} />
      <path d="M70 172 q30 -10 60 0" fill="none" stroke={c2} strokeWidth="2.5" />
      {/* body */}
      <path d="M74 96 C74 88 86 84 100 84 C114 84 126 88 126 96 L120 154 H80Z" fill={`url(#${body})`} {...OL} />
      <path d="M86 98 L100 112 L114 98" fill="none" stroke={c2} strokeWidth="4" strokeLinejoin="round" />
      <circle cx="100" cy="128" r="9" fill={c2} {...TH} />
      <text x="100" y="132.5" textAnchor="middle" fontSize="12" fontWeight="900" fontFamily={KANJI} fill={INK}>
        六
      </text>
      {/* head */}
      <rect x="92" y="72" width="16" height="14" fill={dk(c, 20)} {...TH} />
      <path d="M78 52 C78 36 88 30 100 30 C112 30 122 36 122 52 C122 68 112 78 100 78 C88 78 78 68 78 52Z" fill={`url(#${body})`} {...OL} />
      <path d="M88 26 L100 10 L112 26Z" fill={c2} {...TH} />
      <circle cx="100" cy="40" r="3" fill={c2} />
      <Eyes still={still}>
        {happy ? (
          <path d="M86 54 q5 -6 10 0 M104 54 q5 -6 10 0" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
        ) : (
          <path d="M85 54 L96 50 L96 56Z M115 54 L104 50 L104 56Z" fill={c2} stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
        )}
      </Eyes>
      <path d="M94 66 q6 4 12 0" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
    </g>
  );
}

// ─── Shashin ────────────────────────────────────────────────────────────────
function Shashin({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const body = `${uid}-b`;
  return (
    <g>
      <defs>
        <Shine id={body} c={c} />
        <radialGradient id={`${uid}-l`} cx=".35" cy=".3" r=".8">
          <stop offset="0" stopColor="#9ad1ff" />
          <stop offset=".5" stopColor="#264653" />
          <stop offset="1" stopColor={INK} />
        </radialGradient>
      </defs>
      <Shadow rx={46} />
      {mk === 3 && (
        <g className={an(still, 'bcx-film')}>
          <path d="M18 150 C10 110 40 90 30 60 C24 40 40 26 56 30" fill="none" stroke="var(--fg)" strokeWidth="16" strokeLinecap="round" />
          <path d="M18 150 C10 110 40 90 30 60 C24 40 40 26 56 30" fill="none" stroke="#3a3a3a" strokeWidth="12" strokeLinecap="round" />
          <path d="M18 150 C10 110 40 90 30 60 C24 40 40 26 56 30" fill="none" stroke={PAPER} strokeWidth="9" strokeDasharray="2 5" strokeLinecap="butt" />
          <path d="M18 150 C10 110 40 90 30 60 C24 40 40 26 56 30" fill="none" stroke="#f4a261" strokeWidth="4" strokeDasharray="8 4" strokeLinecap="butt" opacity=".8" />
        </g>
      )}
      {/* tripod */}
      {[-24, 0, 24].map((x) => (
        <path key={x} d={`M100 142 L${100 + x * 1.4} 180`} stroke="var(--fg)" strokeWidth={x ? 5 : 4} strokeLinecap="round" />
      ))}
      {/* camera body */}
      <rect x="54" y="100" width="92" height="44" rx="6" fill={`url(#${body})`} {...OL} />
      <path d="M54 112 h92" stroke={dk(c, 30)} strokeWidth="2" />
      <rect x="128" y="94" width="12" height="8" rx="2" fill={c2} {...TH} />
      <text x="72" y="134" textAnchor="middle" fontSize="13" fontWeight="900" fontFamily={KANJI} fill={c2}>
        写
      </text>
      {/* bellows neck */}
      <path d="M78 100 L74 92 L126 92 L122 100 M76 92 L80 84 L120 84 L124 92 M80 84 L76 76 L124 76 L120 84" fill={dk(c, 20)} {...TH} />
      {/* head: the lens board */}
      <rect x="62" y="28" width="76" height="50" rx="8" fill={`url(#${body})`} {...OL} />
      <circle cx="100" cy="53" r="20" fill="#9aa0ab" {...OL} />
      <circle cx="100" cy="53" r="14" fill={`url(#${uid}-l)`} stroke="var(--fg)" strokeWidth="2" />
      <Eyes still={still}>
        {happy ? (
          <path d="M92 54 q8 -8 16 0" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        ) : (
          <>
            <circle cx="100" cy="53" r="5" fill={INK} />
            <circle cx="95" cy="48" r="3" fill="#fff" opacity=".9" />
          </>
        )}
      </Eyes>
      <circle cx="74" cy="38" r="4" fill={c2} {...TH} />
      <rect x="120" y="34" width="12" height="8" rx="1.5" fill={PAPER} {...TH} />
      {mk >= 2 && (
        <g>
          <path d="M134 30 L150 8" stroke="var(--fg)" strokeWidth="4" strokeLinecap="round" />
          <path d="M140 0 h20 l-4 12 h-12z" fill="#c0c7d1" {...TH} />
          <circle cx="150" cy="-2" r="7" fill="#fffbe6" {...TH} className={an(still, 'bcx-flash')} style={origin(150, -2)} />
        </g>
      )}
    </g>
  );
}

// ─── Nagareboshi ────────────────────────────────────────────────────────────
function Nagareboshi({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const body = `${uid}-b`;
  const L = mk >= 2 ? 1.4 : 1;
  return (
    <g>
      <defs>
        <Shine id={body} c={c} />
        <linearGradient id={`${uid}-t`} x1="1" x2="0" y1="1" y2="0">
          <stop offset="0" stopColor={c2} />
          <stop offset="1" stopColor={c2} stopOpacity="0" />
        </linearGradient>
      </defs>
      <Shadow rx={44} />
      {/* the tail */}
      <g className={an(still, 'bcx-shimmer')}>
        <path d={`M86 82 L${86 - 70 * L} ${82 - 60 * L} L${86 - 50 * L} ${82 - 72 * L} L104 66Z`} fill={`url(#${uid}-t)`} />
        <path d={`M92 96 L${92 - 74 * L} ${96 - 40 * L} L${92 - 66 * L} ${96 - 54 * L} L100 84Z`} fill={`url(#${uid}-t)`} opacity=".7" />
        {mk >= 2 && [0.3, 0.55, 0.8].map((k) => <polygon key={k} points={star(86 - 60 * L * k, 72 - 60 * L * k, 5, 4, 0.35)} fill="#fff" />)}
      </g>
      {/* legs */}
      {[-1, 1].map((d) => (
        <g key={d}>
          <path d={`M${100 + d * 14} 140 L${100 + d * 18} 176`} stroke="var(--fg)" strokeWidth="9" strokeLinecap="round" />
          <path d={`M${100 + d * 14} 140 L${100 + d * 18} 176`} stroke={dk(c, 10)} strokeWidth="4.5" strokeLinecap="round" />
          <ellipse cx={100 + d * 20} cy="178" rx="10" ry="5" fill={c2} {...TH} />
        </g>
      ))}
      {/* the star */}
      <g className={an(still, 'bcx-bob')} style={origin(100, 104)}>
        <polygon points={star(100, 104, 54, 5, 0.5)} fill={`url(#${body})`} {...OL} />
        <polygon points={star(100, 106, 30, 5, 0.5)} fill={lt(c, 40)} opacity=".5" />
        <Dots x1={88} x2={112} y={100} r={5.5} happy={happy} still={still} c={INK} />
        <path d="M92 114 q8 7 16 0" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        <circle cx="80" cy="112" r="4" fill="#ff8fab" opacity=".7" />
        <circle cx="120" cy="112" r="4" fill="#ff8fab" opacity=".7" />
      </g>
      {mk === 3 && (
        <>
          <g className={an(still, 'bcx-spin')} style={origin(100, 104)}>
            {[0, 120, 240].map((a) => (
              <polygon key={a} transform={`rotate(${a} 100 104)`} points={star(100, 30, 8, 5, 0.45)} fill={GOLD} stroke="var(--fg)" strokeWidth="1.5" />
            ))}
          </g>
          <g className={an(still, 'bcx-sway')} style={origin(140, 112)}>
            <path d="M140 112 v6" stroke="var(--fg)" strokeWidth="1.5" />
            <rect x="133" y="118" width="14" height="40" fill="#ffafcc" {...TH} />
            <path d="M137 126 h6 M137 132 h6 M137 138 h6" stroke={INK} strokeWidth="1.5" />
          </g>
        </>
      )}
    </g>
  );
}

// ─── Namazu ─────────────────────────────────────────────────────────────────
function Namazu({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const body = `${uid}-b`;
  const wl = mk >= 2 ? 1.35 : 1;
  return (
    <g>
      <defs>
        <Shine id={body} c={c} />
      </defs>
      <Shadow rx={60} />
      {mk === 3 && (
        <g className={an(still, 'bcx-quake')}>
          {[0, 1, 2].map((i) => (
            <ellipse key={i} cx="100" cy="182" rx={64 + i * 14} ry={8 + i * 3} fill="none" stroke={c2} strokeWidth="2.5" opacity={0.7 - i * 0.2} />
          ))}
        </g>
      )}
      <g className={an(still, 'bcx-wriggle')} style={origin(100, 176)}>
        {/* tail fin, on the ground */}
        <path d="M100 160 C120 170 146 168 160 178 C140 184 116 182 100 176Z" fill={dk(c, 15)} {...OL} />
        {/* body, standing up */}
        <path d="M58 170 C46 130 54 80 100 64 C146 80 154 130 142 170 C128 180 72 180 58 170Z" fill={`url(#${body})`} {...OL} />
        <path d="M74 166 C66 136 74 108 100 100 C126 108 134 136 126 166Z" fill={lt(c2, 20)} {...TH} />
        {/* fins */}
        {[-1, 1].map((d) => (
          <path key={d} d={`M${100 + d * 44} 120 C${100 + d * 66} 116 ${100 + d * 70} 134 ${100 + d * 62} 144 C${100 + d * 54} 136 ${100 + d * 48} 132 ${100 + d * 44} 132Z`} fill={dk(c, 10)} {...TH} />
        ))}
        {/* mouth and whiskers */}
        <path d="M72 96 Q100 112 128 96" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
        {[-1, 1].map((d) => (
          <g key={d} className={an(still, d < 0 ? 'bcx-whisk-l' : 'bcx-whisk-r')} style={origin(100 + d * 26, 98)}>
            <path d={`M${100 + d * 26} 98 C${100 + d * 50 * wl} 92 ${100 + d * 60 * wl} ${110 + 10 * wl} ${100 + d * 70 * wl} ${118 + 14 * wl}`} fill="none" stroke="var(--fg)" strokeWidth="3.5" strokeLinecap="round" />
            <path d={`M${100 + d * 20} 104 C${100 + d * 36} 112 ${100 + d * 40} 124 ${100 + d * 46} ${130 + 8 * wl}`} fill="none" stroke="var(--fg)" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        ))}
        <Dots x1={82} x2={118} y={84} r={6} happy={happy} still={still} />
        {mk >= 2 && (
          <g>
            <path d="M84 70 C82 54 94 46 104 48 C118 50 122 62 116 72Z" fill="#8d8a83" {...OL} />
            <path d="M92 60 q8 -4 16 2" fill="none" stroke="#5e5b55" strokeWidth="2" />
            <path d="M86 70 h30" stroke="#d62828" strokeWidth="3" />
          </g>
        )}
      </g>
    </g>
  );
}

// ─── Bunbuku Chagama ────────────────────────────────────────────────────────
function Chagama({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const iron = `${uid}-i`;
  return (
    <g>
      <defs>
        <Shine id={iron} c={c} />
      </defs>
      <Shadow rx={56} />
      {mk === 3 && (
        <>
          <path d="M6 180 H194" stroke="var(--fg)" strokeWidth="2.5" />
          <g className={an(still, 'bcx-sway')} style={origin(150, 116)}>
            <path d="M150 116 V40" stroke="var(--fg)" strokeWidth="3" />
            <path d="M112 50 Q150 14 188 50 Q169 42 150 50 Q131 42 112 50Z" fill={c2} {...OL} strokeWidth="2.5" />
            <path d="M150 22 V50 M131 34 L140 48 M169 34 L160 48" stroke={dk(c2, 30)} strokeWidth="1.5" />
          </g>
        </>
      )}
      {/* tanuki tail */}
      <path d="M140 150 C164 150 170 126 160 112 C176 120 178 150 156 164 C150 166 144 164 140 160Z" fill={c2} {...OL} />
      <path d="M152 124 q8 4 10 0 M154 140 q8 2 10 -4" fill="none" stroke={dk(c2, 45)} strokeWidth="3" />
      {/* feet */}
      {[-1, 1].map((d) => (
        <ellipse key={d} cx={100 + d * 30} cy="176" rx="15" ry="8" fill={c2} {...OL} />
      ))}
      {/* the kettle */}
      <path d="M48 128 C48 98 70 86 100 86 C130 86 152 98 152 128 C152 156 130 172 100 172 C70 172 48 156 48 128Z" fill={`url(#${iron})`} {...OL} />
      <path d="M50 118 H150" stroke={dk(c, 35)} strokeWidth="4" />
      {Array.from({ length: 8 }, (_, i) => (
        <circle key={i} cx={64 + i * 10} cy="104" r="2" fill={lt(c, 20)} />
      ))}
      {/* spout */}
      <path d="M50 128 C34 124 26 112 22 100 L34 98 C38 108 44 114 52 116Z" fill={`url(#${iron})`} {...OL} />
      {mk >= 2 && (
        <g className={an(still, 'bcx-steam')}>
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M${26 - i * 4} ${92 - i * 14} q-6 -6 0 -12 q6 -6 0 -12`} fill="none" stroke="var(--fg-2)" strokeWidth="3" strokeLinecap="round" opacity={0.7 - i * 0.18} />
          ))}
        </g>
      )}
      {/* handle */}
      <path d="M62 96 C62 62 138 62 138 96" fill="none" stroke="var(--fg)" strokeWidth="7" />
      <path d="M62 96 C62 62 138 62 138 96" fill="none" stroke={dk(c, 20)} strokeWidth="3" />
      {/* tanuki head where the lid was */}
      {[-1, 1].map((d) => (
        <circle key={d} cx={100 + d * 22} cy="54" r="9" fill={c2} {...OL} />
      ))}
      <path d="M100 48 C120 48 132 60 132 74 C132 88 118 96 100 96 C82 96 68 88 68 74 C68 60 80 48 100 48Z" fill={c2} {...OL} />
      <path d="M76 70 C82 62 94 64 98 72 L102 72 C106 64 118 62 124 70 C126 80 116 86 108 84 L100 80 L92 84 C84 86 74 80 76 70Z" fill={INK} />
      <Dots x1={88} x2={112} y={73} r={4} happy={happy} still={still} c={PAPER} />
      <ellipse cx="100" cy="86" rx="6" ry="4" fill={INK} />
      {/* arms */}
      {[-1, 1].map((d) => (
        <path key={d} d={`M${100 + d * 46} 130 q${d * 12} 4 ${d * 14} 16`} stroke="var(--fg)" strokeWidth="11" strokeLinecap="round" fill="none" />
      ))}
      {[-1, 1].map((d) => (
        <path key={d} d={`M${100 + d * 46} 130 q${d * 12} 4 ${d * 14} 16`} stroke={c2} strokeWidth="6" strokeLinecap="round" fill="none" />
      ))}
    </g>
  );
}

// ─── Medetai ────────────────────────────────────────────────────────────────
function Medetai({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const body = `${uid}-b`;
  return (
    <g>
      <defs>
        <Shine id={body} c={c} />
      </defs>
      <Shadow rx={58} />
      {mk === 3 && (
        <g className={an(still, 'bcx-sway')} style={origin(30, 180)}>
          <path d="M30 180 V40" stroke="var(--fg)" strokeWidth="4" />
          <path d="M30 44 H56 V120 H30" fill={PAPER} {...OL} strokeWidth="2.5" />
          <path d="M30 44 H56 V52 H30Z" fill={c} />
          <text x="43" y="80" textAnchor="middle" fontSize="18" fontWeight="900" fontFamily={KANJI} fill={c}>
            祝
          </text>
          <text x="43" y="104" textAnchor="middle" fontSize="18" fontWeight="900" fontFamily={KANJI} fill={c}>
            鯛
          </text>
        </g>
      )}
      {/* legs */}
      {[-1, 1].map((d) => (
        <g key={d}>
          <path d={`M${100 + d * 16} 138 V176`} stroke="var(--fg)" strokeWidth="9" strokeLinecap="round" />
          <path d={`M${100 + d * 16} 138 V176`} stroke={c2} strokeWidth="4.5" strokeLinecap="round" />
          <path d={`M${100 + d * 16 - 12} 180 Q${100 + d * 16} 168 ${100 + d * 16 + 12} 180Z`} fill={c2} {...TH} />
        </g>
      ))}
      <g className={an(still, 'bcx-bob')} style={origin(100, 100)}>
        {/* dorsal fin */}
        <path d="M62 66 C76 44 120 38 146 58 L138 66 L128 58 L118 64 L106 56 L96 64 L84 58 L74 68Z" fill={c} {...OL} />
        {/* tail */}
        <path d="M160 98 L188 72 C184 92 184 108 188 126 Z" fill={dk(c, 10)} {...OL} />
        {/* the fish */}
        <path d="M38 102 C40 74 76 60 110 62 C144 64 162 86 162 100 C162 116 142 136 108 138 C74 140 38 128 38 102Z" fill={`url(#${body})`} {...OL} />
        <path d="M44 112 C70 130 120 134 154 112" fill="none" stroke={lt(c, 45)} strokeWidth="6" strokeLinecap="round" opacity=".6" />
        {Array.from({ length: 10 }, (_, i) => (
          <path key={i} d={`M${82 + (i % 5) * 14} ${84 + Math.floor(i / 5) * 14} q6 6 12 0`} fill="none" stroke={dk(c, 25)} strokeWidth="1.8" />
        ))}
        <path d="M80 72 C88 86 88 112 78 128" fill="none" stroke={dk(c, 30)} strokeWidth="2.5" />
        <path d="M104 108 C114 110 122 118 116 128 C110 122 104 116 104 108Z" fill={c2} {...TH} />
        <Eyes still={still}>
          {happy ? (
            <path d="M54 90 q8 -9 16 0" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
          ) : (
            <>
              <circle cx="62" cy="90" r="10" fill={PAPER} stroke="var(--fg)" strokeWidth="2.5" />
              <circle cx="60" cy="90" r="5.5" fill={INK} />
              <circle cx="58" cy="88" r="2" fill="#fff" />
            </>
          )}
        </Eyes>
        <path d="M40 106 q6 4 12 2" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      </g>
      {mk >= 2 && (
        <g>
          <path d="M138 124 L176 22" stroke="var(--fg)" strokeWidth="5" strokeLinecap="round" />
          <path d="M138 124 L176 22" stroke="#9c6644" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M176 22 Q190 40 186 90" fill="none" stroke="var(--fg-2)" strokeWidth="1.5" />
          <g className={an(still, 'bcx-bob')} style={origin(186, 96)}>
            <ellipse cx="186" cy="96" rx="6" ry="8" fill="#e63946" {...TH} />
            <path d="M180 96 h12" stroke={PAPER} strokeWidth="3" />
          </g>
          <circle cx="138" cy="124" r="7" fill={c2} {...TH} />
        </g>
      )}
    </g>
  );
}

// ─── Kirin ──────────────────────────────────────────────────────────────────
function Kirin({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const body = `${uid}-b`;
  return (
    <g>
      <defs>
        <Shine id={body} c={c} />
      </defs>
      <Shadow rx={64} />
      {mk === 3 && (
        <g className={an(still, 'bcx-spin-slow')} style={origin(70, 40)}>
          <circle cx="70" cy="40" r="30" fill="none" stroke={c2} strokeWidth="3" />
          {Array.from({ length: 8 }, (_, i) => (
            <circle key={i} cx={70 + 30 * Math.cos((i * Math.PI) / 4)} cy={40 + 30 * Math.sin((i * Math.PI) / 4)} r="3" fill={GOLD} stroke="var(--fg)" strokeWidth="1" />
          ))}
        </g>
      )}
      {/* tail */}
      <path d="M150 112 C170 104 176 84 168 70 C186 80 186 110 160 124Z" fill={c2} {...OL} />
      {/* legs */}
      {[58, 76, 124, 142].map((x, i) => (
        <g key={x}>
          <path d={`M${x} 136 L${x + (i < 2 ? -2 : 2)} 172`} stroke="var(--fg)" strokeWidth="11" strokeLinecap="round" />
          <path d={`M${x} 136 L${x + (i < 2 ? -2 : 2)} 172`} stroke={c} strokeWidth="6" strokeLinecap="round" />
          <path d={`M${x - 7 + (i < 2 ? -2 : 2)} 178 h14 l-2 -8 h-10z`} fill={INK} {...TH} />
          {mk === 3 && <path d={flame(x + (i < 2 ? -2 : 2), 182, 16, 8)} fill={FIRE} stroke="var(--fg)" strokeWidth="1.5" className={an(still, 'i-pulse')} opacity=".9" />}
        </g>
      ))}
      {/* body */}
      <path d="M46 124 C44 100 66 92 100 94 C134 92 158 100 156 124 C154 142 134 146 100 144 C66 146 48 142 46 124Z" fill={`url(#${body})`} {...OL} />
      {Array.from({ length: 12 }, (_, i) => (
        <path key={i} d={`M${66 + (i % 6) * 14} ${110 + Math.floor(i / 6) * 12} q7 7 14 0`} fill="none" stroke={c2} strokeWidth="2" />
      ))}
      {/* neck */}
      <path d="M50 116 C44 90 50 66 62 54 L84 62 C76 78 74 96 80 112Z" fill={`url(#${body})`} {...OL} />
      {/* mane */}
      {mk >= 2 ? (
        <g className={an(still, 'bcx-sway')} style={origin(80, 70)}>
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M${80 + i * 2} ${62 + i * 14} c10 -4 20 2 18 10 c8 0 10 10 2 14 c-8 2 -14 -2 -20 -6z`} fill={lt(c2, 30)} {...TH} />
          ))}
        </g>
      ) : (
        <path d="M84 62 C92 74 92 94 84 108 C88 92 86 78 80 66Z" fill={c2} {...TH} />
      )}
      {/* head */}
      <path d="M40 46 C40 30 58 22 72 26 C84 30 90 40 88 52 C86 62 72 66 56 66 C38 66 28 62 28 56 C28 50 36 48 40 46Z" fill={`url(#${body})`} {...OL} />
      {[52, 68].map((x, i) => (
        <g key={x} transform={`rotate(${i ? 12 : -6} ${x} 26)`}>
          <path d={`M${x} 26 C${x - 2} 16 ${x + 2} 8 ${x + 6} 2 M${x + 1} 14 l-6 -6 M${x + 3} 8 l6 -4`} fill="none" stroke="var(--fg)" strokeWidth="5" strokeLinecap="round" />
          <path d={`M${x} 26 C${x - 2} 16 ${x + 2} 8 ${x + 6} 2 M${x + 1} 14 l-6 -6 M${x + 3} 8 l6 -4`} fill="none" stroke={c2} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      ))}
      <path d="M30 58 q-8 10 -16 10 M34 60 q-4 12 -12 18" fill="none" stroke={c2} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="33" cy="52" r="2" fill={INK} />
      <Eyes still={still}>
        {happy ? <path d="M54 42 q6 -6 12 0" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" /> : <><ellipse cx="60" cy="42" rx="5" ry="4" fill={INK} /><circle cx="62" cy="40" r="1.6" fill="#fff" /></>}
      </Eyes>
    </g>
  );
}

export const SECRET: BotRegistry = {
  kitsune: { Art: Kitsune, head: { x: 100, y: 42, s: 1.2 } },
  hoo: { Art: Hoo, head: { x: 100, y: 34, s: 0.75 } },
  niwatori: { Art: Niwatori, head: { x: 100, y: 34, s: 0.8 } },
  nue: { Art: Nue, head: { x: 100, y: 31, s: 1.1 } },
  ashura: { Art: Ashura, head: { x: 100, y: 22, s: 0.8 } },
  shashin: { Art: Shashin, head: { x: 100, y: 28, s: 1.2 } },
  nagareboshi: { Art: Nagareboshi, head: { x: 100, y: 52, s: 0.6 } },
  namazu: { Art: Namazu, head: { x: 100, y: 66, s: 1.2 } },
  chagama: { Art: Chagama, head: { x: 100, y: 48, s: 1 } },
  medetai: { Art: Medetai, head: { x: 100, y: 58, s: 1.1 } },
  kirin: { Art: Kirin, head: { x: 60, y: 26, s: 0.85 } },
};
