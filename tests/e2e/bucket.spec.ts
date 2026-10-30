import { expect, test } from '@playwright/test';

test('bucket list: add one, paste a list, cross off with its reward, put it back', async ({ page }) => {
  await page.goto('/bucket');
  const add = page.getByLabel('Add to your bucket list');
  await add.fill('See the northern lights');
  await add.press('Enter');
  await expect(add).toHaveValue('');
  await expect(add).toBeFocused();
  // a pasted list adds every line, without its bullets, and skips what's already there
  await add.evaluate((el) => {
    const dt = new DataTransfer();
    dt.setData('text', '- Learn to surf\n- See the northern lights\n• Visit Kyoto');
    el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  });
  const todo = page.getByRole('list', { name: 'To do' });
  await expect(todo.getByRole('listitem')).toHaveCount(3);
  await expect(page.getByText('Added 2 · 1 already on the list')).toBeVisible();

  await page.getByRole('button', { name: 'Cross off: Learn to surf' }).click();
  const reward = page.getByRole('dialog', { name: 'What you earned' });
  await expect(reward.getByText('Bucket list · Learn to surf (1 of 3)')).toBeVisible();
  await reward.getByRole('button', { name: 'OK' }).click();
  await expect(page.getByRole('list', { name: 'Crossed off' }).getByText('Learn to surf')).toBeVisible();
  await expect(todo.getByRole('listitem')).toHaveCount(2);

  // put it back from its sheet
  await page.getByRole('list', { name: 'Crossed off' }).getByRole('button', { name: /Learn to surf/ }).click();
  await page.getByRole('dialog', { name: 'Crossed off' }).getByRole('button', { name: 'Not done yet' }).click();
  await expect(todo.getByRole('listitem')).toHaveCount(3);
});
