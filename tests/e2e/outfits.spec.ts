import { expect, test, type Page } from '@playwright/test';

/** Each body keeps its own outfit (local-only). Items are handed over by a claim row, as a prize would be. */
const wardrobe = (page: Page) => page.getByRole('group', { name: 'What to change' });

async function wear(page: Page, body: RegExp) {
  await wardrobe(page).getByRole('button', { name: 'Body' }).click();
  await page.getByRole('button', { name: body }).click();
  const card = page.locator('.gm-detail');
  await card.getByRole('button', { name: 'Wear it' }).click();
  await card.getByRole('button', { name: 'Close' }).click();
}

const pressed = (page: Page, name: string) => page.locator('.gm-grid .gm-card[aria-pressed="true"]').filter({ hasText: name });

test('outfits: every body keeps what it was wearing', async ({ page }) => {
  await page.goto('/hangar');
  await expect(page.getByRole('heading', { name: 'Hangar', level: 1 })).toBeVisible();
  await page.evaluate(async () => {
    const st = await import('/src/features/game/store.ts' as string);
    st.claimOnce('test:outfits', { items: ['chassis:tanuki:1', 'chassis:tin:1', 'hat:cap', 'hat:crown', 'pet:cat'] });
  });

  // The Tanuki gets a bottle cap and a cat.
  await wear(page, /^Tanuki Tinker, .*built/);
  await wardrobe(page).getByRole('button', { name: 'Headgear' }).click();
  await page.locator('.gm-card').filter({ hasText: 'Bottle Cap' }).click();
  await wardrobe(page).getByRole('button', { name: 'Companion' }).click();
  await page.locator('.gm-card').filter({ hasText: 'Roof Cat' }).click();

  // The Tin Toy starts bare, and gets a crown.
  await wear(page, /^Tin Toy, .*built/);
  await wardrobe(page).getByRole('button', { name: 'Headgear' }).click();
  await expect(pressed(page, 'None')).toHaveCount(1);
  await page.locator('.gm-card').filter({ hasText: 'Crown' }).click();
  await wardrobe(page).getByRole('button', { name: 'Companion' }).click();
  await expect(pressed(page, 'None')).toHaveCount(1);

  // Back to the Tanuki: its own cap and cat come back.
  await wear(page, /^Tanuki Tinker, .*built/);
  await wardrobe(page).getByRole('button', { name: 'Headgear' }).click();
  await expect(pressed(page, 'Bottle Cap')).toHaveCount(1);
  await wardrobe(page).getByRole('button', { name: 'Companion' }).click();
  await expect(pressed(page, 'Roof Cat')).toHaveCount(1);

  // And it all survives a reload: the Tin Toy still has its crown.
  await page.waitForTimeout(600);
  await page.reload();
  await wear(page, /^Tin Toy, .*built/);
  await wardrobe(page).getByRole('button', { name: 'Headgear' }).click();
  await expect(pressed(page, 'Crown')).toHaveCount(1);
});
