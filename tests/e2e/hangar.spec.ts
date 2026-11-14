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
    // 170 sessions take a while to reach IndexedDB: wait for them before anything reloads the page.
    const store = await import('/src/data/store.ts' as string);
    for (let i = 0; i < 100; i++) {
      const db = store.currentSession()?.db;
      if (!db) break;
      const [entries, topics] = await Promise.all([db.getAll('log_entries'), db.getAll('log_topics')]);
      if (entries.length >= store.data.get().log_entries.size && topics.length >= store.data.get().log_topics.size) break;
      await new Promise((r) => setTimeout(r, 100));
    }
  });
  await page.waitForTimeout(200);
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
  await page.getByRole('navigation', { name: 'Hangar' }).getByRole('button', { name: 'Shop', exact: true }).click();
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
  await expect(page.getByRole('region', { name: 'Your character' })).toBeVisible();
  // and the purse is on Home's Arena page
  await page.getByRole('navigation', { name: 'Home pages' }).getByRole('button', { name: /Arena/ }).click();
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

test('hangar: the shop street stamps, ranks, haggles, delivers and opens after dark', async ({ page }) => {
  // 20:00 in Singapore (the default Daily Log zone): the night market is open.
  await seed(page);
  await page.goto('/hangar/shop');
  const counter = page.getByRole('region', { name: "Mameda's counter" });
  await expect(counter.locator('.gm-counter__talk p')).not.toBeEmpty();
  await expect(counter).toContainText('First-timer');
  await expect(page.locator('.gm-stamps__row li.is-on')).toHaveCount(0);
  await expect(page.locator('.gm-haggle')).toHaveCount(0);

  // a purchase stamps the card and Mameda says thanks
  const before = await counter.locator('.gm-counter__talk p').textContent();
  await page.locator('.gm-item').filter({ hasText: 'Training Scroll' }).getByRole('button', { name: 'Buy' }).click();
  await expect(page.locator('.gm-stamps__row li.is-on')).toHaveCount(1);
  await expect(counter).toContainText('Stamped today');
  await expect(counter.locator('.gm-counter__talk p')).not.toHaveText(before ?? '');

  // a lucky bag: paid once, opened at once, sold out for the week
  await page.locator('.gm-bag').getByRole('button', { name: 'Buy' }).click();
  const bag = page.getByRole('dialog', { name: 'Fukubukuro' });
  await expect(bag.locator('.gm-rv__loot li').first()).toBeVisible();
  await bag.getByRole('button', { name: 'OK' }).click();
  await expect(page.locator('.gm-bag')).toContainText('Sold out');
  await expect(page.locator('.gm-stamps__row li.is-on')).toHaveCount(1);

  // 200 trust: a familiar face, who may haggle once a day
  await expect(counter).toContainText('Familiar face');
  await page.locator('.gm-haggle').first().click();
  const hag = page.getByRole('dialog', { name: 'Haggle' });
  await hag.getByRole('button', { name: 'Stop!' }).click();
  await expect(hag.locator('.gm-hag__res')).toContainText(/off|Full price/);
  await hag.getByRole('button', { name: 'Walk away' }).click();
  await expect(hag).toHaveCount(0);

  // requests take materials and pay
  await page.getByRole('navigation', { name: 'Shop' }).getByRole('button', { name: /Requests/ }).click();
  await expect(page.getByRole('heading', { name: "Today's requests" })).toBeVisible();
  const coins = await walletNumber(page, 'Ryō');
  const req = page.locator('.gm-req').filter({ has: page.locator('button:not([disabled])', { hasText: 'Deliver' }) }).first();
  await req.getByRole('button', { name: 'Deliver' }).click();
  await expect(page.locator('.gm-req.is-done')).toHaveCount(1);
  expect(await walletNumber(page, 'Ryō')).toBeGreaterThan(coins);

  // the night market: a strongbox, once a night, lands in the Hangar
  await page.getByRole('navigation', { name: 'Shop' }).getByRole('button', { name: /Night market/ }).click();
  await expect(page.getByText(/Open till 05:00/)).toBeVisible();
  const box = page.locator('.gm-item').filter({ hasText: 'Shady strongbox' });
  await box.getByRole('button', { name: 'Buy' }).click();
  await expect(box.getByRole('button', { name: 'Sold out' })).toBeDisabled();

  // the wishlist shows on the bay
  await page.getByRole('navigation', { name: 'Shop' }).getByRole('button', { name: /Catalogue/ }).click();
  await page.getByRole('button', { name: /^Save up for/ }).first().click();
  await page.waitForTimeout(300);
  await page.reload();
  await page.getByRole('navigation', { name: 'Hangar' }).getByRole('button', { name: 'Hangar' }).click();
  await expect(page.getByRole('region', { name: 'Saving up' })).toBeVisible();
  await page.getByRole('group', { name: 'What to change' }).getByRole('button', { name: 'Sets' }).click();
  await expect(page.locator('.gm-set')).toHaveCount(18);
});

test('hangar: every tab has one heading, named controls and no sideways scroll', async ({ page }) => {
  await seed(page);
  for (const path of ['/hangar', '/hangar/shop', '/hangar/shop/requests', '/hangar/shop/night', '/hangar/shop/catalogue', '/hangar/capsule', '/hangar/works', '/hangar/works/counter', '/hangar/workshop', '/hangar/events', '/hangar/ledger']) {
    await page.goto(path);
    await expect(page.locator('h1')).toHaveCount(1);
    const bad = await page.evaluate(() => {
      const unnamed = [...document.querySelectorAll('button')].filter((b) => b.offsetParent && !(b.getAttribute('aria-label') || b.textContent?.trim()));
      return { unnamed: unnamed.length, over: document.documentElement.scrollWidth - document.documentElement.clientWidth };
    });
    expect(bad, path).toEqual({ unnamed: 0, over: 0 });
  }
});
