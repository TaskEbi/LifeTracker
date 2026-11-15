// node tools/botsheet.mjs <reg> <out.png> [query e.g. "theme=light&only=tanuki&cols=3"]
import { chromium } from '@playwright/test';
const [reg, out, extra = ''] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e)));
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
await p.goto(`http://localhost:5199/tools/botsheet.html?reg=${reg}&${extra}`);
await p.waitForSelector('#sheet > div', { timeout: 30000 }).catch(() => errs.push('nothing rendered'));
await p.waitForTimeout(400);
await (await p.$('#sheet')).screenshot({ path: out });
if (errs.length) console.log('ERRORS', errs.join('\n'));
await b.close();
console.log('wrote', out);
