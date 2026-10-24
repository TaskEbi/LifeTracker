/** Study's header scene: a chalkboard with formulas, a sketched triangle and a chalk tray. */
export function StudyArt() {
  return (
    <div className="i-chhead__art st-board" aria-hidden="true">
      <span className="st-dust" />
      <span className="st-f st-f1">∫ x² dx = x³⁄3 + C</span>
      <span className="st-f st-f2">a² + b² = c²</span>
      <span className="st-f st-f3">F = ma</span>
      <svg className="st-tri" viewBox="0 0 70 56">
        <path d="M6 50L62 50L6 8Z" fill="none" stroke="#f4f1e6" strokeWidth="2" strokeLinejoin="round" strokeDasharray="60 2 40 3 200" />
        <path d="M6 42h8v8" fill="none" stroke="#f4f1e6" strokeWidth="1.5" />
        <text x="30" y="56" fontSize="9" fill="#f4f1e6" fontFamily="Caveat, cursive">b</text>
        <text x="0" y="32" fontSize="9" fill="#f4f1e6" fontFamily="Caveat, cursive">a</text>
        <text x="36" y="27" fontSize="9" fill="#f4f1e6" fontFamily="Caveat, cursive">c</text>
      </svg>
      <span className="st-tray">
        <i className="st-chalk" />
        <i className="st-chalk st-chalk--y" />
        <i className="st-eraser" />
      </span>
    </div>
  );
}
