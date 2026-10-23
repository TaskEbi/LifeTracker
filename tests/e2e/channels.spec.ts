import { expect, test } from '@playwright/test';

test('sports: a run works out its pace and shows as a best', async ({ page }) => {
  await page.goto('/sports');
  await page.getByRole('button', { name: /Log a session/ }).click();
  const sheet = page.getByRole('dialog', { name: 'CH03 · log sport' });
  await sheet.getByRole('button', { name: '45', exact: true }).click();
  await sheet.getByLabel('Distance in km').fill('8');
  await expect(sheet.getByText('5:38 /km')).toBeVisible();
  await sheet.getByRole('button', { name: 'Save' }).click();
  await page.getByRole('dialog', { name: 'What you earned' }).getByRole('button', { name: 'OK' }).click();
  await expect(page.locator('.i-row').filter({ hasText: 'Fastest (5+ km)' })).toContainText('5:38 /km');
  await page.reload();
  await expect(page.locator('.i-row').filter({ hasText: '8 km · 5:38 /km' })).toHaveCount(1);
});

test('study: a session per subject, a mark with a bad score refused', async ({ page }) => {
  await page.goto('/study');
  await page.getByRole('button', { name: /^Physics:/ }).click();
  const sheet = page.getByRole('dialog', { name: 'CH05 · log study' });
  await expect(sheet.getByRole('group', { name: 'Subject' }).getByRole('button', { name: 'Physics' })).toHaveAttribute('aria-pressed', 'true');
  await sheet.getByLabel('Topic').fill('SHM');
  await sheet.getByRole('button', { name: 'Save' }).click();
  await page.getByRole('dialog', { name: 'What you earned' }).getByRole('button', { name: 'OK' }).click();
  await expect(page.getByRole('button', { name: /^Physics: 45 ?min in 4 weeks/ })).toBeVisible();

  await page.getByRole('button', { name: '+ Mark' }).click();
  const mark = page.getByRole('dialog', { name: 'Add a mark' });
  await mark.getByLabel('Score').fill('60');
  await mark.getByLabel('Out of').fill('50');
  await expect(mark.getByRole('button', { name: 'Save mark' })).toBeDisabled();
  await mark.getByLabel('Score').fill('41');
  await expect(mark.getByText('82%')).toBeVisible();
  await mark.getByRole('button', { name: 'Save mark' }).click();
  await expect(page.locator('.i-row').filter({ hasText: '41/50' })).toContainText('82%');
});

test('coding: Road to IOI counts down to the next stage and a session raises a gate', async ({ page }) => {
  await page.goto('/coding');
  await expect(page.getByRole('heading', { name: /to JOI First Round/i })).toBeVisible();
  await expect(page.getByText(/0\s*gates raised/)).toBeVisible();
  await page.getByRole('button', { name: /Log a session · raise a gate/ }).click();
  const sheet = page.getByRole('dialog', { name: 'CH02 · log coding' });
  await sheet.getByRole('button', { name: 'More problems solved' }).click();
  await sheet.getByLabel('What clicked').fill('Prefix sums on the diagonal');
  await sheet.getByRole('button', { name: /^Save/ }).click();
  await page.getByRole('dialog', { name: 'What you earned' }).getByRole('button', { name: 'OK' }).click();
  await expect(page.getByText(/1\s*gate raised/)).toBeVisible();
  await page.getByRole('button', { name: 'All coding' }).click();
  await expect(page.locator('.i-row').filter({ hasText: '1 AC · Prefix sums' })).toHaveCount(1);
});

test('chess: Chess.com data is labelled live, and a failed fetch shows no numbers', async ({ page }) => {
  const games = {
    games: [
      {
        url: 'https://www.chess.com/game/live/1',
        end_time: Math.floor(Date.now() / 1000) - 60,
        time_control: '600',
        time_class: 'rapid',
        rules: 'chess',
        rated: true,
        pgn: '[UTCDate "2026.10.23"]\n[StartTime "10:00:00"]\n[EndDate "2026.10.23"]\n[EndTime "10:15:00"]',
        white: { username: 'GM_TaskTaskPro', rating: 1445, result: 'win' },
        black: { username: 'opponent', rating: 1400, result: 'resigned' },
      },
    ],
  };
  await page.route('https://api.chess.com/pub/player/gm_tasktaskpro/stats', (r) => r.fulfill({ json: { chess_rapid: { last: { rating: 1445 }, best: { rating: 1571 }, record: { win: 1, loss: 0, draw: 0 } } } }));
  await page.route('https://api.chess.com/pub/player/gm_tasktaskpro/games/archives', (r) => r.fulfill({ json: { archives: ['https://api.chess.com/pub/player/gm_tasktaskpro/games/2026/10'] } }));
  await page.route('https://api.chess.com/pub/player/gm_tasktaskpro/games/2026/10', (r) => r.fulfill({ json: games }));
  await page.goto('/chess');
  await expect(page.getByText("From Chess.com's public API for gm_tasktaskpro")).toBeVisible();
  await expect(page.locator('.i-row').filter({ hasText: 'vs opponent' })).toContainText('1445');

  await page.unroute('**/*');
  await page.route('https://api.chess.com/**', (r) => r.fulfill({ status: 404, body: '{}' }));
  await page.getByRole('button', { name: 'refresh' }).click();
  await expect(page.getByRole('alert')).toHaveText('No Chess.com player with that username.');
  await expect(page.getByText('1445')).toHaveCount(0);
});
