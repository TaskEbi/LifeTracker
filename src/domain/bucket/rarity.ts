/**
 * How rare a wish is. It sets how big the moment is when it's crossed off, and nothing else (the XP
 * stays the same). Guessed from the wish's section until you choose; a choice lives in
 * `lt_bucket.data.rarity`.
 */
import { sectionOf, type BucketSectionId } from './sections';

export const RARITIES = [
  { id: 'common', name: 'Common', stars: 1, kanji: '並', color: '#c4ccd4' },
  { id: 'rare', name: 'Rare', stars: 2, kanji: '稀', color: '#6fc3ff' },
  { id: 'epic', name: 'Epic', stars: 3, kanji: '極', color: '#c98cff' },
  { id: 'legendary', name: 'Legendary', stars: 4, kanji: '伝説', color: '#ffc94d' },
] as const;

export type RarityId = (typeof RARITIES)[number]['id'];
export const rarityInfo = (id: RarityId) => RARITIES.find((r) => r.id === id)!;
export const isRarity = (v: unknown): v is RarityId => RARITIES.some((r) => r.id === v);

const BY_SECTION: Record<BucketSectionId, RarityId> = {
  taste: 'common',
  wealth: 'common',
  travel: 'rare',
  mind: 'rare',
  people: 'rare',
  self: 'rare',
  other: 'rare',
  body: 'epic',
  art: 'epic',
  make: 'epic',
  adventure: 'epic',
  moments: 'legendary',
  life: 'legendary',
};

export const guessRarity = (b: { title: string; note: string | null; data: Record<string, unknown> }): RarityId => BY_SECTION[sectionOf(b)];

export const rarityOf = (b: { title: string; note: string | null; data: Record<string, unknown> }): RarityId => (isRarity(b.data.rarity) ? b.data.rarity : guessRarity(b));
