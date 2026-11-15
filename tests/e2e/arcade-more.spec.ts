import { expect, test, type Page } from '@playwright/test';

/** A few days of sessions through the app's own save functions. */
async function seed(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Focus mode' }).or(page.locator('.h-focus'))).toBeVisible();
  await page.evaluate(async () => {
    const lt = await import('/src/data/lt.ts' as string);
    const log = await import('/src/data/logActions.ts' as string);
    const dates = await import('/src/domain/log/dates.ts' as string);
    const today = lt.ltToday();
    for (const s of ['violin', 'coding', 'study']) {
      const topic = lt.ensureSectionTopic(s);
      for (let d = 0; d < 20; d++) log.addEntry({ topic_id: topic, date: dates.addDays(today, -d), minutes: 50, note: '' });
    }
    const store = await import('/src/data/store.ts' as string);
    for (let i = 0; i < 100; i++) {
      const db = store.currentSession()?.db;
      if (!db) break;
      const entries = await db.getAll('log_entries');
      if (entries.length >= store.data.get().log_entries.size) break;
      await new Promise((r) => setTimeout(r, 100));
    }
  });
  await page.waitForTimeout(200);
}

const shot = (page: Page, name: string) => (process.env.ARCADE_SHOTS ? page.screenshot({ path: `${process.env.ARCADE_SHOTS}/${name}.png`, fullPage: true }) : Promise.resolve());
const game = (page: Page, name: RegExp) => page.getByRole('navigation', { name: 'Arcade games' }).getByRole('button', { name });

test.beforeEach(async ({ page }) => {
  // Two days after pachinko, the dojo and the vault opened, by day.
  await page.clock.setFixedTime(new Date('2026-11-17T03:00:00Z'));
});

test('arcade: with nothing logged there are no balls or challenges, and the vault is shut', async ({ page }) => {
  await page.goto('/hangar/arcade/pachinko');
  await expect(page.getByRole('button', { name: 'Drop a ball' })).toBeDisabled();
  await game(page, /Dojo/).click();
  await expect(page).toHaveURL(/\/hangar\/arcade\/dojo$/);
  await expect(page.getByRole('button', { name: 'Challenge' })).toBeDisabled();
  await game(page, /Vault/).click();
  await expect(page.getByText("The vault opens once you've logged something today.")).toBeVisible();
});

test('arcade: a ball, a duel and a cracked vault are each saved once', async ({ page }) => {
  await seed(page);

  // Pachinko: a ball down the second chute.
  await page.goto('/hangar/arcade/pachinko');
  const head = page.getByRole('heading', { name: /Pachinko/ }).locator('..');
  const balls = Number((await head.textContent())!.match(/(\d+) balls/)![1]);
  expect(balls).toBeGreaterThan(5);
  await page.getByRole('button', { name: 'Chute 2' }).click();
  await page.getByRole('button', { name: 'Drop a ball' }).click();
  await expect(page.getByRole('list', { name: 'Balls just dropped' })).toContainText('Ball 1');
  await expect(head).toContainText(`${balls - 1} balls`);
  await shot(page, 'pachinko');

  // The dojo: guard until it's over, one way or the other.
  await game(page, /Dojo/).click();
  await shot(page, 'dojo-ladder');
  await page.getByRole('button', { name: 'Challenge' }).click();
  await expect(page.getByRole('heading', { name: /Floor 1/ })).toBeVisible();
  const guard = page.getByRole('group', { name: 'Your stance' }).getByRole('button', { name: /^Guard/ });
  for (let i = 0; i < 80 && (await guard.count()); i++) {
    await guard.click();
    if (i === 1) await shot(page, 'dojo-duel');
  }
  await expect(page.getByText(/You won floor 1\.|You lost this one\./)).toBeVisible();
  await shot(page, 'dojo-over');
  await page.getByRole('button', { name: 'Back to the ladder' }).click();
  await expect(page.getByRole('list', { name: 'Latest duels' })).toContainText('Floor 1');

  // The vault: one wrong try, then the day's code.
  await game(page, /Vault/).click();
  const code: number[] = await page.evaluate(async () => {
    const lt = await import('/src/data/lt.ts' as string);
    const more = await import('/src/domain/game/arcadeMore.ts' as string);
    return more.codeFor(lt.ltToday());
  });
  const names = ['Fire', 'Water', 'Wood', 'Gold', 'Earth', 'Moon'];
  const keys = page.getByRole('group', { name: 'Symbols' });
  const enter = async (g: number[]) => {
    for (const s of g) await keys.getByRole('button', { name: names[s] }).click();
    await page.getByRole('button', { name: 'Try the lock' }).click();
  };
  await enter(code.map((s) => (s + 1) % 6));
  await expect(page.getByRole('list', { name: 'Your tries' }).getByRole('listitem')).toHaveCount(1);
  await shot(page, 'vault');
  await enter(code);

  // Everything survives a reload.
  await page.reload();
  await expect(page.getByText('Cracked.')).toBeVisible();
  await expect(page.getByRole('heading', { name: /The vault/ }).locator('..')).toContainText('cracked in 2');
  await shot(page, 'vault-open');
  await page.goto('/hangar/arcade/pachinko');
  await expect(page.getByRole('heading', { name: /Pachinko/ }).locator('..')).toContainText(`${balls - 1} balls`);
  await page.goto('/hangar/ledger');
  await expect(page.getByText(/^Pachinko: /).first()).toBeVisible();
  await expect(page.getByText(/Dojo: floor 1 (won|lost)/).first()).toBeVisible();
  await expect(page.getByText('Vault: cracked in 2').first()).toBeVisible();
});
