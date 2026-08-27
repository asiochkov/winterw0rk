/**
 * Screenshots one app route at the three widths v7 switches on, so a nav or
 * layout change can be checked at all of them at once.
 *
 * v7's breakpoints: mobile below 760 (bottom bar), tablet to 1179 (icon-only
 * rail), desktop from 1180 (rail with labels).
 *
 *   node widths.mjs /today
 *
 * Writes /tmp/cmp/nav-{mobile,tablet,desktop}.png. Needs the production
 * server behind the TLS proxy; see CONTINUE.md.
 */
import { chromium } from 'playwright';
const BASE = 'https://127.0.0.1:8797';
const route = process.argv[2] || '/today';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
for (const [w, h, name] of [[430, 932, 'mobile'], [900, 1000, 'tablet'], [1440, 1000, 'desktop']]) {
  const ctx = await b.newContext({ ignoreHTTPSErrors: true, viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await p.evaluate(() => fetch('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'demo@winterwork.test', password: 'Passw0rd!demo' }) }));
  await p.goto(BASE + route, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1600);
  await p.click('text=Got it').catch(() => {});
  await p.waitForTimeout(300);
  await p.screenshot({ path: `/tmp/cmp/nav-${name}.png` });
  console.log(name, w + 'x' + h);
  await ctx.close();
}
await b.close(); process.exit(0);
