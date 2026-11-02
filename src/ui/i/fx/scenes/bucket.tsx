/**
 * The bucket list: a wooden wish plaque (ema) with the thing written on it flies in out of the
 * night, a red brush tick crosses it off, and at the impact it bursts into fireworks while sky
 * lanterns rise and 叶 (a wish come true) lands. Colours come from `--tc`, so a rarity can retint it.
 */
import { useMemo } from 'react';
import { Burst, Caption, Embers, Extruded, Flap, range, rng, seedOf, Twinkles, type Css } from '../kit';
import { rarityInfo, type RarityId } from '../../../../domain/bucket/rarity';
import type { MomentFx, MomentFxMap } from './types';
import './bucket.css';

const CHIP: Record<RarityId, string> = { common: '叶', rare: '稀 · 叶', epic: '極 · 叶', legendary: '伝説 · 叶' };
/** How much sky a wish gets. */
const SIZE: Record<RarityId, { lanterns: number; fireworks: number; embers: number; dur: number }> = {
  common: { lanterns: 4, fireworks: 1, embers: 8, dur: 2500 },
  rare: { lanterns: 8, fireworks: 2, embers: 14, dur: 2900 },
  epic: { lanterns: 11, fireworks: 3, embers: 20, dur: 3200 },
  legendary: { lanterns: 14, fireworks: 3, embers: 28, dur: 3900 },
};

/** A golden dragon flying across the sky behind a legendary wish. */
function Dragon() {
  return (
    <svg className="fx-bk__dragon" viewBox="0 0 520 170" aria-hidden="true">
      <path d="M8 96C50 40 92 40 128 86S206 134 246 88S326 36 366 84S440 124 482 74" fill="none" stroke="#7a4a00" strokeWidth="26" strokeLinecap="round" />
      <path d="M8 96C50 40 92 40 128 86S206 134 246 88S326 36 366 84S440 124 482 74" fill="none" stroke="#ffc94d" strokeWidth="19" strokeLinecap="round" />
      <path d="M8 96C50 40 92 40 128 86S206 134 246 88S326 36 366 84S440 124 482 74" fill="none" stroke="#fff3c4" strokeWidth="4" strokeDasharray="4 13" strokeLinecap="round" />
      <path d="M92 52L84 28L108 46M172 110L170 138L192 116M284 62L280 34L304 54M404 104L404 132L426 108" fill="#ff8a4c" stroke="#7a4a00" strokeWidth="2" strokeLinejoin="round" />
      <g transform="translate(478 72)">
        <path d="M-10 -20C14 -28 36 -14 40 2C42 12 30 22 16 18L28 34L4 24C-10 22 -18 8 -16 -6Z" fill="#ffc94d" stroke="#7a4a00" strokeWidth="3" strokeLinejoin="round" />
        <path d="M-4 -22L-14 -46L8 -26M12 -24L12 -48L24 -22" fill="#ff8a4c" stroke="#7a4a00" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="16" cy="-6" r="4" fill="#b3261e" />
        <path d="M38 8C50 10 56 2 66 8M30 20C44 26 52 20 60 28" stroke="#fff3c4" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}

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
  tell: (m) => ({ kicker: `${rarityInfo(m.rarity).name} wish`, title: m.title, line: `Crossed off · ${m.done} of ${m.total} done`, color: rarityInfo(m.rarity).color }),
  time: (m) => ({ dur: SIZE[m.rarity].dur, hit: 1150 }),
  calm: () => <span className="fx-calm__k">叶</span>,
  Scene: ({ m }) => {
    const seed = seedOf(m.title);
    const long = m.title.length > 60 ? ' fx-bk__words--xs' : m.title.length > 28 ? ' fx-bk__words--sm' : '';
    const size = SIZE[m.rarity];
    const color = rarityInfo(m.rarity).color;
    return (
      <div className={`fx-scene fx-bk fx-bk--${m.rarity}`} style={{ '--tc': color } as Css}>
        <i className="fx-bg fx-bk__bg" />
        <Twinkles n={22} seed={seed} top={55} />
        <i className="fx-bk__rays" />
        <i className="fx-glow" />
        {m.rarity === 'legendary' && <Dragon />}
        <Lanterns n={size.lanterns} seed={seed + 1} />
        <Firework x="20%" y="18%" seed={seed + 2} after={260} colors={[color, '#fff3c4', '#ff8a5c']} />
        {size.fireworks > 1 && <Firework x="80%" y="24%" seed={seed + 3} after={520} colors={['#9ad8ff', '#ffffff', color]} />}
        {size.fireworks > 2 && <Firework x="64%" y="8%" seed={seed + 4} after={820} colors={['#ff9ec7', '#ffe08a', '#ffffff']} />}
        <div className="fx-at fx-bk__at">
          <div className="fx-bk__lift">
            <div className="fx-bk__ema">
              <i className="fx-bk__rope" />
              <div className="fx-bk__board">
                <span className="fx-bk__head">夢</span>
                <span className={`fx-bk__words${long}`}>{m.title}</span>
                <span className="fx-bk__stars" aria-hidden="true">{'★'.repeat(rarityInfo(m.rarity).stars)}</span>
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
        <Burst n={20} seed={seed + 5} colors={[color, '#fff3c4', '#ff8a5c', '#ffffff']} />
        <Embers n={size.embers} seed={seed + 6} colors={[color, '#fff3c4', '#ff8a5c']} spread={260} rise={480} delay={1150} />
        <div className="fx-bk__kanji">
          <Extruded text={m.rarity === 'legendary' ? '伝説' : '叶'} depth={6} step={5} back="#b3261e" />
        </div>
        <div className="fx-bk__count">
          <Flap from={Math.max(0, m.done - 1)} to={m.done} delay={1500} />
          <span>of {m.total} done</span>
        </div>
        <Caption chip={`${rarityInfo(m.rarity).name} · ${CHIP[m.rarity]}`} title={m.title} line={m.rarity === 'legendary' ? 'The stuff of legend. Crossed off.' : 'Crossed off. A wish come true.'} />
        <i className="fx-flash" />
      </div>
    );
  },
};

export const BUCKET_FX: Pick<MomentFxMap, 'bucket'> = { bucket };
