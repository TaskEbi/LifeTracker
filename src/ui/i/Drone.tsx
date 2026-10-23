import { STAGES } from '../../domain/progress/engine';

/** The character: a geometric drone that gains hardware as the overall level grows. */
export function Drone({ stage, still, happy, label = true }: { stage: number; still?: boolean; happy?: boolean; label?: boolean }) {
  const s = Math.max(0, Math.min(STAGES.length - 1, stage));
  const r = [30, 34, 36, 38, 40][s];
  const spin = still ? undefined : 'i-spin';
  return (
    <svg viewBox="0 0 200 200" role={label ? 'img' : undefined} aria-label={label ? `${STAGES[s].name} drone, your character` : undefined} aria-hidden={label ? undefined : true}>
      {s >= 4 && (
        <>
          <circle cx="100" cy="100" r="86" fill="none" stroke="var(--sig)" strokeWidth="1.5" strokeDasharray="3 6" className={spin} style={{ animationDuration: '12s' }} />
          <path d="M100 22 l4 8 9 1 -7 6 2 9 -8 -5 -8 5 2 -9 -7 -6 9 -1z" fill="var(--sig)" />
        </>
      )}
      <ellipse cx="100" cy="182" rx={30 + s * 4} ry="5" fill="var(--fg)" opacity=".12" />
      <g className={still ? undefined : 'i-hover'}>
        {s >= 2 &&
          [
            [-1, 34],
            [1, 166],
          ].map(([dir, x]) => (
            <g key={x}>
              <path d={`M${100 + dir * 34} 96 L${x} 78`} stroke="var(--fg)" strokeWidth="4" strokeLinecap="round" />
              <g transform={`translate(${x} 74)`}>
                <ellipse rx="22" ry="4" fill="var(--fg-3)" opacity=".5" className={spin} />
                <circle r="5" fill="var(--fg)" />
              </g>
            </g>
          ))}
        {s >= 3 && (
          <>
            <path d="M100 58 L100 34" stroke="var(--fg)" strokeWidth="3" />
            <circle cx="100" cy="30" r="5" fill="var(--sig)" />
            <rect x="58" y="118" width="18" height="30" rx="3" fill="var(--surf-2)" stroke="var(--fg)" strokeWidth="2.5" />
            <rect x="124" y="118" width="18" height="30" rx="3" fill="var(--surf-2)" stroke="var(--fg)" strokeWidth="2.5" />
            <path d="M61 126 h12 M61 134 h12 M61 142 h12 M127 126 h12 M127 134 h12 M127 142 h12" stroke="var(--c-coding)" strokeWidth="2" />
          </>
        )}
        {s >= 1 && (
          <>
            <ellipse cx="100" cy="104" rx="62" ry="16" fill="none" stroke="var(--fg)" strokeWidth="3" />
            <ellipse cx="100" cy="104" rx="62" ry="16" fill="none" stroke="var(--sig)" strokeWidth="3" strokeDasharray="14 180" className={spin} />
          </>
        )}
        <circle cx="100" cy="96" r={r} fill="var(--surf)" stroke="var(--fg)" strokeWidth="3.5" />
        <path d={`M${100 - r * 0.7} ${96 - r * 0.45} A${r} ${r} 0 0 1 ${100 + r * 0.7} ${96 - r * 0.45}`} fill="none" stroke="var(--fg-3)" strokeWidth="2" opacity=".5" />
        <rect x={100 - r * 0.62} y="86" width={r * 1.24} height="20" rx="10" fill="var(--fg)" />
        <g className={still ? undefined : 'i-blink'}>
          <rect x={happy ? 84 : 86} y={happy ? 92 : 91} width={happy ? 32 : 28} height={happy ? 6 : 10} rx={happy ? 3 : 5} fill="var(--sig)" />
        </g>
      </g>
    </svg>
  );
}
