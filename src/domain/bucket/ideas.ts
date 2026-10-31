/**
 * Ideas for the bucket list: a fixed library, and a pick of ones like what is already on the
 * list (same sections, shared words). Nothing is added until the user taps one.
 */
import { sectionOf, type BucketSectionId } from './sections';

export interface BucketIdea {
  title: string;
  section: BucketSectionId;
  /** Extra words it is "like", beyond its title. */
  tags?: string;
}

const I = (section: BucketSectionId, rows: (string | [string, string])[]): BucketIdea[] =>
  rows.map((r) => (typeof r === 'string' ? { title: r, section } : { title: r[0], section, tags: r[1] }));

export const BUCKET_IDEAS: BucketIdea[] = [
  ...I('travel', [
    ['See the cherry blossoms in Kyoto', 'japan kyoto spring sakura'],
    ['Walk the Kumano Kodo pilgrimage trail', 'japan hike temple'],
    ['Stay a night in a temple on Mount Koya', 'japan temple'],
    ['See the northern lights in Tromsø', 'norway aurora night'],
    ['Ride the Glacier Express across the Alps', 'switzerland train'],
    ['Watch the sunrise over Angkor Wat', 'cambodia temple sunrise'],
    ['Visit Vienna and hear the Philharmonic', 'austria music violin orchestra'],
    ['See the Great Wall of China', 'china'],
    ['Walk around Machu Picchu', 'peru hike'],
    ['Take a road trip down the Pacific Coast Highway', 'america usa car'],
    ['Visit all 47 prefectures of Japan', 'japan travel'],
    ['Interrail across Europe for a month', 'europe train'],
    ['Stand at the edge of the Grand Canyon', 'america usa'],
    ['Visit a country where no one speaks my language', 'abroad language'],
    ['Take the Trans-Siberian railway', 'russia train'],
    ['See the salt flats of Uyuni', 'bolivia'],
    ['Visit a new country every year for five years', 'countries'],
    ['Watch a match at Wimbledon', 'tennis london'],
  ]),
  ...I('adventure', [
    ['Climb Mount Fuji and watch the sunrise from the top', 'japan mountain summit'],
    ['Go skydiving', 'jump plane'],
    ['Learn to scuba dive and dive a coral reef', 'ocean'],
    ['Do a multi-day hike and sleep in mountain huts', 'mountain trek alps'],
    ['Go bungee jumping', 'jump'],
    ['Ride in a hot air balloon at sunrise', 'cappadocia'],
    ['Learn to surf and catch a real wave', 'ocean beach'],
    ['Reach Everest Base Camp', 'nepal mountain trek'],
    ['Go on a safari and see lions in the wild', 'africa'],
    ['Kayak through sea caves', 'ocean'],
    ['Go paragliding off a mountain', 'fly'],
    ['Climb Kilimanjaro', 'africa mountain summit'],
    ['Camp in the wild, far from any lights', 'stars night'],
    ['Swim with whale sharks', 'ocean dive'],
    ['Learn to ski down a black run', 'snow mountain'],
  ]),
  ...I('body', [
    ['Run a marathon under 3:30', 'marathon run race'],
    ['Run the Tokyo Marathon', 'marathon run japan'],
    ['Run one of the six World Marathon Majors', 'marathon run race boston berlin london'],
    ['Do 20 strict pull-ups', 'gym strength'],
    ['Do a muscle-up', 'gym strength'],
    ['Hold a freestanding handstand for 30 seconds', 'gym balance'],
    ['Learn a backflip', 'jump'],
    ['Bench press my body weight', 'gym strength'],
    ['Win a volleyball tournament', 'volleyball sport team'],
    ['Play volleyball on a beach', 'volleyball sport beach'],
    ['Hit a 150 km/h serve in tennis', 'tennis sport'],
    ['Play a tennis match on grass', 'tennis sport wimbledon'],
    ['Finish a triathlon', 'swim cycle run race'],
    ['Run an ultramarathon', 'ultra run race trail'],
    ['Run a half marathon under 1:40', 'half marathon run race'],
    ['Do the splits', 'stretch'],
    ['Cycle 100 km in a day', 'bike'],
  ]),
  ...I('art', [
    ['Play the Bach Chaconne all the way through', 'violin bach'],
    ['Perform a full violin concerto with an orchestra', 'violin concerto orchestra'],
    ['Play a Paganini caprice', 'violin paganini'],
    ['Play in a string quartet', 'violin music chamber'],
    ['Give a solo recital', 'violin perform stage'],
    ['Hear a concert at the Musikverein in Vienna', 'violin music concert vienna'],
    ['Play a Stradivarius, even for a minute', 'violin'],
    ['Busk on a street in Europe', 'violin music perform'],
    ['Compose a piece of my own', 'music compose'],
    ['Play the Sibelius concerto', 'violin concerto'],
    ['Learn a piece on the piano', 'music'],
    ['Record an album, even a short one', 'music'],
    ['Paint something worth hanging on a wall', 'art'],
    ['See an opera at La Scala', 'music italy'],
    ['Play violin at a friend’s wedding', 'violin perform people'],
  ]),
  ...I('mind', [
    ['Win a medal at IOI', 'ioi olympiad programming coding contest'],
    ['Make the JOI spring camp', 'joi olympiad programming coding'],
    ['Reach red on Codeforces', 'codeforces programming coding rating'],
    ['Reach 2000 on AtCoder', 'atcoder programming coding rating'],
    ['Reach a 2000 chess rating', 'chess elo rating'],
    ['Beat a titled chess player', 'chess'],
    ['Play in an over-the-board chess tournament', 'chess tournament'],
    ['Become fluent in a third language', 'language learn'],
    ['Read 100 books in a year', 'read books'],
    ['Solve a Rubik’s cube in under 30 seconds', 'rubik puzzle'],
    ['Learn to read music at sight', 'violin music read'],
    ['Win a maths olympiad medal', 'math olympiad'],
    ['Learn the basics of quantum physics', 'physics science'],
    ['Study abroad for a semester', 'university abroad'],
  ]),
  ...I('make', [
    ['Build an app that people I don’t know use', 'app code programming'],
    ['Make a game and let friends play it', 'game code programming'],
    ['Contribute to an open-source project', 'code programming'],
    ['Write a short story and finish it', 'write book'],
    ['Write a book', 'write'],
    ['Build my own computer', 'pc hardware'],
    ['Build a robot that does something useful', 'robot code'],
    ['Start a small business', 'business money'],
    ['Make a short film', 'film video'],
    ['Grow my own vegetables', 'garden'],
    ['Build a piece of furniture', 'woodwork'],
    ['Make a website that lasts ten years', 'website code'],
  ]),
  ...I('taste', [
    ['Eat at a Michelin-starred restaurant', 'food restaurant'],
    ['Have omakase sushi at a real counter', 'sushi japan food'],
    ['Eat ramen in every region of Japan', 'ramen japan food'],
    ['Learn to cook five dishes from memory', 'cook food'],
    ['Bake real sourdough bread', 'bake food'],
    ['Eat street food in Bangkok', 'thailand food'],
    ['Eat pizza in Naples', 'italy food'],
    ['Take part in a tea ceremony', 'japan tea'],
    ['Make fresh pasta by hand', 'cook italy food'],
    ['Eat a croissant in Paris', 'france food'],
  ]),
  ...I('moments', [
    ['See a total solar eclipse', 'sky'],
    ['Watch a World Cup match live', 'football sport'],
    ['Watch the Olympics in person', 'sport'],
    ['Watch a volleyball final live', 'volleyball sport'],
    ['See a meteor shower far from the city', 'stars night sky'],
    ['Watch fireworks at a summer festival in a yukata', 'japan festival'],
    ['Watch the first sunrise of the year from a mountain', 'japan new year sunrise'],
    ['See the Milky Way with my own eyes', 'stars night sky'],
    ['Stay up all night and watch the sunrise with friends', 'friends night'],
    ['See bioluminescent waves', 'ocean night'],
    ['Be in the crowd at a Grand Slam final', 'tennis sport'],
    ['Watch a sumo tournament', 'japan sport'],
  ]),
  ...I('people', [
    ['Take my parents on a trip they’d never plan', 'family travel'],
    ['Write a letter to my future self and open it in 10 years', 'letter'],
    ['Teach someone to code', 'teach code programming'],
    ['Teach someone to play the violin', 'teach violin'],
    ['Volunteer for a week', 'help'],
    ['Thank a teacher who changed my life', 'thank teacher'],
    ['Have a pen pal in another country', 'friend abroad language'],
    ['Give blood', 'help'],
    ['Organise a reunion with old friends', 'friends'],
    ['Do a surprise for someone that they’ll never forget', 'friend family'],
  ]),
  ...I('self', [
    ['Spend a week alone in nature with no phone', 'alone nature'],
    ['Do something that scares me every month', 'fear brave'],
    ['Meditate every day for 100 days', 'calm habit'],
    ['Keep one habit for a whole year without missing a day', 'habit discipline streak'],
    ['Write a letter to my future self and open it in ten years', 'letter'],
    ['Give everything to one goal for a year and see how far I get', 'limit train'],
    ['Learn to be calm under pressure in a final', 'calm pressure'],
    ['Find out what I would do if money didn’t matter', 'love purpose'],
  ]),
  ...I('life', [
    ['Live in another country for a year', 'abroad'],
    ['Get my driving licence', 'car'],
    ['Graduate from a university abroad', 'university abroad'],
    ['Have a job I’d do for free', 'career work job'],
    ['Plant a tree and watch it grow for years', 'garden'],
    ['Have a dog', 'pet'],
  ]),
  ...I('wealth', [
    ['Invest my first $10,000', 'money invest dollars'],
    ['Save a year of expenses', 'money save'],
    ['Earn money from something I made', 'money company app'],
    ['Have passive income that pays my rent', 'money invest'],
    ['Buy something I’ve wanted since I was a kid', 'buy'],
    ['Own a watch I’ll keep for life', 'buy collection'],
    ['Take a track day in a sports car', 'sports car'],
  ]),
  ...I('other', [
    ['Say yes to everything for one day', 'fun'],
    ['Go a week without a phone', 'screen'],
    ['Learn to juggle', 'fun'],
    ['Spend a day doing only what I want', 'fun'],
  ]),
];

const STOP = new Set(
  'a an the and or of to in on at for with my me i it its be is are was do does did get go see one all any some by from into up out off over every each this that than then them they our your yours mine own very just even real full whole first new old days day year years times time once ever never'.split(' '),
);
/** Content words, lowercased, plain endings dropped so "marathons" meets "marathon". */
export const words = (text: string): Set<string> =>
  new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 2 && !STOP.has(w))
      .map((w) => (w.length > 4 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w)),
  );

type Item = { title: string; note: string | null; data: Record<string, unknown>; deleted_at?: string | null };

/** Already on the list: same title, or the idea's words are mostly words of something there. */
function onList(idea: BucketIdea, items: { title: string; w: Set<string> }[]): boolean {
  const iw = words(idea.title);
  const t = idea.title.toLowerCase();
  return items.some((it) => {
    if (it.title.toLowerCase() === t) return true;
    if (!iw.size) return false;
    let shared = 0;
    for (const w of iw) if (it.w.has(w)) shared++;
    return shared / iw.size >= 0.6 || (shared >= 2 && shared / it.w.size >= 0.75);
  });
}

/** A seeded shuffle number in 0..1 for each idea, so "shuffle" deals a new hand. */
function jitter(seed: number, s: string) {
  let h = (seed * 2654435761) >>> 0;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995) >>> 0;
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}

export interface Suggestion extends BucketIdea {
  /** The thing on the list it is most like, if any. */
  like: string | null;
}

/**
 * A hand of ideas like the list: sections the list is heavy in come up more, ideas sharing words
 * with something on it come first (and say which), nothing already there, at most two per
 * section unless one section is asked for.
 */
export function suggestIdeas(list: Item[], opts: { n: number; seed: number; section?: BucketSectionId | null }): Suggestion[] {
  const live = list.filter((b) => !b.deleted_at).map((b) => ({ title: b.title, w: words(`${b.title} ${b.note ?? ''}`), section: sectionOf(b) }));
  const perSection = new Map<BucketSectionId, number>();
  for (const b of live) perSection.set(b.section, (perSection.get(b.section) ?? 0) + 1);
  const scored: (Suggestion & { score: number })[] = [];
  for (const idea of BUCKET_IDEAS) {
    if (opts.section && idea.section !== opts.section) continue;
    if (onList(idea, live)) continue;
    const iw = words(`${idea.title} ${idea.tags ?? ''}`);
    let like: string | null = null;
    let best = 0;
    for (const b of live) {
      let shared = 0;
      for (const w of b.w) if (iw.has(w)) shared++;
      if (shared > best) [best, like] = [shared, b.title];
    }
    const weight = (perSection.get(idea.section) ?? 0) + (live.length ? 0.35 : 1);
    const score = (weight + best * 2.5) * (0.35 + jitter(opts.seed, idea.title));
    scored.push({ ...idea, like, score });
  }
  scored.sort((a, b) => b.score - a.score);
  const out: Suggestion[] = [];
  const taken = new Map<BucketSectionId, number>();
  const cap = opts.section ? Infinity : 2;
  for (const s of scored) {
    if (out.length >= opts.n) break;
    if ((taken.get(s.section) ?? 0) >= cap) continue;
    taken.set(s.section, (taken.get(s.section) ?? 0) + 1);
    out.push({ title: s.title, section: s.section, tags: s.tags, like: s.like });
  }
  return out;
}

