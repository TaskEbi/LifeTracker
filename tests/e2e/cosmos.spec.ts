import { expect, test, type Page } from '@playwright/test';

const shot = async (page: Page, name: string) => {
  if (!process.env.COSMOS_SHOTS) return;
  await page.screenshot({ path: `${process.env.COSMOS_SHOTS}/${name}-top.png` });
  await page.locator('.cz-rooms').evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await page.screenshot({ path: `${process.env.COSMOS_SHOTS}/${name}.png` });
  await page.evaluate(() => window.scrollTo(0, 0));
};

/** Put a save in the records (and wait for IndexedDB, so a reload finds it). `ago` is how long since it was last open. */
async function seed(page: Page, over: Record<string, unknown>, ago = 0) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Focus mode' }).or(page.locator('.h-focus'))).toBeVisible();
  await page.evaluate(
    async ({ over, ago }) => {
      const store = await import('/src/data/store.ts' as string);
      const cs = await import('/src/features/game/cosmosStore.ts' as string);
      const cosmos = await import('/src/domain/game/cosmos.ts' as string);
      const t = new Date().toISOString();
      const save = { ...cosmos.freshCosmos(Date.now() - ago), ...over };
      store.commit('lt_records', [{ id: cs.COSMOS_ROW, section: 'cabinet', kind: 'gm_cosmos', data: save, sort_order: 0, archived_at: null, created_at: t, updated_at: t, deleted_at: null }]);
      for (let i = 0; i < 100; i++) {
        const db = store.currentSession()?.db;
        if (!db) break;
        const rows = await db.getAll('lt_records');
        if (rows.some((r: { id: string }) => r.id === cs.COSMOS_ROW)) break;
        await new Promise((r) => setTimeout(r, 100));
      }
    },
    { over, ago },
  );
}

const rooms = (page: Page) => page.getByRole('navigation', { name: 'The Cosmos' });
const leave = async (page: Page) => {
  await page.getByRole('navigation', { name: 'Hangar' }).getByRole('button', { name: /Ledger/ }).click();
  await page.waitForTimeout(400);
};

test('cosmos: tap for dust, buy a body, and it is still there after a reload', async ({ page }) => {
  // A stopped clock: only taps make dust, so the numbers are exact.
  await page.clock.setFixedTime(new Date('2026-11-15T03:00:00Z'));
  await page.goto('/hangar/cosmos');
  await expect(page.getByRole('navigation', { name: 'Hangar' }).getByRole('button', { name: 'Cosmos', exact: true })).toHaveAttribute('aria-current', 'page');
  const core = page.getByRole('button', { name: 'Gather dust' });
  await expect(core).toBeVisible();
  const buy = page.getByRole('button', { name: /^Buy 1 Mote Net for 10 dust/ });
  await expect(buy).toBeDisabled();
  // The layers above (and the Lab) are not on the map yet.
  await expect(rooms(page).getByRole('button', { name: 'Not found yet' })).toHaveCount(5);
  for (let i = 0; i < 12; i++) await core.click();
  await expect(buy).toBeEnabled();
  await buy.click();
  await expect(page.locator('.cz-row', { hasText: 'Mote Net' })).toContainText('×1');
  await shot(page, 'start');

  await leave(page);
  await page.goto('/hangar/cosmos/log');
  await expect(page.locator('.cz-stats')).toContainText('Taps12');
  await rooms(page).getByRole('button', { name: 'Orbit' }).click();
  await expect(page.locator('.cz-row', { hasText: 'Mote Net' })).toContainText('×1');
});

test('cosmos: the sky gathers while you are away; Ignite pays starlight that lights the constellation', async ({ page }) => {
  // Twenty Mote Nets left for two hours, and enough dust in the run to Ignite.
  await seed(page, { gens: { net: 20 }, dust: 5e9, runDust: 5e9, life: 5e9 }, 2 * 3600_000);
  await page.goto('/home/arena');
  const door = page.getByRole('button', { name: /The Cosmos/ });
  await expect(door).toContainText(/dust waiting/);
  await door.click();
  await expect(page).toHaveURL(/\/hangar\/cosmos$/);
  const away = page.locator('.cz-away');
  await expect(away).toContainText('at 60%');
  await expect(away).toContainText(/gathered [\d,.]+[A-Za-z]* dust/);
  await away.getByRole('button', { name: 'Carry on' }).click();
  await expect(away).toHaveCount(0);

  await rooms(page).getByRole('button', { name: /Stars/ }).click();
  await expect(page).toHaveURL(/\/hangar\/cosmos\/stars$/);
  // Two presses: the first only arms it.
  const go = page.locator('.cz-layer .cz-go');
  await expect(go).toContainText('Ignite');
  await go.click();
  await expect(go).toContainText('Sure?');
  await go.click();
  await expect(page.locator('.cz-flash')).toContainText(/Ignite: \+\d+ starlight/);
  await expect(page.locator('.cz-layer__n')).toContainText('Done 1 time');
  await expect(page.locator('.cz-miles li').first()).toContainText('Reached');

  // Polaris costs one starlight.
  // The star twinkles, so press it without waiting for it to hold still.
  await page.getByRole('button', { name: /^Polaris/ }).dispatchEvent('click');
  await page.getByRole('button', { name: /Light Polaris for 1 starlight/ }).click();
  await expect(page.locator('.cz-node')).toContainText('Lit');
  await shot(page, 'stars');

  await leave(page);
  await page.goto('/hangar/cosmos/stars');
  await expect(page.locator('.cz-layer__n')).toContainText('Done 1 time');
  await expect(page.getByRole('button', { name: 'Polaris: lit' })).toBeVisible();
  await expect(page.locator('.cz-tally')).toContainText('1 / 19');
});

test('cosmos: the alignment, a bounty, research and the Orrery, kept after a reload', async ({ page }) => {
  // One Ignite done (so the Lab is open), a bounty already met, and dust to start research.
  await seed(page, {
    ignitesAll: 1, dust: 5e6, runDust: 5e6, life: 5e6, taps: 400,
    bounties: [{ n: 1, k: 'taps', need: 100, from: 200, pay: 2 }, { n: 2, k: 'bodies', need: 50, from: 0, pay: 1 }, { n: 3, k: 'stars', need: 1, from: 0, pay: 2 }],
    bountyN: 3,
  });
  await page.goto('/hangar/cosmos/board');
  // The alignment: shards and a Frenzy on the stage.
  await page.locator('.cz-daily').getByRole('button', { name: /Claim/ }).click();
  await expect(page.locator('.cz-daily')).toContainText('Aligned');
  await expect(page.locator('.cz-buff')).toContainText('Frenzy');
  await expect(page.getByRole('group', { name: 'What you hold' })).toContainText('3');
  // The bounty that's met pays its shards and another goes up.
  await page.getByRole('button', { name: /Claim 2 shards: Tap the core 100 times/ }).click();
  await expect(page.locator('.cz-tally')).toContainText('1 done');
  await expect(page.locator('.cz-bounty')).toHaveCount(3);
  await expect(page.getByRole('group', { name: 'What you hold' })).toContainText('5');
  await shot(page, 'board');

  // Research: start Fine Mesh (it costs dust and takes five minutes).
  await rooms(page).getByRole('button', { name: /Lab/ }).click();
  await page.getByRole('button', { name: /Start Fine Mesh for 100,000 dust/ }).click();
  await expect(page.locator('.cz-research.is-running')).toContainText('Fine Mesh');
  await expect(page.locator('.cz-research.is-running')).toContainText(/[45] m/);
  await shot(page, 'lab');

  // The Orrery: fit the first part.
  await rooms(page).getByRole('button', { name: /Orrery/ }).click();
  await page.getByRole('button', { name: /^Brass Gears, level 0/ }).click();
  await expect(page.locator('.cz-orrery')).toContainText('1 of 11 parts fitted');
  await shot(page, 'orrery');

  await leave(page);
  await page.goto('/hangar/cosmos/lab');
  await expect(page.locator('.cz-research.is-running')).toContainText('Fine Mesh');
  await rooms(page).getByRole('button', { name: /Board/ }).click();
  await expect(page.locator('.cz-daily')).toContainText('Aligned');
  await expect(page.locator('.cz-tally')).toContainText('1 done');
  await rooms(page).getByRole('button', { name: /Orrery/ }).click();
  await expect(page.locator('.cz-orrery')).toContainText('1 of 11 parts fitted');
});

test('cosmos: a shooting star crosses the stage and can be caught', async ({ page }) => {
  await seed(page, { gens: { net: 5 }, dust: 10, life: 10 });
  await page.goto('/hangar/cosmos');
  await expect(page.getByRole('button', { name: 'Gather dust' })).toBeVisible();
  // Bring the next star forward rather than wait a couple of minutes for it.
  await page.evaluate(async () => {
    const cs = await import('/src/features/game/cosmosStore.ts' as string);
    cs.cosmos.set({ star: { id: 99, born: Date.now(), top: 0.3, left: false } });
  });
  const star = page.getByRole('button', { name: 'Catch the shooting star' });
  await expect(star).toBeVisible();
  await page.locator('.cz-stage').evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(1500);
  if (process.env.COSMOS_SHOTS) await page.screenshot({ path: `${process.env.COSMOS_SHOTS}/star-stage.png` });
  await star.dispatchEvent('click');
  await expect(star).toHaveCount(0);
  await expect(page.locator('.cz-flash.is-gift')).toContainText(/Frenzy|Windfall|Rush|A shard/);
  await rooms(page).getByRole('button', { name: /Log/ }).click();
  await expect(page.locator('.cz-stats')).toContainText('Shooting stars caught1');
});

test('cosmos: challenges, relics and automation are kept', async ({ page }) => {
  // Well in: a Big Bang done, galaxies to spend, challenges and automation open.
  await seed(page, {
    dust: 4e40, runDust: 6e40, life: 3e60, gens: { net: 300, comet: 290, mill: 280, moon: 260, ring: 240, giant: 220, petal: 200, pulsar: 180 },
    light: 4e14, lightRun: 9e14, lightAll: 5e20, nodes: ['polaris', 'kindle', 'ember', 'prism', 'flare', 'chorus', 'cradle', 'vigil', 'halo'], ignites: 30,
    dark: 900, darkRun: 2000, darkAll: 5e13, voids: { density: 4, lumin: 3 }, collapses: 9,
    gal: 40, galRun: 60, galAll: 60, bangs: 3, relics: { mirror: 1 }, worn: ['mirror'], chals: { thin: 1, hands: 4 },
    ignitesAll: 400, collapsesAll: 40, bangsAll: 3, taps: 500,
  });
  await page.goto('/hangar/cosmos');
  await expect(page.getByRole('group', { name: 'What you hold' })).toContainText('galaxies');
  await shot(page, 'orbit');

  // Relics: find one more, and it goes on; the third hand came with the third Big Bang.
  await rooms(page).getByRole('button', { name: /Galaxies/ }).click();
  await expect(page.locator('.cz-tally')).toContainText('1 / 3 worn');
  await page.getByRole('button', { name: /Find Star Chart for 1 galaxies/ }).click();
  await expect(page.locator('.cz-tally')).toContainText('2 / 3 worn');
  await page.getByRole('button', { name: 'Take off Sun Mirror' }).click();
  await expect(page.locator('.cz-tally')).toContainText('1 / 3 worn');
  await shot(page, 'galaxies');

  // Automation: switch one off.
  await rooms(page).getByRole('button', { name: /Auto/ }).click();
  const ignite = page.getByRole('switch', { name: 'Ignite' });
  await expect(ignite).toHaveAttribute('aria-checked', 'true');
  await ignite.click();
  await expect(ignite).toHaveAttribute('aria-checked', 'false');
  await expect(page.getByRole('switch', { name: 'Big Bang' })).toBeDisabled();
  await shot(page, 'auto');

  // A challenge: two presses to start, and it says what it's doing.
  await rooms(page).getByRole('button', { name: /Void/ }).click();
  await shot(page, 'void');
  const start = page.locator('.cz-chal', { hasText: 'No Hands' }).getByRole('button');
  await start.click();
  await start.click();
  await expect(page.locator('.cz-chalbar')).toContainText('Challenge: No Hands, tier 5');
  await expect(page.locator('.cz-chal', { hasText: 'No Hands' })).toContainText('Running');
  await shot(page, 'challenge');

  await rooms(page).getByRole('button', { name: /Log/ }).click();
  await expect(page.locator('.cz-parts')).toContainText('All together');
  await shot(page, 'log');

  await leave(page);
  await page.goto('/hangar/cosmos/auto');
  await expect(page.locator('.cz-chalbar')).toContainText('No Hands');
  await expect(page.getByRole('switch', { name: 'Ignite' })).toHaveAttribute('aria-checked', 'false');
  await rooms(page).getByRole('button', { name: /Galaxies/ }).click();
  await expect(page.getByRole('button', { name: 'Wear Sun Mirror' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Take off Star Chart' })).toBeVisible();
});
