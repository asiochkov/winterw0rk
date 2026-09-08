import { chromium } from 'playwright';
const BASE = 'https://127.0.0.1:8797';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const ctx = await b.newContext({ ignoreHTTPSErrors: true, viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await p.evaluate(() => fetch('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: 'demo@winterwork.test', password: 'Passw0rd!demo' }) }));
await p.goto(BASE + '/today', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(1600);
console.log('day 92 lands on:', p.url());
await p.click('text=Got it').catch(() => {});
await p.waitForTimeout(300);
console.log('title:', await p.locator('.rep-title').innerText().catch(() => 'none'));
await p.screenshot({ path: '/tmp/claude-0/arc-complete.png', fullPage: true });

// Declining must mean declining: back to Today, and it must not fire again.
await p.click('text=/Not yet|Пока нет/');
await p.waitForTimeout(1200);
console.log('after declining:', p.url());
await p.goto(BASE + '/today', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(1500);
console.log('revisiting Today:', p.url(), '(must stay on /today)');

// Starting the next arc re-anchors the counter.
await p.goto(BASE + '/arc-complete', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(1200);
await p.click('text=/Start the next arc|Начать новую арку/');
await p.waitForTimeout(1500);
const me = await p.evaluate(() => fetch('/api/auth/me').then((r) => r.json()));
console.log('after starting the next arc:', p.url(), 'arcStartDate =', me.user.arcStartDate);
await b.close(); process.exit(0);
