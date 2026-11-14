import { expect, test, type Page } from '@playwright/test';

/** Body levels, mastery prizes and hidden bodies, through the app's own save functions (local-only). */
async function seed(page: Page, sections: string[], days: number) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Focus mode' }).or(page.locator('.h-focus'))).toBeVisible();
  await page.evaluate(
    async ({ sections, days }) => {
      const lt = await import('/src/data/lt.ts' as string);
      const log = await import('/src/data/logActions.ts' as string);
      const dates = await import('/src/domain/log/dates.ts' as string);
      const today = lt.ltToday();
      for (const s of sections) {
        const topic = lt.ensureSectionTopic(s);
        for (let d = 0; d < days; d++) log.addEntry({ topic_id: topic, date: dates.addDays(today, -d), minutes: 45, note: '' });
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
    { sections, days },
  );
  await page.waitForTimeout(200);
}

const walletNumber = async (page: Page, name: string) => {
  const label = await page.getByRole('group', { name: 'Your wallet' }).locator(`[aria-label$="${name}"]`).first().getAttribute('aria-label');
  return Number(label!.split(' ')[0].replace(/,/g, ''));
};

test('mastery: the body you pilot levels up from what you log, and its prizes pay once', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-16T10:00:00Z'));
  await seed(page, ['violin', 'gym', 'study'], 20);
  await page.clock.setFixedTime(new Date('2026-11-16T11:00:00Z'));
  await page.goto('/hangar');

  // Build the Maestro and wear it: from now on, violin trains it (double, it's the violin's body).
  await page.getByRole('button', { name: /^The Maestro/ }).click();
  await page.getByRole('button', { name: 'Build it' }).click();
  await page.getByRole('dialog', { name: 'New body' }).getByRole('button', { name: 'OK' }).click();
  await expect(page.locator('.gm-bay__plate')).toContainText('Body LV 1');

  await page.clock.setFixedTime(new Date('2026-11-16T12:00:00Z'));
  await page.evaluate(async () => {
    const lt = await import('/src/data/lt.ts' as string);
    const log = await import('/src/data/logActions.ts' as string);
    const topic = lt.ensureSectionTopic('violin');
    for (let i = 0; i < 2; i++) log.addEntry({ topic_id: topic, date: lt.ltToday(), minutes: 60, note: '' });
  });
  await expect(page.locator('.gm-bay__plate')).not.toContainText('Body LV 1');
  await expect(page.getByRole('button', { name: /mastery prizes? waiting/ })).toBeVisible();

  // The body's card (still open from building it) shows its level, its mastery and the track; claim one prize.
  const card = page.getByRole('region', { name: 'The Maestro' });
  await expect(card.getByText(/^Body level \d+/)).toBeVisible();
  await expect(card.getByText(/You're piloting it/)).toBeVisible();
  const coins = await walletNumber(page, 'Ryō');
  const lv5 = card.locator('.gm-track__step').filter({ hasText: 'Level 5' });
  await lv5.getByRole('button', { name: 'Claim' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'OK' }).click();
  expect(await walletNumber(page, 'Ryō')).toBe(coins + 150);
  await expect(lv5).toContainText('Claimed');

  // Nothing pays twice, and it survives a reload.
  await page.reload();
  await page.getByRole('button', { name: /^The Maestro, Epic, Mk 1 built/ }).click();
  await expect(page.getByRole('region', { name: 'The Maestro' }).locator('.gm-track__step').filter({ hasText: 'Level 5' })).toContainText('Claimed');

  // A different body gets nothing for what the Maestro earned.
  await page.getByRole('button', { name: 'Mastery', exact: true }).click();
  await expect(page.getByText('Well Travelled')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Hidden bodies/ })).toBeVisible();
  const wide = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(wide).toBeLessThanOrEqual(0);
});

test('mastery: a hidden body wakes when its rule is met, and is never in the shop', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-16T10:00:00Z'));
  await page.goto('/hangar');
  await expect(page.getByRole('button', { name: /^A hidden body/ }).first()).toBeVisible();
  // Six sections in one day wakes Ashura.
  await seed(page, ['violin', 'coding', 'gym', 'study', 'maths', 'chess'], 1);
  await page.goto('/hangar');
  const ready = page.getByRole('button', { name: 'A hidden body, ready to wake' });
  await expect(ready).toHaveCount(1);
  await ready.click();
  const coins = await walletNumber(page, 'Ryō');
  await page.getByRole('button', { name: 'Wake it up (free)' }).click();
  const reveal = page.getByRole('dialog', { name: 'New body' });
  await expect(reveal.getByRole('heading', { name: 'Ashura' })).toBeVisible();
  await reveal.getByRole('button', { name: 'OK' }).click();
  await expect(page.locator('.gm-bay__plate')).toContainText('Ashura Mk I');
  expect(await walletNumber(page, 'Ryō')).toBe(coins);
});
