/**
 * When the special-moment scenes play (domain/fun/special.ts decides which; this asks it at the
 * right times and fills in the numbers):
 *  - as the app opens or comes back to the front: good morning / good night, a new week, month,
 *    season or year;
 *  - as things happen: today's checklist completed, a stormy mood, the day closed, the weekly
 *    review sealed (each once per day, and only when it changes while the app is open);
 *  - on request: "Going to bed" on the checklist.
 * What has played is remembered on this device only (a per-viewer convenience, never synced).
 */
import { useEffect, useRef } from 'react';
import { getSleepSchedule, ltToday, progressInput } from '../data/lt';
import { data, type DataState } from '../data/store';
import { roughToday } from '../domain/hq/beacon';
import { closingDate } from '../domain/hq/diary';
import { nightOf, nightPlan, onOpen, seasonId, type Seen, type Special, type SpecialType } from '../domain/fun/special';
import { addDays, monthStart, weekStart } from '../domain/log/dates';
import { currentBoss } from '../domain/progress/boss';
import { useStore } from '../lib/createStore';
import { celebrate, fxPrefs, fxStore } from '../ui/i/fx/celebrate';
import { checklistRows, loggedToday, useChecklist } from '../features/home/TodayChecklist';
import { hqOf, useHq } from '../features/hq/store';

const KEY = 'lifetracker-special';

interface Stored extends Seen {
  /** Event scenes already played, as `${type}:${date}`. */
  played: string[];
}

function load(): Stored {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Stored>;
    return { lastDate: v.lastDate ?? null, night: v.night ?? null, played: Array.isArray(v.played) ? v.played.slice(-20) : [] };
  } catch {
    return { lastDate: null, night: null, played: [] };
  }
}
function save(s: Stored) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...s, played: s.played.slice(-20) }));
  } catch {
    /* private mode: this visit only */
  }
}

const enabled = () => fxStore.get().mode !== 'off' && fxPrefs.get().moments;

/** Hour and minute now in the Daily Log time zone. */
function clock(tz: string): { hour: number; minute: number } {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
    return { hour: get('hour') % 24, minute: get('minute') };
  } catch {
    const d = new Date();
    return { hour: d.getHours(), minute: d.getMinutes() };
  }
}

const minutesBetween = (st: DataState, today: string, from: string, to: string) =>
  progressInput(st, today)
    .entries.filter((e) => e.date >= from && e.date < to)
    .reduce((s, e) => s + e.minutes, 0);

/** Fill in a scene's numbers from the records. */
export function specialFor(type: SpecialType, st: DataState, today: string, hour: number): Special | null {
  const sleep = getSleepSchedule();
  switch (type) {
    case 'morning': {
      const rows = checklistRows(st, hqOf(st), today, hour, loggedToday(st, today));
      return { type, date: today, wake: nightPlan(addDays(today, -1), sleep).wake, todo: rows.filter((r) => !r.done && !r.later).length };
    }
    case 'night':
      return { type, ...nightPlan(nightOf(today, hour), sleep) };
    case 'new-week': {
      const boss = currentBoss(progressInput(st, today)).boss;
      const mon = weekStart(today);
      return { type, boss: boss.name, bossId: boss.id, lastWeekMinutes: minutesBetween(st, today, addDays(mon, -7), mon) };
    }
    case 'new-month': {
      const first = monthStart(today);
      return { type, month: Number(today.slice(5, 7)), year: Number(today.slice(0, 4)), lastMonthMinutes: minutesBetween(st, today, monthStart(addDays(first, -1)), first) };
    }
    case 'new-season':
      return { type, season: seasonId(today), year: Number(today.slice(0, 4)) };
    case 'new-year': {
      const y = Number(today.slice(0, 4));
      return { type, year: y, lastYearHours: Math.round(minutesBetween(st, today, `${y - 1}-01-01`, `${y}-01-01`) / 60) };
    }
    default:
      return null;
  }
}

/** "Going to bed": the good-night scene now, and not again on opening the app tonight. */
export function playNight() {
  const st = data.get();
  const today = ltToday();
  const { hour } = clock(st.settings.log_timezone);
  const s = specialFor('night', st, today, hour);
  if (!s) return;
  const stored = load();
  save({ ...stored, night: nightOf(today, hour) });
  celebrate({ kind: 'special', special: s });
}

/** Mounted once in the shell. */
export function useSpecialMoments() {
  const ready = useStore(data, (s) => s.ready);

  // Opening the app, and coming back to it (a PWA stays in memory overnight).
  useEffect(() => {
    if (!ready) return;
    const check = () => {
      if (document.visibilityState !== 'visible') return;
      const st = data.get();
      const today = ltToday();
      const now = { date: today, ...clock(st.settings.log_timezone) };
      const stored = load();
      const types = enabled() ? onOpen(now, stored, getSleepSchedule()) : [];
      save({ ...stored, lastDate: today, night: types.includes('night') ? nightOf(today, now.hour) : stored.night });
      const scenes = types.map((t) => specialFor(t, st, today, now.hour)).filter((x): x is Special => !!x);
      if (scenes.length) celebrate(...scenes.map((special) => ({ kind: 'special' as const, special })));
    };
    check();
    document.addEventListener('visibilitychange', check);
    return () => document.removeEventListener('visibilitychange', check);
  }, [ready]);

  // Things that happen while the app is open.
  const c = useChecklist();
  const hq = useHq();
  const today = c.today;
  const closeDate = closingDate(today, c.hour);
  const facts = {
    'day-complete': c.allDone,
    storm: roughToday(hq.checkIns, today),
    'close-day': hq.closes.some((x) => x.date === closeDate && !!x.at),
    'war-council': hq.reviews.some((r) => r.sealedOn === today),
  };
  const prev = useRef<typeof facts | null>(null);
  useEffect(() => {
    if (!ready) return;
    const before = prev.current;
    prev.current = facts;
    // The first look only records how things stand: nothing plays for what was already true.
    if (!before) return;
    const stored = load();
    const fire: Special[] = [];
    const once = (type: SpecialType, s: () => Special) => {
      const key = `${type}:${today}`;
      if (facts[type as keyof typeof facts] && !before[type as keyof typeof facts] && !stored.played.includes(key)) {
        stored.played.push(key);
        fire.push(s());
      }
    };
    once('storm', () => ({ type: 'storm', notes: hq.notes.length }));
    once('close-day', () => {
      const close = hq.closes.find((x) => x.date === closeDate);
      return { type: 'close-day', first: close?.first ?? '', bed: nightPlan(closeDate, getSleepSchedule()).bed };
    });
    once('war-council', () => {
      const r = hq.reviews.find((x) => x.sealedOn === today);
      return { type: 'war-council', theme: r?.theme ?? '', big: (r?.big ?? []).map((b) => b.text).slice(0, 3) };
    });
    once('day-complete', () => ({ type: 'day-complete', items: c.counted, minutes: c.logged.reduce((s, l) => s + l.minutes, 0) }));
    if (!fire.length) return;
    save(stored);
    if (enabled()) celebrate(...fire.map((special) => ({ kind: 'special' as const, special })));
  });
}
