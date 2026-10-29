/**
 * The emblem glyphs an achievement can wear. The domain only names them; the drawings live in
 * `src/ui/i/Emblem.tsx`, which must draw every name here.
 */
export const GLYPHS = [
  // general
  'spark', 'star', 'flame', 'bolt', 'crown', 'gem', 'infinity', 'hourglass', 'clock', 'calendar',
  'check', 'scroll', 'target', 'key', 'chest', 'mountain', 'wave', 'sun', 'moon', 'leaf',
  // game
  'sword', 'shield', 'dragon', 'oni', 'torii', 'sakura', 'wing', 'fist', 'eye', 'mask',
  // sections
  'violin', 'note', 'code', 'chip', 'shoe', 'flag', 'compass', 'dumbbell', 'kettlebell', 'book',
  'pencil', 'pawn', 'knight', 'king', 'bed', 'zzz', 'phone', 'lotus', 'cabinet', 'drone',
] as const;
export type Glyph = (typeof GLYPHS)[number];

/** How the Emblems tab groups them. */
export const ACHIEVEMENT_GROUPS = ['start', 'streaks', 'time', 'violin', 'coding', 'sports', 'gym', 'study', 'chess', 'sleep', 'screen', 'tasks', 'cabinet', 'levels', 'quests', 'bosses', 'secret'] as const;
export type AchievementGroup = (typeof ACHIEVEMENT_GROUPS)[number];
