import { expect, test } from '@playwright/test';

test('gym: log a session by muscle group, see the statistics, edit it, saved once', async ({ page }) => {
  await page.goto('/gym');
  await expect(page.getByText('Counts per group appear once a session has muscle groups.')).toBeVisible();
  await expect(page.getByRole('button', { name: /Start|template/i })).toHaveCount(0);

  await page.getByRole('button', { name: 'Log gym' }).first().click();
  const sheet = page.getByRole('dialog', { name: 'Log gym' });
  // A save needs at least one group
  await sheet.getByRole('button', { name: 'Save' }).click();
  await expect(sheet.getByRole('alert')).toContainText('Pick at least one muscle group');

  const groups = sheet.getByRole('group', { name: 'Muscle groups' });
  await groups.getByRole('button', { name: 'Chest' }).click();
  await groups.getByRole('button', { name: 'Triceps' }).click();
  await sheet.getByRole('group', { name: 'Effort (1 easy – 10 max)' }).getByRole('button', { name: '7' }).click();
  await sheet.getByRole('switch', { name: /Any pain/ }).click();
  await sheet.getByLabel('Pain details').fill('Left shoulder on the way down');
  await sheet.getByRole('button', { name: 'Save' }).click();

  const reward = page.getByRole('dialog', { name: 'What you earned' });
  await expect(reward.getByText('Chest · Triceps completed')).toBeVisible();
  await expect(reward.getByText('Check-in recorded')).toBeVisible();
  await expect(reward.getByText(/Pain noted/)).toBeVisible();
  await reward.getByRole('button', { name: 'OK' }).click();

  // The statistics: chest and triceps hit once, back never
  const table = page.getByRole('table', { name: 'Sessions per muscle group' });
  const row = (name: string) => table.getByRole('row').filter({ has: page.getByRole('cell', { name, exact: true }) });
  await expect(row('Chest')).toContainText('today');
  await expect(row('Chest').getByRole('cell').nth(2)).toHaveText('1');
  await expect(row('Triceps').getByRole('cell').nth(3)).toHaveText('1');
  await expect(row('Back')).toContainText('never');

  const history = page.locator('.i-row').filter({ hasText: 'pain noted: Left shoulder' });
  await expect(history).toHaveCount(1);
  await expect(history).toContainText('Chest, Triceps');

  // Edit: add Back, leave the rest
  await history.click();
  const edit = page.getByRole('dialog', { name: 'Edit gym session' });
  await edit.getByRole('group', { name: 'Muscle groups' }).getByRole('button', { name: 'Back' }).click();
  await edit.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('dialog', { name: 'What you earned' })).toHaveCount(0);
  await expect(page.locator('.i-row').filter({ hasText: 'Chest · Back · Triceps' })).toHaveCount(1);
  await expect(row('Back').getByRole('cell').nth(3)).toHaveText('1');

  // Still one session after a reload
  await page.waitForTimeout(300);
  await page.reload();
  await expect(page.locator('.i-row').filter({ hasText: 'Chest · Back · Triceps' })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Log gym' }).first()).toBeVisible();
});
