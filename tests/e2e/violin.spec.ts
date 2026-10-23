import { expect, test } from '@playwright/test';

test('violin: add a piece, log, see the reward, edit, delete with undo, persist', async ({ page }) => {
  await page.goto('/violin');
  await expect(page.getByRole('heading', { name: 'Violin' })).toBeVisible();
  await expect(page.getByText('No sessions yet.')).toBeVisible();

  // A piece on the stand
  await page.getByRole('button', { name: '+ Add' }).click();
  await page.getByLabel('Title').fill('Partita No. 2 — Allemanda');
  await page.getByLabel('Composer').fill('Bach');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('button', { name: /Bach — Partita No. 2/ })).toBeVisible();

  // Log a lesson: type → duration → pieces → save
  await page.getByRole('button', { name: 'Log practice' }).click();
  await page.getByRole('button', { name: /^Lesson/ }).click();
  await expect(page.getByText('min total')).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Bach · Partita No. 2 — Allemanda' }).click();
  await page.getByLabel('Note · optional').fill('Shifting in bar 37');
  await page.getByRole('button', { name: 'Save 45 min' }).click();

  // The reward shows what the records now add up to
  const reward = page.getByRole('dialog', { name: 'What you earned' });
  await expect(reward).toBeVisible();
  await expect(reward.getByText('45 min logged')).toBeVisible();
  await expect(reward.getByText('Session logged')).toBeVisible();
  await reward.getByRole('button', { name: 'OK' }).click();

  const log = page.locator('.i-pnl').filter({ hasText: 'Shifting in bar 37' });
  await expect(log.getByText('45m')).toBeVisible();
  const xpBefore = await page.locator('.i-chhead__lv').innerText();

  // Edit: back to the duration step, +5
  await log.getByRole('button', { name: /Edit Lesson/ }).click();
  await page.getByRole('button', { name: 'Back' }).click();
  await page.getByRole('button', { name: '5 minutes more' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Save changes' }).click();
  const r2 = page.getByRole('dialog', { name: 'What you earned' });
  if (await r2.isVisible()) await r2.getByRole('button', { name: 'OK' }).click();
  await expect(log.getByText('50m', { exact: true })).toBeVisible();

  // Delete with undo
  await log.getByRole('button', { name: /Delete session/ }).click();
  await expect(page.getByText('No sessions yet.')).toBeVisible();
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByText('50m', { exact: true })).toBeVisible();

  // Survives a reload, and XP is the same derived number (not awarded again)
  const xpAfterEdit = await page.locator('.i-chhead__lv').innerText();
  await page.reload();
  await expect(page.getByText('50m', { exact: true })).toBeVisible();
  await expect(page.getByText('50m', { exact: true })).toBeVisible();
  expect(await page.locator('.i-chhead__lv').innerText()).toEqual(xpAfterEdit);
  expect(xpBefore).not.toEqual('');
});
