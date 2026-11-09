import { useState, type CSSProperties } from 'react';
import { navigate } from '../../app/router';
import { useBoss, useBossHistory, useToday } from '../../data/lt';
import { shortDay, weekdayIndex } from '../../domain/log/dates';
import { BOSS_ERA2, BOSSES, COMBO, DMG, ENRAGE, HP2, REGEN, TIERS, TRAITS, traitLine, type BossDef, type BossFight, type Hit } from '../../domain/progress/boss';
import { sectionInfo } from '../../domain/sections';
import { H2 } from '../../ui/i/bits';
import { BossArt } from './BossArt';
import './boss.css';

const DAY = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const OTHER: Record<string, [string, string]> = { tasks: ['Tasks', '務'], general: ['Other', '・'], item: ['Hangar', '爆'], combo: ['Combo', '連'], boss: ['Boss', '鬼'] };
const srcName = (h: Hit) => OTHER[h.source]?.[0] ?? sectionInfo(h.source as never).name;
const srcKanji = (h: Hit) => OTHER[h.source]?.[1] ?? sectionInfo(h.source as never).kanji;
const srcColour = (h: Hit) => (h.source === 'boss' ? 'var(--b)' : h.source === 'combo' ? '#ffc94d' : `var(--c-${h.source === 'tasks' || h.source === 'item' ? 'general' : h.source})`);
const sectionName = (id: string) => sectionInfo(id as never).name;
/** A trait in words, with the section's name rather than its id. */
const traitText = (b: BossDef) => (b.trait === 'resist' && b.resist ? `Takes half damage from ${sectionName(b.resist).toLowerCase()}` : traitLine(b));

function HitRow({ h }: { h: Hit }) {
  return (
    <li className={`b-hit${h.weak ? ' is-weak' : ''}${h.source === 'boss' ? ' is-boss' : ''}${h.source === 'combo' ? ' is-combo' : ''}`} style={{ '--c': srcColour(h) } as CSSProperties}>
      <span className="b-hit__d">{DAY[weekdayIndex(h.date)]}</span>
      <span className="b-hit__k" aria-hidden="true">
        {srcKanji(h)}
      </span>
      <span className="b-hit__x">
        {srcName(h)} · {h.label}
      </span>
      <b className="b-hit__n">
        {h.weak && <em>WEAK ×{DMG.weakMultiplier}</em>}
        {h.resisted && <em className="is-resist">RESIST ½</em>}
        {h.dmg < 0 ? `+${-h.dmg} HP` : h.dmg === 0 ? '' : `−${h.dmg}`}
      </b>
    </li>
  );
}

/** The week's boss: who it is, what it's weak to, its HP and the last hits. */
export function BossCard({ fight, compact }: { fight: BossFight; compact?: boolean }) {
  const today = useToday();
  const [taunt, setTaunt] = useState(false);
  const { boss } = fight;
  const left = Math.max(0, fight.hp - fight.damage);
  const pct = fight.hp ? left / fight.hp : 0;
  const down = !!fight.defeatedOn;
  const daysLeft = 6 - weekdayIndex(today);
  const weak = sectionInfo(fight.weakNow);
  const cracked = !!fight.crackedOn && fight.crackedOn < today;
  const hits = compact ? fight.hits.slice(0, 3) : fight.hits;
  const tier = TIERS[fight.tier];
  return (
    <section className={`b-card t-${fight.tier}${down ? ' is-down' : ''}${cracked && !down ? ' is-cracked' : ''}${fight.enragedOn && !down ? ' is-enraged' : ''}`} style={{ '--b': boss.c, '--b2': boss.c2, '--c': `var(--c-${fight.weakNow})` } as CSSProperties} aria-label={`Weekly boss: ${boss.name}`}>
      <div className="b-card__top">
        <button type="button" className="b-card__art" onClick={() => setTaunt((t) => !t)} aria-label={`${boss.name} says`} key={fight.damage}>
          <BossArt boss={boss} down={down} tier={fight.tier} cracked={cracked} enraged={!!fight.enragedOn} />
          {down && (
            <span className="b-card__stamp" aria-hidden="true">
              討伐
            </span>
          )}
        </button>
        <div className="b-card__info">
          <span className="b-card__kick">
            {fight.era2 && (
              <span className="b-card__rank">
                <span aria-hidden="true">{tier.kanji}</span> {tier.name}
              </span>
            )}
            {down ? `Defeated ${shortDay(fight.defeatedOn!)}` : daysLeft === 0 ? 'Last day!' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`}
          </span>
          <b className="b-card__name">{boss.name}</b>
          <span className="b-card__title">{boss.title}</span>
          <span className="b-card__weak">
            <span aria-hidden="true">{weak.kanji}</span> {cracked ? 'Cracked: now weak to' : 'Weak to'} {weak.name} · ×{DMG.weakMultiplier}
          </span>
          {fight.era2 && !down && (
            <span className="b-card__trait" title={traitText(boss)}>
              <span aria-hidden="true">{TRAITS[boss.trait].kanji}</span> {boss.trait === 'resist' && boss.resist ? `Resists ${sectionName(boss.resist)}` : TRAITS[boss.trait].name}
              {fight.enragedOn ? ' · ENRAGED' : ''}
            </span>
          )}
        </div>
      </div>
      {(taunt || (!compact && !down)) && !down && <p className="b-card__taunt">“{cracked ? boss.taunt2 : boss.taunt}”</p>}
      {fight.era2 && !down && !compact && (
        <p className="b-card__how">
          {traitText(boss)}. {cracked ? `Its mask cracked ${shortDay(fight.crackedOn!)}.` : `At half HP its mask cracks and it becomes weak to ${sectionName(boss.weak2).toLowerCase()} instead.`}
        </p>
      )}
      <div className="b-card__hp">
        <span className="b-card__hpl">
          <span>HP</span>
          <span>
            {left.toLocaleString('en-GB')} / {fight.hp.toLocaleString('en-GB')}
            {down ? ` · +${fight.xp} XP earned` : ` · +${fight.xp} XP`}
          </span>
        </span>
        <span className="b-card__bar" role="progressbar" aria-label={`${boss.name} HP left`} aria-valuenow={Math.round(pct * 100)} aria-valuemin={0} aria-valuemax={100}>
          <i style={{ width: `${pct * 100}%` }} />
          {fight.era2 && !down && <em className="b-card__half" aria-hidden="true" />}
        </span>
      </div>
      {hits.length > 0 ? (
        <ul className="b-hits" aria-label="Hits this week">
          {hits.map((h, i) => (
            <HitRow key={i} h={h} />
          ))}
        </ul>
      ) : (
        <p className="i-note">No hits yet this week. Every minute you log is one damage; {weak.name.toLowerCase()} deals double.</p>
      )}
      {compact && (
        <button type="button" className="i-link b-card__more" onClick={() => navigate('progress', ['boss'])}>
          Raid log ▶
        </button>
      )}
    </section>
  );
}

/** Progress → Raid: this week's fight in full, the bestiary and past weeks. */
export function BossPanel() {
  const fight = useBoss();
  const history = useBossHistory();
  const past = history.filter((f) => f.start !== fight.start).reverse();
  const downs = (id: string) => history.filter((f) => f.boss.id === id && f.defeatedOn).length;
  const met = (id: string) => history.some((f) => f.boss.id === id);
  // Every face shows until the stronger roster starts; after that, unmet ones are a mystery.
  const preview = fight.start < BOSS_ERA2;
  return (
    <>
      <BossCard fight={fight} />
      <H2>How damage works</H2>
      <ul className="b-rules">
        <li>
          <span>Minutes logged</span>
          <b>{DMG.minute} each · weak section ×{DMG.weakMultiplier}</b>
        </li>
        <li>
          <span>A section's first time this week</span>
          <b>{DMG.newSection}</b>
        </li>
        <li>
          <span>Task completed</span>
          <b>{DMG.task}</b>
        </li>
        <li>
          <span>Night logged · bed on time</span>
          <b>
            {DMG.night} · +{DMG.bedtime}
          </b>
        </li>
        <li>
          <span>Screen time logged · under target</span>
          <b>
            {DMG.screen} · +{DMG.screenUnder}
          </b>
        </li>
        <li>
          <span>Combo: 3 sections in a day · 5 sections</span>
          <b>
            {COMBO.three} · {COMBO.five}
          </b>
        </li>
        <li>
          <span>HP</span>
          <b>your last 4 weeks' average +{Math.round((HP2.growth - 1) * 100)}%, × rank</b>
        </li>
      </ul>
      <H2>Ranks and traits</H2>
      <ul className="b-rules">
        {([1, 2, 3] as const).map((t) => (
          <li key={t}>
            <span>
              {TIERS[t].kanji} {TIERS[t].name}
            </span>
            <b>
              HP ×{TIERS[t].hp} · {TIERS[t].xp} XP{t === 3 ? ' · gold chest' : ''}
            </b>
          </li>
        ))}
        <li>
          <span>{TRAITS.regen.kanji} Regenerates</span>
          <b>heals {REGEN * 100}% after a day with no hits</b>
        </li>
        <li>
          <span>{TRAITS.enrage.kanji} Enrages</span>
          <b>+{ENRAGE * 100}% HP on Saturday if over half is left</b>
        </li>
        <li>
          <span>{TRAITS.resist.kanji} Resists</span>
          <b>one section deals half</b>
        </li>
        <li>
          <span>Mask cracks at half HP</span>
          <b>from the next day, a new weakness</b>
        </li>
      </ul>
      <p className="i-note">Ranks, traits, combos and cracking masks start the week of {shortDay(BOSS_ERA2)}; earlier weeks keep the old rules.</p>
      <H2>
        Bestiary · {BOSSES.filter((b) => downs(b.id) > 0).length}/{BOSSES.length}
      </H2>
      <div className="b-beasts">
        {BOSSES.map((b) => {
          const seen = met(b.id);
          const n = downs(b.id);
          return (
            <div key={b.id} className={`b-beast t-${b.tier}${n ? ' is-down' : ''}`} style={{ '--b': b.c, '--b2': b.c2 } as CSSProperties}>
              <BossArt boss={b} unknown={!seen && !preview} />
              <b>{seen || preview ? b.name : '???'}</b>
              <small>
                <span aria-hidden="true">{TIERS[b.tier].kanji}</span> {seen ? (n ? `Defeated ×${n}` : 'Not beaten yet') : 'Not met yet'}
              </small>
            </div>
          );
        })}
      </div>
      {past.length > 0 && (
        <>
          <H2>Past weeks</H2>
          <ul className="b-past">
            {past.map((f) => (
              <li key={f.start} className={f.defeatedOn ? 'is-down' : ''}>
                <span className="i-mono">{shortDay(f.start)}</span>
                <span>{f.boss.name}</span>
                <b>{f.defeatedOn ? `Defeated · +${f.xp}` : `Escaped · ${Math.round((f.damage / f.hp) * 100)}%`}</b>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
