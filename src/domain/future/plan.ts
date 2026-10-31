/**
 * Future planning maths: the departure board (every dated thing, soonest first, with a status),
 * the calendar events and reminder tasks each record should have, the roadmap to entry, XP for
 * milestones, and the weekly prep target in deadline season.
 */
import type { EventKind, LtRecord } from '../../data/types';
import { addDays, dayCount } from '../log/dates';
import { contactOf, essayOf, isSent, programOf, testOf, uniOf, UNI_STATUS_LABEL, type Essay, type Program, type TestPlan, type Uni } from './model';

// ─── the departure board ────────────────────────────────────────────────────

export type BoardStatus = 'on time' | 'boarding' | 'final call' | 'departed' | 'delayed' | 'arrived' | 'cancelled';
export interface Departure {
  /** Stable key: record id and which date. */
  key: string;
  recordId: string;
  kind: 'uni' | 'test' | 'program' | 'essay' | 'contact';
  date: string;
  /** Where it's going: "MIT", "SAT", "RSI". */
  dest: string;
  /** What for: "Early Action", "Sitting", "Deadline". */
  via: string;
  status: BoardStatus;
  /** Days from today (negative = past). */
  days: number;
}

const between = (today: string, date: string) => dayCount(today, date) - 1;

function statusFor(days: number, done: boolean, cancelled = false): BoardStatus {
  if (cancelled) return 'cancelled';
  if (done) return days < 0 ? 'arrived' : 'departed';
  if (days < 0) return 'delayed';
  if (days <= 3) return 'final call';
  if (days <= 14) return 'boarding';
  return 'on time';
}

/**
 * Everything dated, soonest first. Past ones that are done drop off after a week; past ones not
 * done stay (delayed) until dealt with.
 */
export function departures(records: LtRecord[], today: string): Departure[] {
  const out: Departure[] = [];
  const push = (d: Omit<Departure, 'days' | 'status'>, done: boolean, cancelled = false) => {
    const days = between(today, d.date);
    const status = statusFor(days, done, cancelled);
    if ((done || cancelled) && days < -7) return;
    out.push({ ...d, days, status });
  };
  for (const r of records) {
    if (r.deleted_at || r.archived_at) continue;
    const u = uniOf(r);
    if (u) {
      const cancelled = u.status === 'rejected' || u.status === 'declined';
      if (u.deadline) push({ key: `${u.id}:deadline`, recordId: u.id, kind: 'uni', date: u.deadline, dest: u.name, via: u.plan || 'Deadline' }, isSent(u.status), cancelled);
      if (u.interview) push({ key: `${u.id}:interview`, recordId: u.id, kind: 'uni', date: u.interview, dest: u.name, via: 'Interview' }, between(today, u.interview) < 0, cancelled);
      continue;
    }
    const t = testOf(r);
    if (t) {
      for (const s of t.sittings) {
        const scored = t.scores.some((x) => x.official && x.date >= s.date);
        push({ key: `${t.id}:${s.date}`, recordId: t.id, kind: 'test', date: s.date, dest: t.name, via: s.registered ? 'Sitting' : 'Sitting · not registered' }, scored || between(today, s.date) < 0);
      }
      continue;
    }
    const p = programOf(r);
    if (p) {
      const cancelled = p.status === 'rejected';
      if (p.deadline) push({ key: `${p.id}:deadline`, recordId: p.id, kind: 'program', date: p.deadline, dest: p.name, via: p.kind === 'competition' ? 'Entry deadline' : 'Application' }, ['applied', 'accepted', 'done'].includes(p.status), cancelled);
      if (p.start) push({ key: `${p.id}:start`, recordId: p.id, kind: 'program', date: p.start, dest: p.name, via: p.kind === 'competition' ? 'Competition' : 'Starts' }, between(today, p.start) < 0 || p.status === 'done', cancelled);
      continue;
    }
    const e = essayOf(r);
    if (e?.deadline) {
      push({ key: `${e.id}:deadline`, recordId: e.id, kind: 'essay', date: e.deadline, dest: e.title, via: 'Essay due' }, e.status === 'final');
      continue;
    }
    const c = contactOf(r);
    if (c?.next && !['done', 'no-reply'].includes(c.status)) push({ key: `${c.id}:next`, recordId: c.id, kind: 'contact', date: c.next, dest: c.name, via: 'Follow up' }, false);
  }
  return out.sort((a, b) => a.date.localeCompare(b.date) || a.dest.localeCompare(b.dest));
}

export const BOARD_LABEL: Record<BoardStatus, string> = {
  'on time': 'ON TIME',
  boarding: 'BOARDING',
  'final call': 'FINAL CALL',
  departed: 'DEPARTED',
  delayed: 'OVERDUE',
  arrived: 'ARRIVED',
  cancelled: 'CANCELLED',
};

// ─── calendar events and reminder tasks ─────────────────────────────────────

export interface LinkedEvent {
  key: string;
  title: string;
  date: string;
  kind: EventKind;
}
export interface LinkedTask {
  key: string;
  title: string;
  due: string;
}

/** How long before a date its reminder task is due. */
export const REMIND = { deadline: 14, sitting: 42, interview: 7, program: 14, essay: 7 } as const;
/** Reminder tasks appear this many days before they're due, so the task list isn't a year of them at once. */
export const REMIND_HORIZON = 45;

/**
 * The calendar events and reminder tasks a record should have. Nothing for things already sent
 * or done, no reminder whose day has passed, and none due more than REMIND_HORIZON days out yet.
 */
export function linksFor(r: LtRecord, today: string): { events: LinkedEvent[]; tasks: LinkedTask[] } {
  const events: LinkedEvent[] = [];
  const tasks: LinkedTask[] = [];
  const remind = (key: string, title: string, date: string, before: number) => {
    const due = addDays(date, -before);
    if (date >= today && dayCount(today, due) - 1 <= REMIND_HORIZON) tasks.push({ key, title, due: due < today ? today : due });
  };
  if (r.deleted_at || r.archived_at) return { events, tasks };
  const u = uniOf(r);
  if (u) {
    if (u.status === 'rejected' || u.status === 'declined') return { events, tasks };
    if (u.deadline) {
      events.push({ key: 'deadline', title: `${u.name} · ${u.plan || 'application'} deadline`, date: u.deadline, kind: 'other' });
      if (!isSent(u.status)) remind('deadline', `Finish and send: ${u.name}${u.plan ? ` (${u.plan})` : ''}`, u.deadline, REMIND.deadline);
    }
    if (u.interview) {
      events.push({ key: 'interview', title: `${u.name} · interview`, date: u.interview, kind: 'other' });
      remind('interview', `Prepare for the ${u.name} interview`, u.interview, REMIND.interview);
    }
    return { events, tasks };
  }
  const t = testOf(r);
  if (t) {
    for (const s of t.sittings) {
      events.push({ key: `sitting:${s.date}`, title: `${t.name} sitting`, date: s.date, kind: 'exam' });
      if (!s.registered) remind(`register:${s.date}`, `Register for the ${t.name} (${s.date})`, s.date, REMIND.sitting);
    }
    return { events, tasks };
  }
  const p = programOf(r);
  if (p) {
    if (p.status === 'rejected') return { events, tasks };
    if (p.deadline) {
      events.push({ key: 'deadline', title: `${p.name} · ${p.kind === 'competition' ? 'entry' : 'application'} deadline`, date: p.deadline, kind: 'other' });
      if (p.status === 'considering' || p.status === 'applying') remind('deadline', `${p.kind === 'competition' ? 'Enter' : 'Apply to'} ${p.name}`, p.deadline, REMIND.program);
    }
    if (p.start) events.push({ key: 'start', title: p.name, date: p.start, kind: p.kind === 'competition' ? 'competition' : 'other' });
    return { events, tasks };
  }
  const e = essayOf(r);
  if (e?.deadline && e.status !== 'final') {
    events.push({ key: 'deadline', title: `Essay due: ${e.title}`, date: e.deadline, kind: 'other' });
    remind('deadline', `Get "${e.title}" to final`, e.deadline, REMIND.essay);
  }
  const c = contactOf(r);
  if (c?.next && !['done', 'no-reply'].includes(c.status) && dayCount(today, c.next) - 1 <= REMIND_HORIZON) tasks.push({ key: 'next', title: `Follow up with ${c.name}`, due: c.next < today ? today : c.next });
  return { events, tasks };
}

// ─── the roadmap to entry ───────────────────────────────────────────────────

export interface RoadStop {
  date: string;
  title: string;
  /** A usual date for this cycle, not a confirmed one. */
  typical: boolean;
  kind: 'system' | 'uni' | 'test' | 'program' | 'essay';
}

/**
 * The usual UK and US calendar for starting university in `entry` (autumn), as typical dates,
 * plus the user's own dated things. Typical dates are the usual pattern, to be checked each year.
 */
export function roadmap(entry: number, records: LtRecord[], today: string): RoadStop[] {
  const y = entry - 1;
  const sys: [string, string][] = [
    [`${y}-06-15`, 'Summer: programmes, first essay drafts, test practice'],
    [`${y}-08-01`, 'Common App opens'],
    [`${y}-09-05`, 'UCAS opens for sending applications'],
    [`${y}-10-15`, 'UCAS deadline: Oxford and Cambridge'],
    [`${y}-11-01`, 'US early deadlines (EA / ED / REA)'],
    [`${y}-11-30`, 'University of California deadline'],
    [`${y}-12-08`, 'Oxford and Cambridge interviews'],
    [`${y}-12-15`, 'US early decisions'],
    [`${entry}-01-01`, 'US regular decision deadlines'],
    [`${entry}-01-14`, 'UCAS deadline for everything else'],
    [`${entry}-03-28`, 'US decisions arrive'],
    [`${entry}-05-01`, 'US reply deadline'],
    [`${entry}-05-12`, 'A-level exams begin'],
    [`${entry}-08-13`, 'A-level results'],
    [`${entry}-09-01`, 'Start'],
  ];
  const out: RoadStop[] = sys.map(([date, title]) => ({ date, title, typical: true, kind: 'system' }));
  for (const d of departures(records, today)) {
    if (d.kind === 'contact') continue;
    out.push({ date: d.date, title: `${d.dest} · ${d.via}`, typical: false, kind: d.kind });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

// ─── milestone XP ───────────────────────────────────────────────────────────

export const FUTURE_XP = { submitted: 100, offer: 200, officialScore: 50, essayFinal: 40, programIn: 60, firstReply: 20 } as const;

export interface FutureXp {
  key: string;
  date: string;
  xp: number;
  reason: string;
}

/** XP for milestones, each keyed to its record so it counts once, dated when it happened. */
export function futureXp(records: LtRecord[]): FutureXp[] {
  const out: FutureXp[] = [];
  for (const r of records) {
    if (r.deleted_at) continue;
    const u = uniOf(r);
    if (u) {
      const sent = u.statusAt.submitted ?? (isSent(u.status) ? Object.values(u.statusAt).sort()[0] : undefined);
      if (sent) out.push({ key: `future:${u.id}:submitted`, date: sent, xp: FUTURE_XP.submitted, reason: `Application sent: ${u.name}` });
      const offer = u.statusAt.offer ?? u.statusAt.accepted;
      if (offer) out.push({ key: `future:${u.id}:offer`, date: offer, xp: FUTURE_XP.offer, reason: `Offer from ${u.name}` });
      continue;
    }
    const t = testOf(r);
    if (t) {
      const first = t.scores.find((s) => s.official);
      if (first) out.push({ key: `future:${t.id}:official`, date: first.date, xp: FUTURE_XP.officialScore, reason: `${t.name} taken: ${first.score}` });
      continue;
    }
    const e = essayOf(r);
    if (e?.statusAt.final) {
      out.push({ key: `future:${e.id}:final`, date: e.statusAt.final, xp: FUTURE_XP.essayFinal, reason: `Essay finished: ${e.title}` });
      continue;
    }
    const p = programOf(r);
    if (p?.statusAt.accepted) {
      out.push({ key: `future:${p.id}:in`, date: p.statusAt.accepted, xp: FUTURE_XP.programIn, reason: `Accepted: ${p.name}` });
      continue;
    }
    const c = contactOf(r);
    const replied = c && (c.statusAt.replied ?? c.statusAt.meeting ?? c.statusAt.working);
    if (c && replied) out.push({ key: `future:${c.id}:reply`, date: replied, xp: FUTURE_XP.firstReply, reason: `${c.name} replied` });
  }
  return out;
}

// ─── the weekly target in deadline season ───────────────────────────────────

/**
 * A suggested week for the next deadline: the target as set, half as much again inside eight
 * weeks of a deadline not yet sent, double inside three. Only a suggestion: XP uses the target.
 */
export function seasonWeek(target: number, records: LtRecord[], today: string): { minutes: number; reason: string | null } {
  const next = departures(records, today).find((d) => d.days >= 0 && (d.status === 'on time' || d.status === 'boarding' || d.status === 'final call') && (d.kind === 'uni' || d.kind === 'essay' || d.kind === 'program'));
  if (!next) return { minutes: target, reason: null };
  if (next.days <= 21) return { minutes: target * 2, reason: `${next.dest} in ${next.days} days` };
  if (next.days <= 56) return { minutes: Math.round(target * 1.5), reason: `${next.dest} in ${Math.round(next.days / 7)} weeks` };
  return { minutes: target, reason: null };
}

/** Days until the entry year starts (1 September). */
export const daysToEntry = (entry: number, today: string) => between(today, `${entry}-09-01`);

export const uniLine = (u: Uni) => [u.course, u.plan, u.deadline ? `due ${u.deadline}` : null, UNI_STATUS_LABEL[u.status]].filter(Boolean).join(' · ');
export type { Essay, Program, TestPlan, Uni };
