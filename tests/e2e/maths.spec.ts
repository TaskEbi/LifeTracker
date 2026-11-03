import { expect, test } from '@playwright/test';

// The clock is pinned to the Tuesday before the AMC so the season's dates are in the future.
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-03T09:00:00+09:00'));
});

test('maths: add the season, see the countdown and the calendar, then score the contest', async ({ page }) => {
  await page.goto('/maths');
  await page.getByRole('button', { name: 'Add these three' }).click();
  const reward = page.getByRole('dialog', { name: 'What you earned' });
  await expect(reward).toBeVisible();
  await reward.getByRole('button', { name: 'OK' }).click();

  // the next contest is the AMC, with the BMO close behind
  const next = page.getByRole('region', { name: 'Next contest' });
  await expect(next.getByText('AMC 12B 2026')).toBeVisible();
  await expect(next.getByText(/11 days · Sat 14 Nov/)).toBeVisible();
  await expect(next.getByText('BMO1 2026 follows 5 days later.')).toBeVisible();

  // the brief does the AMC's sums
  await next.getByRole('button', { name: 'The brief' }).click();
  const brief = page.getByRole('dialog', { name: 'AMC 12 · the brief' });
  await expect(brief.getByText('Rule out two options and a guess pays.', { exact: false })).toBeVisible();
  await brief.getByRole('button', { name: /close/i }).first().click();

  // the road shows SMC done and two booked
  await page.goto('/maths/road');
  await expect(page.getByText(/112\/125 · 89\.6%/).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /^BMO1/ })).toBeVisible();

  // it's on the calendar too
  await page.goto('/calendar');
  await page.clock.setFixedTime(new Date('2026-11-15T09:00:00+09:00'));
  await page.goto('/maths');
  await expect(page.getByRole('region', { name: 'Next contest' }).getByText(/4 days · Thu 19 Nov · at school/)).toBeVisible();

  // after the day: it asks how it went, and a score lands on the road
  await page.goto('/maths');
  await page.getByRole('button', { name: /AMC 12B 2026: how did it go/ }).click();
  const sheet = page.getByRole('dialog', { name: 'AMC 12B 2026' });
  for (let i = 0; i < 16; i++) await sheet.getByRole('button', { name: 'More questions right' }).click();
  for (let i = 0; i < 4; i++) await sheet.getByRole('button', { name: 'More questions left blank' }).click();
  await expect(sheet.getByText('102 out of 150')).toBeVisible();
  await sheet.getByRole('button', { name: 'Save' }).click();
  await expect(reward).toBeVisible();
  await expect(reward.getByText(/AMC 12B 2026 · 102\/150/)).toBeVisible();
});

test('maths: a problem you were stuck on comes back, and solving it counts once', async ({ page }) => {
  await page.goto('/maths/notebook');
  await page.getByRole('button', { name: 'Add a problem' }).click();
  const add = page.getByRole('dialog', { name: 'Add a problem' });
  await add.getByRole('textbox', { name: 'Which problem' }).fill('BMO1 2019 Q3');
  await add.getByRole('button', { name: 'Geometry' }).click();
  await add.getByRole('textbox', { name: 'Key idea' }).fill('Look for the cyclic quad');
  await add.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('button', { name: /BMO1 2019 Q3/ })).toBeVisible();
  await expect(page.getByText('0/1')).toBeVisible();

  // a week later it's due
  await page.clock.setFixedTime(new Date('2026-11-10T09:00:00+09:00'));
  await page.goto('/maths');
  await expect(page.getByRole('button', { name: /BMO1 2019 Q3/ })).toBeVisible();
  await page.getByRole('button', { name: /BMO1 2019 Q3/ }).click();
  const sheet = page.getByRole('dialog', { name: 'BMO1 2019 Q3' });
  await sheet.getByRole('button', { name: 'Solved it' }).click();
  await sheet.getByRole('button', { name: 'Save' }).click();
  const reward = page.getByRole('dialog', { name: 'What you earned' });
  await expect(reward.getByText('Finally solved · BMO1 2019 Q3')).toBeVisible();
  await reward.getByRole('button', { name: 'OK' }).click();
  await expect(page.getByText(/Nothing due/)).toBeVisible();
});

test('maths: a practice paper against the clock comes back to that paper, and clears the timer', async ({ page }) => {
  await page.goto('/maths/papers');
  await page.getByRole('button', { name: /^BMO1/ }).click();
  const running = page.getByRole('dialog', { name: /Maths focus/ });
  await expect(running.getByText('Goal 210 min')).toBeVisible();
  await running.getByRole('button', { name: 'Finish and log' }).click();

  // the paper's own sheet opens, not the plain log, already set to BMO1 practice
  const sheet = page.getByRole('dialog', { name: 'Add a practice paper' });
  await expect(sheet.getByRole('button', { name: 'BMO1', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(sheet.getByRole('button', { name: 'Practice paper' })).toHaveAttribute('aria-pressed', 'true');
  await sheet.getByRole('textbox', { name: /Minutes spent/ }).fill('205');
  await sheet.getByRole('textbox', { name: 'Marks for problem 1' }).fill('8');
  await sheet.getByRole('button', { name: 'Save' }).click();
  await page.getByRole('dialog', { name: 'What you earned' }).getByRole('button', { name: 'OK' }).click();
  await expect(page.getByRole('button', { name: /Log .* minutes of maths from focus/ })).toHaveCount(0);

  // a plain timer later isn't mistaken for a paper
  await page.goto('/');
  await page.getByRole('button', { name: /Focus mode/ }).click();
  const start = page.getByRole('dialog', { name: '集中 · Focus mode' });
  await start.getByRole('button', { name: 'Maths', exact: true }).click();
  await start.getByRole('button', { name: 'Start focus' }).click();
  await page.getByRole('dialog', { name: /Maths focus/ }).getByRole('button', { name: 'Finish and log' }).click();
  await expect(page.getByRole('dialog', { name: 'CH12 · log maths' })).toBeVisible();
});

test('maths: a practice paper with marks per problem, and time in the Daily Log', async ({ page }) => {
  await page.goto('/maths/papers');
  await page.getByRole('button', { name: 'Add a marked paper' }).click();
  const sheet = page.getByRole('dialog', { name: 'Add a practice paper' });
  await sheet.getByRole('button', { name: 'BMO1', exact: true }).click();
  await sheet.getByRole('textbox', { name: 'Name' }).fill('BMO1 2019');
  await sheet.getByRole('textbox', { name: 'Marks for problem 1' }).fill('10');
  await sheet.getByRole('textbox', { name: 'Marks for problem 2' }).fill('7');
  await expect(sheet.getByText('17 out of 60')).toBeVisible();

  // out of range is refused, and nothing saves
  await sheet.getByRole('textbox', { name: 'Marks for problem 3' }).fill('11');
  await expect(sheet.getByText('Each problem is out of 10.')).toBeVisible();
  await sheet.getByRole('textbox', { name: 'Marks for problem 3' }).fill('');

  await sheet.getByRole('textbox', { name: /Minutes spent/ }).fill('210');
  await sheet.getByRole('button', { name: 'Save' }).click();
  await page.getByRole('dialog', { name: 'What you earned' }).getByRole('button', { name: 'OK' }).click();
  await expect(page.getByRole('button', { name: /BMO1 2019.*17\/60/ })).toBeVisible();

  await page.goto('/log');
  await expect(page.getByText('Past paper').first()).toBeVisible();
});
