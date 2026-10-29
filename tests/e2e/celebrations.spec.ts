import { expect, test } from '@playwright/test';

// The 3D celebrations on (the config turns them off for the other tests).
test.use({ storageState: { cookies: [], origins: [] } });

test('celebrations: a first session plays its celebrations, then the reward box', async ({ page }) => {
  await page.goto('/sports');
  await page.getByRole('button', { name: /Log a session/ }).click();
  const sheet = page.getByRole('dialog', { name: 'CH03 · log sport' });
  await sheet.getByRole('button', { name: '45', exact: true }).click();
  await sheet.getByRole('button', { name: 'Save' }).click();

  const fx = page.locator('.fx[role="dialog"]');
  await expect(fx).toBeVisible();
  await expect(fx).not.toContainText('Preview');
  // the reward box waits until the celebrations are over
  await expect(page.getByRole('dialog', { name: 'What you earned' })).toHaveCount(0);
  await expect(page.locator('.i-shell')).toHaveClass(/is-fx/);
  // Escape skips them all
  await page.keyboard.press('Escape');
  await expect(fx).toHaveCount(0);
  await expect(page.locator('.i-shell')).not.toHaveClass(/is-fx/);
  // nothing left tilted: the page and the command bar are back exactly
  const left = await page.evaluate(() => [...document.querySelectorAll('.i-main, .i-cmd')].map((e) => [getComputedStyle(e).transform, e.getAnimations().length, (e as HTMLElement).style.clipPath].join('|')));
  expect(left).toEqual(['none|0|', 'none|0|']);
  const reward = page.getByRole('dialog', { name: 'What you earned' });
  await reward.getByRole('button', { name: 'OK' }).click();
  await expect(reward).toHaveCount(0);
  // celebrated once: nothing replays
  await page.waitForTimeout(400);
  await expect(fx).toHaveCount(0);
});

test('celebrations: previews from Settings are labelled and earn nothing', async ({ page }) => {
  await page.goto('/settings');
  const group = page.getByRole('group', { name: 'Preview celebrations' });
  await group.getByRole('button', { name: /^Level up/ }).click();
  const fx = page.locator('.fx[role="dialog"]');
  await expect(fx).toContainText('Preview — nothing earned');
  await expect(page.locator('.fx-sr')).toContainText('Preview, nothing earned. Level up');
  await fx.getByRole('button', { name: 'Skip' }).click();
  await expect(fx).toHaveCount(0);
  await expect(page.getByRole('dialog', { name: 'What you earned' })).toHaveCount(0);

  // tap anywhere moves on; several queue one after another
  await group.getByRole('button', { name: 'Play all' }).click();
  await expect(fx).toBeVisible();
  await expect(fx.getByText(/^1 \/ \d+$/)).toHaveCount(0); // previews show the preview label instead
  await page.waitForTimeout(450);
  await fx.click({ position: { x: 200, y: 420 } });
  await expect(fx.getByRole('button', { name: 'Skip all' })).toBeVisible();
  await fx.getByRole('button', { name: 'Skip all' }).click();
  await expect(fx).toHaveCount(0);

  // Off: a save shows only the reward box
  await page.getByRole('group', { name: 'Celebrations · this device' }).getByRole('button', { name: 'Off' }).click();
  await page.goto('/study');
  await page.getByRole('button', { name: /^Physics:/ }).click();
  await page.getByRole('dialog', { name: 'CH05 · log study' }).getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('dialog', { name: 'What you earned' })).toBeVisible();
  await expect(fx).toHaveCount(0);
});
