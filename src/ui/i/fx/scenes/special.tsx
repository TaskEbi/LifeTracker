/**
 * Special variants of the core celebrations: a secret achievement (a ??? card cracks and shatters
 * in 3D to reveal the coin) and a monthly quest (a long scroll unrolls, 月, then the hanko).
 */
import { useMemo } from 'react';
import type { Achievement } from '../../../../domain/progress/achievements';
import type { Celebration } from '../celebrate';
import { Burst, Caption, Coin, Hanko, Ink, range, rng, Seal, seedOf, Shards, type Css, type Tri } from '../kit';
import './special.css';

// ─── 10 secret achievement ───────────────────────────────────────────────────

const SW = 210;
const SH = 250;

/**
 * The card breaks along a 3×3 grid of rectangles (cracks drawn jagged on top): rectangular pieces
 * clip for free, where triangles would each need a mask layer.
 */
function breakCard(seed: number): { tris: Tri[]; cracks: string } {
  const r = rng(seed);
  const cols = 3;
  const rows = 3;
  const tris: Tri[] = [];
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const x0 = Math.round((i / cols) * SW);
      const y0 = Math.round((j / rows) * SH);
      const w = Math.round(((i + 1) / cols) * SW) - x0;
      const h = Math.round(((j + 1) / rows) * SH) - y0;
      const dx = x0 + w / 2 - SW / 2;
      const dy = y0 + h / 2 - SH / 2;
      const l = Math.hypot(dx, dy) || 1;
      const dist = 240 + r() * 240;
      tris.push({
        x0,
        y0,
        clip: 'none',
        style: {
          left: x0,
          top: y0,
          width: w,
          height: h,
          '--x': `${Math.round((dx / l) * dist + (r() - 0.5) * 60)}px`,
          '--y': `${Math.round((dy / l) * dist * 0.8)}px`,
          '--z': `${Math.round(-380 + r() * 520)}px`,
          '--ax': (r() - 0.5).toFixed(2),
          '--ay': (r() - 0.5).toFixed(2),
          '--r': `${Math.round((r() > 0.5 ? 1 : -1) * (200 + r() * 340))}deg`,
          '--d': `${Math.round(l * 0.4)}ms`,
        } as Css,
      });
    }
  const zig = (x1: number, y1: number, x2: number, y2: number) => {
    const n = 7;
    return range(n + 1)
      .map((k) => {
        const t = k / n;
        const off = k === 0 || k === n ? 0 : (r() - 0.5) * 12;
        const x = x1 + (x2 - x1) * t + (x1 === x2 ? off : 0);
        const y = y1 + (y2 - y1) * t + (y1 === y2 ? off : 0);
        return `${k ? 'L' : 'M'}${x.toFixed(0)} ${y.toFixed(0)}`;
      })
      .join('');
  };
  const cracks = [zig(SW / 3, 0, SW / 3, SH), zig((2 * SW) / 3, 0, (2 * SW) / 3, SH), zig(0, SH / 3, SW, SH / 3), zig(0, (2 * SH) / 3, SW, (2 * SH) / 3)].join('');
  return { tris, cracks };
}

function SecretCard() {
  return (
    <div className="fx-sec2__card">
      <span className="fx-sec2__q fx-sec2__q--1">?</span>
      <span className="fx-sec2__q fx-sec2__q--2">?</span>
      <span className="fx-sec2__q fx-sec2__q--3">?</span>
      <span className="fx-sec2__lab">secret</span>
    </div>
  );
}

export function SecretScene({ a }: { a: Achievement }) {
  const { tris, cracks } = useMemo(() => breakCard(seedOf(a.id) + 3), [a.id]);
  const colors = useMemo(() => [`var(--t-${a.tier})`, '#fff', '#b48cff'], [a.tier]);
  const size = 168;
  return (
    <div className={`fx-scene fx-sec2 fx-ach--${a.tier}`} style={{ '--tc': `var(--t-${a.tier})` } as Css}>
      <i className="fx-bg fx-dimbg" />
      <i className="fx-glow" />
      <i className="fx-sec2__veil" />
      <div className="fx-at">
        <i className="fx-shock" />
        <i className="fx-shock fx-shock--late" />
      </div>
      <div className="fx-at">
        <div className="fx-coin-fly fx-sec2__coin" style={{ '--cs': `${size}px` } as Css}>
          <Coin a={a} size={size} />
        </div>
      </div>
      <div className="fx-at">
        <div className="fx-sec2__panel" style={{ width: SW, height: SH, margin: `${-SH / 2}px 0 0 ${-SW / 2}px` }}>
          {/* one card until it breaks, then the shards (so only one copy is drawn before the hit) */}
          <div className="fx-sec2__whole">
            <SecretCard />
          </div>
          <div className="fx-sec2__shards">
            <Shards tris={tris} w={SW} h={SH}>
              <SecretCard />
            </Shards>
          </div>
          <svg className="fx-cracks fx-sec2__cracks" viewBox={`0 0 ${SW} ${SH}`} aria-hidden="true">
            <path d={cracks} />
          </svg>
        </div>
      </div>
      <Burst n={12} seed={seedOf(a.id)} colors={colors} spread={[160, 300]} />
      <Seal chars="解禁" className="fx-seal--ach fx-sec2__seal" />
      <Caption chip={`secret · ${a.tier}`} title={a.title} line={a.desc} />
      <i className="fx-flash" />
    </div>
  );
}

// ─── 11 monthly quest: the scroll ────────────────────────────────────────────

const PW = 300;
const PH = 168;

function ScrollPaper({ title, xp }: { title: string; xp?: number }) {
  return (
    <div className="fx-scroll__paper">
      <small>月 · monthly quest</small>
      <b>{title}</b>
      {xp ? <span className="fx-scroll__xp">+{xp} XP</span> : null}
      <span className="fx-scroll__moon">
        <Seal chars="月" />
      </span>
      <span className="fx-scroll__imprint" aria-hidden="true">
        <Seal chars="達成" />
      </span>
    </div>
  );
}

export function MonthlyScene({ c }: { c: Extract<Celebration, { kind: 'quest' }> }) {
  return (
    <div className="fx-scene fx-scroll" style={{ '--tc': 'var(--c-quests)' } as Css}>
      <i className="fx-bg fx-dimbg" />
      <i className="fx-glow" />
      <div className="fx-at">
        <div className="fx-scroll__fly">
          {/* each half is a window over the same paper that slides open from the centre */}
          {(['l', 'r'] as const).map((side) => (
            <div key={side} className={`fx-scroll__half fx-scroll__half--${side}`} style={{ width: PW / 2, height: PH }}>
              {/* this half of the paper only, so the sliding window never shows the other half */}
              <div className="fx-scroll__in" style={{ width: PW / 2, height: PH }}>
                <div style={{ position: 'absolute', top: 0, left: side === 'l' ? 0 : -PW / 2, width: PW, height: PH }}>
                  <ScrollPaper title={c.title} xp={c.xp} />
                </div>
              </div>
            </div>
          ))}
          <i className="fx-scroll__rod fx-scroll__rod--l" />
          <i className="fx-scroll__rod fx-scroll__rod--r" />
        </div>
      </div>
      <Ink seed={seedOf(c.title)} n={12} at={[82, 30]} />
      <div className="fx-at">
        <div className="fx-hanko-fly fx-scroll__hanko">
          <Hanko chars="達成" />
        </div>
      </div>
      <Caption chip="monthly quest" title="Quest complete" line={c.xp ? `+${c.xp} XP` : 'A month-long quest cleared'} />
    </div>
  );
}
