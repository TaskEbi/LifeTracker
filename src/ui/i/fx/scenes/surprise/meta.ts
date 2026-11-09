/**
 * What each surprise scene says and how long it runs. Kept apart from the scenes themselves, which
 * load in their own chunk: the celebration layer needs these words and timings at once.
 */
import type { SurpriseId } from '../../../../../domain/fun/surprise';

export interface SurpriseMeta {
  /** Scene colour (backdrop tint, splash, caption chip). */
  color: string;
  /** Length and the splash page's moment, ms. */
  dur: number;
  hit: number;
  title: string;
  /** The caption's line. */
  line: string;
}

export const SURPRISE_META: Record<SurpriseId, SurpriseMeta> = {
  concert: { color: '#ffb347', dur: 6600, hit: 3700, title: 'Standing ovation', line: 'The hall is on its feet. Encore!' },
  accepted: { color: '#1fd17a', dur: 6400, hit: 3600, title: 'Accepted', line: 'All tests passed on the first submit.' },
  ekiden: { color: '#ff7a2f', dur: 6500, hit: 3600, title: 'Ekiden relay', line: 'The sash is handed on. Fastest on the stage.' },
  deadlift: { color: '#ff4d4d', dur: 6500, hit: 3650, title: 'Heavy lift', line: 'The floor gave way before you did.' },
  hanamaru: { color: '#60a5fa', dur: 6500, hit: 3650, title: 'Hanamaru', line: 'Full marks, with a flower round it.' },
  checkmate: { color: '#c9b48a', dur: 6600, hit: 3750, title: 'Checkmate', line: 'The king lies down.' },
  dreamsheep: { color: '#9b8cff', dur: 6800, hit: 3900, title: 'Counting sheep', line: 'One, two, three… sleep well logged.' },
  unplug: { color: '#38bdf8', dur: 6600, hit: 3750, title: 'Unplugged', line: 'The notifications can wait. Outside is better.' },
  treasure: { color: '#ffc23d', dur: 6700, hit: 3800, title: 'Treasure found', line: 'Another piece for the collection.' },
  shinkansen: { color: '#00b3a4', dur: 6700, hit: 3800, title: 'Departure', line: 'Next stop: the future you’re building.' },
  storybook: { color: '#c084fc', dur: 6700, hit: 3800, title: 'Into the story', line: 'The pages turned into a world.' },
  qed: { color: '#ec4899', dur: 6600, hit: 3700, title: 'Q.E.D.', line: 'Which was to be demonstrated.' },
  ramen: { color: '#ff9f1c', dur: 6400, hit: 3600, title: 'Ramen break', line: 'Earned it. Slurp loudly.' },
  catpost: { color: '#f4a261', dur: 6500, hit: 3650, title: 'Special delivery', line: 'A cat brought you a gold star.' },
  wishstar: { color: '#a5b4fc', dur: 6800, hit: 3900, title: 'Shooting star', line: 'Make a wish. Then go and do it.' },
  sumo: { color: '#f97316', dur: 6300, hit: 3500, title: 'Sumo slam', line: 'Pushed clean out of the ring.' },
  ninja: { color: '#8b5cf6', dur: 6300, hit: 3500, title: 'Rooftop ninja', line: 'In and out before anyone saw.' },
  iai: { color: '#e5e7eb', dur: 6400, hit: 3700, title: 'One cut', line: 'A single draw. Clean through.' },
  kaiju: { color: '#a78bfa', dur: 6800, hit: 3900, title: 'Kaiju attack', line: 'The monster met a bigger robot.' },
  hanabi: { color: '#f472b6', dur: 7200, hit: 4000, title: 'Fireworks', line: 'The whole river lit up for you.' },
  fuji: { color: '#fb923c', dur: 7000, hit: 4000, title: 'Summit', line: 'Sunrise from the top of Fuji.' },
  koi: { color: '#ef4444', dur: 7000, hit: 4000, title: 'Up the waterfall', line: 'The carp that keeps climbing becomes a dragon.' },
  manekineko: { color: '#facc15', dur: 6300, hit: 3500, title: 'Lucky cat', line: 'Fortune waved you in.' },
  daruma: { color: '#dc2626', dur: 6600, hit: 3800, title: 'Daruma', line: 'The second eye is painted in.' },
  kendama: { color: '#f59e0b', dur: 6200, hit: 3500, title: 'Kendama', line: 'Spike. First try.' },
  rocket: { color: '#60a5fa', dur: 7000, hit: 4000, title: 'Lift-off', line: 'Three, two, one… gone.' },
  thunder: { color: '#fde047', dur: 6500, hit: 3700, title: 'Power surge', line: 'Something just woke up.' },
  cranes: { color: '#f9a8d4', dur: 6900, hit: 3900, title: 'A thousand cranes', line: 'One fold at a time, they take off.' },
  taiko: { color: '#ef4444', dur: 6400, hit: 3600, title: 'Taiko', line: 'Every beat landed.' },
  bento: { color: '#84cc16', dur: 6400, hit: 3600, title: 'Bento', line: 'Packed with everything good.' },
  ekistamp: { color: '#2dd4bf', dur: 6200, hit: 3500, title: 'Station stamp', line: 'Another stamp on the card.' },
  gacha: { color: '#ff6fae', dur: 6600, hit: 3800, title: 'Jackpot', line: 'The rainbow capsule!' },
  sakura: { color: '#fbcfe8', dur: 7000, hit: 4000, title: 'Sakura storm', line: 'The whole tree let go at once.' },
  onsen: { color: '#fdba74', dur: 6800, hit: 3900, title: 'Hot spring', line: 'Rest is part of the training.' },
  highscore: { color: '#ff2e93', dur: 6400, hit: 3700, title: 'New high score', line: 'Top of the board. Enter your initials.' },
  paperplane: { color: '#7dd3fc', dur: 6700, hit: 3900, title: 'Paper plane', line: 'It just kept flying.' },
  dragon: { color: '#34d399', dur: 7200, hit: 4100, title: 'Dragon ride', line: 'Above the clouds on a dragon’s back.' },
  forge: { color: '#fb923c', dur: 6600, hit: 3800, title: 'The forge', line: 'Struck, folded, tempered. Sharper.' },
  matcha: { color: '#86efac', dur: 7000, hit: 4100, title: 'Tea ceremony', line: 'One bowl, one moment, all yours.' },
  mochi: { color: '#fef08a', dur: 7000, hit: 4000, title: 'Moon rabbits', line: 'Pounding mochi on the moon tonight.' },
};
