/** What the rest of the app shows of the Hangar: the purse on Home, and the robot as you've dressed it. */
import type { CSSProperties } from 'react';
import { navigate } from '../../app/router';
import { COIN, GEM } from '../../domain/game/catalog';
import { eventOn } from '../../domain/game/events';
import { chassisMk } from '../../domain/game/wallet';
import { Robot } from '../../ui/i/bots/Robot';
import { Amt } from './bits';
import { useGame, useLoadout } from './store';
import './game.css';

export function Purse() {
  const g = useGame();
  const w = g.wallet;
  const run = eventOn(g.today);
  return (
    <button type="button" className="h-purse" onClick={() => navigate('hangar')} aria-label={`Hangar: ${w.chests.length} chests waiting`}>
      <span className="h-purse__k" aria-hidden="true">
        機
      </span>
      <Amt k={COIN.kanji} c={COIN.color} n={w.coins} name={COIN.name} />
      <Amt k={GEM.kanji} c={GEM.color} n={w.gems} name={GEM.name} />
      {w.chests.length > 0 && <Amt k="宝" c="#ff8a5c" n={w.chests.length} name="chests" />}
      {run && (
        <span className="h-purse__ev" style={{ color: run.def.c2 } as CSSProperties}>
          {run.def.kanji} {run.def.name}
        </span>
      )}
    </button>
  );
}

/** The character as you've dressed it. */
export function WornRobot({ stage, still, happy }: { stage: number; still?: boolean; happy?: boolean }) {
  const look = useLoadout();
  const w = useGame().wallet;
  return <Robot stage={stage} look={look} still={still} happy={happy} mk={look.chassis === 'drone' ? undefined : chassisMk(w, look.chassis) || 1} />;
}
