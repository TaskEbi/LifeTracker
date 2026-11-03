import { expect, test, type Page } from '@playwright/test';

const dialog = (page: Page, name: string | RegExp) => page.getByRole('dialog', { name });

test.beforeEach(async ({ page }) => {
  // These flows are about the tools; celebrations are covered elsewhere.
  await page.addInitScript(() => localStorage.setItem('lifetracker-fx', 'off'));
});

test('hideout: every room opens from the base and shows its lamp state', async ({ page }) => {
  await page.goto('/base');
  await expect(page.getByRole('heading', { name: 'Hideout', level: 1 })).toBeVisible();
  for (const [room, heading] of [
    ['War room', 'War room'],
    ['Dojo', 'Dojo'],
    ['Lab', 'Lab'],
    ['Observatory', 'Observatory'],
    ['Infirmary', 'Infirmary'],
    ['Armoury', 'Armoury'],
    ['Oracle', 'Oracle'],
    ['Vault', 'Vault'],
    ['Rituals', 'Rituals'],
    ['Hall of records', 'Hall of records'],
  ]) {
    await page.getByRole('button', { name: new RegExp(`^${room}:`) }).click();
    await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible();
    await page.locator('.hq-rh .i-home').click();
  }
});

test('scroll: a typed line logs everything in it, once, and says what it did not understand', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Log something' }).click();
  const sheet = dialog(page, 'Command');
  const input = sheet.getByLabel('Type what you did, or filter commands');
  await input.fill('violin 45 bach, ran 8k in 44, slept 23:30-7:10, screen 2h15, task buy rosin, wish see the aurora, flew to the moon');
  const preview = sheet.getByRole('region', { name: 'What this will log' });
  await expect(preview).toContainText('Violin · 45 min · bach');
  await expect(preview).toContainText('Running · 8 km · 44 min');
  await expect(preview).toContainText('Sleep · 23:30 → 07:10');
  await expect(preview).toContainText('Screen time · 2h 15m');
  await expect(preview).toContainText('New task · buy rosin');
  await expect(preview).toContainText('Bucket list · see the aurora');
  await expect(preview).toContainText('Not sure about “flew to the moon”');
  await preview.getByRole('button', { name: 'Log all 6' }).click();
  await page.getByRole('dialog', { name: 'What you earned' }).getByRole('button', { name: 'OK' }).click();

  await page.goto('/log');
  await expect(page.locator('.i-row').filter({ hasText: 'bach' })).toHaveCount(1);
  await page.goto('/tasks');
  await expect(page.getByText('buy rosin')).toBeVisible();
  await page.goto('/sports');
  await expect(page.locator('.i-row').filter({ hasText: '8 km' }).first()).toBeVisible();
  await page.goto('/sleep');
  await expect(page.getByText('23:30 → 07:10').first()).toBeVisible();
  await page.goto('/bucket');
  await expect(page.getByText('see the aurora').first()).toBeVisible();
});

test('scroll: a bare word still filters commands', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Log something' }).click();
  const sheet = dialog(page, 'Command');
  await sheet.getByLabel('Type what you did, or filter commands').fill('violin');
  await expect(sheet.getByRole('region', { name: 'What this will log' })).toHaveCount(0);
  await sheet.getByLabel('Type what you did, or filter commands').press('Enter');
  await expect(dialog(page, /violin/i)).toBeVisible();
});

test('next move: suggests something with a reason and starts it', async ({ page }) => {
  await page.goto('/');
  const card = page.getByRole('region', { name: 'Next move' });
  await card.getByRole('group', { name: 'Time you have' }).getByRole('button', { name: '60 min' }).click();
  await card.getByRole('group', { name: 'How you feel' }).getByRole('button', { name: 'Tired' }).click();
  const best = card.locator('.hc-move__best');
  await expect(best).toBeVisible();
  await expect(best.locator('small')).not.toBeEmpty();
  // The choice is remembered on this device.
  await page.reload();
  await expect(page.getByRole('region', { name: 'Next move' }).getByRole('group', { name: 'How you feel' }).getByRole('button', { name: 'Tired' })).toHaveAttribute('aria-pressed', 'true');
});

test('inner weather: a check-in from Home shows in the Lab', async ({ page }) => {
  await page.goto('/');
  const card = page.getByRole('region', { name: 'Inner weather' });
  await card.getByRole('button', { name: /Clear/ }).click();
  await card.getByRole('button', { name: 'Energy 4 of 5' }).click();
  await card.getByLabel('One line about today').fill('A good day');
  await card.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByRole('button', { name: /Inner weather today: Clear/ })).toBeVisible();
  await page.goto('/base/lab');
  await expect(page.getByRole('img', { name: /Inner weather, \d+: 1 days logged/ })).toBeVisible();
});

test('rituals: add one, tick it from Home, and the chain counts', async ({ page }) => {
  await page.goto('/base/rituals');
  await page.getByRole('button', { name: '+ New ritual' }).click();
  const sheet = dialog(page, 'New ritual');
  await sheet.getByLabel('What', { exact: true }).fill('Stretch calves');
  await sheet.getByLabel(/When: the cue/).fill('While the kettle boils');
  await sheet.getByRole('button', { name: 'Save' }).click();
  const tick = page.getByRole('checkbox', { name: 'Done: Stretch calves' });
  await tick.click();
  await expect(tick).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('.hq-rit__n')).toHaveText('1');
  await tick.click();
  await expect(page.locator('.hq-rit__n')).toHaveText('0');
});

test('dojo: a card comes up, flips, is graded, and is gone until it is due', async ({ page }) => {
  await page.goto('/base/dojo');
  await page.getByRole('button', { name: '+ Card' }).click();
  const sheet = dialog(page, 'New card');
  await sheet.getByLabel('Question').fill('What is the time complexity of a segment tree update?');
  await sheet.getByLabel('Answer').fill('O(log n)');
  await sheet.getByRole('button', { name: 'Save', exact: true }).click();
  await page.getByRole('button', { name: /^Start: 1 card/ }).click();

  const session = page.getByRole('region', { name: 'Recall session' });
  await expect(session.getByText('segment tree update')).toBeVisible();
  await session.getByRole('button', { name: 'Show answer' }).click();
  const grades = session.getByRole('group', { name: 'How well did you remember it' });
  await expect(grades.getByRole('button', { name: /Good/ })).toContainText('1d');
  // Forgotten: it comes round again in this sitting.
  await grades.getByRole('button', { name: /Again/ }).click();
  await expect(session.getByText('segment tree update')).toBeVisible();
  await session.getByRole('button', { name: 'Show answer' }).click();
  await grades.getByRole('button', { name: /Good/ }).click();

  await expect(page.getByRole('status').filter({ hasText: '2 reviews done, 1 to go again' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Nothing due. Come back tomorrow.' })).toBeDisabled();
});

test('dojo: a mistake with a cause shows up in where marks leak', async ({ page }) => {
  await page.goto('/base/dojo');
  await page.getByRole('button', { name: '+ Mistake' }).click();
  const sheet = dialog(page, 'Log a mistake');
  await sheet.getByLabel('The question, or what you got wrong').fill('Forgot the constant of integration');
  await sheet.getByLabel('What to do next time').fill('Write +c before anything else');
  await sheet.getByRole('group', { name: 'Why it went wrong' }).getByRole('button', { name: 'Careless slip' }).click();
  await sheet.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('.hq-bar').filter({ hasText: 'Careless slip' })).toContainText('1');
});

test('war room: review, seal, and the Big Three lands on Home', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-09T09:00:00+08:00') }); // a Monday
  await page.goto('/');
  await page.getByRole('button', { name: /Weekly review/ }).click();
  await expect(page.getByRole('heading', { name: 'War room', level: 1 })).toBeVisible();
  const flow = page.getByRole('region', { name: 'Weekly review' });
  await flow.getByRole('button', { name: 'Next' }).click();
  await flow.getByLabel('The best thing about it').fill('Ran further than ever');
  await flow.getByRole('button', { name: 'Next' }).click();
  await flow.getByLabel('Theme of the week').fill('Bed by eleven');
  await flow.getByLabel('Big Three, number 1').fill('Finish the Bach');
  await flow.getByLabel('Section for number 1').selectOption('violin');
  await flow.getByRole('button', { name: 'Next' }).click();
  await flow.getByRole('button', { name: 'Seal the plan' }).click();
  await expect(page.getByText('Sealed. Go and do it.')).toBeVisible();

  await page.goto('/');
  const card = page.getByRole('region', { name: "This week's Big Three" });
  await expect(card).toContainText('Bed by eleven');
  const tick = card.getByRole('checkbox', { name: /Finish the Bach/ });
  await tick.click();
  await expect(tick).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('button', { name: /^Weekly review/ })).toHaveCount(0);
});

test('vault: a sealed letter stays hidden until its day, then opens with then and now', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-04T09:00:00+08:00') });
  await page.goto('/base/vault');
  await page.getByRole('button', { name: '+ Write to future you' }).click();
  const sheet = dialog(page, 'Seal a time capsule');
  await sheet.getByLabel('The letter').fill('Did you keep going?');
  await sheet.getByLabel(/On the envelope/).fill('To me, next month');
  await sheet.getByRole('group', { name: 'When to open' }).getByRole('button', { name: 'In 1 month' }).click();
  await sheet.getByRole('button', { name: /^Seal until/ }).click();

  const sealed = page.getByRole('button', { name: /Sealed: To me, next month, 30 days to go/ });
  await expect(sealed).toBeDisabled();
  await expect(page.getByText('Did you keep going?')).toHaveCount(0);

  await page.clock.setFixedTime(new Date('2026-12-05T09:00:00+08:00'));
  await page.reload();
  await page.getByRole('button', { name: /^Open: To me, next month/ }).click();
  await expect(dialog(page, 'To me, next month').getByText('Did you keep going?')).toBeVisible();
  await dialog(page, 'To me, next month').getByRole('button', { name: 'Keep it' }).click();
  await expect(page.getByRole('button', { name: /^Open: To me, next month/ })).toContainText('Read');
});

test('oracle: a prediction comes due, gets called, and is scored', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-04T09:00:00+08:00') });
  await page.goto('/base/oracle');
  await page.getByRole('button', { name: '+ New prediction' }).click();
  const sheet = dialog(page, 'New prediction');
  await sheet.getByLabel('I think that…').fill('I clear JOI round two');
  await sheet.getByRole('group', { name: 'How sure' }).getByRole('button', { name: '90%' }).click();
  await sheet.getByLabel('We’ll know by').fill('2026-11-29');
  await sheet.getByRole('button', { name: 'Write it down' }).click();
  await expect(page.getByRole('heading', { name: 'Waiting on the future' })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Call it early: I clear JOI round two' }).getByRole('button', { name: 'Won’t happen' })).toBeVisible();

  await page.clock.setFixedTime(new Date('2026-11-30T09:00:00+08:00'));
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Time to call these' })).toBeVisible();
  await page.getByRole('button', { name: 'It didn’t' }).click();
  await expect(page.getByText(/4 more resolved/)).toBeVisible();
  await expect(page.locator('.i-meter').filter({ hasText: 'Brier' })).toContainText('0.81');
});

test('armoury: shoes wear down by logged kilometres, and replacing them starts again', async ({ page }) => {
  await page.goto('/base/armoury');
  await page.getByRole('button', { name: '+ Add to the rack' }).click();
  const sheet = dialog(page, 'Add to the rack');
  await sheet.getByLabel('Name it').fill('Pegasus');
  await sheet.getByLabel(/already done then/).fill('100');
  await sheet.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('.hq-gear')).toContainText('100 km of 700 km');

  await page.getByRole('button', { name: 'Log something' }).click();
  await dialog(page, 'Command').getByLabel('Type what you did, or filter commands').fill('ran 10k in 50');
  await dialog(page, 'Command').getByRole('button', { name: 'Log it' }).click();
  await page.getByRole('dialog', { name: 'What you earned' }).getByRole('button', { name: 'OK' }).click();
  await expect(page.locator('.hq-gear')).toContainText('110 km of 700 km');

  await page.getByRole('button', { name: 'Replaced', exact: true }).click();
  await page.getByRole('button', { name: 'Replaced it' }).click();
  await expect(page.locator('.hq-gear')).toContainText('0 km of 700 km');
  await expect(page.locator('.hq-gear')).toContainText('Before: Pegasus, 110 km');
});

test('infirmary: tap a knee, a sore one warns the next move, healing clears it', async ({ page }) => {
  await page.goto('/base/infirmary');
  await page.getByRole('button', { name: 'Left knee', exact: true }).click();
  const sheet = dialog(page, 'Where does it hurt?');
  await sheet.getByRole('group', { name: 'How bad' }).getByRole('button', { name: 'Sore' }).click();
  await sheet.getByLabel('When does it hurt?').fill('Going downstairs');
  await sheet.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('button', { name: 'Left knee, sore' })).toBeVisible();
  await page.locator('.i-row').filter({ hasText: 'Going downstairs' }).click();
  await dialog(page, 'Left knee').getByRole('button', { name: 'It’s healed' }).click();
  await expect(page.getByRole('heading', { name: 'Healed' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Left knee', exact: true })).toBeVisible();
});

test('lab: a self-experiment can be started and deleted', async ({ page }) => {
  await page.goto('/base/lab');
  await page.getByRole('button', { name: 'Bed before 23:00' }).click();
  const sheet = dialog(page, 'New self-experiment');
  await sheet.getByRole('group', { name: 'What to watch' }).getByRole('button', { name: 'Inner weather' }).click();
  await sheet.getByRole('button', { name: 'Start it' }).click();
  await expect(page.locator('.i-row').filter({ hasText: 'Bed before 23:00' })).toContainText('day 1 of 14');
  await page.getByRole('button', { name: 'Delete experiment: Bed before 23:00' }).click();
  await expect(page.locator('.i-row').filter({ hasText: 'Bed before 23:00' })).toHaveCount(0);
});

test('observatory: more time a day brings the dates closer', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Log something' }).click();
  await dialog(page, 'Command').getByLabel('Type what you did, or filter commands').fill('violin 60');
  await dialog(page, 'Command').getByRole('button', { name: 'Log it' }).click();
  await page.getByRole('dialog', { name: 'What you earned' }).getByRole('button', { name: 'OK' }).click();
  await page.goto('/base/observatory');
  await expect(page.locator('.hq-sooner')).toHaveCount(0);
  await page.getByLabel('Extra minutes a day of Violin').fill('30');
  await expect(page.getByText('+30')).toBeVisible();
  await expect(page.locator('.hq-sooner').first()).toBeVisible();
});

test('practice room: tools are on the page and a tempo ladder climbs', async ({ page }) => {
  await page.goto('/violin');
  await page.getByRole('button', { name: /Practice room/ }).click();
  await expect(page).toHaveURL(/\/violin\/room$/);
  await page.getByRole('button', { name: '4 beats a minute faster' }).click();
  await expect(page.locator('.pr-bpm b')).toHaveText('76');
  await page.getByRole('main').getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByRole('main').getByRole('button', { name: 'Stop', exact: true }).click();

  await page.getByRole('button', { name: '+ New' }).click();
  const sheet = dialog(page, 'New tempo ladder');
  await sheet.getByLabel('Which passage?').fill('Bach bars 17-32');
  await sheet.getByLabel('Performance tempo (BPM)').fill('100');
  await sheet.getByRole('button', { name: 'Save' }).click();
  const ladder = page.locator('.pr-ladder');
  await ladder.getByRole('button', { name: 'Set metronome to 60' }).click();
  await expect(page.locator('.pr-bpm b')).toHaveText('60');
  await ladder.getByRole('button', { name: 'Clean at 60' }).click();
  await expect(ladder).toContainText('Clean at 60 of 100 BPM');
  await expect(ladder.getByRole('button', { name: 'Clean at 62' })).toBeVisible();
  await expect(page.locator('.pr-bpm b')).toHaveText('62');

  await page.getByRole('group', { name: 'Tool' }).getByRole('button', { name: 'Tuner' }).click();
  await expect(page.getByText('Uses the microphone while it’s on')).toBeVisible();
  await page.getByRole('group', { name: 'Tool' }).getByRole('button', { name: 'Drone' }).click();
  await page.getByRole('group', { name: 'Drone note' }).getByRole('button', { name: 'D', exact: true }).click();
  await page.getByRole('group', { name: 'Drone note' }).getByRole('button', { name: 'D', exact: true }).click();
});

test('focus: a parked thought becomes a task when the session ends', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Focus mode/ }).click();
  await dialog(page, '集中 · Focus mode').getByRole('button', { name: 'Start focus' }).click();
  const running = dialog(page, '集中 · Study focus');
  await running.getByLabel('Park a stray thought').fill('Email the luthier');
  await running.getByRole('button', { name: 'Park' }).click();
  await expect(running.getByRole('list', { name: 'Parked thoughts' })).toContainText('Email the luthier');
  await running.getByRole('group', { name: 'Sound' }).getByRole('button', { name: 'Brown noise' }).click();
  await running.getByRole('group', { name: 'Sound' }).getByRole('button', { name: 'Silence' }).click();
  await running.getByRole('button', { name: 'Finish and log' }).click();
  await dialog(page, 'CH05 · log study').getByRole('button', { name: /close/i }).click();
  await page.goto('/tasks');
  await expect(page.getByText('Email the luthier')).toBeVisible();
});

test('sleep: tonight’s bedtime moves for tomorrow’s first event', async ({ page }) => {
  await page.goto('/sleep');
  const row = page.locator('.s-tonight__row');
  await expect(row).toContainText('In bed by');
  const before = await row.innerText();
  await page.goto('/calendar');
  await page.getByRole('button', { name: 'Event' }).click();
  const sheet = dialog(page, 'New event');
  await sheet.getByLabel('Title').fill('Early rehearsal');
  const tomorrow = await page.evaluate(async () => {
    const { ltToday } = await import('/src/data/lt.ts');
    const { addDays } = await import('/src/domain/log/dates.ts');
    return addDays(ltToday(), 1);
  });
  await sheet.getByLabel('Day', { exact: true }).fill(tomorrow);
  await sheet.getByRole('textbox', { name: 'Start time' }).fill('06:00');
  await sheet.getByRole('button', { name: 'Add to calendar' }).click();
  await page.goto('/sleep');
  await expect(page.getByText(/Early rehearsal at 06:00/)).toBeVisible();
  expect(await row.innerText()).not.toBe(before);
});

test('run window: says plainly when the forecast fails, and shows real windows when it loads', async ({ page }) => {
  await page.route('https://geocoding-api.open-meteo.com/**', (r) => r.fulfill({ json: { results: [{ name: 'Singapore', country: 'Singapore', latitude: 1.29, longitude: 103.85 }] } }));
  let fail = true;
  await page.route('https://api.open-meteo.com/**', (r) => {
    if (fail) return r.fulfill({ status: 500, body: '' });
    const time: string[] = [];
    for (const d of [0, 1, 2]) {
      const day = new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);
      for (let h = 0; h < 24; h++) time.push(`${day}T${String(h).padStart(2, '0')}:00`);
    }
    return r.fulfill({ json: { utc_offset_seconds: 0, hourly: { time, apparent_temperature: time.map(() => 12), precipitation_probability: time.map(() => 0), wind_speed_10m: time.map(() => 5), is_day: time.map(() => 1) } } });
  });
  await page.goto('/sports');
  await page.getByRole('button', { name: 'Choose your city' }).click();
  const sheet = dialog(page, 'Where do you run?');
  await sheet.getByLabel('Your city').fill('Singapore');
  await sheet.getByRole('button', { name: 'Search' }).click();
  await sheet.getByRole('button', { name: /Singapore/ }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Couldn’t reach the forecast' })).toBeVisible();
  fail = false;
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByText(/Forecast from Open-Meteo for Singapore/)).toBeVisible();
  await expect(page.getByRole('button', { name: /^Block / }).first()).toBeVisible();
});
