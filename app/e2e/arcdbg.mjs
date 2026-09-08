import { chromium } from 'playwright';
const BASE = 'https://127.0.0.1:8797';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const ctx = await b.newContext({ ignoreHTTPSErrors: true, viewport: { width: 430, height: 932 } });
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await p.evaluate(() => fetch('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: 'demo@winterwork.test', password: 'Passw0rd!demo' }) }));
const r = await p.evaluate(async () => {
  const res = await fetch('/api/account/arc/restart', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  return { status: res.status, body: await res.text() };
});
console.log('POST /account/arc/restart ->', r.status, r.body.slice(0, 200));
await b.close(); process.exit(0);
