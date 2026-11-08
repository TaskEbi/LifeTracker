/**
 * 店: Mameda's shop and the street around it. The Street stall has the counter (Mameda, the
 * Regular's card and the stamp card), the time sale, this week's shelf (haggle once a day), the
 * daily deal, the lucky bag and things to use. Then the requests board, the night market and the
 * full catalogue with the exchange. Everything on it is drawn from the date and the hour.
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { navigate, useRoute } from '../../app/router';
import { useToday, useProgress } from '../../data/lt';
import { data } from '../../data/store';
import { toast } from '../../data/ui';
import type { SectionId } from '../../data/types';
import { CHASSIS, CONSUMABLES, COSMETIC_NAME, cosmeticPrice, DUST_PRICE, MAT_IDS, MATS, RARITY, type Bag, type CosmeticKind, type Rarity } from '../../domain/game/catalog';
import { eventOn } from '../../domain/game/events';
import {
  bagsThisWeek,
  HAGGLE_WORDS,
  haggleOff,
  listPrice,
  LUCKY_BAG,
  mamedaLine,
  NIGHT,
  NIGHT_DUST,
  NIGHT_EXTRAS,
  nightOf,
  nightOpen,
  nightStock,
  perks,
  RANKS,
  requestsFor,
  saleState,
  STAMP_CARD,
  stampCard,
  stampPrize,
  timeSale,
  withRank,
  type Rank,
  type Request,
  type Standing,
} from '../../domain/game/market';
import { catalogue, consumableItems, dailyDeal, discounted, DUST_TICKET, GEM_EXCHANGE, MAT_EXCHANGE, themeItems, weeklyStock, type ShopItem } from '../../domain/game/shop';
import { canAfford, chassisMk, DEFAULT_LOADOUT } from '../../domain/game/wallet';
import { addDays, weekStart } from '../../domain/log/dates';
import { useStore } from '../../lib/createStore';
import { H2 } from '../../ui/i/bits';
import { Robot } from '../../ui/i/bots/Robot';
import { ItemThumb, MatAmt, num, Price, Rar } from './bits';
import { BagArt } from './Reveal';
import { showReveal } from './revealStore';
import {
  boughtThisWeek,
  buyHaggled,
  buyItem,
  buyLuckyBag,
  buyMk,
  buyNight,
  buyNightExtra,
  buySale,
  claimStamp,
  dealTaken,
  deliver,
  exchangeDust,
  exchangeGems,
  exchangeMats,
  gemsBoughtThisWeek,
  haggleId,
  isDone,
  nightRowId,
  recentSections,
  requestRowId,
  saleId,
  setWish,
  standingNow,
  takeDeal,
  talkStore,
  useClock,
  useGame,
  useItem,
  useWish,
  type GameState,
} from './store';

const STALLS = [
  { id: '', label: 'Street', kanji: '通' },
  { id: 'requests', label: 'Requests', kanji: '注' },
  { id: 'night', label: 'Night market', kanji: '夜' },
  { id: 'catalogue', label: 'Catalogue', kanji: '目' },
] as const;

const KINDS: { id: CosmeticKind | 'theme'; label: string }[] = [
  { id: 'paint', label: COSMETIC_NAME.paint },
  { id: 'hat', label: COSMETIC_NAME.hat },
  { id: 'pet', label: COSMETIC_NAME.pet },
  { id: 'aura', label: COSMETIC_NAME.aura },
  { id: 'title', label: COSMETIC_NAME.title },
  { id: 'theme', label: 'Colour themes' },
];

/** Buy a shop card's thing at `cost`, and show it off. */
function buy(s: ShopItem, cost: Bag) {
  if (s.item.startsWith('chassis:')) {
    const [, id, mk] = s.item.split(':');
    return buyMk(id, Number(mk) as 1, cost);
  }
  const ok = buyItem(s.item, cost, { stock: s.stock });
  if (ok && !s.stock) showReveal({ kind: 'item', item: s.item });
  return ok;
}

const hh = (h: number) => `${String(h % 24).padStart(2, '0')}:00`;

export function ShopTab() {
  const route = useRoute();
  const stall = STALLS.find((s) => s.id === (route.rest[1] ?? ''))?.id ?? '';
  const g = useGame();
  const clock = useClock();
  const standing = standingNow(g);
  const night = nightOpen(clock.hour);
  return (
    <>
      <Counter g={g} standing={standing} hour={clock.hour} />
      <nav className="gm-stalls" aria-label="Shop">
        {STALLS.map((s) => (
          <button key={s.id} type="button" className="gm-slot" aria-current={stall === s.id ? 'page' : undefined} onClick={() => navigate('hangar', s.id ? ['shop', s.id] : ['shop'], { replace: true })}>
            <span aria-hidden="true">{s.kanji}</span> {s.label}
            {s.id === 'night' && night && <i className="gm-stalls__dot" aria-label="open now" />}
          </button>
        ))}
      </nav>
      {stall === 'requests' ? (
        <RequestsStall g={g} rank={standing.rank} />
      ) : stall === 'night' ? (
        <NightStall g={g} rank={standing.rank} hour={clock.hour} />
      ) : stall === 'catalogue' ? (
        <CatalogueStall rank={standing.rank} />
      ) : (
        <Street g={g} rank={standing.rank} clock={clock} />
      )}
    </>
  );
}

// ─── the counter ────────────────────────────────────────────────────────────

const MAMEDA = { ...DEFAULT_LOADOUT, chassis: 'tanuki', hat: 'kasa' };

function Counter({ g, standing, hour }: { g: GameState; standing: Standing; hour: number }) {
  const talk = useStore(talkStore, (s) => s);
  const wish = useWish();
  const wp = wish ? listPrice(wish) : null;
  const card = stampCard(g.txs, g.today);
  const sale = timeSale(g.today, standing.rank);
  const run = eventOn(g.today);
  const [now] = useState(() => Date.now());
  const fresh = !!talk.line && talk.at > now - 5 * 60_000;
  const line = fresh
    ? talk.line!
    : mamedaLine({
        date: g.today,
        hour,
        rank: standing.rank,
        coins: g.wallet.coins,
        wish: wp ? { name: wp.name, ready: !g.wallet.items.has(wish!) && canAfford(g.wallet, withRank(wp.cost, standing.rank)) } : null,
        sale: { name: sale.item.name, state: saleState(sale, hour), from: sale.from, to: sale.to },
        night: nightOpen(hour),
        event: run?.def.name ?? null,
        stampsToGo: STAMP_CARD - card.onCard,
        toClaim: card.toClaim.length > 0,
      });
  return (
    <section className="gm-counter" aria-label="Mameda's counter">
      <div className="gm-counter__awning" aria-hidden="true" />
      <div className="gm-counter__keeper i-drone" aria-hidden="true">
        <Robot stage={0} look={MAMEDA} mk={2} label={false} happy={fresh} />
      </div>
      <div className="gm-counter__talk">
        <b>
          Mameda <small>keeps the shop · tanuki · 300 years old</small>
        </b>
        <p aria-live="polite">{line}</p>
      </div>
      <RegularCard standing={standing} />
      <StampCardView g={g} />
      <details className="gm-guide">
        <summary>How the shop works</summary>
        <ul>
          <li>
            <b>Earning.</b> You never earn in here. Ryō, Tama and materials come from what you log (see the Ledger), worked out like XP, so nothing pays twice.
          </li>
          <li>
            <b>Spending.</b> Each purchase is one saved record of what it cost and what it gave. Your balance is everything earned minus everything spent.
          </li>
          <li>
            <b>Prices.</b> Your rank takes a standing discount off the shelf, catalogue, items and lucky bag. The shelf changes on Mondays, the deal and requests every day, the time sale for two hours a day, the night market from {hh(NIGHT.from)} to {hh(NIGHT.to)}.
          </li>
          <li>
            <b>Trust.</b> A point for every 10 Ryō, every Tama and every 10 Stardust you spend (bodies, machines and spins count), and 15 plus a point per material for each request you deliver.
          </li>
        </ul>
        <ol className="gm-guide__ranks">
          {RANKS.map((r) => (
            <li key={r.n} className={standing.rank.n >= r.n ? 'is-on' : ''}>
              <span aria-hidden="true">{r.kanji}</span>
              <b>{r.name}</b>
              <small>
                {num(r.need)} trust · {r.perk}
              </small>
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}

function RegularCard({ standing }: { standing: Standing }) {
  const { rank, next, trust, progress } = standing;
  return (
    <div className="gm-regular">
      <span className="gm-regular__k" aria-hidden="true">
        {rank.kanji}
      </span>
      <span className="gm-regular__t">
        <b>
          {rank.name}
          {rank.off ? ` · ${rank.off}% off` : ''}
        </b>
        <span className="gm-bar" role="progressbar" aria-label="Trust towards the next rank" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
          <i style={{ width: `${progress * 100}%` }} />
        </span>
        <small>{next ? `${num(trust)} trust · ${num(next.need - trust)} more to ${next.name}: ${next.perk.replace(/^\d+% off, and /, '')}` : `${num(trust)} trust · the top. Mameda bows when you walk in.`}</small>
      </span>
    </div>
  );
}

function StampCardView({ g }: { g: GameState }) {
  const card = stampCard(g.txs, g.today);
  const full = card.toClaim.length > 0;
  const on = full ? STAMP_CARD : card.onCard;
  const k = card.toClaim[0];
  const hand = () => {
    if (claimStamp(k)) showReveal({ kind: 'loot', art: 'stamp', title: `Stamp card ${k}`, line: k % 5 === 0 ? 'A gold card. Mameda goes into the back for this one.' : 'Mameda punches the last hole and hands you a box.', gain: stampPrize(k) });
  };
  return (
    <div className="gm-stamps">
      <span className="gm-stamps__t">
        <b>Stamp card</b>
        <small>A stamp for each day you buy anything. {STAMP_CARD} fill a card.</small>
      </span>
      <ol className="gm-stamps__row" aria-label={`${on} of ${STAMP_CARD} stamps`}>
        {Array.from({ length: STAMP_CARD }, (_, i) => (
          <li key={i} className={i < on ? 'is-on' : ''} aria-hidden="true">
            {i < on ? '済' : i + 1}
          </li>
        ))}
      </ol>
      {full ? (
        <button type="button" className="i-btn i-btn--sig" onClick={hand}>
          Hand in card {k}
        </button>
      ) : (
        <small className="gm-stamps__now">{card.stampedToday ? 'Stamped today.' : 'Buy anything today for a stamp.'} Next prize: <Price cost={stampPrize(Math.floor(card.days.length / STAMP_CARD) + 1)} /></small>
      )}
    </div>
  );
}

// ─── the street ─────────────────────────────────────────────────────────────

function Street({ g, rank, clock }: { g: GameState; rank: Rank; clock: { hour: number; minute: number } }) {
  const today = useToday();
  const stage = useProgress().overall.stage;
  const st = useStore(data, (s) => s);
  const [haggling, setHaggling] = useState<ShopItem | null>(null);
  const monday = weekStart(today);
  const stock = weeklyStock(monday);
  const deal = dailyDeal(today);
  const taken = dealTaken(st, today);
  const canHaggle = perks(rank).haggle && !isDone(st, haggleId(today));
  const refresh = Math.max(1, Math.round((Date.parse(addDays(monday, 7)) - Date.parse(today)) / 86400000));
  return (
    <>
      <SaleBanner g={g} rank={rank} clock={clock} stage={stage} />

      <H2 aside={`new stock in ${refresh} day${refresh === 1 ? '' : 's'}`}>This week's shelf</H2>
      {perks(rank).haggle && <p className="i-note">{canHaggle ? 'Mameda will haggle on one shelf item today.' : 'You\'ve haggled today. Mameda is still recovering.'}</p>}
      <div className="gm-shelf">
        {stock.map((s) => (
          <ShopCard key={s.item} s={s} stage={stage} rank={rank} onHaggle={canHaggle ? () => setHaggling(s) : undefined} />
        ))}
      </div>

      <H2 aside="one a day">Today's deal</H2>
      <div className={`gm-deal${taken ? ' is-taken' : ''}`}>
        <span className="gm-deal__k" aria-hidden="true">
          {deal.kanji}
        </span>
        <span className="gm-deal__t">
          <b>{deal.name}</b>
          <small>{deal.line}</small>
          {!taken && <Price cost={deal.cost} w={g.wallet} />}
        </span>
        <button type="button" className="i-btn i-btn--sm" disabled={taken || !canAfford(g.wallet, deal.cost)} onClick={takeDeal}>
          {taken ? 'Taken' : 'Take it'}
        </button>
      </div>

      <LuckyBag g={g} rank={rank} />

      <H2>Items</H2>
      <p className="i-note">Each of these does something real to the game. Scrolls and tonics add XP; a bomb hits the actual boss.</p>
      <div className="gm-items">
        {consumableItems().map((c) => {
          const def = CONSUMABLES.find((x) => x.id === c.item)!;
          const have = g.wallet.stock[c.item] ?? 0;
          const left = def.weeklyLimit ? def.weeklyLimit - boughtThisWeek(g, c.item) : null;
          const price = withRank(def.price, rank);
          return (
            <div key={c.item} className="gm-item" style={{ '--a': RARITY[def.rarity].color } as CSSProperties}>
              <span className="gm-item__k" aria-hidden="true">
                {def.kanji}
              </span>
              <span className="gm-item__t">
                <b>
                  {def.name} {have > 0 && <em>×{have}</em>}
                </b>
                <small>{def.desc}</small>
                <Price cost={price} w={g.wallet} />
              </span>
              <span className="gm-item__do">
                <button type="button" className="i-btn i-btn--sm" disabled={left === 0 || !canAfford(g.wallet, price)} onClick={() => buy(c, price)}>
                  {left === 0 ? 'Sold out' : 'Buy'}
                </button>
                {have > 0 && (
                  <button type="button" className="i-btn i-btn--sm i-btn--sig" onClick={() => useItem(c.item)}>
                    Use
                  </button>
                )}
              </span>
            </div>
          );
        })}
      </div>
      {haggling && <Haggle s={haggling} g={g} rank={rank} onClose={() => setHaggling(null)} />}
    </>
  );
}

function ShopCard({ s, stage, rank, onHaggle }: { s: ShopItem; stage: number; rank: Rank; onHaggle?: () => void }) {
  const g = useGame();
  const owned = g.wallet.items.has(s.item) || (s.item.startsWith('chassis:') && chassisMk(g.wallet, s.item.split(':')[1]) > 0);
  const ch = s.item.startsWith('chassis:') ? CHASSIS.find((c) => c.id === s.item.split(':')[1]) : null;
  const level = useProgress().overall.level;
  const locked = ch?.level && level < ch.level ? `Reach level ${ch.level}` : null;
  const price = withRank(s.cost, rank);
  return (
    <div className={`gm-shop${owned ? ' is-owned' : ''}`} style={{ '--a': RARITY[s.rarity].color } as CSSProperties}>
      {!!s.off && <i className="gm-shop__off">−{s.off}%</i>}
      {!ch && <WishStar item={s.item} name={s.name} />}
      <ItemThumb item={s.item} stage={stage} />
      <b>{s.name}</b>
      <Rar r={s.rarity} />
      {owned ? (
        <small className="gm-shop__own">Owned</small>
      ) : locked ? (
        <small>{locked}</small>
      ) : (
        <>
          <Price cost={price} w={g.wallet} />
          <button type="button" className="i-btn i-btn--sm" onClick={() => buy(s, price)} disabled={!canAfford(g.wallet, price)}>
            Buy
          </button>
          {onHaggle && (
            <button type="button" className="gm-haggle" onClick={onHaggle}>
              Haggle
            </button>
          )}
        </>
      )}
    </div>
  );
}

function WishStar({ item, name }: { item: string; name: string }) {
  const wish = useWish();
  if (!listPrice(item)) return null;
  const on = wish === item;
  return (
    <button type="button" className="gm-wish" aria-pressed={on} aria-label={on ? `Stop saving for ${name}` : `Save up for ${name}`} onClick={() => setWish(on ? null : item)}>
      {on ? '★' : '☆'}
    </button>
  );
}

function SaleBanner({ g, rank, clock, stage }: { g: GameState; rank: Rank; clock: { hour: number; minute: number }; stage: number }) {
  const st = useStore(data, (s) => s);
  const sale = timeSale(g.today, rank);
  const state = saleState(sale, clock.hour);
  const s = sale.item;
  const owned = g.wallet.items.has(s.item);
  const bought = isDone(st, saleId(g.today));
  if (state === 'gone') {
    const tomorrow = timeSale(addDays(g.today, 1), rank);
    return (
      <p className="gm-next">
        Today's time sale is over. Tomorrow's starts at <b>{hh(tomorrow.from)}</b>.
      </p>
    );
  }
  if (state === 'soon') {
    return (
      <div className="gm-sale is-soon">
        <span className="gm-sale__k" aria-hidden="true">
          時
        </span>
        <span className="gm-sale__t">
          <b>Time sale at {hh(sale.from)}</b>
          <small>
            Two hours only: something {RARITY[s.rarity].name} at {s.off}% off. Mameda won't say what.
          </small>
        </span>
        <span className="gm-sale__q" aria-hidden="true">
          ?
        </span>
      </div>
    );
  }
  const left = (sale.to - clock.hour - 1) * 60 + (60 - clock.minute);
  return (
    <div className="gm-sale is-on" style={{ '--a': RARITY[s.rarity].color } as CSSProperties}>
      <span className="gm-sale__flag">Time sale −{s.off}%</span>
      <ItemThumb item={s.item} stage={stage} />
      <span className="gm-sale__t">
        <b>{s.name}</b>
        <Rar r={s.rarity} />
        <small>
          {left >= 60 ? `${Math.floor(left / 60)}h ${left % 60}m` : `${left}m`} left · was <s>{num(cosmeticPrice(s.rarity).coins ?? 0)} 両</s>
        </small>
        {owned || bought ? <small className="gm-shop__own">{bought ? 'Bought' : 'Owned'}</small> : <Price cost={s.cost} w={g.wallet} />}
      </span>
      {!owned && !bought && (
        <button type="button" className="i-btn i-btn--sig" disabled={!canAfford(g.wallet, s.cost)} onClick={() => buySale() && showReveal({ kind: 'item', item: s.item })}>
          Grab it
        </button>
      )}
    </div>
  );
}

function LuckyBag({ g, rank }: { g: GameState; rank: Rank }) {
  const limit = perks(rank).bags;
  const left = limit - bagsThisWeek(g.txs, weekStart(g.today));
  const price = withRank(LUCKY_BAG.cost, rank);
  const open = () => {
    const gain = buyLuckyBag();
    if (gain) showReveal({ kind: 'loot', art: 'bag', title: LUCKY_BAG.name, line: 'You tear the paper open…', gain });
  };
  return (
    <>
      <H2 aside={`${Math.max(0, left)} of ${limit} left this week`}>Lucky bag</H2>
      <div className={`gm-bag${left <= 0 ? ' is-taken' : ''}`}>
        <span className="gm-bag__art">
          <BagArt />
        </span>
        <span className="gm-bag__t">
          <b>
            {LUCKY_BAG.kanji} {LUCKY_BAG.name}
          </b>
          <small>{LUCKY_BAG.line}</small>
          <Price cost={price} w={g.wallet} />
        </span>
        <button type="button" className="i-btn i-btn--sm" disabled={left <= 0 || !canAfford(g.wallet, price)} onClick={open}>
          {left <= 0 ? 'Sold out' : 'Buy'}
        </button>
      </div>
    </>
  );
}

// ─── haggling ───────────────────────────────────────────────────────────────

function Haggle({ s, g, rank, onClose }: { s: ShopItem; g: GameState; rank: Rank; onClose: () => void }) {
  const [res, setRes] = useState<number | null>(null);
  const needle = useRef<HTMLSpanElement>(null);
  const pos = useRef(0);
  const stopBtn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  useEffect(() => {
    if (res !== null) return;
    stopBtn.current?.focus();
    const slow = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const period = slow ? 2800 : 1250;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const ph = ((t - t0) % period) / period;
      const p = ph < 0.5 ? ph * 2 : 2 - ph * 2;
      pos.current = p;
      if (needle.current) needle.current.style.left = `${p * 100}%`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [res]);
  const price = res === null ? null : withRank(discounted(s.cost, res), rank);
  const take = () => {
    if (res === null || !buyHaggled(s, res)) return;
    onClose();
    if (!s.item.startsWith('chassis:')) showReveal({ kind: 'item', item: s.item });
  };
  return (
    <div className="gm-rv" role="dialog" aria-modal="true" aria-label="Haggle">
      <div className="gm-rv__box gm-hag">
        <h2>Haggle</h2>
        <p>
          {s.name}. Stop the needle in the middle: the closer, the bigger the discount.
        </p>
        <div className="gm-hag__bar" aria-hidden="true">
          <i className="gm-hag__z gm-hag__z--6" />
          <i className="gm-hag__z gm-hag__z--12" />
          <i className="gm-hag__z gm-hag__z--20" />
          <i className="gm-hag__z gm-hag__z--30" />
          <span ref={needle} className="gm-hag__needle" style={res !== null ? { left: `${pos.current * 100}%` } : undefined} />
        </div>
        {res === null ? (
          <button ref={stopBtn} type="button" className="i-btn i-btn--sig gm-hag__stop" onClick={() => setRes(haggleOff(pos.current))}>
            Stop!
          </button>
        ) : (
          <>
            <p className={`gm-hag__res${res >= 20 ? ' is-good' : ''}`} aria-live="polite">
              {HAGGLE_WORDS[res]}
            </p>
            <Price cost={price!} w={g.wallet} />
            <div className="gm-detail__row">
              <button type="button" className="i-btn i-btn--sig" disabled={!canAfford(g.wallet, price!)} onClick={take}>
                Buy it
              </button>
              <button type="button" className="i-btn" onClick={onClose}>
                Walk away
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── requests ───────────────────────────────────────────────────────────────

function RequestsStall({ g, rank }: { g: GameState; rank: Rank }) {
  const st = useStore(data, (s) => s);
  const reqs = requestsFor(g.today, recentSections(g), perks(rank).requests);
  const done = reqs.filter((r) => isDone(st, requestRowId(r.id))).length;
  return (
    <>
      <H2 aside={`${done} of ${reqs.length} done · new ones tomorrow`}>Today's requests</H2>
      <p className="i-note">The street wants materials from the sections you've been working in, and pays in Ryō and Tama. Short of one? The exchange in the Catalogue swaps {MAT_EXCHANGE} of anything for 1.</p>
      <div className="gm-reqs">
        {reqs.map((r) => (
          <RequestCard key={r.id} r={r} g={g} done={isDone(st, requestRowId(r.id))} />
        ))}
      </div>
    </>
  );
}

function RequestCard({ r, g, done }: { r: Request; g: GameState; done: boolean }) {
  const ok = canAfford(g.wallet, { mats: r.want });
  return (
    <div className={`gm-req${done ? ' is-done' : ''}`}>
      <span className="gm-req__k" aria-hidden="true">
        {done ? '済' : r.kanji}
      </span>
      <span className="gm-req__t">
        <b>{r.who}</b>
        <q>{r.line}</q>
        <span className="gm-req__deal">
          <span className="gm-price">
            {Object.entries(r.want).map(([s, n]) => (
              <MatAmt key={s} s={s as SectionId} n={n ?? 0} short={!done && g.wallet.mats[s as SectionId] < (n ?? 0)} />
            ))}
          </span>
          <span aria-hidden="true">→</span>
          <Price cost={r.gain} />
        </span>
      </span>
      <button
        type="button"
        className="i-btn i-btn--sm"
        disabled={done || !ok}
        onClick={() => {
          if (deliver(r)) toast(`${r.who.split(',')[0]}: thank you!`);
        }}
      >
        {done ? 'Delivered' : 'Deliver'}
      </button>
    </div>
  );
}

// ─── the night market ───────────────────────────────────────────────────────

function NightStall({ g, rank, hour }: { g: GameState; rank: Rank; hour: number }) {
  const st = useStore(data, (s) => s);
  const stage = useProgress().overall.stage;
  const open = nightOpen(hour);
  const night = nightOf(g.today, hour);
  const run = eventOn(g.today);
  const stock = nightStock(night, run?.def.id ?? null, perks(rank).stalls);
  return (
    <>
      <section className={`gm-night${open ? ' is-open' : ''}`} aria-label="The night market">
        <div className="gm-night__lanterns" aria-hidden="true">
          {Array.from({ length: 7 }, (_, i) => (
            <i key={i} style={{ '--i': i } as CSSProperties} />
          ))}
        </div>
        <h2>夜市 Night market</h2>
        <p>{open ? `Open till ${hh(NIGHT.to)}. Gear from festivals gone by, and a few things that fell off a cart.` : `Shut. The lanterns go up at ${hh(NIGHT.from)} and come down at ${hh(NIGHT.to)}. Here's who's setting up tonight.`}</p>
      </section>

      <H2 aside={`${stock.length} stalls tonight`}>Festival leftovers</H2>
      <div className="gm-shelf">
        {stock.map((s) => {
          const owned = g.wallet.items.has(s.item);
          const dust = { dust: NIGHT_DUST };
          return (
            <div key={s.item} className={`gm-shop gm-shop--night${owned ? ' is-owned' : ''}`} style={{ '--a': RARITY[s.rarity].color } as CSSProperties}>
              <ItemThumb item={s.item} stage={stage} />
              <b>{s.name}</b>
              <Rar r={s.rarity} />
              {owned ? (
                <small className="gm-shop__own">Owned</small>
              ) : !open ? (
                <small>From {hh(NIGHT.from)}</small>
              ) : (
                <>
                  <Price cost={s.cost} w={g.wallet} />
                  <button type="button" className="i-btn i-btn--sm" disabled={!canAfford(g.wallet, s.cost)} onClick={() => buyNight(s.item, s.cost) && showReveal({ kind: 'item', item: s.item })}>
                    Buy
                  </button>
                  {g.wallet.dust >= NIGHT_DUST && (
                    <button type="button" className="i-btn i-btn--sm" onClick={() => buyNight(s.item, dust) && showReveal({ kind: 'item', item: s.item })}>
                      {num(NIGHT_DUST)} 星
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      <H2 aside="one each a night">Under the counter</H2>
      <div className="gm-items">
        {NIGHT_EXTRAS.map((x) => {
          const sold = isDone(st, nightRowId(night, x.id));
          return (
            <div key={x.id} className={`gm-item${sold ? ' is-taken' : ''}`} style={{ '--a': '#9d4edd' } as CSSProperties}>
              <span className="gm-item__k" aria-hidden="true">
                {x.kanji}
              </span>
              <span className="gm-item__t">
                <b>{x.name}</b>
                <small>{x.line}</small>
                <Price cost={x.cost} w={g.wallet} />
              </span>
              <span className="gm-item__do">
                <button type="button" className="i-btn i-btn--sm" disabled={!open || sold || !canAfford(g.wallet, x.cost)} onClick={() => buyNightExtra(x.id)}>
                  {sold ? 'Sold out' : open ? 'Buy' : `From ${hh(NIGHT.from)}`}
                </button>
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── the catalogue ──────────────────────────────────────────────────────────

function CatalogueStall({ rank }: { rank: Rank }) {
  const stage = useProgress().overall.stage;
  const [kind, setKind] = useState<CosmeticKind | 'theme'>('paint');
  const list = kind === 'theme' ? themeItems() : catalogue(kind);
  return (
    <>
      <H2>Catalogue</H2>
      <p className="i-note">Everything the shop can get you, at full price less your rank's discount. Tap ☆ to save up for something: the Hangar keeps count.</p>
      <div className="gm-slots" role="group" aria-label="Kind of thing">
        {KINDS.map((k) => (
          <button key={k.id} type="button" className="gm-slot" aria-pressed={kind === k.id} onClick={() => setKind(k.id)}>
            {k.label}
          </button>
        ))}
      </div>
      <div className="gm-shelf">
        {list.map((s) => (
          <CatalogueCard key={s.item} s={s} stage={stage} rank={rank} />
        ))}
      </div>
      <Exchange />
    </>
  );
}

function CatalogueCard({ s, stage, rank }: { s: ShopItem; stage: number; rank: Rank }) {
  const g = useGame();
  const owned = g.wallet.items.has(s.item);
  const dust = s.kind !== 'theme' ? { dust: DUST_PRICE[s.rarity as Rarity] } : null;
  const price = withRank(s.cost, rank);
  return (
    <div className={`gm-shop${owned ? ' is-owned' : ''}`} style={{ '--a': RARITY[s.rarity].color } as CSSProperties}>
      {!owned && <WishStar item={s.item} name={s.name} />}
      <ItemThumb item={s.item} stage={stage} />
      <b>{s.name}</b>
      <Rar r={s.rarity} />
      {owned ? (
        <small className="gm-shop__own">Owned</small>
      ) : (
        <>
          <Price cost={price} w={g.wallet} />
          <button type="button" className="i-btn i-btn--sm" disabled={!canAfford(g.wallet, price)} onClick={() => buy(s, price)}>
            Buy
          </button>
          {dust && g.wallet.dust >= dust.dust && (
            <button type="button" className="i-btn i-btn--sm" onClick={() => buy(s, dust)}>
              {num(dust.dust)} 星
            </button>
          )}
        </>
      )}
    </div>
  );
}

function Exchange() {
  const g = useGame();
  const [from, setFrom] = useState<SectionId>('cabinet');
  const [to, setTo] = useState<SectionId>('violin');
  const bought = gemsBoughtThisWeek(g);
  const left = GEM_EXCHANGE.weekly - bought;
  return (
    <>
      <H2 aside="a bad rate, on purpose">Exchange</H2>
      <div className="gm-ex">
        <div className="gm-ex__row">
          <span>
            <b>Ryō → Tama</b>
            <small>
              {GEM_EXCHANGE.coins} Ryō each · {left} left this week
            </small>
          </span>
          <button type="button" className="i-btn i-btn--sm" disabled={left < 1 || g.wallet.coins < GEM_EXCHANGE.coins} onClick={() => exchangeGems(1)}>
            Buy 1
          </button>
          <button type="button" className="i-btn i-btn--sm" disabled={left < 5 || g.wallet.coins < GEM_EXCHANGE.coins * 5} onClick={() => exchangeGems(5)}>
            Buy 5
          </button>
        </div>
        <div className="gm-ex__row">
          <span>
            <b>Stardust → ticket</b>
            <small>{DUST_TICKET} Stardust a capsule ticket</small>
          </span>
          <button type="button" className="i-btn i-btn--sm" disabled={g.wallet.dust < DUST_TICKET} onClick={exchangeDust}>
            Swap
          </button>
        </div>
        <div className="gm-ex__mats">
          <b>Materials, {MAT_EXCHANGE} for 1</b>
          <div className="gm-ex__pick">
            <label>
              Give
              <select value={from} onChange={(e) => setFrom(e.target.value as SectionId)}>
                {MAT_IDS.map((s) => (
                  <option key={s} value={s}>
                    {MATS[s].name} ({g.wallet.mats[s]})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Get
              <select value={to} onChange={(e) => setTo(e.target.value as SectionId)}>
                {MAT_IDS.map((s) => (
                  <option key={s} value={s}>
                    {MATS[s].name} ({g.wallet.mats[s]})
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="i-btn i-btn--sm" disabled={from === to || g.wallet.mats[from] < MAT_EXCHANGE} onClick={() => exchangeMats(from, to)}>
              Swap
            </button>
          </div>
          <span className="gm-ex__have">
            <MatAmt s={from} n={g.wallet.mats[from]} />→<MatAmt s={to} n={g.wallet.mats[to]} />
          </span>
        </div>
      </div>
    </>
  );
}
