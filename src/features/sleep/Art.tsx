/** Sleep's header scene: a cratered moon, a constellation, drifting clouds and a cottage on the hills. */
export function SleepArt() {
  return (
    <div className="i-chhead__art sl-scene" aria-hidden="true">
      <svg className="sl-stars" viewBox="0 0 120 60">
        <g stroke="#cdd3ff" strokeOpacity=".35" strokeWidth=".7" fill="none">
          <path d="M8 40L26 30L44 34L58 22L80 26L92 12L110 16" />
        </g>
        <g fill="#fff">
          <circle cx="8" cy="40" r="1.4" />
          <circle cx="26" cy="30" r="1.8" />
          <circle cx="44" cy="34" r="1.3" />
          <circle cx="58" cy="22" r="1.9" />
          <circle cx="80" cy="26" r="1.4" />
          <circle cx="92" cy="12" r="1.6" />
          <circle cx="110" cy="16" r="1.2" />
        </g>
      </svg>
      <svg className="sl-moon" viewBox="0 0 80 80">
        <defs>
          <radialGradient id="sl-moon-g" cx=".38" cy=".35" r=".7">
            <stop offset="0" stopColor="#fff6d8" />
            <stop offset=".7" stopColor="#f2d792" />
            <stop offset="1" stopColor="#d9b56a" />
          </radialGradient>
        </defs>
        <circle cx="40" cy="40" r="30" fill="url(#sl-moon-g)" />
        <circle cx="30" cy="30" r="6" fill="#d9b56a" opacity=".45" />
        <circle cx="50" cy="48" r="8" fill="#d9b56a" opacity=".35" />
        <circle cx="46" cy="24" r="3.5" fill="#d9b56a" opacity=".4" />
        <circle cx="28" cy="52" r="3" fill="#d9b56a" opacity=".35" />
      </svg>
      <svg className="sl-cloud sl-cloud--a" viewBox="0 0 100 34">
        <path d="M12 30h74a12 12 0 0 0 0-24a16 16 0 0 0-30-2a14 14 0 0 0-26 8a10 10 0 0 0-18 18z" fill="#9aa3e6" opacity=".22" />
      </svg>
      <svg className="sl-cloud sl-cloud--b" viewBox="0 0 100 34">
        <path d="M12 30h74a12 12 0 0 0 0-24a16 16 0 0 0-30-2a14 14 0 0 0-26 8a10 10 0 0 0-18 18z" fill="#b6bdf5" opacity=".16" />
      </svg>
      <span className="sl-z">
        z<b>z</b>
        <i>Z</i>
      </span>
      <svg className="sl-hills" viewBox="0 0 400 90" preserveAspectRatio="none">
        <path d="M0 50C60 20 120 30 180 46S300 20 400 38V90H0Z" fill="#232a63" />
        <path d="M0 66C70 46 150 58 220 64S340 46 400 56V90H0Z" fill="#181d4a" />
        <path d="M0 80C80 70 160 78 260 76S360 70 400 74V90H0Z" fill="#0f1335" />
      </svg>
      <svg className="sl-house" viewBox="0 0 70 60">
        <path d="M10 58V30L30 14L50 30V58Z" fill="#0f1335" />
        <path d="M6 32L30 12L54 32" fill="none" stroke="#0f1335" strokeWidth="4" strokeLinejoin="round" />
        <rect x="38" y="16" width="6" height="12" fill="#0f1335" />
        <rect className="sl-window" x="22" y="34" width="10" height="10" fill="#ffd77a" />
        <path d="M27 34v10M22 39h10" stroke="#0f1335" strokeWidth="1.2" />
        <path d="M60 58V40M60 24l-8 18h16zM60 32l-6 12h12z" fill="#0f1335" stroke="#0f1335" />
      </svg>
    </div>
  );
}
