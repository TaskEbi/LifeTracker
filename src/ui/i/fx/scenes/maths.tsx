/**
 * Maths' celebrations, out of Byrne's Euclid. A contest result: the blue, yellow and red squares fly
 * in from far away and lock around the triangle, Q.E.D. is stamped, the score flips up. Finally solved:
 * a wrong line is struck through and the tombstone drops. A level: the figure spins up out of the page.
 * Transform and opacity only.
 */
import { Burst, Caption, Extruded, Flap, seedOf, Stamp, type Css } from '../kit';
import type { MomentFx, MomentFxMap, SectionFx } from './types';
import './maths.css';

const RED = '#c8392b';
const BLUE = '#2d68b5';
const YELLOW = '#e8b52a';
const PAPER = '#f5ecd7';

function Figure() {
  return (
    <svg className="fx-ma__fig" viewBox="140 0 220 230" aria-hidden="true">
      <path className="fx-ma__sq fx-ma__sq--a" d="M200 120L152 84L188 36L236 72Z" fill={BLUE} />
      <path className="fx-ma__sq fx-ma__sq--b" d="M236 72L284 8L348 56L300 120Z" fill={YELLOW} />
      <path className="fx-ma__sq fx-ma__sq--c" d="M200 120H300V220H200Z" fill={RED} />
      <path className="fx-ma__tri" d="M200 120L300 120L236 72Z" fill={PAPER} stroke="#14120f" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

const contest: MomentFx<'contest'> = {
  tell: (m) => ({ kicker: m.real ? 'Contest result' : 'New best on paper', title: m.label, line: `${m.score} out of ${m.max}${m.best ? ' · your best' : ''}`, color: RED }),
  time: () => ({ dur: 3100, hit: 1050 }),
  calm: () => <span className="fx-calm__k">数</span>,
  Scene: ({ m }) => {
    const seed = seedOf(m.label);
    return (
      <div className="fx-scene fx-ma" style={{ '--tc': RED } as Css}>
        <i className="fx-bg fx-ma__bg" />
        <i className="fx-glow" />
        <div className="fx-at fx-ma__at">
          <Figure />
          <Stamp className="fx-ma__stamp" delay={120}>
            Q.E.D.
          </Stamp>
          <i className="fx-shock" />
        </div>
        <Burst n={18} seed={seed} colors={[RED, BLUE, YELLOW, PAPER]} spread={[120, 260]} />
        <div className="fx-ma__score">
          <Flap from={0} to={m.score} delay={1350} />
          <span>out of {m.max}</span>
        </div>
        <Caption chip={m.real ? 'maths · contest' : 'maths · practice'} title={m.label} line={m.best ? 'Your best yet.' : 'Done and dusted.'} />
        <i className="fx-flash fx-ma__flash" />
      </div>
    );
  },
};

const unstuck: MomentFx<'unstuck'> = {
  tell: (m) => ({ kicker: 'Finally solved', title: m.title, line: 'It beat you once. Not twice.', color: BLUE }),
  time: () => ({ dur: 2700, hit: 1100 }),
  calm: () => <span className="fx-calm__k">∎</span>,
  Scene: ({ m }) => (
    <div className="fx-scene fx-ma" style={{ '--tc': BLUE } as Css}>
      <i className="fx-bg fx-ma__bg" />
      <i className="fx-glow" />
      <div className="fx-at fx-ma__at">
        <div className="fx-ma__page">
          <span className="fx-ma__wrong">Suppose, for a contradiction…</span>
          <span className="fx-ma__wrong fx-ma__wrong--b">so it must hold for all n.</span>
          <span className="fx-ma__right">Hence the result.</span>
          <i className="fx-ma__stone" />
        </div>
        <i className="fx-shock" />
      </div>
      <Burst n={12} seed={seedOf(m.title)} colors={[BLUE, PAPER]} spread={[100, 220]} />
      <Caption chip="maths · 解決" title={m.title} line="It beat you once. Not twice." />
    </div>
  ),
};

export const MATHS_FX: Pick<MomentFxMap, 'contest' | 'unstuck'> = { contest, unstuck };

function LevelScene({ from, to }: { from: number; to: number }) {
  return (
    <div className="fx-scene fx-ma" style={{ '--tc': YELLOW } as Css}>
      <i className="fx-bg fx-ma__bg" />
      <i className="fx-glow" />
      <div className="fx-at fx-ma__at fx-ma__at--spin">
        <Figure />
      </div>
      <div className="fx-ma__k">
        <Extruded text="数" depth={7} step={5} back="#7c1e13" />
      </div>
      <div className="fx-ma__lv">
        LV <Flap from={String(from).padStart(2, '0')} to={String(to).padStart(2, '0')} delay={1200} />
      </div>
      <Caption chip="CH12 · level up" title="Maths" line={<>LV {from} → <b>LV {to}</b></>} />
    </div>
  );
}

export const MATHS_LEVEL: SectionFx = { Scene: LevelScene, time: { dur: 2700, hit: 1200, shake: 'soft' }, calm: <span className="fx-calm__k">数</span> };
