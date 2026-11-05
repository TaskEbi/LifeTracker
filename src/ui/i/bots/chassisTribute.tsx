import type { CSSProperties, ReactNode } from 'react';
import type { BotArtProps, BotRegistry } from './types';
import './chassisTribute.css';

const FG = 'var(--fg)';
const INK = '#17120e';
const RED = '#d6283b';
const WOOD = '#b98a55';
const SERIF = "Georgia, 'Times New Roman', serif";
const MONO = "ui-monospace, Menlo, Consolas, 'Courier New', monospace";
const HEAVY = "Impact, 'Arial Black', 'Helvetica Neue', sans-serif";
const round = { strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const an = (still: boolean, cls: string) => (still ? undefined : cls);
const at = (x: number, y: number): CSSProperties => ({ transformOrigin: `${x}px ${y}px` });
const mix = (a: string, pct: number, b: string) => `color-mix(in srgb, ${a} ${pct}%, ${b})`;

function Eyes({ still, children }: { still: boolean; children: ReactNode }) {
  return (
    <g className="dr-gaze">
      <g className={still ? undefined : 'i-blink'}>{children}</g>
    </g>
  );
}
const Bolt = ({ x, y, r = 2.6, f = 'var(--surf)' }: { x: number; y: number; r?: number; f?: string }) => <circle cx={x} cy={y} r={r} fill={f} stroke={FG} strokeWidth="1.5" />;
const Shadow = ({ rx = 52, y = 185 }: { rx?: number; y?: number }) => <ellipse cx="100" cy={y} rx={rx} ry="4.5" fill={FG} opacity=".13" />;
/** An outlined tube: arms, legs, cables. */
const Limb = ({ d, c, w = 5 }: { d: string; c: string; w?: number }) => (
  <>
    <path d={d} fill="none" stroke={FG} strokeWidth={w + 5} {...round} />
    <path d={d} fill="none" stroke={c} strokeWidth={w} {...round} />
  </>
);
const Foot = ({ x, y = 174, w = 28, c }: { x: number; y?: number; w?: number; c: string }) => <rect x={x - w / 2} y={y} width={w} height="9" rx="4.5" fill={c} stroke={FG} strokeWidth="3" />;

/* ------------------------------------------------------------------ Maestro */
const VIOLIN = 'M100 54 C78 54 64 64 66 82 C67 90 65 94 61 97 C72 96 81 100 81 111 C81 121 72 125 59 124 C63 128 56 134 56 144 C56 159 78 166 100 166 C122 166 144 159 144 144 C144 134 137 128 141 124 C128 125 119 121 119 111 C119 100 128 96 139 97 C135 94 133 90 134 82 C136 64 122 54 100 54 Z';
const Note = ({ x, y, f, d = 0 }: { x: number; y: number; f: string; d?: number }) => (
  <g transform={`translate(${x} ${y})`}>
    <g className="bcs-note" style={{ animationDelay: `${d}s` }}>
      <ellipse cx="-4" cy="11" rx="6.5" ry="5" transform="rotate(-22 -4 11)" fill={f} stroke={FG} strokeWidth="2" />
      <path d="M2 10 V-10 C3 -4 12 -3 11 6" fill="none" stroke={FG} strokeWidth="3.4" {...round} />
    </g>
  </g>
);
function Maestro({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const body = `${uid}-vn`;
  const glow = `${uid}-vg`;
  const saw = an(still, 'bcs-saw');
  return (
    <g>
      <defs>
        <radialGradient id={body} cx=".5" cy=".55" r=".66">
          <stop offset="0" stopColor={c2} />
          <stop offset=".5" stopColor={mix(c2, 62, c)} />
          <stop offset="1" stopColor={c} />
        </radialGradient>
        <radialGradient id={glow}>
          <stop offset="0" stopColor={c2} stopOpacity=".6" />
          <stop offset="1" stopColor={c2} stopOpacity="0" />
        </radialGradient>
      </defs>
      <Shadow rx={mk === 3 ? 66 : 48} />
      {mk === 3 && (
        <>
          <circle cx="100" cy="86" r="92" fill={`url(#${glow})`} />
          {[-1, 1].map((d) =>
            [0, 1, 2, 3, 4].map((i) => <path key={`${d}${i}`} d={`M${100 + d * 98} ${82 + i * 6} C${100 + d * 76} ${44 + i * 6} ${100 + d * 54} ${64 + i * 6} ${100 + d * 22} ${28 + i * 6}`} fill="none" stroke={c} strokeWidth="1.9" />),
          )}
          <Note x={24} y={46} f={c} />
          <Note x={60} y={26} f={c2} d={-1} />
          <Note x={146} y={26} f={c2} d={-2} />
          <Note x={178} y={50} f={c} d={-0.5} />
        </>
      )}
      <Limb d="M84 160 L79 178" c="var(--surf-2)" w={4} />
      <Limb d="M116 160 L121 178" c="var(--surf-2)" w={4} />
      <Foot x={76} w={24} c={c} />
      <Foot x={124} w={24} c={c} />
      <Limb d="M70 90 L45 104 L40 122" c="var(--surf-2)" w={4} />
      {mk === 1 ? <Limb d="M130 90 L155 104 L160 122" c="var(--surf-2)" w={4} /> : <g className={saw}><Limb d="M126 90 L170 82 L172 124" c="var(--surf-2)" w={4} /></g>}
      <circle cx="40" cy="124" r="6" fill={c} stroke={FG} strokeWidth="3" />
      {mk === 1 && <circle cx="160" cy="124" r="6" fill={c} stroke={FG} strokeWidth="3" />}
      {/* neck, pegbox and scroll */}
      <rect x="93" y="36" width="14" height="24" fill={c} stroke={FG} strokeWidth="3" />
      {[37, 45].map((y) => (
        <g key={y}>
          <path d={`M78 ${y} H122`} stroke={FG} strokeWidth="5" {...round} />
          <circle cx="77" cy={y} r="4.6" fill={c2} stroke={FG} strokeWidth="2.5" />
          <circle cx="123" cy={y} r="4.6" fill={c2} stroke={FG} strokeWidth="2.5" />
        </g>
      ))}
      <rect x="91" y="32" width="18" height="20" rx="3" fill={c} stroke={FG} strokeWidth="3" />
      <circle cx="100" cy="22" r="14" fill={c} stroke={FG} strokeWidth="3.5" />
      <path d="M100 22 c3 -4 8 0 5 5 c-3 6 -14 4 -14 -5 c0 -9 14 -12 18 -2" fill="none" stroke={c2} strokeWidth="3" {...round} />
      {/* body */}
      <path d={VIOLIN} fill={`url(#${body})`} stroke={FG} strokeWidth="4" strokeLinejoin="round" />
      <path d={VIOLIN} fill="none" stroke={INK} strokeWidth="1.3" opacity=".55" transform="translate(100 110) scale(.92) translate(-100 -110)" />
      <path d="M92 44 H108 L111 98 H89 Z" fill={INK} />
      <path d="M85 128 Q100 119 115 128 L113 133 Q100 126 87 133 Z" fill="#f4e4bd" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M92 138 H108 L104 160 H96 Z" fill={INK} />
      <path d="M96 44 V148 M99 44 V148 M101 44 V148 M104 44 V148" stroke="#fff8e6" strokeWidth="1" opacity=".9" />
      <Bolt x={75} y={72} r={2.4} f={c2} />
      <Bolt x={125} y={72} r={2.4} f={c2} />
      {/* the f-holes look at you */}
      <Eyes still={still}>
        {[-1, 1].map((d) =>
          happy ? (
            <g key={d}>
              <path d={`M${100 + d * 8} 122 Q${100 + d * 20} 100 ${100 + d * 33} 122`} fill="none" stroke={INK} strokeWidth="5.5" {...round} />
              <circle cx={100 + d * 8} cy="122" r="4" fill={INK} />
              <circle cx={100 + d * 33} cy="122" r="4" fill={INK} />
            </g>
          ) : (
            <g key={d}>
              <path d={`M${100 + d * 13} 103 C${100 + d * 29} 108 ${100 + d * 11} 134 ${100 + d * 27} 141`} fill="none" stroke={INK} strokeWidth="4.5" {...round} />
              <path d={`M${100 + d * 14} 124 l${d * 8} -3`} stroke={INK} strokeWidth="2.5" />
              <circle cx={100 + d * 13} cy="103" r="6" fill={INK} />
              <circle cx={100 + d * 27} cy="141" r="5" fill={INK} />
              <circle cx={100 + d * 11} cy="101" r="1.7" fill="#fff" />
            </g>
          ),
        )}
      </Eyes>
      {mk >= 2 && (
        <g className={saw}>
          <path d="M20 152 L178 126" stroke="#fff8e6" strokeWidth="3" />
          <path d="M14 152 Q96 126 182 118" fill="none" stroke={FG} strokeWidth="6.5" {...round} />
          <path d="M14 152 Q96 126 182 118" fill="none" stroke={c} strokeWidth="3" {...round} />
          <path d="M20 152 L178 126" stroke={FG} strokeWidth="1" opacity=".7" />
          <rect x="166" y="118" width="16" height="10" rx="2" fill={INK} stroke={FG} strokeWidth="2" transform="rotate(-8 174 123)" />
          <circle cx="172" cy="124" r="7" fill={c} stroke={FG} strokeWidth="3" />
        </g>
      )}
    </g>
  );
}

/* ----------------------------------------------------------------- Compiler */
function Compiler({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const putty = `${uid}-cc`;
  const tube = `${uid}-ct`;
  const clip = `${uid}-cl`;
  const dark = mix(c, 55, '#000');
  const rain = (x: number, s: string, d: number) => (
    <g clipPath={`url(#${clip}${x > 100 ? 'r' : 'l'})`} key={x}>
      <g className={an(still, 'bcs-rain')} style={{ animationDelay: `${d}s` }}>
        {s.split('').map((ch, i) => (
          <text key={i} x={x} y={i * 16 - 6} textAnchor="middle" fontFamily={MONO} fontSize="13" fontWeight="700" fill={c2} opacity={0.35 + (i % 4) * 0.2}>
            {ch}
          </text>
        ))}
      </g>
    </g>
  );
  return (
    <g>
      <defs>
        <linearGradient id={putty} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix(c, 8, '#f1e9d2')} />
          <stop offset="1" stopColor={mix(c, 14, '#c9bfa3')} />
        </linearGradient>
        <radialGradient id={tube} cx=".5" cy=".5" r=".72">
          <stop offset="0" stopColor={mix(c2, 26, c)} />
          <stop offset="1" stopColor={dark} />
        </radialGradient>
        <clipPath id={`${clip}l`}>
          <rect x="3" y="14" width="24" height="128" rx="4" />
        </clipPath>
        <clipPath id={`${clip}r`}>
          <rect x="173" y="14" width="24" height="128" rx="4" />
        </clipPath>
      </defs>
      <Shadow rx={mk === 1 ? 42 : 66} />
      {mk === 3 && (
        <>
          <rect x="3" y="14" width="24" height="128" rx="4" fill={dark} stroke={FG} strokeWidth="2.5" />
          <rect x="173" y="14" width="24" height="128" rx="4" fill={dark} stroke={FG} strokeWidth="2.5" />
          {rain(15, '1{0;1}0=1;0{1}', 0)}
          {rain(185, '0;1}0{1=0;1}0{', -0.9)}
        </>
      )}
      <Limb d="M72 138 V176" c="var(--surf-2)" w={7} />
      <Limb d="M128 138 V176" c="var(--surf-2)" w={7} />
      <Foot x={70} w={32} c={dark} />
      <Foot x={130} w={32} c={dark} />
      {/* antenna and the back of the tube */}
      <path d="M126 36 L140 14" stroke={FG} strokeWidth="3.5" {...round} />
      <circle cx="141" cy="12" r="5" fill={c2} stroke={FG} strokeWidth="2.5" className={an(still, 'i-pulse')} />
      <path d="M52 50 L66 32 H134 L148 50 Z" fill={`url(#${putty})`} stroke={FG} strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M78 39 H122 M84 44 H116" stroke={FG} strokeWidth="2" opacity=".55" />
      {mk === 1 &&
        [-1, 1].map((d) => (
          <g key={d}>
            <Limb d={`M${100 + d * 62} 100 L${100 + d * 80} 112 L${100 + d * 82} 128`} c="var(--surf-2)" w={4} />
            <path d={`M${100 + d * 76} 128 l${d * 6} 8 l${d * 6} -8`} fill="none" stroke={FG} strokeWidth="3.5" {...round} />
          </g>
        ))}
      {/* case and screen */}
      <rect x="36" y="46" width="128" height="96" rx="11" fill={`url(#${putty})`} stroke={FG} strokeWidth="4" />
      <rect x="47" y="55" width="106" height="66" rx="12" fill={`url(#${tube})`} stroke={INK} strokeWidth="3.5" />
      <path d="M50 66 H150 M50 73 H150 M49 80 H151 M49 87 H151 M49 94 H151 M49 101 H151 M50 108 H150" stroke="#000" strokeWidth="1.6" opacity=".3" />
      <Eyes still={still}>
        {happy ? (
          <path d="M60 90 L72 74 L84 90 M116 90 L128 74 L140 90" fill="none" stroke={c2} strokeWidth="8" strokeLinejoin="miter" strokeLinecap="square" />
        ) : (
          <>
            <rect x="66" y="66" width="12" height="12" fill={c2} />
            <rect x="66" y="96" width="12" height="12" fill={c2} />
          </>
        )}
      </Eyes>
      {happy ? (
        <rect x="88" y="102" width="24" height="7" fill={c2} />
      ) : (
        <path d="M92 62 h9 v8 h7 v8 h6 v18 h-6 v8 h-7 v8 h-9 v-8 h7 v-8 h6 v-18 h-6 v-8 h-7z" fill={c2} />
      )}
      <rect x={happy ? 118 : 128} y={happy ? 102 : 104} width="14" height="7" fill={c2} className={an(still, 'bcs-caret')} />
      <path d="M54 62 Q70 58 86 60" fill="none" stroke="#fff" strokeWidth="2.5" opacity=".28" {...round} />
      <circle cx="58" cy="131" r="5" fill={INK} stroke={FG} strokeWidth="1.5" />
      <circle cx="74" cy="131" r="5" fill={INK} stroke={FG} strokeWidth="1.5" />
      <path d="M92 127 H128 M92 131 H128 M92 135 H128" stroke={FG} strokeWidth="2" opacity=".6" />
      <circle cx="145" cy="131" r="4" fill={c2} stroke={INK} strokeWidth="1.5" />
      {mk >= 2 && (
        <>
          {[-1, 1].map((d) => {
            const p = `M${100 + d * 64} 92 C${100 + d * 92} 96 ${100 + d * 92} 142 ${100 + d * 60} 156`;
            return (
              <g key={d}>
                <path d={p} fill="none" stroke={FG} strokeWidth="14" {...round} />
                <path d={p} fill="none" stroke={c2} strokeWidth="9" {...round} />
                <path d={p} fill="none" stroke={c} strokeWidth="5" {...round} />
                <path d={p} fill="none" stroke={c2} strokeWidth="1.4" {...round} />
              </g>
            );
          })}
          <path d="M42 150 H158 L170 176 H30 Z" fill={`url(#${putty})`} stroke={FG} strokeWidth="3.5" strokeLinejoin="round" />
          {[0, 1, 2].map((r) =>
            Array.from({ length: 10 + r }, (_, i) => {
              const w = (100 + r * 24) / (10 + r);
              const x0 = 50 - r * 12;
              return <rect key={`${r}-${i}`} x={x0 + i * w} y={154 + r * 7} width={w - 2} height="5.4" rx="1" fill={INK} opacity=".8" />;
            }),
          )}
          <rect x="97" y="161" width="9" height="5.4" fill={c2} className={an(still, 'bcs-key')} />
        </>
      )}
      {mk === 3 && (
        <g className={an(still, 'bcs-stamp')}>
          <g transform="rotate(-12 148 42)">
            <rect x="122" y="26" width="52" height="30" rx="5" fill={dark} stroke={FG} strokeWidth="3" />
            <rect x="126" y="30" width="44" height="22" rx="3" fill="none" stroke={c2} strokeWidth="2" />
            <text x="148" y="48" textAnchor="middle" fontFamily={MONO} fontWeight="800" fontSize="20" fill={c2}>
              AC
            </text>
          </g>
        </g>
      )}
    </g>
  );
}

/* -------------------------------------------------------------------- Pacer */
function spring(x1: number, y1: number, x2: number, y2: number, n: number, a: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l = Math.hypot(dx, dy) || 1;
  let d = `M${x1} ${y1}`;
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1);
    const s = i % 2 ? a : -a;
    d += ` L${(x1 + dx * t + (-dy / l) * s).toFixed(1)} ${(y1 + dy * t + (dx / l) * s).toFixed(1)}`;
  }
  return `${d} L${x2} ${y2}`;
}
const Shoe = ({ c, c2, wing, flip }: { c: string; c2: string; wing: boolean; flip?: boolean }) => (
  <g>
    {wing && (
      <g transform={flip ? 'scale(1 1)' : undefined}>
        <path d="M2 -6 C-12 -22 -30 -24 -40 -22 C-34 -16 -36 -14 -40 -12 C-32 -8 -32 -6 -36 -3 C-26 0 -12 2 2 -2 Z" fill="#fff" stroke={FG} strokeWidth="2.6" strokeLinejoin="round" />
        <path d="M-6 -6 C-14 -11 -22 -14 -30 -14 M-6 -3 C-14 -5 -20 -6 -28 -6" fill="none" stroke={FG} strokeWidth="1.6" />
      </g>
    )}
    <path d="M-2 -10 H12 L20 -3 C30 -2 36 2 36 8 H-2 Z" fill={c} stroke={FG} strokeWidth="3" strokeLinejoin="round" />
    <path d="M-2 8 H36 V12 H-2 Z" fill={c2} stroke={FG} strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M14 -5 l5 5 M9 -3 l5 5" stroke={c2} strokeWidth="2" />
  </g>
);
function Pacer({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const face = mix(c2, 80, '#fff');
  const trail = `${uid}-pt`;
  const leg = (d: string) => (
    <>
      <path d={d} fill="none" stroke={FG} strokeWidth="7.5" {...round} />
      <path d={d} fill="none" stroke={c2} strokeWidth="3" {...round} />
    </>
  );
  return (
    <g>
      <defs>
        <linearGradient id={trail} x1="1" x2="0">
          <stop offset="0" stopColor={c} />
          <stop offset="1" stopColor={c} stopOpacity="0" />
        </linearGradient>
      </defs>
      <Shadow rx={60} />
      {mk === 3 &&
        [36, 66, 96, 138, 160].map((y, i) => (
          <rect key={y} className={an(still, 'bcs-streak')} style={{ animationDelay: `${-i * 0.17}s` }} x={0} y={y} width={i % 2 ? 56 : 44} height={i % 2 ? 9 : 6} rx="3" fill={`url(#${trail})`} />
        ))}
      {/* legs: one pushing off, one driving forward */}
      <g className={an(still, 'bcs-leg-a')} style={at(90, 130)}>
        {leg(spring(90, 130, 62, 166, 6, 9))}
        <g transform="translate(60 170)">
          <Shoe c={c} c2={c2} wing={mk >= 2} />
        </g>
      </g>
      <g className={an(still, 'bcs-leg-b')} style={at(110, 130)}>
        {leg(spring(110, 130, 142, 150, 5, 9))}
        <g transform="translate(142 150) rotate(-14)">
          <Shoe c={c} c2={c2} wing={mk >= 2} />
        </g>
      </g>
      {/* back arm */}
      <Limb d="M78 96 L54 112 L44 94" c="var(--surf-2)" w={4} />
      <circle cx="43" cy="90" r="6.5" fill={c} stroke={FG} strokeWidth="3" />
      {/* torso with bib */}
      <rect x="92" y="78" width="16" height="12" fill="var(--surf-2)" stroke={FG} strokeWidth="3" />
      <rect x="72" y="86" width="56" height="50" rx="11" fill={c} stroke={FG} strokeWidth="3.5" />
      <g transform="rotate(-3 100 110)">
        <rect x="77" y="92" width="46" height="36" rx="3" fill="#fff" stroke={FG} strokeWidth="2.5" />
        <rect x="77" y="92" width="46" height="7" fill={c2} stroke={FG} strokeWidth="1.8" />
        <text x="100" y="125" textAnchor="middle" fontFamily={HEAVY} fontWeight="900" fontSize="26" fill={INK}>
          42
        </text>
        {[[81, 96], [119, 96], [81, 124], [119, 124]].map(([x, y]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r="1.7" fill={INK} />
        ))}
      </g>
      {/* forward arm */}
      <Limb d="M124 98 L150 114 L160 96" c="var(--surf-2)" w={4} />
      <circle cx="161" cy="92" r="6.5" fill={c} stroke={FG} strokeWidth="3" />
      {/* stopwatch head */}
      <rect x="93" y="11" width="14" height="12" fill={c2} stroke={FG} strokeWidth="3" />
      <rect x="88" y="5" width="24" height="8" rx="3" fill={c} stroke={FG} strokeWidth="3" />
      <rect x="124" y="16" width="11" height="9" rx="2" fill={c2} stroke={FG} strokeWidth="2.6" transform="rotate(38 130 20)" />
      <rect x="65" y="16" width="11" height="9" rx="2" fill={c2} stroke={FG} strokeWidth="2.6" transform="rotate(-38 70 20)" />
      <circle cx="100" cy="51" r="33" fill={c} stroke={FG} strokeWidth="4" />
      <circle cx="100" cy="51" r="25.5" fill={face} stroke={INK} strokeWidth="2" />
      {Array.from({ length: 12 }, (_, i) => (
        <path key={i} d="M100 28 V33" stroke={INK} strokeWidth={i % 3 ? 1.4 : 2.8} transform={`rotate(${i * 30} 100 51)`} />
      ))}
      {/* the two subdials are the eyes */}
      <Eyes still={still}>
        {[88, 112].map((x) =>
          happy ? (
            <path key={x} d={`M${x - 8} 53 Q${x} 41 ${x + 8} 53`} fill="none" stroke={INK} strokeWidth="4.2" {...round} />
          ) : (
            <g key={x}>
              <circle cx={x} cy="49" r="8" fill="#fff" stroke={INK} strokeWidth="2.2" />
              <circle cx={x} cy="49" r="3.8" fill={INK} />
            </g>
          ),
        )}
      </Eyes>
      <g className={an(still, 'bcs-sweep')} style={still ? undefined : at(100, 51)} transform={still ? 'rotate(36 100 51)' : undefined}>
        <path d="M100 58 V29" stroke={c} strokeWidth="2.6" strokeLinecap="round" />
      </g>
      <circle cx="100" cy="51" r="2.5" fill={c} stroke={INK} strokeWidth="1" />
      {mk === 3 && (
        <>
          <path d="M0 130 C30 138 50 128 72 134 L74 145 C50 139 30 150 0 142 Z" fill={c2} stroke={FG} strokeWidth="2.8" strokeLinejoin="round" className={an(still, 'bcs-flag')} />
          <path d="M72 128 Q100 150 128 128 L128 141 Q100 160 72 141 Z" fill={c2} stroke={FG} strokeWidth="2.8" strokeLinejoin="round" />
          <path d="M128 128 C150 124 170 136 200 126 L200 138 C170 148 150 136 128 141 Z" fill={c2} stroke={FG} strokeWidth="2.8" strokeLinejoin="round" className={an(still, 'bcs-flag')} />
          <text x="100" y="147" textAnchor="middle" fontFamily={HEAVY} fontWeight="900" fontSize="10.5" fill={c}>
            FINISH
          </text>
        </>
      )}
    </g>
  );
}

/* ----------------------------------------------------------------- Ironclad */
function Ironclad({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const steel = `${uid}-ib`;
  const leg = `${uid}-il`;
  const hazard = `${uid}-ih`;
  const plate = (x: number, y: number) => (
    <g key={x}>
      <circle cx={x} cy={y} r="23" fill={`url(#${leg})`} stroke={FG} strokeWidth="3.5" />
      <circle cx={x} cy={y} r="16" fill="none" stroke={c2} strokeWidth="3" />
      <circle cx={x} cy={y} r="6" fill="var(--surf)" stroke={FG} strokeWidth="2.5" />
    </g>
  );
  return (
    <g>
      <defs>
        <radialGradient id={steel} cx=".36" cy=".3" r=".85">
          <stop offset="0" stopColor={mix(c, 55, '#b8bec4')} />
          <stop offset=".6" stopColor={c} />
          <stop offset="1" stopColor={mix(c, 70, '#000')} />
        </radialGradient>
        <linearGradient id={leg} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={mix(c, 75, '#c8ccd0')} />
          <stop offset="1" stopColor={mix(c, 80, '#000')} />
        </linearGradient>
        <pattern id={hazard} width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="16" height="16" fill={INK} />
          <rect width="8" height="16" fill={c2} />
        </pattern>
      </defs>
      <Shadow rx={mk === 3 ? 92 : 58} y={186} />
      {mk === 3 && (
        <>
          <rect x="6" y="177" width="188" height="10" rx="2" fill={`url(#${hazard})`} stroke={FG} strokeWidth="3" />
          {[[22, 160, 14], [40, 168, 10], [178, 160, 14], [160, 168, 10], [10, 148, 8], [190, 148, 8]].map(([x, y, r], i) => (
            <circle key={x} cx={x} cy={y} r={r} fill="var(--surf)" stroke={FG} strokeWidth="2.2" opacity=".95" className={an(still, 'bcs-puff')} style={{ animationDelay: `${-i * 0.5}s` }} />
          ))}
        </>
      )}
      {/* those legs: nobody skipped them */}
      {[-1, 1].map((d) => (
        <g key={d}>
          <path d={`M${100 + d * 14} 128 C${100 + d * 66} 124 ${100 + d * 66} 164 ${100 + d * 42} 172 H${100 + d * 12} C${100 + d * 8} 158 ${100 + d * 8} 142 ${100 + d * 14} 128 Z`} fill={`url(#${leg})`} stroke={FG} strokeWidth="3.5" strokeLinejoin="round" />
          <path d={`M${100 + d * 28} 138 C${100 + d * 44} 142 ${100 + d * 46} 156 ${100 + d * 36} 166`} fill="none" stroke={c2} strokeWidth="3" {...round} />
          <rect x={100 + (d < 0 ? -56 : 8)} y="169" width="48" height="11" rx="4" fill={INK} stroke={FG} strokeWidth="3" />
        </g>
      ))}
      <g className={an(still, 'bcs-squat')}>
        {mk >= 2 && (
          <g className={an(still, 'bcs-press')}>
            <rect x="2" y="46" width="196" height="6" fill="var(--surf-2)" stroke={FG} strokeWidth="2.6" />
            {[-1, 1].map((d) => (
              <g key={d} transform={d > 0 ? 'translate(200 0) scale(-1 1)' : undefined}>
                <rect x="4" y="30" width="8" height="38" rx="2" fill={c} stroke={FG} strokeWidth="2.6" />
                <rect x="12" y="15" width="12" height="68" rx="3" fill={c2} stroke={FG} strokeWidth="3" />
                <rect x="24" y="24" width="9" height="50" rx="2" fill={c} stroke={FG} strokeWidth="3" />
                <rect x="33" y="44" width="4" height="10" fill={FG} />
                <rect x="47" y="52" width="9" height="34" fill="var(--surf-2)" stroke={FG} strokeWidth="3" />
                <rect x="44" y="42" width="15" height="14" rx="4" fill={c} stroke={FG} strokeWidth="3" />
              </g>
            ))}
          </g>
        )}
        {/* the handle and the bell */}
        <path d="M72 62 C60 18 140 18 128 62" fill="none" stroke={FG} strokeWidth="19" {...round} />
        <path d="M72 62 C60 18 140 18 128 62" fill="none" stroke={c} strokeWidth="11.5" {...round} />
        <path d="M78 42 C86 32 114 32 122 42" fill="none" stroke="#fff" strokeWidth="2.2" opacity=".3" {...round} />
        {mk === 1 &&
          [-1, 1].map((d) => (
            <g key={d}>
              <Limb d={`M${100 + d * 62} 106 L${100 + d * 72} 122`} c="var(--surf-2)" w={5} />
              <circle cx={100 + d * 73} cy="127" r="6.5" fill={c} stroke={FG} strokeWidth="3" />
            </g>
          ))}
        {mk >= 2 && [-1, 1].map((d) => <Bolt key={d} x={100 + d * 48} y={70} r={0.1} />)}
        {plate(50, 88)}
        {plate(150, 88)}
        <path d="M100 48 C130 48 150 72 150 98 C150 124 130 146 100 146 C70 146 50 124 50 98 C50 72 70 48 100 48 Z" fill={`url(#${steel})`} stroke={FG} strokeWidth="4" />
        <path d="M66 70 C72 60 84 54 96 54" fill="none" stroke="#fff" strokeWidth="3" opacity=".35" {...round} />
        {/* visor */}
        <rect x="63" y="74" width="74" height="24" rx="5" fill="#0c0e10" stroke={FG} strokeWidth="3" />
        <Eyes still={still}>
          {[-1, 1].map((d) =>
            happy ? (
              <path key={d} d={`M${100 + d * 19 - 11} 90 Q${100 + d * 19} 76 ${100 + d * 19 + 11} 90`} fill="none" stroke={c2} strokeWidth="5" {...round} />
            ) : (
              <rect key={d} x={100 + d * 19 - 12} y="80" width="24" height="12" rx="1.5" fill={c2} />
            ),
          )}
        </Eyes>
        {[58, 142].map((x) => [68, 104].map((y) => <Bolt key={`${x}${y}`} x={x} y={y} r={2.2} f={mix(c, 60, '#ccc')} />))}
        <text x="100" y={mk === 3 ? 117 : 128} textAnchor="middle" fontFamily={HEAVY} fontWeight="900" fontSize={mk === 3 ? 20 : 27} letterSpacing="1" fill={c2}>
          32
        </text>
        {mk === 3 && (
          <>
            <path d="M57 124 Q100 138 143 124 L138 141 Q100 152 62 141 Z" fill="#6d3f1f" stroke={FG} strokeWidth="3" strokeLinejoin="round" />
            <rect x="86" y="127" width="28" height="19" rx="3" fill={c2} stroke={FG} strokeWidth="3" />
            <rect x="92" y="131" width="16" height="11" fill="#6d3f1f" stroke={INK} strokeWidth="1.5" />
            <path d="M100 136.5 H110" stroke={INK} strokeWidth="2.5" />
          </>
        )}
      </g>
    </g>
  );
}

/* ------------------------------------------------------------------ Scholar */
function Scholar({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const slate = `${uid}-sb`;
  const chalk = mix(c2, 45, '#fff');
  const board = mix(c, 82, '#000');
  const items = ['π', 'Σ', '√x', '∞', 'x²', '∫'];
  return (
    <g>
      <defs>
        <linearGradient id={slate} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c} />
          <stop offset="1" stopColor={board} />
        </linearGradient>
      </defs>
      <Shadow rx={mk === 1 ? 58 : 70} />
      {mk === 3 && (
        <g className={an(still, 'bcs-orbit')} style={at(100, 96)}>
          {items.map((t, i) => {
            const a = (i * Math.PI) / 3 + 0.5;
            const x = +(100 + 83 * Math.cos(a)).toFixed(1);
            const y = +(96 + 83 * Math.sin(a)).toFixed(1);
            return (
              <g key={t} className={an(still, 'bcs-counter')}>
                <circle cx={x} cy={y} r="15" fill={board} stroke={FG} strokeWidth="2.6" />
                <text x={x} y={y + 5.5} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontWeight="700" fontSize={t.length > 1 ? 14 : 17} fill={chalk}>
                  {t}
                </text>
              </g>
            );
          })}
        </g>
      )}
      {/* easel legs */}
      <path d="M100 140 V178" stroke={FG} strokeWidth="8" {...round} />
      <path d="M100 140 V178" stroke={mix(WOOD, 70, '#000')} strokeWidth="3.5" {...round} />
      <Limb d="M60 142 L44 176" c={WOOD} w={6} />
      <Limb d="M140 142 L156 176" c={WOOD} w={6} />
      <Foot x={42} y={174} w={24} c={c} />
      <Foot x={158} y={174} w={24} c={c} />
      {mk === 1 &&
        [-1, 1].map((d) => (
          <g key={d}>
            <Limb d={`M${100 + d * 68} 104 L${100 + d * 82} 118 L${100 + d * 80} 132`} c="var(--surf-2)" w={4} />
            <circle cx={100 + d * 80} cy="135" r="5.5" fill={c} stroke={FG} strokeWidth="3" />
          </g>
        ))}
      {/* board */}
      <rect x="32" y="56" width="136" height="88" rx="5" fill={WOOD} stroke={FG} strokeWidth="4" />
      <rect x="41" y="64" width="118" height="72" rx="2" fill={`url(#${slate})`} stroke={INK} strokeWidth="2.5" />
      <path d="M50 76 C70 70 92 82 118 74 M112 126 C126 120 138 128 150 122" fill="none" stroke="#fff" strokeWidth="6" opacity=".07" {...round} />
      {[[36, 60], [164, 60], [36, 140], [164, 140]].map(([x, y]) => (
        <Bolt key={`${x}${y}`} x={x} y={y} r={2.4} f={c2} />
      ))}
      <Eyes still={still}>
        {[76, 124].map((x) =>
          happy ? (
            <path key={x} d={`M${x - 13} 92 Q${x} 72 ${x + 13} 92`} fill="none" stroke={chalk} strokeWidth="5.5" {...round} />
          ) : (
            <g key={x}>
              <circle cx={x} cy="86" r="12" fill="none" stroke={chalk} strokeWidth="3.8" />
              <circle cx={x} cy="87" r="4.8" fill={chalk} />
            </g>
          ),
        )}
      </Eyes>
      {/* the mouth is a tick: full marks */}
      <g className={an(still, 'bcs-tick')}>
        <path d="M78 110 L92 125 L126 101" fill="none" stroke={c2} strokeWidth="7.5" {...round} />
      </g>
      {happy && (
        <text x="141" y="128" textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontWeight="700" fontSize="17" fill={chalk}>
          A+
        </text>
      )}
      {/* tray */}
      <rect x={mk >= 2 ? 16 : 26} y="141" width={mk >= 2 ? 168 : 148} height="9" rx="3" fill={WOOD} stroke={FG} strokeWidth="3.2" />
      <rect x="58" y="136" width="24" height="6" rx="2.5" fill="#fff" stroke={FG} strokeWidth="1.8" />
      <rect x="120" y="136" width="15" height="6" rx="2.5" fill={c2} stroke={FG} strokeWidth="1.8" />
      {mk >= 2 && (
        <>
          <Limb d="M20 144 L10 124 L24 104" c="var(--surf-2)" w={4} />
          <rect x="20" y="82" width="9" height="24" rx="3" fill="#fff" stroke={FG} strokeWidth="2.6" transform="rotate(14 24 94)" />
          <circle cx="24" cy="104" r="6" fill={c} stroke={FG} strokeWidth="3" />
          <Limb d="M180 144 L190 126 L180 110" c="var(--surf-2)" w={4} />
          <g transform="rotate(14 180 88)">
            <rect x="172" y="30" width="16" height="108" rx="2" fill={c2} stroke={FG} strokeWidth="3" />
            {Array.from({ length: 13 }, (_, i) => (
              <path key={i} d={`M172 ${38 + i * 7.6} h${i % 2 ? 5 : 9}`} stroke={INK} strokeWidth="1.6" />
            ))}
          </g>
          <circle cx="180" cy="110" r="6" fill={c} stroke={FG} strokeWidth="3" />
        </>
      )}
      {/* mortarboard */}
      <path d="M72 42 V60 Q100 68 128 60 V42 Z" fill={board} stroke={FG} strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M100 14 L168 36 L100 58 L32 36 Z" fill={c} stroke={FG} strokeWidth="4" strokeLinejoin="round" />
      <path d="M100 20 L154 36" stroke="#fff" strokeWidth="2" opacity=".22" {...round} />
      <circle cx="100" cy="36" r="4.5" fill={c2} stroke={FG} strokeWidth="2.2" />
      {mk === 3 && (
        <g className={an(still, 'bcs-swing')} style={at(100, 36)}>
          <path d="M100 36 L150 42 L152 66" fill="none" stroke={c2} strokeWidth="3.2" />
          <path d="M147 66 H157 L160 88 H144 Z" fill={c2} stroke={FG} strokeWidth="2.6" strokeLinejoin="round" />
          <rect x="146" y="62" width="12" height="7" rx="2" fill={c} stroke={FG} strokeWidth="2.2" />
        </g>
      )}
    </g>
  );
}

/* ------------------------------------------------------------------- Knight */
const HORSE = 'M58 146 C50 112 54 72 82 44 L84 22 L98 36 C122 38 142 58 150 84 C154 96 146 108 132 104 C122 100 114 94 108 96 C112 112 136 124 142 146 Z';
function Knight({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const clip = `${uid}-kh`;
  const hem = `${uid}-kb`;
  return (
    <g className={an(still, 'bcs-lhop')}>
      <defs>
        <clipPath id={clip}>
          <path d={HORSE} />
        </clipPath>
        <clipPath id={hem}>
          <path d="M42 124 H158 L168 170 L155 163 L142 170 L128 163 L114 170 L100 163 L86 170 L72 163 L58 170 L44 163 L32 170 Z" />
        </clipPath>
      </defs>
      <Shadow rx={mk === 3 ? 84 : 58} />
      {mk === 3 && (
        <g>
          {Array.from({ length: 10 }, (_, i) => (
            <rect key={i} x={10 + i * 18} y="175" width="18" height="10" fill={i % 2 ? c : c2} />
          ))}
          <rect x="10" y="175" width="180" height="10" fill="none" stroke={FG} strokeWidth="3" />
        </g>
      )}
      {/* an antenna bent like the move: two up, one across */}
      <path d="M74 54 V18 H56" fill="none" stroke={FG} strokeWidth="4" {...round} />
      <circle cx="54" cy="18" r="6" fill={RED} stroke={FG} strokeWidth="2.6" className={an(still, 'i-pulse')} />
      {mk < 3 && (
        <>
          <Foot x={72} y={mk === 2 ? 172 : 173} w={32} c={c} />
          <Foot x={128} y={mk === 2 ? 172 : 173} w={32} c={c} />
        </>
      )}
      <Limb d="M60 124 L38 136 L34 118" c="var(--surf-2)" w={4} />
      <circle cx="33" cy="114" r="6" fill={c2} stroke={FG} strokeWidth="3" />
      {/* horse */}
      <path d={HORSE} fill={c} stroke={FG} strokeWidth="4" strokeLinejoin="round" />
      <g clipPath={`url(#${clip})`} opacity=".42">
        {Array.from({ length: 13 }, (_, i) => (
          <path key={i} d={`M${20 + i * 7} 150 L${70 + i * 7} 60`} stroke={c2} strokeWidth="1.8" />
        ))}
        <path d="M84 150 C80 124 92 106 108 96 L150 150 Z" fill={c} />
      </g>
      {/* mane */}
      <path d="M82 44 L70 46 L76 56 L62 60 L70 70 L56 76 L66 84 L52 94 L62 100 L50 114 L60 118 L54 134 C50 104 58 68 82 44 Z" fill={c2} stroke={FG} strokeWidth="2.8" strokeLinejoin="round" />
      {/* visor */}
      <path d="M90 42 L104 38 C122 42 138 58 144 76 L100 84 L88 68 Z" fill={mix(c2, 80, c)} stroke={FG} strokeWidth="3" strokeLinejoin="round" />
      <path d="M95 60 L136 62 L138 72 L98 74 Z" fill="#0c0d14" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      <Eyes still={still}>
        {happy ? (
          <path d="M104 72 Q114 58 126 71" fill="none" stroke={RED} strokeWidth="5" {...round} />
        ) : (
          <rect x="106" y="62.5" width="22" height="8.5" rx="2" fill={RED} />
        )}
      </Eyes>
      <Bolt x={99} y={50} r={2.3} f={c} />
      <Bolt x={118} y={51} r={2.3} f={c} />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={128 + i * 6} cy={85 + i * 1.5} r="1.8" fill={c2} />
      ))}
      <path d="M134 98 Q142 100 146 94" fill="none" stroke={c2} strokeWidth="2.4" {...round} />
      {/* base */}
      <rect x="50" y="142" width="100" height="10" rx="3" fill={mix(c2, 85, c)} stroke={FG} strokeWidth="3.2" />
      <path d="M46 152 H154 L162 176 H38 Z" fill={c} stroke={FG} strokeWidth="4" strokeLinejoin="round" />
      <path d="M50 160 H150" stroke={c2} strokeWidth="2.2" />
      {mk >= 2 && (
        <g>
          <g clipPath={`url(#${hem})`}>
            <rect x="30" y="120" width="140" height="54" fill={c2} />
            {Array.from({ length: 28 }, (_, i) => {
              const row = Math.floor(i / 7);
              const col = i % 7;
              return (row + col) % 2 ? <rect key={i} x={30 + col * 20} y={124 + row * 13} width="20" height="13" fill={c} /> : null;
            })}
          </g>
          <path d="M42 124 H158 L168 170 L155 163 L142 170 L128 163 L114 170 L100 163 L86 170 L72 163 L58 170 L44 163 L32 170 Z" fill="none" stroke={FG} strokeWidth="3.4" strokeLinejoin="round" />
          <path d="M42 124 H158" stroke={c2} strokeWidth="3" />
        </g>
      )}
      {mk === 3 && (
        <>
          <path d="M72 34 L66 8 L80 20 L90 2 L100 20 L114 8 L108 34 Q90 42 72 34 Z" fill={c2} stroke={FG} strokeWidth="3" strokeLinejoin="round" />
          <circle cx="90" cy="28" r="3" fill={RED} stroke={FG} strokeWidth="1.4" />
          <Limb d="M142 128 L172 124 L176 104" c="var(--surf-2)" w={4} />
          <g transform="translate(176 72)">
            <path d="M-9 26 Q0 18 9 26 Z" fill={c2} stroke={FG} strokeWidth="2.6" strokeLinejoin="round" />
            <path d="M-6 22 L-8 8 L-13 -4 L-5 2 L0 -9 L5 2 L13 -4 L8 8 L6 22 Z" fill={c2} stroke={FG} strokeWidth="2.6" strokeLinejoin="round" />
            <circle cx="0" cy="-11" r="3" fill={RED} stroke={FG} strokeWidth="1.6" />
          </g>
          <circle cx="176" cy="102" r="6.5" fill={c2} stroke={FG} strokeWidth="3" />
        </>
      )}
    </g>
  );
}

/* ------------------------------------------------------------------ Dreamer */
function Dreamer({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const moon = `${uid}-dm`;
  const sky = `${uid}-ds`;
  const pil = `${uid}-dp`;
  const ink = mix(c, 72, '#000');
  const stars = [[150, 18], [172, 34], [186, 62], [160, 66], [24, 34], [14, 72]];
  return (
    <g>
      <defs>
        <radialGradient id={moon} cx=".3" cy=".4" r=".85">
          <stop offset="0" stopColor={mix(c2, 72, '#fff')} />
          <stop offset="1" stopColor={mix(c2, 78, c)} />
        </radialGradient>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix(c, 68, '#000')} />
          <stop offset="1" stopColor={c} />
        </linearGradient>
        <linearGradient id={pil} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor={mix(c2, 55, '#fff')} />
        </linearGradient>
      </defs>
      <Shadow rx={60} />
      {mk === 3 && (
        <>
          <circle cx="100" cy="92" r="92" fill={`url(#${sky})`} stroke={FG} strokeWidth="3" />
          <path d="M150 18 L172 34 L186 62 L160 66 Z" fill="none" stroke={c2} strokeWidth="1.8" opacity=".85" />
          {stars.map(([x, y], i) => (
            <path key={i} d={`M${x} ${y - 6} L${x + 1.8} ${y - 1.8} L${x + 6} ${y} L${x + 1.8} ${y + 1.8} L${x} ${y + 6} L${x - 1.8} ${y + 1.8} L${x - 6} ${y} L${x - 1.8} ${y - 1.8} Z`} fill={c2} className={an(still, 'bcs-twinkle')} style={{ animationDelay: `${-i * 0.5}s` }} />
          ))}
        </>
      )}
      <g className={an(still, 'bcs-rock')} style={at(92, 170)}>
        <g transform="translate(6 0)">
          <Limb d="M72 156 L68 174" c="var(--surf-2)" w={4} />
          <Limb d="M100 158 L104 174" c="var(--surf-2)" w={4} />
          <Foot x={64} w={28} c={c} />
          <Foot x={108} w={28} c={c} />
          {/* crescent */}
          <path d="M123.5 38 A66 66 0 1 0 147.1 132.3 A50 50 0 1 1 123.5 38 Z" fill={`url(#${moon})`} stroke={FG} strokeWidth="4" strokeLinejoin="round" />
          <circle cx="50" cy="132" r="6" fill="none" stroke={c} strokeWidth="2" opacity=".35" />
          <circle cx="82" cy="146" r="4" fill="none" stroke={c} strokeWidth="2" opacity=".35" />
          <path d="M34 112 Q52 148 98 152" fill="none" stroke={c} strokeWidth="1.8" opacity=".4" strokeDasharray="4 4" />
          <Bolt x={32} y={94} r={2} f={mix(c2, 50, c)} />
          <Bolt x={108} y={154} r={2} f={mix(c2, 50, c)} />
          {/* pillow */}
          <path d="M86 70 C100 76 124 76 148 66 C142 86 144 104 150 122 C128 112 104 112 84 122 C90 104 90 88 86 70 Z" fill={`url(#${pil})`} stroke={FG} strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M100 86 Q118 92 136 84 M100 104 Q118 98 136 106" fill="none" stroke={c} strokeWidth="1.8" opacity=".35" {...round} />
          {/* hug */}
          <Limb d="M70 76 C86 62 104 70 112 86" c={mix(c2, 72, c)} w={5} />
          <circle cx="113" cy="89" r="6" fill={c} stroke={FG} strokeWidth="2.8" />
          <Limb d="M82 132 C96 128 112 122 118 104" c={mix(c2, 72, c)} w={5} />
          <circle cx="119" cy="101" r="6" fill={c} stroke={FG} strokeWidth="2.8" />
          {/* face */}
          <Eyes still={still}>
            {[42, 63].map((x) =>
              happy ? (
                <path key={x} d={`M${x - 7} 93 Q${x} 82 ${x + 7} 93`} fill="none" stroke={ink} strokeWidth="4" {...round} />
              ) : (
                <g key={x}>
                  <path d={`M${x - 7.5} 87 A7.5 7.5 0 0 0 ${x + 7.5} 87 Z`} fill={ink} />
                  <path d={`M${x - 9} 87 H${x + 9}`} stroke={ink} strokeWidth="3.4" {...round} />
                </g>
              ),
            )}
          </Eyes>
          <path d="M46 106 Q53 113 60 106" fill="none" stroke={ink} strokeWidth="3" {...round} />
          <circle cx="34" cy="102" r="4.5" fill={c} opacity=".22" />
          <circle cx="70" cy="102" r="4.5" fill={c} opacity=".22" />
          {/* nightcap */}
          <path d="M60 46 C72 24 112 6 138 10 C158 12 172 26 174 50 C164 36 152 30 138 32 C136 44 130 54 124 62 C104 58 80 52 60 46 Z" fill={c} stroke={FG} strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M106 16 C110 28 112 44 112 58 M124 10 C128 22 128 40 124 60 M150 16 C150 22 146 28 140 32" fill="none" stroke={c2} strokeWidth="5" />
          <path d="M56 44 C80 56 108 62 128 64" fill="none" stroke={FG} strokeWidth="13" {...round} />
          <path d="M56 44 C80 56 108 62 128 64" fill="none" stroke={c2} strokeWidth="7.5" {...round} />
          <circle cx="175" cy="58" r="9" fill={c2} stroke={FG} strokeWidth="3" />
        </g>
      </g>
      {mk >= 2 && (
        <g>
          <path d="M148 158 V180 M158 158 V180 M144 164 H162 M144 172 H162" stroke={FG} strokeWidth="3" {...round} />
          <g transform="translate(172 150)">
            <g className={an(still, 'bcs-sheep')}>
              <path d="M-8 12 V24 M8 12 V24" stroke={FG} strokeWidth="3.4" {...round} />
              <path d="M-16 10 a7 7 0 0 1 2 -12 a8 8 0 0 1 13 -5 a8 8 0 0 1 14 4 a7 7 0 0 1 2 13 a8 8 0 0 1 -13 4 a8 8 0 0 1 -18 -4 Z" fill="#fff" stroke={FG} strokeWidth="2.8" strokeLinejoin="round" />
              <ellipse cx="-16" cy="1" rx="6.5" ry="8" fill={INK} stroke={FG} strokeWidth="1.5" />
              <circle cx="-18" cy="-1" r="1.6" fill="#fff" />
              <circle cx="7" cy="0" r="2" fill={c} stroke={FG} strokeWidth="1" />
              <path d="M5 -7 V-12" stroke={FG} strokeWidth="2" />
              <circle cx="5" cy="-13.5" r="2" fill={c} stroke={FG} strokeWidth="1" />
            </g>
          </g>
        </g>
      )}
      {mk === 3 &&
        [[28, 134, 13], [14, 112, 17], [30, 18 + 90 - 6, 0]].filter(([, , s]) => s).map(([x, y, s], i) => (
          <text key={x} x={x} y={y} fontFamily={SERIF} fontWeight="700" fontSize={s} fill={c2} className={an(still, 'bcs-z')} style={{ animationDelay: `${-i * 1.2}s` }}>
            Z
          </text>
        ))}
    </g>
  );
}

/* --------------------------------------------------------------------- Monk */
function Monk({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const stone = `${uid}-ms`;
  const brush = mix(c, 72, FG);
  const stoneAt = (cx: number, cy: number, rx: number, ry: number, r: number, m: number) => (
    <g key={`${cx}${cy}`} transform={`rotate(${r} ${cx} ${cy})`}>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={m ? mix(c, 72, c2) : `url(#${stone})`} stroke={FG} strokeWidth="3.6" />
      <path d={`M${cx - rx * 0.62} ${cy - ry * 0.3} Q${cx - rx * 0.1} ${cy - ry * 0.85} ${cx + rx * 0.36} ${cy - ry * 0.6}`} fill="none" stroke="#fff" strokeWidth="2.4" opacity=".35" {...round} />
      <path d={`M${cx - rx * 0.92} ${cy + ry * 0.2} Q${cx} ${cy + ry * 0.74} ${cx + rx * 0.92} ${cy + ry * 0.2}`} fill="none" stroke={INK} strokeWidth="1.5" opacity=".35" />
    </g>
  );
  return (
    <g>
      <defs>
        <linearGradient id={stone} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={mix(c, 60, c2)} />
          <stop offset="1" stopColor={c} />
        </linearGradient>
      </defs>
      <Shadow rx={mk === 3 ? 0.1 : 62} />
      {mk === 3 && (
        <>
          <ellipse cx="100" cy="172" rx="98" ry="22" fill={c2} stroke={FG} strokeWidth="3.2" />
          {[[78, 16], [64, 13], [50, 10]].map(([rx, ry]) => (
            <ellipse key={rx} cx="100" cy="172" rx={rx + 6} ry={ry} fill="none" stroke={c} strokeWidth="1.8" opacity=".75" />
          ))}
        </>
      )}
      {mk >= 2 && (
        <g>
          <path d="M136 25 A82 82 0 1 0 170 54" fill="none" stroke={brush} strokeWidth="9" {...round} />
          <path d="M128 18 A86 86 0 0 0 26 76" fill="none" stroke={brush} strokeWidth="4" {...round} />
          <path d="M30 138 A80 80 0 0 0 112 178" fill="none" stroke={brush} strokeWidth="13" {...round} />
        </g>
      )}
      {mk === 3 && (
        <g>
          {/* bamboo stalks */}
          <g>
            {[[14, 44, 8], [26, 74, 7]].map(([x, top, w]) => (
              <g key={x}>
                <rect x={x - w / 2} y={top} width={w} height={172 - top} rx="2" fill={c} stroke={FG} strokeWidth="2.6" />
                {[0, 1, 2, 3].map((i) => <path key={i} d={`M${x - w / 2} ${top + 20 + i * 24} h${w}`} stroke={FG} strokeWidth="2.4" />)}
              </g>
            ))}
            <path d="M14 44 Q2 34 0 20 Q12 26 14 44 M26 74 Q40 62 42 50 Q28 56 26 74" fill={c} stroke={FG} strokeWidth="2" strokeLinejoin="round" />
          </g>
          {/* the deer-scarer */}
          <path d="M172 176 V126 M186 176 V126" stroke={FG} strokeWidth="5" {...round} />
          <path d="M172 176 V126 M186 176 V126" stroke={c} strokeWidth="1.8" {...round} />
          <g className={an(still, 'bcs-shishi')} style={at(179, 132)}>
            <path d="M138 122 L198 138" stroke={FG} strokeWidth="13.5" strokeLinecap="round" />
            <path d="M138 122 L198 138" stroke={c} strokeWidth="8" strokeLinecap="round" />
            <path d="M162 124 l-2 8" stroke={FG} strokeWidth="2.2" />
          </g>
          <circle cx="179" cy="132" r="3.2" fill={c2} stroke={FG} strokeWidth="1.8" />
          <circle cx="137" cy="136" r="3.2" fill="#6fb6d8" stroke={FG} strokeWidth="1.3" className={an(still, 'bcs-drip')} />
        </g>
      )}
      <Limb d="M78 168 V177" c="var(--surf-2)" w={5} />
      <Limb d="M122 168 V177" c="var(--surf-2)" w={5} />
      <Foot x={74} y={175} w={26} c={c} />
      <Foot x={126} y={175} w={26} c={c} />
      {stoneAt(100, 154, 66, 20, -1.5, 0)}
      {stoneAt(102, 124, 50, 15, 2, 1)}
      <Bolt x={52} y={150} r={2.2} f={c2} />
      <Bolt x={148} y={150} r={2.2} f={c2} />
      {/* little limbs, palm to palm */}
      {[-1, 1].map((d) => (
        <g key={d}>
          <Limb d={`M${100 + d * 48} 96 L${100 + d * 68} 96 L${100 + d * 72} 82`} c="var(--surf-2)" w={4} />
          <circle cx={100 + d * 72} cy="78" r="6" fill={c} stroke={FG} strokeWidth="2.8" />
        </g>
      ))}
      {/* the phone, face down in every way that matters */}
      <rect x="50" y="72" width="100" height="40" rx="9" fill="#23282c" stroke={FG} strokeWidth="3.6" />
      <rect x="57" y="77" width="86" height="30" rx="4" fill={mix(c, 34, '#080c0a')} />
      <circle cx="53.5" cy="92" r="1.4" fill={c2} />
      <rect x="83" y="69" width="18" height="3" rx="1.5" fill={FG} />
      <Eyes still={still}>
        {[78, 122].map((x) =>
          happy ? (
            <path key={x} d={`M${x - 9} 95 Q${x} 82 ${x + 9} 95`} fill="none" stroke={c2} strokeWidth="4.2" {...round} />
          ) : (
            <path key={x} d={`M${x - 9} 88 Q${x} 98 ${x + 9} 88`} fill="none" stroke={c2} strokeWidth="4.2" {...round} />
          ),
        )}
      </Eyes>
      <path d="M133 80 a4.5 4.5 0 1 0 5 6 a4 4 0 0 1 -5 -6 Z" fill={c2} className={an(still, 'i-pulse')} />
      {/* top stones keep their balance */}
      <g className={an(still, 'bcs-balance')} style={at(100, 70)}>
        {stoneAt(98, 57, 32, 14, -3, 0)}
        {stoneAt(103, 34, 17, 10, 4, 1)}
        <Bolt x={103} y={22} r={0.1} />
      </g>
    </g>
  );
}

/* ------------------------------------------------------------------ Curator */
function Curator({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const wood = `${uid}-kw`;
  const eyeBall = mix(c2, 60, '#fff');
  const jars: [number, number, ReactNode][] = [
    [15, 22, <path key="b" d="M0 2 C-9 -8 -11 4 -3 6 C-9 10 -4 13 0 6 C4 13 9 10 3 6 C11 4 9 -8 0 2 Z" fill={c2} stroke={INK} strokeWidth="1.2" />],
    [105, 22, <path key="f" d="M0 13 V-6 M0 8 q-8 -1 -9 -8 q8 0 9 6 M0 2 q7 -1 8 -8 q-7 0 -8 6" fill="none" stroke={c} strokeWidth="2.4" {...round} />],
    [195, 22, <g key="e"><circle cy="3" r="7" fill="#fff" stroke={INK} strokeWidth="1.5" /><circle cy="3" r="3" fill={c} /></g>],
    [285, 22, <path key="s" d="M-7 9 C-12 -8 10 -12 9 2 C8 9 -2 9 -2 2 C-2 -3 4 -3 4 2" fill="none" stroke={c} strokeWidth="2.6" {...round} />],
  ];
  return (
    <g>
      <defs>
        <linearGradient id={wood} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={mix(c, 80, c2)} />
          <stop offset="1" stopColor={c} />
        </linearGradient>
      </defs>
      <Shadow rx={mk === 3 ? 70 : 58} />
      {mk === 3 && (
        <g className={an(still, 'bcs-orbit')} style={at(100, 94)}>
          {jars.map(([deg, , inner]) => {
            const a = (deg * Math.PI) / 180;
            const x = +(100 + 84 * Math.cos(a)).toFixed(1);
            const y = +(94 + 84 * Math.sin(a)).toFixed(1);
            return (
              <g key={deg} transform={`translate(${x} ${y})`}>
                <g className={an(still, 'bcs-counter')}>
                  <rect x="-13" y="-16" width="26" height="33" rx="6" fill="#dff2f0" stroke={FG} strokeWidth="2.8" />
                  <rect x="-10" y="-22" width="20" height="8" rx="2" fill={WOOD} stroke={FG} strokeWidth="2.6" />
                  <path d="M-13 -6 H13 V11 Q13 17 7 17 H-7 Q-13 17 -13 11 Z" fill="#9fd8d0" opacity=".45" />
                  {inner}
                  <path d="M-8 -10 V6" stroke="#fff" strokeWidth="2" opacity=".85" {...round} />
                </g>
              </g>
            );
          })}
        </g>
      )}
      {/* cabriole legs */}
      {[-1, 1].map((d) => (
        <g key={d}>
          <path d={`M${100 + d * 44} 150 C${100 + d * 56} 160 ${100 + d * 42} 168 ${100 + d * 50} 178`} fill="none" stroke={FG} strokeWidth="13" {...round} />
          <path d={`M${100 + d * 44} 150 C${100 + d * 56} 160 ${100 + d * 42} 168 ${100 + d * 50} 178`} fill="none" stroke={c} strokeWidth="7" {...round} />
          <circle cx={100 + d * 51} cy="178" r="6.5" fill={c2} stroke={FG} strokeWidth="3" />
          <Limb d={`M${100 + d * 60} 100 L${100 + d * 78} 112 L${100 + d * 80} 128`} c="var(--surf-2)" w={4} />
          <circle cx={100 + d * 80} cy="131" r="6" fill={c2} stroke={FG} strokeWidth="3" />
        </g>
      ))}
      {/* finial antenna and cornice */}
      <path d="M100 26 V14" stroke={FG} strokeWidth="4" />
      <circle cx="100" cy="11" r="6.5" fill={c2} stroke={FG} strokeWidth="3" className={an(still, 'i-pulse')} />
      <path d="M58 30 Q100 8 142 30 Z" fill={c} stroke={FG} strokeWidth="3.5" strokeLinejoin="round" />
      <rect x="34" y="28" width="132" height="11" rx="3" fill={c} stroke={FG} strokeWidth="3.5" />
      <rect x="42" y="38" width="116" height="116" rx="2" fill={`url(#${wood})`} stroke={FG} strokeWidth="4" />
      <rect x="36" y="150" width="128" height="8" rx="2.5" fill={c} stroke={FG} strokeWidth="3.2" />
      {/* the open drawers are the eyes */}
      {[-1, 1].map((d) => {
        const x = 100 + d * 27;
        return (
          <g key={d}>
            <rect x={x - 22} y="44" width="44" height="28" fill="#120b07" stroke={INK} strokeWidth="2" />
            <Eyes still={still}>
              {happy ? (
                <path d={`M${x - 13} 62 Q${x} 44 ${x + 13} 62`} fill="none" stroke={eyeBall} strokeWidth="5.5" {...round} />
              ) : (
                <>
                  <circle cx={x} cy="57" r="10" fill={eyeBall} />
                  <circle cx={x} cy="58" r="5" fill="#120b07" />
                  <circle cx={x - 2} cy="56" r="1.5" fill="#fff" />
                </>
              )}
            </Eyes>
            <path d={`M${x - 22} 66 L${x - 25} 68 V88 H${x + 25} V68 L${x + 22} 66 Z`} fill={mix(c, 70, c2)} stroke={FG} strokeWidth="3" strokeLinejoin="round" />
            <rect x={x - 11} y="71" width="22" height="7" fill={mix(c2, 70, '#fff')} stroke={INK} strokeWidth="1" />
            <path d={`M${x - 6} 83 Q${x} 87 ${x + 6} 83`} fill="none" stroke={c2} strokeWidth="2.8" {...round} />
          </g>
        );
      })}
      {/* drawer grid */}
      {[92, 122].map((y, r) =>
        [0, 1, 2, 3].map((i) => {
          const x = 48 + i * 26.5;
          return (
            <g key={`${r}${i}`} className={r === 1 && i === 2 ? an(still, 'bcs-drawer') : undefined}>
              <rect x={x} y={y} width="25" height="27" rx="1.5" fill={mix(c, 86, c2)} stroke={FG} strokeWidth="2.2" />
              <rect x={x + 5} y={y + 5} width="15" height="6" fill={mix(c2, 72, '#fff')} stroke={INK} strokeWidth=".8" />
              <circle cx={x + 12.5} cy={y + 18} r="3" fill={c2} stroke={FG} strokeWidth="1.6" />
            </g>
          );
        }),
      )}
      {mk >= 2 && (
        <g>
          <path d="M14 58 L61 104 L114 132 L88 100 L141 106 L186 56 M141 106 L184 146 M61 104 L18 146" fill="none" stroke={RED} strokeWidth="2.6" {...round} />
          {[[61, 104], [114, 132], [88, 100], [141, 106]].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r="4" fill={RED} stroke={FG} strokeWidth="1.8" />
          ))}
          {[[14, 54, -8], [186, 52, 7], [184, 150, -6], [16, 150, 6]].map(([x, y, r]) => (
            <g key={`${x}${y}`} transform={`rotate(${r} ${x} ${y})`}>
              <rect x={x - 12} y={y - 10} width="24" height="19" fill={mix(c2, 60, '#fff')} stroke={FG} strokeWidth="2.4" />
              <path d={`M${x - 7} ${y} h14 M${x - 7} ${y + 4} h9`} stroke={INK} strokeWidth="1.3" />
              <circle cx={x} cy={y - 7} r="2.8" fill={RED} stroke={FG} strokeWidth="1.3" />
            </g>
          ))}
        </g>
      )}
    </g>
  );
}

/* ----------------------------------------------------------- Station Master */
function Train({ c, c2 }: { c: string; c2: string }) {
  return (
    <g>
      <rect x="-22" y="-14" width="16" height="12" rx="2" fill={c} stroke={FG} strokeWidth="2.4" />
      <rect x="-4" y="-12" width="20" height="10" rx="4" fill={c2} stroke={FG} strokeWidth="2.4" />
      <rect x="8" y="-20" width="11" height="18" rx="1.5" fill={c} stroke={FG} strokeWidth="2.4" />
      <rect x="-1" y="-18" width="5" height="7" fill={c} stroke={FG} strokeWidth="2" />
      <rect x="11" y="-17" width="5" height="6" fill={c2} />
      <path d="M-6 -6 H-4" stroke={FG} strokeWidth="2.4" />
      {[-18, -10, 1, 11].map((x) => (
        <circle key={x} cx={x} cy="0" r="3.2" fill={INK} stroke={FG} strokeWidth="1.8" />
      ))}
    </g>
  );
}
function Conductor({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const lamp = `${uid}-cl`;
  const panel = mix(c, 58, '#000');
  const moveF = still ? 'translate(46 17)' : undefined;
  const rails = (front: boolean) => (
    <path d={front ? 'M8 160 A92 20 0 0 0 192 160' : 'M8 160 A92 20 0 0 1 192 160'} fill="none" stroke={FG} strokeWidth={front ? 4 : 3} strokeDasharray={front ? undefined : undefined} opacity={front ? 1 : 0.6} />
  );
  return (
    <g>
      <defs>
        <radialGradient id={lamp}>
          <stop offset="0" stopColor="#fff" />
          <stop offset=".45" stopColor={c2} />
          <stop offset="1" stopColor={c2} stopOpacity="0" />
        </radialGradient>
      </defs>
      <Shadow rx={mk === 3 ? 0.1 : 52} />
      {mk === 3 && (
        <>
          {rails(false)}
          {!still && (
            <g transform="translate(100 160)">
              <g className="bcs-rail-b">
                <g className="bcs-rail">
                  <Train c={c} c2={c2} />
                </g>
              </g>
            </g>
          )}
        </>
      )}
      {/* legs and coat */}
      <Limb d="M84 160 V176" c={c} w={7} />
      <Limb d="M116 160 V176" c={c} w={7} />
      <Foot x={80} w={28} c={INK} />
      <Foot x={120} w={28} c={INK} />
      <rect x="68" y="120" width="64" height="44" rx="6" fill={c} stroke={FG} strokeWidth="3.5" />
      <path d="M100 122 V164" stroke={FG} strokeWidth="2" opacity=".55" />
      {[132, 146].map((y) => [90, 110].map((x) => <circle key={`${x}${y}`} cx={x} cy={y} r="3" fill={c2} stroke={FG} strokeWidth="1.3" />))}
      {/* arms */}
      <Limb d="M70 130 L46 138 L38 152" c={c} w={5} />
      <Limb d="M130 130 L154 138 L162 152" c={c} w={5} />
      <circle cx="37" cy="154" r="6" fill={c2} stroke={FG} strokeWidth="3" />
      <circle cx="163" cy="154" r="6" fill={c2} stroke={FG} strokeWidth="3" />
      {/* the board */}
      <rect x="26" y="52" width="148" height="72" rx="6" fill={c} stroke={FG} strokeWidth="4" />
      {[[32, 58], [168, 58], [32, 118], [168, 118]].map(([x, y]) => (
        <Bolt key={`${x}${y}`} x={x} y={y} r={2.2} f={c2} />
      ))}
      {[-1, 1].map((d) => {
        const x = 100 + d * 30;
        return (
          <g key={d}>
            <rect x={x - 24} y="60" width="48" height="36" rx="3" fill={panel} stroke={INK} strokeWidth="2" />
            <Eyes still={still}>
              {happy ? (
                <path d={`M${x - 14} 86 L${x} 68 L${x + 14} 86`} fill="none" stroke={c2} strokeWidth="6.5" {...round} />
              ) : (
                <circle cx={x} cy="78" r="11" fill={c2} />
              )}
            </Eyes>
            <path d={`M${x - 24} 78 H${x + 24}`} stroke={INK} strokeWidth="2.4" />
            <circle cx={x - 22} cy="78" r="1.3" fill={c2} />
            <circle cx={x + 22} cy="78" r="1.3" fill={c2} />
            <rect x={x - 24} y="60" width="48" height="18" rx="3" fill={panel} className={still ? undefined : 'bcs-flap'} opacity={still ? 0 : 1} style={{ animationDelay: `${d * 0.9}s` }} />
          </g>
        );
      })}
      {'ON TIME'.split('').map((ch, i) => {
        const x = 37 + i * 18.8;
        return (
          <g key={i}>
            <rect x={x} y="100" width="17" height="20" rx="1.5" fill={panel} stroke={INK} strokeWidth="1.4" />
            <text x={x + 8.5} y="115.5" textAnchor="middle" fontFamily={MONO} fontWeight="800" fontSize="15" fill={c2}>
              {ch}
            </text>
            <path d={`M${x} 110 h17`} stroke={INK} strokeWidth="1.2" />
            {!still && <rect x={x} y="100" width="17" height="10" rx="1" fill={panel} className="bcs-flap" style={{ animationDelay: `${i * 0.11}s` }} />}
          </g>
        );
      })}
      {/* whistle */}
      <path d="M172 96 C182 96 184 88 178 84" fill="none" stroke={c2} strokeWidth="2.2" />
      <path d="M170 104 h14 a9 9 0 1 1 -8 13 h-6 Z" fill={c2} stroke={FG} strokeWidth="3" strokeLinejoin="round" />
      <circle cx="184" cy="113" r="3" fill={INK} />
      {/* peaked cap */}
      <path d="M46 52 C34 10 166 10 154 52 Z" fill={c} stroke={FG} strokeWidth="4" strokeLinejoin="round" />
      <rect x="44" y="42" width="112" height="12" fill={c2} stroke={FG} strokeWidth="3" />
      <path d="M38 52 Q100 76 162 52 Q100 60 38 52 Z" fill={INK} stroke={FG} strokeWidth="3" strokeLinejoin="round" />
      <circle cx="100" cy="30" r="8" fill={c2} stroke={FG} strokeWidth="2.6" />
      <path d="M86 26 L92 30 L86 34 M114 26 L108 30 L114 34" fill="none" stroke={c2} strokeWidth="2.6" {...round} />
      <path d="M100 25 V35 M95 30 H105" stroke={INK} strokeWidth="2" />
      {mk >= 2 && (
        <>
          {/* lantern */}
          <path d="M37 158 V163" stroke={FG} strokeWidth="3" />
          <path d="M28 168 Q37 158 46 168" fill="none" stroke={FG} strokeWidth="2.6" />
          <circle cx="37" cy="178" r="22" fill={`url(#${lamp})`} opacity=".7" className={an(still, 'i-pulse')} />
          <rect x="28" y="167" width="18" height="18" rx="3" fill={mix(c2, 45, '#fff')} stroke={FG} strokeWidth="3" />
          <path d="M26 166 H48 M26 186 H48" stroke={FG} strokeWidth="3.5" {...round} />
          <path d="M37 170 q5 7 0 12 q-5 -5 0 -12" fill={c2} stroke={INK} strokeWidth="1" />
          {/* ticket punch */}
          <path d="M162 158 L150 180 M166 158 L180 176" stroke={FG} strokeWidth="5" {...round} />
          <path d="M162 158 L150 180 M166 158 L180 176" stroke={c2} strokeWidth="2" {...round} />
          <g transform="rotate(-10 176 148)">
            <rect x="162" y="126" width="30" height="20" rx="2" fill="#fff6dc" stroke={FG} strokeWidth="2.6" />
            <path d="M167 132 h14 M167 137 h9" stroke={INK} strokeWidth="1.6" />
            <circle cx="186" cy="139" r="2.6" fill={INK} />
            <path d="M185 127 v18" stroke={INK} strokeWidth="1" strokeDasharray="2 2" />
          </g>
        </>
      )}
      {mk === 3 && (
        <>
          {rails(true)}
          <g transform="translate(100 160)">
            {still ? (
              <g transform={moveF}>
                <Train c={c} c2={c2} />
              </g>
            ) : (
              <g className="bcs-rail-f">
                <g className="bcs-rail">
                  <Train c={c} c2={c2} />
                </g>
              </g>
            )}
          </g>
        </>
      )}
    </g>
  );
}

/* ----------------------------------------------------------------- Bookworm */
function Bookworm({ c, c2, uid, still, happy, mk }: BotArtProps) {
  const paper = `${uid}-bp`;
  const cone = `${uid}-bc`;
  const lens = `${uid}-bl`;
  const page = mix(c2, 72, '#fff');
  const stack = (x: number, cols: string[]) =>
    cols.map((col, i) => (
      <g key={`${x}${i}`}>
        <rect x={x - 24 + (i % 2) * 4} y={150 + i * 10.5} width="44" height="11" rx="2" fill={col} stroke={FG} strokeWidth="2.8" />
        <path d={`M${x - 16 + (i % 2) * 4} ${155.5 + i * 10.5} h7 M${x + 4 + (i % 2) * 4} ${155.5 + i * 10.5} h7`} stroke={i % 2 ? c : c2} strokeWidth="2" />
      </g>
    ));
  const flock: [number, number, number][] = [[24, 40, 0], [52, 18, -0.3], [16, 82, -0.6], [176, 92, -0.2]];
  return (
    <g>
      <defs>
        <linearGradient id={paper} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={page} />
          <stop offset="1" stopColor={mix(c2, 90, c)} />
        </linearGradient>
        <linearGradient id={cone} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe9a8" stopOpacity=".85" />
          <stop offset="1" stopColor="#ffe9a8" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={lens} cx=".35" cy=".3" r=".8">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor={mix(c2, 40, '#fff')} />
        </radialGradient>
      </defs>
      <Shadow rx={56} />
      {/* feet */}
      {mk === 1 ? (
        <>
          <Limb d="M78 136 V176" c="var(--surf-2)" w={6} />
          <Limb d="M122 136 V176" c="var(--surf-2)" w={6} />
          <Foot x={74} w={32} c={c} />
          <Foot x={126} w={32} c={c} />
        </>
      ) : (
        <>
          {stack(72, [c, c2, mix(c, 60, c2)])}
          {stack(130, [mix(c, 60, c2), c, c2])}
        </>
      )}
      {/* worm from a hole in the right... left page */}
      <g className={an(still, 'bcs-worm')} style={at(72, 50)}>
        <path d="M72 50 C70 40 84 36 80 26 C78 20 70 20 68 14" fill="none" stroke={FG} strokeWidth="13" {...round} />
        <path d="M72 50 C70 40 84 36 80 26 C78 20 70 20 68 14" fill="none" stroke={mix(c2, 40, '#86c44a')} strokeWidth="8" {...round} />
        <circle cx="67" cy="11" r="8" fill={mix(c2, 40, '#86c44a')} stroke={FG} strokeWidth="2.8" />
        <circle cx="64" cy="10" r="1.8" fill={INK} />
        <circle cx="70" cy="10" r="1.8" fill={INK} />
      </g>
      {/* cover */}
      <path d="M100 56 C80 44 46 42 22 50 L18 142 C46 134 80 136 100 148 C120 136 154 134 182 142 L178 50 C154 42 120 44 100 56 Z" fill={c} stroke={FG} strokeWidth="4" strokeLinejoin="round" />
      {[[22, 54], [178, 54], [22, 138], [178, 138]].map(([x, y]) => (
        <Bolt key={`${x}${y}`} x={x} y={y} r={2.2} f={c2} />
      ))}
      {/* pages */}
      <path d="M100 60 C82 48 50 47 28 54 L26 132 C50 126 82 128 100 140 Z" fill={`url(#${paper})`} stroke={FG} strokeWidth="2.8" strokeLinejoin="round" />
      <path d="M100 60 C118 48 150 47 172 54 L174 132 C150 126 118 128 100 140 Z" fill={`url(#${paper})`} stroke={FG} strokeWidth="2.8" strokeLinejoin="round" />
      <path d="M100 60 V140" stroke={FG} strokeWidth="3" />
      {[116, 124].flatMap((y, i) =>
        [-1, 1].map((d) => <path key={`${y}${d}`} d={`M${100 + d * 12} ${y + 3 + i} Q${100 + d * 34} ${y - 5} ${100 + d * 62} ${y - 3}`} fill="none" stroke={c} strokeWidth="2.4" opacity=".6" />),
      )}
      <ellipse cx="68" cy="52" rx="7" ry="3" fill={INK} />
      {/* arms holding the page edges */}
      {[-1, 1].map((d) => (
        <g key={d}>
          <Limb d={`M${100 + d * 80} 104 L${100 + d * 92} 112`} c="var(--surf-2)" w={4} />
          <circle cx={100 + d * 90} cy="114" r="6" fill={c} stroke={FG} strokeWidth="3" />
        </g>
      ))}
      {/* glasses */}
      <circle cx="68" cy="88" r="23" fill={`url(#${lens})`} stroke={FG} strokeWidth="5" />
      <circle cx="132" cy="88" r="23" fill={`url(#${lens})`} stroke={FG} strokeWidth="5" />
      <path d="M91 84 Q100 76 109 84" fill="none" stroke={FG} strokeWidth="5" />
      <path d="M45 84 L28 76 M155 84 L172 76" stroke={FG} strokeWidth="4.5" {...round} />
      <Eyes still={still}>
        {[68, 132].map((x) =>
          happy ? (
            <path key={x} d={`M${x - 12} 94 Q${x} 76 ${x + 12} 94`} fill="none" stroke={INK} strokeWidth="5.5" {...round} />
          ) : (
            <g key={x}>
              <circle cx={x} cy="90" r="10" fill={INK} />
              <circle cx={x - 3} cy="86" r="3" fill="#fff" />
            </g>
          ),
        )}
      </Eyes>
      <path d="M52 76 L60 70 M116 76 L124 70" stroke="#fff" strokeWidth="3" opacity=".9" {...round} />
      {/* bookmark tongue */}
      <g className={an(still, 'bcs-tongue')} style={at(100, 130)}>
        <path d="M90 130 H110 V170 L100 160 L90 170 Z" fill={mix(c, 25, RED)} stroke={FG} strokeWidth="3" strokeLinejoin="round" />
        <path d="M100 134 V152" stroke={INK} strokeWidth="1.6" opacity=".5" />
      </g>
      {mk === 3 && (
        <>
          <path d="M142 34 L116 118 H178 L160 30 Z" fill={`url(#${cone})`} />
          <Limb d="M186 134 L194 64 L150 10" c="var(--surf-2)" w={4} />
          <circle cx="194" cy="64" r="4.5" fill={c2} stroke={FG} strokeWidth="2.4" />
          <path d="M136 36 L146 8 L160 8 L172 30 Z" fill={c} stroke={FG} strokeWidth="3.4" strokeLinejoin="round" />
          <path d="M136 36 Q154 44 172 30" fill="none" stroke={c2} strokeWidth="3" {...round} />
          {flock.map(([x, y, d]) => (
            <g key={x} transform={`translate(${x} ${y})`}>
              <g className={an(still, 'bcs-page')} style={{ animationDelay: `${d}s` }}>
                <path d="M0 2 C-5 -8 -14 -10 -18 -8 L-15 8 C-10 5 -4 6 0 11 C4 6 10 5 15 8 L18 -8 C14 -10 5 -8 0 2 Z" fill={page} stroke={FG} strokeWidth="2.6" strokeLinejoin="round" />
                <path d="M0 2 V11" stroke={FG} strokeWidth="1.8" />
              </g>
            </g>
          ))}
        </>
      )}
    </g>
  );
}

/* ------------------------------------------------------------------- Euclid */
const BLUE = '#1f6fb2';
function Euclid({ c, c2, still, happy, mk }: BotArtProps) {
  const dark = '#14110d';
  const legs = (y: number) => (
    <>
      <path d={`M100 ${y} L100 ${y + 5}`} stroke={FG} strokeWidth="5" />
      {[['bcs-stride-a', -1], ['bcs-stride-b', 1]].map(([cls, d]) => (
        <g key={String(cls)} className={an(still, String(cls))} style={at(100, y)}>
          <path d={`M${100 - 4} ${y} L${100 + 4} ${y} L${100 + (d as number) * 22} 182 Z`} fill={d === 1 ? c : BLUE} stroke={FG} strokeWidth="2.6" strokeLinejoin="round" />
        </g>
      ))}
      <circle cx="100" cy={y} r="6" fill={c2} stroke={FG} strokeWidth="2.6" />
    </>
  );
  if (mk === 3) {
    return (
      <g>
        <Shadow rx={44} />
        {legs(150)}
        <polygon points="67.5,84 36.3,60.6 59.7,29.4 90.9,52.8" fill={BLUE} stroke={FG} strokeWidth="2.6" strokeLinejoin="round" />
        <polygon points="132.5,84 163.7,42.4 122.1,11.2 90.9,52.8" fill={c2} stroke={FG} strokeWidth="2.6" strokeLinejoin="round" />
        <rect x="67.5" y="84" width="23.4" height="65" fill={BLUE} />
        <rect x="90.9" y="84" width="41.6" height="65" fill={c2} />
        <rect x="67.5" y="84" width="65" height="65" fill="none" stroke={FG} strokeWidth="2.8" strokeLinejoin="round" />
        <path d="M90.9 84 V149" stroke={FG} strokeWidth="1.6" strokeDasharray="4 3" />
        <polygon points="67.5,84 132.5,84 90.9,52.8" fill={c} stroke={FG} strokeWidth="2.8" strokeLinejoin="round" />
        <Eyes still={still}>
          {[81, 113].map((x) =>
            happy ? (
              <path key={x} d={`M${x - 8} 114 Q${x} 101 ${x + 8} 114`} fill="none" stroke={dark} strokeWidth="4.6" {...round} />
            ) : (
              <g key={x}>
                <circle cx={x} cy="110" r="9" fill="#fff" stroke={dark} strokeWidth="2" />
                <circle cx={x} cy="111" r="4.2" fill={dark} />
              </g>
            ),
          )}
        </Eyes>
        <path d="M90.9 62 h6 v-7" fill="none" stroke="#fff" strokeWidth="1.6" />
        <g className={an(still, 'bcs-qed')}>
          <text x="166" y="118" textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontWeight="700" fontSize="15" fill={FG}>
            Q.E.D.
          </text>
          <rect x="160" y="124" width="12" height="16" fill={c} stroke={FG} strokeWidth="2" />
        </g>
      </g>
    );
  }
  const y0 = mk === 2 ? -14 : 0;
  return (
    <g>
      <Shadow rx={mk === 2 ? 38 : 46} />
      {mk === 1 ? (
        <>
          <Limb d={`M76 146 L68 178`} c="var(--surf-2)" w={4} />
          <Limb d={`M122 146 L130 178`} c="var(--surf-2)" w={4} />
          <Foot x={64} w={24} c={BLUE} />
          <Foot x={134} w={24} c={c} />
        </>
      ) : (
        legs(136)
      )}
      <g transform={`translate(0 ${y0})`}>
        {/* a dashed antenna, as Byrne dashes his constructions */}
        <path d="M54 30 V10" stroke={FG} strokeWidth="2.6" strokeDasharray="4 3" />
        <circle cx="54" cy="9" r="5" fill={c2} stroke={FG} strokeWidth="2.4" className={an(still, 'i-pulse')} />
        <Limb d="M50 112 L28 122 L24 104" c="var(--surf-2)" w={4} />
        <circle cx="24" cy="100" r="6" fill={BLUE} stroke={FG} strokeWidth="2.6" />
        <Limb d="M122 96 L148 90 L156 72" c="var(--surf-2)" w={4} />
        <circle cx="157" cy="68" r="6" fill={c2} stroke={FG} strokeWidth="2.6" />
        <polygon points="52,28 52,148 146,148" fill={c} stroke={FG} strokeWidth="3.4" strokeLinejoin="round" />
        <path d="M52 28 V148" stroke={BLUE} strokeWidth="9" strokeLinecap="square" />
        <path d="M52 148 H146" stroke={c2} strokeWidth="9" strokeLinecap="square" />
        <polygon points="47,24 47,153 149,153" fill="none" stroke={FG} strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M57 128 h15 v15" fill="none" stroke="#fff" strokeWidth="2.6" />
        <Eyes still={still}>
          {[72, 100].map((x) =>
            happy ? (
              <path key={x} d={`M${x - 9} 112 Q${x} 98 ${x + 9} 112`} fill="none" stroke="#fff" strokeWidth="5" {...round} />
            ) : (
              <g key={x}>
                <circle cx={x} cy="108" r="10" fill="#fff" stroke={dark} strokeWidth="2" />
                <circle cx={x + 1} cy="109" r="4.6" fill={dark} />
              </g>
            ),
          )}
        </Eyes>
      </g>
    </g>
  );
}

export const TRIBUTE: BotRegistry = {
  maestro: { Art: Maestro, head: { x: 100, y: 8, s: 0.5 } },
  compiler: { Art: Compiler, head: { x: 100, y: 32, s: 1.3 } },
  pacer: { Art: Pacer, head: { x: 100, y: 18, s: 1 } },
  ironclad: { Art: Ironclad, head: { x: 100, y: 25, s: 1 } },
  scholar: { Art: Scholar, head: { x: 100, y: 14, s: 1.1 } },
  knight: { Art: Knight, head: { x: 96, y: 30, s: 0.8 } },
  dreamer: { Art: Dreamer, head: { x: 110, y: 8, s: 0.8 } },
  monk: { Art: Monk, head: { x: 103, y: 24, s: 0.6 } },
  curator: { Art: Curator, head: { x: 100, y: 18, s: 1.2 } },
  conductor: { Art: Conductor, head: { x: 100, y: 20, s: 1.3 } },
  bookworm: { Art: Bookworm, head: { x: 100, y: 48, s: 1.2 } },
  euclid: { Art: Euclid, head: { x: 56, y: 26, s: 0.6 } },
};
