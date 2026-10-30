/**
 * The bucket list: a wooden wish plaque (ema) with the thing written on it flies in out of the
 * night, a red brush tick crosses it off, and at the impact it bursts into fireworks while sky
 * lanterns rise and 叶 (a wish come true) lands. Colours come from `--tc`, so a rarity can retint it.
 */
import { useMemo } from 'react';
import { Burst, Caption, Embers, Extruded, Flap, range, rng, seedOf, Twinkles, type Css } from '../kit';
import type { MomentFx, MomentFxMap } from './types';
import './bucket.css';

const GOLD = '#ffc94d';

/** Lanterns drifting up from below the screen, each on its own path and sway. */
function Lanterns({ n, seed }: { n: number; seed: number }) {
  const parts = useMemo(() => {
    const r = rng(seed);
    return range(n).map(
      (i) =>
        ({
          left: `${6 + ((i + r() * 0.8) / n) * 88}%`,
          '--s': (0.55 + r() * 0.75).toFixed(2),
          '--rise': `${Math.round(70 + r() * 45)}vh`,
          '--sway': `${Math.round((r() - 0.5) * 60)}px`,
          '--z': `${Math.round(-300 + r() * 360)}px`,
          '--d': `${Math.round(1050 + r() * 900)}ms`,
          '--p': `${Math.round(2100 + r() * 900)}ms`,
        }) as Css,
    );
  }, [n, seed]);
  return (
    <div className="fx-bk__lans">
      {parts.map((p, i) => (
        <i key={i} className="fx-bk__lan" style={p} />
      ))}
    </div>
  );
}

/** A firework: sparks at a point on screen, a little after the impact. */
function Firework({ x, y, seed, after, colors }: { x: string; y: string; seed: number; after: number; colors: string[] }) {
  return (
    <div className="fx-bk__fw" style={{ left: x, top: y }}>
      <i className="fx-bk__fwring" style={{ '--d': `${after}ms` } as Css} />
      <Burst n={14} seed={seed} spread={[60, 130]} colors={colors} delay={`calc(var(--hit) + ${after}ms)`} />
    </div>
  );
}

const bucket: MomentFx<'bucket'> = {
  tell: (m) => ({ kicker: 'Bucket list', title: m.title, line: `Crossed off · ${m.done} of ${m.total} done`, color: GOLD }),
  time: () => ({ dur: 3000, hit: 1150 }),
  calm: () => <span className="fx-calm__k">叶</span>,
  Scene: ({ m }) => {
    const seed = seedOf(m.title);
    const long = m.title.length > 60 ? ' fx-bk__words--xs' : m.title.length > 28 ? ' fx-bk__words--sm' : '';
    return (
      <div className="fx-scene fx-bk" style={{ '--tc': GOLD } as Css}>
        <i className="fx-bg fx-bk__bg" />
        <Twinkles n={22} seed={seed} top={55} />
        <i className="fx-bk__rays" />
        <i className="fx-glow" />
        <Lanterns n={11} seed={seed + 1} />
        <Firework x="20%" y="18%" seed={seed + 2} after={260} colors={['#ffc94d', '#fff3c4', '#ff8a5c']} />
        <Firework x="80%" y="24%" seed={seed + 3} after={520} colors={['#9ad8ff', '#ffffff', '#ffc94d']} />
        <Firework x="64%" y="8%" seed={seed + 4} after={820} colors={['#ff9ec7', '#ffe08a', '#ffffff']} />
        <div className="fx-at fx-bk__at">
          <div className="fx-bk__lift">
            <div className="fx-bk__ema">
              <i className="fx-bk__rope" />
              <div className="fx-bk__board">
                <span className="fx-bk__head">夢</span>
                <span className={`fx-bk__words${long}`}>{m.title}</span>
                <span className="fx-bk__box">
                  <i className="fx-bk__tick fx-bk__tick--a" />
                  <i className="fx-bk__tick fx-bk__tick--b" />
                </span>
              </div>
            </div>
          </div>
          <i className="fx-shock" />
          <i className="fx-shock fx-shock--late" />
        </div>
        <Burst n={20} seed={seed + 5} colors={[GOLD, '#fff3c4', '#ff8a5c', '#ffffff']} />
        <Embers n={18} seed={seed + 6} colors={[GOLD, '#fff3c4', '#ff8a5c']} spread={260} rise={480} delay={1150} />
        <div className="fx-bk__kanji">
          <Extruded text="叶" depth={6} step={5} back="#b3261e" />
        </div>
        <div className="fx-bk__count">
          <Flap from={Math.max(0, m.done - 1)} to={m.done} delay={1500} />
          <span>of {m.total} done</span>
        </div>
        <Caption chip="bucket list · 叶" title={m.title} line="Crossed off. A wish come true." />
        <i className="fx-flash" />
      </div>
    );
  },
};

export const BUCKET_FX: Pick<MomentFxMap, 'bucket'> = { bucket };
