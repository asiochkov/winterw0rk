import { chromium } from 'playwright';
const BASE = 'https://127.0.0.1:8797';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const ctx = await b.newContext({ ignoreHTTPSErrors: true, viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
const email = `bk${Date.now()}@test.com`;
await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
const ids = await p.evaluate(async (email) => {
  await fetch('/api/auth/signup', { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123', name: 'T', acceptedTerms: true, acceptedPrivacy: true, confirmedAge: true }) });
  await fetch('/api/auth/onboarding', { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ goal: 'body', areas: ['Sleep'], habits: [{ name: 'Workout', category: 'TRAINING', type: 'bool', schedule: [0,1,2,3,4,5,6] }] }) });
  const q = await (await fetch('/api/quit', { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ kind: 'Smoking', unitCost: 10, dailyAmount: 1 }) })).json();
  const h = await (await fetch('/api/habits')).json();
  return { quit: q.counter?.id, habit: h.habits?.[0]?.id };
}, email);
console.log('seeded', ids);

for (const route of ['/settings', '/steps', '/street', '/profile', `/quit/${ids.quit}`, `/habits/${ids.habit}`, '/terms', '/training/library', '/focus/history', '/programs']) {
  await p.goto(BASE + route, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(900);
  const box = await p.locator('.ww-back').first().boundingBox().catch(() => null);
  const nav = await p.locator('.ww-nav, .bottom-nav, nav').count();
  console.log(route.padEnd(18), box ? `back ${Math.round(box.width)}x${Math.round(box.height)}` : 'NO BACK', ' navEls:', nav);
}
await p.goto(BASE + `/quit/${ids.quit}`, { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(900);
await p.screenshot({ path: '/tmp/claude-0/back-hero.png' });
await p.locator('.ww-back').first().click();
await p.waitForTimeout(800);
console.log('quit hero back ->', p.url());
await b.close(); process.exit(0);
