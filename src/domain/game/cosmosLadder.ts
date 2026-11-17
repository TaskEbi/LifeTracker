/**
 * The Ladder: the Cosmos' layers 5 to 30, above Transcend. Each is done with a verb, pays a
 * currency of its own and has a colour (a hue). The rules are the same for every rung and live in
 * cosmos.ts; this is only what each one is called.
 */

export interface RungDef {
  /** Layer number, 5–30. */
  n: number;
  verb: string;
  kanji: string;
  coin: string;
  coinKanji: string;
  /** The colour it's drawn in (hsl hue). */
  hue: number;
  blurb: string;
}

export const RUNGS: RungDef[] = [
  { n: 5, verb: 'Unravel', kanji: '解', coin: 'threads', coinKanji: '糸', hue: 320, blurb: 'Pull the thread that holds the aeons together.' },
  { n: 6, verb: 'Eclipse', kanji: '蝕', coin: 'umbra', coinKanji: '影', hue: 270, blurb: 'Stand between the light and everything it touches.' },
  { n: 7, verb: 'Nova', kanji: '新', coin: 'cinders', coinKanji: '燼', hue: 18, blurb: 'Burn the whole ladder down to bright ash.' },
  { n: 8, verb: 'Drift', kanji: '漂', coin: 'currents', coinKanji: '潮', hue: 190, blurb: 'Let go, and be carried somewhere larger.' },
  { n: 9, verb: 'Fold', kanji: '折', coin: 'creases', coinKanji: '襞', hue: 45, blurb: 'Fold space until both ends meet.' },
  { n: 10, verb: 'Weave', kanji: '織', coin: 'weft', coinKanji: '緯', hue: 140, blurb: 'Every thread you pulled, woven into cloth.' },
  { n: 11, verb: 'Shatter', kanji: '砕', coin: 'splinters', coinKanji: '屑', hue: 200, blurb: 'Break the cloth into a billion bright pieces.' },
  { n: 12, verb: 'Bloom', kanji: '咲', coin: 'pollen', coinKanji: '粉', hue: 330, blurb: 'Something grows out of the pieces.' },
  { n: 13, verb: 'Resound', kanji: '鳴', coin: 'chimes', coinKanji: '鈴', hue: 55, blurb: 'Strike the sky like a bell.' },
  { n: 14, verb: 'Dream', kanji: '夢', coin: 'visions', coinKanji: '幻', hue: 255, blurb: 'Sleep, and wake up somewhere that was always there.' },
  { n: 15, verb: 'Forge', kanji: '鍛', coin: 'ingots', coinKanji: '鋼', hue: 25, blurb: 'Hammer the dreams into something you can hold.' },
  { n: 16, verb: 'Crown', kanji: '戴', coin: 'regalia', coinKanji: '宝', hue: 48, blurb: 'Wear what you made.' },
  { n: 17, verb: 'Vortex', kanji: '渦', coin: 'spirals', coinKanji: '旋', hue: 175, blurb: 'Spin until the centre is somewhere else.' },
  { n: 18, verb: 'Sunder', kanji: '裂', coin: 'rifts', coinKanji: '隙', hue: 350, blurb: 'Tear a seam in what the spiral left.' },
  { n: 19, verb: 'Mirror', kanji: '映', coin: 'glints', coinKanji: '輝', hue: 210, blurb: 'See the whole ladder twice.' },
  { n: 20, verb: 'Myth', kanji: '神', coin: 'legends', coinKanji: '伝', hue: 35, blurb: 'Become a story the stars tell.' },
  { n: 21, verb: 'Hush', kanji: '寂', coin: 'silences', coinKanji: '静', hue: 230, blurb: 'Turn everything down to nothing, carefully.' },
  { n: 22, verb: 'Origin', kanji: '源', coin: 'sources', coinKanji: '元', hue: 100, blurb: 'Go back to before the first speck of dust.' },
  { n: 23, verb: 'Loop', kanji: '輪', coin: 'circles', coinKanji: '円', hue: 285, blurb: 'Find that the end is where you began.' },
  { n: 24, verb: 'Paradox', kanji: '逆', coin: 'riddles', coinKanji: '謎', hue: 160, blurb: 'Climb down the ladder upwards.' },
  { n: 25, verb: 'Genesis', kanji: '創', coin: 'sparks', coinKanji: '火', hue: 12, blurb: 'Make a sky of your own.' },
  { n: 26, verb: 'Oblivion', kanji: '忘', coin: 'voids', coinKanji: '虚', hue: 260, blurb: 'Forget the sky, and keep only the climbing.' },
  { n: 27, verb: 'Eternity', kanji: '永', coin: 'ages', coinKanji: '代', hue: 300, blurb: 'Stop counting time; let it count you.' },
  { n: 28, verb: 'Absolute', kanji: '絶', coin: 'truths', coinKanji: '真', hue: 180, blurb: 'Nothing left that could be otherwise.' },
  { n: 29, verb: 'Omega', kanji: '終', coin: 'endings', coinKanji: '結', hue: 0, blurb: 'The last rung but one.' },
  { n: 30, verb: 'Aleph', kanji: '全', coin: 'alephs', coinKanji: '一', hue: 50, blurb: 'Everything at once. The top of the Ladder.' },
];

export const rungDef = (n: number) => RUNGS.find((r) => r.n === n);
