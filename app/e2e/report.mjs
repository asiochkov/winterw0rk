import { chromium } from 'playwright';
const BASE = 'https://127.0.0.1:8797';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const ctx = await b.newContext({ ignoreHTTPSErrors: true, viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await p.evaluate(() => fetch('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: 'demo@winterwork.test', password: 'Passw0rd!demo' }) }));

// The regression test the criteria ask for: the same overview data through
// the new screen must produce the same rows the old block produced.
const raw = await p.evaluate(() => fetch('/api/progress/overview').then((r) => r.json()));
console.log('server report:', JSON.stringify(raw.report));

await p.goto(BASE + '/progress', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(1300);
await p.click('text=Got it').catch(() => {});
const linkText = await p.locator('.pr-report-link').innerText().catch(() => 'NO LINK');
console.log('progress entry point:', linkText.replace(/\n/g, ' | '));
await p.locator('.pr-report-link').click();
await p.waitForTimeout(1200);
console.log('url:', p.url());
const rows = await p.$$eval('.pr-report-row', (els) =>
  els.map((e) => ({
    dim: e.querySelector('.pr-report-dim')?.textContent,
    before: e.querySelector('.pr-report-before')?.textContent,
    now: e.querySelector('.pr-report-now')?.textContent,
    delta: e.querySelector('.pr-report-delta')?.textContent,
  }))
);
console.log('rows on the new screen:');
for (const r of rows) console.log('  ', r.dim, '|', r.before, '->', r.now, '|', r.delta);
await p.screenshot({ path: '/tmp/claude-0/report.png', fullPage: true });
console.log('back control:', await p.locator('.ww-back').count());
await b.close(); process.exit(0);
