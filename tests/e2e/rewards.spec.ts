import { expect, test, type Page } from '@playwright/test';

/** The Rewards tab (Hangar Pass, emblem prizes) and True Silver skins, through the app's own save functions (local-only). */
async function log(page: Page, sections: string[], days: number, minutes = 45, perDay = 1) {
  await page.evaluate(
    async ({ sections, days, minutes, perDay }) => {
      const lt = await import('/src/data/lt.ts' as string);
      const logA = await import('/src/data/logActions.ts' as string);
      const dates = await import('/src/domain/log/dates.ts' as string);
      const today = lt.ltToday();
      for (const s of sections) {
        const topic = lt.ensureSectionTopic(s);
        for (let d = 0; d < days; d++) for (let i = 0; i < perDay; i++) logA.addEntry({ topic_id: topic, date: dates.addDays(today, -d), minutes, note: '' });
      }
      const store = await import('/src/data/store.ts' as string);
      for (let i = 0; i < 100; i++) {
        const db = store.currentSession()?.db;
        if (!db) break;
        const entries = await db.getAll('log_entries');
        if (entries.length >= store.data.get().log_entries.size) break;
        await new Promise((r) => setTimeout(r, 100));
      }
    },
    { sections, days, minutes, perDay },
  );
  await page.waitForTimeout(200);
}

const walletNumber = async (page: Page, name: string) => {
  const label = await page.getByRole('group', { name: 'Your wallet' }).locator(`[aria-label$="${name}"]`).first().getAttribute('aria-label');
  return Number(label!.split(' ')[0].replace(/,/g, ''));
};

test('rewards: pass tiers and emblem prizes are claimed once, and emblem XP raises the level', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-20T10:00:00Z'));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Focus mode' }).or(page.locator('.h-focus'))).toBeVisible();
  await log(page, ['violin', 'gym', 'study'], 15);
  await page.goto('/hangar');
  await expect(page.getByRole('button', { name: /rewards? to claim/ })).toBeVisible();
  await page.getByRole('button', { name: /rewards? to claim/ }).click();
  await expect(page).toHaveURL(/\/hangar\/rewards/);

  const pass = page.getByRole('region', { name: /November 2026 Hangar Pass/ });
  await expect(pass).toContainText(/Tier [1-9]\d? of 30/);
  const coins = await walletNumber(page, 'Ryō');
  await pass.getByRole('button', { name: /^Tier 1: .*ready to claim/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'OK' }).click();
  expect(await walletNumber(page, 'Ryō')).toBe(coins + 210);
  await expect(pass.getByRole('button', { name: /^Tier 1: .*claimed$/ })).toBeDisabled();

  // Emblem prizes: claim them all; their XP shows up in the overall level's XP.
  const total = () => page.evaluate(async () => (await import('/src/data/lt.ts' as string)).progressOf((await import('/src/data/store.ts' as string)).data.get(), (await import('/src/data/lt.ts' as string)).ltToday()).total as number);
  const before = await total();
  const prizes = page.getByRole('region', { name: 'Emblem prizes' });
  await expect(prizes).toContainText('waiting');
  const claimAll = prizes.getByRole('button', { name: /^Claim all/ });
  if (await claimAll.isVisible()) await claimAll.click();
  else await prizes.getByRole('button', { name: 'Claim' }).first().click();
  await expect(page.getByRole('dialog')).toContainText(/XP/);
  await page.getByRole('dialog').getByRole('button', { name: 'OK' }).click();
  expect(await total()).toBeGreaterThan(before);
  // Their XP can level you up and unlock more emblems, with prizes of their own: claim until none are left.
  for (let i = 0; i < 6 && !(await prizes.textContent())?.includes('all claimed'); i++) {
    await prizes.getByRole('button', { name: /^Claim/ }).first().click();
    await page.getByRole('dialog').getByRole('button', { name: 'OK' }).click();
  }
  await expect(prizes).toContainText('all claimed');

  // Nothing pays twice, after a reload either.
  await page.reload();
  await expect(page.getByRole('region', { name: 'Emblem prizes' })).toContainText('all claimed');
  await expect(page.getByRole('region', { name: /November 2026 Hangar Pass/ }).getByRole('button', { name: /^Tier 1: .*claimed$/ })).toBeDisabled();
  const wide = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(wide).toBeLessThanOrEqual(0);
});

test('rewards: a levelled body can be cast in True Silver and wears it', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-16T10:00:00Z'));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Focus mode' }).or(page.locator('.h-focus'))).toBeVisible();
  await log(page, ['violin', 'gym', 'study'], 20);
  await page.clock.setFixedTime(new Date('2026-11-16T11:00:00Z'));
  await page.goto('/hangar');
  await page.getByRole('button', { name: /^The Maestro/ }).click();
  await page.getByRole('button', { name: 'Build it' }).click();
  await page.getByRole('dialog', { name: 'New body' }).getByRole('button', { name: 'OK' }).click();
  await page.clock.setFixedTime(new Date('2026-11-16T12:00:00Z'));
  await log(page, ['violin'], 4, 60, 6);
  await expect(page.getByRole('region', { name: 'The Maestro' }).getByText(/^Body level (1[2-9]|[2-3]\d)/).first()).toBeVisible();

  const card = page.getByRole('region', { name: 'The Maestro' });
  await expect(card.getByText('True skins')).toBeVisible();
  // Pay for it from this month's pass and the emblem prizes (claimed until none are left).
  await page.evaluate(async () => {
    const st = await import('/src/features/game/store.ts' as string);
    for (let i = 0; i < 6; i++) if (!st.claimAch() && !st.claimPass()) break;
  });
  await expect.poll(() => walletNumber(page, 'Ryō')).toBeGreaterThan(2500);
  const coins = await walletNumber(page, 'Ryō');
  await card.getByRole('button', { name: 'Cast it' }).first().click();
  await expect(page.getByRole('dialog')).toContainText('True Silver The Maestro');
  await page.getByRole('dialog').getByRole('button', { name: 'OK' }).click();
  expect(await walletNumber(page, 'Ryō')).toBe(coins - 2500);
  await expect(page.locator('.gm-bay__bot svg.rb--true-silver')).toBeVisible();

  // Taking it off and putting it back on.
  await card.getByRole('button', { name: 'Wearing' }).click();
  await expect(page.locator('.gm-bay__bot svg.rb--true-silver')).toHaveCount(0);
  await card.getByRole('button', { name: 'Wear', exact: true }).last().click();
  await expect(page.locator('.gm-bay__bot svg.rb--true-silver')).toBeVisible();
  await page.waitForTimeout(600);
  await page.reload();
  await expect(page.locator('.gm-bay__bot svg.rb--true-silver')).toBeVisible();
});
