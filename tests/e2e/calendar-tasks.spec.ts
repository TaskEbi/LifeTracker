import { expect, test, type Page } from '@playwright/test';

async function addEvent(page: Page, title: string, opts: { section: string; repeatDays?: string[]; startSteps?: number }) {
  await page.getByRole('button', { name: 'Event' }).click();
  await page.getByLabel('Title').fill(title);
  await page.getByRole('dialog').getByRole('group', { name: 'Section' }).getByRole('button', { name: opts.section, exact: true }).click();
  for (let i = 0; i < (opts.startSteps ?? 0); i++) await page.getByRole('button', { name: 'More start time' }).click();
  if (opts.repeatDays) {
    await page.getByRole('dialog').getByRole('group', { name: 'Repeat', exact: true }).getByRole('button', { name: 'Weekly' }).click();
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

test('calendar: import a Schedule backup once, skipping it the second time', async ({ page }) => {
  const day = new Date(Date.now() + 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' });
  const stamp = { category: 'personal', notes: '', createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z' };
  const backup = {
    schemaVersion: 1,
    events: [{ id: 'imp-1', title: 'Imported orchestra', ...stamp, schedule: { kind: 'timed', date: day, time: '18:00', zone: 'Asia/Singapore', duration: 90 } }],
    tasks: [{ id: 'imp-t', title: 'Imported form', ...stamp, dueDate: day }],
    exceptions: [],
  };
  const file = { name: 'schedule-backup-test.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) };
  await page.goto('/calendar');
  await page.getByLabel('Schedule backup file').setInputFiles(file);
  await expect(page.getByRole('status').filter({ hasText: 'Ready' })).toContainText('1 event and 1 task');
  await page.getByRole('button', { name: 'Add to my calendar' }).click();
  await expect(page.getByText('Imported 1 event and 1 task')).toBeVisible();

  await page.getByLabel('Schedule backup file').setInputFiles(file);
  await expect(page.getByRole('status').filter({ hasText: 'Ready' })).toContainText('2 already here, skipped');
  await expect(page.getByRole('button', { name: 'Add to my calendar' })).toBeDisabled();
});

test('calendar: every other week, copy a week forward, repeating task comes back', async ({ page }) => {
  await page.goto('/calendar');
  await page.getByRole('button', { name: 'Event' }).click();
  await page.getByLabel('Title').fill('Quartet rehearsal');
  await page.getByRole('dialog').getByRole('group', { name: 'Repeat', exact: true }).getByRole('button', { name: 'Weekly' }).click();
  await page.getByRole('button', { name: 'More interval' }).click();
  await expect(page.getByRole('dialog').getByText(/^Every 2 weeks on /)).toBeVisible();
  await page.getByRole('dialog').getByRole('group', { name: 'Ends' }).getByRole('button', { name: 'After…' }).click();
  await expect(page.getByRole('dialog').getByText(/10 times, last on/)).toBeVisible();
  await page.getByRole('button', { name: 'Add to calendar' }).click();
  await page.locator('.c-row').filter({ has: page.locator('.c-bar') }).first().click();
  await expect(page.locator('.c-ev').filter({ hasText: 'Quartet rehearsal' })).toContainText('every 2 weeks');

  // A one-off this week, copied to the next two weeks
  await page.getByRole('button', { name: 'Event' }).click();
  await page.getByLabel('Title').fill('Mock exam');
  // Today, so it is in the week on screen whatever day the test runs
  await page.getByLabel('Day').fill(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' }));
  await page.getByRole('dialog').getByRole('group', { name: 'Length' }).getByRole('button', { name: '2h' }).click();
  await expect(page.getByRole('textbox', { name: 'End time' })).toHaveValue('18:00');
  await page.getByRole('button', { name: 'Add to calendar' }).click();
  await page.getByRole('button', { name: 'Copy week' }).click();
  await page.getByRole('dialog').getByRole('group', { name: 'Weeks' }).getByRole('button', { name: '2 weeks', exact: true }).click();
  await page.getByRole('button', { name: 'Copy to the next 2 weeks' }).click();
  await expect(page.getByText(/Copied [1-9]\d* events?/)).toBeVisible();

  // A weekly task: ticking it adds next week's
  await page.goto('/tasks');
  await page.getByRole('button', { name: 'New' }).click();
  await page.getByRole('textbox', { name: 'Task' }).fill('Water the plants');
  await page.getByRole('dialog').getByRole('group', { name: 'Due' }).getByRole('button', { name: 'Today' }).click();
  await page.getByRole('dialog').getByRole('group', { name: 'Repeat', exact: true }).getByRole('button', { name: 'Weekly' }).click();
  await page.getByRole('button', { name: 'Add task' }).click();
  await expect(page.getByText(/↻ weekly on/)).toBeVisible();
  await page.getByRole('button', { name: 'Complete: Water the plants' }).click();
  await page.getByRole('dialog', { name: 'What you earned' }).getByRole('button', { name: 'OK' }).click();
  await expect(page.getByRole('button', { name: 'Complete: Water the plants' })).toHaveCount(1);
  await expect(page.locator('.i-task').filter({ hasText: 'Water the plants' }).first()).toContainText('↻ weekly');
});
