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

  // ── more Japanese: sayings ──
  q('anzuru', 'Doing it is easier than worrying about it.', 'Japanese proverb', '案ずるより産むが易し', ['afraid', 'flat'], { ...JP, ja: '案ずるより産むが易し' }),
  q('shippai', 'Failure is where success comes from.', 'Japanese proverb', '失敗は成功のもと', ['failed'], { ...JP, ja: '失敗は成功のもと' }),
  q('narau', 'Getting used to it beats being taught it.', 'Japanese proverb', '習うより慣れよ', ['flat', 'doubt'], { topics: ['japan', 'music'], ja: '習うより慣れよ' }),
  q('suki', 'What you love, you get good at.', 'Japanese proverb', '好きこそ物の上手なれ', ['doubt', 'flat'], { ...JP, ja: '好きこそ物の上手なれ' }),
  q('isogaba', 'In a hurry? Take the long way round.', 'Japanese proverb', '急がば回れ', ['swamped'], { ...JP, ja: '急がば回れ' }),
  q('ichigo', 'One time, one meeting: this moment comes only once.', 'Japanese saying', 'From the tea ceremony', ['afraid', 'flat'], { ...JP, ja: '一期一会' }),
  q('shoshin', 'Never forget the beginner’s heart.', 'Zeami', 'Kakyō, 1424', ['doubt', 'tired'], { topics: ['japan', 'music'], ja: '初心忘るべからず' }),
  q('tenteki', 'Dripping water wears through stone.', 'Japanese proverb', '点滴石を穿つ', ['tired', 'flat'], { ...JP, ja: '点滴石を穿つ' }),
  q('tetsu', 'Strike the iron while it’s hot.', 'Japanese proverb', '鉄は熱いうちに打て', ['flat'], { ...JP, ja: '鉄は熱いうちに打て' }),
  q('warau', 'Good fortune comes to the house that laughs.', 'Japanese proverb', '笑う門には福来たる', ['tired'], { ...JP, ja: '笑う門には福来たる' }),
  q('kafuku', 'Fortune and misfortune are twisted together like a rope.', 'Japanese proverb', '禍福は糾える縄の如し', ['failed'], { ...JP, ja: '禍福は糾える縄の如し' }),
  q('koketsu', 'No entering the tiger’s den, no tiger cub.', 'Japanese proverb', '虎穴に入らずんば虎子を得ず', ['afraid'], { ...JP, ja: '虎穴に入らずんば虎子を得ず' }),
  q('sonae', 'Prepared, and nothing to fear.', 'Japanese proverb', '備えあれば憂いなし', ['afraid', 'swamped'], { ...JP, ja: '備えあれば憂いなし' }),
  q('jinji', 'Do all a person can, then wait on heaven.', 'Japanese proverb', '人事を尽くして天命を待つ', ['afraid', 'swamped'], { ...JP, ja: '人事を尽くして天命を待つ' }),
  q('ashita', 'Tomorrow’s wind blows tomorrow.', 'Japanese saying', '明日は明日の風が吹く', ['swamped', 'afraid'], { ...JP, ja: '明日は明日の風が吹く' }),
  q('ichinen', 'A single will can pierce rock.', 'Japanese proverb', '一念岩をも通す', ['doubt'], { ...JP, ja: '一念岩をも通す' }),
  q('saru', 'Even monkeys fall from trees.', 'Japanese proverb', '猿も木から落ちる', ['failed'], { ...JP, ja: '猿も木から落ちる' }),
  q('kobo', 'Even Kōbō Daishi slips with the brush.', 'Japanese proverb', '弘法にも筆の誤り', ['failed'], { ...JP, ja: '弘法にも筆の誤り' }),
  q('taiki', 'Great talents ripen late.', 'Japanese saying, from Laozi', '大器晩成', ['doubt'], { ...JP, ja: '大器晩成' }),
  q('doryoku', 'No genius beats hard work.', 'Japanese saying', '努力に勝る天才なし', ['doubt', 'flat'], { ...JP, ja: '努力に勝る天才なし' }),
  q('kenji', 'Not losing to the rain, not losing to the wind.', 'Miyazawa Kenji', 'A poem in his notebook, 1931', ['tired'], { ...JP, ja: '雨ニモマケズ 風ニモマケズ' }),
  q('soseki', 'Don’t rush. Don’t wear out your mind. Keep going with patience.', 'Natsume Sōseki', 'Letter to Akutagawa and Kume, 1916', ['tired', 'swamped'], { ...JP, ja: 'あせっては不可ません。頭を悪くしては不可ません。根気づくでお出でなさい。', trust: 'loose' }),
  q('ichiro', 'Piling up small things is the only way to get somewhere extraordinary.', 'Ichiro Suzuki', 'Widely quoted in Japan', ['flat', 'swamped'], { topics: ['japan', 'running'], ja: '小さいことを積み重ねるのが、とんでもないところへ行くただひとつの道', trust: 'attributed' }),

  // ── more Japanese: manga ──
  q('edward', 'Stand up and walk. Keep moving forward. You’ve got good strong legs.', 'Edward Elric', 'Fullmetal Alchemist, Arakawa Hiromu', ['tired', 'failed'], { ...JP, ja: '立って歩け 前へ進め あんたには立派な足がついてるじゃないか', trust: 'loose' }),
  q('ukai', 'Don’t look down! Volleyball is a sport where you’re always looking up!', 'Coach Ukai', 'Haikyu!!, Furudate Haruichi', ['failed', 'tired'], { topics: ['japan', 'running'], ja: '下を向くんじゃねえ!!! バレーは!!! 常に上を向くスポーツだ!!!', trust: 'loose' }),
  q('rengoku', 'Set your heart ablaze.', 'Kyōjurō Rengoku', 'Demon Slayer, Gotōge Koyoharu', ['flat', 'tired'], { ...JP, ja: '心を燃やせ' }),
  q('naruto', 'I don’t go back on my word. That’s my ninja way.', 'Naruto Uzumaki', 'Naruto, Kishimoto Masashi', ['doubt'], { ...JP, ja: 'まっすぐ自分の言葉は曲げねェ。それがオレの忍道だ', trust: 'loose' }),

  // ── more sport ──
  q('federer', 'In the 1,526 singles matches I played, I won almost 80%. But I won only 54% of the points.', 'Roger Federer', 'Dartmouth commencement, 2024', ['failed', 'doubt'], { topics: ['running'], trust: 'loose' }),
  q('rocky', 'It ain’t about how hard you hit. It’s about how hard you can get hit and keep moving forward.', 'Rocky Balboa', 'Rocky Balboa, film, 2006', ['failed', 'tired'], { topics: ['running'] }),
  q('karnazes', 'Run when you can, walk if you have to, crawl if you must; just never give up.', 'Dean Karnazes', 'Ultramarathon runner', ['tired'], { topics: ['running'], trust: 'attributed' }),
  q('switzer', 'If you are losing faith in human nature, go out and watch a marathon.', 'Kathrine Switzer', 'First woman to run Boston with a race number', ['doubt'], { topics: ['running'], trust: 'attributed' }),
  q('prefontaine', 'To give anything less than your best is to sacrifice the gift.', 'Steve Prefontaine', 'Runner', ['flat', 'tired'], { topics: ['running'], trust: 'attributed' }),
  q('zatopek-hope', 'An athlete cannot run with money in his pockets. He must run with hope in his heart and dreams in his head.', 'Emil Zátopek', 'Runner', ['doubt'], { topics: ['running'], trust: 'attributed' }),
  q('bjk', 'Pressure is a privilege.', 'Billie Jean King', 'Title of her 2008 book', ['afraid'], { topics: ['running'] }),
  q('ashe', 'Start where you are. Use what you have. Do what you can.', 'Arthur Ashe', 'Tennis player', ['flat', 'swamped'], { topics: ['running'], trust: 'attributed' }),
  q('bruce-lee', 'I fear not the man who has practised 10,000 kicks once, but I fear the man who has practised one kick 10,000 times.', 'Bruce Lee', 'Martial artist', ['tired'], { topics: ['running'], trust: 'attributed' }),
  q('lombardi', 'It’s not whether you get knocked down, it’s whether you get up.', 'Vince Lombardi', 'American football coach', ['failed'], { topics: ['running'], trust: 'attributed' }),
  q('wooden', 'Don’t let what you cannot do interfere with what you can do.', 'John Wooden', 'Basketball coach', ['swamped', 'doubt'], { topics: ['running'], trust: 'attributed' }),
  q('hillary', 'It is not the mountain we conquer, but ourselves.', 'Edmund Hillary', 'Mountaineer', ['afraid', 'doubt'], { topics: ['running'], trust: 'attributed' }),
  q('shackleton', 'Difficulties are just things to overcome, after all.', 'Ernest Shackleton', 'Antarctic explorer', ['swamped', 'afraid'], { trust: 'loose' }),
  q('mallory', 'Because it’s there.', 'George Mallory', 'Asked why he wanted to climb Everest, New York Times, 1923', ['flat', 'afraid']),

  // ── more music ──
  q('tchaikovsky', 'A self-respecting artist must not fold his hands on the pretext that he is not in the mood.', 'Pyotr Ilyich Tchaikovsky', 'Letter to Nadezhda von Meck, 1878', ['flat'], { topics: ['music'], trust: 'loose' }),
  q('bach', 'I was obliged to be industrious. Whoever is equally industrious will succeed equally well.', 'Johann Sebastian Bach', 'Reported in Forkel’s biography, 1802', ['doubt', 'flat'], { topics: ['music'], trust: 'loose' }),
  q('schumann', 'There is no end to learning.', 'Robert Schumann', 'Advice to Young Musicians', ['doubt', 'flat'], { topics: ['music'] }),
  q('beethoven-secrets', 'Do not merely practise your art, but force your way into its secrets.', 'Ludwig van Beethoven', 'Letter to a young pianist, 1812', ['flat'], { topics: ['music'] }),
  q('stravinsky', 'The more constraints one imposes, the more one frees one’s self.', 'Igor Stravinsky', 'Poetics of Music', ['swamped'], { topics: ['music'] }),
  q('bernstein', 'To achieve great things, two things are needed: a plan and not quite enough time.', 'Leonard Bernstein', 'Conductor and composer', ['swamped'], { topics: ['music'], trust: 'attributed' }),
  q('heifetz', 'If I don’t practise one day, I know it; two days, the critics know it; three days, the public knows it.', 'Jascha Heifetz', 'Also credited to other players', ['flat'], { topics: ['music'], trust: 'attributed' }),
  q('auer', 'Practise with your fingers and you need all day. Practise with your mind and you will do as much in an hour and a half.', 'Leopold Auer', 'As remembered by Nathan Milstein', ['tired'], { topics: ['music'], trust: 'attributed' }),
  q('miles', 'Do not fear mistakes. There are none.', 'Miles Davis', 'Jazz trumpeter', ['failed', 'afraid'], { topics: ['music'], trust: 'attributed' }),

  // ── more maths, code, chess, science ──
  q('mirzakhani', 'The beauty of mathematics only shows itself to more patient followers.', 'Maryam Mirzakhani', 'Clay Mathematics Institute interview, 2008', ['doubt'], { topics: ['mind'], trust: 'loose' }),
  q('tao', 'Does one have to be a genius to do mathematics? The answer is an emphatic NO.', 'Terence Tao', 'From his essay of the same name', ['doubt'], { topics: ['mind'] }),
  q('polya', 'If you can’t solve a problem, then there is an easier problem you can solve: find it.', 'George Pólya', 'After How to Solve It', ['swamped', 'failed'], { topics: ['mind'], trust: 'loose' }),
  q('euclid', 'There is no royal road to geometry.', 'Euclid', 'As reported by Proclus', ['flat'], { topics: ['mind'] }),
  q('gauss', 'Few, but ripe.', 'Carl Friedrich Gauss', 'His motto, Pauca sed matura', ['swamped'], { topics: ['mind'] }),
  q('feynman-create', 'What I cannot create, I do not understand.', 'Richard Feynman', 'On his blackboard at his death, 1988', ['doubt', 'flat'], { topics: ['mind'] }),
  q('einstein', 'I have no special talent. I am only passionately curious.', 'Albert Einstein', 'Letter to Carl Seelig, 1952', ['doubt'], { topics: ['mind'] }),
  q('curie', 'Life is not easy for any of us. But what of that? We must have perseverance and above all confidence in ourselves.', 'Marie Curie', 'Letter to her brother, 1894', ['tired', 'doubt'], { topics: ['mind'], trust: 'loose' }),
  q('newton', 'If I have seen further it is by standing on the shoulders of Giants.', 'Isaac Newton', 'Letter to Robert Hooke, 1675', ['doubt'], { topics: ['mind'] }),
  q('pasteur', 'Chance favours only the prepared mind.', 'Louis Pasteur', 'Lecture at Lille, 1854', ['afraid'], { topics: ['mind'] }),
  q('edison-results', 'I have gotten a lot of results! I know several thousand things that won’t work.', 'Thomas Edison', 'Reported by Dyer and Martin, 1910', ['failed'], { topics: ['mind'] }),
  q('torvalds', 'Talk is cheap. Show me the code.', 'Linus Torvalds', 'Linux kernel mailing list, 2000', ['flat'], { topics: ['mind'] }),
  q('kay', 'The best way to predict the future is to invent it.', 'Alan Kay', 'At Xerox PARC, 1971', ['afraid', 'flat'], { topics: ['mind'], trust: 'loose' }),
  q('tartakower', 'The winner of the game is the player who makes the next-to-last mistake.', 'Savielly Tartakower', 'Chess grandmaster', ['failed'], { topics: ['mind'], trust: 'attributed' }),
  q('lasker', 'When you see a good move, look for a better one.', 'Emanuel Lasker', 'World chess champion', ['doubt'], { topics: ['mind'], trust: 'attributed' }),
  q('tal', 'Later I began to succeed in decisive games. Perhaps because I realised a very simple truth: not only was I worried, but also my opponent.', 'Mikhail Tal', 'World chess champion', ['afraid'], { topics: ['mind'], trust: 'attributed' }),

  // ── more philosophers ──
  q('epictetus-be', 'First say to yourself what you would be; and then do what you have to do.', 'Epictetus', 'Discourses 3.23', ['flat']),
  q('epictetus-judge', 'It’s not things that upset us, but our judgements about things.', 'Epictetus', 'Enchiridion 5', ['afraid', 'swamped']),
  q('marcus-back', 'Not to feel exasperated, or defeated, or despondent because your days aren’t packed with wise and moral actions. But to get back up when you fail.', 'Marcus Aurelius', 'Meditations 5.9', ['failed', 'doubt']),
  q('seneca-begin', 'Begin at once to live, and count each separate day as a separate life.', 'Seneca', 'Letters to Lucilius, 101', ['flat']),
  q('seneca-postpone', 'While we are postponing, life speeds by.', 'Seneca', 'Letters to Lucilius, 1', ['flat']),
  q('aristotle', 'The things we have to learn before we can do them, we learn by doing them.', 'Aristotle', 'Nicomachean Ethics, Book II', ['flat', 'doubt']),
  q('laozi', 'He who conquers others is strong; he who conquers himself is mighty.', 'Laozi', 'Tao Te Ching 33', ['doubt']),
  q('nietzsche-stronger', 'What does not kill me makes me stronger.', 'Friedrich Nietzsche', 'Twilight of the Idols', ['failed']),
  q('kierkegaard', 'Life can only be understood backwards; but it must be lived forwards.', 'Søren Kierkegaard', 'Journals, 1843', ['afraid']),
  q('goethe', 'Man errs as long as he strives.', 'Johann Wolfgang von Goethe', 'Faust', ['failed']),
  q('emerson', 'Trust thyself: every heart vibrates to that iron string.', 'Ralph Waldo Emerson', 'Self-Reliance', ['doubt']),
  q('thoreau', 'If one advances confidently in the direction of his dreams, he will meet with a success unexpected in common hours.', 'Henry David Thoreau', 'Walden', ['doubt', 'afraid'], { trust: 'loose' }),
  q('montaigne', 'My life has been full of terrible misfortunes, most of which never happened.', 'Michel de Montaigne', 'Essayist', ['afraid'], { trust: 'attributed' }),

  // ── more books and poems ──
  q('dickinson', 'Hope is the thing with feathers / That perches in the soul.', 'Emily Dickinson', 'Poem 254', ['tired']),
  q('stevenson', 'To travel hopefully is a better thing than to arrive.', 'Robert Louis Stevenson', 'Virginibus Puerisque', ['tired']),
  q('whitman', 'Not I, not anyone else can travel that road for you, / You must travel it for yourself.', 'Walt Whitman', 'Song of Myself', ['afraid', 'doubt']),
  q('frost-miles', 'And miles to go before I sleep.', 'Robert Frost', 'Stopping by Woods on a Snowy Evening', ['tired'], { topics: ['running'] }),
  q('longfellow-doing', 'Let us, then, be up and doing, / With a heart for any fate.', 'Henry Wadsworth Longfellow', 'A Psalm of Life', ['flat']),
  q('longfellow-heights', 'The heights by great men reached and kept / Were not attained by sudden flight.', 'Henry Wadsworth Longfellow', 'The Ladder of Saint Augustine', ['tired']),
  q('browning', 'Ah, but a man’s reach should exceed his grasp.', 'Robert Browning', 'Andrea del Sarto', ['doubt', 'afraid']),
  q('shakespeare-doubts', 'Our doubts are traitors, / And make us lose the good we oft might win / By fearing to attempt.', 'William Shakespeare', 'Measure for Measure', ['doubt', 'afraid']),
  q('shakespeare-past', 'What’s gone and what’s past help / Should be past grief.', 'William Shakespeare', 'The Winter’s Tale', ['failed']),
  q('dickens', 'Never do to-morrow what you can do to-day. Procrastination is the thief of time.', 'Charles Dickens', 'David Copperfield', ['flat']),
  q('sam', 'It’s the job that’s never started as takes longest to finish.', 'Sam Gamgee', 'The Fellowship of the Ring, J. R. R. Tolkien', ['flat']),
  q('galadriel', 'Even the smallest person can change the course of the future.', 'Galadriel', 'The Fellowship of the Ring, J. R. R. Tolkien', ['doubt']),
  q('rowling', 'Rock bottom became the solid foundation on which I rebuilt my life.', 'J. K. Rowling', 'Harvard commencement, 2008', ['failed']),
  q('baldwin', 'Not everything that is faced can be changed, but nothing can be changed until it is faced.', 'James Baldwin', 'As Much Truth As One Can Bear, 1962', ['afraid']),
  q('keller', 'Although the world is full of suffering, it is full also of the overcoming of it.', 'Helen Keller', 'Optimism, 1903', ['tired']),
  q('eleanor', 'You must do the thing you think you cannot do.', 'Eleanor Roosevelt', 'You Learn by Living, 1960', ['afraid', 'doubt']),
  q('anne-frank', 'How wonderful it is that nobody need wait a single moment before starting to improve the world.', 'Anne Frank', 'Written in 1944', ['flat']),

  // ── Latin, and an old almanac ──
  q('horace', 'He who has begun has half done. Dare to be wise; begin!', 'Horace', 'Epistles 1.2', ['flat']),
  q('virgil', 'Perhaps one day it will be a joy to remember even this.', 'Virgil', 'Aeneid 1.203', ['failed', 'tired']),
  q('ovid', 'Be patient and tough; one day this pain will be useful to you.', 'Ovid', 'Amores 3.11', ['tired', 'failed']),
  q('franklin', 'Little strokes fell great oaks.', 'Benjamin Franklin', 'Poor Richard’s Almanack, 1751', ['swamped', 'flat']),
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
