import { expect, test } from '@playwright/test';

test('epq: set up, plan milestones, log time and words, keep a log and a library', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-09T18:00:00+00:00'));
  await page.goto('/study');
  await page.getByRole('button', { name: /^EPQ Set up your Extended Project/ }).click();
  await expect(page).toHaveURL(/\/study\/epq$/);
  await page.getByRole('button', { name: 'Set up your EPQ' }).click();

  const setup = page.getByRole('dialog', { name: 'Set up your EPQ' });
  await setup.getByLabel('Working title').fill('Should AI mark GCSE essays?');
  await setup.getByLabel('Hand-in date').fill('2027-05-07');
  await setup.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Should AI mark GCSE essays?' })).toBeVisible();
  await expect(page.getByRole('button', { name: /days to hand in/ })).toContainText('D-178');

  // the usual stages, spread up to hand-in; tick the first
  await page.getByRole('button', { name: 'Add the usual milestones' }).click();
  await expect(page.locator('.epq-ms')).toHaveCount(8);
  await page.getByRole('checkbox', { name: 'Title and question agreed' }).click();
  await expect(page.getByRole('checkbox', { name: 'Title and question agreed, done' })).toHaveAttribute('aria-checked', 'true');

  // time goes in as a Study session in the EPQ subject
  await page.getByRole('button', { name: '+ Time' }).click();
  const study = page.getByRole('dialog', { name: 'CH05 · log study' });
  await expect(study.getByRole('group', { name: 'Subject' }).getByRole('button', { name: 'EPQ' })).toHaveAttribute('aria-pressed', 'true');
  await study.getByRole('button', { name: 'Save' }).click();
  await page.getByRole('dialog', { name: 'What you earned' }).getByRole('button', { name: 'OK' }).click();
  await expect(page.locator('.epq-pace').first()).toContainText('1h / 120h');

  await page.getByRole('button', { name: 'Word count' }).click();
  await page.getByRole('dialog', { name: 'Word count today' }).getByLabel('Words in the essay now').fill('850');
  await page.getByRole('dialog', { name: 'Word count today' }).getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('.epq-pace').nth(1)).toContainText('850 words / 5,000 words');

  // the production log
  await page.getByRole('button', { name: '+ Log entry' }).click();
  const log = page.getByRole('dialog', { name: 'Production log' });
  await log.getByRole('group', { name: 'Kind of entry' }).getByRole('button', { name: 'Decision' }).click();
  await log.getByLabel(/What did you decide/).fill('Narrowed to English Literature essays, where marking is most subjective.');
  await log.getByLabel('Next step · optional').fill('Ask Ms Lee for past moderation reports');
  await log.getByRole('button', { name: 'Save entry' }).click();
  await page.getByRole('navigation', { name: 'EPQ pages' }).getByRole('button', { name: /Production log/ }).click();
  await expect(page).toHaveURL(/\/study\/epq\/log$/);
  await expect(page.locator('.epq-log')).toContainText('Next: Ask Ms Lee');

  // sources and the reference list
  await page.getByRole('navigation', { name: 'EPQ pages' }).getByRole('button', { name: /Sources/ }).click();
  await page.getByRole('button', { name: '+ Source' }).click();
  const src = page.getByRole('dialog', { name: 'Add a source' });
  await src.getByLabel('Title').fill('Thinking, Fast and Slow');
  await src.getByLabel('Author (Surname, I.)').fill('Kahneman, D.');
  await src.getByLabel('Year').fill('2011');
  await src.getByLabel('Publisher or site · optional').fill('Penguin');
  await src.getByRole('button', { name: 'Save source' }).click();
  await expect(page.locator('.epq-refs')).toContainText('Kahneman, D. (2011) Thinking, Fast and Slow. Penguin.');
  await page.getByRole('switch', { name: /Thinking, Fast and Slow: in the reference list/ }).click();
  await expect(page.locator('.epq-refs')).toHaveCount(0);

  // it all survives a reload, and the time shows in Study and on Home
  await page.waitForTimeout(300);
  await page.goto('/study');
  await expect(page.getByRole('button', { name: /^Should AI mark GCSE/ })).toContainText('1h of 120h · 850 of 5,000 words · D-178');
  await page.goto('/home/more');
  await expect(page.getByRole('region', { name: 'Pages' }).getByRole('button', { name: /^EPQ/ })).toContainText('D-178');
});
