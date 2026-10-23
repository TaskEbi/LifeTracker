import { expect, test } from '@playwright/test';

test('sleep: log last night with times, bedtime bonus, edit to total only, clear and undo', async ({ page }) => {
  await page.goto('/sleep');
  await expect(page.getByText("Last night isn't logged")).toBeVisible();
  await page.getByRole('button', { name: 'Log last night' }).click();
  const sheet = page.getByRole('dialog', { name: /log sleep/ });
  await sheet.getByRole('button', { name: 'Wake 15 minutes later' }).click();
  await sheet.getByRole('button', { name: /^Save / }).click();

  const reward = page.getByRole('dialog', { name: 'What you earned' });
  await expect(reward.getByText('Night logged')).toBeVisible();
  await expect(reward.getByText(/Bedtime within 30 min/)).toBeVisible();
  await reward.getByRole('button', { name: 'OK' }).click();
  await expect(page.getByText('Last night', { exact: true })).toBeVisible();

  // Total only: times are dropped, duration kept as typed
  await page.getByRole('button', { name: 'Edit' }).first().click();
  const edit = page.getByRole('dialog', { name: /edit night/ });
  await edit.getByRole('switch', { name: /I know when I went to bed/ }).click();
  await edit.getByRole('button', { name: 'More total sleep' }).click();
  await edit.getByRole('button', { name: /^Save / }).click();
  await expect(page.locator('.s-night').getByText('total only')).toBeVisible();

  // Clear, then undo
  await page.getByRole('button', { name: 'Edit' }).first().click();
  await page.getByRole('dialog', { name: /edit night/ }).getByRole('button', { name: 'Clear' }).click();
  await expect(page.getByText("Last night isn't logged")).toBeVisible();
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByText('Last night', { exact: true })).toBeVisible();
});

test('screen time: enter a total, compare to the target, turn the target off', async ({ page }) => {
  await page.goto('/screen');
  await page.getByRole('button', { name: "Enter today's total" }).click();
  const sheet = page.getByRole('dialog', { name: /screen time/ });
  await sheet.getByRole('textbox', { name: 'Hours' }).fill('2');
  await sheet.getByRole('textbox', { name: 'Minutes' }).fill('45');
  await expect(sheet.getByText('within your target')).toBeVisible();
  await sheet.getByRole('button', { name: 'Save 2 hr 45 min' }).click();
  const reward = page.getByRole('dialog', { name: 'What you earned' });
  await expect(reward.getByText('Under your target')).toBeVisible();
  await reward.getByRole('button', { name: 'OK' }).click();
  await expect(page.locator('.i-row').filter({ hasText: 'within target' })).toBeVisible();

  await page.getByRole('switch', { name: /Use a daily target/ }).click();
  await expect(page.locator('.i-row').filter({ hasText: 'within target' })).toHaveCount(0);
});
