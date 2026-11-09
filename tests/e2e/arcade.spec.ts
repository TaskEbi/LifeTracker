import { expect, test, type Page } from '@playwright/test';

/** A few days of sessions since the Arcade opened, through the app's own save functions. */
async function seed(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Focus mode' }).or(page.locator('.h-focus'))).toBeVisible();
  await page.evaluate(async () => {
    const lt = await import('/src/data/lt.ts' as string);
    const log = await import('/src/data/logActions.ts' as string);
    const dates = await import('/src/domain/log/dates.ts' as string);
    const today = lt.ltToday();
    for (const s of ['violin', 'coding', 'study']) {
      const topic = lt.ensureSectionTopic(s);
      for (let d = 0; d < 20; d++) log.addEntry({ topic_id: topic, date: dates.addDays(today, -d), minutes: 50, note: '' });
    }
    const store = await import('/src/data/store.ts' as string);
    for (let i = 0; i < 100; i++) {
      const db = store.currentSession()?.db;
      if (!db) break;
      const entries = await db.getAll('log_entries');
      if (entries.length >= store.data.get().log_entries.size) break;
      await new Promise((r) => setTimeout(r, 100));
    }
  });
  await page.waitForTimeout(200);
}

const shot = (page: Page, name: string) => (process.env.ARCADE_SHOTS ? page.screenshot({ path: `${process.env.ARCADE_SHOTS}/${name}.png`, fullPage: true }) : Promise.resolve());

test.beforeEach(async ({ page }) => {
  // Thursday of the Arcade's first week, by day.
  await page.clock.setFixedTime(new Date('2026-11-12T03:00:00Z'));
});

test('arcade: a fresh start has no dice or casts, and a card to fill', async ({ page }) => {
  await page.goto('/hangar/arcade');
  await expect(page.getByRole('heading', { name: "This week's card" })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Bingo card' }).getByRole('listitem')).toHaveCount(16);
  await page.getByRole('navigation', { name: 'Arcade games' }).getByRole('button', { name: /Sugoroku/ }).click();
  await expect(page.getByRole('button', { name: /^Roll/ })).toBeDisabled();
  await page.getByRole('navigation', { name: 'Arcade games' }).getByRole('button', { name: /Pond/ }).click();
  await expect(page.getByRole('button', { name: 'Cast', exact: true })).toBeDisabled();
  await expect(page.getByRole('heading', { name: /Fish book/ })).toBeVisible();
});

test('arcade: logging earns dice and casts; rolls, casts and bingo lines are saved once', async ({ page }) => {
  await seed(page);
  await page.goto('/home/arena');
  await expect(page.getByRole('button', { name: /Arcade/ })).toContainText(/dice/);
  await page.getByRole('button', { name: /Arcade/ }).click();
  await expect(page).toHaveURL(/\/hangar\/arcade$/);
  await shot(page, 'bingo');

  // Bingo: three sessions a day in violin, coding and study fill several cells by Thursday.
  const marked = page.locator('.ar-cell.is-marked');
  expect(await marked.count()).toBeGreaterThan(2);

  // Sugoroku: four active days of three sections = at least two dice a day.
  await page.getByRole('navigation', { name: 'Arcade games' }).getByRole('button', { name: /Sugoroku/ }).click();
  await expect(page).toHaveURL(/\/hangar\/arcade\/board$/);
  const roll = page.getByRole('button', { name: /^Roll/ });
  const dice = Number((await roll.textContent())!.match(/(\d+) dice/)![1]);
  expect(dice).toBeGreaterThanOrEqual(8);
  await roll.click();
  await expect(page.locator('.ar-board__tile')).toContainText(/Rolled|Shrine|Lap/);
  await expect(roll).toContainText(`${dice - 1} dice`);
  await shot(page, 'board');
  const here = await page.locator('.ar-sq.is-here').getAttribute('aria-label');

  // The pond: strike too early and it's gone, but the cast is spent and saved.
  await page.getByRole('navigation', { name: 'Arcade games' }).getByRole('button', { name: /Pond/ }).click();
  const before = await page.getByRole('heading', { name: /The pond/ }).locator('..').textContent();
  await page.getByRole('button', { name: 'Cast', exact: true }).click();
  await page.getByRole('button', { name: 'Strike!' }).click();
  await expect(page.getByText('It got away.')).toBeVisible();
  await shot(page, 'pond');

  // Everything survives a reload.
  await page.reload();
  await expect(page.locator('.ar-recent')).toContainText('The one that got away');
  expect(await page.getByRole('heading', { name: /The pond/ }).locator('..').textContent()).not.toBe(before);
  await page.goto('/hangar/arcade/board');
  await expect(page.locator('.ar-sq.is-here')).toHaveAttribute('aria-label', here!);
  await page.goto('/hangar/ledger');
  await expect(page.getByText(/Sugoroku: rolled/).first()).toBeVisible();
  await expect(page.getByText('Pond: it got away').first()).toBeVisible();
});
