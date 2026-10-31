/**
 * Future's header: a station concourse at night. A big station clock, the platform sign for the
 * entry year, a train waiting with its windows lit, and the rails running off toward the light.
 */
export function FutureArt({ entry }: { entry: number }) {
  return (
    <span className="i-chhead__art fu-art" aria-hidden="true">
      <svg viewBox="0 0 360 230" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="fu-glow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffb000" stopOpacity="0" />
            <stop offset="1" stopColor="#ffb000" stopOpacity="0.28" />
          </linearGradient>
          <linearGradient id="fu-rail" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#ffb000" stopOpacity="0.1" />
            <stop offset="1" stopColor="#ffb000" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        {/* roof trusses */}
        <g stroke="#2a2a2e" strokeWidth="2" fill="none">
          <path d="M0 18 L180 0 L360 18" />
          {[30, 75, 120, 165, 210, 255, 300, 345].map((x) => (
            <path key={x} d={`M${x} ${x < 180 ? 18 - (x / 180) * 18 : (x - 180) / 10} L${x} 34`} />
          ))}
          <path d="M0 34 H360" />
        </g>
        {/* station clock */}
        <g className="fu-art__clock" transform="translate(236 56)">
          <circle r="26" fill="#f4efe4" stroke="#1b1b1d" strokeWidth="4" />
          {Array.from({ length: 12 }, (_, i) => (
            <rect key={i} x="-1" y="-22" width="2" height={i % 3 ? 4 : 7} fill="#1b1b1d" transform={`rotate(${i * 30})`} />
          ))}
          <rect className="fu-art__hour" x="-1.6" y="-13" width="3.2" height="15" fill="#1b1b1d" />
          <rect className="fu-art__min" x="-1.2" y="-20" width="2.4" height="22" fill="#1b1b1d" />
          <g className="fu-art__sec">
            <rect x="-0.6" y="-21" width="1.2" height="25" fill="#d8402c" />
            <circle cy="-15" r="2.6" fill="#d8402c" />
          </g>
          <line x1="0" y1="-26" x2="0" y2="-44" stroke="#2a2a2e" strokeWidth="2" />
        </g>
        {/* platform sign */}
        <g transform="translate(14 150)">
          <rect width="64" height="34" rx="3" fill="#1d4ed8" />
          <text x="32" y="13" textAnchor="middle" fontSize="7.5" fill="#dbe7ff" fontFamily="Public Sans, sans-serif" fontWeight="700" letterSpacing="1">PLATFORM</text>
          <text x="32" y="29" textAnchor="middle" fontSize="15" fill="#fff" fontFamily="'Bebas Neue', sans-serif">{entry}</text>
        </g>
        {/* the train */}
        <g className="fu-art__train">
          <path d="M150 196 H372 V150 Q372 140 362 140 H176 Q150 140 150 166 Z" fill="#202024" stroke="#38383e" />
          {[176, 206, 236, 266, 296, 326].map((x, i) => (
            <rect key={x} className="fu-art__win" style={{ animationDelay: `${i * 0.35}s` }} x={x} y="148" width="22" height="14" rx="2" fill="#ffcf5a" />
          ))}
          <rect x="150" y="174" width="222" height="4" fill="#ffb000" />
          <circle cx="160" cy="182" r="3.5" fill="#fff3c4" />
        </g>
        {/* platform edge and rails */}
        <rect x="0" y="196" width="360" height="34" fill="url(#fu-glow)" />
        <path d="M0 200 H360" stroke="#f4efe4" strokeWidth="3" strokeDasharray="14 8" opacity="0.55" />
        <path d="M0 214 L360 208" stroke="url(#fu-rail)" strokeWidth="2" />
        <path d="M0 226 L360 218" stroke="url(#fu-rail)" strokeWidth="2" />
      </svg>
    </span>
  );
}
