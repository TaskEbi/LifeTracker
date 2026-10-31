/**
 * Bucket-list sections. Each item is sorted into one by reading its words (title counts double,
 * the note once); the user can move it, and that choice is kept in `lt_bucket.data.cat`.
 * The order is the order sections appear on the page: body and the outdoors first, things last.
 */

export const BUCKET_SECTIONS = [
  { id: 'body', kanji: '体', name: 'Body & sport', short: 'Sport', color: '#ff5a6e' },
  { id: 'adventure', kanji: '冒', name: 'Adventures', short: 'Adventure', color: '#ff8a4c' },
  { id: 'travel', kanji: '旅', name: 'Places to go', short: 'Travel', color: '#5fd4c4' },
  { id: 'art', kanji: '芸', name: 'Music & art', short: 'Art', color: '#d98cff' },
  { id: 'mind', kanji: '学', name: 'Mind & skills', short: 'Mind', color: '#7fb2ff' },
  { id: 'make', kanji: '創', name: 'Make & build', short: 'Make', color: '#b8e05c' },
  { id: 'people', kanji: '縁', name: 'Love & people', short: 'People', color: '#ff9ec7' },
  { id: 'self', kanji: '心', name: 'Inner growth', short: 'Inner', color: '#7fe0a0' },
  { id: 'life', kanji: '道', name: 'Life milestones', short: 'Life', color: '#e8d6a8' },
  { id: 'wealth', kanji: '富', name: 'Wealth & things', short: 'Wealth', color: '#ffd24a' },
  { id: 'taste', kanji: '味', name: 'Food & taste', short: 'Taste', color: '#e0a370' },
  { id: 'moments', kanji: '瞬', name: 'Once-in-a-lifetime', short: 'Moments', color: '#a9b4ff' },
  { id: 'other', kanji: '夢', name: 'Wild cards', short: 'Wild', color: '#c8c8e0' },
] as const;

export type BucketSectionId = (typeof BUCKET_SECTIONS)[number]['id'];
export type BucketSection = (typeof BUCKET_SECTIONS)[number];
export const BUCKET_SECTION_IDS = BUCKET_SECTIONS.map((s) => s.id) as BucketSectionId[];
export const bucketSection = (id: BucketSectionId): BucketSection => BUCKET_SECTIONS.find((s) => s.id === id)!;
export const isBucketSection = (v: unknown): v is BucketSectionId => typeof v === 'string' && (BUCKET_SECTION_IDS as string[]).includes(v);

/**
 * Words per section with a weight: 3 says it outright (marathon, violin, Kyoto), 2 leans
 * (concert, hike, learn), 1 is a hint (visit, go to). A word also matches with a plain ending
 * ("climb" finds "climbing", "run" finds "running"); one ending in * matches any word it starts.
 */
const WORDS: Record<Exclude<BucketSectionId, 'other'>, [number, string[]][]> = {
  travel: [
    [3, ['travel', 'trip', 'abroad', 'country', 'countries', 'continent', 'road trip', 'backpack', 'interrail', 'cruise', 'passport', 'world tour', 'around the world', 'northern lights', 'aurora']],
    [3, ['japan', 'kyoto', 'tokyo', 'osaka', 'nara', 'hokkaido', 'okinawa', 'paris', 'london', 'new york', 'rome', 'venice', 'italy', 'iceland', 'norway', 'switzerland', 'egypt', 'pyramid', 'machu picchu', 'great wall', 'grand canyon', 'taj mahal', 'angkor', 'petra', 'santorini', 'bali', 'maldives', 'hawaii', 'new zealand', 'australia', 'europe', 'america', 'africa', 'asia', 'antarctica', 'china', 'korea', 'seoul', 'taiwan', 'vienna', 'salzburg', 'berlin', 'prague', 'barcelona', 'spain', 'portugal', 'greece', 'canada', 'mexico', 'peru', 'brazil', 'thailand', 'vietnam', 'singapore', 'dubai', 'istanbul', 'eiffel', 'colosseum', 'stonehenge', 'uyuni', 'patagonia', 'galapagos', 'scotland', 'ireland', 'finland', 'lapland', 'shinkansen', 'orient express', 'trans-siberian']],
    [2, ['visit', 'national park', 'city', 'cities', 'island', 'temple', 'castle', 'onsen', 'ryokan']],
    [1, ['go to', 'see the', 'stay in', 'train']],
  ],
  adventure: [
    [3, ['skydiv*', 'bungee', 'paraglid*', 'scuba', 'snorkel', 'surf', 'ski', 'snowboard', 'everest', 'kilimanjaro', 'hot air balloon', 'zipline', 'zip line', 'wingsuit', 'shark', 'safari', 'volcano', 'glacier', 'rafting', 'cliff jump', 'base camp', 'bivouac', 'fuji']],
    [2, ['climb', 'summit', 'mountain', 'hike', 'hiking', 'trek', 'camp', 'kayak', 'canoe', 'sail', 'dive', 'diving', 'cave', 'jungle', 'desert', 'roller coaster', 'helicopter', 'fly a plane', 'pilot', 'motorcycle', 'horse', 'wild', 'jump', 'peak', 'trail']],
  ],
  body: [
    [3, ['marathon', 'triathlon', 'ironman', 'ultra*', 'half marathon', '5k', '10k', 'sub-*', 'sub 3', 'sub 4', 'personal best', 'bench', 'squat', 'deadlift', 'pull-up', 'pull up', 'muscle-up', 'muscle up', 'handstand', 'backflip', 'front flip', 'splits', 'push-up', 'six pack', 'six-pack', 'volleyball', 'tennis', 'basketball', 'football', 'soccer', 'badminton', 'table tennis', 'boxing', 'karate', 'judo', 'kendo', 'dunk', 'spike', 'kg']],
    [2, ['run', 'race', 'swim', 'cycle', 'cycling', 'bike', 'gym', 'fit', 'fitness', 'abs', 'strong', 'muscle', 'match', 'tournament', 'league', 'compete', 'competition', 'serve', 'yoga', 'martial', 'sprint', 'stretch']],
  ],
  art: [
    [3, ['violin', 'piano', 'guitar', 'cello', 'viola', 'flute', 'drum', 'orchestra', 'concerto', 'sonata', 'symphony', 'recital', 'opera', 'carnegie', 'philharmonic', 'bach', 'paganini', 'sibelius', 'tchaikovsky', 'mozart', 'beethoven', 'brahms', 'mendelssohn', 'vivaldi', 'chaconne', 'caprice', 'stradivari', 'compose', 'album', 'band', 'music', 'paint', 'sketch', 'calligraph*', 'pottery', 'sculpt', 'ballet']],
    [2, ['song', 'sing', 'concert', 'perform', 'stage', 'draw', 'photograph', 'film', 'movie', 'dance', 'dancing', 'theatre', 'theater', 'art', 'museum', 'gallery', 'louvre', 'play in', 'play the', 'busk']],
  ],
  mind: [
    [3, ['ioi', 'imo', 'joi', 'olympiad', 'codeforces', 'atcoder', 'leetcode', 'competitive programming', 'grandmaster', 'elo', 'chess', 'fide', 'rubik', 'speedcub*', 'fluent', 'japanese', 'chinese', 'mandarin', 'french', 'spanish', 'german', 'korean', 'italian', 'latin', 'phd', 'degree', 'university', 'harvard', 'mit', 'oxford', 'cambridge', 'stanford', 'nobel']],
    [1, ['learn']],
    [2, ['language', 'read', 'books', 'math', 'physics', 'science', 'study', 'exam', 'certif*', 'memor*', 'quiz', 'rating', 'rated', 'contest', 'medal', 'algorithm', 'master', 'philosophy', 'history']],
  ],
  make: [
    [3, ['write a book', 'write a novel', 'publish', 'startup', 'start a company', 'business', 'app', 'website', 'video game', 'make a game', 'board game', 'robot', 'invent', 'patent', 'open source', 'open-source', 'youtube', 'podcast', 'blog', 'knit', 'woodwork', '3d print*']],
    [2, ['build', 'make', 'create', 'write', 'code', 'program', 'design', 'garden', 'grow', 'craft', 'sew', 'diy']],
  ],
  taste: [
    [3, ['michelin', 'sushi', 'ramen', 'omakase', 'wagyu', 'kaiseki', 'wine', 'coffee', 'tea ceremony', 'matcha', 'chocolate', 'cheese', 'pizza', 'pasta', 'croissant', 'dim sum', 'street food', 'truffle', 'recipe', 'cuisine', 'bake', 'baking', 'cook', 'chef', 'restaurant', 'food', 'dessert', 'cake', 'brew']],
    [2, ['eat', 'taste', 'drink', 'dinner', 'breakfast', 'market', 'tea']],
  ],
  moments: [
    [3, ['world cup', 'olympic', 'wimbledon', 'grand slam', 'super bowl', 'final', 'eclipse', 'meteor', 'shooting star', 'fireworks', 'festival', 'new year', 'midnight sun', 'total solar', 'bioluminesc*', 'disney', 'carnival', 'lantern', 'cherry blossom', 'sakura', 'hanami', 'sunrise', 'sunset', 'stargaz*', 'milky way']],
    [2, ['watch', 'see a', 'live', 'attend', 'stars', 'night', 'party', 'celebrate', 'once in a lifetime', 'nba', 'premier league', 'all night', 'meet a', 'meet my hero', 'sleep under']],
  ],
  people: [
    [4, ['family', 'parents', 'mom', 'mum', 'dad', 'grandma', 'grandpa', 'grandparent']],
    [3, ['friend', 'best friend', 'sister', 'brother', 'volunteer', 'donate', 'charity', 'mentor', 'teach', 'thank', 'letter to', 'pen pal', 'reunion', 'blood', 'marry', 'wedding', 'date', 'dating', 'girlfriend', 'boyfriend', 'partner', 'someone i love', 'professor', 'genius']],
    [2, ['help', 'give', 'gift', 'together', 'surprise', 'kind', 'stranger', 'someone', 'people', 'team', 'trust', 'love', 'talk', 'meet', 'connection']],
  ],
  self: [
    [3, ['flow state', 'flowstate', 'my limit', 'limits', 'meditat*', 'purpose', 'meaning', 'passion', 'love to do', 'curious', 'curiosity', 'discipline', 'scares me', 'comfort zone', 'alone', 'gratitude', 'journal', 'nothing to improve', 'upset', 'hurt']],
    [2, ['find', 'genuinely', 'truly', 'feel', 'fear', 'habit', 'calm', 'improve', 'train']],
  ],
  life: [
    [4, ['live in', 'move to', 'live abroad']],
    [3, ['retire', 'kids', 'children', 'driving licen*', "driver's licen*", 'driver licen*', 'graduate', 'career', 'job', 'tattoo', 'pet', 'dog', 'cat', 'design my own house', 'my own house']],
    [2, ['home', 'work at', 'work in', 'become', 'plant a tree', 'university']],
  ],
  wealth: [
    [3, ['million', 'billion', 'billionaire', 'millionaire', 'rich', 'invest', 'stocks', 'dollars', 'sports car', 'supercar', 'garage', 'yacht', 'collection', 'houses', 'mansion', 'watch collection', 'salary', 'net worth', 'passive income', 'debt']],
    [2, ['buy', 'own', 'money', 'save', 'house', 'apartment', 'car', 'cars', 'earn', 'make $*', '$*', 'pc', 'shoes', 'bike']],
  ],
};

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wordRe = (w: string) =>
  new RegExp(`(?:^|[^a-z])${w.endsWith('*') ? escape(w.slice(0, -1)) : `${escape(w)}(?:s|es|ing|ed|er|ers|d|ning|ming|ping|ging)?(?![a-z])`}`);
const PATTERNS = (Object.entries(WORDS) as [Exclude<BucketSectionId, 'other'>, [number, string[]][]][]).map(
  ([id, tiers]) => [id, tiers.flatMap(([w, words]) => words.map((s) => [w, wordRe(s)] as const))] as const,
);

/** How strongly the text points at each section. */
export function sectionScores(title: string, note?: string | null): Map<BucketSectionId, number> {
  const out = new Map<BucketSectionId, number>();
  const t = ` ${title.toLowerCase()} `;
  const n = ` ${(note ?? '').toLowerCase()} `;
  for (const [id, pats] of PATTERNS) {
    let s = 0;
    for (const [w, re] of pats) {
      if (re.test(t)) s += w * 2;
      if (n.trim() && re.test(n)) s += w;
    }
    if (s) out.set(id, s);
  }
  return out;
}

/** The section the words point at most; ties go to the earlier one on the page; nothing → wild cards. */
export function guessSection(title: string, note?: string | null): BucketSectionId {
  let best: BucketSectionId = 'other';
  let top = 2; // a lone hint ("learn", "go to") or one leaning word in a note isn't enough
  for (const [id, s] of sectionScores(title, note)) if (s > top || (s === top && best !== 'other' && BUCKET_SECTION_IDS.indexOf(id) < BUCKET_SECTION_IDS.indexOf(best))) [best, top] = [id, s];
  return best;
}

/** The item's section: the one the user chose, else the guess. */
export function sectionOf(b: { title: string; note: string | null; data: Record<string, unknown> }): BucketSectionId {
  return isBucketSection(b.data.cat) ? b.data.cat : guessSection(b.title, b.note);
}

/** When the user means to do it: a year, kept in `data.by`; absent is "someday". */
export function targetYear(b: { data: Record<string, unknown> }): number | null {
  const y = b.data.by;
  return typeof y === 'number' && Number.isInteger(y) && y >= 2000 && y <= 2200 ? y : null;
}

/** The smallest next step, kept in `data.step`. */
export function nextStep(b: { data: Record<string, unknown> }): string | null {
  const s = b.data.step;
  return typeof s === 'string' && s.trim() ? s.trim() : null;
}

/** "This year", "Next year", "By 2030"; a year already gone reads as overdue. */
export function whenLabel(year: number, thisYear: number): string {
  if (year < thisYear) return `Was ${year}`;
  if (year === thisYear) return 'This year';
  if (year === thisYear + 1) return 'Next year';
  return `By ${year}`;
}

type Groupable = { title: string; note: string | null; data: Record<string, unknown> };

/**
 * The list in sections, in page order, only sections with something in them. Inside a section
 * the ones with a year come first (soonest first); the rest keep the order they came in.
 */
export function groupBySection<T extends Groupable>(open: T[], done: T[]): { section: BucketSection; open: T[]; done: T[] }[] {
  const by = new Map<BucketSectionId, { open: T[]; done: T[] }>();
  const slot = (id: BucketSectionId) => by.get(id) ?? (by.set(id, { open: [], done: [] }), by.get(id)!);
  for (const b of open) slot(sectionOf(b)).open.push(b);
  for (const b of done) slot(sectionOf(b)).done.push(b);
  const yearKey = (b: T) => targetYear(b) ?? Infinity;
  return BUCKET_SECTIONS.filter((s) => by.has(s.id)).map((s) => {
    const g = by.get(s.id)!;
    const dated = g.open.map((b, i) => [b, i] as const).sort((a, b) => yearKey(a[0]) - yearKey(b[0]) || a[1] - b[1]);
    return { section: s, open: dated.map(([b]) => b), done: g.done };
  });
}
