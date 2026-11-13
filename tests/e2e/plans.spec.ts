import { expect, test } from '@playwright/test';

test('marathon plan: start it, see today’s run, log it, see it done; the Gym page has no plan', async ({ page }) => {
  // Tuesday of week 1 of a plan starting Monday 2 Nov 2026.
  await page.clock.install({ time: new Date('2026-11-03T09:00:00+09:00') });
  await page.goto('/sports');
  const plan = page.getByRole('region', { name: 'Marathon plan' });
  await plan.getByLabel('Plan start Monday').selectOption('2026-11-02');
  await plan.getByRole('button', { name: /Start plan · race Sun 18 Apr/ }).click();

  await expect(plan.getByText('Week 1 of 24')).toBeVisible();
  await expect(plan.getByRole('heading', { name: 'Easy 7 km + strides' })).toBeVisible();
  await plan.getByRole('button', { name: 'Log this run' }).click();

  const sheet = page.getByRole('dialog', { name: 'CH03 · log sport' });
  await expect(sheet.getByText(/Planned: Easy 7 km \+ strides/)).toBeVisible();
  await expect(sheet.getByLabel('Distance in km')).toHaveValue('7');
  await sheet.getByRole('button', { name: 'Save' }).click();
  await page.getByRole('dialog', { name: 'What you earned' }).getByRole('button', { name: 'OK' }).click();

  await expect(plan.getByRole('status').filter({ hasText: 'Done' })).toContainText('7 km logged');
  await page.reload();
  await expect(page.getByRole('region', { name: 'Marathon plan' }).getByRole('status').filter({ hasText: 'Done' })).toBeVisible();

  // The week sheet lists the run as done.
  await page.getByRole('button', { name: /^Week 1: 33 km/ }).click();
  const week = page.getByRole('dialog', { name: 'Week 1 of 24' });
  await expect(week.locator('.pl-sess.is-done')).toHaveCount(1);
  await expect(week.locator('.pl-sess')).toHaveCount(4); // four runs, no gym days
  await week.getByRole('button', { name: 'Close' }).click();

  // Home shows today's plan, done.
  await page.goto('/');
  const card = page.getByRole('region', { name: 'Training plan today' });
  await expect(card).toContainText('Easy 7 km + strides');
  await expect(card).toContainText('Done');
  await expect(card).toContainText('D-166');

  // The gym has no plan any more: no plan panel, no templates, and the marathon week has no gym days.
  await page.goto('/gym');
  await expect(page.getByRole('region', { name: 'My gym plan' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Use my gym plan' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Log gym' }).first()).toBeVisible();
});
