import { expect, test } from '@playwright/test';

test('progress: a rest day keeps the streak and earns nothing', async ({ page }) => {
  await page.goto('/progress');
  await expect(page.getByRole('heading', { name: 'Progress', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Take a rest day' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'OK' }).click();
  await expect(page.getByText('Today is a rest day.')).toBeVisible();
  await expect(page.getByText(/^Streak · today counted/)).toBeVisible();
  await expect(page.getByText('No XP here yet.')).toBeVisible();
});

test('activity: any Daily Log entry can be found, edited, deleted and restored', async ({ page }) => {
  await page.goto('/coding');
  await page.getByRole('button', { name: /Log a session · raise a gate/ }).click();
  await page.getByRole('dialog').getByLabel('What clicked').fill('Segment tree lazy');
  await page.getByRole('dialog').getByRole('button', { name: /^Save/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'OK' }).click();

  await page.goto('/log');
  await page.getByLabel('Search').fill('segment');
  const row = page.locator('.i-row').filter({ hasText: 'Segment tree lazy' });
  await expect(row).toContainText('Competitive programming');
  await row.click();
  const sheet = page.getByRole('dialog', { name: 'Edit entry' });
  await sheet.getByRole('button', { name: '45', exact: true }).click();
  await sheet.getByRole('button', { name: 'Save' }).click();
  await expect(row).toContainText('45');

  await row.click();
  await page.getByRole('dialog', { name: 'Edit entry' }).getByRole('button', { name: 'Delete' }).click();
  await expect(row).toHaveCount(0);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(row).toHaveCount(1);
});

test('settings: local mode says nothing is sent, colour themes apply and stay', async ({ page }) => {
  await page.goto('/settings');
  await expect(page.getByText('This browser only')).toBeVisible();
  await expect(page.getByText(/Nothing here is sent anywhere/)).toBeVisible();
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-look', 'shonen');
  const themes = page.getByRole('group', { name: 'Theme · this device' });
  expect(await themes.getByRole('button').count()).toBeGreaterThanOrEqual(11);
  await themes.getByRole('button', { name: /^Manga paper/ }).click();
  await expect(html).toHaveAttribute('data-theme', 'light');
  await themes.getByRole('button', { name: /^Cyber/ }).click();
  await expect(html).toHaveAttribute('data-look', 'cyber');
  await expect(html).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(html).toHaveAttribute('data-look', 'cyber');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--acc2').trim())).toBe('#2ef2ff');
});

test('game: Progress is one tap away on a phone, with quests and achievements', async ({ page }) => {
  await page.goto('/violin');
  await page.getByRole('navigation', { name: 'Commands' }).getByRole('button', { name: /^LV \d+/ }).click();
  await expect(page).toHaveURL(/\/progress$/);
  await expect(page.getByRole('heading', { name: 'Progress', level: 1 })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Forms' }).getByRole('listitem')).toHaveCount(20);

  const tabs = page.getByRole('navigation', { name: 'Progress sections' });
  await tabs.getByRole('button', { name: /Quests/ }).click();
  await expect(page).toHaveURL(/\/progress\/quests$/);
  for (const period of ['Daily', 'Weekly', 'Monthly']) {
    await expect(page.getByRole('region', { name: `${period} quests` }).getByRole('progressbar')).toHaveCount(3);
  }

  await tabs.getByRole('button', { name: /Emblems/ }).click();
  await expect(page).toHaveURL(/\/progress\/achievements$/);
  const badges = page.getByRole('list', { name: 'Achievements' }).getByRole('listitem');
  expect(await badges.count()).toBeGreaterThanOrEqual(30);
  await page.getByRole('group', { name: 'Show' }).getByRole('button', { name: /^Unlocked/ }).click();
  await expect(page.getByText('Nothing unlocked yet.')).toBeVisible();
});

const ROUTES = ['/', '/violin', '/coding', '/sports', '/gym', '/study', '/chess', '/sleep', '/screen', '/calendar', '/tasks', '/progress', '/progress/quests', '/progress/achievements', '/settings', '/log'];

test('every screen: one h1, every control named, no sideways scroll', async ({ page }) => {
  await page.route('https://api.chess.com/**', (r) => r.fulfill({ status: 404, body: '{}' }));
  for (const path of ROUTES) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    if (path !== '/') await expect(page.locator('main h1'), path).toHaveCount(1);
    const unnamed = await page.evaluate(() =>
      [...document.querySelectorAll('button, a[href], input:not([type=hidden]), select, textarea, [role=button], [role=switch]')]
        .filter((el) => {
          const h = el as HTMLElement;
          if (h.hidden || h.closest('[hidden],[aria-hidden=true]') || h.offsetParent === null) return false;
          const label = h.getAttribute('aria-label') || h.getAttribute('aria-labelledby') || h.getAttribute('title') || (h as HTMLInputElement).labels?.[0]?.textContent || h.getAttribute('placeholder') || h.textContent;
          return !label?.trim();
        })
        .map((el) => el.outerHTML.slice(0, 120)),
    );
    expect(unnamed, path).toEqual([]);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${path} scrolls sideways`).toBeLessThanOrEqual(0);
  }
});
