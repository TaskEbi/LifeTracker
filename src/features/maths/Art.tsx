/**
 * Maths' header: a page from Oliver Byrne's Euclid (1847), which drew its proofs in red, blue and
 * yellow. The figure is Proposition I.47, Pythagoras' squares on a right triangle. The square on the
 * hypotenuse counts down to the next contest, and each real contest you've sat adds a tombstone.
 */
const RED = '#c8392b';
const BLUE = '#1f4e8c';
const YELLOW = '#e8b52a';
const INK = '#1c1a17';

export function MathsArt({ days, name, sat }: { days: number | null; name: string | null; sat: number }) {
  return (
    <span className="i-chhead__art ma-art" aria-hidden="true">
      <svg viewBox="0 0 360 230" preserveAspectRatio="xMaxYMax slice">
        <g transform="translate(78 54) scale(0.8)">
          <path className="ma-art__fill ma-art__fill--a" d="M200 120L152 84L188 36L236 72Z" fill={BLUE} />
          <path className="ma-art__fill ma-art__fill--b" d="M236 72L284 8L348 56L300 120Z" fill={YELLOW} />
          <path className="ma-art__fill ma-art__fill--c" d="M200 120H300V220H200Z" fill={RED} />
          <path className="ma-art__tri" d="M200 120L300 120L236 72Z" fill="#f5ecd7" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
          {/* the dotted lines Euclid draws to prove it */}
          <path className="ma-art__line" d="M236 72V120M152 84L300 120M200 120L348 56" stroke={INK} strokeWidth="1.3" strokeDasharray="2 4" fill="none" />
          <path d="M243 77.2L238.4 83.4L232 78.6" stroke={INK} strokeWidth="1.3" fill="none" />
          <g fontFamily="'IM Fell English', Georgia, serif" fontStyle="italic" fontSize="15" fill={INK}>
            <text x="190" y="136" textAnchor="end">A</text>
            <text x="309" y="134">B</text>
            <text x="238" y="62" textAnchor="middle">C</text>
          </g>
          {days != null ? (
            <g className="ma-art__count" textAnchor="middle" fill="#f5ecd7" fontFamily="'EB Garamond', Georgia, serif">
              <text x="250" y="182" fontSize="52" fontWeight="500">{days}</text>
              <text x="250" y="206" fontSize="13" fontStyle="italic">{days === 1 ? 'day' : 'days'} to {name}</text>
            </g>
          ) : (
            <text className="ma-art__count" x="250" y="180" textAnchor="middle" fontSize="26" fontStyle="italic" fill="#f5ecd7" fontFamily="'IM Fell English', Georgia, serif">Q.E.D.</text>
          )}
          <text className="ma-art__qed" x="350" y="222" textAnchor="end" fontSize="20" fontStyle="italic" fill={INK} fontFamily="'IM Fell English', Georgia, serif">Q.E.D.</text>
        </g>
        {/* the dividers, opened on the page */}
        <g transform="translate(92 46) scale(0.8)"><g className="ma-art__dividers" stroke={INK} strokeLinecap="round" fill="none">
          <path d="M42 150L60 196M42 150L24 196" strokeWidth="2.6" />
          <circle cx="42" cy="146" r="4.2" fill={YELLOW} strokeWidth="1.6" />
          <path d="M16 200A28 28 0 0 0 68 200" strokeWidth="1" strokeDasharray="2 3" />
        </g></g>
        {/* one tombstone per contest sat */}
        <g fill={INK}>
          {Array.from({ length: Math.min(sat, 10) }, (_, i) => (
            <rect key={i} className="ma-art__stone" style={{ animationDelay: `${0.4 + i * 0.05}s` }} x={100 + i * 11} y="214" width="8" height="10" />
          ))}
        </g>
      </svg>
    </span>
  );
}
