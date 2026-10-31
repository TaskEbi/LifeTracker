/**
 * The bucket list's header: a shrine at dusk. A torii against a low moon, a string of lanterns
 * swaying, and an ema rack with one wooden plaque per wish (up to 14): crossed-off ones carry a
 * red tick, so the rack fills in as the list does.
 */
import type { CSSProperties } from 'react';

const RACK = 14;

export function BucketArt({ open, done }: { open: number; done: number }) {
  const shown = Math.min(RACK, open + done);
  const ticked = Math.min(done, shown);
  return (
    <span className="i-chhead__art bk-art" aria-hidden="true">
      <svg viewBox="0 0 360 230" preserveAspectRatio="xMidYMax slice">
        <defs>
          <radialGradient id="bk-moon" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#fff4d6" />
            <stop offset="0.7" stopColor="#ffd98a" />
            <stop offset="1" stopColor="#ffb85c" />
          </radialGradient>
          <radialGradient id="bk-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#ffc94d" stopOpacity="0.9" />
            <stop offset="1" stopColor="#ffc94d" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="bk-wood" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e2b07a" />
            <stop offset="1" stopColor="#b9814e" />
          </linearGradient>
        </defs>
        {/* moon and far hills */}
        <circle className="bk-art__moon" cx="262" cy="82" r="38" fill="url(#bk-moon)" />
        <path d="M0 176 Q60 150 120 166 T240 158 T360 150 V230 H0Z" fill="#3a1d33" />
        <path d="M0 196 Q80 176 170 188 T360 178 V230 H0Z" fill="#2a1426" />
        {/* torii */}
        <g className="bk-art__torii" fill="#d8402c">
          <path d="M196 92 Q252 100 330 90 L332 100 Q252 110 194 102Z" />
          <rect x="204" y="110" width="118" height="7" />
          <rect x="216" y="100" width="9" height="104" />
          <rect x="301" y="100" width="9" height="104" />
          <rect x="258" y="110" width="8" height="10" fill="#b3261e" />
          <rect x="212" y="200" width="17" height="6" fill="#1c0d18" />
          <rect x="297" y="200" width="17" height="6" fill="#1c0d18" />
        </g>
        {/* lantern string, high on the right, in front of the moon */}
        <path d="M150 2 Q255 34 364 8" stroke="#5a3346" strokeWidth="1.5" fill="none" />
        {[172, 214, 256, 298, 340].map((x, i) => {
          const u = (x - 150) / 214;
          const y = 2 + u * 6 + 4 * u * (1 - u) * 26;
          return (
            <g key={x} className="bk-art__lan" style={{ '--i': i, transformOrigin: `${x}px ${y}px` } as CSSProperties}>
              <circle cx={x} cy={y + 17} r="17" fill="url(#bk-glow)" opacity="0.55" />
              <line x1={x} y1={y} x2={x} y2={y + 6} stroke="#5a3346" strokeWidth="1.2" />
              <rect x={x - 7} y={y + 6} width="14" height="3" rx="1" fill="#2a1426" />
              <ellipse cx={x} cy={y + 17} rx="9" ry="10" fill={i % 2 ? '#ff8a4c' : '#ffc94d'} />
              <path d={`M${x - 9} ${y + 14} H${x + 9} M${x - 8.6} ${y + 20} H${x + 8.6}`} stroke="#c2562c" strokeWidth="0.8" />
              <rect x={x - 6} y={y + 26} width="12" height="3" rx="1" fill="#2a1426" />
            </g>
          );
        })}
        {/* ema rack: one plaque per wish */}
        <g className="bk-art__rack">
          <rect x="18" y="168" width="168" height="4" rx="1.5" fill="#4a2a1c" />
          <rect x="22" y="168" width="5" height="44" fill="#3a2016" />
          <rect x="177" y="168" width="5" height="44" fill="#3a2016" />
          {Array.from({ length: shown }, (_, i) => {
            const row = i < 7 ? 0 : 1;
            const x = 32 + (i % 7) * 21 + row * 10;
            const y = 172 + row * 12;
            const tilt = ((i * 37) % 11) - 5;
            return (
              <g key={i} transform={`rotate(${tilt} ${x + 8} ${y})`} className="bk-art__ema" style={{ '--i': i } as CSSProperties}>
                <path d={`M${x} ${y + 4} L${x + 8} ${y} L${x + 16} ${y + 4} V${y + 15} H${x}Z`} fill="url(#bk-wood)" stroke="#7a4a28" strokeWidth="0.6" />
                {i < ticked ? (
                  <path d={`M${x + 4} ${y + 9} l3 3 l5 -6`} stroke="#d8402c" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                ) : (
                  <path d={`M${x + 4} ${y + 8} H${x + 12} M${x + 4} ${y + 11} H${x + 10}`} stroke="#7a4a28" strokeWidth="0.8" />
                )}
              </g>
            );
          })}
        </g>
        {/* fireflies */}
        {[
          [196, 150],
          [150, 164],
          [340, 140],
          [244, 176],
          [272, 150],
        ].map(([x, y], i) => (
          <circle key={i} className="bk-art__fly" cx={x} cy={y} r="1.6" fill="#ffe7a0" style={{ '--i': i } as CSSProperties} />
        ))}
      </svg>
    </span>
  );
}
