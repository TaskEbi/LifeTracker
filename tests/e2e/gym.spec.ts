import { expect, test } from '@playwright/test';

test('gym: template session survives a reload, check-in with pain, saved once', async ({ page }) => {
  await page.goto('/gym');
  await page.getByRole('button', { name: 'Add 3 starter templates' }).click();
  await page.locator('.i-row').filter({ hasText: 'Lower A' }).getByRole('button', { name: 'Start' }).click();
  await expect(page.getByRole('heading', { name: 'Lower A' })).toBeVisible();

  await page.getByRole('button', { name: 'Goblet squat set 1 done' }).click();
  await expect(page.getByRole('timer')).toBeVisible();
  await page.getByRole('button', { name: 'Skip' }).click();
  await page.getByRole('button', { name: 'Set 2 more weight' }).first().click();
  await page.getByRole('button', { name: 'Goblet squat set 2 done' }).click();

  // Swap the second exercise for today
  await page.getByRole('button', { name: 'Swap' }).nth(1).click();
  await page.getByRole('dialog', { name: 'Swap exercise' }).getByRole('button', { name: /Single-leg RDL/ }).click();
  await expect(page.getByText('Instead of Romanian deadlift')).toBeVisible();

  // A reload keeps the session (it lives on the device until finished)
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Lower A' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Goblet squat set 2 done' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.g-set').nth(1)).toContainText('26.5');

  await page.getByRole('button', { name: 'Finish session' }).click();
  const check = page.getByRole('dialog', { name: 'Check-in' });
  await check.getByRole('group', { name: /Effort/ }).getByRole('button', { name: '7' }).click();
  await check.getByRole('switch', { name: /Any pain/ }).click();
  await check.getByLabel('Pain details').fill('Left shin after split squats');
  await check.getByRole('button', { name: 'Save session' }).click();

  const reward = page.getByRole('dialog', { name: 'What you earned' });
  await expect(reward.getByText('Lower A completed')).toBeVisible();
  await expect(reward.getByText('2 sets done (capped at the plan)')).toBeVisible();
  await expect(reward.getByText('Check-in recorded')).toBeVisible();
  await expect(reward.getByText(/Pain noted/)).toBeVisible();
  await reward.getByRole('button', { name: 'OK' }).click();

  const history = page.locator('.i-row').filter({ hasText: 'pain noted: Left shin' });
  await expect(history).toHaveCount(1);
  await page.reload();
  await expect(page.locator('.i-row').filter({ hasText: 'pain noted: Left shin' })).toHaveCount(1);
});
