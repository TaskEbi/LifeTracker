/**
 * The celebration sequences. Each is plain DOM animated with CSS keyframes (transform and opacity
 * only, see fx.css); 3D comes from perspective on `.fx-at` anchors and preserve-3d chains.
 * Randomness is seeded so a scene draws the same on every render.
 */
import { useMemo, type CSSProperties, type ReactNode } from 'react';
import type { Achievement } from '../../../domain/progress/achievements';
import { BOSSES, type BossDef } from '../../../domain/progress/boss';
import { STAGES } from '../../../domain/progress/engine';
import { sectionInfo } from '../../../domain/sections';
import type { SectionId } from '../../../data/types';
import { BossArt } from '../../../features/progress/BossArt';
import { Drone } from '../Drone';
import { Emblem } from '../Emblem';
import type { Celebration } from './celebrate';

type Css = CSSProperties & Record<`--${string}`, string | number>;
const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const pad2 = (n: number) => String(n).padStart(2, '0');
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9) >>> 0;
    return s / 4294967296;
  };
}
const seedOf = (t: string) => [...t].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619), 2166136261);

export const bossOf = (c: { name: string; bossId?: string }): BossDef => BOSSES.find((b) => b.id === c.bossId) ?? BOSSES.find((b) => b.name === c.name) ?? BOSSES[0];
const safeSection = (id: string) => {
  try {
    return sectionInfo(id as SectionId) ?? null;
  } catch {
    return null;
  }
};

// ─── what each one says (also the calm card, the dialog name and the announcement) ─────────

export interface Told {
  kicker: string;
  title: string;
  line: string;
  /** CSS colour for the scene. */
  color: string;
}

export function tell(c: Celebration): Told {
  switch (c.kind) {
    case 'achievement':
      return { kicker: `${cap(c.achievement.tier)} achievement`, title: c.achievement.title, line: c.achievement.desc, color: `var(--t-${c.achievement.tier})` };
    case 'level':
      return { kicker: 'Level up', title: `Level ${c.to}`, line: `Overall level ${c.from} → ${c.to}`, color: 'var(--acc2)' };
    case 'section-level': {
      const s = safeSection(c.section);
      return { kicker: `${s?.name ?? c.section} level up`, title: `LV ${pad2(c.to)}`, line: `${s?.full ?? c.section}: level ${c.from} → ${c.to}`, color: `var(--c-${c.section})` };
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
  }
}

/** Length of a sequence and the moment of its main impact (camera shake), in ms. */
export function timing(c: Celebration): { dur: number; hit: number } {
  switch (c.kind) {
    case 'achievement':
      return { dur: c.achievement.tier === 'platinum' ? 2800 : 2650, hit: 950 };
    case 'level':
      return { dur: 2550, hit: 800 };
    case 'section-level':
      return { dur: 2550, hit: 800 };
    case 'quest':
      return c.sweep ? { dur: 2700, hit: 1250 } : { dur: 2350, hit: 620 };
    case 'boss':
      return { dur: 2800, hit: 1000 };
    case 'evolve':
      return { dur: 2800, hit: 1150 };
  }
}

// ─── pieces ─────────────────────────────────────────────────────────────────

/** Sparks and streaks bursting from the centre at the impact. */
function Burst({ n, seed, spread = [150, 320], colors, delay }: { n: number; seed: number; spread?: [number, number]; colors: string[]; delay?: string }) {
  const parts = useMemo(() => {
    const r = rng(seed);
    return range(n).map((i) => {
      const streak = i % 3 === 0;
      const size = 7 + r() * 9;
      return {
        streak,
        style: {
          '--a': `${(i / n) * 360 + r() * 18}deg`,
          '--dist': `${spread[0] + r() * (spread[1] - spread[0])}px`,
          '--z': `${Math.round(-260 + r() * 640)}px`,
          '--r': `${Math.round(240 + r() * 540)}deg`,
          '--d': `${Math.round(r() * 70)}ms`,
          '--w': `${streak ? 34 + r() * 30 : size}px`,
          '--h': `${streak ? 3 : size}px`,
          '--sc': colors[i % colors.length],
        } as Css,
      };
    });
  }, [n, seed, spread, colors]);
  return (
    <div className="fx-at" style={delay ? ({ '--burst-delay': delay } as Css) : undefined}>
      {parts.map((p, i) => (
        <i key={i} className={`fx-shard${p.streak ? ' fx-shard--streak' : ''}`} style={p.style} />
      ))}
    </div>
  );
}

/** Text drawn as a few stacked layers in depth: an extruded 3D word. */
function Extruded({ text, depth = 5, step = 4, className = '', back }: { text: string; depth?: number; step?: number; className?: string; back: string }) {
  return (
    <span className={`fx-xt ${className}`}>
      {range(depth).map((i) => (
        <span
          key={i}
          className="fx-xt__l"
          aria-hidden={i > 0 || undefined}
          style={i === 0 ? undefined : ({ transform: `translateZ(${-i * step}px)`, color: `color-mix(in srgb, ${back} ${100 - i * 13}%, #000)` } as Css)}
        >
          {text}
        </span>
      ))}
    </span>
  );
}

function Caption({ chip, title, line }: { chip: string; title: string; line?: ReactNode }) {
  return (
    <div className="fx-cap">
      <span className="fx-chip">{chip}</span>
      <h2 className="fx-title">{title}</h2>
      {line && <p className="fx-line">{line}</p>}
    </div>
  );
}

function Seal({ chars, className = '' }: { chars: string; className?: string }) {
  return (
    <span className={`fx-seal ${className}`}>
      {[...chars].map((ch, i) => (
        <span key={i}>{ch}</span>
      ))}
    </span>
  );
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
          <div className="fx-coin">
            {/* thickness: flat outline layers stepping back, then the back face */}
            <div className="fx-coin__l fx-coin__back">
              <Emblem a={a} size={size} silhouette={`color-mix(in srgb, var(--t-${a.tier}) 70%, #000)`} />
            </div>
            {[-7.5, -6, -4.5, -3, -1.5].map((z, i) => (
              <div key={z} className="fx-coin__l" style={{ transform: `translateZ(${z}px)` }}>
                <Emblem a={a} size={size} silhouette={`color-mix(in srgb, var(--t-${a.tier}) ${38 + i * 6}%, #000)`} />
              </div>
            ))}
            <div className="fx-coin__l fx-coin__face">
              <Emblem a={a} size={size} ribbon={false} />
              <i className="fx-coin__gloss">
                <i className="fx-coin__shine" />
              </i>
            </div>
          </div>
        </div>
      </div>
      <Seal chars="獲得" className="fx-seal--ach" />
      <Caption chip={`${a.tier} · achievement`} title={a.title} line={a.desc} />
      {big && <i className="fx-flash" />}
    </div>
  );
}

// ─── level: extruded 昇, LEVEL UP, a split-flap number ─────────────────────────────────────

function Flap({ from, to }: { from: number; to: number }) {
  const w = Math.max(String(from).length, String(to).length);
  return (
    <span className="fx-flap" style={{ '--fw': `${w * 0.78 + 0.42}em` } as Css} aria-label={`Level ${to}`}>
      <span className="fx-flap__h fx-flap__h--top" aria-hidden="true">
        <span>{to}</span>
      </span>
      <span className="fx-flap__h fx-flap__h--bot" aria-hidden="true">
        <span>{from}</span>
      </span>
      <span className="fx-flap__h fx-flap__h--top fx-flap__f1" aria-hidden="true">
        <span>{from}</span>
      </span>
      <span className="fx-flap__h fx-flap__h--bot fx-flap__f2" aria-hidden="true">
        <span>{to}</span>
      </span>
    </span>
  );
}

function Streaks({ n, seed }: { n: number; seed: number }) {
  const parts = useMemo(() => {
    const r = rng(seed);
    return range(n).map((i) => ({ '--a': `${(i / n) * 360 + r() * 12}deg`, '--d': `${Math.round(r() * 600)}ms`, '--w': `${70 + r() * 90}px` }) as Css);
  }, [n, seed]);
  return (
    <div className="fx-at">
      {parts.map((s, i) => (
        <i key={i} className="fx-streak" style={s} />
      ))}
    </div>
  );
}

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
      <Caption chip={`${s?.code ?? ''} · technique up`} title={s?.full ?? section} line={<>LV {pad2(from)} → <b>LV {pad2(to)}</b></>} />
    </div>
  );
}

// ─── quest: a 達成 hanko slams onto the quest card; a sweep fans the three cards first ─────

function Hanko({ chars }: { chars: string }) {
  return (
    <div className="fx-hanko">
      <span className="fx-hanko__f fx-hanko__top">
        <Seal chars={chars} className="fx-seal--top" />
      </span>
      <span className="fx-hanko__f fx-hanko__s1" />
      <span className="fx-hanko__f fx-hanko__s2" />
      <span className="fx-hanko__f fx-hanko__s3" />
      <span className="fx-hanko__f fx-hanko__s4" />
    </div>
  );
}

function Ink({ seed, n = 12, at }: { seed: number; n?: number; at?: [number, number] }) {
  const drops = useMemo(() => {
    const r = rng(seed);
    return range(n).map((i) => {
      const size = 6 + r() * 16;
      return { '--a': `${(i / n) * 360 + r() * 25}deg`, '--dist': `${80 + r() * 150}px`, '--s': `${size}px`, '--d': `${Math.round(r() * 60)}ms` } as Css;
    });
  }, [seed, n]);
  return (
    <div className="fx-at" style={at ? { marginLeft: at[0], marginTop: at[1] } : undefined}>
      {drops.map((d, i) => (
        <i key={i} className="fx-ink" style={d} />
      ))}
    </div>
  );
}

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

interface Tri {
  x0: number;
  y0: number;
  w: number;
  h: number;
  clip: string;
  style: Css;
}

function shatter(seed: number): { tris: Tri[]; cracks: string } {
  const r = rng(seed);
  const cols = 3;
  const rows = 3;
  const pt: [number, number][][] = range(rows + 1).map((j) =>
    range(cols + 1).map((i) => {
      const edgeX = i === 0 || i === cols;
      const edgeY = j === 0 || j === rows;
      return [(i / cols) * PW + (edgeX ? 0 : (r() - 0.5) * 60), (j / rows) * PH + (edgeY ? 0 : (r() - 0.5) * 70)];
    }),
  );
  const tris: [number, number][][] = [];
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const a = pt[j][i];
      const b = pt[j][i + 1];
      const c = pt[j + 1][i + 1];
      const d = pt[j + 1][i];
      if ((i + j) % 2) tris.push([a, b, c], [a, c, d]);
      else tris.push([a, b, d], [b, c, d]);
    }
  const cx = PW / 2;
  const cy = PH / 2;
  const out = tris.map((t) => {
    const gx = (t[0][0] + t[1][0] + t[2][0]) / 3;
    const gy = (t[0][1] + t[1][1] + t[2][1]) / 3;
    // grow each piece a pixel from its centre so no hairline seams show before it breaks
    const g = t.map(([x, y]) => {
      const dx = x - gx;
      const dy = y - gy;
      const l = Math.hypot(dx, dy) || 1;
      return [x + (dx / l) * 1.2, y + (dy / l) * 1.2] as [number, number];
    });
    const x0 = Math.floor(Math.min(...g.map((p) => p[0])));
    const y0 = Math.floor(Math.min(...g.map((p) => p[1])));
    const w = Math.ceil(Math.max(...g.map((p) => p[0]))) - x0;
    const h = Math.ceil(Math.max(...g.map((p) => p[1]))) - y0;
    const dx = gx - cx;
    const dy = gy - cy;
    const l = Math.hypot(dx, dy) || 1;
    const dist = 220 + r() * 260;
    return {
      x0,
      y0,
      w,
      h,
      clip: `polygon(${g.map(([x, y]) => `${(x - x0).toFixed(1)}px ${(y - y0).toFixed(1)}px`).join(', ')})`,
      style: {
        left: x0,
        top: y0,
        width: w,
        height: h,
        transformOrigin: `${(gx - x0).toFixed(1)}px ${(gy - y0).toFixed(1)}px`,
        '--x': `${Math.round((dx / l) * dist)}px`,
        '--y': `${Math.round((dy / l) * dist * 0.8)}px`,
        '--z': `${Math.round(-420 + r() * 560)}px`,
        '--ax': (r() - 0.5).toFixed(2),
        '--ay': (r() - 0.5).toFixed(2),
        '--r': `${Math.round((r() > 0.5 ? 1 : -1) * (200 + r() * 360))}deg`,
        '--d': `${Math.round(Math.hypot(dx, dy) * 0.35)}ms`,
      } as Css,
    };
  });
  const cracks = tris.map((t) => `M${t[0][0].toFixed(0)} ${t[0][1].toFixed(0)}L${t[1][0].toFixed(0)} ${t[1][1].toFixed(0)}L${t[2][0].toFixed(0)} ${t[2][1].toFixed(0)}Z`).join('');
  return { tris: out, cracks };
}

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
  const { tris, cracks } = useMemo(() => shatter(seedOf(boss.id)), [boss.id]);
  return (
    <div className="fx-scene fx-boss" style={{ '--tc': boss.c2, '--bc': boss.c, '--bc2': boss.c2 } as Css}>
      <i className="fx-glow" />
      <div className="fx-at">
        <div className="fx-panel" style={{ width: PW, height: PH, margin: `${-PH / 2}px 0 0 ${-PW / 2}px` }}>
          {tris.map((t, i) => (
            <div key={i} className="fx-tri" style={{ ...t.style, clipPath: t.clip, WebkitClipPath: t.clip }}>
              <div className="fx-tri__in" style={{ left: -t.x0, top: -t.y0, width: PW, height: PH }}>
                <BossPanel boss={boss} />
              </div>
            </div>
          ))}
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
      return <AchievementScene a={c.achievement} />;
    case 'level':
      return <LevelScene from={c.from} to={c.to} />;
    case 'section-level':
      return <SectionScene section={c.section} from={c.from} to={c.to} />;
    case 'quest':
      return <QuestScene c={c} />;
    case 'boss':
      return <BossScene c={c} />;
    case 'evolve':
      return <EvolveScene c={c} />;
  }
}

/** Reduced motion or the calm setting: one card with the same information, cross-faded. */
export function CalmCard({ c }: { c: Celebration }) {
  const t = tell(c);
  const art =
    c.kind === 'achievement' ? (
      <Emblem a={c.achievement} size={96} />
    ) : c.kind === 'evolve' ? (
      <div style={{ width: 110 }} className="i-drone">
        <Drone stage={c.to} still happy label={false} />
      </div>
    ) : c.kind === 'boss' ? (
      <div style={{ width: 110 }}>
        <BossArt boss={bossOf(c)} down />
      </div>
    ) : c.kind === 'section-level' ? (
      <span className="fx-calm__k">{safeSection(c.section)?.kanji ?? '技'}</span>
    ) : c.kind === 'quest' ? (
      <Seal chars={c.sweep ? '制覇' : '達成'} className="fx-seal--calm" />
    ) : (
      <span className="fx-calm__k">昇</span>
    );
  return (
    <div className="fx-calm" style={{ '--tc': t.color } as Css}>
      <div className="fx-calm__art">{art}</div>
      <span className="fx-chip">{t.kicker}</span>
      <h2 className="fx-title">{t.title}</h2>
      <p className="fx-line">{t.line}</p>
    </div>
  );
}
