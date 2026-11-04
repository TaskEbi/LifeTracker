/**
 * Seasonal events: festivals that come round each year on fixed dates. Nothing is stored about an
 * event except what you bought or claimed in it: which one is on comes from the date, and your
 * tokens from what you logged while it ran.
 */
import type { SectionId } from '../../data/types';
import type { Bag, ChestTier } from './catalog';

export interface EventDef {
  id: string;
  name: string;
  kanji: string;
  /** What it's about, in a line. */
  blurb: string;
  /** Month-day, inclusive. An end before the start runs into the next year. */
  from: string;
  to: string;
  token: { name: string; kanji: string };
  /** Sections whose material drops double while it runs. */
  boost: SectionId[];
  boostLine: string;
  c: string;
  c2: string;
  /** What the shop sells, besides the event's chassis. */
  chassis: string;
  hat: string;
  pet: string;
  aura: string;
  paint: string;
}

export const EVENTS: EventDef[] = [
  { id: 'setsubun', name: 'Setsubun', kanji: '節分', blurb: 'Throw beans, drive out the oni, let the luck in.', from: '02-01', to: '02-14', token: { name: 'Roasted beans', kanji: '豆' }, boost: ['gym', 'sports'], boostLine: 'Iron plates and trail stones drop double: chase the oni out.', c: '#e63946', c2: '#ffd60a', chassis: 'setsubunoni', hat: 'onimask', pet: 'bean', aura: 'beanstorm', paint: 'beans' },
  { id: 'hanami', name: 'Hanami', kanji: '花見', blurb: 'Three weeks of cherry blossom, and then they\'re gone.', from: '03-22', to: '04-18', token: { name: 'Petals', kanji: '花' }, boost: ['sports', 'reading'], boostLine: 'Trail stones and ink drop double: run under the trees, read under them.', c: '#ff8fab', c2: '#fff0f3', chassis: 'sakurei', hat: 'blossom', pet: 'bee', aura: 'petals', paint: 'petal' },
  { id: 'tsuyu', name: 'Tsuyu', kanji: '梅雨', blurb: 'The plum rains. A good month to stay in and get good at something.', from: '06-01', to: '06-30', token: { name: 'Raindrops', kanji: '雫' }, boost: ['violin', 'study'], boostLine: 'Rosin and chalk drop double: rain on the window, work on the desk.', c: '#4895ef', c2: '#c8b6ff', chassis: 'teruteru', hat: 'raincoat', pet: 'snail', aura: 'rain', paint: 'hydrangea' },
  { id: 'tanabata', name: 'Tanabata', kanji: '七夕', blurb: 'Write a wish on a paper strip. The stars meet once a year.', from: '07-01', to: '07-14', token: { name: 'Wish strips', kanji: '笹' }, boost: ['future', 'maths'], boostLine: 'Ticket stubs and proofs drop double: wish big, then do the work.', c: '#3d348b', c2: '#f7b801', chassis: 'orihime', hat: 'tanzaku', pet: 'magpie', aura: 'stars', paint: 'milkyway' },
  { id: 'natsu', name: 'Natsu Matsuri', kanji: '夏祭', blurb: 'Goldfish scoops, drums and fireworks over the river.', from: '08-01', to: '08-25', token: { name: 'Festival coins', kanji: '縁' }, boost: ['coding', 'chess'], boostLine: 'Logic chips and ivory drop double: summer contest season.', c: '#ff4d6d', c2: '#ffd166', chassis: 'kingyo', hat: 'happi', pet: 'hanabi', aura: 'lanterns', paint: 'firework' },
  { id: 'hyakki', name: 'Hyakki Yagyō', kanji: '百鬼', blurb: 'The Night Parade of One Hundred Demons walks through October.', from: '10-10', to: '10-31', token: { name: 'Ghost flames', kanji: '魂' }, boost: ['sleep', 'screen'], boostLine: 'Moonlight and zen sand drop double: the demons come for the sleepless.', c: '#ff7b00', c2: '#9d4edd', chassis: 'hyakki', hat: 'witch', pet: 'ghost', aura: 'flames', paint: 'pumpkin' },
  { id: 'momiji', name: 'Momiji Matsuri', kanji: '紅葉', blurb: 'The maples turn. A month of red leaves and contest days.', from: '11-01', to: '11-30', token: { name: 'Maple leaves', kanji: '楓' }, boost: ['maths', 'reading'], boostLine: 'Proofs and ink drop double: it is contest season, and reading weather.', c: '#d00000', c2: '#ffba08', chassis: 'kodama', hat: 'momijiwreath', pet: 'tanukileaf', aura: 'leaves', paint: 'maple' },
  { id: 'yuki', name: 'Yuki Matsuri', kanji: '雪祭', blurb: 'Snow festival, through the year\'s end and into the new one.', from: '12-15', to: '01-07', token: { name: 'Snowflakes', kanji: '雪' }, boost: ['sleep', 'cabinet'], boostLine: 'Moonlight and curios drop double: sleep well, tidy the cabinet.', c: '#90e0ef', c2: '#ff6b6b', chassis: 'yukidaruma', hat: 'santa', pet: 'snowbun', aura: 'snow', paint: 'frost' },
];

export const eventById = (id: string) => EVENTS.find((e) => e.id === id);

/** One running of an event. */
export interface EventRun {
  def: EventDef;
  /** 'momiji-2026': tokens and claims belong to this. */
  key: string;
  start: string;
  end: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

function runOf(def: EventDef, year: number): EventRun {
  const wraps = def.to < def.from;
  return { def, key: `${def.id}-${year}`, start: `${year}-${def.from}`, end: `${wraps ? year + 1 : year}-${def.to}` };
}

/** The event on this day, if any. */
export function eventOn(date: string): EventRun | null {
  const y = Number(date.slice(0, 4));
  for (const def of EVENTS) {
    for (const yr of [y - 1, y]) {
      const run = runOf(def, yr);
      if (date >= run.start && date <= run.end) return run;
    }
  }
  return null;
}

/** Every running that has started by this day, from a first year, oldest first. */
export function eventRunsUpTo(date: string, fromYear = 2026): EventRun[] {
  const out: EventRun[] = [];
  const y = Number(date.slice(0, 4));
  for (let yr = fromYear; yr <= y; yr++) for (const def of EVENTS) {
    const run = runOf(def, yr);
    if (run.start <= date) out.push(run);
  }
  return out.sort((a, b) => a.start.localeCompare(b.start));
}

/** The next event to start after this day. */
export function nextEvent(date: string): EventRun {
  const y = Number(date.slice(0, 4));
  const all = [y, y + 1].flatMap((yr) => EVENTS.map((d) => runOf(d, yr)));
  return all.filter((r) => r.start > date).sort((a, b) => a.start.localeCompare(b.start))[0];
}

export const runLength = (run: EventRun) => Math.round((Date.UTC(+run.end.slice(0, 4), +run.end.slice(5, 7) - 1, +run.end.slice(8, 10)) - Date.UTC(+run.start.slice(0, 4), +run.start.slice(5, 7) - 1, +run.start.slice(8, 10))) / 86400000) + 1;

export const daysLeft = (run: EventRun, today: string) => Math.round((Date.UTC(+run.end.slice(0, 4), +run.end.slice(5, 7) - 1, +run.end.slice(8, 10)) - Date.UTC(+today.slice(0, 4), +today.slice(5, 7) - 1, +today.slice(8, 10))) / 86400000);

/** A short event gives tokens faster, so any event's prizes take about the same amount of training. */
export const tokenRate = (run: EventRun) => Math.min(2.2, 30 / runLength(run));

// ─── the event's prize track ────────────────────────────────────────────────

export interface TrackStep {
  /** Tokens earned in all (spending them doesn't lower this). */
  at: number;
  gain: Bag;
  label: string;
}

const chest = (t: ChestTier): Bag => ({ chests: [t] });

/** The same steps each event, ending in its exclusive paint. */
export function trackOf(def: EventDef): TrackStep[] {
  return [
    { at: 40, gain: { coins: 300 }, label: '300 Ryō' },
    { at: 120, gain: chest('wood'), label: 'Wooden crate' },
    { at: 220, gain: { gems: 30 }, label: '30 Tama' },
    { at: 350, gain: { tickets: 2 }, label: '2 capsule tickets' },
    { at: 500, gain: chest('iron'), label: 'Iron strongbox' },
    { at: 680, gain: { gems: 60, coins: 800 }, label: '60 Tama, 800 Ryō' },
    { at: 880, gain: { items: [`paint:${def.paint}`] }, label: 'Exclusive paint' },
    { at: 1100, gain: chest('gold'), label: 'Gold chest' },
    { at: 1350, gain: { gems: 120, tickets: 5 }, label: '120 Tama, 5 tickets' },
    { at: 1650, gain: chest('mythic'), label: 'Mythic reliquary' },
  ];
}

/** What's for sale in an event, paid in its tokens. */
export function eventStock(def: EventDef): { item: string; tokens: number }[] {
  return [
    { item: `hat:${def.hat}`, tokens: 260 },
    { item: `pet:${def.pet}`, tokens: 320 },
    { item: `aura:${def.aura}`, tokens: 420 },
  ];
}

export const monthDay = (date: string) => `${date.slice(8, 10).replace(/^0/, '')} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+date.slice(5, 7) - 1]}`;
export const pad2 = pad;
