import { expect, test } from '@playwright/test';

test('study notes: subjects, a topic, ticking a section, search and the next topic', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/study');
  await page.getByRole('button', { name: /^Study notes/ }).click();
  await expect(page).toHaveURL(/\/study\/notes$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Study notes' })).toBeVisible();

  // four subjects in the index, each with its board
  for (const s of ['Physics', 'Maths', 'Further Maths', 'Computer Science']) await expect(page.getByRole('link', { name: new RegExp(`^[0-9]+ ${s} `) })).toBeVisible();

  // the disc in front opens its subject; the arrows move along the row
  await page.getByRole('button', { name: 'Open Physics' }).click();
  await expect(page).toHaveURL(/\/study\/notes\/physics$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Physics' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Motion in a Line' })).toBeVisible();
  await page.getByRole('button', { name: 'Next disc' }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Vectors and Projectiles' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Previous disc' })).toBeEnabled();
  await expect(page.getByRole('heading', { level: 2, name: 'Waves and Electricity' })).toBeVisible();

  // a topic from the index
  await page.getByRole('link', { name: /Solid Materials/ }).click();
  await expect(page).toHaveURL(/\/study\/notes\/physics\/ph-solids$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Solid Materials' })).toBeVisible();
  await expect(page.getByText('Force per unit cross-sectional area')).toBeVisible();
  await expect(page.getByRole('img', { name: /A ductile metal/ })).toBeVisible();
  await expect(page.getByText('0 of 3 sections')).toBeVisible();

  // tick two sections; the count follows and survives a reload
  const boxes = page.getByRole('checkbox', { name: 'I understand this section' });
  await expect(boxes).toHaveCount(3);
  await boxes.nth(0).check();
  await boxes.nth(1).check();
  await expect(page.getByText('2 of 3 sections')).toBeVisible();
  await page.reload();
  await expect(page.getByText('2 of 3 sections')).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'I understand this section' }).nth(0)).toBeChecked();
  await page.getByRole('checkbox', { name: 'I understand this section' }).nth(1).uncheck();
  await expect(page.getByText('1 of 3 sections')).toBeVisible();

  // logging time opens the Study sheet with the subject chosen
  await page.getByRole('button', { name: 'Log time' }).click();
  await expect(page.getByRole('dialog', { name: 'CH05 · log study' })).toBeVisible();
  await page.keyboard.press('Escape');

  // search finds a key term in another subject
  await page.getByRole('button', { name: 'Search the notes' }).click();
  await page.getByRole('searchbox', { name: 'Search topics and key terms' }).fill('foreign key');
  await page.getByRole('link', { name: /Foreign key/ }).click();
  await expect(page).toHaveURL(/\/study\/notes\/cs\/cs-databases$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Databases' })).toBeVisible();
  await expect(page.getByText('CREATE TABLE Student')).toBeVisible();

  // on to the next topic, and the full CS site is linked where it covers the topic
  await page.getByRole('link', { name: 'Next topic: Algorithm Design' }).click();
  await expect(page).toHaveURL(/\/study\/notes\/cs\/cs-algorithms$/);
  await page.goto('/study/notes/cs/cs-comm');
  await expect(page.getByRole('link', { name: /Full notes, labs and flashcards for Topic 2/ })).toHaveAttribute('href', 'https://csrevisiontopic2.netlify.app');

  // the Study desk shows what's been understood
  await page.goto('/study');
  await expect(page.getByRole('button', { name: /^Study notes/ })).toContainText('1 section understood across 1 topic');
});
