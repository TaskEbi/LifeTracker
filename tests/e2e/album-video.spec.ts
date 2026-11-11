import { expect, test } from '@playwright/test';

// WebKit on Windows plays no video at all, so this file runs in Chromium (still at iPhone size).
test.use({ browserName: 'chromium' });

test('album: a short video as a memory: its still and length, playing it, a caption, reload and delete', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-11T09:00:00+09:00'));
  await page.goto('/album');
  await expect(page.getByRole('heading', { level: 1, name: 'Album' })).toBeVisible();
  await expect(page.getByText('Photos or short videos (up to 60 seconds)')).toBeVisible();

  // a two-second clip, recorded here so the test needs no video files
  const b64 = await page.evaluate(async () => {
    const c = document.createElement('canvas');
    c.width = 160;
    c.height = 120;
    const ctx = c.getContext('2d')!;
    const rec = new MediaRecorder(c.captureStream(15), { mimeType: 'video/webm;codecs=vp8' });
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => chunks.push(e.data);
    const done = new Promise((r) => (rec.onstop = r));
    rec.start();
    const t0 = performance.now();
    while (performance.now() - t0 < 2000) {
      ctx.fillStyle = `hsl(${(performance.now() - t0) / 8} 70% 50%)`;
      ctx.fillRect(0, 0, 160, 120);
      await new Promise((r) => requestAnimationFrame(r));
    }
    rec.stop();
    await done;
    const buf = new Uint8Array(await new Blob(chunks).arrayBuffer());
    let s = '';
    for (const x of buf) s += String.fromCharCode(x);
    return btoa(s);
  });

  await page.getByLabel('Choose memories').setInputFiles({ name: 'sunset.webm', mimeType: 'video/webm', buffer: Buffer.from(b64, 'base64') });
  const sheet = page.getByRole('dialog', { name: 'New video' });
  await expect(sheet.locator('video')).toBeVisible();
  await expect(sheet.locator('video')).toHaveAttribute('poster', /^data:image\//);
  expect(await sheet.locator('video').evaluate((v: HTMLVideoElement) => new Promise((r) => (v.readyState >= 1 ? r(v.duration) : (v.onloadedmetadata = () => r(v.duration)))))).toBeGreaterThan(1);
  await sheet.getByLabel('What it was (optional)').fill('The waves');
  await sheet.getByRole('button', { name: 'Save' }).click();

  const print = page.getByRole('button', { name: /^Memory 1, video 0:0\d: The waves$/ });
  await expect(print).toBeVisible();
  await expect(print.getByText(/▶ 0:0\d/)).toBeVisible();
  await expect(print.locator('img')).toHaveAttribute('src', /^data:image\//);

  // kept in this browser across a reload, and it still plays
  await page.reload();
  await page.getByRole('button', { name: /^Memory 1, video/ }).click();
  const again = page.getByRole('dialog', { name: 'Video' });
  await expect(again.locator('video')).toBeVisible();
  await again.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText('Video removed')).toBeVisible();
  await expect(page.getByRole('button', { name: /^Memory 1/ })).toHaveCount(0);
});
