import type { BossDef } from '../../domain/progress/boss';

/** A boss as a drawn yōkai mask: horns, brows, glowing eyes and its own mouth. */
export function BossArt({ boss, down, unknown }: { boss: BossDef; down?: boolean; unknown?: boolean }) {
  const ink = unknown ? 'var(--fg-3)' : boss.c;
  const glow = unknown ? 'var(--surf-3)' : boss.c2;
  const horn = (x: number, flip: 1 | -1, tall = 1) => (
    <path d={`M${x} 40 Q${x + flip * 4} ${26 - 10 * tall} ${x + flip * 14} ${14 - 8 * tall} Q${x + flip * 12} ${30 - 4 * tall} ${x + flip * 16} 42 Z`} fill={glow} stroke="#111" strokeWidth="2.5" strokeLinejoin="round" />
  );
  return (
    <svg viewBox="0 0 120 120" className={`b-art${down ? ' is-down' : ''}${unknown ? ' is-unknown' : ''}`} aria-hidden="true">
      {!unknown && <circle cx="60" cy="64" r="54" fill={boss.c2} opacity="0.22" className="b-art__aura" />}
      <g className="b-art__body">
        {boss.horns === 1 && horn(53, 1, 1.4)}
        {(boss.horns === 2 || boss.horns === 3) && (
          <>
            {horn(38, -1)}
            {horn(82, 1)}
          </>
        )}
        {boss.horns === 3 && horn(53, 1, 0.8)}
        {boss.mouth === 'beak' && (
          <>
            <path d="M26 44 L8 30 L30 56 Z" fill={ink} stroke="#111" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M94 44 L112 30 L90 56 Z" fill={ink} stroke="#111" strokeWidth="2.5" strokeLinejoin="round" />
          </>
        )}
        {boss.id === 'sumaho' && (
          <>
            <path d="M30 44 L22 12 L48 34 Z" fill={ink} stroke="#111" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M90 44 L98 12 L72 34 Z" fill={ink} stroke="#111" strokeWidth="2.5" strokeLinejoin="round" />
          </>
        )}
        <path d="M24 52 Q24 32 60 30 Q96 32 96 52 L94 82 Q88 104 60 108 Q32 104 26 82 Z" fill={ink} stroke="#111" strokeWidth="3" strokeLinejoin="round" />
        <path d="M34 50 Q36 38 60 36 Q72 37 80 41" fill="none" stroke="#fff" strokeOpacity="0.28" strokeWidth="4" strokeLinecap="round" />
        <text x="60" y="52" textAnchor="middle" fontSize="15" fontWeight="900" fill={glow} stroke="#111" strokeWidth="0.8" fontFamily="var(--f-label)">
          {unknown ? '?' : boss.kanji}
        </text>
        <path d="M32 60 L52 66" stroke="#111" strokeWidth="5" strokeLinecap="round" />
        <path d="M88 60 L68 66" stroke="#111" strokeWidth="5" strokeLinecap="round" />
        {down ? (
          <g stroke="#111" strokeWidth="4" strokeLinecap="round">
            <path d="M38 68 L48 78 M48 68 L38 78" />
            <path d="M72 68 L82 78 M82 68 L72 78" />
          </g>
        ) : (
          <g className="b-art__eyes">
            <path d="M36 70 Q43 64 51 71 Q43 77 36 70 Z" fill={glow} stroke="#111" strokeWidth="2" />
            <path d="M84 70 Q77 64 69 71 Q77 77 84 70 Z" fill={glow} stroke="#111" strokeWidth="2" />
            <circle cx="45" cy="71" r="2.2" fill="#111" />
            <circle cx="75" cy="71" r="2.2" fill="#111" />
          </g>
        )}
        {boss.mouth === 'fangs' && (
          <>
            <path d="M40 88 Q60 82 80 88 Q74 100 60 101 Q46 100 40 88 Z" fill="#111" />
            <path d="M44 88 L48 98 L52 87 Z M68 87 L72 98 L76 88 Z" fill="#fff" />
          </>
        )}
        {boss.mouth === 'grin' && (
          <>
            <path d="M34 84 Q60 108 86 84 Q60 94 34 84 Z" fill="#111" />
            <path d="M42 88 L46 93 L50 90 L54 95 L58 91 L62 95 L66 91 L70 95 L74 90 L78 93" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
          </>
        )}
        {boss.mouth === 'beak' && <path d="M48 82 L72 82 L60 102 Z" fill={glow} stroke="#111" strokeWidth="2.5" strokeLinejoin="round" />}
        {boss.mouth === 'flat' && <path d="M40 92 L46 88 L52 92 L58 88 L64 92 L70 88 L76 92 L80 90" fill="none" stroke="#111" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />}
      </g>
    </svg>
  );
}
