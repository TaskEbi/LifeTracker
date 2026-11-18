/**
 * The Ladder: the Cosmos' layers 5 to 40, above Transcend. Each is done with a verb, pays a
 * currency of its own and has a colour (a hue). What they share (the need, the payout, the four
 * upgrades and five milestones) lives in cosmos.ts; what makes each one its own is here:
 *
 * - its **key**: something different to do before it opens the first time (how it's checked is
 *   `KEYS` in cosmos.ts; once a rung has been done, it stays open);
 * - its **gift**: a power of its own, kept for good, that grows at 1, 10, 100, 1,000 and 10,000
 *   times done (`giftLv` in cosmos.ts; what each one does is wired where it acts).
 */

export interface RungDef {
  /** Layer number, 5–40. */
  n: number;
  verb: string;
  kanji: string;
  coin: string;
  coinKanji: string;
  /** The colour it's drawn in (hsl hue). */
  hue: number;
  blurb: string;
  /** The gift: its name, a sign, and what it does at a level (1–6). */
  gift: string;
  giftKanji: string;
  giftText: (lv: number) => string;
}

const x = (n: number) => `×${n.toLocaleString('en-GB', { maximumFractionDigits: 2 })}`;
const pow10 = (e: number) => (e <= 6 ? x(10 ** e) : `×1e${e}`);

export const RUNGS: RungDef[] = [
  { n: 5, verb: 'Unravel', kanji: '解', coin: 'threads', coinKanji: '糸', hue: 320, blurb: 'Pull the thread that holds the aeons together.', gift: 'Loose Ends', giftKanji: '綻', giftText: (lv) => `Each Transcend needs ${x(+(1.6 - 0.06 * lv).toFixed(2))} the galaxies of the last, not ×1.6.` },
  { n: 6, verb: 'Eclipse', kanji: '蝕', coin: 'umbra', coinKanji: '影', hue: 270, blurb: 'Stand between the light and everything it touches.', gift: 'Totality', giftKanji: '皆', giftText: (lv) => `${lv >= 5 ? 'Every shooting star' : `Every ${['', '5th', '4th', '3rd', '2nd'][lv]} shooting star`} is an eclipse: its gift is five times as strong.` },
  { n: 7, verb: 'Nova', kanji: '新', coin: 'cinders', coinKanji: '燼', hue: 18, blurb: 'Burn the whole ladder down to bright ash.', gift: 'Afterburn', giftKanji: '燃', giftText: (lv) => `The first minute of every run burns hot: dust ${pow10(lv)}.` },
  { n: 8, verb: 'Drift', kanji: '漂', coin: 'currents', coinKanji: '潮', hue: 190, blurb: 'Let go, and be carried somewhere larger.', gift: 'Undertow', giftKanji: '流', giftText: (lv) => (lv >= 3 ? 'Dust upgrades are never lost.' : lv === 2 ? 'Dust upgrades are kept through an Ignite and a Collapse.' : 'Dust upgrades are kept through an Ignite.') },
  { n: 9, verb: 'Fold', kanji: '折', coin: 'creases', coinKanji: '襞', hue: 45, blurb: 'Fold space until both ends meet.', gift: 'Crease', giftKanji: '畳', giftText: (lv) => `Bodies resonate at every ${50 - 5 * lv} owned, not every 50.` },
  { n: 10, verb: 'Weave', kanji: '織', coin: 'weft', coinKanji: '緯', hue: 140, blurb: 'Every thread you pulled, woven into cloth.', gift: 'Warp and Weft', giftKanji: '経', giftText: (lv) => `The constellation is never lost, and each star lit adds dust ${x(1 + 0.1 * lv)}.` },
  { n: 11, verb: 'Shatter', kanji: '砕', coin: 'splinters', coinKanji: '屑', hue: 200, blurb: 'Break the cloth into a billion bright pieces.', gift: 'Splinters', giftKanji: '片', giftText: (lv) => `Shards come ${x(1 + lv)} from everything that pays them.` },
  { n: 12, verb: 'Bloom', kanji: '咲', coin: 'pollen', coinKanji: '粉', hue: 330, blurb: 'Something grows out of the pieces.', gift: 'Pollen', giftKanji: '蕊', giftText: (lv) => `Every time a layer pays cores, it pays ${lv} more.` },
  { n: 13, verb: 'Resound', kanji: '鳴', coin: 'chimes', coinKanji: '鈴', hue: 55, blurb: 'Strike the sky like a bell.', gift: 'Reverberation', giftKanji: '響', giftText: (lv) => `Echoes ring louder: (times done + 1) to the power ${(0.2 + 0.03 * lv).toFixed(2)}, not 0.2.` },
  { n: 14, verb: 'Dream', kanji: '夢', coin: 'visions', coinKanji: '幻', hue: 255, blurb: 'Sleep, and wake up somewhere that was always there.', gift: 'Lucid', giftKanji: '明', giftText: (lv) => `While you’re away: ${4 * lv} more hours, ${15 * lv}% faster.` },
  { n: 15, verb: 'Forge', kanji: '鍛', coin: 'ingots', coinKanji: '鋼', hue: 25, blurb: 'Hammer the dreams into something you can hold.', gift: 'Tempering', giftKanji: '錬', giftText: (lv) => `Void upgrades are never lost, and dark matter ${x(1 + lv)}.` },
  { n: 16, verb: 'Crown', kanji: '戴', coin: 'regalia', coinKanji: '宝', hue: 48, blurb: 'Wear what you made.', gift: 'Regalia', giftKanji: '冕', giftText: (lv) => `${lv >= 5 ? 3 : lv >= 3 ? 2 : 1} more relic${lv >= 3 ? 's' : ''} can be worn.` },
  { n: 17, verb: 'Vortex', kanji: '渦', coin: 'spirals', coinKanji: '旋', hue: 175, blurb: 'Spin until the centre is somewhere else.', gift: 'Spin-up', giftKanji: '転', giftText: (lv) => `Everything runs ${x(1 + 0.25 * lv)} as fast.` },
  { n: 18, verb: 'Sunder', kanji: '裂', coin: 'rifts', coinKanji: '隙', hue: 350, blurb: 'Tear a seam in what the spiral left.', gift: 'Rift', giftKanji: '割', giftText: (lv) => `Challenge goals are ${pow10(2 * lv)} smaller.` },
  { n: 19, verb: 'Mirror', kanji: '映', coin: 'glints', coinKanji: '輝', hue: 210, blurb: 'See the whole ladder twice.', gift: 'Reflection', giftKanji: '鑑', giftText: (lv) => `Every relic you wear works as if it were ${lv} level${lv === 1 ? '' : 's'} higher, even past the top.` },
  { n: 20, verb: 'Myth', kanji: '神', coin: 'legends', coinKanji: '伝', hue: 35, blurb: 'Become a story the stars tell.', gift: 'Legend', giftKanji: '譚', giftText: (lv) => `Each feat adds ${5 + 2 * lv}% dust, not 5%.` },
  { n: 21, verb: 'Hush', kanji: '寂', coin: 'silences', coinKanji: '静', hue: 230, blurb: 'Turn everything down to nothing, carefully.', gift: 'Stillness', giftKanji: '黙', giftText: (lv) => `Research runs ${x(1 + 0.5 * lv)} as fast.` },
  { n: 22, verb: 'Origin', kanji: '源', coin: 'sources', coinKanji: '元', hue: 100, blurb: 'Go back to before the first speck of dust.', gift: 'Wellspring', giftKanji: '泉', giftText: (lv) => `Every run starts with ${25 * lv} of each body.` },
  { n: 23, verb: 'Loop', kanji: '輪', coin: 'circles', coinKanji: '円', hue: 285, blurb: 'Find that the end is where you began.', gift: 'Recurrence', giftKanji: '巡', giftText: (lv) => `The Ladder’s drips (its rungs paying a share of themselves) are ${x(2 ** lv)} as strong.` },
  { n: 24, verb: 'Paradox', kanji: '逆', coin: 'riddles', coinKanji: '謎', hue: 160, blurb: 'Climb down the ladder upwards.', gift: 'Inversion', giftKanji: '反', giftText: (lv) => `Each challenge tier counts ${x(1 + 0.5 * lv)} towards its reward.` },
  { n: 25, verb: 'Genesis', kanji: '創', coin: 'sparks', coinKanji: '火', hue: 12, blurb: 'Make a sky of your own.', gift: 'Seed of Worlds', giftKanji: '胚', giftText: (lv) => `Quasar Wheels and World Trees gather ${pow10(lv)} as much.` },
  { n: 26, verb: 'Oblivion', kanji: '忘', coin: 'voids', coinKanji: '虚', hue: 260, blurb: 'Forget the sky, and keep only the climbing.', gift: 'Forgetting', giftKanji: '却', giftText: (lv) => `Rung upgrades are kept when a higher rung is done, and cost ${x(2 ** lv)} less.` },
  { n: 27, verb: 'Eternity', kanji: '永', coin: 'ages', coinKanji: '代', hue: 300, blurb: 'Stop counting time; let it count you.', gift: 'Long Now', giftKanji: '久', giftText: (lv) => `The daily alignment’s days in a row never break; it pays ${x(1 + lv)} shards and its Frenzy lasts ${2 + 2 * lv} minutes.` },
  { n: 28, verb: 'Absolute', kanji: '絶', coin: 'truths', coinKanji: '真', hue: 180, blurb: 'Nothing left that could be otherwise.', gift: 'Certainty', giftKanji: '確', giftText: (lv) => `Every shooting star brings all four gifts at once${lv > 1 ? `, and its Windfall is ${x(lv)}` : ''}.` },
  { n: 29, verb: 'Omega', kanji: '終', coin: 'endings', coinKanji: '結', hue: 0, blurb: 'The last of the old ladder.', gift: 'Last Word', giftKanji: '尽', giftText: (lv) => `Altitude grows ${x(+(2.4 + 0.1 * lv).toFixed(1))} a rung, not ×2.4.` },
  { n: 30, verb: 'Aleph', kanji: '全', coin: 'alephs', coinKanji: '一', hue: 50, blurb: 'Everything at once, and a door behind it.', gift: 'All at Once', giftKanji: '遍', giftText: () => 'Every other gift is one level higher.' },
  { n: 31, verb: 'Hollow', kanji: '洞', coin: 'hollows', coinKanji: '空', hue: 215, blurb: 'Carve a space where everything was.', gift: 'Emptiness', giftKanji: '窪', giftText: (lv) => `Each body’s price climbs ${lv}% less each time.` },
  { n: 32, verb: 'Gild', kanji: '鍍', coin: 'gilt', coinKanji: '箔', hue: 44, blurb: 'Cover the hollow in gold leaf.', gift: 'Golden Hour', giftKanji: '金', giftText: (lv) => `A Frenzy is ×${3 + 3 * lv}, not ×3.` },
  { n: 33, verb: 'Crystallize', kanji: '晶', coin: 'facets', coinKanji: '面', hue: 195, blurb: 'Let the gold set hard, in facets.', gift: 'Facets', giftKanji: '稜', giftText: (lv) => `Every rung lifts the four first layers harder: to the power ${2 + 0.25 * lv}, not 2.` },
  { n: 34, verb: 'Tessellate', kanji: '甃', coin: 'tiles', coinKanji: '瓦', hue: 120, blurb: 'Cover the sky in a pattern with no end.', gift: 'Tiling', giftKanji: '嵌', giftText: (lv) => `Every part of the Orrery goes ${2 * lv} levels higher.` },
  { n: 35, verb: 'Hymn', kanji: '讃', coin: 'hymns', coinKanji: '歌', hue: 340, blurb: 'Sing the pattern back to itself.', gift: 'Choir', giftKanji: '頌', giftText: (lv) => `Each level of Mastery makes its body ${x(2 + 0.5 * lv)}, not ×2.` },
  { n: 36, verb: 'Wander', kanji: '彷', coin: 'paths', coinKanji: '径', hue: 75, blurb: 'Walk off the edge of the map.', gift: 'Wayfarer', giftKanji: '旅', giftText: (lv) => `Bounties pay ${x(1 + lv)}, and one can be swapped every ${Math.round(10 / (1 + lv))} minutes.` },
  { n: 37, verb: 'Awaken', kanji: '覚', coin: 'wakes', coinKanji: '醒', hue: 280, blurb: 'Open your eyes inside the sky.', gift: 'Wakefulness', giftKanji: '起', giftText: (lv) => `Each rank of Renown adds ${15 + 5 * lv}% dust, not 15%.` },
  { n: 38, verb: 'Return', kanji: '帰', coin: 'homecomings', coinKanji: '郷', hue: 30, blurb: 'Come home to the first speck of dust.', gift: 'Homecoming', giftKanji: '故', giftText: (lv) => `Starlight, dark matter and galaxies ${pow10(2 * lv)}.` },
  { n: 39, verb: 'Unbind', kanji: '放', coin: 'freedoms', coinKanji: '自', hue: 165, blurb: 'Let go of every hand that helps.', gift: 'Freedom', giftKanji: '翔', giftText: (lv) => `Each rung needs ${x(+(3 - 0.2 * lv).toFixed(1))} what the one below it does, not ×3.` },
  { n: 40, verb: 'Become', kanji: '成', coin: 'worlds', coinKanji: '界', hue: 52, blurb: 'Stop climbing the sky, and be it.', gift: 'The Sky', giftKanji: '天', giftText: (lv) => `Dust ${pow10(20 * lv)}, and every layer and rung pays ${x(1 + lv)}.` },
];

export const rungDef = (n: number) => RUNGS.find((r) => r.n === n);
