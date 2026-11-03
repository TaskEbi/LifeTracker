/** Titles for the weekly "previously on…" story, from what the week actually held. */
import type { XpSection } from '../progress/engine';
import type { WeekRecap } from '../progress/recap';

const TITLES: Partial<Record<XpSection, string>> = {
  violin: 'The Sound of the Bow',
  coding: 'The Road to IOI',
  sports: 'Miles Under the Feet',
  gym: 'A Will of Iron',
  study: 'The Long Study',
  chess: 'Sixty-Four Squares',
  future: 'Platform 2028',
  reading: 'The Turning of Pages',
  maths: 'Proof by Exhaustion',
};

export function episodeTitle(r: Pick<WeekRecap, 'sections' | 'minutes' | 'activeDays'>): string {
  if (!r.minutes && !r.activeDays) return 'The Quiet Week';
  if (r.activeDays === 7) return 'Not One Day Missed';
  const top = r.sections[0];
  return (top && TITLES[top.id]) || 'A Week of Many Things';
}

/** A line under the big number: how it compares, in plain words. */
export function weekChange(r: Pick<WeekRecap, 'minutes' | 'prevMinutes'>): { text: string; up: boolean | null } {
  if (!r.prevMinutes) return { text: r.minutes ? 'The first logged week in a while.' : '', up: null };
  const d = Math.round(((r.minutes - r.prevMinutes) / r.prevMinutes) * 100);
  if (d === 0) return { text: 'Exactly the same as the week before.', up: null };
  return d > 0 ? { text: `Up ${d}% on the week before.`, up: true } : { text: `Down ${-d}% on the week before.`, up: false };
}

/** The week's shape as story panels: only what has something to show. */
export type EpisodePanel = 'title' | 'time' | 'sections' | 'facts' | 'boss' | 'next';

export function episodePanels(r: WeekRecap): EpisodePanel[] {
  const out: EpisodePanel[] = ['title'];
  if (r.minutes > 0) out.push('time');
  if (r.sections.length) out.push('sections');
  if (r.bestDay || r.quests || r.tasks || r.nights) out.push('facts');
  if (r.boss) out.push('boss');
  out.push('next');
  return out;
}
