/**
 * The surprise scenes' director's kit. A scene is a comic page in the specials' style (two panels
 * hanging in a 3D stage, then a splash page with an extruded kanji), written as a short script:
 * actors placed in a panel, each with a motion (a three-point tween) and a loop.
 *
 * Every motion is transform and opacity only. Custom properties are prefixed `--v` so nothing
 * leaks into the shared pieces (sparks, sound effects) that read their own short names.
 */
import type { CSSProperties, ReactNode } from 'react';
import { useProgress } from '../../../../../data/lt';
import { useLoadout } from '../../../../../features/game/store';
import { Robot } from '../../../bots/Robot';
import { Burst, Caption, type Css } from '../../kit';
import { Big, Panel, Sfx, Splash, Stage } from '../specials';
import './surprise.css';

export { Panel, Sfx, Stage };
export { City, Fall } from '../specials';
export { Confetti, Embers, Ripples, Twinkles, range, rng, type Css } from '../../kit';

type V = number | string;
const px = (v: V | undefined, unit: string) => (v === undefined ? undefined : typeof v === 'number' ? `${v}${unit}` : v);

/** A tween: where it starts, passes through at the half and ends (x/y px or %, r deg, s scale, o opacity). */
export interface Tw {
  x0?: V; y0?: V; r0?: V; s0?: V; o0?: V;
  xm?: V; ym?: V; rm?: V; sm?: V; om?: V;
  x1?: V; y1?: V; r1?: V; s1?: V; o1?: V;
}

/** Entrances and moves that come up again and again. */
export const TW = {
  pop: { s0: 0.2, sm: 1.18, s1: 1, o0: 0, om: 1 },
  stamp: { s0: 2.6, sm: 0.9, s1: 1, r0: -16, rm: 3, r1: -6, o0: 0, om: 1 },
  rise: { y0: 60, ym: -6, o0: 0, om: 1 },
  drop: { y0: -220, ym: 8, o0: 0, om: 1 },
  fromL: { x0: '-160%', xm: '6%', o0: 0, om: 1 },
  fromR: { x0: '160%', xm: '-6%', o0: 0, om: 1 },
  zoom: { s0: 0.05, sm: 1.1, s1: 1, o0: 0, om: 1 },
  fade: { o0: 0, om: 0.6 },
  spin: { r0: -540, rm: -60, s0: 0.2, sm: 1.1, o0: 0, om: 1 },
  out: { s1: 0.4, o1: 0, ym: -10, y1: -60 },
} satisfies Record<string, Tw>;

export type Loop = 'float' | 'spin' | 'spinR' | 'pulse' | 'wobble' | 'shake' | 'sway' | 'flicker' | 'bob' | 'drift';

function tweenStyle(t: Tw, d: number, p: number, e?: string): Css {
  const x0 = px(t.x0, 'px') ?? '0px';
  const y0 = px(t.y0, 'px') ?? '0px';
  const r0 = px(t.r0, 'deg') ?? '0deg';
  const x1 = px(t.x1, 'px') ?? '0px';
  const y1 = px(t.y1, 'px') ?? '0px';
  const r1 = px(t.r1, 'deg') ?? '0deg';
  const s0 = String(t.s0 ?? 1);
  const s1 = String(t.s1 ?? 1);
  const o0 = String(t.o0 ?? 1);
  const o1 = String(t.o1 ?? 1);
  return {
    '--vx0': x0, '--vy0': y0, '--vr0': r0, '--vs0': s0, '--vo0': o0,
    '--vxm': px(t.xm, 'px') ?? `calc((${x0} + ${x1}) / 2)`,
    '--vym': px(t.ym, 'px') ?? `calc((${y0} + ${y1}) / 2)`,
    '--vrm': px(t.rm, 'deg') ?? `calc((${r0} + ${r1}) / 2)`,
    '--vsm': String(t.sm ?? `calc((${s0} + ${s1}) / 2)`),
    '--vom': String(t.om ?? `calc((${o0} + ${o1}) / 2)`),
    '--vx1': x1, '--vy1': y1, '--vr1': r1, '--vs1': s1, '--vo1': o1,
    '--vd': `${d}ms`,
    '--vp': `${p}ms`,
    ...(e ? { '--ve': e } : {}),
  };
}

export const EASE = {
  out: 'cubic-bezier(.2,.8,.3,1.1)',
  in: 'cubic-bezier(.6,0,.9,.4)',
  lin: 'linear',
  soft: 'cubic-bezier(.4,0,.2,1)',
  back: 'cubic-bezier(.3,1.5,.5,1)',
};

/**
 * An actor. `l`/`t` place its centre (percent of the panel or the screen), `w` its width. `m` is its
 * entrance or move from `d` for `p` ms, `m2` a second one (to leave, say) from `d2`, `loop` what it
 * does meanwhile.
 */
export function A({
  l, t, w, z, rot, m, d = 0, p = 600, e, m2, d2 = 0, p2 = 600, e2, loop, lp, amp, ld, className = '', style, children, origin,
}: {
  l: V; t: V; w?: V; z?: number; rot?: number; m?: Tw; d?: number; p?: number; e?: string; m2?: Tw; d2?: number; p2?: number; e2?: string;
  loop?: Loop; lp?: number; amp?: V; ld?: number; className?: string; style?: CSSProperties; children?: ReactNode;
  /** Transform origin of the moves (a lid's hinge, a pendulum's pivot). */
  origin?: string;
}) {
  const pos = { '--vl': px(l, '%'), '--vt': px(t, '%'), ...(w !== undefined ? { '--vw': px(w, 'px') } : {}), ...(z !== undefined ? { '--vz': z } : {}), ...(rot ? { '--var': `${rot}deg` } : {}), ...style } as Css;
  let inner: ReactNode = children;
  if (loop) inner = <div className={`sv-lp sv-lp--${loop}`} style={{ '--vlp': `${lp ?? 1800}ms`, '--vamp': px(amp, 'px') ?? '6px', '--vld': `${ld ?? 0}ms` } as Css}>{inner}</div>;
  const o = origin ? { transformOrigin: origin } : {};
  if (m2) inner = <div className="sv-m" style={{ ...tweenStyle(m2, d2, p2, e2), ...o }}>{inner}</div>;
  if (m) inner = <div className="sv-m" style={{ ...tweenStyle(m, d, p, e), ...o }}>{inner}</div>;
  return (
    <div className={`sv-a ${className}`} style={pos}>
      {inner}
    </div>
  );
}

/** A panel's backdrop: any static paint. */
export const Fill = ({ bg, className = '' }: { bg?: string; className?: string }) => <i className={`sv-fill ${className}`} style={bg ? { background: bg } : undefined} />;

/** Speed lines behind the action (from the specials). */
export const Speed = ({ hot }: { hot?: boolean }) => <i className={`sp-speed${hot ? ' sp-speed--hot' : ''}`} />;

/** The robot as you've dressed it in the Hangar, in your current form. */
export function Bot({ happy }: { happy?: boolean }) {
  const stage = useProgress().overall.stage;
  const look = useLoadout();
  return (
    <div className="sv-bot i-drone">
      <Robot stage={stage} look={look} happy={happy} still label={false} />
    </div>
  );
}

/** A speech bubble popping in at `d`. */
export function Say({ l, t, d, children, tail = 'left' }: { l: V; t: V; d: number; children: ReactNode; tail?: 'left' | 'right' }) {
  return (
    <A l={l} t={t} z={4} m={TW.pop} d={d} p={420}>
      <span className={`sp-bub sv-bub sv-bub--${tail}`}>{children}</span>
    </A>
  );
}

/** Sound effects placed in a panel. */
export function Fx({ text, at, l, t, color, step, size, rot }: { text: string; at: number; l: V; t: V; color?: string; step?: number; size?: 's' | 'l'; rot?: number }) {
  return (
    <div className={`sv-sfx${size ? ` sv-sfx--${size}` : ''}`} style={{ '--vl': px(l, '%'), '--vt': px(t, '%'), '--var': `${rot ?? 0}deg` } as Css}>
      <Sfx text={text} at={at} step={step} color={color} />
    </div>
  );
}

/** The splash page: sunburst, the big extruded kanji, a shout and the caption. */
export function Finale({ kanji, back, shout, shoutColor, chip, title, line, sparks, at }: { kanji: string; back: string; shout: string; shoutColor?: string; chip: string; title: string; line: string; sparks: string[]; at: number }) {
  return (
    <>
      <Splash />
      <Big text={kanji} back={back} />
      <Sfx text={shout} at={at + 250} step={60} className="sp-hero-sfx" color={shoutColor ?? '#fff3c4'} />
      <Burst n={16} seed={kanji.charCodeAt(0)} colors={sparks} spread={[140, 320]} />
      <Caption chip={chip} title={title} line={line} />
      <i className="fx-flash" />
    </>
  );
}

/** The scene's root. `tc` tints the backdrop, splash and caption. */
export function Page({ tc, id, children }: { tc: string; id: string; children: ReactNode }) {
  return (
    <div className={`fx-scene sp sv sv--${id}`} style={{ '--tc': tc } as Css}>
      <i className="fx-bg sp-inkbg" />
      {children}
    </div>
  );
}

export interface SurpriseProps {
  chip: string;
  title: string;
  line: string;
  hit: number;
}
