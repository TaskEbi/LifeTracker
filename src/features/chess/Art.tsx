/**
 * Chess's header: the front of an old newspaper's chess column. Masthead ears either side of the
 * title and the day's problem printed as a diagram, dark squares hatched the way presses did them.
 * The position is the Scholar's Mate trap: White to play, Qxf7 mate.
 */
const PIECES: Record<string, string> = {
  p: 'M5 1.6a1.6 1.6 0 1 1 0 3.2a1.6 1.6 0 1 1 0-3.2zM4.3 4.6h1.4c.2 1.2 1.2 1.9 1.3 3.6H3c.1-1.7 1.1-2.4 1.3-3.6zM2.4 8.2h5.2v1H2.4z',
  r: 'M2.6 1.6h1.2v1h.8v-1h.8v1h.8v-1h.8v1h.8v-1h1.2v2.4l-.6.5.5 3.7H3.3l.5-3.7-.6-.5zM2.2 8.2h5.6v1H2.2z',
  n: 'M3 8.2c0-1.9 1.4-2.6 1.9-3.4-1 .3-2 0-2.6-.6-.4-.5 1.1-2.2 2-2.7l.3-.9.7.7c1.9.4 2.8 2.4 2.4 6.9zM2.4 8.2h5.4v1H2.4z',
  b: 'M5 .9a.7.7 0 1 1 0 1.4a.7.7 0 1 1 0-1.4zM5 2.4c1.1.8 2 2.3 1.6 4H3.4C3 4.7 3.9 3.2 5 2.4zM3.2 6.4h3.6v.8H3.2zM3.7 7.2h2.6l.7 1H3zM2.4 8.2h5.2v1H2.4z',
  q: 'M2.4 3.1l1.3 3.6L5 2.6l1.3 4.1 1.3-3.6-.5 4.3H2.9zM2.4 2.3a.65.65 0 1 1 0 1.3a.65.65 0 1 1 0-1.3zM5 1.7a.65.65 0 1 1 0 1.3a.65.65 0 1 1 0-1.3zM7.6 2.3a.65.65 0 1 1 0 1.3a.65.65 0 1 1 0-1.3zM2.9 7.4h4.2l.5.8H2.4zM2.2 8.2h5.6v1H2.2z',
  k: 'M4.6.5h.8v.8h.8v.8h-.8v.9h-.8v-.9h-.8v-.8h.8zM2.8 5.1c-.3-1.5 1.2-2.2 2.2-1.7 1-.5 2.5.2 2.2 1.7l-.6 2.3H3.4zM2.9 7.4h4.2l.5.8H2.4zM2.2 8.2h5.6v1H2.2z',
};

// Upper case White, lower case Black; ranks 8 → 1.
const BOARD = ['r.bqkb.r', 'pppp.ppp', '..n..n..', '....p..Q', '..B.P...', '........', 'PPPP.PPP', 'RNB.K.NR'];

export function ChessArt() {
  const squares = [];
  const men = [];
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++) {
      if ((x + y) % 2) squares.push(<rect key={`${x}${y}`} x={x * 10} y={y * 10} width="10" height="10" />);
      const c = BOARD[y][x];
      if (c === '.') continue;
      const white = c === c.toUpperCase();
      men.push(
        <path
          key={`m${x}${y}`}
          d={PIECES[c.toLowerCase()]}
          transform={`translate(${x * 10} ${y * 10})`}
          fill={white ? '#fbf7ec' : '#1b1a17'}
          stroke="#1b1a17"
          strokeWidth=".45"
          strokeLinejoin="round"
        />,
      );
    }
  return (
    <div className="i-chhead__art cg-paper" aria-hidden="true">
      <span className="cg-ear cg-ear--l">
        Est. 1475
        <br />
        Price: one pawn
      </span>
      <span className="cg-ear cg-ear--r">
        Forecast:
        <br />
        Sicilian, ±0.0
      </span>
      <div className="cg-problem">
        <span className="cg-problem__no">Problem № 6</span>
        <svg viewBox="-3 -3 86 86">
          <defs>
            <pattern id="cg-hatch" width="1.6" height="1.6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="1.6" height="1.6" fill="#fbf7ec" />
              <path d="M0 0v1.6" stroke="#1b1a17" strokeWidth=".7" />
            </pattern>
          </defs>
          <rect x="-3" y="-3" width="86" height="86" fill="#1b1a17" />
          <rect x="-1.6" y="-1.6" width="83.2" height="83.2" fill="#fbf7ec" />
          <rect x="0" y="0" width="80" height="80" fill="#fbf7ec" stroke="#1b1a17" strokeWidth=".5" />
          <g fill="url(#cg-hatch)">{squares}</g>
          {men}
          <path className="cg-arrow" d="M74 34L59.8 19.8" stroke="#b3261e" strokeWidth="2" strokeLinecap="round" />
          <path className="cg-arrowhead" d="M56 16l5.3 1.7-3.6 3.6z" fill="#b3261e" />
        </svg>
        <span className="cg-problem__cap">White to play, mate in one</span>
      </div>
    </div>
  );
}
