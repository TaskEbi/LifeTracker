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

test('settings: local mode says nothing is sent, theme applies', async ({ page }) => {
  await page.goto('/settings');
  await expect(page.getByText('This browser only')).toBeVisible();
  await expect(page.getByText(/Nothing here is sent anywhere/)).toBeVisible();
  await page.getByRole('group', { name: 'Theme · this device' }).getByRole('button', { name: 'Dark' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

const ROUTES = ['/', '/violin', '/coding', '/sports', '/gym', '/study', '/chess', '/sleep', '/screen', '/calendar', '/tasks', '/progress', '/settings', '/log'];

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
