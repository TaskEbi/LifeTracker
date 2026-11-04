/**
 * Special moments (domain/fun/special.ts): ten longer scenes drawn as a comic page. Each one is
 * three beats: an establishing panel, an action panel with sound effects, then a splash page with
 * the big kanji and the caption. The panels hang in 3D and the camera moves through them.
 * Transform and opacity only, like every other scene (see fx.css).
 */
import { useMemo, type ReactNode } from 'react';
import { useProgress } from '../../../../data/lt';
import { SEASON_INFO, type SeasonId } from '../../../../domain/fun/special';
import { BOSSES } from '../../../../domain/progress/boss';
import { BossArt } from '../../../../features/progress/BossArt';
import { Drone } from '../../Drone';
import { Burst, Caption, Confetti, Extruded, Flap, plural, range, rng, Seal, Twinkles, type Css } from '../kit';
import type { SpecialFx, SpecialFxMap, SpecialOf } from './types';
import './specials.css';
import './specials2.css';

const kanji = (ch: string) => <span className="fx-calm__k">{ch}</span>;
const hm = (min: number) => {
  const m = Math.max(0, Math.round(min));
  return m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${String(m % 60).padStart(2, '0')}m` : ''}` : `${m} min`;
};
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_KANJI = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

// ─── shared comic pieces ─────────────────────────────────────────────────────

/**
 * A comic panel hanging in the 3D stage. `x`/`y` place its centre (percent of the screen),
 * `inAt`/`outAt` (ms) are when it swings in and when it flies off for the splash.
 */
function Panel({ x = 50, y, w, h, rz = 0, inAt, outAt, from = 'right', className = '', children }: { x?: number; y: number; w: string; h: string; rz?: number; inAt: number; outAt: number; from?: 'left' | 'right' | 'below'; className?: string; children: ReactNode }) {
  return (
    <div className={`sp-panel sp-panel--${from} ${className}`} style={{ '--x': `${x}%`, '--y': `${y}%`, '--w': w, '--h': h, '--rz': `${rz}deg`, '--in': `${inAt}ms`, '--out': `${outAt}ms` } as Css}>
      <div className="sp-panel__in">{children}</div>
      <i className="sp-tone" />
    </div>
  );
}

/** Sound-effect lettering: each character pops in after the last. */
function Sfx({ text, at, className = '', step = 70, color }: { text: string; at: number; className?: string; step?: number; color?: string }) {
  return (
    <span className={`sp-sfx ${className}`} style={color ? ({ '--sc': color } as Css) : undefined} aria-hidden="true">
      {[...text].map((ch, i) => (
        <b key={i} style={{ '--d': `${at + i * step}ms`, '--i': i } as Css}>
          {ch}
        </b>
      ))}
    </span>
  );
}

/** The splash page behind the big moment: a coloured sunburst that turns slowly. */
function Splash({ className = '' }: { className?: string }) {
  return (
    <div className={`sp-splash ${className}`} aria-hidden="true">
      <i className="sp-splash__burst" />
      <i className="sp-splash__glow" />
      <i className="sp-splash__tone" />
    </div>
  );
}

function Big({ text, back, className = '' }: { text: string; back: string; className?: string }) {
  return (
    <div className={`sp-big ${className}`}>
      <div className="sp-big__in">
        <Extruded text={text} depth={7} step={5} back={back} />
      </div>
    </div>
  );
}

/** The 3D stage: panels hang in it and the camera drifts round them while they're on screen. */
function Stage({ children }: { children: ReactNode }) {
  return (
    <div className="sp-stage">
      <div className="sp-cam">{children}</div>
    </div>
  );
}

/** A row of buildings with lit windows; `off` lets the windows go dark one building at a time. */
function City({ seed, n, layer, off }: { seed: number; n: number; layer: 'far' | 'mid' | 'near'; off?: [number, number] }) {
  const blds = useMemo(() => {
    const r = rng(seed);
    return range(n).map((i) => ({
      '--bh': `${Math.round((layer === 'far' ? 34 : layer === 'mid' ? 46 : 30) + r() * (layer === 'near' ? 26 : 40))}%`,
      '--bw': `${Math.round(9 + r() * 10)}%`,
      '--off': off ? `${Math.round(off[0] + ((off[1] - off[0]) * ((i * 7) % n)) / n)}ms` : '0ms',
      '--wx': `${Math.round(r() * 6)}px`,
    })) as Css[];
  }, [seed, n, layer, off]);
  return (
    <div className={`sp-city sp-city--${layer}${off ? ' sp-city--off' : ''}`} aria-hidden="true">
      {blds.map((b, i) => (
        <i key={i} className="sp-bld" style={b}>
          <i className="sp-bld__win" />
        </i>
      ))}
    </div>
  );
}

/** Things falling through the scene in depth: petals, leaves, snow, sparks. */
function Fall({ n, seed, kind, from = 0, span = 2400 }: { n: number; seed: number; kind: 'petal' | 'leaf' | 'snow' | 'spark'; from?: number; span?: number }) {
  const parts = useMemo(() => {
    const r = rng(seed);
    return range(n).map(
      (i) =>
        ({
          left: `${Math.round(r() * 100)}%`,
          '--dx': `${Math.round((r() - 0.5) * 180)}px`,
          '--z': `${Math.round(-300 + r() * 520)}px`,
          '--r': `${Math.round(180 + r() * 540) * (i % 2 ? 1 : -1)}deg`,
          '--d': `${from + Math.round(r() * span)}ms`,
          '--p': `${2600 + Math.round(r() * 1800)}ms`,
          '--s': `${8 + r() * 10}px`,
        }) as Css,
    );
  }, [n, seed, from, span]);
  return (
    <div className={`sp-fall sp-fall--${kind}`} aria-hidden="true">
      {parts.map((p, i) => (
        <i key={i} style={p} />
      ))}
    </div>
  );
}

function DroneFig({ stage, happy, className = '' }: { stage: number; happy?: boolean; className?: string }) {
  return (
    <div className={`sp-drone ${className}`}>
      <Drone stage={stage} still happy={happy} label={false} />
    </div>
  );
}

const useStage = () => useProgress().overall.stage;

// ─── 1 morning: sunrise over the city, the alarm, the drone wakes ───────────

function MorningScene({ m }: { m: SpecialOf<'morning'> }) {
  const stage = useStage();
  const day = new Date(`${m.date}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  return (
    <div className="fx-scene sp sp-morn" style={{ '--tc': '#ffb347' } as Css}>
      <i className="fx-bg sp-inkbg" />
      <Stage>
        <Panel y={27} w="min(90vw, 600px)" h="min(36vh, 330px)" inAt={120} outAt={3450} from="below" rz={-1.2}>
          <i className="sp-sky sp-morn__night" />
          <i className="sp-sky sp-morn__dawn" />
          <i className="sp-morn__rays" />
          <i className="sp-morn__sun" />
          <i className="sp-cloud sp-cloud--a" />
          <i className="sp-cloud sp-cloud--b" />
          <City seed={11} n={9} layer="far" />
          <City seed={23} n={8} layer="mid" off={[900, 2600]} />
          <City seed={37} n={7} layer="near" off={[1200, 2800]} />
          <i className="sp-bird" style={{ '--d': '700ms', '--y': '30%' } as Css} />
          <i className="sp-bird" style={{ '--d': '950ms', '--y': '22%' } as Css} />
          <i className="sp-bird" style={{ '--d': '1150ms', '--y': '36%' } as Css} />
          <Sfx text="チュン" at={1050} className="sp-morn__chun" color="#fff6d8" />
          <Sfx text="チュン" at={1450} className="sp-morn__chun sp-morn__chun--2" color="#fff6d8" />
        </Panel>
        <Panel y={63} w="min(78vw, 470px)" h="min(30vh, 270px)" inAt={1650} outAt={3450} rz={2}>
          <i className="sp-room" />
          <i className="sp-morn__shaft" />
          <i className="sp-bed" />
          <i className="sp-clock">
            <i />
          </i>
          <DroneFig stage={stage} className="sp-morn__asleep" />
          <DroneFig stage={stage} happy className="sp-morn__awake" />
          <span className="sp-zzz sp-morn__zzz" aria-hidden="true">
            <b>Z</b>
            <b>z</b>
            <b>z</b>
          </span>
          <Sfx text="ジリリリ!" at={2450} step={45} className="sp-morn__ring" color="#ff4d4d" />
          <Sfx text="パチッ" at={3050} className="sp-morn__pachi" color="#ffe066" />
        </Panel>
      </Stage>
      <Splash className="sp-morn__splash" />
      <Big text="朝" back="#c2410c" className="sp-morn__big" />
      <Sfx text="おはよう!" at={3800} step={60} className="sp-hero-sfx" color="#fff3c4" />
      <Burst n={14} seed={7} colors={['#ffd166', '#fff3c4', '#ff9f43']} spread={[140, 300]} />
      <Caption chip="good morning · 朝" title="Good morning" line={`${day} · ${m.todo ? `${plural(m.todo, 'thing')} to record today` : 'nothing waiting on the checklist'}`} />
      <i className="fx-flash" />
    </div>
  );
}

const morning: SpecialFx<'morning'> = {
  tell: (m) => ({ kicker: 'Good morning', title: 'A new day', line: m.todo ? `${plural(m.todo, 'thing')} to record today` : 'Nothing waiting on the checklist', color: '#ffb347' }),
  time: () => ({ dur: 6400, hit: 3600, shake: 'soft' }),
  calm: () => kanji('朝'),
  Scene: MorningScene,
};

// ─── 2 night: the city's lights go out, curtains close, おやすみ ─────────────

const night: SpecialFx<'night'> = {
  tell: (m) => ({ kicker: 'Good night', title: 'Lights out', line: `Bed ${m.bed} · up at ${m.wake} · ${m.hours} h of sleep`, color: '#c9b6ff' }),
  time: () => ({ dur: 6800, hit: 3900, shake: 'none' }),
  calm: () => kanji('夜'),
  Scene: function NightScene({ m }) {
    const stage = useStage();
    return (
      <div className="fx-scene sp sp-night" style={{ '--tc': '#c9b6ff' } as Css}>
        <i className="fx-bg sp-inkbg" />
        <Stage>
          <Panel y={27} w="min(90vw, 600px)" h="min(36vh, 330px)" inAt={120} outAt={3700} from="below" rz={1}>
            <i className="sp-sky sp-night__dusk" />
            <i className="sp-sky sp-night__deep" />
            <div className="sp-night__stars">
              <Twinkles n={14} seed={5} top={45} />
            </div>
            <i className="sp-night__moon" />
            <City seed={41} n={9} layer="far" off={[600, 2400]} />
            <City seed={53} n={8} layer="mid" off={[900, 2900]} />
            <City seed={67} n={7} layer="near" off={[1300, 3200]} />
            <Sfx text="シーン…" at={2100} step={110} className="sp-night__shin" color="#d9d2ff" />
          </Panel>
          <Panel y={63} w="min(78vw, 470px)" h="min(30vh, 270px)" inAt={1700} outAt={3700} rz={-2} from="left">
            <i className="sp-room sp-room--night" />
            <i className="sp-window">
              <i className="sp-window__moon" />
            </i>
            <i className="sp-curtain sp-curtain--l" />
            <i className="sp-curtain sp-curtain--r" />
            <i className="sp-lamp" />
            <DroneFig stage={stage} className="sp-night__drone" />
            <i className="sp-night__dim" />
            <Sfx text="カチッ" at={3250} className="sp-night__click" color="#ffe8a3" />
          </Panel>
        </Stage>
        <Splash className="sp-night__splash" />
        <div className="sp-night__sky2">
          <Twinkles n={22} seed={9} top={70} />
        </div>
        <i className="sp-night__bigmoon" />
        <Big text="夜" back="#5b4bb7" className="sp-night__big" />
        <Sfx text="おやすみ…" at={4150} step={140} className="sp-hero-sfx sp-hero-sfx--soft" color="#efe9ff" />
        <span className="sp-zzz sp-night__zzz" aria-hidden="true">
          <b>Z</b>
          <b>z</b>
          <b>z</b>
        </span>
        <Caption chip="good night · 夜" title="Lights out" line={`Bed ${m.bed} · up at ${m.wake} · ${m.hours} h of sleep`} />
      </div>
    );
  },
};

// ─── 3 new week: a new arc's cover, the boss rises from the fog, VS ─────────

const newWeek: SpecialFx<'new-week'> = {
  tell: (m) => ({ kicker: 'A new week', title: `Vs ${m.boss}`, line: m.lastWeekMinutes ? `Last week: ${hm(m.lastWeekMinutes)} logged` : 'A fresh arc begins', color: '#ff3b5c' }),
  time: () => ({ dur: 6800, hit: 3900 }),
  calm: () => kanji('新章'),
  Scene: function WeekScene({ m }) {
    const stage = useStage();
    const boss = BOSSES.find((b) => b.id === m.bossId) ?? BOSSES.find((b) => b.name === m.boss) ?? BOSSES[0];
    const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
    return (
      <div className="fx-scene sp sp-week" style={{ '--tc': '#ff3b5c', '--bc': boss.c, '--bc2': boss.c2 } as Css}>
        <i className="fx-bg sp-inkbg" />
        <Stage>
          <Panel y={27} w="min(84vw, 520px)" h="min(36vh, 330px)" inAt={120} outAt={3800} from="below" rz={-2}>
            <i className="sp-week__cover" />
            <i className="sp-speed" />
            <span className="sp-week__mast">週刊 LIFE TRACKER</span>
            <span className="sp-week__arc">新章</span>
            <span className="sp-week__sub">A NEW ARC · WEEK OF {date.toUpperCase()}</span>
            <Sfx text="ドン!" at={620} className="sp-week__don" color="#ffe066" />
          </Panel>
          <Panel y={63} w="min(84vw, 520px)" h="min(30vh, 270px)" inAt={1700} outAt={3800} rz={2}>
            <i className="sp-week__storm" />
            <i className="sp-week__bolt" />
            <div className="sp-week__boss">
              <div className="sp-week__shadow">
                <BossArt boss={boss} unknown />
              </div>
              <i className="sp-week__eyes" />
            </div>
            <i className="sp-fog sp-fog--a" />
            <i className="sp-fog sp-fog--b" />
            <Sfx text="ゴゴゴゴ" at={2050} step={90} className="sp-week__gogo" color="#c9a7ff" />
          </Panel>
        </Stage>
        <div className="sp-vs" aria-hidden="true">
          <div className="sp-vs__l">
            <i className="sp-speed sp-speed--hot" />
            <DroneFig stage={stage} happy className="sp-vs__me" />
          </div>
          <div className="sp-vs__r">
            <i className="sp-speed" />
            <div className="sp-vs__boss">
              <BossArt boss={boss} />
            </div>
          </div>
          <i className="sp-vs__cut" />
        </div>
        <Big text="VS" back="#a1122b" className="sp-week__vs" />
        <Burst n={16} seed={31} colors={['#ffe066', '#ff3b5c', '#fff']} spread={[160, 320]} />
        <Caption chip="a new week · 新章" title={`Vs ${boss.name}`} line={m.lastWeekMinutes ? `Last week: ${hm(m.lastWeekMinutes)} logged · ${boss.title}` : `${boss.title} · a fresh arc begins`} />
        <i className="fx-flash" />
      </div>
    );
  },
};

// ─── 4 new month: last month's pages tear off, the new month stamps down ───

const newMonth: SpecialFx<'new-month'> = {
  tell: (m) => ({ kicker: 'A new month', title: MONTHS[m.month - 1], line: m.lastMonthMinutes ? `${MONTHS[(m.month + 10) % 12]}: ${hm(m.lastMonthMinutes)} logged` : 'A fresh page', color: '#ff5d73' }),
  time: () => ({ dur: 6200, hit: 3400 }),
  calm: (m) => <span className="fx-calm__k fx-calm__k--sm">{MONTH_KANJI[m.month - 1]}</span>,
  Scene: function MonthScene({ m }) {
    const prev = (m.month + 10) % 12;
    const lastDays = new Date(Date.UTC(m.year, m.month - 1, 0)).getUTCDate();
    const firstDow = (new Date(Date.UTC(m.year, m.month - 1, 1)).getUTCDay() + 6) % 7;
    const days = new Date(Date.UTC(m.year, m.month, 0)).getUTCDate();
    const tearing = [lastDays - 3, lastDays - 2, lastDays - 1, lastDays];
    return (
      <div className="fx-scene sp sp-month" style={{ '--tc': '#ff5d73' } as Css}>
        <i className="fx-bg sp-inkbg" />
        <Stage>
          <Panel y={33} w="min(86vw, 520px)" h="min(48vh, 420px)" inAt={120} outAt={3300} from="below">
            <i className="sp-wall" />
            <i className="sp-wall__light" />
            <div className="sp-cal">
              <i className="sp-cal__ring" />
              <div className="sp-cal__page sp-cal__page--new">
                <span className="sp-cal__mon">{MONTHS[m.month - 1].toUpperCase()}</span>
                <b>1</b>
                <span className="sp-cal__k">{MONTH_KANJI[m.month - 1]}</span>
              </div>
              {tearing
                .slice()
                .reverse()
                .map((d, i) => (
                  <div key={d} className="sp-cal__page sp-cal__page--tear" style={{ '--d': `${[1950, 1600, 1250, 800][i]}ms`, '--dx': `${[60, -80, 40, -30][i]}px`, '--r': `${[25, -35, 18, -12][i]}deg` } as Css}>
                    <span className="sp-cal__mon">{MONTHS[prev].toUpperCase()}</span>
                    <b>{d}</b>
                  </div>
                ))}
            </div>
            <Sfx text="ビリッ!" at={820} className="sp-month__rip" color="#fff" />
            <Sfx text="ビリビリ" at={1500} step={50} className="sp-month__rip sp-month__rip--2" color="#ffd1d8" />
          </Panel>
        </Stage>
        <Splash className="sp-month__splash" />
        <div className="sp-month__grid" aria-hidden="true">
          {range(firstDow).map((i) => (
            <i key={`e${i}`} className="sp-month__cell is-empty" />
          ))}
          {range(days).map((i) => (
            <i key={i} className={`sp-month__cell${i === 0 ? ' is-one' : ''}`} style={{ '--d': `${3450 + (firstDow + i) * 22}ms` } as Css}>
              {i + 1}
            </i>
          ))}
        </div>
        <div className="sp-month__stamp">
          <Seal chars={MONTH_KANJI[m.month - 1]} className="sp-month__seal" />
        </div>
        <Caption chip="a new month · 新月" title={MONTHS[m.month - 1]} line={m.lastMonthMinutes ? `${MONTHS[prev]}: ${hm(m.lastMonthMinutes)} logged · a fresh page` : 'A fresh page'} />
        <i className="fx-flash" />
      </div>
    );
  },
};

// ─── 5 new season: the four seasons, the new one takes the screen ──────────

const FALL_OF: Record<SeasonId, 'petal' | 'leaf' | 'snow' | 'spark'> = { spring: 'petal', summer: 'spark', autumn: 'leaf', winter: 'snow' };
const SOUND_OF: Record<SeasonId, string> = { spring: 'ひらひら', summer: 'ミーンミーン', autumn: 'ひらり', winter: 'しんしん' };
const LINE_OF: Record<SeasonId, string> = { spring: 'Things grow back', summer: 'Long days, long sessions', autumn: 'Harvest what you planted', winter: 'Quiet work counts' };

const newSeason: SpecialFx<'new-season'> = {
  tell: (m) => ({ kicker: 'A new season', title: `${SEASON_INFO[m.season].name} is here`, line: LINE_OF[m.season], color: SEASON_INFO[m.season].c }),
  time: () => ({ dur: 6400, hit: 3500, shake: 'soft' }),
  calm: (m) => kanji(SEASON_INFO[m.season].kanji),
  Scene: function SeasonScene({ m }) {
    const s = SEASON_INFO[m.season];
    const order: SeasonId[] = ['spring', 'summer', 'autumn', 'winter'];
    return (
      <div className={`fx-scene sp sp-sea sp-sea--${m.season}`} style={{ '--tc': s.c } as Css}>
        <i className="fx-bg sp-inkbg" />
        <Stage>
          <div className="sp-sea__tiles">
            {order.map((id, i) => (
              <div key={id} className={`sp-sea__tile sp-sea--${id}${id === m.season ? ' is-new' : ''}`} style={{ '--i': i, '--d': `${150 + i * 140}ms` } as Css}>
                <i className="sp-sea__land" />
                <b>{SEASON_INFO[id].kanji}</b>
                <small>{SEASON_INFO[id].name}</small>
              </div>
            ))}
          </div>
          <Panel y={36} w="min(90vw, 600px)" h="min(52vh, 460px)" inAt={1900} outAt={3400} rz={-1}>
            <i className="sp-sea__sky" />
            <i className="sp-sea__sun" />
            <i className="sp-sea__hill sp-sea__hill--back" />
            <i className="sp-sea__hill sp-sea__hill--front" />
            <i className="sp-sea__tree" />
            <Fall n={18} seed={3} kind={FALL_OF[m.season]} from={1900} span={1500} />
            <Sfx text={SOUND_OF[m.season]} at={2300} step={90} className="sp-sea__sfx" color="#fff" />
          </Panel>
        </Stage>
        <Splash className="sp-sea__splash" />
        <Fall n={26} seed={8} kind={FALL_OF[m.season]} from={3400} span={2000} />
        <Big text={s.kanji} back={`color-mix(in srgb, ${s.c} 50%, #000)`} className="sp-sea__big" />
        <Caption chip={`a new season · ${s.kanji}`} title={`${s.name} is here`} line={`${LINE_OF[m.season]} · ${s.name} ${m.year}`} />
        <i className="fx-flash" />
      </div>
    );
  },
};

// ─── 6 new year: countdown, fireworks over the mountain, the first sunrise ─

function Firework({ x, y, at, c, seed }: { x: number; y: number; at: number; c: string; seed: number }) {
  const sparks = useMemo(() => {
    const r = rng(seed);
    return range(18).map((i) => ({ '--a': `${(i / 18) * 360 + r() * 10}deg`, '--dist': `${70 + r() * 50}px` }) as Css);
  }, [seed]);
  return (
    <div className="sp-fw" style={{ left: `${x}%`, top: `${y}%`, '--d': `${at}ms`, '--fc': c } as Css}>
      <i className="sp-fw__trail" />
      <i className="sp-fw__core" />
      {sparks.map((s, i) => (
        <i key={i} className="sp-fw__s" style={s} />
      ))}
    </div>
  );
}

const newYear: SpecialFx<'new-year'> = {
  tell: (m) => ({ kicker: 'Happy New Year', title: String(m.year), line: m.lastYearHours ? `${m.lastYearHours} h logged in ${m.year - 1}` : 'A whole year to fill', color: '#ffcf4a' }),
  time: () => ({ dur: 7000, hit: 3600, shake: 'soft' }),
  calm: () => <span className="fx-calm__k fx-calm__k--sm">謹賀新年</span>,
  Scene: function YearScene({ m }) {
    return (
      <div className="fx-scene sp sp-year" style={{ '--tc': '#ffcf4a' } as Css}>
        <i className="fx-bg sp-inkbg" />
        <Stage>
          <Panel y={36} w="min(92vw, 620px)" h="min(54vh, 470px)" inAt={120} outAt={3500} from="below">
            <i className="sp-sky sp-year__sky" />
            <i className="sp-sky sp-year__dawn" />
            <Twinkles n={16} seed={2} top={50} />
            <Firework x={26} y={30} at={1750} c="#ff5d73" seed={1} />
            <Firework x={72} y={24} at={2050} c="#ffd166" seed={2} />
            <Firework x={50} y={18} at={2350} c="#7cf0ff" seed={3} />
            <Firework x={36} y={40} at={2700} c="#b9ff7a" seed={4} />
            <Firework x={66} y={42} at={2950} c="#ff9fe0" seed={5} />
            <i className="sp-year__sun" />
            <i className="sp-year__fuji" />
            <i className="sp-year__cap" />
            <i className="sp-year__water" />
            <div className="sp-year__count">
              {['3', '2', '1'].map((n, i) => (
                <b key={n} style={{ '--d': `${350 + i * 450}ms` } as Css}>
                  {n}
                </b>
              ))}
            </div>
            <Sfx text="ドーン!" at={1800} className="sp-year__don" color="#ffe066" />
          </Panel>
        </Stage>
        <Splash className="sp-year__splash" />
        <div className="sp-year__seal">
          <Seal chars="謹賀新年" className="sp-year__sealk" />
        </div>
        <div className="sp-year__num">
          <Flap from={m.year - 1} to={m.year} delay={3950} />
        </div>
        <Confetti n={26} seed={m.year} colors={['#ffcf4a', '#ff5d73', '#fff', '#7cf0ff']} delay={3700} />
        <Caption chip="happy new year · 謹賀新年" title={`Happy ${m.year}`} line={m.lastYearHours ? `${m.lastYearHours} h logged in ${m.year - 1} · a whole year to fill` : 'A whole year to fill'} />
        <i className="fx-flash" />
      </div>
    );
  },
};

// ─── 7 day complete: the checklist ticks itself off, an ensō, 完 ────────────

const ROWS = ['Mood', 'Today’s question', 'Activity', 'Sleep last night', 'Rituals', 'Tasks due', 'Screen time', 'Close the day'];

const dayComplete: SpecialFx<'day-complete'> = {
  tell: (m) => ({ kicker: 'Day complete', title: 'Everything recorded', line: `All ${m.items} on today’s checklist${m.minutes ? ` · ${hm(m.minutes)} logged` : ''}`, color: '#3ddc97' }),
  time: () => ({ dur: 6000, hit: 3300 }),
  calm: () => kanji('完'),
  Scene: function CompleteScene({ m }) {
    const rows = ROWS.slice(0, Math.max(3, Math.min(ROWS.length, m.items)));
    return (
      <div className="fx-scene sp sp-done" style={{ '--tc': '#3ddc97' } as Css}>
        <i className="fx-bg sp-inkbg" />
        <Stage>
          <Panel y={34} w="min(86vw, 500px)" h="min(50vh, 440px)" inAt={120} outAt={3200} from="below" rz={-1}>
            <i className="sp-desk" />
            <i className="sp-desk__lamp" />
            <div className="sp-paper">
              <span className="sp-paper__h">今日 · TODAY</span>
              {rows.map((r, i) => (
                <div key={r} className="sp-paper__row" style={{ '--d': `${520 + i * 260}ms` } as Css}>
                  <i className="sp-paper__box" />
                  <i className="sp-paper__tick" />
                  <span>{r}</span>
                </div>
              ))}
              <span className="sp-paper__hanko" style={{ '--d': `${560 + rows.length * 260}ms` } as Css}>
                完了
              </span>
            </div>
            <Sfx text="シュッ" at={600} className="sp-done__shu" color="#ff4d4d" />
            <Sfx text="ポン!" at={560 + rows.length * 260} className="sp-done__pon" color="#ffe066" />
          </Panel>
        </Stage>
        <Splash className="sp-done__splash" />
        <div className="sp-enso" aria-hidden="true">
          {range(26).map((i) => (
            <i key={i} style={{ '--a': `${-100 + i * 13}deg`, '--d': `${3350 + i * 26}ms`, '--w': `${1 - Math.abs(i - 9) / 30}` } as Css} />
          ))}
        </div>
        <Big text="完" back="#0f7a4f" className="sp-done__big" />
        <Confetti n={22} seed={m.items * 7} colors={['#3ddc97', '#ffe066', '#fff', '#ff5d73']} delay={3500} />
        <Caption chip="day complete · 完" title="Everything recorded" line={`All ${m.items} on today’s checklist${m.minutes ? ` · ${hm(m.minutes)} logged` : ''}`} />
        <i className="fx-flash" />
      </div>
    );
  },
};

// ─── 8 storm: rain on a dark sea, a lighthouse beam finds the boat ─────────

const storm: SpecialFx<'storm'> = {
  tell: (m) => ({ kicker: 'Rough weather', title: 'Storms pass', line: m.notes ? `You left yourself ${plural(m.notes, 'message')} in the Lighthouse` : 'The Lighthouse is in the Hideout when you want it', color: '#ffd98a' }),
  time: () => ({ dur: 7200, hit: 4300, shake: 'none' }),
  calm: () => kanji('灯'),
  Scene: function StormScene({ m }) {
    return (
      <div className="fx-scene sp sp-storm" style={{ '--tc': '#ffd98a' } as Css}>
        <i className="fx-bg sp-inkbg" />
        <Stage>
          <Panel y={27} w="min(90vw, 600px)" h="min(36vh, 330px)" inAt={120} outAt={4150} from="below" rz={-1.5}>
            <i className="sp-sky sp-storm__sky" />
            <i className="sp-storm__flash" />
            <i className="sp-storm__clouds" />
            <i className="sp-storm__bolt" />
            <i className="sp-storm__bolt sp-storm__bolt--2" />
            <i className="sp-wave sp-wave--a" />
            <i className="sp-wave sp-wave--b" />
            <i className="sp-wave sp-wave--c" />
            <i className="sp-rain" />
            <Sfx text="ザァァァ" at={350} step={80} className="sp-storm__zaa" color="#bcd3ff" />
            <Sfx text="ゴロゴロ" at={1650} step={70} className="sp-storm__goro" color="#fff3a8" />
          </Panel>
          <Panel y={63} w="min(80vw, 480px)" h="min(30vh, 270px)" inAt={1900} outAt={4150} rz={1.5}>
            <i className="sp-sky sp-storm__sky2" />
            <i className="sp-cliff" />
            <div className="sp-lh">
              <i className="sp-lh__tower" />
              <i className="sp-lh__lamp" />
              <div className="sp-lh__pivot">
                <i className="sp-lh__beam" />
              </div>
            </div>
            <i className="sp-wave sp-wave--a sp-wave--low" />
            <i className="sp-boat" />
            <i className="sp-rain sp-rain--light" />
            <span className="sp-bub sp-storm__bub">大丈夫。</span>
          </Panel>
        </Stage>
        <Splash className="sp-storm__splash" />
        <i className="sp-storm__part sp-storm__part--l" />
        <i className="sp-storm__part sp-storm__part--r" />
        <i className="sp-storm__ray" />
        <Big text="灯" back="#a86a12" className="sp-storm__big" />
        <Caption chip="rough weather · 灯" title="Storms pass" line={m.notes ? `You left yourself ${plural(m.notes, 'message')} in the Lighthouse` : 'There’s light in the Hideout’s Lighthouse when you want it'} />
      </div>
    );
  },
};

// ─── 9 close the day: the shop's lantern, the shutter rolls down ───────────

const closeDay: SpecialFx<'close-day'> = {
  tell: (m) => ({ kicker: 'Day closed', title: 'お疲れ様', line: m.first ? `First thing tomorrow: ${m.first}` : `Bed by ${m.bed}`, color: '#8fa3ff' }),
  time: () => ({ dur: 6400, hit: 3600 }),
  calm: () => kanji('終'),
  Scene: function CloseScene({ m }) {
    return (
      <div className="fx-scene sp sp-close" style={{ '--tc': '#8fa3ff' } as Css}>
        <i className="fx-bg sp-inkbg" />
        <Stage>
          <Panel y={36} w="min(86vw, 520px)" h="min(54vh, 460px)" inAt={120} outAt={3500} from="below">
            <i className="sp-sky sp-close__sky" />
            <div className="sp-shop">
              <i className="sp-shop__roof" />
              <i className="sp-shop__front" />
              <i className="sp-shop__glow" />
              <div className="sp-shop__noren">
                {range(4).map((i) => (
                  <i key={i} style={{ '--i': i } as Css}>
                    {['終', '礼', '今', '日'][i]}
                  </i>
                ))}
              </div>
              <i className="sp-lantern" />
              <i className="sp-lantern__light" />
              <div className="sp-shutterbox">
                <div className="sp-shutter">
                  <span className="sp-notice">
                    <b>本日終了</b>
                    <small>{m.first ? `Tomorrow: ${m.first}` : 'See you tomorrow'}</small>
                  </span>
                </div>
              </div>
            </div>
            <Sfx text="ふぅ…" at={1000} step={160} className="sp-close__fuu" color="#e8ecff" />
            <Sfx text="ガラガラ" at={2050} step={80} className="sp-close__gara" color="#ffe066" />
            <Sfx text="ペタッ" at={3000} className="sp-close__peta" color="#ff9aa8" />
          </Panel>
        </Stage>
        <Splash className="sp-close__splash" />
        <i className="sp-close__moon" />
        <Big text="終" back="#3b4aa8" className="sp-close__big" />
        <Sfx text="おつかれ!" at={3850} step={70} className="sp-hero-sfx" color="#e8ecff" />
        <Caption chip="day closed · 終礼" title="お疲れ様 · well done" line={m.first ? `First thing tomorrow: ${m.first} · bed by ${m.bed}` : `Bed by ${m.bed}`} />
        <i className="fx-flash" />
      </div>
    );
  },
};

// ─── 10 war council: pieces land on the map, arrows drawn, 作戦決定 ─────────

const warCouncil: SpecialFx<'war-council'> = {
  tell: (m) => ({ kicker: 'Plan locked in', title: m.theme || 'This week’s plan', line: m.big.length ? `Big Three: ${m.big.join(' · ')}` : 'Weekly review sealed', color: '#ff6a3d' }),
  time: () => ({ dur: 6400, hit: 3700 }),
  calm: () => <Seal chars="作戦" className="fx-seal--calm" />,
  Scene: function WarScene({ m }) {
    const big = (m.big.length ? m.big : ['Main goal', 'Second', 'Third']).slice(0, 3);
    const spots: [number, number][] = [
      [30, 34],
      [64, 26],
      [52, 66],
    ];
    return (
      <div className="fx-scene sp sp-war" style={{ '--tc': '#ff6a3d' } as Css}>
        <i className="fx-bg sp-inkbg" />
        <Stage>
          <Panel y={36} w="min(92vw, 620px)" h="min(54vh, 470px)" inAt={120} outAt={3600} from="below">
            <i className="sp-war__room" />
            <i className="sp-war__lamp" />
            <div className="sp-war__tablewrap">
              <div className="sp-war__table">
                <i className="sp-war__map" />
                {spots.slice(0, big.length).map(([x, y], i) => (
                  <i key={`a${i}`} className="sp-war__arrow" style={{ left: `${x}%`, top: `${y}%`, '--r': `${[-20, 150, -70][i]}deg`, '--d': `${2050 + i * 220}ms` } as Css} />
                ))}
                {big.map((b, i) => (
                  <div key={b + i} className="sp-war__piece" style={{ left: `${spots[i][0]}%`, top: `${spots[i][1]}%`, '--d': `${650 + i * 420}ms` } as Css}>
                    <i className="sp-war__dust" />
                    <span className="sp-war__token">{['一', '二', '三'][i]}</span>
                    <span className="sp-war__tag">{b}</span>
                  </div>
                ))}
              </div>
            </div>
            <Sfx text="カッ!" at={700} className="sp-war__ka" color="#fff" />
            <Sfx text="ザッ" at={2100} className="sp-war__za" color="#ffd0b8" />
          </Panel>
        </Stage>
        <Splash className="sp-war__splash" />
        <div className="sp-war__seal">
          <Seal chars="作戦決定" className="sp-war__sealk" />
        </div>
        <Big text="決" back="#9a2c0c" className="sp-war__big" />
        <Burst n={14} seed={17} colors={['#ff6a3d', '#ffe066', '#fff']} spread={[150, 300]} />
        <Caption chip="weekly review · 作戦決定" title={m.theme || 'This week’s plan'} line={m.big.length ? `Big Three: ${m.big.join(' · ')}` : 'Weekly review sealed'} />
        <i className="fx-flash" />
      </div>
    );
  },
};

export const SPECIAL_FX: SpecialFxMap = {
  morning,
  night,
  'new-week': newWeek,
  'new-month': newMonth,
  'new-season': newSeason,
  'new-year': newYear,
  'day-complete': dayComplete,
  storm,
  'close-day': closeDay,
  'war-council': warCouncil,
};
