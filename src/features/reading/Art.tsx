/**
 * Reading's header: a window seat on a rainy night. Rain runs down the glass past the city's lights,
 * a lamp is on, a cat sleeps on the sill. The Kindle leaning there shows the current book's
 * percentage, and the row of books beside it grows with the books you've finished (the art is
 * anchored right: a phone crops its left side).
 */
import { clothOf } from './Cover';

const STREAKS = [
  [204, 8, 26], [222, 34, 18], [238, 2, 30], [256, 44, 16], [270, 18, 24], [288, 50, 14], [304, 6, 28], [320, 38, 20], [334, 22, 24],
  [212, 70, 22], [246, 84, 14], [278, 76, 20], [314, 90, 16], [328, 66, 18],
] as const;

const LIGHTS = [
  [214, 112, 7, '#ffb84d'], [236, 124, 4, '#ff7a59'], [258, 108, 5.5, '#ffd98a'], [283, 118, 8, '#7fd1ff'], [306, 106, 4.5, '#ffb84d'], [328, 120, 6, '#ff9db0'],
] as const;

export function ReadingArt({ pct, finished, titles }: { pct: number | null; finished: number; titles: string[] }) {
  const shown = Math.min(finished, 6);
  return (
    <span className="i-chhead__art rd-art" aria-hidden="true">
      <svg viewBox="0 0 360 230" preserveAspectRatio="xMaxYMax slice">
        <defs>
          <linearGradient id="rd-glass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0d2230" />
            <stop offset="1" stopColor="#1d4150" />
          </linearGradient>
          <radialGradient id="rd-lamp" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#ffcf87" stopOpacity="0.62" />
            <stop offset="1" stopColor="#ffcf87" stopOpacity="0" />
          </radialGradient>
          <clipPath id="rd-pane">
            <rect x="196" y="12" width="150" height="130" rx="2" />
          </clipPath>
        </defs>

        {/* the window: glass, the city, the rain */}
        <rect x="196" y="12" width="150" height="130" fill="url(#rd-glass)" />
        <g clipPath="url(#rd-pane)">
          <path d="M196 132V112H212V98H228V118H246V90H266V110H286V100H304V120H322V94H346V142H196Z" fill="#0a1a24" />
          {LIGHTS.map(([x, y, r, c], i) => (
            <circle key={i} className="rd-art__bokeh" style={{ animationDelay: `${i * 0.7}s` }} cx={x} cy={y} r={r} fill={c} opacity="0.5" />
          ))}
          <g className="rd-art__rain">
            {[0, 1].map((k) => (
              <g key={k} transform={`translate(0 ${k * -130})`}>
                {STREAKS.map(([x, y, h], i) => (
                  <path key={i} d={`M${x} ${y}v${h}`} stroke="#bfe3f2" strokeWidth={i % 3 ? 0.9 : 1.4} strokeLinecap="round" opacity={i % 2 ? 0.34 : 0.55} />
                ))}
              </g>
            ))}
          </g>
          <circle className="rd-art__run" cx="236" cy="10" r="1.7" fill="#d8f0fa" />
          <circle className="rd-art__run rd-art__run--b" cx="312" cy="20" r="1.4" fill="#d8f0fa" />
        </g>
        {/* frame */}
        <g fill="none" stroke="#4b2f1c">
          <rect x="196" y="12" width="150" height="130" strokeWidth="6" />
          <path d="M271 12V142M196 74H346" strokeWidth="3.6" />
        </g>
        <rect x="186" y="142" width="172" height="9" rx="1.5" fill="#6a4427" />
        <rect x="186" y="150" width="172" height="3" fill="#2d1b0f" />

        {/* the cat, asleep on the sill */}
        <g fill="#14100d" transform="translate(-84 0)">
          <path d="M292 142C288 128 296 118 312 118C322 118 328 122 332 128L336 121L339 130C342 134 342 139 340 142Z" />
          <path className="rd-art__tail" d="M294 141C284 141 278 138 277 132C276 128 280 126 282 128C281 133 286 136 296 136Z" />
        </g>
        <path d="M247 133q2 1.6 4 0" stroke="#5c5046" strokeWidth="0.9" fill="none" />

        <g transform="translate(0 10)">
        {/* the lamp, standing on the shelf */}
        <circle className="rd-art__glow" cx="196" cy="160" r="66" fill="url(#rd-lamp)" />
        <path d="M193 172H199V192H193Z" fill="#3a2412" />
        <path d="M184 196C184 191 189 190 196 190C203 190 208 191 208 196Z" fill="#6f4a22" />
        <path d="M180 172L187 146H205L212 172Z" fill="#c9853c" stroke="#3a2412" strokeWidth="1.2" />
        <ellipse cx="196" cy="172" rx="16" ry="2.4" fill="#ffe2a8" />

        {/* the shelf, growing with what you've finished */}
        <rect x="0" y="196" width="360" height="8" fill="#6a4427" />
        <rect x="0" y="204" width="360" height="26" fill="#22140b" />
        {titles.slice(0, shown).map((t, i) => {
          const [cloth, foil] = clothOf(t);
          const h = 34 + ((i * 37) % 14);
          const w = 10 + ((i * 13) % 6);
          const x = 92 + titles.slice(0, i).reduce((n, _, j) => n + 10 + ((j * 13) % 6) + 1, 0);
          return (
            <g key={t} className="rd-art__spine" style={{ animationDelay: `${0.25 + i * 0.05}s` }}>
              <rect x={x} y={196 - h} width={w} height={h} rx="1" fill={cloth} />
              <rect x={x + 1} y={196 - h + 5} width={w - 2} height="1.6" fill={foil} opacity="0.8" />
              <rect x={x + 1} y={190} width={w - 2} height="1.2" fill={foil} opacity="0.6" />
            </g>
          );
        })}

        {/* the mug */}
        <g transform="translate(222 168)">
          <path className="rd-art__steam" d="M9 -4C6 -9 12 -12 9 -18" stroke="#efe4d0" strokeWidth="1.3" fill="none" strokeLinecap="round" />
          <path className="rd-art__steam rd-art__steam--b" d="M16 -4C13 -9 19 -12 16 -18" stroke="#efe4d0" strokeWidth="1.3" fill="none" strokeLinecap="round" />
          <rect x="2" y="0" width="22" height="28" rx="3" fill="#d8cbb4" />
          <path d="M24 6h3a5 5 0 0 1 0 14h-3" fill="none" stroke="#d8cbb4" strokeWidth="3" />
          <rect x="2" y="0" width="22" height="4" rx="2" fill="#5c3a20" />
        </g>

        {/* the Kindle */}
        <g transform="translate(268 156) rotate(-4)">
          <rect x="0" y="0" width="58" height="42" rx="3.5" fill="#15181b" />
          <rect x="3.5" y="3" width="51" height="33" fill="#e7e3d6" />
          <g stroke="#3c3a35" strokeWidth="1">
            <path d="M8 9H50M8 13H50M8 17H47M8 21H50" />
          </g>
          {pct != null ? (
            <>
              <rect x="8" y="29" width="30" height="2" fill="#c8c3b4" />
              <rect x="8" y="29" width={(30 * pct) / 100} height="2" fill="#1d1c19" />
              <text x="50" y="32" textAnchor="end" fontSize="6" fontFamily="'Spline Sans Mono', monospace" fill="#1d1c19">{pct}%</text>
            </>
          ) : (
            <path d="M8 25H36" stroke="#3c3a35" strokeWidth="1" />
          )}
        </g>
        </g>
      </svg>
    </span>
  );
}
