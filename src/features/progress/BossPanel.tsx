import { useState, type CSSProperties } from 'react';
import { navigate } from '../../app/router';
import { useBoss, useBossHistory, useToday } from '../../data/lt';
import { shortDay, weekdayIndex } from '../../domain/log/dates';
import { BOSS_XP, BOSSES, DMG, type BossFight, type Hit } from '../../domain/progress/boss';
import { sectionInfo } from '../../domain/sections';
import { H2 } from '../../ui/i/bits';
import { BossArt } from './BossArt';
import './boss.css';

const DAY = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const srcName = (h: Hit) => (h.source === 'tasks' ? 'Tasks' : h.source === 'general' ? 'Other' : sectionInfo(h.source).name);
const srcKanji = (h: Hit) => (h.source === 'tasks' ? '務' : h.source === 'general' ? '・' : sectionInfo(h.source).kanji);
const srcColour = (h: Hit) => `var(--c-${h.source === 'tasks' ? 'general' : h.source})`;

function HitRow({ h }: { h: Hit }) {
  return (
    <li className={`b-hit${h.weak ? ' is-weak' : ''}`} style={{ '--c': srcColour(h) } as CSSProperties}>
      <span className="b-hit__d">{DAY[weekdayIndex(h.date)]}</span>
      <span className="b-hit__k" aria-hidden="true">
        {srcKanji(h)}
      </span>
      <span className="b-hit__x">
        {srcName(h)} · {h.label}
      </span>
      <b className="b-hit__n">
        {h.weak && <em>WEAK ×{DMG.weakMultiplier}</em>}−{h.dmg}
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
  const weak = sectionInfo(boss.weak);
  const hits = compact ? fight.hits.slice(0, 3) : fight.hits;
  return (
    <section className={`b-card${down ? ' is-down' : ''}`} style={{ '--b': boss.c, '--b2': boss.c2, '--c': `var(--c-${boss.weak})` } as CSSProperties} aria-label={`Weekly boss: ${boss.name}`}>
      <div className="b-card__top">
        <button type="button" className="b-card__art" onClick={() => setTaunt((t) => !t)} aria-label={`${boss.name} says`} key={fight.damage}>
          <BossArt boss={boss} down={down} />
          {down && (
            <span className="b-card__stamp" aria-hidden="true">
              討伐
            </span>
          )}
        </button>
        <div className="b-card__info">
          <span className="b-card__kick">{down ? `Defeated ${shortDay(fight.defeatedOn!)}` : daysLeft === 0 ? 'Last day!' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`}</span>
          <b className="b-card__name">{boss.name}</b>
          <span className="b-card__title">{boss.title}</span>
          <span className="b-card__weak">
            <span aria-hidden="true">{weak.kanji}</span> Weak to {weak.name} · ×{DMG.weakMultiplier}
          </span>
        </div>
      </div>
      {(taunt || (!compact && !down)) && !down && <p className="b-card__taunt">“{boss.taunt}”</p>}
      <div className="b-card__hp">
        <span className="b-card__hpl">
          <span>HP</span>
          <span>
            {left.toLocaleString('en-GB')} / {fight.hp.toLocaleString('en-GB')}
            {down ? ` · +${BOSS_XP} XP earned` : ` · +${BOSS_XP} XP`}
          </span>
        </span>
        <span className="b-card__bar" role="progressbar" aria-label={`${boss.name} HP left`} aria-valuenow={Math.round(pct * 100)} aria-valuemin={0} aria-valuemax={100}>
          <i style={{ width: `${pct * 100}%` }} />
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
          <span>HP</span>
          <b>your last 4 weeks' average +10%</b>
        </li>
      </ul>
      <H2>
        Bestiary · {BOSSES.filter((b) => downs(b.id) > 0).length}/{BOSSES.length}
      </H2>
      <div className="b-beasts">
        {BOSSES.map((b) => {
          const seen = met(b.id);
          const n = downs(b.id);
          return (
            <div key={b.id} className={`b-beast${n ? ' is-down' : ''}`} style={{ '--b': b.c, '--b2': b.c2 } as CSSProperties}>
              <BossArt boss={b} unknown={!seen} />
              <b>{seen ? b.name : '???'}</b>
              <small>{seen ? (n ? `Defeated ×${n}` : 'Not beaten yet') : 'Not met yet'}</small>
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
                <b>{f.defeatedOn ? `Defeated · +${BOSS_XP}` : `Escaped · ${Math.round((f.damage / f.hp) * 100)}%`}</b>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
