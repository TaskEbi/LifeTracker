import { expect, test, type Page } from '@playwright/test';

async function logRun(page: Page, km: string) {
  await page.getByRole('button', { name: /Log a session/ }).click();
  const sheet = page.getByRole('dialog', { name: 'CH03 · log sport' });
  await sheet.getByRole('button', { name: '45', exact: true }).click();
  await sheet.getByLabel('Distance in km').fill(km);
  await sheet.getByRole('button', { name: 'Save' }).click();
  return page.getByRole('dialog', { name: 'What you earned' });
}

test('moments: a longer, faster run is listed as records in the reward box, once', async ({ page }) => {
  await page.goto('/sports');
  // The first run has nothing to beat.
  let reward = await logRun(page, '8');
  await expect(reward).toBeVisible();
  await expect(reward.getByText(/New record|Longest run/)).toHaveCount(0);
  await reward.getByRole('button', { name: 'OK' }).click();

  reward = await logRun(page, '12');
  await expect(reward.getByText('Longest run · 12 km (was 8)')).toBeVisible();
  await expect(reward.getByText('New record · 5K pace 3:45 /km (was 5:38 /km)')).toBeVisible();
  await reward.getByRole('button', { name: 'OK' }).click();

  // A shorter, slower run beats nothing.
  reward = await logRun(page, '6');
  await expect(reward).toBeVisible();
  await expect(reward.getByText(/New record|Longest run/)).toHaveCount(0);
  await reward.getByRole('button', { name: 'OK' }).click();
});
