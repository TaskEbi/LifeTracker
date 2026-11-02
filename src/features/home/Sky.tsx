/**
 * Home's sky, inside the hero panel: the colour of the hour and the weather of the season (snow,
 * sakura, plum rains, fireflies, autumn leaves; fireworks at New Year, stars at Tanabata, bats at
 * Halloween). CSS transforms only, a small number of parts, still under reduced motion. Settings →
 * Celebrations can turn it off.
 */
import { memo, useMemo } from 'react';
import { seasonOf, type SkyKind, type TimeOfDay } from '../../domain/fun/season';
import { useFxPrefs } from '../../ui/i/fx/celebrate';
import './sky.css';

const COUNT: Record<SkyKind, number> = { snow: 16, sakura: 14, leaf: 10, rain: 18, firefly: 10, maple: 12, firework: 5, star: 16, bat: 6 };

function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  let s = h >>> 0;
  return () => {
    s = (Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9) >>> 0;
    return s / 4294967296;
  };
}

export const Sky = memo(function Sky({ date, tod }: { date: string; tod: TimeOfDay }) {
  const on = useFxPrefs().sky;
  const season = seasonOf(date);
  const parts = useMemo(() => {
    const r = rng(`${date}:${season.kind}`);
    return Array.from({ length: COUNT[season.kind] }, (_, i) => ({
      left: `${(i + r()) * (100 / COUNT[season.kind])}%`,
      top: `${Math.round(r() * 62)}%`,
      '--d': `${(-r() * 9).toFixed(2)}s`,
      '--t': `${(5 + r() * 6).toFixed(2)}s`,
      '--s': (0.6 + r() * 0.8).toFixed(2),
      '--x': `${Math.round((r() - 0.5) * 70)}px`,
      '--r': `${Math.round(180 + r() * 360)}deg`,
      '--h': Math.round(r() * 3),
    }));
  }, [date, season.kind]);
  if (!on) return null;
  return (
    <>
      <span className={`h-sky h-sky--${tod}`} aria-hidden="true" />
      <span className={`h-wx h-wx--${season.kind}`} aria-hidden="true">
        {parts.map((style, i) => (
          <i key={i} data-h={style['--h']} style={style as React.CSSProperties} />
        ))}
      </span>
    </>
  );
});
