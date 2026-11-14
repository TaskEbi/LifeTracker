import { expect, test } from '@playwright/test';

/**
 * Motion: nine 3D scenes. Headless WebKit may have no WebGL, so these check the page around the
 * canvas: it opens, says the numbers are samples when nothing is logged, switches scenes and keeps
 * the address in step, and either draws (a HUD appears) or says plainly that it can't.
 */
test('motion: opens from Home, switches scenes, and goes back', async ({ page }) => {
  await page.goto('/home/more');
  await page.getByRole('button', { name: /^Motion/ }).first().click();
  await expect(page).toHaveURL(/\/motion$/);
  await expect(page.getByRole('heading', { name: /Motion/, level: 1 })).toBeVisible();
  await expect(page.getByText('Sample data')).toBeVisible();

  const tabs = page.getByRole('navigation', { name: 'Scenes' });
  await expect(tabs.getByRole('button')).toHaveCount(9);
  await expect(tabs.getByRole('button', { name: 'Core' })).toHaveAttribute('aria-current', 'page');
  const drew = page.locator('.mo-hud');
  const cannot = page.getByText(/couldn’t start 3D drawing/);
  await expect(drew.or(cannot).first()).toBeVisible();

  for (const name of ['Deck', 'Year', 'Fusion', 'Orbit', 'Ridges', 'Prism', 'Galaxy', 'Tunnel']) {
    await tabs.getByRole('button', { name }).click();
    await expect(tabs.getByRole('button', { name })).toHaveAttribute('aria-current', 'page');
    await expect(page).toHaveURL(new RegExp(`/motion/${name.toLowerCase()}$`));
    await expect(drew.or(cannot).first()).toBeVisible();
  }

  // a reload comes back to the same scene
  await page.reload();
  await expect(tabs.getByRole('button', { name: 'Tunnel' })).toHaveAttribute('aria-current', 'page');

  await page.getByRole('button', { name: 'Back to Home' }).click();
  await expect(page).toHaveURL(/\/home\/more$/);
});
