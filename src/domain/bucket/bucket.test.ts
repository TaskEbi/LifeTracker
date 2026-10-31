import { describe, expect, it } from 'vitest';
import { BUCKET_IDEAS, suggestIdeas, words } from './ideas';
import { BUCKET_SECTION_IDS, groupBySection, guessSection, sectionOf, targetYear, whenLabel } from './sections';

const item = (title: string, data: Record<string, unknown> = {}, note: string | null = null) => ({ title, note, data });

describe('bucket sections', () => {
  it.each([
    ['Visit Kyoto', 'travel'],
    ['See the northern lights', 'travel'],
    ['Climb Mount Fuji', 'adventure'],
    ['Go skydiving', 'adventure'],
    ['Run a marathon', 'body'],
    ['Run the Tokyo Marathon in under 3:30', 'body'],
    ['Do 20 pull-ups', 'body'],
    ['Win a volleyball tournament', 'body'],
    ['Play the Bach Chaconne', 'art'],
    ['Perform with an orchestra', 'art'],
    ['Go to IOI', 'mind'],
    ['Reach 2000 on chess.com', 'mind'],
    ['Learn Japanese', 'mind'],
    ['Build my own app', 'make'],
    ['Run a business', 'make'],
    ['Eat at a Michelin restaurant', 'taste'],
    ['Watch the World Cup final live', 'moments'],
    ['See a total solar eclipse', 'moments'],
    ['Take my parents on holiday', 'people'],
    ['Live in another country', 'life'],
    ['Get my driving licence', 'life'],
    ['Something nobody could guess', 'other'],
    ['Learn to juggle fire', 'other'],
  ])('%s → %s', (title, want) => {
    expect(guessSection(title)).toBe(want);
  });

  it('words match with plain endings but not inside other words', () => {
    expect(guessSection('Go climbing every weekend')).toBe('adventure');
    expect(guessSection('Start a chess club')).toBe('mind'); // "art" inside "start" doesn't count
    expect(guessSection('Eat a fresh apple pie')).toBe('taste'); // "app" isn't in "apple"
  });

  it('the note helps, the title counts more', () => {
    expect(guessSection('Do the big one', 'a full marathon')).toBe('body');
    expect(guessSection('Play the violin in Vienna')).toBe('art');
  });

  it('a section the user chose wins over the guess; a bad value falls back', () => {
    expect(sectionOf(item('Run a marathon', { cat: 'travel' }))).toBe('travel');
    expect(sectionOf(item('Run a marathon', { cat: 'nope' }))).toBe('body');
  });

  it('target years and their labels', () => {
    expect(targetYear(item('x', { by: 2027 }))).toBe(2027);
    expect(targetYear(item('x', { by: '2027' }))).toBeNull();
    expect(whenLabel(2026, 2026)).toBe('This year');
    expect(whenLabel(2027, 2026)).toBe('Next year');
    expect(whenLabel(2030, 2026)).toBe('By 2030');
    expect(whenLabel(2025, 2026)).toBe('Was 2025');
  });

  it('groups in page order, years first inside a section', () => {
    const open = [item('Visit Kyoto'), item('Run a marathon'), item('Visit Paris', { by: 2028 }), item('Visit Rome', { by: 2027 })];
    const g = groupBySection(open, [item('Do a backflip')]);
    expect(g.map((s) => s.section.id)).toEqual(['travel', 'body']);
    expect(g[0].open.map((b) => b.title)).toEqual(['Visit Rome', 'Visit Paris', 'Visit Kyoto']);
    expect(g[1].done.map((b) => b.title)).toEqual(['Do a backflip']);
  });
});

describe('bucket ideas', () => {
  it('every section has ideas and every idea sorts into its own section or close', () => {
    for (const s of BUCKET_SECTION_IDS) expect(BUCKET_IDEAS.some((i) => i.section === s)).toBe(true);
    const titles = BUCKET_IDEAS.map((i) => i.title.toLowerCase());
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('suggests ideas like the list, says which, skips what is already there', () => {
    const list = [item('Play the Bach Chaconne'), item('Run the Tokyo Marathon'), item('Play a violin concerto')].map((b) => ({ ...b, deleted_at: null }));
    const hand = suggestIdeas(list, { n: 6, seed: 1 });
    expect(hand).toHaveLength(6);
    expect(hand.some((s) => s.title === 'Play the Bach Chaconne all the way through')).toBe(false);
    expect(hand.filter((s) => s.section === 'art' || s.section === 'body').length).toBeGreaterThanOrEqual(3);
    expect(hand.find((s) => s.like)).toBeTruthy();
    // no more than two from one section in a mixed hand
    const per = new Map<string, number>();
    for (const s of hand) per.set(s.section, (per.get(s.section) ?? 0) + 1);
    expect(Math.max(...per.values())).toBeLessThanOrEqual(2);
  });

  it('one section only, and a new seed deals a different hand', () => {
    const a = suggestIdeas([], { n: 5, seed: 1, section: 'travel' });
    expect(a.every((s) => s.section === 'travel')).toBe(true);
    expect(a).toHaveLength(5);
    const hands = new Set([1, 2, 3, 4].map((seed) => suggestIdeas([], { n: 5, seed }).map((s) => s.title).join('|')));
    expect(hands.size).toBeGreaterThan(1);
  });

  it('words drop stop words and plain plurals', () => {
    expect([...words('Run the marathons of my dreams')]).toEqual(['run', 'marathon', 'dream']);
  });
});
