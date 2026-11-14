/**
 * 極, body mastery: each body's own level and mastery track, the hall for mastering several, and the
 * hidden bodies' rules. The numbers come from domain/game/mastery.ts; prizes are claim rows.
 */
import type { CSSProperties } from 'react';
import { BODY_LINES, CHASSIS, chassisById, RARITY, type Chassis } from '../../domain/game/catalog';
import { BODY_MAX, bodyPrizes, bodySections, hallState, METAL, MP, OWN_MULT, secretById, secretOpen, TIERS, type BodyStat, type Prize } from '../../domain/game/mastery';
import { chassisMk } from '../../domain/game/wallet';
import { sectionInfo } from '../../domain/sections';
import { lootLines, num, Thumb } from './bits';
import { showReveal } from './revealStore';
import { claimAllPrizes, claimPrize, wakeSecret, type Bodies, type GameState } from './store';
import './bodies.css';

const tierOf = (s: BodyStat) => (s.tiers ? TIERS[s.tiers - 1] : null);

/** A medal: the metal of the tier reached, with I, II or III. */
export function Medal({ s, small }: { s: BodyStat; small?: boolean }) {
  const t = tierOf(s);
  if (!t) return null;
  const roman = t.name.split(' ')[1];
  return (
    <span className={`gm-medal${small ? ' gm-medal--sm' : ''}`} style={{ '--a': METAL[t.metal].color } as CSSProperties} title={`${t.name} mastery`} aria-label={`${t.name} mastery`}>
      <i aria-hidden="true">{METAL[t.metal].kanji}</i>
      <span aria-hidden="true">{roman}</span>
    </span>
  );
}

/** The level line on a garage card. */
export function CardLevel({ s }: { s: BodyStat | undefined }) {
  if (!s) return null;
  return (
    <span className="gm-cardlv">
      <b>LV {s.level}</b>
      <Medal s={s} small />
    </span>
  );
}

function Bar({ value, max, label }: { value: number; max: number; label: string }) {
  const p = max > 0 ? Math.min(1, value / max) : 1;
  return (
    <span className="gm-bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.min(value, max)}>
      <i style={{ width: `${p * 100}%` }} />
    </span>
  );
}

function claim(p: Prize, name: string) {
  const gain = claimPrize(p.ref);
  if (!gain) return;
  const line = p.special === 'title' ? 'New title in the wardrobe' : p.special === 'cry' ? 'It learned a battle cry' : undefined;
  showReveal({ kind: 'loot', art: 'mastery', title: `${name}: ${p.label}`, line, gain });
}

function claimAll(body?: string) {
  const gain = claimAllPrizes(body);
  if (gain) showReveal({ kind: 'loot', art: 'mastery', title: body ? `${chassisById(body)?.name ?? 'Body'} prizes` : 'Mastery prizes', gain });
}

/** In a body's card: its level, its mastery, and the track of prizes. */
export function BodyPanel({ ch, b, worn }: { ch: Chassis; b: Bodies; worn: boolean }) {
  const s = b.stats.get(ch.id)!;
  const track = bodyPrizes(ch, s);
  const waiting = track.filter((x) => x.reached && !b.claimed.has(x.prize.ref)).length;
  const own = bodySections(ch);
  const next = s.next;
  const prev = tierOf(s)?.at ?? 0;
  return (
    <div className="gm-body">
      <div className="gm-body__row">
        <span className="gm-body__lv" aria-hidden="true">
          {s.level}
        </span>
        <span className="gm-body__t">
          <b>
            Body level {s.level}
            {s.max ? ' · MAX' : ''}
          </b>
          {s.max ? <small>{num(s.xp)} body XP. Mastery keeps going.</small> : <Bar value={s.into} max={s.need} label={`${ch.name} level ${s.level}`} />}
          {!s.max && (
            <small>
              {num(s.into)} / {num(s.need)} to level {s.level + 1} (max {BODY_MAX})
            </small>
          )}
        </span>
      </div>
      <div className="gm-body__row">
        {tierOf(s) ? <Medal s={s} /> : <span className="gm-medal gm-medal--none" aria-hidden="true">極</span>}
        <span className="gm-body__t">
          <b>{tierOf(s) ? `${tierOf(s)!.name} mastery` : 'No mastery yet'}</b>
          {next ? <Bar value={s.mp - prev} max={next.at - prev} label={`Mastery towards ${next.name}`} /> : <Bar value={1} max={1} label="Mastery complete" />}
          <small>{next ? `${num(s.mp)} / ${num(next.at)} points to ${next.name}` : `${num(s.mp)} points. Fully mastered.`}</small>
        </span>
      </div>
      <p className="i-note">
        {worn ? 'You\'re piloting it: what you log now trains it.' : 'Wear it to train it: only the body you\'re piloting earns.'} Its own sections ({own.map((x) => sectionInfo(x).name).join(', ') || 'none'}) count ×{OWN_MULT} for its level and {MP.own} mastery a session (others {MP.session}); +{MP.day} a day you turn up with it, +{MP.daily} for a cleared daily board, +{MP.boss} a boss. {s.sessions ? `${s.sessions} session${s.sessions === 1 ? '' : 's'} over ${s.days} day${s.days === 1 ? '' : 's'} so far.` : ''}
      </p>
      {waiting > 1 && (
        <button type="button" className="i-btn i-btn--sig" onClick={() => claimAll(ch.id)}>
          Claim all {waiting}
        </button>
      )}
      <ol className="gm-track" aria-label={`${ch.name}'s prizes`}>
        {track.map(({ prize, reached, kind }) => {
          const got = b.claimed.has(prize.ref);
          const metal = kind === 'tier' ? TIERS.find((t) => prize.ref.endsWith(`:${t.id}`))!.metal : null;
          return (
            <li key={prize.ref} className={`gm-track__step${got ? ' is-got' : reached ? ' is-ready' : ''}`} style={metal ? ({ '--a': METAL[metal].color } as CSSProperties) : undefined}>
              <span className="gm-track__k" aria-hidden="true">
                {kind === 'level' ? prize.label.split(' ')[1] : METAL[metal!].kanji}
              </span>
              <span className="gm-track__t">
                <b>{prize.label}</b>
                <small>
                  {prize.special === 'cry' ? `Battle cry: “${BODY_LINES[ch.id]}” · ` : prize.special === 'title' ? 'Its own title · ' : ''}
                  {lootLines({ ...prize.gain, items: undefined }).map((l) => l.label).join(', ')}
                </small>
              </span>
              <span className="gm-track__do">
                {got ? (
                  <small className="gm-shop__own">Claimed</small>
                ) : reached ? (
                  <button type="button" className="i-btn i-btn--sm i-btn--sig" onClick={() => claim(prize, ch.name)}>
                    Claim
                  </button>
                ) : (
                  <small>{kind === 'level' ? `LV ${prize.label.split(' ')[1]}` : `${num(TIERS.find((t) => prize.ref.endsWith(`:${t.id}`))!.at)} pts`}</small>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** In a hidden body's card, before it's awake: its rule and how close you are. */
export function SecretPanel({ ch, b }: { ch: Chassis; b: Bodies }) {
  const rule = secretById(ch.id);
  if (!rule) return null;
  const [have, need] = rule.progress(b.facts);
  const open = secretOpen(ch.id, b.facts);
  return (
    <div className="gm-secret">
      <p>
        <b>To wake it:</b> {rule.rule}.
      </p>
      {need > 1 && (
        <>
          <Bar value={have} max={need} label={`${ch.name}: ${rule.rule}`} />
          <small className="i-note">
            {num(have)} / {num(need)}
          </small>
        </>
      )}
      {open ? (
        <button type="button" className="i-btn i-btn--sig" onClick={() => wakeSecret(ch.id)}>
          Wake it up (free)
        </button>
      ) : (
        <p className="i-note">Never sold. Meet the rule and Mk I is yours for nothing; Mk II and III are built as usual.</p>
      )}
    </div>
  );
}

/** What the plate in the bay says about the body you're piloting. */
export function PilotPlate({ ch, b, g }: { ch: Chassis | undefined; b: Bodies; g: GameState }) {
  const s = ch ? b.stats.get(ch.id) : undefined;
  const cry = ch && g.wallet.items.has(`cry:${ch.id}`) ? BODY_LINES[ch.id] : null;
  return (
    <>
      {cry && (
        <p className="gm-cry" aria-label={`${ch!.name} says: ${cry}`}>
          “{cry}”
        </p>
      )}
      {s && (
        <span className="gm-pilot">
          <b>Body LV {s.level}</b>
          <Medal s={s} small />
          {!s.max && <Bar value={s.into} max={s.need} label={`${ch!.name} level ${s.level}`} />}
        </span>
      )}
    </>
  );
}

/** Prizes waiting anywhere: a button in the bay. */
export function WaitingPrizes({ b }: { b: Bodies }) {
  const n = b.waiting.length;
  if (!n) return null;
  return (
    <button type="button" className="gm-waiting" onClick={() => claimAll()}>
      <span className="gm-waiting__k" aria-hidden="true">
        極
      </span>
      <span className="gm-waiting__t">
        <b>
          {n} mastery prize{n === 1 ? '' : 's'} waiting
        </b>
        <small>From your bodies' levels and mastery. Tap to claim them all.</small>
      </span>
      <span aria-hidden="true">▶</span>
    </button>
  );
}

/** The wardrobe's Mastery slot: the hall, then every body by mastery. */
export function MasteryHall({ b, g, onOpen }: { b: Bodies; g: GameState; onOpen: (id: string) => void }) {
  const hall = hallState(b.stats);
  const list = CHASSIS.map((c) => ({ c, s: b.stats.get(c.id)!, mk: chassisMk(g.wallet, c.id) }))
    .filter((x) => x.mk > 0 || x.s.mp > 0)
    .sort((x, y) => y.s.mp - x.s.mp || y.s.xp - x.s.xp);
  const secrets = CHASSIS.filter((c) => c.unlock);
  const awake = secrets.filter((c) => chassisMk(g.wallet, c.id) > 0).length;
  return (
    <>
      <p className="i-note">
        Every body levels and masters on its own, while your overall level stays the drone's. Only the body you're piloting earns. Levels stop at {BODY_MAX}; mastery runs Bronze I to Gold III ({num(TIERS[TIERS.length - 1].at)} points), and each step pays. Silver III teaches the body a battle cry; Gold III gives its own title.
      </p>
      <div className="gm-hall">
        {hall.map((h) => {
          const got = b.claimed.has(`hall:${h.id}`);
          return (
            <div key={h.id} className={`gm-set${got ? ' is-done' : h.reached ? ' is-ready' : ''}`}>
              <span className="gm-set__k" aria-hidden="true">
                極
              </span>
              <span className="gm-set__t">
                <b>“{h.name}”</b>
                <small>
                  {h.need} · {Math.min(h.have, h.count)} / {h.count}
                </small>
              </span>
              <span className="gm-set__do">
                {got ? (
                  <small className="gm-shop__own">Claimed</small>
                ) : h.reached ? (
                  <button
                    type="button"
                    className="i-btn i-btn--sm i-btn--sig"
                    onClick={() => {
                      const gain = claimPrize(`hall:${h.id}`);
                      if (gain) showReveal({ kind: 'loot', art: 'mastery', title: 'Mastery hall', line: `New title: “${h.name}”`, gain });
                    }}
                  >
                    Claim
                  </button>
                ) : (
                  <small>{lootLines({ ...h.gain, items: undefined }).map((l) => l.label).join(', ')}</small>
                )}
              </span>
            </div>
          );
        })}
      </div>
      <h3 className="gm-hall__h">
        Hidden bodies <small>{awake} of {secrets.length} awake</small>
      </h3>
      <div className="gm-grid">
        {secrets.map((c) => {
          const mk = chassisMk(g.wallet, c.id);
          const open = !mk && secretOpen(c.id, b.facts);
          const [have, need] = secretById(c.id)!.progress(b.facts);
          return (
            <button key={c.id} type="button" className={`gm-card${mk ? '' : ' is-locked'}${open ? ' is-ready' : ''}`} style={{ '--a': RARITY[c.rarity].color } as CSSProperties} onClick={() => onOpen(c.id)} aria-label={`${c.name}${mk ? ', awake' : open ? ', ready to wake' : `, hidden: ${secretById(c.id)!.rule}`}`}>
              {mk ? <Thumb look={{ chassis: c.id }} mk={mk} /> : <span className="gm-thumb gm-thumb--word" aria-hidden="true">?</span>}
              <b>{mk ? c.name : '???'}</b>
              <small>{mk ? `LV ${b.stats.get(c.id)!.level}` : open ? 'Ready to wake!' : need > 1 ? `${num(have)} / ${num(need)}` : 'Hidden'}</small>
            </button>
          );
        })}
      </div>
      <h3 className="gm-hall__h">
        Your bodies <small>by mastery</small>
      </h3>
      {list.length ? (
        <div className="i-pnl i-pnl--flush">
          {list.map(({ c, s, mk }) => (
            <button key={c.id} type="button" className="i-row gm-hallrow" onClick={() => onOpen(c.id)}>
              <Thumb look={{ chassis: c.id }} mk={mk || 1} />
              <span className="i-row__t">
                <b>{c.name}</b>
                <small>
                  LV {s.level} · {tierOf(s)?.name ?? 'no mastery yet'} · {num(s.mp)} pts
                </small>
              </span>
              <Medal s={s} small />
            </button>
          ))}
        </div>
      ) : (
        <p className="i-note">Build a body and wear it, then log something: it starts levelling straight away.</p>
      )}
    </>
  );
}
