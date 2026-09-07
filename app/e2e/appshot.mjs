/**
 * Screenshots one route of the running app, signed in as the seeded demo
 * account. Pairs with prototype-screen.mjs for side-by-side comparison.
 *
 *   node appshot.mjs /today /tmp/today.png
 *
 * Needs the production server behind the TLS proxy (session cookies are
 * Secure); see CONTINUE.md.
 */
import { chromium } from 'playwright';

const BASE = process.env.APP_URL || 'https://127.0.0.1:8797';
const route = process.argv[2] || '/today';
const out = process.argv[3] || 'app.png';

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const ctx = await b.newContext({ ignoreHTTPSErrors: true, viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('PAGEERROR', e.message));

await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await p.evaluate(() =>
  fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'demo@winterwork.test', password: 'Passw0rd!demo' }),
  })
);
await p.goto(BASE + route, { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(2000);
await p.click('text=Got it').catch(() => {});
await p.waitForTimeout(400);
await p.screenshot({ path: out, fullPage: true });
console.log(route, '->', out);

await b.close();
process.exit(0);
