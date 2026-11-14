/**
 * 格納庫, the Hangar: where the robot lives, and where everything you do turns into something to spend.
 * Its look is an arcade in Akihabara at night. Nothing here earns XP unless it says so.
 */
import { lazy, Suspense, useMemo, useState, type CSSProperties } from 'react';
import { ChannelBar } from '../../app/Shell';
import { navigate, useRoute } from '../../app/router';
import { useProgress } from '../../data/lt';
import { CHASSIS, chassisCost, COIN, cosmeticLists, COSMETIC_NAME, DUST, GEM, RARITY, TICKET, TITLES, TRIBUTE_LEVEL, type Chassis, type ChassisGroup, type CosmeticKind, type Gear, type Title } from '../../domain/game/catalog';
import { daysLeft, eventOn, nextEvent, type EventRun } from '../../domain/game/events';
import { canAfford, chassisMk, DEFAULT_LOADOUT, itemName, type Loadout } from '../../domain/game/wallet';
import { sectionInfo } from '../../domain/sections';
import { rankFor, STAGES } from '../../domain/progress/engine';
import { useStore } from '../../lib/createStore';
import { H2 } from '../../ui/i/bits';
import { HomeLink } from '../../ui/i/ChannelHead';
import { Robot } from '../../ui/i/bots/Robot';
import { Amt, daysWord, ItemThumb, num, Price, Rar, Thumb } from './bits';
import { CapsuleTab } from './Capsule';
import { EventsTab } from './Events';
import { LedgerTab } from './Ledger';
import { RevealLayer, playChest, playAllChests } from './Reveal';
import { closeReveal, revealStore, showReveal } from './revealStore';
import { ShopTab } from './Shop';
import { buyItem, buyMk, claimSet, setLoadout, setWish, standingNow, useGame, useLoadout, useWish, type GameState } from './store';
import { listPrice, saved, withRank } from '../../domain/game/market';
import { setPrize, setRarity, setsProgress, setTitleName } from '../../domain/game/sets';
import { WorkshopTab } from './Workshop';
import { ArcadeTab } from './Arcade';
import { useArcade } from './arcadeStore';
import { arcadeWaiting } from '../../domain/game/arcade';
import { useWorksGlance } from './worksStore';
import './game.css';

/** The Works is a game of its own, so it loads when its tab is opened. */
const WorksTab = lazy(() => import('./Works'));

const TABS = [
  { id: '', label: 'Hangar', kanji: '機' },
  { id: 'shop', label: 'Shop', kanji: '店' },
  { id: 'arcade', label: 'Arcade', kanji: '遊' },
  { id: 'works', label: 'Works', kanji: '廠' },
  { id: 'capsule', label: 'Capsules', kanji: '蛋' },
  { id: 'workshop', label: 'Workshop', kanji: '工' },
  { id: 'events', label: 'Events', kanji: '祭' },
  { id: 'ledger', label: 'Ledger', kanji: '帳' },
] as const;

export function GameView() {
  const route = useRoute();
  const tab = TABS.find((t) => t.id === (route.rest[0] ?? ''))?.id ?? '';
  const g = useGame();
  const w = g.wallet;
  const run = eventOn(g.today);
  const reveal = useStore(revealStore, (s) => s.reveal);
  const waiting = arcadeWaiting(useArcade());
  const works = useWorksGlance();
  return (
    <div className="gm">
      <ChannelBar current="hangar" />
      <HomeLink />
      <header className="gm-head">
        <div className="gm-sign" aria-hidden="true">
          <span>格</span>
          <span>納</span>
          <span>庫</span>
        </div>
        <div className="gm-head__t">
          <h1>Hangar</h1>
          <p>Everything you do pays. Spend it on the robot.</p>
        </div>
      </header>
      <div className="gm-wallet" role="group" aria-label="Your wallet">
        <Amt k={COIN.kanji} c={COIN.color} n={w.coins} name={COIN.name} />
        <Amt k={GEM.kanji} c={GEM.color} n={w.gems} name={GEM.name} />
        <Amt k={TICKET.kanji} c={TICKET.color} n={w.tickets} name="capsule tickets" />
        <Amt k={DUST.kanji} c={DUST.color} n={w.dust} name={DUST.name} />
        {run && <Amt k={run.def.token.kanji} c={run.def.c2} n={w.tokens[run.key] ?? 0} name={run.def.token.name} />}
      </div>
      <nav className="gm-tabs" aria-label="Hangar">
        {TABS.map((t) => (
          <button key={t.id} type="button" className="gm-tab" aria-current={tab === t.id ? 'page' : undefined} onClick={() => navigate('hangar', t.id ? [t.id] : [], { replace: true })}>
            <span aria-hidden="true">{t.kanji}</span>
            <b>{t.label}</b>
            {t.id === '' && w.chests.length > 0 && <i className="gm-tab__n">{w.chests.length}</i>}
            {t.id === 'arcade' && waiting > 0 && <i className="gm-tab__n">{waiting}</i>}
            {t.id === 'works' && tab !== 'works' && works.started && (works.crate || works.waiting >= 1) && <i className="gm-tab__n">!</i>}
          </button>
        ))}
      </nav>
      {tab === 'shop' ? <ShopTab /> : tab === 'arcade' ? <ArcadeTab /> : tab === 'works' ? <Suspense fallback={<p className="i-note">Opening the factory…</p>}><WorksTab /></Suspense> : tab === 'capsule' ? <CapsuleTab /> : tab === 'workshop' ? <WorkshopTab /> : tab === 'events' ? <EventsTab /> : tab === 'ledger' ? <LedgerTab /> : <Bay g={g} run={run} />}
      {reveal && <RevealLayer reveal={reveal} onClose={closeReveal} />}
    </div>
  );
}

// ─── the bay ────────────────────────────────────────────────────────────────

const SLOTS: { id: 'body' | 'sets' | CosmeticKind; label: string }[] = [
  { id: 'body', label: 'Body' },
  { id: 'paint', label: 'Paint' },
  { id: 'hat', label: 'Headgear' },
  { id: 'pet', label: 'Companion' },
  { id: 'aura', label: 'Aura' },
  { id: 'title', label: 'Title' },
  { id: 'sets', label: 'Sets' },
];

/** What's your own of a kind (a title you've earned counts as yours). */
export function ownedOf(kind: CosmeticKind, items: Set<string>, level: number, sectionLevels: Record<string, { level: number }>): (Gear | Title)[] {
  return (cosmeticLists[kind] as (Gear & Title)[]).filter((x) => items.has(`${kind}:${x.id}`) || (x.level && level >= x.level) || (x.section && x.sectionLevel && sectionLevels[x.section].level >= x.sectionLevel));
}

export const titleName = (id: string | null) => TITLES.find((t) => t.id === id)?.name ?? null;

function Bay({ g, run }: { g: GameState; run: EventRun | null }) {
  const p = useProgress();
  const look = useLoadout();
  const w = g.wallet;
  const [slot, setSlot] = useState<'body' | 'sets' | CosmeticKind>('body');
  const ch = CHASSIS.find((x) => x.id === look.chassis);
  const mk = ch ? chassisMk(w, ch.id) || 1 : undefined;
  const stage = p.overall.stage;
  const next = nextEvent(g.today);
  const chestTiers = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of w.chests) m.set(c.tier, (m.get(c.tier) ?? 0) + 1);
    return m;
  }, [w.chests]);
  return (
    <>
      <section className="gm-bay" aria-label="Your robot" style={{ '--c': ch?.c ?? STAGES[stage].c, '--c2': ch?.c2 ?? STAGES[stage].c2 } as CSSProperties}>
        <div className="gm-bay__rays" aria-hidden="true" />
        <div className="gm-bay__bot i-drone">
          <Robot stage={stage} look={look} mk={mk} />
        </div>
        <div className="gm-bay__deck" aria-hidden="true" />
        <div className="gm-bay__plate">
          <b>{ch ? `${ch.name} Mk ${'I'.repeat(mk ?? 1)}` : `${STAGES[stage].name}`}</b>
          <small>
            LV {p.overall.level} · {rankFor(p.overall.level)}
            {titleName(look.title) ? ` · “${titleName(look.title)}”` : ''}
          </small>
        </div>
      </section>

      {g.bonus.lines.length > 0 && (
        <p className="gm-bonus">
          <b>Today</b> {g.bonus.lines.join(' · ')}
        </p>
      )}

      <WishCard g={g} stage={stage} />

      {run ? (
        <button type="button" className="gm-ev" style={{ '--c': run.def.c, '--c2': run.def.c2 } as CSSProperties} onClick={() => navigate('hangar', ['events'], { replace: true })}>
          <span className="gm-ev__k" aria-hidden="true">
            {run.def.kanji}
          </span>
          <span className="gm-ev__t">
            <b>{run.def.name} is on</b>
            <small>
              {num(w.tokensEarned[run.key] ?? 0)} {run.def.token.name} · {daysWord(daysLeft(run, g.today))}
            </small>
          </span>
          <span aria-hidden="true">▶</span>
        </button>
      ) : (
        <p className="gm-next">
          Next festival: <b>{next.def.name}</b> from {next.start}
        </p>
      )}

      <H2 aside={w.chests.length ? `${w.chests.length} to open` : undefined}>Chests</H2>
      {w.chests.length ? (
        <div className="gm-chests">
          <div className="gm-chests__row">
            {(['mythic', 'gold', 'iron', 'wood'] as const).map((t) => {
              const n = chestTiers.get(t) ?? 0;
              if (!n) return null;
              const first = w.chests.find((c) => c.tier === t)!;
              return (
                <button key={t} type="button" className={`gm-chest gm-chest--${t}`} onClick={() => playChest(first.key, t)} aria-label={`Open a ${t} chest, ${n} waiting`}>
                  <ChestArt tier={t} />
                  <i className="gm-chest__n">×{n}</i>
                </button>
              );
            })}
          </div>
          {w.chests.length > 1 && (
            <button type="button" className="i-btn i-btn--sig" onClick={playAllChests}>
              Open all {w.chests.length}
            </button>
          )}
          <p className="i-note">Latest from: {w.chests[w.chests.length - 1].label}</p>
        </div>
      ) : (
        <p className="i-note">None waiting. Clear a board of quests, beat a boss, hit a streak milestone or level up.</p>
      )}

      <H2 aside="new every Monday">Bounties</H2>
      <div className="gm-bounties">
        {g.bounties.map((b) => (
          <div key={b.def.id} className={`gm-bounty${b.complete ? ' is-done' : ''}`}>
            <span className="gm-bounty__s" aria-hidden="true">
              {b.complete ? '賞' : '懸'}
            </span>
            <span className="gm-bounty__t">
              <b>{b.def.title}</b>
              <span className="gm-bar" role="progressbar" aria-label={b.def.title} aria-valuemin={0} aria-valuemax={b.def.goal} aria-valuenow={b.done}>
                <i style={{ width: `${(b.done / b.def.goal) * 100}%` }} />
              </span>
              <small>
                {num(b.done)} / {num(b.def.goal)} {b.def.unit}
                {b.complete ? ' · paid' : ''}
              </small>
            </span>
            <Price cost={b.def.gain} />
          </div>
        ))}
      </div>

      <H2>Wardrobe</H2>
      <div className="gm-slots" role="group" aria-label="What to change">
        {SLOTS.map((s) => (
          <button key={s.id} type="button" className="gm-slot" aria-pressed={slot === s.id} onClick={() => setSlot(s.id)}>
            {s.label}
          </button>
        ))}
      </div>
      {slot === 'body' ? <Garage g={g} look={look} stage={stage} /> : slot === 'sets' ? <SetsPanel g={g} stage={stage} /> : <Wardrobe kind={slot} g={g} look={look} stage={stage} />}
    </>
  );
}

export function ChestArt({ tier }: { tier: 'wood' | 'iron' | 'gold' | 'mythic' }) {
  const fill = { wood: '#a0713f', iron: '#7f93a8', gold: '#e8aa1f', mythic: '#c81e73' }[tier];
  const trim = { wood: '#6b4522', iron: '#3f4f60', gold: '#fff0a8', mythic: '#ffd1ea' }[tier];
  return (
    <svg viewBox="0 0 64 56" className="gm-chestart" aria-hidden="true">
      <path d="M6 24 Q6 6 32 6 Q58 6 58 24 V28 H6 Z" fill={fill} stroke="#14101e" strokeWidth="3" strokeLinejoin="round" />
      <rect x="6" y="28" width="52" height="22" rx="2" fill={fill} stroke="#14101e" strokeWidth="3" />
      <path d="M14 7.5 V50 M50 7.5 V50" stroke={trim} strokeWidth="4" />
      <rect x="26" y="22" width="12" height="14" rx="2" fill={trim} stroke="#14101e" strokeWidth="2.5" />
      {tier === 'mythic' && <path d="M32 0 l2 4 4 1 -3 3 1 4 -4 -2 -4 2 1 -4 -3 -3 4 -1z" fill="#fff" />}
    </svg>
  );
}

const GROUP_NAMES: Record<ChassisGroup, { name: string; kanji: string; hint: string }> = {
  folklore: { name: 'Folklore', kanji: '妖', hint: 'Old stories, new bolts' },
  toys: { name: 'Toy box', kanji: '玩', hint: 'Things that should have stayed in the cupboard' },
  tribute: { name: 'Tributes', kanji: '誉', hint: 'One per section. Level the section to unlock them' },
  cosmic: { name: 'Strange', kanji: '異', hint: 'High level, high cost, and worth it' },
  event: { name: 'Festival', kanji: '祭', hint: 'Only sold during their event' },
};

function lockOf(ch: Chassis, mk: 1 | 2 | 3, level: number, sections: Record<string, { level: number }>, run: EventRun | null): string | null {
  if (ch.event && run?.def.id !== ch.event) return 'Only during its festival';
  if (mk === 1 && ch.level && level < ch.level) return `Reach level ${ch.level}`;
  if (ch.section && sections[ch.section].level < TRIBUTE_LEVEL[mk - 1]) return `${sectionInfo(ch.section).name} level ${TRIBUTE_LEVEL[mk - 1]}`;
  return null;
}

function Garage({ g, look, stage }: { g: GameState; look: Loadout; stage: number }) {
  const p = useProgress();
  const [open, setOpen] = useState<string | null>(null);
  const run = eventOn(g.today);
  const w = g.wallet;
  const ownedCount = CHASSIS.filter((c) => chassisMk(w, c.id) > 0).length;
  return (
    <>
      <p className="i-note">
        {ownedCount} of {CHASSIS.length} bodies built. The drone is always yours and keeps transforming as you level.
      </p>
      <div className="gm-grid">
        <button type="button" className="gm-card" aria-pressed={look.chassis === 'drone'} onClick={() => setLoadout({ chassis: 'drone' })}>
          <Thumb look={{ chassis: 'drone' }} stage={stage} />
          <b>Your drone</b>
          <small>Follows your form: {STAGES[stage].name}</small>
        </button>
      </div>
      {(Object.keys(GROUP_NAMES) as ChassisGroup[]).map((grp) => (
        <div key={grp} className="gm-group">
          <h3>
            <span aria-hidden="true">{GROUP_NAMES[grp].kanji}</span> {GROUP_NAMES[grp].name}
            <small>{GROUP_NAMES[grp].hint}</small>
          </h3>
          <div className="gm-grid">
            {CHASSIS.filter((c) => c.group === grp).map((c) => {
              const mk = chassisMk(w, c.id);
              const lock = mk ? null : lockOf(c, 1, p.overall.level, p.sections, run);
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`gm-card${mk ? '' : ' is-locked'}`}
                  aria-pressed={look.chassis === c.id}
                  style={{ '--a': RARITY[c.rarity].color } as CSSProperties}
                  onClick={() => setOpen(open === c.id ? null : c.id)}
                  aria-label={`${c.name}, ${RARITY[c.rarity].name}${mk ? `, Mk ${mk} built` : lock ? `, locked: ${lock}` : ', for sale'}`}
                >
                  <Thumb look={{ chassis: c.id }} mk={mk || 1} />
                  <b>{c.name}</b>
                  <small>{mk ? `Mk ${'I'.repeat(mk)}` : lock ?? 'For sale'}</small>
                </button>
              );
            })}
          </div>
          {open && CHASSIS.find((c) => c.id === open)?.group === grp && <ChassisCard key={open} id={open} g={g} look={look} onClose={() => setOpen(null)} />}
        </div>
      ))}
    </>
  );
}

function ChassisCard({ id, g, look, onClose }: { id: string; g: GameState; look: Loadout; onClose: () => void }) {
  const p = useProgress();
  const ch = CHASSIS.find((c) => c.id === id)!;
  const w = g.wallet;
  const mk = chassisMk(w, id);
  const run = eventOn(g.today);
  const nextMk = (mk + 1) as 1 | 2 | 3;
  const cost = mk < 3 ? chassisCost(ch, nextMk, run?.key) : null;
  const lock = mk < 3 ? lockOf(ch, nextMk, p.overall.level, p.sections, run) : null;
  return (
    <section className="gm-detail" aria-label={ch.name} style={{ '--a': RARITY[ch.rarity].color } as CSSProperties}>
      <div className="gm-detail__mks">
        {([1, 2, 3] as const).map((n) => (
          <div key={n} className={`gm-mk${mk >= n ? ' is-on' : ''}`}>
            <Thumb look={{ ...DEFAULT_LOADOUT, chassis: id }} mk={n} />
            <small>Mk {'I'.repeat(n)}</small>
          </div>
        ))}
      </div>
      <h3>
        {ch.name} <Rar r={ch.rarity} />
      </h3>
      <p>{ch.blurb}</p>
      <ul className="gm-detail__adds">
        <li className={mk >= 2 ? 'is-on' : ''}>Mk II: {ch.mk[0]}</li>
        <li className={mk >= 3 ? 'is-on' : ''}>Mk III: {ch.mk[1]}</li>
      </ul>
      {cost && (
        <div className="gm-detail__buy">
          <Price cost={cost} w={w} tokenName={run?.def.token.name} />
          {lock ? (
            <p className="i-note">{lock}</p>
          ) : (
            <button type="button" className="i-btn i-btn--sig" onClick={() => buyMk(id, nextMk, cost)}>
              {mk ? `Upgrade to Mk ${'I'.repeat(nextMk)}` : 'Build it'}
            </button>
          )}
        </div>
      )}
      <div className="gm-detail__row">
        {mk > 0 && (
          <button type="button" className="i-btn" aria-pressed={look.chassis === id} onClick={() => setLoadout({ chassis: look.chassis === id ? 'drone' : id })}>
            {look.chassis === id ? 'Back to the drone' : 'Wear it'}
          </button>
        )}
        <button type="button" className="i-link" onClick={onClose}>
          Close
        </button>
      </div>
    </section>
  );
}

function Wardrobe({ kind, g, look, stage }: { kind: CosmeticKind; g: GameState; look: Loadout; stage: number }) {
  const p = useProgress();
  const mine = ownedOf(kind, g.wallet.items, p.overall.level, p.sections);
  const worn = look[kind];
  const ch = CHASSIS.find((c) => c.id === look.chassis);
  const mk = ch ? chassisMk(g.wallet, ch.id) || 1 : undefined;
  const all = cosmeticLists[kind].length;
  return (
    <>
      <p className="i-note">
        {mine.length} of {all} {COSMETIC_NAME[kind].toLowerCase()}. More from the shop, chests, capsules and the Works.
      </p>
      <div className="gm-grid">
        <button type="button" className="gm-card" aria-pressed={!worn} onClick={() => setLoadout({ [kind]: null })}>
          {kind === 'title' ? <span className="gm-thumb gm-thumb--word" aria-hidden="true">無</span> : <Thumb look={{ ...look, [kind]: null }} stage={stage} mk={mk} />}
          <b>None</b>
        </button>
        {mine.map((x) => (
          <button key={x.id} type="button" className="gm-card" aria-pressed={worn === x.id} style={{ '--a': RARITY[x.rarity].color } as CSSProperties} onClick={() => setLoadout({ [kind]: x.id })}>
            {kind === 'title' ? <span className="gm-thumb gm-thumb--word" aria-hidden="true">称</span> : <Thumb look={{ ...look, [kind]: x.id }} stage={stage} mk={mk} />}
            <b>{x.name}</b>
            <small>{RARITY[x.rarity].name}</small>
          </button>
        ))}
      </div>
      {!mine.length && (
        <button type="button" className="i-link" onClick={() => navigate('hangar', ['shop'], { replace: true })}>
          To the shop ▶
        </button>
      )}
    </>
  );
}

// ─── saving up ──────────────────────────────────────────────────────────────

/** The one thing you've starred in the shop, and how close you are. */
function WishCard({ g, stage }: { g: GameState; stage: number }) {
  const wish = useWish();
  const lp = wish ? listPrice(wish) : null;
  if (!wish || !lp) return null;
  const owned = g.wallet.items.has(wish);
  const price = withRank(lp.cost, standingNow(g).rank);
  const p = owned ? 1 : saved(g.wallet, price);
  const ready = !owned && canAfford(g.wallet, price);
  return (
    <section className={`gm-wishcard${ready ? ' is-ready' : ''}`} aria-label="Saving up" style={{ '--a': RARITY[lp.rarity].color } as CSSProperties}>
      <ItemThumb item={wish} stage={stage} />
      <span className="gm-wishcard__t">
        <small>{owned ? 'Got it!' : ready ? 'You can buy it now' : 'Saving up for'}</small>
        <b>{lp.name}</b>
        <span className="gm-bar" role="progressbar" aria-label={`Saved towards ${lp.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p * 100)}>
          <i style={{ width: `${p * 100}%` }} />
        </span>
        {!owned && <Price cost={price} w={g.wallet} />}
      </span>
      <span className="gm-wishcard__do">
        {ready && (
          <button type="button" className="i-btn i-btn--sm i-btn--sig" onClick={() => buyItem(wish, price) && (setWish(null), showReveal({ kind: 'item', item: wish }))}>
            Buy
          </button>
        )}
        <button type="button" className="i-link" onClick={() => setWish(null)}>
          {owned ? 'Done' : 'Forget it'}
        </button>
      </span>
    </section>
  );
}

// ─── gear sets ──────────────────────────────────────────────────────────────

function SetsPanel({ g, stage }: { g: GameState; stage: number }) {
  const list = setsProgress(g.wallet.items, g.txs);
  const done = list.filter((x) => x.claimed).length;
  return (
    <>
      <p className="i-note">
        {done} of {list.length} sets complete. Own all four pieces (from the shop, chests, capsules, festivals or the night market) to claim the set's title and a prize.
      </p>
      <div className="gm-sets">
        {list.map(({ set, have, complete, claimed }) => {
          const r = setRarity(set);
          const claim = () => {
            const gain = claimSet(set.id);
            if (gain) showReveal({ kind: 'loot', art: 'set', title: `${set.name} set`, line: `New title: “${setTitleName(set)}”`, gain });
          };
          return (
            <div key={set.id} className={`gm-set${claimed ? ' is-done' : complete ? ' is-ready' : ''}`} style={{ '--a': RARITY[r].color } as CSSProperties}>
              <span className="gm-set__k" aria-hidden="true">
                {set.kanji}
              </span>
              <span className="gm-set__t">
                <b>
                  {set.name} <small>{set.festival ? 'Festival' : RARITY[r].name}</small>
                </b>
                <small>
                  {have.length} / {set.items.length} · title “{setTitleName(set)}”
                </small>
              </span>
              <span className="gm-set__pieces">
                {set.items.map((it) => (
                  <span key={it} className={g.wallet.items.has(it) ? 'is-on' : ''} title={itemName(it)}>
                    <ItemThumb item={it} stage={stage} />
                  </span>
                ))}
              </span>
              <span className="gm-set__do">
                {claimed ? (
                  <small className="gm-shop__own">Claimed</small>
                ) : complete ? (
                  <button type="button" className="i-btn i-btn--sm i-btn--sig" onClick={claim}>
                    Claim
                  </button>
                ) : (
                  <Price cost={setPrize(set)} />
                )}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}
