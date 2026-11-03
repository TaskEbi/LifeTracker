import { expect, test, type Page } from '@playwright/test';

const dialog = (page: Page, name: string | RegExp) => page.getByRole('dialog', { name });

async function log(page: Page, text: string) {
  await page.getByRole('button', { name: 'Log something' }).click();
  await dialog(page, 'Command').getByLabel('Type what you did, or filter commands').fill(text);
  await dialog(page, 'Command').getByRole('button', { name: /^Log (it|all)/ }).click();
  const reward = page.getByRole('dialog', { name: 'What you earned' });
  await reward.getByRole('button', { name: 'OK' }).click();
}

async function task(page: Page, text: string) {
  await page.getByRole('button', { name: 'Log something' }).click();
  await dialog(page, 'Command').getByLabel('Type what you did, or filter commands').fill(`task ${text}`);
  await dialog(page, 'Command').getByRole('button', { name: 'Log it' }).click();
  await expect(dialog(page, 'Command')).toHaveCount(0);
}

test('forge: proposes a day around the calendar, and adds it only when accepted', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-04T09:00:00+08:00') });
  await page.goto('/base/forge');
  await page.getByRole('group', { name: 'Which day' }).getByRole('button', { name: 'Tomorrow' }).click();
  const plan = page.getByRole('list', { name: 'Proposed plan' });
  await expect(plan.getByRole('listitem').first()).toBeVisible();
  const first = (await plan.getByRole('listitem').first().locator('b').innerText()).trim();
  await plan.getByRole('button', { name: `Leave out: ${first}` }).click();
  await expect(plan).not.toContainText(first);
  await page.getByRole('button', { name: /^Put \d+ in the calendar$/ }).click();
  await expect(page).toHaveURL(/\/calendar$/);
});

test('revision forge: plans up to the exam and can add a week of tasks', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-04T09:00:00+08:00') });
  await page.goto('/base/forge/revision');
  await page.getByRole('button', { name: '+ Add an exam' }).click();
  const sheet = dialog(page, 'New event');
  await sheet.getByLabel('Title').fill('Physics mock');
  await sheet.getByLabel('Day', { exact: true }).fill('2026-11-14');
  await sheet.getByRole('button', { name: 'Add to calendar' }).click();
  await expect(page.getByText('Physics mock')).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Subject for Physics mock' })).toHaveValue('Physics');
  await expect(page.locator('.fg-day').last()).toContainText('Past paper, timed');
  await page.getByRole('button', { name: 'Add the next 7 days to my tasks' }).click();
  await page.goto('/tasks');
  await expect(page.getByText('Physics: Past paper questions').first()).toBeVisible();
});

test('arena: tasks fight until there is a ranking, and the top three go high priority', async ({ page }) => {
  await page.goto('/');
  for (const t of ['Alpha', 'Bravo', 'Charlie', 'Delta']) await task(page, t);
  await page.waitForTimeout(300); // saves reach IndexedDB just after they reach the screen
  await page.goto('/base/arena');
  await page.getByRole('button', { name: 'Start the tournament' }).click();
  const ring = page.getByRole('region', { name: 'Which matters more' });
  for (let i = 0; i < 12 && (await ring.count()); i++) await ring.locator('.ar-card').first().click();
  const rank = page.getByRole('region', { name: 'The ranking' });
  await expect(rank.getByRole('listitem')).toHaveCount(4);
  await rank.getByRole('button', { name: 'Make the top three high priority' }).click();
  await expect(page).toHaveURL(/\/tasks$/);
});

test('oath: signed with a price, checked by the records', async ({ page }) => {
  await page.goto('/base/oath');
  await page.getByRole('button', { name: '+ Swear an oath' }).click();
  const sheet = dialog(page, 'Swear an oath');
  await expect(sheet.getByRole('button', { name: 'Sign it' })).toBeDisabled();
  await sheet.getByLabel('How much (min)').fill('60');
  await sheet.getByLabel('If I break it, I will…').fill('No dessert');
  await sheet.getByRole('button', { name: 'Sign it' }).click();
  await expect(page.locator('.oa')).toContainText('60 minutes of violin');
  await expect(page.locator('.oa')).toContainText('No dessert');
  await log(page, 'violin 70');
  await expect(page.locator('.oa')).toContainText('Kept');
});

test('scales: weighs a decision and says what would flip it', async ({ page }) => {
  await page.goto('/base/scales');
  await page.getByLabel('What are you deciding?').fill('First choice');
  await page.getByRole('button', { name: 'Weigh it' }).click();
  for (const o of ['Cambridge', 'MIT']) {
    await page.getByLabel('Add an option').fill(o);
    await page.getByLabel('Add an option').press('Enter');
    await expect(page.getByRole('button', { name: `Remove option: ${o}` })).toBeVisible();
  }
  await page.getByLabel('Add what matters').fill('Course');
  await page.getByLabel('Add what matters').press('Enter');
  await expect(page.getByRole('heading', { name: 'The scales say' })).toBeVisible();
  await page.getByLabel('Cambridge: Course').fill('9');
  await expect(page.locator('.sc-bar.is-top')).toContainText('Cambridge');
  await page.getByRole('group', { name: 'What I decided' }).getByRole('button', { name: 'Cambridge' }).click();
  await page.waitForTimeout(300); // saves reach IndexedDB just after they reach the screen
  await page.goto('/base/scales');
  await expect(page.locator('.i-row')).toContainText('decided: Cambridge');
});

test('ledger: shows the week and holds your ranking against your time', async ({ page }) => {
  await page.goto('/');
  await log(page, 'coding 120');
  await page.goto('/base/ledger');
  await expect(page.locator('.lg-lines')).toContainText('Coding');
  await expect(page.locator('.lg-lines')).toContainText('Unaccounted');
  const first = page.locator('.lg-row').first();
  await expect(first).toContainText('Violin');
  await expect(first).toContainText('#2 by time');
  await page.getByRole('button', { name: 'Move Violin down' }).click();
  await expect(page.locator('.lg-row').first()).toContainText('Coding');
  await expect(page.locator('.lg-row').first()).toContainText('matches your time');
});

test('diary: the same question comes back with last year’s answer', async ({ page }) => {
  await page.clock.install({ time: new Date('2025-11-04T09:00:00+08:00') });
  await page.goto('/base/diary');
  const box = page.locator('.dy-line textarea');
  await box.fill('Started the road to IOI');
  await box.blur();
  await expect(page.getByText('Saved')).toBeVisible();
  const question = await page.locator('.dy-q').innerText();
  await page.clock.setFixedTime(new Date('2026-11-04T09:00:00+08:00'));
  await page.reload();
  await expect(page.locator('.dy-q')).toHaveText(question);
  await expect(page.locator('.dy-past').first()).toContainText('Started the road to IOI');
  await expect(page.locator('.dy-past').first()).toContainText('2025');
});

test('close the day: clears leftovers, and last night’s decision is there in the morning', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-04T21:00:00+08:00') });
  await page.goto('/');
  await task(page, 'Buy rosin today');
  await page.getByRole('button', { name: /^Close the day/ }).click();
  await page.getByRole('group', { name: 'What to do with: Buy rosin' }).getByRole('button', { name: 'Tomorrow' }).click();
  await expect(page.getByText('Nothing. Clean slate.')).toBeVisible();
  await page.getByLabel('Tomorrow’s first thing').fill('Two past papers');
  await page.getByRole('main').getByRole('button', { name: 'Close the day' }).click();
  await expect(page.getByRole('heading', { name: 'The day is closed.' })).toBeVisible();

  await page.clock.setFixedTime(new Date('2026-11-05T08:00:00+08:00'));
  await page.goto('/');
  const card = page.getByRole('region', { name: 'First thing today' });
  await expect(card).toContainText('Two past papers');
  await card.getByRole('button', { name: 'Done' }).click();
  await expect(card).toHaveCount(0);
});

test('exam hall: runs against the clock and finds the slow question', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-04T09:00:00+08:00') });
  await page.goto('/base/exam');
  await page.getByRole('button', { name: /^SAT Math/ }).click();
  const clock = page.getByRole('region', { name: 'Mock in progress' });
  await page.clock.fastForward(60_000);
  await clock.getByRole('button', { name: 'Question 1 done' }).click();
  await page.clock.fastForward(300_000);
  await clock.getByRole('button', { name: 'Question 2 done' }).click();
  // It survives a reload.
  await page.reload();
  await expect(page.getByRole('region', { name: 'Mock in progress' })).toContainText('You’ve done 2 of 22');
  await page.getByRole('button', { name: 'Finish the paper' }).click();
  const review = page.getByRole('region', { name: 'How it went' });
  await expect(review).toContainText('Number 2 took longest: 5:00');
  await review.getByLabel('Score (optional)').fill('18');
  await review.getByRole('button', { name: /^Save and log/ }).click();
  await expect(dialog(page, /uni prep|Future|log/i)).toBeVisible();
});

test('breathing room: follows the pattern', async ({ page }) => {
  await page.goto('/base/breath');
  await page.getByRole('button', { name: 'Begin' }).click();
  await expect(page.getByRole('timer', { name: /Breathe in/ })).toBeVisible();
  await page.getByRole('button', { name: 'Stop' }).click();
  await expect(page.getByRole('timer', { name: 'Ready' })).toBeVisible();
});

test('projection room: plays a year from the records', async ({ page }) => {
  await page.goto('/');
  await log(page, 'ran 10k in 50');
  await page.goto('/base/cinema');
  await page.getByRole('button', { name: /so far/ }).click();
  const film = page.getByRole('dialog', { name: /^Your \d{4}$/ });
  await film.getByRole('button', { name: 'Next' }).click();
  await expect(film).toContainText('You put in');
  await film.getByRole('button', { name: 'Close' }).click();
  await expect(film).toHaveCount(0);
});

test('deck library: adds a deck once', async ({ page }) => {
  await page.goto('/base/dojo');
  await page.getByRole('button', { name: /^Add Contest algorithms/ }).click();
  await expect(page.locator('.i-row').filter({ hasText: 'Contest algorithms' })).toContainText('Added');
  await expect(page.getByRole('button', { name: /^Start: 15 cards/ })).toBeVisible();
});

test('tech tree: rating foundations unlocks what rests on them', async ({ page }) => {
  await page.goto('/coding/tree');
  await expect(page.getByRole('button', { name: 'Sorting: Not yet, foundations not there yet' })).toBeVisible();
  await page.getByRole('button', { name: 'Implementation: Not yet' }).click();
  await dialog(page, 'Implementation').getByRole('button', { name: 'Can code it' }).click();
  await dialog(page, 'Implementation').getByRole('button', { name: 'Done' }).click();
  await expect(page.getByRole('button', { name: 'Sorting: Not yet', exact: true })).toBeVisible();
});

test('tōkaidō: logged kilometres move you down the road', async ({ page }) => {
  await page.goto('/sports');
  await expect(page.getByRole('button', { name: /^The Tōkaidō: 0 kilometres/ })).toBeVisible();
  await log(page, 'ran 42k in 250');
  await page.getByRole('button', { name: /^The Tōkaidō: 42 kilometres run, at Totsuka/ }).click();
  await expect(page.locator('.tk-road .is-here')).toContainText('Totsuka');
  await expect(page.locator('.tk-road .is-here')).toContainText('You’re here');
});

test('race kit: band and fuel follow the goal, and steps tick', async ({ page }) => {
  await page.goto('/sports/race');
  await page.getByLabel('Goal time').fill('4:10');
  await expect(page.locator('.rk-band tbody tr').last()).toContainText('4:10:00');
  await page.getByLabel('Goal time').fill('nope');
  await expect(page.getByRole('alert')).toContainText('hours and minutes');
  await page.getByLabel('Goal time').fill('3:45');
  await expect(page.locator('.rk-band tbody tr').last()).toContainText('3:45:00');
  const step = page.getByRole('checkbox', { name: /Lay out kit/ });
  await step.click();
  await expect(step).toHaveAttribute('aria-checked', 'true');
  await page.waitForTimeout(300); // saves reach IndexedDB just after they reach the screen
  await page.reload();
  await expect(page.getByRole('checkbox', { name: /Lay out kit/ })).toHaveAttribute('aria-checked', 'true');
});

test('bar tools: plates, warm-up and estimated max', async ({ page }) => {
  await page.goto('/gym');
  await expect(page.locator('.bt-load').first()).toHaveText('Each side: 20 kg');
  for (let i = 0; i < 16; i++) await page.getByRole('button', { name: 'More weight on the bar' }).click();
  await expect(page.locator('.bt-load').first()).toHaveText('Each side: 25 + 15 kg');
  await expect(page.getByText(/Warm-up to 100 kg: 20 × 10, 40 × 8/)).toBeVisible();
  await expect(page.locator('.bt-load').last()).toHaveText('About 70 kg');
});

test('bouncer: a minute, then a choice that counts', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-04T09:00:00+08:00') });
  await page.goto('/screen');
  await page.getByRole('button', { name: /About to scroll/ }).click();
  await expect(page.getByText('One minute. Just wait.')).toBeVisible();
  await page.clock.fastForward(61_000);
  await page.getByRole('button', { name: 'I’ll stay off it' }).click();
  await expect(page.getByText('That’s one you got back.')).toBeVisible();
  await expect(page.locator('.i-meter').filter({ hasText: 'Waited out this week' })).toContainText('1');
  await expect(page.locator('.bo-url')).toContainText('/screen/bouncer');
});

test('board vision: finds squares against the clock and keeps the best', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-04T09:00:00+08:00') });
  await page.goto('/chess/vision');
  await page.getByRole('button', { name: 'Start' }).click();
  for (let i = 0; i < 3; i++) {
    const sq = (await page.locator('.bv-target').innerText()).trim();
    await page.getByRole('button', { name: `Square ${sq}` }).click();
  }
  await expect(page.locator('.bv-head')).toContainText('3 found');
  await page.clock.fastForward(31_000);
  await expect(page.locator('.bv-head')).toContainText('A new best!');
  await expect(page.getByRole('group', { name: 'Play as' }).getByRole('button', { name: /White · best 3/ })).toBeVisible();
});

test('conductor: plans a session from the stand, and logs it with the split', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-04T16:00:00+08:00') });
  await page.goto('/violin');
  await page.getByRole('button', { name: '+ Add' }).click();
  await page.getByLabel('Title').fill('Partita');
  await page.getByLabel('Composer').fill('Bach');
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForTimeout(300); // saves reach IndexedDB just after they reach the screen
  await page.goto('/violin/room');
  await page.getByRole('group', { name: 'Tool' }).getByRole('button', { name: 'Plan a session' }).click();
  const prog = page.getByRole('list', { name: 'Today’s programme' });
  await expect(prog).toContainText('Bach Partita');
  await page.getByRole('button', { name: 'Begin the session' }).click();
  const run = page.getByRole('region', { name: 'Session in progress' });
  await expect(run).toContainText('1 of');
  await run.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(run).toContainText('Bach Partita');
  await page.clock.fastForward(600_000);
  await run.getByRole('button', { name: 'Stop and log' }).click();
  await expect(page.getByRole('dialog').getByRole('button', { name: /^Save/ })).toBeVisible();
  await expect(page.getByRole('dialog').getByText('Bach · Partita').first()).toBeVisible();
});

test('ear trainer: plays, marks the answer, and remembers', async ({ page }) => {
  await page.goto('/violin/room');
  await page.getByRole('group', { name: 'Tool' }).getByRole('button', { name: 'Ear trainer' }).click();
  const ivs = page.getByRole('group', { name: 'Which interval was it' });
  await expect(ivs.getByRole('button', { name: 'Octave' })).toBeDisabled();
  await page.getByRole('button', { name: 'Play an interval' }).click();
  await ivs.getByRole('button', { name: 'Octave' }).click();
  await expect(page.locator('.pr-iv.is-right')).toHaveCount(1);
  await expect(page.getByText(/% of 1 right\./)).toBeVisible();
});
