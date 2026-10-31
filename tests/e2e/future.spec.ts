import { expect, test } from '@playwright/test';

test('future: set up, log prep, a deadline departs, an essay counts its words, a uni gets sent', async ({ page }) => {
  await page.goto('/future');
  await page.getByRole('button', { name: 'Set up my plan' }).click();
  await page.getByRole('dialog', { name: 'Set up Future' }).getByRole('button', { name: 'Set it up' }).click();

  // the board lists the shortlist's deadlines, soonest first (Oxbridge in October)
  const board = page.getByRole('list', { name: 'Departures' });
  await expect(board.getByRole('button').first()).toHaveAccessibleName(/^Cambridge, UCAS \(Oxbridge\)/);

  // prep time goes into the Daily Log and earns XP
  await page.getByRole('button', { name: 'Log prep' }).click();
  const prep = page.getByRole('dialog', { name: 'CH10 · log prep' });
  await prep.getByRole('button', { name: 'Essays', exact: true }).click();
  await prep.getByRole('button', { name: 'Save' }).click();
  const reward = page.getByRole('dialog', { name: 'What you earned' });
  await expect(reward).toBeVisible();
  await reward.getByRole('button', { name: 'OK' }).click();
  await expect(page.getByText('45 min / 5 hr')).toBeVisible();

  await page.goto('/future/essays');

  // an essay with a live word count against 650
  await page.getByRole('button', { name: '+ Common App' }).click();
  const essay = page.getByRole('dialog', { name: 'New essay' });
  await essay.getByPlaceholder(/Write here/).fill('one two three four five');
  await expect(essay.getByText('5 / 650 words · 645 left')).toBeVisible();
  await essay.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('list', { name: 'Essays' }).getByText('Common App personal essay')).toBeVisible();

  // mark MIT submitted: its ticket gets stamped and it earns 100 XP
  await page.getByRole('navigation', { name: 'Future sections' }).getByRole('button', { name: 'Unis' }).click();
  await page.getByRole('list', { name: 'Universities' }).getByRole('button', { name: /MIT/ }).click();
  const uni = page.getByRole('dialog', { name: 'MIT' });
  await uni.getByRole('button', { name: 'Submitted', exact: true }).click();
  await uni.getByRole('button', { name: 'Save' }).click();
  await expect(reward.getByText('Application sent: MIT')).toBeVisible();
  await reward.getByRole('button', { name: 'OK' }).click();
  await expect(page.getByRole('list', { name: 'Universities' }).getByRole('button', { name: /MIT/ }).getByText('SENT')).toBeVisible();
});
