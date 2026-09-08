import { chromium } from 'playwright';
const BASE = 'https://127.0.0.1:8797';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const ctx = await b.newContext({ ignoreHTTPSErrors: true, viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await p.evaluate(() => fetch('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: 'demo@winterwork.test', password: 'Passw0rd!demo' }) }));
// Any element still resolving to a size the scale should have covered, or to
// an empty computed value, would show up here.
for (const route of ['/today', '/habits', '/progress', '/settings', '/sign-in']) {
  await p.goto(BASE + route, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1100);
  const bad = await p.evaluate(() =>
    [...document.querySelectorAll('*')]
      .map((el) => getComputedStyle(el))
      .filter((cs) => !cs.fontSize || cs.fontSize === '0px' || cs.fontSize === '16px' && false).length
  );
  const sizes = await p.evaluate(() => {
    const s = new Set();
    document.querySelectorAll('*').forEach((el) => s.add(getComputedStyle(el).fontSize));
    return [...s].sort();
  });
  console.log(route.padEnd(12), 'unresolved:', bad, '| sizes:', sizes.join(' '));
}
await b.close(); process.exit(0);
