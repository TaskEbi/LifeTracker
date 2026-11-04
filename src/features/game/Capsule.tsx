/** 蛋: the capsule machine. The odds are on the front, because they should be. */
import { useState, type CSSProperties } from 'react';
import { capsulePool, DUST_FROM_DUPE, RARITY, SPIN10_COST, SPIN_COST, SPIN_ODDS, type Rarity } from '../../domain/game/catalog';
import { playStyle } from '../../ui/i/fx/celebrate';
import { H2 } from '../../ui/i/bits';
import { num, Price, Rar } from './bits';
import { showReveal } from './revealStore';
import { pityNow, spin, useGame } from './store';

export function CapsuleTab() {
  const g = useGame();
  const w = g.wallet;
  const [cranking, setCranking] = useState(false);
  const { since, pity } = pityNow(g);
  const pool = capsulePool();
  const owned = pool.filter((p) => w.items.has(p.item)).length;
  const go = (count: 1 | 10, payWith: 'tickets' | 'gems') => {
    const res = spin(count, payWith);
    if (!res) return;
    if (playStyle() === 'full') {
      setCranking(true);
      window.setTimeout(() => {
        setCranking(false);
        showReveal({ kind: 'spin', res });
      }, 950);
    } else {
      showReveal({ kind: 'spin', res });
    }
  };
  return (
    <>
      <section className="gm-mach" aria-label="The capsule machine">
        <Machine cranking={cranking} />
        <div className="gm-mach__do">
          <button type="button" className="i-btn i-btn--sig" disabled={cranking || w.tickets < 1} onClick={() => go(1, 'tickets')}>
            Spin with a ticket ({num(w.tickets)})
          </button>
          <button type="button" className="i-btn" disabled={cranking || w.gems < SPIN_COST.gems} onClick={() => go(1, 'gems')}>
            Spin · <Price cost={SPIN_COST} />
          </button>
          <button type="button" className="i-btn" disabled={cranking || w.gems < SPIN10_COST.gems} onClick={() => go(10, 'gems')}>
            Ten spins · <Price cost={SPIN10_COST} />
          </button>
          {w.tickets >= 10 && (
            <button type="button" className="i-btn" disabled={cranking} onClick={() => go(10, 'tickets')}>
              Ten with tickets
            </button>
          )}
        </div>
      </section>
      <div className="gm-pity">
        <span>
          <b>Epic or better</b>
          <small>
            within {Math.max(1, pity - since)} more spin{pity - since === 1 ? '' : 's'}, guaranteed
          </small>
        </span>
        <span className="gm-bar" role="progressbar" aria-label="Spins towards a guaranteed Epic" aria-valuemin={0} aria-valuemax={pity} aria-valuenow={since}>
          <i style={{ width: `${(since / pity) * 100}%` }} />
        </span>
      </div>
      <H2 aside={`${owned} of ${pool.length} collected`}>What's inside</H2>
      <div className="gm-odds">
        {(Object.keys(RARITY) as Rarity[]).map((r) => (
          <div key={r} className="gm-odds__row" style={{ '--a': RARITY[r].color } as CSSProperties}>
            <Rar r={r} />
            <span>{SPIN_ODDS[r]}%</span>
            <small>
              {pool.filter((p) => p.rarity === r && w.items.has(p.item)).length}/{pool.filter((p) => p.rarity === r).length} · dupes give {DUST_FROM_DUPE[r]} 星
            </small>
          </div>
        ))}
      </div>
      <p className="i-note">Tama and tickets only, and those only come from doing things. No real money anywhere in this. Anything you can spin, you can also buy outright in the shop.</p>
    </>
  );
}

function Machine({ cranking }: { cranking: boolean }) {
  const balls = ['#ff6fae', '#55b8ff', '#ffc23d', '#3df5e0', '#c77dff', '#ff8a5c', '#a3e635', '#ff4d6d', '#7dd3fc', '#fde047', '#f472b6', '#34d399'];
  return (
    <svg viewBox="0 0 220 280" className={`gm-machine${cranking ? ' is-cranking' : ''}`} aria-hidden="true">
      <defs>
        <linearGradient id="gm-globe" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".35" />
          <stop offset="1" stopColor="#fff" stopOpacity=".05" />
        </linearGradient>
      </defs>
      <rect x="30" y="130" width="160" height="136" rx="14" fill="#e11d63" stroke="#14101e" strokeWidth="5" />
      <rect x="44" y="144" width="132" height="34" rx="6" fill="#14101e" />
      <text x="110" y="168" textAnchor="middle" fontSize="20" fontWeight="700" fill="#ffe14d" fontFamily="sans-serif">
        ガシャポン
      </text>
      <circle cx="84" cy="212" r="24" fill="#ffe14d" stroke="#14101e" strokeWidth="5" />
      <g className="gm-machine__crank">
        <rect x="80" y="192" width="8" height="40" rx="3" fill="#14101e" />
        <circle cx="84" cy="196" r="6" fill="#fff" stroke="#14101e" strokeWidth="2" />
      </g>
      <rect x="130" y="200" width="46" height="46" rx="6" fill="#14101e" />
      <path d="M130 246 h46 v-10 q-23 -14 -46 0z" fill="#3a2a4a" />
      <circle className="gm-machine__drop" cx="153" cy="222" r="11" fill="#ffc23d" stroke="#14101e" strokeWidth="3" />
      <circle cx="110" cy="72" r="66" fill="#241a33" stroke="#14101e" strokeWidth="5" />
      <g className="gm-machine__balls">
        {balls.map((b, i) => {
          const row = Math.floor(i / 4);
          const x = 72 + (i % 4) * 26 + (row % 2 ? 12 : 0);
          const y = 62 + row * 24;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="13" fill={b} stroke="#14101e" strokeWidth="2.5" />
              <path d={`M${x - 13} ${y} h26`} stroke="#14101e" strokeWidth="1.5" />
              <path d={`M${x - 7} ${y - 8} q5 -4 10 -2`} fill="none" stroke="#fff" strokeWidth="2" opacity=".7" />
            </g>
          );
        })}
      </g>
      <circle cx="110" cy="72" r="66" fill="url(#gm-globe)" />
      <path d="M68 40 Q84 22 108 22" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity=".6" />
    </svg>
  );
}
