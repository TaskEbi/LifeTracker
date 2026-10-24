import { useId } from 'react';
import { STAGES } from '../../domain/progress/engine';

/**
 * The character: a drone that gains hardware, armour and colour as the overall level grows.
 * Twenty forms; each keeps the parts of the ones before (a few are replaced by a stronger
 * version, like the flame wings) and adds its own.
 */
export function Drone({ stage, still, happy, label = true }: { stage: number; still?: boolean; happy?: boolean; label?: boolean }) {
  const s = Math.max(0, Math.min(STAGES.length - 1, stage));
  const { c, c2 } = STAGES[s];
  const uid = useId().replace(/:/g, '');
  const body = `db-${uid}`;
  const wing = `dw-${uid}`;
  const glow = `dg-${uid}`;
  const flame = `df-${uid}`;
  const r = [30, 33, 35, 37, 38, 39, 39, 40, 40, 40, 41, 41, 41, 42, 42, 42, 43, 43, 43, 44][s];
  const spin = still ? undefined : 'i-spin';
  const slow = still ? undefined : 'i-spin i-spin--slow';
  const dark = s >= 17;
  const band = s >= 16 ? c2 : c;
  const top = 96 - r;
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
        <linearGradient id={flame} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={c} />
          <stop offset="1" stopColor={c2} />
        </linearGradient>
        <radialGradient id={glow}>
          <stop offset="0" stopColor={c2} stopOpacity=".55" />
          <stop offset="1" stopColor={c} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* aura grows with the forms */}
      <circle cx="100" cy="98" r={50 + s * 3} fill={`url(#${glow})`} opacity={0.35 + s * 0.03} />

      {s >= 19 && (
        <g className={slow}>
          <circle cx="100" cy="98" r="94" fill="none" stroke={c} strokeWidth="1.5" />
          <circle cx="100" cy="98" r="88" fill="none" stroke={c2} strokeWidth="1" strokeDasharray="1 5" />
          {Array.from({ length: 8 }, (_, i) => (
            <rect key={i} x="98" y="0" width="4" height="10" fill={c} transform={`rotate(${i * 45} 100 98)`} />
          ))}
        </g>
      )}
      {s >= 7 && (
        <g className={slow}>
          {Array.from({ length: 12 }, (_, i) => (
            <path key={i} d="M100 8 L106 34 L94 34 Z" fill={i % 2 ? c2 : c} opacity=".8" transform={`rotate(${i * 30} 100 98)`} />
          ))}
        </g>
      )}
      {s >= 4 && (
        <>
          <circle cx="100" cy="98" r="84" fill="none" stroke={c2} strokeWidth="2" strokeDasharray="3 7" className={slow} />
          {s < 16 && <path d="M100 12 l4 8 9 1 -7 6 2 9 -8 -5 -8 5 2 -9 -7 -6 9 -1z" fill={c2} stroke={c} strokeWidth="1" />}
        </>
      )}
      {s >= 13 &&
        [-1, 1].map((d) => (
          <path key={d} d={`M${100 + d * 78} 30 l${-d * 12} 22 h${d * 10} l${-d * 14} 26 l${d * 26} -32 h${-d * 10} l${d * 10} -16z`} fill={c2} stroke="var(--fg)" strokeWidth="1.5" strokeLinejoin="round" />
        ))}
      {s >= 12 &&
        [-1, 0, 1].map((d) => (
          <path
            key={d}
            d={`M100 130 C ${100 + d * 30} 160, ${100 + d * 70} 150, ${100 + d * 76} ${d === 0 ? 190 : 176} C ${100 + d * 50} 178, ${100 + d * 26} 168, ${100 + d * 6} 136 Z`}
            fill={c}
            stroke="var(--fg)"
            strokeWidth="1.5"
          />
        ))}
      <ellipse cx="100" cy="186" rx={30 + s * 2} ry="5" fill="var(--fg)" opacity=".12" />

      <g className={still ? undefined : 'i-hover'}>
        {s >= 8 &&
          [-1, 1].map((d) => (
            <g key={d} transform={`rotate(${d * 38} 100 96)`}>
              <rect x="97" y="6" width="6" height="150" rx="2" fill={c2} stroke="var(--fg)" strokeWidth="1.5" />
              <rect x="91" y="150" width="18" height="5" fill="var(--fg)" />
              <rect x="97.5" y="155" width="5" height="26" fill={c} stroke="var(--fg)" strokeWidth="1" />
            </g>
          ))}
        {s >= 15
          ? [-1, 1].map((d) => (
              <path
                key={d}
                d={`M${100 + d * 28} 104 C ${100 + d * 50} 70, ${100 + d * 70} 40, ${100 + d * 96} 30 C ${100 + d * 84} 52, ${100 + d * 98} 60, ${100 + d * 92} 78 C ${100 + d * 80} 76, ${100 + d * 96} 96, ${100 + d * 86} 112 C ${100 + d * 72} 106, ${100 + d * 74} 122, ${100 + d * 60} 128 C ${100 + d * 52} 118, ${100 + d * 40} 120, ${100 + d * 30} 118 Z`}
                fill={`url(#${flame})`}
                stroke="var(--fg)"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            ))
          : s >= 9 &&
            [-1, 1].map((d) => (
              <path
                key={d}
                d={`M${100 + d * 30} 100 C ${100 + d * 70} 60, ${100 + d * 96} 70, ${100 + d * 92} 120 C ${100 + d * 80} 108, ${100 + d * 62} 112, ${100 + d * 34} 118 Z`}
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
            <path d={`M100 ${top + 2} L100 32`} stroke="var(--fg)" strokeWidth="3" />
            {s < 16 && <circle cx="100" cy="28" r="5.5" fill={c2} stroke={c} strokeWidth="2" className={still ? undefined : 'i-pulse'} />}
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
        {s >= 18 && (
          <>
            <ellipse cx="100" cy="98" rx="74" ry="11" fill="none" stroke={c2} strokeWidth="2" opacity=".8" transform="rotate(-18 100 98)" />
            <ellipse cx="100" cy="98" rx="80" ry="14" fill="none" stroke={c} strokeWidth="1.5" strokeDasharray="2 5" transform="rotate(14 100 98)" className={slow} />
          </>
        )}
        {s >= 17 && <circle cx="100" cy="96" r={r + 6} fill="none" stroke={c2} strokeWidth="6" opacity=".55" />}

        {/* body */}
        {s >= 5 && (
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
        )}
        <circle cx="100" cy="96" r={r} fill={`url(#${body})`} stroke={dark ? c2 : 'var(--fg)'} strokeWidth={s >= 11 ? 4.5 : 3.5} />
        <path d={`M${100 - r * 0.7} ${96 - r * 0.45} A${r} ${r} 0 0 1 ${100 + r * 0.7} ${96 - r * 0.45}`} fill="none" stroke={dark ? c2 : '#fff'} strokeWidth="2.5" opacity=".6" />
        {s >= 6 && (
          <>
            <path d={`M${100 - r * 0.97} ${96 - r * 0.28} Q100 ${96 - r * 0.62} ${100 + r * 0.97} ${96 - r * 0.28}`} fill="none" stroke={band} strokeWidth="7" strokeLinecap="round" />
            <path d={`M${100 + r * 0.9} ${96 - r * 0.36} c14 -6 22 4 34 -2 c-8 8 -20 4 -30 10z M${100 + r * 0.9} ${96 - r * 0.3} c12 4 18 14 30 14 c-10 4 -22 -2 -30 -8z`} fill={band} stroke="var(--fg)" strokeWidth="1" />
          </>
        )}
        {s >= 10 &&
          [-1, 1].map((d) => (
            <path
              key={d}
              d={`M${100 + d * r * 0.5} ${96 - r * 0.82} q${d * -2} -18 ${d * 14} -30 q${d * -6} 16 ${d * 2} 28 z`}
              fill={c2}
              stroke="var(--fg)"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          ))}
        {s >= 11 &&
          (s >= 16 ? (
            <path d={`M70 ${top - 2} C 74 ${top - 30}, 86 ${top - 36}, 100 ${top - 18} C 114 ${top - 36}, 126 ${top - 30}, 130 ${top - 2} C 122 ${top - 18}, 110 ${top - 18}, 100 ${top - 6} C 90 ${top - 18}, 78 ${top - 18}, 70 ${top - 2} Z`} fill={c2} stroke="var(--fg)" strokeWidth="1.5" />
          ) : (
            <>
              <path d={`M${100 - r * 0.95} ${96 - r * 0.2} Q100 ${96 - r * 1.35} ${100 + r * 0.95} ${96 - r * 0.2}`} fill="none" stroke={c2} strokeWidth="5" strokeLinecap="round" />
              <path d="M86 52 l4 -12 6 9 4 -12 4 12 6 -9 4 12 z" fill={c2} stroke="var(--fg)" strokeWidth="1.5" strokeLinejoin="round" transform={`translate(0 ${62 - r - 6})`} />
            </>
          ))}
        <rect x={100 - r * 0.62} y="86" width={r * 1.24} height="20" rx="10" fill={dark ? '#000' : 'var(--fg)'} stroke={dark ? c2 : 'none'} strokeWidth="1.5" />
        <g className={still ? undefined : 'i-blink'}>
          <rect x={happy ? 84 : 86} y={happy ? 92 : 91} width={happy ? 32 : 28} height={happy ? 6 : 10} rx={happy ? 3 : 5} fill={c} />
          <rect x={happy ? 84 : 86} y={happy ? 92 : 91} width={happy ? 32 : 28} height={happy ? 3 : 4} rx="2" fill={c2} opacity=".7" />
        </g>
        {s >= 19 && <path d="M100 70 l6 7 -6 7 -6 -7z" fill={c2} stroke={c} strokeWidth="1.5" />}
        {s >= 14 && (
          <>
            <path d="M28 132 C 46 178, 154 178, 172 132 C 182 112, 166 98, 152 108" fill="none" stroke="var(--fg)" strokeWidth="12" strokeLinecap="round" />
            <path d="M28 132 C 46 178, 154 178, 172 132 C 182 112, 166 98, 152 108" fill="none" stroke={c} strokeWidth="8" strokeLinecap="round" />
            <path d="M28 132 C 46 178, 154 178, 172 132 C 182 112, 166 98, 152 108" fill="none" stroke={c2} strokeWidth="2.5" strokeDasharray="3 7" />
            <path d="M152 108 l-4 -12 M156 106 l2 -12" stroke="var(--fg)" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="150" cy="106" r="7" fill={c} stroke="var(--fg)" strokeWidth="2" />
            <circle cx="148" cy="104" r="1.8" fill={c2} />
          </>
        )}
        {s >= 18 && (
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
