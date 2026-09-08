import { chromium } from 'playwright';
const BASE = 'https://127.0.0.1:8797';
const ROUTES = ['/today','/habits','/habits/new','/quit','/quit/new','/training','/training/library',
  '/mood','/focus','/focus/history','/programs','/body','/nutrition','/street','/progress','/report',
  '/planner','/steps','/profile','/settings','/more','/terms','/privacy'];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
for (const width of [430, 1440]) {
  const ctx = await b.newContext({ ignoreHTTPSErrors: true, viewport: { width, height: 900 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await p.evaluate(() => fetch('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'demo@winterwork.test', password: 'Passw0rd!demo' }) }));
  console.log(`\n=== ${width}px ===`);
  let dead = 0;
  for (const route of ROUTES) {
    await p.goto(BASE + route, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(700);
    const url = p.url().replace(BASE, '');
    const nav = await p.locator('.ww-nav, .side-nav').count();
    const back = await p.locator('.ww-back').count();
    const ok = nav > 0 || back > 0;
    if (!ok) dead++;
    console.log(`${route.padEnd(20)} -> ${url.padEnd(20)} nav:${nav} back:${back} ${ok ? '' : '  *** NO WAY OUT ***'}`);
  }
  // the world switch must be gone
  const worlds = await p.locator('.ww-world-tab, .side-nav-world').count();
  const tabs = await p.locator('.ww-nav-tab, .side-nav-item').count();
  console.log(`dead ends: ${dead} | world switches left: ${worlds} | tabs: ${tabs} | page errors: ${errs.length}`);
  if (errs.length) console.log(errs.slice(0, 3));
  await ctx.close();
}
await b.close(); process.exit(0);
