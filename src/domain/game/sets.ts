/**
 * Gear sets: four pieces that go together. Own all four and the set's title is yours to claim, with
 * a prize. Which pieces you own comes from the wallet; claiming is one `gm_tx` claim row.
 */
import { cosmeticOf, RARITY, TITLES, type Bag, type Rarity } from './catalog';
import { EVENTS } from './events';
import type { Tx } from './wallet';

export interface GearSet {
  id: string;
  name: string;
  kanji: string;
  /** 'hat:kitsune' and so on. */
  items: string[];
  /** The title the set gives. */
  title: string;
  festival?: boolean;
}

const PRIZE: Record<Rarity, Bag> = {
  common: { gems: 25, chests: ['wood'] },
  rare: { gems: 40, chests: ['iron'] },
  epic: { gems: 60, chests: ['iron'] },
  legendary: { gems: 120, chests: ['gold'] },
  mythic: { gems: 250, chests: ['mythic'] },
};

const S = (id: string, name: string, kanji: string, hat: string, pet: string, aura: string, paint: string, festival = false): GearSet => ({
  id,
  name,
  kanji,
  items: [`hat:${hat}`, `pet:${pet}`, `aura:${aura}`, `paint:${paint}`],
  title: `set_${id}`,
  festival,
});

export const SETS: GearSet[] = [
  S('farm', 'Farmhand', '農', 'kasa', 'chick', 'dust', 'clay'),
  S('cosy', 'Cosy', '和', 'catears', 'slime', 'bubbles', 'bubblegum'),
  S('class', 'Top Set', '学', 'mortar', 'goldfish', 'notes', 'denim'),
  S('ninja', 'Ninja', '忍', 'headband', 'shuriken', 'embers', 'sumi'),
  S('shrine', 'Shrine Keeper', '社', 'kitsune', 'wisp', 'sigil', 'lacquer'),
  S('arcade', 'Arcade Rat', '遊', 'headphones', 'cube', 'matrix', 'neon'),
  S('storm', 'Storm Chaser', '嵐', 'propeller', 'bat', 'lightning', 'glacier'),
  S('space', 'Deep Space', '宙', 'wizard', 'moon', 'galaxy', 'ultra'),
  S('royal', 'Royal Court', '王', 'crown', 'dragon', 'rays', 'gold'),
  S('void', 'The Beyond', '虚', 'sunwheel', 'blackhole', 'eclipse', 'void'),
  ...EVENTS.map((e) => S(e.id, e.name, e.kanji.slice(0, 1), e.hat, e.pet, e.aura, e.paint, true)),
];

/** The set's rarity is its rarest piece's. */
export function setRarity(s: GearSet): Rarity {
  let top: Rarity = 'common';
  for (const it of s.items) {
    const r = cosmeticOf(it)?.entry.rarity;
    if (r && RARITY[r].order > RARITY[top].order) top = r;
  }
  return top;
}

/** What claiming a set gives: Tama and a chest by rarity (festival sets as Legendary), and the title. */
export function setPrize(s: GearSet): Bag {
  const p = PRIZE[s.festival ? 'legendary' : setRarity(s)];
  return { ...p, items: [`title:${s.title}`] };
}

export const setTitleName = (s: GearSet) => TITLES.find((t) => t.id === s.title)?.name ?? s.title;

export interface SetProgress {
  set: GearSet;
  have: string[];
  complete: boolean;
  claimed: boolean;
}

export function setsProgress(items: Set<string>, txs: Tx[]): SetProgress[] {
  const claimed = new Set(txs.filter((t) => t.type === 'claim' && t.ref.startsWith('set:')).map((t) => t.ref.slice(4)));
  return SETS.map((set) => {
    const have = set.items.filter((it) => items.has(it));
    return { set, have, complete: have.length === set.items.length, claimed: claimed.has(set.id) };
  });
}
