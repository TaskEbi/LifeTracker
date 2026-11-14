/**
 * 廠 The Works: turn the gear, buy machines, and let them make bolts while you're away. Bolts stay in
 * the factory; gold cogs (from milestones, the lucky cat, rebuilds and the daily crate) buy cosmetics
 * at the counter. Logic in domain/game/idle.ts, saving in worksStore.ts.
 */
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { navigate, useRoute } from '../../app/router';
import { useProgress } from '../../data/lt';
import { CHASSIS, COSMETIC_NAME, cosmeticOf, RARITY, type CosmeticKind } from '../../domain/game/catalog';
import {
  awayEff,
  auraMult,
  awayHours,
  CAT_COGS_A_DAY,
  crateCogs,
  critChance,
  extMult,
  FEVER_MULT,
  FLOORS,
  fmt,
  fmtTime,
  foremanMult,
  FRENZY_MULT,
  fuelMult,
  GEAR_SKINS,
  genCost,
  genRate,
  GENS,
  headStart,
  heatMult,
  machineRate,
  maxBuy,
  MILESTONES,
  nextPrintAt,
  PERKS,
  PRINT_BONUS,
  printsFree,
  printsMult,
  printsWaiting,
  rateNow,
  REBUILD_COGS,
  ROBOT_GOODS,
  streakMult,
  tapValue,
  UPGRADES,
  upgradesFor,
  type Ext,
  type IdleSave,
} from '../../domain/game/idle';
import { AuraRoom, AuraStage } from './AuraRoom';
import { chassisMk } from '../../domain/game/wallet';
import { H2 } from '../../ui/i/bits';
import { Robot } from '../../ui/i/bots/Robot';
import { ItemThumb, Rar } from './bits';
import { setLoadout, useGame, useLoadout } from './store';
import {
  buyEveryUpgrade,
  buyGood,
  buyMachine,
  buyWorksPerk,
  buyWorksUpgrade,
  catchTheCat,
  claimCrate,
  dismissAway,
  dropPop,
  rebuildWorks,
  setWorksLook,
  turn,
  useCogs,
  useExt,
  useWorks,
  useWorksLook,
  useWorksRunning,
} from './worksStore';
import './works.css';

const ROOMS = [
  { id: 'floor', label: 'Machines', kanji: '機' },
  { id: 'tune', label: 'Upgrades', kanji: '改' },
  { id: 'plans', label: 'Rebuild', kanji: '図' },
  { id: 'counter', label: 'Counter', kanji: '歯' },
  { id: 'book', label: 'Records', kanji: '録' },
  { id: 'aura', label: 'Auras', kanji: '霊' },
] as const;
type RoomId = (typeof ROOMS)[number]['id'];

const pct = (m: number) => `+${Math.round((m - 1) * 100)}%`;
const BOLT = '螺';

export default function WorksTab() {
  useWorksRunning();
  const route = useRoute();
  const room: RoomId = ROOMS.find((x) => x.id === route.rest[1])?.id ?? 'floor';
  const live = useWorks();
  const ext = useExt();
  const cogs = useCogs();
  const s = live.save;
  const offers = live.ready ? upgradesFor(s) : [];
  const canBuy = offers.filter((u) => u.cost <= s.bolts).length;
  if (!live.ready) {
    return (
      <section className="wk" aria-label="The Works">
        <p className="i-note">Opening the factory…</p>
      </section>
    );
  }
  return (
    <section className="wk" aria-label="The Works">
      {room === 'aura' ? <AuraStage ext={ext} /> : <Stage s={s} ext={ext} heat={live.heat} />}
      {live.away && (
        <div className="wk-away" role="status">
          <b>While you were away</b>
          <p>
            You were gone {fmtTime(live.away.gap)}. The crew worked {fmtTime(live.away.worked)}
            {live.away.capped ? ` (as long as they will without you)` : ''} at {Math.round(live.away.eff * 100)}% and made <strong>{fmt(live.away.gained)} bolts</strong>.
          </p>
          <button type="button" className="i-btn i-btn--sm i-btn--sig" onClick={dismissAway}>
            Back to work
          </button>
        </div>
      )}
      <Crate s={s} ext={ext} />
      <nav className="wk-rooms" aria-label="The Works">
        {ROOMS.map((r) => (
          <button key={r.id} type="button" className="wk-room" aria-current={room === r.id ? 'page' : undefined} onClick={() => navigate('hangar', r.id === 'floor' ? ['works'] : ['works', r.id], { replace: true })}>
            <span aria-hidden="true">{r.kanji}</span>
            <b>{r.label}</b>
            {r.id === 'tune' && canBuy > 0 && <i className="gm-tab__n">{canBuy}</i>}
            {r.id === 'plans' && printsWaiting(s) > 0 && <i className="gm-tab__n">{fmt(printsWaiting(s))}</i>}
          </button>
        ))}
      </nav>
      {room === 'aura' ? <AuraRoom ext={ext} /> : room === 'tune' ? <Tune s={s} /> : room === 'plans' ? <Plans s={s} /> : room === 'counter' ? <Counter cogs={cogs} s={s} ext={ext} /> : room === 'book' ? <Book s={s} ext={ext} cogs={cogs} /> : <Floor s={s} ext={ext} />}
    </section>
  );
}

// ─── the stage: the gear, the count, the cat ────────────────────────────────

function Stage({ s, ext, heat }: { s: IdleSave; ext: Ext; heat: number }) {
  const live = useWorks();
  const look = useWorksLook();
  const bot = useLoadout();
  const g = useGame();
  const p = useProgress();
  const now = Date.now();
  const rate = rateNow(s, ext, now);
  const boost = s.boost && s.boost.until > now ? s.boost : null;
  const ch = CHASSIS.find((c) => c.id === bot.chassis);
  const mk = ch ? chassisMk(g.wallet, ch.id) || 1 : undefined;
  const hm = heatMult(heat);
  return (
    <div className={`wk-stage${boost ? ` is-${boost.k}` : ''}`} data-floor={look.floor}>
      <div className="wk-stage__bg" aria-hidden="true" />
      <div className="wk-count">
        <p className="wk-count__n" aria-label={`${fmt(s.bolts)} bolts`}>
          <i aria-hidden="true">{BOLT}</i>
          <b aria-hidden="true">{fmt(s.bolts)}</b>
        </p>
        <p className="wk-count__r">
          {fmt(rate)} a second · {fmt(tapValue(s, ext, now, heat))} a turn
        </p>
      </div>
      <div className="wk-bot i-drone" aria-hidden="true">
        <Robot stage={p.overall.stage} look={bot} mk={mk} label={false} />
      </div>
      <div className="wk-gearbox">
        <button
          type="button"
          className={`wk-gear${hm >= 3 ? ' is-hot' : ''}`}
          aria-label="Turn the gear"
          onPointerDown={(e) => {
            if (e.button === 0) turn();
          }}
          onClick={(e) => {
            if (e.detail === 0) turn();
          }}
        >
          <span className="wk-gear__art" style={{ '--turn': `${s.taps * 15}deg` } as CSSProperties}>
            <GearArt skin={look.gear} />
          </span>
        </button>
        {live.pops.map((pop) => (
          <span key={pop.id} className={`wk-pop${pop.crit ? ' is-crit' : ''}`} style={{ '--x': `${pop.x}px` } as CSSProperties} onAnimationEnd={() => dropPop(pop.id)} aria-hidden="true">
            {pop.text}
            {pop.crit ? '!' : ''}
          </span>
        ))}
      </div>
      <div className="wk-heat" role="progressbar" aria-label="Heat" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(heat)}>
        <i style={{ width: `${heat}%` }} />
        <span>{hm > 1 ? `Heat ×${hm}` : 'Keep turning to heat it up'}</span>
      </div>
      {live.cat && (
        <button key={live.cat.n} type="button" className="wk-cat" aria-label="Catch the lucky cat" style={{ left: `${live.cat.x * 100}%`, top: `${live.cat.y * 100}%` }} onClick={catchTheCat}>
          <CatArt />
        </button>
      )}
      {(boost || live.prize) && (
        <p className="wk-flash" role="status">
          {boost ? `${boost.k === 'frenzy' ? `Frenzy ×${FRENZY_MULT}` : `Tap fever ×${FEVER_MULT}`} · ${Math.ceil((boost.until - now) / 1000)} s` : live.prize!.text}
        </p>
      )}
    </div>
  );
}

/** The daily crate: gold cogs once a day, doubled when you've logged something. */
function Crate({ s, ext }: { s: IdleSave; ext: Ext }) {
  const g = useGame();
  if (s.crate >= g.today) return null;
  const n = crateCogs(s, ext);
  return (
    <button type="button" className="wk-crate" onClick={claimCrate}>
      <span aria-hidden="true">箱</span>
      <span>
        <b>Open today’s crate: {n} gold cogs</b>
        <small>{ext.sections > 0 ? 'Doubled, because you logged something today.' : 'Log anything today first and it holds twice as many.'}</small>
      </span>
    </button>
  );
}

// ─── machines ───────────────────────────────────────────────────────────────

const AMOUNTS = [
  { id: 1, label: '×1' },
  { id: 10, label: '×10' },
  { id: 'max', label: 'Max' },
] as const;

function Floor({ s, ext }: { s: IdleSave; ext: Ext }) {
  const [amount, setAmount] = useState<1 | 10 | 'max'>(1);
  const total = machineRate(s, ext);
  const mult = extMult(ext) * printsMult(s);
  // Show what you own, and the next two you haven't met yet.
  const top = GENS.reduce((n, g, i) => ((s.gens[g.id] ?? 0) > 0 ? i : n), -1);
  const shown = GENS.slice(0, Math.min(GENS.length, top + 3));
  return (
    <>
      <Boosts s={s} ext={ext} />
      <H2
        aside={
          <span className="wk-amounts" role="group" aria-label="How many to buy">
            {AMOUNTS.map((a) => (
              <button key={a.id} type="button" aria-pressed={amount === a.id} onClick={() => setAmount(a.id)}>
                {a.label}
              </button>
            ))}
          </span>
        }
      >
        Machines
      </H2>
      <div className="wk-list">
        {shown.map((g) => {
          const own = s.gens[g.id] ?? 0;
          const n = amount === 'max' ? Math.max(1, maxBuy(s, g.id)) : amount;
          const cost = genCost(s, g.id, n);
          const each = genRate(s, g.id) * mult;
          const share = total > 0 ? (own * each) / total : 0;
          return (
            <div key={g.id} className={`wk-row${own ? ' is-on' : ''}`}>
              <span className="wk-row__k" aria-hidden="true">
                {g.kanji}
              </span>
              <div className="wk-row__t">
                <b>
                  {g.name}
                  {own > 0 && <em> ×{own}</em>}
                </b>
                <small>{g.blurb}</small>
                <small className="wk-row__n">
                  {fmt(each)}/s each{own > 0 ? ` · ${fmt(own * each)}/s (${Math.round(share * 100)}%)` : ''}
                </small>
              </div>
              <button type="button" className="i-btn i-btn--sm wk-buy" disabled={cost > s.bolts} aria-label={`Buy ${n} ${g.name} for ${fmt(cost)} bolts`} onClick={() => buyMachine(g.id, n)}>
                <span>Buy{n > 1 ? ` ×${n}` : ''}</span>
                <small>
                  {BOLT} {fmt(cost)}
                </small>
              </button>
            </div>
          );
        })}
        {shown.length < GENS.length && <p className="i-note">Something bigger turns up once you own a {shown[shown.length - 2]?.name ?? GENS[0].name}.</p>}
      </div>
      <p className="i-note">
        Close the app and the crew keeps going for up to {awayHours(s)} hours at {Math.round(awayEff(s) * 100)}% speed. Blueprints (Rebuild) make that longer and faster.
      </p>
    </>
  );
}

/** What real life is adding right now. */
function Boosts({ s, ext }: { s: IdleSave; ext: Ext }) {
  return (
    <ul className="wk-boosts" aria-label="What is speeding the factory up">
      <li className={ext.sections ? 'is-on' : ''}>
        <b>Fuel {pct(fuelMult(ext))}</b>
        <small>{ext.sections ? `${ext.sections} section${ext.sections === 1 ? '' : 's'} logged today` : 'Log something today: +15% a section'}</small>
      </li>
      <li className={ext.streak ? 'is-on' : ''}>
        <b>Streak {pct(streakMult(ext))}</b>
        <small>{ext.streak ? `${ext.streak}-day streak` : '+1% for each day of your streak'}</small>
      </li>
      <li className={ext.level > 1 ? 'is-on' : ''}>
        <b>Foreman {pct(foremanMult(ext))}</b>
        <small>Your robot is level {ext.level}</small>
      </li>
      <li className={s.printsAll ? 'is-on' : ''}>
        <b>Blueprints {pct(printsMult(s))}</b>
        <small>{s.printsAll ? `${fmt(s.printsAll)} drawn` : 'From rebuilding'}</small>
      </li>
      {auraMult(ext) > 1 && (
        <li className="is-on">
          <b>Auras {pct(auraMult(ext))}</b>
          <small>+0.5% for each aura in the dial’s index</small>
        </li>
      )}
    </ul>
  );
}

// ─── upgrades ───────────────────────────────────────────────────────────────

function Tune({ s }: { s: IdleSave }) {
  const offers = upgradesFor(s);
  const affordable = offers.filter((u) => u.cost <= s.bolts).length;
  const owned = UPGRADES.filter((u) => s.ups.includes(u.id));
  return (
    <>
      <H2 aside={`${s.ups.length} of ${UPGRADES.length} fitted`}>Upgrades</H2>
      {affordable > 1 && (
        <button type="button" className="i-btn i-btn--sig" onClick={buyEveryUpgrade}>
          Buy all {affordable} you can afford
        </button>
      )}
      <div className="wk-list">
        {offers.map((u) => (
          <div key={u.id} className="wk-row">
            <span className="wk-row__k" aria-hidden="true">
              {u.kanji}
            </span>
            <div className="wk-row__t">
              <b>{u.name}</b>
              <small>{u.blurb}</small>
            </div>
            <button type="button" className="i-btn i-btn--sm wk-buy" disabled={u.cost > s.bolts} aria-label={`Buy ${u.name} for ${fmt(u.cost)} bolts`} onClick={() => buyWorksUpgrade(u.id)}>
              <span>Fit</span>
              <small>
                {BOLT} {fmt(u.cost)}
              </small>
            </button>
          </div>
        ))}
        {!offers.length && <p className="i-note">Nothing on offer. Upgrades turn up as you own more machines (10, 25, 50, 100…), turn the gear and make more bolts.</p>}
      </div>
      {owned.length > 0 && (
        <details className="wk-more">
          <summary>Fitted this run ({owned.length})</summary>
          <ul>
            {owned.map((u) => (
              <li key={u.id}>
                <b>{u.name}</b> {u.blurb}
              </li>
            ))}
          </ul>
        </details>
      )}
      <p className="i-note">Perfect turns happen {Math.round(critChance(s) * 100)}% of the time and make ten times as much. Upgrades are for this run: a rebuild takes them off again.</p>
    </>
  );
}

// ─── rebuilding ─────────────────────────────────────────────────────────────

function Plans({ s }: { s: IdleSave }) {
  const [sure, setSure] = useState(false);
  const wait = printsWaiting(s);
  const free = printsFree(s);
  const next = nextPrintAt(s);
  useEffect(() => {
    if (!wait) setSure(false);
  }, [wait]);
  return (
    <>
      <H2 aside={`${fmt(s.printsAll)} drawn · ${fmt(free)} to spend`}>Rebuild</H2>
      <div className="wk-plan">
        <span className="wk-plan__k" aria-hidden="true">
          図
        </span>
        <div>
          <b>{wait ? `${fmt(wait)} blueprint${wait === 1 ? '' : 's'} ready` : 'No blueprint yet'}</b>
          <p>
            Knock the factory down and build it again from better drawings. Machines, upgrades and bolts go. Blueprints, perks, gold cogs and everything from the counter stay. Each blueprint ever drawn adds {Math.round(PRINT_BONUS * 100)}% to what the machines make, for good.
          </p>
          <span className="gm-bar" role="progressbar" aria-label="Towards the next blueprint" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.round((s.life / next) * 100))}>
            <i style={{ width: `${Math.min(100, (s.life / next) * 100)}%` }} />
          </span>
          <small>
            Next blueprint at {fmt(next)} bolts made, all time (now {fmt(s.life)}).
          </small>
          {wait > 0 &&
            (sure ? (
              <span className="wk-plan__do">
                <button type="button" className="i-btn i-btn--sm i-btn--sig" onClick={() => rebuildWorks() && setSure(false)}>
                  Yes, knock it down
                </button>
                <button type="button" className="i-btn i-btn--sm" onClick={() => setSure(false)}>
                  Keep going
                </button>
              </span>
            ) : (
              <button type="button" className="i-btn i-btn--sm i-btn--sig" onClick={() => setSure(true)}>
                Rebuild for {fmt(wait)} blueprint{wait === 1 ? '' : 's'} and {REBUILD_COGS} gold cogs
              </button>
            ))}
        </div>
      </div>

      <H2 aside="kept through every rebuild">Perks</H2>
      <div className="wk-list">
        {PERKS.map((p) => {
          const lv = s.perks[p.id] ?? 0;
          const cost = lv < p.max ? p.cost(lv) : null;
          return (
            <div key={p.id} className={`wk-row${lv ? ' is-on' : ''}`}>
              <span className="wk-row__k" aria-hidden="true">
                {p.kanji}
              </span>
              <div className="wk-row__t">
                <b>
                  {p.name}
                  <em>
                    {' '}
                    {lv}/{p.max}
                  </em>
                </b>
                <small>{p.blurb}</small>
                {p.id === 'head' && lv > 0 && <small className="wk-row__n">Now: start with {fmt(headStart(s))} bolts</small>}
              </div>
              {cost !== null ? (
                <button type="button" className="i-btn i-btn--sm wk-buy" disabled={cost > free} aria-label={`${p.name}: level ${lv + 1} for ${cost} blueprint${cost === 1 ? '' : 's'}`} onClick={() => buyWorksPerk(p.id)}>
                  <span>{lv ? 'Level up' : 'Learn'}</span>
                  <small>図 {fmt(cost)}</small>
                </button>
              ) : (
                <small className="wk-row__max">Full</small>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── the counter: cosmetics for gold cogs ───────────────────────────────────

const KINDS: CosmeticKind[] = ['title', 'paint', 'hat', 'pet', 'aura'];

function Cog({ n, short }: { n: number; short?: boolean }) {
  return (
    <span className={`gm-amt${short ? ' is-short' : ''}`} style={{ '--a': '#ffc23d' } as CSSProperties} aria-label={`${n} gold cog${n === 1 ? '' : 's'}${short ? ', not enough' : ''}`}>
      <i aria-hidden="true">歯</i>
      <span aria-hidden="true">{n}</span>
    </span>
  );
}

function Good({ name, sub, thumb, price, owned, on, cogs, onBuy, onUse, useWord = 'Use', rarity }: { name: string; sub?: ReactNode; thumb: ReactNode; price: number; owned: boolean; on: boolean; cogs: number; onBuy: () => void; onUse: () => void; useWord?: string; rarity: keyof typeof RARITY }) {
  return (
    <div className={`gm-card wk-good${on ? ' is-worn' : ''}`} style={{ '--a': RARITY[rarity].color } as CSSProperties}>
      {thumb}
      <b>{name}</b>
      {sub}
      {owned ? (
        <button type="button" className="i-btn i-btn--sm" aria-pressed={on} aria-label={`${on ? 'In use' : useWord}: ${name}`} onClick={onUse}>
          {on ? 'In use' : useWord}
        </button>
      ) : price === 0 ? null : (
        <button type="button" className="i-btn i-btn--sm" disabled={cogs < price} aria-label={`Buy ${name} for ${price} gold cogs`} onClick={onBuy}>
          <Cog n={price} short={cogs < price} />
        </button>
      )}
    </div>
  );
}

function Counter({ cogs, s, ext }: { cogs: number; s: IdleSave; ext: Ext }) {
  const g = useGame();
  const p = useProgress();
  const bot = useLoadout();
  const look = useWorksLook();
  const has = (item: string) => g.wallet.items.has(item);
  const catLeft = CAT_COGS_A_DAY - (s.catDay === g.today ? s.catCogs : 0);
  return (
    <>
      <H2 aside={<Cog n={cogs} />}>The counter</H2>
      <p className="i-note">
        Everything here costs gold cogs, and it’s yours for good. Cogs come from milestones (Records), new auras on the dial (Auras), the daily crate ({crateCogs(s, ext)} today), the lucky cat ({catLeft} left today) and each rebuild ({REBUILD_COGS}). Robot gear bought here shows up in the Hangar’s wardrobe.
      </p>
      {KINDS.map((kind) => {
        const goods = ROBOT_GOODS.filter((x) => x.item.startsWith(`${kind}:`));
        return (
          <div key={kind} className="gm-group">
            <h3>For your robot: {COSMETIC_NAME[kind].toLowerCase()}</h3>
            <div className="gm-grid">
              {goods.map((x) => {
                const c = cosmeticOf(x.item);
                if (!c) return null;
                return (
                  <Good
                    key={x.item}
                    name={c.entry.name}
                    rarity={c.entry.rarity}
                    sub={<Rar r={c.entry.rarity} />}
                    thumb={<ItemThumb item={x.item} stage={p.overall.stage} />}
                    price={x.price}
                    owned={has(x.item)}
                    on={bot[kind] === c.entry.id}
                    cogs={cogs}
                    useWord="Wear"
                    onBuy={() => buyGood(x.item)}
                    onUse={() => setLoadout({ [kind]: bot[kind] === c.entry.id ? null : c.entry.id })}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
      <div className="gm-group">
        <h3>The gear you turn</h3>
        <div className="gm-grid">
          {GEAR_SKINS.map((x) => (
            <Good
              key={x.id}
              name={x.name}
              rarity={x.rarity}
              sub={<small>{x.blurb}</small>}
              thumb={
                <span className="gm-thumb wk-thumb" aria-hidden="true">
                  <GearArt skin={x.id} />
                </span>
              }
              price={x.price}
              owned={x.price === 0 || has(`wgear:${x.id}`)}
              on={look.gear === x.id}
              cogs={cogs}
              onBuy={() => buyGood(`wgear:${x.id}`) && setWorksLook({ gear: x.id })}
              onUse={() => setWorksLook({ gear: x.id })}
            />
          ))}
        </div>
      </div>
      <div className="gm-group">
        <h3>The factory floor</h3>
        <div className="gm-grid">
          {FLOORS.map((x) => (
            <Good
              key={x.id}
              name={x.name}
              rarity={x.rarity}
              sub={<small>{x.blurb}</small>}
              thumb={<span className="gm-thumb wk-thumb wk-swatch" data-floor={x.id} aria-hidden="true" />}
              price={x.price}
              owned={x.price === 0 || has(`wfloor:${x.id}`)}
              on={look.floor === x.id}
              cogs={cogs}
              onBuy={() => buyGood(`wfloor:${x.id}`) && setWorksLook({ floor: x.id })}
              onUse={() => setWorksLook({ floor: x.id })}
            />
          ))}
        </div>
      </div>
    </>
  );
}

// ─── records ────────────────────────────────────────────────────────────────

function Book({ s, ext, cogs }: { s: IdleSave; ext: Ext; cogs: number }) {
  const done = new Set(s.done);
  const machines = Object.values(s.gens).reduce((a, b) => a + b, 0);
  const stats: [string, string][] = [
    ['Bolts made, all time', fmt(s.life)],
    ['Bolts made this run', fmt(s.run)],
    ['Best bolts a second', fmt(Math.max(s.best, rateNow(s, ext, Date.now())))],
    ['Turns of the gear', fmt(s.taps)],
    ['Perfect turns', fmt(s.crits)],
    ['Machines running', fmt(machines)],
    ['Lucky cats caught', fmt(s.cats)],
    ['Rebuilds', fmt(s.rebuilds)],
    ['Blueprints drawn', fmt(s.printsAll)],
    ['Gold cogs earned', fmt(s.cogs)],
    ['Gold cogs in hand', fmt(cogs)],
  ];
  return (
    <>
      <H2 aside={`${s.done.length} of ${MILESTONES.length}`}>Milestones</H2>
      <ul className="wk-miles">
        {MILESTONES.map((m) => {
          const [a, b] = m.at(s);
          const got = done.has(m.id);
          return (
            <li key={m.id} className={got ? 'is-done' : ''}>
              <span>
                <b>{m.name}</b>
                <small>{m.hint}</small>
                {!got && b > 1 && (
                  <span className="gm-bar" role="progressbar" aria-label={m.name} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.round((a / b) * 100))}>
                    <i style={{ width: `${Math.min(100, (a / b) * 100)}%` }} />
                  </span>
                )}
              </span>
              <span className="wk-miles__c">{got ? '済' : <Cog n={m.cogs} />}</span>
            </li>
          );
        })}
      </ul>
      <H2>Numbers</H2>
      <dl className="wk-stats">
        {stats.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}

// ─── art ────────────────────────────────────────────────────────────────────

const INK = '#17131f';
const cog = (n: number, R: number, r: number) => {
  const step = 360 / n;
  const pt = (rad: number, deg: number) => `${(rad * Math.cos((deg * Math.PI) / 180)).toFixed(2)} ${(rad * Math.sin((deg * Math.PI) / 180)).toFixed(2)}`;
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = i * step;
    pts.push(pt(r, a - step * 0.28), pt(R, a - step * 0.17), pt(R, a + step * 0.17), pt(r, a + step * 0.28));
  }
  return `M${pts.join('L')}Z`;
};
const COG = cog(12, 56, 45);

/** The thing you turn, in whichever look is chosen. Drawn in a 120 × 120 box round the middle. */
export function GearArt({ skin }: { skin: string }) {
  const ink = { stroke: INK, strokeWidth: 3, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  let art: ReactNode;
  if (skin === 'koban') {
    art = (
      <>
        <ellipse rx="40" ry="55" fill="#f5b942" {...ink} />
        <ellipse rx="33" ry="48" fill="none" stroke="#b45309" strokeWidth="2" />
        {[-34, -24, -14, 14, 24, 34].map((y) => (
          <path key={y} d={`M${-26 + Math.abs(y) * 0.25} ${y}H${26 - Math.abs(y) * 0.25}`} stroke="#b45309" strokeWidth="2.4" strokeLinecap="round" />
        ))}
        <rect x="-11" y="-9" width="22" height="18" rx="3" fill="#fde68a" stroke="#92400e" strokeWidth="2" />
        <text y="6" textAnchor="middle" fontSize="15" fontWeight="700" fill="#92400e">
          両
        </text>
      </>
    );
  } else if (skin === 'daruma') {
    art = (
      <>
        <path d="M0 -55C34 -55 52 -26 52 6C52 38 30 56 0 56C-30 56 -52 38 -52 6C-52 -26 -34 -55 0 -55Z" fill="#d7263d" {...ink} />
        <path d="M0 -40C22 -40 34 -26 34 -8C34 10 20 20 0 20C-20 20 -34 10 -34 -8C-34 -26 -22 -40 0 -40Z" fill="#fdf0d5" {...ink} />
        <circle cx="-14" cy="-12" r="8" fill="#fff" stroke={INK} strokeWidth="2.4" />
        <circle cx="14" cy="-12" r="8" fill="#fff" stroke={INK} strokeWidth="2.4" />
        <circle cx="-14" cy="-11" r="3.6" fill={INK} />
        <path d="M-24 -26Q-14 -32 -5 -24M24 -26Q14 -32 5 -24" fill="none" stroke={INK} strokeWidth="3.4" strokeLinecap="round" />
        <path d="M-9 6Q0 12 9 6" fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
        <path d="M-16 34Q0 28 16 34M-12 44Q0 39 12 44" fill="none" stroke="#ffd166" strokeWidth="3.4" strokeLinecap="round" />
      </>
    );
  } else if (skin === 'taiko') {
    art = (
      <>
        <circle r="56" fill="#7f1d1d" {...ink} />
        <circle r="46" fill="#fdf6e3" stroke={INK} strokeWidth="2.4" />
        {Array.from({ length: 16 }, (_, i) => (
          <circle key={i} cx={(51 * Math.cos((i * Math.PI) / 8)).toFixed(2)} cy={(51 * Math.sin((i * Math.PI) / 8)).toFixed(2)} r="2.6" fill="#fbbf24" stroke={INK} strokeWidth="1" />
        ))}
        {[0, 120, 240].map((r) => (
          <path key={r} transform={`rotate(${r})`} d="M0 0C-2 -14 6 -26 20 -26C32 -26 38 -14 32 -4C28 -14 14 -16 0 0Z" fill={INK} />
        ))}
      </>
    );
  } else if (skin === 'mochi') {
    art = (
      <>
        <path d="M-52 34C-58 12 -40 -6 0 -6C40 -6 58 12 52 34C46 50 -46 50 -52 34Z" fill="#fff" {...ink} />
        <path d="M-36 -2C-40 -22 -24 -34 0 -34C24 -34 40 -22 36 -2C24 6 -24 6 -36 -2Z" fill="#fff" {...ink} />
        <circle cy="-44" r="13" fill="#fb923c" {...ink} />
        <path d="M0 -57Q8 -64 14 -58Q8 -54 0 -57Z" fill="#16a34a" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        <circle cx="-13" cy="18" r="3" fill={INK} />
        <circle cx="13" cy="18" r="3" fill={INK} />
        <path d="M-5 24Q0 29 5 24" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
        <ellipse cx="-24" cy="25" rx="6" ry="3.4" fill="#fda4af" opacity=".8" />
        <ellipse cx="24" cy="25" rx="6" ry="3.4" fill="#fda4af" opacity=".8" />
      </>
    );
  } else if (skin === 'moon') {
    art = (
      <>
        <circle r="56" fill="#fde68a" {...ink} />
        <circle r="56" fill="none" stroke="#fff7d6" strokeWidth="5" opacity=".7" transform="scale(.9)" />
        <circle cx="-26" cy="-22" r="9" fill="#eab308" opacity=".45" />
        <circle cx="30" cy="-30" r="6" fill="#eab308" opacity=".45" />
        <circle cx="34" cy="24" r="11" fill="#eab308" opacity=".4" />
        <circle cx="-34" cy="26" r="5" fill="#eab308" opacity=".45" />
        {/* The rabbit and its mortar. */}
        <path d="M-12 26C-18 12 -12 0 -2 0C8 0 12 10 8 26Z" fill="#a16207" opacity=".75" />
        <circle cx="-3" cy="-8" r="8" fill="#a16207" opacity=".75" />
        <path d="M-8 -14Q-12 -34 -5 -34Q-2 -24 -3 -14ZM1 -14Q4 -34 10 -30Q8 -20 4 -12Z" fill="#a16207" opacity=".75" />
        <path d="M12 26V12H26V26Z" fill="#a16207" opacity=".75" />
      </>
    );
  } else {
    const brass = skin === 'brass';
    const a = brass ? '#f5c451' : '#cbd5e1';
    const b = brass ? '#b7791f' : '#64748b';
    art = (
      <>
        <path d={COG} fill={a} {...ink} />
        <circle r="38" fill="none" stroke={b} strokeWidth="4" />
        {[0, 60, 120, 180, 240, 300].map((r) => (
          <path key={r} transform={`rotate(${r})`} d="M-5 -34Q0 -38 5 -34L3.4 -14H-3.4Z" fill={b} stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
        ))}
        <circle r="14" fill={b} {...ink} />
        <circle r="5" fill={INK} />
        <path d="M-36 -30A48 48 0 0 1 -8 -46" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".6" />
      </>
    );
  }
  return (
    <svg viewBox="-60 -66 120 132" role="img" aria-hidden="true" focusable="false">
      {art}
    </svg>
  );
}

function CatArt() {
  return (
    <svg viewBox="-24 -26 48 52" aria-hidden="true" focusable="false">
      <path d="M-13 -12L-16 -24L-6 -18ZM13 -12L16 -24L6 -18Z" fill="#fff" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M-14 22C-20 6 -16 -18 0 -18C16 -18 20 6 14 22Z" fill="#fff" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M12 -2C12 -14 22 -14 22 -4C22 2 16 2 15 6" fill="#fff" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="-6" cy="-7" r="1.8" fill={INK} />
      <circle cx="6" cy="-7" r="1.8" fill={INK} />
      <path d="M-2.4 -3Q0 -1 2.4 -3" fill="none" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M-11 2Q0 6 11 2" fill="none" stroke="#e63946" strokeWidth="3" strokeLinecap="round" />
      <circle cy="6.6" r="3.2" fill="#fbbf24" stroke={INK} strokeWidth="1.2" />
      <ellipse cx="-3" cy="15" rx="7" ry="9" fill="#f5b942" stroke={INK} strokeWidth="1.8" />
    </svg>
  );
}
