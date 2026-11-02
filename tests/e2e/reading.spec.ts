import { expect, test } from '@playwright/test';

const CLIPPINGS = [
  'Dune (Frank Herbert)',
  '- Your Highlight on Location 100-102 | Added on Monday, 3 January 2022 10:00:00',
  '',
  'Fear is the mind-killer.',
  '==========',
  'Sapiens (Yuval Noah Harari)',
  '- Your Highlight on Location 7-8 | Added on Tuesday, 1 February 2022 09:00:00',
  '',
  'Biology enables, culture forbids.',
  '==========',
].join('\r\n');

test('reading: add a book with a suggestion, log time and a percentage, see what is left, finish it', async ({ page }) => {
  await page.route('https://openlibrary.org/**', (r) =>
    r.fulfill({ json: { docs: [{ title: 'The Dispossessed', author_name: ['Ursula K. Le Guin'], number_of_pages_median: 400, first_publish_year: 1974, subject: ['Science fiction'] }] } }),
  );
  await page.goto('/reading');
  await page.getByRole('button', { name: "Add the book I'm reading" }).click();
  const add = page.getByRole('dialog', { name: 'Add a book' });
  await add.getByRole('textbox', { name: 'Title' }).fill('The Dispos');
  await add.getByRole('button', { name: /^The Dispossessed/ }).click();
  await expect(add.getByRole('textbox', { name: 'Author' })).toHaveValue('Ursula K. Le Guin');
  await expect(add.getByRole('button', { name: 'Sci-fi' })).toHaveAttribute('aria-pressed', 'true');
  await add.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('button', { name: /^The Dispossessed, 0 percent/ })).toBeVisible();

  // a session with the Kindle's percentage: 30 min for 10% leaves 4½ hours
  await page.getByRole('button', { name: 'Log time' }).click();
  const log = page.getByRole('dialog', { name: 'CH11 · log reading' });
  await log.getByRole('textbox', { name: /Where you got to/ }).fill('10');
  await log.getByRole('button', { name: 'Save' }).click();
  const reward = page.getByRole('dialog', { name: 'What you earned' });
  await expect(reward).toBeVisible();
  await reward.getByRole('button', { name: 'OK' }).click();
  await expect(page.getByText(/About 4 hr 30 min left/)).toBeVisible();
  await expect(page.getByText('of 2 hr 30 min this week')).toBeVisible();

  // it went into the Daily Log, under the book
  await page.goto('/log');
  await expect(page.getByText('The Dispossessed').first()).toBeVisible();

  // past 100%: it's finished, earns its XP, stands on the shelf, and the reward says so
  await page.goto('/reading');
  await page.getByRole('button', { name: 'Log time' }).click();
  await log.getByRole('textbox', { name: /Where you got to/ }).fill('100');
  await log.getByRole('button', { name: '5 stars' }).click();
  await log.getByRole('button', { name: 'Save' }).click();
  await expect(reward).toBeVisible();
  await expect(reward.getByText(/Finished: The Dispossessed/)).toBeVisible();
  await reward.getByRole('button', { name: 'OK' }).click();
  await page.getByRole('button', { name: 'Shelf', exact: true }).click();
  await expect(page.getByRole('button', { name: 'The Dispossessed by Ursula K. Le Guin, 5 stars' })).toBeVisible();

  // re-saving the book earns nothing new
  await page.getByRole('button', { name: 'The Dispossessed by Ursula K. Le Guin, 5 stars' }).click();
  await page.getByRole('dialog', { name: 'The Dispossessed' }).getByRole('button', { name: 'Save' }).click();
  await expect(reward).toBeHidden();
});

test('reading: the timer hands its minutes to the book it was started on', async ({ page }) => {
  await page.route('https://openlibrary.org/**', (r) => r.fulfill({ json: { docs: [] } }));
  await page.goto('/reading');
  await page.getByRole('button', { name: "Add the book I'm reading" }).click();
  const add = page.getByRole('dialog', { name: 'Add a book' });
  await add.getByRole('textbox', { name: 'Title' }).fill('Timed Book');
  await add.getByRole('button', { name: 'Save' }).click();
  await page.getByRole('button', { name: 'Timer' }).click();
  await page.getByRole('button', { name: 'Finish and log' }).click();
  const log = page.getByRole('dialog', { name: 'CH11 · log reading' });
  await expect(log.getByRole('group', { name: 'Book' }).getByRole('button', { name: 'Timed Book' })).toHaveAttribute('aria-pressed', 'true');
  await expect(log.getByRole('status').or(log.locator('output')).first()).toContainText('1');
  await log.getByRole('button', { name: 'Save' }).click();
  await page.getByRole('dialog', { name: 'What you earned' }).getByRole('button', { name: 'OK' }).click();
  await expect(page.getByRole('button', { name: /from focus/ })).toBeHidden();
  await expect(page.getByText('1 min so far')).toBeVisible();
});

test('reading: Open Library failing leaves a book typed by hand and says so', async ({ page }) => {
  await page.route('https://openlibrary.org/**', (r) => r.abort());
  await page.goto('/reading');
  await page.getByRole('button', { name: "Add the book I'm reading" }).click();
  const add = page.getByRole('dialog', { name: 'Add a book' });
  await add.getByRole('textbox', { name: 'Title' }).fill('A Book Nobody Has');
  await expect(add.getByText(/Couldn't reach Open Library/)).toBeVisible();
  await add.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('button', { name: /^A Book Nobody Has, 0 percent/ })).toBeVisible();
});

test('reading: Kindle clippings come in once, books on hold, and today\'s line appears', async ({ page }) => {
  await page.goto('/reading/lines');
  await page.getByRole('button', { name: 'Import from Kindle' }).click();
  const sheet = page.getByRole('dialog', { name: 'Import from Kindle' });
  await sheet.getByLabel('Choose My Clippings.txt').setInputFiles({ name: 'My Clippings.txt', mimeType: 'text/plain', buffer: Buffer.from(CLIPPINGS) });
  await expect(sheet.getByText('2 new highlights from 2 books.', { exact: false })).toBeVisible();
  await sheet.getByRole('button', { name: 'Add 2 highlights' }).click();

  const reward = page.getByRole('dialog', { name: 'What you earned' });
  await expect(reward).toBeVisible();
  await reward.getByRole('button', { name: 'OK' }).click();
  await expect(page.getByRole('button', { name: /Fear is the mind-killer/ })).toBeVisible();
  await expect(page.getByText("Today's line")).toBeVisible();

  // search
  await page.getByRole('searchbox', { name: 'Search highlights' }).fill('culture');
  await expect(page.getByRole('button', { name: /Biology enables/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Fear is the mind-killer/ })).toBeHidden();

  // books are on hold, not claimed as read
  await page.getByRole('button', { name: 'Shelf', exact: true }).click();
  await expect(page.getByRole('region', { name: 'On hold' }).getByRole('button', { name: /^Dune/ })).toBeVisible();
  await expect(page.getByText('0 of 12')).toBeVisible();

  // the same file again adds nothing
  await page.getByRole('button', { name: 'Import from Kindle' }).click();
  await sheet.getByLabel('Choose My Clippings.txt').setInputFiles({ name: 'My Clippings.txt', mimeType: 'text/plain', buffer: Buffer.from(CLIPPINGS) });
  await expect(sheet.getByText('Nothing new: every highlight in it is already here.')).toBeVisible();
  await expect(sheet.getByRole('button', { name: 'Add', exact: true })).toBeDisabled();
});

test('reading: a pile to pick from, and a year with a goal', async ({ page }) => {
  await page.route('https://openlibrary.org/**', (r) => r.fulfill({ json: { docs: [] } }));
  await page.goto('/reading');
  await page.getByRole('button', { name: "Add the book I'm reading" }).click();
  const add = page.getByRole('dialog', { name: 'Add a book' });
  await add.getByRole('textbox', { name: 'Title' }).fill('Open Book');
  await add.getByRole('button', { name: 'Save' }).click();
  for (const title of ['First Waiting', 'Second Waiting']) {
    await page.getByRole('button', { name: '+ To the pile' }).click();
    const pile = page.getByRole('dialog', { name: 'Add to the pile' });
    await pile.getByRole('textbox', { name: 'Title' }).fill(title);
    await pile.getByRole('button', { name: 'Save' }).click();
  }
  await page.getByRole('button', { name: 'Pick my next book' }).click();
  await expect(page.getByRole('status').filter({ hasText: /How about (First|Second) Waiting\?/ })).toBeVisible();

  await page.getByRole('button', { name: 'Shelf', exact: true }).click();
  await page.getByRole('button', { name: /more books a year|books a year/ }).last().click();
  await expect(page.getByText('0 of 13')).toBeVisible();

  await page.getByRole('button', { name: 'Year', exact: true }).click();
  await expect(page.getByRole('region', { name: /in books$/ })).toContainText('books finished');
});
