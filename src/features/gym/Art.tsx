/** Gym's header scene: a loaded barbell across the plate and a kettlebell hanging on the wall. */
export function GymArt() {
  const plates = (x: number, dir: 1 | -1) =>
    [
      { w: 14, h: 64 },
      { w: 12, h: 52 },
      { w: 8, h: 36 },
    ].map((p, i, all) => {
      const off = all.slice(0, i).reduce((n, q) => n + q.w + 2, 0);
      const px = dir === 1 ? x + off : x - off - p.w;
      return (
        <g key={i}>
          <rect x={px} y={35 - p.h / 2} width={p.w} height={p.h} rx="3" fill="url(#gy-plate)" stroke="#4a4f55" />
          {i === 0 && <rect x={px + p.w / 2 - 1.5} y={35 - p.h / 2 + 4} width="3" height={p.h - 8} fill="#ffcc00" opacity=".85" />}
        </g>
      );
    });
  return (
    <div className="i-chhead__art gy-wall" aria-hidden="true">
      <svg className="gy-kettle" viewBox="0 0 60 70">
        <path d="M30 0v8" stroke="#6b7177" strokeWidth="2" />
        <path d="M17 30C12 8 48 8 43 30" fill="none" stroke="#2a2d30" strokeWidth="7" strokeLinecap="round" />
        <path d="M17 30C12 8 48 8 43 30" fill="none" stroke="#5a6066" strokeWidth="2" strokeLinecap="round" />
        <circle cx="30" cy="46" r="21" fill="#17191b" stroke="#4a4f55" strokeWidth="1.5" />
        <ellipse cx="23" cy="39" rx="6" ry="4" fill="#fff" opacity=".08" />
        <text x="30" y="51" textAnchor="middle" fontSize="11" fill="#ffcc00" fontFamily="Black Ops One, sans-serif">
          16
        </text>
      </svg>
      <svg className="gy-barbell" viewBox="0 0 360 70" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="gy-bar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e9edf0" />
            <stop offset=".5" stopColor="#8a9096" />
            <stop offset="1" stopColor="#4a4f55" />
          </linearGradient>
          <linearGradient id="gy-plate" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#2c2f33" />
            <stop offset=".5" stopColor="#141517" />
            <stop offset="1" stopColor="#2c2f33" />
          </linearGradient>
        </defs>
        <rect x="6" y="32" width="348" height="6" rx="3" fill="url(#gy-bar)" />
        <rect x="22" y="29" width="60" height="12" rx="2" fill="url(#gy-bar)" />
        <rect x="278" y="29" width="60" height="12" rx="2" fill="url(#gy-bar)" />
        <rect x="80" y="26" width="6" height="18" rx="1" fill="#6b7177" />
        <rect x="274" y="26" width="6" height="18" rx="1" fill="#6b7177" />
        {plates(78, -1)}
        {plates(282, 1)}
        <path d="M150 35h60" stroke="#2a2d30" strokeWidth="6" strokeDasharray="1 2" opacity=".5" />
      </svg>
    </div>
  );
}
