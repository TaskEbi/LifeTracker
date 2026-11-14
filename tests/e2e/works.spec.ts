import { expect, test, type Page } from '@playwright/test';

const shot = (page: Page, name: string) => (process.env.WORKS_SHOTS ? page.screenshot({ path: `${process.env.WORKS_SHOTS}/${name}.png`, fullPage: true }) : Promise.resolve());

/** A factory left running two hours ago: ten tanuki, 40 gold cogs, and enough lifetime bolts for two blueprints. */
async function seed(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Focus mode' }).or(page.locator('.h-focus'))).toBeVisible();
  await page.evaluate(async () => {
    const store = await import('/src/data/store.ts' as string);
    const ws = await import('/src/features/game/worksStore.ts' as string);
    const idle = await import('/src/domain/game/idle.ts' as string);
    const t = new Date().toISOString();
    const save = { ...idle.fresh(Date.now() - 2 * 3600_000), gens: { tanuki: 10 }, cogs: 40, life: 8e6 };
    store.commit('lt_records', [{ id: ws.WORKS_ROW, section: 'cabinet', kind: 'gm_idle', data: save, sort_order: 0, archived_at: null, created_at: t, updated_at: t, deleted_at: null }]);
    // The write to IndexedDB is not awaited by the app: wait for it, so a reload finds the row.
    for (let i = 0; i < 100; i++) {
      const db = store.currentSession()?.db;
      if (!db) break;
      const rows = await db.getAll('lt_records');
      if (rows.some((r: { id: string }) => r.id === ws.WORKS_ROW)) break;
      await new Promise((r) => setTimeout(r, 100));
    }
  });
}

const rooms = (page: Page) => page.getByRole('navigation', { name: 'The Works' });

test('works: turn the gear, buy a machine, and it is still there after a reload', async ({ page }) => {
  // A stopped clock: only turns make bolts, so the numbers are exact.
  await page.clock.setFixedTime(new Date('2026-11-14T03:00:00Z'));
  await page.goto('/hangar/works');
  await expect(page.getByRole('navigation', { name: 'Hangar' }).getByRole('button', { name: 'Works', exact: true })).toHaveAttribute('aria-current', 'page');
  const gear = page.getByRole('button', { name: 'Turn the gear' });
  await expect(gear).toBeVisible();
  const buy = page.getByRole('button', { name: /^Buy 1 Wind-up Mouse/ });
  await expect(buy).toBeDisabled();
  for (let i = 0; i < 20; i++) await gear.click();
  await expect(page.getByRole('progressbar', { name: 'Heat' })).toHaveAttribute('aria-valuenow', /^[1-9]/);
  await expect(buy).toBeEnabled();
  await buy.click();
  await expect(page.locator('.wk-row', { hasText: 'Wind-up Mouse' })).toContainText('×1');
  await shot(page, 'floor');

  // Calloused Thumb turns up after the first turn.
  await rooms(page).getByRole('button', { name: /Upgrades/ }).click();
  await expect(page).toHaveURL(/\/hangar\/works\/tune$/);
  await expect(page.getByText('Calloused Thumb I', { exact: true })).toBeVisible();

  // Leaving the tab saves; the save survives a reload.
  await page.getByRole('navigation', { name: 'Hangar' }).getByRole('button', { name: /Ledger/ }).click();
  await page.waitForTimeout(400);
  await page.goto('/hangar/works');
  await expect(page.locator('.wk-row', { hasText: 'Wind-up Mouse' })).toContainText('×1');
  await rooms(page).getByRole('button', { name: /Records/ }).click();
  await expect(page.locator('.wk-stats')).toContainText('Turns of the gear20');
});

test('works: the crew works while you are away, the cat pays, and gold cogs buy cosmetics', async ({ page }) => {
  await seed(page);
  await page.goto('/home/arena');
  const door = page.getByRole('button', { name: /The Works/ });
  await expect(door).toContainText(/bolts waiting/);
  await door.click();
  await expect(page).toHaveURL(/\/hangar\/works$/);

  // Two hours away at half speed: 10 a second × 0.5 × 7,200 s (and the few seconds the test took).
  const away = page.locator('.wk-away');
  await expect(away).toContainText(/made 36,0\d\d bolts/);
  await expect(away).toContainText('at 50%');
  await shot(page, 'away');
  await away.getByRole('button', { name: 'Back to work' }).click();
  await expect(away).toHaveCount(0);

  // The daily crate, once.
  await page.getByRole('button', { name: /Open today’s crate: 5 gold cogs/ }).click();
  await expect(page.getByRole('button', { name: /Open today’s crate/ })).toHaveCount(0);

  // The lucky cat.
  await page.evaluate(async () => (await import('/src/features/game/worksStore.ts' as string)).summonCat());
  // The cat bobs up and down and turns up anywhere on the floor, so press it without aiming.
  await page.getByRole('button', { name: 'Catch the lucky cat' }).dispatchEvent('click');
  await expect(page.locator('.wk-flash')).toContainText(/Koban rain|Frenzy|Tap fever/);

  // The counter: a title for the robot and a new gear to turn.
  await rooms(page).getByRole('button', { name: /Counter/ }).click();
  await expect(page).toHaveURL(/\/hangar\/works\/counter$/);
  await expect(page.getByRole('button', { name: 'Buy Perpetual Motion for 400 gold cogs' })).toBeDisabled();
  await page.getByRole('button', { name: 'Buy Bolt Counter for 10 gold cogs' }).click();
  await page.getByRole('button', { name: 'Wear: Bolt Counter' }).click();
  await expect(page.getByRole('button', { name: 'In use: Bolt Counter' })).toBeVisible();
  await page.getByRole('button', { name: 'Buy Brass Cog for 15 gold cogs' }).click();
  await expect(page.getByRole('button', { name: 'In use: Brass Cog' })).toBeVisible();
  await page.getByRole('button', { name: 'Buy Hard Hat for 70 gold cogs' }).scrollIntoViewIfNeeded();
  await shot(page, 'counter');

  // It's in the Hangar's ledger and on the robot's plate.
  await page.getByRole('navigation', { name: 'Hangar' }).getByRole('button', { name: /Ledger/ }).click();
  await expect(page.getByText('Works counter: Bolt Counter')).toBeVisible();
  await expect(page.getByText('Works counter: Brass Cog')).toBeVisible();
  await page.getByRole('navigation', { name: 'Hangar' }).getByRole('button', { name: 'Hangar', exact: true }).click();
  await expect(page.locator('.gm-bay__plate')).toContainText('Bolt Counter');

  // And still there after a reload.
  await page.waitForTimeout(400);
  await page.goto('/hangar/works/counter');
  await expect(page.getByRole('button', { name: 'In use: Bolt Counter' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'In use: Brass Cog' })).toBeVisible();
});

test('works: a rebuild draws blueprints, clears the floor and keeps the perks', async ({ page }) => {
  await seed(page);
  await page.goto('/home/arena');
  await page.getByRole('button', { name: /The Works/ }).click();
  await rooms(page).getByRole('button', { name: /Rebuild/ }).click();
  await expect(page.getByText('2 blueprints ready')).toBeVisible();
  await page.getByRole('button', { name: /^Rebuild for 2 blueprints/ }).click();
  await shot(page, 'rebuild');
  await page.getByRole('button', { name: 'Yes, knock it down' }).click();
  await expect(page.getByText('No blueprint yet')).toBeVisible();
  await page.getByRole('button', { name: 'Head Start: level 1 for 1 blueprint' }).click();
  await expect(page.locator('.wk-row', { hasText: 'Head Start' })).toContainText('1/10');
  await rooms(page).getByRole('button', { name: /Machines/ }).click();
  await expect(page.locator('.wk-row', { hasText: 'Tanuki Apprentice' })).not.toContainText('×10');
  await expect(page.getByRole('list', { name: 'What is speeding the factory up' })).toContainText('Blueprints +10%');
});

test('works: every room has one heading, named controls and no sideways scroll', async ({ page }) => {
  await seed(page);
  await page.waitForTimeout(600);
  for (const path of ['/hangar/works', '/hangar/works/tune', '/hangar/works/plans', '/hangar/works/counter', '/hangar/works/book']) {
    await page.goto(path);
    await expect(page.getByRole('button', { name: 'Turn the gear' })).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    const bad = await page.evaluate(() => {
      const unnamed = [...document.querySelectorAll('button')].filter((b) => b.offsetParent && !(b.getAttribute('aria-label') || b.textContent?.trim()));
      return { unnamed: unnamed.length, over: document.documentElement.scrollWidth - document.documentElement.clientWidth };
    });
    expect(bad, path).toEqual({ unnamed: 0, over: 0 });
  }
});
