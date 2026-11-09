import type { ReactNode } from 'react';
import type { BossDef, Tier } from '../../domain/progress/boss';

const K = '#111';
const line = { stroke: K, strokeWidth: 2.5, strokeLinejoin: 'round' as const };

const FACES = {
  mask: 'M24 52 Q24 32 60 30 Q96 32 96 52 L94 82 Q88 104 60 108 Q32 104 26 82 Z',
  round: 'M60 28 C86 28 100 46 100 68 C100 92 82 108 60 108 C38 108 20 92 20 68 C20 46 34 28 60 28 Z',
  skull: 'M26 58 Q26 28 60 28 Q94 28 94 58 Q94 76 84 82 L82 98 Q70 106 60 106 Q50 106 38 98 L36 82 Q26 76 26 58 Z',
  long: 'M34 46 Q36 24 60 22 Q84 24 86 46 L88 84 Q82 112 60 114 Q38 112 32 84 Z',
  square: 'M22 40 Q22 30 32 30 L88 30 Q98 30 98 40 L98 90 Q98 104 84 106 L36 106 Q22 104 22 90 Z',
};

/** Points round a centre, for the mane and the flames. */
function ring<T>(n: number, from: number, to: number, f: (a: number, i: number) => T): T[] {
  return Array.from({ length: n }, (_, i) => f(((from + ((to - from) * i) / Math.max(1, n - 1)) * Math.PI) / 180, i));
}
const pt = (a: number, r: number, cx = 60, cy = 66) => `${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`;

/**
 * A boss as a drawn yōkai mask: a face shape, horns, eyes, mouth and extras (ears, wings, mane,
 * tentacles…). Rank shows too: Warlords wear a spiked ring, Overlords a crown and flames. A cracked
 * mask (second phase) gets red eyes and a split; an enraged one shakes.
 */
export function BossArt({ boss, down, unknown, tier, cracked, enraged }: { boss: BossDef; down?: boolean; unknown?: boolean; tier?: Tier; cracked?: boolean; enraged?: boolean }) {
  const ink = unknown ? 'var(--fg-3)' : boss.c;
  const glow = unknown ? 'var(--surf-3)' : boss.c2;
  const eye = cracked && !unknown ? '#ff3030' : glow;
  const t = unknown ? 1 : (tier ?? boss.tier);
  const face = boss.face ?? 'mask';
  const eyes = boss.eyes ?? 'two';
  const ex = new Set(unknown ? [] : (boss.extra ?? []));
  const top = face === 'long' ? 22 : 30;

  const horn = (x: number, flip: 1 | -1, tall = 1) => (
    <path d={`M${x} 40 Q${x + flip * 4} ${26 - 10 * tall} ${x + flip * 14} ${14 - 8 * tall} Q${x + flip * 12} ${30 - 4 * tall} ${x + flip * 16} 42 Z`} fill={glow} {...line} />
  );
  const mirror = (node: ReactNode, key: string) => (
    <g key={key}>
      {node}
      <g transform="translate(120 0) scale(-1 1)">{node}</g>
    </g>
  );

  const behind: ReactNode[] = [];
  if (!unknown && t === 3)
    behind.push(
      <g key="flames" className="b-art__flames">
        {ring(9, 195, 345, (a, i) => (
          <path key={i} d={`M${pt(a - 0.16, 44)} Q${pt(a - 0.05, 62)} ${pt(a, i % 2 ? 66 : 74)} Q${pt(a + 0.05, 62)} ${pt(a + 0.16, 44)} Z`} fill={i % 2 ? '#fbbf24' : '#f97316'} opacity="0.9" />
        ))}
      </g>,
    );
  if (!unknown && t === 2) behind.push(<circle key="ring" cx="60" cy="66" r="55" fill="none" stroke={glow} strokeWidth="3" strokeDasharray="4 7" className="b-art__ring" />);
  if (ex.has('mane'))
    behind.push(
      <polygon key="mane" points={ring(18, 0, 340, (a, i) => `${pt(a, i % 2 ? 44 : 56)}`).join(' ')} fill={glow} {...line} />,
    );
  if (ex.has('wings')) behind.push(mirror(<path d="M26 62 L2 32 L10 50 L0 60 L12 64 L4 80 L26 78 Z" fill={ink} {...line} />, 'wings'));
  if (ex.has('ears') || boss.id === 'sumaho') behind.push(mirror(<path d="M30 44 L22 12 L48 34 Z" fill={ink} {...line} />, 'ears'));
  if (ex.has('claws')) behind.push(mirror(<path d="M24 88 Q2 84 6 62 L16 70 L10 74 Q12 84 26 82 Z" fill={glow} {...line} />, 'claws'));
  if (ex.has('tentacles'))
    behind.push(
      <g key="tent" fill="none" stroke={ink} strokeWidth="7" strokeLinecap="round">
        <path d="M38 98 Q28 110 36 118" />
        <path d="M52 104 Q48 116 56 120" />
        <path d="M68 104 Q72 116 64 120" />
        <path d="M82 98 Q92 110 84 118" />
      </g>,
    );

  return (
    <svg viewBox="0 0 120 120" className={`b-art${down ? ' is-down' : ''}${unknown ? ' is-unknown' : ''}${enraged && !down ? ' is-enraged' : ''}`} aria-hidden="true">
      {!unknown && <circle cx="60" cy="64" r="54" fill={boss.c2} opacity="0.22" className="b-art__aura" />}
      {behind}
      <g className="b-art__body">
        {boss.horns === 1 && horn(53, 1, 1.4)}
        {(boss.horns === 2 || boss.horns === 3) && (
          <>
            {horn(38, -1)}
            {horn(82, 1)}
          </>
        )}
        {boss.horns === 3 && horn(53, 1, 0.8)}
        {ex.has('antlers') &&
          mirror(
            <path d="M40 34 L28 10 M33 22 L18 18 M30 16 L36 4" stroke={glow} strokeWidth="5" strokeLinecap="round" fill="none" />,
            'antlers',
          )}
        {boss.mouth === 'beak' && mirror(<path d="M26 44 L8 30 L30 56 Z" fill={ink} {...line} />, 'beakwings')}
        <path d={FACES[face]} fill={ink} stroke={K} strokeWidth="3" strokeLinejoin="round" />
        <path d={`M34 ${top + 20} Q36 ${top + 8} 60 ${top + 6} Q72 ${top + 7} 80 ${top + 11}`} fill="none" stroke="#fff" strokeOpacity="0.28" strokeWidth="4" strokeLinecap="round" />
        {ex.has('scales') && (
          <g fill="none" stroke={K} strokeOpacity="0.35" strokeWidth="1.5">
            {[30, 38, 82, 90].map((x) => [84, 92].map((y) => <path key={`${x}${y}`} d={`M${x - 4} ${y} Q${x} ${y + 5} ${x + 4} ${y}`} />))}
          </g>
        )}
        {ex.has('halo') && <ellipse cx="60" cy={top - 12} rx="22" ry="5" fill="none" stroke={glow} strokeWidth="3" className="b-art__halo" />}
        <text x="60" y={eyes === 'three' ? top + 18 : top + 22} textAnchor="middle" fontSize="15" fontWeight="900" fill={glow} stroke={K} strokeWidth="0.8" fontFamily="var(--f-label)">
          {unknown ? '?' : boss.kanji}
        </text>
        {eyes !== 'many' && !down && (
          <>
            <path d="M32 60 L52 66" stroke={K} strokeWidth="5" strokeLinecap="round" />
            <path d="M88 60 L68 66" stroke={K} strokeWidth="5" strokeLinecap="round" />
          </>
        )}
        {down ? (
          <g stroke={K} strokeWidth="4" strokeLinecap="round">
            <path d="M38 68 L48 78 M48 68 L38 78" />
            <path d="M72 68 L82 78 M82 68 L72 78" />
          </g>
        ) : (
          <g className="b-art__eyes">
            {(eyes === 'two' || eyes === 'three') && (
              <>
                <path d="M36 70 Q43 64 51 71 Q43 77 36 70 Z" fill={eye} stroke={K} strokeWidth="2" />
                <path d="M84 70 Q77 64 69 71 Q77 77 84 70 Z" fill={eye} stroke={K} strokeWidth="2" />
                <circle cx="45" cy="71" r="2.2" fill={K} />
                <circle cx="75" cy="71" r="2.2" fill={K} />
              </>
            )}
            {eyes === 'three' && (
              <>
                <ellipse cx="60" cy="63" rx="4" ry="7" fill={eye} stroke={K} strokeWidth="2" />
                <ellipse cx="60" cy="63" rx="1" ry="4" fill={K} />
              </>
            )}
            {eyes === 'one' && (
              <>
                <circle cx="60" cy="72" r="12" fill={eye} stroke={K} strokeWidth="2.5" />
                <ellipse cx="60" cy="72" rx="2.5" ry="9" fill={K} />
              </>
            )}
            {eyes === 'slits' && (
              <g stroke={eye} strokeWidth="4" strokeLinecap="round">
                <path d="M36 70 L52 72" />
                <path d="M84 70 L68 72" />
              </g>
            )}
            {eyes === 'many' &&
              [
                [40, 66],
                [50, 73],
                [37, 78],
                [80, 66],
                [70, 73],
                [83, 78],
              ].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="3.6" fill={eye} stroke={K} strokeWidth="1.5" />)}
          </g>
        )}
        {ex.has('blindfold') && (
          <>
            <path d="M24 63 L96 63 L97 76 L23 76 Z" fill={glow} {...line} />
            {!down && <path d="M38 70 L50 70 M70 70 L82 70" stroke={cracked ? '#ff3030' : K} strokeWidth="2.5" strokeLinecap="round" />}
          </>
        )}
        {ex.has('nose') && <path d="M57 70 Q63 68 66 74 L94 90 Q92 94 87 93 L58 80 Z" fill={ink} {...line} />}
        {ex.has('gems') && mirror(<path d="M34 80 L38 86 L34 92 L30 86 Z" fill={glow} stroke={K} strokeWidth="1.5" />, 'gems')}
        {boss.mouth === 'fangs' && (
          <>
            <path d="M40 88 Q60 82 80 88 Q74 100 60 101 Q46 100 40 88 Z" fill={K} />
            <path d="M44 88 L48 98 L52 87 Z M68 87 L72 98 L76 88 Z" fill="#fff" />
          </>
        )}
        {boss.mouth === 'grin' && (
          <>
            <path d="M34 84 Q60 108 86 84 Q60 94 34 84 Z" fill={K} />
            <path d="M42 88 L46 93 L50 90 L54 95 L58 91 L62 95 L66 91 L70 95 L74 90 L78 93" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
          </>
        )}
        {boss.mouth === 'beak' && <path d="M48 82 L72 82 L60 102 Z" fill={glow} {...line} />}
        {boss.mouth === 'flat' && <path d="M40 92 L46 88 L52 92 L58 88 L64 92 L70 88 L76 92 L80 90" fill="none" stroke={K} strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />}
        {boss.mouth === 'tusks' && (
          <>
            <path d="M38 86 Q60 96 82 86 Q76 100 60 101 Q44 100 38 86 Z" fill={K} />
            {mirror(<path d="M40 94 Q34 80 42 72 Q44 84 47 93 Z" fill="#fff8e1" stroke={K} strokeWidth="1.8" />, 'tusk')}
          </>
        )}
        {boss.mouth === 'stitched' && (
          <g stroke={K} strokeWidth="3" strokeLinecap="round">
            <path d="M38 92 Q60 96 82 92" fill="none" />
            {[44, 52, 60, 68, 76].map((x) => (
              <path key={x} d={`M${x} 88 L${x} 98`} />
            ))}
          </g>
        )}
        {boss.mouth === 'void' && (
          <>
            <ellipse cx="60" cy="93" rx="13" ry="10" fill={K} />
            <ellipse cx="60" cy="93" rx="7" ry="5" fill="none" stroke={eye} strokeWidth="1.5" opacity="0.8" />
          </>
        )}
        {ex.has('tongue') && <path d="M54 95 Q60 116 66 95 Z" fill="#f43f5e" stroke={K} strokeWidth="1.8" />}
        {ex.has('beard') && <path d="M40 102 Q60 124 80 102 Q70 110 60 111 Q50 110 40 102 Z" fill={glow} {...line} />}
        {!unknown && t === 3 && <path d={`M38 ${top + 2} L41 ${top - 18} L51 ${top - 7} L60 ${top - 23} L69 ${top - 7} L79 ${top - 18} L82 ${top + 2} Z`} fill="#fbbf24" {...line} className="b-art__crown" />}
        {cracked && !down && !unknown && <path d="M46 34 L52 46 L46 54 L54 62 M74 96 L68 88 L74 82" fill="none" stroke={K} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />}
      </g>
    </svg>
  );
}
