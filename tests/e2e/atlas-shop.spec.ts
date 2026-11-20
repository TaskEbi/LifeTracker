import { expect, test, type Page } from '@playwright/test';
import { COUNTRIES } from '../../src/domain/atlas/model';

const byId = (id: string) => COUNTRIES.find((c) => c.id === id)!;
const byText = (t: string) => COUNTRIES.find((c) => c.name === t) ?? COUNTRIES.find((c) => c.cap === t)!;
const purse = async (page: Page) => Number((await page.locator('.at-purse').getAttribute('aria-label'))!.match(/Purse: (\d+)/)![1]);

test('atlas: Doubloons earned in play and Fill the map buy a title and supplies, which help in a round', async ({ page }) => {
  test.setTimeout(120_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/atlas');
  expect(await purse(page)).toBe(0);
  await expect(page.getByRole('region', { name: 'Today’s quests' }).getByRole('listitem')).toHaveCount(3);

  // a flawless round on two flags: answers, a bronze medal and flawless
  await page.goto('/atlas/play/round/flag-name/sub-australia-and-new-zealand/normal');
  for (let i = 0; i < 2; i++) {
    const id = ((await page.getByRole('img', { name: 'The flag to identify' }).getAttribute('src')) ?? '').match(/\/flags\/(\w+)\.svg/)![1];
    await page.getByRole('group', { name: 'Answers' }).getByRole('button', { name: byId(id).name, exact: true }).click();
    await expect(page.locator('.at-fb')).toHaveCount(0);
  }
  await expect(page.locator('.at-pay--db')).toContainText('45');

  // fill in the whole world: 40, and 20 for all of it
  await page.goto('/atlas');
  await page.getByRole('button', { name: /^Fill the map/ }).click();
  await expect(page).toHaveURL(/\/atlas\/fill$/);
  await page.getByRole('group', { name: 'Map to fill' }).getByRole('button', { name: /World/ }).click();
  await page.getByRole('button', { name: 'Start' }).click();
  const input = page.getByLabel('Type a country');
  for (const c of COUNTRIES) await input.fill(c.name);
  await expect(page.getByRole('heading', { name: /^All 195, in/ })).toBeVisible();
  await expect(page.locator('.at-pay--db')).toContainText('60');

  // the Chandlery
  await page.goto('/atlas/shop');
  const start = await purse(page);
  expect(start).toBeGreaterThanOrEqual(105);
  await page.getByRole('group', { name: 'Shelf' }).getByRole('button', { name: /Titles/ }).click();
  await page.getByRole('button', { name: 'Buy the title the Curious for 50 Doubloons' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'the Curious: bought' })).toBeVisible();
  await page.getByRole('button', { name: 'Wear it' }).first().click();
  await page.getByRole('group', { name: 'Shelf' }).getByRole('button', { name: /Supplies/ }).click();
  await page.getByRole('button', { name: 'Buy a Fifty-fifty for 25 Doubloons' }).click();
  await page.getByRole('button', { name: 'Buy a Spyglass for 15 Doubloons' }).click();
  expect(await purse(page)).toBe(start - 90);
  // too poor for a ship
  await page.getByRole('group', { name: 'Shelf' }).getByRole('button', { name: /Ships/ }).click();
  await expect(page.getByRole('button', { name: /Buy the Sloop/ })).toBeDisabled();

  // the title is worn on the front page
  await page.goto('/atlas');
  await expect(page.getByText('“the Curious”')).toBeVisible();

  // supplies in a round: six answers halved to three, then a clue
  await page.goto('/atlas/play/round/flag-name/europe/hard');
  const answers = page.getByRole('group', { name: 'Answers' }).getByRole('button');
  await expect(answers).toHaveCount(6);
  await page.getByRole('group', { name: 'Supplies' }).getByRole('button', { name: /Fifty-fifty/ }).click();
  await expect(answers).toHaveCount(3);
  await page.getByRole('group', { name: 'Supplies' }).getByRole('button', { name: /Spyglass/ }).click();
  await expect(page.locator('.at-clue')).toContainText('The name starts with');
  await expect(page.getByRole('group', { name: 'Supplies' })).toHaveCount(0);

  // all still there after a reload
  await page.goto('/atlas/shop');
  await page.reload();
  expect(await purse(page)).toBe(start - 90);
  await page.getByRole('group', { name: 'Shelf' }).getByRole('button', { name: /Supplies/ }).click();
  await expect(page.locator('.at-good').filter({ hasText: 'Fifty-fifty' })).toContainText('In hand: 0');
  await page.goto('/atlas/passport');
  await expect(page.getByRole('region', { name: 'Logbook' })).toContainText('the Curious');
});

test('atlas: a voyage trades at a port, is wrecked by three storms, and is in the logbook', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/atlas');
  await page.getByRole('button', { name: /Voyages/ }).click();
  await expect(page).toHaveURL(/\/atlas\/voyage$/);
  await expect(page.getByRole('heading', { name: 'Raft' })).toBeVisible();
  await page.getByRole('group', { name: 'Setting out from' }).getByRole('button', { name: 'Europe' }).click();
  await page.getByRole('group', { name: 'Questions' }).getByRole('button', { name: 'Capitals' }).click();
  await page.getByRole('group', { name: 'Difficulty' }).getByRole('button', { name: /Easy/ }).click();
  await page.getByRole('button', { name: 'Set sail' }).click();
  await expect(page).toHaveURL(/\/atlas\/voyage\/[0-9a-f-]+$/);

  for (let port = 0; port < 4; port++) {
    const flag = page.getByRole('img', { name: 'The flag to identify' });
    const c = (await flag.count()) ? byId(((await flag.getAttribute('src')) ?? '').match(/\/flags\/(\w+)\.svg/)![1]) : byText(((await page.locator('.at-ask__big').textContent()) ?? '').trim());
    const opts = page.getByRole('group', { name: 'Answers' }).getByRole('button');
    await expect(opts).toHaveCount(3);
    const labels = (await opts.allTextContents()).map((l) => l.replace(/^\d/, ''));
    const right = labels.findIndex((l) => l === c.name || l === c.cap);
    expect(right).toBeGreaterThanOrEqual(0);
    await opts.nth(port === 0 ? right : (right + 1) % 3).click();
    await expect(page.locator('.at-storm')).toContainText(port === 0 ? 'Traded at' : 'storm');
    await page.getByRole('button', { name: /Sail on|Make landfall/ }).click();
  }
  await expect(page.getByRole('heading', { name: /^Wrecked off / })).toBeVisible();
  await expect(page.locator('.at-pay--db')).toContainText('4 for the ports');

  await page.reload();
  await expect(page.getByRole('heading', { name: /^Wrecked off / })).toBeVisible();
  await page.getByRole('button', { name: 'Back to the harbour' }).click();
  await expect(page.getByRole('region', { name: 'Logbook' })).toContainText('Wrecked · 1 of 6 traded');
});

test('atlas: pairs and compass play, and count for the day', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/atlas/pairs');
  await page.getByRole('button', { name: 'Card 1, face down' }).click();
  await expect(page.getByRole('group', { name: 'Cards' }).getByRole('button', { name: /face down/ })).toHaveCount(11);

  await page.goto('/atlas/compass');
  for (let i = 0; i < 10; i++) {
    await page.getByRole('group', { name: 'Pick one' }).getByRole('button').first().click();
    await page.getByRole('button', { name: i === 9 ? 'Finish' : 'Next →' }).click();
  }
  await expect(page.getByRole('heading', { name: /of 10 the right way$/ })).toBeVisible();
  await page.goto('/atlas');
  await expect(page.getByRole('button', { name: /Compass/ })).toContainText('Best today');
});
