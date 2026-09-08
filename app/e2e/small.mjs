import { chromium } from 'playwright';
const BASE = 'https://127.0.0.1:8797';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const ctx = await b.newContext({ ignoreHTTPSErrors: true, viewport: { width: 430, height: 932 } });
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
await p.evaluate(() => fetch('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: 'demo@winterwork.test', password: 'Passw0rd!demo' }) }));

// every number field must ask for a numeric keyboard
for (const route of ['/body', '/nutrition', '/steps', '/quit/new', '/habits/new']) {
  await p.goto(BASE + route, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(800);
  const fields = await p.$$eval('input[type=number]', (els) => els.map((e) => e.getAttribute('inputmode')));
  console.log(route.padEnd(14), 'number fields:', fields.length, '| inputmode:', fields.join(',') || '—');
}

// nothing under 44px
await p.goto(BASE + '/sign-in', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(700);
const tiny = await p.evaluate(() =>
  [...document.querySelectorAll('button, a[href], select, input')]
    .map((e) => ({ tag: e.className || e.tagName, r: e.getBoundingClientRect() }))
    .filter((x) => x.r.width > 0 && x.r.height > 0 && x.r.height < 44)
    .map((x) => `${x.tag} ${Math.round(x.r.width)}x${Math.round(x.r.height)}`)
);
console.log('sign-in controls under 44px (paint):', tiny);

// mood can be corrected the same day
await p.goto(BASE + '/mood', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(900);
const hadCard = await p.locator('.mood-today-set').count();
if (hadCard) {
  await p.click('.mood-today-set');
  await p.waitForTimeout(400);
  console.log('mood card tapped -> picker back:', await p.locator('.mood-picker').count() > 0);
} else {
  await p.locator('.mood-picker-btn').first().click();
  await p.waitForTimeout(1200);
  await p.click('.mood-today-set');
  await p.waitForTimeout(400);
  console.log('after logging, picker reopens:', await p.locator('.mood-picker').count() > 0);
}
await b.close(); process.exit(0);
