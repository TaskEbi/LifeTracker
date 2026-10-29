/**
 * Battle: a critical hit on the week's boss (会心の一撃) and a new overall rank (a war banner).
 */
import { BOSSES } from '../../../../domain/progress/boss';
import { BossArt } from '../../../../features/progress/BossArt';
import { Burst, Caption, Extruded, Seal, type Css } from '../kit';
import type { MomentFx, MomentFxMap } from './types';
import './battle.css';

const bossNamed = (name: string) => BOSSES.find((b) => b.name === name || b.id === name) ?? BOSSES[0];

// ─── 29 boss-crit: 会心の一撃 ────────────────────────────────────────────────

const bossCrit: MomentFx<'boss-crit'> = {
  tell: (m) => ({ kicker: 'Critical hit', title: `${m.damage} damage`, line: `${m.boss} reels`, color: '#ff3b3b' }),
  time: () => ({ dur: 2650, hit: 760 }),
  calm: (m) => (
    <div style={{ width: 100 }}>
      <BossArt boss={bossNamed(m.boss)} />
    </div>
  ),
  Scene: ({ m }) => {
    const boss = bossNamed(m.boss);
    return (
      <div className="fx-scene fx-crit" style={{ '--tc': '#ff3b3b', '--bc': boss.c, '--bc2': boss.c2 } as Css}>
        <i className="fx-bg fx-crit__bg" />
        <div className="fx-crit__hp">
          <span className="fx-crit__name">{boss.name}</span>
          <span className="fx-crit__bar">
            <i className="fx-crit__fill" />
            <i className="fx-crit__lost" />
            <i className="fx-crit__chunk" />
          </span>
        </div>
        <div className="fx-at fx-crit__at">
          <div className="fx-crit__mask">
            <BossArt boss={boss} />
            <i className="fx-crit__tint" />
          </div>
          <i className="fx-crit__slash fx-crit__slash--1" />
          <i className="fx-crit__slash fx-crit__slash--2" />
          <i className="fx-crit__slash fx-crit__slash--3" />
        </div>
        <Burst n={16} seed={m.damage} colors={['#ff3b3b', '#fff', '#ffd166']} spread={[160, 320]} />
        <div className="fx-at fx-crit__dmgat">
          <div className="fx-crit__dmg">
            <Extruded text={`-${m.damage}`} depth={3} step={6} back="#7a0d0d" />
          </div>
        </div>
        <div className="fx-crit__words">
          <Seal chars="会心" className="fx-crit__seal" />
          <span>の一撃</span>
        </div>
        <i className="fx-flash fx-crit__flash" />
        <Caption chip="critical hit · 会心の一撃" title={`${m.damage} damage`} line={`One save hit ${m.boss} hard`} />
      </div>
    );
  },
};

// ─── 30 rank: a war banner unfurls from above ───────────────────────────────

const BH = 380;

const rank: MomentFx<'rank'> = {
  tell: (m) => ({ kicker: 'New rank', title: m.to, line: `${m.from} → ${m.to}`, color: '#ffcf3a' }),
  time: () => ({ dur: 2750, hit: 1300 }),
  calm: () => <span className="fx-calm__k">位</span>,
  Scene: ({ m }) => (
    <div className="fx-scene fx-rk" style={{ '--tc': '#ffcf3a' } as Css}>
      <i className="fx-bg fx-rk__bg" />
      <div className="fx-stage fx-rk__cam">
        <div className="fx-rk__drop">
          <i className="fx-rk__pole" />
          <i className="fx-rk__arm" />
          <div className="fx-rk__win" style={{ height: BH }}>
            <div className="fx-rk__cloth" style={{ height: BH }}>
              <span className="fx-rk__mon">
                <i />
              </span>
              <b className={m.to.length > 8 ? 'is-long' : ''}>{m.to}</b>
            </div>
          </div>
          <i className="fx-rk__rod" />
        </div>
      </div>
      <Burst n={14} seed={m.to.length * 31} colors={['#ffcf3a', '#fff', '#d7192f']} spread={[160, 300]} />
      <div className="fx-rk__old">
        <small>was</small>
        <span className="fx-strike">{m.from}</span>
      </div>
      <Caption chip="rank up · 位" title={m.to} line={`${m.from} → ${m.to}`} />
    </div>
  ),
};

export const BATTLE_FX: Pick<MomentFxMap, 'boss-crit' | 'rank'> = { 'boss-crit': bossCrit, rank };
