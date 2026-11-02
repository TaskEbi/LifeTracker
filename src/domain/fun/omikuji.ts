/**
 * おみくじ: a fortune for the day, drawn by date so it's the same on every device and nothing is
 * stored. The rank and the lines are only for fun. The nudge at the bottom is real: the timed
 * section you've left longest, worked out from your records.
 */
import { TIMED_SECTIONS, type TimedSection } from '../../data/types';
import { dayCount } from '../log/dates';
import { sectionOf, type ProgressInput } from '../progress/engine';

export type FortuneTone = 'good' | 'fair' | 'poor';

export const FORTUNE_RANKS = [
  { id: 'daikichi', kanji: '大吉', name: 'Great blessing', weight: 12, tone: 'good' },
  { id: 'chukichi', kanji: '中吉', name: 'Middle blessing', weight: 20, tone: 'good' },
  { id: 'kichi', kanji: '吉', name: 'Blessing', weight: 24, tone: 'fair' },
  { id: 'shokichi', kanji: '小吉', name: 'Small blessing', weight: 20, tone: 'fair' },
  { id: 'suekichi', kanji: '末吉', name: 'Blessing to come', weight: 16, tone: 'fair' },
  { id: 'kyo', kanji: '凶', name: 'Bad luck', weight: 8, tone: 'poor' },
] as const satisfies readonly { id: string; kanji: string; name: string; weight: number; tone: FortuneTone }[];

export type FortuneRank = (typeof FORTUNE_RANKS)[number];

/** Each heading on the paper, as on a real omikuji, with lines for each tone. */
const ASPECTS: { kanji: string; label: string; lines: Record<FortuneTone, string[]> }[] = [
  {
    kanji: '願望',
    label: 'Wishes',
    lines: {
      good: ['Within reach. Say it out loud once.', 'Comes true if you start before lunch.', 'Bigger than you asked for.'],
      fair: ['Comes true slowly, then all at once.', 'Ask again next week.', 'Half of it now, half when you least expect it.'],
      poor: ['Not this week. Water it anyway.', 'Wrong wish. Ask a better one.'],
    },
  },
  {
    kanji: '学問',
    label: 'Study',
    lines: {
      good: ['The hard topic gives way on the second try.', 'Whatever you read today, stays.', 'A proof walks in by itself.'],
      fair: ['Do the boring question first.', 'One page further than you planned.', 'Your notes know more than you think.'],
      poor: ['Check the sign on line two.', 'Sleep on it. It really will help.'],
    },
  },
  {
    kanji: '勝負',
    label: 'Contests',
    lines: {
      good: ['You see the combination first.', 'Your opponent blinks.', 'All tests pass on the first submit.'],
      fair: ['Read the problem twice. Then again.', 'A draw that feels like a win.', 'Off by one, then accepted.'],
      poor: ['Do not hang the queen.', 'Time limit exceeded. Stay calm.'],
    },
  },
  {
    kanji: '旅立',
    label: 'Journeys',
    lines: {
      good: ['The wind is behind you all the way out, and all the way back.', 'A good day to go the long way round.'],
      fair: ['Bring a jacket. Leave ten minutes early.', 'The scenic route is two minutes longer.'],
      poor: ['Check the train. Then check it again.', 'Your shoelace has plans.'],
    },
  },
  {
    kanji: '音楽',
    label: 'Music',
    lines: {
      good: ['The shift lands in tune, first time.', 'Someone hears you through the wall and smiles.'],
      fair: ['Slow practice, friend. Slower than that.', 'The metronome is right. Sorry.'],
      poor: ['The E string has opinions today.', 'Rosin. Then try again.'],
    },
  },
  {
    kanji: '失物',
    label: 'Lost things',
    lines: {
      good: ['In the pocket you already checked.', 'Comes back by itself before dinner.'],
      fair: ['Under the book you meant to finish.', 'Look lower down.'],
      poor: ['Gone, but you never liked that one.', 'Ask the cat.'],
    },
  },
  {
    kanji: '待人',
    label: 'Who you wait for',
    lines: {
      good: ['Arrives early, with snacks.', 'Message them first. They were about to.'],
      fair: ['Late, but worth it.', 'Comes when the kettle boils.'],
      poor: ['Not today. Go on without them.', 'They are also waiting for you.'],
    },
  },
];

function rng(seedText: string) {
  let h = 2166136261;
  for (let i = 0; i < seedText.length; i++) h = Math.imul(h ^ seedText.charCodeAt(i), 16777619);
  let s = h >>> 0;
  return () => {
    s = (Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9) >>> 0;
    return s / 4294967296;
  };
}

export interface Fortune {
  date: string;
  /** The number on the stick. */
  stick: number;
  rank: FortuneRank;
  lines: { kanji: string; label: string; text: string }[];
}

export function drawFortune(date: string): Fortune {
  const r = rng(`omikuji:${date}`);
  const total = FORTUNE_RANKS.reduce((n, x) => n + x.weight, 0);
  let roll = r() * total;
  const rank = FORTUNE_RANKS.find((x) => (roll -= x.weight) < 0) ?? FORTUNE_RANKS[3];
  const pool = [...ASPECTS];
  const lines: Fortune['lines'] = [];
  for (let i = 0; i < 3; i++) {
    const [a] = pool.splice(Math.floor(r() * pool.length), 1);
    const list = a.lines[rank.tone];
    lines.push({ kanji: a.kanji, label: a.label, text: list[Math.floor(r() * list.length)] });
  }
  return { date, stick: 1 + Math.floor(r() * 100), rank, lines };
}

export interface FortuneNudge {
  section: TimedSection;
  /** Days since you last logged it. */
  days: number;
}

/** The timed section you've left longest (of those you've ever logged), if it's been at least two days. */
export function fortuneNudge(input: ProgressInput): FortuneNudge | null {
  const last = new Map<TimedSection, string>();
  for (const e of input.entries) {
    if (e.date > input.today) continue;
    const s = sectionOf(e, input);
    if (!(TIMED_SECTIONS as readonly string[]).includes(s)) continue;
    const prev = last.get(s as TimedSection);
    if (!prev || e.date > prev) last.set(s as TimedSection, e.date);
  }
  let best: FortuneNudge | null = null;
  for (const [section, date] of last) {
    const days = dayCount(date, input.today) - 1;
    if (days >= 2 && (!best || days > best.days)) best = { section, days };
  }
  return best;
}
