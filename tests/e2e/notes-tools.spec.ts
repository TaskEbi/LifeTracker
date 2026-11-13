import { expect, test } from '@playwright/test';

test('study notes: A2 topics and covering the key terms', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/study/notes/physics');

  // the AS units come first; A2 is one tap away and the choice is remembered
  await expect(page.getByRole('heading', { level: 2, name: 'Mechanics and Materials', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Further Mechanics, Fields and Particles' })).toHaveCount(0);
  const level = page.getByRole('group', { name: 'Level' });
  await expect(level.getByRole('button', { name: 'AS', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await level.getByRole('button', { name: 'A2', exact: true }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Further Mechanics, Fields and Particles' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Mechanics and Materials', exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('group', { name: 'Level' }).getByRole('button', { name: 'A2', exact: true })).toHaveAttribute('aria-pressed', 'true');

  // an A2 topic reads like any other
  await page.getByRole('link', { name: /Capacitors/ }).click();
  await expect(page).toHaveURL(/\/study\/notes\/physics\/ph-capacitors$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Capacitors' })).toBeVisible();
  await expect(page.getByText('WPH14 · Further Mechanics, Fields and Particles (A2)')).toBeVisible();

  // cover the definitions, then check one
  const terms = page.locator('.nt-terms');
  const first = terms.locator('dd').first();
  const text = (await first.textContent()) ?? '';
  expect(text.length).toBeGreaterThan(8);
  await page.getByRole('button', { name: 'Cover the definitions and test yourself' }).click();
  await expect(first).not.toContainText(text);
  await terms.getByRole('button', { name: /^Show the definition of / }).first().click();
  await expect(first).toContainText(text);
  await page.getByRole('button', { name: 'Show the definitions' }).click();
  await expect(terms.getByRole('button')).toHaveCount(0);

  // the other subjects have their A2 units too
  await page.goto('/study/notes/further/fm-f3-hyperbolic');
  await expect(page.getByRole('heading', { level: 1, name: 'Hyperbolic Functions' })).toBeVisible();
  await page.goto('/study/notes/cs/cs-a2-security');
  await expect(page.getByRole('heading', { level: 1, name: 'Security' })).toBeVisible();
  await page.goto('/study/notes/maths/ma-p3-trig');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('study notes: flash cards for a topic, the decks, and logging the time', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/study/notes/physics/ph-solids');
  await page.getByRole('link', { name: 'Flash cards', exact: true }).click();
  await expect(page).toHaveURL(/\/study\/notes\/cards\/physics\/ph-solids$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Solid Materials' })).toBeVisible();

  // the first card is the topic's first key term; the answer shows only when asked for
  await expect(page.getByText(/^Card 1 of \d+ · new$/)).toBeVisible();
  const total = Number(((await page.getByText(/^Card 1 of \d+/).textContent()) ?? '').match(/of (\d+)/)![1]);
  expect(total).toBeGreaterThan(4);
  await expect(page.locator('.nt-card__q')).toHaveText('Hooke’s law');
  await expect(page.getByRole('button', { name: 'Got it' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Show the answer' }).click();
  await expect(page.getByText('Extension is proportional to force, up to the limit of proportionality.')).toBeVisible();

  // miss the first, get the rest: the missed card comes round again at the end
  await page.getByRole('button', { name: 'Missed it' }).click();
  await expect(page.getByText(`Card 2 of ${total + 1} · new`)).toBeVisible();
  for (let i = 2; i <= total; i++) {
    await page.getByRole('button', { name: 'Show the answer' }).click();
    await page.getByRole('button', { name: 'Got it' }).click();
  }
  await expect(page.getByText(`Card ${total + 1} of ${total + 1} · again`)).toBeVisible();
  await expect(page.locator('.nt-card__q')).toHaveText('Hooke’s law');
  await page.getByRole('button', { name: 'Show the answer' }).click();
  await page.getByRole('button', { name: 'Got it' }).click();

  await expect(page.getByRole('heading', { level: 2, name: 'Sitting done' })).toBeVisible();
  await expect(page.getByText(`${total - 1} of ${total} cards right first time. 1 card you missed comes back tomorrow.`)).toBeVisible();

  // the time can go straight into Study
  await page.getByRole('button', { name: 'Log 1 min' }).click();
  await expect(page.getByRole('dialog', { name: 'CH05 · log study' })).toBeVisible();
  await page.keyboard.press('Escape');

  // what was answered is kept: nothing is due after a reload, but the deck can still be gone through
  await page.reload();
  await expect(page.getByRole('heading', { level: 2, name: 'Nothing is due' })).toBeVisible();
  await page.getByRole('button', { name: 'Go through them anyway' }).click();
  await expect(page.getByText(new RegExp(`^Card 1 of ${total} · box 1$`))).toBeVisible();
  await expect(page.locator('.nt-card__q')).toHaveText('Hooke’s law');

  // the decks count it
  await page.getByRole('link', { name: '← Notes' }).click();
  await expect(page).toHaveURL(/\/study\/notes\/physics\/ph-solids$/);
  await page.goto('/study/notes/cards');
  await expect(page.getByRole('heading', { level: 1, name: 'Flash cards' })).toBeVisible();
  const physics = page.getByRole('link', { name: /^01 Physics / });
  await expect(physics).toContainText(/\d+ cards · \d+ new/);
  const before = Number(((await physics.textContent()) ?? '').match(/(\d+) cards/)![1]);
  await page.getByRole('group', { name: 'Cards' }).getByRole('button', { name: 'Formulas' }).click();
  const after = Number(((await physics.textContent()) ?? '').match(/(\d+) cards/)![1]);
  expect(after).toBeLessThan(before);
  await page.getByRole('group', { name: 'Cards' }).getByRole('button', { name: 'Both' }).click();

  // a subject's sitting is at most twenty cards, new ones in the notes' order
  await physics.click();
  await expect(page).toHaveURL(/\/study\/notes\/cards\/physics$/);
  await expect(page.getByText('Card 1 of 20 · new')).toBeVisible();
});

test('study notes: the formula sheet, the glossary and the tips', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/study/notes');
  await expect(page.getByRole('heading', { level: 2, name: 'Up Next' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Study Tools' })).toBeVisible();

  // formulas: by subject, and covered to test yourself
  await page.getByRole('link', { name: /Formula sheet/ }).click();
  await expect(page).toHaveURL(/\/study\/notes\/formulas$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Formula sheet' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Physics' })).toBeVisible();
  await page.getByRole('navigation', { name: 'Subject' }).getByRole('link', { name: 'Maths', exact: true }).click();
  await expect(page).toHaveURL(/\/study\/notes\/formulas\/maths$/);
  await expect(page.getByRole('link', { name: 'Maths', exact: true })).toHaveAttribute('aria-current', 'page');
  const shown = await page.locator('.nt-fsheet .nt-f').count();
  expect(shown).toBeGreaterThan(20);
  await page.getByRole('group', { name: 'Formulas' }).getByRole('button', { name: 'Covered' }).click();
  await expect(page.locator('.nt-fsheet .nt-f')).toHaveCount(0);
  await page.getByRole('button', { name: /^Show the formulas for / }).first().click();
  await expect(page.locator('.nt-fsheet .nt-f')).toHaveCount(1);

  // the glossary finds a term from any subject
  await page.goto('/study/notes/glossary');
  await expect(page.getByRole('heading', { level: 1, name: 'Glossary' })).toBeVisible();
  await page.getByRole('searchbox', { name: 'Find a term' }).fill('young modulus');
  await expect(page.getByText('Young modulus', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Physics · Solid Materials' }).first().click();
  await expect(page).toHaveURL(/\/study\/notes\/physics\/ph-solids$/);

  // tips and mistakes, one kind at a time
  await page.goto('/study/notes/tips/cs');
  await expect(page.getByRole('heading', { level: 1, name: 'Tips and mistakes' })).toBeVisible();
  const items = page.locator('.nt-tips__i');
  await expect(items.first()).toBeVisible();
  const both = await items.count();
  expect(both).toBeGreaterThan(3);
  await page.getByRole('group', { name: 'Show' }).getByRole('button', { name: 'Mistakes' }).click();
  expect(await items.count()).toBeLessThan(both);
  await expect(items.getByText('Examiner’s tip')).toHaveCount(0);
  await expect(items.getByText('Common mistake').first()).toBeVisible();
});
