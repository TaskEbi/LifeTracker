/**
 * 15 Nov 2026 (M52): the phone's Aura Dial save was replaced by an older copy from the PC (M51 kept
 * the copy with more rolls; the PC's had more). There was no backup, so this puts back what was
 * remembered, once, on whichever device opens the dial first; the merge carries it to the others.
 *
 * Remembered: found everything up to 1 in 80 million, and Stack Overflow (1 in 120 million); Oiled
 * Dial ~24, Mote Sieve ~22, Sleepwalker maxed, Night Dial 8, Short Fuse every 6 rolls (level 4),
 * Extra Dial 6 rolls a turn (level 5), Omamori ~25. Guessed, from what those cost: Charged Roll 6,
 * Steady Hand maxed, Bolt Feed 2, and 50 million motes in hand.
 */
import { AURAS, type AuraRestore } from '../../domain/game/aura';

export const AURA_RESTORE: AuraRestore = {
  id: 'm52-restore',
  found: AURAS.filter((a) => a.odds <= 80_000_000 || a.id === 'overflow').map((a) => a.id),
  ups: { speed: 24, sieve: 22, sleep: 5, night: 8, fuse: 4, multi: 5, luck: 25, charge: 6, hand: 8, feed: 2 },
  motes: 50_000_000,
};
