import { expect, test, type Page } from '@playwright/test';

const shot = (page: Page, name: string) => (process.env.AURA_SHOTS ? page.screenshot({ path: `${process.env.AURA_SHOTS}/${name}.png` }) : Promise.resolve());

/** A dial left rolling three hours ago, with a Torii rolled and its scene not watched yet. */
async function seed(page: Page, over: Record<string, unknown> = {}) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Focus mode' }).or(page.locator('.h-focus'))).toBeVisible();
  await page.evaluate(async (extra) => {
    const store = await import('/src/data/store.ts' as string);
    const logActions = await import('/src/data/logActions.ts' as string);
    const aura = await import('/src/domain/game/aura.ts' as string);
    const id = logActions.pairId('gm', 'aura');
    const t = new Date().toISOString();
    const save = { ...aura.freshAura(Date.now() - 3 * 3600_000), rolls: 40, motes: 5000, got: { dust: 30, moss: 9, torii: 1 }, first: { torii: '2026-11-13' }, queue: ['torii'], ...extra };
    store.commit('lt_records', [{ id, section: 'cabinet', kind: 'gm_aura', data: save, sort_order: 0, archived_at: null, created_at: t, updated_at: t, deleted_at: null }]);
    // The write to IndexedDB is not awaited by the app: wait for it, so a reload finds the row.
    for (let i = 0; i < 100; i++) {
      const db = store.currentSession()?.db;
      if (!db) break;
      const rows = await db.getAll('lt_records');
      if (rows.some((r: { id: string }) => r.id === id)) break;
      await new Promise((r) => setTimeout(r, 100));
    }
  }, over);
}

/** Watch out any scenes that are playing or about to (a lucky roll can land on something rare). */
async function clearScenes(page: Page) {
  await page.waitForTimeout(600);
  for (let i = 0; i < 10 && (await page.getByRole('dialog').isVisible().catch(() => false)); i++) {
    const d = page.getByRole('dialog');
    const skip = d.getByRole('button', { name: 'Skip', exact: true });
    if (await skip.isVisible().catch(() => false)) await skip.click().catch(() => {});
    await d.getByRole('button', { name: /^(Continue|Next|Close)/ }).click();
    await page.waitForTimeout(150);
  }
}

const rooms = (page: Page) => page.getByRole('navigation', { name: 'The Works' });

test('aura dial: roll, see only what you have rolled, buy an upgrade, and it survives a reload', async ({ page }) => {
  await page.goto('/hangar/works');
  await rooms(page).getByRole('button', { name: /Auras/ }).click();
  await expect(page).toHaveURL(/\/hangar\/works\/aura$/);
  const roll = page.getByRole('button', { name: 'Roll the dial' });
  await expect(roll).toBeVisible();
  await expect(page.getByText('Nothing rolled yet')).toBeVisible();

  // Nothing is in the index yet: every card is a question mark with only its odds.
  await page.getByRole('button', { name: /^Index 0\/30/ }).click();
  await expect(page.locator('.au-card.is-locked')).toHaveCount(30);
  await expect(page.locator('.au-card canvas')).toHaveCount(0);
  await expect(page.getByText('The Last Bolt')).toHaveCount(0);
  await expect(page.getByLabel('Not rolled yet: Mythic, 1 in 1,000,000,000')).toBeVisible();

  for (let i = 0; i < 12; i++) {
    await roll.click();
    await page.waitForTimeout(520);
    if (await page.getByRole('dialog').isVisible()) await clearScenes(page);
  }
  await clearScenes(page);
  await expect(page.locator('.au-tape li').first()).not.toHaveClass(/is-none/);
  const found = await page.locator('button.au-card').count();
  expect(found).toBeGreaterThan(0);
  await expect(page.locator('.au-card.is-locked')).toHaveCount(30 - found);
  await expect(page.locator('button.au-card canvas')).toHaveCount(found);
  await shot(page, 'index');

  // Wear the first one found.
  await page.locator('button.au-card').first().click();
  await page.getByRole('button', { name: 'Wear', exact: true }).click();
  await expect(page.locator('.au-worn')).toContainText('Wearing');

  // Motes from the pulls buy the first upgrade.
  await page.getByRole('button', { name: 'Charms', exact: true }).click();
  const speed = page.getByRole('button', { name: /^Oiled Dial: level 1 for 10 motes/ });
  await expect(speed).toBeEnabled();
  await speed.click();
  await expect(page.locator('.wk-row', { hasText: 'Oiled Dial' })).toContainText('1/30');
  await shot(page, 'room');

  await page.waitForTimeout(700);
  await page.goto('/hangar/works/aura');
  await expect(page.locator('.wk-row', { hasText: 'Oiled Dial' })).toContainText('1/30');
  await expect(page.locator('.au-worn')).toContainText('Wearing');
  // The index pays the factory: the floor's boosts list it.
  await rooms(page).getByRole('button', { name: /Machines/ }).click();
  await expect(page.locator('.wk-boosts')).toContainText('Auras +');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('aura dial: a rare aura rolled while away plays its scene when the app is opened', async ({ page }) => {
  await seed(page);
  await page.goto('/');
  const scene = page.getByRole('dialog', { name: 'Aura rolled: Torii' });
  await expect(scene).toBeVisible();
  await shot(page, 'scene-wind');
  await scene.getByRole('button', { name: 'Skip', exact: true }).click();
  await expect(scene.getByRole('heading', { name: 'Torii' })).toBeVisible();
  await expect(scene).toContainText('1 in 1,500,000');
  await expect(scene).toContainText('Legendary');
  await page.waitForTimeout(900);
  await shot(page, 'scene-torii');
  // Three hours away may have rolled other rare ones too: go through whatever is queued.
  await clearScenes(page);
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // Watched scenes don't come back.
  await page.waitForTimeout(700);
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Focus mode' }).or(page.locator('.h-focus'))).toBeVisible();
  await page.waitForTimeout(800);
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // The room says what happened, and the scene can be watched again from the index.
  await page.goto('/hangar/works/aura');
  await page.getByRole('button', { name: /^Index/ }).click();
  await page.getByRole('button', { name: /^Torii, 1 in 1,500,000/ }).click();
  await shot(page, 'show');
  await page.getByRole('button', { name: 'Watch its scene' }).click();
  const again = page.getByRole('dialog', { name: 'Aura rolled: Torii' });
  await again.getByRole('button', { name: 'Skip', exact: true }).click();
  await again.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await clearScenes(page);
  await page.getByRole('button', { name: 'Wear', exact: true }).click();
  await expect(page.locator('.au-worn')).toHaveText('Wearing Torii');
  await page.waitForTimeout(600);
  await shot(page, 'stage-torii');
  // Common auras have no scene to watch.
  await page.getByRole('button', { name: /^Dust, 1 in 2/ }).click();
  await expect(page.getByRole('button', { name: 'Watch its scene' })).toHaveCount(0);
});

test('aura dial: time away is rolled when the room is opened, and incense burns by the roll', async ({ page }) => {
  await seed(page, { queue: [] });
  await page.goto('/hangar/works/aura');
  await clearScenes(page);
  const away = page.locator('.au-away');
  await expect(away).toContainText('While you were away');
  await expect(away).toContainText('1,800 rolls');
  await expect(away).toContainText('50% speed');
  await away.getByRole('button', { name: 'Back to the dial' }).click();
  await expect(away).toHaveCount(0);
  await clearScenes(page);
  const incense = page.getByRole('button', { name: /^Light incense for/ });
  await expect(incense).toBeEnabled();
  await incense.click();
  await expect(page.locator('.au-incense')).toContainText(/Burning: \d+ rolls left/);
  await page.getByRole('button', { name: 'Numbers', exact: true }).click();
  await expect(page.locator('.wk-stats')).toContainText('Rolls, all time');
  await shot(page, 'numbers');
});
