import { expect, test, type Page } from '@playwright/test';

async function addEvent(page: Page, title: string, opts: { section: string; repeatDays?: string[]; startSteps?: number }) {
  await page.getByRole('button', { name: 'Event' }).click();
  await page.getByLabel('Title').fill(title);
  await page.getByRole('dialog').getByRole('group', { name: 'Section' }).getByRole('button', { name: opts.section, exact: true }).click();
  for (let i = 0; i < (opts.startSteps ?? 0); i++) await page.getByRole('button', { name: 'More start time' }).click();
  if (opts.repeatDays) {
    await page.getByRole('switch', { name: /Repeats weekly/ }).click();
    for (const d of opts.repeatDays) await page.getByRole('dialog').getByRole('group', { name: 'Repeat on' }).getByRole('button', { name: d }).click();
  }
  await page.getByRole('button', { name: 'Add to calendar' }).click();
}

test('calendar: repeats, clash warning, cancel one, nothing moved automatically', async ({ page }) => {
  await page.goto('/calendar');
  await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible();
  // Tomorrow 16:00–17:00, repeating weekly on that weekday (pre-selected) and Wednesday
  await addEvent(page, 'Violin lesson', { section: 'Violin', repeatDays: [] });
  // Tomorrow 16:30–17:30: overlaps the lesson
  await addEvent(page, 'Tennis friendly', { section: 'Sports', startSteps: 2 });
  await expect(page.locator('.i-warnbox').first()).toContainText('Nothing is moved automatically');

  // Tomorrow is in this week unless today is Sunday; select the day that holds the lesson.
  const tomorrowRow = page.locator('.c-row').filter({ has: page.locator('.c-bar') }).first();
  await tomorrowRow.click();
  await expect(page.locator('.c-ev').filter({ hasText: 'Tennis friendly' }).getByText('CLASH')).toBeVisible();

  // Cancel just this lesson: the clash goes away, the series stays.
  await page.locator('.c-ev').filter({ hasText: 'Violin lesson' }).click();
  await page.getByRole('button', { name: 'Cancel date' }).click();
  await expect(page.locator('.c-ev').filter({ hasText: 'Violin lesson' }).getByText('CANCELLED')).toBeVisible();
  await expect(page.locator('.i-warnbox')).toHaveCount(0);
  await page.getByRole('button', { name: 'Next week' }).click();
  await expect(page.locator('.c-bar').first()).toBeVisible();
});

test('tasks: add with a section, see it in the section, complete it once', async ({ page }) => {
  await page.goto('/tasks');
  await page.getByRole('button', { name: 'New' }).click();
  await page.getByRole('textbox', { name: 'Task' }).fill('Mark bowings in Dvořák part');
  await page.getByRole('dialog').getByRole('group', { name: 'Due' }).getByRole('button', { name: 'Today' }).click();
  await page.getByRole('dialog').getByRole('group', { name: 'Section' }).getByRole('button', { name: 'Violin', exact: true }).click();
  await page.getByRole('button', { name: 'Add task' }).click();
  await expect(page.getByText('Mark bowings in Dvořák part')).toBeVisible();

  // Shows on Home's Today panel and inside Violin
  await page.goto('/');
  await expect(page.getByLabel('Today and tomorrow').getByText('Mark bowings in Dvořák part')).toBeVisible();
  await page.goto('/violin');
  await expect(page.getByText('Mark bowings in Dvořák part')).toBeVisible();

  // Completing earns XP once; unticking and ticking again earns nothing new
  await page.getByRole('button', { name: 'Complete: Mark bowings in Dvořák part' }).click();
  const reward = page.getByRole('dialog', { name: 'What you earned' });
  await expect(reward.getByText('Task completed')).toBeVisible();
  await reward.getByRole('button', { name: 'OK' }).click();
  await page.goto('/tasks');
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByRole('button', { name: 'Mark not done: Mark bowings in Dvořák part' }).click();
  await page.getByRole('button', { name: 'Open', exact: true }).click();
  await page.getByRole('button', { name: 'Complete: Mark bowings in Dvořák part' }).click();
  await expect(page.getByRole('dialog', { name: 'What you earned' })).toHaveCount(0);
});
