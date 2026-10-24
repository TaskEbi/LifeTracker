/** Screen time's header scene: a raked-sand garden with two stones, their ripples and a sprig of bamboo. */
function Ripples({ cx, cy, rx, ry, n }: { cx: number; cy: number; rx: number; ry: number; n: number }) {
  return (
    <g fill="none" stroke="#c4b79c" strokeWidth="1.4">
      {Array.from({ length: n }, (_, i) => (
        <ellipse key={i} cx={cx} cy={cy} rx={rx + 10 * (i + 1)} ry={ry + 6.5 * (i + 1)} opacity={1 - i * 0.12} />
      ))}
    </g>
  );
}

export function ScreenArt() {
  return (
    <div className="i-chhead__art zn-garden" aria-hidden="true">
      <svg className="zn-sand" viewBox="0 0 240 170">
        <defs>
          <radialGradient id="zn-stone" cx=".35" cy=".3" r=".75">
            <stop offset="0" stopColor="#a39e94" />
            <stop offset=".6" stopColor="#6e6a62" />
            <stop offset="1" stopColor="#45423d" />
          </radialGradient>
        </defs>
        <ellipse cx="150" cy="86" rx="84" ry="53" fill="#ebe3d2" />
        <ellipse cx="70" cy="138" rx="44" ry="28" fill="#ebe3d2" />
        <g className="zn-rings">
          <Ripples cx={150} cy={86} rx={22} ry={13} n={6} />
          <Ripples cx={70} cy={138} rx={12} ry={7} n={3} />
        </g>
        <ellipse cx="150" cy="92" rx="24" ry="9" fill="#000" opacity=".12" />
        <path d="M128 88c0-14 10-22 22-22s24 6 24 20-10 16-24 16-22-4-22-14z" fill="url(#zn-stone)" />
        <ellipse cx="70" cy="141" rx="13" ry="5" fill="#000" opacity=".12" />
        <path d="M58 138c0-7 6-12 12-12s13 4 13 11-6 8-13 8-12-1-12-7z" fill="url(#zn-stone)" />
        <circle cx="96" cy="100" r="2.2" fill="#8c8578" />
        <circle cx="104" cy="96" r="1.6" fill="#8c8578" />
      </svg>
      <svg className="zn-bamboo" viewBox="0 0 40 120">
        <path d="M14 120V8" stroke="#5f7a4a" strokeWidth="5" />
        <path d="M11 40h6M11 74h6M11 104h6" stroke="#3f5a33" strokeWidth="2" />
        <path d="M16 38c10-6 18-6 24-2c-8 4-16 5-24 2zM14 70c-8-8-12-10-14-10c4 6 8 10 14 10zM16 22c8-10 14-14 22-14c-6 8-12 12-22 14z" fill="#7a9a5c" />
      </svg>
    </div>
  );
}
