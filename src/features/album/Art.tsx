/**
 * The Album's header: a darkroom under the safelight. A red bulb glows, a drying line runs across
 * with the latest prints pegged to it (your own thumbnails, newest on the right), and a strip of
 * negatives curls in from the corner. Empty pegs wait for photos still to come.
 */
import type { CSSProperties } from 'react';
import type { Shot } from '../../domain/album/album';

const PEGS = 5;

export function AlbumArt({ prints }: { prints: Shot[] }) {
  const shown = prints.slice(-PEGS);
  const slots = Array.from({ length: PEGS }, (_, i) => shown[i - (PEGS - shown.length)] ?? null);
  return (
    <span className="i-chhead__art al-art" aria-hidden="true">
      <svg viewBox="0 0 360 230" preserveAspectRatio="xMidYMin slice">
        <defs>
          <radialGradient id="al-safe" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#ff4a2a" stopOpacity="0.85" />
            <stop offset="0.45" stopColor="#c2180c" stopOpacity="0.32" />
            <stop offset="1" stopColor="#5a0703" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle className="al-art__glow" cx="318" cy="34" r="120" fill="url(#al-safe)" />
        {/* the safelight */}
        <g className="al-art__bulb">
          <rect x="306" y="0" width="24" height="12" fill="#2a1512" />
          <path d="M302 12 h32 l-5 26 h-22z" fill="#ff3b1f" />
          <path d="M307 15 h6 l-3 18 h-3z" fill="#ffb199" opacity="0.6" />
        </g>
        {/* negatives curling in */}
        <g className="al-art__neg" transform="rotate(-14 30 200)">
          <rect x="-20" y="176" width="190" height="44" fill="#1d1210" />
          {Array.from({ length: 12 }, (_, i) => (
            <g key={i}>
              <rect x={-14 + i * 16} y="180" width="8" height="5" rx="1" fill="#3a2421" />
              <rect x={-14 + i * 16} y="211" width="8" height="5" rx="1" fill="#3a2421" />
            </g>
          ))}
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={-12 + i * 46} y="188" width="40" height="20" fill="#ff8a5a" opacity={0.16 + (i % 2) * 0.08} />
          ))}
        </g>
        {/* the line */}
        <path className="al-art__line" d="M-4 70 Q180 96 364 64" fill="none" stroke="#c9b6a4" strokeWidth="1.4" />
      </svg>
      <span className="al-art__prints">
        {slots.map((s, i) => (
          <span key={s?.id ?? `e${i}`} className={`al-art__print${s ? '' : ' is-empty'}`} style={{ '--i': i, '--r': `${[-5, 3, -2, 4, -3][i]}deg`, '--y': `${[6, 13, 16, 14, 7][i]}px` } as CSSProperties}>
            <i className="al-art__peg" />
            {s?.thumb ? <img src={s.thumb} alt="" /> : <span />}
          </span>
        ))}
      </span>
    </span>
  );
}
