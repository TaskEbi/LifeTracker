import { expect, test, type Page } from '@playwright/test';

const dialog = (page: Page, name: string | RegExp) => page.getByRole('dialog', { name });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('lifetracker-fx', 'off'));
  // Wednesday 11 November 2026, evening in Singapore
  await page.clock.setFixedTime(new Date('2026-11-11T10:00:00+00:00'));
});

test('stage: a test, a day coming up with its ready list, a match, and both kept where they live', async ({ page }) => {
  await page.goto('/home/more');
  await page.getByRole('region', { name: 'Life' }).getByRole('button', { name: /^Stage/ }).click();
  await expect(page).toHaveURL(/\/stage$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Stage' })).toBeVisible();

  // A test, with a guess beforehand and a note for next time.
  await page.getByRole('button', { name: '+ Log a result' }).first().click();
  await dialog(page, 'What was it?').getByRole('button', { name: /^Test/ }).click();
  let log = dialog(page, 'Log a test');
  await log.getByRole('group', { name: 'Subject' }).getByRole('button', { name: 'Physics', exact: true }).click();
  await log.getByLabel('What it was · optional').fill('SHM test');
  await log.getByLabel('Score').fill('42');
  await log.getByLabel('Out of').fill('50');
  await expect(log.getByText('84%')).toBeVisible();
  await log.getByLabel('Your guess before (%) · optional').fill('75');
  await log.getByRole('button', { name: 'How it went 4 of 5: Good' }).click();
  await log.getByLabel('Next time · optional').fill('Show working for every step');
  await log.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByLabel('Lately')).toContainText('SHM test');
  await expect(page.getByLabel('Lately')).toContainText('84%');

  // It is a Study mark: editing it there keeps the guess.
  await page.waitForTimeout(300);
  await page.goto('/study');
  await page.getByRole('button', { name: /SHM test/ }).click();
  await dialog(page, 'Edit mark').getByLabel('Title').fill('SHM test 1');
  await dialog(page, 'Edit mark').getByRole('button', { name: 'Save mark' }).click();
  await page.waitForTimeout(300);
  await page.goto('/stage/tests');
  await expect(page.getByRole('article', { name: 'Physics' })).toContainText('84%');
  await expect(page.getByRole('button', { name: /SHM test 1/ })).toContainText('guessed 75%');

  // Something coming up, with a ready list and last time's lesson for that kind.
  await page.goto('/stage');
  await page.getByRole('button', { name: '+ Coming up' }).click();
  await dialog(page, 'What’s coming up?').getByRole('button', { name: /^Test/ }).click();
  const ev = dialog(page, 'Plan a test');
  await ev.getByLabel('Name · optional').fill('Physics mock');
  await ev.getByLabel('Day').fill('2026-11-14');
  await ev.getByRole('button', { name: 'Add to Coming up' }).click();
  const up = page.getByRole('article', { name: 'Physics mock' });
  await expect(up).toContainText('3');
  await expect(up).toContainText('Show working for every step');
  await up.getByRole('button', { name: /Get ready/ }).click();
  const prep = dialog(page, 'Physics mock');
  await prep.getByRole('checkbox', { name: 'One past paper or practice set, timed' }).click();
  await prep.getByLabel('Your guess (%) · optional').fill('80');
  await prep.getByRole('button', { name: 'Save' }).click();
  await expect(up.getByRole('button', { name: /Get ready/ })).toHaveText('Get ready · 1/6');
  await expect(page.locator('.stg-count')).toContainText('T−3');

  // A volleyball match: sets decide the result, and it's a sports session too.
  await page.getByRole('button', { name: '+ Log a result' }).first().click();
  await dialog(page, 'What was it?').getByRole('button', { name: /^Match/ }).click();
  log = dialog(page, 'Log a match');
  await log.getByLabel('Against').fill('Tanglin');
  await log.getByLabel('Sets · optional (yours first)').fill('25-21, 22-25, 15-12');
  await expect(log.getByRole('group', { name: 'Result' }).getByRole('button', { name: 'Won' })).toHaveAttribute('aria-pressed', 'true');
  for (let i = 0; i < 3; i++) await log.getByRole('button', { name: 'Kills one more' }).click();
  await log.getByRole('button', { name: 'Save' }).click();
  // Its time counts as sport, so it earns like any session.
  await page.getByRole('dialog', { name: 'What you earned' }).getByRole('button', { name: 'OK' }).click();
  await page.getByRole('navigation', { name: 'Stage pages' }).getByRole('button', { name: /Games/ }).click();
  await expect(page).toHaveURL(/\/stage\/games$/);
  const vb = page.getByRole('region', { name: 'Volleyball matches' });
  await expect(vb).toContainText('1–0');
  await expect(vb).toContainText('vs Tanglin');
  await expect(vb.getByLabel('Volleyball numbers per match')).toContainText('3');

  await page.waitForTimeout(300);
  await page.goto('/sports');
  await expect(page.getByRole('button', { name: /Volleyball · match/ })).toContainText('Score 25–21, 22–25, 15–12');

  await page.waitForTimeout(300);
  await page.reload();
  await page.goto('/stage/all');
  await expect(page.getByRole('button', { name: /Match: vs Tanglin/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Test: SHM test 1/ })).toBeVisible();
});

test('stage: plan a match and a concert ahead, then log them once they have happened', async ({ page }) => {
  await page.goto('/stage');

  // A match for later today, with who, what and where.
  await page.getByRole('button', { name: '+ Coming up' }).click();
  await dialog(page, 'What’s coming up?').getByRole('button', { name: /^Match/ }).click();
  const plan = dialog(page, 'Plan a match');
  await plan.getByLabel('Against · optional').fill('Tanglin');
  await plan.getByLabel('Competition · optional').fill('Inter-school league');
  await plan.getByLabel('Where · optional').fill('Court 2');
  await plan.getByLabel('Day').fill('2026-11-11');
  await plan.getByRole('button', { name: 'Add to Coming up' }).click();
  const card = page.getByRole('article', { name: 'Volleyball vs Tanglin' });
  await expect(card).toContainText('vs Tanglin · Inter-school league · Court 2');
  await expect(page.locator('.stg-count')).toContainText('TODAY');

  // The plan can be changed before the day; the title follows the details.
  await card.getByRole('button', { name: 'Edit plan' }).click();
  const edit = dialog(page, 'Plan: Volleyball vs Tanglin');
  await edit.getByLabel('Against · optional').fill('Dover');
  await edit.getByRole('button', { name: 'Save' }).click();
  const moved = page.getByRole('article', { name: 'Volleyball vs Dover' });
  await expect(moved).toBeVisible();

  // After it: one tap, with the plan filled in. No result was needed in advance.
  await moved.getByRole('button', { name: 'How did it go?' }).click();
  const log = dialog(page, 'Log a match');
  await expect(log.getByLabel('Against')).toHaveValue('Dover');
  await expect(log.getByLabel('Competition · optional')).toHaveValue('Inter-school league');
  await log.getByLabel('Sets · optional (yours first)').fill('25-20, 25-22');
  await log.getByRole('button', { name: 'Save' }).click();
  await page.getByRole('dialog', { name: 'What you earned' }).getByRole('button', { name: 'OK' }).click();
  await expect(page.getByLabel('Lately')).toContainText('vs Dover');
  await expect(page.getByRole('article', { name: 'Volleyball vs Dover' })).toHaveCount(0);

  // A concert weeks away, planned from the Log sheet by picking a day ahead.
  await page.getByRole('button', { name: '+ Log a result' }).first().click();
  await dialog(page, 'What was it?').getByRole('button', { name: /^Performance/ }).click();
  const concert = dialog(page, 'Log a performance');
  await concert.getByLabel('What it was').fill('Winter concert');
  await concert.getByLabel('Another day').fill('2026-12-05');
  await expect(concert.getByText('still ahead')).toBeVisible();
  await concert.getByRole('button', { name: 'Add to Coming up' }).click();
  const up = page.getByRole('article', { name: 'Winter concert' });
  await expect(up).toContainText('24');
  await expect(page.getByLabel('Lately')).not.toContainText('Winter concert');

  // It is on the calendar too, as a performance.
  await page.waitForTimeout(300);
  await page.goto('/violin');
  await expect(page.getByRole('button', { name: /Winter concert/ })).toBeVisible();
});

test('violin: past repertoire in one go, a performance with its pieces, and the trophy shelf', async ({ page }) => {
  await page.goto('/violin');
  await page.getByRole('button', { name: /^Repertoire:/ }).click();
  await expect(page).toHaveURL(/\/violin\/repertoire$/);
  await page.getByRole('button', { name: 'Add many at once' }).click();
  const many = dialog(page, 'Add past pieces');
  await many.getByLabel('Pieces').fill('Bach — Partita No. 2, Gigue (2023)\nVivaldi: Concerto in A minor, I\nMeditation from Thaïs');
  await many.getByLabel('Year for lines without one · optional').fill('2021');
  await expect(many.getByLabel('Preview')).toContainText('Vivaldi');
  await many.getByRole('button', { name: 'Add 3 pieces' }).click();
  await expect(page.getByRole('region', { name: '2023' })).toContainText('Partita No. 2, Gigue');
  await expect(page.getByRole('region', { name: '2021' })).toContainText('Concerto in A minor, I');

  // One more by hand, with dates and a level.
  await page.getByRole('button', { name: 'Add a past piece' }).click();
  const one = dialog(page, 'Add to the repertoire');
  await one.getByLabel('Title').fill('Liebesleid');
  await one.getByLabel('Composer').fill('Kreisler');
  await one.getByLabel('Started · optional').fill('2024-09');
  await one.getByLabel('Finished · optional').fill('2025-03');
  await one.getByLabel('Level · optional').fill('Grade 7');
  await one.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('region', { name: '2025' })).toContainText('Grade 7 · Sep 2024 – Mar 2025');

  // A performance on the Stage with a piece from the repertoire.
  await page.waitForTimeout(300);
  await page.goto('/stage');
  await page.getByRole('button', { name: '+ Log a result' }).first().click();
  await dialog(page, 'What was it?').getByRole('button', { name: /^Performance/ }).click();
  const log = dialog(page, 'Log a performance');
  await log.getByRole('group', { name: 'What kind' }).getByRole('button', { name: 'Recital' }).click();
  await log.getByLabel('What it was').fill('Autumn recital');
  await log.getByRole('group', { name: 'What you played' }).getByRole('button', { name: 'Kreisler — Liebesleid' }).click();
  await log.getByLabel('Result · optional').fill('Distinction');
  await log.getByText('Before it').click();
  await log.getByRole('button', { name: 'Nerves 5 of 5: Shaking' }).click();
  await log.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByLabel('Trophy shelf')).toContainText('Autumn recital');
  await expect(page.getByLabel('Lately')).toContainText('Kreisler — Liebesleid');

  await page.waitForTimeout(300);
  await page.goto('/violin/repertoire');
  await expect(page.getByRole('button', { name: /Liebesleid/ })).toContainText('performed 1× · last Autumn recital');
  await page.getByRole('group', { name: 'Show' }).getByRole('button', { name: 'Performed' }).click();
  await expect(page.locator('.rp-row')).toHaveCount(1);

  await page.waitForTimeout(300);
  await page.goto('/violin');
  await expect(page.getByRole('button', { name: /Autumn recital/ })).toContainText('Distinction');
});
