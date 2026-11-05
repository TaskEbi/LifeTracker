/** Small pieces the Hangar's screens share: prices, loot lists, the wallet and thumbnails. */
import type { CSSProperties, ReactNode } from 'react';
import type { SectionId } from '../../data/types';
import { CHESTS, COIN, consumableById, DUST, GEM, MATS, RARITY, TICKET, type Bag, type ChestTier, type Rarity } from '../../domain/game/catalog';
import { DEFAULT_LOADOUT, itemKindName, itemName, type Loadout, type Wallet } from '../../domain/game/wallet';
import { Robot } from '../../ui/i/bots/Robot';
import { accent } from '../../ui/i/bits';

export const num = (n: number) => Math.max(0, n).toLocaleString('en-GB');

/** One currency amount. */
export function Amt({ k, c, n, name, short }: { k: string; c?: string; n: number; name: string; short?: boolean }) {
  return (
    <span className={`gm-amt${short ? ' is-short' : ''}`} style={c ? ({ '--a': c } as CSSProperties) : undefined} aria-label={`${num(n)} ${name}${short ? ', not enough' : ''}`}>
      <i aria-hidden="true">{k}</i>
      <span aria-hidden="true">{num(n)}</span>
    </span>
  );
}

export function MatAmt({ s, n, short }: { s: SectionId; n: number; short?: boolean }) {
  return (
    <span className={`gm-amt gm-amt--mat${short ? ' is-short' : ''}`} style={accent(s)} aria-label={`${n} ${MATS[s].name}${short ? ', not enough' : ''}`}>
      <i aria-hidden="true">{MATS[s].kanji}</i>
      <span aria-hidden="true">{num(n)}</span>
    </span>
  );
}

/** What something costs, in red where you can't pay yet. */
export function Price({ cost, w, tokenName }: { cost: Bag; w?: Wallet; tokenName?: string }) {
  return (
    <span className="gm-price">
      {!!cost.coins && <Amt k={COIN.kanji} c={COIN.color} n={cost.coins} name={COIN.name} short={w && w.coins < cost.coins} />}
      {!!cost.gems && <Amt k={GEM.kanji} c={GEM.color} n={cost.gems} name={GEM.name} short={w && w.gems < cost.gems} />}
      {!!cost.dust && <Amt k={DUST.kanji} c={DUST.color} n={cost.dust} name={DUST.name} short={w && w.dust < cost.dust} />}
      {!!cost.tickets && <Amt k={TICKET.kanji} c={TICKET.color} n={cost.tickets} name={TICKET.name} short={w && w.tickets < cost.tickets} />}
      {Object.entries(cost.tokens ?? {}).map(([k, n]) => (
        <Amt key={k} k="祭" c="#ff8a5c" n={n} name={tokenName ?? 'tokens'} short={w && (w.tokens[k] ?? 0) < n} />
      ))}
      {Object.entries(cost.mats ?? {}).map(([s, n]) => (
        <MatAmt key={s} s={s as SectionId} n={n ?? 0} short={w && w.mats[s as SectionId] < (n ?? 0)} />
      ))}
    </span>
  );
}

const chestWord = (t: ChestTier) => CHESTS[t].name;

/** A bag's contents, one line each, as a chest or a prize lists them. */
export function lootLines(b: Bag): { key: string; node: ReactNode; label: string; rarity?: Rarity }[] {
  const out: { key: string; node: ReactNode; label: string; rarity?: Rarity }[] = [];
  if (b.coins) out.push({ key: 'c', label: `${num(b.coins)} ${COIN.name}`, node: <Amt k={COIN.kanji} c={COIN.color} n={b.coins} name={COIN.name} /> });
  if (b.gems) out.push({ key: 'g', label: `${num(b.gems)} ${GEM.name}`, node: <Amt k={GEM.kanji} c={GEM.color} n={b.gems} name={GEM.name} /> });
  if (b.dust) out.push({ key: 'd', label: `${num(b.dust)} ${DUST.name}`, node: <Amt k={DUST.kanji} c={DUST.color} n={b.dust} name={DUST.name} /> });
  if (b.tickets) out.push({ key: 't', label: `${b.tickets} capsule ticket${b.tickets === 1 ? '' : 's'}`, node: <Amt k={TICKET.kanji} c={TICKET.color} n={b.tickets} name={TICKET.name} /> });
  for (const [s, n] of Object.entries(b.mats ?? {})) {
    if (n) out.push({ key: `m${s}`, label: `${n} ${MATS[s as SectionId].name}`, node: <MatAmt s={s as SectionId} n={n} /> });
  }
  for (const [id, n] of Object.entries(b.stock ?? {})) {
    const c = consumableById(id);
    if (c && n) out.push({ key: `s${id}`, label: `${n} × ${c.name}`, node: <Amt k={c.kanji} c={RARITY[c.rarity].color} n={n} name={c.name} /> });
  }
  for (const t of b.chests ?? []) out.push({ key: `x${t}`, label: chestWord(t), node: <Amt k={CHESTS[t].kanji} c={CHESTS[t].color} n={1} name={chestWord(t)} /> });
  for (const it of b.items ?? []) out.push({ key: `i${it}`, label: `${itemName(it)} (${itemKindName(it)})`, node: <Amt k="新" c="#fff" n={1} name={itemName(it)} /> });
  return out;
}

export function Rar({ r }: { r: Rarity }) {
  return (
    <span className="gm-rar" style={{ '--a': RARITY[r].color } as CSSProperties}>
      {RARITY[r].name}
    </span>
  );
}

/** A still robot in a box. */
export function Thumb({ look, stage = 0, mk }: { look: Partial<Loadout>; stage?: number; mk?: 1 | 2 | 3 }) {
  return (
    <span className="gm-thumb">
      <Robot stage={stage} look={{ ...DEFAULT_LOADOUT, ...look }} still label={false} mk={mk} />
    </span>
  );
}

/** A preview for anything you can own. */
export function ItemThumb({ item, stage }: { item: string; stage: number }) {
  const [kind, id, mk] = item.split(':');
  if (kind === 'chassis') return <Thumb look={{ chassis: id }} mk={(Number(mk) || 1) as 1 | 2 | 3} />;
  if (kind === 'paint') return <Thumb look={{ paint: id }} stage={stage} />;
  if (kind === 'hat') return <Thumb look={{ hat: id }} stage={stage} />;
  if (kind === 'pet') return <Thumb look={{ pet: id }} stage={stage} />;
  if (kind === 'aura') return <Thumb look={{ aura: id }} stage={stage} />;
  return (
    <span className="gm-thumb gm-thumb--word" aria-hidden="true">
      {kind === 'title' ? '称' : kind === 'theme' ? '彩' : '品'}
    </span>
  );
}

/** Time left in a week or event, in words. */
export const daysWord = (n: number) => (n <= 0 ? 'ends today' : n === 1 ? '1 day left' : `${n} days left`);
