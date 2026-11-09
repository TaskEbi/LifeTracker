import { expect, test, type Page } from '@playwright/test';

const dialog = (page: Page, name: string | RegExp) => page.getByRole('dialog', { name });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('lifetracker-fx', 'off'));
  // Monday 9 November 2026, evening in Singapore
  await page.clock.setFixedTime(new Date('2026-11-09T10:00:00+00:00'));
});

test('mood: weather, energy, stress and tags, and the way in from More', async ({ page }) => {
  await page.goto('/home/more');
  await page.getByRole('region', { name: 'Life' }).getByRole('button', { name: /^Mood/ }).click();
  await expect(page).toHaveURL(/\/mood$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Mood' })).toBeVisible();

  await page.getByRole('group', { name: 'Inner weather' }).getByRole('button', { name: 'Clear' }).click();
  await page.getByRole('button', { name: 'Energy 4 of 5' }).click();
  await page.getByRole('button', { name: 'Stress 2 of 5: Settled' }).click();
  await page.getByRole('group', { name: 'What was going on' }).getByRole('button', { name: 'Friends' }).click();
  await page.getByLabel('Add your own tag').fill('Orchestra');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByRole('group', { name: 'What was going on' }).getByRole('button', { name: 'Orchestra' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.lf-head__big')).toContainText('1');

  await page.waitForTimeout(300);
  await page.reload();
  await expect(page.getByRole('group', { name: 'What was going on' }).getByRole('button', { name: 'Friends' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Stress 2 of 5: Settled' })).toHaveAttribute('aria-pressed', 'true');

  await page.goto('/home/more');
  await expect(page.getByRole('region', { name: 'Life' }).getByRole('button', { name: /^Mood/ })).toContainText('Clear today · settled stress');
});

test('money: wallet, pocket money, spending and a saving goal', async ({ page }) => {
  await page.goto('/money');
  await page.getByRole('button', { name: 'Set up' }).click();
  const set = dialog(page, 'Money settings');
  await set.getByLabel('What’s in your wallet now · optional').fill('50');
  await set.getByLabel('Pocket money · optional').fill('20');
  await set.getByRole('group', { name: 'On' }).getByRole('button', { name: 'Mon' }).click();
  await set.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('.lf-head__big')).toContainText('S$50');

  await page.getByRole('note').getByRole('button', { name: 'Got it' }).click();
  await expect(page.locator('.lf-head__big')).toContainText('S$70');

  await page.getByRole('button', { name: '− Spent' }).click();
  const spent = dialog(page, 'Spent');
  await spent.getByLabel('Amount (S$)').fill('6.50');
  await spent.getByLabel('Note · optional').fill('Bubble tea');
  await spent.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('.lf-head__big')).toContainText('S$63.50');
  await expect(page.getByLabel('Money lately')).toContainText('Bubble tea');

  await page.getByRole('navigation', { name: 'Money pages' }).getByRole('button', { name: /Saving/ }).click();
  await expect(page).toHaveURL(/\/money\/goals$/);
  await page.getByRole('button', { name: '+ Saving for something' }).click();
  const goal = dialog(page, 'Saving for something');
  await goal.getByLabel('What for').fill('Headphones');
  await goal.getByLabel('How much (S$)').fill('100');
  await goal.getByRole('button', { name: 'Save goal' }).click();
  await page.getByRole('button', { name: 'Put money in' }).click();
  await dialog(page, 'Headphones').getByLabel('Amount (S$)').fill('30');
  await dialog(page, 'Headphones').getByRole('button', { name: 'Put it in' }).click();
  await expect(page.getByRole('article', { name: 'Headphones' })).toContainText('S$30 of S$100');
  await expect(page.locator('.lf-head__big')).toContainText('S$33.50');

  await page.getByRole('navigation', { name: 'Money pages' }).getByRole('button', { name: 'Where it goes' }).click();
  await expect(page.getByLabel('Spending by category this month')).toContainText('Snacks');
  await expect(page.getByLabel('Spending by category this month')).toContainText('S$6.50');
});

test('people: birthdays, time together and gifts', async ({ page }) => {
  await page.goto('/people');
  await page.getByRole('button', { name: 'Add someone' }).click();
  let add = dialog(page, 'Add a person');
  await add.getByLabel('Name').fill('Mum');
  await add.getByRole('group', { name: 'Who they are' }).getByRole('button', { name: 'Family' }).click();
  await add.getByLabel('Birthday · optional').fill('1980-11-20');
  await add.getByRole('switch', { name: /Someone close/ }).click();
  await add.getByRole('button', { name: 'Save' }).click();

  await page.getByRole('button', { name: '+ Person' }).click();
  add = dialog(page, 'Add a person');
  await add.getByLabel('Name').fill('Ken');
  await add.getByRole('button', { name: 'Save' }).click();

  const bdays = page.getByLabel('Birthdays coming up');
  await expect(bdays).toContainText('Mum');
  await expect(bdays).toContainText('Turns 46');
  await expect(bdays).toContainText('in 11 days');
  await expect(page.getByLabel("Close people you haven't seen lately")).toContainText('Mum');

  await page.getByRole('button', { name: '+ Time together' }).click();
  const time = dialog(page, 'Time together');
  await time.getByRole('group', { name: 'Who with' }).getByRole('button', { name: 'Ken' }).click();
  await time.getByLabel('What did you do? · optional').fill('Bubble tea after school');
  await time.getByRole('group', { name: 'How long' }).getByRole('button', { name: '1 h' }).click();
  await time.getByRole('button', { name: 'Save' }).click();

  await page.getByRole('navigation', { name: 'People pages' }).getByRole('button', { name: /Time together/ }).click();
  await expect(page.getByText('Bubble tea after school')).toBeVisible();
  await expect(page.locator('.i-meters')).toContainText('1/7');

  await page.getByRole('navigation', { name: 'People pages' }).getByRole('button', { name: /Gifts/ }).click();
  await page.getByRole('button', { name: '+ Gift idea' }).click();
  const gift = dialog(page, 'Gift idea');
  await gift.getByRole('group', { name: 'For' }).getByRole('button', { name: 'Mum' }).click();
  await gift.getByLabel('The gift').fill('Scarf');
  await gift.getByLabel('Price · optional').fill('25');
  await gift.getByRole('button', { name: 'Save gift' }).click();
  await page.getByRole('region', { name: 'Ideas' }).getByRole('button', { name: 'Bought' }).click();
  await expect(page.getByRole('region', { name: 'Bought, to give' })).toContainText('Scarf');
  await expect(page.getByRole('region', { name: 'Bought, to give' })).toContainText('S$25');

  await page.goto('/home/more');
  await expect(page.getByRole('region', { name: 'Life' }).getByRole('button', { name: /^People/ })).toContainText('Mum’s birthday in 11 days');
});

test('media: on the go, next episode, want list and the year', async ({ page }) => {
  await page.goto('/media');
  await page.getByRole('button', { name: 'Add something' }).click();
  const add = dialog(page, 'Add to Media');
  await add.getByLabel('Title').fill('Frieren');
  await add.getByLabel('Studio · optional').fill('Madhouse');
  await add.getByLabel('Episodes seen').fill('7');
  await add.getByLabel('Out of · optional').fill('28');
  await add.getByRole('button', { name: 'Save' }).click();

  await page.getByRole('button', { name: 'Frieren: next episode' }).click();
  await expect(page.getByLabel('On the go')).toContainText('ep 8 of 28');

  await page.getByRole('button', { name: '+ Want list' }).click();
  const want = dialog(page, 'Add to Media');
  await want.getByRole('group', { name: 'Type' }).getByRole('button', { name: 'Film' }).click();
  await want.getByLabel('Title').fill('Perfect Days');
  await want.getByRole('button', { name: 'Save' }).click();
  await page.getByRole('button', { name: 'Can’t choose?' }).click();
  await expect(page.locator('.md-pick')).toContainText('Try Perfect Days');

  await page.getByRole('button', { name: 'Frieren: finished' }).click();
  const rate = dialog(page, 'Frieren');
  await rate.getByRole('group', { name: 'Rating' }).getByRole('button', { name: '5 of 5' }).click();
  await rate.getByRole('button', { name: 'Save' }).click();

  await page.getByRole('navigation', { name: 'Media pages' }).getByRole('button', { name: 'The year' }).click();
  await expect(page).toHaveURL(/\/media\/year$/);
  await expect(page.locator('.i-meters')).toContainText('5.0');
  await expect(page.getByText('Frieren')).toBeVisible();
});

test('places: map, where next linked to the bucket list, time outside and a trip', async ({ page }) => {
  await page.goto('/places');
  await page.getByRole('button', { name: '+ Been there' }).click();
  const been = dialog(page, 'Somewhere you’ve been');
  await been.getByLabel('Place').fill('Gardens by the Bay');
  await been.getByLabel('Country').fill('Singapore');
  await been.getByRole('button', { name: 'Save place' }).click();
  await expect(page.getByRole('img', { name: /1 country visited/ })).toBeVisible();
  await expect(page.locator('path.is-been, circle.pl-map__dot').first()).toBeAttached();

  await page.getByRole('navigation', { name: 'Places pages' }).getByRole('button', { name: /Where next/ }).click();
  await page.getByRole('button', { name: '+ Somewhere to go' }).click();
  const next = dialog(page, 'Somewhere to go');
  await next.getByLabel('Place').fill('Kyoto');
  await next.getByLabel('Country').fill('Japan');
  await next.getByRole('switch', { name: 'Put it on the bucket list too' }).click();
  await next.getByRole('button', { name: 'Save place' }).click();
  await expect(page.getByLabel('Where you want to go')).toContainText('on the bucket list');
  await page.getByRole('button', { name: 'Been to Kyoto' }).click();
  const reward = page.getByRole('dialog', { name: 'What you earned' });
  if (await reward.isVisible().catch(() => false)) await reward.getByRole('button', { name: 'OK' }).click();

  await page.getByRole('navigation', { name: 'Places pages' }).getByRole('button', { name: 'Outside' }).click();
  await page.getByRole('group', { name: 'Log time outside' }).getByRole('button', { name: '+30 min' }).click();
  await expect(page.locator('.i-meters')).toContainText('30 min');

  await page.getByRole('navigation', { name: 'Places pages' }).getByRole('button', { name: /Trips/ }).click();
  await page.getByRole('button', { name: '+ Trip' }).click();
  const trip = dialog(page, 'A trip');
  await trip.getByLabel('Trip', { exact: true }).fill('Japan with the family');
  await trip.getByLabel('From').fill('2026-12-20');
  await trip.getByLabel('To').fill('2026-12-27');
  await trip.getByRole('button', { name: 'Kyoto' }).click();
  await trip.getByRole('button', { name: 'Save trip' }).click();
  await expect(page.getByRole('article', { name: 'Japan with the family' })).toContainText('8 days · coming up');

  await page.getByRole('navigation', { name: 'Places pages' }).getByRole('button', { name: 'Map' }).click();
  await expect(page.getByRole('img', { name: /2 countries visited/ })).toBeVisible();
  await page.goto('/bucket');
  await expect(page.getByRole('button', { name: /^Go to Kyoto/ })).toBeVisible();
});

test('epq: the research plan’s dates fill the milestones', async ({ page }) => {
  await page.goto('/study/epq');
  await page.getByRole('button', { name: 'Set up your EPQ' }).click();
  const setup = dialog(page, 'Set up your EPQ');
  await expect(setup.getByLabel('Working title')).toHaveValue('AI and expressive piano performance');
  await expect(setup.getByLabel('Hand-in date')).toHaveValue('2027-04-30');
  await setup.getByRole('button', { name: 'Save' }).click();
  await page.getByRole('button', { name: 'Use my research plan’s dates' }).click();
  await expect(page.locator('.epq-ms')).toHaveCount(11);
  await expect(page.getByRole('checkbox', { name: /Gate 1: an AI renderer outputs MIDI/ })).toBeVisible();
});

test('epq plan: to-dos tick and stay ticked, leads go to the library', async ({ page }) => {
  await page.goto('/study/epq');
  await page.getByRole('button', { name: 'Set up your EPQ' }).click();
  await dialog(page, 'Set up your EPQ').getByRole('button', { name: 'Save' }).click();
  await page.getByRole('navigation', { name: 'EPQ pages' }).getByRole('button', { name: 'Plan' }).click();
  await expect(page).toHaveURL(/\/study\/epq\/plan$/);
  await expect(page.getByRole('note', { name: 'Rules for the EPQ' })).toContainText('American spelling');

  const todo = page.getByLabel('EPQ to-do list');
  await todo.getByRole('checkbox', { name: 'Submit the Part A Candidate Proposal' }).click();
  await expect(todo.getByRole('checkbox', { name: 'Submit the Part A Candidate Proposal' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('article', { name: 'Gate 1: does an AI renderer run?' })).toContainText('D-21');

  await page.getByRole('button', { name: 'Add to library: SyMuPe / PianoFlow' }).click();
  const src = dialog(page, 'Add a source');
  await expect(src.getByLabel('Title')).toHaveValue('SyMuPe / PianoFlow');
  await expect(src.getByRole('switch', { name: /In the reference list/ })).toHaveAttribute('aria-checked', 'false');
  await src.getByRole('button', { name: 'Save source' }).click();
  await expect(page.getByLabel('Reading leads')).toContainText('In library');

  await page.waitForTimeout(300);
  await page.reload();
  await expect(page.getByLabel('EPQ to-do list').getByRole('checkbox', { name: 'Submit the Part A Candidate Proposal' })).toHaveAttribute('aria-checked', 'true');
});

test('bosses: the stronger roster shows its rank, trait and second weakness', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-21T10:00:00+00:00'));
  await page.goto('/progress/boss');
  const card = page.getByRole('region', { name: /^Weekly boss/ });
  await expect(card).toContainText(/Demon|Warlord|Overlord/);
  await expect(card).toContainText(/Regenerates|Enrages|Resists/);
  await expect(card).toContainText('At half HP its mask cracks');
  await expect(page.locator('.b-beast')).toHaveCount(24);
});
