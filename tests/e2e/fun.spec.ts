import { expect, test } from '@playwright/test';

test('focus: a timed study session goes into the study sheet, hits the boss, and clears itself', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await page.getByRole('button', { name: /Focus mode/ }).click();
  const start = page.getByRole('dialog', { name: '集中 · Focus mode' });
  await start.getByRole('group', { name: 'Section' }).getByRole('button', { name: 'Study' }).click();
  await start.getByRole('group', { name: 'Goal' }).getByRole('button', { name: '25 min' }).click();
  await start.getByRole('button', { name: 'Start focus' }).click();

  const running = page.getByRole('dialog', { name: '集中 · Study focus' });
  await expect(running.getByText('Goal 25 min')).toBeVisible();
  // Closing the sheet keeps it running, shown above the command bar; a reload keeps it too.
  await running.getByRole('button', { name: /close/i }).click();
  await page.clock.fastForward('26:00');
  await page.reload();
  await expect(page.getByRole('button', { name: /^Study focus: 26 minutes/ })).toBeVisible();
  await page.getByRole('button', { name: /^Study focus/ }).click();
  await expect(running.getByText('Goal reached!')).toBeVisible();
  await running.getByRole('button', { name: 'Finish and log' }).click();

  const sheet = page.getByRole('dialog', { name: 'CH05 · log study' });
  await expect(sheet).toBeVisible();
  await sheet.getByRole('button', { name: 'Save' }).click();
  await page.getByRole('dialog', { name: 'What you earned' }).getByRole('button', { name: 'OK' }).click();
  await expect(page.getByRole('button', { name: /from focus/ })).toHaveCount(0);

  await page.goto('/progress/boss');
  await expect(page.getByRole('heading', { level: 1, name: 'Progress' })).toBeVisible();
  const hits = page.getByRole('list', { name: 'Hits this week' });
  await expect(hits).toContainText('Study · 26 min');
  await expect(hits).toContainText('first this week');

  await page.goto('/progress');
  await expect(page.getByRole('img', { name: /Training heatmap, last 20 weeks: 1 active day, 26 min/ })).toBeVisible();
});

test('focus: discarding asks first and logs nothing', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Focus mode/ }).click();
  await page.getByRole('dialog', { name: '集中 · Focus mode' }).getByRole('button', { name: 'Start focus' }).click();
  const running = page.getByRole('dialog', { name: /Focus|focus/ });
  await running.getByRole('button', { name: 'Discard focus…' }).click();
  await running.getByRole('button', { name: 'Discard', exact: true }).click();
  await expect(page.getByRole('dialog', { name: '集中 · Focus mode' })).toBeVisible();
  await page.goto('/log');
  await expect(page.getByText('No entries yet.')).toBeVisible();
});
