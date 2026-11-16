import { describe, expect, it } from 'vitest';
import {
  askable,
  BY_ID,
  cardKey,
  CONTS,
  COUNTRIES,
  dailyItems,
  deck,
  DECKS,
  DIFFS,
  distractors,
  dueCount,
  LOOKALIKES,
  makeQuestion,
  mastered,
  matchCapital,
  matchName,
  medalFor,
  nextMark,
  points,
  QTYPES,
  rankOf,
  reviewPlan,
  seeded,
  streakOf,
  tally,
  typesFor,
  weakIds,
  type Marks,
} from './model';
import { atlasGrants, dayCoins, payTotal } from './pay';

const D = '2026-11-16';

describe('atlas: the countries and decks', () => {
  it('has 195 countries, each with a capital, a continent and six neighbours that exist', () => {
    expect(COUNTRIES).toHaveLength(195);
    expect(new Set(COUNTRIES.map((c) => c.id)).size).toBe(195);
    for (const c of COUNTRIES) {
      expect(c.cap.length).toBeGreaterThan(1);
      expect(CONTS.some((k) => k.id === c.cont)).toBe(true);
      expect(c.near).toHaveLength(6);
      for (const n of c.near) expect(BY_ID.has(n) && n !== c.id).toBe(true);
    }
  });
  it('splits the world into continents and regions with nobody left out or counted twice', () => {
    const conts = DECKS.filter((d) => d.group === 'cont');
    expect(conts.flatMap((d) => d.ids).sort()).toEqual(COUNTRIES.map((c) => c.id).sort());
    for (const k of conts) {
      const subs = DECKS.filter((d) => d.group === 'sub' && d.cont === k.cont);
      if (subs.length) expect(subs.flatMap((d) => d.ids).sort()).toEqual([...k.ids].sort());
    }
    expect(new Set(DECKS.map((d) => d.id)).size).toBe(DECKS.length);
    expect(deck('alike')!.ids.length).toBeGreaterThan(60);
    expect(deck('tiny')!.ids.length).toBeGreaterThan(20);
  });
  it('only lists lookalike flags of real countries', () => {
    for (const g of LOOKALIKES) for (const id of g) expect(BY_ID.has(id), id).toBe(true);
  });
});

describe('atlas: questions', () => {
  it('always includes the right answer once, with as many choices as the difficulty says', () => {
    const rng = seeded('q');
    for (const c of COUNTRIES) {
      for (const t of typesFor(c.id)) {
        for (const d of DIFFS) {
          const q = makeQuestion(c.id, t, d.id, c.cont, rng);
          const info = QTYPES.find((x) => x.id === t)!;
          const n = info.answer === 'flag' ? d.flags : info.answer === 'map' ? d.spots : d.choices;
          if (!n) {
            expect(q.options).toBeNull();
            expect(q.typed).toBe(info.answer !== 'map');
          } else {
            expect(q.options).toHaveLength(n);
            expect(new Set(q.options).size).toBe(n);
            expect(q.options!.filter((x) => x === c.id)).toHaveLength(1);
            // countries lit on a continent's map are all on that map
            if (info.answer === 'map') for (const o of q.options!) expect(BY_ID.get(o)!.cont).toBe(c.cont);
          }
        }
      }
    }
  });
  it('picks wrong answers by difficulty: far away, same continent, then neighbours and lookalikes', () => {
    const rng = seeded('d');
    for (const x of distractors('td', 2, 'easy', true, rng)) expect(BY_ID.get(x)!.cont).not.toBe('africa');
    for (const x of distractors('td', 3, 'normal', true, rng)) expect(BY_ID.get(x)!.cont).toBe('africa');
    const hard = distractors('td', 5, 'hard', true, rng);
    expect(hard).toContain('ro');
    expect(hard).not.toContain('td');
    expect(new Set(hard).size).toBe(5);
  });
  it('asks expert map questions on the world and never asks for the outline of a dot', () => {
    expect(makeQuestion('fr', 'name-map', 'expert', 'europe').view).toBe('world');
    expect(makeQuestion('fr', 'name-map', 'hard', 'europe').view).toBe('europe');
    expect(typesFor('mc')).not.toContain('shape-name');
    expect(askable(['fr', 'mc'], 'shape-name')).toEqual(['fr']);
  });
  it('deals the same daily challenge to everyone, and a different one tomorrow', () => {
    const a = dailyItems(D);
    expect(a).toEqual(dailyItems(D));
    expect(a).toHaveLength(12);
    expect(new Set(a.map((i) => i.id)).size).toBe(12);
    expect(a.map((i) => i.diff)).toEqual([...Array(4).fill('normal'), ...Array(4).fill('hard'), ...Array(4).fill('expert')]);
    expect(dailyItems('2026-11-17').map((i) => i.id)).not.toEqual(a.map((i) => i.id));
  });
});

describe('atlas: typed answers', () => {
  it('takes the name, other names for it and a small slip, but not another country', () => {
    expect(matchName('France', 'fr')).toBe(1);
    expect(matchName('  the netherlands ', 'nl')).toBe(1);
    expect(matchName('holland', 'nl')).toBe(1);
    expect(matchName('UK', 'gb')).toBe(1);
    expect(matchName("Cote d'Ivoire", 'ci')).toBe(1);
    expect(matchName('Kazakstan', 'kz')).toBe(2);
    expect(matchName('Niger', 'ng')).toBe(0);
    expect(matchName('Guinea', 'gw')).toBe(0);
    expect(matchName('', 'fr')).toBe(0);
  });
  it('takes any of several capitals and common spellings', () => {
    expect(matchCapital('cape town', 'za')).toBe(1);
    expect(matchCapital('Pretoria', 'za')).toBe(1);
    expect(matchCapital('Kiev', 'ua')).toBe(1);
    expect(matchCapital('washington', 'us')).toBe(1);
    expect(matchCapital('Reykjavic', 'is')).toBe(2);
    expect(matchCapital('Lyon', 'fr')).toBe(0);
  });
});

describe('atlas: the boxes', () => {
  it('starts a new card at 2, or 3 when the first answer was hard', () => {
    expect(nextMark(undefined, true, 'normal', D)).toEqual({ box: 2, due: '2026-11-18' });
    expect(nextMark(undefined, true, 'expert', D)).toEqual({ box: 3, due: '2026-11-21' });
    expect(nextMark(undefined, false, 'easy', D)).toEqual({ box: 1, due: '2026-11-17' });
  });
  it('moves up one box a day at most, and no higher than the difficulty proves', () => {
    const first = nextMark(undefined, true, 'expert', D);
    expect(nextMark(first, true, 'expert', D)).toBe(first);
    const second = nextMark(first, true, 'expert', '2026-11-21');
    expect(second.box).toBe(4);
    expect(nextMark({ box: 2, due: D }, true, 'easy', D).box).toBe(2);
    expect(nextMark({ box: 3, due: D }, true, 'normal', D).box).toBe(3);
    expect(nextMark({ box: 3, due: D }, true, 'hard', D).box).toBe(4);
    expect(nextMark({ box: 4, due: D }, true, 'hard', D)).toEqual({ box: 4, due: '2026-11-28' });
    expect(nextMark({ box: 4, due: D }, true, 'expert', D).box).toBe(5);
    expect(nextMark({ box: 5, due: D }, true, 'expert', D)).toEqual({ box: 5, due: '2026-12-16' });
  });
  it('sends a missed card back, and getting it right the same day does not undo that', () => {
    const missed = nextMark({ box: 3, due: '2026-11-20' }, false, 'hard', D);
    expect(missed).toEqual({ box: 1, due: '2026-11-17' });
    expect(nextMark(missed, true, 'hard', D)).toBe(missed);
    expect(nextMark({ box: 5, due: '2026-12-01' }, false, 'expert', D).box).toBe(2);
  });
  it('counts a country as mastered only with all three known', () => {
    const marks: Marks = new Map([
      [cardKey('fr', 'flag'), { box: 4, due: D }],
      [cardKey('fr', 'map'), { box: 5, due: D }],
      [cardKey('fr', 'cap'), { box: 3, due: D }],
      [cardKey('de', 'flag'), { box: 1, due: D }],
    ]);
    expect(mastered(marks, 'fr')).toBe(false);
    marks.set(cardKey('fr', 'cap'), { box: 4, due: D });
    expect(mastered(marks, 'fr')).toBe(true);
    expect(tally(['fr', 'de', 'es'], marks)).toEqual({ total: 3, mastered: 1, known: { flag: 1, map: 1, cap: 1 }, seen: 4 });
    expect(weakIds(marks)).toEqual(['de']);
    expect(dueCount(marks, D)).toBe(4);
  });
  it('plans a review: what is due at the difficulty its box needs, then a few new countries three ways', () => {
    const marks: Marks = new Map([
      [cardKey('fr', 'flag'), { box: 4, due: '2026-11-10' }],
      [cardKey('fr', 'cap'), { box: 3, due: D }],
      [cardKey('fr', 'map'), { box: 2, due: '2026-12-01' }],
    ]);
    const ids = deck('europe')!.ids;
    const plan = reviewPlan(ids, marks, D, seeded('r'));
    expect(plan.due).toBe(2);
    expect(plan.fresh).toBe(ids.length - 1);
    expect(plan.items).toHaveLength(2 + 4 * 3);
    const fr = plan.items.filter((i) => i.id === 'fr');
    expect(fr.map((i) => i.diff).sort()).toEqual(['expert', 'hard']);
    const fresh = plan.items.filter((i) => i.id !== 'fr');
    expect(new Set(fresh.map((i) => i.id)).size).toBe(4);
    expect(fresh.every((i) => i.diff === 'normal')).toBe(true);
    // nothing due and nothing new: nothing to ask
    const all: Marks = new Map(ids.flatMap((id) => (['flag', 'map', 'cap'] as const).map((s) => [cardKey(id, s), { box: 5, due: '2027-01-01' }] as const)));
    expect(reviewPlan(ids, all, D).items).toHaveLength(0);
  });
});

describe('atlas: points, medals, ranks, streak', () => {
  it('scores by difficulty and the run so far', () => {
    expect(points('easy', 0)).toBe(10);
    expect(points('normal', 0)).toBe(15);
    expect(points('expert', 4)).toBe(34);
    expect(points('hard', 50)).toBe(30);
  });
  it('gives a medal for nine in ten first time: bronze, silver, gold by difficulty', () => {
    expect(medalFor('easy', 10, 10).tier).toBe(0);
    expect(medalFor('normal', 9, 10)).toEqual({ tier: 1, flawless: false });
    expect(medalFor('hard', 44, 45)).toEqual({ tier: 2, flawless: false });
    expect(medalFor('expert', 54, 54)).toEqual({ tier: 3, flawless: true });
    expect(medalFor('expert', 8, 10).tier).toBe(0);
  });
  it('ranks by stamps', () => {
    expect(rankOf(0).rank.name).toBe('Stowaway');
    expect(rankOf(34).rank.name).toBe('Wayfarer');
    expect(rankOf(35).next!.at).toBe(70);
    expect(rankOf(195)).toMatchObject({ rank: { name: 'Atlas' }, next: null });
  });
  it('keeps a streak of days with ten right, today still open', () => {
    const days = [
      { date: '2026-11-13', ok: 12 },
      { date: '2026-11-14', ok: 30 },
      { date: '2026-11-15', ok: 10 },
      { date: D, ok: 3 },
    ];
    expect(streakOf(days, D)).toBe(3);
    expect(streakOf([...days.slice(0, 3), { date: D, ok: 10 }], D)).toBe(4);
    expect(streakOf(days, '2026-11-18')).toBe(0);
  });
});

describe('atlas: what it pays', () => {
  let n = 0;
  const row = (kind: string, data: Record<string, unknown>, id = `row-${n++}`) => ({ id, kind, data });
  it('pays a little for a day, capped, and for the daily challenge once', () => {
    expect(dayCoins(0)).toBe(0);
    expect(dayCoins(1)).toBe(5);
    expect(dayCoins(30)).toBe(15);
    expect(dayCoins(1000)).toBe(60);
    const g = atlasGrants([row('geo_day', { date: D, n: 40, ok: 30, pts: 500, best: 9, daily: { ok: 12, n: 12, pts: 300 } })]);
    expect(g).toEqual([
      { key: `geo:day:${D}`, date: D, label: 'Atlas: 30 right', coins: 15 },
      { key: `geo:daily:${D}`, date: D, label: 'Atlas daily challenge, all twelve', coins: 40, gems: 3 },
    ]);
  });
  it('pays a medal by the size of its deck, each step once', () => {
    const g = atlasGrants([row('geo_medal', { deck: 'africa', type: 'flag-name', tier: 3, flawless: true, date: D }, 'm1')]);
    expect(g.map((x) => [x.key, x.coins, x.gems])).toEqual([
      ['geo:medal:m1:1', 54, undefined],
      ['geo:medal:m1:2', 108, undefined],
      ['geo:medal:m1:3', 216, 2],
      ['geo:medal:m1:flawless', 54, undefined],
    ]);
    // a deck that isn't one (the weak spots) pays nothing
    expect(payTotal([row('geo_medal', { deck: 'weak', type: 'mix', tier: 3, flawless: false, date: D })])).toEqual({ coins: 0, gems: 0 });
  });
  it('pays each stamp, a continent when its last stamp lands, and the world at the end', () => {
    const oceania = deck('oceania')!.ids;
    const some = oceania.map((cc, i) => row('geo_stamp', { cc, date: i === 3 ? '2026-12-01' : D }));
    const g = atlasGrants(some);
    expect(g.filter((x) => x.key.startsWith('geo:stamp:'))).toHaveLength(oceania.length);
    expect(g.find((x) => x.key === 'geo:cont:oceania')).toMatchObject({ date: '2026-12-01', coins: 300, gems: 20, chest: 'gold' });
    expect(g.some((x) => x.key === 'geo:world')).toBe(false);
    expect(atlasGrants(some.slice(1)).some((x) => x.key.startsWith('geo:cont:'))).toBe(false);
    const everyone = atlasGrants(COUNTRIES.map((c) => row('geo_stamp', { cc: c.id, date: D })));
    expect(everyone.filter((x) => x.key.startsWith('geo:cont:'))).toHaveLength(6);
    expect(everyone.find((x) => x.key === 'geo:world')).toMatchObject({ chest: 'mythic', gems: 100 });
  });
});
