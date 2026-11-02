/**
 * Reading's celebrations. A book finished: the pages race past, the cover shuts with a thud, 読了
 * ("read to the end") is stamped on it, and it drops onto the shelf among the others. Past halfway:
 * a ribbon falls into the open book. The year's goal: the whole row of books arrives one by one.
 * A level: the pages lift out of an open book like birds. Transform and opacity only.
 */
import { useMemo } from 'react';
import { Burst, Caption, Confetti, Embers, Extruded, Flap, plural, range, rng, seedOf, Stamp, Twinkles, type Css } from '../kit';
import type { MomentFx, MomentFxMap, SectionFx } from './types';
import './reading.css';

const LAMP = '#ffcf87';
const BLUE = '#56c2e6';
const CLOTHS = ['#7b2d26', '#25483f', '#2b3a67', '#5a3e6b', '#8a5a2b', '#35555f', '#a2472f', '#3f4a2d', '#6e2f47', '#b0853a'];

/** Rain falling past the window behind everything. */
function Rain({ seed, n = 22 }: { seed: number; n?: number }) {
  const drops = useMemo(() => {
    const r = rng(seed);
    return range(n).map((i) => ({ left: `${(i + r()) * (100 / n)}%`, '--d': `${Math.round(r() * 900)}ms`, '--t': `${Math.round(620 + r() * 480)}ms`, height: `${Math.round(30 + r() * 46)}px`, opacity: (0.2 + r() * 0.4).toFixed(2) }) as Css);
  }, [seed, n]);
  return (
    <div className="fx-rd__rain" aria-hidden="true">
      {drops.map((st, i) => (
        <i key={i} style={st} />
      ))}
    </div>
  );
}

function BookOpen({ title, leaves = 7 }: { title: string; leaves?: number }) {
  const long = title.length > 40 ? ' fx-rd__title--xs' : title.length > 20 ? ' fx-rd__title--sm' : '';
  const cloth = CLOTHS[Math.abs(seedOf(title)) % CLOTHS.length];
  return (
    <div className="fx-rd__book" style={{ '--cloth': cloth } as Css}>
      {/* back board and the right-hand pages stay put */}
      <i className="fx-rd__board fx-rd__board--r" />
      <i className="fx-rd__block fx-rd__block--r" />
      {range(leaves).map((i) => (
        <i key={i} className="fx-rd__leaf" style={{ '--i': i, '--d': `${120 + i * 62}ms` } as Css} />
      ))}
      {/* the front cover swings over from the left and shuts at the impact */}
      <div className="fx-rd__front">
        <i className="fx-rd__inside" />
        <div className="fx-rd__face">
          <span className={`fx-rd__title${long}`}>{title}</span>
          <i className="fx-rd__rule" />
        </div>
      </div>
    </div>
  );
}

const book: MomentFx<'book'> = {
  tell: (m) => ({ kicker: 'Book finished', title: m.title, line: `${m.minutes ? `${hoursOf(m.minutes)} · ` : ''}${plural(m.n, 'book')} this year`, color: LAMP }),
  time: () => ({ dur: 3400, hit: 1150 }),
  calm: () => <span className="fx-calm__k">読</span>,
  Scene: ({ m }) => {
    const seed = seedOf(m.title);
    return (
      <div className="fx-scene fx-rd" style={{ '--tc': LAMP } as Css}>
        <i className="fx-bg fx-rd__bg" />
        <Rain seed={seed} />
        <i className="fx-glow" />
        <div className="fx-at fx-rd__at">
          <div className="fx-rd__move">
            <div className="fx-rd__tilt">
              <BookOpen title={m.title} />
            </div>
            <Stamp className="fx-rd__stamp" delay={250}>
              読了
            </Stamp>
          </div>
          <i className="fx-shock" />
        </div>
        <Burst n={16} seed={seed + 1} colors={['#f3ead8', LAMP, '#ffffff']} spread={[110, 240]} />
        <Shelf seed={seed + 2} n={Math.min(m.n, 11)} />
        <div className="fx-rd__count">
          <Flap from={Math.max(0, m.n - 1)} to={m.n} delay={2300} />
          <span>of {m.goal} this year</span>
        </div>
        <Caption chip="reading · 読了" title={m.title} line={m.author || 'Read to the end.'} />
        <i className="fx-flash fx-rd__flash" />
      </div>
    );
  },
};

function hoursOf(min: number) {
  const h = Math.floor(min / 60);
  const rest = min % 60;
  return h ? `${h} h${rest ? ` ${rest} min` : ''}` : `${rest} min`;
}

/** The shelf along the bottom; the last book drops in once the cover has been stamped. */
function Shelf({ seed, n }: { seed: number; n: number }) {
  const spines = useMemo(() => {
    const r = rng(seed);
    return range(Math.max(1, n)).map((i) => ({ width: `${Math.round(12 + r() * 12)}px`, height: `${Math.round(52 + r() * 26)}px`, background: CLOTHS[i % CLOTHS.length] }));
  }, [seed, n]);
  return (
    <div className="fx-rd__shelf" aria-hidden="true">
      <div className="fx-rd__spines">
        {spines.map((st, i) => (
          <i key={i} className={i === spines.length - 1 ? 'is-new' : ''} style={st} />
        ))}
      </div>
      <i className="fx-rd__plank" />
    </div>
  );
}

const half: MomentFx<'book-half'> = {
  tell: (m) => ({ kicker: 'Past halfway', title: m.title, line: `${m.pct}%. It's all downhill from here.`, color: BLUE }),
  time: () => ({ dur: 2500, hit: 900, shake: 'soft' }),
  calm: () => <span className="fx-calm__k">半</span>,
  Scene: ({ m }) => (
    <div className="fx-scene fx-rdh" style={{ '--tc': BLUE } as Css}>
      <i className="fx-bg fx-rd__bg" />
      <Rain seed={seedOf(m.title)} n={14} />
      <i className="fx-glow" />
      <div className="fx-at fx-rdh__at">
        <div className="fx-rdh__spread">
          <i className="fx-rdh__page fx-rdh__page--l" />
          <i className="fx-rdh__page fx-rdh__page--r" />
          <i className="fx-rdh__ribbon" />
        </div>
      </div>
      <div className="fx-rdh__pct">
        <Extruded text={`${m.pct}%`} depth={5} step={4} back="#0b4257" />
      </div>
      <Caption chip="reading · 半ば" title={m.title} line="Past the halfway mark." />
    </div>
  ),
};

const goal: MomentFx<'read-goal'> = {
  tell: (m) => ({ kicker: `${m.year} reading goal`, title: plural(m.n, 'book'), line: "The year's shelf is full.", color: '#ffcc33' }),
  time: () => ({ dur: 3200, hit: 1700 }),
  calm: () => <span className="fx-calm__k">達</span>,
  Scene: ({ m }) => {
    const count = Math.min(m.n, 16);
    const spines = useMemo(() => {
      const r = rng(m.year + m.n);
      return range(count).map((i) => ({ width: `${Math.round(13 + r() * 10)}px`, height: `${Math.round(70 + r() * 44)}px`, background: i === count - 1 ? 'linear-gradient(90deg,#b8860b,#ffdf70,#b8860b)' : CLOTHS[i % CLOTHS.length], '--d': `${200 + (i * 1400) / count}ms` }) as Css);
    }, [count, m.year, m.n]);
    return (
      <div className="fx-scene fx-rdg" style={{ '--tc': '#ffcc33' } as Css}>
        <i className="fx-bg fx-rd__bg" />
        <Twinkles n={18} seed={m.year} top={50} />
        <i className="fx-glow" />
        <div className="fx-rdg__case">
          <div className="fx-rdg__row">
            {spines.map((st, i) => (
              <i key={i} style={st} />
            ))}
          </div>
          <i className="fx-rd__plank" />
        </div>
        <div className="fx-rdg__k">
          <Extruded text="達成" depth={6} step={5} back="#7a4a00" />
        </div>
        <Confetti n={26} seed={m.year + 3} colors={['#ffcc33', '#fff3c4', '#ff8a5c', BLUE]} delay={1700} />
        <Embers n={14} seed={m.year + 4} colors={['#ffcc33', '#fff3c4']} spread={240} rise={420} delay={1700} />
        <Caption chip={`reading · ${m.year}`} title={`${plural(m.n, 'book')} this year`} line="Goal reached." />
        <i className="fx-flash" />
      </div>
    );
  },
};

export const READING_FX: Pick<MomentFxMap, 'book' | 'book-half' | 'read-goal'> = { book, 'book-half': half, 'read-goal': goal };

function LevelScene({ from, to }: { from: number; to: number }) {
  const pages = useMemo(() => {
    const r = rng(to + 11);
    return range(14).map(
      (i) =>
        ({
          '--x': `${Math.round((r() - 0.5) * 300)}px`,
          '--y': `${Math.round(-180 - r() * 300)}px`,
          '--z': `${Math.round(-200 + r() * 320)}px`,
          '--r': `${Math.round(180 + r() * 360)}deg`,
          '--d': `${200 + i * 70}ms`,
          '--t': `${Math.round(1300 + r() * 500)}ms`,
        }) as Css,
    );
  }, [to]);
  return (
    <div className="fx-scene fx-rdl" style={{ '--tc': LAMP } as Css}>
      <i className="fx-bg fx-rd__bg" />
      <Rain seed={to} n={16} />
      <i className="fx-glow" />
      <div className="fx-at fx-rdl__at">
        <div className="fx-rdl__spread">
          <i className="fx-rdh__page fx-rdh__page--l" />
          <i className="fx-rdh__page fx-rdh__page--r" />
        </div>
        {pages.map((st, i) => (
          <span key={i} className="fx-rdl__fly" style={st}>
            <i />
          </span>
        ))}
      </div>
      <div className="fx-rdl__k">
        <Extruded text="読" depth={7} step={5} back="#7a4a12" />
      </div>
      <div className="fx-rdl__lv">
        LV <Flap from={String(from).padStart(2, '0')} to={String(to).padStart(2, '0')} delay={1250} />
      </div>
      <Caption chip="CH11 · level up" title="Reading" line={<>LV {from} → <b>LV {to}</b></>} />
    </div>
  );
}

export const READING_LEVEL: SectionFx = { Scene: LevelScene, time: { dur: 2750, hit: 1250, shake: 'soft' }, calm: <span className="fx-calm__k">読</span> };
