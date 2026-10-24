import { useId } from 'react';
import { STAGES } from '../../domain/progress/engine';

/**
 * The character: a geometric drone that gains hardware and colour as the overall level grows.
 * Ten forms; each keeps everything from the ones before and adds a part.
 */
export function Drone({ stage, still, happy, label = true }: { stage: number; still?: boolean; happy?: boolean; label?: boolean }) {
  const s = Math.max(0, Math.min(STAGES.length - 1, stage));
  const { c, c2 } = STAGES[s];
  const uid = useId().replace(/:/g, '');
  const body = `db-${uid}`;
  const wing = `dw-${uid}`;
  const glow = `dg-${uid}`;
  const r = [30, 33, 35, 37, 38, 39, 40, 40, 41, 42][s];
  const spin = still ? undefined : 'i-spin';
  const slow = still ? undefined : 'i-spin i-spin--slow';
  const dark = s >= 9;
  return (
    <svg viewBox="0 0 200 200" role={label ? 'img' : undefined} aria-label={label ? `${STAGES[s].name} drone, your character` : undefined} aria-hidden={label ? undefined : true}>
      <defs>
        <radialGradient id={body} cx="38%" cy="30%" r="80%">
          <stop offset="0" stopColor={dark ? '#2a1f4d' : 'var(--surf)'} />
          <stop offset="0.65" stopColor={dark ? '#0d0a1f' : `color-mix(in srgb, ${c} 16%, var(--surf))`} />
          <stop offset="1" stopColor={dark ? '#000' : `color-mix(in srgb, ${c} 34%, var(--surf))`} />
        </radialGradient>
        <linearGradient id={wing} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c} stopOpacity=".9" />
          <stop offset="1" stopColor={c2} stopOpacity=".55" />
        </linearGradient>
        <radialGradient id={glow}>
          <stop offset="0" stopColor={c2} stopOpacity=".55" />
          <stop offset="1" stopColor={c} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* aura grows with the forms */}
      <circle cx="100" cy="98" r={50 + s * 5} fill={`url(#${glow})`} opacity={0.35 + s * 0.05} />

      {s >= 6 && (
        <g className={slow}>
          {Array.from({ length: 12 }, (_, i) => (
            <path key={i} d="M100 8 L106 34 L94 34 Z" fill={i % 2 ? c2 : c} opacity=".8" transform={`rotate(${i * 30} 100 98)`} />
          ))}
        </g>
      )}
      {s >= 4 && (
        <>
          <circle cx="100" cy="98" r="84" fill="none" stroke={c2} strokeWidth="2" strokeDasharray="3 7" className={slow} />
          <path d="M100 12 l4 8 9 1 -7 6 2 9 -8 -5 -8 5 2 -9 -7 -6 9 -1z" fill={c2} stroke={c} strokeWidth="1" />
        </>
      )}
      <ellipse cx="100" cy="184" rx={30 + s * 3} ry="5" fill="var(--fg)" opacity=".12" />

      <g className={still ? undefined : 'i-hover'}>
        {s >= 7 &&
          [-1, 1].map((dir) => (
            <path
              key={dir}
              d={`M${100 + dir * 30} 100 C ${100 + dir * 70} 60, ${100 + dir * 96} 70, ${100 + dir * 92} 120 C ${100 + dir * 80} 108, ${100 + dir * 62} 112, ${100 + dir * 34} 118 Z`}
              fill={`url(#${wing})`}
              stroke={c}
              strokeWidth="1.5"
            />
          ))}
        {s >= 2 &&
          [
            [-1, 34],
            [1, 166],
          ].map(([dir, x]) => (
            <g key={x}>
              <path d={`M${100 + dir * 34} 96 L${x} 78`} stroke="var(--fg)" strokeWidth="4" strokeLinecap="round" />
              <g transform={`translate(${x} 74)`}>
                <ellipse rx="22" ry="4" fill={c2} opacity=".6" className={spin} />
                <circle r="5" fill={c} stroke="var(--fg)" strokeWidth="1.5" />
              </g>
            </g>
          ))}
        {s >= 3 && (
          <>
            <path d="M100 58 L100 32" stroke="var(--fg)" strokeWidth="3" />
            <circle cx="100" cy="28" r="5.5" fill={c2} stroke={c} strokeWidth="2" className={still ? undefined : 'i-pulse'} />
            <rect x="56" y="120" width="18" height="30" rx="3" fill="var(--surf-2)" stroke="var(--fg)" strokeWidth="2.5" />
            <rect x="126" y="120" width="18" height="30" rx="3" fill="var(--surf-2)" stroke="var(--fg)" strokeWidth="2.5" />
            <path d="M59 128 h12 M59 136 h12 M59 144 h12 M129 128 h12 M129 136 h12 M129 144 h12" stroke={c} strokeWidth="2.2" />
          </>
        )}
        {s >= 1 && (
          <>
            <ellipse cx="100" cy="104" rx="64" ry="16" fill="none" stroke="var(--fg)" strokeWidth="3" />
            <ellipse cx="100" cy="104" rx="64" ry="16" fill="none" stroke={c} strokeWidth="3.5" strokeDasharray="18 180" className={spin} />
          </>
        )}
        {s >= 9 && (
          <>
            <ellipse cx="100" cy="98" rx="74" ry="11" fill="none" stroke={c2} strokeWidth="2" opacity=".8" transform="rotate(-18 100 98)" />
            <ellipse cx="100" cy="98" rx="80" ry="14" fill="none" stroke={c} strokeWidth="1.5" strokeDasharray="2 5" transform="rotate(14 100 98)" className={slow} />
          </>
        )}

        {/* body */}
        {s >= 5 ? (
          <polygon
            points={Array.from({ length: 6 }, (_, i) => {
              const a = (Math.PI / 3) * i - Math.PI / 2;
              return `${100 + (r + 7) * Math.cos(a)},${96 + (r + 7) * Math.sin(a)}`;
            }).join(' ')}
            fill={`color-mix(in srgb, ${c2} 22%, transparent)`}
            stroke={c}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        ) : null}
        <circle cx="100" cy="96" r={r} fill={`url(#${body})`} stroke={dark ? c : 'var(--fg)'} strokeWidth={s >= 8 ? 4.5 : 3.5} />
        <path d={`M${100 - r * 0.7} ${96 - r * 0.45} A${r} ${r} 0 0 1 ${100 + r * 0.7} ${96 - r * 0.45}`} fill="none" stroke={dark ? c2 : '#fff'} strokeWidth="2.5" opacity=".6" />
        {s >= 8 && (
          <>
            <path d={`M${100 - r * 0.95} ${96 - r * 0.2} Q100 ${96 - r * 1.35} ${100 + r * 0.95} ${96 - r * 0.2}`} fill="none" stroke={c2} strokeWidth="5" strokeLinecap="round" />
            <path d="M86 52 l4 -12 6 9 4 -12 4 12 6 -9 4 12 z" fill={c2} stroke="var(--fg)" strokeWidth="1.5" strokeLinejoin="round" transform={`translate(0 ${62 - r - 6})`} />
          </>
        )}
        <rect x={100 - r * 0.62} y="86" width={r * 1.24} height="20" rx="10" fill={dark ? '#000' : 'var(--fg)'} stroke={dark ? c2 : 'none'} strokeWidth="1.5" />
        <g className={still ? undefined : 'i-blink'}>
          <rect x={happy ? 84 : 86} y={happy ? 92 : 91} width={happy ? 32 : 28} height={happy ? 6 : 10} rx={happy ? 3 : 5} fill={c} />
          <rect x={happy ? 84 : 86} y={happy ? 92 : 91} width={happy ? 32 : 28} height={happy ? 3 : 4} rx="2" fill={c2} opacity=".7" />
        </g>
        {s >= 9 && (
          <g className={slow}>
            {[0, 1, 2, 3].map((i) => (
              <circle key={i} cx={100 + 80 * Math.cos((i * Math.PI) / 2)} cy={98 + 80 * Math.sin((i * Math.PI) / 2)} r="3.5" fill={i % 2 ? c : c2} />
            ))}
          </g>
        )}
      </g>
    </svg>
  );
}
