/**
 * The celebration sequences. Each is plain DOM animated with CSS keyframes (transform and opacity
 * only, see fx.css); 3D comes from perspective on `.fx-at` anchors and preserve-3d chains.
 * Randomness is seeded so a scene draws the same on every render.
 */
import { useMemo } from 'react';
import type { Achievement } from '../../../domain/progress/achievements';
import type { MomentType } from '../../../domain/progress/moments';
import { STAGES } from '../../../domain/progress/engine';
import type { BossDef } from '../../../domain/progress/boss';
import { BossArt } from '../../../features/progress/BossArt';
import { Drone } from '../Drone';
import { Emblem } from '../Emblem';
import type { Celebration } from './celebrate';
import { bossOf, Burst, cap, Caption, Coin, Extruded, Flap, Hanko, Ink, pad2, range, rng, safeSection, Seal, seedOf, shatter, Shards, Streaks, type Css, type Timing, type Told } from './kit';
import { MOMENT_FX } from './scenes/moments';
import { SECTION_FX } from './scenes/sections';
import { MonthlyScene, SecretScene } from './scenes/special';
import type { AnyMomentFx } from './scenes/types';

export { bossOf, type Told } from './kit';

const momentFx = (type: MomentType) => MOMENT_FX[type] as unknown as AnyMomentFx;
const sectionFx = (id: string) => (Object.prototype.hasOwnProperty.call(SECTION_FX, id) ? SECTION_FX[id as keyof typeof SECTION_FX] : undefined);
const isMonthly = (c: Extract<Celebration, { kind: 'quest' }>) => c.period === 'monthly' && !c.sweep;

// ─── what each one says (also the calm card, the dialog name and the announcement) ─────────

export function tell(c: Celebration): Told {
  switch (c.kind) {
    case 'achievement':
      return {
        kicker: `${c.achievement.secret ? 'Secret' : cap(c.achievement.tier)} achievement`,
        title: c.achievement.title,
        line: c.achievement.secret ? `${cap(c.achievement.tier)} · ${c.achievement.desc}` : c.achievement.desc,
        color: `var(--t-${c.achievement.tier})`,
      };
    case 'level':
      return { kicker: 'Level up', title: `Level ${c.to}`, line: `Overall level ${c.from} → ${c.to}`, color: 'var(--acc2)' };
    case 'section-level': {
      const s = safeSection(c.section);
      return { kicker: `${s?.name ?? cap(c.section)} level up`, title: `LV ${pad2(c.to)}`, line: `${s?.full ?? cap(c.section)}: level ${c.from} → ${c.to}`, color: `var(--c-${c.section}, var(--sig))` };
    }
    case 'quest':
      return {
        kicker: c.sweep ? `All ${c.period} quests done` : `${cap(c.period)} quest complete`,
        title: c.sweep ? `${cap(c.period)} sweep` : c.title,
        line: c.xp ? `+${c.xp} XP` : c.sweep ? 'Every quest on the board cleared' : 'Quest cleared',
        color: 'var(--c-quests)',
      };
    case 'boss': {
      const b = bossOf(c);
      return { kicker: 'Weekly boss defeated', title: c.name, line: `${b.title}${c.xp ? ` · +${c.xp} XP` : ''}`, color: b.c2 };
    }
    case 'evolve': {
      const a = STAGES[Math.max(0, Math.min(STAGES.length - 1, c.from))];
      const b = STAGES[Math.max(0, Math.min(STAGES.length - 1, c.to))];
      return { kicker: 'Transformation', title: b.name, line: `${a.name} → ${b.name} · form ${c.to + 1} of ${STAGES.length}${c.level ? ` · level ${c.level}` : ''}`, color: b.c2 };
    }
    case 'moment':
      return momentFx(c.moment.type).tell(c.moment);
  }
}

/** Length of a sequence and the moment of its main impact (camera shake), in ms. */
export function timing(c: Celebration): Timing {
  switch (c.kind) {
    case 'achievement':
      return c.achievement.secret ? { dur: 3000, hit: 1150 } : { dur: c.achievement.tier === 'platinum' ? 2800 : 2650, hit: 950 };
    case 'level':
      return { dur: 2550, hit: 800 };
    case 'section-level':
      return sectionFx(c.section)?.time ?? { dur: 2550, hit: 800 };
    case 'quest':
      return c.sweep ? { dur: 2700, hit: 1250 } : isMonthly(c) ? { dur: 2800, hit: 1700 } : { dur: 2350, hit: 620 };
    case 'boss':
      return { dur: 2800, hit: 1000 };
    case 'evolve':
      return { dur: 2800, hit: 1150 };
    case 'moment':
      return momentFx(c.moment.type).time(c.moment);
  }
}

// ─── achievement: tier tunnel, a thick spinning coin, shockwave, shards ─────────────────────

const TIER_FX = { bronze: { rings: 5, shards: 12 }, silver: { rings: 6, shards: 16 }, gold: { rings: 7, shards: 20 }, platinum: { rings: 7, shards: 22 } } as const;

function AchievementScene({ a }: { a: Achievement }) {
  const fx = TIER_FX[a.tier] ?? TIER_FX.bronze;
  const big = a.tier === 'gold' || a.tier === 'platinum';
  const size = 168;
  const colors = useMemo(() => [`var(--t-${a.tier})`, '#fff', `color-mix(in srgb, var(--t-${a.tier}) 60%, #fff)`], [a.tier]);
  return (
    <div className={`fx-scene fx-ach fx-ach--${a.tier}`} style={{ '--tc': `var(--t-${a.tier})` } as Css}>
      <i className="fx-glow" />
      {a.tier === 'platinum' && (
        <div className="fx-at">
          <i className="fx-rays" />
        </div>
      )}
      <div className="fx-at">
        {range(fx.rings).map((i) => (
          <i key={i} className="fx-ring" style={{ '--d': `${i * 0.15}s` } as Css}>
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <polygon points="27,5 73,5 96,50 73,95 27,95 4,50" />
            </svg>
          </i>
        ))}
      </div>
      <div className="fx-at">
        <i className="fx-shock" />
        <i className="fx-shock fx-shock--floor" />
        {a.tier === 'platinum' && <i className="fx-shock fx-shock--late" />}
      </div>
      <Burst n={fx.shards} seed={seedOf(a.id)} colors={colors} />
      <div className="fx-at">
        <div className="fx-coin-fly" style={{ '--cs': `${size}px` } as Css}>
          <Coin a={a} size={size} />
        </div>
      </div>
      <Seal chars="獲得" className="fx-seal--ach" />
      <Caption chip={`${a.tier} · achievement`} title={a.title} line={a.desc} />
      {big && <i className="fx-flash" />}
    </div>
  );
}

// ─── level: extruded 昇, LEVEL UP, a split-flap number ─────────────────────────────────────

function LevelScene({ from, to }: { from: number; to: number }) {
  return (
    <div className="fx-scene fx-lvl" style={{ '--tc': 'var(--acc2)' } as Css}>
      <i className="fx-glow" />
      <div className="fx-at">
        <i className="fx-speed" />
      </div>
      <Streaks n={14} seed={to} />
      <div className="fx-at fx-at--up">
        <div className="fx-xt-fly">
          <div className="fx-xt-sway">
            <Extruded text="昇" className="fx-lvl__kanji" depth={6} step={5} back="var(--sig)" />
          </div>
        </div>
      </div>
      <Burst n={12} seed={to * 7} colors={['var(--acc2)', 'var(--sig)', '#fff']} spread={[120, 260]} />
      <div className="fx-lvl__word">
        <Extruded text="LEVEL UP" depth={4} step={3} back="var(--sig)" />
      </div>
      <div className="fx-lvl__flapline">
        <span className="fx-lvl__lv">LV</span>
        <Flap from={from} to={to} />
      </div>
      <p className="fx-lvl__sub">Overall level · {from} → {to}</p>
    </div>
  );
}

// ─── section level: the section's kanji on a spinning cube that turns to show LV n ───────

function SectionScene({ section, from, to }: { section: string; from: number; to: number }) {
  const s = safeSection(section);
  const kanji = s?.kanji ?? '技';
  return (
    <div className="fx-scene fx-sec" style={{ '--sc': `var(--c-${section}, var(--sig))`, '--tc': `var(--c-${section}, var(--sig))` } as Css}>
      <i className="fx-glow" />
      <i className="fx-sec__wm" aria-hidden="true">
        {kanji}
      </i>
      <div className="fx-at">
        <i className="fx-sec__shadow" />
        <i className="fx-shock fx-shock--floor" />
      </div>
      <div className="fx-at">
        <div className="fx-cube-fly">
          <div className="fx-cube">
            <span className="fx-cube__f fx-cube__f--front">
              <b className="fx-cube__k">{kanji}</b>
            </span>
            <span className="fx-cube__f fx-cube__f--right">
              <small>LV</small>
              <b>{pad2(to)}</b>
            </span>
            <span className="fx-cube__f fx-cube__f--back">
              <small>{s?.code ?? 'CH'}</small>
            </span>
            <span className="fx-cube__f fx-cube__f--left">
              <small>LV</small>
              <b>{pad2(from)}</b>
            </span>
            <span className="fx-cube__f fx-cube__f--top" />
            <span className="fx-cube__f fx-cube__f--bottom" />
          </div>
        </div>
      </div>
      <Burst n={14} seed={seedOf(section) + to} colors={['var(--sc)', '#fff']} spread={[120, 240]} delay="1.5s" />
      <Caption chip={`${s?.code ?? section} · technique up`} title={s?.full ?? cap(section)} line={<>LV {pad2(from)} → <b>LV {pad2(to)}</b></>} />
    </div>
  );
}

// ─── quest: a 達成 hanko slams onto the quest card; a sweep fans the three cards first ─────

const PERIOD_KANJI = { daily: '日', weekly: '週', monthly: '月' } as const;

function QuestScene({ c }: { c: Extract<Celebration, { kind: 'quest' }> }) {
  const titles = (c.titles?.length ? c.titles : [c.title]).slice(0, 3);
  while (c.sweep && titles.length < 3) titles.push('—');
  const fan = [
    { x: -96, y: 18, rz: -13, ry: 24, z: -40 },
    { x: 0, y: -6, rz: 0, ry: 0, z: 10 },
    { x: 96, y: 18, rz: 13, ry: -24, z: -40 },
  ];
  return (
    <div className={`fx-scene fx-quest${c.sweep ? ' fx-quest--sweep' : ''}`} style={{ '--tc': 'var(--c-quests)' } as Css}>
      <i className="fx-glow" />
      {c.sweep ? (
        <div className="fx-at">
          {titles.map((t, i) => (
            <div key={i} className="fx-fan" style={{ '--d': `${i * 0.13}s`, '--x': `${fan[i].x}px`, '--y': `${fan[i].y}px`, '--rz': `${fan[i].rz}deg`, '--ry': `${fan[i].ry}deg`, '--z': `${fan[i].z}px` } as Css}>
              <div className="fx-qcard fx-qcard--sm">
                <small>
                  {PERIOD_KANJI[c.period]} · {c.period}
                </small>
                <b>{t}</b>
                <i className="fx-qcard__ok" aria-hidden="true">
                  ✓
                </i>
              </div>
            </div>
          ))}
          <span className="fx-imprint fx-imprint--sweep" aria-hidden="true">
            <Seal chars="制覇" />
          </span>
        </div>
      ) : (
        <div className="fx-at">
          <div className="fx-qcard-in">
            <div className="fx-qcard">
              <small>
                {PERIOD_KANJI[c.period]} · {c.period} quest
              </small>
              <b>{c.title}</b>
              {c.xp ? <span className="fx-qcard__xp">+{c.xp} XP</span> : null}
              <i className="fx-splat" aria-hidden="true" />
              <span className="fx-imprint" aria-hidden="true">
                <Seal chars="達成" />
              </span>
            </div>
          </div>
        </div>
      )}
      <Ink seed={seedOf(c.title)} n={c.sweep ? 14 : 12} at={c.sweep ? undefined : [92, 36]} />
      <div className="fx-at">
        <div className="fx-hanko-fly">
          <Hanko chars={c.sweep ? '制覇' : '達成'} />
        </div>
      </div>
      <Caption chip={c.sweep ? `all ${c.period} quests` : `${c.period} quest`} title={c.sweep ? 'Board cleared' : 'Quest complete'} line={c.xp ? `+${c.xp} XP` : undefined} />
    </div>
  );
}

// ─── boss: the battle panel cracks and shatters into 3D triangles; 討伐 ─────────────────────

const PW = 300;
const PH = 360;

function BossPanel({ boss }: { boss: BossDef }) {
  return (
    <div className="fx-bp" style={{ '--bc': boss.c, '--bc2': boss.c2 } as Css}>
      <span className="fx-bp__k">{boss.kanji}</span>
      <div className="fx-bp__art">
        <BossArt boss={boss} />
      </div>
      <span className="fx-bp__name">{boss.name}</span>
    </div>
  );
}

function BossScene({ c }: { c: Extract<Celebration, { kind: 'boss' }> }) {
  const boss = bossOf(c);
  const { tris, cracks } = useMemo(() => shatter(seedOf(boss.id), PW, PH), [boss.id]);
  return (
    <div className="fx-scene fx-boss" style={{ '--tc': boss.c2, '--bc': boss.c, '--bc2': boss.c2 } as Css}>
      <i className="fx-glow" />
      <div className="fx-at">
        <div className="fx-panel" style={{ width: PW, height: PH, margin: `${-PH / 2}px 0 0 ${-PW / 2}px` }}>
          <Shards tris={tris} w={PW} h={PH}>
            <BossPanel boss={boss} />
          </Shards>
          <svg className="fx-cracks" viewBox={`0 0 ${PW} ${PH}`} aria-hidden="true">
            <path d={cracks} />
          </svg>
          <i className="fx-cut fx-cut--1" />
          <i className="fx-cut fx-cut--2" />
        </div>
      </div>
      <Burst n={10} seed={seedOf(boss.name)} colors={[boss.c2, '#fff']} spread={[160, 300]} />
      <div className="fx-at">
        <div className="fx-boss__down">
          <BossArt boss={boss} down />
        </div>
      </div>
      <Seal chars="討伐" className="fx-seal--boss" />
      <Caption chip="weekly boss · defeated" title={c.name} line={`${boss.title}${c.xp ? ` · +${c.xp} XP` : ''}`} />
      <i className="fx-flash" />
    </div>
  );
}

// ─── evolve: the drone inside a turning orbit of rings, a light pillar, the new form ───────

function EvolveScene({ c }: { c: Extract<Celebration, { kind: 'evolve' }> }) {
  const from = Math.max(0, Math.min(STAGES.length - 1, c.from));
  const to = Math.max(0, Math.min(STAGES.length - 1, c.to));
  const st = STAGES[to];
  const rings = [
    { tx: 74, ty: 0, size: 250, dur: 1.6 },
    { tx: 66, ty: 58, size: 290, dur: 2.1 },
    { tx: 70, ty: -56, size: 330, dur: 2.6 },
  ];
  const motes = useMemo(() => {
    const r = rng(to * 31 + 7);
    return range(10).map(() => ({ '--x': `${Math.round((r() - 0.5) * 260)}px`, '--d': `${Math.round(r() * 1400)}ms`, '--s': `${4 + r() * 6}px` }) as Css);
  }, [to]);
  return (
    <div className="fx-scene fx-evo" style={{ '--tc': st.c2, '--ec': st.c, '--ec2': st.c2 } as Css}>
      <i className="fx-glow" />
      <i className="fx-evo__pillar" />
      <span className="fx-evo__kanji" aria-hidden="true">
        進化
      </span>
      <div className="fx-at">
        <div className="fx-orbit">
          {rings.map((g, i) => (
            <span key={i} className="fx-orbit__tilt" style={{ transform: `rotateY(${g.ty}deg) rotateX(${g.tx}deg)` }}>
              <i className="fx-orbit__ring" style={{ '--s': `${g.size}px`, '--dur': `${g.dur}s` } as Css}>
                <b />
              </i>
            </span>
          ))}
          <div className="fx-orbit__bb">
            <div className="fx-evo__old">
              <Drone stage={from} still label={false} />
            </div>
            <div className="fx-evo__new">
              <Drone stage={to} still happy label={false} />
            </div>
          </div>
        </div>
      </div>
      <div className="fx-at">
        {motes.map((m, i) => (
          <i key={i} className="fx-mote" style={m} />
        ))}
      </div>
      <Burst n={12} seed={to * 13} colors={[st.c, st.c2, '#fff']} spread={[150, 300]} />
      <Caption chip={`form ${to + 1} of ${STAGES.length} · transformation`} title={`${STAGES[from].name} → ${st.name}`} line={c.level ? `Level ${c.level}` : undefined} />
      <i className="fx-flash" />
    </div>
  );
}

// ─── dispatch ───────────────────────────────────────────────────────────────

export function Scene({ c }: { c: Celebration }) {
  switch (c.kind) {
    case 'achievement':
      return c.achievement.secret ? <SecretScene a={c.achievement} /> : <AchievementScene a={c.achievement} />;
    case 'level':
      return <LevelScene from={c.from} to={c.to} />;
    case 'section-level': {
      const fx = sectionFx(c.section);
      return fx ? <fx.Scene from={c.from} to={c.to} /> : <SectionScene section={c.section} from={c.from} to={c.to} />;
    }
    case 'quest':
      return isMonthly(c) ? <MonthlyScene c={c} /> : <QuestScene c={c} />;
    case 'boss':
      return <BossScene c={c} />;
    case 'evolve':
      return <EvolveScene c={c} />;
    case 'moment': {
      const fx = momentFx(c.moment.type);
      return <fx.Scene m={c.moment} />;
    }
  }
}

function calmArt(c: Celebration) {
  switch (c.kind) {
    case 'achievement':
      return <Emblem a={c.achievement} size={96} />;
    case 'evolve':
      return (
        <div style={{ width: 110 }} className="i-drone">
          <Drone stage={c.to} still happy label={false} />
        </div>
      );
    case 'boss':
      return (
        <div style={{ width: 110 }}>
          <BossArt boss={bossOf(c)} down />
        </div>
      );
    case 'section-level':
      return sectionFx(c.section)?.calm ?? <span className="fx-calm__k">{safeSection(c.section)?.kanji ?? '技'}</span>;
    case 'quest':
      return <Seal chars={c.sweep ? '制覇' : isMonthly(c) ? '月達' : '達成'} className="fx-seal--calm" />;
    case 'level':
      return <span className="fx-calm__k">昇</span>;
    case 'moment':
      return momentFx(c.moment.type).calm(c.moment);
  }
}

/** Reduced motion or the calm setting: one card with the same information, cross-faded. */
export function CalmCard({ c }: { c: Celebration }) {
  const t = tell(c);
  return (
    <div className="fx-calm" style={{ '--tc': t.color } as Css}>
      <div className="fx-calm__art">{calmArt(c)}</div>
      <span className="fx-chip">{t.kicker}</span>
      <h2 className="fx-title">{t.title}</h2>
      <p className="fx-line">{t.line}</p>
    </div>
  );
}
