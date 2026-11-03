/** The Hideout's drawings: the hillside above it and a little scene inside each room. Decorative only. */
import type { ReactElement } from 'react';
import type { RoomId } from './HqView';

/** Above ground: a dark hill, a pine, a hatch left ajar with light coming out, and the drone on watch. */
export function HideoutTop() {
  return (
    <svg className="hq-top__art" viewBox="0 0 400 190" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="hq-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b1026" />
          <stop offset="1" stopColor="#25234a" />
        </linearGradient>
      </defs>
      <rect width="400" height="190" fill="url(#hq-sky)" />
      {[[30, 24], [74, 54], [118, 18], [168, 44], [214, 16], [262, 36], [318, 22], [372, 50], [346, 72], [96, 86]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 ? 0.9 : 1.4} fill="#fff" className="hq-star" style={{ animationDelay: `${i * -0.7}s` }} />
      ))}
      <circle cx="326" cy="42" r="17" fill="#f6edcf" />
      <circle cx="334" cy="37" r="15" fill="#10152f" />
      <path d="M0 150 C60 112 120 118 186 138 S320 104 400 128 V190 H0Z" fill="#1a1f33" />
      <path d="M0 166 C80 138 150 146 210 156 S340 138 400 152 V190 H0Z" fill="#12141f" />
      <g fill="#0c1411">
        <path d="M56 158 l14 -34 14 34z" />
        <path d="M60 138 l10 -26 10 26z" />
        <path d="M352 150 l11 -28 11 28z" />
        <path d="M100 160 l9 -20 9 20z" />
      </g>
      <ellipse cx="214" cy="156" rx="34" ry="9" fill="#ffb02e" opacity="0.5" />
      <path d="M186 160 h56 l-6 -9 h-44z" fill="#3a3f55" />
      <path d="M192 151 L209 128 L242 142 L236 151z" fill="#4d5472" stroke="#2c3148" strokeWidth="1.5" />
      <circle cx="220" cy="140" r="3" fill="#ffb02e" />
      <g className="hq-drone">
        <circle cx="282" cy="92" r="7" fill="#ffb02e" />
        <circle cx="282" cy="92" r="12" fill="none" stroke="#ffb02e" strokeOpacity="0.55" strokeWidth="1.5" />
      </g>
    </svg>
  );
}

const L = { stroke: 'var(--rc)', strokeWidth: 1.6, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const F = { fill: 'var(--rc)' };
const D = { fill: 'var(--rc)', opacity: 0.22 };

const SCENES: Record<RoomId, ReactElement> = {
  forge: (
    <>
      <path d="M30 40 h44 c0 8 -6 12 -16 12 h-12 c-10 0 -16 -4 -16 -12z" {...D} />
      <path d="M22 34 h60 l-8 6 h-44z M30 40 c0 8 6 12 16 12 h12 c10 0 16 -4 16 -12 M40 52 v4 M64 52 v4 M34 56 h36" {...L} />
      <path d="M92 44 l14 -24 M86 18 l26 10 -4 8 -26 -10z" {...L} />
      <circle cx="60" cy="22" r="1.6" {...F} />
      <circle cx="48" cy="16" r="1.2" {...F} className="hq-bub" />
      <circle cx="70" cy="12" r="1.2" {...F} />
    </>
  ),
  arena: (
    <>
      <ellipse cx="60" cy="50" rx="50" ry="7" {...L} />
      <path d="M38 44 L58 16 M58 16 l-6 2 M58 16 l-2 6 M42 34 l6 6" {...L} />
      <path d="M82 44 L62 16 M62 16 l6 2 M62 16 l2 6 M78 34 l-6 6" {...L} />
      <circle cx="60" cy="12" r="3" {...F} />
    </>
  ),
  oath: (
    <>
      <rect x="34" y="8" width="52" height="46" rx="1" {...D} />
      <path d="M34 8 h52 v46 h-52z M42 18 h36 M42 26 h36 M42 34 h22" {...L} />
      <circle cx="74" cy="44" r="7" fill="none" stroke="var(--rc)" strokeWidth="2.4" />
      <path d="M71 44 h6 M74 41 v6" {...L} />
    </>
  ),
  close: (
    <>
      <path d="M12 54 h96" {...L} />
      <path d="M40 54 v-24 a20 20 0 0 1 40 0 v24" {...L} />
      <path d="M60 10 v44" {...L} />
      <circle cx="54" cy="36" r="1.5" {...F} />
      <circle cx="66" cy="36" r="1.5" {...F} />
      <path d="M96 10 a7 7 0 1 0 6 11 a6 6 0 1 1 -6 -11z" {...D} />
      <path d="M96 10 a7 7 0 1 0 6 11 a6 6 0 1 1 -6 -11z" {...L} />
    </>
  ),
  exam: (
    <>
      <rect x="22" y="14" width="36" height="42" rx="1" {...D} />
      <path d="M22 14 h36 v42 h-36z M30 24 h20 M30 32 h20 M30 40 h12" {...L} />
      <circle cx="84" cy="30" r="17" {...L} />
      <path d="M84 30 v-11 M84 30 l8 5 M80 8 h8" {...L} />
    </>
  ),
  breath: (
    <>
      <circle cx="60" cy="30" r="24" {...D} className="hq-beam" />
      <circle cx="60" cy="30" r="24" {...L} />
      <circle cx="60" cy="30" r="14" {...L} />
      <circle cx="60" cy="30" r="5" {...F} />
    </>
  ),
  ledger: (
    <>
      <path d="M22 10 h76 v44 h-76z" {...D} />
      <path d="M22 10 h76 v44 h-76z M60 10 v44 M28 20 h24 M28 28 h24 M28 36 h16 M68 20 h24 M68 28 h24" {...L} />
      <path d="M82 50 l18 -26 4 3 -18 26 -5 2z" {...F} opacity="0.5" />
    </>
  ),
  scales: (
    <>
      <path d="M60 8 v44 M42 54 h36 M24 16 h72 M24 16 l-10 22 h20z M96 16 l-10 22 h20z" {...L} />
      <path d="M14 38 a10 7 0 0 0 20 0z" {...D} />
      <path d="M86 38 a10 7 0 0 0 20 0z" {...D} />
    </>
  ),
  diary: (
    <>
      <path d="M60 14 c-10 -7 -26 -8 -40 -5 v42 c14 -3 30 -2 40 5 c10 -7 26 -8 40 -5 v-42 c-14 -3 -30 -2 -40 5z" {...D} />
      <path d="M60 14 c-10 -7 -26 -8 -40 -5 v42 c14 -3 30 -2 40 5 c10 -7 26 -8 40 -5 v-42 c-14 -3 -30 -2 -40 5z M60 14 v42 M28 20 h22 M28 28 h22 M70 20 h22" {...L} />
    </>
  ),
  cinema: (
    <>
      <circle cx="34" cy="24" r="14" {...L} />
      <circle cx="34" cy="24" r="4" {...F} />
      <circle cx="68" cy="24" r="10" {...L} />
      <rect x="22" y="38" width="52" height="16" rx="2" {...D} />
      <rect x="22" y="38" width="52" height="16" rx="2" {...L} />
      <path d="M74 44 l26 -12 v28 l-26 -8" {...F} opacity="0.35" />
    </>
  ),
  lighthouse: (
    <>
      <path d="M0 54 q15 -5 30 0 t30 0 t30 0 t30 0" {...L} />
      <path d="M52 50 l3 -30 h10 l3 30z" {...D} />
      <path d="M52 50 l3 -30 h10 l3 30z M54 38 h12 M55 29 h10" {...L} />
      <rect x="54" y="13" width="12" height="7" {...F} />
      <path d="M53 13 l7 -6 7 6z" {...L} />
      <path className="hq-beam" d="M66 15 L120 4 V28Z" fill="var(--rc)" opacity="0.28" />
      <path className="hq-beam" d="M54 15 L0 4 V28Z" fill="var(--rc)" opacity="0.14" />
    </>
  ),
  war: (
    <>
      <rect x="20" y="14" width="46" height="26" rx="1" {...D} />
      <rect x="20" y="14" width="46" height="26" rx="1" {...L} />
      <path d="M26 34 l8 -10 7 6 9 -12 8 8" {...L} />
      <circle cx="50" cy="18" r="2" {...F} />
      <path d="M78 44 h34 M84 44 l-3 12 M106 44 l3 12" {...L} />
      <rect x="82" y="36" width="20" height="8" {...D} />
      <path d="M96 36 v-13 l9 4 -9 4" {...L} />
    </>
  ),
  dojo: (
    <>
      <path d="M12 54 h96" {...L} />
      <path d="M50 8 h20 M53 8 v30 h14 v-30" {...L} />
      <rect x="53" y="8" width="14" height="30" {...D} />
      <path d="M57 16 h6 M57 22 h6 M57 28 h6" {...L} />
      <rect x="18" y="38" width="20" height="13" rx="1" transform="rotate(-8 28 44)" {...D} />
      <rect x="18" y="38" width="20" height="13" rx="1" transform="rotate(-8 28 44)" {...L} />
      <rect x="82" y="38" width="20" height="13" rx="1" transform="rotate(7 92 44)" {...L} />
    </>
  ),
  lab: (
    <>
      <path d="M26 10 h10 M29 10 v14 l-11 24 q-1 4 3 4 h20 q4 0 3 -4 l-11 -24 v-14" {...L} />
      <path d="M22 40 h18 l4 10 h-26z" {...F} opacity="0.4" />
      <circle cx="29" cy="34" r="1.6" {...F} className="hq-bub" />
      <rect x="62" y="14" width="46" height="28" rx="2" {...L} />
      <path d="M67 36 l7 -9 6 5 8 -11 6 6 8 -10" {...L} />
      <path d="M85 42 v8 M74 52 h22" {...L} />
    </>
  ),
  observatory: (
    <>
      <path d="M26 54 v-14 a34 34 0 0 1 68 0 v14" {...L} />
      <path d="M26 54 h68" {...L} />
      <path d="M58 44 L80 20" stroke="var(--rc)" strokeWidth="7" strokeLinecap="round" />
      <path d="M58 44 l-7 10 M58 44 l7 10" {...L} />
      <circle cx="96" cy="10" r="1.6" {...F} />
      <circle cx="108" cy="24" r="1.2" {...F} />
      <circle cx="84" cy="6" r="1" {...F} />
    </>
  ),
  infirmary: (
    <>
      <path d="M14 44 h70 M14 32 v22 M84 40 v14" {...L} />
      <rect x="20" y="34" width="60" height="10" rx="3" {...D} />
      <circle cx="28" cy="29" r="5" {...L} />
      <rect x="92" y="12" width="20" height="20" rx="2" {...D} />
      <path d="M102 16 v12 M96 22 h12" stroke="var(--rc)" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  armoury: (
    <>
      <path d="M10 14 h100" {...L} />
      <path d="M20 14 v6 M60 14 v6 M98 14 v6" {...L} />
      <path d="M14 34 c3 -8 7 -10 12 -10 l6 8 c6 2 10 2 12 8 h-30z" {...D} />
      <path d="M14 42 v-8 c3 -8 7 -10 12 -10 l6 8 c6 2 10 2 12 8 v2z" {...L} />
      <path d="M60 22 c-4 8 -4 14 0 18 c-3 6 -2 12 2 14 c4 -2 5 -8 2 -14 c4 -4 4 -10 0 -18z" {...D} />
      <path d="M62 22 v-8" {...L} />
      <path d="M92 20 L108 56" {...L} />
      <path d="M96 18 L112 54" stroke="var(--rc)" strokeOpacity="0.6" strokeWidth="1" />
    </>
  ),
  oracle: (
    <>
      <circle cx="60" cy="28" r="18" {...D} />
      <circle cx="60" cy="28" r="18" {...L} />
      <path d="M50 22 a12 12 0 0 1 10 -6" {...L} />
      <path d="M46 46 h28 l5 8 h-38z" {...L} />
      <circle cx="26" cy="20" r="1.6" {...F} className="hq-bub" />
      <circle cx="94" cy="16" r="1.4" {...F} />
      <circle cx="100" cy="36" r="1.1" {...F} />
      <circle cx="18" cy="38" r="1.1" {...F} />
    </>
  ),
  vault: (
    <>
      <circle cx="60" cy="30" r="24" {...D} />
      <circle cx="60" cy="30" r="24" {...L} />
      <circle cx="60" cy="30" r="17" {...L} />
      <g className="hq-wheel">
        <circle cx="60" cy="30" r="6" {...L} />
        <path d="M60 18 v24 M48 30 h24 M51.5 21.5 l17 17 M68.5 21.5 l-17 17" {...L} />
      </g>
      <path d="M92 18 h10 M92 42 h10" stroke="var(--rc)" strokeWidth="4" />
    </>
  ),
  rituals: (
    <>
      <path d="M12 26 h96" {...L} />
      <path d="M22 26 v28 M98 26 v28" {...L} />
      <circle cx="42" cy="15" r="8" {...D} />
      <circle cx="42" cy="15" r="8" {...L} />
      <path d="M78 8 a8 8 0 1 0 7 13 a6.5 6.5 0 1 1 -7 -13z" {...L} />
      <path d="M50 54 v-16 M58 54 v-22 M66 54 v-14" {...L} />
      <path d="M46 54 h24" {...L} />
    </>
  ),
  hall: (
    <>
      <path d="M8 54 h104" {...L} />
      <path d="M46 14 h28 v8 a14 14 0 0 1 -28 0z" {...D} />
      <path d="M46 14 h28 v8 a14 14 0 0 1 -28 0z M46 18 h-7 v4 a7 7 0 0 0 8 6 M74 18 h7 v4 a7 7 0 0 1 -8 6 M60 36 v8 M50 48 h20 v6 h-20z" {...L} />
      <path d="M16 54 v-14 h14 v14" {...L} />
      <path d="M90 54 v-20 h14 v20" {...L} />
      <circle cx="23" cy="34" r="3" {...F} />
      <path d="M97 22 l2 5 5 .4 -4 3 1.4 5 -4.4 -2.8 -4.4 2.8 1.4 -5 -4 -3 5 -.4z" {...F} />
    </>
  ),
};

export function RoomScene({ room }: { room: RoomId }) {
  return (
    <svg className="hq-room__art" viewBox="0 0 120 60" aria-hidden="true">
      {SCENES[room]}
    </svg>
  );
}
