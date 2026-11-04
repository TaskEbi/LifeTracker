/** 店: this week's shelf, the daily deal, things to use, the full catalogue and the exchange. */
import { useState, type CSSProperties } from 'react';
import { useToday, useProgress } from '../../data/lt';
import { data } from '../../data/store';
import type { SectionId } from '../../data/types';
import { CHASSIS, CONSUMABLES, COSMETIC_NAME, DUST_PRICE, MAT_IDS, MATS, RARITY, type Bag, type CosmeticKind, type Rarity } from '../../domain/game/catalog';
import { catalogue, consumableItems, dailyDeal, DUST_TICKET, GEM_EXCHANGE, MAT_EXCHANGE, themeItems, weeklyStock, type ShopItem } from '../../domain/game/shop';
import { canAfford, chassisMk } from '../../domain/game/wallet';
import { addDays, weekStart } from '../../domain/log/dates';
import { useStore } from '../../lib/createStore';
import { H2 } from '../../ui/i/bits';
import { ItemThumb, MatAmt, num, Price, Rar } from './bits';
import { showReveal } from './revealStore';
import { boughtThisWeek, buyItem, buyMk, dealTaken, exchangeDust, exchangeGems, exchangeMats, gemsBoughtThisWeek, takeDeal, useGame, useItem } from './store';

const KINDS: { id: CosmeticKind | 'theme'; label: string }[] = [
  { id: 'paint', label: COSMETIC_NAME.paint },
  { id: 'hat', label: COSMETIC_NAME.hat },
  { id: 'pet', label: COSMETIC_NAME.pet },
  { id: 'aura', label: COSMETIC_NAME.aura },
  { id: 'title', label: COSMETIC_NAME.title },
  { id: 'theme', label: 'Colour themes' },
];

function buy(s: ShopItem, cost: Bag = s.cost) {
  if (s.item.startsWith('chassis:')) {
    const [, id, mk] = s.item.split(':');
    buyMk(id, Number(mk) as 1, cost);
    return;
  }
  if (buyItem(s.item, cost, { stock: s.stock }) && !s.stock) showReveal({ kind: 'item', item: s.item });
}

function ShopCard({ s, stage }: { s: ShopItem; stage: number }) {
  const g = useGame();
  const owned = g.wallet.items.has(s.item) || (s.item.startsWith('chassis:') && chassisMk(g.wallet, s.item.split(':')[1]) > 0);
  const ch = s.item.startsWith('chassis:') ? CHASSIS.find((c) => c.id === s.item.split(':')[1]) : null;
  const level = useProgress().overall.level;
  const locked = ch?.level && level < ch.level ? `Reach level ${ch.level}` : null;
  return (
    <div className={`gm-shop${owned ? ' is-owned' : ''}`} style={{ '--a': RARITY[s.rarity].color } as CSSProperties}>
      {!!s.off && <i className="gm-shop__off">−{s.off}%</i>}
      <ItemThumb item={s.item} stage={stage} />
      <b>{s.name}</b>
      <Rar r={s.rarity} />
      {owned ? (
        <small className="gm-shop__own">Owned</small>
      ) : locked ? (
        <small>{locked}</small>
      ) : (
        <>
          <Price cost={s.cost} w={g.wallet} />
          <button type="button" className="i-btn i-btn--sm" onClick={() => buy(s)} disabled={!canAfford(g.wallet, s.cost)}>
            Buy
          </button>
        </>
      )}
    </div>
  );
}

export function ShopTab() {
  const today = useToday();
  const g = useGame();
  const stage = useProgress().overall.stage;
  const st = useStore(data, (s) => s);
  const [kind, setKind] = useState<CosmeticKind | 'theme'>('paint');
  const monday = weekStart(today);
  const stock = weeklyStock(monday);
  const deal = dailyDeal(today);
  const taken = dealTaken(st, today);
  const list = kind === 'theme' ? themeItems() : catalogue(kind);
  const refresh = Math.max(1, Math.round((Date.parse(addDays(monday, 7)) - Date.parse(today)) / 86400000));
  return (
    <>
      <H2 aside={`new stock in ${refresh} day${refresh === 1 ? '' : 's'}`}>This week's shelf</H2>
      <div className="gm-shelf">
        {stock.map((s) => (
          <ShopCard key={s.item} s={s} stage={stage} />
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

      <H2>Items</H2>
      <p className="i-note">Each of these does something real to the game. Scrolls and tonics add XP; a bomb hits the actual boss.</p>
      <div className="gm-items">
        {consumableItems().map((c) => {
          const def = CONSUMABLES.find((x) => x.id === c.item)!;
          const have = g.wallet.stock[c.item] ?? 0;
          const left = def.weeklyLimit ? def.weeklyLimit - boughtThisWeek(g, c.item) : null;
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
                <Price cost={def.price} w={g.wallet} />
              </span>
              <span className="gm-item__do">
                <button type="button" className="i-btn i-btn--sm" disabled={left === 0 || !canAfford(g.wallet, def.price)} onClick={() => buy(c)}>
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

      <H2>Catalogue</H2>
      <div className="gm-slots" role="group" aria-label="Kind of thing">
        {KINDS.map((k) => (
          <button key={k.id} type="button" className="gm-slot" aria-pressed={kind === k.id} onClick={() => setKind(k.id)}>
            {k.label}
          </button>
        ))}
      </div>
      <div className="gm-shelf">
        {list.map((s) => (
          <CatalogueCard key={s.item} s={s} stage={stage} />
        ))}
      </div>

      <Exchange />
    </>
  );
}

function CatalogueCard({ s, stage }: { s: ShopItem; stage: number }) {
  const g = useGame();
  const owned = g.wallet.items.has(s.item);
  const dust = s.kind !== 'theme' ? { dust: DUST_PRICE[s.rarity as Rarity] } : null;
  return (
    <div className={`gm-shop${owned ? ' is-owned' : ''}`} style={{ '--a': RARITY[s.rarity].color } as CSSProperties}>
      <ItemThumb item={s.item} stage={stage} />
      <b>{s.name}</b>
      <Rar r={s.rarity} />
      {owned ? (
        <small className="gm-shop__own">Owned</small>
      ) : (
        <>
          <Price cost={s.cost} w={g.wallet} />
          <button type="button" className="i-btn i-btn--sm" disabled={!canAfford(g.wallet, s.cost)} onClick={() => buy(s)}>
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
