/**
 * Days: a streak milestone, the day's chapter, a combo of sections, a rest day, a comeback, a good
 * night, a calm screen day, every task cleared and a focus session.
 */
import { useMemo, type ReactNode } from 'react';
import { Burst, Caption, Embers, Extruded, Flap, Ink, plural, range, rng, Ripples, Roller, safeSection, Seal, Stamp, Twinkles, type Css } from '../kit';
import type { MomentFx, MomentFxMap } from './types';
import './days.css';

const kanji = (ch: string) => <span className="fx-calm__k">{ch}</span>;
const hm = (min: number) => {
  const m = Math.max(0, Math.round(min));
  return m >= 60 ? `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m` : `${m} min`;
};

// ─── 20 streak: a flame pillar 炎, the day count flips, embers ─────────────

const streak: MomentFx<'streak'> = {
  tell: (m) => ({ kicker: 'Streak milestone', title: `${plural(m.days, 'day')} in a row`, line: 'Something logged every day', color: '#ff7a2f' }),
  time: () => ({ dur: 2650, hit: 760 }),
  calm: () => kanji('炎'),
  Scene: ({ m }) => (
    <div className="fx-scene fx-fl" style={{ '--tc': '#ff7a2f' } as Css}>
      <i className="fx-bg fx-fl__bg" />
      <i className="fx-fl__pillar" />
      <div className="fx-fl__tongues">
        {range(5).map((i) => (
          <i key={i} className="fx-fl__t" style={{ '--i': i, '--d': `${380 + i * 50}ms`, '--p': `${0.32 + (i % 3) * 0.07}s` } as Css} />
        ))}
      </div>
      <Embers n={16} seed={m.days} colors={['#ffd166', '#ff7a2f', '#fff3c4']} spread={220} rise={520} delay={600} className="fx-fl__embers" />
      <div className="fx-fl__kanji">
        <Extruded text="炎" depth={6} step={5} back="#b3261e" />
      </div>
      <div className="fx-fl__count">
        <Flap from={Math.max(0, m.days - 1)} to={m.days} delay={1250} />
        <span>{m.days === 1 ? 'day' : 'days'} in a row</span>
      </div>
      <Caption chip="streak · 炎" title={`${plural(m.days, 'day')} in a row`} line="Something logged every day" />
    </div>
  ),
};

// ─── 21 chapter: the title page turns in 3D, 第N話 (≤ 1.8 s) ───────────────

function ChapterCover() {
  return (
    <div className="fx-chp__cover">
      <span className="fx-chp__mag">週刊</span>
      <span className="fx-chp__logo">LIFE TRACKER</span>
      <i className="fx-chp__burst" />
    </div>
  );
}

const STRIP = 60;

const chapter: MomentFx<'chapter'> = {
  tell: (m) => ({ kicker: 'A new chapter', title: `Chapter ${m.n}`, line: `第${m.n}話 · the first log today`, color: '#f2f2f2' }),
  time: () => ({ dur: 1800, hit: 880, shake: 'soft' }),
  calm: (m) => <span className="fx-calm__k fx-calm__k--sm">第{m.n}話</span>,
  Scene: ({ m }) => {
    const date = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    // the turning page in three hinged strips, each a window over the same cover: a cheap curl
    const strips = range(3).reduceRight<ReactNode>(
      (inner, i) => (
        <div className={`fx-chp__strip fx-chp__strip--${i}`} style={{ left: i === 0 ? 0 : STRIP, width: STRIP }}>
          <div className="fx-chp__sf">
            <div style={{ position: 'absolute', left: -i * STRIP, top: 0, width: STRIP * 3, height: '100%' }}>
              <ChapterCover />
            </div>
          </div>
          <div className="fx-chp__sb" />
          {inner}
        </div>
      ),
      null,
    );
    return (
      <div className="fx-scene fx-chp" style={{ '--tc': '#f2f2f2' } as Css}>
        <i className="fx-bg fx-chp__bg" />
        <i className="fx-glow" />
        <div className="fx-at fx-chp__at">
          <div className="fx-chp__book">
            <div className="fx-chp__title">
              <i className="fx-chp__lines" />
              <span className="fx-chp__date">{date}</span>
              <b className="fx-chp__n">
                <span>第</span>
                <span className="fx-chp__num">{m.n}</span>
                <span>話</span>
              </b>
              <span className="fx-chp__sub">chapter {m.n}</span>
            </div>
            {strips}
          </div>
        </div>
        <Caption chip="new chapter" title={`第${m.n}話`} line="The first log today opens a new chapter" />
      </div>
    );
  },
};

// ─── 22 combo: HIT COMBO, a kanji chip per section, a jolt per hit ─────────

function comboTimes(n: number) {
  const shown = Math.min(n, 6);
  const step = shown <= 4 ? 280 : 210;
  const hits = range(shown).map((i) => 360 + i * step);
  const fin = hits[hits.length - 1] + 300;
  return { shown, hits, fin, dur: Math.min(2950, fin + 1300) };
}

const combo: MomentFx<'combo'> = {
  tell: (m) => ({ kicker: `${m.sections.length} hit combo`, title: `${m.sections.length} sections today`, line: m.sections.map((s) => safeSection(s)?.name ?? s).join(' · '), color: '#ffe14d' }),
  time: (m) => {
    const t = comboTimes(m.sections.length);
    return { dur: t.dur, hit: t.fin };
  },
  calm: (m) => <span className="fx-calm__k fx-calm__k--sm">{m.sections.length} HIT</span>,
  Scene: ({ m }) => {
    const { shown, hits, fin } = comboTimes(m.sections.length);
    const secs = m.sections.slice(0, shown);
    // one jolt per hit and the counter's steps, as keyframes made for this scene's times
    const total = fin + 500;
    const css = useMemo(() => {
      const pc = (t: number) => `${Math.max(0, Math.min(100, (t / total) * 100)).toFixed(2)}%`;
      const jolt = hits.flatMap((t, i) => {
        const x = (i % 2 ? 1 : -1) * (7 + i * 1.5);
        return [`${pc(t - 1)}{transform:none}`, `${pc(t + 40)}{transform:translate3d(${x}px,5px,0) rotate(${x / 14}deg)}`, `${pc(t + 100)}{transform:translate3d(${-x / 2}px,-3px,0)}`, `${pc(t + 170)}{transform:none}`];
      });
      const count = hits.flatMap((t, i) => [`${pc(t - 1)}{transform:translateY(${-(Math.max(0, i - 1)) * 1.1}em)}`, `${pc(t)}{transform:translateY(${-i * 1.1}em)}`]);
      return `@keyframes fx-cb2-jolt-${shown}{0%{transform:none}${jolt.join('')}100%{transform:none}}@keyframes fx-cb2-count-${shown}{0%{transform:none}${count.join('')}100%{transform:translateY(${-(shown - 1) * 1.1}em)}}`;
    }, [hits, shown, total]);
    return (
      <div className="fx-scene fx-cb2" style={{ '--tc': '#ffe14d', '--total': `${total}ms` } as Css}>
        <style>{css}</style>
        <i className="fx-bg fx-cb2__bg" />
        <div className="fx-at">
          <i className="fx-speed fx-cb2__speed" />
        </div>
        <div className="fx-cb2__jolt" style={{ animationName: `fx-cb2-jolt-${shown}` }}>
          <div className="fx-cb2__counter">
            <span className="fx-cb2__win">
              <span className="fx-cb2__strip" style={{ animationName: `fx-cb2-count-${shown}` }}>
                {secs.map((_, i) => (
                  <b key={i} style={{ '--a': `${hits[i]}ms` } as Css}>
                    {i + 1}
                  </b>
                ))}
              </span>
            </span>
            <span className="fx-cb2__hit">
              HIT
              <small>combo</small>
            </span>
          </div>
          <div className="fx-cb2__chips">
            {secs.map((s, i) => (
              <span key={s} className="fx-cb2__chip" style={{ '--d': `${hits[i] - 150}ms`, '--sx': `${i % 2 ? 300 : -300}px`, '--cc': `var(--c-${s}, var(--sig))` } as Css}>
                <b>{safeSection(s)?.kanji ?? '技'}</b>
                <small>{safeSection(s)?.name ?? s}</small>
              </span>
            ))}
          </div>
          <div className="fx-cb2__word">
            <Extruded text="COMBO!!" depth={4} step={3} back="#b3261e" />
          </div>
        </div>
        <Burst n={14} seed={shown * 7} colors={['#ffe14d', '#fff', '#ff4d4d']} spread={[150, 300]} />
        <Caption chip={`${m.sections.length} hit combo`} title={`${m.sections.length} sections today`} line={m.sections.map((s) => safeSection(s)?.name ?? s).join(' · ')} />
      </div>
    );
  },
};

// ─── 23 rest: a calm night lake, the moon's reflection, 守 holds the streak ─

const rest: MomentFx<'rest'> = {
  tell: (m) => ({ kicker: 'Rest day', title: 'Streak kept', line: `${plural(m.streak, 'day')} held · rest is training too`, color: '#9db8ff' }),
  time: () => ({ dur: 2600, hit: 1100, shake: 'none' }),
  calm: () => kanji('守'),
  Scene: ({ m }) => (
    <div className="fx-scene fx-rs" style={{ '--tc': '#9db8ff' } as Css}>
      <i className="fx-bg fx-rs__sky" />
      <Twinkles n={6} seed={m.streak + 3} top={36} />
      <i className="fx-rs__moon" />
      <i className="fx-rs__lake" />
      <div className="fx-rs__refl">
        {range(5).map((i) => (
          <i key={i} style={{ '--i': i, '--d': `${i * 140}ms` } as Css} />
        ))}
      </div>
      <Ripples n={3} delay={500} gap={420} tilt={78} className="fx-rs__rip" />
      <div className="fx-rs__shield">
        <svg viewBox="0 0 120 140" aria-hidden="true">
          <path d="M60 6L110 24V66C110 100 88 124 60 134C32 124 10 100 10 66V24Z" fill="#1c2550" stroke="#9db8ff" strokeWidth="4" />
          <path d="M60 18L98 32V66C98 93 81 112 60 121C39 112 22 93 22 66V32Z" fill="none" stroke="#9db8ff" strokeOpacity=".35" strokeWidth="2" />
        </svg>
        <b>守</b>
        <span>
          {m.streak}
          <small>{m.streak === 1 ? 'day' : 'days'}</small>
        </span>
      </div>
      <Caption chip="rest day · 守" title="Streak kept" line={`${plural(m.streak, 'day')} held. Rest is part of training.`} />
    </div>
  ),
};

// ─── 24 comeback: 復活, a phoenix rises from the embers ─────────────────────

const comeback: MomentFx<'comeback'> = {
  tell: (m) => ({ kicker: 'Comeback', title: 'Back in action', line: `Back after ${plural(m.gap, 'day')}`, color: '#ff9e3d' }),
  time: () => ({ dur: 2750, hit: 1150 }),
  calm: () => kanji('復'),
  Scene: ({ m }) => (
    <div className="fx-scene fx-ph" style={{ '--tc': '#ff9e3d' } as Css}>
      <i className="fx-bg fx-ph__bg" />
      <i className="fx-ph__pyre" />
      <Embers n={18} seed={m.gap * 5 + 1} colors={['#ffd166', '#ff6b2c', '#fff3c4']} spread={300} rise={560} delay={100} className="fx-ph__embers" />
      <div className="fx-at fx-ph__at">
        <div className="fx-ph__rise">
          <svg className="fx-ph__wing fx-ph__wing--l" viewBox="0 0 160 120" aria-hidden="true">
            <path d="M156 70C120 40 80 6 6 2C30 20 40 30 44 40C24 38 14 42 4 50C30 54 44 60 52 70C34 72 24 78 16 90C48 86 70 88 96 96C120 100 140 92 156 70Z" fill="url(#fxph-w)" stroke="#7a1d05" strokeWidth="2" strokeLinejoin="round" />
            <defs>
              <linearGradient id="fxph-w" x1="1" y1="1" x2="0" y2="0">
                <stop offset="0" stopColor="#fff3c4" />
                <stop offset=".35" stopColor="#ffb02e" />
                <stop offset="1" stopColor="#e2401c" />
              </linearGradient>
            </defs>
          </svg>
          <svg className="fx-ph__wing fx-ph__wing--r" viewBox="0 0 160 120" aria-hidden="true">
            <path transform="translate(160 0) scale(-1 1)" d="M156 70C120 40 80 6 6 2C30 20 40 30 44 40C24 38 14 42 4 50C30 54 44 60 52 70C34 72 24 78 16 90C48 86 70 88 96 96C120 100 140 92 156 70Z" fill="url(#fxph-w)" stroke="#7a1d05" strokeWidth="2" strokeLinejoin="round" />
          </svg>
          <svg className="fx-ph__body" viewBox="0 0 60 150" aria-hidden="true">
            <path d="M30 4C40 4 44 14 40 22L50 30L38 30C46 50 44 80 36 100L48 146L30 120L12 146L24 100C16 80 14 50 22 30L10 30L20 22C16 14 20 4 30 4Z" fill="#ffd166" stroke="#7a1d05" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="33" cy="14" r="2.4" fill="#7a1d05" />
          </svg>
        </div>
      </div>
      <i className="fx-flash fx-ph__flash" />
      <div className="fx-ph__kanji">
        <Extruded text="復活" depth={5} step={4} back="#b3261e" />
      </div>
      <Caption chip="comeback · 復活" title="Back in action" line={`Back after ${plural(m.gap, 'day')}. The streak starts again today.`} />
    </div>
  ),
};

// ─── 25 good-night: a crescent moon mobile swings in, 快眠 ──────────────────

const goodNight: MomentFx<'good-night'> = {
  tell: (m) => ({ kicker: 'Good night', title: `In bed by ${m.bed}`, line: `${plural(m.streak, 'night')} on time`, color: '#c9b6ff' }),
  time: () => ({ dur: 2650, hit: 1050, shake: 'soft' }),
  calm: () => kanji('眠'),
  Scene: ({ m }) => (
    <div className="fx-scene fx-gn" style={{ '--tc': '#c9b6ff' } as Css}>
      <i className="fx-bg fx-gn__sky" />
      <Twinkles n={9} seed={m.streak * 11 + 2} top={70} />
      <div className="fx-gn__mobile">
        <i className="fx-gn__string" />
        <div className="fx-gn__moon">
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <path d="M84 12A52 52 0 1 0 108 86A44 44 0 1 1 84 12Z" fill="#ffe7a8" stroke="#c9a85e" strokeWidth="2" />
            <path d="M44 66q4 4 8 0M30 52q4 4 8 0" fill="none" stroke="#8a6a2a" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
          <span className="fx-gn__z">z</span>
          <span className="fx-gn__z fx-gn__z--2">z</span>
        </div>
      </div>
      <div className="fx-gn__mobile fx-gn__mobile--a">
        <i className="fx-gn__string" />
        <i className="fx-gn__star" />
      </div>
      <div className="fx-gn__mobile fx-gn__mobile--b">
        <i className="fx-gn__string" />
        <i className="fx-gn__star" />
      </div>
      <div className="fx-gn__words">
        <b>快眠</b>
        <span className="fx-gn__bed">
          <small>in bed</small>
          {m.bed}
        </span>
        <span className="fx-gn__run">{plural(m.streak, 'night')} on time</span>
      </div>
      <Caption chip="good night · 快眠" title={`In bed by ${m.bed}`} line={`${plural(m.streak, 'night')} on time in a row`} />
    </div>
  ),
};

// ─── 26 screen-zen: a phone sinks into raked sand ───────────────────────────

const screenZen: MomentFx<'screen-zen'> = {
  tell: (m) => ({ kicker: 'Calm screen day', title: hm(m.minutes), line: `${hm(Math.max(0, m.target - m.minutes))} under your ${hm(m.target)} target`, color: '#8fc1a3' }),
  time: () => ({ dur: 2700, hit: 1300, shake: 'soft' }),
  calm: () => kanji('静'),
  Scene: ({ m }) => {
    const under = Math.max(0, Math.round(m.target - m.minutes));
    return (
      <div className="fx-scene fx-sz" style={{ '--tc': '#3d5a45' } as Css}>
        <i className="fx-bg fx-sz__paper" />
        <div className="fx-sz__num">
          <small>under target</small>
          <b>
            −<Roller value={String(under)} delay={900} step={80} />
            <em>min</em>
          </b>
          <span>
            {hm(m.minutes)} · target {hm(m.target)}
          </span>
        </div>
        <div className="fx-at fx-sz__at">
          <div className="fx-sz__plane">
            <i className="fx-sz__sand" />
            <Ripples n={4} delay={1150} gap={180} tilt={0} className="fx-sz__rip" />
          </div>
        </div>
        <div className="fx-sz__well">
          <div className="fx-sz__phone">
            <i className="fx-sz__screen" />
            <i className="fx-sz__notch" />
          </div>
        </div>
        <i className="fx-sz__lip" />
        <Caption className="fx-cap--ink" chip="screen time · 静" title={`${hm(m.minutes)} today`} line={`${hm(under)} under your ${hm(m.target)} target`} />
      </div>
    );
  },
};

// ─── 27 tasks-clear: cards fly off the desk, 完 ─────────────────────────────

const tasksClear: MomentFx<'tasks-clear'> = {
  tell: (m) => ({ kicker: 'All tasks done', title: `${plural(m.count, 'task')} cleared`, line: 'Nothing left due today', color: '#5ad1ff' }),
  time: () => ({ dur: 2700, hit: 1500 }),
  calm: () => kanji('完'),
  Scene: ({ m }) => {
    const n = Math.max(1, Math.min(5, m.count));
    const cards = useMemo(() => {
      const r = rng(m.count * 13 + 7);
      return range(n).map(
        (i) =>
          ({
            '--d': `${360 + (n - 1 - i) * 190}ms`,
            '--z0': `${i * 3}px`,
            '--rz0': `${Math.round((r() - 0.5) * 14)}deg`,
            '--tx': `${Math.round((i % 2 ? 1 : -1) * (180 + r() * 160))}px`,
            '--ty': `${Math.round(-260 - r() * 200)}px`,
            '--tz': `${Math.round(200 + r() * 300)}px`,
            '--rr': `${Math.round((i % 2 ? 1 : -1) * (200 + r() * 260))}deg`,
          }) as Css,
      );
    }, [m.count, n]);
    return (
      <div className="fx-scene fx-tc" style={{ '--tc': '#5ad1ff' } as Css}>
        <i className="fx-bg fx-dimbg" />
        <i className="fx-glow" />
        <div className="fx-at fx-tc__at">
          <div className="fx-tc__desk">
            <i className="fx-tc__wood" />
            {cards.map((st, i) => (
              <div key={i} className="fx-tc__card" style={st}>
                <i className="fx-tc__box">✓</i>
                <span />
                <span className="fx-tc__short" />
              </div>
            ))}
            <span className="fx-tc__imprint">
              <Seal chars="完" />
            </span>
          </div>
        </div>
        <Ink seed={m.count} n={10} at={[0, 36]} />
        <Stamp className="fx-tc__count" delay={250}>
          <b>{m.count}</b>
          <small>{m.count === 1 ? 'task' : 'tasks'} · all clear</small>
        </Stamp>
        <Caption chip="tasks · all clear" title={`${plural(m.count, 'task')} done`} line="Nothing left due today" />
      </div>
    );
  },
};

// ─── 28 focus: the hourglass flips, sand pours, 集中 ────────────────────────

const focus: MomentFx<'focus'> = {
  tell: (m) => ({ kicker: 'Focus session', title: `${hm(m.minutes)} focused`, line: safeSection(m.section)?.full ?? m.section, color: `var(--c-${m.section}, #ffd166)` }),
  time: () => ({ dur: 2700, hit: 820 }),
  calm: () => kanji('集'),
  Scene: ({ m }) => {
    const s = safeSection(m.section);
    return (
      <div className="fx-scene fx-hg" style={{ '--tc': `var(--c-${m.section}, #ffd166)` } as Css}>
        <i className="fx-bg fx-dimbg" />
        <i className="fx-glow" />
        <span className="fx-hg__v" aria-hidden="true">
          集中
        </span>
        <div className="fx-at fx-hg__at">
          <div className="fx-hg__flip">
            <i className="fx-hg__cap" />
            <i className="fx-hg__cap fx-hg__cap--b" />
            <i className="fx-hg__post" />
            <i className="fx-hg__post fx-hg__post--r" />
            <div className="fx-hg__glass">
              <svg viewBox="0 0 100 160" preserveAspectRatio="none" aria-hidden="true">
                <path d="M14 4H86C86 48 58 64 54 80C58 96 86 112 86 156H14C14 112 42 96 46 80C42 64 14 48 14 4Z" fill="rgb(200 230 255 / .16)" stroke="rgb(220 240 255 / .8)" strokeWidth="2.5" />
              </svg>
              <i className="fx-hg__top" />
              <i className="fx-hg__stream" />
              <i className="fx-hg__pile" />
            </div>
          </div>
        </div>
        <div className="fx-hg__min">
          <b>{m.minutes}</b>
          <small>min</small>
          <span className="fx-hg__chip">
            <i>{s?.kanji ?? '技'}</i>
            {s?.name ?? m.section}
          </span>
        </div>
        <Caption chip="focus · 集中" title={`${hm(m.minutes)} of focus`} line={s?.full ?? m.section} />
      </div>
    );
  },
};

export const DAY_FX: Pick<MomentFxMap, 'streak' | 'chapter' | 'combo' | 'rest' | 'comeback' | 'good-night' | 'screen-zen' | 'tasks-clear' | 'focus'> = {
  streak,
  chapter,
  combo,
  rest,
  comeback,
  'good-night': goodNight,
  'screen-zen': screenZen,
  'tasks-clear': tasksClear,
  focus,
};

