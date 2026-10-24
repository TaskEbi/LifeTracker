/** Sports' header scene: a topographic trail map with a route to the summit, pines and a compass. */
export function SportsArt() {
  return (
    <div className="i-chhead__art sp-map" aria-hidden="true">
      <svg className="sp-topo" viewBox="0 0 240 200" preserveAspectRatio="xMaxYMid slice">
        <g fill="none" stroke="#cfe3c4" strokeOpacity=".35" strokeWidth="1.2">
          <path d="M170 92c26-6 44 6 44 24s-22 30-46 28-40-12-38-28 14-20 40-24z" />
          <path d="M168 74c38-8 66 10 66 40s-30 50-66 48-66-20-62-46 24-36 62-42z" />
          <path d="M164 56c50-10 88 12 88 54s-40 70-88 68-90-28-86-64 34-50 86-58z" />
          <path d="M160 36c62-12 110 14 110 70s-52 92-110 90-114-36-108-84 44-64 108-76z" />
          <path d="M156 16c74-14 132 16 132 86s-62 114-132 112-138-44-130-104 54-80 130-94z" />
          <path d="M20 170c20-14 50-10 64 2s-6 26-30 24-48-12-34-26z" />
          <path d="M10 160c28-22 70-18 90 2s-8 40-44 38-70-18-46-40z" />
        </g>
        <path className="sp-route" d="M18 196C40 178 30 156 58 150S96 162 112 140S118 104 142 102S168 112 172 104" fill="none" stroke="#ff8a3d" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 7" />
        <circle cx="18" cy="196" r="5" fill="#fff6dc" stroke="#1d3324" strokeWidth="2" />
        <path d="M172 104V80" stroke="#fff6dc" strokeWidth="2" />
        <path d="M172 80h16l-5 5 5 5h-16z" fill="#ff8a3d" />
        <g fill="#1c3a26" stroke="#9cc28e" strokeWidth=".8">
          <path d="M70 128l-7 14h14z M70 122l-6 12h12z" />
          <path d="M84 132l-7 14h14z M84 126l-6 12h12z" />
          <path d="M204 150l-7 14h14z M204 144l-6 12h12z" />
          <path d="M216 156l-6 12h12z M216 150l-5 10h10z" />
          <path d="M120 170l-7 14h14z M120 164l-6 12h12z" />
        </g>
        <path d="M150 116l12-20 8 10 6-6 14 16z" fill="#e8efd9" opacity=".85" />
      </svg>
      <svg className="sp-compass" viewBox="0 -8 64 72">
        <circle cx="32" cy="32" r="27" fill="none" stroke="#fff6dc" strokeWidth="1.5" />
        <circle cx="32" cy="32" r="22" fill="none" stroke="#fff6dc" strokeOpacity=".4" strokeDasharray="1 3" />
        <path d="M32 6l5 26-5 26-5-26z" fill="#fff6dc" />
        <path d="M32 6l5 26h-10z" fill="#ff8a3d" />
        <path d="M6 32l26-4 26 4-26 4z" fill="#fff6dc" opacity=".6" />
        <text x="32" y="4" textAnchor="middle" fontSize="7" fontWeight="700" fill="#fff6dc" fontFamily="Zilla Slab, serif">
          N
        </text>
      </svg>
    </div>
  );
}
