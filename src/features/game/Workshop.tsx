/** 工: machines that earn you more, and the materials that build them. */
import type { CSSProperties } from 'react';
import { useProgress } from '../../data/lt';
import { MAT_IDS, MATS, UPGRADES } from '../../domain/game/catalog';
import { canAfford, upgradeLevel } from '../../domain/game/wallet';
import { sectionInfo } from '../../domain/sections';
import { accent, H2 } from '../../ui/i/bits';
import { num, Price } from './bits';
import { buyUpgrade, useGame } from './store';

export function WorkshopTab() {
  const g = useGame();
  const level = useProgress().overall.level;
  const w = g.wallet;
  return (
    <>
      <H2 aside="what each section gives">Materials</H2>
      <div className="gm-mats">
        {MAT_IDS.map((s) => (
          <div key={s} className="gm-mat" style={accent(s)}>
            <span className="gm-mat__k" aria-hidden="true">
              {MATS[s].kanji}
            </span>
            <b>{num(w.mats[s])}</b>
            <small>{MATS[s].name}</small>
            <small className="gm-mat__s">{sectionInfo(s).name}</small>
          </div>
        ))}
      </div>
      <p className="i-note">About one material per 10 XP you earn in a section each day. Machines and bodies need particular ones, so every section you keep up pays into something.</p>

      <H2>Machines</H2>
      <div className="gm-ups">
        {UPGRADES.map((u) => {
          const lv = upgradeLevel(g.txs, u.id);
          const max = u.costs.length;
          const cost = lv < max ? u.costs[lv] : null;
          const lock = u.level && level < u.level ? `Reach level ${u.level}` : null;
          return (
            <div key={u.id} className={`gm-up${lv ? ' is-on' : ''}`}>
              <span className="gm-up__k" aria-hidden="true">
                {u.kanji}
              </span>
              <div className="gm-up__t">
                <b>{u.name}</b>
                <small>{u.desc}</small>
                <span className="gm-pips" role="img" aria-label={`Level ${lv} of ${max}`}>
                  {Array.from({ length: max }, (_, i) => (
                    <i key={i} className={i < lv ? 'is-on' : ''} style={{ '--i': i } as CSSProperties} />
                  ))}
                </span>
                {lv > 0 && <small className="gm-up__now">Now: {u.per(lv)}</small>}
                {cost ? (
                  <>
                    <small className="gm-up__next">Next: {u.per(lv + 1)}</small>
                    <Price cost={cost} w={w} />
                    {lock ? (
                      <small>{lock}</small>
                    ) : (
                      <button type="button" className="i-btn i-btn--sm" disabled={!canAfford(w, cost)} onClick={() => buyUpgrade(u.id)}>
                        {lv ? 'Upgrade' : 'Build'}
                      </button>
                    )}
                  </>
                ) : (
                  <small className="gm-up__now">Fully built</small>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="i-note">Machines only pay from the day you build them. They never change what you earned before.</p>
    </>
  );
}
