import { expect, test } from '@playwright/test';

test('home: three pages, each with its own address, and nothing lost between them', async ({ page }) => {
  await page.goto('/');
  const tabs = page.getByRole('navigation', { name: 'Home pages' });
  await expect(tabs.getByRole('button', { name: /Today/ })).toHaveAttribute('aria-current', 'page');
  // Today: the checklist, the character, the plan for today and the training
  await expect(page.getByRole('region', { name: 'Today’s checklist' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Your character' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Today and tomorrow' })).toBeVisible();
  await expect(page.getByRole('region', { name: "Today's training" })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Weekly boss', exact: true })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Hideout rooms' })).toHaveCount(0);

  // Arena: the game
  await tabs.getByRole('button', { name: /Arena/ }).click();
  await expect(page).toHaveURL(/\/home\/arena$/);
  await expect(page.getByRole('region', { name: 'Weekly boss', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: "Today's fortune. Shake the box" })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Today’s checklist' })).toHaveCount(0);

  // More: every section, the hideout rooms and the other pages
  await tabs.getByRole('button', { name: /More/ }).click();
  await expect(page).toHaveURL(/\/home\/more$/);
  await expect(page.getByRole('region', { name: 'Techniques: your sections' }).getByRole('button')).toHaveCount(12);
  await expect(page.getByRole('region', { name: 'Hideout rooms' })).toBeVisible();
  await page.getByRole('region', { name: 'Pages' }).getByRole('button', { name: /Bucket list/ }).click();
  await expect(page).toHaveURL(/\/bucket$/);

  // Back returns to the page you were on, and a reload keeps it
  await page.goBack();
  await expect(page).toHaveURL(/\/home\/more$/);
  await page.reload();
  await expect(tabs.getByRole('button', { name: /More/ })).toHaveAttribute('aria-current', 'page');

  // The Home button always goes to Today
  await page.getByRole('navigation', { name: 'Commands' }).getByRole('button', { name: /Home/ }).click();
  await expect(page).toHaveURL(/\/$/);
});
