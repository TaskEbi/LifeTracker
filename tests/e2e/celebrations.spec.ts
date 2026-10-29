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
  const group = page.getByRole('group', { name: 'Preview celebrations · Core', exact: true });
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

test('celebrations: new scenes preview, announce themselves and put the page back', async ({ page }) => {
  await page.goto('/settings');
  const fx = page.locator('.fx[role="dialog"]');
  const shellLeft = () => page.evaluate(() => [...document.querySelectorAll('.i-main, .i-cmd')].map((e) => [getComputedStyle(e).transform, e.getAnimations().length, (e as HTMLElement).style.clipPath].join('|')));

  // a section's own level-up (violin's curtain call)
  const sections = page.getByRole('group', { name: 'Preview celebrations · Section level-ups', exact: true });
  await sections.getByRole('button', { name: /^Violin · LV/ }).click();
  await expect(fx).toContainText('Preview — nothing earned');
  await expect(fx.locator('.fx-vl')).toHaveCount(1);
  await expect(page.locator('.fx-sr')).toContainText('Preview, nothing earned. Violin level up');
  // plays to the end by itself, then everything is back in place
  await expect(fx).toHaveCount(0, { timeout: 6000 });
  await expect(page.locator('.i-shell')).not.toHaveClass(/is-fx/);
  expect(await shellLeft()).toEqual(['none|0|', 'none|0|']);

  // a moment (combo), labelled as using sample numbers when it does
  const days = page.getByRole('group', { name: 'Preview celebrations · Days', exact: true });
  await days.getByRole('button', { name: /^Combo/ }).click();
  await expect(fx.locator('.fx-cb2')).toHaveCount(1);
  await expect(page.locator('.fx-sr')).toContainText(/Preview, nothing earned\. \d hit combo/);
  await fx.getByRole('button', { name: 'Skip' }).click();
  await expect(fx).toHaveCount(0);

  // a whole group queues one after another
  const special = page.getByRole('group', { name: 'Preview celebrations · Special', exact: true });
  await special.getByRole('button', { name: 'Play all' }).click();
  await expect(fx.getByRole('button', { name: 'Skip all' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(fx).toHaveCount(0);
  await expect(page.locator('.i-shell')).not.toHaveClass(/is-fx/);
  expect(await shellLeft()).toEqual(['none|0|', 'none|0|']);
  await expect(page.getByRole('dialog', { name: 'What you earned' })).toHaveCount(0);

  // calm: the same moment as a card
  await page.getByRole('group', { name: 'Celebrations · this device' }).getByRole('button', { name: 'Calm' }).click();
  await page.getByRole('group', { name: 'Preview celebrations · Records', exact: true }).getByRole('button', { name: /^Distance/ }).click();
  await expect(fx.locator('.fx-calm')).toContainText('500 km');
  await fx.getByRole('button', { name: 'Skip' }).click();
  await expect(fx).toHaveCount(0);
});
