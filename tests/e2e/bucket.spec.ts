import { expect, test } from '@playwright/test';

test('bucket list: add one, paste a list, cross off with its reward, put it back', async ({ page }) => {
  await page.goto('/bucket');
  const add = page.getByLabel('Add to your bucket list');
  await add.fill('See the northern lights');
  // where it will go is guessed from the words as you type
  await expect(page.getByRole('button', { name: 'Goes to Places to go. Tap to change' })).toBeVisible();
  await add.press('Enter');
  await expect(add).toHaveValue('');
  await expect(add).toBeFocused();
  // a pasted list adds every line, without its bullets, and skips what's already there
  await add.evaluate((el) => {
    const dt = new DataTransfer();
    dt.setData('text', '- Learn to surf\n- See the northern lights\n• Visit Kyoto');
    el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  });
  const crossButtons = page.getByRole('button', { name: /^Cross off: / });
  await expect(crossButtons).toHaveCount(3);
  await expect(page.getByText('Added 2 · 1 already on the list')).toBeVisible();
  // sorted into sections
  await expect(page.getByRole('list', { name: 'Places to go' }).getByRole('listitem')).toHaveCount(2);
  await expect(page.getByRole('list', { name: 'Adventures' }).getByRole('listitem')).toHaveCount(1);

  await page.getByRole('button', { name: 'Cross off: Learn to surf' }).click();
  const reward = page.getByRole('dialog', { name: 'What you earned' });
  await expect(reward.getByText('Bucket list · Learn to surf (1 of 3)')).toBeVisible();
  await reward.getByRole('button', { name: 'OK' }).click();
  await expect(page.getByRole('list', { name: 'Crossed off' }).getByText('Learn to surf')).toBeVisible();
  await expect(crossButtons).toHaveCount(2);

  // put it back from its sheet
  await page.getByRole('list', { name: 'Crossed off' }).getByRole('button', { name: /Learn to surf/ }).click();
  await page.getByRole('dialog', { name: 'Crossed off' }).getByRole('button', { name: 'Not done yet' }).click();
  await expect(crossButtons).toHaveCount(3);
});

test('bucket list: move a wish, give it this year and a next step that becomes a task, take an idea', async ({ page }) => {
  await page.goto('/bucket');
  const add = page.getByLabel('Add to your bucket list');
  await add.fill('Run the Tokyo Marathon');
  await add.press('Enter');
  await add.fill('Something only I understand');
  await add.press('Enter');
  await expect(page.getByRole('list', { name: 'Body & sport' }).getByRole('listitem')).toHaveCount(1);
  await expect(page.getByRole('list', { name: 'Wild cards' }).getByRole('listitem')).toHaveCount(1);

  // move the wild card to Love & people
  await page.getByRole('button', { name: 'Something only I understand', exact: true }).click();
  let sheet = page.getByRole('dialog', { name: 'On the list' });
  await sheet.getByRole('button', { name: /People/ }).click();
  await sheet.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('list', { name: 'Love & people' }).getByRole('listitem')).toHaveCount(1);
  await expect(page.getByRole('list', { name: 'Wild cards' })).toHaveCount(0);

  // this year + a next step, made into a task
  await page.getByRole('button', { name: 'Run the Tokyo Marathon', exact: true }).click();
  sheet = page.getByRole('dialog', { name: 'On the list' });
  await sheet.getByRole('button', { name: 'This year' }).click();
  await sheet.getByPlaceholder(/Look up flights/).fill('Enter the ballot');
  await sheet.getByRole('button', { name: 'Make the step a task' }).click();
  await expect(sheet.getByText('In your tasks: “Enter the ballot”.')).toBeVisible();
  await sheet.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('list', { name: 'This year' }).getByText('Run the Tokyo Marathon')).toBeVisible();
  await expect(page.getByText('→ Enter the ballot')).toBeVisible();

  // ideas like yours: one tap puts it in its section
  const ideas = page.getByRole('list', { name: 'Ideas' });
  await expect(ideas.getByRole('listitem')).toHaveCount(6);
  const first = ideas.getByRole('button', { name: /^Add idea: / }).first();
  const title = ((await first.getAttribute('aria-label')) ?? '').replace('Add idea: ', '');
  await first.click();
  await expect(page.getByRole('button', { name: `Cross off: ${title}` })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Cross off: / })).toHaveCount(3);

  await page.goto('/tasks');
  await expect(page.getByText('Enter the ballot')).toBeVisible();
});
