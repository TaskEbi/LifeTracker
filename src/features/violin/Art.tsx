/** Violin's header scene: a recital stage, velvet curtains tied back, footlights, a violin and bow in the spotlight. */
const BODY =
  'M65 110C86 110 113 121 113 148C113 165 110 175 104 180C97 184 94 192 95 203C96 214 98 221 106 226C119 234 125 251 125 270C125 299 99 316 65 316C31 316 5 299 5 270C5 251 11 234 24 226C32 221 34 214 35 203C36 192 33 184 26 180C20 175 17 165 17 148C17 121 44 110 65 110Z';

export function ViolinArt() {
  return (
    <div className="i-chhead__art vl-stage" aria-hidden="true">
      <span className="vl-spot" />
      <span className="vl-floor" />
      <svg className="vl-notes" viewBox="0 0 60 50">
        <path d="M14 34a5 3.6 -20 1 0 .1 0zM44 28a5 3.6 -20 1 0 .1 0z" fill="#e8c27a" />
        <path d="M18.5 32V8l30-6v24" fill="none" stroke="#e8c27a" strokeWidth="2" />
        <path d="M18.5 8l30-6v5l-30 6z" fill="#e8c27a" />
      </svg>
      <svg className="vl-violin" viewBox="0 0 130 330">
        <defs>
          <linearGradient id="vl-wood" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e3913f" />
            <stop offset=".45" stopColor="#b5541f" />
            <stop offset="1" stopColor="#5e220c" />
          </linearGradient>
          <radialGradient id="vl-shine" cx=".36" cy=".32" r=".6">
            <stop offset="0" stopColor="#ffe6b8" stopOpacity=".55" />
            <stop offset=".6" stopColor="#ffe6b8" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="vl-edge" cx=".5" cy=".5" r=".55">
            <stop offset=".75" stopColor="#2a0d03" stopOpacity="0" />
            <stop offset="1" stopColor="#2a0d03" stopOpacity=".55" />
          </radialGradient>
        </defs>
        {/* scroll, pegbox and pegs */}
        <path d="M66 31V20M64 31V20" stroke="#2a0f04" strokeWidth=".8" />
        <path d="M58 28h14l1 34H57z" fill="#8a3c15" stroke="#2a0f04" strokeWidth="1.2" />
        <path d="M61 31h8l.6 28h-9.2z" fill="#1d0c05" />
        <circle cx="65" cy="16" r="11" fill="url(#vl-wood)" stroke="#2a0f04" strokeWidth="1.2" />
        <path d="M65 16m-6.5 0a6.5 6.5 0 1 1 6.5 6.5a4 4 0 1 1 -3.6 -5.2a1.8 1.8 0 1 1 2.4 1.6" fill="none" stroke="#2a0f04" strokeWidth="1.2" strokeLinecap="round" />
        <g fill="#1d0c05">
          <path d="M57 35h-9l-2-2.4v6.8l2-2.4h9zM57 51h-9l-2-2.4v6.8l2-2.4h9zM73 43h9l2-2.4v6.8l-2-2.4h-9zM73 57h9l2-2.4v6.8l-2-2.4h-9z" />
        </g>
        <g fill="#e8c27a">
          <circle cx="45.4" cy="36" r="1.3" />
          <circle cx="45.4" cy="52" r="1.3" />
          <circle cx="84.6" cy="44" r="1.3" />
          <circle cx="84.6" cy="58" r="1.3" />
        </g>
        {/* neck */}
        <path d="M59 62h12l1 50H58z" fill="#9c4a1c" />
        {/* body */}
        <path d={BODY} fill="url(#vl-wood)" stroke="#2a0f04" strokeWidth="1.6" />
        <path d={BODY} fill="url(#vl-shine)" />
        <path d={BODY} fill="url(#vl-edge)" />
        <path d={BODY} fill="none" stroke="#2a0f04" strokeOpacity=".6" strokeWidth=".9" transform="translate(65 213) scale(.93) translate(-65 -213)" />
        {/* f-holes */}
        <g fill="none" stroke="#1d0c05" strokeWidth="2" strokeLinecap="round">
          <path d="M48 190c-5 6 3 15-2 24s-6 15-2 21" />
          <path d="M82 190c5 6-3 15 2 24s6 15 2 21" />
        </g>
        <g fill="#1d0c05">
          <circle cx="49" cy="188.5" r="2.2" />
          <circle cx="43.6" cy="236.6" r="2.2" />
          <circle cx="81" cy="188.5" r="2.2" />
          <circle cx="86.4" cy="236.6" r="2.2" />
        </g>
        {/* fingerboard, bridge, tailpiece, strings */}
        <path d="M59.5 60h11l3.6 152q-9.1 5-18.2 0z" fill="#17100c" />
        <path d="M60 60h10" stroke="#ecd29a" strokeWidth="1.6" />
        <path d="M48 238h34l-2.6-7.4h-28.8z" fill="#f0d9a3" stroke="#6b4a1a" strokeWidth=".8" />
        <path d="M51.6 238h4.6M73.8 238h4.6" stroke="#6b4a1a" strokeWidth="1.6" />
        <path d="M57.6 252h14.8l3.4 40q-10.8 7-21.6 0z" fill="#17100c" />
        <circle cx="65" cy="296" r="1.4" fill="#e8c27a" />
        <g stroke="#f6ead0" strokeWidth=".7">
          <path d="M61.8 61L59.5 253" />
          <path d="M64 61L63.4 253" />
          <path d="M66 61L66.6 253" />
          <path d="M68.2 61L70.5 253" />
        </g>
        <path d={BODY} fill="none" stroke="#ffe6b8" strokeOpacity=".25" strokeWidth=".8" transform="translate(-1.4 -1.4)" />
      </svg>
      <svg className="vl-bow" viewBox="0 0 14 300">
        <path d="M5 6Q2.6 150 5 290" fill="none" stroke="#4a210c" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M10.4 12L10.4 272" stroke="#f3ead8" strokeOpacity=".85" strokeWidth="1.6" />
        <path d="M3 2h8.4v10.6H5z" fill="#efe2c4" stroke="#4a210c" strokeWidth=".8" />
        <path d="M3.4 268h8v20h-8z" fill="#17100c" />
        <circle cx="7.4" cy="276" r="1.8" fill="#f2efe6" />
        <path d="M3.4 288h8v4h-8z" fill="#c9a24a" />
      </svg>
      <span className="vl-lamps" />
      <span className="vl-valance" />
      <span className="vl-curtain vl-curtain--l" />
      <span className="vl-curtain vl-curtain--r" />
    </div>
  );
}
