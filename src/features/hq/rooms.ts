/**
 * The Hideout's rooms and what each one's lamp says. Shared by the Hideout itself and Home's room
 * shortcuts, so both always agree. Everything is worked out from the records; nothing is stored.
 */
import { useMemo } from 'react';
import { progressInput, progressOf, useToday } from '../../data/lt';
import { data } from '../../data/store';
import { roughToday } from '../../domain/hq/beacon';
import { activeNiggles } from '../../domain/hq/body';
import { canOpen, daysUntil } from '../../domain/hq/capsule';
import { nextMilestones, xpRate } from '../../domain/hq/forecast';
import { wearOf } from '../../domain/hq/gear';
import { hallOfRecords } from '../../domain/hq/hall';
import { isDue } from '../../domain/hq/oracle';
import { currentReview, reviewIsDue } from '../../domain/hq/review';
import { appliesOn } from '../../domain/hq/rituals';
import { reviewQueue } from '../../domain/hq/srs';
import { closingDate, isClosingTime } from '../../domain/hq/diary';
import { hourIn } from '../../domain/fun/season';
import { weekLedger } from '../../domain/hq/ledger';
import { oathProgress } from '../../domain/hq/oath';
import { shortDay, weekStart } from '../../domain/log/dates';
import { dayFacts } from '../../domain/progress/quests';
import { useStore } from '../../lib/createStore';
import { useHq } from './store';
import { wearEvents } from './wearEvents';

export const ROOMS = {
  lighthouse: { kanji: '灯台', name: 'Lighthouse', c: '#fff1c9', blurb: 'For when you don’t feel like it' },
  war: { kanji: '作戦', name: 'War room', c: '#ff6a3d', blurb: 'Review the week, choose what matters' },
  forge: { kanji: '工房', name: 'Forge', c: '#ff9248', blurb: 'Turn what needs doing into time' },
  arena: { kanji: '闘技', name: 'Arena', c: '#f0564a', blurb: 'Tasks fight until you know what matters' },
  oath: { kanji: '誓約', name: 'Oath', c: '#e0a95a', blurb: 'A promise with a date and a price' },
  close: { kanji: '終礼', name: 'Close the day', c: '#8fa3ff', blurb: 'Clear what’s left, then stop' },
  dojo: { kanji: '道場', name: 'Dojo', c: '#7ddc6f', blurb: 'Spaced recall and a mistake notebook' },
  exam: { kanji: '模試', name: 'Exam hall', c: '#5fd0a8', blurb: 'Mock papers against the real clock' },
  infirmary: { kanji: '医務', name: 'Infirmary', c: '#ff6d8a', blurb: 'Where it hurts, how fast you’re ramping' },
  armoury: { kanji: '武器', name: 'Armoury', c: '#ffb02e', blurb: 'Shoes, strings and bow, worn by real use' },
  breath: { kanji: '呼吸', name: 'Breathing room', c: '#7cc8ff', blurb: 'Settle your nerves in a minute' },
  lab: { kanji: '研究', name: 'Lab', c: '#4fd6e8', blurb: 'What your own data says about you' },
  observatory: { kanji: '天文', name: 'Observatory', c: '#9d8cff', blurb: 'Where this pace leads, and what if' },
  ledger: { kanji: '帳場', name: 'Ledger', c: '#d7b98a', blurb: 'Where your 168 hours actually went' },
  scales: { kanji: '天秤', name: 'Scales', c: '#e6c15a', blurb: 'Weigh a big decision, see what flips it' },
  oracle: { kanji: '神託', name: 'Oracle', c: '#c78bff', blurb: 'Bet on yourself and score your judgement' },
  rituals: { kanji: '日課', name: 'Rituals', c: '#6fd9b0', blurb: 'Small daily things, never missed twice' },
  diary: { kanji: '日記', name: 'Five-year diary', c: '#f0d9b0', blurb: 'One line a day, the same question every year' },
  vault: { kanji: '金庫', name: 'Vault', c: '#f2d36b', blurb: 'Letters to future you, sealed until the day' },
  hall: { kanji: '殿堂', name: 'Hall of records', c: '#ffd76a', blurb: 'All-time bests, and how close you came' },
  cinema: { kanji: '映写', name: 'Projection room', c: '#ff8fb0', blurb: 'Your year so far, as a film' },
} as const;
export type RoomId = keyof typeof ROOMS;

/** The floors of the base, top down. The lighthouse stands above them. */
export const FLOORS: { level: string; name: string; rooms: RoomId[] }[] = [
  { level: 'B1', name: 'Plan', rooms: ['war', 'forge', 'arena', 'oath', 'close'] },
  { level: 'B2', name: 'Train', rooms: ['dojo', 'exam', 'infirmary', 'armoury', 'breath'] },
  { level: 'B3', name: 'Think', rooms: ['lab', 'observatory', 'ledger', 'scales', 'oracle'] },
  { level: 'B4', name: 'Keep', rooms: ['rituals', 'diary', 'vault', 'hall', 'cinema'] },
];

export interface RoomStatus {
  text: string;
  /** Needs you: the lamp blinks. */
  alert?: boolean;
  /** Something's on in there: the lamp is lit. */
  on?: boolean;
}

/** Every room's status line for today. */
export function useRoomStatus(): Record<RoomId, RoomStatus> {
  const today = useToday();
  const st = useStore(data, (s) => s);
  const hq = useHq();
  return useMemo<Record<RoomId, RoomStatus>>(() => {
    const input = progressInput(st, today);
    const p = progressOf(st, today);
    const due = reviewQueue(hq.cards, today).length;
    const review = currentReview(hq.reviews, today);
    const reviewDue = reviewIsDue(today, hq.reviews);
    const niggles = activeNiggles(hq.niggles);
    const events = wearEvents(input);
    const worn = hq.gear.filter((g) => wearOf(g, events, today).status !== 'fresh');
    const dueGear = worn.filter((g) => wearOf(g, events, today).status === 'due');
    const dueCalls = hq.predictions.filter((x) => isDue(x, today));
    const open = hq.predictions.filter((x) => x.outcome == null);
    const ready = hq.capsules.filter((c) => canOpen(c, today) && !c.openedOn);
    const sealed = hq.capsules.filter((c) => !canOpen(c, today));
    const todaysRituals = hq.rituals.filter((r) => !r.archived && appliesOn(r, today));
    const doneToday = hq.ritualDays.get(today);
    const ritualsDone = todaysRituals.filter((r) => doneToday?.has(r.id)).length;
    const next = nextMilestones(p.total, p.overall.level, xpRate(p.events, today), today, 1)[0];
    const records = hallOfRecords(input);
    const checkedIn = hq.checkIns.some((c) => c.date === today);
    const rough = roughToday(hq.checkIns, today);
    const openTasks = input.todos.filter((t) => !t.done_at).length;
    const facts = dayFacts(input);
    const live = hq.oaths.filter((o) => ['ahead', 'behind', 'not-started'].includes(oathProgress(o, facts, today).status));
    const behind = live.filter((o) => oathProgress(o, facts, today).status === 'behind');
    const hour = hourIn(st.settings.log_timezone);
    const closedToday = hq.closes.some((c) => c.date === closingDate(today, hour) && c.at);
    const closeOpen = isClosingTime(hour) && !closedToday;
    const week = weekLedger(input, st.lt_events.values(), weekStart(today));
    return {
      lighthouse: rough ? { text: hq.notes.length ? 'Rough weather today. You left yourself something.' : 'Rough weather today. There’s light in here.', alert: true } : hq.notes.length ? { text: `${hq.notes.length} ${hq.notes.length === 1 ? 'message' : 'messages'} from you · words to keep going`, on: true } : { text: 'Leave yourself a message · words to keep going', on: true },
      war: reviewDue ? { text: 'Weekly review is due', alert: true } : review?.theme ? { text: `This week: ${review.theme}`, on: true } : { text: review?.big.length ? `${review.big.filter((b) => b.done).length}/${review.big.length} of the Big Three` : 'Next review at the weekend' },
      dojo: due ? { text: `${due} ${due === 1 ? 'card' : 'cards'} waiting`, alert: true } : hq.cards.length ? { text: `All clear · ${hq.cards.length} cards`, on: true } : { text: 'No cards yet' },
      lab: checkedIn ? { text: `${hq.checkIns.length} ${hq.checkIns.length === 1 ? 'day' : 'days'} of weather`, on: true } : { text: 'No weather logged today', alert: false },
      observatory: next?.date ? { text: `${next.name} around ${shortDay(next.date, today)}`, on: true } : { text: 'Log some time to see ahead' },
      infirmary: niggles.length ? { text: `${niggles.length} active ${niggles.length === 1 ? 'niggle' : 'niggles'}`, alert: niggles.some((n) => n.severity >= 2), on: true } : { text: 'Nothing hurts' },
      armoury: dueGear.length ? { text: `${dueGear[0].name} is worn out`, alert: true } : worn.length ? { text: `${worn[0].name} is getting worn`, on: true } : hq.gear.length ? { text: `${hq.gear.length} in good shape`, on: true } : { text: 'Nothing racked yet' },
      oracle: dueCalls.length ? { text: `${dueCalls.length} to call`, alert: true } : open.length ? { text: `${open.length} waiting on the future`, on: true } : { text: 'No predictions yet' },
      vault: ready.length ? { text: `${ready.length} ready to open`, alert: true } : sealed.length ? { text: `Next opens in ${daysUntil(sealed[0], today)} days`, on: true } : { text: 'Nothing sealed' },
      rituals: todaysRituals.length ? { text: `${ritualsDone}/${todaysRituals.length} today`, on: ritualsDone > 0 } : { text: 'None set up yet' },
      hall: records.length ? { text: `${records.length} records standing`, on: true } : { text: 'Empty plinths' },
      forge: { text: 'Plan the rest of today', on: true },
      arena: openTasks >= 2 ? { text: `${openTasks} open tasks ready to fight`, on: true } : { text: 'Needs two open tasks' },
      oath: behind.length ? { text: `${behind.length} falling behind`, alert: true } : live.length ? { text: `${live.length} in force`, on: true } : { text: 'No oaths sworn' },
      close: closeOpen ? { text: 'Time to close the day', alert: true } : closedToday ? { text: 'Today is closed', on: true } : { text: 'Opens in the evening' },
      exam: hq.mocks.length ? { text: `${hq.mocks.length} ${hq.mocks.length === 1 ? 'paper' : 'papers'} sat`, on: true } : { text: 'No papers sat' },
      breath: { text: 'Box · long out · 4-7-8' },
      ledger: { text: `${Math.round(week.unaccounted / 60)} h unaccounted this week`, on: true },
      scales: hq.decisions.length ? { text: `${hq.decisions.length} on the scales`, on: true } : { text: 'Nothing being weighed' },
      diary: hq.diary.some((e) => e.date === today) ? { text: `Written today · ${hq.diary.length} lines`, on: true } : { text: 'Nothing written today' },
      cinema: { text: `${today.slice(0, 4)} so far is ready to watch`, on: input.entries.length > 0 },
    };
  }, [st, today, hq]);
}
