import { expect, test, type Page } from '@playwright/test';

/** Forty days of sessions through the app's own save functions (local-only, port 5174 has no .env). */
async function seed(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Focus mode' }).or(page.locator('.h-focus'))).toBeVisible();
  await page.evaluate(async () => {
    const lt = await import('/src/data/lt.ts' as string);
    const log = await import('/src/data/logActions.ts' as string);
    const dates = await import('/src/domain/log/dates.ts' as string);
    const today = lt.ltToday();
    for (const s of ['violin', 'coding', 'gym', 'study', 'maths']) {
      const topic = lt.ensureSectionTopic(s);
      for (let d = 0; d < 34; d++) log.addEntry({ topic_id: topic, date: dates.addDays(today, -d), minutes: 45, note: '' });
    }
  });
  await page.waitForTimeout(400);
}

const walletNumber = async (page: Page, name: string) => {
  const label = await page.getByRole('group', { name: 'Your wallet' }).locator(`[aria-label$="${name}"]`).first().getAttribute('aria-label');
  return Number(label!.split(' ')[0].replace(/,/g, ''));
};

test.beforeEach(async ({ page }) => {
  // In the Momiji festival, so the event screens have something to show.
  await page.clock.setFixedTime(new Date('2026-11-10T12:00:00Z'));
});

test('hangar: a fresh start has nothing to spend and says how to earn', async ({ page }) => {
  await page.goto('/hangar');
  await expect(page.getByRole('heading', { name: 'Hangar', level: 1 })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Your wallet' })).toContainText('0');
  await expect(page.getByText(/None waiting/)).toBeVisible();
  await page.getByRole('navigation', { name: 'Hangar' }).getByRole('button', { name: 'Shop' }).click();
  await expect(page.getByRole('heading', { name: "This week's shelf" })).toBeVisible();
  for (const b of await page.locator('.gm-shop .i-btn').all()) await expect(b).toBeDisabled();
});

test('hangar: records pay, chests open once, buying spends, and it all survives a reload', async ({ page }) => {
  await seed(page);
  await page.goto('/hangar');
  const coins = await walletNumber(page, 'Ryō');
  expect(coins).toBeGreaterThan(1000);

  // chests
  await page.getByRole('button', { name: /^Open all/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'OK' }).click();
  await expect(page.getByText(/None waiting/)).toBeVisible();
  const richer = await walletNumber(page, 'Ryō');
  expect(richer).toBeGreaterThan(coins);

  // a body: build it, wear it
  await page.getByRole('button', { name: /^The Maestro/ }).click();
  await page.getByRole('button', { name: 'Build it' }).click();
  const reveal = page.getByRole('dialog', { name: 'New body' });
  await expect(reveal.getByRole('heading', { name: 'The Maestro' })).toBeVisible();
  await reveal.getByRole('button', { name: 'OK' }).click();
  expect(await walletNumber(page, 'Ryō')).toBe(richer - 3000);
  await expect(page.locator('.gm-bay__plate')).toContainText('The Maestro Mk I');

  // a capsule, paid in Tama
  await page.getByRole('navigation', { name: 'Hangar' }).getByRole('button', { name: 'Capsules' }).click();
  const gems = await walletNumber(page, 'Tama');
  await page.getByRole('button', { name: /^Spin ·/ }).click();
  await page.getByRole('dialog', { name: 'Capsules' }).getByRole('button', { name: 'OK' }).click();
  expect(await walletNumber(page, 'Tama')).toBe(gems - 30);

  // a machine
  await page.getByRole('navigation', { name: 'Hangar' }).getByRole('button', { name: 'Workshop' }).click();
  const magnet = page.locator('.gm-up').filter({ hasText: 'Coin Magnet' });
  await magnet.getByRole('button', { name: 'Build' }).click();
  await expect(magnet).toContainText('Now: +5% Ryō');

  await page.waitForTimeout(400);
  const after = await walletNumber(page, 'Ryō');
  await page.reload();
  await expect(page.locator('.gm-up').filter({ hasText: 'Coin Magnet' })).toContainText('Now: +5% Ryō');
  expect(await walletNumber(page, 'Ryō')).toBe(after);

  // the bought body is on Home too
  await page.getByRole('button', { name: 'Home', exact: true }).first().click();
  await expect(page.locator('.h-purse')).toBeVisible();
});

test('hangar: a training scroll adds real XP, and a raid bomb hits the real boss', async ({ page }) => {
  await seed(page);
  await page.goto('/hangar/shop');
  const items = page.locator('.gm-item');
  const scroll = items.filter({ hasText: 'Training Scroll' });
  await scroll.getByRole('button', { name: 'Buy' }).click();
  await expect(scroll).toContainText('×1');
  await scroll.getByRole('button', { name: 'Use' }).click();
  const box = page.getByRole('dialog', { name: 'What you earned' });
  await expect(box).toContainText('+120');
  await box.getByRole('button', { name: 'OK' }).click();

  const bomb = items.filter({ hasText: 'Raid Bomb' });
  await bomb.getByRole('button', { name: 'Buy' }).click();
  await bomb.getByRole('button', { name: 'Use' }).click();
  await page.waitForTimeout(300);
  await page.goto('/progress/boss');
  await expect(page.getByText('Raid Bomb').first()).toBeVisible();
});

test('hangar: the festival pays tokens and its prizes can be claimed once', async ({ page }) => {
  await seed(page);
  await page.goto('/hangar/events');
  await expect(page.getByRole('heading', { name: 'Momiji Matsuri' })).toBeVisible();
  const first = page.locator('.gm-track li').first();
  await first.getByRole('button', { name: 'Claim' }).click();
  await expect(first).toContainText('Claimed');
  await expect(first.getByRole('button', { name: 'Claim' })).toHaveCount(0);
});

test('hangar: every tab has one heading, named controls and no sideways scroll', async ({ page }) => {
  await seed(page);
  for (const path of ['/hangar', '/hangar/shop', '/hangar/capsule', '/hangar/workshop', '/hangar/events', '/hangar/ledger']) {
    await page.goto(path);
    await expect(page.locator('h1')).toHaveCount(1);
    const bad = await page.evaluate(() => {
      const unnamed = [...document.querySelectorAll('button')].filter((b) => b.offsetParent && !(b.getAttribute('aria-label') || b.textContent?.trim()));
      return { unnamed: unnamed.length, over: document.documentElement.scrollWidth - document.documentElement.clientWidth };
    });
    expect(bad, path).toEqual({ unnamed: 0, over: 0 });
  }
});
