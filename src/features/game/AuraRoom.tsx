/**
 * 霊 The Aura Dial, a room in the Works: the dial rolls an aura every few seconds (and while you're
 * away), motes from each roll buy upgrades, and every aura you've rolled goes in the index. Auras
 * you haven't rolled show their odds and nothing else. Logic in domain/game/aura.ts, saving in
 * auraStore.ts, drawing in auraFx.ts.
 */
import { useRef, useState, type CSSProperties } from 'react';
import { useProgress } from '../../data/lt';
import { CHASSIS } from '../../domain/game/catalog';
import {
  AURA_TIERS,
  AURA_UPGRADES,
  auraById,
  auraCogs,
  AURAS,
  awayEffOf,
  awayHoursOf,
  chargeEvery,
  chargeMult,
  charmMult,
  foundCount,
  handMult,
  INCENSE_MAX,
  INCENSE_MULT,
  INCENSE_ROLLS,
  incenseCost,
  INDEX_LUCK,
  INDEX_WORKS,
  indexMult,
  intervalOf,
  lifeMult,
  luckOf,
  motesPerRoll,
  multiOf,
  oddsText,
  rollsPerSecond,
  SCENE_TIER,
  sieveMult,
  upgradeCost,
  type Aura,
  type AuraSave,
  type AuraUpgrade,
} from '../../domain/game/aura';
import { fmt, fmtTime, type Ext } from '../../domain/game/idle';
import { chassisMk } from '../../domain/game/wallet';
import { H2 } from '../../ui/i/bits';
import { Robot } from '../../ui/i/bots/Robot';
import { AuraCanvas } from './AuraCanvas';
import { AuraRoll, planOf, spotLen, type Plan } from './AuraRoll';
import { buyAuraUp, dismissAuraAway, lightIncense, pullDial, replayScene, useAura, useAuraRoom, wearAura, type Hit } from './auraStore';
import { useGame, useLoadout } from './store';
import { useWorks } from './worksStore';
import './aura.css';

const MOTE = '粒';
const x = (n: number) => `×${n >= 100 ? fmt(n) : n >= 10 ? n.toFixed(1) : n.toFixed(2)}`;
const tierStyle = (a: Aura) => ({ '--a': AURA_TIERS[a.tier].color, '--au': a.c }) as CSSProperties;

/**
 * Which roll the stage is showing. A newer roll takes over, except while a rarer (or as rare) one is
 * still winding up or landing: the newer one goes on the tape only.
 */
function useSpot(hit: Hit | undefined, step: number) {
  const ref = useRef<{ hit: Hit; plan: Plan; until: number } | null>(null);
  const cur = ref.current;
  if (hit && hit.n !== cur?.hit.n) {
    const a = auraById(hit.id);
    const now = performance.now();
    // A quiet repeat never keeps a first-time roll off the stage.
    if (a && !(cur && now < cur.until && a.tier <= cur.plan.tier && !(cur.plan.quiet && hit.fresh))) {
      const plan = planOf(a, hit, step);
      ref.current = { hit, plan, until: now + spotLen(plan) * 1000 };
    }
  }
  return ref.current;
}

/** The top of the room: your robot in the aura it wears, the dial's count, and the pull. */
export function AuraStage({ ext }: { ext: Ext }) {
  useAuraRoom();
  const live = useAura();
  const bot = useLoadout();
  const g = useGame();
  const p = useProgress();
  const s = live.save;
  const worn = auraById(s.worn);
  const ch = CHASSIS.find((c) => c.id === bot.chassis);
  const mk = ch ? chassisMk(g.wallet, ch.id) || 1 : undefined;
  const step = intervalOf(s);
  const rps = rollsPerSecond(s);
  const multi = multiOf(s);
  const spot = useSpot(live.tape[live.tape.length - 1], step);
  const [omen, setOmen] = useState(0);
  return (
    <div className="au-stage" data-omen={omen || undefined} style={{ '--au': worn?.c ?? '#8b8fa3' } as CSSProperties}>
      <AuraCanvas id={worn?.id} pass="back" className="au-stage__fx" />
      <div className="au-bot i-drone" aria-hidden="true">
        <Robot stage={p.overall.stage} look={bot} mk={mk} label={false} />
      </div>
      <AuraCanvas id={worn?.id} pass="front" className="au-stage__fx is-front" />
      <div className="au-hud">
        <p className="au-hud__n" aria-label={`${fmt(s.motes)} motes`}>
          <i aria-hidden="true">{MOTE}</i>
          <b aria-hidden="true">{fmt(s.motes)}</b>
        </p>
        <p className="au-hud__r">
          Luck {x(luckOf(s, ext))} · {!s.rolls ? 'not rolling yet' : rps >= 1 ? `${rps >= 10 ? rps.toFixed(0) : rps.toFixed(1)} rolls a second` : `${multi > 1 ? `${multi} rolls` : 'a roll'} every ${step.toFixed(1)} s`}
        </p>
      </div>
      <p className="au-worn">{worn ? `Wearing ${worn.name}` : s.rolls ? 'No aura on. Choose one in the index.' : 'Pull the dial once and it keeps rolling on its own.'}</p>
      {spot && <AuraRoll key={spot.hit.n} hit={spot.hit} plan={spot.plan} s={s} onOmen={setOmen} />}
      <button type="button" className="au-roll" aria-label="Roll the dial" onClick={pullDial}>
        <b>Roll</b>
        <small>your hand: luck {x(handMult(s))}</small>
      </button>
      {s.rolls > 0 && step >= 0.4 && <span key={s.rolls - s.hand} className="au-turn" style={{ '--d': `${step}s` } as CSSProperties} aria-hidden="true" />}
    </div>
  );
}

const TABS = [
  { id: 'ups', label: 'Charms' },
  { id: 'index', label: 'Index' },
  { id: 'nums', label: 'Numbers' },
] as const;

export function AuraRoom({ ext }: { ext: Ext }) {
  const live = useAura();
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('ups');
  const s = live.save;
  if (!live.ready) return <p className="i-note">Winding the dial…</p>;
  const away = live.away;
  const best = auraById(away?.best);
  const left = chargeEvery(s) - s.n;
  return (
    <>
      {away && (
        <div className="wk-away au-away" role="status">
          <b>While you were away</b>
          <p>
            You were gone {fmtTime(away.gap)}. The dial kept turning for {fmtTime(away.worked)}
            {away.capped ? ' (as long as it will without you)' : ''} at {Math.round(away.eff * 100)}% speed: <strong>{fmt(away.rolls)} rolls</strong>, {fmt(away.motes)} motes.
            {best ? ` Rarest: ${best.name} (${oddsText(best)}).` : ''}
            {away.fresh.length ? ` New: ${away.fresh.map((id) => auraById(id)?.name).join(', ')}.` : ''}
          </p>
          <button type="button" className="i-btn i-btn--sm i-btn--sig" onClick={dismissAuraAway}>
            Back to the dial
          </button>
        </div>
      )}
      <Tape s={s} left={left} />
      <Luck s={s} ext={ext} />
      <Incense s={s} ext={ext} />
      <div className="au-tabs" role="group" aria-label="Aura Dial">
        {TABS.map((t) => (
          <button key={t.id} type="button" aria-pressed={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
            {t.id === 'index' ? ` ${foundCount(s)}/${AURAS.length}` : ''}
          </button>
        ))}
      </div>
      {tab === 'index' ? <Index s={s} /> : tab === 'nums' ? <Numbers s={s} ext={ext} /> : <Upgrades s={s} />}
    </>
  );
}

/** The last few turns of the dial. */
function Tape({ s, left }: { s: AuraSave; left: number }) {
  const { tape } = useAura();
  return (
    <div className="au-tape">
      <ul aria-label="Latest rolls">
        {[...tape].reverse().map((h) => {
          const a = auraById(h.id);
          return a ? (
            <li key={h.n} style={tierStyle(a)} className={h.fresh ? 'is-new' : ''}>
              <span aria-hidden="true">{a.kanji}</span> {a.name}
            </li>
          ) : null;
        })}
        {!tape.length && <li className="is-none">{s.rolls ? 'Rolling…' : 'Nothing rolled yet'}</li>}
      </ul>
      <small>
        Charged roll (luck {x(chargeMult(s))}) in {left} roll{left === 1 ? '' : 's'}
      </small>
    </div>
  );
}

/** Where the luck comes from. */
function Luck({ s, ext }: { s: AuraSave; ext: Ext }) {
  const n = foundCount(s);
  return (
    <ul className="wk-boosts" aria-label="Where your luck comes from">
      <li className={charmMult(s) > 1 ? 'is-on' : ''}>
        <b>Charms {x(charmMult(s))}</b>
        <small>Omamori and the bolt feed</small>
      </li>
      <li className={n ? 'is-on' : ''}>
        <b>Index {x(indexMult(s))}</b>
        <small>
          {n} of {AURAS.length} auras · +{Math.round(INDEX_LUCK * 100)}% each
        </small>
      </li>
      <li className={lifeMult(ext) > 1 ? 'is-on' : ''}>
        <b>Today {x(lifeMult(ext))}</b>
        <small>{ext.sections ? `${ext.sections} section${ext.sections === 1 ? '' : 's'} logged` : 'Log something today: +15% a section'} · streak {ext.streak}</small>
      </li>
      <li className="is-on">
        <b>Charged {x(chargeMult(s))}</b>
        <small>Every {chargeEvery(s)}th roll</small>
      </li>
    </ul>
  );
}

function Incense({ s, ext }: { s: AuraSave; ext: Ext }) {
  const cost = incenseCost(s, ext);
  const full = s.incense + INCENSE_ROLLS > INCENSE_MAX;
  return (
    <button type="button" className="wk-crate au-incense" disabled={full || cost > s.motes} onClick={lightIncense} aria-label={`Light incense for ${fmt(cost)} motes`}>
      <span aria-hidden="true">香</span>
      <span>
        <b>
          Light incense: {INCENSE_ROLLS} rolls at luck ×{INCENSE_MULT} · {MOTE} {fmt(cost)}
        </b>
        <small>{s.incense ? `Burning: ${fmt(s.incense)} rolls left${full ? ' (as much as the burner holds)' : ''}.` : 'Counts rolls, not minutes, so it burns while you are away too.'}</small>
      </span>
    </button>
  );
}

// ─── upgrades ───────────────────────────────────────────────────────────────

const nowText = (u: AuraUpgrade, s: AuraSave): string => {
  switch (u.id) {
    case 'speed':
      return `A turn every ${intervalOf(s).toFixed(2)} s`;
    case 'luck':
      return `Luck ×${(1.12 ** (s.ups.luck ?? 0)).toFixed(2)}`;
    case 'sieve':
      return `Motes ${x(sieveMult(s))}`;
    case 'multi':
      return `${multiOf(s)} roll${multiOf(s) === 1 ? '' : 's'} a turn`;
    case 'charge':
      return `Charged roll: luck ×${chargeMult(s)}`;
    case 'fuse':
      return `Every ${chargeEvery(s)}th roll is charged`;
    case 'hand':
      return `Your own rolls: luck ×${handMult(s)}`;
    case 'night':
      return `Rolls for ${awayHoursOf(s)} hours without you`;
    case 'sleep':
      return `${Math.round(awayEffOf(s) * 100)}% speed while you are away`;
    case 'feed':
      return `Luck ×${(1.1 ** (s.ups.feed ?? 0)).toFixed(2)}`;
    default:
      return '';
  }
};

function Upgrades({ s }: { s: AuraSave }) {
  const bolts = useWorks().save.bolts;
  return (
    <>
      <H2 aside={`${MOTE} ${fmt(s.motes)}`}>Upgrades</H2>
      <div className="wk-list">
        {AURA_UPGRADES.map((u) => {
          const lv = s.ups[u.id] ?? 0;
          const cost = upgradeCost(s, u.id);
          const have = u.cur === 'bolts' ? bolts : s.motes;
          return (
            <div key={u.id} className={`wk-row${lv ? ' is-on' : ''}`}>
              <span className="wk-row__k" aria-hidden="true">
                {u.kanji}
              </span>
              <div className="wk-row__t">
                <b>
                  {u.name}
                  <em>
                    {' '}
                    {lv}/{u.max}
                  </em>
                </b>
                <small>{u.blurb}</small>
                <small className="wk-row__n">Now: {nowText(u, s)}</small>
              </div>
              {cost !== null ? (
                <button type="button" className="i-btn i-btn--sm wk-buy" disabled={cost > have} aria-label={`${u.name}: level ${lv + 1} for ${fmt(cost)} ${u.cur}`} onClick={() => buyAuraUp(u.id)}>
                  <span>{lv ? 'Level up' : 'Buy'}</span>
                  <small>
                    {u.cur === 'bolts' ? '螺' : MOTE} {fmt(cost)}
                  </small>
                </button>
              ) : (
                <small className="wk-row__max">Full</small>
              )}
            </div>
          );
        })}
      </div>
      <p className="i-note">
        The dial rolls at full speed while this room is open. Anywhere else, or with the app shut, it keeps going for up to {awayHoursOf(s)} hours at {Math.round(awayEffOf(s) * 100)}% speed, and anything rare it lands on plays when you next open the app.
      </p>
    </>
  );
}

// ─── the index ──────────────────────────────────────────────────────────────

function Index({ s }: { s: AuraSave }) {
  const found = AURAS.filter((a) => s.got[a.id]);
  const [picked, setPicked] = useState<string | null>(null);
  const show = auraById(picked && s.got[picked] ? picked : (s.worn ?? found[found.length - 1]?.id));
  const cogs = auraCogs(found.map((a) => a.id));
  return (
    <>
      <H2 aside={`${found.length} of ${AURAS.length}`}>Index</H2>
      <p className="i-note">
        Each aura you roll adds {INDEX_LUCK * 100}% luck here and {INDEX_WORKS * 100}% to what the factory’s machines make, and pays gold cogs once ({cogs} so far). You only see an aura once you’ve rolled it.
      </p>
      {show && (
        <div className="au-show" style={tierStyle(show)}>
          <div className="au-show__fx">
            <AuraCanvas key={show.id} id={show.id} scale={0.24} />
            <span aria-hidden="true">{show.kanji}</span>
          </div>
          <div className="au-show__t">
            <small className="au-tier">{AURA_TIERS[show.tier].name}</small>
            <b>{show.name}</b>
            <small>
              {oddsText(show)} · rolled {fmt(s.got[show.id])} time{s.got[show.id] === 1 ? '' : 's'}
              {s.first[show.id] ? ` · first on ${s.first[show.id]}` : ''}
            </small>
            <p>{show.blurb}</p>
            <span className="au-show__do">
              <button type="button" className="i-btn i-btn--sm i-btn--sig" aria-pressed={s.worn === show.id} onClick={() => wearAura(s.worn === show.id ? null : show.id)}>
                {s.worn === show.id ? 'Take off' : 'Wear'}
              </button>
              {show.tier >= SCENE_TIER && (
                <button type="button" className="i-btn i-btn--sm" onClick={() => replayScene(show.id)}>
                  Watch its scene
                </button>
              )}
            </span>
          </div>
        </div>
      )}
      <div className="au-grid">
        {AURAS.map((a) => {
          const n = s.got[a.id] ?? 0;
          if (!n) {
            return (
              <div key={a.id} className="au-card is-locked" style={{ '--a': AURA_TIERS[a.tier].color } as CSSProperties} aria-label={`Not rolled yet: ${AURA_TIERS[a.tier].name}, ${oddsText(a)}`}>
                <span className="au-card__fx" aria-hidden="true">
                  ？
                </span>
                <b aria-hidden="true">???</b>
                <small aria-hidden="true">{oddsText(a)}</small>
              </div>
            );
          }
          return (
            <button key={a.id} type="button" className={`au-card${s.worn === a.id ? ' is-worn' : ''}`} style={tierStyle(a)} aria-pressed={show?.id === a.id} aria-label={`${a.name}, ${oddsText(a)}, rolled ${n} time${n === 1 ? '' : 's'}`} onClick={() => setPicked(a.id)}>
              <span className="au-card__fx" aria-hidden="true">
                <AuraCanvas id={a.id} animate={false} scale={0.3} />
                <i>{a.kanji}</i>
              </span>
              <b>{a.name}</b>
              <small>
                {oddsText(a)} · ×{fmt(n)}
              </small>
            </button>
          );
        })}
      </div>
    </>
  );
}

// ─── numbers ────────────────────────────────────────────────────────────────

function Numbers({ s, ext }: { s: AuraSave; ext: Ext }) {
  const rarest = [...AURAS].reverse().find((a) => s.got[a.id]);
  const luck = luckOf(s, ext);
  const stats: [string, string][] = [
    ['Rolls, all time', fmt(s.rolls)],
    ['Rolls by your own hand', fmt(s.hand)],
    ['Motes made, all time', fmt(s.motesAll)],
    ['Motes an average roll leaves', fmt(motesPerRoll(s, luck))],
    ['Rarest aura', rarest ? `${rarest.name} (${oddsText(rarest)})` : 'None yet'],
    ['Luck on a plain roll', x(luck)],
    ['Rolls a second', rollsPerSecond(s).toFixed(2)],
    ['Keeps rolling without you for', `${awayHoursOf(s)} h at ${Math.round(awayEffOf(s) * 100)}%`],
    ['Gold cogs from the index', String(auraCogs(Object.keys(s.got)))],
  ];
  return (
    <>
      <H2>Numbers</H2>
      <dl className="wk-stats">
        {stats.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <p className="i-note">
        How luck works: from the rarest aura down, each has a (luck ÷ its odds) chance of being the one. So at luck ×100, a 1 in 1,000,000 aura is a 1 in 10,000 roll, and nothing commoner than 1 in 100 turns up at all.
      </p>
    </>
  );
}
