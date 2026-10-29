/**
 * Which parts of a save's reward deserve a full-screen celebration. Plain XP keeps the quick
 * reward box; quests, a boss, achievements, level-ups and a new form are played first, in that
 * order, at most MAX of them (the reward box afterwards lists everything).
 */
import { ltToday, progressInput, type RewardView } from '../../../data/lt';
import { data } from '../../../data/store';
import { questBoard } from '../../../domain/progress/quests';
import type { Celebration, QuestPeriodName } from './celebrate';

export const MAX_CELEBRATIONS = 5;

const PERIODS: QuestPeriodName[] = ['daily', 'weekly', 'monthly'];
const CAP: Record<QuestPeriodName, string> = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };
const TIER_RANK = { bronze: 0, silver: 1, gold: 2, platinum: 3 } as const;

/** The period's quest titles on today's board, if the board is the one these lines belong to. */
function boardTitles(period: QuestPeriodName, done: string[]): string[] | undefined {
  try {
    const set = questBoard(progressInput(data.get(), ltToday()))[period];
    const titles = set.quests.map((q) => q.title);
    return done.every((t) => titles.includes(t)) ? titles : undefined;
  } catch {
    return undefined;
  }
}

export function celebrationsFor(r: RewardView): Celebration[] {
  if (r.rest) return [];
  const preview = r.preview ? true : undefined;
  // order: position on screen; pri: what survives the cap
  const out: { c: Celebration; order: number; pri: number }[] = [];
  const quests = r.lines.filter((l) => l.section === 'quests');

  PERIODS.forEach((p, pi) => {
    const prefix = `${CAP[p]} quest: `;
    const done = quests.filter((l) => l.reason.startsWith(prefix));
    const titles = done.map((l) => l.reason.slice(prefix.length));
    const sweep = quests.find((l) => l.reason === `All ${p} quests done`);
    if (sweep) {
      const xp = sweep.xp + done.reduce((n, l) => n + l.xp, 0);
      out.push({ c: { kind: 'quest', period: p, sweep: true, title: `All ${p} quests`, titles: boardTitles(p, titles) ?? titles, xp, preview }, order: 0 + pi * 0.1, pri: 6 + pi });
    } else {
      done.forEach((l, i) => out.push({ c: { kind: 'quest', period: p, title: titles[i], xp: l.xp, preview }, order: 0 + pi * 0.1 + i * 0.01, pri: 3 + pi }));
    }
  });

  for (const l of quests.filter((q) => q.reason.startsWith('Boss defeated: '))) {
    out.push({ c: { kind: 'boss', name: l.reason.slice('Boss defeated: '.length), xp: l.xp, preview }, order: 1, pri: 9 });
  }

  [...r.unlocked]
    .sort((a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier])
    .forEach((a, i) => out.push({ c: { kind: 'achievement', achievement: a, preview }, order: 2 + i * 0.01, pri: 4 + TIER_RANK[a.tier] * 1.5 }));

  r.sectionUps.forEach((u, i) => out.push({ c: { kind: 'section-level', section: u.section, from: u.from, to: u.to, preview }, order: 3 + i * 0.01, pri: 2 }));

  if (r.evolved) out.push({ c: { kind: 'evolve', from: r.evolved.from, to: r.evolved.to, level: r.overallUp?.to, preview }, order: 5, pri: 10 });
  else if (r.overallUp) out.push({ c: { kind: 'level', from: r.overallUp.from, to: r.overallUp.to, preview }, order: 4, pri: 8 });

  return out
    .map((x, i) => ({ ...x, i }))
    .sort((a, b) => b.pri - a.pri || a.i - b.i)
    .slice(0, MAX_CELEBRATIONS)
    .sort((a, b) => a.order - b.order)
    .map((x) => x.c);
}
