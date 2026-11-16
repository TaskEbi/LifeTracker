import { expect, test, type Page } from '@playwright/test';
import { COUNTRIES } from '../../src/domain/atlas/model';

const byName = (name: string) => COUNTRIES.find((c) => c.name === name)!;
const byId = (id: string) => COUNTRIES.find((c) => c.id === id)!;

/** Taps a country on the map: finds a point inside its shape (or its ring) and clicks there. False if it's hidden under a neighbour's ring. */
async function tryTap(page: Page, id: string): Promise<boolean> {
  // a small country is tapped by its ring
  const ring = page.locator(`.at-map .at-mk[data-id="${id}"]`);
  const el = (await ring.count()) ? ring : page.locator(`.at-map .at-land[data-id="${id}"]`);
  await expect(el).toBeVisible();
  await el.evaluate((node) => (node as SVGElement).ownerSVGElement!.scrollIntoView({ block: 'center' }));
  const pt = await el.evaluate((node) => {
    const g = node as SVGGeometryElement;
    const svg = g.ownerSVGElement!;
    const m = g.getScreenCTM()!;
    const b = g.getBBox();
    const at = (x: number, y: number) => {
      const p = new DOMPoint(x, y).matrixTransform(m);
      return { x: p.x, y: p.y };
    };
    if (g.tagName === 'circle') return at(b.x + b.width / 2, b.y + b.height / 2);
    for (let i = 1; i < 30; i++) {
      for (let j = 1; j < 30; j++) {
        const p = svg.createSVGPoint();
        p.x = b.x + (b.width * i) / 30;
        p.y = b.y + (b.height * j) / 30;
        if (g.isPointInFill(p)) {
          // well inside, not on a border: the same country three pixels each way
          const s = at(p.x, p.y);
          if ([[0, 0], [3, 0], [-3, 0], [0, 3], [0, -3]].every(([dx, dy]) => document.elementFromPoint(s.x + dx, s.y + dy) === g)) return { x: Math.round(s.x), y: Math.round(s.y) };
        }
      }
    }
    return null;
  });
  if (!pt) return false;
  await page.mouse.click(pt.x, pt.y);
  return true;
}
const tapCountry = async (page: Page, id: string) => expect(await tryTap(page, id), `a place to tap ${id}`).toBe(true);

test('atlas: a round with a medal, typed answers, the map, and what it pays', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/home/more');
  await page.getByRole('button', { name: /^Atlas/ }).click();
  await expect(page).toHaveURL(/\/atlas$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Atlas' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Stowaway' })).toBeVisible();

  // set up a round: flags of Australia and New Zealand, four choices
  await page.getByRole('group', { name: 'Kind of game' }).getByRole('button', { name: /Round/ }).click();
  await page.getByRole('group', { name: 'Kind of question' }).getByRole('button', { name: 'Flag → country' }).click();
  await page.getByRole('group', { name: 'Deck' }).getByRole('button', { name: /Oceania/ }).click();
  await page.getByRole('group', { name: 'Region' }).getByRole('button', { name: /Australia and New Zealand/ }).click();
  await page.getByRole('group', { name: 'Difficulty' }).getByRole('button', { name: /Normal/ }).click();
  await expect(page.getByText('2 countries')).toBeVisible();
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page).toHaveURL(/\/atlas\/play\/round\/flag-name\/sub-australia-and-new-zealand\/normal$/);

  for (let i = 0; i < 2; i++) {
    const flag = page.getByRole('img', { name: 'The flag to identify' });
    const id = ((await flag.getAttribute('src')) ?? '').match(/\/flags\/(\w+)\.svg/)![1];
    await expect(page.getByRole('group', { name: 'Answers' }).getByRole('button')).toHaveCount(4);
    await page.getByRole('group', { name: 'Answers' }).getByRole('button', { name: byId(id).name, exact: true }).click();
    await expect(page.locator('.at-fb')).toContainText('Correct');
    await expect(page.locator('.at-fb')).toHaveCount(0);
  }
  await expect(page.getByRole('heading', { name: '2 of 2 right first time' })).toBeVisible();
  await expect(page.getByText('Bronze medal, flawless')).toBeVisible();
  await expect(page.getByText('New in your passport.')).toBeVisible();
  // 2 right today (5 Ryō), a bronze medal on a deck of two (2) and flawless (2)
  await expect(page.getByText('+9 Ryō')).toBeVisible();

  // expert: type the capital; a wrong one comes back
  await page.goto('/atlas/play/round/name-cap/sub-australia-and-new-zealand/expert');
  const first = byName((await page.locator('.at-ask__big').textContent()) ?? '');
  await page.getByLabel('Type the capital').fill('zzz');
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.locator('.at-fb')).toContainText('You typed “zzz”.');
  await expect(page.locator('.at-fb')).toContainText(first.cap);
  await page.getByRole('button', { name: 'Next →' }).click();
  for (let i = 0; i < 2; i++) {
    const c = byName((await page.locator('.at-ask__big').textContent()) ?? '');
    await page.getByLabel('Type the capital').fill(c.cap.toLowerCase());
    await page.getByRole('button', { name: 'Check' }).click();
    await expect(page.locator('.at-fb')).toContainText('Correct');
    await expect(page.locator('.at-fb')).toHaveCount(0);
  }
  await expect(page.getByRole('heading', { name: '1 of 2 right first time' })).toBeVisible();
  await expect(page.getByText('A medal needs nine in ten right first time.')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Missed' })).toContainText(first.name);

  // the map: on Easy three countries are lit, and only they can be tapped
  await page.goto('/atlas/play/round/name-map/samerica/easy');
  const target = byName((await page.locator('.at-ask__big').textContent()) ?? '');
  await expect(page.getByText('It’s one of the 3 lit up.')).toBeVisible();
  await expect(page.locator('.at-map .is-cand')).toHaveCount(3);
  await tapCountry(page, target.id);
  await expect(page.locator('.at-fb')).toContainText('Correct');
  await expect(page.locator(`.at-map .at-land[data-id="${target.id}"]`)).toHaveClass(/is-ok/);
  // a right answer moves on by itself
  await expect(page.locator('.at-fb')).toHaveCount(0);

  // it's all still there after a reload: the medal in the passport, the cards, the day's count
  await page.goto('/atlas/passport');
  await page.reload();
  const row = page.getByRole('row', { name: /Australia and New Zealand/ });
  await expect(row.getByRole('img', { name: 'Bronze medal, flawless' })).toHaveCount(1);
  await page.goto('/atlas');
  await expect(page.getByText(/right answers in a day keep the streak \(5 so far\)/)).toBeVisible();

  // and the Hangar's ledger names where the Ryō came from
  await page.goto('/hangar/ledger');
  await expect(page.getByText('The Atlas', { exact: true })).toBeVisible();
});

test('atlas: the daily challenge counts once, and the review meets new countries', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/atlas');
  await page.getByRole('button', { name: /Daily challenge/ }).click();
  await expect(page).toHaveURL(/\/atlas\/daily$/);

  // twelve questions, answered any old way
  for (let i = 0; i < 12; i++) {
    await expect(page.locator('.at-hud__nums')).toContainText(`${i + 1}/12`);
    const options = page.getByRole('group', { name: 'Answers' }).getByRole('button');
    const giveUp = page.getByRole('button', { name: 'I don’t know, show me' });
    if (await options.count()) await options.first().click();
    else if (await giveUp.count()) await giveUp.click();
    else {
      // one of the lit ones if some are lit (whichever isn't under a neighbour's ring), else somewhere big
      await expect(page.locator('.at-map .at-land[data-id="br"]')).toBeVisible();
      const lit = await page.locator('.at-map .is-cand').evaluateAll((els) => [...new Set(els.map((e) => e.getAttribute('data-id')!))]);
      let tapped = false;
      for (const id of lit.length ? lit : ['br']) {
        if ((tapped = await tryTap(page, id))) break;
      }
      expect(tapped).toBe(true);
    }
    await expect(page.locator('.at-fb')).toBeVisible();
    // a right answer moves on by itself; a wrong one waits to be read
    if (await page.locator('.at-fb.is-bad').count()) await page.getByRole('button', { name: 'Next →' }).click();
    else await expect(page.locator('.at-fb')).toHaveCount(0);
  }
  await expect(page.getByRole('heading', { name: /^\d+ of 12 on today’s challenge$/ })).toBeVisible();
  await expect(page.getByText(/\+\d+ Ryō/)).toBeVisible();

  await page.getByRole('button', { name: 'Back to the Atlas' }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: /Daily challenge/ })).toContainText(/Done: \d+ of 12/);

  // the review: four countries not met yet, each asked three ways
  await page.getByRole('button', { name: /^Review/ }).click();
  await expect(page).toHaveURL(/\/atlas\/review$/);
  await expect(page.locator('.at-hud__title')).toHaveText('Review · World');
  await expect(page.locator('.at-hud__nums')).toContainText(/1\/\d+/);

  // learn: the map, a card, and finding a country by its capital
  await page.goto('/atlas/learn');
  await expect(page.getByRole('heading', { level: 2, name: 'Albania' })).toBeVisible();
  await page.getByRole('button', { name: 'Next →' }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Andorra' })).toBeVisible();
  await page.getByLabel('Find a country or capital').fill('reyk');
  await page.getByRole('region', { name: 'Countries' }).getByRole('button', { name: /Iceland/ }).click();
  await expect(page.getByRole('article', { name: 'Iceland' })).toContainText('Reykjavik');
  await expect(page.locator('.at-map [data-id="is"]')).toHaveClass(/is-hl/);
});
