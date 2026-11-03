/**
 * Words from other people, for the days you don't feel like it. Popular quotes are often credited
 * to the wrong person, so the famous fakes ("If you're going through hell…" isn't Churchill, "It
 * always seems impossible…" isn't Mandela) are left out, and each line says how sure we are:
 *   sourced    the work or occasion is known
 *   loose      the source is known, but the wording varies between reports or editions
 *   attributed widely credited, with no firm source found
 * Translations of the Japanese lines are ours.
 */

export const FEELINGS = [
  { id: 'flat', kanji: '無', label: 'I can’t be bothered', short: 'No motivation' },
  { id: 'tired', kanji: '疲', label: 'I’m exhausted', short: 'Exhausted' },
  { id: 'failed', kanji: '敗', label: 'Something went wrong', short: 'After a failure' },
  { id: 'swamped', kanji: '山', label: 'There’s too much at once', short: 'Too much' },
  { id: 'doubt', kanji: '疑', label: 'I’m not good enough', short: 'Self-doubt' },
  { id: 'afraid', kanji: '恐', label: 'I’m scared of what’s coming', short: 'Scared' },
] as const;
export type FeelingId = (typeof FEELINGS)[number]['id'];

export type QuoteTopic = 'japan' | 'running' | 'music' | 'mind';
export const TOPICS: { id: QuoteTopic; label: string }[] = [
  { id: 'japan', label: '日本語' },
  { id: 'running', label: 'Running & sport' },
  { id: 'music', label: 'Music' },
  { id: 'mind', label: 'Maths, code, chess' },
];

export type Trust = 'sourced' | 'loose' | 'attributed';

export interface Quote {
  id: string;
  text: string;
  /** The original, when it isn't English. */
  ja?: string;
  by: string;
  source: string;
  trust: Trust;
  feelings: FeelingId[];
  topics: QuoteTopic[];
}

const q = (id: string, text: string, by: string, source: string, feelings: FeelingId[], extra: { trust?: Trust; topics?: QuoteTopic[]; ja?: string } = {}): Quote => ({
  id,
  text,
  by,
  source,
  feelings,
  trust: extra.trust ?? 'sourced',
  topics: extra.topics ?? [],
  ...(extra.ja ? { ja: extra.ja } : {}),
});
const JP: { topics: QuoteTopic[] } = { topics: ['japan'] };

export const QUOTES: Quote[] = [
  // ── Japanese ──
  q('nanakorobi', 'Fall seven times, get up eight.', 'Japanese proverb', '七転び八起き', ['failed', 'tired'], { ...JP, ja: '七転び八起き' }),
  q('keizoku', 'To keep going is itself a kind of power.', 'Japanese saying', '継続は力なり', ['flat', 'tired'], { ...JP, ja: '継続は力なり' }),
  q('senri', 'Even a journey of a thousand miles starts with one step.', 'Japanese saying, after Laozi', '千里の道も一歩から', ['swamped', 'flat'], { ...JP, ja: '千里の道も一歩から' }),
  q('ishi', 'Three years on a stone, and even a stone grows warm.', 'Japanese proverb', '石の上にも三年', ['tired', 'doubt'], { ...JP, ja: '石の上にも三年' }),
  q('chiri', 'Even dust, piled up, becomes a mountain.', 'Japanese proverb', '塵も積もれば山となる', ['swamped', 'flat'], { ...JP, ja: '塵も積もれば山となる' }),
  q('ame', 'After the rain, the ground sets harder.', 'Japanese proverb', '雨降って地固まる', ['failed', 'afraid'], { ...JP, ja: '雨降って地固まる' }),
  q('naseba', 'Do it, and it can be done. Don’t, and nothing will be. When a thing doesn’t get done, it’s because no one did it.', 'Uesugi Yōzan', 'Letter to his heir, 18th century', ['flat', 'doubt'], { ...JP, ja: '為せば成る 為さねば成らぬ何事も 成らぬは人の為さぬなりけり' }),
  q('musashi-days', 'A thousand days of practice to forge. Ten thousand days of practice to refine.', 'Miyamoto Musashi', 'The Book of Five Rings, Water', ['tired', 'doubt'], { topics: ['japan', 'music'], ja: '千日の稽古を鍛とし、万日の稽古を錬とす', trust: 'loose' }),
  q('musashi-self', 'Today, beat the you of yesterday.', 'Miyamoto Musashi', 'The Book of Five Rings, Water', ['flat', 'doubt'], { ...JP, ja: '今日は昨日の我に勝ち', trust: 'loose' }),
  q('anzai', 'If you give up, the game is over right there.', 'Coach Anzai', 'Slam Dunk, Inoue Takehiko', ['tired', 'doubt', 'failed'], { topics: ['japan', 'running'], ja: 'あきらめたらそこで試合終了ですよ' }),
  q('kamogawa', 'Not everyone who works hard is rewarded. But everyone who succeeds has worked hard.', 'Coach Kamogawa', 'Hajime no Ippo, Morikawa George', ['tired', 'failed'], { topics: ['japan', 'running'], ja: '努力した者が全て報われるとは限らん。しかし！成功した者は皆すべからく努力しておる！' }),

  // ── running and sport ──
  q('murakami-pain', 'Pain is inevitable. Suffering is optional.', 'Haruki Murakami', 'What I Talk About When I Talk About Running, a runner’s mantra he quotes', ['tired'], { topics: ['running', 'japan'] }),
  q('murakami-limits', 'Exerting yourself to the fullest within your individual limits: that’s the essence of running, and a metaphor for life.', 'Haruki Murakami', 'What I Talk About When I Talk About Running', ['doubt', 'tired'], { topics: ['running', 'japan'] }),
  q('kipchoge', 'No human is limited.', 'Eliud Kipchoge', 'Vienna, 2019, after the first marathon distance under two hours', ['doubt', 'afraid'], { topics: ['running'] }),
  q('bingham', 'The miracle isn’t that I finished. The miracle is that I had the courage to start.', 'John Bingham', 'The Courage to Start', ['flat', 'afraid'], { topics: ['running'], trust: 'attributed' }),
  q('zatopek', 'If you want to win something, run 100 metres. If you want to experience something, run a marathon.', 'Emil Zátopek', 'Said later in life', ['tired', 'afraid'], { topics: ['running'], trust: 'attributed' }),
  q('ali', 'Suffer now and live the rest of your life as a champion.', 'Muhammad Ali', 'Reported in The Sunday Gleaner, 1978', ['tired', 'flat'], { topics: ['running'], trust: 'loose' }),
  q('jordan', 'I’ve failed over and over and over again in my life. And that is why I succeed.', 'Michael Jordan', 'Nike advert, 1997', ['failed'], { topics: ['running'] }),
  q('gretzky', 'You miss 100% of the shots you don’t take.', 'Wayne Gretzky', 'Interview, 1983', ['afraid', 'flat'], { topics: ['running'] }),

  // ── music ──
  q('beethoven', 'I will seize fate by the throat; it shall certainly not bend and crush me completely.', 'Ludwig van Beethoven', 'Letter to Franz Wegeler, 1801, as his deafness grew', ['afraid', 'doubt'], { topics: ['music'] }),
  q('casals', 'I feel that I am making daily progress.', 'Pablo Casals', 'In his late sixties, asked why he still practised so hard', ['tired', 'flat'], { topics: ['music'], trust: 'loose' }),
  q('suzuki', 'Practise only on the days that you eat.', 'Shinichi Suzuki', 'To his students', ['flat'], { topics: ['music', 'japan'], trust: 'attributed' }),

  // ── maths, code, chess ──
  q('turing', 'We can only see a short distance ahead, but we can see plenty there that needs to be done.', 'Alan Turing', 'Computing Machinery and Intelligence, 1950', ['swamped', 'flat'], { topics: ['mind'] }),
  q('wiles', 'You enter the first room of the mansion and it’s completely dark. You stumble around bumping into the furniture, but gradually you learn where each piece of furniture is.', 'Andrew Wiles', 'On doing mathematics, after the proof of Fermat’s Last Theorem', ['doubt', 'failed'], { topics: ['mind'], trust: 'loose' }),
  q('capablanca', 'You may learn much more from a game you lose than from a game you win.', 'José Raúl Capablanca', 'He says the same in My Chess Career', ['failed'], { topics: ['mind'], trust: 'attributed' }),
  q('feynman', 'The first principle is that you must not fool yourself, and you are the easiest person to fool.', 'Richard Feynman', 'Cargo Cult Science, Caltech, 1974', ['doubt'], { topics: ['mind'] }),
  q('edison', 'Genius is one per cent inspiration and ninety-nine per cent perspiration.', 'Thomas Edison', 'Reported from about 1903', ['doubt', 'flat'], { topics: ['mind'], trust: 'loose' }),
  q('blake', 'What is now proved was once only imagin’d.', 'William Blake', 'The Marriage of Heaven and Hell', ['doubt'], { topics: ['mind'] }),

  // ── old philosophers ──
  q('marcus-dawn', 'At dawn, when you have trouble getting out of bed, tell yourself: I have to go to work, as a human being.', 'Marcus Aurelius', 'Meditations 5.1', ['flat', 'tired']),
  q('marcus-way', 'The impediment to action advances action. What stands in the way becomes the way.', 'Marcus Aurelius', 'Meditations 5.20', ['failed', 'swamped']),
  q('seneca-imagine', 'We suffer more often in imagination than in reality.', 'Seneca', 'Letters to Lucilius, 13', ['afraid', 'swamped']),
  q('seneca-dare', 'It is not because things are difficult that we do not dare; it is because we do not dare that they are difficult.', 'Seneca', 'Letters to Lucilius, 104', ['afraid', 'doubt']),
  q('confucius', 'Building a mound, if I stop one basket short, it is I who stopped. On level ground, if I tip in one basket, it is I who went forward.', 'Confucius', 'Analects 9.19', ['flat', 'swamped'], { trust: 'loose' }),
  q('nietzsche', 'He who has a why to live for can bear almost any how.', 'Friedrich Nietzsche', 'Twilight of the Idols, as quoted by Viktor Frankl', ['tired', 'doubt']),
  q('frankl', 'Everything can be taken from a man but one thing: the last of the human freedoms, to choose one’s attitude in any given set of circumstances.', 'Viktor Frankl', 'Man’s Search for Meaning', ['failed', 'afraid', 'swamped']),
  q('durant', 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', 'Will Durant', 'The Story of Philosophy, summing up Aristotle (it’s often credited to Aristotle himself)', ['flat']),
  q('clear-systems', 'You do not rise to the level of your goals. You fall to the level of your systems.', 'James Clear', 'Atomic Habits', ['flat', 'swamped']),
  q('clear-vote', 'Every action you take is a vote for the type of person you wish to become.', 'James Clear', 'Atomic Habits', ['flat', 'doubt']),

  // ── books and poems ──
  q('beckett-fail', 'Ever tried. Ever failed. No matter. Try again. Fail again. Fail better.', 'Samuel Beckett', 'Worstward Ho', ['failed']),
  q('beckett-on', 'You must go on. I can’t go on. I’ll go on.', 'Samuel Beckett', 'The Unnamable', ['tired']),
  q('rilke', 'Let everything happen to you: beauty and terror. Just keep going. No feeling is final.', 'Rainer Maria Rilke', 'Book of Hours, translated by Barrows and Macy', ['afraid', 'tired', 'swamped']),
  q('camus', 'In the depth of winter, I finally learned that within me there lay an invincible summer.', 'Albert Camus', 'Return to Tipasa', ['tired', 'doubt'], { trust: 'loose' }),
  q('hemingway-broken', 'The world breaks every one and afterward many are strong at the broken places.', 'Ernest Hemingway', 'A Farewell to Arms', ['failed']),
  q('hemingway-defeat', 'A man can be destroyed but not defeated.', 'Ernest Hemingway', 'The Old Man and the Sea', ['failed', 'tired']),
  q('tolkien', 'All we have to decide is what to do with the time that is given us.', 'J. R. R. Tolkien', 'The Fellowship of the Ring', ['swamped', 'afraid']),
  q('kipling', 'And so hold on when there is nothing in you / Except the Will which says to them: “Hold on!”', 'Rudyard Kipling', 'If—', ['tired']),
  q('tennyson', 'To strive, to seek, to find, and not to yield.', 'Alfred, Lord Tennyson', 'Ulysses', ['tired', 'doubt']),
  q('henley', 'I am the master of my fate, I am the captain of my soul.', 'William Ernest Henley', 'Invictus', ['afraid', 'doubt']),
  q('angelou', 'You may trod me in the very dirt / But still, like dust, I’ll rise.', 'Maya Angelou', 'Still I Rise', ['failed', 'doubt']),
  q('radmacher', 'Courage doesn’t always roar. Sometimes courage is the quiet voice at the end of the day saying, “I will try again tomorrow.”', 'Mary Anne Radmacher', '', ['tired', 'failed', 'afraid']),

  // ── speeches ──
  q('king', 'If you can’t fly, run; if you can’t run, walk; if you can’t walk, crawl; but by all means keep moving.', 'Martin Luther King Jr.', 'Keep Moving From This Mountain, Spelman College, 1960', ['flat', 'tired', 'swamped'], { trust: 'loose' }),
  q('churchill', 'Never give in, never give in, never, never, never, never, in nothing, great or small, large or petty, never give in except to convictions of honour and good sense.', 'Winston Churchill', 'Harrow School, 1941', ['tired', 'afraid']),
  q('roosevelt', 'The credit belongs to the man who is actually in the arena, whose face is marred by dust and sweat and blood.', 'Theodore Roosevelt', 'Citizenship in a Republic, Paris, 1910', ['failed', 'doubt']),
  q('mandela', 'I learned that courage was not the absence of fear, but the triumph over it.', 'Nelson Mandela', 'Long Walk to Freedom', ['afraid']),
];

export const TRUST_NOTE: Record<Trust, string | null> = {
  sourced: null,
  loose: 'Wording varies',
  attributed: 'Attributed; no firm source',
};

function rng(seedText: string) {
  let h = 2166136261;
  for (let i = 0; i < seedText.length; i++) h = Math.imul(h ^ seedText.charCodeAt(i), 16777619);
  let s = h >>> 0;
  return () => {
    s = (Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9) >>> 0;
    return s / 4294967296;
  };
}

/** The same order for the same seed: a list drawn by date is the same on every device. */
export function shuffled<T>(list: readonly T[], seed: string): T[] {
  const r = rng(seed);
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Today's words. It goes through the whole shelf before repeating, in a different order each round. */
export function wordsOfDay(date: string, maxLength = 110, list: readonly Quote[] = QUOTES): Quote {
  const pool = list.filter((x) => x.text.length <= maxLength);
  const day = Math.floor(Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10)) / 86_400_000);
  const round = Math.floor(day / pool.length);
  return shuffled(pool, `words:${round}`)[day % pool.length];
}

/** Lines for a feeling, in a fresh order each time you come. */
export const quotesFor = (feeling: FeelingId | null, seed: string, list: readonly Quote[] = QUOTES): Quote[] => shuffled(feeling ? list.filter((x) => x.feelings.includes(feeling)) : list, seed);
