import { expect, test } from '@playwright/test';

test('omikuji: shake the box, read the fortune, and it is the same when you come back', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: "Today's fortune. Shake the box" }).click();
  const dialog = page.getByRole('dialog', { name: "Today's fortune" });
  await dialog.getByRole('button', { name: 'Shake the box' }).click();
  // celebrations are off in these tests, so the paper comes straight away
  const rank = await dialog.getByRole('heading', { level: 2 }).textContent();
  expect(rank).toBeTruthy();
  await expect(dialog.getByText('Just for fun.', { exact: false })).toBeVisible();
  await dialog.getByRole('button', { name: 'Close' }).click();
  await expect(dialog).toBeHidden();

  await page.reload();
  const card = page.getByRole('button', { name: `Today's fortune: ${rank}. Open` });
  await expect(card).toBeVisible();
  await card.click();
  await expect(dialog.getByRole('heading', { level: 2 })).toHaveText(rank!);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('episode: last week plays from real numbers, then next time on…', async ({ page }) => {
  await page.goto('/progress');
  await page.getByRole('button', { name: "Watch last week's episode" }).click();
  const ep = page.getByRole('dialog', { name: "Last week's episode" });
  // nothing logged last week: the quiet title, then straight on to what's next
  await expect(ep.getByRole('heading', { name: 'The Quiet Week' })).toBeVisible();
  await ep.getByRole('button', { name: 'Next' }).click();
  await ep.getByRole('button', { name: 'Next' }).click();
  await expect(ep.getByText('Next time on LifeTracker')).toBeVisible();
  await ep.getByRole('button', { name: 'Back' }).click();
  await ep.getByRole('button', { name: 'Next' }).click();
  await ep.getByRole('button', { name: 'Done' }).click();
  await expect(ep).toBeHidden();
});

test('drone: a tap talks, five fast pokes make it dizzy, and the settings turn the sky off', async ({ page }) => {
  await page.goto('/');
  const drone = page.getByRole('button', { name: 'Talk to your drone' });
  await drone.click();
  await expect(page.getByRole('status').filter({ hasText: /XP|Wha/ }).first()).toBeVisible();
  await drone.evaluate((el: HTMLElement) => { for (let i = 0; i < 5; i++) el.click(); });
  await expect(page.getByText(/Everything is spinning/)).toBeVisible();

  await page.goto('/settings');
  await page.getByRole('switch', { name: /Seasons and time of day on Home/ }).click();
  await page.goto('/');
  await expect(page.locator('.h-wx')).toHaveCount(0);
});

test('rarity: a wish is guessed one, can be changed, and the row shows it', async ({ page }) => {
  await page.goto('/bucket');
  const input = page.getByRole('textbox').first();
  await input.fill('Eat the best ramen in Tokyo');
  await input.press('Enter');
  await page.getByRole('button', { name: /^Eat the best ramen in Tokyo/ }).click();
  const sheet = page.getByRole('dialog', { name: 'On the list' });
  await sheet.getByRole('button', { name: /Taste/ }).click();
  await expect(sheet.getByRole('button', { name: /Common$/ })).toHaveAttribute('aria-pressed', 'true');
  await sheet.getByRole('button', { name: /Legendary$/ }).click();
  await sheet.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('.bk-row[data-rarity="legendary"]')).toHaveCount(1);
  await expect(page.getByLabel('Legendary wish')).toBeVisible();
});

test('a section picture answers a tap, and the header buttons still work', async ({ page }) => {
  await page.goto('/gym');
  const head = page.locator('header.i-chhead');
  await head.click({ position: { x: 300, y: 150 } });
  await expect(head).toHaveAttribute('data-poke', '');
  await expect(head).not.toHaveAttribute('data-poke', '', { timeout: 3000 });
  await head.getByRole('button', { name: 'Home' }).click();
  await expect(page).toHaveURL(/\/$/);
});

test('the kanji cut plays going into a section, without holding anything up', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('lifetracker-fx', 'full'));
  await page.goto('/');
  await page.getByRole('link', { name: /Reading/ }).or(page.getByRole('button', { name: /^Reading/ })).first().click();
  await expect(page.locator('.dr')).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1, name: 'Reading' })).toBeVisible();
  await expect(page.locator('.dr')).toHaveCount(0);
});
