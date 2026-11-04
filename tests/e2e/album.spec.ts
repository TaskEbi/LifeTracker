import { expect, test } from '@playwright/test';
import { deflateSync } from 'node:zlib';

/** A small solid-colour PNG, made here so the test needs no image files. */
function png(w: number, h: number, [r, g, b]: [number, number, number]): Buffer {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf: Buffer) => {
    let c = 0xffffffff;
    for (const x of buf) c = crcTable[(c ^ x) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, body: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(body.length);
    const tb = Buffer.concat([Buffer.from(type), body]);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(tb));
    return Buffer.concat([len, tb, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: w }, () => [r, g, b]).flat())]);
  const raw = Buffer.concat(Array.from({ length: h }, () => row));
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

test('album: a face and memories for today, a caption and a cover, the contact sheet and the sealed reel', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-04T09:00:00+09:00'));
  await page.goto('/album');
  await expect(page.getByRole('heading', { level: 1, name: 'Album' })).toBeVisible();

  // the face: no camera in the test browser, so the camera screen offers the phone's own picker
  await page.getByRole('button', { name: /Take today’s face/ }).click();
  const cam = page.getByRole('dialog', { name: 'Today’s face' });
  await expect(cam.getByRole('button', { name: 'Use the phone’s camera' })).toBeVisible();
  await cam.getByLabel('Choose today’s face from your photos').setInputFiles({ name: 'face.png', mimeType: 'image/png', buffer: png(90, 120, [220, 170, 140]) });
  await expect(cam).toBeHidden();
  await expect(page.getByText('Today’s face is on film')).toBeVisible();
  await expect(page.getByRole('button', { name: /^Face, / })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retake' })).toBeVisible();

  // one memory opens its sheet for a caption
  await page.getByLabel('Choose memories').setInputFiles({ name: 'a.png', mimeType: 'image/png', buffer: png(120, 90, [40, 120, 200]) });
  const sheet = page.getByRole('dialog', { name: 'New memory' });
  await sheet.getByLabel('What it was (optional)').fill('Sunset from the bridge');
  await sheet.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('button', { name: 'Memory 1: Sunset from the bridge' })).toBeVisible();

  // two more at once; the second becomes the day's cover
  await page.getByLabel('Choose memories').setInputFiles([
    { name: 'b.png', mimeType: 'image/png', buffer: png(120, 90, [200, 80, 60]) },
    { name: 'c.png', mimeType: 'image/png', buffer: png(120, 90, [60, 180, 90]) },
  ]);
  await expect(page.getByText('2 memories added')).toBeVisible();
  await expect(page.getByRole('list', { name: /^Memories, / }).getByRole('listitem')).toHaveCount(4); // three prints and the add slot
  await page.getByRole('button', { name: 'Memory 2' }).click();
  await page.getByRole('dialog', { name: 'Memory' }).getByRole('button', { name: '☆ Make it the day’s cover' }).click();
  await page.getByRole('dialog', { name: 'Memory' }).getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('button', { name: 'Memory 2 (cover)' })).toBeVisible();

  // delete one, then undo
  await page.getByRole('button', { name: 'Memory 3' }).click();
  await page.getByRole('dialog', { name: 'Memory' }).getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByRole('button', { name: /^Memory 3/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByRole('button', { name: 'Memory 3' })).toBeVisible();

  // it survives a reload (kept in this browser)
  await page.reload();
  await expect(page.getByRole('button', { name: 'Memory 1: Sunset from the bridge' })).toBeVisible();
  await expect(page.getByText('Local only: photos stay in this browser')).toBeVisible();

  // the contact sheet has today
  await page.getByRole('navigation', { name: 'Album' }).getByRole('button', { name: /Contact sheet/ }).click();
  await expect(page.getByRole('button', { name: 'Wed 4 Nov, face, 3 memories' })).toBeVisible();
  await page.getByRole('button', { name: 'Wed 4 Nov, face, 3 memories' }).click();
  await expect(page.getByRole('heading', { name: /Today/ })).toBeVisible();

  // the reel is sealed until 31 Dec, but a labelled sneak peek plays
  await page.getByRole('navigation', { name: 'Album' }).getByRole('button', { name: /Reel/ }).click();
  await expect(page.getByRole('heading', { name: 'Sealed until 31 December' })).toBeVisible();
  await page.getByRole('button', { name: 'Sneak peek at the year so far' }).click();
  const reel = page.getByRole('dialog', { name: '2026 reel' });
  await expect(reel.getByText('Sneak peek · the year so far')).toBeVisible();
  await reel.getByRole('button', { name: 'Close the reel' }).click();
  await expect(reel).toBeHidden();
});

test('album: the reel opens on New Year’s Eve, and a past day can be filled in', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-12-31T20:00:00+09:00'));
  await page.goto('/album/day/2026-12-30');
  await expect(page.getByRole('heading', { name: /Yesterday/ })).toBeVisible();
  await page.getByLabel('Choose memories').setInputFiles({ name: 'a.png', mimeType: 'image/png', buffer: png(120, 90, [40, 120, 200]) });
  await page.getByRole('dialog', { name: 'New memory' }).getByRole('button', { name: 'Save' }).click();
  await page.goto('/album/reel');
  await expect(page.getByRole('heading', { name: 'The 2026 reel' })).toBeVisible();
  await page.getByRole('button', { name: '▶ Play the reel' }).click();
  const reel = page.getByRole('dialog', { name: '2026 reel' });
  await expect(reel.getByText('a year on film')).toBeVisible();
  await expect(reel.getByText('Sneak peek · the year so far')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(reel).toBeHidden();
  // a future day can't be opened
  await page.goto('/album/day/2027-01-05');
  await expect(page.getByRole('heading', { name: /Today/ })).toBeVisible();
});
