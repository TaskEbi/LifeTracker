/**
 * Atlas 地: learning every country's flag, place on the map and capital. Pure logic: the decks,
 * the nine kinds of question at four difficulties, wrong answers worth being fooled by, typed
 * answers, the boxes each card moves through (spaced repetition), points, medals and ranks.
 */
import { addDays } from '../log/dates';
import { ROWS } from './countries';

export type Cont = 'africa' | 'asia' | 'europe' | 'namerica' | 'samerica' | 'oceania';
export type ViewId = Cont | 'world';

export interface Country {
  id: string;
  name: string;
  cap: string;
  cont: Cont;
  sub: string;
  /** Too small to tap on the world map without its ring. */
  tiny: boolean;
  /** Has an outline worth guessing. */
  shape: boolean;
  near: string[];
}

export const COUNTRIES: Country[] = ROWS.map(([id, name, cap, cont, sub, tiny, shape, near]) => ({ id, name, cap, cont: cont as Cont, sub, tiny: !!tiny, shape: !!shape, near: near.split(' ') }));
export const BY_ID = new Map(COUNTRIES.map((c) => [c.id, c]));
export const country = (id: string): Country => BY_ID.get(id)!;

export const CONTS: { id: Cont; name: string; kanji: string }[] = [
  { id: 'africa', name: 'Africa', kanji: '阿' },
  { id: 'asia', name: 'Asia', kanji: '亜' },
  { id: 'europe', name: 'Europe', kanji: '欧' },
  { id: 'namerica', name: 'North America', kanji: '北' },
  { id: 'samerica', name: 'South America', kanji: '南' },
  { id: 'oceania', name: 'Oceania', kanji: '洋' },
];
export const contName = (id: string) => CONTS.find((c) => c.id === id)?.name ?? 'World';

// ── flags that get mistaken for each other ──

export const LOOKALIKES: string[][] = [
  ['td', 'ro', 'ad', 'md'],
  ['id', 'mc', 'pl', 'sg'],
  ['at', 'lv', 'pe', 'lb'],
  ['ie', 'ci', 'it', 'mx'],
  ['in', 'ne', 'hu', 'tj', 'ir'],
  ['nl', 'lu', 'hr', 'py', 'fr'],
  ['ru', 'sk', 'si', 'rs'],
  ['co', 'ec', 've'],
  ['ar', 'hn', 'ni', 'sv', 'gt'],
  ['au', 'nz', 'fj', 'tv'],
  ['no', 'is', 'dk', 'se', 'fi'],
  ['gn', 'ml', 'sn', 'cm'],
  ['gh', 'bf', 'et', 'bo', 'lt'],
  ['jo', 'ps', 'sd', 'kw', 'ae'],
  ['eg', 'sy', 'iq', 'ye'],
  ['tr', 'tn', 'dz', 'pk', 'az', 'mr'],
  ['be', 'de', 'ug'],
  ['ke', 'mw', 'ss', 'ly'],
  ['th', 'cr', 'kp'],
  ['my', 'us', 'lr', 'cl', 'cu', 'tg'],
  ['jp', 'bd', 'pw', 'la'],
  ['qa', 'bh'],
  ['ht', 'li'],
  ['gr', 'uy'],
  ['ch', 'to', 'ge'],
  ['ua', 'kz'],
  ['vn', 'cn', 'ma', 'so'],
  ['bg', 'ee', 'sl', 'ga'],
  ['ng', 'sa', 'bd'],
  ['bj', 'mg', 'by'],
];
const ALIKE = new Map<string, string[]>();
for (const g of LOOKALIKES) for (const id of g) ALIKE.set(id, [...(ALIKE.get(id) ?? []), ...g.filter((x) => x !== id)]);
export const lookalikes = (id: string) => ALIKE.get(id) ?? [];

// ── decks ──

export interface Deck {
  id: string;
  name: string;
  group: 'world' | 'cont' | 'sub' | 'special';
  cont?: Cont;
  ids: string[];
  /** For the special decks: what's in it. */
  hint?: string;
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');

export const DECKS: Deck[] = (() => {
  const out: Deck[] = [{ id: 'world', name: 'World', group: 'world', ids: COUNTRIES.map((c) => c.id) }];
  for (const k of CONTS) out.push({ id: k.id, name: k.name, group: 'cont', cont: k.id, ids: COUNTRIES.filter((c) => c.cont === k.id).map((c) => c.id) });
  for (const k of CONTS) {
    const subs = [...new Set(COUNTRIES.filter((c) => c.cont === k.id).map((c) => c.sub))].sort();
    // a continent that is one region (South America) has no smaller decks
    if (subs.length < 2) continue;
    for (const s of subs) out.push({ id: `sub-${slug(s)}`, name: s, group: 'sub', cont: k.id, ids: COUNTRIES.filter((c) => c.cont === k.id && c.sub === s).map((c) => c.id) });
  }
  const alike = new Set(LOOKALIKES.flat());
  out.push({ id: 'alike', name: 'Lookalike flags', group: 'special', ids: COUNTRIES.filter((c) => alike.has(c.id)).map((c) => c.id), hint: 'Chad or Romania? Indonesia or Monaco? The flags people mix up' });
  out.push({ id: 'tiny', name: 'Small countries', group: 'special', ids: COUNTRIES.filter((c) => c.tiny).map((c) => c.id), hint: 'Islands and microstates, the ones that hide on a map' });
  return out;
})();
export const deck = (id: string): Deck | undefined => DECKS.find((d) => d.id === id);
/** The map a deck is played on. */
export const viewOf = (d: Deck): ViewId => d.cont ?? 'world';
export const subDecks = (cont: Cont) => DECKS.filter((d) => d.group === 'sub' && d.cont === cont);

// ── what you can know, and how it's asked ──

export type Skill = 'flag' | 'map' | 'cap';
export const SKILLS: { id: Skill; name: string; kanji: string }[] = [
  { id: 'flag', name: 'Flags', kanji: '旗' },
  { id: 'map', name: 'Map', kanji: '図' },
  { id: 'cap', name: 'Capitals', kanji: '都' },
];

export type QType = 'flag-name' | 'name-flag' | 'map-name' | 'name-map' | 'shape-name' | 'name-cap' | 'cap-name' | 'flag-map' | 'flag-cap';
export type Show = 'flag' | 'name' | 'map' | 'shape' | 'cap';
export type Answer = 'name' | 'flag' | 'map' | 'cap';
export interface QTypeInfo {
  id: QType;
  name: string;
  ask: string;
  show: Show;
  answer: Answer;
  skills: Skill[];
}
export const QTYPES: QTypeInfo[] = [
  { id: 'flag-name', name: 'Flag → country', ask: 'Which country flies this flag?', show: 'flag', answer: 'name', skills: ['flag'] },
  { id: 'name-flag', name: 'Country → flag', ask: 'Pick the flag of', show: 'name', answer: 'flag', skills: ['flag'] },
  { id: 'map-name', name: 'Map → country', ask: 'Which country is lit up on the map?', show: 'map', answer: 'name', skills: ['map'] },
  { id: 'name-map', name: 'Find on the map', ask: 'Tap this country on the map', show: 'name', answer: 'map', skills: ['map'] },
  { id: 'shape-name', name: 'Outline → country', ask: 'Whose outline is this?', show: 'shape', answer: 'name', skills: ['map'] },
  { id: 'name-cap', name: 'Country → capital', ask: 'What is the capital of', show: 'name', answer: 'cap', skills: ['cap'] },
  { id: 'cap-name', name: 'Capital → country', ask: 'Which country has this capital?', show: 'cap', answer: 'name', skills: ['cap'] },
  { id: 'flag-map', name: 'Flag → find on the map', ask: 'Tap the country that flies this flag', show: 'flag', answer: 'map', skills: ['flag', 'map'] },
  { id: 'flag-cap', name: 'Flag → capital', ask: 'What is the capital of the country with this flag?', show: 'flag', answer: 'cap', skills: ['flag', 'cap'] },
];
export const qtype = (id: string): QTypeInfo | undefined => QTYPES.find((q) => q.id === id);
export type Ask = QType | 'mix';
export const isAsk = (s: string): s is Ask => s === 'mix' || !!qtype(s);

export type Diff = 'easy' | 'normal' | 'hard' | 'expert';
export interface DiffInfo {
  id: Diff;
  name: string;
  kanji: string;
  /** Points are multiplied by this. */
  mult: number;
  /** How many answers to choose from (names and capitals); 0 means you type it. */
  choices: number;
  flags: number;
  /** Countries lit up to choose from on the map; 0 means the whole map. */
  spots: number;
  /** A right answer here moves a card no higher than this box. */
  cap: number;
  hint: string;
}
export const DIFFS: DiffInfo[] = [
  { id: 'easy', name: 'Easy', kanji: '易', mult: 1, choices: 3, flags: 3, spots: 3, cap: 2, hint: 'Three answers, from far apart' },
  { id: 'normal', name: 'Normal', kanji: '並', mult: 1.5, choices: 4, flags: 4, spots: 6, cap: 3, hint: 'Four answers from the same continent' },
  { id: 'hard', name: 'Hard', kanji: '難', mult: 2, choices: 6, flags: 6, spots: 0, cap: 4, hint: 'Six answers: neighbours and lookalikes. The whole map to tap' },
  { id: 'expert', name: 'Expert', kanji: '極', mult: 3, choices: 0, flags: 8, spots: 0, cap: 5, hint: 'Type it. Eight flags. Find it on the world map' },
];
export const diff = (id: string): DiffInfo => DIFFS.find((d) => d.id === id) ?? DIFFS[1];
export const isDiff = (s: string): s is Diff => DIFFS.some((d) => d.id === s);

export type Rng = () => number;

/** A repeatable stream of numbers from a seed (mulberry32), for the daily challenge. */
export function seeded(seed: string): Rng {
  let a = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) a = Math.imul(a ^ seed.charCodeAt(i), 0x01000193);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(list: readonly T[], rng: Rng = Math.random): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** The kinds of question a country can be asked as (no outline for a dot on the map). */
export const typesFor = (id: string): QType[] => QTYPES.filter((q) => q.show !== 'shape' || country(id).shape).map((q) => q.id);

/** The countries of a deck that this kind of question can ask about. */
export function askable(ids: readonly string[], ask: Ask): string[] {
  return ask === 'shape-name' ? ids.filter((id) => country(id).shape) : [...ids];
}

/**
 * Wrong answers for a country. Easy: from other continents. Normal: its own continent. Hard and
 * expert: flags that look like its flag (when a flag is in the question), then its nearest
 * neighbours, then its region.
 */
export function distractors(id: string, n: number, level: Diff, flagInvolved: boolean, rng: Rng = Math.random): string[] {
  const c = country(id);
  const picked: string[] = [];
  const take = (pool: readonly string[]) => {
    for (const x of shuffle(pool, rng)) {
      if (picked.length >= n) return;
      if (x !== id && !picked.includes(x)) picked.push(x);
    }
  };
  if (level === 'easy') take(COUNTRIES.filter((x) => x.cont !== c.cont).map((x) => x.id));
  else if (level === 'normal') take(COUNTRIES.filter((x) => x.cont === c.cont).map((x) => x.id));
  else {
    if (flagInvolved) take(lookalikes(id));
    // most from next door, but not always the same ones
    take(shuffle(c.near, rng).slice(0, Math.max(2, n - picked.length - 1)));
    take(COUNTRIES.filter((x) => x.sub === c.sub).map((x) => x.id));
    take(c.near);
  }
  take(COUNTRIES.filter((x) => x.cont === c.cont).map((x) => x.id));
  take(COUNTRIES.map((x) => x.id));
  return picked;
}

export interface Question {
  id: string;
  type: QType;
  diff: Diff;
  /** Countries to choose from (the right one among them), or null: type it, or tap anywhere. */
  options: string[] | null;
  typed: boolean;
  /** The map to answer or look on. */
  view: ViewId;
}

export function makeQuestion(id: string, type: QType, level: Diff, home: ViewId, rng: Rng = Math.random): Question {
  const t = qtype(type)!;
  const d = diff(level);
  const flagInvolved = t.show === 'flag' || t.answer === 'flag';
  const n = t.answer === 'flag' ? d.flags : t.answer === 'map' ? d.spots : d.choices;
  // countries lit up to choose from have to be on the map shown, so they never come from another continent
  const from: Diff = t.answer === 'map' && level === 'easy' ? 'normal' : level;
  const options = n ? shuffle([id, ...distractors(id, n - 1, from, flagInvolved, rng)], rng) : null;
  // expert map questions are asked on the whole world; a lit-up country is shown on its own continent
  const view: ViewId = t.answer === 'map' ? (level === 'expert' ? 'world' : home) : t.show === 'map' ? home : country(id).cont;
  return { id, type, diff: level, options, typed: !n && t.answer !== 'map', view };
}

// ── typed answers ──

const ALIAS: Record<string, string> = {
  us: 'usa|us|united states of america|america',
  gb: 'uk|britain|great britain|england',
  ae: 'uae|emirates',
  cd: 'drc|democratic republic of the congo|democratic republic of congo|congo kinshasa|dr of the congo',
  cg: 'congo|republic of congo|congo brazzaville',
  ci: 'cote d ivoire|cote divoire',
  cv: 'cabo verde',
  cz: 'czech republic',
  sz: 'swaziland',
  tr: 'turkey',
  tl: 'east timor|timor',
  mm: 'burma',
  mk: 'macedonia',
  va: 'vatican|holy see',
  kr: 'republic of korea|korea south',
  kp: 'dprk|korea north',
  ru: 'russian federation',
  nl: 'holland',
  ba: 'bosnia|bosnia herzegovina',
  tt: 'trinidad|trinidad tobago',
  ag: 'antigua|antigua barbuda',
  kn: 'saint kitts|saint kitts nevis',
  vc: 'saint vincent|saint vincent and grenadines',
  st: 'sao tome|sao tome principe',
  fm: 'federated states of micronesia|fsm',
  cf: 'car',
  pg: 'png',
  nz: 'nz',
  ps: 'state of palestine',
  bn: 'brunei darussalam',
  cn: 'prc|peoples republic of china',
  sa: 'saudi|ksa',
  do: 'dominican rep',
  la: 'lao',
  sy: 'syrian arab republic',
  md: 'republic of moldova',
  tz: 'united republic of tanzania',
  gw: 'guinea bissau',
};
const CAP_ALIAS: Record<string, string> = {
  us: 'washington|washington dc',
  ua: 'kiev',
  kz: 'nur sultan|nursultan',
  mx: 'mexico',
  gt: 'guatemala',
  pa: 'panama',
  sg: 'singapore city',
  kw: 'kuwait',
  dj: 'djibouti city',
  lu: 'luxembourg city',
  mc: 'monaco ville',
  va: 'vatican',
  sv: 'san salvador',
  lk: 'sri jayawardenepura kotte|kotte',
  bo: 'la paz',
  bn: 'bandar',
  in: 'delhi',
  td: 'ndjamena',
  to: 'nukualofa',
  mv: 'male',
};

export function norm(t: string): string {
  return t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/['’`]/g, '')
    .replace(/\bst\b\.?/g, 'saint')
    .replace(/[^a-z ]/g, ' ')
    .replace(/\bthe\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const NAME_FORMS = new Map<string, string[]>();
const CAP_FORMS = new Map<string, string[]>();
const NAME_OWNER = new Map<string, string>();
for (const c of COUNTRIES) {
  const names = [norm(c.name), ...(ALIAS[c.id]?.split('|') ?? [])];
  NAME_FORMS.set(c.id, names);
  for (const n of names) if (!NAME_OWNER.has(n)) NAME_OWNER.set(n, c.id);
  // a country with several capitals takes any of them
  CAP_FORMS.set(c.id, [...c.cap.split(',').map(norm), ...(CAP_ALIAS[c.id]?.split('|') ?? [])].filter(Boolean));
}

function lev(a: string, b: string): number {
  const p = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = p[0];
    p[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const t = p[j];
      p[j] = Math.min(p[j] + 1, p[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = t;
    }
  }
  return p[b.length];
}

const close = (n: string, forms: string[]) => forms.some((f) => f.length >= 5 && lev(n, f) <= (f.length >= 9 ? 2 : 1));

/** 1 right, 2 right but misspelt, 0 wrong. Another country's exact name is never "close". */
export function matchName(text: string, id: string): 0 | 1 | 2 {
  const n = norm(text);
  if (!n) return 0;
  const forms = NAME_FORMS.get(id) ?? [];
  if (forms.includes(n)) return 1;
  if (NAME_OWNER.has(n)) return 0;
  return close(n, forms) ? 2 : 0;
}

export function matchCapital(text: string, id: string): 0 | 1 | 2 {
  const n = norm(text);
  if (!n) return 0;
  const forms = CAP_FORMS.get(id) ?? [];
  if (forms.includes(n)) return 1;
  return close(n, forms) ? 2 : 0;
}

// ── the boxes ──

export interface Mark {
  /** 1 (missed) to 5 (known cold). */
  box: number;
  /** The day it next comes up. */
  due: string;
}
/** `<country>.<skill>` → its mark. */
export type Marks = Map<string, Mark>;
export const cardKey = (id: string, skill: Skill) => `${id}.${skill}`;

export const TOP_BOX = 5;
/** Days until a card in each box comes round again. */
export const GAPS = [0, 1, 2, 5, 12, 30];
/** From this box up a card counts as known. */
export const KNOWN_BOX = 4;

/**
 * Where a card goes after an answer. Right moves it up one box, once a day at most and no higher
 * than the difficulty allows (three easy choices can't prove you know it cold); a card never seen
 * starts at box 2, or 3 if the first answer was hard or expert. Wrong sends it back to the start
 * (a well-known card only to box 2).
 */
export function nextMark(prev: Mark | undefined, right: boolean, level: Diff, today: string): Mark {
  if (!right) {
    const box = prev && prev.box >= KNOWN_BOX ? 2 : 1;
    return { box, due: addDays(today, GAPS[box]) };
  }
  if (!prev) {
    const box = level === 'hard' || level === 'expert' ? 3 : 2;
    return { box, due: addDays(today, GAPS[box]) };
  }
  const movedToday = addDays(prev.due, -GAPS[prev.box]) === today;
  const box = !movedToday && prev.box < diff(level).cap ? prev.box + 1 : prev.box;
  if (box === prev.box && prev.due > today) return prev;
  return { box, due: addDays(today, GAPS[box]) };
}

export const boxOf = (marks: Marks, id: string, skill: Skill) => marks.get(cardKey(id, skill))?.box ?? 0;
export const knows = (marks: Marks, id: string, skill: Skill) => boxOf(marks, id, skill) >= KNOWN_BOX;
/** A country is mastered (and stamped in the passport) when its flag, place and capital are all known. */
export const mastered = (marks: Marks, id: string) => SKILLS.every((s) => knows(marks, id, s.id));

export interface Tally {
  total: number;
  /** Countries with all three known. */
  mastered: number;
  known: Record<Skill, number>;
  /** Cards met at all, out of total × 3. */
  seen: number;
}
export function tally(ids: readonly string[], marks: Marks): Tally {
  const t: Tally = { total: ids.length, mastered: 0, known: { flag: 0, map: 0, cap: 0 }, seen: 0 };
  for (const id of ids) {
    let all = true;
    for (const s of SKILLS) {
      const b = boxOf(marks, id, s.id);
      if (b) t.seen++;
      if (b >= KNOWN_BOX) t.known[s.id]++;
      else all = false;
    }
    if (all) t.mastered++;
  }
  return t;
}

/** The countries you keep missing: a card in box 1, or one that fell back. */
export function weakIds(marks: Marks): string[] {
  const out = new Set<string>();
  for (const [key, m] of marks) if (m.box === 1) out.add(key.split('.')[0]);
  return COUNTRIES.filter((c) => out.has(c.id)).map((c) => c.id);
}

export interface Item {
  id: string;
  type: QType;
  diff: Diff;
}

const TYPES_OF: Record<Skill, QType[]> = { flag: ['flag-name', 'name-flag'], map: ['map-name', 'name-map', 'shape-name'], cap: ['name-cap', 'cap-name'] };
/** The difficulty that can move a card out of its box. */
export const diffForBox = (box: number): Diff => (box >= 4 ? 'expert' : box === 3 ? 'hard' : 'normal');

export const REVIEW_MAX = 30;
export const NEW_COUNTRIES = 4;

export interface ReviewPlan {
  items: Item[];
  due: number;
  fresh: number;
}

/**
 * Today's review for a deck: the cards that are due (the longest overdue first), then a few
 * countries you haven't met, each asked three ways. The difficulty follows the card's box.
 */
export function reviewPlan(ids: readonly string[], marks: Marks, today: string, rng: Rng = Math.random): ReviewPlan {
  const due: { id: string; skill: Skill; m: Mark }[] = [];
  const unseen: string[] = [];
  for (const id of ids) {
    let any = false;
    for (const s of SKILLS) {
      const m = marks.get(cardKey(id, s.id));
      if (m) any = true;
      if (m && m.due <= today) due.push({ id, skill: s.id, m });
    }
    if (!any) unseen.push(id);
  }
  const dueAll = due.length;
  const picked = shuffle(due, rng)
    .sort((a, b) => a.m.due.localeCompare(b.m.due))
    .slice(0, REVIEW_MAX);
  const typeFor = (id: string, skill: Skill) => {
    const pool = TYPES_OF[skill].filter((t) => t !== 'shape-name' || country(id).shape);
    return pool[Math.floor(rng() * pool.length)];
  };
  const items: Item[] = picked.map((x) => ({ id: x.id, type: typeFor(x.id, x.skill), diff: diffForBox(x.m.box) }));
  const room = Math.max(0, REVIEW_MAX - items.length);
  const fresh = shuffle(unseen, rng).slice(0, Math.min(NEW_COUNTRIES, Math.floor(room / 3)));
  for (const id of fresh) for (const s of SKILLS) items.push({ id, type: typeFor(id, s.id), diff: 'normal' });
  return { items: shuffle(items, rng), due: dueAll, fresh: unseen.length };
}

/** How many cards are due today across everything. */
export function dueCount(marks: Marks, today: string): number {
  let n = 0;
  for (const m of marks.values()) if (m.due <= today) n++;
  return n;
}

export const DAILY_N = 12;

/** The day's challenge: twelve questions on the whole world, the same on every device, getting harder. */
export function dailyItems(date: string): Item[] {
  const rng = seeded(`atlas-daily:${date}`);
  const ids = shuffle(COUNTRIES.map((c) => c.id), rng).slice(0, DAILY_N);
  const types = shuffle(QTYPES.map((q) => q.id), rng);
  return ids.map((id, i) => {
    let type = types[i % types.length];
    if (type === 'shape-name' && !country(id).shape) type = 'map-name';
    return { id, type, diff: i < 4 ? 'normal' : i < 8 ? 'hard' : 'expert' };
  });
}

// ── points, medals, ranks ──

/** Points for a right answer: ten times the difficulty, plus one for each answer of the run so far (up to ten). */
export const points = (level: Diff, streak: number) => Math.round(10 * diff(level).mult) + Math.min(streak, 10);

export type Style = 'round' | 'sprint' | 'survival';
export const STYLES: { id: Style; name: string; kanji: string; hint: string }[] = [
  { id: 'round', name: 'Round', kanji: '周', hint: 'Every country in the deck once. The ones you miss come back. Medals are won here' },
  { id: 'sprint', name: 'Sprint', kanji: '速', hint: 'Sixty seconds. A wrong answer costs three of them' },
  { id: 'survival', name: 'Survival', kanji: '命', hint: 'Three lives. How far can you get?' },
];
export const isStyle = (s: string): s is Style => STYLES.some((x) => x.id === s);
export const SPRINT_SECS = 60;
export const SPRINT_PENALTY = 3;
export const LIVES = 3;

export const MEDALS = ['', 'Bronze', 'Silver', 'Gold'] as const;
/** At least nine in ten right first time wins the round's medal: bronze on Normal, silver on Hard, gold on Expert. */
export function medalFor(level: Diff, firstTry: number, total: number): { tier: 0 | 1 | 2 | 3; flawless: boolean } {
  const tier = level === 'expert' ? 3 : level === 'hard' ? 2 : level === 'normal' ? 1 : 0;
  if (!total || firstTry / total < 0.9) return { tier: 0, flawless: false };
  return { tier, flawless: tier > 0 && firstTry === total };
}

export const RANKS: { at: number; name: string; kanji: string }[] = [
  { at: 0, name: 'Stowaway', kanji: '密' },
  { at: 5, name: 'Deckhand', kanji: '帆' },
  { at: 15, name: 'Wayfarer', kanji: '旅' },
  { at: 35, name: 'Navigator', kanji: '航' },
  { at: 70, name: 'Pathfinder', kanji: '拓' },
  { at: 110, name: 'Cartographer', kanji: '図' },
  { at: 150, name: 'Globetrotter', kanji: '球' },
  { at: 195, name: 'Atlas', kanji: '地' },
];
export function rankOf(stamps: number) {
  let i = 0;
  while (i + 1 < RANKS.length && stamps >= RANKS[i + 1].at) i++;
  return { i, rank: RANKS[i], next: RANKS[i + 1] ?? null };
}

/** Days in a row (up to today, or yesterday if today hasn't been played) with at least ten right answers. */
export const STREAK_OK = 10;
export function streakOf(days: { date: string; ok: number }[], today: string): number {
  const good = new Set(days.filter((d) => d.ok >= STREAK_OK).map((d) => d.date));
  let d = good.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (good.has(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}
