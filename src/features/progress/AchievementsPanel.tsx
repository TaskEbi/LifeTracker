import { useState, type CSSProperties } from 'react';
import { useAchievements } from '../../data/lt';
import { shortDay } from '../../domain/log/dates';
import { TIERS, type Achievement, type Tier } from '../../domain/progress/achievements';
import { Chips } from '../../ui/i/bits';
import { Icon } from '../../ui/i/Icon';

const TIER_NAME: Record<Tier, string> = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', platinum: 'Platinum' };

function Badge({ a }: { a: Achievement }) {
  const on = !!a.unlockedOn;
  const pct = a.goal ? a.progress / a.goal : 0;
  return (
    <div
      className={`pg-badge pg-badge--${a.tier}${on ? ' is-on' : ''}`}
      style={{ '--c': a.section ? `var(--c-${a.section})` : 'var(--c-quests)' } as CSSProperties}
      aria-label={`${a.title}, ${TIER_NAME[a.tier]}: ${a.desc}. ${on ? `Unlocked ${shortDay(a.unlockedOn!)}` : `${a.progress} of ${a.goal}`}`}
      role="listitem"
    >
      <span className="pg-badge__medal" aria-hidden="true">
        <Icon name={on ? 'trophy' : 'lock'} size={22} />
      </span>
      <b>{a.title}</b>
      <small>{a.desc}</small>
      {on ? (
        <span className="pg-badge__when i-mono">{shortDay(a.unlockedOn!)}</span>
      ) : (
        <>
          <span className="pg-q__bar" aria-hidden="true">
            <i style={{ width: `${Math.round(pct * 100)}%` }} />
          </span>
          <span className="pg-badge__when i-mono">
            {a.progress}/{a.goal}
          </span>
        </>
      )}
    </div>
  );
}

export function AchievementsPanel() {
  const ach = useAchievements();
  const [filter, setFilter] = useState<'all' | 'on' | 'off'>('all');
  const unlocked = ach.filter((a) => a.unlockedOn).sort((a, b) => b.unlockedOn!.localeCompare(a.unlockedOn!));
  const locked = ach.filter((a) => !a.unlockedOn).sort((a, b) => b.progress / b.goal - a.progress / a.goal);
  const list = filter === 'on' ? unlocked : filter === 'off' ? locked : [...unlocked, ...locked];
  return (
    <>
      <div className="pg-tiers" aria-label="Unlocked by tier">
        {TIERS.map((t) => {
          const all = ach.filter((a) => a.tier === t);
          return (
            <div key={t} className={`pg-tier pg-badge--${t}`}>
              <span className="pg-badge__medal pg-tier__m" aria-hidden="true">
                <Icon name="trophy" size={16} />
              </span>
              <b className="i-mono">
                {all.filter((a) => a.unlockedOn).length}/{all.length}
              </b>
              <small>{TIER_NAME[t]}</small>
            </div>
          );
        })}
      </div>
      <Chips
        label="Show"
        value={filter}
        onChange={setFilter}
        options={[
          { id: 'all', label: `All ${ach.length}` },
          { id: 'on', label: `Unlocked ${unlocked.length}` },
          { id: 'off', label: `Locked ${locked.length}` },
        ]}
      />
      {list.length ? (
        <div className="pg-badges" role="list" aria-label="Achievements">
          {list.map((a) => (
            <Badge key={a.id} a={a} />
          ))}
        </div>
      ) : (
        <p className="i-note">Nothing unlocked yet. The closest ones are under Locked.</p>
      )}
    </>
  );
}
