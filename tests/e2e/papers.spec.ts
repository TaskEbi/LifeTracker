import { expect, test } from '@playwright/test';

test('past papers: tick and score a paper, hard questions, booklets and retries', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-11T04:00:00+00:00'));
  await page.goto('/study');
  await page.getByRole('button', { name: /^Past papers/ }).click();
  await expect(page).toHaveURL(/\/study\/papers$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Past papers' })).toBeVisible();

  // Physics Unit 1: every session listed, the recent ones too
  const u1 = page.getByRole('list', {
    name: 'Unit 1 · Mechanics and Materials papers',
  });
  await expect(u1.getByRole('link', { name: 'Unit 1 Jan 2019 question paper' })).toHaveAttribute('href', /Unit-1\/QP\/January%202019%20\(IAL\)%20QP\.pdf$/);
  await expect(u1.getByRole('link', { name: 'Unit 1 Jan 2019 examiner report' })).toHaveAttribute('href', /WPH11_01_pef_20190307\.pdf$/);
  await expect(u1.getByText('Oct 2021')).toBeVisible();
  await expect(u1.getByText('Jan 2022')).toBeVisible();

  // a quick tick, then a score through the sheet, which also logs the time in Study
  await u1.getByRole('checkbox', { name: 'Unit 1 Jan 2019 done' }).click();
  await expect(u1.getByRole('checkbox', { name: 'Unit 1 Jan 2019 done' })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('button', { name: 'Next paper: Unit 1 Jun 2019' }).click();
  const sheet = page.getByRole('dialog', { name: 'Unit 1 Jun 2019' });
  await expect(sheet.getByLabel('Out of')).toHaveValue('80');
  await sheet.getByLabel('Score · optional').fill('61');
  await sheet.getByRole('button', { name: 'Mark as done' }).click();
  const study = page.getByRole('dialog', { name: 'CH05 · log study' });
  await expect(study.getByRole('group', { name: 'Kind' }).getByRole('button', { name: 'Past paper' })).toHaveAttribute('aria-pressed', 'true');
  await study.getByRole('button', { name: 'Save' }).click();
  await page.getByRole('dialog', { name: 'What you earned' }).getByRole('button', { name: 'OK' }).click();
  await expect(u1.getByRole('button', { name: 'Unit 1 Jun 2019: score and details' })).toContainText('61/80 (76%)');

  // keep the newest two for mocks
  await page.getByRole('button', { name: 'Keep the newest two for mocks' }).first().click();
  await expect(u1.getByText('Mock', { exact: true })).toHaveCount(2);

  // other subjects
  await page.getByRole('group', { name: 'Subject' }).getByRole('button', { name: 'Computer Science' }).click();
  await expect(
    page
      .getByRole('list', {
        name: 'Paper 2 · Fundamental Problem-solving and Programming Skills papers',
      })
      .getByText('Nov 2021 v3'),
  ).toBeVisible();

  // hard questions: filter, tick one, get one wrong
  await page.getByRole('navigation', { name: 'Past paper pages' }).getByRole('button', { name: 'Hard questions' }).click();
  await expect(page).toHaveURL(/\/study\/papers\/hard$/);
  await page.getByRole('group', { name: 'Unit' }).getByRole('button', { name: 'Unit 2 (WPH12)' }).click();
  await page.getByLabel('Search questions').fill('grating');
  await expect(page.locator('.pq-q').first()).toContainText('Lines per mm of a diffraction grating');
  await page.getByRole('checkbox', { name: 'Unit 2 Jun 2019 Q16(c) done' }).click();
  await page
    .getByRole('button', {
      name: 'Unit 2 Jan 2021 Q18(b)(i): got it wrong, retry later',
    })
    .click();
  await expect(page.locator('.pq-q', { hasText: 'What does d stand for' })).toContainText('Retry Fri 13 Nov');
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await page.locator('.pq-topicbox > summary').click();
  await page.getByRole('button', { name: /^Materials: Hooke, stress, Young modulus/ }).click();
  await expect(page.getByRole('group', { name: 'Unit' }).getByRole('button', { name: 'Unit 1 (WPH11)' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.pq-q').first()).toContainText('Materials');
  await page.getByRole('button', { name: 'Clear filters' }).click();

  // topic booklets
  await page.getByRole('navigation', { name: 'Past paper pages' }).getByRole('button', { name: 'By topic' }).click();
  await page.getByRole('group', { name: 'Subject' }).getByRole('button', { name: 'Physics' }).click();
  const booklet = page.getByRole('region', { name: 'Unit 1 topic booklets' }).getByRole('checkbox').first();
  await booklet.click();
  await expect(booklet).toHaveAttribute('aria-checked', 'true');

  // a mistake from any paper goes on the retry list
  await page.getByRole('navigation', { name: 'Past paper pages' }).getByRole('button', { name: 'Retry' }).click();
  await page.getByRole('button', { name: '+ Log a mistake' }).click();
  const mistake = page.getByRole('dialog', { name: 'Log a mistake' });
  await mistake.getByRole('group', { name: 'Subject' }).getByRole('button', { name: 'Maths', exact: true }).click();
  await mistake.getByLabel('Paper · optional').selectOption({ label: 'P1 Jan 2020' });
  await mistake.getByLabel('Question').fill('Q9(b)');
  await mistake.getByLabel('Topic').fill('Completing the square');
  await mistake.getByRole('group', { name: 'Why it went wrong' }).getByRole('button', { name: 'Careless slip' }).click();
  await mistake.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('.pq-retry--later')).toContainText('Completing the square');
  await expect(page.locator('.pq-why')).toContainText('Careless slip');

  // it all survives a reload, and shows in Study and on Home
  await page.waitForTimeout(300);
  await page.goto('/study');
  await expect(page.getByRole('button', { name: /^Past papers/ })).toContainText('2 papers done · 1 hard question');
  await page.goto('/home/more');
  await expect(page.getByRole('region', { name: 'Pages' }).getByRole('button', { name: /^Past papers/ })).toContainText('2 papers done');

  // two days on, the wrong question is due
  await page.clock.setFixedTime(new Date('2026-11-13T04:00:00+00:00'));
  await page.goto('/study/papers/retry');
  const due = page.locator('.pq-retry').first();
  await expect(due).toContainText('What does d stand for');
  await page.getByRole('button', { name: 'WPH12 Jan 2021 Q18(b)(i): right this time' }).click();
  await expect(page.locator('.pq-retry--later')).toContainText('What does d stand for');
});
